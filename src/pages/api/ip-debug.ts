import type { NextApiRequest, NextApiResponse } from 'next'
import { getClientIp } from 'request-ip'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientIp = getClientIp(req)
  res.status(200).send(JSON.stringify({ clientIp, headers: req.headers }, undefined, 2))
}
