# Host Capability Matrix

> 更新时间：2026-03-15

## 宿主支持矩阵

| Host | Maturity | Skills | MCP | Hooks | Session Hook | Viewer | Browser | Project Scoped Config | 当前结论 |
|------|----------|--------|-----|-------|--------------|--------|---------|-----------------------|----------|
| Claude Code | stable | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 稳定基线宿主 |
| Codex | stable | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | 稳定基线宿主 |
| Gemini CLI | experimental | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 实验性宿主，已支持 baseline skills/MCP |
| Cursor | experimental | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 实验性宿主，已支持 baseline skills/MCP |
| Generic | planned | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 占位宿主，仅用于策略降级 |

## 宿主说明

### Claude Code

- 通过 `.claude/commands` 和 Claude 配置目录完成 Skill/MCP/Hook 集成。
- 是当前最完整的宿主实现，也是 `postinstall / update / init --bootstrap / doctor` 的主基线。

### Codex

- 通过 `~/.codex/skills` 和 `config.toml` 完成 Skill/MCP 集成。
- 当前不支持 Claude 风格的 hooks / session hook，但具备稳定的 browser/tool routing 能力。

### Gemini CLI

- 已支持：
  - 宿主探测
  - `skills/spec-first` 同步
  - `settings.json` 中的 MCP baseline 写入
  - 旧键 `mcp_servers` 向 `mcpServers` 迁移
- 当前约束：
  - 属于 experimental
  - 遇到同名自定义 MCP 条目时保留原配置并报告 warning
  - 冲突配置会让 `doctor` 继续判定 `mcp` 为 `partial`

### Cursor

- 已支持：
  - 宿主探测
  - `skills/spec-first` 同步
  - `mcp.json` 中的 MCP baseline 写入
  - 旧键 `servers` 向 `mcpServers` 迁移
- 当前约束：
  - 属于 experimental
  - 遇到同名自定义 MCP 条目时保留原配置并报告 warning
  - 冲突配置会让 `doctor` 继续判定 `mcp` 为 `partial`

## 状态口径

- `stable`
  - 可以作为当前对外默认宿主能力宣传口径。
- `experimental`
  - 可以接入、可诊断、可回归，但不应宣传为完整稳定宿主。
- `planned`
  - 仅存在策略或占位定义，还未进入真实集成链路。

## 对齐来源

- `update`：输出 `Hosts:` 宿主摘要与 baseline 状态
- `doctor`：输出 `Host Capability:*`、`missing=`、修复建议
- `src/core/tool-integration/capability-matrix.ts`
- `src/core/host-adapters/*`
