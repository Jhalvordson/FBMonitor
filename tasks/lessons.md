# Lessons

Lessons learned in this project. The maintainer (Claude) reads this on session
start. Add a new entry whenever a correction is made or a non-obvious gotcha
surfaces. Iterate ruthlessly until the same correction stops being needed.

When this file is cloned into a new project bootstrapped from `claude-starter`,
**preserve the existing entries** — they capture failure modes of the scaffold
itself that downstream projects can re-inherit if someone modifies the
scaffold's config. Add your own project-specific entries below them.

---

## Scaffold-level lessons (inherited from claude-starter)

These two bit the scaffold's first real bootstrap. Both are fixed in the
shipped config — these entries explain WHY the config looks the way it does
so that future-you doesn't "clean it up" and re-introduce the bug.

### Pre-commit hygiene hooks need a GLOBAL exclude, not just per-hook prettier

**Symptom:** CI fails with "files were modified by this hook" diffs that
include thousands of lines of vendored or generated content. Often the
3.4 MB offline dashboard or the 3.3 MB vendored Mermaid.

**Root cause:** It's intuitive to put `exclude:` only on the prettier hook
(prettier is the visible "reformatter"). But `trailing-whitespace`,
`end-of-file-fixer`, `mixed-line-ending`, and `check-added-large-files
--maxkb=1024` will ALSO touch (or reject) those same files. The 3.4 MB
offline HTML blows the large-file check. The hygiene hooks silently
rewrite trailing whitespace inside the vendored library.

**Fix (already in `.pre-commit-config.yaml`):** A top-level `exclude:`
that applies to all hooks, listing every generated/vendored artifact:

```yaml
exclude: |
  (?x)^(
    docs/dashboard\.html|
    docs/dashboard\.offline\.html|
    docs/\.dashboard-manifest\.json|
    docs/vendor/.*
  )$
```

The prettier hook redundantly lists the same paths in its own `exclude:`
— defensive against pre-commit's per-hook-vs-global merge semantics
being undocumented.

**If you add a new vendored library or generated artifact:** add it to
BOTH the global `exclude:` and the prettier `exclude:`.

### Don't ship CI jobs gated on files that don't exist yet

**Symptom:** GitHub Actions workflow fails with 0-second "structural
validation failure." The run completes in 0 seconds with
`conclusion: failure` and an empty `jobs` array. `gh run view` says
"This run likely failed because of a workflow file issue." Quoting
`"on":` doesn't help.

**Root cause:** The original scaffold shipped with `python-tests`,
`python-security`, `node-tests`, `node-security`, and `required`
jobs gated on `if: hashFiles('pyproject.toml', ...) != ''`. On new
private repos with default Actions policies, this combination
(conditional jobs + `needs:` dependencies + `if: always()` aggregators)
trips workflow-load validation. The exact parser rule was never
identified — the bisect proved removing the jobs fixes it.

**Fix (already in `.github/workflows/ci.yml`):** The scaffold now ships
with only `pre-commit` and `conventional-commits`. The other jobs are
documented as comments at the bottom of the file.

**When you actually have Python or Node code:** add the relevant jobs
back as **real, unconditional** jobs (no `if: hashFiles(...)`). The
manifest exists now; just run the tests. Same applies to setup-python's
`cache: pip` — only enable it once `pyproject.toml` or `requirements.txt`
is in the repo.

**Symptom giveaway in the wild:**

- `gh api repos/.../actions/runs/{id}` shows `run_started_at == updated_at`
- `total_count: 0` jobs
- `gh run view <id>` says "workflow file issue"
- Quoting `"on":` doesn't help
- Removing one job at a time makes it work — that's the cue to remove
  the conditional infrastructure entirely

---

## Project-specific lessons

_Add new entries here as they come up. Use the same format: Symptom,
Root cause, Fix, How to apply._
