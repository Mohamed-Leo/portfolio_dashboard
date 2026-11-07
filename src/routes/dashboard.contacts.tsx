import { createFileRoute } from '@tanstack/react-router'
import { DashboardSection } from '@/components/layout/dashboard-section'

export const Route = createFileRoute('/dashboard/contacts')({
  component: () => <DashboardSection title="Contacts" description="Messages from your portfolio contact form will appear here." />,
})
