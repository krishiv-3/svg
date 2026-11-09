import type { Metadata } from 'next';

import { CheckCircleIcon, HeartIcon, ReceiptIcon } from '@/components/icons';
import { Alert, ButtonLink, Container, Section } from '@/components/ui';

/**
 * Donation page — navigation placeholder.
 *
 * Every Donate call to action on the site points here, so the most important
 * journey must never end in a 404. Online giving is not enabled: the payment
 * gateway is integrated and verified in a later phase. This page therefore
 * explains the status honestly, lists what will be available, and collects
 * nothing — no form, no card fields, no simulated checkout.
 */

export const metadata: Metadata = {
  title: 'Donate',
  description:
    'Online donations for Shri Vanshidhar Gaushala are not open yet. This preview build does not process payments.',
  robots: { index: false, follow: false },
};

const COMING: ReadonlyArray<{ icon: 'receipt' | 'check'; title: string; body: string }> = [
  {
    icon: 'receipt',
    title: 'A receipt for every donation',
    body: 'Each contribution will be recorded and acknowledged, so you know what was received and when.',
  },
  {
    icon: 'check',
    title: 'A verified payment channel',
    body: 'Payments will run only through the approved gateway, once it has been integrated and tested.',
  },
];

export default function DonatePage() {
  return (
    <Section spacing="spacious">
      <Container>
        <div className="mx-auto flex max-w-[46rem] flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.16em] text-terracotta-ink uppercase">
              Support the gaushala
            </p>
            <h1 className="text-title text-cocoa">Donate</h1>
            <p className="text-lead text-charcoal/90">
              Fodder, water, veterinary care and the upkeep of the shelter all depend on regular
              support. Online giving will open here.
            </p>
          </div>

          <Alert tone="warning" title="Online donations are not open yet">
            This is a preview build. No payment is processed, no card details are collected, and no
            donation is recorded. Nothing on this page accepts money.
          </Alert>

          <div className="grid gap-4 sm:grid-cols-2">
            {COMING.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-2 rounded-2xl border border-sand bg-white p-5 shadow-soft"
              >
                <span className="bg-[image:var(--gradient-icon-tile)] ring-1 ring-white/60 ring-inset flex h-11 w-11 items-center justify-center rounded-xl text-terracotta-ink">
                  {item.icon === 'receipt' ? (
                    <ReceiptIcon size={20} />
                  ) : (
                    <CheckCircleIcon size={20} />
                  )}
                </span>
                <h2 className="text-subheading text-cocoa">{item.title}</h2>
                <p className="text-body-sm text-charcoal/90">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-sand bg-ivory/70 p-5">
            <h2 className="text-subheading text-cocoa">In the meantime</h2>
            <p className="text-body-sm mt-1.5 max-w-[52ch] text-charcoal/90">
              Verified contact details and any offline giving arrangements will be published once
              the organisation confirms them. Until then this page intentionally shares no account
              numbers, phone numbers or addresses.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <ButtonLink href="/" size="md" variant="secondary">
              Back to the homepage
            </ButtonLink>
            <ButtonLink
              href="/our-work"
              size="md"
              variant="outline"
              iconLeft={<HeartIcon size={16} />}
            >
              See our work
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
