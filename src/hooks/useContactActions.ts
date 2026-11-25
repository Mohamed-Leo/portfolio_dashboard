import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteContact, updateContactStatus } from '@/lib/contacts';
import type { ContactStatus } from '@/lib/validations/contactSchema';
import { refreshContactQueries } from '@/queries/contacts';
import { handleSessionError } from '@/queries/session';

export function useContactStatus(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (status: ContactStatus) => updateContactStatus(id, { status }), retry: false,
    onSuccess: async result => { await refreshContactQueries(client, id, result); toast.success('Message status updated.'); },
    onError: async error => { await handleSessionError(client, error); },
  });
}
export function useDeleteContact(onDeleted: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteContact, retry: false,
    onSuccess: async (_result, id) => { await refreshContactQueries(client, id, null); toast.success('Message deleted.'); onDeleted(); },
    onError: async error => { await handleSessionError(client, error); },
  });
}
