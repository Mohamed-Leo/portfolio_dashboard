import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { saveContactInfo } from '@/lib/settings';
import {
  contactInfoSchema,
  type ContactInfo,
} from '@/lib/validations/contactSchema';
import { contactInfoDefaults } from '@/utils/contactInfoForm';
import { contactInfoKey } from '@/queries/settings';
import { handleSessionError } from '@/queries/session';
import { errorMessage } from '@/lib/api';

export function useContactInfoForm(info: ContactInfo | null) {
  const client = useQueryClient();
  const form = useForm<ContactInfo>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: contactInfoDefaults(info),
  });
  const mutation = useMutation({
    mutationFn: saveContactInfo,
    retry: false,
    onSuccess: async (saved) => {
      await client.cancelQueries({ queryKey: contactInfoKey });
      client.setQueryData(contactInfoKey, saved);
      form.reset(saved);
      toast.success('Public contact information saved.');
    },
    onError: async (error) => {
      await handleSessionError(client, error);
    },
  });
  const submit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      form.setError('root.server', { message: errorMessage(error) });
    }
  });
  return {
    form,
    submit,
    pending: form.formState.isSubmitting || mutation.isPending,
  };
}
