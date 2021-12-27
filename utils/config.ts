// TODO(jh): Once using multiple env variables, the error should specify *all* that are missing.
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
