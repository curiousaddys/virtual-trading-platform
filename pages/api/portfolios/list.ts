import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../utils/config'
import { NextApiRequest, NextApiResponse } from 'next'
import { findPortfoliosByAccount, Portfolio } from '../../../db/portfolios'
import { ErrResp, getErrorDetails } from '../../../utils/errors'
import { auth } from '../../../utils/auth'
<<<<<<< HEAD
import { ObjectId } from 'mongodb'
=======
import { ObjectID } from 'bson'
>>>>>>> bbbf331 (support multiple portfolios per user)

export default withIronSessionApiRoute(handler, sessionOptions)

// Lists all portfolios for the auth'd user.
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Portfolio[] | Portfolio | ErrResp>
) {
  try {
    const { _id } = auth(req)
<<<<<<< HEAD
    const portfolios = await findPortfoliosByAccount(new ObjectId(_id))
=======
    const portfolios = await findPortfoliosByAccount(new ObjectID(_id))
>>>>>>> bbbf331 (support multiple portfolios per user)
    return res.status(200).json(portfolios)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
