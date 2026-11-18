'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, RefreshCw, Search, ShieldCheck, UserRound } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Button, Card, LinkButton, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination } from '@/components/ui/data';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, shortId, useAdminFilters } from '@/components/admin/list-utils';

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    search: '',
    blocked: '',
  });

  const [selectedId, setSelectedId] = useState(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin', 'customers', queryParams],
    queryFn: () => adminApi.customers.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'customer', selectedId],
    queryFn: () => adminApi.customers.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };
  const customer = detailQuery.data;

  const refresh = () => {
    listQuery.refetch();
    if (selectedId) detailQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'directory'] });
  };

  const setBlocked = async (isBlocked) => {
    setSaving(true);
    setActionError('');
    try {
      await adminApi.customers.setBlocked(selectedId, {
        isBlocked,
        reason: blockReason.trim() || undefined,
      });
      toast.success(isBlocked ? 'Customer blocked' : 'Customer unblocked');
      setBlockOpen(false);
      setBlockReason('');
      refresh();
    } catch (error) {
      setActionError(errorMessage(error, 'Could not update this customer.'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-500">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-navy-900">{row.name}</p>
            <p className="text-xs text-navy-500">{row.phone}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', cell: (row) => <span className="text-xs text-navy-500">{row.email || '—'}</span> },
    {
      key: 'services',
      header: 'Completed',
      align: 'center',
      cell: (row) => <span className="text-sm text-navy-700">{row.totalCompletedServices ?? 0}</span>,
    },
    {
      key: 'lastRequest',
      header: 'Last request',
      cell: (row) => (
        <span className="text-xs text-navy-500">{row.lastRequestAt ? formatDateTime(row.lastRequestAt) : 'Never'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) =>
        row.isBlocked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
            <Ban className="h-3 w-3" aria-hidden="true" />
            Blocked
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Active
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        description="Guests identified through QR codes. Blocking prevents new requests; history is always kept."
        actions={
          <Button variant="secondary" size="sm" onClick={() => listQuery.refetch()} loading={listQuery.isFetching}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Search" htmlFor="customer-search" className="min-w-[240px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" aria-hidden="true" />
              <Input
                id="customer-search"
                value={filters.search}
                onChange={(event) => setFilter('search', event.target.value)}
                placeholder="Name, phone or email"
                className="pl-9"
              />
            </div>
          </FilterField>
          <FilterField label="Status" htmlFor="customer-blocked">
            <Select id="customer-blocked" value={filters.blocked} onChange={(event) => setFilter('blocked', event.target.value)}>
              <option value="">All customers</option>
              <option value="false">Active only</option>
              <option value="true">Blocked only</option>
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
        emptyTitle="No customers match"
        emptyDescription="Guests appear here after their first QR check-in."
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
        title={customer ? customer.name : 'Customer details'}
        description={customer ? customer.phone : undefined}
        size="md"
      >
        {detailQuery.isLoading ? (
          <p className="py-6 text-sm text-navy-500">Loading customer…</p>
        ) : detailQuery.isError ? (
          <p className="py-6 text-sm text-red-600">{errorMessage(detailQuery.error)}</p>
        ) : customer ? (
          <div className="space-y-4">
            <DetailList
              columns={2}
              items={[
                { label: 'Name', value: customer.name },
                { label: 'Phone', value: customer.phone },
                { label: 'Email', value: customer.email || '—' },
                { label: 'Customer ID', value: shortId(customer.id) },
                { label: 'Completed services', value: customer.totalCompletedServices ?? 0 },
                { label: 'First seen', value: formatDateTime(customer.createdAt) },
                { label: 'Last request', value: customer.lastRequestAt ? formatDateTime(customer.lastRequestAt) : 'Never' },
                { label: 'Blocked', value: customer.isBlocked ? 'Yes' : 'No' },
              ]}
            />

            {customer.isBlocked ? (
              <Alert tone="warning" title="This customer is blocked">
                {customer.blockedReason || 'No reason recorded.'}
              </Alert>
            ) : null}

            {actionError ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <LinkButton href={`/admin/requests?customer=${customer.id}`} size="sm" variant="secondary">
                View requests
              </LinkButton>
              <Button
                size="sm"
                variant={customer.isBlocked ? 'success' : 'dangerSoft'}
                className="sm:ml-auto"
                onClick={() => {
                  setBlockReason('');
                  setBlockOpen(true);
                }}
              >
                <Ban className="h-4 w-4" aria-hidden="true" />
                {customer.isBlocked ? 'Unblock customer' : 'Block customer'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={blockOpen}
        onClose={() => {
          if (!saving) setBlockOpen(false);
        }}
        title={customer?.isBlocked ? 'Unblock this customer?' : 'Block this customer?'}
        description={
          customer?.isBlocked
            ? 'They will be able to request assistance again.'
            : 'They will not be able to submit new service requests. Past records stay intact.'
        }
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setBlockOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={customer?.isBlocked ? 'success' : 'danger'}
              loading={saving}
              onClick={() => setBlocked(!customer?.isBlocked)}
            >
              {customer?.isBlocked ? 'Unblock' : 'Block customer'}
            </Button>
          </div>
        }
      >
        <Field label="Reason" htmlFor="block-reason" hint="Stored with the admin action and shown to staff.">
          <Textarea
            id="block-reason"
            rows={3}
            maxLength={1000}
            value={blockReason}
            onChange={(event) => setBlockReason(event.target.value)}
            placeholder={customer?.isBlocked ? 'Optional' : 'e.g. Repeated abusive behaviour'}
          />
        </Field>
      </Modal>
    </div>
  );
}
