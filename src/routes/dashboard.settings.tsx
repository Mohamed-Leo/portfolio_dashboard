import { createFileRoute } from '@tanstack/react-router'
import { DashboardSection } from '@/components/layout/dashboard-section'

export const Route = createFileRoute('/dashboard/settings')({
  component: () => <DashboardSection title="Settings" description="Dashboard preferences will appear here." />,
})
