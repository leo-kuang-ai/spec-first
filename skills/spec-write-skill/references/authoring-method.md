# Authoring Method

**trigger_condition:** core branch has been determined as owner blocked, Tier A apply, or full apply; need to evaluate whether authoring is warranted, parse canonical source/effect, or design portable core.
**purpose:** Handles only the qualification, source/effect resolution, resource placement, and migration disposition of portable authoring.
**fallback_if_unread:** Near-neighbor routing only; when owner cannot be confirmed, provide candidate preview only and maintain zero mutation; do not use this reference as a substitute for delivery evidence.

Host differences see `target-profiles.md`, project governance and source/runtime see `project-profiles.md`, validation see `delivery-gates.md`.

## Qualification And Intent Contract

A Skill is created or expanded if at least one of the following conditions is met:

- recurring job will occur repeatedly;
- near-neighbor prone to misrouting;
- deterministic script/reference can reduce repetitive errors;
- portability, governance, or source ownership serves as the boundary of responsibility.

Default: no creation or modification of Skill; one-time response, explanation/summary/translation, standard document export, discussion of future outline only, standard code review/debug/plan/work, third-party installation or import. Direct installation/import requests are routed to the installer, bypassing this workflow and without enforcing a readiness check. Only when the user explicitly requests independent readiness, security, or structural checks will a no-follow check be performed first with `base_operation=revise` and `effect=validate-only`, then halted; copying, installation, or import will still be handled by separate entry points with reauthorization.

Near-neighbor or should-not-trigger requests return only the routing conclusion: `base_operation=null`, `effect=not-entered`, `modifier=none`. Subsequent entry points may suggest ordinary code work, bounded source review, installer, or runtime maintenance, but shall not record the expected actions of those entry points as part of the workflow's `apply`/`validate-only` steps, nor shall the workflow continue with its inventory, validator, or mutation steps.

Before entering authoring, you must have:

- one-sentence recurring job;
- real inputs and required outputs
- should-trigger and should-not-trigger/near-neighbor each one real example;”
- base operation: `create|revise`;
- effect: `apply|validate-only`;
- modifier: `migrate|audit-remediation|none`;
- target repo, Skill root, canonical source owner;
- mutation authorization: `ready|preview-only|blocked`;
- first verification target.

`ready` indicates a clear create/revise in the current round, and the target root and expected source surfaces have been confirmed to be within the requested scope; `preview-only` indicates the user only requests design/preview, or the owner/scope has not yet been resolved; `blocked` indicates no mutation authorization is available. Do not re-ask merely because a preview has been generated; re-verification is only required when the exact write set expands, covers dirty paths not explicitly included in the current request, or introduces new external/network/high-risk side effects.

When a revision consists only of typos, counting adjustments, metadata/terminology corrections, explicit removal of unreachable content, or equivalent structural reorganization, and does not alter trigger, schema, contract, threshold, gate, roster, or model routing, it may be processed via the Tier A short path in `authoring-workbench.md`; it still requires owner approval, authorization, preview/write-set binding, and validation against the narrowest structure. Do not disguise changes in load-bearing behavior as Tier A.

Asking only the minimum number of questions that could alter package design, permissions, or lead to irreversible outcomes, and consolidating as many questions as possible into a single round. Record the assumption and proceed when an assumption can be derived from source or when advancing with low-risk, revocable assumptions; do not use additional directories, profiles, or fallbacks to obscure genuine unresolved intentions.

## Source And Effect Resolution

Confirm target in the following order:

1. The skill directory explicitly provided by the user;
2. The project-owned source in the current repo that matches the name;
3. The canonical Skill root declared in the project rules;
4. Keep it as `preview-only` when neither can be confirmed.

Do not immediately conclude with `blocked-source-owner` when the user has bound a single target repo but has not specified a Skill root: first verify the project rules and adjacent project-owned packages. If ambiguity persists, provide a clearly labeled "candidate only" canonical path preview, a complete package outline, immutable surfaces, and a clarifying question that alters the path; maintain zero mutation until user confirmation. Use `layer_result=blocked-source-owner` only in cases where the repository is cross-repo, multiple candidate owners are involved, repo-external, or generated-only, and thus cannot be bound to a single source owner.

When a user explicitly requests create/revise, but the target/source owner is not unique, spans across repositories, or is generated-only, retain the request's `base_operation=create|revise` and `effect=apply`, but report with `layer_result=blocked-source-owner`; furthermore, the would-change paths/commands must be empty and no mutations are permitted. `not-entered` is only for cases that are fundamentally not authoring/readiness near-neighbors; do not mistakenly route a source-resolution blocker as a rejected neighbor.

`validate-only` is never upgraded to apply. For readiness checks of existing packages, use `base_operation=revise`; the term `revise` here merely indicates that the input is an existing package, and does not imply permission to modify it. The `audit-remediation` modifier processes only accepted findings. The `migrate` modifier only handles trusted source within the same repository; third-party packages and cross-repository targets are allowed only inventory/readiness. Modifier does not alter the base operation or effect, nor does it create a third execution lineage.

List the inventory of the existing package without loading the entire content into the LLM: files, directories, symlinks, special files, frontmatter fields, Markdown references, scripts, and secret-like paths. The bundled validator reads non-secret-like text bytes within the local budget for UTF-8, sensitive content, and citation checks, without returning the full text or sensitive values; the Inventory remains advisory facts, and adoption of content is determined by the LLM.

## Portable Authoring Core

### Description As Trigger Contract

The Frontmatter `description` must simultaneously express:

- Skill possesses a recurring job;
- Real user actions that trigger;
- Confusing negative boundaries;
- Declare as read-only or explicitly call boundaries if necessary.

Avoid angle-bracket placeholders, synonym stacking, and trigger rules that appear only in the body text. First use positive, negative, and near-neighbor examples to verify the route, then expand the package.

Mechanism-led ordering (from the CE authoring pass): sentence 1 names the distinctive mechanism — what a sibling skill would not produce — front-loading the word that should fire it in prompts; a category opener without the mechanism fails. Write each "Use when…" trigger as an observable work-state, not a phrasing. Prefer routing a sibling's job as "Use <sibling> for <that job>", and keep "Not for" only when the same words would fire both skills. Never stuff quoted utterances or `/name` aliases into a model-invoked description — they belong only on a user-invoked or `disable-model-invocation` skill, after the mechanism.

### Branch-First Information Hierarchy

List the branch that only takes effect when input, step, output, or validation differs, then place the resources:

- `SKILL.md`: Execution skeleton, boundaries, outputs, and security default values shared across all branches;
- `references/`: Long rules, target/project profiles, schemas, or examples required only for specific branches;
- `scripts/`: deterministic, repeatable, easily mistyped and testable logic;
- `assets/`: static media assets copied or modified in the output;
- `evals/`: Maintainer route/output regression; not runtime essential content.

The context pointer must specify "under what conditions reading occurs" and "what judgments are supported after reading."If the normal path reads all references each time, it indicates a failure in branch or owner splitting; the load-bearing rules should be merged or the splitting should be redone based on conditions.

### Match Freedom To Failure Cost

Allocate constraint strength based on task vulnerability: use principles and criteria for open semantic judgment; when a preferred path exists but variation is allowed, employ step skeletons or parametric templates; delegate actions that easily cause data corruption, privilege escalation, or format damage to narrow scripts and hard gates. Do not use long prompts to simulate deterministic verification of schema/path/hash; also do not use scripts to replace product, architectural, or semantic judgment.

When a Skill's primary mechanism is prose, role/persona, few-shot, output format, or agent loop, read `behavior-contract-design.md`. It only governs the model behavior contract and does not replace the package, source owner, resource placement, and portability rules specified in this document.

### Completion Criteria And Pruning

Write, shell, runtime, network, delegate, and handoff steps must all be present:

- clarity: can determine done/not done;
- demand: a clearly defined requirement for completing an investigation, verification, or deliverable;
- failure behavior: Stops, degrades, or handoffs when conditions are not met.

Check each sentence of prose for changes to trigger, read, write, judge, validate, or handoff; remove if no changes. A concept retains only one owner to avoid redundant explanations that create multiple conflicting truths.

## External Pattern And Migration Rules

The reference order is external benchmark → user source → local fit. Only absorbs reusable patterns, without copying platform invocations, absolute paths, permission assumptions, or unverified public claims.

Same-repo migration provides a disposition for each non-portable file:

- `preserve`: the target continues to consume and the content remains unchanged;
- `translate`: has confirmed target/project mapping;
- `drop-with-reason`: confirm it is a generated item, maintainer-only, or the target is not supported;
- `manual-decision`: owner, semantics, or consumer is not clear.

Unknown metadata, sidecar, and user files default to `preserve` or `manual-decision` and should not be deleted for the sake of "cleanliness".

## Anti-Pattern Families

- `one-off-vs-reusable`: Package a one-time request into a Skill.
- `audit-not-authoring`: Audits only and directly writes source.
- `external-import-mutation`: Copying or executing a third-party package without confirmation from a trusted/source owner.
- `runtime-mirror-patch`: Treat the generated runtime as the canonical source.
- `project-profile-leak`: Express a single-project governance as a portable contract.
- `target-profile-leak`: Treats the metadata of a single host as a general standard.
- `weak-context-pointer`: The reference condition has not been read.
- `vague-completion-criterion`: Steps contain only action names and no done signal.
- `fixture-as-behavior-proof`: The structural example passes but claims model behavior improvement.
- `leading-word-no-op`: The slogan does not alter the actual action.
- `adjective-persona`: Uses adjectives to construct a persona, but lacks observable behavioral tendencies.
- `flat-must-wall`: Write hard gate, preference, and heuristic as commands of the same strength.
- `example-without-boundary`: Contains only ideal positive examples, with no near-neighbor/bad/why calibration.
- `self-check-as-evidence`: Treats model self-verification or "compliance" as semantic/field proof.
- `fixed-tool-quota`: Replace cost, dependency, and risk assessment with a fixed number of calls or the "tool-free" assumption.

## Skill Creator Compatibility

- `name` uses kebab-case and is consistent with the directory structure and the target project's governance records.
- Portable baseline requires only `name` and `description`; additional fields are determined and retained by the target profile, with unknown fields being preserved.
- Description Do not use `<placeholder>`; use natural language or `{placeholder}` when a placeholder is needed.
- New scripts must have evidence of actual execution and zero unintended writes.
- Forward testing passes only the raw artifact and the actual user request, without leaking the expected answer or intended fix.

### Plain prose during size restructuring

Keep one idea per sentence in ordinary language. Do not fuse clauses, drop articles, or pack several rules into a compressed sentence merely to meet a byte ceiling. When a body is too large, move a coherent block to a reference named at its point of use or remove genuine redundancy. Leave headroom for later fixes; readability and preserved safety meaning take priority over squeezing bytes.

## Size restructure checkpoints

Classify the current body and consumers before extracting, even below a size ceiling. A procedure without references may need phase owners; a compact router may need only a shared invocation reference. Audit frontmatter as its own always-loaded activation contract. Read public product documentation before changing behavior, including whether completion promises a local commit or a separate shipping handoff.

Trace every moved reference from its executing step. Delete a reference that loses all callers unless an independent consumer or provenance requires retention. A green baseline supports a no-regression comparison, not a claim that behavior improved; validate any claimed improvement separately.

Before rewriting for a size limit, identify the constraint's source and the shipping path it governs. Distinguish observed truncation from a future packaging target; neither a target nor an upstream incident proves that the current host truncates this Skill. Preserve required behavior even when the body cannot meet the target, and record the remaining constraint.

Run the existing contract tests before rewriting and audit each verbatim pin by the failure it protects. Check the test comment or introducing commit, not the author's identity or the pin's age:

- Keep incident-backed rules that must act before any reference read in the body. Preserve exact wording only when wording is the contract, such as an invocation or status token.
- Check artifact invariants over the reachable body and references when they need not act at load time. Do not turn every body assertion into a corpus search.
- Restate incidental wording as the condition it protects, or remove an unsupported assertion with a reason in the test comment. Missing provenance does not by itself justify removing a safety rule.

Read what each assertion measures. A search-window ceiling is not a required section size or a minimum body size. Relocate coherent blocks before deleting them; do not compress prose to satisfy a numeric target. For placement and evaluation, follow the workbench and evaluation references required by the current apply branch.

Treat a removed concrete shape as a behavior change. A concrete form — a known-good fragile command, or the failing shape a rule names — may be what the most literal host in the shipping matrix actually matches on, so removing it is a behavior change however the block reads afterward. Decide whether a host needs the shape by running that host, not by re-reading the block; when it needs one, keep a single example subordinated under the condition it illustrates (it rules on nothing) rather than choosing between condition and case list. The same test governs generalizing an enumeration into its condition. A removal or generalization still gets the behavioral eval whenever the removed text could have been carrying a literal reader — which is not the same as having recorded provenance.

Let nothing compete with an exclusion. Literal readers act on whatever follows an exclusion when it offers a competing decision: an illustration subordinated to the exclusion is fine because it decides nothing, a qualification goes before it, and an alternative destination is delegated to the section that owns it rather than listed inline as somewhere else to land.

After verbatim relocation, compare each reference with the body before evaluation. Remove the reference's duplicate of any gate, condition, or confirmation still owned by the body; preserve the body copy that must act before a read. The reference should state the facts or procedure it supplies to that gate. Relocation is incomplete while the same decision is independently prescribed twice, even if both copies agree today.

Read moved rules against their new neighbors. A rule that was safe inside a phase can appear to override a nearby boundary after extraction. State its actual precondition where it now appears. If a shortened sentence needs a second corrective qualification, stop shortening the proxy and state the underlying condition. For example, protecting completed checkpoints must still allow a recovery scan for missing result markers; an absolute ban on entering earlier phases would lose that recovery path.

When shared mandatory blocks prevent meeting a size ceiling, measure their combined floor and identify the owning shared contract that would need to change. Disclose the remaining limit rather than removing pinned safety behavior or claiming that prose compression can solve it. Keep any change to that shared contract within its own authorized scope.
