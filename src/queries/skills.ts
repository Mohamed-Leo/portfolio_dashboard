import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query';
import { getSkill, getSkills } from '@/lib/skills';
import type { Skill, SkillsSearch } from '@/lib/validations/skillSchema';
import { handleSessionError } from './session';
import { dashboardKeys } from './dashboard';

export const skillKeys = {
  all: ['skills'] as const,
  lists: ['skills', 'list'] as const,
  list: (filters: SkillsSearch) => ['skills', 'list', filters] as const,
  detail: (id: string) => ['skills', 'detail', id] as const,
};

export function skillsQueryOptions(filters: SkillsSearch) {
  return queryOptions({
    queryKey: skillKeys.list(filters),
    queryFn: async ({ signal, client }) => {
      try { return await getSkills(filters, signal); }
      catch (error) { await handleSessionError(client, error, signal); throw error; }
    },
    staleTime: 30_000, retry: false, placeholderData: keepPreviousData,
  });
}

export function skillQueryOptions(id: string | null) {
  return queryOptions({
    queryKey: skillKeys.detail(id ?? ''), enabled: id !== null,
    queryFn: async ({ signal, client }) => {
      if (!id) throw new Error('Select a skill.');
      try { return await getSkill(id, signal); }
      catch (error) { await handleSessionError(client, error, signal); throw error; }
    },
    staleTime: 0, retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
}

export async function refreshSkillQueries(client: QueryClient, id: string, skill: Skill | null) {
  await client.cancelQueries({ queryKey: skillKeys.all });
  if (skill) client.setQueryData(skillKeys.detail(id), skill);
  else client.removeQueries({ queryKey: skillKeys.detail(id), exact: true });
  await Promise.all([
    client.invalidateQueries({ queryKey: skillKeys.lists }),
    client.invalidateQueries({ queryKey: dashboardKeys.overview }),
  ]);
}
