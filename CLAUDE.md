# Spec-First 开发规范

> **v5.0.0 | 2026-03-14** | 优先级：Spec-First 核心原则 > 本文档规则 > Claude 默认行为

Spec-First 全链路研发闭环引擎——阶段状态机驱动 Feature 从需求到上线，规范可被自动化校验，每个实现可追溯对应规范定义。

---

## 🚫 禁止操作（即使用户要求也不得违反）

以下文件/目录**只能通过 CLI 操作**，禁止手动编辑：

| 禁止手动编辑的文件 | 正确操作 | 风险等级 |
|-------------------|---------|---------|
| `stage-state.json` | `spec-first stage advance` | 🔴 高（状态机不可逆） |
| `traceability-matrix.md` | `spec-first matrix sync` | 🟠 中（覆盖率会失准） |
| `specs/` 下状态与报告文件（`todo-state.json`、`reports/`） | 对应 CLI 子命令 | 🟠 中 |

> **可以编辑**：`specs/{featureId}/` 下的规范产物（`spec.md`、`design.md`、`task_plan.md`、`prd.md` 等文档）。
>
> **CLI 不可用时的降级**（按风险分层）：
> - `stage advance`：**永不降级**，直接告知用户 CLI 不可用，等待人工操作
> - `matrix sync`：可临时跳过，记录原因，任务完成后提醒用户手动补同步
> - 其他状态文件：仅读取不写入，告知用户需补 CLI 命令

**违规后果**：手动修改状态文件会导致 Gate 校验失准、覆盖率数据污染、审计日志断裂。如用户坚持要求手动编辑，Claude 应明确说明风险并拒绝执行，建议改为使用对应 CLI 命令。

---

## 🔒 强制规则

**规则冲突仲裁**：当本文档不同章节的规则在同一场景下产生矛盾时，按以下优先级执行：
`Spec-First 核心原则（规范追溯）> 工作流程规则 > 本章节细则 > Claude 默认行为`

**两条原则**：

1. **KISS + 最小影响** — 变更只触及必要范围，找根因，不打临时补丁
2. **规范驱动** — 任何实现必须能追溯到对应规范定义（FR/DS/TASK）

**代码变动铁律**（每次 `src/` 下 `.ts` 文件变更后必须执行，并在回复中输出以下自检清单）：

```
✅ 自检清单（回复中必须逐项输出）
□ 1. npm run typecheck — 已通过 / 已确认无需（原因：____）
□ 2. npm test — 已通过 / 受影响范围已通过
□ 3. CHANGELOG.md — 已更新 / 豁免（原因：____）
□ 4. 变更范围 — 已确认仅限必要文件，无误改/遗漏
```

- **CHANGELOG.md 主动更新**：版本号从 `package.json` 读取，Claude 主动追加，无需用户提醒
  - 格式：`- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要`，用户可见变更末尾加 `(user-visible)`
  - **豁免条件**（必须全部满足）：① 仅修改 `.md`/`.yaml` 文件，② 不涉及 `package.json`、`src/shared/types.ts`、`src/core/rules/truth-source.ts`，③ 不删除测试用例，④ 不修改覆盖率阈值配置
- **CLAUDE.md 同步提交**：每次 commit 将 CLAUDE.md 纳入提交范围

---

## 📋 工作流程

收到任务时先判断场景：

| 场景 | 路径 | 对应 Skill |
|------|------|-----------|
| 功能开发 / 重构（新增功能或较大改动） | 走完整 4 步 ↓ | `/spec-first:code` 或 `/spec-first:task` |
| Bug 修复 / CI 失败 | 直接修复 → 自检（typecheck + test） | `/spec-first:review` |
| 性能优化 / 依赖升级 | 先分析影响范围 → 如改 3+ 文件进 Plan 模式 | `/spec-first:analyze` |
| 测试补全 / 覆盖率提升 | 直接实现 → 自检 | — |
| 代码评审反馈 | 直接修复对应问题 → 自检 | `/spec-first:review` |
| 文档 / 配置 / 小改动（单文件、无 API 变更） | 直接执行 → 确认结果 | — |
| 纯分析 / 调研（不改代码） | 用 Subagent 隔离上下文 | `/spec-first:research` |
| **其他 / 不确定** | 默认走功能开发流程（完整 4 步） | — |

> ⚠️ **小改动排除**：以下文件变更即使看似"小改动"也**不得**走简化路径，必须走完整流程：
> `src/shared/types.ts`（Stage/ID 体系）、`src/core/rules/truth-source.ts`（Gate 真理源）、任何 `index.ts` 重导出变更（影响公开 API）

**Bug 修复的规范追溯**：Bug 修复优先追溯到已有的 Defect ID（`spec-first defect create/update`），而非创建新 FR。若 Bug 暴露了需求遗漏，则走 RFC 变更流程。

**功能开发完整流程**：

1. **计划** — `featureId` 从 `.spec-first/current` 读取，或执行 `spec-first feature current` 获得；
   在 `specs/{featureId}/task_plan.md` 写可勾选任务清单
   格式：`- [ ] TASK-{FEAT}-{NNN} [P{优先级}] 任务标题`
2. **确认** — 实现前与用户确认
3. **执行** — 逐项实现，完成时标记，每步给出高层摘要；执行 Skill 时使用 `/spec-first:code`
4. **自检** — 执行并输出强制自检清单（见上方铁律）

不得"带假设开工"，所有疑点在前期调研中厘清。

---

## ⚙️ Claude 工作模式

**Plan 模式**（满足以下任一条件必须进入）：
- 修改 3+ 个文件
- 新增或删除公开导出（public exports）
- 涉及 `src/core/` 核心逻辑**且**变更函数签名 / 导出接口 / 状态机逻辑
- 变更 Stage 枚举、ID 体系、Gate 条件
- 遇到偏差立即停下重新规划，不要硬推

> Plan 模式与路由表的关系：路由表确定**是否需要计划与确认**，Plan 模式确定**是否使用 Claude 内置的 EnterPlanMode 工具**。功能开发场景中若触发上述任一 Plan 模式条件，则两者都需要。

**Subagent 策略**：
- 调研 / 探索 / 分析 → 用 subagent 隔离上下文，保持主窗口干净
- 多个**相互独立**的任务 → 并行 subagent
- 每个 subagent 只做一件事，保持聚焦

**完成前验证**：
- 跑测试、查日志、展示正确性
- 自问："一个 Staff Engineer 会批准这个吗？"

**自主修 Bug**：
- 收到 bug 报告后直接修复，不反问用户怎么做
- CI 测试失败时主动修复，无需指导

**主动挑战**：
- 结论与数据矛盾、计划过于乐观、技术路线伤害业务价值时，直接指出并提供依据
- 不做顺从性的"好的没问题"式回应

---

## 🛠️ 技术栈与常用命令

**技术栈**

- **Runtime**: Node.js ≥20, ESM (`"type": "module"`)
- **Language**: TypeScript ≥5.4, strict mode, `verbatimModuleSyntax`
- **Bundler**: tsup
- **Test**: Vitest (globals enabled, v8 coverage, 75% threshold)
- **Lint**: eslint + typescript-eslint, Prettier
- **Templates**: Handlebars | **Config**: js-yaml

**常用命令**

```bash
# 构建与类型检查
npm run build              # tsup 打包
npm run typecheck          # tsc --noEmit 类型检查

# 测试
npm test                   # vitest run（全量）
npm run test:watch         # vitest watch 模式
npx vitest run tests/unit/<file>.test.ts   # 单文件
npx vitest run -t "pattern"               # 按名称匹配

# 代码质量
npm run lint               # eslint src
npm run lint:fix
npm run format             # prettier 格式化

# Spec-First CLI（常用，含参数示例）
spec-first feature current                          # 查看当前 featureId
spec-first feature switch FSREQ-20260313-UIOPT-001  # 切换 Feature
spec-first gate check --feature <featureId>         # 执行 Gate 校验
spec-first gate check --feature <featureId> --stage 03_plan  # 指定阶段
spec-first matrix sync --feature <featureId>        # 同步追踪矩阵
spec-first stage advance --feature <featureId>      # 推进阶段（须先通过 Gate）
spec-first metrics --feature <featureId>            # 查看 C3/C4/C6/C8/C9
spec-first id search FR-UIOPT-001                   # 追溯某 ID 的上下游
spec-first id generate FR --feature <featureId>     # 生成新 FR ID
spec-first defect create --feature <featureId>      # 创建缺陷记录
spec-first rfc create --feature <featureId>         # 创建变更请求
```

---

## 🏗️ 架构速查

### 目录结构

```
src/
  cli/        # CLI 命令注册与路由（27 个命令）
  core/       # 核心引擎（见下表，14 个模块）
  shared/     # 共享类型（types.ts）、工具函数
specs/        # Feature 产物目录（状态文件由 spec-first CLI 管理）
skills/       # Skill 定义（.md 文件，20 个）
templates/    # Handlebars 模板
.spec-first/  # 项目级配置与运行时状态
```

### 核心领域概念

- **Stage 枚举**（单向不可逆）：`00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done / 09_cancelled`
- **追溯 ID（14 类）**：业务链路 `FR DS TASK TC RFC` | V-Model `REQ SYS ARCH MOD / ATP STP ITP UTP` | 顶层 `Feature`
- **覆盖率（5 项）**：`C3`（TASK覆FR，传递链）`C4`（TC**直接**覆FR，不支持传递）`C6`（TASK已实现）`C8`（TASK有上游）`C9`（TC有上游FR）

### 核心模块 (`src/core/`，共 14 个)

| 模块 | 职责 |
|------|------|
| `process-engine/` | 阶段状态机（8 active + 2 terminal），驱动 Feature 生命周期、ID 生成、目录初始化 |
| `skill-runtime/` | Skill 分发、prompt 组装、hard-gate 校验（三层路由：Semantic Map → Runtime Route → Skill File） |
| `ai-orchestrator/` | Auto-loop、catchup 上下文恢复、context-pack，含 P1-P10 已修复的健壮性保障 |
| `gate-engine/` | 阶段质量门禁评估（19条：16 blocking + 3 warning）、豁免管理、PRD 评分 |
| `trace-engine/` | 追溯 ID 生成/校验/搜索、覆盖率矩阵（C3/C4/C6/C8/C9）、Exception 机制 |
| `change-mgr/` | RFC + Defect 状态机、影响分析 |
| `template/` | Handlebars 模板渲染、产物生成 |
| `tool-integration/` | AI runtime hooks、context 同步 |
| `metrics-engine/` | 健康度评分（H1）、瓶颈检测（R1-R5） |
| `validators/` | 产物格式校验（ID 格式、必需章节、追踪矩阵一致性） |
| `task-plan/` | task_plan.md 解析、Todo 状态管理 |
| `rules/` | 真理源（RELEASE_REQUIRED_ARTIFACTS 等）、静态规则定义 |
| `batch-executor/` | 批量任务执行、并行编排支持 |
| `migrations/` | 状态文件版本迁移、升级兼容处理 |

### Skill 三层路由

```
用户输入 → Semantic Map（复合命令映射，如 "rfc approve" → CLI+参数）
         → Runtime Route（RUNTIME_COMMANDS 集合，直接分发 CLI）
         → Skill File（resolveSkillPath() 搜索 skills/spec-first/NN-name/SKILL.md）
```

Skill 调用格式：`/spec-first:<skill-name>`，例如 `/spec-first:code`、`/spec-first:gate`、`/spec-first:catchup`

### 关键约定

- **ESM only** — 全项目 `"type": "module"`，使用 `import/export`
- **Named exports only** — core 模块禁止使用 default export
- **文件命名**: `kebab-case.ts`
- **类型集中**: `src/shared/types.ts`（Stage enum、ExitCode、ID types）
- **未使用变量**: `_` 前缀（eslint 规则 `^_`）

### 测试结构

```
tests/unit/        # 单元测试（每模块一文件）
tests/integration/ # 集成测试
tests/e2e/         # 端到端测试
tests/benchmark/   # 性能基准测试
tests/fixtures/    # 测试固件数据
```

覆盖率阈值: lines/functions/statements 75%, branches 65%

---

## 🎯 输出规范

默认中文回复；技术术语和代码标识符保持英文原文。

---

<!-- SPEC-FIRST:BEGIN MANUAL -->
<!-- 手动补充上下文，请保留此块 -->
<!-- SPEC-FIRST:END MANUAL -->

<!-- SPEC-FIRST:BEGIN AUTO-CONTEXT -->
<!-- 此块由 spec-first context sync 自动更新，请勿手动编辑 -->
<!-- SPEC-FIRST:END AUTO-CONTEXT -->
