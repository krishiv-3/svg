'use client';

import { useState } from 'react';

import { GalleryCard, Lightbox } from '@/components/ui';

import type { GalleryRecord } from '@/content/library';

/**
 * Gallery grid with lightbox.
 *
 * Shared by the homepage preview and `/gallery` so there is one implementation
 * of the interaction. Each tile is a real button layered over the card, giving a
 * single keyboard-reachable control with a descriptive label; the lightbox owns
 * Escape, arrow keys and focus restoration.
 */
export interface GalleryGridProps {
  items: readonly GalleryRecord[];
  /** Overrides the accessible name of the viewer dialog. */
  viewerLabel?: string;
}

export function GalleryGrid({ items, viewerLabel }: GalleryGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.id} className="relative">
            <GalleryCard
              caption={item.caption}
              category={item.category}
              imageLabel={item.image.label}
            />

            <button
              type="button"
              onClick={() => {
                setOpenIndex(index);
              }}
              aria-label={`View “${item.caption}” larger`}
              className="focus-visible:outline-cocoa absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
            />
          </li>
        ))}
      </ul>

      <Lightbox
        items={items.map((item) => ({
          id: item.id,
          caption: item.caption,
          category: item.category,
          ...(item.image.src === undefined ? {} : { src: item.image.src }),
          ...(item.image.alt === undefined ? {} : { alt: item.image.alt }),
        }))}
        index={openIndex}
        onClose={() => {
          setOpenIndex(null);
        }}
        onIndexChange={setOpenIndex}
        {...(viewerLabel === undefined ? {} : { label: viewerLabel })}
      />
    </>
  );
}
