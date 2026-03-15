# Get-Shit-Done vs Spec-First 对比分析报告

> **分析日期**: 2026-03-15
> **对比版本**:
> - **Get-Shit-Done**: v1.22.4
> - **Spec-First**: v1.0.4

---

## 一、项目定位对比

### 1.1 核心定位

| 维度 | Get-Shit-Done | Spec-First |
|------|--------------|------------|
| **定位** | Meta-Prompting 框架 | 全链路研发闭环引擎 |
| **本质** | Prompt 注入系统 | CLI + 状态机引擎 |
| **目标用户** | AI 辅助开发者 | 规范驱动团队 |
| **核心理念** | Context Engineering | Spec-Driven Development |
| **代码量** | ~5,400 行 CommonJS | ~28,800 行 TypeScript |
| **命令数** | 32 个 | 26 个 CLI + 21 个 Skill |

### 1.2 一句话总结

```
Get-Shit-Done: 让 AI 更可靠地执行任务 (Prompt 工程)
Spec-First:   让研发可追溯可自动化 (规范引擎)
```

---

## 二、架构对比

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            架构对比                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Get-Shit-Done                          Spec-First                       │
│  ┌─────────────────────┐               ┌─────────────────────┐          │
│  │   npx 安装器         │               │   npm 全局 CLI      │          │
│  └──────────┬──────────┘               └──────────┬──────────┘          │
│             │                                     │                      │
│             ▼                                     ▼                      │
│  ┌─────────────────────┐               ┌─────────────────────┐          │
│  │  ~/.claude/         │               │  src/core/          │          │
│  │  ├── commands/      │               │  ├── process-engine │          │
│  │  │   └── gsd/*.md   │               │  ├── gate-engine    │          │
│  │  └── agents/*.md    │               │  ├── trace-engine   │          │
│  └─────────────────────┘               │  ├── skill-runtime  │          │
│                                        │  └── ai-orchestrator│          │
│                                        └─────────────────────┘          │
│             │                                     │                      │
│             ▼                                     ▼                      │
│  ┌─────────────────────┐               ┌─────────────────────┐          │
│  │  Claude Code 执行   │               │  状态机驱动          │          │
│  │  (宿主控制)         │               │  + Gate 校验         │          │
│  └─────────────────────┘               │  + 追溯引擎          │          │
│                                        └─────────────────────┘          │
│                                                                          │
│  特点: 轻量、依赖宿主                   特点: 完整、独立运行              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构对比

**Get-Shit-Done**:
```
get-shit-done/
├── bin/install.js           # 安装脚本
├── get-shit-done/bin/       # 运行时工具
│   ├── gsd-tools.cjs        # CLI 工具集
│   └── lib/                 # 核心库 (5.4k 行)
│       ├── core.cjs         # 通用工具
│       ├── state.cjs        # 状态管理
│       ├── phase.cjs        # 阶段操作
│       └── ...
├── commands/gsd/*.md        # 32 个命令
├── agents/*.md              # 12 个 Agent
└── hooks/                   # Hook 脚本
```

**Spec-First**:
```
spec-first/
├── src/
│   ├── cli/commands/        # 26 个 CLI 命令
│   └── core/                # 14 个核心模块 (28.8k 行)
│       ├── process-engine/  # 阶段状态机
│       ├── gate-engine/     # 质量门禁
│       ├── trace-engine/    # 追溯引擎
│       ├── skill-runtime/   # Skill 分发
│       ├── ai-orchestrator/ # AI 编排
│       └── ...
├── skills/spec-first/*.md   # 21 个 Skill
├── templates/               # Handlebars 模板
└── specs/                   # Feature 产物目录
```

---

## 三、工作流对比

### 3.1 开发阶段

| 阶段 | Get-Shit-Done | Spec-First |
|------|--------------|------------|
| **初始化** | `/gsd:new-project` | `/spec-first:init` |
| **讨论** | `/gsd:discuss-phase` | 内置于 spec 阶段 |
| **需求** | `/gsd:research-phase` → `plan-phase` | `/spec-first:spec` |
| **设计** | 内置于 plan | `/spec-first:design` |
| **任务** | 自动生成 PLAN.md | `/spec-first:task` |
| **实现** | `/gsd:execute-phase` | `/spec-first:code` |
| **验证** | `/gsd:verify-work` | `/spec-first:verify` |
| **归档** | `/gsd:complete-milestone` | `/spec-first:archive` |

### 3.2 工作流图

**Get-Shit-Done**:
```
new-project → discuss-phase → plan-phase → execute-phase → verify-work
                  ↑               │              │              │
                  └───────────────┴──────────────┴──────────────┘
                              (循环直到 milestone 完成)
```

**Spec-First**:
```
init → spec → design → task → code → verify → archive
  │       │        │       │       │        │        │
  └───────┴────────┴───────┴───────┴────────┴────────┘
                     │
              Gate 校验 (每个阶段)
```

### 3.3 状态管理对比

| 维度 | Get-Shit-Done | Spec-First |
|------|--------------|------------|
| **状态存储** | `.planning/STATE.md` | `stage-state.json` |
| **阶段定义** | 隐式 (Phase 编号) | 显式 (Stage 枚举) |
| **推进方式** | 手动命令 | `stage advance` + Gate |
| **状态机** | 无 | 8 active + 2 terminal |
| **可逆性** | 可任意跳转 | 单向不可逆 |

---

## 四、核心功能对比

### 4.1 功能矩阵

| 功能 | Get-Shit-Done | Spec-First | 说明 |
|------|:------------:|:----------:|------|
| **多运行时支持** | ✅ 4 种 | ❌ 仅 Claude | GSD 支持 Claude/OpenCode/Gemini/Codex |
| **阶段状态机** | ❌ | ✅ | Spec-First 有完整状态机 |
| **Gate 校验** | ❌ | ✅ 19 条 | Spec-First 有硬 Gate + 软 Gate |
| **追溯 ID 体系** | ❌ | ✅ 14 类 | FR/DS/TASK/TC/RFC... |
| **覆盖率矩阵** | ❌ | ✅ 5 项 | C3/C4/C6/C8/C9 |
| **Auto-Loop** | ❌ | ✅ | 自动循环执行 |
| **Crash Recovery** | ❌ | ✅ | 崩溃恢复 + Session Forensics |
| **Wave 执行** | ✅ | ✅ | 都支持并行任务 |
| **上下文隔离** | ✅ Subagent | ✅ Subagent | 都支持 |
| **成本追踪** | ❌ | ❌ | 都不内置 |
| **Stuck 检测** | ❌ | ✅ | Spec-First 有重试控制 |
| **Quick 模式** | ✅ | ❌ | GSD 有快速任务入口 |
| **批量讨论** | ✅ | ❌ | GSD 有 `--batch` |
| **Doctor 诊断** | ✅ | ✅ | 都有诊断修复 |
| **Brownfield 支持** | ✅ map-codebase | ✅ catchup | 都支持 |

### 4.2 Agent 体系对比

**Get-Shit-Done Agents** (12 个):
| Agent | 功能 |
|-------|------|
| `gsd-planner` | 规划任务 |
| `gsd-executor` | 执行任务 |
| `gsd-verifier` | 验证结果 |
| `gsd-debugger` | 调试问题 |
| `gsd-phase-researcher` | 阶段调研 |
| `gsd-project-researcher` | 项目调研 |
| `gsd-research-synthesizer` | 调研综合 |
| `gsd-codebase-mapper` | 代码库映射 |
| `gsd-roadmapper` | 路线图生成 |
| `gsd-plan-checker` | 计划检查 |
| `gsd-integration-checker` | 集成检查 |
| `gsd-nyquist-auditor` | 审计 |

**Spec-First Skills** (21 个):
| Skill | 功能 |
|-------|------|
| `00-first` | 项目快速认知 |
| `00-onboarding` | 新手引导 |
| `01-init` | Feature 初始化 |
| `02-catchup` | 上下文恢复 |
| `03-spec` | 需求规格 |
| `04-design` | 技术设计 |
| `05-research` | 调研分析 |
| `06-task` | 任务拆解 |
| `07-code` | 代码实现 |
| `08-review` | 代码审查 |
| `10-archive` | 归档复盘 |
| `11-plan` | 计划加载 |
| `12-verify` | 阶段验收 |
| `13-orchestrate` | 编排执行 |
| `14-status` | 状态概览 |
| `15-doctor` | 环境诊断 |
| `16-sync` | 矩阵同步 |
| `17-feature` | Feature 管理 |
| `20-spec-review` | 规格审查 |
| `21-analyze` | 一致性分析 |

---

## 五、产物体系对比

### 5.1 文件产物

| 产物类型 | Get-Shit-Done | Spec-First |
|----------|--------------|------------|
| **项目描述** | `PROJECT.md` | `project.md` |
| **需求** | `REQUIREMENTS.md` | `spec.md` (FR) |
| **路线图** | `ROADMAP.md` | `roadmap.md` |
| **设计** | `{N}-RESEARCH.md` | `design.md` (DS) |
| **任务** | `{N}-{M}-PLAN.md` | `task_plan.md` (TASK) |
| **摘要** | `{N}-{M}-SUMMARY.md` | `reports/` |
| **状态** | `STATE.md` | `stage-state.json` |
| **配置** | `config.json` | `feature.yaml` |
| **追溯矩阵** | ❌ | `traceability-matrix.md` |
| **验证** | `{N}-VERIFICATION.md` | Gate 报告 |
| **UAT** | `{N}-UAT.md` | 内置 |

### 5.2 ID 体系对比

**Get-Shit-Done**: 无正式 ID 体系

**Spec-First**: 14 类追溯 ID
```
业务链路: FR (功能需求) → DS (设计规格) → TASK (任务) → TC (测试用例)
变更管理: RFC (变更请求) / Defect (缺陷)
V-Model: REQ/SYS/ARCH/MOD/ATP/STP/ITP/UTP
顶层: Feature
```

---

## 六、关键差异详解

### 6.1 状态机 vs 手动推进

**Get-Shit-Done** (手动):
```bash
/gsd:discuss-phase 1
/gsd:plan-phase 1
/gsd:execute-phase 1
/gsd:verify-work 1
# 用户手动推进每个阶段
```

**Spec-First** (状态机):
```bash
spec-first stage advance --feature FSREQ-001
# 状态机自动检查 Gate → 通过 → 推进
# Gate 不通过 → 拒绝推进 → 输出缺失条件
```

### 6.2 Gate 校验

**Get-Shit-Done**: 无自动校验

**Spec-First**: 19 条 Gate 条件
```
Blocking Gates (16 条):
- G001: spec.md 存在且包含必需章节
- G002: design.md 存在且包含架构决策
- G003: task_plan.md 存在且有未完成任务
- G004: 所有 TASK 有上游 FR
- G005: C3 覆盖率 ≥ 阈值
- ...

Warning Gates (3 条):
- W001: PRD 评分低于阈值
- W002: 存在未解决的 RFC
- W003: 存在未关闭的 Defect
```

### 6.3 追溯能力

**Get-Shit-Done**: 无追溯 ID

```
PLAN.md → SUMMARY.md (隐式关联)
```

**Spec-First**: 完整追溯链

```
FR-UIOPT-001 (功能需求)
    ↓ traced-by
DS-UIOPT-001 (设计规格)
    ↓ decomposed-into
TASK-UIOPT-001 (实现任务)
    ↓ verified-by
TC-UIOPT-001 (测试用例)
```

### 6.4 覆盖率体系

**Get-Shit-Done**: 无覆盖率

**Spec-First**: 5 项覆盖率
| 指标 | 含义 | 阈值 |
|------|------|------|
| C3 | TASK 覆 FR | 100% |
| C4 | TC 覆 FR | 80% |
| C6 | TASK 已实现 | 阶段相关 |
| C8 | TASK 有上游 | 100% |
| C9 | TC 有上游 FR | 100% |

---

## 七、优劣势分析

### 7.1 Get-Shit-Done 优势

| 优势 | 说明 |
|------|------|
| ✅ **轻量快速** | 一行命令安装，无依赖 |
| ✅ **多运行时** | 支持 4 种 AI CLI |
| ✅ **上手简单** | Markdown 命令，易理解 |
| ✅ **Quick 模式** | 快速处理小任务 |
| ✅ **批量讨论** | 高效收集需求 |
| ✅ **社区活跃** | Discord + X 社区 |

### 7.2 Get-Shit-Done 劣势

| 劣势 | 说明 |
|------|------|
| ❌ **无状态机** | 手动推进，易遗漏 |
| ❌ **无 Gate** | 质量依赖用户判断 |
| ❌ **无追溯** | 无法追踪需求到实现 |
| ❌ **无自动循环** | 每步需手动触发 |
| ❌ **无崩溃恢复** | 会话丢失需重新开始 |

### 7.3 Spec-First 优势

| 优势 | 说明 |
|------|------|
| ✅ **完整状态机** | 8 阶段自动推进 |
| ✅ **Gate 校验** | 19 条质量门禁 |
| ✅ **追溯体系** | 14 类 ID 完整追溯 |
| ✅ **覆盖率矩阵** | 5 项覆盖率指标 |
| ✅ **Auto-Loop** | 自动循环执行 |
| ✅ **崩溃恢复** | Session Forensics |
| ✅ **Stuck 检测** | 重试控制 + 诊断 |
| ✅ **强制规范** | CLI 保护状态文件 |

### 7.4 Spec-First 劣势

| 劣势 | 说明 |
|------|------|
| ❌ **单运行时** | 仅支持 Claude Code |
| ❌ **学习曲线** | 14 个核心模块需理解 |
| ❌ **无 Quick 模式** | 小任务也需走流程 |
| ❌ **无批量讨论** | 需逐个确认 |
| ❌ **安装复杂** | 需要 npm 全局安装 |

---

## 八、场景选型建议

### 8.1 选型决策树

```
                         项目需求分析
                              │
              ┌───────────────┴───────────────┐
              │                               │
        需要追溯/审计?                   快速迭代/原型?
              │                               │
             是                               否
              │                               │
              ▼                               ▼
        Spec-First                    Get-Shit-Done
              │                               │
              │                    ┌──────────┴──────────┐
              │                    │                     │
              │               多运行时?              单一 Claude?
              │                    │                     │
              │                   是                     │
              │                    │                     │
              │                    ▼                     ▼
              │             Get-Shit-Done          两者皆可
```

### 8.2 场景推荐表

| 场景 | 推荐 | 原因 |
|------|------|------|
| **企业级项目** | Spec-First | 需要追溯、审计、质量门禁 |
| **快速原型** | Get-Shit-Done | 轻量快速，无流程负担 |
| **团队协作** | Spec-First | 状态机 + Gate 保证一致性 |
| **个人项目** | Get-Shit-Done | 简单直接，上手快 |
| **多 AI 工具用户** | Get-Shit-Done | 支持 4 种运行时 |
| **合规需求** | Spec-First | 完整追溯 + 覆盖率 |
| **小任务处理** | Get-Shit-Done | Quick 模式 |
| **长期维护项目** | Spec-First | 规范驱动，可维护性强 |

---

## 九、借鉴建议

### 9.1 Spec-First 可借鉴 (P0)

| 特性 | 来源 | 借鉴方式 |
|------|------|----------|
| **Quick 模式** | Get-Shit-Done | 增加快速任务入口，跳过 Gate |
| **多运行时支持** | Get-Shit-Done | 扩展支持 Gemini/Codex |
| **批量讨论** | Get-Shit-Done | 增加 `--batch` 参数 |

### 9.2 Spec-First 可借鉴 (P1)

| 特性 | 来源 | 借鉴方式 |
|------|------|----------|
| **轻量安装** | Get-Shit-Done | 提供 `npx` 一键安装 |
| **map-codebase** | Get-Shit-Done | 增强 Brownfield 支持 |
| **社区建设** | Get-Shit-Done | Discord + 文档站点 |

### 9.3 Get-Shit-Done 可借鉴 (P0)

| 特性 | 来源 | 借鉴方式 |
|------|------|----------|
| **状态机** | Spec-First | 增加阶段状态管理 |
| **Gate 校验** | Spec-First | 增加质量门禁 |
| **追溯 ID** | Spec-First | 增加 ID 体系 |

---

## 十、总结

### 10.1 核心差异

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           核心差异总结                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Get-Shit-Done: "让 AI 更可靠"                                           │
│  ├── 轻量级 Prompt 框架                                                  │
│  ├── 手动推进，灵活自由                                                  │
│  ├── 多运行时支持                                                        │
│  └── 适合快速迭代、个人项目                                              │
│                                                                          │
│  Spec-First: "让研发可追溯"                                              │
│  ├── 完整状态机引擎                                                      │
│  ├── Gate 校验，强制规范                                                 │
│  ├── 追溯 + 覆盖率体系                                                   │
│  └── 适合企业级项目、团队协作                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 定位关系

```
轻量 ←─────────────────────────────────────────────────────→ 完整
  │
  │  Get-Shit-Done                    Spec-First
  │       │                                │
  │       │         ┌──────────┐          │
  │       └────────▶│ 重叠区域 │◀─────────┘
  │                 └──────────┘
  │                      │
  │                      ▼
  │              4 阶段开发闭环
  │              Subagent 隔离
  │              Doctor 诊断
  │
灵活 ←─────────────────────────────────────────────────────→ 严格
```

### 10.3 最终建议

| 用户类型 | 推荐 |
|----------|------|
| **个人开发者** | Get-Shit-Done |
| **小团队 (2-5人)** | Spec-First |
| **企业团队** | Spec-First |
| **多工具用户** | Get-Shit-Done |
| **合规需求** | Spec-First |
| **快速原型** | Get-Shit-Done |

---

*分析完成于 2026-03-15*
