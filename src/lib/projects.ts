import { apiRequest } from './api';
import { getCsrfToken } from './auth';
import { projectIdSchema, projectListSchema, projectResponseSchema, projectSchema, projectUpdateSchema, type ProjectInput, type ProjectUpdate, type ProjectsSearch } from './validations/projectSchema';

export async function getProjects(filters: ProjectsSearch, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit), sort: filters.sort, direction: filters.direction });
  if (filters.q) params.set('q', filters.q);
  if (filters.categoryId !== 'all') params.set('categoryId', filters.categoryId);
  return projectListSchema.parse(await apiRequest('/dashboard/projects?' + params, { signal }));
}

export async function getProject(id: string, signal?: AbortSignal) {
  projectIdSchema.parse(id);
  return projectResponseSchema.parse(await apiRequest('/dashboard/projects/' + encodeURIComponent(id), { signal })).project;
}

export async function createProject(input: ProjectInput) {
  const payload = projectSchema.parse(input);
  const token = await getCsrfToken();
  return projectResponseSchema.parse(await apiRequest('/projects', { method: 'POST', headers: { 'X-CSRF-Token': token }, body: JSON.stringify(payload) })).project;
}

export async function updateProject(id: string, input: ProjectUpdate) {
  projectIdSchema.parse(id);
  const payload = projectUpdateSchema.parse(input);
  const token = await getCsrfToken();
  return projectResponseSchema.parse(await apiRequest('/projects/' + encodeURIComponent(id), { method: 'PATCH', headers: { 'X-CSRF-Token': token }, body: JSON.stringify(payload) })).project;
}

export async function deleteProject(id: string) {
  projectIdSchema.parse(id);
  const token = await getCsrfToken();
  await apiRequest('/projects/' + encodeURIComponent(id), { method: 'DELETE', headers: { 'X-CSRF-Token': token } });
}
