import { getMongoDB } from './client'
import { ObjectId } from 'mongodb'

export interface Account {
  _id: ObjectId
  address: string
  nickname: string
  joined: Date
  lastLogin: Date
  defaultPortfolioID: ObjectId
}

const getAccountsCollection = async () => {
  const { client, db } = await getMongoDB()
  const collection = db.collection<Account>('accounts')
  await collection.createIndex({ address: 1 })
  return { client, collection }
}

export const findOrInsertAccount = async (address: string) => {
  const { collection } = await getAccountsCollection()
  const result = await collection.findOneAndUpdate(
    { address },
    {
      // Create user in database and fund initial portfolio.
      $setOnInsert: {
        address,
        nickname: 'Anonymous User',
        joined: new Date(),
        defaultPortfolioID: new ObjectId(), // really more of an "active" portfolio ID
      },
      $set: {
        lastLogin: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  )
  if (!result.value) {
    throw new Error('failed to find or insert account')
  }
  return result.value
}

export const updateAccount = async (address: string, account: Partial<Account>) => {
  const { collection } = await getAccountsCollection()
  const result = await collection.findOneAndUpdate(
    { address },
    {
      $set: account,
    },
    { returnDocument: 'after' }
  )
  if (!result.value) {
    throw new Error('failed to update account')
  }
  return result.value
}
