'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { ADMIN_ROLES } from '@/lib/constants';
import { humanizeKey } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/uiStore';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Tabs } from '@/components/ui/data';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';

const CATEGORY_LABELS = {
  general: 'General',
  billing: 'Billing & pricing',
  compensation: 'Compensation',
  reviews: 'Reviews',
  attendance: 'Attendance',
  complaints: 'Complaints',
  incentives: 'Incentives',
  recording: 'Recording & uploads',
  security: 'Security & authentication',
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [tab, setTab] = useState('settings');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', password: '', role: 'ADMIN' });
  const [adminWorking, setAdminWorking] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.settings.list,
    staleTime: 60_000,
  });

  const adminsQuery = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: adminApi.admins.list,
    enabled: isSuperAdmin && tab === 'admins',
    staleTime: 60_000,
  });

  const settings = settingsQuery.data ?? [];
  const categories = useMemo(() => [...new Set(settings.map((item) => item.category ?? 'general'))], [settings]);
  const visibleSettings = category === 'all' ? settings : settings.filter((item) => (item.category ?? 'general') === category);
  const admins = adminsQuery.data ?? [];

  useEffect(() => {
    if (!editing) return;
    setJsonText(JSON.stringify(editing.value ?? {}, null, 2));
    setError('');
  }, [editing]);

  const refresh = () => {
    settingsQuery.refetch();
    adminsQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const saveSetting = async (event) => {
    event.preventDefault();
    let value;
    try {
      value = JSON.parse(jsonText);
    } catch {
      setError('The value must be valid JSON.');
      return;
    }
    if (value === undefined) {
      setError('A value is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await adminApi.settings.update(editing.key, value);
      toast.success('Setting updated', 'The new value took effect immediately on the backend.');
      setEditing(null);
      refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not update this setting.'));
    } finally {
      setSaving(false);
    }
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    setAdminWorking(true);
    setError('');
    try {
      await adminApi.admins.create({
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        phone: adminForm.phone.trim() || undefined,
        password: adminForm.password,
        role: adminForm.role,
      });
      toast.success('Administrator created', 'Share sign-in details securely.');
      setAdminOpen(false);
      setAdminForm({ name: '', email: '', phone: '', password: '', role: 'ADMIN' });
      adminsQuery.refetch();
    } catch (err) {
      setError(errorMessage(err, 'Could not create this administrator.'));
    } finally {
      setAdminWorking(false);
    }
  };

  const toggleAdmin = async (admin) => {
    setAdminWorking(true);
    setError('');
    try {
      await adminApi.admins.setActive(admin.id ?? admin._id, { isActive: !admin.isActive });
      toast.success(admin.isActive ? 'Administrator deactivated' : 'Administrator activated');
      adminsQuery.refetch();
    } catch (err) {
      setError(errorMessage(err, 'Could not change administrator status.'));
    } finally {
      setAdminWorking(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Backend-owned configuration. Changes here take effect for the guest app, staff console and automated rules immediately."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={settingsQuery.isFetching}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <Tabs
        tabs={[
          { value: 'settings', label: 'System settings' },
          ...(isSuperAdmin ? [{ value: 'admins', label: 'Administrators' }] : []),
        ]}
        value={tab}
        onChange={setTab}
      />

      {error && tab !== 'settings' ? <Alert tone="danger">{error}</Alert> : null}

      {tab === 'settings' ? (
        <div className="space-y-4">
          <Alert tone="warning" title="Legal review required">
            Recording, privacy and terms text is policy content. Confirm final wording with venue legal counsel before
            production use; the console records configuration, not legal approval.
          </Alert>

          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button size="xs" variant={category === 'all' ? 'primary' : 'ghost'} onClick={() => setCategory('all')}>
                All ({settings.length})
              </Button>
              {categories.map((item) => (
                <Button key={item} size="xs" variant={category === item ? 'primary' : 'ghost'} onClick={() => setCategory(item)}>
                  {CATEGORY_LABELS[item] ?? humanizeKey(item)}
                </Button>
              ))}
            </div>
          </Card>

          {settingsQuery.isLoading ? (
            <Card className="p-8 text-center text-sm text-navy-500">Loading settings…</Card>
          ) : settingsQuery.isError ? (
            <Alert tone="danger">{errorMessage(settingsQuery.error)}</Alert>
          ) : visibleSettings.length === 0 ? (
            <Card>
              <EmptyState icon={LockKeyhole} title="No settings in this group" description="Settings are seeded by the backend on first run." />
            </Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleSettings.map((item) => (
                <Card key={item.key} className="flex flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all font-mono text-sm font-semibold text-navy-900">{item.key}</p>
                      <p className="mt-1 text-xs leading-relaxed text-navy-500">{item.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={item.isPublic ? 'teal' : 'neutral'}>{item.isPublic ? 'Public' : 'Internal'}</Badge>
                      <span className="text-[11px] text-navy-400">v{item.version ?? 1}</span>
                    </div>
                  </div>
                  <pre className="mt-3 max-h-44 flex-1 overflow-auto rounded-xl bg-navy-950 px-3.5 py-3 text-[11px] leading-relaxed text-teal-200 scrollbar-thin">
                    {JSON.stringify(item.value ?? {}, null, 2)}
                  </pre>
                  <div className="mt-3 flex items-center justify-between border-t border-navy-100 pt-3">
                    <span className="text-[11px] uppercase tracking-wider text-navy-400">{item.persisted ? 'Persisted' : 'Default'}</span>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => {
                        setError('');
                        setEditing(item);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit JSON
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'admins' && isSuperAdmin ? (
        <div className="space-y-4">
          <Alert tone="info" title="Super admin only">
            Administrator accounts are not available to regular admins. You cannot deactivate your own account.
          </Alert>

          {error ? <Alert tone="danger">{error}</Alert> : null}

          <Card>
            <CardHeader
              title="Administrator accounts"
              description="Staff who can access this console. Roles: SUPER_ADMIN and ADMIN."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setError('');
                    setAdminOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add administrator
                </Button>
              }
            />
            <DataTable
              columns={[
                {
                  key: 'name',
                  header: 'Administrator',
                  cell: (row) => (
                    <div>
                      <p className="font-semibold text-navy-900">{row.name}</p>
                      <p className="text-xs text-navy-500">{row.email}</p>
                    </div>
                  ),
                },
                { key: 'role', header: 'Role', cell: (row) => <Badge tone={row.role === 'SUPER_ADMIN' ? 'navy' : 'neutral'}>{row.role}</Badge> },
                { key: 'phone', header: 'Phone', cell: (row) => <span className="text-sm text-navy-600">{row.phone || '—'}</span> },
                {
                  key: 'status',
                  header: 'Status',
                  cell: (row) => <Badge tone={row.isActive === false ? 'red' : 'green'}>{row.isActive === false ? 'Inactive' : 'Active'}</Badge>,
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  align: 'right',
                  cell: (row) => {
                    const self = String(row.id ?? row._id) === String(user?.id);
                    return (
                      <Button
                        size="xs"
                        variant={row.isActive === false ? 'success' : 'dangerSoft'}
                        disabled={self || adminWorking}
                        onClick={() => toggleAdmin(row)}
                      >
                        {row.isActive === false ? <UserCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <UserX className="h-3.5 w-3.5" aria-hidden="true" />}
                        {self ? 'You' : row.isActive === false ? 'Activate' : 'Deactivate'}
                      </Button>
                    );
                  },
                },
              ]}
              rows={admins}
              loading={adminsQuery.isLoading}
              error={adminsQuery.error}
              onRetry={() => adminsQuery.refetch()}
              getRowId={(row) => row.id ?? row._id}
              emptyTitle="No administrators"
              emptyDescription="Add another administrator to share console access."
            />
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-navy-900">Your session</p>
            <DetailList
              className="mt-3"
              columns={2}
              items={[
                { label: 'Name', value: user?.name ?? '—' },
                { label: 'Email', value: user?.email ?? '—' },
                { label: 'Role', value: user?.role ?? '—' },
                { label: 'User ID', value: user?.id ? String(user.id).slice(-8) : '—' },
              ]}
            />
          </Card>
        </div>
      ) : null}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.key ?? 'setting'}`}
        description="The backend merges this object into the existing value. Provide the complete object you want stored."
        size="lg"
      >
        <form onSubmit={saveSetting} className="space-y-4">
          {editing?.description ? <Alert tone="info">{editing.description}</Alert> : null}
          <Field label="Value (JSON)" htmlFor="setting-json" required hint="Numbers must be whole PKR amounts where the setting expects money.">
            <Textarea
              id="setting-json"
              rows={14}
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              spellCheck={false}
              className="font-mono text-xs"
              required
            />
          </Field>
          {error ? (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save setting
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        title="Add administrator"
        description="Creates a staff account with console access. Share credentials through a secure channel."
        size="md"
      >
        <form onSubmit={createAdmin} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" htmlFor="admin-name" required>
              <Input id="admin-name" value={adminForm.name} onChange={(event) => setAdminForm((p) => ({ ...p, name: event.target.value }))} required minLength={2} maxLength={120} />
            </Field>
            <Field label="Email" htmlFor="admin-email" required>
              <Input id="admin-email" type="email" value={adminForm.email} onChange={(event) => setAdminForm((p) => ({ ...p, email: event.target.value }))} required maxLength={200} />
            </Field>
            <Field label="Phone" htmlFor="admin-phone">
              <Input id="admin-phone" value={adminForm.phone} onChange={(event) => setAdminForm((p) => ({ ...p, phone: event.target.value }))} maxLength={20} />
            </Field>
            <Field label="Role" htmlFor="admin-role" required>
              <Select id="admin-role" value={adminForm.role} onChange={(event) => setAdminForm((p) => ({ ...p, role: event.target.value }))}>
                {ADMIN_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replaceAll('_', ' ')}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Temporary password" htmlFor="admin-password" required hint="At least 10 characters. The backend enforces strength rules.">
            <Input
              id="admin-password"
              type="password"
              value={adminForm.password}
              onChange={(event) => setAdminForm((p) => ({ ...p, password: event.target.value }))}
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
            <Button type="button" variant="secondary" size="sm" onClick={() => setAdminOpen(false)} disabled={adminWorking}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={adminWorking}>
              <Shield className="h-4 w-4" aria-hidden="true" />
              Create administrator
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
