# 关键流程

## 1. CLI 启动流程

### 触发条件
用户执行 `spec-first <command>`

### 执行步骤

| 步骤 | 动作 | 文件 | 函数 |
|------|------|------|------|
| 1 | Node.js 加载入口文件 | src/cli/index.ts | 顶层执行 |
| 2 | 注册所有命令 | src/cli/index.ts | `registerCommand()` |
| 3 | 分发命令 | src/cli/index.ts | `dispatch(process.argv.slice(2))` |
| 4 | 执行命令 handler | src/cli/commands/*.ts | `handleXxx()` |

### 关键点

- 命令注册必须在 dispatch 之前完成
- handler 必须返回 ExitCode

### 风险点

- 未知命令返回错误码
- 异步 handler 未正确处理会丢失错误

---

## 2. Stage 状态机流转

### 触发条件
`spec-first stage advance`

### 执行步骤

| 步骤 | 动作 | 文件 | 函数 |
|------|------|------|------|
| 1 | 加载当前状态 | src/core/process-engine/stage-machine.ts | `loadStageState()` |
| 2 | 执行 Gate 校验 | src/core/gate-engine/gate-evaluator.ts | `evaluateGate()` |
| 3 | 判断是否可以推进 | src/core/process-engine/stage-machine.ts | `canAdvance()` |
| 4 | 更新状态 | src/core/process-engine/stage-machine.ts | `advanceStage()` |

### 关键点

- Gate 校验失败时不可推进
- 状态变更不可逆（单向流动）

### 风险点

- 跳过 Gate 校验会导致质量失控
- 状态文件损坏会导致无法推进

### Stage 枚举

```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done
任意阶段 → 09_cancelled
```

---

## 3. Skill 执行流程

### 触发条件
`/spec-first:<skill>` 或 `spec-first skill render`

### 执行步骤

| 步骤 | 动作 | 文件 | 函数 |
|------|------|------|------|
| 1 | 解析 Skill 名称 | src/core/skill-runtime/dispatcher.ts | `resolveSkillPath()` |
| 2 | 组装 Prompt | src/core/skill-runtime/prompt-assembler.ts | `assemblePrompt()` |
| 3 | 执行 Hard-Gate 校验 | src/core/skill-runtime/hard-gate.ts | `checkHardGate()` |
| 4 | 返回 Skill 内容 | src/core/skill-runtime/dispatcher.ts | `dispatch()` |

### 关键点

- Skill 路径解析失败会返回错误
- Hard-Gate 失败会阻断执行

### 风险点

- 阶段不匹配时执行会导致产物不一致

---

## 4. Gate 门禁评估

### 触发条件
`spec-first gate check`

### 执行步骤

| 步骤 | 动作 | 文件 | 函数 |
|------|------|------|------|
| 1 | 加载阶段条件 | src/core/gate-engine/condition-registry.ts | `GATE_CONDITIONS[stage]` |
| 2 | 执行条件评估 | src/core/gate-engine/gate-evaluator.ts | `evaluateConditions()` |
| 3 | 汇总结果 | src/core/gate-engine/gate-evaluator.ts | `aggregateResults()` |
| 4 | 输出报告 | src/core/gate-engine/gate-evaluator.ts | `formatGateResult()` |

### 关键点

- 任一 blocking 条件失败则整体 FAIL
- 豁免机制可临时绕过特定条件

### 风险点

- 豁免滥用会削弱质量保障

### Gate 规则

- **总数**：19 条
- **Blocking**：16 条
- **Warning**：3 条

---

## 5. 追溯 ID 生成

### 触发条件
`spec-first id generate`

### 执行步骤

| 步骤 | 动作 | 文件 | 函数 |
|------|------|------|------|
| 1 | 验证 ID 类型 | src/core/trace-engine/id-validator.ts | `validateIdType()` |
| 2 | 生成 ID | src/core/trace-engine/id-generator.ts | `generateId()` |
| 3 | 注册到矩阵 | src/core/trace-engine/matrix.ts | `registerId()` |

### 关键点

- ID 格式必须符合规范
- FEAT 缩写必须在 `.feat-registry.md` 中注册

### 风险点

- ID 冲突会导致追溯混乱

### ID 格式

`{TYPE}-{FEAT}-{NNN}`

### ID 类型（14 类）

- 业务链路：FR, DS, TASK, TC, RFC
- V-Model：REQ, SYS, ARCH, MOD, ATP, STP, ITP, UTP
- 顶层：Feature

---

## 证据来源

- CLI 入口 (`src/cli/index.ts:36-101`) — 命令注册 — 显式
- Stage 枚举 (`src/shared/types.ts:7-18`) — 阶段定义 — 显式
- Gate 条件 (`src/core/gate-engine/condition-registry.ts:41`) — 条件表 — 显式
