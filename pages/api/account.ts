import type { NextApiRequest, NextApiResponse } from 'next'
import { Account, findOrInsertAccount, updateAccount } from '../../db/accounts'
import { ErrResp, getErrorDetails } from '../../utils/errors'
import { z } from 'zod'
//@ts-ignore
import * as WordFilter from 'bad-words'
import { sessionOptions } from '../../utils/config'
import { withIronSessionApiRoute } from 'iron-session/next'
import { auth } from '../../utils/auth'
import { findOrInsertPortfolio, Portfolio } from '../../db/portfolios'

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

export interface AccountWithPortfolio extends Account {
  portfolio: Portfolio
}

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Account | AccountWithPortfolio | ErrResp>
) {
  try {
    const { address } = auth(req)
    switch (req.method) {
      case 'GET':
        // TODO: is this even really needed anywhere? maybe refactor update db calls to not need this first? or put more data in cookie?
        // TODO: maybe don't need portfolio here? maybe we only need it when logging in or after making a transaction?
        // TODO: we may actually need this, but just do an aggregating to return account w/ portfolio instead of 2 calls since no insert needed?
        const account = (await findOrInsertAccount(address)) as AccountWithPortfolio
        account.portfolio = await findOrInsertPortfolio(account.defaultPortfolioID, account._id)
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
