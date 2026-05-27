# Dashboard data contract

`docs/dashboard.html` parses the markdown files described below at load time. This file is the contract — when the dashboard renders "not scored," "no links," or surfaces a warning in the parser-health tile, the cause is almost always a file that doesn't match this schema.

When a template changes, update this file in the same commit.

## Frontmatter conventions

The dashboard's parser is intentionally minimal — flat `key: value` only, no nested maps, no anchors, no multi-line strings.

- Strings: bare or quoted (`status: draft` or `status: "draft"`)
- Numbers: bare (`rfc: 1`, `compliance_score: 0.85`)
- Inline arrays of numbers or slugs: `linked_adrs: [1, 3]` / `linked_ideas: [foo-bar]`
- Empty arrays: `linked_adrs: []`
- Dates: ISO format (`2026-05-10`)

A missing optional field is fine — the dashboard renders an empty state or "not scored." A malformed required field surfaces in the parser-health tile.

## Per-source contract

### `docs/engineering-charter.md`

```yaml
---
version: 1.1
adopted: 2026-05-08
last_updated: 2026-05-08
---
```

| Field          | Required | Used for    |
| -------------- | -------- | ----------- |
| `version`      | yes      | header chip |
| `last_updated` | yes      | header chip |

### `docs/phase.md`

```yaml
---
phase: 1
target_end: 2026-06-30
---
## Current phase: Dashboard groundwork
```

| Field                                    | Required | Used for                  |
| ---------------------------------------- | -------- | ------------------------- |
| `phase`                                  | no       | phase number badge        |
| `target_end`                             | no       | "Target: YYYY-MM-DD" line |
| First `## Current phase: <name>` heading | yes      | tile title                |

Missing file → empty state ("No phase set — create `docs/phase.md`").

### `docs/rfc/*.md` (excl `0000-template.md`, `README.md`)

```yaml
---
rfc: NNNN
title: <short title>
author: <name>
created: YYYY-MM-DD
status: draft # draft | accepted | implemented | superseded | rejected
linked_adrs: [] # optional — ADR numbers, e.g. [3, 4]
linked_ideas: [] # optional — idea slugs, e.g. [auth-overhaul]
---
```

| Field          | Required | Used for                                       |
| -------------- | -------- | ---------------------------------------------- |
| `rfc`          | yes      | tile row id, graph node                        |
| `title`        | yes      | tile row label                                 |
| `status`       | yes      | tile filter ("in-progress" = draft + accepted) |
| `created`      | yes      | "stale RFC" check (>30 days as draft)          |
| `linked_adrs`  | no       | RFC → ADR edges in the graph                   |
| `linked_ideas` | no       | Idea → RFC edges in the graph                  |

Section text read: `## Goals` (first list block) and `## Open questions` (first list block) — surfaced in the row tooltip.

### `docs/adr/*.md` (excl `0000-template.md`, `README.md`)

```yaml
---
adr: NNNN
title: <short title>
status: proposed # proposed | accepted | superseded | deprecated
date: YYYY-MM-DD
supersedes: # optional
superseded-by: # optional
linked_rfcs: [] # optional — RFC numbers, e.g. [1]
---
```

| Field           | Required | Used for                                               |
| --------------- | -------- | ------------------------------------------------------ |
| `adr`           | yes      | tile row id, graph node                                |
| `title`         | yes      | tile row label                                         |
| `status`        | yes      | row color                                              |
| `date`          | yes      | sort order                                             |
| `superseded-by` | no       | row strikethrough                                      |
| `linked_rfcs`   | no       | RFC ↔ ADR edges (deduped with the RFC's `linked_adrs`) |

Section text read: `## Decision` (first paragraph) — surfaced in the row tooltip.

### `docs/decisions/register.md`

The dashboard parses two tables by their preceding heading:

- `## Open` — rows become the open-decisions tile.
- `## Recently closed (last 90 days)` — the "Outcome (ADR)" column is scanned for `ADR NNNN` patterns to produce Decision → ADR graph edges.

Table column order must match the existing register format:

| #   | Decision | Owner | Decide by | Notes |
| --- | -------- | ----- | --------- | ----- |

Rows where `#` is `_none yet_` (or any underscored italic placeholder) are ignored.

### `docs/ideas/*.md` (excl `README.md`)

Idea files don't have frontmatter today; they use a body convention. The parser reads:

- Filename (without `.md`) → slug used for graph edges.
- First `# Idea: <name>` heading → idea name.
- `**Parked:** YYYY-MM-DD` → parked date.
- `**Earliest promotion:** YYYY-MM-DD` → earliest promotion date.
- First paragraph after the `## Problem` heading → tooltip body.

Future option: add `slug: <name>` to frontmatter for explicit slugging if filename slugs become inconvenient.

### `docs/personal/reviews/*.md` (excl `README.md`)

The dashboard picks the file with the highest filename sort (lexicographic — ISO week filenames `YYYY-WW.md` sort correctly).

```yaml
---
date: YYYY-MM-DD
week: YYYY-WW
compliance_score: 0.85 # optional — 0.0 to 1.0
---
```

| Field              | Required | Used for                              |
| ------------------ | -------- | ------------------------------------- |
| `date`             | yes      | "Latest review: 2026-05-10"           |
| `compliance_score` | no       | compliance widget (else "not scored") |

Section text read: first paragraph after `## What's working` and `## What's regressing` — surfaced in the tile.

## Parser-health tile

The dashboard shows a small tile listing files that were parsed but had warnings:

- Missing required field
- Malformed frontmatter (unclosed `---`, invalid YAML)
- Cross-reference to a non-existent target (`linked_adrs: [99]` when ADR 99 doesn't exist)

This tile is the early-warning system for schema drift — when it's empty, the dashboard's view of the repo is trusted.

## Charter reference

This contract lives under charter Section 2 (Specs before code). Changes to the schema follow the normal RFC/ADR flow.
