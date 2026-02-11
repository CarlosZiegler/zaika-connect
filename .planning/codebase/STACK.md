# STACK — zaika-connect (tech map)

> Repo root: `/root/clawd/zaika-connect`

## 1) Languages / Runtime

- **TypeScript** across the app (see `tsconfig.json`).
- **Bun runtime** is first-class:
  - Dependency manager/runner via `bun.lock`, `bunfig.toml`.
  - DB client via `bun`’s native Postgres driver: `src/lib/db/index.ts` (`import { SQL } from "bun"`).
  - S3-compatible client via `bun`’s `S3Client`: `src/lib/storage/index.ts`, `scripts/upload-to-minio.ts`.
  - Optional Redis via `bun`’s `RedisClient`: `src/lib/chat/stream-context.ts`.
- **Node.js compatibility** is still present (e.g. `nodemailer`, `path` in `scripts/upload-to-minio.ts`), but the intended runtime is Bun.

## 2) Frontend framework / SSR

- **React 19** (`react`, `react-dom` in `package.json`).
- **TanStack Start** (React Router + SSR) is the core framework:
  - Vite plugin: `@tanstack/react-start/plugin/vite` in `vite.config.ts` and `vite.bun.config.ts`.
  - Client entry: `src/client.tsx` (hydrates `<StartClient />`).
  - Server entry: `src/server.ts` (TanStack Start `server-entry`).
  - Router setup: `src/router.tsx` and generated route tree `src/routeTree.gen.ts`.
  - Root document / HTML shell: `src/routes/__root.tsx`.

## 3) Build tooling / bundling

- **Vite** as bundler/dev server (`vite.config.ts`).
  - Default dev: `bun run --bun vite dev --force` (`package.json` script `dev`).
  - Two Vite configs:
    - Standard: `vite.config.ts` (Nitro config includes Vercel Bun runtime).
    - Bun preset build: `vite.bun.config.ts` (Nitro preset: `bun`).
- **Nitro** (server output/runtime abstraction):
  - Vite integration `nitro/vite` in `vite.config.ts` and `vite.bun.config.ts`.
- **TanStack Devtools (Vite)**: `@tanstack/devtools-vite` in `vite.config.ts`.
- **vite-plugin-db** for Postgres/Neon dev workflow:
  - Configured in `vite.config.ts` and `vite.bun.config.ts` via `postgres({ referrer: "start-template" })`.

## 4) Styling / UI system

- **Tailwind CSS v4**:
  - Tailwind Vite plugin: `@tailwindcss/vite` in `vite.config.ts`.
  - PostCSS plugin: `postcss.config.ts` (`@tailwindcss/postcss`).
  - Tailwind config: `tailwind.config.mjs`.
  - App styles: `src/app.css`, `src/app-new.css`.
- **shadcn/ui-style component system**:
  - shadcn config: `components.json` (aliases + registries).
  - UI components live under `src/components/ui/*` (see repo structure in `README.md`).
- UI primitives/libs:
  - `@base-ui/react`, `radix-ui`, `@radix-ui/*`.
  - `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`.
  - Icons: `lucide-react`, `@tabler/icons-react`, `@remixicon/react`.

## 5) State, data fetching, client caching

- **TanStack Query**:
  - Query client + error handling configured in `src/router.tsx`.
  - Devtools wired in `src/routes/__root.tsx` (`@tanstack/react-devtools`, `@tanstack/react-query-devtools`).
- **TanStack Router SSR Query integration**:
  - `setupRouterSsrQueryIntegration` in `src/router.tsx`.

## 6) API layer (RPC + HTTP)

- **oRPC** provides the typed RPC layer:
  - Server context + procedures: `src/orpc/orpc-server.ts`.
  - Route mount point (Fetch handler via Elysia): `src/routes/api/rpc.$.ts`.
  - Routers live in `src/orpc/routes/*` (e.g. `src/orpc/routes/storage.ts`).
- **Elysia** used as a lightweight server router/adapter for Start API routes:
  - Auth route: `src/routes/api/auth/$.ts`.
  - RPC route: `src/routes/api/rpc.$.ts`.
- Traditional HTTP-style API routes exist alongside RPC:
  - AI endpoints under `src/routes/api/ai/*`.
  - Chat endpoints under `src/routes/api/chat/*`.
  - Storage file serving: `src/routes/api/storage/$.ts`.

## 7) Authentication & authorization

- **Better Auth** is the auth system:
  - Server config: `src/lib/auth/auth.ts`.
  - Client config: `src/lib/auth/auth-client.ts`.
  - Mounted under `/api/auth/*` using `auth.handler(request)` in `src/routes/api/auth/$.ts`.
- Plugins enabled in `src/lib/auth/auth.ts`:
  - Organizations/roles: `better-auth/plugins` `organization(...)`, `admin(...)`.
  - Passkeys/WebAuthn: `@better-auth/passkey`.
  - API keys: `apiKey(...)`.
  - 2FA/TOTP: `twoFactor()`.
  - Email OTP: `emailOTP(...)`.
  - Magic links: `magicLink(...)`.
  - OpenAPI: `openAPI()`.
  - Cookies integration for TanStack Start: `tanstackStartCookies()`.
- Permissions model is defined in `src/lib/auth/permissions.ts` (referenced in `src/lib/auth/auth.ts` and `src/lib/auth/auth-client.ts`).

## 8) Database layer

- **Postgres** as primary database.
- **Drizzle ORM**:
  - Connection + drizzle instance: `src/lib/db/index.ts`.
  - Drizzle schema exports: `src/lib/db/schema/index.ts`.
  - Migrations: `src/lib/db/migrations/*` + metadata in `src/lib/db/migrations/meta/*`.
  - Drizzle Kit configs: `drizzle.config.ts`, `drizzle.config.test.ts`.
- **Row-Level Security (RLS)** support:
  - Helpers to author policies: `src/lib/db/rls.ts`.
  - Per-request RLS context setter: `src/lib/db/secure-client.ts` (`set_config('request.user_id' ...)`).
  - RLS tests: `src/lib/db/rls.test.ts`.
- Postgres extensions / indexing features:
  - **pgvector**: schema uses `vector(...)` in `src/lib/db/schema/embeddings.ts`; setup script `scripts/setup-vector-extension.ts`.
  - **ParadeDB / pg_search / bm25**:
    - Test container uses `paradedb/paradedb:latest` in `docker-compose.test.yml`.
    - Setup scripts: `scripts/setup-pg-search.ts`, `scripts/setup-bm25-indexes.ts`, `scripts/setup-paradedb.ts`.

## 9) Storage / Files

- S3-compatible object storage via **Bun S3Client**:
  - Library wrapper: `src/lib/storage/index.ts`.
  - DB metadata table + RLS policies: `src/lib/db/schema/storage.ts`.
  - RPC API for uploads/presign/list/delete: `src/orpc/routes/storage.ts`.
  - Direct file serving by key: `src/routes/api/storage/$.ts`.
- Local/dev integration includes **MinIO**:
  - `docker-compose.yml` provides `minio` service.
  - Helper script: `scripts/start-docker.sh`.
  - Asset upload script: `scripts/upload-to-minio.ts`.

## 10) Email

- Outbound email via **SMTP + nodemailer**:
  - Transport + template rendering: `src/lib/mail.ts`.
  - React Email rendering: `@react-email/render`.
  - Email templates live under `src/components/emails/*` (referenced in `src/lib/auth/auth.ts`).

## 11) AI / LLM

- Two distinct AI stacks are present:
  1) **Vercel AI SDK (`ai`) + `@ai-sdk/openai`**
     - Streaming text: `streamText` used in `src/routes/api/ai/job-chat.ts` and `src/routes/api/ai/job-description.ts`.
  2) **TanStack AI adapters (`@tanstack/ai*`)**
     - Chat endpoint: `src/routes/api/chat/index.ts` and lab route `src/routes/api/lab/block-generator/index.ts` use `@tanstack/ai-openai` adapters (see grep hits).
- CV analysis pipeline entrypoint:
  - HTTP route: `src/routes/api/ai/cv-review.ts`.
  - Implementation: `src/lib/ai/cv-parser` (imported by the route).

## 12) Internationalization

- **i18next** + **react-i18next**:
  - i18n instance: `src/lib/intl/i18n` (imported in `src/router.tsx`, `src/routes/__root.tsx`).
  - Locale resources: `src/lib/intl/locales/*`.

## 13) Testing

- **Vitest**:
  - Config: `vitest.config.ts`.
  - Setup: `vitest.setup.ts` (Testing Library cleanup + i18next mock).
  - Tests exist in `src/**/__tests__/*` and `src/lib/db/rls.test.ts`.
- **Testing Library**: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`.

## 14) Linting / formatting / code quality

- **Ultracite** (oxc-based lint/format) wired via:
  - `package.json` dev deps (`ultracite`, `oxlint`, `oxfmt`).
  - Lint config: `.oxlintrc.json`.
  - Format config: `.oxfmtrc.jsonc`.
  - Pre-commit hook: `.husky/pre-commit` runs `bun x ultracite fix`.

## 15) Deployment / containers / infra

- **Docker**:
  - Multi-stage build using `oven/bun:1`: `Dockerfile`.
  - Compose (dev services): `docker-compose.yml` (MinIO + Redis).
  - Compose (test DB): `docker-compose.test.yml` (ParadeDB/Postgres).
- **Nginx reverse proxy** config: `nginx.conf`.

## 16) Notable repo quirks / TODOs for maintainers

- `package.json` references `backend.ts` in scripts (`bun:start`, `start-docker.sh`), but no `backend.ts` file exists in the repo root (see `find . -name backend.ts`).
  - Actual Start server entry is `src/server.ts` and production start script is `bun run .output/server/index.mjs` (`package.json` script `start`).
  - If a custom Bun server entry is intended, add/restore `backend.ts` or update scripts accordingly.

---

## Quick pointers (where to look first)

- App shell / HTML: `src/routes/__root.tsx`
- Router + QueryClient: `src/router.tsx`
- Auth (server): `src/lib/auth/auth.ts`
- Auth (client): `src/lib/auth/auth-client.ts`
- RPC mount: `src/routes/api/rpc.$.ts`
- oRPC context: `src/orpc/orpc-server.ts`
- DB connection: `src/lib/db/index.ts`
- Storage: `src/lib/storage/index.ts` + `src/orpc/routes/storage.ts`
