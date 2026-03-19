# Closure Hardening Minimal Design

**Date:** 2026-03-09
**Scope:** `src/cli/commands/validate.ts`, `src/cli/router.ts`, `src/cli/index.ts`, `src/core/gate-engine/golive.ts`, related tests

## Goal

以最小补丁把 `spec-first` 当前最关键的三处闭环断点补齐：

1. `validate` 从占位命令升级为统一的本地验收入口。
2. `confirm policy` 从“只计算不执行”升级为真实阻断机制。
3. `golive` 从“部分证据可缺失”升级为“缺证据不可放行”。

本轮目标不是新增流程层，而是把已有能力收口，让“规范定义 → 运行时执行 → 证据记录 → 放行验收”形成一个更短、更硬的闭环。

## Constraints

- 保持 `KISS`，不引入新的 orchestration 引擎。
- 保持职责分离：
  - `validate` 负责聚合校验结果。
  - `confirm policy` 负责写操作确认。
  - `golive` 负责最终放行证据。
- 不顺手重构 `gate`、`metrics`、`skill-runtime` 的大结构。
- 优先复用已有能力：`checkMatrix`、`evaluateGate`、`checkGoLive`、`evaluatePolicy`。

## Options Considered

### Option A: 单个大 PR 一次性收口

优点：

- 一次合入，感知最强。

缺点：

- 风险面太大，回归困难。
- 很难区分“聚合入口问题”和“放行证据问题”。
- 不利于定位副作用。

### Option B: 三个最小 PR 顺序推进（推荐）

顺序：

1. `validate` 收口
2. `confirm policy` 落地
3. `golive` 证据强制化

优点：

- 每个 PR 只解决一个问题。
- 容易回滚和审查。
- 可以逐步提高约束强度，不一次性打断研发流。

缺点：

- 中间阶段会短暂处于“半强化”状态。

### Option C: 先做 `golive`，再做前置治理

优点：

- 先堵住最危险的放行口。

缺点：

- 团队先感知到“更难放行”，但还没有统一的本地验收入口与确认机制支撑，体验会割裂。

## Recommendation

选择 **Option B**。

理由很简单：

- 先把 `validate` 做成统一入口，团队才有一条稳定的自检命令。
- 再把 `confirm policy` 变成真的守卫，避免误操作。
- 最后再把 `golive` 证据收紧，形成严格放行。

这条路径最符合 `KISS` 和渐进治理，不需要新增系统，只需要把现有系统接通。

## Design

### PR 1: `validate` 收口

设计原则：**只做聚合，不复制规则**。

方案：

- `validate matrix` 直接调用现有 `checkMatrix`。
- `validate all` 顺序调用：
  1. `validate format`
  2. `validate matrix`
  3. `evaluateGate`
- 统一输出摘要与退出码。

为什么不把覆盖率阈值单独再做一遍：

- `gate` 已经消费 `coverage` 和其它治理条件。
- 若在 `validate` 再实现一套阈值，会形成第二份真源。

### PR 2: `confirm policy` 落地

设计原则：**先做可测试、可自动化的显式确认，不做交互式问答系统**。

方案：

- 在 `router` 层标记写命令与读命令。
- 对写命令：
  - `policy=auto`：直接执行。
  - `policy=assisted/strict`：若未显式传入 `--yes`，直接阻断并提示重试。
- `--yes` 在 router 层消费，不下传到具体 handler。

为什么不做交互式 prompt：

- 当前 CLI 与测试体系都更适合显式 flag。
- 交互式确认会显著增加实现和测试复杂度。
- 先把“有无确认”做真，比把 UI 做花更重要。

### PR 3: `golive` 证据强制化

设计原则：**缺证据即失败，不做“默认为通过”**。

方案：

- `GL-03`：若 `reports/security-scan.md` 缺失，则直接失败。
- `GL-05`：继续要求 `release-note.md` 与 `smoke-test-report.md`。
- 保持 `confirmPolicy: strict` 的降级逻辑不变。

为什么不在这一轮扩展更多放行项：

- 现有 `GL-01~GL-05` 已足够表达发布前证据闭环。
- 新增 `GL-06/GL-07` 会扩大范围，偏离“最小改造”。

## Non-Goals

- 不重构 `gate` 条件体系。
- 不重写 `metrics` 阈值模型。
- 不引入新的交互式确认框架。
- 不统一所有文档漂移问题。
- 不在本轮增加新的 release artifact 类型。

## Success Criteria

### PR 1

- `validate matrix` 不再是占位实现。
- `validate all` 成为真实聚合入口。
- 任一子校验失败时返回非零退出码。

### PR 2

- 写命令在 `policy!=auto` 时没有 `--yes` 不能执行。
- 读命令不受影响。
- 现有测试与自动化可以用显式 flag 继续运行。

### PR 3

- 缺失 `security-scan.md` 时 `golive` 必失败。
- 缺失 release evidence 时 `golive` 必失败。
- `golive` 不再存在“缺证据按通过处理”的路径。

