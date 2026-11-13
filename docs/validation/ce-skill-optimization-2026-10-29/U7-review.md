# U7 protocol scoring and source ownership review

Status: local scorer mechanism verified; prompt behavior remains unverified.

The documented regression-eligible and visual-ui names now agree with the scorer; eligible and visual remain accepted aliases. HARD regressions cannot be compensated by SCORE results. Unknown dimensions/classifications, mismatched tiers, invalid booleans, non-finite/out-of-range scores and malformed rows return INVALID_INPUT (exit 2), without a safety verdict. Baseline-unavailable and other excluded states cannot inflate the weighted score. Header rows and legal legacy records remain accepted. The producer document now describes the exact exit/status contract and the limit of a partial-dimension STABLE result.

The classic loop and fix protocol now retain exact candidate/base identity and run-owned recovery, delegate authorized commits to spec-commit after verification, and preserve WIP/index entries. Learn check/--no-fix skips document generation and mutation. Reason judges rank only produced candidates, retain label identity, allow evidence-supported ties and do not manufacture weaknesses or select absent synthesis. These are source conventions, not runtime enforcement or observed model behavior.

Evidence: U7-red.log records 20 failed / 4 passed scorer tests before repair. U7-green.log records 2 suites / 44 tests passed. U7-entrypoints.log records 499 files scanned. bash -n and scoped git diff --check passed. Prompt candidate/check/commit behavior awaits the frozen U29 scenarios; no commit, revert, provider execution or reviewed-document mutation was performed to test these conventions.

Review limits: TSV input is caller-supplied data, not an authenticated execution receipt. Descriptive status/baseline/candidate fields do not prove tests ran. The scorer cannot waive required unavailable dimensions or authorize shipping. No CE direct counterpart exists for autoresearch; the audit maps its candidate/measurement/commit boundaries to adjacent Optimize and commit owners.
