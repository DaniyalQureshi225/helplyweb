'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mic, RefreshCw, Star } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { errorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/stores/uiStore';
import { Alert, Button, Card, LinkButton, PageHeader } from '@/components/ui/primitives';
import { DataTable, DetailList, Pagination, StatusBadge } from '@/components/ui/data';
import { Field, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { FilterBar, FilterField, useAdminFilters, useDirectory } from '@/components/admin/list-utils';

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={value <= rating ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400' : 'h-3.5 w-3.5 text-navy-200'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const { filters, setFilter, reset, page, setPage, limit, queryParams, activeCount } = useAdminFilters({
    status: '',
    rating: '',
    helper: '',
    from: '',
    to: '',
  });
  const { helpers, helperName, customerName } = useDirectory();

  const [selectedId, setSelectedId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [working, setWorking] = useState('');
  const [actionError, setActionError] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin', 'reviews', queryParams],
    queryFn: () => adminApi.reviews.list(queryParams),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'review', selectedId],
    queryFn: () => adminApi.reviews.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const rows = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? { page, totalPages: 0, total: 0 };
  const review = detailQuery.data;

  const refresh = () => {
    listQuery.refetch();
    if (selectedId) detailQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const runAction = async (action, call, title) => {
    setWorking(action);
    setActionError('');
    try {
      await call();
      toast.success(title);
      setRejectReason('');
      refresh();
    } catch (error) {
      setActionError(errorMessage(error, 'Could not update this review.'));
    } finally {
      setWorking('');
    }
  };

  const columns = [
    {
      key: 'rating',
      header: 'Rating',
      cell: (row) => (
        <div>
          <Stars rating={row.rating} />
          <p className="mt-1 text-xs text-navy-500">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    { key: 'helper', header: 'Helper', cell: (row) => helperName(row.helper) },
    { key: 'guest', header: 'Guest', cell: (row) => customerName(row.customer) },
    {
      key: 'comment',
      header: 'Comment',
      cell: (row) => (
        <span className="line-clamp-2 max-w-xs text-sm text-navy-600">{row.comment || '—'}</span>
      ),
    },
    {
      key: 'voice',
      header: 'Voice',
      cell: (row) =>
        row.hasVoiceFeedback ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700">
            <Mic className="h-3.5 w-3.5" aria-hidden="true" />
            Attached
          </span>
        ) : (
          <span className="text-xs text-navy-400">None</span>
        ),
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reviews"
        description="Only verified reviews count toward helper incentives. Reject with a reason; nothing is deleted."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={listQuery.isFetching}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <Card className="p-4">
        <FilterBar>
          <FilterField label="Status" htmlFor="review-status">
            <Select id="review-status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">All statuses</option>
              {['PENDING', 'VERIFIED', 'REJECTED'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Rating" htmlFor="review-rating">
            <Select id="review-rating" value={filters.rating} onChange={(event) => setFilter('rating', event.target.value)}>
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} stars
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Helper" htmlFor="review-helper">
            <Select id="review-helper" value={filters.helper} onChange={(event) => setFilter('helper', event.target.value)}>
              <option value="">All helpers</option>
              {helpers.map((helper) => (
                <option key={helper.id} value={helper.id}>
                  {helper.name}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="From" htmlFor="review-from">
            <input id="review-from" type="date" className="input-base" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} />
          </FilterField>
          <FilterField label="To" htmlFor="review-to">
            <input id="review-to" type="date" className="input-base" value={filters.to} onChange={(event) => setFilter('to', event.target.value)} />
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
        emptyTitle="No reviews match"
        emptyDescription="Guests can review once a service is completed."
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
        title={review ? `Review for ${helperName(review.helper)}` : 'Review details'}
        description={review ? `${formatDateTime(review.createdAt)} · ${review.status}` : undefined}
        size="md"
      >
        {detailQuery.isLoading ? (
          <p className="py-6 text-sm text-navy-500">Loading review…</p>
        ) : detailQuery.isError ? (
          <p className="py-6 text-sm text-red-600">{errorMessage(detailQuery.error)}</p>
        ) : review ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-navy-50 px-4 py-3">
              <Stars rating={review.rating} />
              <p className="mt-2 whitespace-pre-line break-words text-sm text-navy-800">
                {review.comment || 'No written comment.'}
              </p>
            </div>

            <DetailList
              columns={2}
              items={[
                { label: 'Guest', value: customerName(review.customer) },
                { label: 'Helper', value: helperName(review.helper) },
                { label: 'Status', value: review.status },
                { label: 'Verified via', value: review.verificationMethod ?? '—' },
                { label: 'Voice note', value: review.hasVoiceFeedback ? 'Attached' : 'None' },
                { label: 'Session', value: String(review.serviceSession ?? '').slice(-8) || '—' },
              ]}
            />

            {review.rejectedReason ? (
              <Alert tone="warning" title="Rejected">
                {review.rejectedReason}
              </Alert>
            ) : null}
            {review.adminNote ? (
              <div className="rounded-xl bg-navy-50 px-3.5 py-3 text-sm text-navy-700">{review.adminNote}</div>
            ) : null}

            {actionError ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}

            {review.hasVoiceFeedback ? (
              <LinkButton
                href={`/admin/recordings?serviceSession=${review.serviceSession}`}
                size="sm"
                variant="secondary"
                onClick={() => setSelectedId(null)}
              >
                <Mic className="h-4 w-4" aria-hidden="true" />
                Review voice note in Recordings
              </LinkButton>
            ) : null}

            {review.status === 'PENDING' ? (
              <div className="space-y-3 rounded-xl border border-navy-100 p-3.5">
                <p className="text-sm font-semibold text-navy-900">Moderate this review</p>
                <p className="text-xs leading-relaxed text-navy-500">
                  Verifying counts this review toward the helper&apos;s five-star and one-star rules. Only verify when the
                  service record supports it.
                </p>
                <Button
                  size="sm"
                  loading={working === 'verify'}
                  onClick={() => runAction('verify', () => adminApi.reviews.verify(review.id), 'Review verified')}
                >
                  Verify review
                </Button>
                <div className="border-t border-navy-100 pt-3">
                  <Field label="Rejection reason" htmlFor="review-reject" hint="Kept for the audit trail.">
                    <Textarea
                      id="review-reject"
                      rows={2}
                      maxLength={1000}
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      placeholder="Why this review cannot be verified"
                    />
                  </Field>
                  <Button
                    size="sm"
                    variant="dangerSoft"
                    className="mt-2"
                    disabled={rejectReason.trim().length < 3}
                    loading={working === 'reject'}
                    onClick={() =>
                      runAction(
                        'reject',
                        () => adminApi.reviews.reject(review.id, rejectReason.trim()),
                        'Review rejected',
                      )
                    }
                  >
                    Reject review
                  </Button>
                </div>
              </div>
            ) : null}

            <Link
              href={`/admin/sessions?session=${review.serviceSession}`}
              className="link-subtle inline-flex text-sm"
            >
              Open the service session
            </Link>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
