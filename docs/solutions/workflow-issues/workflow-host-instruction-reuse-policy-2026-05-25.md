---
title: "Workflow prompts should reuse loaded host instructions"
date: "2026-05-25"
category: "workflow-issues"
module: "spec-first workflow context governance"
problem_type: "workflow_issue"
component: "development_workflow"
severity: "medium"
applies_when:
  - "Workflow prompts need project guidance but host/project instructions are already loaded by the current session"
  - "Context orientation risks re-reading root AGENTS.md or CLAUDE.md by default"
  - "A workflow must distinguish loaded instruction context from precise source-of-truth reads"
tags: ["workflow-prompts", "context-governance", "host-instructions", "agents-md", "claude-md", "token-efficiency", "source-runtime-boundary", "prompt-economy"]
related_components: ["spec-plan", "spec-work", "spec-debug", "spec-code-review", "spec-brainstorm", "spec-doc-review"]
retirement_note: "2026-07-08: the old code-review project-standards persona and confirmed team-standards source surface were retired. This learning now applies to host/project instruction reuse only; do not restore the old standards-path handoff exception from this document."
---

# Workflow prompts should reuse loaded host instructions

## Context

高频 workflow prompt 曾把 `AGENTS.md`、`CLAUDE.md` 和 project role docs 写成普通 context source。这样会让 `spec-plan`、`spec-work`、`spec-debug`、`spec-code-review`、`spec-brainstorm` 和 `spec-doc-review` 倾向于每次运行都重新读取根入口指令，即使 Claude/Codex 进入仓库时通常已经把适用的 host/project instructions 注入当前会话。

这类 wording 把两层东西混在了一起：

- host/project instruction layer：会话启动时加载，用于稳定约束 agent 行为。
- task context bundle：每次 workflow 按当前请求、plan/task、diff、附近源码、测试、artifact summary 和 provider facts 精确收集。

会话历史也暴露过相同方向的问题：`spec-work` 主入口曾被评价为“长 prompt + 浅 references”，大量治理内容挤在主文件里，容易形成读不完的前言；曾经的 `spec-work` / `spec-work-beta` 复制式分叉也放大了 prompt drift 风险。`spec-work-beta` 已于 2026-05-24 退役，但这个历史教训仍说明 workflow prompt 应该复用宿主分层加载能力，并把重场景放到明确 contract 或 lazy-load reference 中，而不是把所有治理和入口文档都作为默认上下文重读。（session history: `63bc8153.skeleton.txt`, `cce97de7.skeleton.txt`）

本次修复在 `docs/contracts/context-governance.md` 增加 Host Instruction Reuse Policy，并同步更新 workflow prompt 与 contract tests，使普通 workflow 默认复用已加载的 host/project instructions。

## Guidance

把 `AGENTS.md`、`CLAUDE.md` 和项目角色文档视为 host/project instruction layer，而不是普通 context bundle 输入。

默认规则：

```text
Use already-loaded host/project instructions first.
```

只有下列明确例外成立时，才精确读取 instruction source：

1. 用户明确点名某个 instruction 文件或具体路径。
2. 当前任务正在修改、审查、生成或诊断 instruction / runtime / setup / update / audit / source-runtime drift 行为。
3. 已加载指令缺失、明显 stale、与当前 source 冲突，或 workflow 需要核对 source-of-truth 以避免漂移。
4. 需要检查目录级 `AGENTS.md` / `CLAUDE.md` 是否管辖当前 changed files，而该目录级指令未出现在已加载 host context 中。
5. `spec-code-review` 若需要核对 written project guidance，应只在 Host Instruction Reuse Policy 允许时精确读取相关 host/project instruction、目录级 instruction 或 `docs/contracts/**` section；不要恢复已退役的 standards path list/persona 例外。

普通 workflow 的 context orientation 应该写成：

```text
Orient from the current user request, the plan/task context,
already-loaded host/project instructions, nearby source/tests,
and git diff or changed files when applicable.
```

不要写成：

```text
Orient from AGENTS.md / CLAUDE.md / project role docs...
```

如果确实触发例外并读取 instruction source，在 Coverage、handoff 或 closeout 中说明读取原因即可。这样既保留 source-of-truth 校验能力，也避免把根 host instructions 变成每次 workflow 的普通必读材料。

## Why This Matters

这个边界保护三件事：

1. Context economy：根入口指令通常已经在会话里，重复读取会浪费 token，并把当前任务需要的 source/test/diff evidence 挤出去。
2. Source/runtime clarity：`AGENTS.md`、`CLAUDE.md` 是 checked-in host 入口 source，`.claude/`、`.codex/`、`.agents/skills/` 是 generated runtime mirror。普通 workflow 不应因为 orientation wording 而反复拉取这些入口或 mirror。
3. Workflow scope authority：host instructions 提供稳定行为约束；plan/task pack、用户请求、diff 和当前 source 决定本次具体 scope。外部 provider、旧 docs、session history 和 instruction source 只能在明确条件下提供证据或边界。

如果没有这条 policy，常见退化是：

- 每个 plan/work/debug/review 都重新加载根 `AGENTS.md` / `CLAUDE.md`。
- `docs/contracts/`、角色文档和入口文件被当作普通背景材料广播给 reviewer/worker。
- workflow prompt 变成治理内容堆叠，新增规则靠复制进每个 `SKILL.md` 传播。
- source/runtime drift 问题被误判为“多读几份入口文档”即可解决，而不是回到 source-first 和 generated runtime 边界。

## When to Apply

- 修改 workflow 的 `Context Orientation Anchor`、Domain Language、reviewer prompt 或 context-gathering instructions。
- 审查 `spec-plan`、`spec-work`、`spec-debug`、`spec-code-review`、`spec-brainstorm`、`spec-doc-review` 这类高频 workflow。
- 将项目规范、角色契约、entrypoint、runtime mirror 或 provider readiness 放进 workflow prompt 时。
- fresh-source eval 检查 workflow posture drift 时，确认 prompt 是“复用已加载 instruction”，而不是“默认重读 instruction source”。

这不是禁止读取 `AGENTS.md` / `CLAUDE.md`。它是 reuse-first policy：默认复用已加载指令，只有触发明确例外时才读 source。

## Examples

`spec-work` 的正确 wording：

```diff
- Orient execution from the current user request, the plan or task pack,
- `AGENTS.md` / `CLAUDE.md` / project role docs, package manifests...
+ Orient execution from the current user request, the plan or task pack,
+ already-loaded host/project instructions, package manifests...
```

Domain context 的正确 wording：

```diff
- Consume existing context: host instructions, `AGENTS.md` / `CLAUDE.md`
- source, `docs/contracts/`, existing plans...
+ Consume existing context: already-loaded host/project instructions,
+ `docs/contracts/`, existing plans...
+ Read `AGENTS.md` / `CLAUDE.md` source only under the Host Instruction
+ Reuse Policy.
```

`spec-code-review` 的当前例外是精确 source 读取，而不是旧 standards persona handoff：

```text
Read instruction source only when the Host Instruction Reuse Policy allows it,
such as directory-scoped instructions that may govern changed files or
source/runtime governance work.
```

这个例外服务 source-of-truth 校验，不代表普通 review orientation 可以默认重读根入口文件。

## Related

- `docs/contracts/context-governance.md` — Host Instruction Reuse Policy 的 source-of-truth。
- `skills/spec-plan/SKILL.md`、`skills/spec-work/SKILL.md`、`skills/spec-code-review/SKILL.md`、`skills/spec-debug/SKILL.md`、`skills/spec-brainstorm/SKILL.md`、`skills/spec-doc-review/SKILL.md` — 已同步的 workflow prompt consumers。
- `tests/unit/context-governance-contracts.test.js`、`tests/unit/spec-plan-contracts.test.js`、`tests/unit/spec-work-contracts.test.js`、`tests/unit/spec-code-review-contracts.test.js` — 防止 wording 回退到默认重读根 instruction source。
- `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md` — 相关但不同：宿主入口映射属于 init 和治理层，不应散落在普通 prose 中。
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md` — 相关 source/runtime 边界经验。
- `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md` — 相关 workflow entrypoint 暴露边界。

验证记录：

```bash
npx jest tests/unit/context-governance-contracts.test.js \
  tests/unit/spec-work-contracts.test.js \
  tests/unit/spec-plan-contracts.test.js \
  tests/unit/spec-debug-contracts.test.js \
  tests/unit/spec-code-review-contracts.test.js \
  tests/unit/spec-brainstorm-contracts.test.js \
  tests/unit/spec-doc-review-contracts.test.js --runInBand
```

结果：当前复查时 `spec-work-beta` 回归 suite 已随退役删除；上述 source contract suites 和 `git diff --check` 作为可复跑验证面。
