## OpenClaw 项目 .md 文件体系梳理

OpenClaw 采用 **Markdown-First** 架构设计，几乎所有配置、记忆、技能和文档都以 `.md` 文件形式存在。整个体系可分为**项目文档层**、**工作空间层**和**技能层**三大层级。

---

### 一、项目文档层（Repository Docs）

位于官方仓库 `github.com/openclaw/openclaw` 的 `docs/` 目录，提供完整的技术参考：

| 文件/目录 | 用途说明 |
|-----------|----------|
| `docs/index.md` | 文档入口导航，链接所有子文档 |
| `docs/architecture.md` | 系统架构详解（Gateway → Channels → Agent → Tools） |
| `docs/configuration.md` | 完整配置参考（所有配置项和示例） |
| `docs/operations.md` | 运维手册（启动、停止、监控、故障排查） |
| `docs/gateway/` | Gateway 相关文档子目录 |
| `docs/platforms/` | 各平台指南（macOS、Linux、Windows WSL2、iOS、Android） |
| `docs/security.md` | 安全指南（Credential 存储、暴露面控制） |
| `CHANGELOG.md` | 版本更新日志（日期版本号格式：2026.1.29） |
| `README.md` | 项目主介绍（快速开始、功能概览） |
| `CONTRIBUTING.md` | 贡献指南（代码规范、PR 流程） |

---

### 二、工作空间层（Agent Workspace）

位于用户目录 `~/.openclaw/workspace/`，是 Agent 的"大脑"和记忆存储区，**每次对话都会读取这些文件**：

#### 2.1 核心身份文件（每次会话必载）

| 文件 | 功能描述 | 加载时机 |
|------|----------|----------|
| `AGENTS.md` | Agent 操作指令、行为规则、记忆工作流程 | 每次会话启动 |
| `SOUL.md` | 人格核心（Persona）、语气、伦理边界、价值观 | 每次会话启动 |
| `USER.md` | 用户画像（姓名、偏好、沟通风格） | 每次会话启动 |
| `IDENTITY.md` | Agent 自我认知（名称、形象、Emoji） | 首次启动/更新时 |

#### 2.2 工具与配置文件

| 文件 | 功能描述 |
|------|----------|
| `TOOLS.md` | 本地工具使用笔记（非权限控制，仅指导） |
| `HEARTBEAT.md` | 定时任务清单（心跳机制执行的任务） |
| `BOOT.md` | 网关重启时的启动检查清单 |
| `BOOTSTRAP.md` | 首次运行仪式（一次性，完成后可删除） |
| `SHIELD.md` | 安全策略文件（威胁响应规则，v0 版本） |

#### 2.3 记忆系统文件

| 文件/目录 | 功能描述 |
|-----------|----------|
| `MEMORY.md` | 精选长期记忆（仅主会话读取，群组/共享会话不读） |
| `memory/YYYY-MM-DD.md` | 每日日志（按日期存储的短期记忆） |
| `memory/` | 每日记忆文件目录 |

#### 2.4 其他工作空间内容

| 目录 | 用途 |
|------|------|
| `skills/` | 工作空间级技能（优先级最高，覆盖全局/捆绑技能） |
| `canvas/` | Canvas UI 文件（如 `canvas/index.html`） |

---

### 三、技能层（Skills）

Skills 是 OpenClaw 的能力扩展单元，遵循 **AgentSkills 开放标准**（Anthropic 制定，Claude Code、Cursor、GitHub Copilot 等共用）。

#### 3.1 技能文件结构

每个 Skill 是一个文件夹，最小仅需 `SKILL.md`：

```
my-skill/
├── SKILL.md              # 必需：YAML frontmatter + 使用说明
├── scripts/              # 可选：可执行脚本（Python/Bash/JS 等）
├── references/           # 可选：按需加载的参考文档
└── assets/               # 可选：模板、图片、配置文件
```

#### 3.2 SKILL.md 格式规范

```yaml
---
name: skill-name          # 必需：1-64字符，小写+连字符，唯一标识
description: 描述内容      # 必需：1-1024字符，触发技能的主要依据
license: MIT              # 可选：开源协议
allowed-tools: Bash(git:*) Read  # 可选：允许的工具权限（OpenClaw 扩展）
requires:                 # 可选：依赖声明
  bins:
    - git                 # 必需的二进制命令
  env:
    - GITHUB_TOKEN        # 必需的环境变量
  config:
    - gitUser             # 必需的配置项
os:                       # 可选：支持的操作系统
  - linux
  - darwin
metadata:                 # 可选：扩展元数据（JSON 格式字符串）
  openclaw:
    emoji: "🛠️"
    requires:
      bins: ["curl"]
---

# Skill 标题

## 使用说明
- 当用户提及 XXX 时触发此技能
- 执行步骤 1、2、3...

## 脚本引用
参见 `scripts/helper.py` 实现细节
```

#### 3.3 技能加载优先级

OpenClaw 按以下顺序扫描 Skill，**后加载的覆盖先加载的**：

1. `<workspace>/skills/` — 工作空间级（最高优先级，适合开发测试）
2. `~/.openclaw/skills/` — 用户全局级（通过 `npx clawhub` 安装）
3. 捆绑技能（Bundled）— 随 OpenClaw 分发（最低优先级）

#### 3.4 官方与社区技能源

| 来源 | 安装方式 | 说明 |
|------|----------|------|
| ClawHub 官方仓库 | `npx clawhub@latest install <skill-slug>` | 官方审核的技能市场 |
| GitHub 仓库 | 直接粘贴 GitHub URL 给 Agent | 自动克隆、验证、安装 |
| 本地开发 | 复制到 `~/.openclaw/skills/` 或 `<workspace>/skills/` | 手动管理 |

---

### 四、文件体系架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw .md 文件体系                      │
├─────────────────────────────────────────────────────────────┤
│  第一层：项目文档层 (Repository)                               │
│  ├── docs/index.md          # 文档导航                        │
│  ├── docs/architecture.md   # 架构详解                        │
│  ├── docs/configuration.md  # 配置参考                        │
│  ├── docs/security.md       # 安全指南                        │
│  ├── CHANGELOG.md           # 版本日志                        │
│  └── README.md              # 项目介绍                        │
├─────────────────────────────────────────────────────────────┤
│  第二层：工作空间层 (~/.openclaw/workspace/)                  │
│  ├── 核心身份文件                                            │
│  │   ├── AGENTS.md          # 操作指令                        │
│  │   ├── SOUL.md            # 人格核心                        │
│  │   ├── USER.md            # 用户画像                        │
│  │   └── IDENTITY.md        # 自我认知                        │
│  ├── 工具配置                                                │
│  │   ├── TOOLS.md           # 工具笔记                        │
│  │   ├── HEARTBEAT.md       # 定时任务                        │
│  │   ├── BOOT.md            # 启动检查                        │
│  │   └── SHIELD.md          # 安全策略                        │
│  ├── 记忆系统                                                │
│  │   ├── MEMORY.md          # 长期记忆                        │
│  │   └── memory/YYYY-MM-DD.md # 每日日志                      │
│  └── skills/                # 工作空间技能（最高优先级）        │
├─────────────────────────────────────────────────────────────┤
│  第三层：技能层 (Skills)                                      │
│  └── <skill-name>/                                          │
│      ├── SKILL.md           # 技能定义（YAML frontmatter）     │
│      ├── scripts/           # 可执行脚本                      │
│      ├── references/        # 参考文档                        │
│      └── assets/            # 资源文件                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 五、关键设计特点

1. **纯文本优先**：所有状态、记忆、配置均为 Markdown，人类可读、可编辑、可版本控制
2. **注入式上下文**：`AGENTS.md`、`SOUL.md` 等文件内容被注入到每次会话的系统提示中
3. **分层覆盖机制**：工作空间 > 用户目录 > 捆绑包，便于开发和自定义
4. **跨平台标准**：`SKILL.md` 遵循 AgentSkills 规范，可在 Claude Code、Cursor 等工具间复用
5. **安全透明**：`SHIELD.md` 提供策略层防护，所有技能代码可见可审计