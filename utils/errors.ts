import { ZodError } from 'zod'
import { BSONTypeError } from 'bson'
import { UnauthorizedError } from './auth'

export interface ErrResp {
  error: string
}

export const getErrorDetails = (err: any): { status: number; message: string } => {
  console.error(err)
  if (err instanceof UnauthorizedError) {
    return { status: 401, message: 'unauthorized' }
  }
  if (err instanceof ZodError) {
    // TODO(jh): list all errors instead of just the 1st one
    return { status: 400, message: `${err.issues[0].path[0]}: ${err.issues[0].message}` }
  }
  if (err instanceof BSONTypeError) {
    return { status: 400, message: err.message }
  }
  return { status: 500, message: 'unknown server error' }
}
