import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Alert } from './alert';
import { Badge } from './badge';
import { Breadcrumbs, PageHeader } from './breadcrumbs';
import { Button, ButtonLink } from './button';
import { Card } from './card';
import { Dialog } from './dialog';
import { EmptyState } from './feedback';
import { Checkbox, FormErrorSummary, Input, RadioGroup, Select, Textarea } from './form';
import { ImageContainer } from './image-container';
import { Section } from './layout';
import { NavLink, TextLink } from './link';
import { SectionHeading } from './section-heading';
import { SkipLink } from './a11y';

const render = (element: ReactElement): string => renderToStaticMarkup(element);

describe('form controls', () => {
  it('binds a label, hint and error to the input', () => {
    const html = render(
      <Input
        name="email"
        label="Email address"
        hint="Used only for receipts."
        error="Enter a valid email address."
        required
      />,
    );

    expect(html).toContain('for="email"');
    expect(html).toContain('id="email"');
    expect(html).toContain('name="email"');
    expect(html).toMatch(/required/);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="email-hint email-error"');
    expect(html).toContain('id="email-hint"');
    expect(html).toContain('id="email-error"');
    expect(html).toContain('Enter a valid email address.');
  });

  it('omits invalid/describedby attributes when there is no error or hint', () => {
    const html = render(<Input name="name" label="Your name" />);

    expect(html).not.toContain('aria-invalid');
    expect(html).not.toContain('aria-describedby');
    expect(html).not.toContain('required');
  });

  it('allows an id override so the same name can appear twice', () => {
    const html = render(<Input id="second-email" name="email" label="Email" />);

    expect(html).toContain('id="second-email"');
    expect(html).toContain('for="second-email"');
  });

  it('visually hides the label without removing it from the accessibility tree', () => {
    const html = render(<Input name="search" label="Search" hideLabel />);

    expect(html).toContain('for="search"');
    expect(html).toContain('visually-hidden');
  });

  it('binds the textarea and exposes its rows', () => {
    const html = render(<Textarea name="message" label="Message" rows={4} error="Too short." />);

    expect(html).toContain('id="message"');
    expect(html).toContain('for="message"');
    expect(html).toContain('rows="4"');
    expect(html).toContain('aria-invalid="true"');
  });

  it('renders a labelled select with options', () => {
    const html = render(
      <Select
        name="purpose"
        label="Purpose"
        placeholder="Choose one"
        required
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ]}
      />,
    );

    expect(html).toContain('for="purpose"');
    expect(html).toContain('id="purpose"');
    expect(html).toContain('Choose one');
    expect(html).toContain('Option A');
    expect(html).toContain('Option B');
  });

  it('associates a checkbox with its label and description', () => {
    const html = render(
      <Checkbox name="consent" label="I agree" description="Required." required />,
    );

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('id="consent"');
    expect(html).toContain('for="consent"');
    expect(html).toContain('Required.');
  });

  it('groups radios in a fieldset with a legend', () => {
    const html = render(
      <RadioGroup
        name="contact"
        legend="How should we contact you?"
        options={[
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
        ]}
      />,
    );

    expect(html).toContain('<fieldset');
    expect(html).toContain('<legend');
    expect(html).toContain('How should we contact you?');
    expect(html).toContain('id="contact-email"');
    expect(html).toContain('for="contact-email"');
    expect(html).toContain('id="contact-phone"');
  });

  it('announces an error summary assertively and links to the fields', () => {
    const html = render(
      <FormErrorSummary
        errors={[{ fieldId: 'email', label: 'Email address', message: 'Enter an email address.' }]}
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('There is a problem');
    expect(html).toContain('href="#email"');
  });
});

describe('buttons and links', () => {
  it('defaults to type=button so it cannot submit a form accidentally', () => {
    const html = render(<Button>Save</Button>);
    expect(html).toContain('type="button"');
  });

  it('exposes a loading state that disables the control', () => {
    const html = render(<Button isLoading>Saving</Button>);

    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/disabled/);
  });

  it('renders a link when navigation is intended', () => {
    const html = render(<ButtonLink href="/donate">Donate</ButtonLink>);

    expect(html).toContain('<a');
    expect(html).toContain('href="/donate"');
    expect(html).not.toContain('type="button"');
  });

  it('marks the current page on navigation links', () => {
    expect(
      render(
        <NavLink href="/about" isActive>
          About
        </NavLink>,
      ),
    ).toContain('aria-current="page"');
    expect(render(<NavLink href="/about">About</NavLink>)).not.toContain('aria-current');
  });

  it('warns screen-reader users about external links', () => {
    const html = render(
      <TextLink href="https://example.com" external>
        Reference
      </TextLink>,
    );

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('opens in a new tab');
  });
});

describe('feedback', () => {
  it('uses an assertive live region for errors and a polite one for information', () => {
    expect(render(<Alert tone="danger">Failed</Alert>)).toContain('role="alert"');
    expect(render(<Alert tone="warning">Careful</Alert>)).toContain('role="alert"');
    expect(render(<Alert tone="info">Note</Alert>)).toContain('role="status"');
    expect(render(<Alert tone="success">Done</Alert>)).toContain('role="status"');
  });

  it('gives an empty state a heading and a description', () => {
    const html = render(<EmptyState title="Nothing here yet" description="Come back later." />);

    expect(html).toContain('Nothing here yet');
    expect(html).toContain('Come back later.');
  });

  it('renders a badge with readable text, not colour alone', () => {
    const html = render(<Badge tone="success">Published</Badge>);
    expect(html).toContain('Published');
  });
});

describe('navigation and structure', () => {
  it('renders breadcrumbs as a labelled list with an aria-current page', () => {
    const html = render(
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'News', href: '/news' },
          { label: 'Article' },
        ]}
      />,
    );

    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('<ol');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/news"');
    // The current page must not be a link.
    expect(html).not.toContain('href="/article"');
  });

  it('provides a skip link to the main content', () => {
    const html = render(<SkipLink />);
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('skip-link');
  });

  it('renders the requested heading level with an id', () => {
    expect(render(<SectionHeading level={1} title="Title" id="page-title" />)).toContain(
      '<h1 id="page-title"',
    );
    expect(render(<SectionHeading level={3} title="Sub" />)).toContain('<h3');
  });

  it('renders a page header with one h1', () => {
    const html = render(<PageHeader title="Page title" description="Context." />);
    const h1Count = (html.match(/<h1/g) ?? []).length;

    expect(h1Count).toBe(1);
    expect(html).toContain('Page title');
  });

  it('renders a section as a landmark element', () => {
    const html = render(
      <Section aria-labelledby="s">
        <h2 id="s">Section</h2>
      </Section>,
    );

    expect(html).toContain('<section');
    expect(html).toContain('aria-labelledby="s"');
  });

  it('renders card content', () => {
    expect(render(<Card>Content</Card>)).toContain('Content');
  });
});

describe('images', () => {
  it('renders a labelled placeholder when no image is supplied', () => {
    const html = render(<ImageContainer placeholderLabel="Campaign photograph" />);

    expect(html).toContain('role="img"');
    expect(html).toContain('Campaign photograph');
    expect(html).toContain('Awaiting approved photograph');
    expect(html).not.toContain('<img');
  });

  it('renders a real image with its alternative text', () => {
    const html = render(
      <ImageContainer src="/media/example.jpg" alt="A descriptive caption" aspect="4/3" />,
    );

    expect(html).toContain('<img');
    expect(html).toContain('alt="A descriptive caption"');
  });

  it('refuses to render an image without alternative text', () => {
    expect(() => render(<ImageContainer src="/media/example.jpg" />)).toThrow(/alt/);
  });
});

describe('dialog', () => {
  it('renders a native dialog labelled by its title', () => {
    const html = render(
      <Dialog open={false} onClose={() => undefined} title="Dialog title">
        <p>Body</p>
      </Dialog>,
    );

    expect(html).toContain('<dialog');
    expect(html).toContain('aria-labelledby');
    expect(html).toContain('Dialog title');
  });
});
