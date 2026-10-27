#!/usr/bin/env bash
#
# Database backup utility (Stage 12 — operations).
#
# Creates a custom-format pg_dump archive of the database named by
# DATABASE_URL into BACKUP_DIR, writes a SHA-256 manifest for integrity
# verification, and applies a retention policy.
#
# SAFETY: refuses to run when NODE_ENV=production unless FORCE_BACKUP=1 is
# explicitly set, so it can never be invoked accidentally against a live
# production database from an automated shell. Backups are written only to
# the local backup directory (never to any public/web-served path) and the
# directory must be protected at the filesystem level by operators.
#
# Usage:   npm run db:backup            # uses .env DATABASE_URL
#          BACKUP_DIR=/secure/backups npm run db:backup
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  # Load DATABASE_URL etc. from the local env file (values never printed).
  set -a
  source .env
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL must be set (e.g. via .env)}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

if [[ "${NODE_ENV:-development}" == "production" && "${FORCE_BACKUP:-0}" != "1" ]]; then
  echo "ERROR: refusing to back up with NODE_ENV=production without FORCE_BACKUP=1." >&2
  echo "This guard prevents accidental destructive automation against production." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
# Prisma connection strings carry ?schema=public which libpq tools
# do not understand — strip the query string for pg_dump/psql.
PG_URL="${DATABASE_URL%%\?*}"
DB_NAME="$(basename "$PG_URL")"
ARTIFACT="$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.dump"

echo "Backing up database '${DB_NAME}' to ${ARTIFACT} ..."
pg_dump --format=custom --no-owner --dbname="$PG_URL" --file="$ARTIFACT"
chmod 600 "$ARTIFACT"

# Integrity manifest — restore tooling verifies this before touching any DB.
sha256sum "$ARTIFACT" > "${ARTIFACT}.sha256"
SIZE="$(stat -c%s "$ARTIFACT" 2>/dev/null || stat -f%z "$ARTIFACT")"
cat > "${ARTIFACT}.meta" <<EOF
{
  "database": "${DB_NAME}",
  "artifact": "${ARTIFACT}",
  "sizeBytes": ${SIZE},
  "createdAtUtc": "${TIMESTAMP}",
  "tool": "pg_dump-custom"
}
EOF

# Quick self-check: a custom archive must list tables successfully.
if ! pg_restore --list "$ARTIFACT" > /dev/null; then
  echo "ERROR: backup artifact failed pg_restore --list verification." >&2
  exit 1
fi

# Retention: remove artifacts older than RETENTION_DAYS (only inside BACKUP_DIR).
find "$BACKUP_DIR" -name "*.dump*" -mtime "+${RETENTION_DAYS}" -delete
find "$BACKUP_DIR" -name "*.meta" -mtime "+${RETENTION_DAYS}" -delete

echo "Backup OK: ${ARTIFACT} (${SIZE} bytes, sha256 recorded, verified readable)"
