# Idea: Auto-reply to matching posts

**Parked:** 2026-05-27
**Status:** On hold — requires RFC with ToS risk analysis before any work.

## Description

Automatically post a reply comment on Facebook group posts that match configured keywords.

## Why it's parked

Automated posting on Facebook violates their Terms of Service. Scott has ~200 groups — losing access to those groups would be catastrophic for his lead generation. Facebook actively detects and bans automated posting behavior.

## Current alternative

The "assisted reply" feature (Step 6 of the roadmap) provides copy-to-clipboard templates. The user manually pastes the reply into Facebook's comment box. This is ToS-safe because the extension only reads the DOM and writes to the system clipboard — the user performs the actual posting action.

## If we revisit

- Needs a dedicated RFC.
- Must include Facebook ToS risk analysis.
- Must include detection-avoidance analysis (random delays, human-like patterns).
- Must include a kill-switch mechanism.
- Consider whether the risk is worth it vs. the 3-action manual workflow.
