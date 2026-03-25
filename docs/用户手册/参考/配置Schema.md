# 配置 Schema

本文档详细介绍 `.spec-first/` 目录的结构和各配置文件的说明。

## 目录

- [目录结构](#目录结构)
- [配置文件详解](#配置文件详解)
  - [config.yaml](#configyaml)
  - [workflow.md](#workflowmd)
  - [.version](#version)
  - [worktree.yaml](#worktreeyaml)
  - [.gitignore](#gitignore)
- [平台配置文件](#平台配置文件)
- [用户数据目录](#用户数据目录)
- [配置最佳实践](#配置最佳实践)

---

## 目录结构

```
.spec-first/
├── .developer           # 开发者身份文件（gitignored）
├── .version             # 当前安装的 spec-first 版本
├── .gitignore           # spec-first 目录的 gitignore 规则
├── .template-hashes.json # 模板文件哈希（用于更新检测）
├── config.yaml          # 项目级配置
├── workflow.md          # 开发工作流指南
├── worktree.yaml        # Worktree 配置
├── hooks/               # Hook 脚本
├── scripts/             # Python 工具脚本
│   ├── __init__.py
│   ├── common/          # 共享工具
│   ├── multi_agent/     # 多智能体脚本
│   ├── init_developer.py
│   ├── get_developer.py
│   ├── task.py
│   ├── get_context.py
│   └── add_session.py
├── workspace/           # 开发者工作空间
│   ├── index.md         # 工作空间总索引
│   └── {developer}/
│       ├── index.md     # 该开发者的会话索引
│       ├── journal-1.md
│       └── journal-N.md
├── tasks/               # 任务跟踪
│   ├── {MM}-{DD}-{name}/
│   │   └── task.json
│   └── archive/
└── spec/                # 开发规范（必须阅读）
    ├── frontend/
    ├── backend/
    └── guides/
```

---

## 配置文件详解

### config.yaml

项目级配置文件，包含会话记录、任务生命周期钩子、monorepo 包等设置。

#### 完整配置示例

```yaml
# spec-first Configuration
# spec-first 工作流系统的项目级设置
#
# 所有值都有合理的默认值，只需覆盖需要的配置。

#-------------------------------------------------------------------------------
# Session Recording（会话记录）
#-------------------------------------------------------------------------------

# 自动提交 journal/index 变更时使用的提交消息
# 在运行 add_session.py 后执行
session_commit_message: "chore: record journal"

# 每个 journal 文件的最大行数，超过后轮转创建新文件
max_journal_lines: 2000

#-------------------------------------------------------------------------------
# Task Lifecycle Hooks（任务生命周期钩子）
#-------------------------------------------------------------------------------

# 任务生命周期事件后运行的 shell 命令
# 每个钩子接收 TASK_JSON_PATH 环境变量，指向 task.json
# 钩子失败会打印警告，但不会阻止主操作
#
# hooks:
#   after_create:
#     - "echo 'Task created'"
#   after_start:
#     - "echo 'Task started'"
#   after_finish:
#     - "echo 'Task finished'"
#   after_archive:
#     - "echo 'Task archived'"

#-------------------------------------------------------------------------------
# Update Skip（更新跳过）
#-------------------------------------------------------------------------------

# 更新时要跳过的路径（不会被 spec-first update 修改）
# 用于保护自定义的命令或配置
#
# update:
#   skip:
#     - .claude/commands/custom/
#     - .cursor/rules/my-custom-rule.mdc

#-------------------------------------------------------------------------------
# Monorepo / Packages（Monorepo 包）
#-------------------------------------------------------------------------------

# 为 monorepo 项目声明包
# spec-first 在 `spec-first init` 期间自动检测工作区，但也可以
# 在此处手动配置
#
# packages:
#   frontend:
#     path: packages/frontend
#   backend:
#     path: packages/backend
#   docs:
#     path: docs-site
#     type: submodule

# 未指定 --package 时使用的默认包
# default_package: frontend
```

#### 配置字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `session_commit_message` | string | `"chore: record journal"` | 自动提交会话记录的提交消息 |
| `max_journal_lines` | number | `2000` | 单个 journal 文件最大行数 |
| `hooks.after_create` | string[] | `[]` | 任务创建后执行的命令 |
| `hooks.after_start` | string[] | `[]` | 任务开始后执行的命令 |
| `hooks.after_finish` | string[] | `[]` | 任务完成后执行的命令 |
| `hooks.after_archive` | string[] | `[]` | 任务归档后执行的命令 |
| `update.skip` | string[] | `[]` | 更新时跳过的路径列表 |
| `packages` | object | `{}` | Monorepo 包配置 |
| `default_package` | string | - | 默认包名称 |

#### Monorepo 包配置

```yaml
packages:
  frontend:
    path: packages/frontend        # 必填：包的相对路径
    # type: submodule              # 可选：标记为 git submodule
  backend:
    path: packages/backend

default_package: frontend          # 默认操作的包
```

---

### workflow.md

开发工作流指南文档，记录了 spec-first 推荐的开发流程。

#### 主要内容

1. **快速开始** - 初始化开发者身份、获取上下文、阅读规范
2. **工作流概述** - 核心原则和文件系统结构
3. **会话开始流程** - 获取上下文、阅读开发规范、选择任务
4. **开发流程** - 任务开发流程和代码质量检查清单
5. **会话结束** - 一键会话记录和结束检查清单
6. **文件描述** - workspace/、spec/、tasks/ 目录说明
7. **最佳实践** - 应该做的和不应该做的

#### 关键命令速查

```bash
# 获取完整上下文
python3 ./.spec-first/scripts/get_context.py

# 任务管理
python3 ./.spec-first/scripts/task.py list
python3 ./.spec-first/scripts/task.py create "<title>" --slug <name>

# 记录会话
python3 ./.spec-first/scripts/add_session.py --title "Title" --commit "hash"
```

#### 核心原则

| 原则 | 说明 |
|------|------|
| Read Before Write | 开始前理解上下文 |
| Follow Standards | 编码前必须阅读 `.spec-first/spec/` 规范 |
| Incremental Development | 一次完成一个任务 |
| Record Promptly | 完成后立即更新跟踪文件 |
| Document Limits | 每个 journal 文件最多 2000 行 |

---

### .version

记录当前项目安装的 spec-first 版本号。

#### 文件内容示例

```
1.3.0
```

#### 用途

- **版本比较** - CLI 启动时比较项目版本与 CLI 版本
- **更新提醒** - 检测到新版本时提示用户运行 `spec-first update`
- **降级警告** - CLI 版本低于项目版本时提示升级 CLI

#### 版本检查逻辑

| 场景 | CLI 版本 | 项目版本 | 行为 |
|------|----------|----------|------|
| 需要更新 | 1.3.0 | 1.2.0 | 提示运行 `spec-first update` |
| 需要升级 CLI | 1.2.0 | 1.3.0 | 提示运行 `npm install -g @anthropic/spec-first` |
| 版本匹配 | 1.3.0 | 1.3.0 | 无提示 |

---

### worktree.yaml

Git worktree 配置文件，用于多智能体并行开发。

#### 配置示例

```yaml
# Worktree 配置
# 用于管理多个 Git worktree 以支持并行开发

# Worktree 存储目录
worktree_dir: .spec-first/worktrees

# 分支命名前缀
branch_prefix: agent/

# 默认基础分支
base_branch: main
```

---

### .gitignore

spec-first 目录的 gitignore 规则。

#### 默认内容

```gitignore
# Developer identity - per-developer, not committed
.developer

# Workspace data - developer journals
workspace/*/

# Task data
tasks/*/

# Backups
.backup-*

# Current task pointer
current
```

#### 忽略规则说明

| 路径 | 说明 |
|------|------|
| `.developer` | 开发者身份文件，不应提交 |
| `workspace/*/` | 开发者工作空间，个人数据 |
| `tasks/*/` | 任务数据，动态内容 |
| `.backup-*` | 更新前的备份目录 |
| `current` | 当前任务指针（符号链接） |

---

## 平台配置文件

根据初始化时选择的平台，会生成相应的配置文件：

### Claude Code

```
.claude/
├── settings.json        # Claude Code 设置
├── commands/            # 斜杠命令
│   └── spec/            # spec-first 命令
└── hooks/               # Hook 脚本
```

### Cursor

```
.cursor/
├── rules/               # Cursor 规则
│   └── spec-first.mdc   # spec-first 规则
└── commands/            # 命令（如果支持）
```

### Codex

```
.agents/
└── skills/              # 共享 skills 层

.codex/
└── AGENTS.md            # Codex 专用配置
```

### iFlow CLI

```
.iflow/
├── commands/            # iFlow 命令
└── settings.json        # iFlow 设置
```

### OpenCode

```
.opencode/
└── lib/
    └── spec-first-context.js  # spec-first 上下文
```

---

## 用户数据目录

以下目录包含用户数据，**永远不会被 `spec-first update` 修改**：

| 目录 | 说明 | 保护原因 |
|------|------|----------|
| `workspace/` | 开发者工作空间 | 个人会话索引与日志 |
| `tasks/` | 任务跟踪 | 项目任务数据 |
| `spec/` | 开发规范 | 自定义项目规范 |
| `.developer` | 开发者身份 | 个人配置 |

---

## 配置最佳实践

### 1. 会话记录配置

```yaml
# 推荐配置
session_commit_message: "docs: update session journal"
max_journal_lines: 2000  # 保持默认，避免单个文件过大
```

### 2. 任务钩子配置

```yaml
# 示例：任务完成后运行测试
hooks:
  after_finish:
    - "npm test"
    - "npm run lint"
```

### 3. 更新跳过配置

```yaml
# 保护自定义命令不被更新覆盖
update:
  skip:
    - .claude/commands/custom/
    - .cursor/rules/project-specific.mdc
```

### 4. Monorepo 配置

```yaml
# 明确声明所有包
packages:
  web:
    path: packages/web
  api:
    path: packages/api
  shared:
    path: packages/shared

# 设置默认包
default_package: web
```

---

## 相关文档

- [命令参考](../使用指南/命令参考.md) - CLI 命令详细说明
- [用户手册](../用户手册.md) - 完整使用指南
- [快速参考](../快速参考.md) - 常用命令速查
