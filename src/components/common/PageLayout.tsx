import Head from 'next/head'
import React from 'react'
import { Footer } from '../Footer'
import { Navbar } from '../Navbar'

interface PageLayoutProps {
  title?: string
  children?: React.ReactNode
}

export const PageLayout = ({
  title = "Curious Addys' Trading Platform",
  children,
}: PageLayoutProps) => (
  <div className="w-full min-h-screen overflow-x-hidden grid grid-rows-[auto,_minmax(0,_1fr),_auto] grid-cols-1">
    <Head>
      <title>{title}</title>
    </Head>
    <Navbar />
    <div
      className="w-full justify-center mx-auto my-10 px-2 sm:px-5 max-w-screen-lg"
      style={{ marginBottom: 80 }}
    >
      {children}
    </div>
    <Footer />
  </div>
)
