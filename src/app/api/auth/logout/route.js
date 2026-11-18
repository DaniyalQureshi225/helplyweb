import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { REFRESH_COOKIE, backendFetch, clearRefreshCookie } from '@/lib/authServer';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await backendFetch('/auth/logout', { method: 'POST', body: { refreshToken } });
    } catch {
      // Clearing the local cookie is the priority; the backend token expires naturally.
    }
  }

  const result = NextResponse.json({ success: true, data: { ok: true } });
  clearRefreshCookie(result);
  return result;
}
