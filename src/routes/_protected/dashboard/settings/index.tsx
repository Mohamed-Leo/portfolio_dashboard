import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/components/settings/settings-page';

export const Route = createFileRoute('/_protected/dashboard/settings/')({
  component: SettingsPage,
});
