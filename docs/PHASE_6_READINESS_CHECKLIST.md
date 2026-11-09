# Phase 6 Readiness Checklist — Backend CMS Foundations

**Companion to:** `docs/PROJECT_AUDIT_PHASES_1_TO_5.md`
**Date:** 6 November 2026
**Scope:** what Phase 6 can reuse, what it must build, and the conditions under which it is safe to build.
**Status:** nothing in this document has been implemented. It is a plan, derived from the audit.

---

## 0. Architecture decision — database

**Decision: continue with PostgreSQL. Do not introduce MongoDB, and do not run both.**

| Criterion | Evidence |
|---|---|
| Already implemented | Prisma 7.10.1 + `@prisma/adapter-pg`, 2 applied migrations, idempotent seed, 24 passing integration tests |
| Domain shape | Relational: donations → receipts → refunds, users → roles → permissions, content → revisions → media |
| Financial correctness | `BIGINT` minor units + transactions give exact reconciliation and webhook idempotency (ADR-007) |
| Security model | Three-role split (admin/owner/app) already enforced; the API cannot run DDL |
| Migration cost of switching | High: schema, migrations, seed, RBAC join tables, integration tests, shared contracts — for no capability gain |
| Operational cost of both | Doubles backup, migration, pooling and monitoring surface with no documented justification |

**Consequence:** Phase 6 writes Prisma models in `apps/api/prisma/schema.prisma` and adds a migration. No second datastore, no document store, no search engine (Postgres full-text is sufficient until proven otherwise).

---

## 1. Existing capabilities Phase 6 can reuse

Do not rebuild any of the following — they are tested and working.

### 1.1 Contracts and loaders (web)

| Asset | Path | Reuse in Phase 6 |
|---|---|---|
| Homepage contract | `apps/web/src/content/homepage.ts` | Unchanged; only the loader body changes |
| Page/library contracts | `apps/web/src/content/library.ts` | Unchanged |
| Loaders | `apps/web/src/content/index.ts` (11 async functions) | Replace demo returns with API `fetch` |
| Demo adapters | `content/homepage.demo.ts`, `content/pages.demo.ts`, `content/demo-source.ts` | Keep as fallback until API is proven |
| Seam safeguard | `apps/web/src/demo/demo.test.ts` | Update the allow-list when adapters are removed |

### 1.2 API platform

| Asset | Path | Reuse |
|---|---|---|
| App composition | `apps/api/src/app.ts` | Mount new routers in the existing order |
| Env validation | `apps/api/src/core/config/env.ts` | Add new keys here only |
| Problem documents | `packages/shared/src/contracts/problem.ts` + `core/http/error-handler.ts` | Every new endpoint must throw `AppError` |
| Request ids | `core/http/request-id.ts` | Already on every response |
| Logging + redaction | `core/logging/logger.ts` | Reuse; add new sensitive fields to `REDACTED_PATHS` |
| Health probes | `modules/health/health.routes.ts` | Reuse; readiness already probes DB + migrations |
| Prisma factory | `core/db/prisma.ts` | Reuse; never create a second client |
| Router shell | `routes/v1.ts` | Add `/public/*` and `/admin/*` children |

### 1.3 Database foundations

| Asset | State | Reuse |
|---|---|---|
| Identity tables | `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_permissions` | Complete |
| Permission catalogue | `packages/shared/src/permissions/permissions.ts` | **Already contains** `page`, `homepage`, `activity`, `news`, `event`, `campaign`, `impact`, `testimonial`, `navigation`, `media`, `enquiry`, `seo`, `settings.*` with `publish`/`schedule`/`archive`/`restore` |
| Settings | `settings` table + 4 seeded groups | Extend via new `Setting.key` rows; no schema change |
| Migration workflow | `prisma migrate dev` (owner role) / CI `db:migrate:all` | Reuse |
| Seed pattern | `prisma/seed.ts`, idempotent upserts | Extend; never seed fictional Gaushala content |

### 1.4 Web platform

| Asset | Reuse |
|---|---|
| 40+ components (`components/ui`, `site`, `homepage`) | Render CMS data with zero changes |
| Route shells for all 10 public routes | Point at real data |
| `AdminShell`, `DataTable`, `FilterBar`, `ActionMenu`, `FormSection`, `ConfirmDialog` | Phase 8 admin UI, already built as an approved language |
| Design tokens + `check:tokens` | Apply to any new surface |
| `scripts/check-responsive.mjs`, `check-console.mjs` | Re-run unchanged on the new data |

### 1.5 Process

- CI workflow already runs install → generate → bootstrap → migrate → seed → lint → typecheck → tokens → format → unit → integration → build.
- `packages/config` tsconfig presets: strict + `noUncheckedIndexedAccess`.
- Problem-document error format and RFC 9457 titles already enumerate the codes Phase 6 needs (`VALIDATION_FAILED`, `NOT_FOUND`, `SLUG_TAKEN`, `VERSION_CONFLICT`, `INVALID_STATE_TRANSITION`).

---

## 2. Missing backend capabilities

| # | Capability | Needed by | Notes |
|---|---|---|---|
| B1 | Content read endpoints (`/api/v1/public/*`) | Phase 6 | **The core deliverable** |
| B2 | Response caching (`Cache-Control`, ETag) + revalidation tags | Phase 6 | Public pages should be cacheable |
| B3 | Zod response/request contracts per entity | Phase 6 | In `packages/shared/src/contracts/` |
| B4 | Repository/service layer for content | Phase 6 | `modules/content/*` following `modules/health` |
| B5 | Pagination + filtering primitives (cursor or page) | Phase 6 | `/news`, `/gallery` currently filter client-side via query params |
| B6 | Slug uniqueness + `SLUG_TAKEN` mapping | Phase 6 | Constraint + error code already exist |
| B7 | Draft/scheduled/published state machine | Phase 6 (model), Phase 7 (writes) | `INVALID_STATE_TRANSITION` code exists |
| B8 | Revision creation on publish | Phase 6 model, Phase 7 write path | `current_revision_id` pattern is in `DATABASE_DESIGN.md` |
| B9 | Media metadata endpoints | Phase 6/7 | Upload itself is Phase 7 |
| B10 | Auth (sessions, cookies, MFA) | **Phase 7** | Blocks all writes |
| B11 | CSRF protection | **Phase 7** | Blocks all writes |
| B12 | Rate limiting | **Phase 7** (before first public write) | `express-rate-limit` or equivalent |
| B13 | Authorisation guards (permission → route) | **Phase 7** | RBAC data exists; enforcement does not |
| B14 | Audit log writer | Phase 7 | `audit` permission exists |
| B15 | Enquiry persistence + email | Phase 7/9 | Contact form currently validates only |
| B16 | Payment integration (IDFC) | **Phase 9** | Awaiting merchant docs + sandbox credentials |
| B17 | Sitemap/feed endpoint | Phase 10 | SEO plan describes `seo` module |

**Rule:** Phase 6 may build B1–B9. B10–B13 must land before any endpoint accepts a write.

---

## 3. Missing database capabilities

Current: **7 tables**. Planned total in `DATABASE_DESIGN.md`: 44. Phase 6 should add the content subset — roughly 12–14 tables, not all 44.

### 3.1 Tables to add in Phase 6

| Table | Purpose | Key constraints |
|---|---|---|
| `media` | Uploaded file metadata | `storage_key` unique, MIME allow-list, `width`/`height`, `alt_text` |
| `pages` | Static/structured pages (`about`, `our-work`, `contact`, …) | `slug` unique, `status`, `published_at` |
| `page_sections` | Ordered, typed sections of a page | `page_id` FK, `sort_order`, `type` check, `content` JSONB |
| `activities` | "Our Work" entries | `slug` unique, `status`, `sort_order` |
| `news_articles` | News posts | `slug` unique, `category`, `published_at`, `status` |
| `events` | Events | `slug` unique, `starts_at`, `status`, `venue` nullable |
| `campaigns` | Campaigns | `slug` unique, `goal_minor`/`raised_minor` BIGINT, `status` |
| `impact_statistics` | Verified figures with provenance | `reporting_period`, `source`, `verified_at` **NOT NULL before publish** |
| `testimonials` | Approved quotes | `consent_recorded_at` NOT NULL before publish |
| `menu_items` | Navigation | `location` check, `sort_order`, self-FK parent |
| `content_revisions` | Immutable snapshots | `entity_type`, `entity_id`, `snapshot` JSONB, `created_by` |
| `audit_logs` | Who changed what | `actor_id`, `action`, `entity_type`, `entity_id`, `before`/`after` JSONB |

### 3.2 Deferred to later phases

`donations`, `donation_events`, `receipts`, `refunds`, `enquiries`, `sessions`, `csrf_tokens`, `user_mfa`, `media_variants`, `redirects`, `rate_limit_counters`.

### 3.3 Constraints and conventions to preserve

- UUIDv7 primary keys generated in application code (`packages/shared/src/utils/uuid.ts`).
- `timestamptz(6)` everywhere; `created_at`/`updated_at` on every mutable table.
- `snake_case` columns, plural table names.
- Money as `BIGINT` minor units only — never `numeric`, never float.
- Soft delete (`deleted_at`) where content may be restored.
- A database `CHECK` for every invariant — the identity tables already prove this pattern (`users_email_lowercase`, `roles_key_format`).

---

## 4. Required data models (Prisma)

Minimum viable set for Phase 6. Field lists are indicative, not final.

```text
Media               id, storageKey, mimeType, byteSize, width, height,
                    altText, credit, createdAt
Page                id, slug, title, template, status, publishedAt, scheduledFor,
                    heroMediaId?, seoTitle, seoDescription, currentRevisionId?
PageSection         id, pageId, type, sortOrder, isVisible, content (Json)
Activity            id, slug, title, summary, body, icon, sortOrder, status,
                    publishedAt, heroMediaId?
NewsArticle         id, slug, title, excerpt, category, body, heroMediaId?,
                    status, publishedAt, authorId?
Event               id, slug, title, summary, description, startsAt, endsAt?,
                    timeLabel, venue?, status, heroMediaId?, publishedAt
Campaign            id, slug, title, purpose, story, goalMinor, status,
                    startedOn, heroMediaId?, publishedAt
ImpactStatistic     id, key, label, value, unit?, reportingPeriod, source,
                    verifiedAt, verifiedById, sortOrder, isPublished
Testimonial         id, quote, attribution, context?, consentRecordedAt,
                    isPublished, sortOrder
MenuItem            id, location, label, href, sortOrder, parentId?, isVisible
ContentRevision     id, entityType, entityId, snapshot (Json), createdById, createdAt
AuditLog            id, actorId?, action, entityType, entityId?, before?, after?,
                    requestId?, createdAt
```

**Derived values are never stored as truth.** A campaign's percentage is computed from `raised_minor` and `goal_minor` at read time; `raised_minor` itself must later be reconciled against `donations`, not typed by an editor.

---

## 5. Required API endpoints (Phase 6 scope)

All read-only. Mounted under the existing `/api/v1` router.

### 5.1 Public

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/public/site` | Settings bundle: identity, contact, SEO defaults, donation status |
| GET | `/api/v1/public/homepage` | Composed homepage payload (sections in order) |
| GET | `/api/v1/public/pages/:slug` | `about`, `our-work`, `contact`, legal pages |
| GET | `/api/v1/public/news` | `?category=&page=&limit=` |
| GET | `/api/v1/public/news/:slug` | Article + related |
| GET | `/api/v1/public/events` | `?scope=upcoming|past` |
| GET | `/api/v1/public/events/:slug` | |
| GET | `/api/v1/public/campaigns` | |
| GET | `/api/v1/public/campaigns/:slug` | Includes computed progress |
| GET | `/api/v1/public/gallery` | `?category=` |
| GET | `/api/v1/public/activities` | "Our Work" entries |
| GET | `/api/v1/public/sitemap` | Phase 10, but design the shape now |

### 5.2 Admin — **do not build in Phase 6**

`/api/v1/admin/content/*`, `/api/v1/admin/media`, `/api/v1/admin/users` are Phase 7/8 and require authentication, authorisation guards, CSRF and rate limiting first.

### 5.3 Response conventions

- Success: the entity contract from `packages/shared`, never a bare array at the top level.
- Errors: `AppError` → RFC 9457 problem document with `requestId`.
- Cache: `Cache-Control: public, max-age=…, stale-while-revalidate=…` on public reads; `no-store` on anything personalised.
- Never return `draft` or `scheduled` rows to `/public/*`.

---

## 6. Required migrations

One reviewed migration per logical group, in this order:

1. `media` + storage metadata.
2. `pages` + `page_sections`.
3. `activities`, `news_articles`.
4. `events`.
5. `campaigns`.
6. `impact_statistics`, `testimonials`.
7. `menu_items`.
8. `content_revisions`, `audit_logs`.

Rules:

- Each migration must be reversible or have a documented back-out.
- Add indexes for every public filter (`news.status+published_at`, `events.starts_at`, `campaigns.slug`, `page_sections.page_id+sort_order`).
- Do not alter identity tables in Phase 6.
- Seed only reference data (permissions/settings), never fictional content — the audit's content-integrity tests depend on that.

---

## 7. Required validation

### 7.1 Shared Zod contracts (`packages/shared/src/contracts/`)

For each entity: a `...Schema` for responses and (later) a `...InputSchema` for writes.

Checklist:

- [ ] `siteSettingsSchema` — contact fields nullable until verified
- [ ] `homepageSchema` — mirrors `HomepageContent` exactly
- [ ] `pageSchema`, `pageSectionSchema`
- [ ] `activitySchema`, `newsArticleSchema`, `eventSchema`, `campaignSchema`
- [ ] `galleryItemSchema`, `impactStatisticSchema`, `testimonialSchema`
- [ ] `mediaSchema`
- [ ] `paginationSchema` (page, limit, total, hasMore)
- [ ] Reuse `moneySchema`/minor-unit validation for campaign amounts

### 7.2 Server-side rules

- [ ] Reject unknown query parameters and invalid enums with `VALIDATION_FAILED` (422).
- [ ] Clamp `limit` (e.g. 1–100) and reject negative pages.
- [ ] Validate slugs against the existing `packages/shared/src/utils/slug.ts` rules.
- [ ] Never trust a client-supplied `status` on public reads.
- [ ] Validate response payloads in the web client with the same schema (`api-client` pattern).

### 7.3 Content integrity (must survive Phase 6)

- [ ] No registration/tax claims in seeded or demo content.
- [ ] No contact details until verified.
- [ ] Impact statistics cannot publish without `reportingPeriod` + `source` + `verifiedAt`.
- [ ] Testimonials cannot publish without `consentRecordedAt`.
- [ ] Campaign amounts are integers in minor units.

---

## 8. Required tests

### 8.1 API unit

- [ ] Each route's Zod contract rejects malformed input (422 + field errors).
- [ ] Public read excludes `draft`/`scheduled` rows.
- [ ] Slug lookup returns `NOT_FOUND` problem document for unknown slugs.
- [ ] Pagination boundaries (page 1, last page, beyond last).
- [ ] Cache headers present and correct (`public` vs `no-store`).

### 8.2 API integration (real PostgreSQL)

- [ ] Migration applies cleanly to an empty database.
- [ ] Seeding twice leaves counts unchanged (idempotency).
- [ ] `/public/news` returns only published articles, newest first.
- [ ] `/public/campaigns/:slug` computes progress from stored amounts.
- [ ] Unpublished content is invisible to every public endpoint.
- [ ] `content_revisions` row created when content changes (once writes exist).

### 8.3 Web

- [ ] Loaders return the same shape as the demo adapters (contract parity test).
- [ ] A failed API call renders an error state, not a blank page.
- [ ] Empty collections render an empty state, not a broken shell.
- [ ] Demo-safeguard test still passes (only `demo-source.ts` imports `@/demo`).

### 8.4 Browser

- [ ] `pnpm check:responsive` on all routes with API-driven data.
- [ ] `pnpm check:console` clean on every route.
- [ ] A new `check:links` script (recommended) that fails on internal 404s.

---

## 9. Security requirements

### 9.1 Must be true at the end of Phase 6

- [ ] No new secret in the repository; all new config through `core/config/env.ts` with validation.
- [ ] Public endpoints are **read-only** — no `POST`/`PATCH`/`DELETE` outside `/health`.
- [ ] Every new query is Prisma-parameterised (no raw SQL).
- [ ] Draft content is never served publicly, including via direct slug guesses.
- [ ] `REDACTED_PATHS` extended for any new sensitive field (e.g. upload paths, storage keys).
- [ ] Response payloads contain no internal identifiers beyond UUIDs and no DB error text.
- [ ] Existing headers unchanged; **add a CSP** to the web document before any form posts to the API.
- [ ] `pnpm audit` shows no high/critical advisory.

### 9.2 Explicitly out of scope until Phase 7

Authentication, sessions, CSRF, MFA, rate limiting, authorisation guards, admin writes, media upload, audit write path.

### 9.3 Out of scope until Phase 9

Any payment code, provider SDK, webhook handler, refund logic, receipt issuance. IDFC endpoints/signatures must not be guessed — they arrive with official documentation and sandbox credentials.

---

## 10. Acceptance criteria for Phase 6

| # | Criterion | Verification |
|---|---|---|
| 6.1 | Content models exist and migrate cleanly on an empty database | `pnpm db:migrate:all` on a fresh DB + integration test |
| 6.2 | Seeding is idempotent (run twice, counts unchanged) | Integration test |
| 6.3 | Every public endpoint returns a `packages/shared` contract | Contract tests + client parsing |
| 6.4 | Public endpoints never return draft or scheduled content | Integration test with a draft fixture |
| 6.5 | Homepage renders from the API with the demo adapters removed | Delete adapters → build → all routes 200 |
| 6.6 | Every route still passes six-width responsive checks | `pnpm check:responsive` |
| 6.7 | No route logs a console or network error | `pnpm check:console` |
| 6.8 | A failed or slow API degrades to a stated error state | Fault injection test |
| 6.9 | Impact statistics and testimonials cannot publish without provenance/consent | Constraint + integration test |
| 6.10 | No write endpoint exists | Route table review |
| 6.11 | `noindex` still set on every route | Metadata probe |
| 6.12 | All existing checks still pass (typecheck, lint, format, tokens, unit, integration, build) | CI |

---

## 11. Recommended Phase 6 sequence

1. **Contracts first** — add Zod schemas in `packages/shared` and unit-test them.
2. **Models + one migration** — media, pages/sections, activities, news (smallest coherent slice).
3. **Read endpoints** for that slice, with integration tests.
4. **Wire one web route** (`/news`) end to end; keep the demo adapter as a fallback.
5. **Repeat** for events, campaigns, gallery, about/our-work, settings.
6. **Homepage** last — it composes everything.
7. **Remove demo adapters** only when every route is API-backed and all checks are green.

This order means the site is never broken mid-phase, and each slice is independently reviewable.

---

## 12. Open questions for the project owner

1. **Media storage**: object storage (S3-compatible) or local disk for staging? This decision gates the `media` model's columns.
2. **Publishing model**: does an editor need scheduled publishing at launch, or is publish-now sufficient for Phase 8? This affects whether the scheduler ships in Phase 6 or later.
3. **Contact details**: when will verified address/phone/email arrive? Until then `settings.contact.details` stays empty and the contact page stays a preview.
4. **Legal pages**: `/privacy-policy`, `/terms`, `/refund-policy` currently 404. Are these Phase 5b or Phase 10?
5. **Impact figures**: who signs off a statistic, and what counts as an acceptable `source` value? This determines the verification workflow.

---

## 13. Sign-off

| Item | Status |
|---|---|
| Audit completed | ✅ `docs/PROJECT_AUDIT_PHASES_1_TO_5.md` |
| Phase 6 implementation started | ❌ **No** — intentionally not started |
| Files changed by this checklist | None (this document only) |
| Recommendation | Approve the audit, apply the four pre-Phase-6 fixes, then start Phase 6 with contracts and models |
