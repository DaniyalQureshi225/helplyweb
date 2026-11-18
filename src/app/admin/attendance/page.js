'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck2, CheckCircle2, RefreshCw, UserPlus } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { ATTENDANCE_STATUSES, STATUS_TONES } from '@/lib/constants';
import { currentMonthKey, formatDateTime, formatMonthKey } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Badge, Button, Card, PageHeader, StatCard } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatusBadge } from '@/components/ui/data';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, useAdminFilters, useDirectory } from '@/components/admin/list-utils';

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function AdminAttendancePage() {
  const queryClient = useQueryClient();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    helper: '',
    monthKey: currentMonthKey(),
    dateKey: '',
    status: '',
  });
  const { helpers, helperName, helperOptions } = useDirectory();

  const [markOpen, setMarkOpen] = useState(false);
  const [markForm, setMarkForm] = useState({ helperId: '', dateKey: todayKey(), status: 'PRESENT', note: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'PRESENT', note: '' });
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeHelper, setRangeHelper] = useState('');
  const [rangeMonth, setRangeMonth] = useState(currentMonthKey());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin', 'attendance', queryParams],
    queryFn: () => adminApi.attendance.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const summaryQuery = useQuery({
    queryKey: ['admin', 'attendance', 'summary', filters.helper, filters.monthKey],
    queryFn: () => adminApi.attendance.summary(filters.helper, filters.monthKey || currentMonthKey()),
    enabled: Boolean(filters.helper),
    staleTime: 60_000,
  });

  const rangeQuery = useQuery({
    queryKey: ['admin', 'attendance', 'range', rangeHelper, rangeMonth],
    queryFn: () => adminApi.attendance.range(rangeHelper, rangeMonth),
    enabled: rangeOpen && Boolean(rangeHelper),
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };
  const summary = summaryQuery.data;

  const refresh = () => {
    listQuery.refetch();
    summaryQuery.refetch();
    rangeQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'incentives'] });
  };

  const submitMark = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminApi.attendance.mark({
        helperId: markForm.helperId,
        dateKey: markForm.dateKey,
        status: markForm.status,
        note: markForm.note.trim() || undefined,
      });
      toast.success('Attendance marked', 'Related incentives were re-evaluated by the backend.');
      setMarkOpen(false);
      setMarkForm((previous) => ({ ...previous, note: '' }));
      refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not mark attendance.'));
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminApi.attendance.update(selectedId, {
        status: editForm.status,
        note: editForm.note.trim(),
      });
      toast.success('Attendance updated');
      setSelectedId(null);
      refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not update attendance.'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.dateKey}</p>
          <p className="text-xs text-navy-500">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    { key: 'helper', header: 'Helper', cell: (row) => helperName(row.helper) },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { key: 'month', header: 'Month', cell: (row) => formatMonthKey(row.monthKey) },
    { key: 'note', header: 'Note', cell: (row) => <span className="text-sm text-navy-600">{row.note || '—'}</span> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance"
        description="Daily attendance drives the monthly 26-day reward and the three-month consistency reward. The backend recalculates incentives on every change."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRangeOpen(true)}>
              <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
              Month view
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setMarkForm({ helperId: filters.helper || '', dateKey: todayKey(), status: 'PRESENT', note: '' });
                setError('');
                setMarkOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Mark attendance
            </Button>
          </div>
        }
      />

      <Alert tone="info">
        Only the backend decides eligibility and amounts. Attendance days feed incentive rules configured under Settings;
        this page only records the underlying days.
      </Alert>

      {filters.helper && summary ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard label="Counted days" value={summary.countedDays ?? 0} hint={`of ${summary.requiredDays ?? 26} required`} icon={CalendarCheck2} tone="teal" />
          <StatCard
            label="Monthly reward"
            value={summary.monthlyIncentiveEligible ? 'Eligible' : 'Not yet'}
            hint={formatMonthKey(summary.monthKey)}
            icon={CheckCircle2}
            tone={summary.monthlyIncentiveEligible ? 'teal' : 'navy'}
          />
          <StatCard
            label="Consistency"
            value={summary.consistencyEligible ? 'Qualified' : 'In progress'}
            hint="Three consecutive qualifying months"
            icon={CalendarCheck2}
            tone={summary.consistencyEligible ? 'teal' : 'amber'}
          />
          <StatCard
            label="Present"
            value={summary.byStatus?.PRESENT ?? 0}
            hint={`${formatMonthKey(summary.monthKey)} · ${helperName(filters.helper)}`}
            icon={CalendarCheck2}
          />
        </div>
      ) : null}

      {summary?.consecutiveMonths?.length ? (
        <Card className="p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">Streak detail</p>
          <div className="flex flex-wrap gap-2">
            {summary.consecutiveMonths.map((month) => (
              <Badge key={month.monthKey} tone={month.qualified ? 'green' : 'neutral'}>
                {formatMonthKey(month.monthKey)} · {month.count} days {month.qualified ? '✓' : ''}
              </Badge>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Helper" htmlFor="attendance-helper">
            <Select id="attendance-helper" value={filters.helper} onChange={(event) => setFilter('helper', event.target.value)}>
              <option value="">All helpers</option>
              {helpers.map((helper) => (
                <option key={helper.id} value={helper.id}>
                  {helper.name}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Month" htmlFor="attendance-month">
            <input id="attendance-month" type="month" className="input-base" value={filters.monthKey} onChange={(event) => setFilter('monthKey', event.target.value)} />
          </FilterField>
          <FilterField label="Date" htmlFor="attendance-date">
            <input id="attendance-date" type="date" className="input-base" value={filters.dateKey} onChange={(event) => setFilter('dateKey', event.target.value)} />
          </FilterField>
          <FilterField label="Status" htmlFor="attendance-status">
            <Select id="attendance-status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {ATTENDANCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll('_', ' ')}
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
          setEditForm({ status: row.status, note: row.note ?? '' });
          setError('');
        }}
        getRowId={(row) => row.id}
        emptyTitle="No attendance records"
        emptyDescription="Mark a helper's attendance to see it here."
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
        open={markOpen}
        onClose={() => setMarkOpen(false)}
        title="Mark attendance"
        description="Future dates are rejected. Marking re-evaluates that helper's incentives for the month."
        size="md"
      >
        <form onSubmit={submitMark} className="space-y-4">
          <Field label="Helper" htmlFor="mark-helper" required>
            <Select
              id="mark-helper"
              value={markForm.helperId}
              onChange={(event) => setMarkForm((previous) => ({ ...previous, helperId: event.target.value }))}
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
            <Field label="Date" htmlFor="mark-date" required>
              <Input
                id="mark-date"
                type="date"
                max={todayKey()}
                value={markForm.dateKey}
                onChange={(event) => setMarkForm((previous) => ({ ...previous, dateKey: event.target.value }))}
                required
              />
            </Field>
            <Field label="Status" htmlFor="mark-status" required>
              <Select
                id="mark-status"
                value={markForm.status}
                onChange={(event) => setMarkForm((previous) => ({ ...previous, status: event.target.value }))}
                required
              >
                {ATTENDANCE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Note" htmlFor="mark-note">
            <Textarea
              id="mark-note"
              rows={2}
              maxLength={1000}
              value={markForm.note}
              onChange={(event) => setMarkForm((previous) => ({ ...previous, note: event.target.value }))}
              placeholder="Optional reason"
            />
          </Field>

          {error ? (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setMarkOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving} disabled={!markForm.helperId || !markForm.dateKey}>
              Mark attendance
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title="Edit attendance"
        description={selectedId ? `${helperName(rows.find((row) => row.id === selectedId)?.helper)}` : undefined}
        size="sm"
      >
        <form onSubmit={submitEdit} className="space-y-4">
          <Field label="Status" htmlFor="edit-attendance-status" required>
            <Select
              id="edit-attendance-status"
              value={editForm.status}
              onChange={(event) => setEditForm((previous) => ({ ...previous, status: event.target.value }))}
              required
            >
              {ATTENDANCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note" htmlFor="edit-attendance-note">
            <Textarea
              id="edit-attendance-note"
              rows={3}
              maxLength={1000}
              value={editForm.note}
              onChange={(event) => setEditForm((previous) => ({ ...previous, note: event.target.value }))}
            />
          </Field>
          {error ? (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedId(null)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={rangeOpen}
        onClose={() => setRangeOpen(false)}
        title="Month view"
        description="Every marked day for one helper in the selected month."
        size="lg"
      >
        <div className="space-y-4">
          <FilterBar>
            <FilterField label="Helper" htmlFor="range-helper">
              <Select id="range-helper" value={rangeHelper} onChange={(event) => setRangeHelper(event.target.value)}>
                <option value="">Choose a helper</option>
                {helperOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Month" htmlFor="range-month">
              <input id="range-month" type="month" className="input-base" value={rangeMonth} onChange={(event) => setRangeMonth(event.target.value)} />
            </FilterField>
          </FilterBar>

          {!rangeHelper ? (
            <p className="py-8 text-center text-sm text-navy-500">Select a helper to see their month.</p>
          ) : rangeQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-navy-500">Loading month…</p>
          ) : rangeQuery.isError ? (
            <p className="py-8 text-center text-sm text-red-600">{errorMessage(rangeQuery.error)}</p>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {(rangeQuery.data ?? []).map((day) => (
                <div
                  key={day.id ?? day.dateKey}
                  className="flex items-center justify-between gap-2 rounded-lg border border-navy-100 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-navy-800">{day.dateKey}</span>
                  <Badge tone={STATUS_TONES[day.status] ?? 'neutral'}>{day.status?.replaceAll('_', ' ')}</Badge>
                </div>
              ))}
              {!(rangeQuery.data ?? []).length ? (
                <p className="col-span-full py-6 text-center text-sm text-navy-500">No days marked for this month.</p>
              ) : null}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
