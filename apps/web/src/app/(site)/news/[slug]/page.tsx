import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { Container, NewsCard, Section, SectionHeading, TextLink } from '@/components/ui';
import { CtaPanel, PageHero } from '@/components/site';

import { getNewsArticle, getNewsPage } from '@/content';

/**
 * News article.
 *
 * A readable measure (about 68 characters), a real `<time>` element and related
 * articles drawn from the same dataset. The body is plain paragraphs — no HTML
 * injection, so user-controlled content can never be rendered as markup.
 */

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Rendered on demand: content lives in the database, so the build must not
// require a running API. Next caches the fetch itself (see the content loaders).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsArticle(slug);

  if (article === undefined) {
    return { title: 'Article not found', robots: { index: false, follow: false } };
  }

  return {
    title: `${article.title} — demonstration article`,
    description: article.excerpt,
    alternates: { canonical: `/news/${article.slug}` },
    robots: { index: false, follow: false },
  };
}

export default async function NewsArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getNewsArticle(slug);

  if (article === undefined) {
    notFound();
  }

  const { items } = await getNewsPage();
  const related = items
    .filter((item) => item.slug !== article.slug)
    .sort(
      (a, b) => Number(b.category === article.category) - Number(a.category === article.category),
    )
    .slice(0, 2);

  return (
    <>
      <PageHero
        eyebrow={article.category}
        heading={article.title}
        description={article.excerpt}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'News', href: '/news' },
          { label: article.title },
        ]}
      />

      <Section spacing="compact">
        <Container>
          <div className="mx-auto flex max-w-[68ch] flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3 border-b border-sand pb-4">
              <time
                dateTime={article.dateTime}
                className="text-[length:var(--text-caption)] text-muted"
              >
                {article.dateLabel}
              </time>
              <span className="text-[length:var(--text-caption)] rounded-full bg-terracotta/10 px-2.5 py-1 font-medium text-terracotta-ink">
                {article.category}
              </span>
            </div>

            {article.body.map((paragraph) => (
              <p key={paragraph} className="text-body text-charcoal/90">
                {paragraph}
              </p>
            ))}

            <div className="pt-2">
              <TextLink href="/news">Back to all news</TextLink>
            </div>
          </div>
        </Container>
      </Section>

      {related.length === 0 ? null : (
        <Section tone="muted" spacing="compact" aria-labelledby="related-heading">
          <Container className="flex flex-col gap-7">
            <SectionHeading
              id="related-heading"
              level={2}
              eyebrow="Keep reading"
              title="Related articles"
            />

            <ul className="grid gap-5 md:grid-cols-2">
              {related.map((item) => (
                <li key={item.id} className="h-full">
                  <NewsCard
                    className="h-full"
                    title={item.title}
                    excerpt={item.excerpt}
                    category={item.category}
                    dateLabel={item.dateLabel}
                    dateTime={item.dateTime}
                    imageLabel={item.image.label}
                    link={{ href: `/news/${item.slug}`, label: 'Read article' }}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <CtaPanel
        content={{
          heading: 'Support the work you are reading about.',
          description: 'Regular support is what makes a daily routine possible.',
          cta: { label: 'Donate', href: '/donate' },
          secondary: { label: 'All news', href: '/news' },
          note: 'Online donations are not open yet.',
        }}
      />
    </>
  );
}
