# HELPY Web — API Gaps & Integration Notes

**Reviewed:** 18 November 2026  
**Scope:** Frontend in `/Users/dd/Desktop/helply/web` consuming the existing backend in `/Users/dd/Desktop/helply/helply backend`. No backend source files were added, rewritten, or deleted.

This document records where the web app deliberately stops short of the backend surface, where the backend does not provide a capability the UI might otherwise want, and the contract rules the frontend must not bypass.

---

## 1. Contract followed by the web app

- Base URL: `NEXT_PUBLIC_API_URL` (default `http://127.0.0.1:4000/api/v1`).
- Success envelope: `{ success: true, message, data }`; paginated lists add `meta.pagination`.
- Error envelope: `{ success: false, message, code, errors[], requestId }`, normalized by `src/lib/errors.js`.
- Staff bearer tokens are kept in memory; the refresh token lives in an httpOnly cookie via the Next.js BFF routes under `src/app/api/auth/*`.
- Customer tokens live only in the browser tab/session store; QR tokens are sent with `X-QR-Token`.
- All money is an **integer PKR amount**. The web app never divides by 100 and never recalculates a bill.
- Customer request status is driven only by the backend through `CREATED → ASSIGNED → IN_PROGRESS → COMPLETED`; the UI never invents or advances a status locally.

---

## 2. Coverage summary

| Area | Backend surface used by web | Web surface |
| --- | --- | --- |
| Public | `/public/qr/:code`, `/public/settings`, `/public/pricing` | Marketing pages, `/get-assistance`, QR landing |
| Auth | `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` via BFF | Staff login, protected admin shell, logout, session restore |
| Customer | `/customers`, `/customers/me*`, `/service-requests`, `/service-sessions`, `/bills`, `/payments`, `/reviews`, `/tips`, `/complaints`, `/recordings` | `/customer/[code]`, request, track, service, bill, review |
| Admin operations | `/admin/dashboard`, `/service-requests`, `/service-sessions`, `/bills`, `/payments`, `/recordings` | Dashboard, requests, sessions, billing, payments, recordings |
| Admin people/catalogue | `/admin/helpers`, `/admin/customers`, `/admin/locations`, `/admin/categories`, `/admin/qr-codes` | Helpers, customers, services, locations, QR codes |
| Admin engagement | `/reviews`, `/tips`, `/tip-champion`, `/complaints`, `/disciplinary` | Reviews, tips, Tip Champion, complaints, disciplinary |
| Workforce | `/attendance`, `/incentives` | Attendance and incentives/earnings |
| Reporting/system | `/admin/reports/*`, `/admin/audit-logs`, `/admin/settings`, `/admin/admins`, `/notifications` | Reports, settings, notification drawer |

---

## 3. Intentional gaps and limitations

### 3.1 No payment gateway integration

The backend has no checkout/PSP integration. The web app therefore:

- records customer-submitted non-cash payments with a transaction reference;
- leaves those payments `PENDING` until an administrator confirms them;
- never marks a customer payment `CONFIRMED` from the browser;
- records cash only from the admin console;
- never edits a bill amount; bills are immutable and cannot be voided once `amountPaidPkr > 0`;
- only counts tips whose session has a linked `CONFIRMED` payment.

**Gap:** A real gateway (card/wallet checkout, webhooks, refunds to source) would require new backend work. The UI does not fake one.

### 3.2 Public contact form uses the visitor's email client

There is no backend `POST /contact` or messaging endpoint. `/contact` validates input locally and opens a `mailto:` message addressed to the public setting `app.info.email` (or `NEXT_PUBLIC_SUPPORT_EMAIL` fallback). The page states clearly that nothing is sent automatically.

**Gap:** Inbound ticket creation/email delivery would need a backend endpoint or third-party service.

### 3.3 QR entry requires a QR code value

There is no public endpoint that resolves a human-entered location code to a venue. `/get-assistance` validates the entered value with `GET /public/qr/:code`; only then does it route to `/customer/[code]`. The `[code]` segment is treated as the QR code itself.

**Gap:** Location-code lookup, short aliases, and QR-less fallback are not available server-side.

### 3.4 Helper-facing API is not part of this web deliverable

The backend exposes `/helper/me`, `/helper/dashboard`, `/helper/sessions`, `/helper/requests`, `/helper/earnings`, `/helper/reviews`, `/helper/tips`, `/helper/attendance`, and `/helper/incentives`. This project builds the **admin** console for helpers, not a separate helper mobile app. Admin management of helpers is fully implemented; a helper self-service UI is out of scope.

### 3.5 Some backend endpoints are intentionally unused

| Endpoint | Reason |
| --- | --- |
| `POST /auth/logout-all` | No UI requested; single-session logout is implemented. |
| `POST /auth/change-password` | The API method exists in `adminApi`, but no password-change screen was requested; the account menu links to settings rather than presenting a dead form. |
| `GET /reviews/summary` | Admin reporting uses `/admin/reports/*`, which already aggregates ratings. |
| `GET /recordings/:id/stream` | Admin playback uses the short-lived `/recordings/:id/playback-url` endpoint; the raw stream endpoint is not exposed to the browser. |
| `GET /admin/admins` | Used only for super-admin assignment/filtering. Regular admins get an "assign to me" option because this endpoint is super-admin-only. |

### 3.6 Administrator list is role-restricted

`GET /admin/admins` requires `SUPER_ADMIN`. The complaints page handles this explicitly:

- super admins can assign/filter across all active administrators;
- regular admins can assign and filter to their own account only;
- the UI never shows an empty, unexplained assignee dropdown.

User creation/deactivation is shown only to super admins under `/admin/settings`.

### 3.7 Customer playback of session recordings is not offered

`GET /recordings/session/:id` is admin-only even though some recording routes accept customer auth. The customer service page uses `GET /service-sessions/:id` `recordingConsent` to show consent state, but it never requests or renders an audio source. No covert recording or unverified playback indicator exists.

### 3.8 Raw ObjectId references are resolved client-side

Many backend list endpoints return raw `helper`, `customer`, `location`, and `serviceCategory` ObjectIds. Admin list pages resolve them through directory/catalogue queries (helpers and customers limited to 100 recent records). If a record falls outside that window, the UI shows a short-ID fallback instead of a blank cell.

**Gap:** A backend populate option or lookup endpoint would remove this client-side resolution.

### 3.9 Reporting shape normalization

`financialReport.outstanding` is returned as a MongoDB aggregation array. Both the dashboard and reports page normalize the first element before reading `outstandingPkr` and `count`. Other report objects are used exactly as returned.

### 3.10 Rules remain backend-authoritative

The UI displays the configured rules (`Rs. 500 / 70-minute block`, five verified 5-star reviews → `Rs. 500`, 20 one-star reviews → `Rs. 170/hour`, 26 attendance days → `Rs. 2,000`, three consecutive qualifying months → `Rs. 1,800`, Tip Champion `Rs. 5,000`/`Rs. 7,000`), but it never computes or mutates them. Monthly calculations, incentive approval/payment, and disciplinary decisions go through the backend only. Three upheld complaints open a **review workflow**; no salary deduction or termination is performed by the frontend or the complaint workflow.

### 3.11 Legal wording is not final

`/privacy` and `/terms` state that text about recording, consent, and retention is subject to venue legal review. Settings exposes the backend-owned configuration; it does not record legal approval.

---

## 4. Recording implementation note

The browser recorder emits **one 8 kHz mono WAV chunk** per voice-feedback recording. Backend `detectAudioFormat` inspects each chunk independently; splitting a WAV header across multiple chunks fails detection. 8 kHz keeps a 600-second recording below the 10 MB per-chunk limit. Upload progress, re-record, checksum, finalize, and backend status polling are implemented. Playback URLs are requested only by an admin with a reason of at least three characters and expire according to backend settings.

---

## 5. Verification performed

- `npm run build` — passes for the web app.
- Backend `npm test` — 78 tests passed, 0 failed.
- Live smoke checks — public settings/pricing/QR resolution, staff login, admin dashboard, reports, and read-only list endpoints. Commands and results are recorded in `DELIVERY.md`.

No backend files were modified for these checks.
