import { NextApiRequest, NextApiResponse } from 'next'
import { findOrInsertAccount } from '../../db/accounts'
import { auth } from '../../utils/auth'
import { getErrorDetails } from '../../utils/errors'
import { getPortfolioBalanceHistory, PortfolioBalance } from '../../db/portfolioHistory'
import { z } from 'zod'

const QuerySchema = z.object({
  days: z.enum(['1', '7', '30', '365', 'max']).default('7'),
})

export type PortfolioBalanceHistoryResp = Pick<PortfolioBalance, 'timestamp' | 'balanceUSD'>[]

// Removes the fields that are not needed in the API response.
const stripFields = (arr: PortfolioBalance[]): PortfolioBalanceHistoryResp => {
  return arr.map((x) => ({
    timestamp: x.timestamp,
    balanceUSD: x.balanceUSD,
  }))
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PortfolioBalanceHistoryResp | { error: string }>
) {
  try {
    const { address } = auth(req)
    const { days } = QuerySchema.parse(req.query)
    const account = await findOrInsertAccount(address)
    // TODO: add param for portfolio ID
    const portfolioID = account.portfolios[0]._id
    const results = await getPortfolioBalanceHistory(portfolioID, days)
    res.status(200).json(stripFields(results))
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
