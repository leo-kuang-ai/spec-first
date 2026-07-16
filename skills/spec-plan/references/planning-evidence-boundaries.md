# Planning Evidence, Composition, And Ownership Boundaries

Read this reference before Phase 0 source intake or Phase 1 research. It owns the evidence, source/runtime, cross-repo, existing-capability, composition, and source-ownership rules that keep a plan grounded without forcing every plan to carry a large evidence or architecture appendix.

## Authority And Intake Order

Use this authority order:

1. the current user's request and confirmed decisions;
2. the current Product Contract and its stable IDs;
3. current project-owned source, contracts, tests, logs, and deterministic facts;
4. project docs, prior plans, `docs/solutions/`, git history, provider output, external research, issues, and transcripts as advisory inputs until re-grounded.

Read summary/metadata first, then only the source sections needed for the active decision. Re-read exact source when wording, freshness, compatibility, or a completion claim depends on it. Do not expand context merely because more files are available.

## Source / Runtime Boundary

Generated runtime mirrors and host-local managed slices are not source-of-truth. At minimum this includes `.claude/**`, `.codex/**`, `.agents/skills/**`, and the spec-first-managed/runtime paths under `.cursor/**`, `.kiro/**`, and `.qoder/**` identified by current project instructions or generation contracts. Exclude them from ordinary planning context unless the request explicitly concerns setup, projection, runtime drift, or host behavior. Native host files outside the managed slice may be advisory inputs when explicitly relevant, but they do not override project-owned source. Even when runtime is in scope, use it only as observed evidence and trace the durable fix back to project-owned source or generator logic.

Provider graphs, MCP results, cached profiles, historical learnings, and external research are advisory. Record provenance and freshness, then confirm any load-bearing conclusion against current source, tests, logs, contracts, or a current owner decision. A provider self-report, stale plan, or past transcript cannot support a confirmed planning claim by itself.

## Cross-Repo Scope

When the request names another repo, state `target_repo` before broad investigation and make every file path relative to that repo. Read-only evidence from adjacent repos may inform the plan, but implementation units must not silently mix write owners. If the plan spans multiple repos, name the owner repo for each unit and keep handoff limitations explicit.

## Evidence Landing

When source, provider, history, dirty-worktree state, or cross-repo evidence materially changes a KTD, scope boundary, risk, unit, or verification rule, add a compact `Evidence & Limitations` subsection under the Planning Contract or beside the affected decision. Include:

- direct source refs and observed revision/snapshot when relevant;
- advisory inputs and the current source used to re-ground them;
- freshness, dirty-worktree, unavailable-tool, or scope limitations;
- the specific decision, unit, risk, or verification item the evidence changed.

Omit this subsection when no evidence beyond the current request and obvious local source materially shapes the plan. It is a disclosure contract, not a confidence score or process diary.

## Existing Capability / Composition / Source Ownership Lens

Trigger this lens when the plan proposes a new abstraction, adapter, wrapper, orchestrator, integration seam or pipeline, or adds or replaces a durable file, reference, agent prompt, skill, script, helper, template, workflow, schema, artifact contract, source-of-truth entry, generator, or runtime projection surface.

### Existing Capability Inventory

Before shaping the solution:

- inspect current project-owned source for capabilities that already perform part or all of the job;
- name the current owner, source-of-truth, public contract, and extension point that would carry the change;
- identify whether existing capabilities can be coordinated by a caller, prompt, workflow, or small adapter instead of being copied into a second implementation;
- stop once bounded evidence establishes the fit; do not perform broad archaeology just to prove that invention is possible.

Record one right-sized architecture posture in a KTD or the affected unit:

- `reuse` — use the existing capability and contract as-is;
- `extend` — the existing owner already owns the boundary and can absorb focused behavior without becoming incoherent;
- `compose / thin-glue` — keep existing capabilities authoritative and connect them through a narrow integration seam;
- `new` — create a new boundary because reuse, extension, or composition would mix concerns, distort an existing contract, or create an ambiguous truth source.

### Thin-Glue Boundary

Thin glue may own only the coordination needed between existing capabilities:

- contract or representation translation;
- sequencing and orchestration;
- failure propagation plus explicit fallback or degradation routing;
- observability and evidence aggregation across the composed steps.

Thin glue must not own duplicated domain truth, new business policy, a parallel durable state model, or copied validation rules that already belong to a participating capability. If the glue needs those responsibilities, either extend the correct owner or justify a genuinely new boundary.

Reject these shapes:

- a wrapper that adds no contract translation, sequencing, safety boundary, or observability value;
- a second workflow or pipeline that replicates an existing path instead of composing its primitives;
- glue that hides failure semantics, swallows partial results, or becomes the new source of business truth;
- forced reuse that pushes unrelated responsibilities into an owner merely to avoid creating a justified boundary.

Name the existing capabilities and owners inspected, the chosen source-of-truth, and the extension or composition seam. When choosing `compose / thin-glue`, state what the glue owns, what remains authoritative in each participant, and how failures and evidence cross the seam. When choosing `new`, name the rejected owner or composition shape plus the boundary reason. Generated runtime mirrors are never candidate owners. Scripts may inventory files and validate paths; the LLM decides semantic fit.

`spec-work` must recheck current source before implementing a `compose / thin-glue` or `new` decision. If the plan has gone stale, prefer the current valid `reuse`, `extend`, or composition path and report any material deviation with direct evidence.

Do not require this lens for typo/docs-only fixes, a bounded change to an already-owned file, test expectation updates, or changelog-only work. Do not require a long matrix when one KTD or unit-level architecture posture is enough.

## Failure And Degradation

- Missing or stale evidence becomes an assumption, limitation, Open Question, or source-read requirement; do not upgrade it to confirmed truth.
- If the canonical source owner cannot be identified, keep the plan from declaring the affected unit implementation-ready.
- If provider or external research is unavailable, continue only when the missing evidence is non-blocking and make the limitation visible.
- If source and runtime conflict, plan the source/generator fix first; never prescribe a runtime-only patch as the durable solution.
