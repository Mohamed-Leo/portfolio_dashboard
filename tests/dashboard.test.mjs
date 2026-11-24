import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let vite, api, queries, client;
const originalFetch = globalThis.fetch;
const overview = {
  projects: { total: 3, breakdown: { website: 2, 'landing-page': 0, 'web-application': 0, dashboard: 1, '3d-website': 0, other: 0 } },
  skills: { total: 5, breakdown: { frontend: 3, backend: 2, creative: 0, workflow: 0, other: 0 } },
  messages: { total: 4, breakdown: { new: 2, read: 1, archived: 1, other: 0 } },
};
const owner = { id: 'owner', email: 'owner@example.com', role: 'admin' };

before(async () => {
  vite = await createServer({ server: { middlewareMode: true, watch: null, ws: false } });
  api = await vite.ssrLoadModule('/src/lib/dashboard.ts');
  queries = await vite.ssrLoadModule('/src/queries/dashboard.ts');
  const { QueryClient } = await vite.ssrLoadModule('@tanstack/react-query');
  client = new QueryClient();
});
beforeEach(() => client.clear());
after(async () => {
  globalThis.fetch = originalFetch;
  client?.clear();
  await vite?.close();
});

function respond(body, status = 200) {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json(body, { status });
  };
  return calls;
}

test('overview requests the protected summary once and validates complete counts', async () => {
  const calls = respond({ overview });
  assert.deepEqual(await api.getDashboardOverview(), overview);
  assert.equal(calls[0].url, '/api/v1/dashboard/overview');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls.length, 1);
});

test('malformed or inconsistent overview data is rejected instead of displayed as zeros', async () => {
  for (const data of [
    { ...overview, projects: { ...overview.projects, total: 100 } },
    { ...overview, skills: { total: -1, breakdown: overview.skills.breakdown } },
    { ...overview, messages: { total: 4 } },
  ]) {
    respond({ overview: data });
    await assert.rejects(api.getDashboardOverview());
  }
});

test('a fresh overview is reused and explicit invalidation reloads it', async () => {
  const calls = respond({ overview });
  await client.query(queries.dashboardQueryOptions());
  await client.query(queries.dashboardQueryOptions());
  assert.equal(calls.length, 1);
  await client.invalidateQueries({ queryKey: queries.dashboardKeys.overview, refetchType: 'none' });
  await client.query(queries.dashboardQueryOptions());
  assert.equal(calls.length, 2);
});

test('a 401 on the overview removes the expired identity and private cache', async () => {
  client.setQueryData(['auth', 'session'], owner);
  client.setQueryData(['contacts'], ['private message']);
  respond({ message: 'Please sign in.' }, 401);
  await client.query(queries.dashboardQueryOptions()).catch(() => null);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(client.getQueryData(['auth', 'session']), null);
  assert.equal(client.getQueryData(['contacts']), undefined);
  assert.equal(client.getQueryData(queries.dashboardKeys.overview), undefined);
});

test('temporary failures keep the previous snapshot, do not retry or log the owner out', async () => {
  client.setQueryData(['auth', 'session'], owner);
  client.setQueryData(queries.dashboardKeys.overview, overview, { updatedAt: Date.now() - 120_000 });
  const calls = respond({ message: 'Unavailable.' }, 503);
  await assert.rejects(client.query(queries.dashboardQueryOptions()), error => error.status === 503);
  assert.deepEqual(client.getQueryData(queries.dashboardKeys.overview), overview);
  assert.deepEqual(client.getQueryData(['auth', 'session']), owner);
  assert.equal(calls.length, 1);
});

test('a cancelled overview request cannot expire a newer authenticated session', async () => {
  let release;
  globalThis.fetch = () => new Promise(resolve => { release = resolve; });
  const pending = client.query(queries.dashboardQueryOptions()).catch(() => null);
  await client.cancelQueries();
  client.setQueryData(['auth', 'session'], owner);
  client.setQueryData(['contacts'], ['new identity data']);
  release(Response.json({ message: 'Please sign in.' }, { status: 401 }));
  await pending;
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(client.getQueryData(['auth', 'session']), owner);
  assert.deepEqual(client.getQueryData(['contacts']), ['new identity data']);
});
