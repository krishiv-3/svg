-- CreateEnum
CREATE TYPE "content_status" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "page_kind" AS ENUM ('STANDARD', 'HOMEPAGE', 'POLICY');

-- CreateEnum
CREATE TYPE "page_template" AS ENUM ('GENERIC', 'HOMEPAGE', 'CONTACT');

-- CreateEnum
CREATE TYPE "revision_entity" AS ENUM ('PAGE', 'ACTIVITY', 'NEWS', 'EVENT', 'CAMPAIGN', 'IMPACT', 'TESTIMONIAL', 'SETTING');

-- CreateEnum
CREATE TYPE "revision_status" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "event_status" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "registration_mode" AS ENUM ('NONE', 'CONTACT', 'EXTERNAL_URL', 'ENQUIRY_FORM');

-- CreateEnum
CREATE TYPE "progress_source" AS ENUM ('VERIFIED_DONATIONS', 'MANUAL');

-- CreateEnum
CREATE TYPE "impact_verification_status" AS ENUM ('DRAFT', 'VERIFIED');

-- CreateEnum
CREATE TYPE "testimonial_approval_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "media_kind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "media_status" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "media_category_kind" AS ENUM ('GALLERY', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "enquiry_type" AS ENUM ('CONTACT', 'VOLUNTEER', 'VISIT', 'EVENT_REGISTRATION', 'DONATION_SUPPORT', 'GENERAL');

-- CreateEnum
CREATE TYPE "enquiry_status" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM', 'ARCHIVED');

-- CreateTable
CREATE TABLE "media_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "kind" "media_category_kind" NOT NULL DEFAULT 'GALLERY',
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "media_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "bucket" VARCHAR(80) NOT NULL DEFAULT 'public',
    "original_filename" VARCHAR(300) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum_sha256" CHAR(64) NOT NULL,
    "blurhash" VARCHAR(120),
    "focal_x" DECIMAL(4,3),
    "focal_y" DECIMAL(4,3),
    "alt_text" VARCHAR(300),
    "caption" VARCHAR(400),
    "credit" VARCHAR(200),
    "category_id" UUID,
    "kind" "media_kind" NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "status" "media_status" NOT NULL DEFAULT 'PROCESSING',
    "replaced_at" TIMESTAMPTZ(6),
    "uploaded_by" UUID,
    "captured_at" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "kind" "page_kind" NOT NULL DEFAULT 'STANDARD',
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT,
    "body" JSONB,
    "template" "page_template" NOT NULL DEFAULT 'GENERIC',
    "hero_media_id" UUID,
    "hero_alt" VARCHAR(300),
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "scheduled_for" TIMESTAMPTZ(6),
    "unpublished_at" TIMESTAMPTZ(6),
    "current_revision_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "seo_title" VARCHAR(70),
    "seo_description" VARCHAR(180),
    "canonical_url" TEXT,
    "og_image_id" UUID,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "structured_data" JSONB,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "content" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisions" (
    "id" UUID NOT NULL,
    "entity_type" "revision_entity" NOT NULL,
    "entity_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "revision_status" NOT NULL,
    "snapshot" JSONB NOT NULL,
    "change_note" VARCHAR(300),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),

    CONSTRAINT "revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "short_description" VARCHAR(400) NOT NULL,
    "body" JSONB,
    "category" VARCHAR(60),
    "media_id" UUID,
    "media_alt" VARCHAR(300),
    "activity_date" DATE,
    "location" VARCHAR(200),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "scheduled_for" TIMESTAMPTZ(6),
    "unpublished_at" TIMESTAMPTZ(6),
    "current_revision_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "seo_title" VARCHAR(70),
    "seo_description" VARCHAR(180),
    "canonical_url" TEXT,
    "og_image_id" UUID,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "news_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_posts" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "excerpt" VARCHAR(400) NOT NULL,
    "body" JSONB NOT NULL,
    "cover_media_id" UUID,
    "cover_alt" VARCHAR(300),
    "category_id" UUID,
    "author_user_id" UUID,
    "attribution_name" VARCHAR(120),
    "reading_minutes" INTEGER,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "updated_display_at" TIMESTAMPTZ(6),
    "scheduled_for" TIMESTAMPTZ(6),
    "unpublished_at" TIMESTAMPTZ(6),
    "current_revision_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "seo_title" VARCHAR(70),
    "seo_description" VARCHAR(180),
    "canonical_url" TEXT,
    "og_image_id" UUID,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "description" JSONB NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6),
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    "venue_name" VARCHAR(200),
    "venue_address" TEXT,
    "venue_map_url" TEXT,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "poster_media_id" UUID,
    "event_status" "event_status" NOT NULL DEFAULT 'SCHEDULED',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "registration_mode" "registration_mode" NOT NULL DEFAULT 'NONE',
    "registration_url" TEXT,
    "capacity" INTEGER,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "scheduled_for" TIMESTAMPTZ(6),
    "unpublished_at" TIMESTAMPTZ(6),
    "current_revision_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "seo_title" VARCHAR(70),
    "seo_description" VARCHAR(180),
    "canonical_url" TEXT,
    "og_image_id" UUID,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "purpose_summary" VARCHAR(400) NOT NULL,
    "story" JSONB NOT NULL,
    "target_amount_minor" BIGINT,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "progress_source" "progress_source" NOT NULL DEFAULT 'VERIFIED_DONATIONS',
    "manual_raised_minor" BIGINT,
    "manual_raised_note" TEXT,
    "use_of_funds" JSONB,
    "faqs" JSONB,
    "cover_media_id" UUID,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "accepts_donations" BOOLEAN NOT NULL DEFAULT true,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "scheduled_for" TIMESTAMPTZ(6),
    "unpublished_at" TIMESTAMPTZ(6),
    "current_revision_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "seo_title" VARCHAR(70),
    "seo_description" VARCHAR(180),
    "canonical_url" TEXT,
    "og_image_id" UUID,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_updates" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" JSONB NOT NULL,
    "media_id" UUID,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "campaign_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact_stats" (
    "id" UUID NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,
    "unit" VARCHAR(40),
    "period_start" DATE,
    "period_end" DATE,
    "period_label" VARCHAR(80),
    "methodology" TEXT NOT NULL,
    "source_note" VARCHAR(300),
    "display_order" INTEGER NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "verification_status" "impact_verification_status" NOT NULL DEFAULT 'DRAFT',
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "impact_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "display_name" VARCHAR(120) NOT NULL,
    "location" VARCHAR(120),
    "consent_evidence" VARCHAR(300) NOT NULL,
    "consent_date" DATE NOT NULL,
    "approval_status" "testimonial_approval_status" NOT NULL DEFAULT 'PENDING',
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "media_id" UUID,
    "is_visible" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(24) NOT NULL,
    "type" "enquiry_type" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(20),
    "subject" VARCHAR(200),
    "message" TEXT NOT NULL,
    "event_id" UUID,
    "consent_given_at" TIMESTAMPTZ(6) NOT NULL,
    "consent_version" VARCHAR(20) NOT NULL,
    "status" "enquiry_status" NOT NULL DEFAULT 'NEW',
    "assigned_to" UUID,
    "source_path" VARCHAR(300),
    "ip_hash" CHAR(64),
    "user_agent" TEXT,
    "spam_score" DECIMAL(4,2),
    "retention_delete_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_categories_slug_key" ON "media_categories"("slug");

-- CreateIndex
CREATE INDEX "media_categories_kind_sort_order_idx" ON "media_categories"("kind", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "media_storage_key_key" ON "media"("storage_key");

-- CreateIndex
CREATE INDEX "media_category_id_created_at_idx" ON "media"("category_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "media_checksum_sha256_idx" ON "media"("checksum_sha256");

-- CreateIndex
CREATE INDEX "media_status_idx" ON "media"("status");

-- CreateIndex
CREATE INDEX "media_kind_is_public_idx" ON "media"("kind", "is_public");

-- CreateIndex
CREATE INDEX "pages_kind_idx" ON "pages"("kind");

-- CreateIndex
CREATE INDEX "pages_status_scheduled_for_idx" ON "pages"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "pages_status_published_at_idx" ON "pages"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "page_sections_page_id_idx" ON "page_sections"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "page_sections_page_id_sort_order_key" ON "page_sections"("page_id", "sort_order");

-- CreateIndex
CREATE INDEX "revisions_entity_type_entity_id_created_at_idx" ON "revisions"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "revisions_entity_type_entity_id_version_key" ON "revisions"("entity_type", "entity_id", "version");

-- CreateIndex
CREATE INDEX "activities_status_published_at_idx" ON "activities"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "activities_is_featured_idx" ON "activities"("is_featured");

-- CreateIndex
CREATE UNIQUE INDEX "news_categories_slug_key" ON "news_categories"("slug");

-- CreateIndex
CREATE INDEX "news_posts_status_published_at_idx" ON "news_posts"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "news_posts_category_id_status_idx" ON "news_posts"("category_id", "status");

-- CreateIndex
CREATE INDEX "events_event_status_start_at_idx" ON "events"("event_status", "start_at");

-- CreateIndex
CREATE INDEX "events_status_start_at_idx" ON "events"("status", "start_at");

-- CreateIndex
CREATE INDEX "events_is_featured_idx" ON "events"("is_featured");

-- CreateIndex
CREATE INDEX "campaigns_status_published_at_idx" ON "campaigns"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "campaigns_is_featured_idx" ON "campaigns"("is_featured");

-- CreateIndex
CREATE INDEX "campaign_updates_campaign_id_published_at_idx" ON "campaign_updates"("campaign_id", "published_at" DESC);

-- CreateIndex
CREATE INDEX "impact_stats_verification_status_is_visible_display_order_idx" ON "impact_stats"("verification_status", "is_visible", "display_order");

-- CreateIndex
CREATE INDEX "testimonials_approval_status_is_visible_display_order_idx" ON "testimonials"("approval_status", "is_visible", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_reference_key" ON "enquiries"("reference");

-- CreateIndex
CREATE INDEX "enquiries_status_created_at_idx" ON "enquiries"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "enquiries_type_status_idx" ON "enquiries"("type", "status");

-- CreateIndex
CREATE INDEX "enquiries_assigned_to_status_idx" ON "enquiries"("assigned_to", "status");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "media_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_media_id_fkey" FOREIGN KEY ("hero_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "news_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_poster_media_id_fkey" FOREIGN KEY ("poster_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impact_stats" ADD CONSTRAINT "impact_stats_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
