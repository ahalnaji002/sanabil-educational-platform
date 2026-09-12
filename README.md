# Sanabil Educational Platform

## Project Overview

Sanabil is an Arabic-first educational platform for students across Palestine. Feature 1 provides a curated path from a subject to approved Google Drive destination folders. The platform does not index or reproduce the files inside Google Drive.

The repository is split into independently deployable applications:

- `frontend`: Next.js 16, React, TypeScript, Tailwind CSS, and Axios.
- `backend`: Express 5, TypeScript, Prisma, MySQL, Zod, JWT, and bcrypt.

## Features

- Student-facing Arabic RTL homepage with a responsive grade-first subject flow.
- Pre-rendered subject destination pages at /subjects/[slug].
- Compact subject-to-subject quick navigation on every subject destination page.
- Seven local subjects, including Biology and Scientific Technology.
- Replaceable local subject service; no backend or database is required for the frontend MVP.
- Safe Google Drive destination behavior: links open in a new tab only when an approved URL exists.
- Official Sanabil logo and Alexandria Arabic typography.
- Local, ordered announcements with an accessible details dialog.
- Responsive footer with direct phone and WhatsApp contact links.
- Arabic RTL frontend foundation with Sanabil navy and gold branding.
- Express REST API foundation, health endpoint, and HttpOnly cookie-based admin authentication.
- Arabic admin login and protected responsive dashboard shell at `/admin/login` and `/admin/dashboard`.
- Protected Arabic subject management at `/admin/dashboard/subjects` with server-side grade/status filters, create, edit, activate, and soft-deactivate actions.
- Fixed database grade enum (`TENTH`, `ELEVENTH`, `TAWJIHI`) and protected admin/public subject APIs.
- Initial Prisma entities: `Admin`, `Subject`, and `DriveLink` only.
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

Apply the committed migration and seed the idempotent super-admin:

```bash
npm run prisma:migrate --workspace backend
npm run prisma:seed --workspace backend
```

The seed reads credentials from the environment, hashes the password, and upserts by normalized email. It also upserts seven local development subjects across the three fixed grades without creating Drive links or fake Drive URLs.

Start the applications in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

For the frontend-only MVP, run npm run dev:frontend and open http://localhost:3000. Students select عاشر, حادي عشر, or توجيهي before seeing grade-specific subjects; current subject content belongs to توجيهي, while the other grades show a coming-soon state. Grade options are maintained in frontend/src/data/grades.ts and subjects are associated through their gradeId in frontend/src/data/subjects.ts. Replace a null driveUrl only with its approved Sanabil Google Drive destination.

Announcement content is maintained in frontend/src/data/announcements.ts and is accessed only through announcementService. Active/date filtering and ordering are handled by the service so it can later be replaced with an API implementation.

Admin users sign in at `/admin/login`. The frontend validates the existing HttpOnly-cookie session through the configured API and protects `/admin/dashboard` before rendering management content. Dashboard content-management sections are intentionally disabled until their later implementation phases.

Subject management is available at `/admin/dashboard/subjects`. Admin requests use `/api/admin/subjects`, where `DELETE` performs reversible deactivation rather than physical deletion. The unauthenticated `/api/public/subjects` endpoint exposes active subjects only and is ready for a later student-frontend migration; the current public pages continue using local frontend subject data.

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

Set `NEXT_PUBLIC_API_URL` in Vercel to the production API origin. `frontend/vercel.json` declares the Next.js framework; public subject content remains statically pre-rendered, while admin authentication communicates with the existing backend from the browser using credentialed requests.
