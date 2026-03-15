# Gentle-AI 项目分析报告

> **分析日期**: 2026-03-15
> **对比版本**: Gentle-AI v0.1.0
> **项目地址**: https://github.com/Gentleman-Programming/gentle-ai

---

## 一、执行摘要

### 1.1 核心定位

**Gentle-AI** 是一个 **AI 生态系统配置器**，而非 AI Agent 本身。它的核心价值在于：

```
一键安装 → 多 Agent 支持 → 持久记忆 + SDD 工作流 + 技能注入
```

**一句话总结**:
```
Gentle-AI: 让任何 AI Agent 获得 Gentleman 生态系统的全部能力
```

### 1.2 代码规模

| 指标 | 数值 |
|------|------|
| **语言** | Go 1.22 |
| **代码行数** | ~19,500 行 |
| **测试文件** | 26 个包 |
| **测试函数** | 260+ 个 |
| **E2E 测试** | 78 个 (Docker) |
| **支持 Agent** | 5 个 |

---

## 二、架构概览

### 221 系统架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Gentle-AI 架构                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐               ┌─────────────────────┐          │
│  │   cmd/gentle-ai/     │               │   scripts/           │          │
│  │   CLI 入口            │               │   安装脚本           │          │
│  └──────────┬──────────┘               └─────────────────────┘          │
│             │                                     │                      │
│             ▼                                     ▼                      │
│  ┌─────────────────────┐               ┌─────────────────────┐          │
│  │   internal/tui/       │               │   internal/           │          │
│  │   Bubbletea TUI      │               │   ├── agents/       │          │
│  └──────────┬──────────┘               │   ├── components/   │          │
│             │                              │   ├── pipeline/     │          │
│             ▼                              │   ├── planner/      │          │
│  ┌─────────────────────┐               │   └── assets/       │          │
│  │   Pipeline Layer     │               └─────────────────────┘          │
│  │   ├── Prepare        │                                           │          │
│  │   ├── Apply          │                                           │          │
│  │   └── Rollback       │                                           │          │
│  └─────────────────────┘                                           │          │
│                                                                          │
│  特点: 分阶段执行 + 自动回滚 + TUI 向导                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
gentle-ai/
├── cmd/gentle-ai/             # CLI 入口
├── internal/
│   ├── app/                # 命令分发 + 运行时绑定
│   ├── model/              # 领域类型 (agents, components, skills, presets)
│   ├── catalog/            # 注册表定义
│   ├── system/             # OS/发行版检测、依赖检查
│   ├── cli/                # 安装标志、验证、编排
│   ├── planner/            # 依赖图、解析、排序
│   ├── pipeline/           # 分阶段执行 + 回滚编排
│   ├── backup/             # 配置快照 + 恢复
│   ├── assets/             # 嵌入的技能文件 + 人格模板
│   ├── components/         # 每个组件的安装/注入逻辑
│   │   ├── engram/         # Engram 记忆系统注入
│   │   ├── sdd/            # SDD 工作流注入
│   │   ├── skills/         # 技能文件注入
│   │   ├── mcp/            # MCP 服务器配置
│   │   ├── persona/        # 人格模板注入
│   │   ├── theme/          # 主题配置
│   │   ├── permissions/    # 权限配置
│   │   ├── gga/            # GGA Provider
│   │   └── filemerge/      # 标记文件合并 (无覆盖注入)
│   ├── agents/             # Agent 适配器
│   │   ├── claude/         # Claude Code 适配器
│   │   ├── opencode/       # OpenCode 适配器
│   │   ├── gemini/         # Gemini CLI 适配器
│   │   ├── cursor/         # Cursor 适配器
│   │   └── vscode/         # VS Code Copilot 适配器
│   ├── tui/                # Bubbletea TUI
│   └── verify/             # 后置健康检查
├── e2e/                    # Docker E2E 测试
├── scripts/                # 安装脚本
└── testdata/               # 黄金测试固件
```

---

## 三、核心设计模式

### 3.1 Adapter 模式 (核心亮点)

**设计理念**: 组件代码不应包含 `switch agentID` 语句，而是通过 Adapter 接口抽象。

```go
// internal/agents/interface.go

type Adapter interface {
    // 身份
    Agent() model.AgentID
    Tier() model.SupportTier

    // 检测
    Detect(ctx context.Context, homeDir string) (installed bool, binaryPath string, configPath string, configFound bool, err error)

    // 安装
    SupportsAutoInstall() bool
    InstallCommand(profile system.PlatformProfile) ([][]string, error)

    // 配置路径 — components use these instead of hardcoding paths per agent.
    GlobalConfigDir(homeDir string) string
    SystemPromptDir(homeDir string) string
    SystemPromptFile(homeDir string) string
    SkillsDir(homeDir string) string
    SettingsPath(homeDir string) string

    // 配置策略 — HOW to inject content, not WHERE (that's paths above).
    SystemPromptStrategy() model.SystemPromptStrategy
    MCPStrategy() model.MCPStrategy

    // MCP 路径解析
    MCPConfigPath(homeDir string, serverName string) string

    // 能力声明 — agents declare what they support.
    SupportsOutputStyles() bool
    OutputStyleDir(homeDir string) string

    SupportsSlashCommands() bool
    CommandsDir(homeDir string) string

    SupportsSkills() bool
    SupportsSystemPrompt() bool
    SupportsMCP() bool
}
```

**不同 Agent 的配置策略**:

| Agent | System Prompt 策略 | MCP 策略 |
|-------|---------------------|---------|
| Claude Code | MarkdownSections | SeparateMCPFiles |
| OpenCode | FileReplace | MergeIntoSettings |
| Gemini CLI | AppendToFile | MergeIntoSettings |
| Cursor | FileReplace | MCPConfigFile |
| VS Code | InstructionsFile | MCPConfigFile |

### 3.2 Pipeline 执行引擎

```go
// internal/pipeline/orchestrator.go

type Orchestrator struct {
    runner   Runner
    policy   RollbackPolicy
    stepByID map[string]Step
}

func (o *Orchestrator) Execute(plan StagePlan) ExecutionResult {
    // 1. Prepare 阶段
    prepareResult := o.runner.Run(StagePrepare, plan.Prepare)
    if !prepareResult.Success {
        return ExecutionResult{Prepare: prepareResult, Err: prepareResult.Err}
    }

    // 2. Apply 阶段
    applyResult := o.runner.Run(StageApply, plan.Apply)
    if !applyResult.Success && o.policy.ShouldRollback(StageApply, applyResult.Err) {
        // 3. 自动回滚
        result.Rollback = ExecuteRollback(applyResult.Steps, o.stepByID)
    }

    return result
}
```

**执行流程**:
```
Prepare 阶段 (依赖安装/检测)
       ↓
Apply 阶段 (配置注入)
       ↓
   失败? → 自动回滚
```

### 3.3 FileMerge 无覆盖注入

```go
// internal/components/filemerge/json_merge.go

// Markdown 区块标记注入
func InjectMarkdownSection(content, sectionID, newContent string) string {
    startMarker := fmt.Sprintf("<!-- gentle-ai:%s -->", sectionID)
    endMarker := fmt.Sprintf("<!-- /gentle-ai:%s -->", sectionID)

    // 查找现有区块 → 如果存在则替换，不存在则追加
}

// JSON 深度合并
func MergeJSONObjects(base, overlay []byte) ([]byte, error) {
    // 递归合并对象
    // overlay 优先级高于 base
}
```

**设计亮点**:
- 使用标记 `<!-- gentle-ai:ID -->` 保护用户内容
- JSON 深度合并
- 原子写入避免竞态条件
- 文件存在检查

---

## 四、支持的 Agent

### 4.1 Agent 列表

| Agent | 配置路径 | 状态 |
|-------|---------|------|
| **Claude Code** | `~/.claude` | ✅ Full |
| **OpenCode** | `~/.config/opencode` | ✅ Full |
| **Gemini CLI** | `~/.gemini` | ✅ Full |
| **Cursor** | `~/.cursor` | ✅ Full |
| **VS Code Copilot** | `~/.github` | ✅ Full |

### 4.2 各 Agent 差异
| 特性 | Claude Code | OpenCode | Gemini CLI | Cursor | VS Code |
|------|-------------|----------|------------|--------|---------|
| **Skills 支持** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **MCP 支持** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Slash Commands** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Output Styles** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **System Prompt** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 五、组件体系

### 5.1 组件列表
| 组件 | 功能 | 注入方式 |
|------|------|---------|
| **Engram** | 持久跨会话记忆 | MCP Server + System Prompt |
| **SDD** | Spec-Driven Development 工作流 | Skills + Commands |
| **Skills** | 精选编码模式 | 文件复制 |
| **Context7** | 实时库文档 | MCP Server |
| **Persona** | 教学导向人格 | System Prompt |
| **Permissions** | 安全优先权限 | 配置文件 |
| **GGA** | AI Provider 切换器 | 配置文件 |
| **Theme** | 主题配置 | 配置文件 |

### 5.2 预设系统
| 预设 | 包含组件 |
|------|---------|
| **full-gentleman** | Engram + SDD + Skills + Context7 + Persona + Permissions |
| **ecosystem-only** | Engram + SDD + Skills + Context7 |
| **minimal** | SDD (仅核心) |
| **custom** | 用户选择 |

### 5.3 人格模式
| 模式 | 描述 |
|------|------|
| **gentleman** | 教学导向，解释 WHY，挑战不良实践 |
| **neutral** | 中立，仅执行任务 |
| **custom** | 用户自定义 |

---

## 六、SDD 工作流

### 6.1 技能体系
**9 个 SDD 技能**:

| 技能 | 功能 | 阶段 |
|------|------|------|
| `sdd-init` | 初始化项目上下文 | 准备 |
| `sdd-explore` | 探索问题域 | 准备 |
| `sdd-propose` | 创建变更提案 | 规划 |
| `sdd-spec` | 编写需求规格 | 规划 |
| `sdd-design` | 技术设计 | 规划 |
| `sdd-tasks` | 任务拆解 | 规划 |
| `sdd-apply` | 代码实现 | 执行 |
| `sdd-verify` | 验证 | 验证 |
| `sdd-archive` | 归档 | 收尾 |

### 6.2 SDD 依赖图
```
proposal → specs → tasks → apply → verify → archive
              ↑
              |
           design
```
- `specs` 和 `design` 都依赖 `proposal`
- `tasks` 依赖 `specs` 和 `design`

### 6.3 持久化后端
**三种模式**:

| 模式 | 存储 | 特点 |
|------|------|------|
| `engram` | Engram MCP Server | 跨会话持久，需要 MCP |
| `openspec` | `openspec/` 目录 | 本地文件，无依赖 |
| `hybrid` | 两者同时 | 双保险，消耗更多 tokens |
| `none` | 无 | 临时会话，不持久 |

---

## 七、与其他项目对比
### 7.1 功能矩阵
| 功能 | Gentle-AI | Spec-First | Get-Shit-Done | cc-sdd |
|------|:---------:|:----------:|:-------------:|:------:|
| **多 Agent 支持** | ✅ 5 个 | ❌ 仅 Claude | ✅ 4 个 | ✅ 8 个 |
| **SDD 工作流** | ✅ | ✅ | ✅ | ✅ |
| **持久记忆** | ✅ Engram | ❌ | ❌ | ❌ |
| **技能系统** | ✅ | ✅ | ✅ | ✅ |
| **MCP 配置** | ✅ | ❌ | ❌ | ❌ |
| **状态机** | ❌ | ✅ | ❌ | ❌ |
| **Gate 校验** | ❌ | ✅ | ❌ | ❌ |
| **追溯 ID** | ❌ | ✅ | ❌ | ❌ |
| **覆盖率矩阵** | ❌ | ✅ | ❌ | ❌ |
| **Auto Mode** | ❌ | ❌ | ✅ (GSD-2) | ❌ |
| **成本追踪** | ❌ | ❌ | ✅ (GSD-2) | ❌ |
| **TUI 安装器** | ✅ | ❌ | ❌ | ❌ |
| **回滚支持** | ✅ | ❌ | ❌ | ❌ |
| **Pipeline 引擎** | ✅ | ❌ | ❌ | ❌ |
| **Adapter 模式** | ✅ | ❌ | ❌ | ❌ |

### 7.2 定位差异
| 项目 | 定位 | 核心能力 |
|------|------|---------|
| **Gentle-AI** | 生态系统配置器 | 注入记忆、工作流、技能到多个 Agent |
| **Spec-First** | 规范驱动引擎 | 状态机 + Gate + 追溯体系 |
| **Get-Shit-Done** | Prompt 框架 | 轻量多运行时支持 |
| **cc-sdd** | SDD 框架 | Kiro 风格规范 |

---

## 八、核心优势
### 8.1 架构优势
| 优势 | 说明 |
|------|------|
| ✅ **Adapter 模式** | 新增 Agent 只需实现接口，无需修改组件代码 |
| ✅ **Pipeline 引擎** | 分阶段执行 + 自动回滚，保证安装安全 |
| ✅ **FileMerge** | 无覆盖注入，保护用户内容 |
| ✅ **依赖解析** | 安装前展示完整依赖树，让用户知情 |
| ✅ **跨平台** | macOS / Linux / Windows 原生支持 |
| ✅ **TUI 向导** | Bubbletea 交互式界面，用户体验好 |

### 8.2 生态优势
| 优势 | 说明 |
|------|------|
| ✅ **Engram 集成** | 真正的跨会话持久记忆，这是其他项目没有的 |
| ✅ **5 Agent 支持** | Claude Code, OpenCode, Gemini CLI, Cursor, VS Code |
| ✅ **完整技能库** | SDD + 编码技能 + 共享约定 |
| ✅ **MCP 生态** | Context7 + Engram + 自定义 |

### 8.3 工程实践
| 优势 | 说明 |
|------|------|
| ✅ **260+ 单元测试** | 覆盖所有核心模块 |
| ✅ **78 E2E 测试** | Docker 容器中验证 |
| ✅ **17 黄金文件** | 快照测试保证输出一致性 |
| ✅ **GoReleaser** | 自动化发布流程 |

---

## 九、潜在改进空间
### 9.1 缺失功能
| 功能 | 说明 |
|------|------|
| ❌ **状态机** | 无阶段状态管理，SDD 流程无强制推进 |
| ❌ **Gate 校验** | 无质量门禁，依赖人工判断 |
| ❌ **追溯体系** | 无 ID 体系，无法追踪需求到实现 |
| ❌ **Auto Mode** | 无自动循环执行，每步需手动触发 |
| ❌ **成本追踪** | 无 token/成本追踪 |
| ❌ **覆盖率矩阵** | 无覆盖率指标 |

### 9.2 与 Spec-First 的互补性
| 维度 | Gentle-AI | Spec-First |
|------|:---------:|:----------:|
| **多 Agent** | ✅ 强 | ❌ 弱 (仅 Claude) |
| **持久化** | ✅ 强 (Engram) | ❌ 无 |
| **规范性** | ❌ 无 | ✅ 强 (Gate + 追溯) |
| **自动化** | ❌ 无 | ❌ 无 (但 GSD-2 有) |
| **用户体验** | ✅ 强 (TUI) | ❌ CLI only |

---

## 十、借鉴建议
### 10.1 Spec-First 可借鉴 Gentle-AI (P0)
#### 10.1.1 Adapter 模式
**借鉴价值**: ⭐⭐⭐⭐⭐ (最高)

**当前问题**: Spec-First 仅支持 Claude Code

**Gentle-AI 实现**:
```go
type Adapter interface {
    Agent() model.AgentID
    Detect(ctx context.Context, homeDir string) (installed bool, ...)
    SystemPromptStrategy() model.SystemPromptStrategy
    MCPStrategy() model.MCPStrategy
    SupportsSkills() bool
    SupportsMCP() bool
}
```

**Spec-First 实现建议**:
```typescript
// spec-first/src/core/agents/adapter.ts

export interface AgentAdapter {
  agentId: AgentID;
  detect(): Promise<DetectionResult>;
  systemPromptStrategy(): SystemPromptStrategy;
  skillDir(): string;
  mcpConfigPath(): string;
  supportsSkills(): boolean;
  supportsMCP(): boolean;
}

export class ClaudeCodeAdapter implements AgentAdapter { ... }
export class OpenCodeAdapter implements AgentAdapter { ... }
export class GeminiCLIAdapter implements AgentAdapter { ... }
```

#### 10.1.2 Engram 集成
**借鉴价值**: ⭐⭐⭐⭐⭐

**当前问题**: Spec-First 无跨会话记忆

**Gentle-AI 实现**:
- Engram MCP Server (`mem_save`, `mem_search`, `mem_get_observation`)
- System Prompt 注入 Engram 协议

**Spec-First 实现建议**:
```typescript
// spec-first/src/core/memory/engram-client.ts

export class EngramClient {
  async saveMemory(params: {
    title: string;
    topicKey: string;
    type: string;
    project: string;
    content: string;
  }): Promise<string>;

  async searchMemory(query: string, project: string): Promise<MemorySearchResult[]>;

  async getObservation(id: string): Promise<MemoryObservation>;
}
```

### 10.2 Spec-First 可借鉴 Gentle-AI (P1)
#### 10.2.1 Pipeline 执行引擎
**借鉴点**:
- 分阶段执行 (Prepare → Apply)
- 自动回滚机制
- 进度回调
- 失败策略配置

#### 10.2.2 FileMerge 无覆盖注入
**借鉴点**:
- Markdown 区块标记 `<!-- gentle-ai:ID -->`
- JSON 深度合并
- 保护用户内容
- 原子写入
- 文件存在检查

#### 10.2.3 依赖解析
**借鉴点**:
- 安装前展示完整依赖树
- 版本检测
- 平台差异处理
- 依赖图构建
- 解析顺序

### 10.3 Gentle-AI 可借鉴 Spec-First (P0)
#### 10.3.1 Gate 校验集成
**借鉴点**:
- 19 条 Gate 条件
- Blocking + Warning 分级
- 豁免管理
- PRD 评分

**Gentle-AI 集成建议**:
- 在 Pipeline Apply 阶段增加 Gate 校验步骤
- 校验 SDD 产物完整性
- 提供失败诊断信息

#### 10.3.2 追溯 ID 体系
**借鉴点**:
- 14 类 ID (FR/DS/TASK/TC/RFC/Defect 等)
- 追溯矩阵
- 覆盖率计算

**Gentle-AI 集成建议**:
- 为 SDD 产物分配唯一 ID
- 构建追溯矩阵
- 支持跨产物搜索

---

## 十一、实施计划
### 11.1 阶段 1: Adapter 模式 (1 周)
| 任务 | 预估 |
|------|------|
| 定义 AgentAdapter 接口 | 0.5 天 |
| 实现 ClaudeCodeAdapter (现有功能重构) | 1 天 |
| 编写 Adapter 单元测试 | 0.5 天 |
| 实现 OpenCodeAdapter | 1 天 |
| 实现 GeminiCLIAdapter | 1 天 |
| 集成测试 | 1 天 |

### 11.2 阶段 2: Engram 集成 (1 周)
| 任务 | 预估 |
|------|------|
| 定义 EngramClient 接口 | 0.5 天 |
| 实现 MCP 通信层 | 1 天 |
| 实现基础 CRUD 操作 | 1 天 |
| 集成到 Skill Runtime | 1 天 |
| 集成到 AI Orchestrator | 1 天 |
| 测试 | 1 天 |

### 11.3 阶段 3: Pipeline 增强 (1 周)
| 任务 | 预估 |
|------|------|
| 引入 Pipeline 执行引擎 | 1 天 |
| 实现 FileMerge 模块 | 1 天 |
| 实现回滚机制 | 1 天 |
| 集成到现有命令 | 1 天 |
| 测试 | 1 天 |

---

## 十二、总结
### 12.1 Gentle-AI 核心价值
| 维度 | 评估 |
|------|------|
| **架构设计** | ⭐⭐⭐⭐⭐ Adapter 模式 + Pipeline 引擎 |
| **多 Agent 支持** | ⭐⭐⭐⭐⭐ 5 个主流 Agent |
| **用户体验** | ⭐⭐⭐⭐ TUI + 预设 + 回滚 |
| **SDD 实现** | ⭐⭐⭐⭐ 完整技能体系 |
| **可扩展性** | ⭐⭐⭐⭐⭐ 接口抽象良好 |

### 12.2 与 Spec-First 的关系
```
┌─────────────────────────────────────────────────────────────────────────┐
│                        互补关系                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Gentle-AI                     Spec-First                               │
│  ┌─────────────────┐          ┌─────────────────┐                       │
│  │ 生态系统配置器   │          │  规范驱动引擎   │                       │
│  │                 │          │                 │                       │
│  │  ┌─────────────┐│          │  ┌─────────────┐│                       │
│  │  │ 多 Agent 支持 ││──────────▶│  │ Gate 校验   ││                       │
│  │  │ Engram 记忆   ││──────────▶│  │ 追溯 ID     ││                       │
│  │  │ TUI 向导      ││──────────▶│  │ 状态机     ││                       │
│  │  └─────────────┘│          │  └─────────────┘│                       │
│  │                 │          │                 │                       │
│  └─────────────────┘          └─────────────────┘                       │
│                                                                          │
│  融合后: 生态配置器 + 规范引擎 = 完整的 SDD 解决方案                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 12.3 最终建议
| 用户类型 | 建议 |
|----------|------|
| **需要多 Agent 支持** | 深入借鉴 Gentle-AI 的 Adapter 模式 |
| **需要持久记忆** | 深入借鉴 Gentle-AI 的 Engram 集成 |
| **需要更好的用户体验** | 深入借鉴 Gentle-AI 的 TUI 和 Pipeline |
| **需要规范驱动** | 使用 Spec-First 现有的 Gate + 追溯体系 |

---

*分析完成于 2026-03-15*
*分析团队: Spec-First 技术研发团队*
