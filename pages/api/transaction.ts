import { NextApiRequest, NextApiResponse } from 'next'
import { auth } from '../../utils/auth'
import { ErrResp, getErrorDetails } from '../../utils/errors'
import { z } from 'zod'
import { SUPPORTED_COINS } from '../../utils/constants'
<<<<<<< HEAD
import { ObjectId } from 'mongodb'
import { deleteTransaction, insertTransaction } from '../../db/transactions'
=======
import { ObjectID } from 'bson'
import { insertTransaction } from '../../db/transactions'
>>>>>>> b05acaa (use db transactions for buying/selling)
import got from 'got'
import { GeckoDetails } from '../../api/CoinGecko/coin'
import { BuySellAction } from '../../components/BuySellModal'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../utils/config'
import { findPortfolioByID, Portfolio, updatePortfolioBalance } from '../../db/portfolios'
import { getMongoDB } from '../../db/client'

const QuerySchema = z.object({
  portfolioID: z.string(),
  coin: z.enum(SUPPORTED_COINS),
  transactInUSD: z.preprocess((a) => a === 'true', z.boolean()),
  amountUSD: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number()),
  amountCoin: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number()),
  action: z.nativeEnum(BuySellAction),
})

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse<Portfolio | ErrResp>) {
  try {
    const { _id } = auth(req)
    const { portfolioID, coin, transactInUSD, amountUSD, amountCoin, action } = QuerySchema.parse(
      req.query
    )

    // get current exchange rate by hitting api endpoint since vercel is probably already caching it
    const currentCoinDetails = await got
      .get(`http://${req.headers.host}/api/coin_details?coin=${coin}`)
      .json<GeckoDetails>()
    const exchangeRate = currentCoinDetails.market_data.current_price.usd

    // Calculate the actual values to use here based on current market data
    // and whether the user requested to transact in USD or coin denomination.
    const calculatedAmountCoin = transactInUSD ? amountUSD / exchangeRate : amountCoin
    const calculatedAmountUSD = transactInUSD ? amountUSD : exchangeRate * amountCoin

    const portfolio = await findPortfolioByID(new ObjectId(_id), new ObjectId(portfolioID))

    if (action === BuySellAction.Buy) {
      const balanceUSD =
        portfolio.holdings.find((holding) => holding.currency === 'USD')?.amount ?? 0
      if (balanceUSD < calculatedAmountUSD) {
        return res.status(400).json({ error: 'insufficient funds (not enough USD)' })
      }
    }

    if (action === BuySellAction.Sell) {
      const balanceCoin =
        portfolio.holdings.find((holding) => holding.currency === coin)?.amount ?? 0
      if (calculatedAmountCoin > balanceCoin) {
        return res.status(400).json({ error: `insufficient funds (not enough ${coin})` })
      }
    }

<<<<<<< HEAD
    // TODO: maybe create a db transaction here, if mongo supports it, so it's easier to rollback?
    const transactionID = await insertTransaction({
      _id: new ObjectId(),
      accountID: new ObjectId(_id.toString()),
      action,
      currency: coin,
      exchangeRateUSD: exchangeRate,
      portfolioID: portfolio._id,
      timestamp: new Date(),
      amountUSD: calculatedAmountUSD,
      amountCoin: calculatedAmountCoin,
    })

    await updatePortfolioBalance(
      // TODO: make interface to hold params to make this easier to read
      new ObjectId(_id),
      portfolio,
      coin,
      action === BuySellAction.Buy ? calculatedAmountCoin : -calculatedAmountCoin,
      action === BuySellAction.Buy ? calculatedAmountUSD : -calculatedAmountUSD
    )
      .then((newPortfolioInfo) => {
        res.status(200).json(newPortfolioInfo)
      })
      .catch(async (err) => {
        console.error(err)
        await deleteTransaction(transactionID)
        return res.status(500).json({ error: 'failure to update portfolio (database error)' })
      })
=======
    // Start a session for a db transaction.
    const { client } = await getMongoDB()
    const session = client.startSession()

    await session.withTransaction(async () => {
      await insertTransaction(
        {
          _id: new ObjectID(),
          accountID: new ObjectID(_id.toString()),
          action,
          currency: coin,
          exchangeRateUSD: exchangeRate,
          portfolioID: portfolio._id,
          timestamp: new Date(),
          amountUSD: calculatedAmountUSD,
          amountCoin: calculatedAmountCoin,
        },
        session
      )
      const updatedPortfolio = await updatePortfolioBalance(
        {
          accountID: new ObjectID(_id),
          portfolio,
          currency: coin,
          amount: action === BuySellAction.Buy ? calculatedAmountCoin : -calculatedAmountCoin,
          costUSD: action === BuySellAction.Buy ? calculatedAmountUSD : -calculatedAmountUSD,
        },
        session
      )
      // TODO: Double check that doing this inside of the transaction won't lead to any issues.
      res.status(200).json(updatedPortfolio)
    })
    await session.endSession()
>>>>>>> b05acaa (use db transactions for buying/selling)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
