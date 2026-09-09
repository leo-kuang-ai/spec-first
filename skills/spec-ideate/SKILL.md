---
name: spec-ideate
description: "Generate and evaluate grounded ideas. Use when the user asks for ideas, improvements, surprising options, or AI-generated directions before choosing one to develop; use spec-brainstorm to refine the user's own idea."
argument-hint: "[feature, focus area, or constraint] [output:md]"

---

# Generate Improvement Ideas

Note: Use the current date from the active host context. Use this when weighting external sources and dating artifacts.

`spec-ideate` precedes `spec-brainstorm`.

- `spec-ideate` answers: "What are the strongest ideas worth exploring?"
- `spec-brainstorm` answers: "What exactly should one chosen idea mean?" and writes a requirements-only unified plan under `docs/plans/`.
- `spec-plan` answers: "How should it be built?"

This workflow produces a ranked ideation artifact — written to `docs/ideation/` when present, else a spec-first temp path (see Phase 4). It does **not** produce requirements, plans, or code.

## Workflow Contract Summary

- **输入：** 一个希望获得改进方向的主题、范围、约束或用户提供的 research artifact。
- **输出：** 有证据基础、经过批判和排序的 ideation artifact，包含候选、拒绝理由、限制与推荐探索方向。
- **硬出口：** 主题或目标 repo 无法确定、证据不足以支撑 basis、请求实际需要产品收敛/规划/实现时停止并路由 owning workflow。
- **权威：** source 与研究证据约束 idea basis；LLM 负责生成、批判和排序；workflow 不产生 requirements、implementation、commit 或 landing 权限。
- **消费者：** 用户、`spec-brainstorm`、产品/技术 owner 与后续 strategy 讨论。

## Interaction Method

Use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

Ask one question at a time. Prefer concise single-select choices when natural options exist.

## Focus Hint

<focus_hint> #<invocation arguments supplied by the current host> </focus_hint>

Interpret any provided argument as optional context. It may be:

- a concept such as `DX improvements`
- a path such as `skills/`
- a research artifact to draw on — a file of gathered evidence (social-research report, survey export, analytics dump) at any path, inside or outside the repo (handled in Phase 1's user-supplied research subsection)
- a constraint such as `low-complexity quick wins`
- a volume hint such as `top 3`, `100 ideas`, or `raise the bar`

If no argument is provided, proceed with open-ended ideation.

## Core Principles

1. **Ground before ideating** - Scan the actual codebase first. Do not generate abstract product advice detached from the repository.
2. **Generate many -> critique all -> explain survivors only** - The quality mechanism is explicit rejection with reasons, not optimistic ranking. Do not let extra process obscure this pattern.
3. **Route action into brainstorming** - Ideation identifies promising directions; `spec-brainstorm` defines the selected one precisely enough for planning. Do not skip to planning from ideation output.

## Dispatch Authorization Boundary

在派发 grounding、research、evidence、ideation、basis-verification 或 recovery worker 前，记录：

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

`workflow invocation does not authorize dispatch`。Depth、mode、agent-count preview、用户请求外部/Slack/issue research、权限设置或 callable tool 都不构成派发授权。只有当前用户或可见 upstream handoff 明确请求 subagent、delegated work、persona 或 parallel work 时才可派发。缺授权时不得探测 tool schema，固定为 `capability_probe: not_applicable` + `worker_dispatch_capability: unknown`，inline 或 serial 执行相同 grounding/lens/rubric contracts 并记录 `dispatch_authorization_missing`。只有授权后才把 current-session registry/schema 作为 `provider_untrusted` evidence 检查：确认缺失时记录 `subagent_capability_missing`；surface 不可用、schema 不完整或候选不唯一时记录 `worker_capability_unproven`，均使用同一 fallback。隔离、模型覆盖和有界并发只取 live facts；required isolation 未满足时保持依赖 gate 打开，model unknown 时继承，parallelism unknown 时串行。记录 `worker_dispatch_outcome`。Fallback 必须保留 topic-axis 与 six-frame category coverage，但不得声称 agent diversity、independent basis verification、fresh-context 或 multi-agent coverage。

## Model Tiers

Sub-agent dispatch is tiered by task shape, never hardcoded to a model name:

- **Extraction tier** — evidence scouts and other retrieval/quoting work. Request the cheapest capable tier only when `worker_model_override: supported`. "Capable" is part of the spec — escalate to the generation tier when the repo is large or the stack obscure.
- **Generation tier** — evidence-driven ideation frames and basis verification. Request the balanced mid-tier only when `worker_model_override: supported`. If the override is unsupported or unknown, omit it and inherit rather than guessing.
- **Ceiling tier** — ceiling ideation frames, cross-cutting synthesis, and final arbitration. Inherit the orchestrator's model by omitting the model parameter.

**Degradation rule.** When authorized dispatch exists but `worker_model_override` is unsupported or unknown, dispatch everything on the inherited model and keep the read budgets and dossier caps. When dispatch is unauthorized, missing, or unknown, run the same roles inline or serially with those budgets and the claim limitation above.

Two overrides raise the whole ideation fleet to the ceiling tier: surprise-me mode (subject discovery is judgment-heavy and is the mode's whole value) and the `go deep` depth override (Phase 0.5).

## Execution Flow

Read `references/scope-gates.md` before resume, subject, mode, output, and decomposition gates. Read `references/output-mode.md` whenever output format is resolved. Read `references/grounding.md` before grounding. Read `references/divergent-ideation.md` before candidate generation, `references/post-ideation-workflow.md` before persistence and handoff, and `references/universal-ideation.md` for elsewhere-non-software mode.

### Required phase ownership

- Scope, resume, subject identification, mode classification, output precedence, cost transparency, and topic decomposition are owned by `references/scope-gates.md`.
- Grounding, user research artifacts, issue intelligence, learnings, and external-research authorization are owned by `references/grounding.md` and its named references.
- Candidate generation and critique remain bounded by `references/divergent-ideation.md`; output persistence and handoff remain owned by `references/post-ideation-workflow.md`.

The workflow remains repo-grounded and current-source first. External research, issue-tracker access, and provider calls are opt-in. Missing dispatch authorization falls back to inline/serial role lenses and must not be described as independent agent coverage. This workflow does **not** produce requirements, plans, or code; do not skip to planning from ideation output.

`external_research_authorization: authorized | missing` is resolved before grounding. Missing authority emits `external_research_authorization_missing`; missing authority removes the web-research role regardless of mode or depth, and dispatch authority never substitutes for research authority. The run records `context_facts_adapter/v1` with `source_identity`, `freshness`, and `limitations` for downstream handoff.

Output config resolution uses the active (non-commented) `ideate_output:` key and defaults to `html` (pipeline runs force `md`). Authorized-dispatch examples and inline fallback cost shape are defined in the owning references; do not claim fresh-context or independent-agent coverage when dispatch is unavailable.

Authorized-dispatch examples are advisory cost-shape examples; the owner records actual capability facts. Any handoff to `spec-write-skill` remains explicit and source-first. **Authorized-dispatch examples** and the inline fallback labels stay in the owning references.

When dispatch is unavailable, run the same role lenses inline/serial and record `dispatch_authorization_missing`; do not claim independent agent diversity or fresh-context verification.
