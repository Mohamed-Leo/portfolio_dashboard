import { createFileRoute } from '@tanstack/react-router'
import { DashboardSection } from '@/components/layout/dashboard-section'

export const Route = createFileRoute('/dashboard/skills')({
  component: () => <DashboardSection title="Skills" description="Your portfolio skills will appear here." />,
})
