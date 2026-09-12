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
- Local, ordered announcements with an accessible details dialog.
- Responsive footer with direct phone and WhatsApp contact links.
- Arabic RTL frontend foundation with Sanabil navy and gold branding.
- Express REST API foundation, health endpoint, and HttpOnly cookie-based admin authentication.
- Arabic admin login and protected responsive dashboard shell at `/admin/login` and `/admin/dashboard`.
- Protected Arabic grade management at `/admin/dashboard/grades` with add, edit, activate/deactivate, subject counts, and persisted ordering.
- Protected Arabic subject management at `/admin/dashboard/subjects` with dynamic Grade/status filters, create, edit, activate, and soft-deactivate actions.
- Protected Arabic Drive Link management at `/admin/dashboard/drive-links` with combined filters, create/edit, explicit activation, permanent deletion, and per-Subject reordering.
- Dynamic database-backed Grades and protected admin/public Grade and Subject APIs.
- Prisma entities: `Admin`, `Grade`, `Subject`, and `DriveLink`.
- A subject owns zero or more ordered Drive destination links.
- Environment templates keep credentials and secrets out of source control.

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

Announcement content is maintained in frontend/src/data/announcements.ts and is accessed only through announcementService. Active/date filtering and ordering are handled by the service so it can later be replaced with an API implementation.

Admin users sign in at `/admin/login`. The frontend validates the existing HttpOnly-cookie session through the configured API and protects `/admin/dashboard` before rendering management content. Grades, Subjects, and Drive Links are enabled; only Announcements remain marked as upcoming.

Grade management is available at `/admin/dashboard/grades`; `عرض المواد` opens `/admin/dashboard/subjects?gradeId=<id>`. Grades are never hard-deleted through the admin API. Subject management remains at `/admin/dashboard/subjects`, and its `إدارة الروابط` action opens the selected Subject in `/admin/dashboard/drive-links?subjectId=<id>`. Subject `DELETE` performs reversible deactivation; Drive Link status changes use the dedicated status endpoint, while Drive Link `DELETE` is intentionally permanent. New links must use HTTPS and the exact `drive.google.com` hostname. Ordering is scoped to each Subject and persisted immediately.

The current discount announcement uses the supplied local image at frontend/public/announcements/sanabil-50-off-v2.png. Its details dialog presents the image as a softened background with a dark lower gradient behind the announcement text.

Run project checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Dependencies

The frontend uses Next.js 16, React 19, Axios, Tailwind CSS 4, TypeScript, ESLint, Vitest, and frontend-only Testing Library/jsdom development dependencies.

The backend uses Express 5, Prisma, MySQL, Zod, bcrypt, JSON Web Tokens, Helmet, CORS, cookie-parser, TypeScript, ESLint, Supertest, and Vitest.

## Vercel deployment

Create a Vercel project from this repository with these exact settings:

- Root Directory: frontend
- Framework Preset: Next.js
- Install Command: npm install
- Build Command: npm run build
- Output Directory: leave blank (Next.js default)
- Node.js Version: 22.x

Set `NEXT_PUBLIC_API_URL` in Vercel to the production API origin. `frontend/vercel.json` declares the Next.js framework; student content and admin operations communicate with the backend through the shared Axios client.
