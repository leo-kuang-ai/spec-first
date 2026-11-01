---
title: "Compound 核心链路同步后优化实施计划"
type: archive
status: superseded
created: 2026-04-14
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# Compound 核心链路同步后优化实施计划

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

- 日期：`2026-04-14`
- 适用仓库：`spec-first`
- 背景基线：
  - [核心链路逐 commit 同步矩阵](/Users/kuang/xiaobu/spec-first-doc/业界学习/04-能力映射/8.核心链路逐commit同步矩阵-v1.md)
  - [逐文件深度审查报告](/Users/kuang/xiaobu/spec-first/docs/validation/2026-04-14-compound-core-workflow-matrix-deep-audit-report.md)
  - [最终审查报告](/Users/kuang/xiaobu/spec-first/docs/validation/2026-04-14-compound-core-workflow-final-audit-report.md)

## 1. 目标

当前 `spec-first` 已完成对 `compound-engineering-plugin` 核心工作流批次 A-D 的同步，且逐文件审查结论成立：

- `54` 个有上游对应文件已完成逐文件核对
- `1` 个 local-only 保留文件已明确标注
- `2` 个 discoverability write-back 文件已回写
- 机械对照与人工分类一致：`19 exact / 5 namespace equal / 30 intentional divergence`

本计划不再解决“是否同步成功”，而是解决下一阶段问题：

1. 如何把本轮同步结果从“高质量一次性审查”升级成“低维护成本、可持续追上游”的工程能力
2. 如何把已经在审查报告中讲清楚的规则，沉淀成 repo 内可执行、可验证、可复用的 contract 与治理模板

## 2. 总体判断

当前还存在 4 类需要继续收敛的能力缺口：

1. `contract 回归保护`
2. `shared commit 治理模板化`
3. `beta 路线的真实运行验证`
4. `审查与比对的工具化`

因此，后续优化不应继续以“补说明文档”为主，而应优先按下面顺序推进：

1. 先固化 `contract`
2. 再固化 `governance`
3. 再补 `runtime / delegation` 真实验证
4. 最后补 `tooling`

## 3. 优化原则

### 原则 1：先锁住已修复问题，再追求可维护性

像 `plan-handoff` 里误写 `spec-doc-review mode:headless` 这种问题，已经说明仅靠人工审查不够。凡是已经踩过的真实坑，优先转成测试或 contract guard。

### 原则 2：共享 commit 规则必须下沉到模板，而不是停留在报告

“`owner 定语义，file-affinity 落地`”已经证明是正确口径，但只写在审查报告里还不够。后续如果继续追批次 E/F，必须让实施者直接从模板继承这套规则，而不是重新讨论。

### 原则 3：beta contract 必须至少有一次真实运行证据

`spec-work-beta` 当前已完成 contract 层同步，但如果没有真实 executor 演练，结论仍然偏弱。beta 能力不要求马上大规模使用，但必须能被最小任务验证。

### 原则 4：审查结论要有可重复来源

像 `19 exact / 5 namespace equal / 30 intentional divergence` 这样的统计值，不应永远依赖人工临时拼命令。下一轮继续追上游时，应能快速复算。

## 4. 优先级与执行顺序

建议按下面顺序执行：

1. `任务 1`：补 `contract` 回归保护
2. `任务 2`：shared commit 治理模板化
3. `任务 5`：`spec-compound` reviewer routing / discoverability 漂移检测
4. `任务 4`：固化 `mode:autofix` 的语义边界说明
5. `任务 3`：运行 `spec-work-beta` 的真实 delegation 演练
6. `任务 6`：逐文件机械对照脚本化
7. 收尾：清理提交边界，拆分 compound 与 graph-bootstrap 无关改动

排序依据：

- `任务 1` 和 `任务 2` 会直接决定后续改动是不是容易再回归
- `任务 5` 能降低 knowledge 链路的静默漂移风险
- `任务 4` 是治理解释固化，不是功能修复，但能减少误判
- `任务 3` 和 `任务 6` 虽然重要，但建立在前面规则已经稳定的前提下更合理

## 5. 逐项优化方案

### 任务 1：给 `plan-handoff` 补 contract 回归保护

**问题现状**

- [plan-handoff.md](/Users/kuang/xiaobu/spec-first/skills/spec-plan/references/plan-handoff.md) 已修复 `spec-doc-review mode:headless`
- 但当前防回归主要靠人工审查和 `rg`
- 未来继续同步上游时，仍可能再次把不存在的 mode 写回

**最佳实践**

把“skill 文档不得引用仓库当前不存在的 workflow 调用模式”沉淀成 unit-level contract test。

**建议落点**

- 新增：
  - [workflow-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/workflow-contracts.test.js)

**第一批应覆盖的 contract**

1. `skills/spec-plan/references/plan-handoff.md` 不得要求 `spec-doc-review mode:headless`
2. `skills/spec-doc-review/SKILL.md` 的允许模式与 handoff 文档描述必须一致
3. `skills/spec-work/SKILL.md` 主文档不得重新写回调用层硬编码 `mode:autofix`
4. `skills/spec-work-beta/SKILL.md` 主文档不得重新写回调用层硬编码 `mode:autofix`

**实施步骤**

1. 参考现有 [spec-graph-bootstrap-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/spec-graph-bootstrap-contracts.test.js) 的写法，使用简单字符串 contract 检查
2. 先只校验最关键的禁止性约束，不做复杂解析
3. 将测试纳入现有 unit test 运行路径

**验证方式**

- 运行新增 unit test
- 运行至少一轮 `npm test` 或当前仓库认可的 unit/smoke 组合

**完成标准**

- 如果有人重新写入 `spec-doc-review mode:headless`
- 或重新把调用层硬编码 `mode:autofix` 写回主 `SKILL.md`

测试必须直接失败

---

### 任务 2：把 shared commit 规则从审查结论升级成实施模板

**问题现状**

当前正确口径已经统一为：

- `owner-batch` 负责 shared commit 的语义边界、迁移范围、保留分叉与 handoff
- `file-affinity` 批次负责真实文件实施与验证

但这套规则目前主要固化在：

- [8.核心链路逐commit同步矩阵-v1.md](/Users/kuang/xiaobu/spec-first-doc/业界学习/04-能力映射/8.核心链路逐commit同步矩阵-v1.md)
- [matrix-deep-audit-report.md](/Users/kuang/xiaobu/spec-first/docs/validation/2026-04-14-compound-core-workflow-matrix-deep-audit-report.md)

仓库内仍存在旧口径残留，例如：

- [2026-04-13-spec-first-sync-compound-engineering-updates-requirements.md](/Users/kuang/xiaobu/spec-first/docs/brainstorms/2026-04-13-spec-first-sync-compound-engineering-updates-requirements.md)

其中仍保留 “`owner-batch` 负责覆盖全部真实文件落点” 的旧表达。

**最佳实践**

共享 commit 规则不能只存在于复盘文档里，必须下沉到矩阵模板和需求/计划文档的标准字段。

**建议落点**

- 更新：
  - [2026-04-13-spec-first-sync-compound-engineering-updates-requirements.md](/Users/kuang/xiaobu/spec-first/docs/brainstorms/2026-04-13-spec-first-sync-compound-engineering-updates-requirements.md)
  - [8.核心链路逐commit同步矩阵-v1.md](/Users/kuang/xiaobu/spec-first-doc/业界学习/04-能力映射/8.核心链路逐commit同步矩阵-v1.md)
- 新增：
  - [shared-commit-handoff-template.md](/Users/kuang/xiaobu/spec-first/docs/templates/shared-commit-handoff-template.md)

**模板字段最小集**

1. `owner-batch`
2. `shared-with`
3. `owner-handoff`
4. `real-file-owner`
5. `verification-owner`

**实施步骤**

1. 清理旧口径源文档中的错误表达
2. 在矩阵文档中补“shared commit 填写模板”
3. 为后续批次建立可复用模板文件
4. 要求 shared commit 的 `notes` 至少写清：
   - 语义裁决在哪个批次做
   - 真实文件在哪个批次落地
   - 哪个批次负责验证

**验证方式**

- 全仓 `rg` 搜索 shared commit 旧口径，确认不再出现互相冲突表述
- 下一轮新增 shared commit 时能直接套模板

**完成标准**

仓库内不再存在“两套 shared commit 责任模型”

---

### 任务 3：给 `spec-work-beta` 做真实 delegation 演练

**问题现状**

- [spec-work-beta/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-work-beta/SKILL.md) 已完成 delegation contract 对齐
- [codex-delegation-workflow.md](/Users/kuang/xiaobu/spec-first/skills/spec-work-beta/references/codex-delegation-workflow.md) 已存在
- 但目前仍缺一次真实的 executor 级验证

**最佳实践**

beta workflow 至少需要一次低风险、最小范围的真实运行，证明 contract 不只是“文档上成立”。

**建议落点**

- 新增验证报告：
  - [spec-work-beta-delegation-e2e-report.md](/Users/kuang/xiaobu/spec-first/docs/validation/spec-work-beta-delegation-e2e-report.md)

**实施步骤**

1. 选择一个低风险、单文件、低耦合、小范围任务
2. 以 `spec:work-beta delegate:codex` 跑一次最小 delegation
3. 核对：
   - config resolution
   - `delegate:codex` / `delegate:local` 优先级
   - gating / consent 行为
   - review / testing / shipping 路径是否闭环
4. 把运行结论写成验证报告

**验证方式**

- 至少保留一次真实运行证据
- 报告能明确回答：
  - delegation contract 是否可执行
  - 哪一步仍有 friction
  - 是否需要继续补 source-of-truth 说明

**完成标准**

`spec-work-beta` 不再只是“文档合同级同步”，而是有最小真实运行证据

---

### 任务 4：把 `mode:autofix` 的语义边界说明固化到 source-of-truth 附近

**问题现状**

已确认：

- [skills/spec-work/references/shipping-workflow.md](/Users/kuang/xiaobu/spec-first/skills/spec-work/references/shipping-workflow.md)
- [skills/spec-work-beta/references/shipping-workflow.md](/Users/kuang/xiaobu/spec-first/skills/spec-work-beta/references/shipping-workflow.md)

中的显式 `mode:autofix` 与上游当前文本一致，不是本地漏迁。

但这一判断当前主要沉淀在审查报告中，而不是 source-of-truth 附近。

**最佳实践**

凡是“容易被误判成 drift、但本质上是 shared commit 语义边界”的点，应在最接近 source-of-truth 的治理文档中固化，而不一定直接改执行文案。

**建议落点**

- 首选更新：
  - [8.核心链路逐commit同步矩阵-v1.md](/Users/kuang/xiaobu/spec-first-doc/业界学习/04-能力映射/8.核心链路逐commit同步矩阵-v1.md)
- 备选补充：
  - [spec-work/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-work/SKILL.md)
  - [spec-work-beta/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-work-beta/SKILL.md)

**推荐做法**

1. 以矩阵 notes 作为主解释面
2. 如有必要，在主 `SKILL.md` 的 dispatch / review routing 段落补一句简短说明：
   - dispatch mode guidance 与 shipping reference wording 是两层语义

**验证方式**

- 未来维护者不需要翻审查报告，也能理解为什么 shipping reference 还保留显式 mode

**完成标准**

“显式 `mode:autofix` 仍存在于 shipping reference” 不再被误判为未同步完成

---

### 任务 5：给 `spec-compound` reviewer routing 与 discoverability 补漂移检测

**问题现状**

[spec-compound/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-compound/SKILL.md) 已完成：

- stack-aware reviewer routing
- `docs/solutions/` discoverability check

但这条链路高度依赖真实 agent 集合与 instruction file 内容，未来容易产生静默漂移。

**最佳实践**

凡是在 skill 文档里显式列举真实 agent 名称、真实目录入口的地方，都应该有轻量 existence check。

**建议落点**

- 新增或并入：
  - [workflow-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/workflow-contracts.test.js)

**应补的检查**

1. `spec-compound/SKILL.md` 中引用的 reviewer agent 必须在 `agents/review/` 下存在
2. `AGENTS.md` / `CLAUDE.md` 中关于 `docs/solutions/` 的 discoverability 提示必须存在
3. `docs/solutions/` 目录必须存在

**实施步骤**

1. 从 `spec-compound` 文档中提取当前关键 reviewer 名称
2. 做 existence check
3. 为 `AGENTS.md` / `CLAUDE.md` 的 discoverability 描述做最小 contract test

**验证方式**

- 删除 reviewer、改名、或误删 discoverability 提示时，测试直接失败

**完成标准**

knowledge 链路不再依赖人工长期记忆维持正确性

---

### 任务 6：把逐文件机械对照脚本化

**问题现状**

本轮已经人工跑出并写入报告：

- `19 exact`
- `5 namespace equal`
- `30 intentional divergence`

但统计过程仍是一次性操作，下轮继续追上游时还要重新人工组装。

**最佳实践**

“矩阵驱动的逐文件比对”应由脚本负责复算，报告只负责解释原因和裁决差异。

**建议落点**

- 新增：
  - [compare-compound-matrix.js](/Users/kuang/xiaobu/spec-first/scripts/compare-compound-matrix.js)

**脚本职责**

输入：

1. 本地矩阵文档路径
2. 上游项目根目录

输出：

1. exact 数量
2. namespace-equal 数量
3. real diff 数量
4. 缺失文件
5. 分类错配

**第一版边界**

- 仅服务 compound 核心链路同步
- 不追求通用到整个仓库
- 不自动生成结论，只输出事实统计

**验证方式**

- 用当前矩阵跑出与审查报告一致的结果

**完成标准**

下轮继续追上游时，数字可以快速复算，不需要重新手工统计

## 6. 与当前工作树边界相关的额外建议

当前工作树中还有一组与 compound 审查无直接关系的 `spec-graph-bootstrap` 历史验证文档说明改动。

这类改动本身不一定错误，但如果与 compound 核心工作流同步一起提交，会带来两个问题：

1. 让本次“逐文件对齐上游核心工作流”的提交边界变得模糊
2. 降低后续代码审查与升级审计的可追溯性

**建议做法**

1. compound 核心工作流同步与审查文档单独成一组提交
2. `spec-graph-bootstrap` 的历史说明修订单独提交
3. 若短期不拆 commit，至少在提交说明中显式分组

## 7. 建议的提交边界

建议拆成 4 组：

### 提交 A：contract hardening

范围：

- `tests/unit/workflow-contracts.test.js`
- 可能涉及的 `skills/spec-plan/references/plan-handoff.md`
- 可能涉及的 `skills/spec-work/SKILL.md`
- 可能涉及的 `skills/spec-work-beta/SKILL.md`

目标：

- 锁住已修复 contract，不允许回归

### 提交 B：shared commit governance cleanup

范围：

- `docs/业界分析/8.核心链路逐commit同步矩阵-v1.md`
- `docs/brainstorms/2026-04-13-spec-first-sync-compound-engineering-updates-requirements.md`
- `docs/templates/shared-commit-handoff-template.md`

目标：

- 仓库内只保留一套 shared commit 责任规则

### 提交 C：compound routing / discoverability guard

范围：

- `tests/unit/workflow-contracts.test.js`
- `skills/spec-compound/SKILL.md`（若需要）
- `AGENTS.md` / `CLAUDE.md`（若需要）

目标：

- 防止 knowledge 链路静默漂移

### 提交 D：delegation validation + compare tooling

范围：

- `docs/validation/spec-work-beta-delegation-e2e-report.md`
- `scripts/compare-compound-matrix.js`

目标：

- 为 beta 路线与下一轮同步提供可重复证据

## 8. 最终建议

如果只能先做一部分，优先级必须是：

1. `任务 1：contract 回归保护`
2. `任务 2：shared commit 模板化`
3. `任务 5：compound routing / discoverability 漂移检测`

因为这三项直接决定：

- 已修复问题会不会反复出现
- 后续是否还会重新争论 shared commit 责任边界
- knowledge 链路会不会在无人察觉的情况下慢慢失效

而 `任务 3` 与 `任务 6` 更像是能力增强：

- `任务 3` 补真实运行证据
- `任务 6` 降低未来同步维护成本

两者都重要，但应建立在前面 contract 与治理规则已经稳定的前提下推进。

## 9. 结论

这轮后续优化的核心不是“继续写更多审查文档”，而是把本次审查中已经证明正确的规则，下沉为：

1. 可执行测试
2. 可复用模板
3. 可验证 beta 证据
4. 可重复统计工具

这样 `spec-first` 对 `compound-engineering-plugin` 的同步能力，才会真正从“本轮做对了”升级为“以后还能稳定做对”。
