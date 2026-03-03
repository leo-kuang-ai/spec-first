---
last_updated: 2026-03-03
mode: deep
project_type: backend
api_type: CLI
---

# spec-first CLI 命令文档

## 概述

spec-first 是一个规范驱动的开发流程引擎，提供 19 个 CLI 命令用于全链路研发闭环管理。所有命令通过 `src/cli/index.ts` 注册，由 `src/cli/router.ts` 统一分发。

- 命令注册共 19 个 (`src/cli/index.ts:27-45` — `registerCommand('id', ...)` 到 `registerCommand('analyze', ...)` — [代码证据])
- 命令处理器签名统一为 `(args: string[]) => Promise<number> | number` (`src/cli/router.ts:11` — `CommandHandler` 类型定义 — [代码证据])
- 退出码使用 `ExitCode` 枚举 (`src/shared/types.ts` — [类型定义证据])

## 核心 CLI 命令

### id

**描述**: 追溯 ID 生成、校验与检索

**用法**: `spec-first id <subcommand> [options]`

**子命令**:

| 子命令 | 描述 | 用法 |
|--------|------|------|
| `next` | 生成下一个 ID | `spec-first id next <type> <abbr> --feature <featureId> [--level <UT\|IT\|E2E\|ST>]` |
| `validate` | 校验 ID 格式 | `spec-first id validate <id>` |
| `search` | 按关键字搜索 ID | `spec-first id search <query> --feature <featureId> [--type <type>]` |
| `list` | 列出全部 ID | `spec-first id list --feature <featureId> [--type <type>]` |

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<type>` | string | 是 | ID 类型：FR, DS, TASK, TC, RFC, REQ, SYS, ARCH, MOD, ATP, STP, ITP, UTP |
| `<abbr>` | string | 是 | FEAT 缩写（如 AUTH） |
| `--feature` | string | 是 | Feature ID |
| `--level` | string | 否 | 测试级别：UT, IT, E2E, ST（仅 TC 类型） |
| `--type` | string | 否 | 筛选类型：FR, DS, TASK, TC, RFC, Feature |

**示例**:
```bash
# 生成功能需求 ID
spec-first id next FR AUTH --feature FSREQ-AUTH-001

# 生成测试用例 ID
spec-first id next TC AUTH --feature FSREQ-AUTH-001 --level UT

# 校验 ID 格式
spec-first id validate FR-AUTH-001

# 搜索包含 "login" 的 ID
spec-first id search login --feature FSREQ-AUTH-001
```

**证据源**:
- 子命令定义 (`src/cli/commands/id.ts:26-39` — `switch (sub)` 分支 — [代码证据])
- 有效类型常量 (`src/cli/commands/id.ts:13-15` — `VALID_NEXT_TYPES` — [代码证据])

---

### matrix

**描述**: 同步追踪矩阵

**用法**: `spec-first matrix <subcommand> [options]`

**子命令**:

| 子命令 | 描述 | 用法 |
|--------|------|------|
| `check` | 检查矩阵完整性 | `spec-first matrix check <featureId>` |
| `export` | 导出矩阵 | `spec-first matrix export <featureId> [--format markdown\|yaml]` |
| `update` | 更新矩阵条目 | `spec-first matrix update <featureId> <id> [--status <status>] [--title <title>] [--upstream <ids>] [--downstream <ids>]` |

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<featureId>` | string | 是 | Feature ID |
| `--format` | string | 否 | 导出格式：markdown（默认）或 yaml |
| `--status` | string | 否 | 更新状态 |
| `--title` | string | 否 | 更新标题 |
| `--upstream` | string | 否 | 上游 ID 列表（逗号分隔） |
| `--downstream` | string | 否 | 下游 ID 列表（逗号分隔） |

**示例**:
```bash
# 检查矩阵
spec-first matrix check FSREQ-AUTH-001

# 导出为 YAML
spec-first matrix export FSREQ-AUTH-001 --format yaml

# 更新条目
spec-first matrix update FSREQ-AUTH-001 FR-AUTH-001 --status done
```

**证据源**:
- 子命令定义 (`src/cli/commands/matrix.ts:8-21` — `switch (sub)` 分支 — [代码证据])

---

### init

**描述**: 初始化 Feature 工作区

**用法**: `spec-first init [options]`

**交互模式**: 无参数时进入交互式引导

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `--feat` | string | 是 | FEAT 缩写（必须匹配 `^[A-Z][A-Z0-9]{0,15}$`） |
| `--mode` | string | 是 | 开发模式：N（新功能）或 I（增量迭代） |
| `--size` | string | 是 | 规模：S, M, L |
| `--platforms` | string | 是 | 平台列表（逗号分隔），来自 `.spec-first/layer2/*.yaml` |
| `--title` | string | 否 | Feature 标题（默认使用 --feat） |
| `--feature-id` | string | 否 | 指定 Feature ID（默认自动生成） |
| `--bootstrap` | boolean | 否 | 执行宿主环境自修复 |

**示例**:
```bash
# 命令行模式
spec-first init --feat AUTH --mode N --size M --platforms h5,api

# 交互模式
spec-first init

# 指定 Feature ID
spec-first init --feat AUTH --mode N --size M --platforms h5 --feature-id FSREQ-AUTH-001
```

**证据源**:
- 参数解析 (`src/cli/commands/init.ts:40-49` — `parseInitCliInput` — [代码证据])
- 有效模式常量 (`src/cli/commands/init.ts:19-20` — `VALID_MODES`, `VALID_SIZES` — [代码证据])

---

### stage

**描述**: 阶段流转管理（current/advance/cancel）

**用法**: `spec-first stage <subcommand> [options]`

**子命令**:

| 子命令 | 描述 | 用法 |
|--------|------|------|
| `current` | 查看当前阶段 | `spec-first stage current <featureId>` |
| `advance` | 推进到下一阶段 | `spec-first stage advance <featureId> [--force]` |
| `cancel` | 取消 Feature | `spec-first stage cancel <featureId> --reason "<reason>"` |

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<featureId>` | string | 是 | Feature ID |
| `--force` | boolean | 否 | 强制推进（跳过 Gate 检查） |
| `--reason` | string | 是 | 取消原因（cancel 子命令必填） |

**示例**:
```bash
# 查看当前阶段
spec-first stage current FSREQ-AUTH-001

# 推进阶段
spec-first stage advance FSREQ-AUTH-001

# 强制推进
spec-first stage advance FSREQ-AUTH-001 --force

# 取消 Feature
spec-first stage cancel FSREQ-AUTH-001 --reason "需求变更"
```

**证据源**:
- 子命令定义 (`src/cli/commands/stage.ts:14-27` — `switch (sub)` 分支 — [代码证据])
- 强制模式处理 (`src/cli/commands/stage.ts:108` — `args.includes('--force')` — [代码证据])

---

### rfc

**描述**: RFC 变更请求与状态管理

**用法**: `spec-first rfc <subcommand> [options]`

**子命令**:

| 子命令 | 描述 | 用法 |
|--------|------|------|
| `create` | 创建 RFC | `spec-first rfc create <featureId> --title "<title>" [--level <Minor\|Major\|Critical>] [--by <by>]` |
| `submit` | 提交 RFC | `spec-first rfc submit <rfcId> --feature <featureId>` |
| `transition` | 流转 RFC 状态 | `spec-first rfc transition <rfcId> <status> --feature <featureId>` |
| `list` | 列出 RFC | `spec-first rfc list <featureId>` |
| `get` | 查看 RFC 详情 | `spec-first rfc get <rfcId> --feature <featureId>` |

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<featureId>` | string | 是 | Feature ID |
| `--title` | string | 是 | RFC 标题 |
| `--level` | string | 否 | 变更级别：Minor, Major, Critical |
| `--by` | string | 否 | 创建者（默认 cli） |
| `--motivation` | string | 否 | 变更动机 |
| `--description` | string | 否 | 详细描述 |
| `<status>` | string | 是 | 目标状态：draft, approved, closed, rejected |

**示例**:
```bash
# 创建 RFC
spec-first rfc create FSREQ-AUTH-001 --title "重构登录流程" --level Major

# 提交审批
spec-first rfc submit RFC-AUTH-001 --feature FSREQ-AUTH-001

# 流转状态
spec-first rfc transition RFC-AUTH-001 approved --feature FSREQ-AUTH-001

# 查看列表
spec-first rfc list FSREQ-AUTH-001
```

**证据源**:
- 子命令定义 (`src/cli/commands/rfc.ts:13-28` — `switch (sub)` 分支 — [代码证据])
- 有效状态常量 (`src/cli/commands/rfc.ts:10-11` — `VALID_LEVELS`, `VALID_STATUSES` — [代码证据])

---

### defect

**描述**: 缺陷跟踪与状态管理

**用法**: `spec-first defect <subcommand> [options]`

**子命令**:

| 子命令 | 描述 | 用法 |
|--------|------|------|
| `register` | 登记新缺陷 | `spec-first defect register <featureId> --severity <S1\|S2\|S3\|S4> --title "<title>" [--reporter "<name>"]` |
| `update` | 变更缺陷状态 | `spec-first defect update <featureId> <seq> --status <status>` |
| `list` | 列出缺陷 | `spec-first defect list <featureId> [--status <status>] [--severity <severity>]` |
| `get` | 查看缺陷详情 | `spec-first defect get <featureId> <seq>` |
| `escape-rate` | 计算缺陷逃逸率 | `spec-first defect escape-rate <featureId>` |

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<featureId>` | string | 是 | Feature ID |
| `<seq>` | number | 是 | 缺陷序号 |
| `--severity` | string | 是 | 严重级别：S1, S2, S3, S4 |
| `--title` | string | 是 | 缺陷标题 |
| `--reporter` | string | 否 | 报告人（默认 cli） |
| `--description` | string | 否 | 详细描述 |
| `--status` | string | 是 | 状态：open, fixing, fixed, verified, wontfix |
| `--discovered-in` | string | 否 | 发现阶段 |
| `--linked-fr` | string | 否 | 关联的功能需求 ID |

**示例**:
```bash
# 登记缺陷
spec-first defect register FSREQ-AUTH-001 --severity S2 --title "登录超时未处理"

# 更新状态
spec-first defect update FSREQ-AUTH-001 1 --status fixing

# 查看列表
spec-first defect list FSREQ-AUTH-001 --status open

# 查看逃逸率
spec-first defect escape-rate FSREQ-AUTH-001
```

**证据源**:
- 子命令定义 (`src/cli/commands/defect.ts:19-34` — `switch (sub)` 分支 — [代码证据])
- 有效严重级别常量 (`src/cli/commands/defect.ts:16-17` — `VALID_SEVERITIES`, `VALID_STATUSES` — [代码证据])

---

### metrics

**描述**: 覆盖率度量与健康评分

**用法**: `spec-first metrics <subcommand> [options]`

**子命令**:

| 子命令 | 描述 | 用法 |
|--------|------|------|
| `coverage` | 展示 C1-C9 覆盖率 | `spec-first metrics coverage <featureId>` |
| `report` | 生成完整度量报告 | `spec-first metrics report <featureId>` |
| `health` | 展示健康分与关键风险 | `spec-first metrics health <featureId>` |

**C1-C9 指标定义** (`src/cli/commands/metrics.ts:13-23` — `METRIC_DEFS` — [代码证据]):

| 指标 | 名称 | 目标值 |
|------|------|--------|
| C1 | 设计覆盖率 | 80% |
| C2 | API 覆盖率 | 80% |
| C3 | 任务覆盖率 | 80% |
| C4 | 测试覆盖率 (FR) | 80% |
| C5 | 测试覆盖率 (AC) | 60% |
| C6 | 实现覆盖率 | 80% |
| C7 | PR 合规率 | 90% |
| C8 | 任务合规率 | 80% |
| C9 | TC 合规率 | 80% |

**示例**:
```bash
# 查看覆盖率
spec-first metrics coverage FSREQ-AUTH-001

# 生成完整报告
spec-first metrics report FSREQ-AUTH-001

# 查看健康分
spec-first metrics health FSREQ-AUTH-001
```

**证据源**:
- 子命令定义 (`src/cli/commands/metrics.ts:25-38` — `switch (sub)` 分支 — [代码证据])

---

### doctor

**描述**: 环境诊断与修复

**用法**: `spec-first doctor [featureId]`

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<featureId>` | string | 否 | Feature ID（提供时增加 Feature 级检查） |

**检查项目**:
- Node.js 版本（>= 20）
- Git 安装
- `.spec-first/` 目录
- `specs/` 目录
- `config.yaml` 配置
- Git Hooks 状态
- Session Hook 可达性
- Gate 降级状态
- 运行态文件容量（>500 行提示归档）

**示例**:
```bash
# 项目级诊断
spec-first doctor

# Feature 级诊断
spec-first doctor FSREQ-AUTH-001
```

**证据源**:
- 检查函数定义 (`src/cli/commands/doctor.ts:76-309` — 各 `check*` 函数 — [代码证据])

---

### gate

**描述**: 阶段质量门禁评估

**用法**: `spec-first gate <subcommand> [options]`

**子命令**:

| 子命令 | 描述 | 用法 |
|--------|------|------|
| `check` | 校验当前阶段 Gate 条件 | `spec-first gate check <featureId>` |
| `history` | 查看 Gate 评估历史 | `spec-first gate history <featureId>` |
| `conditions` | 列出当前阶段 Gate 条件 | `spec-first gate conditions <featureId>` |

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<featureId>` | string | 是 | Feature ID |

**示例**:
```bash
# 检查 Gate
spec-first gate check FSREQ-AUTH-001

# 查看历史
spec-first gate history FSREQ-AUTH-001

# 查看条件定义
spec-first gate conditions FSREQ-AUTH-001
```

**证据源**:
- 子命令定义 (`src/cli/commands/gate.ts:12-23` — `switch (sub)` 分支 — [代码证据])

---

### golive

**描述**: 上线就绪检查与批准

**用法**: `spec-first golive check <featureId>`

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<featureId>` | string | 是 | Feature ID |

**示例**:
```bash
spec-first golive check FSREQ-AUTH-001
```

**证据源**:
- 命令处理 (`src/cli/commands/gate.ts:25-32` — `handleGoLive` — [代码证据])

---

### ai

**描述**: 会话恢复与上下文摘要

**用法**: `spec-first ai <subcommand> [options]`

**子命令**:

| 子命令 | 描述 | 用法 |
|--------|------|------|
| `context` | 生成上下文包 | `spec-first ai context <featureId> [--full] [--expand <path1,path2>]` |
| `catchup` | 执行 6 步会话恢复 | `spec-first ai catchup <featureId>` |
| `stats` | 查看 AI 调用统计 | `spec-first ai stats <featureId>` |

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<featureId>` | string | 是 | Feature ID |
| `--full` | boolean | 否 | 完整上下文模式 |
| `--expand` | string | 否 | 展开指定文件（逗号分隔路径） |

**示例**:
```bash
# 生成上下文包
spec-first ai context FSREQ-AUTH-001

# 完整模式
spec-first ai context FSREQ-AUTH-001 --full

# 展开特定文件
spec-first ai context FSREQ-AUTH-001 --expand spec.md,design.md

# 会话恢复
spec-first ai catchup FSREQ-AUTH-001

# 查看统计
spec-first ai stats FSREQ-AUTH-001
```

**证据源**:
- 子命令定义 (`src/cli/commands/ai.ts:12-23` — `switch (sub)` 分支 — [代码证据])

---

### commit

**描述**: 规范提交并关联追溯 ID

**用法**: `spec-first commit --message "<msg>" [--task <taskId>]`

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `--message` / `-m` | string | 是 | 提交信息 |
| `--task` | string | 否 | TASK ID（自动推断或手动指定） |

**TASK ID 格式**: `TASK-<ABBR>-<SEQ>`（如 `TASK-AUTH-001`）

**示例**:
```bash
# 基本提交
spec-first commit --message "实现登录功能"

# 关联任务
spec-first commit -m "修复登录超时" --task TASK-AUTH-001
```

**证据源**:
- 命令处理 (`src/cli/commands/commit.ts:14-52` — `handleCommit` — [代码证据])
- TASK ID 格式校验 (`src/cli/commands/commit.ts:75-80` — `isValidTaskId` — [代码证据])

---

### feature

**描述**: Feature 列表、切换与查看

**用法**: `spec-first feature <subcommand> [options]`

**子命令**:

| 子命令 | 描述 | 用法 |
|--------|------|------|
| `list` | 列出所有 Feature | `spec-first feature list` |
| `current` | 查看当前 Feature 详情 | `spec-first feature current` |
| `switch` | 切换当前 Feature | `spec-first feature switch <featureId>` |

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<featureId>` | string | 是 | Feature ID（支持前缀匹配） |

**示例**:
```bash
# 列出所有 Feature
spec-first feature list

# 查看当前 Feature
spec-first feature current

# 切换 Feature
spec-first feature switch FSREQ-AUTH-001
```

**证据源**:
- 子命令定义 (`src/cli/commands/feature.ts:12-25` — `switch (sub)` 分支 — [代码证据])

---

## 配置命令

### setup

**描述**: 注册 Claude Code + Codex Skill 命令（已废弃）

**用法**: `spec-first setup [--global]`

**状态**: 已废弃，请使用 `spec-first update` 替代

**证据源**:
- 废弃声明 (`src/cli/commands/setup.ts:11-15` — `@deprecated` 注释与警告 — [代码证据])

---

### hooks

**描述**: Git Hooks 安装与状态管理

**用法**: `spec-first hooks <subcommand>`

**子命令**:

| 子命令 | 描述 | 用法 |
|--------|------|------|
| `install` | 安装 spec-first Git hooks | `spec-first hooks install` |
| `uninstall` | 卸载 spec-first Git hooks | `spec-first hooks uninstall` |
| `status` | 查看 hooks 安装状态 | `spec-first hooks status` |

**示例**:
```bash
# 安装 hooks
spec-first hooks install

# 查看状态
spec-first hooks status

# 卸载 hooks
spec-first hooks uninstall
```

**证据源**:
- 子命令定义 (`src/cli/commands/hooks.ts:10-24` — `switch (sub)` 分支 — [代码证据])

---

### viewer

**描述**: Stage Viewer 可视化面板

**用法**: `spec-first viewer [subcommand] [options]`

**子命令**:

| 子命令 | 描述 | 用法 |
|--------|------|------|
| `start` | 启动可视化服务（默认） | `spec-first viewer start [options]` |
| `open` | 启动并打开浏览器 | `spec-first viewer open [options]` |
| `url` | 输出可视化地址 | `spec-first viewer url [options]` |

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `--project-root` | string | 否 | 项目根目录（默认当前目录） |
| `--host` | string | 否 | 监听地址（默认 127.0.0.1） |
| `--port` | string | 否 | 指定端口（默认自动分配） |
| `--open` | boolean | 否 | 自动打开浏览器 |
| `--print-url` | boolean | 否 | 输出可视化地址 |
| `--background` | boolean | 否 | 非阻塞模式（用于 SessionStart Hook） |

**示例**:
```bash
# 启动服务
spec-first viewer

# 启动并打开浏览器
spec-first viewer open

# 输出地址
spec-first viewer url

# 指定端口
spec-first viewer --port 3000
```

**证据源**:
- 子命令解析 (`src/cli/commands/viewer.ts:13-28` — `parseSubcommand` — [代码证据])

---

### update

**描述**: 升级后刷新 Skill/MCP/Hooks

**用法**: `spec-first update [options]`

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `--dry-run` | boolean | 否 | 仅输出将发生的变更，不写文件 |
| `--skip-mcp` | boolean | 否 | 跳过 MCP 配置补齐 |
| `--skip-hooks` | boolean | 否 | 跳过 Git hooks 刷新 |
| `--host` | string | 否 | 仅刷新指定宿主（claude, codex, generic, all） |
| `--from-postinstall` | boolean | 否 | 静默模式（postinstall 调用） |

**示例**:
```bash
# 刷新所有配置
spec-first update

# 预览变更
spec-first update --dry-run

# 跳过 MCP
spec-first update --skip-mcp

# 仅刷新 Claude
spec-first update --host claude
```

**证据源**:
- 参数解析 (`src/cli/commands/update.ts:31-48` — `handleUpdate` — [代码证据])
- 宿主目标常量 (`src/cli/commands/update.ts:315` — `HOST_TARGETS` — [代码证据])

---

### uninstall

**描述**: 清理宿主配置（卸载前执行）

**用法**: `spec-first uninstall [options]`

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `--dry-run` | boolean | 否 | 仅输出将清理的内容，不执行删除 |
| `--keep-mcp` | boolean | 否 | 保留 MCP 配置 |

**清理范围**:
- 全局 Skills 缓存
- Claude 命令入口
- Codex skills
- 全局 SessionStart Hook
- 项目 AI Runtime Hooks
- Git hooks

**示例**:
```bash
# 预览清理
spec-first uninstall --dry-run

# 执行清理
spec-first uninstall

# 保留 MCP
spec-first uninstall --keep-mcp
```

**证据源**:
- 参数解析 (`src/cli/commands/uninstall.ts:15-35` — `handleUninstall` — [代码证据])

---

### analyze

**描述**: 跨产物一致性分析

**用法**: `spec-first analyze <featureId> [--out <path>]`

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<featureId>` | string | 是 | Feature ID |
| `--out` | string | 否 | 报告输出路径（默认 `specs/<featureId>/reports/analysis-report.md`） |

**退出码**:
- 0: 无 CRITICAL 发现
- 1: 存在 CRITICAL 发现

**示例**:
```bash
# 分析并输出到默认路径
spec-first analyze FSREQ-AUTH-001

# 指定输出路径
spec-first analyze FSREQ-AUTH-001 --out ./reports/analysis.md
```

**证据源**:
- 命令处理 (`src/cli/commands/analyze.ts:11-41` — `handleAnalyze` — [代码证据])

---

## 命令索引

| 命令 | 描述 | 分类 | 子命令数 |
|------|------|------|----------|
| `id` | 追溯 ID 生成、校验与检索 | 核心 | 4 |
| `matrix` | 同步追踪矩阵 | 核心 | 3 |
| `init` | 初始化 Feature 工作区 | 核心 | - |
| `stage` | 阶段流转管理 | 核心 | 3 |
| `rfc` | RFC 变更请求与状态管理 | 核心 | 5 |
| `defect` | 缺陷跟踪与状态管理 | 核心 | 5 |
| `metrics` | 覆盖率度量与健康评分 | 核心 | 3 |
| `doctor` | 环境诊断与修复 | 核心 | - |
| `gate` | 阶段质量门禁评估 | 核心 | 3 |
| `golive` | 上线就绪检查与批准 | 核心 | 1 |
| `ai` | 会话恢复与上下文摘要 | 核心 | 3 |
| `commit` | 规范提交并关联追溯 ID | 核心 | - |
| `feature` | Feature 列表、切换与查看 | 核心 | 3 |
| `setup` | 注册 Skill 命令（已废弃） | 配置 | - |
| `hooks` | Git Hooks 安装与状态管理 | 配置 | 3 |
| `viewer` | Stage Viewer 可视化面板 | 配置 | 3 |
| `update` | 升级后刷新 Skill/MCP/Hooks | 配置 | - |
| `uninstall` | 清理宿主配置 | 配置 | - |
| `analyze` | 跨产物一致性分析 | 配置 | - |

---

## 全局选项

| 选项 | 描述 |
|------|------|
| `--help` / `-h` | 显示帮助信息 |
| `--version` / `-v` | 显示版本号 |

**证据源**:
- 全局选项处理 (`src/cli/router.ts:37-44` — `--help`, `--version` 分支 — [代码证据])

---

## 退出码

| 退出码 | 常量 | 说明 |
|--------|------|------|
| 0 | `SUCCESS` | 成功 |
| 1 | `VALIDATION_ERROR` | 参数校验失败 |
| 2 | `IO_ERROR` | I/O 错误 |
| 3 | `CONFIG_ERROR` | 配置错误 |
| 4 | `GATE_FAILED` | Gate 检查失败 |
| 5 | `UNKNOWN_ERROR` | 未知错误 |

**证据源**:
- 退出码枚举 (`src/shared/types.ts` — `ExitCode` 枚举 — [类型定义证据])

---

*生成时间: 2026-03-03 | 模式: deep | 命令总数: 19*
