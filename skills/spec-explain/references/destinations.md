# Destinations and Close

Everything Phase 6 does: capability detection, the destination menu, the action for each option, each destination sub-flow, audience re-render ordering, consent gates, and improvement observations. `SKILL.md` names this file as a required read before Phase 6 renders anything; do not render the menu or act on a selection without it. Local file and Leave it are the always-present floor.

## Menu and per-option actions

Detect destinations from the current session's tools and context. Missing binaries, environment variables, or unloaded MCP tools do not prove absence when a connector could supply the capability. Count visible options against the host's cap; when the set is too large, render a numbered list in chat and wait. Ask for the destination once; a chosen publisher's consent is a separate ask.

- **Artifact surface** (when an artifact-publishing capability is present) — re-emit the canonical explainer as body-only markup, keep CSS inline and metadata visible, publish through the detected surface, and report the returned reference.
- **Local file** — copy the artifact out of `$RUN_DIR` to the user-named path, create parent directories as needed, and offer the host's open primitive when available.
- **Send to Thinkroom** (when a Thinkroom skill, MCP tool, or documented CLI is detected) — send the explainer through that capability's contract and report the returned reference; on failure, report it and fall back to the local-file path.
- **Leave it** — materialize the canonical artifact under `.spec-first/workflows/spec-explain/<run-id>/explainer.<html|md>` with a private temp file and atomic rename, then report the repo-relative path. Never leave ephemeral `$RUN_DIR` as the only recoverable copy.

## Audience mismatch and consent ordering

Artifact surface and Thinkroom may expose the artifact to other readers. Before sending a personally-composed artifact to such a destination, offer once to re-render for the requested audience using the compose-time rendering reference. Take the answer and proceed either way; never re-render unasked. Complete this offer before any destination-specific consent gate.

Publishing is never headless or inferred. If a destination is public or its capability contract requires confirmation, show the full warning first and obtain explicit confirmation in a separate ask; naming the destination is not confirmation. If confirmation cannot be obtained, do not publish; use the entrypoint's non-interactive preservation path and report the recoverable artifact location.

## Improvement observations

Once the destination is sent or declined, offer surfaced improvements. An unanswered consent gate or unavailable interaction ends the run after artifact preservation; skip these offers. Never auto-fire improvements or raise them while an ask remains open:

- **New-capability ideas** — on acceptance invoke `spec-ideate` through the skill-invocation primitive with the observations as seed context.
- **Code-clarity findings** — on acceptance invoke `spec-simplify-code` through the skill-invocation primitive with the observations and files.
- **UI/UX polish opportunities** — present them in chat and tell the user to invoke `spec-polish` themselves; it is user-run only.
- **Contradicted repo docs** — on acceptance invoke `spec-compound-refresh` through the skill-invocation primitive with the document and superseding evidence; do not edit repo memory here.

Only these user-runnable invocation forms are printed for `spec-polish`: `/spec-polish` by default, `$spec-polish` on Codex when required, and `/skill:spec-polish` on oh-my-pi. Render one form only.

## Artifact surface

Offered when an artifact-publishing tool is present in the session's toolset.

Artifact surfaces wrap published content in their own document skeleton (doctype, head, body) and enforce a CSP that blocks requests to external hosts. Publishing the run-dir file verbatim would nest a full HTML document inside theirs and break on any external reference. So:

1. Re-emit the explainer as **body-only markup**: strip the doctype/`<html>`/`<head>`/`<body>` shell; keep the content elements.
2. Keep all CSS inline (a `<style>` element at the top of the fragment is acceptable); no external font links, no external images — the explainer's no-external-request invariant already guarantees this.
3. Keep the visible metadata header and composition footer in the fragment — they are part of the artifact.
4. Publish, confirm the returned URL/reference to the user.

The run-dir file remains the complete standalone document; the fragment is a re-emission, not a replacement.

## Local file

1. Ask nothing extra if the user already named a path; otherwise accept the path from their menu answer's free-text.
2. Copy the artifact out of the run dir to that path (`cp "$RUN_DIR/explainer.html" <path>` — or `explainer.md` for a markdown run), creating parent directories if needed.
3. Where the platform exposes a browser-opening primitive (`open` on macOS, `xdg-open` on Linux, `start` on Windows), offer to open it; otherwise print the absolute path.

## Send to Thinkroom

Offered only when a Thinkroom capability is detected — a Thinkroom skill in the session's skill list, a reachable MCP tool, or a documented CLI that responds. Use whatever interface that capability exposes to create/share a document from the explainer content, following that interface's own contract for title and body format. Surface the returned document reference. When the send fails, report it and fall back to the local-file path. Never guess at a Thinkroom API shape when no capability is detectable — the option simply doesn't render.
