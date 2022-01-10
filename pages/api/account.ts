import type { NextApiRequest, NextApiResponse } from 'next'
import { Account, findOrInsertAccount, updateAccount } from '../../db/accounts'
import { ErrResp, getErrorDetails } from '../../utils/errors'
import { z } from 'zod'
//@ts-ignore
import * as WordFilter from 'bad-words'
import { sessionOptions } from '../../utils/config'
import { withIronSessionApiRoute } from 'iron-session/next'
import { auth } from '../../utils/auth'

const isNameAllowed = (name: any) => {
  const filter = new WordFilter()
  return !filter.isProfane(name)
}

const PostQuerySchema = z.object({
  nickname: z.intersection(
    z.custom(isNameAllowed, { message: 'not allowed' }),
    z.string().nonempty()
  ),
})

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse<Account | ErrResp>) {
  try {
    const { address } = auth(req)
    switch (req.method) {
      case 'GET':
        const account = await findOrInsertAccount(address)
        return res.status(200).json(account)
      case 'POST':
        const { nickname } = PostQuerySchema.parse(req.query)
        const updatedAccount = await updateAccount(address, { nickname })
        return res.status(200).json(updatedAccount)
    }
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
