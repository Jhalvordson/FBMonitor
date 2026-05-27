# Git hooks

Project-tracked Git hooks. Run `scripts/install-hooks.sh` once after cloning to
activate them — Git defaults to `.git/hooks/` and ignores this directory until
you point `core.hooksPath` at it:

```sh
bash scripts/install-hooks.sh
```

Idempotent. The install script sets `core.hooksPath = .githooks` in the local
repo config.

## Active hooks

| Hook         | What it does                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pre-commit` | Rebuilds the dashboard snapshot if any of its data sources have changed. Re-stages `docs/.dashboard-manifest.json` and `docs/dashboard.offline.html` so the commit reflects current state. Skipped when no dashboard inputs changed. |

## Charter reference

Pre-commit hooks must pass — `--no-verify` is reserved for explicit overrides
with a stated reason. See `docs/engineering-charter.md` Section 4.
