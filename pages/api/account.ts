import type { NextApiRequest, NextApiResponse } from 'next'
import { Account, findOrInsertAccount } from '../../db/accounts'
import { getErrorDetails } from '../../utils/errors'
import { auth } from '../../utils/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Account | { error: string }>
) {
  try {
    const { address } = auth(req)
    const account = await findOrInsertAccount(address)
    res.status(200).json(account)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
