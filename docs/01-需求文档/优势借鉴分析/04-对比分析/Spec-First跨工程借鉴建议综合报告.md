# Spec-First 系统跨工程借鉴建议综合报告

> **分析日期**: 2026-03-15
> **分析团队**: Anthropic SDD 技术研发团队
> **分析范围**: GSD-2, Get-Shit-Done, cc-sdd, Gentle-AI, OpenSpec, Spec Kit, Planning-Files, Trellis, Superpowers, code-audit, agency-agents

---

## 一、分析概述

### 1.1 分析目标

本报告基于对多个主流 SDD (Spec-Driven Development) 工程的深度分析，梳理可借鉴到 **Spec-First** 系统的功能特性、技术实现和架构设计。

### 1.2 分析对象概览

| 项目 | 版本 | 定位 | 核心特点 |
|------|------|------|----------|
| **GSD-2** | v2.10.12 | 独立编码代理应用 | 真正自动化、状态机驱动 |
| **Get-Shit-Done** | v1.22.4 | Prompt 工程框架 | 多运行时、轻量易用 |
| **cc-sdd** | v2.1.1 | SDD 框架 | Steering 系统、EARS 需求 |
| **Gentle-AI** | v0.1.0 | AI 生态系统配置器 | Adapter 模式、Pipeline 引擎、Engram 记忆 |
| **OpenSpec** | - | 流动迭代工作流 | DAG 依赖、使能器模式 |
| **Spec Kit** | - | 规范驱动开发 | 宪法权威、模板驱动 |
| **Planning-Files** | - | 上下文工程 | 文件即内存、5-Question Reboot |
| **Trellis** | - | AI 工作流系统 | Read Before Write、知识持久化 |
| **Superpowers** | - | 高质量代理技能 | TDD 铁律、系统化调试 |
| **code-audit** | - | 安全审计专项 Skill | 双轨白盒审计、143 检测项、抗幻觉规则 |
| **agency-agents** | - | 多专家 Agent 库 | 专家角色库、多工具集成、编排代理 |
| **Spec-First** | v1.0.4 | 全链路研发引擎 | Gate 校验、追溯体系 |

### 1.3 分析方法

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           分析方法论                                      │
├─────────────────────────────────────────────────────────────────────────┤
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│   │ 代码审查  │ ─▶ │ 功能对比  │ ─▶ │ 架构分析  │ ─▶ │ 借鉴建议  │        │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘        │
│        │               │               │               │                │
│        ▼               ▼               ▼               ▼                │
│   阅读源代码        功能矩阵        模块依赖        优先级排序          │
│   理解实现          差异识别        设计模式        实施路线            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 二、功能对比总览

### 2.1 全项目功能矩阵（10 + 2 系统）

> 说明：主矩阵保留 10 个“通用研发系统”作为横向星级比较对象。`code-audit` 与 `agency-agents` 更偏专项能力库，放在下方做定性补充，避免用同一套通用研发指标强行打分失真。

| 功能维度 | GSD-2 | Get-Shit-Done | cc-sdd | Gentle-AI | OpenSpec | Spec Kit | Planning-Files | Trellis | Superpowers | Spec-First |
|----------|:-----:|:-------------:|:------:|:---------:|:--------:|:--------:|:--------------:|:-------:|:-----------:|:----------:|
| **自动化程度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **规范追溯** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **质量门禁** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **多运行时** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐ |
| **工具集成** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **上下文管理** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **易用性** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **持久记忆** | ⭐ | ⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ |
| **架构抽象** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **需求分析** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **测试验证** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **知识捕获** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **安全控制** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **TDD 强制** | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

### 2.1.1 补充分析对象（定性对比）

| 项目 | 定位 | 源码核验核心能力 | 与 Spec-First 的互补点 |
|------|------|------------------|-------------------------|
| **code-audit** | 安全审计专项 Skill | 55+ 漏洞类型、143 Mandatory Detection Items、Dual-Track Audit Model、Multi-Agent Deep Analysis、Anti-Hallucination | 可补齐 Spec-First 在白盒安全审计、漏洞证据化报告、专项安全检查表上的深度 |
| **agency-agents** | 多专家 Agent 库 | 专家角色库、Production-Ready workflows、Multi-Tool Integrations、Agents Orchestrator | 可补齐 Spec-First 在领域专家分工、多角色协作、非研发专业能力接入上的广度 |

### 2.2 各系统独有优势

**GSD-2 独有**:
- 真正的 Auto Mode (状态机完全自主)
- 三层超时监督 (soft/idle/hard)
- Git branch-per-slice 自动化
- 14 个内置扩展 (Playwright, Voice, LSP...)

**Get-Shit-Done 独有**:
- 多运行时支持 (Claude/OpenCode/Gemini/Codex)
- Quick 模式快速任务
- 批量讨论 (`--batch`)
- Wave 并行执行调度

**cc-sdd 独有**:
- Steering 持久项目记忆系统
- EARS 格式结构化需求
- 多语言支持 (13 种)
- Kiro IDE 兼容性

**Gentle-AI 独有**:
- Adapter 模式多 Agent 抽象 (5 个主流 Agent)
- Pipeline 执行引擎 (Prepare → Apply → Rollback)
- Engram 持久跨会话记忆 (MCP Server)
- FileMerge 无覆盖配置注入 (`<!-- gentle-ai:ID -->` 标记)
- TUI 安装向导 (Bubbletea)
- 预设系统 (full-gentleman / ecosystem-only / minimal / custom)

**OpenSpec 独有**:
- DAG 工件依赖 (使能器模式而非门禁)
- Delta Specs (ADDED/MODIFIED/REMOVED 操作)
- Fluid Iterative Workflow (Actions not phases)

**Spec Kit 独有**:
- Constitution 权威层级 (Constitution > Spec > Design > Code)
- 命令模板系统 (specify/plan/tasks/implement)
- 一致性分析 (只读模式)

**Planning-Files 独有**:
- 文件系统即内存 (KV-Cache 优化)
- 5-Question Reboot (上下文恢复机制)
- 7 步代理循环 (2-Action 规则)
- Manus 原则 (前缀稳定化)

**Trellis 独有**:
- Read Before Write (规范注入)
- break-loop 5 维度 Bug 分析
- 三层检查机制 (single → cross → completion)
- JSONL 上下文持久化
- 明确禁止 AI 提交 (record-session 前置)

**Superpowers 独有**:
- TDD 铁律 (RED → GREEN → REFACTOR 强制)
- HARD-GATE + 反合理化守卫
- 两阶段审查 (Stage 1 合规 + Stage 2 质量)
- 3-Strike 调试协议 (3+ 修复失败质疑架构)
- 子代理并行派发 (问题域分组)

**code-audit 独有**:
- 双轨白盒审计模型 (Sink-driven + Control-driven)
- 143 个强制检测项 (10 个安全维度)
- 多 Agent 深度审计 (大仓并行审查)
- 抗幻觉审计规则 (无证据不报、宁缺毋滥)

**agency-agents 独有**:
- 大规模专家 Agent 角色库
- 多工具集成生成与安装流程
- Agents Orchestrator 多代理协作
- 面向交付物的专家 workflows + deliverables

**Spec-First 独有**:
- Gate 校验引擎 (19 条)
- 追溯 ID 体系 (14 类)
- 覆盖率矩阵 (C3/C4/C6/C8/C9)
- Defect/RFC 变更管理
- PRD 需求质量评分

### 2.3 工作流模式对比

| 项目 | 工作流模式 | 核心驱动 |
|------|-----------|---------|
| **GSD-2** | 状态机循环 | research → plan_slice → execute_task → complete_slice |
| **Get-Shit-Done** | 命令驱动 | quick / discuss / implement / verify |
| **cc-sdd** | Steering 驱动 | steering context + SDD phases |
| **Gentle-AI** | Pipeline 执行 | Prepare → Apply → Rollback |
| **OpenSpec** | DAG 工件流 | proposal → specs/design → tasks → implement/verify → archive |
| **Spec Kit** | 命令模板流 | specify → plan → tasks → implement |
| **Planning-Files** | 7 步代理循环 | Requirements → Plan → Exec → Verify → Commit → Iterate |
| **Trellis** | 任务工作流 | start → brainstorm → before-*-dev → implement → check-* → finish-work → record-session |
| **Superpowers** | 计划执行流 | brainstorming → worktrees → plans → [exec\|subagent] → verify → finish |
| **code-audit** | 双轨审计流 | sink-driven 检测危险点 + control-driven 检查缺失控制 |
| **agency-agents** | 专家切换流 | 选择专家 → 执行角色 workflow → 产出 deliverable / 必要时交由 orchestrator 协调 |
| **Spec-First** | 阶段状态机 | 00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release |

### 2.4 错误处理协议对比

| 项目 | 错误协议 | 升级机制 |
|------|---------|---------|
| **GSD-2** | 超时监督 | soft → idle → hard 三层升级 |
| **Get-Shit-Done** | 任务失败重试 | 用户确认后重试 |
| **cc-sdd** | Steering 恢复 | 依赖上下文恢复 |
| **Gentle-AI** | Rollback 回滚 | Prepare 失败阻断，Apply 失败回滚 |
| **OpenSpec** | 状态检查 | blocked 状态提示 |
| **Spec Kit** | 任务中断 | 依赖人工决策与重试 |
| **Planning-Files** | 3-Strike | 3 次失败后升级用户 |
| **Trellis** | break-loop | 5 维度分析 (根因/修复失败/预防/系统性/知识捕获) |
| **Superpowers** | 3-Strike | 3+ 修复失败质疑架构 |
| **Spec-First** | 3-Strike | 3 次失败后升级 |

---

## 三、借鉴建议详细分析

### 3.1 P0 - 核心借鉴 (1-2 周实施)

#### 3.1.1 Auto Mode 状态机 (来自 GSD-2)

**借鉴价值**: ⭐⭐⭐⭐⭐

**现状问题**:
- Spec-First 已有 `orchestrate --auto/--resume/--auto-advance` 能力，但自动化深度仍偏浅
- 当前仍以阶段推进为主，长时间无人值守能力弱于 GSD-2
- 缺少类似 GSD-2 的 slice 级自治循环和超时监督

**GSD-2 实现参考**:
```typescript
// gsd-2/src/resources/extensions/gsd/auto.ts

while (active && !paused) {
  const state = deriveState(basePath);  // 从磁盘派生状态

  switch (state.phase) {
    case 'research':
      await dispatchResearch(state);
      break;
    case 'plan_slice':
      await dispatchPlanSlice(state);
      break;
    case 'execute_task':
      await dispatchExecuteTask(state);
      break;
    case 'complete_slice':
      await dispatchCompleteSlice(state);
      break;
  }
}
```

**建议实现方案**:
```typescript
// spec-first/src/core/auto-loop/index.ts (新增)

export async function runAutoMode(options: AutoModeOptions) {
  while (active) {
    const state = loadStageState(featureId);
    const gateResult = await checkGateConditions(state.stage);

    if (!gateResult.passed) {
      reportGateFailure(gateResult);
      break;
    }

    await dispatchNextPhase(state);
  }
}
```

---

#### 3.1.2 Quick 模式 (来自 Get-Shit-Done)

**借鉴价值**: ⭐⭐⭐⭐

**现状问题**:
- 小任务仍倾向走完整 8 个 active stages
- Bug 修复、配置修改等场景仍偏繁琐

**建议实现方案**:
```typescript
// spec-first/src/cli/commands/quick.ts (新增)

export async function quickMode(description: string) {
  const task = createQuickTask(description);
  await executeTask(task);
  await commitChanges(task);
}
```

---

#### 3.1.3 Steering 项目记忆 (来自 cc-sdd)

**借鉴价值**: ⭐⭐⭐⭐⭐

**cc-sdd 实现参考**:
```
.kiro/steering/
├── product.md     # 产品愿景、核心能力
├── tech.md        # 技术栈、框架决策
└── structure.md   # 项目结构、命名规范
```

**建议实现方案**:
```typescript
// spec-first/src/core/steering/index.ts (新增)

export interface SteeringContext {
  product: ProductVision;
  tech: TechStack;
  structure: ProjectStructure;
  patterns: CodePattern[];
}
```

---

#### 3.1.4 Adapter 多 Agent 模式 (来自 Gentle-AI)

**借鉴价值**: ⭐⭐⭐⭐⭐

**Gentle-AI 实现参考**:
```go
// gentle-ai/internal/agents/interface.go

type Adapter interface {
    Agent() model.AgentID
    Detect(ctx context.Context, homeDir string) (installed bool, ...)
    SystemPromptStrategy() model.SystemPromptStrategy
    MCPStrategy() model.MCPStrategy
    SupportsSkills() bool
    SupportsMCP() bool
}
```

**建议实现方案**:
```typescript
// spec-first/src/core/agents/adapter.ts (新增)

export interface AgentAdapter {
  agentId: AgentID;
  detect(): Promise<DetectionResult>;
  systemPromptStrategy(): SystemPromptStrategy;
  mcpStrategy(): MCPStrategy;
  supportsSkills(): boolean;
  supportsMCP(): boolean;
}

export class ClaudeCodeAdapter implements AgentAdapter { ... }
export class OpenCodeAdapter implements AgentAdapter { ... }
export class GeminiCLIAdapter implements AgentAdapter { ... }
```

---

#### 3.1.6 Engram 持久记忆 (来自 Gentle-AI)

**借鉴价值**: ⭐⭐⭐⭐⭐

**现状问题**:
- 无跨会话持久记忆
- 上下文丢失导致重复工作

**建议实现方案**:
```typescript
// spec-first/src/core/memory/engram-client.ts (新增)

export class EngramClient {
  async saveMemory(params: {
    title: string;
    topicKey: string;
    type: string;
    project: string;
    content: string;
  }): Promise<string>;

  async searchMemory(query: string, project: string): Promise<MemorySearchResult[]>;
}
```

---

### 3.2 P1 - 重要借鉴 (2-4 周实施)

#### 3.2.1 Pipeline 执行引擎 (来自 Gentle-AI)

**借鉴价值**: ⭐⭐⭐⭐⭐

**Gentle-AI 实现**:
```go
func (o *Orchestrator) Execute(plan StagePlan) ExecutionResult {
    prepareResult := o.runner.Run(StagePrepare, plan.Prepare)
    if !prepareResult.Success {
        return ExecutionResult{Prepare: prepareResult, Err: prepareResult.Err}
    }

    applyResult := o.runner.Run(StageApply, plan.Apply)
    if !applyResult.Success && o.policy.ShouldRollback(...) {
        result.Rollback = ExecuteRollback(applyResult.Steps, o.stepByID)
    }
    return result
}
```

---

#### 3.2.2 FileMerge 无覆盖注入 (来自 Gentle-AI)

**借鉴价值**: ⭐⭐⭐⭐

**建议实现**:
```typescript
// spec-first/src/core/filemerge/markdown-merge.ts (新增)

export function injectMarkdownSection(
  content: string,
  sectionId: string,
  newContent: string
): string {
  const startMarker = `<!-- spec-first:${sectionId} -->`;
  const endMarker = `<!-- /spec-first:${sectionId} -->`;
  // 查找现有区块 → 如果存在则替换，不存在则追加
}
```

---

#### 3.2.3 三层超时监督 (来自 GSD-2)

**借鉴价值**: ⭐⭐⭐⭐

- soft_timeout_minutes: 20 - 警告 LLM 收尾
- idle_timeout_minutes: 10 - 检测停滞
- hard_timeout_minutes: 30 - 强制暂停

---

#### 3.2.4 Wave 并行执行 (来自 Get-Shit-Done)

**借鉴价值**: ⭐⭐⭐⭐

```
WAVE 1 (parallel)    WAVE 2 (parallel)    WAVE 3
┌─────────┐ ┌─────────┐    ┌─────────┐ ┌─────────┐    ┌─────────┐
│ Plan 01 │ │ Plan 02 │ →  │ Plan 03 │ │ Plan 04 │ →  │ Plan 05 │
└─────────┘ └─────────┘    └─────────┘ └─────────┘    └─────────┘
```

---

#### 3.2.5 EARS 需求格式 (来自 cc-sdd)

**借鉴价值**: ⭐⭐⭐⭐

```markdown
**As a** user
**I want to** log in with email and password
**So that** I can access my personal dashboard
```

---

#### 3.2.6 Git 自动化 (来自 GSD-2)

**借鉴价值**: ⭐⭐⭐⭐

- branch-per-slice 自动化
- 自动提交和合并
- squash merge 支持

---

### 3.3 P2 - 增强借鉴 (1-2 月实施)

#### 3.3.1 多运行时支持

| 运行时 | Get-Shit-Done | cc-sdd | Gentle-AI | Spec-First |
|--------|:-------------:|:------:|:---------:|:----------:|
| Claude Code | ✅ | ✅ | ✅ | ✅ |
| OpenCode | ✅ | ✅ | ✅ | ❌ |
| Gemini CLI | ✅ | ✅ | ✅ | ❌ |
| Codex | ✅ | ✅ | ❌ | ❌ |
| Cursor | ❌ | ✅ | ✅ | ❌ |
| VS Code Copilot | ❌ | ❌ | ✅ | ❌ |

---

#### 3.3.2 批量讨论模式 (来自 Get-Shit-Done)

**借鉴价值**: ⭐⭐⭐

```markdown
--batch    批量收集需求 (一次回答一组问题)
--interactive  逐个确认 (默认)
```

---

#### 3.3.3 浏览器工具集成 (来自 GSD-2)

**借鉴价值**: ⭐⭐⭐

- Playwright 自动化
- 通过 MCP 集成

---

#### 3.3.4 语音输入支持 (来自 GSD-2)

**借鉴价值**: ⭐⭐

- 作为长期增强，通过 MCP 集成

---

## 四、Skill 体系横向对比

> **参考来源**: `05-全局比对/skill-体系对比分析.md`、`skill-功能对比矩阵.md`

### 4.1 分析项目概览

| 项目 | Skill 数量 | 核心定位 | 设计理念 |
|------|-----------|---------|---------|
| **Spec-First** | 20 | 全链路研发闭环 | 阶段驱动、追溯矩阵、Gate 门禁 |
| **OpenSpec** | 12 | 流动迭代工作流 | Actions not phases、DAG 依赖 |
| **Spec Kit** | 9 | 规范驱动开发 | Spec-Driven Development、命令模板 |
| **Planning-Files** | 1 | 上下文工程 | Manus 原则、文件系统即内存 |
| **Trellis** | 16 | AI 工作流系统 | Read Before Write、知识持久化 |
| **Superpowers** | 14 | 高质量代理技能 | TDD 铁律、系统化调试、审查闭环 |

### 4.2 设计理念对比

| 项目 | 核心设计理念 | 关键特征 |
|------|-------------|---------|
| Spec-First | **规范即契约** | 阶段状态机、追溯 ID、覆盖率矩阵、Gate 门禁 |
| OpenSpec | **Fluid Iterative Workflow** | 工件 DAG、使能器非门禁、快速路径 |
| Spec Kit | **Spec-Driven Development** | 宪法权威、模板驱动、一致性分析 |
| Planning-Files | **Context Engineering** | KV-Cache 优化、文件即内存、5-Question Reboot |
| Trellis | **Read Before Write** | 规范注入、上下文漂移对抗、知识捕获 |
| Superpowers | **Discipline Over Convenience** | TDD 铁律、压力测试、漏洞封闭 |

### 4.3 工作流模式对比

#### Spec-First: 阶段状态机驱动
```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release
           ↓            ↓          ↓          ↓             ↓            ↓
         spec Skill   design    task       code        verify      archive
```

#### OpenSpec: 工件 DAG 驱动
```
proposal → specs/design → tasks → implement/verify → archive
```

#### Trellis: 任务工作流驱动
```
start → brainstorm → before-*-dev → implement → check-* → finish-work → record-session
```

#### Superpowers: 计划执行驱动
```
brainstorming → worktrees → plans → [exec|subagent] → verify → finish
```

### 4.4 核心功能对比矩阵

| 功能维度 | Spec-First | OpenSpec | Spec Kit | Trellis | Superpowers | Planning-Files |
|----------|:----------:|:--------:|:--------:|:-------:|:-----------:|:--------------:|
| **需求分析** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **追溯能力** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **质量保障** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **上下文管理** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **执行效率** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **知识捕获** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **安全控制** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

### 4.5 Skill 体系借鉴建议

#### 4.5.1 高优先级借鉴 (P0)

| 增强项 | 来源 | 目标 Skill | 核心借鉴点 |
|--------|------|-----------|-----------|
| **TDD 强制铁律** | Superpowers | code | HARD-GATE + 反合理化守卫 |
| **break-loop 深度复盘** | Trellis | archive | 5 维度分析 + Immediate Actions |
| **分层检查体系** | Trellis | verify + review | 单层 + 跨层 + 完成检查 |
| **Constitution 权威层** | Spec Kit | 全局 | 宪法权威层级 |

**TDD 铁律核心**:
```
RED（写失败测试）→ Verify RED → GREEN（最小实现）→ Verify GREEN → REFACTOR
核心铁律: 无失败测试在前，不得编写生产代码
```

**break-loop 5 维度分析**:
1. 根因分类
2. 为何修复失败
3. 预防机制
4. 系统性扩展
5. 知识捕获

#### 4.5.2 中优先级借鉴 (P1)

| 增强项 | 来源 | 借鉴点 |
|--------|------|--------|
| **三层检查机制** | Trellis | single → cross → completion |
| **宪法权威机制** | Spec Kit | Constitution > Spec > Design > Code |
| **两阶段审查** | Superpowers | Stage 1 合规 + Stage 2 质量 |
| **强制检测清单** | code-audit | 安全专项检查表 + 证据化审计 |
| **KV-Cache 优化** | Planning-Files | 稳定 prompt 前缀 |
| **5-Question Reboot** | Planning-Files | 上下文恢复机制 |

#### 4.5.3 可选借鉴 (P2)

| 增强项 | 来源 | 借鉴点 |
|--------|------|--------|
| **DAG 工件依赖** | OpenSpec | 使能器而非门禁 |
| **Delta Specs** | OpenSpec | ADDED/MODIFIED/REMOVED 操作 |
| **并行执行** | Superpowers | dispatching-parallel-agents |
| **专项安全审计** | code-audit | 白盒漏洞专项扫描与证据报告 |
| **专家角色库** | agency-agents | 多领域专家分工与 orchestrator 协同 |

### 4.6 Spec-First 保持优势（不借鉴）

| 设计 | 描述 | 独特性 |
|------|------|--------|
| **追溯 ID 体系** | FR/NFR/DS/TASK/TC/RFC 等 14 类 | ★★★★★ 全链路追溯 |
| **覆盖率矩阵** | C3/C4/C6/C8/C9 五项核心覆盖率 | ★★★★★ 质量可视化 |
| **Gate 门禁** | 五步证据铁律、硬性阻塞 | ★★★★☆ 质量保障 |
| **Stage 状态机** | 8 active + 2 terminal stages | ★★★★☆ 流程控制 |
| **Defect/RFC 变更管理** | 变更状态机 + 影响分析 | ★★★★★ 独特优势 |

---

## 五、架构融合建议

### 5.1 理想融合架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Spec-First 2.0 理想架构                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      CLI Layer                                    │   │
│  │  spec-first init | auto | quick | gate | stage | ...            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Core Engine                                  │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │   │
│  │  │ Auto Loop    │ │ Gate Engine  │ │ Trace Engine │            │   │
│  │  │ (from GSD-2) │ │ (existing)   │ │ (existing)   │            │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘            │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │   │
│  │  │ Metrics      │ │ Timeout      │ │ Wave         │            │   │
│  │  │ (from GSD-2) │ │ (from GSD-2) │ │ (from Get-Shit-Done) │    │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘            │   │
│  │  ┌──────────────┐ ┌──────────────┐                             │   │
│  │  │ Pipeline     │ │ FileMerge    │ (from Gentle-AI)            │   │
│  │  └──────────────┘ └──────────────┘                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Context Layer                                │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │   │
│  │  │ Steering     │ │ Spec Store   │ │ Skill Runtime│            │   │
│  │  │ (from cc-sdd)│ │ (existing)   │ │ (existing)   │            │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘            │   │
│  │  ┌──────────────┐                                                │   │
│  │  │ Engram       │ (from Gentle-AI)                              │   │
│  │  │ Memory       │                                                │   │
│  │  └──────────────┘                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Runtime Layer (Adapter Pattern)              │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │   │
│  │  │ Claude Code  │ │ OpenCode     │ │ Gemini CLI   │            │   │
│  │  │ Adapter      │ │ Adapter      │ │ Adapter      │            │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘            │   │
│  │  ┌──────────────┐ ┌──────────────┐                             │   │
│  │  │ Cursor       │ │ VS Code      │ (from Gentle-AI)            │   │
│  │  │ Adapter      │ │ Copilot      │                             │   │
│  │  └──────────────┘ └──────────────┘                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 模块依赖关系

```
auto-loop ──────▶ gate-engine ──────▶ stage-advance
    │                  │                    │
    ▼                  ▼                    ▼
timeout-supervisor  metrics-engine      process-engine
    │                  │                    │
    └──────────────────┴────────────────────┘
                       │
                       ▼
              steering-context ──▶ skill-runtime
```

---

## 六、实施路线图

### 6.1 Phase 1: 核心自动化 (1-2 周)

**目标**: 增强 Auto Mode 深度 + 多 Agent 基础

| 任务 | 来源 | 优先级 | 预估 |
|------|------|--------|------|
| Auto Loop 状态机 | GSD-2 | P0 | 3 天 |
| Quick 模式 | Get-Shit-Done | P0 | 1 天 |
| Git 自动提交 | GSD-2 | P0 | 1 天 |
| AgentAdapter 接口 | Gentle-AI | P0 | 1 天 |
| Engram MCP 集成 | Gentle-AI | P0 | 2 天 |

**产出**:
- `src/core/auto-loop/` 模块
- `spec-first quick` 命令
- `src/core/git-automation/` 模块
- `src/core/agents/adapter.ts` 接口
- `src/core/memory/engram-client.ts`

### 6.2 Phase 2: 增强功能 (2-4 周)

**目标**: 提升用户体验 + 执行引擎

| 任务 | 来源 | 优先级 | 预估 |
|------|------|--------|------|
| Steering 项目记忆 | cc-sdd | P0 | 2 天 |
| 三层超时监督 | GSD-2 | P1 | 2 天 |
| Wave 并行调度 | Get-Shit-Done | P1 | 2 天 |
| EARS 需求格式 | cc-sdd | P1 | 1 天 |
| 批量讨论模式 | Get-Shit-Done | P1 | 1 天 |
| Pipeline 执行引擎 | Gentle-AI | P1 | 2 天 |
| FileMerge 模块 | Gentle-AI | P1 | 1 天 |
| 安全审计清单 | code-audit | P1 | 2 天 |
| 审计报告模板 | code-audit | P1 | 1 天 |

**产出**:
- `src/core/steering/` 模块
- `src/core/ai-orchestrator/timeout-supervisor.ts`
- `src/core/batch-executor/wave-scheduler.ts`
- EARS 格式模板
- `src/core/pipeline/orchestrator.ts`
- `src/core/filemerge/markdown-merge.ts`
- `src/core/security/audit-checklist.ts`
- `docs/templates/security-audit-report.md`

### 6.3 Phase 3: 生态扩展 (1-2 月)

**目标**: 多运行时支持 + 高级功能

| 任务 | 来源 | 优先级 | 预估 |
|------|------|--------|------|
| OpenCode 适配器 | Gentle-AI | P2 | 2 天 |
| Gemini CLI 适配器 | Gentle-AI | P2 | 2 天 |
| Cursor 适配器 | Gentle-AI | P2 | 2 天 |
| 浏览器工具集成 | GSD-2 | P2 | 3 天 |
| TUI 安装向导 | Gentle-AI | P2 | 3 天 |
| 专家角色库接入 | agency-agents | P2 | 3 天 |
| Orchestrator 协作模板 | agency-agents | P2 | 2 天 |

**产出**:
- `src/core/agents/opencode-adapter.ts`
- `src/core/agents/gemini-adapter.ts`
- `src/core/agents/cursor-adapter.ts`
- Playwright 扩展 (可选)
- TUI 安装界面 (可选)
- `skills/spec-first/experts/` 角色库
- `src/core/agents/orchestrator-profiles.ts`

---

## 七、风险评估

### 7.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Auto Mode 复杂度高 | 高 | 分阶段实现，先做手动确认版 |
| 多运行时兼容性 | 中 | 先实现抽象接口，逐个适配 |
| Git 自动化冲突 | 低 | 提供 `--no-auto-git` 跳过选项 |

### 7.2 用户体验风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 学习曲线变陡 | 高 | 保留简单模式，Auto Mode 可选 |
| 自动化失控 | 中 | 提供暂停/恢复机制 |

---

## 八、总结

### 8.1 核心借鉴清单

**从 GSD-2 借鉴** (4 项):
1. ✅ Auto Mode 状态机 (P0)
2. ✅ 三层超时监督 (P1)
3. ✅ Git 自动化 (P2)
4. ✅ Worktree 管理 (P2)

**从 Get-Shit-Done 借鉴** (4 项):
1. ✅ Quick 模式 (P0)
2. ✅ Wave 并行执行 (P1)
3. ✅ 批量讨论模式 (P1)
4. ✅ 多运行时架构 (P2)

**从 cc-sdd 借鉴** (3 项):
1. ✅ Steering 项目记忆 (P0)
2. ✅ EARS 需求格式 (P1)
3. ✅ 多语言支持 (P2)

**从 Gentle-AI 借鉴** (5 项):
1. ✅ Adapter 多 Agent 模式 (P0)
2. ✅ Engram 持久记忆 (P0)
3. ✅ Pipeline 执行引擎 (P1)
4. ✅ FileMerge 无覆盖注入 (P1)
5. ✅ TUI 安装向导 (P2)

**从 code-audit 借鉴** (2 项):
1. ✅ 双轨白盒安全审计 (P1)
2. ✅ 强制检测清单 + 审计报告模板 (P1)

**从 agency-agents 借鉴** (2 项):
1. ✅ 专家角色库接入 (P2)
2. ✅ Orchestrator 协作模板 (P2)

**从 Skill 体系借鉴** (4 项):
1. ✅ TDD 强制铁律 (from Superpowers)
2. ✅ break-loop 深度复盘 (from Trellis)
3. ✅ 分层检查体系 (from Trellis)
4. ✅ Constitution 权威层 (from Spec Kit)

### 8.2 Spec-First 保持优势

**不借鉴，保持现有设计**:
1. ✅ Gate 校验引擎 (19 条) - 无竞品可匹配
2. ✅ 追溯 ID 体系 (14 类) - 独特优势
3. ✅ 覆盖率矩阵 (5 项) - 独特优势
4. ✅ Defect/RFC 变更管理 - 独特优势
5. ✅ PRD 需求质量评分 - 独特优势

### 8.3 最终愿景

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Spec-First 2.0 愿景                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  "真正自动化的规范驱动引擎"                                              │
│                                                                          │
│  ├── 用户可以离开 (Auto Mode from GSD-2)                                │
│  ├── 质量保证 (Gate 校验 - Spec-First 原创)                             │
│  ├── 完整追溯 (14 类 ID - Spec-First 原创)                              │
│  ├── 项目记忆 (Steering from cc-sdd + Engram from Gentle-AI)            │
│  ├── 灵活模式 (Quick from Get-Shit-Done / Full)                         │
│  ├── 多运行时 (Adapter from Gentle-AI)                                  │
│  ├── 安全注入 (Pipeline + FileMerge from Gentle-AI)                     │
│  ├── 安全审计 (Dual-Track Audit from code-audit)                        │
│  ├── 专家协作 (Experts + Orchestrator from agency-agents)               │
│  └── 超时监督 (三层 from GSD-2)                                         │
│                                                                          │
│  = GSD-2 的自动化 + Spec-First 的规范 + cc-sdd 的记忆 + Gentle-AI 的生态 │
│    + code-audit 的安全深度 + agency-agents 的专家广度                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 附录：项目路径说明

> **配套实施计划**：`2026-03-15-spec-first-gap-closure.md`（同目录）
> 覆盖 14 个任务（T1–T14），对应本报告六大低分短板的补齐方案，采用 TDD 五步骤实施，含验收指标与完成判定标准。

本报告的源码核验基于以下本地项目路径：

- `Spec-First`: `/Users/kuang/xiaobu/spec-first`
- `GSD-2`: `/Users/kuang/xiaobu/gsd-2`
- `Get-Shit-Done`: `/Users/kuang/xiaobu/get-shit-done`
- `cc-sdd`: `/Users/kuang/xiaobu/cc-sdd`
- `Gentle-AI`: `/Users/kuang/xiaobu/gentle-ai`
- `OpenSpec`: `/Users/kuang/xiaobu/OpenSpec`
- `Spec Kit`: `/Users/kuang/xiaobu/spec-kit`
- `Planning-Files`: `/Users/kuang/xiaobu/planning-with-files`
- `Trellis`: `/Users/kuang/xiaobu/Trellis`
- `Superpowers`: `/Users/kuang/xiaobu/superpowers`

- `code-audit`: `/Users/kuang/xiaobu/code-audit`
- `agency-agents`: `/Users/kuang/xiaobu/agency-agents`

*分析完成于 2026-03-15*
*分析团队: Anthropic SDD 技术研发团队*
