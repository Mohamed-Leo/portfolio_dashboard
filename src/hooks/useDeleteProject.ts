import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteProject } from '@/lib/projects';
import { handleSessionError } from '@/queries/session';
import { refreshProjectQueries } from '@/queries/projects';

export function useDeleteProject(onDeleted: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    retry: false,
    onSuccess: async (_result, id) => {
      await refreshProjectQueries(client, id, null);
      toast.success('Project deleted.');
      onDeleted();
    },
    onError: async error => { await handleSessionError(client, error); },
  });
}
