import { ClientSession, Db, MongoClient } from 'mongodb'
import { config } from '../utils/config'

let client: MongoClient | null = null
let db: Db | null = null
let session: ClientSession | null = null

export const getMongoDB = async () => {
  if (!client) {
    client = await new MongoClient(
      config.MONGO_URI,
      config.MONGO_OPTIONS
    ).connect()
    console.log('🔥 New DB Connection')
  }

  if (!db) {
    db = client.db()
  }

  // Using a session prevents cursor ID errors.
  // See: https://jira.mongodb.org/browse/NODE-3521
  if (!session) {
    session = client.startSession()
    console.log('🔥 New DB Session')
  }

  return { db, session }
}
