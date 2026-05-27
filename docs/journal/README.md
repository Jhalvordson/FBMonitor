# Journal — Weekly Hat-Check

Weekly hat-check journal entries live here. One file per week.

## Why

Charter Section 11: weekly cadence requires a 15-minute hat-check entry every Sunday evening.

The journal exists because solo work drifts without explicit ceremony. Without a forcing function, "business-owner" mode dominates "engineer" mode (because tomorrow's revenue is concrete and tomorrow's tech debt is abstract). The hat-check is the forcing function.

## When

Sunday evening, before the week ends. 15 minutes max. If you can't do 15 minutes, do 5 — partial signal beats none.

## Format

Filename: `YYYY-WW.md` (ISO week number — e.g., `2026-19.md`).

Template:

```markdown
# Hat-Check — Week 2026-WW

## What did business-owner-me ship this week?

- (concrete items: features delivered, customer requests handled, deals closed)

## What did engineer-me ship this week?

- (foundation work: tests added, RFCs written, ADRs captured, refactors completed, infra hardened)

## Are they balanced?

<!-- Honest read. If imbalanced, name the imbalance and what corrects it. -->

## What's the one thing I'll do differently next week?

<!-- One commitment. Specific. Verifiable. Not "do better" — "split my next 3 PRs deliberately." -->
```

## How this connects to the automated review

The Sunday 18:00 automated review (see `docs/personal/development-plan.md`) reads the most recent journal entry and:

- Compares stated focus to actual work pattern.
- Surfaces drift if stated focus and actual diverge.
- Rolls forward unfulfilled commitments to next week.

If a journal entry is missing for the past week, the automated review flags it as a charter Section 11 violation.

## Charter reference

See `docs/engineering-charter.md` Section 11.
