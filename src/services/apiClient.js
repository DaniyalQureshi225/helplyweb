'use client';

import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { useCustomerStore } from '@/stores/customerStore';
import { ApiError, normalizeApiError } from '@/lib/errors';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: { Accept: 'application/json' },
});

let staffRefreshPromise = null;

async function refreshStaffSession() {
  if (!staffRefreshPromise) {
    staffRefreshPromise = useAuthStore
      .getState()
      .refresh()
      .catch((error) => {
        useAuthStore.getState().clear();
        throw error;
      })
      .finally(() => {
        staffRefreshPromise = null;
      });
  }
  return staffRefreshPromise;
}

api.interceptors.request.use((config) => {
  const authType = config.authType;

  if (authType === 'staff') {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  if (authType === 'customer') {
    const token = useCustomerStore.getState().customerToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const qrToken = config.qrToken ?? useCustomerStore.getState().qrToken;
    if (qrToken) config.headers['X-QR-Token'] = qrToken;
  }

  if (authType === 'qr') {
    const qrToken = config.qrToken ?? useCustomerStore.getState().qrToken;
    if (qrToken) config.headers['X-QR-Token'] = qrToken;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config ?? {};
    const status = error.response?.status;

    if (status === 401 && config.authType === 'staff' && !config._retried) {
      config._retried = true;
      try {
        await refreshStaffSession();
        return api(config);
      } catch {
        return Promise.reject(normalizeApiError(error));
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);

export function unwrap(response) {
  return response.data?.data;
}

export function unwrapList(response) {
  return {
    items: response.data?.data ?? [],
    pagination: response.data?.meta?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
    message: response.data?.message,
  };
}

export { ApiError };
