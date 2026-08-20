# Quick bug report path

Use this path when the input is a short recording (under ~60 seconds), the user describes a single specific issue, or the user explicitly asks for "quick", "small", "simple", or "just transcribe". The goal is one concise bug report, not a multi-artifact requirements package.

## Workflow

1. Run the analyzer to a temp directory so nothing pollutes the repo (`SKILL_DIR` is the directory containing the `spec-riffrec-feedback-analysis` SKILL.md; set it in the same command — shell state does not persist between Bash calls):

   ```bash
   SKILL_DIR="<absolute path of the directory containing the spec-riffrec-feedback-analysis SKILL.md>"
   bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/analyze_riffrec_zip.py" /path/to/input --no-transcribe --output-dir "$(mktemp -d -t riffrec-quick-XXXXXX)"
   ```

   Capture the printed output directory; later steps read from it. If the user explicitly requested third-party transcription for this recording, replace `--no-transcribe` with `--transcribe` and preserve the analyzer's egress receipt. A credential in the environment is not consent.

2. Read only `analysis.md` from the temp output. Skip `problem-analysis.md`, `review-prompt.md`, `requirements-kickoff.md`, and `source-materials.md` — they are designed for the extensive path.

3. Pick at most one or two screenshots from `frames/` that directly show the reported issue. Prefer frames near a verbal complaint, a failed click, a console error, or a failed network request.

4. Emit a single concise bug report. Default to printing it inline in the chat so the user can confirm before anything is written to disk. Only write a file if the user asks for one — and even then, prefer a single `bug-report.md` next to the source recording or in a path the user names. Do not auto-create `docs/brainstorms/...` for this path.

## Bug report shape

Keep it focused and short. Include only what the recording supports:

- **Title** — one short sentence naming the broken behavior.
- **Steps to reproduce** — bullet list reconstructed from clicks and transcript.
- **Expected vs. actual** — what the user said should happen vs. what happened.
- **Evidence** — transcript quote(s) with timestamps, plus 0–2 screenshot references.
- **Suggested next step** — single sentence: file an issue, open `spec-debug`, or escalate to extensive analysis if more issues surfaced.

## Source mapping (optional, only if obvious)

If the workspace is the product source code AND the broken surface is named clearly in the transcript or visible UI, add one short "Likely surface" line with file path and confidence (`High` / `Medium` / `Low`). Skip this section entirely when the mapping is speculative — speculative mappings belong in the extensive path, not a quick bug report.

## What to skip

- No `problem-analysis.md`, no `requirements-kickoff.md`, no Visual / Functional / Requirement / UX category split.
- No automatic handoff to `spec-brainstorm`. The quick path ends with the bug report.
- No commit of `raw/` or `frames/` — they live only in the temp dir and are discarded by the OS.
- No source-mapping pass across the codebase.

## Escalation

If the transcript turns out to contain multiple distinct issues, requirements, or a workflow walkthrough, keep the requested quick result bounded: report the primary bug, list the additional signals without expanding them, and return an `extensive-analysis-available` handoff that explains the durable artifacts and likely extra work.

Do not load the extensive reference, rerun the analyzer, create `docs/brainstorms/...`, or invoke `spec-brainstorm` from this discovery alone. Continue only when the current user explicitly selects extensive analysis; that new choice authorizes the extensive path but still does not authorize the downstream public workflow. Until then, leave the temp evidence ephemeral and disclose that it may need to be re-extracted after confirmation.
