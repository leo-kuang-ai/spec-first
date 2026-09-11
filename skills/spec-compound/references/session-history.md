# Session History

## Session Context

After restricted-read authorization, resolve the branch with `git rev-parse --abbrev-ref HEAD` and repo root with `git rev-parse --show-toplevel`, each as its own command. Skip branch filtering on detached HEAD or non-zero exit; outside Git, use the working directory as repo root. Never treat unresolved host interpolation as a value.

#### 4. **Session History** (authorization-gated internal flow after the research block)
   - **Run only** in Full mode with explicit restricted-read authorization. Without it, record `restricted_read_authorization_missing`, do not inspect session roots or related tool schemas, and continue to Phase 2 without session context. Skip entirely in lightweight mode or headless mode. After authorization, run a two-stage probe: the cheap discovery+metadata pass executes first, and the expensive extraction+synthesis executes only when the probe clears the relevance gate (see **Escalation gate** below).
   - Run session discovery, branch/keyword filtering, scan-window selection, deep-dive selection, and per-session extraction directly inside this skill using `scripts/session-history/`.
   - Read `references/agents/session-historian.md`. Dispatch a generic subagent only when the separate dispatch boundary in `references/modes.md` is satisfied; otherwise synthesize inline and label it non-independent. Restricted-read authorization alone does not grant dispatch authority.

   **Session-history payload — keep tight.** A long, keyword-rich payload licenses widening. Use this shape:

   - **Session context** (only if values resolved cleanly above; otherwise omit): repo name, current git branch.
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
     bash "$SKILL_DIR/scripts/session-history/discover-sessions.sh" "$REPO_NAME" "$SCAN_DAYS" --cwd "$REPO_ROOT" | tr '\n' '\0' | xargs -0 bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/session-history/extract-metadata.py" --cwd-filter "$REPO_ROOT"
   else
     echo "Session history bundled scripts were not found in this skill's directory; skipping the session-history probe for this run."
   fi
   ```

   Pi sessions are included when present under `~/.pi/agent/sessions/`; they carry `cwd` like Codex but no git branch. If `_meta.files_processed` is `0`, return `no relevant prior sessions`. If the first pass finds no relevant branch matches, or if processing Codex or Pi sessions, derive 2-4 keywords from the topic and re-run metadata extraction with `--keyword K1,K2,...`. Keep at most 5 sessions across Claude Code, Codex, Cursor, and Pi, ranked by branch match, keyword match count, file size over 30KB, and recency. Exclude the current session.

   **Escalation gate.** After restricted-read authorization, the discovery+metadata pass above is the cheap probe. Escalate to the extraction and synthesis stages below **only** when at least one retained candidate clears the relevance bar: a current-branch match, or ≥2 topic-keyword matches. If no candidate clears the bar (including the `_meta.files_processed` is `0` case), stop here, record `no relevant prior sessions` as the session-history input, and skip extraction and synthesis. This gate keeps the authorized probe cheap — the expensive synthesis is paid for only when a prior session is genuinely relevant.

   **Extraction pipeline.** Create `SCRATCH=$(mktemp -d "${TMPDIR:-/tmp}/spec-compound-sessions-XXXXXX")` under the same owner-private rules as `references/research.md`. For each selected session, write extracted content to scratch files:

   ```bash
   SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
   if [ -f "$SKILL_DIR/scripts/session-history/extract-skeleton.py" ]; then
     bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/session-history/extract-skeleton.py" --output "$SCRATCH/<session-id>.skeleton.txt" < <session-file>
   else
     echo "Session history bundled scripts were not found in this skill's directory; skipping the session-history probe for this run."
   fi
   ```

   Use `extract-errors.py` selectively when dead ends or recurring errors are likely useful. Pass only the scratch file paths and metadata to the synthesis subagent.

   **Synthesis dispatch.** Build a generic subagent prompt containing:
   - the full content of `references/agents/session-historian.md`
   - `problem_topic`
   - `scratch_dir`
   - `output_path: <private-scratch-dir>/session-history.md`
   - a `sessions` array with extracted file paths and metadata
   - the output schema above
   - the filter rule above

   The subagent reads only the scratch paths, **writes its prose findings to `<private-scratch-dir>/session-history.md`, and returns only that artifact path once the atomic write is confirmed**. If `{run_id}` or the private scratch directory did not resolve, ownership/symlink recheck failed, or the artifact write failed, it returns the prose inline instead. If synthesis fails, note the failure and continue without session context.
