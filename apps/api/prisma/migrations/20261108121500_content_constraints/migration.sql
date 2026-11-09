-- Content constraints that Prisma's schema language cannot express.
--
-- Same policy as 20261106054924_identity_constraints: these rules exist so a bug
-- in application code cannot persist a state the domain considers impossible
-- (docs/DATABASE_DESIGN.md §10). This file is written by hand and reviewed like
-- code; Prisma never generates or rewrites it.
--
-- The most important rules here are the publishing and evidence gates: public
-- endpoints rely on them, so a missing application check cannot leak a draft or
-- publish an unverified figure.
--
-- WORKFLOW NOTE — read before running `prisma migrate dev`.
-- Prisma's differ does not model CHECK constraints or partial indexes, so those
-- are ignored. It *does* model foreign keys, and the 20 constraints in section 12
-- are added here rather than in schema.prisma on purpose (they would require a
-- dozen extra named relations). A generated migration may therefore propose
-- `ALTER TABLE … DROP CONSTRAINT "…_fk"`. That statement must be discarded: the
-- constraints are required, and `apps/api/tests/integration/content-schema.test.ts`
-- asserts that all 20 still exist. Apply reviewed migrations with
-- `prisma migrate deploy`, not `migrate dev`.

-- ---------------------------------------------------------------------------
-- 1. Slugs: unique among live rows, case-insensitively.
--    A draft and a published row share the slug space, so a redirect can never
--    be ambiguous. Soft-deleted rows release their slug.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX "pages_slug_live_uniq" ON "pages" (lower("slug")) WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "activities_slug_live_uniq" ON "activities" (lower("slug")) WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "news_posts_slug_live_uniq" ON "news_posts" (lower("slug")) WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "events_slug_live_uniq" ON "events" (lower("slug")) WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "campaigns_slug_live_uniq" ON "campaigns" (lower("slug")) WHERE "deleted_at" IS NULL;

-- Slugs are URL path segments: lowercase, hyphen-separated, no surprises.
ALTER TABLE "pages" ADD CONSTRAINT "pages_slug_format"
  CHECK ("slug" = '' OR "slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "activities" ADD CONSTRAINT "activities_slug_format"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_slug_format"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "events" ADD CONSTRAINT "events_slug_format"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_slug_format"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "news_categories" ADD CONSTRAINT "news_categories_slug_format"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "media_categories" ADD CONSTRAINT "media_categories_slug_format"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- ---------------------------------------------------------------------------
-- 2. Pages: exactly one homepage, and it owns the empty slug (`/`).
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX "pages_single_homepage" ON "pages" ("kind")
  WHERE "kind" = 'HOMEPAGE' AND "deleted_at" IS NULL;

ALTER TABLE "pages" ADD CONSTRAINT "pages_homepage_slug_empty"
  CHECK ("kind" <> 'HOMEPAGE' OR "slug" = '');

-- ---------------------------------------------------------------------------
-- 3. Publishing lifecycle, applied uniformly to every publishing entity.
--    - PUBLISHED requires a publication timestamp.
--    - SCHEDULED requires a future-publication timestamp and is not yet live.
--    - ARCHIVED/DRAFT carry no publication claim.
--    A scheduled row that also has published_at would be visible through the
--    public predicate, so the database forbids it outright.
-- ---------------------------------------------------------------------------
ALTER TABLE "pages" ADD CONSTRAINT "pages_status_published_requires_at"
  CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);
ALTER TABLE "pages" ADD CONSTRAINT "pages_status_scheduled_requires_for"
  CHECK ("status" <> 'SCHEDULED' OR "scheduled_for" IS NOT NULL);
ALTER TABLE "pages" ADD CONSTRAINT "pages_scheduled_not_yet_published"
  CHECK ("status" <> 'SCHEDULED' OR "published_at" IS NULL);

ALTER TABLE "activities" ADD CONSTRAINT "activities_status_published_requires_at"
  CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);
ALTER TABLE "activities" ADD CONSTRAINT "activities_status_scheduled_requires_for"
  CHECK ("status" <> 'SCHEDULED' OR "scheduled_for" IS NOT NULL);
ALTER TABLE "activities" ADD CONSTRAINT "activities_scheduled_not_yet_published"
  CHECK ("status" <> 'SCHEDULED' OR "published_at" IS NULL);

ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_status_published_requires_at"
  CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_status_scheduled_requires_for"
  CHECK ("status" <> 'SCHEDULED' OR "scheduled_for" IS NOT NULL);
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_scheduled_not_yet_published"
  CHECK ("status" <> 'SCHEDULED' OR "published_at" IS NULL);

ALTER TABLE "events" ADD CONSTRAINT "events_status_published_requires_at"
  CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);
ALTER TABLE "events" ADD CONSTRAINT "events_status_scheduled_requires_for"
  CHECK ("status" <> 'SCHEDULED' OR "scheduled_for" IS NOT NULL);
ALTER TABLE "events" ADD CONSTRAINT "events_scheduled_not_yet_published"
  CHECK ("status" <> 'SCHEDULED' OR "published_at" IS NULL);

ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_status_published_requires_at"
  CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_status_scheduled_requires_for"
  CHECK ("status" <> 'SCHEDULED' OR "scheduled_for" IS NOT NULL);
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_scheduled_not_yet_published"
  CHECK ("status" <> 'SCHEDULED' OR "published_at" IS NULL);

ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_status_published_requires_at"
  CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);

-- ---------------------------------------------------------------------------
-- 4. Revisions are immutable and only one revision can be live per entity.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX "revisions_one_published" ON "revisions" ("entity_type", "entity_id")
  WHERE "status" = 'PUBLISHED';

ALTER TABLE "revisions" ADD CONSTRAINT "revisions_version_positive"
  CHECK ("version" >= 1);
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_published_requires_at"
  CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);

CREATE OR REPLACE FUNCTION "revisions_snapshot_immutable"() RETURNS trigger AS $$
BEGIN
  IF NEW."snapshot" IS DISTINCT FROM OLD."snapshot" THEN
    RAISE EXCEPTION 'revisions.snapshot is immutable (revision %)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "revisions_snapshot_immutable_trigger"
  BEFORE UPDATE ON "revisions"
  FOR EACH ROW EXECUTE FUNCTION "revisions_snapshot_immutable"();

-- ---------------------------------------------------------------------------
-- 5. Sections: deterministic ordering and a JSON object body.
-- ---------------------------------------------------------------------------
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_content_is_object"
  CHECK (jsonb_typeof("content") = 'object');
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_sort_order_non_negative"
  CHECK ("sort_order" >= 0);

-- ---------------------------------------------------------------------------
-- 6. Events: time order, capacity, and a registration URL when required.
-- ---------------------------------------------------------------------------
ALTER TABLE "events" ADD CONSTRAINT "events_time_order"
  CHECK ("end_at" IS NULL OR "end_at" >= "start_at");
ALTER TABLE "events" ADD CONSTRAINT "events_capacity_positive"
  CHECK ("capacity" IS NULL OR "capacity" > 0);
ALTER TABLE "events" ADD CONSTRAINT "events_external_url_required"
  CHECK ("registration_mode" <> 'EXTERNAL_URL' OR "registration_url" IS NOT NULL);

-- ---------------------------------------------------------------------------
-- 7. Campaigns: a manual total cannot exist without a stated reason, and only
--    one campaign is featured on the homepage at a time.
-- ---------------------------------------------------------------------------
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_target_positive"
  CHECK ("target_amount_minor" IS NULL OR "target_amount_minor" > 0);
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_manual_raised_non_negative"
  CHECK ("manual_raised_minor" IS NULL OR "manual_raised_minor" >= 0);
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_manual_requires_evidence"
  CHECK (
    "progress_source" <> 'MANUAL'
    OR (
      "manual_raised_minor" IS NOT NULL
      AND "manual_raised_note" IS NOT NULL
      AND char_length(btrim("manual_raised_note")) > 0
    )
  );
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_raised_sanity_ceiling"
  CHECK (
    "target_amount_minor" IS NULL
    OR "manual_raised_minor" IS NULL
    OR "manual_raised_minor" <= "target_amount_minor" * 10
  );
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_date_order"
  CHECK ("end_date" IS NULL OR "end_date" >= "start_date");

CREATE UNIQUE INDEX "campaigns_one_featured" ON "campaigns" ("is_featured")
  WHERE "is_featured" AND "deleted_at" IS NULL;

-- ---------------------------------------------------------------------------
-- 8. Impact figures: VERIFIED requires a verifier, a timestamp and a
--    methodology. This is the truthfulness gate, enforced in the database.
-- ---------------------------------------------------------------------------
ALTER TABLE "impact_stats" ADD CONSTRAINT "impact_verified_requires_evidence"
  CHECK (
    "verification_status" <> 'VERIFIED'
    OR (
      "verified_by" IS NOT NULL
      AND "verified_at" IS NOT NULL
      AND char_length(btrim("methodology")) > 0
    )
  );
ALTER TABLE "impact_stats" ADD CONSTRAINT "impact_methodology_present"
  CHECK (char_length(btrim("methodology")) > 0);
ALTER TABLE "impact_stats" ADD CONSTRAINT "impact_value_non_negative"
  CHECK ("value" >= 0);
ALTER TABLE "impact_stats" ADD CONSTRAINT "impact_display_order_non_negative"
  CHECK ("display_order" >= 0);

-- ---------------------------------------------------------------------------
-- 9. Testimonials: APPROVED requires consent evidence and an approver.
-- ---------------------------------------------------------------------------
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_approved_requires_consent"
  CHECK (
    "approval_status" <> 'APPROVED'
    OR (
      "approved_by" IS NOT NULL
      AND "approved_at" IS NOT NULL
      AND char_length(btrim("consent_evidence")) > 0
    )
  );
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_body_present"
  CHECK (char_length(btrim("body")) BETWEEN 1 AND 2000);
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_display_name_present"
  CHECK (char_length(btrim("display_name")) BETWEEN 1 AND 120);

-- ---------------------------------------------------------------------------
-- 10. Media metadata.
-- ---------------------------------------------------------------------------
ALTER TABLE "media" ADD CONSTRAINT "media_size_positive"
  CHECK ("size_bytes" > 0);
ALTER TABLE "media" ADD CONSTRAINT "media_checksum_format"
  CHECK ("checksum_sha256" ~ '^[0-9a-f]{64}$');
-- Storage keys are generated by the application; refusing traversal sequences
-- and spaces keeps a bad key from ever being addressed by a provider URL.
ALTER TABLE "media" ADD CONSTRAINT "media_storage_key_format"
  CHECK ("storage_key" ~ '^[A-Za-z0-9][A-Za-z0-9/_.-]*$' AND "storage_key" NOT LIKE '%..%');
ALTER TABLE "media" ADD CONSTRAINT "media_focal_bounds"
  CHECK (
    ("focal_x" IS NULL OR ("focal_x" >= 0 AND "focal_x" <= 1))
    AND ("focal_y" IS NULL OR ("focal_y" >= 0 AND "focal_y" <= 1))
  );

-- ---------------------------------------------------------------------------
-- 11. Enquiries: length bounds and a lowercase email, matching users.email.
-- ---------------------------------------------------------------------------
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_email_lowercase"
  CHECK ("email" = lower("email"));
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_message_length"
  CHECK (char_length("message") BETWEEN 10 AND 5000);
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_name_length"
  CHECK (char_length(btrim("name")) BETWEEN 1 AND 120);
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_consent_version_present"
  CHECK (char_length(btrim("consent_version")) > 0);
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_reference_format"
  CHECK ("reference" ~ '^ENQ-[0-9]{4}-[0-9]{5,}$');

-- ---------------------------------------------------------------------------
-- 12. Foreign keys that Prisma cannot express through the schema file.
--
--     `current_revision_id` points at the shared polymorphic `revisions` table,
--     and `created_by`/`updated_by`/`og_image_id` are kept as plain UUID columns
--     so the Prisma client surface stays readable. The database still enforces
--     all of them here.
-- ---------------------------------------------------------------------------
ALTER TABLE "pages" ADD CONSTRAINT "pages_current_revision_fk"
  FOREIGN KEY ("current_revision_id") REFERENCES "revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_current_revision_fk"
  FOREIGN KEY ("current_revision_id") REFERENCES "revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_current_revision_fk"
  FOREIGN KEY ("current_revision_id") REFERENCES "revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_current_revision_fk"
  FOREIGN KEY ("current_revision_id") REFERENCES "revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_current_revision_fk"
  FOREIGN KEY ("current_revision_id") REFERENCES "revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pages" ADD CONSTRAINT "pages_og_image_fk"
  FOREIGN KEY ("og_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_og_image_fk"
  FOREIGN KEY ("og_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_og_image_fk"
  FOREIGN KEY ("og_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_og_image_fk"
  FOREIGN KEY ("og_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_og_image_fk"
  FOREIGN KEY ("og_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pages" ADD CONSTRAINT "pages_created_by_fk"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pages" ADD CONSTRAINT "pages_updated_by_fk"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_fk"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_updated_by_fk"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_created_by_fk"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_updated_by_fk"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fk"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_updated_by_fk"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_fk"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_updated_by_fk"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Supporting indexes for the foreign keys above (PostgreSQL does not create
-- them automatically, and they are needed when a user or media row is deleted).
CREATE INDEX "pages_current_revision_id_idx" ON "pages" ("current_revision_id")
  WHERE "current_revision_id" IS NOT NULL;
CREATE INDEX "activities_current_revision_id_idx" ON "activities" ("current_revision_id")
  WHERE "current_revision_id" IS NOT NULL;
CREATE INDEX "news_posts_current_revision_id_idx" ON "news_posts" ("current_revision_id")
  WHERE "current_revision_id" IS NOT NULL;
CREATE INDEX "events_current_revision_id_idx" ON "events" ("current_revision_id")
  WHERE "current_revision_id" IS NOT NULL;
CREATE INDEX "campaigns_current_revision_id_idx" ON "campaigns" ("current_revision_id")
  WHERE "current_revision_id" IS NOT NULL;
