export class ApiError extends Error {
  constructor(message, { status, code, errors, requestId, isNetwork = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors ?? [];
    this.requestId = requestId;
    this.isNetwork = isNetwork;
  }
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) return error;

  if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
    return new ApiError('Request cancelled', { code: 'CANCELLED' });
  }

  if (error?.response) {
    const body = error.response.data ?? {};
    return new ApiError(body.message || 'Something went wrong. Please try again.', {
      status: error.response.status,
      code: body.code || `HTTP_${error.response.status}`,
      errors: Array.isArray(body.errors) ? body.errors : [],
      requestId: body.requestId,
    });
  }

  if (error?.request) {
    return new ApiError('We could not reach the HELPY service. Check your connection and try again.', {
      code: 'NETWORK_ERROR',
      isNetwork: true,
    });
  }

  return new ApiError(error?.message || 'Unexpected error', { code: 'UNKNOWN' });
}

export function fieldErrors(error) {
  const normalized = normalizeApiError(error);
  const map = {};
  for (const item of normalized.errors ?? []) {
    if (!item?.field) continue;
    map[item.field] = item.message || 'Invalid value';
  }
  return map;
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const normalized = normalizeApiError(error);
  if (normalized.isNetwork) return normalized.message;
  return normalized.message || fallback;
}
