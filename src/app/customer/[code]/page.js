'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, BadgeCheck, Clock3, MapPin, Phone, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { resolveQrToStore } from '@/lib/customerAuth';
import { hasValidCustomerToken, useCustomerStore } from '@/stores/customerStore';
import { customerApi } from '@/services/customerApi';
import { errorMessage, fieldErrors } from '@/lib/errors';
import { formatPkr } from '@/lib/utils';
import { Alert, Button, Card, ErrorState, LinkButton, Skeleton } from '@/components/ui/primitives';
import { Field, FormError, Input } from '@/components/ui/form';
import { toast } from '@/stores/uiStore';

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120, 'Please use a shorter name'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Enter a phone number with 10–15 digits, optionally starting with +'),
  email: z.string().trim().email('Enter a valid email address').max(200).optional().or(z.literal('')),
});

export default function QrEntryPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params?.code ?? '');
  const [phase, setPhase] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const location = useCustomerStore((state) => state.location);
  const pricing = useCustomerStore((state) => state.pricing);
  const policies = useCustomerStore((state) => state.policies);
  const categories = useCustomerStore((state) => state.categories);
  const storedCustomer = useCustomerStore((state) => state.customer);
  const storedQrCode = useCustomerStore((state) => state.qrCode);
  const hasIdentity = hasValidCustomerToken() && storedQrCode === code;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: storedCustomer?.name ?? '', phone: storedCustomer?.phone ?? '', email: storedCustomer?.email ?? '' },
  });

  useEffect(() => {
    let active = true;
    async function load() {
      if (!code) return;
      setPhase('loading');
      setLoadError(null);
      try {
        const state = useCustomerStore.getState();
        if (state.qrCode === code && state.qrToken) {
          setPhase('ready');
          return;
        }
        await resolveQrToStore(code);
        if (!active) return;
        const next = useCustomerStore.getState();
        if (next.customer) reset({ name: next.customer.name, phone: next.customer.phone, email: next.customer.email ?? '' });
        setPhase('ready');
      } catch (error) {
        if (!active) return;
        setLoadError(errorMessage(error, 'We could not open this QR code.'));
        setPhase('error');
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [code, reset]);

  const continueToRequest = async () => {
    try {
      const active = await customerApi.activeRequest();
      if (active?.id && !['CANCELLED', 'COMPLETED'].includes(active.status)) {
        useCustomerStore.getState().setRequest({ request: active, sessionId: active.session });
        router.replace(`/customer/track/${active.id}`);
        return;
      }
    } catch {
      // No active request is the normal path.
    }
    router.replace('/customer/request');
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const data = await customerApi.createCustomer({
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
      });
      useCustomerStore.getState().setCustomer({ customerToken: data.customerToken, customer: data.customer });
      toast.success(data.isNewCustomer ? 'Welcome to HELPY' : 'Welcome back', 'Your guest session is ready.');
      await continueToRequest();
    } catch (error) {
      const fields = fieldErrors(error);
      let handled = false;
      for (const [field, message] of Object.entries(fields)) {
        if (['name', 'phone', 'email'].includes(field)) {
          setError(field, { message });
          handled = true;
        }
      }
      if (!handled) setSubmitError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'loading') {
    return (
      <div className="space-y-4" aria-busy="true">
        <Card className="p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-7 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="space-y-4">
        <ErrorState error={loadError} title="This QR code did not open" />
        <Card className="p-5 text-sm leading-relaxed text-navy-600">
          <p className="font-semibold text-navy-900">What you can do</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Check that you scanned the HELPY QR code placed at the venue, not a photo of it.</li>
            <li>Ask the front desk for the current HELPY QR code.</li>
            <li>If the code is new, wait a moment and try again.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
              Try again
            </Button>
            <LinkButton href="/contact" size="sm" variant="ghost">
              Contact HELPY
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-navy-950 px-5 py-5 text-white">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            QR code verified
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold">{location?.name ?? 'Partner venue'}</h1>
          {location?.address?.city || location?.address?.line1 ? (
            <p className="mt-1 text-sm text-white/65">
              {[location.address?.line1, location.address?.city].filter(Boolean).join(', ')}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium">
            {pricing ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
                <Clock3 className="h-3.5 w-3.5 text-teal-300" aria-hidden="true" />
                {pricing.unitMinutes}-min block · {formatPkr(pricing.unitPricePkr)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-300" aria-hidden="true" />
              Consent-first recording
            </span>
          </div>
        </div>

        {categories.length ? (
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Available here</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {categories.slice(0, 8).map((category) => (
                <span key={category.id} className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
                  {category.name}
                </span>
              ))}
              {categories.length > 8 ? (
                <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-500">
                  +{categories.length - 8} more
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>

      {hasIdentity ? (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-900">Welcome back, {storedCustomer?.name}</p>
              <p className="mt-0.5 text-sm text-navy-500">{storedCustomer?.phone}</p>
              <p className="mt-1 text-xs text-navy-400">You are already verified at this venue.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={continueToRequest}>
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                useCustomerStore.getState().setCustomer({ customerToken: null, customer: null });
                reset({ name: '', phone: '', email: '' });
              }}
            >
              Use a different phone
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-navy-900">Tell us who you are</h2>
          <p className="mt-1 text-sm leading-relaxed text-navy-500">
            We use your phone number to recognise you on your next visit. No password or app download.
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field label="Full name" htmlFor="guest-name" error={errors.name?.message} required>
              <Input
                id="guest-name"
                autoComplete="name"
                placeholder="e.g. Ayesha Khan"
                invalid={Boolean(errors.name)}
                {...register('name')}
              />
            </Field>
            <Field
              label="Phone number"
              htmlFor="guest-phone"
              error={errors.phone?.message}
              hint="This is how your helper and the venue can reach you."
              required
            >
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" aria-hidden="true" />
                <Input
                  id="guest-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+92 300 1234567"
                  className="pl-9"
                  invalid={Boolean(errors.phone)}
                  {...register('phone')}
                />
              </div>
            </Field>
            <Field label="Email (optional)" htmlFor="guest-email" error={errors.email?.message}>
              <Input id="guest-email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
            </Field>

            <FormError message={submitError} />

            <Button type="submit" className="w-full" loading={submitting}>
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-navy-400">
              By continuing you agree to our{' '}
              <Link href="/terms" className="font-medium text-teal-700 underline-offset-2 hover:underline">
                service terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-medium text-teal-700 underline-offset-2 hover:underline">
                privacy policy
              </Link>
              .
            </p>
          </form>
        </Card>
      )}

      {policies?.recordingRequired ? (
        <Alert tone="info" title="This venue records services">
          <p className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              For safety and dispute resolution, this venue requires explicit recording consent before a helper is
              dispatched. You will review the choice before submitting your request.
            </span>
          </p>
        </Alert>
      ) : null}

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-navy-400">
        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
        Guests only need a phone number — never a password.
      </p>
    </div>
  );
}
