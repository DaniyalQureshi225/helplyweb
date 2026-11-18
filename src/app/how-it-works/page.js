import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  ClipboardCheck,
  CreditCard,
  FileText,
  HeartHandshake,
  Mic,
  QrCode,
  ShieldCheck,
  Star,
  Timer,
} from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { CtaBand, HowItWorks } from '@/components/marketing/sections';
import { Card, LinkButton, SectionHeading } from '@/components/ui/primitives';
import { getPricing } from '@/lib/serverApi';
import { formatPkr } from '@/lib/utils';

export const metadata = {
  title: 'How It Works',
  description:
    'See the full HELPY journey: scan a QR code, request a verified helper, track the service live, review the server-calculated bill, and share feedback.',
  alternates: { canonical: '/how-it-works' },
};

const STAGES = [
  {
    status: 'CREATED',
    label: 'Requested',
    icon: ClipboardCheck,
    description: 'Your request is created with the venue, service category and your note. You can cancel while it waits.',
  },
  {
    status: 'ASSIGNED',
    label: 'Helper assigned',
    icon: BadgeCheck,
    description: 'An administrator assigns a qualified, active helper. You can see that help is on the way.',
  },
  {
    status: 'IN_PROGRESS',
    label: 'In progress',
    icon: Timer,
    description: 'The helper starts the service with a server timestamp. The timer is controlled by the backend, not the browser.',
  },
  {
    status: 'COMPLETED',
    label: 'Completed',
    icon: CalendarCheck2,
    description: 'The service ends, your bill is generated from the real duration, and your review becomes available.',
  },
];

export default async function HowItWorksPage() {
  const pricing = await getPricing();
  const unitMinutes = pricing?.unitMinutes ?? 70;
  const unitPricePkr = pricing?.unitPricePkr ?? 500;

  return (
    <MarketingShell>
      <section className="border-b border-navy-100 bg-white">
        <div className="container-page py-14 sm:py-20">
          <p className="eyebrow">The HELPY journey</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            From a scan to a service you can trust
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-600">
            HELPY keeps the process simple for you and accountable behind the scenes. Here is exactly what happens at
            every stage — including consent, billing and feedback.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <LinkButton href="/get-assistance">
              Start with a QR code
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
            <LinkButton href="/services" variant="secondary">
              View services
            </LinkButton>
          </div>
        </div>
      </section>

      <HowItWorks compact />

      <section className="border-y border-navy-100 bg-white py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Live status"
            title="One clear path, no invented stages"
            description="Every request follows the same lifecycle. Status changes happen on the server and are reflected instantly in your tracking page."
          />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <li key={stage.status} className="relative rounded-2xl border border-navy-100 bg-sand-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-navy-800 shadow-sm">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold text-navy-400">STEP {index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{stage.label}</h3>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-teal-700">{stage.status}</p>
                  <p className="mt-2 text-sm leading-relaxed text-navy-600">{stage.description}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <Card className="p-6 sm:p-8">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Mic className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">Consent comes first</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">
              Venues that record services must disclose it before you request help. You will see the exact retention
              period and disclosure text. Recording starts only after consent is recorded by the server, and a visible
              indicator appears while it is active.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-navy-700">
              {[
                'You can decline — you will be told if that prevents a request at this venue.',
                'Recording stops automatically when the service ends.',
                'Playback is admin-only, reason-logged, and uses short-lived signed links.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 sm:p-8">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">Billing you can verify</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">
              The server records the start and end of your service and calculates the bill in {unitMinutes}-minute
              blocks. Nothing in the browser can change the final amount.
            </p>
            <div className="mt-4 rounded-xl bg-navy-50 p-4 text-sm text-navy-700">
              <p className="font-semibold text-navy-900">Worked example</p>
              <p className="mt-1">
                A 68-minute service uses one {unitMinutes}-minute block: {formatPkr(unitPricePkr)}. A 71-minute service
                uses two blocks: {formatPkr(unitPricePkr * 2)}.
              </p>
              <p className="mt-2 text-xs text-navy-500">
                Example only. Your actual time and amount are calculated by the HELPY server.
              </p>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-navy-700">
              {[
                'Cash payments are recorded by venue staff.',
                'Digital payments stay pending until an administrator confirms them.',
                'Tips are optional and only counted once the service payment is confirmed.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="border-y border-navy-100 bg-white py-16 sm:py-20">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="After the service"
              title="Your review shapes better help"
              description="Rate the service from one to five stars and add optional voice feedback. Tips are entirely your choice."
            />
            <ul className="mt-6 space-y-3 text-sm text-navy-700">
              {[
                ['Star rating', 'One to five stars, with an optional written or voice note.'],
                ['Optional tip', 'No tip, Rs. 50, Rs. 100, Rs. 200, or a custom amount — confirmed before it is sent.'],
                ['Verified impact', 'Tips and reviews count only after verification, so helper incentives stay fair.'],
              ].map(([title, text]) => (
                <li key={title} className="flex gap-3">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                  <span>
                    <span className="font-semibold text-navy-900">{title}.</span> {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">Need a hand right now?</p>
                <p className="text-xs text-navy-500">Open the assistance page and follow the QR steps.</p>
              </div>
            </div>
            <LinkButton href="/get-assistance" className="mt-5 w-full" size="sm">
              <QrCode className="h-4 w-4" aria-hidden="true" />
              Get assistance
            </LinkButton>
            <p className="mt-3 text-center text-xs text-navy-500">
              Prefer to talk?{' '}
              <Link href="/contact" className="link-subtle">
                Contact support
              </Link>
            </p>
          </Card>
        </div>
      </section>

      <CtaBand />
    </MarketingShell>
  );
}
