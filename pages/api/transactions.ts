import type { NextApiRequest, NextApiResponse } from 'next'
import { SUPPORTED_COINS } from '../../utils/constants'
import { z } from 'zod'
import { ErrResp, getErrorDetails } from '../../utils/errors'
import { getTransactions, Transaction } from '../../db/transactions'
import { auth } from '../../utils/auth'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../utils/config'
import { ObjectId } from 'mongodb'

const QuerySchema = z.object({
  coin: z.enum(SUPPORTED_COINS),
  portfolioID: z
    .string()
    .nonempty()
    .transform((val) => new ObjectId(val)),
})

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse<Transaction[] | ErrResp>) {
  try {
    const { _id } = auth(req)
    const { coin, portfolioID } = QuerySchema.parse(req.query)

    const data = await getTransactions(_id, portfolioID, coin)

    // TODO(jh): consider filtering this data (removing redundant information) to improve loading time
    res.status(200).json(data)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
