# Skill/Agent Quality Governance Thin Contract

本文档是 skill / agent 质量治理的轻量边界语言。它用于帮助 workflow、reviewer 和维护者在修改 `skills/`、`agents/`、`templates/` 或相关 contract tests 时保持一致判断。

它不是 runtime 状态机，也不是 generated mirror 的 source of truth。当前 source-of-truth 仍然是 `skills/`、`agents/`、`templates/`、`src/cli/`、`docs/contracts/`、`CLAUDE.md` 与 `AGENTS.md`。

它服务 `docs/contracts/ai-coding-harness.md` 中的 Execution / Governance Harness：skill 和 agent 是可治理执行节点，不是 prompt collection 或隐藏状态机。

## 0. Non-goals

- Not a state machine.
- Not a hard gate platform.
- Not a universal JSON schema.
- Not a runtime mirror source.
- Not an eval platform.
- Not a replacement for LLM-owned semantic review.

## 1. Skill Minimum Contract v1

Public workflow skills should make their execution posture understandable without turning the prompt into a state machine.

| Field | Meaning | Required for |
|---|---|---|
| trigger | 什么时候应该使用该 skill | public workflow |
| non-trigger | 什么时候不应该使用该 skill | public workflow |
| inputs | 需要哪些上下文、artifacts 或 repo facts | public workflow |
| outputs | 产出什么，以及谁消费这些产物 | public workflow |
| workflow skeleton | 最小执行骨架，不替代 LLM 判断 | public workflow |
| failure mode | 失败如何降级或交还上游 | high-risk workflow |
| done signal | 什么算完成，哪些验证证明完成 | all |

Skill prompt 可以包含 examples-as-context，但 examples 不等于 semantic readiness，不应被写成自动通过的 eval platform。

## 2. High-risk Execution Safety Contract v1

真实影响 workspace、secrets、外部服务、git staging 或提交内容的 workflow 必须先定义写入和停止边界。

| Risk surface | Required boundary | Example |
|---|---|---|
| writes | 明确 source-of-truth、generated runtime 与 repo write scope | spec-work |
| shell/network | 明确何时执行、何时只读、何时需要 handoff | mcp-setup |
| secrets | 默认不传播，opt-in 必须可审计且不泄露内容 | spec-worktree |
| git staging | 只 stage batch-owned files 和显式 expected_side_effects | spec-work |
| external service | 区分 current official facts、repo convention 与 social signal | researcher |
| rollback/stop | 定义 stop condition，不 silent cleanup 用户改动 | delegation |

这些边界是强执行契约，不是完整 sandbox。脚本负责确定性事实和路径校验；LLM 负责解释风险、选择降级和判断是否回到上游 workflow。

## 3. Agent Output Contract Registry v1

不同 agent family 可以有不同输出姿态。不要为了统一而强行要求所有 agent 输出同一 JSON schema。

| Agent family | Output posture | Notes |
|---|---|---|
| reviewer | findings / severity / evidence / confidence | `spec-doc-review` personas 的 schema 由 `skills/spec-doc-review/references/subagent-template.md` 在 orchestrator dispatch 时注入 |
| researcher | claims / sources / freshness / limitations | 研究输出是 synthesis 输入，不等于最终结论 |
| writer/strategist | artifact / assumptions / checks / open risks | 服务 plan、requirements、docs 或 synthesis |

当 downstream consumer 明确依赖机器可读字段时，再为该 consumer 设计窄 schema；不要提前建立 universal agent JSON schema。

## 4. Research Evidence Contract v1

Researcher 和 synthesis 必须区分事实来源、freshness 和判断。脚本可以记录 source、时间、URL、exit code 或 artifact path；LLM 负责解释证据可信度和限制。

| Claim type | Authority order | Freshness rule |
|---|---|---|
| project convention | repo source > local docs > prior notes | repo-local source wins |
| external API/SDK/model | official docs > release notes > source/issues | must check current |
| social signal | social discourse only | never as fact alone |
| recommendation | cite assumptions and tradeoffs | separate fact/judgment |

Advisory external-tool facts、social discourse、old review notes 和 generated runtime mirrors 都不能覆盖当前 source 和验证结果。

## 5. Existing Exceptions

- `spec-doc-review` personas receive output schema from `skills/spec-doc-review/references/subagent-template.md`;不要在每个 persona agent 文件里重复 schema。
- optional/internal skills do not need examples until they become high-risk, high-traffic, or downstream-consumed.
- generated runtime mirrors such as `.claude/`, `.codex/`, and `.agents/skills/` are not source of truth.
- deterministic tests may check file existence, JSON shape, required strings, path safety, and known dangerous patterns; they must not pretend to judge semantic quality.

## 6. Lifecycle Metadata Waiver

公开 workflow skill 不需要为了响应单个审计 finding 而新增 per-skill `manifest.json`、`agents/interface.yaml`、owner/cadence 字段或 maturity metadata。当前集中式 dual-host governance contract 只记录 delivery topology，刻意不表达 lifecycle metadata。

如果 owner、review cadence、maturity 或 lifecycle state 变成可被有效消费的证据，只有在存在真实 consumer 且已有聚焦 consumer tests 后，才设计独立的集中式 advisory lifecycle contract。重估触发条件是：至少两个 public workflows 需要同一组 lifecycle fields，并且 downstream command、review workflow、catalog 或 release process 会把这些字段作为 advisory evidence 消费。

在该触发条件出现前，skill-specific posture 记录在 validation artifacts 或 changelog entries 中。不要为了单个 skill 新增 `skills/<skill>/manifest.json`、`agents/interface.yaml`，也不要扩展 `src/cli/contracts/dual-host-governance/skills-governance.schema.json`。
