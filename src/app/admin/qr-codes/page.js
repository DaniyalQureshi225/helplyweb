'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  Download,
  ExternalLink,
  Pencil,
  Plus,
  QrCode as QrCodeIcon,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Badge, Button, Card, PageHeader } from '@/components/ui/primitives';
import { DataTable, Pagination } from '@/components/ui/data';
import { Field, Input, Select } from '@/components/ui/form';
import { ConfirmDialog, Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, useAdminFilters, useCatalog } from '@/components/admin/list-utils';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

const emptyForm = { code: '', label: '', locationId: '', expiresAt: '' };

export default function AdminQrCodesPage() {
  const queryClient = useQueryClient();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    location: '',
    isActive: '',
  });
  const { locations, locationName } = useCatalog();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [qrTarget, setQrTarget] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const listQuery = useQuery({
    queryKey: ['admin', 'qr-codes', queryParams],
    queryFn: () => adminApi.qrCodes.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };

  const guestUrl = (code) =>
    `${APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/customer/${encodeURIComponent(
      code ?? '',
    )}`;

  useEffect(() => {
    if (!formOpen) return;
    setError('');
    setForm(
      editing
        ? {
            code: editing.code ?? '',
            label: editing.label ?? '',
            locationId: String(editing.location ?? ''),
            expiresAt: editing.expiresAt ? new Date(editing.expiresAt).toISOString().slice(0, 10) : '',
          }
        : {
            ...emptyForm,
            locationId: filters.location || '',
          },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen, editing]);

  useEffect(() => {
    let cancelled = false;
    if (!qrTarget) {
      setQrImage('');
      return () => {};
    }
    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(guestUrl(qrTarget.code), {
          width: 512,
          margin: 2,
          color: { dark: '#10233D', light: '#FFFFFF' },
        });
        if (!cancelled) setQrImage(url);
      } catch {
        if (!cancelled) setQrImage('');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrTarget]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'qr-codes'] });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await adminApi.qrCodes.update(editing.id ?? editing._id, {
          label: form.label.trim() || null,
          expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
        });
        toast.success('QR code updated');
      } else {
        await adminApi.qrCodes.create({
          code: form.code.trim(),
          label: form.label.trim() || undefined,
          locationId: form.locationId,
          expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : undefined,
        });
        toast.success('QR code created', 'Print and place it where guests can scan it.');
      }
      refresh();
      setFormOpen(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not save this QR code.'));
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    setDeleting(true);
    try {
      await adminApi.qrCodes.remove(deleteTarget.id ?? deleteTarget._id);
      toast.success('QR code deactivated', 'Guests scanning it will see an invalid code message.');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error('Could not deactivate this QR code', errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (row) => {
    try {
      await adminApi.qrCodes.update(row.id, { isActive: !row.isActive });
      toast.success(row.isActive ? 'QR code paused' : 'QR code reactivated');
      refresh();
    } catch (err) {
      toast.error('Could not update this QR code', errorMessage(err));
    }
  };

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(guestUrl(code));
      toast.success('Guest link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'QR code',
      cell: (row) => (
        <div>
          <p className="font-mono text-sm font-semibold text-navy-900">{row.code}</p>
          <p className="text-xs text-navy-500">{row.label || 'No label'}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (row) => <span className="text-sm text-navy-700">{locationName(row.location)}</span>,
    },
    {
      key: 'expiry',
      header: 'Expires',
      cell: (row) => (
        <span className="text-xs text-navy-500">{row.expiresAt ? formatDateTime(row.expiresAt) : 'Never'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge
          tone={
            !row.isActive ? 'neutral' : row.expiresAt && new Date(row.expiresAt) < new Date() ? 'amber' : 'green'
          }
        >
          {!row.isActive ? 'Paused' : row.expiresAt && new Date(row.expiresAt) < new Date() ? 'Expired' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="xs" variant="ghost" onClick={() => setQrTarget(row)} aria-label={`Show QR for ${row.code}`}>
            <QrCodeIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button size="xs" variant="ghost" onClick={() => copy(row.code)} aria-label={`Copy link for ${row.code}`}>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setEditing(row);
              setFormOpen(true);
            }}
            aria-label={`Edit ${row.code}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button size="xs" variant="ghost" onClick={() => toggleActive(row)}>
            {row.isActive ? 'Pause' : 'Resume'}
          </Button>
          {row.isActive ? (
            <Button size="xs" variant="ghost" onClick={() => setDeleteTarget(row)} aria-label={`Deactivate ${row.code}`}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="QR codes"
        description="Each code opens the guest app for one location. Codes can be paused or given an expiry date."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={refresh} loading={listQuery.isFetching}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create QR code
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Location" htmlFor="qr-location">
            <Select id="qr-location" value={filters.location} onChange={(event) => setFilter('location', event.target.value)}>
              <option value="">All locations</option>
              {locations.map((location) => (
                <option key={location.id ?? location._id} value={String(location.id ?? location._id)}>
                  {location.name}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Status" htmlFor="qr-active">
            <Select id="qr-active" value={filters.isActive} onChange={(event) => setFilter('isActive', event.target.value)}>
              <option value="">All codes</option>
              <option value="true">Active</option>
              <option value="false">Paused</option>
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
        getRowId={(row) => row.id}
        emptyTitle="No QR codes yet"
        emptyDescription="Create a code for each entrance or help desk."
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

      <Alert tone="info" title="Print and placement">
        Print codes at least 4×4 cm in a well-lit spot. Pause a code instead of deleting it so the audit history stays
        complete. Never publish a raw guest link where it can be reused outside the venue.
      </Alert>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.code}` : 'Create a QR code'}
        description={editing ? 'The code itself is immutable. Pausing blocks guest check-ins.' : 'Codes are unique and upper-cased.'}
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="QR code" htmlFor="qr-code-input" required>
            <Input
              id="qr-code-input"
              value={form.code}
              onChange={(event) => setForm((previous) => ({ ...previous, code: event.target.value.toUpperCase() }))}
              required
              minLength={3}
              maxLength={120}
              disabled={Boolean(editing)}
              placeholder="DHA6-FRONT-DESK"
              className="font-mono"
            />
          </Field>
          <Field label="Label" htmlFor="qr-label" hint="Where will this be placed?">
            <Input
              id="qr-label"
              value={form.label}
              onChange={(event) => setForm((previous) => ({ ...previous, label: event.target.value }))}
              maxLength={120}
              placeholder="Main entrance"
            />
          </Field>
          <Field label="Location" htmlFor="qr-location-input" required>
            <Select
              id="qr-location-input"
              value={form.locationId}
              onChange={(event) => setForm((previous) => ({ ...previous, locationId: event.target.value }))}
              required
              disabled={Boolean(editing)}
            >
              <option value="">Choose a location</option>
              {locations.map((location) => (
                <option key={location.id ?? location._id} value={String(location.id ?? location._id)}>
                  {location.name} ({location.code})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expires on" htmlFor="qr-expires" hint="Optional. Leave blank for no expiry.">
            <Input
              id="qr-expires"
              type="date"
              value={form.expiresAt}
              onChange={(event) => setForm((previous) => ({ ...previous, expiresAt: event.target.value }))}
            />
          </Field>

          {error ? (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {editing ? 'Save changes' : 'Create QR code'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(qrTarget)}
        onClose={() => setQrTarget(null)}
        title={qrTarget ? `QR code ${qrTarget.code}` : 'QR code'}
        description="Guests scan this to open the HELPY guest app for the location."
        size="sm"
      >
        <div className="flex flex-col items-center gap-3">
          {qrImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrImage}
              alt={`QR code for ${qrTarget?.code}`}
              className="h-56 w-56 rounded-xl border border-navy-100"
            />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-navy-50 text-sm text-navy-500">
              Generating…
            </div>
          )}
          <p className="break-all text-center font-mono text-xs text-navy-500">
            {qrTarget ? guestUrl(qrTarget.code) : ''}
          </p>
          <div className="flex w-full flex-wrap justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => copy(qrTarget?.code)}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy link
            </Button>
            {qrImage ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrImage;
                  link.download = `helpy-qr-${qrTarget?.code}.png`;
                  link.click();
                }}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download PNG
              </Button>
            ) : null}
          </div>
          {qrTarget ? (
            <Link
              href={`/customer/${qrTarget.code}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 underline-offset-4 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Preview guest view
            </Link>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deactivate}
        title="Deactivate this QR code?"
        description="Scans stop working immediately. You can create a replacement code at any time."
        confirmLabel="Deactivate"
        tone="danger"
        loading={deleting}
      />
    </div>
  );
}
