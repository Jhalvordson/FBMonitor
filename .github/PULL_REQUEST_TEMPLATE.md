<!--
PR title must be a Conventional Commit: feat: / fix: / refactor: / docs: / chore: / test: / perf: / style: / build: / ci: / revert:
Lowercase, present tense, no period. Example: "feat: add WennSoft catalog browser"
-->

## What changed

<!-- Brief description of the change -->

## Why

<!-- The motivation. Reference an issue, RFC, or ADR if relevant.
Closes #...
RFC: docs/rfc/NNNN-...md
ADR: docs/adr/NNNN-...md
-->

## How

<!-- One or two sentences on the approach. Skip if obvious from the diff. -->

## Definition of Done (charter Section 4)

- [ ] Tests pass (unit + relevant integration)
- [ ] Pre-commit hooks pass
- [ ] CI green
- [ ] Conventional Commit message
- [ ] Self-reviewed own diff
- [ ] If schema change: migration is idempotent and reversible
- [ ] If new dependency: justified below
- [ ] If user-facing: ARCHITECTURE.md or README updated
- [ ] If non-trivial: ADR written or RFC referenced

## New dependencies (if any)

<!-- For each: what does it do, why not stdlib, maintenance signal, alternative considered. Delete if none. -->

## Risk / blast radius

<!-- What could go wrong? Migration risk? User-facing regression risk? Security risk? Delete if low risk. -->

## Charter overrides (if any)

<!-- If this PR deliberately violates a charter rule, log it here with the reason. Section reference (e.g., "Override charter Section 3.5: bundling concerns because..."). Delete if none. -->
