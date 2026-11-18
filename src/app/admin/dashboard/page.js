'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  HandCoins,
  MessageSquareWarning,
  RefreshCw,
  Star,
  Timer,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi } from '@/services/adminApi';
import { currentMonthKey, formatDateTime, formatMonthKey, formatNumber, formatPkr } from '@/lib/utils';
import { STATUS_LABELS } from '@/lib/constants';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LinkButton,
  PageHeader,
  Skeleton,
} from '@/components/ui/primitives';
import { StatCard, StatusBadge } from '@/components/ui/data';

const CHART_COLORS = ['#12AC90', '#10233D', '#456894', '#F59E0B', '#E4572E', '#6787B5'];

function ChartCard({ title, description, children, action, loading }) {
  return (
    <Card>
      <CardHeader title={title} description={description} action={action} />
      <div className="px-4 pb-4 pt-1 sm:px-5">
        {loading ? <Skeleton className="h-56 w-full" /> : children}
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const monthKey = currentMonthKey();
  const dashboardQuery = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard });
  const financialQuery = useQuery({
    queryKey: ['admin', 'report', 'financial', monthKey],
    queryFn: () => adminApi.financialReport({ monthKey }),
  });
  const operationalQuery = useQuery({
    queryKey: ['admin', 'report', 'operational', monthKey],
    queryFn: () => adminApi.operationalReport({ monthKey }),
  });

  const data = dashboardQuery.data;
  const financial = financialQuery.data;
  const operational = operationalQuery.data;
  const outstanding = Array.isArray(financial?.outstanding) ? financial.outstanding[0] ?? {} : financial?.outstanding ?? {};

  const paymentChart = (financial?.payments ?? []).map((row) => ({
    name: row.method.replace('_', ' '),
    amount: row.totalPkr,
    count: row.count,
  }));

  const billStatusChart = Object.entries(financial?.bills?.byStatus ?? {}).map(([status, value]) => ({
    name: status,
    amount: value.totalPkr,
    count: value.count,
  }));

  const sessionStatusChart = Object.entries(operational?.sessions?.byStatus ?? {}).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status,
    count,
  }));

  const ratingChart = [1, 2, 3, 4, 5].map((rating) => ({
    name: `${rating}★`,
    count: operational?.ratings?.[rating] ?? 0,
  }));

  const refreshAll = () => {
    dashboardQuery.refetch();
    financialQuery.refetch();
    operationalQuery.refetch();
  };

  const refreshing =
    dashboardQuery.isFetching || financialQuery.isFetching || operationalQuery.isFetching;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`Today · ${formatMonthKey(monthKey)}`}
        title="Operations overview"
        description="Live queue, revenue and everything waiting for a human decision."
        actions={
          <Button variant="secondary" size="sm" onClick={refreshAll} loading={refreshing}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {dashboardQuery.isError ? (
        <ErrorState error={dashboardQuery.error} title="Dashboard unavailable" onRetry={() => dashboardQuery.refetch()} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Waiting requests"
          value={dashboardQuery.isLoading ? '—' : formatNumber(data?.requests?.waiting)}
          hint={`${formatNumber(data?.requests?.active)} active in total`}
          icon={ClipboardList}
          href="/admin/requests?status=CREATED"
          tone="amber"
        />
        <StatCard
          label="Services in progress"
          value={dashboardQuery.isLoading ? '—' : formatNumber(data?.sessions?.active)}
          hint={`${formatNumber(data?.sessions?.completedToday)} completed today`}
          icon={Timer}
          href="/admin/sessions?status=IN_PROGRESS"
          tone="teal"
        />
        <StatCard
          label="Revenue today"
          value={dashboardQuery.isLoading ? '—' : formatPkr(data?.revenue?.todayPkr ?? 0)}
          hint={`${formatNumber(data?.revenue?.billsToday)} bills generated`}
          icon={CircleDollarSign}
          href="/admin/reports"
          tone="navy"
        />
        <StatCard
          label="Active helpers"
          value={dashboardQuery.isLoading ? '—' : formatNumber(data?.helpers?.active)}
          hint={`${formatNumber(data?.helpers?.total)} on the roster`}
          icon={Users}
          href="/admin/helpers"
          tone="teal"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending payments"
          value={dashboardQuery.isLoading ? '—' : formatPkr(data?.pending?.paymentsPkr ?? 0)}
          hint={`${formatNumber(data?.pending?.paymentsCount)} awaiting verification`}
          icon={CreditCard}
          href="/admin/payments?status=PENDING"
          tone="amber"
        />
        <StatCard
          label="Unverified tips"
          value={dashboardQuery.isLoading ? '—' : formatPkr(data?.pending?.tipsPkr ?? 0)}
          hint={`${formatNumber(data?.pending?.tipsCount)} tips to review`}
          icon={HandCoins}
          href="/admin/tips?status=PENDING"
          tone="amber"
        />
        <StatCard
          label="Open complaints"
          value={dashboardQuery.isLoading ? '—' : formatNumber(data?.complaints?.open)}
          hint="Open or under review"
          icon={MessageSquareWarning}
          href="/admin/complaints"
          tone="red"
        />
        <StatCard
          label="Recordings held"
          value={dashboardQuery.isLoading ? '—' : formatNumber(data?.recordings?.active)}
          hint="Admin-only, consent-gated"
          icon={BadgeCheck}
          href="/admin/recordings"
          tone="navy"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <ChartCard
          title="Confirmed payments by method"
          description={`${formatMonthKey(monthKey)} · verified collections only`}
          loading={financialQuery.isLoading}
          action={
            <LinkButton href="/admin/reports" size="sm" variant="ghost">
              Full report
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </LinkButton>
          }
        >
          {paymentChart.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E9F3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#61728A' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#61728A' }} axisLine={false} tickLine={false} tickFormatter={(value) => formatPkr(value, { compact: true })} />
                  <Tooltip
                    formatter={(value, name) => [name === 'amount' ? formatPkr(value) : value, name === 'amount' ? 'Collected' : 'Count']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E2E9F3', fontSize: 12 }}
                  />
                  <Bar dataKey="amount" fill="#12AC90" radius={[6, 6, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Banknote}
              title="No confirmed payments this month"
              description="Confirmed cash and digital payments will be charted here."
              className="py-10"
            />
          )}
        </ChartCard>

        <ChartCard
          title="Service status mix"
          description={`${formatNumber(operational?.sessions?.total)} sessions this month`}
          loading={operationalQuery.isLoading}
        >
          {sessionStatusChart.some((row) => row.count > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sessionStatusChart}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {sessionStatusChart.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E9F3', fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Timer} title="No sessions yet" description="Sessions appear once a request is assigned." className="py-10" />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title="Latest requests"
            description="The newest guest requests across the venue."
            action={
              <LinkButton href="/admin/requests" size="sm" variant="ghost">
                View all
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </LinkButton>
            }
          />
          {dashboardQuery.isLoading ? (
            <div className="space-y-2 px-5 pb-5">
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </div>
          ) : (data?.recentRequests ?? []).length ? (
            <ul className="divide-y divide-navy-100">
              {data.recentRequests.map((request) => (
                <li key={request._id ?? request.id}>
                  <Link
                    href={`/admin/requests?status=${encodeURIComponent(request.status)}`}
                    className="flex items-center gap-3 px-5 py-3 transition hover:bg-navy-50/60"
                  >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-navy-900">
                          {request.customer?.name ?? 'Guest'}
                        </span>
                        <StatusBadge status={request.status} />
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-navy-500">
                        {request.requestNumber} · {request.location?.name ?? 'Venue'} · {formatDateTime(request.createdAt)}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-navy-300" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No requests yet"
              description="New guest requests will appear here as they arrive."
              className="py-10"
            />
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Tip Champion"
              description={`Current month · ${formatMonthKey(monthKey)}`}
              action={
                <LinkButton href="/admin/tip-champion" size="sm" variant="ghost">
                  Manage
                </LinkButton>
              }
            />
            <div className="px-5 pb-5">
              {data?.tipChampion?.winner?.name ? (
                <div className="flex items-center gap-3 rounded-xl bg-navy-950 px-4 py-4 text-white">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-teal-300">
                    <Trophy className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{data.tipChampion.winner.name}</p>
                    <p className="text-xs text-white/60">
                      {formatPkr(data.tipChampion.awardAmountPkr ?? 0)} · {data.tipChampion.status}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="rounded-xl bg-navy-50 px-4 py-4 text-sm leading-relaxed text-navy-600">
                  No champion computed for this month yet. Verified tips only, and ties always need an admin decision.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Review ratings" description={`${formatMonthKey(monthKey)} · verified reviews`} />
            <div className="px-4 pb-5">
              {ratingChart.some((row) => row.count > 0) ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratingChart} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E9F3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#61728A' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#61728A' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E9F3', fontSize: 12 }} />
                      <Bar dataKey="count" fill="#F59E0B" radius={[5, 5, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-navy-500">No verified reviews this month yet.</p>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold text-navy-900">Quick actions</p>
            <div className="mt-3 grid gap-2">
              <LinkButton href="/admin/payments?status=PENDING" size="sm" variant="secondary" className="w-full justify-between">
                Verify pending payments
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
              <LinkButton href="/admin/billing" size="sm" variant="secondary" className="w-full justify-between">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Generate missing bills
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
              <LinkButton href="/admin/reviews?status=PENDING" size="sm" variant="secondary" className="w-full justify-between">
                <span className="inline-flex items-center gap-2">
                  <Star className="h-4 w-4" aria-hidden="true" />
                  Moderate reviews
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Billed this month</p>
          <p className="mt-1 font-display text-xl font-semibold text-navy-900">
            {formatPkr(financial?.bills?.billedPkr ?? 0)}
          </p>
          <p className="mt-1 text-xs text-navy-500">{formatNumber(financial?.bills?.bills)} bills</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Outstanding</p>
          <p className="mt-1 font-display text-xl font-semibold text-navy-900">
            {formatPkr(outstanding.outstandingPkr ?? 0)}
          </p>
          <p className="mt-1 text-xs text-navy-500">{formatNumber(outstanding.count)} unpaid bills</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Verified tips</p>
          <p className="mt-1 font-display text-xl font-semibold text-navy-900">
            {formatPkr((financial?.tips?.verifiedPkr ?? 0) + (financial?.tips?.paidPkr ?? 0))}
          </p>
          <p className="mt-1 text-xs text-navy-500">Pass-through to helpers</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Company margin</p>
          <p className="mt-1 font-display text-xl font-semibold text-navy-900">
            {formatPkr(financial?.companyMarginPkr ?? 0)}
          </p>
          <p className="mt-1 text-xs text-navy-500">After earnings and incentives</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Bills by payment status"
          description={`${formatMonthKey(monthKey)} · non-void bills`}
          loading={financialQuery.isLoading}
        >
          {billStatusChart.length ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={billStatusChart} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E9F3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#61728A' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#61728A' }} axisLine={false} tickLine={false} tickFormatter={(value) => formatPkr(value, { compact: true })} />
                  <Tooltip formatter={(value) => formatPkr(value)} contentStyle={{ borderRadius: 12, border: '1px solid #E2E9F3', fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#10233D" radius={[5, 5, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-navy-500">No bills generated this month.</p>
          )}
        </ChartCard>

        <Card>
          <CardHeader title="Operational signals" description={`${formatMonthKey(monthKey)}`} />
          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
            <div className="rounded-xl bg-navy-50 px-3.5 py-3">
              <p className="text-[11px] uppercase tracking-wider text-navy-400">Completion rate</p>
              <p className="mt-0.5 text-lg font-semibold text-navy-900">{operational?.sessions?.completionRate ?? 0}%</p>
            </div>
            <div className="rounded-xl bg-navy-50 px-3.5 py-3">
              <p className="text-[11px] uppercase tracking-wider text-navy-400">Avg. service</p>
              <p className="mt-0.5 text-lg font-semibold text-navy-900">
                {operational?.duration?.averageMinutes ?? 0} min
              </p>
            </div>
            <div className="rounded-xl bg-navy-50 px-3.5 py-3">
              <p className="text-[11px] uppercase tracking-wider text-navy-400">Billable blocks</p>
              <p className="mt-0.5 text-lg font-semibold text-navy-900">
                {formatNumber(operational?.duration?.billableBlocks ?? 0)}
              </p>
            </div>
            <div className="rounded-xl bg-navy-50 px-3.5 py-3">
              <p className="text-[11px] uppercase tracking-wider text-navy-400">Pending incentives</p>
              <p className="mt-0.5 text-lg font-semibold text-navy-900">
                {formatPkr(data?.pending?.incentivesPkr ?? 0)}
              </p>
            </div>
            {(operational?.topHelpers ?? []).length ? (
              <div className="sm:col-span-2">
                <p className="text-[11px] uppercase tracking-wider text-navy-400">Top helpers by completed services</p>
                <ol className="mt-2 space-y-1.5">
                  {operational.topHelpers.slice(0, 5).map((row, index) => (
                    <li key={row.helper?.id ?? row.helper?._id ?? index} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[10px] font-semibold text-white">
                          {index + 1}
                        </span>
                        <span className="truncate text-navy-700">{row.helper?.name ?? 'Helper'}</span>
                      </span>
                      <span className="font-semibold text-navy-900">{row.services}</span>
                    </li>
                  ))}
                </ol>
                <Link href="/admin/reports" className="link-subtle mt-3 inline-flex items-center gap-1 text-xs">
                  Open reports
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <p className="sm:col-span-2 text-sm text-navy-500">No completed services this month yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
