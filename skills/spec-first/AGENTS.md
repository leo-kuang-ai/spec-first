---
description: Spec-First 全链路研发闭环 — 全局 Agent 指令
---

# Spec-First Agent 全局指令

> 本文件为所有 Skill 提供共享上下文。Codex CLI 自动加载，Claude Code 通过 `/skill` 间接引用。

## 双宿主核心约束摘要

- Claude 路径（Hook 阻断链路）：
  - `PreToolUse` 在写操作前刷新当前 TASK 上下文。
  - `Stop` 必须执行完成度守门；存在未完成 TASK 时返回非 0 并阻断会话正常结束。
  - `Stop` 中 `ai stats` 与完成度守门并存，禁止替换已有统计 Hook。
- Codex 路径（Skill 证据链路）：
  - 不依赖宿主 Hook 阻断，依赖 `code/verify/orchestrate` 的证据铁律防止提前收工。
  - 声称通过前必须提供新鲜命令输出与退出码。
- 失败处理差异：
  - Claude 侧以 Hook 返回码阻断。
  - Codex 侧以流程规则拒绝“已完成/可推进”声明并回退到修复步骤。

## Skill 评审清单（含 Description Trap）

- Front Matter `description` 仅描述触发条件（Use when X）。
- `description` 禁止出现执行流程、策略摘要、捷径提示。
- 规则章节新增后不得破坏原有 P0-P5 主流程语义。

## Session Hook 决策树（P1-15）

1. 若存在 `.spec-first/current`：输出恢复提示（建议执行 `spec-first ai catchup <featureId>`）。
2. 无论是否命中恢复提示，都尝试启动 viewer。
3. viewer 启动失败时静默降级，不阻断会话启动。

## Worktree First（P1-16）

- 高风险任务（大范围重构、跨模块联动、并行修复实验）默认建议在独立 worktree 执行。
- 主工作区仅用于稳定路径与结果汇总，减少上下文与改动污染。

## 动态 Prompt 组装规则（P1-09）

- Skill 加载时通过 `prompt-assembler` 自动替换 `{{ PLACEHOLDER }}` 占位符（白名单：`FEATURE_ID`、`CURRENT_STAGE`、`CURRENT_TASK`、`TOKEN_BUDGET`、`MAX_ITERATIONS`、`DATE_ISO`）。
- 同源参数变更一次生效：所有占位符从项目运行态文件（`stage-state.json`、`task_plan.md`、`config.yaml`）统一读取，无需手动同步。
- Context Pack 大小建议控制在 2KB 以内；超出时 `prompt-assembler` 输出警告但不阻断。
- 未识别的占位符保留原文，不做静默删除。

## Hook 跨平台稳健性（P1-17）

- Hook 脚本必须兼容 macOS `/usr/bin/awk` 与 Linux `awk`。
- 阻断型 Hook（如 `stop-guard.sh`）必须输出 stderr + 非 0 退出。
- 非阻断型 Hook 失败必须可降级，避免单点故障拖垮主流程。

## 项目概述

**Spec-First** 是一套规范驱动的全链路研发闭环工具链。核心理念：

- **规范即契约** — 所有开发活动以规范为准，规范是唯一真理源
- **全链路追溯** — 从需求到上线，每个环节可追溯到对应规范
- **自动化校验** — 规范可被工具自动解析和校验

### 技术栈

- Node.js 20 + TypeScript 5.x + ESM only
- CLI 框架：Commander.js
- 测试：Vitest
- 构建：tsup

### 目录结构

```text
specs/                          # Feature 工作区根目录
├── .feat-registry.md           # FEAT 缩写注册表
└── <featureId>/                # 单个 Feature 目录
    ├── stage-state.json        # 阶段状态机
    ├── constitution.md         # 项目原则
    ├── spec.md                 # 需求规格（01_specify）
    ├── design.md               # 技术设计（02_design）
    ├── research.md             # 技术调研（02_design 可选）
    ├── contracts/*.yaml        # API 契约（02_design）
    ├── data-model.md           # 数据模型（02_design M/L）
    ├── adr/*.adr.md            # 架构决策记录
    ├── task_plan.md            # 任务拆解（03_plan）
    ├── checklist.md            # 验证清单（03_plan）
    ├── tests/*.test.md         # 测试用例（05_verify）
    ├── reports/                # 报告目录
    │   ├── test-report.md
    │   ├── security-scan.md
    │   └── uat-signoff.md
    ├── retro.md                # 复盘报告（06_wrap_up）
    ├── traceability-matrix.md  # 追踪矩阵
    ├── findings.md             # 过程发现与会话摘要（运行态）
    ├── gate-history.jsonl      # Gate 评估历史
    ├── ai-stats.jsonl          # AI 调用统计
    └── metrics.jsonl           # 度量数据
```

## CLI 命令参考

所有 Skill 通过 Bash 调用以下 CLI 命令完成确定性操作。

### spec-first init

初始化 Feature 工作区。

```bash
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>] [--title <title>] [--bootstrap]
```

- 创建 `specs/<featureId>/` 目录（featureId 由 `--feat` 缩写自动生成，或通过 `--feature-id` 指定）
- 生成 `stage-state.json`（初始阶段 `00_init`）
- 生成 `constitution.md` 模板

### spec-first id

ID 生成与校验。

```bash
# 生成下一个 ID
spec-first id next <type> <abbr> --feature <featureId> [--level <UT|IT|E2E|ST>]
# type: FR | DS | TASK | TC | RFC
# --level 仅 TC 类型需要

# 校验 ID 格式
spec-first id validate <id>

# 搜索 ID
spec-first id search <query> --feature <featureId> [--type <type>]

# 列出已注册 ID
spec-first id list --feature <featureId> [--type <type>]
```

**ID 格式规则**：

| 类型 | 格式 | 示例 |
| --- | --- | --- |
| FR | `FR-<ABBR>-NNN` | FR-AUTH-001 |
| DS | `DS-<ABBR>-NNN` | DS-AUTH-001 |
| TASK | `TASK-<ABBR>-NNN` | TASK-AUTH-001 |
| TC | `TC-<LEVEL>-<ABBR>-NNN` | TC-UT-AUTH-001 |
| RFC | `RFC-NNN` | RFC-001 |

### spec-first gate

Gate 条件评估（质量门禁）。

```bash
# 校验当前阶段 Gate
spec-first gate check <featureId>

# 查看阶段 Gate 条件定义
spec-first gate conditions <featureId>

# 查看 Gate 评估历史
spec-first gate history <featureId>
```

Gate 评估结果：`PASS`（通过）| `PASS_WITH_WAIVER`（有豁免的通过）| `FAIL`（阻断）。

### spec-first stage

阶段生命周期管理。

```bash
# 查看当前阶段
spec-first stage current <featureId>

# 推进到下一阶段（需 Gate PASS；必要时可 --force）
spec-first stage advance <featureId> [--force]

# 取消 Feature
spec-first stage cancel <featureId> --reason "<reason>"
```

**阶段顺序**：

```text
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done
取消流程：任意阶段 --[spec-first stage cancel]--> 09_cancelled（终态，不可逆）
```

### spec-first matrix

追踪矩阵管理。

```bash
# 校验追踪矩阵完整性
spec-first matrix check <featureId>

# 导出追踪矩阵
spec-first matrix export <featureId> [--format <markdown|yaml>]

# 更新矩阵行
spec-first matrix update <featureId> <id> [--status <status>] [--title <title>] [--upstream <ids>] [--downstream <ids>]
```

### spec-first metrics

覆盖率与度量。

```bash
# 计算覆盖率（9 项指标）
spec-first metrics coverage <featureId>

# 生成度量报告
spec-first metrics report <featureId>

# 健康分（加权综合评分）
spec-first metrics health <featureId>
```

**9 项覆盖率指标**：

| 指标 | 含义 |
| --- | --- |
| C1 Design Coverage | 被 DS 覆盖的 FR 比例 |
| C2 API Coverage | 需接口的 FR 被 API 覆盖比例 |
| C3 Task Coverage | 被 TASK 覆盖的 FR 比例 |
| C4 Test Coverage (FR) | 被 TC 覆盖的 FR 比例 |
| C5 Test Coverage (AC) | 被 TC 覆盖的 AC 比例 |
| C6 Impl Coverage | 已实现的 TASK 比例 |
| C7 PR Compliance | 关联 TASK ID 的 PR 比例 |
| C8 Task Compliance | 关联 DS/FR 的 TASK 比例 |
| C9 TC Compliance | 关联 AC/FR 的 TC 比例 |

### spec-first ai

AI 辅助工具。

```bash
# 生成 Context Pack（<2KB YAML）
spec-first ai context <featureId>

# 会话恢复
spec-first ai catchup <featureId>

# AI 调用统计
spec-first ai stats <featureId>
```

### spec-first rfc

变更请求（RFC）管理。

```bash
# 创建 RFC
spec-first rfc create <featureId> --title "<title>" [--level <Minor|Major|Critical>] [--by <author>] [--motivation "<text>"] [--description "<text>"]

# 提交 RFC 进入评审
spec-first rfc submit <rfcId> --feature <featureId>

# RFC 状态流转（status: draft | approved | closed | rejected）
spec-first rfc transition <rfcId> <status> --feature <featureId>

# 列出 Feature 下所有 RFC
spec-first rfc list <featureId>

# 查看 RFC 详情
spec-first rfc get <rfcId> --feature <featureId>
```

### spec-first defect

缺陷管理。

```bash
# 登记缺陷（severity: S1 | S2 | S3 | S4）
spec-first defect register <featureId> --severity <S1|S2|S3|S4> --title "<title>" [--reporter "<name>"] [--description "<text>"] [--discovered-in <stage>] [--linked-fr <id>]

# 更新缺陷状态（status: open | fixing | fixed | verified | wontfix）
spec-first defect update <featureId> <seq> --status <status>

# 列出缺陷
spec-first defect list <featureId> [--status <status>] [--severity <severity>]

# 查看缺陷详情
spec-first defect get <featureId> <seq>

# 计算缺陷逃逸率
spec-first defect escape-rate <featureId>
```

### spec-first golive

上线前检查。

```bash
spec-first golive check <featureId>
```

校验 Feature 是否满足上线条件（Gate 全通过、覆盖率达标、无未关闭缺陷）。

### spec-first commit

Git 提交（自动注入 traces trailer）。

```bash
spec-first commit --message "<message>" [--task <taskId>]
```

- `-m` 为 `--message` 别名
- `--task` 可选，未指定时自动从 task_plan.md 中查找 In Progress 的 TASK
- 自动在 commit message 中注入 `traces: <taskId>` trailer

### spec-first feature

Feature 管理。

```bash
# 列出所有 Feature
spec-first feature list

# 查看当前活跃 Feature
spec-first feature current

# 切换活跃 Feature
spec-first feature switch <featureId>
```

### spec-first doctor

环境诊断。

```bash
spec-first doctor [featureId]
```

检查：Node.js 版本、Git 配置、.spec-first/ 目录、specs/ 目录、config.yaml、Git Hook 状态、Gate 降级检测、运行时文件膨胀检测。指定 featureId 时额外检查 Feature 级状态。

MCP/skills 诊断与修复（与 doctor Skill 一致）：

- 双宿主检查范围：
  - `Codex`：`~/.codex/config.toml`、`~/.codex/skills/`
  - `Claude Code`：`~/.config/claude-code/mcp.json`、`~/.config/claude-code/settings.json`、`~/.claude/skills/`
- 安装范围：
  - MCP 与第三方 skills 统一安装到用户级全局目录（home 路径），不写入项目局部目录
- 必检 MCP：
  - `sequential-thinking`
  - `context7`
  - `serena`（优先 `uvx --from git+https://github.com/oraios/serena serena start-mcp-server`，兼容回退 `serena-mcp-server`/`npx -y mcp-server-serena`）
  - `fetch`（固定为 `uvx mcp-server-fetch`）
  - `playwright-mcp`
- 必检 skills：
  - `find-skills`
  - `skill-creator`
- 处理策略：
  - 直接 CLI 调用 `spec-first doctor` 时：缺失或配置错误会自动安装/自动修复
  - 通过 `spec-first:doctor` Skill 执行时：先展示修复计划并确认，再执行修复
  - 修复后必须复检，并在输出中给出修复前后状态差异

### spec-first update

升级后刷新 Skill/MCP/Hooks（建议日常使用）。

```bash
spec-first update [--dry-run] [--skip-mcp] [--skip-hooks]
```

- `--dry-run`: 仅预览变更，不写文件
- `--skip-mcp`: 跳过 MCP 配置补齐
- `--skip-hooks`: 跳过 Git hooks 刷新

### spec-first setup

兼容命令（已废弃）：内部转发到 `spec-first update`。

```bash
spec-first setup [--global]
```

> `--global` 已兼容处理，推荐直接改用 `spec-first update`。

### spec-first hooks

Git hooks 管理。

```bash
spec-first hooks install
spec-first hooks uninstall
spec-first hooks status
```

### spec-first viewer

可视化面板启动与地址输出。

```bash
spec-first viewer [start|open|url] [--host <host>] [--port <port>] [--project-root <path>] [--open] [--print-url] [--background]
```

### spec-first uninstall

清理 spec-first 宿主配置（卸载前执行）。

```bash
spec-first uninstall [--dry-run] [--keep-mcp]
```

---

## Skill 统一执行模型

每个 Skill 遵循相同的 6 阶段执行流程（P0 → P5）：

```text
P0_LOCATE — 定位与校验
  ├── 定位 Feature 工作区（specs/<featureId>/）
  └── 校验当前阶段是否允许执行该 Skill

P1_CONTEXT — 上下文加载
  ├── spec-first ai context <featureId>（获取 Context Pack）
  └── 读取阶段相关交付物

P2_GENERATE — AI 推理生成
  └── 根据 SKILL.md 指令生成内容（纯 AI 推理，无 CLI 调用）

P3_CONFIRM — 用户确认
  └── 展示生成内容，等待用户确认 / 修改 / 拒绝（可回退至 P2 修订）

P4_WRITE — 写入交付物
  ├── 写入目标文件
  └── spec-first id next <type> <abbr>（注册新 ID）

P5_SIDE_EFFECT — 副作用执行
  ├── spec-first matrix check <featureId>（校验追踪矩阵）
  ├── spec-first gate check <featureId>（校验 Gate）
  └── 更新运行态文件（findings.md / task_plan.md）
```

### 确认策略执行语义

每个 Skill 声明一种 confirm_policy，决定 P3 阶段的交互模式：

| policy | P3 行为 | 适用场景 |
| --- | --- | --- |
| auto | 跳过用户确认，P2 完成后直接进入 P4 | 只读/低风险操作（status、verify、feature-list、feature-current） |
| assisted | 展示生成内容摘要，用户可确认、修改或拒绝 | 中等风险操作（catchup、task、test、code-review、sync、doctor、feature-switch） |
| strict | 展示完整生成内容，用户必须逐项审阅后确认 | 高风险操作（init、spec、design、code、archive、orchestrate） |

- `auto` 的 Skill 不应写入关键交付物（spec.md/design.md/task_plan.md），仅允许写入运行态文件（findings.md）或不写入
- `assisted` 和 `strict` 的 Skill 在用户拒绝时必须回退至 P2 重新生成

### 错误处理规则

所有 Skill 遵循统一的错误处理策略：

| 阶段 | 错误场景 | 处理方式 |
| --- | --- | --- |
| P0 | 阶段不匹配（如在 01_specify 执行 06-task） | 终止执行，告知用户当前阶段和 Skill 要求的阶段 |
| P0 | Feature 不存在 | 终止执行，建议用户先执行 `spec-first init` |
| P1 | 上下文文件缺失（如 spec.md 不存在） | 警告用户缺失文件，询问是否继续（降级执行） |
| P2 | 生成内容为空或不完整 | 告知用户生成失败，建议检查输入上下文 |
| P3 | 用户拒绝 | 回退至 P2，根据用户反馈修改后重新展示 |
| P3 | 用户连续拒绝 3 次 | 终止执行，建议用户手动完成或调整需求 |
| P4 | 文件写入失败 | 终止执行，不执行 P5，告知用户错误原因 |
| P4 | CLI 命令失败（如 id next 返回错误） | 终止执行，展示 CLI 错误输出 |
| P5 | 副作用执行失败（如 matrix check 报错） | 不回滚 P4 已写入的文件，但警告用户副作用未完成 |

## 阶段 × Skill 映射

| 阶段 | Skill | 主要交付物 |
| --- | --- | --- |
| 00_init | 01-init（CLI `spec-first init`） | stage-state.json, constitution.md |
| 01_specify | 03-spec | spec.md |
| 02_design | 04-design, 05-research | design.md, contracts/, research.md |
| 03_plan | 06-task | task_plan.md, checklist.md |
| 04_implement | 07-code, 08-code-review | task_plan.md 状态更新 |
| 05_verify | 09-test | tests/*.test.md |
| 06_wrap_up | 10-archive | retro.md |
| 任意阶段 | 02-catchup | 无文件（恢复摘要） |
| 编排层 | 11-plan, 12-verify, 13-orchestrate | 执行计划 / 校验报告 |
| 辅助 | 14-status, 15-doctor, 16-sync, 17-feature-list, 18-feature-switch, 19-feature-current | 状态查询 / 环境诊断 / 矩阵同步 / Feature 管理 |

## 全局约束

### 人在回路

- 涉及关键交付物（`spec.md` / `design.md` / `task_plan.md` 等）写入前，**必须展示给用户确认**
- `confirm_policy = auto` 的 Skill 可跳过 P3，但仅允许只读或写入运行态文件（如 `findings.md`）
- `assisted` / `strict` 场景下，用户拒绝时必须根据反馈修改后重新展示

### 阶段纪律

- 不得跨阶段执行 Skill（如在 01_specify 阶段执行 06-task）
- 阶段推进必须通过 `spec-first stage advance`，不得直接修改 stage-state.json
- Gate 未通过时不得推进阶段，除非用户明确使用 `--force`

### ID 纪律

- 所有新建的 FR/DS/TASK/TC/RFC 必须通过 `spec-first id next` 注册
- 不得手动编造 ID
- ID 一旦注册不可复用
