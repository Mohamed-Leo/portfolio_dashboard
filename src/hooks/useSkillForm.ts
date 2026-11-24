import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createSkill, updateSkill } from '@/lib/skills';
import { ApiError, errorMessage } from '@/lib/api';
import { skillFormSchema, type Skill, type SkillFormValues } from '@/lib/validations/skillSchema';
import { skillFormDefaults, skillFormPatch, skillFormPayload } from '@/utils/skillForm';
import { refreshSkillQueries } from '@/queries/skills';
import { handleSessionError } from '@/queries/session';

export function useSkillForm(skill: Skill | undefined, onSaved: () => void) {
  const client = useQueryClient();
  const form = useForm<SkillFormValues>({ resolver: zodResolver(skillFormSchema), defaultValues: skillFormDefaults(skill) });
  const mutation = useMutation({
    mutationFn: (values: SkillFormValues) => skill
      ? updateSkill(skill.id, skillFormPatch(values, skill))
      : createSkill(skillFormPayload(values)),
    retry: false,
    onSuccess: async result => {
      await refreshSkillQueries(client, result.id, result);
      toast.success(skill ? 'Skill updated.' : 'Skill added.');
      onSaved();
    },
    onError: async error => { await handleSessionError(client, error); },
  });
  const submit = form.handleSubmit(async values => {
    if (skill && Object.keys(skillFormPatch(values, skill)).length === 0) {
      toast.info('No changes to save.');
      onSaved();
      return;
    }
    try { await mutation.mutateAsync(values); }
    catch (error) {
      if (!skill && error instanceof ApiError && error.status === 409) form.setError('id', { message: 'This skill ID already exists. Choose another ID.' }, { shouldFocus: true });
      form.setError('root.server', { message: errorMessage(error) });
    }
  });
  return { form, submit, pending: form.formState.isSubmitting || mutation.isPending };
}
