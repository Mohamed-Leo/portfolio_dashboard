import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { getCurrentUser, type AuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export const sessionKey = ['auth', 'session'] as const;

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionKey,
    queryFn: async ({ signal, client }) => {
      const user = await getCurrentUser(signal);
      signal.throwIfAborted();

      if (!user) {
        const privateQueries = {
          predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== 'auth',
        };
        await client.cancelQueries(privateQueries);
        // A login/logout may cancel this check while private requests settle.
        signal.throwIfAborted();
        client.removeQueries(privateQueries);
      }

      return user;
    },
    staleTime: 30_000,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export async function resetSessionCache(client: QueryClient, user: AuthUser | null) {
  await client.cancelQueries();
  // Preserve the session query so mounted auth observers receive the new identity.
  const session = client.getQueryCache().find({ queryKey: sessionKey, exact: true });
  client.removeQueries({ predicate: query => query !== session });
  client.getMutationCache().clear();
  client.setQueryData(sessionKey, user);
}

export async function handleSessionError(client: QueryClient, error: unknown, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (error instanceof ApiError && error.status === 401) await resetSessionCache(client, null);
}
