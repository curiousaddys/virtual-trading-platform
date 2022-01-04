import { NextApiRequest, NextApiResponse } from 'next'
import { findOrInsertAccount } from '../../db/accounts'
import { auth } from '../../utils/auth'
import { getErrorDetails } from '../../utils/errors'
import { PortfolioBalance } from '../../db/portfolioHistory'
import { getPortfolioBalanceHistory } from '../../db/portfolioBalance'
import { z } from 'zod'

const QuerySchema = z.object({
  days: z.enum(['1', '7', '30', '365', 'max']).default('7'),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PortfolioBalance[] | { error: string }>
) {
  try {
    const { address } = auth(req)
    const { days } = QuerySchema.parse(req.query)
    const account = await findOrInsertAccount(address)
    // TODO: add param for portfolio ID
    const portfolioID = account.portfolios[0]._id
    const results = await getPortfolioBalanceHistory(portfolioID, days)
    // TODO: only return timestamps & balance
    res.status(200).json(results)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
