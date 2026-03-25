# Spec-First 项目认知总览

> 面向新成员的 Onboarding 指南 | 基于 `.spec-first/runtime/first/` 生成

---

## 项目是什么

**spec-first** 是一个 AI-workflow CLI 工具，为 AI 时代的研发团队提供规范驱动开发（Spec-Driven Development）的完整解决方案。

**核心价值**：
- **阶段状态机** — 驱动 Feature 从需求到上线的完整生命周期
- **质量门禁** — 自动化校验规范合规性，防止不合格产物流转
- **全链路追溯** — 任何实现可追溯到对应规范定义（FR/DS/TASK/TC）

| 属性 | 值 |
|------|-----|
| 版本 | 1.2.3 |
| 平台类型 | CLI Tool |
| 运行时 | Node.js >= 20.0.0 |
| 模块系统 | ESM (`"type": "module"`) |
| 构建工具 | tsup 8.5+ |
| 测试框架 | Vitest 1.6+ |

**证据**: `package.json:1-102`, `tsconfig.json:1-22`

---

## 架构总览

```
+---------------------------------------------------------------+
|                         CLI Layer                              |
|  src/cli/index.ts --> src/cli/router.ts --> src/cli/commands/* |
|  (入口注册)            (命令路由)             (27 个命令处理器)    |
+-------------------------------+-------------------------------+
                                | calls
+-------------------------------v-------------------------------+
|                         Core Layer                            |
|                                                               |
|  +-------------+     +---------------+     +---------------+  |
|  |process-engine|--->|  gate-engine  |--->| trace-engine  |  |
|  | 阶段状态机   |     | 质量门禁      |     | 追溯 ID 管理  |  |
|  +-------------+     +---------------+     +---------------+  |
|        |                    |                     |           |
|        v                    v                     v           |
|  +-------------+     +---------------+     +---------------+  |
|  |skill-runtime|     |ai-orchestrator|     |  change-mgr   |  |
|  | Skill 分发  |     | AI 调度       |     | RFC/Defect    |  |
|  +-------------+     +---------------+     +---------------+  |
|                                                               |
|  +-------------+  +-------------+  +-------------+            |
|  |  template   |  |  validators |  |  task-plan  |            |
|  +-------------+  +-------------+  +-------------+            |
|                                                               |
|  +-------------+  +-------------+  +-------------+            |
|  | metrics-eng |  | tool-integ  |  |   rules     |            |
|  +-------------+  +-------------+  +-------------+            |
+-------------------------------+-------------------------------+
                                | depends on
+-------------------------------v-------------------------------+
|                        Shared Layer                           |
|  src/shared/types.ts (Stage, ExitCode, FeatureState, etc.)    |
|  src/shared/host-paths.ts, src/shared/fs-utils.ts, etc.       |
+---------------------------------------------------------------+
```

**证据**: `src/cli/index.ts:1-97`, `src/core/*/`, `src/shared/types.ts:1-275`

---

## 14 个核心模块

| 模块 | 职责 | 关键符号 |
|------|------|---------|
| `process-engine` | 阶段状态机（8 active + 2 terminal），驱动 Feature 生命周期 | `Stage`, `TRANSITIONS`, `getNextStages` |
| `skill-runtime` | Skill 分发、prompt 组装、hard-gate 校验 | `dispatchCommand`, `SEMANTIC_MAP`, `resolveSkillPath` |
| `gate-engine` | Gate 条件评估（19 条规则）、SCA 校验 | `evaluateGate`, `GateResult`, `getConditions` |
| `trace-engine` | ID 注册/校验/搜索、覆盖率矩阵（C3/C4/C6/C8/C9） | `nextId`, `assembleId`, `collectKnownIds` |
| `ai-orchestrator` | Context Pack 生成、Catchup、AI 统计 | `buildContextPack`, `catchup`, `runAutoLoop` |
| `change-mgr` | RFC + Defect 状态机、影响分析 | `RFC_TRANSITIONS`, `createRfc`, `transitionDefect` |
| `template` | Handlebars 模板渲染、产物生成 | `renderTemplate`, `findTemplatePath` |
| `validators` | 产物格式校验（ID 格式、必需章节） | `validateFormat`, `validateRequiredFields` |
| `task-plan` | task_plan.md 解析、Todo 状态管理 | `parseTaskPlanContent`, `toTaskNodes` |
| `metrics-engine` | 健康度评分（H1）、瓶颈检测（R1-R5） | `calcHealthScore`, `detectBottleneck` |
| `rules` | 真理源定义（RELEASE_REQUIRED_ARTIFACTS 等） | `RELEASE_REQUIRED_ARTIFACTS`, `PRIMARY_STAGE_SKILL` |
| `tool-integration` | Git Hook 安装、CI 模板、环境诊断 | `installHooks`, `syncAgentContextFromDesign` |
| `batch-executor` | 批量任务执行、并行编排支持 | `executeManifest`, `executeStep` |
| `migrations` | 状态文件版本迁移、升级兼容处理 | `executeManifest`, `deepMerge` |

**证据**: `src/core/process-engine/stage-machine.ts:1-100`, `src/core/skill-runtime/dispatcher.ts:1-200`, `src/core/gate-engine/gate-evaluator.ts:1-100`

---

## 核心领域概念

### Stage 状态机

Feature 生命周期分为 **8 个活跃阶段 + 2 个终态**，单向不可逆流转：

```
00_init ──> 01_specify ──> 02_design ──> 03_plan ──> 04_implement
                                                        │
                                                        v
08_done <── 07_release <── 06_wrap_up <── 05_verify <───+
    │
    +──────────────────────────────────────────────────> 09_cancelled
                                                   (任意阶段可取消)
```

| 阶段 | 产物 | 说明 |
|------|------|------|
| `00_init` | 目录结构 | 初始化 Feature 工作区 |
| `01_specify` | spec.md, prd.md | 需求规格与 PRD |
| `02_design` | design.md | 技术设计文档 |
| `03_plan` | task_plan.md | 任务拆解清单 |
| `04_implement` | code, tests | 代码实现与单元测试 |
| `05_verify` | test reports | 验收测试与安全扫描 |
| `06_wrap_up` | retro.md | 归档与复盘 |
| `07_release` | release-note.md | 发布准备 |
| `08_done` | — | 终态：完成 |
| `09_cancelled` | — | 终态：取消 |

**证据**: `src/shared/types.ts:9-20`, `src/core/process-engine/stage-machine.ts:8-17`

### 追溯 ID 体系（14 类）

```
业务链路追溯:
  FR (功能需求) ──> DS (设计规格) ──> TASK (任务) ──> TC (测试用例)
       │                                              ↑
       +──────────────────────────────────────────────┘
                          (TC 直接覆盖 FR，不支持传递)

V-Model 追溯:
  REQ ──> SYS ──> ARCH ──> MOD
   │       │       │       │
   v       v       v       v
  ATP     STP     ITP     UTP

变更管理:
  RFC (变更请求) ──> 豁免 FR 的 Gate 条件
  Defect (缺陷) ──> 关联到 FR 或 TC

顶层:
  Feature (全局唯一标识: FSREQ-YYYYMMDD-XXXX-NNN)
```

**证据**: `src/core/trace-engine/id-taxonomy.ts:6-52`

### 覆盖率指标（5 项）

| 指标 | 名称 | 说明 |
|------|------|------|
| C3 | TASK 覆 FR | 传递链覆盖：TASK → DS → FR |
| C4 | TC 覆 FR | 直接覆盖（不支持传递） |
| C6 | TASK 已实现 | 任务完成率 |
| C8 | TASK 有上游 | 任务有 FR/DS 关联 |
| C9 | TC 有上游 FR | 测试用例有需求关联 |

**证据**: `src/core/trace-engine/upstream-lineage.ts:16-73`

---

## 27 个 CLI 命令

| 类别 | 命令 | 说明 |
|------|------|------|
| **核心流程** | `init` | 初始化 Feature 或项目 |
| | `stage` | 阶段查看与推进建议 |
| | `gate` | Gate 校验与 GoLive |
| | `feature` | Feature 管理（list/switch/current） |
| | `done` | 完成 Feature |
| **追溯管理** | `trace` | 追溯矩阵查看 |
| | `id` | ID 生成/搜索/校验 |
| | `defect` | 缺陷跟踪 |
| | `rfc` | RFC 变更请求管理 |
| **AI 调度** | `skill` | Skill 调用 |
| | `ai` | AI 会话恢复与 catchup |
| | `orchestrate` | 受控编排 |
| | `first` | 项目首轮认知校验 |
| **文档管理** | `docs-links` | 文档关联校验 |
| | `viewer` | 文档查看器 |
| **指标分析** | `metrics` | 覆盖率度量 |
| | `analyze` | 跨产物一致性分析 |
| | `status` | 状态概览 |
| | `doctor` | 环境诊断 |
| **工具集成** | `hooks` | Git Hooks 管理 |
| | `commit` | 规范化提交 |
| | `update` | 版本更新 |
| | `setup` | 项目设置 |
| | `uninstall` | 卸载 |
| | `validate` | 校验命令 |
| | `onboarding` | Onboarding 引导 |
| | `batch-test` | 批量测试 |

**证据**: `src/cli/index.ts:1-97`, `src/cli/router.ts:1-157`

---

## 20 个 Skill 定义

Skill 是 AI 代理执行单元，每个 Skill 对应一个 `.md` 文件，定义 prompt 模板和执行上下文。

| Skill | 阶段 | 说明 |
|-------|------|------|
| `00-first` | any | 项目快速认知 |
| `01-init` | 00_init | 初始化 Feature 工作区 |
| `02-catchup` | any | 会话恢复与上下文摘要 |
| `03-spec` | 01_specify | 定义需求规格 |
| `04-design` | 02_design | 技术设计 |
| `05-research` | 02_design | 技术调研 |
| `06-task` | 03_plan | 任务拆解 |
| `07-code` | 04_implement | 代码实现 |
| `08-review` | 04_implement | 代码审查 |
| `10-archive` | 06_wrap_up | 归档复盘 |
| `11-plan` | any | 生成阶段执行计划 |
| `12-verify` | 05_verify | 阶段验收校验 |
| `13-orchestrate` | any | 编排调度器 |
| `14-status` | any | 状态概览 |
| `15-doctor` | any | 环境诊断 |
| `16-sync` | any | 同步文档关联 |
| `17-feature` | any | Feature 管理 |
| `20-spec-review` | 01_specify | 需求规格审查 |
| `21-analyze` | any | 跨产物一致性分析 |
| `focus-requirements` | any | 需求聚焦 |

**调用格式**: `/spec-first:<skill-name>`（如 `/spec-first:code`）

**证据**: `skills/README.md:1-155`, `src/core/rules/truth-source.ts:13-23`

---

## 快速入口

### 首次阅读顺序

1. **`CLAUDE.md`** — 开发规范与工作流程（必读）
2. **`package.json`** — 依赖与脚本配置
3. **`src/cli/index.ts`** — CLI 入口点
4. **`src/core/process-engine/`** — 核心状态机
5. **`skills/README.md`** — Skill 体系说明

### 常用命令

```bash
# 构建与类型检查
npm run build              # tsup 打包
npm run typecheck          # tsc --noEmit 类型检查

# 测试
npm test                   # vitest run（全量）
npm run test:watch         # vitest watch 模式
npx vitest run tests/unit/<file>.test.ts   # 单文件

# 代码质量
npm run lint               # eslint src
npm run format             # prettier 格式化

# Spec-First CLI
spec-first feature current                    # 查看当前 featureId
spec-first feature switch <featureId>         # 切换 Feature
spec-first gate check --feature <featureId>   # 执行 Gate 校验
spec-first stage advance --feature <featureId> # 推进阶段（须先通过 Gate）
spec-first id search FR-xxx                   # 追溯某 ID 的上下游
```

**证据**: `package.json:9-29`, `CLAUDE.md:115-132`

---

## 项目目录结构

```
src/
  cli/        # CLI 命令注册与路由（27 个命令）
  core/       # 核心引擎（14 个模块）
  shared/     # 共享类型（types.ts）、工具函数
  config/     # 配置引导与 manifest

specs/        # Feature 产物目录（状态文件由 spec-first CLI 管理）
skills/       # Skill 定义（.md 文件，20 个）
templates/    # Handlebars 模板
tests/        # 测试目录
  unit/       # 单元测试
  integration/# 集成测试
  e2e/        # 端到端测试
  benchmark/  # 性能基准测试
  fixtures/   # 测试固件数据

.spec-first/  # 项目级配置与运行时状态
  runtime/    # 运行时缓存（first 认知资产等）
  current     # 当前 Feature 指针
```

**证据**: `src/cli/index.ts:1-97`, `src/core/*/`

---

## 关键约束与风险

### 禁止操作

以下文件/目录**只能通过 CLI 操作**，禁止手动编辑：

| 文件 | 正确操作 | 风险等级 |
|------|---------|---------|
| `stage-state.json` | `spec-first stage advance` | 高（状态机不可逆） |
| `document-links.yaml` | `spec-first docs links validate` | 中（引用会失准） |
| `specs/*/todo-state.json` | 对应 CLI 子命令 | 中 |

**证据**: `CLAUDE.md:10-25`

### 已知风险

| 风险 | 严重性 | 缓解措施 |
|------|--------|---------|
| 状态文件手动编辑 | 高 | 强制使用 CLI 命令，禁止手动编辑 |
| 模块边界模糊 | 中 | 使用 src/shared/types.ts 集中类型定义 |
| 测试覆盖率不足 | 中 | 运行 npm run test:coverage 验证 |

**证据**: `CLAUDE.md:10-25`, `src/shared/types.ts`

---

## 相关文档

- **[summary.md](./summary.md)** — 项目摘要
- **[steering.md](./steering.md)** — 技术方向指引
- **[domain-model.md](./domain-model.md)** — 领域模型详解
- **[critical-flows.md](./critical-flows.md)** — 关键流程
- **[entry-guide.md](./entry-guide.md)** — 入口指南
