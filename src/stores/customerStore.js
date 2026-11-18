'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const QR_TTL_MS = 30 * 60 * 1000;

export const useCustomerStore = create(
  persist(
    (set, get) => ({
      customerToken: null,
      customer: null,
      qrToken: null,
      qrCode: null,
      qr: null,
      location: null,
      pricing: null,
      policies: null,
      categories: [],
      requestId: null,
      request: null,
      sessionId: null,
      issuedAt: null,
      qrIssuedAt: null,

      setQr: ({ qrToken, qr, qrCode, location, pricing, policies, categories }) => {
        set({
          qrToken,
          qr,
          qrCode: qrCode ?? qr?.code ?? get().qrCode,
          location,
          pricing,
          policies,
          categories: categories ?? [],
          qrIssuedAt: Date.now(),
        });
      },

      setCustomer: ({ customerToken, customer, requestId }) => {
        set({
          customerToken,
          customer,
          requestId: requestId ?? get().requestId ?? null,
          issuedAt: Date.now(),
        });
      },

      setRequest: ({ request, sessionId, customerToken }) => {
        set({
          request,
          requestId: request?.id ?? get().requestId,
          sessionId: sessionId ?? request?.session ?? get().sessionId,
          ...(customerToken ? { customerToken, issuedAt: Date.now() } : {}),
        });
      },

      setSessionId: (sessionId) => set({ sessionId }),

      clearRequest: () => set({ requestId: null, request: null, sessionId: null }),

      clear: () =>
        set({
          customerToken: null,
          customer: null,
          qrToken: null,
          qrCode: null,
          qr: null,
          location: null,
          pricing: null,
          policies: null,
          categories: [],
          requestId: null,
          request: null,
          sessionId: null,
          issuedAt: null,
          qrIssuedAt: null,
        }),
    }),
    {
      name: 'helpy-customer-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customerToken: state.customerToken,
        customer: state.customer,
        qrToken: state.qrToken,
        qrCode: state.qrCode,
        qr: state.qr,
        location: state.location,
        pricing: state.pricing,
        policies: state.policies,
        categories: state.categories,
        requestId: state.requestId,
        request: state.request,
        sessionId: state.sessionId,
        issuedAt: state.issuedAt,
        qrIssuedAt: state.qrIssuedAt,
      }),
    },
  ),
);

export function hasValidCustomerToken() {
  const { customerToken, issuedAt } = useCustomerStore.getState();
  if (!customerToken || !issuedAt) return false;
  return Date.now() - issuedAt < TOKEN_TTL_MS - 60_000;
}

export function hasFreshQrToken() {
  const { qrToken, qrIssuedAt } = useCustomerStore.getState();
  if (!qrToken || !qrIssuedAt) return false;
  return Date.now() - qrIssuedAt < QR_TTL_MS - 60_000;
}

export const CUSTOMER_TOKEN_TTL_MS = TOKEN_TTL_MS;
