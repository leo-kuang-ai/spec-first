# Bootstrap 配置目录

该目录存放 bootstrap / update 流程使用的配置清单。

## 文件

- `bootstrap-manifest.ts`：必需组件的单一事实来源（Single Source of Truth）。

## bootstrap-manifest.ts 内容

1. `REQUIRED_MCP_SERVERS`
- 必需 MCP 名称列表。
- Codex 与 Claude Code 各自的 command/args 配置。
- 可选 `binaryProbes`（仅用于深度诊断，不影响 update 默认快速路径）。

2. `REQUIRED_SKILLS`
- 必需 Skill 名称列表。
- Codex 安装目标（`root` 或 `.system`）。
- 本地来源查找优先级（agents/codex/claude）。
- 可选 git clone 兜底源。

## 迭代更新规则

后续新增/删除必需 MCP 或 Skill，只修改 `bootstrap-manifest.ts`，然后执行：

```bash
pnpm -s vitest run tests/unit/host-bootstrap.test.ts
```
