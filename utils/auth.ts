import { NextApiRequest } from 'next'
import { config } from './config'
import { Account } from '../db/accounts'

export class UnauthorizedError extends Error {}

type AuthedAccount = Pick<Account, '_id' | 'address'>

// This is where we specify the typings of req.session.*
declare module 'iron-session' {
  interface IronSessionData {
    account: AuthedAccount
  }
}

export const auth = (req: NextApiRequest): AuthedAccount => {
  if (!req.session.account) {
    throw new UnauthorizedError()
  }
  return req.session.account
}

export const cloudflareWorkerAuth = (req: NextApiRequest): void => {
  if (req.headers['x-auth-token'] !== config.CLOUDFLARE_SECRET) {
    throw new UnauthorizedError()
  }
}
