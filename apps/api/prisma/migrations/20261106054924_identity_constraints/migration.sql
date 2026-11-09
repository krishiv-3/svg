-- Identity constraints that Prisma's schema language cannot express.
--
-- These rules exist so a bug in application code cannot persist data the domain
-- considers impossible (docs/DATABASE_DESIGN.md §10). They are written by hand
-- and reviewed like code; Prisma never generates or rewrites this file.

-- 1. Emails are stored exactly as they are compared: lowercase.
--    Case-insensitive uniqueness without a citext extension or a functional
--    index, and no chance of two accounts differing only by case.
ALTER TABLE "users"
  ADD CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email"));

-- 2. A name must contain something meaningful.
ALTER TABLE "users"
  ADD CONSTRAINT "users_name_length" CHECK (char_length(btrim("name")) BETWEEN 1 AND 120);

-- 3. An active account must have a password. This prevents an account from being
--    activated without going through the invitation/password flow (Phase 7).
ALTER TABLE "users"
  ADD CONSTRAINT "users_active_requires_password"
  CHECK ("status" <> 'ACTIVE' OR "password_hash" IS NOT NULL);

-- 4. Role keys are machine identifiers, referenced from code.
ALTER TABLE "roles"
  ADD CONSTRAINT "roles_key_format" CHECK ("key" ~ '^[a-z][a-z0-9_]*$');

-- 5. Permission keys follow `resource.action`, with an optional dotted resource
--    group (e.g. `settings.donation.update`).
ALTER TABLE "permissions"
  ADD CONSTRAINT "permissions_key_format"
  CHECK ("key" ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$');

-- 6. Settings values are always JSON objects, never scalars or arrays, so the
--    typed per-group schema in the API can rely on a stable shape.
ALTER TABLE "settings"
  ADD CONSTRAINT "settings_value_is_object" CHECK (jsonb_typeof("value") = 'object');

-- 7. An override without a reason is unauditable and therefore not allowed.
ALTER TABLE "user_permissions"
  ADD CONSTRAINT "user_permissions_reason_required"
  CHECK (char_length(btrim("reason")) > 0);
