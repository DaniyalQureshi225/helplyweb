'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/brand';
import { Alert, Button, Spinner } from '@/components/ui/primitives';
import { Field, FormError, Input } from '@/components/ui/form';
import { useAuthStore, isAdminRole } from '@/stores/authStore';
import { errorMessage } from '@/lib/errors';

const schema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or admin username'),
  password: z.string().min(1, 'Enter your password'),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const login = useAuthStore((state) => state.login);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { identifier: '', password: '' } });

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      if (!isAdminRole(user.role)) return;
      const target = nextPath && nextPath.startsWith('/admin') ? nextPath : '/admin/dashboard';
      router.replace(target);
    }
  }, [status, user, router, nextPath]);

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const signedIn = await login(values);
      if (!isAdminRole(signedIn?.role)) {
        setFormError(
          'This account does not have admin access. Ask a super admin to review your role, or use the venue admin account.',
        );
        return;
      }
      const target = nextPath && nextPath.startsWith('/admin') ? nextPath : '/admin/dashboard';
      router.replace(target);
    } catch (error) {
      setFormError(errorMessage(error, 'We could not sign you in. Check your details and try again.'));
    }
  };

  if (status === 'loading' && !user) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Spinner />
        <p className="text-sm text-navy-500">Checking your session…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Email or username" htmlFor="admin-identifier" error={errors.identifier?.message} required>
        <Input
          id="admin-identifier"
          autoComplete="username"
          placeholder="you@venue.com"
          invalid={Boolean(errors.identifier)}
          {...register('identifier')}
        />
      </Field>

      <Field label="Password" htmlFor="admin-password" error={errors.password?.message} required>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
            aria-hidden="true"
          />
          <Input
            id="admin-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Your admin password"
            className="pl-9 pr-10"
            invalid={Boolean(errors.password)}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </Field>

      <FormError message={formError} />

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Sign in to console
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>

      <p className="flex items-start gap-2 rounded-xl bg-navy-50 px-3.5 py-3 text-xs leading-relaxed text-navy-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
        Admin sessions are short-lived. Your refresh token is stored in an httpOnly cookie and never exposed to browser
        scripts.
      </p>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-screen bg-sand-50 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-0 h-64 w-64 rounded-full bg-navy-500/30 blur-3xl"
          aria-hidden="true"
        />
        <Link href="/" className="relative inline-flex" aria-label="HELPY home">
          <Logo color="white" showTagline />
        </Link>
        <div className="relative max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-300">Venue operations</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
            One console for every guest, helper and rupee.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            Dispatch helpers, watch live sessions, verify payments and tips, review recordings with an audit trail, and
            run the incentive rules without spreadsheets.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/70">
            {[
              'Requests, sessions and service timers in one lifecycle',
              'Server-calculated bills and verified payments only',
              'Consent-gated recordings with admin-only playback',
              'Tip Champion and incentive rules computed by the backend',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">HELPY · Your Comfort, Our Priority.</p>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 transition hover:text-navy-900">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to site
          </Link>
          <div className="lg:hidden">
            <Logo />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-sm">
            <p className="eyebrow">Admin access</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-navy-900">Sign in to HELPY</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-navy-500">
              Use the admin account issued by your venue. Helper accounts cannot open this console.
            </p>

            <div className="mt-6">
              <Suspense
                fallback={
                  <div className="flex justify-center py-10">
                    <Spinner />
                  </div>
                }
              >
                <LoginForm />
              </Suspense>
            </div>

            <Alert tone="info" className="mt-5">
              Forgotten your password? Ask your HELPY super admin to reset it. Helpers should use the helper tools
              provided by their venue, not this console.
            </Alert>

            <p className="mt-6 text-center text-xs text-navy-400">
              Guest?{' '}
              <Link href="/get-assistance" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
                Get assistance instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
