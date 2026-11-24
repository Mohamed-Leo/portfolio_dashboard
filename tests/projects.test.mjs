import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let vite, schemas, forms, api, queries, client;
const originalFetch = globalThis.fetch;
const csrfToken = 'a'.repeat(64);
const project = {
  id: 'operations', title: 'Operations', category: 'Business operations', categoryId: 'dashboard',
  role: 'Full-stack developer', summary: 'One workspace.', description: 'An operations dashboard.',
  technologies: ['React', 'Node.js'], highlights: ['Clear reports', 'Fast navigation'],
  image: { src: 'https://example.com/project.jpg', alt: 'Operations preview' },
  repository: { url: 'https://github.com/example/project', private: true },
  liveUrl: 'https://example.com/live', overviewUrl: 'https://example.com/overview', sortOrder: 3,
};
const filters = { q: '', categoryId: 'all', page: 1, limit: 10, sort: 'sortOrder', direction: 'asc' };

before(async () => {
  vite = await createServer({ server: { middlewareMode: true, watch: null, ws: false } });
  schemas = await vite.ssrLoadModule('/src/lib/validations/projectSchema.ts');
  forms = await vite.ssrLoadModule('/src/utils/projectForm.ts');
  api = await vite.ssrLoadModule('/src/lib/projects.ts');
  queries = await vite.ssrLoadModule('/src/queries/projects.ts');
  const { QueryClient } = await vite.ssrLoadModule('@tanstack/react-query');
  client = new QueryClient();
});
beforeEach(() => client.clear());
after(async () => {
  globalThis.fetch = originalFetch;
  client?.clear();
  await vite?.close();
});

function responses(items) {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, ...options });
    const item = items.shift();
    assert.ok(item, 'Unexpected extra API request');
    return Response.json(item.body, { status: item.status ?? 200 });
  };
  return requests;
}

test('project form defaults round-trip every supported project field', () => {
  const values = schemas.projectFormSchema.parse(forms.projectFormDefaults(project));
  assert.deepEqual(forms.projectFormPayload(values), project);
  assert.deepEqual(forms.projectFormPatch(values, project), {});
});

test('form text becomes bounded arrays and empty optional links explicitly clear old values', () => {
  const values = { ...forms.projectFormDefaults(project), title: 'New title', technologiesText: ' React, TypeScript,  ', highlightsText: 'First highlight\n\nSecond highlight', repositoryUrl: '', liveUrl: '', overviewUrl: '' };
  const parsed = schemas.projectFormSchema.parse(values);
  const payload = forms.projectFormPayload(parsed);
  assert.deepEqual(payload.technologies, ['React', 'TypeScript']);
  assert.deepEqual(payload.highlights, ['First highlight', 'Second highlight']);
  assert.equal(payload.repository, null);
  assert.equal(payload.liveUrl, null);
  assert.equal(payload.overviewUrl, null);
  assert.deepEqual(forms.projectFormPatch(parsed, project), {
    title: 'New title', technologies: ['React', 'TypeScript'], highlights: ['First highlight', 'Second highlight'], repository: null, liveUrl: null, overviewUrl: null,
  });
});

test('unsafe URLs, invalid IDs, oversized lists and invalid sort orders never pass form validation', () => {
  const valid = forms.projectFormDefaults(project);
  for (const invalid of [
    { imageUrl: 'javascript:alert(1)' }, { liveUrl: 'http://example.com' }, { repositoryUrl: 'https://user:password@example.com' },
    { id: '../admin' }, { sortOrder: -1 }, { sortOrder: 1.5 }, { technologiesText: '' },
    { technologiesText: Array(21).fill('React').join(',') }, { highlightsText: Array(11).fill('One highlight').join('\n') },
  ]) assert.equal(schemas.projectFormSchema.safeParse({ ...valid, ...invalid }).success, false, JSON.stringify(invalid));
});

test('URL table state normalizes invalid deep-link values to safe defaults', () => {
  assert.deepEqual(schemas.projectsSearchSchema.parse({ page: '-1', sort: 'passwordHash', direction: 'up', categoryId: 'invalid', limit: '10000' }), filters);
  assert.equal(schemas.projectsSearchSchema.parse({ page: '3', limit: '20' }).page, 3);
});

test('admin project list sends all server controls and validates its total rather than counting page rows', async () => {
  const response = { projects: [project], total: 23, page: 2, limit: 10, hasMore: true, summary: { total: 30, live: 12, privateRepositories: 3 } };
  const requests = responses([{ body: response }]);
  assert.deepEqual(await api.getProjects({ ...filters, q: 'React & Node', categoryId: 'dashboard', page: 2, sort: 'title', direction: 'desc' }), response);
  const url = new URL(requests[0].url, 'http://localhost');
  assert.equal(url.pathname, '/api/v1/dashboard/projects');
  assert.equal(url.searchParams.get('q'), 'React & Node');
  assert.equal(url.searchParams.get('categoryId'), 'dashboard');
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.get('sort'), 'title');
  assert.equal(url.searchParams.get('direction'), 'desc');
  assert.equal(requests[0].cache, 'no-store');
});

test('create obtains fresh CSRF and sends the project payload exactly once', async () => {
  const requests = responses([{ body: { csrfToken } }, { status: 201, body: { project } }]);
  assert.deepEqual(await api.createProject(project), project);
  assert.deepEqual(requests.map(item => item.url), ['/api/v1/auth/csrf', '/api/v1/projects']);
  assert.equal(requests[1].method, 'POST');
  assert.equal(requests[1].headers.get('X-CSRF-Token'), csrfToken);
  assert.deepEqual(JSON.parse(requests[1].body), project);
});

test('edit sends only supplied fields and rejects immutable IDs', async () => {
  const requests = responses([{ body: { csrfToken } }, { body: { project: { ...project, liveUrl: null } } }]);
  await api.updateProject(project.id, { liveUrl: null });
  assert.equal(requests[1].method, 'PATCH');
  assert.equal(requests[1].url, '/api/v1/projects/operations');
  assert.deepEqual(JSON.parse(requests[1].body), { liveUrl: null });
  const noRequests = responses([]);
  await assert.rejects(api.updateProject(project.id, { id: 'other' }));
  assert.equal(noRequests.length, 0);
});

test('delete requires fresh CSRF and does not turn server failure into success', async () => {
  const requests = responses([{ body: { csrfToken } }, { status: 403, body: { message: 'Invalid CSRF token.' } }]);
  await assert.rejects(api.deleteProject(project.id), error => error.status === 403);
  assert.equal(requests[1].method, 'DELETE');
  assert.equal(requests[1].body, undefined);
});

test('query keys include every filter, page and sort control', () => {
  const initial = queries.projectKeys.list(filters);
  for (const change of [{ q: 'React' }, { categoryId: 'website' }, { page: 2 }, { limit: 20 }, { sort: 'title' }, { direction: 'desc' }]) {
    assert.notDeepEqual(initial, queries.projectKeys.list({ ...filters, ...change }));
  }
});

test('a successful write refreshes list and overview caches and seeds the updated detail', async () => {
  const listKey = queries.projectKeys.list(filters);
  client.setQueryData(listKey, { projects: [project] });
  client.setQueryData(['dashboard', 'overview'], { old: true });
  const updated = { ...project, title: 'Updated project' };
  await queries.refreshProjectQueries(client, project.id, updated);
  assert.equal(client.getQueryState(listKey).isInvalidated, true);
  assert.equal(client.getQueryState(['dashboard', 'overview']).isInvalidated, true);
  assert.deepEqual(client.getQueryData(queries.projectKeys.detail(project.id)), updated);
  await queries.refreshProjectQueries(client, project.id, null);
  assert.equal(client.getQueryData(queries.projectKeys.detail(project.id)), undefined);
});

test('a project 401 expires the mounted session while a 503 preserves it', async () => {
  const user = { id: 'owner', email: 'owner@example.com', role: 'admin' };
  client.setQueryData(['auth', 'session'], user);
  responses([{ status: 503, body: { message: 'Unavailable.' } }]);
  await assert.rejects(client.query(queries.projectsQueryOptions(filters)), error => error.status === 503);
  assert.deepEqual(client.getQueryData(['auth', 'session']), user);
  responses([{ status: 401, body: { message: 'Please sign in.' } }]);
  await client.query(queries.projectsQueryOptions(filters)).catch(() => null);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(client.getQueryData(['auth', 'session']), null);
});
