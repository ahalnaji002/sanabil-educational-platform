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

The SSH private key is written with mode `600`, and the supplied host verification entry is written to `known_hosts` with mode `600`. Strict host-key checking remains enabled.

Never commit secret values, private keys, passwords, tokens, encryption passwords, or production credentials.

## Prisma migrations

Prisma migrations are created and tested locally, committed with the associated code, and applied only by the production deployment script. During backend CD, `/opt/sanabil/deploy.sh` runs:

```bash
npx prisma migrate deploy
```

Normal CI/CD operation must not run a separate manual migration command.

Never use the following commands against production:

```bash
prisma migrate dev
prisma db push
prisma migrate reset
```

Never edit a migration after it has been applied to production.

Take a verified database backup before a destructive or high-risk migration.

## Health check and deployment success criteria

The production deployment script:

1. Validates Prisma.
2. Generates Prisma Client.
3. Type-checks the backend.
4. Builds the backend.
5. Verifies `backend/dist/server.js`.
6. Applies pending Prisma migrations.
7. Restarts `sanabil-backend` through PM2.
8. Checks the production health endpoint.

The production health endpoint is:

```text
https://api.sanabil-platform.space/api/health
```

Deployment succeeds only when the endpoint returns HTTP 200.

On failure, the script prints the response and recent PM2 logs, exits unsuccessfully, and does not report a successful deployment.

On success, it persists the PM2 process list.

## Persistent production data

These VPS paths contain persistent production data and must never be overwritten or deleted during deployment:

```text
/opt/sanabil/backend/.env
/opt/sanabil/backend/uploads/announcements
```

Production environment values remain on the VPS and are not committed to Git.

---

# Production backups

Sanabil production data is protected using two backup layers:

1. Local VPS backups.
2. Encrypted off-site backups stored through Google Drive.

Both the MySQL database and persistent announcement uploads are included.

## Local daily backup

The production backup script is:

```text
/usr/local/sbin/backup-sanabil
```

Backups are stored in:

```text
/var/backups/sanabil/
```

Each backup receives a timestamped directory such as:

```text
/var/backups/sanabil/2026-09-13_15-25-08/
```

A successful backup contains:

```text
sanabil.sql.gz
announcements.tar.gz
backup-info.txt
```

The backup covers:

```text
MySQL database:
sanabil

Persistent uploads:
/opt/sanabil/backend/uploads/announcements/
```

The database dump is compressed using gzip.

The announcements directory is archived and compressed using tar/gzip.

## MySQL backup credentials

Backup database credentials are stored outside the repository in:

```text
/root/.sanabil-my.cnf
```

The file must remain root-only:

```bash
chmod 600 /root/.sanabil-my.cnf
```

It must never be committed to Git.

The production database dump uses `--no-tablespaces` so the dedicated Sanabil database user does not require the broader MySQL `PROCESS` privilege.

## Local backup retention

Local production backups are retained for:

```text
14 days
```

Backup directories older than the retention period are removed automatically by the backup script.

This retention policy applies to the local VPS backups.

## Local backup automation

The backup runs automatically using systemd:

```text
/etc/systemd/system/sanabil-backup.service
/etc/systemd/system/sanabil-backup.timer
```

The timer runs once per day.

Check the timer with:

```bash
systemctl status sanabil-backup.timer --no-pager
systemctl list-timers sanabil-backup.timer
```

Check previous executions with:

```bash
journalctl -u sanabil-backup.service -n 50 --no-pager
```

Inspect available backups with:

```bash
ls -lah /var/backups/sanabil
```

A manual backup can be started with:

```bash
systemctl start sanabil-backup.service
```

Because the backup service is a systemd `oneshot` service, a successful execution normally returns to:

```text
inactive (dead)
```

with:

```text
status=0/SUCCESS
```

This is expected behavior.

---

# Backup integrity verification

Backup files must periodically be verified rather than assuming that their existence means they are recoverable.

Get the newest local backup:

```bash
LATEST=$(ls -1dt /var/backups/sanabil/*/ | head -1)

echo "$LATEST"
```

## Verify the MySQL archive

Run:

```bash
gzip -t "${LATEST}sanabil.sql.gz"
echo $?
```

Exit code:

```text
0
```

indicates that gzip successfully verified the compressed archive.

## Verify the uploads archive

Run:

```bash
tar -tzf "${LATEST}announcements.tar.gz" | head
```

The archive should contain the announcements directory and uploaded files.

## Verify SQL schema content

Run:

```bash
zgrep -m 5 "CREATE TABLE" "${LATEST}sanabil.sql.gz"
```

The dump should contain the production database schema.

These checks detect damaged archives but do not replace an actual database restore test.

---

# Database restore verification

The Sanabil database backup has been tested by restoring it into an isolated temporary MySQL database.

Never perform a restore test against the production `sanabil` database.

## Create temporary restore database

Use an administrative MySQL account:

```bash
mysql -u root -p -e "
CREATE DATABASE sanabil_restore_test
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
"
```

## Restore the latest backup

```bash
LATEST=$(ls -1dt /var/backups/sanabil/*/ | head -1)

gunzip -c "${LATEST}sanabil.sql.gz" | \
mysql -u root -p sanabil_restore_test
```

## Inspect restored tables

```bash
mysql -u root -p -e "
USE sanabil_restore_test;
SHOW TABLES;
"
```

The verified production restore contained:

```text
_prisma_migrations
admins
announcements
drive_links
grades
subjects
```

## Compare production and restored data

Important table row counts can be compared with:

```bash
mysql -u root -p -e "
SELECT 'production' AS db_name,
  (SELECT COUNT(*) FROM sanabil.admins) AS admins,
  (SELECT COUNT(*) FROM sanabil.grades) AS grades,
  (SELECT COUNT(*) FROM sanabil.subjects) AS subjects,
  (SELECT COUNT(*) FROM sanabil.drive_links) AS drive_links,
  (SELECT COUNT(*) FROM sanabil.announcements) AS announcements;

SELECT 'restore_test' AS db_name,
  (SELECT COUNT(*) FROM sanabil_restore_test.admins) AS admins,
  (SELECT COUNT(*) FROM sanabil_restore_test.grades) AS grades,
  (SELECT COUNT(*) FROM sanabil_restore_test.subjects) AS subjects,
  (SELECT COUNT(*) FROM sanabil_restore_test.drive_links) AS drive_links,
  (SELECT COUNT(*) FROM sanabil_restore_test.announcements) AS announcements;
"
```

During the production restore verification, the tested row counts matched between production and the restored database.

## Remove the temporary database

After successful verification:

```bash
mysql -u root -p -e "DROP DATABASE sanabil_restore_test;"
```

Only the temporary restore database must be removed.

---

# Encrypted off-site backups

Sanabil maintains an additional encrypted copy of production backups outside the VPS.

The off-site storage uses:

```text
rclone
Google Drive
rclone crypt
```

## rclone remotes

The production VPS has two configured rclone remotes:

```text
sanabil-drive:
sanabil-crypt:
```

`sanabil-drive:` provides access to Google Drive.

`sanabil-crypt:` provides the encryption layer.

The encrypted remote uses:

```text
sanabil-drive:Sanabil-Backups
```

as its underlying storage location.

The production off-site backup destination is:

```text
sanabil-crypt:daily
```

## Encryption

The crypt remote is configured to encrypt:

- File contents.
- File names.
- Directory names.

Files viewed through:

```text
sanabil-crypt:
```

appear with their normal decrypted names.

The same objects viewed directly through:

```text
sanabil-drive:
```

have encrypted names and encrypted contents.

The rclone configuration and crypt credentials are production secrets.

They must never be:

- committed to Git;
- included in application source code;
- printed in logs;
- included in screenshots;
- copied into public documentation.

The rclone crypt password and associated encryption credentials must also be stored securely outside the VPS.

Losing the crypt credentials can make the off-site backup impossible to recover after a server loss.

---

# Off-site encryption and restore test

The encryption configuration has been verified end-to-end.

A plaintext test file was uploaded through:

```text
sanabil-crypt:
```

Listing the same object through the underlying Google Drive remote displayed encrypted directory and file names.

The file was then downloaded again through:

```text
sanabil-crypt:
```

and the original plaintext content was recovered successfully.

This verifies:

```text
Upload
→ encryption
→ Google Drive storage
→ download
→ decryption
→ original content
```

Inspect encrypted backups through:

```bash
rclone lsd sanabil-crypt:daily
```

Inspect a specific backup with:

```bash
rclone ls "sanabil-crypt:daily/<backup-directory>"
```

A successful production backup contains:

```text
backup-info.txt
announcements.tar.gz
sanabil.sql.gz
```

Never attempt to restore encrypted objects directly from their raw `sanabil-drive:` representation.

Always access encrypted backup data through:

```text
sanabil-crypt:
```

---

# Off-site backup automation

The off-site upload script is:

```text
/usr/local/sbin/upload-sanabil-offsite
```

The systemd units are:

```text
/etc/systemd/system/sanabil-offsite-backup.service
/etc/systemd/system/sanabil-offsite-backup.timer
```

The off-site job runs daily after the local backup window.

The script selects the newest local backup and uploads it into a timestamped directory such as:

```text
sanabil-crypt:daily/2026-09-13_15-25-08
```

Before upload, the script verifies that the local backup contains:

```text
sanabil.sql.gz
announcements.tar.gz
backup-info.txt
```

After upload, it verifies that the expected remote files are present.

Check the timer:

```bash
systemctl status sanabil-offsite-backup.timer --no-pager
systemctl list-timers sanabil-offsite-backup.timer
```

Check the off-site backup log:

```bash
tail -50 /var/log/sanabil-offsite-backup.log
```

Check systemd execution logs:

```bash
journalctl -u sanabil-offsite-backup.service -n 50 --no-pager
```

A manual run can be started with:

```bash
systemctl start sanabil-offsite-backup.service
```

---

# Telegram operational alerts

Sanabil production monitoring uses a Telegram bot for operational alerts.

Telegram credentials are stored only on the VPS:

```text
/root/.sanabil-alerts.env
```

The file contains:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Protect the file with:

```bash
chmod 600 /root/.sanabil-alerts.env
```

Telegram credentials must never be committed to Git.

The Telegram delivery path has been tested successfully from the production VPS.

---

# Off-site backup failure monitoring

The off-site backup script includes integrated Telegram failure and recovery notifications.

The state file is:

```text
/var/lib/sanabil-offsite-backup.state
```

Behavior:

1. A successful backup records the state as `healthy`.
2. The first failed backup sends a Telegram alert.
3. Continued failures do not repeatedly send the same alert.
4. A successful backup after a failure sends a recovery notification.
5. The state returns to `healthy`.

Test Telegram delivery without uploading a backup:

```bash
/usr/local/sbin/upload-sanabil-offsite --test-alert
```

## Failure/recovery verification

The complete failure path has been tested by temporarily configuring an invalid rclone remote.

The test caused rclone to fail and systemd correctly reported the service as failed.

The backup script logged:

```text
ERROR: Off-site backup failed with exit code 1
```

After restoring the valid remote:

```text
sanabil-crypt:daily
```

and rerunning the service, the backup completed successfully.

Verify the final state with:

```bash
cat /var/lib/sanabil-offsite-backup.state
```

Expected healthy state:

```text
healthy
```

---

# Disk monitoring

VPS disk usage is monitored automatically.

The monitoring script is:

```text
/usr/local/sbin/check-sanabil-disk
```

The systemd units are:

```text
/etc/systemd/system/sanabil-disk-monitor.service
/etc/systemd/system/sanabil-disk-monitor.timer
```

The disk monitor runs every:

```text
15 minutes
```

When disk usage reaches the configured alert threshold, the script sends a Telegram notification.

The Telegram alert path has been tested successfully.

Test Telegram delivery manually:

```bash
/usr/local/sbin/check-sanabil-disk --test
```

Inspect current root filesystem usage:

```bash
df -h /
```

Check the timer:

```bash
systemctl status sanabil-disk-monitor.timer --no-pager
systemctl list-timers sanabil-disk-monitor.timer
```

Check execution logs:

```bash
journalctl -u sanabil-disk-monitor.service -n 50 --no-pager
```

---

# Backend health monitoring

Sanabil has an independent backend health monitor.

The script is:

```text
/usr/local/sbin/check-sanabil-health
```

The monitor verifies both:

1. PM2 process status for `sanabil-backend`.
2. HTTP status of the production health endpoint.

Health endpoint:

```text
https://api.sanabil-platform.space/api/health
```

A healthy backend requires:

```text
PM2 status = online
HTTP status = 200
```

## Health monitor automation

The systemd units are:

```text
/etc/systemd/system/sanabil-health-monitor.service
/etc/systemd/system/sanabil-health-monitor.timer
```

The health check runs every:

```text
5 minutes
```

The monitor sends a Telegram alert when the backend becomes unhealthy.

When both PM2 and the API become healthy again, it sends a recovery notification.

The health state is stored in:

```text
/var/lib/sanabil-health-alert.state
```

Test Telegram delivery:

```bash
/usr/local/sbin/check-sanabil-health --test
```

Run an immediate real health check:

```bash
/usr/local/sbin/check-sanabil-health
echo $?
```

A healthy check returns:

```text
0
```

Check the timer:

```bash
systemctl status sanabil-health-monitor.timer --no-pager
systemctl list-timers sanabil-health-monitor.timer
```

Check execution logs:

```bash
journalctl -u sanabil-health-monitor.service -n 50 --no-pager
```

---

# PM2 process management

The production backend is managed by PM2 under:

```text
sanabil-backend
```

Check application status with:

```bash
pm2 list
```

The expected production state is:

```text
sanabil-backend = online
```

After process configuration changes, persist the PM2 process list:

```bash
pm2 save
```

---

# PM2 log rotation

PM2 application logs are protected against uncontrolled growth using:

```text
pm2-logrotate
```

The production configuration is:

```text
max_size       = 10M
retain         = 14
compress       = true
dateFormat     = YYYY-MM-DD_HH-mm-ss
workerInterval = 30
rotateInterval = 0 0 * * *
rotateModule   = true
```

This provides both size-based and scheduled log rotation.

Check module configuration:

```bash
pm2 conf pm2-logrotate
```

Check PM2 and module status:

```bash
pm2 list
```

`pm2-logrotate` must remain:

```text
online
```

Inspect current log usage:

```bash
du -sh /root/.pm2/logs
ls -lh /root/.pm2/logs
```

After changing PM2 module configuration:

```bash
pm2 save
```

---

# Nginx reverse proxy

Nginx runs as the production reverse proxy.

Check the service:

```bash
systemctl status nginx --no-pager
```

The expected state is:

```text
active (running)
```

Before any Nginx reload or configuration deployment, validate the configuration:

```bash
nginx -t
```

A valid configuration returns:

```text
syntax is ok
test is successful
```

The production Nginx configuration has passed this validation.

---

# HTTPS and TLS certificates

The Sanabil API is served over HTTPS:

```text
https://api.sanabil-platform.space
```

TLS certificates are managed by Let's Encrypt through Certbot.

Inspect certificates with:

```bash
certbot certificates
```

The Sanabil production certificate is:

```text
api.sanabil-platform.space
```

## Automatic certificate renewal

Automatic renewal is handled by:

```text
certbot.timer
```

Check the timer:

```bash
systemctl status certbot.timer --no-pager
systemctl list-timers certbot.timer
```

The production timer is:

```text
enabled
active (waiting)
```

and Certbot is scheduled to run twice daily.

## Renewal verification

Test certificate renewal without changing the live certificate:

```bash
certbot renew --dry-run
```

The production renewal simulation completed successfully for:

```text
api.sanabil-platform.space
```

and the other certificates currently managed on the same VPS.

A successful dry-run verifies that the current Certbot configuration can complete a simulated renewal.

---

# Production monitoring overview

The current Sanabil monitoring stack is:

```text
Disk usage
    ↓ every 15 minutes
systemd timer
    ↓
Telegram alert

Backend / API health
    ↓ every 5 minutes
PM2 status + /api/health
    ↓
Telegram failure/recovery alert

Local backup
    ↓ daily
MySQL + uploads
    ↓
14-day local retention

Off-site backup
    ↓ daily
rclone crypt
    ↓
Encrypted Google Drive storage
    ↓
Telegram failure/recovery alert

PM2 logs
    ↓
pm2-logrotate
    ↓
10 MB / daily rotation
    ↓
14 retained rotated files
```

---

# Manual fallback

If GitHub Actions CD is unavailable, connect to the VPS as the restricted deployment user and run:

```bash
sudo /usr/local/sbin/deploy-sanabil
```

Do not reproduce the script's Git, npm, Prisma, PM2, or health-check steps manually unless diagnosing a failed deployment with appropriate access.

---

# Common failures and recovery

- **CI failure:** Open the failed step, fix the code or configuration, and push a new commit. Production deployment will not start.

- **SSH authentication failure:** Verify the four secret names in the `production` Environment, the deploy user's authorized key, and the stored host-key entry. Do not disable host verification.

- **Dirty production checkout:** Inspect `/opt/sanabil` and resolve unexpected local changes safely. Do not force-reset the production repository.

- **Dependency, type-check, or build failure:** Read the deployment output, correct the repository, and rerun after a new successful CI build.

- **Migration failure:** Stop and inspect the Prisma error. Preserve production data, take a backup when risk is present, and never reset the database.

- **Deployment health-check failure:** Use the response and PM2 logs printed by `/opt/sanabil/deploy.sh` to diagnose startup or environment issues, then rerun the wrapper after correction.

- **Local backup failure:** Inspect the backup service logs:

```bash
journalctl -u sanabil-backup.service -n 50 --no-pager
```

Preserve the previous known-good backup while diagnosing.

- **Off-site backup failure:** Inspect:

```bash
tail -50 /var/log/sanabil-offsite-backup.log
journalctl -u sanabil-offsite-backup.service -n 50 --no-pager
```

Verify rclone configuration:

```bash
rclone listremotes
rclone lsd sanabil-crypt:daily
```

- **Disk alert:** Check:

```bash
df -h /
```

Identify large directories before deleting production data.

- **Backend health alert:** Check:

```bash
pm2 list
pm2 logs sanabil-backend --lines 100
```

Then verify:

```text
https://api.sanabil-platform.space/api/health
```

- **PM2 log growth:** Check:

```bash
pm2 conf pm2-logrotate
du -sh /root/.pm2/logs
```

Verify that `pm2-logrotate` remains online.

- **Nginx failure:** Validate configuration first:

```bash
nginx -t
systemctl status nginx --no-pager
```

Do not reload Nginx while `nginx -t` reports an invalid configuration.

- **Certificate renewal failure:** Check:

```bash
certbot certificates
systemctl status certbot.timer --no-pager
```

Inspect the Certbot logs and correct the underlying DNS, Nginx, or ACME challenge problem.

Then verify again with:

```bash
certbot renew --dry-run
```

---

# Production security rules

The following files and credentials must never be committed to Git:

```text
/opt/sanabil/backend/.env
/root/.sanabil-my.cnf
/root/.sanabil-alerts.env
rclone configuration
SSH private keys
JWT secrets
database passwords
Telegram bot token
rclone crypt passwords
```

Production database operations must follow these rules:

- Never run `prisma migrate reset`.
- Never run `prisma migrate dev`.
- Never use `prisma db push` as the production deployment mechanism.
- Never perform restore tests against the production database.
- Never delete the previous known-good backup while diagnosing a backup failure.
- Never disable SSH host-key verification to bypass deployment errors.
- Never expose Telegram or rclone credentials in logs or documentation.

---

# Future implementation reports

Every implementation report must identify the deployment path.

## Frontend-only change

Git push triggers Vercel automatically.

No VPS deployment is needed.

## Backend change

After push or merge to `main` and successful CI, GitHub Actions automatically invokes production backend deployment.

## Backend plus Prisma migration

The same automatic backend CD runs, and:

```text
/opt/sanabil/deploy.sh
```

applies pending migrations using:

```bash
npx prisma migrate deploy
```

Do not instruct operators to run a duplicate manual migration during normal CI/CD operation.

---

# Production readiness status

The production infrastructure currently includes:

- GitHub Actions CI.
- Automatic backend CD.
- Vercel frontend deployment.
- Restricted VPS deployment user.
- PM2 process management.
- PM2 log rotation.
- Nginx reverse proxy.
- HTTPS.
- Automatic Certbot renewal.
- Production health endpoint.
- Independent backend health monitoring.
- Disk usage monitoring.
- Telegram operational alerts.
- Daily MySQL backups.
- Daily persistent uploads backups.
- 14-day local backup retention.
- Verified database restore procedure.
- Encrypted off-site backups.
- Verified off-site encryption and decryption.
- Off-site backup failure alerts.
- Off-site backup recovery alerts.

Backup and monitoring infrastructure must continue to be tested periodically. A backup should not be considered reliable solely because a scheduled job reports success; restore verification remains part of production maintenance.
