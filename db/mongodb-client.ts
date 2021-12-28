import { ClientSession, MongoClient } from 'mongodb'
import { config } from '../utils/config'

let client: MongoClient | null = null
let session: ClientSession | null = null

export const getMongoDB = async () => {
  if (!client) {
    client = await new MongoClient(
      config.MONGO_URI,
      config.MONGO_OPTIONS
    ).connect()
  }
  // Using a session prevents cursor ID errors.
  // See: https://jira.mongodb.org/browse/NODE-3521
  if (!session) {
    session = client.startSession()
  }
  const db = client.db()
  return { db, session }
}
