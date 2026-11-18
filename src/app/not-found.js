import Link from 'next/link';
import { Compass, Home, LifeBuoy } from 'lucide-react';
import { Logo } from '@/components/ui/brand';
import { LinkButton } from '@/components/ui/primitives';

export const metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <Link href="/" aria-label="HELPY home" className="inline-flex">
          <Logo />
        </Link>
        <p className="mt-10 text-6xl font-semibold tracking-tight text-navy-200">404</p>
        <h1 className="mt-2 text-3xl font-semibold">This page is not here.</h1>
        <p className="mt-3 text-sm leading-relaxed text-navy-600">
          The link may be old or mistyped. If you scanned a HELPY QR code, scan it again to open the correct service
          page.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <LinkButton href="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go home
          </LinkButton>
          <LinkButton href="/services" variant="secondary">
            <Compass className="h-4 w-4" aria-hidden="true" />
            Explore services
          </LinkButton>
          <LinkButton href="/contact" variant="ghost">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Get support
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
