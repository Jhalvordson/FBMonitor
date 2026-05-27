# Ideas — Parking Lot

This directory is the parking lot for ideas that aren't yet ready to become work.

## The two-week rule

Charter Section 8: **new ideas wait two weeks before being promoted to RFC.**

The rule exists because:

- Most ideas die in the parking lot once the energy fades — that's a feature, not a bug.
- Two weeks of distance reveals whether the idea is genuinely valuable or just exciting.
- Forcing the wait protects against scope creep.

## How to park an idea

1. New file: `<slug>.md`. Use a descriptive slug, not a date.
2. Fill in the four sections: **Problem**, **Target user**, **Rough approach**, **Why now**.
3. Commit it. Move on.

## How to promote an idea

After two weeks:

1. Re-read the file. Does it still feel valuable?
2. If yes: write an RFC at `docs/rfc/NNNN-<slug>.md`. Reference this file. The RFC takes over.
3. If no: delete the file. Don't hoard.

## Quarterly review

Charter Section 11 mandates a quarterly walk through `docs/ideas/`. Promote what's earned its spot. Delete what hasn't aged well. Don't let this directory become a graveyard.

## Idea template

```markdown
# Idea: <name>

**Parked:** YYYY-MM-DD
**Earliest promotion:** YYYY-MM-DD (= parked + 14 days)

## Problem

<!-- One paragraph. What's the situation that needs improving? -->

## Target user

<!-- Who specifically experiences this problem? -->

## Rough approach

<!-- One or two sentences on how we'd solve it. Not a design — a sketch. -->

## Why now

<!-- What changed that makes this worth doing now versus later? -->

## Open questions

<!-- Anything you don't know yet -->
```

## Charter reference

See `docs/engineering-charter.md` Section 8.
