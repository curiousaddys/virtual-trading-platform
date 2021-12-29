import { NextApiRequest, NextApiResponse } from 'next'
import {
  Account,
  findOrInsertAccount,
  updatePortfolio,
} from '../../db/accounts'
import { auth } from '../../utils/auth'
import { getErrorDetails } from '../../utils/errors'
import { z } from 'zod'
import { SUPPORTED_COINS } from '../../utils/constants'
import { ObjectID } from 'bson'
import { deleteTransaction, insertTransaction } from '../../db/transactions'
import got from 'got'
import Details from '../details'
import { GeckoDetails } from '../../api/CoinGecko/coin'

const QuerySchema = z.object({
  portfolioID: z.string(),
  coin: z.enum(SUPPORTED_COINS),
  amountUSD: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number()),
  action: z.enum(['buy', 'sell']),
})

type QuerySchema = z.infer<typeof QuerySchema>

const buy = async (
  { portfolioID, coin, amountUSD, action }: QuerySchema,
  address: string,
  exchangeRate: number
) => {
  const account = await findOrInsertAccount(address)
  const portfolio = account.portfolios.find(
    (portfolio) => portfolio._id.toString() === portfolioID
  )
  if (!portfolio) throw 'portfolio not found'
  const balanceUSD =
    portfolio.holdings.find((holding) => holding.currency === 'USD')?.amount ??
    0
  if (balanceUSD < amountUSD) throw 'not enough funds'

  const transactionID = await insertTransaction({
    _id: new ObjectID(),
    accountID: account._id,
    action: 'buy',
    currency: coin,
    exchangeRateUSD: exchangeRate,
    portfolioID: new ObjectID(portfolioID),
    timestamp: Date.now(),
    amountUSD: amountUSD,
  })
  const amountOfCoin = amountUSD / exchangeRate
  try {
    // update portfolio
    return await updatePortfolio(
      // TODO: make interface to hold params to make this easier to read
      account._id,
      new ObjectID(portfolioID),
      coin,
      amountOfCoin,
      amountUSD
    )
  } catch (err) {
    // delete transaction if portfolio update failed
    await deleteTransaction(transactionID)
    throw 'failed to update portfolio'
  }
}

const sell = async (
  { portfolioID, coin, amountUSD, action }: QuerySchema,
  address: string,
  exchangeRate: number
) => {
  // TODO: maybe we can just use same as "buy" but flip the positives to negatives? (but also need to ensure the holdings exist)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Account | { error: string }>
) {
  try {
    const { address } = auth(req)
    const options = QuerySchema.parse(req.query)

    // get current exchange rate by hitting api endpoint since vercel should be caching it
    const currentCoinDetails = await got
      .get(
        `http://${req.headers.host}/api/details?coin=${options.coin}` // TODO: ensure this forwards to https in prod
      )
      .json<GeckoDetails>()
    const exchangeRate = currentCoinDetails.market_data.current_price.usd

    switch (options.action) {
      case 'buy':
        const newAccountInfo = await buy(options, address, exchangeRate)
        res.status(200).json(newAccountInfo!)
        break
      case 'sell':
        // TODO: implement sell function
        //newAccountInfo = await sell(options, address, exchangeRate)
        break
      default:
        res.status(400).json({ error: 'buy or sell action not specified' })
    }
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
