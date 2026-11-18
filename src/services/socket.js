'use client';

import { io } from 'socket.io-client';

export function socketOrigin() {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
  try {
    return new URL(url).origin;
  } catch {
    return 'http://127.0.0.1:4000';
  }
}

export function connectSocket(token) {
  if (!token) return null;
  return io(socketOrigin(), {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
    timeout: 8000,
  });
}

export const SOCKET_EVENTS = {
  REQUEST_CREATED: 'service_request:created',
  REQUEST_ASSIGNED: 'service_request:assigned',
  REQUEST_CANCELLED: 'service_request:cancelled',
  SERVICE_STARTED: 'service_session:started',
  SERVICE_ENDED: 'service_session:ended',
  BILL_GENERATED: 'bill:generated',
  PAYMENT_RECORDED: 'payment:recorded',
  REVIEW_RECEIVED: 'review:received',
  RECORDING_STATUS: 'recording:status',
  NOTIFICATION: 'notification:new',
};
