'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  ReceiptText,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { STATUS_LABELS } from '@/lib/constants';
import { errorMessage } from '@/lib/errors';
import { formatDateTime, formatPkr } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Button, Card, LinkButton, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatusBadge } from '@/components/ui/data';
import { Select, Textarea } from '@/components/ui/form';
import { ConfirmDialog, Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, shortId, useAdminFilters, useDirectory } from '@/components/admin/list-utils';

export default function AdminBillingPage() {
  const queryClient = useQueryClient();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    status: '',
    paymentStatus: '',
    helper: '',
    customer: '',
  });
  const { helpers, helperName, customerName } = useDirectory();

  const [selectedId, setSelectedId] = useState(null);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billParam = params.get('bill');
    if (billParam) setSelectedId(billParam);
  }, []);

  const listQuery = useQuery({
    queryKey: ['admin', 'bills', queryParams],
    queryFn: () => adminApi.bills.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'bill', selectedId],
    queryFn: () => adminApi.bills.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin', 'bill-payments', selectedId],
    queryFn: () => adminApi.payments.list({ bill: selectedId, limit: 50 }),
    enabled: Boolean(selectedId),
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };
  const bill = detailQuery.data;
  const payments = paymentsQuery.data?.items ?? [];
  const outstanding = bill ? Math.max(0, bill.totalAmountPkr - (bill.amountPaidPkr ?? 0)) : 0;

  const refresh = () => {
    listQuery.refetch();
    if (selectedId) {
      detailQuery.refetch();
      paymentsQuery.refetch();
    }
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const voidBill = async () => {
    setVoiding(true);
    setActionError('');
    try {
      await adminApi.bills.void(selectedId, voidReason.trim() || undefined);
      toast.success('Bill voided', 'The original amounts remain in the audit trail.');
      setVoidOpen(false);
      setVoidReason('');
      refresh();
    } catch (error) {
      setActionError(errorMessage(error, 'Could not void this bill.'));
    } finally {
      setVoiding(false);
    }
  };

  const copyCustomerLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/customer/bill/${selectedId}`);
      toast.success('Link copied', 'Share this private bill link with the guest.');
    } catch {
      toast.error('Could not copy', 'Copy the URL from your browser instead.');
    }
  };

  const columns = [
    {
      key: 'bill',
      header: 'Bill',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.billNumber}</p>
          <p className="text-xs text-navy-500">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    { key: 'guest', header: 'Guest', cell: (row) => customerName(row.customer) },
    { key: 'helper', header: 'Helper', cell: (row) => (row.helper ? helperName(row.helper) : '—') },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (row) => <span className="font-semibold text-navy-900">{formatPkr(row.totalAmountPkr)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      cell: (row) => <span className="text-sm text-navy-600">{formatPkr(row.amountPaidPkr ?? 0)}</span>,
    },
    { key: 'payment', header: 'Payment', cell: (row) => <StatusBadge status={row.paymentStatus} /> },
    { key: 'status', header: 'Bill', cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Billing"
        description="Server-calculated, immutable bills. Amounts are never edited here — only voided with a reason."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={listQuery.isFetching}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Bill status" htmlFor="bill-status">
            <Select id="bill-status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">All bills</option>
              <option value="GENERATED">Generated</option>
              <option value="VOID">Void</option>
            </Select>
          </FilterField>
          <FilterField label="Payment" htmlFor="bill-payment">
            <Select
              id="bill-payment"
              value={filters.paymentStatus}
              onChange={(event) => setFilter('paymentStatus', event.target.value)}
            >
              <option value="">Any payment status</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partially paid</option>
              <option value="PAID">Paid</option>
            </Select>
          </FilterField>
          <FilterField label="Helper" htmlFor="bill-helper">
            <Select id="bill-helper" value={filters.helper} onChange={(event) => setFilter('helper', event.target.value)}>
              <option value="">All helpers</option>
              {helpers.map((helper) => (
                <option key={helper.id} value={helper.id}>
                  {helper.name}
                </option>
              ))}
            </Select>
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
        emptyTitle="No bills yet"
        emptyDescription="Bills are generated after a service is completed."
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
        title={bill ? `Bill ${bill.billNumber}` : 'Bill details'}
        description={bill ? `${formatPkr(bill.totalAmountPkr)} · ${bill.currency ?? 'PKR'}` : undefined}
        size="lg"
      >
        {detailQuery.isLoading ? (
          <p className="py-6 text-sm text-navy-500">Loading bill…</p>
        ) : detailQuery.isError ? (
          <p className="py-6 text-sm text-red-600">{errorMessage(detailQuery.error)}</p>
        ) : bill ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={bill.status} />
              <StatusBadge status={bill.paymentStatus} />
              <span className="text-xs text-navy-400">Session {shortId(bill.serviceSession)}</span>
            </div>

            <div className="rounded-2xl bg-navy-950 px-4 py-4 text-white">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/50">Total bill</p>
                  <p className="mt-0.5 font-display text-2xl font-semibold">{formatPkr(bill.totalAmountPkr)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-white/50">Outstanding</p>
                  <p className="mt-0.5 text-lg font-semibold text-teal-300">{formatPkr(outstanding)}</p>
                </div>
              </div>
              <p className="mt-3 border-t border-white/10 pt-2 text-[11px] text-white/50">
                {bill.billableBlocks} block{bill.billableBlocks === 1 ? '' : 's'} × {bill.unitPricePkr} PKR ·{' '}
                {bill.unitMinutes} min per block
              </p>
            </div>

            <DetailList
              columns={2}
              items={[
                { label: 'Guest', value: customerName(bill.customer) },
                { label: 'Helper', value: bill.helper ? helperName(bill.helper) : '—' },
                { label: 'Service duration', value: `${Math.round((bill.durationSeconds ?? 0) / 60)} min` },
                { label: 'Amount paid', value: formatPkr(bill.amountPaidPkr ?? 0) },
                { label: 'Generated', value: formatDateTime(bill.generatedAt ?? bill.createdAt) },
                { label: 'Paid at', value: bill.paidAt ? formatDateTime(bill.paidAt) : '—' },
              ]}
            />

            {bill.status === 'VOID' ? (
              <Alert tone="warning" title="This bill was voided">
                {bill.voidReason || 'No reason recorded.'} · {formatDateTime(bill.voidedAt)}
              </Alert>
            ) : null}

            {actionError ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}

            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                <CreditCard className="h-4 w-4 text-teal-600" aria-hidden="true" />
                Payments on this bill
              </p>
              {paymentsQuery.isLoading ? (
                <p className="mt-2 text-sm text-navy-500">Loading payments…</p>
              ) : payments.length === 0 ? (
                <p className="mt-2 rounded-xl bg-navy-50 px-3.5 py-3 text-sm text-navy-600">
                  No payments recorded. Staff can record cash from the payments page.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-navy-100 rounded-xl border border-navy-100">
                  {payments.map((payment) => (
                    <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy-900">
                          {formatPkr(payment.amountPkr)} · {payment.method.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-navy-500">
                          {payment.paymentNumber} · {formatDateTime(payment.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={payment.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <LinkButton
                href={`/admin/payments?bill=${selectedId}`}
                size="sm"
                variant="secondary"
                onClick={() => setSelectedId(null)}
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Manage payments
              </LinkButton>
              <LinkButton href={`/admin/sessions?session=${bill.serviceSession}`} size="sm" variant="secondary">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Open session
              </LinkButton>
              <Button size="sm" variant="ghost" onClick={copyCustomerLink}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy guest link
              </Button>
              <Link
                href={`/customer/bill/${selectedId}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-2 text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Preview guest view
              </Link>
              {bill.status !== 'VOID' ? (
                <Button
                  size="sm"
                  variant="dangerSoft"
                  className="sm:ml-auto"
                  onClick={() => setVoidOpen(true)}
                  disabled={(bill.amountPaidPkr ?? 0) > 0}
                  title={bill.amountPaidPkr > 0 ? 'Refund payments before voiding' : undefined}
                >
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Void bill
                </Button>
              ) : null}
            </div>
            {bill.status !== 'VOID' && bill.amountPaidPkr > 0 ? (
              <p className="text-xs text-navy-500">
                This bill has recorded payments. Refund them before a void is allowed.
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-[11px] text-navy-400">
                <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
                Amounts come from server timestamps and the pricing snapshot at completion. Editing is disabled by
                design.
              </p>
            )}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={voidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={voidBill}
        title="Void this bill?"
        description="The bill stops counting toward revenue but is never deleted. The amounts and pricing snapshot stay in the audit trail."
        confirmLabel="Void bill"
        cancelLabel="Keep bill"
        tone="danger"
        loading={voiding}
      >
        <Textarea
          rows={3}
          maxLength={1000}
          value={voidReason}
          onChange={(event) => setVoidReason(event.target.value)}
          placeholder="Reason (optional) — audited"
          aria-label="Void reason"
        />
      </ConfirmDialog>
    </div>
  );
}
