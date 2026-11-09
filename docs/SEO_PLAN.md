# SEO Plan — Shri Vanshidhar Gaushala

**Document status:** Phase 1 deliverable
**Version:** 1.0 (proposal)
**Last updated:** 2026-11-05
**Related:** `ARCHITECTURE.md` §13, `DATABASE_DESIGN.md`, `API_DESIGN.md`, `SECURITY_PLAN.md`

> **No ranking, traffic or position is promised.** This plan builds the technical and editorial conditions under which a trustworthy local charitable site can be discovered. Results depend on content quality, competition, domain history and factors outside our control.

---

## Table of contents

1. [Objectives and success measures](#1-objectives-and-success-measures)
2. [Technical SEO architecture](#2-technical-seo-architecture)
3. [URL and slug policy](#3-url-and-slug-policy)
4. [Metadata model and per-route specification](#4-metadata-model-and-per-route-specification)
5. [Canonicalisation and indexation control](#5-canonicalisation-and-indexation-control)
6. [Sitemap architecture](#6-sitemap-architecture)
7. [robots.txt](#7-robotstxt)
8. [Redirects and error handling](#8-redirects-and-error-handling)
9. [Structured data plan](#9-structured-data-plan)
10. [Image and media SEO](#10-image-and-media-seo)
11. [Local SEO](#11-local-seo)
12. [Content strategy](#12-content-strategy)
13. [Internal linking and information architecture](#13-internal-linking-and-information-architecture)
14. [Core Web Vitals and technical performance](#14-core-web-vitals-and-technical-performance)
15. [Accessibility and SEO](#15-accessibility-and-seo)
16. [Measurement and analytics](#16-measurement-and-analytics)
17. [Governance and anti-spam rules](#17-governance-and-anti-spam-rules)
18. [QA checklists](#18-qa-checklists)
19. [Ongoing monitoring](#19-ongoing-monitoring)
20. [Phase mapping and open questions](#20-phase-mapping-and-open-questions)

---

## 1. Objectives and success measures

### 1.1 Objectives

| ID | Objective |
|---|---|
| **SEO-1** | Every public page is crawlable, indexable and returns complete server-rendered HTML with unique metadata |
| **SEO-2** | Search engines and social platforms can understand the organisation, its location, its events and its articles through truthful structured data |
| **SEO-3** | The site performs well on mobile Core Web Vitals, because rankings and user experience both depend on it |
| **SEO-4** | The organisation can publish SEO-relevant content through the CMS without developer involvement |
| **SEO-5** | Branded and local searches for the organisation's verified services lead to the site |
| **SEO-6** | No SEO technique on this site relies on a claim the organisation cannot substantiate |

### 1.2 Measurement framework

Baseline is established **after** launch; targets are expressed as directions and thresholds, not guaranteed outcomes.

| Metric | Source | Baseline | 3-month aim | 6-month aim |
|---|---|---|---|---|
| Indexed, canonical pages | Search Console → Pages | Record at launch | 90% of submitted URLs | ≥ 98% |
| Pages with a unique title + description | Automated crawl | 100% at launch | 100% | 100% |
| Organic impressions (branded) | Search Console | Record | Growing | Growing |
| Organic clicks (non-branded) | Search Console | Record | Establish | Growing where content exists |
| Core Web Vitals (mobile, p75) | CrUX / field data | Record | All "Good" | All "Good" |
| LCP (mobile, p75) | CrUX | Record | < 2.5 s | < 2.5 s |
| Donation CTA → donation start rate | Analytics | Record | Improve vs baseline | Improve vs baseline |
| Donation start → verified completion | Server analytics | Record | Improve vs baseline | Improve vs baseline |
| Contact/volunteer form submissions | Analytics | Record | Growing | Growing |
| Crawl errors (4xx/5xx on internal links) | Search Console + crawl | 0 | 0 | 0 |
| Structured-data errors | Rich Results Test / Search Console | 0 | 0 | 0 |

> Search Console needs 2–4 weeks of data before any baseline is meaningful. Do not report performance conclusions before then.

---

## 2. Technical SEO architecture

### 2.1 Rendering

| Requirement | Implementation |
|---|---|
| Crawlers receive meaningful HTML | Every indexable route is server-rendered (SSG/ISR/SSR). No indexable content is client-only |
| Content is fresh after publishing | On-demand tag revalidation triggered by the API (ADR-010), with a 300 s ISR fallback |
| No hydration-dependent content | Headings, body copy, metadata, JSON-LD and links are all present in the initial HTML |
| Social scrapers | Open Graph and Twitter meta tags rendered server-side; a static fallback image always exists |
| No soft 404s | Unpublished or missing content returns HTTP 404 (or 410), never a 200 "not found" page |

Verification: `curl` the rendered HTML and confirm the H1, body text, `<title>`, canonical, JSON-LD and internal links are present **without** executing JavaScript. This is a Phase 11 acceptance test.

### 2.2 HTML semantics

- Exactly one `<h1>` per page; the visible page title.
- Logical `<h2>`/`<h3>` outline; no headings used purely for styling.
- `<main>`, `<header>`, `<nav>`, `<footer>`, `<article>`, `<time datetime="">` used correctly.
- Breadcrumb navigation on all detail pages (also mirrors `BreadcrumbList` structured data).
- Lists, tables and forms use semantic elements.
- No content injected into `<noscript>` as a substitute for real content.

### 2.3 Indexable route inventory

| Route | Indexable | Sitemap | Rendering |
|---|:-:|:-:|---|
| `/` | ✔ | ✔ | ISR |
| `/about` | ✔ | ✔ | ISR |
| `/gaushala` | ✔ | ✔ | ISR |
| `/our-work` | ✔ | ✔ | ISR |
| `/our-work/[slug]` | ✔ | ✔ | ISR |
| `/impact` | ✔ | ✔ | ISR |
| `/campaigns` | ✔ | ✔ | ISR |
| `/campaigns/[slug]` | ✔ | ✔ | ISR |
| `/events` | ✔ | ✔ | ISR |
| `/events/[slug]` | ✔ | ✔ | ISR |
| `/news` | ✔ | ✔ | ISR |
| `/news/[slug]` | ✔ | ✔ | ISR |
| `/gallery` | ✔ | ✔ | ISR |
| `/volunteer` | ✔ | ✔ | ISR |
| `/contact` | ✔ | ✔ | ISR |
| `/transparency` | ✔ | ✔ | ISR |
| `/privacy-policy` | ✔ | ✔ | ISR |
| `/terms` | ✔ | ✔ | ISR |
| `/refund-policy` | ✔ | ✔ | ISR |
| `/donate` | ✘ `noindex` | ✘ | SSR |
| `/donation/success`, `/donation/failed` | ✘ `noindex` | ✘ | SSR |
| `/search` | ✘ `noindex` | ✘ | SSR |
| `/admin/*` | ✘ `noindex` + basic auth | ✘ | CSR/SSR |
| `/preview/*` | ✘ `noindex, nofollow` | ✘ | SSR |
| `/api/*` | ✘ `noindex` + `Disallow` | ✘ | — |

**Policy on thin pages:** a route is indexable only when it has substantive, unique, verified content. An empty campaign archive or an events page with no events is served with useful guidance (and `noindex, follow`) rather than an empty indexable page. This is reviewed per page at Phase 10.

### 2.4 Pagination

- Paginated archives (`/news?page=2`, `/campaigns?page=2`) are indexable with **self-referencing canonicals** and unique titles ("News — Page 2").
- No `noindex` on paginated pages (a common cause of lost deep content).
- `rel="next"`/`rel="prev"` is not used as an indexing signal (Google retired it) but links are present for crawlability.
- A "view all" page is not created unless content depth justifies it.

### 2.5 JavaScript and CSS

- CSS and JS required for rendering are **not** blocked in `robots.txt`.
- No content is hidden behind an interaction (accordions are fine if the content is in the HTML; tab panels must be in the DOM).
- Third-party scripts are minimal and never block rendering; no CSS-in-JS runtime that delays paint.

---

## 3. URL and slug policy

| Rule | Detail |
|---|---|
| Case | Lowercase only |
| Characters | `a-z`, `0-9`, hyphen; no underscores, no transliteration artefacts, no trailing hyphen |
| Structure | Short and descriptive: `/news/winter-shelter-preparations`, not `/news?id=1842` |
| Depth | Two segments where possible; three maximum for a detail page |
| Trailing slash | Disabled (`trailingSlash: false`); a request with a trailing slash 308-redirects to the canonical form |
| Query strings | Never part of an indexable URL except pagination (`?page=n`), which is self-canonical |
| Stop words | Removed unless they aid clarity (`/about`, not `/about-us-our-story`) |
| Duplicate slugs | Impossible within a route segment (unique index, including against redirect sources) |
| Slug changes | Allowed on published content; automatically create a 301 redirect from the old path; the old slug is permanently reserved |
| Reserved slugs | `admin`, `api`, `preview`, `donate`, `donation`, `search`, `sitemap`, `robots`, `news`, `events`, `campaigns`, `our-work`, `about`, `gaushala`, `impact`, `gallery`, `volunteer`, `contact`, `transparency`, `privacy-policy`, `terms`, `refund-policy` — the API rejects them for new pages |
| Language | Slugs in English at launch; a Hindi launch would use `/hi/` prefixes (ADR-013) |

### 3.1 Slug generation in the CMS

- Auto-suggested from the title, editable by a user with write permission.
- Validated live against: the reserved list, the current table, the redirect table.
- Changing the slug on published content shows a warning: "This will create a 301 redirect from the old URL. Existing links will keep working."
- Slugs are never silently changed by the system.

---

## 4. Metadata model and per-route specification

### 4.1 Field model

Every indexable content record exposes these editable fields (all optional in the CMS; defaults applied at render):

| Field | Limit | Default | Notes |
|---|---|---|---|
| `seoTitle` | 70 characters (guidance 50–60) | Content title + title template | The live preview shows where Google truncates |
| `seoDescription` | 180 characters (guidance 120–155) | Content summary, then the site default | Never auto-truncated mid-word |
| `canonicalUrl` | Absolute URL | Generated from the route | Overridable only by Super Admin, with a warning |
| `ogTitle` | 70 | `seoTitle` | Social-specific override |
| `ogDescription` | 200 | `seoDescription` | |
| `ogImageId` | — | Content cover image, else the site default | 1200×630 recommended |
| `twitterCard` | enum | `summary_large_image` | |
| `noindex` | boolean | `false` | Reason required when set true |
| `structuredData` | JSONB override (whitelisted fields only) | Generated | Never free-form JSON injection |

### 4.2 Site-wide defaults (Settings → SEO)

| Setting | Value |
|---|---|
| Site name | `Shri Vanshidhar Gaushala` (confirmed project name) |
| Title template | `%s \| Shri Vanshidhar Gaushala` |
| Homepage title | `<Tagline> \| Shri Vanshidhar Gaushala` — tagline supplied by the organisation |
| Default description | Supplied by the organisation; not generated |
| Default social image | 1200×630, logo + palette, created in Phase 3 |
| Organisation legal name | Supplied (must match registration documents) |
| Locale | `en_IN` |
| Timezone | `Asia/Kolkata` |

### 4.3 Per-route title and description blueprint

Copy below is a **structure**, not final content. Every bracket is filled from verified organisation content at Phase 10.

| Route | `<title>` | Meta description structure | H1 |
|---|---|---|---|
| `/` | `{Tagline} \| Shri Vanshidhar Gaushala` | `{One-sentence description of verified work}, {verified location}.` | `{Hero headline}` |
| `/about` | `About Us \| Shri Vanshidhar Gaushala` | `Learn about Shri Vanshidhar Gaushala — {verified mission summary}, {verified location}.` | `About Shri Vanshidhar Gaushala` |
| `/gaushala` | `Our Gaushala \| Shri Vanshidhar Gaushala` | `{Verified description of daily care and facilities}. Visit or support our work in {verified location}.` | `Inside Our Gaushala` |
| `/our-work` | `Our Work \| Shri Vanshidhar Gaushala` | `{Verified list summary} — the day-to-day work of Shri Vanshidhar Gaushala.` | `Our Work` |
| `/our-work/[slug]` | `{Activity title} \| Shri Vanshidhar Gaushala` | `{First 150 characters of the activity summary}` | `{Activity title}` |
| `/impact` | `Our Impact \| Shri Vanshidhar Gaushala` | `Verified outcomes from {reporting period}, with methodology and source notes.` | `Our Impact` |
| `/campaigns` | `Campaigns \| Shri Vanshidhar Gaushala` | `Active and past campaigns supporting {verified purpose}. See goals, progress and how funds are used.` | `Campaigns` |
| `/campaigns/[slug]` | `{Campaign name} \| Shri Vanshidhar Gaushala` | `{Purpose summary}. Target {amount}, ends {date}. Support the campaign.` | `{Campaign name}` |
| `/events` | `Events \| Shri Vanshidhar Gaushala` | `Upcoming events at Shri Vanshidhar Gaushala in {location}. Dates, venue and how to attend.` | `Events` |
| `/events/[slug]` | `{Event title} — {date} \| Shri Vanshidhar Gaushala` | `{Event title} on {date} at {venue}. {One-line description}.` | `{Event title}` |
| `/news` | `News & Updates \| Shri Vanshidhar Gaushala` | `Stories, announcements and updates from Shri Vanshidhar Gaushala.` | `News & Updates` |
| `/news/[slug]` | `{Article title} \| Shri Vanshidhar Gaushala` | `{Excerpt, first 155 characters}` | `{Article title}` |
| `/gallery` | `Gallery \| Shri Vanshidhar Gaushala` | `Photographs and videos from our gaushala in {verified location}.` | `Gallery` |
| `/volunteer` | `Volunteer With Us \| Shri Vanshidhar Gaushala` | `How you can help at Shri Vanshidhar Gaushala — {verified volunteer options}.` | `Volunteer With Us` |
| `/contact` | `Contact Us \| Shri Vanshidhar Gaushala` | `Visit, call or write to Shri Vanshidhar Gaushala. Address, phone, email and opening hours.` | `Contact Us` |
| `/transparency` | `Transparency \| Shri Vanshidhar Gaushala` | `Reports, policies and documents published by Shri Vanshidhar Gaushala.` | `Transparency` |
| `/privacy-policy` | `Privacy Policy \| Shri Vanshidhar Gaushala` | `How Shri Vanshidhar Gaushala collects, uses and protects your personal data.` | `Privacy Policy` |
| `/terms` | `Terms of Use \| Shri Vanshidhar Gaushala` | `Terms for using this website and making a donation to Shri Vanshidhar Gaushala.` | `Terms of Use` |
| `/refund-policy` | `Donation Refund Policy \| Shri Vanshidhar Gaushala` | `Our policy on donation refunds and cancellations.` | `Donation Refund Policy` |

**Constraints on generated copy:**

- No superlative claims ("best", "largest", "India's leading") without verifiable substantiation.
- No location keywords stuffed beyond natural use.
- No fabricated numbers in titles or descriptions.
- The description must read as a sentence a human wrote, not a keyword list.
- Every page's title and description must be unique — an automated crawl check enforces this.

### 4.4 Metadata implementation

```ts
// apps/web/src/lib/seo.ts (shape)
buildMetadata({
  title, description, path, image, noindex, type, publishedTime, modifiedTime,
}): Metadata
```

Rules:
- `metadataBase` set from `SITE_URL` so relative OG URLs resolve absolutely.
- Canonical is always absolute and lowercase.
- `openGraph.type` is `website` for pages, `article` for news, `event`-appropriate metadata for events.
- `robots` is `{ index: false, follow: true }` for `/donation/*` and `/search`; `{ index: false, follow: false }` for `/preview/*` and `/admin/*`.
- Draft/preview rendering forces `noindex` regardless of stored settings.

---

## 5. Canonicalisation and indexation control

| Concern | Rule |
|---|---|
| Canonical host | One host (`https://<domain>`), no `www` variant. The other host 301-redirects |
| Protocol | HTTPS only; HTTP 301 |
| Case | Lowercase URLs; uppercase requests 301 to lowercase |
| Trailing slash | Normalised to no-slash |
| Query parameters | Stripped from canonicals; `?utm_*`, `?fbclid` and similar never used in a canonical |
| Pagination | Self-canonical per page |
| Filters | Campaign/news filter combinations are `noindex, follow` unless a filter combination represents substantial unique content (decided per case; default `noindex`) |
| Duplicate content | Detail pages exist at a single canonical path; no `/news/slug` and `/article/slug` duplicates |
| Cross-domain | No syndication planned; if content is syndicated, the site version is canonical |
| `noindex` | Never combined with a canonical that points elsewhere (a contradictory signal) |
| Soft 404 | Never returned; use a real 404/410 |
| Mixed `noindex`/sitemap inclusion | Impossible by construction: the sitemap is generated from the same published-and-indexable predicate |

**Sitemap ∩ indexability invariant:** the sitemap query and the `noindex` decision both read the same function (`isIndexable(entity)`), and an automated test asserts that no URL in the sitemap renders a `noindex` tag.

---

## 6. Sitemap architecture

### 6.1 Structure

```
/sitemap.xml                  → sitemap index
/sitemaps/pages.xml           → static pages + policies
/sitemaps/news.xml            → published articles (last 24 months; older articles remain reachable and crawled via archives)
/sitemaps/events.xml          → all published events (past events stay indexed — they have lasting value)
/sitemaps/campaigns.xml       → all published campaigns
/sitemaps/activities.xml      → published activities
/sitemaps/images.xml          → image entries for gallery and article covers (optional, added if the gallery is substantial)
```

Each child sitemap holds up to 45,000 URLs (under the 50,000 limit) with a 50 MB uncompressed cap. At the expected scale of this site (hundreds of URLs), a single file per type is ample; the index structure exists so growth needs no redesign.

### 6.2 Entry rules

| Field | Rule |
|---|---|
| `<loc>` | Absolute canonical URL, HTTPS, no query string |
| `<lastmod>` | `updatedAt` of the **published revision**, ISO 8601 with timezone. Never `now()` — a fake lastmod is a lie crawlers learn to ignore |
| `<changefreq>` | Omitted (Google ignores it) |
| `<priority>` | Omitted (Google ignores it) |
| Included | Only `status = PUBLISHED`, `noindex = false`, `deletedAt IS NULL`, `publishedAt <= now()` |
| Excluded | Drafts, scheduled, unpublished, archived, admin, preview, donation, search, filtered lists |
| Image sitemap | `<image:image>` with `<image:loc>`, `<image:title>` (caption) and `<image:caption>`; alt text is in the HTML, not the sitemap |

### 6.3 Generation and caching

- Generated from `GET /public/sitemap` (API) and rendered to XML by the web app.
- Cached 1 hour at the edge, and **revalidated immediately on publish/unpublish/delete**.
- Returns `Content-Type: application/xml; charset=utf-8`.
- A malformed sitemap is a launch blocker; validation runs in CI against a schema and in the Phase 11 checklist.

### 6.4 Sitemap health

- Search Console reports sitemap status weekly.
- An internal job alerts if a sitemap returns non-200, contains zero URLs, or grows/shrinks by more than 30% in a day (a signal of an accidental mass publish/unpublish).

---

## 7. robots.txt

```
# https://<domain>/robots.txt
User-agent: *
Allow: /

# Staff and transactional areas
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /preview/
Disallow: /donation/
Disallow: /search

# Never block /_next/static or CSS/JS: crawlers need them to render pages.

Sitemap: https://<domain>/sitemap.xml
```

Rules:

- Generated dynamically from settings so it cannot drift from the real routes.
- `Allow: /` first, then specific disallows; no wildcard over-blocking.
- **No `Disallow` on any asset path** required for rendering.
- No `Host:` directive (ignored by Google, non-standard).
- `Crawl-delay` is not used (ignored by Google, harmful with Bing).
- A `404`/`503` robots.txt is never served (it can deindex the site); during maintenance the site returns a proper `503` with `Retry-After` and robots.txt remains `200`.
- Sensitive paths are protected by authentication, not by `robots.txt` — obscurity is never the control.

---

## 8. Redirects and error handling

### 8.1 Redirect policy

| Situation | Status | Rule |
|---|---|---|
| Slug changed on published content | `301` | Created automatically in the same transaction |
| Page merged into another | `301` | Editor chooses the target |
| Content permanently removed with no equivalent | `410` | Explicit "retired" action; keeps the URL out of the index faster than a 404 |
| Temporary unpublish | `404` | Not a redirect; the page may return |
| Legacy URL from an old site | `301` to the closest new page | Imported in bulk at Phase 10 with a mapping sheet |
| HTTP → HTTPS | `301` | Edge |
| `www` → apex | `301` | Edge |
| Trailing slash / uppercase | `308`/`301` | Middleware |
| Query string on indexable pages | Stripped, not redirected | Avoid redirect chains |

### 8.2 Redirect hygiene

- **No chains:** if `A → B` exists and `B → C` is added, `A` is rewritten to `C` automatically.
- **No loops:** a write that would create a cycle is rejected with a clear error.
- **No redirect to a redirect source** in the CMS.
- **No open redirects:** only site-relative paths or an explicit allow-listed external host; `?next=` after login validates against an internal-path allow-list.
- **No mass redirects to the homepage.** A removed page redirecting to `/` is treated as a soft 404 and wastes crawl budget; use `410` or a genuinely relevant target.
- Redirects are cached (Redis + in-memory) and revalidated on change; misses fall through to the router.
- `hits` is counted so dead redirects can be reviewed and retired.

### 8.3 404 and 410 handling

- A real `404` status with a helpful page: navigation, search, popular links, contact. No automatic redirect.
- Internal links to 404s are treated as bugs: a weekly crawl reports them, and Search Console 404s are reviewed monthly.
- The 404 page is `noindex`.

---

## 9. Structured data plan

### 9.1 Principles

1. **Truthful only.** JSON-LD describes facts visibly present on the page. If a fact is unknown, the property is omitted — never defaulted or invented.
2. **One graph per page** using `@graph` with stable `@id` references, so entities are not duplicated across the site.
3. **Validated.** Every template is checked against Google's Rich Results Test and the Schema Markup Validator before launch, and re-checked in CI by comparing generated JSON-LD against committed fixtures.
4. **Type chosen after legal confirmation.** `NGO` (a subtype of `Organization` in schema.org) should only be used if the organisation's legal nature supports it. Otherwise `Organization`. **⏳ D-17**
5. **No fake ratings, reviews, opening hours, addresses, tax status or donation totals.** A `review` or `aggregateRating` property without genuine, verifiable reviews is a manual-action risk and a misrepresentation.

### 9.2 Page-type mapping

| Page | Primary type | Supporting types |
|---|---|---|
| All pages | `Organization` (or `NGO`) + `WebSite` | `BreadcrumbList` where breadcrumbs exist |
| Homepage | `WebPage` (`@type: WebPage`, `isPartOf` WebSite) | `Organization`, `WebSite` |
| Static pages | `WebPage` | `BreadcrumbList` |
| News article | `NewsArticle` (or `Article` for evergreen pieces) | `WebPage`, `BreadcrumbList`, `ImageObject`, `Person`/`Organization` (author) |
| Event | `Event` | `Place`, `Offer` (only if ticketed and true), `BreadcrumbList` |
| Campaign | `WebPage` + `DonateAction` (only when online payment is actually enabled) | `BreadcrumbList` |
| Gallery | `ImageGallery` | `ImageObject` per item |
| Contact | `ContactPage` + `Organization` | `Place` (address only when verified) |
| Policies | `WebPage` | — |

### 9.3 Example: site-level graph (rendered on every page)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://<domain>/#organization",
      "name": "Shri Vanshidhar Gaushala",
      "url": "https://<domain>/",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://<domain>/#logo",
        "url": "https://<domain>/brand/logo.png",
        "width": 512,
        "height": 512
      },
      "description": "<verified one-sentence description>",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "<verified>",
        "addressLocality": "<verified>",
        "addressRegion": "<verified>",
        "postalCode": "<verified>",
        "addressCountry": "IN"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "<verified>",
        "contactType": "customer service",
        "availableLanguage": ["en", "hi"]
      },
      "sameAs": ["<verified social profile URLs only>"]
    },
    {
      "@type": "WebSite",
      "@id": "https://<domain>/#website",
      "url": "https://<domain>/",
      "name": "Shri Vanshidhar Gaushala",
      "publisher": { "@id": "https://<domain>/#organization" },
      "inLanguage": "en-IN"
    }
  ]
}
```

**Omission rules:** if the address, phone or social profiles are not verified, those properties are omitted entirely. A partial but true graph is better than a complete but false one.

**Not included:** `potentialAction: SearchAction` (internal search is optional and `noindex`; advertising a search endpoint that may not exist is misleading), `aggregateRating`, `review`, `openingHours` (unless verified), `taxID` (unless legally confirmed), `foundingDate` (unless verified).

### 9.4 Example: news article

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "@id": "https://<domain>/news/<slug>#article",
  "headline": "<article title, ≤ 110 characters>",
  "description": "<excerpt>",
  "image": ["https://cdn.<domain>/<cover>.jpg"],
  "datePublished": "2026-11-05T10:00:00+05:30",
  "dateModified": "2026-11-06T09:15:00+05:30",
  "inLanguage": "en-IN",
  "author": { "@type": "Organization", "name": "Shri Vanshidhar Gaushala" },
  "publisher": { "@id": "https://<domain>/#organization" },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://<domain>/news/<slug>" },
  "isPartOf": { "@id": "https://<domain>/#website" }
}
```

`dateModified` reflects a substantive edit only. The CMS records `updatedDisplayAt` separately from `updatedAt` so a metadata tweak does not falsely claim the article changed.

### 9.5 Example: event

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "@id": "https://<domain>/events/<slug>#event",
  "name": "<event title>",
  "startDate": "2026-12-01T10:00:00+05:30",
  "endDate": "2026-12-01T14:00:00+05:30",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "<venue name>",
    "address": { "@type": "PostalAddress", "streetAddress": "<verified>", "addressLocality": "<verified>", "addressCountry": "IN" }
  },
  "image": ["https://cdn.<domain>/<poster>.jpg"],
  "description": "<description>",
  "organizer": { "@id": "https://<domain>/#organization" },
  "isAccessibleForFree": true
}
```

Rules: cancelled events use `EventCancelled` and remain on the page with a visible "Cancelled" notice; postponed events use `EventPostponed`. `offers` is emitted only when there is a real, purchasable ticket. `isAccessibleForFree` is set only when entry is genuinely free.

### 9.6 Example: breadcrumbs

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://<domain>/" },
    { "@type": "ListItem", "position": 2, "name": "News", "item": "https://<domain>/news" },
    { "@type": "ListItem", "position": 3, "name": "<article title>" }
  ]
}
```

The last item omits `item` (it is the current page). The visible breadcrumb and the JSON-LD are generated from the same data.

### 9.7 Structured-data QA

| Check | Tool | When |
|---|---|---|
| Valid JSON, correct types | CI schema check against committed fixtures | Every build |
| Rich-result eligibility | Google Rich Results Test | Phase 5, 11 |
| Vocabulary validity | Schema Markup Validator | Phase 5, 11 |
| No unsupported claims | Manual review against the page | Phase 10, 11 |
| No duplicate Organization on one page | Generated graph uses `@id` references | Every build |

---

## 10. Image and media SEO

| Aspect | Rule |
|---|---|
| Format | AVIF with WebP and JPEG fallbacks; generated at upload |
| Dimensions | Stored from the actual file; `width`/`height` always rendered to prevent CLS |
| Responsive | `srcset` at 320/640/960/1280/2000 with correct `sizes` |
| Lazy loading | Below-the-fold images use `loading="lazy"`; the LCP image uses `fetchpriority="high"` and is never lazy |
| Filenames | Descriptive, hyphenated, stored separately from the random storage key (`cow-shelter-morning.jpg`) |
| Alt text | Required on every image used in content; describes the image, not keywords; decorative images use `alt=""` |
| Captions | Surfaced visually where they add context; used in image sitemaps |
| Credit | Stored and displayed where required |
| EXIF | Stripped at upload (privacy: GPS, device) |
| Placeholders | Development placeholders are clearly labelled and must never be presented as real Gaushala photography |
| Original photos | Authentic photography only; stock imagery is never represented as the Gaushala's own |

Alt-text guidance for editors (shown in the admin): "Describe what is in the photograph for someone who cannot see it. Do not repeat the page title, and do not list keywords."

---

## 11. Local SEO

| Element | Implementation |
|---|---|
| **NAP consistency** | Name, address and phone come from one `Setting` group and are rendered everywhere from that single source. No page hardcodes an address |
| **Contact page** | Full verified address, phone (`tel:` link), email, visiting hours (only if verified), map embed (only if the location is verified), directions link, public transport notes if supplied |
| **Location in copy** | Location used naturally in About, Contact and the homepage; no keyword stuffing |
| **Google Business Profile** | The organisation claims and maintains its own profile. The site supports it with consistent NAP, a valid website URL, hours and authentic photos. **We do not create or edit the profile on their behalf** |
| **Reviews** | Genuine reviews are requested from real supporters; no purchase, incentive or fabrication. Review content is never scraped onto the site as a testimonial without written consent |
| **Local citations** | Optional: consistent listings on relevant directories, using the same NAP |
| **Local landing pages** | **Not created.** The organisation operates from one location; generating city pages would violate the blueprint's no-fake-pages rule |
| **Schema** | `Organization` with verified `address`; `Place` on Contact; no invented `geo` coordinates |

---

## 12. Content strategy

### 12.1 Topic clusters

```text
About / Mission ─┬─ Our Gaushala (daily care)
                 ├─ Our Work (activities)
                 │    └─ Activity detail pages
                 ├─ Impact (verified outcomes)
                 └─ Transparency (reports, policies)

Campaigns ───────┬─ Campaign detail
                 └─ Campaign updates

Events ──────────┬─ Event detail
                 └─ Post-event write-ups (news)

News ────────────┬─ Articles
                 ├─ Educational explainers (only where the organisation has expertise)
                 └─ Category archives
```

Every cluster has a hub page that links to its children, and every child links back to its hub. Cross-links are added only where genuinely useful.

### 12.2 Article standards

| Requirement | Rule |
|---|---|
| Original value | Each article must contain information the organisation actually possesses: a real event, a real animal's story (with consent for identifiable people), a real operational explanation |
| Minimum depth | 400+ words of substantive content for an article to be indexable; shorter updates belong in a campaign update or a social post |
| Structure | Descriptive `<h2>`/`<h3>`, short paragraphs, lists where appropriate |
| Attribution | Author (person) or organisation, with a link to About |
| Dates | Visible publication date; "Updated" shown only on a substantive edit |
| Images | At least one authentic image with meaningful alt text |
| Internal links | 2–5 contextual links to related pages |
| Sources | Impact claims link to the methodology or the report |
| No AI mass-production | No generated city pages, no keyword-stuffed paragraphs, no synonym-spun duplicates |

### 12.3 What not to publish

- Any statistic without a reporting period and methodology.
- Any registration or tax-exemption claim without documentary evidence.
- Testimonials without recorded consent.
- Opening hours or visiting rules that are not confirmed.
- Service claims (e.g. "24-hour ambulance", "free veterinary care") that the organisation does not provide.
- Stock photography presented as the Gaushala.
- Expired campaign pages that imply donations are still needed (they become `COMPLETED` with a clear closed notice).

---

## 13. Internal linking and information architecture

| Rule | Detail |
|---|---|
| Crawl depth | Every indexable page reachable within 3 clicks of the homepage |
| Navigation | Header and footer menus are CMS-managed; changed links must not orphan pages |
| Breadcrumbs | On every detail page; visible and matched by JSON-LD |
| Contextual links | Descriptive anchor text ("read about our winter fodder campaign"), never "click here" |
| Orphan detection | A crawl in Phase 11 and monthly thereafter flags pages with no internal links |
| Related content | News related by category/tag; campaigns link to their updates; events link to related news after the event |
| Pagination links | Crawlable `<a href>` links, not JavaScript-only handlers |
| Donation CTAs | Header, hero, after work/impact, featured campaign, pre-footer, footer — all link to `/donate` with optional campaign preselection |
| Link validation | CI link checker on built HTML; broken internal links fail the build |

---

## 14. Core Web Vitals and technical performance

### 14.1 Targets (mobile, p75, field data preferred)

| Metric | Target |
|---|---|
| LCP | < 2.5 s |
| INP | < 200 ms |
| CLS | < 0.1 |
| TTFB | < 800 ms (edge-cached) |
| Total blocking time (lab) | < 300 ms |
| Initial JS on content pages | ≤ 200 KB gzipped |

### 14.2 Techniques

| Area | Approach |
|---|---|
| Images | AVIF/WebP, responsive `srcset`, correct `sizes`, explicit dimensions, `fetchpriority` on the LCP image, lazy below the fold |
| Fonts | Self-hosted, subset, `font-display: swap`, preload the variable file only, no third-party font CSS |
| JavaScript | Server components by default; client islands only where needed; route-level code splitting; no large UI framework bundle where a small component suffices |
| CSS | Utility CSS, purged; critical CSS inlined by the framework; no runtime CSS-in-JS |
| Third-party | Analytics deferred until consent; no chat widgets, no marketing pixels unless approved; any addition is measured for its CWV cost |
| Caching | CDN edge cache for public HTML; immutable hashed assets with long `max-age` |
| Compression | Brotli at the edge |
| Prefetch | Hover/tap prefetch of likely next pages, respecting `Save-Data` and `prefers-reduced-motion` |

### 14.3 Monitoring

- Lighthouse CI on `/`, `/campaigns`, `/news/[slug]`, `/donate` at mobile and desktop presets, thresholds enforced.
- CrUX/field data reviewed monthly after launch.
- A regression in LCP or CLS is treated as a release blocker for the next deploy.

---

## 15. Accessibility and SEO

Accessibility and SEO share the same foundations; the site treats them as one concern.

| Overlap | Implementation |
|---|---|
| Semantic HTML | Same markup serves screen readers and crawlers |
| Descriptive headings | Aid both comprehension and indexing |
| Alt text | Image accessibility and image search |
| Descriptive link text | Screen-reader clarity and anchor relevance |
| Keyboard navigation | Required for WCAG 2.2 AA; also ensures interactive content is reachable |
| Visible focus | Required; also improves task completion |
| Colour contrast | 4.5:1 text, 3:1 UI — see the palette audit in `ARCHITECTURE.md` §14.2 |
| Motion | `prefers-reduced-motion` respected; carousels must not auto-advance aggressively |
| Video | Captions where speech exists; transcripts improve indexability |
| Forms | Labelled fields, error summaries, `aria-describedby`; also improves conversion |
| Language | `<html lang="en-IN">` set; Devanagari support configured for a future Hindi launch |

---

## 16. Measurement and analytics

### 16.1 Search Console

| Task | Detail |
|---|---|
| Verification | Domain property verified by DNS TXT (survives host changes) |
| Sitemaps | All child sitemaps submitted; status reviewed weekly |
| Coverage | Weekly review of "Not indexed" reasons; distinguish "Crawled – currently not indexed" (content quality) from "Excluded by noindex" (intentional) |
| Core Web Vitals | Monthly review of the mobile report |
| Rich results | Review after each structured-data change |
| Breadcrumbs | Confirm breadcrumb enhancement is detected |
| Users | Add the organisation's SEO owner as a user; we do not hold exclusive access |

### 16.2 Analytics

| Option | Notes |
|---|---|
| **GA4** | Familiar, free, powerful; requires consent; heavier script |
| **Privacy-first (Plausible / Umami / Fathom)** | Lighter, cookie-free, simpler consent story; recommended default **⏳ D-18** |
| Search Console | Always required regardless of analytics choice |

### 16.3 Event taxonomy

| Event | Trigger | Parameters (no PII) |
|---|---|---|
| `donate_cta_click` | Any Donate CTA | `location` (header, hero, footer…), `campaign_slug` |
| `donation_form_start` | First interaction with the donation form | `campaign_slug`, `preset` |
| `donation_purpose_select` | Purpose chosen | `purpose_code` |
| `payment_initiated` | Server creates an intent | `amount_band` (bucketed, never the exact amount with an identifier), `campaign_slug` |
| `donation_verified` | **Server-side** event on verified success | `amount_band`, `campaign_slug`, `status` |
| `payment_failed` | Server-side on failure/cancel | `reason_category` |
| `enquiry_submitted` | Contact/volunteer form success | `type` |
| `event_view` | Event detail viewed | `event_slug` |
| `campaign_view` | Campaign detail viewed | `campaign_slug` |
| `gallery_view` | Gallery viewed | `category` |
| `outbound_click` | External link | `domain`, `link_text` |
| `search_performed` | Internal search | `query_length`, `result_count` (never the raw query if it may contain personal data) |

**Rules:** no email, name, phone, PAN, donation reference or any identifier that could single out a person. `donation_verified` is authoritative only from the server; browser events are never the financial source of truth (the dashboard reads the database).

### 16.4 Consent

- Non-essential analytics load only after consent (see `SECURITY_PLAN.md` §8.3).
- The consent banner is accessible, keyboard-operable, and offers "reject" as prominently as "accept".
- Analytics data is retained per the provider's settings and reviewed annually.

---

## 17. Governance and anti-spam rules

These rules exist because the blueprint forbids thin, fabricated or keyword-stuffed content.

| Rule | Enforcement |
|---|---|
| No page exists without genuine content | Pre-publish validation warns when a page has fewer than N characters of substantive content and no sections; indexability is reviewed at Phase 10 |
| No fake location pages | No "gaushala in <city>" pages; there is one location |
| No fabricated statistics | `impact_stats` cannot be published without verification, methodology and period |
| No fabricated testimonials | Approval requires recorded consent evidence |
| No scraped or spun content | Editorial review; no bulk-import tooling for articles |
| Dates are honest | `publishedAt` is set once; `updatedDisplayAt` changes only on substantive edits |
| Slug changes create redirects | Automatic, enforced in the publish transaction |
| Unpublish is a real removal | 404 (or 410 when retired), removed from the sitemap on the next revalidation |
| Campaign integrity | Completed campaigns clearly state they are closed; goals and progress are never inflated |
| Third-party content | Quoted material is attributed and linked; no content copied without permission |

---

## 18. QA checklists

### 18.1 Per-page launch checklist

- [ ] Unique `<title>` (50–60 chars) and meta description (120–155 chars)
- [ ] Exactly one `<h1>` matching the page purpose
- [ ] Logical heading hierarchy
- [ ] Canonical URL correct and absolute
- [ ] Open Graph and Twitter metadata present
- [ ] Correct `robots` directive (`index` / `noindex` as intended)
- [ ] Included in (or deliberately excluded from) the sitemap
- [ ] Breadcrumbs visible and in JSON-LD
- [ ] Structured data valid and truthful
- [ ] At least one relevant internal link in and out
- [ ] Images have alt text and dimensions
- [ ] LCP element identified and prioritised
- [ ] Mobile layout reviewed at 360 px
- [ ] Keyboard navigation complete
- [ ] No placeholder text or development content
- [ ] No fabricated claim

### 18.2 Site-level launch checklist

- [ ] `robots.txt` correct; no asset blocking
- [ ] `sitemap.xml` valid; index + children; only canonical URLs
- [ ] No `noindex` page in the sitemap; no indexable page missing from it
- [ ] 404 and 410 behave correctly
- [ ] Redirects: no loops, chains, or open redirects
- [ ] `www`/apex, HTTP/HTTPS, case and trailing-slash normalisation
- [ ] Search Console verified; sitemaps submitted
- [ ] Structured data validated across all templates
- [ ] Core Web Vitals "Good" in lab; field data being collected
- [ ] Analytics consent-gated and verified
- [ ] GDPR/DPDP-aligned privacy notice published
- [ ] Social preview cards render correctly (test with a debugger tool)
- [ ] No staging `noindex` leaking into production and vice versa

### 18.3 Regression checks after every content-type change

- [ ] Metadata template still produces a unique title/description
- [ ] Structured data still validates
- [ ] Sitemap includes new published records
- [ ] Drafts remain excluded
- [ ] Canonical unchanged

---

## 19. Ongoing monitoring

| Cadence | Task |
|---|---|
| Weekly | Search Console coverage and sitemap status; 404 report review; uptime and error rates |
| Monthly | Core Web Vitals field data; organic landing pages; query performance; broken-link crawl; structured-data errors; orphan-page crawl |
| Quarterly | Content audit (outdated campaigns, stale events, thin pages); redirect cleanup; accessibility re-check; analytics review |
| Annually | SEO plan review; keyword/position baseline refresh; content strategy reassessment |
| On every content publish | Automated metadata, canonical, sitemap and structured-data checks in the publish pipeline |

**Ownership:** an SEO owner inside the organisation must be named at Phase 12. Without an owner, this section is aspirational.

---

## 20. Phase mapping and open questions

### 20.1 SEO work by phase

| Phase | SEO deliverables |
|---|---|
| 1 | This plan; metadata model; indexability decisions |
| 3 | Typography, contrast, semantic component primitives, OG image template |
| 4 | Homepage metadata, JSON-LD site graph, LCP image strategy |
| 5 | Every public route's metadata and structured data; breadcrumbs; canonical handling; 404 page |
| 6 | CMS SEO fields with validation and length guidance; sitemap feed; redirect enforcement |
| 8 | SEO admin screens; redirect manager; preview showing the rendered metadata |
| 10 | Real content, titles, descriptions, alt text, internal links, verified facts |
| 11 | Full technical SEO audit; structured-data validation; CWV; crawl; accessibility |
| 12 | DNS verification, Search Console, sitemaps submission, analytics, baseline |

### 20.2 Open questions

| # | Question | Recommendation |
|---|---|---|
| **SEO-1** | Analytics platform: GA4 or privacy-first? (**D-18**) | Privacy-first (Plausible/Umami) for simplicity and consent; GA4 only if the organisation needs its reporting ecosystem |
| **SEO-2** | Is the organisation's legal entity an NGO/trust/society? (**D-17**) | Confirm from registration documents before emitting `NGO`; default to `Organization` |
| **SEO-3** | Domain name and canonical host | Choose before Phase 5; every canonical depends on it |
| **SEO-4** | Will there be authentic photography at launch? | If not, launch without a gallery and without image-heavy sections rather than using stock imagery |
| **SEO-5** | Should past events remain indexed? | **Yes** — they carry lasting local relevance and show activity; retain with a clear "past event" state |
| **SEO-6** | Is internal site search required? | Optional; if omitted, do not emit `SearchAction` and do not build `/search` |
| **SEO-7** | Hindi content timeline? | Deferred (ADR-013); a later launch needs `hreflang` and route restructuring, planned then |
| **SEO-8** | Google Business Profile ownership | The organisation owns and maintains it; the site provides consistent NAP |
