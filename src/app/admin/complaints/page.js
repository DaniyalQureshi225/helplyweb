'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gavel,
  MessageSquareWarning,
  RefreshCw,
  UserRoundCheck,
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { COMPLAINT_CATEGORIES } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { Alert, Badge, Button, Card, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatusBadge } from '@/components/ui/data';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, useAdminFilters, useDirectory } from '@/components/admin/list-utils';

const categoryLabel = (value) => COMPLAINT_CATEGORIES.find((item) => item.value === value)?.label ?? value ?? '—';

export default function AdminComplaintsPage() {
  const queryClient = useQueryClient();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    status: '',
    category: '',
    priority: '',
    helper: '',
    customer: '',
    assignedTo: '',
    from: '',
    to: '',
  });
  const { helpers, customers, helperName, customerName } = useDirectory();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [selectedId, setSelectedId] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [evidenceLabel, setEvidenceLabel] = useState('');
  const [evidenceValue, setEvidenceValue] = useState('');
  const [resolution, setResolution] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [upheld, setUpheld] = useState(true);
  const [working, setWorking] = useState('');
  const [actionError, setActionError] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin', 'complaints', queryParams],
    queryFn: () => adminApi.complaints.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'complaint', selectedId],
    queryFn: () => adminApi.complaints.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const adminsQuery = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: adminApi.admins.list,
    enabled: isSuperAdmin,
    staleTime: 120_000,
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };
  const complaint = detailQuery.data;
  const admins = adminsQuery.data ?? [];
  const assigneeOptions = [
    ...(isSuperAdmin
      ? admins
          .filter((admin) => admin.isActive !== false)
          .map((admin) => ({ value: admin.id ?? admin._id, label: `${admin.name} · ${admin.role}` }))
      : []),
    ...(user?.id && !admins.some((admin) => String(admin.id ?? admin._id) === String(user.id))
      ? [{ value: user.id, label: `${user.name ?? 'You'} (you)` }]
      : []),
  ];

  const refresh = () => {
    listQuery.refetch();
    if (selectedId) detailQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'disciplinary'] });
  };

  const run = async (key, call, title) => {
    setWorking(key);
    setActionError('');
    try {
      await call();
      toast.success(title);
      refresh();
      return true;
    } catch (error) {
      setActionError(errorMessage(error, 'Could not update this complaint.'));
      return false;
    } finally {
      setWorking('');
    }
  };

  const submitAssign = async () => {
    const ok = await run('assign', () => adminApi.complaints.assign(selectedId, assigneeId), 'Complaint assigned');
    if (ok) setAssignOpen(false);
  };

  const submitNote = async (event) => {
    event.preventDefault();
    const ok = await run('note', () => adminApi.complaints.note(selectedId, noteText.trim()), 'Note added');
    if (ok) setNoteText('');
  };

  const submitEvidence = async (event) => {
    event.preventDefault();
    const ok = await run(
      'evidence',
      () =>
        adminApi.complaints.evidence(selectedId, {
          type: 'TEXT',
          label: evidenceLabel.trim() || undefined,
          value: evidenceValue.trim(),
        }),
      'Evidence added',
    );
    if (ok) {
      setEvidenceLabel('');
      setEvidenceValue('');
    }
  };

  const submitResolve = async (event) => {
    event.preventDefault();
    const ok = await run(
      'resolve',
      () =>
        adminApi.complaints.resolve(selectedId, {
          resolution: resolution.trim(),
          upheld,
          note: resolutionNote.trim() || undefined,
        }),
      'Complaint resolved',
    );
    if (ok) {
      setResolution('');
      setResolutionNote('');
    }
  };

  const columns = [
    {
      key: 'number',
      header: 'Complaint',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.complaintNumber}</p>
          <p className="text-xs text-navy-500">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', cell: (row) => <span className="text-sm text-navy-700">{categoryLabel(row.category)}</span> },
    { key: 'helper', header: 'Helper', cell: (row) => helperName(row.helper) },
    { key: 'guest', header: 'Guest', cell: (row) => customerName(row.customer) },
    {
      key: 'priority',
      header: 'Priority',
      cell: (row) => (
        <Badge tone={row.priority === 'URGENT' ? 'red' : row.priority === 'HIGH' ? 'amber' : 'neutral'}>
          {row.priority ?? 'NORMAL'}
        </Badge>
      ),
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ];

  const terminal = ['RESOLVED', 'REJECTED', 'CLOSED'].includes(complaint?.status);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Complaints"
        description="Guest complaints are reviewed by staff. Three upheld complaints open a disciplinary review — never an automatic penalty."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={listQuery.isFetching}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Status" htmlFor="complaint-status">
            <Select id="complaint-status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CLOSED'].map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Category" htmlFor="complaint-category">
            <Select id="complaint-category" value={filters.category} onChange={(event) => setFilter('category', event.target.value)}>
              <option value="">All categories</option>
              {COMPLAINT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Priority" htmlFor="complaint-priority">
            <Select id="complaint-priority" value={filters.priority} onChange={(event) => setFilter('priority', event.target.value)}>
              <option value="">Any priority</option>
              {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Helper" htmlFor="complaint-helper">
            <Select id="complaint-helper" value={filters.helper} onChange={(event) => setFilter('helper', event.target.value)}>
              <option value="">All helpers</option>
              {helpers.map((helper) => (
                <option key={helper.id} value={helper.id}>
                  {helper.name}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Guest" htmlFor="complaint-customer">
            <Select id="complaint-customer" value={filters.customer} onChange={(event) => setFilter('customer', event.target.value)}>
              <option value="">All guests</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Assigned to" htmlFor="complaint-assigned">
            <Select id="complaint-assigned" value={filters.assignedTo} onChange={(event) => setFilter('assignedTo', event.target.value)}>
              <option value="">Any administrator</option>
              {assigneeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="From" htmlFor="complaint-from">
            <input id="complaint-from" type="date" className="input-base" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} />
          </FilterField>
          <FilterField label="To" htmlFor="complaint-to">
            <input id="complaint-to" type="date" className="input-base" value={filters.to} onChange={(event) => setFilter('to', event.target.value)} />
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
        emptyTitle="No complaints match"
        emptyDescription="Guest complaints appear here as soon as they are filed."
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
        title={complaint ? `Complaint ${complaint.complaintNumber}` : 'Complaint details'}
        description={complaint ? `${categoryLabel(complaint.category)} · ${formatDateTime(complaint.createdAt)}` : undefined}
        size="xl"
      >
        {detailQuery.isLoading ? (
          <p className="py-8 text-sm text-navy-500">Loading complaint…</p>
        ) : detailQuery.isError ? (
          <p className="py-8 text-sm text-red-600">{errorMessage(detailQuery.error)}</p>
        ) : complaint ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={complaint.status} />
              {complaint.upheld === true ? <Badge tone="red">Upheld</Badge> : null}
              {complaint.upheld === false ? <Badge tone="neutral">Not upheld</Badge> : null}
              {complaint.disciplinaryAction ? (
                <Link
                  href={`/admin/disciplinary?case=${complaint.disciplinaryAction}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
                  onClick={() => setSelectedId(null)}
                >
                  <Gavel className="h-3.5 w-3.5" aria-hidden="true" />
                  Disciplinary review opened
                </Link>
              ) : null}
            </div>

            <div className="rounded-xl bg-navy-50 px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Guest description</p>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-navy-800">{complaint.description}</p>
            </div>

            <DetailList
              columns={2}
              items={[
                { label: 'Helper', value: helperName(complaint.helper) },
                { label: 'Guest', value: customerName(complaint.customer) },
                { label: 'Priority', value: complaint.priority ?? 'NORMAL' },
                { label: 'Assigned to', value: complaint.assignedTo ? `${String(complaint.assignedTo).slice(-6)}` : 'Unassigned' },
                { label: 'Service session', value: complaint.serviceSession ? String(complaint.serviceSession).slice(-8) : '—' },
                { label: 'Resolved', value: complaint.resolvedAt ? formatDateTime(complaint.resolvedAt) : '—' },
              ]}
            />

            {complaint.resolution ? (
              <Alert tone={complaint.upheld ? 'warning' : 'info'} title="Resolution recorded">
                {complaint.resolution}
              </Alert>
            ) : null}

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-navy-900">Review timeline</p>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => {
                    setAssigneeId(isSuperAdmin ? '' : user?.id ?? '');
                    setAssignOpen(true);
                  }}
                  disabled={terminal}
                >
                  <UserRoundCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Assign
                </Button>
              </div>
              <ol className="space-y-2">
                {(complaint.evidence ?? []).map((item, index) => (
                  <li key={`evidence-${index}`} className="rounded-lg border border-navy-100 px-3 py-2.5 text-sm">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      {item.type ?? 'TEXT'} · {item.label ?? 'Evidence'}
                      {item.addedAt ? ` · ${formatDateTime(item.addedAt)}` : ''}
                    </p>
                    {item.value ? <p className="mt-1 whitespace-pre-line text-navy-700">{item.value}</p> : null}
                  </li>
                ))}
                {(complaint.adminNotes ?? []).map((item, index) => (
                  <li key={`note-${index}`} className="rounded-lg border border-navy-100 px-3 py-2.5 text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                      Staff note · {formatDateTime(item.at)}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-navy-700">{item.note}</p>
                  </li>
                ))}
                {!(complaint.evidence ?? []).length && !(complaint.adminNotes ?? []).length ? (
                  <li className="rounded-lg bg-navy-50 px-3 py-3 text-sm text-navy-500">No review notes or evidence yet.</li>
                ) : null}
              </ol>
            </div>

            {actionError ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}

            {!terminal ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <form onSubmit={submitNote} className="space-y-2 rounded-xl border border-navy-100 p-3.5">
                  <p className="text-sm font-semibold text-navy-900">Add a staff note</p>
                  <Field label="Note" htmlFor="complaint-note" required>
                    <Textarea
                      id="complaint-note"
                      rows={3}
                      maxLength={4000}
                      value={noteText}
                      onChange={(event) => setNoteText(event.target.value)}
                      required
                      placeholder="Internal review note"
                    />
                  </Field>
                  <Button type="submit" size="sm" variant="secondary" loading={working === 'note'} disabled={!noteText.trim()}>
                    Add note
                  </Button>
                </form>

                <form onSubmit={submitEvidence} className="space-y-2 rounded-xl border border-navy-100 p-3.5">
                  <p className="text-sm font-semibold text-navy-900">Attach text evidence</p>
                  <Field label="Label" htmlFor="evidence-label">
                    <Input
                      id="evidence-label"
                      value={evidenceLabel}
                      onChange={(event) => setEvidenceLabel(event.target.value)}
                      maxLength={200}
                      placeholder="e.g. Staff statement"
                    />
                  </Field>
                  <Field label="Details" htmlFor="evidence-value" required>
                    <Textarea
                      id="evidence-value"
                      rows={2}
                      maxLength={4000}
                      value={evidenceValue}
                      onChange={(event) => setEvidenceValue(event.target.value)}
                      required
                      placeholder="What was observed or verified"
                    />
                  </Field>
                  <Button type="submit" size="sm" variant="secondary" loading={working === 'evidence'} disabled={!evidenceValue.trim()}>
                    Attach evidence
                  </Button>
                </form>
              </div>
            ) : null}

            {!terminal ? (
              <form onSubmit={submitResolve} className="space-y-3 rounded-xl border border-navy-100 p-3.5">
                <p className="text-sm font-semibold text-navy-900">Resolve this complaint</p>
                <p className="text-xs leading-relaxed text-navy-500">
                  Marking a complaint as upheld opens a review workflow when the configured threshold is reached. No salary
                  deduction or termination happens automatically.
                </p>
                <Field label="Finding" htmlFor="resolution-text" required>
                  <Textarea
                    id="resolution-text"
                    rows={3}
                    maxLength={4000}
                    value={resolution}
                    onChange={(event) => setResolution(event.target.value)}
                    required
                    minLength={3}
                    placeholder="What was decided and why"
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Outcome" htmlFor="resolution-upheld">
                    <Select id="resolution-upheld" value={upheld ? 'true' : 'false'} onChange={(event) => setUpheld(event.target.value === 'true')}>
                      <option value="true">Upheld — guest was right</option>
                      <option value="false">Not upheld — reject complaint</option>
                    </Select>
                  </Field>
                  <Field label="Internal note" htmlFor="resolution-note">
                    <Input
                      id="resolution-note"
                      value={resolutionNote}
                      onChange={(event) => setResolutionNote(event.target.value)}
                      maxLength={2000}
                      placeholder="Optional"
                    />
                  </Field>
                </div>
                <Button type="submit" size="sm" loading={working === 'resolve'} disabled={resolution.trim().length < 3}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Record resolution
                </Button>
              </form>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                disabled={complaint.status === 'CLOSED'}
                loading={working === 'close'}
                onClick={() => run('close', () => adminApi.complaints.close(complaint.id), 'Complaint closed')}
              >
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                {complaint.status === 'CLOSED' ? 'Already closed' : 'Close complaint'}
              </Button>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign complaint"
        description="The assignee reviews the complaint. Assignment moves it to under review."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAssignOpen(false)} disabled={working === 'assign'}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitAssign} loading={working === 'assign'} disabled={!assigneeId}>
              Assign
            </Button>
          </div>
        }
      >
        <Field label="Administrator" htmlFor="complaint-assignee" required>
          <Select id="complaint-assignee" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} required>
            <option value="">Choose an administrator</option>
            {assigneeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>
    </div>
  );
}
