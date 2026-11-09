# Phase 2 Completion Report — Engineering Foundation

**Date:** 6 November 2026
**Status:** Complete — awaiting Phase 3 approval
**Blueprint reference:** §14 "Delivery roadmap", Phase 2
**Plan reference:** [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) §7 "Phase 2"

---

## 1. Summary

Phase 2 establishes a working, typed, tested monorepo:

- Two applications (`apps/web` Next.js 16, `apps/api` Express 5) plus three shared packages.
- PostgreSQL 18.6 running locally with a three-role least-privilege model, two applied migrations and
  seeded reference data (103 permissions, 4 role templates, 169 grants, 4 settings groups).
- Strict TypeScript, ESLint, Prettier and a Turborepo pipeline that build, lint, type-check and test
  every package.
- Structured JSON logging with enforced redaction, request correlation and RFC 9457 error responses.
- Health, readiness and version endpoints that behave correctly with the database up **and** down.
- 106 executed tests (82 unit, 24 integration against real PostgreSQL).
- GitHub Actions CI mirroring the local pipeline.

No frontend pages, CMS modules, authentication or payment code were built. The public page is an
explicitly `noindex` foundation page, replaced in Phase 4.

---

## 2. Scope delivered

Every item in the Phase 2 brief, with where it lives and how it was verified.

| # | Requirement | Delivered | Evidence |
|---|---|---|---|
| 1 | Approved monorepo folder structure | `apps/`, `packages/`, `scripts/`, `infra/`, `docs/`, `.github/` | Folder tree matches `ARCHITECTURE.md` §6 |
| 2 | Next.js App Router + TypeScript | `apps/web` with `src/app`, route groups ready for `(site)`/`(admin)` | `next build` → 3 routes compiled |
| 3 | Express 5 + TypeScript | `apps/api` with env, logging, HTTP core, health module | Server booted from `dist/index.js`, endpoints probed |
| 4 | Shared contracts + Zod schemas | `packages/shared/src/contracts` (health, problem details) | Consumed by API and web; parsed in tests |
| 5 | PostgreSQL + Prisma | Prisma 7.10.1, `@prisma/adapter-pg`, generated client | `/health/ready` reports `database: up` |
| 6 | Migrations + safe dev workflow | `prisma/migrations` (2), role bootstrap, scripted setup | Applied to dev *and* test DB; verified via `_prisma_migrations` |
| 7 | Env validation + dev/test/prod examples | `core/config/env.ts` + `.env.example`, `.env.test.example`, `.env.production.example` | 15 env unit tests, incl. production/test guards |
| 8 | ESLint, Prettier, TS strict | Root flat config, shared tsconfig presets | `pnpm lint`, `pnpm typecheck`, `pnpm format:check` all pass |
| 9 | Structured logging + request IDs | `pino` with redaction, `pino-http`, request-id middleware | 7 logging tests; live `x-request-id` observed |
| 10 | Health + readiness endpoints | `/health/live`, `/health/ready`, `/version` | 200 with DB up, **503 with DB stopped**, recovery to 200 |
| 11 | Docker Compose for local deps | `infra/docker/docker-compose.dev.yml` (PostgreSQL 17) | Provided; Docker daemon unavailable here so the embedded server was used |
| 12 | Unit + integration test foundations | Vitest, two configs, `tests/integration`, disposable test DB | 82 unit + 24 integration tests |
| 13 | CI for lint, typecheck, tests, build | `.github/workflows/ci.yml` | Mirrors the locally executed pipeline |
| 14 | Setup/installation/env/startup docs | `README.md`, `docs/DEVELOPMENT.md` | Quick start verified end-to-end |

### Architectural constraints honoured

| Constraint | How |
|---|---|
| Web must not access PostgreSQL | `apps/web` has no database driver; data only through `src/lib/api-client.ts` (`server-only`) |
| All operations through the API | Home page calls `GET /health/live` over HTTP; verified rendering "Reachable" |
| Shared typed contracts | Zod schemas in `@gaushala/shared`; API response shapes parsed by the web client and tests |
| Module isolation | `routes → controller → service → repository` convention documented; `core/` for cross-cutting |
| No secrets committed | Only `*.example` files are tracked; `.env*` git-ignored |
| No MongoDB | PostgreSQL only |
| No microservices | One API + one worker-capable codebase |
| No live payments | No payment code at all this phase |
| Not all 44 tables | 7 models only (identity + settings), explicitly marked as the Phase 2 baseline |
| No fake Gaushala facts | Seed contains no statistics, testimonials or contact details; all such values are `null`/empty |
| Design tokens preserved | Palette identical to the blueprint, verified by `pnpm check:tokens` and contrast tests |

---

## 3. Technology actually used

| Component | Version | Notes |
|---|---|---|
| Node.js | 24.21.0 | CI targets `24` |
| pnpm | 11.28.5 | `allowBuilds` approval model |
| Next.js | 16.4.5 | App Router, Turbopack build |
| React | 19.3.1 | — |
| Express | 5.3.0 | Native async error propagation |
| Prisma | 7.10.1 | ESM-only, driver adapter, `prisma.config.ts` |
| `@prisma/adapter-pg` | 7.10.1 | Required by Prisma 7 |
| Zod | 4.6.7 | Contracts and env validation |
| Pino / pino-http | 10.4.0 / 11.0.0 | Structured logging |
| Vitest | 5.1.0 | Unit + integration |
| Tailwind CSS | 4.3.4 | CSS-first `@theme` tokens |
| TypeScript | 5.9.3 | Pinned — see §7 deviation 4 |
| PostgreSQL | 18.6 | Local server via `embedded-postgres` |

---

## 4. Final structure

```text
gaushala-website/
├─ apps/
│  ├─ api/
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma                  # 7 models (Phase 2 baseline)
│  │  │  ├─ seed.ts                        # idempotent reference data
│  │  │  └─ migrations/
│  │  │     ├─ 20261106001919_init/
│  │  │     └─ 20261106054924_identity_constraints/
│  │  ├─ src/
│  │  │  ├─ core/config/env.ts             # Zod-validated configuration
│  │  │  ├─ core/logging/logger.ts         # pino + redaction list
│  │  │  ├─ core/db/prisma.ts, health.ts   # client factory, probes
│  │  │  ├─ core/http/                     # errors, error-handler, 404,
│  │  │  │                                 # request-id, security-headers, cors
│  │  │  ├─ modules/health/health.routes.ts
│  │  │  ├─ routes/v1.ts
│  │  │  ├─ app.ts, index.ts
│  │  │  ├─ types/express.d.ts
│  │  │  └─ generated/prisma/              # git-ignored, built by `generate`
│  │  ├─ tests/integration/                # database, health, seed
│  │  ├─ prisma.config.ts, tsconfig*.json, vitest*.config.ts
│  │  └─ .env.example, .env.test.example, .env.production.example
│  └─ web/
│     ├─ src/app/{layout.tsx,page.tsx,globals.css,api/health/route.ts}
│     ├─ src/lib/{api-client.ts,server-env.ts}
│     ├─ next.config.ts, postcss.config.mjs, tsconfig.json
│     └─ .env.example
├─ packages/
│  ├─ config/tsconfig/{base,node,nextjs}.json
│  └─ shared/src/
│     ├─ contracts/{health,problem}.ts
│     ├─ design/{tokens,contrast}.ts
│     ├─ money/money.ts
│     ├─ permissions/permissions.ts
│     ├─ utils/{uuid,slug}.ts
│     └─ constants/site.ts
├─ scripts/                                # dev-db, db-bootstrap, db-migrate,
│                                          # load-env, check-tokens, clean
├─ infra/docker/docker-compose.dev.yml
├─ .github/workflows/ci.yml
├─ docs/                                   # Phase 1 docs + DEVELOPMENT + this report
├─ eslint.config.mjs, .prettierrc.json, .editorconfig, .gitattributes
├─ turbo.json, pnpm-workspace.yaml, tsconfig.json, package.json
└─ README.md
```

---

## 5. Database

### 5.1 Roles

| Role | Purpose | Verified behaviour |
|---|---|---|
| `gaushala_owner` | Prisma CLI migrations/seed | Owns schema, `CREATEDB` for shadow DB |
| `gaushala_app` | API runtime | Integration test proves `CREATE TABLE` and `DROP TABLE` are **denied** |

### 5.2 Migrations applied

| Migration | Contents |
|---|---|
| `20261106001919_init` | 7 tables + 2 enums, generated from `schema.prisma` |
| `20261106054924_identity_constraints` | 7 hand-written `CHECK` constraints (lowercase email, name length, active-requires-password, role key format, permission key format, settings must be a JSON object, override reason required) |

Both applied to `gaushala_dev` and `gaushala_test`; `_prisma_migrations` reports 2 applied, 0 pending.

### 5.3 Seeded reference data

```
permissions=103 catalogued / 103 stored
roles=4 templates / 4 stored (169 grants)
settings=4 groups
users=1  super admin=admin@localhost.invalid
```

Idempotency proven by an integration test that runs the seed twice and compares every count, plus a
test that an administrator-edited setting is never overwritten.

---

## 6. Verification results

All commands below were executed in this environment. "Escalated" marks the steps that a restricted
file sandbox blocked (child-process spawning) and that were re-run with wider permissions — see §8.

### 6.1 Builds

| Check | Command | Result |
|---|---|---|
| Shared package build | `pnpm --filter @gaushala/shared build` | ✅ `dist/` emitted (JS + d.ts) |
| API build | `pnpm --filter @gaushala/api build` | ✅ `dist/index.js` + compiled generated client |
| Web build | `pnpm --filter @gaushala/web build` | ✅ 3 routes: `/` (dynamic), `/_not-found`, `/api/health` |
| Full pipeline build | `pnpm build` (turbo) | ✅ 4/4 tasks |

### 6.2 Static checks

| Check | Command | Result |
|---|---|---|
| TypeScript (all packages) | `pnpm typecheck` (turbo) | ✅ 5/5 tasks |
| ESLint (all packages) | `pnpm lint` (turbo) | ✅ 3/3 tasks |
| Prettier | `pnpm format:check` | ✅ "All matched files use Prettier code style" |
| Design-token parity | `pnpm check:tokens` | ✅ 9 palette colours match CSS and TS |
| Prisma client generation | `pnpm --filter @gaushala/api generate` | ✅ generated in 68 ms |

### 6.3 Tests

| Suite | Files | Tests | Result |
|---|---:|---:|---|
| `@gaushala/shared` unit | 5 | 44 | ✅ all pass |
| `@gaushala/api` unit | 3 | 38 | ✅ all pass |
| `@gaushala/api` integration (real PostgreSQL) | 3 | 24 | ✅ all pass |
| **Total** | **11** | **106** | ✅ |

Coverage of the foundation:

- **Shared unit** — UUIDv7 format/ordering/timestamp round-trip, slug rules and reserved slugs,
  money conversion and Indian formatting, permission catalogue integrity, role-template least
  privilege, palette values and WCAG contrast ratios.
- **API unit** — 15 environment-validation cases (defaults, guards, no secret leakage), 7 log
  redaction cases, 16 HTTP cases (liveness, readiness up/down, version, 404 problem document,
  malformed JSON, request-id handling, security headers, CORS).
- **API integration** — real connectivity, application-role identity, DDL denial, table presence,
  constraint enforcement (lowercase email, duplicate email, role key format), cascade behaviour,
  readiness against the real database, seed idempotency, and the catalogue/seed agreement.

### 6.4 Live endpoint verification

Server booted from the compiled build (`node dist/index.js`):

| Request | Status | Observed |
|---|---|---|
| `GET /health/live` | 200 | `{"status":"ok","service":"gaushala-api"}` |
| `GET /health/ready` | 200 | `database: up (83 ms)`, `migrations: up (applied 2, pending 0)` |
| `GET /version` | 200 | version, environment, `nodeVersion`, `gitSha: null` |
| `GET /api/v1` | 200 | discovery document |
| `GET /nope` | 404 | `application/problem+json`, `code: NOT_FOUND`, request id echoed |

UUIDv7 request IDs observed: `01a1ae3d-63d9-70dc-…` (version nibble `7`, variant bits correct).

### 6.5 Failure-mode verification

| Scenario | Expected | Observed |
|---|---|---|
| `pnpm dev` starts both apps | Both ports listening | 3000 ✅, 4000 ✅ |
| PostgreSQL stopped | `/health/ready` → 503, `/health/live` → 200 | 503 `database: down` + `migrations: skipped`; live still 200 ✅ |
| No credential leakage in failure | No connection string in body | Body contained only `PrismaClientKnownRequestError` ✅ |
| PostgreSQL restarted | readiness recovers without restarting the API | 200 with `database: up` ✅ |
| Web renders through the API | Page shows API "Reachable" | Confirmed in server-rendered HTML ✅ |
| Env guard: missing `DATABASE_URL` | Boot refused with clear message | Unit test ✅ |
| Env guard: `APP_ENV=test` + non-`_test` DB | Refused | Unit test ✅ |
| Env guard: production + localhost DB | Refused | Unit test ✅ |

### 6.6 Database state at completion

```
db=gaushala_dev  | tables=8 (7 models + _prisma_migrations) | roles=gaushala_app,gaushala_owner
                 | permissions=103 | users=1
                 20261106001919_init APPLIED
                 20261106054924_identity_constraints APPLIED

db=gaushala_test | tables=8 | permissions=103 | users=1 (seeded by the seed test)
```

---

## 7. Deviations from the Phase 1 plan

Each deviation is a deliberate decision, not an omission.

| # | Plan said | Delivered | Why |
|---|---|---|---|
| 1 | Docker Compose with PostgreSQL, Redis, MinIO, Mailpit | Compose with **PostgreSQL only** | Nothing in Phase 2 uses Redis, object storage or email. Unused services are attack surface and maintenance noise. They arrive with the phases that consume them (6, 7, 9). Recorded as a doc note in the compose file. |
| 2 | Redis and in-memory cache/queue behind one interface | **Deferred** | Depends on nothing shipped yet; belongs with rate limiting (Phase 7) and background jobs (Phase 6). |
| 3 | Prisma (version unspecified) | **Prisma 7.10.1** | Current stable with `prisma-client` generator. Consequences handled: ESM-only, required driver adapter, `prisma.config.ts`, generated client under `src/generated`. The `latest` npm tag points at an 8.0 release candidate; 7.10.1 is the newest stable and is pinned deliberately. |
| 4 | TypeScript (latest) | **TypeScript 5.9.3** | `typescript-eslint@8` declares peer support `>=4.8.4 <6.1`, so TypeScript 7 would break linting. Revisit when the toolchain supports it. |
| 5 | Seed: "super admin with credentials from environment, forced password change" | Super admin seeded **INVITED without a password** | Password hashing is Argon2id, which lands with the auth module in Phase 7. Seeding a hash now would mean shipping a password path before its module exists. The account cannot log in until Phase 7, which is correct. |
| 6 | Database baseline | **7 models**, not 44 | Explicit instruction: do not implement all tables prematurely. Content tables belong to Phase 6, donations to Phase 9. The baseline exists to prove relations, enums, constraints and seeding. |
| 7 | — | Added **`embedded-postgres`** (root dev dependency, beta) | The environment had no Docker daemon and no PostgreSQL. This runs a real PostgreSQL 18.6 server for development without Docker. It is a dev-only convenience; the documented primary path remains Docker/Compose. |
| 8 | — | `scripts/load-env.mjs` instead of `dotenv` in root scripts | Root scripts must work immediately after install without adding a runtime dependency to the root manifest. |
| 9 | — | Two migrations rather than one | The second is the hand-written constraint migration required by ADR-004 (Prisma cannot express these `CHECK`s). |

---

## 8. Environment notes (not project defects)

This run happened inside a restricted Windows sandbox. Four operations were blocked by it and were
executed once with wider permissions; each is marked below. They are properties of the environment,
not of the repository, and do not affect CI (Linux) or a normal developer machine.

| Operation | Sandbox symptom | Resolution |
|---|---|---|
| `pnpm install` | Dependency postinstall scripts denied (`spawn EPERM`) | Run once with wider permissions; build approval recorded in `pnpm-workspace.yaml` |
| Starting local PostgreSQL | `pg_ctl` spawn denied | Database run as a long-lived background service |
| `prisma migrate`, `db:seed` | Prisma schema engine spawn denied | Run with wider permissions |
| `vitest`, `next build`, `pnpm dev` | Vite/Next spawn child processes for path resolution and workers | Run with wider permissions |

Additionally, `curl.exe` and PowerShell's `Invoke-WebRequest` fail on TLS in this sandbox
(`schannel` credential error); HTTP probes were performed with Node's `http` module instead.

**For a normal developer machine or CI, none of this applies** — `pnpm install && pnpm dev` works as
documented in the README.

---

## 9. Security posture at the end of Phase 2

Implemented:

- Zod validation of every environment variable, with fail-fast startup and guards that prevent
  test/dev configurations from pointing at production.
- Three-role database model; the runtime role cannot run DDL (tested).
- Database `CHECK` constraints for identity invariants.
- Log redaction for cookies, authorization headers, tokens, secrets, passwords and PAN, with tests.
- `HttpOnly`-ready cookie strategy reserved for Phase 7 (no session code yet).
- Security headers on every API response (nosniff, frame denial, referrer policy, permissions policy,
  strict CSP for JSON, HSTS in production only).
- CORS restricted to configured origins, credentials allowed only for them.
- RFC 9457 error responses that never expose stack traces, SQL or internals.
- Request correlation IDs (UUIDv7) on every response and log line.

Not yet implemented (by design, with the phase that owns it):

| Missing control | Phase |
|---|---|
| Authentication, sessions, CSRF, MFA | 7 |
| RBAC enforcement and route audit | 7 |
| Rate limiting and bot controls | 6/7 |
| Upload validation | 6 |
| Payment verification | 9 |
| Web application CSP | 11 |

---

## 10. Unresolved issues and notes for Phase 3

| # | Item | Severity | Note |
|---|---|---|---|
| 1 | Web app has baseline security headers but **no CSP yet** | Medium | Deliberate; a nonce-based CSP is a Phase 11 deliverable and would break Next's dev tooling if added now |
| 2 | `embedded-postgres` is a **beta** package | Low | Development-only fallback; Docker/Compose remains the documented path. Pin reviewed at each upgrade |
| 3 | `.local/pgdata` is a real database directory in the workspace | Low | Git-ignored; `pnpm clean` does not delete it (data safety). Remove manually to reset |
| 4 | The Phase 2 home page is `noindex` | Info | **Phase 4 must remove the `robots` override** in `apps/web/src/app/layout.tsx` |
| 5 | `apps/api/src/generated/prisma` is git-ignored | Info | Run `pnpm --filter @gaushala/api generate` after cloning (CI and `pnpm build` do it automatically) |
| 6 | Design-system components do not exist yet | Info | Phase 3; only tokens, contrast utilities and a foundation page exist |
| 7 | `pnpm dev` runs both apps in one Turbo UI | Info | Individual app scripts documented in `DEVELOPMENT.md` |

No blocking issues. No known defects in delivered code.

---

## 11. Phase 2 acceptance criteria (from `IMPLEMENTATION_PLAN.md`)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 2.1 | `pnpm install && pnpm dev` starts both apps | ✅ | install succeeded; `pnpm dev` bound 3000 and 4000 and served requests |
| 2.2 | `/health/live` returns 200 without dependencies | ✅ | returned 200 with PostgreSQL stopped |
| 2.3 | `/health/ready` 200 when healthy, 503 when the database is down | ✅ | 200 → stop DB → 503 → restart DB → 200 |
| 2.4 | Baseline migration applies to an empty database and re-runs safely | ✅ | `migrate deploy` on both databases; second run reports "No pending migrations" |
| 2.5 | Seed is idempotent | ✅ | integration test runs it twice and compares all counts |
| 2.6 | Missing/invalid env var prevents boot with a clear message | ✅ | `EnvValidationError` lists every issue; 15 unit tests |
| 2.7 | JSON logs with request id and redaction | ✅ | 7 redaction tests; `x-request-id` observed on live responses |
| 2.8 | CI runs lint, typecheck, unit and integration tests | ✅ | workflow written; identical commands executed locally with the same results |
| 2.9 | `pnpm build` succeeds for both apps | ✅ | turbo build 4/4 tasks |
| 2.10 | Docker Compose brings up the local dependencies | ⚠️ Partial | Compose file provided and reviewed, but **the Docker daemon is not installed in this environment**, so `docker compose up` could not be executed. PostgreSQL was run through the embedded fallback instead, with identical roles and schema |

Criterion 2.10 is the only one not fully demonstrated here, for an environmental reason. The
compose file is standard `postgres:17-alpine` with a health check; the same bootstrap and migration
scripts are used by both paths, so the Docker path exercises identical code.

---

## 12. Commands executed (summary)

```bash
pnpm install                                 # 572 packages
pnpm --filter @gaushala/shared build         # dist/
pnpm --filter @gaushala/api generate         # Prisma client
node scripts/db-bootstrap.mjs                # roles + 2 databases + grants
node scripts/db-migrate.mjs                  # 2 migrations × 2 databases
pnpm --filter @gaushala/api exec prisma migrate dev --name init
pnpm --filter @gaushala/api db:seed          # reference data
pnpm lint                                    # 3/3 tasks
pnpm typecheck                               # 5/5 tasks
pnpm format:check                            # clean
pnpm check:tokens                            # 9 colours match
pnpm test:unit                               # 82 tests
pnpm test:integration                        # 24 tests
pnpm build                                   # 4/4 tasks
pnpm dev                                     # both apps live
node dist/index.js                           # compiled server, endpoints probed
```

---

## 13. Phase gate

| Gate item | Status |
|---|---|
| Changed-file summary | §4 and §14 |
| Acceptance evidence | §6, §11 |
| Test report | §6.3 |
| Known issues | §10 |
| Decisions log | §7 |
| Documentation updated | `README.md`, `docs/DEVELOPMENT.md`, this report |

**Phase 2 is complete. Phase 3 (design system) has not been started.**

---

## 14. Changed files

New repository — every file below was created in Phase 2. No existing file was modified except the
Phase 1 documents, which were left untouched.

**Root (14)** — `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`,
`eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.gitignore`,
`.gitattributes`, `.npmrc`, `README.md`, `.github/workflows/ci.yml`, `pnpm-lock.yaml` (generated).

**packages/config (4)** — `package.json`, `tsconfig/base.json`, `tsconfig/node.json`,
`tsconfig/nextjs.json`.

**packages/shared (14)** — `package.json`, `tsconfig.json`, `tsconfig.build.json`,
`vitest.config.ts`, and `src/`: `index.ts`, `constants/site.ts`, `contracts/health.ts`,
`contracts/problem.ts`, `contracts/index.ts`, `design/tokens.ts`, `design/tokens.test.ts`,
`design/contrast.ts`, `money/money.ts`, `money/money.test.ts`, `permissions/permissions.ts`,
`permissions/permissions.test.ts`, `utils/uuid.ts`, `utils/uuid.test.ts`, `utils/slug.ts`,
`utils/slug.test.ts`.

**apps/api (24)** — `package.json`, `tsconfig.json`, `tsconfig.build.json`, `vitest.config.ts`,
`vitest.integration.config.ts`, `prisma.config.ts`, `.env.example`, `.env.test.example`,
`.env.production.example`, `prisma/schema.prisma`, `prisma/seed.ts`,
`prisma/migrations/migration_lock.toml`, two migration directories with `migration.sql`,
`src/index.ts`, `src/app.ts`, `src/app.test.ts`, `src/routes/v1.ts`,
`src/modules/health/health.routes.ts`, `src/core/config/env.ts`, `src/core/config/env.test.ts`,
`src/core/logging/logger.ts`, `src/core/logging/logger.test.ts`, `src/core/http/{errors,error-handler,not-found,request-id,security-headers,cors}.ts`,
`src/core/db/{prisma,health}.ts`, `src/types/express.d.ts`,
`tests/setup.integration.ts`, `tests/integration/{helpers,database,health,seed}.test.ts`.

**apps/web (9)** — `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`,
`.env.example`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`,
`src/app/api/health/route.ts`, `src/lib/server-env.ts`, `src/lib/api-client.ts`.

**scripts (6)** — `dev-db.mjs`, `db-bootstrap.mjs`, `db-migrate.mjs`, `load-env.mjs`,
`check-tokens.mjs`, `clean.mjs`.

**infra (1)** — `infra/docker/docker-compose.dev.yml`.

**docs (2 new)** — `docs/DEVELOPMENT.md`, `docs/PHASE_2_REPORT.md`.
