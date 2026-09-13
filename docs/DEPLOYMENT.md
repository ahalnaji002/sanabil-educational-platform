# Production Deployment

## Delivery flow

Development changes are reviewed through GitHub. Pull requests targeting `main` run CI only. A push or merge to `main` runs the same CI checks and, after they succeed, deploys the production backend. A manually dispatched workflow also runs CI before allowing a backend deployment.

The workflow uses Node.js 24 and `npm ci`. It validates and generates Prisma, then type-checks, lints, tests, and builds both workspaces. Backend tests use mocked or in-memory repositories and do not require a MySQL service. CI never connects to the production database and never runs database migrations.

## Frontend deployment

Vercel remains the only frontend deployment system. It watches `main` and deploys `frontend` automatically after a Git push. GitHub Actions validates the frontend with `NEXT_PUBLIC_API_URL=https://api.sanabil-platform.space` during the production build, but does not deploy it.

## Backend deployment

The `deploy-backend` GitHub Actions job runs only after CI succeeds for a push to `main` or a valid manual workflow dispatch. It uses the GitHub Environment named `production`, connects to the VPS with OpenSSH, and executes only:

```bash
sudo /usr/local/sbin/deploy-sanabil
```

The restricted `sanabil-deploy` VPS user has no general root access. Its sudo policy permits only the wrapper at `/usr/local/sbin/deploy-sanabil`, which invokes the production source-of-truth script `/opt/sanabil/deploy.sh`. Deployment logic is intentionally not duplicated in GitHub Actions.

The deploy job belongs to the `production-deployment` concurrency group. A running production deployment is never cancelled midway; another deployment waits for it to finish.

## GitHub production Environment

The `production` Environment must contain these secret names:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_SSH_HOST_KEY`

The SSH private key is written with mode `600`, and the supplied host verification entry is written to `known_hosts` with mode `600`. Strict host-key checking remains enabled. Never commit secret values, private keys, passwords, or production credentials.

## Prisma migrations

Prisma migrations are created and tested locally, committed with the associated code, and applied only by the production deployment script. During backend CD, `/opt/sanabil/deploy.sh` runs:

```bash
npx prisma migrate deploy
```

Normal CI/CD operation must not run a separate manual migration command. Never use `prisma migrate dev`, `prisma db push`, or `prisma migrate reset` against production. Never edit a migration after it has been applied to production. Take a database backup before a destructive or high-risk migration.

## Health check and success criteria

The production script validates Prisma, generates Prisma Client, type-checks and builds the backend, verifies `backend/dist/server.js`, applies pending migrations, and restarts the `sanabil-backend` PM2 process. It then checks:

```text
https://api.sanabil-platform.space/api/health
```

Deployment succeeds only when the endpoint returns HTTP 200. On failure, the script prints the response and recent PM2 logs, exits unsuccessfully, and does not report a successful deployment. On success it persists the PM2 process list.

## Persistent production data

These VPS paths are persistent and must never be overwritten or deleted during deployment:

- `/opt/sanabil/backend/.env`
- `/opt/sanabil/backend/uploads/announcements`

Production environment values remain on the VPS and are not committed to Git.

## Manual fallback

If GitHub Actions CD is unavailable, connect to the VPS as the restricted deployment user and run:

```bash
sudo /usr/local/sbin/deploy-sanabil
```

Do not reproduce the script's Git, npm, Prisma, PM2, or health-check steps manually unless diagnosing a failed deployment with appropriate access.

## Common failures and recovery

- **CI failure:** Open the failed step, fix the code or configuration, and push a new commit. Production deployment will not start.
- **SSH authentication failure:** Verify the four secret names in the `production` Environment, the deploy user's authorized key, and the stored host-key entry. Do not disable host verification.
- **Dirty production checkout:** Inspect `/opt/sanabil` and resolve unexpected local changes safely. Do not force-reset the production repository.
- **Dependency, type-check, or build failure:** Read the deployment output, correct the repository, and rerun after a new successful CI build.
- **Migration failure:** Stop and inspect the Prisma error. Preserve production data, take a backup when risk is present, and never reset the database.
- **Health-check failure:** Use the response and PM2 logs printed by `/opt/sanabil/deploy.sh` to diagnose startup or environment issues, then rerun the wrapper after correction.

## Future implementation reports

Every implementation report must identify the deployment path:

- **Frontend-only change:** Git push triggers Vercel automatically; no VPS deployment is needed.
- **Backend change:** After push or merge to `main` and successful CI, GitHub Actions automatically invokes production backend deployment.
- **Backend plus Prisma migration:** The same automatic backend CD runs, and `/opt/sanabil/deploy.sh` applies pending migrations with `npx prisma migrate deploy`.

Do not instruct operators to run a duplicate manual migration during normal CI/CD operation.
