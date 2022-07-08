import type { NextApiRequest, NextApiResponse } from 'next'
import { withIronSessionApiRoute } from 'iron-session/next'
import { ethers } from 'ethers'
import { SIGNATURE_TEXT } from '../../../utils/constants'
import { z } from 'zod'
import { sessionOptions } from '../../../utils/config'
import { findOrInsertAccount } from '../../../db/accounts'
import type { ErrResp } from '../../../utils/errors'
import { getErrorDetails } from '../../../utils/errors'
import { findOrInsertPortfolio } from '../../../db/portfolios'
import type { AccountWithPortfolio } from '../account'

const QuerySchema = z.object({
  address: z.string().nonempty(),
  signature: z.string().nonempty(),
})

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse<AccountWithPortfolio | ErrResp>) {
  const { address, signature } = QuerySchema.parse(req.query)

  // verify signature
  try {
    ethers.utils.verifyMessage(SIGNATURE_TEXT + address, signature)
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized: invalid signature' })
  }

  try {
    // get (or create) account from database
    const account = (await findOrInsertAccount(address)) as AccountWithPortfolio
    account.portfolio = await findOrInsertPortfolio(account.defaultPortfolioID, account._id)

    // set session cookie
    req.session.account = { _id: account._id, address: account.address }
    await req.session.save()

    // return full account details w/ portfolio
    return res.status(200).json(account)
  } catch (err) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
