import Link from 'next/link'
import { WalletConnector } from './WalletConnector'
import React from 'react'

export const Navbar: React.FC = () => {
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
            <WalletConnector />
          </div>
        </div>
      </div>
    </nav>
  )
}
