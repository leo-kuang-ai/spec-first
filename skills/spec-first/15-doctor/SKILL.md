---
name: "spec-first:doctor"
description: "定位项目与宿主配置并执行环境诊断"
---

# Skill: doctor

诊断项目环境与宿主配置，自动修复 MCP/skills 缺失项。

## 触发条件
- 阶段: 任意（不限阶段）
- Command: `/spec-first:doctor`

## 执行阶段
- P0: 定位项目根目录和宿主配置文件（Codex + Claude）
- P1: 加载宿主配置，执行基线检查（Node、Git、hooks、config、Gate 降级、文件膨胀）和 MCP/skills 健康检查
- P2: 生成诊断报告与修复计划（缺失项、配置错误项、建议修复操作）
- P3: 向用户展示诊断结果与修复计划，确认是否执行自动修复
- P4: 执行自动安装/修复，复检并展示修复前后状态对比
- P5: 不写入项目文件（可能更新环境配置文件）

### MCP 与 Skills 健康检查规则
- 双宿主检查范围:
  - `Codex`: `~/.codex/config.toml`, `~/.codex/skills/`
  - `Claude Code`: `~/.config/claude-code/mcp.json`, `~/.config/claude-code/settings.json`, `~/.claude/skills/`
- 安装范围必须为用户级全局目录（home 路径），不写入项目局部目录
- 必检 MCP（双宿主）: `sequential-thinking`, `context7`, `serena`, `fetch`, `playwright-mcp`
- 必检 skills（双宿主）: `find-skills`, `skill-creator`
- `serena` 优先使用 `uvx --from git+https://github.com/oraios/serena serena start-mcp-server`；兼容回退 `serena-mcp-server` / `npx -y mcp-server-serena`
- `fetch` 固定为 `uvx mcp-server-fetch`
- 缺失或配置错误时，P4 自动安装/修复后必须复检并报告最终状态

## CLI 依赖
- `spec-first doctor`

## 输出路径
- 无（项目工作区内无写入，环境配置文件可能更新）

## 确认策略
- 推荐: assisted（自动修复可能更新本地宿主配置）

## 成功标准
- 诊断报告已展示（Node/Git/Hook/Config/Gate/文件膨胀检测结果）
- MCP required set 在 `Codex` + `Claude Code` 均通过
- skills required set 在 `Codex` + `Claude Code` 均通过
- 如发生自动修复，已输出修复前后差异
