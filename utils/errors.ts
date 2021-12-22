import { ZodError } from 'zod'

export const getErrorDetails = (
  err: any
): { status: number; message: string } => {
  console.error(err)
  if (err instanceof ZodError) {
    // TODO(jh): list all errors instead of just the 1st one
    return { status: 400, message: err.issues[0].message }
  }
  return { status: 500, message: 'unknown server error' }
}
