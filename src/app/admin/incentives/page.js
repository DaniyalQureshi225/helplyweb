'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgePlus, Calculator, HandCoins, RefreshCw, Wallet } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { INCENTIVE_TYPES } from '@/lib/constants';
import { currentMonthKey, formatDateTime, formatMonthKey, formatPkr } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Button, Card, PageHeader, StatCard } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatusBadge, Tabs } from '@/components/ui/data';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, useAdminFilters, useDirectory } from '@/components/admin/list-utils';

const typeLabel = (value) => INCENTIVE_TYPES.find((item) => item.value === value)?.label ?? value ?? '—';

export default function AdminIncentivesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('incentives');
  const incentiveFilters = useAdminFilters({
    helper: '',
    type: '',
    status: '',
    monthKey: currentMonthKey(),
  });
  const earningFilters = useAdminFilters({ helper: '', monthKey: currentMonthKey() });
  const { helpers, helperName, helperOptions } = useDirectory();

  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ helperId: '', amountPkr: '', periodKey: '', note: '' });
  const [runOpen, setRunOpen] = useState(false);
  const [runMonth, setRunMonth] = useState(currentMonthKey());
  const [payEarningsOpen, setPayEarningsOpen] = useState(false);
  const [payForm, setPayForm] = useState({ helperId: '', monthKey: currentMonthKey(), payoutReference: '' });
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [payId, setPayId] = useState(null);
  const [payReference, setPayReference] = useState('');
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');

  const incentivesQuery = useQuery({
    queryKey: ['admin', 'incentives', incentiveFilters.queryParams],
    queryFn: () => adminApi.incentives.list(incentiveFilters.queryParams),
    placeholderData: (previous) => previous,
    enabled: tab === 'incentives',
  });

  const earningsQuery = useQuery({
    queryKey: ['admin', 'incentives', 'earnings', earningFilters.queryParams],
    queryFn: () => adminApi.incentives.earnings(earningFilters.queryParams),
    placeholderData: (previous) => previous,
    enabled: tab === 'earnings',
  });

  const summaryQuery = useQuery({
    queryKey: ['admin', 'incentives', 'earnings-summary', payForm.helperId, payForm.monthKey],
    queryFn: () => adminApi.incentives.earningsSummary(payForm.helperId, payForm.monthKey),
    enabled: payEarningsOpen && Boolean(payForm.helperId),
  });

  const incentives = incentivesQuery.data?.items ?? [];
  const incentivePagination = incentivesQuery.data?.pagination ?? { page: 1, totalPages: 0, total: 0 };
  const earnings = earningsQuery.data?.items ?? [];
  const earningsPagination = earningsQuery.data?.pagination ?? { page: 1, totalPages: 0, total: 0 };

  const refresh = () => {
    incentivesQuery.refetch();
    earningsQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'attendance'] });
  };

  const run = async (key, call, title) => {
    setWorking(key);
    setError('');
    try {
      const result = await call();
      toast.success(title);
      refresh();
      return result;
    } catch (err) {
      setError(errorMessage(err, 'Could not complete this action.'));
      return null;
    } finally {
      setWorking('');
    }
  };

  const submitManual = async (event) => {
    event.preventDefault();
    const amount = Number.parseInt(manualForm.amountPkr, 10);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Enter a positive whole PKR amount.');
      return;
    }
    const result = await run(
      'manual',
      () =>
        adminApi.incentives.createManual({
          helperId: manualForm.helperId,
          amountPkr: amount,
          periodKey: manualForm.periodKey.trim() || undefined,
          note: manualForm.note.trim(),
        }),
      'Manual incentive created',
    );
    if (result) {
      setManualOpen(false);
      setManualForm({ helperId: '', amountPkr: '', periodKey: '', note: '' });
    }
  };

  const submitRun = async () => {
    const result = await run('run', () => adminApi.incentives.runMonthly(runMonth), 'Monthly calculation complete');
    if (result) {
      toast.info(
        'Calculation complete',
        `${result.attendance ?? 0} attendance, ${result.consistency ?? 0} consistency, ${result.fiveStar ?? 0} five-star rewards created.`,
      );
      setRunOpen(false);
    }
  };

  const submitPayEarnings = async (event) => {
    event.preventDefault();
    const result = await run(
      'pay-earnings',
      () =>
        adminApi.incentives.payEarnings({
          helperId: payForm.helperId,
          monthKey: payForm.monthKey,
          payoutReference: payForm.payoutReference.trim(),
        }),
      'Earnings marked paid',
    );
    if (result) {
      toast.info('Updated', `${result.modifiedCount ?? 0} earning records marked paid.`);
      setPayEarningsOpen(false);
    }
  };

  const incentiveColumns = [
    {
      key: 'helper',
      header: 'Helper',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{helperName(row.helper)}</p>
          <p className="text-xs text-navy-500">{typeLabel(row.type)}</p>
        </div>
      ),
    },
    { key: 'period', header: 'Period', cell: (row) => row.periodKey ?? '—' },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => <span className="font-semibold text-navy-900">{formatPkr(row.amountPkr)}</span>,
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'created',
      header: 'Created',
      cell: (row) => <span className="text-xs text-navy-500">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          {row.status === 'PENDING' ? (
            <>
              <Button size="xs" variant="ghost" loading={working === `approve-${row.id}`} onClick={() => run(`approve-${row.id}`, () => adminApi.incentives.approve(row.id), 'Incentive approved')}>
                Approve
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setRejectId(row.id)}>
                Reject
              </Button>
            </>
          ) : null}
          {row.status === 'APPROVED' ? (
            <Button size="xs" variant="secondary" onClick={() => setPayId(row.id)}>
              Mark paid
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const earningColumns = [
    { key: 'helper', header: 'Helper', cell: (row) => helperName(row.helper) },
    { key: 'date', header: 'Date', cell: (row) => row.dateKey ?? formatDateTime(row.createdAt) },
    { key: 'month', header: 'Month', cell: (row) => formatMonthKey(row.monthKey) },
    {
      key: 'rate',
      header: 'Rate',
      align: 'right',
      cell: (row) => (
        <div>
          <p className="text-sm text-navy-800">{formatPkr(row.hourlyRatePkr)}/hr</p>
          {row.reducedRateApplied ? <p className="text-[11px] text-amber-700">Reduced rate applied</p> : null}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => <span className="font-semibold text-navy-900">{formatPkr(row.amountPkr)}</span>,
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ];

  const pendingCount = (incentivesQuery.data?.items ?? []).filter((row) => row.status === 'PENDING').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Incentives & earnings"
        description="Company-funded incentives are created by backend rules, then approved and paid here. Helper earnings accrue only from server-calculated service time."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRunOpen(true)}>
              <Calculator className="h-4 w-4" aria-hidden="true" />
              Run monthly calculation
            </Button>
            <Button size="sm" onClick={() => setManualOpen(true)}>
              <BadgePlus className="h-4 w-4" aria-hidden="true" />
              Manual incentive
            </Button>
          </div>
        }
      />

      <Alert tone="info">
        Rule amounts are read from system settings and computed by the backend. This console records approval and payout
        references; it never changes an amount or a helper&apos;s salary.
      </Alert>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="On this page" value={incentivePagination.total ?? 0} hint="Incentive records" icon={HandCoins} tone="navy" />
        <StatCard label="Pending here" value={pendingCount} hint="Awaiting approval" icon={HandCoins} tone="amber" />
        <StatCard
          label="Earnings records"
          value={earningsPagination.total ?? 0}
          hint="Server-calculated helper earnings"
          icon={Wallet}
          tone="teal"
        />
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Tabs
        tabs={[
          { value: 'incentives', label: 'Incentives' },
          { value: 'earnings', label: 'Helper earnings' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'incentives' ? (
        <>
          <Card className="p-4">
            <FilterBar>
              <FilterField label="Helper" htmlFor="incentive-helper">
                <Select id="incentive-helper" value={incentiveFilters.filters.helper} onChange={(event) => incentiveFilters.setFilter('helper', event.target.value)}>
                  <option value="">All helpers</option>
                  {helpers.map((helper) => (
                    <option key={helper.id} value={helper.id}>
                      {helper.name}
                    </option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Type" htmlFor="incentive-type">
                <Select id="incentive-type" value={incentiveFilters.filters.type} onChange={(event) => incentiveFilters.setFilter('type', event.target.value)}>
                  <option value="">All types</option>
                  {INCENTIVE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Status" htmlFor="incentive-status">
                <Select id="incentive-status" value={incentiveFilters.filters.status} onChange={(event) => incentiveFilters.setFilter('status', event.target.value)}>
                  <option value="">All statuses</option>
                  {['PENDING', 'APPROVED', 'PAID', 'REJECTED', 'VOID', 'CANCELLED'].map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll('_', ' ')}
                    </option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Month" htmlFor="incentive-month">
                <input
                  id="incentive-month"
                  type="month"
                  className="input-base"
                  value={incentiveFilters.filters.monthKey}
                  onChange={(event) => incentiveFilters.setFilter('monthKey', event.target.value)}
                />
              </FilterField>
              <Button variant="ghost" size="sm" onClick={incentiveFilters.reset} disabled={!incentiveFilters.activeCount}>
                Clear filters
              </Button>
            </FilterBar>
          </Card>

          <DataTable
            columns={incentiveColumns}
            rows={incentives}
            loading={incentivesQuery.isLoading}
            error={incentivesQuery.error}
            onRetry={() => incentivesQuery.refetch()}
            getRowId={(row) => row.id}
            emptyTitle="No incentives match"
            emptyDescription="Automated rewards appear here when backend rules qualify a helper."
            footer={
              <Pagination
                page={incentivePagination.page}
                totalPages={incentivePagination.totalPages}
                total={incentivePagination.total}
                limit={incentiveFilters.limit}
                onChange={incentiveFilters.setPage}
              />
            }
          />
        </>
      ) : (
        <>
          <Card className="p-4">
            <FilterBar>
              <FilterField label="Helper" htmlFor="earning-helper">
                <Select id="earning-helper" value={earningFilters.filters.helper} onChange={(event) => earningFilters.setFilter('helper', event.target.value)}>
                  <option value="">All helpers</option>
                  {helpers.map((helper) => (
                    <option key={helper.id} value={helper.id}>
                      {helper.name}
                    </option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Month" htmlFor="earning-month">
                <input
                  id="earning-month"
                  type="month"
                  className="input-base"
                  value={earningFilters.filters.monthKey}
                  onChange={(event) => earningFilters.setFilter('monthKey', event.target.value)}
                />
              </FilterField>
              <Button variant="ghost" size="sm" onClick={earningFilters.reset} disabled={!earningFilters.activeCount}>
                Clear filters
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setPayForm({ helperId: earningFilters.filters.helper || '', monthKey: earningFilters.filters.monthKey || currentMonthKey(), payoutReference: '' });
                  setPayEarningsOpen(true);
                }}
              >
                <Wallet className="h-4 w-4" aria-hidden="true" />
                Mark earnings paid
              </Button>
            </FilterBar>
          </Card>

          <DataTable
            columns={earningColumns}
            rows={earnings}
            loading={earningsQuery.isLoading}
            error={earningsQuery.error}
            onRetry={() => earningsQuery.refetch()}
            getRowId={(row) => row.id}
            emptyTitle="No earnings records"
            emptyDescription="Earnings accrue when completed sessions are finalized."
            footer={
              <Pagination
                page={earningsPagination.page}
                totalPages={earningsPagination.totalPages}
                total={earningsPagination.total}
                limit={earningFilters.limit}
                onChange={earningFilters.setPage}
              />
            }
          />
        </>
      )}

      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Create a manual incentive"
        description="Use for approved one-off awards. The amount is recorded in whole PKR and audited."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setManualOpen(false)} disabled={working === 'manual'}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitManual} loading={working === 'manual'} disabled={!manualForm.helperId || !manualForm.note.trim()}>
              Create incentive
            </Button>
          </div>
        }
      >
        <form onSubmit={submitManual} className="space-y-4">
          <Field label="Helper" htmlFor="manual-helper" required>
            <Select
              id="manual-helper"
              value={manualForm.helperId}
              onChange={(event) => setManualForm((previous) => ({ ...previous, helperId: event.target.value }))}
              required
            >
              <option value="">Choose a helper</option>
              {helperOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Amount (PKR)" htmlFor="manual-amount" required>
              <Input
                id="manual-amount"
                inputMode="numeric"
                value={manualForm.amountPkr}
                onChange={(event) => setManualForm((previous) => ({ ...previous, amountPkr: event.target.value.replace(/[^\d]/g, '') }))}
                required
                placeholder="500"
              />
            </Field>
            <Field label="Period key" htmlFor="manual-period" hint="Optional, e.g. 2026-11 or MANUAL-01.">
              <Input
                id="manual-period"
                value={manualForm.periodKey}
                onChange={(event) => setManualForm((previous) => ({ ...previous, periodKey: event.target.value }))}
                maxLength={60}
              />
            </Field>
          </div>
          <Field label="Reason" htmlFor="manual-note" required hint="At least 3 characters. Stored with the incentive.">
            <Textarea
              id="manual-note"
              rows={3}
              maxLength={2000}
              value={manualForm.note}
              onChange={(event) => setManualForm((previous) => ({ ...previous, note: event.target.value }))}
              required
              minLength={3}
              placeholder="Why this award is being given"
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={runOpen}
        onClose={() => setRunOpen(false)}
        title="Run monthly incentive calculation"
        description="Idempotent: already-created incentives are not duplicated."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRunOpen(false)} disabled={working === 'run'}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitRun} loading={working === 'run'}>
              Run calculation
            </Button>
          </div>
        }
      >
        <Field label="Month" htmlFor="run-month" required>
          <input id="run-month" type="month" className="input-base" value={runMonth} onChange={(event) => setRunMonth(event.target.value)} />
        </Field>
      </Modal>

      <Modal
        open={Boolean(rejectId)}
        onClose={() => setRejectId(null)}
        title="Reject incentive"
        description="Only a pending incentive can be rejected. The reason is kept in the audit trail."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRejectId(null)} disabled={working === 'reject'}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="dangerSoft"
              loading={working === 'reject'}
              disabled={rejectReason.trim().length < 3}
              onClick={async () => {
                const result = await run('reject', () => adminApi.incentives.reject(rejectId, rejectReason.trim()), 'Incentive rejected');
                if (result) {
                  setRejectId(null);
                  setRejectReason('');
                }
              }}
            >
              Reject
            </Button>
          </div>
        }
      >
        <Field label="Reason" htmlFor="reject-incentive" required>
          <Textarea id="reject-incentive" rows={3} maxLength={2000} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} required minLength={3} />
        </Field>
      </Modal>

      <Modal
        open={Boolean(payId)}
        onClose={() => setPayId(null)}
        title="Mark incentive paid"
        description="Record the finance payout reference. Only approved incentives can be paid."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPayId(null)} disabled={working === 'pay'}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="success"
              loading={working === 'pay'}
              disabled={payReference.trim().length < 3}
              onClick={async () => {
                const result = await run('pay', () => adminApi.incentives.pay(payId, payReference.trim()), 'Incentive paid');
                if (result) {
                  setPayId(null);
                  setPayReference('');
                }
              }}
            >
              Confirm payout
            </Button>
          </div>
        }
      >
        <Field label="Payout reference" htmlFor="incentive-pay-ref" required>
          <Input id="incentive-pay-ref" value={payReference} onChange={(event) => setPayReference(event.target.value)} maxLength={120} placeholder="Cash voucher / transfer reference" />
        </Field>
      </Modal>

      <Modal
        open={payEarningsOpen}
        onClose={() => setPayEarningsOpen(false)}
        title="Mark helper earnings paid"
        description="Marks all accrued or approved earnings for the chosen helper and month as paid."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPayEarningsOpen(false)} disabled={working === 'pay-earnings'}>
              Cancel
            </Button>
            <Button type="submit" form="earnings-pay-form" size="sm" variant="success" loading={working === 'pay-earnings'} disabled={!payForm.helperId || payForm.payoutReference.trim().length < 3}>
              Confirm payout
            </Button>
          </div>
        }
      >
        <form id="earnings-pay-form" onSubmit={submitPayEarnings} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Helper" htmlFor="pay-earnings-helper" required>
              <Select
                id="pay-earnings-helper"
                value={payForm.helperId}
                onChange={(event) => setPayForm((previous) => ({ ...previous, helperId: event.target.value }))}
                required
              >
                <option value="">Choose a helper</option>
                {helperOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Month" htmlFor="pay-earnings-month" required>
              <input id="pay-earnings-month" type="month" className="input-base" value={payForm.monthKey} onChange={(event) => setPayForm((previous) => ({ ...previous, monthKey: event.target.value }))} />
            </Field>
          </div>
          <Field label="Payout reference" htmlFor="pay-earnings-ref" required minLength={3}>
            <Input
              id="pay-earnings-ref"
              value={payForm.payoutReference}
              onChange={(event) => setPayForm((previous) => ({ ...previous, payoutReference: event.target.value }))}
              maxLength={120}
              required
              minLength={3}
              placeholder="Cash voucher / transfer reference"
            />
          </Field>
          {payForm.helperId && summaryQuery.data ? (
            <div className="rounded-xl bg-navy-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">This month&apos;s earnings</p>
              <DetailList
                className="mt-2"
                columns={2}
                items={[
                  { label: 'Services', value: summaryQuery.data.services ?? 0 },
                  { label: 'Accrued', value: formatPkr(summaryQuery.data.byStatusPkr?.ACCRUED ?? 0) },
                  { label: 'Approved', value: formatPkr(summaryQuery.data.byStatusPkr?.APPROVED ?? 0) },
                  { label: 'Paid', value: formatPkr(summaryQuery.data.byStatusPkr?.PAID ?? 0) },
                ]}
              />
            </div>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}
