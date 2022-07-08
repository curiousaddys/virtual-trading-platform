import { NextApiRequest, NextApiResponse } from 'next'
import { findOrInsertAccount } from '../../db/accounts'
import { auth } from '../../utils/auth'
import { ErrResp, getErrorDetails } from '../../utils/errors'
import { getPortfolioBalanceHistory, PortfolioBalance } from '../../db/portfolioHistory'
import { z } from 'zod'
import { DateRangeValue } from '../../components/common/DateRangePicker'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../utils/config'

const QuerySchema = z.object({
  days: z.nativeEnum(DateRangeValue).default(DateRangeValue.SevenDays),
})

export type PortfolioBalanceHistoryResp = Pick<PortfolioBalance, 'timestamp' | 'balanceUSD'>[]

// Removes the fields that are not needed in the API response.
const stripFields = (arr: PortfolioBalance[]): PortfolioBalanceHistoryResp => {
  return arr.map((x) => ({
    timestamp: x.timestamp,
    balanceUSD: x.balanceUSD,
  }))
}

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PortfolioBalanceHistoryResp | ErrResp>
) {
  try {
    const { address } = auth(req)
    const { days } = QuerySchema.parse(req.query)
    const account = await findOrInsertAccount(address)
    const results = await getPortfolioBalanceHistory(account.defaultPortfolioID, days)
    res.status(200).json(stripFields(results))
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
