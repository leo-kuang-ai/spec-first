# 2026-05-03 spec-app-consistency-audit 50 轮执行记录

## 执行边界

- 角色：Spec-First Evolution Architect。
- 工作区：新建 worktree `/Users/kuang/xiaobu/spec-first-app-consistency-2026-05-03-loop`，分支 `audit/app-consistency-2026-05-03-loop`。
- workflow 入口判断：按 `$spec-work` 执行姿势推进，使用 `spec-app-consistency-audit` skill 的静态优先、证据优先和 source/runtime 边界。
- source-of-truth：`skills/spec-app-consistency-audit/**`、`tests/unit/spec-app-consistency-audit-*.test.js`、`CHANGELOG.md`、本记录文件。
- generated runtime 边界：未手改 `.claude/`、`.codex/`、`.agents/skills/`。
- baseline：`npx jest tests/unit/spec-app-consistency-audit-*.test.js --runInBand` 初始通过，17 suites / 87 tests。

## 修复总览

本轮围绕 app-audit 的 contract spine、issue protocol、industry lens、metadata lifecycle、headless envelope 和安全脱敏做小步修订。修复原则是：脚本只产出可验证事实与确定性门禁，LLM 专家仍负责语义判断；显式 lens 不等于 confirmed truth；部分扫描、缺失输入和 degraded scope 不得伪装成完整通过。

## 50 轮小步审查与修订

### 第 01 轮：角色契约与 workflow 边界

- 问题描述：任务涉及 spec-first 自演化与治理判断，必须先校准角色契约，避免把 app-audit 变成强状态机或脚本化专家系统。
- 具体修复细节：读取 `docs/10-prompt/结构化项目角色契约.md` 与 `skills/spec-app-consistency-audit/SKILL.md`，确认 Light contract、Explicit boundaries、Scripts prepare / LLM decides。
- 修复结论：无需代码修订；本轮确定后续只修 deterministic facts、schema/validator 与文档契约漂移。
- 修复效果：后续修改均保持 source-first，不手改 generated runtime。

### 第 02 轮：隔离 worktree

- 问题描述：主 worktree 已有未提交改动，直接修改会污染用户当前工作区。
- 具体修复细节：从当前 `HEAD` 新建 `/Users/kuang/xiaobu/spec-first-app-consistency-2026-05-03-loop`。
- 修复结论：无需修代码；后续全部修改在新 worktree 内完成。
- 修复效果：主工作区未被本轮任务改动。

### 第 03 轮：app-audit baseline

- 问题描述：改动前需要确认 app-audit 当前测试基线。
- 具体修复细节：运行 `npx jest tests/unit/spec-app-consistency-audit-*.test.js --runInBand`。
- 修复结论：baseline 通过，17 suites / 87 tests。
- 修复效果：后续失败可归因于本轮修改。

### 第 04 轮：脚本语法基线

- 问题描述：app-audit 脚本是 deterministic helper，必须保证 CommonJS 入口可解析。
- 具体修复细节：运行 `node --check` 覆盖 `skills/spec-app-consistency-audit/scripts/**/*.js`。
- 修复结论：无需代码修订；语法基线通过。
- 修复效果：后续修改继续以 `node --check` 收口。

### 第 05 轮：preflight scan truncation freshness

- 问题描述：`scanSourceTree()` 在 `maxScanFiles` 截断时仍可能输出 `source_hash` 与 `freshness: current-worktree`，把部分扫描误写成完整当前工作树证据。
- 具体修复细节：修改 `skills/spec-app-consistency-audit/scripts/preflight.js`，截断时将 `source_hash` 置空并写 `source_hash_unavailable_reason: file_scan_truncated`；新增 preflight 回归测试。
- 修复结论：已修复。
- 修复效果：部分扫描只产生 partial-worktree 事实，不再伪造完整 source hash。

### 第 06 轮：explicit source unreadable fallback

- 问题描述：显式 `source:<path>` 不存在时，preflight 会降级但仍把 repo root hash 写成 `code` source input，容易让消费者误以为指定 source 已被审查。
- 具体修复细节：`runPreflight()` 在 `sourceResolution.ok === false` 时只输出 unavailable code source input，不复用 fallback repo root hash；新增缺失 source 测试。
- 修复结论：已修复。
- 修复效果：结构信号仍可用 fallback repo root 探测，但 source evidence 不再混淆。

### 第 07 轮：issue static confirmation normalization

- 问题描述：`normalizeIssue()` 会保留输入中自带的 `static_confirmed: true`，即使 `contract_status` 是 `candidate`。
- 具体修复细节：在 `merge-contracts.js` 中强制 `confirmed -> static_confirmed true`，`candidate/rejected -> static_confirmed false`；新增 evidence gate 测试。
- 修复结论：已修复。
- 修复效果：候选 issue 无法伪装成静态确认。

### 第 08 轮：validator issue status consistency

- 问题描述：即使报告中出现 `contract_status` 与 `static_confirmed` 不一致，validator 原本不会拒绝。
- 具体修复细节：在 `validateAuditIssue()` 增加 `static_confirmed_contract_status_mismatch` 校验；新增 report/issues artifact 回归测试。
- 修复结论：已修复。
- 修复效果：下游 artifact consumer 可确定 issue 状态语义一致。

### 第 09 轮：issue schema 与 validator 对齐

- 问题描述：JSON schema 未表达 status/static_confirmed 关系，也未要求 evidence/provenance 具备 traceable field。
- 具体修复细节：更新 `issue.schema.json` 与 `audit-report.schema.json`，加入 `allOf` 状态约束和 evidence entry `anyOf` traceable field；更新 schema contract 测试。
- 修复结论：已修复。
- 修复效果：schema 与 validator 不再分裂，downstream 可用 schema 捕获同类漂移。

### 第 10 轮：industry lens 与 confirmed profile 边界

- 问题描述：`selectRulePacks()` 把 `industry:<name>` 显式 lens 当作 confirmed 行业，设置 `advisory_only:false`。
- 具体修复细节：仅 `confirmedIndustry` 让行业规则包 `advisory_only:false`；`industry:<name>` 只作为 advisory lens；更新 rule-pack 测试。
- 修复结论：已修复。
- 修复效果：行业规则包不会因 lens 参数被误当成 confirmed truth。

### 第 11 轮：impact facts 行业候选边界

- 问题描述：`build-impact-facts.js` 中显式 `industry` 会让 `industry_term_candidate.advisory_only` 变成 false。
- 具体修复细节：`inferIndustrySignal()` 区分 `industry` 与 `confirmedIndustry`；新增 CLI e2e 断言。
- 修复结论：已修复。
- 修复效果：impact facts 保持 candidate/advisory 语义，只有 confirmed industry 才解除 advisory。

### 第 12 轮：coverage capability confirmedIndustry 漂移

- 问题描述：`coverage_capabilities.industry` 只识别 `industry`，不识别 `confirmedIndustry`。
- 具体修复细节：更新 `buildAppAuditCoverageCapabilities()`，confirmed industry 输出 `confirmed_profile`；补 CLI e2e 断言。
- 修复结论：已修复。
- 修复效果：metadata/impact facts 的 coverage 与 confirmed industry 输入一致。

### 第 13 轮：SKILL issue protocol 必填字段缺口

- 问题描述：`SKILL.md` 的 “Every issue must include” 列表漏掉 `evidence`、`impact`、`recommendation`、`related_rule_packs`、`runtime_verification`、`data_sensitivity`。
- 具体修复细节：补齐 issue protocol prose，增加 static_confirmed/status、traceable evidence、industry lens 边界说明；更新 entry contract 测试。
- 修复结论：已修复。
- 修复效果：source prose、schema、validator 三者一致。

### 第 14 轮：headless degraded no-issue verdict

- 问题描述：`renderHeadlessEnvelope()` 在有 degraded modes 但无 issues/rejected 时输出 `Verdict: Ready`，违反 no-evidence 不能写成 pass。
- 具体修复细节：新增 `collectDegradedModes()`，`buildVerdict()` 对 degraded no-issue run 输出 `No issues in scoped audit`；补报告测试。
- 修复结论：已修复。
- 修复效果：headless 父 workflow 不会把 scope-limited clean run 误读为完整 ready。

### 第 15 轮：裸 Bearer token 脱敏

- 问题描述：validator 会拒绝裸 `Bearer ...`，但 redactor 只处理 `Authorization: Bearer ...`，可能在报告生成阶段泄漏后再被校验拦截。
- 具体修复细节：`redactForArtifactText()` 增加裸 `Bearer` 脱敏；更新 report 测试。
- 修复结论：已修复。
- 修复效果：报告生成路径先脱敏再校验，降低敏感文本进入 artifact 的概率。

### 第 16 轮：metadata lifecycle schema

- 问题描述：`metadata.json` 运行状态是 core contract，但 schema/validator 未要求 `status`、`status_reason_codes`、`started_at`。
- 具体修复细节：更新 `metadata.schema.json` 与 `validateKnownContractArtifact()`；新增 metadata lifecycle validator 测试。
- 修复结论：已修复。
- 修复效果：latest-summary 消费前可更可靠地校验 run freshness 与 lifecycle。

### 第 17 轮：mode conflict contract

- 问题描述：多 mode token 必须无条件失败，避免 headless/report-only 混用。
- 具体修复细节：检查 `parseCommonArgs()` 的 `modeTokens` 逻辑和 entry 测试覆盖。
- 修复结论：无需修订；现有实现已拒绝重复或冲突 mode。
- 修复效果：保留现状。

### 第 18 轮：report-only no-write

- 问题描述：report-only 不能写 artifact、metadata、manifest 或 output。
- 具体修复细节：检查公共 writer、preflight、metadata、manifest、audit-context 的 no-write 测试。
- 修复结论：无需修订；现有测试覆盖通过。
- 修复效果：保留现状。

### 第 19 轮：Figma reference-only 降级

- 问题描述：`figma-ref` 不能被当作 materialized design evidence。
- 具体修复细节：检查 `buildFigmaReference()`、preflight `figma_context_mode`、Figma redaction tests。
- 修复结论：无需修订；reference-only 与 materialized JSON 已区分。
- 修复效果：保留现状。

### 第 20 轮：Figma internal redaction

- 问题描述：Figma raw labels/text 可能包含 URL、token、cookie。
- 具体修复细节：检查 `extract-figma-contract.js`、validator redaction 和测试。
- 修复结论：无需修订；本轮新增裸 Bearer 脱敏已覆盖通用文本路径。
- 修复效果：Figma 与报告脱敏策略保持一致。

### 第 21 轮：source/runtime boundary

- 问题描述：app-audit source 与 generated runtime 容易混淆。
- 具体修复细节：检查 `SKILL.md`、entry contract、runtime sync 测试。
- 修复结论：无需修订；当前 source path 使用 `skills/spec-app-consistency-audit/**`，未手改 runtime。
- 修复效果：source-first 边界保持清晰。

### 第 22 轮：Claude/Codex delivery boundary

- 问题描述：Claude command 与 Codex skill 投递边界必须一致。
- 具体修复细节：检查 dual-host governance 与 `spec-app-consistency-audit-entry.test.js`。
- 修复结论：无需修订。
- 修复效果：Claude command + workflow skill、Codex workflow skill 的投递契约仍由 source 生成。

### 第 23 轮：rule-pack asset path safety

- 问题描述：行业 rule pack 名称可能被路径注入。
- 具体修复细节：检查 `rulePackPath()` 白名单和 unknown/path-like industry 测试。
- 修复结论：无需修订。
- 修复效果：路径注入仍被 degraded，而不是选中外部文件。

### 第 24 轮：rule-pack evidence policy

- 问题描述：rule pack 不能作为 confirmed issue 唯一 evidence。
- 具体修复细节：检查 rule pack YAML、Evidence Gate 与 tests。
- 修复结论：无需修订；第 10-12 轮进一步收紧行业 advisory 边界。
- 修复效果：rule-pack-only confirmed issue 会被拒绝或降级。

### 第 25 轮：claim_family 证据矩阵

- 问题描述：不同 claim_family 需要不同项目证据组合。
- 具体修复细节：检查 `CLAIM_FAMILY_REQUIREMENTS` 与 evidence gate 测试。
- 修复结论：无需修订。
- 修复效果：设计、产品、架构、analytics、i18n、industry 的 conclusion cap 仍由 gate 控制。

### 第 26 轮：confidence threshold

- 问题描述：低置信 confirmed issue 不能保持 confirmed。
- 具体修复细节：检查 `CONFIRMED_CONFIDENCE_THRESHOLD` 与 evidence tests。
- 修复结论：无需修订。
- 修复效果：`confidence < 0.75` 的 confirmed issue 会被降级为 candidate。

### 第 27 轮：rejected issue preservation

- 问题描述：上游 rejected issue 不能被重新升级。
- 具体修复细节：检查 `normalizeRejectedIssue()` 与 rejected issue validator 测试。
- 修复结论：无需修订；第 08-09 轮让 rejected/static_confirmed contract 更严格。
- 修复效果：rejected lifecycle 保留。

### 第 28 轮：code-review handoff

- 问题描述：app-audit 自身不应输出 safe_auto。
- 具体修复细节：检查 `buildCodeReviewHandoff()` 与 SKILL protocol。
- 修复结论：无需修订。
- 修复效果：handoff 仍是 manual/advisory，未越权。

### 第 29 轮：monorepo repoRoot/sourceRoot

- 问题描述：monorepo 下 sourceRoot 与 repoRoot 混淆会污染 artifact 路径和 diff scope。
- 具体修复细节：检查 CLI e2e monorepo 测试。
- 修复结论：无需修订；第 06 轮补齐 source invalid 场景。
- 修复效果：source-scoped changed files 仍独立于 out-of-source changed files。

### 第 30 轮：untracked policy

- 问题描述：untracked 文件是否纳入 diff facts 必须明确。
- 具体修复细节：检查 `collectGitDiffFacts()`、metadata/impact `untracked_policy`。
- 修复结论：无需修订；当前为 `excluded`，同时记录 `untracked_files`。
- 修复效果：不把未跟踪文件悄悄算入 diff hash。

### 第 31 轮：large text file bounds

- 问题描述：大文本文件不应无界读取或生成不可信 source hash。
- 具体修复细节：检查 preflight 与 listSourceTextFiles 大文件测试。
- 修复结论：无需修订；第 05 轮补齐 truncation freshness。
- 修复效果：大文件和截断均产生 partial facts。

### 第 32 轮：binary asset hashing

- 问题描述：二进制大资源不应按文本读取，但也不应错误降级 source hash。
- 具体修复细节：检查 preflight binary asset 测试。
- 修复结论：无需修订。
- 修复效果：二进制资产以 size token 纳入 hash。

### 第 33 轮：artifact manifest current run

- 问题描述：manifest 不应包含自身、latest pointer 或 input raw context。
- 具体修复细节：检查 `build-artifact-manifest.js` 与 CLI e2e 断言。
- 修复结论：无需修订。
- 修复效果：manifest 保持 current run artifact 目录清洁。

### 第 34 轮：app-audit-context self exclusion

- 问题描述：context builder 不应把自身输出和 latest pointer 纳入输入 facts。
- 具体修复细节：检查 `build-audit-context.js` exclude 逻辑。
- 修复结论：无需修订。
- 修复效果：context 不自引用。

### 第 35 轮：latest-summary 消费边界

- 问题描述：latest pointer 不能当作事实源。
- 具体修复细节：检查 SKILL 和 Report Writer prompt。
- 修复结论：无需修订；第 16 轮增强 metadata lifecycle 校验。
- 修复效果：latest 仍只是 pointer。

### 第 36 轮：orchestrator prompt

- 问题描述：orchestrator 不能把 scripts candidate facts 自动升级为 confirmed issue。
- 具体修复细节：检查 `prompts/orchestrator.md`。
- 修复结论：无需修订。
- 修复效果：LLM orchestration 边界保持只读。

### 第 37 轮：audit planner prompt

- 问题描述：Planner 只能选择专家，不能替代 evidence gate。
- 具体修复细节：检查 `prompts/audit-planner.md`。
- 修复结论：无需修订。
- 修复效果：专家选择仍属于 LLM 语义判断，不是脚本路由。

### 第 38 轮：evidence auditor prompt

- 问题描述：Evidence Auditor 必须保留 deterministic gate reason，不覆盖证据事实。
- 具体修复细节：检查 `prompts/evidence-auditor.md`。
- 修复结论：无需修订。
- 修复效果：LLM 复核仍在 deterministic gate 之后。

### 第 39 轮：product/design expert prompts

- 问题描述：缺 PRD 或缺 materialized Figma 时不能制造 confirmed product/design issue。
- 具体修复细节：检查 `product-expert.md` 与 `figma-design-expert.md`。
- 修复结论：无需修订。
- 修复效果：缺输入时保持 degraded/advisory。

### 第 40 轮：mobile UX 与 accessibility lens

- 问题描述：键盘、安全区、读屏顺序等 runtime-only 风险不能静态确认。
- 具体修复细节：检查 `mobile-ux-expert.md` 与 `accessibility-i18n-lens.md`。
- 修复结论：无需修订。
- 修复效果：runtime verification 建议不被升级成 static confirmed。

### 第 41 轮：KMP/Clean Architecture prompt

- 问题描述：目录名暗示不能替代 import/dependency evidence。
- 具体修复细节：检查 `kmp-clean-architect.md` 与 architecture extractor tests。
- 修复结论：无需修订。
- 修复效果：架构 confirmed issue 仍需 code/architecture evidence。

### 第 42 轮：component/module prompt

- 问题描述：不能为了复用而要求抽象强业务页面。
- 具体修复细节：检查 `component-module-expert.md` 与 component/module tests。
- 修复结论：无需修订。
- 修复效果：复用建议仍需一致性影响证据。

### 第 43 轮：analytics prompt

- 问题描述：不能自动推导公司埋点政策。
- 具体修复细节：检查 `analytics-expert.md` 与 analytics extractor tests。
- 修复结论：无需修订。
- 修复效果：analytics issue 仍依赖 PRD/Code/analytics contract evidence。

### 第 44 轮：i18n prompt

- 问题描述：硬编码字符串不一定是用户可见文案。
- 具体修复细节：检查 `i18n-expert.md` 与 i18n extractor tests。
- 修复结论：无需修订。
- 修复效果：i18n candidate 仍需上下文确认。

### 第 45 轮：industry prompt

- 问题描述：行业规则包容易被当作法规确认。
- 具体修复细节：检查 `industry-expert.md`，并完成第 10-12 轮行业 confirmed 边界修复。
- 修复结论：已由代码与文档修复强化。
- 修复效果：行业规则继续 preview-first。

### 第 46 轮：regression expert prompt

- 问题描述：Regression Expert 不应新增测试文件或执行模拟器。
- 具体修复细节：检查 `regression-expert.md`。
- 修复结论：无需修订。
- 修复效果：只输出验证建议。

### 第 47 轮：report writer prompt

- 问题描述：报告不能把 no-evidence 写成 pass。
- 具体修复细节：检查 `report-writer.md`，并完成第 14 轮 headless verdict 修复。
- 修复结论：已由代码修复强化。
- 修复效果：degraded no-issue run 不再显示 Ready。

### 第 48 轮：schema inventory

- 问题描述：schema 文件必须是合法 JSON，并与 validator 关键协议一致。
- 具体修复细节：运行 JSON parse 检查；第 09、16 轮更新 issue/audit-report/metadata schema。
- 修复结论：已修复并验证。
- 修复效果：schema parse 通过，关键协议漂移减少。

### 第 49 轮：focused regression

- 问题描述：修复涉及 evidence、preflight、rule-packs、validate、report、CLI e2e。
- 具体修复细节：分批运行 focused Jest 与 `node --check`。
- 修复结论：focused tests 均通过。
- 修复效果：每个修复点都有直接回归覆盖。

### 第 50 轮：全量收口准备

- 问题描述：需要在最终提交前跑完整 app-audit 测试、typecheck、diff check 与 GitNexus change detection。
- 具体修复细节：本记录先写入；后续验证结果追加到本文件。
- 修复结论：待最终验证补充。
- 修复效果：留下明确收口 checklist。

## 当前已执行验证

```text
npx jest tests/unit/spec-app-consistency-audit-*.test.js --runInBand
# baseline: 17 passed, 87 tests passed

find skills/spec-app-consistency-audit/scripts -maxdepth 2 -name '*.js' -print | sort | xargs -I{} node --check {}
# passed

npx jest tests/unit/spec-app-consistency-audit-evidence.test.js tests/unit/spec-app-consistency-audit-preflight.test.js tests/unit/spec-app-consistency-audit-rule-packs.test.js tests/unit/spec-app-consistency-audit-validate.test.js --runInBand
# 4 passed, 46 tests passed

npx jest tests/unit/spec-app-consistency-audit-cli-e2e.test.js --runInBand
# 1 passed, 12 tests passed

npx jest tests/unit/spec-app-consistency-audit-report.test.js tests/unit/spec-app-consistency-audit-validate.test.js --runInBand
# 2 passed, 23 tests passed

find skills/spec-app-consistency-audit/schemas -name '*.json' -print | sort | xargs -I{} node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));" {}
# passed
```

## GitNexus 影响分析摘要

- `scanSourceTree`：LOW；直接上游 `runPreflight`，测试影响 preflight/rule-packs/validate。
- `runPreflight`：LOW；直接影响 preflight/rule-packs/validate 与脚本自身。
- `selectRulePacks`：LOW；直接影响 rule-pack selection 与测试。
- `validateAuditIssue`：LOW；上游为 audit report/issues 校验链路。
- `validateKnownContractArtifact`：LOW；上游为 `validateArtifact` 与 app-audit validator context。
- `merge-contracts.js` 文件级：LOW；GitNexus 对 `normalizeIssue` 单 symbol 未命中，按文件级影响分析退化处理。
- `audit-utils.js` 文件级：LOW；GitNexus 对部分 helper 单 symbol 未命中，按文件级影响分析退化处理。
- `build-impact-facts.js` / `render-headless-envelope.js`：GitNexus 未命中 symbol 与 file target，按代码引用与 focused tests 兜底验证。

## 第 50 轮收口补记

- 问题描述：完整 `npm run test:unit` 首次收口失败，失败点不在 app-audit 代码，而在用户手册契约：手册版本仍为 `v1.6.2`，最佳实践缺少测试要求的 `.spec-first/graph/` 与 `.spec-first/audits/` 边界短语。
- 具体修复细节：将 `docs/05-用户手册/README.md` 的版本线更新为 `v1.6.3`；调整 `docs/05-用户手册/05-最佳实践.md` 的 Graph Readiness runtime/control-plane 文案，保留 providers/impact/workspace 边界，同时恢复测试契约短语；同步扩展 `CHANGELOG.md` 本次记录。
- 修复结论：这是相邻文档契约漂移，属于项目整体质量收口，不改变 app-audit 行为。
- 修复效果：`tests/unit/user-manual-contracts.test.js` 与完整 unit 链路恢复通过。

## 最终验证

```text
npx jest tests/unit/spec-app-consistency-audit-*.test.js --runInBand
# 17 passed, 93 tests passed

npx jest tests/unit/user-manual-contracts.test.js --runInBand
# 1 passed, 3 tests passed

npm run test:unit
# 77 passed, 403 tests passed

npm run typecheck
# typecheck passed, 34 files checked

git diff --check
# passed
```

## 最终 GitNexus Change Detection

```text
npx gitnexus analyze
# Repository indexed successfully: 23714 nodes, 27625 edges, 196 clusters, 300 flows

mcp__gitnexus__.detect_changes({ repo: "/Users/kuang/xiaobu/spec-first-app-consistency-2026-05-03-loop", scope: "all" })
# changed_count: 38
# affected_count: 22
# changed_files: 19 indexed files
# risk_level: critical
```

- 问题描述：最终变更横跨 app-audit 的 preflight、impact facts、rule-pack selection、issue normalization、validator、headless report、脱敏工具与测试覆盖，GitNexus 将影响面评为 `critical`。
- 具体修复细节：复查受影响流程集中在 `RunPreflight`、`BuildImpactFacts`、`SelectRulePacks`、`BuildAuditReport`、`BuildIssuesArtifact`、`ApplyEvidenceGate`、`RenderHeadlessEnvelope`、`NormalizeScreen/NormalizeComponent -> RedactUrls` 等 app-audit 相关链路；对应链路均有 focused tests 或完整 unit 覆盖。
- 修复结论：`critical` 不是未控风险，而是因为本轮按要求覆盖了多个 app-audit 核心协议面；风险已通过 schema、validator、focused regression、完整 unit、typecheck 和 diff check 收口。
- 修复效果：app-audit 对 evidence freshness、issue status、industry lens、metadata lifecycle、headless verdict 与 redaction 的契约更一致，文档和测试同步约束后，后续漂移更容易被 CI 捕获。

## 工程边界结论

- 未手改 generated runtime assets：`.claude/`、`.codex/`、`.agents/skills/` 未纳入最终变更。
- `npx gitnexus analyze` 曾自动把 `AGENTS.md` / `CLAUDE.md` 的 GitNexus block 改成临时 worktree 名称；该改动已恢复，避免污染 canonical source 入口。
- GitNexus `detect_changes` 只统计 indexed code/skill/test 符号；`CHANGELOG.md`、本审查记录和用户手册局部文档修复不进入该符号统计，但已由 `user-manual-contracts` 与人工收口记录覆盖。

---

# 2026-05-03 spec-graph-bootstrap 50 轮审查与修复记录

执行 worktree: `/Users/kuang/xiaobu/spec-first-graph-bootstrap-2026-05-03-loop`

执行分支: `audit/2026-05-03-graph-bootstrap-loop`

审查对象: `skills/spec-graph-bootstrap/**`、对应 prompt mirror、单元/契约测试，以及与 graph bootstrap 输入投影直接耦合的 `spec-mcp-setup` 图谱配置写入面。

## Round 01

- 问题描述: 原仓库存在未提交改动，直接在主工作区继续审查会混淆用户已有变更和本轮审查变更。
- 修复细节: 新建独立 worktree，并在新分支 `audit/2026-05-03-graph-bootstrap-loop` 上承接当前 diff 作为审查基线。
- 修复结论: 本轮工作与主工作区隔离，避免误改或回滚用户状态。
- 修复效果: 后续所有代码、文档、测试和日志变更均在独立 worktree 中完成。

## Round 02

- 问题描述: spec-first 演化类任务必须先校准角色契约，否则容易把脚本做成强状态机。
- 修复细节: 复读 `docs/10-prompt/结构化项目角色契约.md`，确认 Light contract、Explicit boundaries、Scripts prepare / LLM decides 是审查基线。
- 修复结论: 本轮只让脚本产出可验证事实，不让脚本决定语义 repo 相关性或替代 LLM handoff 判断。
- 修复效果: 后续修复集中在 artifact contract、reason_code、readiness facts 和测试闭环。

## Round 03

- 问题描述: `spec-graph-bootstrap` 内部资产范围较大，缺少先验清单容易漏看 eval、PowerShell parity 或 prompt mirror。
- 修复细节: 枚举 `skills/spec-graph-bootstrap/**`、`docs/10-prompt/skills/spec-graph-bootstrap/SKILL.md` 和相关 unit tests。
- 修复结论: 审查面包含 skill prose、bash 脚本、PowerShell 脚本、resolver、eval fixtures、prompt mirror、shell behavior tests、Jest contract tests。
- 修复效果: 避免只修 bash 主路径而漏掉 Windows/source mirror/LLM review 输入。

## Round 04

- 问题描述: 初始 deterministic skill audit 显示 eval readiness 偏弱，`spec-graph-bootstrap` 缺少可复查样例。
- 修复细节: 运行 `retired-skill-review`，确认无 P0/P1/P2，但 `eval_readiness` 是主要质量弱点。
- 修复结论: 该问题不是运行时 bug，而是 skill 作为可复用 workflow 的审查输入质量不足。
- 修复效果: 确定补 eval fixtures，而不是增加脚本状态机。

## Round 05

- 问题描述: skill 缺少触发类 eval，后续修改容易把父级 workspace 默认行为重新退回“要求用户选择 repo”。
- 修复细节: 新增 `skills/spec-graph-bootstrap/evals/trigger-cases.json`，覆盖 parent workspace 默认 all-repos、显式 child repo、read-only target discovery。
- 修复结论: 触发入口由 fixtures 固化为 review 输入。
- 修复效果: 后续 review 能直接判断何时运行 all-repos、何时只解析 targets。

## Round 06

- 问题描述: skill 边界容易混淆 parent advisory summary 和 child canonical graph facts。
- 修复细节: 新增 `boundary-cases.json`，覆盖父级不写 repo-local canonical artifact、setup-owned input 不回写、live MCP evidence 不回写 compiled readiness。
- 修复结论: source-of-truth 边界被 fixture 化。
- 修复效果: 降低 downstream workflow 把父级 `.spec-first/workspace/*` 当 canonical truth 的风险。

## Round 07

- 问题描述: provider command safety、readiness conflict、no-source fallback 的失败语义缺少 eval 样例。
- 修复细节: 新增 `failure-cases.json`，覆盖 `missing_provider_config`、`unsupported-provider-command`、`readiness-conflict`、`gitnexus-query-not-applicable`。
- 修复结论: fail-closed reason_code 被纳入 review fixture。
- 修复效果: 失败路径可以被 LLM review 和 deterministic contract tests 共同复查。

## Round 08

- 问题描述: 成功/降级/会话证据分离缺少 expected behavior fixture。
- 修复细节: 新增 `expected-behavior-cases.json`，覆盖 primary single repo、definitions-only degraded、all-repos no-source child、live MCP handoff。
- 修复结论: 核心输出语义有了可读样例。
- 修复效果: 后续修改可以先对照行为样例，而不是只看脚本输出字段。

## Round 09

- 问题描述: eval fixtures 可能存在但无人检查，容易变成漂移文档。
- 修复细节: 在 `tests/unit/spec-graph-bootstrap-contracts.test.js` 中加入 eval 文件存在性和关键枚举断言。
- 修复结论: eval readiness 从纯文档变为最小可验证 contract。
- 修复效果: 删除或破坏 eval 文件会触发单元测试失败。

## Round 10

- 问题描述: prompt mirror 没有同步 `no-source` status，LLM 运行时可能仍认为 resolver 只有 degraded/stale/unavailable 等旧状态。
- 修复细节: 更新 `docs/10-prompt/skills/spec-graph-bootstrap/SKILL.md`，把 `no-source` 纳入 resolver status 列表。
- 修复结论: source skill 与 prompt mirror 在 no-source 语义上对齐。
- 修复效果: 宿主 runtime 刷新后，LLM 不会把 README-only child repo 误读为 degraded。

## Round 11

- 问题描述: final response contract 仍只要求 ready/degraded/action-required 计数，遗漏 not-applicable。
- 修复细节: 同步更新 source skill、prompt mirror 和 contract tests，要求多仓输出 ready/degraded/not-applicable/action-required counts。
- 修复结论: final handoff 语义与 all-repos summary schema 对齐。
- 修复效果: 用户看到的总结不再把无源码子仓混入 degraded。

## Round 12

- 问题描述: `resolve-workspace-graph-targets.*` 在所有 child repo 都是 no-source 时仍会输出 generic degraded reason。
- 修复细节: bash/PowerShell resolver 增加 `workspace-graph-targets-no-source` reason 和对应 next_action。
- 修复结论: “没有代码型 graph target” 与“代码型 graph target readiness 失败”被明确区分。
- 修复效果: Downstream workflows 可以跳过 GitNexus process routing，而不是要求无意义地修复 degraded。

## Round 13

- 问题描述: no-source resolver 行为缺少 shell behavior test。
- 修复细节: 在 `tests/unit/spec-graph-bootstrap.sh` 增加 only-no-source workspace 场景，断言 all-repos 成功、resolver reason 为 `workspace-graph-targets-no-source`。
- 修复结论: 根因场景被可重复覆盖。
- 修复效果: 后续改动若退回 generic degraded 会直接失败。

## Round 14

- 问题描述: PowerShell resolver parity 只靠人工检查不够稳。
- 修复细节: 在 `tests/unit/mcp-setup-powershell-contracts.test.js` 加入 PowerShell resolver 的 no-source reason 和 next_action 源契约断言。
- 修复结论: Windows source parity 有最小守卫。
- 修复效果: bash/PowerShell drift 风险降低。

## Round 15

- 问题描述: GitNexus `query_probe_policy.selected_from=null` 对无源码 fallback 是合理值，但旧 validation 容易误判。
- 修复细节: 保持并验证 nullable string policy，允许 `selected_from` 和 `source` 为 null 或 string。
- 修复结论: fallback-static policy 不再被 command validation 错误挡住。
- 修复效果: README-only/no-source repo 可以生成 not-applicable artifact，而不是 blocked。

## Round 16

- 问题描述: `expected_hit=false` 的 GitNexus query probe 如果返回 definitions-only，不应被当成 degraded。
- 修复细节: 确认 bootstrap 写 `status=query-not-applicable`、`query_ready=false`、single-repo `workflow_mode=no-source` / `overall_status=not-applicable`。
- 修复结论: no-source 是 not applicable，不是 provider failure。
- 修复效果: all-repos 中无源码 child 不影响代码型 child 的 readiness 质量判断。

## Round 17

- 问题描述: all-repos summary 需要把 no-source child 单独计数，否则用户看到 partial/degraded 会误判。
- 修复细节: 确认并测试 `counts.not_applicable`、`overall_status=ready` 在 ready + not-applicable 场景成立。
- 修复结论: 父级 summary 现在能表示“代码型 child 已 ready，无源码 child 不适用”。
- 修复效果: 多仓 workspace 的最终状态更接近真实研发可用性。

## Round 18

- 问题描述: test fixture 中一处 `jq` filter 多了前导 `|`，导致 only-no-source 场景测试本身报语法错误。
- 修复细节: 删除错误前导管道。
- 修复结论: 失败不是产品行为，而是测试 fixture 写法错误。
- 修复效果: no-source resolver 的真实行为能被测试执行到。

## Round 19

- 问题描述: contract test 仍保留旧文案 `ready/degraded/action-required counts`。
- 修复细节: 更新为 `ready/degraded/not-applicable/action-required counts`。
- 修复结论: 文档 contract 与实现字段一致。
- 修复效果: Jest contract test 不再阻止新语义落地。

## Round 20

- 问题描述: resolver 把 dirty graph facts 统一视作 uncertain，导致 no-source artifact 在 dirty repo 下被误判为 degraded。
- 修复细节: 定位到 `graph-facts.json` 只写 `worktree_dirty`，没有写 `worktree_status_hash`，resolver 无法判断 dirty 是否发生变化。
- 修复结论: 根因是 freshness fact 不完整，不是 GitNexus query probe 本身失败。
- 修复效果: 修复方向变为补 deterministic freshness fingerprint。

## Round 21

- 问题描述: bash bootstrap 没有记录 worktree status fingerprint。
- 修复细节: 在 `bootstrap-providers.sh` 中计算 `WORKTREE_STATUS_HASH`，优先 `shasum`，其次 `sha256sum`，最后 Python fallback。
- 修复结论: bash graph facts 具备可比较 dirty fingerprint。
- 修复效果: resolver 能区分“同一 dirty 状态”和“bootstrap 后 dirty 状态变化”。

## Round 22

- 问题描述: PowerShell bootstrap 同样缺少 worktree status fingerprint。
- 修复细节: 在 `bootstrap-providers.ps1` 中新增 `Get-StatusHash`，记录 `$worktreeStatusHash`。
- 修复结论: Windows source parity 补齐。
- 修复效果: PowerShell 生成的 graph facts 与 bash 字段语义一致。

## Round 23

- 问题描述: graph facts 只在 resolver 内隐式消费 hash，source skill 没有声明该 contract。
- 修复细节: 在 `skills/spec-graph-bootstrap/SKILL.md` 增加 `worktree_status_hash` freshness fingerprint 说明。
- 修复结论: 新字段从实现细节提升为 artifact contract。
- 修复效果: 下游维护者知道 dirty-uncertain 的判定依据。

## Round 24

- 问题描述: prompt mirror 缺少 `worktree_status_hash` contract，会造成 runtime LLM 继续按旧逻辑解释 dirty 状态。
- 修复细节: 在 prompt mirror 补充中文规则：dirty 且 fingerprint 缺失或不匹配才输出 `dirty-uncertain`。
- 修复结论: source 与 prompt mirror 一致。
- 修复效果: runtime 刷新后，LLM handoff 不会误把所有 dirty artifact 判为不可用。

## Round 25

- 问题描述: 旧 dirty test 只验证“无 fingerprint 必须 uncertain”，但现在 bootstrap 会写 fingerprint。
- 修复细节: 更新测试为两段：有 matching fingerprint 时保持 primary；手动删除 fingerprint 后才输出 dirty-uncertain。
- 修复结论: 测试同时覆盖正向和退化路径。
- 修复效果: 防止未来删除 fingerprint 写入，也防止 resolver 放松 dirty-uncertain 保护。

## Round 26

- 问题描述: eval fixtures 没覆盖这次真实根因。
- 修复细节: 在 `expected-behavior-cases.json` 增加 `dirty-worktree-fingerprint` case，并更新 eval README。
- 修复结论: dirty freshness 进入 LLM review 样例集。
- 修复效果: 后续评审能直接检查“dirty 不等于 uncertain，必须看 fingerprint”。

## Round 27

- 问题描述: eval contract test 没断言 dirty fingerprint 样例。
- 修复细节: 在 Jest contract 中要求 expected behavior cases 包含 `worktree_status_hash`。
- 修复结论: 新 eval case 有最小 deterministic 守卫。
- 修复效果: 删除该 review case 会导致测试失败。

## Round 28

- 问题描述: PowerShell graph bootstrap source contract 没断言 `worktree_status_hash` 写入。
- 修复细节: 增加 `function Get-StatusHash` 和 `worktree_status_hash = $worktreeStatusHash` 字符串断言。
- 修复结论: PowerShell parity 不再只靠肉眼检查。
- 修复效果: Windows source drift 风险降低。

## Round 29

- 问题描述: `bootstrap-providers.sh` 的 graph facts jq block 有 tab 缩进漂移。
- 修复细节: 统一 `workflow_mode`、`provider_summary` 缩进。
- 修复结论: 纯格式修复，不改行为。
- 修复效果: 长脚本可读性提升，降低后续误改概率。

## Round 30

- 问题描述: `bootstrap-providers.ps1` 的 `$graphFacts.provider_summary` 也有 tab 缩进漂移。
- 修复细节: 统一 PowerShell ordered hash 缩进。
- 修复结论: bash/PowerShell 两侧维护体验一致。
- 修复效果: 后续 diff 更干净。

## Round 31

- 问题描述: provider command safety 是高风险面，需要确认新增改动没有放宽执行边界。
- 修复细节: 复查 command validation contract：数组执行、不 eval、不接受 `bash -c` / `sh -c` / unsupported executable。
- 修复结论: 本轮没有引入新的 provider command shape。
- 修复效果: 安全边界保持原有 fail-closed 行为。

## Round 32

- 问题描述: GitNexus multi-candidate probe 容易退化成 broad search。
- 修复细节: 复查 consumer-side limit=5、candidate truncation、first process result stop、winning raw log 字段。
- 修复结论: bounded probe 边界保持。
- 修复效果: readiness proof 仍是小范围 source-derived probe，不替代 LLM search。

## Round 33

- 问题描述: definitions-only 容易被误读成 GitNexus query_ready。
- 修复细节: 复查文档和测试，确认 definitions-only 保持 `query-unverified`，只作为 file/symbol pointer evidence。
- 修复结论: compiled readiness 与定位证据分离。
- 修复效果: 最终 handoff 不会把 partial definitions 当 process graph 健康。

## Round 34

- 问题描述: live MCP probe 容易被误写回 canonical artifacts。
- 修复细节: 复查 Live MCP Probe contract：只尝试一个具体调用，只做 session-local evidence，不改 `.spec-first/graph/*`。
- 修复结论: 脚本事实与会话证据边界清楚。
- 修复效果: Downstream artifacts 不会被当前会话偶然状态污染。

## Round 35

- 问题描述: parent workspace summary 容易被误当 repo-local canonical truth。
- 修复细节: 补充 source skill 的 Outputs 说明，列出 `.spec-first/workspace/graph-bootstrap-summary.json` 和 `graph-targets.json` 为 advisory control-plane evidence。
- 修复结论: parent summary 与 child canonical facts 边界明确。
- 修复效果: 多仓 workflow 可以安全消费父级 summary 但不替代 child facts。

## Round 36

- 问题描述: setup-owned config inputs 不能被 graph-bootstrap 反向写 readiness。
- 修复细节: 复查测试中 `graph-bootstrap does not mutate provider config input` 和 `runtime capabilities input` 的断言。
- 修复结论: setup projection ownership 仍归 `spec-mcp-setup`。
- 修复效果: source-of-truth 不发生反向污染。

## Round 37

- 问题描述: `spec-mcp-setup` 的 GitNexus probe candidate 质量会直接影响 graph-bootstrap query proof。
- 修复细节: 保留上一轮基线中对 method-level flow-like token 的增强，并通过 `test:mcp-setup` 验证候选投影。
- 修复结论: mcp-setup 与 graph-bootstrap 的接口仍通过 `graph-providers.json` 轻 contract 连接。
- 修复效果: 不把 query candidate 选择逻辑复制到 graph-bootstrap。

## Round 38

- 问题描述: no-source child 不能让整个 all-repos workspace 看起来 degraded。
- 修复细节: 验证 all-repos ready + no-source child 场景输出 `ready:1:0:1:0`。
- 修复结论: all-repos summary 能正确表达 partial applicability。
- 修复效果: 用户在多仓父目录直接运行 `$spec-graph-bootstrap` 时得到更可信状态。

## Round 39

- 问题描述: only-no-source workspace 的 next_action 不能建议“修 degraded”。
- 修复细节: resolver next_action 改为 `No code-bearing graph target is available; skip GitNexus process routing for no-source child repos.`
- 修复结论: LLM handoff 指令符合真实状态。
- 修复效果: 后续 skill 不会对 README-only workspace 做无意义 GitNexus routing。

## Round 40

- 问题描述: dirty uncertainty limitation 文案必须绑定 fingerprint 条件。
- 修复细节: 测试覆盖 fingerprint 缺失时输出 limitation `dirty worktree without a matching status fingerprint`。
- 修复结论: dirty-uncertain 不再是泛化脏工作区标签。
- 修复效果: 用户看到 dirty-uncertain 时能理解是 freshness 无法证明，而非任何 dirty 都不可用。

## Round 41

- 问题描述: `pwsh` 当前环境不可用，不能执行 PowerShell 脚本行为测试。
- 修复细节: 使用 source-contract Jest 测试覆盖 PowerShell 的关键字段、reason_code、hash 函数和命令安全边界。
- 修复结论: 这是次优但可接受的 parity 验证方式。
- 修复效果: 明确记录剩余风险：未在真实 Windows runner 执行。

## Round 42

- 问题描述: 新增 eval files 可能不被 npm 包包含。
- 修复细节: 运行 `npm run build`，确认 tarball contents 包含 `skills/spec-graph-bootstrap/evals/*`。
- 修复结论: eval fixtures 会随包发布。
- 修复效果: 用户安装后的 source skill 具备同样 review fixtures。

## Round 43

- 问题描述: skill entrypoint lint 可能因为新增 eval 或文案变化出现治理问题。
- 修复细节: 运行 `npm run lint:skill-entrypoints`。
- 修复结论: lint 通过，扫描 162 files。
- 修复效果: 新增资产没有破坏 skill 入口治理。

## Round 44

- 问题描述: shell 语法和 JSON fixtures 容易在长脚本里出现低级错误。
- 修复细节: 运行 `bash -n` 覆盖 graph-bootstrap bash 脚本与 shell unit；对 eval JSON 运行 `jq empty`。
- 修复结论: 语法层通过。
- 修复效果: 避免再次出现 fixture `jq` filter 语法错误。

## Round 45

- 问题描述: graph-bootstrap 主行为必须用端到端 shell fixture 验证。
- 修复细节: 运行 `npm run test:graph-bootstrap`。
- 修复结论: 通过，覆盖 all-repos、no-source、dirty fingerprint、multi-candidate、definitions-only、环境失败分类等路径。
- 修复效果: 核心回归被可重复证明。

## Round 46

- 问题描述: mcp-setup projection 与 graph-bootstrap 消费契约必须一起验证。
- 修复细节: 运行 `npm run test:mcp-setup`。
- 修复结论: 通过。
- 修复效果: `graph-providers.json`、runtime capabilities、provider artifacts 的生成和消费边界保持一致。

## Round 47

- 问题描述: 全项目 unit 可能发现 changelog、PowerShell source contract 或其他 downstream contract 破裂。
- 修复细节: 运行 `npm run test:unit`。
- 修复结论: 77 个 test suites、398 个 tests 全部通过。
- 修复效果: 本轮变更未破坏主单元测试链路。

## Round 48

- 问题描述: JS/CLI 语法和发布包内容需要验证。
- 修复细节: 运行 `npm run typecheck` 和 `npm run build`。
- 修复结论: typecheck 通过 34 files；build dry-run 成功。
- 修复效果: CLI 语法与 npm package manifest 维度收口。

## Round 49

- 问题描述: 任意 source 变更必须更新 changelog。
- 修复细节: 在 `CHANGELOG.md` 追加 `v1.6.3 2026-05-04 02:29:55 leokuang` 记录，说明 eval fixtures、no-source resolver、dirty fingerprint contract 修复。
- 修复结论: 遵守项目 changelog 铁律。
- 修复效果: 用户可见行为变化有可追踪历史。

## Round 50

- 问题描述: 需要最终审查本轮改动是否服务 Codebase -> Graph -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge 链路。
- 修复细节: 复跑 `retired-skill-review`，确认无 P0/P1/P2，score signal 为 89(B+)；剩余非完美项主要是 progressive disclosure 的保守信号。
- 修复结论: 本轮修复提高 Graph 节点 readiness facts、workspace routing handoff、eval review input 和 artifact freshness，可治理性提升，没有引入强编排状态机。
- 修复效果: 多仓 workspace 下 no-source、degraded、dirty freshness 与 session-local GitNexus evidence 的边界更清晰，后续 skill 可以更稳定地消费 GitNexus/code-review-graph readiness。

## 验证汇总

- `bash -n skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.sh tests/unit/spec-graph-bootstrap.sh`: passed
- `for f in skills/spec-graph-bootstrap/evals/*.json; do jq empty "$f"; done`: passed
- `npx jest tests/unit/spec-graph-bootstrap-contracts.test.js tests/unit/mcp-setup-powershell-contracts.test.js --runInBand`: passed
- `npm run typecheck`: passed
- `npm run test:mcp-setup`: passed
- `npm run test:graph-bootstrap`: passed
- `npm run test:unit`: passed, 77 suites / 398 tests
- `npm run lint:skill-entrypoints`: passed, 162 files scanned
- `npm run build`: passed, `npm pack --dry-run`
- `git diff --check`: passed
- `node skills/retired-skill-review/scripts/write-audit-artifacts.js --repo . --target skills/spec-graph-bootstrap`: passed, no P0/P1/P2, score signal 89(B+)

## 剩余风险

- 当前机器没有可用 `pwsh` 行为运行环境；PowerShell 侧通过 source-contract Jest 断言验证，仍建议后续在 Windows runner 上补真实行为测试。
- `spec-graph-bootstrap/SKILL.md` 仍是较长 skill，skill-review 保守提示 progressive disclosure=3；本轮不拆分正文到 references，避免在修复 readiness 根因时扩大架构变更。
