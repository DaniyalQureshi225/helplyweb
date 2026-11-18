'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { toast } from '@/stores/uiStore';
import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui/primitives';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { ConfirmDialog, Modal } from '@/components/ui/overlay';

const emptyForm = {
  code: '',
  name: '',
  line1: '',
  line2: '',
  city: '',
  province: '',
  country: 'Pakistan',
  postalCode: '',
  contactPhone: '',
  lat: '',
  lng: '',
  notes: '',
  isActive: true,
  categoryIds: [],
};

export default function AdminLocationsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const listQuery = useQuery({
    queryKey: ['admin', 'catalog', 'locations'],
    queryFn: () => adminApi.locations.list(),
  });
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'catalog', 'categories'],
    queryFn: () => adminApi.categories.list(),
  });

  const locations = listQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  useEffect(() => {
    if (!formOpen) return;
    setError('');
    setForm(
      editing
        ? {
            code: editing.code ?? '',
            name: editing.name ?? '',
            line1: editing.address?.line1 ?? '',
            line2: editing.address?.line2 ?? '',
            city: editing.address?.city ?? '',
            province: editing.address?.province ?? '',
            country: editing.address?.country ?? 'Pakistan',
            postalCode: editing.address?.postalCode ?? '',
            contactPhone: editing.contactPhone ?? '',
            lat: editing.geo?.coordinates?.[1] !== undefined ? String(editing.geo.coordinates[1]) : '',
            lng: editing.geo?.coordinates?.[0] !== undefined ? String(editing.geo.coordinates[0]) : '',
            notes: editing.notes ?? '',
            isActive: editing.isActive !== false,
            categoryIds: (editing.categoryIds ?? []).map(String),
          }
        : emptyForm,
    );
  }, [formOpen, editing]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'locations'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'catalog'] });
  };

  const toggleCategory = (id, checked) => {
    setForm((previous) => ({
      ...previous,
      categoryIds: checked
        ? [...previous.categoryIds, id]
        : previous.categoryIds.filter((value) => value !== id),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const address = {
      line1: form.line1.trim() || undefined,
      line2: form.line2.trim() || undefined,
      city: form.city.trim() || undefined,
      province: form.province.trim() || undefined,
      country: form.country.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
    };
    const lat = form.lat.trim() === '' ? null : Number(form.lat);
    const lng = form.lng.trim() === '' ? null : Number(form.lng);
    if ((lat === null) !== (lng === null)) {
      setError('Provide both latitude and longitude, or leave both blank.');
      setSaving(false);
      return;
    }
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        address,
        contactPhone: form.contactPhone.trim() || undefined,
        notes: form.notes.trim() || undefined,
        isActive: form.isActive,
        categoryIds: form.categoryIds,
        ...(lat !== null && lng !== null ? { geo: { lat, lng } } : {}),
      };
      if (editing) {
        await adminApi.locations.update(editing.id ?? editing._id, payload);
        toast.success('Location updated');
      } else {
        await adminApi.locations.create(payload);
        toast.success('Location created');
      }
      refresh();
      setFormOpen(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not save this location.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await adminApi.locations.remove(deleteTarget.id ?? deleteTarget._id);
      toast.success('Location deactivated', 'Its QR codes were deactivated too.');
      setDeleteTarget(null);
      refresh();
      queryClient.invalidateQueries({ queryKey: ['admin', 'qr-codes'] });
    } catch (err) {
      toast.error('Could not deactivate this location', errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Locations"
        description="Venues where guests scan a QR code. Locations scope requests, QR codes and helpers."
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
              Add location
            </Button>
          </div>
        }
      />

      <Alert tone="info">
        Deleting a location deactivates it and its QR codes. Historical sessions and bills keep their references.
      </Alert>

      {listQuery.isError ? (
        <Card className="p-4">
          <p className="text-sm text-red-600">{errorMessage(listQuery.error)}</p>
        </Card>
      ) : listQuery.isLoading ? (
        <Card className="p-6 text-sm text-navy-500">Loading locations…</Card>
      ) : locations.length === 0 ? (
        <Card>
          <EmptyState
            icon={MapPin}
            title="No locations yet"
            description="Add the first venue before creating QR codes for guests."
            action={
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add first location
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {locations.map((location) => {
            const id = location.id ?? location._id;
            return (
              <Card key={id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                      <MapPin className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                      <span className="truncate">{location.name}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-navy-400">{location.code}</p>
                  </div>
                  <Badge tone={location.isActive === false ? 'neutral' : 'green'}>
                    {location.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">
                  {[location.address?.line1, location.address?.city, location.address?.province]
                    .filter(Boolean)
                    .join(', ') || 'No address recorded.'}
                </p>
                {location.contactPhone ? (
                  <p className="mt-1 text-xs text-navy-500">Contact {location.contactPhone}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between border-t border-navy-100 pt-3">
                  <span className="text-[11px] uppercase tracking-wider text-navy-400">
                    {(location.categoryIds ?? []).length} categories
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setEditing(location);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                    {location.isActive !== false ? (
                      <Button size="xs" variant="ghost" onClick={() => setDeleteTarget(location)}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Deactivate
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add a location'}
        description="Codes are upper-cased by the backend. Guests never see location codes directly."
        size="lg"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Location name" htmlFor="location-name" required>
              <Input
                id="location-name"
                value={form.name}
                onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                required
                minLength={2}
                maxLength={160}
                placeholder="DHA Phase 6 Club"
              />
            </Field>
            <Field label="Location code" htmlFor="location-code" required hint="Unique, e.g. DHA6.">
              <Input
                id="location-code"
                value={form.code}
                onChange={(event) => setForm((previous) => ({ ...previous, code: event.target.value.toUpperCase() }))}
                required
                minLength={2}
                maxLength={40}
                placeholder="DHA6"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Address line 1" htmlFor="location-line1" className="sm:col-span-2">
              <Input
                id="location-line1"
                value={form.line1}
                onChange={(event) => setForm((previous) => ({ ...previous, line1: event.target.value }))}
                maxLength={300}
                placeholder="Street, building"
              />
            </Field>
            <Field label="Address line 2" htmlFor="location-line2" className="sm:col-span-2">
              <Input
                id="location-line2"
                value={form.line2}
                onChange={(event) => setForm((previous) => ({ ...previous, line2: event.target.value }))}
                maxLength={300}
              />
            </Field>
            <Field label="City" htmlFor="location-city">
              <Input
                id="location-city"
                value={form.city}
                onChange={(event) => setForm((previous) => ({ ...previous, city: event.target.value }))}
                maxLength={100}
              />
            </Field>
            <Field label="Province" htmlFor="location-province">
              <Input
                id="location-province"
                value={form.province}
                onChange={(event) => setForm((previous) => ({ ...previous, province: event.target.value }))}
                maxLength={100}
              />
            </Field>
            <Field label="Country" htmlFor="location-country">
              <Input
                id="location-country"
                value={form.country}
                onChange={(event) => setForm((previous) => ({ ...previous, country: event.target.value }))}
                maxLength={100}
              />
            </Field>
            <Field label="Postal code" htmlFor="location-postal">
              <Input
                id="location-postal"
                value={form.postalCode}
                onChange={(event) => setForm((previous) => ({ ...previous, postalCode: event.target.value }))}
                maxLength={30}
              />
            </Field>
            <Field label="Contact phone" htmlFor="location-phone">
              <Input
                id="location-phone"
                value={form.contactPhone}
                onChange={(event) => setForm((previous) => ({ ...previous, contactPhone: event.target.value }))}
                maxLength={20}
              />
            </Field>
            <Field label="Visibility" htmlFor="location-active">
              <Select
                id="location-active"
                value={form.isActive ? 'true' : 'false'}
                onChange={(event) => setForm((previous) => ({ ...previous, isActive: event.target.value === 'true' }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </Field>
            <Field label="Latitude" htmlFor="location-lat" hint="Optional. Both or neither.">
              <Input
                id="location-lat"
                inputMode="decimal"
                value={form.lat}
                onChange={(event) => setForm((previous) => ({ ...previous, lat: event.target.value }))}
                placeholder="24.8138"
              />
            </Field>
            <Field label="Longitude" htmlFor="location-lng" hint="Optional. Both or neither.">
              <Input
                id="location-lng"
                inputMode="decimal"
                value={form.lng}
                onChange={(event) => setForm((previous) => ({ ...previous, lng: event.target.value }))}
                placeholder="67.0641"
              />
            </Field>
          </div>

          <Field label="Internal notes" htmlFor="location-notes">
            <Textarea
              id="location-notes"
              rows={2}
              maxLength={2000}
              value={form.notes}
              onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))}
            />
          </Field>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
              Services available here
            </p>
            {categories.length === 0 ? (
              <p className="text-sm text-navy-500">Create service categories first.</p>
            ) : (
              <div className="grid gap-1.5 sm:grid-cols-2">
                {categories.map((category) => {
                  const id = String(category.id ?? category._id);
                  return (
                    <Checkbox
                      key={id}
                      label={category.name}
                      checked={form.categoryIds.includes(id)}
                      onChange={(event) => toggleCategory(id, event.target.checked)}
                    />
                  );
                })}
              </div>
            )}
          </div>

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
              {editing ? 'Save changes' : 'Create location'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Deactivate ${deleteTarget?.name ?? 'this location'}?`}
        description="Its QR codes stop working and guests can no longer scan in. Past records remain."
        confirmLabel="Deactivate"
        tone="danger"
        loading={deleting}
      />
    </div>
  );
}
