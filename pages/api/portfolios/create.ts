<<<<<<< HEAD
import { nonProfaneString } from '../account'
=======
import { isNameAllowed } from '../account'
>>>>>>> bbbf331 (support multiple portfolios per user)
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../utils/config'
import { NextApiRequest, NextApiResponse } from 'next'
import { findOrInsertPortfolio, Portfolio } from '../../../db/portfolios'
import { ErrResp, getErrorDetails } from '../../../utils/errors'
import { auth } from '../../../utils/auth'
import { z } from 'zod'
<<<<<<< HEAD
import { ObjectId } from 'mongodb'

const PostQuerySchema = z.object({
  portfolioName: nonProfaneString,
=======
import { ObjectID } from 'bson'

const PostQuerySchema = z.object({
  portfolioName: z.custom<string>(isNameAllowed, { message: 'not allowed' }).optional(),
>>>>>>> bbbf331 (support multiple portfolios per user)
})

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse<Portfolio | ErrResp>) {
  try {
    const { _id } = auth(req)
    const { portfolioName } = PostQuerySchema.parse(req.query)
<<<<<<< HEAD
    const portfolio = await findOrInsertPortfolio(new ObjectId(), new ObjectId(_id), portfolioName)
=======
    const portfolio = await findOrInsertPortfolio(new ObjectID(), new ObjectID(_id), portfolioName)
>>>>>>> bbbf331 (support multiple portfolios per user)
    return res.status(200).json(portfolio)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
