import Link from 'next/link';

import { TestimonialForm } from '@/components/admin/batch2-forms';

export const dynamic = 'force-dynamic';

export default function NewTestimonialPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link
          href="/admin/testimonials"
          className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
        >
          ← Testimonials
        </Link>
        <h1 className="text-title text-cocoa">New testimonial</h1>
        <p className="text-body-sm text-charcoal/80">
          Only record words the supporter actually gave, with the consent you hold.
        </p>
      </header>

      <div className="rounded-2xl border border-sand bg-white p-5 shadow-soft sm:p-6">
        <TestimonialForm mode="create" />
      </div>
    </div>
  );
}
