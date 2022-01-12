import type { NextApiRequest, NextApiResponse } from 'next'
import { Account, findOrInsertAccount, updateAccount } from '../../db/accounts'
import { ErrResp, getErrorDetails } from '../../utils/errors'
import { z } from 'zod'
import BadWordsFilter from 'bad-words'
import { sessionOptions } from '../../utils/config'
import { withIronSessionApiRoute } from 'iron-session/next'
import { auth } from '../../utils/auth'
import { findOrInsertPortfolio, Portfolio } from '../../db/portfolios'
import { ObjectId } from 'mongodb'

export const isNameAllowed = (name: any) => {
  const filter = new BadWordsFilter()
  return !filter.isProfane(name)
}

const PostQuerySchema = z.object({
  nickname: z.intersection(
    z.custom<string>(isNameAllowed, { message: 'not allowed' }),
    z.string().nonempty()
  ),
  defaultPortfolioID: z.string().nonempty(),
})

export interface AccountWithPortfolio extends Account {
  portfolio: Portfolio
}

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse<AccountWithPortfolio | ErrResp>) {
  try {
    const { address } = auth(req)
    switch (req.method) {
      case 'GET':
        // TODO: only the /login handler should be using findOrInsertAccount.
        // This handler can just use a new db function: findAccountWithPortfolio
        // & use $lookup so only 1 trip needs to be made to the db.
        const account = (await findOrInsertAccount(address)) as AccountWithPortfolio
        account.portfolio = await findOrInsertPortfolio(account.defaultPortfolioID, account._id)
        return res.status(200).json(account)
      case 'POST':
        const { nickname, defaultPortfolioID } = PostQuerySchema.parse(req.query)
        const updatedAccount = (await updateAccount(address, {
          nickname,
          defaultPortfolioID: new ObjectId(defaultPortfolioID),
        })) as AccountWithPortfolio
        updatedAccount.portfolio = await findOrInsertPortfolio(
          updatedAccount.defaultPortfolioID,
          updatedAccount._id
        )
        return res.status(200).json(updatedAccount)
    }
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
