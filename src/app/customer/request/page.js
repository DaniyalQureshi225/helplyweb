'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Mic,
  MicOff,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useCustomerStore } from '@/stores/customerStore';
import { ensureCustomerAuth } from '@/lib/customerAuth';
import { customerApi } from '@/services/customerApi';
import { errorMessage, fieldErrors } from '@/lib/errors';
import { formatPkr } from '@/lib/utils';
import { Alert, Button, Card, LinkButton } from '@/components/ui/primitives';
import { Checkbox, ChoiceCard, Field, FormError, Textarea } from '@/components/ui/form';
import { toast } from '@/stores/uiStore';

export default function RequestPage() {
  const router = useRouter();
  const qrToken = useCustomerStore((state) => state.qrToken);
  const qrCode = useCustomerStore((state) => state.qrCode);
  const location = useCustomerStore((state) => state.location);
  const pricing = useCustomerStore((state) => state.pricing);
  const policies = useCustomerStore((state) => state.policies);
  const categories = useCustomerStore((state) => state.categories);
  const customer = useCustomerStore((state) => state.customer);

  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [consent, setConsent] = useState('accept');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [activeRequest, setActiveRequest] = useState(null);

  const consentRequired = Boolean(policies?.recordingRequired);
  const consentDeclined = consentRequired && consent === 'decline';

  useEffect(() => {
    let mounted = true;
    async function checkActive() {
      if (!customer || !qrToken) return;
      try {
        const active = await customerApi.activeRequest();
        if (mounted) setActiveRequest(active ?? null);
      } catch {
        // An absent active request is normal.
      }
    }
    checkActive();
    return () => {
      mounted = false;
    };
  }, [customer, qrToken]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId],
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setFieldError({});

    if (!termsAccepted) {
      setFormError('Please accept the service terms and privacy policy before continuing.');
      return;
    }
    if (consentDeclined) {
      setFormError('This venue requires recording consent before a helper can be assigned.');
      return;
    }

    setSubmitting(true);
    try {
      const ready = await ensureCustomerAuth();
      if (!ready) {
        setFormError('Your guest session expired. Please open the QR code again to continue.');
        return;
      }
      const result = await customerApi.createRequest({
        ...(categoryId ? { categoryId } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        termsAccepted: true,
        recordingConsent: {
          accepted: consent === 'accept',
          ...(policies?.customerConsentVersion ? { policyVersion: policies.customerConsentVersion } : {}),
        },
      });
      useCustomerStore.getState().setRequest({
        request: result.request,
        sessionId: result.session?.id ?? result.request?.session,
        customerToken: result.customerToken,
      });
      toast.success('Request sent', 'The venue team has been notified.');
      router.replace(`/customer/track/${result.request.id}`);
    } catch (error) {
      if (error?.code === 'ACTIVE_REQUEST_EXISTS' || error?.status === 409) {
        try {
          const active = await customerApi.activeRequest();
          if (active?.id) {
            useCustomerStore.getState().setRequest({ request: active, sessionId: active.session });
            toast.info('You already have an active request', 'Opening it instead.');
            router.replace(`/customer/track/${active.id}`);
            return;
          }
        } catch {
          // Fall through to the generic error.
        }
      }
      const fields = fieldErrors(error);
      setFieldError(fields);
      setFormError(errorMessage(error, 'We could not create your request. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!qrToken || !location) {
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-navy-900">Scan your venue QR code first</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-navy-500">
            HELPY needs the venue QR code to know where you are and which services are available. Open the assistance
            page to enter the code printed at your location.
          </p>
          <LinkButton href="/get-assistance" className="mt-5">
            Open assistance page
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <UserRound className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-navy-900">One quick step</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-navy-500">
            Add your name and phone number so the venue can assign a helper and reach you if needed.
          </p>
          <LinkButton href={qrCode ? `/customer/${qrCode}` : '/get-assistance'} className="mt-5">
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">New request</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-navy-900">How can we help?</h1>
        <p className="mt-1 text-sm leading-relaxed text-navy-500">
          Choose a service if you know it, or simply describe what would make your visit easier.
        </p>
      </div>

      <Card className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy-900">{customer.name}</p>
          <p className="text-xs text-navy-500">
            {customer.phone} · {location.name}
          </p>
        </div>
        <Link
          href={qrCode ? `/customer/${qrCode}` : '/get-assistance'}
          className="shrink-0 text-xs font-semibold text-teal-700 underline-offset-4 hover:underline"
        >
          Change
        </Link>
      </Card>

      {activeRequest?.id && activeRequest.status && !['CANCELLED', 'COMPLETED'].includes(activeRequest.status) ? (
        <Alert tone="info" title="You already have an active request">
          <p>
            Open{' '}
            <Link href={`/customer/track/${activeRequest.id}`} className="font-semibold underline underline-offset-2">
              your tracked request
            </Link>{' '}
            instead of creating a duplicate.
          </p>
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">1. Service</h2>
          <div className="mt-3 space-y-2.5">
            <ChoiceCard
              name="category"
              value=""
              checked={categoryId === ''}
              onChange={() => setCategoryId('')}
              title="Not sure — general assistance"
              description="Tell us in the note below and the venue team will choose the right helper."
              icon={Sparkles}
            />
            {categories.map((category) => (
              <ChoiceCard
                key={category.id}
                name="category"
                value={category.id}
                checked={categoryId === category.id}
                onChange={() => setCategoryId(category.id)}
                title={category.name}
                description={category.description || undefined}
                icon={Sparkles}
              />
            ))}
          </div>
          {categories.length === 0 ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This venue has not published service categories yet. General assistance is still available — describe
              what you need below.
            </p>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">2. Details</h2>
          <div className="mt-3">
            <Field
              label="What do you need?"
              htmlFor="request-note"
              hint={`${note.length}/1000 characters. Do not include card numbers or identity documents.`}
              error={fieldError.note}
            >
              <Textarea
                id="request-note"
                rows={4}
                maxLength={1000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="e.g. I need help carrying two suitcases to the taxi stand."
              />
            </Field>
          </div>
          {selectedCategory || pricing ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-navy-50 px-3.5 py-3 text-xs leading-relaxed text-navy-600">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" aria-hidden="true" />
              <span>
                {pricing
                  ? `Services are billed by the venue in ${pricing.unitMinutes}-minute blocks at ${formatPkr(pricing.unitPricePkr)} per block. Your final bill is calculated by the server when the service ends.`
                  : 'Your final bill is calculated by the server when the service ends.'}
              </span>
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">3. Recording consent</h2>
          <div className="mt-3 space-y-2.5">
            {consentRequired ? (
              <Alert tone="warning" title="This venue requires consent">
                Recording helps the venue resolve disputes and keep everyone safe. A helper can only be dispatched
                after explicit consent is recorded. Recording is never covert: it stops when the service ends.
              </Alert>
            ) : (
              <Alert tone="info" title="Recording is optional here">
                This venue does not require recording. You can still accept if you are comfortable, and the same
                consent rules apply.
              </Alert>
            )}

            {policies?.recordingDisclosureText ? (
              <p className="rounded-xl border border-navy-100 bg-sand-50 px-3.5 py-3 text-xs leading-relaxed text-navy-600">
                {policies.recordingDisclosureText}
              </p>
            ) : null}

            <ChoiceCard
              name="consent"
              value="accept"
              checked={consent === 'accept'}
              onChange={() => setConsent('accept')}
              title="I consent to service recording"
              description="Audio only, for safety and dispute resolution. Consent is stored with a policy version and time."
              icon={Mic}
            />
            <ChoiceCard
              name="consent"
              value="decline"
              checked={consent === 'decline'}
              onChange={() => setConsent('decline')}
              title="I do not consent"
              description={
                consentRequired
                  ? 'This venue cannot dispatch a helper without consent. You can change your choice or ask the front desk for alternatives.'
                  : 'No recording will take place for your service.'
              }
              icon={MicOff}
            />
          </div>

          {consentDeclined ? (
            <Alert tone="danger" className="mt-3" title="A helper cannot be requested without consent">
              Please change your choice to continue. If you are uncomfortable with recording, speak to the venue front
              desk — they can help you find another option.
            </Alert>
          ) : null}
        </Card>

        <Card className="p-5">
          <Checkbox
            label={
              <span>
                I accept the HELPY{' '}
                <Link href="/terms" target="_blank" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
                  service terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
                  privacy policy
                </Link>
                .
              </span>
            }
            description="Required. Your acceptance is recorded with a version and timestamp."
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
          />
          {fieldError.termsAccepted ? <p className="field-error">{fieldError.termsAccepted}</p> : null}

          <FormError message={formError} className="mt-4" />

          <Button type="submit" size="lg" className="mt-4 w-full" loading={submitting} disabled={consentDeclined}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Send request
          </Button>
          <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-navy-400">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            The venue is notified immediately. You can cancel while the request is waiting or assigned.
          </p>
        </Card>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-navy-400">
        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
        No payment is taken now. The final amount is calculated at the end of the service.
      </div>
    </div>
  );
}
