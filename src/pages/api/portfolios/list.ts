import { withIronSessionApiRoute } from 'iron-session/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Portfolio } from '../../../db/portfolios'
import { findPortfoliosByAccount } from '../../../db/portfolios'
import { auth } from '../../../utils/auth'
import { sessionOptions } from '../../../utils/config'
import type { ErrResp } from '../../../utils/errors'
import { getErrorDetails } from '../../../utils/errors'

export default withIronSessionApiRoute(handler, sessionOptions)

// Lists all portfolios for the auth'd user.
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Portfolio[] | Portfolio | ErrResp>
) {
  try {
    const { _id } = auth(req)
    const portfolios = await findPortfoliosByAccount(_id)
    return res.status(200).json(portfolios)
  } catch (err) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
