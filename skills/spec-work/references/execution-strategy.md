# Execution Strategy

Load this reference after Phase 0 has selected an executable code input and before the first write, behavior-bearing test, review fix, commit, or landing action. It owns execution workspace, task tracking, worker dispatch, integration, and exit authorization. It does not change source-plan scope, task-pack identity, verification truth, or shipping quality gates.

## Owned

- Resolve the mutation repository, source owner, branch/worktree posture, and pre-existing dirty overlap.
- Classify discovered files as necessary to existing scope or as scope-changing discovery.
- Build the task tracker from the selected plan or validated Task Pack Contract.
- Select an execution engine without assuming host capabilities.
- Separate worker dispatch authorization, callable capability, and workspace isolation.
- Decide inline, serial, or bounded parallel execution from dependencies and real contention.
- Define worker packets, actual-tree integration, cleanup, commit checkpoints, and landing handoff.

## Not Owned

- Expanding acceptance criteria, public contracts, architecture, provider boundaries, source ownership, or repository scope.
- Treating generated runtime mirrors as source-of-truth edit targets.
- Treating permission settings, a callable tool, a feature branch, or a skill invocation as dispatch, commit, push, or PR authorization.
- Reimplementing task-pack validation, source-plan readiness, review synthesis, verification evidence, or lifecycle helpers.
- Promising a particular host's isolation, merge, upload, or workspace behavior from the host name alone.

## Trigger

Load for every non-trivial code run. A trivial one-file local edit may keep the same rules inline, but it still must lock the target repository, protect pre-existing dirty work, preserve source/runtime boundaries, and obey commit/landing authorization.

## Fallback

When repo scope, source ownership, mutation authorization, or dirty overlap is unresolved, stop before mutation and return the owner/decision needed. When dispatch authorization or capability is missing, run inline and record the reason. When isolation is unknown, use shared-directory rules. Without commit authorization, leave verified changes uncommitted. Without landing authorization, do not push and do not open a PR; return a verified handoff.

## 1. Lock Repository, Scope, And Source Owner

Resolve the current Git root, branch, `HEAD`, and `git status --short` before plan-owned mutation.

- In a normal single-repo checkout, that Git root is the mutation root unless the user or plan names another local repo.
- In a parent multi-repo workspace, require one single `target_repo` or explicit per-task repo scope before any write, behavior-bearing test, review fix, changelog update, stage, or commit. Bounded read-only orientation may inspect likely child repos, but cwd and broad discovery do not choose a sibling repo for mutation.
- `--repo <artifact-root>` on task-pack commands resolves artifacts and source plans only. It does not select or authorize the mutation `target_repo`.
- Verify planned and actual changed paths are contained by the selected repo. Use the existing target-repo/path-containment helpers where a deterministic producer accepts them; otherwise use current git/filesystem facts and keep the same deny boundaries.

Record pre-existing dirty tracked and untracked paths. Classify overlap with the planned write set:

- unrelated dirty paths remain user-owned and must not be modified, staged, reverted, simplified, or included in a commit;
- a pre-existing dirty overlap in a file this run must change requires an explicit owner decision or a bounded strategy that preserves the existing hunks; do not let a worker or review fixer overwrite it;
- an unexpectedly dirty child repo in a parent workspace is out of scope unless it is explicitly selected and understood.

The source of truth is the checked-in source surface named by project instructions and the plan. `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/`, `.kiro/`, `.qoder/`, and other generated runtime surfaces are projections, not source. If runtime drift is the symptom, repair canonical source or generation logic first; run regeneration only when explicitly authorized. Never hand-edit a generated runtime mirror as the source fix.

## 2. Keep Scope Closed During Discovery

Discovery can refine implementation mechanics without silently changing the contract.

- A **necessary discovered file** is a file or existing consumer that direct source evidence shows must change to complete already-authorized behavior. Add it to the actual changed-set ledger, explain why it is necessary, inspect its tests/consumers, and keep it inside the same acceptance, architecture, source owner, provider, and repo boundary.
- A **scope-changing discovery** adds or changes acceptance, a public contract, architecture, schema/runtime/config ownership, provider boundary, source of truth, mutation repo, or a materially new risk/verification obligation. Stop the affected task and return to `spec-plan` or task-pack regeneration. Do not create a replacement in-scope task merely to absorb it.
- Real debt that is useful but unnecessary for the current scope becomes a follow-up/residual with evidence; it is not drive-by cleanup.

For task-pack input, `stop_if`, declared files, expected side effects, task delta facts, and required review remain governed by `work-intake-and-task-pack.md`.

## 3. Apply Scenario Capability Before High-Risk Exits

Consume existing scenario-fingerprint facts only when present; do not generate them merely to choose a strategy. Follow `docs/contracts/workflows/scenario-capability-matrix.md` as advisory context:

- foreign residual evidence blocks mutation and strong completion/PR-ready claims until the named cleanup/init action runs or the user explicitly accepts degraded evidence;
- unavailable optional evidence narrows the claim ceiling to direct source/test/log evidence;
- non-git build coverage gaps limit work and claims to inspected surfaces unless uncovered modules are directly inspected.

## 4. Build The Tracker And Select The Engine

- For validated task packs, tracker items come only from `Task Pack Contract.tasks` and `execution_waves`; preserve `task_id`, dependencies, source refs, files, `stop_if`, verification, and review intent.
- For direct implementation-ready plans, derive tracker items from U-IDs, dependencies, files, tests, and verification. Preserve U-IDs and execution notes.
- Name direct-plan tasks by their outcome followed by the stable U-ID, for example `Add parser coverage (U3)`. Do not lead with a bare identifier or repeat ordinal counts when the full task list is visible. Preserve task-pack IDs unchanged.
- Bare prompts use the smallest task list justified by discovery; trivial work does not need ceremony.

Read `execution-engines.md` for engine selection. Engine selection uses current runtime capability facts and explicit upstream/user direction. Choosing goal-mode or a dynamic workflow does not grant worker dispatch authorization, commit authorization, landing authorization, or permission to bypass task-pack checkpoints and the owning tail.

## 5. Separate Authorization, Capability, And Isolation

Before dispatching any worker, record the host-neutral run-local facts:

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
workspace_isolation: isolated | shared-directory | unknown
```

- `worker_dispatch_authorization` is authorized only by explicit current-user wording or a visible upstream handoff that requests subagents, delegated workers, personas, or parallel work. A structured plan, available tool, task pack, mode token, or skill invocation is not enough.
- Permission settings govern whether a tool call may execute; they are not dispatch authorization.
- Missing authorization forbids schema discovery and fixes `capability_probe: not_applicable` + `worker_dispatch_capability: unknown`.
- After authorization, inspect only the current-session registry/schema as `provider_untrusted` evidence. A completed inspection is `attempted`; no reliable discovery surface is `unavailable + unknown`; confirmed complete absence is `attempted + missing`; incomplete or ambiguous evidence is `attempted + unknown`.
- `worker_dispatch_capability: available` means only one semantically eligible candidate is available to attempt. It does not prove permission, capacity, execution, isolation, output, mutation, or support.
- `supportsAgents` is a static bundled agent-profile projection flag only. It is not session dispatch capability, loader readiness, isolation, model override, or support evidence.
- `worker_context_isolation`, `worker_model_override`, and `worker_bounded_parallelism` come from live schema/response facts rather than host identity. Required isolation unmet keeps dependent gates open; model unknown inherits; parallelism unknown serializes.
- `workspace_isolation` is isolated only when the current primitive supplies an inspectable independent workspace/diff handoff. Unknown isolation is treated as a shared directory. An isolated workspace is not automatically a faithful snapshot of the current tree: when the session itself runs inside a managed worktree, the harness may cut the worker's copy from the primary checkout or its default branch, and uncommitted state never survives isolation. Dispatch each isolated worker with the intended base commit SHA; the worker verifies its copy's HEAD equals that SHA before its first write and stops to report on mismatch — the orchestrator then runs that unit on the shared workspace under the wave contract or serially. A unit whose work depends on uncommitted state cannot use the isolated route.

Fallback reason codes:

- missing authorization -> inline execution + `dispatch_authorization_missing`;
- authorization present plus confirmed missing capability -> inline execution + `subagent_capability_missing`;
- unavailable/incomplete/ambiguous discovery -> inline execution + `worker_capability_unproven`;
- capability present but isolation unknown -> shared-directory rules + `workspace_isolation_unknown`.

Normalize dispatch, inline, and serial paths as `worker_dispatch_outcome`. Host names and primitive identities may appear only in run-local evidence, never as the Skill's selection rule. Do not promise forked workspaces, uploaded changes, worktree branches, merge behavior, or cleanup commands unless the live response returned those facts.

## 6. Choose Inline, Serial, Or Bounded Parallel

For an authorized native dispatch, correct a pre-launch argument rejection once without changing the unit packet, isolation, or required capabilities. Capacity-limited work stays queued until a slot frees; repeated zero capacity uses the bounded inline fallback. Other launch failures execute the unit inline under the same packet and verification contract only after confirming no worker launched. Once a worker launches, reconcile its terminal outcome and actual tree before retrying or falling back.

Map real dependencies and contention before a batch:

- same-file edits, shared types/APIs, migrations, generated clients, lockfiles, snapshots, shared config/schema, and an environment singleton such as one dev server/port, database, browser session, package install, or rate-limited provider are contention;
- without dispatch authorization or capability, run inline;
- with authorization and capability but shared-directory/unknown isolation, same-file or otherwise contending tasks run serially; disjoint write sets may use bounded parallel only as a shared-workspace wave that meets the wave contract below — workspace isolation is escalation for units that cannot meet it, not an entry fee every concurrent worker must pay;
- with proven isolation, parallel dispatch of each dependency layer's independent units is the default, not an optimization to opt into: serialize only the units the dependency graph or a surviving contention actually chains. Resolve contention uncertainty by inspection — read the actual files and contracts in question — not by defaulting to serial. When contention survives inspection, decline parallelism for exactly the contending units and dispatch the rest of the layer in parallel; uncertainty about one unit never serializes its whole layer, and safety still beats speed for the units that genuinely contend;
- abort parallelism after broad unplanned edits, an out-of-scope delta, repeated conflicts, or shared-environment interference.

Price the cold-start tax before decomposing: every dispatched worker pays a context ramp-up before its first write. A unit too small to outweigh its own ramp-up belongs batched with related small units into one worker's packet — or done inline — rather than dispatched alone.

**Shared-workspace wave contract** — a parallel wave in a shared working directory is permitted only while all of these hold; a unit that cannot meet one serializes or gets isolation:

- **Clean committed baseline.** Dispatch the wave from a committed tree, so each worker's output is attributable and revertible by its file set and an aborted wave restores to the baseline.
- **Exclusive ownership, including hidden write surfaces.** Beyond the disjoint declared files the dependency/contention mapping already verified, every hidden write surface — lockfiles, generated artifacts, snapshots, formatter sweeps, package manifests — is either excluded from all workers or assigned to exactly one.
- **No worker Git operations.** Workers must not `git add`, commit, or otherwise write the shared Git index — including a worker in a linked worktree, whose checkout shares the repository's Git common directory; concurrent index writes corrupt it. A worker sandbox `EPERM` is evidence about that worker only, not host capability evidence. The orchestrator stages and commits after the batch.
- **Orchestrator-owned verification.** Workers run no mutating verification (full suites, installs, builds that write shared state); a worker may run a single focused unit test only if it touches no shared state. The authoritative run happens after the wave on the integrated tree.
- **Abort on unowned writes.** A write outside every worker's exclusive set aborts the wave and disables further shared-workspace waves for the run. Restore to the baseline only changes attributable to a worker; a change no worker accounts for may be the user's — preserve it and stop for reconciliation rather than discarding it.

Dispatch a wave in one response. When a dependency layer clears its dependency/contention mapping, list every dispatch-ready unit, then issue every worker dispatch that does not depend on another's result in that single response, never one per turn. Apply the same batching to independent read-only calls throughout the run: file reads, pattern searches, and test discovery that do not depend on one another go out together. Only the write-and-verify steps are inherently sequential.

Bound concurrency to the host's real accepted capacity. Capacity backpressure is not task failure; keep work queued or fall back to serial/inline.

## 7. Worker Packet And Ownership

Each worker receives one bounded unit/task packet: goal, files, approach/execution note, patterns, source refs, non-goals, relevant verification/DoD, test scenarios, `stop_if`, review intent, and resolved repo scope. Require a final return containing actual changed paths and verification evidence, including any proof/characterization observation that cannot be reconstructed later.

Include the Product Contract Key Decisions whose `Governs R` links name that unit's R-IDs, together with cited KTDs and relevant settled decisions/rejected alternatives. A worker may narrow its packet and inherited authority, never broaden them. Preserve settled structure during implementation and simplification while reporting concrete defects at full severity; an infeasible, wrong-task, or destructive settled choice returns to the plan owner with evidence, not a silent replacement.

For native implementation dispatch, start each unit in a fresh worker context with no transcript from another implementation unit. Bind the handle to that unit only: same-unit recovery may reuse it, but a different unit requires a new context. Retire the handle after integration and use a close/release operation only if the live host exposes it and assigns cleanup to the caller. Inline execution creates no worker handle.

The worker must never commit, stage, push, open a PR, mutate lifecycle status, or change generated runtime as source. This includes a worker in a linked worktree: its checkout shares the repository's Git common directory and normally has its own worktree index; the no-Git-write boundary applies to both, so `git add`, `git commit`, index-lock creation, and other Git-index writes are forbidden even when the worker can edit files. The orchestrator owns actual-tree inspection, integration, authoritative verification, and any authorized commit/landing action. A host-side snapshot may stage the finished tree only after the worker returns; it is not worker authority. Do not weaken this boundary to "commit if possible".

Before any mutation-capable worker starts, resolve `git rev-parse --git-common-dir` and `git rev-parse --git-path index`, then require a current host enforcement receipt that names the exact resolved common directory and index path, denies worker writes there, filters the worker environment to an explicit credential allowlist, and declares its cleanup primitive. Record the pre-worker index SHA-256 plus whether `index.lock` exists; after return, recompute both facts before accepting worker evidence. An index hash change, a new/stale lock, cleanup failure, or a receipt/path mismatch is `worker_git_index_mutation_detected` or `worker_cleanup_unconfirmed` and blocks integration plus every independent worker completion claim.

When the active host cannot provide that write-deny and credential-isolation receipt, set `worker_git_index_enforcement: unavailable`, `worker_dispatch_outcome: inline-fallback`, and reason code `worker_git_index_enforcement_unavailable`; do not start the mutation-capable worker. Continue inline or serial under the orchestrator's existing mutation authority. A prose instruction, worker self-report, linked-worktree location, sandbox `EPERM`, pre/post hash alone, or `GIT_INDEX_FILE` convention is detection/advisory evidence, not enforcement, and cannot be used to claim an independently completed worker unit.

Host capability probes remain host-owned. A sandboxed worker's `EPERM`, missing shell, socket, peer-credential, or Windows permission result is evidence about that worker sandbox only; it must not be promoted to a host capability claim. Preserve the command, observed result, and reason code in the receipt, then use the narrowest inline/serial fallback.

`spec-work` adapts its validated source plan/task pack, current-tree identity, authorization facts, and verification refs locally as `context_facts_adapter/v1` with `owner: spec-work`, `source_identity`, `source_refs`, `freshness`, `artifact_type`, and `limitations`. Deterministic helpers prepare hashes, paths, Git facts, and reason codes; they do not decide task semantic fit or completion. Do not import the `spec-write-skill` package inspector or extract a shared context helper until another real workflow owner demonstrates an isomorphic input/output and failure contract.

CE's standalone cross-model work runner is intentionally not absorbed. `spec-work` composes only the active host's authorized dispatch primitive and preserves its live capability/isolation facts. A file-based `provider-serving-receipt/v2` is `degraded/unverified`; without an authenticated host producer channel, set `worker_dispatch_outcome: inline-fallback`, return `provider_serving_receipt_unverified`, start no peer subprocess, and claim no independent or cross-model coverage.

Never broaden host permissions merely to reach a write- or shell-capable implementation route. Use the current permitted inline path when it satisfies the resolved task; preserve an explicit must-use model or engine constraint as a blocker for dependent work unless existing user authorization already allows fallback. A preferred route may fall back with requested-versus-actual disclosure. A started attempt must be authoritatively terminal and reconciled before fallback begins.

Private scratch roots are resolved once per run through the host's native temporary-directory API (`TMPDIR`/`TEMP` on supported hosts), canonicalized, owner-checked, non-symlink, size-bounded, and cleaned on success or failure. Never reconstruct a root from a hard-coded `/tmp` path, a worker label, or a later invocation. On native Windows, record when POSIX no-follow or mode-bit checks are unavailable rather than claiming equivalent enforcement.

## 8. Integrate From Actual Facts

### Append-only recovery state

Keep `run.json` immutable: it owns run identity, source/task refs, and initial authorization only. For a resumable run, read and append complete snapshots under `state/<generation>.json` through the canonical `spec-work-run-artifact state-read|state-write` helper.

- Treat a legacy run with no state directory as generation 0, whose digest is the exact `run.json` bytes.
- Every new snapshot supplies the reader's `expected_generation` and `expected_sha256`. A `run-state-conflict` response means another writer won; re-read and reconcile semantically instead of overwriting.
- Carry requested/actual engine, authorization, collision, recovery, verification transaction, current worktree identity, and limitations for every unit. Do not use a mutable latest pointer.
- A temporary file, non-contiguous generation, malformed snapshot, or broken `previous_sha256` chain is not state. Resume only from the highest complete valid prefix.
- `verification.status: started` or an unknown interrupted outcome remains unknown. Only a confirmed result with evidence refs may become passed.
- `run-source-drifted` is a semantic stop: inspect the new tree and decide whether the unit is already complete, needs re-verification, or requires user direction. Never automatically rerun a unit that may already have produced side effects.

One orchestrator owns the writer lane. Workers return facts; they never append state directly.

After each serial task or parallel batch:

1. inspect actual git/filesystem changes, not only worker-reported paths;
2. compare actual changes with declared scope and the necessary-discovered-file ledger;
3. detect collisions and rerun contending shared-directory work serially when one write may have overwritten another;
4. run the task's authoritative focused verification in the orchestrator workspace;
5. close task-pack drift, `stop_if`, and required review obligations before dependents;
6. record incomplete worker evidence as unverified instead of reconstructing observations that were never reported;
7. release worker resources only through cleanup operations the active primitive explicitly supports.

## 9. Commit Authorization

Local implementation authorization does not imply git commit authorization.

- Set `commit_authorization: authorized` only when the current user or visible upstream contract explicitly requests commits or owns a commit-producing tail.
- Without commit authorization, leave verified changes uncommitted and report the logical commit candidates.
- With authorization, stage only run-owned files; never use broad staging that captures unrelated dirty paths. Commit only a coherent, verified logical unit. Default-branch commits still require explicit permission.
- Inspect the full staged diff immediately before committing. A bare `git commit` consumes every staged entry, including pre-existing staged work. Path-limited commits are suitable only for wholly run-owned paths; they can include unstaged edits from those paths, so they do not isolate overlapping user hunks. For overlaps, preserve unrelated hunks and use an inspected task-only index or leave the overlapping path uncommitted. Never treat a path list as proof of hunk ownership.
- Workers never commit; the orchestrator is the single commit owner.

## 10. Landing Authorization

Commit authorization and outward landing authorization are separate.

- Set `landing_authorization: authorized` only when the current user or visible upstream contract explicitly requests push, PR creation/update, or another outward handoff.
- Without landing authorization, do not push and do not open a PR. Return a verified handoff with changed files, checks, residuals, commit candidates, and limitations.
- Landing authorization does not waive review, residual, verification, source/runtime, or lifecycle gates.
- Return-to-Caller mode never commits, pushes, opens a PR, or runs the standalone landing tail; it returns evidence to its caller.
