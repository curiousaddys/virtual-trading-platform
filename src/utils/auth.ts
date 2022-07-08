import type { NextApiRequest } from 'next'
import { config } from './config'
import { ObjectId } from 'mongodb'

export class UnauthorizedError extends Error {}

interface AuthedAccount {
  _id: ObjectId
  address: string
}

// This is where we specify the typings of req.session.*
declare module 'iron-session' {
  interface IronSessionData {
    account: AuthedAccount
  }
}

export const auth = (req: NextApiRequest): AuthedAccount => {
  const account = req.session.account
  if (!account) {
    throw new UnauthorizedError()
  }
  // We must parse the account ID here as a new ObjectId to ensure it's actually an ObjectId.
  return { _id: new ObjectId(account._id), address: account.address }
}

export const cloudflareWorkerAuth = (req: NextApiRequest): void => {
  if (req.headers['x-auth-token'] !== config.CLOUDFLARE_SECRET) {
    throw new UnauthorizedError()
  }
}
