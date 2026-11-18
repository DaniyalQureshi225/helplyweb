import { NextResponse } from 'next/server';
import { backendFetch, setRefreshCookie, errorResponse } from '@/lib/authServer';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse({ message: 'Invalid request body' }, 400);
  }

  if (!body?.identifier || !body?.password) {
    return errorResponse({ message: 'Email/phone and password are required' }, 400);
  }

  try {
    const { response, payload } = await backendFetch('/auth/login', {
      method: 'POST',
      body: { identifier: body.identifier, password: body.password },
    });

    if (!response.ok || !payload?.success) {
      return errorResponse(payload, response.status || 401);
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
    return errorResponse({ message: 'The HELPY API is unreachable. Please try again shortly.' }, 502);
  }
}
