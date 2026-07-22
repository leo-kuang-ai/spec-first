---
name: spec-compound
description: Document a recently solved problem or durable project vocabulary in docs/solutions/ or CONCEPTS.md. Use when capturing a learning after work.
argument-hint: "[optional: brief context] [mode:headless] "
---

# spec-compound

Document a recently solved problem through role-based research; use parallel subagents only when dispatch is explicitly authorized and callable, otherwise run the same roles inline or serially.

## Purpose

Captures problem solutions while context is fresh, creating structured documentation in `docs/solutions/` with YAML frontmatter for searchability and future reference. Authorized dispatch can parallelize read-only research; correctness does not depend on it.

**Why "compound"?** Each documented solution compounds your team's knowledge. The first time you solve a problem takes research. Document it, and the next occurrence takes minutes. Knowledge compounds.

## Workflow Contract Summary

- **输入：** 一个最近解决且已有可回源验证的单一问题，或该问题带来的 durable project vocabulary。
- **输出：** `docs/solutions/` 下带 provenance、适用范围与失效条件的 learning，以及必要时对 `CONCEPTS.md` 的局部补充。
- **硬出口：** 问题尚未解决、验证证据不足、一次请求包含多个独立 learning、目标 repo/source owner 不明确，或 promotion gate 不满足时不得写入 durable knowledge。
- **权威：** 当前 source/test/log 和已验证 outcome 决定可沉淀事实；LLM 判断复用价值；只有 orchestrator 可写知识资产，dispatch 不授予 mutation。
- **消费者：** 后续 `spec-plan`、`spec-work`、`spec-debug`、`spec-code-review` 与项目维护者。

## Usage

```bash
spec-compound                            # Document the most recent fix
spec-compound [brief context]            # Provide additional context hint
spec-compound mode:headless              # Non-interactive run for automations
spec-compound mode:headless [context]    # Non-interactive run with context hint
```

**One learning per run.** The workflow's grounding, overlap detection, and cross-referencing all assume a single solved problem. When a session produced multiple distinct learnings, run the skill once per learning, sequentially — each run grounds fresh against the tree. Do not batch several learnings through one run and stitch cross-references between the drafts afterward; drafting-context numbering ("Learning 3") leaking into written docs is the failure this rule prevents.

## CONCEPTS.md bootstrap requests

If invoked specifically to create or bootstrap `CONCEPTS.md` from scratch rather than to document a solved problem, do not run the normal phases — `spec-compound` populates `CONCEPTS.md` only as a side effect of documenting a real learning (it seeds the *learning's area*, not the whole repo; see Phase 2.4). Repo-wide concept-map creation is `spec-compound-refresh`'s job. Redirect a standalone bootstrap request to `spec-compound-refresh` (which asks whether to build the concept map or run a refresh cycle), then exit.

## Mode Detection

Check `$ARGUMENTS` for a `mode:headless` token. Tokens starting with `mode:` are flags, not context — strip `mode:headless` from arguments before treating the remainder as the brief context hint.

| Mode | When | Behavior |
|------|------|----------|
| **Interactive** (default) | No mode token present | Auto-pick Full vs Lightweight and report the choice; run session history as an automatic probe (Full only); prompt for Discoverability Check consent; end with a plain summary (no "What's next?" menu) |
| **Headless** | `mode:headless` in arguments | No blocking questions. Run **Full mode without session history**. Apply the Discoverability Check edit silently if a gap exists. Skip Phase 3 specialized reviews. End with a structured terminal report — no "What's next?" menu. |

Headless mode is intended for automations and skill-to-skill invocation where no human is present to answer questions. The doc itself is identical to what an interactive Full run would produce — classification work (track, category, overlap) follows the same rules and writes nothing extra into the artifact. Once detected, headless mode applies for the entire run.

## Pre-resolved context

**Git branch (pre-resolved):** !`git rev-parse --abbrev-ref HEAD`

If the line above resolved to a plain branch name (like `feat/my-branch`), use it in Phase 1 session-history filtering so the orchestrator does not waste a turn deriving it. If it still contains a backtick command string, shows an error, or is empty, derive the branch at runtime.

**Repo root (pre-resolved):** !`git rev-parse --show-toplevel`

If the line above resolved to an absolute path, use it as the session-history repo filter in Phase 1. If it still contains a backtick command string, shows an error, or is empty, derive the repo root at runtime with the shell tool (`git rev-parse --show-toplevel`, falling back to the working directory outside a git repo).

## Support Files

These files are the durable contract for the workflow. Read them on-demand at the step that needs them — do not bulk-load at skill start.

- `references/schema.yaml` — canonical frontmatter fields and enum values (read when validating YAML)
- `references/yaml-schema.md` — category mapping from problem_type to directory (read when classifying)
- `references/concepts-vocabulary.md` — CONCEPTS.md format and inclusion rules (read in Phase 2.4 when domain terms surface)
- `references/agents/session-historian.md` — skill-local synthesis prompt for optional session-history compounding context (read only when the user opts into session history)
- `references/grounding-validation.md` — grounding-validation protocol: flag adjudication rules and the semantic validator prompt (read in Phase 2.45)
- `assets/resolution-template.md` — section structure for new docs (read when assembling)
- `scripts/session-history/` — session discovery and extraction scripts copied into this skill so session-history support does not depend on the bundled session-history support
- `scripts/validate-frontmatter.py` — frontmatter parser-safety validator plus the opt-in `--promotion` exit gate for provenance/invalidation (run in Phase 2 step 8 through the existence guard documented there; resolves via the loaded skill directory anchor `SKILL_DIR`, with a manual-checklist fallback elsewhere)
- `scripts/validate-doc-claims.py` — mechanical claims validator: cited paths, commit SHAs, relative links, dangling drafting scaffold (run in Phase 2.45 via the `SKILL_DIR` anchor)

When spawning subagents, pass the relevant file contents into the task prompt so they have the contract without needing cross-skill paths.

## Dispatch Authorization Boundary

在派发 repo profiler、research role、session-history synthesizer、semantic validator 或 specialized reviewer 前，记录：

```yaml
worker_dispatch_authorization: authorized | missing
worker_dispatch_capability: available | missing
```

`workflow invocation does not authorize dispatch`。Full/headless mode、上下文预算、scratch directory、权限设置或 prompt asset 存在都不构成授权。只有当前用户或可见 upstream handoff 明确请求 subagent、delegated work、persona 或 parallel work 时才可派发。缺授权时依次 inline 或 serial 执行相同 role prompts 并记录 `dispatch_authorization_missing`；已有授权但没有 callable worker primitive 时使用同一 fallback 并记录 `subagent_capability_missing`。Fallback 保留 Context Analyzer、Solution Extractor、Related Docs Finder 等角色合同，但不得声称 independent subagent、fresh-context 或 parallel coverage。无论哪种路径，只有 orchestrator 可以写 `docs/solutions/`、`CONCEPTS.md`、instruction files 或任何 tracked path。

## Execution Strategy

`spec-compound` does not ask the user which mode to run or whether to search session history. Both are decisions the agent is better positioned to make: mode depends on context budget the agent can observe, and session-history value is unknowable a priori to *either* party (the payoff is an unrelated earlier session the current agent was never in), so it is resolved by a cheap probe rather than a question. The only interactive prompt in the whole workflow is the Discoverability Check consent, because that one edits a tracked instruction file.

**Mode selection (Full vs Lightweight) — decide it, don't ask it.**

- Default to **Full**: the complete workflow (research, cross-referencing, overlap detection, grounding validation). This is the right choice for essentially every documented learning — its token cost is small next to the engineering work that produced the learning and is dwarfed by the value of a doc that compounds.
- Choose **Lightweight** (single-pass, no subagents — see Lightweight Mode) ONLY under real context pressure: the session is near its context limit, or the fix is trivial enough that cross-referencing would add nothing. These are conditions the agent can observe and the user cannot, which is exactly why this is not a question.
- State the chosen mode and a one-line reason as the first line of the completion output (e.g., "Ran Full mode." / "Ran Lightweight mode — session context was tight."). If Lightweight was the wrong call for the user's taste, re-running is a rare, cheap correction — cheaper than taxing every run with a prompt.

**In headless mode**, skip mode selection entirely and run **Full Mode** with session history disabled (Phase 1 step 4 omitted). Headless does not elevate dispatch authority; when the package-local boundary is not satisfied, proceed through the serial inline Full fallback.

**Session history — an automatic probe in Full mode, never a question.** The point of searching prior sessions is that an *unrelated* earlier session may hold related problem-solving; neither the agent nor the user can know that a priori, so asking is pointless. Instead, Full mode always runs the cheap discovery+metadata probe (Phase 1 step 4) — it runs in parallel with the research subagents, so it is near-free on wall-clock — and escalates to the expensive extraction+synthesis only when the probe surfaces genuinely relevant candidate sessions. Lightweight and headless modes skip session history entirely. There is no standalone `session-history` product surface; this support exists only inside the compounding workflow.

---

### Full Mode

<critical_requirement>
**The primary deliverable is ONE file - the final documentation.**

When dispatch is authorized, Phase 1 subagents write their full structured output to a per-run scratch artifact under `/tmp/spec-first/spec-compound/<run-id>/` and return only a compact confirmation containing the artifact path. In inline fallback, the orchestrator runs the same roles serially and writes the same scratch artifacts itself. Phase 2 reads those artifacts in either path. This scratch space does not make the files additional deliverables. **Only the orchestrator writes product files** — the final solution doc and the maintenance side effects below. Subagents must not touch `docs/`, project instruction files, or any tracked path. Beyond the Phase 2 solution doc, the orchestrator's other writes are maintenance side effects — not additional deliverables, and creating one when absent is expected, not a violation of this rule:
- **`CONCEPTS.md`** — create or update in Phase 2.4 (Vocabulary Capture) when a qualifying domain term surfaces.
- **A project instruction file** (AGENTS.md or CLAUDE.md) — a small edit when the Discoverability Check finds a gap.

Both ensure future agents can discover and ground in the knowledge store; neither makes the documentation any less the single deliverable.

**Why the scratch artifact (issue #956):** a subagent asked to return a long prose body as its inline response intermittently returns an executive summary instead ("Doc body complete — six sections filled. Returning above."), and the original prose is then unrecoverable from the orchestrator side. Writing to disk first means the full output always survives; the inline confirmation is just a pointer, and the orchestrator falls back to whatever the subagent did return inline only when the artifact is missing.
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

Run the research roles. When the Dispatch Authorization Boundary is satisfied, launch research subagents and have each write its full output to a per-run scratch artifact. Otherwise execute Context Analyzer, Solution Extractor, and Related Docs Finder serially inline, writing their run-local scratch artifacts from the orchestrator so Phase 2 keeps the same input contract.

**Run ID and run dir (before dispatching any subagent):** generate a unique run identifier and create the run directory. This scopes every Phase 1 artifact file to the same directory so the orchestrator can Read them back in Phase 2.

```bash
RUN_ID=$(date +%Y%m%d-%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
mkdir -p "/tmp/spec-first/spec-compound/$RUN_ID"
```

**Resolve the agnostic project orientation from the shared cache (before dispatching subagents).** The question-agnostic orientation the Context Analyzer and Related Docs Finder rely on — the project's `CONCEPTS.md` vocabulary and the root instruction-file conventions/digests — is identical for every run at this commit, so reuse it instead of re-deriving. Set `SKILL_DIR` to this skill's directory and run the helper (full protocol in `references/repo-profile-cache.md`):

```bash
SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
python3 "$SKILL_DIR/scripts/repo-profile-cache.py" get
```

- On `HIT`: load the profile JSON and use its `vocabulary` (CONCEPTS canonical terms) and `conventions` (root instruction/convention digests) as the agnostic orientation; do not re-derive them.
- On `MISS`: dispatch a generic subagent seeded with `references/agents/repo-profiler.md` only when the package-local boundary permits it; otherwise derive the profile inline and record the matching fallback reason. Persist the resulting JSON with `python3 "$SKILL_DIR/scripts/repo-profile-cache.py" put <file>` when a usable file exists (re-set `SKILL_DIR` in that call — shell vars don't persist between Bash invocations).
- On `NO-CACHE` (no git repo or no writable cache): derive the orientation inline this run and skip `put`.

The cache is an optimization, never a correctness dependency — if the helper errors or returns nothing usable, fall back to deriving the orientation inline and continue. Pass the resolved vocabulary/conventions into the Context Analyzer (for vocabulary and instruction-file convention grounding) so it does not re-derive them.

**CRITICAL — the `docs/solutions/` enumeration is NEVER cached; the Related Docs Finder must glob it FRESH every run.** `spec-compound` *writes* new learnings into `docs/solutions/`, so a cached index would miss a doc added moments ago (even an uncommitted one). The cached profile supplies only the agnostic orientation above; the `docs/solutions/` search in step 3 always runs against the live tree.

Pass `{run_id}` (the resolved `$RUN_ID` value) into every Phase 1 subagent prompt. Each subagent **writes its full structured output** to its own file under `/tmp/spec-first/spec-compound/{run_id}/`, **confirms the write succeeded** (the file exists and is non-empty), and then **returns only a one-line confirmation containing the artifact path** — not the prose body inline. Artifact filenames by subagent:

- **Context Analyzer** → `/tmp/spec-first/spec-compound/{run_id}/context.json` (frontmatter skeleton, category path, filename, track)
- **Solution Extractor** → `/tmp/spec-first/spec-compound/{run_id}/solution.md` (the full doc-body prose sections)
- **Related Docs Finder** → `/tmp/spec-first/spec-compound/{run_id}/related.json` (links, refresh candidates, overlap assessment)
- **Session History** synthesis subagent (when run) → `/tmp/spec-first/spec-compound/{run_id}/session-history.md` (prose findings)

**Return the full output inline whenever the artifact write did not succeed.** This covers both cases where the orchestrator's Phase 2 inline fallback would otherwise have nothing to read: (a) `{run_id}` is empty or did not resolve (non-Claude-Code platforms where the pre-resolution failed), so there is no path to write to; and (b) `{run_id}` resolved but the write itself failed — tool permission denied, absolute-path writes unavailable, disk error, or the post-write existence check came back empty. In either case the subagent must return its complete structured output inline instead of a path, because the path would point at a file that does not exist. Return only the bare path when — and only when — the write is confirmed on disk. The artifact pattern is a reliability improvement, not a hard requirement; the orchestrator handles a missing artifact in Phase 2 by using the inline return.

**Execution order:**
- With authorized dispatch, launch `Context Analyzer`, `Solution Extractor`, and `Related Docs Finder` in bounded parallel. Without it, run the same roles serially inline and preserve their separate artifacts/results without presenting them as independent agents.
- **Then** run the internal session-history discovery/extraction/synthesis flow (see step 4 below) in Full mode — skipped in lightweight and headless. Its cheap discovery+metadata probe always runs and escalates only on a relevance hit. With authorized background dispatch it overlaps the research roles; in inline fallback it runs after the three serial research roles so one orchestrator does not interleave several context-heavy jobs.

### Research roles

#### 1. **Context Analyzer**
   - Extracts conversation history
   - Reads `references/schema.yaml` for enum validation and **track classification**
   - Determines the track (bug or knowledge) from the problem_type
   - Identifies problem type, component, and track-appropriate fields:
     - **Bug track**: symptoms, root_cause, resolution_type
     - **Knowledge track**: applies_when (symptoms/root_cause/resolution_type optional)
   - Incorporates auto memory excerpts (if provided by the orchestrator) as supplementary evidence
   - Reads `references/yaml-schema.md` for category mapping into `docs/solutions/`
   - Suggests a filename using the pattern `[sanitized-problem-slug].md` — no date suffix, even if existing files in the target directory have one; the `date:` frontmatter field is the canonical creation date
   - Writes to `context.json`: YAML frontmatter skeleton (must include `category:` plus the promotion exit fields `source_refs:` and `invalidation_condition:`), category directory path, suggested filename, and which track applies. Returns only the artifact path.
   - Does not invent enum values, categories, or frontmatter fields from memory; reads the schema and mapping files above
   - Does not force bug-track fields onto knowledge-track learnings or vice versa

#### 2. **Solution Extractor**
   - Reads `references/schema.yaml` for track classification (bug vs knowledge)
   - Adapts output structure based on the problem_type track
   - **Writes the full doc-body prose** (all track-appropriate sections below) to `solution.md` and returns only the artifact path. This is the subagent most prone to the issue #956 summary-collapse, so its prose must land on disk rather than only in the inline return.
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
   - **Assesses overlap** with the new doc being created across five dimensions: problem statement, root cause, solution approach, referenced files, and prevention rules. Score as:
     - **High**: 4-5 dimensions match — essentially the same problem solved again
     - **Moderate**: 2-3 dimensions match — same area but different angle or solution
     - **Low**: 0-1 dimensions match — related but distinct
   - Writes to `related.json`: Links, relationships, refresh candidates, and overlap assessment (score + which dimensions matched). Returns only the artifact path.

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

#### 4. **Session History** (internal flow after launching the parallel block — automatic in Full mode)
   - **Skip entirely** in lightweight mode or headless mode. In Full mode it always runs as a two-stage probe: the cheap discovery+metadata pass (below) always executes, and the expensive extraction+synthesis executes only when the probe clears the relevance gate (see **Escalation gate** below).
   - Run session discovery, branch/keyword filtering, scan-window selection, deep-dive selection, and per-session extraction directly inside this skill using `scripts/session-history/`.
   - Read the skill-local synthesis prompt at `references/agents/session-historian.md`, then dispatch a generic subagent using that prompt content. Do not dispatch a standalone agent by type/name.

   **Session-history payload — keep tight.** A long, keyword-rich payload licenses widening. Use this shape:

   - **Pre-resolved context** (only if values resolved cleanly above; otherwise omit): repo name, current git branch.
   - **Time window**: explicit `7 days` unless the documented problem clearly spans a longer arc.
   - **Problem topic**: one sentence naming the concrete issue — error message, module name, what broke and how it was fixed. Not a paragraph; not a bullet list of related topics.
   - **Filter rule (one line)**: "Only surface findings directly relevant to this specific problem. Ignore unrelated work from the same sessions or branches."
   - **Output schema**:

     ```
     Structure your response with these sections (omit any with no findings):
     - What was tried before
     - What didn't work
     - Key decisions
     - Related context
     ```

   Do not append additional context blocks, exclusion lists, or topic-keyword bullets — verbose payloads give the session-history flow license to keep widening the search and rapidly compound wall time. If keyword search is needed, the internal flow owns that decision based on the topic.
   - Returns: structured digest of findings from prior sessions, or "no relevant prior sessions" if none found.
   - **Session history is the final Phase 1 input, not a workflow stop.** When it returns, proceed directly to Phase 2 with its output as the last input — do not emit a summary and do not pause for the user. A "no relevant prior sessions" return is still a valid input; the documentation gets written without session context.

   **Script resolution.** Set `SKILL_DIR` to the absolute path of the directory containing the SKILL.md you just read, and run the bundled scripts from `"$SKILL_DIR/scripts/session-history/"`. Set `SKILL_DIR` inline in each bash block below (shell state does not persist between commands). If the bundled scripts are genuinely not present on disk under `"$SKILL_DIR/scripts/session-history/"`, skip session history visibly with: "Session history bundled scripts were not found in this skill's directory; skipping the session-history probe for this run." Continue Phase 2 without session context.

   **Discovery pipeline.** Infer the scan window from the problem topic, starting with 7 days. Run discovery and metadata extraction:

   ```bash
   SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
   if [ -f "$SKILL_DIR/scripts/session-history/discover-sessions.sh" ] && [ -f "$SKILL_DIR/scripts/session-history/extract-metadata.py" ]; then
     REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
     REPO_NAME=$(basename "$REPO_ROOT")
     SCAN_DAYS="7"
     bash "$SKILL_DIR/scripts/session-history/discover-sessions.sh" "$REPO_NAME" "$SCAN_DAYS" --cwd "$REPO_ROOT" | tr '\n' '\0' | xargs -0 python3 "$SKILL_DIR/scripts/session-history/extract-metadata.py" --cwd-filter "$REPO_ROOT"
   else
     echo "Session history bundled scripts were not found in this skill's directory; skipping the session-history probe for this run."
   fi
   ```

   Pi sessions are included when present under `~/.pi/agent/sessions/`; they carry `cwd` like Codex but no git branch. If `_meta.files_processed` is `0`, return `no relevant prior sessions`. If the first pass finds no relevant branch matches, or if processing Codex or Pi sessions, derive 2-4 keywords from the topic and re-run metadata extraction with `--keyword K1,K2,...`. Keep at most 5 sessions across Claude Code, Codex, Cursor, and Pi, ranked by branch match, keyword match count, file size over 30KB, and recency. Exclude the current session.

   **Escalation gate.** The discovery+metadata pass above is the cheap probe and always runs in Full mode. Escalate to the extraction and synthesis stages below **only** when at least one retained candidate clears the relevance bar: a current-branch match, or ≥2 topic-keyword matches. If no candidate clears the bar (including the `_meta.files_processed` is `0` case), stop here, record `no relevant prior sessions` as the session-history input, and skip extraction and synthesis. This gate is what keeps the always-on probe cheap — the expensive synthesis is paid for only when a prior session is genuinely relevant.

   **Extraction pipeline.** Create `SCRATCH=$(mktemp -d -t spec-compound-sessions-XXXXXX)`. For each selected session, write extracted content to scratch files:

   ```bash
   SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
   if [ -f "$SKILL_DIR/scripts/session-history/extract-skeleton.py" ]; then
     python3 "$SKILL_DIR/scripts/session-history/extract-skeleton.py" --output "$SCRATCH/<session-id>.skeleton.txt" < <session-file>
   else
     echo "Session history bundled scripts were not found in this skill's directory; skipping the session-history probe for this run."
   fi
   ```

   Use `extract-errors.py` selectively when dead ends or recurring errors are likely useful. Pass only the scratch file paths and metadata to the synthesis subagent.

   **Synthesis dispatch.** Build a generic subagent prompt containing:
   - the full content of `references/agents/session-historian.md`
   - `problem_topic`
   - `scratch_dir`
   - `output_path: /tmp/spec-first/spec-compound/{run_id}/session-history.md`
   - a `sessions` array with extracted file paths and metadata
   - the output schema above
   - the filter rule above

   The subagent reads only the scratch paths, **writes its prose findings to `/tmp/spec-first/spec-compound/{run_id}/session-history.md`, and returns only that artifact path once the write is confirmed** (same #956 reliability rationale — session-history findings are long-form prose prone to summary-collapse). If `{run_id}` did not resolve or the artifact write failed, it returns the prose inline instead (per the inline-fallback rule above). If synthesis fails, note the failure and continue without session context.

### Phase 2: Assembly & Write

<sequential_tasks>

**WAIT for all Phase 1 inputs to complete before proceeding** — the three research roles (parallel only under authorized dispatch) and, in Full mode, the internal session-history flow, which may stop at `no relevant prior sessions`. Session history is a Phase 1 input even though it runs in the orchestrator rather than as a public skill.

The orchestrating agent (main conversation) performs these steps:

1. **Collect Phase 1 results from the run artifacts.** Read `context.json`, `solution.md`, `related.json`, and `session-history.md` when that flow ran. Under authorized dispatch, fall back to the subagent's inline return only when its artifact is absent or empty. Under inline fallback, the orchestrator owns both role execution and artifact writes. The artifact is authoritative when present.
2. **Check the overlap assessment** from the Related Docs Finder before deciding what to write:

   | Overlap | Action |
   |---------|--------|
   | **High** — existing doc covers the same problem, root cause, and solution | **Update the existing doc** with fresher context (new code examples, updated references, additional prevention tips) rather than creating a duplicate. The existing doc's path and structure stay the same. |
   | **Moderate** — same problem area but different angle, root cause, or solution | **Create the new doc** normally. Flag the overlap for Phase 2.5 to recommend consolidation review. |
   | **Low or none** | **Create the new doc** normally. |

   The reason to update rather than create: two docs describing the same problem and solution will inevitably drift apart. The newer context is fresher and more trustworthy, so fold it into the existing doc rather than creating a second one that immediately needs consolidation.

   When updating an existing doc, preserve its file path and existing frontmatter structure, but add `source_refs` and `invalidation_condition` when absent because this path materially rewrites the learning. Update the solution, code examples, prevention tips, and any stale references. Add a `last_updated: YYYY-MM-DD` field to the frontmatter. Do not change the title unless the problem framing has materially shifted.

3. **Incorporate session history findings** (if available). When the internal session-history flow returned relevant prior-session context:
   - Fold investigation dead ends and failed approaches into the **What Didn't Work** section (bug track) or **Context** section (knowledge track)
   - Use cross-session patterns to enrich the **Prevention** or **Why This Matters** sections
   - Tag session-sourced content with "(session history)" so its origin is clear to future readers
   - If findings are thin or "no relevant prior sessions," proceed without session context
4. Assemble complete markdown file from the collected pieces, reading `assets/resolution-template.md` for the section structure of new docs
5. Validate YAML frontmatter against `references/schema.yaml`, including non-empty `source_refs` and `invalidation_condition` promotion exit fields and the YAML-safety quoting rule for array items (see `references/yaml-schema.md` > YAML Safety Rules). The references must be grounded and the invalidation condition must be semantically specific; the script in step 8 checks only their mechanical shape.
6. Create directory if needed: `mkdir -p docs/solutions/[category]/`
7. Write the file: either the updated existing doc or the new `docs/solutions/[category]/[filename].md`
8. **Validate parser-safety and the knowledge-promotion exit contract** after every new or materially rewritten learning. Promotion mode catches malformed `---` delimiter lines, unquoted ` #` in scalar values (silent comment truncation), unquoted `: ` in scalar values (silent mapping confusion), and mechanically requires a non-empty top-level `source_refs` array plus a non-empty top-level `invalidation_condition`. The bundled validator ships **inside the skill bundle**; `SKILL_DIR` resolves to the skill directory, but the runtime Bash tool's CWD is the user's project, so a project-relative path (without the `$SKILL_DIR` prefix) would miss. Run it through an existence guard so platforms that cannot locate the script (harnesses where `$SKILL_DIR` is unset) fall back to the same manual gate instead of silently skipping the protection:

   ```bash
   if [ -n "${SKILL_DIR:-}" ] && [ -f "$SKILL_DIR/scripts/validate-frontmatter.py" ]; then
     python3 "$SKILL_DIR/scripts/validate-frontmatter.py" --promotion <output-path>
   else
     echo "Bundled validate-frontmatter.py not resolvable on this platform; applying the parser-safety and promotion checklist manually."
   fi
   ```

   - **If the script ran:** exit 0 means the mechanical promotion gate passed; exit 1 means stderr names the offending field(s) — repair the frontmatter and re-run until exit 0. Do not declare success while validation fails.
   - **If the script did not run** (else branch): apply the same parser-safety and promotion-shape checks by hand. Do not declare success until all four checks pass:
     1. The opening and closing frontmatter delimiters are each a line whose content is `---` (trailing whitespace is fine; `----` or `---extra` is not a valid delimiter).
     2. For each **top-level** mapping entry (`key: value`, no leading indentation) whose value is **not already quoted or structured** (does not start with `"`, `'`, `[`, `{`, `|`, or `>`): the value must contain no unquoted ` #` (space-then-hash — YAML treats it as a comment and silently truncates) and no unquoted `: ` (colon-then-space — strict YAML may read it as a nested mapping). Quote the whole value if either appears.
     3. `source_refs` appears exactly once as a top-level non-empty block or flow array, and every item is a non-empty string. Plain tokens that common YAML parsers type as null, boolean, number, sexagesimal, date, or timestamp do not count as strings; quote them.
     4. `invalidation_condition` appears exactly once as a top-level non-empty scalar or block string, with the same implicit-type quoting rule for plain scalar values.
     Nested parser-safety values, semantic source credibility, and semantic invalidation adequacy remain outside this mechanical fallback. Then state in the completion output that the bundled script validator was unavailable on this platform and the checks were applied manually.

   Default validator mode remains parser-safety-only for legacy compatibility. `--promotion` adds only the two promotion exit shapes; it does not judge reference credibility, invalidation adequacy, other schema fields, or enum values. It also does not flag YAML reserved-indicator characters (those produce loud parser errors downstream rather than silent corruption — out of scope). Uses Python 3 stdlib only (no PyYAML or other deps).

When creating a new doc, preserve the section order from `assets/resolution-template.md` unless the user explicitly asks for a different structure.

</sequential_tasks>

### Phase 2.4: Vocabulary Capture

**First, read `references/concepts-vocabulary.md`.** This is unconditional. Do not pre-judge from memory that nothing qualifies — the reference's criteria are non-obvious and qualifying terms often live in the surrounding conversation rather than the new doc itself. Reading the reference is what makes the rest of the phase possible.

Then, applying those criteria, scan the new doc **and** the surrounding conversation for qualifying domain terms. If `CONCEPTS.md` exists at repo root, add missing qualifying terms and refine existing entries when new precision surfaced. If it does not exist and at least one qualifying term surfaced, create it.

**Verify behavior assertions against source before writing them.** When an entry asserts how code behaves (states, transitions, limits, semantics), Read the defining source at the current tree first — an entry drafted from a session-level summary is exactly how wrong semantics enter the glossary. Phase 2.45 re-checks these entries, but the cheap fix is to not write the error.

**Seed the learning's area at creation — don't write a lone term.** When `CONCEPTS.md` does not yet exist, alongside the surfaced term also seed the core domain nouns of the area this learning touched, following the **Seed goal** and **Scope of a seed** rules in `references/concepts-vocabulary.md`. The seed is scoped to the learning's area (the modules and domain the fix touched) and defines only terms investigated here — it does not reach for repo-wide nouns. This anchors the surfaced term so it does not dangle against undefined siblings. A repo-wide concept map is `spec-compound-refresh`'s bootstrap path, not this one.

**At creation, hold the qualifying bar conservatively for borderline terms.** A borderline term, or a class/table/file name dressed up as an entity, defers to a later run — clear core nouns are seeded, borderline ones wait. The conservatism is about quality, not count; updates to an existing file follow the normal criteria.

**When bootstrapping the file, start with this preamble under the `# Concepts` heading**, then add the qualifying entries below it:

> Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as spec-compound and spec-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

**Refresh the coherence neighborhood of any entry you touch.** When adding or editing an entry, also inspect its *coherence neighborhood* — its cluster siblings and the terms it cross-references or that reference it. Within that neighborhood, do two things: fix glossary violations (implementation specifics — file paths, class names, function signatures, current-config values), and refresh entries the learning's own evidence shows have drifted. Bounds: neighborhood only, never a full-file audit; refresh only on evidence already in hand; if judging a neighbor would require investigation this learning did not do, flag it for `spec-compound-refresh` rather than editing on a guess. The test: after the edit, would a reader find the touched entry's siblings or referenced terms inconsistent with it? Broader audit is `spec-compound-refresh`'s job.

If no terms qualified after applying the reference's criteria, record that outcome explicitly in the success output (e.g., "Vocabulary capture: scanned, no qualifying terms"). Do not silently skip — the visible scan-and-no-result record is the audit signal that the reference was consulted.

**Apply edits silently in every mode — no user prompt in interactive, lightweight, or headless.** Vocabulary capture is a side effect of compounding, not a decision the user makes per run. Lightweight mode reaches this through its own single-pass step (see Lightweight Mode), and runs an **update-only** version — it refines an existing `CONCEPTS.md` but defers creation/seeding to a Full run.

### Phase 2.45: Grounding Validation

The doc (and any `CONCEPTS.md` entries from Phase 2.4) is about to become permanent, trusted knowledge. Validate its claims against the tree before it compounds. **Read `references/grounding-validation.md` now** — it holds the adjudication rules and the validator prompt; the steps below are only the trigger.

1. **Mechanical claims check (every mode, including headless).** Optionally run `git fetch --quiet` first (best-effort — skip silently offline; the network is never a correctness dependency). Then run the bundled validator against the written doc:

   ```bash
   SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
   python3 "$SKILL_DIR/scripts/validate-doc-claims.py" <doc-path>
   ```

   Exit 0 means nothing flagged. Exit 1 means flags to **adjudicate, not auto-fix** — each flagged path, SHA, link, or scaffold pattern is fixed, annotated as historical, or confirmed intentional per the reference's adjudication table. A doc may legitimately cite a path deleted by the very fix it documents; a flag is a question, not a failure. If the script cannot be resolved on this platform, apply the reference's manual checklist and say so in the output — never silently skip.

2. **Semantic grounding validator (Full and headless; lightweight skips it).** When the Dispatch Authorization Boundary is satisfied, dispatch one read-only generic subagent built from the prompt template in the reference, covering the written doc plus any `CONCEPTS.md` entries added or edited this run. Otherwise apply that validator prompt inline, record the matching fallback reason, and do not claim independent semantic validation. In either path, verify code-behavior claims by quoting the defining source line, merge-state claims against remote truth (`gh` primary, git reachability fallback), and internal completeness of countable assertions. Apply verdicts per the reference, then re-run the mechanical check if the body changed.

### Phase 2.5: Selective Refresh Check

After writing the new learning, decide whether this new solution is evidence that older docs should be refreshed.

`spec-compound-refresh` is **not** a default follow-up. Use it selectively when the new learning suggests an older learning or pattern doc may now be inaccurate.

It makes sense to invoke `spec-compound-refresh` when one or more of these are true:

1. A related learning or pattern doc recommends an approach that the new fix now contradicts
2. The new fix clearly supersedes an older documented solution
3. The current work involved a refactor, migration, rename, or dependency upgrade that likely invalidated references in older docs
4. A pattern doc now looks overly broad, outdated, or no longer supported by the refreshed reality
5. The Related Docs Finder surfaced high-confidence refresh candidates in the same problem space
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
- **In headless mode**, never invoke `spec-compound-refresh` and never ask the user. Surface the recommended scope hint in the terminal report's "Refresh recommendation" line and let the caller decide

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
   c. In full interactive mode, explain to the user why this matters — agents working in this repo (including fresh sessions, other tools, or collaborators without the plugin) won't know to check `docs/solutions/` unless the instruction file surfaces it. Show the proposed change and where it would go, then use the platform's blocking question tool to get consent before making the edit: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. Fall back to presenting the proposal in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question. In lightweight mode, output a one-liner note and move on. In headless mode, apply the edit directly without prompting and surface it in the terminal report under "Instruction-file edit"

5. **If `CONCEPTS.md` exists at repo root, run a parallel discoverability check for it.** Assess whether the instruction file would lead an agent to discover the project's shared domain vocabulary. Use the same workflow as the `docs/solutions/` check above: same target file, same edit-placement judgment, same consent-then-edit interaction shape per mode. A line in an existing section is almost always better than a new headed section. Example calibration when nothing else fits:

   ```
   CONCEPTS.md  # shared domain vocabulary (entities, named processes, status concepts) — relevant when orienting to the codebase or discussing domain concepts
   ```

   **Skip this step entirely if `CONCEPTS.md` does not exist** — never nag for an artifact the project has not adopted. When skipped, this step produces no output and no edit.

### Phase 3: Optional Enhancement

**WAIT for Phase 2 to complete before proceeding.**

**Skip Phase 3 entirely in headless mode** to bound token usage — the caller does not have a human-in-the-loop to act on reviewer findings, and downstream automations can run specialized reviewers themselves if they want that pass.

#### Optional review roles

Based on problem type, optionally apply local prompt assets from `references/agents/` to review the documentation. Dispatch generic subagents only when the package-local boundary permits it; otherwise run the selected reviews inline or serially and label them accordingly. Do not dispatch standalone agents by type/name.

- **performance_issue** → `references/agents/performance-oracle.md`
- **security_issue** → `references/agents/security-sentinel.md`
- **database_issue** → `references/agents/data-integrity-guardian.md`
- Any code-heavy issue → preserve code simplification as a **read-only documentation review**. Inspect the solution draft's code examples and explanatory claims inline, or dispatch a generic subagent seeded with a local prompt only to return suggestions. Do **not** invoke `spec-simplify-code` from this phase and do not mutate product code unless the user explicitly asks for a separate code-simplification pass. Do not use the deleted `code-simplicity-reviewer`.
  Example: review the solution draft's examples for speculative abstractions, redundant wrappers, dead branches, and just-in-case parameters. Apply edits only to the documentation/examples being written by `spec-compound`; leave any branch code changes untouched.

---

### Lightweight Mode

<critical_requirement>
**Single-pass alternative — same documentation, fewer tokens.**

This mode skips parallel subagents entirely. The orchestrator performs all work in a single pass, producing the same solution document without cross-referencing or duplicate detection.

Headless mode forces Full and does not enter Lightweight — automations get the cross-reference and overlap detection benefits without the interactive overhead.
</critical_requirement>

The orchestrator (main conversation) performs ALL of the following in one sequential pass:

1. **Extract from conversation**: Identify the problem and solution from conversation history. Also scan the "user's auto-memory" block injected into your system prompt, if present (Claude Code only) -- use any relevant notes as supplementary context alongside conversation history. Tag any memory-sourced content incorporated into the final doc with "(auto memory [claude])". Before asserting how code behaves (enum values, status semantics, limits, defaults), Read the defining line at the current tree — soften or attribute any claim you cannot verify. Cite PR numbers over bare commit SHAs, and phrase unmerged fixes as pending
2. **Classify**: Read `references/schema.yaml` and `references/yaml-schema.md`, then determine track (bug vs knowledge), category, and filename
3. **Write minimal doc**: Create `docs/solutions/[category]/[filename].md` using the appropriate track template from `assets/resolution-template.md`, with:
   - YAML frontmatter with track-appropriate fields, a grounded non-empty `source_refs` array, and a concrete non-empty `invalidation_condition`, applying the YAML-safety quoting rule for array items (see `references/yaml-schema.md` > YAML Safety Rules)
   - Bug track: Problem, root cause, solution with key code snippets, one prevention tip
   - Knowledge track: Context, guidance with key examples, one applicability note
4. **Vocabulary capture (update-only)**: if `CONCEPTS.md` exists at repo root, read `references/concepts-vocabulary.md`, then scan the new doc and the conversation for qualifying terms and add/refine entries silently (same criteria as Phase 2.4). Do **not** bootstrap or seed in lightweight mode — if `CONCEPTS.md` does not exist, defer creation to a Full run, which owns seeding. Record the outcome in the output (e.g., "Vocabulary: 1 entry refined" or "scanned, no qualifying terms"). If you refined `CONCEPTS.md` and a quick read of `AGENTS.md`/`CLAUDE.md` shows it isn't surfaced there, add the discoverability tip to the output below — lightweight **tips**, it does not edit instruction files (a Full run owns that edit).
5. **Promotion gate**: run the same mechanical promotion validation as Phase 2 step 8. If the script is unavailable, apply that step's four-item manual checklist; do not silently skip or declare completion with either field absent:
   ```bash
   if [ -n "${SKILL_DIR:-}" ] && [ -f "$SKILL_DIR/scripts/validate-frontmatter.py" ]; then
     python3 "$SKILL_DIR/scripts/validate-frontmatter.py" --promotion <output-path>
   else
     echo "Bundled validate-frontmatter.py not resolvable on this platform; applying the parser-safety and promotion checklist manually."
   fi
   ```
6. **Mechanical claims check**: run `scripts/validate-doc-claims.py` against the written doc exactly as in Phase 2.45 step 1 (same `SKILL_DIR` anchor, same adjudicate-not-auto-fix rule — read `references/grounding-validation.md` for the adjudication table when it flags anything). Lightweight skips only the semantic validator subagent, not this deterministic check.
7. **Skip specialized agent reviews** (Phase 3) and the semantic grounding validator (Phase 2.45 step 2) to conserve context

**Lightweight output:**
```
✓ Documentation complete (lightweight mode)

File created:
- docs/solutions/[category]/[filename].md

[If discoverability check found instruction files don't surface the knowledge store:]
Tip: Your AGENTS.md/CLAUDE.md doesn't surface docs/solutions/ to agents —
a brief mention helps all agents discover these learnings.

[If CONCEPTS.md was refined this run and isn't surfaced in the instruction files:]
Tip: Your AGENTS.md/CLAUDE.md doesn't surface CONCEPTS.md —
a one-line mention helps agents find the shared vocabulary.

Note: This was created in lightweight mode. For richer documentation
(cross-references, detailed prevention strategies, specialized reviews,
semantic grounding validation), re-run spec-compound in a fresh session.
```

**No subagents are launched. No parallel tasks. The solution doc is the one deliverable** (Phase 2.4's update-only vocabulary capture may also refine an existing `CONCEPTS.md`).

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
| Subagents write product files into `docs/` or edit tracked paths | Subagents write only scratch artifacts under `/tmp/spec-first/spec-compound/<run-id>/` and return the path; orchestrator writes the one final doc |
| Subagent returns a long prose body only as its inline response | Subagent writes full output to its run artifact; orchestrator Reads it back (inline return is fallback only) |
| Research and assembly run in parallel | Research completes → then assembly runs |
| Multiple files created during workflow | One solution doc written or updated: `docs/solutions/[category]/[filename].md` (plus optional maintenance writes: a `CONCEPTS.md` create/update from Phase 2.4 and a small instruction-file edit for discoverability) |
| Creating a new doc when an existing doc covers the same problem | Check overlap assessment; update the existing doc when overlap is high |
| Asserting code behavior or merge-state from conversation memory | Read the defining source line before asserting; cite PR numbers over SHAs; soften unverifiable claims (Phase 1 extractor rules, re-checked in Phase 2.45) |
| Batching several learnings through one run and stitching cross-references between drafts | One learning per run; run the skill sequentially for each additional learning |

## Success Output

### Headless mode

Emit a structured terminal report and end the turn. No "What's next?" question, no blocking prompt. End with `Documentation complete` as the terminal signal so callers can detect completion.

```
✓ Documentation complete (headless mode)

File: docs/solutions/<category>/<filename>.md  (created | updated)
Track: <bug | knowledge>
Category: <category>
Overlap: <none | low | moderate — see <path> | high — existing doc updated>
Grounding: <clean | N flags adjudicated (X fixed, Y annotated, Z confirmed) | N claims softened or corrected | degraded — merge-state claims unverified offline>
Instruction-file edit: <none needed | applied to <path> | gap noted, not applied>
CONCEPTS.md: <scanned, no qualifying terms | created with N entries (M seeded from the learning's area) | updated — N added, N refined>
Refresh recommendation: <none | scope hint for spec-compound-refresh>

Documentation complete
```

When no doc was written (e.g., headless invoked on a session where the problem is not yet solved), emit a structured failure instead and end with `Documentation skipped` so callers can distinguish success from no-op:

```
✗ Documentation skipped (headless mode)

Reason: <one-sentence explanation — e.g., "no solved problem detected in
conversation history" or "solution not yet verified">

Documentation skipped
```

### Interactive mode

```
✓ Documentation complete

Ran Full mode.
Auto memory: 2 relevant entries used as supplementary evidence

Execution: <dispatched | inline-serial (`dispatch_authorization_missing` | `subagent_capability_missing`)>

Research Results:
  ✓ Context Analyzer: Identified performance_issue in brief_system, category: performance-issues/
  ✓ Solution Extractor: 3 code fixes, prevention strategies
  ✓ Related Docs Finder: 2 related issues
  ✓ Session History: 3 prior sessions on same branch, 2 failed approaches surfaced

Grounding Validation:
  ✓ Mechanical check: 14 paths, 2 SHAs, 3 links checked — 1 flag annotated as historical
  ✓ Semantic validator: 9 claims verified, 1 merge-state claim softened to pending

Specialized Reviews (execution posture inherited from above):
  ✓ performance-oracle: Validated query optimization approach
  ✓ Code simplification review: Code examples are appropriately minimal

Files written:
- docs/solutions/performance-issues/n-plus-one-brief-generation.md (created)
- CONCEPTS.md (created with 3 entries: BriefSystem, EmailQueue, Brief Status)

This documentation will be searchable for future reference when similar
issues occur in the Email Processing or Brief System modules.

Refresh recommendation: none
```

**End the turn after the summary — `spec-compound` does not present a "What's next?" menu.** The doc is written and any cross-references the workflow found are already in it. Cross-doc maintenance (fixing references in *other* docs, consolidation) is deferred to `spec-compound-refresh` via the `Refresh recommendation` line above — the skill designed for it — not auto-applied here, which would edit tracked docs beyond the one deliverable. If the user wants to view the file or take a follow-up action, they will ask. (Interactive mode only.)

**Alternate interactive output (when updating an existing doc due to high overlap):** in headless mode, this case is communicated via the `Overlap: high — existing doc updated` line of the headless terminal report above, not as a separate output block.

```
✓ Documentation updated (existing doc refreshed with current context)

Overlap detected: docs/solutions/performance-issues/n-plus-one-queries.md
  Matched dimensions: problem statement, root cause, solution, referenced files
  Action: Updated existing doc with fresher code examples and prevention tips

File updated:
- docs/solutions/performance-issues/n-plus-one-queries.md (added last_updated: 2026-03-24)
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

<manual_override> Use spec-compound [context] to document immediately without waiting for auto-detection. </manual_override> </auto_invoke>

## Output

Writes the final learning directly into `docs/solutions/`.

## Applicable Specialized Local Prompts

Based on problem type, these local prompt assets can enhance documentation:

### Code Quality & Review
- **Read-only code simplification review**: Checks solution examples and documentation claims for unnecessary complexity without mutating product code
- **references/agents/pattern-recognition-specialist.md**: Identifies anti-patterns or repeating issues

### Specific Domain Experts
- **references/agents/performance-oracle.md**: Analyzes performance_issue category solutions
- **references/agents/security-sentinel.md**: Reviews security_issue solutions for vulnerabilities
- **references/agents/data-integrity-guardian.md**: Reviews database_issue migrations and queries

### Enhancement & Research
- **references/agents/best-practices-researcher.md**: Enriches solution with industry best practices
- **references/agents/framework-docs-researcher.md**: Links to framework/library documentation references

### When to Invoke
- **Auto-triggered** (optional): Generic subagents seeded with local prompts can run post-documentation for enhancement
- **Manual trigger**: User can run surviving skills such as `spec-simplify-code` after `spec-compound` completes for deeper code review and mutation

## Related Commands

- Research workflows - Deep investigation (searches docs/solutions/ for patterns)
- `spec-plan` - Planning workflow (references documented solutions)
