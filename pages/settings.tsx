import { NextPage } from 'next'
import React, { FormEventHandler, useEffect, useState } from 'react'
import { useAccountContext } from '../hooks/useAccount'
import { toast } from 'react-toastify'
import dayjs from 'dayjs'
import ky from 'ky'
import { Account } from '../db/accounts'
import { PageWrapper } from '../components/common/PageWrapper'

const Settings: NextPage = () => {
  const { accountInfo, setAccountInfo, accountError, isLoaded } = useAccountContext()
  const [nickname, setNickname] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (!accountInfo) return
    setNickname(accountInfo.nickname)
  }, [accountInfo])

  useEffect(() => {
    if (!accountError) return
    console.error(accountError)
    toast('Error loading account info!', { type: 'error' })
  }, [accountError])

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    ky.post('/api/account', { searchParams: { nickname } })
      .json<Account>()
      .then((data) => {
        setAccountInfo((prev) => ({ ...data, portfolio: prev!.portfolio }))
        toast('Account updated!', { type: 'success' })
      })
      .catch((err) => {
        err.response
          .json()
          .then((error: { error: string }) => {
            console.error(error.error)
            toast(`Error updating account: ${error.error}.`, { type: 'error' })
          })
          .catch((error: any) => {
            console.error(error)
            toast(`Error updating account: unknown error.`, { type: 'error' })
          })
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <PageWrapper title="User Settings">
      {!isLoaded ? (
        <div className="mb-3">Loading...</div>
      ) : !accountInfo ? (
        <div className="mb-3">
          You must connect your MetaMask wallet in order to access this page.
        </div>
      ) : (
        <>
          <h2 className="text-2xl text-gray-800 font-semibold ml-1">Settings</h2>
          <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-3 mb-6">
            <form className="w-full max-w-sm" onSubmit={handleSubmit}>
              <label className="block text-gray-700 text-sm font-bold" htmlFor="username">
                Nickname
              </label>
              <div className="mb-2 text-xs">This will be visible to other users.</div>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-3"
                type="text"
                aria-label="nickname"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                }}
              />

              {/*TODO: add some options to select a portfolio or create a new one*/}

              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                Join Date
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                aria-label="nickname"
                value={dayjs(accountInfo.joined).format('YYYY-MM-DD')}
                disabled
              />

              <button
                className="mt-5 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
                disabled={isSubmitting}
              >
                Save
              </button>
            </form>
          </section>
        </>
      )}
    </PageWrapper>
  )
}

export default Settings
