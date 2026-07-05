---
title: 新增 workflow 入口要同时维护 command manifest、governance 和 host adapter 边界
date: 2026-04-26
last_updated: 2026-06-04
category: docs/solutions/architecture-patterns
module: init-runtime-assets
problem_type: architecture_pattern
component: tooling
severity: medium
applies_when:
  - 新增 `spec-xxx` 和 `spec-xxx` 这种 workflow 入口
  - 判断一个 skill 应该作为 workflow command 还是 standalone skill 暴露
  - 修改 `spec-first init --claude` 或 `spec-first init --codex` 的运行时资产同步行为
tags: [workflow-entrypoint, dual-host-governance, init-runtime, skill-command, claude-codex]
---

# 新增 workflow 入口要同时维护 command manifest、governance 和 host adapter 边界

## Context

`spec-first init` 同时服务 Claude 和 Codex，但两边的用户入口不是同一种运行时资产：

- Claude workflow 入口是 `spec-xxx`，由 `.claude/commands/spec/*.md` 暴露。
- Codex workflow 入口是 `spec-xxx`，由 `.agents/skills/spec-xxx/SKILL.md` 暴露。
- 同一份 source skill 仍放在 `skills/spec-xxx/SKILL.md`。

因此，“新增一个 workflow 入口”不是只新增一个 `SKILL.md`，也不是只改 Claude command template。它需要同时维护三层事实：动态 command manifest 投影、dual-host governance、host adapter 同步边界。

## Guidance

新增 `spec-xxx` / `spec-xxx` workflow 入口时，按这四步做：

1. 新增 source skill：

   ```text
   skills/spec-xxx/SKILL.md
   ```

2. 在 `src/cli/contracts/dual-host-governance/skills-governance.json` 登记交付策略：

   ```json
   {
     "skill_name": "spec-xxx",
     "entry_surface": "workflow_command",
     "command_name": "xxx",
     "host_scope": "dual_host",
     "owner_host": null,
     "host_delivery": {
       "claude": "command",
       "codex": "skill"
     }
   }
   ```

3. 新增 Claude command template：

   ```text
   templates/claude/commands/spec/xxx.md
   ```

   这个 template 只承载 Claude command frontmatter，例如 `description` 和 `argument-hint`。`src/cli/plugin.js` 会从 governance 的 `workflow_command` 记录和 template metadata 动态构建 command manifest；`init --claude` 再把 template frontmatter 和 `skills/spec-xxx/SKILL.md` 的正文合成为运行时 command。

4. 用当前 runtime projection 测试确认两宿主交付面：

   ```bash
   npx jest tests/unit/init-source-path-coverage.test.js --runInBand
   npm run test:smoke
   ```

普通 standalone skill 不走这条路径。它只需要 `skills/<name>/SKILL.md` 和 governance 中的 `entry_surface: "standalone_skill"`，不应出现在 workflow command governance 或 Claude command templates 中。

当前治理下，standalone skill 也不应被写成 `spec-*` 或 `spec-*` 这种 public workflow command。`entry_surface: "standalone_skill"` 表示它按宿主 skill 发现机制交付；source `name:` 应保持 skill identity，运行时命名细节由 host adapter 处理。例如 Codex adapter 会把 runtime skill `name:` 改写为目录名，Claude adapter 会把部分 `spec-*` standalone skill 的 runtime name 去掉 `spec-` 前缀；这些 adapter 转换不是 source frontmatter 规范，也不应回写成新的 `spec-*` 入口规则。

## Why This Matters

这套设计把确定性同步和语义判断分开：

- `src/cli/plugin.js` 从 `skills-governance.json` 和 `templates/claude/commands/spec/*.md` 动态构建 command manifest，不再依赖 checked-in `.claude-plugin/plugin.json`。
- `skills-governance.json` 定义 skill 是否暴露、在哪个 host 暴露、以 command 还是 skill 形态暴露，是双宿主治理真相源。
- adapter 定义运行时落盘位置和转换规则，是平台执行边界。

如果只改其中一层，会出现典型漂移：

- 只新增 `SKILL.md`：governance 校验会认为 bundled skill 未登记，或者 init 不知道如何暴露。
- 只改 template：没有 governance `workflow_command` 记录时，动态 manifest 不会把它暴露为公开 workflow。
- 只改 governance：Claude command 缺少 template metadata，manifest 构建会失败。
- 误把 Codex 当 command 平台：Codex adapter 当前 `hasCommands=false`，不会写 `.codex/commands/spec/*.md`。

## When to Apply

- 新增正式 workflow，例如规划、执行、审查、调试、知识沉淀等 `spec-*` 入口。
- 把已有 standalone skill 提升为 workflow command。
- 调整某个 skill 是否在 Claude 或 Codex 中对用户可见。
- 排查 `init --claude` 后有 `spec-xxx`，但 `init --codex` 后没有 `spec-xxx`，或反过来的暴露不一致。

## Examples

**workflow command 的目标形态**：

| Host | 用户入口 | 运行时资产 |
|------|----------|------------|
| Claude | `spec-xxx` | `.claude/commands/spec/xxx.md` |
| Claude | command backing skill | `.claude/spec-first/workflows/spec-xxx/SKILL.md` |
| Codex | `spec-xxx` | `.agents/skills/spec-xxx/SKILL.md` |

**standalone skill 的目标形态**：

| Host | 用户入口 | 运行时资产 |
|------|----------|------------|
| Claude | skill invocation | `.claude/skills/<skill>/SKILL.md` |
| Codex | skill invocation | `.agents/skills/<skill>/SKILL.md` |

**治理字段选择**：

```json
{
  "entry_surface": "workflow_command",
  "host_delivery": {
    "claude": "command",
    "codex": "skill"
  }
}
```

表示同一个 workflow 在 Claude 以 slash command 暴露，在 Codex 以 skill 暴露。

```json
{
  "entry_surface": "standalone_skill",
  "command_name": null,
  "host_delivery": {
    "claude": "skill",
    "codex": "skill"
  }
}
```

表示普通 skill，不生成 `spec-*` command。

## Related

- `src/cli/plugin.js` — 动态构建 command manifest，并根据 governance 分出 `commands`、`workflowSkills` 和 `skills`。
- `src/cli/contracts/dual-host-governance/skills-governance.json` — skill 暴露策略真相源。
- `templates/claude/commands/spec/*.md` — Claude command frontmatter source templates。
- `src/cli/adapters/claude.js` — Claude command、skill、workflow skill 的运行时目录。
- `src/cli/adapters/codex.js` — Codex 通过 `.agents/skills` 暴露 workflow，且 `hasCommands=false`。
- `docs/contracts/dual-host-governance/README.md` — public workflow、standalone skill 和 internal-only 的宿主交付合同。
- `tests/unit/lint-skill-entrypoints.test.js` — 防止 standalone skill 被写成正向 public command alias。
