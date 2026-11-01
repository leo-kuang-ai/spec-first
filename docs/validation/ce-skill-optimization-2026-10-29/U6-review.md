# U6 admission repair and remaining activation boundary

Status: partial. Producer source review only; no independent or real-provider evaluation.

The direct __worker entrypoint previously invoked fake codex/claude without any receipt. U6-red.log records all six new tests failing. Both entrypoints now reach the same closed authenticated-channel guard before any provider command. U6-green.log records 15 tests across three suites passing, including missing, weak, forged and expired receipt cases; pre-existing result bytes and job-root absence are checked. bash -n also passed.

The dormant persona path now names references/agents/pov-peer.md. Its return checks reject empty required strings, non-string/empty evidence entries and additional keys. These dormant output checks have not been exercised through an admitted worker.

Current-source constraint: peer-job-runner.py intentionally rejects every serving receipt because an authenticated producer channel does not exist. A positive admitted-provider fixture would require bypassing that boundary and cannot count as evidence. No channel, test-only activation flag, or duplicated runner was introduced. Runner copies remain unchanged and their parity suite passed.

Still pending: a trusted worker-bound admission contract, scope/freshness checks at execution, deadline/byte-cap enforcement through an admitted worker, and positive end-to-end schema fixtures. These must be resolved before activation; the current guard prevents execution even if only the outer start path is later enabled. The panel reference exposes this limit. This unit closes the observed bypass, but does not claim complete U6 activation acceptance or live cross-model capability.
