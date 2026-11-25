import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query';
import { getContact, getContacts } from '@/lib/contacts';
import type { ContactMessage, ContactsSearch } from '@/lib/validations/contactSchema';
import { handleSessionError } from './session';
import { dashboardKeys } from './dashboard';

export const contactKeys = {
  all: ['contacts'] as const, lists: ['contacts', 'list'] as const,
  list: (filters: ContactsSearch) => ['contacts', 'list', filters] as const,
  detail: (id: string) => ['contacts', 'detail', id] as const,
};
export function contactsQueryOptions(filters: ContactsSearch) {
  return queryOptions({
    queryKey: contactKeys.list(filters), staleTime: 30_000, retry: false, placeholderData: keepPreviousData,
    queryFn: async ({ signal, client }) => {
      try { return await getContacts(filters, signal); }
      catch (error) { await handleSessionError(client, error, signal); throw error; }
    },
  });
}
export function contactQueryOptions(id: string | null) {
  return queryOptions({
    queryKey: contactKeys.detail(id ?? ''), enabled: id !== null, staleTime: 0, retry: false,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
    queryFn: async ({ signal, client }) => {
      if (!id) throw new Error('Select a message.');
      try { return await getContact(id, signal); }
      catch (error) { await handleSessionError(client, error, signal); throw error; }
    },
  });
}
export async function refreshContactQueries(client: QueryClient, id: string, contact: ContactMessage | null) {
  await client.cancelQueries({ queryKey: contactKeys.all });
  if (contact) client.setQueryData(contactKeys.detail(id), contact);
  else client.removeQueries({ queryKey: contactKeys.detail(id), exact: true });
  await Promise.all([
    client.invalidateQueries({ queryKey: contactKeys.lists }),
    client.invalidateQueries({ queryKey: dashboardKeys.overview }),
  ]);
}
