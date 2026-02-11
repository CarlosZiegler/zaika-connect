# Codebase Concerns (Tech Debt / Fragility / Security / Perf / Test Gaps)

> Scope: /root/clawd/zaika-connect
> 
> Goal: highlight risky/fragile areas and concrete follow-ups. Items include file paths for quick navigation.

## 1) High-risk security concerns

### 1.1 Bucket enumeration/debug endpoint exposed to any authenticated user
- **File:** `src/orpc/routes/storage.ts` (`listBucket`)
- **Concern:** `listBucket` lists objects directly from the storage bucket “for debugging purposes only”, but is protected only by `protectedProcedure` (any logged-in user). This can expose **all object keys + timestamps** across all tenants/users.
- **Impact:** data leakage, recon (object key patterns), potential privacy/security incident.
- **Follow-up:** remove in production builds, gate behind admin-only authorization, and/or require an explicit feature flag + audit logging.

### 1.2 Organization scoping can be spoofed / lacks membership verification
- **Files:**
  - `src/lib/db/secure-client.ts` (sets `request.org_id` from session)
  - `src/lib/db/rls.test.ts` (explicitly documents that RLS cannot verify membership)
  - `src/orpc/orpc-server.ts` (RLS context derived from `auth.api.getSession`)
  - `src/orpc/routes/storage.ts` (accepts `organizationId` from client)
- **Concern:** RLS policies are driven by session variables `request.user_id` and `request.org_id`. The RLS test suite demonstrates that if an attacker can influence `activeOrganizationId`, they can read org-scoped rows.
- **Additional issue:** `storage.upload` and `presign*` accept `organizationId` from the client and do not verify membership/role before writing metadata rows.
- **Impact:** cross-org access if org context is set incorrectly or is user-controlled.
- **Follow-up:**
  - Ensure `activeOrganizationId` is **server-derived** and **validated per request** (membership check) for org-scoped actions.
  - Prefer `protectedRlsProcedure` for tables protected by RLS, and add explicit membership checks when accepting `organizationId` in inputs.

### 1.3 File listing logic likely incorrect for organization-owned/shared files
- **File:** `src/orpc/routes/storage.ts` (`list`)
- **Concern:** Conditions are built as `AND(userId = me, [purpose], [organizationId = activeOrg])`. This means when an org is active, users will only see files where **both** `userId = me` **and** `organizationId = activeOrg` — likely excluding organization files uploaded by other org members.
- **Impact:** broken UX and pressure to “work around” by weakening authorization later.
- **Follow-up:** Decide intended policy and implement explicitly, e.g. `WHERE (userId = me) OR (organizationId = activeOrg)` (with membership validated).

### 1.4 Verbose logging of auth/Stripe contexts and webhook payload metadata
- **File:** `src/lib/auth/auth.ts`
- **Concern:**
  - `onAPIError` logs `(error, ctx)`; auth context can include request info/headers.
  - Stripe plugin `onEvent` uses `console.log` with event/session metadata.
- **Impact:** PII leakage to logs, secret exposure risk, compliance concerns.
- **Follow-up:** Replace with structured logger + redaction; log only event IDs/types; ensure production log levels and sinks are configured.

### 1.5 Trusted origins configuration may be incomplete/over-permissive
- **File:** `src/lib/auth/auth.ts` (`trustedOrigins: ["https://*.ngrok-free.dev"]`)
- **Concern:** Production origins are not obviously enumerated; wildcard ngrok origin may be too permissive depending on Better Auth’s semantics.
- **Impact:** CSRF / cross-origin issues if misconfigured.
- **Follow-up:** Gate ngrok origin to non-prod, add explicit production origins, add automated config checks.

### 1.6 Email verification disabled
- **File:** `src/lib/auth/auth.ts` (`emailAndPassword.requireEmailVerification: false`)
- **Concern:** Account creation/login without verified email can increase fraud/spam and weakens identity trust.
- **Follow-up:** Enable verification (at least for privileged actions), or add compensating controls.

## 2) Reliability / operational fragility

### 2.1 Stripe plugin is always enabled but env keys are optional
- **File:** `src/lib/auth/auth.ts`
- **Concern:** `createStripePlugin()` throws if Stripe keys/secrets are missing, but `env.STRIPE_SECRET_KEY` / `env.STRIPE_WEBHOOK_SECRET` are optional in `src/lib/env.server.ts`. This mismatch can cause boot-time crashes in environments not using Stripe.
- **Follow-up:** Make Stripe env required when feature enabled, or conditionally include the plugin behind a feature flag.

### 2.2 Session active organization is derived once and may be wrong for multi-org users
- **File:** `src/lib/auth/auth.ts` (`databaseHooks.session.create.before`)
- **Concern:** Picks the first membership found and stores it as `activeOrganizationId`. If user belongs to multiple orgs, this is nondeterministic; if membership changes, session may become stale.
- **Impact:** confusing authorization behavior, potential data exposure if org context is wrong.
- **Follow-up:** Implement explicit org switching with server-side validation; store active org in a dedicated table or signed claim; refresh on each request.

### 2.3 Rate limiting uses in-memory storage
- **File:** `src/lib/auth/auth.ts` (`rateLimit.storage: "memory"`)
- **Concern:** Non-distributed; resets on restart; ineffective behind multiple instances.
- **Follow-up:** Use Redis/DB-backed storage in production.

### 2.4 `dotenv.config()` executes at import time
- **File:** `src/lib/env.server.ts`
- **Concern:** Loading `.env` at import time can cause surprising overrides and makes runtime behavior depend on process working directory.
- **Follow-up:** In production, prefer environment injection (process manager) and load dotenv only in dev/test entrypoints.

## 3) Performance concerns

### 3.1 Devtools appear to be rendered unconditionally
- **File:** `src/routes/__root.tsx`
- **Concern:** `TanStackDevtools` + panels/plugins are included in the root document without an obvious `NODE_ENV`/flag gate.
- **Impact:** bundle size increase, runtime overhead, potential information disclosure.
- **Follow-up:** Gate devtools behind `import.meta.env.DEV` or equivalent.

### 3.2 Potentially heavy server-side prefetch in `beforeLoad`
- **File:** `src/routes/__root.tsx`
- **Concern:** `context.queryClient.prefetchQuery(authQueryOptions())` runs for all requests; if it causes DB hits or auth service calls, it can add latency.
- **Follow-up:** Confirm caching behavior, ensure it’s cheap, and add perf tracing around session fetching.

## 4) Maintainability / tech debt

### 4.1 Type safety workarounds indicate version mismatches
- **Files:**
  - `src/components/ai-elements/tool.tsx`
  - `src/components/ai-elements/confirmation.tsx`
  - `src/components/language-switch.tsx`
  - `src/utils/scripts.ts`
- **Concern:** Multiple `@ts-expect-error` with comments like “state only available in ai v6”. These can become latent runtime bugs during upgrades.
- **Follow-up:** Align versions/types, reduce `ts-expect-error` to narrow shims, add runtime guards.

### 4.2 Deprecated Stripe plan helpers still present
- **File:** `src/lib/stripe/plan.utils.ts`
- **Concern:** Deprecated utilities remain; risk of inconsistent plan display logic across code.
- **Follow-up:** Remove or migrate all call sites; add lint rule/CI check.

### 4.3 Beta/alpha dependencies increase upgrade churn risk
- **File:** `package.json`
- **Concern:** Examples: `vite@8.0.0-beta.*`, `nitro@3.0.1-alpha.*`. Combined with Bun runtime and rapidly evolving TanStack/AI stacks, this can increase breakage frequency.
- **Follow-up:** Pin with care, track upgrade notes, add smoke tests for build/start, and consider stabilizing core runtime deps.

## 5) XSS / HTML injection hotspots (needs review)

- **Files:**
  - `src/components/ai-elements/code-block.tsx` (`dangerouslySetInnerHTML` from Shiki HTML)
  - `src/components/ui/chart.tsx` (`dangerouslySetInnerHTML`)
  - `src/routes/__root.tsx` (inline script)
- **Concern:** Any `dangerouslySetInnerHTML` warrants review. Shiki generally escapes user code, but ensure **untrusted** content cannot inject HTML/JS through transformations/plugins.
- **Follow-up:** Document trust boundaries; add sanitization where content is user-controlled; add tests that attempt HTML injection.

## 6) Test gaps

### 6.1 Sparse unit/integration coverage for high-risk areas
- **Observed tests:**
  - `src/lib/db/rls.test.ts` (good start; focuses on `file` table only)
  - a handful of small unit tests under `src/lib/**/__tests__/*`
- **Gaps:**
  - Authorization tests for ORPC routers (admin vs user, org membership, active org switching).
  - Storage routes tests (especially `listBucket`, `presignCallback`, and org-scoped visibility).
  - Stripe webhook event handling (idempotency, replay safety, signature verification assumptions).
  - Regression tests ensuring devtools/logging are disabled/redacted in production builds.

### 6.2 RLS coverage limited to one table
- **File:** `src/lib/db/rls.test.ts`
- **Concern:** Only `file` table is validated. If other tables rely on RLS, they need similar enforcement tests (SELECT/UPDATE/DELETE across user/org boundaries).

## 7) Quick wins / recommended next steps (ordered)

1. Remove or hard-gate `storage.listBucket` (admin + feature flag + audit logs).
2. Make organization scoping explicit: validate membership on every org-scoped request; stop accepting raw `organizationId` without checks.
3. Gate devtools rendering in `src/routes/__root.tsx` to dev only.
4. Redact logs in `src/lib/auth/auth.ts`; remove `console.log` for Stripe events in production.
5. Resolve env/schema mismatch for Stripe plugin inclusion.
6. Expand tests around ORPC authorization + storage workflows + multi-org sessions.
