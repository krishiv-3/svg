'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, Input } from '@/components/ui';

/**
 * Login form.
 *
 * Posts to the same-origin proxy, which forwards the credentials to the API and
 * returns the session as an HttpOnly, SameSite=strict cookie. No token is ever
 * stored in JavaScript.
 */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);

        void (async () => {
          try {
            const response = await fetch('/api/admin/auth/login', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
              setError(
                response.status === 429
                  ? 'Too many attempts. Wait a few minutes and try again.'
                  : 'Invalid email or password.',
              );
              return;
            }

            router.replace('/admin');
            router.refresh();
          } catch {
            setError('The admin service is unavailable. Try again shortly.');
          } finally {
            setBusy(false);
          }
        })();
      }}
    >
      <Input
        name="email"
        type="email"
        label="Email address"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
        }}
      />

      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
        }}
      />

      {error === null ? null : (
        <p role="alert" className="text-[length:var(--text-body-sm)] text-danger">
          {error}
        </p>
      )}

      <Button type="submit" size="md" isLoading={busy} fullWidth>
        Sign in
      </Button>
    </form>
  );
}
