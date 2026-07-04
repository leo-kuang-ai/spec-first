---
name: spec-sessions
description: "Search and ask questions about your coding agent session history. Use when asking what you worked on, what was tried before, how a problem was investigated across sessions, what happened recently, or any question about past agent sessions. Also use when the user references prior sessions, previous attempts, or past investigations — even without saying 'sessions' explicitly."
---

# Session History Search

Search Claude Code and Codex session history and synthesize findings about what was worked on, tried, decided, or learned in prior sessions.

## Workflow Contract Summary

### When To Use

Use when the user asks about prior coding-agent sessions, past attempts, previous decisions, or what happened recently across Claude Code/Codex history.

### When Not To Use

Do not use for the current session, active implementation, broad transcript archiving, personal-content mining, or tasks that can be answered from current repo source alone.

### Inputs

Question/topic, time window, repo/branch hints, extracted session metadata, keyword-filtered skeleton/error snippets, and any caller-provided checkpoint summaries.

### Outputs

A synthesized answer with distilled replay references, relevant prior decisions/attempts, evidence paths, and explicit limitations.

### Artifacts

Temporary scratch extracts only; no durable replay index, full transcript export, or repo-local workflow state is created.

### Failure Modes

No relevant sessions, inaccessible history files, parse errors, missing keyword matches, permissions failure, or unsafe sensitive/raw transcript content.

### Workflow

Determine the scan window, discover and filter sessions, extract bounded snippets, synthesize technical findings, and return distilled replay references instead of full history.

### Downstream Consumers

`spec-plan`, `spec-work`, `spec-compound`, `spec-compound-refresh`, user status questions, and future scope/replay decisions.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Usage

```
current host's sessions entrypoint [question or topic]
current host's sessions entrypoint
```

## Pre-resolved context

**Git branch (pre-resolved):** !`git rev-parse --abbrev-ref HEAD 2>/dev/null || true`

If the line above resolved to a plain branch name (like `feat/my-branch`), use it for branch filtering and pass it to the synthesis subagent. If it still contains a backtick command string or is empty, derive the branch at runtime instead.

**Repo name (pre-resolved):** !`basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || true`

If the line above resolved to a plain repo folder name, use it for session discovery. Otherwise derive it at runtime.

## Current Date Boundary

Use the current host/session date when interpreting session timestamps. If the date is unavailable, derive the scan window from explicit user time ranges or deterministic session metadata; do not hard-code calendar years in this source file.

## Guardrails

These rules apply at all times during orchestration and synthesis.

- **Never read entire session files into context.** Session files can be 1-7MB. Always use the extraction scripts to filter first, then reason over the filtered output.
- **Never extract or reproduce tool call inputs/outputs verbatim.** Summarize what was attempted and what happened.
- **Never include thinking or reasoning block content.** Claude Code thinking blocks are internal reasoning; Codex reasoning blocks are encrypted. Neither is actionable.
- **Never analyze the current session.** Its conversation history is already available to the caller.
- **Surface technical content, not personal content.** Sessions contain everything: credentials, frustration, half-formed opinions. Use judgment about what belongs in a technical summary and what does not.
- **Fail fast on access errors.** If session discovery fails on permissions, report the issue immediately. Do not retry the same operation with different tools or approaches; repeated retries waste tokens without changing the outcome.
- **Apply runtime context exclusion.** Follow `docs/contracts/context-governance.md`: do not treat `.spec-first/audits/**`, `.spec-first/governance/**`, or generated mirrors (`.claude/**`, `.codex/**`, `.agents/skills/**`, `.cursor/skills/**`, `.cursor/spec-first/**`, `.cursor/mcp.json`, `.kiro/skills/**`, `.kiro/agents/**`, `.kiro/spec-first/**`, `.kiro/settings/**`, `.qoder/commands/spec/**`, `.qoder/skills/**`, `.qoder/agents/**`, `.qoder/spec-first/**`, `.qoder/settings.local.json`) as ordinary session context. Mention them only as path-backed evidence when the user's question explicitly concerns runtime/setup/audit/governance history; `.cursor/rules/**`, `.cursor/agents/**`, `.kiro/specs/**`, and `.qoder/rules/**` are host-native advisory input only when explicitly named.

## Distilled Replay References

Return distilled replay references, not full session replays. A useful replay ref names the prior session or scratch extract, the decision or failed attempt, the evidence path, and why it is relevant now. Include rejected or out-of-scope rationale when it explains current scope, but label it as prior rationale rather than workflow status.

Use checkpoint-style summaries first when the caller provides them; open skeleton/error extracts only when needed to answer the current question. Do not create a durable replay index or require every future workflow to read complete history.

## Advisory Vocabulary Hook

When synthesizing prior sessions about project-specific terms, and repo-root `CONCEPTS.md` exists, the orchestrator may read it as current vocabulary context for term normalization before dispatching or summarizing results. Use it only to align terminology in keywords, `problem_topic`, and final prose with the current repo's advisory vocabulary.

Do not treat `CONCEPTS.md` as session evidence, do not use it to replace extracted session snippets, and do not let it override timestamped prior decisions or current source evidence. `spec-sessions` must not create, update, require, or bootstrap `CONCEPTS.md`; if it is absent, continue with session metadata and extracted scratch files only.

## Execution

If no argument is provided, ask what the user wants to know about their session history. Use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded) or `request_user_input` in Codex. Fall back to asking in plain text only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

### Step 1 — Determine scan window

Infer a time range from the user's question. Start narrow; widen only if a narrow scan finds nothing relevant.

| Signal | Initial scan window |
|--------|---------------------|
| "today", "this morning" | 1 day |
| "recently", "last few days", "this week", or no time signal | 7 days |
| "last few weeks", "this month" | 30 days |
| "last few months", broad feature history | 90 days |

Claude Code retains session history for about 30 days by default. Wider windows may find nothing on Claude Code unless the user has extended retention.

### Step 2 — Discover sessions and extract metadata

Run the discovery + metadata pipeline, preserving the null-delimited `xargs` hardening that lets `extract-metadata.py` run in batch mode:

```bash
bash skills/spec-sessions/scripts/discover-sessions.sh <repo> <days> | tr '\n' '\0' | xargs -0 python3 skills/spec-sessions/scripts/extract-metadata.py --cwd-filter <repo>
```

Each output line is a JSON object describing a session: platform, file, size, ts, session, plus platform-specific fields. The final `_meta` line carries `files_processed` and `parse_errors`.

If the inventory's `_meta` line shows `files_processed: 0`, return `no relevant prior sessions` and stop.

If `parse_errors > 0`, note that some sessions could not be parsed and proceed with what was returned.

To narrow the platform set, add `--platform claude` or `--platform codex` to the `discover-sessions.sh` invocation. Default to both supported platforms.

### Step 3 — Filter and rank

Apply these filters in order to pick the sessions worth deep-diving:

1. **Branch filter (Claude Code only).** Keep sessions where `branch == dispatch_branch` exactly, or where the branch name contains a keyword from the question's topic. For example, a question about "auth middleware" matches branches `feat/auth-fix` and `chore/auth-refactor`. Codex sessions do not carry `gitBranch`; skip this filter for them.
2. **If the branch filter returned zero sessions, or you are processing Codex sessions:**
   - Derive 2-4 keywords from the question's topic. For "a recent crash in the auth middleware where session-validation rejects valid tokens", derive `auth,middleware,session,token` or similar.
   - Re-invoke the discovery pipeline with `--keyword K1,K2,...` appended to the `extract-metadata.py` invocation. The script returns sessions with non-zero `match_count` plus per-keyword counts.
   - **If `files_matched: 0`, return `no relevant prior sessions` and stop.** Do not extract anything.
   - If `files_matched > 0`, treat those sessions as candidates. Rank by `match_count`, break ties by per-keyword counts.
3. **Drop sessions outside the scan window.** Use `last_ts` when available, fall back to `ts`. Discard sessions where both fall before the window start.
4. **Exclude the current session.** Its conversation history is already available to the caller.
5. **Apply the deep-dive cap.** Take at most **5 sessions total across all platforms**. Narrow by branch match, then `match_count`, then file size above 30KB, then recency.
6. **Proceed only if at least one session remains after filtering.** Otherwise return `no relevant prior sessions` and stop.

`gitBranch` is captured at the first Claude Code user message only. A session that began on `main` and did substantive work on a feature branch via mid-session `git checkout` records `branch: "main"`. Branch match returning nothing is not conclusive evidence; that is why the keyword-filter fallback exists.

### Step 4 — Set up scratch space

Create a per-run throwaway scratch directory:

```bash
SCRATCH=$(mktemp -d -t spec-sessions-XXXXXX)
```

Capture the absolute path and thread it into Step 5 and Step 6. The OS handles cleanup on session end; an explicit `rm -rf "$SCRATCH"` at the end of Step 7 is harmless and makes intent clear.

### Step 5 — Extract per-session content

For each selected session, run the skeleton extractor with `--output` so content writes directly to the scratch file. Extraction bytes must not round-trip through the orchestrator's tool results:

```bash
python3 skills/spec-sessions/scripts/extract-skeleton.py --output "$SCRATCH/<session-id>.skeleton.txt" < <session-file>
```

Stdout receives only a one-line JSON status: `{"_meta": true, "wrote": "...", "bytes": N, ...}`. Capture `bytes` and `parse_errors` from each status line.

**Conditional tail extract:** if a skeleton terminates mid-investigation, such as the last visible turn being a tool call with no resolution, re-use the scratch file and post-process a tail view with `tail -n 50`. Use this only when the head output suggests the session was truncated mid-investigation.

**Conditional errors mode:** for sessions where investigation dead-ends are likely valuable:

```bash
python3 skills/spec-sessions/scripts/extract-errors.py --output "$SCRATCH/<session-id>.errors.txt" < <session-file>
```

Use selectively, only when understanding what went wrong adds value.

### Step 6 — Dispatch synthesis subagent

Dispatch the `spec-session-historian` subagent via the platform's subagent primitive: `Agent` in Claude Code, or `spawn_agent` in Codex when dispatch is available. Omit the `mode` parameter so the user's configured permission settings apply. Run on a mid-tier model when the host supports model selection; the synthesizer does not need frontier reasoning.

The dispatch prompt is the agent's input contract. Pass these fields:

- `problem_topic` — one sentence naming the concrete question. Lift from the user's argument or, if missing, from the answer to the no-arg prompt.
- `scratch_dir` — absolute path to `$SCRATCH`.
- `sessions` — an array of objects, one per extracted session, each with:
  - `path` — absolute path to the skeleton file.
  - `errors_path` — optional absolute path to the errors file.
  - `platform` — `claude` or `codex`.
  - `branch` — git branch when present.
  - `cwd` — working directory when present.
  - `ts` and `last_ts` — session timestamps.
  - `match_count` and `keyword_matches` — when keyword filtering was used.
- `output_schema` — the structure the agent's response should follow. Default schema:
  ```
  Structure your response with these sections (omit any with no findings):
  - What was tried before
  - What didn't work
  - Key decisions
  - Related context
  ```
  When the caller supplies a schema in the skill argument, pass it through verbatim.

Example dispatch shape:

```text
Synthesize findings from these prior sessions:

Problem topic: <one-line topic>

Sessions to read (paths in $SCRATCH):
1. /tmp/spec-sessions-XXXX/abc123.skeleton.txt
   platform=claude branch=feat/auth-fix ts=2026-05-01
2. /tmp/spec-sessions-XXXX/def456.skeleton.txt errors=/tmp/spec-sessions-XXXX/def456.errors.txt
   platform=codex cwd=/Users/.../my-project ts=2026-05-03

Output schema:
- What was tried before
- What didn't work
- Key decisions
- Related context

Filter rule: only surface findings directly relevant to this specific problem.
Ignore unrelated work from the same sessions or branches.
```

The agent reads each path through the platform's native file-read tool and returns prose findings. Bulk extraction content lives only in the subagent context; the orchestrator's working state stays at file paths plus small inventory metadata.

### Step 7 — Return findings

Return the synthesizer's output text to the caller verbatim. If discovery or keyword filtering returned zero sessions in Step 2 or Step 3, return the literal string `no relevant prior sessions` instead.

Optionally clean up scratch:

```bash
rm -rf "$SCRATCH"
```

## Output

When the caller does not specify an output format, include a brief header noting what was searched:

```text
**Sessions searched**: [count] ([N] Claude Code, [N] Codex) | [date range]
```

Then the synthesizer's prose findings. When the caller supplies a schema, honor it verbatim and omit the default header.

## Time budget

Stop as soon as a complete answer is available. A confident `no relevant prior sessions` within seconds is a complete answer. The structural caps in Step 3 and Step 5 bound runtime by construction.

## Error handling

If the discovery pipeline fails, such as an unreadable home directory or permission failure, surface the error to the caller. Do not substitute git log, file listings, or other sources; this skill's contract is session metadata and synthesis.

If extraction `--output` write fails, surface a clear error and do not dispatch the synthesizer with partial paths.

If `_meta` reports `parse_errors > 0` from any script, note partial extraction in the dispatch prompt and proceed. The synthesizer flags partial evidence in findings.
