import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query';
import { getProject, getProjects } from '@/lib/projects';
import type { Project, ProjectsSearch } from '@/lib/validations/projectSchema';
import { handleSessionError } from './session';
import { dashboardKeys } from './dashboard';

export const projectKeys = {
  all: ['projects'] as const,
  lists: ['projects', 'list'] as const,
  list: (filters: ProjectsSearch) => ['projects', 'list', filters] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

export function projectsQueryOptions(filters: ProjectsSearch) {
  return queryOptions({
    queryKey: projectKeys.list(filters),
    queryFn: async ({ signal, client }) => {
      try { return await getProjects(filters, signal); }
      catch (error) { await handleSessionError(client, error, signal); throw error; }
    },
    staleTime: 30_000, retry: false, placeholderData: keepPreviousData,
  });
}

export function projectQueryOptions(id: string | null) {
  return queryOptions({
    queryKey: projectKeys.detail(id ?? ''), enabled: id !== null,
    queryFn: async ({ signal, client }) => {
      if (!id) throw new Error('Select a project.');
      try { return await getProject(id, signal); }
      catch (error) { await handleSessionError(client, error, signal); throw error; }
    },
    staleTime: 0, retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
}

export async function refreshProjectQueries(client: QueryClient, id: string, project: Project | null) {
  await client.cancelQueries({ queryKey: projectKeys.all });
  if (project) client.setQueryData(projectKeys.detail(id), project);
  else client.removeQueries({ queryKey: projectKeys.detail(id), exact: true });
  await Promise.all([
    client.invalidateQueries({ queryKey: projectKeys.lists }),
    client.invalidateQueries({ queryKey: dashboardKeys.overview }),
  ]);
}
