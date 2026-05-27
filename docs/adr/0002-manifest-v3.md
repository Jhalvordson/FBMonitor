---
status: accepted
date: 2026-05-27
---

# ADR-0002: Use Manifest V3

## Context

Chrome extensions can use Manifest V2 or V3. Google has deprecated MV2 and is removing it from the Chrome Web Store.

## Decision

Use Manifest V3 for FBMonitor.

## Consequences

- Service workers replace persistent background pages (ephemeral — shut down after ~5 min idle).
- Must use `chrome.alarms` instead of `setTimeout` for anything that survives service worker restarts.
- Content scripts cannot use ES module imports; shared code uses `window.*` globals loaded via manifest script order.
- `host_permissions` declared separately from `permissions`.
- Future-proof: MV2 extensions will stop working in Chrome.
