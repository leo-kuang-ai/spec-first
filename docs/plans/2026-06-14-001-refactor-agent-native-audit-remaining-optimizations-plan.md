---
title: refactor: 收敛 agent-native 审查剩余优化项
type: refactor
status: completed
date: 2026-06-14
spec_id: 2026-06-14-001-agent-native-audit-remaining-optimizations
origin: docs/项目审查/2026-06-12-agent-native-architecture-audit-report.md
---

# refactor: 收敛 agent-native 审查剩余优化项

## Summary

本计划把 `2026-06-12-agent-native-architecture-audit-report.md` 中仍未完成或仅部分完成的优化点，按当前本地 source 重新收敛为可执行切片。W1 Eval readiness 已在 `2026-06-13-002` 计划中完成，本计划只处理剩余 XS/S/M 卫生项、legacy 收口项和条件项。

---

## Decision Brief

- **Recommended approach:** 先落 P0 的低风险确定性收敛，再处理 source/runtime 卫生和 legacy 删除；Runtime Setup alias、doctor JSON freshness、schema-validator details 保持独立或条件式，不混进快速修复。
- **Key decisions:** 以当前 source 为准，不把审查报告旧结论当 deterministic truth；所有 runtime mirror 仍由 `spec-first init` 再生，不手改 `.claude/`、`.codex/`、`.agents/skills/`。
- **Validation focus:** 每个切片配 focused contract/unit test；影响 setup 双宿主脚本的切片同时覆盖 Bash 与 PowerShell；legacy 删除必须以现有 Jest integration 覆盖承接为前提。
- **Largest risks / boundaries:** 当前工作树存在大量无关 dirty docs 变更，实施前必须重新核对 in-scope diff，避免覆盖用户改动；本计划不引入重型 eval 框架、不新增硬 gate、不把 LLM judge 变成 release blocker。

---

## Problem Frame

原审查报告已经确认 spec-first 的 agent-native 架构主线健康，真正系统性短板 W1 Eval readiness 已经落地完成。剩余问题集中在两类：

- 已明确的 XS/S 工程卫生：过期 help 文案、setup helper URL 双份维护、CI path trigger 漏接、support-file drift false positive、clean apply 前可见性不足、guardrail 文档缺 workflow 应用索引。
- 需要独立处理或保持条件式的收口项：legacy shell e2e 链仍 live-but-vestigial、Runtime Setup alias 迁移仍 deferred、doctor JSON freshness 投影和 schema-validator `details[]` 需要 consumer 证据。

本计划目标是把这些优化点拆成最小可维护落地顺序，避免把已经完成的 W1 或仍无消费者的 speculative schema 扩展重新做一遍。

---

## Requirements

- R1. 明确 W1 Eval readiness 已完成，禁止重复规划 schema/fixture/scorer 主线。
- R2. P0 修复必须是低风险、可并行、focused test 可证明的 source-only 变更。
- R3. 所有涉及 setup helper 的变更必须保持 Bash/PowerShell 对称，并从 registry 读取确定性 facts。
- R4. 所有 source/runtime 相关变更必须遵守 source-first：只改 `skills/`、`templates/`、`src/cli/`、`tests/`、`.github/`、`docs/` 等 source，不手改 generated runtime mirrors。
- R5. Legacy 删除必须先对每个承载行为分类：obsolete-by-replacement（需 positive 引用现有 agent-native workflow/artifact 承接该行为）或 still-needed（需先证明 Jest integration 覆盖承接），仅凭“缺少重复 Jest 覆盖”不足以判定 obsolete。
- R6. 条件项只有在 consumer 或明确 runtime closeout 需求存在时进入实现，不为了 schema 完整性提前扩展。
- R7. 每个实施切片必须同步 `CHANGELOG.md`，并声明是否影响用户可见行为和 runtime regeneration。

---

## Assumptions

- A1. 本次修订复核 snapshot HEAD `44339315` 上，`docs/plans/2026-06-13-002-refactor-eval-readiness-fixture-schema-plan.md` 的 `status: completed` 与 `CHANGELOG.md` 记录足以把 W1 视为已完成基线。
- A2. 当前工作树存在大量无关 docs 迁移/治理 dirty 变更；执行本计划时必须在每个切片开头重跑 `git status --short` 并只处理 in-scope 文件。
- A3. Graphify 在本轮探索中只作为 `provider_untrusted` 导航；其 query 召回偏离主题，结论不依赖 Graphify 输出。

---

## Scope Boundaries

- 不重做 W1 eval fixture schema、normalizer、readiness scorer、first-wave eval fixtures 或 fresh-source-eval cadence。
- 不新增外部 eval 平台，不接 Promptfoo/LangSmith/Braintrust/OpenAI Evals，不把 LLM judge 作为 CI hard gate。
- 不手改 generated runtime mirrors；如某切片最终需要 runtime refresh，由实现 workflow 在 source 验证后显式运行 `spec-first init`。
- 不把 `schema-validator` 的 `details[]` 当作默认工作；没有 consumer 前只记录为条件项。
- 不把 Runtime Setup alias 迁移和小文案修复混成一个隐式大迁移；alias 迁移按独立切片处理。

### Deferred to Follow-Up Work

- `schema-validator` 结构化 `details[].{keyword,instanceLocation}`：仅当 CLI/helper/review consumer 需要机器可读错误定位时启动。
- `doctor --json` 投影 `runtime_catalog_freshness`：现有 `checkManagedState` 已比较 `manifestVersion`，但 source/tests/skills 中无任何 consumer 读取该字段。遵循 R6，仅当 closeout、doctor automation 或 runtime repair guidance 确有机器可读 manifest freshness 需求时启动，不为 schema 完整性提前扩展。
- 完整 `spec-runtime-setup` / `spec-runtime-setup` alias 迁移：遵循 `docs/plans/2026-06-07-003-refactor-runtime-setup-lifecycle-plan.md` 的 U8，不作为 P0 顺手改。

---

## Completion Criteria

- P0 三项完成：`update` help 文案、`check-health` URL registry accessor、plan taxonomy CI path trigger。
- P1 完成：`plugin.js` support-file ignore set、guardrails 维度到 workflow 索引。`clean` apply 前摘要（U5）按 origin 的“可选/Observation”定性为 conditional，不作为阻塞性 must-have；未做时在 closeout 标注即可。
- P2 完成条件是 legacy shell e2e 链每个承载行为都有记录化分类和证据：`obsolete-by-replacement` 必须 positive 引用取代它的现有 workflow/artifact 后才能删除；`still-needed` 必须先补当前 Jest integration 覆盖再删除。若仍有 `still-needed` 行为缺覆盖，则该行为不得删除，必须产出 follow-up `spec_id` 承接“补 coverage + 删除”，并在 closeout 标注具体未覆盖行为。
- U8（Runtime Setup alias 文案核对）完成：确认 SKILL.md 与 mcp-setup template 当前入口只把 `mcp-setup` 呈现为可运行命令、future alias 标为 deferred；如已满足则关闭为 already-satisfied。
- 每个已实施切片都有 focused test、`CHANGELOG.md` 记录和 `git diff --check` 通过记录。
- 未实施条件项（含 doctor freshness、schema-validator details[]）在 closeout 中明确标为 deferred，并说明 consumer 或触发条件。

---

## Direct Evidence Readiness

- target_repo: `spec-first`
- evidence_sources: direct source reads, `rg`, `nl`, `sed`, `git status --short`, `CHANGELOG.md`, advisory Graphify query
- source_refs:
  - `docs/项目审查/2026-06-12-agent-native-architecture-audit-report.md`
  - `docs/plans/2026-06-13-002-refactor-eval-readiness-fixture-schema-plan.md`
  - `scripts/run-test-suite.cjs`
  - `tests/integration/e2e.sh`
  - `src/cli/plugin.js`
  - `src/cli/index.js`
  - `skills/spec-mcp-setup/scripts/check-health`
  - `skills/spec-mcp-setup/scripts/check-health.ps1`
  - `skills/spec-mcp-setup/helper-tools.json`
  - `.github/workflows/ai-dev-quality-gate.yml`
  - `tests/unit/plan-status-taxonomy.test.js`
  - `skills/agent-native-architecture/references/runtime-production-guardrails.md`
  - `src/cli/commands/clean.js`
  - `src/cli/commands/doctor.js`
  - `src/contracts/schema-validator.js`
- planning_snapshot_revision: `44339315`
- worktree_status: dirty; many unrelated docs migration/deletion changes plus existing `CHANGELOG.md` edits
- confidence: medium-high for listed source state; medium for implementation blast radius because worktree is dirty
- limitations: no tests were run during planning; Graphify query was advisory and low-signal; line numbers may drift before implementation

---

## Direct Evidence

- repo_scope: current `spec-first` checkout only
- source_reads_completed:
  - W1 completion: `CHANGELOG.md` and completed eval readiness plan confirm normalized fixtures, normalizer, scorer, focused CI and fresh-source-eval cadence landed.
  - L1: `scripts/run-test-suite.cjs:100` still runs `tests/integration/e2e.sh`; that shell e2e calls `scripts/task-manager.sh`, `scripts/stage-gate.sh`, and `scripts/review-judge.sh`.
  - L4(a): `src/cli/plugin.js` support-file integrity traverses all files under support dirs and currently has no central ignore predicate.
  - L3: root CLI help still describes `update` as check-only.
  - W5: `check-health` Bash and PowerShell still carry separate URL switch functions despite `helper-tools.json` exposing `safety.source_repo`.
  - W2: `plan-status-taxonomy.test.js` exists, but GitHub workflow path filters do not include `docs/plans/**`.
  - W6: `runtime-production-guardrails.md` lists guardrail dimensions but lacks a dimension-to-workflow application index.
  - W3: `clean` supports `--dry-run`, but apply path does not echo the same summary before mutation.
  - L4(b)(c): `doctor --json` does not project a dedicated `runtime_catalog_freshness` field.
  - W4: `schema-validator` returns `valid/errors`; current callers primarily consume `errors`, and no confirmed `details[]` consumer was found.
- source_reads_required:
  - Before implementation, re-read in-scope files after dirty worktree settles or immediately before patching.
  - For legacy deletion, inspect `tests/integration/verification-gate.integration.test.js` and `tests/integration/spec-work-closeout-producer.test.js` only as coverage evidence; obsolete classification still requires positive replacement workflow/artifact citations.
- commands_or_tools_used: `rg`, `sed`, `nl`, `git status --short`, provider-standard Graphify query via `$HOME/.local/bin/graphify`
- impact_on_plan: W1 removed from active work; remaining work split into P0/P1/P2/conditional buckets.
- key_findings: All remaining active work is XS/S except legacy deletion and optional doctor projection; no architecture redesign is needed.
- limitations: Planning evidence is bounded, not a repository-wide proof; implementation must rerun focused tests.

---

## Context & Research

### Relevant Code and Patterns

- `scripts/run-ai-dev-quality-gate.js` already centralizes a focused workflow-runtime contract suite; it is the right place to add `plan-status-taxonomy.test.js`.
- `skills/spec-mcp-setup/scripts/lib-helper-registry.sh` and `.ps1` already centralize install command display; helper project URL should follow that source-owned registry pattern.
- `src/cli/commands/clean.js` already has dry-run summary counting/output logic; apply-path visibility should factor the shared summary with mode-specific wording rather than calling dry-run output verbatim.
- `tests/unit/package-install-contracts.test.js` already treats `__pycache__` and `.pyc` as package noise; `plugin.js` runtime support traversal should align with that packaging boundary.

### Institutional Learnings

- Source/runtime boundary remains source-first: modify `skills/`, `templates/`, `src/cli/`, `docs/`, `.github/`, `tests/`; regenerate runtime only through `spec-first init` when explicitly needed.
- Scripts produce deterministic facts such as registry values, path filters, manifest versions, and test results; LLM-owned judgment remains in plan/review/closeout interpretation.

### External References

- None used for this plan. The remaining work is repo-local governance and deterministic source hygiene.

---

## Key Technical Decisions

- KTD1. Treat W1 as completed baseline, not active work: the completed plan and changelog evidence show the eval fixture contract, normalizer, scorer, first-wave fixtures and focused gate already landed.
- KTD2. Bundle P0 as one small source-only PR: help text, helper URL accessor and CI trigger are low-risk, independent, and cheap to verify.
- KTD3. Keep setup helper facts registry-owned: `check-health` should read `helper-tools.json` through shared Bash/PowerShell accessors rather than duplicating URL switch tables.
- KTD4. Keep mutation visibility preview-first but not prompt-heavy: `clean` should echo summary before apply, without adding a hard confirmation prompt or `--force` branch.
- KTD5. Keep guardrail guidance provider-neutral: the new index should map dimensions to spec-first workflows and source refs, not to provider-specific field names.
- KTD6. Delete legacy shell e2e as a separate slice: the old chain is live in the runner, so deletion must be paired with a per-behavior classification — obsolete-by-replacement (cite the superseding workflow/artifact) or still-needed (confirm Jest coverage) — not with a blanket coverage-confirmation assumption.
- KTD7. Leave speculative validator details deferred: expanding validation output without a consumer adds contract surface without improving current workflow behavior.

---

## Open Questions

### Resolved During Planning

- Is W1 still pending? No. Current source/changelog evidence marks it completed.
- Is L1 dead code? No. It is live because `run-test-suite.cjs` still runs `tests/integration/e2e.sh`.
- Does `clean` need a hard confirmation gate? No. Current project guardrail posture allows reversible managed runtime cleanup; the gap is summary visibility.

### Deferred to Implementation

- Exact CI workflow path placement for `docs/plans/**`: decide in implementation whether it belongs only in `ai-dev-quality-gate.yml` or also in another workflow after checking current CI cost.
- Exact `plugin.js` ignore predicate placement: choose the smallest shared helper that covers integrity and copy traversal without changing unrelated package filtering behavior.
- Runtime Setup alias scope: decide in the alias slice whether to do prose-only deferral cleanup or full host command alias delivery.

---

## Implementation Units

### U1. 修正 update help 文案

**Goal:** 让 CLI root help 与 `spec-first update` 当前真实升级行为一致。

**Requirements:** R2, R7

**Dependencies:** None

**Files:**
- Modify: `src/cli/index.js`
- Test: `tests/unit/cli-entry-contracts.test.js` or `tests/unit/update-contracts.test.js`
- Modify: `CHANGELOG.md`

**Approach:**
- 删除 `check-only; never auto-upgrades` 措辞。
- 删除 root help 行中的 `[--claude|--codex]` 参数标注——这些旧 check-only flag 已被 `src/cli/commands/update.js` 视为用法错误（传参即 exit 2），与当前真实行为不符。
- 明确 `update` 会升级 CLI，并提醒用户之后运行 `spec-first init` 刷新项目 runtime assets。

**Patterns to follow:**
- `src/cli/commands/update.js` 的 help 和 success 输出。
- `tests/unit/update-contracts.test.js` 对 update 行为的 focused 契约。

**Test scenarios:**
- Happy path: root help includes upgrade wording for `update`.
- Error path: root help no longer contains `check-only`、`never auto-upgrades` 或 `[--claude|--codex]` 标注。

**Verification:**
- Focused CLI help/update contract tests pass.

---

### U2. 将 check-health helper URL 收敛到 registry

**Goal:** 消除 Bash/PowerShell 两套 hardcoded project URL switch，统一读取 `helper-tools.json`。

**Requirements:** R2, R3, R7

**Dependencies:** None

**Files:**
- Modify: `skills/spec-mcp-setup/scripts/lib-helper-registry.sh`
- Modify: `skills/spec-mcp-setup/scripts/lib-helper-registry.ps1`
- Modify: `skills/spec-mcp-setup/scripts/check-health`
- Modify: `skills/spec-mcp-setup/scripts/check-health.ps1`
- Test: `tests/unit/dependency-readiness-baseline.test.js`
- Test: `tests/unit/mcp-setup-powershell-contracts.test.js`
- Modify: `CHANGELOG.md`

**Approach:**
- 增加 Bash `helper_registry_source_repo <id>` 和 PowerShell `Get-HelperSourceRepo`。
- `check-health` 两端通过 accessor 读取 `safety.source_repo`。
- 保留 `agent-browser` 的 opt-in install/action 特殊语义，只去掉 URL 双份维护。

**Patterns to follow:**
- 现有 `helper_registry_install_command_display` / `Get-HelperInstallCommandDisplay` 的共享 accessors。
- `helper-tools.json` 的 `safety.source_repo` 字段。

**Test scenarios:**
- Happy path: `gh`、`jq`、`ast-grep` health output URL 来自 registry。
- Invariant: contract 断言每个 `helper-tools.json` 条目都带非空 `safety.source_repo`（当前 8 个 helper 全部具备），而非测试不可达的缺失态。
- Integration: Bash 与 PowerShell contract 都断言没有重复 switch 表。

**Verification:**
- `npm run test:mcp-setup` pass。

---

### U3. 将 plan status taxonomy 接入 CI path trigger

**Goal:** 让 `docs/plans/**` 变更能够触发现有 plan status taxonomy 检查。

**Requirements:** R2, R7

**Dependencies:** None

**Files:**
- Modify: `.github/workflows/ai-dev-quality-gate.yml`
- Modify: `scripts/run-ai-dev-quality-gate.js`
- Test: `tests/unit/ai-dev-quality-gate.test.js`
- Existing test: `tests/unit/plan-status-taxonomy.test.js`
- Modify: `CHANGELOG.md`

**Approach:**
- 把 `tests/unit/plan-status-taxonomy.test.js` 加入 `WORKFLOW_RUNTIME_CONTRACT_TESTS`。
- 同一原子提交内同步更新 `tests/unit/ai-dev-quality-gate.test.js` 中对 `WORKFLOW_RUNTIME_CONTRACT_TESTS` 的 `toEqual` 精确快照（约 L187）与遍历断言（约 L227，断言每个条目都出现在 workflow YAML path filter 中）；否则 gate 自身测试会失败。
- 在 GitHub workflow paths 中加入 `docs/plans/**` 和该测试文件。
- 不新增 plan archive/schema，不改变 plan status taxonomy 本身。

**Patterns to follow:**
- `scripts/run-ai-dev-quality-gate.js` 的 focused Jest suite 列表。
- `.github/workflows/ai-dev-quality-gate.yml` 当前 path filter 风格。

**Test scenarios:**
- Happy path: quality gate suite includes `plan-status-taxonomy.test.js`.
- Integration: workflow path filter includes `docs/plans/**` and the taxonomy test file.

**Verification:**
- `npm run test:ai-dev:gate` pass。

---

### U4. 给 plugin support-file traversal 加 ignore set

**Goal:** 避免 `__pycache__`、`.pyc`、`.DS_Store` 等本地/构建噪音造成 runtime drift false positive。

**Requirements:** R4, R7

**Dependencies:** None

**Files:**
- Modify: `src/cli/plugin.js`
- Test: `tests/unit/skill-audit-scripts.test.js` or a focused plugin/runtime integrity test
- Modify: `CHANGELOG.md`

**Approach:**
- 在 `plugin.js` 中增加 ignore predicate，覆盖 `__pycache__/`、`.pyc`、`.pyo`、`.DS_Store` 等既有 package 忽略噪音。
- 优先内联在 `listDirectoryFiles`；只有当 integrity 与 copy/list 确有第二处调用方时再提升为共享 predicate，避免单调用点的过早抽象。
- 不忽略真正 source support files，不扩大到任意 dotfile。

**Patterns to follow:**
- `tests/unit/package-install-contracts.test.js` 对 Python bytecode/package noise 的边界。
- `src/cli/plugin.js` 中现有 `listDirectoryFiles` 与 integrity issue 输出风格。

**Test scenarios:**
- Happy path: 正常 support text/binary 文件仍参与 integrity 比较。
- Edge case: `scripts/__pycache__/tool.pyc` 不产生 `missing_file` 或 `content_mismatch`。
- Error path: 非忽略的 support file drift 仍然被报告。

**Verification:**
- Focused runtime drift/plugin integrity tests pass。

---

### U5. clean apply 前打印摘要

**Goal:** 让 `spec-first clean --claude|--codex` 在 apply 前显示与 dry-run 一致的高价值摘要。

**Requirements:** R4, R7

**Dependencies:** None

**Files:**
- Modify: `src/cli/commands/clean.js`
- Test: `tests/unit/clean-dry-run.test.js`
- Modify: `CHANGELOG.md`

**Approach:**
- 抽出 `printCleanSummary(platform, cleanPlan, { mode })` 共享 helper：承载 remove/update/empty-root 统计与 “Custom assets … left/would remain untouched” 行；`mode: 'dry-run'` 用 “Would remove/update …” 措辞并保留 `No files were changed.` footer，`mode: 'apply'` 用 “Removing/Updating …” 措辞且不打印 dry-run footer。注意：现有 `printCleanDryRun` 以 `console.log('No files were changed.')` 结尾且通篇用 “Would …” 措辞，直接在 apply path 调用会在删除前输出与实际相反的内容，故必须按 mode 分流而非原样复用。
- apply path 在 `applyOperationPlan` 前调用 `printCleanSummary(..., { mode: 'apply' })`；dry-run path 改调 `printCleanSummary(..., { mode: 'dry-run' })`。
- 保持当前 auto-apply 行为，不新增 prompt、不新增 `--force`。
- 保留 “Custom assets outside the spec-first managed set were left untouched” 语义。

**Patterns to follow:**
- `printCleanDryRun` 分支中的 remove/update/empty-root 统计逻辑，重构后需通过 mode-specific printer 复用。
- `init --dry-run` preview-first 但不强塞确认的输出风格。

**Test scenarios:**
- Happy path: apply stdout 在删除前包含 remove/update summary。
- Regression: dry-run path 仍输出 `No files were changed.`（`clean-dry-run.test.js:99` 断言不变），apply path 不输出该 footer、不出现 “Would …” 措辞。
- Edge case: custom assets remain untouched 的承诺仍在 apply 输出中出现。
- Regression: `--dry-run` 仍不改文件，apply 仍删除 managed assets。

**Verification:**
- `tests/unit/clean-dry-run.test.js` focused pass。

---

### U6. 增加 production guardrails 维度到 workflow 索引

**Goal:** 让 `runtime-production-guardrails.md` 从维度清单升级为可消费的 workflow 应用索引。

**Requirements:** R4, R7

**Dependencies:** None

**Files:**
- Modify: `skills/agent-native-architecture/references/runtime-production-guardrails.md`
- Test: `tests/unit/agent-native-architecture-contracts.test.js`
- Modify: `CHANGELOG.md`

**Approach:**
- 在文档末尾追加“Dimension to workflow application index”。
- 映射维度到 `spec-plan`、`spec-work`、`spec-code-review`、`spec-mcp-setup`、`spec-skill-audit` 等真实消费点。
- 明确 `External facts and social sources` 是否进入测试锚点；建议纳入索引断言，避免未来又被误数。

**Patterns to follow:**
- 现有 guardrails 维度标题。
- `tests/unit/agent-native-architecture-contracts.test.js` 的 discoverability contract。

**Test scenarios:**
- Happy path: 每个关键 guardrail dimension 都有至少一个 workflow application row。
- Edge case: external/social facts 行存在，且标为 advisory evidence pressure，不是 confirmed source truth。
- Regression: 文档仍不出现 provider-specific contract fields 或 “comprehensive security” 过度承诺。

**Verification:**
- Focused agent-native architecture contracts pass。

---

### U7. 删除 legacy shell e2e 链

**Goal:** 移除 live-but-vestigial 的旧五步 shell 流程，避免继续维护过时 workflow 语义。

**Requirements:** R5, R7

**Dependencies:** U1-U6 可并行；实施前必须先完成 Step-0 行为分类（而非笼统“确认 replacement coverage”）。

**Files:**
- Modify: `scripts/run-test-suite.cjs`
- Delete: `tests/integration/e2e.sh`
- Delete: `scripts/task-manager.sh`
- Delete: `scripts/stage-gate.sh`
- Delete: `scripts/review-judge.sh`
- Inspect/Test: `tests/integration/verification-gate.integration.test.js`
- Inspect/Test: `tests/integration/spec-work-closeout-producer.test.js`
- Modify: `CHANGELOG.md`

**Approach:**
- Step 0 — 行为分类：对旧 chain 承载的每个行为（`task.yaml` 生命周期、`stage-gate.sh` 逐阶段门、`review-judge.sh` 评分）判定属于 (a) obsolete-by-replacement，还是 (b) still-needed。已验证 `verification-gate.integration.test.js`（gate runner + workflow YAML）与 `spec-work-closeout-producer.test.js`（`spec-work-run-artifact write` 命令/schema）均不复刻上述三类语义——但“缺少重复覆盖”只是必要条件，不足以判定 (a)。判 (a) 必须 positive 引用承接该行为的现有 agent-native workflow/artifact（点名取代 task.yaml 生命周期、阶段门、review 评分的具体命令/测试）；无法给出该引用的行为按 (b) 处理。
- 对 (a) 类行为以 obsolescence 为由删除，不为复刻死行为而补测试，但必须在 closeout 记录每个 (a) 行为的承接 artifact，使删除理由可审计（与保留路径要求的 follow-up `spec_id` + 未覆盖行为说明对称）。
- 仅对 (b) 类行为先补 Jest integration 再删除。
- 从 `runIntegration()` 删除 `runBash('tests/integration/e2e.sh')`。
- 删除旧 shell 脚本和 e2e 文件。

**Patterns to follow:**
- `scripts/run-test-suite.cjs` 中 Jest integration 先于 shell integration 的当前结构。
- closeout artifact / verification gate integration 的 deterministic evidence 风格。

**Test scenarios:**
- Happy path: `npm run test:integration` 不再调用 legacy shell e2e，仍验证 closeout producer 和 verification gate。
- Error path: 删除后仓内 `rg` 不再发现 `task-manager.sh`、`stage-gate.sh`、`review-judge.sh` 的 active references。
- Integration: 如果补 coverage，新测试证明旧 e2e 唯一承载的行为已被当前 workflow artifacts 取代。

**Verification:**
- `npm run test:integration` pass。

---

### U8. 核对 Runtime Setup alias 迁移文案（多为已满足）

**Goal:** 确认当前 source prose 未把“未来入口 `spec-runtime-setup`”呈现为可运行命令；如已正确收口则关闭为 already-satisfied，否则做最小一句修正。

**Requirements:** R4, R6, R7

**Dependencies:** 与 `docs/plans/2026-06-07-003-refactor-runtime-setup-lifecycle-plan.md` 的 B5/U8 deferred 决策同源；非 `None`，属对该已 deferred cosmetic 切片的核对，不重启 alias 迁移。

**Files:**
- Inspect: `skills/spec-mcp-setup/SKILL.md`
- Inspect: `templates/claude/commands/spec/mcp-setup.md`
- Inspect: `docs/plans/2026-06-07-003-refactor-runtime-setup-lifecycle-plan.md`
- Conditional Modify: `skills/spec-mcp-setup/SKILL.md` only if drift is found
- Conditional Modify: `templates/claude/commands/spec/mcp-setup.md` only if drift is found
- Conditional Test: relevant setup prose/contract test only if source is modified or an existing contract must be updated
- Conditional Modify: `CHANGELOG.md` only when this slice changes source; already-satisfied closeout alone does not require a changelog entry.

**Approach:**
- 先核对 source 现状：`skills/spec-mcp-setup/SKILL.md`（L9 已写明 `spec-mcp-setup` / `spec-mcp-setup` 为 compatibility names，直至 alias contract 落地）与 `templates/claude/commands/spec/mcp-setup.md`（L8/L10 已标注 legacy compatibility entrypoint、future `spec-runtime-setup`）均已带 deferred-alias 语义。若核对通过，本切片关闭为 already-satisfied，仅留 closeout 说明，不为“未改 source”的核对结果单独写 changelog。
- 仅当发现某处 prose 仍把 future alias 当作当前可运行命令时，做最小一句修正，指向既有 2026-06-07-003 U8 计划。
- 不新增 host command，不改 runtime generation，不刷新 generated runtime mirrors；如最终触及 template 文案改动，需显式记录 runtime drift 并由实现 workflow 运行 `spec-first init`。

**Patterns to follow:**
- `using-spec-first` route map 当前 setup entrypoint 口径。
- `docs/plans/2026-06-07-003-refactor-runtime-setup-lifecycle-plan.md` U8 deferred boundary。

**Test scenarios:**
- Happy path: setup skill/template 当前入口只推荐 `mcp-setup`。
- Edge case: future alias 被标为 deferred，不被呈现为可运行命令。
- Regression: route map / setup guidance 仍能找到 current host entrypoint。

**Verification:**
- Focused setup prose/contract tests pass。

---

## System-Wide Impact

- **CLI surface:** U1 and U5 affect user-visible CLI output only; no new commands or flags.
- **Runtime generation:** U4 may affect runtime drift/asset inspection, but source remains `src/cli/plugin.js`; runtime mirrors are not edited directly.
- **Setup scripts:** U2 touches Bash and PowerShell setup health scripts; must preserve dual-host parity.
- **CI:** U3 changes GitHub Actions path filters and quality gate test list; monitor CI duration but expected cost is small.
- **Workflow governance:** U6 and U8 are prose/contract governance changes; they affect how workflows consume guardrail/setup guidance.
- **Integration coverage:** U7 changes test topology by removing a shell integration chain; coverage/obsolescence classification must be explicit.
- **Unchanged invariants:** Public workflow entrypoint governance, source/runtime boundary, eval light-contract posture, and generated runtime exclusion remain unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Dirty worktree causes accidental overwrite | Re-run `git status --short` before each patch; only edit listed files; inspect in-scope diffs if already modified |
| Registry URL accessor changes setup output unexpectedly | Add Bash and PowerShell focused assertions against `helper-tools.json` values |
| Legacy shell deletion removes hidden coverage | Inspect current integration tests first; add Jest coverage before deletion if needed |
| Guardrail index becomes another stale table | Keep rows tied to existing workflow names and test only load-bearing mappings |
| Doctor JSON freshness becomes premature schema surface | Implement the doctor freshness conditional item only with clear consumer or explicit acceptance; otherwise keep deferred |
| Runtime Setup alias prose implies unavailable commands | Keep current `mcp-setup` as runnable entrypoint and mark alias as deferred |

---

## Documentation / Operational Notes

- Each source change requires `CHANGELOG.md` entry using the current v1.10.0 format.
- User-visible CLI/help/setup output changes should include `(user-visible)` in changelog.
- Runtime mirrors are not part of this plan's source edits. If implementation later requires refresh, run `spec-first init` explicitly and record it.
- No README update is required unless a change alters documented user-facing command behavior beyond help/prose.

---

## Alternative Approaches Considered

- **Do everything in one large cleanup PR:** Rejected. The changes are independent and current worktree is dirty; large mixed diffs would make review and rollback harder.
- **Drop all conditional items now:** Rejected. `doctor --json` freshness has plausible automation value, but `schema-validator details[]` lacks a confirmed consumer; preserving them as conditional avoids speculative contract expansion.
- **Full Runtime Setup alias migration in P0:** Rejected. Alias delivery affects host command generation and public entrypoint governance; it should follow the existing U8 plan rather than be hidden inside a cleanup batch.

---

## Phased Delivery

### Phase 1: P0 deterministic hygiene

- U1: update help text.
- U2: registry-owned helper URLs.
- U3: plan taxonomy CI trigger.

### Phase 2: P1 source/runtime visibility

- U4: plugin support-file ignore set.
- U5: clean apply summary.
- U6: guardrails workflow index.

### Phase 3: P2 retirement and deferred surfaces

- U7: legacy shell e2e chain deletion after coverage/obsolescence classification.
- U8: Runtime Setup alias prose 核对（多为 already-satisfied）或最小一句修正。
- 条件项 doctor JSON freshness 与 schema-validator details[] 留在 Deferred to Follow-Up Work，仅在 consumer/owner 确认价值后单独启动。

## Completion Evidence

- Implementation scope: U1-U7 completed; U8 required one additional current-entrypoint `doctor --help` prose correction. `doctor --json` freshness and `schema-validator details[]` remain deferred until a confirmed consumer exists.
- Legacy classification: `task-manager.sh` task.yaml lifecycle is obsolete-by-replacement through source plan/task-pack artifacts and spec-work run artifacts; `stage-gate.sh` phase gating is replaced by verification profile/run-summary/honest-closeout helpers plus Jest integration coverage; `review-judge.sh` shell scoring is replaced by `spec-code-review` confidence-gated findings, reviewer synthesis, and review contracts.
- Verification: focused Jest suites, `npm run test:mcp-setup`, `npm run test:integration`, `npm run typecheck`, `npm run test:ai-dev:gate`, `npm run test:unit`, `npm run test:smoke`, `npm run build`, `npm run sync:instructions`, and `git diff --check` passed.
- Review: `spec-code-review` ran as single-agent report-only fallback because Codex reviewer dispatch/subagents were not explicitly authorized; one P3 test cleanup guard was fixed and re-verified with focused Jest.
- Runtime impact: source-only changes; generated runtime mirrors were not edited and `spec-first init` was not run.

---

## Sources & References

- Origin review: `docs/项目审查/2026-06-12-agent-native-architecture-audit-report.md`
- Completed W1 plan: `docs/plans/2026-06-13-002-refactor-eval-readiness-fixture-schema-plan.md`
- Runtime Setup lifecycle plan: `docs/plans/2026-06-07-003-refactor-runtime-setup-lifecycle-plan.md`
- Role contract: `docs/10-prompt/结构化项目角色契约.md`
- CLI runner: `scripts/run-test-suite.cjs`
- Legacy e2e: `tests/integration/e2e.sh`
- Runtime delivery: `src/cli/plugin.js`
- CLI help: `src/cli/index.js`
- Setup health scripts: `skills/spec-mcp-setup/scripts/check-health`, `skills/spec-mcp-setup/scripts/check-health.ps1`
- Helper registry: `skills/spec-mcp-setup/helper-tools.json`
- Quality gate workflow: `.github/workflows/ai-dev-quality-gate.yml`
- Guardrails reference: `skills/agent-native-architecture/references/runtime-production-guardrails.md`
- Clean command: `src/cli/commands/clean.js`
- Doctor command: `src/cli/commands/doctor.js`
- Schema validator: `src/contracts/schema-validator.js`
