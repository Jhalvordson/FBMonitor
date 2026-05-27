# RFCs — Request for Comments

This directory holds RFCs (design proposals) for non-trivial work.

## When to write an RFC

Required for:

- New systems or major features.
- Architectural changes.
- Anything that meaningfully changes how a part of the codebase works.

Not required for:

- Bug fixes (unless they require an architectural change to fix properly).
- Small refactors.
- Changes that fit in a single small PR with obvious correctness.

If you can't write a one-page RFC for it, you don't understand the problem well enough to build it.

## How to write one

1. Copy `0000-template.md` to `NNNN-<slug>.md` (next sequential number, kebab-case slug).
2. Fill in the sections. Lead with **Context** (why are we doing this).
3. Open a PR with the RFC. The PR is the discussion thread.
4. Iterate on review feedback in the PR.
5. When accepted, merge the PR and start a paired issue (use the `RFC discussion` issue template) to track ongoing decisions during implementation.
6. Implementation PRs reference the RFC by path.

## Lifecycle

- **Draft** — open for discussion (PR open).
- **Accepted** — merged, ready to implement.
- **Implemented** — work is done; the RFC is now historical.
- **Superseded by RFC NNNN** — a newer RFC replaces this one. Update the front-matter; don't delete the file.
- **Rejected** — closed PR with reason; file does not merge.

## Pre-mortem requirement

Non-trivial RFCs must include a **Pre-mortem** section. See `0000-template.md`.

## Charter reference

See `docs/engineering-charter.md` Section 2.
