# Engineering Charter — Changelog

This file tracks changes to `docs/engineering-charter.md` over time.

The charter itself has a `version` field in its front-matter. When that bumps, log what changed here. Bumps follow semver-ish:

- **Major** (1.0 → 2.0): a rule changed in a way that breaks existing assumptions.
- **Minor** (1.0 → 1.1): a section was added or extended.
- **Patch** (1.1.0 → 1.1.1): wording fix, no rule change.

Charter improvements made here flow forward to new projects (which spawn from `claude-starter`). Existing projects can opt-in via `/charter-sync`.

## Changes

### v1.1 — 2026-05-08

**Added:**

- Section 10 (Observability & operations) — error tracking, structured logging, uptime monitoring, performance budgets, runbooks.
- Section 11 (Cadence) — daily / weekly / quarterly rhythms; time/effort estimation discipline.
- Section 12 (Working with AI assistants) — when to use plan mode vs sub-agents, context hygiene, self-improvement loop, verification, AI cost awareness.

**Extended:**

- Section 2: pre-mortem requirement for non-trivial RFCs.
- Section 3: spike branches discipline (hack-to-learn, throw-away, never merged).

**Updated:**

- Section 9 (Coaching triggers): added five new triggers tied to the new sections.

**Why:** initial v1.0 covered Tier 1 (testing, secrets, DoD, two-week, deps, migrations). v1.1 adds Tier 2 — observability, cadence ceremonies, AI-as-a-skill, and pre-mortem/spike disciplines.

### v1.0 — 2026-05-08

**Added:**

- Initial adoption. Sections 1–9: Working principles, Specs before code, Git workflow, Code quality gates (testing/deps/secrets/DoD/migrations), Documentation, Decision tracking, Cost awareness, Idea management, Coaching triggers.

**Why:** establish the engineering practice baseline for `claude-starter` and any project that adopts it.
