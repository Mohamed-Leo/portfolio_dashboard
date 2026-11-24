import { createFileRoute } from '@tanstack/react-router'
import { DashboardOverviewPage } from '@/components/dashboard/overview-page'

export const Route = createFileRoute('/_protected/dashboard/')({
  component: DashboardOverviewPage,
})
