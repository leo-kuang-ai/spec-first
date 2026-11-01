# U4: Sweep state persistence boundaries

Status: mechanism_verified. review_source: producer-self-review. independent_review: not_run.

- The initial safety suite produced 13 failures and one pass before implementation (U4-red.log). The candidate passed 20 tests across safety and legacy-import suites (U4-green.log). Python AST parsing passed without creating bytecode.
- All mutating commands require a real lock. Parent creation precedes exclusive locking; regular-file, owner, single-link, no-follow and identity checks prevent truncation or unlocked fallback. Missing fcntl/no-follow capability rejects mutation while reads remain available. Lock files persist and are reused.
- Real child processes serialize the complete handler. Directory, symlink, hardlink and FIFO lock fixtures preserve sentinel bytes; injected flock failure and missing capability never enter the handler.
- Unsupported versions, malformed containers, duplicate keys, invalid indentation, and invalid UTF-8 preserve original state bytes. Unknown fields in valid v1 structures remain supported. Explicit UTF-8 round-trips under an ASCII locale.
- Upsert refuses a new invalid closed claim before persistence. Every write repairs historical invalid closed items and reports IDs. Legacy import carries valid evidence and downgrades unsupported closed claims. The initial legacy tests failed because they expected evidence-free closed state; fixtures now cover both valid evidence retention and explicit downgrade.
- state-schema and run consumer documents now distinguish exit status from status-word success, consume repair IDs, stop dependent writes, and preserve source read-back recovery. Evidence-shape validation does not prove actual merge or semantic resolution.
- Audit dispositions: SW-01 through SW-04 are addressed here. Shared publication, media authorization, source recorder, rolling-plan and connector concerns remain assigned to U32/U14 and related plan units. No connector writes, shared branch publication, Windows runtime verification, or independent reviewer were executed.
