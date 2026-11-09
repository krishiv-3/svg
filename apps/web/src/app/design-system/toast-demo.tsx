'use client';

import { useState } from 'react';

import { Button, Toast, ToastRegion, type ToastTone } from '@/components/ui';

/**
 * Toast demonstration.
 *
 * Toasts auto-dismiss after a few seconds and never move focus. The container is
 * a polite live region; failure toasts use an assertive role.
 */

interface DemoToast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

let nextId = 1;

export function ToastDemo() {
  const [toasts, setToasts] = useState<DemoToast[]>([]);

  const push = (tone: ToastTone, title: string, description?: string): void => {
    const id = nextId;
    nextId += 1;

    setToasts((current) => [
      ...current,
      { id, tone, title, ...(description === undefined ? {} : { description }) },
    ]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 6000);
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            push('success', 'Draft saved', 'Your changes were saved a moment ago.');
          }}
        >
          Show success toast
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            push('danger', 'Could not publish', 'Check the highlighted fields and try again.');
          }}
        >
          Show error toast
        </Button>

        <Button
          variant="ghost"
          onClick={() => {
            setToasts([]);
          }}
        >
          Clear
        </Button>
      </div>

      <ToastRegion>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            tone={toast.tone}
            title={toast.title}
            {...(toast.description === undefined ? {} : { description: toast.description })}
            onDismiss={() => {
              setToasts((current) => current.filter((item) => item.id !== toast.id));
            }}
          />
        ))}
      </ToastRegion>
    </>
  );
}
