# U10 finding mechanics and consumer review

Status: local mechanism verified; semantic validation remains separate.

The helper rejects malformed optional evidence, contributor, fix and validation fields; rejects blank identities; preserves exact path case/whitespace; and requires P0 confidence >=50 plus motivating evidence for the critical exception. settled_conflict is a boolean context annotation with no confidence bypass. Synthesis rechecks retain the existing confidence instead of applying the same peer promotion again. input_status exposes malformed input even when the computation completes; a zero-survivor result cannot imply clean coverage after rejected input.

The schema now declares the settlement annotation and nonempty identity/evidence strings. Finish-review reruns mechanics after material semantic changes and routes newly discovered plan findings back through validation. Work explicitly excludes rejected/unresolved findings and treats unavailable or unknown verification as a coverage gap. Existing LFG boundaries remain intact.

Evidence: U10-red.log records 15 failed / 39 passed before repair. U10-green.log records 5 suites / 119 passed, including mechanics, review, Work consumer/shipping and LFG contracts. Invalid full evidence now counts as malformed rather than a confidence downgrade; omitted compact detail remains supported. Case-distinct tests are synthetic path identity tests, not a claim about the host filesystem's case behavior.

Limitations: string shape does not authenticate quoted source, peer independence or reviewer-confirmed status. These still require the owning review stage's direct evidence. Source prose checks do not prove live model compliance or independent review. Pre-existing workspace changes remain in the same files and were not reset or committed.
