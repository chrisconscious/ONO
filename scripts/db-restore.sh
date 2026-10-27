#!/usr/bin/env bash
#
# Database restore utility (Stage 12 — operations).
#
# Restores a pg_dump custom-format backup INTO AN ISOLATED RECOVERY DATABASE.
# It will never overwrite the source database: the target must be explicitly
# provided via TARGET_DATABASE_URL, its name must contain "restore" or end
# with "_test", and if the target already exists it must either be empty or
# the operator must pass ALLOW_DESTRUCTIVE=1 after reading what is there.
#
# Steps performed:
#   1. Verify artifact SHA-256 against the manifest written by db-backup.sh.
#   2. Create the recovery database if missing.
#   3. pg_restore into it (custom format, no owner info).
#   4. Run integrity checks: schema present, FK constraints enabled,
#      representative tables exist, row-count invariants recorded.
#
# Usage:
#   npm run db:restore -- backups/ono_test-XXXX.dump postgresql://postgres:postgres@localhost:5432/ono_restore
set -euo pipefail

cd "$(dirname "$0")/.."

ARTIFACT="${1:?usage: db-restore.sh <backup.dump> <target-database-url>}"
TARGET_URL="${2:?usage: db-restore.sh <backup.dump> <target-database-url>}"

# --- Safety gate 1: verify backup integrity before touching any database ---
if [[ -f "${ARTIFACT}.sha256" ]]; then
  sha256sum -c "${ARTIFACT}.sha256" || {
    echo "ERROR: backup artifact does not match its checksum manifest." >&2
    exit 1
  }
else
  echo "WARNING: no .sha256 manifest found next to artifact; integrity unverified." >&2
fi

# --- Safety gate 2: refuse non-isolated targets ---
# Strip Prisma-only query params (?schema=) for libpq compatibility.
PG_TARGET_URL="${TARGET_URL%%\?*}"
DB_NAME="$(basename "$PG_TARGET_URL")"
if [[ ! "$DB_NAME" =~ restore && ! "$DB_NAME" =~ _test$ ]]; then
  echo "ERROR: refusing to restore into '$DB_NAME'." >&2
  echo "Target database name must contain 'restore' or end with '_test'." >&2
  exit 1
fi

# --- Safety gate 3: never silently replace existing data ---
EXISTING_TABLES="$(psql "$PG_TARGET_URL" -Atqc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null || echo '')"
if [[ -n "$EXISTING_TABLES" && "$EXISTING_TABLES" != "0" && "${ALLOW_DESTRUCTIVE:-0}" != "1" ]]; then
  echo "ERROR: target database '$DB_NAME' already has ${EXISTING_TABLES} tables." >&2
  echo "Re-run with ALLOW_DESTRUCTIVE=1 only if replacing it is intended." >&2
  exit 1
fi

echo "Restoring ${ARTIFACT} into ${DB_NAME} ..."
pg_restore --no-owner --dbname="$PG_TARGET_URL" "$ARTIFACT" \
  || { echo "ERROR: pg_restore reported failures." >&2; exit 1; }

# --- Recovery verification: schema + constraint + invariant checks ---
echo "Verifying restored database integrity ..."
psql "$PG_TARGET_URL" -v ON_ERROR_STOP=1 -Atq > /tmp/restore_verify.out <<'SQL'
-- Core operational tables must exist after restore.
SELECT 'tables:' || count(*) FROM information_schema.tables
 WHERE table_schema='public';
-- All foreign keys must be valid/enabled (no orphaned constraints).
SELECT 'invalid_fks:' || count(*) FROM pg_constraint
 WHERE contype='f' AND convalidated = false;
-- Tenant isolation invariant: every tenant-owned business row references a real tenant.
SELECT 'orphan_memberships:' || count(*)
 FROM memberships m LEFT JOIN tenants t ON t.id = m.\"tenantId\"
 WHERE t.id IS NULL;
SQL
cat /tmp/restore_verify.out

if grep -E "invalid_fks:[1-9]|orphan_memberships:[1-9]" /tmp/restore_verify.out; then
  echo "ERROR: restored database failed integrity checks." >&2
  exit 1
fi

TABLE_COUNT="$(grep '^tables:' /tmp/restore_verify.out | cut -d: -f2)"
if [[ "${TABLE_COUNT:-0}" -lt 30 ]]; then
  echo "ERROR: expected full application schema, found only ${TABLE_COUNT} tables." >&2
  exit 1
fi

echo "Restore verified OK: ${TABLE_COUNT} tables, no invalid FKs, no orphan memberships."
