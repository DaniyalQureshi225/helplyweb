'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Gavel, RefreshCw } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Badge, Button, Card, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatusBadge } from '@/components/ui/data';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, shortId, useAdminFilters, useDirectory } from '@/components/admin/list-utils';

function localIsoWithOffset(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

export default function AdminDisciplinaryPage() {
  const queryClient = useQueryClient();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    status: '',
    helper: '',
  });
  const { helpers } = useDirectory();

  const [selectedId, setSelectedId] = useState(null);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('DECIDED');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin', 'disciplinary', queryParams],
    queryFn: () => adminApi.disciplinary.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'disciplinary', selectedId],
    queryFn: () => adminApi.disciplinary.get(selectedId),
    enabled: Boolean(selectedId),
  });

  // Deep link from a resolved complaint: /admin/disciplinary?case=<id>
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('case');
    if (value) setSelectedId(value);
  }, []);

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };
  const item = detailQuery.data;

  const refresh = () => {
    listQuery.refetch();
    if (selectedId) detailQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'complaints'] });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        decision: decision.trim(),
        notes: notes.trim() || undefined,
        status,
        ...(effectiveFrom ? { effectiveFrom: localIsoWithOffset(effectiveFrom) } : {}),
      };
      await adminApi.disciplinary.decide(selectedId, payload);
      toast.success('Decision recorded', 'The case is now locked. No salary change is made by this action.');
      setDecisionOpen(false);
      setDecision('');
      setNotes('');
      setEffectiveFrom('');
      refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not record this decision.'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'case',
      header: 'Case',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.caseNumber}</p>
          <p className="text-xs text-navy-500">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'helper',
      header: 'Helper',
      cell: (row) => (
        <div>
          <p className="text-sm text-navy-800">{row.helper?.name ?? `Helper ${shortId(row.helper)}`}</p>
          <p className="text-xs text-navy-400">{row.helper?.employeeCode ?? row.triggerType}</p>
        </div>
      ),
    },
    {
      key: 'complaints',
      header: 'Complaints',
      align: 'center',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.complaintCount ?? (row.complaints ?? []).length}</p>
          <p className="text-[11px] text-navy-400">{row.cycleKey ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Trigger',
      cell: (row) => <span className="line-clamp-2 max-w-sm text-sm text-navy-600">{row.reason}</span>,
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ];

  const closed = ['CLOSED', 'DISMISSED'].includes(item?.status);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Disciplinary reviews"
        description="Cases open automatically when helpers reach the upheld-complaint threshold. An administrator always decides the outcome."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={listQuery.isFetching}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <Alert tone="info" title="No automatic employment action">
        These records never deduct salary or terminate a helper by themselves. Only a documented decision by an authorized
        administrator can lead to action, recorded here with its effective date.
      </Alert>

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Status" htmlFor="disciplinary-status">
            <Select id="disciplinary-status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {['PENDING_REVIEW', 'DECIDED', 'DISMISSED', 'CLOSED'].map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Helper" htmlFor="disciplinary-helper">
            <Select id="disciplinary-helper" value={filters.helper} onChange={(event) => setFilter('helper', event.target.value)}>
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
        onRowClick={(row) => setSelectedId(row.id)}
        getRowId={(row) => row.id}
        emptyTitle="No disciplinary cases"
        emptyDescription="Cases appear here when upheld complaints reach the configured threshold."
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
        title={item ? `Case ${item.caseNumber}` : 'Disciplinary case'}
        description={item ? item.helper?.name ?? 'Helper' : undefined}
        size="lg"
      >
        {detailQuery.isLoading ? (
          <p className="py-8 text-sm text-navy-500">Loading case…</p>
        ) : detailQuery.isError ? (
          <p className="py-8 text-sm text-red-600">{errorMessage(detailQuery.error)}</p>
        ) : item ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              <Badge tone="neutral">{item.triggerType}</Badge>
              {item.cycleKey ? <Badge tone="neutral">{item.cycleKey}</Badge> : null}
            </div>

            <div className="rounded-xl bg-navy-50 px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Reason for review</p>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-800">{item.reason}</p>
            </div>

            <DetailList
              columns={2}
              items={[
                { label: 'Helper', value: item.helper?.name ?? '—' },
                { label: 'Employee code', value: item.helper?.employeeCode ?? '—' },
                { label: 'Complaints', value: item.complaintCount ?? (item.complaints ?? []).length },
                { label: 'Opened', value: formatDateTime(item.createdAt) },
                { label: 'Decision', value: item.decision ?? '—' },
                { label: 'Decided at', value: item.decidedAt ? formatDateTime(item.decidedAt) : '—' },
                { label: 'Effective from', value: item.effectiveFrom ? formatDateTime(item.effectiveFrom) : '—' },
                { label: 'Decision notes', value: item.decisionNotes ?? '—' },
              ]}
            />

            {item.complaints?.length ? (
              <div>
                <p className="text-sm font-semibold text-navy-900">Linked complaints</p>
                <ul className="mt-2 space-y-1.5">
                  {item.complaints.map((complaint) => (
                    <li key={complaint.id ?? complaint._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-navy-100 px-3 py-2 text-sm">
                      <span className="font-medium text-navy-800">{complaint.complaintNumber}</span>
                      <span className="text-xs text-navy-500">{complaint.category?.replaceAll('_', ' ')}</span>
                      <StatusBadge status={complaint.status} />
                      {complaint.upheld ? <Badge tone="red">Upheld</Badge> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {!closed ? (
              <Button
                size="sm"
                onClick={() => {
                  setDecision('');
                  setNotes('');
                  setStatus('DECIDED');
                  setEffectiveFrom('');
                  setError('');
                  setDecisionOpen(true);
                }}
              >
                <Gavel className="h-4 w-4" aria-hidden="true" />
                Record decision
              </Button>
            ) : (
              <Alert tone={item.status === 'DISMISSED' ? 'info' : 'success'} title="Case closed">
                {item.status === 'DISMISSED' ? 'The review was dismissed with no action.' : item.decision}
              </Alert>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={decisionOpen}
        onClose={() => setDecisionOpen(false)}
        title="Record disciplinary decision"
        description="Your decision, notes and effective date are written to the audit log."
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Decision" htmlFor="disciplinary-decision" required hint="Describe the action and its basis.">
            <Textarea
              id="disciplinary-decision"
              rows={4}
              maxLength={4000}
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
              required
              minLength={3}
              placeholder="e.g. Formal written warning issued after review of complaints"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Outcome" htmlFor="disciplinary-outcome">
              <Select id="disciplinary-outcome" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="DECIDED">Decided — record action</option>
                <option value="DISMISSED">Dismissed — no action</option>
              </Select>
            </Field>
            <Field label="Effective from" htmlFor="disciplinary-effective" hint="Optional date the decision takes effect.">
              <Input
                id="disciplinary-effective"
                type="date"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
            </Field>
          </div>
          <Field label="Additional notes" htmlFor="disciplinary-notes">
            <Textarea
              id="disciplinary-notes"
              rows={3}
              maxLength={4000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional internal context"
            />
          </Field>

          {error ? (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setDecisionOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving} disabled={decision.trim().length < 3}>
              Save decision
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
