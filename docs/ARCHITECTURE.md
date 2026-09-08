# Architecture

Sanabil uses a monorepo layout with independent `frontend` and `backend` workspaces. The browser never inspects Google Drive contents; it only opens an approved destination URL after a student selects a subject and destination.

The backend will follow this request flow:

```text
Route -> Validator -> Controller -> Service -> Repository -> Prisma -> MySQL
```

Feature 1 contains only `Admin`, `Subject`, and `DriveLink`. A subject has many ordered Drive links. Records are deactivated instead of physically deleted through the API.

Admin JWTs will be stored in HttpOnly cookies. Production cookies are Secure. Credentialed CORS uses explicit configured origins. SameSite is selected according to the deployed frontend/backend topology; a cross-site `SameSite=None` deployment requires CSRF protection.

Authentication follows route → validator → controller → service → repository → Prisma. Login errors are generic. JWT claims contain only admin ID and role; authenticated requests reload the admin to enforce active state.

The Prisma client is cached during development reloads. The committed migration must be applied to MySQL before database-backed authentication or seeding can run.
