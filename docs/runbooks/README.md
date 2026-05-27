# Runbooks

Operational guides — "what to do when X breaks." One file per service or system.

## Why

Charter Section 10 (Observability & operations): runbooks are the artifact that lets future-you (or someone else) handle a 2am incident without page-flipping through the codebase.

## What belongs in a runbook

For each production service:

- **What it is** — one paragraph. Purpose, key dependencies, where it runs.
- **How to deploy** — the actual commands or workflow.
- **How to roll back** — the actual commands. Tested.
- **Where logs are** — paths, dashboard URLs, query examples.
- **Common failure modes** — what's broken before, what fixed it.
- **Observability hooks** — which metrics to check, which alerts fire.
- **Owner** — who knows this best (even if it's just you, name yourself).

Keep each runbook to one page. If it gets longer, split into focused runbooks per failure mode.

## Filename convention

`<service-or-topic>.md`. Examples:

- `web-ops-deploy.md`
- `office-laptop-sync.md`
- `database-migration.md`
- `personal-review-automation.md`

## Update cadence

Update a runbook every time you discover something new in production. Stale runbooks are worse than no runbooks (they teach the wrong thing).

## Template

```markdown
# Runbook: <service or topic>

**Owner:** <name>
**Last verified:** YYYY-MM-DD

## What this is

<!-- One paragraph: purpose, dependencies, where it runs -->

## Deploy

\`\`\`bash
<actual commands>
\`\`\`

## Roll back

\`\`\`bash
<actual commands — tested>
\`\`\`

## Logs and observability

- Logs: <path or URL>
- Dashboard: <URL>
- Alerts: <where they fire, who they page>

## Common failure modes

### Failure: <symptom>

- **Cause:** …
- **Fix:** …
- **Prevention:** …

## Escalation

- If <X> happens, do <Y>.
- If unsure, <Z>.
```

## Charter reference

See `docs/engineering-charter.md` Section 10.
