'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Info,
  Lock,
  Mic,
  Phone,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { customerApi } from '@/services/customerApi';
import { useCustomerStore } from '@/stores/customerStore';
import { errorMessage } from '@/lib/errors';
import { formatDateTime, formatDuration, formatPkr } from '@/lib/utils';
import { StatusTimeline } from '@/components/customer/status-timeline';
import { Alert, Button, Card, ErrorState, LinkButton, Skeleton } from '@/components/ui/primitives';
import { DetailList, StatusBadge } from '@/components/ui/data';
import { toast } from '@/stores/uiStore';

export default function ServicePage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const sessionId = String(params?.sessionId ?? '');
  const customerToken = useCustomerStore((state) => state.customerToken);
  const categories = useCustomerStore((state) => state.categories);
  const [confirming, setConfirming] = useState(false);

  const query = useQuery({
    queryKey: ['customer', 'session', sessionId],
    queryFn: () => customerApi.session(sessionId),
    enabled: Boolean(sessionId && customerToken),
    refetchInterval: 10_000,
    retry: 1,
  });

  const detail = query.data;
  const session = detail?.session;

  useEffect(() => {
    if (session) useCustomerStore.getState().setSessionId(session.id);
  }, [session]);

  const confirmReceipt = async () => {
    setConfirming(true);
    try {
      await customerApi.confirmReceipt(sessionId);
      toast.success('Receipt confirmed', 'Thank you for confirming you have your belongings.');
      queryClient.invalidateQueries({ queryKey: ['customer', 'session', sessionId] });
    } catch (error) {
      toast.error('Could not confirm receipt', errorMessage(error));
    } finally {
      setConfirming(false);
    }
  };

  if (!customerToken) {
    return (
      <Card className="p-6 text-center">
        <h1 className="text-xl font-semibold">Open your guest session</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-navy-500">
          Scan the venue QR code and use the same phone number to reopen this service.
        </p>
        <LinkButton href="/get-assistance" className="mt-5">
          Open assistance page
        </LinkButton>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Card className="p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-7 w-2/3" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (query.isError) {
    return <ErrorState error={query.error} title="We could not load this service" onRetry={() => query.refetch()} />;
  }

  if (!detail || !session) return null;

  const status = session.status;
  const bill = detail.bill;
  const consent = detail.recordingConsent;
  const categoryName = session.category
    ? categories.find((category) => category.id === String(session.category))?.name
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Service {session.sessionNumber}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-navy-900">
            {status === 'COMPLETED'
              ? 'Service complete'
              : status === 'IN_PROGRESS'
                ? 'Service in progress'
                : status === 'CANCELLED'
                  ? 'Service cancelled'
                  : status === 'ASSIGNED'
                    ? 'Helper assigned'
                    : 'Preparing your service'}
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            {status === 'IN_PROGRESS'
              ? 'Your helper is with you. The venue controls the timer.'
              : status === 'COMPLETED'
                ? 'Your bill is calculated from the server-recorded start and end times.'
                : 'This page updates automatically.'}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {status === 'IN_PROGRESS' ? (
        <div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-600" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-teal-900">Live service</p>
            <p className="text-xs text-teal-700">Started {formatDateTime(session.startedAt)}</p>
          </div>
        </div>
      ) : null}

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">Service status</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-navy-500 hover:text-navy-800"
            onClick={() => query.refetch()}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
        <StatusTimeline
          status={status}
          timestamps={{
            CREATED: detail.request?.createdAt,
            ASSIGNED: session.createdAt,
            IN_PROGRESS: session.startedAt,
            COMPLETED: session.endedAt,
          }}
          className="mt-4"
        />
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">Details</h2>
        <DetailList
          columns={2}
          className="mt-4"
          items={[
            { label: 'Service', value: categoryName ?? 'General assistance' },
            { label: 'Request', value: detail.request?.requestNumber ?? '—' },
            { label: 'Started', value: session.startedAt ? formatDateTime(session.startedAt) : 'Not started yet' },
            { label: 'Ended', value: session.endedAt ? formatDateTime(session.endedAt) : '—' },
            { label: 'Duration', value: session.durationSeconds ? formatDuration(session.durationSeconds) : '—' },
            session.billTotalPkr !== null && session.billTotalPkr !== undefined
              ? { label: 'Bill total', value: formatPkr(session.billTotalPkr) }
              : null,
          ]}
        />
        {detail.request?.note ? (
          <div className="mt-4 rounded-xl bg-navy-50 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Your note</p>
            <p className="mt-1 whitespace-pre-line break-words text-sm text-navy-700">{detail.request.note}</p>
          </div>
        ) : null}
      </Card>

      {detail.helper ? (
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">Your helper</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <BadgeCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-navy-900">{detail.helper.name}</p>
              <p className="text-xs text-navy-500">Verified HELPY helper</p>
            </div>
            {detail.helper.phone ? (
              <a
                href={`tel:${String(detail.helper.phone).replace(/[^\d+]/g, '')}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-navy-200 px-3 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call
              </a>
            ) : null}
          </div>
        </Card>
      ) : null}

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-navy-500">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Recording & privacy
        </h2>
        <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-navy-600">
          {consent?.customerAccepted ? (
            <p className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-3 text-teal-900">
              <Mic className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Your recording consent is on file (policy {consent.policyVersion ?? 'current'}, recorded{' '}
                {formatDateTime(consent.customerAcceptedAt)}).
              </span>
            </p>
          ) : (
            <p className="flex items-start gap-2 rounded-xl border border-navy-200 bg-navy-50 px-3.5 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" aria-hidden="true" />
              <span>No customer recording consent is on file for this service.</span>
            </p>
          )}
          <p className="text-xs leading-relaxed text-navy-500">
            Recording only happens when the venue and the helper are authorised and consent is on record. There is no
            hidden recording: if a recording is active, the helper must show it on their device. Recordings are kept
            for the venue&apos;s retention period and are only reviewed by authorised administrators.
          </p>
          <Link href="/privacy" className="link-subtle inline-flex items-center gap-1 text-xs">
            Read the privacy policy
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </Card>

      {session.receiptConfirmedAt ? (
        <Alert tone="success" title="Belongings confirmed">
          You confirmed receipt of your belongings on {formatDateTime(session.receiptConfirmedAt)}.
        </Alert>
      ) : status === 'COMPLETED' ? (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-900">Do you have all your belongings?</p>
              <p className="mt-0.5 text-xs leading-relaxed text-navy-500">
                Confirming closes the service cleanly and protects both you and your helper.
              </p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={confirmReceipt} loading={confirming}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Yes, I have everything
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {bill ? (
        <Card className="overflow-hidden">
          <div className="border-b border-navy-100 bg-navy-50/60 px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-navy-900">Bill {bill.billNumber}</p>
              <StatusBadge status={bill.paymentStatus} />
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Total amount</p>
                <p className="mt-1 font-display text-3xl font-semibold text-navy-900">{formatPkr(bill.totalAmountPkr)}</p>
              </div>
              <span className="text-xs text-navy-500">Status: {bill.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <LinkButton href={`/customer/bill/${bill.id}`} size="sm">
                <FileText className="h-4 w-4" aria-hidden="true" />
                View bill & pay
              </LinkButton>
              <LinkButton href={`/customer/review/${sessionId}`} size="sm" variant="secondary">
                Leave a review
              </LinkButton>
            </div>
          </div>
        </Card>
      ) : status === 'COMPLETED' ? (
        <Alert tone="info" title="Your bill is being prepared">
          The venue generates the bill from the server-recorded service time. Refresh in a moment if it has not
          appeared.
        </Alert>
      ) : null}

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-navy-400">
        <Timer className="h-3.5 w-3.5" aria-hidden="true" />
        Service times, billing and recording consent are controlled by the HELPY backend.
      </p>
    </div>
  );
}
