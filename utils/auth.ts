import { NextApiRequest } from 'next'
import { UnauthorizedError } from './errors'
import { ethers } from 'ethers'
import { SIGNATURE_TEXT } from './constants'
import { config } from './config'

interface AuthCookie {
  address: string
  signature: string
}

export const auth = (req: NextApiRequest): AuthCookie => {
  const cookie = req.cookies.catc_vtp_account
  if (!cookie) {
    throw new UnauthorizedError('cookie not found')
  }
  const account: AuthCookie = JSON.parse(cookie)

  try {
    ethers.utils.verifyMessage(
      SIGNATURE_TEXT + account.address,
      account.signature
    )
  } catch (err) {
    throw new UnauthorizedError('invalid signature')
  }

  return account
}

export const cloudflareWorkerAuth = (req: NextApiRequest): void => {
  const secret = req.headers['x-auth-token']
  if (secret !== config.CLOUDFLARE_SECRET) {
    throw new UnauthorizedError('invalid secret')
  }
}
