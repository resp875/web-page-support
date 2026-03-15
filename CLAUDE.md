# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server with Turbopack (localhost:3000)
npm run build      # Production build (Node.js)
npm run preview    # OpenNext Cloudflare build + local preview (localhost:8787)
npm run deploy     # Build and deploy to Cloudflare Workers
npm run lint       # ESLint
```

There are no automated tests — use `docs/e2e-checklist.md` for manual E2E validation.

## Architecture Overview

This is a **Next.js 16 App Router** application serving as a self-service portal for Android closed test enrollment, deployed on Cloudflare Workers via OpenNext.

### Key Abstractions

**Dual-mode data store** (`src/lib/android-test-request-store.ts`):
- With `DATABASE_URL`: persists jobs to PostgreSQL (Neon serverless)
- Without `DATABASE_URL`: in-memory Map fallback (dev only)

**Enrollment provider** (`src/lib/android-test-enrollment-service.ts`):
- `manual` / `mock`: no-op, operator handles in Play Console manually
- `google-play`: calls Google Play Developer API to add testers automatically
- Controlled by `ANDROID_ENROLLMENT_PROVIDER` env var

**Job status flow**: `queued → awaiting_manual → done / failed`

### API Structure

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/closed-test/android-request` | Auth0 session | Submit enrollment request |
| `GET /api/closed-test/android-request/:id` | Auth0 session | Poll request status |
| `POST /api/closed-test/android-request/:id/transition` | `x-job-admin-key` | Admin: advance job status |
| `GET /api/admin/android-requests` | `x-job-admin-key` | Admin: list all requests |
| `GET /api/admin/android-requests/:id/audit` | `x-job-admin-key` | Admin: view audit log |
| `GET /api/content/manuals` | Auth0 session | Member-only operation manuals |
| `GET /api/content/events` | Auth0 session | Member-only event info |
| `GET/POST /api/auth/[...auth0]` | — | Auth0 callback handler |

Deprecated endpoints (`/api/cron/*`) return 410 Gone.

### Authentication

Auth0 integration via `src/lib/auth0.ts` (singleton `Auth0Client`). Session stored as HTTPOnly cookie `auth_session`. Session extraction: `src/lib/auth-session.ts`.

Admin APIs authenticate via `x-job-admin-key` header matching `JOB_ADMIN_KEY` env var.

### Frontend Pages

- `src/app/page.tsx` — Dual-mode: shows public landing (unauthenticated) or member dashboard (authenticated)
- `src/app/admin/android-requests/page.tsx` — Admin UI for managing enrollment requests
- Static HTML pages for `/privacy_policy` and `/child_safety_policy` served via `next.config.ts` rewrites

### Member Content

`src/lib/member-content.ts` defines the operation manuals and event data returned by `/api/content/*`. Edit this file to update member-facing content.

## Key Documentation

All docs are in `docs/` (written in Japanese):
- `docs/specification.md` — Full API spec (v1.15)
- `docs/decision-log.md` — Architecture decisions with rationale
- `docs/operation-runbook.md` — Operator procedures
- `docs/monitoring-metrics.md` — KPI definitions
- `docs/sql/` — DB schema and migration files

## Environment Variables

Required for full functionality:

```env
# Auth0
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_SECRET=           # 32-char random string
AUTH0_APP_BASE_URL=     # http://localhost:3000 or production URL

# Database (omit to use in-memory fallback)
DATABASE_URL=postgresql://...?sslmode=require

# Android enrollment
ANDROID_ENROLLMENT_PROVIDER=manual   # manual | google-play
ANDROID_TEST_JOIN_URL=               # Play Store test track URL
JOB_ADMIN_KEY=                       # Admin API auth key
```

Optional:
```env
ANDROID_REQUEST_NOTIFY_WEBHOOK_URL=  # Webhook for new request notifications
ANDROID_REQUEST_NOTIFY_BEARER_TOKEN= # Auth token for webhook
ANDROID_REQUEST_ADMIN_PAGE_URL=      # Admin URL included in notifications
ANDROID_MOCK_FORCE_FAIL=true         # Force all enrollments to fail
ANDROID_MOCK_FAIL_SUFFIXES=a,b       # Fail requests by ID suffix (comma-separated)
```

For Google Play provider additionally:
```env
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PLAY_PRIVATE_KEY=
GOOGLE_PLAY_PACKAGE_NAME=
GOOGLE_PLAY_TRACK=closed             # default
GOOGLE_PLAY_TESTERS_GROUP=           # Google Group for testers
```

Local dev: use `.env.local` (Node) or `.dev.vars` (Cloudflare Workers via `npm run preview`).

## Database Setup

Run schema from `docs/sql/android_test_request_jobs.sql`. For existing databases, apply migrations in `docs/sql/migrations/` in chronological order.
