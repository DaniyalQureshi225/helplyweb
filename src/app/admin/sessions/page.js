'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  FileText,
  Mic,
  RefreshCw,
  ReceiptText,
  ShieldCheck,
  Timer,
  UserRound,
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { STATUS_LABELS } from '@/lib/constants';
import { errorMessage } from '@/lib/errors';
import { formatDateTime, formatDuration, formatPkr } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Button, Card, EmptyState, LinkButton, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatusBadge } from '@/components/ui/data';
import { Select, Textarea } from '@/components/ui/form';
import { ConfirmDialog, Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, useAdminFilters, useCatalog, useDirectory } from '@/components/admin/list-utils';

const SESSION_STATUSES = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function AdminSessionsPage() {
  const queryClient = useQueryClient();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    status: '',
    helper: '',
    customer: '',
    from: '',
    to: '',
  });
  const { helperName, customerName, helperOptions } = useDirectory();
  const { categoryName } = useCatalog();

  const [selectedId, setSelectedId] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    if (sessionParam) setSelectedId(sessionParam);
  }, []);

  const listQuery = useQuery({
    queryKey: ['admin', 'sessions', queryParams],
    queryFn: () => adminApi.sessions.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'session', selectedId],
    queryFn: () => adminApi.sessions.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };
  const detail = detailQuery.data;
  const session = detail?.session;
  const recordingReady = Boolean(
    detail?.recordingConsent?.customerAccepted && detail?.recordingConsent?.helperAccepted,
  );

  const refresh = () => {
    listQuery.refetch();
    if (selectedId) detailQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const openSession = (row) => {
    setSelectedId(row.id);
    setActionError('');
  };

  const cancelSession = async () => {
    setCancelling(true);
    setActionError('');
    try {
      await adminApi.sessions.cancel(selectedId, cancelReason.trim() || undefined);
      toast.success('Session cancelled', 'The request and helper availability were updated.');
      setCancelOpen(false);
      setCancelReason('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'session', selectedId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'requests'] }),
      ]);
    } catch (error) {
      setActionError(errorMessage(error, 'Could not cancel this session.'));
    } finally {
      setCancelling(false);
    }
  };

  const generateBill = async () => {
    setGenerating(true);
    setActionError('');
    try {
      await adminApi.bills.generate(selectedId);
      toast.success('Bill ready', 'The server calculated the bill from recorded times.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'session', selectedId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'bills'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
      ]);
    } catch (error) {
      setActionError(errorMessage(error, 'Could not generate the bill.'));
    } finally {
      setGenerating(false);
    }
  };

  const columns = [
    {
      key: 'session',
      header: 'Session',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.sessionNumber}</p>
          <p className="text-xs text-navy-500">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    { key: 'guest', header: 'Guest', cell: (row) => customerName(row.customer) },
    {
      key: 'helper',
      header: 'Helper',
      cell: (row) => (row.helper ? helperName(row.helper) : <span className="text-xs uppercase tracking-wider text-amber-600">Unassigned</span>),
    },
    { key: 'service', header: 'Service', cell: (row) => categoryName(row.category) },
    {
      key: 'duration',
      header: 'Duration',
      cell: (row) => (row.durationSeconds ? formatDuration(row.durationSeconds) : '—'),
    },
    {
      key: 'bill',
      header: 'Bill',
      align: 'right',
      cell: (row) =>
        row.billTotalPkr !== null && row.billTotalPkr !== undefined ? (
          <span className="font-semibold text-navy-900">{formatPkr(row.billTotalPkr)}</span>
        ) : (
          <span className="text-xs text-navy-400">Not generated</span>
        ),
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Service sessions"
        description="The authoritative service record. Times, bills and consent all live here."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={listQuery.isFetching}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Status" htmlFor="session-status">
            <Select id="session-status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {SESSION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Helper" htmlFor="session-helper">
            <Select id="session-helper" value={filters.helper} onChange={(event) => setFilter('helper', event.target.value)}>
              <option value="">All helpers</option>
              {helperOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="From" htmlFor="session-from">
            <input
              id="session-from"
              type="date"
              className="input-base"
              value={filters.from}
              onChange={(event) => setFilter('from', event.target.value)}
            />
          </FilterField>
          <FilterField label="To" htmlFor="session-to">
            <input
              id="session-to"
              type="date"
              className="input-base"
              value={filters.to}
              onChange={(event) => setFilter('to', event.target.value)}
            />
          </FilterField>
          <Button variant="ghost" size="sm" onClick={reset} disabled={!activeCount}>
            Clear filters
          </Button>
        </FilterBar>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        loading={listQuery.isLoading}
        error={listQuery.error}
        onRetry={() => listQuery.refetch()}
        onRowClick={openSession}
        getRowId={(row) => row.id}
        emptyTitle="No sessions match"
        emptyDescription="Sessions are created automatically when a request is submitted."
        footer={
          <Pagination
            page={pagination.page ?? page}
            totalPages={pagination.totalPages ?? 0}
            total={pagination.total ?? 0}
            limit={limit}
            onChange={setPage}
          />
        }
      />

      <Modal
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={session ? `Session ${session.sessionNumber}` : 'Session details'}
        description={session ? `${STATUS_LABELS[session.status] ?? session.status} · ${formatDateTime(session.createdAt)}` : undefined}
        size="lg"
      >
        {detailQuery.isLoading ? (
          <p className="py-6 text-sm text-navy-500">Loading session…</p>
        ) : detailQuery.isError ? (
          <p className="py-6 text-sm text-red-600">{errorMessage(detailQuery.error)}</p>
        ) : session ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={session.status} />
              {session.receiptConfirmedAt ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Receipt confirmed
                </span>
              ) : null}
            </div>

            <DetailList
              columns={2}
              items={[
                { label: 'Guest', value: detail.customer?.name ?? customerName(session.customer) },
                { label: 'Helper', value: detail.helper?.name ?? (session.helper ? helperName(session.helper) : 'Unassigned') },
                { label: 'Service', value: categoryName(session.category) },
                { label: 'Request', value: detail.request?.requestNumber ?? '—' },
                { label: 'Started', value: session.startedAt ? formatDateTime(session.startedAt) : 'Not started' },
                { label: 'Ended', value: session.endedAt ? formatDateTime(session.endedAt) : '—' },
                { label: 'Duration', value: session.durationSeconds ? formatDuration(session.durationSeconds) : '—' },
                { label: 'Billable blocks', value: session.billableBlocks ?? '—' },
              ]}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-navy-100 px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                  <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                  Recording consent
                </p>
                <p className="mt-1 text-sm font-medium text-navy-800">
                  {recordingReady ? 'Customer and helper consented' : 'Incomplete or declined'}
                </p>
                <p className="mt-0.5 text-xs text-navy-500">
                  Customer {detail.recordingConsent?.customerAccepted ? 'accepted' : 'not accepted'} · Helper{' '}
                  {detail.recordingConsent?.helperAccepted ? 'accepted' : 'not accepted'}
                </p>
                {detail.recordingConsent?.policyVersion ? (
                  <p className="mt-1 text-[11px] text-navy-400">Policy {detail.recordingConsent.policyVersion}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-navy-100 px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                  <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
                  Billing
                </p>
                {detail.bill ? (
                  <>
                    <p className="mt-1 text-sm font-medium text-navy-800">
                      {detail.bill.billNumber} · {formatPkr(detail.bill.totalAmountPkr)}
                    </p>
                    <p className="mt-0.5 text-xs text-navy-500">
                      {detail.bill.status} · {detail.bill.paymentStatus}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-navy-500">
                    {session.status === 'COMPLETED' ? 'Bill not generated yet.' : 'Available after completion.'}
                  </p>
                )}
              </div>
            </div>

            {actionError ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {session.status === 'COMPLETED' && !detail.bill ? (
                <Button size="sm" onClick={generateBill} loading={generating}>
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Generate bill
                </Button>
              ) : null}
              {detail.bill ? (
                <LinkButton href={`/admin/billing?bill=${detail.bill.id}`} size="sm" variant="secondary">
                  <ReceiptText className="h-4 w-4" aria-hidden="true" />
                  Open bill
                </LinkButton>
              ) : null}
              <LinkButton href={`/admin/recordings?serviceSession=${session.id}`} size="sm" variant="secondary">
                <Mic className="h-4 w-4" aria-hidden="true" />
                Recordings
              </LinkButton>
              {detail.request?.id ? (
                <Link href={`/admin/requests?customer=${session.customer}`} className="inline-flex items-center gap-1.5 px-2 text-sm font-medium text-teal-700 underline-offset-4 hover:underline">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Guest requests
                </Link>
              ) : null}
              {['CREATED', 'ASSIGNED', 'IN_PROGRESS'].includes(session.status) ? (
                <Button size="sm" variant="dangerSoft" className="sm:ml-auto" onClick={() => setCancelOpen(true)}>
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Cancel session
                </Button>
              ) : null}
            </div>

            {session.status === 'IN_PROGRESS' ? (
              <Alert tone="warning" title="Live service">
                The helper controls start and end from their device. Admins can only cancel, which stops recording for
                the session.
              </Alert>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelSession}
        title="Cancel this session?"
        description="This cancels the linked request and releases the helper. A completed service cannot be cancelled."
        confirmLabel="Cancel session"
        cancelLabel="Keep session"
        tone="danger"
        loading={cancelling}
      >
        <Textarea
          rows={3}
          maxLength={1000}
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          placeholder="Reason (optional) — audited"
          aria-label="Cancellation reason"
        />
      </ConfirmDialog>
    </div>
  );
}
