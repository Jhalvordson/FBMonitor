# FBMonitor

> Chrome extension that monitors Facebook group posts for keywords, highlights matches, and sends webhook notifications.

## What is this

FBMonitor is a Manifest V3 Chrome extension for lead generation in Facebook groups. It watches group feeds as you scroll, scans post text for configurable keywords (e.g., "insurance"), highlights matching posts with a visual badge, and fires Microsoft Teams webhook notifications. An assisted-reply workflow lets you copy pre-configured response templates to clipboard with one click, then paste into Facebook's comment box manually.

## Status

- **Charter version:** see `docs/engineering-charter.md` (front-matter `version:`).
- **Active phase:** MVP build.
- **Definition of Done:** see `docs/engineering-charter.md` Section 4.

## Quick start

```bash
# Clone
git clone https://github.com/Jhalvordson/FBMonitor.git
cd FBMonitor

# Install pre-commit hooks (required before any commit)
pip install pre-commit
pre-commit install

# Set up environment
cp .env.example .env
# fill in .env with your secrets — never commit this file

# Install dev dependencies
npm install

# Run tests
npm test

# Load in Chrome
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" → select the src/ folder
# 4. Navigate to any Facebook group
```

## Repository layout

```
FBMonitor/
├── src/              — Chrome extension source
│   ├── manifest.json
│   ├── background/   — MV3 service worker (webhooks, dedup)
│   ├── content/      — content scripts (DOM scanning, highlighting)
│   ├── popup/        — popup UI (keyword config, match queue)
│   ├── options/      — options page (webhook config, reply templates)
│   ├── shared/       — shared modules (storage, constants, webhook formatting)
│   └── icons/        — extension icons
├── tests/            — unit tests (Jest)
├── docs/             — engineering docs (charter, RFCs, ADRs, runbooks, ideas)
├── scripts/          — repository-level scripts
└── .github/          — workflows, issue/PR templates, CODEOWNERS
```

## How development works here

This project follows the **engineering charter** at `docs/engineering-charter.md`. Read it before contributing. Highlights:

- Spec before code (RFC for new systems; ADR for architectural decisions).
- One change per PR. Conventional Commits. Branch protection on `main`.
- Pre-commit hooks must pass. CI must be green.
- Definition of Done is a gate, not a suggestion (Section 4).

For project-specific Claude Code conventions, see `CLAUDE.md`.

## Architecture

See `ARCHITECTURE.md` for the high-level system overview and Mermaid diagrams.

## License

See `LICENSE`.

## Acknowledgements

Scaffolded from [`claude-starter`](https://github.com/Jhalvordson/claude-starter).
