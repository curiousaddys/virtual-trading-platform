import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import React, { useContext, useEffect } from 'react'
import { signatureText } from '../utils/constants'
import { UserContext } from '../hooks/useUser'

const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42],
})

export const WalletConnector = () => {
  const { account, library, activate, deactivate } = useWeb3React()
  const { user, setUser } = useContext(UserContext)

  // Whenever account changes to a non-nullish value, set the logged-in user.
  useEffect(() => {
    if (account) {
      ;(async () => {
        const signer = await library.getSigner(account)
        const signature = await signer.signMessage(signatureText + account)
        setUser({ address: account, signature })
      })()
    }
  }, [account, library, setUser])

  // Activate wallet.
  async function login() {
    try {
      await activate(injected)
    } catch (err) {
      console.error(err)
    }
  }

  // Deactivate wallet & clear the logged-in user.
  async function logout() {
    try {
      deactivate()
      setUser(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <div className="w-full">
        <div className="absolute top-0 right-0">
          {user ? (
            <>
              <button
                onClick={logout}
                className="py-2 m-1 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={login}
              className="py-2 m-1 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800"
            >
              Login with MetaMask
            </button>
          )}
        </div>
      </div>
    </>
  )
}
