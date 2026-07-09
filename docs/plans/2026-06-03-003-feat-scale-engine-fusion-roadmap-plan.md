---
title: "feat: SCALE Engine 融合到 spec-first 的版本迭代路线图"
type: roadmap
status: superseded
date: 2026-06-03
spec_id: 2026-06-03-003-feat-scale-engine-fusion-roadmap
superseded_by: docs/01-需求分析/13.scale-integration/spec-first内化集成scale-project-scaffold技术方案.md
superseded_by_index: docs/01-需求分析/13.scale-integration/README.md
origin:
  - docs/01-需求分析/13.scale-integration/bak/scale-engine-能力清单与集成建议.md
  - docs/01-需求分析/13.scale-integration/bak/project-scaffold-依赖安装逻辑分析.md
  - docs/01-需求分析/13.scale-integration/bak/scale-os-config-claude-code-依赖安装面分析.md
---

# feat: SCALE Engine 融合到 spec-first 的版本迭代路线图

> **Superseded（2026-06-13 深度审查后收敛）：本路线图不再作为 active 开发入口，仅作历史规划快照保留。**
>
> 本文是 2026-06-03 的 pre-implementation roadmap（自身 Handoff 即定位为"待 `spec-plan` 拆解"）。其规划的 v1.11–v1.17 已全部落地，各自有更窄、更克制的独立实施 plan 在管；v2.0 已被 live 父方案以 `Phase F：Platform Baseline` 承接。因此本文的方向判断成立，但其版本表、文件面、schema 清单均已被实现期的窄 plan 超越，**不得按本文原文执行**。
>
> - **Live source-of-truth**：`docs/01-需求分析/13.scale-integration/spec-first内化集成scale-project-scaffold技术方案.md`（父方案）+ 同目录 `README.md`（持有权威逐版本进度台账）。
> - **逐版本落地状态**（git/源码/CHANGELOG 三方核实）：v1.11/v1.12 已落地（commit `4b63cc4c`，plan `2026-06-04-001`）；v1.13 已落地（commit `3fc4dbda`，plan `2026-06-04-003`）；v1.14 已落地（`docs/contracts/governance/*` + `src/cli/helpers/{rule-maturity,task-governance-signals}.js`，plan `2026-06-05-001`）；v1.15 已落地（commit `3c8da872`，plan `2026-06-05-003`）；v1.16 已落地（`provider-readiness.{md,schema.json}` + `setup-facts.js`，plan `2026-06-06-001`）；v1.17 phase 1 shadow producer 已落地，phase 2+ deferred；v2.0 未开始，归 live 父方案 `Phase F`。
> - **版本映射纠正（重要）**：本文 §"v1.14 = 六层 Knowledge Harness" / "v1.15 = File-First Memory" 是 2026-06-03 拆分前的 stale 标签。**权威映射为 v1.14 = Governance Lens Foundation、v1.15 = Knowledge Harness**（见 README 台账与 version-split 文档）。本文"无 governance 里程碑"是 stale-doc 假象，不是交付缺口——治理 lens 已作为 v1.14 落地。不要原地改本文版本号去假装它当时权威。
> - **实现期已自动纠正本文两处过度设计**，无需回填：① v1.11 的扁平 8-state 依赖枚举 → 落地为 `provider-readiness.schema.json` 的 `readiness_status` enum + 独立 `reason_code` 多字段模型；② v1.14 的"六层全栈落地" → 落地为 `docs/contracts/knowledge/knowledge-harness.md` 的轻量地图（只 gate L2/L4/L6，L5 advisory，L3 推后）。本文提出的 `out-of-scope-memory.v1`/`learning-candidate.v1`/`knowledge-recall-summary.v1`/`project-context-map.v1`/TF-IDF index 均**有意未落地**（避免第二真相源与 schema 增生），不应补建。
> - **origin 修正**：本文 frontmatter 原 `origin:` 指向的 `docs/09-业界借鉴/` 路径已失效，三份来源研究文档现位于 `docs/01-需求分析/13.scale-integration/bak/`（按该目录 README 仅作历史分析输入，非当前 source-of-truth），已在 frontmatter 同步修正。

## Summary

本路线图把 SCALE Engine、project-scaffold、scale-os-config-claude-code 的可借鉴能力，收敛为 spec-first 自有的 AI Coding Harness 演进计划。核心方向不是把 SCALE runtime、`.scale` 状态、SQLite memory、Graphify/CodeGraph provider 或 blocking gates 直接搬进 spec-first，而是按 spec-first 的 source-first、light contract、provider-advisory 边界，分版本吸收它们在分发、依赖安装、host runtime 投影、知识六层、记忆召回、optional codegraph/provider、tool/skill evidence 和多宿主 adapter 方面的工程经验。

路线图按“先可观察，再可安装；先文件化知识，再外部 provider；先 Claude/Codex 双宿主稳态，再平台化多宿主”的顺序推进。每个版本都必须独立可发布、可验证、可回滚，并且默认路径保持 minimal，不把外部依赖、provider facts 或 runtime hook 当成 truth。

## Problem Frame

当前 spec-first 已经完成了核心 workflow harness：PRD/plan/work/review/compound、source/runtime 边界、双宿主生成、direct source evidence、Changelog 和 docs/solutions 沉淀。但从三份研究文档看，SCALE 生态提供了几个 spec-first 仍可补强的系统面：

- **分发与依赖安装诚实性**：需要更清楚地区分 installed、configured、allowed、recommended、optional、unsupported、degraded、not-run。
- **runtime projection 可观察性**：`init/update/doctor/mcp-setup` 应输出 host capability、generated runtime self-test、must-run、自检和降级原因。
- **依赖安装 profile**：GBrain / Graphify / CodeGraph / MCP / browser tools 等能力确实能提高上限，但不能默认成为 minimal 路径或 confirmed truth。
- **知识六层体系**：项目上下文、Context Pack、记忆召回、代码理解、能力选择、沉淀治理需要统一语言和 source-first contracts。
- **记忆与知识升级**：spec-first 现有 `docs/solutions/`、`spec-sessions`、`spec-compound` 需要更强的 recall、conflict、freshness、out-of-scope 和 candidate-to-promote 机制。
- **多 host adapter 投影**：Claude/Codex 仍是核心宿主，但需要更明确的 capability matrix、permission/protected-path projection 和 generated runtime drift test；其他 host 只能进 platform profile 或 adapter contract，不进默认矩阵。
- **codegraph / knowledge provider 回归方式**：GitNexus active integration 已退役；未来 Graphify / CodeGraph / GBrain 只能以 optional provider readiness 和 advisory facts 形式重新进入，不恢复 graph provider truth。

## Goals

- 形成一条可发布的版本迭代路线，覆盖分发、依赖安装、知识、记忆、host adapter、Knowledge Harness、CodeGraph/Graphify/GBrain provider、verification profile 和 evidence governance。
- 将三份研究文档中的建议转成明确的 source 文件面、artifact/schema、consumer、验证方式和发布顺序。
- 保持 spec-first 的最小核心：默认不安装外部 provider，不手改 generated runtime，不把 `.scale` / provider DB / hook marker / graph index 当 truth。
- 让未来 `mcp-setup`、`doctor`、`init`、`update` 能清楚报告 “会调用什么、缺什么、装了什么、没跑什么、降级到什么”。
- 建立六层 Knowledge Harness 作为统一设计语言，逐步增强 context、memory、knowledge recall、code impact 和 compound。

## Non-Goals

- 不 vendoring SCALE Engine，不依赖 `@hongmaple0820/scale-engine` 作为 spec-first runtime。
- 不引入 `.scale/**` 作为 spec-first source-of-truth。
- 不恢复 GitNexus / graph-bootstrap active integration，不新增默认 graph provider。
- 不默认全局安装 GBrain、Graphify、CodeGraph、Agent Browser、Playwright MCP 或任何第三方 skill。
- 不引入 SQLite / better-sqlite3 memory brain、daemon、orchestrator reconciliation loop 或中心化状态机。
- 不把 Skill Radar、G0-G22 blocking gates、Stop hook marker、session verified marker 当作通用 workflow gate。
- 不把所有 host adapter 一次性纳入默认支持矩阵；默认仍聚焦 Claude + Codex。

## Source Context

| Origin | 关键输入 | 本路线图吸收 |
| --- | --- | --- |
| `docs/09-业界借鉴/scale-engine-能力清单与集成建议.md` | 42 模块能力矩阵、六层 Knowledge Harness、provider 安装 profile、RuntimeEvidenceLedger、OutOfScopeStore、ContextCompiler、RuleMaturity 等 | 提供总体架构、版本优先级和不搬边界 |
| `docs/09-业界借鉴/project-scaffold-依赖安装逻辑分析.md` | `bootstrap-scale` check-only / `-AutoInstall`、profile required tools、G0-G22 隐含依赖、host hooks、MCP、product-smoke、CodeGraph/Graphify fallback | 提供依赖安装、runtime configured dependency 和 verification profile 的具体形态 |
| `docs/09-业界借鉴/scale-os-config-claude-code-依赖安装面分析.md` | 7 MCP、177 skill registry、65 installable/112 reference、risk flags、GBrain/Graphify/CodeGraph 候选、runtime report、hook-required tools | 提供 skill registry metadata、install safety、provider profile 和 runtime capability report 的依据 |
| `docs/10-prompt/结构化项目角色契约.md` | Light contract / Explicit boundaries / Scripts prepare, LLM decides / Source-runtime boundary | 约束所有版本的取舍，不让 SCALE 融合演变成重型 engine |

## Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| R1 | `mcp-setup` / `doctor` / `init` 必须区分 check-only、install plan、explicit install、verify、consume、settle，不默认 silent write。 | project-scaffold / scale-os |
| R2 | 依赖报告必须覆盖 configured runtime MCP/hooks/commands，而不只列 package manager 或 MCP server。 | project-scaffold |
| R3 | provider 安装采用 `minimal` / `recommended` / `platform` profile；minimal 不装外部 provider。 | scale-engine / scale-os |
| R4 | provider facts 必须带 `advisory`、freshness、source、confidence、fallback_used；与源码/diff/tests 冲突时降级。 | scale-engine |
| R5 | skill/tool registry 只默认暴露 metadata，不把大量 SKILL 全文注入上下文。 | scale-os |
| R6 | host runtime projection 必须 source-first，generated runtime assets 只由 `spec-first init` 生成和验证。 | role contract / scale-os |
| R7 | 六层 Knowledge Harness 必须落成 spec-first 自有 docs/contracts/workflow lens，不引入 `.scale` provider truth。 | scale-engine |
| R8 | memory/knowledge 以 `docs/solutions/`、`spec-sessions`、git history、out-of-scope rationale、review/validation docs 为可审计 truth。 | scale-engine |
| R9 | CodeGraph/Graphify/GBrain 只能作为 optional provider 或 platform profile，不恢复 core graph workflow。 | all origins |
| R10 | verification profile 和 evidence ledger 要能记录 command、exit code、not-run reason、optional skipped、degraded fallback。 | project-scaffold / scale-os |
| R11 | 多 host adapter 先强化 Claude/Codex capability summary 与 policy projection，再设计 platform adapters。 | scale-engine / scale-os |
| R12 | 每个版本必须有 source/runtime drift、dual-host、contract/schema、package docs 和 CHANGELOG 验证。 | role contract |

## Architecture Principles

1. **SCALE as quarry, spec-first as owner**：SCALE 提供能力矿藏和样板，spec-first 只摘取算法、contract 和治理形态，用 CommonJS/source docs 重写。
2. **Default minimal, opt-in stronger**：默认路径不安装外部 provider；recommended/platform profile 可以强推荐或团队默认安装，但 facts 仍 advisory。
3. **Configured is not installed; installed is not trusted**：runtime 配置会调用某工具、工具已安装、provider 输出可信，是三个不同状态。
4. **File-first memory**：长期知识以 Markdown/JSON source artifacts 为主；外部 memory provider 只能补充召回，不直接 promote 项目规则。
5. **No hidden state machine**：verification profile、rule maturity、adapter capability 只产 facts 和 reason_code，不替代 LLM 判断。
6. **Provider failure is a first-class state**：missing、stale、partial、permission-denied、unsupported、fallback-used 都必须可见。
7. **Host-native, source-owned**：宿主权限、MCP、hooks、skills projection 由 source contract 生成，不能手写 runtime mirror 修 bug。

## Version Roadmap

### v1.11: Distribution & Dependency Readiness Baseline

**Theme:** 先解决 “安装了什么、缺什么、会调用什么、哪些没跑” 的诚实性。

**Scope:**

- 新增 runtime dependency readiness contract，覆盖 installed/configured/allowed/recommended/optional/unsupported/degraded/not-run。
- 强化 `spec-mcp-setup` 的 check-only 默认行为，install plan 与 apply 显式分离。
- 引入 provider install profile 文档：`minimal`、`recommended`、`platform`、`surface-ui`、`surface-data/security`。
- 扫描 host runtime 中实际配置的 MCP、hooks、commands，并报告 hidden dependencies。
- 扩展 generated runtime self-test：文件存在、JSON/TOML/Markdown 语法、脚本权限、hook command 可调度、dry-run 失败时非 0。

**Primary files:**

- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/mcp-tools.json`
- `skills/spec-mcp-setup/scripts/detect-tools.sh`
- `skills/spec-mcp-setup/scripts/detect-tools.ps1`
- `skills/spec-mcp-setup/scripts/verify-tools.sh`
- `skills/spec-mcp-setup/scripts/verify-tools.ps1`
- `skills/spec-mcp-setup/scripts/install-helpers.sh`
- `skills/spec-mcp-setup/scripts/install-helpers.ps1`
- `skills/spec-mcp-setup/scripts/write-setup-facts.sh`
- `skills/spec-mcp-setup/scripts/write-setup-facts.ps1`
- `docs/contracts/runtime-dependency-readiness.md`
- `docs/contracts/provider-install-profile.md`
- `docs/catalog/runtime-capabilities.md`
- focused unit/smoke tests under `tests/unit/` and `tests/smoke/`

**Artifacts / schemas:**

- `runtime-dependency-readiness.v1`: tool id, source, configured_by, install_status, configured_status, required_by, reason_code, fallback, install_command_preview, verify_command_preview.
- `provider-install-profile.v1`: profile id, provider set, install posture, write policy, privacy notes, trust boundary.

**Acceptance:**

- `spec-first doctor --claude|--codex` can report configured runtime dependencies without installing anything.
- `spec-mcp-setup` can explain missing provider vs missing runtime hook dependency.
- install plans include explicit commands and risks; install apply requires explicit user/profile selection.
- optional missing provider does not mark setup passed as provider-verified; it marks degraded/fallback.

### v1.12: Host Runtime Projection & Dual-Host Capability Matrix

**Theme:** 让 Claude/Codex runtime 生成物和宿主能力可观察、可验证、可降级。

**Scope:**

- 新增 host capability summary：hooks、permissions、MCP、skills、memory files、stop hook、command approvals、runtime generation support。
- 建立 source policy -> host projection lens：protected paths、dangerous commands、release/destructive operations、verified commands。
- 强化 `spec-first init` / `spec-first update` 的 generation report：source refs、generated files、unsupported surfaces、must-run checks、drift hints。
- 为 Claude/Codex 先建立 adapter capability contract；其他 host 只写 platform extension notes，不进入默认 runtime generation。

**Primary files:**

- `src/cli/commands/init.js`
- `src/cli/commands/doctor.js`
- `src/cli/commands/clean.js`
- `src/cli/commands/internal.js`
- `src/cli/runtime-tools-index.js` or successor source module if retained by current branch
- `src/cli/contracts/dual-host-governance/**`
- `docs/contracts/dual-host-governance/README.md`
- `docs/contracts/source-runtime-customization-boundary.md`
- `docs/contracts/context-governance.md`
- `templates/`
- `CLAUDE.md`
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`

**Artifacts / schemas:**

- `host-capability-summary.v1`: host, supported_capabilities, unsupported_capabilities, degraded_reason, generated_assets, source_refs.
- `runtime-generation-report.v1`: source slice, generated runtime paths, must_run, not_run, unsupported, drift risk.
- `host-policy-projection.v1`: source policy id, host expression, projection support, unsupported reason.

**Acceptance:**

- `doctor` can say “Codex lacks/has X” without assuming Claude Code behavior.
- `init` reports generated runtime assets and self-test results.
- source/runtime drift tests prove no hand-edited `.claude/`, `.codex/`, `.agents/skills/` changes are required.

### v1.13: Skill / Tool Registry Metadata & Verification Profile Contract

**Theme:** 借 SCALE 的 skill registry 和 verification profile，但只作为 metadata 和 evidence lens。

**Scope:**

- 建立 first-party skill/agent registry metadata contract：id、category、tier、trigger、source、risk、install_safety、recommended_action。
- 现有 `skills/`、`agents/` 先生成或校验 metadata；第三方 skill 只进入 optional registry。
- 扩展 workflow closeout / reviewer handoff：skills/tools considered、used、not-run、fallback、output summary。
- 引入 optional verification profile contract：service/check/command/required_tools/optional_tools/not-run reason；不与 package scripts 争 truth。
- 吸收 dry-run 反例：dry-run 发现不可调度必须 failed；dry-run 不等于业务验证。

**Primary files:**

- `docs/contracts/workflows/skill-agent-quality-governance.md`
- `src/cli/contracts/dual-host-governance/skills-governance.json`
- `src/cli/contracts/dual-host-governance/skills-governance.schema.json`
- `src/cli/contracts/dual-host-governance/agents-governance.json`
- `src/cli/contracts/dual-host-governance/agents-governance.schema.json`
- `skills/spec-work/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-doc-review/SKILL.md`
- `skills/spec-plan/SKILL.md`
- `skills/spec-mcp-setup/SKILL.md`
- `docs/contracts/verifiers/verification-evidence.schema.json`
- focused tests under `tests/unit/`

**Artifacts / schemas:**

- `skill-tool-registry-metadata.v1`
- `tool-skill-evidence.v1`
- `verification-profile.v1`
- `verification-run-summary.v1`

**Acceptance:**

- A workflow final summary can distinguish “tool available”, “tool selected”, “tool executed”, “tool skipped”, and “tool unavailable”.
- Third-party install commands are never executed from metadata alone.
- required vs optional verification checks have distinct outcome semantics.

### v1.14: Six-Layer Knowledge Harness Contract

**Theme:** 把 SCALE `知识相关.md` 的六层体系写成 spec-first 的统一知识协作语言。

**Scope:**

- 新增 `docs/contracts/knowledge-harness.md`，定义六层：项目上下文/术语、Context Pack/预算、记忆召回/冲突、代码理解/影响、能力选择/Agent 路由、沉淀治理/知识升级。
- 更新 `docs/contracts/ai-coding-harness.md`、`docs/contracts/context-bundle.md`、`docs/contracts/domain-glossary.md`，让六层与既有 Codebase -> Context -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge 对齐。
- 为 `spec-prd`、`spec-plan`、`spec-work`、`spec-debug`、`spec-code-review`、`spec-compound` 增加六层读写纪律说明。
- 引入 project context map pattern，但不要求固定 `CONTEXT.md`；缺失只作为 advisory gap。

**Primary files:**

- `docs/contracts/knowledge-harness.md`
- `docs/contracts/ai-coding-harness.md`
- `docs/contracts/context-bundle.md`
- `docs/contracts/domain-glossary.md`
- `docs/workflow-skill-agent-map.md`
- `skills/using-spec-first/SKILL.md`
- `skills/spec-prd/SKILL.md`
- `skills/spec-plan/SKILL.md`
- `skills/spec-work/SKILL.md`
- `skills/spec-debug/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-compound/SKILL.md`

**Artifacts / schemas:**

- `knowledge-harness-lens.v1`: layer, source refs, consumers, authority, fallback, not-run/degraded reason.
- `project-context-map.v1` as optional advisory pattern, not required project file.

**Acceptance:**

- Each workflow knows which layers it reads and which layers it may write.
- Long-term knowledge writes are limited to ship/compound/review-backed moments.
- No workflow requires `.scale/GLOSSARY.md`, SQLite memory, or external provider availability.

### v1.15: File-First Memory Recall, Conflict, And Promotion

**Theme:** 加强 spec-first 自己的记忆，不靠外部 memory brain 成为 truth。

**Scope:**

- 引入 out-of-scope / rejected rationale markdown store，减少重复争论和 scope creep。
- 为 `docs/solutions/`、session history、git history、review/validation docs 建立 recall summary：provenance、freshness、confidence、conflict。
- 引入 TF-IDF / keyword baseline 改进 docs/solutions recall，但结果仍 advisory。
- 建立 candidate -> review -> promote 机制：session fact 不能自动成为 project rule。
- `spec-compound-refresh` 消费 stale/conflict signals，清理过时知识。

**Primary files:**

- `skills/spec-sessions/SKILL.md`
- `skills/spec-compound/SKILL.md`
- `skills/spec-compound-refresh/SKILL.md`
- `skills/spec-debug/SKILL.md`
- `skills/spec-plan/SKILL.md`
- `agents/spec-learnings-researcher.agent.md`
- `agents/spec-session-historian.agent.md`
- `agents/spec-git-history-analyzer.agent.md`
- `docs/solutions/`
- `docs/contracts/sessions/spec-first-session.md`
- new contract docs for out-of-scope and knowledge recall if needed
- focused tests under `tests/unit/`

**Artifacts / schemas:**

- `knowledge-recall-summary.v1`: source, freshness, confidence, conflict, relevance reason, fallback.
- `out-of-scope-memory.v1`: concept, reason, source refs, prior requests, last_seen.
- `learning-candidate.v1`: observation, evidence, suggested destination, promotion status.

**Acceptance:**

- Planning/debug can surface relevant past learnings without treating them as confirmed current truth.
- Conflicting learnings are visible and routed to refresh/review, not silently newest-wins.
- Out-of-scope rationale is recoverable and cites its source.

### v1.16: Optional Provider Pack For GBrain / Graphify / CodeGraph

**Theme:** 让强能力以 optional provider 形式进入，而不是恢复默认 graph/provider truth。

**Scope:**

- 在 `spec-mcp-setup` 中定义 provider readiness adapters for memory/code providers as optional profile entries.
- Provider pack 支持 GBrain 或等价 memory provider、Graphify artifact、CodeGraph CLI；具体 provider 可 unavailable。
- 输出 provider install plan：benefit、cost、privacy、write_policy、install_command_preview、verify_command_preview、rollback_hint。
- Provider verify 必须确认 CLI/MCP 可用、index freshness、current repo access、commit/hash alignment 或明确 stale。
- Workflow consumption 只接受 provider orientation facts；关键结论仍需要 direct source/diff/test evidence。

**Primary files:**

- `skills/spec-mcp-setup/mcp-tools.json`
- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/scripts/detect-tools.*`
- `skills/spec-mcp-setup/scripts/install-helpers.*`
- `skills/spec-mcp-setup/scripts/verify-tools.*`
- `docs/contracts/provider-install-profile.md`
- `docs/contracts/provider-readiness.md`
- `skills/spec-plan/SKILL.md`
- `skills/spec-work/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-debug/SKILL.md`

**Artifacts / schemas:**

- `provider-readiness.v1`: provider, available, configured, freshness, current_repo_aligned, confidence, failure_class, fallback_used.
- `provider-install-plan.v1`: install command preview, risk flags, source reputation, rollback hint, explicit approval required.

**Acceptance:**

- Minimal profile reports provider missing as non-blocking.
- Recommended profile can propose one-click install but does not execute without explicit selection.
- Platform profile can mark provider expected, but provider facts remain advisory.
- CodeGraph/Graphify stale or unavailable never turns into a false “impact checked” claim.

### v1.17: Evidence, Evaluation, And Rule Maturity Layer

**Theme:** 借 SCALE 的 RuntimeEvidenceLedger、HonestDelivery、RuleMaturity 等确定性能力，提升交付可信度。

**Scope:**

- 引入 runtime evidence ledger for commands/tools/model outputs with redaction.
- Final closeout lens 区分 completed / verified / unverified / blocked / not-run。
- Command output compressor 提供长日志 failure signature 和 reviewer handoff 摘要。
- Diff test selector 建议最窄验证命令，但 LLM 仍说明选择原因。
- Rule maturity：新 detector 默认 shadow，只有有误报率/证据/人工批准才可升级 blocking。
- Behavior detectors first batch: dangerous dependency addition、empty catch、hardcoded secret、silent failure、dry-run false positive。

**Primary files:**

- `docs/contracts/artifact-summary.md`
- `docs/contracts/verifiers/verification-evidence.schema.json`
- `docs/contracts/workflows/spec-work-run-artifact.schema.json`
- `skills/spec-work/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-debug/SKILL.md`
- `src/cli/contracts/quality-gates/**`
- `src/cli/contracts/security/**`
- `tests/unit/**`

**Artifacts / schemas:**

- `runtime-evidence-ledger.v1`
- `honest-delivery-summary.v1`
- `rule-maturity.v1`
- `command-output-summary.v1`
- `affected-test-selection.v1`

**Acceptance:**

- Final responses and PR handoffs cannot conflate dry-run/skipped with verified.
- Evidence text is redacted before durable storage.
- New rules start advisory and include false-positive tracking before any blocking behavior.

### v2.0: Platform Profile And Multi-Host Adapter Expansion

**Theme:** 在 minimal/recommended 稳定后，提供企业级 platform profile，而不是扩大默认核心。

**Scope:**

- 将 Claude/Codex adapter contract generalize 为 host adapter interface：capabilities、runtime assets、permissions, hooks, MCP, skills, memory, self-test, unsupported reason。
- 其他 host adapters 只在 platform profile 下进入 registry，例如 Aider/Windsurf/Devin 类 projection notes；不默认生成。
- Org/project profile 支持默认 provider pack、permission policy、verification profile、skill registry subset。
- 加入 cost/usage/adoption ledger 作为 platform optional。
- 提供 migration guide：从 minimal 到 recommended/platform 的显式步骤和 rollback。

**Primary files:**

- `src/cli/contracts/dual-host-governance/**`
- `docs/contracts/dual-host-governance/README.md`
- `docs/contracts/platform-profile.md`
- `src/cli/commands/init.js`
- `src/cli/commands/doctor.js`
- `skills/spec-mcp-setup/**`
- `skills/spec-update/SKILL.md`
- `README.md`
- `README.zh-CN.md`

**Artifacts / schemas:**

- `host-adapter-capability.v1`
- `platform-profile.v1`
- `org-provider-policy.v1`
- `runtime-projection-drift.v1`

**Acceptance:**

- Claude/Codex stay first-class and tested.
- Platform adapters are discoverable but not generated by default.
- Profile rollback can remove generated optional assets without touching source truth.

## Implementation Units

### U0. Roadmap Contract And Traceability

**Goal:** Keep this roadmap as the governing plan until a PRD supersedes it.

**Files:**

- `docs/plans/2026-06-03-003-feat-scale-engine-fusion-roadmap-plan.md`
- `CHANGELOG.md`

**Verification:**

- Plan references only repo-relative paths.
- Future tasks either cite this plan or supersede it with a narrower PRD/plan.

### U1. Dependency Readiness Contract

**Goal:** Define how setup/doctor reports dependencies without installing them.

**Files:**

- `docs/contracts/runtime-dependency-readiness.md`
- `docs/contracts/provider-install-profile.md`
- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/scripts/detect-tools.*`
- `skills/spec-mcp-setup/scripts/verify-tools.*`

**Test Scenarios:**

- Missing optional provider yields degraded/fallback, not failure.
- Configured runtime hook dependency missing yields configured-required missing.
- Allowed command not installed is reported as allowed-only, not installed.
- `--install` absent means no package manager command runs.

### U2. Install Plan / Apply / Verify Split

**Goal:** Make provider/helper installation preview-first and auditable.

**Files:**

- `skills/spec-mcp-setup/scripts/install-helpers.*`
- `skills/spec-mcp-setup/scripts/install-mcp.*`
- `skills/spec-mcp-setup/scripts/repair-install.*`
- `skills/spec-mcp-setup/SKILL.md`
- `docs/contracts/provider-install-profile.md`

**Test Scenarios:**

- Install plan serializes command preview and risk flags.
- Global npm/pip/go install requires explicit profile or flag.
- Failed verify after install records failure_class and rollback_hint.

### U3. Runtime Projection Report And Self-Test

**Goal:** Every runtime generation/check reports what it wrote, what it could not support, and what must be verified.

**Files:**

- `src/cli/commands/init.js`
- `src/cli/commands/doctor.js`
- `src/cli/commands/clean.js`
- `docs/catalog/runtime-capabilities.md`
- `docs/contracts/source-runtime-customization-boundary.md`

**Test Scenarios:**

- Claude and Codex generated asset lists are distinct and source-owned.
- Broken generated script permission or malformed JSON fails self-test.
- Unsupported host capability appears with reason_code, not hidden.

### U4. Skill/Tool Registry Metadata

**Goal:** Provide progressive disclosure for skills/tools without loading huge lists.

**Files:**

- `docs/contracts/workflows/skill-agent-quality-governance.md`
- `src/cli/contracts/dual-host-governance/skills-governance.*`
- `src/cli/contracts/dual-host-governance/agents-governance.*`
- `skills/retired-skill-review/SKILL.md`
- `tests/unit/skill-agent-quality-governance-contracts.test.js`

**Test Scenarios:**

- Registry entry with installer-script/global-install risk requires manual-review.
- Missing trigger/source metadata fails lint.
- Runtime closeout can cite used/skipped skill evidence without loading full skill body.

### U5. Verification Profile And Evidence Summary

**Goal:** Make project validation commands and not-run states explicit.

**Files:**

- `docs/contracts/verifiers/verification-evidence.schema.json`
- `skills/spec-work/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-doc-review/SKILL.md`
- `docs/contracts/artifact-summary.md`

**Test Scenarios:**

- Required check skipped is failure/not-run, optional check skipped is warning/degraded.
- Dry-run output cannot be represented as passed business verification.
- Verification evidence carries command, exit code, artifact path, and limitation.

### U6. Knowledge Harness Six-Layer Docs

**Goal:** Codify the six-layer knowledge model as source docs and workflow posture.

**Files:**

- `docs/contracts/knowledge-harness.md`
- `docs/contracts/ai-coding-harness.md`
- `docs/contracts/context-bundle.md`
- `docs/contracts/domain-glossary.md`
- `docs/workflow-skill-agent-map.md`
- workflow SKILL files listed in v1.14

**Test Scenarios:**

- Contract tests assert each public workflow maps to read/write layers.
- No doc claims provider facts are confirmed truth.
- Missing project context map is advisory, not blocker.

### U7. File-First Recall And Promotion

**Goal:** Strengthen durable memory without adding SQLite/provider truth.

**Files:**

- `skills/spec-sessions/SKILL.md`
- `skills/spec-compound/SKILL.md`
- `skills/spec-compound-refresh/SKILL.md`
- `agents/spec-learnings-researcher.agent.md`
- `agents/spec-session-historian.agent.md`
- `agents/spec-git-history-analyzer.agent.md`

**Test Scenarios:**

- Conflicting learnings produce conflict state and refresh recommendation.
- Out-of-scope rationale can be recalled with provenance.
- Learning candidate cannot promote without evidence destination and review state.

### U8. Optional Provider Readiness

**Goal:** Reintroduce memory/code providers only as optional advisory capability.

**Files:**

- `skills/spec-mcp-setup/mcp-tools.json`
- `skills/spec-mcp-setup/SKILL.md`
- `docs/contracts/provider-readiness.md`
- relevant workflow SKILL files consuming provider facts

**Test Scenarios:**

- Minimal profile has no external provider install step.
- Recommended profile proposes but does not execute provider install.
- Provider stale commit/hash results in stale-advisory, not confirmed impact.
- Direct source evidence overrides provider summary.

### U9. Host Adapter Contract Expansion

**Goal:** Prepare platform multi-host projection without expanding default runtime surface.

**Files:**

- `docs/contracts/dual-host-governance/README.md`
- `src/cli/contracts/dual-host-governance/**`
- `docs/contracts/platform-profile.md`
- `README.md`
- `README.zh-CN.md`

**Test Scenarios:**

- Claude/Codex remain required validated hosts.
- Other adapters are registry entries only unless platform profile selected.
- Unsupported capability is explicit and does not block unrelated workflows.

## Cross-Version Dependencies

| Depends on | Enables |
| --- | --- |
| v1.11 dependency readiness | v1.16 provider install/readiness, v2.0 platform profile |
| v1.12 host capability summary | v1.13 skill registry closeout, v2.0 adapter expansion |
| v1.13 tool/skill evidence | v1.17 honest delivery and runtime evidence ledger |
| v1.14 six-layer docs | v1.15 memory recall and v1.16 provider consumption |
| v1.15 file-first memory | v1.16 external memory provider boundary |
| v1.17 rule maturity | any future blocking guardrail |

## Verification Strategy

Every version must run the narrowest relevant checks, then broaden when source/runtime or package surface changes:

- Docs/contracts only: `git diff --check`, focused `rg` residual checks, relevant contract tests.
- Skill/agent prose: source contract tests plus fresh-source eval when behavior semantics changed and dispatch is available; otherwise record not-run reason.
- CLI/schema changes: `npm run typecheck`, focused Jest/shell tests, schema validation.
- Runtime generation changes: `spec-first init` for affected host in a disposable fixture or temp project, then `spec-first doctor --claude|--codex`.
- `mcp-setup` changes: `npm run test:mcp-setup` plus Bash/PowerShell parity where scripts changed.
- Release/package surface changes: `npm run build`, tarball/package negative and positive assertions.
- Any generated runtime expected change: prove source changed first; do not hand-edit `.claude/`, `.codex/`, `.agents/skills/`.

## Release And Migration Policy

- v1.11-v1.13 should be additive and default-off/default-check-only where possible.
- v1.14-v1.15 may update workflow prose and docs contracts; this is user-visible but should not require runtime reinstall beyond normal `spec-first init`.
- v1.16 provider pack must remain opt-in and clearly experimental until provider stale/failure semantics are proven.
- v1.17 evidence/rule maturity can add advisory checks first; blocking behavior requires a later PRD with false-positive data.
- v2.0 platform profile should be announced as an advanced mode, not a replacement for minimal.
- Every release must update `CHANGELOG.md`, `README.md` / `README.zh-CN.md` when user-visible, and relevant `docs/contracts/**`.

## Key Technical Decisions

### D1. 是否直接融合 SCALE Engine runtime？

- recommended_answer: No.
- chosen_answer: No.
- source_tag: confirmed from role contract and research docs.
- consequence: spec-first keeps ownership of CLI, skills, contracts, and runtime generation; SCALE remains design input.

### D2. 是否默认安装 GBrain / Graphify / CodeGraph？

- recommended_answer: Minimal no; recommended/profile can propose; platform can default with explicit policy.
- chosen_answer: Profile-based.
- source_tag: advisory from three research docs, aligned with role contract.
- consequence: users can get stronger onboarding, but provider facts never become truth.

### D3. 是否恢复 codegraph as core workflow dependency？

- recommended_answer: No.
- chosen_answer: No.
- source_tag: confirmed by GitNexus removal direction and provider-advisory boundary.
- consequence: codegraph returns only as optional orientation provider with freshness/fallback.

### D4. 是否扩展 beyond Claude/Codex host adapters？

- recommended_answer: Not in default core; design platform adapter contract first.
- chosen_answer: Claude/Codex first, platform registry later.
- source_tag: role contract + scale-engine adapter analysis.
- consequence: avoids exploding runtime test matrix while preserving future extensibility.

### D5. 长期 memory 写入由谁决定？

- recommended_answer: LLM/workflow proposes candidate; deterministic scripts validate shape; human/review or compound workflow promotes.
- chosen_answer: candidate -> review -> promote.
- source_tag: role contract, six-layer Knowledge Harness.
- consequence: prevents session guesses and provider summaries from becoming durable project rules.

## Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| 过度融合导致 spec-first 变成 SCALE clone | 架构失焦、依赖膨胀 | 每个版本列 Non-Goals；不得引入 `.scale` truth、daemon、SQLite memory |
| provider install 被误解为 provider truth | 错误影响分析或错误记忆 | provider readiness artifact 强制 advisory/freshness/fallback fields |
| runtime hooks 隐含依赖未进入 setup report | 用户遇到无法解释的 hook 失败 | v1.11 扫 configured MCP/hooks/commands |
| 多 host adapter 扩张破坏双宿主稳定 | 测试矩阵失控 | v2.0 前只做 platform registry，不默认生成 |
| verification profile 与 package scripts 形成双 truth | 用户不知道该跑哪个 | profile 只引用/发现项目命令，必须记录 source 和 not-run |
| registry metadata 变成上下文噪声 | 启动 token 和判断质量下降 | 默认只加载 metadata，按 trigger 读取详情 |
| rule detector 误报变 blocking | 工作流摩擦上升 | RuleMaturity shadow -> candidate -> approved-blocking |

## Deferred Work

- 是否为 provider registry 提供正式 marketplace UX。
- 是否引入向量检索或 RAG；v1.15 只做 TF-IDF/keyword baseline。
- 是否支持 org-level remote policy distribution；v2.0 只规划 platform profile。
- 是否把 browser/UI tools 纳入 default recommended profile；先保留 surface-ui opt-in。
- 是否做 cost/usage ledger；仅 platform optional。

## Handoff

建议下一步：先对本路线图运行 `spec-doc-review`，再把 v1.11 拆成更窄的可执行 task pack 或 implementation plan。

实施应从 v1.11 的 U1-U3 开始。v1.11 dependency readiness 与 v1.14 Knowledge Harness contracts 合并前，不启动 v1.16 provider 安装/接入工作。
