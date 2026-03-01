---
last_updated: 2026-02-28
---

# API 文档

> 本文档由 `spec-first:first` skill 自动生成，列出 spec-first CLI 的所有命令及其说明。

## 命令列表

### 核心 CLI 命令

| 命令 | 描述 | 处理器 |
|------|------|--------|
| `id` | 追溯 ID 生成、校验与检索 | `handleId` |
| `matrix` | 同步追踪矩阵 | `handleMatrix` |
| `init` | 初始化 Feature 工作区 | `handleInit` |
| `stage` | 阶段流转管理（current/advance/cancel） | `handleStage` |
| `rfc` | RFC 变更请求与状态管理 | `handleRfc` |
| `defect` | 缺陷跟踪与状态管理 | `handleDefect` |
| `metrics` | 覆盖率度量与健康评分 | `handleMetrics` |
| `doctor` | 环境诊断与修复 | `handleDoctor` |
| `gate` | 阶段质量门禁评估 | `handleGate` |
| `golive` | 上线就绪检查与批准 | `handleGoLive` |
| `ai` | 会话恢复与上下文摘要 | `handleAi` |
| `commit` | 规范提交并关联追溯 ID | `handleCommit` |
| `feature` | Feature 列表、切换与查看 | `handleFeature` |

### 配置与安装命令

| 命令 | 描述 | 处理器 |
|------|------|--------|
| `setup` | 注册 Claude Code + Codex Skill 命令 | `handleSetup` |
| `hooks` | Git Hooks 安装与状态管理 | `handleHooks` |
| `viewer` | Stage Viewer 可视化面板 | `handleViewer` |
| `update` | 升级后刷新 Skill/MCP/Hooks | `handleUpdate` |
| `uninstall` | 清理宿主配置（卸载前执行） | `handleUninstall` |

### 分析命令

| 命令 | 描述 | 处理器 |
|------|------|--------|
| `analyze` | 跨产物一致性分析 | `handleAnalyze` |

## 使用方式

```bash
# 查看帮助
npx spec-first --help

# 查看特定命令帮助
npx spec-first <command> --help

# 示例：初始化 Feature
npx spec-first init --feat AUTH --mode I

# 示例：查看当前阶段
npx spec-first stage current

# 示例：运行环境诊断
npx spec-first doctor
```

---

*生成时间: 2026-02-28 | 命令: `/spec-first:first`*
