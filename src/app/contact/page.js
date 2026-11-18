import { Clock3, Mail, MapPin, MessageSquare, Phone, ShieldCheck } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { ContactForm } from '@/components/marketing/contact-form';
import { Card, SectionHeading } from '@/components/ui/primitives';
import { getPublicSettings } from '@/lib/serverApi';

export const metadata = {
  title: 'Contact',
  description:
    'Contact HELPY for guest support, venue partnerships, service questions, or privacy and recording enquiries.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const settings = await getPublicSettings();
  const info = settings?.['app.info'] ?? {};
  const email = info.supportEmail || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@helply.pk';
  const phone = info.supportPhone || process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+92 300 000 0000';

  return (
    <MarketingShell>
      <section className="border-b border-navy-100 bg-white">
        <div className="container-page py-14 sm:py-20">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Talk to a real person
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-600">
            Whether you need help during a visit, want to bring HELPY to your venue, or have a question about privacy,
            our team is here.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <Card className="p-6 sm:p-8">
            <SectionHeading title="Send us a message" description="Tell us what you need and the best way to reach you." />
            <div className="mt-6">
              <ContactForm email={email} phone={phone} />
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-base font-semibold">Support channels</h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-navy-900">Email</p>
                    <a href={`mailto:${email}`} className="link-subtle break-all">
                      {email}
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium text-navy-900">Phone</p>
                    <a href={`tel:${String(phone).replace(/[^\d+]/g, '')}`} className="link-subtle">
                      {phone}
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium text-navy-900">Response time</p>
                    <p className="text-navy-600">We aim to reply within one working day.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium text-navy-900">Coverage</p>
                    <p className="text-navy-600">Partner venues across Pakistan.</p>
                  </div>
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold">Privacy or recording request</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">
                For access, retention or legal-hold questions about a recording, email us with the service date,
                venue, and the phone number used for the request. Never send identity documents by email.
              </p>
            </Card>

            <Card className="p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold">Already in a service?</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">
                Use the tracking page on your phone for the fastest update. The venue team can see the same live
                status.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
