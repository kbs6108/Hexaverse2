#!/usr/bin/env python3
"""Reset the demo to a known state in well under 30 seconds.

Truncates the *mutable* tables the demo writes to (applications, audit_log, alerts, reports,
consents, dept_revenue.mutations, dept_registration.outbox) and re-creates the seeded rows for
them by rebuilding the deterministic frame from ``tools/seed.py`` and writing only that subset.
The cadastre, department records and GIS layers are left untouched.

Usage::

    python tools/demo_reset.py            # mutable tables only (default, ~5 s)
    python tools/demo_reset.py --full     # full re-seed of every table (~20 s)

Called by ``POST /landstack/admin/demo-reset`` (gateway shells out or imports :func:`reset`).
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dburl import connect, resolve_database_url  # noqa: E402
from seed import DEFAULT_SEED, build_frames, write_db  # noqa: E402


def reset(database_url: str | None = None, *, full: bool = False, seed: int = DEFAULT_SEED, verbose: bool = True) -> dict[str, int]:
    """Rebuild the regional frames and reload the mutable tables (or everything with ``full=True``)."""
    url = resolve_database_url(database_url)
    t0 = time.perf_counter()
    frames = build_frames(seed=seed, verbose=False)
    if verbose:
        print(f"frames rebuilt in {time.perf_counter() - t0:.1f}s; resetting {'ALL' if full else 'mutable'} tables on {url.split('@')[-1]}")
    with connect(url) as conn:
        counts = write_db(conn, frames, only_mutable=not full)
    if verbose:
        for table, n in counts.items():
            print(f"  {table:38} {n:5d}")
        print(f"demo reset done in {time.perf_counter() - t0:.1f}s")
    return counts


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--full", action="store_true", help="re-seed every table, not just the mutable ones")
    ap.add_argument("--seed", type=int, default=DEFAULT_SEED)
    ap.add_argument("--database-url", help="overrides DATABASE_URL")
    args = ap.parse_args(argv)
    reset(args.database_url, full=args.full, seed=args.seed)
    return 0


if __name__ == "__main__":
    sys.exit(main())
