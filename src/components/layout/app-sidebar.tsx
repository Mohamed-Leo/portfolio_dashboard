import { Link } from '@tanstack/react-router';
import { LogOutIcon } from 'lucide-react';
import { Brand } from '@/components/global/brand';
import { useLogout } from '@/hooks/useLogout';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';

export function AppSidebar() {
  const logout = useLogout();
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/dashboard" />}>
              <Brand />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
              className="hover:bg-destructive hover:text-popover dark:text-foreground transition-colors"
            >
              <LogOutIcon aria-hidden="true" />
              <span>{logout.isPending ? 'Signing out…' : 'Sign out'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
