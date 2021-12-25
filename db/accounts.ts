import { getMongoDB } from './mongodb-client'
import { ObjectID } from 'bson'

export interface Account {
  _id: ObjectID
  address: string
  nickname: string
  lastSeen: number
}

const getAccountsCollection = async () => {
  const db = await getMongoDB()
  return db.collection<Account>('accounts')
}

// TODO: refactor this keeping in mind that we should not call it until signature is verified
export const findOrInsertAccount = async (address: string) => {
  const collection = await getAccountsCollection()
  const result = await collection.findOneAndUpdate(
    { address },
    {
      $setOnInsert: {
        address,
        nickname: 'Anonymous User',
        lastSeen: Date.now(),
        // TODO: create & fund initial portfolio here
      },
    },
    { upsert: true, returnDocument: 'after' }
  )
  return result.value!
}
