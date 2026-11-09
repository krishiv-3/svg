# API Design — Shri Vanshidhar Gaushala

**Document status:** Phase 1 deliverable
**Version:** 1.0 (proposal)
**Base URL (production):** `https://api.<domain>/api/v1`
**Base URL (local):** `http://localhost:4000/api/v1`
**Related:** `ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `SECURITY_PLAN.md`

---

## Table of contents

1. [Design principles](#1-design-principles)
2. [URL and versioning conventions](#2-url-and-versioning-conventions)
3. [Request format](#3-request-format)
4. [Response format](#4-response-format)
5. [Error model](#5-error-model)
6. [Authentication and session lifecycle](#6-authentication-and-session-lifecycle)
7. [Authorisation](#7-authorisation)
8. [Pagination, sorting and filtering](#8-pagination-sorting-and-filtering)
9. [Caching and conditional requests](#9-caching-and-conditional-requests)
10. [Idempotency](#10-idempotency)
11. [Concurrency control](#11-concurrency-control)
12. [Rate limiting](#12-rate-limiting)
13. [Public API catalogue](#13-public-api-catalogue)
14. [Admin API catalogue](#14-admin-api-catalogue)
15. [Standard content resource contract](#15-standard-content-resource-contract)
16. [Auth API catalogue](#16-auth-api-catalogue)
17. [Media API catalogue](#17-media-api-catalogue)
18. [Donation and payment API catalogue](#18-donation-and-payment-api-catalogue)
19. [Webhook contract](#19-webhook-contract)
20. [Internal endpoints](#20-internal-endpoints)
21. [OpenAPI and documentation](#21-openapi-and-documentation)
22. [Endpoint-to-permission matrix](#22-endpoint-to-permission-matrix)
23. [Change management](#23-change-management)
24. [Open questions](#24-open-questions)

---

## 1. Design principles

1. **Resource-oriented REST** with predictable plural nouns and no RPC verbs in paths (state changes are sub-resources: `/publish`, not `?action=publish`).
2. **The API is the only path to data.** The web app never touches the database. Every public page's content is available through a documented endpoint.
3. **Explicit authorisation.** Every route declares either `public` or a permission key. There is no implicit-protected default at runtime: a route without a declaration fails the startup route audit.
4. **Contracts first.** Zod schemas in `packages/shared/src/contracts` are the single source for runtime validation, TypeScript types and the generated OpenAPI document.
5. **Never trust the client** for money, status, timestamps, IDs, ordering, slugs or permissions.
6. **Draft content is invisible to public endpoints.** Public endpoints filter on `status = 'PUBLISHED'` **and** `published_at <= now()` **and** `deleted_at IS NULL` **and** `noindex` where relevant — enforced in the repository layer, not the controller.
7. **Predictable shapes.** Same envelope, same pagination, same error format, same date format everywhere.
8. **Fast failure.** Validation errors return before any database work; authorisation errors reveal nothing about existence.
9. **No secrets or PII in responses, logs or error details.**

---

## 2. URL and versioning conventions

| Rule | Example |
|---|---|
| Version in the path | `/api/v1/...` |
| Groups | `/api/v1/public/*`, `/api/v1/admin/*`, `/api/v1/auth/*`, `/api/v1/webhooks/*` |
| Plural resource nouns | `/admin/pages`, `/admin/campaigns`, `/admin/donations` |
| Lowercase, hyphenated path segments | `/admin/audit-log`, `/public/our-work` (never camelCase) |
| Identifiers are opaque | `/admin/pages/{id}` where `id` is a UUIDv7 |
| Public content addressed by slug | `/public/news/{slug}` |
| Sub-resources for state transitions | `POST /admin/pages/{id}/publish` |
| No trailing slash | `/admin/pages` (301 to the canonical form if one is supplied) |
| Query parameters for filtering/sorting/pagination | `?status=PUBLISHED&sort=-publishedAt&limit=20` |

### 2.1 Versioning policy

- `v1` is stable. Breaking changes require `v2`.
- **Non-breaking** (allowed in `v1`): adding an optional request field, adding a response field, adding an endpoint, adding an enum value that clients are documented to tolerate, relaxing a validation rule.
- **Breaking** (requires `v2`): removing/renaming a field, changing a type, making an optional field required, tightening validation, changing default sort, changing an error code.
- Deprecations are announced with `Deprecation` and `Sunset` response headers and appear in `CHANGELOG.md` at least one release before removal.

---

## 3. Request format

| Aspect | Rule |
|---|---|
| Content type | `application/json; charset=utf-8` for all bodies except the webhook route (raw bytes) |
| Body size limit | 256 KB for JSON. Uploads never pass through the API (presigned URLs) |
| Field naming | `camelCase` |
| Dates/times | ISO 8601 with offset, always UTC in transport: `2026-11-05T13:45:00.000Z` |
| Calendar dates | `YYYY-MM-DD` |
| Durations | Integer milliseconds |
| Money | `{ "amountMinor": 10100, "currency": "INR" }` — integer minor units, never floats, never pre-formatted strings |
| IDs | UUIDv7 strings |
| Booleans | Real JSON booleans, never `"true"` |
| Nullability | `null` means "explicitly empty"; omitting a field in `PATCH` means "unchanged" |
| Text | Trimmed, NFC-normalised, HTML **never** accepted in rich-text fields (editor JSON only) |
| Enum values | `SCREAMING_SNAKE_CASE` |
| Locale/timezone | `Asia/Kolkata` is the default display timezone; every event carries its own `timezone` |

### 3.1 Required headers

| Header | Required on | Purpose |
|---|---|---|
| `Content-Type` | Bodies | `application/json` |
| `Cookie: __Host-svg_session` | Authenticated requests | Session |
| `X-CSRF-Token` | All state-changing browser requests | CSRF double-submit |
| `Idempotency-Key` | `POST /public/donations`, refund endpoints | Safe retries |
| `If-Match` | Admin `PATCH`/`PUT` on versioned resources | Optimistic concurrency |
| `X-Request-Id` | Optional | Client-supplied correlation ID; generated if absent |
| `Accept-Language` | Optional | Accepted, currently ignored (single locale) |

### 3.2 Response headers

| Header | When |
|---|---|
| `X-Request-Id` | Always |
| `ETag` | Cacheable `GET`s |
| `Cache-Control` | Always (explicit) |
| `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` | Rate-limited routes |
| `Retry-After` | `429` and `503` |
| `Deprecation`, `Sunset`, `Link: <...>; rel="successor-version"` | Deprecated endpoints |
| `X-Robots-Tag: noindex` | Any response from an admin route |

Security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`) are set on every API response; the CSP is restrictive because the API returns only JSON.

---

## 4. Response format

### 4.1 Single resource

```json
{
  "data": {
    "id": "01930f7a-...",
    "title": "About the Gaushala",
    "slug": "about",
    "status": "PUBLISHED"
  }
}
```

### 4.2 Collection

```json
{
  "data": [ { "...": "..." } ],
  "meta": {
    "pagination": {
      "limit": 20,
      "total": 47,
      "page": 1,
      "pageCount": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 4.3 Mutation

```json
{
  "data": { "...": "..." },
  "meta": { "message": "Published", "auditId": "01930f7b-..." }
}
```

### 4.4 Rules

- `data` is always present on success (object, array or `null`).
- `meta` is optional and only carries pagination, counts, audit references or advisory messages.
- No field is ever named `success`, `error` or `code` at the top level — HTTP status and `Content-Type` carry that meaning.
- Timestamps are serialised in UTC ISO 8601. The API does not localise.
- Money is always `{ amountMinor, currency }`.
- An entity's `id` is a string; clients must not parse it.
- The API never returns a stack trace, SQL fragment, internal path or ORM error message.

---

## 5. Error model

**RFC 9457 Problem Details** with `Content-Type: application/problem+json`.

### 5.1 Shape

```json
{
  "type": "https://api.<domain>/problems/validation-failed",
  "title": "Request validation failed",
  "status": 422,
  "detail": "Two fields need attention.",
  "instance": "/api/v1/admin/pages",
  "code": "VALIDATION_FAILED",
  "requestId": "01JB2Z9K3M4N",
  "errors": [
    { "path": "slug", "code": "INVALID_FORMAT", "message": "Use lowercase letters, numbers and hyphens only." },
    { "path": "seoDescription", "code": "TOO_LONG", "message": "Keep the meta description to 180 characters or fewer (currently 212)." }
  ]
}
```

`errors[]` is present only for validation failures. Each entry has `path` (dot/bracket notation into the request body), a stable machine `code`, and a human `message` written for a non-technical editor.

### 5.2 Status codes used

| Status | Meaning in this API |
|---|---|
| `200` | OK |
| `201` | Created (with `Location` header) |
| `202` | Accepted — queued work (reindex, export preparation, bulk email) |
| `204` | No content (successful delete/logout) |
| `301`/`308` | Canonical path redirect |
| `304` | Not modified (conditional GET) |
| `400` | Malformed request (unparseable JSON, missing required header) |
| `401` | Not authenticated, or session expired |
| `403` | Authenticated but not permitted (also used for CSRF failure) |
| `404` | Not found, or exists but not visible to this caller |
| `409` | Conflict — duplicate slug, stale version, unsafe state transition, duplicate idempotency key with different body |
| `410` | Gone — content permanently removed and deliberately unlisted |
| `413` | Payload too large |
| `415` | Unsupported media type |
| `422` | Semantic validation failure |
| `423` | Locked (account locked) |
| `428` | Precondition required (missing `If-Match` on a versioned update) |
| `429` | Rate limited |
| `500` | Unexpected server error (never detailed) |
| `503` | Dependency unavailable or maintenance mode |

### 5.3 Error code catalogue

Stable machine-readable codes; the frontend maps them to localised copy.

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 422 | One or more fields invalid |
| `MALFORMED_REQUEST` | 400 | Body/query could not be parsed |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Wrong `Content-Type` |
| `PAYLOAD_TOO_LARGE` | 413 | Body over the limit |
| `UNAUTHENTICATED` | 401 | No session |
| `SESSION_EXPIRED` | 401 | Session expired or revoked |
| `MFA_REQUIRED` | 401 | Session valid but MFA challenge incomplete |
| `FORBIDDEN` | 403 | Missing permission |
| `CSRF_TOKEN_INVALID` | 403 | Missing/mismatched CSRF token |
| `ORIGIN_NOT_ALLOWED` | 403 | `Origin` not on the allow-list |
| `NOT_FOUND` | 404 | Resource absent or not visible |
| `SLUG_TAKEN` | 409 | Slug already exists (including as a redirect source) |
| `VERSION_CONFLICT` | 409 | Optimistic concurrency failure |
| `INVALID_STATE_TRANSITION` | 409 | e.g. publishing an archived record |
| `MEDIA_IN_USE` | 409 | Delete blocked; response lists usages |
| `IDEMPOTENCY_KEY_REUSED` | 409 | Same key, different body |
| `DUPLICATE_RESOURCE` | 409 | Unique constraint violated |
| `ACCOUNT_LOCKED` | 423 | Too many failed attempts |
| `RATE_LIMITED` | 429 | Quota exceeded |
| `PRECONDITION_REQUIRED` | 428 | Missing `If-Match` |
| `PAYMENT_PROVIDER_DISABLED` | 503 | Donations online are disabled |
| `PAYMENT_PROVIDER_UNAVAILABLE` | 503 | Provider/network failure |
| `DONATION_NOT_PAYABLE` | 409 | Donation not in a payable state |
| `RECEIPT_NOT_ISSUABLE` | 409 | Donation not verified/paid |
| `DEPENDENCY_UNAVAILABLE` | 503 | Database/Redis/storage issue |
| `MAINTENANCE_MODE` | 503 | Site-wide maintenance |
| `INTERNAL_ERROR` | 500 | Unhandled |

### 5.4 Information-disclosure rules

- `403` never reveals whether the target exists.
- `404` is returned for resources the caller may not see (draft content requested by a non-editor) — avoiding existence oracles.
- Validation messages never echo full submitted values for sensitive fields (passwords, PAN, tokens).
- Login failures return a single generic message regardless of whether the email exists.
- Database constraint violations are mapped to domain codes; the raw constraint name never reaches the client.

---

## 6. Authentication and session lifecycle

### 6.1 Cookie

| Attribute | Value |
|---|---|
| Name | `__Host-svg_session` (production), `svg_session` (local HTTP) |
| Flags | `HttpOnly`, `Secure` (prod/staging), `SameSite=Lax`, `Path=/` |
| Contents | Opaque 256-bit random token (base64url). No claims, no PII |
| Server storage | SHA-256 hash in `sessions.token_hash` |
| Idle timeout | 8 hours (configurable) |
| Absolute timeout | 7 days (configurable) |
| Rotation | New token issued on privilege change (login, MFA completion, password change); old session revoked |

### 6.2 CSRF

- On session creation the API issues a `__Host-svg_csrf` cookie (readable by the admin app, not `HttpOnly`) containing a random token, and stores its hash on the session.
- Every state-changing request must send `X-CSRF-Token` matching the cookie and the stored hash.
- The `Origin`/`Referer` must match the allow-list (`SITE_URL`, `WEB_URL`) for browser-originated requests.
- Public forms fetch a short-lived anonymous CSRF token from `GET /api/v1/auth/csrf`.
- Webhook routes are exempt (no cookie, provider signature instead).

### 6.3 Login flow

```text
POST /auth/login { email, password }
  ├─ account locked ──────────────────────────▶ 423 ACCOUNT_LOCKED
  ├─ invalid credentials ─────────────────────▶ 401 (generic message, counter++)
  ├─ mfa enabled ─────────────────────────────▶ 200 { data: { mfaRequired: true, challengeToken } }
  └─ success ────────────────────────────────▶ Set-Cookie session + csrf, 200 { data: user, permissions }
```

Progressive lockout: 5 failures → 5-minute lock; 10 → 30 minutes; 20 → 24 hours. Counters live in Redis with a PostgreSQL record for forensics. Successful login resets the counter.

### 6.4 Session inventory

`GET /admin/profile/sessions` lists active sessions (device, approximate location from IP, last used). `DELETE /admin/profile/sessions/{id}` revokes one. `POST /admin/users/{id}/sessions/revoke` (permission `user.revoke_sessions`) revokes all sessions for a user — used on suspension or suspected compromise.

### 6.5 Password reset

`POST /auth/password/forgot` always returns `202` with the same body whether or not the email exists (no account enumeration). The token is single-use, expires in 30 minutes, and invalidating it also revokes all sessions on use.

---

## 7. Authorisation

| Layer | Mechanism |
|---|---|
| Route declaration | `{ auth: 'required', permission: 'donation.refund' }` |
| Middleware | Resolves effective permissions (role union + grant/deny overrides), compares to the required key |
| Resource policy | Additional rules, e.g. refund only on a `SUCCEEDED` donation; receipt issue only for a verified payment |
| Field-level | Some response fields are omitted for callers lacking a permission (e.g. donor contact details for `Volunteer Manager`) |

Rules:

- `Super Admin` (`is_super_admin`) bypasses permission resolution but is still subject to resource policies and is fully audited.
- A permission check that throws (e.g. database error) **denies** the request. Fail closed.
- The `403` body is the standard problem document with `code: FORBIDDEN`; it does not name the missing permission to the client (that detail goes to the audit log and server logs).

---

## 8. Pagination, sorting and filtering

Two schemes, chosen by table size and UI need.

### 8.1 Offset pagination — admin tables

```
GET /admin/donations?page=2&limit=25&sort=-createdAt&status=SUCCEEDED
```

- `page` ≥ 1, `limit` 1–100 (default 25).
- `meta.pagination` includes `total` and `pageCount` — required by admin tables showing "Page 2 of 7".
- `total` is computed with a `COUNT(*)` over the same predicate. For very large sets (`audit_log`, `payment_events`), `total` is capped and `meta.pagination.totalIsApproximate` is set to `true`.

### 8.2 Keyset pagination — large and public collections

```
GET /public/news?limit=12&cursor=eyJjIjoiMjAyNi0xMS0wNVQxMDowMDowMFoiLCJpIjoiMDE5MzBmN2EtIn0
```

- `meta.pagination.nextCursor` is opaque base64url JSON `{ createdAt, id }`.
- No `total`; clients use a "Load more" pattern.
- Used by: `audit_log`, `payment_events`, `login_attempts`, and all public list endpoints.

### 8.3 Sorting

- `sort` accepts a comma-separated list; `-` prefix means descending: `sort=-publishedAt,title`.
- Allowed sort fields are declared per endpoint; an unlisted field returns `422` (`VALIDATION_FAILED`).
- A stable tiebreaker (`id`) is always appended so pagination cannot produce duplicates.

### 8.4 Filtering

| Pattern | Example |
|---|---|
| Exact | `status=PUBLISHED` |
| Multiple values (OR) | `status=DRAFT,SCHEDULED` |
| Date range | `createdFrom=2026-04-01&createdTo=2026-06-30` |
| Text search | `q=rescue` (searches the endpoint's declared searchable fields) |
| Boolean | `isFeatured=true` |
| Relation | `campaignId=<uuid>`, `categoryId=<uuid>` |

Unknown query parameters are rejected with `422` rather than silently ignored, so a typo cannot quietly return unfiltered data.

---

## 9. Caching and conditional requests

| Endpoint class | `Cache-Control` | Strategy |
|---|---|---|
| `GET /public/*` (content) | `public, max-age=0, s-maxage=300, stale-while-revalidate=86400` | CDN/edge cache + tag revalidation |
| `GET /public/site` (settings/nav) | `public, s-maxage=600, stale-while-revalidate=86400` | Rarely changes |
| `GET /public/sitemap` | `public, s-maxage=3600` | Regenerated on publish |
| `GET /public/gallery`, `/public/impact` | `public, s-maxage=1800` | Slow-changing |
| `GET /public/donation-config` | `public, s-maxage=60` | Config may change |
| `GET /public/donations/{ref}/status` | `no-store` | Personal and time-sensitive |
| `GET /admin/*` | `private, no-store` | Never cached |
| `POST/PATCH/DELETE` | `no-store` | — |

- `ETag` (strong) is emitted for cacheable `GET`s and `If-None-Match` returns `304`.
- `on-request` revalidation: the API calls `POST /api/revalidate` on the web app after a publish (see `ARCHITECTURE.md` ADR-010).
- Cache keys never include personalised data on public routes. Donation status responses are excluded from CDN caching entirely, so a shared cache can never leak one donor's status to another.

---

## 10. Idempotency

| Endpoint | Requirement |
|---|---|
| `POST /public/donations` | `Idempotency-Key` **required** (UUIDv4 client-generated per checkout attempt) |
| `POST /admin/donations/{id}/refund` | Required |
| `POST /admin/donations/{id}/receipt` | Required |
| `POST /public/enquiries` | Optional; if supplied, deduplicated for 10 minutes |
| All other mutations | Optional; honoured when supplied |

Behaviour:

- Key scope is `(route, actor, key)`. First request stores the response. Replays with an identical body hash return the stored response with `Idempotent-Replay: true`.
- Same key with a different body hash → `409 IDEMPOTENCY_KEY_REUSED`.
- Keys expire after 24 hours.
- A request in flight with the same key returns `409` with `Retry-After: 1` (documented) rather than racing.

---

## 11. Concurrency control

- Versioned resources require `If-Match: "<version>"` (or a `version` in the body for backward-compatible clients). Missing → `428 PRECONDITION_REQUIRED`; stale → `409 VERSION_CONFLICT` with `meta.currentVersion`.
- Publish/unpublish/schedule actions also carry the version.
- Publishing a scheduled record that was edited after scheduling requires a re-confirmation flag; the API refuses with `INVALID_STATE_TRANSITION` when the draft diverged, preventing an unreviewed edit from going live at a timer's discretion.

---

## 12. Rate limiting

| Class | Endpoints | Limit (per IP unless noted) |
|---|---|---|
| `auth.login` | `POST /auth/login` | 10 / 15 min per IP + 5 / 15 min per email |
| `auth.reset` | `POST /auth/password/forgot`, `/reset` | 5 / 15 min per IP + 3 / hour per email |
| `auth.mfa` | `POST /auth/mfa/verify` | 10 / 15 min per session |
| `public.read` | `GET /public/*` | 300 / min |
| `public.search` | `GET /public/search` | 30 / min |
| `public.form` | `POST /public/enquiries` | 5 / 10 min per IP; honeypot + timing + optional CAPTCHA escalation |
| `public.donate` | `POST /public/donations` | 10 / 10 min per IP |
| `public.status` | `GET /public/donations/{ref}/status` | 30 / 10 min per IP |
| `admin.read` | `GET /admin/*` (per user) | 600 / min |
| `admin.write` | Mutations (per user) | 120 / min |
| `admin.export` | Export endpoints | 5 / hour per user |
| `admin.upload` | Presign endpoints | 60 / hour per user |
| `webhook` | `POST /webhooks/*` | 600 / min per provider, with signature validation first |

- Counters live in Redis; `429` includes `Retry-After` and `X-RateLimit-*`.
- Rate-limit keys never contain raw email or IP — they are hashed with a per-environment salt.
- Repeated `429`s from one IP on auth routes feed the WAF/blocklist review.
- Limits are configuration, so staging can be relaxed for testing.

---

## 13. Public API catalogue

All public endpoints are unauthenticated, cached, and **return only published content**.

### 13.1 Site bootstrap

| Method | Path | Returns |
|---|---|---|
| `GET` | `/public/site` | Site name, logo, contact details, social links, navigation menus, footer, announcement, maintenance state, currency, donation presets (non-sensitive) |
| `GET` | `/public/homepage` | Resolved homepage: ordered visible sections with hydrated data (featured campaign, selected activities, latest news/events, gallery selection, impact stats) |
| `GET` | `/public/donation-config` | Presets, enabled purposes, minimum/maximum amounts, whether online payment is enabled, consent copy version |

`GET /public/homepage` hydration rules: the API performs the joins so the web app makes **one** request for the homepage. Sections referencing unpublished or deleted entities are omitted rather than rendered empty.

### 13.2 Content

| Method | Path | Notes |
|---|---|---|
| `GET` | `/public/pages/{slug}` | Static pages, policies, `about`, `gaushala`, `volunteer`, `transparency` |
| `GET` | `/public/activities` | `?category=&featured=&limit=&cursor=` |
| `GET` | `/public/activities/{slug}` | |
| `GET` | `/public/impact` | Only `verificationStatus = VERIFIED` and `isVisible` |
| `GET` | `/public/testimonials` | Only approved with consent evidence |
| `GET` | `/public/news` | `?category=&tag=&year=&limit=&cursor=` |
| `GET` | `/public/news/{slug}` | Includes author attribution, dates, related posts |
| `GET` | `/public/news/categories` | |
| `GET` | `/public/events` | `?when=upcoming\|past&status=&limit=&cursor=` |
| `GET` | `/public/events/{slug}` | |
| `GET` | `/public/campaigns` | `?state=active\|upcoming\|completed&featured=` |
| `GET` | `/public/campaigns/{slug}` | Includes computed progress, updates, use of funds, FAQs |
| `GET` | `/public/gallery` | `?category=&kind=image\|video&limit=&cursor=` |
| `GET` | `/public/menus/{key}` | `HEADER`, `FOOTER_PRIMARY`, `FOOTER_LEGAL`, `FOOTER_SOCIAL` |
| `GET` | `/public/redirects` | Full active redirect map, cached; used by edge middleware |
| `GET` | `/public/sitemap` | Structured entries per content type (the web app renders XML) |
| `GET` | `/public/search` | `?q=&type=&limit=` — internal search, `noindex` |

### 13.3 Forms

| Method | Path | Notes |
|---|---|---|
| `POST` | `/public/enquiries` | Types: `CONTACT`, `VOLUNTEER`, `VISIT`, `EVENT_REGISTRATION`, `DONATION_SUPPORT`, `GENERAL` |
| `GET` | `/public/enquiries/config` | Field labels, required flags, enquiry categories, privacy notice version |

`POST /public/enquiries` body:

```json
{
  "type": "VOLUNTEER",
  "name": "…",
  "email": "…",
  "phone": "…",
  "subject": "…",
  "message": "…",
  "eventId": null,
  "consent": { "given": true, "noticeVersion": "2026-11-01" },
  "sourcePath": "/volunteer",
  "honeypot": "",
  "formStartedAt": "2026-11-05T13:40:00.000Z"
}
```

Safeguards: honeypot field must be empty, `formStartedAt` must be ≥ 3 s in the past, per-IP rate limit, message length bounds, URL-count heuristic, and an escalation to CAPTCHA only after repeated failures (never on the first attempt — accessibility).

### 13.4 Donations (public side)

| Method | Path | Notes |
|---|---|---|
| `POST` | `/public/donations` | Creates a `PENDING` donation + payment attempt; returns a redirect URL. **`Idempotency-Key` required** |
| `GET` | `/public/donations/{reference}/status` | Safe status view for the success/failed pages. Returns only `reference`, `status`, `amountMinor`, `currency`, `verifiedAt`, `receiptAvailable` — **no PII** and no donor identity |
| `GET` | `/public/donations/{reference}/receipt` | Only with a receipt-access token emailed to the donor, or an authenticated donor-support admin session. Never a public URL |

#### `POST /public/donations`

```json
{
  "amountMinor": 25100,
  "currency": "INR",
  "purposeCode": "fodder",
  "campaignSlug": "winter-fodder-drive",
  "donor": {
    "name": "…",
    "email": "…",
    "phone": "…",
    "isAnonymous": false,
    "wantsReceipt": true,
    "pan": null
  },
  "consent": { "given": true, "noticeVersion": "2026-11-01" },
  "sourcePath": "/donate"
}
```

Response `201`:

```json
{
  "data": {
    "reference": "SVG-DN-2026-000123",
    "status": "PENDING",
    "amountMinor": 25100,
    "currency": "INR",
    "redirectUrl": "<provider-hosted checkout URL>",
    "expiresAt": "2026-11-05T14:15:00.000Z"
  }
}
```

Server-side validation (all mandatory):

1. `amountMinor` is an integer, `> 0`, `≤ settings.maxDonationMinor`.
2. `currency` is `INR`.
3. `purposeCode` exists and is active; if `campaignSlug` is given, the campaign is published, `acceptsDonations`, within its date window, and its purpose matches.
4. `consent.given` is `true`; `consent.noticeVersion` matches the current notice.
5. Donor email is syntactically valid and normalised.
6. PAN, when supplied, matches the PAN format and is only accepted when `wantsReceipt` is true.
7. Online payment is enabled (`PAYMENT_PROVIDER != 'disabled'`), else `503 PAYMENT_PROVIDER_DISABLED`.
8. Amount/purpose/currency are **never** taken from a client total or a hidden field.

The stored amount is the server-validated amount, and the payment attempt snapshots it so a later price/config change cannot alter a live checkout.

### 13.5 Public endpoint rules

- No public endpoint accepts a status, publish date, ID, slug or ordering parameter that could expose unpublished content.
- `?includeDrafts=true` does not exist anywhere in the public namespace.
- A public endpoint never returns `donorEmail`, `donorPhone`, `donorPan`, staff emails or internal notes.
- Anonymous donation displays (if ever added) show name only when `isAnonymous = false`.

---

## 14. Admin API catalogue

All admin endpoints require a session, a CSRF token for mutations, and a permission. `X-Robots-Tag: noindex` on every response.

### 14.1 Dashboard

| Method | Path | Permission |
|---|---|---|
| `GET` | `/admin/dashboard/summary?from=&to=` | `dashboard.view` |
| `GET` | `/admin/dashboard/activity?limit=` | `dashboard.view` |
| `GET` | `/admin/dashboard/health` | `system.health` |

Summary content is **role-filtered**: a Volunteer Manager sees enquiry counts but no financial totals. Financial figures are computed from `donations.status = 'SUCCEEDED'` (and refunds) only — never from analytics or browser events.

### 14.2 Content

Every content type follows the [standard content resource contract](#15-standard-content-resource-contract).

| Base path | Permission prefix |
|---|---|
| `/admin/pages` | `page.*` |
| `/admin/homepage` | `homepage.*` |
| `/admin/activities` | `activity.*` |
| `/admin/news` | `news.*` |
| `/admin/news/categories` | `news.*` |
| `/admin/news/tags` | `news.*` |
| `/admin/events` | `event.*` |
| `/admin/campaigns` | `campaign.*` |
| `/admin/campaigns/{id}/updates` | `campaign.*` |
| `/admin/impact` | `impact.*` |
| `/admin/testimonials` | `testimonial.*` |
| `/admin/navigation` | `navigation.*` |

### 14.3 Media

See [§17](#17-media-api-catalogue).

### 14.4 Enquiries

| Method | Path | Permission |
|---|---|---|
| `GET` | `/admin/enquiries?status=&type=&assignedTo=&q=&from=&to=` | `enquiry.read` |
| `GET` | `/admin/enquiries/{id}` | `enquiry.read` |
| `PATCH` | `/admin/enquiries/{id}` | `enquiry.update` |
| `POST` | `/admin/enquiries/{id}/assign` | `enquiry.assign` |
| `POST` | `/admin/enquiries/{id}/notes` | `enquiry.update` |
| `POST` | `/admin/enquiries/{id}/mark-spam` | `enquiry.update` |
| `DELETE` | `/admin/enquiries/{id}` | `enquiry.delete` |
| `POST` | `/admin/enquiries/export` | `enquiry.export` |

### 14.5 Donations and receipts

| Method | Path | Permission |
|---|---|---|
| `GET` | `/admin/donations?status=&campaignId=&from=&to=&q=&method=` | `donation.read` |
| `GET` | `/admin/donations/{id}` | `donation.read` |
| `GET` | `/admin/donations/{id}/history` | `donation.read` |
| `GET` | `/admin/donations/{id}/attempts` | `donation.read` |
| `POST` | `/admin/donations/{id}/reconcile` | `donation.reconcile` |
| `POST` | `/admin/donations/{id}/refund` | `donation.refund` |
| `POST` | `/admin/donations/export` | `donation.export` |
| `GET` | `/admin/donations/summary?from=&to=&groupBy=` | `donation.read` |
| `GET` | `/admin/receipts?status=&from=&to=` | `receipt.read` |
| `GET` | `/admin/receipts/{id}` | `receipt.read` |
| `POST` | `/admin/receipts/{id}/reissue` | `receipt.reissue` |
| `POST` | `/admin/receipts/{id}/void` | `receipt.void` |

**There is no endpoint that lets an admin mark a donation `SUCCEEDED` manually.** The only status-changing admin endpoint is `reconcile`, which re-queries the provider and applies the verified result. This is deliberate: manual "mark as paid" is the single most dangerous feature in a donation CMS.

### 14.6 SEO

| Method | Path | Permission |
|---|---|---|
| `GET` | `/admin/seo/defaults` | `seo.read` |
| `PATCH` | `/admin/seo/defaults` | `seo.manage` |
| `GET` | `/admin/seo/redirects` | `seo.read` |
| `POST` | `/admin/seo/redirects` | `seo.redirects` |
| `PATCH` | `/admin/seo/redirects/{id}` | `seo.redirects` |
| `DELETE` | `/admin/seo/redirects/{id}` | `seo.redirects` |
| `POST` | `/admin/seo/redirects/validate` | `seo.read` — checks loops, chains, conflicts |

### 14.7 Settings

| Method | Path | Permission |
|---|---|---|
| `GET` | `/admin/settings/{group}` | `settings.{group}.read` |
| `PATCH` | `/admin/settings/{group}` | `settings.{group}.update` |
| `GET` | `/admin/settings/donation/status` | `settings.donation.read` — provider name, mode, kill switch, last webhook |
| `POST` | `/admin/settings/donation/kill-switch` | `system.maintenance_mode` — disables online donations immediately |

Groups: `general`, `contact`, `forms`, `email`, `analytics`, `donation`, `seo`.
Settings are validated against a per-group Zod schema; an unknown key returns `422`. **No endpoint accepts provider credentials.**

### 14.8 Users, roles, audit

| Method | Path | Permission |
|---|---|---|
| `GET` | `/admin/users` | `user.read` |
| `POST` | `/admin/users/invite` | `user.invite` |
| `GET` | `/admin/users/{id}` | `user.read` |
| `PATCH` | `/admin/users/{id}` | `user.manage` |
| `POST` | `/admin/users/{id}/suspend` | `user.manage` |
| `POST` | `/admin/users/{id}/reactivate` | `user.manage` |
| `POST` | `/admin/users/{id}/roles` | `user.manage` |
| `DELETE` | `/admin/users/{id}/roles/{roleId}` | `user.manage` |
| `POST` | `/admin/users/{id}/permissions` | `user.manage` — grant/deny override, `reason` required |
| `DELETE` | `/admin/users/{id}/permissions/{permissionId}` | `user.manage` |
| `POST` | `/admin/users/{id}/sessions/revoke` | `user.revoke_sessions` |
| `GET` | `/admin/roles` | `role.read` |
| `POST` | `/admin/roles` | `role.manage` |
| `GET` | `/admin/roles/{id}` | `role.read` |
| `PATCH` | `/admin/roles/{id}` | `role.manage` |
| `DELETE` | `/admin/roles/{id}` | `role.manage` |
| `PUT` | `/admin/roles/{id}/permissions` | `role.manage` — replace the set atomically |
| `GET` | `/admin/permissions` | `role.read` — the catalogue, grouped |
| `GET` | `/admin/audit-log?actor=&action=&entityType=&from=&to=&q=` | `audit.read` |
| `GET` | `/admin/audit-log/{id}` | `audit.read` |
| `POST` | `/admin/audit-log/export` | `audit.export` |

Privilege-escalation guard: `PUT /admin/roles/{id}/permissions` rejects any attempt to grant a permission the acting user does not themselves hold, unless the actor is a Super Admin.

---

## 15. Standard content resource contract

Every content type (`pages`, `activities`, `news`, `events`, `campaigns`, `impact`, `testimonials`) implements this contract identically, so the admin UI can share components and developers learn it once.

| Method | Path | Purpose | Permission |
|---|---|---|---|
| `GET` | `/admin/{resource}` | List with `q`, filters, sort, pagination | `{r}.read` |
| `POST` | `/admin/{resource}` | Create draft | `{r}.create` |
| `GET` | `/admin/{resource}/{id}` | Read one (includes draft state) | `{r}.read` |
| `PATCH` | `/admin/{resource}/{id}` | Update, `If-Match` required | `{r}.update` |
| `DELETE` | `/admin/{resource}/{id}` | Soft delete | `{r}.delete` |
| `POST` | `/admin/{resource}/{id}/publish` | Publish now | `{r}.publish` |
| `POST` | `/admin/{resource}/{id}/schedule` | `{ scheduledFor, timezone }` | `{r}.schedule` |
| `POST` | `/admin/{resource}/{id}/unpublish` | Return to draft offline | `{r}.publish` |
| `POST` | `/admin/{resource}/{id}/archive` | Archive | `{r}.archive` |
| `POST` | `/admin/{resource}/{id}/restore` | Restore archived/deleted | `{r}.restore` |
| `POST` | `/admin/{resource}/{id}/duplicate` | Copy as a new draft | `{r}.create` |
| `GET` | `/admin/{resource}/{id}/revisions` | History list | `{r}.read` |
| `GET` | `/admin/{resource}/{id}/revisions/{version}` | One revision | `{r}.read` |
| `POST` | `/admin/{resource}/{id}/revisions/{version}/restore` | Restore snapshot as new draft | `{r}.restore` |
| `POST` | `/admin/{resource}/{id}/preview-link` | Signed preview URL (30 min, single use) | `{r}.read` |
| `PATCH` | `/admin/{resource}/{id}/autosave` | Draft-only autosave | `{r}.update` |

### 15.1 Publish request

```json
{
  "version": 7,
  "changeNote": "Updated campaign progress wording",
  "revalidate": true
}
```

Response `200` includes the new `version`, `status`, `publishedAt`, `currentRevisionId` and `revalidation: { queued: true }`.

### 15.2 Schedule request

```json
{
  "version": 7,
  "scheduledFor": "2026-11-12T04:30:00.000Z",
  "timezone": "Asia/Kolkata",
  "changeNote": "Scheduled for the campaign launch"
}
```

Validation: `scheduledFor` must be at least 1 minute in the future, must be a valid instant in the given timezone (DST-safe), and the record must have no unresolved validation errors. Published content keeps serving until the schedule fires.

### 15.3 Transition error cases

| Attempt | Response |
|---|---|
| Publish a record with validation errors | `422 VALIDATION_FAILED` with field errors |
| Publish without permission | `403 FORBIDDEN` |
| Schedule in the past | `422 VALIDATION_FAILED` |
| Publish an archived record | `409 INVALID_STATE_TRANSITION` |
| Publish when the draft diverged from a scheduled snapshot | `409 INVALID_STATE_TRANSITION` with `meta.requiresReconfirm` |
| Update with a stale version | `409 VERSION_CONFLICT` |
| Change slug to one that exists | `409 SLUG_TAKEN` |

### 15.4 Resource-specific endpoints

| Resource | Extra endpoints | Notes |
|---|---|---|
| `pages` | `PUT /admin/pages/{id}/sections/order`, `POST /admin/pages/{id}/sections`, `PATCH /admin/pages/{id}/sections/{sectionId}`, `DELETE /admin/pages/{id}/sections/{sectionId}` | Section reorder is one atomic `PUT` with an array of IDs |
| `homepage` | `GET /admin/homepage`, `PATCH /admin/homepage`, `PUT /admin/homepage/sections/order` | Singleton; same publish contract |
| `news` | `GET/POST/PATCH/DELETE /admin/news/categories`, `GET /admin/news/tags` | Tag creation inline |
| `events` | `POST /admin/events/{id}/status` | `SCHEDULED`/`COMPLETED`/`CANCELLED`/`POSTPONED` — operational status, separate from publishing |
| `campaigns` | `GET/POST/PATCH/DELETE /admin/campaigns/{id}/updates` | Campaign updates have their own publish action |
| `impact` | `POST /admin/impact/{id}/verify`, `POST /admin/impact/{id}/unverify` | `impact.verify`; requires `methodology` and `sourceNote` |
| `testimonials` | `POST /admin/testimonials/{id}/approve`, `POST /admin/testimonials/{id}/reject` | `testimonial.approve`; requires consent evidence |
| `activities` | `PATCH /admin/activities/{id}/feature` | Toggles `isFeatured` (audited) |

### 15.5 Example: create a page

```http
POST /api/v1/admin/pages
Authorization: cookie session
X-CSRF-Token: …
Content-Type: application/json

{
  "title": "About the Gaushala",
  "slug": "about",
  "summary": "…",
  "template": "GENERIC",
  "seo": {
    "title": null,
    "description": null,
    "noindex": false
  }
}
```

`201 Created`, `Location: /api/v1/admin/pages/{id}`, body includes the created page with `status: "DRAFT"`, `version: 1`.

---

## 16. Auth API catalogue

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/auth/csrf` | public | Issues an anonymous CSRF token for public forms |
| `POST` | `/auth/login` | public | Rate-limited; may return `mfaRequired` |
| `POST` | `/auth/mfa/verify` | challenge token | Completes login |
| `POST` | `/auth/logout` | session | Revokes the current session |
| `POST` | `/auth/logout-all` | session | Revokes all sessions |
| `GET` | `/auth/me` | session | User, roles, effective permissions, MFA state |
| `POST` | `/auth/password/forgot` | public | Always `202` |
| `POST` | `/auth/password/reset` | token | Also revokes all sessions |
| `POST` | `/auth/password/change` | session | Requires current password; revokes other sessions |
| `POST` | `/auth/invitations/accept` | token | Sets the password, activates the account |
| `POST` | `/auth/mfa/setup` | session | Returns a provisioning URI + secret (once) |
| `POST` | `/auth/mfa/enable` | session | Verifies the first code |
| `POST` | `/auth/mfa/disable` | session | Requires password + a valid code |
| `POST` | `/auth/mfa/recovery-codes` | session | Regenerates recovery codes (invalidates old) |
| `GET` | `/admin/profile/sessions` | session | Session inventory |
| `DELETE` | `/admin/profile/sessions/{id}` | session | Revoke one session |

`GET /auth/me`:

```json
{
  "data": {
    "user": { "id": "…", "name": "…", "email": "…", "isSuperAdmin": false, "mfaEnabled": true },
    "roles": [ { "key": "content_editor", "name": "Content Editor" } ],
    "permissions": ["page.read", "page.create", "page.update", "page.publish", "media.upload"],
    "session": { "expiresAt": "2026-11-05T21:00:00.000Z" }
  }
}
```

The admin UI uses this list to render navigation; the API re-checks every request regardless.

---

## 17. Media API catalogue

| Method | Path | Permission | Notes |
|---|---|---|---|
| `GET` | `/admin/media?q=&categoryId=&kind=&from=&to=` | `media.read` | Library listing |
| `GET` | `/admin/media/{id}` | `media.read` | Includes variants and usage list |
| `POST` | `/admin/media/presign` | `media.upload` | Returns upload URL, storage key, expiry |
| `POST` | `/admin/media/complete` | `media.upload` | Verifies bytes, generates variants, creates the row |
| `PATCH` | `/admin/media/{id}` | `media.update` | Alt text, caption, credit, category, focal point |
| `POST` | `/admin/media/{id}/replace` | `media.replace` | New file, same ID |
| `DELETE` | `/admin/media/{id}` | `media.delete` | Blocked if used → `409 MEDIA_IN_USE` with usages |
| `GET` | `/admin/media/{id}/file` | `media.read` | Private streaming, `no-store` |
| `GET` | `/admin/media/{id}/usage` | `media.read` | Where it is referenced |
| `GET` | `/admin/media/categories` | `media.read` | |
| `POST` | `/admin/media/categories` | `media.update` | |
| `PATCH` | `/admin/media/categories/{id}` | `media.update` | |
| `DELETE` | `/admin/media/categories/{id}` | `media.update` | `409` when in use |

### 17.1 Upload sequence

```text
1. POST /admin/media/presign
   { "filename": "cow-shed.jpg", "mimeType": "image/jpeg", "sizeBytes": 2431002 }
   → 200 { uploadUrl, storageKey, expiresAt, requiredHeaders }

2. PUT <uploadUrl>   (direct to storage, body = file bytes)

3. POST /admin/media/complete
   { "storageKey": "2026/11/<uuid>.jpg", "altText": "…", "categoryId": "…" }
   → 201 { data: Media with variants }

   On failure (wrong type, oversize, decode error):
   → 422 { code: "VALIDATION_FAILED", errors: [{ path: "file", code: "INVALID_FILE_TYPE", … }] }
   and the object is deleted from storage.
```

Presign validation: extension and declared MIME must both be on the allow-list; `sizeBytes` must be within limits; the key is generated server-side (the client filename is never used as a path).

---

## 18. Donation and payment API catalogue

### 18.1 Provider abstraction (internal, not HTTP)

The donation module depends on the `PaymentProvider` interface defined in `ARCHITECTURE.md` §11.2. No HTTP endpoint exposes provider-specific concepts: the public API speaks in `reference`, `redirectUrl` and normalised `status`.

### 18.2 Payment state endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/public/donations` | Creates the donation and the intent |
| `GET` | `/public/donations/{reference}/status` | Polled by the success page while `PENDING`/`PROCESSING` (max ~10 polls, then "we will email you") |
| `POST` | `/webhooks/payments/{provider}` | Provider notification (see §19) |

### 18.3 Receipt access

| Method | Path | Notes |
|---|---|---|
| `GET` | `/public/donations/{reference}/receipt?token=` | Tokenised link emailed to the donor; opaque, single-purpose, 30-day expiry |
| `GET` | `/admin/receipts/{id}/pdf` | `receipt.read`; streams from the private bucket |

### 18.4 Status values exposed publicly

`PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `EXPIRED`, `REFUNDED`, `PARTIALLY_REFUNDED`.

The success page renders:
- `SUCCEEDED` → verified confirmation + receipt status.
- `PENDING` / `PROCESSING` → "We are confirming your payment" with a poll and an email promise. **Never** "Thank you, your donation succeeded."
- `FAILED` / `CANCELLED` / `EXPIRED` → failure explanation and retry.
- `REFUNDED` / `PARTIALLY_REFUNDED` → the appropriate status with contact information.

### 18.5 Donation export

`POST /admin/donations/export` accepts `{ from, to, status[], campaignId, format: "csv" }`, permission `donation.export`, rate-limited to 5/hour. The job produces a private file link valid for 15 minutes, and the audit entry records the filter criteria and row count. PII in exports is limited to what finance requires; PAN is included only when explicitly selected and is itself audited.

---

## 19. Webhook contract

### 19.1 Endpoint

```http
POST /api/v1/webhooks/payments/{provider}
Content-Type: application/json   (or the provider's documented type)
X-Provider-Signature: <provider-specific>
<body: exact raw bytes>
```

This is the only route that reads the **raw body**; JSON parsing is disabled for it so a signature is computed over untouched bytes.

### 19.2 Processing contract

| Step | Behaviour |
|---|---|
| 1. Resolve provider | Unknown → `404` |
| 2. Verify signature | Invalid → `401`, security event logged, no state change |
| 3. Parse to a normalised `ProviderEvent` | Malformed → `400` |
| 4. Insert `payment_events` with `UNIQUE (provider, provider_event_id)` | Duplicate → `200` (idempotent replay) |
| 5. Match `providerOrderId` → `payment_attempt` | Unmatched → status `UNMATCHED`, alert, `200` |
| 6. Compare amount + currency | Mismatch → status `AMOUNT_MISMATCH`, alert, `200`, **no success** |
| 7. Apply transition transactionally | Success → `200`; transient failure → `500` (provider retries) |
| 8. Enqueue email, receipt, revalidation | `200` returned before heavy work |

Response body: `{ "received": true }` with `200`, or a problem document for `4xx`.

### 19.3 Rules

- The endpoint is idempotent for every event, always.
- It never trusts a client-supplied status, amount or donation reference outside the signed payload.
- It returns `2xx` for events it has already processed or cannot usefully retry (unmatched, mismatch) to stop provider retry storms — while raising an internal alert.
- It returns `5xx` only for genuinely transient local failures so the provider retries.
- Source IP is hashed and logged; a sustained stream of invalid signatures triggers an alert.
- **No provider-specific endpoint, header name, payload field or signature algorithm is implemented until official IDFC FIRST Bank documentation is supplied.** The contract above is provider-agnostic by design.

### 19.4 Reconciliation fallback

A scheduled job calls `fetchStatus` for attempts in `PENDING`/`PROCESSING` beyond the expected settlement window, so a dropped webhook does not leave a donation stuck forever. Reconciliation results are recorded with `verifiedVia = STATUS_CHECK`.

---

## 20. Internal endpoints

Not part of the public contract; restricted to the deployment network or a shared secret.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/health/live` | Process liveness; no dependencies |
| `GET` | `/health/ready` | Database, Redis, storage, pending migrations |
| `GET` | `/version` | Build SHA, version, environment |
| `POST` | `/internal/jobs/{jobName}` | Manual job trigger (signed; admin permission `system.health`) |

The web app exposes:

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/revalidate` | HMAC-signed from the API; invalidates cache tags |
| `GET`/`POST` | `/api/preview` | Enables/disables draft mode from a signed token |
| `GET` | `/api/health` | Web app readiness |

---

## 21. OpenAPI and documentation

- OpenAPI **3.1** is generated from the Zod contracts (`@asteasolutions/zod-to-openapi` or equivalent) at build time; it is not hand-maintained.
- Served at `GET /api/v1/openapi.json` in development and staging; in production it is available only to authenticated users with `system.health` (attackers gain little, but there is no reason to publish the full admin surface).
- A browsable reference (Scalar or Redoc) is generated for the team and for handover.
- CI fails if a route exists that is not described in the generated document, or if a documented route is missing.
- The generated document is committed under `docs/api/openapi.json` so changes are visible in review diffs.

---

## 22. Endpoint-to-permission matrix

Representative mapping (the startup route audit enforces completeness).

| Endpoint | Method | Auth | Permission | Rate class |
|---|---|---|---|---|
| `/public/site` | GET | — | — | `public.read` |
| `/public/homepage` | GET | — | — | `public.read` |
| `/public/pages/{slug}` | GET | — | — | `public.read` |
| `/public/news` | GET | — | — | `public.read` |
| `/public/campaigns/{slug}` | GET | — | — | `public.read` |
| `/public/search` | GET | — | — | `public.search` |
| `/public/enquiries` | POST | — | — | `public.form` |
| `/public/donations` | POST | — | — | `public.donate` |
| `/public/donations/{ref}/status` | GET | — | — | `public.status` |
| `/auth/login` | POST | — | — | `auth.login` |
| `/auth/me` | GET | session | self | `admin.read` |
| `/admin/dashboard/summary` | GET | session | `dashboard.view` | `admin.read` |
| `/admin/pages` | GET | session | `page.read` | `admin.read` |
| `/admin/pages` | POST | session | `page.create` | `admin.write` |
| `/admin/pages/{id}` | PATCH | session | `page.update` | `admin.write` |
| `/admin/pages/{id}/publish` | POST | session | `page.publish` | `admin.write` |
| `/admin/pages/{id}` | DELETE | session | `page.delete` | `admin.write` |
| `/admin/media/presign` | POST | session | `media.upload` | `admin.upload` |
| `/admin/media/{id}` | DELETE | session | `media.delete` | `admin.write` |
| `/admin/enquiries` | GET | session | `enquiry.read` | `admin.read` |
| `/admin/donations` | GET | session | `donation.read` | `admin.read` |
| `/admin/donations/{id}/refund` | POST | session | `donation.refund` | `admin.write` |
| `/admin/donations/export` | POST | session | `donation.export` | `admin.export` |
| `/admin/receipts/{id}/void` | POST | session | `receipt.void` | `admin.write` |
| `/admin/impact/{id}/verify` | POST | session | `impact.verify` | `admin.write` |
| `/admin/testimonials/{id}/approve` | POST | session | `testimonial.approve` | `admin.write` |
| `/admin/settings/donation` | PATCH | session | `settings.donation.update` | `admin.write` |
| `/admin/users/{id}/roles` | POST | session | `user.manage` | `admin.write` |
| `/admin/roles/{id}/permissions` | PUT | session | `role.manage` | `admin.write` |
| `/admin/audit-log` | GET | session | `audit.read` | `admin.read` |
| `/webhooks/payments/{provider}` | POST | signature | — | `webhook` |

---

## 23. Change management

| Requirement | Rule |
|---|---|
| Adding an endpoint | Contract + Zod schema + permission declaration + OpenAPI entry + integration test |
| Changing a response shape | Additive only in `v1` |
| New enum value | Document it; clients must treat unknown enums defensively |
| New permission | Add to `permissions.ts`, seed migration, RBAC matrix, and the route audit |
| Breaking change | New `v2` group; `v1` deprecated with `Deprecation`/`Sunset` headers |
| Changelog | `docs/api/CHANGELOG.md`, one entry per release |

---

## 24. Open questions

| # | Question | Recommendation |
|---|---|---|
| **API-1** | Should `GET /public/homepage` hydrate all sections in one call, or should each section fetch independently? | **One call.** Fewer round trips, one cache entry, consistent publish state |
| **API-2** | Offset or keyset pagination for public archives? | **Keyset** for news/gallery; offset for small, stable lists |
| **API-3** | Should the admin use a GraphQL/BFF layer? | **No.** One consumer, a well-defined REST contract, and no over-fetching problem at this scale |
| **API-4** | Public donation status: reference-only access, or a signed token? | Reference **plus** a rate limit is sufficient (a 20-char reference is unguessable enough at the enforced rate); a token can be added without breaking the contract |
| **API-5** | Should `POST /public/donations` support saving a donor's details for a retry? | **No** — no donor accounts in v1; retry re-enters details with the same idempotency key |
| **API-6** | Expose a public JSON feed for campaigns (for embedding elsewhere)? | Defer; add only if a real need appears |
