'use client';

import { useState } from 'react';

import { ConfirmDialog } from '@/components/admin';
import { Button, Dialog } from '@/components/ui';

/**
 * Interactive dialog demonstrations for the design-system page.
 *
 * Kept in a small client island so the surrounding documentation page can stay
 * a server component.
 */
export function DialogDemo() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        onClick={() => {
          setDialogOpen(true);
        }}
      >
        Open dialog
      </Button>

      <Button
        variant="danger"
        onClick={() => {
          setConfirmOpen(true);
        }}
      >
        Open confirm dialog
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}
        title="Dialog title"
        description="A short description of what this dialog does."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <p>
          Dialog content goes here. Focus is trapped inside the dialog, Escape closes it, and focus
          returns to the control that opened it.
        </p>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete “Sample document”?"
        description="This removes the document and its revision history. This action cannot be undone."
        confirmLabel="Delete document"
        onConfirm={() => {
          setConfirmOpen(false);
        }}
        onCancel={() => {
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
