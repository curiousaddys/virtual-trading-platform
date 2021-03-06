import got from 'got'
import { withIronSessionApiRoute } from 'iron-session/next'
import { ObjectId } from 'mongodb'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import type { GeckoDetails } from '../../api/CoinGecko/coin'
import { getMongoDB } from '../../db/client'
import type { Portfolio } from '../../db/portfolios'
import { findPortfolioByID, updatePortfolioBalance } from '../../db/portfolios'
import { insertTransaction } from '../../db/transactions'
import { BuySellAction } from '../../hooks/useBuySellModal'
import { auth } from '../../utils/auth'
import { sessionOptions } from '../../utils/config'
import { SUPPORTED_COINS } from '../../utils/constants'
import type { ErrResp } from '../../utils/errors'
import { getErrorDetails } from '../../utils/errors'

const QuerySchema = z.object({
  portfolioID: z
    .string()
    .nonempty()
    .transform((val) => new ObjectId(val)),
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

    const portfolio = await findPortfolioByID(_id, portfolioID)

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

    // Start a session for a db transaction.
    const { client } = await getMongoDB()
    const session = client.startSession()

    await session.withTransaction(async () => {
      await insertTransaction(
        {
          _id: new ObjectId(),
          accountID: _id,
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
          accountID: _id,
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
  } catch (err) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
