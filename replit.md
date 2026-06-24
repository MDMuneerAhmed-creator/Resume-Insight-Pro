# Skillzy — AI-Powered Resume Analyzer

AI-powered resume analyzer that gives users an ATS score, detects skill gaps, and provides actionable improvement suggestions.

**Tagline:** Skill Today. Shine Tomorrow.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + `@clerk/express` (`getAuth(req)` for all auth checks)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Wouter + TanStack Query + Clerk React v6
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Auth: Clerk (use `getAuth(req)` NOT `req.auth` in Express routes)

## Where things live

- `artifacts/resume-analyzer/` — React frontend (routes at `/`)
- `artifacts/api-server/` — Express API (routes at `/api`)
- `lib/db/` — Drizzle schema + migrations
- `artifacts/api-server/uploads/` — Uploaded PDFs

## Architecture decisions

- **Auth pattern**: Always use `getAuth(req)` from `@clerk/express` in route handlers — not `req.auth?.userId` which doesn't work
- **PDF parsing**: `pdf-parse@1.1.1` pinned (v2 has breaking class-based API); externalized in esbuild
- **AI**: OpenRouter key (`sk-or-v1…`) auto-detected; routes to `openrouter.ai/api/v1` with model `gpt-4o-mini`
- **Polling**: Resume detail page polls every 3s while `status === "analyzing"` via `refetchInterval`
- **Security**: All API routes verify ownership via `getAuth(req).userId === resume.userId`

## Brand

- Name: **Skillzy**
- Logo: `artifacts/resume-analyzer/public/logo.png`
- Colors: Blue `hsl(210 76% 43%)` + Teal `hsl(193 100% 42%)`
- CSS utilities: `.skillzy-gradient` (bg), `.skillzy-gradient-text` (text)

## User preferences

- Keep all API auth using `getAuth(req)` from `@clerk/express`
- Brand name is "Skillzy" everywhere — never "Analyzer"
