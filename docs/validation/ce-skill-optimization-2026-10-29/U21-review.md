# U21 consequence-grounded review and bounded simplification

Status: mechanism verified through local source/contract checks and producer self-review. Independent review and real model/host behavior remain not-run.

## Sources and decisions

Compared current `skills/spec-doc-review`, `skills/spec-code-review` and `skills/spec-simplify-code` owners with CE's corresponding synthesis, persona and test-value sources. The historical audit and frozen scenarios were read-only. Existing dirty work was preserved; changes extend the owning references rather than introducing a review engine or extra default reviewers.

| Area | Implemented disposition | Evidence boundary |
| --- | --- | --- |
| Finding admission | Consequence admission precedes every bucket. Harmless preferences, disproven claims and prior resolutions cannot leak into FYI/residual/deferred output. Schema descriptions, rubric, personas and rendering agree. | Semantic instruction; not a deterministic truth classifier. |
| Deduplication and confidence | One correction resolving both is the merge test across sections/personas; retain constituents and evidence. Neither repeated claims nor reviewer counts raise confidence. Same-persona variants no longer reappear as FYI duplicates. | Producer self-review only; no demonstrated model-quality benefit. |
| Conflicts and recommendations | Recheck factual basis first, then retain genuine unresolved commitments as manual. One producer-owned recommended action flows to consumers; recommendations grant no edit authority. | Report-only and HTML/task-pack producer ownership preserved. |
| Content and sizing | Review actual HOW even under requirements-only readiness without granting execution eligibility. Replace unsupported AI cost multipliers, detail-as-authority and mandatory missing-detail findings with contract/consequence judgment. | Roster, depth and batch defaults unchanged. |
| Resume and Withdraw | Complete matching source/scope/evidence/classification/decisions required. Relevant constraint changes trigger re-evaluation. Settlement suppression now precedes routing/mutation. User-settled Withdraw persists; Apply-triggered withdrawal requires current readback and never becomes rejection. | No persistent review database introduced. |
| Append/render/return | Deferred-entry keys derive from rendered text, check full-content collisions and read back unknown writes before retry. Capture finding locations at discovery, refresh on actual source changes. Remove duplicate terminal Apply menu. | Append remains Markdown-write only; report-only remains byte-preserving. |
| Dormant peer | Normalization retains deferred_questions rather than testing_gaps. Eval contract now describes one whole-document peer and denial without authenticated admission. Peer confidence wording no longer implies vote promotion. | Isolated jq transform tested; serving gate unchanged. No peer launch or independent coverage. Dormant future prompt packaging/tool enforcement still needs authenticated-path validation before activation. |
| Code Review | Resource release on error/cancel/early return, concrete test isolation/order risks, and expand/migrate/contract compatibility. | Narrow existing persona additions; no runtime deployment or new default lens. |
| Simplify | Conditional test-value reference within code-quality; read-only requests remain read-only. Preserve proof tests/seams, scope/import ownership, provider-guaranteed behavior, serialization/coercion equivalence and tool/license comments. | U15 protection retained. No default fourth/fifth reviewer, broad compatibility deletion or comment deletion policy. |

## Verification

- `U21-adapter-red.log`: the new isolated normalization check failed because deferred questions were lost and testing_gaps appeared instead. It executes the actual jq expression without bypassing provider admission.
- `U21-check.log`: 4 failed / 129 passed. Three legacy report-only tests lacked U13 fixture preparation/engine evidence; the fourth was an obsolete wording assertion. Fixture setup now uses isolated HOME/USERPROFILE and actual preparation; judge protections were not weakened.
- `U21-green.log`: 6 suites / 133 passed.
- `U21-final-green.log`: despite its filename, this intermediate run had 1 failed / 138 passed after terminal-return prose changed. The exact JSON-only contract wording was restored; this log is not green evidence.
- `U21-final-check.log`: 7 suites / 139 passed, including actual report-only tampering rejection, outcome judge calibration, task-pack consumers and peer admission contracts.
- `U21-entrypoints.log`: repository skill entrypoint lint passed (501 files).
- Shell syntax and `git diff --check` passed. System skill-creator quick_validate was attempted on Doc Review and rejected the repository's existing `argument-hint` frontmatter extension; subsequent chained validators did not execute. The supported repository validator above passed. No frontmatter was removed to satisfy an incompatible validator.

These results support local mechanism/source claims only. No new agent was dispatched, no real provider or remote was contacted, no project commit/push/PR was created, and no generated runtime mirror was edited. Fresh-source behavior and quality/cost comparisons remain U29/U30 work. The complete plan remains in progress.
