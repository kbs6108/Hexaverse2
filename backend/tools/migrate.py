#!/usr/bin/env python3
"""Apply ``db/migrations/*.sql`` in filename order and record them in ``landstack.schema_migrations``.

Usage::

    python tools/migrate.py                 # apply pending migrations (DATABASE_URL)
    python tools/migrate.py --reset         # drop all Land Stack schemas first, then apply everything
    python tools/migrate.py --dry-run       # list what would run
    python tools/migrate.py --database-url postgresql://...

Every file runs inside its own transaction; a failure stops the run and nothing from that file
is kept. Files are idempotent, so re-running an already applied file (``--force``) is safe.
"""

from __future__ import annotations

import argparse
import hashlib
import sys
import time
from pathlib import Path

from dburl import connect, resolve_database_url

REPO_ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = REPO_ROOT / "db" / "migrations"

SCHEMAS = (
    "landstack", "dept_revenue", "dept_registration", "dept_planning",
    "dept_fiscal", "dept_legal", "dept_utilities", "gis",
)

BOOTSTRAP_SQL = """
CREATE SCHEMA IF NOT EXISTS landstack;
CREATE TABLE IF NOT EXISTS landstack.schema_migrations (
    filename   text PRIMARY KEY,
    checksum   text,
    applied_at timestamptz NOT NULL DEFAULT now()
);
"""


def migration_files() -> list[Path]:
    """All ``NNN_*.sql`` files sorted by name."""
    files = sorted(p for p in MIGRATIONS_DIR.glob("*.sql") if p.name[:3].isdigit())
    if not files:
        raise SystemExit(f"no migrations found in {MIGRATIONS_DIR}")
    return files


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--database-url", help="overrides DATABASE_URL")
    ap.add_argument("--reset", action="store_true", help="DROP SCHEMA ... CASCADE for all Land Stack schemas first")
    ap.add_argument("--force", action="store_true", help="re-run files even if already recorded")
    ap.add_argument("--dry-run", action="store_true", help="show pending files without applying")
    ap.add_argument("--yes", action="store_true", help="do not prompt before --reset")
    args = ap.parse_args(argv)

    url = resolve_database_url(args.database_url)
    files = migration_files()
    safe_url = url.split("@")[-1]
    print(f"database : {safe_url}")
    print(f"migrations: {len(files)} file(s) in {MIGRATIONS_DIR.relative_to(REPO_ROOT)}")

    if args.reset and not args.yes and not args.dry_run:
        answer = input(f"This DROPS schemas {', '.join(SCHEMAS)} on {safe_url}. Type 'yes' to continue: ")
        if answer.strip().lower() != "yes":
            print("aborted")
            return 1

    with connect(url) as conn:
        if args.reset:
            if args.dry_run:
                print("would drop schemas:", ", ".join(SCHEMAS))
            else:
                with conn.cursor() as cur:
                    for schema in SCHEMAS:
                        cur.execute(f"DROP SCHEMA IF EXISTS {schema} CASCADE")
                conn.commit()
                print("dropped schemas:", ", ".join(SCHEMAS))

        with conn.cursor() as cur:
            cur.execute(BOOTSTRAP_SQL)
            cur.execute("SELECT filename FROM landstack.schema_migrations")
            applied = {row[0] for row in cur.fetchall()}
        conn.commit()

        pending = [f for f in files if args.force or f.name not in applied]
        if not pending:
            print("nothing to do; all migrations applied")
            return 0
        for f in files:
            state = "PENDING" if f in pending else "applied"
            print(f"  [{state:7}] {f.name}")
        if args.dry_run:
            return 0

        for f in pending:
            sql = f.read_text(encoding="utf-8")
            checksum = hashlib.sha256(sql.encode("utf-8")).hexdigest()[:16]
            t0 = time.perf_counter()
            try:
                with conn.cursor() as cur:
                    cur.execute(sql)
                    cur.execute(
                        "INSERT INTO landstack.schema_migrations (filename, checksum) VALUES (%s, %s) "
                        "ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = now()",
                        (f.name, checksum),
                    )
                conn.commit()
            except Exception as exc:  # noqa: BLE001 - report and stop
                conn.rollback()
                print(f"FAILED {f.name}: {exc}", file=sys.stderr)
                return 2
            print(f"applied {f.name} ({(time.perf_counter() - t0) * 1000:.0f} ms)")
    print("done")
    return 0


if __name__ == "__main__":
    sys.exit(main())
