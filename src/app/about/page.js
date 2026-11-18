import { ArrowRight, HeartHandshake, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { CtaBand } from '@/components/marketing/sections';
import { Card, LinkButton, SectionHeading } from '@/components/ui/primitives';

export const metadata = {
  title: 'About Us',
  description:
    'HELPY exists to make everyday places feel easier for everyone — with trained helpers, transparent pricing, and privacy-first design.',
  alternates: { canonical: '/about' },
};

const VALUES = [
  {
    icon: HeartHandshake,
    title: 'Hospitality, not transactions',
    description:
      'A HELPY service is a human interaction. Helpers are trained to listen first, act calmly, and leave guests feeling looked after.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy by design',
    description:
      'Consent is explicit, recordings are admin-only with signed playback links, and retention is a configured policy — not an afterthought.',
  },
  {
    icon: Sparkles,
    title: 'Clarity over cleverness',
    description:
      'One lifecycle, clear statuses, server-calculated bills. We remove ambiguity so guests and venue teams always know what happens next.',
  },
  {
    icon: Users,
    title: 'Fair work for helpers',
    description:
      'Assignments, earnings and incentives follow written rules. Complaints trigger review — never automatic punishment or salary deductions.',
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-navy-100 bg-white">
        <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="eyebrow">About HELPY</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Making everyday places feel easier
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-navy-600">
              HELPY started with a simple observation: the difference between a stressful visit and a great one is
              usually one person who knows how to help. We built a platform that puts that person within one scan.
            </p>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-navy-600">
              Our partner venues use HELPY to offer on-site assistance without building a new operations team. Guests
              use it without downloading an app or creating an account.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/services">
                Explore services
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
              <LinkButton href="/contact" variant="secondary">
                Partner with HELPY
              </LinkButton>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-teal-100/60 blur-2xl" aria-hidden="true" />
            <Card className="relative overflow-hidden">
              <div className="bg-navy-950 p-7 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Our promise</p>
                <p className="mt-3 font-display text-2xl font-semibold leading-snug text-white">
                  “Your Comfort, Our Priority.”
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/65">
                  Every product decision starts with a simple question: does this make the guest feel more at ease?
                </p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-navy-100 border-t border-navy-100">
                <div className="p-5">
                  <p className="text-2xl font-semibold text-navy-900">1 scan</p>
                  <p className="mt-1 text-xs text-navy-500">to reach a real person</p>
                </div>
                <div className="p-5">
                  <p className="text-2xl font-semibold text-navy-900">0 apps</p>
                  <p className="mt-1 text-xs text-navy-500">to install or accounts to create</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="What we believe"
            title="The principles behind the product"
            description="These are not slogans on a wall. They shape how requests, recordings, billing and worker incentives are implemented."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold">{value.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-navy-600">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-navy-100 bg-white py-14 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="For venues" title="Your team, elevated" />
            <p className="mt-4 text-sm leading-relaxed text-navy-600">
              HELPY gives venue teams a clear operating picture: incoming requests, assignments, live sessions, bills,
              payments, reviews and workforce records. Administrators decide; the platform records and enforces the
              rules.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-navy-700">
              {[
                'Configure locations, service categories and QR codes.',
                'Assign qualified helpers and monitor every service.',
                'Confirm digital payments and verify tips.',
                'Review recording access logs and legal holds.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="For helpers" title="Rules that are written down" />
            <p className="mt-4 text-sm leading-relaxed text-navy-600">
              Helper pay, one-star review adjustments, attendance rewards and Tip Champion awards are calculated from
              recorded data and approved by administrators. No manager can invent a deduction in the moment.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-navy-700">
              {[
                'Server-timed sessions and transparent earnings snapshots.',
                'Daily five-star and monthly attendance incentives per policy.',
                'Monthly Tip Champion — verified tips only, ties resolved by an administrator.',
                'Complaints open a review workflow, never an automatic penalty.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-400" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CtaBand />
    </MarketingShell>
  );
}
