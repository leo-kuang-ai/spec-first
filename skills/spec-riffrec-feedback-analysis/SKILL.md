---
name: spec-riffrec-feedback-analysis
description: Analyze explicit Riffrec product-feedback captures, including `riffrec-*.zip`, the Riffrec `session.json` + `events.json` + `recording.webm` + `voice.webm` bundle, or media/notes the user identifies as a Riffrec feedback capture. Also use for Riffrec setup and capture guidance. Do not trigger for generic podcasts, meetings, audio/video transcription, or unrelated capture/share requests.
---

# Riffrec Feedback Analysis

Turn raw product feedback into structured evidence for downstream agents. This skill is the consumption side of [Riffrec](https://github.com/kieranklaassen/riffrec), a capture tool that records synchronized screen + voice + event sessions and emits a `riffrec-*.zip` bundle.

## Choose the path

Route to the matching reference based on the input. Read only that reference; do not load the others.

- **Setup** — user has no recording yet and asks how to install Riffrec, capture a session, or share feedback. Read `references/install-riffrec.md`.
- **Quick bug report** — input is a short recording (under ~60 seconds), the user describes a single specific issue, or asks for "quick", "small", or "just transcribe". Read `references/quick-bug-report.md`. Emit one concise bug report; skip the full artifact set and brainstorm handoff. Discovering broader scope returns an escalation handoff and never authorizes a durable extensive rerun.
- **Extensive analysis** — input is a longer recording, contains multiple issues / requirements / workflow walkthroughs, or the user wants requirements or brainstorm material. Read `references/extensive-analysis.md`. Produce a ready-to-brainstorm handoff; invoke `spec-brainstorm` only when the original request or a new confirmation authorizes that public workflow.

When the input is ambiguous (e.g., a zip arrived without context), inspect the recording length and event count before choosing. If still unclear, ask the user which path applies before running anything heavy.

## Common rules

- Keep raw recordings, audio chunks, zip contents, session dumps, and extracted screenshots local-only by default. Do not commit `raw/` or `frames/` directories unless the user explicitly asks and privacy is acceptable.
- Text/metadata artifacts (requirements kickoff material, analysis summaries, problem analyses, source manifests) may be committed when they are needed for traceability and contain no sensitive data.
- Use repo-relative screenshot paths in any committed doc so later agents can open the evidence without absolute local paths.

Media transcription is a separate third-party egress. Before analyzer execution, record `transcription_egress_authorization: authorized | missing`. It is authorized only when the current user or visible upstream handoff explicitly requests third-party transcription for this recording; analysis intent, a local file, an ambient `OPENAI_API_KEY`, or worker dispatch authority does not grant it. Pass `--transcribe` only when authorized. Otherwise pass `--no-transcribe`, preserve local frames/events/notes analysis, and report the missing transcript limitation. The analyzer returns the authorization source, provider identity, and whether a provider request was sent.

## Dispatch Authorization Boundary

在把 recording evidence、transcript、screenshots 或 source-mapping context 交给任何 worker 前，记录：

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

`workflow invocation does not authorize dispatch`。只有当前用户或可见 upstream handoff 明确请求 subagent、delegated work、persona 或 parallel work 时才可派发；输入文件、分析规模、工具权限或本 Skill 被调用都不构成授权。缺授权时不得探测 tool schema，固定为 `capability_probe: not_applicable` + `worker_dispatch_capability: unknown`，inline 或 serial 执行并记录 `dispatch_authorization_missing`。只有授权后才把 current-session registry/schema 作为 `provider_untrusted` evidence 检查：确认缺失时记录 `subagent_capability_missing`；surface 不可用、schema 不完整或候选不唯一时记录 `worker_capability_unproven`，均 inline 或 serial。隔离、模型覆盖和有界并发只取 live facts；required isolation 未满足时保持依赖 gate 打开，model unknown 时继承，parallelism unknown 时串行。记录 `worker_dispatch_outcome`。任何派发还必须遵守 local-only/privacy 边界，只发送完成 bounded unit 所需的最小证据。Inline fallback 不得声称 independent analyst coverage。

## Analyzer entrypoint

All non-setup paths share the same analyzer, which ships in this skill's `scripts/` directory. The Bash tool's working directory is the user's project, not the skill directory, so a bare `scripts/<name>` path will not resolve. Invoke it by the skill's own absolute path: set `SKILL_DIR` to the directory you loaded this `spec-riffrec-feedback-analysis` SKILL.md from, in the same command (shell state does not persist between Bash calls):

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/analyze_riffrec_zip.py" /path/to/input --no-transcribe
```

Accepted inputs: a Riffrec `.zip`, an `.mp4` / `.mov` / `.webm` video, an `.m4a` / `.mp3` / `.wav` audio file, or a meeting-notes `.md`. Use `--output-dir <dir>` to control where artifacts land. In repos with `docs/brainstorms/`, the default remains `docs/brainstorms/riffrec-feedback/` as a documented evidence/kickoff-artifact exception; it is not the durable `spec-brainstorm` output convention. The quick path overrides the output dir to a temp location so nothing pollutes the repo.

The Spec-First output format used by the extensive path is documented in `references/spec-first-feedback-format.md`.
