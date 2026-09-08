# Sanabil Educational Platform

## Project Overview

Sanabil is an Arabic-first educational platform for students in Gaza, Palestine. Feature 1 provides a curated path from a subject to approved Google Drive destination folders. The platform does not index or reproduce the files inside Google Drive.

The repository is split into independently deployable applications:

- `frontend`: Next.js 16, React, TypeScript, Tailwind CSS, and Axios.
- `backend`: Express 5, TypeScript, Prisma, MySQL, Zod, JWT, and bcrypt.

## Features

- Student-facing Arabic RTL homepage with responsive subject cards.
- Pre-rendered subject destination pages at /subjects/[slug].
- Seven local subjects, including Biology and Scientific Technology.
- Replaceable local subject service; no backend or database is required for the frontend MVP.
- Safe Google Drive destination behavior: links open in a new tab only when an approved URL exists.
- Official Sanabil logo and Alexandria Arabic typography.
- Local, ordered announcements with an accessible details dialog.
- Responsive footer with direct phone and WhatsApp contact links.
- Arabic RTL frontend foundation with Sanabil navy and gold branding.
- Express REST API foundation, health endpoint, and HttpOnly cookie-based admin authentication.
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

Copy `backend/.env.example` to `backend/.env` and replace every placeholder. Copy `frontend/.env.example` to `frontend/.env.local`.

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

The seed reads credentials from the environment, hashes the password, and upserts by normalized email.

Start the applications in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

For the frontend-only MVP, run npm run dev:frontend and open http://localhost:3000. Subject content is maintained in frontend/src/data/subjects.ts. Replace a null driveUrl only with its approved Sanabil Google Drive destination.

Announcement content is maintained in frontend/src/data/announcements.ts and is accessed only through announcementService. Active/date filtering and ordering are handled by the service so it can later be replaced with an API implementation.

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

No environment variables are required while the local subject service is active. frontend/vercel.json declares the Next.js framework. Deployments are statically pre-rendered and do not require the backend.
