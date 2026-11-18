import Link from 'next/link';
import { Lock, Mail, Mic, ShieldCheck } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { Card } from '@/components/ui/primitives';
import { getPublicSettings } from '@/lib/serverApi';

export const metadata = {
  title: 'Privacy policy',
  description:
    'How HELPY handles guest details, venue sessions, recording consent, voice feedback, bills, tips and complaints.',
  alternates: { canonical: '/privacy' },
};

const SECTIONS = [
  {
    title: 'What we collect',
    body: [
      'When you open a venue QR code we collect your name, phone number and optionally your email address so the venue can assign a helper and contact you about your request. We also store the request details you choose to share, such as a short note about what you need.',
      'We record service timestamps, the assigned helper, the venue location, and the status of your request so the service can run and be billed accurately.',
    ],
  },
  {
    title: 'Guest sessions, not accounts',
    body: [
      'You do not create a password. Your guest session is a limited, short-lived credential tied to the physical QR code you scanned. Access tokens expire automatically, and the venue QR session can be re-established with the same phone number at the same venue.',
      'If you use a shared device, clear the page or use your browser\'s private mode. A new guest at the same venue may otherwise see your last request if you leave the page open.',
    ],
  },
  {
    title: 'Recording and consent',
    body: [
      'Some venues require audio recording of services for safety and dispute resolution. Consent is requested before a helper is dispatched and is stored with a policy version and timestamp. Recording never starts without the consent the venue requires, and there is no covert recording.',
      'Recordings are private. They are accessible only to authorised venue administrators through short-lived signed playback links, and every access is logged. Recordings are retained for the venue\'s configured retention period and may be placed under legal hold.',
      'Where a venue does not require recording, you can still choose whether to consent. If you decline at a venue that requires consent, a helper cannot be dispatched; the front desk can discuss alternatives.',
    ],
  },
  {
    title: 'Voice feedback',
    body: [
      'You may optionally attach a voice note to a review. It is recorded only when you press record in your browser, uploaded over an encrypted connection to the HELPY backend, and linked to that completed service. You can discard it before submitting.',
      'Voice feedback follows the same administrator-only access and retention rules as service recordings.',
    ],
  },
  {
    title: 'Payments, bills and tips',
    body: [
      'Final bills are calculated by the HELPY backend from server-recorded service times and the pricing configured for the venue. We do not store card numbers, PINs or one-time codes.',
      'If you pay by transfer or card and enter a transaction reference, the payment is created as pending until venue staff verify it. Tips are optional, recorded once per service, and linked to a verified payment. A tip is counted only after the venue verifies it.',
    ],
  },
  {
    title: 'Who can see your information',
    body: [
      'Venue administrators and the assigned helper see what they need to deliver and support your service. Administrators can review requests, sessions, bills, payments, reviews, tips and complaints for the venue.',
      'We do not sell guest data. Access to recordings is restricted to authorised administrators, and audit logs record sensitive actions such as consent changes, recording access, payment confirmation and disciplinary reviews.',
    ],
  },
  {
    title: 'Complaints and safety',
    body: [
      'If you raise a complaint, the venue may review the related service, payment and — where consent and policy allow — recording. Complaints can trigger a disciplinary review process for a helper. HELPY does not automatically terminate helpers or deduct pay based on a complaint count; a human review is required.',
    ],
  },
  {
    title: 'Retention and your choices',
    body: [
      'Request, service, billing and payment records are retained as financial and operational records. Recordings are retained only for the configured retention period unless a legal hold applies. You can ask the venue to correct your contact details or discuss a privacy request at the front desk.',
      'For privacy questions, contact HELPY using the details below. If a request concerns a specific visit, include the venue and the approximate date so it can be located.',
    ],
  },
];

export default async function PrivacyPage() {
  const settings = await getPublicSettings().catch(() => null);
  const policy = settings?.['recording.policy'] ?? null;
  const support = settings?.['app.info'] ?? {};
  const email = support.supportEmail || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@helply.pk';

  return (
    <MarketingShell>
      <div className="bg-navy-950 py-12 text-white sm:py-14">
        <div className="container-page max-w-3xl">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Privacy
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Privacy policy</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            This policy explains what HELPY stores when you use a partner venue, how recording consent works, and who
            can access your information. Last updated 18 November 2026.
          </p>
        </div>
      </div>

      <div className="container-page max-w-3xl py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <Lock className="h-5 w-5 text-teal-600" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-navy-900">No password</p>
            <p className="mt-1 text-xs leading-relaxed text-navy-500">Short-lived guest sessions bound to the venue QR code.</p>
          </Card>
          <Card className="p-4">
            <Mic className="h-5 w-5 text-teal-600" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-navy-900">Consent first</p>
            <p className="mt-1 text-xs leading-relaxed text-navy-500">
              {policy?.required
                ? 'This deployment records services only after explicit consent.'
                : 'Recording consent is requested, and declining is respected.'}
            </p>
          </Card>
          <Card className="p-4">
            <ShieldCheck className="h-5 w-5 text-teal-600" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-navy-900">Admin-only recordings</p>
            <p className="mt-1 text-xs leading-relaxed text-navy-500">
              Signed, short-lived playback links with access logging.
            </p>
          </Card>
        </div>

        {policy ? (
          <div className="mt-8 rounded-2xl border border-navy-100 bg-sand-50 p-5">
            <h2 className="text-sm font-semibold text-navy-900">Current recording policy</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Recording required</dt>
                <dd className="mt-0.5 text-navy-800">{policy.required ? 'Yes, with explicit consent' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Retention</dt>
                <dd className="mt-0.5 text-navy-800">
                  {policy.retentionDays ? `${policy.retentionDays} days` : 'Configured by the venue'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Customer consent version</dt>
                <dd className="mt-0.5 text-navy-800">{policy.customerConsentVersion ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Helper consent version</dt>
                <dd className="mt-0.5 text-navy-800">{policy.helperConsentVersion ?? '—'}</dd>
              </div>
            </dl>
            {policy.recordingDisclosureText ? (
              <p className="mt-4 border-t border-navy-100 pt-4 text-sm leading-relaxed text-navy-600">
                {policy.recordingDisclosureText}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 space-y-8">
          {SECTIONS.map((section, index) => (
            <section key={section.title} aria-labelledby={`privacy-${index}`}>
              <h2 id={`privacy-${index}`} className="font-display text-lg font-semibold text-navy-900">
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
          <h2 className="text-sm font-semibold text-navy-900">Contact</h2>
          <p className="mt-1 text-sm leading-relaxed text-navy-600">
            Privacy questions, correction requests or concerns about a recording can be raised with venue staff or with
            HELPY directly.
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
            <Link href="/terms" className="font-medium text-teal-700 underline-offset-2 hover:underline">
              terms of service
            </Link>
            .
          </p>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-navy-400">
          This page reflects how the HELPY platform is designed to operate. Final privacy wording is subject to review
          by the operating venue&apos;s legal counsel before production use.
        </p>
      </div>
    </MarketingShell>
  );
}
