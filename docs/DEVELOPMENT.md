# Development Guide

Practical guide to running, testing and extending the Shri Vanshidhar Gaushala codebase.

**Related:** [`README.md`](../README.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)

---

## 1. Toolchain

| Tool | Version | Why this version |
|---|---|---|
| Node.js | 22.12+ (24 LTS recommended) | Next.js 16 and Prisma 7 both require it |
| pnpm | 11.x | Workspace protocol, `allowBuilds` approval model |
| PostgreSQL | 15+ (18 available locally) | Target database engine (ADR-003) |
| TypeScript | 5.9.x | Pinned: `typescript-eslint` supports `<6.1`, so TypeScript 7 is not yet usable |

Node 24 is what CI and the verification report used.

---

## 2. First-time setup

```bash
pnpm install

cp apps/api/.env.example      apps/api/.env
cp apps/api/.env.test.example apps/api/.env.test
cp apps/web/.env.example      apps/web/.env.local

pnpm db:setup
pnpm dev
```

`pnpm db:setup` runs, in order:

1. `db:start` — start PostgreSQL (Docker not required)
2. build `@gaushala/shared` (the seed imports it)
3. `db:bootstrap` — create roles, databases and privileges
4. `db:migrate:all` — apply migrations to **development and test** databases
5. `db:seed` — permissions, role templates, default settings

Every step is idempotent and safe to re-run.

### Why `allowBuilds` exists

pnpm 11 does not execute dependency install scripts unless the package is approved in
`pnpm-workspace.yaml`. Prisma's engine download, esbuild's binary and the embedded PostgreSQL
binaries all need theirs. Approve a new entry only after reviewing what the script does.

---

## 3. Environment configuration

Configuration is validated with Zod at startup; the process **refuses to boot** on any missing or
malformed value and prints every problem at once.

### API (`apps/api/.env`)

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `development` \| `test` \| `production` |
| `APP_ENV` | yes | `development` \| `test` \| `staging` \| `production` |
| `PORT` / `HOST` | no | Default `4000` / `0.0.0.0` |
| `LOG_LEVEL` / `LOG_PRETTY` | no | JSON logs by default; pretty printing is local-only |
| `TRUST_PROXY` | no | `true` only behind a trusted proxy |
| `SITE_URL` / `CORS_ORIGINS` | yes | Public origin; comma-separated allow-list |
| `ADMIN_DATABASE_URL` | scripts only | Superuser, used by `db:bootstrap` |
| `MIGRATE_DATABASE_URL` | yes | Owner role — Prisma CLI only |
| `DATABASE_URL` | yes | Application role — the API only |
| `APP_VERSION` / `GIT_SHA` | no | Reported by `/version` |
| `SEED_SUPER_ADMIN_EMAIL` | no | Defaults to `admin@localhost.invalid` |

### Web (`apps/web/.env.local`)

| Variable | Required | Notes |
|---|---|---|
| `API_URL` | yes | Server-side base URL of the API |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical public origin |
| `WEB_VERSION` | no | Reported by `/api/health` |

### Built-in safety rules

These are enforced by `apps/api/src/core/config/env.ts` and covered by unit tests:

1. `APP_ENV=production` refuses a local database host (`localhost`, `127.0.0.1`, `postgres`…).
2. `APP_ENV=test` requires a database name ending in `_test`.
3. Any environment outside production refuses a database name containing `prod`.
4. Production requires `NODE_ENV=production` and an `https://` site URL.
5. Error messages never echo secret values.

### Files and precedence

| File | Committed | Purpose |
|---|---|---|
| `apps/api/.env.example` | yes | Development template |
| `apps/api/.env.test.example` | yes | Test template |
| `apps/api/.env.production.example` | yes | Documents required production variables (no values) |
| `apps/api/.env` | **no** | Your local development values |
| `apps/api/.env.test` | **no** | Local test values |
| `apps/web/.env.example` | yes | Web template |
| `apps/web/.env.local` | **no** | Your local web values |

Precedence: real process environment variables (CI) win over file values.

---

## 4. Database workflow

### 4.1 Three roles

| Role | Used by | Privileges |
|---|---|---|
| `postgres` | `scripts/db-bootstrap.mjs` | Superuser |
| `gaushala_owner` | Prisma CLI | Schema owner, DDL, `CREATEDB` for shadow databases |
| `gaushala_app` | The API at runtime | DML only; `CREATE TABLE` and `DROP TABLE` are denied |

New tables created by the owner automatically grant DML to the app role through
`ALTER DEFAULT PRIVILEGES`, so migrations need no manual grant step.

### 4.2 Starting PostgreSQL without Docker

```bash
pnpm db:start    # background server, data in .local/pgdata
pnpm db:status
pnpm db:stop
```

This runs real PostgreSQL binaries from the `embedded-postgres` package. It is a development
convenience, not a production deployment path.

### 4.3 Creating a migration

```bash
# edit apps/api/prisma/schema.prisma, then
pnpm db:migrate          # prisma migrate dev — creates and applies a migration
pnpm db:migrate:all      # apply the same migration to the test database
```

Guidelines:

- Migrations are **forward-only** in production; a fix is a new migration.
- Use **expand → migrate → contract** for changes that must be safe during a rolling deploy.
- Hand-written SQL is expected for `CHECK` constraints, partial indexes, triggers and views. See
  `prisma/migrations/*_identity_constraints/migration.sql` for the pattern.
- Never edit an applied migration. CI and `prisma migrate status` will detect the checksum change.

### 4.4 Resetting local data

```bash
pnpm --filter @gaushala/api exec prisma migrate reset --force
pnpm db:seed
```

This drops and recreates the development database only. It never touches the test database.

### 4.5 Test database

Integration tests run against `gaushala_test`. They load `apps/api/.env.test` (with override), so an
accidental development URL is rejected by the environment guard. The test database is migrated by
`pnpm db:migrate:all`.

---

## 5. Running the applications

```bash
pnpm dev            # both apps, parallel
pnpm --filter @gaushala/web dev
pnpm --filter @gaushala/api dev
```

| Service | URL |
|---|---|
| Website | <http://localhost:3000> |
| API | <http://localhost:4000> |
| API readiness | <http://localhost:4000/health/ready> |
| API liveness | <http://localhost:4000/health/live> |
| Version | <http://localhost:4000/version> |
| Web health | <http://localhost:3000/api/health> |

The home page is now the real Phase 4 homepage (`/`), rendered from the typed content contract in
`apps/web/src/content`. It still returns `noindex` and demonstration content, because organisation copy,
photography and figures are not yet verified. `getHomepageContent()` is the single seam that will call
the API in Phase 6.

Phase 5 added the remaining public routes — `/about`, `/our-work`, `/campaigns` (+ `/[slug]`), `/events`
(+ `/[slug]`), `/news` (+ `/[slug]`), `/gallery`, `/contact` — all rendering from the same content layer.
Unknown detail slugs and unknown `?category=` values return the site 404 rather than an empty page.

`/donate` remains a navigation placeholder: it explains that online giving is not open and collects no
payment details. The contact form validates locally and states plainly that nothing is sent.

---

## 6. Testing

| Layer | Command | Requires |
|---|---|---|
| Unit | `pnpm test:unit` | Nothing (no database, no network) |
| Integration | `pnpm test:integration` | PostgreSQL + migrated test database |

**Unit tests** cover pure logic: environment validation, log redaction, error mapping, health
endpoint behaviour with a stubbed database, UUID/slug/money utilities, permission catalogue
integrity, contrast ratios.

**Integration tests** run against real PostgreSQL and never mock the database:
database connectivity, least-privilege enforcement (the app role cannot run DDL), constraint
behaviour, migration state, seed idempotency, and the real Express app's health and error responses.

Integration test files run serially (`fileParallelism: false`) so database assertions stay
deterministic.

### Adding a test

- Co-locate unit tests with the code (`src/**/*.test.ts`).
- Put integration tests in `apps/api/tests/integration/`.
- Prefer asserting the **denial path** as well as the success path — especially for permissions,
  payments and uploads.

---

## 7. Code conventions

| Rule | Detail |
|---|---|
| Strict TypeScript | `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`; no `any` in domain code |
| ESM | API and shared packages are `"type": "module"`; **relative imports must end in `.js`** (NodeNext resolution) |
| Module shape | `routes → controller → service → repository`; Prisma only inside repositories |
| Contracts | Zod schemas live in `packages/shared/src/contracts` and are the single source for types |
| Error shape | Throw `AppError` subclasses; the central handler produces RFC 9457 problem documents |
| Logging | `pino` with redaction; include `requestId`; never log secrets or personal data |
| Web data access | Only through `apps/web/src/lib/api-client.ts`; the web package has no database dependency |
| Identifiers | UUIDv7 via `uuidv7()` from `@gaushala/shared` — never `uuid()` from Prisma |
| Money | Integer minor units (`amountMinor`), never floating-point rupees |

### Why importing from `@gaushala/shared` needs a build first

`packages/shared` compiles to `dist/`. Turbo handles ordering (`dependsOn: ["^build"]`), but if you
run a package's script directly after editing shared code, rebuild it first:

```bash
pnpm --filter @gaushala/shared build
```

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `spawn EPERM` during `pnpm install` | Dependency install scripts are denied in a restricted sandbox | Run the install in a normal terminal, or approve the specific step |
| `spawn EPERM` running `vitest` / `next build` on Windows | Vite and Next shell out to `exec` for path resolution, blocked by strict sandboxes | Use a normal developer terminal |
| `Cannot find package 'dotenv'` in a root script | Scripts intentionally avoid a dotenv dependency | Scripts use `scripts/load-env.mjs` |
| `Environment variable not found: MIGRATE_DATABASE_URL` | Prisma config loads `.env` from `apps/api` | Create `apps/api/.env` |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL is not running | `pnpm db:start` or start the Docker service |
| Migration checksum mismatch | An applied migration file was edited | Create a new migration instead |
| `relation "_prisma_migrations" does not exist` | Database never migrated | `pnpm db:migrate:all` |
| Readiness returns 503 | Database down or migrations pending | Check `/health/ready` body; run migrations |
| Prisma client types stale | Generated client is out of date | `pnpm --filter @gaushala/api generate` |
| Web shows "API: Unavailable" | API not running on the configured `API_URL` | Start the API; check `apps/web/.env.local` |

### Resetting everything

```bash
pnpm clean
pnpm install
pnpm db:stop
rm -rf .local            # deletes the local PostgreSQL data directory
pnpm db:setup
```

---

## 9. CI

`.github/workflows/ci.yml` runs on every push and pull request:

1. Install with a frozen lockfile
2. Build shared contracts, generate the Prisma client
3. Bootstrap roles, migrate, seed
4. Lint, typecheck, token check, format check
5. Unit tests
6. Integration tests (against `gaushala_test`)
7. Production build of both applications

The CI database is a PostgreSQL service container; no Docker-in-Docker is required.
