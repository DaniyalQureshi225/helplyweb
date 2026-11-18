'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RotateCcw } from 'lucide-react';
import { Logo } from '@/components/ui/brand';
import { Button, LinkButton } from '@/components/ui/primitives';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Surface the digest for server logs; never render raw internals to users.
    if (error?.digest) console.error('HELPY page error digest:', error.digest);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <Logo className="justify-center" />
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-semibold">We hit an unexpected snag.</h1>
        <p className="mt-3 text-sm leading-relaxed text-navy-600">
          Your request was not completed. Please try again. If this keeps happening, contact HELPY support and share
          the time this occurred.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <LinkButton href="/" variant="secondary">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go to home
          </LinkButton>
        </div>
        <p className="mt-8 text-xs text-navy-400">
          Need help now?{' '}
          <Link href="/contact" className="link-subtle">
            Contact support
          </Link>
        </p>
      </div>
    </main>
  );
}
