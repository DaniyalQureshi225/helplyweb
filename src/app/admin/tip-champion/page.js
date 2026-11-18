'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calculator, Crown, Medal, RefreshCw, Trophy, Wallet } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { currentMonthKey, formatDateTime, formatMonthKey, formatPkr } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Button, Card, CardHeader, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatusBadge } from '@/components/ui/data';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';

function monthOptions(count = 12) {
  const options = [];
  const now = new Date();
  for (let index = 0; index < count; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    options.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return options;
}

function candidateName(candidate) {
  return candidate?.helper?.name ?? candidate?.helperName ?? 'Helper';
}

export default function AdminTipChampionPage() {
  const queryClient = useQueryClient();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [preview, setPreview] = useState(null);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [tieOpen, setTieOpen] = useState(false);
  const [tieHelperId, setTieHelperId] = useState('');
  const [tieNote, setTieNote] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [payoutReference, setPayoutReference] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  const currentQuery = useQuery({
    queryKey: ['admin', 'tip-champion', 'current'],
    queryFn: adminApi.tipChampion.current,
  });

  const recordsQuery = useQuery({
    queryKey: ['admin', 'tip-champion', 'records', historyPage],
    queryFn: () => adminApi.tipChampion.list({ page: historyPage, limit: 10 }),
    placeholderData: (previous) => previous,
  });

  const historyQuery = useQuery({
    queryKey: ['admin', 'tip-champion', 'history', historyPage],
    queryFn: () => adminApi.tipChampion.history({ page: historyPage, limit: 10 }),
    placeholderData: (previous) => previous,
  });

  const champion = currentQuery.data;
  const records = recordsQuery.data?.items ?? [];
  const recordsPagination = recordsQuery.data?.pagination ?? { page: 1, totalPages: 0, total: 0 };
  const history = historyQuery.data?.items ?? [];
  const historyPagination = historyQuery.data?.pagination ?? { page: 1, totalPages: 0, total: 0 };

  const championId = champion?.id ?? champion?._id;
  const winnerName = champion?.winnerHelper?.name ?? null;
  const candidates = champion?.candidates ?? [];
  const tiedHelpers = champion?.tie?.tiedHelpers ?? [];
  const tiedCandidates = useMemo(
    () =>
      tiedHelpers.map((helperId) => {
        const match = candidates.find((candidate) => String(candidate.helper?._id ?? candidate.helper?.id ?? candidate.helper) === String(helperId));
        return { id: String(helperId), name: match ? candidateName(match) : `Helper ${String(helperId).slice(-6)}` };
      }),
    [tiedHelpers, candidates],
  );

  useEffect(() => {
    if (tiedCandidates.length && !tieHelperId) setTieHelperId(tiedCandidates[0].id);
  }, [tiedCandidates, tieHelperId]);

  const refresh = () => {
    currentQuery.refetch();
    recordsQuery.refetch();
    historyQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const compute = async () => {
    setWorking('compute');
    setError('');
    try {
      await adminApi.tipChampion.compute(monthKey);
      toast.success('Tip Champion computed', 'Ties still require an admin decision before approval.');
      refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not compute the champion for this month.'));
    } finally {
      setWorking('');
    }
  };

  const loadPreview = async () => {
    setWorking('preview');
    setError('');
    try {
      const result = await adminApi.tipChampion.preview(monthKey);
      setPreview(result);
      toast.info('Preview ready', 'Nothing was saved. Preview only.');
    } catch (err) {
      setError(errorMessage(err, 'Could not preview this month.'));
    } finally {
      setWorking('');
    }
  };

  const approve = async () => {
    setWorking('approve');
    setError('');
    try {
      await adminApi.tipChampion.approve(championId);
      toast.success('Tip Champion approved', 'The record is locked and cannot be recomputed.');
      refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not approve this champion.'));
    } finally {
      setWorking('');
    }
  };

  const resolveTie = async () => {
    setWorking('tie');
    setError('');
    try {
      await adminApi.tipChampion.resolveTie(championId, {
        helperId: tieHelperId,
        note: tieNote.trim() || undefined,
      });
      toast.success('Tie resolved', 'The winner was recorded with your note.');
      setTieOpen(false);
      setTieNote('');
      refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not resolve the tie.'));
    } finally {
      setWorking('');
    }
  };

  const pay = async () => {
    setWorking('pay');
    setError('');
    try {
      await adminApi.tipChampion.pay(championId, payoutReference.trim());
      toast.success('Award paid', 'The payout reference is now on the record.');
      setPayOpen(false);
      setPayoutReference('');
      refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not mark the award paid.'));
    } finally {
      setWorking('');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tip Champion"
        description="One monthly winner from verified tips only. 1st–3rd consecutive wins pay Rs. 5,000; 4th and beyond pay Rs. 7,000."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={currentQuery.isFetching}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <label htmlFor="champion-month" className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-navy-400">
              Month
            </label>
            <Select id="champion-month" value={monthKey} onChange={(event) => setMonthKey(event.target.value)}>
              {monthOptions().map((key) => (
                <option key={key} value={key}>
                  {formatMonthKey(key)}
                </option>
              ))}
            </Select>
          </div>
          <Button size="sm" variant="secondary" onClick={loadPreview} loading={working === 'preview'}>
            <Calculator className="h-4 w-4" aria-hidden="true" />
            Preview (not saved)
          </Button>
          <Button size="sm" onClick={compute} loading={working === 'compute'}>
            <Trophy className="h-4 w-4" aria-hidden="true" />
            Compute month
          </Button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-navy-500">
          Current champion below is for {formatMonthKey(currentMonthKey())}. Computing another month saves a separate
          record. Ties are never broken automatically.
        </p>
      </Card>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader
            title="Current champion"
            description={champion ? formatMonthKey(champion.monthKey) : 'This month'}
            action={
              champion ? (
                <Button variant="ghost" size="sm" onClick={refresh} loading={currentQuery.isFetching}>
                  Refresh
                </Button>
              ) : null
            }
          />
          <div className="px-5 pb-5">
            {currentQuery.isLoading ? (
              <p className="py-8 text-sm text-navy-500">Loading champion…</p>
            ) : currentQuery.isError ? (
              <p className="py-8 text-sm text-red-600">{errorMessage(currentQuery.error)}</p>
            ) : champion ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-navy-950 px-4 py-5 text-white">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-amber-300">
                      <Crown className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-wider text-white/50">Winner</p>
                      <p className="truncate font-display text-lg font-semibold">
                        {winnerName ?? (champion.status === 'TIE' ? 'Tie — decision needed' : 'No eligible winner')}
                      </p>
                    </div>
                    <StatusBadge status={champion.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/40">Verified tips</p>
                      <p className="font-semibold">{formatPkr(champion.winnerTipTotalPkr ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/40">Award</p>
                      <p className="font-semibold text-teal-300">{formatPkr(champion.awardAmountPkr ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/40">Consecutive wins</p>
                      <p className="font-semibold">{champion.consecutiveWins ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/40">Tier</p>
                      <p className="font-semibold">{champion.awardTier ?? '—'}</p>
                    </div>
                  </div>
                </div>

                {champion.status === 'TIE' ? (
                  <Button size="sm" onClick={() => setTieOpen(true)}>
                    <Medal className="h-4 w-4" aria-hidden="true" />
                    Resolve first-place tie
                  </Button>
                ) : null}
                {champion.status === 'PENDING' && winnerName ? (
                  <Button size="sm" onClick={approve} loading={working === 'approve'}>
                    Approve and lock
                  </Button>
                ) : null}
                {champion.status === 'APPROVED' ? (
                  <Button size="sm" variant="success" onClick={() => setPayOpen(true)}>
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    Mark award paid
                  </Button>
                ) : null}
                {champion.status === 'PAID' ? (
                  <Alert tone="success" title="Award paid">
                    {formatPkr(champion.awardAmountPkr)} paid. The record is complete.
                  </Alert>
                ) : null}

                <div>
                  <p className="text-sm font-semibold text-navy-900">Candidate ranking</p>
                  {candidates.length === 0 ? (
                    <p className="mt-2 rounded-xl bg-navy-50 px-3.5 py-3 text-sm text-navy-600">
                      No verified tips for this month yet.
                    </p>
                  ) : (
                    <ol className="mt-2 space-y-1.5">
                      {[...candidates]
                        .sort((a, b) => (b.verifiedTipTotalPkr ?? 0) - (a.verifiedTipTotalPkr ?? 0))
                        .map((candidate, index) => (
                          <li
                            key={String(candidate.helper?._id ?? candidate.helper?.id ?? candidate.helper ?? index)}
                            className="flex items-center justify-between gap-3 rounded-lg border border-navy-100 px-3 py-2 text-sm"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[10px] font-semibold text-white">
                                {index + 1}
                              </span>
                              <span className="truncate text-navy-800">{candidateName(candidate)}</span>
                            </span>
                            <span className="shrink-0 font-semibold text-navy-900">
                              {formatPkr(candidate.verifiedTipTotalPkr ?? 0)}
                            </span>
                          </li>
                        ))}
                    </ol>
                  )}
                </div>
              </div>
            ) : (
              <p className="py-8 text-sm text-navy-500">No champion record yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Preview"
            description="Read-only computation for the selected month."
            action={
              preview ? (
                <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
                  Clear
                </Button>
              ) : null
            }
          />
          <div className="px-5 pb-5">
            {!preview ? (
              <p className="py-8 text-sm text-navy-500">
                Choose a month and select Preview to inspect the outcome without saving.
              </p>
            ) : (
              <div className="space-y-3">
                <DetailList
                  columns={2}
                  items={[
                    { label: 'Month', value: formatMonthKey(preview.monthKey) },
                    { label: 'Status', value: preview.status ?? '—' },
                    {
                      label: 'Projected winner',
                      value:
                        preview.winnerHelper?.name ??
                        preview.winner?.name ??
                        (preview.status === 'TIE' ? 'Tie' : 'No winner'),
                    },
                    { label: 'Award', value: formatPkr(preview.awardAmountPkr ?? 0) },
                    { label: 'Consecutive wins', value: preview.consecutiveWins ?? '—' },
                    {
                      label: 'Verified tips pool',
                      value: formatPkr(preview.computation?.verifiedTipTotalPkr ?? 0),
                    },
                  ]}
                />
                <p className="text-xs text-navy-500">
                  Preview does not create or lock a record. Use Compute month to save.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Monthly records" description="Every computed month, newest first." />
        <DataTable
          columns={[
            { key: 'month', header: 'Month', cell: (row) => formatMonthKey(row.monthKey) },
            {
              key: 'winner',
              header: 'Winner',
              cell: (row) => (row.winnerHelper?.name ? row.winnerHelper.name : row.winner ? String(row.winner).slice(-6) : '—'),
            },
            {
              key: 'tips',
              header: 'Verified tips',
              align: 'right',
              cell: (row) => formatPkr(row.winnerTipTotalPkr ?? 0),
            },
            {
              key: 'award',
              header: 'Award',
              align: 'right',
              cell: (row) => formatPkr(row.awardAmountPkr ?? 0),
            },
            { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
          ]}
          rows={records}
          loading={recordsQuery.isLoading}
          error={recordsQuery.error}
          onRetry={() => recordsQuery.refetch()}
          getRowId={(row) => row.id ?? row._id}
          emptyTitle="No records yet"
          emptyDescription="Compute a month to create the first record."
          footer={
            <Pagination
              page={recordsPagination.page}
              totalPages={recordsPagination.totalPages}
              total={recordsPagination.total}
              limit={10}
              onChange={setHistoryPage}
            />
          }
        />
      </Card>

      <Card>
        <CardHeader title="Streak history" description="Locked winning streaks used to calculate the next award." />
        <DataTable
          columns={[
            { key: 'month', header: 'Month', cell: (row) => formatMonthKey(row.monthKey) },
            { key: 'helper', header: 'Helper', cell: (row) => row.helper?.name ?? '—' },
            { key: 'streak', header: 'Consecutive wins', align: 'center', cell: (row) => row.consecutiveWins ?? '—' },
            { key: 'award', header: 'Award', align: 'right', cell: (row) => formatPkr(row.awardAmountPkr ?? 0) },
          ]}
          rows={history}
          loading={historyQuery.isLoading}
          error={historyQuery.error}
          onRetry={() => historyQuery.refetch()}
          getRowId={(row) => row.id ?? row._id ?? row.monthKey}
          emptyTitle="No streak history yet"
          emptyDescription="History is written when a champion month is locked."
          footer={
            <Pagination
              page={historyPagination.page}
              totalPages={historyPagination.totalPages}
              total={historyPagination.total}
              limit={10}
              onChange={setHistoryPage}
            />
          }
        />
      </Card>

      <Modal
        open={tieOpen}
        onClose={() => setTieOpen(false)}
        title="Resolve first-place tie"
        description="Only an admin can choose between tied helpers. The decision and note are audited."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setTieOpen(false)} disabled={working === 'tie'}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={resolveTie}
              loading={working === 'tie'}
              disabled={!tieHelperId || tieNote.trim().length < 3}
            >
              Record winner
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Field label="Winner" htmlFor="tie-helper" required>
            <Select id="tie-helper" value={tieHelperId} onChange={(event) => setTieHelperId(event.target.value)}>
              {tiedCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Decision note" htmlFor="tie-note" required hint="Explain the basis for the decision.">
            <Textarea
              id="tie-note"
              rows={3}
              maxLength={2000}
              value={tieNote}
              onChange={(event) => setTieNote(event.target.value)}
              placeholder="Why this helper wins the tied month"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Mark award paid"
        description={`${formatPkr(champion?.awardAmountPkr ?? 0)} for ${winnerName ?? 'the winner'}.`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPayOpen(false)} disabled={working === 'pay'}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={pay}
              loading={working === 'pay'}
              disabled={payoutReference.trim().length < 3}
            >
              Confirm payout
            </Button>
          </div>
        }
      >
        <Field label="Payout reference" htmlFor="champion-payout" required>
          <Input
            id="champion-payout"
            value={payoutReference}
            onChange={(event) => setPayoutReference(event.target.value)}
            maxLength={120}
            placeholder="Cash voucher / transfer reference"
          />
        </Field>
      </Modal>
    </div>
  );
}
