# Spec-First 全流程节点与 Gate 审查报告

> **生成时间**: 2026-03-13
> **审查范围**: 阶段状态机、Gate 机制、编排逻辑
> **审查版本**: v0.5.77

---

## 📋 执行摘要

本报告对 Spec-First 的全流程节点、Gate 机制和编排逻辑进行了完整审查，涵盖：
- **8 个活跃阶段 + 2 个终态阶段**的状态机设计
- **7 个阶段的 Gate 条件**（共 19 条条件）
- **编排引擎**的决策逻辑与自动推进机制
- **Auto-Loop** 自动化任务执行框架

### 核心发现

✅ **优势**：
- 状态机设计清晰，转换规则明确
- Gate 条件覆盖全面，支持 blocking/warning 分级
- 编排逻辑支持多种自动化策略
- 豁免机制（Waiver）设计合理

⚠️ **待优化**：
- Gate 条件展示冗余（已在 FSREQ-20260313-UIOPT-001 中规划优化）
- 部分阶段缺少 Gate 定义（08_done, 09_cancelled）
- 编排决策逻辑复杂度较高

---

## 1️⃣ 阶段状态机（Stage Machine）

### 1.1 阶段定义

**位置**: `src/shared/types.ts:7-18`

```typescript
export enum Stage {
  INIT = '00_init',           // 初始化
  SPECIFY = '01_specify',     // 需求规格
  DESIGN = '02_design',       // 技术设计
  PLAN = '03_plan',           // 任务拆解
  IMPLEMENT = '04_implement', // 代码实现
  VERIFY = '05_verify',       // 验收测试
  WRAP_UP = '06_wrap_up',     // 归档复盘
  RELEASE = '07_release',     // 发布上线
  DONE = '08_done',           // 已完成（终态）
  CANCELLED = '09_cancelled', // 已取消（终态）
}
```

**终态阶段**: `DONE`, `CANCELLED`（不可再转换）

### 1.2 转换规则

**位置**: `src/core/process-engine/stage-machine.ts:7-16`

```typescript
const TRANSITIONS = new Map<Stage, ReadonlySet<Stage>>([
  [Stage.INIT,      new Set([Stage.SPECIFY, Stage.CANCELLED])],
  [Stage.SPECIFY,   new Set([Stage.DESIGN, Stage.CANCELLED])],
  [Stage.DESIGN,    new Set([Stage.PLAN, Stage.CANCELLED])],
  [Stage.PLAN,      new Set([Stage.IMPLEMENT, Stage.CANCELLED])],
  [Stage.IMPLEMENT, new Set([Stage.VERIFY, Stage.CANCELLED])],
  [Stage.VERIFY,    new Set([Stage.WRAP_UP, Stage.CANCELLED])],
  [Stage.WRAP_UP,   new Set([Stage.RELEASE, Stage.CANCELLED])],
  [Stage.RELEASE,   new Set([Stage.DONE, Stage.CANCELLED])],
]);
```

**设计特点**：
- ✅ 单向流转，不支持回退（防止状态混乱）
- ✅ 任意活跃阶段可取消（转到 `CANCELLED`）
- ✅ 终态阶段无出边（不可再转换）

**流程图**：

```
00_init ──→ 01_specify ──→ 02_design ──→ 03_plan ──→ 04_implement ──→ 05_verify ──→ 06_wrap_up ──→ 07_release ──→ 08_done ✓
   │            │              │            │              │               │              │               │
   └────────────┴──────────────┴────────────┴──────────────┴───────────────┴──────────────┴───────────────┴──→ 09_cancelled ✗
```

### 1.3 转换校验

**位置**: `src/core/process-engine/stage-machine.ts`

**函数**: `assertTransitionAllowed(from, to)` - 校验转换合法性
**函数**: `getNextStages(stage)` - 获取可转换的下一阶段列表
**函数**: `isTerminal(stage)` - 判断是否为终态

---

## 2️⃣ Gate 机制（Gate Engine）

### 2.1 Gate 架构

**核心文件**: `src/core/gate-engine/gate-evaluator.ts`

**评估流程**：

```
加载 stage-state.json
    ↓
构建评估上下文 (coverage, matrix, rfcStatuses)
    ↓
执行 Layer1 条件 (代码定义)
    ↓
执行 Layer2 条件 (command)
    ↓
检查豁免 ──→ 匹配 Exception
    ↓              ↓
    └──────────────┘
         ↓
    聚合结果 ──→ PASS ✓ / FAIL ✗ / PASS_WITH_WAIVER ~
         ↓
持久化到 gate-history.jsonl
```

**三态结果**：
- `PASS`: 所有 blocking 条件通过
- `FAIL`: 存在 blocking 条件失败
- `PASS_WITH_WAIVER`: 失败条件已豁免

### 2.2 条件注册表

**位置**: `src/core/gate-engine/condition-registry.ts`

**结构**：
```typescript
export const GATE_CONDITIONS: Partial<Record<Stage, GateConditionDef[]>> = {};

interface GateConditionDef {
  id: string;              // 条件 ID（如 G-SPEC-01）
  description: string;     // 条件描述
  blocking?: boolean;      // 是否阻塞（默认 true）
  evaluate: (ctx) => {     // 评估函数
    pass: boolean;
    detail?: string;
    scopeFrIds?: string[]; // 关联的 FR ID（用于豁免匹配）
    blocking?: boolean;    // 动态覆盖 blocking 属性
  };
}
```

### 2.3 各阶段 Gate 条件

#### 00_init（3 条）
| ID | 描述 | Blocking |
|----|------|----------|
| G-INIT-01 | Feature directory exists | ✅ |
| G-INIT-02 | Mode/Size/Platforms confirmed | ✅ |
| G-INIT-03 | stage-state.json exists | ✅ |

#### 01_specify（3 条）
| ID | 描述 | Blocking |
|----|------|----------|
| G-SPEC-00 | PRD exists and C-PRD ≥ 85% | ⚠️ warning |
| G-SPEC-01 | spec.md exists | ✅ |
| G-SPEC-02 | FR/NFR IDs assigned | ✅ |
| G-SPEC-03 | Spec quality score (C10) ≥ 80% | ⚠️ warning |

#### 02_design（2 条）
| ID | 描述 | Blocking |
|----|------|----------|
| G-DESIGN-01 | design.md exists | ✅ |
| G-DESIGN-03 | Constitution compliance (C11) | ⚠️ warning |

#### 03_plan（3 条）
| ID | 描述 | Blocking |
|----|------|----------|
| G-PLAN-01 | Task coverage (C3) = 100% | ✅ |
| G-PLAN-02 | Task compliance (C8) = 100% | ✅ |
| G-PLAN-03 | Analyze CRITICAL findings = 0 | ✅ |

#### 04_implement（1 条）
| ID | 描述 | Blocking |
|----|------|----------|
| G-IMPL-01 | Unit test coverage (C4) ≥ 60% | ✅ |

#### 05_verify（3 条）
| ID | 描述 | Blocking |
|----|------|----------|
| G-VERIFY-01 | Test coverage FR (C4) ≥ 80% | ✅ |
| G-VERIFY-02 | Test compliance (C9) = 100% | ✅ |
| G-VERIFY-03 | Security scan CRITICAL = 0 | ✅ |

#### 06_wrap_up（3 条）
| ID | 描述 | Blocking |
|----|------|----------|
| G-WRAP-01 | Implementation coverage (C6) = 100% | ✅ |
| G-WRAP-02 | Retrospective exists | ✅ |
| G-WRAP-03 | All RFCs closed | ✅ |

#### 07_release（2 条）
| ID | 描述 | Blocking |
|----|------|----------|
| G-REL-01 | Release note exists | ✅ |
| G-REL-02 | Deployment guide exists | ✅ |

#### 08_done / 09_cancelled
❌ **无 Gate 定义**（终态阶段无需 Gate）

### 2.4 Profile 机制

**位置**: `src/core/gate-engine/gate-evaluator.ts:39-57`

**两种 Profile**：
- `default-simplified`: 默认模式，warning 条件不阻塞
- `strict`: 严格模式，所有 warning 提升为 blocking

**实现逻辑**：
```typescript
if (profile === 'strict') {
  return filtered.map((c) =>
    c.blocking === false
      ? { ...c, blocking: true, description: c.description.replace(/\s*\(warning\)\s*/i, '') }
      : c
  );
}
```

### 2.5 豁免机制（Waiver）

**触发条件**：
1. 存在 blocking 失败条件
2. 失败条件的 `scopeFrIds` 与有效 Exception 的 `frId` 匹配
3. Exception 关联的 RFC 状态为 `approved`

**豁免效果**：
- 条件状态从 `FAIL` 变为 `WAIVER`
- Gate 整体状态变为 `PASS_WITH_WAIVER`
- 记录豁免信息（exceptionId, rfcId, expiresAt, rollbackPoint）

---

## 3️⃣ 编排引擎（Orchestrator）

### 3.1 编排命令

**位置**: `src/cli/commands/orchestrate.ts`

**用法**: `spec-first orchestrate [featureId] [--auto-advance] [--mode=auto]`

**核心流程**：
```
1. 解析参数（validateOrchestrateArgs）
2. 执行 auto-loop（可选，mode=auto 时）
3. 加载 Feature 状态
4. 决策下一步（decideNextStep）
5. 打印决策结果
6. 自动推进（可选，--auto-advance 时）
```

### 3.2 决策引擎

**位置**: `src/core/process-engine/next-step-decider.ts`

**决策类型**：
```typescript
type NextStepDecisionType =
  | 'BLOCKED'              // 阻塞，无法推进
  | 'SUGGEST_NEXT'         // 建议执行下一步 Skill
  | 'READY_TO_ADVANCE'     // 准备推进阶段
  | 'AUTO_ADVANCE'         // 自动推进阶段
  | 'AUTO_RUN_NEXT_SKILL'; // 自动运行下一个 Skill
```

**决策输入**：
```typescript
interface NextStepDecisionInput {
  featureId?: string;
  currentStage: Stage;
  stageStatus?: StageStatus;           // drafting / awaiting_review / ready_to_advance
  autoAdvancePolicy?: AutoAdvancePolicy; // suggest / assisted / auto_advance / auto_run
  gateStatus?: GateStatus;             // PASS / FAIL / PASS_WITH_WAIVER
  dependencyCheck?: DependencyCheckResult;
  todoState?: TodoRunnerState;
  autoLoopStatus?: AutoLoopStatus;     // all_done / has_blocked / timeout / ...
}
```

**决策逻辑**：

```
开始决策
    ↓
有下一阶段? ──否──→ BLOCKED: NO_NEXT_STAGE ✗
    ↓ 是
auto-loop 状态?
    ├─ has_blocked ──→ BLOCKED: AUTO_LOOP_HAS_BLOCKED ✗
    ├─ timeout ──→ BLOCKED: AUTO_LOOP_TIMEOUT ✗
    ├─ incomplete ──→ BLOCKED: AUTO_LOOP_INCOMPLETE ✗
    ↓ all_done/无
stageStatus?
    ├─ drafting/awaiting_review ──→ SUGGEST_NEXT ⚠
    ↓ ready_to_advance
依赖检查? ──失败──→ BLOCKED: DEPENDENCY_FAILED ✗
    ↓ 通过
Gate 状态? ──FAIL──→ BLOCKED: GATE_FAILED ✗
    ↓ PASS/WAIVER
Todo 状态?
    ├─ blocked ──→ BLOCKED: TODO_BLOCKED ✗
    ├─ pending ──→ BLOCKED: TODO_PENDING ✗
    ↓ 完成/无
autoAdvancePolicy?
    ├─ suggest/assisted ──→ READY_TO_ADVANCE ✓
    ├─ auto_advance ──→ AUTO_ADVANCE ✓✓
    └─ auto_run ──→ AUTO_RUN_NEXT_SKILL ✓✓
```

### 3.3 阻塞原因码

**位置**: `src/core/process-engine/next-step-decider.ts:24-35`

```typescript
export const ReasonCode = {
  NO_NEXT_STAGE: 'NO_NEXT_STAGE',
  AUTO_LOOP_HAS_BLOCKED: 'AUTO_LOOP_HAS_BLOCKED',
  AUTO_LOOP_TIMEOUT: 'AUTO_LOOP_TIMEOUT',
  AUTO_LOOP_NO_STATE_FILE: 'AUTO_LOOP_NO_STATE_FILE',
  AUTO_LOOP_MAX_ITERATIONS: 'AUTO_LOOP_MAX_ITERATIONS',
  AUTO_LOOP_INCOMPLETE: 'AUTO_LOOP_INCOMPLETE',
  DEPENDENCY_FAILED: 'DEPENDENCY_FAILED',
  GATE_FAILED: 'GATE_FAILED',
  TODO_BLOCKED: 'TODO_BLOCKED',
  TODO_PENDING: 'TODO_PENDING',
} as const;
```

**用途**：
- 测试断言（避免依赖中文字符串）
- 脚本集成（可编程化判断）
- 审计日志（结构化记录）

### 3.4 建议命令映射

**位置**: `src/core/process-engine/next-step-decider.ts:87-92`

```typescript
const SUGGESTED_SKILL_COMMANDS: Partial<Record<Stage, string>> = {
  [Stage.SPECIFY]:   '/spec-first:spec-review',
  [Stage.DESIGN]:    '/spec-first:task',
  [Stage.PLAN]:      '/spec-first:code',
  [Stage.IMPLEMENT]: '/spec-first:verify',
};
```

---

## 4️⃣ Auto-Loop 自动化框架

### 4.1 架构

**位置**: `src/core/ai-orchestrator/auto-loop.ts`

**核心概念**：
- **Task Executor**: 外部注入的任务执行器（通常是 AI Agent）
- **Todo Runner State**: 任务状态文件（`specs/{featureId}/todo-runner-state.json`）
- **Auto-Loop State**: 循环运行时状态（重试预算、心跳时间等）

**执行流程**：

```
加载 todo-runner-state.json
    ↓
确保 autoLoop 状态存在
    ↓
    ┌─────────────────┐
    │  循环执行       │
    │  ↓              │
    │  检查超时? ──是──→ 返回 timeout ✗
    │  ↓ 否           │
    │  达到最大迭代? ──是──→ 返回 max_iterations ✗
    │  ↓ 否           │
    │  查找下一个 pending 任务
    │  ↓              │
    │  有任务? ──否──→ 所有完成? ──是──→ 返回 all_done ✓
    │  ↓ 是           │         ↓ 否
    │  调用 executor  │    有 blocked? ──是──→ 返回 has_blocked ✗
    │  ↓              │         ↓ 否
    │  执行结果       │    返回 incomplete ⚠
    │  ├─ 成功 → completed
    │  ├─ 失败 → failed
    │  └─ 阻塞 → blocked
    │  ↓              │
    └──┘              │
```

### 4.2 状态码

```typescript
type AutoLoopStatus =
  | 'all_done'           // 所有任务完成
  | 'has_blocked'        // 存在阻塞任务
  | 'timeout'            // 执行超时
  | 'no_state_file'      // 状态文件缺失
  | 'max_iterations'     // 达到最大迭代次数
  | 'incomplete';        // 任务未完成
```

### 4.3 重试机制

**位置**: `src/core/ai-orchestrator/todo-runner.ts:28-35`

```typescript
interface AutoLoopRetry {
  regenerateCount: number;       // 重新生成次数
  autoRetryCount: number;        // 自动重试次数
  manualRevisionCount: number;   // 人工修订次数
  totalRetryDurationMs: number;  // 总重试时长
  lastFailureReason: string | null;
}
```

---

## 5️⃣ 推进流程（Advance）

### 5.1 推进函数

**位置**: `src/core/process-engine/advance.ts`

**函数签名**: `advance(featureId, projectRoot): AdvanceResult`

**执行步骤**：

```
加载 stage-state.json
    ↓
当前阶段为终态? ──是──→ 抛出异常: 已处于终态 ✗
    ↓ 否
计算下一阶段
    ↓
校验转换合法性
    ↓
依赖检查 ──失败──→ 抛出 GateFailedError ✗
    ↓ 通过
评估 Gate
    ├─ FAIL ──→ 抛出 GateFailedError ✗
    ├─ 异常 ──→ pilot_mode? ──true──→ 降级为 PILOT_PASS ⚠
    │                      └─false──→ 抛出 GateUnavailableError ✗
    ↓ PASS/WAIVER
更新 stage-state.json
    ↓
写入 gate-history.jsonl
    ↓
from=02_design? ──是──→ 同步 AI 上下文
    ↓ 否
to=07_release? ──是──→ 自动推进到 08_done
    ↓ 否
返回推进结果 ✓
```

### 5.2 异常处理

**异常类型**：
- `GateUnavailableError`: Gate 引擎不可用
- `GateFailedError`: Gate 评估失败
- `TransitionError`: 转换不合法

**错误码映射**：
- `GateFailedError` → `ExitCode.GATE_FAILED`
- 其他错误 → `ExitCode.IO_ERROR`

---

## 6️⃣ 依赖检查（Dependency Checker）

### 6.1 检查逻辑

**位置**: `src/core/process-engine/dependency-checker.ts`

**检查项**：
1. **产物依赖**: 下一阶段所需的文件是否存在
2. **规则依赖**: mergedRules 中定义的依赖条件

**返回结果**：
```typescript
interface DependencyCheckResult {
  pass: boolean;
  missingArtifacts: string[];
  failedRules: string[];
}
```

### 6.2 产物定义

**位置**: `src/core/rules/truth-source.ts`

**示例**：
```typescript
const RELEASE_REQUIRED_ARTIFACTS = [
  'release-note.md',
  'deployment-guide.md',
];
```

---

## 7️⃣ 命令路由

### 7.1 Gate 命令组

**位置**: `src/cli/commands/gate.ts`

**子命令**：
- `gate check [featureId]`: 评估当前阶段 Gate
- `gate history [featureId]`: 查看 Gate 历史
- `gate conditions [featureId]`: 列出当前阶段条件
- `gate validate-config`: 校验 Gate 配置

### 7.2 GoLive 命令

**位置**: `src/cli/commands/gate.ts:37-44`

**用法**: `spec-first golive check [featureId]`

**功能**: 执行上线前检查（位置: `src/core/gate-engine/golive.ts`）

---

## 8️⃣ 发现与建议

### 8.1 优势

✅ **架构清晰**：
- 状态机、Gate、编排三层分离
- 职责明确，易于维护

✅ **扩展性强**：
- Gate 条件注册表设计，易于添加新条件
- Profile 机制支持不同严格程度
- 豁免机制提供灵活性

✅ **可观测性好**：
- gate-history.jsonl 记录所有评估
- 阻塞原因码支持结构化分析
- 审计日志完整

### 8.2 待优化项

⚠️ **Gate 展示优化**（已规划）：
- 问题：条件展示冗余，用户体验不佳
- 方案：FSREQ-20260313-UIOPT-001 已规划优化

⚠️ **终态阶段 Gate 缺失**：
- 问题：`08_done` 和 `09_cancelled` 无 Gate 定义
- 建议：考虑是否需要终态检查（如归档完整性）

⚠️ **编排决策复杂度**：
- 问题：`decideNextStep` 函数逻辑复杂（280+ 行）
- 建议：考虑拆分为多个子决策函数

⚠️ **Auto-Loop 可观测性**：
- 问题：循环执行过程缺少实时进度反馈
- 建议：增加进度回调或事件发射

⚠️ **依赖检查粒度**：
- 问题：依赖检查仅检查文件存在性，不检查内容质量
- 建议：考虑增加内容校验（如 YAML 格式、必填字段）

### 8.3 潜在风险

🔴 **Gate 绕过风险**：
- 场景：用户直接修改 `stage-state.json` 绕过 Gate
- 缓解：增加 Git Hook 校验 + 审计日志

🟡 **豁免滥用风险**：
- 场景：过度使用 Exception 导致质量下降
- 缓解：增加豁免统计 + 定期审查

🟡 **Auto-Loop 死循环**：
- 场景：任务执行器异常导致无限重试
- 缓解：已有最大迭代次数限制（需确认配置合理）

---

## 9️⃣ 总结

Spec-First 的全流程节点与 Gate 机制设计**整体合理**，具备以下特点：

1. **状态机设计清晰**：8 个活跃阶段 + 2 个终态，转换规则明确
2. **Gate 覆盖全面**：7 个阶段共 19 条件，支持 blocking/warning 分级
3. **编排逻辑完善**：支持手动、辅助、自动多种推进策略
4. **自动化能力强**：Auto-Loop 框架支持任务自动执行

**当前优化重点**（FSREQ-20260313-UIOPT-001）：
- Gate 条件展示优化
- 覆盖率指标精简
- 健康分计算优化

**后续建议**：
- 考虑终态阶段 Gate 补充
- 优化编排决策逻辑复杂度
- 增强 Auto-Loop 可观测性

---

## 📚 附录

### A. 关键文件清单

| 文件 | 职责 |
|------|------|
| `src/shared/types.ts` | Stage 枚举、类型定义 |
| `src/core/process-engine/stage-machine.ts` | 状态机转换规则 |
| `src/core/gate-engine/gate-evaluator.ts` | Gate 评估引擎 |
| `src/core/gate-engine/condition-registry.ts` | Gate 条件注册表 |
| `src/core/process-engine/next-step-decider.ts` | 编排决策引擎 |
| `src/core/process-engine/advance.ts` | 阶段推进逻辑 |
| `src/core/ai-orchestrator/auto-loop.ts` | Auto-Loop 框架 |
| `src/cli/commands/orchestrate.ts` | 编排命令入口 |
| `src/cli/commands/gate.ts` | Gate 命令入口 |

### B. 测试覆盖

**单元测试**：
- `tests/unit/stage-machine.test.ts`
- `tests/unit/gate-evaluator.test.ts`
- `tests/unit/next-step-decider.test.ts`

**集成测试**：
- `tests/e2e/core-flow.test.ts`

### C. 相关文档

- [CLAUDE.md](../../CLAUDE.md) - 项目规范
- [使用手册](../07-用户文档/使用手册.md)
- [Skill 命令参考](../07-用户文档/Skill命令参考手册.md)

---

**报告生成**: Claude (Opus 4.6)
**审查人**: AI Agent
**审查日期**: 2026-03-13
