'use client';

import { publicApi, customerApi } from '@/services/customerApi';
import { hasFreshQrToken, hasValidCustomerToken, useCustomerStore } from '@/stores/customerStore';

/** Resolve a physical QR code and persist the venue catalogue + QR token. */
export async function resolveQrToStore(code) {
  const data = await publicApi.resolveQr(code);
  useCustomerStore.getState().setQr({ ...data, qrCode: data?.qr?.code ?? code });
  return data;
}

/**
 * QR tokens live 30 minutes. Refresh them transparently when we still know
 * which physical code the guest scanned.
 */
export async function ensureQrToken() {
  const state = useCustomerStore.getState();
  if (hasFreshQrToken()) return state.qrToken;
  if (!state.qrCode) throw new Error('Please scan the HELPY QR code again');
  const data = await resolveQrToStore(state.qrCode);
  return data.qrToken;
}

/**
 * Customer tokens live 2 hours and are bound to a single request. If the token
 * has expired we re-identify the guest with their stored phone number and the
 * venue QR code, which mints a fresh customer token.
 */
export async function ensureCustomerAuth() {
  if (hasValidCustomerToken()) return true;

  const state = useCustomerStore.getState();
  if (!state.qrCode || !state.customer?.phone || !state.customer?.name) return false;

  try {
    const qrToken = await ensureQrToken();
    const data = await customerApi.createCustomer({
      name: state.customer.name,
      phone: state.customer.phone,
      email: state.customer.email || undefined,
      qrToken,
    });
    useCustomerStore.getState().setCustomer({
      customerToken: data.customerToken,
      customer: data.customer,
    });
    return true;
  } catch {
    return false;
  }
}
