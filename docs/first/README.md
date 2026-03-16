---
mode: deep
generated_at: 2026-03-16
project: spec-first
version: 1.1.0
---

# Spec-First 项目快速认知

> **Spec-First** — AI-workflow CLI for spec-driven development
> 规范驱动研发流程引擎，为 AI 时代团队提供质量门禁、全链路追溯和 Feature 生命周期管理

## 文档导航

### 核心文档（Quick 模式）

| 文档 | 说明 | 用途 |
|------|------|------|
| [技术栈摘要](./tech-stack.md) | 运行时、语言、构建、测试、质量工具 | 快速了解技术选型 |
| [API 接口规范](./api-docs.md) | CLI 命令组、参数、子命令 | 查阅命令用法 |
| [代码结构概览](./codebase-overview.md) | 目录结构、模块职责、开发入口 | 定位代码位置 |
| [业务领域模型](./domain-model.md) | 核心实体、状态机、追溯 ID 体系 | 理解业务概念 |

### 深度分析文档（Deep 模式）

| 文档 | 说明 | 用途 |
|------|------|------|
| [架构设计](./architecture.md) | 四层架构、模块关系、数据流（含证据标注） | 理解系统架构 |
| [调用链分析](./call-graph.md) | 6 条关键调用链、函数追踪（含证据标注） | 追踪代码执行路径 |
| [外部依赖](./external-deps.md) | 运行时/开发依赖、使用位置、选型理由 | 管理依赖关系 |
| [本地环境搭建](./local-setup.md) | 环境要求、安装步骤、常见问题 | 快速上手开发 |
| [研发规范](./development-guidelines.md) | 代码风格、测试规范、提交规范（含证据标注） | 遵循开发约定 |

## 项目概览

### 核心定位

**面向 AI 时代的规范驱动研发流程引擎**

- 以结构化规范为单一真理源
- 全链路追踪 + AI 辅助 + 自动化门禁
- 将"需求→设计→编码→测试→交付"从人工驱动升级为规范驱动

### 核心价值

| 价值点 | 说明 |
|--------|------|
| AI 能力治理 | 统一 AI 协作入口，将个人能力差异收敛为流程标准化 |
| 研发质量 | 三层规范 + Gate 自动校验 + Hook 拦截 |
| 研发效率 | FR/NFR 结构化 + Context Pack 自动注入 |
| 全流程 AI 融合 | 8 阶段全覆盖 Skill 指令体系 |
| 知识管理 | 结构化产出物模板 + 追踪矩阵 |

### 目标用户

- **核心用户**: 10-50 人研发团队（多端协作、金融级质量要求）
- **扩展用户**: 5-10 人小团队（Size S 裁剪模式）

## 快速开始

```bash
# 安装
npm install -g spec-first

# 初始化 Feature 工作区
spec-first init

# 查看当前 Feature 状态
spec-first feature current

# 执行质量门禁校验
spec-first gate check --feature <featureId>
```

## 架构速览

```
┌────────────────────────────────────────────────────────────────┐
│                    人类（PM/TL/Dev/QA）                         │
│  决策、确认、签核                                               │
└───────────────┬────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────┐
│                Skill 层（流程编排与触发）                        │
│  20 个 Skill（统一 /spec-first:xxxx 命名空间）                   │
│  宿主：Claude Code / Codex CLI / 其他 Agent                     │
│  职责：流程编排、阶段流转触发、交互引导、内容生成                │
└───────────────┬────────────────────────────────────────────────┘
                │ 调用 CLI 命令
┌───────────────▼────────────────────────────────────────────────┐
│  CLI 层（确定性原子能力）                                        │
│  27 个命令 × 14 个核心模块                                       │
│  职责：ID 生成、Gate 校验、状态变更执行、度量计算                │
└───────────────┬────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────┐
│  Core 层（14 个核心模块）                                        │
│  process-engine | trace-engine | gate-engine | change-mgr       │
│  ai-orchestrator | metrics-engine | skill-runtime | ...         │
└───────────────┬────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────┐
│  Shared 层（共享类型和工具）                                     │
│  types.ts | logger.ts | fs-utils.ts | ...                      │
└────────────────────────────────────────────────────────────────┘
```

## 核心模块

| 模块 | 职责 | 关键文件 |
|------|------|----------|
| ProcessEngine | 阶段状态机（8阶段 + 2终态） | stage-machine.ts, advance.ts |
| TraceEngine | ID 注册/校验/搜索、矩阵管理 | id-generator.ts, matrix.ts |
| GateEngine | Gate 条件评估、SCA 校验 | gate-evaluator.ts, condition-registry.ts |
| ChangeMgr | RFC 状态机、缺陷管理 | rfc-machine.ts, defect-machine.ts |
| AIOrchestrator | Context Pack、Catchup | context-pack.ts, catchup.ts |
| MetricsEngine | 12 指标计算、健康分 | health-score.ts, bottleneck.ts |
| SkillRuntime | Skill 分发、prompt 组装 | dispatcher.ts, prompt-assembler.ts |

## 核心概念

### Stage 枚举（单向不可逆）

```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release
                                                                                            ↓
                                                                            08_done / 09_cancelled
```

### 追溯 ID（14 类）

| 类别 | ID 类型 | 说明 |
|------|---------|------|
| 业务链路 | FR | 功能需求 |
| | DS | 设计规格 |
| | TASK | 任务 |
| | TC | 测试用例 |
| 变更管理 | RFC | 变更请求 |
| V-Model | REQ/SYS/ARCH/MOD | 需求层级 |
| | ATP/STP/ITP/UTP | 测试层级 |
| 顶层 | Feature | Feature 标识 |

### 覆盖率（5 项）

| 指标 | 说明 |
|------|------|
| C3 | TASK → FR 传递覆盖 |
| C4 | TC → FR 直接覆盖 |
| C6 | TASK 实现率 |
| C8 | TASK 上游覆盖 |
| C9 | TC 上游覆盖 |

## 相关链接

- [GitHub](https://github.com/sunrain520/spec-first)
- [NPM](https://www.npmjs.com/package/spec-first)
- [CLAUDE.md](../../CLAUDE.md) - Claude Code 开发规范
