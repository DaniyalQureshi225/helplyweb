'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Button, Card, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination } from '@/components/ui/data';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, useAdminFilters, useCatalog } from '@/components/admin/list-utils';

const emptyForm = {
  name: '',
  employeeCode: '',
  phone: '',
  email: '',
  password: '',
  hourlyRateOverridePkr: '',
  notes: '',
  serviceCategoryIds: [],
};

function HelperFormModal({ open, onClose, helper, categories, onSaved }) {
  const editing = Boolean(helper);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      helper
        ? {
            name: helper.name ?? '',
            employeeCode: helper.employeeCode ?? '',
            phone: helper.phone ?? '',
            email: helper.email ?? '',
            password: '',
            hourlyRateOverridePkr:
              helper.hourlyRateOverridePkr === null || helper.hourlyRateOverridePkr === undefined
                ? ''
                : String(helper.hourlyRateOverridePkr),
            notes: helper.notes ?? '',
            serviceCategoryIds: (helper.serviceCategoryIds ?? []).map(String),
          }
        : emptyForm,
    );
  }, [open, helper]);

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const toggleCategory = (id, checked) => {
    setForm((previous) => ({
      ...previous,
      serviceCategoryIds: checked
        ? [...previous.serviceCategoryIds, id]
        : previous.serviceCategoryIds.filter((value) => value !== id),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const rate =
      form.hourlyRateOverridePkr === '' ? null : Number.parseInt(form.hourlyRateOverridePkr, 10);
    if (rate !== null && (!Number.isInteger(rate) || rate < 0)) {
      setError('Hourly override must be a whole PKR amount.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.helpers.update(helper.id, {
          name: form.name.trim(),
          employeeCode: form.employeeCode.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          hourlyRateOverridePkr: rate,
          notes: form.notes.trim() || null,
          serviceCategoryIds: form.serviceCategoryIds,
        });
        toast.success('Helper updated');
      } else {
        await adminApi.helpers.create({
          name: form.name.trim(),
          employeeCode: form.employeeCode.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          password: form.password,
          hourlyRateOverridePkr: rate,
          notes: form.notes.trim() || undefined,
          serviceCategoryIds: form.serviceCategoryIds,
        });
        toast.success('Helper created', 'Share the sign-in details securely with the helper.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not save this helper.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${helper.name}` : 'Add a helper'}
      description={
        editing
          ? 'Changes apply immediately. Helper passwords are reset separately.'
          : 'Creates a helper account with venue-scoped access.'
      }
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" htmlFor="helper-name" required>
            <Input
              id="helper-name"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              required
              minLength={2}
              maxLength={120}
            />
          </Field>
          <Field label="Employee code" htmlFor="helper-code" required>
            <Input
              id="helper-code"
              value={form.employeeCode}
              onChange={(event) => update('employeeCode', event.target.value)}
              required
              minLength={2}
              maxLength={40}
              placeholder="EMP-014"
            />
          </Field>
          <Field label="Phone" htmlFor="helper-phone" required hint="Used for helper sign-in.">
            <Input
              id="helper-phone"
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
              required
              minLength={10}
              maxLength={20}
              placeholder="03001234567"
            />
          </Field>
          <Field label="Email" htmlFor="helper-email">
            <Input
              id="helper-email"
              type="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              maxLength={200}
            />
          </Field>
          {!editing ? (
            <Field
              label="Temporary password"
              htmlFor="helper-password"
              required
              hint="At least 10 characters. The backend enforces strength rules."
              className="sm:col-span-2"
            >
              <Input
                id="helper-password"
                type="password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                required
                minLength={10}
                maxLength={200}
                autoComplete="new-password"
              />
            </Field>
          ) : null}
          <Field
            label="Hourly rate override (PKR)"
            htmlFor="helper-rate"
            hint="Leave blank to use the venue rate."
          >
            <Input
              id="helper-rate"
              inputMode="numeric"
              value={form.hourlyRateOverridePkr}
              onChange={(event) => update('hourlyRateOverridePkr', event.target.value.replace(/[^\d]/g, ''))}
              placeholder="Optional"
            />
          </Field>
          <Field label="Notes" htmlFor="helper-notes" className="sm:col-span-2">
            <Textarea
              id="helper-notes"
              rows={2}
              maxLength={2000}
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="Internal notes only"
            />
          </Field>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
            Qualified service categories
          </p>
          {categories.length === 0 ? (
            <p className="text-sm text-navy-500">No service categories exist yet. Create one under Services first.</p>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {categories.map((category) => (
                <Checkbox
                  key={category.id ?? category._id}
                  label={category.name}
                  checked={form.serviceCategoryIds.includes(String(category.id ?? category._id))}
                  onChange={(event) => toggleCategory(String(category.id ?? category._id), event.target.checked)}
                />
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-navy-500">
            The backend will not assign a helper to a category they are not qualified for.
          </p>
        </div>

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
            {editing ? 'Save changes' : 'Create helper'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ open, onClose, helper, onSaved }) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPassword('');
      setError('');
    }
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminApi.helpers.resetPassword(helper.id, password);
      toast.success('Password reset', 'Share the new password securely.');
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not reset the password.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Reset helper password" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <Alert tone="warning">
          Resetting the password signs the helper out everywhere. Tell them in person or by a verified channel.
        </Alert>
        <Field label="New password" htmlFor="reset-password" required hint="At least 10 characters.">
          <Input
            id="reset-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={10}
            maxLength={200}
            autoComplete="new-password"
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
            Reset password
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminHelpersPage() {
  const queryClient = useQueryClient();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    search: '',
    isActive: '',
    isAvailable: '',
  });
  const { categories } = useCatalog();

  const [formOpen, setFormOpen] = useState(false);
  const [editingHelper, setEditingHelper] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [resetFor, setResetFor] = useState(null);
  const [working, setWorking] = useState('');
  const [actionError, setActionError] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin', 'helpers', queryParams],
    queryFn: () => adminApi.helpers.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'helper', selectedId],
    queryFn: () => adminApi.helpers.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };
  const selected = detailQuery.data;

  const refresh = () => {
    listQuery.refetch();
    if (selectedId) detailQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'directory'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const toggleActive = async (helper) => {
    setWorking(`active-${helper.id}`);
    setActionError('');
    try {
      await adminApi.helpers.setActive(helper.id, { isActive: !helper.isActive });
      toast.success(helper.isActive ? 'Helper deactivated' : 'Helper reactivated');
      refresh();
    } catch (error) {
      setActionError(errorMessage(error, 'Could not change helper status.'));
    } finally {
      setWorking('');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Helper',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.name}</p>
          <p className="text-xs text-navy-500">
            {row.employeeCode} · {row.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'availability',
      header: 'Availability',
      cell: (row) => (
        <span
          className={
            row.isAvailable && row.isActive
              ? 'text-xs font-medium text-teal-700'
              : 'text-xs font-medium text-navy-400'
          }
        >
          {!row.isActive ? 'Deactivated' : row.isAvailable ? 'Available' : 'Busy'}
        </span>
      ),
    },
    {
      key: 'categories',
      header: 'Categories',
      cell: (row) => (
        <span className="text-xs text-navy-500">
          {(row.serviceCategoryIds ?? []).length
            ? `${row.serviceCategoryIds.length} qualified`
            : 'Any / unassigned'}
        </span>
      ),
    },
    {
      key: 'rate',
      header: 'Rate',
      align: 'right',
      cell: (row) =>
        row.hourlyRateOverridePkr === null || row.hourlyRateOverridePkr === undefined ? (
          <span className="text-xs text-navy-400">Venue rate</span>
        ) : (
          <span className="text-sm text-navy-700">{row.hourlyRateOverridePkr} /hr</span>
        ),
    },
    {
      key: 'lastLogin',
      header: 'Last sign-in',
      cell: (row) => <span className="text-xs text-navy-500">{row.lastLoginAt ? formatDateTime(row.lastLoginAt) : 'Never'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Helpers"
        description="The venue roster. Deactivation blocks assignment without deleting history."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={refresh} loading={listQuery.isFetching}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingHelper(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add helper
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Search" htmlFor="helper-search" className="min-w-[220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" aria-hidden="true" />
              <Input
                id="helper-search"
                value={filters.search}
                onChange={(event) => setFilter('search', event.target.value)}
                placeholder="Name, phone or employee code"
                className="pl-9"
              />
            </div>
          </FilterField>
          <FilterField label="Account" htmlFor="helper-active">
            <Select id="helper-active" value={filters.isActive} onChange={(event) => setFilter('isActive', event.target.value)}>
              <option value="">All accounts</option>
              <option value="true">Active only</option>
              <option value="false">Deactivated only</option>
            </Select>
          </FilterField>
          <FilterField label="Availability" htmlFor="helper-available">
            <Select
              id="helper-available"
              value={filters.isAvailable}
              onChange={(event) => setFilter('isAvailable', event.target.value)}
            >
              <option value="">Any availability</option>
              <option value="true">Available</option>
              <option value="false">Busy</option>
            </Select>
          </FilterField>
          <Button variant="ghost" size="sm" onClick={reset} disabled={!activeCount}>
            Clear filters
          </Button>
        </FilterBar>
      </Card>

      {actionError ? <Alert tone="danger">{actionError}</Alert> : null}

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
        emptyTitle="No helpers match"
        emptyDescription="Add your first helper to start accepting requests."
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
        title={selected ? selected.name : 'Helper details'}
        description={selected ? `${selected.employeeCode} · ${selected.phone}` : undefined}
        size="md"
      >
        {detailQuery.isLoading ? (
          <p className="py-6 text-sm text-navy-500">Loading helper…</p>
        ) : detailQuery.isError ? (
          <p className="py-6 text-sm text-red-600">{errorMessage(detailQuery.error)}</p>
        ) : selected ? (
          <div className="space-y-4">
            <DetailList
              columns={2}
              items={[
                { label: 'Status', value: selected.isActive ? 'Active' : 'Deactivated' },
                { label: 'Availability', value: selected.isAvailable ? 'Available' : 'Busy' },
                { label: 'Email', value: selected.email || '—' },
                { label: 'Hourly override', value: selected.hourlyRateOverridePkr ?? 'Venue rate' },
                { label: 'Joined', value: formatDateTime(selected.joinedAt) },
                { label: 'Last sign-in', value: selected.lastLoginAt ? formatDateTime(selected.lastLoginAt) : 'Never' },
              ]}
            />

            {selected.notes ? (
              <div className="rounded-xl bg-navy-50 px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Notes</p>
                <p className="mt-1 whitespace-pre-line text-sm text-navy-700">{selected.notes}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditingHelper(selected);
                  setSelectedId(null);
                  setFormOpen(true);
                }}
              >
                Edit details
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setResetFor(selected)}>
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Reset password
              </Button>
              <Button
                size="sm"
                variant={selected.isActive ? 'dangerSoft' : 'success'}
                className="sm:ml-auto"
                loading={working === `active-${selected.id}`}
                onClick={() => toggleActive(selected)}
              >
                {selected.isActive ? (
                  <UserX className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                )}
                {selected.isActive ? 'Deactivate' : 'Reactivate'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <HelperFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        helper={editingHelper}
        categories={categories}
        onSaved={refresh}
      />
      <ResetPasswordModal
        open={Boolean(resetFor)}
        onClose={() => setResetFor(null)}
        helper={resetFor ?? { id: '' }}
        onSaved={refresh}
      />
    </div>
  );
}
