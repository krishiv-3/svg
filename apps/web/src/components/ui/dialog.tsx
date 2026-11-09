'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { CloseIcon } from '../icons';
import { Button } from './button';

/**
 * Dialog foundation.
 *
 * Built on the native `<dialog>` element opened with `showModal()`, which gives
 * us — correctly and for free — a focus trap, `Escape` handling, inert
 * background content and a real top layer. Re-implementing those behaviours in
 * JavaScript is the usual source of modal accessibility bugs.
 *
 * Accessibility contract:
 *  - labelled by its title, optionally described by its description;
 *  - the close button has an accessible name;
 *  - clicking the backdrop closes it, as does `Escape`;
 *  - background scrolling is locked while open, and restored afterwards.
 */

export type DialogSize = 'sm' | 'md' | 'lg';

const SIZES: Record<DialogSize, string> = {
  sm: 'w-[min(92vw,26rem)]',
  md: 'w-[min(92vw,32rem)]',
  lg: 'w-[min(92vw,44rem)]',
};

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Actions row, right-aligned. */
  footer?: ReactNode;
  size?: DialogSize;
  /** Hides the corner close button (the footer must then offer a cancel). */
  hideCloseButton?: boolean;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideCloseButton = false,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Keep the native element in sync with React state.
  useEffect(() => {
    const element = dialogRef.current;
    if (element === null) return;

    if (open && !element.open) {
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  // Native close (Escape) must inform React.
  useEffect(() => {
    const element = dialogRef.current;
    if (element === null) return;

    const handleClose = (): void => {
      onClose();
    };

    element.addEventListener('close', handleClose);
    return () => {
      element.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  // Lock background scrolling while the modal is open.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...(description === undefined ? {} : { 'aria-describedby': descriptionId })}
      className={cn(
        'm-auto max-h-[85vh] overflow-y-auto rounded-2xl border border-sand bg-white p-0',
        'shadow-overlay',
        SIZES[size],
        className,
      )}
      // Click on the backdrop resolves to the dialog element itself.
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <h2 id={titleId} className="text-subheading text-cocoa">
            {title}
          </h2>
          {description === undefined ? null : (
            <p id={descriptionId} className="text-body-sm text-muted">
              {description}
            </p>
          )}
        </div>

        {hideCloseButton ? null : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="-mt-1 -mr-1 shrink-0 px-2"
            aria-label="Close dialog"
          >
            <CloseIcon size={18} />
          </Button>
        )}
      </div>

      {children === undefined ? null : (
        <div className="px-5 pb-5 text-body-sm text-charcoal sm:px-6 sm:pb-6">{children}</div>
      )}

      {footer === undefined ? null : (
        <div className="flex flex-col-reverse gap-2 border-t border-sand bg-ivory/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </div>
      )}
    </dialog>
  );
}
