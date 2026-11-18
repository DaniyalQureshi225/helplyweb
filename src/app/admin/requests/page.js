'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Ban,
  ClipboardList,
  MapPin,
  RefreshCw,
  Timer,
  UserRound,
  UserRoundCheck,
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { REQUEST_STATUS_FLOW, STATUS_LABELS } from '@/lib/constants';
import { errorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import {
  Button,
  Card,
  LinkButton,
  PageHeader,
} from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatusBadge } from '@/components/ui/data';
import { Select, Textarea } from '@/components/ui/form';
import { ConfirmDialog, Modal } from '@/components/ui/overlay';
import {
  FilterBar,
  FilterField,
  shortId,
  useAdminFilters,
  useCatalog,
  useDirectory,
} from '@/components/admin/list-utils';

export default function AdminRequestsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    status: '',
    helper: '',
    customer: '',
    from: '',
    to: '',
  });
  const { helpers, helperName, customerName } = useDirectory();
  const { categoryName, locationName } = useCatalog();

  const [selectedId, setSelectedId] = useState(null);
  const [assignHelperId, setAssignHelperId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin', 'requests', queryParams],
    queryFn: () => adminApi.requests.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'request', selectedId],
    queryFn: () => adminApi.requests.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };

  const selected = detailQuery.data;

  const refreshAll = () => {
    listQuery.refetch();
    if (selectedId) detailQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const openRequest = (row) => {
    setSelectedId(row.id);
    setAssignHelperId(row.helper ?? '');
    setActionError('');
  };

  const assign = async () => {
    setActionError('');
    if (!assignHelperId) {
      setActionError('Choose a helper first.');
      return;
    }
    setAssigning(true);
    try {
      await adminApi.requests.assign(selectedId, assignHelperId);
      toast.success('Helper assigned', 'The guest and helper have been notified.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'requests'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'request', selectedId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'directory'] }),
      ]);
    } catch (error) {
      setActionError(errorMessage(error, 'Could not assign this helper.'));
    } finally {
      setAssigning(false);
    }
  };

  const cancel = async () => {
    setCancelling(true);
    setActionError('');
    try {
      await adminApi.requests.cancel(selectedId, cancelReason.trim() || undefined);
      toast.success('Request cancelled', 'The guest has been informed.');
      setCancelOpen(false);
      setCancelReason('');
      refreshAll();
    } catch (error) {
      setActionError(errorMessage(error, 'Could not cancel this request.'));
    } finally {
      setCancelling(false);
    }
  };

  const helperOptionList = useMemo(() => {
    const active = helpers.filter((helper) => helper.isActive !== false);
    return active.map((helper) => ({
      value: helper.id,
      label: `${helper.name}${helper.employeeCode ? ` · ${helper.employeeCode}` : ''}${
        helper.isAvailable === false ? ' (busy)' : ''
      }`,
    }));
  }, [helpers]);

  const columns = [
    {
      key: 'request',
      header: 'Request',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.requestNumber}</p>
          <p className="text-xs text-navy-500">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'guest',
      header: 'Guest',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy-500">
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="font-medium text-navy-800">{customerName(row.customer)}</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (row) => <span className="text-sm text-navy-600">{locationName(row.location)}</span>,
    },
    {
      key: 'category',
      header: 'Service',
      cell: (row) => <span className="text-sm text-navy-600">{categoryName(row.category)}</span>,
    },
    {
      key: 'helper',
      header: 'Helper',
      cell: (row) =>
        row.helper ? (
          <span className="text-sm font-medium text-navy-800">{helperName(row.helper)}</span>
        ) : (
          <span className="text-xs font-medium uppercase tracking-wider text-amber-600">Unassigned</span>
        ),
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Service requests"
        description="Assign helpers, monitor the queue and cancel only before the service starts."
        actions={
          <Button variant="secondary" size="sm" onClick={refreshAll} loading={listQuery.isFetching}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Status" htmlFor="filter-status">
            <Select id="filter-status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {[...REQUEST_STATUS_FLOW, 'CANCELLED'].map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Helper" htmlFor="filter-helper">
            <Select id="filter-helper" value={filters.helper} onChange={(event) => setFilter('helper', event.target.value)}>
              <option value="">All helpers</option>
              {helperOptionList.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="From" htmlFor="filter-from">
            <input
              id="filter-from"
              type="date"
              className="input-base"
              value={filters.from}
              onChange={(event) => setFilter('from', event.target.value)}
            />
          </FilterField>
          <FilterField label="To" htmlFor="filter-to">
            <input
              id="filter-to"
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
        onRowClick={openRequest}
        getRowId={(row) => row.id}
        emptyTitle="No requests match"
        emptyDescription="Try clearing filters or wait for the next guest request."
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
        title={selected ? `Request ${selected.requestNumber}` : 'Request details'}
        description={selected ? `${STATUS_LABELS[selected.status] ?? selected.status} · created ${formatDateTime(selected.createdAt)}` : undefined}
        size="lg"
      >
        {detailQuery.isLoading ? (
          <p className="py-6 text-sm text-navy-500">Loading request…</p>
        ) : detailQuery.isError ? (
          <p className="py-6 text-sm text-red-600">{errorMessage(detailQuery.error)}</p>
        ) : selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              {selected.recordingConsentRequired ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                  Recording consent required
                </span>
              ) : null}
              {selected.session ? <span className="text-xs text-navy-400">Session {shortId(selected.session)}</span> : null}
            </div>

            <DetailList
              columns={2}
              items={[
                { label: 'Guest', value: customerName(selected.customer) },
                { label: 'Location', value: locationName(selected.location) },
                { label: 'Service', value: categoryName(selected.category) },
                { label: 'Helper', value: selected.helper ? helperName(selected.helper) : 'Unassigned' },
                { label: 'Assigned', value: selected.assignedAt ? formatDateTime(selected.assignedAt) : '—' },
                { label: 'Source', value: selected.source ?? 'QR' },
              ]}
            />

            {selected.customerNote ? (
              <div className="rounded-xl bg-navy-50 px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Guest note</p>
                <p className="mt-1 whitespace-pre-line break-words text-sm text-navy-700">{selected.customerNote}</p>
              </div>
            ) : null}

            {selected.status === 'CANCELLED' ? (
              <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-800">
                Cancelled {selected.cancelledAt ? formatDateTime(selected.cancelledAt) : ''}
                {selected.cancellationReason ? ` — ${selected.cancellationReason}` : ''}
              </p>
            ) : null}

            {actionError ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}

            {selected.status === 'CREATED' ? (
              <div className="rounded-xl border border-navy-100 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                  <UserRoundCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
                  Assign a helper
                </p>
                <p className="mt-1 text-xs leading-relaxed text-navy-500">
                  Only active helpers qualified for this service category can be assigned. The backend enforces this.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Select
                    aria-label="Helper"
                    value={assignHelperId}
                    onChange={(event) => setAssignHelperId(event.target.value)}
                    className="flex-1"
                  >
                    <option value="">Choose a helper</option>
                    {helperOptionList.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <Button onClick={assign} loading={assigning} disabled={!assignHelperId}>
                    Assign helper
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {selected.session ? (
                <LinkButton href={`/admin/sessions?session=${selected.session}`} size="sm" variant="secondary">
                  <Timer className="h-4 w-4" aria-hidden="true" />
                  Open session
                </LinkButton>
              ) : null}
              <LinkButton href={`/admin/requests?customer=${selected.customer}`} size="sm" variant="ghost">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Guest history
              </LinkButton>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedId(null);
                  router.push(`/admin/payments?customer=${selected.customer}`);
                }}
              >
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                Guest payments
              </Button>
              {['CREATED', 'ASSIGNED'].includes(selected.status) ? (
                <Button size="sm" variant="dangerSoft" className="sm:ml-auto" onClick={() => setCancelOpen(true)}>
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Cancel request
                </Button>
              ) : null}
            </div>

            <p className="flex items-center gap-1.5 text-[11px] text-navy-400">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Guest location is provided by the venue QR code. Geo, when shared, is visible to the backend only.
            </p>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
        title="Cancel this request?"
        description="The helper assignment is released and the guest sees a cancelled request. This cannot be undone."
        confirmLabel="Cancel request"
        cancelLabel="Keep request"
        tone="danger"
        loading={cancelling}
      >
        <Textarea
          rows={3}
          maxLength={1000}
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          placeholder="Reason (optional) — shared with the guest"
          aria-label="Cancellation reason"
        />
      </ConfirmDialog>
    </div>
  );
}
