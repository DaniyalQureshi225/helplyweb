import Link from 'next/link';
import { ArrowRight, Clock3, MapPin, Mic, ShieldCheck, Sparkles } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { CtaBand, ServiceCards } from '@/components/marketing/sections';
import { Card, LinkButton, SectionHeading } from '@/components/ui/primitives';
import { getQrCatalog, FEATURED_QR_CODE } from '@/lib/serverApi';
import { formatPkr } from '@/lib/utils';

export const metadata = {
  title: 'Services',
  description:
    'Explore live HELPY service categories at partner venues — luggage help, mobility assistance, family support, local guidance and more.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const catalog = await getQrCatalog();
  const pricing = catalog?.pricing;
  const location = catalog?.location;

  return (
    <MarketingShell>
      <section className="border-b border-navy-100 bg-white">
        <div className="container-page py-14 sm:py-20">
          <p className="eyebrow">Services</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Live help, tailored to where you are
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-600">
            HELPY services are configured by each venue. The list below is pulled from a live partner location — the
            exact options you see after scanning will match your venue.
          </p>
          {location ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-navy-100 bg-sand-50 px-3.5 py-1.5 text-xs font-medium text-navy-600">
              <MapPin className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
              Showing services at {location.name}
            </p>
          ) : null}
          <div className="mt-7 flex flex-wrap gap-3">
            <LinkButton href="/get-assistance">
              Get assistance
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
            <LinkButton href="/how-it-works" variant="secondary">
              See how it works
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page">
          {catalog?.categories?.length ? (
            <ServiceCards categories={catalog.categories} pricing={pricing} />
          ) : (
            <Card className="mx-auto max-w-2xl p-8 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-semibold">The live catalogue is not available right now</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-navy-600">
                Service categories are loaded directly from HELPY partner venues. Scan the QR code at your location to
                see the services offered there, or ask the front desk.
              </p>
              {FEATURED_QR_CODE ? (
                <p className="mt-3 text-xs text-navy-400">
                  Demo catalogue key: <code className="rounded bg-navy-50 px-1.5 py-0.5">{FEATURED_QR_CODE}</code>
                </p>
              ) : null}
              <LinkButton href="/get-assistance" className="mt-5" size="sm">
                How to open your venue
              </LinkButton>
            </Card>
          )}
        </div>
      </section>

      <section className="border-y border-navy-100 bg-white py-14 sm:py-20">
        <div className="container-page grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Simple time blocks</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">
              {pricing
                ? `Services are billed in ${pricing.unitMinutes}-minute blocks at ${formatPkr(pricing.unitPricePkr)} per block.`
                : 'Services are billed in server-calculated time blocks. The live rate appears after you scan.'}
            </p>
            <p className="mt-3 text-xs text-navy-500">No hidden add-ons. No browser-side calculation.</p>
          </Card>
          <Card className="p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Verified people</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">
              Helpers are assigned by venue administrators and must be active and qualified for the selected service.
            </p>
            <p className="mt-3 text-xs text-navy-500">Every assignment and status change is audit-logged.</p>
          </Card>
          <Card className="p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Mic className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Recording with consent</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">
              {catalog?.policies?.recordingRequired
                ? 'This venue records services for safety and dispute resolution. Consent is requested before your request is created.'
                : 'Recording is optional at this venue. Consent is always explicit and can be declined.'}
            </p>
            <Link href="/privacy" className="link-subtle mt-3 inline-flex items-center gap-1 text-xs">
              Read the privacy policy
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Card>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Not sure what to ask for?"
            title="Describe it in your own words"
            description="Every request includes an optional note. Tell the team what would make your visit easier — a wheelchair, luggage help, a quiet place to wait, or directions."
            align="center"
          />
          <div className="mt-6 text-center">
            <LinkButton href="/get-assistance" variant="accent">
              Open the assistance page
            </LinkButton>
          </div>
        </div>
      </section>

      <CtaBand />
    </MarketingShell>
  );
}
