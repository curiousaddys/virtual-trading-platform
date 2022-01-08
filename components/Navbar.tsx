import Link from 'next/link'
import { WalletConnector } from './WalletConnector'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog, faMedal } from '@fortawesome/free-solid-svg-icons'

export const Navbar: React.VFC = () => {
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
            <WalletConnector />
          </div>
        </div>
      </div>
    </nav>
  )
}
