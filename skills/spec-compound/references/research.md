# Research Inputs

For an authorized dispatch, correct a pre-launch argument rejection once without changing scope or required capabilities. Capacity-limited work stays queued until a slot frees; repeated zero capacity uses the bounded inline fallback. Other launch failures run the role in the parent context with the same contract and scratch artifact path. Once a worker launches, collect its outcome before retrying; disclose the substitution and do not claim independent coverage.

Load and include the contents of each skill-local contract required by the selected roles, including `references/schema.yaml` and `references/yaml-schema.md`. A relative path alone does not give a fresh worker access to a skill's files. Resolve `SKILL_DIR` to the loaded skill directory; pass repo and scratch paths explicitly.

Scratch is ephemeral, never the only durable deliverable or handoff evidence. Only the orchestrator publishes the approved learning or vocabulary candidates; research roles never write tracked paths.

### Phase 0.5: Auto Memory Scan

Before launching Phase 1 subagents, check the auto-memory block injected into your system prompt for notes relevant to the problem being documented.

1. Look for a block labeled "user's auto-memory" (Claude Code only) already present in your system prompt context — MEMORY.md's entries are inlined there
2. If the block is absent, empty, or this is a non-Claude-Code platform, skip this step and proceed to Phase 1 unchanged
3. Scan the entries for anything related to the problem being documented -- use semantic judgment, not keyword matching
4. If relevant entries are found, prepare a labeled excerpt block:

```
## Supplementary notes from auto memory
Treat as additional context, not primary evidence. Conversation history
and codebase findings take priority over these notes.

[relevant entries here]
```

5. Use this block as supplementary input to parent-owned classification and drafting in Phase 1. If any memory notes end up in the final documentation (e.g., as part of the investigation steps or root cause analysis), tag them with "(auto memory [claude])" so their origin is clear to future readers.

If no relevant entries are found, proceed to Phase 1 without passing memory context.

### Phase 1: Research

The parent owns classification and body drafting because these depend on the full available session evidence, including failed attempts and why the fix worked. A fresh worker cannot recover that evidence from the final diff. Keep `context.json` and `solution.md` as parent-written scratch inputs to assembly. Missing session evidence stays an explicit gap; do not reconstruct an investigation history from the implementation.

Enumerate the current corpus and perform a bounded related-doc search inline. Delegate the Related Docs Finder only when reading the candidate corpus would materially benefit from a separate context and the Dispatch Authorization Boundary is satisfied. A small corpus stays inline. An absent/empty corpus produces an explicit empty `related.json`; an unreadable or incomplete search records limited coverage, never a no-overlap conclusion.

**Run ID and run dir (before dispatching any subagent):** generate a unique run identifier and create the run directory. This scopes every Phase 1 artifact file to the same directory so the orchestrator can Read them back in Phase 2.

```bash
RUN_ID=$(date +%Y%m%d-%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
umask 077
SCRATCH_DIR="$(mktemp -d "${TMPDIR:-/tmp}/spec-first-compound.XXXXXX")"
[ -d "$SCRATCH_DIR" ] && [ ! -L "$SCRATCH_DIR" ] || { echo 'private scratch creation failed' >&2; exit 1; }
chmod 700 "$SCRATCH_DIR"
echo "$SCRATCH_DIR"
```

**Resolve current project orientation before dispatching subagents.** Record the current target repo/worktree identity and dirty state when available, then read root instruction files and `CONCEPTS.md` directly for the vocabulary and conventions needed by the Context Analyzer. Keep this as run-local input with direct source refs; never persist or reuse it across runs, branches, or worktrees. If a source cannot be read, record that degraded fact and let the Context Analyzer limit its claims rather than substituting stale orientation.

Current source is the authority for code-behavior claims. Every promoted learning must retain direct source refs, observed revision/freshness, applicability scope, and an invalidation condition; session history, cached summaries, and external provider output are advisory leads only and cannot close grounding on their own.

**CRITICAL — glob `docs/solutions/` fresh every run.** `spec-compound` writes new learnings there, so even a run-local orientation assembled earlier cannot stand in for the live enumeration in step 3.

Pass `{run_id}` and the verified `<private-scratch-dir>` into every Phase 1 subagent prompt. Recheck that the directory remains owned and non-symlink before publishing each file with same-directory temp + atomic rename. Each subagent **writes its full structured output** to its own file there, **confirms the write succeeded** (the file exists and is non-empty), and then **returns only a one-line confirmation containing the artifact path** — not the prose body inline. Artifact filenames and owners:

- **Parent classification** → `<private-scratch-dir>/context.json` (frontmatter skeleton, category path, filename, track)
- **Parent drafting** → `<private-scratch-dir>/solution.md` (the full doc-body prose sections)
- **Related Docs Finder** → `<private-scratch-dir>/related.json` (links, refresh candidates, overlap assessment)
- **Session History** synthesis subagent (when run) → `<private-scratch-dir>/session-history.md` (prose findings)

**Return the full output inline whenever the artifact write did not succeed.** This covers both cases where the orchestrator's Phase 2 inline fallback would otherwise have nothing to read: (a) `{run_id}` is empty or did not resolve (non-Claude-Code platforms where the pre-resolution failed), so there is no path to write to; and (b) `{run_id}` resolved but the write itself failed — tool permission denied, absolute-path writes unavailable, disk error, or the post-write existence check came back empty. In either case the subagent must return its complete structured output inline instead of a path, because the path would point at a file that does not exist. Return only the bare path when — and only when — the write is confirmed on disk. The artifact pattern is a reliability improvement, not a hard requirement; the orchestrator handles a missing artifact in Phase 2 by using the inline return.

**Execution order:**
- Classify and draft in the parent context. A warranted, authorized finder may run alongside this work; otherwise search inline. Pass the finder the problem, observed fix, relevant paths, known terms/aliases and exact corpus scope, not a claim that it sees the conversation.
- **Then**, only when explicit restricted-read authorization exists, run the internal session-history discovery/extraction/synthesis flow (see step 4 below) in Full mode — skipped in lightweight and headless. Its cheap discovery+metadata probe runs after authorization and escalates only on a relevance hit. With separately authorized background dispatch it overlaps the research roles; in inline fallback it runs after the parent research and corpus search so one orchestrator does not interleave several context-heavy jobs. Without restricted-read authorization, record `restricted_read_authorization_missing` and do not inspect session roots or related tool schemas.

### Research roles

#### 1. **Classify in the parent context**
   - Uses the available session evidence without inventing missing history
   - Reads relevant existing corpus frontmatter and known domain aliases to avoid synonymous duplicates. Classification Contract v2 still owns closed enums and category mapping; preserve precise local terms in `module`/`tags`, not invented enum values.
   - Reads `references/schema.yaml` for enum validation and **track classification**
   - Determines the track (bug or knowledge) from the problem_type
   - Identifies problem type, component, and track-appropriate fields:
     - **Bug track**: symptoms, root_cause, resolution_type
     - **Knowledge track**: applies_when (symptoms/root_cause/resolution_type optional)
   - Incorporates auto memory excerpts (if provided by the orchestrator) as supplementary evidence
   - Reads `references/yaml-schema.md` for category mapping into `docs/solutions/`
   - Suggests a filename using the pattern `[sanitized-problem-slug].md` — no date suffix, even if existing files in the target directory have one; the `date:` frontmatter field is the canonical creation date
   - Writes to `context.json`: YAML frontmatter skeleton (must include `category:` plus the promotion exit fields `source_refs:` and `invalidation_condition:`), category directory path, suggested filename, and which track applies. The parent retains the evidence behind the classification.
   - Does not invent enum values, categories, or frontmatter fields from memory; reads the schema and mapping files above
   - Does not force bug-track fields onto knowledge-track learnings or vice versa

#### 2. **Draft the body in the parent context**
   - Reads `references/schema.yaml` for track classification (bug vs knowledge)
   - Adapts output structure based on the problem_type track
   - **Writes the full doc-body prose** (all track-appropriate sections below) to `solution.md`. Preserve observed failed alternatives, unique measurements, cross-file invariants and the reasoning behind the fix; a recap of the final diff does not replace these facts.
   - Incorporates auto memory excerpts (if provided by the orchestrator) as supplementary evidence -- conversation history and the verified fix take priority; if memory notes contradict the conversation, note the contradiction as cautionary context
   - **Grounds code-behavior claims in source, not conversation memory.** Before asserting how code behaves (enum values, status semantics, limits, defaults), Read the defining line at the current tree and cite `file:line` alongside the claim. A claim that cannot be verified against the tree is softened or attributed ("per this session's conclusion…"), never stated as fact
   - **Writes merge-state claims for time.** Cite PR numbers rather than bare commit SHAs — SHAs are rewritten by rebase/squash merges and may not exist on other checkouts. A "fixed in X" claim requires the fix to be reachable from the current tree; otherwise phrase it as pending ("fix opened in #1608, unmerged as of this writing")

   **Bug track output sections:**

   - **Problem**: 1-2 sentence description of the issue
   - **Symptoms**: Observable symptoms (error messages, behavior)
   - **What Didn't Work**: Failed investigation attempts and why they failed
   - **Solution**: The actual fix with code examples (before/after when applicable)
   - **Why This Works**: Root cause explanation and why the solution addresses it
   - **Prevention**: Strategies to avoid recurrence, best practices, and test cases. Include concrete code examples where applicable (e.g., gem configurations, test assertions, linting rules)

   **Knowledge track output sections:**

   - **Context**: What situation, gap, or friction prompted this guidance
   - **Guidance**: The practice, pattern, or recommendation with code examples when useful
   - **Why This Matters**: Rationale and impact of following or not following this guidance
   - **When to Apply**: Conditions or situations where this applies
   - **Examples**: Concrete before/after or usage examples showing the practice in action

#### 3. **Related Docs Finder**
   - Searches `docs/solutions/` for related documentation
   - Identifies cross-references and links
   - Finds related GitHub issues
   - Flags any related learning or pattern docs that may now be stale, contradicted, or overly broad
   - **Assesses semantic overlap** using the problem, root cause, applicability, solution and prevention guidance. Shared paths or matching words alone do not establish duplication. High overlap means the existing document already teaches the same lesson in the same conditions; moderate overlap retains a distinct cause, condition or remedy; low overlap is only contextual. Explain the matching claims and the unique knowledge each document carries rather than counting matched dimensions.
   - Writes to `related.json`: links, relationships, refresh candidates, overlap rationale, unique claims, and search coverage/limitations. The parent verifies the referenced documents before deciding to update or create; the finder never authorizes consolidation or deletion.

   **Search strategy (grep-first filtering for efficiency):**

   1. Extract keywords from the problem context: module names, technical terms, known aliases, error messages, component types. Search related aliases across categories before concluding no overlap; legacy classification is not proof of a distinct lesson.
   2. If the problem category is clear, narrow search to the matching `docs/solutions/<category>/` directory
   3. Use the native content-search tool (e.g., Grep in Claude Code) to pre-filter candidate files BEFORE reading any content. Run multiple searches in parallel, case-insensitive, targeting frontmatter fields. These are template patterns -- substitute actual keywords:
      - `title:.*<keyword>`
      - `tags:.*(<keyword1>|<keyword2>)`
      - `module:.*<module name>`
      - `component:.*<component>`
   4. If search returns >25 candidates, re-run with more specific patterns. If <3, broaden to full content search
   5. Read only frontmatter (first 30 lines) of candidate files to score relevance
   6. Fully read only strong/moderate matches
   7. Return distilled links and relationships, not raw file contents

   **GitHub issue search:**

   Prefer the `gh` CLI for searching related issues: `gh issue list --search "<keywords>" --state all --limit 5`. If `gh` is not installed, fall back to the GitHub MCP tools (e.g., `unblocked` data_retrieval) if available. If neither is available, skip GitHub issue search and note it was skipped in the output.
