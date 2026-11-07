# Graphify for Portfolio Dashboard

The dashboard uses one local graph at `graphify-out/graph.json`. The report, HTML view, and cache in that folder describe the same graph. Graphify updates them in place, and Git ignores the folder.

Install the CLI with file watching support if Graphify or its watcher is missing:

```powershell
uv tool install 'graphifyy[watch]==0.9.51'
```

From the dashboard root, initialize the graph and install the local Git hooks:

```powershell
npm run graph:update
git config --local core.hooksPath .githooks
```

The hooks refresh the graph after commits and when a branch checkout changes the commit. To refresh on file saves before committing, run `npm run graph:watch` in a separate terminal and stop it with Ctrl+C. For an on-demand refresh, run `npm run graph:update`. After deleting source files or a large refactor, run `npm run graph:update:force`. Use these scripts for writes so Graphify keeps the output path fixed and disables dated backups.

The dashboard uses local AST extraction. It requires no API key and excludes docs, public assets, generated routes, build output, and local secrets through `.graphifyignore`. The Graphify rules for Codex are in `AGENTS.md`.

```powershell
graphify query "queryClient router"
graphify explain "router.tsx"
```
