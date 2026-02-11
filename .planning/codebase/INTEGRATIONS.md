# INTEGRATIONS — zaika-connect (systems map)

> Focus: external services, 3rd-party APIs, and cross-cutting infra. Paths are relative to repo root (`/root/clawd/zaika-connect`).

## 0) Environment & configuration

- Environment validation / parsing:
  - `src/lib/env.server.ts` (Zod + `@t3-oss/env-core`, uses `dotenv`).
- Example env file:
  - `.env.example` (contains sample placeholders and feature toggles).

### Core env vars (server)

Defined in `src/lib/env.server.ts`:

- Database: `DATABASE_URL`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_FROM`
- Better Auth: `BETTER_AUTH_SECRET`, `BETTER_AUTH_BASE_URL`
- AI: optional `OPENAI_API_KEY`, optional `ANTHROPIC_API_KEY`, (Gemini key appears in `.env.example`)
- Stripe: optional `STRIPE_SECRET_KEY`, optional `STRIPE_WEBHOOK_SECRET`
- Storage: `STORAGE_PROVIDER`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, optional `S3_ENDPOINT`, `S3_BUCKET`
- Redis (optional): `REDIS_URL`
- Admin allowlist (optional): `ADMIN_EMAILS`


## 1) Authentication (Better Auth)

**What:** user auth, sessions, orgs, roles/permissions, passkeys, API keys, OTP, magic links, etc.

**Where:**

- Server configuration: `src/lib/auth/auth.ts`
- Client configuration: `src/lib/auth/auth-client.ts`
- HTTP mount point (TanStack Start file route): `src/routes/api/auth/$.ts`

**Transport / endpoints:**

- Better Auth handler is mounted under `basePath: "/api/auth"` in `src/lib/auth/auth.ts`.
- Route implementation wraps Better Auth handler using Elysia:
  - `new Elysia({ prefix: "/api/auth" }).all("*", ({ request }) => auth.handler(request))` in `src/routes/api/auth/$.ts`.

**Plugins enabled (server):** in `src/lib/auth/auth.ts`

- `passkey()` from `@better-auth/passkey` (WebAuthn)
- `twoFactor()` (TOTP)
- `apiKey({ enableSessionForAPIKeys: true, ... })`
- `organization(...)` for multi-tenant org features
- `admin(...)` for role-based administration and access control
- `emailOTP(...)` for email one-time passwords
- `magicLink(...)` for passwordless links
- `openAPI()` for OpenAPI exposure
- `tanstackStartCookies()` for cookie handling in TanStack Start

**Role/permission model:**

- Permissions and roles defined and shared by server + client:
  - `src/lib/auth/permissions.ts` (referenced in both `auth.ts` and `auth-client.ts`).


## 2) Payments / billing (Stripe)

**What:** subscriptions & customer lifecycle integrated via Better Auth Stripe plugin.

**Where:**

- Better Auth Stripe plugin setup (server): `src/lib/auth/auth.ts`
  - Initializes `Stripe` SDK client (package `stripe`) when env vars are present.
  - Builds plugin via `@better-auth/stripe`.
- Client plugin (subscription helpers): `src/lib/auth/auth-client.ts` uses `stripeClient({ subscription: true })`.
- Plan configuration & helpers:
  - `src/lib/stripe/plans.config.ts`
  - `src/lib/stripe/plan.utils.ts`
  - `src/lib/stripe/subscription.utils.ts`
- Frontend subscription UX:
  - `src/features/payment/stripe/*`
  - `src/features/subscription/*`
  - `src/providers/subscription-provider.tsx`
  - Pricing UI: `src/components/pricing-content.tsx`

**Key env vars:**

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Webhook handling:**

- The Stripe integration is wired through Better Auth’s Stripe plugin (configured in `src/lib/auth/auth.ts`).
- No dedicated `src/routes/api/stripe/*` webhook route was found; webhook events are expected to be handled by Better Auth’s webhook mechanism under the auth base path.

**Emails on subscription events:**

- Subscription lifecycle hooks in `src/lib/auth/auth.ts` send email templates:
  - `src/components/emails/subscription-confirmation-email.tsx`
  - `src/components/emails/subscription-upgrade-email.tsx`
  - `src/components/emails/subscription-cancellation-email.tsx`


## 3) Email delivery (SMTP via nodemailer + React Email)

**What:** transactional email (welcome, verification, OTP, password reset, subscription emails).

**Where:**

- SMTP transport + rendering:
  - `src/lib/mail.ts` (uses `nodemailer` and `@react-email/render`).
- Auth-triggered templates referenced from:
  - `src/lib/auth/auth.ts`
- Email templates:
  - `src/components/emails/*`

**Key env vars:**

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_FROM`


## 4) Database (Postgres + Drizzle) + RLS

**What:** primary persistence and multi-tenant data isolation.

**Where:**

- DB client and Drizzle init:
  - `src/lib/db/index.ts` (Bun `SQL`, Drizzle `drizzle-orm/bun-sql`).
- Schema:
  - `src/lib/db/schema/*` (barrel: `src/lib/db/schema/index.ts`).
- Migrations:
  - `src/lib/db/migrations/*`
  - `src/lib/db/migrations/meta/*`
- Drizzle kit:
  - `drizzle.config.ts` (uses `env.DATABASE_URL` from `src/lib/env.server.ts`).
  - `drizzle.config.test.ts`.

**RLS (Row-Level Security):**

- Policy helper functions:
  - `src/lib/db/rls.ts`.
- RLS request context (sets `request.user_id` and `request.org_id`):
  - `src/lib/db/secure-client.ts` (`withRls(...)`).
- oRPC integration uses RLS-enabled procedure variant:
  - `src/orpc/orpc-server.ts` provides `protectedRlsProcedure` and `context.rls(...)`.
- Tests:
  - `src/lib/db/rls.test.ts`.
- Maintenance:
  - `scripts/fix_rls_policies.sql`.


## 5) Postgres extensions / search / vector

### 5.1) pgvector (embeddings)

- Schema uses pgvector column:
  - `src/lib/db/schema/embeddings.ts` (`vector("embedding", { dimensions: 1536 })`).
- Enable extension:
  - `scripts/setup-vector-extension.ts`.

### 5.2) ParadeDB / pg_search / BM25

- Test DB uses ParadeDB image:
  - `docker-compose.test.yml` (`paradedb/paradedb:latest`).
- Enable `pg_search`:
  - `scripts/setup-pg-search.ts`.
- Create BM25 indexes:
  - `scripts/setup-bm25-indexes.ts`.
- One-shot setup for pg_search + BM25 indexes:
  - `scripts/setup-paradedb.ts`.


## 6) Object storage (S3-compatible + MinIO)

**What:** file storage for assets/uploads with presigned uploads and DB metadata.

**Where:**

- Storage client wrapper:
  - `src/lib/storage/index.ts` (Bun `S3Client`).
- Storage DB metadata table + RLS policies:
  - `src/lib/db/schema/storage.ts` (`file` table).
- RPC endpoints:
  - `src/orpc/routes/storage.ts` (upload, presignUpload, presignCallback, getUrl, list, delete).
- Direct serving endpoint:
  - `src/routes/api/storage/$.ts` (GET by key, reads metadata from DB then downloads from storage).

**Local/dev MinIO:**

- MinIO service:
  - `docker-compose.yml` (`minio` service, ports `9000` and `9001`).
- Convenience runner:
  - `scripts/start-docker.sh` (starts MinIO, creates bucket, builds app, uploads assets, starts backend).
- Asset upload:
  - `scripts/upload-to-minio.ts` uploads `./dist/client` to `s3://<bucket>/client/*`.

**Key env vars:**

- `STORAGE_PROVIDER` (enum in `src/lib/env.server.ts`: `s3`, `cloudflare-r2`, `minio`, `digitalocean-spaces`, `google-cloud-storage`, `supabase-storage`).
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`, optional `S3_ENDPOINT`.


## 7) Redis (optional) for resumable chat streams

**What:** enables “resumable streaming” so SSE output can be resumed after reconnect/refresh.

**Where:**

- Redis-backed resumable stream context:
  - `src/lib/chat/stream-context.ts` (Bun `RedisClient` + `resumable-stream/generic`).
- Resume endpoint:
  - `src/routes/api/chat/resume.ts`.

**Local/dev Redis:**

- Service:
  - `docker-compose.yml` (`redis:7-alpine`, port `6379`).
- Helper script:
  - `scripts/redis.sh` (`start|stop|status|logs`).

**Key env vars:**

- `REDIS_URL` (optional). If absent, `getStreamContext()` returns `null`.


## 8) AI providers (LLMs)

### 8.1) OpenAI (two stacks)

1) **Vercel AI SDK** (`ai` + `@ai-sdk/openai`)
- Example route:
  - `src/routes/api/ai/job-chat.ts` uses `streamText({ model: openai("gpt-4o-mini"), ... })`.
- Another route:
  - `src/routes/api/ai/job-description.ts` (similar pattern).

2) **TanStack AI adapters** (`@tanstack/ai-openai`)
- Chat route:
  - `src/routes/api/chat/index.ts` uses `openaiText(...)` adapters.
- Lab route:
  - `src/routes/api/lab/block-generator/index.ts`.

**Key env vars:**

- `OPENAI_API_KEY` (optional, defined in `src/lib/env.server.ts`; example in `.env.example`).

### 8.2) Anthropic / Gemini

- Packages are present in `package.json`:
  - `@tanstack/ai-anthropic`, `@tanstack/ai-gemini`.
- Env validation includes:
  - `ANTHROPIC_API_KEY` in `src/lib/env.server.ts`.
- `.env.example` includes:
  - `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, plus a `GEMINI_API_KEY` placeholder.

(Concrete usage may be elsewhere in the codebase; the repo clearly intends to support these providers.)

### 8.3) CV parsing / review

- API route:
  - `src/routes/api/ai/cv-review.ts`.
- Implementation:
  - `src/lib/ai/cv-parser` (import target for analysis).


## 9) RPC / API integration surface

- oRPC server is mounted on:
  - `src/routes/api/rpc.$.ts` via `@orpc/server/fetch` `RPCHandler`.
- CORS:
  - `CORSPlugin` configured in `src/routes/api/rpc.$.ts` with `origin: "*"` and `credentials: true`.
- oRPC context (auth + db + RLS):
  - `src/orpc/orpc-server.ts` calls `auth.api.getSession({ headers })`.


## 10) Hosting / deployment integration points

- Dockerized runtime (Bun base image):
  - `Dockerfile`.
- Nginx reverse proxy (rate limiting + proxy headers):
  - `nginx.conf`.
- Nitro + Vercel/Bun hints:
  - `vite.config.ts` includes Nitro `vercel.functions.runtime = "bun1.x"`.
  - `vite.bun.config.ts` uses `nitro({ preset: "bun" })`.


## 11) Dev UX / hooks / formatting

- Git hooks:
  - `.husky/pre-commit` runs `bun x ultracite fix`.
- Lint/format configs:
  - `.oxlintrc.json`, `.oxfmtrc.jsonc`.


## 12) Known integration gaps / mismatches

- Several scripts reference a `backend.ts` entrypoint (see `package.json` scripts `bun:start` and `scripts/start-docker.sh`), but **no `backend.ts` file exists** in the repo root.
  - The actual SSR server entry is `src/server.ts` and production Start command is `bun run .output/server/index.mjs`.
  - If `backend.ts` is intended, it likely needs to be added/restored or those scripts should be updated.
