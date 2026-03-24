---
name: "spec-first:doctor"
description: "Use when spec-first commands, host configuration, MCP wiring, or runtime/docs health appears broken or inconsistent."
version: 1.1.0
last_updated: 2026-03-18
changelog: |
  v1.1.0: 对齐当前多宿主基线能力诊断范围（claude/codex/gemini/cursor）与 runtime/docs 背景健康检查
  v1.0.0: Aligned with manifest-driven bootstrap checks (MCP/skills from config)
---

# Skill: doctor

诊断项目环境与宿主配置；默认只读诊断，显式 `--fix` 时才执行 MCP/skills 修复。

## 输入上下文

执行此 skill 时，从 `.spec-first/runtime/first/` 加载以下产物：

| 产物 | 优先级 | 用途 |
|------|--------|------|
| `summary` | 可选 | 项目概览，理解技术栈和模块划分 |

> **缺失处理**: 如果必需产物不存在，提示用户先执行 `/spec-first:first`


## 触发条件
- 阶段: 任意（不限阶段）
- Command: `/spec-first:doctor`

## 执行阶段
- P0: 自动识别项目根目录和宿主配置文件（Claude Code / Codex / Gemini / Cursor）
- P1: 加载宿主配置，执行基线检查（Node、Git、hooks、config、Gate 降级、文件膨胀）和 MCP/skills 健康检查
- P2: 默认以 dry-run 生成诊断报告与修复计划（缺失项、配置错误项、建议修复操作）
- P3: 仅当用户显式执行 `spec-first doctor --fix --yes` 时进入 apply 模式
- P4: apply 模式下执行自动安装/修复，复检并展示修复前后状态对比
- P5: 不写入项目文件（可能更新环境配置文件）

### MCP 与 Skills 健康检查规则
- 多宿主检查范围:
  - `Claude Code`: 自动识别 `CLAUDE_CODE_CONFIG_DIR` / `CLAUDE_CONFIG_DIR` / 平台默认目录，并解析 `mcp.json`、`settings.json`、`skills/`
  - `Codex`: 自动识别 `CODEX_HOME` / `CODEX_ROOT` / 平台默认目录，并解析 `config.toml`、`skills/`
  - `Gemini`: 自动识别 `GEMINI_HOME` / `GEMINI_CLI_HOME` / 平台默认目录，并解析 `settings.json`、`skills/`
  - `Cursor`: 自动识别 `CURSOR_HOME` / `CURSOR_USER_HOME` / 平台默认目录，并解析 `mcp.json`、`skills/`
- 若环境变量显式指定路径，`doctor` 以环境变量优先；否则退回宿主默认目录与存在性探测结果
- 安装范围必须为用户级全局目录（home 路径），不写入项目局部目录
- 必检 MCP / skills 不在本文件硬编码，统一以 `src/config/bootstrap-manifest.ts` 为准
- `doctor` 通过 `ensureHostBootstrap` 读取 manifest 并执行检查/补齐（与 `update` 复用同一规则）
- 若开启深度诊断（binary probe），探测命令与超时同样由 manifest 提供
- 缺失或配置错误时，默认只报告问题与修复建议；仅 `--fix` 模式才执行自动安装/修复并复检

## CLI 依赖
- `spec-first doctor`
- `spec-first doctor --fix --yes`

## 输出路径
- 无（项目工作区内无写入，环境配置文件可能更新）

## 确认策略
- 默认: dry-run（只诊断）
- 修复模式: `spec-first doctor --fix --yes`

## 成功标准
- 诊断报告已展示（Node/Git/Hook/Config/Gate/文件膨胀检测结果）
- 已按当前检测到的宿主集合完成 MCP / skills / baseline 健康检查
- `Claude Code`、`Codex`、`Gemini`、`Cursor` 中已检测到的宿主，其 required set 均通过或给出可执行修复建议
- 如显式执行 `--fix`，已输出修复前后差异

## 背景诊断范围
- 背景质量字段与枚举遵循 `../shared/background-quality-contract.md`
- 诊断 `first runtime` canonical 资产健康状态
- 诊断 `runtime 真源` 是否异常或缺失
- 诊断 `background_input_status`
- 检查 `docs 输出` 是否缺失
