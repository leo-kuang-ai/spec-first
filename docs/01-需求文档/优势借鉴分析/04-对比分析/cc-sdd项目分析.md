# cc-sdd 项目分析报告

> **分析日期**: 2026-03-15
> **项目版本**: v2.1.1
> **项目地址**: `/Users/kuang/xiaobu/cc-sdd`

---

## 一、项目概述

### 1.1 定位

**cc-sdd** (Claude Code - Spec-Driven Development) 是一个 **Spec-Driven Development (SDD) 框架**，灵感来源于 Kiro IDE，为 8 种 AI 编码代理提供统一的规范驱动开发工作流。

```
一句话定位: 将 AI 编码代理转化为生产级规范驱动开发工具
```

| 属性 | 值 |
|------|-----|
| **核心价值** | 需求 → 设计 → 任务 → 实现，数小时完成数周工作 |
| **技术栈** | TypeScript + Markdown Templates |
| **安装方式** | `npx cc-sdd@latest` |
| **许可证** | MIT |
| **作者** | Gota |

### 1.2 支持的 AI 代理

| 代理 | 安装命令 | 特点 |
|------|----------|------|
| **Claude Code** | `--claude` | 11 个命令 (默认) |
| **Claude Code Agent** | `--claude-agent` | 12 命令 + 9 子代理 |
| **Cursor** | `--cursor` | IDE 集成 |
| **Gemini CLI** | `--gemini` | Google AI |
| **Codex CLI** | `--codex` | OpenAI |
| **GitHub Copilot** | `--copilot` | 微软 |
| **Qwen Code** | `--qwen` | 阿里 |
| **OpenCode** | `--opencode` | 开源 |
| **OpenCode Agent** | `--opencode-agent` | 12 命令 + 9 子代理 |
| **Windsurf** | `--windsurf` | IDE 集成 |

### 1.3 支持的语言

支持 **13 种语言**：en, ja, zh-TW, zh, es, pt, de, fr, ru, it, ko, ar, el

---

## 二、核心工作流

### 2.1 四阶段开发闭环

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     cc-sdd Spec-Driven 工作流                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /kiro:spec-init ──▶ /kiro:spec-requirements ──▶ /kiro:spec-design ──▶  │
│        │                      │                      │                   │
│        ▼                      ▼                      ▼                   │
│   创建 spec 目录         EARS 格式需求         架构 + Mermaid 图         │
│   spec.json              requirements.md        design.md               │
│                                                                          │
│                              │                                           │
│                              ▼                                           │
│                    /kiro:spec-tasks ──▶ /kiro:spec-impl                  │
│                              │                  │                        │
│                              ▼                  ▼                        │
│                      任务分解 + 依赖        实现执行                      │
│                      tasks.md              代码 + 验证                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 命令体系

| 命令 | 功能 | 产出 |
|------|------|------|
| `/kiro:spec-init` | 初始化规范目录 | `spec.json`, `requirements.md` (初始) |
| `/kiro:spec-requirements` | 生成 EARS 格式需求 | `requirements.md` (完整) |
| `/kiro:spec-design` | 生成技术设计 | `design.md` |
| `/kiro:spec-tasks` | 分解实现任务 | `tasks.md` |
| `/kiro:spec-impl` | 执行实现 | 代码 + 验证 |
| `/kiro:spec-status` | 查看规范状态 | 状态报告 |
| `/kiro:steering` | 项目记忆管理 | `steering/*.md` |
| `/kiro:steering-custom` | 自定义 steering | 自定义文件 |
| `/kiro:validate-gap` | 差距分析 (Brownfield) | 差距报告 |
| `/kiro:validate-design` | 设计验证 | 验证报告 |
| `/kiro:validate-impl` | 实现验证 | 验证报告 |

---

## 三、目录结构

### 3.1 安装后的项目结构

```
your-project/
├── .kiro/                          # Kiro 工作目录 (可配置)
│   ├── specs/                      # 规范存储
│   │   └── {feature-name}/
│   │       ├── spec.json           # 元数据 + 状态
│   │       ├── requirements.md     # EARS 需求
│   │       ├── design.md           # 技术设计
│   │       └── tasks.md            # 任务分解
│   │
│   ├── steering/                   # 项目记忆 (持久上下文)
│   │   ├── product.md              # 产品愿景
│   │   ├── tech.md                 # 技术栈
│   │   └── structure.md            # 项目结构
│   │
│   └── settings/                   # 自定义配置
│       ├── templates/              # 文档模板
│       │   └── specs/
│       │       ├── init.json
│       │       ├── requirements.md
│       │       ├── requirements-init.md
│       │       ├── design.md
│       │       └── tasks.md
│       └── rules/                  # 生成规则
│           ├── ears-format.md      # EARS 语法
│           └── steering-principles.md
```

### 3.2 cc-sdd 包结构

```
cc-sdd/
├── tools/cc-sdd/                   # NPM 包
│   ├── src/                        # TypeScript 源码
│   │   ├── plan/                   # 规划逻辑
│   │   ├── manifest/               # 清单处理
│   │   ├── template/               # 模板引擎
│   │   └── constants/              # 常量定义
│   │
│   ├── templates/                  # 模板库
│   │   ├── agents/                 # 各代理模板
│   │   │   ├── claude-code/        # Claude Code
│   │   │   ├── claude-code-agent/  # Claude 子代理
│   │   │   ├── cursor/
│   │   │   ├── gemini-cli/
│   │   │   └── ...
│   │   ├── manifests/              # 安装清单
│   │   └── shared/                 # 共享资源
│   │       └── settings/
│   │           ├── rules/          # 生成规则
│   │           └── templates/      # 文档模板
│   │
│   └── package.json
│
└── docs/                           # 文档
    ├── guides/                     # 使用指南
    └── README/                     # README 片段
```

---

## 四、核心特性

### 4.1 EARS 格式需求

**EARS** (Easy Approach to Requirements Syntax) 是一种结构化需求格式：

```markdown
## Requirement 1: User Authentication

**As a** user
**I want to** log in with email and password
**So that** I can access my personal dashboard

### Acceptance Criteria
- **Given** a registered user with valid credentials
- **When** they submit the login form
- **Then** the system shall create a session and redirect to dashboard
- **And** the system shall display a welcome message
```

### 4.2 Steering (项目记忆)

Steering 是 cc-sdd 的 **持久上下文系统**：

| 文件 | 内容 | 作用 |
|------|------|------|
| `product.md` | 产品愿景、核心能力 | 确保 AI 理解产品方向 |
| `tech.md` | 技术栈、框架决策 | 指导技术选择 |
| `structure.md` | 项目结构、命名规范 | 保持代码一致性 |

**关键原则**:
> "如果新代码遵循现有模式，steering 不需要更新"

### 4.3 多代理支持架构

```
                    cc-sdd 安装器
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   Claude Code       Cursor IDE       Gemini CLI
        │                 │                 │
        ▼                 ▼                 ▼
~/.claude/commands  .cursor/rules   ~/.gemini/
   /kiro:*.md        kiro-*.md       commands/
```

**统一工作流，不同实现**：
- Claude Code: slash commands (`.md`)
- Cursor: rules files
- Gemini: commands
- Codex: skills

### 4.4 子代理模式

**Claude Code Agent** 和 **OpenCode Agent** 支持 **9 个专用子代理**：

| 子代理 | 功能 |
|--------|------|
| `spec-requirements` | 需求生成专家 |
| `spec-design` | 架构设计专家 |
| `spec-tasks` | 任务分解专家 |
| `spec-impl` | 实现执行专家 |
| `steering` | 项目记忆专家 |
| `steering-custom` | 自定义记忆 |
| `validate-gap` | 差距分析 |
| `validate-design` | 设计验证 |
| `validate-impl` | 实现验证 |

---

## 五、与 Spec-First 的对比

### 5.1 相似点

| 维度 | cc-sdd | Spec-First |
|------|--------|------------|
| **核心理念** | Spec-Driven Development | Spec-First 开发 |
| **阶段划分** | Requirements → Design → Tasks → Impl | Specify → Design → Plan → Implement |
| **持久上下文** | Steering (`.kiro/steering/`) | Meta 层 + 规范产物 |
| **多代理支持** | 8 种 AI 代理 | 内置 Agent 系统 |
| **可追溯性** | spec.json 元数据 | 追溯 ID 体系 |
| **Gate 机制** | validate-* 命令 | Gate Engine |

### 5.2 差异点

| 维度 | cc-sdd | Spec-First |
|------|--------|------------|
| **定位** | 通用 SDD 框架 | 项目管理 CLI |
| **状态管理** | 文件元数据 (JSON) | 状态机 + Stage 推进 |
| **覆盖率** | 无 | C3/C4/C6/C8/C9 矩阵 |
| **自动化** | 手动推进命令 | 可自动循环 |
| **成本追踪** | 无 | 有 |
| **崩溃恢复** | 无 | 有 |
| **模板定制** | settings/templates/ | Handlebars 模板 |
| **规则定制** | settings/rules/ | Gate 条件 + Skill |

### 5.3 架构对比

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          架构对比                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  cc-sdd                              Spec-First                          │
│  ┌─────────────────────┐            ┌─────────────────────┐             │
│  │   npx cc-sdd        │            │   spec-first CLI    │             │
│  │   (安装器)          │            │   (运行时引擎)       │             │
│  └──────────┬──────────┘            └──────────┬──────────┘             │
│             │                                  │                         │
│             ▼                                  ▼                         │
│  ┌─────────────────────┐            ┌─────────────────────┐             │
│  │  Markdown Commands  │            │  TypeScript Core    │             │
│  │  + Steering Files   │            │  + State Machine    │             │
│  └─────────────────────┘            └─────────────────────┘             │
│                                                                          │
│  特点: 轻量、可定制、多代理           特点: 完整、自动化、可追溯          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 六、借鉴价值

### 6.1 高价值特性 (P0)

| 特性 | 描述 | 借鉴方式 |
|------|------|----------|
| **Steering 系统** | 持久项目记忆 | 参考 `.kiro/steering/` 设计 |
| **EARS 需求格式** | 结构化需求语法 | 集成到 spec 阶段 |
| **多代理统一工作流** | 8 种代理同一流程 | 考虑支持更多运行时 |
| **settings/rules/** | 可定制生成规则 | 参考规则组织方式 |

### 6.2 中价值特性 (P1)

| 特性 | 描述 | 借鉴方式 |
|------|------|----------|
| **validate-gap** | Brownfield 差距分析 | 增强 catchup 功能 |
| **子代理专家** | 专用任务代理 | 参考子代理设计 |
| **多语言支持** | 13 种语言输出 | 国际化考虑 |

### 6.3 低价值特性 (P2)

| 特性 | 原因 |
|------|------|
| **手动命令推进** | Spec-First 已有自动循环 |
| **简单元数据** | Spec-First 已有完整追溯体系 |

---

## 七、Steering 系统详解

### 7.1 Steering 文件结构

**product.md**:
```markdown
# Product Vision

## Purpose
[产品核心目的]

## Value Proposition
[价值主张]

## Core Capabilities
- [核心能力 1]
- [核心能力 2]
```

**tech.md**:
```markdown
# Technology Stack

## Framework
- Frontend: [框架]
- Backend: [框架]

## Key Decisions
- [技术决策 1]: [原因]
- [技术决策 2]: [原因]

## Conventions
- [编码规范]
```

**structure.md**:
```markdown
# Project Structure

## Organization Pattern
[组织模式描述]

## Key Directories
- `src/`: [用途]
- `tests/`: [用途]

## Naming Conventions
- [命名规范]
```

### 7.2 Steering 原则

1. **模式优先**: 记录模式而非穷举列表
2. **增量更新**: 添加而非替换
3. **用户保护**: 用户自定义内容不可变
4. **安全边界**: 永不包含密钥/密码

---

## 八、安装与使用

### 8.1 安装

```bash
# 基础安装 (Claude Code)
npx cc-sdd@latest --claude --lang en

# 子代理模式
npx cc-sdd@latest --claude-agent --lang en

# 自定义目录
npx cc-sdd@latest --kiro-dir docs
```

### 8.2 典型工作流

```bash
# 1. 初始化项目记忆 (Brownfield)
/kiro:steering

# 2. 创建新功能规范
/kiro:spec-init Photo albums with upload, tagging, and sharing

# 3. 生成需求
/kiro:spec-requirements photo-albums-en

# 4. (可选) 差距分析
/kiro:validate-gap photo-albums-en

# 5. 生成设计
/kiro:spec-design photo-albums-en -y

# 6. (可选) 验证设计
/kiro:validate-design photo-albums-en

# 7. 分解任务
/kiro:spec-tasks photo-albums-en -y

# 8. 实现
/kiro:spec-impl photo-albums-en
```

---

## 九、总结

### 9.1 项目特点

| 优点 | 说明 |
|------|------|
| ✅ 轻量级 | 仅 Markdown 命令 + 模板 |
| ✅ 多代理支持 | 8 种 AI 代理统一工作流 |
| ✅ 高度可定制 | templates/ + rules/ 可完全自定义 |
| ✅ Kiro 兼容 | 与 Kiro IDE 规范格式兼容 |
| ✅ 国际化 | 13 种语言支持 |

| 局限 | 说明 |
|------|------|
| ⚠️ 手动推进 | 无自动循环执行 |
| ⚠️ 无成本追踪 | 不追踪 Token/成本 |
| ⚠️ 无崩溃恢复 | 依赖宿主 AI 会话 |
| ⚠️ 简单状态 | 无复杂状态机 |

### 9.2 与 Spec-First 的关系

```
cc-sdd = Spec-First 的"轻量替代方案"
         ↓
适合: 快速上手、多代理场景、轻量需求
         ↓
Spec-First 适合: 完整项目管理、自动化需求、可追溯需求
```

### 9.3 核心借鉴建议

1. **Steering 系统** → 增强项目记忆层
2. **EARS 格式** → 集成到需求阶段
3. **多代理策略** → 考虑支持更多运行时
4. **settings 架构** → 参考模板/规则分离设计

---

*分析完成于 2026-03-15*
