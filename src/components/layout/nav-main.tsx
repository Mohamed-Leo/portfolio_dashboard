import { useSidebar } from "@/components/ui/sidebar-context"
import { Link, useLocation } from '@tanstack/react-router'
import { dashboardLinks } from '@/constants/layout-data'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavMain() {
  const pathname = useLocation({ select: (location) => location.pathname.replace(/\/$/, '') })
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {dashboardLinks.map(({ title, to, icon }) => (
            <SidebarMenuItem key={to}>
              <SidebarMenuButton
                tooltip={title}
                isActive={pathname === to}
                render={<Link to={to} activeOptions={{ exact: true }} onClick={() => setOpenMobile(false)} />}
              >
                {icon}
                <span>{title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
