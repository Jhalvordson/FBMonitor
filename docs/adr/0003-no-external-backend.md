---
status: accepted
date: 2026-05-27
---

# ADR-0003: No external backend

## Context

FBMonitor could use a backend server for webhook dispatch, match history, or user accounts. This would add hosting costs, complexity, and a dependency on server uptime.

## Decision

Everything runs client-side in the Chrome extension. The only outbound network calls are webhook POSTs to user-configured endpoints (e.g., Microsoft Teams).

## Consequences

- Zero hosting cost.
- No server to maintain, monitor, or secure.
- Match history is stored in `chrome.storage.local` (per-device, not synced).
- Webhook URL is stored in `chrome.storage.local` (never synced to Google's servers).
- If we later need cross-device sync or server-side processing, this decision will need revisiting via a new ADR.
