# API

## Implemented

### `GET /api/health`

Returns the API health state.

## Authentication

- POST /api/auth/login validates credentials, sets the HttpOnly cookie, and returns safe admin data.
- POST /api/auth/logout clears the cookie.
- GET /api/auth/me verifies the cookie and reloads the active admin.

## Admin Grades

All routes require the authenticated admin cookie:

```text
GET    /api/admin/grades
GET    /api/admin/grades/:id
POST   /api/admin/grades
PUT    /api/admin/grades/:id
PATCH  /api/admin/grades/:id/status
PATCH  /api/admin/grades/reorder
```

The list supports `status=active|inactive|all` (default `all`) and returns `subjectCount`, ordered by `sortOrder` then ID. Names are trimmed; slugs are lowercased, URL-safe, and unique. Create may omit `sortOrder` to append predictably. Status changes are reversible; there is no Grade hard-delete endpoint.

Reorder accepts a non-empty `items` array of unique positive IDs and non-negative integer positions. The repository persists the batch in a Prisma transaction.

## Admin subjects

All routes below require the authenticated admin cookie. Both `ADMIN` and `SUPER_ADMIN` may manage subjects.

```text
GET    /api/admin/subjects
GET    /api/admin/subjects/:id
POST   /api/admin/subjects
PUT    /api/admin/subjects/:id
DELETE /api/admin/subjects/:id
```

`GET /api/admin/subjects` supports `status=active|inactive|all` (default `all`) and optional numeric `gradeId`. Results are ordered by Grade order, Subject name, then ID. Detail requests accept positive integer IDs and return active or inactive Subjects with their Grade relation, without Drive-link data.

Create requests require `name`, `slug`, and an existing `gradeId`; `isActive` defaults to `true`. `PUT` uses full-update semantics and requires all four editable fields. Slugs are trimmed, lowercased, URL-safe, and globally unique.

`DELETE /api/admin/subjects/:id` never removes a row or cascades to Drive links. It sets `isActive=false` and returns the unchanged inactive subject when called again.

Example create/update shape:

```json
{
  "name": "الرياضيات",
  "slug": "mathematics",
  "gradeId": 3,
  "isActive": true
}
```

## Public Grades and subjects

`GET /api/public/grades` requires no authentication. It returns active Grades only with `id`, `name`, `slug`, and `sortOrder`, ordered by `sortOrder` then ID.

`GET /api/public/subjects` requires no authentication and returns only active Subjects whose parent Grade is active. It accepts an optional readable Grade slug such as `grade=tawjihi`, and returns safe nested Grade identity. Missing or inactive Grade slugs return not found.

## Admin Drive Links

All routes require the authenticated admin cookie:

```text
GET    /api/admin/drive-links
GET    /api/admin/drive-links/:id
POST   /api/admin/drive-links
PUT    /api/admin/drive-links/:id
DELETE /api/admin/drive-links/:id
PATCH  /api/admin/drive-links/:id/status
PATCH  /api/admin/drive-links/reorder
```

The list accepts optional `subjectId` and numeric `gradeId`, plus `status=active|inactive|all` (default `all`). Filters are combined in the database and results are ordered by `sortOrder`, then `id`. Parent Subject and Grade information is included for the admin UI, even when either record is inactive.

Create and full-update bodies use `title`, nullable `description`, `subjectId`, `driveUrl`, `sortOrder`, and `isActive`; create may omit `sortOrder` to append after the Subject's current maximum. The Subject must exist. URLs must be valid HTTPS URLs whose exact hostname is `drive.google.com`.

`PATCH /:id/status` accepts `{ "isActive": true|false }`. `DELETE /:id` physically and permanently deletes only that Drive Link; it is not the deactivation operation and never deletes the Subject.

Reordering is scoped to one Subject and accepts:

```json
{
  "subjectId": 12,
  "items": [
    { "id": 5, "sortOrder": 1 },
    { "id": 8, "sortOrder": 2 }
  ]
}
```

IDs must be unique and all links must belong to `subjectId`. Updates run atomically in a Prisma transaction.

## Public Drive Links

```text
GET /api/public/subjects/:slug/drive-links
```

No authentication is required. The Subject and its parent Grade must both exist and be active. The response includes safe Subject/Grade identity plus active Drive Links only (`id`, `title`, `description`, `driveUrl`, `sortOrder`), ordered by `sortOrder`, then `id`. Missing or inactive content returns the standard not-found response.
