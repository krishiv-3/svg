import { Container, Section, SectionHeading, TestimonialCard } from '@/components/ui';

import type { HomepageTestimonials } from '@/content';

/**
 * Testimonials.
 *
 * Editorial quote cards. Attribution is a display name plus optional context,
 * and the section states that the examples are fictional — no real person is
 * quoted and no endorsement is implied.
 */
export function TestimonialsSection({ testimonials }: { testimonials: HomepageTestimonials }) {
  return (
    <Section id="testimonials" tone="muted" aria-labelledby="testimonials-heading">
      <Container className="flex flex-col gap-9">
        <SectionHeading
          id="testimonials-heading"
          level={2}
          {...(testimonials.eyebrow === undefined ? {} : { eyebrow: testimonials.eyebrow })}
          title={testimonials.heading}
          {...(testimonials.description === undefined
            ? {}
            : { description: testimonials.description })}
        />

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.items.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              quote={testimonial.quote}
              name={testimonial.name}
              {...(testimonial.context === undefined ? {} : { context: testimonial.context })}
            />
          ))}
        </div>

        <p className="text-[length:var(--text-caption)] text-muted">{testimonials.footnote}</p>
      </Container>
    </Section>
  );
}
