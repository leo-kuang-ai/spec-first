# Spec-First 架构设计

> 本文档基于 `.spec-first/runtime/first/structure-overview.json` 与 `critical-flows.json` 生成，阐述 spec-first 的核心架构设计。

---

## 1. 架构总览

### 1.1 系统定位

Spec-First 是一个 **AI-workflow CLI 工具**，用于驱动 spec-driven（规范驱动）开发流程，提供：
- **质量门禁（Gate）**：阶段转换前的质量校验
- **可追溯性（Traceability）**：需求到实现的双向追踪
- **Feature 生命周期管理**：从需求到上线的完整阶段流转

(`summary.json:project` — 项目定位与描述 — [显式])

### 1.2 架构分层图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户层 (User Layer)                       │
│                     CLI / AI Host / IDE Plugin                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Skill 层 (Skill Layer)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ 00-first│ │01-init  │ │03-spec  │ │07-code  │ │08-review│  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                     20 个 Skill 定义 (.md)                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLI 层 (CLI Layer)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    router.ts (分发器)                     │  │
│  │  dispatch() → registerCommand() → evaluatePolicy()       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │id.ts   │ │stage.ts│ │gate.ts │ │matrix.ts│ │init.ts │ ...   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
│                     28 个 CLI 命令处理器                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Core 层 (Core Layer)                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │process-engine│ │ gate-engine  │ │trace-engine  │            │
│  │ (状态机)      │ │ (门禁评估)   │ │ (追溯系统)   │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │skill-runtime │ │ai-orchestrator│ │change-mgr   │            │
│  │ (Skill 分发) │ │ (AI 编排)     │ │ (变更管理)  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │template      │ │batch-executor│ │migrations    │            │
│  │ (模板渲染)   │ │ (批量执行)   │ │ (版本迁移)  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                     14 个核心模块                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Shared 层 (Shared Layer)                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │types.ts (Stage, ID, ExitCode) + fs-utils + logger      │    │
│  └────────────────────────────────────────────────────────┘    │
│                     13 个共享模块                                │
└─────────────────────────────────────────────────────────────────┘
```

(`src/core/process-engine/:1` — 8 个文件 — [显式])

---

## 2. 双层架构：Skill + CLI

### 2.1 设计动机

Spec-First 需要同时支持两种使用模式：
1. **人类用户**：通过 CLI 命令直接操作
2. **AI Agent**：通过 Skill 获取结构化的 Prompt 指导

为此采用双层架构，Skill 层作为 AI 友好的入口，CLI 层作为通用执行引擎。

### 2.2 Skill 层

**职责**：提供 AI Agent 可理解的 Skill 定义文件（Markdown 格式），包含：
- Skill 元数据（frontmatter）
- 执行上下文要求
- Prompt 模板
- 输出格式规范

**三层路由机制** (`src/core/skill-runtime/dispatcher.ts:258-338` — 三层路由实现 — [显式])：

```
用户输入 /spec-first:code
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Semantic Map（语义映射）                            │
│ 复合命令映射，如 rfc approve → rfc transition approved       │
│ SEMANTIC_MAP[key]                                           │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Runtime Route（运行时路由）                         │
│ Runtime 命令直接分发到 CLI                                   │
│ RUNTIME_COMMANDS.has(skillName) ? dispatchCLI() : ...       │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Skill File（Skill 文件查找）                        │
│ 查找 SKILL.md 文件路径                                       │
│ resolveSkillPath() → skills/spec-first/07-code/SKILL.md     │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 CLI 层

**职责**：接收命令行输入，执行具体操作，返回结果。

**命令路由流程** (`src/cli/router.ts:79-121` — 命令分发与执行 — [显式])：

1. 解析命令名，查找已注册命令
2. 校验参数并检查确认策略
3. 执行命令处理器
4. 返回退出码（ExitCode）

---

## 3. 三层规范系统

### 3.1 阶段状态机（Stage Machine）

Spec-First 定义了 10 个阶段（8 active + 2 terminal），驱动 Feature 从需求到上线的完整生命周期。

**阶段流转图** (`src/shared/types.ts:7-18` — Stage 枚举定义 — [显式])：

```
00_init ──► 01_specify ──► 02_design ──► 03_plan ──► 04_implement
                                                         │
                                                         ▼
08_done ◄── 07_release ◄── 06_wrap_up ◄── 05_verify ◄────┘

                    ┌─────────────────┐
                    │  09_cancelled   │ (任意阶段可取消)
                    └─────────────────┘
```

**阶段转换规则** (`src/core/process-engine/stage-machine.ts:8` — 转换表定义 — [显式])：
- 阶段转换单向不可逆（除 09_cancelled）
- 终态阶段（08_done/09_cancelled）不可再转换
- 每次转换需通过 Gate 校验

### 3.2 追溯 ID 体系（Traceability IDs）

Spec-First 定义了 14 类追溯 ID，支持需求到实现的双向追踪。

**ID 类型分类** (`src/shared/types.ts:24-38` — ID 类型定义 — [显式])：

| 链路 | ID 类型 | 用途 |
|------|---------|------|
| 业务链路 | FR, DS, TASK, TC, RFC | 需求 → 设计 → 任务 → 测试用例 → 变更请求 |
| V-Model 链路 | REQ, SYS, ARCH, MOD | 系统需求 → 系统规格 → 架构设计 → 模块设计 |
| 测试链路 | ATP, STP, ITP, UTP | 验收测试 → 系统测试 → 集成测试 → 单元测试 |
| 顶层 | Feature | Feature 唯一标识 |

**ID 格式**：`{TYPE}-{ABBR}-{SEQ}`（如 `FR-UIOPT-001`）

### 3.3 覆盖率指标（Coverage Metrics）

**5 项覆盖率指标** (`src/core/trace-engine/coverage.ts:44-113` — 覆盖率计算 — [显式])：

| 指标 | 计算逻辑 | 用途 |
|------|---------|------|
| C3 | TASK 覆 FR（支持传递链） | 任务对需求的覆盖率 |
| C4 | TC 覆 FR（仅直接关联） | 测试用例对需求的覆盖率 |
| C6 | TASK 已实现率 | 任务完成进度 |
| C8 | TASK 有上游 FR | 任务合规性（无孤儿任务） |
| C9 | TC 有上游 FR | 测试用例合规性（无孤儿 TC） |

---

## 4. 七大核心模块设计

### 4.1 process-engine（阶段状态机）

**职责**：驱动 Feature 生命周期，管理阶段转换。

**关键函数** (`src/core/process-engine/advance.ts:123` — advance 入口 — [显式])：

```typescript
// 阶段推进核心流程
async function advance(featureId: string, projectRoot: string) {
  // 1. 加载状态并校验终态
  const state = loadState(featureId);
  if (isTerminal(state.stage)) throw new Error('Cannot advance from terminal stage');

  // 2. 校验转换合法性
  assertTransitionAllowed(state.stage, targetStage);

  // 3. 执行依赖检查
  checkDependencies(state.stage);

  // 4. 执行 Gate 校验
  const gateResult = await evaluateGate(featureId, state.stage);

  // 5. 更新状态
  saveState(featureId, { ...state, stage: targetStage });
}
```

### 4.2 gate-engine（门禁评估）

**职责**：评估阶段转换前的质量条件。

**19 条 Gate 条件** (`src/core/gate-engine/condition-registry.ts:41` — 条件注册 — [显式])：
- 16 条 blocking 条件（FAIL 阻断推进）
- 3 条 warning 条件（FAIL 不阻断，仅警告）

**三态结果**：
- `PASS`：所有条件满足
- `PASS_WITH_WAIVER`：有有效 Exception 豁免
- `FAIL`：存在未满足的 blocking 条件

### 4.3 trace-engine（追溯系统）

**职责**：管理追溯 ID 的生成、校验、搜索，计算覆盖率。

**关键流程** (`src/core/trace-engine/id-generator.ts:30` — ID 生成入口 — [显式])：

1. 获取文件锁（防止并发冲突）
2. 扫描矩阵已有 ID，计算下一序号
3. 校验生成的 ID 格式有效性
4. 追加新行到 traceability-matrix.md

### 4.4 skill-runtime（Skill 分发）

**职责**：解析 Skill 命令，组装 Prompt，执行 Hard Gate 校验。

**关键流程** (`src/core/skill-runtime/dispatcher.ts:258` — dispatchCommand 入口 — [显式])：

1. 解析命令格式（`namespace:skillName`）
2. 执行三层路由（Semantic Map → Runtime Route → Skill File）
3. 加载 Skill 文件，解析 frontmatter
4. 组装 Prompt（注入上下文）
5. 执行 Hard Gate 校验
6. 返回组装后的 Prompt

### 4.5 ai-orchestrator（AI 编排）

**职责**：管理 AI 会话上下文，支持 catchup（上下文恢复）和 auto-loop（自动循环）。

**关键能力**：
- **Context Pack**：压缩上下文包，减少 token 消耗
- **Catchup**：从断点恢复执行状态
- **Watchdog**：监控 AI 执行状态，防止死循环

### 4.6 change-mgr（变更管理）

**职责**：管理 RFC（变更请求）和 Defect（缺陷）的状态机。

**RFC 状态机**：
```
draft → proposed → approved → implemented → verified → closed
                 ↘ rejected
```

**Defect 状态机**：
```
open → in_progress → fixed → verified → closed
                     ↘ wont_fix
```

### 4.7 template（模板渲染）

**职责**：使用 Handlebars 渲染模板，生成产物文件。

**关键函数** (`src/core/template/renderer.ts` — 模板渲染器 — [显式])：

```typescript
async function renderTemplate(templateName: string, context: object): Promise<string>
```

---

## 5. 关键设计决策

### 5.1 单向状态机 [设计决策]

**决策**：阶段转换采用单向不可逆设计（除取消）。

**理由**：
- 防止随意回退导致的状态混乱
- 强制在每个阶段完成必要工作
- 简化状态管理复杂度

**例外**：`09_cancelled` 状态允许从任意阶段进入。

### 5.2 三层 Skill 路由 [设计决策]

**决策**：Skill 分发采用三层路由机制。

**理由**：
- Layer 1（Semantic Map）：支持自然语言别名，提升用户体验
- Layer 2（Runtime Route）：直接分发 CLI 命令，避免不必要的 Skill 加载
- Layer 3（Skill File）：支持 Skill 文件的热更新和扩展

### 5.3 文件锁保护 ID 生成 [设计决策]

**决策**：ID 生成时获取文件锁，防止并发冲突。

**理由**：
- 多个 AI Agent 可能同时请求生成 ID
- 序号递增需要原子性保证
- 文件锁比数据库更轻量，适合 CLI 工具场景

### 5.4 Gate 降级策略 [推断]

**决策**：当 `pilot_mode=true` 且 Gate 不可用时，允许降级放行。

**理由**：
- 支持快速原型开发场景
- 避免因工具问题阻塞开发进度
- 降级记录审计日志，便于后续分析

### 5.5 Exception 豁免机制 [推断]

**决策**：Gate 条件失败时，可通过有效的 Exception 获得豁免。

**理由**：
- 某些场景下严格的 Gate 条件不适用
- Exception 需关联有效的 RFC，确保可追溯
- 豁免状态标记为 `PASS_WITH_WAIVER`，区别于正常通过

---

## 6. 模块间协作关系

### 6.1 关键集成点

(`critical-flows.json:integration_points` — 模块间集成点 — [显式])

```
┌───────────────────────────────────────────────────────────────┐
│                      advance() 流程                           │
│                                                               │
│  process-engine/advance.ts                                    │
│         │                                                     │
│         ├──── checkDependencies() ◄─── process-engine         │
│         │                                                     │
│         └──── evaluateGate() ◄──────── gate-engine            │
│                    │                                          │
│                    ├── parseMatrix() ◄── trace-engine         │
│                    │                                          │
│                    └── getCoverage() ◄─── trace-engine        │
└───────────────────────────────────────────────────────────────┘
```

### 6.2 Gate → Trace 依赖

**场景**：Gate 评估需要读取追踪矩阵并计算覆盖率。

**调用链** (`src/core/gate-engine/gate-evaluator.ts:14-27` — Gate 依赖 Trace — [显式])：

```
evaluateGate()
  → parseMatrix()      // 解析 traceability-matrix.md
  → loadRfcStatuses()  // 加载 RFC 状态
  → getCoverage()      // 计算 C3/C4/C6/C8/C9
  → validateExceptions() // 校验 Exception 有效性
```

### 6.3 Skill → Runtime 依赖

**场景**：Skill 加载需要读取运行时配置和上下文。

**调用链** (`src/core/skill-runtime/dispatcher.ts:348` — Skill 加载流程 — [显式])：

```
loadSkill()
  → loadConfig()           // 加载 .spec-first/config.yaml
  → resolveSkillContext()  // 解析当前 Feature 上下文
  → parseFrontmatter()     // 解析 Skill frontmatter
  → evaluateSkillHardGate() // 执行 Skill 级 Hard Gate
```

---

## 7. 扩展性设计

### 7.1 Skill 扩展

新增 Skill 只需：
1. 在 `skills/spec-first/` 下创建新目录
2. 编写 `SKILL.md` 文件（含 frontmatter）
3. 如需新命令，在 `src/cli/commands/` 添加处理器

### 7.2 Gate 条件扩展

新增 Gate 条件：
1. 在 `src/core/gate-engine/condition-registry.ts` 注册条件
2. 定义条件评估函数
3. 指定 blocking/warning 级别

### 7.3 模板扩展

新增模板：
1. 在 `templates/` 对应目录添加 `.hbs` 文件
2. 在代码中调用 `renderTemplate()` 渲染

---

## 8. 技术选型

### 8.1 核心依赖

(`package.json:1-102` — 项目元数据与依赖 — [显式])

| 依赖 | 版本 | 用途 |
|------|------|------|
| handlebars | ^4.7.8 | 模板渲染引擎 |
| js-yaml | ^4.1.0 | YAML 配置解析 |
| semver | ^7.7.4 | 语义版本控制 |
| update-notifier | ^7.0.0 | CLI 更新通知 |

### 8.2 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| tsup | ^8.5.1 | TypeScript 打包工具 |
| vitest | ^1.6.1 | 测试框架 |
| typescript | ^5.4.0 | TypeScript 编译器 |
| typescript-eslint | ^8.56.1 | ESLint TypeScript 支持 |

### 8.3 构建配置

- **打包工具**：tsup（ESM 格式）
- **TypeScript 目标**：ES2022
- **模块系统**：ESM only（`type: "module"`）
- **严格模式**：启用
