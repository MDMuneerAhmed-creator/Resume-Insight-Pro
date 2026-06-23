---
name: api-server stale build causing 404s
description: The api-server runs a compiled esbuild dist — code changes require a workflow restart to rebuild.
---

The api-server uses esbuild to compile TypeScript to `dist/index.mjs`. The `dev` script runs `build && start`. If code is changed without restarting the workflow, the running process uses the old compiled bundle — all new routes return 404.

**Fix:** Always `restart_workflow "artifacts/api-server: API Server"` after any source code change.

**Why:** Unlike ts-node or tsx watch mode, this setup doesn't hot-reload. The workflow must be restarted to trigger a fresh esbuild compile.

**How to apply:** After editing any file in `artifacts/api-server/src/`, always restart the API workflow before testing.
