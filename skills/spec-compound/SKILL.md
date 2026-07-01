---
name: spec-compound
description: "Document a just-solved, source-confirmed problem as reusable team knowledge in docs/solutions/. Do not use for active debugging, unresolved hypotheses, one-off summaries or transcript archiving, mandatory completion gates, or refreshing existing learnings; use spec-compound-refresh for stale knowledge."
---

# Compound Knowledge

Coordinate multiple subagents working in parallel to document a recently solved problem.

## Purpose

Captures problem solutions while context is fresh, creating structured documentation in `docs/solutions/` with YAML frontmatter for searchability and future reference. Uses parallel subagents for maximum efficiency.

**Why "compound"?** Each documented solution compounds your team's knowledge. The first time you solve a problem takes research. Document it, and the next occurrence takes minutes. Knowledge compounds.

## Workflow Contract Summary

### When To Use

Use after a real problem has just been solved and the reusable lesson is worth preserving for future agents or teammates.

### When Not To Use

Do not use for active debugging, unresolved implementation work, one-off cosmetic edits, raw transcript archiving, or as a mandatory completion gate.

### Inputs

The solved problem context, changed files/tests, final work/review summaries, optional session-history refs, existing `docs/solutions/` candidates, and support-file contracts.

### Outputs

One durable solution document, duplicate/related-doc notes, optional discoverability maintenance, and a concise evidence-backed summary.

### Artifacts

The primary artifact is one `docs/solutions/` learning document; instruction-file edits happen only when the discoverability check finds a concrete gap.

### Failure Modes

No solved problem, missing reusable lesson, unclear scope, duplicate documentation, unsafe raw evidence, unavailable subagent/session search, or YAML/schema validation failure.

### Workflow

Choose full or lightweight mode, gather bounded evidence, check existing learnings, write the solution doc, validate frontmatter, and report the reusable lesson and evidence paths.

### Downstream Consumers

`spec-plan`, `spec-work`, `spec-code-review`, `spec-sessions`, future compound-refresh runs, repo-local advisory vocabulary when present, and humans searching `docs/solutions/`.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Examples As Context

When editing or reviewing this workflow prompt, or when running fresh-source eval for knowledge-promotion posture drift, read `skills/spec-compound/evals/examples.json` as examples-as-context. These examples are not a deterministic router, state machine, semantic readiness gate, or substitute for LLM judgment during ordinary compound runs.

## Usage

```bash
current host's compound entrypoint
current host's compound entrypoint with brief context
```

## Pre-resolved context

**Git branch (pre-resolved):** !`git rev-parse --abbrev-ref HEAD 2>/dev/null || true`

If the line above resolved to a plain branch name (like `feat/my-branch`), pass it into the Session Historian dispatch in Phase 1 so the agent does not waste a turn deriving it. If it still contains a backtick command string or is empty, omit it and let the agent derive it at runtime.

## Support Files

These files are the durable contract for the workflow. Read them on-demand at the step that needs them — do not bulk-load at skill start.

- `references/schema.yaml` — canonical frontmatter fields and enum values (read when validating YAML)
- `references/yaml-schema.md` — category mapping from problem_type to directory (read when classifying)
- `references/domain-model-capture.md` — domain signal scan, boundary scenarios, code cross-reference, and context/ADR preview-only rules (read in Phase 2.4 when the solved lesson exposes qualifying domain-model signals)
- `references/concepts-vocabulary.md` — advisory `CONCEPTS.md` inclusion and update-only rules (read in Phase 2.4 when `CONCEPTS.md` exists)
- `assets/resolution-template.md` — section structure for new docs (read when assembling)

When spawning subagents, pass the relevant file contents into the task prompt so they have the contract without needing cross-skill paths.

## Runtime Context Exclusion

Follow `docs/contracts/context-governance.md`: ordinary Compound research excludes `.spec-first/audits/**`, `.spec-first/governance/**`, and generated mirrors (`.claude/**`, `.codex/**`, `.agents/skills/**`) by default. Compound from confirmed fix summaries, changed source/test paths, session extracts, and `docs/solutions/` candidates; read runtime/audit/governance artifacts only when the reusable lesson is specifically about setup/update/runtime drift/audit/governance evidence or the user names a precise path.

## Summary-First Handoff

Consume upstream `artifact-summary.v1`-style summaries from `docs/contracts/artifact-summary.md` before opening full plans, reviews, work logs, session extracts, or raw artifacts. The durable compound output should capture the reusable lesson delta and evidence paths, not copy full upstream reports or raw tool output. If a summary is missing, record `summary_missing` and read the smallest explicit source path needed to verify the lesson.

When upstream work/review/debug summaries include external-tool or broad impact evidence, treat it as advisory focus only. Compound may record reusable lessons only after the claim is source-confirmed by changed source, tests, logs, contracts, or review findings; raw tool output and raw diff hunks must not enter durable `docs/solutions/` learning docs. If an external tool helped locate the lesson, cite the compact summary and the confirming source paths, not the raw response.

## Structured Promotion Gate

Use `references/schema.yaml` as the canonical `docs/solutions/` frontmatter contract. For a new promoted solution, include the structured recall fields required by the promotion path: `invalidation_condition` and `source_refs`. Also include `domain`, `pattern`, `rejected_alternatives`, and `applicable_versions` when they improve recall quality. Only a source-confirmed, verified learning may enter durable `docs/solutions/`; session notes, raw tool output, and unresolved hypotheses are not promoted.

Existing learning docs that predate the structured recall fields remain `legacy_unstructured_advisory`: they may be read as advisory candidates, but missing `invalidation_condition` or `source_refs` must not block refresh or ordinary recall. A legacy doc becomes structured only after minimal backfill and source confirmation. Do not create or reference a separate `solution-promotion.schema.json`; the schema contract lives in `references/schema.yaml`.

## Distilled Replay References

When using session or prior-work evidence, prefer distilled replay refs over full history. A replay ref should name the source session/extract or upstream checkpoint, the accepted or rejected decision, the evidence path, and the relevance to the new learning. Rejected or out-of-scope rationale can be captured when it teaches a reusable boundary, but it must not become workflow status or a task completion claim.

Do not build a durable replay index from compound. The durable output remains one learning document plus evidence paths; full transcripts, raw tool output, and complete review bundles stay out of the learning unless a short excerpt is necessary and safe.

## Execution Strategy

Present the user with two options before proceeding, using the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded) or `request_user_input` in Codex. Fall back to presenting options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

```
1. Full (recommended) — the complete compound workflow. Researches,
   cross-references, and reviews your solution to produce documentation
   that compounds your team's knowledge.

2. Lightweight — same documentation, single pass. Faster and uses
   fewer tokens, but won't detect duplicates or cross-reference
   existing docs. Best for simple fixes or long sessions nearing
   context limits.
```

Do NOT pre-select a mode. Do NOT skip this prompt. Wait for the user's choice before proceeding.

**If the user chooses Full**, ask one follow-up question before proceeding. Detect which supported harness is running (Claude Code or Codex) and ask:

```
Would you also like to search your [harness name] session history
for relevant knowledge to help the Compound process? This adds
time and token usage.
```

If the user says yes, invoke `spec-sessions` in Phase 1 with the narrow problem topic and output schema below. If no, skip it. Do not ask this in lightweight mode.

---

### Full Mode

<critical_requirement>
**The primary output is ONE file - the final documentation.**

Phase 1 subagents return TEXT DATA to the orchestrator. They must NOT use Write, Edit, or create any files. Only the orchestrator writes files: the solution doc in Phase 2, an update-only refinement to an existing repo-root `CONCEPTS.md` in Phase 2.4 when qualifying terms surface, and — if the Discoverability Check finds a gap — a small edit to a project instruction file (AGENTS.md or CLAUDE.md). Domain model capture may fold boundary scenarios, code contradictions, rationale, or ADR-worthy candidate wording into the solution doc; ordinary compound runs do not create or edit `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/**`. The vocabulary and instruction-file edits are maintenance side effects, not second deliverables; the primary output remains one `docs/solutions/` learning document.
</critical_requirement>

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

5. Pass this block as additional context to the Context Analyzer and Solution Extractor task prompts in Phase 1. If any memory notes end up in the final documentation (e.g., as part of the investigation steps or root cause analysis), tag them with "(auto memory [claude])" so their origin is clear to future readers.

If no relevant entries are found, proceed to Phase 1 without passing memory context.

### Phase 1: Research

Launch research subagents. Each returns text data to the orchestrator.

**Dispatch order:**
- Launch `Context Analyzer`, `Solution Extractor`, and `Related Docs Finder` in parallel (background)
- If the user opted into session history, invoke `spec-sessions` in foreground; it owns session discovery, scratch extraction, and `spec-session-historian` synthesis
- The foreground session enrichment runs while the background agents work, adding no wall-clock time when relevant

<parallel_tasks>

#### 1. **Context Analyzer**
   - Extracts conversation history
   - Reads `references/schema.yaml` for enum validation and **track classification**
   - Determines the track (bug or knowledge) from the problem_type
   - Identifies problem type, component, and track-appropriate fields:
     - **Bug track**: symptoms, root_cause, resolution_type
     - **Knowledge track**: applies_when (symptoms/root_cause/resolution_type optional)
   - Incorporates auto memory excerpts (if provided by the orchestrator) as supplementary evidence
   - Reads `references/yaml-schema.md` for category mapping into `docs/solutions/`
   - Suggests a filename using the pattern `[sanitized-problem-slug]-[date].md`
   - Returns: YAML frontmatter skeleton (must include `category:` field mapped from problem_type), category directory path, suggested filename, and which track applies
   - Does not invent enum values, categories, or frontmatter fields from memory; reads the schema and mapping files above
   - Does not force bug-track fields onto knowledge-track learnings or vice versa

#### 2. **Solution Extractor**
   - Reads `references/schema.yaml` for track classification (bug vs knowledge)
   - Adapts output structure based on the problem_type track
   - Incorporates auto memory excerpts (if provided by the orchestrator) as supplementary evidence -- conversation history and the verified fix take priority; if memory notes contradict the conversation, note the contradiction as cautionary context

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
   - **Assesses overlap** with the new doc being created across five dimensions: problem statement, root cause, solution approach, referenced files, and prevention rules. Score as:
     - **High**: 4-5 dimensions match — essentially the same problem solved again
     - **Moderate**: 2-3 dimensions match — same area but different angle or solution
     - **Low**: 0-1 dimensions match — related but distinct
   - Returns: Links, relationships, refresh candidates, and overlap assessment (score + which dimensions matched)

   **Search strategy (grep-first filtering for efficiency):**

   1. Extract keywords from the problem context: module names, technical terms, error messages, component types
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

</parallel_tasks>

#### 4. **Session History Enrichment** (foreground, after launching the above — only if the user opted in)
   - **Skip entirely** if the user declined session history in the follow-up question
   - Invoke `spec-sessions`; it owns discovery, filtering, scratch extraction, and `spec-session-historian` synthesis dispatch
   - Run in **foreground** because it reads session files outside the working directory (`~/.claude/projects/`, `~/.codex/sessions/`, `~/.agents/sessions/`) which background agents may not have access to
   - Searches prior Claude Code and Codex sessions for the same project to find related investigation context
   - Correlates sessions by repo name across supported platforms (matches sessions from main checkouts, worktrees, and Conductor workspaces)
   - **Invocation prompt — keep tight.** Long, keyword-rich prompts encourage unnecessary widening. Use this shape:
     - **Pre-resolved context**: repo name and current git branch, only if the values resolved cleanly above; otherwise omit and let the agent derive them.
     - **Time window**: explicit `7 days` unless the documented problem clearly spans a longer arc.
     - **Problem topic**: one sentence naming the concrete issue: error message, module name, what broke and how it was fixed. Not a paragraph; not a bullet list of adjacent topics.
     - **Filter rule**: "Only surface findings directly relevant to this specific problem. Ignore unrelated work from the same sessions or branches."
     - **Output schema**:

       ```
       Structure your response with these sections (omit any with no findings):
       - What was tried before
       - What didn't work
       - Key decisions
       - Related context
       ```
   - Do not append additional context blocks, exclusion lists, or topic-keyword bullets. If `spec-sessions` needs keyword search, it owns that decision via the `--keyword` mode on its metadata script.
   - Let `spec-sessions` omit subagent `mode` so the user's configured permission settings apply
   - Returns: structured digest of findings from prior sessions, or `no relevant prior sessions` if none found

### Phase 2: Assembly & Write

<sequential_tasks>

**WAIT for all Phase 1 subagents to complete before proceeding.**

The orchestrating agent (main conversation) performs these steps:

1. Collect all text results from Phase 1 subagents
2. **Check the overlap assessment** from the Related Docs Finder before deciding what to write:

   | Overlap | Action |
   |---------|--------|
   | **High** — existing doc covers the same problem, root cause, and solution | **Update the existing doc** with fresher context (new code examples, updated references, additional prevention tips) rather than creating a duplicate. The existing doc's path and structure stay the same. |
   | **Moderate** — same problem area but different angle, root cause, or solution | **Create the new doc** normally. Flag the overlap for Phase 2.5 to recommend consolidation review. |
   | **Low or none** | **Create the new doc** normally. |

   The reason to update rather than create: two docs describing the same problem and solution will inevitably drift apart. The newer context is fresher and more trustworthy, so fold it into the existing doc rather than creating a second one that immediately needs consolidation.

   When updating an existing doc, preserve its file path and frontmatter structure. Update the solution, code examples, prevention tips, and any stale references. Add a `last_updated: YYYY-MM-DD` field to the frontmatter. Do not change the title unless the problem framing has materially shifted.

3. **Incorporate session history findings** (if available). When the Session History Researcher returned relevant prior-session context:
   - Fold investigation dead ends and failed approaches into the **What Didn't Work** section (bug track) or **Context** section (knowledge track)
   - Use cross-session patterns to enrich the **Prevention** or **Why This Matters** sections
   - Tag session-sourced content with "(session history)" so its origin is clear to future readers
   - If findings are thin or "no relevant prior sessions," proceed without session context
4. Assemble complete markdown file from the collected pieces, reading `assets/resolution-template.md` for the section structure of new docs
5. Validate YAML frontmatter against `references/schema.yaml`, including new promote required fields (`invalidation_condition`, `source_refs`) for newly promoted solution docs and the YAML-safety quoting rule for array items (see `references/yaml-schema.md` > YAML Safety Rules)
6. Create directory if needed: `mkdir -p docs/solutions/[category]/`
7. Write the file: either the updated existing doc or the new `docs/solutions/[category]/[filename].md`
8. **Run `python3 scripts/validate-frontmatter.py <output-path>`** from the `skills/spec-compound/` directory to catch parser-safety issues the prose rules can miss: malformed `---` delimiter lines, unquoted ` #` in scalar values, and unquoted `: ` in scalar values. Exit 0 means the doc is parser-safe; exit 1 means stderr names the field(s) to quote or fix. Re-write the doc and re-run until exit 0. Do not declare success while validation fails. The script is pure Python 3 stdlib and does not enforce schema required fields or enum values. If `python3` is unavailable or the script cannot be located from the skill runtime directory, do not silently skip: state `validator unavailable: <reason>` and manually verify the same scope the script covers — the frontmatter opens and closes with exact `---` lines, and no unquoted top-level scalar value contains ` #` (YAML drops it as a comment) or `: ` (parsers may read it as a nested mapping). Quote offending values. Keep the manual check to exactly these three; do not expand into schema, enum, or style edits.

When creating a new doc, preserve the section order from `assets/resolution-template.md` unless the user explicitly asks for a different structure.

</sequential_tasks>

### Phase 2.4: Domain Model And Vocabulary Capture

After the learning is written or updated, run a scoped Domain Model Capture scan for the solved lesson's vocabulary and decision signals.

- If the lesson exposes project-specific terms, confusing aliases, boundary scenarios, code/doc contradictions, or a hard decision candidate, read `references/domain-model-capture.md` and apply its four actions: glossary challenge, fuzzy term sharpening, scenario stress, and code cross-reference.
- Fold source-confirmed boundary scenarios, contradictions, rationale, and rejected alternatives into the solution doc first. The primary output remains one `docs/solutions/` learning document; do not add a second primary artifact or new frontmatter schema field for domain capture.
- If `CONCEPTS.md` exists, read `references/concepts-vocabulary.md`, scan the new learning plus the source-confirming context for qualifying project-specific terms, and add or refine only those entries.
- If `CONCEPTS.md` does not exist, do not create or bootstrap it from `spec-compound`. Record `CONCEPTS.md: not present; no vocabulary maintenance applied` and continue.
- Keep the scan scoped to the new learning's vocabulary neighborhood. Do not run a repo-wide concept sweep, do not seed core nouns outside the solved problem area, and do not add `(see CONCEPTS.md)` pointers to learning docs.
- If the reference criteria produce no qualifying terms, record `CONCEPTS.md: scanned, no qualifying terms` rather than silently skipping the step.
- If `CONTEXT.md` or `CONTEXT-MAP.md` already exists and is directly relevant, it may be read as advisory vocabulary evidence. Do not create, bootstrap, or edit `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/**` from an ordinary compound run.
- Report context or ADR follow-ups as preview-first candidates only. An ADR candidate must satisfy all three conditions from `references/domain-model-capture.md`: hard to reverse, surprising without context, and real tradeoff. If any condition is missing, keep the rationale in the solution doc.

Domain model and vocabulary capture is advisory maintenance. It must not turn `CONCEPTS.md` into a PRD, ADR, workflow contract, source-of-truth override, setup requirement, or mandatory downstream project file. It must not make context topology or ADR files a completion gate for projects that have not adopted them.

### Phase 2.5: Selective Refresh Check

After writing the new learning, decide whether this new solution is evidence that older docs should be refreshed.

`spec-compound-refresh` is **not** a default follow-up. Use it selectively when the new learning suggests an older learning or pattern doc may now be inaccurate.

It makes sense to invoke `spec-compound-refresh` when one or more of these are true:

1. A related learning or pattern doc recommends an approach that the new fix now contradicts
2. The new fix clearly supersedes an older documented solution
3. The current work involved a refactor, migration, rename, or dependency upgrade that likely invalidated references in older docs
4. A pattern doc now looks overly broad, outdated, or no longer supported by the refreshed reality
5. The Related Docs Finder surfaced high-confidence-first refresh candidates in the same problem space
6. The Related Docs Finder reported **moderate overlap** with an existing doc — there may be consolidation opportunities that benefit from a focused review

It does **not** make sense to invoke `spec-compound-refresh` when:

1. No related docs were found
2. Related docs still appear consistent with the new learning
3. The overlap is superficial and does not change prior guidance
4. Refresh would require a broad historical review with weak evidence

Use these rules:

- If there is **one obvious stale candidate**, invoke `spec-compound-refresh` with a narrow scope hint after the new learning is written
- If there are **multiple candidates in the same area**, ask the user whether to run a targeted refresh for that module, category, or pattern set
- If context is already tight or you are in lightweight mode, do not expand into a broad refresh automatically; instead recommend `spec-compound-refresh` as the next step with a scope hint

When invoking or recommending `spec-compound-refresh`, be explicit about the argument to pass. Prefer the narrowest useful scope:

- **Specific file** when one learning or pattern doc is the likely stale artifact
- **Module or component name** when several related docs may need review
- **Category name** when the drift is concentrated in one solutions area
- **Pattern filename or pattern topic** when the stale guidance lives in `docs/solutions/patterns/`

Examples:

- `spec-compound-refresh plugin-versioning-requirements`
- `spec-compound-refresh payments`
- `spec-compound-refresh performance-issues`
- `spec-compound-refresh critical-patterns`

A single scope hint may still expand to multiple related docs when the change is cross-cutting within one domain, category, or pattern area.

Do not invoke `spec-compound-refresh` without an argument unless the user explicitly wants a broad sweep.

Always capture the new learning first. Refresh is a targeted maintenance follow-up, not a prerequisite for documentation.

### Discoverability Check

After the learning is written and the refresh decision is made, check whether the project's instruction files would lead an agent to discover and search `docs/solutions/` before starting work in a documented area. This runs every time — the knowledge store only compounds value when agents can find it.

1. Identify which root-level instruction files exist (AGENTS.md, CLAUDE.md, or both). Read the file(s) and determine which holds the substantive content — one file may just be a shim that `@`-includes the other (e.g., `CLAUDE.md` containing only `@AGENTS.md`, or vice versa). The substantive file is the assessment and edit target; ignore shims. If neither file exists, skip this check entirely.
2. Assess whether an agent reading the instruction files would learn three things:
   - That a searchable knowledge store of documented solutions exists
   - Enough about its structure to search effectively (category organization, YAML frontmatter fields like `module`, `tags`, `problem_type`)
   - When to search it (before implementing features, debugging issues, or making decisions in documented areas — learnings may cover bugs, best practices, workflow patterns, or other institutional knowledge)

   This is a semantic assessment, not a string match. The information could be a line in an architecture section, a bullet in a gotchas section, spread across multiple places, or expressed without ever using the exact path `docs/solutions/`. Use judgment — if an agent would reasonably discover and use the knowledge store after reading the file, the check passes.

3. If the spirit is already met, no action needed — move on.
4. If not:
   a. Based on the file's existing structure, tone, and density, identify where a mention fits naturally. Before creating a new section, check whether the information could be a single line in the closest related section — an architecture tree, a directory listing, a documentation section, or a conventions block. A line added to an existing section is almost always better than a new headed section. Only add a new section as a last resort when the file has clear sectioned structure and nothing is even remotely related.
   b. Draft the smallest addition that communicates the three things. Match the file's existing style and density. The addition should describe the knowledge store itself, not the plugin — an agent without the plugin should still find value in it.

      Keep the tone informational, not imperative. Express timing as description, not instruction — "relevant when implementing or debugging in documented areas" rather than "check before implementing or debugging." Imperative directives like "always search before implementing" cause redundant reads when a workflow already includes a dedicated search step. The goal is awareness: agents learn the folder exists and what's in it, then use their own judgment about when to consult it.

      Examples of calibration (not templates — adapt to the file):

      When there's an existing directory listing or architecture section — add a line:
      ```
      docs/solutions/  # documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (module, tags, problem_type)
      ```

      When nothing in the file is a natural fit — a small headed section is appropriate:
      ```
      ## Documented Solutions

      `docs/solutions/` — documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in documented areas.
      ```
   c. In full mode, explain to the user why this matters — agents working in this repo (including fresh sessions, other tools, or collaborators without the plugin) won't know to check `docs/solutions/` unless the instruction file surfaces it. Show the proposed change and where it would go, then use the platform's blocking question tool to get consent before making the edit: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded) or `request_user_input` in Codex. Fall back to presenting the proposal in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question. In lightweight mode, output a one-liner note and move on

5. If this compound run added or refined entries in an existing repo-root `CONCEPTS.md`, or the user explicitly asked for vocabulary discoverability maintenance, run a parallel discoverability check for it. Assess whether the substantive instruction file would lead an agent to discover the repo-local advisory vocabulary. Use the same edit-placement and consent flow as the `docs/solutions/` check. Skip this step when `CONCEPTS.md` does not exist or when the Phase 2.4 result was only `scanned, no qualifying terms`; do not nag for an artifact the project has not adopted and do not create instruction-file churn for a no-op vocabulary scan.

### Phase 3: Optional Enhancement

**WAIT for Phase 2 to complete before proceeding.**

<parallel_tasks>

Based on problem type, optionally invoke specialized agents to review the documentation:

- **performance_issue** → `spec-performance-oracle`
- **security_issue** → `spec-security-sentinel`
- **database_issue** → `spec-data-integrity-guardian`
- Any code-heavy issue → always run `spec-code-simplicity-reviewer`, and additionally run the kieran reviewer that matches the repo's primary stack:
  - Ruby/Rails → also run `spec-kieran-rails-reviewer`
  - Python → also run `spec-kieran-python-reviewer`
  - TypeScript/JavaScript → also run `spec-kieran-typescript-reviewer`
  - Other stacks → no kieran reviewer needed

</parallel_tasks>

---

### Lightweight Mode

<critical_requirement>
**Single-pass alternative — same documentation, fewer tokens.**

This mode skips parallel subagents entirely. The orchestrator performs all work in a single pass, producing the same solution document without cross-referencing or duplicate detection.
</critical_requirement>

The orchestrator (main conversation) performs ALL of the following in one sequential pass:

1. **Extract from conversation**: Identify the problem and solution from conversation history. Also scan the "user's auto-memory" block injected into your system prompt, if present (Claude Code only) -- use any relevant notes as supplementary context alongside conversation history. Tag any memory-sourced content incorporated into the final doc with "(auto memory [claude])"
2. **Classify**: Read `references/schema.yaml` and `references/yaml-schema.md`, then determine track (bug vs knowledge), category, and filename
3. **Write minimal doc**: Create `docs/solutions/[category]/[filename].md` using the appropriate track template from `assets/resolution-template.md`, with:
   - YAML frontmatter with track-appropriate fields, applying the YAML-safety quoting rule for array items (see `references/yaml-schema.md` > YAML Safety Rules)
   - New promote required fields: `invalidation_condition` and `source_refs`
   - Bug track: Problem, root cause, solution with key code snippets, one prevention tip
   - Knowledge track: Context, guidance with key examples, one applicability note
4. **Domain model and vocabulary capture (solution-first, update-only)**: if the new doc exposes project-specific terms, confusing aliases, boundary scenarios, code/doc contradictions, or an ADR-worthy hard decision candidate, read `references/domain-model-capture.md` and fold qualifying source-confirmed signals into the learning. If `CONCEPTS.md` exists at repo root, read `references/concepts-vocabulary.md`, scan the new doc and source-confirming context for qualifying terms, and add or refine entries using the same criteria as Phase 2.4. Do not create or bootstrap `CONCEPTS.md`, `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/**` in lightweight mode. Record the outcome in the output, such as `Domain model capture: folded into learning`, `CONCEPTS.md: updated — 1 refined`, `CONCEPTS.md: scanned, no qualifying terms`, or `CONCEPTS.md: not present; no vocabulary maintenance applied`.
5. **Skip specialized agent reviews** (Phase 3) to conserve context

**Lightweight output:**
```
✓ Documentation complete (lightweight mode)

File created:
- docs/solutions/[category]/[filename].md

Domain model capture: <scanned, no qualifying signals | folded into learning | context/ADR preview candidates reported>

CONCEPTS.md: <updated — N added/refined | scanned, no qualifying terms | not present; no vocabulary maintenance applied>

Context/ADR candidates: <none | preview only — path/reason/evidence>

[If discoverability check found instruction files don't surface the knowledge store:]
Tip: Your AGENTS.md/CLAUDE.md doesn't surface docs/solutions/ to agents —
a brief mention helps all agents discover these learnings.

[If CONCEPTS.md was refined and isn't surfaced in the instruction files:]
Tip: Your AGENTS.md/CLAUDE.md doesn't surface CONCEPTS.md —
a one-line mention helps agents find the shared advisory vocabulary.

Note: This was created in lightweight mode. For richer documentation
(cross-references, detailed prevention strategies, specialized reviews),
re-run the current host's compound entrypoint in a fresh session.
```

**No subagents are launched. No parallel tasks. One primary solution doc is written; optional maintenance writes may update an existing `CONCEPTS.md` or a project instruction file under the documented rules. Context and ADR outputs are preview-only candidates unless the user explicitly scopes a separate follow-up.**

In lightweight mode, the overlap check is skipped (no Related Docs Finder subagent). This means lightweight mode may create a doc that overlaps with an existing one. That is acceptable — `spec-compound-refresh` will catch it later. Only suggest `spec-compound-refresh` if there is an obvious narrow refresh target. Do not broaden into a large refresh sweep from a lightweight session.

---

## What It Captures

- **Problem symptom**: Exact error messages, observable behavior
- **Investigation steps tried**: What didn't work and why
- **Root cause analysis**: Technical explanation
- **Working solution**: Step-by-step fix with code examples
- **Prevention strategies**: How to avoid in future
- **Cross-references**: Links to related issues and docs

## Preconditions

<preconditions enforcement="advisory">
  <check condition="problem_solved">
    Problem has been solved (not in-progress)
  </check>
  <check condition="solution_verified">
    Solution has been verified working
  </check>
  <check condition="non_trivial">
    Non-trivial problem (not simple typo or obvious error)
  </check>
</preconditions>

## What It Creates

**Organized documentation:**

- File: `docs/solutions/[category]/[filename].md`

**Categories auto-detected from problem:**

Bug track:
- build-errors/
- test-failures/
- runtime-errors/
- performance-issues/
- database-issues/
- security-issues/
- ui-bugs/
- integration-issues/
- logic-errors/

Knowledge track:
- architecture-patterns/ — architectural or structural patterns (agent/skill/pipeline/workflow shape decisions)
- design-patterns/ — reusable non-architectural design approaches (content generation, interaction patterns, prompt shapes)
- tooling-decisions/ — language, library, or tool choices with durable rationale
- conventions/ — team-agreed way of doing something, captured so it survives turnover
- workflow-issues/
- developer-experience/
- documentation-gaps/
- best-practices/ — fallback only, use when no narrower knowledge-track value applies

## Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| Subagents write files like `context-analysis.md`, `solution-draft.md` | Subagents return text data; orchestrator writes one final file |
| Research and assembly run in parallel | Research completes → then assembly runs |
| Multiple files created during workflow | One solution doc written or updated: `docs/solutions/[category]/[filename].md` (plus optional maintenance writes: update-only `CONCEPTS.md` refinement when the file already exists, and a small project instruction-file edit for discoverability). Context and ADR follow-ups are preview-only candidates, not default writes |
| Creating a new doc when an existing doc covers the same problem | Check overlap assessment; update the existing doc when overlap is high |

## Success Output

```
✓ Documentation complete

Auto memory: 2 relevant entries used as supplementary evidence

Subagent Results:
  ✓ Context Analyzer: Identified performance_issue in brief_system, category: performance-issues/
  ✓ Solution Extractor: 3 code fixes, prevention strategies
  ✓ Related Docs Finder: 2 related issues
  ✓ Session History: 3 prior sessions on same branch, 2 failed approaches surfaced

Specialized Agent Reviews (Auto-Triggered):
  ✓ spec-performance-oracle: Validated query optimization approach
  ✓ spec-kieran-rails-reviewer: Code examples meet Rails conventions
  ✓ spec-code-simplicity-reviewer: Solution is appropriately minimal

File created:
- docs/solutions/performance-issues/n-plus-one-brief-generation.md

Domain model capture: <scanned, no qualifying signals | folded into learning | context/ADR preview candidates reported>
CONCEPTS.md: <updated — N added/refined | scanned, no qualifying terms | not present; no vocabulary maintenance applied>
Context/ADR candidates: <none | preview only — path/reason/evidence>

This documentation will be searchable for future reference when similar
issues occur in the Email Processing or Brief System modules.

What's next?
1. Continue workflow (recommended)
2. Link related documentation
3. Update other references
4. View documentation
5. Other
```

**After displaying the success output, present the "What's next?" options using the platform's blocking question tool:** `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded) or `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question. Do not continue the workflow or end the turn without the user's selection.

**Alternate output (when updating an existing doc due to high overlap):**

```
✓ Documentation updated (existing doc refreshed with current context)

Overlap detected: docs/solutions/performance-issues/n-plus-one-queries.md
  Matched dimensions: problem statement, root cause, solution, referenced files
  Action: Updated existing doc with fresher code examples and prevention tips

File updated:
- docs/solutions/performance-issues/n-plus-one-queries.md (added last_updated: 2026-03-24)

Domain model capture: <scanned, no qualifying signals | folded into learning | context/ADR preview candidates reported>
CONCEPTS.md: <updated — N added/refined | scanned, no qualifying terms | not present; no vocabulary maintenance applied>
Context/ADR candidates: <none | preview only — path/reason/evidence>
```

## The Compounding Philosophy

This creates a compounding knowledge system:

1. First time you solve "N+1 query in brief generation" → Research (30 min)
2. Document the solution → docs/solutions/performance-issues/n-plus-one-briefs.md (5 min)
3. Next time similar issue occurs → Quick lookup (2 min)
4. Knowledge compounds → Team gets smarter

The feedback loop:

```
Build → Test → Find Issue → Research → Improve → Document → Validate → Deploy
    ↑                                                                      ↓
    └──────────────────────────────────────────────────────────────────────┘
```

**Each unit of engineering work should make subsequent units of work easier—not harder.**

## Auto-Invoke

<auto_invoke> <trigger_phrases> - "that worked" - "it's fixed" - "working now" - "problem solved" </trigger_phrases>

<manual_override> Use the current host's compound entrypoint with the context to document immediately without waiting for auto-detection. </manual_override> </auto_invoke>

## Output

Writes the final learning directly into `docs/solutions/`.

## Applicable Specialized Agents

Based on problem type, these agents can enhance documentation:

### Code Quality & Review
- **spec-kieran-rails-reviewer**: Reviews code examples for Rails best practices
- **spec-kieran-python-reviewer**: Reviews code examples for Python best practices
- **spec-kieran-typescript-reviewer**: Reviews code examples for TypeScript best practices
- **spec-code-simplicity-reviewer**: Ensures solution code is minimal and clear
- **spec-pattern-recognition-specialist**: Identifies anti-patterns or repeating issues

### Specific Domain Experts
- **spec-performance-oracle**: Analyzes performance_issue category solutions
- **spec-security-sentinel**: Reviews security_issue solutions for vulnerabilities
- **spec-data-integrity-guardian**: Reviews database_issue migrations and queries

### Enhancement & Research
- **spec-best-practices-researcher**: Enriches solution with industry best practices
- **spec-framework-docs-researcher**: Links to framework/library documentation references

### When to Invoke
- **Auto-triggered** (optional): Agents can run post-documentation for enhancement
- **Manual trigger**: User can invoke agents after `spec-compound` completes for deeper review

## Related Commands

- Research skills - Deep investigation (searches docs/solutions/ for patterns)
- Current host's plan entrypoint - Planning workflow (references documented solutions)
