# Tool Integration Overview

> 更新时间：2026-03-15

## 目标

这份文档说明 Spec-First 当前工具集成的基线能力、宿主边界、主要入口和常见排查方式。

## 基线能力

### 必备外部 Skills

- `find-skills`
- `skill-creator`

### 核心 MCP

- `sequential-thinking`
- `context7`
- `serena`
- `fetch`
- `playwright-mcp`

### 当前宿主分层

- 稳定宿主：
  - `Claude Code`
  - `Codex`
- 实验性宿主：
  - `Gemini CLI`
  - `Cursor`

## 主要入口

### `spec-first update`

用途：

- 默认补齐基线 Skills + MCP
- 输出 `Component Plan`
- 输出宿主 baseline 状态

常用参数：

- `--dry-run`
- `--host claude|codex|gemini|cursor|all`
- `--component hooks|viewer`

### `spec-first doctor`

用途：

- 诊断环境、宿主能力、baseline 缺失项
- 输出 `missing=` 与修复建议
- 输出基线场景的 tool selection policy

### `spec-first init --bootstrap`

用途：

- 在初始化 Feature 前补齐宿主基线能力
- 输出宿主基线状态摘要

### `postinstall`

用途：

- 安装后做宿主探测与引导
- 非全局安装场景下提示如何执行 `update / init --bootstrap`

## 运行时结构

### Host Adapter

负责：

- 宿主探测
- 宿主 maturity
- baseline ready / partial
- remediation 输出

当前目录：

- `src/core/host-adapters/*`

### Tool Registry

负责：

- 描述工具角色、场景、降级路径

当前目录：

- `src/core/tool-integration/tool-registry.ts`

### Capability Matrix

负责：

- 表达每个宿主支持哪些能力

当前目录：

- `src/core/tool-integration/capability-matrix.ts`

### Tool Selection Policy

负责：

- 按场景选择主工具和降级工具

当前目录：

- `src/core/tool-integration/tool-selection.ts`

## 当前已落地的模板

- `docs/templates/research-evidence.md`
- `docs/templates/browser-verification.md`
- `docs/templates/security-audit-report.md`

## 常见诊断结论

### `baseline=ready`

- 表示当前宿主的基线技能和 MCP 已达到预期状态。

### `baseline=partial`

- 表示宿主已存在，但至少一类基线能力未完成。
- 常见情况：
  - 缺 `skills`
  - 缺 `mcp`
  - 存在同名自定义 MCP 冲突，系统保留原配置并继续报告 `mcp` 未就绪

### `missing=skills+mcp`

- 常见于已检测到宿主目录，但还没执行 `spec-first update --host <host>`。

## 常见修复命令

- `spec-first update`
- `spec-first update --host gemini`
- `spec-first update --host cursor`
- `spec-first doctor`
- `spec-first init --bootstrap`

## 当前未完成项

- 非基线组件安装器仍未完整实现，`T17` 仍处于进行中。
- `Gemini / Cursor` 虽已进入真实链路，但仍应按 experimental 对待。
- 宿主能力矩阵和综合说明文档已补齐，后续需随组件化安装继续更新。
