# Architecture

Sanabil uses a monorepo layout with independent `frontend` and `backend` workspaces. The browser never inspects Google Drive contents; it only opens an approved destination URL after a student selects a subject and destination.

Backend feature modules follow this request flow:

```text
Route -> Validator -> Controller -> Service -> Repository -> Prisma -> MySQL
```

The Prisma schema contains `Admin`, `Grade`, `Subject`, `DriveLink`, and `Announcement`. A Grade owns many Subjects through the required `Subject.gradeId` foreign key with restricted deletion, and a Subject owns many ordered Drive Links. Grade and Subject admin behavior uses soft deactivation; Announcements use explicit activation and optional scheduling, with no hard delete.

Admin JWTs will be stored in HttpOnly cookies. Production cookies are Secure. Credentialed CORS uses explicit configured origins. SameSite is selected according to the deployed frontend/backend topology; a cross-site `SameSite=None` deployment requires CSRF protection.

Authentication follows route → validator → controller → service → repository → Prisma. Login errors are generic. JWT claims contain only admin ID and role; authenticated requests reload the admin to enforce active state.

The Grades and Subjects modules are each split into dedicated route, schema, controller, service, repository, and type layers. Routes wire validation and authentication; controllers translate HTTP data; services own normalization, duplicate/existence checks, status and ordering rules; repositories contain Prisma queries only. Grade reordering is transactional. Admin Subject input and filtering use `gradeId`; public filtering uses a stable Grade slug. Public queries require both the Grade and Subject to be active before safe-field mapping.

The Drive Links module follows the same layers. Its service validates parent Subjects, append ordering, explicit status changes, permanent deletion, and same-Subject reorder membership. Its repository owns deterministic queries and performs reorders atomically in a Prisma transaction. URL validation parses the URL and requires HTTPS plus the exact `drive.google.com` hostname, preventing lookalike domains. Admins can manage links under inactive Subjects or Grades, but the public service treats either inactive parent as unavailable and returns active links only.

The student frontend has no independent Grade, Subject, or Drive Link source of truth. It loads active Grades in API order, calls the public Subjects API with the selected Grade slug, and `/subjects/[slug]` calls the public Drive Links API. The admin frontend uses dedicated typed Grade, Subject, and Drive Link services over the shared credentialed Axios client.

Announcements follow the same route, validation, controller, service, repository, and Prisma layers. CTA labels and HTTPS URLs are an all-or-nothing pair, date windows are validated before persistence, and reorder batches are transactional. Optional images are validated by MIME type and file signature, capped at 5 MB, stored with random names under `backend/uploads/announcements`, and served read-only from `/uploads/announcements`; replaced files are removed after the database update succeeds. The public repository returns only active announcements inside the inclusive schedule window and exposes safe fields. The student homepage fetches this endpoint client-side with loading, hidden-empty, retryable-error, and accessible dialog states; no local production announcement data source remains.

The dashboard summary module aggregates active counts without loading full lists. Active Subject and Drive Link counts honor their active parent hierarchy. Profile updates use a dedicated repository while authentication continues to resolve the current admin by JWT subject ID. Email changes therefore preserve the session; password changes verify the current bcrypt hash, apply the shared strength rule, store a new bcrypt hash, and also preserve the session. Seed credentials remain bootstrap-only.

Admin navigation exposes all implemented content areas plus Settings and adds a lightweight current-page breadcrumb in the shell. Grade-to-Subject and Subject-to-Drive-Link query navigation remains unchanged.

Migration `20260912000200_dynamic_grades` creates and seeds the three canonical Grade rows, adds nullable `subjects.grade_id`, maps every historical enum value by slug, makes the foreign key required, and only then removes the old enum column. The NOT NULL transition is the integrity gate: it fails instead of silently accepting an unmapped Subject. Existing Subject IDs, states, slugs, and all Drive Link rows are untouched. The idempotent seed subsequently resolves Grade IDs by slug and preserves existing real Drive destinations.

Migration `20260912000300_add_announcements` only creates the UTF-8 `announcements` table and its active/order index. It does not seed content, modify earlier tables, or reset data.

Migration `20260912000400_add_announcement_images` adds the nullable image path. Migration `20260912000500_restore_legacy_announcements` restores the two announcements that previously shipped in the frontend, without duplicating matching titles.

Public visibility is hierarchical: an inactive Grade hides its Subjects and their links; an inactive Subject hides its links; inactive Drive Links are omitted; and inactive or out-of-window Announcements are omitted.

The Prisma client is cached during development reloads. The committed migration must be applied to MySQL before database-backed authentication or seeding can run.
