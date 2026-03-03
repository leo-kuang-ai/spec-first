---
last_updated: 2026-03-03
mode: quick
project_type: backend
---

# Spec-First CLI 命令参考

> Spec-First 是一个基于 **规范先行（Spec-First）** 理念的全链路研发闭环 CLI 工具。
> 本文档列出所有可用命令及其参数说明。

---

## 命令概览

| 命令 | 用途 | 分类 |
|------|------|------|
| `id` | 追溯 ID 生成、校验与检索 | 追溯 |
| `matrix` | 同步追踪矩阵 | 追溯 |
| `init` | 初始化 Feature 工作区 | 流程管理 |
| `stage` | 阶段流转管理 | 流程管理 |
| `rfc` | RFC 变更请求与状态管理 | 变更管理 |
| `defect` | 缺陷跟踪与状态管理 | 变更管理 |
| `metrics` | 覆盖率度量与健康评分 | 度量 |
| `doctor` | 环境诊断与修复 | 诊断 |
| `gate` | 阶段质量门禁评估 | 质量门禁 |
| `golive` | 上线就绪检查与批准 | 质量门禁 |
| `ai` | 会话恢复与上下文摘要 | AI 编排 |
| `commit` | 规范提交并关联追溯 ID | Git 集成 |
| `feature` | Feature 列表、切换与查看 | 流程管理 |
| `setup` | 注册 Skill 命令（已废弃，使用 update） | 安装 |
| `hooks` | Git Hooks 安装与状态管理 | Git 集成 |
| `viewer` | Stage Viewer 可视化面板 | 可视化 |
| `update` | 升级后刷新 Skill/MCP/Hooks | 安装 |
| `uninstall` | 清理宿主配置（卸载前执行） | 安装 |
| `analyze` | 跨产物一致性分析 | 分析 |

---

## 流程管理

### init

初始化 Feature 工作区，创建规范目录结构和配置文件。

**用法**:
```bash
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [选项]
```

**参数**:

| 参数 | 必填 | 说明 |
|------|------|------|
| `--feat <abbr>` | 是 | FEAT 缩写，必须匹配 `^[A-Z][A-Z0-9]{0,15}$`（如 AUTH、REPORT） |
| `--mode <N\|I>` | 是 | 开发模式：N（新功能）/ I（增量迭代） |
| `--size <S\|M\|L>` | 是 | 规模：S（小）/ M（中）/ L（大） |
| `--platforms <list>` | 是 | 平台列表（逗号分隔），必须来自 `.spec-first/layer2/*.yaml` |
| `--title <title>` | 否 | Feature 标题（默认为 feat 值） |
| `--feature-id <id>` | 否 | 指定 Feature ID（默认自动生成） |
| `--bootstrap` | 否 | 执行宿主环境自修复（MCP/skills/binaries） |

**交互模式**: 无参数时自动进入交互式引导填写。

**示例**:
```bash
# 命令行模式
spec-first init --feat AUTH --mode N --size M --platforms h5,api

# 交互模式
spec-first init
```

---

### stage

管理 Feature 阶段流转，支持查看当前阶段、推进到下一阶段、取消 Feature。

**用法**:
```bash
spec-first stage <subcommand> [选项]
```

**子命令**:

| 子命令 | 说明 | 用法 |
|--------|------|------|
| `current` | 查看当前阶段状态 | `spec-first stage current <featureId>` |
| `advance` | 推进到下一阶段 | `spec-first stage advance <featureId> [--force]` |
| `cancel` | 取消 Feature | `spec-first stage cancel <featureId> --reason "<reason>"` |

**选项**:

| 选项 | 说明 |
|------|------|
| `--force` | 强制推进，跳过 Gate 检查（仅 advance） |
| `--reason "<text>"` | 取消原因（cancel 必填） |

**示例**:
```bash
# 查看当前阶段
spec-first stage current FSREQ-AUTH-0001

# 推进阶段
spec-first stage advance FSREQ-AUTH-0001

# 取消 Feature
spec-first stage cancel FSREQ-AUTH-0001 --reason "需求变更"
```

---

### feature

列出、查看和切换当前 Feature。

**用法**:
```bash
spec-first feature <subcommand>
```

**子命令**:

| 子命令 | 说明 | 用法 |
|--------|------|------|
| `list` | 列出所有 Feature | `spec-first feature list` |
| `current` | 查看当前 Feature 详情 | `spec-first feature current` |
| `switch` | 切换当前 Feature | `spec-first feature switch <featureId>` |

**示例**:
```bash
# 列出所有 Feature
spec-first feature list

# 切换 Feature
spec-first feature switch FSREQ-AUTH-0001
```

---

## 追溯管理

### id

追溯 ID 生成、校验与检索。

**用法**:
```bash
spec-first id <subcommand> [选项]
```

**子命令**:

| 子命令 | 说明 | 用法 |
|--------|------|------|
| `next` | 生成下一个 ID | `spec-first id next <type> <abbr> --feature <featureId> [--level <UT\|IT\|E2E\|ST>]` |
| `validate` | 校验 ID 格式 | `spec-first id validate <id>` |
| `search` | 按关键字搜索 ID | `spec-first id search <query> --feature <featureId> [--type <type>]` |
| `list` | 列出全部 ID | `spec-first id list --feature <featureId> [--type <type>]` |

**ID 类型**:
- `FR` - 功能需求
- `DS` - 设计规范
- `TASK` - 任务
- `TC` - 测试用例
- `RFC` - 变更请求
- `REQ` - 需求
- `SYS` - 系统
- `ARCH` - 架构
- `MOD` - 模块
- `ATP` - 验收测试计划
- `STP` - 系统测试计划
- `ITP` - 集成测试计划
- `UTP` - 单元测试计划

**示例**:
```bash
# 生成功能需求 ID
spec-first id next FR AUTH --feature FSREQ-AUTH-0001

# 生成测试用例 ID（指定级别）
spec-first id next TC AUTH --feature FSREQ-AUTH-0001 --level UT

# 校验 ID
spec-first id validate FR-AUTH-0001

# 搜索 ID
spec-first id search "登录" --feature FSREQ-AUTH-0001

# 列出所有 ID
spec-first id list --feature FSREQ-AUTH-0001
```

---

### matrix

同步追踪矩阵管理，检查规范与实现的关联完整性。

**用法**:
```bash
spec-first matrix <subcommand> [选项]
```

**子命令**:

| 子命令 | 说明 | 用法 |
|--------|------|------|
| `check` | 检查矩阵完整性 | `spec-first matrix check <featureId>` |
| `export` | 导出矩阵 | `spec-first matrix export <featureId> [--format markdown\|yaml]` |
| `update` | 更新矩阵条目 | `spec-first matrix update <featureId> <id> [选项]` |

**update 选项**:

| 选项 | 说明 |
|------|------|
| `--status <status>` | 更新状态 |
| `--title <title>` | 更新标题 |
| `--upstream <ids>` | 更新上游依赖（逗号分隔） |
| `--downstream <ids>` | 更新下游依赖（逗号分隔） |

**示例**:
```bash
# 检查矩阵
spec-first matrix check FSREQ-AUTH-0001

# 导出为 Markdown
spec-first matrix export FSREQ-AUTH-0001 --format markdown

# 更新矩阵条目
spec-first matrix update FSREQ-AUTH-0001 FR-AUTH-0001 --status done
```

---

## 变更管理

### rfc

RFC（Request For Comments）变更请求与状态管理。

**用法**:
```bash
spec-first rfc <subcommand> [选项]
```

**子命令**:

| 子命令 | 说明 | 用法 |
|--------|------|------|
| `create` | 创建 RFC | `spec-first rfc create <featureId> --title "<title>" [选项]` |
| `submit` | 提交 RFC（draft → approved） | `spec-first rfc submit <rfcId> --feature <featureId>` |
| `transition` | 流转 RFC 状态 | `spec-first rfc transition <rfcId> <status> --feature <featureId>` |
| `list` | 列出 RFC | `spec-first rfc list <featureId>` |
| `get` | 查看 RFC 详情 | `spec-first rfc get <rfcId> --feature <featureId>` |

**create 选项**:

| 选项 | 说明 |
|------|------|
| `--title "<title>"` | RFC 标题（必填） |
| `--level <Minor\|Major\|Critical>` | 变更级别 |
| `--by <author>` | 作者（默认 cli） |
| `--motivation "<text>"` | 变更动机 |
| `--description "<text>"` | 详细描述 |

**状态流转**: `draft` → `approved` → `closed` / `rejected`

**示例**:
```bash
# 创建 RFC
spec-first rfc create FSREQ-AUTH-0001 --title "重构登录模块" --level Major

# 提交 RFC
spec-first rfc submit RFC-AUTH-0001 --feature FSREQ-AUTH-0001

# 流转状态
spec-first rfc transition RFC-AUTH-0001 approved --feature FSREQ-AUTH-0001

# 列出 RFC
spec-first rfc list FSREQ-AUTH-0001
```

---

### defect

缺陷跟踪与状态管理。

**用法**:
```bash
spec-first defect <subcommand> [选项]
```

**子命令**:

| 子命令 | 说明 | 用法 |
|--------|------|------|
| `register` | 登记新缺陷 | `spec-first defect register <featureId> --severity <S1-S4> --title "<title>" [选项]` |
| `update` | 变更缺陷状态 | `spec-first defect update <featureId> <seq> --status <status>` |
| `list` | 列出缺陷 | `spec-first defect list <featureId> [--status <status>] [--severity <severity>]` |
| `get` | 查看缺陷详情 | `spec-first defect get <featureId> <seq>` |
| `escape-rate` | 计算缺陷逃逸率 | `spec-first defect escape-rate <featureId>` |

**register 选项**:

| 选项 | 说明 |
|------|------|
| `--severity <S1\|S2\|S3\|S4>` | 严重级别（必填） |
| `--title "<title>"` | 缺陷标题（必填） |
| `--reporter "<name>"` | 报告人（默认 cli） |
| `--description "<text>"` | 详细描述 |
| `--discovered-in <stage>` | 发现阶段 |
| `--linked-fr <frId>` | 关联功能需求 |

**状态流转**: `open` → `fixing` → `fixed` → `verified` / `wontfix`

**示例**:
```bash
# 登记缺陷
spec-first defect register FSREQ-AUTH-0001 --severity S2 --title "登录失败未提示"

# 更新缺陷状态
spec-first defect update FSREQ-AUTH-0001 1 --status fixing

# 列出缺陷
spec-first defect list FSREQ-AUTH-0001 --status open

# 查看缺陷逃逸率
spec-first defect escape-rate FSREQ-AUTH-0001
```

---

## 质量门禁

### gate

阶段质量门禁评估。

**用法**:
```bash
spec-first gate <subcommand> [选项]
```

**子命令**:

| 子命令 | 说明 | 用法 |
|--------|------|------|
| `check` | 校验当前阶段 Gate 条件 | `spec-first gate check <featureId>` |
| `history` | 查看 Gate 评估历史 | `spec-first gate history <featureId>` |
| `conditions` | 列出当前阶段 Gate 条件 | `spec-first gate conditions <featureId>` |

**示例**:
```bash
# 检查 Gate
spec-first gate check FSREQ-AUTH-0001

# 查看历史
spec-first gate history FSREQ-AUTH-0001

# 查看条件定义
spec-first gate conditions FSREQ-AUTH-0001
```

---

### golive

上线就绪检查与批准。

**用法**:
```bash
spec-first golive check <featureId>
```

**示例**:
```bash
spec-first golive check FSREQ-AUTH-0001
```

---

## 度量分析

### metrics

覆盖率度量与健康评分。

**用法**:
```bash
spec-first metrics <subcommand> <featureId>
```

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `coverage` | 展示 Feature 的 C1-C9 覆盖率 |
| `report` | 生成完整度量报告（覆盖率 + 健康分 + 瓶颈） |
| `health` | 展示健康分与关键风险 |

**覆盖率指标（C1-C9）**:

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
spec-first metrics coverage FSREQ-AUTH-0001

# 生成完整报告
spec-first metrics report FSREQ-AUTH-0001

# 查看健康分
spec-first metrics health FSREQ-AUTH-0001
```

---

### analyze

跨产物一致性分析，生成分析报告。

**用法**:
```bash
spec-first analyze <featureId> [--out <path>]
```

**选项**:

| 选项 | 说明 |
|------|------|
| `--out <path>` | 输出路径（默认 `specs/<featureId>/reports/analysis-report.md`） |

**示例**:
```bash
spec-first analyze FSREQ-AUTH-0001
spec-first analyze FSREQ-AUTH-0001 --out ./reports/analysis.md
```

---

## AI 编排

### ai

会话恢复与上下文摘要。

**用法**:
```bash
spec-first ai <subcommand> <featureId> [选项]
```

**子命令**:

| 子命令 | 说明 | 用法 |
|--------|------|------|
| `context` | 生成并展示上下文包 | `spec-first ai context <featureId> [--full] [--expand <path1,path2>]` |
| `catchup` | 执行 6 步会话恢复 | `spec-first ai catchup <featureId>` |
| `stats` | 查看 AI 调用统计 | `spec-first ai stats <featureId>` |

**context 选项**:

| 选项 | 说明 |
|------|------|
| `--full` | 完整详情模式 |
| `--expand <paths>` | 展开指定文件内容（逗号分隔） |

**示例**:
```bash
# 生成上下文包
spec-first ai context FSREQ-AUTH-0001

# 完整详情
spec-first ai context FSREQ-AUTH-0001 --full

# 展开特定文件
spec-first ai context FSREQ-AUTH-0001 --expand spec.md,design.md

# 会话恢复
spec-first ai catchup FSREQ-AUTH-0001

# 查看统计
spec-first ai stats FSREQ-AUTH-0001
```

---

## Git 集成

### commit

规范提交并关联追溯 ID。

**用法**:
```bash
spec-first commit --message "<msg>" [--task <taskId>]
```

**选项**:

| 选项 | 说明 |
|------|------|
| `-m, --message "<msg>"` | 提交消息（必填） |
| `--task <taskId>` | 关联任务 ID（自动推断或手动指定） |

**说明**: 如未指定 `--task`，会自动从当前 Feature 的 `task_plan.md` 推断 "In Progress" 状态的任务。

**示例**:
```bash
# 基本提交
spec-first commit --message "实现登录功能"

# 指定任务 ID
spec-first commit -m "修复登录校验" --task TASK-AUTH-0001
```

---

### hooks

Git Hooks 安装与状态管理。

**用法**:
```bash
spec-first hooks <subcommand>
```

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `install` | 安装 spec-first Git hooks |
| `uninstall` | 卸载 spec-first Git hooks |
| `status` | 查看 hooks 安装状态 |

**示例**:
```bash
# 安装 hooks
spec-first hooks install

# 查看状态
spec-first hooks status

# 卸载 hooks
spec-first hooks uninstall
```

---

## 诊断与可视化

### doctor

环境诊断与修复。

**用法**:
```bash
spec-first doctor [featureId]
```

**检查项**:
- Node.js 版本（≥ 20）
- Git 安装
- `.spec-first/` 目录
- `specs/` 目录
- `config.yaml` 配置
- Git Hooks 状态
- Session Hook 配置
- Gate 降级状态
- 运行态文件容量

**示例**:
```bash
# 项目级诊断
spec-first doctor

# Feature 级诊断
spec-first doctor FSREQ-AUTH-0001
```

---

### viewer

Stage Viewer 可视化面板。

**用法**:
```bash
spec-first viewer [subcommand] [选项]
```

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `start` | 启动或复用当前项目可视化服务（默认） |
| `open` | 启动/复用并自动打开浏览器 |
| `url` | 输出当前可视化地址 |

**选项**:

| 选项 | 说明 |
|------|------|
| `--project-root <path>` | 指定项目根目录 |
| `--host <host>` | 监听地址（默认 127.0.0.1） |
| `--port <port>` | 指定端口（默认自动分配） |
| `--open` | 自动打开浏览器 |
| `--print-url` | 输出可视化地址 |
| `--background` | 非阻塞模式（用于 SessionStart Hook） |

**示例**:
```bash
# 启动服务
spec-first viewer

# 启动并打开浏览器
spec-first viewer open

# 输出 URL
spec-first viewer url
```

---

## 安装与维护

### update

升级后刷新 Skill/MCP/Hooks。

**用法**:
```bash
spec-first update [选项]
```

**选项**:

| 选项 | 说明 |
|------|------|
| `--dry-run` | 仅输出将发生的变更，不写文件 |
| `--skip-mcp` | 跳过 MCP 配置补齐 |
| `--skip-hooks` | 跳过 Git hooks 刷新 |
| `--host <target>` | 仅刷新指定宿主（claude/codex/generic/all） |
| `--from-postinstall` | 静默模式（postinstall 调用） |

**示例**:
```bash
# 刷新所有
spec-first update

# 预览变更
spec-first update --dry-run

# 仅刷新 Claude
spec-first update --host claude
```

---

### setup

> **已废弃**: 请使用 `spec-first update` 替代。

注册 Skill 命令入口。

---

### uninstall

清理宿主配置（卸载前执行）。

**用法**:
```bash
spec-first uninstall [选项]
```

**选项**:

| 选项 | 说明 |
|------|------|
| `--dry-run` | 仅输出将清理的内容，不执行删除 |
| `--keep-mcp` | 保留 MCP 配置 |

**示例**:
```bash
# 预览清理
spec-first uninstall --dry-run

# 执行清理
spec-first uninstall
```

---

## 全局选项

| 选项 | 说明 |
|------|------|
| `-h, --help` | 显示帮助信息 |
| `-v, --version` | 显示版本号 |

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

---

## 另见

- [CLAUDE.md](/CLAUDE.md) - 项目规范与工作指南
- [架构概览](/docs/first/architecture.md) - 核心模块设计
- [开发指南](/docs/first/development-guidelines.md) - 本地开发与测试
