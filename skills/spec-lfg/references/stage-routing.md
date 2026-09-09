6. **Decide browser applicability, then verify when applicable.** Decide
   `browser_applicability: applicable | not_applicable` from the settled plan and
   actual changed flow, not filename extension alone. A changed user-visible
   route, form, navigation, client interaction/state, or an explicit
   browser/runtime verification obligation is `applicable`; docs-only,
   library/CLI, or backend-only work without a changed user-visible flow may be
   `not_applicable`. Record the concrete reason either way. For `not_applicable`,
   record an explicit `not_applicable` browser result and continue without invoking the browser skill or its wrapper.

   For `applicable`, first validate any supplied `caller_target_origin`. An
   invalid caller value is the diagnostic blocker `target-origin-invalid`; do
   not fall back from malformed or repeated caller input. A missing caller value
   returns `not_run / target-origin-missing` before browser invocation and blocks
   the applicable flow. With a valid caller value, invoke `spec-test-browser`
   with `mode:pipeline target-origin:<origin>`. Do not infer an origin from
   redirects, page state, ambient listeners, free ports, framework defaults, or
   other project files.

   The caller owns the project server lifecycle. LFG forwards the exact origin
   but does not read local runtime profiles, start or stop a project server, or
   inspect project process state. Before the browser test plan is written,
   determine whether its expected navigation or interaction has a durable or
   external effect. A caller-provided origin is not mutation authorization: when
   the current call lacks named authorization for that origin, flow, and effect,
   record `not_run / browser-mutation-authorization-required`, do not write the
   blocked step, and do not continue to lifecycle or landing actions.

   Consume the browser result item by item: origin provenance, wrapper probe `status`/`execution_readiness`/`reason_code`,
   `capabilities.exact_origin_confirmed`/`exact_origin_evidence`, `conformance_status`, `repair_scope`, `next_action`, every route/step status, `action_process_calls`, browser cleanup `status`/`reason_code`,
   private evidence refs, and limitations. A wrapper, pipeline, applicable
   capability, browser cleanup, or result that is `not_supported`, `not_run`,
   `failed`, missing, or indeterminate is a diagnostic blocker with its returned
   reason code; do not let passed route/step results hide cleanup failure.

   GATE: STOP. Before the shipping precondition, require browser verification
   to have passed or be explicitly `not_applicable` with its recorded reason. A
   failed, not-run, missing, or indeterminate result blocks lifecycle mutation
   and every landing side effect for an applicable flow.

6.5. **Final working-tree verification** (REQUIRED after all code mutations)

   After Simplify, review-fix application, targeted fix checks, and applicable
   browser verification have finished, resolve `SKILL_DIR` from the directory of
   this skill's currently loaded `SKILL.md` and run the bundled
   `node "$SKILL_DIR/scripts/working-tree-fingerprint.cjs"` helper, storing its
   complete object as `pre_final_verification_fingerprint`. The bundled copy is
   a byte-identical package-local projection of the canonical `spec-work` helper
   (`scripts/working-tree-fingerprint.cjs` in the spec-work package); never
   locate it through a `skills/` source checkout path — target repos only have
   the host-projected Skill roots.

   Re-invoke `spec-work` with the exact same
   `mode:return-to-caller <plan-path-from-step-1>` argument. This is an
   idempotent final-verification pass: it must not reimplement the feature. It
   re-reads the current tree, reruns the plan's complete applicable Verification
   Contract, records a fresh `verification_run_summary_ref`, and returns a
   `verified_worktree_fingerprint` captured after those commands.

   GATE: require all of the following before residual, lifecycle, commit, push,
   PR, or CI actions:

   - `status: complete`, the same plan path, all in-scope units/tasks still
     accounted for, empty blockers, and every required final verification check
     passed or explicitly not applicable;
   - a non-null `verification_run_summary_ref` that is different from
     `initial_verification_run_summary_ref`; an earlier summary cannot prove the
     post-fix tree;
   - the returned `verified_worktree_fingerprint.fingerprint` exactly equals
     `pre_final_verification_fingerprint.fingerprint`;
   - a second helper invocation immediately after the return produces the same
     fingerprint. Any mutation during verification, stale evidence reuse,
     helper failure, missing field, or mismatch is `final-verification-stale`
     and stops the pipeline.

   `final-verification-stale` is a stop with a named cause, not a terminal
   verdict. Before treating a fingerprint mismatch as tree mutation, confirm
   the spec-first managed `.gitignore` block is present so `.spec-first/workflows/`
   run summaries stay outside the fingerprint — a missing block makes the fresh
   verification-run-summary file break equality, and the real cause is setup,
   not verification staleness. When the helper itself cannot run, report the
   missing runtime asset (repair via `spec-first init`) instead of estimating a
   fingerprint by hand. After the named cause is remediated, re-enter step 6.5
   from a fresh pre-capture; never reuse any earlier fingerprint or summary.

   This gate owns final local verification freshness. Targeted checks from
   Simplify or review-fix application are additive and never replace it.
