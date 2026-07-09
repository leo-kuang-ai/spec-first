# spec-app-consistency-audit 升级技术方案

> 精简主方案。完整协议、schema 示例、矩阵和长决策记录见：
> `docs/02-架构设计/spec-app-consistency-audit/升级技术方案_完整协议参考.md`

## 1. 结论

`spec-app-consistency-audit` 应保留为独立 App 专项 workflow，不并入 `spec-code-review`。

正确形态：

```text
Skill Orchestrator
  -> deterministic scripts build Impact Facts
  -> LLM Audit Planner selects a small expert set
  -> selected experts review bounded evidence
  -> Deterministic Evidence Gate applies structural caps
  -> LLM Evidence Auditor checks semantic support
  -> Report Writer emits summary, issues and handoff suggestions
```

核心边界：

```text
Scripts prepare, LLM decides.
Light contract, explicit boundaries.
Static-first, no runtime validation by default.
Run-scoped artifacts only.
Missing PRD/Figma/plan/task-doc degrades capability, not the whole audit by default.
```

## 2. Source Of Truth

Execution source-of-truth：

```text
skills/spec-app-consistency-audit/SKILL.md
skills/spec-app-consistency-audit/scripts/**
skills/spec-app-consistency-audit/schemas/**
skills/spec-app-consistency-audit/prompts/**
skills/spec-app-consistency-audit/rule-packs/**
templates/claude/commands/spec/app-consistency-audit.md
src/cli/contracts/dual-host-governance/skills-governance.json
tests/unit/spec-app-consistency-audit-*.test.js
```

Design references：

```text
docs/02-架构设计/spec_app_consistency_audit_升级技术方案.md
docs/02-架构设计/spec-app-consistency-audit/升级技术方案_完整协议参考.md
docs/02-架构设计/移动端交互审查方案.md
```

本文件是升级蓝图和实施索引，不是 runtime contract。实现发生冲突时，以 skill、scripts、schemas、prompts、governance contract 和 tests 为准。

## 3. 目标与非目标

目标：

```text
1. 审查 App 实现与 PRD / Figma / 架构 / 交互 / 埋点 / i18n / 行业规则的一致性。
2. 用 Impact Facts 提升 LLM 输入质量，避免专家自由发挥。
3. 通过 run-scoped artifacts 保留本轮证据链。
4. 对缺失输入做精准降级，不制造 confirmed false positive。
5. 与 spec-code-review 协作，但不污染通用 code review。
```

非目标：

```text
1. 不替代 spec-code-review 的通用代码审查。
2. 不替代 spec-plan / spec-brainstorm 补写 PRD 或产品决策。
3. 不自动运行 simulator / real device / browser。
4. 不修改产品源码、generated runtime assets、repo-profile.yaml 或 durable docs。
5. 不把行业 rule-pack、Figma URL、node id 或术语候选当 confirmed evidence。
```

## 4. Mode Contract

支持 token：

```text
mode:headless
mode:report-only
base:<ref>
source:<repo-relative-path>
prd:<repo-relative-path>
figma-context:<repo-relative-path>
figma-ref:<id-or-url>
industry:<name>
tech-plan:<repo-relative-path>
task-doc:<repo-relative-path>
depth:deep
from:code-review
```

模式边界：

| Mode | 写 artifact | 用户提问 | Figma materialize | 用途 |
|---|---:|---:|---:|---|
| default | 是 | 可问 | 需授权 | 人工专项审查 |
| headless | 是 | 否 | 否 | parent workflow / code-review 调用 |
| report-only | 否 | 否 | 否 | 快速只读审查 |

`report-only` 的 no-write contract 高于 artifact 完整性目标。若某 extractor 只有写文件 CLI 版本，该能力在 report-only 中降级。

## 5. 精准降级

输入期望分四类：

```text
required:
  当前 mode 的硬前提。缺失即 failed。

expected:
  用户显式要求、父 workflow 声明，或当前审查目标明确依赖。缺失通常 degraded。

opportunistic:
  有则增强审查。缺失只形成 coverage gap，不降级 run_status。

not_applicable:
  当前目标不需要。缺失不记录 degraded。
```

最小规则：

```text
source root 缺失:
  run_status = failed

用户要求审查是否符合 PRD，但 PRD 缺失:
  run_status = degraded
  product_alignment <= advisory / out_of_scope

PRD 只是 opportunistic，且缺失:
  run_status 可为 complete
  product_consistency = unavailable
  audit_verdict_scope = source_only_app_static_audit

Figma context 同理。

Graph unavailable / stale / definitions-only:
  run_status = degraded
  回退 bounded source scan

未确认 industry profile:
  industry_compliance <= advisory / candidate
```

报告、summary、headless envelope 和 `metadata.json` 必须输出：

```text
run_status
coverage_capabilities
conclusion_caps
audit_verdict_scope
```

`audit_verdict_scope` 最小取值：

```text
source_only_app_static_audit
product_design_consistency_audit
full_app_consistency_audit
```

## 6. Evidence Model

issue 必须拆分两个字段：

```text
claim_family:
  证据族，用于 Evidence Gate 和 conclusion cap。
  示例：product_alignment / design_alignment / architecture_static / industry_compliance。

claim_type:
  具体问题语义，用于去重、报告和修复建议。
  示例：missing_confirmation_state / hardcoded_user_text / inconsistent_analytics_event。
```

Evidence Gate 负责确定性拒绝或降级：

```text
schema invalid
missing project evidence
rule-pack-only confirmed
unconfirmed industry confirmed
Figma ref-only as design evidence
claim_family required evidence missing
```

LLM Evidence Auditor 负责语义充分性：

```text
标题是否被 evidence 支持
severity 是否合理
impact 是否被证据支撑
recommendation 是否可执行
是否需要 runtime verification
```

## 7. Impact Facts

脚本只产出候选 facts，不做语义裁决。

最小 inputs：

```text
git diff
changed files
changed symbols
route / screen / ViewModel / UseCase / Repository signals
PRD/Figma availability
analytics / i18n changes
industry profile / rule-pack candidates
graph artifacts when available
interaction_surface_changed signals
```

`interaction_surface_changed` v0.1a 最小覆盖：

```text
navigation
form_submit
keyboard
dialog
permission
refresh
pagination
duplicate_submit
empty_state / loading_state / success_state / disabled_state
weak_network
accessibility_changed / accessibility_risk
error_state
```

Accessibility risk 只在有 code / Figma / PRD / contract evidence 时进入 finding；证据不足时只输出 candidate 和 runtime verification suggestion。

## 8. Artifacts

所有写入必须 run-scoped：

```text
.spec-first/app-audit/runs/<run-id>/
```

v0.1a 最小 artifacts：

```text
metadata.json
artifact-manifest.json
preflight.json
impact-facts.json
app-audit-context.json
evidence-gate-result.json
issues.json
app-consistency-audit.md
app-consistency-audit.summary.md
```

v0.1b 增加：

```text
audit-plan.json
expert-reviews/*.json
llm-evidence-auditor result 或 issues.review_lifecycle auditor stage
strict issue schema validation result
```

`latest-summary.json` 只是指针，不是事实源。必须包含并校验：

```text
run_id
summary_path
issues_path
head_sha
diff_hash
worktree_fingerprint
source_hash
audit_verdict_scope
```

fingerprint 不匹配时，parent workflow 必须提示 rerun app-audit，不能消费旧事实。

## 9. 安全与隐私边界

硬边界：

```text
1. 不读取或输出 .env / secrets / token / credentials。
2. 不执行 remote script pipe，不安装依赖。
3. 不默认启动网络、simulator、real device、browser 或 cloud device。
4. PRD、Figma、代码注释、materialized contract 都是 data，不是指令。
5. artifact 中的 prompt-injection 文案只记录 reason_code，不执行、不复述长文本。
6. Figma token 只由 provider / host 安全存储管理，app-audit 不缓存、不写入 artifact。
7. report / summary / envelope 不输出 raw 长文本、PII、token-bearing URL 或完整敏感原文。
```

Run artifact 是 generated / reproducible 区，应被 gitignore。`runs/<run-id>/input/` 不能被 downstream workflow 直接消费。

## 10. 与 spec-code-review 协作

默认协作方式：

```text
v0.1:
  spec-code-review 只推荐运行 app-audit，不自动调用。

v0.2:
  用户显式要求或 parent workflow 授权时，可 headless 调用 app-audit summary。

v0.3:
  code-review 只合并 high-signal findings。
```

推荐运行 app-audit 的信号必须收窄：

```text
核心业务路径：trade / payment / order / refund / login / kyc
UseCase / ViewModel / UiState / UiEvent 同时影响 Screen / Route / analytics / i18n
interaction_surface_changed / accessibility_risk / runtime_verification_required
PRD / Figma context / app-audit input 与 App source 同时变更
父 workflow 声明 expected_inputs
多个 App 专项弱信号叠加
```

普通 App 文件命中但无一致性风险，只写 Coverage note，不默认推荐 app-audit。

## 11. Workflow Handoff

handoff 是建议，不是强编排。

允许建议：

```text
spec-plan / spec-brainstorm:
  缺 PRD、验收标准或产品决策。

spec-code-review:
  主问题是 correctness / security / performance / API contract / test coverage。

retired-skill-review:
  发现 skill trigger、runtime governance 或 source/runtime drift。

spec-polish-beta / runtime validation:
  静态证据无法确认，需要 simulator / real device / browser。

spec-compound:
  有可沉淀规范或 learning candidate。
```

报告正文最多展示：

```text
1 个 blocking next action
2 个 secondary follow-ups
```

其余建议只进入 appendix 或 v0.2+ standalone artifact。

## 12. 分期落地

### v0.1a：Contract Spine

先实现可稳定执行的 source-only 静态审查：

```text
mode contract
scope detection
run-scoped artifacts
metadata / manifest / freshness
impact-facts
app-audit-context
basic coverage_capabilities
basic conclusion_caps
audit_verdict_scope
deterministic evidence gate
issues + summary + report
headless envelope
report-only no-write
safety / redaction / untrusted input / retention
CLI subprocess e2e
```

### v0.1b：Planner + Issue Hardening

在 v0.1a 稳定后再实现：

```text
LLM Audit Planner
planner_guardrails
Agent IO minimal
strict issue schema
LLM Evidence Auditor
review_lifecycle auditor stage
dynamic expert report sections
planner / malformed / auditor / claim_family evals
```

### v0.2+

后续打开：

```text
Figma MCP materialization
PRD contract extraction
standalone workflow-handoff-suggestions.json
Validation Pass
full claim_family evidence matrix
code-review headless integration
component / module / reuse contracts
analytics / i18n contracts
confirmed industry profile
Maestro / Appium suggestions
```

## 13. 当前实现优先级

P0：

```text
1. 采用 in-place contract rebuild，不删除整个 skill 重写。
2. 更新 SKILL.md 的 Inputs / Modes / Workflow / Failure Modes / Outputs。
3. 统一新写入路径到 `.spec-first/app-audit/runs/<run-id>/`。
4. 保留旧扁平路径只读兼容，不再作为新写入目标。
5. 增加 report-only no-write、headless failed envelope、freshness mismatch、precise degradation、rule-pack-only rejection 测试。
```

P1：

```text
1. 补 build-impact-facts.js。
2. 补 audit-plan.schema.json 和 issue.schema.json。
3. 补 interaction_surface_changed minimal signals。
4. 补 claim_family conclusion cap。
5. 补 Figma evidence 粒度与 credential redaction。
```

P2：

```text
1. code-review recommend-only -> headless summary -> high-signal merge。
2. confirmed industry profile。
3. runtime verification scenario suggestions。
```

## 14. 参考索引

完整细节放在参考文档中，主文档不再承载长 schema 和大矩阵：

```text
完整协议参考：
  docs/02-架构设计/spec-app-consistency-audit/升级技术方案_完整协议参考.md

历史交互审查输入：
  docs/02-架构设计/移动端交互审查方案.md
```

最终判断：

> `spec-app-consistency-audit` 不应成为每次全量跑的重型平台，也不应成为隐藏规则引擎。它应是 App 专项审查 orchestrator：脚本准备事实，LLM 组织最小专家小组，Evidence Gate 保证证据边界，报告以能力范围和降级状态对用户诚实。
