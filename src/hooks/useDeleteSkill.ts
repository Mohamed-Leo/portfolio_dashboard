import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteSkill } from '@/lib/skills';
import { refreshSkillQueries } from '@/queries/skills';
import { handleSessionError } from '@/queries/session';

export function useDeleteSkill(onDeleted: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteSkill,
    retry: false,
    onSuccess: async (_result, id) => {
      await refreshSkillQueries(client, id, null);
      toast.success('Skill deleted.');
      onDeleted();
    },
    onError: async error => { await handleSessionError(client, error); },
  });
}
