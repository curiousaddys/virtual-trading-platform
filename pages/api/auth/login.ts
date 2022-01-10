import { NextApiRequest, NextApiResponse } from 'next'
import { withIronSessionApiRoute } from 'iron-session/next'
import { ethers } from 'ethers'
import { SIGNATURE_TEXT } from '../../../utils/constants'
import { z } from 'zod'
import { sessionOptions } from '../../../utils/config'
import { Account, findOrInsertAccount } from '../../../db/accounts'
import { ErrResp, getErrorDetails } from '../../../utils/errors'

const QuerySchema = z.object({
  address: z.string().nonempty(),
  signature: z.string().nonempty(),
})

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse<Account | ErrResp>) {
  const { address, signature } = QuerySchema.parse(req.query)

  // verify signature
  try {
    ethers.utils.verifyMessage(SIGNATURE_TEXT + address, signature)
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized: invalid signature' })
  }

  try {
    // get (or create) account from database
    const account = await findOrInsertAccount(address)

    // set session cookie
    req.session.account = { _id: account._id, address: account.address }
    await req.session.save()

    // return full account details
    return res.status(200).json(account)
  } catch (err) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
