'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, KeyRound, Loader2, QrCode } from 'lucide-react';
import { resolveQrToStore } from '@/lib/customerAuth';
import { hasValidCustomerToken, useCustomerStore } from '@/stores/customerStore';
import { errorMessage } from '@/lib/errors';
import { Alert, Button, Card, LinkButton } from '@/components/ui/primitives';
import { Field, FormError, Input } from '@/components/ui/form';

export function AssistanceForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);

  useEffect(() => {
    const state = useCustomerStore.getState();
    if (hasValidCustomerToken() && state.customer) {
      setResume({
        name: state.customer.name,
        requestId: state.requestId,
        sessionId: state.sessionId,
        locationName: state.location?.name ?? null,
      });
    }
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const value = code.trim();
    setError('');
    if (!value) {
      setError('Enter the code printed under the QR code at your venue.');
      return;
    }
    setLoading(true);
    try {
      await resolveQrToStore(value);
      router.push(`/customer/${encodeURIComponent(value)}`);
    } catch (err) {
      setError(errorMessage(err, 'That code did not open. Check the code and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {resume ? (
        <Card className="border-teal-200 bg-teal-50/60 p-5">
          <p className="text-sm font-semibold text-teal-900">Welcome back, {resume.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-teal-800">
            Your guest session is still open{resume.locationName ? ` at ${resume.locationName}` : ''}. You can continue
            without scanning again.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {resume.requestId ? (
              <LinkButton href={`/customer/track/${resume.requestId}`} size="sm">
                Open my request
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
            ) : resume.sessionId ? (
              <LinkButton href={`/customer/service/${resume.sessionId}`} size="sm">
                Open my service
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
            ) : (
              <LinkButton href="/customer/request" size="sm">
                Request assistance
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
            )}
          </div>
        </Card>
      ) : null}

      <Card className="p-6">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-950 text-teal-300">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold text-navy-900">Enter your venue code</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-navy-500">
          The code is printed under the HELPY QR code on your table, key card or venue signage. It links you to the right
          location and its services.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <Field
            label="Venue code"
            htmlFor="venue-code"
            error={error || undefined}
            hint="For example: HELPY-LHR-01. Ask the front desk if you cannot find it."
          >
            <Input
              id="venue-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="HELPY-…"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              invalid={Boolean(error)}
              className="font-mono uppercase tracking-wide"
            />
          </Field>

          <FormError message={error} />

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            <QrCode className="h-4 w-4" aria-hidden="true" />
            Open assistance
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-navy-900">Scanning the QR code instead?</h3>
        <p className="mt-1 text-sm leading-relaxed text-navy-500">
          Open your phone camera and point it at the HELPY QR code. The page opens automatically — no app download, no
          password.
        </p>
        {loading ? (
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-navy-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Checking your venue…
          </p>
        ) : null}
        <p className="mt-3 text-xs leading-relaxed text-navy-400">
          Using a shared device?{' '}
          <Link href="/privacy" className="font-medium text-teal-700 underline-offset-2 hover:underline">
            Read how your guest session works
          </Link>
          .
        </p>
      </Card>

      <Alert tone="info" title="What you need">
        A phone number is all it takes to request help. You can choose not to record audio where the venue allows it —
        the page shows the venue&apos;s consent requirement before you submit.
      </Alert>
    </div>
  );
}
