---
title: 用钢筋结构方法精炼 skill 编写
date: 2026-06-04
category: docs/solutions/architecture-patterns
module: spec-prd
problem_type: architecture_pattern
component: development_workflow
severity: medium
applies_when:
  - "skill 文档膨胀为多套 lens、reference 和模板树，入口判断开始变重"
  - "外部文章或竞品经验启发了 skill 优化，但不能机械复制其形态"
  - "需要在 source-first 边界内精炼 workflow prompt 和 reference 结构"
  - "删除旧文件前必须证明原有语义边界已经迁移到新的承重结构"
  - "需要用 contract tests 证明少文件不等于少能力"
tags: [skill-authoring, prd-workflow, steel-frame, architecture-pattern, source-first, light-contract, workflow-simplification, contract-tests]
---

# 用钢筋结构方法精炼 skill 编写

## Context

这次 `spec-prd` 精简不是一次普通文案压缩，而是把一个已经膨胀的 workflow skill 重新压回可治理、可扫描、可验证的承重结构。

外部启发来自微信文章《AI研发自动化：Wiki知识库+技能包》（2026-06-04）。文章里的 `kb-tech-solution` 案例先通过真实 PRD 压测不断补 guardrails、矩阵和补充说明，后来发现继续打补丁会把 skill 修成厚重城堡，于是改为抽取核心思想：从 500 多行 `SKILL.md` 加 5 个补充文档，收束成约 270 行 `SKILL.md` 加技术方案模板。文章把这种做法称为给 skill 一个经久耐用的“钢筋结构”，而不是继续堆砖和枚举情况。

`spec-prd` 当时也出现了同类信号：入口 `SKILL.md` 约 300 行，多个 references 分别承载 intent routing、current-state、topology、domain lenses、readiness 和输出模板，另有 `templates/standard` 模板树。能力本身有价值，但判断被拆散在太多文件里，LLM 需要跨文件拼接真正的流程。

(session history) 更早一轮 `spec-prd` 优化曾先通过新增 `change-topology-lens.md` 等方式解决删除/迁移/契约变更遗漏，这说明“新增 lens”能快速补洞，但也会自然走向补丁堆。后续抽象从“PRD 文档生成器”转向“变更边界识别 workflow”，为这次收束到少量承重轴提供了前提。

最终落地后的 source 结构变成：

```text
skills/spec-prd/SKILL.md
skills/spec-prd/references/evidence-and-topology.md
skills/spec-prd/references/domain-language-and-decision-ledger.md
skills/spec-prd/references/prd-output-template.md
skills/spec-prd/references/prd-readiness-lens.md
skills/spec-prd/scripts/check-glossary-drift.js
```

旧的 `intent-routing.md`、`current-state-analysis.md`、`change-topology-lens.md`、`domain-lenses.md` 和 `templates/standard/` 被删除，不是因为这些能力不重要，而是因为它们保护的语义边界已经迁移到新的承重结构里。

## Guidance

“钢筋结构”指少量、稳定、可组合、跨场景支撑判断的核心结构。它不是更短的 prompt，也不是把文件机械合并，而是把 skill 中真正承重的判断轴显式化，让新增场景优先挂到已有轴上，而不是新增一个 reference、lens 或模板。

### 1. 先找承重轴，不先删文件

不要从“文件数要少于几个”开始。先问旧结构里哪些判断不能丢：

- 入口如何判断：PRD、澄清、审查、旁路还是路由到 plan/work/debug。
- 证据如何成立：哪些是 `confirmed-source`，哪些只是 `source-candidate` 或 owner 声明。
- 变更如何建模：新增、扩展、替换、删除、迁移、合并、拆分、workflow change、contract change。
- 产物如何约束：最终 PRD 必须有哪些骨架，哪些 section 按 topology/surface 触发。
- readiness 如何验证：是否还能阻止 `spec-plan` 发明 WHAT。

`spec-prd` 的承重轴最终收敛为 Phase 0 决策树、evidence/current-state、topology/source-of-truth、producer-consumer、negative space、output skeleton、readiness packs、project-local overlays。

### 2. 入口只做流程分流和最小决策

`SKILL.md` 应该是 workflow spine，不是知识大全。入口保留：

- purpose 和 workflow contract summary；
- reference trigger map；
- run-local decision card；
- Phase 0 四节点决策树；
- Phase 1-4 的高层执行顺序。

入口越短，越要清楚表达“何时进入、何时旁路、何时加载哪个 reference”。旧的 5 种 input mode 加多条 tie-break 规则，被压成四个问题：是否路由/旁路、是哪种 PRD 操作、输入姿态是什么、是否需要 split。

### 3. 把同类边界合并成一个核心 reference

`evidence-and-topology.md` 是这次精简的主钢筋。它统一承接：

- evidence tags；
- source candidate 与 confirmed source 的边界；
- current-state coverage；
- Change Delta；
- Topology Framing Gate；
- Evidence Plan；
- Surface Map；
- Producer / Artifact / Consumer；
- Source-Of-Truth Resolution；
- Negative Space；
- Owner Question Ladder；
- readiness gates 和 contradiction handling。

这比多个文件分别讲 evidence、current state、change topology 更稳定，因为 PRD 质量问题通常不是单个维度缺失，而是证据、拓扑、source-of-truth 和 consumer 之间断链。

### 4. 模板必须是产物 contract，不是格式装饰

`prd-output-template.md` 不只是标题顺序。它拥有 output shape、conditional sections、surface lenses、project-local overlays、industry overlays 和 embedded standard skeleton。

旧的 `templates/standard/` 模板树被删除后，能力没有消失，而是变成一个可按需裁剪的 runtime skeleton：

```text
output_shape:
  bypass | compact-prd | normal-prd | topology-heavy-prd

conditional sections:
  Current System Snapshot
  Change Topology
  Surface Map
  Producer / Artifact / Consumer
  Source-Of-Truth Resolution
  Negative Acceptance
```

这能避免同一套输出规则同时存在于 skill references 和 human-facing 模板树里，减少 source-of-truth 分裂。

### 5. readiness 从散点 checklist 收束为 compound packs

`prd-readiness-lens.md` 不再靠 12 项散点检查撑场景，而是按承重维度组织：

- Core Pack：current-state provenance、change delta、planning invention、wording/testability、interaction/exception。
- Topology Pack：topology/surface、producer-consumer、source-of-truth、negative-space、framing-evidence alignment。
- Domain And Decision Pack：terminology、contradiction、owner-question minimality、decision notes。
- Metrics And Overlay Pack：目标可衡量性和项目本地 overlay。

pack 不是降低质量，而是 prompt economy：核心永远检查，条件 pack 只在触发时加载。

### 6. 删除前问“边界迁到哪了”

不要逐句保留旧文案。删除旧 reference 或模板前，对每一类语义边界做迁移映射：

```text
旧 intent-routing.md
  -> SKILL.md Phase 0 四节点决策树

旧 current-state-analysis.md
  -> evidence-and-topology.md 的 evidence tags、candidate boundary、current-state coverage

旧 change-topology-lens.md
  -> evidence-and-topology.md 的 topology types、Framing Gate、Owner Question Ladder

旧 domain-lenses.md
  -> prd-output-template.md 的 surface/industry/project-local overlays
  -> prd-readiness-lens.md 的 Domain And Decision Pack / Metrics And Overlay Pack

旧 templates/standard/*
  -> prd-output-template.md 的 embedded standard skeleton
  -> human-facing docs/需求文档模版/标准模版/README.md 保留为人用参考
```

如果找不到迁移位置，就不能删；如果已经被更高阶结构吸收，就应该删掉重复补丁。

### 7. tests 绑定语义能力，不绑定历史文件形状

少文件只有在 contract tests 保护承重语义时才成立。`tests/unit/spec-prd-contracts.test.js` 增加了直接约束：

- `skills/spec-prd/` source topology 压缩到 6 个 source 文件、4 个 references；
- 不再存在旧 references 和 `templates/standard/`；
- `SKILL.md` 行数保持可扫描，并包含四节点 intake；
- `evidence-and-topology.md` 覆盖 evidence、topology、source-of-truth、producer/consumer、negative-space；
- `prd-output-template.md` 保留 runtime skeleton、surface lenses、project-local overlays；
- `prd-readiness-lens.md` 保留 Core/Topology/Domain/Metrics compound packs；
- fresh-source eval 记录必须诚实标注 `not_run`，不能声称语义 eval passed。

测试关注的是“旧文件保护的能力是否仍在”，而不是“旧文件名是否还在”。

## Why This Matters

skill 膨胀通常不是因为能力真的复杂，而是因为旧结构没有吸收新经验，只能每遇到一个场景就外挂一段规则。短期看这会增加覆盖面，长期看会降低 LLM 的判断质量：模型需要在过多局部规则之间自行拼装真正的流程。

“钢筋结构”的价值是把语义压力集中到少量稳定结构上：

- 入口更容易扫描，调用时不迷路。
- references 更少但更强，LLM 更容易形成一致判断。
- 模板变成产物 contract，而不是标题集合。
- readiness 变成质量门，而不是机械打勾。
- tests 绑定能力和 source/runtime 边界，而不是绑定历史目录形状。

这符合本仓库的角色契约：Light contract、Explicit boundaries、Scripts prepare, LLM decides。脚本和 tests 证明 source topology、入口治理和 contract 没坏；LLM 继续负责语义判断、场景裁剪和风险解释。

## When to Apply

- 一个 skill 已积累多个 references、templates、补充说明，入口开始变长。
- 新场景主要靠“再加一段规则”解决，而不是被现有结构吸收。
- 多个文件重复解释 evidence、current state、source-of-truth、producer/consumer、readiness 等相近概念。
- 删除任一文件时，很难判断删掉的是能力还是重复叙述。
- contract tests 主要绑定文件存在、标题存在、局部短语存在，而不是绑定核心语义能力。
- 外部文章或竞品 skill 提供了启发，但本项目需要借其功底，不借其形态。

不要用于这些情况：

- 单个 bug 修复，只需要局部补一句边界说明。
- 外部协议、schema 或 provider contract 本身要求多文件结构。
- 不同 references 面向完全不同 consumer，强行合并会混淆边界。
- 还没有足够真实案例证明哪些结构是稳定承重轴。

## Examples

补丁堆写法：

```text
SKILL.md
references/intent-routing.md
references/current-state-analysis.md
references/change-topology-lens.md
references/domain-lenses.md
references/prd-readiness-lens.md
references/prd-output-template.md
templates/standard/*
```

问题不在文件多本身，而在多个文件共同承担同一组判断：证据、现状、变更拓扑、source-of-truth、producer/consumer、输出要求和 readiness。LLM 需要跨文件拼接，维护者也难以判断某条规则属于入口、分析、模板还是质量门。

钢筋结构写法：

```text
SKILL.md
references/evidence-and-topology.md
references/domain-language-and-decision-ledger.md
references/prd-output-template.md
references/prd-readiness-lens.md
scripts/check-glossary-drift.js
evals/examples.json
```

测试判断示例：

```text
不是：必须存在 templates/standard 目录
而是：PRD output contract 必须包含 embedded standard skeleton 和 project-local overlay

不是：必须存在 current-state-analysis.md
而是：evidence/topology reference 必须约束 current state 与 source-of-truth 判断

不是：readiness 文档必须列出很多 checklist 项
而是：readiness 必须按 Core / Topology / Domain / Metrics 组织质量判断
```

本次验证链路：

```text
npx jest tests/unit/spec-prd-contracts.test.js --runInBand
npx jest tests/unit/spec-prd-contracts.test.js tests/unit/package-install-contracts.test.js --runInBand
npm run typecheck
npm run lint:skill-entrypoints
npm run build
npm run test:unit
git diff --check
```

fresh-source eval 没有声称通过：`docs/validation/spec-prd/fresh-source-eval-2026-06-04-simplicity-refactor.md` 记录为 `not_run`，替代证据来自直接 source reads 和 contract/unit 验证。这一点同样是钢筋结构的一部分：验证边界必须比文案更硬。

## Related

- `docs/solutions/architecture-patterns/competitor-skill-borrowing-judgment-2026-06-01.md` — 前置方法论：外部 skill 借鉴时如何“借功底，不借形态”。
- `docs/solutions/workflow-issues/owner-driven-spec-iteration-methodology-2026-05-29.md` — 通用的加法/减法节奏和拒绝过度设计框架。
- `docs/solutions/workflow-issues/workflow-host-instruction-reuse-policy-2026-05-25.md` — workflow prompt context economy 与 host instruction 复用边界。
- `docs/methodology/结构化项目角色契约.md` — spec-first source/runtime、script/LLM 职责和 light contract 基线。
- `skills/spec-prd/SKILL.md` — 当前 `spec-prd` workflow spine。
- `skills/spec-prd/references/evidence-and-topology.md` — 当前 `spec-prd` 的主钢筋。
- `tests/unit/spec-prd-contracts.test.js` — 防止 source topology 和语义 contract 回膨胀的测试网。
- 微信文章《AI研发自动化：Wiki知识库+技能包》（2026-06-04）— 外部启发来源；作为 design inspiration，不是本仓库 source-of-truth。
