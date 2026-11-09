import type { Metadata } from 'next';

import { contrastRatio, palette, statusColors } from '@gaushala/shared';

import { CheckCircleIcon, HeartIcon, InboxIcon, SearchIcon } from '@/components/icons';
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  Container,
  Divider,
  EmptyState,
  ErrorState,
  FormErrorSummary,
  ImageContainer,
  Input,
  NavLink,
  PageHeader,
  Pagination,
  Radio,
  RadioGroup,
  Section,
  SectionHeading,
  Select,
  Skeleton,
  SkipLink,
  Spinner,
  SuccessState,
  Textarea,
  TextLink,
} from '@/components/ui';
import {
  DonateCta,
  FOOTER_NAV,
  FooterContact,
  PRIMARY_NAV,
  SiteFooter,
  SiteHeader,
  StickyDonateCta,
} from '@/components/site';

import { DialogDemo } from './dialog-demo';
import { ToastDemo } from './toast-demo';

/**
 * Design-system reference page.
 *
 * Internal documentation, not public content: `noindex`, no Gaushala facts, and
 * clearly-labelled placeholders. Phase 4 builds the real homepage; this page
 * remains as the living reference for the component kit.
 */

export const metadata: Metadata = {
  title: 'Design system',
  robots: { index: false, follow: false },
};

/* -------------------------------------------------------------------------- */
/* Local documentation helpers                                                */
/* -------------------------------------------------------------------------- */

function Demo({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Section id={id} tone="default" spacing="compact" aria-labelledby={`${id}-heading`}>
      <Container className="flex flex-col gap-8">
        <SectionHeading
          id={`${id}-heading`}
          title={title}
          {...(description === undefined ? {} : { description })}
        />
        {children}
      </Container>
    </Section>
  );
}

function Specimen({
  label,
  children,
  note,
}: {
  label: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[length:var(--text-caption)] font-medium tracking-wide text-muted uppercase">
        {label}
      </p>
      <div className="border-sand rounded-lg border bg-white p-4">{children}</div>
      {note === undefined ? null : (
        <p className="text-[length:var(--text-caption)] text-muted">{note}</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

interface ColourToken {
  name: string;
  token: string;
  hex: string;
  className: string;
  usage: string;
  /** Surface the swatch is measured against. */
  against: 'ivory' | 'cocoa';
  /** Overrides the default "<colour> text on <surface>" caption. */
  contrastNote?: string;
}

/** Sand is a surface, not a text colour — report the text that sits on it. */
const SAND_CONTRAST = `${contrastRatio(palette.deepCocoa, palette.sand).toFixed(1)}:1 cocoa text on sand`;

const PIGMENTS: readonly ColourToken[] = [
  {
    name: 'Warm ivory',
    token: '--color-ivory',
    hex: palette.warmIvory,
    className: 'bg-ivory',
    usage: 'Page background; the majority of every layout.',
    against: 'cocoa',
  },
  {
    name: 'Terracotta',
    token: '--color-terracotta',
    hex: palette.terracotta,
    className: 'bg-terracotta',
    usage: 'Primary actions only — one per view. Never a page background.',
    against: 'ivory',
  },
  {
    name: 'Terracotta ink',
    token: '--color-terracotta-ink',
    hex: palette.terracottaInk,
    className: 'bg-terracotta-ink',
    usage: 'Links and small text where the brand terracotta is too light.',
    against: 'ivory',
  },
  {
    name: 'Burnt orange',
    token: '--color-burnt-orange',
    hex: palette.burntOrange,
    className: 'bg-burnt-orange',
    usage: 'Secondary accent: icons, highlights, hover on primary.',
    against: 'ivory',
  },
  {
    name: 'Deep cocoa',
    token: '--color-cocoa',
    hex: palette.deepCocoa,
    className: 'bg-cocoa',
    usage: 'Headings, navigation, footer, dark surfaces.',
    against: 'ivory',
  },
  {
    name: 'Sand',
    token: '--color-sand',
    hex: palette.sand,
    className: 'bg-sand',
    usage: 'Cards, panels, dividers and warm muted sections.',
    against: 'ivory',
    contrastNote: SAND_CONTRAST,
  },
  {
    name: 'Charcoal brown',
    token: '--color-charcoal',
    hex: palette.charcoalBrown,
    className: 'bg-charcoal',
    usage: 'Body text and high-contrast content.',
    against: 'ivory',
  },
  {
    name: 'Antique brass',
    token: '--color-brass',
    hex: palette.antiqueBrass,
    className: 'bg-brass',
    usage: 'Small premium accents and badges. Decorative only.',
    against: 'ivory',
  },
  {
    name: 'White',
    token: '--color-white',
    hex: palette.white,
    className: 'bg-white',
    usage: 'Forms, cards and clean contrast.',
    against: 'cocoa',
  },
];

const STATUS_TOKENS = [
  {
    name: 'Success',
    hex: statusColors.success,
    className: 'bg-success',
    usage: 'Verified payments, published content.',
  },
  {
    name: 'Warning',
    hex: statusColors.warning,
    className: 'bg-warning',
    usage: 'Scheduled, pending, needs attention.',
  },
  {
    name: 'Danger',
    hex: statusColors.danger,
    className: 'bg-danger',
    usage: 'Errors, destructive actions, failed payments.',
  },
  {
    name: 'Info',
    hex: statusColors.info,
    className: 'bg-info',
    usage: 'Neutral informational states.',
  },
] as const;

const TYPE_SAMPLES = [
  {
    role: 'Display',
    className: 'text-display',
    sample: 'Compassion, cared for daily',
    spec: 'fluid 40–68 px · 1.05 · −0.022em · 600',
  },
  {
    role: 'Page title',
    className: 'text-title',
    sample: 'About the gaushala',
    spec: 'fluid 32–48 px · 1.1 · −0.017em · 600',
  },
  {
    role: 'Section heading',
    className: 'text-heading',
    sample: 'What we do',
    spec: 'fluid 24–32 px · 1.2 · −0.012em · 600',
  },
  {
    role: 'Subheading',
    className: 'text-subheading',
    sample: 'Daily care and shelter',
    spec: '20 px · 1.35 · −0.006em · 600',
  },
  {
    role: 'Lead',
    className: 'text-lead',
    sample: 'A short introduction that sets context for the section below it.',
    spec: 'fluid 17–20 px · 1.65 · 400',
  },
  {
    role: 'Body',
    className: 'text-body',
    sample: 'Body copy is set at 16 px with a 1.65 line height and a 65-character measure.',
    spec: '16 px · 1.65 · 400',
  },
  {
    role: 'Body small',
    className: 'text-body-sm',
    sample: 'Used inside cards, tables and dense interface areas.',
    spec: '15 px · 1.6 · 400',
  },
  {
    role: 'Label',
    className: 'text-label',
    sample: 'Form labels and navigation items',
    spec: '14 px · 1.4 · 500',
  },
  {
    role: 'Caption',
    className: 'text-caption',
    sample: 'Captions, hints and supporting metadata.',
    spec: '13 px · 1.45 · 400',
  },
  {
    role: 'Overline',
    className: 'text-overline uppercase',
    sample: 'Section eyebrow',
    spec: '12 px · 1.4 · 0.14em · 600',
  },
] as const;

function measuredContrast(token: ColourToken): string {
  if (token.contrastNote !== undefined) {
    return token.contrastNote;
  }

  const ratio = contrastRatio(
    token.hex,
    token.against === 'ivory' ? palette.warmIvory : palette.deepCocoa,
  );

  return `${ratio.toFixed(1)}:1 ${token.name.toLowerCase()} text on ${token.against}`;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DesignSystemPage() {
  return (
    <>
      <SkipLink />
      <SiteHeader navItems={PRIMARY_NAV} activeHref="/design-system" />

      <main id="main-content">
        <Section tone="muted" spacing="compact">
          <Container className="flex flex-col gap-4">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Design system' }]} />
            <h1 className="text-title text-cocoa">Design system</h1>
            <p className="text-lead max-w-[65ch] text-charcoal/90">
              Warm Earth &amp; Terracotta — the shared visual language for the public website and
              the admin dashboard. Every component below is production code, not a mock-up.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand" size="md">
                Phase 3
              </Badge>
              <Badge tone="neutral" size="md">
                Internal reference · noindex
              </Badge>
              <ButtonLink href="/design-system/visual" variant="secondary" size="sm">
                Visual showcase
              </ButtonLink>
              <ButtonLink href="/design-system/content" variant="secondary" size="sm">
                Content components (demo)
              </ButtonLink>
              <ButtonLink href="/design-system/admin" variant="secondary" size="sm">
                Admin language
              </ButtonLink>
            </div>
          </Container>
        </Section>

        {/* ------------------------------------------------------------ colour */}
        <Demo
          id="colour"
          title="Colour"
          description="Nine approved brand tokens plus functional status colours. Ratios are measured, not estimated."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PIGMENTS.map((token) => (
              <div
                key={token.token}
                className="border-sand overflow-hidden rounded-xl border bg-white"
              >
                <div
                  className={`h-20 w-full border-b border-sand ${token.className}`}
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-1.5 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[length:var(--text-label)] font-semibold text-cocoa">
                      {token.name}
                    </p>
                    <code className="text-[length:var(--text-caption)] text-muted">
                      {token.hex}
                    </code>
                  </div>
                  <p className="text-[length:var(--text-caption)] text-muted">{token.usage}</p>
                  <p className="text-[length:var(--text-caption)] text-muted">
                    {measuredContrast(token)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Card tone="muted" padding="md" className="flex flex-col gap-3">
            <p className="text-[length:var(--text-label)] font-semibold text-cocoa">
              Functional status colours
            </p>
            <p className="text-[length:var(--text-caption)] text-muted">
              Not brand colours. They appear only inside alerts, badges and status indicators, and
              every one is legible as text on warm ivory.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STATUS_TOKENS.map((token) => (
                <li key={token.name} className="flex items-center gap-2.5">
                  <span
                    className={`h-8 w-8 shrink-0 rounded-md border border-black/10 ${token.className}`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col">
                    <span className="text-[length:var(--text-caption)] font-medium text-cocoa">
                      {token.name}
                    </span>
                    <code className="text-[length:var(--text-caption)] text-muted">
                      {token.hex}
                    </code>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Alert tone="warning" title="Do not make the site orange">
            Ivory carries the page, cocoa carries the structure, and terracotta is reserved for the
            single most important action on a screen. Brass is decorative only — at 2.4:1 it never
            carries text.
          </Alert>
        </Demo>

        {/* -------------------------------------------------------- typography */}
        <Demo
          id="typography"
          title="Typography"
          description="One family (Inter), ten roles. Sizes are fluid where hierarchy matters and fixed at reading sizes so body copy keeps a predictable measure."
        >
          <div className="border-sand overflow-hidden rounded-xl border bg-white">
            {TYPE_SAMPLES.map((sample) => (
              <div
                key={sample.role}
                className="flex flex-col gap-1 border-b border-sand p-5 last:border-b-0 lg:flex-row lg:items-baseline lg:gap-8"
              >
                <div className="w-40 shrink-0">
                  <p className="text-[length:var(--text-caption)] font-semibold text-cocoa">
                    {sample.role}
                  </p>
                  <code className="text-[length:var(--text-caption)] text-muted">
                    {sample.spec}
                  </code>
                </div>
                <p className={`${sample.className} text-cocoa`}>{sample.sample}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card padding="md">
              <p className="text-[length:var(--text-label)] font-semibold text-cocoa">
                Measure and rhythm
              </p>
              <p className="measure-prose text-body text-charcoal/90 mt-2">
                Long-form content is capped at 65 characters per line. Paragraphs use a 1.65 line
                height, which keeps dense explanatory text comfortable on a phone while remaining
                efficient on a desktop.
              </p>
            </Card>
            <Card padding="md">
              <p className="text-[length:var(--text-label)] font-semibold text-cocoa">
                Loading strategy
              </p>
              <p className="text-body-sm text-charcoal/90 mt-2">
                Inter is self-hosted as a 48 KB latin variable font, preloaded and served from the
                same origin with a metric-matched fallback. The stack already names Noto Sans
                Devanagari for the future Hindi launch.
              </p>
            </Card>
          </div>
        </Demo>

        {/* ----------------------------------------------------------- buttons */}
        <Demo
          id="buttons"
          title="Buttons and links"
          description='One primary action per view. Every button defaults to type="button" so it can never submit a form by accident.'
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Specimen label="Variants">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </Specimen>

            <Specimen label="Sizes">
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </Specimen>

            <Specimen
              label="With icons and states"
              note="The loading state disables the control and sets aria-busy."
            >
              <div className="flex flex-wrap items-center gap-3">
                <Button iconLeft={<HeartIcon size={16} />}>Donate</Button>
                <Button variant="secondary" iconRight={<SearchIcon size={16} />}>
                  Search
                </Button>
                <Button isLoading>Saving</Button>
                <Button disabled>Disabled</Button>
              </div>
            </Specimen>

            <Specimen
              label="Text links"
              note="Underlined by default: colour alone is not an affordance."
            >
              <div className="flex flex-col gap-2">
                <p className="text-body-sm text-charcoal">
                  Read more in the <TextLink href="#buttons">design guidance</TextLink>.
                </p>
                <p className="text-body-sm text-charcoal">
                  External references open in a new tab with a warning for screen readers:{' '}
                  <TextLink href="https://example.com" external>
                    example reference
                  </TextLink>
                </p>
              </div>
            </Specimen>
          </div>

          <Card tone="default" padding="md" className="flex flex-col gap-3">
            <p className="text-[length:var(--text-label)] font-semibold text-cocoa">
              Navigation items
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <NavLink href="#buttons" isActive>
                Active item
              </NavLink>
              <NavLink href="#buttons">Inactive item</NavLink>
              <NavLink href="#buttons">Another item</NavLink>
            </div>
            <p className="text-[length:var(--text-caption)] text-muted">
              The active item is marked with <code>aria-current=&quot;page&quot;</code> plus weight
              and an underline — three cues, not colour alone.
            </p>
          </Card>
        </Demo>

        {/* ------------------------------------------------------------- forms */}
        <Demo
          id="forms"
          title="Forms"
          description="Labels, hints and errors are wired by construction: ids derive from the field name, so no control can be rendered unlabelled."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="lg" className="flex flex-col gap-5">
              <Input
                name="full-name"
                label="Full name"
                placeholder="Your name"
                required
                hint="As you would like it to appear on a receipt."
              />
              <Input
                name="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                required
              />
              <Input
                name="phone"
                type="tel"
                label="Phone number (optional)"
                hint="Only used if we need to contact you about a donation."
                error="Enter a phone number we can reach, or leave this blank."
                defaultValue="+91"
              />
              <Select
                name="purpose"
                label="Donation purpose"
                placeholder="Choose a purpose"
                required
                options={[
                  { value: 'general', label: 'Where it is needed most' },
                  { value: 'fodder', label: 'Fodder and nutrition' },
                  { value: 'medical', label: 'Veterinary care' },
                ]}
                hint="Purposes are managed in the CMS."
              />
              <Textarea
                name="message"
                label="Message (optional)"
                placeholder="Anything you would like us to know"
                hint="Please do not include card details."
              />
            </Card>

            <div className="flex flex-col gap-6">
              <Card padding="lg" className="flex flex-col gap-5">
                <Checkbox
                  name="consent"
                  label="I agree to the privacy notice"
                  description="Required before a donation or enquiry can be submitted."
                  required
                />
                <Checkbox name="receipt" label="Send me a receipt by email" />
                <Checkbox
                  name="disabled-option"
                  label="Disabled option"
                  disabled
                  description="Shown for completeness."
                />
              </Card>

              <Card padding="lg" className="flex flex-col gap-4">
                <RadioGroup
                  name="contact-preference"
                  legend="How should we contact you?"
                  hint="Choose one."
                  options={[
                    {
                      value: 'email',
                      label: 'Email',
                      description: 'Usually within two working days.',
                    },
                    { value: 'phone', label: 'Phone call' },
                    { value: 'none', label: 'Do not contact me' },
                  ]}
                  defaultValue="email"
                />

                <Radio name="standalone-radio" value="example" label="Standalone radio option" />
              </Card>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <FormErrorSummary
              errors={[
                { fieldId: 'email', label: 'Email address', message: 'Enter an email address.' },
                { fieldId: 'purpose', label: 'Donation purpose', message: 'Choose a purpose.' },
              ]}
            />

            <Card tone="muted" padding="md">
              <p className="text-[length:var(--text-label)] font-semibold text-cocoa">
                Error handling rules
              </p>
              <ul className="text-body-sm mt-2 flex list-disc flex-col gap-1.5 pl-5 text-charcoal/90">
                <li>Errors appear next to the field and in a summary at the top.</li>
                <li>The summary receives focus and links to each invalid field.</li>
                <li>Messages say what to do, not just that something is wrong.</li>
                <li>Colour is never the only signal — there is an icon and text.</li>
              </ul>
            </Card>
          </div>
        </Demo>

        {/* ---------------------------------------------------------- feedback */}
        <Demo
          id="feedback"
          title="Alerts, loading and empty states"
          description="Feedback is announced politely except for warnings and errors, which use an assertive live region."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Alert tone="info" title="Informational">
              A neutral message that adds context without demanding action.
            </Alert>
            <Alert tone="success" title="Verified">
              The payment was confirmed by the provider and a receipt has been issued.
            </Alert>
            <Alert tone="warning" title="Needs attention">
              This page is scheduled to publish in 2 days. Review it before then.
            </Alert>
            <Alert tone="danger" title="Could not save">
              The draft was not saved because the connection dropped. Try again.
            </Alert>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Specimen label="Spinner">
              <div className="flex items-center gap-3">
                <Spinner />
                <span className="text-body-sm text-muted">Loading content…</span>
              </div>
            </Specimen>

            <Specimen label="Skeleton">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Specimen>

            <Specimen label="Buttons">
              <Button
                size="sm"
                variant="secondary"
                iconLeft={<Spinner size={14} label="Loading" />}
              >
                Working
              </Button>
            </Specimen>
          </div>

          <EmptyState
            icon={<InboxIcon size={22} />}
            title="Nothing here yet"
            description="When the first enquiries arrive they will appear in this list, newest first."
            action={
              <Button variant="secondary" size="sm">
                Refresh
              </Button>
            }
          />
        </Demo>

        {/* ------------------------------------------------- notification etc */}
        <Demo
          id="feedback-extra"
          title="Pagination, toasts and full-page states"
          description="Navigation for long lists, transient feedback for completed actions, and the two full-panel states a page can fall back to."
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-[length:var(--text-caption)] font-medium tracking-wide text-muted uppercase">
                Pagination
              </p>
              <Card padding="md">
                <Pagination
                  currentPage={3}
                  totalPages={10}
                  hrefFor={(page) => `#page-${String(page)}`}
                />
              </Card>
              <p className="text-[length:var(--text-caption)] text-muted">
                Real links, not buttons, so pages stay crawlable; the current page is marked with
                <code> aria-current=&quot;page&quot;</code>.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[length:var(--text-caption)] font-medium tracking-wide text-muted uppercase">
                Toast notifications
              </p>
              <Card padding="md" className="flex flex-col gap-3">
                <ToastDemo />
                <p className="text-[length:var(--text-caption)] text-muted">
                  Toasts appear bottom-right (bottom-centre on mobile), announce politely, never
                  move focus and dismiss themselves. Warnings and errors are announced assertively.
                </p>
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <ErrorState
                title="We could not load this page"
                description="The connection dropped while loading the content. Try again, and if it keeps happening quote the reference below."
                reference="req_01HX4M2"
                action={
                  <Button variant="secondary" size="sm">
                    Try again
                  </Button>
                }
              />
              <SuccessState
                title="Your message was sent"
                description="Thank you — a member of the team will reply within two working days."
                action={
                  <Button size="sm" variant="secondary">
                    Return home
                  </Button>
                }
              />
            </div>
          </div>
        </Demo>

        {/* ------------------------------------------------------------ content */}
        <Demo
          id="content"
          title="Cards, badges and section headings"
          description="The building blocks for content pages in Phases 4 and 5."
        >
          <SectionHeading
            eyebrow="Example section"
            title="What we do"
            description="A section heading carries an optional eyebrow, a heading and a short description that sets up the cards below."
            actions={
              <ButtonLink href="#content" variant="secondary" size="sm">
                View all
              </ButtonLink>
            }
          />

          <div className="grid gap-6 md:grid-cols-3">
            <Card interactive padding="lg" className="flex flex-col gap-3">
              <Badge tone="brand">Campaign</Badge>
              <p className="text-subheading text-cocoa">Card title</p>
              <p className="text-body-sm text-charcoal/90">
                A card groups one idea. Interactive cards raise their shadow on hover and focus.
              </p>
              <TextLink href="#content" className="mt-auto text-[length:var(--text-label)]">
                Read more
              </TextLink>
            </Card>

            <Card tone="muted" padding="lg" className="flex flex-col gap-3">
              <Badge tone="accent">Priority</Badge>
              <p className="text-subheading text-cocoa">Muted card</p>
              <p className="text-body-sm text-charcoal/90">
                Sand surfaces separate a group of items from the ivory page without adding another
                border.
              </p>
            </Card>

            <Card tone="inverse" padding="lg" className="flex flex-col gap-3">
              <Badge tone="neutral">Contrast</Badge>
              <p className="text-subheading text-ivory">Inverse card</p>
              <p className="text-body-sm text-ivory/85">
                Cocoa surfaces are used sparingly, for emphasis or the footer. Ivory text reaches
                11.6:1 here.
              </p>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="brand">Brand</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success">Published</Badge>
            <Badge tone="warning">Scheduled</Badge>
            <Badge tone="danger">Failed</Badge>
          </div>

          <Card padding="md" className="flex flex-col gap-3">
            <p className="text-[length:var(--text-label)] font-semibold text-cocoa">Dividers</p>
            <Divider spacing="sm" />
            <Divider spacing="sm" label="Or continue with" />
            <Divider spacing="sm" />
          </Card>
        </Demo>

        {/* -------------------------------------------------------------- media */}
        <Demo
          id="media"
          title="Images"
          description="Aspect ratios are reserved before the image loads, so content never jumps. Until authentic photography is supplied, every slot shows a labelled placeholder."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <ImageContainer
              aspect="16/9"
              placeholderLabel="Campaign photograph"
              caption="16:9 — campaign and hero imagery."
            />
            <ImageContainer
              aspect="4/3"
              placeholderLabel="Gaushala photograph"
              caption="4:3 — gallery and article covers."
            />
          </div>

          <Alert tone="warning" title="Placeholder rule">
            A development placeholder must never be mistakable for real Gaushala photography. Stock
            images are never presented as the organisation&apos;s own.
          </Alert>
        </Demo>

        {/* --------------------------------------------------------- navigation */}
        <Demo
          id="navigation"
          title="Navigation and page headers"
          description="Breadcrumbs are a real navigation landmark; the current page is marked and is not a link."
        >
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'News', href: '/news' },
              { label: 'Article title' },
            ]}
          />

          <PageHeader
            title="Page header"
            description="Breadcrumbs, title and a short description establish where the reader is and what the page covers."
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Campaigns', href: '/campaigns' },
              { label: 'Current campaign' },
            ]}
            actions={
              <Button variant="secondary" size="sm">
                Secondary action
              </Button>
            }
          />
        </Demo>

        {/* ------------------------------------------------------------ dialog */}
        <Demo
          id="dialogs"
          title="Dialogs"
          description="Built on the native dialog element: focus trapping, Escape and focus return come from the platform rather than from hand-written JavaScript."
        >
          <DialogDemo />
        </Demo>

        {/* ------------------------------------------------------ accessibility */}
        <Demo
          id="accessibility"
          title="Accessibility commitments"
          description="These are enforced in code and checked in CI, not aspirational."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card padding="md" className="flex flex-col gap-2">
              <p className="text-[length:var(--text-label)] font-semibold text-cocoa">Focus</p>
              <p className="text-body-sm text-charcoal/90">
                A 2 px cocoa outline with a 2 px offset on every focusable element. Cocoa reaches
                11.6:1 on ivory and 8.7:1 on sand, clearing the 3:1 non-text contrast requirement.
              </p>
            </Card>

            <Card padding="md" className="flex flex-col gap-2">
              <p className="text-[length:var(--text-label)] font-semibold text-cocoa">Motion</p>
              <p className="text-body-sm text-charcoal/90">
                Transitions are 150–250 ms and every animation is disabled when the operating system
                requests reduced motion.
              </p>
            </Card>

            <Card padding="md" className="flex flex-col gap-2">
              <p className="text-[length:var(--text-label)] font-semibold text-cocoa">Targets</p>
              <p className="text-body-sm text-charcoal/90">
                Interactive controls are at least 44 px tall and spaced so touch targets never
                overlap.
              </p>
            </Card>

            <Card padding="md" className="flex flex-col gap-2">
              <p className="text-[length:var(--text-label)] font-semibold text-cocoa">Meaning</p>
              <p className="text-body-sm text-charcoal/90">
                Status is expressed with text and an icon before colour is used.
              </p>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DonateCta size="md" />
            <Button variant="ghost" iconLeft={<CheckCircleIcon size={16} />}>
              A ghost action
            </Button>
          </div>
        </Demo>
      </main>

      <SiteFooter
        columns={FOOTER_NAV}
        tagline="Design-system preview. Organisation content is supplied and approved before launch."
        contact={<FooterContact lines={[]} />}
        legalNote={
          <span className="text-[length:var(--text-caption)] text-ivory/60">
            Internal reference page · not indexed
          </span>
        }
      />

      <StickyDonateCta />
    </>
  );
}
