const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1').replace(
  /\/$/,
  '',
);

export const FEATURED_QR_CODE = process.env.NEXT_PUBLIC_FEATURED_QR_CODE || 'DHA6-FRONT-DESK';

/**
 * Server-side read of public backend data for the marketing site.
 * Returns null when the API is unreachable so pages can render gracefully.
 */
export async function getPublicData(path, { revalidate = 60 } = {}) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.success ? payload.data : null;
  } catch {
    return null;
  }
}

export async function getPublicSettings() {
  return (await getPublicData('/public/settings')) ?? null;
}

export async function getQrCatalog(code = FEATURED_QR_CODE) {
  if (!code) return null;
  return getPublicData(`/public/qr/${encodeURIComponent(code)}`);
}

export async function getPricing() {
  return (await getPublicData('/public/pricing')) ?? null;
}
