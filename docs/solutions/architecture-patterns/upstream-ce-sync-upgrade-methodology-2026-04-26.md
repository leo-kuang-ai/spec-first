---
title: 上游 CE 更新同步到 spec-first 的常态化升级方法
date: 2026-04-26
last_updated: 2026-09-11
category: docs/solutions/architecture-patterns
module: workflow-asset-sync
problem_type: architecture_pattern
component: development_workflow
severity: medium
applies_when:
  - spec-first 需要持续吸收 compound-engineering-plugin 的上游更新
  - 上游更新同时涉及 skills、agents、scripts、README、runtime governance 或 workflow contract
  - 需要避免机械复制 CE 命名、路径、host 假设和运行时资产
tags: [ce-sync, workflow-assets, migration, governance, spec-first]
---

# 上游 CE 更新同步到 spec-first 的常态化升级方法

## Context

`spec-first` 来源于 `compound-engineering-plugin`，但两边已经分叉。CE 更新不能按“复制文件”处理，因为 spec-first 有自己的产品边界、公共 workflow 入口、动态 command manifest 投影、双宿主 runtime governance、README 计数、CHANGELOG 治理和本地独有能力。

本方法沉淀自 CE `1284290a..e8c118e2` 同步过程。该轮同步暴露出几个高风险点：

- CE 删除 `ce-pr-description` 后，spec-first 一开始误判为保留独立 `spec-pr-description`，后来通过引用审计确认应同步删除，并把写作能力收回 `git-commit-push-pr`。
- CE 新增 `pr-description-writing.md` 不是直接可复制资产，必须做 Spec-First badge、host 矩阵、`feature-video`、temp file sentinel 等适配。
- README runtime 计数容易在局部改动后漂移。
- CE 的 `src/data/plugin-legacy-artifacts.ts` / `src/utils/legacy-cleanup.ts` 在 spec-first 没有同路径，必须按 spec-first 当前 runtime cleanup 面判断，不能按路径机械迁移。
- 一次同步若混入其他文档或功能变更，必须在审查和 PR 叙事里明确边界。

后续 CE `4b5f28da..06a7cee0` 计划过程又补充了一个关键教训：**路径映射和文件状态不足以决定同步方式**。例如 17 个 CE reviewer agent 的真实 diff 只是 frontmatter `tools` 追加 `Write`，而不是 agent 正文变化；2 个 CLI readiness agents 在 CE 中被删除，但 spec-first 当前仍有 selector 和历史验证依据。正确处理不是“直接同步并改名”，而是先对比 CE diff、spec-first 当前 agent、review artifact 写入契约和 host allowlist 语义，再做语义适配。

因此，CE 同步应成为固定协议：脚本负责事实层，LLM 负责语义判断；先逐文件取证，再做路径映射和局部 patch；最后用审查报告和验证矩阵收口。

## Guidance

后续用户只需提供 CE 起始节点，例如：

```text
从 CE 节点 <base-sha> 开始，同步到当前最新，按常态化 CE 同步协议执行。
```

默认解释为：

```bash
CE_REPO=/Users/kuang/xiaobu/compound-engineering-plugin
SPEC_REPO=/Users/kuang/xiaobu/spec-first
CE_RANGE=<base-sha>..HEAD
```

如果用户提供结束节点，则使用 `<base-sha>..<head-sha>`。如果用户贴的是 `git pull` 输出，则从 `Updating <base>..<head>` 反向提取 range。

### 0. 角色边界

同步时必须先按 `docs/10-prompt/结构化项目角色契约.md` 校准：

- **脚本做确定性流程**：列文件、取 diff、查引用、跑测试、验证格式、重建 runtime。
- **LLM 做语义判断**：是否同步、如何适配、是否删除、是否保留分叉、是否延后 spike。
- **保持 light contract**：不要为同步引入强状态机、中心 gate 或复杂规则引擎。
- **保持单一真相源**：不要因为 CE 新增 reference 或删除 workflow，就在 spec-first 制造两套同职能能力。

### 1. 固定输入范围

先获取 CE 最新节点和变更面：

```bash
git -C "$CE_REPO" rev-parse HEAD
git -C "$CE_REPO" diff --name-status "$CE_RANGE"
git -C "$CE_REPO" diff --stat "$CE_RANGE"
```

默认过滤 `docs/` 和 `tests/` 的实施目标：

```bash
git -C "$CE_REPO" diff --name-status "$CE_RANGE" -- . ':(exclude)docs/**' ':(exclude)tests/**'
```

注意：

- 过滤后的 CE 文件必须全部进入判定，不允许抽样。
- CE 的 tests 可以作为上游意图证据读取，但默认不直接迁移到 spec-first。
- 如果用户明确要求同步 docs 或 tests，则以用户规则覆盖默认过滤。

### 2. 逐文件取 diff 证据

每个 CE 修改文件都必须读取具体 diff：

```bash
git -C "$CE_REPO" diff --unified=3 "$CE_RANGE" -- <ce-file>
```

对修改文件记录：

```text
CE 文件：
状态：M
修改前关键文案：
修改后关键文案：
spec-first 目标文件：
局部 patch 点：
验证断言：
```

对新增文件记录：

```text
CE 文件：
状态：A
新增文件职责：
spec-first 目标路径：
新建 / 合并进现有文件 / 不落盘：
命名和 host 适配：
验证断言：
```

对删除文件记录：

```text
CE 文件：
状态：D
原职责：
CE 删除后的新归宿：
spec-first 当前引用面：
同步删除 / 保留 / 合并后删除：
验证断言：
```

### 2.1. 先做 CE diff 与当前项目语义对比

路径映射之后、同步判定之前，必须把 CE 的具体 diff 和 spec-first 当前目标文件并排比较。不能因为两边文件名可映射、状态是 `M`，就给出“直接同步并改名”。

每个映射目标至少记录四类事实：

```text
CE 实际变化类型：正文 / frontmatter / 权限 allowlist / selector / runtime metadata / 删除
CE diff 证据：关键 hunk 或 unified=0 摘要
spec-first 当前状态：目标文件是否存在、当前职责、frontmatter、调用方、selector、artifact contract
语义适配结论：同步哪一部分、不同步哪一部分、保持分叉的原因、验证断言
```

Agent 和 skill frontmatter 变更必须更严格：

- **权限变更不是正文同步。** 如果 CE 只追加 `Write`、`Bash`、`Edit` 等 tool allowlist，先确认 spec-first 当前 workflow 是否真的需要 leaf agent 使用该工具。
- **确认写入边界。** 例如当前 code-review 的 reviewer JSON 是 orchestrator-owned run artifact，路径由 `<review-artifact-dir>/<reviewer_name>.json` 表示并解析到当前 OS temp root，不等于允许 reviewer agent 编辑 repo 文件。计划必须写明允许的唯一写入主体、位置和禁止的 mutation。
- **确认 host/runtime 语义。** 只有 Claude/Codex runtime generation 和 agent frontmatter 都支持该字段时，才同步权限；否则记录保持分叉或改为 orchestrator 代写 artifact。
- **不扩大到相邻 agents。** 只更新 CE diff 覆盖且 spec-first 同构的 agents；doc-review lens、writer/fixer、project-specific extra agents 不因相似名称自动获得新权限。
- **删除与 selector 分开判断。** CE 删除 agent 文件并移除 persona catalog selector，只说明 CE 不再使用；spec-first 是否删除必须看当前 selector、引用审计、产品价值和历史验证记录。

如果对比后发现 CE 变化只是当前项目已有契约的权限缺口，判定应写成“语义适配：仅同步 `<permission>` 权限”，而不是“直接同步”。如果 CE 删除的是 spec-first 仍有明确价值的分叉，默认进入删除审计或保留分叉，不跟随删除。

### 3. CE 到 spec-first 的路径映射

同步前先读 spec-first 当前文件。目标路径不能只由 CE 路径推断。

| CE 路径 | spec-first 目标 |
|---|---|
| `plugins/compound-engineering/agents/ce-*.agent.md` | `agents/spec-*.agent.md` |
| `plugins/compound-engineering/skills/ce-code-review/**` | `skills/spec-code-review/**` |
| `plugins/compound-engineering/skills/ce-doc-review/**` | `skills/spec-doc-review/**` |
| `plugins/compound-engineering/skills/ce-compound/**` | `skills/spec-compound/**` |
| `plugins/compound-engineering/skills/ce-compound-refresh/**` | `skills/spec-compound-refresh/**` |
| `plugins/compound-engineering/skills/ce-debug/**` | `skills/spec-debug/**` |
| `plugins/compound-engineering/skills/ce-session-*` | `skills/spec-session-*`，正文调用名以 frontmatter `name` 为准 |
| `plugins/compound-engineering/skills/ce-sessions/**` | `skills/spec-sessions/**` |
| `plugins/compound-engineering/skills/ce-work/**` | `skills/spec-work/**` |
| `plugins/compound-engineering/skills/ce-work-beta/**` | 历史映射；当前 `spec-work-beta` 已退役，遇到上游 beta work 变更时先做删除/保留审计，默认不复活同名 skill |
| `plugins/compound-engineering/skills/ce-commit-push-pr/**` | `skills/git-commit-push-pr/**`，不是 `spec-commit-push-pr` |
| `plugins/compound-engineering/skills/ce-demo-reel/**` | `skills/feature-video/**` |
| `plugins/compound-engineering/skills/ce-resolve-pr-feedback/**` | `skills/resolve-pr-feedback/**` |
| `plugins/compound-engineering/skills/lfg/**` | `skills/lfg/**` |
| CE `.claude-plugin/plugin.json` / host plugin manifests | 不直接迁移；按 `src/cli/plugin.js`、`skills-governance.json` 和 `templates/claude/commands/spec/*.md` 的当前动态 manifest 投影语义判断 |
| CE plugin converter / legacy cleanup source | 只有 spec-first 存在同构治理面时才迁移 |

命名规则：

- `spec-*` 用于公开 spec-first workflow，例如 `spec-work`、`spec-code-review`。
- `git-*` 用于 internal Git 工具，例如 `git-commit`、`git-commit-push-pr`。
- `feature-video` 是 `ce-demo-reel` 的 spec-first 落点。
- 不把 internal-only Git 工具改成 `$spec-*` 入口。

### 4. 四类同步决策

每个 CE diff 只能归入一类：

1. **直接同步**
   CE 变更与 spec-first 目标一致，只需命名、路径、badge、仓库 URL 或 host 矩阵替换。

2. **语义适配后同步**
   CE 方向正确，但必须适配 spec-first 的 workflow 入口、host 能力、artifact 路径、frontmatter name、README 计数或 governance contract。

   适用于 CE diff 只提供方向、而 spec-first 需要按当前契约重写的情况，例如：

   - agent frontmatter 只追加 `Write`，spec-first 只同步能支撑 run artifact 写入的最小权限。
   - CE 删除 selector，但 spec-first 当前还有 selector、调用方和产品价值，需要延后审计。
   - CE reference 名称、host entrypoint 或 artifact 路径与 spec-first 当前 source/runtime 边界不同。

3. **不同步**
   CE 变更只服务 CE 自身 converter、legacy cleanup，或 spec-first 没有同构治理面，或迁移会制造多真相源。

4. **延后 spike**
   需要产品判断、host 能力验证、外部工具接入或新 runtime contract。当前只记录风险和 follow-up，不在本轮实现。

### 5. 计划文档

大范围同步先写计划：

```text
docs/plans/YYYY-MM-DD-NNN-sync-ce-<head-sha>-workflow-updates-plan.md
```

计划必须包含：

- 输入 range、CE repo、spec-first repo。
- 过滤规则。
- CE 文件清单。
- CE 到 spec-first 路径映射。
- 逐文件同步判定表。
- 按主题整理的明确改动点。
- 每个修改文件的 before/after diff 文案依据。
- 每个映射目标的 spec-first 当前状态和语义对比结论。
- 每个新增文件的 CE 路径索引和 spec-first 落点。
- 每个删除文件的引用审计和删除/保留决策。
- 实施单元和顺序。
- 验证矩阵。
- CHANGELOG 和 runtime 重建步骤。

计划不是可选说明，而是交接给执行 agent 的 contract。

### 6. 计划质量审查

当用户要求审查，或同步范围超过单一 skill，必须审查计划。审查重点：

- 过滤后的 CE 文件是否 100% 有判定。
- 每个 M 文件是否有 diff 文案级依据。
- 每个 M 文件是否对比了 spec-first 当前目标文件，而不是只照抄 CE hunk。
- 每个 D 文件是否有引用审计。
- agent / skill frontmatter 权限变更是否证明了当前 workflow 需要、host 支持和写入边界。
- 是否误套 CE host 假设。
- 是否有 CE 命名、CE badge、CE repo URL 残留。
- 是否会制造第二真相源。
- 验证是否覆盖每个实施单元。
- 是否有“建议 / 必要时 / 可以”这类不可执行措辞。

审查意见要回写计划文档，不只在聊天里说明。

### 7. 实施顺序

用户明确要求直接同步时，按风险从低到高实施：

1. 新增 reference、scripts、schema。
2. 单一 skill / agent 的小枚举或文案变更。
3. review、debug、PR workflow 行为变更。
4. work、历史 work-beta 删除审计、delegation、host capability 变更。
5. README、AGENTS、CLAUDE、governance 文案。
6. tests。
7. `CHANGELOG.md`。
8. runtime asset 重建。

执行约束：

- 先查 `git status --short`。
- 不覆盖用户已有改动。
- 目标文件有未提交改动时，先读当前内容再合并。
- 用局部 patch，不用整文件覆盖修改文件。
- 不手改 `.claude/`、`.codex/`、`.agents/skills/` 生成资产。

### 8. 删除文件审计

CE 删除文件时，按以下顺序审计：

```bash
rg -n '<old-skill-name>|<mapped-skill-name>|<command-name>' \
  skills agents templates src README.md README.zh-CN.md AGENTS.md CLAUDE.md tests
```

必须检查：

- `skills/using-spec-first/SKILL.md`
- `src/cli/plugin.js` 的动态 command manifest 构建逻辑（当前仓库不再维护 checked-in `.claude-plugin/plugin.json`）
- `src/cli/contracts/dual-host-governance/skills-governance.json`
- `templates/claude/commands/spec/**`
- README / README.zh-CN runtime 计数
- 调用方 skill，例如 `spec-work`、`spec-debug`、`lfg`
- contract tests 和 smoke tests

删除结论只能在引用审计后确定。

Agent 删除还必须额外检查：

- persona catalog 或 orchestrator selector 是否仍引用该 agent。
- 当前项目是否存在 CE 没有的产品定位，例如 spec-first 对 CLI/workflow harness 的特殊审查需求。
- 历史验证文档是否把该 agent 记录为已集成能力或有意分叉。
- 删除是否会影响 README/runtime 计数、fresh-source eval、review coverage 或 downstream workflow fallback。

当 CE 删除和 spec-first 当前价值冲突时，默认写成“延后 spike / 默认保留”，直到引用审计和产品价值判断完成。

### 9. PR description 特殊协议

遇到 `ce-pr-description`、`ce-commit-push-pr`、`pr-description-writing.md` 时，必须做 gap audit。

固定检查项：

- description-only intent 是否跳过 commit/push gate。
- PR ref parsing / current-branch mode / PR mode。
- base detection、non-default base、fork PR、API-only fallback。
- current PR body preservation。
- Demo / Screenshots preservation。
- evidence capture handoff。
- commit classification。
- narrative frame。
- sizing table。
- writing voice。
- visual communication。
- GitHub issue numbering。
- focus hint。
- title/body assembly。
- badge。
- compression pass。
- `gh pr create/edit` apply contract。

标记：

| 标记 | 含义 | 处理 |
|---|---|---|
| `already covered` | spec-first 已有等价能力 | 不重复迁入 |
| `missing` | spec-first 缺失且适用 | 合并到唯一真相源 |
| `conflicting` | spec-first 语义和 CE 冲突 | 先判断边界，再局部修正 |

本轮 `e8c118e2` 的最终裁决：

- CE 删除 `ce-pr-description/SKILL.md`。
- spec-first 同步删除独立 `spec-pr-description` workflow。
- PR title/body 写作能力收回 `skills/git-commit-push-pr/references/pr-description-writing.md`。
- `using-spec-first` 中 PR description 请求路由到 `git-commit-push-pr` description-only mode。
- `git-commit-push-pr` 仍是 internal-only Git 工具，不改名为 `spec-commit-push-pr`。

如果未来 spec-first 重新引入公开 PR description workflow，必须重新做单一真相源判断，不能沿用本轮删除结论。

### 10. 残留扫描

每轮同步至少执行这些扫描：

```bash
rg -n 'ce-pr-description|spec-pr-description|ce-demo-reel|ce-pr-body|__CE_PR_BODY|Compound Engineering badge|ask_user` in Gemini|ask_user` in Pi' \
  skills agents templates src tests README.md README.zh-CN.md CHANGELOG.md
```

按变更面追加关键词：

- `ce-<skill>`
- `Compound Engineering`
- CE repo URL
- `Gemini CLI`
- `Pi`
- 删除的 command 文件名
- 旧 runtime 计数，例如 `20 command`、`42 skills`

允许命中：

- 历史 changelog。
- 负向 contract test。
- 明确标注为历史背景的 docs。

不允许命中：

- source skill 正文的旧调用名。
- runtime governance 的旧 command。
- README 当前说明的旧计数。
- badge、repo URL、host 矩阵的 CE 残留。

### 11. Runtime 重建

涉及 public workflow、internal skill、agent、templates、runtime governance、README 计数时，重建 runtime：

```bash
node bin/spec-first.js init --codex
node bin/spec-first.js init --claude -u leokuang --lang zh
```

删除 skill 后检查 runtime 未复活：

```bash
find .agents/skills .claude/commands/spec .claude/skills -maxdepth 3 \
  \( -name '*<deleted-skill>*' -o -path '*/<deleted-skill>/*' \) -print
```

如果 runtime 目录不是本次提交范围，只把重建作为验证动作说明；不要手改生成资产。

### 12. 验证矩阵

| 变更类型 | 验证 |
|---|---|
| Python / shell 脚本 | unit test + 真实执行脚本 |
| skill / agent prompt contract | 对应 `tests/unit/*contracts.test.js` |
| PR workflow | `git-commit-push-pr-contracts`、`using-spec-first-contracts`、`dual-host-governance-contracts` |
| review workflow | `spec-code-review-contracts`、`spec-doc-review-contracts` |
| agent frontmatter 权限 | source scan 证明只覆盖目标 agents；fresh-source eval 验证 leaf agent 只写允许的 run artifact，不编辑 repo |
| session scripts | `session-history-scripts.test.js` |
| frontmatter validator | `frontmatter-validator.test.js` |
| runtime governance | dual-host governance、smoke |
| README 计数 | `rg` 旧计数 + smoke init 输出 |
| 大范围同步 | `npm test`，必要时 `npm run build` |

基础收尾命令：

```bash
npm run lint:skill-entrypoints
npm run typecheck
git diff --check
```

验证不能只跑一个大命令代替语义检查。`npm test` 通过不代表删除 workflow 的引用面正确。

### 13. 审查报告模板

最终审查报告固定结构：

```markdown
**发现**
- P1/P2/P3 问题，带文件和行号。

**同步核对结论**
- CE 文件 -> spec-first 文件：是否对齐。
- 有意差异：列明原因。

**残留扫描**
- CE 命名残留。
- 被删除 skill 残留。
- README/runtime 计数残留。

**验证**
- 已运行命令。
- 未运行命令及原因。

**是否可进入提交**
- 可以 / 不可以。
- 阻塞项。
```

审查必须问题优先。如果没有问题，明确说没有发现阻塞问题，并列剩余风险。

### 14. 提交与推送

提交前：

```bash
git status --short
git diff --stat
git diff --check
```

提交信息建议：

```text
[TASK-CE-SYNC-<NNN>] fix(ce-sync): sync CE <head> workflow updates
```

如果同一提交包含 CE 同步之外的文档或功能变更，commit body 和 PR description 必须单独列出，避免把非 CE 工作包装成 CE 同步。

### 15. Done Criteria

一轮 CE 同步完成必须满足：

- 过滤后的 CE 文件 100% 有判定。
- 每个修改文件都有 diff 依据。
- 每个删除文件都有引用审计。
- 同步文件已按 spec-first 命名、host 语义、badge、repo URL 适配。
- 没有非预期 CE 残留。
- runtime source、governance、README、tests 一致。
- `CHANGELOG.md` 有记录。
- 验证命令通过。
- 最终回复列出实际改动、验证命令、未执行验证和剩余风险。

### 16. skills/ 拓扑变更与 adjudication 宇宙（2026-09-11 增补）

CE-localization 的冻结工件链以包路径集合为源宇宙：`skills/` 下**新增或删除任何包路径**
都会使 live `package_path_count` 偏离冻结的 `docs/validation/ce-localization/skill-inventory.json`，
而 closeout 工件（scenarios/baselines/ledger）经 `validateCloseoutArtifacts` 与该 inventory
绑定，完整重生成依赖一轮真实的 LLM adjudication——`generate-ce-localization-closeout.cjs`
的 `assertCurrentUpstreamBinding` 显式拒绝脚本代答重绑（stale input 与 stale adjudication
都会抛错）。文件**内容**修改不受此约束（内容事实走 `spec-first init` 的确定性重绑）。

操作含义：

- 常规同步批次内**避免顺手做拓扑重构**（文件拆分、合并、迁移）；它们会把语义同步批次
  拖入 adjudication 刷新。确需拓扑变更时，作为批次内的显式任务项与 adjudication 同轮执行。
- 撞到计数漂移时，`ce-localization-review-contracts` / `ce-localization-closeout-contracts`
  两个测试会列出路径差集与 remediation——不要手改冻结工件绕过。
- 实例：peer-job-runner 的 Windows 块拆分原型因该链回退，蓝图与重估条件沉淀于
  `peer-job-runner-windows-split-blueprint-2026-09-11.md`。

## Why This Matters

这套协议把 CE 同步从“prompt 文件搬运”升级为可审计的上游吸收流程：

- diff 取证保证事实完整。
- 路径映射保证 spec-first 当前结构是目标。
- 四类决策保证 LLM 做语义判断，不让字符串替换替代架构判断。
- 删除审计防止公共 workflow 被机械删除或错误保留。
- PR description gap audit 防止写作能力分裂成多真相源。
- 验证矩阵保证每个实施单元都有实际检查。
- CHANGELOG 和 runtime 边界保证同步符合项目治理。

## When to Apply

- 用户给出 CE 起始 commit，要求同步到最新。
- 用户贴 CE `git pull` 输出，要求同步到 spec-first。
- CE 上游发布新版本，需要评估是否吸收。
- spec-first 某个 workflow 与 CE 行为漂移。
- 需要删除、合并或保留某个从 CE 迁移来的 skill / agent。
- 同步涉及 `skills/`、`agents/`、workflow references、host adapter、runtime governance、README 或 AGENTS/CLAUDE。

## Examples

### PR description 迁移判断

CE 删除 `ce-pr-description` 并把写作逻辑搬进 `ce-commit-push-pr`。本轮最终判断：

- 删除 `skills/spec-pr-description/SKILL.md`。
- 删除 Claude command template 中的 `pr-description.md`。
- 从 `skills-governance.json` 删除独立 `spec-pr-description` 记录；动态 command manifest 随 governance 和 command template 删除而消失。
- 在 `using-spec-first` 中把 PR description 请求路由到 `git-commit-push-pr` description-only mode。
- 新增 `skills/git-commit-push-pr/references/pr-description-writing.md`，并做 spec-first 适配。
- 给 `git-commit-push-pr` 增加 contract test，防止 `spec-pr-description` 复活。

这个例子说明：CE 删除不等于机械保留，也不等于机械删除。最终决策来自引用审计和单一真相源判断。

### README 计数修正

删除一个公开 workflow 后，需要同时检查：

```bash
rg -n '20 workflow|20 command|20 commands|20 个|42 skills|42 个 skills|Generated 20' README.md README.zh-CN.md AGENTS.md CLAUDE.md
```

本轮就发现 README 示例已经是 `19`，但运行时说明段仍写 `20`。这是典型的“局部同步后文档计数漂移”。

### CE legacy cleanup 判断

CE 修改 `src/data/plugin-legacy-artifacts.ts` 和 `src/utils/legacy-cleanup.ts` 时，spec-first 没有同路径。正确做法：

- 查 spec-first 当前 runtime cleanup 面，例如 `src/cli/plugin.js`、adapter、managed operation plan。
- 判断 CE legacy artifact 是否在 spec-first runtime 中存在。
- 只有存在同构问题时才迁移。
- 不为追齐 CE 文件树创建无用源文件。

### Agent `Write` 权限同步判断

CE `4b5f28da..06a7cee0` 中，17 个 code-review reviewer agents 的真实变化只有：

```diff
-tools: Read, Grep, Glob, Bash
+tools: Read, Grep, Glob, Bash, Write
```

正确判断步骤：

1. 确认 CE diff 没有正文、模型、颜色或职责变化。
2. 读取 spec-first 对应 `agents/spec-*-reviewer.agent.md`，确认当前 frontmatter 仍缺 `Write`。
3. 读取 `skills/spec-code-review/references/subagent-template.md`，确认 leaf reviewer 只返回完整 JSON，不直接写文件；如需 `<review-artifact-dir>/<reviewer_name>.json`，由 orchestrator 持久化 reviewer return。
4. 明确 artifact 写入的唯一主体是 parent/orchestrator；reviewer agent 不因此获得 repo mutation、切换分支、提交或推送能力。
5. 不因 CE 追加 `Write` 就同步到 spec-first reviewer；只有当 host 能提供明确窄边界且当前 source contract 重新设计为 leaf 写入时，才重新评估。
6. 用 contract test / source scan / fresh-source eval 验证 reviewers 仍保持 read-only，artifact persistence 仍由 orchestrator 拥有。

最终计划判定应是“语义适配：仅同步 `Write` 权限”，不是“直接同步并改名”。

同一轮 CE 删除了两个 CLI readiness agents，并从 CE persona catalog 移除 selector。但 spec-first 当前仍引用 `spec-cli-readiness-reviewer`，且作为 CLI/workflow harness 可能比 CE 更需要该覆盖面。正确结论是：删除进入独立 U9 审计，默认保留分叉，不能跟随 CE 删除。

## Related

- `docs/10-prompt/结构化项目角色契约.md` — spec-first 演化判断基线。
- `docs/plans/2026-04-26-004-sync-ce-e8c118e2-workflow-updates-plan.md` — 本方法论抽取自该次 CE 同步计划。
- `docs/plans/2026-05-04-001-sync-ce-06a7cee0-workflow-updates-plan.md` — 追加沉淀 agent 权限和 CLI readiness 删除的语义适配判断。
- `skills/using-spec-first/SKILL.md` — 公共 workflow 路由和 internal-only skill 边界。
- `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md` — workflow 入口暴露的双宿主治理经验。
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md` — 修改 source asset 而不是 runtime artifact 的经验。
- `docs/solutions/architecture-patterns/peer-job-runner-windows-split-blueprint-2026-09-11.md` — Windows 块拆分蓝图与拓扑 trip-wire 实例。
