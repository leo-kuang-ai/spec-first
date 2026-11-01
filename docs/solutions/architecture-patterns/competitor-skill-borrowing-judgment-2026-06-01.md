---
title: 从竞品 skill 借鉴能力的判断方法论（80/20 + 双重过滤 + conditional 落地）
date: 2026-06-01
last_updated: 2026-06-04
category: docs/solutions/architecture-patterns
module: skill-evolution
problem_type: architecture_pattern
component: spec-prd
severity: medium
applies_when:
  - 用户给出一个外部/竞品 skill，要求分析「能借鉴什么提升本项目某个 skill」
  - 需要在「真实能力增益」与「保持 light contract / right-size 边界」之间做取舍
  - 借鉴对象与本项目 skill 产品基因不同（如传统 PM 完整模板 vs 工程证据增量模板）
  - 落地点是 skill prose / reference / template / eval 这类会投影到双宿主 runtime 的 source
  - 借鉴落地后 reference/template 数量继续膨胀，需要判断是否转入钢筋结构精简
tags: [competitor-analysis, skill-evolution, 80-20, conditional-enhancement, fresh-source-eval, spec-prd, steel-frame]
---

# 从竞品 skill 借鉴能力的判断方法论

## Context

用户给一个外部 skill（`chen-prd-skills`，传统 PM 流派的 10 章固定 PRD 模板 + 评审流程），要求"深度分析、能借鉴什么提升 `spec-prd`"。

这类任务的真实风险不是"分析不够多"，而是**借鉴判断失准**——典型失败模式有三个：

1. **基因错配照搬**：把借鉴对象的形态(固定 10 章模板、状态机、里程碑、编号封面)整体搬进来，违反本项目已有的 core+conditional 分层、WHAT-not-HOW、禁中心化状态机等边界。
2. **重复造轮子**：建议"借鉴"的东西本项目其实已有更强实现(如验收 G/W/T、readiness gate、稳定 ID trace)，因为没读全 source 就下判断。
3. **与既有判断冲突**：项目近期可能已对同一主题做过竞品分析/决策，新建议若与之矛盾或重复，制造多真相源。

本案最终只采纳了**一项**借鉴(目标可衡量性纪律)，其余十余项资产全部判为"已覆盖/边际递减/违反边界"而砍掉。结论质量来自方法，不来自分析量。

落地过程还暴露一个独立的 runtime 同步陷阱（见 When to Apply 第 4 点），与判断方法论无关但同批解决。

## Guidance

固定四步协议，脚本负责取证、LLM 负责语义判断：

### 第 1 步：读全两边 source + 校准基线（取证，不下判断）

- 读完借鉴对象**全部**文件，不止 SKILL.md。
- 读完本项目目标 skill 的**全部** reference / template / eval，否则会把"已有能力"误判为"待借鉴"。
- 读**角色契约 / 边界文档**(本项目是 `docs/methodology/结构化项目角色契约.md`)作为"什么该拒绝"的标尺。
- 检索项目近期是否已对同一主题做过分析/决策(本案命中 `docs/业界分析/14`、`15` 两份竞品+业界对标)。**与既有判断对齐是硬约束**，新建议必须显式声明与它们一致或解释差异。

### 第 2 步：双重过滤逐项打分（语义判断）

把借鉴对象的每项资产过两道独立筛子，缺一不可：

| 筛子 | 问题 | 不通过则 |
| --- | --- | --- |
| PM/能力价值 | 这项是否解决高频、高价值的真实问题？ | 砍(低价值) |
| 项目边界 | 是否符合 light contract / right-size / source-runtime / WHAT-not-HOW / 禁状态机？ | 砍(越界) |
| 覆盖检查 | 本项目是否已有等价或更强实现？ | 砍(重复) |

用一张表逐项列 `借鉴项 / 本项目现状 / 价值 / 边界判断 / 裁决`，让砍与留都有据可查。

### 第 3 步：80/20 收口到最小集（边际成本判断）

过完筛子后，再用边际效应 vs 边际成本压一遍：已被覆盖的、carrying cost 陡升的、只是"加密度而非加能力"的，默认不进核心。本案从"值得借鉴"的 4-5 项进一步收到**1 项**(目标可衡量性)，其余归为"边际递减"。

> 关键心法：**借对象的"功底/纪律"，不借对象的"形态/仪式"。** 本案借的是传统 PM 的 SMART + baseline + leading/lagging 目标质量纪律，不借它的 10 章模板和评审状态机。

如果多轮借鉴或实战修补后，目标 skill 开始靠新增 lens、reference、模板树来承接每个新场景，这已经超出本文的"借什么"判断范围。此时转入钢筋结构精简：先找不可丢的承重判断轴，再把重复边界迁移到少量核心 reference 和 contract tests 中，避免借鉴成功反而让 skill 膨胀。

### 第 4 步：conditional 落地 + 双护栏 + fresh-source eval（落地与验证）

- 落地形态优先 **conditional 增强**，不改 workflow 骨架、不加公开入口、不扩 core section 集合。
- 每处改动加**护栏**抵消副作用。本案的目标质量纪律自带两条张力：可能逼 LLM 编数字、可能把小增量变重。对应两道护栏写进每处改动：
  - "无可信指标时降级为可观察口径或入 Assumptions，**绝不编造目标值**"(守 no-invention)
  - "小增量缺席本节不算 gap"(守 right-size)
- 改完 source 必须按 `docs/contracts/workflows/fresh-source-eval-checklist.md` 做 fresh-source eval(全新 subagent 只读磁盘 source)，并跑相关 contract 测试。
- CHANGELOG 同步；`spec-first init` 重新生成双宿主 runtime，不手改 mirror。

## Why This Matters

竞品分析类任务最容易产出"看起来很全、实则有害"的建议——把别人的完整模板搬进一个刻意保持轻量的系统。本方法把判断锚定在**边界 + 覆盖 + 边际成本**三个硬约束上，使"砍"成为默认动作、"留"必须举证，从而：

- 保护 light contract 与 right-size，不让 skill 因"借鉴"而膨胀。
- 避免多真相源(与既有竞品分析/决策对齐)。
- 让每项采纳都能追溯到一个真实能力缺口(本案:Goals 节"只反编造、不给合格标准"的结构性弱项)。

## When to Apply

1. **任何"分析竞品/外部 skill 能借鉴什么"的请求**——先走四步协议，不要直接列"可借鉴清单"。
2. **借鉴对象与本项目基因不同时**(完整模板 vs 增量证据、人工评审 vs 机器消费)——基因差异表是第一层产出，决定哪些形态天然不可搬。
3. **采纳项落在会投影到 runtime 的 source 时**——必走 fresh-source eval + contract 测试 + `init` 再生。
4. **开发态用全局 `spec-first` 命令验证 runtime 时的陷阱**:全局包若是 `npm install -g` 的**实体拷贝**(非 `npm link`)，`spec-first init` 会从**全局旧副本**取 skill source，导致改了工作副本 source 但 mirror 写入旧内容。现象:mirror 文件 mtime 更新、内容却是旧的。解法:先 `npm install -g .` 用当前仓库重装全局，再 `init`。这是开发模式固有约束(`dev-reload.sh` / `install-local.sh` 已指明该流程)，**不是 generator 逻辑 bug**——排查时先确认 `which spec-first` 指向，别去改 generator。

## Examples

本案的判断表(节选,完整见 CHANGELOG v1.9.0 2026-06-01 18:41:51 条目):

```text
借鉴项                          本项目现状              裁决
SMART目标+baseline+衡量时间      Goals表缺baseline/时间   ✅借鉴(唯一采纳)
leading/lagging指标分层          仅按业务/用户/运营分      ✅搭车(同一处改动)
错误→正确教学密度               已有vague-wording检查     ✗砍(加密度非加能力)
量化痛点公式                    Problem Frame已conditional ✗砍(brownfield常N/A)
US→FR双层映射                   Use Cases已覆盖           ✗砍(增ceremony)
10章固定模板/状态机/里程碑/编号  core+conditional更优      ✗砍(违反边界)
```

最终落地 4 处 conditional source 改动(00 模板 Goals 表 / readiness-lens 第12条 goal-measurability / output-template 措辞 / evals 对偶用例)，fresh-source eval = passed(无 P1/P2)，13+6 contract 测试全绿。

## Related

- `docs/methodology/结构化项目角色契约.md` — 边界标尺(§3 核心哲学、§7 设计判断矩阵、§10 80/20)
- `docs/业界分析/14.prd-skill-竞品分析-2026-05-30.md` — 同主题既有竞品分析(差异化主线:current-state + 证据 + 工程交接;反模式:再写更长模板)
- `docs/业界分析/15.prd-内容规范与模板-业界对标-2026-05-30.md` — 业界 PRD 骨架对标 + "有证据则填、无则入 Assumptions"调和方案
- `docs/contracts/workflows/fresh-source-eval-checklist.md` — skill prose 变更的语义验证规范
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md` — source-first，不手改 runtime mirror
- `docs/solutions/architecture-patterns/upstream-ce-sync-upgrade-methodology-2026-04-26.md` — 同源"脚本取证 + LLM 语义适配"协议(上游同步场景)
- `docs/solutions/architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md` — 后续方法论：当借鉴和修补让 skill/reference/template 树膨胀时，如何收束为钢筋结构
