'use client';

import { Button, Dialog } from '@/components/ui';

/**
 * Confirmation dialog for destructive or irreversible actions.
 *
 * Contract:
 *  - the dialog describes exactly what will happen, naming the object;
 *  - the destructive action is never the default focus, and is visually
 *    distinct (danger variant);
 *  - cancelling is always available and is the safe, easy path.
 *
 * A JSON placeholder is not used here: the caller supplies the object name so
 * the sentence reads "Delete “Winter fodder drive”?" rather than "Are you sure?".
 */

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} size="md" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
