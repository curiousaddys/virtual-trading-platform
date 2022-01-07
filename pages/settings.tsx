import { NextPage } from 'next'
import React, { FormEventHandler, useContext, useEffect, useState } from 'react'
import { UserContext } from '../hooks/useUser'
import { toast } from 'react-toastify'

const Settings: NextPage = () => {
  const { accountInfo, user, accountError } = useContext(UserContext)
  const [nickname, setNickname] = useState<string>('')

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
    console.log('form submitted')
    alert('Sorry, this feature is not yet implemented.')
    // TODO: submit to backend, then update the nickname in accountInfo in UserContext
  }

  return (
    <div className="container justify-center mx-auto my-10 px-2 sm:px-5 max-w-screen-lg">
      {/*TODO: improve loading message*/}
      {!user && <div>You must connect your MetaMask wallet in order to access this page.</div>}
      {user && !accountInfo && <div>Loading...</div>}
      {accountError && <div>Error loading account info. Please try again.</div>}
      {accountInfo && (
        <>
          <h2 className="text-2xl text-gray-800 font-semibold ml-1">Settings</h2>
          <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-3 mb-6">
            <form className="w-full max-w-sm" onSubmit={handleSubmit}>
              <label className="block text-gray-700 text-sm font-bold" htmlFor="username">
                Nickname
              </label>
              <div className="mb-2 text-xs">This will be visible to other users.</div>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                aria-label="nickname"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                }}
              />

              <button
                className="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
              >
                Save
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}

export default Settings
