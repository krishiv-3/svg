import type { Metadata } from 'next';

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
} from '@/components/homepage';
import { getHomepageContent } from '@/content';

/**
 * Homepage.
 *
 * A server component: the content is resolved once per request (later: per
 * revalidation window) and every section below is rendered on the server. The
 * only client JavaScript on this page is the floating header, the mobile menu,
 * the gallery lightbox and the sticky donation bar.
 *
 * `robots: noindex` is intentional. The site is a preview build with
 * demonstration content and has not been approved for indexing.
 */

// Rendered on demand: content lives in the database, so the build must not
// require a running API. The content loaders cache their fetches instead.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getHomepageContent();

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: '/' },
    robots: { index: false, follow: false },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: '/',
      siteName: 'Shri Vanshidhar Gaushala',
      locale: 'en_IN',
      type: 'website',
    },
  };
}

export default async function HomePage() {
  const content = await getHomepageContent();

  return (
    <>
      <HeroSection hero={content.hero} />
      <AboutSection about={content.about} />
      <ActivitiesSection activities={content.activities} />
      <ImpactSection impact={content.impact} />
      <DonateStrip strip={content.donateStrip} />
      <CampaignsSection campaigns={content.campaigns} />
      <NewsSection news={content.news} />
      <EventsSection events={content.events} />
      <GallerySection gallery={content.gallery} />
      <TestimonialsSection testimonials={content.testimonials} />
      <FinalCtaSection finalCta={content.finalCta} />
    </>
  );
}
