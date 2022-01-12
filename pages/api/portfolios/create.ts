import { isNameAllowed } from '../account'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../utils/config'
import { NextApiRequest, NextApiResponse } from 'next'
import { findOrInsertPortfolio, Portfolio } from '../../../db/portfolios'
import { ErrResp, getErrorDetails } from '../../../utils/errors'
import { auth } from '../../../utils/auth'
import { z } from 'zod'
import { ObjectID } from 'bson'

const PostQuerySchema = z.object({
  portfolioName: z.custom<string>(isNameAllowed, { message: 'not allowed' }).optional(),
})

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse<Portfolio | ErrResp>) {
  try {
    const { _id } = auth(req)
    const { portfolioName } = PostQuerySchema.parse(req.query)
    const portfolio = await findOrInsertPortfolio(new ObjectID(), new ObjectID(_id), portfolioName)
    return res.status(200).json(portfolio)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
