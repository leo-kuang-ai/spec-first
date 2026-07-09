# 2026-05-07 Source 全量逐文件逐行审查报告

## 结论

本轮按用户最新要求只保留 **2 轮循环审查**，已完成：

- **R1：逐文件逐行深审**。6 个 agent 分片覆盖 docs/ 与 tests/ 之外的 tracked source，并将 `docs/10-prompt/结构化项目角色契约.md` 作为角色契约例外纳入。覆盖结果为 **478/478 个文件，89,582 行**。
- **R2：多角度复核**。对 R1 findings 做反证、误报剔除、严重性排序、修复优先级合并，并结合 GitHub 与 X 的当前行业信号讨论项目下一阶段能力建设。

未发现 P0。当前最需要优先处理的是 destructive operation safety、runtime/source contract drift、workflow delivery contract、release metadata consistency 和 artifact path consistency。它们都不是单纯文案问题，直接影响 `Codebase -> Graph -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 链路的可信执行闭环。

最终讨论出的 3 个当前项目急需优化、升级、扩展的能力：

1. **Source-Controlled Workflow Contract Checks**：把 skill prose、scripts、schema、examples、runtime delivery、reference path、stable/beta parity、artifact path 统一纳入可执行 contract check。
2. **Runtime Ownership & Destructive Operation Safety Gate**：所有 clean/init/reset/stage/commit/release 路径必须有 final containment guard、ownership manifest 和 fail-closed metadata check。
3. **Progressive Context + Review-To-Knowledge Evidence Loop**：保持 entry docs 轻量，强化 graph/readiness/review evidence 的可复用沉淀，不把系统演化退化为 prompt/rules collection。

## 范围

纳入范围：

- 根部 source-of-truth 文件、CI、package/release、scripts、agents、skills、templates、src/cli、src/contracts、src/verification。
- `docs/10-prompt/结构化项目角色契约.md` 作为项目演化判断 source of truth 单独纳入。
- `tests/` 不逐文件审查，仅在 findings 中作为覆盖证据引用。

排除范围：

- `docs/` 其他文件。
- `tests/` 目录逐文件审查。
- generated runtime：`.claude/`、`.codex/`、`.agents/skills/`。
- 本地索引、缓存、产物和依赖目录：`.spec-first/`、`.gitnexus/`、`.code-review-graph/`、`node_modules/`、`dist/`、`coverage/` 等。

## 覆盖汇总

| Agent | 审查切片 | 文件数 | 行数 | R1 状态 | R2 状态 |
|---|---|---:|---:|---|---|
| A | 根部入口、CI、package/release、scripts、README/CHANGELOG | 32 | 7,784 | 逐文件逐行完成 | 复核完成 |
| B | agent-native、app consistency audit、imagegen、brainstorm 前段 skills | 128 | 22,302 | 逐文件逐行完成 | 复核完成 |
| C | code-review、compound、debug、doc-review、graph-bootstrap skills | 51 | 13,436 | 逐文件逐行完成 | 复核完成 |
| D | ideate、mcp-setup、optimize、plan、polish、sessions、standards、update skills | 139 | 26,848 | 逐文件逐行完成 | 复核完成 |
| E | work/work-beta/workflow shipping 文档与业界调研兼任 | 19 | 3,820 | 逐文件逐行完成 | 复核完成 |
| F | agents、templates、src/cli、角色契约 | 109 | 15,392 | 逐文件逐行完成 | 复核完成 |
| **合计** | docs/ 与 tests/ 排除后的 source，另纳入角色契约 docs 例外 | **478** | **89,582** | **完成** | **完成** |

说明：E 号 agent 兼任业界调研 agent。原因是当前宿主 thread limit 已达到可用 agent 上限，无法再启动第 7 个长期 agent；该调研没有省略，而是作为 E 分片的 R2 输入并进入最终综合讨论。

## 审查方法

R1 审查维度：

- 逐文件逐行读取各自分片，记录每个文件的 reviewed 状态。
- 对可执行资产运行语法级验证：JS `node --check`、JSON parse、Shell `bash -n`、Python `py_compile`。D 分片报告当前机器缺少 `shellcheck` 和 `pwsh`，因此未执行 ShellCheck 与 PowerShell 语法器级验证。
- 对 agent/skill/frontmatter、source/runtime boundary、host delivery、artifact contract、script/LLM ownership、destructive operation、release metadata、workflow handoff 做语义审查。

R2 复核维度：

- 对每个 high-priority finding 做源码行号反证，去除无法追溯、已有合理边界或 intentional execution 的候选。
- 区分 script-owned facts 与 LLM-owned judgment，避免把脚本应做的确定性校验交给 prose，也避免让脚本替代语义判断。
- 用角色契约校准：`Light contract`、`Explicit boundaries`、`Scripts prepare, LLM decides`、`source-first`、`preview-first`。
- 用 GitHub 与 X 当前信号校准方向，只把 X 作为 community signal，不把普通帖子当作官方事实。

## 外部调研信号

GitHub confirmed facts，复核时间：2026-05-07 Asia/Shanghai。

| Repo | Stars | Updated | 信号 |
|---|---:|---|---|
| [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | 85,149 | 2026-05-06 | MCP server 生态继续扩大，说明 provider/tool protocol 是基础层，不应被 workflow prose 硬编码替代。 |
| [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | 72,748 | 2026-05-06 | 完整 agentic dev environment 强调任务环境、执行证据与状态可观测。 |
| [cline/cline](https://github.com/cline/cline) | 61,429 | 2026-05-06 | 强调 permissioned execution 与 human-in-the-loop，支持 runtime safety gate 方向。 |
| [Aider-AI/aider](https://github.com/Aider-AI/aider) | 44,411 | 2026-05-06 | Git-native workflow 和自动提交能力说明 commit/stage 边界必须可靠。 |
| [continuedev/continue](https://github.com/continuedev/continue) | 33,001 | 2026-05-06 | 项目描述强调 source-controlled AI checks 和 CI enforcement，与本报告能力建议 1 对齐。 |
| [RooCodeInc/Roo-Code](https://github.com/RooCodeInc/Roo-Code) | 23,896 | 2026-05-06 | 多 agent 开发团队形态增加了 asset ownership、context isolation、handoff evidence 的重要性。 |
| [protectskills/MaliciousAgentSkillsBench](https://github.com/protectskills/MaliciousAgentSkillsBench) | 42 | 2026-05-06 | Agent Skills supply-chain 风险正在被显式 benchmark 化，说明 skill source/runtime 安全边界需要自动审查。 |

X community signals，复核时间：2026-05-07 Asia/Shanghai。

- 2026-05-06 的 MCP vs Skills 讨论把 MCP 归为协议/工具层，把 skills 归为 playbook/行为层。这与本项目的 “provider/tools 准备事实，LLM/skills 做语义执行” 一致。
- 2026-05-05 到 2026-05-06 多条讨论强调 AI coding 不是单一模型竞争，而是可运行 stack：context、tools、verification、memory、logs、handoff。对应本项目应继续强化 workflow harness，而不是扩张 prompt collection。
- 2026-05-05 的 agent supply-chain 讨论明确提到 `CLAUDE.md`、skills、MCP configs 会共同组成 runtime behavior。这直接支持 source/runtime drift、asset ownership manifest、skill security lint 的建设优先级。
- 关于大上下文窗口的讨论强调 “load the whole codebase” 不是核心解法，组织和验证 agent work 才是难点。这支持 progressive context 与 evidence loop，而不是继续堆更多规则文本。

## P0 Findings

未发现 P0。

## P1 Findings

### P1-1 managed state 删除路径缺少 final containment guard

证据：

- `src/cli/state.js:243-302` 直接把 `state.commands`、`state.skills`、`state.workflowSkills`、`state.agents`、`state.agentSupportFiles`、`state.developer.path` 拼入删除目标。
- `src/cli/state.js:519-582` 对 `operation.path` 执行 `path.join(projectRoot, operation.path)` 后进入 `fs.rmSync`，未在最终执行层拒绝绝对路径、`..`、反斜杠、空段或非 managed-root 路径。

为什么重要：`spec-first clean` / `init reset` 是 runtime 维护入口，删除操作不能信任本地 state 文件永远未损坏或未被篡改。最终执行层必须 fail closed。

建议：新增统一 path guard，要求所有 remove/write operation 同时满足 repo-contained 与 allowed managed root-contained；补 malicious state 单测。

### P1-2 Codex legacy cleanup 删除 `.agents/plugins` 根目录

证据：

- `src/cli/adapters/codex.js:71-72` 把 `.agents/plugins` 定义为 `legacyMarketplaceRoot`。
- `src/cli/adapters/codex.js:256-268` 将该根目录纳入 runtime cleanup 计划。
- `src/cli/commands/clean.js:195` 合入 adapter runtime removal。

为什么重要：`.agents/plugins` 是通用 marketplace/plugin 位置，spec-first 不应声称拥有整个目录。该行为可能误删非 spec-first 插件资产。

建议：只删除带 spec-first ownership manifest 的 legacy 子路径，或改为 preview-first orphan report，禁止删除 marketplace 根目录。

### P1-3 work-beta delegation 成功提交模板会 stage 所有 untracked 文件

证据：

- `skills/spec-work-beta/references/codex-delegation-workflow.md:203-211` 明确 clean-baseline preflight intentionally ignores untracked files，只在 batch Files overlap 时提示。
- `skills/spec-work-beta/references/codex-delegation-workflow.md:299-306` rollback 只 clean batch paths。
- `skills/spec-work-beta/references/codex-delegation-workflow.md:310-312` 成功路径却执行 `git add $(git diff --name-only HEAD; git ls-files --others --exclude-standard)`，会把所有 unrelated untracked files 一起 stage。

为什么重要：这会破坏用户工作区边界，尤其在 Codex delegation 或多 agent fork 合并场景下，容易把无关本地文件纳入 commit。

建议：成功路径只 stage batch owned files 或 result manifest 中确认的 changed files；对 untracked unrelated files 保持 untouched。

### P1-4 package lock 版本与 package version 漂移

证据：

- `package.json:3` 为 `1.7.1`。
- `package-lock.json:3` 和 `package-lock.json:9` 仍为 `1.6.1`。

为什么重要：release metadata 是 npm 发布与安装可信度的基础事实。lockfile 根版本漂移会让发布检查、安装验证和用户排障出现分裂事实。

建议：release 脚本同步更新 lockfile root version，或在 release gate 中 fail closed；增加 package/package-lock version drift smoke。

### P1-5 spec-standards 使用错误 impact capabilities canonical path

证据：

- `skills/spec-standards/SKILL.md:63` 写 `.spec-first/graph/bootstrap-impact-capabilities.json`。
- `skills/spec-standards/scripts/prepare-baseline.js:352` 查找 `.spec-first/graph/bootstrap-impact-capabilities.json`。
- `skills/spec-standards/scripts/prepare-baseline.js:1371` 输出 `.spec-first/graph/bootstrap-impact-capabilities.json`。
- 反证 canonical path：`skills/spec-plan/SKILL.md:232`、`skills/spec-mcp-setup/scripts/write-provider-config.sh:778`、`skills/spec-mcp-setup/scripts/write-provider-config.ps1:674` 使用 `.spec-first/impact/bootstrap-impact-capabilities.json`。

为什么重要：`spec-standards` 是 standards/context compiler，下游会因此漏读 graph readiness impact facts，或生成错误 glue capability map。

建议：统一到 `.spec-first/impact/bootstrap-impact-capabilities.json`，并补 artifact path consistency test。

### P1-6 public workflow helper/reference runtime delivery contract 不闭环

证据：

- `src/cli/plugin.js:35-38` 的 agent-facing internal allowlist 只有 `spec-session-extract` 和 `spec-session-inventory`。
- `src/cli/plugin.js:602-608` 只有 allowlist 内的 internal skill 会进入 runtime delivery。
- public workflow prose 仍要求加载未必交付的 helper，例如 `skills/spec-work/references/shipping-workflow.md:91-101` 的 `git-commit-push-pr` / `git-commit`，以及 `skills/spec-brainstorm/references/handoff.md:77-84`、`skills/spec-plan/references/plan-handoff.md:53-59` 的 `proof`。
- Claude command 内联 skill body：`src/cli/plugin.js:1139-1146`、`src/cli/adapters/claude.js:59-65`。路径重写只处理 `skills/<skill>/...`：`src/cli/adapters/claude.js:214-223`，而 `skills/spec-work/SKILL.md:387` 仍写裸 `references/shipping-workflow.md`。

为什么重要：workflow 在后半段才发现 helper/reference 缺失，用户会在主要工作完成后遇到断裂。该问题跨 source prose、runtime projection、host path resolution。

建议：新增 source-to-runtime delivery verifier，检查 public workflow 中所有 `Load the <skill> skill` 与裸 `references/...` 在目标 host runtime 中可解析。

## P2 Findings

- **app-audit 输入路径解析违背 contract**：`skills/spec-app-consistency-audit/SKILL.md:68-70` 规定 relative paths resolve against repoRoot，但 `extract-prd-contract.js:44-52`、`extract-figma-contract.js:49-55` 会在缺少 `repoRoot` 时退到 `options.source` 或 cwd。
- **compound/compound-refresh validator cwd/path contract 错误**：prose 要求从 skill 目录运行 `python3 scripts/validate-frontmatter.py <output-path>`，但 validator 在 `validate-frontmatter.py:32-34` 直接按当前 cwd 判断文件存在；传 repo-relative `docs/solutions/...` 时会误报。
- **spec-doc-review FYI enum contract 不一致**：`findings-schema.json:46-49` schema enum 只有 `safe_auto`、`gated_auto`、`manual`，但 `review-output-template.md:9` 说 `FYI` 也在 schema/synthesis pipeline；`synthesis-and-presentation.md:24-31` 又定义 FYI 是 presentation bucket。
- **legacy wrapper APIs 缺少 adapter**：`src/cli/agents.js`、`src/cli/skills.js` 调用 `plugin.js` wrapper 时未提供 adapter，未来误用会崩。
- **dual-host governance schema/validator 不一致**：governance JSON 包含 `$schema`，schema `additionalProperties:false` 未声明该字段，且 lightweight validator 不支持当前 schema 使用的 `$ref/$defs`。
- **AI Dev Quality Gate path filter 覆盖不足**：`.github/workflows/ai-dev-quality-gate.yml:5-31` 未覆盖多项 source/runtime governance surface，容易漏跑关键 contract tests。
- **legacy task scripts 与当前双宿主目标不匹配**：`scripts/task-manager.sh` 写 `.claude/tasks` 且未校验 `task_id`，使用 macOS-only `sed -i ''`；`scripts/stage-gate.sh` 仍体现旧式强状态机。
- **stable/beta frontend guidance 漂移**：`skills/spec-work-beta/SKILL.md:433-439` 有无 Figma UI 任务加载 frontend design 的规则，`skills/spec-work/SKILL.md:369-383` 没有同等规则，且 stable 编号重复为两个 Step 6。
- **agent-native-audit helper option 与拼写错误**：`skills/agent-native-audit/SKILL.md:31-35` 说 option 7 是 action parity，但 `skills/agent-native-architecture/SKILL.md:165-166` 显示 option 7 是 context injection、option 8 才是 action parity；`skills/agent-native-audit/SKILL.md:118` 有 `SHARED WORKSPASpec-First` 拼接错误。
- **gemini-imagegen prose 与 helper/default 示例不一致**：`skills/gemini-imagegen/SKILL.md:14-16` 要求默认 Pro model，但 scripts/quick reference 仍表现为其他默认与 `output.png` 路径口径。
- **README/Codex init count 漂移**：`README.md:520`、`README.zh-CN.md:520` 描述 21 workflow + 2 standalone + 2 internal，但 `:541` expected output 仍写 24 skill directory。

## P3 Findings

- `skills/spec-work/SKILL.md:369` 与 `:378` 编号重复。
- `skills/spec-doc-review` walkthrough step 编号存在 `3.6` / `3.5b` 漂移。
- `skills/spec-code-review` walkthrough 多处引用不存在的 Stage 5 step `7b`，实际应为 `6b`。
- `src/cli/commands/init.js:766` 输出 `directorie(s)`。
- `src/cli/commands/doctor.js:1011-1034` help array 混入 tab 缩进。
- Proof identity 参考中存在陈旧 header `X-Agent-Id: claude`。
- 根部 tracked `CLI` 文件是 stale MCP help output，建议确认是否应继续纳入 source。
- `.gitignore` runtime ignore block 有重复维护迹象，建议后续由 init managed block 单一治理。

## 反证与误报剔除

以下候选经 R2 复核后不保留为 finding：

- agent frontmatter 没有 `tools` 字段：当前 projection 未要求必填，保持轻量是合理选择。
- `templates/claude/hooks/session-start` inline JS：只读启动提醒、trusted CLI path、失败静默，符合 startup reminder 边界。
- `templates/claude/commands/spec/*.md` 本身保持薄 frontmatter + paired skill hint：方向正确；真正问题是内联 skill body 后 reference path 未被完全重写。
- `doctor` 读取 verification evidence：属于 script-owned facts，不是让 LLM 伪造校验。
- `spec-optimize/scripts/measure.sh` 的 `bash -c`：这是用户批准 optimize spec 后执行 measurement command 的核心机制，不单独报 injection。
- `spec-optimize/scripts/parallel-probe.sh` Python `-c` 拼 JSON：输入来自脚本固定分支和计数值，不是任意用户输入。
- `spec-polish-beta/scripts/detect-project-type.sh` 的 `eval find`：动态片段来自硬编码 signature/exclude arrays，未发现用户可控 shell 片段。
- `spec-optimize/scripts/experiment-worktree.sh` 的 worktree reset/clean：约束在 generated experiment worktree/branch 命名与路径内，当前不报 destructive-scope issue。
- 长行和 schema 示例可读性问题：未发现可执行 contract 错误，不单独报 P3。

## 修复优先级

1. **先修 destructive operation safety**：`state.js` final containment guard、Codex marketplace cleanup ownership、work-beta stage set 收敛。
2. **再修 release/artifact contract drift**：package-lock 版本、`spec-standards` impact path、dual-host governance schema/validator。
3. **再修 workflow delivery contract**：internal helper delivery、Claude command reference rewrite、public workflow load helper 可解析测试。
4. **然后修 stable/beta parity 与文案漂移**：frontend guidance、step 编号、README count、agent-native/gemini prose。此类适合批量 contract lint。
5. **最后清理 legacy surface**：`.claude/tasks` scripts、root `CLI`、重复 gitignore block，先判定是否 still supported，再决定删除或迁移。

## 三个急需能力记录

### 1. Source-Controlled Workflow Contract Checks

目标：让 workflow prose、scripts、schema、examples、runtime projection 的 contract 漂移在 PR 阶段被发现。

最小 durable mechanism：新增一个 read-only contract checker，覆盖：

- `Load the <skill> skill` 是否在目标 host delivery 中可解析。
- 裸 `references/...` 在 Claude/Codex runtime projection 中是否可解析。
- schema enum 与 presentation bucket 是否混淆。
- stable/beta skill 是否出现关键 workflow parity drift。
- `.spec-first/graph/*` 与 `.spec-first/impact/*` canonical artifact path 是否漂移。

### 2. Runtime Ownership & Destructive Operation Safety Gate

目标：让所有删除、清理、stage、commit、release 写入都遵循 explicit ownership 和 final guard。

最小 durable mechanism：

- 所有 `applyOperationPlan` 操作最终执行前强制 repo-contained + allowed managed root-contained。
- runtime cleanup 只依据 spec-first ownership manifest 删除，不依据父目录名称删除。
- commit/stage helper 使用 owned file manifest，不 stage unrelated untracked files。
- release gate 检查 package/package-lock/version/changelog 一致性。

### 3. Progressive Context + Review-To-Knowledge Evidence Loop

目标：把更多上下文变成可验证 facts 和 review evidence，而不是把 entry docs 变厚。

最小 durable mechanism：

- Entry docs 继续保持轻量，详细判断放在 skill source 和 contract tests。
- Graph/readiness/review facts 用 canonical artifact 表达 freshness、degraded reason、consumer，不让 downstream 猜测。
- Review findings 经过 R2 反证后沉淀为 docs/solutions 或 contract tests，形成 `Review -> Knowledge` 闭环。
- 外部调研进入 capability backlog 时必须区分 GitHub confirmed facts、官方文档事实、X community signals。

## Coverage Ledger Appendix

| # | Agent | 文件 | 行数 | 状态 |
|---:|---|---|---:|---|
| 1 | A | `.github/workflows/ai-dev-quality-gate.yml` | 59 | reviewed |
| 2 | A | `.github/workflows/npm-install-matrix.yml` | 115 | reviewed |
| 3 | A | `.github/workflows/skill-entrypoint-gate.yml` | 29 | reviewed |
| 4 | A | `.github/workflows/sync-master-to-main.yml` | 49 | reviewed |
| 5 | A | `.gitignore` | 110 | reviewed |
| 6 | A | `.npmignore` | 12 | reviewed |
| 7 | A | `AGENTS.md` | 364 | reviewed |
| 8 | A | `CHANGELOG.md` | 1032 | reviewed |
| 9 | A | `CLAUDE.md` | 362 | reviewed |
| 10 | A | `CLI` | 16 | reviewed |
| 11 | A | `CONTRIBUTING.md` | 51 | reviewed |
| 12 | A | `LICENSE` | 21 | reviewed |
| 13 | A | `README.md` | 569 | reviewed |
| 14 | A | `README.zh-CN.md` | 569 | reviewed |
| 15 | A | `SECURITY.md` | 35 | reviewed |
| 16 | A | `bin/postinstall.js` | 19 | reviewed |
| 17 | A | `bin/spec-first.js` | 16 | reviewed |
| 18 | A | `dev-reload.sh` | 12 | reviewed |
| 19 | A | `install-local.sh` | 34 | reviewed |
| 20 | A | `jest.config.js` | 19 | reviewed |
| 21 | A | `package-lock.json` | 3155 | reviewed |
| 22 | A | `package.json` | 79 | reviewed |
| 23 | A | `scripts/generate-runtime-capability-catalog.js` | 209 | reviewed |
| 24 | A | `scripts/lint-skill-entrypoints.config.json` | 31 | reviewed |
| 25 | A | `scripts/lint-skill-entrypoints.js` | 210 | reviewed |
| 26 | A | `scripts/release-publish.cjs` | 124 | reviewed |
| 27 | A | `scripts/review-judge.sh` | 68 | reviewed |
| 28 | A | `scripts/run-ai-dev-quality-gate.js` | 121 | reviewed |
| 29 | A | `scripts/stage-gate.sh` | 74 | reviewed |
| 30 | A | `scripts/task-manager.sh` | 118 | reviewed |
| 31 | A | `scripts/test-skills.sh` | 40 | reviewed |
| 32 | A | `scripts/typecheck-js.js` | 62 | reviewed |
| 33 | B | `skills/agent-native-architecture/SKILL.md` | 436 | reviewed |
| 34 | B | `skills/agent-native-architecture/references/action-parity-discipline.md` | 409 | reviewed |
| 35 | B | `skills/agent-native-architecture/references/agent-execution-patterns.md` | 467 | reviewed |
| 36 | B | `skills/agent-native-architecture/references/agent-native-testing.md` | 582 | reviewed |
| 37 | B | `skills/agent-native-architecture/references/architecture-patterns.md` | 478 | reviewed |
| 38 | B | `skills/agent-native-architecture/references/dynamic-context-injection.md` | 338 | reviewed |
| 39 | B | `skills/agent-native-architecture/references/files-universal-interface.md` | 301 | reviewed |
| 40 | B | `skills/agent-native-architecture/references/from-primitives-to-domain-tools.md` | 359 | reviewed |
| 41 | B | `skills/agent-native-architecture/references/mcp-tool-design.md` | 506 | reviewed |
| 42 | B | `skills/agent-native-architecture/references/mobile-patterns.md` | 871 | reviewed |
| 43 | B | `skills/agent-native-architecture/references/product-implications.md` | 443 | reviewed |
| 44 | B | `skills/agent-native-architecture/references/refactoring-to-prompt-native.md` | 317 | reviewed |
| 45 | B | `skills/agent-native-architecture/references/self-modification.md` | 269 | reviewed |
| 46 | B | `skills/agent-native-architecture/references/shared-workspace-architecture.md` | 680 | reviewed |
| 47 | B | `skills/agent-native-architecture/references/system-prompt-design.md` | 250 | reviewed |
| 48 | B | `skills/agent-native-audit/SKILL.md` | 282 | reviewed |
| 49 | B | `skills/changelog/SKILL.md` | 144 | reviewed |
| 50 | B | `skills/feature-video/SKILL.md` | 186 | reviewed |
| 51 | B | `skills/feature-video/references/tier-browser-reel.md` | 122 | reviewed |
| 52 | B | `skills/feature-video/references/tier-screenshot-reel.md` | 66 | reviewed |
| 53 | B | `skills/feature-video/references/tier-static-screenshots.md` | 59 | reviewed |
| 54 | B | `skills/feature-video/references/tier-terminal-recording.md` | 101 | reviewed |
| 55 | B | `skills/feature-video/references/upload-and-approval.md` | 85 | reviewed |
| 56 | B | `skills/feature-video/scripts/capture-demo.py` | 786 | reviewed |
| 57 | B | `skills/frontend-design/SKILL.md` | 258 | reviewed |
| 58 | B | `skills/gemini-imagegen/SKILL.md` | 237 | reviewed |
| 59 | B | `skills/gemini-imagegen/requirements.txt` | 5 | reviewed |
| 60 | B | `skills/gemini-imagegen/scripts/compose_images.py` | 157 | reviewed |
| 61 | B | `skills/gemini-imagegen/scripts/edit_image.py` | 144 | reviewed |
| 62 | B | `skills/gemini-imagegen/scripts/gemini_images.py` | 263 | reviewed |
| 63 | B | `skills/gemini-imagegen/scripts/generate_image.py` | 133 | reviewed |
| 64 | B | `skills/gemini-imagegen/scripts/multi_turn_chat.py` | 216 | reviewed |
| 65 | B | `skills/git-clean-gone-branches/SKILL.md` | 63 | reviewed |
| 66 | B | `skills/git-clean-gone-branches/scripts/clean-gone` | 48 | reviewed |
| 67 | B | `skills/git-commit-push-pr/SKILL.md` | 234 | reviewed |
| 68 | B | `skills/git-commit-push-pr/references/branch-creation.md` | 85 | reviewed |
| 69 | B | `skills/git-commit-push-pr/references/pr-description-writing.md` | 285 | reviewed |
| 70 | B | `skills/git-commit/SKILL.md` | 111 | reviewed |
| 71 | B | `skills/git-worktree/SKILL.md` | 81 | reviewed |
| 72 | B | `skills/git-worktree/scripts/worktree-manager.sh` | 239 | reviewed |
| 73 | B | `skills/lfg/SKILL.md` | 70 | reviewed |
| 74 | B | `skills/lfg/references/tracker-defer.md` | 149 | reviewed |
| 75 | B | `skills/proof/SKILL.md` | 315 | reviewed |
| 76 | B | `skills/proof/references/hitl-review.md` | 368 | reviewed |
| 77 | B | `skills/report-bug/SKILL.md` | 159 | reviewed |
| 78 | B | `skills/resolve-pr-feedback/SKILL.md` | 429 | reviewed |
| 79 | B | `skills/resolve-pr-feedback/scripts/get-pr-comments` | 128 | reviewed |
| 80 | B | `skills/resolve-pr-feedback/scripts/get-thread-for-comment` | 62 | reviewed |
| 81 | B | `skills/resolve-pr-feedback/scripts/reply-to-pr-thread` | 33 | reviewed |
| 82 | B | `skills/resolve-pr-feedback/scripts/resolve-pr-thread` | 23 | reviewed |
| 83 | B | `skills/spec-app-consistency-audit/SKILL.md` | 301 | reviewed |
| 84 | B | `skills/spec-app-consistency-audit/prompts/accessibility-i18n-lens.md` | 41 | reviewed |
| 85 | B | `skills/spec-app-consistency-audit/prompts/analytics-expert.md` | 49 | reviewed |
| 86 | B | `skills/spec-app-consistency-audit/prompts/audit-planner.md` | 70 | reviewed |
| 87 | B | `skills/spec-app-consistency-audit/prompts/component-module-expert.md` | 49 | reviewed |
| 88 | B | `skills/spec-app-consistency-audit/prompts/engineering-quality-expert.md` | 59 | reviewed |
| 89 | B | `skills/spec-app-consistency-audit/prompts/evidence-auditor.md` | 58 | reviewed |
| 90 | B | `skills/spec-app-consistency-audit/prompts/figma-design-expert.md` | 51 | reviewed |
| 91 | B | `skills/spec-app-consistency-audit/prompts/i18n-expert.md` | 48 | reviewed |
| 92 | B | `skills/spec-app-consistency-audit/prompts/industry-expert.md` | 48 | reviewed |
| 93 | B | `skills/spec-app-consistency-audit/prompts/kmp-clean-architect.md` | 56 | reviewed |
| 94 | B | `skills/spec-app-consistency-audit/prompts/mobile-ux-expert.md` | 55 | reviewed |
| 95 | B | `skills/spec-app-consistency-audit/prompts/orchestrator.md` | 49 | reviewed |
| 96 | B | `skills/spec-app-consistency-audit/prompts/page-route-expert.md` | 53 | reviewed |
| 97 | B | `skills/spec-app-consistency-audit/prompts/product-expert.md` | 55 | reviewed |
| 98 | B | `skills/spec-app-consistency-audit/prompts/regression-expert.md` | 56 | reviewed |
| 99 | B | `skills/spec-app-consistency-audit/prompts/report-writer.md` | 57 | reviewed |
| 100 | B | `skills/spec-app-consistency-audit/references/ecc-source-lock.json` | 271 | reviewed |
| 101 | B | `skills/spec-app-consistency-audit/references/pilot-validation.md` | 58 | reviewed |
| 102 | B | `skills/spec-app-consistency-audit/references/report-format.md` | 42 | reviewed |
| 103 | B | `skills/spec-app-consistency-audit/rule-packs/analytics/rules.yaml` | 13 | reviewed |
| 104 | B | `skills/spec-app-consistency-audit/rule-packs/common-app/checklist.md` | 7 | reviewed |
| 105 | B | `skills/spec-app-consistency-audit/rule-packs/common-app/rules.yaml` | 13 | reviewed |
| 106 | B | `skills/spec-app-consistency-audit/rule-packs/component-module-reuse/rules.yaml` | 15 | reviewed |
| 107 | B | `skills/spec-app-consistency-audit/rule-packs/i18n/rules.yaml` | 15 | reviewed |
| 108 | B | `skills/spec-app-consistency-audit/rule-packs/industries/ecommerce/rules.yaml` | 15 | reviewed |
| 109 | B | `skills/spec-app-consistency-audit/rule-packs/industries/finance-common/rules.yaml` | 17 | reviewed |
| 110 | B | `skills/spec-app-consistency-audit/rule-packs/industries/securities/rules.yaml` | 17 | reviewed |
| 111 | B | `skills/spec-app-consistency-audit/rule-packs/kmp-clean-architecture/rules.yaml` | 15 | reviewed |
| 112 | B | `skills/spec-app-consistency-audit/schemas/analytics-contract.schema.json` | 19 | reviewed |
| 113 | B | `skills/spec-app-consistency-audit/schemas/app-audit-context.schema.json` | 36 | reviewed |
| 114 | B | `skills/spec-app-consistency-audit/schemas/artifact-manifest.schema.json` | 48 | reviewed |
| 115 | B | `skills/spec-app-consistency-audit/schemas/audit-plan.schema.json` | 33 | reviewed |
| 116 | B | `skills/spec-app-consistency-audit/schemas/audit-report.schema.json` | 163 | reviewed |
| 117 | B | `skills/spec-app-consistency-audit/schemas/codebase-contract.schema.json` | 20 | reviewed |
| 118 | B | `skills/spec-app-consistency-audit/schemas/component-contract.schema.json` | 20 | reviewed |
| 119 | B | `skills/spec-app-consistency-audit/schemas/engineering-quality-contract.schema.json` | 19 | reviewed |
| 120 | B | `skills/spec-app-consistency-audit/schemas/figma-design-contract.schema.json` | 21 | reviewed |
| 121 | B | `skills/spec-app-consistency-audit/schemas/i18n-contract.schema.json` | 20 | reviewed |
| 122 | B | `skills/spec-app-consistency-audit/schemas/impact-facts.schema.json` | 46 | reviewed |
| 123 | B | `skills/spec-app-consistency-audit/schemas/industry-profile.schema.json` | 19 | reviewed |
| 124 | B | `skills/spec-app-consistency-audit/schemas/issue.schema.json` | 115 | reviewed |
| 125 | B | `skills/spec-app-consistency-audit/schemas/issues.schema.json` | 33 | reviewed |
| 126 | B | `skills/spec-app-consistency-audit/schemas/kmp-architecture-contract.schema.json` | 21 | reviewed |
| 127 | B | `skills/spec-app-consistency-audit/schemas/merged-app-audit-context.schema.json` | 19 | reviewed |
| 128 | B | `skills/spec-app-consistency-audit/schemas/metadata.schema.json` | 48 | reviewed |
| 129 | B | `skills/spec-app-consistency-audit/schemas/module-contract.schema.json` | 22 | reviewed |
| 130 | B | `skills/spec-app-consistency-audit/schemas/page-route-contract.schema.json` | 19 | reviewed |
| 131 | B | `skills/spec-app-consistency-audit/schemas/preflight.schema.json` | 63 | reviewed |
| 132 | B | `skills/spec-app-consistency-audit/schemas/product-contract.schema.json` | 20 | reviewed |
| 133 | B | `skills/spec-app-consistency-audit/schemas/rule-pack-selection.schema.json` | 19 | reviewed |
| 134 | B | `skills/spec-app-consistency-audit/scripts/build-artifact-manifest.js` | 127 | reviewed |
| 135 | B | `skills/spec-app-consistency-audit/scripts/build-audit-context.js` | 146 | reviewed |
| 136 | B | `skills/spec-app-consistency-audit/scripts/build-impact-facts.js` | 322 | reviewed |
| 137 | B | `skills/spec-app-consistency-audit/scripts/build-industry-profile.js` | 183 | reviewed |
| 138 | B | `skills/spec-app-consistency-audit/scripts/build-run-metadata.js` | 158 | reviewed |
| 139 | B | `skills/spec-app-consistency-audit/scripts/extract-analytics.js` | 133 | reviewed |
| 140 | B | `skills/spec-app-consistency-audit/scripts/extract-code-contract.js` | 226 | reviewed |
| 141 | B | `skills/spec-app-consistency-audit/scripts/extract-components.js` | 160 | reviewed |
| 142 | B | `skills/spec-app-consistency-audit/scripts/extract-engineering-quality.js` | 147 | reviewed |
| 143 | B | `skills/spec-app-consistency-audit/scripts/extract-figma-contract.js` | 333 | reviewed |
| 144 | B | `skills/spec-app-consistency-audit/scripts/extract-i18n.js` | 169 | reviewed |
| 145 | B | `skills/spec-app-consistency-audit/scripts/extract-kmp-architecture.js` | 190 | reviewed |
| 146 | B | `skills/spec-app-consistency-audit/scripts/extract-modules.js` | 226 | reviewed |
| 147 | B | `skills/spec-app-consistency-audit/scripts/extract-page-routes.js` | 216 | reviewed |
| 148 | B | `skills/spec-app-consistency-audit/scripts/extract-prd-contract.js` | 244 | reviewed |
| 149 | B | `skills/spec-app-consistency-audit/scripts/lib/audit-utils.js` | 914 | reviewed |
| 150 | B | `skills/spec-app-consistency-audit/scripts/merge-contracts.js` | 707 | reviewed |
| 151 | B | `skills/spec-app-consistency-audit/scripts/preflight.js` | 572 | reviewed |
| 152 | B | `skills/spec-app-consistency-audit/scripts/render-headless-envelope.js` | 186 | reviewed |
| 153 | B | `skills/spec-app-consistency-audit/scripts/select-rule-packs.js` | 144 | reviewed |
| 154 | B | `skills/spec-app-consistency-audit/scripts/validate-artifacts.js` | 660 | reviewed |
| 155 | B | `skills/spec-brainstorm/SKILL.md` | 234 | reviewed |
| 156 | B | `skills/spec-brainstorm/references/handoff.md` | 127 | reviewed |
| 157 | B | `skills/spec-brainstorm/references/requirements-capture.md` | 257 | reviewed |
| 158 | B | `skills/spec-brainstorm/references/synthesis-summary.md` | 101 | reviewed |
| 159 | B | `skills/spec-brainstorm/references/universal-brainstorming.md` | 63 | reviewed |
| 160 | B | `skills/spec-brainstorm/references/visual-communication.md` | 29 | reviewed |
| 161 | C | `skills/spec-code-review/SKILL.md` | 920 | reviewed |
| 162 | C | `skills/spec-code-review/references/bulk-preview.md` | 103 | reviewed |
| 163 | C | `skills/spec-code-review/references/diff-scope.md` | 31 | reviewed |
| 164 | C | `skills/spec-code-review/references/findings-schema.json` | 139 | reviewed |
| 165 | C | `skills/spec-code-review/references/persona-catalog.md` | 70 | reviewed |
| 166 | C | `skills/spec-code-review/references/review-output-template.md` | 149 | reviewed |
| 167 | C | `skills/spec-code-review/references/subagent-template.md` | 189 | reviewed |
| 168 | C | `skills/spec-code-review/references/tracker-defer.md` | 149 | reviewed |
| 169 | C | `skills/spec-code-review/references/validator-template.md` | 85 | reviewed |
| 170 | C | `skills/spec-code-review/references/walkthrough.md` | 249 | reviewed |
| 171 | C | `skills/spec-code-review/scripts/resolve-base.sh` | 101 | reviewed |
| 172 | C | `skills/spec-compound-refresh/SKILL.md` | 694 | reviewed |
| 173 | C | `skills/spec-compound-refresh/assets/resolution-template.md` | 94 | reviewed |
| 174 | C | `skills/spec-compound-refresh/references/schema.yaml` | 231 | reviewed |
| 175 | C | `skills/spec-compound-refresh/references/yaml-schema.md` | 118 | reviewed |
| 176 | C | `skills/spec-compound-refresh/scripts/validate-frontmatter.py` | 105 | reviewed |
| 177 | C | `skills/spec-compound/SKILL.md` | 543 | reviewed |
| 178 | C | `skills/spec-compound/assets/resolution-template.md` | 94 | reviewed |
| 179 | C | `skills/spec-compound/references/schema.yaml` | 231 | reviewed |
| 180 | C | `skills/spec-compound/references/yaml-schema.md` | 118 | reviewed |
| 181 | C | `skills/spec-compound/scripts/validate-frontmatter.py` | 105 | reviewed |
| 182 | C | `skills/spec-debug/SKILL.md` | 241 | reviewed |
| 183 | C | `skills/spec-debug/references/anti-patterns.md` | 91 | reviewed |
| 184 | C | `skills/spec-debug/references/defense-in-depth.md` | 35 | reviewed |
| 185 | C | `skills/spec-debug/references/investigation-techniques.md` | 374 | reviewed |
| 186 | C | `skills/spec-dhh-rails-style/SKILL.md` | 185 | reviewed |
| 187 | C | `skills/spec-dhh-rails-style/references/architecture.md` | 653 | reviewed |
| 188 | C | `skills/spec-dhh-rails-style/references/controllers.md` | 303 | reviewed |
| 189 | C | `skills/spec-dhh-rails-style/references/frontend.md` | 510 | reviewed |
| 190 | C | `skills/spec-dhh-rails-style/references/gems.md` | 266 | reviewed |
| 191 | C | `skills/spec-dhh-rails-style/references/models.md` | 359 | reviewed |
| 192 | C | `skills/spec-dhh-rails-style/references/testing.md` | 338 | reviewed |
| 193 | C | `skills/spec-doc-review/SKILL.md` | 196 | reviewed |
| 194 | C | `skills/spec-doc-review/references/bulk-preview.md` | 128 | reviewed |
| 195 | C | `skills/spec-doc-review/references/decision-primer.md` | 44 | reviewed |
| 196 | C | `skills/spec-doc-review/references/findings-schema.json` | 85 | reviewed |
| 197 | C | `skills/spec-doc-review/references/open-questions-defer.md` | 177 | reviewed |
| 198 | C | `skills/spec-doc-review/references/review-output-template.md` | 121 | reviewed |
| 199 | C | `skills/spec-doc-review/references/subagent-template.md` | 172 | reviewed |
| 200 | C | `skills/spec-doc-review/references/synthesis-and-presentation.md` | 406 | reviewed |
| 201 | C | `skills/spec-doc-review/references/walkthrough.md` | 282 | reviewed |
| 202 | C | `skills/spec-graph-bootstrap/SKILL.md` | 303 | reviewed |
| 203 | C | `skills/spec-graph-bootstrap/evals/README.md` | 15 | reviewed |
| 204 | C | `skills/spec-graph-bootstrap/evals/boundary-cases.json` | 26 | reviewed |
| 205 | C | `skills/spec-graph-bootstrap/evals/expected-behavior-cases.json` | 35 | reviewed |
| 206 | C | `skills/spec-graph-bootstrap/evals/failure-cases.json` | 33 | reviewed |
| 207 | C | `skills/spec-graph-bootstrap/evals/trigger-cases.json` | 26 | reviewed |
| 208 | C | `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1` | 1409 | reviewed |
| 209 | C | `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh` | 1460 | reviewed |
| 210 | C | `skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.ps1` | 301 | reviewed |
| 211 | C | `skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.sh` | 344 | reviewed |
| 212 | D | `skills/spec-ideate/SKILL.md` | 351 | reviewed |
| 213 | D | `skills/spec-ideate/references/post-ideation-workflow.md` | 240 | reviewed |
| 214 | D | `skills/spec-ideate/references/universal-ideation.md` | 74 | reviewed |
| 215 | D | `skills/spec-ideate/references/web-research-cache.md` | 55 | reviewed |
| 216 | D | `skills/spec-mcp-setup/SKILL.md` | 629 | reviewed |
| 217 | D | `skills/spec-mcp-setup/mcp-tools.json` | 455 | reviewed |
| 218 | D | `skills/spec-mcp-setup/references/config-template.yaml` | 12 | reviewed |
| 219 | D | `skills/spec-mcp-setup/references/supported-mcp-tools.md` | 111 | reviewed |
| 220 | D | `skills/spec-mcp-setup/scripts/activate-serena.ps1` | 376 | reviewed |
| 221 | D | `skills/spec-mcp-setup/scripts/activate-serena.sh` | 456 | reviewed |
| 222 | D | `skills/spec-mcp-setup/scripts/bootstrap-project-config.ps1` | 307 | reviewed |
| 223 | D | `skills/spec-mcp-setup/scripts/bootstrap-project-config.sh` | 350 | reviewed |
| 224 | D | `skills/spec-mcp-setup/scripts/check-deps.ps1` | 139 | reviewed |
| 225 | D | `skills/spec-mcp-setup/scripts/check-deps.sh` | 168 | reviewed |
| 226 | D | `skills/spec-mcp-setup/scripts/check-health` | 506 | reviewed |
| 227 | D | `skills/spec-mcp-setup/scripts/configure-host.ps1` | 235 | reviewed |
| 228 | D | `skills/spec-mcp-setup/scripts/configure-host.sh` | 231 | reviewed |
| 229 | D | `skills/spec-mcp-setup/scripts/detect-host.ps1` | 243 | reviewed |
| 230 | D | `skills/spec-mcp-setup/scripts/detect-host.sh` | 291 | reviewed |
| 231 | D | `skills/spec-mcp-setup/scripts/detect-tools.ps1` | 311 | reviewed |
| 232 | D | `skills/spec-mcp-setup/scripts/detect-tools.sh` | 420 | reviewed |
| 233 | D | `skills/spec-mcp-setup/scripts/install-helpers.ps1` | 573 | reviewed |
| 234 | D | `skills/spec-mcp-setup/scripts/install-helpers.sh` | 720 | reviewed |
| 235 | D | `skills/spec-mcp-setup/scripts/install-mcp.ps1` | 482 | reviewed |
| 236 | D | `skills/spec-mcp-setup/scripts/install-mcp.sh` | 622 | reviewed |
| 237 | D | `skills/spec-mcp-setup/scripts/lib-toml.ps1` | 194 | reviewed |
| 238 | D | `skills/spec-mcp-setup/scripts/lib-toml.sh` | 238 | reviewed |
| 239 | D | `skills/spec-mcp-setup/scripts/render-status-block.cjs` | 105 | reviewed |
| 240 | D | `skills/spec-mcp-setup/scripts/repair-install.ps1` | 26 | reviewed |
| 241 | D | `skills/spec-mcp-setup/scripts/repair-install.sh` | 40 | reviewed |
| 242 | D | `skills/spec-mcp-setup/scripts/resolve-project-target.ps1` | 201 | reviewed |
| 243 | D | `skills/spec-mcp-setup/scripts/resolve-project-target.sh` | 301 | reviewed |
| 244 | D | `skills/spec-mcp-setup/scripts/uninstall-mcp.ps1` | 98 | reviewed |
| 245 | D | `skills/spec-mcp-setup/scripts/uninstall-mcp.sh` | 108 | reviewed |
| 246 | D | `skills/spec-mcp-setup/scripts/verify-tools.ps1` | 614 | reviewed |
| 247 | D | `skills/spec-mcp-setup/scripts/verify-tools.sh` | 500 | reviewed |
| 248 | D | `skills/spec-mcp-setup/scripts/write-provider-config.ps1` | 836 | reviewed |
| 249 | D | `skills/spec-mcp-setup/scripts/write-provider-config.sh` | 822 | reviewed |
| 250 | D | `skills/spec-optimize/README.md` | 39 | reviewed |
| 251 | D | `skills/spec-optimize/SKILL.md` | 686 | reviewed |
| 252 | D | `skills/spec-optimize/references/example-hard-spec.yaml` | 64 | reviewed |
| 253 | D | `skills/spec-optimize/references/example-judge-spec.yaml` | 78 | reviewed |
| 254 | D | `skills/spec-optimize/references/experiment-log-schema.yaml` | 257 | reviewed |
| 255 | D | `skills/spec-optimize/references/experiment-prompt-template.md` | 89 | reviewed |
| 256 | D | `skills/spec-optimize/references/judge-prompt-template.md` | 110 | reviewed |
| 257 | D | `skills/spec-optimize/references/optimize-spec-schema.yaml` | 394 | reviewed |
| 258 | D | `skills/spec-optimize/references/usage-guide.md` | 127 | reviewed |
| 259 | D | `skills/spec-optimize/scripts/experiment-worktree.sh` | 293 | reviewed |
| 260 | D | `skills/spec-optimize/scripts/measure.sh` | 90 | reviewed |
| 261 | D | `skills/spec-optimize/scripts/parallel-probe.sh` | 127 | reviewed |
| 262 | D | `skills/spec-plan/SKILL.md` | 959 | reviewed |
| 263 | D | `skills/spec-plan/references/deepening-workflow.md` | 252 | reviewed |
| 264 | D | `skills/spec-plan/references/plan-handoff.md` | 98 | reviewed |
| 265 | D | `skills/spec-plan/references/synthesis-summary.md` | 134 | reviewed |
| 266 | D | `skills/spec-plan/references/universal-planning.md` | 114 | reviewed |
| 267 | D | `skills/spec-plan/references/visual-communication.md` | 31 | reviewed |
| 268 | D | `skills/spec-polish-beta/SKILL.md` | 91 | reviewed |
| 269 | D | `skills/spec-polish-beta/references/dev-server-astro.md` | 58 | reviewed |
| 270 | D | `skills/spec-polish-beta/references/dev-server-detection.md` | 40 | reviewed |
| 271 | D | `skills/spec-polish-beta/references/dev-server-next.md` | 62 | reviewed |
| 272 | D | `skills/spec-polish-beta/references/dev-server-nuxt.md` | 58 | reviewed |
| 273 | D | `skills/spec-polish-beta/references/dev-server-procfile.md` | 59 | reviewed |
| 274 | D | `skills/spec-polish-beta/references/dev-server-rails.md` | 50 | reviewed |
| 275 | D | `skills/spec-polish-beta/references/dev-server-remix.md` | 58 | reviewed |
| 276 | D | `skills/spec-polish-beta/references/dev-server-sveltekit.md` | 58 | reviewed |
| 277 | D | `skills/spec-polish-beta/references/dev-server-vite.md` | 48 | reviewed |
| 278 | D | `skills/spec-polish-beta/references/ide-detection.md` | 41 | reviewed |
| 279 | D | `skills/spec-polish-beta/references/launch-json-schema.md` | 176 | reviewed |
| 280 | D | `skills/spec-polish-beta/scripts/detect-project-type.sh` | 243 | reviewed |
| 281 | D | `skills/spec-polish-beta/scripts/read-launch-json.sh` | 87 | reviewed |
| 282 | D | `skills/spec-polish-beta/scripts/resolve-package-manager.sh` | 95 | reviewed |
| 283 | D | `skills/spec-polish-beta/scripts/resolve-port.sh` | 308 | reviewed |
| 284 | D | `skills/spec-release-notes/SKILL.md` | 174 | reviewed |
| 285 | D | `skills/spec-release-notes/scripts/list-spec-releases.py` | 279 | reviewed |
| 286 | D | `skills/spec-session-extract/SKILL.md` | 62 | reviewed |
| 287 | D | `skills/spec-session-extract/scripts/extract-errors.py` | 100 | reviewed |
| 288 | D | `skills/spec-session-extract/scripts/extract-skeleton.py` | 266 | reviewed |
| 289 | D | `skills/spec-session-inventory/SKILL.md` | 66 | reviewed |
| 290 | D | `skills/spec-session-inventory/scripts/discover-sessions.sh` | 66 | reviewed |
| 291 | D | `skills/spec-session-inventory/scripts/extract-metadata.py` | 251 | reviewed |
| 292 | D | `skills/spec-sessions/SKILL.md` | 31 | reviewed |
| 293 | D | `skills/retired-skill-review/SKILL.md` | 208 | reviewed |
| 294 | D | `skills/retired-skill-review/evals/audit-quality-cases.json` | 10 | reviewed |
| 295 | D | `skills/retired-skill-review/evals/boundary-review-cases.json` | 10 | reviewed |
| 296 | D | `skills/retired-skill-review/evals/security-review-cases.json` | 10 | reviewed |
| 297 | D | `skills/retired-skill-review/evals/trigger-review-cases.json` | 10 | reviewed |
| 298 | D | `skills/retired-skill-review/examples/audit-report.example.md` | 16 | reviewed |
| 299 | D | `skills/retired-skill-review/examples/dangerous-skill.example.md` | 5 | reviewed |
| 300 | D | `skills/retired-skill-review/examples/excellent-skill.example.md` | 11 | reviewed |
| 301 | D | `skills/retired-skill-review/examples/weak-skill.example.md` | 21 | reviewed |
| 302 | D | `skills/retired-skill-review/references/boundary-discipline-rubric.md` | 13 | reviewed |
| 303 | D | `skills/retired-skill-review/references/eval-readiness-rubric.md` | 12 | reviewed |
| 304 | D | `skills/retired-skill-review/references/expert-audit-rubric.md` | 75 | reviewed |
| 305 | D | `skills/retired-skill-review/references/generic-skill-review-rubric.md` | 11 | reviewed |
| 306 | D | `skills/retired-skill-review/references/report-format.md` | 69 | reviewed |
| 307 | D | `skills/retired-skill-review/references/security-threat-model.md` | 23 | reviewed |
| 308 | D | `skills/retired-skill-review/references/source-vs-runtime-contract.md` | 17 | reviewed |
| 309 | D | `skills/retired-skill-review/references/spec-first-skill-review-rubric.md` | 11 | reviewed |
| 310 | D | `skills/retired-skill-review/references/spec-first-skill-boundary-map.md` | 14 | reviewed |
| 311 | D | `skills/retired-skill-review/references/trigger-routing-rubric.md` | 16 | reviewed |
| 312 | D | `skills/retired-skill-review/scripts/audit-runtime-drift.js` | 144 | reviewed |
| 313 | D | `skills/retired-skill-review/scripts/audit-spec-first-governance.js` | 200 | reviewed |
| 314 | D | `skills/retired-skill-review/scripts/check-promise-implementation.js` | 229 | reviewed |
| 315 | D | `skills/retired-skill-review/scripts/collect-skill-facts.js` | 153 | reviewed |
| 316 | D | `skills/retired-skill-review/scripts/detect-boundary-overlap.js` | 71 | reviewed |
| 317 | D | `skills/retired-skill-review/scripts/detect-skill-layout.js` | 99 | reviewed |
| 318 | D | `skills/retired-skill-review/scripts/extract-trigger-signals.js` | 123 | reviewed |
| 319 | D | `skills/retired-skill-review/scripts/lib/finding.js` | 114 | reviewed |
| 320 | D | `skills/retired-skill-review/scripts/lib/frontmatter.js` | 61 | reviewed |
| 321 | D | `skills/retired-skill-review/scripts/lib/markdown.js` | 200 | reviewed |
| 322 | D | `skills/retired-skill-review/scripts/lib/path-rules.js` | 33 | reviewed |
| 323 | D | `skills/retired-skill-review/scripts/lib/report-writer.js` | 307 | reviewed |
| 324 | D | `skills/retired-skill-review/scripts/lib/scoring.js` | 552 | reviewed |
| 325 | D | `skills/retired-skill-review/scripts/lib/security-patterns.js` | 126 | reviewed |
| 326 | D | `skills/retired-skill-review/scripts/lib/text-signals.js` | 59 | reviewed |
| 327 | D | `skills/retired-skill-review/scripts/lint-skill-structure.js` | 181 | reviewed |
| 328 | D | `skills/retired-skill-review/scripts/parse-skill-md.js` | 94 | reviewed |
| 329 | D | `skills/retired-skill-review/scripts/scan-instruction-security.js` | 226 | reviewed |
| 330 | D | `skills/retired-skill-review/scripts/write-audit-artifacts.js` | 385 | reviewed |
| 331 | D | `skills/spec-slack-research/SKILL.md` | 41 | reviewed |
| 332 | D | `skills/spec-standards/README.md` | 70 | reviewed |
| 333 | D | `skills/spec-standards/SKILL.md` | 415 | reviewed |
| 334 | D | `skills/spec-standards/examples/glue-map.example.json` | 64 | reviewed |
| 335 | D | `skills/spec-standards/examples/graph-query-index.example.json` | 28 | reviewed |
| 336 | D | `skills/spec-standards/examples/import-lock.example.json` | 18 | reviewed |
| 337 | D | `skills/spec-standards/examples/imported-standards.example.json` | 26 | reviewed |
| 338 | D | `skills/spec-standards/examples/project-shape.example.json` | 84 | reviewed |
| 339 | D | `skills/spec-standards/examples/repo-profile-patch.example.yaml` | 13 | reviewed |
| 340 | D | `skills/spec-standards/examples/standards-candidates.example.json` | 148 | reviewed |
| 341 | D | `skills/spec-standards/examples/standards-plan.example.json` | 106 | reviewed |
| 342 | D | `skills/spec-standards/examples/standards-preview.example.md` | 64 | reviewed |
| 343 | D | `skills/spec-standards/examples/standards-sources.example.json` | 18 | reviewed |
| 344 | D | `skills/spec-standards/examples/standards-update-decision.example.json` | 30 | reviewed |
| 345 | D | `skills/spec-standards/scripts/prepare-baseline.js` | 1539 | reviewed |
| 346 | D | `skills/spec-standards/scripts/validate-artifacts.js` | 756 | reviewed |
| 347 | D | `skills/spec-update/SKILL.md` | 252 | reviewed |
| 348 | D | `skills/spec-update/scripts/currently-loaded-version.sh` | 17 | reviewed |
| 349 | D | `skills/spec-update/scripts/marketplace-name.sh` | 18 | reviewed |
| 350 | D | `skills/spec-update/scripts/upstream-version.sh` | 13 | reviewed |
| 351 | E | `skills/spec-work-beta/SKILL.md` | 502 | reviewed |
| 352 | E | `skills/spec-work-beta/references/codex-delegation-workflow.md` | 326 | reviewed |
| 353 | E | `skills/spec-work-beta/references/shipping-workflow.md` | 153 | reviewed |
| 354 | E | `skills/spec-work-beta/references/tracker-defer.md` | 149 | reviewed |
| 355 | E | `skills/spec-work/SKILL.md` | 431 | reviewed |
| 356 | E | `skills/spec-work/references/shipping-workflow.md` | 153 | reviewed |
| 357 | E | `skills/spec-work/references/tracker-defer.md` | 149 | reviewed |
| 358 | E | `skills/spec-write-tasks/SKILL.md` | 367 | reviewed |
| 359 | E | `skills/spec-write-tasks/agents/openai.yaml` | 7 | reviewed |
| 360 | E | `skills/spec-write-tasks/evals/README.md` | 16 | reviewed |
| 361 | E | `skills/spec-write-tasks/evals/boundary-cases.json` | 26 | reviewed |
| 362 | E | `skills/spec-write-tasks/evals/expected-behavior-cases.json` | 23 | reviewed |
| 363 | E | `skills/spec-write-tasks/evals/failure-cases.json` | 68 | reviewed |
| 364 | E | `skills/spec-write-tasks/evals/trigger-cases.json` | 26 | reviewed |
| 365 | E | `skills/spec-write-tasks/references/task-pack-schema.md` | 323 | reviewed |
| 366 | E | `skills/spec-write-tasks/references/task-quality-guide.md` | 233 | reviewed |
| 367 | E | `skills/test-browser/SKILL.md` | 360 | reviewed |
| 368 | E | `skills/test-xcode/SKILL.md` | 208 | reviewed |
| 369 | E | `skills/using-spec-first/SKILL.md` | 300 | reviewed |
| 370 | F | `agents/spec-adversarial-document-reviewer.agent.md` | 91 | reviewed |
| 371 | F | `agents/spec-adversarial-reviewer.agent.md` | 111 | reviewed |
| 372 | F | `agents/spec-agent-native-reviewer.agent.md` | 181 | reviewed |
| 373 | F | `agents/spec-ankane-readme-writer.agent.md` | 50 | reviewed |
| 374 | F | `agents/spec-api-contract-reviewer.agent.md` | 52 | reviewed |
| 375 | F | `agents/spec-architecture-strategist.agent.md` | 53 | reviewed |
| 376 | F | `agents/spec-best-practices-researcher.agent.md` | 118 | reviewed |
| 377 | F | `agents/spec-cli-agent-readiness-reviewer.agent.md` | 417 | reviewed |
| 378 | F | `agents/spec-cli-readiness-reviewer.agent.md` | 73 | reviewed |
| 379 | F | `agents/spec-code-simplicity-reviewer.agent.md` | 87 | reviewed |
| 380 | F | `agents/spec-coherence-reviewer.agent.md` | 57 | reviewed |
| 381 | F | `agents/spec-correctness-reviewer.agent.md` | 52 | reviewed |
| 382 | F | `agents/spec-data-integrity-guardian.agent.md` | 71 | reviewed |
| 383 | F | `agents/spec-data-migration-expert.agent.md` | 98 | reviewed |
| 384 | F | `agents/spec-data-migrations-reviewer.agent.md` | 56 | reviewed |
| 385 | F | `agents/spec-deployment-verification-agent.agent.md` | 160 | reviewed |
| 386 | F | `agents/spec-design-implementation-reviewer.agent.md` | 93 | reviewed |
| 387 | F | `agents/spec-design-iterator.agent.md` | 197 | reviewed |
| 388 | F | `agents/spec-design-lens-reviewer.agent.md` | 48 | reviewed |
| 389 | F | `agents/spec-dhh-rails-reviewer.agent.md` | 49 | reviewed |
| 390 | F | `agents/spec-feasibility-reviewer.agent.md` | 44 | reviewed |
| 391 | F | `agents/spec-figma-design-sync.agent.md` | 172 | reviewed |
| 392 | F | `agents/spec-framework-docs-researcher.agent.md` | 96 | reviewed |
| 393 | F | `agents/spec-git-history-analyzer.agent.md` | 47 | reviewed |
| 394 | F | `agents/spec-issue-intelligence-analyst.agent.md` | 212 | reviewed |
| 395 | F | `agents/spec-julik-frontend-races-reviewer.agent.md` | 52 | reviewed |
| 396 | F | `agents/spec-kieran-python-reviewer.agent.md` | 50 | reviewed |
| 397 | F | `agents/spec-kieran-rails-reviewer.agent.md` | 50 | reviewed |
| 398 | F | `agents/spec-kieran-typescript-reviewer.agent.md` | 50 | reviewed |
| 399 | F | `agents/spec-learnings-researcher.agent.md` | 254 | reviewed |
| 400 | F | `agents/spec-maintainability-reviewer.agent.md` | 52 | reviewed |
| 401 | F | `agents/spec-pattern-recognition-specialist.agent.md` | 58 | reviewed |
| 402 | F | `agents/spec-performance-oracle.agent.md` | 111 | reviewed |
| 403 | F | `agents/spec-performance-reviewer.agent.md` | 54 | reviewed |
| 404 | F | `agents/spec-pr-comment-resolver.agent.md` | 178 | reviewed |
| 405 | F | `agents/spec-previous-comments-reviewer.agent.md` | 68 | reviewed |
| 406 | F | `agents/spec-product-lens-reviewer.agent.md` | 72 | reviewed |
| 407 | F | `agents/spec-project-standards-reviewer.agent.md` | 86 | reviewed |
| 408 | F | `agents/spec-reliability-reviewer.agent.md` | 52 | reviewed |
| 409 | F | `agents/spec-repo-research-analyst.agent.md` | 259 | reviewed |
| 410 | F | `agents/spec-schema-drift-detector.agent.md` | 142 | reviewed |
| 411 | F | `agents/spec-scope-guardian-reviewer.agent.md` | 56 | reviewed |
| 412 | F | `agents/spec-security-lens-reviewer.agent.md` | 40 | reviewed |
| 413 | F | `agents/spec-security-reviewer.agent.md` | 54 | reviewed |
| 414 | F | `agents/spec-security-sentinel.agent.md` | 94 | reviewed |
| 415 | F | `agents/spec-session-historian.agent.md` | 182 | reviewed |
| 416 | F | `agents/spec-slack-researcher.agent.md` | 150 | reviewed |
| 417 | F | `agents/spec-spec-flow-analyzer.agent.md` | 87 | reviewed |
| 418 | F | `agents/spec-swift-ios-reviewer.agent.md` | 107 | reviewed |
| 419 | F | `agents/spec-testing-reviewer.agent.md` | 52 | reviewed |
| 420 | F | `agents/spec-web-researcher.agent.md` | 133 | reviewed |
| 421 | F | `docs/10-prompt/结构化项目角色契约.md` | 331 | reviewed |
| 422 | F | `src/cli/adapters/base.js` | 175 | reviewed |
| 423 | F | `src/cli/adapters/claude.js` | 358 | reviewed |
| 424 | F | `src/cli/adapters/codex.js` | 291 | reviewed |
| 425 | F | `src/cli/adapters/index.js` | 34 | reviewed |
| 426 | F | `src/cli/agents.js` | 19 | reviewed |
| 427 | F | `src/cli/changelog.js` | 71 | reviewed |
| 428 | F | `src/cli/claude-settings.js` | 300 | reviewed |
| 429 | F | `src/cli/coding-guidelines.js` | 429 | reviewed |
| 430 | F | `src/cli/commands/clean.js` | 233 | reviewed |
| 431 | F | `src/cli/commands/doctor.js` | 1080 | reviewed |
| 432 | F | `src/cli/commands/init.js` | 785 | reviewed |
| 433 | F | `src/cli/commands/tasks.js` | 223 | reviewed |
| 434 | F | `src/cli/contracts/dual-host-governance/skills-governance.json` | 468 | reviewed |
| 435 | F | `src/cli/contracts/dual-host-governance/skills-governance.schema.json` | 110 | reviewed |
| 436 | F | `src/cli/contracts/quality-gates/branch-protection-policy.json` | 54 | reviewed |
| 437 | F | `src/cli/contracts/quality-gates/branch-protection-policy.schema.json` | 73 | reviewed |
| 438 | F | `src/cli/developer.js` | 289 | reviewed |
| 439 | F | `src/cli/external-command.js` | 31 | reviewed |
| 440 | F | `src/cli/gitignore-policy.js` | 122 | reviewed |
| 441 | F | `src/cli/host-comparative-workflows.js` | 28 | reviewed |
| 442 | F | `src/cli/index.js` | 197 | reviewed |
| 443 | F | `src/cli/instruction-bootstrap.js` | 285 | reviewed |
| 444 | F | `src/cli/lang-policy.js` | 127 | reviewed |
| 445 | F | `src/cli/plugin.js` | 1271 | reviewed |
| 446 | F | `src/cli/runtime-tools-index.js` | 110 | reviewed |
| 447 | F | `src/cli/skills.js` | 29 | reviewed |
| 448 | F | `src/cli/spec-commands.js` | 12 | reviewed |
| 449 | F | `src/cli/state.js` | 632 | reviewed |
| 450 | F | `src/cli/task-pack.js` | 753 | reviewed |
| 451 | F | `src/cli/templates.js` | 14 | reviewed |
| 452 | F | `src/cli/version-reminder.js` | 551 | reviewed |
| 453 | F | `src/contracts/schema-validator.js` | 159 | reviewed |
| 454 | F | `src/verification/artifact-paths.js` | 32 | reviewed |
| 455 | F | `src/verification/quality-feedback.js` | 55 | reviewed |
| 456 | F | `templates/claude/commands/spec/app-consistency-audit.md` | 12 | reviewed |
| 457 | F | `templates/claude/commands/spec/brainstorm.md` | 12 | reviewed |
| 458 | F | `templates/claude/commands/spec/code-review.md` | 12 | reviewed |
| 459 | F | `templates/claude/commands/spec/compound-refresh.md` | 12 | reviewed |
| 460 | F | `templates/claude/commands/spec/compound.md` | 12 | reviewed |
| 461 | F | `templates/claude/commands/spec/debug.md` | 12 | reviewed |
| 462 | F | `templates/claude/commands/spec/doc-review.md` | 12 | reviewed |
| 463 | F | `templates/claude/commands/spec/graph-bootstrap.md` | 14 | reviewed |
| 464 | F | `templates/claude/commands/spec/ideate.md` | 12 | reviewed |
| 465 | F | `templates/claude/commands/spec/mcp-setup.md` | 14 | reviewed |
| 466 | F | `templates/claude/commands/spec/optimize.md` | 12 | reviewed |
| 467 | F | `templates/claude/commands/spec/plan.md` | 12 | reviewed |
| 468 | F | `templates/claude/commands/spec/polish-beta.md` | 12 | reviewed |
| 469 | F | `templates/claude/commands/spec/release-notes.md` | 12 | reviewed |
| 470 | F | `templates/claude/commands/spec/sessions.md` | 12 | reviewed |
| 471 | F | `templates/claude/commands/spec/skill-review.md` | 12 | reviewed |
| 472 | F | `templates/claude/commands/spec/slack-research.md` | 12 | reviewed |
| 473 | F | `templates/claude/commands/spec/standards.md` | 12 | reviewed |
| 474 | F | `templates/claude/commands/spec/update.md` | 12 | reviewed |
| 475 | F | `templates/claude/commands/spec/work-beta.md` | 12 | reviewed |
| 476 | F | `templates/claude/commands/spec/work.md` | 12 | reviewed |
| 477 | F | `templates/claude/hooks/session-start` | 104 | reviewed |
| 478 | F | `templates/rules/claude.md` | 73 | reviewed |
