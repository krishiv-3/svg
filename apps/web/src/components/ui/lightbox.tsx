'use client';

import { useEffect, useRef } from 'react';

import { ChevronRightIcon, CloseIcon } from '../icons';
import { ImageContainer } from './image-container';

/**
 * Gallery lightbox.
 *
 * Built on the native `<dialog>` element, so focus trapping, `Escape` handling
 * and focus restoration to the trigger all come from the platform rather than
 * from hand-written JavaScript. Arrow keys move between items.
 *
 * It never renders a remote image unless the item actually has a `src`; with no
 * approved photography it shows the same labelled placeholder as the grid, so the
 * interaction can be reviewed without fabricating imagery.
 */

export interface LightboxItem {
  readonly id: string;
  readonly caption: string;
  readonly category?: string;
  readonly src?: string;
  readonly alt?: string;
}

export interface LightboxProps {
  items: readonly LightboxItem[];
  /** `null` keeps the dialog closed. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Accessible name for the dialog. */
  label?: string;
}

export function Lightbox({
  items,
  index,
  onClose,
  onIndexChange,
  label = 'Gallery image viewer',
}: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (index === null && dialog.open) {
      dialog.close();
      return;
    }

    if (index !== null && !dialog.open) {
      dialog.showModal();
    }
  }, [index]);

  const item = index === null ? undefined : items[index];
  const total = items.length;

  const go = (delta: number): void => {
    if (index === null) return;
    const next = (index + delta + total) % total;
    onIndexChange(next);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      className="m-auto max-h-[92vh] w-[min(94vw,56rem)] overflow-y-auto rounded-3xl border border-glass-border-soft bg-ivory p-0 shadow-overlay"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          go(1);
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          go(-1);
        }
      }}
    >
      {item === undefined ? null : (
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <p className="text-[length:var(--text-caption)] text-muted tabular-nums">
              {index === null ? 0 : index + 1} of {total}
            </p>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close image viewer"
              className="text-cocoa hover:bg-sand/60 flex h-9 w-9 items-center justify-center rounded-full"
            >
              <CloseIcon size={18} />
            </button>
          </div>

          <div className="overflow-hidden border-y border-sand">
            <ImageContainer
              {...(item.src === undefined ? {} : { src: item.src })}
              {...(item.alt === undefined ? {} : { alt: item.alt })}
              aspect="16/9"
              placeholderLabel={item.caption}
              priority
              flush
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-[length:var(--text-label)] font-medium text-cocoa">
                {item.caption}
              </p>
              {item.category === undefined ? null : (
                <p className="text-[length:var(--text-caption)] text-muted">{item.category}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  go(-1);
                }}
                aria-label="Previous image"
                className="text-cocoa hover:bg-sand/60 flex h-10 w-10 items-center justify-center rounded-full border border-sand"
              >
                <ChevronRightIcon size={18} className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => {
                  go(1);
                }}
                aria-label="Next image"
                className="text-cocoa hover:bg-sand/60 flex h-10 w-10 items-center justify-center rounded-full border border-sand"
              >
                <ChevronRightIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
