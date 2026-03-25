# 入口指南（快速上手）

> 本文档基于 `.spec-first/runtime/first/` 下的真源资产生成，所有结论附带证据路径。

---

## 快速上手

### 1. 环境初始化

```bash
# 安装依赖
pnpm install && pnpm link --global

# 或使用 npm
npm install

# 构建项目
npm run build

# 验证安装
npm run typecheck
npm test
```

### 2. 验证安装

```bash
spec-first feature current
```

### 3. 项目首轮认知

```bash
spec-first first
```

此命令分析项目并生成 runtime context。

**证据**: `entry-guide.json:7-14 (quick start)`

---

## 项目结构概览

```
src/
  cli/        # CLI 命令注册与路由（27 个命令）
  core/       # 核心引擎（14 个模块）
  shared/     # 共享类型（types.ts）、工具函数
specs/        # Feature 产物目录（状态文件由 CLI 管理）
skills/       # Skill 定义（.md 文件，20 个）
templates/    # Handlebars 模板
.spec-first/  # 项目级配置与运行时状态
```

**证据**: `entry-guide.json:84-92 (project structure)`

---

## 核心模块入口

### CLI 层

| 路径 | 描述 |
|------|------|
| `src/cli/index.ts:1-97` | 入口，注册所有命令 |
| `src/cli/router.ts:1-157` | 命令路由与分发 |

### Core 层（14 个核心模块）

| 模块 | 职责 | 关键符号 |
|------|------|----------|
| `process-engine/` | 阶段状态机（8 active + 2 terminal） | `Stage`, `TRANSITIONS`, `advance` |
| `skill-runtime/` | Skill 分发、prompt 组装 | `dispatchCommand`, `SEMANTIC_MAP` |
| `gate-engine/` | 质量门禁评估（19 条规则） | `evaluateGate`, `getConditions` |
| `trace-engine/` | ID 生成/校验/搜索、覆盖率 | `nextId`, `reserveId`, `searchId` |
| `ai-orchestrator/` | Auto-loop、catchup 上下文恢复 | `runAutoLoop`, `catchup` |
| `change-mgr/` | RFC + Defect 状态机 | `createRfc`, `transitionRfc` |
| `template/` | Handlebars 模板渲染 | `renderTemplate`, `renderToString` |
| `tool-integration/` | AI runtime hooks | `syncAgentContextFromDesign` |
| `metrics-engine/` | 健康度评分、瓶颈检测 | `calcHealthScore`, `getGrade` |
| `validators/` | 产物格式校验 | `validateFormat`, `validateRequiredFields` |
| `task-plan/` | task_plan.md 解析 | `parseTaskPlanContent`, `toTaskNodes` |
| `rules/` | 真理源定义 | `RELEASE_REQUIRED_ARTIFACTS` |
| `batch-executor/` | 批量任务执行 | `executeManifest`, `executeStep` |
| `migrations/` | 状态文件版本迁移 | `executeManifest`, `copyDirectory` |

**证据**: `summary.json:32-116 (core modules)`

### Shared 层

| 路径 | 描述 |
|------|------|
| `src/shared/types.ts:1-275` | Stage enum, ExitCode, FeatureState, GateResult 等 |
| `src/shared/host-paths.ts:1-256` | detectHostPaths, HostPaths |
| `src/shared/logger.ts` | 日志工具 |
| `src/shared/fs-utils.ts` | 文件系统工具 |

**证据**: `structure-overview.json:173-181 (shared layer)`

---

## 架构分层

```
+-------------------------------------------------------------+
|                        CLI Layer                            |
|  cli/index.ts --> cli/router.ts --> cli/commands/*         |
+---------------------------+---------------------------------+
                            | calls
                            v
+-------------------------------------------------------------+
|                        Core Layer                           |
|  process-engine | skill-runtime | gate-engine | trace-engine |
|  ai-orchestrator | change-mgr | template | tool-integration |
|  metrics-engine | validators | task-plan | rules            |
|  batch-executor | migrations | host-adapters                |
+---------------------------+---------------------------------+
                            | depends on
                            v
+-------------------------------------------------------------+
|                       Shared Layer                          |
|  shared/types.ts (Stage, ExitCode, FeatureState, etc.)      |
+-------------------------------------------------------------+
```

**证据**: `structure-overview.json:303-348 (dependencies graph)`

---

## 关键流程入口

### CLI 命令路由流程

```
src/cli/index.ts:95 dispatch(process.argv.slice(2))
        |
        v
src/cli/router.ts:78 dispatch() 解析命令名
        |
        v
src/cli/router.ts:111 entry.handler(subArgs)
```

**证据**: `critical-flows.json:6-19 (CLI 命令路由流程)`

### Feature 初始化流程

```
src/cli/commands/init.ts:612 handleInit()
        |
        v
src/cli/commands/init.ts:758 runFeatureInitTrack()
        |
        v
src/core/process-engine/init.ts:928 init()
        |
        v
src/core/process-engine/init.ts:961 commitFeatureInit()
```

**证据**: `critical-flows.json:22-42 (Feature 初始化流程)`

### Stage 推进流程

```
src/cli/commands/transition.ts:24 handleTransition() -> advance()
        |
        v
src/core/process-engine/advance.ts:59 advance()
        |
        v
src/core/process-engine/advance.ts:74 checkReadiness()
        |
        v
src/core/process-engine/advance.ts:87 applyTransition()
```

**证据**: `critical-flows.json:45-66 (Stage 推进流程)`

### Gate 校验流程

```
src/cli/commands/gate.ts:71 handleCheck()
        |
        v
src/core/gate-engine/gate-evaluator.ts:57 evaluateGate()
        |
        v
src/core/gate-engine/gate-evaluator.ts:68 getConditions()
        |
        v
src/core/gate-engine/gate-evaluator.ts:73 def.evaluate(ctx)
```

**证据**: `critical-flows.json:69-91 (Gate 校验流程)`

### Skill 分发流程

```
src/core/skill-runtime/dispatcher.ts:260 dispatchCommand()
        |
        v
src/core/skill-runtime/dispatcher.ts:319 resolveSkillPath()
        |
        v
src/core/skill-runtime/dispatcher.ts:419 loadSkill()
        |
        v
src/core/skill-runtime/prompt-assembler.ts:177 assemblePrompt()
```

**证据**: `critical-flows.json:94-134 (Skill 分发流程)`

---

## 常用命令速查

### 构建与测试

| 任务 | 命令 |
|------|------|
| 构建 | `npm run build` |
| 类型检查 | `npm run typecheck` |
| 全量测试 | `npm test` |
| 单文件测试 | `npx vitest run tests/unit/<file>.test.ts` |
| Watch 测试 | `npm run test:watch` |
| Lint | `npm run lint` |
| 格式化 | `npm run format` |

### Spec-First CLI

| 任务 | 命令 |
|------|------|
| 查看当前 Feature | `spec-first feature current` |
| 切换 Feature | `spec-first feature switch <featureId>` |
| 状态概览 | `spec-first status <featureId>` |
| 推进节点 | `spec-first transition <featureId>` |
| 校验文档关联 | `spec-first validate links <featureId>` |
| 校验产物格式 | `spec-first validate format <featureId>` |
| 收口到 08_done | `spec-first done <featureId>` |
| 查看追踪矩阵 | `spec-first matrix check <featureId>` |
| 创建缺陷 | `spec-first defect create --feature <featureId>` |
| 创建 RFC | `spec-first rfc create --feature <featureId>` |

**证据**: `CLAUDE.md:115-132 (common commands)`

---

## 推荐阅读顺序

### 新手入门

1. **`CLAUDE.md`** - 项目规范与工作流程（必读）
2. **`src/shared/types.ts`** - 核心类型定义（Stage、ExitCode、ID types）
3. **`package.json`** - 依赖与脚本配置

### 深入理解

4. **`src/core/process-engine/`** - 理解阶段状态机
5. **`src/core/trace-engine/`** - 理解追溯 ID 体系
6. **`src/core/gate-engine/`** - 理解质量门禁
7. **`src/core/skill-runtime/`** - 理解 Skill 分发

### 实践参考

8. **`skills/`** - Skill 定义与用法
9. **`templates/`** - 模板结构

---

## 证据路径汇总

| 内容 | 证据文件 |
|------|----------|
| quick start | `entry-guide.json:7-14` |
| project structure | `entry-guide.json:84-92` |
| core modules | `summary.json:32-116` |
| shared layer | `structure-overview.json:173-181` |
| dependencies graph | `structure-overview.json:303-348` |
| CLI 命令路由流程 | `critical-flows.json:6-19` |
| Feature 初始化流程 | `critical-flows.json:22-42` |
| Stage 推进流程 | `critical-flows.json:45-66` |
| Gate 校验流程 | `critical-flows.json:69-91` |
| Skill 分发流程 | `critical-flows.json:94-134` |
| common commands | `CLAUDE.md:115-132` |
