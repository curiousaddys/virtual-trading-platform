import BadWordsFilter from 'bad-words'
import { withIronSessionApiRoute } from 'iron-session/next'
import { ObjectId } from 'mongodb'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import type { Account } from '../../db/accounts'
import { findOrInsertAccount, updateAccount } from '../../db/accounts'
import type { Portfolio } from '../../db/portfolios'
import { findOrInsertPortfolio } from '../../db/portfolios'
import { auth } from '../../utils/auth'
import { sessionOptions } from '../../utils/config'
import type { ErrResp } from '../../utils/errors'
import { getErrorDetails } from '../../utils/errors'

const badWordsFilter = new BadWordsFilter()

export const nonProfaneString = z
  .string()
  .refine((word) => !badWordsFilter.isProfane(word), 'no profanities allowed')

const PostQuerySchema = z.object({
  nickname: nonProfaneString.optional(),
  defaultPortfolioID: z
    .string()
    .nonempty()
    .transform((val) => new ObjectId(val)),
})

export interface AccountWithPortfolio extends Account {
  portfolio: Portfolio
}

export default withIronSessionApiRoute(handler, sessionOptions)

async function handler(req: NextApiRequest, res: NextApiResponse<AccountWithPortfolio | ErrResp>) {
  try {
    const { address } = auth(req)
    switch (req.method) {
      case 'GET': {
        // TODO: only the /login handler should be using findOrInsertAccount.
        // This handler can just use a new db function: findAccountWithPortfolio
        // & use $lookup so only 1 trip needs to be made to the db.
        const account = (await findOrInsertAccount(address)) as AccountWithPortfolio
        account.portfolio = await findOrInsertPortfolio(account.defaultPortfolioID, account._id)
        return res.status(200).json(account)
      }
      case 'POST': {
        const { nickname, defaultPortfolioID } = PostQuerySchema.parse(req.query)
        const updatedAccount = (await updateAccount(address, {
          nickname,
          defaultPortfolioID,
        })) as AccountWithPortfolio
        updatedAccount.portfolio = await findOrInsertPortfolio(
          updatedAccount.defaultPortfolioID,
          updatedAccount._id
        )
        return res.status(200).json(updatedAccount)
      }
      default: {
        return res.status(405).end()
      }
    }
  } catch (err) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
