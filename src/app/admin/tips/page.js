'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HandCoins, RefreshCw, Wallet } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { currentMonthKey, formatMonthKey, formatPkr, formatDateTime } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Button, Card, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatCard, StatusBadge } from '@/components/ui/data';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, useAdminFilters, useDirectory } from '@/components/admin/list-utils';

export default function AdminTipsPage() {
  const queryClient = useQueryClient();
  const monthKey = currentMonthKey();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    status: '',
    helper: '',
    customer: '',
    monthKey: '',
  });
  const { helpers, helperName, customerName } = useDirectory();

  const [selectedId, setSelectedId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [payoutReference, setPayoutReference] = useState('');
  const [working, setWorking] = useState('');
  const [actionError, setActionError] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin', 'tips', queryParams],
    queryFn: () => adminApi.tips.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'tip', selectedId],
    queryFn: () => adminApi.tips.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const monthReport = useQuery({
    queryKey: ['admin', 'report', 'financial', monthKey],
    queryFn: () => adminApi.financialReport({ monthKey }),
    staleTime: 60_000,
  });

  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.dashboard,
    staleTime: 60_000,
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };
  const tip = detailQuery.data;
  const monthTips = monthReport.data?.tips ?? {};
  const verifiedCount = (monthTips.byStatus ?? []).find((row) => row._id === 'VERIFIED')?.count ?? 0;
  const paidCount = (monthTips.byStatus ?? []).find((row) => row._id === 'PAID')?.count ?? 0;
  const pendingTips = dashboardQuery.data?.pending ?? { tipsCount: 0, tipsPkr: 0 };

  const refresh = () => {
    listQuery.refetch();
    if (selectedId) detailQuery.refetch();
    monthReport.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'tip-champion'] });
  };

  const runAction = async (action, call, title) => {
    setWorking(action);
    setActionError('');
    try {
      await call();
      toast.success(title);
      setRejectReason('');
      setPayoutReference('');
      refresh();
    } catch (error) {
      setActionError(errorMessage(error, 'Could not update this tip.'));
    } finally {
      setWorking('');
    }
  };

  const columns = [
    {
      key: 'tip',
      header: 'Tip',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.tipNumber}</p>
          <p className="text-xs text-navy-500">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    { key: 'helper', header: 'Helper', cell: (row) => helperName(row.helper) },
    { key: 'guest', header: 'Guest', cell: (row) => customerName(row.customer) },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => (
        <span className={row.isNoTip ? 'text-xs text-navy-400' : 'font-semibold text-navy-900'}>
          {row.isNoTip ? 'No tip' : formatPkr(row.amountPkr)}
        </span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      cell: (row) => (
        <span className="text-xs text-navy-500">
          {row.paymentMethod?.replace('_', ' ')}
          {row.transactionReference ? ` · ${row.transactionReference}` : ''}
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tips"
        description="Only tips linked to a confirmed payment can be verified. Verified tips alone count toward Tip Champion."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={listQuery.isFetching}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Verified this month"
          value={formatPkr(monthTips.verifiedPkr ?? 0)}
          hint={`${verifiedCount} verified tips`}
          icon={HandCoins}
          tone="teal"
        />
        <StatCard
          label="Paid out this month"
          value={formatPkr(monthTips.paidPkr ?? 0)}
          hint={`${paidCount} payouts`}
          icon={Wallet}
          tone="navy"
        />
        <StatCard
          label="Awaiting verification"
          value={formatPkr(pendingTips.tipsPkr ?? 0)}
          hint={`${pendingTips.tipsCount ?? 0} pending tips`}
          icon={HandCoins}
          tone="amber"
        />
      </div>

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Status" htmlFor="tip-status">
            <Select id="tip-status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {['PENDING', 'VERIFIED', 'REJECTED', 'PAID'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Helper" htmlFor="tip-helper">
            <Select id="tip-helper" value={filters.helper} onChange={(event) => setFilter('helper', event.target.value)}>
              <option value="">All helpers</option>
              {helpers.map((helper) => (
                <option key={helper.id} value={helper.id}>
                  {helper.name}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Month" htmlFor="tip-month">
            <input
              id="tip-month"
              type="month"
              className="input-base"
              value={filters.monthKey}
              onChange={(event) => setFilter('monthKey', event.target.value)}
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
        onRowClick={(row) => {
          setSelectedId(row.id);
          setActionError('');
        }}
        getRowId={(row) => row.id}
        emptyTitle="No tips match"
        emptyDescription="Tips appear after a guest links one to a confirmed payment."
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
        title={tip ? `Tip ${tip.tipNumber}` : 'Tip details'}
        description={tip ? `${tip.isNoTip ? 'No tip' : formatPkr(tip.amountPkr)} · ${tip.status}` : undefined}
        size="md"
      >
        {detailQuery.isLoading ? (
          <p className="py-6 text-sm text-navy-500">Loading tip…</p>
        ) : detailQuery.isError ? (
          <p className="py-6 text-sm text-red-600">{errorMessage(detailQuery.error)}</p>
        ) : tip ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={tip.status} />
              {tip.isNoTip ? (
                <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600">
                  Guest declined a tip
                </span>
              ) : null}
            </div>

            <DetailList
              columns={2}
              items={[
                { label: 'Helper', value: helperName(tip.helper) },
                { label: 'Guest', value: customerName(tip.customer) },
                { label: 'Amount', value: tip.isNoTip ? 'No tip' : formatPkr(tip.amountPkr) },
                { label: 'Method', value: tip.paymentMethod?.replace('_', ' ') ?? '—' },
                { label: 'Transaction ref', value: tip.transactionReference || '—' },
                { label: 'Created', value: formatDateTime(tip.createdAt) },
                { label: 'Verified', value: tip.verifiedAt ? formatDateTime(tip.verifiedAt) : '—' },
                { label: 'Paid', value: tip.paidAt ? formatDateTime(tip.paidAt) : '—' },
              ]}
            />

            {tip.note ? (
              <div className="rounded-xl bg-navy-50 px-3.5 py-3 text-sm text-navy-700">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Guest note</p>
                <p className="mt-1 whitespace-pre-line">{tip.note}</p>
              </div>
            ) : null}
            {tip.rejectedReason ? (
              <Alert tone="warning" title="Rejected">
                {tip.rejectedReason}
              </Alert>
            ) : null}
            {tip.payoutReference ? (
              <Alert tone="success" title="Payout recorded">
                {tip.payoutReference}
              </Alert>
            ) : null}

            {actionError ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}

            {tip.status === 'PENDING' && !tip.isNoTip ? (
              <div className="space-y-3 rounded-xl border border-navy-100 p-3.5">
                <p className="text-sm font-semibold text-navy-900">Verify this tip</p>
                <p className="text-xs leading-relaxed text-navy-500">
                  Confirm the linked payment belongs to this session and is verified before accepting the tip.
                </p>
                <Button
                  size="sm"
                  loading={working === 'verify'}
                  onClick={() => runAction('verify', () => adminApi.tips.verify(tip.id), 'Tip verified')}
                >
                  Verify tip
                </Button>
                <div className="border-t border-navy-100 pt-3">
                  <Field label="Rejection reason" htmlFor="tip-reject" hint="Kept for the audit trail.">
                    <Textarea
                      id="tip-reject"
                      rows={2}
                      maxLength={1000}
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                    />
                  </Field>
                  <Button
                    size="sm"
                    variant="dangerSoft"
                    className="mt-2"
                    disabled={rejectReason.trim().length < 3}
                    loading={working === 'reject'}
                    onClick={() =>
                      runAction('reject', () => adminApi.tips.reject(tip.id, rejectReason.trim()), 'Tip rejected')
                    }
                  >
                    Reject tip
                  </Button>
                </div>
              </div>
            ) : null}

            {tip.status === 'VERIFIED' ? (
              <div className="space-y-2 rounded-xl border border-navy-100 p-3.5">
                <p className="text-sm font-semibold text-navy-900">Mark as paid</p>
                <p className="text-xs text-navy-500">Record the payout reference from finance.</p>
                <Field label="Payout reference" htmlFor="tip-payout">
                  <Input
                    id="tip-payout"
                    value={payoutReference}
                    onChange={(event) => setPayoutReference(event.target.value)}
                    maxLength={120}
                    placeholder="Cash voucher / transfer ref"
                  />
                </Field>
                <Button
                  size="sm"
                  variant="success"
                  disabled={payoutReference.trim().length < 3}
                  loading={working === 'pay'}
                  onClick={() =>
                    runAction('pay', () => adminApi.tips.pay(tip.id, payoutReference.trim()), 'Tip marked paid')
                  }
                >
                  Mark paid
                </Button>
              </div>
            ) : null}

            <a href={`/admin/sessions?session=${tip.serviceSession}`} className="link-subtle inline-flex text-sm">
              Open the service session
            </a>
          </div>
        ) : null}
      </Modal>

      <p className="text-xs text-navy-500">
        {formatMonthKey(monthKey)} tip totals come from the financial report and include verified and paid tips only.
      </p>
    </div>
  );
}
