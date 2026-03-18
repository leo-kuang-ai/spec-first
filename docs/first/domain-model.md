# 领域模型

> 生成时间: 2026-03-17 | 分析模式: static

## 核心概念

| 概念 | 类型 | 说明 | 证据 |
|------|------|------|------|
| Feature | Aggregate Root | 功能需求聚合根，贯穿整个生命周期 | `src/core/process-engine/stage-machine.ts` — `[显式]` |
| Stage | Enum | 阶段枚举，8 个活跃阶段 + 2 个终态，单向不可逆 | `src/shared/types.ts:7-18` — `[显式]` |
| IdType | Union Type | 追溯 ID 类型（FR/DS/TASK/TC/RFC 等 14 类） | `src/shared/types.ts:24-38` — `[显式]` |
| ExitCode | Enum | CLI 退出码 | `src/shared/types.ts:57-66` — `[显式]` |
| GateCondition | Interface | 门禁条件定义 | `src/core/gate-engine/condition-registry.ts` — `[显式]` |
| CoverageMetrics | Interface | 覆盖率指标（C3/C4/C6/C8/C9） | `src/core/trace-engine/coverage.ts` — `[显式]` |
| RFC | Entity | 变更请求 | `src/core/change-mgr/rfc-machine.ts` — `[显式]` |
| Defect | Entity | 缺陷记录 | `src/core/change-mgr/defect-machine.ts` — `[显式]` |
| Waiver | Entity | Gate 条件豁免 | `src/core/gate-engine/waiver.ts` — `[显式]` |

## 领域服务

| 服务 | 职责 | 核心方法 | 证据 |
|------|------|----------|------|
| ProcessEngine | 阶段状态机驱动 | `advance()`, `canAdvance()`, `getCurrentStage()`, `validateTransition()` | `src/core/process-engine/advance.ts` — `[显式]` |
| GateEngine | 门禁条件评估 | `evaluate()`, `getConditions()`, `validate()` | `src/core/gate-engine/gate-evaluator.ts` — `[显式]` |
| TraceEngine | 追溯 ID 与覆盖率管理 | `generateId()`, `validateId()`, `getCoverage()`, `syncMatrix()` | `src/core/trace-engine/matrix.ts` — `[显式]` |
| SkillRuntime | Skill 分发与执行 | `dispatch()`, `assemblePrompt()`, `validateHardGate()` | `src/core/skill-runtime/dispatcher.ts` — `[显式]` |
| ChangeManager | RFC/Defect 状态管理 | `createRFC()`, `transitionDefect()`, `analyzeImpact()` | `src/core/change-mgr/rfc-machine.ts` — `[显式]` |
| AIOrchestrator | AI 编排 | `runAutoLoop()`, `recoverContext()`, `prepareContextPack()` | `src/core/ai-orchestrator/auto-loop.ts` — `[显式]` |

## 状态机

### Stage State Machine

**状态** (`src/shared/types.ts:7-18` — `[显式]`):
- 活跃: `00_init`, `01_specify`, `02_design`, `03_plan`, `04_implement`, `05_verify`, `06_wrap_up`, `07_release`
- 终态: `08_done`, `09_cancelled`

**转换** (`src/core/process-engine/stage-machine.ts` — `[显式]`):

```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done
                                                                                               ↘ 09_cancelled
```

| From | To | Trigger |
|------|------|---------|
| 00_init | 01_specify | init |
| 01_specify | 02_design | specify |
| 02_design | 03_plan | design |
| 03_plan | 04_implement | plan |
| 04_implement | 05_verify | implement |
| 05_verify | 06_wrap_up | verify |
| 06_wrap_up | 07_release | wrapUp |
| 07_release | 08_done | release |

### RFC State Machine

**状态** (`src/core/change-mgr/rfc-machine.ts` — `[显式]`):
- draft, approved, closed, rejected

| From | To | Trigger |
|------|------|---------|
| draft | approved | approve |
| draft | rejected | reject |
| approved | closed | close |

### Defect State Machine

**状态** (`src/core/change-mgr/defect-machine.ts` — `[显式]`):
- open, fixing, fixed, verified, wontfix

| From | To | Trigger |
|------|------|---------|
| open | fixing | startFix |
| fixing | fixed | complete |
| fixed | verified | verify |
| verified | wontfix | wontfix |

## 业务规则

| 规则 | 约束 | 证据 |
|------|------|------|
| Stage Advance Gate | 阶段推进必须通过 Gate 校验，Gate 条件必须全部 passing 才能 advance | `src/core/process-engine/advance.ts:95-112` — `[显式]` |
| Coverage Thresholds | 覆盖率矩阵必须满足最低阈值（C3/C4/C6/C8/C9 各项阈值） | `src/core/trace-engine/coverage.ts:44-60` — `[显式]` |
| ID Format Validation | 追溯 ID 必须符合格式规范（{TYPE}-{ABBR}-{SEQ}） | `src/core/trace-engine/id-validator.ts:9-22` — `[显式]` |
| Gate Condition Rules | 19 条 Gate 条件（16 blocking + 3 warning），必须满足 blocking 条件才能 advance | `src/core/gate-engine/condition-registry.ts:269-277` — `[显式]` |
| Manual Edit Prohibition | 状态文件只能通过 CLI 操作，禁止手动编辑 stage-state.json、traceability-matrix.md | `CLAUDE.md:31-49` — `[显式]` |
| ESM Only | 全项目使用 ESM 模块系统（type: module） | `package.json:5` — `[显式]` |
| Named Exports Only | core 模块禁止使用 default export | `CLAUDE.md:59` — `[显式]` |
