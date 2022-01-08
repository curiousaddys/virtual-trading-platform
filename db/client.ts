import { Db, MongoClient } from 'mongodb'
import { config } from '../utils/config'

let client: MongoClient | null = null
let db: Db | null = null

export const getMongoDB = async () => {
  if (!client) {
    client = await new MongoClient(config.MONGO_URI, config.MONGO_OPTIONS).connect()
    console.log('🔥 New DB Connection')
  }

  if (!db) {
    db = client.db()
  }

  return { client, db }
}
