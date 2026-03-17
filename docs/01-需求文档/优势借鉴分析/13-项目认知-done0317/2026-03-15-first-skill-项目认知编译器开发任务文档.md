---
title: First Skill 项目认知编译器开发任务文档
date: 2026-03-15
author: Anthropic SDD 技术研发团队
status: in_progress
version: 1.3
source_design: ./2026-03-15-first-skill-项目认知编译器优化方案.md
---

# First Skill 项目认知编译器开发任务文档

> 目标：将 `first` 从“项目介绍文档生成器”演进为“项目认知编译器”，并建立 `first -> skill consumption -> wrap_up/done -> 反向更新 canonical truth` 的完整闭环。

---

## 一、任务文档定位

本任务文档用于把设计方案拆解为可执行开发任务，覆盖：

- `Phase 0.5` 文档双轨收敛
- `Phase 1` 最小 canonical nucleus 扩展
- `Phase 2` `wrap_up/done` 反向更新闭环

本任务文档遵循以下原则：

1. 先收敛 truth model，再扩 rich assets
2. 先打通消费链路，再扩文档内容
3. 先做最小闭环，再做大而全增强

---

## 二、当前实现基线

当前代码已具备：

- 动态宿主链路：`skill-commands -> skill render -> loadSkill()`
- runtime 真源三资产：
  - `summary.json`
  - `role-views.json`
  - `stage-views.json`
- runtime 正式投影视图四文档：
  - `README.md`
  - `summary.md`
  - `role-views.md`
  - `stage-views.md`
- 后续 skill 摘要级注入：
  - `spec/design/code/verify` 消费 `stageViewSummary`
  - `onboarding` 消费 `roleViewSummary`
  - `task/plan/orchestrate` 消费 `firstSummaryLite`

当前未完成：

- `docs/first` 的 canonical / legacy 收敛
- rich assets 进入 runtime schema
- phase-aware skill consumption
- `wrap_up/done` 反向更新 first canonical truth

## 二点一、当前开发进度

截至 `2026-03-16`，当前推进状态如下：

- 已完成 `T01-T03`
  - 完成 `docs/first` canonical / legacy 边界收敛
  - 完成 `README` 投影视图边界说明
  - 完成 `first --help / --check-health / --skip` 文案收敛
- 已完成 `T04`
  - `steering.json` 已接入 runtime types / store / bootstrap / context / docs projection
- 已完成 `T05`
  - `conventions.json` 已接入 runtime types / store / bootstrap / context / docs projection
- 已完成 `T06`
  - `critical-flows.json` 已接入 runtime types / store / bootstrap / context / docs projection
  - 旧 runtime index 缺失 `steering / conventions / critical-flows` 时可兼容补齐，不会在 refresh / resume / context 读取时崩溃
- 已完成 `T07`
  - `change-map.json` 已接入 runtime types / store / bootstrap / context / docs projection
  - `handleFirst` 在 runtime truth 健康但 canonical docs 缺失时，会主动从 runtime 重新投影 docs
- 已完成 `T08`
  - `entry-guide.json` 已接入 runtime types / store / bootstrap / context / docs projection
  - 当前 runtime canonical asset 已扩展到 `summary / role-views / stage-views / steering / conventions / critical-flows / change-map / entry-guide`
- 已完成 `T09`
  - `reboot-guide.json` 已接入 runtime types / store / bootstrap / context / docs projection
  - 当前 runtime canonical asset 已扩展到 `summary / role-views / stage-views / steering / conventions / critical-flows / change-map / entry-guide / reboot-guide`
- 已完成 `T10`
  - 新增 canonical assets 的 docs projection 合同已整体收口
  - `refresh-all / refresh-docs-from-runtime` 与 canonical projection tests 已覆盖全部 9 个 runtime assets
- 已完成 `T11`
  - `ResolvedSkillContext` 已升级为 `required / optional / fallback`
  - `context-resolver` 能按 skill 输出 richer asset slice，并在 required 缺失时提供稳定 warning / recommendation / missing_required_assets
- 已完成 `T12`
  - `spec / design / code / review / verify` 已消费 non-summary canonical assets
  - `task / plan / orchestrate` 已接入 `change-map / critical-flows / entry-guide`
  - `onboarding` 已接入 `steering`，并将 `reboot-guide` 作为 optional asset 暴露
- 已完成 `T13`
  - 新增 `.spec-first/runtime/first/project-cognition-updates.jsonl` 作为 append-only 项目认知更新日志
- 已完成 `T14`
  - `advance()` 在 `06_wrap_up` 与终态 `08_done` 场景接入 cognition diff 触发
  - 当前自动收口链 `06_wrap_up -> 07_release -> 08_done` 会在外层调用中执行一次治理写回
- 已完成 `T15`
  - 已建立最小 `Project Cognition Gate`
  - 支持 `must_update / should_update / must_not_update` 分类，以及 `approved / skipped / blocked` gate 状态
- 已完成 `T16`
  - gate 通过时可执行 `bootstrap / refresh-all / refresh-docs-from-runtime`
  - canonical truth 与 docs projection 已能在治理链中自动刷新
- 已完成本轮全量验证收口
  - 修复 `tests/unit/init.test.ts` 与 `tests/unit/cli-init-stage.test.ts` 中仍按旧三资产模型构造 healthy runtime first fixture 的回归问题，统一升级为九资产 canonical runtime fixture
  - 已完成 `pnpm vitest run`、`pnpm typecheck`、`pnpm lint`
  - 当前验证基线：`176` 个测试文件通过，`1571` 个测试通过，`7` 个跳过
- 已完成 `T17`
  - 新增 `tests/integration/first-governance-e2e.test.ts`
  - 已覆盖 `06_wrap_up -> 07_release -> 08_done` 路径上的 runtime writeback 日志、gate 决策、canonical truth 刷新
  - 已覆盖 `07_release -> 08_done` 路径上的 canonical docs drift 检测与 `refresh-docs-from-runtime` 回投影
- 已完成 `T18`
  - 新增 `docs/first/common-playbooks.md` 与 `docs/first/known-risks-and-traps.md` 两类增强投影视图
  - 这两类文档由现有 runtime truth 派生生成，不新增 runtime health 必选资产，不破坏当前 9 资产 canonical contract
  - 已补齐 `first-artifact-mapping` 与 `first-doc-projection` 测试覆盖
- 已完成 `T19`
  - `context-resolver` 已按 skill 的 task category 对 `entry-guide / change-map` 做选择性注入
  - `plan / orchestrate` 等背景型 skill 不再默认拿到无关的 `docs-projection` slice
  - 已补齐 `context-resolver / dispatcher-first-runtime` 测试覆盖
- 已完成 `T20`
  - `project-cognition-updates.jsonl` 已为长期记忆预留 `topicKey / assetId / updateSource` 三个结构位
  - 当前仅在治理日志中补齐元数据，不新增 memory backend，也不改变现有 gate / writeback 主路径
  - 已补齐 `first-governance / first-governance-e2e` 测试覆盖
- 当前主线任务状态
  - `T01-T20` 已全部完成
  - 后续进入增强收尾与持续演进阶段，不再存在主线阻塞项

---

## 三、开发总路线

```text
Build
  Phase 0.5 + Phase 1
    ↓
Consume
  Phase 1
    ↓
Govern
  Phase 2
    ↓
Writeback
  Phase 2
    ↓
Enhance
  Phase 3
```

## 三点一、流程工作流视角

为了避免任务清单与整体流程脱节，开发工作流统一按以下四段理解：

1. **Build**
   - 建立 runtime canonical truth 与 docs projection。
   - 对应 `T01-T10`。

2. **Consume**
   - 让各 skill 按 `required / optional / fallback` 消费认知切片。
   - 对应 `T11-T12`。

3. **Govern**
   - 在 `wrap_up / done` 时判断是否应把 feature 级变化提升为项目级认知。
   - 对应 `T13-T15`。

4. **Writeback**
   - 将经过 gate 的项目级变化写回 canonical truth，并刷新投影视图。
   - 对应 `T16-T17`。

---

## 四、执行原则

这份任务文档不是“尽可能多做功能”的清单，而是为建立最小闭环服务。执行时必须遵守：

1. **先收敛，再扩展**
   - `docs/first` 双轨未收敛前，不进入 richer asset 扩展。

2. **先真源，再投影**
   - 任何新增文档都必须先有 runtime schema，再有 docs projection。

3. **先消费，再承诺**
   - 任何新增 canonical asset，至少要进入一个后续 skill 的稳定消费链。

4. **先 gate，再回写**
   - `wrap_up / done` 回写前必须完成 cognition diff 和 `Project Cognition Gate` 判定。

5. **先小闭环，再大工程**
   - 以 `T01-T17` 为主线，不在首轮把长期记忆、大项目分片、全量 conventions 当成必做项。

---

## 五、任务拆解总表

| ID | Phase | 任务 | 优先级 | 预估 |
|----|-------|------|--------|------|
| T01 | P0.5 | `docs/first` canonical / legacy 清单与标记 | P0 | 0.5d |
| T02 | P0.5 | `first` CLI / health 文案收敛 | P0 | 0.5d |
| T03 | P0.5 | README 投影视图升级，明确 docs 边界 | P0 | 0.5d |
| T04 | P1 | 扩展 runtime schema：`steering.json` | P1 | 1d |
| T05 | P1 | 扩展 runtime schema：`conventions.json` 最小子集 | P1 | 1.5d |
| T06 | P1 | 扩展 runtime schema：`critical-flows.json` | P1 | 1d |
| T07 | P1 | 扩展 runtime schema：`change-map.json` | P1 | 1.5d |
| T08 | P1 | 扩展 runtime schema：`entry-guide.json` | P1 | 1d |
| T09 | P1 | 扩展 runtime schema：`reboot-guide.json` | P1 | 0.5d |
| T10 | P1 | docs projection 支持新 canonical assets | P1 | 1d |
| T11 | P1 | skill consumption 升级为 `required/optional/fallback` | P1 | 2d |
| T12 | P1 | onboarding/spec/design/task/code/verify 分阶段接入 | P1 | 2d |
| T13 | P2 | 新增 `project-cognition-updates.jsonl` | P1 | 0.5d |
| T14 | P2 | `wrap_up/done` 触发项目认知差异分析 | P1 | 1.5d |
| T15 | P2 | `Project Cognition Gate` 判定机制 | P1 | 1.5d |
| T16 | P2 | canonical truth 更新 + docs 自动投影刷新 | P1 | 1d |
| T17 | P2 | 闭环验证测试：需求完成后认知层更新 | P1 | 1d |
| T18 | P3 | `common-playbooks / known-risks-and-traps` 增强 | P2 | 1.5d |
| T19 | P3 | 大项目分片 / task-category 注入优化 | P2 | 2d |
| T20 | P3 | 长期记忆 topic key 预留 | P3 | 1d |

---

## 六、Phase 0.5：收敛 docs/first 双轨

### T01 `docs/first` canonical / legacy 清单与标记

**目标**

建立当前 `docs/first` 文档的正式归属，避免用户和 agent 把所有文档都当成 runtime-backed truth。

**修改范围**

- `src/core/skill-runtime/first-artifact-mapping.ts`
- `src/core/skill-runtime/first-doc-projection.ts`
- `docs/first/README.md` 投影内容
- 相关测试

**实施内容**

1. 在代码中定义 canonical projection docs 列表
2. 在 README 投影视图中新增：
   - `Canonical Docs`
   - `Legacy / Reference Docs`
3. 为 legacy docs 增加统一说明：
   - 当前不受 runtime 真源自动刷新保障

**验收标准**

- `docs/first/README.md` 明确区分 canonical 与 legacy
- 测试覆盖 README 投影视图内容
- 用户无法从 README 误读“所有 docs/first 都是 canonical truth”

### T02 `first` CLI / health 文案收敛

**目标**

让 `spec-first first --check-health` 和命令输出只对 canonical truth 作正式承诺。

**修改范围**

- `src/cli/commands/first.ts`
- `src/core/skill-runtime/first-change-detector.ts`

**实施内容**

1. 将 CLI 文案中的 “docs/first 投影” 改为 “canonical projection docs”
2. `check-health` 输出中明确说明：
   - 当前检查的是 runtime truth + canonical projections
   - 不覆盖全部 legacy docs

**验收标准**

- `first --help`
- `first --check-health`
- `first --skip`
  三处输出和现状一致，不再暗示全目录 docs 都是 canonical

### T03 README 投影视图升级

**目标**

把 README 从“文档导航页”升级为“认知层入口页”。

**修改范围**

- `src/core/skill-runtime/first-doc-projection.ts`

**实施内容**

新增以下区块：

- 当前 runtime canonical truth
- canonical projection docs
- legacy/reference docs
- 使用约定
- 对后续 skill 的消费说明

**验收标准**

- README 能单独解释当前 first 的真实产品边界

---

## 七、Phase 1：建立 Build 与 Consume 主链

### T04 扩展 runtime schema：`steering.json`

**目标**

引入项目级稳定认知层，覆盖产品、技术、结构三类 steering 信息。

**修改范围**

- `src/core/skill-runtime/first-runtime-types.ts`
- `src/core/skill-runtime/first-runtime-store.ts`
- `src/core/skill-runtime/first-bootstrap.ts`
- `src/core/skill-runtime/first-context.ts`

**建议字段**

```ts
interface FirstSteering {
  product: {
    overview: string;
    coreScenarios: string[];
    nonGoals: string[];
    glossary: string[];
  };
  tech: {
    stack: string[];
    constraints: string[];
    forbiddenPatterns: string[];
  };
  structure: {
    modules: string[];
    boundaries: string[];
    entryRules: string[];
  };
}
```

**验收标准**

- runtime 中可读写 `steering.json`
- index 可记录健康状态
- 文档投影可读取 steering 数据

### T05 扩展 runtime schema：`conventions.json` 最小子集

**目标**

首批只做最有价值的 conventions：

- `api`
- `module`
- `testing`
- `projectRules`

**修改范围**

- `first-runtime-types.ts`
- `first-bootstrap.ts`
- 新增 conventions extractor 模块

**实施内容**

每个 convention 至少输出：

- `observedPatterns`
- `deviations`
- `recommendedConvention`
- `evidence`

**验收标准**

- conventions 为结构化 JSON
- 至少一组 evidence 可定位到代码/配置文件
- 不存在完全空壳 convention

### T06 扩展 runtime schema：`critical-flows.json`

**当前状态：已完成（2026-03-16）**

**目标**

让 `design/code/verify` 能读取项目级关键链路。

**建议字段**

- `flowId`
- `name`
- `entryPoints`
- `coreModules`
- `invariants`
- `verificationHooks`

**验收标准**

- 至少覆盖 2-3 条关键链路
- `verify` 能消费其摘要或切片

### T07 扩展 runtime schema：`change-map.json`

**当前状态：已完成（2026-03-16）**

**目标**

给 `task/code` 提供高价值 brownfield 导航。

**建议字段**

- `changeType`
- `likelyModules`
- `likelyCommands`
- `likelyConfigs`
- `likelyTests`
- `riskPoints`

**验收标准**

- 至少覆盖 3 类高频改动场景
- `task` 可读取 change-map slice

### T08 扩展 runtime schema：`entry-guide.json`

**当前状态：已完成（2026-03-16）**

**目标**

给 agent 一个“从哪里开始阅读”的稳定入口。

**建议字段**

- `taskCategory`
- `readFirst`
- `thenRead`
- `avoidEntry`
- `relatedFlows`

### T09 扩展 runtime schema：`reboot-guide.json`

**当前状态：已完成（2026-03-16）**

**目标**

给 `onboarding` 和新会话恢复提供稳定恢复入口，但不把它提升为首批硬依赖。

**修改范围**

- `first-runtime-types.ts`
- `first-bootstrap.ts` 或从现有资产派生的生成逻辑
- `first-context.ts`

**建议字段**

- `projectWhat`
- `whereToStart`
- `currentCriticalAreas`
- `commonChangePaths`
- `verifyChecklist`

**验收标准**

- `reboot-guide` 可由 runtime truth 稳定生成
- `onboarding` 可将其作为 optional asset 消费

### T10 docs projection 支持新 canonical assets

**目标**

让新增 runtime assets 自动投影为 canonical docs，而不是再次引入手工维护文档。

**修改范围**

- `first-artifact-mapping.ts`
- `first-doc-projection.ts`

**实施内容**

1. 新增 runtime -> docs projection 映射
2. 只为 canonical assets 建立投影
3. legacy docs 保持 reference 身份，不自动升级为 canonical

**验收标准**

- 新资产变更能自动刷新对应投影视图

### T11 skill consumption 升级为 `required/optional/fallback`

**目标**

把方案文档中的消费契约落实到代码。

**修改范围**

- `src/core/skill-runtime/context-resolver.ts`
- `src/core/skill-runtime/dispatcher.ts`

**实施内容**

1. 扩展 `ResolvedSkillContext`
2. 支持 richer assets slice
3. 支持 fallback 逻辑
4. 当 required 缺失时输出更明确的 recommendation / warning

**验收标准**

- spec/design/task/code/verify 的运行时注入不再只靠单条 summary
- 资产缺失时存在稳定降级行为

### T12 onboarding/spec/design/task/code/verify 分阶段接入

**目标**

按顺序升级消费链路，而不是一次性全部切换。

**推荐顺序**

1. `spec/design/code/verify` 从 summary 升到 stage slice
2. `task/plan/orchestrate` 引入 `change-map / critical-flows / entry-guide`
3. `onboarding` 引入 `steering`，并将 `reboot-guide` 作为 optional asset 接入

**验收标准**

- 每个 skill 至少增加一个 non-summary 级 canonical asset 消费点

---

## 八、Phase 2：建立 Govern 与 Writeback 主链

### T13 新增 `project-cognition-updates.jsonl`

**目标**

记录每次需求对项目级认知层的更新。

**修改范围**

- runtime store
- 新增 append-only logger

**建议记录格式**

```json
{
  "timestamp": "2026-03-15T00:00:00.000Z",
  "featureId": "FSREQ-20260315-XXX-001",
  "stage": "06_wrap_up",
  "updatedAssets": ["conventions.api", "critical-flows"],
  "reason": "新增稳定 API 契约与关键验证链路",
  "evidence": ["src/cli/commands/skill.ts:96"],
  "triggeredBy": "wrap_up"
}
```

### T14 `wrap_up/done` 触发项目认知差异分析

**目标**

自动判断本次 feature 是否影响项目级认知。

**修改范围**

- `wrap_up` / `done` skill 相关实现
- 新增 cognition diff analyzer

**分析输入**

- 当前 feature 变更文件
- stage-state / findings / reports
- 当前 runtime canonical truth

**分析输出**

- `must_update`
- `should_update`
- `must_not_update`

**附加要求**

- 输出必须包含建议来源 skill、证据列表、受影响资产列表
- 当多个 skill 建议冲突时，必须显式标记为 `needs_decision`

### T15 `Project Cognition Gate` 判定机制

**目标**

避免把 feature 级局部变化误写成项目级真相。

**规则**

判定为 `must_update`：

- 稳定 API 契约变化
- 稳定模块边界变化
- 项目级规则变化
- 关键流程变化

判定为 `must_not_update`：

- 局部 bugfix
- 临时 workaround
- 实验性实现
- 一次性迁移脚本

判定为 `should_update`：

- 有项目级价值，但需要补证据或确认

**治理补充**

- `Project Cognition Gate` 默认作为自动裁决器
- `should_update` 或 `needs_decision` 必须进入人工裁决，不自动写回
- 人工裁决结果需要记录在更新日志中

**最小证据门槛**

- `must_update` 至少要求以下之一成立：
  - 代码/配置证据 + 测试/验证证据
  - 代码/配置证据 + 文档/规则证据
  - 重复性证据 + 任一其他证据

若不满足上述组合，只能判为 `should_update` 或 `must_not_update`

**验收标准**

- gate 结果有稳定的输出结构
- `done/wrap_up` 不会无门槛写回 first truth
- gate 能输出 `decisionSource / evidence / affectedAssets / status`

### T16 canonical truth 更新 + docs 自动投影刷新

**目标**

让 `done/wrap_up` 真正完成“更新 truth -> 自动刷新投影”的闭环。

**修改范围**

- runtime write path
- docs projection refresh
- `done/wrap_up` hooks

**验收标准**

- 命中 `must_update` 的 feature 会更新 canonical truth
- 相应 docs projection 自动更新
- 不需要手工编辑 `docs/first/*.md`
- `should_update` 不会自动写回，只记录候选更新
- `writeback` 失败时会记录 stale 状态，不影响 feature 完成态

### T17 闭环验证测试

**目标**

验证从 feature 完成到项目认知层更新的完整链路。

**测试场景**

1. 新增稳定 API
2. 新增关键流程
3. 单纯局部 bugfix

**期望**

1. API 变化 -> `must_update`
2. 关键流程变化 -> `must_update`
3. 局部 bugfix -> `must_not_update`

---

## 九、Phase 3：增强资产

### T18 `common-playbooks / known-risks-and-traps` 增强

**目标**

把重复出现的高价值经验从“会话经验”提升为“项目增强认知资产”，但不挤占主闭环优先级。

**方向**

- 沉淀高频改动手册
- 沉淀稳定风险提示
- 仅在重复出现后再提升为项目级资产

### T19 大项目分片 / task-category 注入优化

**目标**

面向超大仓库减少注入成本。

**方向**

- 按子系统分片
- 按 task category 选择性注入
- 限制单次 slice 大小

### T20 长期记忆 topic key 预留

**目标**

为未来 memory backend 做接口准备，而不提前重建系统。

**方向**

- `topicKey`
- `assetId`
- `updateSource`

---

## 十、任务依赖关系

```text
Build:
  T01/T02/T03
    ↓
  T04/T05/T06/T07/T08/T09/T10

Consume:
  T11/T12

Govern:
  T13/T14/T15

Writeback:
  T16/T17

Enhance:
  T18/T19/T20
```

关键路径：

- `T01 -> T04 -> T10 -> T11 -> T12 -> T14 -> T15 -> T16 -> T17`

### 10.1 串并行建议

为提高交付效率，同时避免共享状态冲突，建议采用以下串并行策略：

- 可并行：
  - `T01 / T02 / T03`
  - `T04 / T05 / T06 / T07 / T08 / T09`
  - 测试用例补充可与对应实现同步推进

- 必须串行：
  - `T10` 依赖 `T04-T09` 至少首批 schema 定型
  - `T11` 依赖 `T10`
  - `T12` 依赖 `T11`
  - `T14 / T15 / T16 / T17` 必须按闭环顺序推进

- 不建议并行：
  - 在 `T01-T03` 未完成前并行推动大量新文档，会继续放大双轨问题
  - 在 `T15` 未完成前实现 `done` 自动写回，会引入治理风险

---

## 十一、建议修改文件清单

### 高概率涉及

- `src/cli/commands/first.ts`
- `src/cli/commands/skill.ts`
- `src/core/skill-runtime/dispatcher.ts`
- `src/core/skill-runtime/context-resolver.ts`
- `src/core/skill-runtime/first-runtime-types.ts`
- `src/core/skill-runtime/first-runtime-store.ts`
- `src/core/skill-runtime/first-bootstrap.ts`
- `src/core/skill-runtime/first-context.ts`
- `src/core/skill-runtime/first-doc-projection.ts`
- `src/core/skill-runtime/first-artifact-mapping.ts`
- `src/core/skill-runtime/first-change-detector.ts`

### 可能新增

- `src/core/skill-runtime/first-steering.ts`
- `src/core/skill-runtime/first-conventions.ts`
- `src/core/skill-runtime/first-critical-flows.ts`
- `src/core/skill-runtime/first-change-map.ts`
- `src/core/skill-runtime/first-entry-guide.ts`
- `src/core/skill-runtime/first-reboot-guide.ts`
- `src/core/skill-runtime/project-cognition-gate.ts`
- `src/core/skill-runtime/project-cognition-updates.ts`

### 测试

- `tests/unit/first-artifact-mapping.test.ts`
- `tests/unit/first-doc-projection.test.ts`
- `tests/unit/dispatcher-first-runtime.test.ts`
- 新增：
  - `tests/unit/first-steering.test.ts`
  - `tests/unit/first-conventions.test.ts`
  - `tests/unit/first-reboot-guide.test.ts`
  - `tests/unit/project-cognition-gate.test.ts`
  - `tests/unit/project-cognition-updates.test.ts`
  - `tests/integration/first-done-loop.test.ts`

---

## 十二、验收标准

### 12.1 Phase 0.5 验收

- `docs/first` 已被明确分成 canonical / legacy
- CLI 文案与真实实现一致
- 用户不会误判 legacy docs 的 truth 等级

### 12.2 Phase 1 验收

- runtime canonical truth 不再只有 3 个资产
- 后续 skill 不再只消费 summary 级信息
- rich assets 至少在 `spec/design/task/code/verify` 中各落地一个消费点
- `reboot-guide` 至少以 optional asset 方式进入 `onboarding`
- 不适用的资产允许缺席，但必须有明确的“未生成原因”，不能生成空壳资产

### 12.3 Phase 2 验收

- `wrap_up/done` 能触发 cognition diff
- 存在 `Project Cognition Gate`
- canonical truth 可被安全回写
- docs 自动刷新，不需要手工维护
- 多 agent 冲突建议会进入 `needs_decision` 或人工裁决路径
- `should_update` 默认不会自动写回

### 12.4 整体验收

当接手一个存量项目并完成一轮需求迭代后：

1. `first` 能建立项目认知层
2. 各阶段 skill 能消费合适的认知切片
3. `wrap_up/done` 能把项目级变化回写到认知层
4. 下一轮需求能消费更新后的最新认知

### 12.5 Definition of Done

单个任务完成不以“代码写完”为准，而以以下标准为准：

1. 目标任务涉及的 runtime truth、docs projection、skill consumption 三者关系被明确处理。
2. 对应测试补齐，至少覆盖新增行为的正向路径。
3. 若任务改变用户认知边界，CLI / README / health 文案同步更新。
4. 不引入新的手工维护 truth 源。
5. 若任务处于闭环链路中，其前置依赖已完成且结果可验证。
6. 若任务新增资产，必须说明适用条件与缺席策略。

---

## 十三、多 Agent / 多角色交付边界

为避免开发过程中职责漂移，建议按以下边界组织实施：

- 架构/真源层：
  - 负责 `first-runtime-types`、store、change detector、projection mapping。
  - 主要承接 `T01-T10`。

- skill consumption 层：
  - 负责 `context-resolver`、`dispatcher`、各 skill runtime notice。
  - 主要承接 `T11-T12`。

- 闭环治理层：
  - 负责 `wrap_up/done` 的 diff、gate、writeback、updates log。
  - 主要承接 `T13-T17`。

- 文档/产品层：
  - 负责 README、CLI 文案、验收口径、方案对齐。
  - 横向参与 `T01-T03`、`T16-T17`。

### 13.1 Skill 改造覆盖矩阵

| Skill | 改造类型 | 主要任务 | 优先级 | 备注 |
|-------|----------|----------|--------|------|
| `first` | Build | `T01-T10` | P0/P1 | 真源、投影、schema 扩展主入口 |
| `onboarding` | Consume | `T11-T12` | P1 | 接入 `steering` 与 optional `reboot-guide` |
| `spec` | Consume | `T11-T12` | P1 | 从 summary 升级到 stage slice + conventions |
| `design` | Consume | `T11-T12` | P1 | 接入架构、链路、结构约束 |
| `task` | Consume | `T11-T12` | P1 | 接入 `change-map / critical-flows` |
| `plan` | Consume | `T11-T12` | P1 | 与 `task` 同组推进 |
| `orchestrate` | Consume | `T11-T12` | P1 | 与 `task` 同组推进 |
| `code` | Consume | `T11-T12` | P1 | 接入导航与规范 |
| `verify` | Consume | `T11-T12` | P1 | 接入验证规范与关键链路 |
| `wrap_up / done` | Govern + Writeback | `T13-T17` | P1 | 差异分析、gate、写回主入口 |
| `research` | 可选 Consume | 后续增补 | P2 | 旁路 skill，非主闭环阻塞项 |
| `analyze` | 可选 Consume | 后续增补 | P2 | 旁路 skill，非主闭环阻塞项 |
| `review` | 可选 Consume | 后续增补 | P2 | 可把项目规范引入审查口径 |
| `status` | 低改造 | 后续增补 | P3 | 展示型技能，优先级低 |
| `sync` | 低改造 | 后续增补 | P3 | 状态同步型技能，优先级低 |
| `archive` | 可选 Govern | 后续增补 | P3 | 归档审计场景可接入认知更新日志 |

这张表用于明确两点：

- 当前任务文档已经覆盖主流程 skill 改造。
- 旁路 skill 没有被忽略，而是被明确降级到后续增补。

### 13.2 冲突解决机制

当多 agent 对项目认知更新建议不一致时，按以下顺序处理：

1. 先由 `wrap_up / done` 汇总成单一 diff 候选。
2. `Project Cognition Gate` 自动判定：
   - 可自动决策的直接输出结果。
   - 冲突未消解的输出 `needs_decision`。
3. `needs_decision` 进入人工裁决：
   - 默认由当前需求主负责人裁决。
   - 涉及项目级规则冲突时，由项目 owner 或认知维护者裁决。

未经上述路径，不允许任何 agent 单独写回 canonical truth。

如果使用多 agent 并行开发，应按上述边界拆批次，而不是按文件随机切任务。

---

## 十四、明确不做

- 不一次性迁移所有 `docs/first/*.md`
- 不先做 memory backend
- 不让 `done` 手工维护全部文档
- 不在未定义 fallback 前强推 rich asset 必选依赖

---

## 十五、建议执行顺序

建议按三个开发批次推进：

### 批次 A：收敛与对齐

- T01
- T02
- T03

### 批次 B：最小 canonical nucleus 扩展

- T04
- T05
- T06
- T07
- T08
- T09
- T10
- T11
- T12

### 批次 C：闭环

- T13
- T14
- T15
- T16
- T17

---

## 十六、一句话任务定义

> 用最小 canonical nucleus 收敛 `first` 的真源与消费链路，再通过 `wrap_up/done` 建立项目认知层持续更新闭环。
