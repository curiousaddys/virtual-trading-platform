import { NextApiRequest, NextApiResponse } from 'next'
import { Account, findOrInsertAccount, updatePortfolio } from '../../db/accounts'
import { auth } from '../../utils/auth'
import { getErrorDetails } from '../../utils/errors'
import { z } from 'zod'
import { SUPPORTED_COINS } from '../../utils/constants'
import { ObjectID } from 'bson'
import { deleteTransaction, insertTransaction } from '../../db/transactions'
import got from 'got'
import { GeckoDetails } from '../../api/CoinGecko/coin'
import { BuySellAction } from '../../components/BuySellModal'

const QuerySchema = z.object({
  portfolioID: z.string(),
  coin: z.enum(SUPPORTED_COINS),
  transactInUSD: z.preprocess((a) => a === 'true', z.boolean()),
  amountUSD: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number()),
  amountCoin: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number()),
  action: z.nativeEnum(BuySellAction),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Account | { error: string }>
) {
  try {
    const { address } = auth(req)
    const { portfolioID, coin, transactInUSD, amountUSD, amountCoin, action } = QuerySchema.parse(
      req.query
    )

    // get current exchange rate by hitting api endpoint since vercel should be caching it
    const currentCoinDetails = await got
      .get(`http://${req.headers.host}/api/coin_details?coin=${coin}`)
      .json<GeckoDetails>()
    const exchangeRate = currentCoinDetails.market_data.current_price.usd

    // Calculate the actual values to use here based on current market data
    // and whether the user requested to transact in USD or coin denomination.
    const calculatedAmountCoin = transactInUSD ? amountUSD / exchangeRate : amountCoin
    const calculatedAmountUSD = transactInUSD ? amountUSD : exchangeRate * amountCoin

    const account = await findOrInsertAccount(address)
    const portfolio = account.portfolios.find(
      (portfolio) => portfolio._id.toString() === portfolioID
    )
    if (!portfolio) {
      return res.status(400).json({ error: 'portfolio not found' })
    }

    if (action === BuySellAction.Buy) {
      const balanceUSD =
        portfolio.holdings.find((holding) => holding.currency === 'USD')?.amount ?? 0
      if (balanceUSD < calculatedAmountUSD) {
        return res.status(400).json({ error: 'not enough funds' })
      }
    }

    if (action === BuySellAction.Sell) {
      const balanceCoin =
        portfolio.holdings.find((holding) => holding.currency === coin)?.amount ?? 0
      if (calculatedAmountCoin > balanceCoin) {
        return res.status(400).json({ error: 'not enough coin' })
      }
    }

    // TODO: maybe create a db transaction here, if mongo supports it, so it's easier to rollback?
    const transactionID = await insertTransaction({
      _id: new ObjectID(),
      accountID: account._id,
      action,
      currency: coin,
      exchangeRateUSD: exchangeRate,
      portfolioID: new ObjectID(portfolioID),
      timestamp: new Date(),
      amountUSD: calculatedAmountUSD,
    })

    updatePortfolio(
      // TODO: make interface to hold params to make this easier to read
      account._id,
      portfolio,
      coin,
      action === BuySellAction.Buy ? calculatedAmountCoin : -calculatedAmountCoin,
      action === BuySellAction.Buy ? calculatedAmountUSD : -calculatedAmountUSD
    )
      .then((newAccountInfo) => {
        res.status(200).json(newAccountInfo!)
      })
      .catch(async (err) => {
        console.error(err)
        await deleteTransaction(transactionID)
        // TODO: handle errors better and give more specific error message
        return res
          .status(500)
          .json({ error: 'failed to update portfolio. maybe the price changed?' })
      })
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
