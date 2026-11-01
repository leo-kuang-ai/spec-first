---
title: "spec-graph-bootstrap 目标闭环优化方案"
type: plan
status: superseded
date: 2026-04-15
origin: docs/01-需求分析/spec-graph-bootstrap需求/修订终版.md
---

# spec-graph-bootstrap 目标闭环优化方案

## 1. 问题重述

当前 `spec-graph-bootstrap` 已完成大量基础设施建设：

- `spec-first crg` 已成为可运行的本地事实引擎
- `spec-graph-bootstrap` 已形成 Phase 0-4 的源 skill 契约
- `spec-plan` / `spec-work` / `spec-code-review` 已写入 Stage-0 预载入口
- 安装、命令接线、运行时适配、CRG e2e 已基本打通

但如果以终为始，真正要达成的目标不是“生成更多文档”，而是：

1. 让 agent 在 `plan / work / review` 中更快进入正确上下文
2. 让 agent 读取更少但更准的上下文文件
3. 让 agent 在入口识别、风险判断、测试联读、review 补充面上更稳定
4. 让 Stage-0 产物成为可验证、可维护、可增量刷新的上下文分发系统

当前最大问题不是“Phase 0-3 有没有代码”，而是“这些代码是否已经形成 AI 效能闭环”。

本方案回答的核心问题是：

**为了真正达成目标，`spec-graph-bootstrap` 下一阶段还需要做哪些优化。**

---

## 2. 结论先行

当前系统的成熟度可以定义为：

**MVP 底座已成立，目标闭环尚未成立。**

这意味着：

- 可以继续作为 Stage-0 主线演进
- 不应仅凭“产物已能生成”宣布目标达成
- 不应在闭环证据不足时删除旧 Stage-0 bootstrap

下一阶段优化重点不应继续扩充 narrative 资产，而应把 `spec-graph-bootstrap` 从：

**知识资产生成器**

推进为：

**可验证的上下文分发系统**

---

## 3. 优化目标

本轮优化的目标不是新增更多文件，而是完成以下 6 个闭环：

1. **契约闭环**：source skill、样本、测试、运行时行为口径一致
2. **消费闭环**：后续 workflow 稳定命中正确上下文，而不是“提示里写着会读”
3. **收益闭环**：能证明 Stage-0 产物降低了无关扫描、提高了判断质量
4. **确定性闭环**：关键路由与求值逻辑具备 deterministic evaluator，而不完全依赖 prompt 执行
5. **维护闭环**：产物刷新、失效传播、样本更新和 contract drift 有清晰机制
6. **收敛闭环**：v1 只保留真正高 ROI 的产物与规则，避免继续膨胀

---

## 4. 当前全局诊断

## 4.1 已成立的能力

- CRG 本地事实引擎已可运行，且 `build / stats / context / query / review-context` 等链路已有自动化验证。
- `spec-first init --claude/--codex` 已能把 `graph-bootstrap` 命令、skill、agent 正确同步到运行时。
- `spec-plan / spec-work / spec-code-review` 已具备“先读 `injection-index.yaml`，失败时降级”的入口约束。
- Host readiness、graph readiness、native module readiness 已有明确的检测与降级路径。

## 4.2 仍未闭环的问题

### A. 契约没有完全锁死

当前仓库中同时存在：

- 源 skill 契约
- checked-in sample 产物
- 消费型 skill 预载约定
- 历史文档与验证记录

这些层面已经出现口径漂移。漂移一旦发生，agent 实际消费的上下文就会逐步偏离 source-of-truth。

### B. 消费入口已经接上，但消费执行仍偏软约束

当前 `spec-plan / spec-work / spec-code-review` 里写的是“应读取哪些文件”。这对 agent 是重要提示，但不等于有一个确定性 evaluator 在执行：

- 解析 slug
- 读取 yaml
- 求值 selection rules
- 去重并排序文件
- 记录 fallback reason

结果是消费规则“存在”，但消费行为还缺少强执行保障。

### C. 收益没有被量化

当前最缺的不是再多一个 `context-pack`，而是回答这些问题：

- 加入 Stage-0 后，`spec-plan` 是否少扫了无关文件
- `spec-code-review` 是否更稳定命中高风险模块与相关测试
- fallback 命中率是多少
- 被注入文件中，真正被引用的比例是多少
- 同一任务在有无 Stage-0 时，输出质量是否有显著差异

没有这些数据，就无法证明“提升 AI 编码质量”已经发生。

### D. 产物层与执行层耦合方式仍然偏 prompt-native

事实层来自真实代码与图谱，这一层是强项；但从事实层到文档层、从文档层到消费层，仍主要依赖 prompt 契约组织。这样会削弱：

- 可重复性
- 强回归测试能力
- 大规模维护成本控制

### E. v1 边界仍有膨胀风险

如果下一阶段继续新增 task types、更多 packs、更多 narrative 文档，而不先锁定“消费正确性”和“收益证明”，会把系统做成更复杂的文档工厂，而不是更有效的 agent 系统。

---

## 5. 优化原则

下一阶段所有优化都应遵循以下原则：

### 5.1 先证明被消费，再扩产物

任何新增文档、pack 或 selection rule，必须先回答：

- 谁会消费
- 在哪个 stage 消费
- 如何验证它被消费
- 它能减少什么扫描或减少什么误判

### 5.2 先锁定 contract，再做增强

凡是 source skill、checked-in sample、合同测试、运行时副本四者口径不一致的地方，优先修复，不继续加新能力。

### 5.3 让高价值路径 deterministic

以下路径不应只靠 prompt 约束：

- Stage-0 路由求值
- fallback 判定
- 文件去重与排序
- sample 生成
- 指标采集

### 5.4 narrative 必须服从 decision support

文档的目标不是“写得更完整”，而是帮助 agent 更快做对决策。任何 narrative 资产都不应压过：

- public entrypoints
- high-risk modules
- test map
- review-change

### 5.5 用真实项目和真实任务验收

最终 gate 不能只看本仓库自己的静态测试，还要看至少两个真实项目上的真实任务。

---

## 6. 六大优化支柱

## 6.1 支柱一：Contract 收口

### 目标

消除 source skill、checked-in sample、合同测试、历史文档之间的漂移。

### 当前问题

- `injection-index.yaml` checked-in sample 与当前源 skill 已出现偏差
- 历史验证记录与当前头状态存在时间差
- v1 当前真实结构与旧需求草案仍有残留混用

### 优化方案

1. 把 `skills/spec-graph-bootstrap/SKILL.md` 的 Phase 4 yaml 样例定义为唯一真源。
2. 增加一个 **sample generator**，从真源模板或结构化常量自动生成 `docs/contexts/spec-first/injection-index.yaml` 样本。
3. 将当前 `spec-graph-bootstrap-contracts.test.js` 从“检查手写样本”升级为“检查 source skill -> generated sample -> consumer expectations”三者一致。
4. 对历史验证文档加统一时点标记，明确“历史记录”与“当前基线”。

### 验收标准

- `npm test` 全绿
- checked-in sample 不再手工维护
- 任一 Phase 4 路由变更会自动触发 sample 和 contract test 更新

### ROI

极高。这是当前最直接的阻断项。

---

## 6.2 支柱二：Deterministic Context Evaluator

### 目标

把 Stage-0 路由求值从“prompt 中描述的步骤”升级为“可被调用、可被测试的 evaluator”。

### 当前问题

`spec-plan / spec-work / spec-code-review` 虽然写了预载步骤，但并没有一个仓库内共享的、确定性的求值器来完成：

- slug 解析
- context 目录发现
- yaml 解析
- `always + stages + output_exists.*` 求值
- 文件存在性检查
- 去重
- advice 返回
- fallback level 与 reason 记录

### 优化方案

新增 `src/context-routing/` 模块，提供只读 evaluator：

- `resolveContextSlug(repoRoot)`
- `loadInjectionIndex(contextDir)`
- `evaluateStage0Context({ stage, repoRoot })`
- `dedupeAndOrderPaths(paths)`
- `formatFallbackReason(result)`

消费型 skill 不需要完全改成硬执行器，但至少应：

- 在文档里继续保留可读流程
- 在运行时优先调用 evaluator 生成“应读取文件列表”
- 把 evaluator 输出作为 prompt 中的结构化输入

### 产出

- 一个共享 evaluator 模块
- 一组 unit tests，覆盖 Level 1/2/3 降级
- 结构化结果对象：

```json
{
  "stage": "review",
  "level": "normal|level1|level2|level3",
  "files": ["00-summary.md", "code-facts/high-risk-modules.md"],
  "advice": "优先 code-facts 与 risk signals...",
  "skipped_rules": ["fact.*"],
  "fallback_reason": null
}
```

### 验收标准

- 三个消费 workflow 的“该读什么”可以由同一 evaluator 算出
- 不再依赖手写 yaml 样本去间接证明行为
- fallback 结果可被自动化测试断言

### ROI

极高。这是把“消费入口存在”推进到“消费行为可信”的关键一步。

---

## 6.3 支柱三：真实消费验证

### 目标

把 3A/3B 从“有记录”推进到“可复现、可回归、可比较”的真实任务实验。

### 当前问题

当前验证更多证明了：

- 规则存在
- 路由可读
- 降级可解释

但没有强证明：

- `spec-plan` 实际少读了哪些无关文件
- `spec-code-review` 实际多命中了哪些高价值上下文
- Stage-0 是否影响了输出质量

### 优化方案

新增 **goal-closure experiments**：

1. **Plan 实验**
   - 任务：新增简单接口或命令
   - 对照：有 Stage-0 / 无 Stage-0
   - 观察：是否命中 `module-map`、`public-entrypoints`，是否减少额外全仓扫描

2. **Review 实验**
   - 任务：修改 shared 模块或高风险模块
   - 对照：有 Stage-0 / 无 Stage-0
   - 观察：是否命中 `high-risk-modules`、`review-change`、`test-map`

3. **Work 实验**
   - 任务：执行一个中等复杂度变更
   - 观察：Stage-0 是否帮助确定测试面与风险边界

每个实验统一记录：

- expected_inputs
- actual_inputs
- fallback_reason
- irrelevant_files_scanned
- cited_stage0_assets
- verdict

### 验收标准

- 至少 2 个真实项目完成最小实验
- 每个实验可重复执行
- 能输出 before/after 差异结论

### ROI

极高。这是“达成目标”能否被证明的关键。

---

## 6.4 支柱四：AI 效能指标体系

### 目标

把“感觉更好用”转化为可跟踪的指标。

### 指标分层

#### 输入层指标

- Stage-0 命中率
- fallback 命中率
- 每个 stage 平均注入文件数
- 被跳过的 `fact.*` 规则数

#### 过程层指标

- agent 额外扫描的 repo 文件数
- 是否回扫源码补洞
- 是否引用了 Stage-0 资产
- 被引用的资产类型分布

#### 结果层指标

- 入口识别正确率
- 高风险模块命中率
- 相关测试命中率
- review 附加风险点命中率
- 无关文件扫描下降比例

### 优化方案

新增轻量 instrumentation：

- evaluator 输出日志
- 实验记录模板
- `docs/validation/` 汇总脚本

不要求 v1 一开始就做复杂 BI，只要求能沉淀结构化记录。

### 验收标准

- 每次实验都能产出结构化指标
- 至少有一份跨实验汇总报告
- 可以回答“是否真的更快、更准”

### ROI

高。它决定系统是否有继续投资价值。

---

## 6.5 支柱五：产物瘦身与分层

### 目标

避免 Stage-0 持续膨胀为大而全知识库，保持高价值资产优先。

### 当前问题

当前系统天然有扩张冲动：

- 更多 task types
- 更多 packs
- 更多 summary
- 更多选择规则

但这些增强不一定提高 agent 效能，反而可能增加注入噪声与维护成本。

### 优化方案

把产物分三层：

1. **核心层**
   - `00-summary.md`
   - `module-map.md`
   - `public-entrypoints.md`
   - `test-map.md`
   - `high-risk-modules.md`
   - `review-change.md`
   - `injection-index.yaml`

2. **辅助层**
   - `README.md`
   - `pitfalls/index.md`

3. **增强层**
   - 更多 task packs
   - 更多 task_type branches
   - 任何数据库或外部 graph 增强资产

策略：

- v1 只对核心层做强 contract、强测试、强消费验证
- 辅助层可存在，但不作为主收益证明对象
- 增强层必须以实验收益驱动，不得先做一大堆再找用途

### 验收标准

- 每个核心资产都有明确消费方
- 每个核心资产都有被引用或被验证的证据
- 增强资产不会进入默认注入路径，除非有明确收益

### ROI

高。它防止系统后续退化成复杂文档工厂。

---

## 6.6 支柱六：增量刷新与失效传播

### 目标

把“能够 rerun”推进到“知道什么时候该刷新什么”。

### 当前问题

需求中已经强调 `artifact-manifest.json`、依赖关系和局部失效，但当前强验证仍集中在 CRG 层，对 bootstrap 产物层的失效传播验证还不够。

### 优化方案

1. 正式定义 bootstrap 产物依赖图：
   - `module-map` 依赖 `modules + data_shapes`
   - `public-entrypoints` 依赖 `entrypoints`
   - `test-map` 依赖 `testing_surface`
   - `high-risk-modules` 依赖 `risk_signals`
   - `review-change` 依赖 `risk_signals + testing_surface + entrypoints`
2. 为 `artifact-manifest.json` 增加明确的 output dependency schema。
3. 增加失效传播测试：
   - 改入口文件，只刷新 `public-entrypoints` 与相关 pack
   - 改 shared/high-risk，只刷新 `high-risk-modules` 与 `review-change`
   - 改测试面，只刷新 `test-map`
4. 将 backup/restore 从 prompt 约束逐步推进到可验证的执行器逻辑。

### 验收标准

- 局部变更不会触发无谓全量重渲染
- 关键产物能按依赖局部刷新
- rerun 后 `artifact-manifest.json` 能解释本次变化

### ROI

中高。它决定系统能否长期维护。

---

## 7. 建议路线图

## 7.1 P0：先修阻断与真源收口

### 目标

恢复当前仓库的一致性，避免继续在漂移状态上开发。

### 工作项

- 修复 `injection-index.yaml` checked-in sample 与 source skill 的偏差
- 升级 `spec-graph-bootstrap-contracts.test.js`
- 明确历史验证文档的时点边界
- 统一 v1 当前结构口径：`always + stages + selection_rules(output_exists.*) + advice`

### 完成标准

- `npm test` 全绿
- 样本不再手工漂移
- 当前头状态下 contract 可以作为可信基线

---

## 7.2 P1：把消费逻辑从软约束推进到硬求值

### 目标

建立 deterministic context evaluator，并让消费 workflow 共享这一逻辑。

### 工作项

- 新增 `src/context-routing/` evaluator
- 覆盖 normal / level1 / level2 / level3 的 unit tests
- 消费型 skills 改为“文档保留 + evaluator 输出作为结构化输入”

### 完成标准

- 三个 stage 的应读文件集合可自动算出
- fallback reason 可结构化记录
- selection_rules 求值与 tests 完全一致

---

## 7.3 P2：做真实消费实验和收益证明

### 目标

证明 Stage-0 真的提升了 agent 效能。

### 工作项

- 完成至少 2 个真实项目实验
- 做有无 Stage-0 对照
- 统计无关扫描、命中上下文、引用率、判断质量差异
- 输出汇总报告

### 完成标准

- 至少 1 份跨项目汇总报告
- 可以客观回答“有没有变快、有没有变准”
- 满足旧 Stage-0 bootstrap 替换 gate 的证据要求

---

## 7.4 P3：再决定是否扩展 task types 与更多 packs

### 原则

只有在以下条件全部满足时，才继续扩展：

- contract 已锁死
- evaluator 已落地
- 真实消费实验通过
- 收益指标为正

否则，不进入更多 task types、更多 packs、更多 narrative 资产扩展。

---

## 8. 风险与取舍

## 8.1 最大风险

### 风险一：继续按阶段实现清单推进，而不先修闭环

后果：

- 系统看起来越来越完整
- 但 contract drift 会越来越多
- 真实收益依然无法证明

### 风险二：把 prompt 契约误当成执行保证

后果：

- 文档写了会读，不代表 agent 真稳定去读
- 回归测试很难覆盖真实行为

### 风险三：过早扩充资产

后果：

- 注入噪声变大
- 维护成本变高
- ROI 下降

## 8.2 关键取舍

本方案明确选择：

- 优先做 deterministic evaluator，而不是优先做更多 `task_type`
- 优先做真实消费实验，而不是优先做更多 narrative 文档
- 优先做指标与收益证明，而不是优先扩充产物树

---

## 9. 终局判断标准

只有当以下问题都能以证据回答时，才可以认为目标达成：

1. `spec-plan` 是否稳定命中正确的模块地图与入口文件
2. `spec-code-review` 是否稳定命中高风险模块、review-change 和相关测试
3. agent 是否减少了无关文件扫描
4. fallback 是否可解释且不会误导主任务
5. 关键路由规则是否由统一 evaluator 求值
6. checked-in sample、source skill、合同测试、运行时行为是否一致
7. 至少两个真实项目是否证明了正向收益

如果这些问题还有任一项不能被证据回答，就不应宣布：

- 目标已达成
- 旧 Stage-0 bootstrap 可以删除
- `spec-graph-bootstrap` 已完成终局收敛

---

## 10. 推荐执行顺序

建议严格按以下顺序推进：

1. **修 contract drift**
2. **建立 deterministic evaluator**
3. **补真实消费实验**
4. **建立效能指标**
5. **再讨论扩产物**

一句话总结：

**下一阶段最重要的优化，不是再让 `spec-graph-bootstrap` 生成更多内容，而是让它生成的内容被稳定消费、被量化验证、并被证明真正提升 agent 效能。**
