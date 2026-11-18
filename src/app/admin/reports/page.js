'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CheckCircle2, Download, FileWarning, RefreshCw, ShieldCheck } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { currentMonthKey, downloadCsv, formatDateTime, formatMonthKey, formatNumber, formatPkr } from '@/lib/utils';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, LinkButton, PageHeader, StatCard } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, Tabs } from '@/components/ui/data';
import { Field, Input, Select } from '@/components/ui/form';
import { FilterBar, FilterField, shortId, useAdminFilters } from '@/components/admin/list-utils';

const SESSION_COLORS = ['#0F2A46', '#147D6F', '#E0A228', '#4B6E97', '#9AA9B8', '#C4483D'];

function toOutstanding(value) {
  if (Array.isArray(value)) return value[0] ?? {};
  return value ?? {};
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState('financial');
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const performanceFilters = useAdminFilters({});
  const auditFilters = useAdminFilters({ action: '', actorType: '', entityType: '', from: '', to: '' });

  const financialQuery = useQuery({
    queryKey: ['admin', 'report', 'financial', monthKey],
    queryFn: () => adminApi.financialReport({ monthKey }),
    enabled: tab === 'financial',
    staleTime: 60_000,
  });
  const operationalQuery = useQuery({
    queryKey: ['admin', 'report', 'operational', monthKey],
    queryFn: () => adminApi.operationalReport({ monthKey }),
    enabled: tab === 'operational',
    staleTime: 60_000,
  });
  const reconciliationQuery = useQuery({
    queryKey: ['admin', 'report', 'reconciliation', monthKey],
    queryFn: () => adminApi.reconciliation({ monthKey }),
    enabled: tab === 'reconciliation',
    staleTime: 60_000,
  });
  const performanceQuery = useQuery({
    queryKey: ['admin', 'report', 'helpers', performanceFilters.queryParams],
    queryFn: () => adminApi.helperPerformance(performanceFilters.queryParams),
    placeholderData: (previous) => previous,
    enabled: tab === 'helpers',
  });
  const auditQuery = useQuery({
    queryKey: ['admin', 'audit-logs', auditFilters.queryParams],
    queryFn: () => adminApi.auditLogs(auditFilters.queryParams),
    placeholderData: (previous) => previous,
    enabled: tab === 'audit',
  });

  const queries = { financial: financialQuery, operational: operationalQuery, reconciliation: reconciliationQuery, helpers: performanceQuery, audit: auditQuery };
  const activeQuery = queries[tab];
  const refresh = () => activeQuery.refetch();

  const financial = financialQuery.data;
  const operational = operationalQuery.data;
  const reconciliation = reconciliationQuery.data;
  const outstanding = toOutstanding(financial?.outstanding);

  const sessionChartData = operational
    ? Object.entries(operational.sessions?.byStatus ?? {}).map(([name, value]) => ({ name: name.replaceAll('_', ' '), value }))
    : [];
  const ratingChartData = operational
    ? [1, 2, 3, 4, 5].map((rating) => ({ name: `${rating}★`, reviews: operational.ratings?.[rating] ?? 0 }))
    : [];
  const paymentChartData = financial?.payments?.map((row) => ({ name: row.method?.replaceAll('_', ' '), amount: row.totalPkr })) ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description="Read-only financial, operational, reconciliation and audit views. Money values are always whole PKR from the backend."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="report-month" className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                Month
              </label>
              <input id="report-month" type="month" className="input-base" value={monthKey} onChange={(event) => setMonthKey(event.target.value)} />
            </div>
            <Button variant="secondary" size="sm" onClick={refresh} loading={activeQuery.isFetching}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </Button>
          </div>
        }
      />

      <Tabs
        tabs={[
          { value: 'financial', label: 'Financial' },
          { value: 'operational', label: 'Operational' },
          { value: 'reconciliation', label: 'Reconciliation' },
          { value: 'helpers', label: 'Helper performance' },
          { value: 'audit', label: 'Audit log' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {activeQuery.isError ? <Alert tone="danger">{errorMessage(activeQuery.error, 'Could not load this report.')}</Alert> : null}

      {tab === 'financial' ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Billed" value={formatPkr(financial?.bills?.billedPkr ?? 0)} hint={`${financial?.bills?.bills ?? 0} bills`} />
            <StatCard label="Collected" value={formatPkr(financial?.bills?.collectedPkr ?? 0)} hint="Confirmed payments on bills" tone="teal" />
            <StatCard label="Outstanding" value={formatPkr(outstanding.outstandingPkr ?? 0)} hint={`${outstanding.count ?? 0} unpaid or partial bills`} tone="amber" />
            <StatCard label="Company margin" value={formatPkr(financial?.companyMarginPkr ?? 0)} hint="Excludes pass-through tips" tone="navy" />
          </div>

          {financialQuery.isLoading ? (
            <Card className="p-8 text-center text-sm text-navy-500">Loading financial report…</Card>
          ) : financial ? (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Confirmed payments by method" description={formatMonthKey(financial.monthKey)} />
                  <div className="h-72 px-3 py-4">
                    {paymentChartData.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={paymentChartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E7ECF2" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(value) => `${value}`} />
                          <Tooltip formatter={(value) => formatPkr(value)} />
                          <Bar dataKey="amount" name="Amount" fill="#147D6F" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState title="No confirmed payments" description="Payments appear once staff confirm them." />
                    )}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Costs and tips" description="Tips are pass-through and excluded from margin." />
                  <div className="px-5 py-4">
                    <DetailList
                      columns={2}
                      items={[
                        { label: 'Verified / paid tips', value: formatPkr(financial.tips?.verifiedPkr ?? 0) },
                        { label: 'Paid tips', value: formatPkr(financial.tips?.paidPkr ?? 0) },
                        { label: 'Helper earnings', value: formatPkr(financial.helperEarnings?.totalPkr ?? 0) },
                        { label: 'Company incentives', value: formatPkr(financial.companyIncentives?.totalPkr ?? 0) },
                      ]}
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <LinkButton variant="secondary" size="xs" href={`/admin/billing`}>Open billing</LinkButton>
                      <LinkButton variant="secondary" size="xs" href={`/admin/payments`}>Open payments</LinkButton>
                      <LinkButton variant="secondary" size="xs" href={`/admin/tips?monthKey=${monthKey}`}>Open tips</LinkButton>
                    </div>
                  </div>
                </Card>
              </div>

              <Card>
                <CardHeader
                  title="Payment methods"
                  action={
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() =>
                        downloadCsv(`helply-payments-${monthKey}.csv`, (financial.payments ?? []).map((row) => ({
                          method: row.method,
                          count: row.count,
                          amountPkr: row.totalPkr,
                        })))
                      }
                      disabled={!financial.payments?.length}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      CSV
                    </Button>
                  }
                />
                <DataTable
                  columns={[
                    { key: 'method', header: 'Method', cell: (row) => row.method?.replaceAll('_', ' ') },
                    { key: 'count', header: 'Count', align: 'right', cell: (row) => formatNumber(row.count) },
                    { key: 'total', header: 'Total', align: 'right', cell: (row) => formatPkr(row.totalPkr) },
                  ]}
                  rows={financial.payments ?? []}
                  getRowId={(row) => row.method}
                  emptyTitle="No payments this month"
                />
              </Card>
            </>
          ) : null}
        </div>
      ) : null}

      {tab === 'operational' ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Sessions" value={formatNumber(operational?.sessions?.total ?? 0)} hint={formatMonthKey(monthKey)} />
            <StatCard label="Completion rate" value={`${operational?.sessions?.completionRate ?? 0}%`} hint="Completed vs completed + cancelled" tone="teal" />
            <StatCard label="Avg. service" value={`${operational?.duration?.averageMinutes ?? 0} min`} hint={`${operational?.duration?.completedSessions ?? 0} completed`} />
            <StatCard label="Billable blocks" value={formatNumber(operational?.duration?.billableBlocks ?? 0)} hint="70-minute blocks" tone="navy" />
          </div>

          {operationalQuery.isLoading ? (
            <Card className="p-8 text-center text-sm text-navy-500">Loading operational report…</Card>
          ) : operational ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader title="Sessions by status" />
                <div className="h-72 px-3 py-4">
                  {sessionChartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sessionChartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                          {sessionChartData.map((entry, index) => (
                            <Cell key={entry.name} fill={SESSION_COLORS[index % SESSION_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState title="No sessions this month" />
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader title="Verified ratings" />
                <div className="h-72 px-3 py-4">
                  {ratingChartData.some((row) => row.reviews > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingChartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E7ECF2" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                        <Tooltip />
                        <Bar dataKey="reviews" name="Reviews" fill="#0F2A46" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState title="No verified reviews" />
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader title="Top helpers" description="By completed services in the selected month." />
                <DataTable
                  columns={[
                    { key: 'name', header: 'Helper', cell: (row) => row.name ?? `Helper ${shortId(row.helperId)}` },
                    { key: 'services', header: 'Services', align: 'right', cell: (row) => formatNumber(row.services) },
                  ]}
                  rows={operational.topHelpers ?? []}
                  getRowId={(row) => row.helperId}
                  emptyTitle="No completed services yet"
                />
              </Card>

              <Card>
                <CardHeader title="Signals" />
                <div className="px-5 py-4">
                  <DetailList
                    columns={2}
                    items={[
                      { label: 'Total service hours', value: `${operational.duration?.totalHours ?? 0} h` },
                      { label: 'Attendance records', value: formatNumber(Object.values(operational.attendance ?? {}).reduce((sum, value) => sum + value, 0)) },
                      { label: 'Complaint rows', value: formatNumber((operational.complaints ?? []).reduce((sum, row) => sum + row.count, 0)) },
                      { label: 'Present days', value: formatNumber(operational.attendance?.PRESENT ?? 0) },
                    ]}
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <LinkButton variant="secondary" size="xs" href="/admin/attendance">Attendance</LinkButton>
                    <LinkButton variant="secondary" size="xs" href="/admin/complaints">Complaints</LinkButton>
                    <LinkButton variant="secondary" size="xs" href="/admin/tip-champion">Tip Champion</LinkButton>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'reconciliation' ? (
        <div className="space-y-4">
          {reconciliationQuery.isLoading ? (
            <Card className="p-8 text-center text-sm text-navy-500">Reconciling records…</Card>
          ) : reconciliation ? (
            <>
              <Alert tone={reconciliation.clean ? 'success' : 'warning'} title={reconciliation.clean ? 'No inconsistencies detected' : 'Issues need review'}>
                Checked {formatNumber(reconciliation.checked?.bills ?? 0)} bills, {formatNumber(reconciliation.checked?.tips ?? 0)} tips,{' '}
                {formatNumber(reconciliation.checked?.earnings ?? 0)} earnings and {formatNumber(reconciliation.checked?.incentives ?? 0)} incentives for{' '}
                {formatMonthKey(reconciliation.monthKey)}. This report is read-only; it never changes records.
              </Alert>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Bill mismatches" value={reconciliation.issues?.billMismatches?.length ?? 0} tone={(reconciliation.issues?.billMismatches?.length ?? 0) ? 'amber' : 'teal'} icon={FileWarning} />
                <StatCard label="Tip ledger issues" value={reconciliation.issues?.tipLedgerMismatches?.length ?? 0} tone={(reconciliation.issues?.tipLedgerMismatches?.length ?? 0) ? 'amber' : 'teal'} icon={FileWarning} />
                <StatCard label="Earnings without bill" value={reconciliation.issues?.earningsWithoutBill ?? 0} tone={(reconciliation.issues?.earningsWithoutBill ?? 0) ? 'amber' : 'teal'} />
                <StatCard label="Paid incentives missing ref" value={reconciliation.issues?.paidIncentivesMissingPayout ?? 0} tone={(reconciliation.issues?.paidIncentivesMissingPayout ?? 0) ? 'amber' : 'teal'} />
              </div>

              {reconciliation.issues?.billMismatches?.length ? (
                <Card>
                  <CardHeader title="Bill mismatches" description="Recorded paid amount or status differs from confirmed payments." />
                  <DataTable
                    columns={[
                      { key: 'bill', header: 'Bill', cell: (row) => row.billNumber ?? shortId(row.billId) },
                      { key: 'total', header: 'Total', align: 'right', cell: (row) => formatPkr(row.totalAmountPkr) },
                      { key: 'recorded', header: 'Recorded paid', align: 'right', cell: (row) => formatPkr(row.recordedPaidPkr) },
                      { key: 'confirmed', header: 'Confirmed', align: 'right', cell: (row) => formatPkr(row.confirmedPaymentsPkr) },
                      { key: 'status', header: 'Status', cell: (row) => `${row.recordedStatus} → ${row.expectedStatus}` },
                    ]}
                    rows={reconciliation.issues.billMismatches}
                    getRowId={(row) => row.billId}
                    emptyTitle="No bill mismatches"
                  />
                </Card>
              ) : null}

              {reconciliation.issues?.tipLedgerMismatches?.length ? (
                <Card>
                  <CardHeader title="Tip ledger issues" description="Verified tips without a complete double-entry ledger." />
                  <DataTable
                    columns={[
                      { key: 'tip', header: 'Tip', cell: (row) => row.tipNumber ?? shortId(row.tipId) },
                      { key: 'amount', header: 'Amount', align: 'right', cell: (row) => formatPkr(row.amountPkr) },
                      { key: 'charge', header: 'Customer charge entries', align: 'right', cell: (row) => row.charge },
                      { key: 'payable', header: 'Helper payable entries', align: 'right', cell: (row) => row.payable },
                    ]}
                    rows={reconciliation.issues.tipLedgerMismatches}
                    getRowId={(row) => row.tipId}
                  />
                </Card>
              ) : null}

              {reconciliation.clean ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-teal-600" aria-hidden="true" />
                  <p className="mt-3 text-base font-semibold text-navy-900">Everything reconciles</p>
                  <p className="mt-1 text-sm text-navy-500">No discrepancies were found for the selected month.</p>
                </Card>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {tab === 'helpers' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Helper performance"
              description="Derived from server-calculated earnings. This view cannot alter payouts."
              action={
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() =>
                    downloadCsv(`helply-helper-performance.csv`, (performanceQuery.data?.items ?? []).map((row) => ({
                      helper: row.name ?? '',
                      employeeCode: row.employeeCode ?? '',
                      services: row.services,
                      earningsPkr: row.earningsPkr,
                    })))
                  }
                  disabled={!performanceQuery.data?.items?.length}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  CSV
                </Button>
              }
            />
            <DataTable
              columns={[
                { key: 'helper', header: 'Helper', cell: (row) => <div><p className="font-semibold text-navy-900">{row.name ?? `Helper ${shortId(row.helperId)}`}</p><p className="text-xs text-navy-500">{row.employeeCode ?? ''}</p></div> },
                { key: 'services', header: 'Services', align: 'right', cell: (row) => formatNumber(row.services) },
                { key: 'earnings', header: 'Earnings', align: 'right', cell: (row) => formatPkr(row.earningsPkr) },
                { key: 'last', header: 'Last service', cell: (row) => <span className="text-xs text-navy-500">{formatDateTime(row.lastServiceAt)}</span> },
              ]}
              rows={performanceQuery.data?.items ?? []}
              loading={performanceQuery.isLoading}
              error={performanceQuery.error}
              onRetry={() => performanceQuery.refetch()}
              getRowId={(row) => row.helperId}
              emptyTitle="No helper performance data"
              footer={
                <Pagination
                  page={performanceFilters.page}
                  totalPages={performanceQuery.data?.pagination?.totalPages ?? 0}
                  total={performanceQuery.data?.pagination?.total ?? 0}
                  limit={performanceFilters.limit}
                  onChange={performanceFilters.setPage}
                />
              }
            />
          </Card>
        </div>
      ) : null}

      {tab === 'audit' ? (
        <div className="space-y-4">
          <Alert tone="info" title="Immutable audit trail">
            These records are written by the backend for staff actions and system events. They cannot be edited here.
          </Alert>

          <Card className="p-4">
            <FilterBar>
              <FilterField label="Action" htmlFor="audit-action">
                <Input id="audit-action" className="input-base" value={auditFilters.filters.action} onChange={(event) => auditFilters.setFilter('action', event.target.value)} placeholder="e.g. SETTING_UPDATED" />
              </FilterField>
              <FilterField label="Actor type" htmlFor="audit-actor">
                <Select id="audit-actor" value={auditFilters.filters.actorType} onChange={(event) => auditFilters.setFilter('actorType', event.target.value)}>
                  <option value="">Any actor</option>
                  {['ADMIN', 'HELPER', 'CUSTOMER', 'SYSTEM'].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Entity type" htmlFor="audit-entity">
                <Input id="audit-entity" className="input-base" value={auditFilters.filters.entityType} onChange={(event) => auditFilters.setFilter('entityType', event.target.value)} placeholder="e.g. Bill" />
              </FilterField>
              <FilterField label="From" htmlFor="audit-from">
                <input id="audit-from" type="date" className="input-base" value={auditFilters.filters.from} onChange={(event) => auditFilters.setFilter('from', event.target.value)} />
              </FilterField>
              <FilterField label="To" htmlFor="audit-to">
                <input id="audit-to" type="date" className="input-base" value={auditFilters.filters.to} onChange={(event) => auditFilters.setFilter('to', event.target.value)} />
              </FilterField>
              <Button variant="ghost" size="sm" onClick={auditFilters.reset} disabled={!auditFilters.activeCount}>
                Clear filters
              </Button>
            </FilterBar>
          </Card>

          <Card>
            <CardHeader
              title="Audit log"
              action={
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() =>
                    downloadCsv(`helply-audit-${monthKey}.csv`, (auditQuery.data?.items ?? []).map((row) => ({
                      at: row.createdAt,
                      action: row.action,
                      actorType: row.actorType,
                      entityType: row.entityType,
                      description: row.description,
                    })))
                  }
                  disabled={!auditQuery.data?.items?.length}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  CSV
                </Button>
              }
            />
            <DataTable
              columns={[
                {
                  key: 'at',
                  header: 'When',
                  cell: (row) => <span className="text-xs text-navy-500">{formatDateTime(row.createdAt)}</span>,
                },
                { key: 'action', header: 'Action', cell: (row) => <span className="font-mono text-xs text-navy-800">{row.action}</span> },
                { key: 'actor', header: 'Actor', cell: (row) => <Badge tone="neutral">{row.actorType ?? '—'}</Badge> },
                { key: 'entity', header: 'Entity', cell: (row) => <span className="text-xs text-navy-600">{row.entityType ?? '—'} {row.entityId ? shortId(row.entityId) : ''}</span> },
                {
                  key: 'description',
                  header: 'Description',
                  cell: (row) => <span className="text-sm text-navy-700">{row.description ?? '—'}</span>,
                },
              ]}
              rows={auditQuery.data?.items ?? []}
              loading={auditQuery.isLoading}
              error={auditQuery.error}
              onRetry={() => auditQuery.refetch()}
              getRowId={(row) => row.id}
              emptyTitle="No audit entries match"
              footer={
                <Pagination
                  page={auditFilters.page}
                  totalPages={auditQuery.data?.pagination?.totalPages ?? 0}
                  total={auditQuery.data?.pagination?.total ?? 0}
                  limit={auditFilters.limit}
                  onChange={auditFilters.setPage}
                />
              }
            />
          </Card>
        </div>
      ) : null}
    </div>
  );
}
