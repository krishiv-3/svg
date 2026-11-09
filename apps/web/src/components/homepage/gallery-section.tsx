import { ButtonLink, Container, Section, SectionHeading } from '@/components/ui';
import { GalleryGrid } from '@/components/site/gallery-grid';

import type { HomepageGallery } from '@/content';

/**
 * Homepage gallery preview.
 *
 * The grid and lightbox themselves live in `GalleryGrid`, shared with `/gallery`,
 * so the interaction is implemented once.
 */
export function GallerySection({ gallery }: { gallery: HomepageGallery }) {
  return (
    <Section id="gallery" aria-labelledby="gallery-heading">
      <Container className="flex flex-col gap-9">
        <SectionHeading
          id="gallery-heading"
          level={2}
          {...(gallery.eyebrow === undefined ? {} : { eyebrow: gallery.eyebrow })}
          title={gallery.heading}
          {...(gallery.description === undefined ? {} : { description: gallery.description })}
          actions={
            <ButtonLink href={gallery.link.href} variant="outline" size="sm">
              {gallery.link.label}
            </ButtonLink>
          }
        />

        <GalleryGrid items={gallery.items} />

        <p className="text-[length:var(--text-caption)] text-muted">{gallery.footnote}</p>
      </Container>
    </Section>
  );
}
