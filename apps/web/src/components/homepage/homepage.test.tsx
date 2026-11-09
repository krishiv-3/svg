import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { demoHomepageContent } from '@/content/homepage.demo';

import {
  AboutSection,
  ActivitiesSection,
  CampaignsSection,
  DonateStrip,
  EventsSection,
  FinalCtaSection,
  GallerySection,
  HeroSection,
  ImpactSection,
  NewsSection,
  TestimonialsSection,
} from './index';

/**
 * Section-level rendering checks.
 *
 * These assert structure and semantics rather than pixel output: exactly one h1,
 * a heading per section, real links, and the demonstration labelling that must
 * survive any future refactor.
 */

const content = demoHomepageContent;

describe('homepage sections', () => {
  it('renders the hero with the only h1', () => {
    const html = renderToStaticMarkup(<HeroSection hero={content.hero} />);

    expect(html.match(/<h1/g) ?? []).toHaveLength(1);
    expect(html).toContain(content.hero.heading);
    expect(html).toContain('href="/donate"');
    expect(html).toContain(content.hero.footnote);
  });

  it('renders the about section with a prose body and a link', () => {
    const html = renderToStaticMarkup(<AboutSection about={content.about} />);

    expect(html).toContain('<h2');
    expect(html).toContain('href="/about"');
    expect(html).toContain(content.about.body[0]);
  });

  it('renders four activity cards with supporting points', () => {
    const html = renderToStaticMarkup(<ActivitiesSection activities={content.activities} />);

    expect(html.match(/<article/g) ?? []).toHaveLength(4);

    for (const activity of content.activities.items) {
      expect(html).toContain(activity.title);
      expect(html).toContain(activity.bullets[0]);
    }
  });

  it('renders impact figures with their evidence notes', () => {
    const html = renderToStaticMarkup(<ImpactSection impact={content.impact} />);

    for (const statistic of content.impact.stats) {
      expect(html).toContain(statistic.value);
      expect(html).toContain(statistic.label);
    }

    expect(html).toContain(content.impact.footnote);
  });

  it('renders campaign progress from the recorded amounts', () => {
    const html = renderToStaticMarkup(<CampaignsSection campaigns={content.campaigns} />);

    expect(html.match(/role="progressbar"/g) ?? []).toHaveLength(content.campaigns.items.length);
    expect(html).toContain('₹1,80,000');
    expect(html).toContain(content.campaigns.footnote);
  });

  it('renders news and events with machine-readable dates', () => {
    const newsHtml = renderToStaticMarkup(<NewsSection news={content.news} />);
    const eventsHtml = renderToStaticMarkup(<EventsSection events={content.events} />);

    const [firstArticle] = content.news.items;
    const [firstEvent] = content.events.items;

    expect(firstArticle).toBeDefined();
    expect(firstEvent).toBeDefined();

    expect(newsHtml).toContain(firstArticle?.dateTime ?? 'missing-date');
    expect(newsHtml).toContain('href="/news"');
    expect(eventsHtml).toContain(firstEvent?.dateTime ?? 'missing-date');
    expect(eventsHtml).toContain('href="/events"');
  });

  it('renders every gallery tile as a labelled button', () => {
    const html = renderToStaticMarkup(<GallerySection gallery={content.gallery} />);

    expect(html.match(/View “/g) ?? []).toHaveLength(content.gallery.items.length);
    expect(html).toContain('aria-label="Gallery image viewer"');
    expect(html).toContain('href="/gallery"');
  });

  it('labels testimonials as fictional', () => {
    const html = renderToStaticMarkup(<TestimonialsSection testimonials={content.testimonials} />);

    expect(html.match(/<blockquote/g) ?? []).toHaveLength(content.testimonials.items.length);
    expect(html).toContain(content.testimonials.footnote);
  });

  it('never claims a payment can be made', () => {
    const html = [
      renderToStaticMarkup(<HeroSection hero={content.hero} />),
      renderToStaticMarkup(<DonateStrip strip={content.donateStrip} />),
      renderToStaticMarkup(<FinalCtaSection finalCta={content.finalCta} />),
    ].join('');

    expect(html.toLowerCase()).not.toContain('pay now');
    expect(html.toLowerCase()).not.toContain('checkout');
    expect(html.toLowerCase()).not.toContain('secure payment');
    expect(html).toContain('not open');
  });
});
