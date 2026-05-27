# Claude Code — FBMonitor

Project-specific Claude Code conventions. Read on session start.

For _engineering rules of the road_ (git, testing, secrets, RFCs, ADRs, etc.), see `docs/engineering-charter.md` — that file is authoritative.

For _personal coaching contract_, see `docs/personal/development-plan.md`.

## What this project is

FBMonitor is a Manifest V3 Chrome extension that monitors Facebook group feeds for configurable keywords, visually highlights matching posts, sends webhook notifications (Microsoft Teams), and provides an assisted-reply workflow with copy-to-clipboard templates. Built for insurance agents monitoring ~200 local Facebook groups for lead generation.

## Tech stack

- **Language(s):** JavaScript (ES2020+, no transpiler)
- **Framework(s):** None (vanilla JS, Chrome Extension APIs)
- **Database:** `chrome.storage.sync` (keywords, prefs) + `chrome.storage.local` (webhook URL, match history, dedup)
- **Deploy targets:** Chrome Web Store (unpacked during development)

## Build / test / deploy

```bash
npm install               # install dev dependencies
npm test                  # run unit tests (Jest)
npx prettier --check .    # run formatter check
# No build step — raw JS, loaded unpacked in chrome://extensions
# Deploy: pack as .crx or publish to Chrome Web Store
```

## Where things live

| What               | Path                |
| ------------------ | ------------------- |
| Extension manifest | `src/manifest.json` |
| Content scripts    | `src/content/`      |
| Service worker     | `src/background/`   |
| Popup UI           | `src/popup/`        |
| Options page       | `src/options/`      |
| Shared modules     | `src/shared/`       |
| Extension icons    | `src/icons/`        |
| Unit tests         | `tests/unit/`       |

## Project-specific gotchas

- Facebook's CSS classes are obfuscated React hashes — never match on them. Use ARIA roles (`role="feed"`, `role="article"`) which are accessibility features and stable.
- All Facebook DOM selectors are isolated in `src/content/selectors.js`. When Facebook changes their DOM, this is the one file to update.
- Content scripts can't use ES modules in MV3. Shared code uses `window.*` globals, loaded before content scripts via manifest order.
- MV3 service workers are ephemeral — they shut down after ~5 min of inactivity. Use `chrome.alarms` instead of `setTimeout` for anything that must survive restarts.
- Webhook URL is stored in `chrome.storage.local` only (never `.sync`) to avoid leaking it to Google's servers.

## Working features (don't touch unless broken)

(None yet — project is in initial build phase.)

## Subagent strategy (project-specific notes)

For codebase exploration in this repo, prefer:

- `Explore` for finding code and reading patterns.
- `Plan` for designing larger changes.
- `Read` directly when the path is known.

Extension is small enough that most files can be read directly.

## Self-improvement loop

After any correction the maintainer makes, update `tasks/lessons.md` with the pattern. Iterate ruthlessly until the same correction stops being needed. Lessons are project-scoped.

**On session start: read `tasks/lessons.md`.** Entries under "Scaffold-level lessons" are inherited from `claude-starter` and explain _why_ the shipped config (pre-commit, CI workflow) looks the way it does. Do not "clean up" what's documented there as load-bearing — you will re-introduce the bug.

## Pointers

- Engineering charter: `docs/engineering-charter.md`
- Personal development plan: `docs/personal/development-plan.md`
- RFC index: `docs/rfc/`
- ADR index: `docs/adr/`
- Ideas parking lot: `docs/ideas/`
- Decision register: `docs/decisions/register.md`
- Runbooks: `docs/runbooks/`
