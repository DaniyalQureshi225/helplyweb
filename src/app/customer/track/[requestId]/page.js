'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, CircleAlert, Headphones, Phone, RefreshCw, Timer, XCircle } from 'lucide-react';
import { customerApi } from '@/services/customerApi';
import { connectSocket, SOCKET_EVENTS } from '@/services/socket';
import { useCustomerStore } from '@/stores/customerStore';
import { errorMessage } from '@/lib/errors';
import { formatDateTime, formatTime } from '@/lib/utils';
import { StatusTimeline } from '@/components/customer/status-timeline';
import { Alert, Button, Card, ErrorState, LinkButton, Skeleton } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/data';
import { Field, FormError, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { toast } from '@/stores/uiStore';

export default function TrackPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const requestId = String(params?.requestId ?? '');
  const customerToken = useCustomerStore((state) => state.customerToken);
  const categories = useCustomerStore((state) => state.categories);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const requestQuery = useQuery({
    queryKey: ['customer', 'request', requestId],
    queryFn: () => customerApi.request(requestId),
    enabled: Boolean(requestId && customerToken),
    refetchInterval: 10_000,
    retry: 1,
  });

  const request = requestQuery.data;
  const sessionId = request?.session ?? null;

  const sessionQuery = useQuery({
    queryKey: ['customer', 'session', sessionId],
    queryFn: () => customerApi.session(sessionId),
    enabled: Boolean(sessionId && customerToken),
    refetchInterval: 10_000,
    retry: 1,
  });

  const session = sessionQuery.data;

  useEffect(() => {
    if (!customerToken) return undefined;
    const socket = connectSocket(customerToken);
    if (!socket) return undefined;
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'session', sessionId] });
    };
    [
      SOCKET_EVENTS.REQUEST_ASSIGNED,
      SOCKET_EVENTS.REQUEST_CANCELLED,
      SOCKET_EVENTS.SERVICE_STARTED,
      SOCKET_EVENTS.SERVICE_ENDED,
      SOCKET_EVENTS.BILL_GENERATED,
    ].forEach((event) => socket.on(event, refresh));
    return () => socket.disconnect();
  }, [customerToken, requestId, sessionId, queryClient]);

  const categoryName = useMemo(() => {
    if (!request?.category) return null;
    return categories.find((category) => category.id === String(request.category))?.name ?? null;
  }, [request?.category, categories]);

  const timestamps = useMemo(
    () => ({
      CREATED: request?.createdAt,
      ASSIGNED: request?.assignedAt,
      IN_PROGRESS: session?.session?.startedAt,
      COMPLETED: session?.session?.endedAt ?? request?.completedAt,
    }),
    [request, session],
  );

  const canCancel = request && ['CREATED', 'ASSIGNED'].includes(request.status);

  const submitCancel = async () => {
    setCancelError('');
    if (reason && reason.trim().length < 3) {
      setCancelError('Please add a little more detail, or leave the reason empty.');
      return;
    }
    setCancelling(true);
    try {
      await customerApi.cancelRequest(requestId, reason.trim() || undefined);
      toast.success('Request cancelled', 'The venue team has been notified.');
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customer', 'request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'session', sessionId] });
    } catch (error) {
      setCancelError(errorMessage(error, 'We could not cancel this request.'));
    } finally {
      setCancelling(false);
    }
  };

  if (!customerToken) {
    return (
      <Card className="p-6 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">
          <CircleAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-navy-900">Open your guest session</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-navy-500">
          Your guest session is not available on this device. Scan the venue QR code again, then use the same phone
          number to resume your request.
        </p>
        <LinkButton href="/get-assistance" className="mt-5">
          Open assistance page
        </LinkButton>
      </Card>
    );
  }

  if (requestQuery.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Card className="p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-7 w-1/2" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 space-y-4">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (requestQuery.isError) {
    return (
      <div className="space-y-4">
        <ErrorState
          error={requestQuery.error}
          title="We could not load your request"
          onRetry={() => requestQuery.refetch()}
        />
        <p className="text-center text-xs text-navy-400">
          If you scanned a new QR code, your previous session may not have access to this request. Ask the front desk
          for help.
        </p>
      </div>
    );
  }

  if (!request) return null;

  const status = request.status;
  const live = status === 'IN_PROGRESS';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Request {request.requestNumber}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-navy-900">
            {status === 'COMPLETED'
              ? 'Your service is complete'
              : status === 'CANCELLED'
                ? 'Request cancelled'
                : status === 'IN_PROGRESS'
                  ? 'Your helper is with you'
                  : status === 'ASSIGNED'
                    ? 'A helper is on the way'
                    : 'Waiting for the venue team'}
          </h1>
        </div>
        <StatusBadge status={status} />
      </div>

      {live ? (
        <div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-600" />
          </span>
          <div>
            <p className="text-sm font-semibold text-teal-900">Service in progress</p>
            <p className="text-xs text-teal-700">The timer is running on the venue side. Your bill is calculated when it ends.</p>
          </div>
        </div>
      ) : null}

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">Progress</h2>
          <button
            type="button"
            onClick={() => {
              requestQuery.refetch();
              if (sessionId) sessionQuery.refetch();
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-navy-500 hover:text-navy-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${requestQuery.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
        <StatusTimeline status={status} timestamps={timestamps} className="mt-4" />
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">Request details</h2>
        <dl className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Service</dt>
            <dd className="mt-0.5 text-sm text-navy-800">{categoryName ?? 'General assistance'}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Requested</dt>
            <dd className="mt-0.5 text-sm text-navy-800">{formatDateTime(request.createdAt)}</dd>
          </div>
          {request.customerNote ? (
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Your note</dt>
              <dd className="mt-0.5 whitespace-pre-line break-words text-sm text-navy-700">{request.customerNote}</dd>
            </div>
          ) : null}
        </dl>
      </Card>

      {session?.helper ? (
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-500">Your helper</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <BadgeCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-navy-900">{session.helper.name}</p>
              <p className="text-xs text-navy-500">Verified HELPY helper</p>
            </div>
            {session.helper.phone ? (
              <a
                href={`tel:${String(session.helper.phone).replace(/[^\d+]/g, '')}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-navy-200 px-3 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call
              </a>
            ) : null}
          </div>
        </Card>
      ) : null}

      {session?.recordingConsent?.customerAccepted ? (
        <Alert tone="info" title="Recording consent on file">
          You consented to service recording under policy version{' '}
          <strong>{session.recordingConsent.policyVersion ?? 'current'}</strong>. Recording is never covert and stops
          when the service ends.
        </Alert>
      ) : null}

      <div className="grid gap-2.5 sm:grid-cols-2">
        {sessionId ? (
          <LinkButton href={`/customer/service/${sessionId}`} variant={status === 'COMPLETED' ? 'primary' : 'secondary'} className="w-full">
            {status === 'COMPLETED' ? 'View service summary' : 'Open live service'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        ) : null}
        {sessionId && status === 'COMPLETED' ? (
          <LinkButton href={`/customer/review/${sessionId}`} variant="accent" className="w-full">
            Leave a review
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
        ) : null}
      </div>

      {canCancel ? (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <XCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-900">Need to cancel?</p>
              <p className="mt-0.5 text-xs leading-relaxed text-navy-500">
                You can cancel while the request is waiting or assigned. Once the helper starts the service, contact
                the venue front desk instead.
              </p>
              <Button variant="dangerSoft" size="sm" className="mt-3" onClick={() => setCancelOpen(true)}>
                Cancel request
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {status === 'CANCELLED' ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              useCustomerStore.getState().clearRequest();
              router.push('/customer/request');
            }}
          >
            Start a new request
          </Button>
          <LinkButton href="/contact" variant="ghost" className="w-full">
            <Headphones className="h-4 w-4" aria-hidden="true" />
            Contact support
          </LinkButton>
        </div>
      ) : null}

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-navy-400">
        <Timer className="h-3.5 w-3.5" aria-hidden="true" />
        This page refreshes automatically every few seconds.
      </p>

      <Modal
        open={cancelOpen}
        onClose={cancelling ? () => {} : () => setCancelOpen(false)}
        title="Cancel this request?"
        description="The venue team will stop looking for a helper. If a helper is already assigned, they will be notified."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCancelOpen(false)} disabled={cancelling}>
              Keep request
            </Button>
            <Button variant="danger" size="sm" onClick={submitCancel} loading={cancelling}>
              Cancel request
            </Button>
          </div>
        }
      >
        <Field label="Reason (optional)" htmlFor="cancel-reason" hint="A short reason helps the venue improve.">
          <Textarea
            id="cancel-reason"
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. I no longer need assistance."
          />
        </Field>
        <FormError message={cancelError} className="mt-3" />
      </Modal>
    </div>
  );
}
