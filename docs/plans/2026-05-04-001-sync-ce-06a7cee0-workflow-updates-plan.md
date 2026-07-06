---
title: 同步 CE 06a7cee0 workflow 更新到 spec-first 技术方案
date: 2026-05-04
status: completed
type: plan
source: ce-sync
ce_range: 4b5f28da..06a7cee0
ce_head: 06a7cee0ad68cb50cebdb8a2a864ec4148ffba78
origin: docs/solutions/architecture-patterns/upstream-ce-sync-upgrade-methodology-2026-04-26.md
completed_at: 2026-05-12
completion_evidence: docs/validation/2026-05-05-ce-06a7cee0-sync-ledger.md
---

# 同步 CE 06a7cee0 workflow 更新到 spec-first 技术方案

## 摘要

本计划用于把 CE `4b5f28da..06a7cee0` 中适合 spec-first 的 workflow、agent、script 和 governance 变更同步到当前仓库。同步采用“事实取证 + 语义适配”方式：安全修复和既有 workflow 改良进入本轮实施，新产品能力入口先进入产品边界 spike，不把 CE 新 skill 机械复制进 spec-first。

2026-05-04 再审校准后，本计划进一步收紧同步口径：目标文件已存在的 agent、skill、reference 和 script 变更不再使用“直接同步并改名”作为默认判定；执行前必须先对比 CE 实际 hunk、当前 spec-first 目标文件、调用方和验证契约，再只同步能被当前项目语义支撑的最小行为切片。

## 收口记录

2026-05-12 lifecycle cleanup 复核后，本计划状态收口为 `completed`。落地证据以 `docs/validation/2026-05-05-ce-06a7cee0-sync-ledger.md` 为准：U0、U1、U2、U3、U4、U5、U6、U7、U9、U10 已完成语义同步与验证记录；U8 作为产品边界 spike 已由 `docs/validation/2026-05-05-ce-06a7cee0-u8-product-boundary-spike.md` 完成，并明确不在本同步批次新增 `spec-strategy`、`spec-product-pulse` 或 `spec-simplify-code`。

## 问题背景

CE 本轮更新覆盖 98 个文件、4004 行新增和 1158 行删除，既包含 shell safety、review numbering、PR branch/body 安全、setup/update 脚本等高价值修复，也包含 `ce-strategy`、`ce-product-pulse`、`ce-simplify-code` 等新增能力。spec-first 与 CE 已分叉，当前项目有双宿主 runtime、source/runtime 边界、公开 workflow 暴露面和 CHANGELOG 治理，不能用整文件覆盖或按 CE 路径直接迁移。

本计划遵循 `docs/solutions/architecture-patterns/upstream-ce-sync-upgrade-methodology-2026-04-26.md`：脚本负责列文件、取 diff、跑测试和残留扫描；LLM 负责同步判定、路径映射、是否保留分叉和是否延后。

## 图谱就绪度

- target_repo: `spec-first`
- status: stale
- source_revision: `dbf9bab1a871fc7aa6c790fe26b70eda10e0e0dc`
- current_revision: `10483135a1763804492500fac17e570ffe1aed78`
- stale: true
- primary_providers: `code-review-graph`, `gitnexus`
- degraded_providers: artifact 未报告 degraded provider
- fallback_capabilities: 有界直接读取仓库、读取本地 CE git diff、复用现有测试
- runtime_mcp_evidence: 本计划未使用；当前范围是 CE diff 计划，不是 symbol 行为分析
- confidence: medium
- limitations: 图谱 artifact 生成于 2026-05-01，早于当前 source revision；当前 worktree 为 dirty。本计划依赖直接 CE diff 证据和 source 读取。

## 目标

- 为 `4b5f28da..06a7cee0` 产出可实施的 CE 同步计划。
- 守住 spec-first source-of-truth 边界：只修改 `skills/`、`agents/`、`templates/`、`src/cli/`、docs 和 tests；不手改生成的 `.claude/`、`.codex/`、`.agents/skills/`。
- 同步能改善现有 spec-first workflow 质量的高置信修复：
  - shell 预解析安全与抽取后的 update scripts
  - setup 全局 skill root 检测
  - brainstorm/plan synthesis summary 与 artifact 形态纪律
  - code-review 快速路径、稳定 finding 编号、有界 reviewer dispatch、PR comment gate
  - 从新鲜远端 base 创建 PR 分支，以及 PR body 使用 `--body-file`
  - work/work-beta plan section 兼容与 review tier 成本控制
  - compound-refresh inbound link 删除保护
  - polish-beta Bash 3.2 兼容
- 在新增 strategy、product pulse、simplify-code 等能力家族前，要求显式产品边界决策。
- 将 CE tests 映射进本仓库当前 Jest/shell 测试布局，而不是复制 Bun/TS tests。

## 非目标

- 不把 CE `3.4.2` release metadata、CE changelog、CE plugin manifest、CE bun lockfile 或 CE package version 同步进 spec-first。
- 没有单独产品边界决策前，不在主实施 pass 中创建 `spec-product-pulse`、`spec-strategy` 或 `spec-simplify-code`。
- 没有显式 inbound-reference audit 和 spec-first 特定价值判断前，不删除 `spec-cli-agent-readiness-reviewer` 或 `spec-cli-readiness-reviewer`。
- 不把 CE docs 整体迁入 `docs/`；除非某个 solution doc 需要作为 spec-first learning，否则 CE docs/tests 只作为上游意图证据。
- 不通过完整复制 CE 文件来重写现有 spec-first skill 文件。

## 输入事实

用户提供的更新摘要：

```text
Updating 4b5f28da..06a7cee0
98 files changed, 4004 insertions(+), 1158 deletions(-)
```

已验证的本地 CE 事实：

- CE range: `4b5f28da..06a7cee0`
- CE head: `06a7cee0ad68cb50cebdb8a2a864ec4148ffba78`
- 完整 CE diff：98 个文件
- 过滤 `docs/**` 和 `tests/**` 后的实施目标：77 个 file entry
- CE agent diff 中，17 个保留的 code-review reviewer agents 只修改 frontmatter `tools` 一行：从 `Read, Grep, Glob, Bash` 追加 `Write`。另外 2 个 CLI readiness reviewer agents 被删除。
- 当前 spec-first `skills/spec-code-review/references/subagent-template.md` 要求带 run ID 的 leaf reviewer 将完整 JSON 分析写到 `/tmp/spec-first/spec-code-review/<run-id>/<reviewer_name>.json`，并说明这是唯一允许的写操作。
- 当前 spec-first 对应 reviewer agents 的 frontmatter 仍是 `tools: Read, Grep, Glob, Bash`，尚未授予 `Write`。
- 计划开始时观察到的 spec-first 未提交改动文件：
  - `CHANGELOG.md`
  - `docs/2026-05-04/spec-first-global-audit/08-priority-roadmap.md`
  - `docs/2026-05-04/spec-first-global-audit/09-actionable-task-list.md`

验证阶段，同一个 checkout 中又出现了额外的无关 dirty files，包括入口文档、README、`src/cli/commands/init.js` 和 dual-host/init tests。执行时以 `git status --short` 作为 source of truth，不以上方快照为准。实施不得覆盖任何既有或新出现的用户/并行改动。

## 上游提交主题

| Commit | 主题 | 同步影响 |
|---|---|---|
| `cd2fc67c` | 从新鲜远端 base 创建分支 | 以 spec-first 命名同步到 `git-commit-push-pr` |
| `41e7f72a` | 在 brainstorm/plan 中暴露 scope synthesis | 适配 `/ce-*` 到当前宿主入口后同步 |
| `8cc07acb` | 刷新 solution docs | 除非实施引用，否则仅作为证据 |
| `1f0a77bc` | 替换被权限检查阻塞的 shell 反模式 | 同步 shell safety 和 tests |
| `e806522c` | compound-refresh 删除前检查 inbound links | 同步 |
| `9751d1a3` | 在 dispatch 点重申 model override | 按当前稳定 model alias 策略同步 |
| `0c515c06` | 内联 post-generation menu routing | 如果 `spec-plan` handoff 尚未覆盖则同步 |
| `d69a772b` | subagent slot 满时 queue reviewers | 同步 bounded parallelism |
| `5ac1a063` | walkthrough entry 强制加载 reference | 同步 |
| `09fa18bc` | previous-comments persona 跳过空 PR | 同步 comment gate |
| `d217660b` | 默认 harness-native review，按风险升级 | 仅在适配 Codex/Claude host 能力后同步 |
| `15c1cde7` | 收口 plan synthesis drift | 同步 |
| `8f804669` | compound/sessions permission error | 同步 pre-resolution 简化 |
| `cb8f9b34` | 新增 strategy 与 product-pulse skills | 产品边界调研；不直接复制 |
| `265cb428` | 将 strategy doc 移到 repo root 并加 frontmatter | 产品边界调研 |
| `5e045341` | 非 git CWD branch fallback | 同步 branch-only pre-resolution |
| `3873b9e9` | URL-encode badge model slugs | 同步 |
| `2d207574` | 新增 simplify-code skill | 产品/workflow 边界调研；接受前不得从 shipping 引用 |
| `ae408721` | 删除 CLI-readiness reviewer agents | 需要删除审计；决策前默认保留 spec-first 分叉 |
| `887db6b2` | setup 检测 Codex global skills | 同步 |
| `520a9ebe` | 给 JSON-pipeline reviewers 授予 Write | 如果当前 agent frontmatter 使用 tool allowlists，则同步 |
| `607c52ab` | 将 resolve-base script 移到 scripts dir | 同步 source path 和 tests |
| `71d23d14` | tests 强制 CE prefix | 如有价值，适配为 `spec-*` prefix governance |
| `74624f8e` | simplify-code 按 ripple risk 决定 test scope | 产品/workflow 边界调研 |
| `9539bf04` | 移除 `!` backticks 中的 bash parameter expansion | 同步 |
| `caf5e125` | Bash 3.2 project detection | 同步 polish-beta script |
| `a84cb759` | PR description 使用 `--body-file` | 同步 |
| `e8567566` | 稳定 code-review finding 编号 | 同步 |
| `06a7cee0` | CE release main | 不同步 release metadata |

## 过滤规则

默认实施范围排除 CE `docs/**` 和 `tests/**`。被排除的文件仍作为证据：

- CE `docs/brainstorms/2026-04-24-surface-scope-earlier-requirements.md` 和 `docs/plans/2026-04-26-feat-surface-scope-earlier-plan.md` 解释 synthesis-summary 功能。
- CE `docs/solutions/workflow/stale-local-base-contamination.md` 解释 branch creation 修复。
- CE tests 定义需要移植到本仓库 `tests/unit/*` 形态的断言。

## 同步质量校准规则

- 文件判定表只是同步索引，不是直接编辑许可。每个 `M`/`R`/`D` 文件在实施前必须补齐一次当前项目语义对比：CE 实际 hunk、spec-first 当前目标文件状态、调用方或 selector、要同步的最小切片、验证断言。
- 已存在的 spec-first 目标文件默认走“语义适配”。只有新增 reference/script 且不存在现有目标语义、或 diff 纯粹是路径/命名替换并已证明无 host/runtime 边界影响时，才允许“直接同步”。
- Agent、skill frontmatter、tool allowlist、selector、workflow entrypoint、artifact path、runtime governance 和 README count 变更必须单独写清 source-of-truth、generated runtime、consumer 和验证边界。
- CE tests 不直接复制，但其断言必须被映射为本仓库的 contract/unit/shell tests；如果没有可落点的测试，计划必须记录保留为 manual verification 的原因。
- 删除类变更必须先做 inbound-reference audit。CE 删除 selector 或文件不代表 spec-first 删除；spec-first 作为 CLI/workflow harness 的特有覆盖面优先于 CE parity。
- 当前 worktree 有多处无关 dirty files，执行时必须以最新 `git status --short` 为准；任何目标文件存在既有改动时，先读当前内容并局部合并，不覆盖用户/并行改动。

## 实施对比 Ledger Contract

过滤后的 77 个 CE file entries 已在本计划中完成计划级判定；实施时不要求把 77 行全部复制成新表，但任何会导致 spec-first source patch、删除决策或公开 surface 变化的 CE entry，都必须进入 implementation ledger。

ledger 的落点必须是可审查的 durable artifact：

- PR 模式：PR body 中的 `## CE Sync Ledger` section。
- 无 PR 或本地执行模式：`docs/validation/<YYYY-MM-DD>-ce-06a7cee0-sync-ledger.md`。

ledger 每行必须能从 spec-first changed target 反查到上游证据。最低列要求：

| 列 | 要求 |
|---|---|
| `spec-first target` | 精确目标路径；如果一个目标聚合多个 CE entries，列出所有来源 |
| `CE source` | CE file/status 和 commit 或 hunk 摘要 |
| `target current state` | 目标当前职责、frontmatter、selector、调用方或 artifact contract |
| `accepted slice` | 本轮实际同步的最小行为切片 |
| `kept/deferred slice` | 明确保持分叉、延后或不同步的部分 |
| `validation` | 能证明该切片的测试、source scan、fresh-source eval 或 manual reason |

完备性要求：

- `agents/`、`skills/`、`templates/`、`src/cli/`、`README*`、`AGENTS.md`、`CLAUDE.md`、`docs/` 中的每个实施改动目标，都必须在 ledger 的 `spec-first target` 中出现一次。
- `CHANGELOG.md` 可只记录在最终变更说明中，不要求单独 ledger 行。
- `docs/validation/*ce-06a7cee0-sync-ledger.md` 自身如果作为 ledger artifact 创建，不需要自引用。
- product-boundary spike、CLI readiness 删除审计、CE release metadata 等未实施项，可以继续依赖本计划的文件判定表；一旦实施 patch，必须补 ledger 行。

## 路径映射

| CE 路径 | spec-first 目标 |
|---|---|
| `.compound-engineering/config.local.example.yaml` | `.spec-first/config.local.example.yaml`，仅同步已接受的 config keys |
| `plugins/compound-engineering/AGENTS.md` | `AGENTS.md` 和/或 source skill governance docs，仅同步适用于 spec-first 的规则 |
| `plugins/compound-engineering/README.md` | `README.md`、`README.zh-CN.md`，仅同步已接受的公开 surface 变化 |
| `plugins/compound-engineering/agents/ce-*.agent.md` | `agents/spec-*.agent.md` |
| `plugins/compound-engineering/skills/ce-brainstorm/**` | `skills/spec-brainstorm/**` |
| `plugins/compound-engineering/skills/ce-plan/**` | `skills/spec-plan/**` |
| `plugins/compound-engineering/skills/ce-code-review/**` | `skills/spec-code-review/**` |
| `plugins/compound-engineering/skills/ce-doc-review/**` | `skills/spec-doc-review/**` |
| `plugins/compound-engineering/skills/ce-commit-push-pr/**` | `skills/git-commit-push-pr/**` |
| `plugins/compound-engineering/skills/ce-compound/**` | `skills/spec-compound/**` |
| `plugins/compound-engineering/skills/ce-compound-refresh/**` | `skills/spec-compound-refresh/**` |
| `plugins/compound-engineering/skills/ce-sessions/**` | `skills/spec-sessions/**` |
| `plugins/compound-engineering/skills/ce-setup/**` | `skills/spec-mcp-setup/**` 和相关 config templates；当前仓库没有 `spec-setup` source |
| `plugins/compound-engineering/skills/ce-update/**` | `skills/spec-update/**`，需要适配 Claude/Codex 双宿主 |
| `plugins/compound-engineering/skills/ce-work/**` | `skills/spec-work/**` |
| `plugins/compound-engineering/skills/ce-work-beta/**` | `skills/spec-work-beta/**` |
| `plugins/compound-engineering/skills/ce-polish-beta/**` | `skills/spec-polish-beta/**` |
| `plugins/compound-engineering/skills/ce-product-pulse/**` | 延后调研；只有产品决策后才可能落到 `skills/spec-product-pulse/**` |
| `plugins/compound-engineering/skills/ce-strategy/**` | 延后调研；只有产品决策后才可能落到 `skills/spec-strategy/**` |
| `plugins/compound-engineering/skills/ce-simplify-code/**` | 延后调研；只有 workflow 决策后才可能成为 internal helper |
| CE plugin converter / legacy cleanup source | 仅当 spec-first 有同构 cleanup surface 时同步 |

## 过滤后 CE 文件同步判定

### 根目录、包、发布和插件元数据

| CE 文件 | 状态 | 判定 | 理由 |
|---|---:|---|---|
| `.compound-engineering/config.local.example.yaml` | M | 部分延后 | 新增内容只有 `ce-product-pulse` 的 `pulse_*` config；接受 product-pulse 前不添加 |
| `.github/.release-please-manifest.json` | M | 不同步 | CE 版本元数据 |
| `AGENTS.md` | M | 语义适配 | `docs/solutions/` 描述改良通常适用；CE 专有名称必须改写 |
| `CHANGELOG.md` | M | 不同步 | CE 发布历史 |
| `README.md` | M | 产品决策后语义适配 | Strategy/product-pulse 公开 surface 不自动接受 |
| `bun.lock` | M | 不同步 | CE package manager 元数据 |
| `package.json` | M | 不同步 | CE version bump `3.2.0 -> 3.4.2` |
| `plugins/compound-engineering/.claude-plugin/plugin.json` | M | 不同步 | CE plugin 元数据 |
| `plugins/compound-engineering/.codex-plugin/plugin.json` | M | 不同步 | CE plugin 元数据 |
| `plugins/compound-engineering/.cursor-plugin/plugin.json` | M | 不同步 | CE plugin 元数据；spec-first 不面向 Cursor |
| `plugins/compound-engineering/AGENTS.md` | M | 语义适配 | Skill 设计原则、有界 dispatch、shell 预解析规则有价值；CE 路径和名称示例需要改写 |
| `plugins/compound-engineering/CHANGELOG.md` | M | 不同步 | CE changelog |
| `plugins/compound-engineering/README.md` | M | 产品决策后语义适配 | 只有接受对应决策后，才同步移除 CLI reviewers 与新增 strategy/pulse 的公开说明 |

### Agent 文件

Agent 对比结论：

- **CE 保留的 17 个 code-review reviewer agents**：本次 diff 只改 frontmatter `tools`，从 `Read, Grep, Glob, Bash` 追加 `Write`；没有 agent 正文、模型、颜色或职责变更。当前 spec-first 对应 `spec-*` agent 均存在，frontmatter 仍未授予 `Write`。语义适配结论是：只在 code-review pipeline 需要 leaf reviewer 自写 `/tmp/spec-first/spec-code-review/<run-id>/...json` artifact 且 host 支持该 allowlist 语义时，给对应 spec reviewer 追加 `Write`，不复制 CE 正文。
- **CE 删除的 2 个 CLI readiness agents**：CE 同时删除 agent 文件，并从 CE `persona-catalog.md` 中移除 `cli-readiness` selector。当前 spec-first 仍在 `skills/spec-code-review/SKILL.md` 和 `skills/spec-code-review/references/persona-catalog.md` 引用 `spec-cli-readiness-reviewer`，历史验证文档也将两个 CLI readiness agents 记录为已集成能力。语义适配结论是：不跟随 CE 删除；保留到 U9 做独立引用审计和产品价值判断。
- **spec-first 额外 reviewer agents**：`spec-agent-native-reviewer`、`spec-learnings-researcher`、doc-review lens agents、writer/fixer 类 agents 不在 CE 本次 agent diff 范围内，本轮不因 CE `Write` 变更而扩大权限。

| CE 文件 | 状态 | 判定 | 理由 |
|---|---:|---|---|
| `plugins/compound-engineering/agents/ce-adversarial-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | CE diff 只把 `tools` 从 `Read, Grep, Glob, Bash` 改为追加 `Write`；只有确认 spec-first 该 reviewer 会通过 code-review template 写 `/tmp/spec-first/spec-code-review/<run-id>/` artifact，且 host frontmatter `Write` 不扩大为 repo mutation 权限后才同步 |
| `plugins/compound-engineering/agents/ce-api-contract-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-correctness-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-data-migrations-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-dhh-rails-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-julik-frontend-races-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-kieran-python-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-kieran-rails-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-kieran-typescript-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-maintainability-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-performance-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-previous-comments-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；还需先同步 previous-comments gate，避免无 PR feedback 时启动该 reviewer |
| `plugins/compound-engineering/agents/ce-project-standards-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-reliability-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-security-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-swift-ios-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-testing-reviewer.agent.md` | M | 语义适配：仅同步 `Write` 权限 | 同一项 `Write` 权限适配；不复制 agent 正文 |
| `plugins/compound-engineering/agents/ce-cli-agent-readiness-reviewer.agent.md` | D | 延后 spike，默认保留 | spec-first 当前引用 `spec-cli-agent-readiness-reviewer`；删除前需要仓库特定价值判断和引用审计 |
| `plugins/compound-engineering/agents/ce-cli-readiness-reviewer.agent.md` | D | 延后 spike，默认保留 | spec-first 当前选择 `spec-cli-readiness-reviewer`；删除会改变 review 覆盖面 |

### Skills 与 scripts

| CE 文件 | 状态 | 判定 | 理由 |
|---|---:|---|---|
| `plugins/compound-engineering/skills/ce-brainstorm/SKILL.md` | M | 语义适配 | 新增 synthesis checkpoint、approach 粒度和 `STRATEGY.md` grounding；同步 synthesis，strategy grounding 由 strategy 决策门控 |
| `plugins/compound-engineering/skills/ce-brainstorm/references/handoff.md` | M | 语义适配 | chat 文件路径应使用绝对路径以便点击；plan artifact 路径保持 repo-relative |
| `plugins/compound-engineering/skills/ce-brainstorm/references/requirements-capture.md` | M | 语义适配 | 新增 `Summary`/`Assumptions`，移除流程性的 `Next Steps`；同步时改为 `spec-*` 入口语言 |
| `plugins/compound-engineering/skills/ce-brainstorm/references/synthesis-summary.md` | A | 语义适配 | 新 reference 价值高；创建 `skills/spec-brainstorm/references/synthesis-summary.md` |
| `plugins/compound-engineering/skills/ce-code-review/SKILL.md` | M | 语义适配 | 同步 quick review、有界 dispatch、稳定编号、comment gate、script path 移动和 `Requirements` section 兼容 |
| `plugins/compound-engineering/skills/ce-code-review/references/persona-catalog.md` | M | 部分延后 | 同步 previous-comments gate；CLI-readiness 移除由删除决策门控 |
| `plugins/compound-engineering/skills/ce-code-review/references/review-output-template.md` | M | 语义适配：同步编号规则 | 稳定顺序 finding 编号规则；先对比当前 `review-output-template.md` 的 schema/output 语义，避免覆盖 spec-first 已有字段 |
| `plugins/compound-engineering/skills/ce-code-review/{references => scripts}/resolve-base.sh` | R099 | 语义适配 | 移到 `skills/spec-code-review/scripts/resolve-base.sh`；更新全部引用和测试 |
| `plugins/compound-engineering/skills/ce-commit-push-pr/SKILL.md` | M | 语义适配 | 强制 `--body-file` 和新鲜 base 分支创建；映射到 `git-commit-push-pr` |
| `plugins/compound-engineering/skills/ce-commit-push-pr/references/branch-creation.md` | A | 语义适配 | 新 reference 应加入 `skills/git-commit-push-pr/references/` |
| `plugins/compound-engineering/skills/ce-commit-push-pr/references/pr-description-writing.md` | M | 语义适配：同步 URL encode 规则 | 在 badge model slug 示例中 URL-encode 字面括号；同步时保留 spec-first badge、host matrix 和 PR body 写作边界 |
| `plugins/compound-engineering/skills/ce-compound-refresh/SKILL.md` | M | 语义适配 | 删除前检查 inbound links；同步 |
| `plugins/compound-engineering/skills/ce-compound/SKILL.md` | M | 语义适配：同步 shell safety 切片 | 移除 repo-name 预解析和不安全 parameter expansion；先确认当前 `spec-compound` 的 branch/context 读取路径 |
| `plugins/compound-engineering/skills/ce-doc-review/SKILL.md` | M | 语义适配 | 同步有界 parallel dispatch |
| `plugins/compound-engineering/skills/ce-doc-review/references/synthesis-and-presentation.md` | M | 语义适配：同步 section 分类规则 | 将 `Summary` 视为 framing-level section；保留 spec-doc-review 当前 synthesis pipeline 语义 |
| `plugins/compound-engineering/skills/ce-ideate/SKILL.md` | M | 部分延后 | 读取 `STRATEGY.md`；仅在接受 strategy anchor 后同步 |
| `plugins/compound-engineering/skills/ce-plan/SKILL.md` | M | 语义适配 | 同步 cross-repo bug route、synthesis phases、`Summary` template、`Requirements` section 兼容和 handoff 加载 |
| `plugins/compound-engineering/skills/ce-plan/references/deepening-workflow.md` | M | 语义适配 | 实施时检查 diff；大概率是 naming/template 一致性更新 |
| `plugins/compound-engineering/skills/ce-plan/references/plan-handoff.md` | M | 语义适配 | 同步内联 post-generation routing 和绝对 chat path |
| `plugins/compound-engineering/skills/ce-plan/references/synthesis-summary.md` | A | 语义适配 | 新 reference 价值高；创建到 `skills/spec-plan/references/` |
| `plugins/compound-engineering/skills/ce-plan/references/universal-planning.md` | M | 语义适配：移除过时 wording | 移除 SLFG wording；同步前确认当前 spec-first plan reference 是否仍有同义旧术语 |
| `plugins/compound-engineering/skills/ce-plan/references/visual-communication.md` | M | 语义适配：同步 heading rename | `Summary` 替代 `Overview`；保留 legacy read compatibility |
| `plugins/compound-engineering/skills/ce-polish-beta/scripts/detect-project-type.sh` | M | 语义适配：同步 Bash 3.2 实现 | 用 Bash 3.2 兼容的 newline list 替换 associative array；必须保持当前 spec-polish-beta project type 输出 shape |
| `plugins/compound-engineering/skills/ce-product-pulse/**` | A | 延后 spike | 新 product observability skill；需要 source/runtime/governance 决策 |
| `plugins/compound-engineering/skills/ce-sessions/SKILL.md` | M | 语义适配：同步 shell safety 切片 | 移除 repo-name 预解析和不安全 parameter expansion；先确认当前 `spec-sessions` 的 session inventory 边界 |
| `plugins/compound-engineering/skills/ce-setup/SKILL.md` | M | 语义适配 | Plugin-root 检测和 Codex/global skill roots；映射到当前 setup skill 边界 |
| `plugins/compound-engineering/skills/ce-setup/references/config-template.yaml` | M | 部分延后 | 新 `pulse_*` config 由 product-pulse 决策门控 |
| `plugins/compound-engineering/skills/ce-setup/scripts/check-health` | M | 语义适配 | 增加 `.claude`、`.agents`、`.codex` 全局 skill roots；如果 `spec-mcp-setup` script 有同等职责则映射过去 |
| `plugins/compound-engineering/skills/ce-simplify-code/SKILL.md` | A | 延后 spike | 新执行 helper；接受前不让 shipping 依赖它 |
| `plugins/compound-engineering/skills/ce-strategy/**` | A | 延后 spike | 新 strategy anchor 和 `STRATEGY.md` artifact；需要产品边界决策 |
| `plugins/compound-engineering/skills/ce-update/SKILL.md` | M | 语义适配 | 将 Claude marketplace probes 抽到 scripts；保留 spec-first Codex branch |
| `plugins/compound-engineering/skills/ce-update/scripts/*.sh` | A | 语义适配 | 增加 `skills/spec-update/scripts/*`，并使用 spec-first repo/plugin 名称 |
| `plugins/compound-engineering/skills/ce-work-beta/SKILL.md` | M | 语义适配：同步执行契约切片 | Config 预解析安全、`Requirements` section 兼容、heading rename；保留 spec-work-beta 当前 opt-in/delegation 边界 |
| `plugins/compound-engineering/skills/ce-work-beta/references/codex-delegation-workflow.md` | M | 语义适配：同步路径解析规则 | Codex CLI path 预解析为绝对路径；保留当前 beta delegation consent 和 sandbox 边界 |
| `plugins/compound-engineering/skills/ce-work-beta/references/shipping-workflow.md` | M | 语义适配 | 同步 review-tier policy；simplify-code step 由决策门控 |
| `plugins/compound-engineering/skills/ce-work/SKILL.md` | M | 语义适配 | `Requirements` section 兼容和强制加载 shipping reference |
| `plugins/compound-engineering/skills/ce-work/references/shipping-workflow.md` | M | 语义适配 | 同步 review-tier policy；simplify-code step 由决策门控 |
| `src/data/plugin-legacy-artifacts.ts` | M | 延后，大概率不同步 | 只支持 CE 清理已删除 CLI agents；只有接受删除且 spec-first 有同构 cleanup table 时才同步 |
| `src/utils/legacy-cleanup.ts` | M | 延后，大概率不同步 | 同上 |

## 排除的 docs 与 tests 证据

| CE 文件 | 状态 | 本计划中的用途 |
|---|---:|---|
| `docs/brainstorms/2026-04-24-surface-scope-earlier-requirements.md` | A | 作为 synthesis checkpoint 的功能理由读取 |
| `docs/plans/2026-04-26-feat-surface-scope-earlier-plan.md` | A | 作为 brainstorm/plan synthesis 的实施理由读取 |
| `docs/solutions/workflow/stale-local-base-contamination.md` | A | 作为 branch-creation reference 的理由读取 |
| `docs/solutions/skill-design/post-menu-routing-belongs-inline-2026-04-28.md` | A | 作为 plan handoff 内联 routing 的理由读取 |
| `docs/solutions/skill-design/claude-permissions-optimizer-classification-fix.md` | D | 不机械删除 spec-first docs |
| 其他 CE `docs/**` 变更 | M | 仅作证据；不直接迁移文档 |
| `tests/skill-shell-safety.test.ts` | M | 将相关断言移植到 `tests/unit/skill-shell-safety.test.js` |
| `tests/review-skill-contract.test.ts` | M | 移植到 `tests/unit/spec-code-review-contracts.test.js` |
| `tests/pipeline-review-contract.test.ts` | M | 按适用范围移植到 `tests/unit/spec-work-contracts.test.js` / `spec-work-beta` |
| `tests/resolve-base-script.test.ts` | M | 将 path move 检查移植到当前 unit tests |
| `tests/skill-agent-ce-prefix.test.ts` | A | 只有新增/删除 agents 时，才适配为 spec-first 命名和治理检查 |
| `tests/skills/ce-plan-handoff-routing.test.ts` | A | 移植到 `tests/unit/spec-plan-contracts.test.js` |
| `tests/skills/ce-setup-check-health.test.ts` | A | 移植到 `tests/unit/mcp-setup.sh` 或聚焦 JS contract |
| `tests/skills/ce-update.test.ts` | M | 移植到 `tests/unit/spec-update-contracts.test.js` |
| `tests/fixtures/ce-code-review-stable-numbering.md` | A | 需要时新增 spec fixture |

## 关键技术决策

- **D1: 同步拆分为安全/核心同步与 product-boundary spike。** `ce-strategy`、`ce-product-pulse` 和 `ce-simplify-code` 不是简单的 CE parity 更新；它们新增用户可见 artifact、config keys、skill entries、README counts 和 runtime delivery 决策。它们不能混入机械迁移。
- **D2: 在审计完成前保留 spec-first `spec-cli-*readiness*` reviewers。** CE 删除了两个 CLI readiness reviewers，但 spec-first 本身就是 CLI/workflow harness 且当前仍引用它们。删除是产品和 review 覆盖面决策，不是路径同步决策。
- **D3: 主动同步 shell safety 修复。** 删除被拒绝的 `!` 预解析语法、避免 Bash parameter expansion、把脚本调用移入 runtime scripts，都直接服务当前 host 稳定性。
- **D4: 不复制 CE release metadata。** CE `3.4.2`、plugin manifests、release-please state、lockfile metadata 和 CE changelog 都不是 spec-first 真相源。
- **D5: 使用 spec-first 当前宿主语言。** 任何复制的 CE `/ce-*` 文案必须改为当前宿主表述，Claude 使用 `spec-*`，Codex 使用 `spec-*`；共享 source skill 中可使用中性的“当前宿主入口”表述。
- **D6: 测试遵循 spec-first 布局。** CE 的 Bun/TS tests 是上游断言，不是目标文件。断言应移植到现有 `tests/unit/*.test.js` 或 shell tests。
- **D7: 本计划本身仅是文档变更。** 本计划不实施 patch，不重新生成 runtime，也不运行 CE sync tests。
- **D8: Agent 权限是证据驱动的最小适配，不是整文件同步。** CE agent 正文没有变化，`Write` 只是为了让 JSON-pipeline leaf reviewers 写 run artifact。spec-first 只能在确认当前 code-review template、host frontmatter 语义和 runtime generation 都需要且支持该权限后，追加 `Write`；不得借此复制 CE agent 正文或删除 spec-first 特有 CLI reviewers。

## 实施单元

### U0. 逐文件语义对比 gate

文件：

- `docs/plans/2026-05-04-001-sync-ce-06a7cee0-workflow-updates-plan.md`
- PR body 的 `## CE Sync Ledger` section，或 `docs/validation/<YYYY-MM-DD>-ce-06a7cee0-sync-ledger.md`

动作：

- 对会导致 spec-first patch、删除决策或公开 surface 变化的 CE file entries 建立 implementation-time 对比 ledger。
- ledger 采用上方 `实施对比 Ledger Contract` 的列和完备性要求。
- 如果某个将被修改的目标文件缺少 ledger 覆盖，不进入 patch。
- 如果目标文件已有无关 dirty changes，先记录当前状态并局部合并，不覆盖。
- 对所有 agent/skill frontmatter 或 selector 变更，先证明 source/runtime/consumer 边界，再改 source。

测试场景：

- 旧判定扫描无残留：

  ```bash
  awk -F'|' '/^\| .*plugins\/compound-engineering\// && $4 ~ /(直接同步并改名|Direct sync|Semantic adapt|Do not sync|Defer)/ { print NR ":" $0 }' docs/plans/2026-05-04-001-sync-ce-06a7cee0-workflow-updates-plan.md
  ```
- ledger artifact 存在；如果 ledger 在 PR body 中，先导出为 `$LEDGER_FILE` 供本地检查。
- 每个 changed source target 都能从 ledger 追溯到 CE hunk、spec-first 当前状态和验证断言。最小覆盖检查：

  ```bash
  git diff --name-only --diff-filter=ACMRD -- agents skills templates src README.md README.zh-CN.md AGENTS.md CLAUDE.md docs \
    | while IFS= read -r file; do
        case "$file" in
          CHANGELOG.md|docs/validation/*ce-06a7cee0-sync-ledger.md) continue ;;
        esac
        rg -F "\`$file\`" "$LEDGER_FILE" >/dev/null || printf 'missing ledger: %s\n' "$file"
      done
  ```
- 执行前 `git status --short` 已记录，并且未覆盖无关 dirty files。

### U1. 事实重放与 dirty worktree 保护

文件：

- `docs/plans/2026-05-04-001-sync-ce-06a7cee0-workflow-updates-plan.md`
- `CHANGELOG.md`

动作：

- 实施前重跑 CE fact commands：
  - `git -C <ce-repo> rev-parse HEAD`
  - `git -C <ce-repo> log --oneline 4b5f28da..06a7cee0`
  - `git -C <ce-repo> diff --name-status 4b5f28da..06a7cee0`
  - `git -C <ce-repo> diff --name-status 4b5f28da..06a7cee0 -- . ':(exclude)docs/**' ':(exclude)tests/**'`
- 在 spec-first 中重新检查 `git status --short`，并保留用户改动。

测试场景：

- 当前 CE head 等于或包含 `06a7cee0ad68cb50cebdb8a2a864ec4148ffba78`。
- 过滤后的文件数量仍可解释；如有 drift，先更新计划再实施。

### U2. Shell safety、setup 与 update

文件：

- `skills/spec-update/SKILL.md`
- `skills/spec-update/scripts/currently-loaded-version.sh`
- `skills/spec-update/scripts/marketplace-name.sh`
- `skills/spec-update/scripts/upstream-version.sh`
- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/references/config-template.yaml`
- `skills/spec-mcp-setup/scripts/check-health`
- `.spec-first/config.local.example.yaml`
- `tests/unit/spec-update-contracts.test.js`
- `tests/unit/mcp-setup.sh`
- `tests/unit/skill-shell-safety.test.js`

动作：

- 将 `spec-update` 中 Claude plugin version probes 从 `!` backticks 移到 runtime scripts，并使用窄 `allowed-tools`。
- 保留现有 Codex npm/runtime branch，不回退双宿主行为。
- 在存在同等职责的位置，将 setup health checks 适配为识别 `.claude`、`.agents`、`.codex` 下的全局 skill roots。
- 除非 U8 接受 product-pulse，否则不添加 `pulse_*` config keys。
- 从 `spec-compound`、`spec-sessions` 和 work-beta config 读取中移除不安全的 repo-name 预解析模式。

测试场景：

- `spec-update` 不再包含调用 `bash <script>` 的 `!` 预解析命令。
- `spec-update` scripts 使用 spec-first repository 和 sentinel 名称，不使用 CE 名称。
- Shell safety tests 拒绝 `case`、top-level `[A] && B || C`、quoted command substitution 和 `!` backticks 中的 parameter expansion operators。
- setup script 拥有该检查职责时，setup health detection 将 `~/.agents/skills/<name>` 和 `~/.codex/skills/<name>` 视为有效 skill roots。

### U3. Brainstorm 与 plan synthesis checkpoints

文件：

- `skills/spec-brainstorm/SKILL.md`
- `skills/spec-brainstorm/references/handoff.md`
- `skills/spec-brainstorm/references/requirements-capture.md`
- `skills/spec-brainstorm/references/synthesis-summary.md`
- `skills/spec-plan/SKILL.md`
- `skills/spec-plan/references/deepening-workflow.md`
- `skills/spec-plan/references/plan-handoff.md`
- `skills/spec-plan/references/synthesis-summary.md`
- `skills/spec-plan/references/universal-planning.md`
- `skills/spec-plan/references/visual-communication.md`
- `tests/unit/spec-brainstorm-contracts.test.js`
- `tests/unit/spec-plan-contracts.test.js`

动作：

- 给 brainstorm 增加类似 Phase 2.5 的 synthesis checkpoint。
- 给 plan 增加 solo-mode 和来自 brainstorm 的 synthesis checkpoint 规则。
- 如果当前 source 仍使用 legacy heading，将 plan template 的 `Overview` 改为 `Summary`，同时保留 legacy 读取兼容。
- 增加 headless `## Assumptions` routing，用于承载未经确认的推断假设。
- 从 durable requirements artifacts 中移除流程性的 `Next Steps`。
- chat handoff 行使用绝对路径，但 plan document file references 保持 repo-relative。
- 在 U8 接受 strategy 作为 spec-first artifact 前，延后 `STRATEGY.md` 读取和 `spec-strategy` 引用。

测试场景：

- `spec-brainstorm` 要求写文档前加载 `references/synthesis-summary.md`。
- `spec-plan` template 包含 `## Summary`，并仍可读取 legacy `Requirements Trace`。
- Plan handoff tests 断言 post-generation menu routing 不会在选择后停止。
- 生成的 requirements 或 plan template 不把流程结束用的 `Next Steps` 作为必需 durable section。

### U4. Code review 流水线

文件：

- `skills/spec-code-review/SKILL.md`
- `skills/spec-code-review/references/persona-catalog.md`
- `skills/spec-code-review/references/review-output-template.md`
- `skills/spec-code-review/references/resolve-base.sh`
- `skills/spec-code-review/scripts/resolve-base.sh`
- `agents/spec-adversarial-reviewer.agent.md`
- `agents/spec-api-contract-reviewer.agent.md`
- `agents/spec-correctness-reviewer.agent.md`
- `agents/spec-data-migrations-reviewer.agent.md`
- `agents/spec-dhh-rails-reviewer.agent.md`
- `agents/spec-julik-frontend-races-reviewer.agent.md`
- `agents/spec-kieran-python-reviewer.agent.md`
- `agents/spec-kieran-rails-reviewer.agent.md`
- `agents/spec-kieran-typescript-reviewer.agent.md`
- `agents/spec-maintainability-reviewer.agent.md`
- `agents/spec-performance-reviewer.agent.md`
- `agents/spec-previous-comments-reviewer.agent.md`
- `agents/spec-project-standards-reviewer.agent.md`
- `agents/spec-reliability-reviewer.agent.md`
- `agents/spec-security-reviewer.agent.md`
- `agents/spec-swift-ios-reviewer.agent.md`
- `agents/spec-testing-reviewer.agent.md`
- `tests/unit/spec-code-review-contracts.test.js`
- `tests/unit/skill-shell-safety.test.js`

动作：

- 仅当当前 host 具备真实 built-in review command 时，才增加 quick-review short-circuit；Codex 没有该 command 时，继续走现有 spec review 行为。
- 增加稳定 finding 编号：排序后一次分配，并在 residual summaries 中复用。
- 将 `resolve-base.sh` 从 `references/` 移到 `scripts/`，并更新所有路径。
- 给 reviewer 和 validator subagents 增加 bounded parallel dispatch。
- 增加 previous-comments `hasPriorComments` gate 和 approval-only skip。
- 对 agent 权限做最小适配：先确认 CE diff 只追加 `Write`、当前 `subagent-template.md` 确实要求 leaf reviewer 写 `/tmp/spec-first/spec-code-review/<run-id>/...json`、host delivery 支持 `tools: ..., Write`，再只给实际通过 code-review template 写 artifact 的 reviewer agents 追加 `Write`。
- 如果当前 host 不依赖 agent frontmatter allowlist，或 artifact 写入改为 orchestrator 代写，则不追加 `Write`，改为记录保持分叉的原因。
- 本单元不删除 CLI readiness reviewers，除非 U9 删除审计接受。

测试场景：

- 稳定编号跨 severity sections 延续，不在 residual work 中重新从头编号。
- `resolve-base.sh` 的路径引用指向 `scripts/resolve-base.sh`。
- 只有存在 PR metadata 和真实 prior feedback 时，才选择 previous-comments reviewer。
- bounded-dispatch 文案将 concurrency-limit errors 视为 backpressure，而不是 reviewer failure。
- 若追加 `Write`，contract test 或 source scan 证明变更只覆盖 code-review leaf reviewers，不覆盖 doc-review reviewers、writer/fixer agents 或 CLI readiness 删除。
- agent 权限变更不得使用 `agents/spec-*-reviewer.agent.md` 这类宽 glob；只能覆盖本单元文件列表中的 17 个 CE-mapped code-review JSON leaf reviewers。
- Fresh-source eval 验证 leaf reviewer 仍只允许写 `/tmp/spec-first/spec-code-review/<run-id>/` run artifact，不允许编辑 repo 文件。

### U5. Work、work-beta 与 shipping

文件：

- `skills/spec-work/SKILL.md`
- `skills/spec-work/references/shipping-workflow.md`
- `skills/spec-work-beta/SKILL.md`
- `skills/spec-work-beta/references/codex-delegation-workflow.md`
- `skills/spec-work-beta/references/shipping-workflow.md`
- `tests/unit/spec-work-contracts.test.js`
- `tests/unit/spec-work-beta-contracts.test.js`

动作：

- 更新 plan-reading 文案：优先读取 `## Requirements`，并兼容 legacy `Requirements Trace`。
- 强制加载 shipping workflow reference。
- 适配 review-tier policy：
  - Tier 1 只有在 host 具备真实 command/tool 时才能使用 host-native review。
  - 如果 host 缺少 built-in review，使用 `spec-code-review` fallback，不假装 Tier 1 已执行。
  - 遇到 sensitive surfaces、大范围分散改动、超大变更或 plan/task 明确要求时，升级到 Tier 2。
- 除非 U8 接受 `spec-simplify-code`，否则不增加必需 simplify step。
- 保持 operational validation 和 residual work sinks 与现有 spec-first 路径一致。

测试场景：

- Work 和 work-beta 同时消费 `Requirements` 和 legacy `Requirements Trace`。
- 接受新 helper 前，shipping workflow 不提 `/simplify` 或 `ce-simplify-code`。
- Tier 1/Tier 2 文案不暗示 Codex 上存在缺失的 host-native review。

### U6. Git commit / PR 安全

文件：

- `skills/git-commit-push-pr/SKILL.md`
- `skills/git-commit-push-pr/references/branch-creation.md`
- `skills/git-commit-push-pr/references/pr-description-writing.md`
- `tests/unit/git-commit-push-pr-contracts.test.js`

动作：

- 增加从新鲜 remote-base 创建分支的 reference。
- 当本地 default branch 有 unpushed commits 时，要求用户明确决策。
- 仅对 checkout collisions 使用 stash/retry/pop；不自动解决 conflicts。
- 要求使用临时文件和 `gh pr create/edit --body-file "$BODY_FILE"` 写 PR body。
- 在 model badge slug 示例中 URL-encode 字面括号。

测试场景：

- `git-commit-push-pr` 拒绝 `--body "$(cat "$BODY_FILE")` 和 stdin body patterns。
- `branch-creation.md` 记录 stale-base 和 forgot-to-branch 场景。
- Badge model slug 示例 encode `(` 和 `)`。

### U7. Compound、sessions、doc review 与 polish

文件：

- `skills/spec-compound/SKILL.md`
- `skills/spec-compound-refresh/SKILL.md`
- `skills/spec-sessions/SKILL.md`
- `skills/spec-doc-review/SKILL.md`
- `skills/spec-doc-review/references/synthesis-and-presentation.md`
- `skills/spec-polish-beta/scripts/detect-project-type.sh`
- `tests/unit/spec-compound-contracts.test.js`
- `tests/unit/spec-sessions-contracts.test.js`
- `tests/unit/spec-doc-review-contracts.test.js`

动作：

- 从 compound/sessions 移除 repo-name `git-common-dir` 预解析；保留带 safe fallback 的 branch-only 预解析。
- compound-refresh 删除前增加 inbound-link check，并区分 decorative citations 与 substantive citations。
- 给 doc-review 增加 bounded parallel dispatch 文案。
- doc-review chain-root detection 将 `Summary` 视为 framing-level section。
- 用 Bash 3.2 兼容的 newline list 替换 polish project detection 中的 Bash associative array。

测试场景：

- Compound/sessions 不在 `!` backticks 中使用 `${common%...}` 或 `basename "$(dirname "$common")"`。
- Compound-refresh 不能删除存在 substantive inbound links 的 learning。
- Polish project detection script 在 macOS Bash 3.2 约束下通过 `bash -n`，并保留 multi-hit output shape。

### U8. 新 skills 的产品边界 spike

文件：

- `docs/plans/<future>-product-context-loop-plan.md` 或专门的 brainstorm/plan
- `skills/spec-ideate/SKILL.md`
- `skills/spec-brainstorm/SKILL.md`
- `skills/spec-plan/SKILL.md`
- `skills/spec-work/references/shipping-workflow.md`
- `src/cli/contracts/dual-host-governance/skills-governance.json`
- `README.md`
- `README.zh-CN.md`

动作：

- 决定 spec-first 是否应增加：
  - 产出根目录 `STRATEGY.md` 的 `spec-strategy`
  - 产出 `docs/pulse-reports/` 的 `spec-product-pulse`
  - 作为 internal pre-review helper 的 `spec-simplify-code`
- 对每个接受的 skill 定义：
  - entry surface：public workflow、standalone 或 internal helper
  - Claude 与 Codex 的 source/runtime delivery
  - artifact contract 与 gitignore 行为
  - README/manual 影响与 runtime asset count
  - tests 和 fresh-source eval
- 在接受前，不复制 CE README public-surface 变化，也不添加 `pulse_*` config keys。

测试场景：

- Governance contract 拒绝未注册的 public skill entries。
- 只有 governance 改变时，README counts 才改变。
- 接受前，core workflows 中不出现 `STRATEGY.md`、`docs/pulse-reports/` 或 `spec-simplify-code` 引用。

### U9. CLI readiness reviewer 删除审计

文件：

- `agents/spec-cli-agent-readiness-reviewer.agent.md`
- `agents/spec-cli-readiness-reviewer.agent.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-code-review/references/persona-catalog.md`
- `src/cli/contracts/dual-host-governance/agents-governance.json`，如存在
- `README.md`
- `README.zh-CN.md`
- `tests/unit/spec-code-review-contracts.test.js`
- `docs/validation/` 和 `docs/业界分析/` 下的相关文档

动作：

- 运行 inbound-reference audit：
  - `rg -n "spec-cli-agent-readiness|spec-cli-readiness|cli-readiness|cli-agent-readiness" agents skills src templates README.md README.zh-CN.md docs AGENTS.md tests`
- 在以下选项中决策：
  - 保留分叉并保留 CLI readiness reviewers
  - 从默认 selector 中移除，但保留 agent files 作为 internal/manual review assets
  - 删除 agent files，并清理 governance/docs/tests
- 首次实施默认保留分叉，除非审计产出明确替代方案。

测试场景：

- 如果选择保留，不移植 CE legacy cleanup changes。
- 如果选择删除，所有引用和 runtime governance 都被更新，并用 fresh-source eval 覆盖 reviewer-team 行为。

### U10. Runtime governance、docs、changelog 与验证

文件：

- `CHANGELOG.md`
- `README.md`
- `README.zh-CN.md`
- `src/cli/plugin.js`
- `src/cli/contracts/dual-host-governance/skills-governance.json`
- `src/cli/contracts/dual-host-governance/agents-governance.json`，如存在
- `templates/claude/commands/spec/**`
- 相关 tests

动作：

- 只为已接受的 source 变更更新 README/manual/runtime counts。
- 当前仓库没有 checked-in `.claude-plugin/plugin.json` 真相源；runtime manifest 由 `src/cli/plugin.js` 基于 governance JSON、templates、`skills/` 和 `agents/` 动态生成。实施不得重新引入退休 manifest。
- 使用当前 host developer profile author 更新 `CHANGELOG.md`。
- 运行 source/runtime drift checks；只有 implementation 修改了会投递到 host runtime 的 source assets 时，才通过 `spec-first init --claude|--codex` regenerate runtime。
- 对 skill/agent prose 行为变更，运行 fresh-source eval；无法执行时记录原因。

测试场景：

- `npm run lint:skill-entrypoints`
- `npm run typecheck`
- U2-U9 的聚焦 unit tests
- 如 runtime delivery 或 public entry surface 变化，运行 `npm run test:smoke`
- 只有 package contents 或 runtime delivery 有实质变化时，才运行 `npm run build`

## 验证矩阵

| 单元 | 最小验证 |
|---|---|
| U0 | ledger artifact 存在；changed target 精确路径覆盖检查通过；旧判定扫描无残留 |
| U1 | `git diff --check -- docs/plans/2026-05-04-001-sync-ce-06a7cee0-workflow-updates-plan.md CHANGELOG.md` |
| U2 | `npm run typecheck`；如可直接运行则执行 `node tests/unit/spec-update-contracts.test.js`；如 Jest 支持 path filter 则执行 `npm run test:unit -- --runTestsByPath ...`；否则 fallback 到 `npm run test:unit` |
| U3 | `tests/unit/spec-brainstorm-contracts.test.js`、`tests/unit/spec-plan-contracts.test.js`、`npm run lint:skill-entrypoints` |
| U4 | `tests/unit/spec-code-review-contracts.test.js`、`tests/unit/skill-shell-safety.test.js` |
| U5 | `tests/unit/spec-work-contracts.test.js`、`tests/unit/spec-work-beta-contracts.test.js` |
| U6 | `tests/unit/git-commit-push-pr-contracts.test.js` |
| U7 | compound/sessions/doc-review/polish 聚焦 tests，加上 `bash -n skills/spec-polish-beta/scripts/detect-project-type.sh` |
| U8 | 没有独立 plan 不实施；若接受，则先补 governance 和 runtime tests，再交付 source |
| U9 | inbound-reference audit 输出，加上聚焦 review contract tests |
| U10 | `npm run lint:skill-entrypoints`、`npm run test:smoke`、changed skill/agent prose 的 fresh-source eval；source scan 确认未把 `.claude-plugin/plugin.json` 重新写成当前真相源 |

## 剩余风险

- CE strategy/pulse/simplify-code 可能有价值，但接受它们会扩展 spec-first 当前 core workflow 之外的产品身份。应作为单独决策处理。
- Review-tier 变更可以降低成本，但如果 host-native review 不存在或能力弱，也可能降低 review 深度。spec-first 适配必须明确 fallback 行为。
- 删除 CLI readiness reviewers 可能移除对 spec-first 比对 CE 更重要的覆盖面。
- 将 `resolve-base.sh` 从 `references/` 移到 `scripts/` 会影响 runtime package contents 和 tests；陈旧引用会破坏 review scope detection。
- 给 reviewer agents 增加 `Write` 可能有 host-specific 影响；需要验证 Claude 和 Codex runtime generation。

## 实施顺序

1. U0 逐文件语义对比 gate。
2. U1 事实重放与 dirty worktree guard。
3. U2 shell safety/setup/update 变更。
4. U3 brainstorm/plan synthesis references。
5. U4 code-review pipeline 变更，不包含 CLI reviewer 删除。
6. U6 PR branch/body safety。
7. U7 compound/sessions/doc-review/polish 修复。
8. U5 code-review 行为稳定后，再处理 work/work-beta shipping policy。
9. U9 CLI readiness 删除审计决策。
10. U8 新 skills 的产品边界 spike。
11. U10 README/governance/changelog/runtime/test 收口。

该顺序优先处理确定性安全修复，并把产品 surface 扩展留到核心同步稳定之后。
