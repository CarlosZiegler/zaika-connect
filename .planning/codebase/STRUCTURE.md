# Zaika Connect — Codebase Structure

> Repo: `/root/clawd/zaika-connect`

## Top-level

- `README.md` — product + local dev + deployment notes.
- `PRD.md` — product requirements.
- `Dockerfile`, `docker-compose.yml`, `nginx.conf` — container + reverse proxy setup.
- `drizzle.config.ts`, `drizzle.config.test.ts` — Drizzle migration/config.
- `vite.config.ts`, `vite.bun.config.ts` — Vite/TanStack Start build config.
- `vitest.config.ts`, `vitest.setup.ts`, `coverage/` — tests + coverage artifacts.
- `public/` — static assets served as-is.
- `scripts/` — DB, infra, and utility scripts (seed, Redis, MinIO, indexing, etc.).

## Application source (`src/`)

### Runtime entrypoints

- `src/client.tsx` — browser entry; hydrates React Start app.
- `src/server.ts` — server entry (TanStack Start server-entry handler smoke test).
- `src/router.tsx` — router factory (TanStack Router + React Query integration).
- `src/routeTree.gen.ts` — generated TanStack Router route tree (do not edit by hand).

### Route layer (file-based routes)

- `src/routes/__root.tsx` — root route; HTML shell, providers (theme, i18n), devtools.
- `src/routes/index.tsx` — landing page.
- `src/routes/contact.tsx`, `src/routes/pricing.tsx`, `src/routes/privacy.tsx`, `src/routes/terms.tsx` — marketing/legal pages.
- `src/routes/jobs/index.tsx`, `src/routes/jobs/$slug.tsx` — jobs list/detail.
- `src/routes/apply/$jobSlug.tsx` — application flow.
- `src/routes/cv-review.tsx` — CV review UI.
- Auth route group:
  - `src/routes/(auth)/layout.tsx`
  - `src/routes/(auth)/sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `magic-link.tsx`
- Dashboard route group:
  - `src/routes/(dashboard)/layout.tsx`

### Server/API routes (under `src/routes/api/`)

These are server handlers mounted by TanStack Start.

- Auth:
  - `src/routes/api/auth/$.ts` — `better-auth` handler passthrough under `/api/auth/*`.
- RPC:
  - `src/routes/api/rpc.$.ts` — oRPC fetch handler under `/api/rpc/*` (Elysia + CORS plugin).
- Storage:
  - `src/routes/api/storage/$.ts` — file download proxy by key (DB metadata + storage backend).
- AI/chat endpoints:
  - `src/routes/api/ai/job-chat.ts`
  - `src/routes/api/ai/cv-review.ts`
  - `src/routes/api/ai/job-description.ts`
  - `src/routes/api/chat/index.ts`
  - `src/routes/api/chat/resume.ts`
- Labs:
  - `src/routes/api/lab/block-generator/index.ts`

### Feature modules (`src/features/`)

Feature-first UI modules (domain-centric components, data, and feature wiring).

- Examples:
  - `src/features/jobs/*` — job list/detail, filters, widgets.
  - `src/features/applications/*` — application forms.
  - `src/features/dashboard/*`, `src/features/settings/*`, `src/features/admin/*` — authenticated product areas.
  - `src/features/payment/*`, `src/features/subscription/*` — pricing/subscription UX.
  - `src/features/cv-review/*` — CV review UX.
  - `src/features/landing/*` — landing sections/content.

### Shared UI (`src/components/`)

- `src/components/ui/*` — design-system primitives (shadcn-style).
- `src/components/guards/*` — route guards / auth gating.
- `src/components/emails/*` — React Email templates.
- `src/components/public/*` — public-facing shared components.
- `src/components/ai-elements/*` — AI chat/UX components.
- Cross-cutting pages/UX:
  - `src/components/error-boundary.tsx`, `src/components/not-found.tsx`, `src/components/theme-provider.tsx`

### Data + infrastructure (`src/lib/`)

Cross-cutting libraries and “backend-ish” modules used by both server handlers and client code.

- Auth:
  - `src/lib/auth/auth.ts` — better-auth config.
  - `src/lib/auth/auth-client.ts` — client helpers/types.
  - `src/lib/auth/permissions.ts`, `admin-check.ts`, `queries.ts`.
- Database (Drizzle + Postgres + RLS):
  - `src/lib/db/index.ts` — DB client.
  - `src/lib/db/schema/*` — table schemas.
  - `src/lib/db/migrations/*` — SQL migrations.
  - `src/lib/db/secure-client.ts`, `rls.ts` — RLS-scoped access.
- Storage:
  - `src/lib/storage/*` — storage backend abstraction (S3/MinIO style).
- Payments:
  - `src/lib/payment/*`, `src/lib/stripe/*` — plan logic + Stripe integration.
- AI:
  - `src/lib/ai/*`, `src/lib/tanstack-ai/*`, `src/lib/chat/*`, `src/lib/cv/*`.
- Search:
  - `src/lib/search/*` (plus benchmarks/tests).
- i18n:
  - `src/lib/intl/*` — i18next configuration + SSR language helpers.

### RPC layer (`src/orpc/`)

- `src/orpc/orpc-server.ts` — oRPC context, middleware, auth/RLS procedures.
- `src/orpc/index.ts` — top-level router composition.
- `src/orpc/orpc-client.ts` — client instance.
- `src/orpc/routes/*` — procedure routers by domain (jobs, dashboard, admin, etc.).
- `src/orpc/error-*.ts` — error normalization + user-safe messaging.

### Misc

- `src/hooks/*` — shared React hooks.
- `src/providers/subscription-provider.tsx` — subscription state provider.
- `src/utils/*` — logging, SEO helpers, script utilities.

## Naming & conventions (observed)

- **Routes** follow TanStack Router file-based conventions; dynamic params use `$paramName`.
- **Server handlers** live under `src/routes/api/*` and export `Route = createFileRoute(...)( { server: { handlers } } )`.
- **RPC** is organized by domain in `src/orpc/routes/*` and aggregated in `src/orpc/index.ts`.
- **Domain UI** tends to live in `src/features/<domain>/`, with shared primitives in `src/components/ui/`.
