---
title: "Exact-Same Skill Parity Implementation Plan"
type: archive
status: superseded
created: 2026-04-16
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# Exact-Same Skill Parity Implementation Plan

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 `agent-native-architecture`、`andrew-kane-gem-writer`、`dspy-ruby`、`gemini-imagegen`、`git-clean-gone-branches` 这 5 个已与上游代码实质对齐的 skill 补齐 contract 守卫、审计状态回写与变更治理记录。

**Architecture:** 这 5 个 skill 经代码事实核对后已和上游 `plugins/compound-engineering/skills/` 对应目录保持字节级一致，唯一非源码差异是 `skills/gemini-imagegen/scripts/__pycache__/`。因此本轮不重写 skill 正文，而是通过 unit contract tests 冻结当前能力、验证 Claude/Codex runtime transform 不破坏 skill identity，并把审计文档中的 `代码修复状态` 从 `未开始` 收口到 `已完成`。

**Tech Stack:** Node.js CommonJS, Jest, Markdown audit docs, Claude/Codex platform adapters

---

### Task 1: 固化批次 A 三个 skill 的 contract

**Files:**
- Create: `tests/unit/agent-native-architecture-contracts.test.js`
- Create: `tests/unit/andrew-kane-gem-writer-contracts.test.js`
- Create: `tests/unit/git-clean-gone-branches-contracts.test.js`

**Step 1: 编写 contract tests**

为每个 skill 断言：
- frontmatter `name` 正确
- 关键能力锚点存在
- Claude/Codex runtime transform 保持 skill naming 合同
- `git-clean-gone-branches` 额外断言 `scripts/clean-gone` 存在关键 guardrail

**Step 2: 运行 tests 验证**

Run: `npx jest tests/unit/agent-native-architecture-contracts.test.js tests/unit/andrew-kane-gem-writer-contracts.test.js tests/unit/git-clean-gone-branches-contracts.test.js --runInBand`

Expected: 3 个 test 文件全部通过

**Step 3: 审查本批 diff**

Run: `git diff --check -- tests/unit/agent-native-architecture-contracts.test.js tests/unit/andrew-kane-gem-writer-contracts.test.js tests/unit/git-clean-gone-branches-contracts.test.js`

Expected: 无 whitespace / conflict 问题

### Task 2: 固化批次 B 两个 skill 的 contract

**Files:**
- Create: `tests/unit/dspy-ruby-contracts.test.js`
- Create: `tests/unit/gemini-imagegen-contracts.test.js`

**Step 1: 编写 contract tests**

为 `dspy-ruby` 断言：
- signature / modules / optimization / provider adapters / lifecycle callbacks 等核心面存在
- `assets/` 与 `references/` 关键文件存在
- Claude/Codex transform 保持 skill identity

为 `gemini-imagegen` 断言：
- generate / edit / compose / multi-turn chat 能力面存在
- `requirements.txt` 与 5 个核心脚本存在
- Claude/Codex transform 保持 skill identity

**Step 2: 运行 tests 验证**

Run: `npx jest tests/unit/dspy-ruby-contracts.test.js tests/unit/gemini-imagegen-contracts.test.js --runInBand`

Expected: 2 个 test 文件全部通过

**Step 3: 审查本批 diff**

Run: `git diff --check -- tests/unit/dspy-ruby-contracts.test.js tests/unit/gemini-imagegen-contracts.test.js`

Expected: 无 whitespace / conflict 问题

### Task 3: 回写审计与治理文档

**Files:**
- Modify: `docs/业界分析/9.spec-first-vs-compound-engineering-plugin-全量同步审计-2026-04-14.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/08-版本更新/README.md`

**Step 1: 更新审计文档**

把以下行的 `代码修复状态` 改为 `已完成`，并注明“已做上游代码事实核对 + contract tests 已落地”：
- `agent-native-architecture`
- `andrew-kane-gem-writer`
- `dspy-ruby`
- `gemini-imagegen`
- `git-clean-gone-branches`

**Step 2: 更新治理文档**

- `CHANGELOG.md` 增加一条用户可见记录
- `docs/08-版本更新/README.md` 增加一条该批 skill parity/contract freeze 的摘要

**Step 3: 运行文档 diff 自检**

Run: `git diff --check -- CHANGELOG.md docs/08-版本更新/README.md "docs/业界分析/9.spec-first-vs-compound-engineering-plugin-全量同步审计-2026-04-14.md"`

Expected: 无格式错误

### Task 4: 最终验证

**Files:**
- Verify only

**Step 1: 运行所有新增 tests**

Run: `npx jest tests/unit/agent-native-architecture-contracts.test.js tests/unit/andrew-kane-gem-writer-contracts.test.js tests/unit/dspy-ruby-contracts.test.js tests/unit/gemini-imagegen-contracts.test.js tests/unit/git-clean-gone-branches-contracts.test.js --runInBand`

Expected: 全部通过

**Step 2: 汇总目标文件 diff 检查**

Run: `git diff --check -- tests/unit/agent-native-architecture-contracts.test.js tests/unit/andrew-kane-gem-writer-contracts.test.js tests/unit/dspy-ruby-contracts.test.js tests/unit/gemini-imagegen-contracts.test.js tests/unit/git-clean-gone-branches-contracts.test.js CHANGELOG.md docs/08-版本更新/README.md "docs/业界分析/9.spec-first-vs-compound-engineering-plugin-全量同步审计-2026-04-14.md"`

Expected: 无格式问题

**Step 3: 人工确认上游对齐依据**

记录本轮只读事实：
- `diff -qr` 对应上游 skill 目录均为一致
- `gemini-imagegen` 仅存在本地未跟踪 `__pycache__/` 非源码差异

