import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { Alert, Container, NewsCard, Pagination, Section, SectionHeading } from '@/components/ui';
import { CategoryFilter, CtaPanel, PageHero } from '@/components/site';

import { getNewsPage } from '@/content';

/**
 * News listing.
 *
 * Category filtering is a URL parameter handled on the server: `/news?category=…`
 * is shareable, works without JavaScript and needs no client state. An unknown
 * category is a 404 rather than a silently empty list.
 */

interface NewsPageProps {
  searchParams: Promise<{ category?: string | string[] }>;
}

// Rendered on demand: content lives in the database, so the build must not
// require a running API. The content loaders cache their fetches instead.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getNewsPage();

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: '/news' },
    robots: { index: false, follow: false },
  };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { category } = await searchParams;
  const requested = Array.isArray(category) ? category[0] : category;
  const content = await getNewsPage(requested);

  if (requested !== undefined && !content.categories.includes(requested)) {
    notFound();
  }

  const visible =
    requested === undefined
      ? content.items
      : content.items.filter((article) => article.category === requested);

  return (
    <>
      <PageHero
        {...(content.hero.eyebrow === undefined ? {} : { eyebrow: content.hero.eyebrow })}
        heading={content.hero.heading}
        description={content.hero.description}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'News' }]}
      />

      <Section spacing="compact">
        <Container className="flex flex-col gap-7">
          <Alert tone="warning" title="Demonstration articles">
            {content.note}
          </Alert>

          <CategoryFilter
            basePath="/news"
            options={content.categories}
            label="Filter articles by category"
            {...(requested === undefined ? {} : { active: requested })}
          />

          <SectionHeading
            level={2}
            title={requested === undefined ? 'All articles' : `${requested} articles`}
            description={`${String(visible.length)} ${visible.length === 1 ? 'article' : 'articles'} in this preview build.`}
          />

          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((article) => (
              <li key={article.id} className="h-full">
                <NewsCard
                  className="h-full"
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.category}
                  dateLabel={article.dateLabel}
                  dateTime={article.dateTime}
                  imageLabel={article.image.label}
                  link={{ href: `/news/${article.slug}`, label: 'Read article' }}
                  demo
                />
              </li>
            ))}
          </ul>

          {/* Pagination is wired to real URLs; this dataset fits on one page. */}
          <Pagination
            currentPage={1}
            totalPages={1}
            hrefFor={(page) => `/news?page=${String(page)}`}
          />
        </Container>
      </Section>

      <CtaPanel content={content.cta} />
    </>
  );
}
