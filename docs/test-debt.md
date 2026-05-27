# Test Debt

Modules under 60% test coverage that we've consciously chosen not to address yet.

Charter Section 4: coverage is not a hard target, but anything below 60% needs an entry here so we know what's untested and why.

## Why this file exists

- Without it, "we have tests" becomes a vibes metric.
- Future engineers (including future-you) need to know where the testing gaps are.
- Forces us to be honest about what's not tested rather than just leaving it implicit.

## Format

For each module / area:

```markdown
## <module path>

- **Coverage:** X%
- **Why untested:** brief reason (e.g., "external API integration we haven't mocked yet", "UI code where setup cost exceeds value")
- **Risk:** what could go wrong undetected
- **When to address:** trigger for revisiting (e.g., "before Phase 2 ships", "if this module gains complexity")
```

## Entries

_None yet — populate as the project grows._

## Quarterly review

Charter Section 11: walk this file each quarter. Each entry either gets paid down (write the tests) or its rationale gets refreshed. Stale entries with no progress signal a focus area for the next quarter.

## Charter reference

See `docs/engineering-charter.md` Section 4.
