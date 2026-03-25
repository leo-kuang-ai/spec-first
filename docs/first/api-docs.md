# Spec-First CLI API 接口规范

> 基于 `.spec-first/runtime/first/api-contracts.json` 生成

## 概述

Spec-First 是一个 AI 工作流 CLI 工具，提供规范驱动开发的质量门禁、追溯链和 Feature 生命周期管理。

- **CLI 入口**: `spec-first`
- **模块导出**: `./dist/cli/index.js` (ESM)
- **类型定义**: `./dist/cli/index.d.ts`

---

## 全局选项

| 选项 | 说明 |
|------|------|
| `--help, -h` | 显示帮助信息 |
| `--version, -v` | 显示版本号 |
| `--yes` | 跳过确认提示，自动确认 |
| `--json` | JSON 格式输出 |
| `--feature <featureId>` | 指定操作的 Feature ID |
| `--mode <N\|I>` | 设置模式：N=Normal, I=Interactive |
| `--size <S\|M\|L>` | 设置 Feature 规模 |

---

## 命令分类

### 核心流程

| 命令 | 说明 | 主要子命令 |
|------|------|-----------|
| `init` | 初始化 Feature 工作区 | — |
| `stage` | 阶段流转管理 | `current`, `suggest`, `advance`, `cancel` |
| `gate` | 阶段质量门禁评估 | `check`, `history`, `conditions`, `validate-config` |
| `orchestrate` | 受控编排协调入口 | — |
| `golive` | 上线就绪检查与批准 | `check` |
| `done` | Feature 收口 | — |

#### init

初始化 Feature 工作区。

```bash
spec-first init --mode <N|I> --size <S|M|L>
```

| 选项 | 说明 |
|------|------|
| `--mode <N\|I>` | 模式：N=Normal, I=Interactive |
| `--size <S\|M\|L>` | 规模：S=Small, M=Medium, L=Large |

#### stage

阶段流转管理。

```bash
spec-first stage current                    # 查看当前阶段
spec-first stage suggest                    # 建议下一阶段
spec-first stage advance --reason <reason>  # 推进阶段
spec-first stage cancel --reason <reason>   # 取消 Feature
```

| 选项 | 说明 |
|------|------|
| `--reason <reason>` | 阶段变更原因 |
| `--yes` | 跳过确认 |

#### status / transition / validate

节点状态、推进与校验。

```bash
spec-first status <featureId>                 # 查看节点状态
spec-first transition <featureId>             # 推进或取消节点
spec-first validate format <featureId>        # 校验产物格式
spec-first validate links <featureId>         # 校验文档关联
spec-first done <featureId>                   # 收口到 08_done
```

| 选项 | 说明 |
|------|------|
| `--feature <featureId>` | 指定 Feature |
| `--json` | JSON 格式输出 |
| `--no-persist` | 不持久化结果 |

#### orchestrate

受控编排协调入口。

```bash
spec-first orchestrate --feature <featureId> --mode <N|I>
spec-first orchestrate --auto --feature <featureId>
spec-first orchestrate --resume --feature <featureId>
spec-first orchestrate --auto-advance --feature <featureId>
```

| 选项 | 说明 |
|------|------|
| `--auto` | 自动模式 |
| `--resume` | 恢复中断的编排 |
| `--auto-advance` | 自动推进阶段 |
| `--mode <N\|I>` | 模式 |
| `--size <S\|M\|L>` | 规模 |
| `--yes` | 跳过确认 |

---

### Feature 管理

| 命令 | 说明 | 主要子命令 |
|------|------|-----------|
| `feature` | Feature 列表、切换与查看 | `list`, `current`, `switch` |
| `status` | 当前 Feature 状态概览 | — |
| `done` | Feature 收口 | — |

#### feature

Feature 管理。

```bash
spec-first feature list          # 列出所有 Feature
spec-first feature current       # 查看当前 Feature
spec-first feature switch <id>   # 切换 Feature
```

| 选项 | 说明 |
|------|------|
| `--yes` | 跳过确认 |

#### status

当前 Feature 状态概览与风险快照。

```bash
spec-first status --feature <featureId>
spec-first status --feature <featureId> --json
```

---

### 追溯 ID 管理

| 命令 | 说明 | 主要子命令 |
|------|------|-----------|
| `id` | 追溯 ID 生成、校验与检索 | `next`, `validate`, `search`, `list` |
| `trace` | 追溯链修复与校验 | `validate` |

#### trace

追溯链校验。

```bash
spec-first validate links <featureId>
```

---

### 质量与度量

| 命令 | 说明 | 主要子命令 |
|------|------|-----------|
| `gate` | 阶段质量门禁评估 | `check`, `history`, `conditions`, `validate-config` |
| `metrics` | 覆盖率度量与健康评分 | `coverage`, `health` |
| `validate` | 产物格式校验 | — |
| `analyze` | 跨产物一致性分析 | — |

#### metrics

节点健康与产物校验。

```bash
spec-first status <featureId>              # 节点状态与任务进度
spec-first validate format <featureId>     # 产物格式
spec-first validate links <featureId>      # 文档关联
```

| 选项 | 说明 |
|------|------|
| `--feature <featureId>` | 指定 Feature |
| `--json` | JSON 格式输出 |

#### validate

产物格式校验。

```bash
spec-first validate --feature <featureId>
spec-first validate --feature <featureId> --json
```

#### analyze

跨产物一致性分析。

```bash
spec-first analyze --feature <featureId>
spec-first analyze --feature <featureId> --json
```

---

### 变更管理

| 命令 | 说明 | 主要子命令 |
|------|------|-----------|
| `defect` | 缺陷跟踪与状态管理 | `create`, `update`, `list`, `show` |
| `rfc` | RFC 变更请求与状态管理 | `create`, `update`, `approve`, `reject`, `close`, `list`, `show` |

#### defect

缺陷跟踪。

```bash
spec-first defect create --feature <featureId> --severity <S1|S2|S3|S4>
spec-first defect update <id> --status <status>
spec-first defect list --feature <featureId>
spec-first defect show <id>
```

| 选项 | 说明 |
|------|------|
| `--feature <featureId>` | 指定 Feature |
| `--severity <S1\|S2\|S3\|S4>` | 严重级别 |
| `--status <status>` | 状态 |

#### rfc

RFC 变更请求。

```bash
spec-first rfc create --feature <featureId> --level <Minor|Major|Critical>
spec-first rfc update <id>
spec-first rfc approve <id>
spec-first rfc reject <id>
spec-first rfc close <id>
spec-first rfc list --feature <featureId>
spec-first rfc show <id>
```

| 选项 | 说明 |
|------|------|
| `--feature <featureId>` | 指定 Feature |
| `--level <Minor\|Major\|Critical>` | 变更级别 |
| `--yes` | 跳过确认 |

---

### 文档与 AI 协作

| 命令 | 说明 | 主要子命令 |
|------|------|-----------|
| `docs` | 文档索引与关联校验 | `validate`, `list` |
| `ai` | 会话恢复与上下文摘要 | `catchup`, `context-pack` |
| `skill` | 动态渲染 skill 内容 | — |

#### docs

文档管理。

```bash
spec-first docs validate --feature <featureId>  # 校验文档关联
spec-first docs list --feature <featureId>      # 列出文档
```

#### ai

AI 协作支持。

```bash
spec-first ai catchup --feature <featureId>        # 会话恢复
spec-first ai context-pack --feature <featureId>   # 上下文打包
```

| 选项 | 说明 |
|------|------|
| `--feature <featureId>` | 指定 Feature |
| `--compact` | 紧凑模式 |

#### skill

动态渲染 skill 内容。

```bash
spec-first skill --skill <skillName> --feature <featureId>
```

---

### 工具与维护

| 命令 | 说明 | 主要子命令 |
|------|------|-----------|
| `doctor` | 环境诊断与修复 | — |
| `update` | 升级后刷新 Skill/MCP/Hooks | — |
| `hooks` | Git Hooks 管理 | `install`, `uninstall`, `status` |
| `commit` | 规范提交并关联追溯 ID | — |
| `setup` | 注册 Claude Code + Codex Skill 命令 | — |
| `uninstall` | 清理宿主配置 | — |

#### doctor

环境诊断。

```bash
spec-first doctor        # 诊断
spec-first doctor --fix  # 自动修复
```

| 选项 | 说明 |
|------|------|
| `--fix` | 自动修复问题 |
| `--yes` | 跳过确认 |

#### hooks

Git Hooks 管理。

```bash
spec-first hooks install    # 安装 hooks
spec-first hooks uninstall  # 卸载 hooks
spec-first hooks status     # 查看状态
```

#### commit

规范提交。

```bash
spec-first commit --feature <featureId>
```

---

### 可视化与新手引导

| 命令 | 说明 | 主要子命令 |
|------|------|-----------|
| `viewer` | Stage Viewer 可视化面板 | `start`, `bootstrap` |
| `onboarding` | 新手引导 | — |
| `first` | 项目首轮认知校验 | — |

#### viewer

可视化面板。

```bash
spec-first viewer start --port <port>    # 启动服务
spec-first viewer bootstrap --open       # 引导启动
```

| 选项 | 说明 |
|------|------|
| `--port <port>` | 指定端口 |
| `--open` | 自动打开浏览器 |

#### onboarding

新手引导。

```bash
spec-first onboarding                    # 交互式引导
spec-first onboarding --scenario <name>  # 指定场景
```

#### first

项目首轮认知校验。

```bash
spec-first first --check-health  # 健康检查
```

---

### 其他命令

| 命令 | 说明 |
|------|------|
| `batch-test` | 批量执行测试（临时命令） |

---

## 退出码语义

| 退出码 | 常量 | 说明 |
|--------|------|------|
| `0` | `SUCCESS` | 操作成功 |
| `1` | `GATE_FAILED` | Gate 校验失败 |
| `2` | `VALIDATION_ERROR` | 参数校验失败 |
| `3` | `CONFIG_ERROR` | 配置错误 |
| `4` | `IO_ERROR` | IO 操作失败 |
| `5` | `UNKNOWN_ERROR` | 未知错误 |
| `6` | `INVALID_ARGS` | 无效参数 |
| `7` | `GENERAL_ERROR` | 通用错误 |

### 命令特定退出码

| 命令 | 退出码 | 说明 |
|------|--------|------|
| `gate check` | 0 | Pass |
| `gate check` | 2 | Fail / Validation Error |
| `gate check` | 3 | Config Error |
| `stage advance` | 0 | Success |
| `stage advance` | 1 | Gate Failed |
| `orchestrate` | 0 | Success |
| `orchestrate` | 1 | Gate Failed |

---

## 命令总计

共 **27** 个命令，覆盖：
- 核心流程（6 个）
- Feature 管理（3 个）
- 追溯 ID 管理（2 个）
- 质量与度量（4 个）
- 变更管理（2 个）
- 文档与 AI 协作（3 个）
- 工具与维护（6 个）
- 可视化与引导（3 个）
- 其他（1 个）
