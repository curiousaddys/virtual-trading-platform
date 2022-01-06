import type { NextApiRequest, NextApiResponse } from 'next'
import { SUPPORTED_COINS } from '../../utils/constants'
import { z } from 'zod'
import { getErrorDetails } from '../../utils/errors'
import { getTransactions, Transaction } from '../../db/transactions'
import { ObjectID } from 'bson'
import { auth } from '../../utils/auth'
import { findPortfoliosByAddress } from '../../db/accounts'

const QuerySchema = z.object({
  coin: z.enum(SUPPORTED_COINS),
  portfolioID: z.string().transform((p) => new ObjectID(p)),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Transaction[] | { error: string }>
) {
  try {
    const { address } = auth(req)
    const { coin, portfolioID } = QuerySchema.parse(req.query)

    // confirm ownership
    const portfolios = await findPortfoliosByAddress(address)
    const matchedPortfolio = portfolios.find(
      (portfolio) => portfolio._id.toString() === portfolioID.toString()
    )
    if (!matchedPortfolio) {
      return res.status(401).json({ error: 'portfolio is not owned by you' })
    }

    const data = await getTransactions(portfolioID, coin)
    // TODO(jh): consider filtering this data (removing redundant information) to improve loading time
    res.status(200).json(data)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
