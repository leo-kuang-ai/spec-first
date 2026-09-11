# Completion Report

Report only observed results. Use `Documentation complete` only after every intended publication succeeds. When promotion is skipped, report `Documentation skipped` with its reason. If publication partially succeeds, report the exact written and failed targets as incomplete; never imply that all durable paths stayed unchanged or emit the completion signal. Include the vocabulary scan result even when no terms qualify, and label inline validation as non-independent.

## Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| Subagents write product files into `docs/` or edit tracked paths | Subagents write only atomic artifacts under the verified owner-only `<private-scratch-dir>` and return the path; orchestrator writes the one final doc |
| Subagent returns a long prose body only as its inline response | Subagent writes full output to its run artifact; orchestrator Reads it back (inline return is fallback only) |
| Research and assembly run in parallel | Research completes → then assembly runs |
| Multiple files created during workflow | One solution doc written or updated: `docs/solutions/[category]/[filename].md` (plus optional maintenance writes: a `CONCEPTS.md` create/update from Phase 2.4 and a small instruction-file edit for discoverability) |
| Creating a new doc when an existing doc covers the same problem | Check overlap assessment; update the existing doc when overlap is high |
| Asserting code behavior or merge-state from conversation memory | Read the defining source line before asserting; cite PR numbers over SHAs; soften unverifiable claims (Phase 1 extractor rules, re-checked in Phase 2.45) |
| Batching several learnings through one run and stitching cross-references between drafts | One learning per run; run the skill sequentially for each additional learning |

## Success Output

### Headless mode

Emit a structured terminal report and end the turn. No "What's next?" question, no blocking prompt. End with `Documentation complete` as the terminal signal so callers can detect completion.

```
✓ Documentation complete (headless mode)

File: docs/solutions/<category>/<filename>.md  (created | updated)
Track: <bug | knowledge>
Category: <category>
Overlap: <none | low | moderate — see <path> | high — existing doc updated>
Grounding: <clean | N flags adjudicated (X fixed, Y annotated, Z confirmed) | N claims softened or corrected | degraded — merge-state claims unverified offline>
Instruction-file edit: <none needed | gap noted, not applied>
CONCEPTS.md: <scanned, no qualifying terms | created with N entries (M seeded from the learning's area) | updated — N added, N refined>
Refresh recommendation: <none | scope hint for spec-compound-refresh>

Documentation complete
```

When no doc was written (e.g., headless invoked on a session where the problem is not yet solved), emit a structured failure instead and end with `Documentation skipped` so callers can distinguish success from no-op:

```
✗ Documentation skipped (headless mode)

Reason: <one-sentence explanation — e.g., "no solved problem detected in
conversation history" or "solution not yet verified">

Documentation skipped
```

### Interactive mode

```
✓ Documentation complete

Ran Full mode.
Auto memory: 2 relevant entries used as supplementary evidence

Execution: <dispatched | inline-serial (`dispatch_authorization_missing` | `subagent_capability_missing` | `worker_capability_unproven`)>

Research Results:
  ✓ Context Analyzer: Identified performance_issue in runtime, category: performance-issues/
  ✓ Solution Extractor: 3 code fixes, prevention strategies
  ✓ Related Docs Finder: 2 related issues
  ✓ Session History: 3 prior sessions on same branch, 2 failed approaches surfaced

Grounding Validation:
  ✓ Mechanical check: 14 paths, 2 SHAs, 3 links checked — 1 flag annotated as historical
  ✓ Semantic validator: 9 claims verified, 1 merge-state claim softened to pending

Specialized Reviews (execution posture inherited from above):
  ✓ performance-oracle: Validated query optimization approach
  ✓ Code simplification review: Code examples are appropriately minimal

Files written:
- docs/solutions/performance-issues/n-plus-one-brief-generation.md (created)
- CONCEPTS.md (created with 3 entries: BriefSystem, EmailQueue, Brief Status)

This documentation will be searchable for future reference when similar
issues occur in the Email Processing or Brief System modules.

Refresh recommendation: none
```

**End the turn after the summary — `spec-compound` does not present a "What's next?" menu.** The doc is written and any cross-references the workflow found are already in it. Cross-doc maintenance (fixing references in *other* docs, consolidation) is deferred to `spec-compound-refresh` via the `Refresh recommendation` line above — the skill designed for it — not auto-applied here, which would edit tracked docs beyond the one deliverable. If the user wants to view the file or take a follow-up action, they will ask. (Interactive mode only.)

**Alternate interactive output (when updating an existing doc due to high overlap):** in headless mode, this case is communicated via the `Overlap: high — existing doc updated` line of the headless terminal report above, not as a separate output block.

```
✓ Documentation updated (existing doc refreshed with current context)

Overlap detected: docs/solutions/performance-issues/n-plus-one-queries.md
  Matched dimensions: problem statement, root cause, solution, referenced files
  Action: Updated existing doc with fresher code examples and prevention tips

File updated:
- docs/solutions/performance-issues/n-plus-one-queries.md (added last_updated: 2026-03-24)
```
