# Contacts and Settings

## Scope and plan

Continue the existing Projects/Skills structure with TanStack Table, Query, React Hook Form, Zod and existing Base UI/Lucide components. No new dependencies. Contacts owns private visitor messages: server search/status filter/sorting/pages, collection totals, read-only message details, explicit status updates and confirmed deletion. Opening a message does not mark it read. Messages are rendered as plain text; no bulk deletion or automatic email sending.

Settings owns the six public contact information fields and reuses the existing theme toggle and session/logout flow. Account email/role are read-only because account modification endpoints do not exist. Public contact data and login credentials are separate. Private settings reads bypass public caches; a full validated admin PUT supports first-time configuration without changing the existing PATCH-missing-record 404 contract.

- [x] Backend tests first: protected inbox reads, totals across pages, safe literal search/filters/sorts, no message body in list summaries; private settings read, full PUT initialization, strict validation, session/CSRF and existing PATCH semantics.
- [x] Add protected reads under `routes/dashboard.js`, validators/controllers within existing Contacts modules and protected `PUT /contacts/info`. Reuse existing message detail/status/delete routes.
- [x] Frontend tests first: response schemas, ObjectId validation, fresh CSRF writes, status-only patches, settings defaults/full payload, invalid host rejection, Query isolation and overview refresh.
- [x] Build feature-local Contacts table/page/details and Settings page/contact form using existing primitives. Preserve drafts and block pending navigation, show errors/retry/empty states, confirm destructive actions, update affected caches after successful writes.
- [x] Use existing skill brand assets plus installed Lucide capability/group fallbacks. No external icon requests or package upgrades.
- [x] Browser verification on isolated temporary data, full tests/lint/build/diff checks, single Graphify update and final documentation.

## Verification boundaries

Do not change real portfolio data during verification. Browser deletion checks stop at confirmation/cancel; actual delete behavior is exercised against temporary databases in HTTP tests. No deployment or account/password changes are part of this task.

## Data flow and verification

`lib/contacts.ts` validates private inbox responses and sends status-only PATCH/delete requests after obtaining fresh CSRF. `queries/contacts.ts` owns list/detail keys,30-second list freshness and invalidation of inbox and overview after writes. `lib/settings.ts` uses a protected no-store read; only404 means unconfigured. Full PUT validates all six fields, and successful saves seed the settings cache and reset the form's saved baseline. Form drafts are separate from Query data, with route/unload protection while dirty or saving. Temporary network/server failures preserve the session; confirmed401 follows the shared session reset boundary.

The9 frontend contract tests and6 backend HTTP tests passed, along with the full suites (52 frontend,92 backend), lint, dashboard TypeScript and production build. Browser checks on a temporary database verified inbox counts, pagination, explicit status changes and refreshed totals, literal HTML-looking message text, delete cancellation, missing settings configuration, delayed503 preserving the settings draft and blocking Back, successful retry and reload persistence, dirty navigation/reset confirmations, mobile inbox and light-mode Settings, and local skill icon loading. Independent review findings about stale message details and pending status navigation were fixed; rereading cached details now awaits the server and shows errors instead of stale actions.

The normal public contact info response can remain cached for60 seconds. No email is sent automatically: Reply by email opens the user's configured email client. Actual production data and deployment have not been changed by these verification checks.
