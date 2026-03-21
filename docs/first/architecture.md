# Spec-First 架构关系

> 基于 `.spec-first/runtime/first/critical-flows.json` 真源生成

---

## 核心流程

### 1. CLI 命令分发流程

**入口**：`src/cli/index.ts:103`

**风险等级**：medium

**步骤**：
1. `dispatch(process.argv.slice(2))`
2. 查找命令注册表 `commands.get(cmd)`
3. `shouldRequireConfirmation()` 校验确认策略
4. `resolveConfirmPolicy()` 评估 mode/size
5. `entry.handler(subArgs)` 调用命令处理器

**证据**：`src/cli/index.ts:36-103`, `src/cli/router.ts:79-122`

---

### 2. 阶段推进流程

**入口**：`src/core/process-engine/advance.ts:123`

**风险等级**：critical（不可逆操作）

**步骤**：
1. `loadState()` 加载 `stage-state.json`
2. `assertTransitionAllowed(from, to)` 状态机校验
3. `checkDependencies()` 检查目标阶段产物依赖
4. `evaluateGate()` 执行 Gate 条件评估
5. `saveState()` 写入 `stage-state.json`（不可逆）
6. `writeLog()` 写入 `gate-history.jsonl`
7. `syncAgentContextFromDesign()` 上下文同步（02→03）

**证据**：`src/core/process-engine/advance.ts:123-337`, `src/core/process-engine/stage-machine.ts:8-51`

---

### 3. Gate 条件评估流程

**入口**：`src/core/gate-engine/gate-evaluator.ts:106`

**风险等级**：high

**步骤**：
1. `parseMatrix()` 解析追踪矩阵
2. `loadRfcStatuses()` 加载 RFC 状态
3. `getCoverage()` 计算 C3/C4/C6/C8/C9
4. `getConditions()` 获取阶段条件定义（Layer1）
5. `def.evaluate(ctx)` 遍历执行条件评估
6. `runCommandGate()` 执行 Layer2 命令 Gate
7. `validateExceptions()` 匹配豁免
8. `appendJsonl()` 持久化到 `gate-history.jsonl`

**证据**：`src/core/gate-engine/gate-evaluator.ts:106-224`, `src/core/gate-engine/condition-registry.ts:41-407`

---

### 4. Skill 三层路由分发

**入口**：`src/core/skill-runtime/dispatcher.ts:258`

**风险等级**：high

**步骤**：
1. 解析命令（提取 `namespace:skillName`）
2. `SEMANTIC_MAP` 查找复合命令映射
3. `RUNTIME_COMMANDS` 查找直接 CLI 分发
4. `resolveSkillPath()` 查找 Skill 文件
5. `loadSkill()` 加载并组装 prompt
6. `evaluateSkillHardGate()` Hard-Gate 校验
7. `evaluateRuntimeScopeGuard()` 作用域守卫
8. `buildXxxRuntimeNotice()` 注入运行时上下文

**证据**：`src/core/skill-runtime/dispatcher.ts:258-555`, `src/core/skill-runtime/hard-gate.ts:163-292`

---

### 5. Auto-Loop 任务编排流程

**入口**：`src/core/ai-orchestrator/auto-loop.ts:146`

**风险等级**：high

**步骤**：
1. `loadTodoState()` 加载 `todo-state.json`
2. `recoverInterruptedTasks()` 恢复僵尸任务（P9）
3. `while (iteration < maxIterations)` 主循环
4. `pickReadyTodos()` 选择就绪任务
5. `Promise.race([executor(task), timeout])` 执行任务
6. `runWatchdogCheck()` 超时/心跳检测
7. `runPostWriteGuards()` 后置守卫
8. `advanceTodoIteration()` + checkpoint

**证据**：`src/core/ai-orchestrator/auto-loop.ts:146-699`

---

### 6. 覆盖率计算流程

**入口**：`src/core/trace-engine/coverage.ts:18`

**风险等级**：high

**步骤**：
1. `parseMatrix()` 或使用预解析 rows
2. `loadValidExceptionFrIds()` 加载有效豁免
3. 过滤 `EXCLUDED_STATUSES`（Deferred/Cancelled）
4. `createTraceContext(active)` 创建追溯上下文
5. `calcTaskCoverage()` → C3（传递链）
6. `calcTestCoverageFR()` → C4（直接）
7. `calcImplCoverage()` → C6
8. `calcTaskCompliance()` → C8
9. `calcTcCompliance()` → C9

**证据**：`src/core/trace-engine/coverage.ts:18-182`

---

## 高影响点

| 文件 | 关键元素 | 风险等级 | 影响 |
|------|---------|---------|------|
| `src/shared/types.ts` | Stage 枚举, ExitCode, CoverageMetrics | critical | 阶段定义变更影响所有状态机、Gate 条件 |
| `src/core/process-engine/stage-machine.ts` | TRANSITIONS 表 | critical | 转换表变更直接影响 advance 合法性 |
| `src/core/gate-engine/condition-registry.ts` | GATE_CONDITIONS | high | 新增/删除条件影响所有 Feature 阶段推进 |
| `src/core/skill-runtime/dispatcher.ts` | RUNTIME_COMMANDS, SEMANTIC_MAP | high | 路由表变更影响所有 Skill 分发 |
| `src/core/ai-orchestrator/auto-loop.ts` | runAutoLoop() 主循环 | high | 循环逻辑变更影响所有 Auto-Loop 执行 |
| `src/core/trace-engine/coverage.ts` | getCoverage(), C3/C4/C6/C8/C9 | high | 算法变更直接影响 Gate 校验结果 |

---

## 跨模块依赖

### 类型依赖

```
src/shared/types.ts
    ├── src/core/process-engine/stage-machine.ts
    ├── src/core/gate-engine/gate-evaluator.ts
    ├── src/core/trace-engine/coverage.ts
    └── src/cli/router.ts
```

### 函数调用依赖

```
src/core/process-engine/stage-machine.ts
    └── src/core/process-engine/advance.ts

src/core/trace-engine/matrix.ts
    ├── src/core/gate-engine/gate-evaluator.ts
    └── src/core/trace-engine/coverage.ts

src/core/gate-engine/gate-evaluator.ts
    ├── src/core/process-engine/advance.ts
    └── src/cli/commands/orchestrate.ts

src/core/skill-runtime/dispatcher.ts
    ├── src/core/skill-runtime/hard-gate.ts
    ├── src/core/skill-runtime/prompt-assembler.ts
    └── src/core/skill-runtime/scope-guard.ts
```

---

## 数据来源

- 真源：`.spec-first/runtime/first/critical-flows.json`
