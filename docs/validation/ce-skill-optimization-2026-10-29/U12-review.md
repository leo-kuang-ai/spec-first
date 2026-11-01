# U12 browser ordering and cleanup

Status: local mechanism verified; real browser conformance not run.

`vitals` now requires a successful initial open. The controlled conformance producer records browser close independently and cannot report passed when cleanup fails. Failed runs retain private diagnostics and isolated recovery identities; the wrapper exposes the evidence location and rejects missing, failed, null or malformed cleanup output. Caller application-server ownership remains unchanged.

Evidence: U12-red.log records 3 failing cases before repair. U12-green.log records 2 suites / 55 passed, including actual producer execution with an isolated fake browser, close exit 0/9, failed diagnostic retention and successful removal. U12-typecheck.log records 272 syntax-checked files. Source diff and lifecycle self-review completed.

Claim boundary: the fake browser proves producer lifecycle and receipt propagation, not real browser navigation enforcement. Setup failures before the navigation loop still return failed through the existing top-level handler; they do not become ready. No real host, independent reviewer or browser session was evaluated. No generated runtime was edited.
