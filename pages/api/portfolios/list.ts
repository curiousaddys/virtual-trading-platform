import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../utils/config'
import { NextApiRequest, NextApiResponse } from 'next'
import { findPortfoliosByAccount, Portfolio } from '../../../db/portfolios'
import { ErrResp, getErrorDetails } from '../../../utils/errors'
import { auth } from '../../../utils/auth'
import { ObjectID } from 'bson'

export default withIronSessionApiRoute(handler, sessionOptions)

// Lists all portfolios for the auth'd user.
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Portfolio[] | Portfolio | ErrResp>
) {
  try {
    const { _id } = auth(req)
    const portfolios = await findPortfoliosByAccount(new ObjectID(_id))
    return res.status(200).json(portfolios)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
