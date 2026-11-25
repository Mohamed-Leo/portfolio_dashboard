# Skills workspace

## Design

Continue the Projects management pattern at `/dashboard/skills`, using the installed TanStack Table 9, Query, React Hook Form, Zod and Base UI components. Keep the existing public Skills API contract and existing protected write endpoints. No new packages, migrations or seeded production records.

The page shows total, core and applied skill counts across the collection. The table shows name/ID/description, group, level, optional capability, display order and View/Edit/Delete actions. Search, group, level, sorting and pagination belong to the URL and Query key; server processing applies to the entire collection. A details sheet and grouped Add/Edit form cover every stored field. IDs are immutable after creation, and clearing capability sends `null`. Deletion names the skill and requires confirmation. Unsaved drafts require confirmation before leaving, saving blocks navigation, and failures retain entered data.

## Implementation plan

- [x] Add failing HTTP tests for protected list/detail reads, actual totals, search/filter/sort/pagination, safe query validation, immediate update visibility and logout.
- [x] Add `getAdminSkills`/`getAdminSkill` in backend `controllers/skills.js`, admin query validation in `validation/skills.js` and two GET routes under the existing dashboard router. Return `{ skills, total, page, limit, hasMore, summary: { total, core, applied } }`; admin reads use sessions, rate limits and no-store.
- [x] Add frontend schema, HTTP functions, form conversion, query keys/invalidation and mutation hooks under the existing `lib/`, `utils/`, `queries/`, `hooks/` structure. Test null capability, immutable IDs, invalid data, CSRF, query isolation, cache invalidation and 401 versus outages before implementation.
- [x] Build feature-local table, page, details and form under `components/skills/`, replacing the placeholder route. Reuse shared UI and session handling. Successful writes invalidate all skill lists and overview, seed/remove the affected detail and correct empty final pages.
- [x] Verify browser workflows against temporary data, including duplicate IDs, drafts, filter/page changes, mobile width and deletion cancellation. Actual deletes are covered by HTTP tests. Run both full test suites and lint plus dashboard TypeScript/build and diff checks. Update this document and the single Graphify graph.

## Review focus

- Optional capability may be absent, null or a valid code; normalize empty input without changing unrelated fields.
- Empty and filtered datasets must show real totals rather than the current page size.
- Server errors preserve authentication and drafts; only confirmed 401 expires the session cache.
- Detail refetches must not replace a dirty form; pending writes must not allow accidental navigation.
- Mutations must reject ID edits and require fresh CSRF; rendering user text must not insert HTML.

## Verification and icons

The focused10 frontend and6 backend tests were added before implementation. Browser checks on disposable data verified required fields, create/view/edit, clearing capability, immutable IDs, duplicate-ID errors preserving input, search/level filters/reset/pagination, discard confirmation, delayed failed save with Back navigation blocked, and mobile sheet sizing. Actual deletion uses the HTTP integration tests; browser checks stop at confirmation/cancel. Independent review identified a background-refetch draft issue; the editor now captures a fresh baseline once and retains the mounted form thereafter. That background-refetch case was reviewed in source, while pending-save/draft recovery was verified in the browser.

Skill symbols reuse the portfolio's existing local SVG assets (licenses included) and installed Lucide capability icons. Unknown IDs fall back to a group icon without a broken image or remote request. The final browser fixture confirmed React and Node.js icons load correctly.
