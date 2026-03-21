# Spec-First API 文档

> **版本**: 1.1.4
> **生成时间**: 2026-03-20
> **数据来源**: `.spec-first/runtime/first/api-contracts.json`

本文档提供 Spec-First CLI 的完整 API 参考，包括 28 个命令的签名、参数说明与使用示例。

---

## 目录

- [CLI 命令参考](#cli-命令参考)
  - [ID 追溯命令](#id-追溯命令)
  - [矩阵管理命令](#矩阵管理命令)
  - [Feature 初始化命令](#feature-初始化命令)
  - [阶段流转命令](#阶段流转命令)
  - [RFC 变更管理命令](#rfc-变更管理命令)
  - [缺陷跟踪命令](#缺陷跟踪命令)
  - [度量与报告命令](#度量与报告命令)
  - [诊断与环境命令](#诊断与环境命令)
  - [Gate 门禁命令](#gate-门禁命令)
  - [AI 协作命令](#ai-协作命令)
  - [版本控制命令](#版本控制命令)
  - [Feature 管理命令](#feature-管理命令)
  - [安装与更新命令](#安装与更新命令)
  - [其他命令](#其他命令)
- [核心模块 API](#核心模块-api)
- [共享类型定义](#共享类型定义)

---

## CLI 命令参考

### ID 追溯命令

#### `spec-first id`

追溯 ID 生成、校验与检索。

**子命令**:
- `next` - 生成下一个追溯 ID
- `validate` - 校验 ID 格式
- `search` - 搜索 ID
- `list` - 列出所有 ID

**命令签名**:

```bash
# 生成下一个 ID
spec-first id next <type> <abbr> --feature <featureId> [--level <UT|IT|E2E|ST>]

# 校验 ID 格式
spec-first id validate <id>

# 搜索 ID
spec-first id search <query> --feature <featureId> [--type <type>]

# 列出所有 ID
spec-first id list --feature <featureId> [--type <type>]
```

**参数说明**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `type` | 枚举 | ID 类型：`FR` \| `DS` \| `TASK` \| `TC` \| `RFC` \| `REQ` \| `SYS` \| `ARCH` \| `MOD` \| `ATP` \| `STP` \| `ITP` \| `UTP` |
| `abbr` | string | 业务缩写（1-20 大写字母/数字） |
| `feature` | string | Feature ID 或前缀 |
| `level` | 枚举 | TC 级别：`UT` \| `IT` \| `E2E` \| `ST` |

**使用示例**:

```bash
# 生成新的功能需求 ID
spec-first id next FR AUTH --feature FSREQ-20260319-AUTH-001

# 生成单元测试用例 ID
spec-first id next TC AUTH --feature FSREQ-20260319-AUTH-001 --level UT

# 校验 ID 格式
spec-first id validate FR-AUTH-001

# 搜索包含 "AUTH" 的 ID
spec-first id search AUTH --feature FSREQ-20260319-AUTH-001

# 列出所有 TASK 类型的 ID
spec-first id list --feature FSREQ-20260319-AUTH-001 --type TASK
```

**源码位置**: `src/cli/commands/id.ts:1-198`

---

### 矩阵管理命令

#### `spec-first matrix`

同步追踪矩阵。

**子命令**:
- `check` - 检查矩阵一致性
- `export` - 导出矩阵
- `update` - 更新矩阵行

**命令签名**:

```bash
# 检查矩阵
spec-first matrix check <featureId>

# 导出矩阵
spec-first matrix export <featureId> [--format markdown|yaml]

# 更新矩阵行（需要确认）
spec-first matrix update <featureId> <id> [--status <status>] [--title <title>] [--upstream <ids>] [--downstream <ids>] --yes
```

**参数说明**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `status` | 枚举 | 状态：`Planned` \| `Implemented` \| `Verified` \| `Accepted` \| `Deferred` \| `Cancelled` \| `Exception` |
| `format` | 枚举 | 导出格式：`markdown` \| `yaml`（默认 markdown） |

**使用示例**:

```bash
# 检查矩阵一致性
spec-first matrix check FSREQ-20260319-AUTH-001

# 导出为 YAML 格式
spec-first matrix export FSREQ-20260319-AUTH-001 --format yaml

# 更新任务状态
spec-first matrix update FSREQ-20260319-AUTH-001 TASK-AUTH-001 --status Implemented --yes
```

**源码位置**: `src/cli/commands/matrix.ts:1-185`

---

### Feature 初始化命令

#### `spec-first init`

初始化 Feature 工作区。

**命令签名**:

```bash
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>]
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `feat` | string | 是 | Feature 缩写（1-20 大写字母/数字） |
| `mode` | 枚举 | 是 | 模式：`N`（新建） \| `I`（迭代） |
| `size` | 枚举 | 是 | 规模：`S`（小） \| `M`（中） \| `L`（大） |
| `platforms` | string | 是 | 目标平台列表（逗号分隔） |
| `feature-id` | string | 否 | 显式指定 Feature ID |

**使用示例**:

```bash
# 新建小型 Feature
spec-first init --feat AUTH --mode N --size S --platforms web,ios

# 迭代大型 Feature
spec-first init --feat PAYMENT --mode I --size L --platforms web,android,ios
```

**源码位置**: `src/cli/commands/init.ts:1-500`

---

### 阶段流转命令

#### `spec-first stage`

阶段流转管理。

**子命令**:
- `current` - 查看当前阶段
- `suggest` - 获取下一步建议
- `advance` - 推进阶段
- `cancel` - 取消 Feature

**命令签名**:

```bash
# 查看当前阶段
spec-first stage current <featureId>

# 获取下一步建议
spec-first stage suggest <featureId>

# 推进阶段（需要确认）
spec-first stage advance <featureId> --yes

# 取消 Feature（需要确认）
spec-first stage cancel <featureId> --reason "<reason>" --yes
```

**使用示例**:

```bash
# 查看当前阶段
spec-first stage current FSREQ-20260319-AUTH-001

# 获取下一步建议
spec-first stage suggest FSREQ-20260319-AUTH-001

# 推进到下一阶段
spec-first stage advance FSREQ-20260319-AUTH-001 --yes

# 取消 Feature
spec-first stage cancel FSREQ-20260319-AUTH-001 --reason "需求变更" --yes
```

**源码位置**: `src/cli/commands/stage.ts:1-270`

---

### RFC 变更管理命令

#### `spec-first rfc`

RFC 变更请求与状态管理。

**子命令**:
- `create` - 创建 RFC
- `submit` - 提交 RFC
- `transition` - 状态转换
- `list` - 列出 RFC
- `get` - 获取 RFC 详情

**命令签名**:

```bash
# 创建 RFC
spec-first rfc create <featureId> --title "<title>" [--level <Minor|Major|Critical>] [--by <by>] [--motivation "<text>"] [--description "<text>"]

# 提交 RFC（需要确认）
spec-first rfc submit <rfcId> --feature <featureId> --yes

# 状态转换（需要确认）
spec-first rfc transition <rfcId> <status> --feature <featureId> --yes

# 列出 RFC
spec-first rfc list <featureId>

# 获取 RFC 详情
spec-first rfc get <rfcId> --feature <featureId>
```

**参数说明**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `level` | 枚举 | 变更级别：`Minor` \| `Major` \| `Critical` |
| `status` | 枚举 | RFC 状态：`draft` \| `approved` \| `closed` \| `rejected` |

**使用示例**:

```bash
# 创建 Minor 级别 RFC
spec-first rfc create FSREQ-20260319-AUTH-001 --title "优化登录流程" --level Minor --by "leo"

# 提交 RFC
spec-first rfc submit RFC-AUTH-001 --feature FSREQ-20260319-AUTH-001 --yes

# 批准 RFC
spec-first rfc transition RFC-AUTH-001 approved --feature FSREQ-20260319-AUTH-001 --yes

# 列出所有 RFC
spec-first rfc list FSREQ-20260319-AUTH-001
```

**源码位置**: `src/cli/commands/rfc.ts:1-166`

---

### 缺陷跟踪命令

#### `spec-first defect`

缺陷跟踪与状态管理。

**子命令**:
- `register` - 注册缺陷
- `update` - 更新缺陷状态
- `list` - 列出缺陷
- `get` - 获取缺陷详情
- `escape-rate` - 计算逃逸率

**命令签名**:

```bash
# 注册缺陷（需要确认）
spec-first defect register <featureId> --severity <S1|S2|S3|S4> --title "<title>" [--reporter "<name>"] [--description "<text>"] [--discovered-in <stage>] [--linked-fr <frId>] --yes

# 更新缺陷状态（需要确认）
spec-first defect update <featureId> <seq> --status <status> [--actor <actor>] --yes

# 列出缺陷
spec-first defect list <featureId> [--status <status>] [--severity <severity>]

# 获取缺陷详情
spec-first defect get <featureId> <seq>

# 计算逃逸率
spec-first defect escape-rate <featureId>
```

**参数说明**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `severity` | 枚举 | 严重程度：`S1`（致命） \| `S2`（严重） \| `S3`（一般） \| `S4`（轻微） |
| `status` | 枚举 | 缺陷状态：`open` \| `fixing` \| `fixed` \| `verified` \| `wontfix` |

**使用示例**:

```bash
# 注册 S2 级别缺陷
spec-first defect register FSREQ-20260319-AUTH-001 --severity S2 --title "登录失败" --reporter "leo" --yes

# 更新为已修复
spec-first defect update FSREQ-20260319-AUTH-001 1 --status fixed --actor "leo" --yes

# 列出所有 open 状态缺陷
spec-first defect list FSREQ-20260319-AUTH-001 --status open

# 查看逃逸率
spec-first defect escape-rate FSREQ-20260319-AUTH-001
```

**源码位置**: `src/cli/commands/defect.ts:1-199`

---

### 度量与报告命令

#### `spec-first metrics`

覆盖率度量与健康评分。

**子命令**:
- `coverage` - 覆盖率报告
- `report` - 完整报告
- `health` - 健康度评分

**命令签名**:

```bash
# 覆盖率报告
spec-first metrics coverage <featureId> [--json] [--all]

# 完整报告
spec-first metrics report <featureId>

# 健康度评分
spec-first metrics health <featureId>
```

**使用示例**:

```bash
# 查看 JSON 格式覆盖率
spec-first metrics coverage FSREQ-20260319-AUTH-001 --json

# 生成完整报告
spec-first metrics report FSREQ-20260319-AUTH-001

# 查看健康度评分
spec-first metrics health FSREQ-20260319-AUTH-001
```

**源码位置**: `src/cli/commands/metrics.ts:1-212`

---

### 诊断与环境命令

#### `spec-first doctor`

环境诊断与修复。

**命令签名**:

```bash
spec-first doctor [featureId] [--fix]
```

**参数说明**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `featureId` | string | 可选，指定 Feature ID |
| `fix` | flag | 自动修复问题（需要确认） |

**使用示例**:

```bash
# 诊断当前环境
spec-first doctor

# 诊断指定 Feature
spec-first doctor FSREQ-20260319-AUTH-001

# 自动修复问题
spec-first doctor --fix
```

**源码位置**: `src/cli/commands/doctor.ts:1-600`

---

### Gate 门禁命令

#### `spec-first gate`

阶段质量门禁评估。

**子命令**:
- `check` - 执行 Gate 检查
- `history` - 查看历史记录
- `conditions` - 查看条件定义
- `validate-config` - 校验配置

**命令签名**:

```bash
# 执行 Gate 检查
spec-first gate check <featureId> [--json] [--no-persist]

# 查看历史记录
spec-first gate history <featureId>

# 查看条件定义
spec-first gate conditions <featureId>

# 校验配置
spec-first gate validate-config
```

**使用示例**:

```bash
# 执行 Gate 检查并输出 JSON
spec-first gate check FSREQ-20260319-AUTH-001 --json

# 查看历史记录
spec-first gate history FSREQ-20260319-AUTH-001

# 查看当前阶段条件
spec-first gate conditions FSREQ-20260319-AUTH-001
```

**源码位置**: `src/cli/commands/gate.ts:1-332`

#### `spec-first golive`

上线就绪检查与批准。

**命令签名**:

```bash
spec-first golive check <featureId>
```

**使用示例**:

```bash
# 检查上线就绪状态
spec-first golive check FSREQ-20260319-AUTH-001
```

**源码位置**: `src/cli/commands/gate.ts:37-44,211-240`

---

### AI 协作命令

#### `spec-first ai`

会话恢复与上下文摘要。

**子命令**:
- `context` - 构建上下文包
- `catchup` - 执行会话恢复
- `stats` - 查看 AI 调用统计

**命令签名**:

```bash
# 构建上下文包
spec-first ai context <featureId> [--full] [--expand <path1,path2>]

# 执行会话恢复
spec-first ai catchup <featureId>

# 查看 AI 调用统计
spec-first ai stats <featureId>
```

**使用示例**:

```bash
# 构建完整上下文包
spec-first ai context FSREQ-20260319-AUTH-001 --full

# 执行 6 步会话恢复
spec-first ai catchup FSREQ-20260319-AUTH-001

# 查看 AI 调用统计
spec-first ai stats FSREQ-20260319-AUTH-001
```

**源码位置**: `src/cli/commands/ai.ts:1-147`

#### `spec-first orchestrate`

受控编排协调入口。

**命令签名**:

```bash
spec-first orchestrate [featureId] [--auto] [--resume] [--auto-advance] --yes
```

**参数说明**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `auto` | flag | 启用自动模式 |
| `resume` | flag | 恢复上次会话 |
| `auto-advance` | flag | 自动推进阶段 |

**使用示例**:

```bash
# 启动编排
spec-first orchestrate FSREQ-20260319-AUTH-001 --yes

# 自动模式
spec-first orchestrate FSREQ-20260319-AUTH-001 --auto --yes

# 恢复会话
spec-first orchestrate FSREQ-20260319-AUTH-001 --resume --yes
```

**源码位置**: `src/cli/commands/orchestrate.ts:1-163`

---

### 版本控制命令

#### `spec-first commit`

规范提交并关联追溯 ID。

**命令签名**:

```bash
spec-first commit --message "<msg>" [--task <taskId>] --yes
```

**参数说明**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `message` | string | 提交信息 |
| `task` | string | 关联的 TASK ID |

**使用示例**:

```bash
# 关联 TASK 提交
spec-first commit --message "实现登录功能" --task TASK-AUTH-001 --yes
```

**源码位置**: `src/cli/commands/commit.ts:1-134`

---

### Feature 管理命令

#### `spec-first feature`

Feature 列表、切换与查看。

**子命令**:
- `list` - 列出所有 Feature
- `current` - 查看当前 Feature
- `switch` - 切换 Feature

**命令签名**:

```bash
# 列出所有 Feature
spec-first feature list

# 查看当前 Feature
spec-first feature current

# 切换 Feature（需要确认）
spec-first feature switch <featureId> --yes
```

**使用示例**:

```bash
# 列出所有 Feature
spec-first feature list

# 查看当前 Feature
spec-first feature current

# 切换到指定 Feature
spec-first feature switch FSREQ-20260319-AUTH-001 --yes
```

**源码位置**: `src/cli/commands/feature.ts:1-152`

#### `spec-first done`

将 Feature 从 07_release 收口到 08_done。

**命令签名**:

```bash
spec-first done <featureId> --yes
```

**使用示例**:

```bash
# 完成 Feature
spec-first done FSREQ-20260319-AUTH-001 --yes
```

**源码位置**: `src/cli/commands/done.ts:1-19`

---

### 安装与更新命令

#### `spec-first hooks`

Git Hooks 安装与状态管理。

**子命令**:
- `install` - 安装 Hooks
- `uninstall` - 卸载 Hooks
- `status` - 查看状态

**命令签名**:

```bash
# 安装 Hooks（需要确认）
spec-first hooks install --yes

# 卸载 Hooks（需要确认）
spec-first hooks uninstall --yes

# 查看状态
spec-first hooks status
```

**源码位置**: `src/cli/commands/hooks.ts:1-84`

#### `spec-first update`

升级后刷新 Skill/MCP/Hooks。

**命令签名**:

```bash
spec-first update [--dry-run] [--skip-mcp] [--skip-hooks] [--host <target>] [--component <set>] [--from-postinstall] --yes
```

**参数说明**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `host` | string | 目标宿主：`claude` \| `codex` \| `gemini` \| `cursor` \| `generic` \| `all`（可多次/逗号分隔） |
| `component` | string | 组件集：`skills` \| `mcp` \| `hooks` \| `viewer`（可多次/逗号分隔） |

**使用示例**:

```bash
# 模拟更新
spec-first update --dry-run

# 更新 Claude 环境
spec-first update --host claude --yes

# 只更新 Skills
spec-first update --component skills --yes
```

**源码位置**: `src/cli/commands/update.ts:1-501`

#### `spec-first uninstall`

清理宿主配置（卸载前执行）。

**命令签名**:

```bash
spec-first uninstall [--dry-run] [--keep-mcp] [--host <target>] --yes
```

**使用示例**:

```bash
# 模拟卸载
spec-first uninstall --dry-run

# 卸载 Claude 配置
spec-first uninstall --host claude --yes
```

**源码位置**: `src/cli/commands/uninstall.ts:1-341`

---

### 其他命令

#### `spec-first analyze`

跨产物一致性分析。

**命令签名**:

```bash
spec-first analyze <featureId> [--out <path>]
```

**使用示例**:

```bash
# 分析产物一致性
spec-first analyze FSREQ-20260319-AUTH-001

# 输出到文件
spec-first analyze FSREQ-20260319-AUTH-001 --out ./analysis-report.json
```

**源码位置**: `src/cli/commands/analyze.ts:1-56`

#### `spec-first trace`

追溯链修复与校验。

**子命令**:
- `fix` - 修复追溯链
- `validate` - 校验追溯链

**命令签名**:

```bash
# 修复追溯链
spec-first trace fix <featureId>

# 校验追溯链
spec-first trace validate <featureId>
```

**源码位置**: `src/cli/commands/trace.ts:1-103`

#### `spec-first validate`

产物格式校验。

**子命令**:
- `format` - 格式校验
- `matrix` - 矩阵校验
- `all` - 全部校验

**命令签名**:

```bash
# 格式校验
spec-first validate format <featureId>

# 矩阵校验
spec-first validate matrix <featureId>

# 全部校验
spec-first validate all <featureId>
```

**源码位置**: `src/cli/commands/validate.ts:1-110`

#### `spec-first viewer`

Stage Viewer 可视化面板。

**命令签名**:

```bash
spec-first viewer [start|open|url] [--host <host>] [--port <port>] [--project-root <path>] [--open] [--print-url] [--background]
```

**使用示例**:

```bash
# 启动 Viewer
spec-first viewer start --port 3000

# 打开 Viewer
spec-first viewer open

# 打印 URL
spec-first viewer url --print-url
```

**源码位置**: `src/cli/commands/viewer.ts:1-119`

#### `spec-first first`

项目首轮认知 runtime/docs 校验。

**命令签名**:

```bash
spec-first first [--check-health]
```

**使用示例**:

```bash
# 校验 runtime/docs
spec-first first

# 检查健康状态
spec-first first --check-health
```

**源码位置**: `src/cli/commands/first.ts:1-82`

#### `spec-first onboarding`

新手引导 - 交互式场景识别与学习路径推荐。

**命令签名**:

```bash
spec-first onboarding
```

**源码位置**: `src/cli/commands/onboarding.ts`

#### `spec-first skill`

动态渲染 skill 内容。

**命令签名**:

```bash
spec-first skill render <skill-name> [--feature <featureId>] [--input <rawUserInput>]
```

**使用示例**:

```bash
# 渲染 Skill
spec-first skill render code --feature FSREQ-20260319-AUTH-001
```

**源码位置**: `src/cli/commands/skill.ts:1-104`

#### `spec-first status`

当前 Feature 状态概览与风险快照。

**命令签名**:

```bash
spec-first status [featureId]
```

**使用示例**:

```bash
# 查看当前 Feature 状态
spec-first status

# 查看指定 Feature 状态
spec-first status FSREQ-20260319-AUTH-001
```

**源码位置**: `src/cli/commands/status.ts:1-229`

#### `spec-first setup` (已废弃)

注册 Claude Code + Codex Skill 命令。

**替代命令**: `spec-first update`

**源码位置**: `src/cli/commands/setup.ts:1-16`

---

## 核心模块 API

### process-engine

阶段状态机（8 active + 2 terminal），驱动 Feature 生命周期、ID 生成、目录初始化。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `init` | `init(input: InitInput): InitResult` | 初始化 Feature 工作区 |
| `advance` | `advance(featureId: string, projectRoot: string): AdvanceResult` | 推进阶段 |
| `cancel` | `cancel(featureId: string, projectRoot: string, reason: string): AdvanceResult` | 取消 Feature |
| `currentFeature` | `currentFeature(projectRoot: string): string \| undefined` | 获取当前 Feature |
| `getFeatureState` | `getFeatureState(featureId: string, projectRoot: string): StageState` | 获取 Feature 状态 |
| `checkDependencies` | `checkDependencies(featureId: string, stage: Stage, projectRoot: string, profile: string): DependencyCheckResult` | 检查阶段依赖 |
| `decideNextStep` | `decideNextStep(context: DecideNextStepContext): NextStepResult` | 决策下一步 |

**错误类型**:
- `GateFailedError` - Gate 校验失败
- `GateUnavailableError` - Gate 不可用

**源码位置**: `src/core/process-engine/`

---

### gate-engine

阶段质量门禁评估（19 条：16 blocking + 3 warning）、豁免管理、PRD 评分。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `evaluateGate` | `evaluateGate(featureId: string, projectRoot: string, options?: { persist?: boolean }): GateResult` | Gate 评估 |
| `getConditions` | `getConditions(stage: Stage, projectType: string, profile: string, projectRoot: string): ConditionDefinition[]` | 获取条件定义 |
| `getGateHistory` | `getGateHistory(featureId: string, projectRoot: string): GateResult[]` | 获取历史记录 |
| `checkGoLive` | `checkGoLive(featureId: string, projectRoot: string): GoLiveResult` | 上线就绪检查 |
| `analyzeArtifacts` | `analyzeArtifacts(featureId: string, projectRoot: string): AnalysisResult` | 跨产物一致性分析 |

**源码位置**: `src/core/gate-engine/`

---

### trace-engine

追溯 ID 生成/校验/搜索、覆盖率矩阵（C3/C4/C6/C8/C9）、Exception 机制。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `nextId` | `nextId(input: NextIdInput): { id: string }` | 生成下一个 ID |
| `validateId` | `validateId(id: string): IdValidationResult` | 校验 ID 格式 |
| `searchId` | `searchId(query: string, featureId: string, projectRoot: string, type?: IdType): SearchResult[]` | 搜索 ID |
| `listIds` | `listIds(featureId: string, projectRoot: string, type?: IdType): SearchResult[]` | 列出 ID |
| `checkMatrix` | `checkMatrix(featureId: string, projectRoot: string): MatrixCheckResult` | 检查矩阵 |
| `exportMatrix` | `exportMatrix(featureId: string, projectRoot: string, format: 'markdown' \| 'yaml'): string` | 导出矩阵 |
| `updateMatrixRow` | `updateMatrixRow(featureId: string, projectRoot: string, id: string, updates: Record<string, unknown>): void` | 更新矩阵行 |
| `getCoverage` | `getCoverage(featureId: string, projectRoot: string): CoverageMetrics` | 计算覆盖率 |
| `createTraceContext` | `createTraceContext(rows: MatrixRow[]): TraceContext` | 创建追溯上下文 |

**源码位置**: `src/core/trace-engine/`

---

### skill-runtime

Skill 分发、prompt 组装、hard-gate 校验（三层路由）。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `loadSkill` | `loadSkill(skillPath: string, context: LoadSkillContext): string` | 加载 Skill |
| `resolveSkillPath` | `resolveSkillPath(skillName: string, projectRoot: string): string \| undefined` | 解析 Skill 路径 |
| `evaluatePolicy` | `evaluatePolicy(input: PolicyInput): ConfirmPolicy` | 确认策略评估 |
| `bootstrapFirstRuntime` | `bootstrapFirstRuntime(projectRoot: string): BootstrapResult` | First runtime 启动引导 |

**源码位置**: `src/core/skill-runtime/`

---

### ai-orchestrator

Auto-loop、catchup 上下文恢复、context-pack。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `buildContextPack` | `buildContextPack(featureId: string, projectRoot: string, options?: ContextPackOptions): ContextPack` | 构建上下文包 |
| `catchup` | `catchup(featureId: string, projectRoot: string): CatchupResult` | 执行 6 步会话恢复 |
| `runAutoLoop` | `runAutoLoop(options: AutoLoopOptions): Promise<AutoLoopResult>` | 自动循环执行 |
| `readStats` | `readStats(featureId: string, projectRoot: string): AiStatEntry[]` | 读取 AI 统计 |
| `loadTodoState` | `loadTodoState(featureId: string, projectRoot: string): TodoState \| undefined` | 加载 Todo 状态 |

**源码位置**: `src/core/ai-orchestrator/`

---

### change-mgr

RFC + Defect 状态机、影响分析。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `createRfc` | `createRfc(featureId: string, input: RfcCreateInput, projectRoot: string): RfcRecord` | 创建 RFC |
| `transitionRfc` | `transitionRfc(rfcId: string, status: RfcStatus, featureId: string, projectRoot: string): RfcRecord` | RFC 状态转换 |
| `registerDefect` | `registerDefect(featureId: string, input: DefectCreateInput, projectRoot: string): DefectRecord` | 注册缺陷 |
| `transitionDefect` | `transitionDefect(featureId: string, seq: number, status: DefectStatus, projectRoot: string): DefectRecord` | 缺陷状态转换 |
| `getEscapeRate` | `getEscapeRate(featureId: string, projectRoot: string): EscapeRateResult` | 获取逃逸率 |

**源码位置**: `src/core/change-mgr/`

---

### metrics-engine

健康度评分（H1）、瓶颈检测（R1-R5）。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `calcHealthScore` | `calcHealthScore(coverage: CoverageMetrics, defectCount: number, rfcCount: number): HealthScoreResult` | 计算健康分 |
| `detectBottlenecks` | `detectBottlenecks(coverage: CoverageMetrics): Bottleneck[]` | 检测瓶颈 |

**源码位置**: `src/core/metrics-engine/`

---

### validators

产物格式校验（ID 格式、必需章节、追踪矩阵一致性）。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `validateFormat` | `validateFormat(featureId: string, projectRoot: string): FormatValidationResult` | 格式校验 |

**源码位置**: `src/core/validators/`

---

### task-plan

task_plan.md 解析、Todo 状态管理。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `readTaskPlan` | `readTaskPlan(projectRoot: string, featureId: string): TaskPlan \| undefined` | 读取任务计划 |
| `getCurrentTaskId` | `getCurrentTaskId(projectRoot: string, featureId: string): string \| undefined` | 获取当前任务 ID |

**源码位置**: `src/core/task-plan/`

---

### template

Handlebars 模板渲染、产物生成。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `computeTemplateHashes` | `computeTemplateHashes(templatesDir: string, basePath: string): Promise<Record<string, string>>` | 计算模板哈希 |
| `loadHashRegistry` | `loadHashRegistry(projectRoot: string): Promise<HashRegistry>` | 加载哈希注册表 |
| `decideBatchUpdate` | `decideBatchUpdate(diff: HashDiff, projectRoot: string): BatchUpdateDecision` | 批量更新决策 |

**源码位置**: `src/core/template/`

---

### tool-integration

AI runtime hooks、context 同步。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `installHooks` | `installHooks(projectRoot: string, options?: { dryRun?: boolean }): string[]` | 安装 Git Hooks |
| `uninstallHooks` | `uninstallHooks(projectRoot: string): string[]` | 卸载 Git Hooks |
| `registerAIHooks` | `registerAIHooks(projectRoot: string, options?: { dryRun?: boolean }): AIHooksResult` | 注册 AI Hooks |

**源码位置**: `src/core/tool-integration/`

---

### migrations

状态文件版本迁移、升级兼容处理。

**公开 API**:

| 函数 | 签名 | 说明 |
|------|------|------|
| `findManifestForVersion` | `findManifestForVersion(version: string, projectRoot: string): ManifestResult \| undefined` | 查找迁移清单 |
| `executeManifest` | `executeManifest(manifest: MigrationManifest, projectRoot: string, strategy: ConflictStrategy): ManifestExecutionResult` | 执行迁移 |

**源码位置**: `src/core/migrations/`

---

## 共享类型定义

### Stage

阶段枚举（8 active + 2 terminal）。

```typescript
type Stage =
  | '00_init'
  | '01_specify'
  | '02_design'
  | '03_plan'
  | '04_implement'
  | '05_verify'
  | '06_wrap_up'
  | '07_release'
  | '08_done'       // terminal
  | '09_cancelled'  // terminal
```

**终态判断**:
```typescript
const TERMINAL_STAGES: ReadonlySet<Stage> = new Set(['08_done', '09_cancelled'])
```

### ID 类型

```typescript
// 可生成的 ID 类型
type NextIdType = 'FR' | 'DS' | 'TASK' | 'TC' | 'RFC' | 'REQ' | 'SYS' | 'ARCH' | 'MOD' | 'ATP' | 'STP' | 'ITP' | 'UTP'

// 所有 ID 类型
type IdType = NextIdType | 'Feature'

// TC 级别前缀
type TcLevel = 'UT' | 'IT' | 'E2E' | 'ST'
```

### Feature 元数据

```typescript
type Mode = 'N' | 'I'  // N=新建，I=迭代
type Size = 'S' | 'M' | 'L'  // S=小，M=中，L=大
```

### ExitCode

CLI 退出码。

```typescript
enum ExitCode {
  SUCCESS = 0,
  GATE_FAILED = 1,
  VALIDATION_ERROR = 2,
  CONFIG_ERROR = 3,
  IO_ERROR = 4,
  UNKNOWN_ERROR = 5,
  INVALID_ARGS = 6,
  GENERAL_ERROR = 7
}
```

### 核心接口

#### StageState

```typescript
interface StageState {
  featureId: string
  mode: Mode
  size: Size
  platforms: string[]
  currentStage: Stage
  history: StageHistoryEntry[]
  terminal: boolean
  createdAt: string
  updatedAt: string
}
```

#### GateResult

```typescript
interface GateResult {
  status: 'passed' | 'failed' | 'warning'
  stage: Stage
  timestamp: string
  conditions: ConditionResult[]
  waivers?: WaiverRecord[]
  suggestions?: string[]
}
```

#### CoverageMetrics

```typescript
interface CoverageMetrics {
  C3: number  // TASK 覆 FR（传递链）
  C4: number  // TC 直接覆 FR
  C6: number  // TASK 已实现
  C8: number  // TASK 有上游
  C9: number  // TC 有上游 FR
}
```

**源码位置**: `src/shared/types.ts:1-248`

---

## 路由器 API

### registerCommand

注册顶层命令。

```typescript
function registerCommand(
  name: string,
  description: string,
  handler: CommandHandler,
  options?: RegisterCommandOptions
): void
```

### dispatch

分发命令，返回 ExitCode。

```typescript
function dispatch(args: string[]): Promise<number>
```

### getCliVersion

获取 CLI 版本号。

```typescript
function getCliVersion(): string
```

**源码位置**: `src/cli/router.ts:1-157`

---

## 证据来源

本文档基于以下源码生成：

- `src/cli/index.ts:36-101` — CLI 命令注册
- `src/cli/router.ts:1-157` — 路由分发逻辑
- `src/cli/commands/*.ts` — 28 个命令处理器
- `src/shared/types.ts:1-248` — 共享类型定义
- `src/core/*/index.ts` — 核心模块公共 API
