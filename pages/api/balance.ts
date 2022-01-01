import { NextApiRequest, NextApiResponse } from 'next'
import { findOrInsertAccount } from '../../db/accounts'
import { auth } from '../../utils/auth'
import { getErrorDetails } from '../../utils/errors'
import { PortfolioBalance } from '../../db/portfolioHistory'
import { getPortfolioBalanceHistory } from '../../db/portfolioBalance'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PortfolioBalance[] | { error: string }>
) {
  // TODO: add params to choose portfolio ID and time range (today, this week, 30 days, 365 days, all)
  try {
    const { address } = auth(req)
    const account = await findOrInsertAccount(address)
    const portfolioID = account.portfolios[0]._id
    const results = await getPortfolioBalanceHistory(portfolioID)
    // TODO: only return timestamps & balance
    res.status(200).json(results)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
