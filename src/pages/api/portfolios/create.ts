import { withIronSessionApiRoute } from 'iron-session/next'
import { ObjectId } from 'mongodb'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import type { Portfolio } from '../../../db/portfolios'
import { findOrInsertPortfolio } from '../../../db/portfolios'
import { auth } from '../../../utils/auth'
import { sessionOptions } from '../../../utils/config'
import type { ErrResp } from '../../../utils/errors'
import { getErrorDetails } from '../../../utils/errors'
import { nonProfaneString } from '../account'

const PostQuerySchema = z.object({
  portfolioName: nonProfaneString,
})

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse<Portfolio | ErrResp>) {
  try {
    const { _id } = auth(req)
    const { portfolioName } = PostQuerySchema.parse(req.query)
    const portfolio = await findOrInsertPortfolio(new ObjectId(), _id, portfolioName)
    return res.status(200).json(portfolio)
  } catch (err) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
