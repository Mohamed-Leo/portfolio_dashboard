import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { getCurrentUser, type AuthUser } from '@/lib/auth';

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
  client.clear();
  client.setQueryData(sessionKey, user);
}
