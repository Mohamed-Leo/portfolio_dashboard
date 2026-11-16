import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { SessionError, SessionPending } from '@/components/auth/session-status';
import { sessionQueryOptions } from '@/queries/session';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.query(sessionQueryOptions());
    if (!user) throw redirect({ to: '/', replace: true });
  },
  pendingComponent: SessionPending,
  errorComponent: SessionError,
  component: ProtectedRoute,
});
