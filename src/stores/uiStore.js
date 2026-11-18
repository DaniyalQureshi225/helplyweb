'use client';

import { create } from 'zustand';

let toastCounter = 0;

export const useUiStore = create((set) => ({
  sidebarOpen: false,
  toasts: [],

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  pushToast: (toast) => {
    const id = `toast-${Date.now()}-${toastCounter++}`;
    const item = {
      id,
      variant: toast.variant ?? 'info',
      title: toast.title ?? '',
      description: toast.description ?? '',
      duration: toast.duration ?? 4500,
    };
    set((state) => ({ toasts: [...state.toasts, item] }));
    if (item.duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((entry) => entry.id !== id) }));
      }, item.duration);
    }
    return id;
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export const toast = {
  success: (title, description) => useUiStore.getState().pushToast({ variant: 'success', title, description }),
  error: (title, description) => useUiStore.getState().pushToast({ variant: 'error', title, description }),
  info: (title, description) => useUiStore.getState().pushToast({ variant: 'info', title, description }),
  warning: (title, description) => useUiStore.getState().pushToast({ variant: 'warning', title, description }),
};
