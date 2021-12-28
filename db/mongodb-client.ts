import { MongoClient } from 'mongodb'
import { config } from '../utils/config'

let client: MongoClient | null = null

export const getMongoDB = async () => {
  if (!client) {
    client = await new MongoClient(
      config.MONGO_URI,
      config.MONGO_OPTIONS
    ).connect()
  }
  const session = client.startSession()
  const db = client.db()
  return { db, session }
}
