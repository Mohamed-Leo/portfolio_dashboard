# Projects workspace

The protected Projects page is a complete admin workspace using the installed TanStack Table 9 adapter, the existing shadcn/Base UI primitives, React Hook Form, Zod and TanStack Query. No package upgrade or image-upload service is introduced.

## Design and responsibilities

The header provides Refresh and Add project. Three compact metrics show total projects, projects with a live preview and private repositories. A server-backed table provides title/ID and image, category, role, technologies, display order and a row action menu. Search, category, sorting and pagination live in the URL and in the Query key. Manual sorting/pagination use Table's explicitly registered features; client code never sorts only one loaded page as though it were the full dataset.

View opens an accessible details sheet. Add/Edit opens a grouped form with every supported project field. The project ID is editable only during creation. Technologies are comma-separated and highlights use one item per line; both are normalized into API arrays. Optional URLs and repositories can be cleared. Image input is an HTTPS URL with alt text, matching the existing backend contract. Unsaved form changes require a discard confirmation. Writes disable duplicate submission, preserve draft data on errors and close only after success. Delete uses an AlertDialog naming the project and is never optimistic.

The existing public project APIs keep their response contract and caching behavior. New `GET /api/v1/dashboard/projects` and `GET /api/v1/dashboard/projects/:id` reads reuse the admin session and return `no-store` data. The list supports bounded `q`, category, sort, direction, page and limit inputs. Search is a literal escaped regular expression, never a user-supplied MongoDB expression. List totals and summary metrics cover the database rather than only the current page. Existing `POST/PATCH/DELETE /api/v1/projects` endpoints remain the write boundary, with server-side admin authorization and session-bound CSRF.

Frontend HTTP/response validation lives in `lib/projects.ts` and `lib/validations/projectSchema.ts`. Form defaults and conversion to API payloads live in `utils/projectForm.ts`. Query options/cache invalidation live in `queries/projects.ts`; form orchestration lives in `hooks/useProjectForm.ts`. Presentation stays under `components/projects/` and route registration under `routes/_protected/dashboard/projects/`.

Every successful write refreshes the affected project data, all cached project lists and the Dashboard overview. Deleting the final item on a page corrects the current page. A confirmed 401 clears the authenticated cache through the existing session boundary. Server/network errors are shown without inventing data or discarding drafts. Automatic retries are disabled for writes.

## Verification

Backend tests exercise protected reads, server pagination/filtering/sorting and real totals, literal search, validation, fresh details after editing and logout. Frontend tests cover payload normalization, immutable IDs, safe optional URLs, API/CSRF contracts, query keys and cache invalidation. Run each repository's `npm test` and lint, and the dashboard production build.

Browser checks use an isolated temporary database for creation, details, editing, optional-link removal, totals, search, pagination, sorting, responsive layout, and cancelling the deletion confirmation. HTTP integration tests cover actual deletion. A deliberately delayed failing save verifies that Back navigation is cancelled while saving and the draft survives the error; idle unsaved changes instead offer a discard confirmation. Existing portfolio records are not changed for verification.
