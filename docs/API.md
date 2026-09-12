# API

## Implemented

### `GET /api/health`

Returns the API health state.

## Authentication

- POST /api/auth/login validates credentials, sets the HttpOnly cookie, and returns safe admin data.
- POST /api/auth/logout clears the cookie.
- GET /api/auth/me verifies the cookie and reloads the active admin.

## Admin subjects

All routes below require the authenticated admin cookie. Both `ADMIN` and `SUPER_ADMIN` may manage subjects.

```text
GET    /api/admin/subjects
GET    /api/admin/subjects/:id
POST   /api/admin/subjects
PUT    /api/admin/subjects/:id
DELETE /api/admin/subjects/:id
```

`GET /api/admin/subjects` supports `status=active|inactive|all` (default `all`) and optional `grade=TENTH|ELEVENTH|TAWJIHI`. Results are ordered by grade, name, then ID. Detail requests accept positive integer IDs and return active or inactive subjects without Drive-link data.

Create requests require `name`, `slug`, and `grade`; `isActive` defaults to `true`. `PUT` uses full-update semantics and requires all four editable fields. Slugs are trimmed, lowercased, URL-safe, and globally unique.

`DELETE /api/admin/subjects/:id` never removes a row or cascades to Drive links. It sets `isActive=false` and returns the unchanged inactive subject when called again.

Example create/update shape:

```json
{
  "name": "الرياضيات",
  "slug": "mathematics",
  "grade": "TAWJIHI",
  "isActive": true
}
```

## Public subjects

`GET /api/public/subjects` requires no authentication and returns only active subjects with `id`, `name`, `slug`, and `grade`. It accepts the optional fixed-grade filter `grade=TENTH|ELEVENTH|TAWJIHI`; invalid values return a validation error.

## Upcoming endpoints

```text
GET    /api/admin/subjects/:subjectId/links
GET    /api/admin/drive-links/:id
POST   /api/admin/subjects/:subjectId/links
PUT    /api/admin/drive-links/:id
DELETE /api/admin/drive-links/:id
PATCH  /api/admin/subjects/:subjectId/links/reorder

GET /api/public/subjects/:slug
```

The slug endpoint returns one active subject with its active Drive links ordered by `sortOrder` and then `id`.
