'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Hourglass,
  Info,
  Lock,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
import { customerApi } from '@/services/customerApi';
import { useCustomerStore } from '@/stores/customerStore';
import { CUSTOMER_PAYMENT_METHODS, PAYMENT_METHODS } from '@/lib/constants';
import { errorMessage, fieldErrors } from '@/lib/errors';
import { formatDateTime, formatDuration, formatPkr } from '@/lib/utils';
import { Alert, Button, Card, ErrorState, LinkButton, Skeleton } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/data';
import { Field, FormError, Input, Select } from '@/components/ui/form';
import { toast } from '@/stores/uiStore';

const METHOD_ICONS = {
  CARD: CreditCard,
  JAZZCASH: Smartphone,
  EASYPAISA: Smartphone,
  BANK_TRANSFER: Banknote,
  OTHER: ReceiptText,
};

function methodLabel(value) {
  return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value;
}

export default function BillPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const billId = String(params?.billId ?? '');
  const customerToken = useCustomerStore((state) => state.customerToken);

  const [method, setMethod] = useState(CUSTOMER_PAYMENT_METHODS[0].value);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [justSubmitted, setJustSubmitted] = useState(false);

  const billQuery = useQuery({
    queryKey: ['customer', 'bill', billId],
    queryFn: () => customerApi.bill(billId),
    enabled: Boolean(billId && customerToken),
    refetchInterval: 20_000,
    retry: 1,
  });

  const paymentsQuery = useQuery({
    queryKey: ['customer', 'bill-payments', billId],
    queryFn: () => customerApi.payments({ bill: billId, limit: 20 }),
    enabled: Boolean(billId && customerToken),
    refetchInterval: 20_000,
    retry: 1,
  });

  const bill = billQuery.data;
  const payments = paymentsQuery.data?.items ?? [];

  const paid = Number(bill?.amountPaidPkr ?? 0);
  const total = Number(bill?.totalAmountPkr ?? 0);
  const remaining = Math.max(0, total - paid);
  const pendingPayments = useMemo(() => payments.filter((payment) => payment.status === 'PENDING'), [payments]);
  const confirmedPayments = useMemo(() => payments.filter((payment) => payment.status === 'CONFIRMED'), [payments]);
  const settled = bill?.paymentStatus === 'PAID' || remaining === 0;
  const sessionId = bill?.serviceSession ?? null;

  useEffect(() => {
    if (!bill || settled) return;
    setAmount(String(remaining));
  }, [bill, settled, remaining]);

  const submitPayment = async (event) => {
    event.preventDefault();
    setFormError('');
    setFieldError({});

    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setFieldError({ amountPkr: 'Enter a whole amount greater than zero.' });
      return;
    }
    if (parsed > remaining) {
      setFieldError({ amountPkr: `The most you can pay now is ${formatPkr(remaining)}.` });
      return;
    }
    if (reference.trim().length < 3) {
      setFieldError({ transactionReference: 'Enter the reference shown in your banking app.' });
      return;
    }

    setSubmitting(true);
    try {
      await customerApi.createPayment({
        billId,
        amountPkr: parsed,
        method,
        transactionReference: reference.trim(),
      });
      setJustSubmitted(true);
      setReference('');
      toast.success('Payment submitted', 'The venue will verify it and update your bill.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customer', 'bill', billId] }),
        queryClient.invalidateQueries({ queryKey: ['customer', 'bill-payments', billId] }),
      ]);
    } catch (error) {
      const fields = fieldErrors(error);
      setFieldError(fields);
      setFormError(errorMessage(error, 'We could not submit your payment. Please try again.'));
    } finally {
      setSubmitting(false);
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
          For your privacy, bills open only inside your verified guest session. Scan the venue QR code and use the same
          phone number to reopen this bill.
        </p>
        <LinkButton href="/get-assistance" className="mt-5">
          Open assistance page
        </LinkButton>
      </Card>
    );
  }

  if (billQuery.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Card className="p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-10 w-1/2" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      </div>
    );
  }

  if (billQuery.isError) {
    return (
      <div className="space-y-4">
        <ErrorState error={billQuery.error} title="We could not load this bill" onRetry={() => billQuery.refetch()} />
        <Card className="p-5 text-sm leading-relaxed text-navy-600">
          Bills are generated by the venue after a service ends. If your service has just finished, wait a moment and
          refresh. If the problem continues, ask the front desk to check the bill.
        </Card>
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Bill {bill.billNumber}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-navy-900">Your final bill</h1>
          <p className="mt-1 text-sm text-navy-500">
            Issued {formatDateTime(bill.generatedAt ?? bill.createdAt)}
          </p>
        </div>
        <StatusBadge status={bill.paymentStatus} />
      </div>

      <Card className="overflow-hidden">
        <div className="bg-navy-950 px-5 py-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300">Total amount</p>
          <p className="mt-1 font-display text-4xl font-semibold">{formatPkr(total)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50">Paid</p>
              <p className="mt-0.5 font-semibold text-white">{formatPkr(paid)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50">Outstanding</p>
              <p className="mt-0.5 font-semibold text-white">{formatPkr(remaining)}</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-navy-100">
          <div className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <div className="flex items-center gap-2 text-navy-600">
              <Clock3 className="h-4 w-4 text-navy-400" aria-hidden="true" />
              Service duration
            </div>
            <span className="font-medium text-navy-900">{formatDuration(bill.durationSeconds ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <div className="flex items-center gap-2 text-navy-600">
              <Hourglass className="h-4 w-4 text-navy-400" aria-hidden="true" />
              Billable blocks
            </div>
            <span className="font-medium text-navy-900">
              {bill.billableBlocks} × {bill.unitMinutes} min
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <div className="flex items-center gap-2 text-navy-600">
              <FileText className="h-4 w-4 text-navy-400" aria-hidden="true" />
              Rate per block
            </div>
            <span className="font-medium text-navy-900">{formatPkr(bill.unitPricePkr ?? 0)}</span>
          </div>
          {bill.status === 'VOID' ? (
            <div className="px-5 py-3">
              <Alert tone="warning" title="This bill was voided by the venue">
                A voided bill is not payable. Ask the front desk if you have a question about it.
              </Alert>
            </div>
          ) : null}
        </div>
      </Card>

      <p className="flex items-start gap-2 rounded-xl bg-navy-50 px-3.5 py-3 text-xs leading-relaxed text-navy-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" aria-hidden="true" />
        The venue calculates this amount from server-recorded service times and the pricing agreed for this location.
        HELPY never recalculates or edits a final bill in the browser.
      </p>

      {settled ? (
        <Alert tone="success" title="This bill is settled">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Thank you — nothing more is due. You can add a review and an optional tip for your helper.
          </span>
        </Alert>
      ) : null}

      {pendingPayments.length ? (
        <Alert tone="info" title="Payment awaiting verification">
          The venue is checking your payment. Your bill updates automatically once it is confirmed — you do not need to
          submit it again.
          <ul className="mt-2 space-y-1 text-xs">
            {pendingPayments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-2">
                <span>
                  {formatPkr(payment.amountPkr)} · {methodLabel(payment.method)} · ref {payment.transactionReference}
                </span>
                <span className="font-semibold uppercase tracking-wider">Pending</span>
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {!settled && bill.status !== 'VOID' ? (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">Pay from your phone</h2>
            <button
              type="button"
              onClick={() => {
                billQuery.refetch();
                paymentsQuery.refetch();
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-navy-500 hover:text-navy-800"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${billQuery.isFetching || paymentsQuery.isFetching ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Refresh
            </button>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-navy-500">
            Transfer {formatPkr(remaining)} using your banking app or card, then enter the reference here. The venue
            marks it paid after verification.
          </p>

          {justSubmitted ? (
            <Alert tone="warning" className="mt-4" title="Submitted — awaiting verification">
              Keep your payment receipt until the venue confirms. If the reference was wrong, speak to the front desk so
              they can reject the pending payment.
            </Alert>
          ) : null}

          <form className="mt-4 space-y-4" onSubmit={submitPayment} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount" htmlFor="pay-amount" error={fieldError.amountPkr} required>
                <Input
                  id="pay-amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={remaining}
                  step={1}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  invalid={Boolean(fieldError.amountPkr)}
                />
              </Field>
              <Field label="Payment method" htmlFor="pay-method" error={fieldError.method} required>
                <Select id="pay-method" value={method} onChange={(event) => setMethod(event.target.value)}>
                  {CUSTOMER_PAYMENT_METHODS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              label="Transaction reference"
              htmlFor="pay-reference"
              error={fieldError.transactionReference}
              hint="The reference or approval code your bank shows after the transfer."
              required
            >
              <Input
                id="pay-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="e.g. 8842190345"
                maxLength={120}
                invalid={Boolean(fieldError.transactionReference)}
              />
            </Field>

            <FormError message={formError} />

            <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={remaining <= 0}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Submit payment for verification
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-navy-400">
              No card details pass through HELPY. This records a transfer you already made so the venue can verify it.
            </p>
          </form>
        </Card>
      ) : null}

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">Pay at the venue</h2>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          You can also settle the bill in cash or by card machine at the front desk. Staff record that payment in HELPY,
          and it appears on this page immediately.
        </p>
      </Card>

      {payments.length ? (
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">Payment history</h2>
          <ul className="mt-3 divide-y divide-navy-100">
            {payments.map((payment) => {
              const Icon = METHOD_ICONS[payment.method] ?? ReceiptText;
              return (
                <li key={payment.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 gap-2.5">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-900">
                        {formatPkr(payment.amountPkr)} · {methodLabel(payment.method)}
                      </p>
                      <p className="text-xs text-navy-500">
                        {formatDateTime(payment.createdAt)}
                        {payment.transactionReference ? ` · ref ${payment.transactionReference}` : ''}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={payment.status} />
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {bill.status === 'VOID' ? (
        <Alert tone="warning" title="Do not pay this bill">
          It has been voided by the venue.
        </Alert>
      ) : null}

      {sessionId ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <LinkButton href={`/customer/service/${sessionId}`} variant="secondary" className="w-full">
            View service
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
          {settled || confirmedPayments.length ? (
            <LinkButton href={`/customer/review/${sessionId}`} variant="accent" className="w-full">
              Review your helper
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
          ) : (
            <LinkButton href={`/customer/service/${sessionId}`} variant="accent" className="w-full">
              Review & optional tip
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
          )}
        </div>
      ) : null}

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-navy-400">
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        Never share card numbers, PINs or one-time codes with anyone, including HELPY staff.
      </p>
    </div>
  );
}
