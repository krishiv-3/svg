import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { Alert, Container, Section } from '@/components/ui';
import { CategoryFilter, CtaPanel, GalleryGrid, PageHero } from '@/components/site';

import { getGalleryPage } from '@/content';

/**
 * Gallery.
 *
 * Filtering is the same server-side `?category=` mechanism as `/news`, and the
 * grid reuses `GalleryGrid` — the single implementation of tiles plus the
 * keyboard-accessible lightbox.
 */

interface GalleryPageProps {
  searchParams: Promise<{ category?: string | string[] }>;
}

// Rendered on demand: content lives in the database, so the build must not
// require a running API. The content loaders cache their fetches instead.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getGalleryPage();

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: '/gallery' },
    robots: { index: false, follow: false },
  };
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const { category } = await searchParams;
  const requested = Array.isArray(category) ? category[0] : category;
  const content = await getGalleryPage(requested);

  if (requested !== undefined && !content.categories.includes(requested)) {
    notFound();
  }

  const visible =
    requested === undefined
      ? content.items
      : content.items.filter((item) => item.category === requested);

  return (
    <>
      <PageHero
        {...(content.hero.eyebrow === undefined ? {} : { eyebrow: content.hero.eyebrow })}
        heading={content.hero.heading}
        description={content.hero.description}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Gallery' }]}
      />

      <Section spacing="compact">
        <Container className="flex flex-col gap-7">
          <Alert tone="info" title="Placeholder tiles">
            {content.note} Every tile below is a labelled placeholder until approved photographs are
            supplied.
          </Alert>

          <CategoryFilter
            basePath="/gallery"
            options={content.categories}
            label="Filter photographs by category"
            {...(requested === undefined ? {} : { active: requested })}
          />

          <GalleryGrid items={visible} viewerLabel="Gallery image viewer" />

          <p className="text-[length:var(--text-caption)] text-muted">
            {visible.length} {visible.length === 1 ? 'image' : 'images'}
            {requested === undefined ? '' : ` in ${requested}`}.
          </p>
        </Container>
      </Section>

      <CtaPanel content={content.cta} />
    </>
  );
}
