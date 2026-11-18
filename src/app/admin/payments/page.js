'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Banknote,
  CircleSlash,
  CreditCard,
  Plus,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { PAYMENT_METHODS } from '@/lib/constants';
import { errorMessage } from '@/lib/errors';
import { formatDateTime, formatPkr } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Button, Card, LinkButton, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatusBadge } from '@/components/ui/data';
import { Field, Select, Textarea, Input } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, shortId, useAdminFilters, useDirectory } from '@/components/admin/list-utils';

function RecordPaymentModal({ open, onClose, bills, onSaved, presetBillId }) {
  const [billId, setBillId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [receipt, setReceipt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selected = bills.find((bill) => bill.id === billId);

  useEffect(() => {
    if (!open) return;
    setError('');
    setBillId(presetBillId ?? '');
    setMethod('CASH');
    setReference('');
    setReceipt('');
    const target = bills.find((bill) => bill.id === (presetBillId ?? ''));
    setAmount(target ? String(target.totalAmountPkr - (target.amountPaidPkr ?? 0)) : '');
  }, [open, presetBillId, bills]);

  useEffect(() => {
    if (!selected) return;
    setAmount(String(Math.max(0, selected.totalAmountPkr - (selected.amountPaidPkr ?? 0))));
  }, [selected]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const amountPkr = Number(amount);
    if (!billId) return setError('Choose a bill.');
    if (!Number.isInteger(amountPkr) || amountPkr <= 0) return setError('Enter a whole PKR amount greater than zero.');
    if (method !== 'CASH' && reference.trim().length < 3) {
      return setError('Add the transaction reference for a digital payment.');
    }
    setSaving(true);
    try {
      await adminApi.payments.record({
        billId,
        amountPkr,
        method,
        transactionReference: reference.trim() || undefined,
        receiptReference: receipt.trim() || undefined,
        customerConfirmed: false,
      });
      toast.success('Payment recorded', 'Recorded payments are confirmed immediately when entered by staff.');
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not record this payment.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record a payment" description="Staff-entered payments are confirmed instantly and recalculate the bill." size="md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Bill" htmlFor="record-bill" required>
          <Select id="record-bill" value={billId} onChange={(event) => setBillId(event.target.value)}>
            <option value="">Choose an open bill</option>
            {bills.map((bill) => (
              <option key={bill.id} value={bill.id}>
                {bill.billNumber} · outstanding {formatPkr(Math.max(0, bill.totalAmountPkr - (bill.amountPaidPkr ?? 0)))}
              </option>
            ))}
          </Select>
        </Field>

        {selected ? (
          <div className="rounded-xl bg-navy-50 px-3.5 py-3 text-sm text-navy-700">
            Total {formatPkr(selected.totalAmountPkr)} · already paid {formatPkr(selected.amountPaidPkr ?? 0)}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount (PKR)" htmlFor="record-amount" required hint="Whole rupees, never more than outstanding.">
            <Input
              id="record-amount"
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))}
              placeholder="500"
            />
          </Field>
          <Field label="Method" htmlFor="record-method" required>
            <Select id="record-method" value={method} onChange={(event) => setMethod(event.target.value)}>
              {PAYMENT_METHODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Transaction reference"
          htmlFor="record-reference"
          hint={method === 'CASH' ? 'Optional for cash.' : 'Required for digital payments.'}
        >
          <Input
            id="record-reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            maxLength={120}
            placeholder="Bank / wallet reference"
          />
        </Field>

        <Field label="Receipt reference" htmlFor="record-receipt" hint="Optional internal receipt number.">
          <Input
            id="record-receipt"
            value={receipt}
            onChange={(event) => setReceipt(event.target.value)}
            maxLength={200}
            placeholder="Receipt no."
          />
        </Field>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={saving}>
            Record payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    status: '',
    method: '',
    bill: '',
    helper: '',
    customer: '',
  });
  const { helpers, helperName, customerName } = useDirectory();

  const [selectedId, setSelectedId] = useState(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [working, setWorking] = useState('');
  const [failReason, setFailReason] = useState('');
  const [refundReference, setRefundReference] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billParam = params.get('bill');
    if (billParam) {
      setFilter('bill', billParam);
      setRecordOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listQuery = useQuery({
    queryKey: ['admin', 'payments', queryParams],
    queryFn: () => adminApi.payments.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'payment', selectedId],
    queryFn: () => adminApi.payments.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const openBillsQuery = useQuery({
    queryKey: ['admin', 'open-bills'],
    queryFn: () => adminApi.bills.list({ limit: 100 }),
    staleTime: 60_000,
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };
  const payment = detailQuery.data;
  const openBills = useMemo(
    () =>
      (openBillsQuery.data?.items ?? []).filter(
        (bill) => bill.status !== 'VOID' && bill.paymentStatus !== 'PAID',
      ),
    [openBillsQuery.data],
  );

  const refresh = () => {
    listQuery.refetch();
    if (selectedId) detailQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'bills'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'open-bills'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const runAction = async (action, call, successTitle) => {
    setWorking(action);
    setActionError('');
    try {
      await call();
      toast.success(successTitle);
      refresh();
      setFailReason('');
      setRefundReference('');
    } catch (error) {
      setActionError(errorMessage(error, 'Could not update this payment.'));
    } finally {
      setWorking('');
    }
  };

  const columns = [
    {
      key: 'payment',
      header: 'Payment',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.paymentNumber}</p>
          <p className="text-xs text-navy-500">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    { key: 'guest', header: 'Guest', cell: (row) => customerName(row.customer) },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => <span className="font-semibold text-navy-900">{formatPkr(row.amountPkr)}</span>,
    },
    { key: 'method', header: 'Method', cell: (row) => <span className="text-sm text-navy-600">{row.method.replace('_', ' ')}</span> },
    {
      key: 'reference',
      header: 'Reference',
      cell: (row) => (
        <span className="text-xs text-navy-500">{row.transactionReference || row.receiptReference || '—'}</span>
      ),
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        description="Verify customer-submitted payments, record cash, and refund with a reference. Bills recalculate server-side."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={refresh} loading={listQuery.isFetching}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setRecordOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Record payment
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Status" htmlFor="payment-status">
            <Select id="payment-status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {['PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Method" htmlFor="payment-method">
            <Select id="payment-method" value={filters.method} onChange={(event) => setFilter('method', event.target.value)}>
              <option value="">All methods</option>
              {PAYMENT_METHODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Helper" htmlFor="payment-helper">
            <Select id="payment-helper" value={filters.helper} onChange={(event) => setFilter('helper', event.target.value)}>
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
        emptyTitle="No payments match"
        emptyDescription="Customer-submitted payments arrive here for verification."
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
        title={payment ? `Payment ${payment.paymentNumber}` : 'Payment details'}
        description={payment ? `${formatPkr(payment.amountPkr)} · ${payment.method.replace('_', ' ')}` : undefined}
        size="md"
      >
        {detailQuery.isLoading ? (
          <p className="py-6 text-sm text-navy-500">Loading payment…</p>
        ) : detailQuery.isError ? (
          <p className="py-6 text-sm text-red-600">{errorMessage(detailQuery.error)}</p>
        ) : payment ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={payment.status} />
              <span className="text-xs text-navy-400">Bill {shortId(payment.bill)}</span>
            </div>

            <DetailList
              columns={2}
              items={[
                { label: 'Guest', value: customerName(payment.customer) },
                { label: 'Helper', value: payment.helper ? helperName(payment.helper) : '—' },
                { label: 'Amount', value: formatPkr(payment.amountPkr) },
                { label: 'Method', value: payment.method.replace('_', ' ') },
                { label: 'Transaction ref', value: payment.transactionReference || '—' },
                { label: 'Receipt ref', value: payment.receiptReference || '—' },
                { label: 'Recorded by', value: payment.recordedByType ?? '—' },
                { label: 'Recorded', value: formatDateTime(payment.createdAt) },
                { label: 'Confirmed', value: payment.confirmedAt ? formatDateTime(payment.confirmedAt) : '—' },
                { label: 'Refunded', value: payment.refundedAt ? formatDateTime(payment.refundedAt) : '—' },
              ]}
            />

            {payment.failureReason ? (
              <Alert tone="warning" title="Failure reason">
                {payment.failureReason}
              </Alert>
            ) : null}

            {actionError ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}

            {payment.status === 'PENDING' ? (
              <div className="space-y-3 rounded-xl border border-navy-100 p-3.5">
                <p className="text-sm font-semibold text-navy-900">Verify this payment</p>
                <p className="text-xs leading-relaxed text-navy-500">
                  Confirm only after matching the transaction reference. Confirming updates the bill and unlocks a
                  verified tip for this session.
                </p>
                <Button
                  size="sm"
                  onClick={() =>
                    runAction('confirm', () => adminApi.payments.confirm(payment.id), 'Payment confirmed')
                  }
                  loading={working === 'confirm'}
                >
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  Confirm payment
                </Button>
                <div className="border-t border-navy-100 pt-3">
                  <Field label="Failure reason" htmlFor="fail-reason" hint="Shown to the guest.">
                    <Textarea
                      id="fail-reason"
                      rows={2}
                      maxLength={1000}
                      value={failReason}
                      onChange={(event) => setFailReason(event.target.value)}
                      placeholder="Reference did not match"
                    />
                  </Field>
                  <Button
                    size="sm"
                    variant="dangerSoft"
                    className="mt-2"
                    disabled={failReason.trim().length < 3}
                    loading={working === 'fail'}
                    onClick={() =>
                      runAction(
                        'fail',
                        () => adminApi.payments.fail(payment.id, failReason.trim()),
                        'Payment marked failed',
                      )
                    }
                  >
                    <CircleSlash className="h-4 w-4" aria-hidden="true" />
                    Mark as failed
                  </Button>
                </div>
              </div>
            ) : null}

            {payment.status === 'CONFIRMED' ? (
              <div className="space-y-2 rounded-xl border border-navy-100 p-3.5">
                <p className="text-sm font-semibold text-navy-900">Refund this payment</p>
                <Field label="Refund reference" htmlFor="refund-reference">
                  <Input
                    id="refund-reference"
                    value={refundReference}
                    onChange={(event) => setRefundReference(event.target.value)}
                    maxLength={120}
                    placeholder="Bank refund reference"
                  />
                </Field>
                <Button
                  size="sm"
                  variant="dangerSoft"
                  disabled={refundReference.trim().length < 3}
                  loading={working === 'refund'}
                  onClick={() =>
                    runAction(
                      'refund',
                      () => adminApi.payments.refund(payment.id, refundReference.trim()),
                      'Payment refunded',
                    )
                  }
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Refund payment
                </Button>
              </div>
            ) : null}

            <LinkButton href={`/admin/billing?bill=${payment.bill}`} size="sm" variant="secondary" className="w-full">
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Open bill
            </LinkButton>
          </div>
        ) : null}
      </Modal>

      <RecordPaymentModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        bills={openBills}
        presetBillId={filters.bill || undefined}
        onSaved={refresh}
      />

      <div className="flex items-start gap-2 rounded-xl border border-navy-100 bg-white px-4 py-3 text-xs leading-relaxed text-navy-500">
        <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
        Amounts are whole PKR. Confirmed payments are the only ones that count toward a bill, a tip, or revenue.
      </div>
    </div>
  );
}
