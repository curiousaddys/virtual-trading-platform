import type { NextApiRequest, NextApiResponse } from 'next'
import { Account, findOrInsertAccount, updateAccount } from '../../db/accounts'
import { getErrorDetails } from '../../utils/errors'
import { auth } from '../../utils/auth'
import { z } from 'zod'
//@ts-ignore
import * as WordFilter from 'bad-words'

const PostQuerySchema = z.object({
  nickname: z.string().nonempty(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Account | { error: string }>
) {
  try {
    const { address } = auth(req)
    switch (req.method) {
      case 'GET':
        const account = await findOrInsertAccount(address)
        return res.status(200).json(account)
      case 'POST':
        const { nickname } = PostQuerySchema.parse(req.query)
        const filter = new WordFilter()
        if (filter.isProfane(nickname)) {
          return res.status(400).json({ error: 'nickname not allowed' })
        }
        const updatedAccount = await updateAccount(address, { nickname })
        return res.status(200).json(updatedAccount)
    }
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
