import { Outlet, useLocation } from '@tanstack/react-router'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { dashboardLinks } from '@/constants/layout-data'
import { AppSidebar } from './app-sidebar'
import { SiteHeader } from './site-header'

export function DashboardLayout() {
  const pathname = useLocation({ select: (location) => location.pathname.replace(/\/$/, '') })
  const title = dashboardLinks.find((item) => item.to === pathname)?.title ?? 'Dashboard'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader title={title} />
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
