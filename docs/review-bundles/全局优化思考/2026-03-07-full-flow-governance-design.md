# Full Flow Governance Design

**Date:** 2026-03-07
**Scope:** `skills/spec-first/*`, `src/core/process-engine/*`, `src/core/skill-runtime/*`, `src/core/gate-engine/*`, `src/cli/*`, related tests

## Goal

把 `spec-first` 从“文档驱动的一组 Skill”收敛成“规范驱动 + 运行时执行 + CLI 编排 + Skill 交互”的四层治理体系，降低 SDD/TDD 规则漂移，明确审查与放行边界，并为后续状态驱动编排打底。

## Evidence Anchors

1. 阶段状态机已由运行时强约束：`src/core/process-engine/stage-machine.ts`
2. Skill 入口前置阻断已存在：`src/core/skill-runtime/hard-gate.ts`
3. 命令层已做部分语义归一：`src/core/skill-runtime/dispatcher.ts`
4. Gate 已具备真实执行逻辑，但仍反向依赖 Skill 文档内容：`src/core/gate-engine/gate-evaluator.ts`
5. `feature` 在 CLI 已合并，但 Skill 层仍拆分：`src/cli/commands/feature.ts` 与 `skills/spec-first/README.md`
6. 当前测试已经覆盖核心治理路径：`tests/unit/hard-gate.test.ts`、`tests/unit/skill-runtime.test.ts`、`tests/unit/gate-evaluator.test.ts`、`tests/e2e/core-flow.test.ts`

## Current Problems

### 1. 规则真理源分散

- 阶段语义、审查层语义、门禁阈值分别散落在 Skill、README、runtime、gate evaluator 中。
- 同一规则经常以“代码一份 + 文档一份 + README 一份”的形式重复定义。

### 2. Docs-as-Logic 耦合

- `gate-evaluator.ts` 当前会把 `03-spec/04-design/08-code-review` 的文档引用当成 C11 的一部分。
- 这会让“说明文档是否写对”影响“正式门禁是否通过”，不符合 SDD 的真理源分层。

### 3. 测试与放行的时间语义冲突

- `09-test` 的叙述明显偏向 TDD/测试建模前置。
- 但 runtime 目前把 `test` 绑定到 `05_verify`，与“测试先于实现”存在冲突。

### 4. 审查边界未彻底收口

- `dispatcher.ts` 当前允许 `code-review --layer completion`，而 `verify` 文档又声明 completion 应由 verify 承担。
- `code-review` 与 `verify` 的边界在实现和文档之间仍有重复。

### 5. 证据载体仍偏文本协议

- `hard-gate.ts` 对 TDD、审批证据的识别高度依赖 `findings.md` 文本格式。
- 这能工作，但不利于长期审计、迁移、统计和自动化验证。

## Design Decisions

### 1. 建立统一治理注册表

新增一个集中治理模块，建议路径：

- `src/core/skill-runtime/skill-governance.ts`

该模块统一导出：

- Skill 到 Stage 的绑定
- Review/Verify layer 允许集
- 命令家族归属
- 哪些规则由 engine 执行，哪些仅为文档提示

`hard-gate.ts`、`dispatcher.ts`、文档测试都从这里取值，避免散落常量。

### 2. Engine 是规则真理源，Skill 只解释流程

- 阶段转换以 `stage-machine.ts` 为准
- 入口阻断以 `hard-gate.ts` 为准
- 门禁条件以 `gate-evaluator.ts` 与相关配置为准
- Skill 文档只保留：
  - 何时使用
  - 如何操作
  - 产出模板
  - 对 engine 规则的引用

### 3. `code-review` 与 `verify` 明确一主一副

- `code-review`：实现阶段质量审查，只保留 `single` / `cross`
- `verify`：阶段放行，只保留 `completion`

这样可以让“审查”和“放行”在行为、证据、责任边界上彻底分离。

### 4. `test` 前移为测试规格 / TC 建模入口

推荐将 `09-test` 从当前的 `05_verify` 心智，前移为 `03_plan` 阶段的测试规格入口。

- `test` 负责 TC 建模、覆盖映射、验收设计
- `code` 负责 RED/GREEN 证据与测试执行
- `verify` 负责阶段放行

### 5. 文档依赖从 Gate 中退出

`gate-evaluator.ts` 不再把 Skill 文档中的引用文字作为正式 Gate 判定的一部分。若需要保证文档完整性，应改为：

- catalog/docs 测试验证
- 独立的文档质量检查

而不是混入业务 Gate。

### 6. 证据结构化

在 P1 引入结构化证据账本，建议路径：

- `specs/<featureId>/runtime/evidence.jsonl`

用于记录：

- TDD RED/GREEN
- plan approval
- review result
- verify decision

`findings.md` 可以保留为人类可读摘要，但不再作为唯一机器判定输入。

## Non-Goals

- 本轮不引入新的研发阶段
- 本轮不重写全部 Skill 文案风格
- 本轮不大规模重命名所有命令
- 本轮不把所有历史文档一次性迁移到新结构

## Success Criteria

1. 阶段、层、门禁、证据来源各自只有一个主真理源
2. `test`、`code-review`、`verify` 的职责在 runtime 与 Skill 文档中一致
3. Gate 不再依赖 Skill 文档内容判定业务放行
4. 关键治理规则有单测和 E2E 回归保护
5. 命令面与 Skill 目录心智不再明显分裂

## Verification

- `npx vitest run tests/unit/hard-gate.test.ts`
- `npx vitest run tests/unit/skill-runtime.test.ts`
- `npx vitest run tests/unit/gate-evaluator.test.ts`
- `npx vitest run tests/unit/stage-machine.test.ts`
- `npx vitest run tests/e2e/core-flow.test.ts`
