# Contract Reset Gate A Protocol

This agreement freezes Gate A's three-arm comparison in the `spec-prd` Contract Reset. It serves only the maintainer evaluation in the source checkout and is not propagated to the host runtime; it is not available as a public workflow, general benchmark platform, or automated semantic scorer.

## Authority and Decision Boundary

- `run-contract-reset-arm.js` enforces materialization, fresh session/order, hard-isolation probe, and machine facts; the model is not called when hard isolation cannot be proven.
- `prepare-contract-reset-evidence.js` handles deterministic blind transform, hash, strict UTF-8, explicit secret/canary/credential deny, symlink-safe root confinement, private permissions, and versioned raw cleanup allowlist; PII adequacy is attested by an independent evaluator.
- `run-evals.js --run-dir` performs read-only verification of manifest, patch, materialization receipt, exact schedule, attempted/completed session, isolation, custody, and retained-evidence provenance/hash contract; it does not materialize, invoke models, or assess product quality.
- Independent blind reviewer evaluates Planning invention, Interaction waste, and core product quality; current owner assesses case-specific materiality and investment value.
- Fixture, script exit 0, self-report, or consensus from multiple agents cannot substitute for original run outcome evidence.

## Freeze Before Seeing Results

`contract-reset-cases.json` is frozen source:

- arms：`baseline`、`phase1_control`、`candidate`；
- At least 3 times per arm/case;
- create/refine/validate is `gate_a_primary`; design/domain/stress is `gate_a_critical`; trigger matrix is scored independently;
- The `minimum_material_effect` for each primary case;
- Global `maximum_complexity_budget`: mandatory state concepts, always-read references, canonical owners, hot-path reference reads, and front-controller size;
- host/model/authority profile, balanced order, fresh-session, arm fail, paired retry, tie/no-go, and inconclusive rules;
- blind rubric：planning invention、interaction waste、actor/problem/outcome、why now、success evidence、right-size。

Once results are generated, these fields must not be modified to allow a candidate to pass. Any change in threshold, case, source, candidate, or model profile constitutes a new attempt.

## Three-arm definition

| Arm | Materialization | Objective |
| --- | --- | --- |
| `baseline` | `parent_revision`'s allowlisted source | Replicates full behavior prior to Phase 1. |
| `phase1_control` | baseline + `control.patch` | Gate A rollout baseline; includes the validated Exit Safety. |
| `candidate` | baseline + `control.patch` + `candidate.patch` | eval-only Contract Reset; does not write to default source/runtime. |

`source-manifest.json` binds parent revision, cases hash, patch hash, allowlisted source files, per-arm tree hash, threshold hash, invocation profile, materialization verification receipt, and all session/order rows. Patches may only affect allowlisted files; `.env`, secret-like paths, untracked local-state, absolute/parent paths, external symlinks, or undeclared newly added files all fail closed. The materialization receipt is bound to three-arm patch chain/tree/source-file facts with a `confirmed` type; a run audit must be retained concurrently, otherwise the new validator structure fails.

## Namespace and Hard Isolation

Each arm/repeat uses a separate opaque namespace. The generated Agent can only see:

1. Current case allowlisted inputs;
2. Current arm's materialized source snapshot;
3. Does not include `model-visible-manifest.json` without arm/version/mapping/oracle/grade/holdout.

Control plane stores the owner-answer oracle, adjudication notes, grades, arm/version mapping, and holdout metadata, and these must not appear in the namespace.

Run active probe before and after model invocation, actually attempting to read:

- absolute path;
- Parent directory traversal;
- A symlink pointing outside the namespace;
- control plane；
- sibling arm output。

All probes must be rejected by an actual filesystem namespace/forced sandbox. Only cases with cwd/prompt restrictions, sandbox binary present but unprovable enforcement, or probe process failure to start are considered `inconclusive`; any successful read is `invalid`. Both must remain `model_invoked: false`, and prompt agreements cannot substitute for hard isolation.

## Fresh Session and Balanced Order

- Each `case_id + arm + repeat` uses a unique opaque `session_id` and a fresh generic-agent process/context.
- The session ID does not encode the ARM name; the model-visible path and manifest do not include ARM label, version mapping, or any other ARM output.
- Each case's three repeat uses frozen Latin rotation; failed retries must rerun the entire three-arm group and maintain balance, not just the poorer arm.
- Once the arm's transcript, cache, output, or context becomes visible, the entire paired run becomes invalid.

## Agent Invocation Template

The neutral task template passed by Launcher only replaces `case intent` and `model-visible input paths`:

```text
读取当前 namespace 的 model-visible-manifest、source/ 与 inputs/。按照加载到的 spec-prd source，以给定 intent 产出本期 brownfield Product Contract 或 validate report。只使用当前 namespace；不要猜测不可见材料，不要读取其他路径，不要说明版本或比较对象。输出 artifact、最小 question/action event log 与自检事实；产品质量由独立 reviewer 裁决。
```

If the current host does not have a fresh generic-agent command available for invocation within the same enforced sandbox, the launcher returns `agent_invocation_profile_not_configured` / `inconclusive`, and no fallback execution should be performed by the current long session or shared filesystem subagent.

## Blind Packet and Durable Evidence

Each successful native output is processed by `prepare-contract-reset-evidence.js` using the same `contract-reset-blind-transform/v1`:

- Only delete the path, producer/version, arm, session/namespace/order, and state/receipt identity entries listed in the versioned allowlist;
- Preserve the byte/section order of the remaining frontmatter and human-facing body;
- Output sanitized Product Contract, arm-neutral `blind-packet.md`, minimal event log, grading notes, and native/packet/body/event/grade hash;
- Fail closed for illegal UTF-8, explicit credentials/canary, quoted JSON secrets, and unbound frozen provenance before durable write; semantic PII requires evaluator `passed` attestation;
- run/evidence directory permissions are exclusive to the current user (directory `0700`, file `0600`);
- After a durable write succeeds, only delete the provider's raw log, complete transcript, sensitive payload, and temporary workspace from the versioned allowlist; deny any access to run root, durable output, retained inputs, overlapping paths, symlink ancestors, or any undeclared target; explicitly retain entries that have both authority and expiry.
- If either export reports `prepared_cleanup_incomplete` (exit 2), keep the private archive at `out_dir`. `cleanup.completed` lists successful removals; `cleanup.remaining` starts with the failed path, which may be partially removed, followed by unattempted paths. Inspect before retrying cleanup; do not delete or overwrite the archive to rerun the export.

Durable `run-audit-manifest.json` is a `generated` enclosing bundle that records hashes and `generated` / `confirmed` / `degraded` types for the source manifest, materialization receipt, patch, holdout, and run facts; additionally, if `completed_sessions[*].retained_evidence` exists, it must retain the retained manifest, sanitized Product Contract, blind packet, event log, and grading notes according to their original run-relative paths, recording hashes and artifact types for each. The structure remains limited to confirming deterministic flooring.

When necessary evidence cannot be safely de-identified, Gate A is inconclusive and the aggregated score alone is insufficient.

## Independent Scoring and Gate A Decision

Blind reviewer receives only randomized blind packets; native artifact provides only independent planner usability and deterministic topology/receipt audit.

Use per-case median:

1. candidate achieves at least two material effects that are frozen upon successful completion in create/refine/validate; the other primary does not degrade;
2. core product rubric Overall performance must at least match or exceed `phase1_control` with no new fails;
3. design/domain/stress and three Non-regression zero failures;
4. Complexity shall not exceed the frozen budget;
5. No isolation, session, identity, or evidence contamination;
6. candidate is only acceptable if it is strictly better than baseline, or better than phase1_control, or tied; otherwise, it is a no-go.

The script can report `awaiting-semantic-review`, but it cannot autonomously write "Gate A passed". The final Gate A decision must be made by a reviewer/owner after binding the original run's retained-evidence hashes.

## Promotion Holdout Commitment

Before Gate A, the independent custodian should store 6–10 sealed holdout cases outside of the repo/worktree and the generated Agent workspace, using existing OS/host access-restricted encryption primitives. The commitment shall only record the bundle hash, attempt/candidate/source hash, opaque custody ID, custodian, retention authority, and expiry—without recording the content, expected notes, or mapping.

If the current host cannot provide a genuine custody boundary that isolates the custodian from the implementer, the commitment must be written as `commitment_status: unavailable` along with a reason code, and Gate A/Promotion shall remain inconclusive. No encrypted file readable by the user shall be generated and presented as an independent custody.

`commitment_status: committed` is structurally valid only when `attempt_id`, candidate/source tree hash, and frozen source manifest are exactly identical, the `bundle_hash` is a valid SHA-256, and all opaque custody ID, custodian, retention authority, and canonical ISO expiry are present; stale or arbitrary string commitments must structurally fail and cannot be removed if custody inconclusive reason exists.

## Replay

Another operator only needs a repository checkout, `source-manifest.json`, `control.patch`, `candidate.patch`, cases, invocation profile, and retained evidence to:

1. Rebuild the three-armed structure from the parent revision;
2. Verify patch/case/threshold/tree hash;
3. Verify session/order, root confinement, and isolation facts;
4. Replay at least one real case using the same invocation template;
5. Regenerate blind packet/hash and compare it with the retained manifest.

Replay proves protocol replayability, and does not substitute for the original run grade, original output, or retained-evidence hash.

## Commands

```bash
node skills/spec-prd/evals/run-evals.js --json
node skills/spec-prd/evals/run-evals.js --run-dir <run-dir> --json
node skills/spec-prd/evals/run-evals.js --run-dir <durable-audit-dir> --require-run-audit --json
node skills/spec-prd/evals/run-contract-reset-arm.js --materialize-only --repo-root <repo> --run-dir <run-dir> --manifest <source-manifest.json> --arm <arm> --destination <namespace/source>
node skills/spec-prd/evals/run-contract-reset-arm.js --probe-only --namespace-root <namespace> --control-path <control> --sibling-path <sibling> --symlink-path <probe-symlink> --json
node skills/spec-prd/evals/prepare-contract-reset-evidence.js --run-root <run-dir> --native-output <native-output.json> --out-dir <evidence-dir> --cleanup --json
node skills/spec-prd/evals/prepare-contract-reset-evidence.js --run-audit --run-root <run-dir> --out-dir <durable-audit-dir> --cleanup --json
```

## Legal Stop

If any of the following is missing—hard isolation, replay, security, custody, original run audit, or independent outcome review—the Gate A status is `inconclusive` or `no-go`. Retain validated Phase 1 and U6 maintainer evidence; the default runtime remains unchanged, and no U7-U13 source patch, migration manifest, or rollback closure is created; only new compliance outcome evidence can reopen the process.
