import { queryOptions } from '@tanstack/react-query';
import { getDashboardOverview } from '@/lib/dashboard';
import { handleSessionError } from './session';

export const dashboardKeys = { overview: ['dashboard', 'overview'] as const };

export function dashboardQueryOptions() {
  return queryOptions({
    queryKey: dashboardKeys.overview,
    queryFn: async ({ signal, client }) => {
      try {
        return await getDashboardOverview(signal);
      } catch (error) {
        await handleSessionError(client, error, signal);
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
