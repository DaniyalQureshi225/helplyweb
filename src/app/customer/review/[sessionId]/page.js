'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  Coins,
  Heart,
  Home,
  Info,
  Lock,
  MessageSquareQuote,
  ShieldCheck,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { customerApi } from '@/services/customerApi';
import { useCustomerStore } from '@/stores/customerStore';
import { TIP_OPTIONS } from '@/lib/constants';
import { errorMessage, fieldErrors } from '@/lib/errors';
import { formatDateTime, formatPkr } from '@/lib/utils';
import { Alert, Button, Card, ErrorState, LinkButton, Skeleton } from '@/components/ui/primitives';
import { DetailList, StatusBadge } from '@/components/ui/data';
import { Field, FormError, Input, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { VoiceRecorder } from '@/components/customer/voice-recorder';
import { toast } from '@/stores/uiStore';

const RATING_LABELS = {
  1: 'Very poor',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''} — ${RATING_LABELS[star]}`}
            disabled={disabled}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(star)}
            className="rounded-lg p-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed"
          >
            <Star
              className={`h-9 w-9 transition ${
                star <= active ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-navy-200'
              }`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      <p className="text-xs font-medium text-navy-500">
        {value ? RATING_LABELS[value] : 'Tap a star to rate your helper'}
      </p>
    </div>
  );
}

function ReviewStars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-navy-200'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function ReviewPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const sessionId = String(params?.sessionId ?? '');
  const customerToken = useCustomerStore((state) => state.customerToken);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [voice, setVoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldError, setFieldError] = useState({});

  const [tipChoice, setTipChoice] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [tipPaymentId, setTipPaymentId] = useState('');
  const [tipNote, setTipNote] = useState('');
  const [tipError, setTipError] = useState('');
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [submittingTip, setSubmittingTip] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ['customer', 'session', sessionId],
    queryFn: () => customerApi.session(sessionId),
    enabled: Boolean(sessionId && customerToken),
    retry: 1,
  });

  const reviewQuery = useQuery({
    queryKey: ['customer', 'review', sessionId],
    queryFn: () => customerApi.reviews({ serviceSession: sessionId, limit: 5 }),
    enabled: Boolean(sessionId && customerToken),
    retry: 1,
  });

  const tipQuery = useQuery({
    queryKey: ['customer', 'tip', sessionId],
    queryFn: () => customerApi.tips({ serviceSession: sessionId, limit: 5 }),
    enabled: Boolean(sessionId && customerToken),
    retry: 1,
  });

  const paymentsQuery = useQuery({
    queryKey: ['customer', 'session-payments', sessionId],
    queryFn: () => customerApi.payments({ serviceSession: sessionId, limit: 50 }),
    enabled: Boolean(sessionId && customerToken),
    retry: 1,
  });

  const detail = sessionQuery.data;
  const session = detail?.session;
  const review = reviewQuery.data?.items?.[0] ?? null;
  const tip = tipQuery.data?.items?.[0] ?? null;
  const payments = paymentsQuery.data?.items ?? [];
  const confirmedPayments = useMemo(
    () => payments.filter((payment) => payment.status === 'CONFIRMED'),
    [payments],
  );

  useEffect(() => {
    if (confirmedPayments.length && !tipPaymentId) setTipPaymentId(confirmedPayments[0].id);
  }, [confirmedPayments, tipPaymentId]);

  const tipAmount = tipChoice === 'custom' ? Number(customTip) : tipChoice;

  const resolvedTipError = useMemo(() => {
    if (tipChoice === 'custom') {
      if (!Number.isInteger(tipAmount) || tipAmount <= 0) return 'Enter a whole amount greater than zero.';
      if (tipAmount > 100000) return 'The maximum tip is Rs. 100,000.';
    }
    if (tipChoice !== 0 && confirmedPayments.length && !tipPaymentId) return 'Choose the verified payment to link.';
    return '';
  }, [tipChoice, tipAmount, confirmedPayments.length, tipPaymentId]);

  const submitReview = async (event) => {
    event.preventDefault();
    setFormError('');
    setFieldError({});
    if (!rating) {
      setFormError('Choose a star rating before submitting your review.');
      return;
    }
    if (voice?.submitting) {
      setFormError('Please wait for the voice note to finish uploading.');
      return;
    }
    setSubmitting(true);
    try {
      await customerApi.createReview(sessionId, {
        rating,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
        ...(voice?.recordingId ? { voiceRecordingId: voice.recordingId } : {}),
        ...(voice?.durationSeconds ? { voiceDurationSeconds: voice.durationSeconds } : {}),
      });
      toast.success('Thank you for your review', 'Your feedback helps the venue keep standards high.');
      await queryClient.invalidateQueries({ queryKey: ['customer', 'review', sessionId] });
    } catch (error) {
      if (error?.code === 'DUPLICATE_RESOURCE' || error?.status === 409) {
        await queryClient.invalidateQueries({ queryKey: ['customer', 'review', sessionId] });
        toast.info('Review already received', 'You have already reviewed this service.');
      } else {
        const fields = fieldErrors(error);
        setFieldError(fields);
        setFormError(errorMessage(error, 'We could not submit your review. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openTipModal = () => {
    setTipError('');
    if (resolvedTipError) {
      setTipError(resolvedTipError);
      return;
    }
    setTipModalOpen(true);
  };

  const submitTip = async () => {
    setTipError('');
    setSubmittingTip(true);
    try {
      await customerApi.createTip(sessionId, {
        amountPkr: tipAmount,
        paymentId: tipPaymentId,
        ...(tipNote.trim() ? { note: tipNote.trim() } : {}),
      });
      setTipModalOpen(false);
      toast.success(
        tipAmount === 0 ? 'No tip recorded' : 'Tip submitted',
        tipAmount === 0 ? 'Thank you for letting us know.' : 'The venue verifies tips before they are paid out.',
      );
      await queryClient.invalidateQueries({ queryKey: ['customer', 'tip', sessionId] });
    } catch (error) {
      setTipError(errorMessage(error, 'We could not record your tip. Please try again.'));
    } finally {
      setSubmittingTip(false);
    }
  };

  if (!customerToken) {
    return (
      <Card className="p-6 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-navy-900">Open your guest session</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-navy-500">
          Reviews are tied to your verified visit. Scan the venue QR code and use the same phone number to reopen it.
        </p>
        <LinkButton href="/get-assistance" className="mt-5">
          Open assistance page
        </LinkButton>
      </Card>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Card className="p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-7 w-1/2" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-4 h-24 w-full" />
        </Card>
      </div>
    );
  }

  if (sessionQuery.isError) {
    return <ErrorState error={sessionQuery.error} title="We could not load this service" onRetry={() => sessionQuery.refetch()} />;
  }

  if (!detail || !session) return null;

  if (session.status !== 'COMPLETED') {
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <CircleAlert className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-navy-900">Your service is not finished yet</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-navy-500">
            Reviews and tips open once the venue marks the service complete. This page will work after that.
          </p>
          <LinkButton href={`/customer/service/${sessionId}`} className="mt-5">
            Open live service
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        </Card>
      </div>
    );
  }

  const bill = detail.bill;
  const helper = detail.helper;
  const tipLocked = !confirmedPayments.length;

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Service {session.sessionNumber}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-navy-900">
          {review ? 'Thank you for your feedback' : 'How did we do?'}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-navy-500">
          {review
            ? 'Your review is on file. You can still record an optional tip below.'
            : 'Your honest rating helps the venue recognise great helpers and fix problems.'}
        </p>
      </div>

      {helper ? (
        <Card className="flex items-center gap-3 p-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <BadgeCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy-900">{helper.name}</p>
            <p className="text-xs text-navy-500">Your HELPY helper · service completed {formatDateTime(session.endedAt)}</p>
          </div>
        </Card>
      ) : null}

      {review ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ReviewStars rating={review.rating} />
            <StatusBadge status={review.status} />
          </div>
          {review.comment ? (
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-navy-700">{review.comment}</p>
          ) : (
            <p className="mt-3 text-sm text-navy-500">No written comment.</p>
          )}
          {review.hasVoiceFeedback ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600">
              <MessageSquareQuote className="h-3.5 w-3.5" aria-hidden="true" />
              Voice note attached
            </p>
          ) : null}
          <p className="mt-3 text-xs text-navy-400">Submitted {formatDateTime(review.createdAt)}</p>
        </Card>
      ) : (
        <form onSubmit={submitReview} className="space-y-4" noValidate>
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">Your rating</h2>
            <div className="mt-3">
              <StarPicker value={rating} onChange={setRating} disabled={submitting} />
            </div>
            {fieldError.rating ? <p className="field-error mt-2">{fieldError.rating}</p> : null}
          </Card>

          <Card className="p-5">
            <Field
              label="Anything you want to add? (optional)"
              htmlFor="review-comment"
              hint={`${comment.length}/2000 characters. Please do not include phone numbers or payment details.`}
              error={fieldError.comment}
            >
              <Textarea
                id="review-comment"
                rows={4}
                maxLength={2000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="What went well? What could have been better?"
              />
            </Field>
          </Card>

          <VoiceRecorder sessionId={sessionId} onUploaded={setVoice} disabled={submitting} />

          <FormError message={formError} />

          <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!rating}>
            <Star className="h-4 w-4" aria-hidden="true" />
            Submit review
          </Button>
          <p className="text-center text-[11px] leading-relaxed text-navy-400">
            Reviews are attached to this completed service and cannot be edited afterwards.
          </p>
        </form>
      )}

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-navy-500">
              <Heart className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
              Optional tip
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-navy-500">
              Tips are a thank-you for your helper. They are verified by the venue before being counted.
            </p>
          </div>
          {tip ? <StatusBadge status={tip.status} /> : null}
        </div>

        {tip ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-end justify-between gap-3 rounded-xl bg-navy-50 px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                  {tip.amountPkr === 0 ? 'No tip chosen' : 'Tip amount'}
                </p>
                <p className="mt-0.5 font-display text-2xl font-semibold text-navy-900">
                  {tip.amountPkr === 0 ? '—' : formatPkr(tip.amountPkr)}
                </p>
              </div>
              <p className="text-xs text-navy-500">Linked to {tip.paymentMethod}</p>
            </div>
            {tip.status === 'PENDING' ? (
              <Alert tone="info" title="Tip pending verification">
                Only tips the venue verifies count towards your helper&apos;s earnings, incentives and the monthly Tip
                Champion award. No further action is needed from you.
              </Alert>
            ) : null}
            {tip.status === 'REJECTED' ? (
              <Alert tone="warning" title="Tip could not be verified">
                The venue could not match this tip to a verified payment. Speak to the front desk if you believe this is
                wrong.
              </Alert>
            ) : null}
            {tip.amountPkr === 0 ? (
              <p className="text-xs text-navy-500">You chose not to add a tip. Your helper is still paid for the service.</p>
            ) : null}
          </div>
        ) : tipLocked ? (
          <div className="mt-4 space-y-3">
            <Alert tone="warning" title="A verified payment is needed first">
              HELPY links every tip to a verified payment so helpers are paid correctly. Your bill currently has no
              confirmed payment.
            </Alert>
            <div className="flex flex-wrap gap-2">
              {bill ? (
                <LinkButton href={`/customer/bill/${bill.id}`} size="sm">
                  <Coins className="h-4 w-4" aria-hidden="true" />
                  Open bill & pay
                </LinkButton>
              ) : null}
              <Button size="sm" variant="secondary" onClick={() => paymentsQuery.refetch()} loading={paymentsQuery.isFetching}>
                Check again
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-navy-400">
              After the venue confirms your payment, return here to add a tip.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Choose an amount</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TIP_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTipChoice(option)}
                    aria-pressed={tipChoice === option}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      tipChoice === option
                        ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                        : 'border-navy-200 bg-white text-navy-700 hover:border-navy-300'
                    }`}
                  >
                    {option === 0 ? 'No tip' : formatPkr(option)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setTipChoice('custom')}
                aria-pressed={tipChoice === 'custom'}
                className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  tipChoice === 'custom'
                    ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                    : 'border-navy-200 bg-white text-navy-700 hover:border-navy-300'
                }`}
              >
                Custom amount
              </button>
              {tipChoice === 'custom' ? (
                <div className="mt-3">
                  <Field label="Custom tip amount" htmlFor="custom-tip" hint="Whole rupees, up to Rs. 100,000.">
                    <Input
                      id="custom-tip"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={100000}
                      step={1}
                      value={customTip}
                      onChange={(event) => setCustomTip(event.target.value)}
                    />
                  </Field>
                </div>
              ) : null}
            </div>

            {tipChoice !== 0 ? (
              <>
                <Field
                  label="Link to verified payment"
                  htmlFor="tip-payment"
                  hint="The venue matches the tip to a payment it has already confirmed."
                >
                  <select
                    id="tip-payment"
                    className="input-base"
                    value={tipPaymentId}
                    onChange={(event) => setTipPaymentId(event.target.value)}
                  >
                    {confirmedPayments.map((payment) => (
                      <option key={payment.id} value={payment.id}>
                        {formatPkr(payment.amountPkr)} · {payment.method}
                        {payment.transactionReference ? ` · ${payment.transactionReference}` : ''}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Note for your helper (optional)" htmlFor="tip-note" hint="Up to 500 characters.">
                  <Input
                    id="tip-note"
                    value={tipNote}
                    maxLength={500}
                    onChange={(event) => setTipNote(event.target.value)}
                    placeholder="e.g. Thank you for the extra care."
                  />
                </Field>
              </>
            ) : null}

            {tipError ? (
              <Alert tone="danger">{tipError}</Alert>
            ) : null}

            <Button type="button" className="w-full" size="lg" onClick={openTipModal}>
              <ThumbsUp className="h-4 w-4" aria-hidden="true" />
              {tipChoice === 0 ? 'Record no tip' : `Continue with ${formatPkr(tipAmount)}`}
            </Button>
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-navy-400">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              You will see a confirmation before anything is recorded. No tip is charged automatically.
            </p>
          </div>
        )}
      </Card>

      {bill ? (
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">Bill summary</h2>
          <DetailList
            className="mt-3"
            columns={2}
            items={[
              { label: 'Bill', value: bill.billNumber },
              { label: 'Total', value: formatPkr(bill.totalAmountPkr) },
              { label: 'Payment status', value: bill.paymentStatus },
              { label: 'Service', value: session.sessionNumber },
            ]}
          />
          <LinkButton href={`/customer/bill/${bill.id}`} size="sm" variant="secondary" className="mt-4">
            View full bill
          </LinkButton>
        </Card>
      ) : null}

      <div className="grid gap-2.5 sm:grid-cols-2">
        <LinkButton href="/" variant="secondary" className="w-full">
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to HELPY
        </LinkButton>
        <LinkButton href="/get-assistance" variant="ghost" className="w-full">
          Need something else?
        </LinkButton>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-navy-400">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Reviews and tips are stored by the HELPY backend and visible only to authorised venue staff.
      </p>

      <Modal
        open={tipModalOpen}
        onClose={submittingTip ? () => {} : () => setTipModalOpen(false)}
        title={tipAmount === 0 ? 'Record no tip?' : `Add a ${formatPkr(tipAmount)} tip?`}
        description={
          tipAmount === 0
            ? 'This tells the venue you chose not to tip. You can only record this choice once.'
            : 'The tip is linked to your verified payment and must be confirmed by the venue before it counts.'
        }
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setTipModalOpen(false)} disabled={submittingTip}>
              Go back
            </Button>
            <Button size="sm" onClick={submitTip} loading={submittingTip} disabled={Boolean(resolvedTipError)}>
              {tipAmount === 0 ? 'Confirm no tip' : `Confirm ${formatPkr(tipAmount)}`}
            </Button>
          </div>
        }
      >
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-navy-500">Amount</dt>
            <dd className="font-semibold text-navy-900">{tipAmount === 0 ? 'No tip' : formatPkr(tipAmount)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-navy-500">Helper</dt>
            <dd className="font-medium text-navy-900">{helper?.name ?? 'Assigned helper'}</dd>
          </div>
          {tipAmount !== 0 ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-navy-500">Linked payment</dt>
              <dd className="font-medium text-navy-900">
                {confirmedPayments.find((payment) => payment.id === tipPaymentId)?.transactionReference ?? 'Verified payment'}
              </dd>
            </div>
          ) : null}
        </dl>
        {tipError ? (
          <Alert tone="danger" className="mt-3">
            {tipError}
          </Alert>
        ) : null}
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-navy-400">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          A tip can only be recorded once per service. Contact the front desk to correct a mistake.
        </p>
      </Modal>

      <p className="text-center text-[11px] text-navy-400">
        Something wrong with this service?{' '}
        <Link href="/contact" className="font-medium text-teal-700 underline-offset-2 hover:underline">
          Contact HELPY
        </Link>
      </p>
    </div>
  );
}
