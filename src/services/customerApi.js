'use client';

import { api, unwrap, unwrapList } from './apiClient';

export const publicApi = {
  resolveQr: (code) => api.get(`/public/qr/${encodeURIComponent(code)}`).then(unwrap),
  settings: () => api.get('/public/settings').then(unwrap),
  pricing: () => api.get('/public/pricing').then(unwrap),
};

function qrConfig(qrToken) {
  return { authType: 'qr', qrToken };
}

function customerConfig(extra = {}) {
  return { authType: 'customer', ...extra };
}

export const customerApi = {
  /* QR entry */
  createCustomer: ({ name, phone, email, qrToken }) =>
    api.post('/customers', { name, phone, ...(email ? { email } : {}) }, qrConfig(qrToken)).then(unwrap),
  me: () => api.get('/customers/me', customerConfig()).then(unwrap),
  myServices: (params) => api.get('/customers/me/services', customerConfig({ params })).then(unwrapList),
  activeRequest: () => api.get('/customers/me/active-request', customerConfig()).then(unwrap),

  /* Requests + sessions */
  createRequest: (payload) => api.post('/service-requests', payload, customerConfig()).then(unwrap),
  request: (id) => api.get(`/service-requests/${id}`, customerConfig()).then(unwrap),
  requestSession: (id) => api.get(`/service-requests/${id}/session`, customerConfig()).then(unwrap),
  cancelRequest: (id, reason) =>
    api.post(`/service-requests/${id}/cancel`, reason ? { reason } : {}, customerConfig()).then(unwrap),
  session: (id) => api.get(`/service-sessions/${id}`, customerConfig()).then(unwrap),
  confirmReceipt: (id) =>
    api.post(`/service-sessions/${id}/receipt-confirmation`, {}, customerConfig()).then(unwrap),

  /* Recording consent */
  recordConsent: (sessionId, accepted) =>
    api.post(`/recordings/sessions/${sessionId}/consent`, { accepted }, customerConfig()).then(unwrap),
  sessionRecordings: (sessionId) =>
    api.get(`/recordings/session/${sessionId}`, customerConfig()).then(unwrap),

  /* Bills + payments */
  bill: (id) => api.get(`/bills/${id}`, customerConfig()).then(unwrap),
  billBySession: (sessionId) => api.get(`/bills/session/${sessionId}`, customerConfig()).then(unwrap),
  payments: (params) => api.get('/payments', customerConfig({ params })).then(unwrapList),
  createPayment: ({ billId, amountPkr, method, transactionReference }) =>
    api
      .post(
        '/payments',
        { billId, amountPkr, method, transactionReference, customerConfirmed: true },
        customerConfig(),
      )
      .then(unwrap),

  /* Reviews, tips, complaints */
  createReview: (sessionId, payload) =>
    api.post(`/reviews/sessions/${sessionId}`, payload, customerConfig()).then(unwrap),
  reviews: (params) => api.get('/reviews', customerConfig({ params })).then(unwrapList),
  createTip: (sessionId, payload) =>
    api.post(`/tips/sessions/${sessionId}`, payload, customerConfig()).then(unwrap),
  tips: (params) => api.get('/tips', customerConfig({ params })).then(unwrapList),
  createComplaint: (payload) => api.post('/complaints', payload, customerConfig()).then(unwrap),
  complaints: (params) => api.get('/complaints', customerConfig({ params })).then(unwrapList),

  /* Voice feedback recording */
  createVoiceRecording: (sessionId) =>
    api
      .post(
        `/recordings/sessions/${sessionId}`,
        { purpose: 'VOICE_FEEDBACK', format: 'wav' },
        customerConfig(),
      )
      .then(unwrap),
  startRecording: (recordingId) =>
    api.post(`/recordings/${recordingId}/start`, {}, customerConfig()).then(unwrap),
  uploadRecordingChunk: (recordingId, { index, checksum, file, durationMs, onProgress }) => {
    const form = new FormData();
    form.append('chunk', file, `voice-${index}.wav`);
    form.append('index', String(index));
    form.append('checksum', checksum);
    form.append('mimeType', 'audio/wav');
    if (Number.isFinite(durationMs)) form.append('durationMs', String(Math.round(durationMs)));
    return api
      .post(`/recordings/${recordingId}/chunks`, form, {
        ...customerConfig(),
        onUploadProgress: (event) => {
          if (!onProgress || !event?.total) return;
          onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        },
      })
      .then(unwrap);
  },
  finalizeRecording: (recordingId, expectedChunks) =>
    api
      .post(`/recordings/${recordingId}/finalize`, { expectedChunks }, customerConfig())
      .then(unwrap),
};
