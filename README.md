# Sanabil Educational Platform

## Project Overview

Sanabil is an Arabic-first educational platform for students across Palestine. Feature 1 provides a curated path from a subject to approved Google Drive destination folders. The platform does not index or reproduce the files inside Google Drive.

The repository is split into independently deployable applications:

- `frontend`: Next.js 16, React, TypeScript, Tailwind CSS, and Axios.
- `backend`: Express 5, TypeScript, Prisma, MySQL, Zod, JWT, and bcrypt.

## Features

- Student-facing Arabic RTL homepage with a responsive, API-driven grade-first subject flow.
- Database-driven subject destination pages at `/subjects/[slug]`.
- Compact subject-to-subject quick navigation on every subject destination page.
- Student subject discovery and Drive destinations use unauthenticated public content APIs.
- Safe Google Drive destination behavior: links open in a new tab only when an approved URL exists.
- Official Sanabil logo and Alexandria Arabic typography.
- API-driven, ordered and scheduled announcements with optional uploaded images and an accessible details dialog.
- Responsive footer with direct phone and WhatsApp contact links.
- Arabic RTL frontend foundation with Sanabil navy and gold branding.
- Express REST API foundation, health endpoint, and HttpOnly cookie-based admin authentication.
- Production-safe per-IP API rate limiting behind one trusted Nginx proxy: 200 API requests per 15 minutes, plus a stricter login limit of five failed attempts per 15 minutes; health monitoring is excluded.
- Arabic admin login and protected responsive dashboard shell at `/admin/login` and `/admin/dashboard`.
- Protected Arabic grade management at `/admin/dashboard/grades` with add, edit, activate/deactivate, subject counts, and persisted ordering.
- Protected Arabic subject management at `/admin/dashboard/subjects` with dynamic Grade/status filters, create, edit, activate, soft-deactivate, and persisted per-Grade ordering.
- Protected Arabic Drive Link management at `/admin/dashboard/drive-links` with combined filters, create/edit, explicit activation, permanent deletion, and per-Subject reordering.
- Protected Arabic Announcement management at `/admin/dashboard/announcements` with create/edit, activation, scheduling, CTA validation, and persisted ordering.
- Admin profile and password settings at `/admin/dashboard/settings`, plus real active-content counts on the dashboard.
- Dynamic database-backed Grades and protected admin/public Grade and Subject APIs.
- Prisma entities: `Admin`, `Grade`, `Subject`, `DriveLink`, and `Announcement`.
- A subject owns zero or more ordered Drive destination links.
- Environment templates keep credentials and secrets out of source control.
- GitHub Actions CI validates both workspaces on pull requests and pushes to `main`; successful `main` builds deploy the backend through the restricted VPS deployment wrapper while Vercel continues to deploy the frontend.

Authentication routes are POST /api/auth/login, POST /api/auth/logout, and GET /api/auth/me. Login never returns the JWT in JSON.

## Setup

Requirements:

- Node.js 20.9 or newer.
- MySQL 8.4 LTS.

Install dependencies from the repository root:

```bash
npm install
```

Copy `backend/.env.example` to `backend/.env` and replace every placeholder. Copy `frontend/.env.example` to `frontend/.env.local`, then set `NEXT_PUBLIC_API_URL` to the API origin without a trailing `/api` path (for example, the local API origin during development).

Backend variables are validated at startup. JWT_SECRET must be strong and at least 32 characters. FRONTEND_ORIGIN is explicit. Cookies are always HttpOnly, Secure in production, and default to SameSite=Lax. SameSite=None is unsupported until CSRF protection is added.

Generate the Prisma client:

```bash
npm run prisma:generate --workspace backend
```

Apply the committed migrations, then run the idempotent bootstrap seed when initializing or reconciling an environment:

```bash
npm run prisma:migrate --workspace backend
npm run prisma:seed --workspace backend
```

The seed reads credentials from the environment, hashes the password, and upserts by normalized email. It upserts Grades by slug, resolves each Subject's `gradeId`, and idempotently preserves the real Google Drive destinations; it creates no fake Drive URLs and does not overwrite existing matching links.

Start the applications in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Open http://localhost:3000 after starting both applications. The browser loads active Grades from `/api/public/grades` in administrator-defined order, then requests active Subjects using the selected Grade slug through `/api/public/subjects?grade=<slug>`. Opening a Subject requests its active links from `/api/public/subjects/:slug/drive-links`. Empty grades and Subjects show friendly Arabic states; deactivating a Grade hides both its Subjects and Drive Links from students without deleting data.

Announcement content is managed through the protected admin page and loaded from `/api/public/announcements`. An admin may optionally upload a JPEG, PNG, or WebP image up to 5 MB; runtime files are stored under `backend/uploads/announcements` and must be kept persistent and included in server backups. Production reverse proxies must allow request bodies of at least 5 MB (for Nginx, use `client_max_body_size 6m;`). The backend is the only production source of truth; inactive, future, and expired announcements are excluded from the student homepage.

Admin users sign in at `/admin/login`. The frontend validates the existing HttpOnly-cookie session through the configured API and protects `/admin/dashboard` before rendering management content. Grades, Subjects, Drive Links, Announcements, and Settings are enabled. The dashboard obtains active counts from `/api/admin/dashboard/summary`.

Grade management is available at `/admin/dashboard/grades`; `عرض المواد` opens `/admin/dashboard/subjects?gradeId=<id>`. Grades are never hard-deleted through the admin API. Subject management remains at `/admin/dashboard/subjects`, and its `إدارة الروابط` action opens the selected Subject in `/admin/dashboard/drive-links?subjectId=<id>`. To reorder Subjects, select one Grade and the `الكل` status, then use the up/down controls; changes are persisted through `PATCH /api/admin/subjects/reorder` and control the student-facing order for that Grade. Subject `DELETE` performs reversible deactivation; Drive Link status changes use the dedicated status endpoint, while Drive Link `DELETE` is intentionally permanent. New links must use HTTPS and the exact `drive.google.com` hostname. Drive Link ordering is scoped to each Subject and persisted immediately.

Profile settings update the authenticated admin by database ID, so changing the normalized unique email does not end the current session. Password changes require the current password plus at least eight characters, one uppercase letter, one lowercase letter, one digit, and matching confirmation. The current session remains valid. `SEED_ADMIN_*` variables are only for initial database bootstrap and are not used for routine profile editing.

Run project checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Dependencies

The frontend uses Next.js 16, React 19, Axios, Tailwind CSS 4, TypeScript, ESLint, Vitest, and frontend-only Testing Library/jsdom development dependencies.

The backend uses Express 5, express-rate-limit, Prisma, MySQL, Zod, Multer, bcrypt, JSON Web Tokens, Helmet, CORS, cookie-parser, TypeScript, ESLint, Supertest, and Vitest.

## Vercel deployment

Create a Vercel project from this repository with these exact settings:

- Root Directory: frontend
- Framework Preset: Next.js
- Install Command: npm install
- Build Command: npm run build
- Output Directory: leave blank (Next.js default)
- Node.js Version: 22.x

Set `NEXT_PUBLIC_API_URL` in Vercel to the production API origin. `frontend/vercel.json` declares the Next.js framework; student content and admin operations communicate with the backend through the shared Axios client.

Production CI/CD, backend deployment, Prisma migration safety, required GitHub Environment secret names, recovery guidance, and the manual fallback are documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
