'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLines,
  FileLock2,
  History,
  Lock,
  LockOpen,
  Play,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { API_BASE_URL } from '@/services/apiClient';
import { errorMessage } from '@/lib/errors';
import { formatBytes, formatDateTime, formatDuration } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Button, Card, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatusBadge } from '@/components/ui/data';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, useAdminFilters, useDirectory } from '@/components/admin/list-utils';

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api(\/v\d+)?\/?$/, '');

function absoluteUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function AdminRecordingsPage() {
  const queryClient = useQueryClient();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    status: '',
    purpose: '',
    helper: '',
    serviceSession: '',
  });
  const { helpers, helperName, customerName } = useDirectory();

  const [selectedId, setSelectedId] = useState(null);
  const [reason, setReason] = useState('');
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdValue, setHoldValue] = useState(true);
  const [holdReason, setHoldReason] = useState('');
  const [savingHold, setSavingHold] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('serviceSession');
    if (sessionParam) setFilter('serviceSession', sessionParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listQuery = useQuery({
    queryKey: ['admin', 'recordings', queryParams],
    queryFn: () => adminApi.recordings.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'recording', selectedId],
    queryFn: () => adminApi.recordings.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const logsQuery = useQuery({
    queryKey: ['admin', 'recording-logs', selectedId],
    queryFn: () => adminApi.recordings.accessLogs(selectedId, { limit: 50 }),
    enabled: Boolean(selectedId) && logsOpen,
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };
  const recording = detailQuery.data?.recording;
  const chunks = detailQuery.data?.chunks ?? [];
  const available = recording && ['FINALIZED', 'ENDED'].includes(recording.status);

  const refresh = () => {
    listQuery.refetch();
    if (selectedId) detailQuery.refetch();
  };

  const openRecording = (row) => {
    setSelectedId(row.id);
    setPlaybackUrl('');
    setReason('');
    setActionError('');
    setLogsOpen(false);
  };

  const requestPlayback = async () => {
    setLoadingUrl(true);
    setActionError('');
    try {
      const result = await adminApi.recordings.playbackUrl(selectedId, reason.trim());
      setPlaybackUrl(absoluteUrl(result.url ?? result.playbackUrl ?? result));
      toast.success('Playback ready', 'This access was logged. The link expires shortly.');
    } catch (error) {
      setActionError(errorMessage(error, 'Could not create a playback link.'));
    } finally {
      setLoadingUrl(false);
    }
  };

  const saveLegalHold = async () => {
    setSavingHold(true);
    setActionError('');
    try {
      await adminApi.recordings.setLegalHold(selectedId, {
        legalHold: holdValue,
        reason: holdReason.trim(),
      });
      toast.success(holdValue ? 'Legal hold applied' : 'Legal hold released', 'Recorded in the audit trail.');
      setHoldOpen(false);
      setHoldReason('');
      refresh();
    } catch (error) {
      setActionError(errorMessage(error, 'Could not update the legal hold.'));
    } finally {
      setSavingHold(false);
    }
  };

  const columns = [
    {
      key: 'recording',
      header: 'Recording',
      cell: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.recordingNumber}</p>
          <p className="text-xs text-navy-500">
            {row.purpose === 'VOICE_FEEDBACK' ? 'Voice feedback' : 'Service recording'} ·{' '}
            {formatDateTime(row.createdAt)}
          </p>
        </div>
      ),
    },
    { key: 'guest', header: 'Guest', cell: (row) => customerName(row.customer) },
    { key: 'helper', header: 'Helper', cell: (row) => helperName(row.helper) },
    {
      key: 'size',
      header: 'Size',
      align: 'right',
      cell: (row) => <span className="text-xs text-navy-500">{formatBytes(row.totalBytes ?? 0)}</span>,
    },
    {
      key: 'retention',
      header: 'Retention until',
      cell: (row) => (
        <span className="text-xs text-navy-500">
          {formatDateTime(row.retentionUntil)}
          {row.legalHold ? (
            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Hold
            </span>
          ) : null}
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Recordings"
        description="Admin-only, consent-gated audio. Every playback requires a reason and is written to an access log."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={listQuery.isFetching}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <Alert tone="info" title="Retention and legal hold">
        Recordings expire on their retention date unless a legal hold is active. Deleted audio cannot be recovered. Never
        download or share a recording outside an authorised review.
      </Alert>

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Status" htmlFor="recording-status">
            <Select id="recording-status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {['PENDING', 'RECORDING', 'ENDED', 'FINALIZED', 'DELETED'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Purpose" htmlFor="recording-purpose">
            <Select id="recording-purpose" value={filters.purpose} onChange={(event) => setFilter('purpose', event.target.value)}>
              <option value="">All purposes</option>
              <option value="SERVICE_RECORDING">Service recording</option>
              <option value="VOICE_FEEDBACK">Voice feedback</option>
            </Select>
          </FilterField>
          <FilterField label="Helper" htmlFor="recording-helper">
            <Select id="recording-helper" value={filters.helper} onChange={(event) => setFilter('helper', event.target.value)}>
              <option value="">All helpers</option>
              {(helpers).map((helper) => (
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
        onRowClick={openRecording}
        getRowId={(row) => row.id}
        emptyTitle="No recordings match"
        emptyDescription="Recordings appear only when both parties consented and the helper started one."
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
        title={recording ? `Recording ${recording.recordingNumber}` : 'Recording details'}
        description={
          recording
            ? `${recording.purpose === 'VOICE_FEEDBACK' ? 'Voice feedback' : 'Service recording'} · ${formatBytes(
                recording.totalBytes ?? 0,
              )}`
            : undefined
        }
        size="lg"
      >
        {detailQuery.isLoading ? (
          <p className="py-6 text-sm text-navy-500">Loading recording…</p>
        ) : detailQuery.isError ? (
          <p className="py-6 text-sm text-red-600">{errorMessage(detailQuery.error)}</p>
        ) : recording ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={recording.status} />
              {recording.legalHold ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Legal hold
                </span>
              ) : null}
              <span className="text-xs text-navy-400">{chunks.length} chunks</span>
            </div>

            <DetailList
              columns={2}
              items={[
                { label: 'Guest', value: customerName(recording.customer) },
                { label: 'Helper', value: helperName(recording.helper) },
                { label: 'Session', value: recording.serviceSession?.slice(-8) ?? '—' },
                { label: 'Format', value: recording.format },
                { label: 'Started', value: recording.startedAt ? formatDateTime(recording.startedAt) : '—' },
                { label: 'Ended', value: recording.endedAt ? formatDateTime(recording.endedAt) : '—' },
                {
                  label: 'Duration',
                  value:
                    recording.startedAt && recording.endedAt
                      ? formatDuration(
                          Math.max(
                            0,
                            Math.round(
                              (new Date(recording.endedAt).getTime() - new Date(recording.startedAt).getTime()) / 1000,
                            ),
                          ),
                        )
                      : '—',
                },
                { label: 'Retention until', value: formatDateTime(recording.retentionUntil) },
              ]}
            />

            {recording.legalHold ? (
              <Alert tone="warning" title="Legal hold active">
                {recording.legalHoldReason || 'No reason recorded.'} This recording will not be deleted while the hold
                remains.
              </Alert>
            ) : null}

            {actionError ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}

            {available ? (
              <div className="rounded-xl border border-navy-100 p-3.5">
                <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                  <Play className="h-4 w-4 text-teal-600" aria-hidden="true" />
                  Playback
                </p>
                <p className="mt-1 text-xs leading-relaxed text-navy-500">
                  A reason is mandatory. The backend issues a short-lived signed URL and logs this access.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    aria-label="Playback reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={1000}
                    placeholder="e.g. Complaint #CMP-204 review"
                    className="flex-1"
                  />
                  <Button size="sm" onClick={requestPlayback} loading={loadingUrl} disabled={reason.trim().length < 3}>
                    <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                    Get playback link
                  </Button>
                </div>
                {playbackUrl ? (
                  <audio controls src={playbackUrl} className="mt-3 w-full">
                    <track kind="captions" />
                  </audio>
                ) : null}
              </div>
            ) : (
              <Alert tone="info" title="Playback unavailable">
                Only finalized or ended recordings can be played. This one is {recording.status.toLowerCase()}.
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={recording.legalHold ? 'secondary' : 'dangerSoft'}
                onClick={() => {
                  setHoldValue(!recording.legalHold);
                  setHoldReason('');
                  setHoldOpen(true);
                }}
              >
                {recording.legalHold ? (
                  <LockOpen className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <FileLock2 className="h-4 w-4" aria-hidden="true" />
                )}
                {recording.legalHold ? 'Release legal hold' : 'Apply legal hold'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setLogsOpen((value) => !value);
                }}
              >
                <History className="h-4 w-4" aria-hidden="true" />
                {logsOpen ? 'Hide access logs' : 'Access logs'}
              </Button>
            </div>

            {logsOpen ? (
              <div className="rounded-xl border border-navy-100">
                <p className="border-b border-navy-100 px-3.5 py-2.5 text-sm font-semibold text-navy-900">
                  Recent access logs
                </p>
                {logsQuery.isLoading ? (
                  <p className="px-3.5 py-3 text-sm text-navy-500">Loading logs…</p>
                ) : (logsQuery.data?.items ?? []).length === 0 ? (
                  <p className="px-3.5 py-3 text-sm text-navy-500">No access has been logged yet.</p>
                ) : (
                  <ul className="divide-y divide-navy-100">
                    {logsQuery.data.items.map((log) => (
                      <li key={log.id} className="px-3.5 py-2.5 text-xs">
                        <p className="font-medium text-navy-800">
                          {log.action?.replace('_', ' ') ?? 'Access'} · {log.actorType ?? 'ADMIN'}
                        </p>
                        <p className="mt-0.5 text-navy-500">
                          {formatDateTime(log.createdAt)}
                          {log.reason ? ` · ${log.reason}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {chunks.length ? (
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                  <AudioLines className="h-4 w-4 text-navy-400" aria-hidden="true" />
                  Chunk manifest
                </p>
                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-navy-100 scrollbar-thin">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-navy-50/60 text-[10px] uppercase tracking-wider text-navy-500">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Size</th>
                        <th className="px-3 py-2">Checksum</th>
                        <th className="px-3 py-2">Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100">
                      {chunks.map((chunk) => (
                        <tr key={chunk.index}>
                          <td className="px-3 py-1.5 text-navy-700">{chunk.index}</td>
                          <td className="px-3 py-1.5 text-navy-600">{formatBytes(chunk.size ?? 0)}</td>
                          <td className="px-3 py-1.5 font-mono text-[10px] text-navy-400">
                            {String(chunk.checksum ?? '').slice(0, 12)}…
                          </td>
                          <td className="px-3 py-1.5 text-navy-500">{formatDateTime(chunk.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={holdOpen}
        onClose={() => setHoldOpen(false)}
        title={holdValue ? 'Apply legal hold' : 'Release legal hold'}
        description="Legal holds prevent scheduled deletion. Reasons are audited and visible to admins only."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setHoldOpen(false)} disabled={savingHold}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={holdValue ? 'danger' : 'primary'}
              onClick={saveLegalHold}
              loading={savingHold}
              disabled={holdReason.trim().length < 3}
            >
              {holdValue ? 'Apply hold' : 'Release hold'}
            </Button>
          </div>
        }
      >
        <Field label="Reason" htmlFor="hold-reason" required hint="At least 3 characters. Stored in the audit log.">
          <Textarea
            id="hold-reason"
            rows={3}
            maxLength={2000}
            value={holdReason}
            onChange={(event) => setHoldReason(event.target.value)}
            placeholder="Legal request, complaint investigation, …"
          />
        </Field>
      </Modal>
    </div>
  );
}
