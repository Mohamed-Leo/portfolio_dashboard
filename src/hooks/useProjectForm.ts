import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createProject, updateProject } from '@/lib/projects';
import { ApiError, errorMessage } from '@/lib/api';
import { projectFormSchema, type Project, type ProjectFormValues } from '@/lib/validations/projectSchema';
import { projectFormDefaults, projectFormPatch, projectFormPayload } from '@/utils/projectForm';
import { refreshProjectQueries } from '@/queries/projects';
import { handleSessionError } from '@/queries/session';

export function useProjectForm(project: Project | undefined, onSaved: () => void) {
  const client = useQueryClient();
  const form = useForm<ProjectFormValues>({ resolver: zodResolver(projectFormSchema), defaultValues: projectFormDefaults(project) });
  const mutation = useMutation({
    mutationFn: (values: ProjectFormValues) => project
      ? updateProject(project.id, projectFormPatch(values, project))
      : createProject(projectFormPayload(values)),
    retry: false,
    onSuccess: async result => {
      await refreshProjectQueries(client, result.id, result);
      toast.success(project ? 'Project updated.' : 'Project added.');
      onSaved();
    },
    onError: async error => { await handleSessionError(client, error); },
  });

  const submit = form.handleSubmit(async values => {
    if (project && Object.keys(projectFormPatch(values, project)).length === 0) {
      toast.info('No changes to save.');
      onSaved();
      return;
    }
    try { await mutation.mutateAsync(values); }
    catch (error) {
      if (!project && error instanceof ApiError && error.status === 409) form.setError('id', { message: 'This project ID already exists. Choose another ID.' }, { shouldFocus: true });
      form.setError('root.server', { message: errorMessage(error) });
    }
  });

  return { form, submit, pending: form.formState.isSubmitting || mutation.isPending };
}
