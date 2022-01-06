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
} as const
