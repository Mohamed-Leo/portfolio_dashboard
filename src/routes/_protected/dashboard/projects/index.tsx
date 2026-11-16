import { createFileRoute } from '@tanstack/react-router'
import { DashboardSection } from '@/components/layout/dashboard-section'

export const Route = createFileRoute('/_protected/dashboard/projects/')({
  component: () => <DashboardSection title="Projects" description="Your portfolio projects will appear here." />,
})
