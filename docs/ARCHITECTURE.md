# Architecture

Sanabil uses a monorepo layout with independent `frontend` and `backend` workspaces. The browser never inspects Google Drive contents; it only opens an approved destination URL after a student selects a subject and destination.

Backend feature modules follow this request flow:

```text
Route -> Validator -> Controller -> Service -> Repository -> Prisma -> MySQL
```

The Prisma schema contains `Admin`, `Subject`, and `DriveLink`. `Subject.grade` uses the fixed `Grade` enum (`TENTH`, `ELEVENTH`, `TAWJIHI`) rather than a separate grade table because grades have no independent lifecycle in this phase. A subject has many ordered Drive links. Subject API deletion is a soft deactivation and never removes or cascades Drive links.

Admin JWTs will be stored in HttpOnly cookies. Production cookies are Secure. Credentialed CORS uses explicit configured origins. SameSite is selected according to the deployed frontend/backend topology; a cross-site `SameSite=None` deployment requires CSRF protection.

Authentication follows route → validator → controller → service → repository → Prisma. Login errors are generic. JWT claims contain only admin ID and role; authenticated requests reload the admin to enforce active state.

The subjects module is split into dedicated route, schema, controller, service, repository, and type layers. Routes wire validation and authentication; controllers translate HTTP data; the service owns normalization, duplicate checks, filters, existence rules, and deactivation; the repository contains Prisma queries only. Admin list filtering occurs in MySQL and public queries always force `isActive=true` before safe-field mapping.

The Drive Links module follows the same layers. Its service validates parent Subjects, append ordering, explicit status changes, permanent deletion, and same-Subject reorder membership. Its repository owns deterministic queries and performs reorders atomically in a Prisma transaction. URL validation parses the URL and requires HTTPS plus the exact `drive.google.com` hostname, preventing lookalike domains. Admins can manage links under inactive Subjects, but the public service treats inactive Subjects as unavailable and returns active links only.

The student frontend has no independent production Subject/Drive Link dataset. Grade selection calls the public Subjects API, and `/subjects/[slug]` calls the public Drive Links API. The admin frontend uses dedicated typed Subject and Drive Link services over the shared credentialed Axios client. Existing real Drive destinations are idempotently preserved by the database seed so the backend is the content source of truth.

The Prisma client is cached during development reloads. The committed migration must be applied to MySQL before database-backed authentication or seeding can run.
