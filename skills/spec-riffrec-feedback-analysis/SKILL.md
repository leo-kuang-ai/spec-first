---
name: spec-riffrec-feedback-analysis
description: Analyze explicit Riffrec product-feedback captures, including `riffrec-*.zip`, the Riffrec `session.json` + `events.json` + `recording.webm` + `voice.webm` bundle, or media/notes the user identifies as a Riffrec feedback capture. Also use for Riffrec setup and capture guidance. Do not trigger for generic podcasts, meetings, audio/video transcription, or unrelated capture/share requests.
---

# Riffrec Feedback Analysis

Turn raw product feedback into structured evidence for downstream agents. This skill is the consumption side of [Riffrec](https://github.com/kieranklaassen/riffrec), a capture tool that records synchronized screen + voice + event sessions and emits a `riffrec-*.zip` bundle.

## Choose the path

Route to the matching reference based on the input. Read only the selected mode reference; both analysis modes require the shared analyzer reference before execution.

- **Setup** — user has no recording yet and asks how to install Riffrec, capture a session, or share feedback. Read `references/install-riffrec.md`.
- **Transcript only**: When the user wants a transcript, recording length does not change the deliverable into a bug report. Return verifiable local text with its timestamps and gaps. If none exists, follow `references/analyzer.md` in a new temporary directory only with explicit authorization for third-party transcription of this recording. Return the text actually received. If neither route is available, report the gap and stop; do not reconstruct speech from events or screenshots.
- **Quick bug report** — input is a short recording (under ~60 seconds), the user describes a single specific issue, or asks for "quick" or "small". Read `references/quick-bug-report.md`. Emit one concise bug report; skip the full artifact set and brainstorm handoff. Discovering broader scope returns an escalation handoff and never authorizes a durable extensive rerun.
- **Extensive analysis** — input is a longer recording, contains multiple issues / requirements / workflow walkthroughs, or the user wants requirements or brainstorm material. Read `references/extensive-analysis.md`. Produce a ready-to-brainstorm handoff; invoke `spec-brainstorm` only when the original request or a new confirmation authorizes that public workflow.

When the input is ambiguous (e.g., a zip arrived without context), inspect the recording length and event count before choosing. If still unclear, ask the user which path applies before running anything heavy.

## Common rules

- Keep raw recordings, audio chunks, zip contents, session dumps, and extracted screenshots local-only by default. Do not commit `raw/` or `frames/` directories unless the user explicitly asks and privacy is acceptable.
- Analyzer outputs are local evidence by default, including manifests and JSON containing original paths or captured content. Only a separately reviewed, sanitized text subset may be shared or committed under explicit destination/commit authority; file extension and generation success do not establish privacy safety.
- Use repo-relative screenshot paths in any committed doc so later agents can open the evidence without absolute local paths.

Media transcription is a separate third-party egress. Before analyzer execution, record `transcription_egress_authorization: authorized | missing`. It is authorized only when the current user or visible upstream handoff explicitly requests third-party transcription for this recording; analysis intent, a local file, an ambient `OPENAI_API_KEY`, or worker dispatch authority does not grant it. Pass `--transcribe` only when authorized. Otherwise pass `--no-transcribe`, preserve local frames/events/notes analysis, and report the missing transcript limitation. The analyzer returns the authorization source, provider identity, and whether a provider request was sent.

## Dispatch Authorization Boundary

Record: before handing over recording evidence, transcript, screenshots, or source-mapping context to any worker:

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

`workflow invocation does not authorize dispatch`. A subagent, delegated work, persona, or parallel work may only be dispatched when the current user or a visible upstream handoff explicitly requests it; input file submission, analysis scale, tool permissions, or invocation of this Skill do not constitute authorization. When authorization is missing, do not perform tool schema probing; fix the value to `capability_probe: not_applicable` + `worker_dispatch_capability: unknown`, execute in inline or serial mode, and record `dispatch_authorization_missing`. Only after authorization does it treat the current-session registry/schema as `provider_untrusted` evidence for inspection: record `subagent_capability_missing` when missing, and record `worker_capability_unproven` when the capability is unavailable, the schema is incomplete, or the candidate is non-unique, either inline or in sequence. Isolation, model coverage, and bounded concurrency only retain live facts; when required isolation is not satisfied, maintain dependency gate open; inherit when model is unknown, and operate sequentially when parallelism is unknown. Record `worker_dispatch_outcome`. Any dissemination must also comply with local-only/privacy boundaries and shall send only the minimum evidence required to complete the bounded unit. Inline fallback must not claim independent analyst coverage.

## Analyzer Entrypoint

Before either analysis mode runs, read [Shared analyzer](references/analyzer.md). Pass an unpacked Riffrec capture directory itself so synchronized metadata and media remain together. Setup does not run the analyzer. The analyzer is not executed when only transcription is performed and local text already exists; when execution is required, it operates within the same privacy and authorization boundaries.

Extensive output under `docs/brainstorms/riffrec-feedback/` remains a documented evidence/kickoff-artifact exception, not a durable brainstorm output. Quick output stays temporary. The extensive artifact format is defined in `references/spec-first-feedback-format.md`.
