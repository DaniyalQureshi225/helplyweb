import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from '@/components/ui/brand';

export function SiteFooter({ support }) {
  const email = support?.supportEmail || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@helply.pk';
  const phone = support?.supportPhone || process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+92 300 000 0000';

  return (
    <footer className="bg-navy-950 text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo color="white" showTagline />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
            Thoughtful assistance for guests on the move — at hotels, malls, airports and public places across
            Pakistan.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Explore</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              ['Home', '/'],
              ['How It Works', '/how-it-works'],
              ['Services', '/services'],
              ['About Us', '/about'],
              ['Contact', '/contact'],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-white/70 transition hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">For guests</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              ['Get assistance', '/get-assistance'],
              ['Track a request', '/get-assistance'],
              ['Privacy policy', '/privacy'],
              ['Terms of service', '/terms'],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="text-white/70 transition hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />
              <a href={`mailto:${email}`} className="break-all transition hover:text-white">
                {email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />
              <a href={`tel:${String(phone).replace(/[^\d+]/g, '')}`} className="transition hover:text-white">
                {phone}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />
              <span>Serving partner venues across Pakistan</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} HELPY. All rights reserved.</p>
          <p>Your Comfort, Our Priority.</p>
        </div>
      </div>
    </footer>
  );
}
