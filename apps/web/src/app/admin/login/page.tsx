import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/admin';

import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const session = await getSession();

  if (session !== null) {
    redirect('/admin');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-2">
          <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.16em] text-terracotta-ink uppercase">
            Shri Vanshidhar Gaushala
          </p>
          <h1 className="text-title text-cocoa">Admin sign in</h1>
          <p className="text-body-sm text-charcoal/80">
            Authorised staff only. Accounts are created by invitation.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-sand bg-white p-6 shadow-soft">
          <LoginForm />
        </div>

        <p className="mt-6 text-[length:var(--text-caption)] text-muted">
          Sessions expire automatically. If you have lost access, ask a Super Admin to reset your
          account.
        </p>
      </div>
    </main>
  );
}
