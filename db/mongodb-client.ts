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
  return client.db()
}
