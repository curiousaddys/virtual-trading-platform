import { getMongoDB } from './mongodb-client'
import { ObjectID } from 'bson'
import { INITIAL_PORTFOLIO_FUND_AMOUNT } from '../utils/constants'

export interface Account {
  _id: ObjectID
  address: string
  nickname: string
  joined: number
  lastLogin: number
  portfolios: Portfolio[]
}

export interface Portfolio {
  _id: ObjectID
  name: string
  holdings: Holding[]
}

export interface Holding {
  currency: string
  amount: number // TODO(jh): confirm this will store numbers w/ enough precision
}

const getAccountsCollection = async () => {
  const db = await getMongoDB()
  return db.collection<Account>('accounts')
}

export const findOrInsertAccount = async (address: string) => {
  const collection = await getAccountsCollection()
  const result = await collection.findOneAndUpdate(
    { address },
    {
      // Create user in database and fund initial portfolio.
      $setOnInsert: {
        address,
        nickname: 'Anonymous User', // TODO: allow user to change nickname
        joined: Date.now(),
        portfolios: [
          {
            _id: new ObjectID(),
            name: 'main', // TODO: allow user to set portfolio name
            holdings: [
              {
                currency: 'USD',
                amount: INITIAL_PORTFOLIO_FUND_AMOUNT,
              },
            ],
          },
        ],
      },
      $set: {
        lastLogin: Date.now(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  )
  return result.value!
}
