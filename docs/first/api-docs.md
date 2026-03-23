# API 接口规范

> 真源: `.spec-first/runtime/first/api-contracts.json`

## 概述

Spec-First 提供 CLI 命令行接口，用于驱动 Feature 从需求到上线的全链路研发闭环。

## 入口

| 层级 | 路径 |
|------|------|
| 源码 | `src/cli/index.ts` |
| 构建产物 | `dist/cli/index.js` |

## 命令结构

```
spec-first <command> <subcommand> [args] [--flags]
```

## 全局参数

| 参数 | 说明 |
|------|------|
| `--help, -h` | 显示帮助信息 |
| `--version, -v` | 显示版本号 |
| `--yes` | 确认执行需要确认的命令 |
| `--mode` | 运行模式：`N`(New) / `I`(Iterative) |
| `--size` | 功能规模：`S` / `M` / `L` |

## 命令列表（27 个）

| 命令 | 说明 | 需确认 |
|------|------|--------|
| `id` | 追溯 ID 生成、校验与检索 | 否 |
| `docs` | 校验与展示文档关联索引 | 条件 |
| `init` | 初始化 Feature 工作区 | 否 |
| `stage` | 阶段流转管理 | 条件 |
| `rfc` | RFC 变更请求与状态管理 | 是 |
| `defect` | 缺陷跟踪与状态管理 | 是 |
| `metrics` | 健康评分与文档关联度量 | 否 |
| `doctor` | 环境诊断与修复 | 条件 |
| `gate` | 阶段质量门禁评估 | 否 |
| `golive` | 上线就绪检查与批准 | 否 |
| `done` | 将 Feature 从 07_release 收口到 08_done | 是 |
| `orchestrate` | 受控编排协调入口 | 是 |
| `ai` | 会话恢复与上下文摘要 | 否 |
| `commit` | 规范提交并关联追溯 ID | 是 |
| `feature` | Feature 列表、切换与查看 | 条件 |
| `setup` | 注册 Claude Code + Codex Skill 命令 | 是 |
| `hooks` | Git Hooks 安装与状态管理 | 条件 |
| `viewer` | Stage Viewer 可视化面板 | 否 |
| `update` | 升级后刷新 Skill/MCP/Hooks | 是 |
| `uninstall` | 清理宿主配置 | 是 |
| `analyze` | 跨产物一致性分析 | 否 |
| `trace` | 追溯链修复与校验 | 条件 |
| `validate` | 产物格式校验 | 否 |
| `first` | 项目首轮认知 runtime/docs 校验 | 否 |
| `onboarding` | 新手引导 | 否 |
| `skill` | 动态渲染 skill 内容 | 否 |
| `status` | 当前 Feature 状态概览 | 否 |

## 退出码

| 退出码 | 常量名 | 说明 |
|--------|--------|------|
| 0 | SUCCESS | 执行成功 |
| 1 | GATE_FAILED | Gate 校验失败 |
| 2 | VALIDATION_ERROR | 参数校验错误 |
| 3 | CONFIG_ERROR | 配置错误 |
| 4 | IO_ERROR | IO 操作错误 |
| 5 | UNKNOWN_ERROR | 未知错误 |
| 6 | INVALID_ARGS | 无效参数 |
| 7 | GENERAL_ERROR | 通用错误 |

## 确认策略

采用四维判定规则决定命令执行是否需要用户确认：

- **维度**: `mode`, `size`, `hasNfrSec`, `hasNewExternalApi`
- **策略**: `auto` / `assisted` / `strict`
