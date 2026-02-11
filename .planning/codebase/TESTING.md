# Testing Conventions (zaika-connect)

> This document summarizes how tests are currently written and run in this repo.

## 1) Test runner & environment

- Runner: **Vitest** (`package.json` scripts, `vitest.config.ts`).
- DOM environment: **jsdom** (`environment: "jsdom"` in `vitest.config.ts`).
- Globals enabled: `globals: true` (so `describe/it/expect` are available without importing, though many tests still import explicitly).
- Setup file: `vitest.setup.ts`
  - Adds `@testing-library/jest-dom`
  - Runs `cleanup()` after each test
  - Mocks `i18next` to provide a stable `t(key) => key` translation behavior

## 2) Key commands

From `package.json`:

- `bun run test` → `vitest`
- `bun run test:watch` → `vitest watch`
- `bun run test:ui` → `vitest --ui`
- `bun run test:coverage` → `vitest --coverage`

Targeted/integration-like scripts:

- `bun run test:db` → `vitest run src/lib/db/rls.test.ts`
- `bun run test:benchmark` (and small/large variants) → runs `src/lib/search/__tests__/search-benchmark.test.ts` with `BENCHMARK_SIZE=...`

## 3) Test file location & naming

Vitest include patterns (`vitest.config.ts`):

- `src/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
- `**/*.test.ts`

Observed structure:

- Unit/utility tests under `src/lib/__tests__/...`
  - Examples:
    - `src/lib/__tests__/utils.test.ts`
    - `src/lib/__tests__/format-date.test.ts`
    - `src/lib/__tests__/device-utils.test.ts`
- Feature-specific tests under feature folders:
  - `src/lib/payment/__tests__/plan.utils.test.ts`
  - `src/orpc/__tests__/error-normalization.test.ts`
  - `src/orpc/__tests__/error-message.test.ts`
- Database/RLS enforcement test:
  - `src/lib/db/rls.test.ts`

## 4) Coverage configuration

Coverage (`vitest.config.ts`):

- Provider: `v8`
- Reporters: `text`, `json`, `html`
- Excludes:
  - `node_modules/`, `dist/`, `.output/`, `coverage/`
  - All test files and `__tests__` directories

## 5) Assertion & style patterns (observed)

### Describe/it naming

- Test suites commonly describe *behavior*.
  - Example suite names:
    - `"plan display behavior"` / `"free plan detection behavior"` (`src/lib/payment/__tests__/plan.utils.test.ts`)
    - `"toUserSafeORPCError"` (`src/orpc/__tests__/error-normalization.test.ts`)

### Arrange/Act/Assert is informal but clear

- Tests are typically short, explicit, and use direct expectations like `toBe`, `toEqual`, `toMatchObject`.

### Mocks

- Use `vi.fn()` for stubs.
  - Example: translation mock `mockT` in `src/lib/payment/__tests__/plan.utils.test.ts`.
- Global i18n mock is in `vitest.setup.ts`.
- Module-level mocks use `vi.mock(...)` (see `vitest.setup.ts` and project `TESTING.md`).

## 6) React Testing Library usage

Testing Library is configured (see `vitest.setup.ts`), and cleanup is automatic.

Dependencies present in `package.json`:

- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`

(Actual component/hook test usage exists in the repo-level `TESTING.md`; hook tests may live under `src/hooks/__tests__/...` when present.)

## 7) Integration-style DB tests (RLS)

File: `src/lib/db/rls.test.ts`

- Uses Postgres via `pg` + Drizzle (`drizzle-orm/node-postgres`).
- Spins up infra via Docker Compose:
  - `docker compose -f docker-compose.test.yml up -d --wait`
  - Tears down with `docker compose -f docker-compose.test.yml down -v`
- Applies schema via Drizzle Kit:
  - `bunx drizzle-kit push --config drizzle.config.test.ts`
- Uses extended timeout for setup: `beforeAll(..., 120_000)`.
- Implements RLS session simulation by setting `request.user_id` and `request.org_id` via `set_config` inside a transaction.

Implication: keep DB tests isolated, deterministic, and accept that they’re slower than pure unit tests.

## 8) Guidance for adding new tests (match existing patterns)

- Prefer behavior-focused names: describe *what should happen*.
- Keep individual tests small (one rule/behavior per `it`).
- Use `@/` alias imports (enabled by `vite-tsconfig-paths` in `vitest.config.ts`).
- If interacting with i18n, rely on the existing `i18next` mock (keys return themselves) unless a test needs real translations.
- For new integration tests:
  - Use explicit timeouts.
  - Clean up external resources in `afterAll`.
  - Avoid coupling to internal implementation details; assert observable outcomes.

## 9) Reference docs already in repo

- Project testing guide: `TESTING.md`
- Vitest configuration: `vitest.config.ts`, `vitest.setup.ts`
- Example test suites:
  - `src/lib/payment/__tests__/plan.utils.test.ts`
  - `src/orpc/__tests__/error-normalization.test.ts`
  - `src/lib/db/rls.test.ts`
