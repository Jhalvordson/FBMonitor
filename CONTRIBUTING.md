# Contributing

This repo follows the engineering charter at `docs/engineering-charter.md`. Read it. The rules below are summary; the charter is authoritative.

## Setup

```bash
git clone <repo-url>
cd {{PROJECT_NAME}}

# Pre-commit hooks (required)
pip install pre-commit
pre-commit install

# Dependencies
{{INSTALL_COMMAND}}
```

## Workflow

1. **Pull before starting.** `git status`, then `git pull`.
2. **Branch from `main`.** Naming: `feat/short-thing`, `fix/short-thing`, `chore/short-thing`, `refactor/short-thing`, `docs/short-thing`, `spike/short-thing`.
3. **For non-trivial changes, write an RFC first.** `docs/rfc/NNNN-short-name.md`. PR with the RFC. Discussion happens there before code.
4. **For architectural decisions, write an ADR.** `docs/adr/NNNN-short-name.md`. Half a page. Context, decision, consequences.
5. **Small commits, often.** Conventional Commits format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`, `perf:`. Lowercase, present tense, no period.
6. **Push your branch frequently.** End every session with a push, even mid-feature.
7. **Open a PR.** Title = your Conventional Commit message. Description = what changed and why.
8. **Self-review your own diff.** Use the "Files changed" tab. Read every line as if a stranger wrote it.
9. **CI must be green.** Tests, lint, security checks all pass.
10. **Definition of Done** (charter Section 4) — every box checked before merge.

## Definition of Done

A change merges only when ALL are true:

- [ ] Tests pass (unit + relevant integration)
- [ ] Pre-commit hooks pass
- [ ] CI green
- [ ] Conventional Commit message
- [ ] Self-review of own diff completed
- [ ] If schema change: migration is idempotent and reversible
- [ ] If new dependency: justified in PR description
- [ ] If user-facing: ARCHITECTURE.md or relevant README updated
- [ ] If non-trivial: ADR written or RFC referenced

## What needs an RFC vs ADR vs ticket

- **RFC** — new system, major feature, architectural change. One page minimum.
- **ADR** — meaningful architectural choice (database, framework, vendor, structural pattern, deviation). Half a page.
- **GitHub issue** — concrete defect, clear feature request, ops task.
- **Idea (not yet ready)** — `docs/ideas/<slug>.md`. Sits two weeks before promotion.

## When you're stuck

The charter Section 3 lists "stop-and-ask" triggers. Common ones:

- "I think I lost my changes."
- "I'm getting a merge conflict I don't understand."
- "I need to undo a commit that's already pushed."
- "Pre-commit hook is failing and I want to skip it." (Don't. Ask why.)

Ask. Cheaper than guessing wrong.

## Spike branches (hack-to-learn)

If you need to hack to figure out feasibility:

- Branch name: `spike/short-thing`.
- No quality bar; learn fast, write ugly code.
- **Never merged.** Capture learnings in an ADR, then delete the branch.
- Time-box: half a day to two days. Past that, commit to building it properly.

## Override policy

If you must violate a charter rule, log the override in the relevant ADR or PR description with the reason. The charter accommodates deliberate breaks; what it doesn't accommodate is silent ones.
