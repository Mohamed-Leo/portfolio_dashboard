# Authentication and protected routes

## Route ownership

```text
src/routes/
├── __root.tsx
├── (auth)/
│   └── index.tsx                       # /
└── _protected/
    ├── route.tsx                       # Shared authentication guard
    └── dashboard/
        ├── route.tsx                   # Dashboard layout
        ├── index.tsx                   # /dashboard
        ├── projects/index.tsx          # /dashboard/projects
        ├── skills/index.tsx            # /dashboard/skills
        ├── contacts/index.tsx          # /dashboard/contacts
        └── settings/index.tsx          # /dashboard/settings
```

`(auth)` groups files without adding a URL segment. `_protected` is a pathless layout: it owns authentication for all descendants and does not appear in the URL. Add future private pages inside this layout to inherit its guard. The Vite Router plugin generates `src/routeTree.gen.ts`; do not edit that file manually.

`_protected/route.tsx` waits for the session query in `beforeLoad`. An anonymous response redirects to `/` before the child page loads. A server or network error reaches the session error screen instead of being treated as a logout. The login page redirects an authenticated user to `/dashboard`. Both redirects have fixed internal destinations; no URL from an untrusted redirect parameter is used.

`components/auth/protected-route.tsx` observes the same session query while private pages are mounted. When a later check returns `null`, it removes the private subtree and redirects to login. It also owns pending/error UI. `DashboardLayout` only renders the sidebar, header and page outlet.

## Login responsibilities

1. `components/auth/login-form.tsx` renders accessible fields and submission state.
2. `hooks/useLoginForm.ts` configures React Hook Form with `lib/validations/loginSchema.ts`, handles field/server errors and navigates after success. The schema normalizes email and preserves the exact password.
3. `utils/onLoginSubmit.ts` calls login, replaces the session cache and displays feedback. It receives the provider's QueryClient explicitly.
4. `lib/auth.ts` validates API responses with Zod and performs the authentication requests. It has no React or Query cache dependency.
5. `lib/api.ts` sends same-origin JSON requests with cookies, no HTTP caching, cancellation and a ten-second request timeout.
6. `queries/session.ts` owns the session key, query policy, cancellation and cache cleanup.

Login obtains `/api/v1/auth/csrf`, then posts credentials to `/api/v1/auth/login` with `X-CSRF-Token`. The backend verifies the password and regenerates the session ID and CSRF token. The browser receives the HttpOnly session cookie automatically. The frontend caches only the validated public user, cancels old requests, clears the previous cache and navigates to the dashboard.

Login uses React Hook Form's async submission state instead of a Query mutation so the password is not retained as mutation variables. Passwords still exist in the form/request while signing in; they are never logged or persisted in browser storage by this implementation.

## Query behavior

There is one `['auth', 'session']` cache entry, shared by the route guards and the mounted protected layout. With the installed Query version, imperative checks use `queryClient.query(...)`; `fetchQuery` and `ensureQueryData` are deprecated.

- A session result stays fresh for 30 seconds. Navigation within that window reuses it instead of forcing another `/auth/me` request.
- A stale result is checked again on protected navigation, window focus or reconnect. This is not a polling timer or immediate synchronization between tabs.
- Authentication checks do not automatically retry failed requests. The error screen offers an explicit retry that invalidates the session query before reloading the route.
- Only HTTP 401 means anonymous. Network errors, 403, 429, 5xx and malformed responses remain errors and block private rendering.
- A confirmed anonymous session cancels and removes non-auth queries on the QueryClient performing that check. Cancelled checks cannot clear data belonging to a later login.
- Login/logout cancel in-flight queries, remove the previous identity's other queries and mutation cache, then update the existing session query. Keeping that query preserves notifications to the mounted protected-route observer. A 401 from the dashboard summary uses the same reset to return to login immediately.

Logout obtains the current CSRF token before sending `/auth/logout`, so refreshes and session rotation do not rely on an old stored token. Successful logout clears the local cache and returns to `/`. A 401 already means the session has expired; a 403/network failure remains an error instead of falsely reporting successful logout.

## Security boundaries

The frontend guard improves navigation and avoids rendering private UI to known guests. A user can modify client JavaScript and local cache; the backend must authenticate and authorize every protected operation independently. A cached user is never proof of authorization. The UI can take until the next session check to discover expiry or logout in another tab.

The existing backend provides:

- Server-side sessions in MongoDB with a signed cookie, hashed session-store identifiers and session regeneration on login to prevent reuse of the pre-login ID.
- HttpOnly, SameSite=Lax cookies; production additionally uses Secure and the host-only `__Host-` cookie name. Use HTTPS in production.
- A session-bound CSRF token verified on login, logout and protected writes.
- An owner/admin check against the database and an eight-hour absolute authenticated lifetime, with a rolling 30-minute idle lifetime.
- Argon2 password hashing, generic credential errors, strict server-side schemas, request-size limits and rate limits.

These defenses reduce specific risks; they do not guarantee immunity to attacks. HttpOnly restricts cookie reads by JavaScript, but XSS can still issue requests as the user. CSRF does not fix XSS. Keep dependencies patched, avoid unsafe HTML, and use an appropriate production CSP. Zod on the frontend helps correctness; server-side validation remains mandatory. Never put MongoDB credentials or `SESSION_SECRET` in the frontend.

`BACKEND_URL` stays in the Vite server environment and the browser calls `/api/v1/...`. API paths are visible in browser network tools; environment files do not make public endpoints secret. Production needs a same-origin HTTPS reverse proxy for `/api`; Vite's development proxy is not deployed with `dist`.

## Local setup and verification

Start `portfolio_backend` with `npm start`, then this dashboard with `npm run dev`. The backend must connect to MongoDB before it listens on port 5500. `ECONNREFUSED` from Vite means its configured backend target is not accepting connections; route restructuring cannot fix a stopped server. Restart Vite after changing `BACKEND_URL`.

Run `npm test`, `npm run lint` and `npm run build` here. Frontend regression tests cover API/CSRF contracts, all protected dashboard deep links, session freshness, expiry, failure handling, cache isolation and cancellation. The backend's own `npm test` checks real HTTP authentication and protected resources against temporary test databases; it does not use the production database.
