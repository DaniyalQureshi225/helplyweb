import Link from 'next/link';
import {
  Accessibility,
  ArrowRight,
  Baby,
  BellRing,
  Briefcase,
  Car,
  CheckCircle2,
  Clock3,
  Compass,
  CreditCard,
  HeartHandshake,
  HeartPulse,
  Luggage,
  MapPin,
  Mic,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { formatPkr } from '@/lib/utils';
import { Badge, Card, LinkButton, SectionHeading } from '@/components/ui/primitives';
import { Faq } from './faq';

const ICONS = [
  { keys: ['luggage', 'bag', 'baggage'], icon: Luggage },
  { keys: ['wheel', 'accessib', 'mobility'], icon: Accessibility },
  { keys: ['medical', 'health', 'first aid'], icon: HeartPulse },
  { keys: ['child', 'baby', 'kid', 'family'], icon: Baby },
  { keys: ['shop', 'retail', 'personal'], icon: ShoppingBag },
  { keys: ['transport', 'car', 'pickup', 'drop'], icon: Car },
  { keys: ['guide', 'navigat', 'escort', 'direction'], icon: Compass },
  { keys: ['concierge', 'front desk', 'bell'], icon: BellRing },
  { keys: ['business', 'work', 'corporate'], icon: Briefcase },
];

export function serviceIcon(category) {
  const haystack = `${category?.slug ?? ''} ${category?.name ?? ''}`.toLowerCase();
  const match = ICONS.find((entry) => entry.keys.some((key) => haystack.includes(key)));
  return match?.icon ?? Sparkles;
}

export function Hero({ pricing }) {
  const unitMinutes = pricing?.unitMinutes ?? 70;
  const unitPricePkr = pricing?.unitPricePkr ?? 500;

  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(18,172,144,0.28),transparent_55%)]" />
      <div className="absolute inset-0 hero-grid opacity-70" />
      <div className="container-page relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-teal-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-300" />
            </span>
            Trusted assistance, one scan away
          </span>

          <h1 className="mt-5 max-w-xl font-display text-[2.6rem] font-semibold leading-[1.06] tracking-tight sm:text-6xl">
            Your Comfort,
            <span className="block text-teal-300">Our Priority.</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/72 sm:text-lg">
            Enjoy a smoother experience wherever you go. HELPY connects you with trained, verified helpers at hotels,
            shopping malls, airports and public places — so you can focus on what matters.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/get-assistance" variant="accent" size="lg">
              Get Assistance Now
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
            <LinkButton href="/how-it-works" variant="outlineLight" size="lg">
              How It Works
            </LinkButton>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-white/45">Service block</dt>
              <dd className="mt-1 text-sm font-semibold text-white">{unitMinutes} minutes</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-white/45">Starting at</dt>
              <dd className="mt-1 text-sm font-semibold text-white">{formatPkr(unitPricePkr)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-white/45">Support</dt>
              <dd className="mt-1 text-sm font-semibold text-white">In person, on site</dd>
            </div>
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:justify-self-end">
          <div className="absolute -inset-6 rounded-[2rem] bg-teal-400/10 blur-2xl" aria-hidden="true" />
          <div className="relative rounded-3xl border border-white/12 bg-white/[0.06] p-3 shadow-2xl backdrop-blur">
            <div className="rounded-[1.35rem] bg-white p-6 text-navy-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">Live request</p>
                  <p className="mt-1 text-lg font-semibold">Helper on the way</p>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>

              <ol className="mt-6 space-y-4">
                {[
                  ['Request received', 'Your location and service are confirmed.', true],
                  ['Helper assigned', 'A verified helper accepts your request.', true],
                  ['Service in progress', 'Track progress and support in real time.', false],
                ].map(([title, description, done], index) => (
                  <li key={title} className="flex gap-3">
                    <span
                      className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                        done ? 'bg-teal-600 text-white' : 'border border-navy-200 bg-white text-navy-500'
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-navy-500">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex items-center gap-3 rounded-xl bg-navy-50 p-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-navy-700 shadow-sm">
                  <QrCode className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-navy-800">Scan the QR at your location</p>
                  <p className="truncate text-[11px] text-navy-500">No app download. No account setup.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-white/15 bg-navy-900/90 px-4 py-3 shadow-lift backdrop-blur sm:block">
            <p className="flex items-center gap-2 text-xs font-medium text-white">
              <ShieldCheck className="h-4 w-4 text-teal-300" aria-hidden="true" />
              Verified helpers. Transparent billing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks({ compact = false }) {
  const steps = [
    {
      icon: QrCode,
      title: 'Scan the QR code',
      description: 'Find the HELPY QR code at the front desk, lobby or service point of a partner venue.',
    },
    {
      icon: Sparkles,
      title: 'Tell us what you need',
      description: 'Choose a service, add a short note, and confirm the terms and recording consent.',
    },
    {
      icon: HeartHandshake,
      title: 'Relax — we handle it',
      description: 'A verified helper is assigned. Track every stage live and review the service when it ends.',
    },
  ];

  return (
    <section className={compact ? '' : 'py-16 sm:py-20'}>
      <div className="container-page">
        <SectionHeading
          eyebrow="How it works"
          title="Assistance in three simple steps"
          description="No app to install. No long forms. Just scan, ask, and get help from a trained HELPY team member."
          align="center"
        />
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative rounded-2xl border border-navy-100 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-3xl font-semibold text-navy-100">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">{step.description}</p>
              </li>
            );
          })}
        </ol>
        {!compact ? (
          <div className="mt-8 text-center">
            <Link href="/how-it-works" className="link-subtle inline-flex items-center gap-1.5 text-sm">
              See the full journey, including billing and reviews
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ServiceCards({ categories, pricing, limit }) {
  const items = limit ? categories.slice(0, limit) : categories;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((category) => {
        const Icon = serviceIcon(category);
        return (
          <div
            key={category.id}
            className="group rounded-2xl border border-navy-100 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lift"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-600 group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{category.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">
              {category.description || 'Ask the HELPY team at this location — we will match you with the right helper.'}
            </p>
            {pricing ? (
              <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-navy-500">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {pricing.unitMinutes}-minute block · {formatPkr(pricing.unitPricePkr)}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function ServicesSection({ catalog, pricing }) {
  return (
    <section className="border-y border-navy-100 bg-white py-16 sm:py-20">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Services"
            title="Help that fits the moment"
            description="Services shown here are the live categories offered at our featured partner location. Every venue can tailor its own menu."
          />
          <LinkButton href="/services" variant="secondary" size="sm">
            Explore all services
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        </div>

        {catalog?.categories?.length ? (
          <div className="mt-10">
            <ServiceCards categories={catalog.categories} pricing={catalog.pricing ?? pricing} limit={6} />
          </div>
        ) : (
          <Card className="mt-10 p-8 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">
              <MapPin className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">Services are tailored to each venue</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-navy-600">
              Scan the HELPY QR code at your hotel, mall or airport to see the exact services available where you are.
              The live catalogue appears as soon as your location is connected.
            </p>
            <LinkButton href="/get-assistance" className="mt-5" size="sm">
              How to get assistance
            </LinkButton>
          </Card>
        )}
      </div>
    </section>
  );
}

export function WhyHelpy() {
  const reasons = [
    {
      icon: ShieldCheck,
      title: 'Verified, trained helpers',
      description: 'Every helper is onboarded, assigned by an administrator, and accountable for each service.',
    },
    {
      icon: CreditCard,
      title: 'Transparent, server-calculated billing',
      description: 'Your bill is generated from recorded start and end times. No cash surprises, no manual estimates.',
    },
    {
      icon: Clock3,
      title: 'Live status at every stage',
      description: 'See when a helper is assigned, when the service starts, and when your bill is ready.',
    },
    {
      icon: Mic,
      title: 'Recording only with consent',
      description: 'Recording is disclosed up front and starts only after consent. You can decline and still get help.',
    },
    {
      icon: Star,
      title: 'Feedback that counts',
      description: 'Rate your service and add voice feedback. Optional tips are verified before they reach your helper.',
    },
    {
      icon: Users,
      title: 'Support for every guest',
      description: 'From luggage and mobility to family assistance and local guidance — ask, and we will arrange it.',
    },
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Why HELPY"
          title="Premium service, without the friction"
          description="HELPY is built around trust: clear pricing, visible progress, and a human being who shows up."
        />
        <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <div key={reason.title} className="flex gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-semibold">{reason.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{reason.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Locations() {
  const venues = [
    { icon: BellRing, label: 'Hotels & residences' },
    { icon: ShoppingBag, label: 'Shopping malls' },
    { icon: Compass, label: 'Airports & terminals' },
    { icon: HeartPulse, label: 'Hospitals & clinics' },
    { icon: Briefcase, label: 'Offices & co-working' },
    { icon: Users, label: 'Events & exhibitions' },
  ];

  return (
    <section className="bg-navy-950 py-16 text-white sm:py-20">
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Where you will find us</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
            At the places you already go
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
            HELPY partners with venues that care about guest experience. Look for the HELPY QR code at reception, the
            lobby, or the service desk — that code connects you to the team on site.
          </p>
          <div className="mt-6 rounded-xl border border-white/12 bg-white/5 p-4">
            <p className="flex items-start gap-2.5 text-sm text-white/75">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />
              Are you a venue? HELPY can be deployed with your own locations, services and QR codes.
            </p>
            <Link href="/contact" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300 transition hover:text-teal-200">
              Talk to our team
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-3">
          {venues.map((venue) => {
            const Icon = venue.icon;
            return (
              <li
                key={venue.label}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-200">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-white/85">{venue.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function Experience() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Customer experience"
            title="You stay in control from scan to review"
            description="HELPY keeps every step visible and every decision yours. Nothing happens in the background."
          />
          <ul className="mt-7 space-y-4">
            {[
              ['You choose the service', 'Pick from the venue’s live service list, or describe what you need in a note.'],
              ['You consent — or decline', 'Recording terms are shown before you request. Declining never blocks assistance.'],
              ['You see the bill first', 'The amount is calculated by the server from actual service time, before you pay.'],
              ['You decide on a tip', 'Tip only after a completed service, and only after a confirmed payment.'],
            ].map(([title, text], index) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-navy-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute inset-x-6 top-6 h-full rounded-3xl bg-teal-100/70" aria-hidden="true" />
          <Card className="relative overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-navy-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Service summary</p>
                <p className="mt-1 text-lg font-semibold">Completed</p>
              </div>
              <Badge tone="green" dot>
                Bill ready
              </Badge>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['Service', 'Guest assistance'],
                ['Duration', '68 minutes'],
                ['Billing block', '1 × 70 minutes'],
                ['Bill total', 'Rs. 500'],
                ['Payment', 'Awaiting confirmation'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-navy-500">{label}</dt>
                  <dd className="font-medium text-navy-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-800">
              Digital payments are verified by the HELPY team before they are marked confirmed. Your helper is never
              asked to guess whether a payment succeeded.
            </div>
            <p className="mt-4 text-xs text-navy-400">
              Illustrative summary. Your actual bill is always generated by the HELPY server.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="border-y border-navy-100 bg-white py-16 sm:py-20">
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading eyebrow="FAQ" title="Questions, answered" description="Everything you need to know before scanning your first HELPY code." />
          <div className="mt-6 rounded-xl border border-navy-100 bg-sand-50 p-4">
            <p className="text-sm font-semibold text-navy-900">Still unsure?</p>
            <p className="mt-1 text-sm text-navy-600">Our support team can walk you through it.</p>
            <Link href="/contact" className="link-subtle mt-2 inline-flex items-center gap-1.5 text-sm">
              Contact HELPY support
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <Faq />
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-12 text-white sm:px-10">
          <div className="absolute inset-0 hero-grid opacity-60" aria-hidden="true" />
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Ready when you are</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
                Scan. Request. Relax.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
                Find the HELPY QR code at your venue, or open the assistance page to see how it works.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/get-assistance" variant="accent" size="lg">
                Get Assistance
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
              <LinkButton href="/services" variant="outlineLight" size="lg">
                View services
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
