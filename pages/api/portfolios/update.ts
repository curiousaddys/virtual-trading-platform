<<<<<<< HEAD
import { nonProfaneString } from '../account'
=======
import { isNameAllowed } from '../account'
>>>>>>> bbbf331 (support multiple portfolios per user)
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../utils/config'
import { NextApiRequest, NextApiResponse } from 'next'
import { Portfolio, updatePortfolioName } from '../../../db/portfolios'
import { ErrResp, getErrorDetails } from '../../../utils/errors'
import { auth } from '../../../utils/auth'
import { z } from 'zod'
<<<<<<< HEAD
import { ObjectId } from 'mongodb'

const PostQuerySchema = z.object({
  portfolioID: z.string().nonempty(),
  portfolioName: nonProfaneString,
=======
import { ObjectID } from 'bson'

const PostQuerySchema = z.object({
  portfolioID: z.string().nonempty(),
  portfolioName: z.intersection(
    z.custom<string>(isNameAllowed, { message: 'not allowed' }),
    z.string().nonempty()
  ),
>>>>>>> bbbf331 (support multiple portfolios per user)
})

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse<Portfolio | ErrResp>) {
  try {
    const { _id } = auth(req)
    const { portfolioID, portfolioName } = PostQuerySchema.parse(req.query)
    const portfolio = await updatePortfolioName(
<<<<<<< HEAD
      new ObjectId(portfolioID),
      new ObjectId(_id),
=======
      new ObjectID(portfolioID),
      new ObjectID(_id),
>>>>>>> bbbf331 (support multiple portfolios per user)
      portfolioName
    )
    return res.status(200).json(portfolio)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
