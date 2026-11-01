# Persistence: rules, checkpoints, and resume

Read this before Phase 0 and follow it for the whole run.


**CRITICAL: The experiment log on disk is the single source of truth. The conversation context is NOT durable storage. Results that exist only in the conversation WILL be lost.**

The files under `.spec-first/workflows/spec-optimize/<spec-name>/` are local scratch state. They are ignored by git, so they survive local resumes on the same machine but are not preserved by commits, branches, or pushes unless the user exports them separately.

This skill runs for hours. Context windows compact, sessions crash, and agents restart. Every piece of state that matters MUST live on disk, not in the agent's memory.

**If you produce a results table in the conversation without writing those results to disk first, you have a bug.** The conversation is for the user's benefit. The experiment log file is for durability.

### Core Rules

1. **Write each experiment result to disk IMMEDIATELY after measurement** — not after the batch, not after evaluation, IMMEDIATELY. Append the experiment entry to the experiment log file the moment its metrics are known, before evaluating the next experiment. This is the #1 crash-safety rule.

2. **VERIFY every critical write** — after writing the experiment log, read the file back and confirm the entry is present. This catches silent write failures. Do not proceed to the next experiment until verification passes.

3. **Re-read from disk at every phase boundary and before every decision** — never trust in-memory state across phase transitions, batch boundaries, or after any operation that might have taken significant time. Re-read the experiment log and strategy digest from disk.

4. **One experiment, one log entry.** Append its first result; later ladder samples update that same entry with accumulated observations, comparison, outcome, and next step. Preserve every earlier sample and gate value, and never rebuild another experiment's history from memory. Update `best` and the backlog in place at CP-4. Persist combined runner-up observations separately from the standalone snapshot; a new measured source identity starts a fresh sample set.

5. **Per-experiment result markers for crash recovery** — each experiment writes a `result.yaml` marker in its worktree immediately after measurement. On resume, scan for these markers to recover experiments that were measured but not yet logged.

6. **Strategy digest is written after every batch, before generating new hypotheses** — the agent reads the digest (not its memory) when deciding what to try next. The strategy digest is derived, reconstructable state; the experiment log remains the canonical resume and audit source. Persist every hypothesis decision, kept/reverted result, metric, and audit field needed to reconstruct the digest in the experiment log before replacing or deleting the digest.

7. **Never present results to the user without writing them to disk first** — the pattern is: measure -> write to disk -> verify -> THEN show the user. Not the reverse.

### Comparison identity and authorization provenance

Use the optional `comparisons` records described in the log schema for new runs. One record identifies one reference/candidate/workload/protocol pairing. A new source, workload, rubric, environment or measurement protocol starts a distinct record; additional samples only extend the identical pairing, preserving earlier raw results. Record exact source bytes or a clean revision plus relevant input digests: a shared HEAD cannot identify two different uncommitted trees. Standalone, integrated and original-baseline-to-final results stay separate, as do selection and holdout. Record the actual measuring actor and environment; a new label, seed or process ID alone does not establish independence.

Persist the original opportunity before dispatch and retain it unchanged beside results. Missing historical forecasts, identities or raw samples remain unrecorded. Never backfill them from the winning result. The numeric decider still consumes the existing baseline/candidate payload, selected from the exact comparison; it does not authenticate these provenance records.

Record the actual authorization source, saved spec digest and applicable caps in the existing run evidence before work. User approval and delegated owner decisions are distinct provenance. Resume reuses authority that still covers the scope; a changed digest requires reconciliation of changed effects and protocol, not invented approval or blanket reapproval. Preserve incompatible run evidence and start a separate run when measurement semantics change.

### Mandatory Disk Checkpoints

These are non-negotiable write-then-verify steps. At each checkpoint, the agent MUST write the specified file and then read it back to confirm the write succeeded.

| Checkpoint | File Written | Phase |
|---|---|---|
| CP-0: Spec saved | `spec.yaml` | Phase 0, after user approval |
| CP-1: Baseline recorded | `experiment-log.yaml` (initial with baseline) | Phase 1, after baseline measurement |
| CP-2: Hypothesis backlog saved | `experiment-log.yaml` (hypothesis_backlog section) | Phase 2, after hypothesis generation |
| CP-3: Each experiment result | `experiment-log.yaml` (append first result; update same entry after further samples) | Phase 3.3, immediately after each measurement |
| CP-4: Batch summary | `experiment-log.yaml` (outcomes + best) + `strategy-digest.md` | Phase 3.5, after batch evaluation |
| CP-5: Final summary | `experiment-log.yaml` (final state) | Phase 4, after selecting a next step that does not return to Phase 3 |

**Format of a verification step:**
1. Write the file using the native file-write tool
2. Read the file back using the native file-read tool
3. Confirm the expected content is present
4. If verification fails, retry the write. If it fails twice, alert the user.

### File Locations (all under `.spec-first/workflows/spec-optimize/<spec-name>/`)

| File | Purpose | Written When |
|------|---------|-------------|
| `spec.yaml` | Optimization spec (frozen once backlog or experiments exist; earlier adjustment reruns Phase 1) | Phase 0 (CP-0) |
| `experiment-log.yaml` | Full history of all experiments | Initialized at CP-1, appended at first CP-3, updated on later samples and at CP-4 |
| `strategy-digest.md` | Compressed learnings for hypothesis generation | Written at CP-4 after each batch |
| `<worktree>/result.yaml` | Per-experiment crash-recovery marker | Immediately after measurement, before CP-3 |

### On Resume

When Phase 0.4 detects an existing run:
1. Read the experiment log from disk — this is the ground truth
2. Scan worktree directories for `result.yaml` markers not yet in the log
3. Recover any measured-but-unlogged experiments and merge later samples into their existing entry by experiment and measured source identity; never duplicate a hypothesis or combine samples from different source snapshots
4. Skip only work whose completion the recovered log proves. Re-enter any gate not cleared by visible user or upstream authorization covering the unchanged scope. Checkpoints prove persisted work, not user decisions; never infer approval from CP-1 or an iteration number.
5. Preserve the saved spec and baseline on resume. Spec adjustment is limited to an empty backlog and no experiments and reruns Phase 1; otherwise preserve this run and use a separate run for a changed protocol.

---
