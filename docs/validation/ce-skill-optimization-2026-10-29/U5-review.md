# U5 source review and local verification

Status: mechanism verified; producer self-review, not independent review.

The task validator now distinguishes the artifact root from each mutation target. Task-level target_repo overrides pack metadata, then source-plan metadata. Explicit child targets must be contained Git roots. Exact task files share the Git/runtime/secret policy and are checked through existing ancestors, including dangling links. Future source files remain valid. The additive resolved_target_repo fact lets Work reconcile its own intake without granting mutation authority.

The shared containment helper preserves existing artifact consumers' leaf/type diagnostics by default; task paths opt into leaf checks. Root equality no longer traverses the repository parent. Managed runtime checks cover the adapter registry, including OpenCode, ZCode and Pi, while custom host files remain permitted.

Validation: U5-red.log recorded 13 failed / 20 passed before implementation. U5-green.log records 8 suites / 125 tests passed after the final repair. U5-typecheck.log records 272 files checked. Consumer suites cover Work artifacts, verification summaries, honest closeout and document/task review contracts.

Limitations: validation is a filesystem snapshot, not a write-time capability or hostile concurrent-filesystem sandbox. expected_side_effects remains a bounded pattern declaration, not authorization or a future filesystem expansion proof. Existing artifact-root fallback remains for single-root compatibility; Work requires explicit targets in parent workspaces. Real host/model scenarios and independent review remain pending in U29/U30. No runtime regeneration or remote action was performed.
