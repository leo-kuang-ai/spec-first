# Inferred But Rejected — Insufficient Evidence

## async-await-style
Considered: prefer async/await over callback style.
Reason rejected: the codebase uses synchronous `execFileSync` and sync fs operations by design in CLI paths; the pattern is intentional.

## file-size-limits
Considered: maximum source file length.
Reason rejected: no evidence of a team convention on file length limits.
