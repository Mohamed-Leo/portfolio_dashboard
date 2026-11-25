import { queryOptions } from '@tanstack/react-query';
import { getContactInfo } from '@/lib/settings';
import { handleSessionError } from './session';

export const contactInfoKey = ['settings', 'contact-info'] as const;
export function contactInfoQueryOptions() {
  return queryOptions({
    queryKey: contactInfoKey, staleTime: 30_000, retry: false,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
    queryFn: async ({ signal, client }) => {
      try { return await getContactInfo(signal); }
      catch (error) { await handleSessionError(client, error, signal); throw error; }
    },
  });
}
