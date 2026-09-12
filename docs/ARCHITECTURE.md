# Architecture

Sanabil uses a monorepo layout with independent `frontend` and `backend` workspaces. The browser never inspects Google Drive contents; it only opens an approved destination URL after a student selects a subject and destination.

Backend feature modules follow this request flow:

```text
Route -> Validator -> Controller -> Service -> Repository -> Prisma -> MySQL
```

The Prisma schema contains `Admin`, `Grade`, `Subject`, and `DriveLink`. A Grade owns many Subjects through the required `Subject.gradeId` foreign key with restricted deletion, and a Subject owns many ordered Drive Links. Grade and Subject admin behavior uses soft deactivation; it never removes or cascades their content.

Admin JWTs will be stored in HttpOnly cookies. Production cookies are Secure. Credentialed CORS uses explicit configured origins. SameSite is selected according to the deployed frontend/backend topology; a cross-site `SameSite=None` deployment requires CSRF protection.

Authentication follows route → validator → controller → service → repository → Prisma. Login errors are generic. JWT claims contain only admin ID and role; authenticated requests reload the admin to enforce active state.

The Grades and Subjects modules are each split into dedicated route, schema, controller, service, repository, and type layers. Routes wire validation and authentication; controllers translate HTTP data; services own normalization, duplicate/existence checks, status and ordering rules; repositories contain Prisma queries only. Grade reordering is transactional. Admin Subject input and filtering use `gradeId`; public filtering uses a stable Grade slug. Public queries require both the Grade and Subject to be active before safe-field mapping.

The Drive Links module follows the same layers. Its service validates parent Subjects, append ordering, explicit status changes, permanent deletion, and same-Subject reorder membership. Its repository owns deterministic queries and performs reorders atomically in a Prisma transaction. URL validation parses the URL and requires HTTPS plus the exact `drive.google.com` hostname, preventing lookalike domains. Admins can manage links under inactive Subjects or Grades, but the public service treats either inactive parent as unavailable and returns active links only.

The student frontend has no independent Grade, Subject, or Drive Link source of truth. It loads active Grades in API order, calls the public Subjects API with the selected Grade slug, and `/subjects/[slug]` calls the public Drive Links API. The admin frontend uses dedicated typed Grade, Subject, and Drive Link services over the shared credentialed Axios client.

Migration `20260912000200_dynamic_grades` creates and seeds the three canonical Grade rows, adds nullable `subjects.grade_id`, maps every historical enum value by slug, makes the foreign key required, and only then removes the old enum column. The NOT NULL transition is the integrity gate: it fails instead of silently accepting an unmapped Subject. Existing Subject IDs, states, slugs, and all Drive Link rows are untouched. The idempotent seed subsequently resolves Grade IDs by slug and preserves existing real Drive destinations.

The Prisma client is cached during development reloads. The committed migration must be applied to MySQL before database-backed authentication or seeding can run.
