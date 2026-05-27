# Secrets Inventory

Charter Section 4 (secret management): every API key, credential, or secret has an entry here.

**This file contains metadata only — never values.** What it is, where the value lives, who can rotate.

## Why this exists

- When a key is suspected of leak, you need to know which one and where to rotate. Inventory makes that fast.
- When onboarding a new machine, you need to know which secrets to fetch. Inventory makes that complete.
- When auditing for IP exposure, you need to know what's owned by what account. Inventory makes that auditable.

## Format

| Name              | Purpose          | Storage location                             | Owner / account                        | Rotation             |
| ----------------- | ---------------- | -------------------------------------------- | -------------------------------------- | -------------------- |
| `EXAMPLE_API_KEY` | What this is for | `.env` (local) / Vercel env / Supabase Vault | personal MSA / company workspace / etc | annual / on incident |

## Inventory

| Name       | Purpose | Storage location | Owner / account | Rotation |
| ---------- | ------- | ---------------- | --------------- | -------- |
| _none yet_ |         |                  |                 |          |

## Rotation policy

- **Suspected leak:** rotate immediately. Note in this file ("rotated YYYY-MM-DD due to ...").
- **Annual:** rotate on a fixed calendar date (e.g., first Monday of January). Update this file with the date.
- **Personnel change:** rotate any keys an outgoing person had access to.

## Where secrets actually live

- **Local development:** `.env` (gitignored). See `.env.example` for the schema.
- **Desktop apps storing user tokens:** Windows DPAPI / equivalent platform crypto.
- **Vercel deployments:** Vercel project environment variables.
- **Supabase backend:** Supabase Vault.
- **CI:** GitHub Actions secrets (`Settings → Secrets and variables → Actions`).

## Charter reference

See `docs/engineering-charter.md` Section 4.
