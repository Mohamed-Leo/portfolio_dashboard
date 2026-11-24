import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let vite, schemas, forms, api, queries, client;
const originalFetch = globalThis.fetch;
const csrfToken = 'a'.repeat(64);
const skill = { id: 'node-js', name: 'Node.js', description: 'Build reliable APIs.', groupId: 'backend', level: 'core', capability: 'api', sortOrder: 3 };
const filters = { q: '', groupId: 'all', level: 'all', page: 1, limit: 10, sort: 'sortOrder', direction: 'asc' };
before(async () => {
  vite = await createServer({ server: { middlewareMode: true, watch: null, ws: false } });
  schemas = await vite.ssrLoadModule('/src/lib/validations/skillSchema.ts');
  forms = await vite.ssrLoadModule('/src/utils/skillForm.ts');
  api = await vite.ssrLoadModule('/src/lib/skills.ts');
  queries = await vite.ssrLoadModule('/src/queries/skills.ts');
  const { QueryClient } = await vite.ssrLoadModule('@tanstack/react-query');
  client = new QueryClient();
});
beforeEach(() => client.clear());
after(async () => { globalThis.fetch = originalFetch; client?.clear(); await vite?.close(); });
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

test('skill form round-trips supported fields and clears absent capability explicitly', () => {
  const values = schemas.skillFormSchema.parse(forms.skillFormDefaults(skill));
  assert.deepEqual(forms.skillFormPayload(values), skill);
  assert.deepEqual(forms.skillFormPatch(values, skill), {});
  assert.deepEqual(forms.skillFormPatch({ ...values, name: 'Node APIs', capability: 'none' }, skill), { name: 'Node APIs', capability: null });
  assert.deepEqual(forms.skillFormPatch(forms.skillFormDefaults({ ...skill, capability: undefined }), { ...skill, capability: undefined }), {});
});

test('skill validation rejects invalid enums, IDs, limits and non-integer display order', () => {
  for (const change of [{ id: '../admin' }, { id: 'Uppercase' }, { name: ' ' }, { name: 'a'.repeat(81) }, { description: 'a'.repeat(1001) }, { groupId: 'unknown' }, { level: 'expert' }, { capability: 'javascript' }, { sortOrder: -1 }, { sortOrder: 1.5 }]) {
    assert.equal(schemas.skillFormSchema.safeParse({ ...skill, ...change }).success, false, JSON.stringify(change));
  }
  assert.equal(schemas.skillFormSchema.parse({ ...skill, name: ' Node.js ' }).name, 'Node.js');
});

test('skills URL state safely defaults invalid search controls', () => {
  assert.deepEqual(schemas.skillsSearchSchema.parse({ page: '-1', limit: '999', level: 'expert', groupId: 'invalid', sort: 'passwordHash', direction: 'up' }), filters);
  assert.equal(schemas.skillsSearchSchema.parse({ page: '3', limit: '20' }).page, 3);
});

test('skills list sends every server control and validates global totals', async () => {
  const result = { skills: [skill], total: 23, page: 2, limit: 10, hasMore: true, summary: { total: 30, core: 18, applied: 12 } };
  const requests = responses([{ body: result }]);
  assert.deepEqual(await api.getSkills({ ...filters, q: 'Node & APIs', groupId: 'backend', level: 'core', page: 2, sort: 'name', direction: 'desc' }), result);
  const url = new URL(requests[0].url, 'http://localhost');
  assert.equal(url.pathname, '/api/v1/dashboard/skills');
  assert.deepEqual(Object.fromEntries(url.searchParams), { q: 'Node & APIs', groupId: 'backend', level: 'core', page: '2', limit: '10', sort: 'name', direction: 'desc' });
  assert.equal(requests[0].cache, 'no-store');
  responses([{ body: { ...result, summary: { total: 2, core: 1, applied: 1 } } }]);
  await assert.rejects(api.getSkills(filters));
});

test('create skill obtains CSRF and sends validated data once', async () => {
  const requests = responses([{ body: { csrfToken } }, { status: 201, body: { skill } }]);
  assert.deepEqual(await api.createSkill(skill), skill);
  assert.deepEqual(requests.map(item => item.url), ['/api/v1/auth/csrf', '/api/v1/skills']);
  assert.equal(requests[1].method, 'POST');
  assert.equal(requests[1].headers.get('X-CSRF-Token'), csrfToken);
  assert.deepEqual(JSON.parse(requests[1].body), skill);
});

test('skill updates clear capability and reject immutable IDs before HTTP', async () => {
  const requests = responses([{ body: { csrfToken } }, { body: { skill: { ...skill, capability: undefined } } }]);
  await api.updateSkill(skill.id, { capability: null });
  assert.equal(requests[1].url, '/api/v1/skills/node-js');
  assert.equal(requests[1].method, 'PATCH');
  assert.deepEqual(JSON.parse(requests[1].body), { capability: null });
  const noRequests = responses([]);
  await assert.rejects(api.updateSkill(skill.id, { id: 'other' }));
  await assert.rejects(api.updateSkill(skill.id, {}));
  assert.equal(noRequests.length, 0);
});

test('protected detail rejects invalid IDs and deletion failures remain actionable', async () => {
  const requests = responses([{ body: { skill } }, { body: { csrfToken } }, { status: 403, body: { message: 'Invalid CSRF token.' } }]);
  assert.deepEqual(await api.getSkill(skill.id), skill);
  assert.equal(requests[0].url, '/api/v1/dashboard/skills/node-js');
  await assert.rejects(api.deleteSkill(skill.id), error => error.status === 403);
  assert.equal(requests[2].method, 'DELETE');
  const noRequests = responses([]);
  await assert.rejects(api.getSkill('../admin'));
  assert.equal(noRequests.length, 0);
});

test('skills query keys isolate every page, sort and filter', () => {
  for (const change of [{ q: 'Node' }, { groupId: 'backend' }, { level: 'core' }, { page: 2 }, { limit: 20 }, { sort: 'name' }, { direction: 'desc' }]) {
    assert.notDeepEqual(queries.skillKeys.list(filters), queries.skillKeys.list({ ...filters, ...change }));
  }
});

test('skill writes invalidate all skill lists and overview without evicting projects', async () => {
  const list = queries.skillKeys.list(filters);
  const otherList = queries.skillKeys.list({ ...filters, groupId: 'backend' });
  client.setQueryData(list, { skills: [skill] });
  client.setQueryData(otherList, { skills: [skill] });
  client.setQueryData(['dashboard', 'overview'], { old: true });
  client.setQueryData(['projects', 'list'], { unchanged: true });
  const updated = { ...skill, name: 'Updated Node' };
  await queries.refreshSkillQueries(client, skill.id, updated);
  assert.equal(client.getQueryState(list).isInvalidated, true);
  assert.equal(client.getQueryState(otherList).isInvalidated, true);
  assert.equal(client.getQueryState(['dashboard', 'overview']).isInvalidated, true);
  assert.equal(client.getQueryState(['projects', 'list']).isInvalidated, false);
  assert.deepEqual(client.getQueryData(queries.skillKeys.detail(skill.id)), updated);
  await queries.refreshSkillQueries(client, skill.id, null);
  assert.equal(client.getQueryData(queries.skillKeys.detail(skill.id)), undefined);
});

test('skills temporary outages retain identity while 401 clears private caches', async () => {
  const user = { id: 'owner', email: 'owner@example.com', role: 'admin' };
  client.setQueryData(['auth', 'session'], user);
  responses([{ status: 503, body: { message: 'Unavailable.' } }]);
  await assert.rejects(client.query(queries.skillsQueryOptions(filters)), error => error.status === 503);
  assert.deepEqual(client.getQueryData(['auth', 'session']), user);
  responses([{ status: 401, body: { message: 'Sign in.' } }]);
  await client.query(queries.skillsQueryOptions(filters)).catch(() => null);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(client.getQueryData(['auth', 'session']), null);
});
