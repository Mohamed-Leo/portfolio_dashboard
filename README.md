# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Development

Run `npm ci` and then `npm run dev`. Add pages under `src/routes/`; the Vite plugin generates `src/routeTree.gen.ts` automatically. Keep that file in Git so the TypeScript check in `npm run build` can run on a fresh checkout. Edit the route files to change the tree.

## Local authentication

Copy `.env.example` to `.env.development.local` and set `BACKEND_URL` to the local backend origin, normally `http://localhost:5500`. Start the backend from `portfolio_backend` with `npm start`, then start this dashboard with `npm run dev`. Restart Vite after changing the environment file.

Vite proxies `/api` to `BACKEND_URL`. The browser uses same-origin `/api/v1` requests, so the development setup works with the backend's existing HttpOnly, SameSite cookies. `BACKEND_URL` is a server-only setting. Database credentials and `SESSION_SECRET` belong exclusively to the backend.

Login reads `/auth/csrf`, then submits credentials to `/auth/login` with `X-CSRF-Token`. Route guards and window-focus checks use `/auth/me`. Logout reads the current CSRF token and calls `/auth/logout`, then clears the private Query cache. Passwords, session IDs, and CSRF tokens are never persisted in browser storage. The existing backend owns session renewal, expiry, admin authorization, and CSRF verification.

The browser can inspect API request paths. Environment variables do not make public API endpoints secret. Deploy behind HTTPS with a reverse proxy forwarding `/api` to the backend on the same origin; Vite's development proxy is not part of the production build.

Run `npm test`, `npm run lint`, and `npm run build` to check the integration. The backend also has its own `npm test` suite using temporary databases.

See [Authentication and protected routes](docs/authentication.md) for the folder structure, login responsibilities, Query cache policy and security boundaries.

The dashboard overview uses live project, skill and message counts from `GET /api/v1/dashboard/overview`. See [Dashboard overview](docs/dashboard-overview.md) for the data flow, pie charts and cache policy.

The protected `/dashboard/projects` workspace uses TanStack Table for server-backed search, category filtering, sorting and pagination. It supports complete project details, creation, editing and confirmed deletion, with summary totals refreshed after successful writes. See [Projects workspace](docs/projects.md) for the API, form and Query responsibilities.

The protected `/dashboard/skills` workspace provides the same management flow for skill names, descriptions, groups, levels, capabilities and display order. Search, group/level filters, sorting and pages are server-backed; successful writes refresh the skills list and overview. See [Skills workspace](docs/skills.md).

`/dashboard/contacts` is the private inbox with server search/status filters, sorting, pagination, collection totals, message detail, explicit status changes and confirmed deletion. `/dashboard/settings` edits the six public contact information fields (including first-time configuration), reuses the theme switcher and shows account information read-only. See [Contacts and Settings](docs/contacts-settings.md) for contracts and verification. Skill icons reuse the portfolio's licensed local brand assets and the installed Lucide capability/group symbols.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
