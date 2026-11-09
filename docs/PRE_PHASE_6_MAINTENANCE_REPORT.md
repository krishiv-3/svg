# Pre-Phase 6 Maintenance Report

**Project:** Shri Vanshidhar Gaushala website
**Date:** 8 November 2026
**Scope:** the four findings agreed after the Phase 1–5 audit: production site URL, SEO title template, API client preservation, dead footer links.
**Status:** complete and verified. **Phase 6 has not been started.**

---

## 1. Findings before changes

All four were confirmed by inspecting the repository, not by trusting the audit summary.

### F1 — Production site URL had a silent localhost default

`apps/web/src/lib/server-env.ts` declared:

```ts
NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000')
```

Consequences observed in the audit:

- A production build without the variable **succeeded** and emitted `<link rel="canonical" href="http://localhost:3000/…">` and matching Open Graph URLs.
- Nothing rejected a `http://` origin or a localhost hostname.
- `metadataBase`, every canonical and every absolute URL derive from this value.

### F2 — Organisation name appeared twice in page titles

`apps/web/src/app/layout.tsx` sets `title.template: '%s | Shri Vanshidhar Gaushala'`, while every page's `seo.title` already contained the organisation name. Observed live:

| Route | Rendered `<title>` |
|---|---|
| `/` | `Shri Vanshidhar Gaushala — Compassion Begins With Care (demo) \| Shri Vanshidhar Gaushala` |
| `/about` | `About — Shri Vanshidhar Gaushala (demo) \| Shri Vanshidhar Gaushala` |
| `/news` | `News — Shri Vanshidhar Gaushala (demo) \| Shri Vanshidhar Gaushala` |

Detail pages (`/campaigns/[slug]`, `/events/[slug]`, `/news/[slug]`) were already correct because their titles are short.

### F3 — API client retained but never exercised

`apps/web/src/lib/api-client.ts` had **no callers** since the Phase 2 foundation page was removed in Phase 4. Inspection found three genuine weaknesses for its Phase 6 purpose:

1. `ApiRequestError` was **not exported**, so a caller could not distinguish "404 → render not-found" from "API down → render error state".
2. A 2xx response with an empty or malformed body made `response.json()` throw a raw `SyntaxError`, bypassing the error type entirely.
3. The module doc did not state that it is intentionally dormant, which is how it acquired "dead code" status in the audit.

Deleting it would have thrown away the only prepared integration surface, so it was corrected and documented instead.

### F4 — Seven footer links pointed at unbuilt routes

`FOOTER_NAV` contained:

| Label | Target | Exists? |
|---|---|---|
| Our gaushala | `/gaushala` | ❌ |
| Impact | `/impact` | ❌ |
| Transparency | `/transparency` | ❌ |
| Volunteer | `/volunteer` | ❌ |
| Volunteer with us | `/volunteer` | ❌ |
| Privacy policy | `/privacy-policy` | ❌ |
| Terms of use | `/terms` | ❌ |
| Refund policy | `/refund-policy` | ❌ |

Eight links across five columns; every one resolved to the 404 page from every page of the site.

---

## 2. Files modified

| File | Change | Task |
|---|---|---|
| `apps/web/src/lib/web-env.ts` | **New** — pure environment parser with production rules | 1 |
| `apps/web/src/lib/web-env.test.ts` | **New** — 10 unit tests | 1 |
| `apps/web/src/lib/server-env.ts` | Reduced to a `server-only` wrapper around the parser | 1 |
| `apps/web/.env.example` | Documents that the variable is required in production | 1 |
| `.github/workflows/ci.yml` | Supplies a reserved example origin to the CI build | 1 |
| `apps/web/src/content/pages.demo.ts` | 7 SEO titles no longer repeat the brand | 2 |
| `apps/web/src/content/homepage.demo.ts` | 1 SEO title no longer repeats the brand | 2 |
| `apps/web/src/content/pages.test.ts` | +2 tests (brand-once, title length) | 2 |
| `apps/web/src/content/homepage.test.ts` | +1 test (brand-once) | 2 |
| `apps/web/src/lib/api-client.ts` | Error type exported; body-parse failures typed; Phase 6 usage documented | 3 |
| `apps/web/src/components/site/nav.ts` | Footer limited to implemented routes | 4 |
| `apps/web/src/components/site/site-footer.tsx` | Column grid `lg:grid-cols-5` → `lg:grid-cols-3` | 4 |
| `docs/PRE_PHASE_6_MAINTENANCE_REPORT.md` | This report | — |

**Not changed:** database, schema, migrations, API application, any page design, any route, any dependency.

---

## 3. Exact changes

### Task 1 — `NEXT_PUBLIC_SITE_URL` mandatory in production

Logic moved into a pure, testable module (`web-env.ts`) because `server-env.ts` imports `server-only`, which throws outside a React Server Component context and therefore cannot be unit tested.

```ts
export const DEV_SITE_URL = 'http://localhost:3000';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

export function parseWebEnv(source, { isProduction }) { … }
```

Rules implemented:

- **Development / test:** the variable is optional; absence falls back to `http://localhost:3000`. Local work is unchanged.
- **Production:** the variable is **required**. Absence throws `WebEnvValidationError` with a message naming the variable and explaining why.
- **Production:** the value must be an absolute `https://` URL.
- **Production:** the hostname must not be localhost or a loopback address.
- Error messages name the field and the offending **hostname only** — never the full URL, which could carry a token. A test asserts this.
- No production domain is hardcoded anywhere.
- `server-env.ts` runs the parse at module load, which is build time for the App Router, so a misconfigured production build fails during `next build` as well as at `next start`.

`ci.yml` now exports `NEXT_PUBLIC_SITE_URL: https://ci.example.invalid` (a reserved example domain, not a deployment host) so the pipeline keeps building.

### Task 2 — SEO title template

The template was left intact (`%s | Shri Vanshidhar Gaushala`) because it is the correct behaviour for short page titles and for the design-system pages. The duplication was removed at its source: the page titles themselves no longer contain the organisation name.

| Route | Before | After |
|---|---|---|
| `/` | `Shri Vanshidhar Gaushala — Compassion Begins With Care (demo)` | `Compassion Begins With Care (demo)` |
| `/about` | `About — Shri Vanshidhar Gaushala (demo)` | `About (demo)` |
| `/our-work` | `Our work — Shri Vanshidhar Gaushala (demo)` | `Our work (demo)` |
| `/campaigns` | `Campaigns — Shri Vanshidhar Gaushala (demo)` | `Campaigns (demo)` |
| `/events` | `Events — Shri Vanshidhar Gaushala (demo)` | `Events (demo)` |
| `/news` | `News — Shri Vanshidhar Gaushala (demo)` | `News (demo)` |
| `/gallery` | `Gallery — Shri Vanshidhar Gaushala (demo)` | `Gallery (demo)` |
| `/contact` | `Contact — Shri Vanshidhar Gaushala (demo)` | `Contact (demo)` |

The homepage was checked separately: it now renders `Compassion Begins With Care (demo) | Shri Vanshidhar Gaushala` — brand once, page-specific text preserved, `(demo)` marker preserved.

Descriptions were **not** touched. Detail-page titles (`Winter Fodder Fund — demonstration campaign`, etc.) were already correct and are unchanged.

Two regression tests were added so this cannot silently return:

- no page or homepage `seo.title` may contain the organisation name;
- composed length (`title + " | " + brand`) must stay ≤ 65 characters.

### Task 3 — API client preserved and corrected

The file was **kept**. Three low-risk corrections:

1. `ApiRequestError` is now `export`ed so Phase 6 can branch on `status` (404 vs 5xx vs timeout).
2. `response.json()` is wrapped: a 2xx with an empty or malformed body now throws `ApiRequestError` with the status instead of a bare `SyntaxError`.
3. The module header now documents that it is intentionally dormant and lists the Phase 6 conventions (one `getX()` per loader, `next: { revalidate, tags }` for public caching, parse with `@gaushala/shared` schemas, never import from a client component).

Unchanged: timeout (1 500 ms), `cache: 'no-store'`, `accept: application/json`, `getApiStatus()` behaviour, and the fact that **no page calls it** — no API calls, mocks or stubs were added.

### Task 4 — Dead footer links

The footer now contains only destinations that exist. No page was created; no `#` or placeholder href was used.

| Column | Links |
|---|---|
| Explore | About us `/about`, Our work `/our-work`, Campaigns `/campaigns` |
| Our Work | Activities `/our-work`, Events `/events`, News `/news`, Gallery `/gallery` |
| Support | Donate `/donate`, Contact us `/contact` |

Removed: `/gaushala`, `/impact`, `/transparency`, `/volunteer` (×2), `/privacy-policy`, `/terms`, `/refund-policy`.

The Legal column had no reachable destinations at all, so it was removed rather than left empty or filled with fake targets. It returns when the legal pages exist (Phase 10).

The link grid changed from `lg:grid-cols-5` to `lg:grid-cols-3`; the surrounding design — cocoa surround, ivory panel, newsletter, skyline, copyright bar — is untouched. Verified visually and by overflow checks.

`nav.ts` also documents why the omitted routes are absent, so a future contributor does not re-add them prematurely.

---

## 4. Tests executed

| # | Command | Environment |
|---|---|---|
| 1 | `pnpm typecheck` | ordinary |
| 2 | `pnpm lint` | ordinary |
| 3 | `pnpm format:check` | ordinary |
| 4 | `pnpm test:unit` | full-access (Vitest spawns child processes) |
| 5 | `pnpm test:integration` | full-access, local PostgreSQL test database |
| 6 | `pnpm --filter @gaushala/web build` with `NEXT_PUBLIC_SITE_URL=https://localhost:3000` | **deliberate negative test** |
| 7 | `pnpm build` with `NEXT_PUBLIC_SITE_URL=https://gaushala.example` | full-access |
| 8 | `pnpm check:responsive` — 4 routes × 6 widths | full-access (headless Chrome) |
| 9 | `pnpm check:console` — 2 routes | full-access (headless Chrome) |
| 10 | Custom read-only HTTP probe — titles, canonicals, 17 internal links | ordinary |

`pnpm exec prettier --write` was run on **one new file** (`web-env.test.ts`) after `format:check` flagged it; nothing else was reformatted.

---

## 5. Test results

```
pnpm typecheck         ✅ Tasks: 5 successful, 5 total                        exit 0
pnpm lint              ✅ Tasks: 3 successful, 3 total                        exit 0
pnpm format:check      ✅ All matched files use Prettier code style!          exit 0
pnpm test:unit         ✅ 215 tests — web 133 (11 files), shared 44, api 38    exit 0
pnpm test:integration  ✅ 24 tests in 3 files                                 exit 0
pnpm build             ✅ Tasks: 4 successful, 4 total, 18.0 s                exit 0
```

Unit tests rose from 202 to **215** (+13: 10 environment, 2 title, 1 homepage-title).

The expected `23514`/`23505` constraint messages in the integration output are negative-path assertions inside passing tests.

### Negative test — the production guard fails the build

```
$ NEXT_PUBLIC_SITE_URL=https://localhost:3000 pnpm --filter @gaushala/web build
Error: Failed to collect configuration for /_not-found
  [cause]: Error [WebEnvValidationError]: Invalid web environment configuration:
    - NEXT_PUBLIC_SITE_URL: must not point at a local host ("localhost") in production
  Copy apps/web/.env.example to apps/web/.env.local for local development.
  Production must set NEXT_PUBLIC_SITE_URL. See docs/DEVELOPMENT.md.
> Build error occurred
```

The build refuses to proceed, names the variable and the reason, and does not print the full URL.

### SEO and link verification (live server, production configuration)

```
TITLE_FAILURES=0   CANONICAL_FAILURES=0   LINK_FAILURES=0

/        brand×1  Compassion Begins With Care (demo) | Shri Vanshidhar Gaushala
/about   brand×1  About (demo) | Shri Vanshidhar Gaushala
/news    brand×1  News (demo) | Shri Vanshidhar Gaushala
/donate  brand×1  Donate | Shri Vanshidhar Gaushala
canonical (all routes) = https://gaushala.example/…

17 internal links checked → 17 × 200
```

### Responsive and console

```
/                              PASS 360 · 390 · 768 · 1024 · 1280 · 1440  0 offenders
/about                         PASS (same six widths)                    0 offenders
/contact                       PASS (same six widths)                    0 offenders
/campaigns/winter-fodder-fund  PASS (same six widths)                    0 offenders
console                        CLEAN / and /contact — no console or network errors
```

The footer was also captured and inspected at 1440 px: three columns, unchanged panel, skyline, newsletter and copyright bar all intact.

---

## 6. Remaining limitations

| # | Limitation | Notes |
|---|---|---|
| L1 | **`next start` now requires `NEXT_PUBLIC_SITE_URL`** | Intended: it is a production-mode process. `pnpm dev` is unaffected. Documented in `apps/web/.env.example`. |
| L2 | **Three footer columns instead of five** | The Legal column and four unbuilt destinations return when their pages exist (Phases 5b/10). |
| L3 | **`/donate` still has no canonical** | Pre-existing; every other route sets one. Left untouched to keep the patch minimal. |
| L4 | **Open Graph tags remain homepage-only** | Out of scope; recommended before launch. |
| L5 | **No `sitemap.ts` / `robots.ts`** | Out of scope; `noindex` is still correct during the preview build. |
| L6 | **No Content-Security-Policy on the web document** | Audit finding I4; belongs with the security work before any form posts to the API. |
| L7 | **`api-client.ts` still has no callers** | Intentional; Phase 6 wires it. Its presence is now documented rather than mistaken for dead code. |
| L8 | **Demo content titles still carry "(demo)"** | Correct while the build is a preview; removed with the real content in Phase 10. |

---

## 7. Phase 6 confirmation

**Phase 6 has not been started.** This patch contains:

- ❌ no database models, schema or migration changes;
- ❌ no API endpoints, controllers or services;
- ❌ no CMS, authentication, sessions, media upload or audit logging;
- ❌ no frontend API integration — no page calls the API, and no mock responses were introduced;
- ❌ no new dependencies, and no upgrades;
- ❌ no route, page design or architectural change.

The only behavioural changes are the production URL guard, page-title text, the footer link set, and the API client's error typing.

**Ready for Phase 6 once you approve this patch.**
