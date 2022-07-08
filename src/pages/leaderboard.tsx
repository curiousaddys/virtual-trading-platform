import type { NextPage } from 'next'
import React from 'react'
import { PageWrapper } from '../components/common/PageWrapper'
import { LeaderboardTable } from '../components/LeaderboardTable'

const Settings: NextPage = () => {
  return (
    <PageWrapper title="Top Portfolios">
      <LeaderboardTable />
    </PageWrapper>
  )
}

export default Settings
