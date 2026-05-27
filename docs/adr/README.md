# ADRs — Architecture Decision Records

This directory holds ADRs — short, immutable records of architectural decisions.

## When to write an ADR

Required when a meaningful architectural choice is made:

- Database, framework, or vendor choice.
- Structural pattern (monorepo vs polyrepo, layered architecture, etc.).
- Deviation from convention.
- Anything a future-you (or a future teammate) might ask "why did we do X" about.

Half a page is enough. Don't over-engineer ADRs.

## How to write one

1. Copy `0000-template.md` to `NNNN-<slug>.md` (next sequential number).
2. Fill in **Context** (the situation), **Decision** (what we chose), **Consequences** (what follows). That's it.
3. Status starts as `proposed`. Becomes `accepted` when merged.
4. Once accepted, ADRs are **immutable**. Don't edit them. Supersede them with a newer ADR if needed.

## Lifecycle

- **Proposed** — open for discussion (PR open).
- **Accepted** — merged. The decision is in effect.
- **Superseded by ADR NNNN** — a newer ADR replaces this one. Update the front-matter; don't delete the file. The old ADR is historical record.
- **Deprecated** — the decision no longer applies but no replacement exists.

## Charter reference

See `docs/engineering-charter.md` Section 2.

## Reading order

The first ADR (`0001-record-architecture-decisions.md`) is the meta-ADR explaining why we use ADRs. Read it first.
