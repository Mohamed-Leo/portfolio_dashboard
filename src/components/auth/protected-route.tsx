import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet } from '@tanstack/react-router';
import { sessionQueryOptions } from '@/queries/session';
import { SessionError, SessionPending } from './session-status';

export function ProtectedRoute() {
  const session = useQuery(sessionQueryOptions());

  if (session.isError) return <SessionError />;
  if (session.isPending) return <SessionPending />;
  if (!session.data) return <Navigate to="/" replace />;

  return <Outlet />;
}
