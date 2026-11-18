import Link from 'next/link';
import { Banknote, Clock3, FileCheck2, Mail, Mic, ShieldCheck } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { Card } from '@/components/ui/primitives';
import { getPricing, getPublicSettings } from '@/lib/serverApi';
import { formatPkr } from '@/lib/utils';

export const metadata = {
  title: 'Terms of service',
  description:
    'The terms that apply when you request a HELPY helper at a partner venue, including billing, cancellation, recording consent, reviews and tips.',
  alternates: { canonical: '/terms' },
};

export default async function TermsPage() {
  const [settings, pricing] = await Promise.all([
    getPublicSettings().catch(() => null),
    getPricing().catch(() => null),
  ]);
  const support = settings?.['app.info'] ?? {};
  const email = support.supportEmail || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@helply.pk';
  const policy = settings?.['recording.policy'] ?? null;

  const sections = [
    {
      title: 'The service',
      body: [
        'HELPY is a guest assistance service operated at partner venues. When you open a venue QR code and submit a request, the venue assigns a trained helper to assist you at that location. The service is limited to the venue\'s premises and the categories it publishes.',
        'Helpers follow venue instructions and safety rules. They cannot perform medical, legal or financial services, handle valuables beyond what is agreed at the venue, or take you off the premises.',
      ],
    },
    {
      title: 'Requests and statuses',
      body: [
        'A request moves through four statuses: created, assigned, in progress and completed. The venue controls these transitions, and the status shown in your guest session is the backend record — not a browser estimate.',
        'You can cancel while a request is created or assigned. Once a helper has started the service, ask the venue front desk if you need to end it early.',
      ],
    },
    {
      title: 'Billing',
      body: [
        pricing
          ? `Services are billed in ${pricing.unitMinutes}-minute blocks at ${formatPkr(pricing.unitPricePkr)} per block. The final amount uses the server-recorded start and end times and at least one block per completed service.`
          : 'Services are billed in fixed time blocks at the venue\'s published rate. The final amount uses server-recorded start and end times and at least one block per completed service.',
        'The bill is calculated by the HELPY backend from the pricing snapshot at the time of service. It cannot be edited in your browser. If you believe a bill is wrong, speak to the venue before paying or ask the venue to void it.',
      ],
    },
    {
      title: 'Payments',
      body: [
        'You can pay at the venue in cash or by card machine, in which case staff record the payment. If you pay by transfer or card from your phone, you enter the transaction reference and the payment stays pending until venue staff verify it.',
        'Never share card numbers, PINs or one-time codes. HELPY does not process card details in the browser. A bill is settled only when the venue confirms payments totalling the full amount.',
      ],
    },
    {
      title: 'Recording consent',
      body: [
        'Some venues require audio recording of services for safety and dispute resolution. The request page tells you whether consent is required before you submit. Consent is stored with a version and timestamp, and recording never starts without the consent the venue requires.',
        'Recording is not covert and stops when the service ends. Recordings are private, admin-only, and accessible through short-lived signed links with access logging. If you decline consent at a venue that requires it, the venue cannot dispatch a helper and may offer an alternative.',
        policy?.recordingDisclosureText ? policy.recordingDisclosureText : '',
      ].filter(Boolean),
    },
    {
      title: 'Reviews and voice feedback',
      body: [
        'Reviews are 1 to 5 stars with an optional comment and an optional voice note. You can review a service once, after it is completed. Voice notes are recorded only when you press record and can be discarded before submission.',
        'Reviews and voice feedback are used to recognise helpers, resolve disputes and improve the service. They are not edited by helpers.',
      ],
    },
    {
      title: 'Tips',
      body: [
        'Tips are optional. You can choose no tip, a preset amount or a custom amount. A tip is linked to a verified payment for the same service and can be recorded only once.',
        'A tip counts towards a helper\'s earnings, incentives and the monthly Tip Champion award only after the venue verifies it. HELPY never adds a tip automatically.',
      ],
    },
    {
      title: 'Complaints and conduct',
      body: [
        'You can raise a complaint about a service, billing, behaviour, safety, a lost item or recording misuse. Complaints are reviewed by venue administrators and may lead to a formal disciplinary review for a helper.',
        'Complaint counts do not automatically terminate a helper or deduct pay. A human decision is required, and the outcome is recorded.',
      ],
    },
    {
      title: 'Availability and liability',
      body: [
        'Response times depend on venue staffing and demand. A request is not a guarantee that a helper is immediately available. The venue may cancel a request if it cannot be served safely.',
        'HELPY and the venue are responsible for the service within the limits set by applicable law and the venue\'s own policies. Nothing in these terms excludes liability that cannot lawfully be excluded.',
      ],
    },
    {
      title: 'Changes and contact',
      body: [
        'We may update these terms as the service evolves. The version you accepted when you submitted a request is recorded with that request.',
        `Questions about these terms can be sent to ${email}. For anything about a specific visit, include the venue and the approximate date.`,
      ],
    },
  ];

  return (
    <MarketingShell>
      <div className="bg-navy-950 py-12 text-white sm:py-14">
        <div className="container-page max-w-3xl">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            Terms
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Terms of service</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            These terms apply when you request and receive assistance at a HELPY partner venue in Pakistan. Last updated
            18 November 2026.
          </p>
        </div>
      </div>

      <div className="container-page max-w-3xl py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <Clock3 className="h-5 w-5 text-teal-600" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-navy-900">Server-timed</p>
            <p className="mt-1 text-xs leading-relaxed text-navy-500">
              {pricing
                ? `${pricing.unitMinutes}-minute blocks at ${formatPkr(pricing.unitPricePkr)}.`
                : 'Billing uses server-recorded times.'}
            </p>
          </Card>
          <Card className="p-4">
            <Mic className="h-5 w-5 text-teal-600" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-navy-900">Consent-first recording</p>
            <p className="mt-1 text-xs leading-relaxed text-navy-500">
              No recording without the consent the venue requires.
            </p>
          </Card>
          <Card className="p-4">
            <Banknote className="h-5 w-5 text-teal-600" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-navy-900">Tips are optional</p>
            <p className="mt-1 text-xs leading-relaxed text-navy-500">Never added automatically, verified by the venue.</p>
          </Card>
        </div>

        <div className="mt-10 space-y-8">
          {sections.map((section, index) => (
            <section key={section.title} aria-labelledby={`terms-${index}`}>
              <h2 id={`terms-${index}`} className="font-display text-lg font-semibold text-navy-900">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-2 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed text-navy-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-navy-100 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
            Contact
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-navy-600">
            For questions about these terms, a bill, a recording or a complaint, contact HELPY or speak to the venue
            front desk.
          </p>
          <a
            href={`mailto:${email}`}
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {email}
          </a>
          <p className="mt-4 text-xs text-navy-400">
            See also our{' '}
            <Link href="/privacy" className="font-medium text-teal-700 underline-offset-2 hover:underline">
              privacy policy
            </Link>
            .
          </p>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-navy-400">
          These terms describe the HELPY platform&apos;s operation and are subject to review by the operating
          venue&apos;s legal counsel before production use.
        </p>
      </div>
    </MarketingShell>
  );
}
