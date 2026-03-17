# Development Guidelines

- API: Expose command surfaces through stable spec-first CLI verbs.
- Module: Keep runtime logic under src/core and entry orchestration near src/cli.
- Testing: Use Vitest-style automated regression coverage and keep test evidence alongside runtime changes.
- Project Rules: Treat .spec-first/runtime/first as canonical truth before projecting docs/first views.