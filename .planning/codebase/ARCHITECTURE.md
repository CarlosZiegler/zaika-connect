# Zaika Connect — Architecture

> Repo: `/root/clawd/zaika-connect`

## 1) High-level overview

Zaika Connect is a **full-stack TanStack Start** application:

- **Client/UI:** React 19 + TanStack Router (file-based routes) + React Query.
- **Server:** TanStack Start server runtime, with server handlers colocated in route files.
- **RPC API:** oRPC (Fetch-based) exposed under `/api/rpc/*`, implemented with **Elysia** for routing and oRPC server plugins (e.g., CORS).
- **Auth:** `better-auth` mounted under `/api/auth/*`.
- **DB:** Postgres via Drizzle ORM, with first-class support for **Row Level Security (RLS)** and request-scoped context.
- **Payments:** Stripe (+ better-auth stripe plugin).
- **Storage:** S3-compatible storage (MinIO in dev) with DB-stored metadata and an API download proxy.
- **AI features:** endpoints under `/api/ai/*` and `/api/chat/*` integrating AI SDKs.

## 2) Execution entrypoints

### Browser entry

- `src/client.tsx`
  - Calls `hydrateRoot(document, <StartClient />)`.

### Server entry

- `src/server.ts`
  - Delegates to `@tanstack/react-start/server-entry` handler.

### Router factory

- `src/router.tsx`
  - Builds router via `createRouter({ routeTree, context })`.
  - Integrates **React Query** with `setupRouterSsrQueryIntegration` for SSR + hydration.
  - Installs a global `QueryCache.onError` handler to:
    - redirect to `/sign-in` on 401
    - display user-safe errors via `sonner` + i18n.

### Route tree

- `src/routeTree.gen.ts` (generated)
  - Maps `src/routes/**` into a typed route tree consumed by `src/router.tsx`.

## 3) Logical layers & responsibilities

### A) Route layer (UI + server handlers)

- `src/routes/**` defines pages/layouts using TanStack Router.
- `src/routes/api/**` defines server endpoints *as routes* (TanStack Start server handlers).

Key files:
- `src/routes/__root.tsx` — HTML shell + global providers (Theme, I18n, Toaster, devtools).
- `src/routes/api/auth/$.ts` — auth handler passthrough.
- `src/routes/api/rpc.$.ts` — oRPC handler.
- `src/routes/api/storage/$.ts` — file download proxy.
- `src/routes/api/ai/*`, `src/routes/api/chat/*` — AI/chat server endpoints.

### B) Feature layer (domain UI)

- `src/features/**` holds domain-focused UI pieces (jobs, applications, dashboard, admin, subscription, etc.).
- Features are consumed by routes; they generally should not own global infrastructure.

### C) Shared component layer

- `src/components/**`
  - `ui/` primitives (design system)
  - guards, common pages, emails, AI elements

### D) Infrastructure/library layer

- `src/lib/**` provides shared “services” and platform integrations:
  - `lib/auth/*` — better-auth configuration, client helpers, permissions, queries.
  - `lib/db/*` — Drizzle db client + schema + migrations + RLS helpers.
  - `lib/storage/*` — storage abstraction.
  - `lib/payment/*`, `lib/stripe/*` — billing/plan logic.
  - `lib/ai/*`, `lib/chat/*`, `lib/cv/*`, `lib/search/*`, `lib/intl/*`.

### E) RPC layer

- `src/orpc/**` defines procedure routers and cross-cutting RPC concerns.

Key files:
- `src/orpc/orpc-server.ts`
  - Builds oRPC context: `{ db, session, auth, headers, rls(fn) }`.
  - Middleware:
    - timing logger (`utils/log.ts`)
    - error normalization to user-safe errors.
  - Procedure flavors:
    - `publicProcedure`
    - `protectedProcedure` (requires session)
    - `protectedRlsProcedure` (wraps handler in RLS-scoped transaction)
- `src/orpc/index.ts`
  - Composes domain routers: `profile`, `organization`, `dashboard`, `storage`, `jobs`, `applications`, `admin.*`.

## 4) Data & auth model

### Authentication

- `better-auth` is exposed via:
  - `src/routes/api/auth/$.ts` → `auth.handler(request)`
- Session resolution for server-side work:
  - `src/orpc/orpc-server.ts` uses `auth.api.getSession({ headers })`.

### Database & RLS

- DB client:
  - `src/lib/db/index.ts`
- Schema:
  - `src/lib/db/schema/*`
- RLS support:
  - `src/lib/db/secure-client.ts`, `src/lib/db/rls.ts`
- RPC context offers both:
  - `context.db` (unscoped)
  - `context.rls(fn)` helper for running an RLS-scoped function
  - `protectedRlsProcedure` middleware to automatically scope DB access

## 5) API surface

### A) oRPC (preferred application API)

- Transport endpoint:
  - `src/routes/api/rpc.$.ts` mounts oRPC under `/api/rpc/*`.
- Router composition:
  - `src/orpc/index.ts`.

Request flow (RPC):
1. Browser calls `/api/rpc/<procedure>` (via oRPC client).
2. `RPCHandler` dispatches to procedure.
3. `createORPCContext()` loads session, attaches db/auth/headers.
4. Middleware applies auth checks and/or RLS.
5. Errors are normalized into user-safe errors.

### B) REST-ish route handlers

- `/api/storage/*`:
  - `src/routes/api/storage/$.ts`
  - Flow: lookup file metadata in DB → download from storage backend → stream response with correct headers.
- `/api/ai/*` and `/api/chat/*`:
  - `src/routes/api/ai/*.ts`, `src/routes/api/chat/*.ts`
  - Flow: server handler processes request and uses AI libraries in `src/lib/ai/*`/`src/lib/chat/*`.

## 6) Cross-cutting concerns

### Error handling

- Client-side query errors:
  - `src/router.tsx` `QueryCache.onError`:
    - handles 401 → clears cached session + redirect
    - translates other errors into toast messages (`sonner`) using i18n.
- RPC procedure errors:
  - `src/orpc/orpc-server.ts` wraps errors via `toUserSafeORPCError()`.

### i18n

- `src/lib/intl/i18n` used in root route and router error handling.
- `src/routes/__root.tsx` uses `setSSRLanguage()` in `beforeLoad()`.

### Logging

- `src/utils/log.ts` used by RPC timing middleware.

## 7) Deployment/infra (repo-level)

- `Dockerfile` — builds and runs the TanStack Start app.
- `docker-compose.yml` — local/dev composition (also `docker-compose.test.yml`).
- `nginx.conf` — reverse proxy configuration.
- `scripts/redis.sh`, MinIO helpers — local infrastructure scripts.

## 8) “Where to add things” (practical guidance)

- New **pages/layouts** → `src/routes/...` (file-based routing).
- New **server endpoints** (non-RPC) → `src/routes/api/...`.
- New **typed application API** → add procedures under `src/orpc/routes/<domain>.ts`, then compose in `src/orpc/index.ts`.
- New **domain UI** → `src/features/<domain>/...` and consumed by routes.
- New **shared UI primitives** → `src/components/ui/...`.
- New **platform integration** (db, auth, storage, payments, AI) → `src/lib/<area>/...`.
