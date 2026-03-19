# CLI 命令参考

## 概述

Spec-First CLI 提供 27 个命令，覆盖 Feature 生命周期管理、追溯 ID 管理、质量门禁等核心功能。

## 命令分类

### Feature 管理

| 命令 | 说明 | Handler |
|------|------|---------|
| `spec-first init` | 初始化 Feature 工作区 | `handleInit` |
| `spec-first feature current` | 查看当前 Feature | `handleFeature` |
| `spec-first feature switch <id>` | 切换 Feature | `handleFeature` |
| `spec-first feature list` | 列出所有 Feature | `handleFeature` |

### Stage 管理

| 命令 | 说明 | Handler |
|------|------|---------|
| `spec-first stage current` | 查看当前阶段 | `handleStage` |
| `spec-first stage suggest` | 建议下一阶段 | `handleStage` |
| `spec-first stage advance` | 推进阶段 | `handleStage` |
| `spec-first stage cancel` | 取消 Feature | `handleStage` |

### Gate 门禁

| 命令 | 说明 | Handler |
|------|------|---------|
| `spec-first gate check` | 执行 Gate 校验 | `handleGate` |
| `spec-first golive` | 上线就绪检查 | `handleGoLive` |

### 追溯 ID

| 命令 | 说明 | Handler |
|------|------|---------|
| `spec-first id generate <type>` | 生成追溯 ID | `handleId` |
| `spec-first id validate <id>` | 校验 ID 格式 | `handleId` |
| `spec-first id search <id>` | 搜索 ID | `handleId` |

### 追踪矩阵

| 命令 | 说明 | Handler |
|------|------|---------|
| `spec-first matrix sync` | 同步追踪矩阵 | `handleMatrix` |
| `spec-first matrix check` | 校验矩阵一致性 | `handleMatrix` |
| `spec-first matrix update` | 更新矩阵状态 | `handleMatrix` |

### 变更管理

| 命令 | 说明 | Handler |
|------|------|---------|
| `spec-first rfc create` | 创建 RFC | `handleRfc` |
| `spec-first rfc approve` | 批准 RFC | `handleRfc` |
| `spec-first defect create` | 创建缺陷 | `handleDefect` |
| `spec-first defect list` | 列出缺陷 | `handleDefect` |

### AI 编排

| 命令 | 说明 | Handler |
|------|------|---------|
| `spec-first ai context` | 获取 Context Pack | `handleAi` |
| `spec-first ai catchup` | 恢复上下文 | `handleAi` |
| `spec-first orchestrate` | 受控编排协调 | `handleOrchestrate` |

### 工具命令

| 命令 | 说明 | Handler |
|------|------|---------|
| `spec-first metrics` | 查看覆盖率指标 | `handleMetrics` |
| `spec-first status` | 状态概览 | `handleStatus` |
| `spec-first doctor` | 环境诊断 | `handleDoctor` |
| `spec-first skill render` | 渲染 Skill 内容 | `handleSkill` |
| `spec-first analyze` | 跨产物一致性分析 | `handleAnalyze` |
| `spec-first trace repair` | 修复追溯链 | `handleTrace` |
| `spec-first validate` | 产物格式校验 | `handleValidate` |

### 其他

| 命令 | 说明 | Handler |
|------|------|---------|
| `spec-first commit` | 规范提交 | `handleCommit` |
| `spec-first setup` | 注册 Skill 命令 | `handleSetup` |
| `spec-first hooks install` | 安装 Git Hooks | `handleHooks` |
| `spec-first viewer` | Stage Viewer | `handleViewer` |
| `spec-first update` | 升级后刷新 | `handleUpdate` |
| `spec-first done` | 完成 Feature | `handleDone` |

## 常用命令详解

### spec-first init

初始化 Feature 工作区。

```bash
spec-first init --feat MYFEAT --title "我的功能" [--mode N|I] [--size S|M|L]
```

**参数**：
- `--feat` — FEAT 缩写（3-6 大写字母）
- `--title` — Feature 标题
- `--mode` — 模式（N=新建, I=迭代），默认 N
- `--size` — 规模（S/M/L），默认 M

**产物**：
- `specs/FSREQ-YYYYMMDD-MYFEAT-001/` 目录
- `stage-state.json` — 阶段状态
- `traceability-matrix.md` — 追踪矩阵
- `prd.md`, `findings.md`, `constitution.md`

### spec-first stage advance

推进 Feature 到下一阶段。

```bash
spec-first stage advance --feature FSREQ-YYYYMMDD-FEAT-001
```

**前置条件**：
- Gate 校验通过
- 当前阶段非终态

### spec-first gate check

执行 Gate 校验。

```bash
spec-first gate check --feature FSREQ-YYYYMMDD-FEAT-001 [--stage 03_plan]
```

**输出**：
- PASS / PASS_WITH_WAIVER / FAIL
- 各条件评估详情

### spec-first skill render

渲染 Skill 内容。

```bash
spec-first skill render code --feature FSREQ-YYYYMMDD-FEAT-001
```

## 证据来源

- CLI 入口 (`src/cli/index.ts:36-101`) — 命令注册 — 显式
- Router (`src/cli/router.ts`) — 路由分发 — 显式
- Commands 目录 (`src/cli/commands/`) — Handler 实现 — 显式
