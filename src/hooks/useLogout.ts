import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';
import { resetSessionCache } from '@/queries/session';
import { errorMessage } from '@/lib/api';

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    retry: false,
    onSuccess: async () => {
      await resetSessionCache(queryClient, null);
      toast.success('Signed out.');
      await navigate({ to: '/', replace: true });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
