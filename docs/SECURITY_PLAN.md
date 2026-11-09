# Security Plan — Shri Vanshidhar Gaushala

**Document status:** Phase 1 deliverable
**Version:** 1.0 (proposal)
**Target assurance level:** OWASP ASVS Level 2
**Last updated:** 2026-11-05
**Related:** `ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `API_DESIGN.md`, `SEO_PLAN.md`

> This site will ask strangers for money on behalf of a charitable organisation. The security bar is therefore set by donor trust, not by the size of the organisation. A single fake payment confirmation, leaked donation record or defaced page would be a serious reputational and ethical failure.

---

## Table of contents

1. [Scope and security objectives](#1-scope-and-security-objectives)
2. [Assets and data classification](#2-assets-and-data-classification)
3. [Threat model](#3-threat-model)
4. [OWASP Top 10 coverage](#4-owasp-top-10-coverage)
5. [OWASP ASVS Level 2 mapping](#5-owasp-asvs-level-2-mapping)
6. [Control catalogue](#6-control-catalogue)
7. [Payment-specific controls](#7-payment-specific-controls)
8. [Privacy and DPDP Act 2023](#8-privacy-and-dpdp-act-2023)
9. [Secret management and rotation](#9-secret-management-and-rotation)
10. [Logging, monitoring and alerting](#10-logging-monitoring-and-alerting)
11. [Backup, disaster recovery and business continuity](#11-backup-disaster-recovery-and-business-continuity)
12. [Incident response](#12-incident-response)
13. [Secure development lifecycle](#13-secure-development-lifecycle)
14. [Security testing plan](#14-security-testing-plan)
15. [Risk register](#15-risk-register)
16. [Pre-launch security checklist](#16-pre-launch-security-checklist)
17. [Open items](#17-open-items)

---

## 1. Scope and security objectives

### 1.1 In scope

The public website, admin dashboard, REST API, worker processes, PostgreSQL, Redis, object storage, the payment adapter layer, deployment configuration, CI/CD, and the people who operate the system.

### 1.2 Out of scope (with rationale)

| Out of scope | Reason |
|---|---|
| Cardholder data environment | Never touched. Checkout is provider-hosted; the site must never see a PAN, CVV or UPI PIN |
| The bank's own infrastructure | Outside our control; assessed only through our integration boundary |
| Staff personal devices | Governed by an acceptable-use policy the organisation must adopt |
| Physical security of the Gaushala premises | Outside the software scope |

### 1.3 Security objectives

| ID | Objective | Success criterion |
|---|---|---|
| **SO-1** | Donation integrity | No donation can reach `SUCCEEDED` or produce a receipt without a verified provider result; no duplicate charge is recorded twice |
| **SO-2** | Authorisation correctness | Every privileged action is permission-checked server-side; no role can exceed its granted permissions |
| **SO-3** | Content integrity | Only authorised, authenticated staff can change public content; every change is attributable |
| **SO-4** | Confidentiality of personal data | Donor and enquirer data is minimised, encrypted where sensitive, never logged, never publicly exposed |
| **SO-5** | Availability | The public site and donation path resist abuse and degrade gracefully |
| **SO-6** | Recoverability | A destructive event is recoverable within RTO with verified backups |
| **SO-7** | Accountability | Every sensitive operation is attributable to an actor with a timestamp |

---

## 2. Assets and data classification

### 2.1 Data classification

| Class | Definition | Examples | Controls |
|---|---|---|---|
| **C4 — Restricted** | Secrets and credentials | DB URL, signing keys, storage keys, SMTP password, future provider credentials, MFA secrets | Secret store only; never in DB, logs, CMS, repo, screenshots; rotation; access limited to deployment admins |
| **C3 — Confidential (personal)** | Personal data of donors and enquirers | Donor name/email/phone/address, PAN, enquiry messages, staff email, IP hashes | Encrypted in transit and at rest; column encryption for PAN/address; access-controlled; retention-limited; never logged |
| **C2 — Internal** | Operational data not for public release | Donation records (non-PII fields), payment events, audit log, draft content, penalty/refund notes | Authenticated staff only; role-restricted; audited |
| **C1 — Public** | Intended for public display | Published pages, campaigns, events, impact statistics, published media | Integrity controls (who can publish) and availability controls |

### 2.2 Asset inventory

| Asset | Class | Confidentiality | Integrity | Availability |
|---|---|---|---|---|
| Donation records | C2/C3 | High | **Critical** | High |
| Receipts (PDF) | C3 | High | **Critical** | Medium |
| Payment events | C2 | Medium | **Critical** | Medium |
| User accounts, roles, permissions | C2/C4 | High | **Critical** | High |
| Session tokens | C4 | **Critical** | Critical | High |
| Published content | C1 | Low | **Critical** | High |
| Media library | C1/C3 | Medium | High | Medium |
| Enquiries | C3 | High | Medium | Medium |
| Audit log | C2 | High | **Critical** (immutable) | Medium |
| Backups | C3/C4 | **Critical** | Critical | High |
| Source code | C2 | High | High | Medium |
| Configuration and secrets | C4 | **Critical** | Critical | High |

### 2.3 Threat actors

| Actor | Motivation | Capability | Primary vectors |
|---|---|---|---|
| Opportunistic scanner / bot | Automated exploitation, spam | Low–medium | Known CVEs, default creds, form spam, path traversal |
| Fraudster / donation abuser | Free receipt, card testing, reputation damage | Medium | Forged success, amount manipulation, refund abuse, duplicate submissions |
| Disgruntled or careless insider | Revenge, negligence, curiosity | Medium–high (legitimate access) | Exfiltration, unauthorised publish, deleting content |
| Competitor / activist | Reputational damage | Low–medium | Defacement, fake content, review manipulation |
| Organised attacker | Extortion, data sale | High | Credential stuffing, supply chain, targeted vuln |
| Well-intentioned researcher | Recognition | High (technical) | Unpatched issues |

---

## 3. Threat model

### 3.1 Trust boundaries

```text
 ┌───────────────────────────── Untrusted ─────────────────────────────┐
 │  Browser (public)   Browser (admin)   Payment provider   Email link │
 └───────┬─────────────────┬──────────────────┬────────────────┬──────┘
         │ TLS             │ TLS + session     │ signed webhook │ token
 ────────┼─────────────────┼──────────────────┼────────────────┼───────
 ┌───────▼─────────────────▼──────────────────▼────────────────▼──────┐
 │  Edge: Cloudflare (WAF, DDoS, TLS termination)                      │
 └───────┬─────────────────────────────────────────────────────────────┘
 ┌───────▼─────────────────────────────────────────────────────────────┐
 │  Web tier (Next.js) — public rendering + admin UI shell             │
 └───────┬─────────────────────────────────────────────────────────────┘
         │ internal HTTPS + signed revalidation
 ┌───────▼─────────────────────────────────────────────────────────────┐
 │  API tier (Express) — ALL authorisation and business logic          │
 └───┬──────────┬──────────┬──────────────┬────────────────────────────┘
 ┌───▼───┐  ┌───▼───┐  ┌───▼────┐  ┌──────▼──────┐
 │ PG    │  │ Redis │  │ Object │  │ Email / Pay │
 └───────┘  └───────┘  └────────┘  └─────────────┘
```

Trust assumptions that must be **verified**, not assumed:

1. The web tier is not a security boundary. It may render anything, but every privileged read/write is authorised by the API.
2. Anything arriving from a browser is hostile — including values the UI itself generated.
3. The payment provider's webhook is untrusted until the signature is verified.
4. Cloudflare is a mitigation layer, not an authorisation layer; a request that bypasses it (direct origin access) must still be safe.
5. Internal networks are not implicitly trusted (a compromised container is inside the perimeter).

### 3.2 STRIDE summary

| Threat | Concrete scenario in this system | Primary mitigation |
|---|---|---|
| **Spoofing** | Stolen session cookie used to act as an admin; forged webhook claiming a payment succeeded | HttpOnly session cookie, hashed tokens, session inventory + revocation, device/IP anomaly alerts, webhook signature verification |
| **Tampering** | Client edits `amountMinor` or `status` in the donation request; admin alters a receipt PDF | Server-side amount derivation and validation; immutable status machine; receipts generated server-side from immutable snapshots; audit log |
| **Repudiation** | A staff member denies deleting campaign content or issuing a refund | Append-only audit log with actor, action, target, timestamp, before/after; receipt issuance and refunds require a reason |
| **Information disclosure** | Donor list leaks through an IDOR, a log line, a public API field or an unguarded export | Authorisation on every object read; response DTO allow-lists; log redaction; private bucket; no PII in public endpoints |
| **Denial of service** | Flooding `POST /public/donations` or `/auth/login`; expensive search requests | Redis rate limits per class, WAF, body size caps, query limits, pagination caps, timeouts |
| **Elevation of privilege** | A Content Editor grants themselves `role.manage`; a forged `isSuperAdmin` in a request body | Mass-assignment protection (allow-listed inputs), privilege-escalation guard on role edits, server-side permission resolution, `isSuperAdmin` never client-settable |

### 3.3 Key attack scenarios and their defences

| # | Scenario | Defence |
|---|---|---|
| A1 | Attacker marks a donation paid by visiting a "success" URL | Success page renders from `GET /public/donations/{ref}/status`, which reflects only server-side verified state. There is **no** endpoint that accepts a client assertion of success |
| A2 | Attacker posts a webhook with a fabricated success payload | Signature verified over raw bytes before anything is parsed or written; invalid → `401`, security event, no state change |
| A3 | Attacker replays a genuine provider webhook | `UNIQUE (provider, provider_event_id)`; duplicates return `200` without re-applying |
| A4 | Attacker submits a webhook with a valid signature but a different amount | Amount and currency compared against the stored attempt; mismatch → `AMOUNT_MISMATCH`, no success, alert |
| A5 | Insider exports the donor list and sells it | `donation.export` is Super Admin only, rate-limited, audited with filter criteria and row count; exports are private, expiring links |
| A6 | Attacker resets an admin password via a leaked reset link | Single-use token, 30-minute expiry, hash stored, all sessions revoked on use, rate-limited request, no account enumeration |
| A7 | Attacker uploads a PHP/JS file renamed `.jpg` and gets it executed or served | Extension *and* declared MIME *and* magic-byte verification *and* Sharp decode *and* random storage key *and* no execution from storage domain *and* `Content-Disposition`/`X-Content-Type-Options: nosniff` on private serving |
| A8 | Attacker injects a script through the rich-text editor | Editor stores structured JSON, not HTML; rendered through a whitelisting renderer; no `dangerouslySetInnerHTML` on user content; strict CSP as a second layer |
| A9 | Attacker embeds a tiny, unlabelled tracking pixel via an image URL field | Media references are IDs, not URLs; external image URLs are not accepted in content fields |
| A10 | Attacker enumerates draft content to scoop an announcement | Public endpoints filter on published state in the repository; draft access requires a signed preview token |
| A11 | Admin session stolen via XSS in the admin app | HttpOnly cookie, strict CSP, React escaping, no `eval`, no remote scripts, short idle timeout, session inventory |
| A12 | CSRF forces a logged-in admin to publish attacker content | Double-submit CSRF token + `SameSite=Lax` + `Origin` allow-list on every mutation |
| A13 | Compromised dependency exfiltrates env vars at install or runtime | Lockfile pinning, `--frozen-lockfile`, dependency review, `npm audit`/Dependabot, no `postinstall` scripts from untrusted packages, secrets not in the build environment of PR builds |
| A14 | Backups leak because a bucket is public | Private bucket, encryption at rest, separate credentials, no public ACLs, access audited |
| A15 | Attacker opens a redirect to a phishing site via a slug change | Redirect targets validated to be site-relative; open redirect blocked at write time; no `?next=` external redirect after login |
| A16 | Brute-force login | Progressive lockout, per-IP and per-email rate limits, Argon2id cost, generic error message, alerting on spikes |
| A17 | Attacker fills the enquiry inbox with spam | Honeypot, timing check, rate limit, optional CAPTCHA escalation, spam scoring, retention purge |
| A18 | Donation reference brute-forced to read someone's status | 20+ character random reference component, rate limit, no PII in the response, `no-store` |
| A19 | Poisoning the public cache with one donor's status | Donation/status routes are `no-store` and excluded from CDN caching; never cached behind a shared key |
| A20 | A fake "verified" impact statistic is published | `verificationStatus` gate with a database constraint requiring verifier + methodology; `impact.verify` is Super Admin only |

---

## 4. OWASP Top 10 coverage

| OWASP 2021 | How this system addresses it |
|---|---|
| **A01 Broken Access Control** | Deny-by-default route declarations; startup route audit; permission middleware on every privileged route; resource policies; IDOR prevention by authorising object access, not just route access; `403`/`404` without existence disclosure; permission test matrix per role |
| **A02 Cryptographic Failures** | TLS everywhere (HSTS, no mixed content); Argon2id passwords; SHA-256 for token storage; AES-256-GCM column encryption for PAN/address/MFA secrets; hashed IPs; no secrets in code; encryption at rest for DB and backups |
| **A03 Injection** | Zod validation at every boundary; Prisma parameterised queries (no string-concatenated SQL); the few raw SQL statements are parameterised and reviewed; no HTML from users; CSP; `X-Content-Type-Options: nosniff` |
| **A04 Insecure Design** | This document; the donation state machine; idempotency; the truthfulness gates; threat modelling per phase; abuse-case review before launch |
| **A05 Security Misconfiguration** | Environment-schema validation at boot; security headers by default; no directory listing; disabled stack traces in production; default-deny CORS; least-privilege DB roles; hardening checklist |
| **A06 Vulnerable and Outdated Components** | Lockfile, pinned versions, Dependabot/Renovate, CI audit gate on high/critical, monthly patch review, base-image rebuild schedule |
| **A07 Identification and Authentication Failures** | Session cookies with `HttpOnly`/`Secure`/`SameSite`; Argon2id; progressive lockout; MFA; reset token hygiene; session revocation; invitation-only account creation |
| **A08 Software and Data Integrity Failures** | SRI not needed (no third-party scripts); CI verifies lockfile integrity; webhook signatures; immutable audit log; signed revalidation calls; no unsigned OTA updates |
| **A09 Security Logging and Monitoring Failures** | Structured logs with request IDs; audit log for admin/financial/permission events; redaction; alerting on auth anomalies, webhook failures, permission denials and backup failures; log integrity and retention |
| **A10 Server-Side Request Forgery** | No user-supplied URL is fetched server-side. Media is uploaded, never imported from a URL. If a URL-fetch feature is ever added, it must use an allow-list and block private/link-local ranges |

---

## 5. OWASP ASVS Level 2 mapping

ASVS 4.0.3 chapter-level mapping to the delivery phases. Each item must be evidenced before the Phase 11 security review closes.

| ASVS chapter | Requirement focus | Where addressed | Phase |
|---|---|---|---|
| V1 Architecture | Threat model, secure design, boundaries | This document, `ARCHITECTURE.md` | 1 |
| V2 Authentication | Password policy, Argon2id parameters, MFA, credential recovery, anti-automation | `auth` module | 7 |
| V3 Session Management | Cookie attributes, timeout, rotation, revocation, CSRF | `auth` + `security/csrf.ts` | 7 |
| V4 Access Control | Deny by default, least privilege, object-level checks, admin separation | `rbac` module + route audit | 7 |
| V5 Validation & Encoding | Input validation, output encoding, parameterised queries | Zod + Prisma + renderer | 2, 6 |
| V6 Stored Cryptography | Algorithms, key management, randomness | Password/token/crypto helpers | 2, 7 |
| V7 Error Handling & Logging | No sensitive data in errors/logs, audit trail | Error handler, logger redaction, audit | 2, 7 |
| V8 Data Protection | Classification, retention, privacy, PII in transit/at rest | This document §2, §8 | 1, 9 |
| V9 Communication | TLS config, HSTS, cipher suites | Cloudflare + app headers | 11, 12 |
| V10 Malicious Code | No backdoors, dependency integrity | CI, dependency review | 2, 11 |
| V11 Business Logic | Anti-automation, flow limits, correct sequencing | Donation state machine, idempotency, rate limits | 9 |
| V12 Files & Resources | Upload validation, storage isolation, path traversal | Media module | 6 |
| V13 API & Web Service | REST security, method restrictions, content types, rate limits | `API_DESIGN.md` | 6, 7 |
| V14 Configuration | Build pipeline, secrets, dependency management, hardening | CI + env validation | 2, 11, 12 |

**ASVS parameter choices to record at Phase 7:** Argon2id memory ≥ 19 MiB, iterations ≥ 2, parallelism 1 (or higher tuned to ~200 ms), measured on the production instance; password minimum 12 characters with a breached-password check and no forced composition rules; session idle 8 h, absolute 7 days.

---

## 6. Control catalogue

Controls are grouped, numbered, and referenced by the risk register. **SEC-xxx** identifiers are used in tests and in the Phase 11 review.

### 6.1 Authentication and sessions

| ID | Control |
|---|---|
| **SEC-AUTH-01** | Passwords hashed with Argon2id; parameters documented and benchmarked; never reversible, never logged |
| **SEC-AUTH-02** | Password policy: ≥ 12 characters, breached-password list check, no forced composition, no periodic expiry (NIST-aligned), block the user's email/name as the password |
| **SEC-AUTH-03** | Accounts are invitation-only. No public sign-up route exists |
| **SEC-AUTH-04** | Progressive lockout: 5/10/20 failures → 5 min / 30 min / 24 h. Counters in Redis; attempts recorded in `login_attempts` |
| **SEC-AUTH-05** | Generic login failure message; identical response timing for unknown email vs wrong password (constant-work comparison) |
| **SEC-AUTH-06** | MFA (TOTP) available to all, enforced for Super Admin (D-06); secret encrypted with AES-256-GCM; single-use recovery codes hashed |
| **SEC-AUTH-07** | Password reset: 256-bit token, hashed at rest, 30-min expiry, single use, all sessions revoked on success, no account enumeration |
| **SEC-SESS-01** | Session token: 256 bits from a CSPRNG, stored as SHA-256 only |
| **SEC-SESS-02** | Cookie `__Host-` prefix, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` |
| **SEC-SESS-03** | Session rotated on login, MFA completion and password change; old session revoked atomically |
| **SEC-SESS-04** | Idle 8 h and absolute 7-day expiry, both enforced server-side |
| **SEC-SESS-05** | Session inventory per user; individual and global revocation; revocation on suspension and on password reset |
| **SEC-SESS-06** | CSRF: double-submit token + `Origin`/`Referer` allow-list + `SameSite=Lax`; webhooks exempt and signature-verified instead |

### 6.2 Authorisation

| ID | Control |
|---|---|
| **SEC-AUTHZ-01** | Deny by default. Every route declares `public` or a permission. Startup route audit fails the build otherwise |
| **SEC-AUTHZ-02** | Permissions resolved server-side from the database on each request (cached ≤ 60 s, invalidated on role change) |
| **SEC-AUTHZ-03** | Object-level authorisation: every read/write of a specific entity checks visibility/permission for that entity |
| **SEC-AUTHZ-04** | Mass-assignment protection: request DTOs are explicit allow-lists; `isSuperAdmin`, `status`, `verifiedAt`, `publishedAt`, `amountMinor` and role fields are never bindable from a normal payload |
| **SEC-AUTHZ-05** | Privilege-escalation guard: a role editor cannot grant permissions it does not hold; only Super Admin can create/modify Super Admin |
| **SEC-AUTHZ-06** | At least one active Super Admin always exists; the last one cannot be suspended, deleted or demoted |
| **SEC-AUTHZ-07** | Permission test matrix: every role × every protected endpoint asserted with an automated test (403 vs 200) |
| **SEC-AUTHZ-08** | Financial and truth-sensitive actions (`refund`, `receipt.void`, `impact.verify`, `testimonial.approve`, `donation.export`) are Super Admin only |

### 6.3 Input validation and output encoding

| ID | Control |
|---|---|
| **SEC-VAL-01** | Zod validation on params, query and body at every route; unknown keys rejected |
| **SEC-VAL-02** | Server-side re-derivation of every security-relevant value (amount, status, timestamps, ownership) — never trusted from the client |
| **SEC-VAL-03** | Length, type, range and format limits on every field, including array lengths and nesting depth in JSONB blocks |
| **SEC-VAL-04** | Rich text is stored as structured editor JSON, never raw HTML; rendering uses a strict node allow-list |
| **SEC-VAL-05** | All SQL goes through Prisma or parameterised `$queryRaw`; string concatenation into SQL is forbidden by review and lint |
| **SEC-VAL-06** | Output encoding is React's default; `dangerouslySetInnerHTML` is banned outside a single reviewed JSON-LD component |
| **SEC-VAL-07** | JSON-LD payloads are built from typed objects and serialised safely (escaping `<`), never string-concatenated from user input |
| **SEC-VAL-08** | File names, slugs, menu hrefs and redirect targets are pattern-validated; no path traversal, no protocol-relative URLs, no `javascript:` |
| **SEC-VAL-09** | Unicode normalisation (NFC) and trimming on all text before validation and storage |

### 6.4 Uploads and media

| ID | Control |
|---|---|
| **SEC-FILE-01** | Presigned upload to a private prefix; the API never proxies file bodies |
| **SEC-FILE-02** | Verification of extension, declared MIME, magic bytes and actual decode; size and dimension limits; reject and delete on failure |
| **SEC-FILE-03** | Random storage keys; the original filename is metadata only |
| **SEC-FILE-04** | EXIF stripped (removes GPS); no SVG uploads (script-capable); no archives |
| **SEC-FILE-05** | Public media served from a separate domain/CDN with `Content-Type` from the verified type and `X-Content-Type-Options: nosniff`; private media streamed through an authorised endpoint with `Content-Disposition: attachment` for documents |
| **SEC-FILE-06** | `media_usages` + `ON DELETE RESTRICT` prevents deleting in-use media |
| **SEC-FILE-07** | Orphan purge after 48 h; deletion requires `media.delete` and is audited |

### 6.5 Transport and headers

| ID | Control |
|---|---|
| **SEC-HDR-01** | HTTPS only; HTTP → HTTPS 301 at the edge; HSTS `max-age=63072000; includeSubDomains; preload` (after confirming all subdomains are HTTPS) |
| **SEC-HDR-02** | CSP: `default-src 'self'`, no `unsafe-inline` for scripts (use nonces), `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'none'`, explicit `img-src`/`connect-src` allow-lists for the CDN, storage and analytics |
| **SEC-HDR-03** | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera/microphone/geolocation, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin` |
| **SEC-HDR-04** | CORS: API allows only the configured web origins; credentials allowed only for those origins; no wildcard with credentials |
| **SEC-HDR-05** | Admin responses carry `Cache-Control: private, no-store` and `X-Robots-Tag: noindex` |

### 6.6 Database and data protection

| ID | Control |
|---|---|
| **SEC-DB-01** | Parameterised access only; least-privilege application role (no DDL at runtime); migrations use a separate role |
| **SEC-DB-02** | Column encryption (AES-256-GCM) for donor PAN, address and MFA secrets; keys in the secret store, never in the DB |
| **SEC-DB-03** | IP addresses stored only as salted SHA-256 hashes |
| **SEC-DB-04** | Database not reachable from the public internet; TLS required; IP allow-list for administrative access |
| **SEC-DB-05** | Backups encrypted at rest and in transit; restore access restricted and audited |
| **SEC-DB-06** | No production data in development or staging; synthetic data only |

### 6.7 Payment controls

| ID | Control |
|---|---|
| **SEC-PAY-01** | Mock provider is refused at startup when `NODE_ENV=production`; triple check (env schema, provider registry, DB setting) |
| **SEC-PAY-02** | Provider secrets live only in the secret store; never in the DB, CMS, logs, client bundle or error reports |
| **SEC-PAY-03** | Webhook signature verified over the raw request body before parsing; invalid → `401`, no state change |
| **SEC-PAY-04** | Webhook replay protection via a unique `(provider, provider_event_id)` |
| **SEC-PAY-05** | Amount and currency verified against the stored attempt; mismatch never produces success |
| **SEC-PAY-06** | `SUCCEEDED` reachable only from a verified provider event or a server-side status check; no manual "mark paid" endpoint |
| **SEC-PAY-07** | Receipt issued only after verified success; numbering is gapless and audited; voiding requires Super Admin and a reason |
| **SEC-PAY-08** | No card data ever enters the system; provider-hosted checkout only (PCI DSS SAQ-A scope) |
| **SEC-PAY-09** | Idempotency keys on donation creation and refunds prevent duplicate charges |
| **SEC-PAY-10** | Refund totals cannot exceed the donation amount (database trigger) |
| **SEC-PAY-11** | A kill switch disables online donations immediately without a deploy |
| **SEC-PAY-12** | Live payments stay disabled until the IDFC integration passes sandbox, security, reconciliation and sign-off |

### 6.8 Rate limiting and abuse

| ID | Control |
|---|---|
| **SEC-ABUSE-01** | Redis-backed per-class rate limits (see `API_DESIGN.md` §12) |
| **SEC-ABUSE-02** | Public forms: honeypot + timing + rate limit; CAPTCHA only after repeated failures (accessibility preserved) |
| **SEC-ABUSE-03** | Login and password-reset limits keyed on both IP and account |
| **SEC-ABUSE-04** | WAF rules for common injection/scanner patterns; bot management on `/admin` and `/auth` |
| **SEC-ABUSE-05** | Body size caps, query complexity caps, pagination maximums, request timeouts |
| **SEC-ABUSE-06** | Repeated abuse from an IP feeds a review/blocklist process |

### 6.9 Logging, monitoring and audit

| ID | Control |
|---|---|
| **SEC-LOG-01** | Structured JSON logs with request ID, route, status, duration, actor ID (never email/PAN/cookie/token) |
| **SEC-LOG-02** | Redaction allow-list enforced by a test that asserts each sensitive field is redacted |
| **SEC-LOG-03** | Append-only `audit_log` for authentication events, admin actions, content publishing, permission changes, donation status changes, refunds, receipts and exports |
| **SEC-LOG-04** | Audit entries store a sanitised before/after; never full payment payloads, never secrets |
| **SEC-LOG-05** | Alerts: auth failure spikes, permission-denial spikes, webhook signature failures, payment amount mismatches, backup failures, error-rate spikes, health-check failures |
| **SEC-LOG-06** | Log retention 90 days (hot) with longer retention for audit (24 months) |

### 6.10 Infrastructure and deployment

| ID | Control |
|---|---|
| **SEC-INF-01** | Separate credentials per environment; production credentials unavailable to developers |
| **SEC-INF-02** | Least-privilege IAM for storage and database; no shared root keys |
| **SEC-INF-03** | Container images from a minimal base, non-root user, read-only filesystem where possible, rebuilt monthly |
| **SEC-INF-04** | Origin server not resolvable/accessible except through the edge (Cloudflare Tunnel or origin lock) |
| **SEC-INF-05** | Staging protected by basic auth **and** `noindex`; never publicly indexable |
| **SEC-INF-06** | CI uses short-lived tokens; no long-lived production credentials in CI |
| **SEC-INF-07** | Deployments require review; production deploys require manual approval |
| **SEC-INF-08** | Dependency and secret scanning in CI and nightly; high/critical blocks merge |

---

## 7. Payment-specific controls

### 7.1 Trust model

```text
Browser ──creates──▶ Donation (PENDING) ──intent──▶ Provider checkout
                                                          │
   Browser redirect (UNTRUSTED, informational only) ◀──────┘
                                                          │
   Provider webhook (verified) ──▶ status transition ──▶ Receipt ──▶ Email
   Server status check (fallback)
```

The browser redirect is **never** an input to the state machine. It only tells the UI which reference to poll.

### 7.2 PCI DSS scope

The site is designed to remain in **PCI DSS SAQ-A** scope: all cardholder data is captured on the provider's hosted page; the merchant site is limited to a redirect and a server-to-server notification. Consequences that must be upheld:

- No card-number, CVV, expiry or UPI-PIN field may ever be added to our forms.
- No provider SDK that captures card data may be embedded in our pages without a documented scope reassessment.
- No full provider payload (which may contain masked card data) is stored; only a hash and normalised fields.

### 7.3 IDFC FIRST Bank integration gate

The integration **must not begin** until all of the following exist:

- [ ] Merchant account approved and commercially active
- [ ] Official integration documentation (endpoints, payloads, signature scheme, webhook format)
- [ ] Sandbox credentials and test merchant configuration
- [ ] Confirmed currency, amount unit and rounding rules
- [ ] Confirmed webhook retry policy and expected delivery latency
- [ ] Confirmed refund and settlement reporting process
- [ ] Written confirmation of PCI scope expectation from the bank

Until then, `PAYMENT_PROVIDER=disabled` in production and the adapter stub throws. **No endpoint, header, payload field or signature algorithm is guessed anywhere in the codebase.**

### 7.4 Payment security tests (Phase 9 exit criteria)

| Test | Expected |
|---|---|
| Forged signature | `401`, no state change |
| Valid signature, unknown order | `200`, `UNMATCHED`, alert |
| Valid signature, amount mismatch | `200`, `AMOUNT_MISMATCH`, no success |
| Duplicate event | `200`, exactly one transition |
| Event for an already-`SUCCEEDED` donation | `200`, no change, no second receipt |
| `POST /public/donations` with a negative / zero / fractional / oversized amount | `422` |
| Two concurrent `POST` with the same idempotency key | Exactly one donation |
| Two concurrent webhooks for the same attempt | Exactly one transition |
| Refund exceeding the amount | `409` / trigger rejection |
| Receipt request on a `PENDING` donation | `409 RECEIPT_NOT_ISSUABLE` |
| `PAYMENT_PROVIDER=mock` with `NODE_ENV=production` | Process refuses to start |
| Success page with a fabricated `?ref=` | Shows not-found or pending, never success |

---

## 8. Privacy and DPDP Act 2023

The Digital Personal Data Protection Act, 2023 governs processing of digital personal data in India. The site must be built to support compliance; final legal review is the organisation's responsibility.

### 8.1 Data inventory

| Data element | Purpose | Lawful basis (as understood) | Retention | Class |
|---|---|---|---|---|
| Donor name | Receipt, acknowledgement, identity | Consent + legal obligation (financial record) | Indefinite for financial records | C3 |
| Donor email | Receipt delivery, status updates | Consent | Indefinite (linked to donation record) | C3 |
| Donor phone | Optional contact, payment support | Consent | Indefinite (optional field) | C3 |
| Donor PAN | Receipt/tax documentation only when required | Consent + legal obligation | As required by tax law | C3 (encrypted) |
| Donor address | Receipt when required | Consent + legal obligation | As required by tax law | C3 (encrypted) |
| Donation amount, date, purpose | Financial record, reporting | Legal obligation | Indefinite | C2 |
| Enquiry name/email/phone/message | Responding to the enquiry | Consent | Configurable (default 24 months) | C3 |
| IP address | Abuse prevention, security | Legitimate use / security | 90 days (hashed) | C2 |
| Session and user-agent | Security, session management | Security | Session lifetime + 7 days | C2 |
| Staff account data | Administration | Employment/contract | Until account deletion + audit retention | C2 |
| Analytics events | Measurement | Consent (non-essential cookies) | Per analytics provider, aggregate only | C1/anonymous |

### 8.2 Principles applied

| Principle | Implementation |
|---|---|
| **Lawful purpose and consent** | Every form has an explicit, unbundled consent checkbox with the notice version and a timestamp recorded |
| **Notice** | A plain-language privacy notice at `/privacy-policy`, versioned; the version in force is stored with each consent |
| **Data minimisation** | Only fields actually needed. PAN and address are optional and requested only for receipts. No date of birth, no gender, no unnecessary demographics |
| **Purpose limitation** | Donor contact data is used for donation communication only; it is never added to a marketing list without separate consent |
| **Storage limitation** | Enquiries purged per schedule; analytics aggregated; no indefinite retention of enquiry data |
| **Accuracy** | Admin can correct donation and enquiry records; corrections are audited |
| **Security safeguards** | Encryption in transit and at rest; column encryption for sensitive fields; access control; audit |
| **Rights** | A documented process to handle access, correction and erasure requests, with a contact address published in the privacy notice |
| **Children** | The donation form asks the donor to confirm they are 18+; no child-directed content or data collection |
| **Breach notification** | Defined in §12; the organisation notifies the Data Protection Board of India and affected principals as required |
| **Grievance redressal** | A named contact and response commitment in the privacy notice |

### 8.3 Cookies and consent

| Category | Examples | Consent |
|---|---|---|
| Strictly necessary | Session, CSRF | Not required (essential) |
| Functional | Draft preview token | Not required (no tracking) |
| Analytics | GA4 or a privacy-first alternative | **Required** before any non-essential script loads |
| Marketing | None planned | Not implemented |

A consent banner blocks non-essential scripts until a choice is made; the choice is stored and revocable. Analytics ran without consent is a compliance failure and a launch blocker.

### 8.4 Analytics privacy

- No donor email, name, phone or PAN in any analytics event.
- Donation funnel events are aggregate and parameterised by status only.
- IP anonymisation enabled where the provider supports it.
- Server-side `donation_verified` events use a hashed reference, not personal identifiers.

---

## 9. Secret management and rotation

### 9.1 Inventory

| Secret | Storage | Rotation | Access |
|---|---|---|---|
| `DATABASE_URL` (app role) | Platform secret store | On compromise / 180 days | API + worker runtime |
| `DIRECT_DATABASE_URL` (migration role) | CI secret + operator | On compromise / 180 days | Migration job only |
| `REDIS_URL` | Platform secret store | On compromise | API + worker |
| `SESSION_SECRET` / `CSRF_SECRET` / `REVALIDATE_SECRET` / `PREVIEW_SECRET` | Platform secret store | 90 days and on compromise | API + web (specific keys) |
| `STORAGE_ACCESS_KEY_ID` / `SECRET` | Platform secret store | 90 days | API + worker |
| `MAIL_PASSWORD` / API key | Platform secret store | 180 days | API + worker |
| Column-encryption key | Platform secret store / KMS | 365 days with key-version support | API |
| Provider credentials (future) | Platform secret store | Per bank policy | Payment module only |
| MFA secrets (per user) | Encrypted in DB | On reset | API |

### 9.2 Rules

1. No secret in the repository, ever. `.env` is git-ignored; `.env.example` contains placeholders only.
2. Secret scanning (gitleaks/TruffleHog) runs on every push and in a nightly full-history scan.
3. Secrets are injected at runtime; never baked into an image or a client bundle. A build step fails if a server-only variable is referenced from client code.
4. Rotation is possible without downtime: sessions and signing keys support a short overlap (previous-key verification window).
5. A leaked secret is treated as compromised immediately: rotate, invalidate sessions, review access logs, document in the incident record.
6. No secret is printed in logs, error messages, CI output or support screenshots.

---

## 10. Logging, monitoring and alerting

### 10.1 What is logged

| Event | Level | Fields |
|---|---|---|
| Every request | `info` | requestId, method, route, status, duration, actorId (if any), ipHash |
| Authentication success/failure | `info`/`warn` | actorId or emailHash, reason, ipHash |
| Authorisation denial | `warn` | actorId, route, required permission |
| Validation failure | `info` | route, field paths (no values) |
| Payment webhook received | `info` | provider, eventId, processingStatus |
| Payment signature failure | `error` | provider, ipHash, payloadHash |
| Payment amount mismatch | `error` | attemptId, expected, received |
| Unhandled exception | `error` | requestId, stack (server-side only) |
| Job start/finish/failure | `info`/`error` | jobName, itemsProcessed, duration |
| Slow query / slow request | `warn` | threshold breach |

### 10.2 What is never logged

Passwords (even hashed), session tokens, CSRF tokens, MFA codes, provider secrets, full request bodies for auth/donation routes, card data (never present), donor PAN/address, full email addresses in debug logs, IP addresses in plaintext.

### 10.3 Alert thresholds

| Alert | Condition | Severity |
|---|---|---|
| API error rate | > 2% of requests over 5 min | High |
| `/health/ready` failing | 2 consecutive failures | Critical |
| Webhook signature failures | > 5 in 10 min | Critical |
| Payment amount mismatch | Any occurrence | Critical |
| Stuck donations | > 10 in `PROCESSING` beyond the settlement window | High |
| Failed logins | > 50 in 10 min across the system, or 10 for one account | High |
| Permission denials | > 100 in 10 min for one actor | High |
| Backup failure | Any nightly failure | Critical |
| Queue backlog | > 100 pending jobs for 10 min | Medium |
| Disk/DB storage | > 80% | Medium |
| TLS certificate expiry | < 14 days | Medium |
| Dependency advisory | New high/critical | High |

Alerts route to a monitored channel with an on-call owner named at Phase 12. An alert with no owner is not a control.

---

## 11. Backup, disaster recovery and business continuity

| Item | Value |
|---|---|
| **RPO** | ≤ 15 minutes (continuous WAL / PITR) |
| **RTO** | ≤ 4 hours for a full restore |
| **Database backup** | Nightly full + PITR (7–30 days depending on tier) |
| **Off-site copy** | Nightly encrypted dump to a separate provider/region |
| **Media backup** | Object storage versioning + cross-region replication or periodic sync |
| **Config backup** | Infrastructure-as-code and documented environment variables in the secret store |
| **Restore test** | Quarterly, into an isolated instance, timed and documented |
| **Retention** | 30 days PITR, 12 monthly archives |

### 11.1 Recovery scenarios

| Scenario | Response |
|---|---|
| Accidental content deletion | Soft delete restores it; if purged, restore from the previous nightly |
| Accidental mass publish/unpublish | Revisions + audit log identify the actor and time; restore revisions |
| Database corruption | PITR to the last good point; replay the audit log to identify the delta |
| Region outage | Restore to another region from the off-site backup (documented, slower) |
| Storage bucket deletion | Versioning recovery within the retention window |
| Ransomware/compromise | Isolate, rotate every secret, restore from an immutable backup verified clean, forensic review before re-opening |

---

## 12. Incident response

### 12.1 Severity levels

| Severity | Definition | Response target |
|---|---|---|
| **S1 — Critical** | Confirmed payment fraud, data breach, full outage, defacement | Immediate; all hands; notify organisation leadership |
| **S2 — High** | Partial outage, admin account compromise suspected, webhook failures | Within 1 hour |
| **S3 — Medium** | Single feature broken, spam wave, performance degradation | Within 1 business day |
| **S4 — Low** | Cosmetic or minor issue | Next scheduled release |

### 12.2 Playbook

1. **Detect** — alert, user report, or monitoring.
2. **Contain** — revoke sessions, disable the donation kill switch, block the offending IP range at the WAF, take the affected component offline if necessary. Containment never waits for root-cause analysis.
3. **Assess** — what data, whose, how much, is it still ongoing? Preserve logs and evidence before remediation.
4. **Eradicate** — patch the vulnerability, rotate every potentially exposed secret, remove malicious content.
5. **Recover** — restore service, verify integrity (especially financial data), monitor for recurrence.
6. **Notify** — the organisation decides on user and regulator notification. For a personal-data breach, the DPDP obligation is notification to the Data Protection Board of India and to affected data principals; the technical team provides the facts needed.
7. **Review** — a blameless post-incident report within 5 business days: timeline, impact, root cause, what worked, action items with owners and dates.

### 12.3 Specific playbooks to write before launch

- Payment discrepancy or suspected fraud
- Admin account compromise
- Data breach / donor list exposure
- Site defacement
- Ransomware / infrastructure compromise
- Third-party provider outage (payments, email, storage)
- Certificate expiry / DNS failure

---

## 13. Secure development lifecycle

| Stage | Practice |
|---|---|
| **Requirements** | Security and privacy requirements captured in this document and each phase's acceptance criteria |
| **Design** | Threat model per phase for new surfaces; this document updated when a design changes |
| **Build** | Linting with security rules, strict TypeScript, code review by a second person for anything touching auth, payments, uploads or permissions |
| **Test** | Unit + integration + E2E; permission matrix; payment edge cases; upload abuse cases; dependency scan; secret scan |
| **Release** | Security checklist per phase; manual approval for production; post-deploy smoke checks |
| **Operate** | Monitoring, alerting, patch cadence, quarterly access review, quarterly restore test |
| **Retire** | Data retention purge, credential revocation, documented handover |

### 13.1 Code review security checklist (per pull request touching sensitive areas)

- [ ] New route declares `public` or a permission
- [ ] Object-level authorisation, not just route-level
- [ ] All inputs validated with Zod; unknown keys rejected
- [ ] No new raw SQL without parameters
- [ ] No new `dangerouslySetInnerHTML`
- [ ] No secret, token or PII in logs or error messages
- [ ] Money handled in minor units, server-derived
- [ ] State transitions use the defined state machine
- [ ] New external dependency justified and reviewed
- [ ] Tests cover the denial path, not only the success path

### 13.2 Patch cadence

| Severity | Patch within |
|---|---|
| Critical (exploited in the wild) | 24 hours |
| High | 7 days |
| Medium | 30 days |
| Low | Next release |
| Base images / runtime | Monthly rebuild |

---

## 14. Security testing plan

| Type | Tooling | Phase | Gate |
|---|---|---|---|
| SAST | ESLint security plugin, `tsc --strict`, Semgrep rules for banned patterns | 2, 11 | No new high findings |
| Dependency scanning | `pnpm audit`, Dependabot/Renovate | 2, 11 | No high/critical unfixed |
| Secret scanning | gitleaks (pre-commit + CI + nightly) | 2, 11 | Zero findings |
| DAST (light) | OWASP ZAP baseline against staging | 11 | No high findings |
| Authorization matrix | Custom test suite over the route audit | 7, 11 | 100% of protected routes |
| Payment edge cases | Integration suite with a controllable mock provider | 9 | All §7.4 cases pass |
| Upload abuse | Integration suite with malformed, oversized and mislabelled files | 6, 11 | All rejected |
| Accessibility | axe-core in CI + manual keyboard/screen-reader pass | 3, 11 | No critical violations |
| Penetration test (optional) | External, before launch, if budget allows **⏳ D-16** | 11 | Findings triaged; no open critical/high |
| Backup restore drill | Timed restore into an isolated instance | 11 | Restore < RTO |

---

## 15. Risk register

**Scoring:** Likelihood (L) and Impact (I) on 1–5. Score = L × I. Rating: **Critical** ≥ 20, **High** 12–19, **Medium** 6–11, **Low** ≤ 5.
**Residual** is the rating expected after the listed mitigation is implemented and verified.
**Status:** Open · Mitigated (control in place and verified) · Accepted (risk consciously retained) · Transferred (to a provider).

### 15.1 Financial and payment risks

| ID | Risk | L | I | Score | Rating | Mitigation | Residual | Phase | Owner | Status |
|---|---|:-:|:-:|:-:|---|---|:-:|---|---|---|
| **R-01** | A donation is shown as successful without a verified payment (fake receipt, false trust) | 3 | 5 | 15 | High | Server-verified status only (`SEC-PAY-06`); success page reads server state; `CHECK` constraint requiring a verification source; no manual "mark paid" endpoint | 4 (Low) | 9 | Backend | Open |
| **R-02** | Forged webhook marks a donation paid | 3 | 5 | 15 | High | Signature verification over raw bytes before parsing (`SEC-PAY-03`); invalid → `401`; alerting | 4 (Low) | 9 | Backend | Open |
| **R-03** | Replayed or duplicated webhook applies a transition twice (double receipt, double email) | 3 | 4 | 12 | High | Unique `(provider, provider_event_id)`; idempotent transitions (`SEC-PAY-04`); one receipt per donation | 3 (Low) | 9 | Backend | Open |
| **R-04** | Amount tampering at checkout (client sends ₹1 instead of ₹1,001) | 3 | 5 | 15 | High | Server validates and snapshots the amount; provider amount compared on the way back (`SEC-PAY-05`) | 3 (Low) | 9 | Backend | Open |
| **R-05** | Mock provider accidentally enabled in production, creating fake donations | 2 | 5 | 10 | Medium | Triple startup guard (`SEC-PAY-01`); production config review in the launch checklist | 2 (Low) | 9, 12 | DevOps | Open |
| **R-06** | Refund abuse or refund exceeding the donation | 2 | 4 | 8 | Medium | Super Admin only; reason required; database trigger caps totals (`SEC-PAY-10`); audited | 2 (Low) | 9 | Backend | Open |
| **R-07** | Payment provider secrets leak (repo, logs, client bundle) | 2 | 5 | 10 | Medium | Secret store only; build-time client-bundle check; secret scanning; no credential field in the CMS (`SEC-PAY-02`) | 2 (Low) | 2, 9 | DevOps | Open |
| **R-08** | Donation record or receipt leaks another donor's personal data | 3 | 4 | 12 | High | Authorised access only; tokenised receipt links; no PII in the public status endpoint; `no-store` (A18, A19) | 3 (Low) | 9 | Backend | Open |

### 15.2 Access control risks

| ID | Risk | L | I | Score | Rating | Mitigation | Residual | Phase | Owner | Status |
|---|---|:-:|:-:|:-:|---|---|:-:|---|---|---|
| **R-09** | Privilege escalation — an editor grants themselves or others higher permissions | 3 | 5 | 15 | High | Privilege-escalation guard (`SEC-AUTHZ-05`); Super Admin-only role management; allow-listed DTOs; audited | 4 (Low) | 7 | Backend | Open |
| **R-10** | IDOR — one staff member reads or modifies records outside their role | 3 | 4 | 12 | High | Object-level authorisation (`SEC-AUTHZ-03`); permission matrix tests (`SEC-AUTHZ-07`) | 4 (Low) | 7 | Backend | Open |
| **R-11** | Missing authorisation on a new endpoint (silent hole) | 4 | 5 | 20 | **Critical** | Deny-by-default route audit that fails the build; mandatory permission declaration; CI-enforced (`SEC-AUTHZ-01`) | 3 (Low) | 2, 7 | Backend | Open |
| **R-12** | Last Super Admin is removed, locking the organisation out | 2 | 4 | 8 | Medium | Guard preventing the last Super Admin's suspension/deletion/demotion (`SEC-AUTHZ-06`) | 2 (Low) | 7 | Backend | Open |
| **R-13** | Session hijacking via stolen cookie | 3 | 5 | 15 | High | HttpOnly/Secure/SameSite (`SEC-SESS-02`); rotation (`SEC-SESS-03`); short idle timeout; session inventory and revocation; anomaly alerting | 4 (Low) | 7 | Backend | Open |
| **R-14** | Credential stuffing / brute force against admin login | 4 | 4 | 16 | High | Argon2id; progressive lockout; per-IP + per-account limits; MFA enforced for Super Admin; WAF bot management | 8 (Medium) | 7 | Backend | Open |
| **R-15** | CSRF forces an authenticated admin to perform an action | 2 | 4 | 8 | Medium | Double-submit token + `SameSite=Lax` + `Origin` allow-list (`SEC-SESS-06`) | 2 (Low) | 7 | Backend | Open |
| **R-16** | Compromised admin session persists after the user is suspended | 3 | 4 | 12 | High | Session revocation on suspension/password change; global revoke endpoint (`SEC-SESS-05`) | 3 (Low) | 7 | Backend | Open |

### 15.3 Content and data integrity risks

| ID | Risk | L | I | Score | Rating | Mitigation | Residual | Phase | Owner | Status |
|---|---|:-:|:-:|:-:|---|---|:-:|---|---|---|
| **R-17** | Stored XSS via rich-text content compromises every admin viewer | 3 | 5 | 15 | High | Structured editor JSON, never HTML; strict renderer allow-list; CSP with nonces; no `dangerouslySetInnerHTML` (`SEC-VAL-04`, `SEC-VAL-06`) | 4 (Low) | 6 | Full-stack | Open |
| **R-18** | Unverified or fabricated impact numbers/testimonials published | 3 | 4 | 12 | High | Verification gates with database constraints (`impact`, `testimonials`); Super Admin-only approval; no seeded metrics | 3 (Low) | 6 | Backend | Open |
| **R-19** | Draft or scheduled content exposed before its publish time | 3 | 3 | 9 | Medium | Repository-level published filter; signed single-use preview tokens; E2E test asserting a draft 404s publicly | 3 (Low) | 6 | Backend | Open |
| **R-20** | Malicious file upload executed or served as active content | 3 | 5 | 15 | High | Multi-layer validation, magic bytes, decode, random keys, no SVG, separate media domain, `nosniff` (`SEC-FILE-02`, `SEC-FILE-05`) | 3 (Low) | 6 | Backend | Open |
| **R-21** | Deleting media breaks live pages | 3 | 3 | 9 | Medium | `media_usages` + `ON DELETE RESTRICT`; replace-instead-of-delete flow (`SEC-FILE-06`) | 2 (Low) | 6 | Backend | Open |
| **R-22** | Malicious or accidental redirect creates an open redirect / phishing vector | 2 | 3 | 6 | Medium | Redirect targets site-relative only; loop/chain/conflict validation on write (`SEC-VAL-08`) | 2 (Low) | 6 | Backend | Open |
| **R-23** | Audit log tampering destroys accountability | 2 | 4 | 8 | Medium | Append-only triggers; restricted DB role; monthly review; optional external log sink | 2 (Low) | 7 | DevOps | Open |

### 15.4 Privacy and data protection risks

| ID | Risk | L | I | Score | Rating | Mitigation | Residual | Phase | Owner | Status |
|---|---|:-:|:-:|:-:|---|---|:-:|---|---|---|
| **R-24** | Donor or enquirer personal data exposed in logs or error reports | 3 | 4 | 12 | High | Redaction allow-list + assertion test (`SEC-LOG-02`); no PII in error messages; Sentry `beforeSend` scrubbing | 3 (Low) | 2, 11 | Backend | Open |
| **R-25** | Excessive retention of personal data (DPDP non-compliance) | 3 | 3 | 9 | Medium | Retention schedules and purge jobs; configurable enquiry retention; documented erasure process (§8) | 6 (Medium) | 9, 11 | Backend | Open |
| **R-26** | Analytics or third-party script collects data before consent | 3 | 3 | 9 | Medium | Consent-gated script loading; no analytics without consent; minimal third-party scripts | 2 (Low) | 11 | Frontend | Open |
| **R-27** | Backup data exposed or unencrypted | 2 | 5 | 10 | Medium | Private encrypted buckets; separate credentials; access audited; restore test (`SEC-DB-05`) | 2 (Low) | 12 | DevOps | Open |
| **R-28** | Over-broad export of donor data by an insider | 2 | 4 | 8 | Medium | Super Admin only; rate-limited; audited with filters and row counts; expiring links (A5) | 2 (Low) | 9 | Backend | Open |

### 15.5 Availability and operational risks

| ID | Risk | L | I | Score | Rating | Mitigation | Residual | Phase | Owner | Status |
|---|---|:-:|:-:|:-:|---|---|:-:|---|---|---|
| **R-29** | Denial of service on the donation path during a campaign | 3 | 4 | 12 | High | WAF + DDoS protection; rate limits; CDN caching of public pages; tuned timeouts; graceful degradation | 3 (Low) | 11, 12 | DevOps | Open |
| **R-30** | Form spam floods the enquiry inbox | 4 | 2 | 8 | Medium | Honeypot, timing, rate limits, CAPTCHA escalation, spam scoring (`SEC-ABUSE-02`) | 2 (Low) | 6 | Backend | Open |
| **R-31** | Database failure or data loss with no usable backup | 2 | 5 | 10 | Medium | Managed PITR; nightly off-site; quarterly restore test (§11) | 2 (Low) | 12 | DevOps | Open |
| **R-32** | Security patches not applied to dependencies/base images | 3 | 4 | 12 | High | Automated dependency PRs; CI audit gate; monthly rebuild; patch cadence (§13.2) | 8 (Medium) | 2, 11 | DevOps | Open |
| **R-33** | Supply-chain compromise of a dependency | 2 | 5 | 10 | Medium | Lockfile integrity; dependency review; no untrusted postinstall; minimal dependency count | 2 (Low) | 2, 11 | DevOps | Open |
| **R-34** | Misconfiguration exposes staging or an admin path to the public | 3 | 3 | 9 | Medium | Staging basic auth + `noindex`; admin `noindex` + WAF; launch configuration review | 2 (Low) | 12 | DevOps | Open |
| **R-35** | TLS/certificate or DNS failure takes the site offline | 2 | 4 | 8 | Medium | Managed certificates with auto-renewal; expiry alerts at 14 days; DNS provider with 2FA | 2 (Low) | 12 | DevOps | Open |

### 15.6 Governance and people risks

| ID | Risk | L | I | Score | Rating | Mitigation | Residual | Phase | Owner | Status |
|---|---|:-:|:-:|:-:|---|---|:-:|---|---|---|
| **R-36** | Shared admin accounts destroy accountability | 3 | 3 | 9 | Medium | Invitation-only individual accounts; no shared credentials; audit per user | 2 (Low) | 7 | Organisation | Open |
| **R-37** | Staff accounts left active after someone leaves | 3 | 4 | 12 | High | Offboarding checklist; quarterly access review; session revocation; audit of dormant accounts | 8 (Medium) | 12 | Organisation | Open |
| **R-38** | Phishing of an admin user grants content-publish access | 3 | 4 | 12 | High | MFA; training; DMARC/SPF/DKIM to reduce spoofing; short sessions | 3 (Low) | 7, 12 | Organisation | Open |
| **R-39** | No one owns security after handover | 3 | 4 | 12 | High | Named technical owner in the handover document; documented runbooks; monitoring with an on-call owner | 8 (Medium) | 12 | Organisation | Open |

### 15.7 Risk summary

| Rating | Count (initial) | Count (residual) |
|---|:-:|:-:|
| Critical | 1 | 0 |
| High | 19 | 0 |
| Medium | 19 | 5 |
| Low | 0 | 34 |
| **Total** | **39** | **39** |

The single initial Critical risk (R-11) is architectural rather than behavioural and is eliminated by the build-failing route audit. Five residual Medium risks — R-14 (credential stuffing), R-25 (retention discipline), R-32 (patch cadence), R-37 (account offboarding) and R-39 (post-handover ownership) — cannot be reduced by code alone; they depend on ongoing operational discipline and are reviewed quarterly.

---

## 16. Pre-launch security checklist

Nothing below may be waived without a written, dated acceptance by the organisation.

### Authentication and access

- [ ] Argon2id parameters benchmarked and recorded
- [ ] MFA enforced for Super Admin
- [ ] Lockout thresholds and rate limits verified in staging
- [ ] Every protected route declares a permission (route audit green)
- [ ] Permission matrix test suite passes for all roles and endpoints
- [ ] Last-Super-Admin guard verified
- [ ] Privilege-escalation guard verified
- [ ] Session revocation tested (single and global)
- [ ] Password reset flow tested end-to-end, including token reuse rejection

### Data and cryptography

- [ ] TLS 1.2+ only, HSTS enabled, no mixed content
- [ ] CSP enforced with no critical violations
- [ ] Security headers verified on every route
- [ ] PAN/address/MFA column encryption verified by a decrypt round-trip test
- [ ] IP hashing verified; no plaintext IPs stored
- [ ] No PII in logs (redaction test green)
- [ ] Secrets absent from the repo, images and client bundle
- [ ] Secret scanning green across full history

### Payments

- [ ] `PAYMENT_PROVIDER=disabled` in production at launch
- [ ] Mock provider cannot start in production
- [ ] Forged/mismatched/replayed webhook tests pass
- [ ] Success page shows success only after server verification
- [ ] Receipt issuance blocked for unverified donations
- [ ] Refund cap trigger verified
- [ ] Kill switch tested
- [ ] IDFC integration deferred with a documented gate

### Application

- [ ] Input validation on every endpoint (contract tests)
- [ ] Upload abuse tests pass (wrong type, oversized, mislabelled, zip bomb, SVG)
- [ ] No `dangerouslySetInnerHTML` outside the single JSON-LD component
- [ ] No raw SQL without parameters
- [ ] Error responses leak no internals
- [ ] Public endpoints return no unpublished content or PII
- [ ] CSRF verified on all mutation routes
- [ ] Open redirect blocked
- [ ] Draft/preview access requires a valid signed token

### Operations

- [ ] Dependency audit clean (no open high/critical)
- [ ] DAST baseline: no high findings
- [ ] Backups configured, encrypted, off-site
- [ ] Restore drill completed and timed
- [ ] Monitoring and alerting live with named owners
- [ ] Incident response runbooks written
- [ ] Staging protected (basic auth + noindex)
- [ ] Audit log verified append-only
- [ ] Privacy notice, terms and refund policy published and approved
- [ ] Consent banner blocks analytics until consent
- [ ] Analytics contains no personal data

---

## 17. Open items

| # | Item | Owner | Needed by |
|---|---|---|---|
| **D-06** | Confirm MFA enforcement scope (recommended: mandatory for Super Admin, optional for others) | Organisation | Phase 7 |
| **D-09** | Choose the transactional email provider and sender domain (SPF/DKIM/DMARC setup) | Organisation | Phase 7 |
| **D-10** | Choose the error-tracking and log-aggregation provider | Organisation | Phase 2 |
| **D-16** | Decide whether to commission an external penetration test before launch | Organisation | Phase 11 |
| **SEC-O1** | Who is the named security owner after handover? | Organisation | Phase 12 |
| **SEC-O2** | What is the committed breach-notification contact and legal adviser? | Organisation | Phase 12 |
| **SEC-O3** | Confirm the enquiry retention default (24 months proposed) | Organisation | Phase 8 |
| **SEC-O4** | Confirm the acceptable-use and offboarding policy for staff accounts | Organisation | Phase 12 |
| **SEC-O5** | Confirm the data-erasure procedure with the organisation's legal adviser (financial records retention vs erasure rights) | Organisation | Phase 11 |
