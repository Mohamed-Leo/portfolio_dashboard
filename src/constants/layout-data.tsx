import {
  FolderIcon,
  LayoutDashboardIcon,
  MailIcon,
  Settings2Icon,
  SparklesIcon,
} from 'lucide-react';

const dashboardLinks = [
  { title: 'Dashboard', to: '/dashboard', icon: <LayoutDashboardIcon /> },
  { title: 'Projects', to: '/dashboard/projects', icon: <FolderIcon /> },
  { title: 'Skills', to: '/dashboard/skills', icon: <SparklesIcon /> },
  { title: 'Contacts', to: '/dashboard/contacts', icon: <MailIcon /> },
  { title: 'Settings', to: '/dashboard/settings', icon: <Settings2Icon /> },
] as const;

const projectLabels = {
  website: 'Websites',
  'landing-page': 'Landing pages',
  'web-application': 'Web applications',
  dashboard: 'Dashboards',
  '3d-website': '3D websites',
  other: 'Other',
};
const skillLabels = {
  frontend: 'Frontend',
  backend: 'Backend',
  creative: 'Creative',
  workflow: 'Workflow',
  other: 'Other',
};
const messageLabels = {
  new: 'New',
  read: 'Read',
  archived: 'Archived',
  other: 'Other',
};

export { projectLabels, skillLabels, messageLabels, dashboardLinks };
