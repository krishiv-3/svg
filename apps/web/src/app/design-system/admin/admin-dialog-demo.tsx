'use client';

import { useState } from 'react';

import { ConfirmDialog } from '@/components/admin';
import { Button } from '@/components/ui';

/** Destructive-action confirmation demo for the admin reference page. */
export function AdminDialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => {
          setOpen(true);
        }}
      >
        Delete sample item
      </Button>

      <ConfirmDialog
        open={open}
        title="Delete “Sample item 01”?"
        description="The item and its revision history will be removed. This cannot be undone."
        confirmLabel="Delete item"
        onConfirm={() => {
          setOpen(false);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
