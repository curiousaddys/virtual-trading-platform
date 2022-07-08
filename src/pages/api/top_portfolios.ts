import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import type { TopPortfolio } from '../../db/portfolioHistory'
import { getTopPortfolios } from '../../db/portfolioHistory'
import type { ErrResp } from '../../utils/errors'
import { getErrorDetails } from '../../utils/errors'

const QuerySchema = z.object({
  limit: z.preprocess((a) => parseInt(z.string().parse(a)), z.number()),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TopPortfolio[] | ErrResp>
) {
  try {
    const { limit } = QuerySchema.parse(req.query)
    const portfolios = await getTopPortfolios(limit)
    res.status(200).json(portfolios)
  } catch (err) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
