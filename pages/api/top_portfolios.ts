import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { getErrorDetails } from '../../utils/errors'
import { getTopPortfolios, TopPortfolio } from '../../db/portfolioHistory'

const QuerySchema = z.object({
  limit: z.preprocess((a) => parseInt(z.string().parse(a)), z.number()),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TopPortfolio[] | { error: string }>
) {
  try {
    const { limit } = QuerySchema.parse(req.query)
    const portfolios = await getTopPortfolios(limit)
    res.status(200).json(portfolios)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
