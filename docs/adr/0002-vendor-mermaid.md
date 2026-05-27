---
adr: 2
title: Vendor Mermaid into the repo instead of loading from a CDN
status: accepted
date: 2026-05-11
linked_rfcs: [1]
---

# ADR 0002: Vendor Mermaid into the repo instead of loading from a CDN

## Context

RFC 0001 (project status dashboard) introduced one CDN dependency: `mermaid.min.js` at `cdn.jsdelivr.net`. The RFC's pre-mortem flagged "Mermaid CDN unavailable" as a real-but-low-likelihood risk (corporate firewall, ad blocker, network outage) and proposed vendoring as the eventual mitigation.

Two properties became important enough during implementation to act on that mitigation immediately rather than later:

1. **Pattern fidelity.** The dashboard is meant to embody Thariq Shihipar's "HTML effectiveness" pattern — a single self-contained HTML file you can open anywhere. A CDN dependency breaks that property the moment the user opens `docs/dashboard.offline.html` from an email attachment on a flight.
2. **Charter coherence.** Section 5 ("boring tech, don't adopt new frameworks without a concrete payoff") sits awkwardly next to a runtime dependency that could disappear without warning. Vendoring removes the surface entirely.

## Decision

Vendor Mermaid 10.9.1 into `docs/vendor/mermaid.min.js` (3.3 MB). The live dashboard loads it via `<script src="vendor/mermaid.min.js">`. The build script (`scripts/build-dashboard.py`) inlines the vendor file's contents into `docs/dashboard.offline.html`, producing a single ~3.4 MB self-contained HTML artifact.

The CDN URL is no longer referenced anywhere in the codebase.

## Consequences

What becomes easier:

- `docs/dashboard.offline.html` is now truly portable. Email it, drop it on a USB stick, open it on an air-gapped machine — graph still renders.
- The live dashboard works on networks where `cdn.jsdelivr.net` is blocked (some corporate environments, some ad blockers).
- The pre-mortem's "CDN outage" risk is eliminated (downgraded from a code-level concern to a "did we run the upgrade?" concern, which is a much better failure mode).

What becomes harder:

- The repo is now 3.3 MB larger. `git clone` is slightly slower. Diffs on the vendor file are unreadable (expected).
- We own Mermaid version upgrades: when a CVE drops or we want a new feature, someone re-runs `curl` and commits a new 3.3 MB blob.

What we accept:

- The size cost. 3.3 MB is well under the threshold where it would meaningfully affect contributor experience, and the property gained (true offline portability) is the entire point of the dashboard format.
- Manual version pinning. With no `package.json`, the version lives in the URL in this ADR and in the file mtime. If we ever vendor a second library, that's the signal to add a `vendor/MANIFEST.md` tracking versions.

## Alternatives considered

- **Keep the CDN dependency** — simplest, but breaks offline portability and reintroduces a runtime dep we don't need. The pre-mortem already weighed this; we accepted it temporarily.
- **Vendor a smaller diagram library (e.g., flowchart.js, ~50 KB)** — would save 3.25 MB. Rejected because Mermaid is on the global tools list as the diagram library; introducing a second one would be the kind of capability-shopping the charter discourages.
- **Inline Mermaid only in the offline build, keep CDN for the live dashboard** — half-measure. The live dashboard is also opened on networks that might block CDNs, and we'd carry two code paths for no reason.

## Recurring cost

- $0/month — no service, no API.
- Manual upgrade burden: ~15 minutes per Mermaid version bump (download, replace file, run build script, commit). Frequency: as needed; Mermaid is mature, so likely yearly or less.

## References

- RFC 0001 (project status dashboard) — pre-mortem flagged this risk; this ADR closes it.
- Mermaid 10.9.1 — `https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js` (snapshot vendored at `docs/vendor/mermaid.min.js`).
