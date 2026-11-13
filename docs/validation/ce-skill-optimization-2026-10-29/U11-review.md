# U11 continuous observation window

Status: local snapshot mechanism verified, no live PR watch.

The producer contract now requests complete observations every 30 seconds. The helper accepts at most a 60-second gap for continuous quiet accounting. Larger gaps, changed observations and legacy journals reset the quiet window; elapsed invocation budget remains anchored to the original first observation. Backward timestamps and missing check/review arrays are rejected without publishing a generation. Quiet time cannot cover a failed check or remote outage.

Evidence: U11-red.log records four failing cases before repair. U11-green.log records 2 suites / 52 passed, including a 30-minute unobserved gap, continuous sampling, late CI failure, incomplete/backward snapshots, remote recovery, and legacy policy migration with the exact maximum gap. Positive legacy tests were corrected to provide intermediate observations rather than two distant snapshots.

Limits: timestamps and remote facts are supplied by the orchestrator. Local replay validates window arithmetic, CAS persistence and event routing; it does not authenticate remote freshness or prove a continuous real-host watch. No gh request, PR mutation, commit or push was performed.
