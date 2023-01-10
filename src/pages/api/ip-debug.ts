import type { NextApiRequest, NextApiResponse } from 'next'

const getClientIp = (req: NextApiRequest) => {
  if (!req.headers) {
    return null
  }
  // If proxied behind Cloudflare, this will be the user's original IP.
  const cloudflareConnectingIp = req.headers['cf-connecting-ip']
  // Else, this header will be the user's original IP if connecting directly via Vercel.
  const vercelRealIp = req.headers['x-real-ip']
  return cloudflareConnectingIp ?? vercelRealIp ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientIp = getClientIp(req)
  res
    .status(200)
    .send(JSON.stringify({ clientIp, headers: req.headers, test: req.rawHeaders }, undefined, 2))
}
