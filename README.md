# HELPY Web

Public marketing site, customer QR app, and admin console for the existing HELPY backend.

- **Stack:** Next.js 15 App Router, JavaScript, React 19, Tailwind CSS, Zustand, TanStack Query, Axios, React Hook Form, Zod, Lucide, Recharts, Socket.IO client.
- **Brand:** HELPY — *Your Comfort, Our Priority.*
- **Backend:** consumed as-is from `../helply backend` (no backend source changes in this project).

## Quick start

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>.

The backend must be running at `NEXT_PUBLIC_API_URL` (default <http://127.0.0.1:4000/api/v1>). Backend Swagger docs are at <http://127.0.0.1:4000/docs>.

### Environment

See `.env.example` for all variables.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Browser-facing backend REST base URL, including `/api/v1`. |
| `API_URL` | Server-side base URL used by Next.js auth route handlers. |
| `NEXT_PUBLIC_APP_URL` | Public origin used to build QR links. |
| `NEXT_PUBLIC_FEATURED_QR_CODE` | Optional seeded QR code used for live service categories on marketing pages. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` / `NEXT_PUBLIC_SUPPORT_PHONE` | Fallback contact details when public settings do not provide them. |

## Commands

```bash
npm run dev     # development server
npm run build   # production build (includes lint/type validation)
npm start       # production server after build
```

Backend commands (from `../helply backend`):

```bash
npm install
npm run dev       # or npm start
npm run seed      # development seed data
npm test
```

Seed admin accounts are documented in the backend README. Change all secrets before deployment.

## Routes

### Public

`/`, `/how-it-works`, `/services`, `/about`, `/contact`, `/get-assistance`, `/privacy`, `/terms`

### Customer QR app

`/customer/[code]`, `/customer/request`, `/customer/track/[requestId]`, `/customer/service/[sessionId]`, `/customer/bill/[billId]`, `/customer/review/[sessionId]`

### Admin

`/admin/login`, `/admin/dashboard`, `/admin/requests`, `/admin/sessions`, `/admin/billing`, `/admin/payments`, `/admin/recordings`, `/admin/helpers`, `/admin/customers`, `/admin/services`, `/admin/locations`, `/admin/qr-codes`, `/admin/reviews`, `/admin/tips`, `/admin/tip-champion`, `/admin/complaints`, `/admin/disciplinary`, `/admin/attendance`, `/admin/incentives`, `/admin/reports`, `/admin/settings`

## Source layout

```text
src/
  app/
    (public pages, customer routes, admin routes, auth BFF handlers, error pages)
  components/
    admin/       admin shell, filters and directory helpers
    customer/    status timeline, assistance form, voice recorder
    layout/      public and customer shells
    marketing/   backend-driven service sections, FAQ, contact form
    ui/          buttons, cards, tables, forms, overlays, feedback states
  lib/           constants, formatters, error normalization, audio, server API helpers
  services/      centralized Axios client and endpoint maps
  stores/        auth, customer session, UI state
```

## Important behaviour

- Bills are immutable; amounts are whole PKR and are never recalculated in the browser.
- Customer payments submitted online remain `PENDING` until staff confirmation; cash is recorded by staff only.
- Recording consent is explicit, visible, and backend-confirmed. Playback URLs are admin-only and short-lived.
- Tip Champion ties are resolved only by an administrator. Awards use backend-computed streaks.
- Complaints only open a disciplinary **review** after the configured threshold; no automatic salary deduction or termination occurs.
- Attendance and incentive amounts are calculated by the backend from settings.

See `API_GAPS.md` for endpoint coverage, intentional limitations, and contract notes. See `DELIVERY.md` for build and test results.
# helplyweb
