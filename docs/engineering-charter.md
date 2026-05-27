---
version: 1.1
adopted: 2026-05-08
last_updated: 2026-05-08
---

# Engineering Charter

This charter defines how engineering is done in this project. It is authoritative — when it conflicts with how we'd "rather" do something in the moment, the charter wins, unless the override is deliberate and logged.

The aim isn't perfection. It's **professional with minimal ceremony**: the 80% of practice that gives 95% of the benefit, and stop there. When in doubt, do _less_ ceremony, not more.

## How to use this charter

- Read it once on first arrival to a project.
- The maintainer (Claude, in this project's setup) treats every section as enforceable. When a request violates a section, the maintainer pushes back and cites the section number. The author can override by stating a reason; the override is logged in the relevant ADR or PR description.
- Improvements flow forward via `claude-starter`. When the canonical charter updates, the project gets a notification (via session-start hook) but is not auto-updated. Apply via `/charter-sync` deliberately.
- Re-read quarterly. Update what's working, kill what isn't.

---

## Section 1 — Working principles

- **Charter is law, not advice.** Violations are pushed back on with section citation. Overrides are deliberate and logged.
- **Improvements flow forward, not back.** New rules apply to new work. Existing work follows the rules in force when it was written, unless explicitly migrated.
- **80% for minimal work.** When in doubt about whether a rule applies, default to the lighter version. No ceremony for ceremony's sake.
- **Done means done.** Definition of Done is a gate, not a suggestion. "I'll fix it later" is not a state.

---

## Section 2 — Specs before code

For non-trivial work, write before you build.

**RFC (Request for Comments)** — required for any new system, major feature, or architectural change.

- Lives in `docs/rfc/NNNN-short-name.md`.
- One page minimum, five pages typical.
- Sections: Context, Proposed approach, Alternatives considered, Open questions, Verification.
- Reviewed via PR before any meaningful code is written.

If you can't write a one-page RFC for it, you don't understand the problem well enough to build it.

**ADR (Architecture Decision Record)** — required when a meaningful architectural choice is made (database, framework, vendor, structural pattern, deviation from convention).

- Lives in `docs/adr/NNNN-short-name.md`.
- Half a page is enough.
- Sections: Context, Decision, Consequences.
- ADRs are immutable once accepted. Superseded by newer ADRs, never edited in place.

When in doubt: write an ADR for any decision a future-you (or a future teammate) might ask "why did we do X" about.

**Idea parking lot** — `docs/ideas/`. New ideas always start here, never in code. See Section 8.

**Pre-mortem** — required for non-trivial RFCs.

- Before starting, spend 15 minutes on: "If this fails in 3 months, what's the most likely cause?" Write down the top 3 risks.
- Lives at the bottom of the RFC under a "Pre-mortem" heading.
- Forces explicit thought about failure modes before code commits the assumptions.
- At each milestone, re-read the pre-mortem. If a risk is materializing, surface it in the next decision register entry, not at the post-mortem.

---

## Section 3 — Git workflow

1. **Pull before starting, every time.** First action of every session: `git status`, then `git pull` (or `git pull --rebase` if you have local commits).
2. **Never work directly on `main`.** Branch naming: `feat/short-thing`, `fix/short-thing`, `chore/short-thing`, `docs/short-thing`, `refactor/short-thing`. Six words max in the description.
3. **Commit often, push often.** Every meaningful logical chunk gets a commit. Every session ends with `git push`, even mid-feature. Personal feature branches are cheap; lost work is expensive.
4. **Conventional Commits format.** `feat: add WennSoft catalog`, `fix: handle null employee in timesheet`, `refactor: extract storage adapter`, `docs: update charter section 4`, `chore: bump dependencies`. Lowercase, present tense, no trailing period.
5. **One PR per change.** Even solo. PR title is the same Conventional Commit message that will land on `main` after squash-merge.
6. **Self-review your own diff.** Open the PR's "Files changed" tab. Read every line as if a stranger wrote it. ~30% of solo bugs surface here.
7. **Branch protection on `main`.** No direct pushes. Require PR + green CI. Even when working alone — the friction is the point.
8. **Cross-machine discipline.** End of every session: commit + push. Never start work on Machine B without confirming Machine A is fully pushed. If you discover unpushed work on A: stop, push from A, then continue on B. Diverged branches across machines is the #1 way solo developers lose work.
9. **Force-push policy.** Use `git push --force-with-lease`, never plain `--force`. Only on your own feature branches. Only before review begins. Never on `main`. Never on a branch someone else is working on.
10. **When you mess up.**
    - Wrong branch: `git reset HEAD~` keeps changes, undoes commit. Then commit on the right branch.
    - Bad commit on a feature branch (already pushed): amend or rebase, then `git push --force-with-lease`.
    - Bad commit on `main`: `git revert <sha>` creates a new commit that undoes it. Never `--force` to `main`.
    - Lost in a merge conflict: stop, ask. Cheaper to ask than to guess wrong.
11. **Stop-and-ask triggers.**
    - "I think I lost my changes."
    - "I'm getting a merge conflict I don't understand."
    - "I need to undo a commit that's already pushed."
    - "Pre-commit hook is failing and I want to skip it." (Don't. Ask why it's failing.)

### Spike branches (hack-to-learn, throw-away)

Sometimes you need to hack to figure out if something is even possible. The charter doesn't ban this — it draws a clean line between exploration and production.

- Branch name: `spike/short-description`. Naming is the contract: this branch is throw-away.
- No quality bar. Skip tests, skip lint, write the ugliest code that answers the question. The point is _learning fast_, not shipping.
- Spike branches are **never merged.** Once you've learned what you needed, delete the branch and write the real version on a `feat/` branch from scratch.
- Capture the learnings in an ADR or a comment on the parent issue before deleting. The branch goes; the knowledge stays.
- Time-box spikes: half a day, a day, two days. Past that, you've stopped learning and started building. Stop, decide whether to commit (real branch + RFC) or abandon.

The principle: **spikes let you hack guilt-free without polluting production.** What kills solo developers is when "I'll just hack this real quick" code lands on `main`.

---

## Section 4 — Code quality gates

### Testing standards

- New business logic in `shared/` requires unit tests. No exceptions.
- New external integrations (sync scripts, MS Graph, Supabase calls, etc.) require integration tests with mocked boundaries.
- Critical user flows have end-to-end smoke tests in CI.
- Coverage isn't a hard target, but: any service module under 60% coverage gets a `docs/test-debt.md` entry naming what's untested and why.
- Tests must run in under 5 minutes locally. Past that, you'll stop running them, which makes them worthless.

### Dependency hygiene

- Lockfile is required and committed (`uv.lock`, `package-lock.json`, etc.). Regenerated only deliberately.
- New dependency → PR description must answer:
  - What does this library do?
  - Why not the standard library?
  - Maintenance signal (last release, GitHub stars, license, known security history)?
  - What's the alternative we're rejecting?
- `pip-audit` / `npm audit` runs in CI. High-severity findings block merge.
- "Boring tech" principle: only adopt new frameworks/languages/runtimes when there's a concrete payoff. Default to what's already in the project.

### Secret management

- Never commit secrets. gitleaks pre-commit hook blocks it.
- Secrets live in:
  - `.env` files (gitignored) for local development.
  - Windows DPAPI (or platform-equivalent) for desktop apps storing tokens.
  - Vercel environment variables for web deployments.
  - Supabase Vault for backend / database secrets.
- Every API key has an entry in `docs/secrets-inventory.md` — name, what it's for, where the value lives, who can rotate. No values, just metadata.
- Rotation policy: any leaked or suspected-leaked key rotates immediately. Other keys rotate annually on a calendar date.

### Definition of Done

A change merges only when ALL are true:

- [ ] Tests pass (unit + relevant integration)
- [ ] Pre-commit hooks pass
- [ ] CI green
- [ ] Conventional Commit message
- [ ] Self-review of own diff completed
- [ ] If schema change: migration is idempotent and reversible (down migration written)
- [ ] If new dependency: justified in PR description
- [ ] If user-facing: ARCHITECTURE.md or relevant README updated
- [ ] If non-trivial: ADR written or RFC referenced

### Migration safety

- Idempotent (re-runnable without error).
- Reversible (companion `down` migration written and reviewed before merge).
- Tested against a copy of production data before deploy.
- Migrations on tables larger than 1M rows require a staged rollout plan in the PR description.
- Default deploy window: weekend morning. Never during peak hours.
- Schema changes touching hot tables get an ADR.

---

## Section 5 — Documentation

- **README per directory** at meaningful tree levels. One paragraph: what's here and why.
- **`ARCHITECTURE.md`** at root. High-level system overview with one C4 Context-level Mermaid diagram. Updated when the architecture meaningfully changes, not every release.
- **`CHANGELOG.md`** maintained per release. Auto-generated from Conventional Commits where possible.
- **`docs/runbooks/`** for operational guides — "what to do when X breaks."
- **`docs/diagrams/`** for Mermaid sources used in docs.
- **Comments are exceptions, not defaults.** Default no comments. Comment only when there's a non-obvious _why_: a hidden constraint, a specific bug workaround, an invariant a reader would miss. Never explain _what_ the code does — names should do that. Never reference the current task or recent PR — that belongs in the PR description and rots as the codebase evolves.

---

## Section 6 — Decision tracking

- **ADRs** for architectural decisions (Section 2).
- **Idea parking lot** — `docs/ideas/<slug>.md`. New ideas land here first. See Section 8.
- **Decision register** — `docs/decisions/register.md`. Open questions, who owns, decide-by date. Reviewed quarterly.
- **Override log** — when a charter trigger is overridden deliberately, log it in the ADR or PR description. If overrides cluster in any one trigger, that's a signal to update the rule.

---

## Section 7 — Cost awareness

- Every external dependency, API, or SaaS adopted gets a "recurring cost" note in its ADR. Even free tiers — note what changes when you outgrow them.
- Every recurring API cost (LLM calls, Vercel functions, paid SaaS) has a budget cap and a usage dashboard or equivalent visibility.
- "What's the recurring cost?" is asked early in every architecture conversation, not after a vendor has been chosen.
- Cost decisions get an ADR even when the answer is "it's free for our use." Future-you needs to know what assumptions held at the time.

---

## Section 8 — Idea management

- **Two-week rule.** New ideas go to `docs/ideas/<slug>.md` (problem, target user, rough approach, why-now). The idea sits for two weeks. _Then_ consider promoting to RFC. Most ideas die in the parking lot — that's a feature, not a bug.
- **Three-active cap.** Active roadmap is capped at three concurrent initiatives. Adding a fourth requires removing one (delete or move to parked). Tracked in GitHub Projects with an "active" label.
- **Ship before you start.** A new initiative cannot begin until the previous one passes Definition of Done. No exceptions without a logged override.
- **Quarterly parking-lot review.** Each quarter, walk `docs/ideas/`. Promote what's earned its spot. Delete what hasn't aged well. Don't hoard.

---

## Section 9 — Coaching triggers

The maintainer (Claude in this project's setup) pushes back when any of these patterns appear:

- A quick fix is requested that masks a root cause we've already identified.
- A non-trivial change is proposed without an RFC.
- A force-push, late-night deploy (after midnight on a weeknight), or Friday/weekend deploy is about to happen.
- Something that looks like a secret is about to be committed.
- A new dependency is added without justification.
- A new initiative is starting before the previous one is at Definition of Done.
- A decision is being thrown to the maintainer that should be the project owner's (architecture, naming, business priority).
- An unfamiliar file, branch, or config is about to be deleted or overwritten.
- A pre-commit hook is being skipped.
- A PR bundles multiple concerns ("while I'm here" cleanup mixed with feature work).
- A new tech stack/framework is being introduced when an existing one would work.

Pushback cites the section number being invoked. The author can override with a stated reason; the override is logged.

**Triggers added in v1.1:**

- A spike branch is being merged to a feature branch or `main` (Section 3 — spikes are throw-away).
- A non-trivial RFC has no pre-mortem (Section 2).
- Production code is shipping without observability hooks (Section 10).
- An API endpoint is shipping without a stated performance budget (Section 10).
- A weekly hat-check entry hasn't been written for the previous week (Section 11).

---

## Section 10 — Observability & operations

You can't fix what you can't see. The bar isn't perfect — it's "you find out before your users tell you."

### Observability defaults

- **Error tracking** — every app reports errors to Sentry (free tier is generous; paid only when traffic warrants). Errors carry context: user identifier, request id, machine, version.
- **Structured logging** — JSON logs with correlation ids, not free-text. Logs include severity, timestamp, request id, what was being attempted, what happened. Search-friendly out of the box.
- **Uptime monitoring** — production endpoints have an uptime check (Better Uptime, Hyperping, or even a cron-driven Supabase row). Failure pages someone or writes a Slack message; doesn't sit silent.
- **Cron job heartbeats** — every scheduled job writes a `job_heartbeats` row on completion. Missed heartbeats are alerts. Silent failures are the worst kind.

### Performance budgets

- Every API endpoint has a stated **target latency** (p95) in its module's README or in a perf-budgets table. Endpoints that breach for 7+ days get an issue, not a "we'll see."
- Every cron job has a stated **max runtime**. Runs exceeding budget get logged with diagnostic context.
- Every user-facing page (web tools) has a target **LCP** (Largest Contentful Paint). Tracked via Real User Monitoring, not synthetic.
- Budgets are reviewed quarterly. Tighten when actual is consistently better; loosen with an ADR when the work makes a higher budget acceptable.

### Runbooks

- `docs/runbooks/<service>.md` — for each production service: how it works, how to deploy, how to roll back, where logs are, common failure modes and what to do. One page each, kept current.
- The runbook is the artifact that lets future-you (or someone else) handle a 2am incident without page-flipping through the codebase.

---

## Section 11 — Cadence

Solo and small-team work drifts without explicit ceremony. The minimum viable rhythm:

### Daily

- `git status` + `git pull` first action of every session.
- Commit + push at the end of every session, even mid-feature.

### Weekly (Sunday evening)

- **Hat-check journal entry** in `docs/personal/journal/<date>.md`. 15 minutes, written.
  - What did business-owner-me ship this week?
  - What did engineer-me ship this week?
  - Are they balanced?
  - What's the one thing I'll do differently next week?
- **Automated review** fires Sunday 18:00 (see development plan). Read it Monday morning.

### Quarterly (first Sunday of each quarter)

- **Charter re-read.** Update what's working, kill what isn't, bump version if changed.
- **Idea parking lot review.** Walk `docs/ideas/`. Promote what's earned its spot. Delete what hasn't aged well. Don't hoard.
- **Personal retrospective.** Per `docs/personal/development-plan.md` quarterly format. Move "growth areas" to "strengths" where evidence supports it.
- **Roadmap reset.** Three active initiatives — verify, prune, replace as appropriate.

### Time/effort estimation discipline

- For non-trivial work, write down the estimate before starting. Live in the RFC.
- After completion, log the actual. Same RFC, "Actual" line below "Estimate."
- Quarterly: tabulate variance. Build calibration over time. Solo developers are notoriously bad at estimation; tracking is how you get better.

---

## Section 12 — Working with AI assistants

This project's primary AI assistant is Claude (Claude Code). Working with AI is a real engineering competency, not a passive convenience. The discipline:

### When to use what

- **Plan mode** — for any non-trivial task (3+ steps, architectural decisions, or anything ambiguous). Never skip plan mode for "I'll just figure it out as I go" — that's how you ship architectural debt.
- **Sub-agents** — for parallel exploration of large codebases, research that would consume main context, or tasks where one specialized agent will do better than the main thread (e.g., `Explore` for codebase mapping, `Plan` for design alternatives).
- **Direct prompting** — for small, well-scoped tasks where context is already loaded.

### Context hygiene

- **Never read entire large files into main context.** Use `offset`/`limit`. Delegate exploration to sub-agents and receive summaries.
- **Break multi-feature work into separate sessions.** One feature per session. Mixing pollutes context and degrades output.
- **Watch context budget.** If a session has many large file reads or several big tool results, start delegating to sub-agents immediately. Don't wait for context to overflow.
- If "Prompt is too long" hits, the session is dead. `/clear` and start fresh.

### Self-improvement loop

- After any correction the maintainer makes, update `tasks/lessons.md` with the pattern. Iterate ruthlessly until the same correction stops being needed.
- Lessons are project-scoped. Carry forward to new projects only the ones still relevant.
- Mistake-rate trending down is real signal that the AI assistant is improving on this codebase.

### Verification before declaring done

- Never mark a task complete without proving it works.
- Run tests, check logs, demonstrate correctness.
- Ask: "Would a senior engineer approve this?" If unsure, ask explicitly.
- Diff behavior against `main` when relevant — don't assume the change is what you intended.

### Cost awareness for AI itself

- LLM calls are not free. Track usage (Anthropic console, etc.).
- Prefer caching (prompt cache for iterative refinement). One well-cached session beats five fresh ones in cost.
- For high-volume scripted use cases, evaluate whether a smaller model (Haiku) covers the need.

---

## Charter changelog

| Version | Date       | Change                                                                                                                                                                                                |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2026-05-08 | Initial adoption. Eight sections + coaching triggers.                                                                                                                                                 |
| 1.1     | 2026-05-08 | Added Tier 2: spike branches (Section 3), pre-mortem (Section 2), Observability & Operations (Section 10), Cadence (Section 11), Working with AI Assistants (Section 12). Coaching triggers extended. |
