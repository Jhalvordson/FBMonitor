#!/usr/bin/env python3
"""
Check for unread personal review files. Used by the SessionStart hook.

Compares mtimes of files in docs/personal/reviews/ against the marker
docs/personal/.last-read. Surfaces a banner if any are newer.

Silent (exit 0) if:
- Reviews directory does not exist (project hasn't run any reviews yet).
- No reviews are newer than the last-read marker.
- Any error occurs (don't break sessions over a hook).

Run manually: python scripts/check-unread-reviews.py
"""

import sys
from pathlib import Path

REVIEWS_DIR = Path("docs/personal/reviews")
LAST_READ = Path("docs/personal/.last-read")


def main() -> int:
    if not REVIEWS_DIR.exists():
        return 0

    last_read_ts = LAST_READ.stat().st_mtime if LAST_READ.exists() else 0.0

    unread = sorted(
        (
            f
            for f in REVIEWS_DIR.glob("*.md")
            if f.name.lower() != "readme.md" and f.stat().st_mtime > last_read_ts
        ),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    if not unread:
        return 0

    print(f"\n📋 {len(unread)} unread personal review(s) in {REVIEWS_DIR}/:")
    for f in unread[:3]:
        print(f"   • {f.name}")
    if len(unread) > 3:
        print(f"   … and {len(unread) - 3} more")
    print("   Run /personal-review-show to read latest, or open the file directly.")
    print(
        "   (Run `touch docs/personal/.last-read` after reading to mark them read.)\n"
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)  # never break a session
