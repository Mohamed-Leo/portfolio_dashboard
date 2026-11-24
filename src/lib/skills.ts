import { apiRequest } from './api';
import { getCsrfToken } from './auth';
import { skillIdSchema, skillListSchema, skillResponseSchema, skillSchema, skillUpdateSchema, skillsSearchSchema, type SkillInput, type SkillUpdate, type SkillsSearch } from './validations/skillSchema';

export async function getSkills(filters: SkillsSearch, signal?: AbortSignal) {
  const values = skillsSearchSchema.parse(filters);
  const params = new URLSearchParams({
    q: values.q, page: String(values.page), limit: String(values.limit), sort: values.sort, direction: values.direction,
  });
  if (values.groupId !== 'all') params.set('groupId', values.groupId);
  if (values.level !== 'all') params.set('level', values.level);
  return skillListSchema.parse(await apiRequest('/dashboard/skills?' + params, { signal }));
}

export async function getSkill(id: string, signal?: AbortSignal) {
  skillIdSchema.parse(id);
  return skillResponseSchema.parse(await apiRequest('/dashboard/skills/' + encodeURIComponent(id), { signal })).skill;
}

export async function createSkill(values: SkillInput) {
  const payload = skillSchema.parse(values);
  const token = await getCsrfToken();
  return skillResponseSchema.parse(await apiRequest('/skills', { method: 'POST', headers: { 'X-CSRF-Token': token }, body: JSON.stringify(payload) })).skill;
}

export async function updateSkill(id: string, values: SkillUpdate) {
  skillIdSchema.parse(id);
  const payload = skillUpdateSchema.parse(values);
  const token = await getCsrfToken();
  return skillResponseSchema.parse(await apiRequest('/skills/' + encodeURIComponent(id), { method: 'PATCH', headers: { 'X-CSRF-Token': token }, body: JSON.stringify(payload) })).skill;
}

export async function deleteSkill(id: string) {
  skillIdSchema.parse(id);
  const token = await getCsrfToken();
  await apiRequest('/skills/' + encodeURIComponent(id), { method: 'DELETE', headers: { 'X-CSRF-Token': token } });
}
