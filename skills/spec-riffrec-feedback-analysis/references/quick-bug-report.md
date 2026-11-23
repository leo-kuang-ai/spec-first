# Quick bug report path

Use this path when the input is a short recording (under ~60 seconds), the user describes a single specific issue, or the user explicitly asks for "quick", "small", or "simple". The goal is to provide a concise bug report, not a multi-part requirements package. When returning the transcript, only the entry-point transcription branch should be returned.

## Workflow

1. Read [Shared analyzer](analyzer.md) and run its quick command with a temporary output directory. Use `--no-transcribe` unless explicit provider egress authority permits `--transcribe`. Capture the printed directory and receipt for subsequent reads.

2. Read `analysis.md` and the transcript/coverage receipt in `analysis.json` from the temp output. Skip `problem-analysis.md`, `review-prompt.md`, `requirements-kickoff.md`, and `source-materials.md`; they are designed for the extensive path.

3. Pick at most one or two screenshots from `frames/` that directly show the reported issue. Prefer frames near a verbal complaint, a failed click, a console error, or a failed network request.

4. Emit a single concise bug report. Default to printing it inline in the chat so the user can confirm before anything is written to disk. Only write a file if the user asks for one — and even then, prefer a single `bug-report.md` next to the source recording or in a path the user names. Do not auto-create `docs/brainstorms/...` for this path.

## Bug report shape

Keep it focused and short. Include only what the recording supports:

- **Title** — name the observed symptom, not an unverified failure or cause.
- **Steps to reproduce** — list only supported actions; write "not established" if the capture lacks a sequence.
- **Expected vs. actual** — separate a stated expectation from the observed result. If no one stated an expectation, say so.
- **Evidence** — cite the available event, transcript passage, or frame. For an event-only capture, no quote or screenshot is required. Capture duration is not an event timestamp.
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
