# Shri Vanshidhar Gaushala — Website, CMS and Donation Platform

A premium public website, an easy-to-use admin CMS and a provider-independent donation system for
Shri Vanshidhar Gaushala.

> **Status: Phase 2 — engineering foundation.**
> The repository is a working, tested monorepo. There is **no public content** yet: pages, CMS
> modules, authentication and donations arrive in Phases 4–9. Nothing in this repository presents
> placeholder imagery or invented facts as real Gaushala information.

---

## What is here

| Path | Purpose |
|---|---|
| `apps/web` | Next.js (App Router) public website and, later, the admin dashboard |
| `apps/api` | Express 5 API — all business logic and authorisation |
| `packages/shared` | Shared Zod contracts, design tokens, permissions catalogue, domain utilities |
| `packages/config` | Shared TypeScript configuration presets |
| `scripts/` | Local database and maintenance scripts |
| `infra/docker` | Docker Compose for local PostgreSQL |
| `docs/` | Blueprint, architecture, design and delivery documents |

**The web application never talks to PostgreSQL.** Every read and write goes through the API
(`apps/web/src/lib/api-client.ts`). Only `apps/api` holds a database driver.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22.12+ (24 LTS recommended) | Required by Next.js 16 and Prisma 7 |
| pnpm | 11.x | `corepack enable pnpm` or install globally |
| PostgreSQL | 15+ | Provided by Docker *or* by the bundled local server (see below) |

Docker is **optional**. If Docker is unavailable, `pnpm db:start` runs a real PostgreSQL server from
the `embedded-postgres` package, with data in `.local/pgdata`.

---

## Quick start

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Create local environment files
cp apps/api/.env.example        apps/api/.env
cp apps/api/.env.test.example   apps/api/.env.test
cp apps/web/.env.example        apps/web/.env.local

# 3. Start PostgreSQL, create the database roles, migrate and seed
pnpm db:setup

# 4. Run both applications
pnpm dev
```

On Windows PowerShell, copy the files with:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/api/.env.test.example apps/api/.env.test
Copy-Item apps/web/.env.example apps/web/.env.local
```

Then:

- Website — <http://localhost:3000>
- API — <http://localhost:4000>
- Readiness — <http://localhost:4000/health/ready>

The local environment files are git-ignored. Never commit real credentials.

### Using Docker for PostgreSQL instead

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
pnpm db:bootstrap     # roles, databases, privileges
pnpm db:migrate:all   # apply migrations to development and test
pnpm db:seed          # reference data
```

Both paths produce the same schema and the same three database roles.

---

## Verify the foundation

```bash
pnpm lint            # ESLint across every package
pnpm typecheck       # TypeScript, strict, no emit
pnpm test:unit       # fast unit tests (no infrastructure)
pnpm test:integration # real PostgreSQL, real migrations
pnpm build           # production build of both applications
pnpm check:tokens    # CSS tokens and TypeScript tokens agree
pnpm format:check    # Prettier
```

`pnpm test:integration` requires the test database (created by `pnpm db:setup`).

---

## Database roles

The development database uses the same least-privilege model as production, so privilege mistakes
surface early:

| Role | Used by | Privileges |
|---|---|---|
| `postgres` | `scripts/db-bootstrap.mjs` only | Superuser |
| `gaushala_owner` | Prisma CLI (migrations, seed) | Owns the schema; can run DDL |
| `gaushala_app` | The running API | `SELECT/INSERT/UPDATE/DELETE` only — **cannot create or drop tables** |

Integration tests prove the runtime role cannot execute DDL.

---

## Common commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Run web and API with hot reload |
| `pnpm build` | Production build of all packages |
| `pnpm db:start` / `db:stop` / `db:status` | Local PostgreSQL (no Docker required) |
| `pnpm db:setup` | Start + bootstrap + migrate + seed in one step |
| `pnpm db:bootstrap` | Create roles, databases and privileges (idempotent) |
| `pnpm db:migrate` | Create and apply a new migration (`prisma migrate dev`) |
| `pnpm db:migrate:all` | Apply pending migrations to development *and* test |
| `pnpm db:seed` | Seed permissions, roles, default settings (idempotent) |
| `pnpm verify` | Lint + typecheck + token check |

Full setup, troubleshooting and conventions: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

---

## Documentation

| Document | Contents |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, ADRs, folder structure, route maps, RBAC, payment architecture |
| [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md) | PostgreSQL decision, 44-table design, constraints, indexes |
| [`docs/API_DESIGN.md`](docs/API_DESIGN.md) | REST conventions, error model, endpoint catalogue |
| [`docs/SECURITY_PLAN.md`](docs/SECURITY_PLAN.md) | Threat model, controls, risk register |
| [`docs/SEO_PLAN.md`](docs/SEO_PLAN.md) | Technical, local and content SEO |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | The twelve delivery phases |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Colour, typography, spacing, components, responsive and accessibility rules |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Local development guide |
| [`docs/PHASE_2_REPORT.md`](docs/PHASE_2_REPORT.md) | Phase 2 verification report |
| [`docs/Shri_Vanshidhar_Gaushala_Updated_Warm_Earth_Tone_Blueprint.docx`](docs/Shri_Vanshidhar_Gaushala_Updated_Warm_Earth_Tone_Blueprint.docx) | Source-of-truth blueprint |

---

## Design system

The Warm Earth & Terracotta system lives in two synchronised places:

- `packages/shared/src/design/tokens.ts` — typed tokens (palette, type scale, spacing, elevation)
- `apps/web/src/app/globals.css` — Tailwind v4 `@theme` variables

`pnpm check:tokens` fails the build if they diverge, and a unit test fails if any component
hardcodes a hex colour. Contrast ratios are tested: brand terracotta deliberately does **not** meet
AA for small text on ivory, which is why `--color-terracotta-ink` exists.

Components are in `apps/web/src/components/{ui,site,admin}`. Browse them live:

```bash
pnpm dev
# http://localhost:3000/design-system         public components
# http://localhost:3000/design-system/admin   admin language
```

Both reference pages are `noindex` and contain no Gaushala content.

---

## What is intentionally not built yet

Live payments, the CMS, authentication, and all public page content. Donations remain offline until
the IDFC FIRST Bank integration is implemented from official documentation and approved — see
`docs/IMPLEMENTATION_PLAN.md` §8.
