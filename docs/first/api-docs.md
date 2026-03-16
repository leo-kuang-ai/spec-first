---
last_updated: 2026-03-16
mode: quick
project: spec-first
api_type: cli
---

# Spec-First CLI 命令接口规范

本文档描述 `spec-first` CLI 工具的所有可用命令、参数、选项及退出码。

## 概览

**项目类型**: Backend CLI Tool（非 HTTP API）
**入口**: `dist/cli/index.js`
**运行时**: Node.js >= 20, ESM

---

## 命令列表

### 全局选项

| 选项 | 说明 |
|------|------|
| `--help`, `-h` | 显示帮助信息 |
| `--version`, `-v` | 显示版本号 |

### 核心命令

| 命令 | 说明 | 需确认 |
|------|------|--------|
| `init` | 初始化 Feature 工作区 | 否 |
| `feature` | Feature 列表、切换与查看 | switch 需确认 |
| `stage` | 阶段流转管理 | advance/cancel 需确认 |
| `gate` | 阶段质量门禁评估 | 否 |
| `golive` | 上线就绪检查与批准 | 是 |
| `done` | 将 Feature 从 07_release 收口到 08_done | 是 |

### 追溯与 ID 管理

| 命令 | 说明 | 需确认 |
|------|------|--------|
| `id` | 追溯 ID 生成、校验与检索 | 否 |
| `matrix` | 同步追踪矩阵 | update 需确认 |
| `trace` | 追溯链修复与校验 | repair 需确认 |

### 变更管理

| 命令 | 说明 | 需确认 |
|------|------|--------|
| `rfc` | RFC 变更请求与状态管理 | 是 |
| `defect` | 缺陷跟踪与状态管理 | 是 |

### 度量与分析

| 命令 | 说明 | 需确认 |
|------|------|--------|
| `metrics` | 覆盖率度量与健康评分 | 否 |
| `analyze` | 跨产物一致性分析 | 否 |
| `validate` | 产物格式校验 | 否 |

### AI 辅助

| 命令 | 说明 | 需确认 |
|------|------|--------|
| `ai` | 会话恢复与上下文摘要 | 否 |
| `skill` | 动态渲染 skill 内容 | 否 |
| `orchestrate` | 受控编排协调入口 | 是 |

### 环境与工具

| 命令 | 说明 | 需确认 |
|------|------|--------|
| `doctor` | 环境诊断与修复 | 否 |
| `hooks` | Git Hooks 安装与状态管理 | install/uninstall 需确认 |
| `setup` | 注册 Claude Code + Codex Skill 命令 | 是 |
| `update` | 升级后刷新 Skill/MCP/Hooks | 是 |
| `uninstall` | 清理宿主配置（卸载前执行） | 是 |
| `viewer` | Stage Viewer 可视化面板 | 否 |
| `commit` | 规范提交并关联追溯 ID | 是 |

### 其他

| 命令 | 说明 | 需确认 |
|------|------|--------|
| `first` | 项目首轮认知 runtime/docs 刷新 | 条件性 |
| `onboarding` | 新手引导 - 交互式场景识别与学习路径推荐 | 否 |
| `batch-test` | 批量执行测试（临时命令） | 否 |

---

## 命令详细说明

### `init` — 初始化 Feature 工作区

**用法**:
```bash
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [options]
```

**参数**:

| 参数 | 必需 | 说明 |
|------|------|------|
| `--feat <abbr>` | 是 | FEAT 缩写（必须匹配 `^[A-Z][A-Z0-9]{0,15}$`，例如 AUTH、REPORT） |
| `--mode <N\|I>` | 是 | 开发模式：N（新功能）或 I（增量迭代） |
| `--size <S\|M\|L>` | 是 | 规模：S（小）/ M（中）/ L（大） |
| `--platforms <p1,p2,...>` | 是 | 平台列表（逗号分隔），必须来自 `.spec-first/layer2/*.yaml` |
| `--title <title>` | 否 | Feature 标题 |
| `--feature-id <id>` | 否 | 指定 Feature ID（默认自动生成） |
| `--bootstrap` | 否 | 执行宿主环境自修复（MCP/skills/binaries） |

**示例**:
```bash
spec-first init --feat AUTH --mode N --size M --platforms java-backend,admin-frontend --title "用户认证模块"
```

---

### `feature` — Feature 管理

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `list` | 列出所有 Feature |
| `current` | 查看当前 Feature 详情 |
| `switch <featureId>` | 切换当前 Feature（需 `--yes` 确认） |

**示例**:
```bash
spec-first feature list
spec-first feature current
spec-first feature switch FSREQ-20260313-UIOPT-001 --yes
```

---

### `stage` — 阶段流转管理

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `current` | 查看当前阶段 |
| `suggest` | 输出当前阶段建议与阻塞原因 |
| `advance <featureId>` | 推进到下一阶段（需 `--yes` 确认） |
| `cancel <featureId>` | 取消 Feature（需 `--yes` 确认） |

**示例**:
```bash
spec-first stage current
spec-first stage suggest
spec-first stage advance FSREQ-20260313-UIOPT-001 --yes
```

---

### `gate` — 阶段质量门禁评估

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `check <featureId>` | 校验当前阶段 Gate 条件 |
| `history` | 查看 Gate 评估历史 |
| `conditions` | 列出当前阶段 Gate 条件 |
| `validate-config` | 验证 Profile 配置 |

**`check` 选项**:

| 选项 | 说明 |
|------|------|
| `--json` | 以 JSON 格式输出 |
| `--no-persist` | 不持久化评估结果 |

**示例**:
```bash
spec-first gate check FSREQ-20260313-UIOPT-001
spec-first gate check FSREQ-20260313-UIOPT-001 --json
spec-first gate history
```

---

### `id` — 追溯 ID 管理

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `next <type> <abbr> --feature <featureId>` | 生成下一个 ID |
| `validate <id>` | 校验 ID 格式 |
| `search <query> --feature <featureId>` | 按关键字搜索 ID |
| `list` | 列出全部 ID |

**ID 类型**:
- 业务链路：`FR`, `DS`, `TASK`, `TC`, `RFC`
- V-Model：`REQ`, `SYS`, `ARCH`, `MOD`, `ATP`, `STP`, `ITP`, `UTP`

**`next` 选项**:

| 选项 | 说明 |
|------|------|
| `--feature <featureId>` | 必需，指定 Feature |
| `--level <UT\|IT\|E2E\|ST>` | TC 级别（仅 type=TC 时使用） |

**示例**:
```bash
spec-first id next FR AUTH --feature FSREQ-20260313-AUTH-001
spec-first id next TC AUTH --feature FSREQ-20260313-AUTH-001 --level UT
spec-first id search "登录" --feature FSREQ-20260313-AUTH-001
```

---

### `matrix` — 追踪矩阵管理

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `check <featureId>` | 检查追踪矩阵完整性 |
| `export <featureId>` | 导出追踪矩阵为 JSON/YAML |
| `update <featureId> <entryId>` | 更新追踪矩阵条目（需 `--yes` 确认） |

**`update` 选项**:

| 选项 | 说明 |
|------|------|
| `--status <value>` | 状态值：Planned / Implemented / Verified / Accepted / Deferred / Cancelled / Exception |
| `--title <text>` | 标题 |
| `--upstream <ids>` | 上游依赖 ID（逗号分隔） |
| `--downstream <ids>` | 下游影响 ID（逗号分隔） |
| `--yes` | 确认执行（必需） |

**`export` 选项**:

| 选项 | 说明 |
|------|------|
| `--format <json\|yaml>` | 输出格式（默认 json） |

**示例**:
```bash
spec-first matrix check FSREQ-20260313-AUTH-001
spec-first matrix export FSREQ-20260313-AUTH-001 --format yaml
spec-first matrix update FSREQ-001 FR-001 --status Implemented --yes
```

---

### `trace` — 追溯链管理

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `fix` | 自动修复追溯链断裂（补充 TASK downstream） |
| `validate` | 校验追溯链完整性（检查 C3/C8 覆盖率） |

**示例**:
```bash
spec-first trace validate
spec-first trace fix --yes
```

---

### `metrics` — 度量报告

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `coverage` | 展示 Feature 的核心覆盖率指标 (C3/C4/C6/C8/C9) |
| `report` | 生成完整度量报告 |
| `health` | 展示健康分与关键风险 |

**示例**:
```bash
spec-first metrics coverage --feature FSREQ-20260313-AUTH-001
spec-first metrics health --feature FSREQ-20260313-AUTH-001
```

---

### `rfc` — RFC 变更请求

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `create` | 创建 RFC |
| `submit` | 提交 RFC（draft → approved） |
| `transition` | 流转 RFC 状态 |
| `list` | 列出 RFC |
| `get` | 查看 RFC 详情 |

**RFC 状态**: draft / approved / rejected / implemented

**示例**:
```bash
spec-first rfc create --feature FSREQ-20260313-AUTH-001
spec-first rfc list --feature FSREQ-20260313-AUTH-001
```

---

### `defect` — 缺陷管理

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `register` | 登记新缺陷 |
| `update` | 变更缺陷状态 |
| `list` | 列出缺陷（可筛选） |
| `get` | 查看缺陷详情 |
| `escape-rate` | 计算缺陷逃逸率 |

**缺陷严重级别**: critical / major / minor / trivial
**缺陷状态**: open / in_progress / fixed / verified / closed / deferred

**示例**:
```bash
spec-first defect register --feature FSREQ-20260313-AUTH-001
spec-first defect list --feature FSREQ-20260313-AUTH-001
```

---

### `ai` — AI 辅助

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `context` | 生成并展示上下文包 |
| `catchup` | 执行 6 步会话恢复 |
| `stats` | 查看 AI 调用统计 |

**`context` 选项**:

| 选项 | 说明 |
|------|------|
| `--full` | 包含完整上下文 |
| `--expand <path1,path2>` | 展开指定路径的详情 |

**示例**:
```bash
spec-first ai context --feature FSREQ-20260313-AUTH-001
spec-first ai catchup --feature FSREQ-20260313-AUTH-001
```

---

### `validate` — 产物格式校验

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `format` | 校验产物格式（PRD/ID/路径） |
| `matrix` | 校验追溯矩阵 |
| `all` | 执行全部校验 |

**示例**:
```bash
spec-first validate all --feature FSREQ-20260313-AUTH-001
```

---

### `analyze` — 跨产物一致性分析

**用法**:
```bash
spec-first analyze <featureId> [--out <path>]
```

**说明**: 执行跨产物一致性分析并生成 `analysis-report.md`。当存在 CRITICAL 发现时返回非 0（ExitCode=1）。

**示例**:
```bash
spec-first analyze FSREQ-20260313-AUTH-001
spec-first analyze FSREQ-20260313-AUTH-001 --out ./reports/analysis.md
```

---

### `doctor` — 环境诊断与修复

**用法**:
```bash
spec-first doctor
```

**说明**: 执行环境诊断，检测以下项目：
- Node.js 版本
- Git 配置
- `.spec-first/` 目录
- `specs/` 目录
- `stage-state.json` 状态
- Git Hooks 安装状态
- Claude Session Hook 配置
- Gate 降级状态
- 运行时文件完整性
- 宿主能力（Host Capabilities）

---

### `hooks` — Git Hooks 管理

**子命令**:

| 子命令 | 说明 |
|--------|------|
| `install` | 安装 spec-first Git hooks |
| `uninstall` | 卸载 spec-first Git hooks |
| `status` | 查看 hooks 安装状态 |

**示例**:
```bash
spec-first hooks install --yes
spec-first hooks status
```

---

### `first` — 项目首轮认知

**用法**:
```bash
spec-first first [--quick|--deep] [--type=<value>] [--force] [--skip] [--check-health]
```

**说明**:
- 无 runtime 真源时，生成最小 canonical `.spec-first/runtime/first/` 与 canonical projection docs
- 已有 runtime 真源时，优先刷新 runtime truth，再强制从 runtime 恢复 canonical projection docs
- legacy/reference docs 不在自动刷新与 health 承诺范围内

---

### `skill` — Skill 渲染

**用法**:
```bash
spec-first skill render <skill-name> [--feature <featureId>] [--input <rawUserInput>]
```

**示例**:
```bash
spec-first skill render code --feature FSREQ-20260313-AUTH-001
```

---

### `orchestrate` — 编排协调

**用法**:
```bash
spec-first orchestrate [options]
```

**选项**:

| 选项 | 说明 |
|------|------|
| `--auto` | 自动模式 |
| `--resume` | 恢复执行 |
| `--auto-advance` | 自动推进阶段 |

---

### `commit` — 规范提交

**用法**:
```bash
spec-first commit [options]
```

**说明**: 执行规范提交并关联追溯 ID。会自动验证 Governance Staging 状态。

---

## 退出码

| 退出码 | 常量名 | 说明 |
|--------|--------|------|
| 0 | `SUCCESS` | 执行成功 |
| 1 | `GATE_FAILED` | Gate 校验失败 |
| 2 | `VALIDATION_ERROR` | 参数校验错误 |
| 3 | `CONFIG_ERROR` | 配置错误 |
| 4 | `IO_ERROR` | I/O 错误 |
| 5 | `UNKNOWN_ERROR` | 未知错误 |
| 6 | `INVALID_ARGS` | 无效参数 |
| 7 | `GENERAL_ERROR` | 一般错误 |

---

## 确认机制

部分命令需要用户确认（添加 `--yes` 标志）才能执行：

- **始终需确认**: `rfc`, `defect`, `done`, `setup`, `update`, `uninstall`, `commit`
- **条件性确认**: `feature switch`, `stage advance`, `stage cancel`, `matrix update`, `trace repair`, `hooks install/uninstall`
- **策略依赖**: 确认策略可通过 `--mode` 和 `--size` 参数影响（`auto` 策略下可跳过确认）

---

## 输出格式

### 文本格式（默认）

命令默认输出人类可读的文本格式，包含：
- 状态图标（PASS/FAIL/WARN/SKIP）
- 条件描述
- 详细信息
- 建议与修复步骤

### JSON 格式

使用 `--json` 标志时，输出结构化 JSON：

```json
{
  "stage": "04_implement",
  "status": "PASS",
  "conditions": [...],
  "effectiveGates": [...],
  "warnings": [...],
  "statusSummary": {
    "status": "PASS",
    "blockingCount": 0,
    "warningCount": 1
  },
  "metricTargets": {...}
}
```

---

## Stage 枚举

阶段流转遵循单向不可逆规则：

```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done
                                                                                                    ↓
                                                                                              09_cancelled
```

---

## 覆盖率指标

| 指标 | 说明 |
|------|------|
| C3 | TASK 覆盖 FR（支持传递链） |
| C4 | TC **直接** 覆盖 FR（不支持传递） |
| C6 | TASK 已实现比例 |
| C8 | TASK 有上游 ID 比例 |
| C9 | TC 有上游 FR 比例 |

---

## 典型使用场景

### 新功能开发流程

```bash
# 1. 初始化 Feature
spec-first init --feat AUTH --mode N --size M --platforms java-backend --title "用户认证"

# 2. 查看当前 Feature
spec-first feature current

# 3. 生成追溯 ID
spec-first id next FR AUTH --feature FSREQ-20260313-AUTH-001

# 4. 检查 Gate
spec-first gate check FSREQ-20260313-AUTH-001

# 5. 推进阶段
spec-first stage advance FSREQ-20260313-AUTH-001 --yes
```

### Bug 修复流程

```bash
# 1. 登记缺陷
spec-first defect register --feature FSREQ-20260313-AUTH-001

# 2. 更新缺陷状态
spec-first defect update DEF-001 --status fixed --yes

# 3. 验证修复
spec-first defect update DEF-001 --status verified --yes
```

### 环境诊断

```bash
# 运行完整诊断
spec-first doctor

# 检查 hooks 状态
spec-first hooks status
```
