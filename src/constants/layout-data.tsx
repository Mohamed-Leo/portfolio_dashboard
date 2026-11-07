import { FolderIcon, LayoutDashboardIcon, MailIcon, Settings2Icon, SparklesIcon } from 'lucide-react'

export const dashboardLinks = [
  { title: 'Dashboard', to: '/dashboard', icon: <LayoutDashboardIcon /> },
  { title: 'Projects', to: '/dashboard/projects', icon: <FolderIcon /> },
  { title: 'Skills', to: '/dashboard/skills', icon: <SparklesIcon /> },
  { title: 'Contacts', to: '/dashboard/contacts', icon: <MailIcon /> },
  { title: 'Settings', to: '/dashboard/settings', icon: <Settings2Icon /> },
] as const
