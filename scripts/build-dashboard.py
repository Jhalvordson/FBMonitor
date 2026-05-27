#!/usr/bin/env python3
"""Build the offline dashboard and the live-mode manifest.

Produces:
  - docs/dashboard.offline.html  — dashboard.html with all parsed data inlined.
  - docs/.dashboard-manifest.json — file list used by dashboard.html in live mode
    when directory listing is unavailable (GitHub Pages, file://).

Uses only the Python standard library. Same parser logic as the in-browser
version in docs/dashboard.html. See docs/dashboard.schema.md for the
contract this script honors.

Run from repo root:
    python scripts/build-dashboard.py
"""

from __future__ import annotations

import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any

# ----------------------------------------------------------------------------
# Repo discovery
# ----------------------------------------------------------------------------

REPO = Path(__file__).resolve().parent.parent
DOCS = REPO / "docs"

TEMPLATE_FILENAMES = {"0000-template.md", "README.md"}

# ----------------------------------------------------------------------------
# Parser (mirrors the JS in dashboard.html)
# ----------------------------------------------------------------------------

FM_RE = re.compile(r"^---\r?\n(.*?)\r?\n---\r?\n?", re.DOTALL)
KV_RE = re.compile(r"^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$")


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str, bool]:
    """Return (frontmatter dict, body, malformed flag)."""
    m = FM_RE.match(text)
    if not m:
        return {}, text, text.startswith("---")
    body = text[m.end() :]
    fm: dict[str, Any] = {}
    for raw_line in m.group(1).splitlines():
        line = re.sub(r"\s+#.*$", "", raw_line)
        kv = KV_RE.match(line)
        if not kv:
            continue
        key = kv.group(1)
        val = kv.group(2).strip()
        if val == "":
            fm[key] = None
            continue
        if val.startswith("[") and val.endswith("]"):
            inner = val[1:-1].strip()
            if inner == "":
                fm[key] = []
            else:
                parts = [p.strip().strip("'\"") for p in inner.split(",")]
                fm[key] = [
                    int(p)
                    if re.fullmatch(r"-?\d+", p)
                    else (float(p) if re.fullmatch(r"-?\d+\.\d+", p) else p)
                    for p in parts
                ]
        elif (val.startswith('"') and val.endswith('"')) or (
            val.startswith("'") and val.endswith("'")
        ):
            fm[key] = val[1:-1]
        elif re.fullmatch(r"-?\d+", val):
            fm[key] = int(val)
        elif re.fullmatch(r"-?\d+\.\d+", val):
            fm[key] = float(val)
        else:
            fm[key] = val
    return fm, body, False


def parse_section(body: str, heading: str) -> str:
    escaped = re.escape(heading)
    m = re.search(rf"^##\s+{escaped}\s*$", body, re.MULTILINE | re.IGNORECASE)
    if not m:
        return ""
    start = m.end()
    rest = body[start:]
    nxt = re.search(r"^##\s+", rest, re.MULTILINE)
    chunk = rest[: nxt.start()] if nxt else rest
    return chunk.strip()


def parse_list_items(section_text: str, limit: int = 5) -> list[str]:
    items: list[str] = []
    for line in section_text.splitlines():
        m = re.match(r"^\s*[-*]\s+(?:\[[ x]\]\s+)?(.+)$", line)
        if m:
            items.append(m.group(1).strip())
        if len(items) >= limit:
            break
    return items


def parse_first_heading(body: str, level: int) -> str:
    prefix = "#" * level
    m = re.search(rf"^{prefix}\s+(.+)$", body, re.MULTILINE)
    return m.group(1).strip() if m else ""


def parse_table(body: str, heading: str) -> list[dict[str, str]]:
    m = re.search(
        rf"^##\s+{re.escape(heading)}\s*$", body, re.MULTILINE | re.IGNORECASE
    )
    if not m:
        return []
    start = m.end()
    rest = body[start:]
    nxt = re.search(r"^##\s+", rest, re.MULTILINE)
    section = rest[: nxt.start()] if nxt else rest
    lines = [ln for ln in section.splitlines() if "|" in ln]
    if len(lines) < 2:
        return []
    header = [c.strip() for c in lines[0].split("|") if c.strip()]
    rows: list[dict[str, str]] = []
    for i in range(2, len(lines)):
        cells = [c.strip() for c in lines[i].split("|")]
        if cells and cells[0] == "":
            cells = cells[1:]
        if cells and cells[-1] == "":
            cells = cells[:-1]
        if not cells:
            continue
        # Skip placeholder rows like `_none yet_`
        if cells[0] and re.fullmatch(r"_.*_", cells[0]):
            continue
        row = {header[j]: cells[j] for j in range(min(len(header), len(cells)))}
        rows.append(row)
    return rows


# ----------------------------------------------------------------------------
# Loaders (mirror the JS exactly so the inlined model matches the live model)
# ----------------------------------------------------------------------------


def read(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None
    except OSError as e:
        print(f"  ! could not read {path}: {e}", file=sys.stderr)
        return None


def load_charter(model: dict) -> None:
    text = read(DOCS / "engineering-charter.md")
    if not text:
        return
    fm, _, _ = parse_frontmatter(text)
    model["charter"] = {
        "version": fm.get("version"),
        "last_updated": fm.get("last_updated"),
    }
    if fm.get("version") is None:
        model["warnings"].append(
            {"file": "engineering-charter.md", "msg": "missing `version`"}
        )


def load_phase(model: dict) -> None:
    text = read(DOCS / "phase.md")
    if not text:
        return
    fm, body, _ = parse_frontmatter(text)
    heading = parse_first_heading(body, 2)
    m = re.match(r"^Current phase:\s*(.+)$", heading, re.IGNORECASE)
    name = m.group(1).strip() if m else heading
    phase_body = ""
    hm = re.search(r"^##\s+Current phase:.*$", body, re.MULTILINE | re.IGNORECASE)
    if hm:
        after = body[hm.end() :].strip()
        paragraphs = re.split(r"\r?\n\s*\r?\n", after)
        phase_body = paragraphs[0] if paragraphs else ""
    model["phase"] = {
        "phase": fm.get("phase"),
        "target_end": fm.get("target_end"),
        "name": name,
        "body": phase_body,
    }


def days_since(iso: str | None) -> int | None:
    if not iso:
        return None
    try:
        d = datetime.fromisoformat(str(iso)).date()
    except ValueError:
        return None
    return (date.today() - d).days


def list_dir_md(dirpath: Path) -> list[str]:
    if not dirpath.is_dir():
        return []
    return sorted(
        p.name for p in dirpath.glob("*.md") if p.name not in TEMPLATE_FILENAMES
    )


def load_rfcs(model: dict) -> None:
    rfc_dir = DOCS / "rfc"
    for name in list_dir_md(rfc_dir):
        text = read(rfc_dir / name)
        if not text:
            continue
        fm, body, malformed = parse_frontmatter(text)
        rel = f"rfc/{name}"
        if malformed:
            model["warnings"].append({"file": rel, "msg": "malformed frontmatter"})
            continue
        rfc = {
            "file": rel,
            "filename": name,
            "num": fm.get("rfc"),
            "title": fm.get("title") or re.sub(r"^\d+-|\.md$", "", name),
            "status": fm.get("status") or "draft",
            "created": fm.get("created"),
            "linked_adrs": fm.get("linked_adrs")
            if isinstance(fm.get("linked_adrs"), list)
            else [],
            "linked_ideas": fm.get("linked_ideas")
            if isinstance(fm.get("linked_ideas"), list)
            else [],
            "goals": parse_list_items(parse_section(body, "Goals")),
            "open_questions": parse_list_items(parse_section(body, "Open questions")),
        }
        if rfc["num"] is None:
            model["warnings"].append({"file": rel, "msg": "missing `rfc` number"})
        if rfc["status"] == "draft" and rfc["created"]:
            age = days_since(rfc["created"])
            if age is not None and age > 30:
                rfc["stale"] = True
        model["rfcs"].append(rfc)
    model["rfcs"].sort(key=lambda r: -(r["num"] or 0))


def load_adrs(model: dict) -> None:
    adr_dir = DOCS / "adr"
    for name in list_dir_md(adr_dir):
        text = read(adr_dir / name)
        if not text:
            continue
        fm, body, malformed = parse_frontmatter(text)
        rel = f"adr/{name}"
        if malformed:
            model["warnings"].append({"file": rel, "msg": "malformed frontmatter"})
            continue
        decision = parse_section(body, "Decision")
        first_para = re.split(r"\r?\n\s*\r?\n", decision)[0] if decision else ""
        adr = {
            "file": rel,
            "filename": name,
            "num": fm.get("adr"),
            "title": fm.get("title") or re.sub(r"^\d+-|\.md$", "", name),
            "status": fm.get("status") or "proposed",
            "date": fm.get("date"),
            "supersedes": fm.get("supersedes"),
            "superseded_by": fm.get("superseded-by"),
            "linked_rfcs": fm.get("linked_rfcs")
            if isinstance(fm.get("linked_rfcs"), list)
            else [],
            "decision": first_para,
        }
        if adr["num"] is None:
            model["warnings"].append({"file": rel, "msg": "missing `adr` number"})
        model["adrs"].append(adr)
    model["adrs"].sort(key=lambda a: (a["date"] or ""), reverse=True)


def load_decisions(model: dict) -> None:
    text = read(DOCS / "decisions" / "register.md")
    if not text:
        return
    model["decisions"] = {
        "open": parse_table(text, "Open"),
        "closed": parse_table(text, r"Recently closed \(last 90 days\)"),
    }


def load_ideas(model: dict) -> None:
    idea_dir = DOCS / "ideas"
    for name in list_dir_md(idea_dir):
        text = read(idea_dir / name)
        if not text:
            continue
        _, body, _ = parse_frontmatter(text)
        full = body or text
        title_m = re.search(r"^#\s+(?:Idea:\s*)?(.+)$", full, re.MULTILINE)
        parked_m = re.search(r"\*\*Parked:\*\*\s*([0-9-]+)", full)
        promote_m = re.search(r"\*\*Earliest promotion:\*\*\s*([0-9-]+)", full)
        problem = parse_section(full, "Problem")
        first_para = re.split(r"\r?\n\s*\r?\n", problem)[0] if problem else ""
        slug = re.sub(r"\.md$", "", name)
        model["ideas"].append(
            {
                "file": f"ideas/{name}",
                "filename": name,
                "slug": slug,
                "name": title_m.group(1).strip() if title_m else slug,
                "parked": parked_m.group(1) if parked_m else None,
                "earliest": promote_m.group(1) if promote_m else None,
                "problem": first_para,
            }
        )
    model["ideas"].sort(key=lambda i: (i["parked"] or ""), reverse=True)


def load_latest_review(model: dict) -> None:
    rev_dir = DOCS / "personal" / "reviews"
    files = list_dir_md(rev_dir)
    if not files:
        return
    files.sort(reverse=True)
    latest = files[0]
    text = read(rev_dir / latest)
    if not text:
        return
    fm, body, _ = parse_frontmatter(text)
    score = fm.get("compliance_score")
    working = parse_section(body, r"What's working")
    regressing = parse_section(body, r"What's regressing")
    model["review"] = {
        "file": f"personal/reviews/{latest}",
        "filename": latest,
        "date": fm.get("date"),
        "week": fm.get("week"),
        "compliance_score": score if isinstance(score, (int, float)) else None,
        "working": re.split(r"\r?\n\s*\r?\n", working)[0] if working else "",
        "regressing": re.split(r"\r?\n\s*\r?\n", regressing)[0] if regressing else "",
    }


# ----------------------------------------------------------------------------
# Build steps
# ----------------------------------------------------------------------------


def empty_model() -> dict:
    return {
        "charter": {},
        "phase": None,
        "rfcs": [],
        "adrs": [],
        "decisions": {"open": [], "closed": []},
        "ideas": [],
        "review": None,
        "warnings": [],
    }


def build_model() -> dict:
    model = empty_model()
    load_charter(model)
    load_phase(model)
    load_decisions(model)
    load_rfcs(model)
    load_adrs(model)
    load_ideas(model)
    load_latest_review(model)
    return model


def write_manifest() -> Path:
    manifest = {
        "rfc/": list_dir_md(DOCS / "rfc"),
        "adr/": list_dir_md(DOCS / "adr"),
        "ideas/": list_dir_md(DOCS / "ideas"),
        "personal/reviews/": list_dir_md(DOCS / "personal" / "reviews"),
        "_generated_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
    }
    out = DOCS / ".dashboard-manifest.json"
    out.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return out


def write_offline_html(model: dict) -> Path:
    src = DOCS / "dashboard.html"
    html = src.read_text(encoding="utf-8")

    # Inline the data payload.
    payload = json.dumps(model, ensure_ascii=False, indent=2)
    payload = payload.replace("</script", "<\\/script")
    html = html.replace("__INLINED_DATA__", payload, 1)

    # Inline Mermaid so the offline file is truly self-contained.
    mermaid_path = DOCS / "vendor" / "mermaid.min.js"
    if mermaid_path.is_file():
        mermaid_js = mermaid_path.read_text(encoding="utf-8")
        mermaid_js = mermaid_js.replace("</script", "<\\/script")
        inline_tag = "<script>\n" + mermaid_js + "\n</script>"
        html = re.sub(
            r'<script\s+src="vendor/mermaid\.min\.js"[^>]*></script>',
            lambda m: inline_tag,
            html,
            count=1,
        )
    else:
        print(
            f"  ! mermaid not vendored at {mermaid_path}; offline build will rely on the missing src=...",
            file=sys.stderr,
        )

    out = DOCS / "dashboard.offline.html"
    out.write_text(html, encoding="utf-8")
    return out


# ----------------------------------------------------------------------------
# Entry point
# ----------------------------------------------------------------------------


def summary_line(model: dict) -> str:
    return (
        f"  charter v{model['charter'].get('version') or '?'} | "
        f"phase: {model['phase']['name'] if model.get('phase') else 'none'} | "
        f"{len(model['rfcs'])} rfcs | {len(model['adrs'])} adrs | "
        f"{len(model['decisions'].get('open', []))} open decisions | "
        f"{len(model['ideas'])} ideas | "
        f"review: {model['review']['filename'] if model.get('review') else 'none'} | "
        f"{len(model['warnings'])} warnings"
    )


def main() -> int:
    print(f"build-dashboard: reading from {DOCS}")
    if not DOCS.is_dir():
        print(f"  ! docs/ not found at {DOCS}", file=sys.stderr)
        return 2

    model = build_model()
    print(summary_line(model))
    if model["warnings"]:
        print("  warnings:")
        for w in model["warnings"]:
            print(f"    - {w['file']}: {w['msg']}")

    manifest_path = write_manifest()
    print(f"  [ok] wrote {manifest_path.relative_to(REPO)}")

    offline_path = write_offline_html(model)
    print(f"  [ok] wrote {offline_path.relative_to(REPO)}")

    print("done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
