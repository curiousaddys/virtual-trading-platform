import { faCog, faMedal } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import React from 'react'
import { useAccountContext } from '../hooks/useAccount'
import { WalletConnector } from './WalletConnector'

export const Navbar: React.VFC = () => {
  const { accountInfo } = useAccountContext()

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-screen-lg mx-auto px-4">
        <div className="flex">
          <Link href="/" passHref>
            <a className="py-4 px-2 mr-auto font-semibold text-gray-500 text-lg">
              Virtual Trading Platform
            </a>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/leaderboard" passHref>
              <a>
                <FontAwesomeIcon icon={faMedal} color="#FF8C00" className="w-6" />
              </a>
            </Link>
            {accountInfo && (
              <Link href="/settings" passHref>
                <a>
                  <FontAwesomeIcon icon={faCog} color="#00008B" className="w-6" />
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
