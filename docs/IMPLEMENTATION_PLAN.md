# Implementation Plan — Shri Vanshidhar Gaushala

**Document status:** Phase 1 deliverable — awaiting approval
**Version:** 1.0 (proposal)
**Last updated:** 2026-11-05
**Source of truth:** `docs/Shri_Vanshidhar_Gaushala_Updated_Warm_Earth_Tone_Blueprint.docx` — §14 "Delivery roadmap: 12 phases"
**Related:** `ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `API_DESIGN.md`, `SECURITY_PLAN.md`, `SEO_PLAN.md`

---

## Table of contents

1. [How to read this plan](#1-how-to-read-this-plan)
2. [Delivery principles](#2-delivery-principles)
3. [Definition of Done](#3-definition-of-done)
4. [Phase gate process](#4-phase-gate-process)
5. [Team, roles and estimates](#5-team-roles-and-estimates)
6. [Milestones and timeline](#6-milestones-and-timeline)
7. [The twelve phases](#7-the-twelve-phases)
8. [Separate future milestone: IDFC FIRST Bank](#8-separate-future-milestone-idfc-first-bank)
9. [Cross-phase trackers](#9-cross-phase-trackers)
10. [Phase 1 completion checklist](#10-phase-1-completion-checklist)
11. [Decisions required from the project owner](#11-decisions-required-from-the-project-owner)
12. [Risks to the delivery plan](#12-risks-to-the-delivery-plan)
13. [Approval record](#13-approval-record)

---

## 1. How to read this plan

The twelve phases below are the blueprint's, unchanged in scope and order. Each phase is written so that it can be handed to an implementation agent as a single prompt and reviewed against objective criteria.

Every phase has:

- **Objective** — one sentence on the purpose.
- **Prerequisites** — what must already exist.
- **Deliverables** — concrete artefacts (files, screens, endpoints, documents).
- **Tasks** — the work breakdown.
- **Acceptance criteria** — how completion is proven. Each is testable.
- **Explicit non-goals** — what must not be built in this phase.
- **Risks** — what could go wrong and how to notice.
- **Estimate** — developer days, not calendar days.

> **Rule:** a phase is complete only when every acceptance criterion has evidence. "It works on my machine" is not evidence.

---

## 2. Delivery principles

| # | Principle |
|---|---|
| P1 | **One phase at a time.** No phase starts before the previous phase's gate is signed off. Silent scope creep is the main failure mode of this kind of build. |
| P2 | **The blueprint is the source of truth.** Any deviation is recorded as a decision with a reason, not made quietly. |
| P3 | **Never fabricate a Gaushala fact.** Placeholders are explicit and labelled. Unverified metrics, testimonials, registrations, hours and claims stay hidden. |
| P4 | **No invented payment details.** IDFC endpoints, payloads, signatures and credentials are integrated only from official documentation. |
| P5 | **Content editable from day one of the CMS.** Any string an editor will want to change must be reachable in the admin, never hardcoded in a component. |
| P6 | **Security and accessibility are acceptance criteria, not a later phase.** Each phase carries its own checks. |
| P7 | **Small, reversible commits.** Every PR is reviewable and every migration is revertible or forward-fixable. |
| P8 | **Tests for the denial path, not only the happy path.** Especially for permissions and payments. |
| P9 | **Documentation moves with the code.** An architecture change updates `ARCHITECTURE.md` in the same PR. |
| P10 | **Nothing goes to production that has not run in staging.** |

---

## 3. Definition of Done

A phase is Done when **all** of the following hold. This applies to every phase unless explicitly waived in writing.

### Code

- [ ] TypeScript strict mode; no `any` in domain code
- [ ] Lint and format clean
- [ ] Unit tests for business logic; integration tests for data paths
- [ ] No commented-out code, no debug logging, no TODOs left unlinked to an issue

### Function

- [ ] Acceptance criteria demonstrated (screenshot, test output or recording)
- [ ] Error, empty and loading states implemented
- [ ] Mobile layout verified at 360 px and 768 px

### Quality

- [ ] Accessibility: keyboard reachable, focus visible, labels present, axe scan has no new violations
- [ ] Performance: no regression beyond budget
- [ ] Responsive: no horizontal scroll at any breakpoint

### Security

- [ ] Every new route declares `public` or a permission
- [ ] Inputs validated; no secret or PII in logs
- [ ] No new dependency without justification

### Operations

- [ ] Migrations reviewed and reversible (or forward-fix documented)
- [ ] Environment variables documented in `.env.example`
- [ ] Health checks still pass

### Documentation

- [ ] Relevant docs updated (`ARCHITECTURE.md`, `API_DESIGN.md`, `DATABASE_DESIGN.md` as applicable)
- [ ] Changed-file summary written
- [ ] Phase acceptance checklist completed and signed

---

## 4. Phase gate process

```text
Implement → Self-review against acceptance criteria → Demo (staging)
        → Owner review → Gate decision ──→ Approve: next phase
                                       ├─→ Rework: return with notes
                                       └─→ Stop: escalate a decision
```

### Gate artefacts

| Artefact | Content |
|---|---|
| Changed-file summary | What was added/changed/deleted and why |
| Acceptance evidence | Test output, screenshots, links to staging routes |
| Test report | Unit/integration/E2E counts and results |
| Known issues | Deferred items with reasons and target phase |
| Decisions log | Any deviation from the blueprint with justification |
| Updated documents | Which docs changed |

### Gate rules

- A failed acceptance criterion blocks the gate unless the owner explicitly accepts the risk in writing.
- A new dependency on an external party (bank, DNS, credentials) is flagged at the gate, not discovered mid-phase.
- The next phase may be **planned** while the current gate is under review, but not **implemented**.

---

## 5. Team, roles and estimates

### 5.1 Roles

| Role | Responsibility | Needed in |
|---|---|---|
| **Implementation agent / developer** | Builds everything | All phases |
| **Project owner (client)** | Approves decisions, supplies content and brand assets, signs gates | All phases |
| **Content owner** | Supplies and verifies all Gaushala facts, copy, photographs | 10, 11 |
| **Design reviewer** | Approves the design system and page designs | 3–5 |
| **Legal / accounting reviewer** | Privacy notice, terms, refund policy, receipt wording | 9, 10, 11 |
| **Bank relationship owner** | IDFC merchant approval, documentation, sandbox credentials | Future milestone |
| **Security reviewer** | Reviews the risk register and pre-launch checklist | 11 |

### 5.2 Estimates

Developer-days for one experienced full-stack developer working with an agent. Calendar time assumes a 5-day week with review cycles.

| Phase | Estimate (dev-days) | Calendar (indicative) |
|---|---:|---|
| 1. Discovery & architecture | 3–4 | Week 1 |
| 2. Engineering foundation | 4–5 | Week 2 |
| 3. Design system | 5–6 | Weeks 2–3 |
| 4. Homepage | 4–5 | Week 3 |
| 5. Public pages | 8–10 | Weeks 4–5 |
| 6. Backend CMS foundations | 6–8 | Weeks 5–6 |
| 7. Auth, RBAC & audit | 5–6 | Week 6 |
| 8. Admin dashboard | 12–15 | Weeks 7–9 |
| 9. Donation foundation | 8–10 | Weeks 9–10 |
| 10. Real content population | 3–5 (+ client time) | Week 11 |
| 11. QA, SEO & security | 6–8 | Weeks 11–12 |
| 12. Deploy & launch | 3–4 | Week 12 |
| **Total** | **67–86** | **≈ 12–14 weeks** |

> These are planning estimates, not commitments. They assume decisions D-01…D-18 are answered promptly and content arrives on schedule. Content delays in Phase 10 are the most common cause of slippage.

### 5.3 Critical dependencies

```text
1 ─▶ 2 ─▶ 3 ─▶ 4 ─▶ 5
        └─▶ 6 ─▶ 7 ─▶ 8 ─▶ 9
                              └─▶ 10 ─▶ 11 ─▶ 12
```

- Phase 6 (CMS foundations) can start after Phase 2 and run in parallel with 3–5, because the public pages need its read APIs.
- Phase 7 depends on 6 (content entities to protect) and unlocks 8 and 9's admin surfaces.
- Phase 10 cannot start until real content is supplied; it is the only phase whose duration is dominated by an external party.

---

## 6. Milestones and timeline

| Milestone | Phase completion | What is demonstrable |
|---|---|---|
| **M1 — Approved architecture** | 1 | Stack, database, data model, route maps, permissions, security and SEO plans |
| **M2 — Engineering foundation** | 2 | Running monorepo, database connected, migrations, CI green, health checks |
| **M3 — Design system** | 3 | Reusable accessible UI kit at three breakpoints |
| **M4 — Homepage live (staging)** | 4 | CMS-driven homepage with real section architecture |
| **M5 — Full public site** | 5 | All public routes with metadata and structured data |
| **M6 — CMS backend** | 6 | Content CRUD, publishing, revisions, media, SEO fields |
| **M7 — Secure admin** | 7 | Multi-user auth, roles, permissions, audit trail |
| **M8 — Full CMS dashboard** | 8 | Staff can create, preview, publish, schedule, unpublish, archive without a developer |
| **M9 — Donation foundation** | 9 | Donation journey, mock provider, state machine, receipts, admin views |
| **M10 — Real content** | 10 | Production-ready content, no placeholders |
| **M11 — Release candidate** | 11 | QA, SEO and security verified |
| **M12 — Launched** | 12 | Production live, monitored, backed up, indexed |

---

## 7. The twelve phases

---

### Phase 1 — Discovery and architecture

**Objective:** Establish an approved technical foundation before any application code is written.

**Prerequisites:** Blueprint document available (it is).

**Deliverables**

| # | Deliverable | Location |
|---|---|---|
| 1 | Technology stack recommendation with rationale and rejected alternatives | `ARCHITECTURE.md` §4 |
| 2 | Architecture decision records (14 ADRs) | `ARCHITECTURE.md` §5 |
| 3 | PostgreSQL vs MongoDB comparison and decision | `DATABASE_DESIGN.md` §1 |
| 4 | Complete project folder structure | `ARCHITECTURE.md` §6 |
| 5 | Public website route map (23 content routes + 7 system routes) | `ARCHITECTURE.md` §8.1 |
| 6 | Admin dashboard route map (39 screens) | `ARCHITECTURE.md` §8.2 |
| 7 | Backend module structure and dependency rules | `ARCHITECTURE.md` §7 |
| 8 | ERD, 44 tables, constraints and index strategy | `DATABASE_DESIGN.md` §3–§11 |
| 9 | API architecture, conventions and endpoint catalogue | `API_DESIGN.md` |
| 10 | RBAC permission catalogue and 4-role matrix | `ARCHITECTURE.md` §10 |
| 11 | CMS publishing workflow and verification gates | `ARCHITECTURE.md` §9 |
| 12 | SEO architecture | `ARCHITECTURE.md` §13, `SEO_PLAN.md` |
| 13 | Donation and payment architecture (adapter contract, state machine, webhook flow) | `ARCHITECTURE.md` §11 |
| 14 | Risk register (39 risks) with mitigations | `SECURITY_PLAN.md` §15 |
| 15 | Twelve-phase implementation plan | this document |

**Tasks**

- [x] Inspect the workspace (only the blueprint was present; nothing overwritten)
- [x] Read and extract the complete blueprint (18 sections)
- [x] Recommend the stack with alternatives
- [x] Compare PostgreSQL and MongoDB with technical reasoning
- [x] Design the folder structure
- [x] Produce the route maps, module structure, ERD, API design, RBAC matrix, CMS workflow, SEO architecture and donation architecture
- [x] Identify security risks and build the risk register
- [x] Produce the six required documents
- [x] Divide delivery into the twelve phases with acceptance criteria

**Acceptance criteria**

| # | Criterion | Evidence |
|---|---|---|
| 1.1 | All six required documents exist and are internally consistent | Document set present |
| 1.2 | A single database engine is recommended with documented trade-offs and a reversibility assessment | `DATABASE_DESIGN.md` §1 |
| 1.3 | Every public route from the blueprint is mapped with purpose, rendering strategy and indexability | `ARCHITECTURE.md` §8.1 |
| 1.4 | Admin routes cover every blueprint CMS module | `ARCHITECTURE.md` §8.2 vs blueprint §6 |
| 1.5 | The permission matrix covers every module with four role templates and least privilege | `ARCHITECTURE.md` §10 |
| 1.6 | The publishing workflow supports instant publish, schedule, unpublish, archive and revision restore | `ARCHITECTURE.md` §9.2 |
| 1.7 | SEO covers technical, local, structured data, content and measurement | `SEO_PLAN.md` §2–§16 |
| 1.8 | The donation architecture makes browser redirects non-authoritative and cannot invent provider details | `ARCHITECTURE.md` §11 |
| 1.9 | Every identified risk has a mitigation, residual rating and owner | `SECURITY_PLAN.md` §15 |
| 1.10 | Each of the twelve phases has deliverables and testable acceptance criteria | this document §7 |
| 1.11 | No application code, schema or frontend has been created | Workspace contains only `docs/` |
| 1.12 | No Gaushala fact has been invented | Grep for numbers/claims in the document set |

**Non-goals:** No scaffolding, no dependency installation, no database creation, no UI.

**Risks**

| Risk | Mitigation |
|---|---|
| Owner disagrees with the stack, requiring rework | All decisions are numbered and listed in §11 for explicit approval |
| Over-engineering beyond a small charity's needs | Every ADR states a cost and a simpler alternative considered |
| Designing for features never used | Out-of-scope list in `ARCHITECTURE.md` §19 is explicit |

**Estimate:** 3–4 dev-days.

---

### Phase 2 — Engineering foundation

**Objective:** A repository where both applications boot, the database migrates, CI is green and health checks pass.

**Prerequisites:** Phase 1 approved; decisions D-01, D-02, D-03 confirmed.

**Deliverables**

- pnpm + Turborepo monorepo with `apps/web`, `apps/api`, `packages/shared`, `packages/config`
- Strict TypeScript, ESLint, Prettier configured for the whole workspace
- `apps/api`: Express 5 application skeleton with the full middleware chain (request ID, logging, security headers, error handler, 404), `/health/live`, `/health/ready`, `/version`
- `apps/api`: typed environment configuration with Zod validation that fails fast on missing values
- `apps/web`: Next.js app skeleton, root layout, fonts, `globals.css` with palette tokens, placeholder page
- PostgreSQL via `infra/docker/docker-compose.dev.yml` (postgres, redis, minio, mailpit)
- Prisma schema baseline + first migration + seed (permissions, roles, super admin, default settings)
- Structured logging with redaction and a redaction test
- Redis and in-memory cache/queue implementations behind one interface
- GitHub Actions: lint, typecheck, unit, integration (Postgres service), build
- `.env.example` documenting every variable
- `README.md` with setup in under 10 minutes

**Tasks**

1. Initialise the workspace, workspaces, Turborepo pipeline, shared tsconfig.
2. Create both applications and verify they boot together.
3. Bring up local infrastructure with Docker Compose.
4. Configure Prisma, generate the baseline migration, run the seed.
5. Implement `core/config`, `core/logging`, `core/http`, `core/db`, `core/cache`.
6. Implement health and version endpoints, including migration-pending detection.
7. Write integration tests using a disposable database.
8. Set up CI with caching and required status checks.
9. Write the README and onboarding notes.

**Acceptance criteria**

| # | Criterion | Verification |
|---|---|---|
| 2.1 | `pnpm install && pnpm dev` starts both apps from a clean clone | Manual run on Windows and Linux |
| 2.2 | `GET /health/live` returns 200 without touching dependencies | curl |
| 2.3 | `GET /health/ready` returns 200 with database and Redis up, 503 with the database down | Stop the container; observe |
| 2.4 | The baseline migration applies to an empty database and is idempotent on re-run | `prisma migrate deploy` twice |
| 2.5 | Seed is idempotent (run twice, same state) | Integration test |
| 2.6 | Missing or invalid env var prevents boot with a clear message | Remove `DATABASE_URL`; observe |
| 2.7 | Logs are JSON, contain a request ID, and redact cookies, auth headers and tokens | Automated redaction test |
| 2.8 | CI runs lint, typecheck, unit and integration tests and is green | Actions run |
| 2.9 | `pnpm build` succeeds for both apps | CI |
| 2.10 | Docker Compose brings up PostgreSQL, Redis, MinIO and Mailpit | `docker compose up` |

**Non-goals:** No business modules, no UI components, no auth, no content models beyond the seed tables.

**Risks:** Windows path/line-ending issues (mitigate with `.gitattributes`); Prisma engine download issues (document a mirror).

**Status:** ✅ **Complete** (6 November 2026). Nine of ten acceptance criteria fully demonstrated; 2.10 (Docker Compose) could not be executed because no Docker daemon was available in the build environment — the compose file is provided and the same scripts drive both paths. Full evidence, deviations and environment notes: [`PHASE_2_REPORT.md`](PHASE_2_REPORT.md).

**Estimate:** 4–5 dev-days.

---

### Phase 3 — Design system

**Objective:** A reusable, accessible component kit that expresses the Warm Earth & Terracotta identity.

**Prerequisites:** Phase 2.

**Deliverables**

- Design tokens as the single source of truth (`packages/shared/src/design/tokens.ts`) generating the Tailwind `@theme` CSS
- Palette implemented exactly: `#FFF8EF`, `#B85C38`, `#D97732`, `#4A2F24`, `#E9D7C3`, `#2C211B`, `#C69A52`, `#FFFFFF`, plus the approved accessible text variant
- Typography scale, spacing scale, radius, elevation, motion tokens
- Components: Button (primary/secondary/ghost/danger), Link, Input, Textarea, Select, Checkbox, Radio, Field + label + hint + error, Form error summary, Card, Badge, Alert, Breadcrumb, Pagination, Accordion, Tabs, Dialog, Toast, Skeleton, EmptyState, Table, Tag, Avatar, Tooltip, BreadcrumbList, SkipLink
- Site chrome: Header (desktop + mobile menu), Footer, Sticky donate CTA, Cookie consent banner
- Icon set (single consistent family, tree-shaken)
- Component documentation page (internal, `noindex`) with usage rules and do/don't examples
- Accessibility primitives: focus management, `aria-live` regions, reduced-motion support

**Tasks**

1. Author tokens and generate CSS variables.
2. Build primitives from the smallest element up, each with a Storybook-style page or a documentation route.
3. Build the site chrome with an accessible mobile menu (focus trap, Escape, `aria-expanded`).
4. Add the accessible text colour variant and document when to use brand vs text terracotta.
5. Add automated accessibility tests per component.
6. Design placeholder imagery treatment (clearly labelled, never resembling a real photo).

**Acceptance criteria**

| # | Criterion | Verification |
|---|---|---|
| 3.1 | Every component renders at 360/768/1280 px without horizontal scroll | Playwright viewport matrix |
| 3.2 | All interactive components are keyboard operable with a visible focus ring | Manual + axe |
| 3.3 | Text contrast ≥ 4.5:1 and UI contrast ≥ 3:1 in every documented combination | Contrast audit table |
| 3.4 | axe-core reports no critical or serious violations on the kit page | CI |
| 3.5 | Mobile menu traps focus, closes on Escape, returns focus to the trigger | Playwright test |
| 3.6 | Animations respect `prefers-reduced-motion` | Manual + CSS review |
| 3.7 | Tokens are consumed only through the token layer — no hardcoded hex in components | Lint/grep check |
| 3.8 | The palette matches the blueprint exactly | Visual review |
| 3.9 | The kit is documented with usage guidance | Kit page |

**Non-goals:** No real page layouts (Phase 4–5), no admin components beyond primitives.

**Risks:** Over-building the kit (mitigate: build only what Phases 4–5 need); contrast compromises that dilute the brand (mitigate: the documented `terracotta-ink` variant).

**Status:** ✅ **Complete** (6 November 2026). Tokens extended and verified, 30+ components built with 48 automated accessibility/guardrail tests, both reference pages captured at six widths with zero horizontal overflow. Accordion, tabs, toast, tooltip and pagination were deliberately deferred until a screen needs them. Full reference: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

**Estimate:** 5–6 dev-days.

---

### Phase 4 — Homepage

**Objective:** A premium, CMS-driven homepage with repeated, non-obtrusive donation calls to action.

**Prerequisites:** Phase 3; Phase 6's homepage read endpoint (may be stubbed with fixtures until available).

**Deliverables**

- Homepage composed of ordered, visibility-controlled sections: hero, trust strip, about preview, what we do, impact, featured campaign, latest news/events, gallery preview, support, contact, footer
- Every string, image, link and CTA label sourced from the API — **zero hardcoded content**
- Donation CTAs in header, hero, after the work/impact sections, campaign feature, pre-footer and footer; sticky desktop button; non-obstructive mobile bar
- Responsive layouts at mobile, tablet, desktop
- Homepage metadata, OG tags, site-level JSON-LD graph
- Loading, empty and error states for every section (a section with no data renders nothing, not a broken shell)
- Performance: LCP image prioritised, no layout shift

**Tasks**

1. Build the section components with typed props from the API contract.
2. Implement the section renderer mapping section type → component with unknown-type safety.
3. Wire the API with tag-based revalidation.
4. Implement CTA tracking hooks (event only, no PII).
5. Implement metadata and JSON-LD.
6. Test empty states by removing data for each section.
7. Measure CWV in the lab.

**Acceptance criteria**

| # | Criterion | Verification |
|---|---|---|
| 4.1 | Changing a hero title in the CMS changes the homepage without a deploy | Publish → reload |
| 4.2 | Section order and visibility follow the CMS configuration | Reorder → reload |
| 4.3 | Editing a CTA label in the CMS updates every instance | Publish → verify |
| 4.4 | Exactly one H1; logical heading order | Automated check |
| 4.5 | Unique title and meta description rendered server-side | `curl` without JS |
| 4.6 | JSON-LD valid | Rich Results Test |
| 4.7 | LCP < 2.5 s on a throttled mobile profile; CLS < 0.1 | Lighthouse CI |
| 4.8 | Keyboard-only navigation reaches every CTA and the menu | Manual |
| 4.9 | A section with no data renders nothing (no empty card, no placeholder) | Fixture test |
| 4.10 | No placeholder or invented statistic appears in production mode | Content review |

**Status:** 🟡 **Presentation complete** (6 November 2026). The full homepage is built and verified in a browser: eleven ordered sections composed from Phase 3 components, a typed content contract (`src/content/homepage.ts`) with a single loader seam (`getHomepageContent()`), and a donation placeholder route so no Donate CTA dead-ends. 209 automated tests pass, six-width overflow checks pass, and the page renders with no console or network errors.

**Deferred to Phase 6 / 5, deliberately:** criteria 4.1–4.3 (CMS-driven edits) need the homepage read endpoint; 4.6 (JSON-LD) needs verified organisation data; 4.7 (Lighthouse CWV) runs once real images exist. Content is demonstration content and the route remains `noindex`.

**Non-goals:** No donation form submission (Phase 9), no other public pages.

**Risks:** No real photography yet (mitigate: labelled placeholders, design that degrades gracefully); over-stuffed CTAs (mitigate: blueprint's placement list is the specification).

**Estimate:** 4–5 dev-days.

---

### Phase 5 — Public pages

**Objective:** Every remaining public route with useful content states, metadata and responsive layouts.

**Prerequisites:** Phase 4.

**Deliverables**

- `/about`, `/gaushala`, `/our-work`, `/our-work/[slug]`, `/impact`, `/campaigns`, `/campaigns/[slug]`, `/events`, `/events/[slug]`, `/news`, `/news/[slug]`, `/gallery`, `/volunteer`, `/contact`, `/transparency`, `/privacy-policy`, `/terms`, `/refund-policy`
- 404 page, error page, maintenance page
- Breadcrumbs on all detail pages
- Metadata and structured data per page type (`WebPage`, `Article`/`NewsArticle`, `Event`, `ImageGallery`, `BreadcrumbList`, `ContactPage`)
- Filtering and pagination on campaigns, events, news, gallery
- Empty states for each collection
- Accessibility pass and responsive pass on every route

**Tasks**

1. Build page templates driven by content type.
2. Implement list + detail patterns with pagination.
3. Implement per-route metadata and JSON-LD.
4. Implement breadcrumb generation from route config.
5. Implement the 404 and error boundaries.
6. Add `noindex` to every non-public route.
7. Add the link checker and metadata uniqueness check to CI.

**Acceptance criteria**

| # | Criterion | Verification |
|---|---|---|
| 5.1 | All blueprint public routes respond 200 with real content shapes | Route crawl |
| 5.2 | Each route has a unique title and meta description | Automated crawl |
| 5.3 | Each detail page has valid, truthful structured data | Rich Results Test |
| 5.4 | Breadcrumbs visible and mirrored in JSON-LD | Manual |
| 5.5 | Draft/scheduled content returns 404 publicly | Integration test |
| 5.6 | Collections show empty states rather than broken layouts | Fixture test |
| 5.7 | Every route passes axe with no critical violations | CI |
| 5.8 | Every route is usable at 360 px | Playwright matrix |
| 5.9 | 404 and 500 pages are helpful and `noindex` | Manual |
| 5.10 | No internal link returns 404 | CI link checker |

**Status:** ✅ **Presentation complete** (6 November 2026). Ten routes are built and verified in a browser: `/about`, `/our-work`, `/campaigns`, `/campaigns/[slug]`, `/events`, `/events/[slug]`, `/news`, `/news/[slug]`, `/gallery`, `/contact`. All seven listing pages have desktop and mobile captures; the four detail routes prerender via `generateStaticParams` and return a real 404 for unknown slugs. 226 automated tests pass, twelve routes pass six-width overflow checks, and no route logs a console or network error.

**Deferred:** 5.5 (draft/scheduled content) needs the CMS; 5.3 (JSON-LD) needs verified organisation data; 5.6 is covered only for the empty-event case (there is no fixture harness yet); 5.7 (axe) and 5.10 (link checker) are CI work for Phase 11. Contact details are deliberately unpublished, and the enquiry form is a validated preview that sends nothing.

**Non-goals:** No donation flow, no search (optional), no real content (Phase 10).

**Risks:** Placeholder-heavy pages looking finished (mitigate: explicit placeholder labels and a launch gate that forbids them); "thin page" temptation (mitigate: no page without substantive content).

**Estimate:** 8–10 dev-days.

---

### Phase 6 — Backend CMS foundations

**Objective:** Content models, CRUD APIs, publishing states, media metadata and SEO fields — with drafts strictly private.

**Prerequisites:** Phase 2.

**Deliverables**

- Prisma models for all content types (pages, sections, activities, news, events, campaigns, impact, testimonials, menus, revisions) with constraints C8–C23
- Module implementations: `content.*`, `media`, `seo` (redirects, sitemap feed), `settings`, `navigation`
- Zod contracts shared with the web app
- The standard content resource contract implemented for every type
- Publishing state machine: draft → publish/schedule → unpublish → archive → restore
- Generic revision service with immutable snapshots and restore
- Slug change → automatic 301 redirect (transactional, conflict-safe)
- Optimistic concurrency via `version` + `If-Match`
- Preview token issuance and validation
- Media upload pipeline: presign, byte verification, Sharp derivatives, EXIF strip, usage tracking
- Public read endpoints returning only published content
- Signed revalidation call on publish
- Scheduled-publish worker with `FOR UPDATE SKIP LOCKED`
- SEO metadata fields and validation on every content type
- Integration tests for every publication state and every constraint

**Tasks**

1. Author the Prisma schema and hand-written SQL migrations for constraints and triggers.
2. Implement repositories → services → controllers per module.
3. Implement the state machine with explicit allowed transitions.
4. Implement the revision snapshot/restore service.
5. Implement the redirect service with conflict and loop detection.
6. Implement the media pipeline end to end.
7. Implement the publish worker and the job-run record.
8. Implement public endpoints with the published filter.
9. Write the integration test suite, including negative cases.

**Acceptance criteria**

| # | Criterion | Verification |
|---|---|---|
| 6.1 | Public endpoints never return draft, scheduled, unpublished or deleted content | Integration tests per type |
| 6.2 | Publishing is instant: content is live after the revalidation call | Publish → public GET |
| 6.3 | Scheduled content goes live within 60 s of its time, exactly once across two worker instances | Concurrency test |
| 6.4 | Unpublishing removes content from public endpoints and the sitemap feed | Test |
| 6.5 | Archiving excludes content from lists but preserves it and its revisions | Test |
| 6.6 | Revision history is complete, immutable and restorable | Test |
| 6.7 | A slug change creates a working 301 and rejects conflicts | Test |
| 6.8 | A stale `If-Match` returns 409 and does not overwrite | Test |
| 6.9 | Media upload rejects wrong types, oversized files and mislabelled content | Test matrix |
| 6.10 | Deleting in-use media is blocked with usage details | Test |
| 6.11 | Every database constraint C8–C23 is covered by a test that attempts to violate it | Test inventory |
| 6.12 | Impact and testimonial verification gates prevent unverified publication | Test |

**Non-goals:** No admin UI (Phase 8), no authentication (Phase 7 — endpoints are temporarily unreachable in production), no donations.

**Status:** 🟡 **Sub-phases A–B complete** (8 November 2026). The content schema is in place: 14 tables, 15 enums, and a hand-written constraints migration encoding the publishing lifecycle, slug uniqueness, the impact verification gate and the testimonial consent gate. 34 integration tests attempt to violate each rule.

Sub-phase B adds the read layer: 10 repositories (paged, field-selected, soft-delete aware) and 11 services that enforce one centralised public-visibility predicate, typed page-section blocks in `@gaushala/shared`, DTO mapping that never exposes Prisma rows, and homepage bootstrap that guarantees the singleton row exists. 35 service tests plus 14 block-validation tests cover draft/scheduled/archived/future/soft-deleted isolation.

Scope note: the current brief restricts Phase 6 to read-only public endpoints — admin write endpoints, authentication, upload authorisation and donations stay out of scope (Phases 7/8/9). Sub-phases C–F (public API routes, frontend integration, media adapter, review) are not started.

**Risks:** Scope explosion in the content model (mitigate: only blueprint modules); JSONB schema drift (mitigate: block registry with `schemaVersion`).

**Estimate:** 6–8 dev-days.

---

### Phase 7 — Authentication, RBAC and audit

**Objective:** Multi-user authentication, configurable permissions, protected APIs and a reliable audit trail.

**Prerequisites:** Phase 6.

**Deliverables**

- Invitation-based user creation; no public signup
- Argon2id password hashing with documented parameters
- Session management: create, rotate, idle + absolute expiry, list, revoke one/all
- CSRF protection on all mutations
- Progressive lockout and rate limits on auth routes
- Password reset flow (single-use, hashed, expiring, no enumeration)
- TOTP MFA with encrypted secret and hashed recovery codes
- Permission catalogue seeded from code; four role templates; custom roles
- Per-user permission overrides (grant/deny, deny wins, reason required)
- Permission middleware + resource policies on every route
- Privilege-escalation guard and last-Super-Admin guard
- Route audit that fails the build on an undeclared route
- Audit log for auth, permission, publish, financial and export events
- Permission test matrix covering every role × every protected route

**Tasks**

1. Implement the auth module and session store.
2. Implement RBAC resolution with caching and invalidation.
3. Implement the middleware chain in the documented order.
4. Implement the route audit and the permission test generator.
5. Implement audit writes inside the relevant transactions.
6. Implement MFA enrolment, verification and recovery.
7. Implement account lockout and rate limiting.
8. Review all routes for authorisation completeness.

**Acceptance criteria**

| # | Criterion | Verification |
|---|---|---|
| 7.1 | Every non-public route returns 401 without a session and 403 without the permission | Generated matrix test |
| 7.2 | No route exists without a declared auth/permission policy | Route audit test |
| 7.3 | Session cookies carry `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefix | Header inspection |
| 7.4 | Revoking a session immediately blocks the next request | Test |
| 7.5 | Password reset tokens are single-use and revoke all sessions | Test |
| 7.6 | Five failed logins trigger a temporary lock with a generic message | Test |
| 7.7 | MFA enrol/verify/recovery/disable all work; recovery codes are single-use | Test |
| 7.8 | A role editor cannot grant a permission they do not hold | Test |
| 7.9 | The last Super Admin cannot be removed | Test |
| 7.10 | Every sensitive action produces an audit row with actor, action, target and time | Test |
| 7.11 | A CSRF-less mutation returns 403 | Test |
| 7.12 | Audit entries contain no secrets or full payment payloads | Test |

**Non-goals:** No admin UI screens (Phase 8), no SSO/SAML, no social login.

**Risks:** Permission gaps discovered late (mitigate: the route audit is built before the routes exist); MFA friction for staff (mitigate: optional except Super Admin).

**Estimate:** 5–6 dev-days.

---

### Phase 8 — Admin dashboard

**Objective:** Authorised staff can run the whole site from the dashboard without a developer.

**Prerequisites:** Phases 5–7.

**Deliverables**

**Shell**
- Admin layout: sidebar, breadcrumb, user menu, environment indicator, responsive mobile drawer
- Login, MFA, forgot/reset password, accept invitation screens
- Permission-aware navigation and empty-state guidance
- Global form patterns: validation display, save state, unsaved-changes guard, destructive confirmation

**Content**
- Page list with search/filter/pagination/bulk actions
- Page editor: title/slug/summary, section builder (add/reorder/hide/edit), rich-text editor, media picker, SEO tab, revisions tab, preview, publish/schedule/unpublish/archive controls
- Homepage builder: section order and visibility, hero fields, CTAs, featured campaign selection, selected activities, gallery selection
- Activities, news (with categories/tags/related), events (with operational status), campaigns (with updates and use-of-funds), impact statistics (with verification), testimonials (with consent evidence)
- Navigation/menu editor

**Media**
- Media library: grid/list, categories, search, upload with progress, alt text, caption, credit, replace, delete with in-use warnings

**Enquiries**
- Inbox: filters, assignment, notes, spam marking, retention display

**Donations**
- Donation list and detail: status history, attempts, receipt, reconcile, refund (Super Admin), export
- Donation settings: presets, purposes, receipt wording, provider status, kill switch

**SEO and settings**
- SEO defaults, redirect manager with validation
- General, contact, forms, email, analytics settings
- Users, roles (with permission matrix editor), audit log viewer
- Dashboard with role-appropriate operational summaries

**Acceptance criteria**

| # | Criterion | Verification |
|---|---|---|
| 8.1 | An editor can create, preview, publish, schedule, unpublish and archive every content type without a developer | End-to-end script |
| 8.2 | Every edit form validates inline with helpful, non-technical messages | Manual + tests |
| 8.3 | Unsaved changes are protected by a navigation guard | Manual |
| 8.4 | Destructive actions require typed confirmation naming the object | Manual |
| 8.5 | Both actions and navigation respect permissions; a forbidden request is blocked server-side regardless of UI | API test |
| 8.6 | Media upload shows progress, validates, and blocks deletion when in use | Manual |
| 8.7 | The revision history lists versions with author/time and restores correctly | Manual |
| 8.8 | The redirect manager rejects loops, chains and conflicts | Test |
| 8.9 | The dashboard shows role-appropriate data only | Test per role |
| 8.10 | All admin screens are usable at 360 px | Playwright matrix |
| 8.11 | Every admin response is `no-store` and `noindex` | Header test |
| 8.12 | axe reports no critical violations across admin screens | CI |

**Non-goals:** No donation payment integration (Phase 9), no bulk article import, no analytics dashboard beyond operational counts.

**Risks:** This is the largest phase — scope creep is likely (mitigate: the blueprint's CMS module table is the checklist); rich-text editor complexity (mitigate: constrain to the block/node allow-list from Phase 6).

**Estimate:** 12–15 dev-days.

---

### Phase 9 — Donation foundation

**Objective:** A trustworthy, provider-independent donation journey with a development mock and no path to false success.

**Prerequisites:** Phase 8.

**Deliverables**

- Donation data model and constraints (C1–C7)
- Donation page: purpose/campaign selection, presets (₹101, ₹251, ₹501, ₹1,001) + custom amount, donor details, consent, summary
- Server-side validation of amount, purpose, campaign window and consent
- `PENDING` order creation with a unique human-readable reference
- `PaymentProvider` interface with `MockPaymentProvider` and an IDFC stub that throws
- Production guard: mock cannot start when `NODE_ENV=production`
- Donation status machine with transactional transitions and history
- Webhook ingestion with signature verification, replay protection and amount matching
- Reconciliation job
- Verified receipt generation (PDF, private storage, sequence-numbered, configurable legal fields)
- Success, pending, failed pages driven by server state
- Admin donation views and receipt management
- Idempotency key handling on creation and refunds
- Kill switch for online donations

**Acceptance criteria**

| # | Criterion | Verification |
|---|---|---|
| 9.1 | A donation is `SUCCEEDED` only after a verified provider result | Integration test |
| 9.2 | The success page never shows success for a pending or fabricated reference | Test |
| 9.3 | A forged webhook signature changes nothing | Test |
| 9.4 | A replayed webhook applies no second transition and sends no second email | Test |
| 9.5 | Amount and currency mismatches never produce success | Test |
| 9.6 | Concurrent duplicate submissions with one idempotency key create exactly one donation | Concurrency test |
| 9.7 | A receipt is issued only for verified success; numbering is gapless and unique | Test |
| 9.8 | Refund totals cannot exceed the donation amount | Test |
| 9.9 | `PAYMENT_PROVIDER=mock` with `NODE_ENV=production` fails at startup | Test |
| 9.10 | Every donation status transition is recorded with actor and reason | Test |
| 9.11 | The full journey works on mobile with keyboard and touch | Manual |
| 9.12 | All payment edge cases in `SECURITY_PLAN.md` §7.4 pass | Test suite |
| 9.13 | Live payments are disabled in production configuration | Config review |

**Non-goals:** No real IDFC integration, no recurring donations, no donor accounts, no multi-currency.

**Risks:** Provider availability (mitigate: the mock keeps the whole phase unblocked); accidental real charges in testing (mitigate: test-mode credentials and the production guard).

**Estimate:** 8–10 dev-days.

---

### Phase 10 — Real content population

**Objective:** Replace every placeholder with approved, verified organisation content.

**Prerequisites:** Phase 9; the content and asset collection checklist from blueprint §15 completed by the organisation.

**Deliverables**

- Approved logo and brand assets
- Verified organisation name, address, phone, email, hours, social links
- About/history, mission, vision, activities — approved copy
- Authentic photography with permission, captions, dates and alt text
- Verified impact figures with reporting period, methodology and source
- Campaign content with approved use-of-funds wording
- Events, news, reports, transparency documents
- Legal pages reviewed by the organisation and their adviser
- Receipt wording approved by accounting
- All SEO titles, descriptions and internal links
- Zero placeholders remaining in production routes

**Acceptance criteria**

| # | Criterion | Verification |
|---|---|---|
| 10.1 | No placeholder or development text appears on any public route | Automated content scan |
| 10.2 | Every impact statistic has a reporting period, methodology and evidence, and is verified by a second person | Admin verification record |
| 10.3 | Every testimonial has recorded consent evidence | Admin record |
| 10.4 | No stock image is presented as the Gaushala | Visual review |
| 10.5 | Every image has meaningful alt text | Automated check |
| 10.6 | Contact details are consistent everywhere (single source) | Automated NAP check |
| 10.7 | Legal pages are approved in writing | Signed approval |
| 10.8 | No claim, registration, tax statement or service is published without documentary support | Content review checklist |
| 10.9 | The content owner signs off route by route | Sign-off sheet |

**Non-goals:** No code changes except fixing issues found during content entry.

**Risks:** Content not supplied on time — this is the most likely cause of delay (mitigate: begin collection during Phase 4); late factual corrections (mitigate: the CMS makes them instant).

**Estimate:** 3–5 dev-days plus significant client effort.

---

### Phase 11 — QA, SEO and security

**Objective:** Prove the site is correct, fast, accessible, discoverable and secure before it faces the public.

**Prerequisites:** Phases 9–10.

**Deliverables**

- Full regression test pass: public routes, admin workflows, role permissions, uploads, scheduled publishing, payment edge cases, mobile layouts
- Accessibility audit: automated + manual keyboard + screen-reader spot checks
- Performance audit: Lighthouse CI on key routes, field-data readiness, image and font review
- SEO audit: crawl, metadata uniqueness, canonicals, sitemap validity, robots, structured data, redirects, broken links, 404s
- Security review against the `SECURITY_PLAN.md` checklist
- DAST baseline and dependency/secret scans
- Backup and restore rehearsal with timing
- Deployment rehearsal in staging
- Analytics and consent verification
- Fixed defects with a regression test each

**Acceptance criteria**

| # | Criterion | Verification |
|---|---|---|
| 11.1 | All critical user journeys pass end to end | E2E suite |
| 11.2 | No unresolved critical or high security findings | Security checklist signed |
| 11.3 | Every public route passes axe with no critical violations | CI report |
| 11.4 | Keyboard-only completion of donate, contact and volunteer journeys | Manual |
| 11.5 | CWV "Good" in the lab on mobile for the key routes | Lighthouse report |
| 11.6 | Every indexable page has a unique title/description and a correct canonical | Crawl report |
| 11.7 | Sitemap contains only canonical, indexable URLs and no `noindex` page | Automated test |
| 11.8 | Structured data validates on every template | Rich Results Test |
| 11.9 | No redirect loops, chains or open redirects | Test |
| 11.10 | Restore from backup completed within RTO | Timed drill |
| 11.11 | No dependency with an open high/critical advisory | Scan report |
| 11.12 | Staging deploy rehearsal completed with rollback tested | Runbook |

**Non-goals:** No new features. Any feature request is logged for post-launch.

**Risks:** Late discovery of accessibility or SEO defects (mitigate: continuous checks since Phase 3); scope creep during QA (mitigate: a defect-only rule).

**Estimate:** 6–8 dev-days.

---

### Phase 12 — Deploy and launch

**Objective:** Production live, monitored, backed up, indexed and handed over.

**Prerequisites:** Phase 11 signed off; all decisions confirmed.

**Deliverables**

- Production infrastructure provisioned as per the approved topology
- Domain, DNS, HTTPS, HSTS, WAF configured
- Database migrated, seeded, backed up
- Object storage buckets, CDN and lifecycle rules configured
- Secrets stored in the platform store; `.env` verified
- Monitoring, alerting, error tracking and uptime checks live with named owners
- Search Console verified; sitemaps submitted; analytics and consent live
- `PAYMENT_PROVIDER=disabled` verified in production
- Launch checklist executed
- Rollback procedure documented and tested
- Handover pack: runbooks, credentials ownership, admin guide, editorial guide, support contacts

**Acceptance criteria**

| # | Criterion | Verification |
|---|---|---|
| 12.1 | Production smoke tests pass on every public route | Smoke script |
| 12.2 | HTTPS, HSTS and security headers verified | External header scan |
| 12.3 | Admin login works for the real Super Admin with MFA | Manual |
| 12.4 | A test donation in mock/disabled mode cannot be created in production | Negative test |
| 12.5 | `robots.txt` and `sitemap.xml` are correct and reachable | Manual |
| 12.6 | Search Console property verified and sitemap submitted | Screenshot |
| 12.7 | Alerts fire to a monitored channel (test alert) | Observation |
| 12.8 | A backup completes and one restore is verified | Log + drill |
| 12.9 | Rollback to the previous deployment tested | Runbook executed |
| 12.10 | The organisation confirms ownership of every account and credential | Signed handover |
| 12.11 | Post-launch monitoring shows no errors for 24 hours | Dashboard |
| 12.12 | Live donations remain disabled and the organisation knows how to enable them after IDFC approval | Written confirmation |

**Non-goals:** No IDFC go-live (separate milestone), no new content features.

**Risks:** DNS propagation delays (mitigate: TTL lowering 24 h ahead); last-minute content edits (mitigate: they are CMS edits, not deploys); certificate/DNS ownership ambiguity (mitigate: the handover pack names every owner).

**Estimate:** 3–4 dev-days.

---

## 8. Separate future milestone: IDFC FIRST Bank

**This is not Phase 13 and is not scheduled.** It begins only when merchant approval, official integration documentation and sandbox credentials exist.

### Gate (all must be true)

- [ ] Merchant account approved and active
- [ ] Official integration documentation received
- [ ] Sandbox credentials and test merchant configuration received
- [ ] Amount units, currency and rounding confirmed
- [ ] Webhook format, signature scheme and retry policy confirmed
- [ ] Refund and settlement reporting process confirmed
- [ ] PCI scope expectation confirmed in writing
- [ ] A named owner on the bank side and the organisation side

### Work (only after the gate)

1. Implement `IdfcPaymentProvider` against the real contract — `createIntent`, `verifyWebhook`, `parseWebhookEvent`, `fetchStatus`, `refund`, `healthCheck`.
2. Map provider states to the existing normalised `ProviderEvent` types. **No changes to the donation domain.**
3. Signature verification with the documented scheme; replay and amount checks reused.
4. Sandbox end-to-end testing: success, failure, cancel, timeout, duplicate, refund, partial refund.
5. Reconciliation against settlement reports.
6. Security review of the adapter and the webhook path.
7. Production credentials, staging rehearsal, then a limited live pilot.
8. Only then: enable live payments and update the CMS payment status.

### Explicit prohibition

No endpoint URL, payload shape, header name, authentication mechanism, signature algorithm or credential name may be invented, guessed or "stubbed with a plausible value" at any point. The adapter throws `ProviderNotConfiguredError` until real documentation exists.

---

## 9. Cross-phase trackers

### 9.1 Content-fidelity tracker

| Check | Applies from | Rule |
|---|---|---|
| No fabricated statistic | Phase 4 | Every number has a source, period and methodology |
| No fabricated testimonial | Phase 5 | Consent evidence recorded |
| No invented registration/tax claim | Phase 5 | Documentary support on file |
| No stock photo presented as real | Phase 4 | Labelled placeholders only |
| No invented service claim | Phase 10 | Organisation confirms each service |
| No invented contact detail | Phase 5 | Single verified source |

### 9.2 Accessibility tracker

| Requirement | Introduced | Verified |
|---|---|---|
| Semantic HTML and one H1 | Phase 4 | Every phase |
| Keyboard operability | Phase 3 | Phase 11 |
| Visible focus | Phase 3 | Phase 11 |
| 4.5:1 text contrast | Phase 3 | Phase 11 |
| Labelled form controls + error summary | Phase 3/9 | Phase 11 |
| Reduced-motion support | Phase 3 | Phase 11 |
| Alt text required in content | Phase 6 | Phase 10 |
| Accessible modals and menus | Phase 3/8 | Phase 11 |

### 9.3 SEO tracker

| Requirement | Introduced | Verified |
|---|---|---|
| Server-rendered HTML | Phase 4 | Phase 11 |
| Unique title/description | Phase 4 | Phase 5, 11 |
| Canonical URLs | Phase 5 | Phase 11 |
| Structured data | Phase 4 | Phase 11 |
| Sitemap | Phase 6 | Phase 11 |
| robots.txt | Phase 6 | Phase 11 |
| Redirects | Phase 6 | Phase 11 |
| Open Graph/Twitter | Phase 4 | Phase 11 |
| Search Console | Phase 12 | Post-launch |

### 9.4 Security tracker

| Control | Phase | Verified |
|---|---|---|
| Env validation, log redaction | 2 | 2 |
| Input validation everywhere | 2, 6 | 11 |
| Upload validation | 6 | 6, 11 |
| Auth, sessions, CSRF | 7 | 7, 11 |
| RBAC + route audit | 7 | 7, 11 |
| Audit log | 7 | 7, 11 |
| Payment verification, replay protection | 9 | 9, 11 |
| Security headers, CSP | 2, 11 | 11 |
| Backup and restore | 2, 12 | 11, 12 |
| Dependency and secret scanning | 2 | Every build |

---

## 10. Phase 1 completion checklist

### 10.1 Required documents

| # | Document | Status | Notes |
|---|---|:-:|---|
| 1 | `docs/ARCHITECTURE.md` | ✅ | Stack, 14 ADRs, folder structure, route maps, modules, RBAC matrix, CMS workflow, payment architecture, deployment, NFRs |
| 2 | `docs/DATABASE_DESIGN.md` | ✅ | PostgreSQL vs MongoDB, 44 tables, ERD, 23 constraints, indexes, migrations, retention |
| 3 | `docs/API_DESIGN.md` | ✅ | Conventions, error model, endpoint catalogue, content-resource contract, webhooks, permission matrix |
| 4 | `docs/SECURITY_PLAN.md` | ✅ | Threat model, 80+ controls, 39-risk register, ASVS/DPDP mapping, launch checklist |
| 5 | `docs/SEO_PLAN.md` | ✅ | Technical, metadata, canonical, sitemap, robots, structured data, local, content, measurement |
| 6 | `docs/IMPLEMENTATION_PLAN.md` | ✅ | This document: 12 phases with deliverables and acceptance criteria |

### 10.2 Task completion

| Task | Status | Evidence |
|---|:-:|---|
| Inspect the workspace without overwriting existing work | ✅ | Only `docs/…Blueprint.docx` existed; it was read, not modified |
| Read the complete blueprint | ✅ | All 18 sections extracted and used |
| Recommend the complete technology stack | ✅ | `ARCHITECTURE.md` §4 |
| Compare PostgreSQL and MongoDB, recommend one with reasoning | ✅ | `DATABASE_DESIGN.md` §1, ADR-003 |
| Design the complete folder structure | ✅ | `ARCHITECTURE.md` §6 |
| Public website route map | ✅ | `ARCHITECTURE.md` §8.1 (30 routes) |
| Admin dashboard route map | ✅ | `ARCHITECTURE.md` §8.2 (39 screens) |
| Backend module structure | ✅ | `ARCHITECTURE.md` §7 |
| Initial database ERD | ✅ | `DATABASE_DESIGN.md` §3–§9 |
| API architecture | ✅ | `API_DESIGN.md` |
| Admin RBAC permission matrix | ✅ | `ARCHITECTURE.md` §10 |
| CMS publishing workflow | ✅ | `ARCHITECTURE.md` §9.2 |
| SEO architecture | ✅ | `SEO_PLAN.md` |
| Donation and payment architecture | ✅ | `ARCHITECTURE.md` §11 |
| Security risk register | ✅ | `SECURITY_PLAN.md` §15 (39 risks) |
| Create all six required documents | ✅ | See 10.1 |
| Divide implementation into the 12 phases | ✅ | §7 of this document |

### 10.3 Constraint compliance

| Constraint | Status | Evidence |
|---|:-:|---|
| No frontend or backend built | ✅ | Workspace contains only `docs/` |
| No placeholder Gaushala facts or statistics | ✅ | All facts are `{verified …}` placeholders or omitted |
| No invented IDFC endpoints or credentials | ✅ | Adapter contract only; explicit stub that throws |
| CMS supports instant publishing for authorised users | ✅ | `ARCHITECTURE.md` §9.2 rule 1, ADR-010 |
| Multiple admin users and configurable permissions | ✅ | `ARCHITECTURE.md` §10 |
| All frequently changing content editable in the admin | ✅ | Blueprint §6 mapped module by module in `ARCHITECTURE.md` §9.1 |
| Warm Earth & Terracotta palette respected | ✅ | Tokens exactly as specified, with an accessibility-driven addition |
| Security not skipped | ✅ | `SECURITY_PLAN.md` |
| SEO not skipped | ✅ | `SEO_PLAN.md` |
| Accessibility not skipped | ✅ | `ARCHITECTURE.md` §14.2, `SEO_PLAN.md` §15 |
| Responsive design not skipped | ✅ | Breakpoints and verification in every phase |
| No database implementation started | ✅ | Design only; no schema file created |

### 10.4 Phase 1 verdict

Phase 1 is **complete and awaiting approval**. Phase 2 has **not** been started.

---

## 11. Decisions required from the project owner

| ID | Decision | Recommendation | Blocks |
|---|---|---|---|
| **D-01** | Frontend: Next.js (App Router) + TypeScript + Tailwind CSS v4 | Approve | Phase 2 |
| **D-02** | Backend: Express 5 + TypeScript as a separate API | Approve | Phase 2 |
| **D-03** | Database: PostgreSQL only | Approve | Phase 2 |
| **D-04** | Live donations disabled at launch; IDFC stub only | Approve | Phase 9 |
| **D-05** | RBAC: multiple roles per user + optional per-user overrides | Approve | Phase 7 |
| **D-06** | MFA enforced for Super Admin, optional for others | Approve | Phase 7 |
| **D-07** | English-only launch; Hindi later | Approve | Phase 3 |
| **D-08** | Instant publish for Content Editor; optional review switch per content type | Approve | Phase 6 |
| **D-09** | Transactional email provider and sender domain | Choose | Phase 7 |
| **D-10** | Error tracking / log aggregation provider | Choose | Phase 2 |
| **D-11** | Legal pages at flat URLs (`/privacy-policy`, `/terms`, `/refund-policy`) | Flat | Phase 5 |
| **D-12** | Single-organisation scope (no branch scoping) | Approve | Phase 6 |
| **D-13** | Receipt numbering format and legal fields | Supply | Phase 9 |
| **D-14** | Add `terracotta-ink #9A4A2C` for AA-compliant small text | Approve | Phase 3 |
| **D-15** | Hosting: managed (recommended) vs single VPS | Managed | Phase 12 |
| **D-16** | Commission an external penetration test? | Recommended if budget allows | Phase 11 |
| **D-17** | Legal entity type (for `NGO` vs `Organization` schema) | Confirm | Phase 5 |
| **D-18** | Analytics: privacy-first vs GA4 | Privacy-first | Phase 11 |
| **D-19** | Domain name and canonical host | Supply | Phase 5 |
| **D-20** | Who owns Google Business Profile, Search Console and the domain? | Name the owner | Phase 12 |

---

## 12. Risks to the delivery plan

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Content supplied late, stalling Phase 10 | High | High | Start the asset checklist in Phase 4; build with labelled placeholders; keep Phase 10 clearly gated |
| Owner unavailable for gate decisions | Medium | High | Batch decisions (D-01…D-20) now; agree a decision turnaround time |
| Scope expansion into e-commerce, memberships, Hindi | Medium | Medium | Explicit out-of-scope list; new features require a written change decision |
| No authentic photography at launch | Medium | Medium | Design must degrade gracefully; never substitute stock |
| IDFC approval delayed beyond launch | High | Low (planned for) | The site launches with donations disabled; the blueprint already anticipates this |
| Accessibility defects found late | Low | Medium | Continuous axe checks from Phase 3; manual passes in Phase 11 |
| Payment edge cases missed | Low | High | The 13-case test suite in `SECURITY_PLAN.md` §7.4 is a Phase 9 gate |
| Hosting cost surprises | Medium | Low | Two documented topologies with cost implications |
| Handover leaves no owner | Medium | High | Signed handover pack naming owners for security, SEO, DNS and analytics (D-20, SEC-O1) |

---

## 13. Approval record

| Item | Status |
|---|---|
| Phase 1 complete | ✅ |
| Phase 1 approved by project owner | ⏳ Pending |
| Decisions D-01 … D-20 resolved | ⏳ Pending |
| Phase 2 authorised to start | ⏳ **Blocked until approval** |

**Next action (on approval):**

1. Record the approved decisions in this document and in the ADRs.
2. Begin Phase 2 — engineering foundation.
3. Re-run this plan's estimates against actual progress and update the timeline.

**Phase 1 stops here. No Phase 2 work has begun.**
