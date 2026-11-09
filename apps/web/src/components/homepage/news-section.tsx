import { ButtonLink, Container, NewsCard, Section, SectionHeading } from '@/components/ui';

import type { HomepageNews } from '@/content';

/**
 * News.
 *
 * Three editorial cards with a category, a real `<time>` element and a read
 * link. The whole card is one link target, so the pointer and keyboard reach the
 * same action.
 */
export function NewsSection({ news }: { news: HomepageNews }) {
  return (
    <Section id="news" aria-labelledby="news-heading">
      <Container className="flex flex-col gap-9">
        <SectionHeading
          id="news-heading"
          level={2}
          {...(news.eyebrow === undefined ? {} : { eyebrow: news.eyebrow })}
          title={news.heading}
          {...(news.description === undefined ? {} : { description: news.description })}
          actions={
            <ButtonLink href={news.link.href} variant="outline" size="sm">
              {news.link.label}
            </ButtonLink>
          }
        />

        <div className="grid gap-5 md:grid-cols-3">
          {news.items.map((article) => (
            <NewsCard
              key={article.id}
              title={article.title}
              excerpt={article.excerpt}
              category={article.category}
              dateLabel={article.dateLabel}
              dateTime={article.dateTime}
              imageLabel="Article cover photograph"
              link={{ href: '/news', label: 'Read article' }}
              demo
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
