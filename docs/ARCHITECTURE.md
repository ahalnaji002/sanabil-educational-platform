# Architecture

Sanabil uses a monorepo layout with independent `frontend` and `backend` workspaces. The browser never inspects Google Drive contents; it only opens an approved destination URL after a student selects a subject and destination.

Backend feature modules follow this request flow:

```text
Route -> Validator -> Controller -> Service -> Repository -> Prisma -> MySQL
```

The Prisma schema contains `Admin`, `Subject`, and `DriveLink`. `Subject.grade` uses the fixed `Grade` enum (`TENTH`, `ELEVENTH`, `TAWJIHI`) rather than a separate grade table because grades have no independent lifecycle in this phase. A subject has many ordered Drive links. Subject API deletion is a soft deactivation and never removes or cascades Drive links.

Admin JWTs will be stored in HttpOnly cookies. Production cookies are Secure. Credentialed CORS uses explicit configured origins. SameSite is selected according to the deployed frontend/backend topology; a cross-site `SameSite=None` deployment requires CSRF protection.

Authentication follows route → validator → controller → service → repository → Prisma. Login errors are generic. JWT claims contain only admin ID and role; authenticated requests reload the admin to enforce active state.

The subjects module is split into dedicated route, schema, controller, service, repository, and optional type layers. Routes wire validation and authentication; controllers translate HTTP data; the service owns normalization, duplicate checks, filters, existence rules, and deactivation; the repository contains Prisma queries only. Admin list filtering occurs in MySQL and public queries always force `isActive=true` before safe-field mapping.

The student-facing frontend continues to use local subject and Drive-link data. The new public subject endpoint is intentionally not wired into student pages yet. The admin frontend uses one typed subject service over the shared credentialed Axios client.

The Prisma client is cached during development reloads. The committed migration must be applied to MySQL before database-backed authentication or seeding can run.
