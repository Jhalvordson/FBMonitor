---
adr: 0001
title: Record architecture decisions as ADRs
status: accepted
date: { { INITIAL_DATE } }
---

# ADR 0001: Record architecture decisions as ADRs

## Context

We need a way to record meaningful architectural decisions so future-us (and future teammates) can answer "why did we do X" without spelunking commit history or relying on memory.

The engineering charter (Section 2) requires ADRs for meaningful architectural choices. This ADR establishes the format and process.

## Decision

We will record architectural decisions as **ADRs** (Architecture Decision Records) in `docs/adr/NNNN-<slug>.md`.

Format follows Michael Nygard's lightweight ADR pattern: Context, Decision, Consequences. Half a page typical. Immutable once accepted — superseded by newer ADRs, never edited in place.

ADR template lives at `docs/adr/0000-template.md`.

## Consequences

What becomes easier:

- Future engineers (including future-us) can answer "why did we do X" by reading the ADR.
- Decisions become reviewable artifacts (they live in PRs before merging).
- Patterns of decisions become visible — clusters of similar ADRs surface architectural drift.

What becomes harder:

- Slight overhead per architectural decision (writing the ADR).
- Discipline required to actually write them rather than just deciding ad-hoc.

What we accept:

- Some decisions won't get ADRs in practice — small ones that don't seem meaningful at the time. We'll backfill when we discover the gap.
- ADRs are immutable, which means the format must work the first time. Templates help.

## Alternatives considered

- **Don't record decisions** — relies on memory and commit messages. Doesn't scale; future engineers (and future-us) lose context.
- **Long-form RFCs only** — too heavy for "we picked Postgres over MySQL" decisions. RFCs are for designs; ADRs are for choices.
- **Comments in code** — wrong granularity. Decisions span code; comments don't.

## Recurring cost

Negligible. Markdown files in the repo, written manually.

## References

- [Michael Nygard's original ADR pattern](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [adr.github.io](https://adr.github.io/) — broader resources
- Charter Section 2.
