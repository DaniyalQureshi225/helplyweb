'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { toast } from '@/stores/uiStore';
import { Alert, Button, Card, EmptyState, PageHeader } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/primitives';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { ConfirmDialog, Modal } from '@/components/ui/overlay';

const emptyForm = { name: '', slug: '', description: '', sortOrder: '0', isActive: true };

export default function AdminServicesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const listQuery = useQuery({
    queryKey: ['admin', 'catalog', 'categories'],
    queryFn: () => adminApi.categories.list(),
  });

  const categories = listQuery.data ?? [];

  useEffect(() => {
    if (!formOpen) return;
    setError('');
    setForm(
      editing
        ? {
            name: editing.name ?? '',
            slug: editing.slug ?? '',
            description: editing.description ?? '',
            sortOrder: String(editing.sortOrder ?? 0),
            isActive: editing.isActive !== false,
          }
        : emptyForm,
    );
  }, [formOpen, editing]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'categories'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'catalog'] });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const sortOrder = Number.parseInt(form.sortOrder || '0', 10);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
        isActive: form.isActive,
        ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      };
      if (editing) {
        await adminApi.categories.update(editing.id ?? editing._id, payload);
        toast.success('Service updated');
      } else {
        await adminApi.categories.create(payload);
        toast.success('Service created');
      }
      refresh();
      setFormOpen(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not save this service.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await adminApi.categories.remove(deleteTarget.id ?? deleteTarget._id);
      toast.success('Service deactivated', 'Existing history remains intact.');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error('Could not deactivate this service', errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Service categories"
        description="Categories shown on the QR guest app. Guests pick one when requesting help."
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
              Add service
            </Button>
          </div>
        }
      />

      <Alert tone="info">
        Deactivating a category hides it from new guests but keeps it on historical requests, sessions and bills.
      </Alert>

      {listQuery.isError ? (
        <Card className="p-4">
          <p className="text-sm text-red-600">{errorMessage(listQuery.error)}</p>
        </Card>
      ) : listQuery.isLoading ? (
        <Card className="p-6 text-sm text-navy-500">Loading services…</Card>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={Sparkles}
            title="No service categories yet"
            description="Add categories like Front desk help, Luggage assistance or Accessibility support."
            action={
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add first service
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id ?? category._id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                    <Layers className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                    <span className="truncate">{category.name}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-navy-400">/{category.slug}</p>
                </div>
                <Badge tone={category.isActive === false ? 'neutral' : 'green'}>
                  {category.isActive === false ? 'Inactive' : 'Active'}
                </Badge>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-navy-600">
                {category.description || 'No description yet.'}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-navy-100 pt-3">
                <span className="text-[11px] uppercase tracking-wider text-navy-400">Order {category.sortOrder ?? 0}</span>
                <div className="flex gap-1">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit
                  </Button>
                  {category.isActive !== false ? (
                    <Button size="xs" variant="ghost" onClick={() => setDeleteTarget(category)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Deactivate
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add a service category'}
        description="Guests see the name and description on the QR request screen."
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" htmlFor="service-name" required>
            <Input
              id="service-name"
              value={form.name}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
              required
              minLength={2}
              maxLength={120}
              placeholder="Luggage assistance"
            />
          </Field>
          <Field label="Slug" htmlFor="service-slug" hint="Optional. Generated by the backend when blank.">
            <Input
              id="service-slug"
              value={form.slug}
              onChange={(event) => setForm((previous) => ({ ...previous, slug: event.target.value }))}
              maxLength={120}
              placeholder="luggage-assistance"
            />
          </Field>
          <Field label="Description" htmlFor="service-description">
            <Textarea
              id="service-description"
              rows={3}
              maxLength={1000}
              value={form.description}
              onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
              placeholder="Short, guest-friendly description"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sort order" htmlFor="service-order" hint="Lower appears first.">
              <Input
                id="service-order"
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, sortOrder: event.target.value.replace(/[^\d]/g, '') }))
                }
              />
            </Field>
            <Field label="Visibility" htmlFor="service-active">
              <Select
                id="service-active"
                value={form.isActive ? 'true' : 'false'}
                onChange={(event) => setForm((previous) => ({ ...previous, isActive: event.target.value === 'true' }))}
              >
                <option value="true">Active — visible to guests</option>
                <option value="false">Inactive — hidden</option>
              </Select>
            </Field>
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
              {editing ? 'Save changes' : 'Create service'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Deactivate ${deleteTarget?.name ?? 'this service'}?`}
        description="It disappears from the guest app for new requests. History and pricing stay untouched."
        confirmLabel="Deactivate"
        tone="danger"
        loading={deleting}
      />
    </div>
  );
}
