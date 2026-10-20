# Sanabil Educational Platform

**English** | [العربية](README.ar.md)

## Overview
Sanabil is an Arabic-first educational platform for students in Palestine. Students browse grades and subjects and open approved Google Drive destination links. Sanabil does not host or index the files on Google Drive. A protected administration interface manages educational content.

## Features
- Arabic RTL responsive student interface.
- Grade and subject browsing, subject pages, and approved Google Drive destinations.
- Announcements with ordering, scheduling, optional images, and links.
- Admin authentication and dashboard.
- Grade, subject, Drive link, and announcement management.
- Admin profile and password settings.

## Technology
| Layer | Stack |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Axios |
| Backend | Express 5, Node.js, TypeScript |
| Database | MySQL, Prisma |
| Security | JWT in HttpOnly cookies, Zod, Helmet, CORS, rate limiting |
| Testing | Vitest, Testing Library, Supertest |

## Repository Structure
- `frontend/`: student website and administration interface.
- `backend/`: REST API and database schema.
- `docs/`: operational documentation.
- `README.ar.md`: full Arabic documentation.

## Getting Started
Requires Node.js 20.9+, MySQL 8.4 LTS, and npm.

1. Run `npm install` from the repository root.
2. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local`. Configure local credentials and set `NEXT_PUBLIC_API_URL` to the backend origin without `/api`.
3. Use a local development database and run:

```bash
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend
npm run prisma:seed --workspace backend
```

4. In separate terminals, run:

```bash
npm run dev:backend
npm run dev:frontend
```

Frontend: `http://localhost:3000`. Backend: `http://localhost:4000`. Admin login: `http://localhost:3000/admin/login`.

## API Overview
Public routes include `GET /api/public/grades`, `GET /api/public/subjects`, `GET /api/public/subjects/:slug/drive-links`, and `GET /api/public/announcements`. Authentication uses `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me`. Protected administration routes are under `/api/admin/`.

## Testing and Quality
Run from the repository root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Deployment
The frontend uses Vercel; backend delivery uses GitHub Actions and a VPS deployment wrapper. Merging into `main` can trigger production delivery. See [Deployment Documentation](docs/DEPLOYMENT.md) for migrations, backups, and recovery. Never run development migrations on production.

---

[اقرأ التوثيق بالعربية](README.ar.md)
