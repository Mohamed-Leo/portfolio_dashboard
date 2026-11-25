import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let vite, schemas, contacts, settings, queries, forms, client;
const originalFetch = globalThis.fetch;
const token = 'b'.repeat(64);
const summary = { id: '0123456789abcdef01234567', name: 'Visitor', email: 'visitor@example.com', company: 'Example', status: 'new', createdAt: '2026-11-25T08:00:00.000Z' };
const message = { ...summary, message: 'A private visitor message.', updatedAt: summary.createdAt };
const info = { email: 'public@example.com', phone: '+201001234567', phoneLabel: '+20 100 123 4567', location: 'Cairo, Egypt', linkedin: 'https://www.linkedin.com/in/example', github: 'https://github.com/example' };
const filters = { q: '', status: 'all', page: 1, limit: 10, sort: 'createdAt', direction: 'desc' };
before(async () => {
  vite = await createServer({ server: { middlewareMode: true, watch: null, ws: false } });
  schemas = await vite.ssrLoadModule('/src/lib/validations/contactSchema.ts');
  contacts = await vite.ssrLoadModule('/src/lib/contacts.ts');
  settings = await vite.ssrLoadModule('/src/lib/settings.ts');
  queries = await vite.ssrLoadModule('/src/queries/contacts.ts');
  forms = await vite.ssrLoadModule('/src/utils/contactInfoForm.ts');
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
    assert.ok(item, 'Unexpected API request');
    return Response.json(item.body, { status: item.status ?? 200 });
  };
  return requests;
}

test('inbox URL state defaults unsafe controls while preserving valid pages', () => {
  assert.deepEqual(schemas.contactsSearchSchema.parse({ status: 'invalid', sort: 'message', direction: 'up', page: '0', limit: '1000' }), filters);
  assert.equal(schemas.contactsSearchSchema.parse({ page: '2', status: 'archived' }).page, 2);
});
test('inbox lists send all controls and validate totals and dates', async () => {
  const result = { contacts: [summary], total: 23, page: 2, limit: 10, hasMore: true, summary: { total: 30, new: 10, read: 12, archived: 8 } };
  const requests = responses([{ body: result }]);
  assert.deepEqual(await contacts.getContacts({ ...filters, q: 'A & B', status: 'new', page: 2, sort: 'name', direction: 'asc' }), result);
  const url = new URL(requests[0].url, 'http://localhost');
  assert.equal(url.pathname, '/api/v1/dashboard/contacts');
  assert.deepEqual(Object.fromEntries(url.searchParams), { q: 'A & B', page: '2', limit: '10', sort: 'name', direction: 'asc', status: 'new' });
  assert.equal(schemas.contactSummarySchema.safeParse({ ...summary, createdAt: 'not-a-date' }).success, false);
  assert.equal(schemas.contactListSchema.safeParse({ ...result, total: 31 }).success, false);
});
test('private message detail validates ObjectIds before any request', async () => {
  const requests = responses([{ body: { contact: message } }]);
  assert.deepEqual(await contacts.getContact(summary.id), message);
  assert.equal(requests[0].url, '/api/v1/contacts/' + summary.id);
  const none = responses([]);
  await assert.rejects(contacts.getContact('../info'));
  assert.equal(none.length, 0);
});
test('contact status writes carry only status with fresh CSRF and reject content edits', async () => {
  const requests = responses([{ body: { csrfToken: token } }, { body: { contact: { ...message, status: 'read' } } }]);
  await contacts.updateContactStatus(summary.id, { status: 'read' });
  assert.equal(requests[1].method, 'PATCH');
  assert.equal(requests[1].headers.get('X-CSRF-Token'), token);
  assert.deepEqual(JSON.parse(requests[1].body), { status: 'read' });
  const none = responses([]);
  await assert.rejects(contacts.updateContactStatus(summary.id, { status: 'read', message: 'changed' }));
  assert.equal(none.length, 0);
});
test('contact deletion never masks server refusal', async () => {
  const requests = responses([{ body: { csrfToken: token } }, { status: 403, body: { message: 'Invalid CSRF.' } }]);
  await assert.rejects(contacts.deleteContact(summary.id), error => error.status === 403);
  assert.equal(requests[1].method, 'DELETE');
});
test('contact information normalizes email and rejects unsafe hosts and missing fields', () => {
  assert.deepEqual(schemas.contactInfoSchema.parse({ ...info, email: ' PUBLIC@example.com ' }), info);
  assert.deepEqual(forms.contactInfoDefaults(info), info);
  assert.equal(forms.contactInfoDefaults(null).email, '');
  for (const change of [{ phone: '1234' }, { github: 'https://github.com.evil.example/user' }, { linkedin: 'javascript:alert(1)' }, { github: 'https://user:password@github.com/user' }, { location: '' }]) {
    assert.equal(schemas.contactInfoSchema.safeParse({ ...info, ...change }).success, false);
  }
});
test('settings read treats only missing configuration as null and saves full validated data with CSRF', async () => {
  responses([{ status: 404, body: { message: 'Not configured.' } }]);
  assert.equal(await settings.getContactInfo(), null);
  responses([{ status: 503, body: { message: 'Unavailable.' } }]);
  await assert.rejects(settings.getContactInfo(), error => error.status === 503);
  const requests = responses([{ body: { csrfToken: token } }, { body: { contact: info } }]);
  assert.deepEqual(await settings.saveContactInfo(info), info);
  assert.equal(requests[1].url, '/api/v1/contacts/info');
  assert.equal(requests[1].method, 'PUT');
  assert.deepEqual(JSON.parse(requests[1].body), info);
});
test('contact changes invalidate all inbox lists and overview and remove deleted detail', async () => {
  const key = queries.contactKeys.list(filters);
  client.setQueryData(key, { contacts: [summary] });
  client.setQueryData(['dashboard', 'overview'], { old: true });
  const updated = { ...message, status: 'read' };
  await queries.refreshContactQueries(client, summary.id, updated);
  assert.equal(client.getQueryState(key).isInvalidated, true);
  assert.equal(client.getQueryState(['dashboard', 'overview']).isInvalidated, true);
  assert.deepEqual(client.getQueryData(queries.contactKeys.detail(summary.id)), updated);
  await queries.refreshContactQueries(client, summary.id, null);
  assert.equal(client.getQueryData(queries.contactKeys.detail(summary.id)), undefined);
});
test('all inbox controls isolate cached queries and 401 clears identity while outages retain it', async () => {
  for (const change of [{ q: 'Visitor' }, { status: 'read' }, { page: 2 }, { limit: 20 }, { sort: 'name' }, { direction: 'asc' }]) {
    assert.notDeepEqual(queries.contactKeys.list(filters), queries.contactKeys.list({ ...filters, ...change }));
  }
  const user = { id: 'owner', email: 'owner@example.com', role: 'admin' };
  client.setQueryData(['auth', 'session'], user);
  responses([{ status: 503, body: { message: 'Unavailable.' } }]);
  await assert.rejects(client.query(queries.contactsQueryOptions(filters)));
  assert.deepEqual(client.getQueryData(['auth', 'session']), user);
  responses([{ status: 401, body: { message: 'Sign in.' } }]);
  await client.query(queries.contactsQueryOptions(filters)).catch(() => null);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(client.getQueryData(['auth', 'session']), null);
});
