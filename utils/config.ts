import { IronSessionOptions } from 'iron-session'
import { IRON_SESSION_COOKIE } from './constants'
import { Account } from '../db/accounts'

// TODO(jh): The error should specify *all* that are missing instead of just the first one.
const mustGetEnv = (key: string) => {
  const value = process.env[key]
  if (!value) {
    const err = `Missing required environment variable: ${key}`
    console.error(err)
    throw err
  }
  return value
}

export const config = {
  MONGO_URI: mustGetEnv('MONGO_URI'),
  MONGO_OPTIONS: {},
  CLOUDFLARE_SECRET: mustGetEnv('CLOUDFLARE_SECRET'),
  IRON_SESSION_SECRET: mustGetEnv('IRON_SESSION_SECRET'),
  IS_PROD: process.env.NODE_ENV === 'production',
} as const

export const sessionOptions: IronSessionOptions = {
  password: config.IRON_SESSION_SECRET,
  cookieName: IRON_SESSION_COOKIE,
  cookieOptions: {
    secure: config.IS_PROD,
  },
}
