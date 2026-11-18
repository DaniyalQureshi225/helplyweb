import Link from 'next/link';
import { ArrowRight, Clock3, MapPin, ScanLine, ShieldCheck, Sparkles } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { AssistanceForm } from '@/components/customer/assistance-form';
import { Card, SectionHeading } from '@/components/ui/primitives';

export const metadata = {
  title: 'Get assistance',
  description:
    'Open your HELPY guest session with the venue code or QR code, then request a verified helper in a few taps.',
  alternates: { canonical: '/get-assistance' },
};

const STEPS = [
  {
    icon: ScanLine,
    title: 'Open the QR code',
    description: 'Scan the HELPY QR code where you are, or enter the venue code printed underneath it.',
  },
  {
    icon: Sparkles,
    title: 'Say what you need',
    description: 'Pick a service or describe it in your own words. Add your phone number so we can find you.',
  },
  {
    icon: Clock3,
    title: 'Track your helper',
    description: 'Watch the request move from created to assigned to in progress, live from the venue.',
  },
];

export default function GetAssistancePage() {
  return (
    <MarketingShell>
      <section className="border-b border-navy-100 bg-white">
        <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_0.9fr] lg:items-start lg:py-16">
          <div>
            <p className="eyebrow">Guest assistance</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
              A verified helper, a few taps away.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-navy-600">
              HELPY works inside partner venues across Pakistan. Open your venue session to request help with luggage,
              directions, accessibility, shopping or anything else that would make your visit easier.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.title} className="rounded-2xl border border-navy-100 bg-sand-50 p-4">
                  <step.icon className="h-5 w-5 text-teal-600" aria-hidden="true" />
                  <p className="mt-2.5 text-sm font-semibold text-navy-900">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-navy-500">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3 rounded-2xl border border-navy-100 bg-white p-5">
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-navy-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                No password, no app. Your guest session is tied to the venue QR code and expires automatically.
              </p>
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-navy-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                The venue sets the service catalogue, opening hours and recording policy you will see.
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <AssistanceForm />
            <p className="mt-4 text-center text-xs text-navy-400">
              Not at a partner venue yet?{' '}
              <Link href="/contact" className="font-medium text-teal-700 underline-offset-2 hover:underline">
                Ask us about bringing HELPY to your venue
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sand-50">
        <div className="container-page py-12">
          <SectionHeading
            eyebrow="While you wait"
            title="What happens after you send a request"
            description="The venue assigns a trained helper. You can follow every step from your phone and cancel while the request is still waiting or assigned."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Created', 'Your request reaches the venue team instantly.'],
              ['Assigned', 'A helper accepts and heads to your location.'],
              ['In progress', 'The service runs with a venue-controlled timer.'],
              ['Completed', 'Your server-calculated bill and review open.'],
            ].map(([title, description], index) => (
              <Card key={title} className="p-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-navy-950 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <p className="mt-2.5 text-sm font-semibold text-navy-900">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-navy-500">{description}</p>
              </Card>
            ))}
          </div>
          <Link
            href="/how-it-works"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
          >
            See the full journey
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
