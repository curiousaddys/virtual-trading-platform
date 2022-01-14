import React from 'react'
import Head from 'next/head'

interface PageWrapperProps {
  title?: string
}

export const PageWrapper: React.FC<PageWrapperProps> = (props) => (
  <>
    <Head>
      <title>{props.title ?? "Curious Addys' Trading Platform"}</title>
    </Head>
    <div className="container justify-center mx-auto my-10 px-2 sm:px-5 max-w-screen-lg">
      {props.children}
    </div>
  </>
)
