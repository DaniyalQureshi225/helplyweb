'use client';

import { api, unwrap, unwrapList } from './apiClient';

const staff = (extra = {}) => ({ authType: 'staff', ...extra });

export const adminApi = {
  me: () => api.get('/auth/me', staff()).then(unwrap),
  changePassword: (payload) => api.post('/auth/change-password', payload, staff()).then(unwrap),

  dashboard: () => api.get('/admin/dashboard', staff()).then(unwrap),
  financialReport: (params) => api.get('/admin/reports/financial', staff({ params })).then(unwrap),
  operationalReport: (params) => api.get('/admin/reports/operational', staff({ params })).then(unwrap),
  reconciliation: (params) => api.get('/admin/reports/reconciliation', staff({ params })).then(unwrap),
  helperPerformance: (params) => api.get('/admin/reports/helpers', staff({ params })).then(unwrapList),
  auditLogs: (params) => api.get('/admin/audit-logs', staff({ params })).then(unwrapList),

  helpers: {
    list: (params) => api.get('/admin/helpers', staff({ params })).then(unwrapList),
    get: (id) => api.get(`/admin/helpers/${id}`, staff()).then(unwrap),
    create: (payload) => api.post('/admin/helpers', payload, staff()).then(unwrap),
    update: (id, payload) => api.patch(`/admin/helpers/${id}`, payload, staff()).then(unwrap),
    setActive: (id, payload) => api.post(`/admin/helpers/${id}/status`, payload, staff()).then(unwrap),
    resetPassword: (id, password) =>
      api.post(`/admin/helpers/${id}/reset-password`, { password }, staff()).then(unwrap),
  },

  customers: {
    list: (params) => api.get('/admin/customers', staff({ params })).then(unwrapList),
    get: (id) => api.get(`/admin/customers/${id}`, staff()).then(unwrap),
    setBlocked: (id, payload) => api.post(`/admin/customers/${id}/block`, payload, staff()).then(unwrap),
  },

  locations: {
    list: (params) => api.get('/admin/locations', staff({ params })).then(unwrap),
    create: (payload) => api.post('/admin/locations', payload, staff()).then(unwrap),
    update: (id, payload) => api.patch(`/admin/locations/${id}`, payload, staff()).then(unwrap),
    remove: (id) => api.delete(`/admin/locations/${id}`, staff()).then(unwrap),
  },

  categories: {
    list: (params) => api.get('/admin/categories', staff({ params })).then(unwrap),
    create: (payload) => api.post('/admin/categories', payload, staff()).then(unwrap),
    update: (id, payload) => api.patch(`/admin/categories/${id}`, payload, staff()).then(unwrap),
    remove: (id) => api.delete(`/admin/categories/${id}`, staff()).then(unwrap),
  },

  qrCodes: {
    list: (params) => api.get('/admin/qr-codes', staff({ params })).then(unwrapList),
    create: (payload) => api.post('/admin/qr-codes', payload, staff()).then(unwrap),
    update: (id, payload) => api.patch(`/admin/qr-codes/${id}`, payload, staff()).then(unwrap),
    remove: (id) => api.delete(`/admin/qr-codes/${id}`, staff()).then(unwrap),
  },

  admins: {
    list: () => api.get('/admin/admins', staff()).then(unwrap),
    create: (payload) => api.post('/admin/admins', payload, staff()).then(unwrap),
    setActive: (id, payload) => api.post(`/admin/admins/${id}/status`, payload, staff()).then(unwrap),
  },

  settings: {
    list: () => api.get('/admin/settings', staff()).then(unwrap),
    update: (key, value) =>
      api.patch(`/admin/settings/${encodeURIComponent(key)}`, { value }, staff()).then(unwrap),
  },

  requests: {
    list: (params) => api.get('/service-requests', staff({ params })).then(unwrapList),
    get: (id) => api.get(`/service-requests/${id}`, staff()).then(unwrap),
    session: (id) => api.get(`/service-requests/${id}/session`, staff()).then(unwrap),
    assign: (id, helperId) =>
      api.post(`/service-requests/${id}/assign`, { helperId }, staff()).then(unwrap),
    cancel: (id, reason) =>
      api.post(`/service-requests/${id}/cancel`, reason ? { reason } : {}, staff()).then(unwrap),
  },

  sessions: {
    list: (params) => api.get('/service-sessions', staff({ params })).then(unwrapList),
    get: (id) => api.get(`/service-sessions/${id}`, staff()).then(unwrap),
    cancel: (id, reason) =>
      api.post(`/service-sessions/${id}/cancel`, reason ? { reason } : {}, staff()).then(unwrap),
  },

  bills: {
    list: (params) => api.get('/bills', staff({ params })).then(unwrapList),
    get: (id) => api.get(`/bills/${id}`, staff()).then(unwrap),
    bySession: (sessionId) => api.get(`/bills/session/${sessionId}`, staff()).then(unwrap),
    generate: (sessionId) => api.post(`/bills/session/${sessionId}/generate`, {}, staff()).then(unwrap),
    void: (id, reason) => api.post(`/bills/${id}/void`, reason ? { reason } : {}, staff()).then(unwrap),
  },

  payments: {
    list: (params) => api.get('/payments', staff({ params })).then(unwrapList),
    get: (id) => api.get(`/payments/${id}`, staff()).then(unwrap),
    record: (payload) => api.post('/payments', payload, staff()).then(unwrap),
    confirm: (id) => api.post(`/payments/${id}/confirm`, {}, staff()).then(unwrap),
    fail: (id, reason) => api.post(`/payments/${id}/fail`, { reason }, staff()).then(unwrap),
    refund: (id, reference) => api.post(`/payments/${id}/refund`, { reference }, staff()).then(unwrap),
  },

  reviews: {
    list: (params) => api.get('/reviews', staff({ params })).then(unwrapList),
    get: (id) => api.get(`/reviews/${id}`, staff()).then(unwrap),
    verify: (id) => api.post(`/reviews/${id}/verify`, {}, staff()).then(unwrap),
    reject: (id, reason) => api.post(`/reviews/${id}/reject`, reason ? { reason } : {}, staff()).then(unwrap),
  },

  tips: {
    list: (params) => api.get('/tips', staff({ params })).then(unwrapList),
    summary: (params) => api.get('/tips/summary', staff({ params })).then(unwrap),
    ledger: (params) => api.get('/tips/ledger', staff({ params })).then(unwrapList),
    verify: (id) => api.post(`/tips/${id}/verify`, {}, staff()).then(unwrap),
    reject: (id, reason) => api.post(`/tips/${id}/reject`, reason ? { reason } : {}, staff()).then(unwrap),
    pay: (id, payoutReference) =>
      api.post(`/tips/${id}/pay`, { payoutReference }, staff()).then(unwrap),
  },

  tipChampion: {
    current: () => api.get('/tip-champion/current', staff()).then(unwrap),
    list: (params) => api.get('/tip-champion', staff({ params })).then(unwrapList),
    history: (params) => api.get('/tip-champion/history', staff({ params })).then(unwrapList),
    preview: (monthKey) =>
      api.get('/tip-champion/preview', staff({ params: monthKey ? { monthKey } : {} })).then(unwrap),
    compute: (monthKey) =>
      api.post('/tip-champion/compute', monthKey ? { monthKey } : {}, staff()).then(unwrap),
    resolveTie: (id, payload) => api.post(`/tip-champion/${id}/resolve-tie`, payload, staff()).then(unwrap),
    approve: (id) => api.post(`/tip-champion/${id}/approve`, {}, staff()).then(unwrap),
    pay: (id, payoutReference) =>
      api.post(`/tip-champion/${id}/pay`, { payoutReference }, staff()).then(unwrap),
  },

  complaints: {
    list: (params) => api.get('/complaints', staff({ params })).then(unwrapList),
    get: (id) => api.get(`/complaints/${id}`, staff()).then(unwrap),
    assign: (id, assigneeId) =>
      api.post(`/complaints/${id}/assign`, { assigneeId }, staff()).then(unwrap),
    note: (id, note) => api.post(`/complaints/${id}/notes`, { note }, staff()).then(unwrap),
    evidence: (id, payload) => api.post(`/complaints/${id}/evidence`, payload, staff()).then(unwrap),
    resolve: (id, payload) => api.post(`/complaints/${id}/resolve`, payload, staff()).then(unwrap),
    close: (id) => api.post(`/complaints/${id}/close`, {}, staff()).then(unwrap),
  },

  disciplinary: {
    list: (params) => api.get('/disciplinary', staff({ params })).then(unwrapList),
    get: (id) => api.get(`/disciplinary/${id}`, staff()).then(unwrap),
    decide: (id, payload) => api.post(`/disciplinary/${id}/decision`, payload, staff()).then(unwrap),
  },

  attendance: {
    list: (params) => api.get('/attendance', staff({ params })).then(unwrapList),
    summary: (helperId, monthKey) =>
      api.get('/attendance/summary', staff({ params: { helperId, monthKey } })).then(unwrap),
    range: (helperId, monthKey) =>
      api.get('/attendance/range', staff({ params: { helperId, monthKey } })).then(unwrap),
    mark: (payload) => api.post('/attendance', payload, staff()).then(unwrap),
    update: (id, payload) => api.patch(`/attendance/${id}`, payload, staff()).then(unwrap),
  },

  incentives: {
    list: (params) => api.get('/incentives', staff({ params })).then(unwrapList),
    earnings: (params) => api.get('/incentives/earnings', staff({ params })).then(unwrapList),
    earningsSummary: (helperId, monthKey) =>
      api.get('/incentives/earnings/summary', staff({ params: { helperId, monthKey } })).then(unwrap),
    payEarnings: (payload) => api.post('/incentives/earnings/pay', payload, staff()).then(unwrap),
    runMonthly: (monthKey) =>
      api.post('/incentives/run-monthly', monthKey ? { monthKey } : {}, staff()).then(unwrap),
    createManual: (payload) => api.post('/incentives/manual', payload, staff()).then(unwrap),
    approve: (id) => api.post(`/incentives/${id}/approve`, {}, staff()).then(unwrap),
    reject: (id, reason) => api.post(`/incentives/${id}/reject`, reason ? { reason } : {}, staff()).then(unwrap),
    pay: (id, payoutReference) =>
      api.post(`/incentives/${id}/pay`, { payoutReference }, staff()).then(unwrap),
  },

  recordings: {
    list: (params) => api.get('/recordings', staff({ params })).then(unwrapList),
    get: (id) => api.get(`/recordings/${id}`, staff()).then(unwrap),
    forSession: (sessionId) => api.get(`/recordings/session/${sessionId}`, staff()).then(unwrap),
    playbackUrl: (id, reason) =>
      api.post(`/recordings/${id}/playback-url`, { reason }, staff()).then(unwrap),
    setLegalHold: (id, payload) => api.post(`/recordings/${id}/legal-hold`, payload, staff()).then(unwrap),
    accessLogs: (id, params) =>
      api.get(`/recordings/${id}/access-logs`, staff({ params })).then(unwrapList),
  },

  notifications: {
    list: (params) => api.get('/notifications', staff({ params })).then(unwrapList),
    markAllRead: () => api.post('/notifications/read-all', {}, staff()).then(unwrap),
    markRead: (id) => api.post(`/notifications/${id}/read`, {}, staff()).then(unwrap),
  },
};
