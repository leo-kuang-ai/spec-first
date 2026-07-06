---
title: Skill 发布时同时对齐治理记录、命令面和 runtime 投影名称
date: 2026-06-23
category: conventions
module: spec-first-skill-runtime-publication
problem_type: convention
component: development_workflow
severity: medium
applies_when:
  - "新增或发布 spec-first skill"
  - "把一个 skill 暴露为 public workflow 或 standalone skill"
  - "修改 Claude/Codex runtime projection 或 init 生成逻辑"
domain: dual-host skill publication
pattern: Skill command-surface alignment checklist
rejected_alternatives:
  - "只修改 generated runtime mirror 会在下次 spec-first init 后丢失，且绕过 source/runtime 边界。"
  - "只在 source skill 里改命令文案不足以防止 adapter 在 runtime 中改写 frontmatter name。"
  - "为了更像命令而去掉 standalone skill 的 spec- 前缀会让 source governance、runtime discovery 和用户调用名不一致。"
applicable_versions:
  - "spec-first v1.11.4"
  - "Claude spec-* workflow surface"
  - "Codex spec-* workflow surface"
invalidation_condition: "If host skill discovery stops using SKILL.md frontmatter name or spec-first replaces dual-host init/runtime projection governance, re-check this convention."
source_refs:
  - "src/cli/adapters/claude.js"
  - "src/cli/adapters/codex.js"
  - "src/cli/contracts/dual-host-governance/skills-governance.json"
  - "skills/spec-team-standards-governance/SKILL.md"
  - "tests/unit/team-standards-governance-contracts.test.js"
  - "tests/unit/spec-write-tasks-contracts.test.js"
tags: [skill-publication, command-surface, dual-host, runtime-projection, standalone-skill]
---

# Skill 发布时同时对齐治理记录、命令面和 runtime 投影名称

## Context

`spec-team-standards-governance` 是项目级 standalone skill。修复过程中发现 source skill 的 `name: spec-team-standards-governance` 是正确的，但 `spec-first init` 后 Claude 和 Codex runtime 都被 adapter 改写成 `name: team-standards-governance`。这会导致用户按 source 名称重新安装或调用时找不到预期 skill。

同一轮还暴露了命令文案混写问题：共享说明不能只写 `spec-*`，也不能把 standalone skill 伪装成 `spec-*` 或 `spec-*` workflow。需要同时表达两层事实：

- public workflow 命令面：Claude 用 `spec-*`，Codex 用 `spec-*`。
- standalone skill：保留治理 source 名称，例如 `spec-team-standards-governance` 或 `spec-write-tasks`，但不新增 `spec-*` 或 `spec-*` workflow entrypoint。

## Guidance

新增、发布或改造 skill 时，先确认 `src/cli/contracts/dual-host-governance/skills-governance.json` 的 `entry_surface`：

- `workflow_command`：这是 public workflow。Claude 文档和 runtime 入口应是 `spec-*`，Codex 文档和 runtime 入口应是 `spec-*`。对应 command/runtime projection、README/用户手册、catalog 和 contract tests 要一起更新。
- `standalone_skill`：这是 host skill discovery 下的独立 skill。不要写成 `spec-*` 或 `spec-*` workflow；runtime `SKILL.md` 的 `name` 应保留 source skill 名称，包括 `spec-` 前缀。
- `internal_only`：只能由公开 workflow 的文档化 phase 调用，不进入用户入口表。

发布前用这个检查清单收口：

1. Source 名称：`skills/<skill-name>/SKILL.md` 的 frontmatter `name` 与治理记录一致。
2. 命令文案：涉及 public workflow 时明确 Claude `spec-*` 与 Codex `spec-*`；涉及 standalone skill 时只写 standalone skill 名称。
3. Runtime 生成：修 generator 或 adapter source，不能手改 `.claude/`、`.codex/`、`.agents/skills/`。
4. Runtime 投影测试：用 Claude 和 Codex adapter 同步到临时目录，断言 `SKILL.md` frontmatter `name`、命令文案和禁止别名都符合治理。
5. 发布文档：README、用户手册、runtime capability catalog、CHANGELOG 只记录当前真实 surface，不补历史入口或 retired workflow。
6. 实测刷新：运行 `spec-first init --claude --codex -y` 或等价显式 host 选择，检查生成后的 runtime。

## Why This Matters

Skill 发布问题通常不是单个文件的 typo，而是 source、governance、host adapter、runtime projection 和用户文档之间的契约漂移。只修其中一层会出现三类后果：

- 用户按 source 名称调用或重装 skill 时找不到，因为 runtime `name` 被改写。
- 文档把 standalone skill 写成 workflow command，诱导用户调用不存在的 `spec-*` 或 `spec-*`。
- `spec-first init` 下次刷新时覆盖手工 runtime patch，问题复现。

把命令面和 runtime 名称作为同一个发布检查项，可以让新增 skill 从一开始就符合双宿主治理边界。

## When to Apply

- 新增 `skills/**/SKILL.md`。
- 把现有 skill 从 internal/standalone 调整为 public workflow，或反向调整。
- 修改 `src/cli/adapters/{claude,codex}.js`、`src/cli/plugin.js`、`skills-governance.json` 或 runtime capability catalog。
- 用户报告某个 project-level skill 在 Claude 或 Codex 中找不到、重复出现或名称不一致。

## Examples

Standalone skill 的正确形态：

```yaml
---
name: spec-team-standards-governance
description: "Govern team development standards as source documents..."
---
```

对应文案应表达：

```markdown
This is a standalone skill, not a public Claude `spec-*` or Codex `spec-*` workflow.
Durable source mutation requires an active Claude `spec-work`, Codex `spec-work`,
or equivalent source-edit workflow.
```

不应表达为：

```markdown
Run `spec-team-standards-governance`.
```

Runtime projection 回归测试应覆盖两个宿主，而不是只检查 source：

```javascript
syncSkills(projectRoot, new ClaudeAdapter());
syncSkills(projectRoot, new CodexAdapter());

expect(runtimeSkill).toContain('name: spec-team-standards-governance');
expect(runtimeSkill).not.toContain('name: team-standards-governance');
```

## Related

- `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md`
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
- `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md`
