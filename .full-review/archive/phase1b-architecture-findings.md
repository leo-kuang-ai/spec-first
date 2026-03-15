# Phase 1B: 架构设计审查发现

**审查时间**: 2026-03-15 21:30
**审查范围**: Spec-First 核心架构（14 个核心模块 + CLI 层 + Skill 系统）
**审查方法**: 静态代码分析、依赖关系图构建、设计模式识别

---

## 执行摘要

### 总体评估

Spec-First 项目展现了一个**设计良好的分层架构**，具有清晰的模块边界和职责分离。项目成功实现了：
- ✅ 规范驱动的状态机设计（8+2 阶段）
- ✅ 三层路由系统（Semantic Map → Runtime Route → Skill File）
- ✅ 强类型的追溯 ID 体系（14 种 ID 类型）
- ✅ 良好的依赖方向（大部分模块依赖向内）

### 架构健康度评分: 8.3/10

| 维度 | 评分 | 说明 |
|------|------|------|
| 模块边界 | 9/10 | 职责清晰，内聚性高 |
| 依赖管理 | 7/10 | 大部分良好，存在循环依赖风险 |
| API 设计 | 8/10 | 接口清晰，少量不一致 |
| 数据模型 | 8/10 | 设计合理，可进一步拆分 |
| 设计模式 | 9/10 | 应用恰当，无过度工程 |
| 架构一致性 | 9/10 | 严格遵守规范 |

---

## 一、发现的架构问题（按严重程度分级）

### P0 - Critical（需要立即修复）

**无 Critical 级别问题发现** ✅

架构设计整体健壮，未发现需要立即修复的严重问题。

---

### P1 - High（本迭代内修复）

| # | 问题 | 严重级别 | 位置 | 架构影响 | 建议 |
|---|------|---------|------|---------|------|
| 1 | **循环依赖风险** | 🔴 High | `process-engine/next-step-decider.ts` ↔ `ai-orchestrator/` | Medium（当前可工作，但增加耦合度） | 将 `TodoRunnerState` 和 `AutoLoopStatus` 提取到 `shared/types.ts` |
| 2 | **Gate-Engine 外部依赖过多** | 🟠 Medium | `gate-engine/condition-registry.ts` | Medium（违反"Gate 条件应该是自包含"原则） | 引入依赖注入或接口隔离 |
| 3 | **CLI 错误契约不一致** | 🟠 Medium | 多个 CLI 命令 | Low（影响可维护性） | 统一使用 `ExitCode` 枚举 |
| 4 | **07_release 递归调用风险** | 🟠 Medium | `src/core/process-engine/advance.ts:242-256` | Low（理论上只一层递归） | 使用迭代循环替代递归 |
| 5 | **空矩阵边界条件处理不当** | 🟠 Medium | `src/core/trace-engine/coverage.ts:50-51` | Medium（可能误导开发者） | 返回 `null` 或明确警告 |
| 6 | **Gate 阈值配置不一致** | 🟠 Medium | `src/core/gate-engine/condition-registry.ts:80-121` | Low（影响可配置性） | 统一使用 `config.yaml` 管理所有阈值 |

---

### P2 - Medium（下个迭代修复）

| # | 问题 | 位置 | 架构影响 | 建议 |
|---|------|------|---------|------|
| 7 | **StageState 接口过于复杂** | `src/shared/types.ts:77-102` | Medium（违反单一职责原则） | 拆分为 `FeatureMeta`、`StageProgress`、`StageRuntime` |
| 8 | **缺少 Repository 抽象** | 多处直接使用 `fs` API | Medium（影响可测试性） | 引入 `FileRepository` 接口 |
| 9 | **类型安全可增强** | `src/shared/types.ts` | Low（使用 `string` 而非 branded types） | 使用 branded types 增强类型安全 |
| 10 | **Gate 条件 ID 编号不连续** | `src/core/gate-engine/condition-registry.ts` | Low（影响一致性） | 统一编号规范或补充文档说明 |
| 11 | **ID 格式扩展性受限** | `src/core/trace-engine/id-validator.ts:8-23` | Low（硬编码数组） | 添加配置驱动的 ID 类型注册机制 |
| 12 | **错误处理模式不一致** | 多处 | Low（影响可维护性） | 统一使用 Result 模式或全局异常处理 |

---

### P3 - Low（技术债务）

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| 13 | **types.ts 文件过大** | `src/shared/types.ts` (248 行) | 按领域拆分类型定义 |
| 14 | **缺少事件总线** | 跨模块直接函数调用 | 引入 `EventBus` 解耦模块通信 |
| 15 | **Layer2 Gate 命令缺少超时** | `src/core/gate-engine/gate-evaluator.ts:142` | 为 `runCommandGate` 添加超时参数 |
| 16 | **TDD 证据检测逻辑复杂** | `src/core/skill-runtime/hard-gate.ts:86-117` | 简化为结构化格式（如 YAML front matter） |
| 17 | **Constitution 版本比较简单** | `src/core/skill-runtime/hard-gate.ts:138-161` | 增强对非标准版本格式的容错 |
| 18 | **Git 命令超时配置** | `src/core/skill-runtime/hard-gate.ts:18` | 考虑增加到 10 秒或提供可配置选项 |
| 19 | **Feature ID 日期格式** | `src/core/process-engine/init.ts:88-98` | 使用 UTC 日期避免跨时区冲突 |
| 20 | **配置验证缺失** | `src/shared/config-schema.ts` | 添加 `validateConfig()` 函数 |
| 21 | **Markdown 表格解析脆弱** | `src/shared/fs-utils.ts` | 考虑使用更健壮的解析库 |
| 22 | **缺少 API 版本管理** | 无 | 添加 `--version` 参数和语义化版本控制 |

---

## 二、组件边界分析

### 2.1 核心模块职责划分 ✅ 优秀

**14 个核心模块**展现了清晰的职责分离：

| 模块 | 职责 | 内聚性评分 | 文件数 | 评价 |
|------|------|----------|--------|------|
| `process-engine` | 阶段状态机、Feature 生命周期 | 9/10 | 8 | 职责单一，边界清晰 |
| `skill-runtime` | Skill 分发、prompt 组装、hard-gate | 8/10 | 25+ | 功能相关，但文件数量多 |
| `gate-engine` | 阶段质量门禁评估（19 条规则） | 9/10 | 11 | 职责明确，扩展性好 |
| `trace-engine` | ID 生成/校验、覆盖率矩阵 | 10/10 | 10 | 高内聚，零跨模块污染 |
| `ai-orchestrator` | Auto-loop、catchup、context-pack | 8/10 | 17 | 复杂度高，但封装良好 |
| `change-mgr` | RFC + Defect 状态机 | 10/10 | 6 | 完全独立，零外部依赖 |
| `tool-integration` | AI runtime hooks、context 同步 | 9/10 | 11 | 新模块，设计清晰 |
| `host-adapters` | 宿主环境适配器（Claude/Codex/Gemini） | 10/10 | 7 | **架构亮点**：完美的适配器模式 |
| `migrations` | 状态文件版本迁移 | 9/10 | 6 | 职责单一 |
| `metrics-engine` | 健康度评分、瓶颈检测 | 9/10 | 5 | 职责清晰 |
| `template` | Handlebars 模板渲染 | 9/10 | 7 | 高内聚 |
| `task-plan` | task_plan.md 解析 | 10/10 | 2 | 职责单一 |
| `rules` | 静态规则定义 | 10/10 | 2 | 完全独立 |
| `validators` | 产物格式校验 | 10/10 | 1 | 职责明确 |
| `batch-executor` | 批量任务执行 | 9/10 | 4 | 职责清晰 |

**架构亮点**：`host-adapters` 模块是一个教科书式的**适配器模式**实现：
```typescript
export interface HostAdapter {
  id: HostId;
  detect(): boolean;
  capabilities(): HostCapability | undefined;
  summary(): string;
  maturity(): HostAdapterMaturity;
  remediation(detected: boolean): string;
  baselineState(): HostBaselineState;
  missingBaseline(): HostBaselinePart[];
}
```
- ✅ 统一接口，多态行为
- ✅ 运行时能力发现（`detect()`）
- ✅ 清晰的成熟度分级（`stable` / `experimental`）
- ✅ 自动化修复建议（`remediation()`）

### 2.2 层级划分合理性 ✅ 良好

```
┌─────────────────────────────────────┐
│  CLI Layer (src/cli/)               │  ← 用户交互层
│  27 个命令，薄封装，无业务逻辑      │
├─────────────────────────────────────┤
│  Core Layer (src/core/)             │  ← 领域核心层
│  14 个模块，高内聚，单向依赖        │
├─────────────────────────────────────┤
│  Shared Layer (src/shared/)         │  ← 基础设施层
│  types.ts、fs-utils、config-schema  │
└─────────────────────────────────────┘
```

**依赖统计**：
- CLI → Core: 75 个导入（✅ 正常）
- Core → Shared: 132 个导入（✅ 正常）
- Core 内部跨模块: ~20 个导入（⚠️ 见 3.1 节问题）

---

## 三、依赖管理分析

### 3.1 🔴 High: 循环依赖风险

**问题描述**：`process-engine` 和 `ai-orchestrator` 存在双向依赖：

```
process-engine/next-step-decider.ts
  → import { TodoRunnerState } from '../ai-orchestrator/todo-runner.js'
  → import { AutoLoopStatus } from '../ai-orchestrator/auto-loop.js'

ai-orchestrator/auto-loop.ts
  → import { OrchestrateArgs } from '../skill-runtime/orchestrate-args.js'
  → 无 process-engine 依赖（✅ 好）
```

**当前状态**：虽然不是真正的循环依赖，但形成了**三角依赖链**：
```
process-engine → ai-orchestrator → skill-runtime
       ↓                                  ↑
       └──────────────────────────────────┘
```

**改进建议**：
```typescript
// 建议：将共享类型提取到 shared/types.ts
// src/shared/types.ts
export interface TodoRunnerState { /* ... */ }
export type AutoLoopStatus = 'all_done' | 'has_blocked' | /* ... */;

// process-engine/next-step-decider.ts
import type { TodoRunnerState, AutoLoopStatus } from '../../shared/types.js';

// ai-orchestrator/todo-runner.ts
import type { TodoRunnerState } from '../../shared/types.js';
```

### 3.2 🟠 Medium: Gate-Engine 的外部依赖

**问题描述**：`gate-engine/condition-registry.ts` 依赖了 5 个外部模块：

```typescript
import { RELEASE_REQUIRED_ARTIFACTS } from '../rules/truth-source.js';
import { createTraceContext } from '../trace-engine/trace-context.js';
import { readFirstRuntimeIndex } from '../skill-runtime/first-runtime-store.js';
import { parseMatrix } from '../trace-engine/matrix.js';
import { loadRfcStatuses } from '../change-mgr/rfc.js';
```

**改进建议**：引入依赖注入
```typescript
export interface GateConditionContext {
  traceContext: TraceContext;
  rfcStatuses: Map<string, string>;
  firstRuntimeIndex?: FirstRuntimeIndex;
  // ...
}

export function createGateConditions(ctx: GateConditionContext): GateConditionDef[] {
  return [
    {
      id: 'G-PLAN-01',
      evaluate: () => {
        const uncovered = ctx.traceContext.getUncoveredFrIds();
        // ...
      }
    }
  ];
}
```

### 3.3 ✅ 依赖方向正确性

**优点**：大部分依赖遵循**依赖倒置原则**（DIP）：

```
高层模块（CLI） → 低层模块（Core） → 基础设施（Shared）
                ↓
          不反向依赖 ✅
```

**验证**：
```bash
# CLI 不被任何模块依赖
$ grep -r "from '\.\./cli/'" src/core/
# 输出：（空）✅

# Shared 不依赖任何业务模块
$ grep -r "from '\.\./core/'" src/shared/
# 输出：（空）✅
```

---

## 四、API 设计与数据模型

### 4.1 ✅ CLI 命令接口设计

**优点**：
- ✅ 统一的退出码（`ExitCode` 枚举）
- ✅ 一致的参数解析（`parseFlag` 工具）
- ✅ 清晰的子命令路由（`handleStage(args)` 模式）

**问题**：部分命令的**错误契约不一致**（见 P1-3）

### 4.2 ✅ Skill 接口契约清晰

**三层路由系统**设计优秀：

```
用户输入 → Semantic Map（复合命令映射）
         → Runtime Route（CLI 原子命令）
         → Skill File（SKILL.md 模板）
```

**优点**：
- ✅ 清晰的优先级（Semantic Map 优先）
- ✅ 扩展性好（新增 Skill 只需添加映射）
- ✅ 错误处理完善（`SKILL_NOT_FOUND`、`REMOVED_SKILL`）

### 4.3 ✅ 状态机设计优秀

**Stage 枚举**（8 个活跃阶段 + 2 个终止阶段）：

```typescript
export enum Stage {
  INIT = '00_init',
  SPECIFY = '01_specify',
  // ...
  DONE = '08_done',           // 终态
  CANCELLED = '09_cancelled',  // 终态
}
```

**优点**：
- ✅ 不可变性（`ReadonlySet`）
- ✅ 明确的终态（`TERMINAL_STAGES`）
- ✅ 校验函数（`assertTransitionAllowed()`）

### 4.4 ✅ 追溯 ID 体系设计清晰

**14 种 ID 类型**分为三大类：

| 类别 | ID 类型 | 用途 |
|------|---------|------|
| 业务链路 | FR, DS, TASK, TC, RFC | 需求 → 设计 → 任务 → 测试 |
| V-Model | REQ, SYS, ARCH, MOD, ATP, STP, ITP, UTP | 系统工程追溯 |
| 顶层 | Feature | Feature 粒度 |

**优点**：
- ✅ 文件锁保护（`withFileLock()`）
- ✅ 原子性写入（先校验后追加）
- ✅ 格式校验（`validateId()`）

### 4.5 🟠 Medium: StageState 接口过于复杂

**问题**：`StageState` 包含 15+ 个字段，职责过重（见 P2-7）

---

## 五、设计模式评估

### 5.1 ✅ 优秀模式应用

**适配器模式**（`host-adapters`）- **架构亮点**：
- ✅ 统一接口（`HostAdapter`）
- ✅ 多态行为（4 种宿主适配器）
- ✅ 运行时能力发现（`detect()`）
- ✅ 清晰的成熟度分级（`stable` / `experimental`）

**策略模式**（`gate-engine`）：
```typescript
export interface GateConditionDef {
  id: string;
  description: string;
  evaluate: (ctx: EvalContext) => ConditionResult;
}

// 不同阶段使用不同的条件策略
GATE_CONDITIONS['01_specify'] = [/* ... */];
GATE_CONDITIONS['04_implement'] = [/* ... */];
```

**模板方法模式**（`skill-runtime`）：
- ✅ 分层组装（模板 → 校验 → 注入）
- ✅ 可插拔的 Guard 机制
- ✅ 上下文感知（根据 Skill 类型注入不同信息）

### 5.2 🟠 Medium: 缺失的抽象

**问题 1**：缺少 Repository 抽象（见 P2-8）
**问题 2**：缺少 Event/Message Bus（见 P3-14）

### 5.3 ✅ 无过度工程化

**优点**：项目避免了过度抽象：
- ✅ 没有无用的抽象层
- ✅ 没有过度泛化的泛型
- ✅ 设计模式应用恰到好处

---

## 六、架构一致性

### 6.1 ✅ ESM 模块规范遵守

**验证**：
```bash
# package.json
"type": "module"

# 所有导入使用 .js 扩展名
$ grep -r "from '\.*/.*\.ts'" src/core/
# 输出：（空）✅
```

### 6.2 ✅ Named Exports Only 原则

**验证**：
```bash
# 检查 default export
$ grep -r "export default" src/core/
# 输出：（空）✅
```

### 6.3 ✅ 文件命名规范

**规范**：`kebab-case.ts`

**验证**：
```bash
# 检查违反规范的文件
$ find src/core -name "*_*.ts"
# 输出：（空）✅

$ find src/core -name "*[A-Z]*.ts"
# 输出：（空）✅
```

---

## 七、综合建议与行动计划

### 7.1 高优先级改进（本周内）

1. **消除循环依赖风险**（见 3.1 节）
   - 将 `TodoRunnerState` 和 `AutoLoopStatus` 提取到 `shared/types.ts`
   - 预计工作量：2 小时
   - 影响文件：3 个

2. **引入依赖注入**（见 3.2 节）
   - 重构 `gate-engine` 以接受接口而非具体实现
   - 预计工作量：4 小时
   - 影响文件：5 个

3. **统一错误契约**（见 P1-3）
   - 在所有 CLI 命令中使用 `ExitCode` 枚举
   - 预计工作量：1 小时
   - 影响文件：10+ 个

### 7.2 中优先级改进（本迭代内）

4. **拆分 StageState 接口**（见 P2-7）
   - 引入 `FeatureMeta`、`StageProgress`、`StageRuntime`
   - 预计工作量：3 小时
   - 影响文件：10+ 个

5. **引入 Repository 抽象**（见 P2-8）
   - 为文件操作引入统一接口
   - 预计工作量：4 小时
   - 影响文件：15+ 个

6. **增强类型安全**（见 P2-9）
   - 使用 branded types 替代 `string`
   - 预计工作量：3 小时
   - 影响文件：20+ 个

### 7.3 低优先级改进（未来 1-2 个月）

7. **拆分 types.ts**（见 P3-13）
   - 按领域拆分类型定义
   - 预计工作量：2 小时
   - 影响文件：50+ 个（仅导入路径）

8. **引入事件总线**（见 P3-14）
   - 解耦跨模块通信
   - 预计工作量：6 小时
   - 影响文件：10+ 个

---

## 八、架构债务评估

### 当前技术债

| 债务类型 | 数量 | 严重程度 | 预计清理时间 |
|---------|------|---------|------------|
| 循环依赖风险 | 1 | High | 2h |
| 缺失的抽象 | 2 | Medium | 10h |
| 类型安全问题 | 3 | Medium | 3h |
| 接口过大 | 1 | Medium | 3h |
| 文件组织 | 2 | Low | 4h |
| **总计** | **9** | — | **22h** |

---

## 九、风险评估

### 架构风险矩阵

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 循环依赖导致编译失败 | Medium | High | 立即提取共享类型 |
| Gate-Engine 难以测试 | High | Medium | 引入依赖注入 |
| StageState 修改引发回归 | Medium | Medium | 拆分接口 + 增加测试 |
| 新增宿主适配器成本高 | Low | Low | 已有优秀的适配器模式 |

---

## 十、结论

### 总体评价

Spec-First 项目展现了一个**设计良好的分层架构**，具有：
- ✅ 清晰的模块边界和职责分离
- ✅ 优秀的状态机设计和追溯体系
- ✅ 灵活的三层路由系统
- ✅ 教科书式的适配器模式实现
- ✅ 严格的架构规范遵守

### 主要优势

1. **架构清晰**：14 个核心模块职责明确，依赖方向正确
2. **扩展性强**：适配器模式、策略模式应用恰当
3. **类型安全**：TypeScript 严格模式，集中类型定义
4. **规范遵守**：ESM、Named Exports、文件命名规范严格遵守

### 需改进领域

1. **依赖管理**：消除循环依赖风险，引入依赖注入
2. **接口设计**：拆分过大接口，增强类型安全
3. **可测试性**：引入 Repository 抽象，降低测试成本

### 架构健康度评分

**总体评分**: **8.3/10** (优秀)

项目整体架构设计优秀，主要问题集中在依赖管理和接口设计方面，建议按优先级逐步改进。

---

**审查完成时间**: 2026-03-15 21:30
**审查人**: Software Architect Agent
**下一步**: Phase 2A - 安全漏洞评估
