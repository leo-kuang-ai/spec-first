---
spec_id: spec-debug-ce-full-parity
title: "feat: spec-debug 集成 ce-debug 全能力并保留 spec-first 证据治理"
type: feat
status: proposed
date: 2026-07-09
plan_depth: detailed
author: leokuang
target_repo: "."
related_docs:
  - docs/10-prompt/结构化项目角色契约.md
  - docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md
  - docs/plans/2026-06-27-002-feat-spec-debug-discipline-borrow-from-diagnosing-bugs-plan.md
  - skills/spec-debug/SKILL.md
  - tests/unit/spec-debug-contracts.test.js
external_refs: []
local_benchmark_refs:
  - /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug/SKILL.md
  - /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug/references/agents/repo-profiler.md
  - /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug/references/anti-patterns.md
  - /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug/references/defense-in-depth.md
  - /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug/references/investigation-techniques.md
  - /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug/references/repo-profile-cache.md
  - /Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug/scripts/repo-profile-cache.py
---

# feat: spec-debug 集成 ce-debug 全能力并保留 spec-first 证据治理

## Summary

本计划把 CE `ce-debug` 的完整承重能力集成到 spec-first `spec-debug`，但不采用整文件覆盖。正确方向是以当前 `spec-debug` 为主干，保留 spec-first 已有的 evidence/context/provider/runtime 治理增强，再补回 CE 中仍缺失或弱化的 debug workflow 能力。

已核对的事实：

- CE `ce-debug` source 资产只有 `SKILL.md`、4 份 references、1 份 `references/agents/repo-profiler.md` 和 1 个 `scripts/repo-profile-cache.py`。
- `spec-debug` 已有 CE 的 reference/agent/script 基线，并做了正确 spec-first 投影：repo-profile cache 从 `/tmp/compound-engineering` 改为 `/tmp/spec-first`。
- 当前差距主要在 `SKILL.md` 的流程合同：CE 的 tracker/PR history 检查、pre-fix scope、post-fix simplify/review/residual tail 和 `Post-Fix Quality` 输出，在当前 `spec-debug` 中缺失或被收窄。
- 当前 `skills/spec-debug/scripts/hitl-loop.template.sh` 注释仍与 SKILL contract 冲突：SKILL.md 说 HITL 是用户运行脚本、agent 读取 captured output；脚本注释写成 agent runs script。
- `skills/spec-debug/evals/examples.json` 是 spec-first-only examples-as-context，CE `ce-debug` 中不存在；当前 worktree 已删除该 fixture，且 `SKILL.md` 已无 `Examples As Context` / `evals/examples.json` 引用。本计划把它作为已发生 cleanup 的确认项处理：删除理由必须来自 stale / 无 active runtime consumer / 避免行为真相源漂移，而不是单纯“CE 中不存在”。

最终目标：`spec-debug` 在真实 debug 场景中提升 root-cause 可信度、复杂修复交付安全性和 PR-ready handoff 质量。CE parity 是达成该目标的迁移手段，不是最高层产品 outcome；`spec-debug` 仍必须保留 spec-first 的 direct evidence closeout、runtime/source 边界、provider 降级、docs/solutions recall、performance regression、HITL、correct-seam test 和 failed-fix evidence reset。

## Product Hypothesis

本计划解决的用户可感知问题：

- recurring / regression bug 可利用 prior PR、open duplicate、unmerged fix 和 prior failed attempt 作为 advisory context，减少重复踩同一坑。
- dirty 或 pre-existing branch 上执行修复时，pre-fix scope 和 fix-owned files 能防止 simplify/review/cleanup 误改用户已有工作。
- 复杂修复在 closeout 前能经过 right-sized simplify/review/residual handling，并输出 direct evidence 与 `Post-Fix Quality`，减少“本地绿但 PR 不可交付”的落差。
- 普通小修仍走轻路径：trivial bug 不默认触发 tracker/history 或 full shipping tail，避免把 `spec-debug` 变成 release workflow。

## Goals / Non-Goals

### Goals

1. **补回 CE tracker/PR history 能力**：非 trivial bug 在 investigation 阶段 targeted 查询 open duplicate、unmerged fix、prior merged failed attempt、原始 fixing PR / linked issue。
2. **补回 CE pre-fix scope 记录**：Phase 3 写入前记录 `pre_fix_head`、工作区是否 clean、pre-existing changed files，并维护 fix-owned files。
3. **补回 CE post-fix quality tail**：在 Phase 4 commit/PR 前恢复 simplify、review、residual handling、tail edits re-verification、`Post-Fix Quality` 输出。
4. **保留并显式融合 spec-first 增强**：feedback loop readiness、direct evidence fields、runtime exclusion、capability-class provider boundary、docs/solutions recall trust boundary、perf branch、HITL loop、correct-seam test、failed-fix reset。
5. **修复 HITL 脚本注释冲突**：注释改为用户运行脚本，agent 读取 `KEY=VALUE` output。
6. **补 contract tests**：用 focused Jest 守护 CE 能力回归、spec-first boundary 保留、CE 命名残留禁入。
7. **更新审查记录和 Changelog**：把 `ce-debug` -> `spec-debug` 的 restore 项从“待补回”推进为 plan-backed implementation target。
8. **确认 spec-only `evals/examples.json` cleanup**：当前 worktree 已删除该 fixture 且 `SKILL.md` 无引用；实施时只确认无 active consumer / 无 stale 引用，并在验证与 Changelog 中如实记录替代评估路径。

### Non-Goals

1. 不恢复 CE 品牌、命令、路径或 `/ce-*` 入口。
2. 不把 `ce-debug` 整文件覆盖到 `spec-debug`。
3. 不删除 spec-first 已有 evidence/context/provider/runtime 边界。
4. 不新增 tracker 查询脚本或新 typed agent；当前用 host 工具、CLI、MCP 或 API 做 targeted query 即可。
5. 不让脚本判断 root cause、review finding 是否成立、是否应修复等语义问题。
6. 不把 `spec-debug` 改成强状态机；只 gate 完成声明、写入、副作用和 shipping exit。
7. 不手改 generated runtime mirrors：`.agents/`、`.claude/`、`.codex/`、`.cursor/`、`.kiro/`、`.qoder/`。

## Source / Runtime Boundary

### Source-of-Truth

本计划允许修改：

- `skills/spec-debug/SKILL.md`
- `skills/spec-debug/scripts/hitl-loop.template.sh`
- `tests/unit/spec-debug-contracts.test.js`
- `docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md`
- `CHANGELOG.md`

本计划确认 `skills/spec-debug/evals/examples.json` 已删除，不再把它作为待执行 source mutation；若后续发现 active eval consumer，应恢复或另开 cleanup 决策，而不是把 CE 缺失当作删除充分理由。

### Generated Runtime

不得手改：

- `.agents/skills/spec-debug/**`
- `.claude/spec-first/workflows/spec-debug/**`
- `.codex/**`
- `.cursor/skills/spec-debug/**`
- `.kiro/skills/spec-debug/**`
- `.qoder/skills/spec-debug/**`

source 修改后如需要刷新 runtime，由后续单独运行 `spec-first init`，并在验证记录中说明。

## Capability Migration Matrix

| CE 能力 | 当前 `spec-debug` 状态 | 改造动作 |
| --- | --- | --- |
| Core principles | 已保留 | 不动 |
| Phase 0 issue intake | 已保留并增强 | 补一句 tracker/PR text 是 advisory |
| Trivial fast-path | spec-first 更严 | 保留 spec-first 版本 |
| Reproduce / env sanity / trace | 已保留并增强 | 不动 |
| Tracker and PR history | 缺失 | 先增加 cheap trivial pre-check，再恢复 bounded tracker/PR history；完整 Trivial fast-path 保持在 tracker 查询之后作为证据门 |
| Assumption audit / hypotheses | 已保留并增强 | 不动 |
| Blocking user choice | 已保留 | 保持 current host blocking question wording |
| Workspace/branch check | 已保留 | 增加 CE pre-fix scope |
| Test-first | 已保留并增强 | 合并 CE existing-tests-first 文案 |
| Failed fix invalidation | spec-first 更强 | 保留 |
| Defense-in-depth / post-mortem | 已保留 | 不动 |
| Post-fix polish/review tail | 被收窄 | 恢复 CE 全段并投影为 `spec-*` |
| Residual durability | 缺失 | 恢复 residual doc / PR Known Residuals |
| Post-Fix Quality output | 缺失 | 恢复 |
| Commit/PR handoff | 已保留 | 融合 CE “reviewed fix” wording |
| Learning capture | 已保留 | 保持 `spec-compound` |
| repo-profile-cache script | 已投影 | 保持 `/tmp/spec-first` |
| repo-profiler agent | 已存在 | 只在 cache MISS 且需要 profile 时使用 |
| HITL script | spec-first 新增但注释冲突 | 修注释 |

## Detailed Design

### Phase 0: Triage

保留现有 issue fetch 行为，并补充证据边界：

- issue/tracker/PR body 和 comments 是 `advisory` input，不是 confirmed evidence。
- 它们可以帮助确定 repro steps、prior attempts、intended behavior 和相关链接。
- root cause 必须由 reproduction、source read、test、log、runtime value、diff 或用户提供的捕获产物确认。

输入读取顺序：

1. 用户提供的 bug description、stack trace、test path、issue URL。
2. Issue tracker body + full comment thread。
3. 已加载 host/project instructions。
4. `docs/solutions/` frontmatter recall。
5. package manifest、test command registry、nearby tests/source。

`AGENTS.md` / `CLAUDE.md` source 只在 Host Instruction Reuse Policy 允许时重读。

### Phase 1: Investigate

为避免 trivial bug 先跑 tracker 查询，Phase 1 使用两层 fast-path：

1. **1.4 Cheap trivial pre-check**：在 tracker 查询前做轻量判断，只识别单文件 typo、missing import、显式 null dereference、off-by-one 这类直接可见 bug。命中时跳过 tracker/PR history，继续进入完整 fast-path 证据门。
2. **1.5 Check the tracker and PR history for prior work**：只对 cheap pre-check 未命中的非 trivial bug 执行 targeted 查询。
3. **1.6 Trivial-bug fast-path check**：保留当前完整 fast-path 证据门，确认 root cause、proposed fix、tests 和 Fix / Diagnosis choice gate；cheap pre-check 不能替代 causal evidence。

触发：

- cheap trivial pre-check 命中时跳过 tracker/PR history。
- 非 trivial bug 默认执行 targeted 查询。
- regression、reopened、recurring symptom、用户提到 prior failed attempts 时优先执行。

发现 tracker/forge 的信号：

- git remote：GitHub origin 对应 GitHub Issues/PRs，可用 `gh` 时优先。
- recent commit messages、branch names、PR titles 中的 issue key：如 `ABC-123`。
- 当前已加载项目说明中显式提到的 tracker 或 forge。

查询范围：

- symptom phrase。
- exact error string。
- affected file / module / area。
- Phase 1.3 中 `git log -- <file>` 暴露的 fixing commit 对应 PR / issue。

查询预算与边界：

- 默认最多 3 个精确查询，优先使用 repo forge primary source（例如 GitHub remote 对应的 `gh`）。
- `none found` 只表示 `searched_no_match`，不是 confirmed absence。
- 外部搜索或 web fetch 只能作为 degraded fallback，必须记录 source freshness 和 auth/visibility limits。
- 不因查询缺工具、缺 auth、无 match 而阻塞 direct evidence debug path。

高价值结果：

- open ticket or PR for same bug。
- unmerged fix on another branch。
- prior merged PR attempted same approach and bug persists。
- original fixing PR / linked issue behind a regression。

输出进入 Phase 2 的 context ledger，建议字段：

```text
source_tag: advisory
tracker_or_forge: <github|jira|linear|unknown>
searched_queries:
  - <query string>
result_link: <url or none>
debug_relevance: <open duplicate|unmerged fix|prior failed attempt|original fixing context|none>
freshness: <fetched_at or unknown>
auth_scope: <authenticated|public-only|unknown>
limits: <auth missing|tool unavailable|partial thread|searched_no_match|not searched>
```

缺工具或 auth 时不阻塞 debug：记录 `tracker_history_unavailable` 并继续 direct evidence path。

### Phase 2: Root Cause

保留当前 feedback loop readiness、hypothesis ledger、assumption audit 和 causal chain gate。

`Present findings` 增加 related tracker/PR section：

- 如果 open PR 已经修复同一问题，先展示链接，不重复实现。
- 如果 prior merged attempt 与当前方案相同，明确该方案被历史负证据 invalidated。
- 如果 original fixing PR 暴露 intended behavior，把它作为 advisory context 写入推荐，但不当作 root-cause proof。

`Rethink design` 继续使用 “current host's brainstorm entrypoint”，不写 `/ce-brainstorm` 或 legacy host spelling。

### Phase 3: Fix

在 `Workspace and branch check` 中恢复 CE pre-fix scope：

```text
pre_fix_head: <git rev-parse HEAD>
pre_fix_status_clean: <true|false>
pre_existing_changed_files:
  - <path>
fix_owned_files:
  - <path changed or created during Phase 3>
```

用途：

- Phase 4 simplify/review 限定 scope。
- 防止自动 cleanup、review autofix 或 simplify 改写用户已有 work。
- pre-existing dirty branch 上只允许 fix-owned files 进入 automated tail。

Test-first 合并 CE 和 spec-first：

1. 先 inspect affected behavior 的 existing tests。
2. 用 repo-profile-cache 获取 testing convention：
   - `HIT`：读 `conventions.testing`。
   - `MISS`：可用 `references/agents/repo-profiler.md` 派生 profile，再 `repo-profile-cache.py put`。
   - `NO-CACHE` 或 helper failure：从 nearby tests/source 直接推导。
3. 执行 correct-seam judgment：
   - correct seam exists：写 failing test。
   - shallow seam only：仍写 test，但标注 blocking advisory。
   - no seam that can fail for right reason：不写 fake test，记录 architecture finding。
4. 写 minimal root-cause fix。
5. 失败后回 Phase 2，先记录 invalidated evidence。

写入边界：

- Phase 3 前必须有 single explicit `target_repo` 或 per-fix repo scope。
- 不让 cwd 或 broad workspace discovery 选择 sibling repo。
- 若 fix-owned file 有 pre-existing user edits，进入 Phase 4 tail 时要跳过可能重写 unrelated hunks 的自动操作。

### Phase 4: Handoff

保留当前 `Debug Summary`，并保持 direct evidence fields：

```text
## Debug Summary
**Problem**:
**Root Cause**:
**Recommended Tests**:
**Direct evidence**:
- claims_validated_by:
- claims_remaining_advisory:
**Fix**:
**Prevention**:
**Confidence**:
```

继续优先引用 `verification-run-summary.v1`，避免 freeform “tests passed”。

在 Debug Summary 和 branch handoff 之间恢复 CE `Post-fix polish/review tail`。

#### Post-fix polish/review tail

运行时机：Phase 3 执行后、commit/PR handoff 前。

目标：让 fix PR-ready，不只是 locally green。

规则：

1. **Contextual overrides first**
   - 尊重用户或已加载项目指令中的 explicit override：minimal hotfix only、do not run review、always ask before cleanup、ship smallest possible diff。
   - 跳过时必须说明。

2. **Skip the tail only with a reason**
   - 可跳过：typo/import-only、formatting/lint-only、dependency/version-only、generated artifacts、docs-only、约 10 行以内且不触及敏感面。
   - 即使跳过，也保留 Phase 3 tests 和 self-review。

3. **Simplify before review when useful**
   - 使用 `spec-simplify-code` 的当前 host 默认入口（交互式）。除非 caller 明确处于 pipeline/headless 上下文，否则不使用 `mode:agent`。
   - 触发条件：>=30 changed lines、多 implementation files、新 helper/abstraction、auth/authz、public contracts、persistence、concurrency、background jobs、external services。
   - skill-owned branch 或 clearly fix-only branch 可用 branch diff。
   - pre-existing branch 只 scope 到 fix-owned files。
   - fix-owned file 若有 pre-existing edits，跳过该文件并记录：`Simplify: skipped for overlapping pre-existing edits`。

4. **Review the final fix scope**
   - 使用 `spec-code-review` 的当前 host 默认入口（交互式），或 current host lightweight review。除非 caller 明确处于 pipeline/headless 上下文，否则不使用 `mode:agent`。
   - 默认 review 只在 scope 明确为 fix-only 时运行：skill-owned branch，或 pre-fix tree clean 且可传 `base:<pre-fix-HEAD>`。
   - dirty branch 或 unrelated committed work 时，不运行默认 branch/worktree review；改用 file-scoped review 或 targeted manual review。

5. **Handle residual findings before shipping**
   - 未解决 P0/P1 finding 阻断自动 PR。
   - 需要 product/design decision 的 finding 阻断自动 PR。
   - 用户接受的 lower-severity residual 必须持久化：
     - 若开 PR：传给 `spec-commit-push-pr` 作为 `Known Residuals`。
     - 若 commit-only 或 stop：写 `docs/residual-review-findings/<branch-or-head-sha>.md`。

6. **Re-verify after tail edits**
   - simplify/review 改代码后，重跑 regression test 和相关 targeted checks。
   - 不允许 red tree 进入 commit/PR。

Invocation matrix：

| Context | Tail behavior |
| --- | --- |
| interactive default | 可运行一轮 `spec-simplify-code` 和一轮 `spec-code-review` 当前 host 默认入口；遇到需要用户判断的 finding 时停止并 handoff |
| headless / pipeline caller explicitly authorized | 可使用 `mode:agent` 或等价非交互入口；必须继承 caller scope，不扩大到整 branch |
| no dispatch / no skill invocation available | 退化为 lightweight self-review + explicit residual risk，不声称完成 full tail |
| dirty or unrelated branch work | 只做 fix-owned files / targeted manual review；overlapping pre-existing edits 跳过自动 rewrite |

Tail 上限：本 workflow 最多执行一轮 simplify/review tail。tail edits 后重验一次；若 review 继续产生 P0/P1、product/design decision 或需要新一轮大改，`Post-Fix Quality` 标为 `blocked` / `degraded` 并 handoff，不在 `spec-debug` 内无限嵌套。

新增输出：

```text
## Post-Fix Quality
**Scope**: [fix-only branch / base:<pre-fix-HEAD> / fix-owned files only / targeted manual due to unrelated branch work]
**Simplify**: [ran/skipped + reason]
**Review**: [ran/skipped/manual + outcome]
**Residuals**: [none / accepted Known Residuals for PR / accepted residuals written to docs/residual-review-findings/<branch-or-head-sha>.md / blocked pending user decision]
**Re-verification**: [checks rerun after tail edits]
```

#### Branch Handoff

Skill-owned branch：

- 检查 contextual overrides。
- 预告将 commit 和 open PR。
- 运行 `spec-commit-push-pr`。
- issue tracker input 存在时，在 tracker 解析的位置加入 close syntax，如 GitHub PR body 的 `Fixes #N`。

Pre-existing branch：

- 使用 blocking question tool。
- options：
  1. `Commit and open a PR (spec-commit-push-pr)`
  2. `Commit the fix`
  3. `Stop here`

Learning capture：

- PR open 后再判断。
- mechanical fix 默认 silent skip。
- 一句话可复用 lesson 时中性提示。
- pattern 3+ 或共享依赖/框架错误假设时重点提示。
- 接受后运行 `spec-compound`，并把 learning doc commit 到同一分支。

## Script Strategy

### `repo-profile-cache.py`

保持现状，不从 CE 回滚：

- cache root 继续是 `/tmp/spec-first/repo-profile`。
- 脚本只做 deterministic get/put、schema/hash/cache invalidation。
- 不让脚本判断 testing convention 是否语义充分。

### `hitl-loop.template.sh`

只改注释，不改执行逻辑：

- 当前错误注释：`The agent runs the script; the user follows prompts in their terminal.`
- 应改为：`The user runs the script; the agent reads captured KEY=VALUE output afterward.`

原因：agent tool call 运行交互式 `read` 脚本会因 stdin 关闭或 TTY 不匹配而失败；HITL loop 是 human-operated last resort。

### 不新增 tracker script

不新增 `tracker-history.sh` 或类似脚本。tracker/forge 生态差异大，当前需求是 targeted query，不是 deterministic invariant。由 LLM 根据 repo signals 选择 `gh`、MCP、documented API 或 web fetch 更合适。

## Agent Strategy

### `repo-profiler`

`references/agents/repo-profiler.md` 保持现状，仅在以下条件使用：

- repo-profile cache `MISS`。
- 当前 fix 需要 testing conventions / repo profile。
- 直接 source reads 不足以快速确认 convention。

输出 profile 后，通过 `repo-profile-cache.py put <file>` 持久化。

### Parallel Investigation Agents

保留当前策略：

- 只在 hypotheses evidence-bottlenecked 且分布在独立子系统时使用。
- sub-agent read-only。
- 不编辑代码。
- hypotheses 相互依赖时不用 parallel。
- host 不支持或 dispatch 未授权时，按 ranked-likelihood 顺序串行 probe。

### 不新增 `tracker-researcher`

CE 的 tracker/PR history 是 targeted queries，不是复杂 research workflow。新增 agent 会增加维护面和 dispatch 边界，不符合 80/20。

## Artifact Design

### Run-local Context Ledger

不默认落盘，作为 workflow 内部记录，最终摘要提炼使用：

```text
path_or_source:
reason:
phase:
source_tag: confirmed|advisory|session-local|stale|user
summary:
limits:
```

### Hypothesis Ledger

不默认落盘，不定义 durable schema：

```text
hypothesis:
prediction:
evidence_for:
evidence_against:
probe_result:
final_root_cause:
```

### Debug Summary

面向用户、PR 和 issue tracker 的 handoff artifact，必须区分 direct evidence 和 advisory claims。

### Post-Fix Quality

Phase 4 新增输出 artifact，证明 fix 已经过 shipping-readiness tail 或明确跳过。

### Residual Findings File

只在 accepted residuals 且没有 PR body 承载时写入：

`docs/residual-review-findings/<branch-or-head-sha>.md`

建议模板：

```md
# Residual Review Findings

**Source**: spec-debug
**Branch/Head**: <branch-or-head-sha>
**Review Scope**: <scope>
**Accepted By**: <user/session>
**Date**: YYYY-MM-DD

## Findings

- Severity:
  Finding:
  Reason accepted/deferred:
  Follow-up condition:
```

## Context Read Policy

默认读取：

- reported symptom / repro path / stack trace / issue thread。
- package scripts / test commands。
- nearby source/tests。
- `git status`、`git log -- <affected files>`。
- `docs/solutions/` frontmatter。
- direct runtime logs when they reproduce the symptom or user points to them。

条件读取：

- `AGENTS.md` / `CLAUDE.md` source：仅在 loaded context missing/stale、用户点名、source/runtime governance、目录级 instruction 影响改动时读取。
- generated mirrors：默认不读，除非 bug 明确是 setup/update/runtime drift/audit/governance。
- `.spec-first/audits/**`、`.spec-first/governance/**`：默认不读。
- Graphify/code-graph：只作 advisory navigation，必须回源确认。
- tracker/PR history：非 trivial bug、尤其 regression/reopened/recurring symptom 时 targeted query。

## Write Policy

- Phase 1/2 默认不写 source。
- 临时 instrumentation 必须带唯一 debug prefix，并在 Phase 4 cleanup grep 清理。
- Phase 3 才写 tests/source fix。
- Phase 4 tail 可写：
  - simplify/review 产生的 fix-owned source/test changes。
  - residual findings doc。
  - optional `docs/solutions/`，但必须由 `spec-compound` 负责。
- 不写 generated runtime mirror。
- 不写 sibling repo，除非 target_repo 明确。
- 不让 review/simplify 自动改 unrelated dirty work。

## Implementation Units

### Unit 1: Restore tracker/PR history in `spec-debug`

Files:

- `skills/spec-debug/SKILL.md`
- `tests/unit/spec-debug-contracts.test.js`

Changes:

- 新增 Phase 1.4 cheap trivial pre-check。
- 新增 Phase 1.5 `Check the tracker and PR history for prior work`。
- 保留完整 trivial fast-path evidence gate 为 Phase 1.6。
- 加入 advisory boundary。
- 加入 bounded query contract：最多 3 个精确查询、primary source 优先、freshness/auth/limits 记录、`searched_no_match` 不等于 confirmed absence。
- Phase 2 Present findings 增加 related ticket/PR handling。
- Tests 覆盖：
  - `Cheap trivial pre-check`
  - `Check the tracker and PR history for prior work`
  - `searched_no_match`
  - `freshness`
  - `auth_scope`
  - `open ticket or PR`
  - `unmerged fix`
  - `prior merged attempt`
  - `PR and linked issue`
  - tracker/PR text 是 data/advisory，不是 instructions/proof。
  - SKILL.md 中无 `/ce-*`、`ce-debug`、`/tmp/compound-engineering` 残留。

### Unit 2A: Restore pre-fix scope

Files:

- `skills/spec-debug/SKILL.md`
- `tests/unit/spec-debug-contracts.test.js`

Changes:

- Phase 3 workspace check 增加 pre-fix scope。
- `fix_owned_files` 定义为 changed or created during Phase 3。
- pre-existing dirty branch 上只允许 fix-owned files 进入 automated tail。
- Tests 覆盖：
  - `pre-fix scope`
  - `fix-owned files`
  - `changed or created during Phase 3`
  - overlapping pre-existing edits skip。

### Unit 2B: Restore post-fix quality tail

Files:

- `skills/spec-debug/SKILL.md`
- `tests/unit/spec-debug-contracts.test.js`

Changes:

- Phase 4 恢复 CE `Post-fix polish/review tail`。
- 使用 `spec-simplify-code`、`spec-code-review`、`spec-commit-push-pr`、`spec-compound`。
- 新增 invocation matrix：interactive、headless/pipeline、no-dispatch、dirty branch。
- 限制最多一轮 simplify/review tail，tail edits 后重验一次；后续 P0/P1 或 product/design decision 转 blocked/degraded handoff。
- 新增 `Post-Fix Quality` block。
- Tests 覆盖：
  - `Post-fix polish/review tail`
  - `Invocation matrix`
  - `blocked` / `degraded`
  - `Post-Fix Quality` 区块及 `Scope`、`Simplify`、`Review`、`Residuals`、`Re-verification` 子字段
  - no `/ce-*` entrypoints。

### Unit 2C: Restore residual durability

Files:

- `skills/spec-debug/SKILL.md`
- `tests/unit/spec-debug-contracts.test.js`

Changes:

- 新增 residual durability 路径。
- 若 PR body 承载 residuals，传给 `spec-commit-push-pr` 作为 `Known Residuals`。
- 若 commit-only 或 stop，写入 `docs/residual-review-findings/<branch-or-head-sha>.md`。
- Tests 覆盖：
  - `docs/residual-review-findings/<branch-or-head-sha>.md`
  - `Known Residuals`
  - accepted lower-severity residuals durable sink。

### Unit 3: Fix HITL template wording

Files:

- `skills/spec-debug/scripts/hitl-loop.template.sh`
- `tests/unit/spec-debug-contracts.test.js`

Changes:

- 注释改为 user runs / agent reads captured output。
- 在 `spec-debug-contracts.test.js` 中增加专属断言，验证注释措辞：
  - `The user runs the script`
  - `agent reads captured KEY=VALUE output afterward`
- 不把 HITL template 加入 `migrated-skill-scripts-contracts.test.js`：该 guard 只覆盖 CE 迁移脚本，而 `hitl-loop.template.sh` 是 spec-first 原生模板。

### Unit 4: Confirm spec-only `evals/examples.json` cleanup

Files:

- `skills/spec-debug/SKILL.md`
- `docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md`
- `CHANGELOG.md`

Changes:

- 确认当前 worktree 已删除 `skills/spec-debug/evals/examples.json`。
- 确认 `SKILL.md` 中无 `## Examples As Context` / `evals/examples.json` 引用。
- 记录删除理由为 stale / 无 active runtime consumer / 避免行为真相源漂移；不能只写 CE `ce-debug` 中不存在。
- 在 parity mapping 中标为 `cleanup-confirmed`，并写明替代验证路径：focused Jest + fresh-source eval + parity mapping。

### Unit 5: Update migration audit and changelog

Files:

- `docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md`
- `CHANGELOG.md`

Changes:

- 将 `ce-debug` -> `spec-debug` 的 `[restore]` 项标记为计划覆盖或实施完成后已处理。
- 记录保留 spec-first 增强与恢复 CE 承重能力。
- 记录删除 `evals/examples.json` 及其原因。
- Changelog 记录 source surfaces、用户可见行为、验证命令、未手改 generated runtime mirrors。

## Test Plan

Parity verification artifact:

实施 closeout 前必须生成或更新一个 lightweight parity mapping（可写入本 plan 的执行记录、审查记录或 PR 描述），逐项覆盖 `local_benchmark_refs` 中 CE `ce-debug` 的承重段落：

| CE source / section | spec-debug projection | status | reason | consumer | verification anchor |
| --- | --- | --- | --- | --- | --- |
| `<CE section>` | `<spec-debug section or omitted>` | restored / kept-enhanced / intentionally omitted / cleanup-confirmed | `<why>` | `<workflow/user/test>` | `<Jest assertion / source line / fresh-source eval checklist item>` |

Acceptance 不能只依赖关键词存在；每个 restored / kept-enhanced / intentionally omitted 项都必须有 reason 和 verification anchor。LLM/fresh-source eval 判断语义充分性，focused Jest 只守确定性锚点。

Focused verification:

```bash
npx jest tests/unit/spec-debug-contracts.test.js --runInBand
npx jest tests/unit/migrated-skill-scripts-contracts.test.js --runInBand
npx jest tests/unit/changelog-format.test.js --runInBand
git diff --check
```

If skill metadata or entrypoint wording changes materially:

```bash
npm run lint:skill-entrypoints
```

Prompt behavior validation:

- 因为这是 skill prose 行为变更，应执行 fresh-source eval。
- Eval 输入必须是当前磁盘上的 `skills/spec-debug/SKILL.md`，不能依赖当前会话已缓存 skill。
- Checklist：
  - parity mapping 是否覆盖 CE `ce-debug` 的承重段落，且每项都有 status / reason / verification anchor。
  - 是否完整补回 CE tracker/PR history。
  - 是否完整补回 CE post-fix tail。
  - 是否保留 spec-first evidence/context/provider boundaries。
  - 是否无 `/ce-*`、`ce-debug`、`/tmp/compound-engineering` 残留。
  - 是否没有让脚本做语义判断。

如果当前 host 不能 dispatch fresh-source reviewer，最终 closeout 必须说明未执行原因，不得声称通过。

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Prompt 继续膨胀，普通 bug 执行负担变大 | trivial fast-path 跳过 tracker/tail；tail 有 skip-with-reason |
| tracker/PR history 被误当 truth | 明确 advisory；root cause 必须 direct evidence 确认 |
| tracker 查询变成开放式外部调查 | bounded query contract：最多 3 个精确查询、primary source 优先、freshness/auth/limits 记录 |
| simplify/review 改写用户已有工作 | pre-fix scope + fix-owned files + dirty overlap skip |
| post-fix tail 嵌套成无限 shipping workflow | invocation matrix + 最多一轮 tail + blocked/degraded handoff |
| CE 命名残留 | focused negative tests |
| residual artifact 污染 docs | 只在 accepted residuals 且无 PR body 承载时写 |
| 新 tail 阻塞小修 | skip tail only with reason，mechanical fix 可跳过 |
| 删除 eval fixture 削弱 Evaluation Harness | cleanup-confirmed 必须记录无 active consumer / stale rationale，并由 parity mapping + fresh-source eval 补评估证据 |
| runtime mirror 漂移 | source-first；如需刷新，单独 `spec-first init` |

## Rollout Order

1. 确认 `skills/spec-debug/evals/examples.json` 已删除、`SKILL.md` 无对应引用，并记录 cleanup rationale 与替代验证路径。
2. 补 `tests/unit/spec-debug-contracts.test.js` 中 CE parity contract 断言，让测试先表达目标。
3. 修改 `skills/spec-debug/SKILL.md`：
   - 新增 Phase 1.4 cheap trivial pre-check。
   - 新增 Phase 1.5 bounded tracker/PR history。
   - 保留完整 trivial fast-path evidence gate 为 Phase 1.6。
   - Phase 3 pre-fix scope 与 changed-or-created fix-owned files。
   - Phase 4 post-fix tail invocation matrix + Post-Fix Quality。
   - residual durability sink。
4. 修 `skills/spec-debug/scripts/hitl-loop.template.sh` 注释。
5. 在 `tests/unit/spec-debug-contracts.test.js` 中增加 HITL 注释专属断言（不加入 migrated-skill-scripts guard）。
6. 确保 `docs/residual-review-findings/` 目录存在（首次写入前创建）。
7. 生成或更新 parity mapping。
8. 更新 `docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md`。
9. 更新 `CHANGELOG.md`。
10. 运行 focused verification。
11. 执行 fresh-source eval 或记录未执行原因。
12. 不自动运行 `spec-first init`；由后续 runtime refresh 任务处理。

## Acceptance Criteria

- parity mapping 覆盖 CE `ce-debug` 的全部承重流程能力，每项都有 status / reason / consumer / verification anchor。
- `spec-debug` 的用户 outcome 明确：recurring/regression bug 有 prior-work advisory context，dirty branch tail 不误改用户 work，复杂修复 closeout 有 direct evidence 与 `Post-Fix Quality`。
- `spec-debug` 保留现有 spec-first 增强，不回退为 CE-only。
- `spec-debug` source 中无 `/ce-*`、`ce-debug`、`/tmp/compound-engineering` 残留。
- `spec-debug` 无 spec-only `evals/examples.json` 第二真相源，且 cleanup rationale 与替代验证路径已记录。
- HITL script 注释与 SKILL contract 一致。
- Post-fix residuals 有 durable 落点。
- tracker/PR history 有 bounded query contract，不把 `searched_no_match` 当 confirmed absence。
- simplify/review tail 有明确 scope 防护、invocation matrix、一轮上限和 blocked/degraded handoff。
- focused Jest、changelog format、diff check 通过。
- 未手改 generated runtime mirrors。
