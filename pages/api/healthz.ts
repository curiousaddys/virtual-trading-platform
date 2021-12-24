import type { NextApiRequest, NextApiResponse } from 'next'
import { getMongoDB } from '../../db/mongodb-client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ status: string }>
) {
  try {
    const db = await getMongoDB()
    await db.command({ ping: 1 })
    res.status(200).json({ status: 'ok' })
  } catch (err) {
    res.status(500).json({ status: 'db offline' })
  }
}
