import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginPage } from '@/components/auth/login-page';
import { SessionError, SessionPending } from '@/components/auth/session-status';
import { sessionQueryOptions } from '@/queries/session';

export const Route = createFileRoute('/(auth)/')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.query(sessionQueryOptions());
    if (user) throw redirect({ to: '/dashboard', replace: true });
  },
  pendingComponent: SessionPending,
  errorComponent: SessionError,
  component: LoginPage,
});
