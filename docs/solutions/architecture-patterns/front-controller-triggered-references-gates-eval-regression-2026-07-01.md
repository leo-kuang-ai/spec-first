---
title: 大 workflow skill 使用 Front Controller 分层优化
date: 2026-07-01
category: docs/solutions/architecture-patterns
module: spec-prd / workflow skill optimization
problem_type: architecture_pattern
component: development_workflow
severity: medium
applies_when:
  - "workflow skill 变成大入口，SKILL.md 同时承载路由、场景细节、失败案例和验证规则"
  - "压缩 prompt 时不能牺牲 source/runtime、handoff、readiness 或 owner-question 边界"
  - "references、scripts、evals 都存在，但热路径和冷路径职责不够清楚"
  - "需要在优化上下文预算时证明行为没有因为瘦身而退化"
domain: spec-first workflow skill architecture
pattern: front-controller-triggered-references-deterministic-gates-eval-regression
rejected_alternatives:
  - "把大 workflow 直接压到通用 skill token 预算内 — 拒绝，因为核心 workflow 需要保留入口骨架和安全边界"
  - "把所有规则留在 SKILL.md — 拒绝，因为每次调用都会加载完整知识库，稀释热路径判断"
  - "把复杂语义交给脚本判定 — 拒绝，因为脚本只能守确定性不变量，语义充分性仍归 LLM"
  - "只按文本变短判断优化成功 — 拒绝，因为必须用 eval 和 contract tests 防止行为回退"
applicable_versions:
  - "spec-first 1.12.x"
invalidation_condition: "如果 host skill runtime 原生支持可靠的按需上下文加载、workflow references 不再由 SKILL.md 触发，或 spec-first 改用独立 package manifest 作为 skill source truth，则需要重估本模式。"
source_refs:
  - "docs/10-prompt/结构化项目角色契约.md"
  - "skills/spec-prd/SKILL.md"
  - "skills/spec-prd/references/evaluation-governance.md"
  - "skills/spec-prd/evals/examples.json"
  - "skills/spec-prd/scripts/check-prd-artifact.js"
  - "skills/spec-prd/scripts/finalize-prd-artifact.js"
  - "tests/unit/spec-prd-contracts.test.js"
  - "tests/unit/spec-prd-evals-unit.test.js"
tags: [workflow-skill, context-engineering, front-controller, triggered-reference, deterministic-gate, eval-regression, spec-prd, steel-frame]
---

# 大 workflow skill 使用 Front Controller 分层优化

## Context

`spec-prd` 这类核心 workflow 不是普通小 skill。它既要做入口路由，又要保护 source/runtime 边界、owner question、Requirement Analysis Gate、PRD artifact contract、readiness/finalize/checker handoff、Codex degraded path 等多个高风险边界。直接套用通用 skill 的极低初始 token 预算，会把它压成菜单入口，丢掉实际执行骨架。

真正的问题不是“大 workflow 不该大”，而是主入口不能大到每次调用都加载完整知识库。一次 `$yao-meta-skill` 评测显示，`skills/spec-prd/SKILL.md` 的初始加载约 15k tokens，明显高于 production skill 的通用预算；但目标 skill 同时已有 9 个 references、确定性 checker/finalize 脚本、111 个 eval cases 和 focused contract tests。优化方向因此不是删除复杂度，而是重新分层：热路径留在入口，冷路径按触发加载，确定性出口交给脚本，行为退化交给 eval/test 捕捉。

这条学习把该分层固化为一个可复用模式：

```text
Front Controller + Triggered References + Deterministic Gates + Eval Regression
```

## Guidance

把大 workflow skill 当成一个小型 workflow harness，而不是一份长 prompt。

### 1. Front Controller：SKILL.md 只做主入口和执行骨架

`SKILL.md` 应像 front controller：判断是否进入当前 workflow，给出主链路，规定不可违反的边界，并说明什么时候加载哪个 reference。它不应承载所有失败案例、所有场景细节、所有 reason_code 长解释或完整输出模板。

对 `spec-prd` 这样的 workflow，主入口应保留这些内容：

- frontmatter `description` 和 near-neighbor route boundary。
- `Purpose`、main workflow spine、When To Use / When Not To Use。
- source/runtime 边界和 artifact invariant。
- Interaction Method 的最小规则。
- Reference Trigger Map。
- Run-Local Decision Card 字段。
- Four Legal Stop Points 的压缩版。
- Phase 0-4 的执行骨架。
- Phase 4 finalize/checker 的命令、事实边界和 handoff 原则。

主入口的目标不是覆盖所有知识，而是让模型在第一次读取后知道：当前任务是否该进来、下一步做什么、哪些出口不能绕过、哪些细节需要按触发读取。

### 2. Triggered References：按信号加载专业上下文

场景细节放到 references，并通过触发信号加载。

| 触发信号 | 加载位置 |
| --- | --- |
| 当前系统、source-of-truth、producer/consumer 或 topology 风险 | `references/evidence-and-topology.md` |
| 术语冲突、owner decision、领域边界或 glossary 风险 | `references/domain-language-and-decision-ledger.md` |
| 粗 PRD、draft、多源材料或需要一问一答 clarification | `references/grill-with-docs-integration.md` |
| UI 设计链接、截图、Figma、设计状态或交互材料 | `references/design-source-evidence.md` |
| 超大输入、多文档、resume PRD 或跨 chunk 冲突 | `references/large-input-checkpoint.md` |
| 要写 durable PRD artifact | `references/prd-output-template.md` |
| 要判断 planning readiness 或 handoff | `references/prd-readiness-lens.md` |
| 要解释 maturity、eval status 或 promotion boundary | `references/evaluation-governance.md` |

这不是把复杂度藏起来，而是把复杂度放到正确的读取时机。模型在普通 PRD authoring 中不需要预加载全部 design-source 或 governance 细节；只有信号出现时才读对应规则。

### 3. Deterministic Gates：脚本守出口，不替代语义判断

脚本只处理可机械判断的事实和不变量。它们适合输出 machine-readable facts、finding count、receipt status 和 `reason_code`，不适合判断产品语义是否足够。

适合脚本守的内容：

- PRD 是否写在允许路径。
- 是否声明 `artifact_kind: prd-requirements`。
- 是否缺 `write_mode`、`clarification_evidence` 或 `can_enter_spec_plan`。
- 是否自称 `ready-for-planning` 但缺当前 receipt。
- 是否出现 blocking reason_code。
- 是否遗漏 design source coverage 或 input scan。
- 是否触碰 generated runtime mirror。

不适合脚本裁决的内容：

- owner 问题是否已经语义闭合。
- Outstanding Questions 是否真的不会让 planning invent WHAT。
- 某个 source-candidate 是否足以支持产品 scope。
- PRD 是否在业务上“足够好”。

因此 closeout 应拆成两层：

```text
script-owned facts:
  finding_count
  blocking_reason_codes
  receipt_status
  input_scan_status

LLM-owned judgment:
  readiness_outcome
  whether planning would invent WHAT
  whether residue belongs in ask-owner, revise-prd, doc-review, or route-out
```

这正对应角色契约：scripts enforce deterministic invariants and prepare facts；LLM decides semantic adequacy above that floor。

### 4. Eval Regression：每次瘦身都证明行为没退化

大 workflow prompt 优化不能只看 token 下降。每次移动或压缩内容，都应通过 eval 和 contract tests 证明原先保护的行为仍在。

`spec-prd` 这种 workflow 至少要守住这些 regression：

- 路由边界：0-1 idea、implementation-ready、audit/debug/review 不误进 PRD。
- Clarification：不能跳过 owner/source clarification 直接写 final PRD。
- Design source：未读或 degraded design input 不能静默 ready。
- Checkpoint：`checkpoint-prd` 不能被包装成 final PRD 或 planning handoff。
- Source/runtime：不能通过 `.claude/`、`.codex/`、`.agents/skills/` runtime mirror 修 source 行为。
- Readiness：blocking reason_code 出现时不能 handoff 到 plan。
- Codex degraded path：缺 Claude hook 等价能力时必须显式报告 degraded。

测试锚点也要随分层调整：如果某条规则从 `SKILL.md` 下沉到 reference，测试应从“必须在主文件出现”改成“热路径主文件仍指向它，冷路径 reference 仍承载它”。测试应该绑定语义能力和 source/runtime 边界，而不是绑定历史文件位置。

## Why This Matters

大 workflow skill 的质量瓶颈通常不是“缺规则”，而是规则堆在错误层级。所有规则都留在 `SKILL.md` 会产生三个问题：

- 每次运行都加载全部知识，浪费上下文并稀释入口判断。
- 维护者难以判断某段内容是入口 contract、场景参考、输出模板、失败案例还是 deterministic gate。
- 压缩时容易误删承重边界，因为没有明确说明边界迁移到哪里。

Front Controller 分层让优化变成可验证的结构迁移：

- 热路径保持小而明确。
- 冷路径有触发条件和 owner。
- 确定性出口由脚本守住。
- 语义质量由 eval/fresh-source eval/contract tests 防回退。

它也避免两个常见误区：一是为了 token 预算把核心 workflow 压成路由菜单；二是为了“完整”把所有专业判断塞进主入口。

## When to Apply

- workflow skill 是核心链路节点，例如 PRD、plan、work、review、debug、compound。
- `SKILL.md` 同时包含路由、执行、输出模板、失败案例、reason_code、runtime guard 说明和 eval/governance 说明。
- references 已经存在，但主入口仍复制大量 reference 内容。
- 脚本已经能检查一些 facts，却仍被 prose 当成语义判官描述。
- 需要优化上下文预算，同时不能牺牲 source/runtime、handoff、verification 或 knowledge-promotion gate。
- 评测或 review 指出 context budget pressure，但通用 skill token 预算不适合直接套到大型 workflow。

不要用于这些情况：

- 一次性小 skill 或个人 scaffold，直接保持简洁即可。
- 问题是缺少确定性 checker，而不是主入口过大。
- references 没有真实触发差异，只是把同一段 prose 拆到多个文件。
- 没有 eval/test 证据保护行为，移动内容后无法判断是否退化。

## Examples

不佳结构：

```text
SKILL.md
  - route boundary
  - full design-source rules
  - full large-input rules
  - long failure cases
  - full readiness reason_code list
  - output template details
  - governance notes
```

这会让入口成为知识库。模型每次读取都背负所有冷路径，也更容易把某个场景规则误用于普通路径。

更好的结构：

```text
SKILL.md
  - route boundary
  - workflow spine
  - hard source/runtime and artifact boundaries
  - reference trigger map
  - decision card fields
  - phase skeleton
  - finalize/checker exit discipline

references/
  - design-source-evidence.md
  - large-input-checkpoint.md
  - prd-output-template.md
  - prd-readiness-lens.md

scripts/
  - check-prd-artifact.js
  - finalize-prd-artifact.js

evals/
  - examples.json
```

压缩前后的验证顺序：

```text
1. 分类 SKILL.md 段落：hot path / triggered path / deterministic fact / eval evidence。
2. 移动冷路径内容到对应 reference，不改语义。
3. 更新 tests：主入口测触发指针，reference 测承载规则。
4. 跑 deterministic eval 和 focused Jest。
5. 再看 context_sizer/resource_boundary_check 的 token 降幅。
```

判断一段内容放哪里：

| 内容类型 | 放置位置 |
| --- | --- |
| 每次进入 workflow 都必须知道 | `SKILL.md` |
| 只影响某类场景 | `references/*.md` |
| 可机械判断 | `scripts/*.js` |
| 行为期望或失败样例 | `evals/` |
| 历史验证证据 | `docs/validation/` |
| runtime 生成结果 | 不手改，通过 source + `spec-first init` 投射 |

## Related

- `docs/solutions/architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md`：相邻模式，强调先找承重轴再精简 skill。
- `docs/solutions/workflow-issues/skill-prose-rewrite-contract-test-coverage-2026-06-28.md`：提醒 prose contract tests 不等于 runtime behavior proof。
- `skills/spec-prd/references/evaluation-governance.md`：记录 `spec-prd` production posture、eval 证据边界和非 governed/public-claim-ready 边界。
- `docs/10-prompt/结构化项目角色契约.md`：定义 deterministic floor 与 LLM semantic judgment 的总边界。
