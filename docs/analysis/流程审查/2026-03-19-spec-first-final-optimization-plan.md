# Spec-First 最终优化方案

> 方案目标：在保留 SDD 质量控制和可追踪性的前提下，把 Spec-First 从“工程上可用”打磨成“团队能高频、低阻力使用”的研发流程 skill 集合。
>
> 说明：本文是**目标态优化方案**，不是当前实现说明；当前状态与门禁细节以流程审查文档和实际代码为准。

## 1. 方案定位

Spec-First 的最佳产品形态不是通用 AI 助手，而是一套 **研发流程 skill 集合**。  
它应该为研发团队提供三件事：

- 清晰的阶段推进与质量控制
- 低摩擦的诊断、恢复、同步与分析能力
- 可审计、可回放、可追踪的研发过程记录

最终目标不是减少规则，而是让规则更容易理解、更容易执行、更容易恢复。

## 2. 最佳实践原则

### 2.1 保留强流程，降低表达复杂度

业界成熟的研发流程工具通常遵循一个原则：

- 高风险、不可回滚、影响交付质量的环节要有硬门
- 低风险、只读、诊断、恢复类操作要尽量随时可用
- 用户看到的应是“下一步动作”，不是“内部实现细节”

Spec-First 应当保留：

- 阶段门禁
- 质量门禁
- traceability
- gate history
- findings / task_plan / stage-state 等记录边界

但应该弱化：

- 对外暴露过多的内部术语
- 将记录文件与门禁职责混用
- 让用户必须理解过多中间状态才能继续推进

### 2.2 让 skill 的可用性分层，而不是统一硬门

最佳实践不是让所有 skill 都随时可用，也不是让所有 skill 都被门禁卡死。
更合理的做法是分层：

先定义两条判断准则：

- **条件可用** = 有明确 stage 绑定，但 skill 本身只产出质量/内容/证据，不直接推进阶段
- **阶段推进** = skill 的主要职责就是触发、决定或承接 stage advance / feature 切换

据此可分为四层：

1. **随时可用**
   - `catchup`
   - `status`
   - `doctor`
   - `sync`
   - `analyze`

2. **路由 / 控制型**
   - `plan`
   - `feature`

   这类 skill 应当低摩擦、可随时调用，但不直接推进阶段。

3. **条件可用（stage-bounded quality / generation）**
   - `spec-review`
   - `spec`
   - `design`
   - `task`
   - `review`
   - `verify`

   这类 skill 可以反复调用，但前提是 stage 对齐；它们不直接推进阶段，只负责把当前阶段的质量/内容做实。

   > 注：`research` 是 HARD-GATE 节点（`stage = 02_design`），归入第 4 层阶段推进型，不属于软提醒型。

4. **阶段推进 / 硬门节点**
   - `init`
   - `research`（stage-bounded，HARD-GATE）
   - `code`
   - `archive`
   - `orchestrate`

这样既保留质量纪律，又不让产品体验退化成”处处都要先过关”。

> 分层细则参见：[Spec-First Skill 可用性分层与软门禁方案](./2026-03-19-spec-first-soft-gate-accessibility-plan.md)

### 2.3 记录要服务于审计，不要反向成为门禁

业界最佳实践里，记录文件的职责应当稳定：

- `stage-state.json`：阶段状态
- `gate-history.jsonl`：门禁历史
- `findings.md`：证据、风险、结论
- `task_plan.md`：任务进度
- `traceability-matrix.md`：追踪关系

这些文件应当只做记录和回放，不应再反向要求用户把它们当成门禁条件的唯一入口。

### 2.4 runtime 与 docs 分层要稳定

最佳实践要求：

- `runtime` 给机器和后续 skill 作为轻量上下文
- `docs` 给研发人员阅读
- `docs-index.json` 只能作为阅读路由，不应升级为真源或二次门禁

如果 runtime / docs / records 的边界不稳定，后续 skill 的上下文注入和研发人员的理解都会混乱。

## 3. 当前合理的设计保留项

### 3.1 应该保留

- `stage` 门禁与阶段推进
- `verify / archive` 的质量控制
- `gate-history.jsonl` 的审计记录
- `traceability-matrix.md` 的需求追踪
- `findings.md` 作为过程证据落点
- `docs/first` 作为人类阅读输出

### 3.2 应该继续收敛

- `findings.md` 不要继续承担门禁职责
- `task_plan.md` 只管任务进度，不管审批
- `docs-index.json` 只做阅读索引，不做门禁
- `first` 保持验证入口定位，不回到生成器

## 4. 推荐的产品化改造

### 4.1 统一 skill 可用性标签

给每个 skill 增加统一的对外标签：

- 是否随时可用
- 是否需要前置阶段
- 是否会阻断
- 失败后先修什么

这会显著降低团队记忆负担。

### 4.2 把阻断反馈压缩成“最小修复路径”

当前流程的门禁解释偏工程化。  
更合理的产品化输出应该是：

- 缺什么
- 先补什么
- 该执行哪个 skill
- 是否需要 worktree / 审查 / 归档

即，用户看到的应是“下一步动作”，不是门禁原理讲解。

### 4.3 将只读 / 诊断类 skill 做成低摩擦入口

这类 skill 应该是：

- 默认可用
- 少前置
- 输出直接
- 不阻断用户继续看状态或修复问题

这会显著提高日常使用率。

## 5. 风险与取舍

### 5.1 不能过度简化

如果把门禁压得过低，系统会失去质量控制，变成“什么都能过”。  
这会损失 Spec-First 最核心的价值。

### 5.2 不能继续增加术语

如果继续增加硬门、软门、伴生门、路由门、记录门等术语，团队理解成本会持续上升。  
产品上这不是进步，而是认知负担。

### 5.3 不能让记录文件反客为主

一旦用户需要频繁决定“这是不是门禁文件”“这个是索引还是真源”，产品就失败了一半。  
系统应当尽量把这些判断收回到内部。

## 6. 最终优化路线

### 6.1 第一阶段

- 统一 skill 可用性分层
- 明确 `catchup/status/doctor/sync/analyze` 为随时可用
- 明确 `plan/feature` 为路由 / 控制型
- 明确 `spec-review/spec/research/design/task/review/verify` 为条件可用
- 明确 `init/code/archive/orchestrate` 为阶段推进
- 给每个 skill 补一条可执行的“何时可用 / 是否阻断 / 先修什么”的标签

### 6.2 第二阶段

- 压缩门禁解释文案
- 给出最小修复路径
- 降低内部文件对外暴露程度
- 统一 `research/spec-review` 的 stage-bounded 叙事，避免与审查文档再次分叉

### 6.3 第三阶段

- 继续收敛 `findings.md` / `task_plan.md` / `docs-index.json`
- 强化 runtime / docs / records 边界
- 保持 `first` 为验证入口，不回到生成入口

### 6.4 落点与验收

- 文档层落点：`skills/spec-first/*/SKILL.md`、`docs/analysis/*` 三份审查文档、`docs/analysis/2026-03-19-spec-first-final-optimization-plan.md`
- 代码层落点：`truth-source.ts`、`condition-registry.ts`、`hard-gate.ts`、`gate-evaluator.ts`、`dispatcher.ts`
- 执行承接：`docs/analysis/流程审查/2026-03-19-spec-first-skill-consolidation-implementation-plan.md`
- 验收标准：
  - `research` / `spec-review` 在优化方案里不再缺位
  - “条件可用”与“阶段推进”的定义一眼可判
  - 每个 skill 都能被归类到唯一一层
  - 优化路线能直接拆成后续 TASK，而不是停留在意图层

## 7. 结论

从业界最佳实践看，Spec-First 的方向是正确的，但要真正成为一套可高频使用的研发流程 skill 集合，还需要继续做三件事：

1. **降低认知负担**
2. **提高随时可用性**
3. **保留关键质量门**

最终形态应该是：

**一套能帮助研发团队更快、更稳、更可审计地完成 AI 辅助研发的流程 skill 集合。**
