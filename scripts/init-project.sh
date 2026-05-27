#!/usr/bin/env bash
# init-project.sh
#
# One-time initialization script for a new project spawned from claude-starter.
# Replaces template placeholders with project-specific values.
#
# Usage:
#   ./scripts/init-project.sh "<project-name>" "<one-line-description>"
#
# Example:
#   ./scripts/init-project.sh "salesops-platform" "Sales and Operations Platform"
#
# Run this from the root of the new project (after cloning from claude-starter).
# Removes itself from the repo when finished.

set -euo pipefail

PROJECT_NAME="${1:-}"
DESCRIPTION="${2:-}"
GITHUB_USER="${GITHUB_USER:-$(git config --global user.name 2>/dev/null || echo 'YOUR_GITHUB_USER')}"
COPYRIGHT_HOLDER="${COPYRIGHT_HOLDER:-${GITHUB_USER}}"
CONTACT_EMAIL="${CONTACT_EMAIL:-$(git config --global user.email 2>/dev/null || echo 'you@example.com')}"
YEAR="$(date +%Y)"
INITIAL_DATE="$(date +%Y-%m-%d)"

if [[ -z "${PROJECT_NAME}" ]]; then
  echo "Usage: $0 \"<project-name>\" \"<one-line-description>\""
  echo ""
  echo "Example: $0 \"salesops-platform\" \"Sales and Operations Platform\""
  exit 1
fi

echo "Initializing project: ${PROJECT_NAME}"
echo "  Description:        ${DESCRIPTION}"
echo "  GitHub user:        ${GITHUB_USER}"
echo "  Copyright holder:   ${COPYRIGHT_HOLDER}"
echo "  Contact email:      ${CONTACT_EMAIL}"
echo "  Year:               ${YEAR}"
echo ""
read -p "Proceed? [y/N] " -r
if [[ ! "${REPLY}" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

# Files where placeholders are replaced
FILES=(
  "README.md"
  "ARCHITECTURE.md"
  "CONTRIBUTING.md"
  "CHANGELOG.md"
  "CLAUDE.md"
  "LICENSE"
  ".gitleaks.toml"
  ".github/CODEOWNERS"
  "docs/adr/0001-record-architecture-decisions.md"
)

# Cross-platform sed in-place — works on macOS and Linux
sed_inplace() {
  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

for f in "${FILES[@]}"; do
  if [[ -f "${f}" ]]; then
    sed_inplace "s|{{PROJECT_NAME}}|${PROJECT_NAME}|g" "${f}"
    sed_inplace "s|{{ONE_LINE_DESCRIPTION}}|${DESCRIPTION}|g" "${f}"
    sed_inplace "s|{{PROJECT_DESCRIPTION}}|${DESCRIPTION}|g" "${f}"
    sed_inplace "s|{{GITHUB_USER}}|${GITHUB_USER}|g" "${f}"
    sed_inplace "s|{{COPYRIGHT_HOLDER}}|${COPYRIGHT_HOLDER}|g" "${f}"
    sed_inplace "s|{{CONTACT_EMAIL}}|${CONTACT_EMAIL}|g" "${f}"
    sed_inplace "s|{{YEAR}}|${YEAR}|g" "${f}"
    sed_inplace "s|{{INITIAL_DATE}}|${INITIAL_DATE}|g" "${f}"
  fi
done

# Rename the development plan template to a real file
if [[ -f "docs/personal/development-plan.template.md" ]]; then
  mv "docs/personal/development-plan.template.md" "docs/personal/development-plan.md"
  sed_inplace "s|{{PROJECT_NAME}}|${PROJECT_NAME}|g" "docs/personal/development-plan.md"
  sed_inplace "s|{{NAME}}|${GITHUB_USER}|g" "docs/personal/development-plan.md"
  sed_inplace "s|{{DATE}}|${INITIAL_DATE}|g" "docs/personal/development-plan.md"
  echo "  Created docs/personal/development-plan.md (please customize)"
fi

# Write .charter-source — used by /charter-sync to know where the canonical charter lives
CHARTER_SOURCE_URL="${CHARTER_SOURCE_URL:-https://github.com/${GITHUB_USER}/claude-starter.git}"
echo "${CHARTER_SOURCE_URL}" > .charter-source
echo "  Pinned .charter-source = ${CHARTER_SOURCE_URL}"

# Optional: rename CLAUDE.md placeholders that init can't fill (tech stack, gotchas, etc.)
echo ""
echo "Placeholders left for you to fill in manually:"
echo "  CLAUDE.md             — tech stack, gotchas, working features"
echo "  ARCHITECTURE.md       — system context diagram, containers, data flow"
echo "  README.md             — install/test/run commands"
echo "  docs/personal/development-plan.md — focus areas, anti-patterns"
echo ""

# Remove the init script itself
git rm "${0}" 2>/dev/null || rm "${0}"

echo "Init done. Next:"
echo "  1. Edit the placeholders listed above."
echo "  2. git add ."
echo "  3. git commit -m \"chore: initial scaffold from claude-starter\""
echo "  4. git push"
echo ""
echo "Welcome to ${PROJECT_NAME}."
