## Phase 1: Investigate Candidate Learnings

For an authorized dispatch, correct a pre-launch argument rejection once without changing the read-only scope or required capabilities. Capacity-limited work stays queued until a slot frees; repeated zero capacity uses the bounded inline fallback. Other launch failures run the same investigation inline with the same inputs and an explicit substitution note. Once a worker launches, collect its outcome before retrying; inline work earns no independent coverage.

For each learning in scope, read it, cross-reference its claims against the current codebase, and form a recommendation.

A learning has several dimensions that can independently go stale. Surface-level checks catch the obvious drift, but staleness often hides deeper:

- **References** — do the file paths, class names, and modules it mentions still exist or have they moved?
- **Recommended solution** — does the fix still match how the code actually works today? A renamed file with a completely different implementation pattern is not just a path update.
- **Code examples** — if the learning includes code snippets, do they still reflect the current implementation?
- **Related docs** — are cross-referenced learnings and patterns still present and consistent?
- **Auto memory** (Claude Code only) — does the injected auto-memory block in your system prompt contain entries in the same problem domain? Scan that block directly. If the block is absent, skip this dimension. A memory note describing a different approach than what the learning recommends is a supplementary drift signal.
- **Overlap** — while investigating, note when another doc in scope covers the same problem domain, references the same files, or recommends a similar solution. For each overlap, record: the two file paths, which dimensions overlap (problem, solution, root cause, files, prevention), and which doc appears broader or more current. These signals feed Phase 1.75 (Document-Set Analysis).
- **Vocabulary** — note domain terms the learning cites (entities, named processes, status concepts with project-specific meaning). For each term: does it appear in `CONCEPTS.md`? If yes, does the definition still match how the code uses the term? If no, flag the term for Phase 4.5 to add or bootstrap. Do not edit `CONCEPTS.md` during investigation — just collect the signal centrally.

Match investigation depth to the learning's specificity — a learning referencing exact file paths and code snippets needs more verification than one describing a general principle.

### Drift Classification: Update vs Replace

The critical distinction is whether the drift is **cosmetic** (references moved but the solution is the same) or **substantive** (the solution itself changed):

- **Update territory** — file paths moved, classes renamed, links broke, metadata drifted, but the core recommended approach is still how the code works. `spec-compound-refresh` fixes these directly.
- **Potential Replace territory** — the recommendation conflicts with current code or the architecture changed. First apply `references/classify.md`'s descriptive-drift/implementation-conflict distinction: a still-governing rule may expose a product regression. Only evidence that the old recommendation no longer governs permits a successor. An authorized read-only worker or the orchestrator may draft that successor in private scratch; `references/publication.md` owns all durable writes and the shared `source_refs` / `invalidation_condition` promotion gate.

**The boundary:** if you find yourself rewriting the solution section or changing what the learning recommends, stop — that is Replace, not Update.

**Memory-sourced drift signals** are supplementary, not primary. A memory note describing a different approach does not alone justify Replace or Delete. Use memory signals to:
- Corroborate codebase-sourced drift (strengthens the case for Replace)
- Prompt deeper investigation when codebase evidence is borderline
- Add context to the evidence report ("(auto memory [claude]) notes suggest approach X may have changed since this learning was written")

Memory-only drift without corroborating current evidence is a verification gap in every mode. Preserve the learning and report the gap; stale-mark only when independent evidence establishes drift, as `references/classify.md` requires.

### Judgment Guidelines

Three guidelines that are easy to get wrong:

1. **Contradiction requires an authority check.** Compare current mechanics and independently supported guidance before classifying. A verified successor may justify Replace; an implementation that violates a still-valid rule is a potential implementation regression to report while preserving the rule.
2. **Age alone is not a stale signal.** A 2-year-old learning that still matches current code is fine. Only use age as a prompt to inspect more carefully.
3. **Check for successors before deleting.** Before recommending Replace or Delete, look for newer learnings, pattern docs, PRs, or issues covering the same problem space. If successor evidence exists, prefer Replace over Delete so readers are directed to the newer guidance.

## Phase 1.5: Investigate Pattern Docs

After reviewing the underlying learning docs, investigate any relevant pattern docs under `docs/solutions/patterns/`.

Pattern docs are high-leverage — a stale pattern is more dangerous than a stale individual learning because future work may treat it as broadly applicable guidance. Evaluate whether the generalized rule still holds given the refreshed state of the learnings it depends on.

A pattern doc with no clear supporting learnings is a stale signal — investigate carefully before keeping it unchanged.

## Phase 1.75: Document-Set Analysis

After investigating individual docs, step back and evaluate the document set as a whole. The goal is to catch problems that only become visible when comparing docs to each other — not just to reality.

### Overlap Detection

For docs that share the same module, component, tags, or problem domain, compare them across these dimensions:

- **Problem statement** — do they describe the same underlying problem?
- **Solution shape** — do they recommend the same approach, even if worded differently?
- **Referenced files** — do they point to the same code paths?
- **Prevention rules** — do they repeat the same prevention bullets?
- **Root cause** — do they identify the same root cause?

High overlap across 3+ dimensions is a strong Consolidate signal. The question to ask: "Would a future maintainer need to read both docs to get the current truth, or is one mostly repeating the other?"

### Supersession Signals

Detect "older narrow precursor, newer canonical doc" patterns:

- A newer doc covers the same files, same workflow, and broader runtime behavior than an older doc
- An older doc describes a specific incident that a newer doc generalizes into a pattern
- Two docs recommend the same fix but the newer one has better context, examples, or scope

When a newer doc clearly subsumes an older one, the older doc is a consolidation candidate — its unique content (if any) should be merged into the newer doc, and the older doc should be deleted.

### Canonical Doc Identification

For each topic cluster (docs sharing a problem domain), identify which doc is the **canonical source of truth**:

- Usually the most recent, broadest, most accurate doc in the cluster
- The one a maintainer should find first when searching for this topic
- The one that other docs should point to, not duplicate

All other docs in the cluster are either:
- **Distinct** — they cover a meaningfully different sub-problem and have independent retrieval value. Keep them separate.
- **Subsumed** — their unique content fits as a section in the canonical doc. Consolidate.
- **Redundant** — they add nothing the canonical doc doesn't already say. Delete.

### Retrieval-Value Test

Before recommending that two docs stay separate, apply this test: "If a maintainer searched for this topic six months from now, would having these as separate docs improve discoverability, or just create drift risk?"

Separate docs earn their keep only when:
- They cover genuinely different sub-problems that someone might search for independently
- They target different audiences or contexts (e.g., one is about debugging, another about prevention)
- Merging them would create an unwieldy doc that is harder to navigate than two focused ones

If none of these apply, prefer consolidation. Two docs covering the same ground will eventually drift apart and contradict each other — that is worse than a slightly longer single doc.

### Cross-Doc Conflict Check

Look for outright contradictions between docs in scope:
- Doc A says "always use approach X" while Doc B says "avoid approach X"
- Doc A references a file path that Doc B says was deprecated
- Doc A and Doc B describe different root causes for what appears to be the same problem

Contradictions between docs are more urgent than individual staleness — they actively confuse readers. Flag these for immediate resolution, either through Consolidate (if one is right and the other is a stale version of the same truth) or through targeted Update/Replace.

## Subagent Strategy

Before any investigation or replacement dispatch, record:

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

`workflow invocation does not authorize dispatch`. Require an explicit current
user or visible upstream request for subagents, delegated work, personas, or
parallel work. Headless mode, scope size, permissions, and invocation do not
grant authority. Without it, do not probe tool schemas: record
`capability_probe: not_applicable`, `worker_dispatch_capability: unknown`, and
`dispatch_authorization_missing`, then investigate inline or serially. With
authority, inspect the live registry/schema as `provider_untrusted` evidence.
Confirmed absence is `subagent_capability_missing`; unavailable or incomplete
schemas and ambiguous candidates are `worker_capability_unproven`. Both use
the same fallback. Derive isolation, model overrides, and bounded concurrency
only from live facts. Unmet required isolation keeps dependent gates open;
unknown model support inherits, unknown parallelism serializes. Record
`worker_dispatch_outcome`; inline fallback earns no independent coverage.

When dispatch is authorized and available, use subagents for context isolation when investigating multiple artifacts — not just because the task sounds complex. Otherwise choose the matching main-thread or serial approach with the same evidence contract:

| Approach | When to use |
|----------|-------------|
| **Main thread only** | Small scope, short docs |
| **Sequential subagents** | 1-2 artifacts with many supporting files to read |
| **Parallel subagents** | 3+ truly independent artifacts with low overlap |
| **Batched subagents** | Broad sweeps — narrow scope first, then investigate in batches |

**When spawning an authorized subagent**, omit the `mode` parameter so the user's configured permission settings apply; those settings are execution conditions, not authorization. Include this instruction in its task prompt:

> Use the host's dedicated file search and read tools where available. If the host provides only shell-based reads, use bounded read-only searches and reads under its actual permissions; do not pretend a missing tool exists.
>
> Also scan the "user's auto-memory" block injected into your system prompt (Claude Code only). Check for notes related to the learning's problem domain. Report any memory-sourced drift signals separately from codebase-sourced evidence, tagged with "(auto memory [claude])" in the evidence section. If the block is not present in your context, skip this check.

There are two subagent roles:

1. **Investigation subagents** — read-only. They must not edit files, create successors, or delete anything. Each returns: file path, evidence, recommended action, confidence, and open questions. These can run in parallel when artifacts are independent.
2. **Replacement subagents** — draft one candidate successor and return its content or a run-local scratch reference. They never write tracked files, stage, commit, or delete. These run **one at a time, sequentially**; the orchestrator validates the draft and performs the tracked successor write, deletion, and metadata updates.

The orchestrator merges investigation results, detects contradictions, coordinates replacement drafts, and owns publication centrally. In interactive mode, ask for missing material decisions; in headless mode, preserve uncertain claims and prepare stale annotations only for independently evidenced drift. If artifacts overlap or discuss the same root issue, investigate them together rather than parallelizing.


### Required investigation prompt clauses

When an authorized investigation subagent is used, its prompt must also state:

> If the learning is knowledge-track and names or links a guidance file (a skill's `SKILL.md`, a runbook, or a root instruction file), read that named guidance and report any contradictory order or rule with both quotes and which side current code follows. Do not search the guidance layer for an unreferenced file, and do not edit it.

Apply the same named-guidance comparison during inline investigation. Record
unrelated themes within a category or nearly empty categories as report-only
observations; do not restructure directories or create categories.

If worth audit is selected, also pass its claim-by-claim recovery task to each
authorized worker, or perform it inline. Its explicitly scoped recovery search
may read otherwise unnamed guidance, but never edit it. Report code/guidance
conflicts separately from recoverability; a related topic is not quoted coverage.
