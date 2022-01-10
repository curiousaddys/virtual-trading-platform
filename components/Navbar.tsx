import Link from 'next/link'
import { WalletConnector } from './WalletConnector'
import React, { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog, faMedal } from '@fortawesome/free-solid-svg-icons'
import ky from 'ky'
import { Account } from '../db/accounts'
import { useAccountContext } from '../hooks/useAccount'

export const Navbar: React.VFC = () => {
  const { accountInfo, setAccountInfo } = useAccountContext()

  useEffect(() => {
    // Try to fetch account info on initial page load (hoping that cookie is set).
    // TODO: consider checking if cookie exists before trying to fetch.
    const fetchAccountInfo = async () => {
      try {
        const data = await ky.get('/api/account').json<Account>()
        setAccountInfo(data)
      } catch (err) {
        console.log('Could not fetch account info. Probably because user is not logged in.')
      }
    }
    fetchAccountInfo()
  }, [setAccountInfo])

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <div>
              <div className="flex items-center py-4 px-2">
                <span className="font-semibold text-gray-500 text-lg">
                  <Link href="/">Virtual Trading Platform</Link>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 ">
            <Link href="/leaderboard" passHref>
              <a>
                <FontAwesomeIcon
                  icon={faMedal}
                  color={'#FF8C00'}
                  className="cursor-pointer"
                  style={{ width: 24 }}
                />
              </a>
            </Link>
            {accountInfo && (
              <Link href="/settings" passHref>
                <a>
                  <FontAwesomeIcon
                    icon={faCog}
                    color={'#00008B'}
                    className="cursor-pointer"
                    style={{ width: 24 }}
                  />
                </a>
              </Link>
            )}
            <WalletConnector />
          </div>
        </div>
      </div>
    </nav>
  )
}
