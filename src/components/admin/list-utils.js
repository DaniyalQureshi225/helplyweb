'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { cn } from '@/lib/utils';

/**
 * Keeps list filters + pagination local, but honours ?status=... style links
 * from the dashboard and reports. Reads the URL after mount so pages remain
 * trivially prerenderable and hydration-safe.
 */
export function useAdminFilters(initialFilters, { limit = 20 } = {}) {
  const [filters, setFiltersState] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [urlApplied, setUrlApplied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patch = {};
    let found = false;
    for (const key of Object.keys(initialFilters)) {
      const value = params.get(key);
      if (value !== null && value !== '') {
        patch[key] = value;
        found = true;
      }
    }
    const urlPage = Number(params.get('page'));
    if (Number.isInteger(urlPage) && urlPage > 0) setPage(urlPage);
    if (found) setFiltersState((previous) => ({ ...previous, ...patch }));
    setUrlApplied(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = (key, value) => {
    setFiltersState((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  const setFilters = (patch) => {
    setFiltersState((previous) => ({ ...previous, ...patch }));
    setPage(1);
  };

  const reset = () => {
    setFiltersState(initialFilters);
    setPage(1);
  };

  const queryParams = useMemo(() => {
    const params = { page, limit };
    for (const [key, value] of Object.entries(filters)) {
      if (value !== '' && value !== null && value !== undefined) params[key] = value;
    }
    return params;
  }, [filters, page, limit]);

  const activeCount = Object.values(filters).filter((value) => value !== '' && value !== null && value !== undefined).length;

  return { filters, setFilter, setFilters, reset, page, setPage, limit, queryParams, activeCount, urlApplied };
}

/** Recent helpers + customers, used to resolve the ObjectId refs in list rows. */
export function useDirectory() {
  const helpersQuery = useQuery({
    queryKey: ['admin', 'directory', 'helpers'],
    queryFn: () => adminApi.helpers.list({ limit: 100 }),
    staleTime: 120_000,
  });
  const customersQuery = useQuery({
    queryKey: ['admin', 'directory', 'customers'],
    queryFn: () => adminApi.customers.list({ limit: 100 }),
    staleTime: 120_000,
  });

  const helpers = helpersQuery.data?.items ?? [];
  const customers = customersQuery.data?.items ?? [];

  const helperMap = useMemo(() => new Map(helpers.map((item) => [item.id, item])), [helpers]);
  const customerMap = useMemo(() => new Map(customers.map((item) => [item.id, item])), [customers]);

  return {
    helpers,
    customers,
    helperMap,
    customerMap,
    helperName: (id) => (id ? helperMap.get(String(id))?.name ?? `Helper ${shortId(id)}` : 'Unassigned'),
    customerName: (id) => (id ? customerMap.get(String(id))?.name ?? `Guest ${shortId(id)}` : 'Guest'),
    helperOptions: helpers
      .filter((helper) => helper.isActive !== false)
      .map((helper) => ({ value: helper.id, label: `${helper.name}${helper.employeeCode ? ` · ${helper.employeeCode}` : ''}` })),
    customerOptions: customers.map((customer) => ({
      value: customer.id,
      label: `${customer.name}${customer.phone ? ` · ${customer.phone}` : ''}`,
    })),
  };
}

export function shortId(id) {
  if (!id) return '—';
  return String(id).slice(-6);
}

/** Locations and categories are unpaginated catalogue endpoints. */
export function useCatalog() {
  const locationsQuery = useQuery({
    queryKey: ['admin', 'catalog', 'locations'],
    queryFn: () => adminApi.locations.list(),
    staleTime: 120_000,
  });
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'catalog', 'categories'],
    queryFn: () => adminApi.categories.list(),
    staleTime: 120_000,
  });

  const locations = locationsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const locationMap = useMemo(
    () => new Map(locations.map((item) => [String(item.id ?? item._id), item])),
    [locations],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [String(item.id ?? item._id), item])),
    [categories],
  );

  return {
    locations,
    categories,
    locationMap,
    categoryMap,
    locationName: (id) => (id ? locationMap.get(String(id))?.name ?? `Location ${shortId(id)}` : '—'),
    categoryName: (id) => (id ? categoryMap.get(String(id))?.name ?? `Service ${shortId(id)}` : 'Unspecified'),
    locationOptions: locations.map((location) => ({
      value: String(location.id ?? location._id),
      label: location.name,
    })),
    categoryOptions: categories.map((category) => ({
      value: String(category.id ?? category._id),
      label: category.name,
    })),
  };
}

export function FilterBar({ children, className }) {
  return <div className={cn('flex flex-wrap items-end gap-2.5', className)}>{children}</div>;
}

export function FilterField({ label, htmlFor, children, className }) {
  return (
    <div className={cn('min-w-[150px] flex-1 sm:flex-none', className)}>
      <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-navy-400">
        {label}
      </label>
      {children}
    </div>
  );
}

export function SummaryChips({ items }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-navy-100 bg-white px-2.5 py-1 text-xs font-medium text-navy-600"
        >
          <span className="text-navy-400">{item.label}</span>
          <span className="font-semibold text-navy-900">{item.value}</span>
        </span>
      ))}
    </div>
  );
}
