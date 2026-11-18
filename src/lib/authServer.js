import { NextResponse } from 'next/server';

export const REFRESH_COOKIE = 'helpy_refresh';
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export function getApiUrl() {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1').replace(/\/$/, '');
}

export async function backendFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

export function setRefreshCookie(response, refreshToken) {
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearRefreshCookie(response) {
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function errorResponse(payload, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message: payload?.message || 'Authentication failed',
      code: payload?.code || 'AUTH_ERROR',
      errors: payload?.errors ?? [],
    },
    { status },
  );
}
