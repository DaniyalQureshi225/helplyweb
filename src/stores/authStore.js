'use client';

import { create } from 'zustand';

let refreshPromise = null;

async function requestRefresh() {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('SESSION_EXPIRED');
        const body = await response.json();
        if (!body?.data?.accessToken) throw new Error('SESSION_EXPIRED');
        return body.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  status: 'idle',
  error: null,

  setSession: ({ user, accessToken }) => {
    set({ user, accessToken, status: 'authenticated', error: null });
  },

  clear: () => {
    set({ user: null, accessToken: null, status: 'unauthenticated', error: null });
  },

  bootstrap: async () => {
    if (get().status === 'loading' || get().status === 'authenticated') return get().accessToken;
    set({ status: 'loading', error: null });
    try {
      const session = await requestRefresh();
      set({ user: session.user, accessToken: session.accessToken, status: 'authenticated' });
      return session.accessToken;
    } catch {
      set({ user: null, accessToken: null, status: 'unauthenticated' });
      return null;
    }
  },

  refresh: async () => {
    const session = await requestRefresh();
    set({ user: session.user, accessToken: session.accessToken, status: 'authenticated', error: null });
    return session.accessToken;
  },

  login: async ({ identifier, password }) => {
    set({ status: 'loading', error: null });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(body?.message || 'Unable to sign in');
        error.status = response.status;
        error.code = body?.code;
        throw error;
      }
      set({
        user: body.data.user,
        accessToken: body.data.accessToken,
        status: 'authenticated',
        error: null,
      });
      return body.data.user;
    } catch (error) {
      set({ status: 'unauthenticated', error: error.message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Local state is cleared regardless; the refresh cookie may already be gone.
    }
    set({ user: null, accessToken: null, status: 'unauthenticated', error: null });
  },

  hasRole: (...roles) => {
    const role = get().user?.role;
    return Boolean(role && roles.includes(role));
  },
}));

export const isAdminRole = (role) => role === 'ADMIN' || role === 'SUPER_ADMIN';
