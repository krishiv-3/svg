# Project Audit — Phases 1 to 5

**Project:** Shri Vanshidhar Gaushala website
**Audit date:** 6 November 2026
**Scope:** Phases 1–5 (discovery/architecture → remaining public pages)
**Auditor stance:** independent inspection. Every claim below is backed by a command that was actually run, a file that was read, or a browser session that was loaded. Where something could not be established, it says so.

---

## 0. Method and limits

### What was executed

| Command | Purpose |
|---|---|
| `pnpm typecheck` | TypeScript across all workspaces |
| `pnpm lint` | ESLint across all workspaces |
| `pnpm format:check` | Prettier (check only — no files rewritten) |
| `pnpm check:tokens` | Design-token consistency |
| `pnpm test:unit` | 202 unit tests |
| `pnpm test:integration` | 24 integration tests against real PostgreSQL |
| `pnpm turbo run build --force` | Clean (non-cached) production build |
| `pnpm check:responsive` | 12 routes × 6 widths via headless Chrome/CDP |
| `pnpm check:console` | Console + network errors on 7 routes |
| `pnpm audit` | Dependency advisories |
| Read-only HTTP probe | Status, metadata, headers, payload per route |
| Read-only DOM probe | Rendered landmarks, headings, skip link, 404 behaviour |

### What was **not** done, and why

| Not done | Reason |
|---|---|
| `pnpm db:migrate`, `db:reset`, `db:seed` | Forbidden by the audit rules (migrations/destructive commands). The existing migrated state was used as-is. |
| Axe / Lighthouse / Web Vitals run | Neither tool is installed in the repository, and installing dependencies was forbidden. No accessibility or performance score is claimed. |
| Link checker | Not installed. Internal links were verified by route probe and by reading the navigation source. |
| Reading `.env`, `.env.test`, `.env.local` contents | Values may contain credentials. Only key names from the `.example` templates were read. |

### Disclosure

`pnpm build` regenerates `apps/*/dist` and `apps/web/.next`. Those are generated outputs, already gitignored. **No source file was created, modified, renamed or deleted during this audit**, apart from this report and its companion checklist.

---

## 1. Executive summary

The repository is in a **healthy, coherent and unusually well-documented state** for a project at the end of its fifth phase. It is a pnpm/Turborepo monorepo with a Next.js App Router frontend, an Express API, a shared TypeScript package and a real PostgreSQL database with migrations, a three-role privilege model and an idempotent seed.

Verified strengths:

- **Every automated check passes**: typecheck, lint, formatting, token validation, 202 unit tests, 24 integration tests, a clean forced build, 72 responsive viewport checks and console cleanliness on every route tested.
- **Security foundations are unusually strong for this stage**: environment validation refuses localhost in production and non-`_test` databases in test; the database is split into admin/owner/application roles so the running API cannot execute DDL; logs redact cookies, tokens, PAN and connection strings; errors are RFC 9457 problem documents that do not leak internals in production.
- **RBAC is already designed for Phase 6**, not just for Phase 2's health endpoint: the permission catalogue already contains `page`, `homepage`, `activity`, `news`, `event`, `campaign`, `impact`, `testimonial`, `navigation`, `media`, `enquiry`, `donation`, `receipt`, `seo`, `settings.*`, `user`, `role`, `audit` and `system` resources with publish/schedule/archive/restore verbs.

The material gaps are **not defects in what exists** — they are the things Phase 6 must build:

1. **The frontend is not connected to the API at all.** Every page reads demonstration content from `apps/web/src/content/*.demo.ts`. `src/lib/api-client.ts` exists but has **no callers** since the Phase 2 foundation page was replaced in Phase 4.
2. **There are no content tables and no content endpoints.** The database holds identity and settings only (7 tables); the 44 content tables described in `DATABASE_DESIGN.md` are not implemented.
3. **There is no authentication, session handling, CSRF protection or rate limiting.** All three are documented and scheduled for Phase 7, which means Phase 6 can safely build *read* endpoints but must not build write endpoints before those controls exist.

No critical issue was found. The project is **ready for Phase 6** provided Phase 6 starts with data models and read-only endpoints, and defers any write surface until authentication lands.

---

## 2. Actual technology stack (verified from manifests)

### Runtime and tooling

| Concern | Actual value | Source |
|---|---|---|
| Package manager | pnpm **11.28.5** | root `package.json` → `packageManager` |
| Monorepo orchestration | Turborepo **2.11.10** | root `devDependencies`, `turbo.json` |
| Node engine declared | `>=22.12.0` | root `package.json` → `engines` |
| Node actually used in audit | v24.21.0 | `node -v` during the runs |
| CI Node / Postgres | Node 24, `postgres:17-alpine` | `.github/workflows/ci.yml` |
| Local dev database | PostgreSQL 18.6 via `embedded-postgres` 18.6.0-beta.19 | root `devDependencies`, `scripts/dev-db.mjs` |

### Applications

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) | **16.4.5** |
| UI runtime | React / React DOM | **19.3.1** |
| Language | TypeScript | **5.9.3** (strict + `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS + `@tailwindcss/postcss` | **4.3.4** (v4 `@theme` tokens) |
| Backend | Express | **5.3.0** (ESM, `"type": "module"`) |
| ORM | Prisma + `@prisma/adapter-pg` | **7.10.1** |
| Database driver | `pg` | **8.23.1** |
| Validation | Zod | **4.6.7** (API, web, shared) |
| Logging | pino / pino-http | **10.4.0** / **11.0.0** |
| Tests | Vitest | **5.1.0** (+ supertest 7.3.1) |
| Lint / format | ESLint 10.14.0, typescript-eslint 8.72.1, Prettier 3.9.10 | as declared |

### Notable absences (deliberate, not accidental)

- **No UI component library** (no Radix, shadcn, MUI, Chakra). All components are hand-built.
- **No state-management library** (no Redux, Zustand, Jotai). Local `useState` only.
- **No animation library** (no Framer Motion). CSS transitions + one `@keyframes`.
- **No auth library** (no NextAuth, Passport, Lucia, argon2, jsonwebtoken) — authentication is Phase 7.
- **No rate-limiter** (`express-rate-limit` absent), **no `helmet`** (custom headers instead), **no nodemailer**, **no payment SDK**.
- **No MongoDB / Mongoose.** The database is PostgreSQL only.

### Dependency audit

`pnpm audit` reported **1 moderate** advisory:

| Field | Value |
|---|---|
| Package | `minimatch` |
| Severity | moderate (CWE-405, ReDoS via globparts amplification) |
| Vulnerable range | `>=7.0.0 <11.0.1` |
| Path | `. > @eslint/js > eslint > minimatch` (dev-only, transitive) |
| Runtime exposure | **None** — lint tooling is never bundled or shipped |
| Recommended | Bump the ESLint toolchain when convenient; not urgent |

No high or critical advisories. No duplicate top-level dependencies were found between web and API beyond intentional shared ones (`zod`, `@gaushala/shared`, `pg` in the API only).

---

## 3. Folder structure

```text
gaushala/
├─ apps/
│  ├─ api/                      Express API — all business logic
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma       7 models: User, Role, Permission,
│  │  │  │                      RolePermission, UserRole, UserPermission, Setting
│  │  │  ├─ migrations/         2 migrations (init, identity_constraints)
│  │  │  └─ seed.ts             idempotent reference-data seed
│  │  ├─ src/
│  │  │  ├─ core/config/env.ts  Zod env validation + production guards
│  │  │  ├─ core/db/            prisma factory, health/migration probes
│  │  │  ├─ core/http/          cors, security-headers, request-id,
│  │  │  │                      error-handler, errors, not-found
│  │  │  ├─ core/logging/       pino with redaction paths
│  │  │  ├─ modules/health/     /health/live, /health/ready, /version
│  │  │  ├─ routes/v1.ts        /api/v1 discovery only
│  │  │  ├─ app.ts              middleware composition (injected deps)
│  │  │  └─ index.ts            bootstrap + graceful shutdown
│  │  └─ tests/integration/     real-DB tests (test database only)
│  └─ web/                      Next.js public site + design system
│     └─ src/
│        ├─ app/(site)/         12 public routes (see §5)
│        ├─ app/design-system/  4 internal noindex reference pages
│        ├─ components/ui/      21 design-system modules
│        ├─ components/site/    10 chrome/page primitives
│        ├─ components/homepage/11 homepage sections
│        ├─ components/admin/   9 admin-language components (reference only)
│        ├─ content/            typed contracts + demo adapters + loaders
│        ├─ demo/               the demo dataset + its guard tests
│        ├─ lib/                cn, server-env, unused api-client, validation
│        └─ fonts/              self-hosted Inter variable woff2 + licence
├─ packages/
│  ├─ shared/                   contracts, money, permissions, slug, uuid,
│  │                            design tokens + contrast, tests
│  └─ config/                   shared tsconfig presets (base/node/nextjs)
├─ scripts/                     db bootstrap/migrate/dev-db, token check,
│                               responsive check, console check, screenshots
├─ infra/docker/                docker-compose.dev.yml
├─ docs/                        architecture, DB, API, security, SEO, design
│                               system, implementation plan + phase reports
└─ .github/workflows/ci.yml     install → generate → bootstrap → migrate →
                                seed → lint → typecheck → tokens → format →
                                unit → integration → build
```

### Architectural consistency

The layering is followed consistently:

- `apps/web` **never** imports a database driver; `next.config.ts` documents this and the dependency graph enforces it.
- `packages/shared` is consumed as compiled ESM (`transpilePackages: ['@gaushala/shared']`) and is the only source of contracts, money rules, permissions and design tokens.
- The API injects dependencies (`createApp({ config, logger, prisma })`) instead of importing singletons, which is what makes the integration tests able to run against a throwaway database.

### Duplication and dead code found

| Item | Assessment |
|---|---|
| `src/lib/api-client.ts` (~90 lines) | **Dead code.** `getApiStatus()` has no callers — the Phase 2 foundation page that used it was deleted in Phase 4. Harmless, but misleading: it implies the frontend talks to the API. |
| `Card` (`ui/card.tsx`) vs `CardSurface` (`ui/cards.tsx`) | Two white-surface primitives. Not a defect: `Card` is the generic container used by the design-system pages; `CardSurface` is the internal shell for the content-card family. Worth documenting so a third variant is not added. |
| `apps/api/tsconfig.tsbuildinfo`, `packages/shared/tsconfig.tsbuildinfo` | Build artefacts present in the working tree (gitignored via `*.tsbuildinfo`). Cosmetic. |
| `.acl-recovery/`, `.pnpm-store/`, `.local/` at root | Local tooling state, all gitignored. |

**Circular dependencies:** none found. The import graph is acyclic — `shared → (nothing)`, `ui → icons + cn`, `site → ui`, `homepage → ui + site`, `app → content + components`. Barrel files (`ui/index.ts`, `site/index.ts`) are required by convention `8. Using the system` in `DESIGN_SYSTEM.md` and are not re-exported into themselves.

**Import-pattern inconsistency (minor):** some modules import icons via the barrel (`@/components/icons`) and others via a relative path (`../icons`). Both resolve; the inconsistency is stylistic only.

---

## 4. Architecture explanation

### Request path today

```text
Browser ──► Next.js (apps/web)
              │
              └─ app/(site)/* ──► src/content/index.ts (loaders)
                                     └─ *.demo.ts ──► demo-source.ts ──► src/demo/content.ts
                                                                          (TypeScript constants)

Browser ──► Express (apps/api)   ← currently called by nothing in the web app
              ├─ /health/live, /health/ready, /version
              └─ /api/v1  (discovery payload only)
                     └─ Prisma 7 + adapter-pg ──► PostgreSQL
```

There are **two applications that do not yet talk to each other** for content. That is the single most important architectural fact in this audit.

### Why it is nevertheless well-prepared

- `src/content/index.ts` exposes **11 async loaders** (`getHomepageContent`, `getAboutPage`, `getOurWorkPage`, `getCampaignsPage`, `getCampaign`, `getCampaignSlugs`, `getEventsPage`, `getEvent`, `getEventSlugs`, `getNewsPage`, `getNewsArticle`, `getNewsSlugs`, `getGalleryPage`, `getContactPage`). Pages are already async server components, so replacing a loader body with a `fetch` introduces no structural change.
- Every page section receives plain, serialisable props — no React nodes, no class names, no component types in the data.
- Money is integer minor units (paise) end-to-end (`packages/shared/src/money/money.ts`, ADR-007), so campaign progress cannot drift once donations are real.

### Rendering strategy (from the forced build)

| Strategy | Count | Routes |
|---|---|---|
| Static (`○`) | 9 public + 4 design-system | `/`, `/about`, `/our-work`, `/campaigns`, `/events`, `/contact`, `/donate`, `/design-system*` |
| SSG (`●`) | 8 | 2 campaigns, 3 events, 3 news articles |
| Dynamic (`ƒ`) | 3 | `/news`, `/gallery` (query-param filtering), `/api/health` |

---

## 5. Frontend and route audit

### Route availability (HTTP probe, all executed)

| Route | Status | h1 | Notes |
|---|---|---|---|
| `/` | 200 | 1 | homepage, 11 sections |
| `/about` | 200 | 1 | |
| `/our-work` | 200 | 1 | 4 anchored activity sections |
| `/campaigns` | 200 | 1 | |
| `/campaigns/winter-fodder-fund` | 200 | 1 | SSG |
| `/campaigns/shelter-repair-appeal` | 200 | 1 | SSG |
| `/events` | 200 | 1 | upcoming + past |
| `/events/community-open-day` | 200 | 1 | SSG |
| `/news` | 200 | 1 | `?category=` filtering |
| `/news/preparing-the-shelters-for-winter` | 200 | 1 | SSG |
| `/gallery` | 200 | 1 | `?category=` filtering + lightbox |
| `/contact` | 200 | 1 | validated (not connected) form |
| `/donate` | 200 | 1 | placeholder, no payment |
| `/campaigns/does-not-exist` | **404** | 1 | custom site 404 (browser-verified) |
| `/news?category=NotACategory` | **404** | 1 | unknown filter rejected |
| `/gallery?category=NotACategory` | **404** | 1 | unknown filter rejected |

Exactly one `h1` per page on every route. Skip link (`#main-content`), `<header>`, `<main>` and `<footer>` present; `<html lang="en-IN">`.

### Not-found behaviour — a caution for future audits

Static-HTML inspection of a 404 response is **misleading** in this stack: the custom copy appears in the RSC payload but the `<h1>` and chrome are only present after hydration. The audit therefore loaded the 404 in headless Chrome, where it resolves correctly:

```text
/campaigns/does-not-exist
title : "Campaign not found | Shri Vanshidhar Gaushala"
h1    : ["This page does not exist."]
header/main/footer: true, true, true
skip  : #main-content
```

### Navigation, CTAs and links

- Header nav (About, Our Work, Campaigns, Events, News, Gallery, Contact) — **all seven targets exist**.
- Footer columns: Explore, Our Work, Support, Contact, Legal. **Six legal/support links point at routes that do not exist yet**: `/gaushala`, `/impact`, `/transparency`, `/privacy-policy`, `/terms`, `/refund-policy`, `/refund-policy`, `/volunteer`. These are documented Phase 5/10 routes, but today they resolve to the site 404. **This is the only broken-link class in the project.**
- Donate CTAs (header, hero, mid-page strip, campaign cards, final CTA, footer, sticky mobile bar) all target `/donate`, which exists.
- Gallery lightbox: native `<dialog>`, Escape/arrow keys, focus restoration — capture `docs/screenshots/phase-5/18-gallery-lightbox-open.png`.
- Contact form: validates locally, reports field errors via a focused `role="alert"` summary, then states **“Validated — but not sent”**. It does not fake delivery.

### Design identity

The implementation uses the approved **Warm Earth & Terracotta** palette (ivory `#FFF8EF`, terracotta `#B85C38`, burnt orange `#D97732`, cocoa `#4A2F24`, sand `#E9D7C3`, brass `#C69A52`, charcoal `#2C211B`, terracotta ink `#9A4A2C`). Note for the record: the audit brief refers to a “forest-green/earthy” palette — **there is no forest green in this project**; the implemented identity is ivory/terracotta/cocoa. The build was not changed to match the brief's wording.

### Hardcoded content that must eventually be CMS-driven

| Hardcoded today | Where | Phase 6/10 impact |
|---|---|---|
| Footer tagline and "preview build" copy | `app/(site)/layout.tsx` | Should come from `settings.site.general` |
| Contact form subject list | `components/contact/contact-form.tsx` | Should come from `settings.forms` |
| "Before you write" bullets | `app/(site)/contact/page.tsx` | Editorial copy |
| Campaign detail CTA panel text | `app/(site)/campaigns/[slug]/page.tsx` | Repeats a fixed string |
| Event detail CTA panel text | `app/(site)/events/[slug]/page.tsx` | Same |
| Newsletter placeholder + note | `components/site/site-footer.tsx` | Waiting on email integration |

---

## 6. Database and content architecture audit

### Is a database configured?

**Yes — PostgreSQL only.** No MongoDB, no Mongoose, no document store.

| Question | Finding |
|---|---|
| Database | PostgreSQL (Prisma `provider = "postgresql"`) |
| ORM | Prisma **7.10.1** with `@prisma/adapter-pg` (Prisma 7 requires an explicit driver adapter) |
| Migrations | **2** applied: `20261106001919_init`, `20261106054924_identity_constraints` |
| Seed | Idempotent (`upsert` + reconciliation), seeds permissions, 4 role templates, one INVITED super-admin without a password, and 4 settings groups |
| Models | **7**: `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `UserPermission`, `Setting` |
| Repositories / services | **None yet** — no content modules exist; `modules/` contains only `health/` |
| Content storage | **TypeScript constants** in `apps/web/src/demo/content.ts`, adapted by `content/demo-source.ts` |

### Content contracts that already exist

| Entity | Contract | Loader | Persistence |
|---|---|---|---|
| Organisation / site | `settings.site.general` (seed) | — (unused by web) | DB row exists |
| Contact details | `settings.contact.details` (seed, empty) + `ContactChannel` | `getContactPage` | DB row + demo |
| Homepage | `HomepageContent` (13 sub-contracts) | `getHomepageContent` | demo |
| About | `AboutPageContent` | `getAboutPage` | demo |
| Activities / Our Work | `WorkActivity`, `HomepageActivity` | `getOurWorkPage` | demo |
| Campaigns | `CampaignRecord` (money in minor units) | `getCampaignsPage`, `getCampaign` | demo |
| Events | `EventRecord` (status enum) | `getEventsPage`, `getEvent` | demo |
| News | `NewsRecord` (slug, category, body) | `getNewsPage`, `getNewsArticle` | demo |
| Gallery | `GalleryRecord` | `getGalleryPage` | demo |
| Media metadata | **Only** `ImageRef { label, src?, alt? }` | — | none |
| Donations | Money contract only (`Money`, `isValidAmountMinor`) | — | none |
| Admin users / permissions | **Full RBAC implemented** | — | DB tables exist |
| Impact statistics | `HomepageImpactStat` (value, unit, label, note) | homepage only | demo |
| Testimonials | `HomepageTestimonial` | homepage only | demo |
| Enquiries | `EnquiryValues` + `validateEnquiry` | — | none |

### Can the current architecture support Phase 6 onwards?

| Capability | Current state | What is needed |
|---|---|---|
| Multiple administrators | ✅ `users` + invitation-only model | Auth (Phase 7) |
| Flexible RBAC | ✅ role + per-user GRANT/DENY override, DENY wins | Route guards |
| Instant publishing | ⚠️ Permission verbs exist (`publish`) | `status`/`published_at` columns + transition rules |
| Scheduled publishing | ⚠️ Permission exists (`schedule`) | `scheduled_for` + scheduler/publish worker |
| Draft & archived content | ❌ | `status` enum + revision pointer on every content table |
| Content revisions | ❌ | `*_revisions` tables + `current_revision_id` |
| Media uploads | ❌ | `media` table + storage adapter + MIME sniffing |
| Campaign progress from donations | ❌ | `donations` table + derived aggregates (never a stored percentage) |
| Donation history | ❌ | `donations`, `donation_events`, `receipts` |
| Audit logs | ⚠️ Permission exists (`audit.read`) | `audit_logs` table + write hooks |

### Database recommendation — **PostgreSQL (keep it)**

**Recommendation: continue with PostgreSQL. Do not introduce MongoDB.**

Reasons, grounded in what is already built:

1. **It is already implemented and working.** Two migrations, a three-role privilege split, an idempotent seed and 24 passing integration tests exist. Switching would discard all of it and re-open the security work.
2. **The domain is relational, not document-shaped.** Donations → receipts → refunds → campaign aggregates, users → roles → permissions, content → revisions → media: these are joins and foreign keys, not embedded documents.
3. **Money correctness.** `BIGINT` minor units plus transactional integrity give exact reconciliation and idempotency for payment webhooks. MongoDB's multi-document transactions would work but add complexity for no benefit here.
4. **The RBAC design is relational by nature** (join tables with a DENY override), and the seeded catalogue already matches the code.
5. **The documentation assumes it** — `DATABASE_DESIGN.md` specifies 44 tables, constraints `C8–C23`, and index strategies for PostgreSQL.

**Migration cost if MongoDB were chosen:** high — schema design, all Prisma models, migrations, seed, integration tests, the three-role security model, and every contract in `packages/shared`. There is no requirement in the current product that PostgreSQL cannot meet.

**Do not run both.** A second database would double operational surface (backup, migrations, connection pooling, monitoring) with no documented justification.

---

## 7. Backend and API readiness

### What exists

| Concern | State | Evidence |
|---|---|---|
| HTTP framework | ✅ Express 5.3, ESM | `apps/api/src/app.ts` |
| Middleware order | ✅ request-id → logging → headers → CORS → JSON → routes → 404 → error | `app.ts` |
| Request validation | ✅ Zod, used for env; ready for bodies | `core/config/env.ts`, `error-handler.ts` maps `ZodError` → 422 with field errors |
| Response format | ✅ RFC 9457 problem documents + typed success contracts | `packages/shared/src/contracts/problem.ts` |
| Error handling | ✅ Central, no internal leakage in production | `core/http/error-handler.ts` |
| DB connection | ✅ Adapter-pg, injected, least-privilege role | `core/db/prisma.ts` |
| Logging | ✅ pino with 30+ redaction paths | `core/logging/logger.ts` |
| Health/readiness | ✅ `/health/live`, `/health/ready` (DB + migration probe), `/version` | `modules/health/health.routes.ts` |
| Security headers | ✅ nosniff, DENY, no-referrer, CORP/COOP, strict CSP, HSTS in production | `core/http/security-headers.ts` |
| CORS | ✅ Explicit allow-list, credentials only for known origins, `Vary: Origin` | `core/http/cors.ts` |
| Authentication | ❌ **None** | No auth library, no session table, no `/auth` routes |
| Authorisation | ❌ **Not enforced anywhere** | RBAC data + catalogue exist; no guards |
| Rate limiting | ❌ **None** | No `express-rate-limit` dependency |
| CSRF | ❌ **None** | CORS mentions `X-CSRF-Token`; no implementation |
| Body limits | ✅ `express.json({ limit: '256kb' })` | `app.ts` |
| Business endpoints | ❌ **None** — `/api/v1` returns a discovery payload | `routes/v1.ts` |

### Is the frontend connected to any API?

**No.** Every page reads from `src/content`. The only API call in the web application is `getApiStatus()` in the unused `api-client.ts`. The web app's own `/api/health` route is a Next.js route handler that does not touch the Express API.

### What Phase 6 must build (not built here)

1. Content models + migrations (pages/sections, activities, news, events, campaigns, impact, testimonials, media, menus).
2. Public read endpoints under `/api/v1/public/*` with cache headers.
3. Admin content endpoints under `/api/v1/admin/*` — **blocked on Phase 7 auth**; Phase 6 should ship read paths first.
4. A `fetch`-based client in the web app replacing the demo adapters, with `revalidate` tags.
5. Validation contracts in `packages/shared` for every payload.

---

## 8. Security audit (OWASP-oriented, preliminary)

### Findings

| # | Area | Finding | Severity |
|---|---|---|---|
| S1 | Secrets in repo | No secrets found. `.env`, `.env.*`, `.env.local` are gitignored; only `.example` templates are tracked. Values were **not** read during this audit. | — (pass) |
| S2 | Environment validation | Zod-validated at boot; refuses localhost in production, non-`_test` DB in test, `http://` SITE_URL in production. Error messages list field names, never values. | — (pass) |
| S3 | DB privilege separation | Three roles: `ADMIN` (bootstrap only), `MIGRATE` (owner, DDL, CLI only), `DATABASE_URL` (runtime, DML only). The API cannot run DDL. | — (pass) |
| S4 | Log redaction | 30+ redaction paths including `req.headers.cookie`, `authorization`, `set-cookie`, `password*`, `token*`, `secret`, `apiKey`, `pan`, `donorPan`, `databaseUrl`, plus wildcard variants. | — (pass) |
| S5 | Error leakage | Production returns a generic `INTERNAL_ERROR` detail; the real message is logged server-side with the request id. | — (pass) |
| S6 | XSS | No `dangerouslySetInnerHTML`, no `innerHTML`, no `eval`, no `new Function` anywhere in `apps/`. React escapes all interpolated content; article bodies are plain paragraphs. | — (pass) |
| S7 | **Missing CSP on the web app** | `next.config.ts` sets nosniff/DENY/referrer/permissions/COOP but **no `Content-Security-Policy`**. The API sets a strict CSP; the document does not. | **Medium** |
| S8 | **No rate limiting** | Nothing throttles any endpoint. Acceptable while only health/read exist; unacceptable the moment an enquiry or donation endpoint is public. | **Medium** (latent) |
| S9 | **No authentication / CSRF** | No session, no cookie handling, no CSRF token. Documented as Phase 7. Any write endpoint built before it would be unauthenticated. | **High if writes are added early** — currently no writes exist |
| S10 | Input validation coverage | Zod is available and used for env; `validateEnquiry` is a pure, tested validator. No request-body schemas exist yet because no bodies are accepted. | — (acceptable) |
| S11 | CORS | Allow-list only, no wildcard, credentials only for configured origins, `Vary: Origin` always set. Preflight allows `Idempotency-Key` and `If-Match`. | — (pass) |
| S12 | SQL injection | Prisma parameterises; no raw SQL in application code (only migration/constraint tests). | — (pass) |
| S13 | File upload safety | No upload surface exists. Phase 6 must add MIME sniffing, size limits, storage isolation and no direct execution path. | N/A today |
| S14 | Dependency risk | 1 moderate dev-only advisory (`minimatch` via ESLint). No high/critical. | Low |
| S15 | Headers on web | HSTS absent — correct for local HTTP; must be enabled at the edge for production. | Info |
| S16 | Sensitive data in URLs | None observed; no tokens in query strings. | — (pass) |

### Donation / payment readiness

**No payment code, SDK, endpoint or credential exists.** The only artefacts are the money contract (`BIGINT` minor units, `isValidAmountMinor`) and a seeded setting `donation.presets.onlinePaymentsEnabled = false`, `providerMode = "disabled"`. The `/donate` page states that no payment is processed and collects nothing.

When IDFC FIRST Bank is integrated (documented as awaiting merchant documentation and sandbox credentials), the following **must** exist before any real transaction — none of it is built today:

| Requirement | Status |
|---|---|
| Server-side payment verification | ❌ |
| Webhook signature verification | ❌ |
| Idempotency (`Idempotency-Key` handling) | ⚠️ Header allowed in CORS, no implementation |
| Duplicate transaction prevention | ❌ |
| Immutable transaction record + status history | ❌ (`donations`, `donation_events` tables absent) |
| Refund tracking | ❌ |
| Provider isolation (no provider types leaking into domain code) | ❌ |
| Receipt issuance | ❌ |

No IDFC endpoints, formats, signatures or credentials were invented or attempted.

---

## 9. Testing results (executed)

| # | Command | Result | Evidence |
|---|---|---|---|
| 1 | `pnpm typecheck` | ✅ **PASS** | `Tasks: 5 successful, 5 total`, exit 0 |
| 2 | `pnpm lint` | ✅ **PASS** | `Tasks: 3 successful, 3 total`, exit 0 |
| 3 | `pnpm format:check` | ✅ **PASS** | "All matched files use Prettier code style!" |
| 4 | `pnpm check:tokens` | ✅ **PASS** | 15 colour tokens, 10 typographic roles, 6 gradient tokens match |
| 5 | `pnpm test:unit` | ✅ **PASS** | shared 44 (5 files) + web 120 (10 files) + api 38 (3 files) = **202** |
| 6 | `pnpm test:integration` | ✅ **PASS** | **24** tests in 3 files against real PostgreSQL |
| 7 | `pnpm turbo run build --force` | ✅ **PASS** | Compiled in 767 ms; 23 build rows; `Tasks: 4 successful, 4 total` |
| 8 | `pnpm check:responsive` | ✅ **PASS** | 12 routes × 6 widths = **72 viewport checks**, 0 offenders |
| 9 | `pnpm check:console` | ✅ **PASS** | 7 routes: "no console or network errors" |
| 10 | `pnpm audit` | ⚠️ **1 moderate** | `minimatch` (dev-only, via ESLint) |

Note on integration tests: the run prints expected `23514` / `23505` constraint errors. These are **negative-path assertions** (they prove the database rejects lowercase-violating emails, duplicate keys and malformed role keys) inside tests that pass. The suite reports `24 passed`.

### What is **not** tested

| Gap | Consequence |
|---|---|
| No axe / automated accessibility scan | Accessibility is asserted structurally (labels, roles, headings) and by document checks, not by an a11y engine. No score is claimed. |
| No end-to-end/browser test suite (no Playwright) | The responsive and console checks are custom CDP scripts, not an E2E framework. No click-through regression suite exists. |
| No link checker | Broken footer links (see §5) were found by inspection, not by a test. |
| No load/performance test | Payload measured manually (below); no Web Vitals run. |
| No mutation/coverage thresholds | Coverage was not measured. |

---

## 10. Performance and SEO audit

### Measured payload (homepage, HTTP probe)

| Asset | Raw | gzip | Files |
|---|---|---|---|
| Client JavaScript | 707 KB | **216 KB** | 10 |
| CSS | 62 KB | **12 KB** | 1 |
| Font | 48 KB (Inter variable, latin) | — | 1, preloaded |

216 KB gzip of JS is **heavy for a content site**. It is dominated by the React 19 + Next 16 runtime and the shared chunk that includes the icon set and the interactive components (header menu, lightbox, form, sticky bar). This is not a defect in a single component; it is a bundling characteristic worth measuring properly with Web Vitals before launch.

### Optimisation already in place

- **Self-hosted font** with `next/font/local`, `preload`, `display: swap`, metric-matched fallback (`adjustFontFallback: 'Arial'`) — no third-party request, no font-CLS.
- **`next/image`** is the only image primitive (`ui/image-container.tsx`); placeholders are CSS-only, so **no image bytes are transferred today** and no `<img>` without `alt` exists (probe: `img=0` everywhere).
- **Fixed aspect ratios** on every image slot → no layout shift when real photography arrives.
- **Server components by default**; client JavaScript is limited to the header, lightbox, contact form, sticky bar and the design-system demos.
- **Static/SSG rendering** for 17 of 20 public URLs.

### SEO findings

| # | Finding | Severity |
|---|---|---|
| E1 | **Double brand suffix in titles.** `metadata.title.template = "%s \| Shri Vanshidhar Gaushala"` is applied to titles that already contain the brand: `/about` → `About — Shri Vanshidhar Gaushala (demo) \| Shri Vanshidhar Gaushala` (~64 chars for the prefix alone). Detail pages avoid it because their titles are short. | **Medium** |
| E2 | **Canonical URLs resolve to `http://localhost:3000`** because `NEXT_PUBLIC_SITE_URL` falls back to localhost. Correct for dev; **must** be set in every deployed environment. | **Medium** (config) |
| E3 | **Open Graph only on `/`.** All other routes emit no `og:*`. | Low |
| E4 | **No `sitemap.ts` or `robots.ts`.** `robots` metadata is set per page (all `noindex`), which is sufficient now, but a sitemap is required at launch. | Low (pre-launch) |
| E5 | **404 pages emit no meta description**, and the title is the site default unless `generateMetadata` returns before `notFound()`. | Low |
| E6 | `/donate` sets no `alternates.canonical` (every other page does). | Low |
| E7 | **`noindex, nofollow` on every route** — intentional and verified (`layout.tsx` comment + per-page `robots`). Nothing enables indexing. | — (intentional) |

### What must change before launch (do not change now)

1. Set `NEXT_PUBLIC_SITE_URL` to the real origin (canonicals, OG URLs).
2. Fix the title template (remove the brand from page titles, or drop the template for pages that include it).
3. Add `og:*` metadata to every public route.
4. Add `app/sitemap.ts` and `app/robots.ts`.
5. Remove `robots: { index: false }` from `layout.tsx` **and** from every page's `generateMetadata` (both layers set it).
6. Add a CSP and enable HSTS at the edge.
7. Run a real Web Vitals pass with production images.

---

## 11. Demonstration content audit

| Requirement | Finding | Evidence |
|---|---|---|
| Fictional events labelled | ✅ Every event card carries a DEMO badge; `/events` shows a "Demonstration events" alert; venues say "demonstration venue". | Route HTML + `docs/screenshots/phase-5/04-events-desktop.png` |
| Demonstration campaigns labelled | ✅ DEMO badge on cards, "Illustrative" pill over the image, section alert, detail-page note. | `05-campaigns-*.png`, `15-campaign-detail-desktop.png` |
| Illustrative amounts not presented as real | ✅ Amounts render as progress against a target with "Demonstration amounts. No donation is being collected." | `campaigns/[slug]/page.tsx` |
| No invented registration details | ✅ Test-enforced: `pages.test.ts` rejects `80g`, `12a`, `registered charity`, `tax exemption`, `gstin`. | Passing test |
| No fabricated tax-exemption claims | ✅ Same test. | Passing test |
| No invented contact information | ✅ `ContactChannel.value` is empty for all three channels; test rejects `+91`, `@gmail`, `tel:`, `wa.me`, `maps.google`, `pincode`. | `pages.test.ts`, `/contact` |
| No false testimonials / impact figures | ✅ Testimonials are fictional ("Demo supporter", "Illustrative — not a real person"); every impact figure carries "Illustrative figure — replaced by a verified, dated statistic." | `homepage.test.ts`, homepage capture |
| Placeholder photographs identified | ✅ Every image slot renders "Awaiting approved photograph" with the intended subject as a label. No stock imagery anywhere. | Probe: `img=0`; screenshots |
| Donation page does not claim payments are active | ✅ `/donate` shows a warning alert: "Online donations are not open yet. **No payment is processed, no card details are collected, and no donation is recorded.**" | Route HTML |

**No misleading content was found.** One small textual redundancy was already fixed in Phase 5 (alert titles repeating their body).

---

## 12. Phase-wise completion verification

| Phase | Area | Expected result | Actual evidence | Status |
|---|---|---|---|---|
| **1** | Discovery and architecture | Documented architecture | `docs/ARCHITECTURE.md` (1,295 lines), `DATABASE_DESIGN.md` (1,098), `API_DESIGN.md` (1,048), `SECURITY_PLAN.md` (815), `SEO_PLAN.md` (841), `IMPLEMENTATION_PLAN.md` (1,059), blueprint DOCX. ADRs referenced from code (ADR-007 money, ADR-013 Devanagari, ADR-014 logging). | **PASS** |
| **2** | Engineering foundation | Setup, configuration, DB, migrations, seed, health, logging, security headers, CI | Monorepo + Turbo + shared config; Zod env with production guards; 2 migrations; idempotent seed; 3-role DB split; `/health/live|ready`, `/version`; pino redaction; CORS allow-list; RFC 9457 errors; CI workflow; all 5 static checks and 24 integration tests pass. | **PASS** |
| **3** | UI/UX design system | Tokens + reusable UI | 21 `ui/` modules, 10 `site/`, 9 `admin/` reference components; `check:tokens` validates 15 colours / 10 typographic roles / 6 gradients; `design-guard.test.ts` forbids raw hex and unlabelled inputs; 4 internal showcase pages; captures in `docs/screenshots/phase-3` and `visual-redesign`. | **PASS** |
| **4** | Homepage | Complete donation-focused homepage | `/` renders 11 sections from a typed contract; 17 public URLs build; homepage pixel-identical to its Phase 4 capture after later refactors; Donate CTAs in header, hero, strip, campaigns, final CTA, footer, sticky bar; 9 captures in `docs/screenshots/phase-4`. | **PASS** |
| **5** | Public pages | 7 pages + detail routes + responsive + a11y + tests | 10 routes + custom 404 exist and respond correctly; unbounded slugs and unknown categories 404; category filtering server-side; lightbox browser-verified; form validates and refuses to fake delivery; 20 captures; 72 responsive checks pass; console clean. | **PASS (with caveats)** |

**Phase 5 caveats** (all documented, none blocking Phase 6): no axe scan; six footer links target routes that do not exist yet; `/news` pagination renders at `totalPages = 1` (a placeholder); activity "detail" is anchored sections on one page rather than `/our-work/[slug]`.

---

## 13. Critical problems

**None found.**

No finding in this audit can cause data loss, unauthorised access to existing data, a broken build, or a false statement to a donor today. Specifically:

- No secrets are committed.
- No production database or payment service is reachable from the code.
- No route claims a payment was taken or a message was delivered.
- Every check that exists passes.

---

## 14. Important problems

| # | Problem | Impact | Recommended fix (not applied) |
|---|---|---|---|
| I1 | **Frontend is not connected to the API**; `api-client.ts` is dead code | Demo content is bundled with the app; a CMS write has no path to the page | Phase 6: replace loader bodies with `fetch`, add revalidate tags, delete or wire `api-client.ts` |
| I2 | **No content tables / endpoints** | Phase 6 is the whole build | Implement the 8–12 core content models first |
| I3 | **No auth, sessions, CSRF, rate limiting** | Any write endpoint added before Phase 7 would be unauthenticated and unthrottled | Ship read-only endpoints in Phase 6; gate writes on Phase 7 auth |
| I4 | **No CSP on the web document** | XSS mitigation relies solely on React escaping | Add a nonce/hash CSP in `next.config.ts` headers or middleware |
| I5 | **SEO title double-branding** (E1) | Weakens titles on 7 listing pages | Drop the brand from page titles or stop applying the template to them |
| I6 | **Canonical/OG depend on a localhost default** (E2) | Wrong canonicals if the env var is missed in production | Make `NEXT_PUBLIC_SITE_URL` required (fail boot) in production |
| I7 | **Six dead footer links** (`/gaushala`, `/impact`, `/transparency`, `/privacy-policy`, `/terms`, `/refund-policy`, `/volunteer`) | Visitors hit the 404 from a prominent nav element | Build them in Phase 5b/10, or mark them `aria-disabled` until then |
| I8 | **216 KB gzip of client JS** on a content page | Slower first load on mobile networks | Measure Web Vitals; consider trimming the icon barrel and deferring the sticky bar |

---

## 15. Minor improvements

1. Remove the two `tsconfig.tsbuildinfo` files from the working tree (they are gitignored, so this is cosmetic).
2. Standardise icon imports (barrel vs relative) across modules.
3. Add `alternates.canonical` to `/donate` for consistency.
4. Give 404 pages a meta description.
5. Document that `Card` and `CardSurface` serve different purposes so a third surface primitive is not introduced.
6. The contact form's subject list should eventually come from `settings.forms`.
7. `pnpm build` prints no bundle-size table; consider `next build --debug` or a size check in CI.
8. Add a `check:links` script (crawl internal hrefs, fail on 404) — it would have caught I7.
9. Consider `exactOptionalPropertyTypes: true` in the base tsconfig (currently `false`); the code already uses conditional spreads extensively, so the change may be cheap.
10. `.acl-recovery/` and `.pnpm-store/` are locally visible; both are gitignored, but a fresh clone check is worth confirming in CI.

---

## 16. Recommended fixes (ordered)

**Before Phase 6 code starts (cheap, unblocking):**

1. Set `NEXT_PUBLIC_SITE_URL` as a required production variable (I6).
2. Fix the title template (I5).
3. Delete or wire `api-client.ts` (I1).
4. Decide the fate of the six dead footer links (I7) — build later, but do not ship them silently.

**Inside Phase 6:**

5. Content models + migrations first, read endpoints second, web integration third (I2, I1).
6. Add a CSP (I4) before any form posts to the API.
7. Add rate limiting when the first write endpoint appears (I3).

**Before launch:**

8. Remove `noindex` from both layers (layout + per-page).
9. `sitemap.ts` + `robots.ts`.
10. Web Vitals pass with real photography; trim JS if needed (I8).
11. Axe scan and a link checker in CI.

---

## 17. Phase 6 readiness assessment

**Verdict: READY to start Phase 6, with conditions.**

**Ready to reuse (no rework):**

- Typed content contracts for 9 entity types and 11 async loaders.
- 40+ production UI components with tests, tokens and accessibility conventions.
- RBAC catalogue + database tables + seed, already covering every Phase 6 resource.
- Settings table with `site.general`, `contact.details`, `seo.defaults`, `donation.presets` rows.
- Env validation, problem-document error format, log redaction, health probes, CI pipeline.
- Prisma 7 + adapter-pg + migration workflow + a three-role privilege model.

**Missing and required in Phase 6:**

- 8–12 content tables (pages/sections, activities, news, events, campaigns, impact, testimonials, media, menus) + revisions.
- Public read endpoints and their Zod contracts.
- Web integration: loaders → API calls, with cache tags and revalidation.
- Media metadata + a storage decision.
- A publishing-state machine (`draft → scheduled → published → archived`) even if only read paths ship first.

**Conditions (must be true for Phase 6 to stay safe):**

1. **Read-only.** No admin/write endpoint until Phase 7 authentication exists.
2. **PostgreSQL only.** No second database.
3. **Contracts first.** Every new payload gets a Zod schema in `packages/shared` before the route or the page consumes it.
4. **Demo adapters stay until the API is proven**, so the site never depends on an unfinished endpoint.

**Blocking dependencies outside Phase 6:** authentication/CSRF/rate limiting (Phase 7), real content and photography (Phase 10), IDFC documentation and sandbox credentials (Phase 9).

---

## 18. Exact next steps

1. **Approve this audit.** No code changes were made.
2. **Apply the four pre-Phase-6 fixes** (§16, items 1–4) as a small maintenance change — they are configuration and cleanup, not features.
3. **Begin Phase 6 with data models only**: `Page`, `PageSection` (or a typed section JSON), `Activity`, `NewsArticle`, `Event`, `Campaign`, `ImpactStatistic`, `Testimonial`, `Media`, `MenuItem` + revision tables, in one reviewed migration.
4. **Then expose `GET /api/v1/public/*`** with cache headers and Zod response contracts.
5. **Then swap the loaders** one route at a time, starting with `/news` (simplest single-collection read), and keep the demo adapters as a fallback until all routes are green.
6. Do **not** add write endpoints, uploads, or donation code until Phase 7 and Phase 9 prerequisites are met.

---

### Appendix A — Commands and exact results

```text
$ pnpm typecheck
Tasks:    5 successful, 5 total            exit 0

$ pnpm lint
Tasks:    3 successful, 3 total            exit 0

$ pnpm format:check
All matched files use Prettier code style! exit 0

$ pnpm check:tokens
[check:tokens] 15 colour tokens match between tokens.ts and globals.css
[check:tokens] 10 typographic roles define a line height
[check:tokens] 6 gradient tokens match    exit 0

$ pnpm test:unit
@gaushala/shared:test:unit  Tests  44 passed (44)
@gaushala/web:test:unit     Tests 120 passed (120)
@gaushala/api:test:unit     Tests  38 passed (38)
Tasks: 5 successful, 5 total              exit 0

$ pnpm test:integration
@gaushala/api:test:integration  Tests  24 passed (24)
Tasks: 3 successful, 3 total              exit 0

$ pnpm turbo run build --force
✓ Compiled successfully in 767ms
Tasks: 4 successful, 4 total  Time: 10.596s  exit 0

$ pnpm check:responsive   (12 routes × 6 widths)
0 failures                                exit 0

$ pnpm check:console      (7 routes)
RESULT: no console or network errors      exit 0

$ pnpm audit
1 vulnerabilities found — Severity: 1 moderate   (minimatch, dev-only)
```

### Appendix B — Files read in full or in part

Configuration: root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `apps/*/package.json`, `packages/*/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `packages/config/tsconfig/base.json`, `.github/workflows/ci.yml`.

Backend: `prisma/schema.prisma`, `prisma.config.ts`, `prisma/seed.ts`, `src/app.ts`, `src/routes/v1.ts`, `src/core/config/env.ts`, `src/core/http/{cors,error-handler,security-headers,request-id}.ts`, `src/core/logging/logger.ts`, `src/core/db/prisma.ts`, `src/modules/health/health.routes.ts`, `tests/setup.integration.ts`, `vitest.integration.config.ts`, `tests/integration/helpers.ts`.

Frontend: `app/layout.tsx`, the `(site)` route tree, `content/*`, the component barrels, `lib/{server-env,api-client,validation/enquiry}.ts`, `lib/cn.ts`, `components/ui/card.tsx`, `components/contact/contact-form.tsx`.

Shared: `src/index.ts`, `money/money.ts`, `permissions/permissions.ts`, `design/tokens.ts` (via the token checker).

Documentation: `docs/*.md` (line counts + targeted sections), `docs/screenshots/*` inventory.

No file was modified.
