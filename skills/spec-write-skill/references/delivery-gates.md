# Delivery Gates

**trigger_condition:** `validate-only`, validation before write, package readiness, or read when a package/source/target risk signal is triggered.
**purpose:** Connect the bundled validator, preview, risk-matching evidence, and five-axis readiness to the corresponding claim.
**fallback_if_unread:** When the required checks for this reference are not completed, only report `not-run` / degraded; no readiness shall be forged via fixture, self-check, or target-provided validator.

Gate stacks files based on actual risk levels, not on fixed maturity labels.

## Base Mechanical Gate

All packages will first run the bundled validator. First, parse the absolute path of the package root from the currently loaded `SKILL.md` and record it as `SKILL_DIR`; do not rely on any host-predefined environment variable with the same name:

```bash
node "$SKILL_DIR/scripts/validate-skill.cjs" <skill-dir> --json
```

It only verifies facts that can be mechanically determined: path containment, no-follow inventory, frontmatter subset, name/length, references, symlink/special file, and resource/script list. Result:

- `pass` / exit 0: No blocking mechanical finding detected;
- `fail` / exit 1: confirm package mechanically invalid;
- `incomplete` / exit 2: Input is unreadable, exceeds budget, or YAML/file type is beyond the validator's capabilities.

`pass` does not imply semantic correctness, safety, or package-readiness.

## Apply Preview Gate

create/revise apply generates a run-local preview manifest, host scope, and exact candidate write set beforehand, and executes `validate-authoring-preview.cjs`. It verifies hash/snapshot, path set, collision, source/runtime boundary, and host binding; it does not prove real-user authorization, Design Record quality, or patch semantics. Host check whether the exact write set is still covered by the current round's explicit create/revise request; re-verify only if the root/scope is expanded, dirty overwrite remains uncovered, or new external/network/high-risk side effects are introduced. Write operations continue to use atomic expected-old-hash / expected-nonexistence conditional patch primitive; when this capability is absent, mutation readiness must be `not-ready`, and no apply or deterministic gate can be asserted. The write receipt must be verified path by path after hashing; partial failures will only report the current diff, changed/unchanged items, and rollback preview, and will not automatically rollback.

Delivery must touch repo-level files outside of `canonical_source_root` (tests, docs, root `CHANGELOG.md`, governance records); declare these paths as would_change authorized supporting paths: entry with `supporting: true`, paths must still reside within authorized root, and remain bound individually by snapshot, exact write set, dirty-overlap, and receipt; only canonical containment requirements are explicitly exempted. Adjacent unmarked paths are still rejected by `path_outside_canonical_source_root`; it is not permitted to bypass this constraint by expanding `canonical_source_root`.

## Risk-Triggered Checks

| Signal | Additional evidence |
| --- | --- |
| description / route change | realistic positive, negative, near-neighbor fixtures; run fresh-source semantic sample when behavior sufficiency needs to be declared; if runner is unavailable, record `not_run` along with the reason |
| persona, few-shot, output contract or agent loop changes | good/bad/why or equivalent boundary examples; success path, near-miss errors, and primary failure mode with fresh-source samples; completion/stop declaration with direct evidence correspondence |
| Add or move reference | Each runtime reference has a clear pointer; the validator's reference check passes. |
| Add script/shell | syntax/unit test, input/output/permissions/failure behavior; confirm no reading of secret, no escalation beyond authorized root |
| External or unknown package | validate-only, no-follow inventory, zero package-code execution; validators unable to confirm provenance are not executed |
| same-repo migration | Each unknown file has a disposition; verify realpath containment before and after. |
| target-specific metadata | Read the target profile, record the source, verify the date, limitations, and actual target evidence |
| project governance/catalog/runtime | Read project profile; modify source/governance first, then run generator/init, do not manually edit the biotech section. |
| High-privilege/network/external transmission/irreversible action | explicit-only intent, principle of least privilege, allow data/destination, secret redaction, checkpoint and rollback |
| Distributable package | Actual target payload smoke; verify runtime does not depend on `evals/`, reports, or repo-local docs |

## Trusted Validator Boundary

Run only the following validator:

- This Skill bundle's `scripts/validate-skill.cjs`;
- Official tools with fixed sources, versions, and invocation methods that support source traceability.
- User explicitly authorized and reviewed by trust.

Execution shall not be performed merely because the target package contains `quick_validate.py`, `validate.sh`, a package script, or a hook. Unknown tools only record the path and `not_checked_with_reason`.

## Eval Evidence

Report by actual evidence type, without maintaining maturity level:

- `not_run`: The corresponding evaluation was not executed, with reason provided;
- `structural-only`: fixture/schema/contract test, verifies only the structure and ensures it matches the expected consumption;
- `fresh-semantic`: a single-version real request example from fresh-source;
- `comparative`: Comparison with a fixed baseline/previous version;
- `field-outcome`: Representative real-world tasks and user outcomes.

Route fixture must cover at least the following: positive, negative/near-neighbor, read-only boundary, and one primary failure mode. Evaluation of complex prose outputs should verify whether the generated artifact/response meets the specified criteria; acceptance of statements such as "I have followed the instruction," hidden self-checks, or checkbox markings shall not constitute valid justification. Without a model runner, structural-only metrics cannot be expressed as trigger rates or behavioral improvements.

## Five-Axis Readiness

Closeout reports are issued separately and cannot be synthesized into a vague overall score:

- `portable`: portable package structure and behavioral contract;
- `target`: specifies the host metadata, invocation, and packaging;
- `project`: local rules, governance, catalog, source/runtime
- `semantic`: evidence of route/output behavior;
- `mutation`: authorization, containment, preview/diff, and rollback.

Each axis uses `ready|degraded|not-ready|not-applicable`, along with direct evidence or constraints.

## Spec-First Project Closeout

Applies only when the target project is confirmed as spec-first:

1. Modify `skills/`, governance, templates/tests/docs etc. source.
2. Runtime catalog is generated by `npm run docs:runtime-catalog`; it is not a source-owned consumer.
3. Host runtime projects only via `spec-first init`; no manual modifications to `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/`, `.kiro/`, or `.qoder/`.
4. Run focused Jest, `npm run lint:skill-entrypoints`, and `git diff --check`, then expand as needed.
5. Update `CHANGELOG.md` with source changes; update README/docs with visible feature changes.

## Closeout Envelope

- `base_operation`, `effect`, `modifier`, `layer_result`, and target/source owner;
- `changed_surfaces` and explicitly unmodified surfaces
- `deterministic_checks`;
- `eval_adequacy` and actual semantic/comparative evidence
- five-axis readiness;
- generated catalog/runtime status;
- `not_checked_with_reason`;
- residual risks and next steps
