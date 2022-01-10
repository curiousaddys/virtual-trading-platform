import { withIronSessionApiRoute } from 'iron-session/next'
import { NextApiRequest, NextApiResponse } from 'next'
import { sessionOptions } from '../../../utils/config'

export default withIronSessionApiRoute(handler, sessionOptions)

function handler(req: NextApiRequest, res: NextApiResponse<null>) {
  req.session.destroy()
  res.status(200).json(null)
}
