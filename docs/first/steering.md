# Spec-First 技术指南

> 版本 1.1.4 | 生成日期 2026-03-20

## 技术约束

### Runtime 约束

| 约束项 | 要求 | 证据来源 |
|--------|------|---------|
| Node.js 版本 | >= 20.0.0 | package.json:32 |
| Module 类型 | ESM | tsconfig.json:9, package.json:6 |
| Strict Mode | 启用 | tsconfig.json:9 |
| verbatimModuleSyntax | 启用 | tsconfig.json:18 |

### Language 约束

| 约束项 | 要求 | 证据来源 |
|--------|------|---------|
| TypeScript 版本 | >= 5.4 | tsconfig.json:5-6 |
| Target | ES2022 | tsconfig.json:5-6 |
| Module Resolution | bundler | tsconfig.json:5-6 |

### Export 规则

- **规则**：Named exports only（禁止 default export）
- **适用范围**：core 模块
- **证据来源**：CLAUDE.md:139

### 命名约定

| 类别 | 约定 | 证据来源 |
|------|------|---------|
| 文件 | kebab-case | CLAUDE.md:140 |
| 未使用变量 | `_` 前缀 | CLAUDE.md:141-142 |

## 推荐工作流

### 功能开发完整流程（4 步）

| 步骤 | 操作 | 命令 |
|------|------|------|
| 1. 计划 | 获得 featureId，写任务清单 | `spec-first feature current` + 编辑 `specs/{featureId}/task_plan.md` |
| 2. 确认 | 实现前与用户确认 | — |
| 3. 执行 | 逐项实现 | 使用 `/spec-first:code` |
| 4. 自检 | 执行 typecheck + test + CHANGELOG 更新 | `npm run typecheck && npm test` |

**证据来源**：CLAUDE.md:77-86

### Bug 修复流程

| 步骤 | 操作 |
|------|------|
| 1 | 优先追溯到已有的 Defect ID（`spec-first defect create/update`） |
| 2 | 直接修复 → 自检（`typecheck + test`） |
| 3 | 若 Bug 暴露需求遗漏，走 RFC 变更流程 |

**证据来源**：CLAUDE.md:65,75

### Plan 模式触发条件

满足以下任一条件必须进入 Plan 模式：

- 修改 3+ 个文件
- 新增或删除公开导出（public exports）
- 涉及 `src/core/` 核心逻辑且变更函数签名/导出接口/状态机逻辑
- 变更 Stage 枚举、ID 体系、Gate 条件

**证据来源**：CLAUDE.md:92-98

### Subagent 使用策略

| 场景 | 策略 |
|------|------|
| 调研/探索/分析 | 用 subagent 隔离上下文 |
| 多个相互独立任务 | 并行 subagent |
| 通用原则 | 每个 subagent 只做一件事，保持聚焦 |

**证据来源**：CLAUDE.md:103-106

## 严格规则

### 禁止操作（只能通过 CLI 操作）

| 文件 | 操作命令 | 风险等级 |
|------|---------|---------|
| `stage-state.json` | `spec-first stage advance` | 高（状态机不可逆） |
| `traceability-matrix.md` | `spec-first matrix sync` | 中（覆盖率会失准） |
| `specs/` 下状态与报告文件 | 对应 CLI 子命令 | 中 |

**违规后果**：手动修改状态文件会导致 Gate 校验失准、覆盖率数据污染、审计日志断裂

**证据来源**：CLAUDE.md:9-27

### 代码变动铁律

每次 `src/` 下 `.ts` 文件变更后必须执行：

```
□ 1. npm run typecheck — 已通过
□ 2. npm test — 已通过 / 受影响范围已通过
□ 3. CHANGELOG.md — 已更新 / 豁免
□ 4. 变更范围 — 已确认仅限必要文件，无误改/遗漏
```

**CHANGELOG 豁免条件**（必须全部满足）：

1. 仅修改 `.md`/`.yaml` 文件
2. 不涉及 `package.json`、`src/shared/types.ts`、`src/core/rules/truth-source.ts`
3. 不删除测试用例
4. 不修改覆盖率阈值配置

**证据来源**：CLAUDE.md:40-53

### 规则冲突仲裁优先级

当规则冲突时，按以下优先级执行：

1. **Spec-First 核心原则**（规范追溯）
2. **工作流程规则**
3. **本章节细则**
4. **Claude 默认行为**

**核心原则**：

- **KISS + 最小影响** — 变更只触及必要范围，找根因，不打临时补丁
- **规范驱动** — 任何实现必须能追溯到对应规范定义（FR/DS/TASK）

**证据来源**：CLAUDE.md:32-39

### 自主修 Bug

- 收到 bug 报告后直接修复，不反问用户怎么做
- CI 测试失败时主动修复，无需指导

**证据来源**：CLAUDE.md:111-113

### 不得"带假设开工"

所有疑点在前期调研中厘清

**证据来源**：CLAUDE.md:86

## 平台特定指导

### macOS (darwin)

- Shell: zsh
- 确保 Node.js >= 20.0.0
- pnpm 为推荐包管理器

### CLI 命令参考

#### 构建与类型检查

```bash
npm run build              # tsup 打包
npm run typecheck          # tsc --noEmit 类型检查
```

#### 测试

```bash
npm test                   # vitest run（全量）
npm run test:watch         # vitest watch 模式
npx vitest run tests/unit/<file>.test.ts   # 单文件
npx vitest run -t "pattern"               # 按名称匹配
```

#### 代码质量

```bash
npm run lint               # eslint src
npm run lint:fix
npm run format             # prettier 格式化
```

#### Spec-First CLI

**Feature 管理**：

```bash
spec-first feature current                          # 查看当前 featureId
spec-first feature switch <featureId>               # 切换 Feature
```

**Gate 操作**：

```bash
spec-first gate check --feature <featureId>         # 执行 Gate 校验
spec-first gate check --feature <featureId> --stage 03_plan  # 指定阶段
```

**追溯管理**：

```bash
spec-first matrix sync --feature <featureId>        # 同步追踪矩阵
spec-first id search <ID>                           # 追溯某 ID 的上下游
spec-first id generate FR --feature <featureId>     # 生成新 FR ID
```

**变更管理**：

```bash
spec-first defect create --feature <featureId>      # 创建缺陷记录
spec-first rfc create --feature <featureId>         # 创建变更请求
```

**阶段管理**：

```bash
spec-first stage advance --feature <featureId>      # 推进阶段（须先通过 Gate）
```

**指标查看**：

```bash
spec-first metrics --feature <featureId>            # 查看 C3/C4/C6/C8/C9
```

**证据来源**：CLAUDE.md:145-158

## 架构指导

### 目录结构

| 目录 | 职责 |
|------|------|
| `src/cli` | CLI 命令注册与路由（28 个命令） |
| `src/core` | 核心引擎（14 个模块） |
| `src/shared` | 共享类型（types.ts）、工具函数 |
| `specs` | Feature 产物目录（状态文件由 spec-first CLI 管理） |
| `skills` | Skill 定义（.md 文件，20 个） |
| `templates` | Handlebars 模板 |
| `.spec-first` | 项目级配置与运行时状态 |

**证据来源**：CLAUDE.md:164-172

### Skill 三层路由

```
用户输入 → Semantic Map（复合命令映射）
         → Runtime Route（RUNTIME_COMMANDS 集合）
         → Skill File（resolveSkillPath() 搜索 skills/spec-first/NN-name/SKILL.md）
```

**调用格式**：`/spec-first:<skill-name>`

**示例**：`/spec-first:code`、`/spec-first:gate`、`/spec-first:catchup`

**证据来源**：CLAUDE.md:184-189

### 核心概念

#### Stage 枚举

```
00_init → 01_specify → 02_design → 03_plan → 04_implement
→ 05_verify → 06_wrap_up → 07_release → 08_done / 09_cancelled
```

特性：单向不可逆

#### 追溯 ID（14 类）

- **业务链路**：FR DS TASK TC RFC
- **V-Model**：REQ SYS ARCH MOD / ATP STP ITP UTP
- **顶层**：Feature

#### 覆盖率指标

| 指标 | 含义 |
|------|------|
| C3 | TASK 覆 FR（传递链） |
| C4 | TC 直接覆 FR（不支持传递） |
| C6 | TASK 已实现 |
| C8 | TASK 有上游 |
| C9 | TC 有上游 FR |

**证据来源**：CLAUDE.md:175-182

## 最佳实践

### 1. 始终使用 CLI 操作状态文件

不要手动编辑 `stage-state.json`、`traceability-matrix.md` 等状态文件，使用对应的 CLI 命令。

### 2. 遵循代码变动铁律

每次 TypeScript 文件变更后，必须执行 typecheck + test + CHANGELOG 更新。

### 3. 进入 Plan 模式时机

当修改涉及 3+ 文件、公开导出变更、核心逻辑变更时，必须进入 Plan 模式。

### 4. Bug 修复优先追溯

Bug 修复优先追溯到已有的 Defect ID，而非创建新 FR。

### 5. 使用 Subagent 隔离上下文

调研/探索/分析任务使用 subagent，保持主窗口干净。

## 待确认事项

无

---

> 证据来源：`CLAUDE.md`、`package.json`、`tsconfig.json`、`src/shared/types.ts`、`src/cli/index.ts`
