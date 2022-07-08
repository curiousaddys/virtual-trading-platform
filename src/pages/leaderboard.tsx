import type { NextPage } from 'next'
import { PageLayout } from '../components/common/PageLayout'
import { LeaderboardTable } from '../components/LeaderboardTable'

const Settings: NextPage = () => {
  return (
    <PageLayout title="Top Portfolios">
      <LeaderboardTable />
    </PageLayout>
  )
}

export default Settings
