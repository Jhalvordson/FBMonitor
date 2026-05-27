#!/usr/bin/env python3
"""
Check whether this project's engineering charter is behind the latest in claude-starter.

Reads the local charter's version from front-matter, fetches the latest from
the claude-starter remote (URL from .charter-source), and surfaces a banner
if there's a delta.

Silent (exit 0) if:
- Local charter does not exist.
- .charter-source is missing or unreachable (don't block sessions on connectivity).
- Versions match.
- Any error occurs.

Run manually: python scripts/check-charter-version.py
"""

import re
import sys
import urllib.request
from pathlib import Path

LOCAL_CHARTER = Path("docs/engineering-charter.md")
CHARTER_SOURCE = Path(".charter-source")
NETWORK_TIMEOUT_SECONDS = 2


def extract_version(text: str) -> str | None:
    match = re.search(r"^version:\s*(\S+)", text, re.MULTILINE)
    return match.group(1) if match else None


def git_url_to_raw_url(
    git_url: str, branch: str = "main", path: str = "docs/engineering-charter.md"
) -> str | None:
    """
    Convert a GitHub git clone URL to a raw.githubusercontent.com URL for a file.

    Handles:
      https://github.com/user/repo.git           -> https://raw.githubusercontent.com/user/repo/main/<path>
      git@github.com:user/repo.git               -> https://raw.githubusercontent.com/user/repo/main/<path>
      https://github.com/user/repo               -> https://raw.githubusercontent.com/user/repo/main/<path>
    """
    git_url = git_url.strip()
    # SSH form
    m = re.match(r"^git@github\.com:([^/]+)/(.+?)(?:\.git)?$", git_url)
    if m:
        user, repo = m.group(1), m.group(2)
        return f"https://raw.githubusercontent.com/{user}/{repo}/{branch}/{path}"
    # HTTPS form
    m = re.match(r"^https?://github\.com/([^/]+)/(.+?)(?:\.git)?/?$", git_url)
    if m:
        user, repo = m.group(1), m.group(2)
        return f"https://raw.githubusercontent.com/{user}/{repo}/{branch}/{path}"
    return None


def main() -> int:
    if not LOCAL_CHARTER.exists():
        return 0

    if not CHARTER_SOURCE.exists():
        return 0  # Project hasn't pinned a charter source — silent.

    charter_source_url = CHARTER_SOURCE.read_text(encoding="utf-8").strip()
    if not charter_source_url:
        return 0

    raw_url = git_url_to_raw_url(charter_source_url)
    if not raw_url:
        return 0  # Unrecognized URL form — silent.

    local_version = extract_version(LOCAL_CHARTER.read_text(encoding="utf-8"))
    if not local_version:
        return 0

    try:
        with urllib.request.urlopen(raw_url, timeout=NETWORK_TIMEOUT_SECONDS) as resp:
            remote_text = resp.read().decode("utf-8")
    except Exception:
        return 0  # Connectivity / private repo without auth — silent.

    remote_version = extract_version(remote_text)
    if not remote_version or remote_version == local_version:
        return 0

    print(
        f"\n📋 Engineering charter is at v{local_version}; latest in claude-starter is v{remote_version}."
    )
    print("   Run /charter-sync to review the diff and decide whether to apply.\n")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)  # never break a session
