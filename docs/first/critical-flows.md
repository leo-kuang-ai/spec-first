# 关键流程

> 本文档基于 `.spec-first/runtime/first/critical-flows.json` 真源生成

## 概述

Spec-First 核心引擎包含 6 个关键流程，按风险等级分类：

| 流程 | 风险等级 | 入口文件 |
|------|---------|---------|
| 阶段推进 | Critical | `src/core/process-engine/advance.ts` |
| Gate 条件评估 | High | `src/core/gate-engine/gate-evaluator.ts` |
| Skill 三层路由分发 | High | `src/core/skill-runtime/dispatcher.ts` |
| Auto-Loop 任务编排 | High | `src/core/ai-orchestrator/auto-loop.ts` |
| 覆盖率计算 | High | `src/core/trace-engine/coverage.ts` |
| CLI 命令分发 | Medium | `src/cli/index.ts` |

---

## 1. 阶段推进流程

**风险等级**: Critical

**入口**: `src/core/process-engine/advance.ts:123`

**步骤**:
1. `loadState()` 加载 `stage-state.json`
2. `assertTransitionAllowed(from, to)` 状态机校验
3. `checkDependencies()` 检查目标阶段产物依赖
4. `evaluateGate()` 执行 Gate 条件评估
5. `saveState()` 写入 `stage-state.json`（不可逆）
6. `writeLog()` 写入 `gate-history.jsonl`
7. `syncAgentContextFromDesign()` 上下文同步（02→03）

**证据**:
- `src/core/process-engine/advance.ts:123-337`
- `src/core/process-engine/stage-machine.ts:8-51`

---

## 2. Gate 条件评估流程

**风险等级**: High

**入口**: `src/core/gate-engine/gate-evaluator.ts:106`

**步骤**:
1. `parseMatrix()` 解析追踪矩阵
2. `loadRfcStatuses()` 加载 RFC 状态
3. `getCoverage()` 计算 C3/C4/C6/C8/C9
4. `getConditions()` 获取阶段条件定义（Layer1）
5. `def.evaluate(ctx)` 遍历执行条件评估
6. `runCommandGate()` 执行 Layer2 命令 Gate
7. `validateExceptions()` 匹配豁免
8. `appendJsonl()` 持久化到 `gate-history.jsonl`

**证据**:
- `src/core/gate-engine/gate-evaluator.ts:106-224`
- `src/core/gate-engine/condition-registry.ts:41-407`

---

## 3. Skill 三层路由分发

**风险等级**: High

**入口**: `src/core/skill-runtime/dispatcher.ts:258`

**步骤**:
1. 解析命令（提取 `namespace:skillName`）
2. `SEMANTIC_MAP` 查找复合命令映射
3. `RUNTIME_COMMANDS` 查找直接 CLI 分发
4. `resolveSkillPath()` 查找 Skill 文件
5. `loadSkill()` 加载并组装 prompt
6. `evaluateSkillHardGate()` Hard-Gate 校验
7. `evaluateRuntimeScopeGuard()` 作用域守卫
8. `buildXxxRuntimeNotice()` 注入运行时上下文

**证据**:
- `src/core/skill-runtime/dispatcher.ts:258-555`
- `src/core/skill-runtime/hard-gate.ts:163-292`

---

## 4. Auto-Loop 任务编排流程

**风险等级**: High

**入口**: `src/core/ai-orchestrator/auto-loop.ts:146`

**步骤**:
1. `loadTodoState()` 加载 `todo-state.json`
2. `recoverInterruptedTasks()` 恢复僵尸任务（P9）
3. `while (iteration < maxIterations)` 主循环
4. `pickReadyTodos()` 选择就绪任务
5. `Promise.race([executor(task), timeout])` 执行任务
6. `runWatchdogCheck()` 超时/心跳检测
7. `runPostWriteGuards()` 后置守卫
8. `advanceTodoIteration()` + checkpoint

**证据**:
- `src/core/ai-orchestrator/auto-loop.ts:146-699`

---

## 5. 覆盖率计算流程

**风险等级**: High

**入口**: `src/core/trace-engine/coverage.ts:18`

**步骤**:
1. `parseMatrix()` 或使用预解析 rows
2. `loadValidExceptionFrIds()` 加载有效豁免
3. 过滤 `EXCLUDED_STATUSES`（Deferred/Cancelled）
4. `createTraceContext(active)` 创建追溯上下文
5. `calcTaskCoverage()` → C3（传递链）
6. `calcTestCoverageFR()` → C4（直接）
7. `calcImplCoverage()` → C6
8. `calcTaskCompliance()` → C8
9. `calcTcCompliance()` → C9

**证据**:
- `src/core/trace-engine/coverage.ts:18-182`

---

## 6. CLI 命令分发流程

**风险等级**: Medium

**入口**: `src/cli/index.ts:103`

**步骤**:
1. `dispatch(process.argv.slice(2))`
2. 查找命令注册表 `commands.get(cmd)`
3. `shouldRequireConfirmation()` 校验确认策略
4. `resolveConfirmPolicy()` 评估 mode/size
5. `entry.handler(subArgs)` 调用命令处理器

**证据**:
- `src/cli/index.ts:36-103`
- `src/cli/router.ts:79-122`

---

## 高影响点

| 文件 | 关键元素 | 风险 | 影响范围 |
|------|---------|------|---------|
| `src/shared/types.ts` | Stage 枚举, ExitCode, CoverageMetrics | Critical | 阶段定义变更影响所有状态机、Gate 条件 |
| `src/core/process-engine/stage-machine.ts` | TRANSITIONS 表 | Critical | 转换表变更直接影响 advance 合法性 |
| `src/core/gate-engine/condition-registry.ts` | GATE_CONDITIONS | High | 新增/删除条件影响所有 Feature 阶段推进 |
| `src/core/skill-runtime/dispatcher.ts` | RUNTIME_COMMANDS, SEMANTIC_MAP | High | 路由表变更影响所有 Skill 分发 |
| `src/core/ai-orchestrator/auto-loop.ts` | runAutoLoop() 主循环 | High | 循环逻辑变更影响所有 Auto-Loop 执行 |
| `src/core/trace-engine/coverage.ts` | getCoverage(), C3/C4/C6/C8/C9 | High | 算法变更直接影响 Gate 校验结果 |

---

## 已知局限

- **动态调用链**: 基于静态代码分析，未包含运行时动态调用
- **测试覆盖**: 未分析测试代码中的调用关系
- **Extension 扩展**: 未深入分析 `extensions.ts` 中的扩展加载机制
