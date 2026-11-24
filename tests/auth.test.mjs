import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let vite;
let auth;
let session;
let queryClient;
let QueryClient;
let QueryObserver;
let createRouter;
let createMemoryHistory;
let routeTree;
const originalFetch = globalThis.fetch;
const user = { id: 'owner', email: 'owner@example.com', role: 'admin' };
const token = 'a'.repeat(64);

before(async () => {
  vite = await createServer({ server: { middlewareMode: true, watch: null, ws: false } });
  auth = await vite.ssrLoadModule('/src/lib/auth.ts');
  session = await vite.ssrLoadModule('/src/queries/session.ts');
  ({ queryClient } = await vite.ssrLoadModule('/src/lib/queryClient.ts'));
  ({ QueryClient, QueryObserver } = await vite.ssrLoadModule('@tanstack/react-query'));
  ({ createRouter, createMemoryHistory } = await vite.ssrLoadModule('@tanstack/react-router'));
  ({ routeTree } = await vite.ssrLoadModule('/src/routeTree.gen.ts'));
});

beforeEach(() => queryClient.clear());
after(async () => {
  globalThis.fetch = originalFetch;
  queryClient?.clear();
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

test('login obtains session-bound CSRF before sending credentials and validates the returned user', async () => {
  const requests = responses([{ body: { csrfToken: token } }, { body: { user, csrfToken: 'b'.repeat(64) } }]);
  assert.deepEqual(await auth.login({ email: user.email, password: 'test-password' }), user);
  assert.deepEqual(requests.map(request => request.url), ['/api/v1/auth/csrf', '/api/v1/auth/login']);
  assert.equal(requests[1].headers.get('X-CSRF-Token'), token);
  assert.equal(requests[1].credentials, 'same-origin');
  assert.deepEqual(JSON.parse(requests[1].body), { email: user.email, password: 'test-password' });
});

test('logout reads a fresh CSRF token after login or a page refresh', async () => {
  const requests = responses([{ body: { csrfToken: token } }, { body: { message: 'Signed out.' } }]);
  await auth.logout();
  assert.deepEqual(requests.map(request => request.url), ['/api/v1/auth/csrf', '/api/v1/auth/logout']);
  assert.equal(requests[1].headers.get('X-CSRF-Token'), token);
});

test('an unauthenticated session is distinct from a backend outage', async () => {
  responses([{ status: 401, body: { message: 'Please sign in.' } }]);
  assert.equal(await auth.getCurrentUser(), null);
  responses([{ status: 503, body: { message: 'Service unavailable.' } }]);
  await assert.rejects(auth.getCurrentUser(), error => error.status === 503);
});

test('login failures stay errors and an invalid CSRF response prevents the login request', async () => {
  responses([{ body: { csrfToken: token } }, { status: 401, body: { message: 'Invalid email or password.' } }]);
  await assert.rejects(auth.login({ email: user.email, password: 'wrong' }), error => error.status === 401);
  const requests = responses([{ body: { csrfToken: 'invalid' } }]);
  await assert.rejects(auth.login({ email: user.email, password: 'wrong' }));
  assert.equal(requests.length, 1);
});

test('expired logout is idempotent, while CSRF failures remain actionable', async () => {
  responses([{ body: { csrfToken: token } }, { status: 401, body: { message: 'Please sign in.' } }]);
  await auth.logout();
  responses([{ body: { csrfToken: token } }, { status: 403, body: { message: 'Invalid or missing CSRF token.' } }]);
  await assert.rejects(auth.logout(), error => error.status === 403);
});

test('malformed user data is rejected and requests bypass HTTP caches', async () => {
  const requests = responses([{ body: { user: { ...user, role: 'guest' } } }]);
  await assert.rejects(auth.getCurrentUser());
  assert.equal(requests[0].cache, 'no-store');
});

test('session loss evicts private data, while a temporary server error preserves it', async () => {
  queryClient.setQueryData(['contacts'], ['private message']);
  responses([{ status: 503, body: { message: 'Unavailable.' } }]);
  await assert.rejects(queryClient.query({ ...session.sessionQueryOptions(), staleTime: 0 }));
  assert.deepEqual(queryClient.getQueryData(['contacts']), ['private message']);

  responses([{ status: 401, body: { message: 'Please sign in.' } }]);
  assert.equal(await queryClient.query({ ...session.sessionQueryOptions(), staleTime: 0 }), null);
  assert.equal(queryClient.getQueryData(['contacts']), undefined);
});

test('changing authenticated identity clears the previous account cache', async () => {
  queryClient.setQueryData(['contacts'], ['previous account data']);
  await session.resetSessionCache(queryClient, user);
  assert.equal(queryClient.getQueryData(['contacts']), undefined);
  assert.deepEqual(queryClient.getQueryData(session.sessionKey), user);

  await session.resetSessionCache(queryClient, null);
  assert.equal(queryClient.getQueryData(session.sessionKey), null);
});

test('resetting a session notifies the mounted protected route observer', async () => {
  queryClient.setQueryData(session.sessionKey, user);
  const observer = new QueryObserver(queryClient, session.sessionQueryOptions());
  const updates = [];
  const unsubscribe = observer.subscribe(result => updates.push(result.data));
  try {
    await session.resetSessionCache(queryClient, null);
    assert.equal(observer.getCurrentResult().data, null);
    assert.ok(updates.some(value => value === null));
  } finally {
    unsubscribe();
    observer.destroy();
  }
});

test('a cancelled session check cannot erase a newly authenticated account cache', async () => {
  let release;
  globalThis.fetch = () => new Promise(resolve => { release = resolve; });
  const pending = queryClient.query({ ...session.sessionQueryOptions(), staleTime: 0 }).catch(() => null);
  await queryClient.cancelQueries({ queryKey: session.sessionKey });
  queryClient.setQueryData(['contacts'], ['new account data']);
  release(Response.json({ message: 'Please sign in.' }, { status: 401 }));
  await pending;
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(queryClient.getQueryData(['contacts']), ['new account data']);
});

// Exercise the guards registered on the actual matched parent chain.
async function checkAccess(path, client = queryClient) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient: client },
    isServer: true,
  });
  const matches = router.matchRoutes(path);
  assert.ok(matches.length > 1, `No page matched ${path}`);
  for (const match of matches) {
    await router.routesById[match.routeId].options.beforeLoad?.({ context: { queryClient: client } });
  }
}

test('every dashboard deep link rejects a guest through its parent guard', async () => {
  for (const path of ['/dashboard', '/dashboard/projects', '/dashboard/skills', '/dashboard/contacts', '/dashboard/settings']) {
    queryClient.clear();
    responses([{ status: 401, body: { message: 'Please sign in.' } }]);
    await assert.rejects(checkAccess(path), error => error.options?.to === '/');
  }
});

test('fresh session data is reused when navigating between protected pages', async () => {
  const requests = responses([{ body: { user } }, { body: { user } }]);
  await checkAccess('/dashboard/skills');
  await checkAccess('/dashboard/contacts');
  assert.equal(requests.length, 1, 'Navigation should reuse the fresh session');
});

test('a stale session is checked again and cannot keep a guest on a protected page', async () => {
  queryClient.setQueryData(['auth', 'session'], user, { updatedAt: Date.now() - 60_000 });
  responses([{ status: 401, body: { message: 'Please sign in.' } }]);
  await assert.rejects(checkAccess('/dashboard/settings'), error => error.options?.to === '/');
});

test('the login page redirects a freshly authenticated user without another session request', async () => {
  queryClient.setQueryData(['auth', 'session'], user);
  const requests = responses([{ body: { user } }]);
  await assert.rejects(checkAccess('/'), error => error.options?.to === '/dashboard');
  assert.equal(requests.length, 0);
});

test('backend failures block protected pages without pretending the user is logged out', async () => {
  responses([{ status: 503, body: { message: 'Unavailable.' } }]);
  await assert.rejects(checkAccess('/dashboard/skills'), error => error.status === 503 && !error.options);
});

test('session expiry clears data on the requesting QueryClient, not another instance', async () => {
  const otherClient = new QueryClient();
  try {
    otherClient.setQueryData(['contacts'], ['expired account data']);
    queryClient.setQueryData(['contacts'], ['unrelated client data']);
    responses([{ status: 401, body: { message: 'Please sign in.' } }]);
    await assert.rejects(checkAccess('/dashboard', otherClient), error => error.options?.to === '/');
    assert.equal(otherClient.getQueryData(['contacts']), undefined);
    assert.deepEqual(queryClient.getQueryData(['contacts']), ['unrelated client data']);
  } finally {
    otherClient.clear();
  }
});
