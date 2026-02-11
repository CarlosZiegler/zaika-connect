# Codebase Conventions (zaika-connect)

> Source of truth is the repo configuration and existing code. This document summarizes the *current* conventions.

## 1) Toolchain & project type

- Runtime/package manager: **Bun** (see `package.json`, `bun.lock`, `bunfig.toml`).
- Module system: **ESM** (`"type": "module"` in `package.json`).
- Language: **TypeScript** with strict type checking (`tsconfig.json`).
- Frontend stack: React + TanStack Router/Query (see imports throughout `src/`).

## 2) Formatting (autoformat)

**Formatter**: `oxfmt` (via **Ultracite**) with an opinionated config.

- Config: `.oxfmtrc.jsonc`
  - `printWidth: 80`
  - `tabWidth: 2`, spaces (no tabs)
  - `semi: true`
  - `singleQuote: false` (double quotes)
  - `trailingComma: "es5"`
  - `endOfLine: "lf"`
  - **Import sorting enabled**: `experimentalSortImports` with `newlinesBetween: true`, `order: "asc"`, `ignoreCase: true`
  - **package.json sorting enabled**: `experimentalSortPackageJson: true`

**Autofix on commit**:

- Hook: `.husky/pre-commit` runs `bun x ultracite fix` on staged files (and attempts to preserve partial staging).

### What this implies in code

- Prefer letting the formatter decide line breaks and wrapping; don’t manually fight it.
- Keep lines <= 80 chars when reasonable (the formatter will wrap).

## 3) Linting

**Linter**: `oxlint` (via Ultracite presets).

- Config: `.oxlintrc.json`
  - Extends:
    - `ultracite/oxlint/core`
    - `ultracite/oxlint/react`
    - `ultracite/oxlint/remix`

Practical effect: lean on Ultracite’s defaults for TS/React correctness, unused imports, common pitfalls, etc.

## 4) TypeScript configuration

- Config: `tsconfig.json`
  - `strict: true` (and `strictNullChecks: true`)
  - `moduleResolution: "Bundler"`
  - `target: "ES2022"`
  - Path alias: `@/*` → `./src/*`

### Import alias convention

- Use the `@/` alias for internal modules.
  - Example: `src/features/applications/application-form.tsx` imports UI and oRPC client via `@/components/...` and `@/orpc/...`.

## 5) Imports & module organization

Observed import style (matches formatter sorting + existing code):

- **Group by origin** with blank lines between groups:
  1. external packages
  2. internal alias imports (`@/...`)
  3. relative imports (when present)
- Use `import type { ... }` for type-only imports.
  - Example: `src/lib/payment/__tests__/plan.utils.test.ts` starts with `import type { TFunction } from "i18next";`.

## 6) React & UI code style

- Prefer named exports for components.
  - Example: `export function ApplicationForm(...)` (`src/features/applications/application-form.tsx`).
- Local constants in `SCREAMING_SNAKE_CASE`.
  - Example: `MAX_FILE_SIZE`, `ACCEPTED_FILE_TYPES`.
- Local helper functions often defined inline within the module (e.g., `validateForm`, `fileToBase64`) and typed.
- JSX: conditional rendering uses ternaries returning `null` when empty.
- Accessibility attributes are used when relevant (e.g., `aria-invalid`, `aria-describedby`).

## 7) i18n conventions

- `react-i18next` is used; components call `useTranslation()` and use `t("KEY")`.
  - Example: `src/features/applications/application-form.tsx`.

## 8) Node/builtin imports

- Node builtins are imported using the `node:` scheme.
  - Example: `src/lib/db/rls.test.ts` imports `node:child_process`, `node:fs`, `node:path`, `node:util`.

## 9) General code style heuristics (observed)

- Prefer explicit typing at module boundaries and for tricky objects (e.g., sessions, test fixtures).
- Use small, readable blocks; keep behavior obvious.
- When returning booleans, patterns like `return Object.keys(newErrors).length === 0;` are used.

## 10) Where to look next

- Formatting/lint enforcement: `.oxfmtrc.jsonc`, `.oxlintrc.json`, `.husky/pre-commit`
- TS alias & strictness: `tsconfig.json`
- Testing conventions: see `.planning/codebase/TESTING.md` and `vitest.config.ts`
