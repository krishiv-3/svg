import { Container, Section, StatisticCard } from '@/components/ui';

import type { HomepageImpact } from '@/content';

/**
 * Impact.
 *
 * A single cocoa panel gives the page a darker beat between light sections. The
 * numbers are large and tabular; every one carries a note about its evidence,
 * and the section states plainly that the figures are illustrative. No statistic
 * is ever published without its provenance line.
 */
export function ImpactSection({ impact }: { impact: HomepageImpact }) {
  return (
    <Section id="impact" aria-labelledby="impact-heading">
      <Container>
        <div className="bg-cocoa relative overflow-hidden rounded-[2rem] px-6 py-10 text-ivory sm:px-10 sm:py-12 lg:px-12">
          <div
            aria-hidden="true"
            className="bg-[image:var(--gradient-hero-glow)] pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full opacity-70 blur-3xl"
          />

          <div className="relative flex flex-col gap-8">
            <div className="max-w-[54ch]">
              {impact.eyebrow === undefined ? null : (
                <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.16em] text-ivory/60 uppercase">
                  {impact.eyebrow}
                </p>
              )}
              <h2 id="impact-heading" className="text-title mt-2 text-ivory">
                {impact.heading}
              </h2>
              {impact.description === undefined ? null : (
                <p className="text-body-sm mt-3 text-ivory/75">{impact.description}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {impact.stats.map((statistic) => (
                <StatisticCard
                  key={statistic.id}
                  tone="inverse"
                  value={statistic.value}
                  {...(statistic.unit === undefined ? {} : { unit: statistic.unit })}
                  label={statistic.label}
                  note={statistic.note}
                />
              ))}
            </div>

            <p className="text-[length:var(--text-caption)] text-ivory/55">{impact.footnote}</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
