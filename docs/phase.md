---
phase: 1
target_end: 2026-06-30
---

## Current phase: Dashboard groundwork

Building the first real artifact in `claude-starter` beyond templates: a single-page status dashboard (`docs/dashboard.html`) and its build companion. This phase exercises the RFC → ADR → Idea pipeline end-to-end and produces the visibility surface every future phase needs.

**Why this phase:** the templates exist but nothing reads them yet. Until something does, schema drift, naming drift, and "did this get done?" questions have no answer. The dashboard is that answer.

**Exit criteria:**

- `docs/dashboard.html` renders against the live repo over `python -m http.server`.
- `scripts/build-dashboard.py` produces `docs/dashboard.offline.html` that opens via `file://`.
- The architecture graph renders cross-references derived from explicit frontmatter.
- The "warnings tile" surfaces at least one drift case (frontmatter missing on an artifact) so the contract is enforceable.

Edit this file to change the current phase. The dashboard reads `phase`, `target_end`, and the first `## Current phase: <name>` heading.
