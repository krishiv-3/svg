import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button } from './button';
import {
  ActivityCard,
  CampaignCard,
  EventCard,
  GalleryCard,
  ImageCard,
  NewsCard,
  StatisticCard,
  TestimonialCard,
} from './cards';
import { Divider } from './divider';
import { Pagination } from './pagination';
import { ProgressBar } from './progress';
import { SearchInput } from './search-input';
import { ErrorState, FormSuccess, SuccessState } from './states';
import { Toast, ToastRegion } from './toast';

const render = (element: ReactElement): string => renderToStaticMarkup(element);

describe('outline button', () => {
  it('renders with the outline treatment and a real button element', () => {
    const html = render(<Button variant="outline">Read more</Button>);

    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('border-terracotta-ink');
    expect(html).toContain('Read more');
  });
});

describe('divider', () => {
  it('renders a semantic hr without a label', () => {
    const html = render(<Divider />);
    expect(html).toContain('<hr');
  });

  it('renders a labelled separator when a label is given', () => {
    const html = render(<Divider label="Or continue with" />);

    expect(html).toContain('role="separator"');
    expect(html).toContain('aria-label="Or continue with"');
    expect(html).toContain('Or continue with');
    expect(html).not.toContain('<hr');
  });
});

describe('pagination', () => {
  const props = {
    currentPage: 3,
    totalPages: 10,
    hrefFor: (page: number) => `/list?page=${String(page)}`,
  };

  it('is a labelled navigation landmark with a current page', () => {
    const html = render(<Pagination {...props} />);

    expect(html).toContain('aria-label="Pagination"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/list?page=2"');
    expect(html).toContain('rel="prev"');
    expect(html).toContain('rel="next"');
  });

  it('collapses long ranges with an ellipsis', () => {
    const html = render(<Pagination {...props} />);
    expect(html).toContain('…');
    expect(html).toContain('href="/list?page=10"');
  });

  it('disables previous on the first page without rendering a dead link', () => {
    const html = render(
      <Pagination currentPage={1} totalPages={4} hrefFor={(page) => `?p=${String(page)}`} />,
    );

    expect(html).toContain('cursor-not-allowed');
    expect(html).not.toContain('rel="prev"');
  });

  it('renders nothing when there is a single page', () => {
    expect(render(<Pagination currentPage={1} totalPages={1} hrefFor={() => '#'} />)).toBe('');
  });
});

describe('progress bar', () => {
  it('exposes progress semantics rather than only a coloured bar', () => {
    const html = render(<ProgressBar value={250} max={1000} label="Campaign progress" showValue />);

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Campaign progress"');
    expect(html).toContain('aria-valuenow="250"');
    expect(html).toContain('aria-valuemax="1000"');
    expect(html).toContain('aria-valuetext="25%"');
    expect(html).toContain('25%');
  });

  it('clamps values outside the range', () => {
    const html = render(<ProgressBar value={2000} max={1000} label="Clamped" />);
    expect(html).toContain('aria-valuenow="1000"');
    expect(html).toContain('aria-valuetext="100%"');
  });
});

describe('content cards', () => {
  it('renders an image card as an article with a heading and a link', () => {
    const html = render(
      <ImageCard
        title="Card title"
        description="Supporting copy."
        eyebrow="Category"
        link={{ href: '/news/example', label: 'Read more' }}
      />,
    );

    expect(html).toContain('<article');
    expect(html).toContain('<h3');
    expect(html).toContain('Card title');
    expect(html).toContain('href="/news/example"');
  });

  it('marks demo content visibly', () => {
    expect(render(<ImageCard title="Demo card" demo />)).toContain('DEMO');
    expect(render(<ImageCard title="Real card" />)).not.toContain('DEMO');
  });

  it('respects the requested heading level so the outline stays correct', () => {
    expect(render(<ImageCard title="Level two" headingLevel={2} />)).toContain('<h2');
    expect(render(<ImageCard title="Level four" headingLevel={4} />)).toContain('<h4');
  });

  it('renders an activity card with its icon and description', () => {
    const html = render(
      <ActivityCard title="Daily Nourishment" description="Fresh fodder and clean water." />,
    );

    expect(html).toContain('Daily Nourishment');
    expect(html).toContain('Fresh fodder and clean water.');
  });

  it('formats campaign amounts from minor units and shows progress', () => {
    const html = render(
      <CampaignCard
        title="Winter Fodder Fund"
        purpose="Fodder through the cold months."
        raisedMinor={18_000_000}
        goalMinor={50_000_000}
        status="Illustrative"
      />,
    );

    expect(html).toContain('₹1,80,000');
    expect(html).toContain('of ₹5,00,000');
    expect(html).toContain('role="progressbar"');
  });

  it('renders a machine-readable date on event cards', () => {
    const html = render(
      <EventCard
        title="Community Open Day"
        day="14"
        month="Dec"
        dateTime="2026-12-14T10:00:00+05:30"
        time="10:00 – 16:00"
        venue="Demonstration venue"
        status="Scheduled"
      />,
    );

    expect(html.toLowerCase()).toContain('<time datetime="2026-12-14t10:00:00+05:30"');
    expect(html).toContain('Scheduled');
  });

  it('renders news metadata and category', () => {
    const html = render(
      <NewsCard
        title="Preparing the shelters"
        excerpt="An illustrative update."
        category="Updates"
        dateLabel="2 November 2026"
        dateTime="2026-11-02"
        link={{ href: '/news/winter', label: 'Read article' }}
      />,
    );

    expect(html.toLowerCase()).toContain('<time datetime="2026-11-02"');
    expect(html).toContain('Updates');
    expect(html).toContain('Read article');
  });

  it('renders a gallery caption', () => {
    expect(render(<GalleryCard caption="Morning feeding" category="Daily care" />)).toContain(
      'Morning feeding',
    );
  });

  it('renders a testimonial as a blockquote with attribution', () => {
    const html = render(
      <TestimonialCard
        quote="Illustrative quotation."
        name="Demo supporter"
        context="Illustrative"
      />,
    );

    expect(html).toContain('<blockquote');
    expect(html).toContain('Illustrative quotation.');
    expect(html).toContain('Demo supporter');
  });

  it('renders a statistic with its unit and note', () => {
    const html = render(
      <StatisticCard
        value="120"
        unit="cows"
        label="Under daily care"
        note="Illustrative figure."
      />,
    );

    expect(html).toContain('120');
    expect(html).toContain('cows');
    expect(html).toContain('Illustrative figure.');
  });
});

describe('page states', () => {
  it('announces an error state and shows a reference', () => {
    const html = render(
      <ErrorState title="Could not load" description="Try again." reference="req_123" />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('Could not load');
    expect(html).toContain('req_123');
  });

  it('announces a success state politely', () => {
    const html = render(<SuccessState title="Message sent" description="Thank you." />);

    expect(html).toContain('role="status"');
    expect(html).toContain('Message sent');
  });

  it('provides an inline form success message', () => {
    const html = render(<FormSuccess description="Your draft was saved." />);

    expect(html).toContain('role="status"');
    expect(html).toContain('Your draft was saved.');
  });
});

describe('toasts', () => {
  it('uses a polite role for information and an assertive one for failures', () => {
    expect(render(<Toast tone="info" title="Saved" />)).toContain('role="status"');
    expect(render(<Toast tone="danger" title="Failed" />)).toContain('role="alert"');
  });

  it('provides an accessible dismiss control', () => {
    const html = render(<Toast tone="success" title="Draft saved" onDismiss={() => undefined} />);

    expect(html).toContain('aria-label="Dismiss: Draft saved"');
  });

  it('renders the region as a polite live area', () => {
    const html = render(
      <ToastRegion>
        <Toast title="One" />
      </ToastRegion>,
    );

    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('z-toast');
  });
});

describe('search input', () => {
  it('binds a label and uses the search input type', () => {
    const html = render(<SearchInput id="admin-search" placeholder="Search…" />);

    expect(html).toContain('for="admin-search"');
    expect(html).toContain('id="admin-search"');
    expect(html).toContain('type="search"');
    expect(html).toContain('visually-hidden');
  });
});
