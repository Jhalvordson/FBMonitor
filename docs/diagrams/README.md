# Diagrams

Mermaid diagram sources used in docs.

## Why this directory

Charter Section 5 says comments are exceptions; the same applies to diagrams: they live in version control, alongside the code they describe. **If a diagram isn't in version control, it doesn't exist.**

## What goes here

- Mermaid `.md` snippets too large to inline in another doc.
- C4 model diagrams (Context, Container, Component levels) referenced from `ARCHITECTURE.md`.
- Sequence and state-machine diagrams referenced from RFCs.

## What does NOT go here

- Whiteboard photos. (Convert to Mermaid or Excalidraw and commit those.)
- Screenshots. (Those rot.)
- Proprietary tool exports without a source format. (You won't be able to update them.)

## Format conventions

- Use Mermaid by default — renders natively in GitHub.
- Use Excalidraw (`.excalidraw` source files) for hand-drawn-feel sketches; commit both the `.excalidraw` and an exported PNG.
- PlantUML only when Mermaid genuinely can't express what you need.

## How to reference a diagram

In any markdown file (RFC, ADR, README, ARCHITECTURE), inline Mermaid is preferred:

\`\`\`\`markdown
\`\`\`mermaid
graph TD
A --> B
\`\`\`
\`\`\`\`

For larger diagrams that pollute reading flow, store the source here and link:

\`\`\`markdown
See [data-flow.md](../diagrams/data-flow.md)
\`\`\`

## Charter reference

See `docs/engineering-charter.md` Section 5.
