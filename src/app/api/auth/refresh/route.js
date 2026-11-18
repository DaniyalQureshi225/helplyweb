import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  REFRESH_COOKIE,
  backendFetch,
  setRefreshCookie,
  clearRefreshCookie,
  errorResponse,
} from '@/lib/authServer';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    const result = errorResponse({ message: 'No active session' }, 401);
    clearRefreshCookie(result);
    return result;
  }

  try {
    const { response, payload } = await backendFetch('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });

    if (!response.ok || !payload?.success) {
      const result = errorResponse(payload, response.status || 401);
      clearRefreshCookie(result);
      return result;
    }

    const data = payload.data ?? {};
    const result = NextResponse.json({
      success: true,
      data: {
        user: data.user,
        accessToken: data.accessToken,
        accessTokenExpiresIn: data.accessTokenExpiresIn,
      },
    });
    if (data.refreshToken) setRefreshCookie(result, data.refreshToken);
    return result;
  } catch {
    return errorResponse({ message: 'The HELPY API is unreachable' }, 502);
  }
}
