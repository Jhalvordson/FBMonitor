---
version: 1.0
adopted: { { DATE } }
project: { { PROJECT_NAME } }
maintainer: { { NAME } }
---

# Personal Development Plan — {{PROJECT_NAME}}

This is my personal coaching contract for working on {{PROJECT_NAME}}. It captures who I am as an engineer right now, what I'm working on improving, and how Claude should help.

The engineering charter (`docs/engineering-charter.md`) is the rules of the road for the _project_. This plan is _my_ rules — what I want to grow into and what I want help avoiding. The charter is portable across projects; this plan is mine alone.

## Where I am right now

Honest current state. Update at the start of each project and at each quarterly retrospective.

**Strengths to lean on:**

- {{STRENGTH_1}} (e.g., Strong domain expertise.)
- {{STRENGTH_2}} (e.g., Strategic instinct — see architectural simplifications quickly.)
- {{STRENGTH_3}} (e.g., Cost-aware — ask "what's the recurring cost?" before adopting things.)

**Areas I'm growing in:**

- {{GROWTH_1}} (e.g., Spec-before-code discipline.)
- {{GROWTH_2}} (e.g., Test-driven habits.)
- {{GROWTH_3}} (e.g., Git workflow rigor across machines.)

**Patterns I'm watching:**

- {{WATCH_1}} (e.g., Idea generation outpaces ship rate.)
- {{WATCH_2}} (e.g., Late-night-coding bug rate.)
- {{WATCH_3}} (e.g., Business-owner-hat dominates engineer-hat.)

## Focus this quarter

Three deliberate growth areas at most. More than three and I'm not actually focusing.

1. **{{FOCUS_AREA_1}}** — what good looks like at the end of the quarter. Specific, measurable.
2. **{{FOCUS_AREA_2}}** — same.
3. **{{FOCUS_AREA_3}}** — same.

What I'm explicitly **not** doing this quarter:

- {{AWAY_FROM_1}} (e.g., Adding new initiatives. Three active is the cap.)
- {{AWAY_FROM_2}} (e.g., Migrating side-project A — out of scope.)

## Cadence

- **Daily:** `git status` + `git pull` first action. End of session: commit + push, even mid-feature.
- **Weekly (Sunday evening):** 15-minute hat-check journal entry in `docs/personal/journal/<date>.md`.
  - What did business-owner-{{NAME}} ship this week?
  - What did engineer-{{NAME}} ship this week?
  - Are they balanced? If imbalanced, what corrects it?
  - What's the one thing I'll do differently next week?
- **Weekly (Sunday 18:00):** Automated review fires (see "Automated review" below). Read it Monday morning.
- **Quarterly:** Full retrospective. Review the past 12 weekly reviews. Update this plan.

## Anti-patterns I'm correcting

Specific patterns I've observed in myself and want help breaking.

1. **{{ANTI_PATTERN_1}}**
   - What it looks like: …
   - Why I do it: …
   - Trigger I want enforced: …

2. **{{ANTI_PATTERN_2}}** — same structure.

3. **{{ANTI_PATTERN_3}}** — same structure.

## Coaching triggers (specific to me)

Beyond the charter's general triggers (`docs/engineering-charter.md` Section 9), push back specifically when:

- I propose a feature without checking the parking lot first ("did this idea sit two weeks?").
- I'm about to deploy after 11pm on a weeknight or any time on a Friday.
- I bundle multiple concerns into a single PR.
- I ask "what do you think we should do?" on a decision that's mine to make.
- I propose a new tech stack/framework when an existing one would work.
- I commit code without a Conventional Commit message.
- {{ADDITIONAL_TRIGGER_1}}
- {{ADDITIONAL_TRIGGER_2}}

## Automated review

### Schedule

A weekly scheduled Claude agent runs **Sunday 18:00 local time** (cron `0 18 * * SUN`) and writes a report to `docs/personal/reviews/YYYY-WW.md` (ISO week numbering).

Implementation: created via the Claude Code `schedule` skill. Routine runs autonomously with read access to the project repo and the GitHub API (via `gh` CLI authenticated on the runner).

### Data sources the agent reads

| Source              | Command / path                                                                     | What's extracted                                                                 |
| ------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Engineering charter | `docs/engineering-charter.md`                                                      | Rule list (sections 1–12) — used as compliance checklist                         |
| This plan           | `docs/personal/development-plan.md`                                                | Focus areas, anti-patterns, coaching triggers, override log                      |
| Git history         | `git log --since="$(date -d '7 days ago' --iso-8601)" --pretty=format:"%h %ai %s"` | Commits this week — count, conventional-commit %, late-night count, average size |
| Merged PRs          | `gh pr list --state merged --search "merged:>=$(date -d '7 days ago' --iso-8601)"` | PR count, average size (LOC), average open-to-merge time                         |
| Active initiatives  | `gh project item-list <project-id> --format json`                                  | Count of items with status=in-progress vs three-cap                              |
| Idea parking lot    | `docs/ideas/*.md` (file mtimes)                                                    | Idea ages — flag any that have been promoted in <14 days                         |
| RFCs                | `docs/rfc/*.md` (and PR/commit cross-reference)                                    | Did this week's non-trivial PRs have RFCs?                                       |
| ADRs                | `docs/adr/*.md`                                                                    | ADRs added this week, decisions captured                                         |
| Journal             | `docs/personal/journal/<date>.md`                                                  | Hat-check entry exists for this week? Content reviewed for hat balance           |
| Override log        | This file's "Override log" section                                                 | Overrides this week — clustering signals                                         |
| Prior reviews       | `docs/personal/reviews/*.md` (last 4)                                              | Trend comparison; carry-over of unfulfilled commitments                          |

### Output format

```markdown
# Personal Development Review — Week YYYY-WW

## Scorecard

|                                 | this week | 4-week avg | trend |
| ------------------------------- | --------- | ---------- | ----- |
| Commits                         |           |            |       |
| Conventional Commit format %    |           |            |       |
| PRs merged                      |           |            |       |
| Avg PR size (LOC)               |           |            |       |
| DoD compliance (n/n)            |           |            |       |
| Active initiatives              |           |            |       |
| RFCs written                    |           |            |       |
| ADRs written                    |           |            |       |
| Ideas parked vs coded           |           |            |       |
| Late-night commits (11pm-3am)   |           |            |       |
| Friday/weekend deploys          |           |            |       |
| Spike branches (created/merged) |           |            |       |
| Override log entries            |           |            |       |

## Charter compliance

| Section | Rule                              | Status  | Notes |
| ------- | --------------------------------- | ------- | ----- |
| 2       | RFC required for non-trivial work | ✓ / ✗   | …     |
| 3.5     | One PR per change                 | ✓ / ✗   | …     |
| 4       | Definition of Done                | x/y PRs | …     |
| 4       | Secrets never committed           | ✓ / ✗   | …     |
| 8       | Three-active cap                  | ✓ / ✗   | …     |
| 8       | Two-week rule for new ideas       | ✓ / ✗   | …     |
| 11      | Weekly hat-check entry            | ✓ / ✗   | …     |

| (others as relevant)

## What's working

- (specific examples with commit hashes / PR numbers)

## What's regressing

- (specific patterns with examples)

## Coaching nudges for next week

1. …
2. …
3. …

## Hat-check signal

- Stated focus this week (from journal): …
- Actual work pattern: …
- Drift assessment: …

## Carry-over from last week

- (commitments from last week's review — fulfilled? deferred?)

## Commitments for next week (fill in Monday)

[ ] …
[ ] …
[ ] …
```

### Agent prompt (canonical)

This is the prompt the scheduled routine runs. Stored at `~/.claude/skills/personal-review/prompt.md` and reused by the `/personal-review` slash command.

```
You are running a personal development review for the project at $REPO_PATH.

Source of truth for rules: docs/engineering-charter.md (cite section numbers).
Source of truth for personal goals: docs/personal/development-plan.md.

Read all data sources listed in the development plan's "Automated review" section.
Compute the scorecard. Compare to the last 4 weekly reviews in docs/personal/reviews/.
Identify what's working and what's regressing — cite specific commits, PR numbers, file paths.
Generate 1–3 coaching nudges grounded in observed patterns, not generic advice.
Surface hat-check drift if stated focus and actual work diverge.
Carry over unfulfilled commitments from last week.

Tone: candid, specific, useful. Not corporate. Not gentle. The author asked for honest signal.

Write the report to docs/personal/reviews/YYYY-WW.md (ISO week, e.g. 2026-19.md). Open a PR.
```

### Surfacing unread reviews

A `SessionStart` hook in `.claude/settings.json` runs at session start and:

1. Lists `docs/personal/reviews/` files newer than the maintainer's last-read marker (`docs/personal/.last-read`).
2. If any unread, surfaces a banner in the session: "📋 N new personal review(s) available. Run `/personal-review-show` or open `docs/personal/reviews/<latest>.md`."

A complementary `/personal-review-show` slash command displays the latest review inline and updates the last-read marker.

### Ad-hoc review (`/personal-review`)

Same prompt, same data sources, but runs against "since last review" rather than "this calendar week." Use when:

- Mid-week check-in.
- Before starting a new initiative (sanity-check current load).
- After completing a phase (retrospective for that phase).

### When the automation goes silent

If two scheduled reviews in a row don't show up in `docs/personal/reviews/`, the routine is broken. Investigate:

- Routine status (Claude Code → schedule list)
- GitHub auth on the runner (gh auth status)
- Repo access permissions

This is one of those things that should be a runbook entry (`docs/runbooks/personal-review.md`).

## Quarterly retrospective format

At the end of each quarter, write `docs/personal/quarterly-YYYY-QN.md`:

1. **Scorecard trend** — copy the metrics from each weekly review into a table. Look for trends.
2. **Wins** — what did I get measurably better at? Cite specific evidence (PRs, commits, journal entries).
3. **Regressions** — what got worse? Why? What does the override log say?
4. **Charter changes** — does anything in the charter need to update based on what I learned this quarter?
5. **Plan changes** — does this development plan need to update? Move some "growth areas" to "strengths"? Add new ones?
6. **Next quarter focus** — three things, with specific success criteria.

## Override log

When I deliberately override a coaching trigger, log it here with date and reason.

| Date       | Override | Reason |
| ---------- | -------- | ------ |
| _none yet_ |          |        |

If overrides cluster in any one category, that's a signal — either the rule is wrong (update the charter) or my discipline is slipping (focus area for next quarter).

## Plan changelog

| Version | Date     | Change            |
| ------- | -------- | ----------------- |
| 1.0     | {{DATE}} | Initial adoption. |
