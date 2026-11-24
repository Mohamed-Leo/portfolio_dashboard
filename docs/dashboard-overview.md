# Dashboard overview

The overview uses the existing shadcn cards and Recharts pie charts. It replaces the template's revenue, visitor history, customer metrics and document table with live portfolio statistics.

## Design and data flow

Four linked cards show total projects, total skills, total messages and new messages. Three donut-style pie charts show project categories, skill groups and message status. Each chart has a count/percentage legend and an explicit empty state. The layout uses the existing sidebar, theme and typography, stacking on small screens.

The existing list APIs paginate results and do not return overall totals. Counting a single page is inaccurate; downloading every project, skill and private message merely to count them is wasteful. A small authenticated `GET /api/v1/dashboard/overview` endpoint instead groups each MongoDB collection and returns only counts. The three independent aggregations run concurrently, with a five-second execution limit per aggregation. Totals include archived messages and unknown/missing legacy group values under `other`.

The endpoint reuses `requireAdmin` and the session middleware. It has a 60-request/minute limit before session/database access and sends `Cache-Control: no-store`. It is read-only and does not require a CSRF header. It returns no names, email addresses, message contents, credentials or session data.

Frontend responsibilities:

- `lib/validations/dashboardSchema.ts`: validate the response and its count totals.
- `lib/dashboard.ts`: perform the same-origin API request with cancellation.
- `queries/dashboard.ts`: own the overview query key, freshness and expired-session handling.
- `components/dashboard/overview-page.tsx`: loading, error, refresh and data orchestration.
- `components/dashboard/overview-cards.tsx`: the four summary cards.
- `components/dashboard/overview-chart.tsx`: reusable pie chart and accessible count legend.
- `routes/_protected/dashboard/index.tsx`: register the page under the existing protected layout.

Query cache freshness is one minute, with no polling. Stale data refreshes on mount, focus or reconnect; the Refresh button can fetch immediately. A background failure preserves the previous successful snapshot and reports that the refresh failed. A first-load failure shows an error rather than inventing zeros. A confirmed 401 clears the authenticated cache through the existing session reset and returns to login. Other failures do not impersonate logout.

Future project/skill/contact mutations should invalidate `dashboardKeys.overview` after successful writes. No frontend CRUD is introduced by this change. There are no traffic or growth metrics because the backend does not currently collect analytics.

## Response

`overview.projects`, `overview.skills` and `overview.messages` each contain `total` and a `breakdown` map. Keys match the enums in the backend models, plus `other`. Each total is the sum of its breakdown. Zero-count buckets remain in the response; charts display nonzero slices. Empty collections return real zeros.

## Verification

Run the dashboard's `npm test`, `npm run lint` and `npm run build`, and the backend's `npm test` and `npm run lint`. Backend integration tests use a temporary MongoDB instance and verify authentication, complete totals beyond list page limits, legacy values, empty data, logout and rate limiting. Browser validation covers the actual page in light/dark themes and at a narrow viewport.
