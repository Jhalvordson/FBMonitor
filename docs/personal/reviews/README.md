# Personal Reviews

Weekly self-review reports written by the automated review agent.

## How files get here

Charter Section 11 + the development plan's "Automated review" section define the cadence. A scheduled Claude agent runs Sunday 18:00 and writes one file per week here.

Filename: `YYYY-WW.md` (ISO week numbering).

## What's in each report

- Scorecard (this week / 4-week avg / trend)
- Charter compliance (per-section pass/fail)
- What's working (with specific commit references)
- What's regressing (with specific patterns)
- 1–3 coaching nudges
- Hat-check signal (drift between stated and actual focus)
- Carry-over from last week
- Commitments for next week (filled in Monday)

## Required frontmatter

```yaml
---
date: YYYY-MM-DD # the Sunday the review was generated
week: YYYY-WW # ISO week (matches filename)
compliance_score: 0.85 # 0.0–1.0, overall charter compliance for the week
---
```

The `compliance_score` field is consumed by `docs/dashboard.html` for the charter-compliance widget. Reviews without the field render as "not scored" — supported for back-compat, but the review agent populates it going forward.

## Reading rhythm

- **Sunday 18:00:** report is generated.
- **Monday morning:** read it. Fill in next-week commitments.
- **Throughout the week:** revisit when patterns surface.

The session-start hook in `.claude/settings.json` surfaces unread reviews so they don't get ignored.

## When the automation goes silent

If two consecutive weeks have no report, the routine is broken. See `docs/runbooks/personal-review.md` (when written).

## Privacy note

This directory is committed to git so trends survive across machines. If at some point you want this private (separate from the team-readable repo), move it to a private location and adjust the development plan's "Automated review" section accordingly.

## Charter reference

See `docs/engineering-charter.md` Section 11.
