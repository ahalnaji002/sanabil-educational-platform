# API

## Implemented

### `GET /api/health`

Returns the API health state.

## Authentication

- POST /api/auth/login validates credentials, sets the HttpOnly cookie, and returns safe admin data.
- POST /api/auth/logout clears the cookie.
- GET /api/auth/me verifies the cookie and reloads the active admin.

## Upcoming endpoints

```text
GET    /api/admin/subjects
GET    /api/admin/subjects/:id
POST   /api/admin/subjects
PUT    /api/admin/subjects/:id
DELETE /api/admin/subjects/:id

GET    /api/admin/subjects/:subjectId/links
GET    /api/admin/drive-links/:id
POST   /api/admin/subjects/:subjectId/links
PUT    /api/admin/drive-links/:id
DELETE /api/admin/drive-links/:id
PATCH  /api/admin/subjects/:subjectId/links/reorder

GET /api/public/subjects
GET /api/public/subjects/:slug
```

The slug endpoint returns one active subject with its active Drive links ordered by `sortOrder` and then `id`.
