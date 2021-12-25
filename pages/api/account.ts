import type { NextApiRequest, NextApiResponse } from 'next'
import { Account, findOrInsertAccount } from '../../db/accounts'
import { z } from 'zod'
import { getErrorDetails } from '../../utils/errors'
import { ethers } from 'ethers'
import { signatureText } from '../../utils/constants'

// const QuerySchema = z.object({
//   address: z.string().min(1),
//   signature: z.string().min(1),
// })

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Account | { error: string } | 'TODO'>
) {
  try {
    // TODO(jh): move verification to middleware & read from cookie

    // const { address, signature } = QuerySchema.parse(req.query)
    // const account = await findOrInsertAccount(address)
    //
    // const verifiedAddress = ethers.utils.verifyMessage(
    //   signatureText + address,
    //   signature
    // )
    // if (address != verifiedAddress) {
    //   return res.status(401).json({ error: 'unauthorized' })
    // }

    // TODO: update account in db (verified, lastLoggedIn)

    res.status(200).json('TODO')
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
