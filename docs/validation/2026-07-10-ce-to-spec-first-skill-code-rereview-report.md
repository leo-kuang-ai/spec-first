# CE 到 Spec-First Skill 迁移代码重新审查报告

## 结论

本报告是针对当前 source snapshot 的独立重新审查，不追加、不改写 2026-07-09 历史报告。当前 35 个 source skill 均已完成审查且 verdict 为 `pass`。本轮确认的 3 个 `spec-mcp-setup` medium finding 已逐项修复，并由 config consumer、五宿主 provider routing、Bash/PowerShell parity focused tests 覆盖。

审查工作与修复均已完成。关闭条件通过人工 deterministic checklist 复核，但仓库不保留只服务本报告的一次性 validator，因此按方案诚实标记 `report_status=complete_degraded`、`verification_gate=degraded`、`release_readiness=conditional_pass`；这不表示仍有 skill finding。

## 元数据

- schema_version: `ce-to-spec-first-skill-code-rereview-report.v1`
- producer: `Codex goal execution`
- report_status: `complete_degraded`
- release_readiness: `conditional_pass`
- verification_gate: `degraded`
- authority_level: `mixed`
- review_type: `fresh_current_snapshot_rereview`
- plan: `docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-plan.md`
- role_contract: `docs/10-prompt/结构化项目角色契约.md`
- CE baseline commit: `fc0395b8c09331808e30e4a2f4cf27342d684d81`
- CE snapshot method: `git_show`；commit object 已用 `git cat-file -e 'fc0395b8^{commit}'` 确认
- spec_first_head: `79727a2d76444c2e46f4c57f7b6e4d3a78be5141`
- worktree_status_digest: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`（审查输入时 clean）
- source_manifest: `docs/validation/2026-07-10-ce-to-spec-first-skill-code-rereview-source-manifest.md`
- source_manifest_hash: `9d61bf213568b7b81a9bb8cc4e3bd637b9175646befe1067104359e7da7198a4`
- source_inventory: 35 个 skill，439 个 tracked `skills/**` 文件
- completed_at: `2026-07-10 23:55:00 CST`
- consumers: migration maintainers、skill owners、release review、后续 `spec-mcp-setup` 重构
- dispatch_limitations: `dispatch_authorization_missing`；未启动 subagent/reviewer dispatch，采用 orchestrator bounded source review
- limitations: 旧审查报告只作为 advisory 历史线索，不作为本报告当前 verdict；未运行真实外部服务、浏览器、IDE、MCP 或各宿主 mutation。关闭 checklist 由当前审查手工执行，缺少 durable machine validator，不能把 verification gate 声称为 confirmed。

## Goals / Non-Goals

Goals:

- 按当前 HEAD 重新审查全部 35 个 source skill。
- 固定 CE commit object，避免当前 CE 工作副本造成 false parity / false drift。
- 重新验证依赖、artifact、mode/config、共享脚本、上下文排除、安全与测试出口。
- 输出独立、可恢复、带 source manifest 的 rereview artifact。

Non-Goals:

- 不修改 `skills/**` 或 generated runtime mirrors。
- 不把历史报告的 finding 状态直接当作当前事实。
- 不在本轮静默修复 `spec-mcp-setup` finding。
- 不用脚本替代 LLM 对语义充分性的判断。

## Source / Runtime 与判断边界

- Source of truth: `skills/`、相关 `src/cli/contracts/**`、tests、当前 docs contracts。
- Generated/runtime: `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/`；本轮未修改。
- Scripts/tools 负责 commit/blob/hash、syntax、test、scan、exit code 等确定性事实。
- LLM 负责 parity divergence、artifact/handoff 充分性、finding 严重度与 release readiness 判断。
- provider/tool facts 只作 advisory；未把 provider 输出当 confirmed source truth。

## Provenance Gate 与重新审查方法

- 2026-07-08 parity 报告缺少完整 CE/spec-first commit、dirty digest 与逐文件 inventory，按方案只作 advisory，不用于降低 Tier。
- 2026-07-09 历史审查报告保留为独立历史 artifact；本报告没有向其追加内容。
- 当前 rereview 以固定 CE commit、当前 439-file source manifest、当前 focused contracts、全量自动化扫描和当前 git delta 为直接证据。
- 从历史报告最后一次 source 收口提交 `02819ef5` 到当前 HEAD，只有 `spec-prd` 的 `SKILL.md`、`references/prd-output-template.md`、`scripts/check-prd-artifact.js` 发生 skill source 漂移；该 skill 已执行当前-source 深审、23 项 focused tests 与 111-case eval。其余 skill 通过当前 blob freshness、当前 source reads、focused contracts 与全局交叉验证重新确认。

## 审查进度

| Skill | Migration risk | User/chain impact | Tier | Status | Verdict | Source hash | Last updated | Notes |
|---|---|---|---|---|---|---|---|---|
| spec-test-xcode | aligned | medium | B | done | pass | `e3d6b9c0f48b` | 2026-07-10 23:38:51 CST | CE 投影与下游 review 引用一致 |
| spec-polish | aligned | medium | B | done | pass | `ee0d36c74cd8` | 2026-07-10 23:38:51 CST | dev-server 兼容路径已分类，不把 runtime config 当 source |
| spec-explain | aligned | medium | B | done | pass | `1252a585aac4` | 2026-07-10 23:38:51 CST | 共享 repo-profile 资产 parity 通过 |
| spec-pov | aligned | medium | B | done | pass | `7d963f466ef3` | 2026-07-10 23:38:51 CST | 共享 repo-profile 资产 parity 通过 |
| spec-dogfood | aligned | high | A | done | pass | `05ee1b849be7` | 2026-07-10 23:38:51 CST | worktree/debug/compound handoff 当前一致 |
| spec-strategy | aligned | medium | B | done | pass | `0f45f0fab031` | 2026-07-10 23:38:51 CST | 低差异迁移，无当前 finding |
| spec-simplify-code | aligned | medium | B | done | pass | `bb0fb5031042` | 2026-07-10 23:38:51 CST | 低差异迁移，无当前 finding |
| spec-commit | aligned | high | A | done | pass | `75fa3704613a` | 2026-07-10 23:38:51 CST | mutation、branch/ref 与 commit-message 安全边界通过 |
| spec-commit-push-pr | repaired | high | A | done | pass | `c28b44b2a5f8` | 2026-07-10 23:38:51 CST | pipeline 与 concept trailer producer/consumer 当前一致 |
| spec-optimize | repaired | medium | A | done | pass | `98069707187b` | 2026-07-10 23:38:51 CST | schema validation 与 bounded judge dispatch 当前一致 |
| spec-promote | aligned | medium | B | done | pass | `de9ea4d85766` | 2026-07-10 23:38:51 CST | config/optional helper 边界通过 |
| spec-proof | aligned | medium | B | done | pass | `60846a0a1354` | 2026-07-10 23:38:51 CST | Publish Mode 与 HITL 增强边界清晰 |
| spec-resolve-pr-feedback | repaired | high | A | done | pass | `5fe5f7222166` | 2026-07-10 23:38:51 CST | helper path、prompt asset、thread verification 当前一致 |
| spec-test-browser | aligned | high | A | done | pass | `b0580a1f508a` | 2026-07-10 23:38:51 CST | pipeline no-ask 与 internal-only contract 通过 |
| spec-worktree | repaired | high | A | done | pass | `9922e1b4b560` | 2026-07-10 23:38:51 CST | existing-ref/PR isolate 与 git containment 通过 |
| spec-debug | partial | high | A | done | pass | `82e9ffe54919` | 2026-07-10 23:38:51 CST | debug flow、shared cache 与 evidence handoff 通过 |
| spec-compound | repaired | high | A | done | pass | `f198e3f45e02` | 2026-07-10 23:38:51 CST | knowledge schema/template/UTF-8 validator 当前一致 |
| spec-compound-refresh | repaired | high | A | done | pass | `b5682a1f222e` | 2026-07-10 23:38:51 CST | knowledge lifecycle 与 shared validators 当前一致 |
| spec-sweep | repaired | high | A | done | pass | `f2b889442ec8` | 2026-07-10 23:38:51 CST | state/config/ack/plan handoff 当前一致 |
| spec-mcp-setup | near-parity | high | A | done | pass | `ac071f2e1306` | 2026-07-10 23:55:00 CST | config consumer matrix 与 Cursor provider/Graphify routing 已修复并测试 |
| spec-riffrec-feedback-analysis | repaired | medium | A | done | pass | `1a4f373ad5c3` | 2026-07-10 23:38:51 CST | durable plan/evidence path 当前一致 |
| spec-product-pulse | repaired | medium | A | done | pass | `36c484289a8d` | 2026-07-10 23:38:51 CST | 固定 top-5 report contract 当前一致 |
| spec-brainstorm | repaired | high | A | done | pass | `c5b3a8f863aa` | 2026-07-10 23:38:51 CST | requirements-only unified plan producer 与 shared cache 通过 |
| spec-plan | replaced | high | A | done | pass | `e9c499afd74f` | 2026-07-10 23:38:51 CST | artifact enrichment、handoff 与 intentional Fable divergence 已锁定 |
| spec-doc-review | repaired | high | A | done | pass | `9c96304d27f7` | 2026-07-10 23:38:51 CST | missing-document gate、persona isolation 与 findings schema 通过 |
| spec-code-review | repaired | high | A | done | pass | `daee8ff2802d` | 2026-07-10 23:38:51 CST | scope/modes/validators/artifacts 与 deployment criteria 通过 |
| spec-work | replaced | high | A | done | pass | `88b6e225243e` | 2026-07-10 23:38:51 CST | plan intake、active-unit context、return envelope 与 shipping boundary 通过 |
| spec-ideate | repaired | high | A | done | pass | `51db12a79c4a` | 2026-07-10 23:38:51 CST | artifact routing、fleet context 与 config consumer 通过 |
| spec-lfg | replaced | high | A | done | pass | `da2c712448b5` | 2026-07-10 23:38:51 CST | 全 pipeline mode/envelope 与下游合同通过 |
| spec-prd | native | high | A | done | pass | `5de11ef4c075` | 2026-07-10 23:38:51 CST | 本轮唯一 source drift；模板路由与 Decision Card checker 深审通过 |
| spec-write-tasks | native | high | A | done | pass | `e55a8c4e45b9` | 2026-07-10 23:38:51 CST | task-pack contract、validator 与 eval fixture 通过 |
| using-spec-first | native | high | A | done | pass | `537d36b6ad12` | 2026-07-10 23:38:51 CST | 入口治理、source/runtime/evidence/dispatch 边界通过 |
| spec-write-skill | native | high | A | done | pass | `34ed460409b6` | 2026-07-10 23:38:51 CST | source skill authoring 与 delivery gates 通过 |
| spec-app-consistency-audit | native | medium | C | done | pass | `e39fd92e91aa` | 2026-07-10 23:38:51 CST | 五宿主 generated/control boundary 通过 |
| spec-rule-miner | native | medium | C | done | pass | `f071292e9c0f` | 2026-07-10 23:38:51 CST | source evidence、preview/write 与 runtime exclusion 通过 |

## Tier A / 高影响维度 Checkpoint

执行合并规则：D15 并入 D3，D13 共享资产并入 D6，D22 常驻预算并入 D16。D14b 仅适用于 `spec-mcp-setup`；native skill 的 CE parity 为 N/A，但当前产品行为与治理维度仍深审。

| Skill | D1-4 | D5-14 | D14b | D15-22 | Verdict |
|---|---|---|---|---|---|
| spec-dogfood | done | done | not_applicable | done | pass |
| spec-commit | done | done | not_applicable | done | pass |
| spec-commit-push-pr | done | done | not_applicable | done | pass |
| spec-optimize | done | done | not_applicable | done | pass |
| spec-resolve-pr-feedback | done | done | not_applicable | done | pass |
| spec-test-browser | done | done | not_applicable | done | pass |
| spec-worktree | done | done | not_applicable | done | pass |
| spec-debug | done | done | not_applicable | done | pass |
| spec-compound | done | done | not_applicable | done | pass |
| spec-compound-refresh | done | done | not_applicable | done | pass |
| spec-sweep | done | done | not_applicable | done | pass |
| spec-mcp-setup | done | done | done | done | pass |
| spec-riffrec-feedback-analysis | done | done | not_applicable | done | pass |
| spec-product-pulse | done | done | not_applicable | done | pass |
| spec-brainstorm | done | done | not_applicable | done | pass |
| spec-plan | done | done | not_applicable | done | pass |
| spec-doc-review | done | done | not_applicable | done | pass |
| spec-code-review | done | done | not_applicable | done | pass |
| spec-work | done | done | not_applicable | done | pass |
| spec-ideate | done | done | not_applicable | done | pass |
| spec-lfg | done | done | not_applicable | done | pass |
| spec-prd | D1 N/A；D2-4 done | done | not_applicable | done | pass |
| spec-write-tasks | D1 N/A；D2-4 done | done | not_applicable | done | pass |
| using-spec-first | D1 N/A；D2-4 done | done | not_applicable | done | pass |
| spec-write-skill | D1 N/A；D2-4 done | done | not_applicable | done | pass |

## 全局依赖与 Artifact 图谱

主链路重新确认：

```text
spec-brainstorm -> spec-plan -> spec-write-tasks -> spec-work -> spec-code-review -> spec-compound

spec-lfg
  -> spec-work mode:return-to-caller
  -> spec-simplify-code
  -> spec-code-review mode:agent
  -> spec-test-browser mode:pipeline
  -> spec-commit-push-pr mode:pipeline
```

- Plan artifact: `spec-unified-plan/v1` 的 requirements-only -> implementation-ready -> task pack -> work intake 字段当前匹配。
- Knowledge lifecycle: `spec-compound` / `spec-compound-refresh` schema、validators 与 consumers 的 advisory trust boundary 当前匹配。
- Review handoff: `spec-work` 与 `spec-lfg` 消费 `spec-code-review mode:agent` JSON/report-only contract；apply/shipping ownership 未泄漏回 review。
- Pipeline modes: `mode:return-to-caller`、`mode:agent`、`mode:pipeline` 的 caller/callee 语义由当前 focused contracts覆盖。
- Shared assets: 9 份 `repo-profile-cache.py`、`repo-profile-cache.md`、`repo-profiler.md` 当前 byte parity 通过；compound validators/templates 当前一致。
- Context exclusion: scan 命中均为边界声明、目标项目配置兼容或显式 runtime lookup；未发现 generated runtime mirror 被当作 source fix。
- CE residual: 7 个命中均为 `spec-mcp-setup` 对 retired `compound-engineering.local.md` 的只读检测/提示。

## 已解决 Findings

### M1 - Product Pulse 配置模板漏列 active `pulse_schedule`（resolved）

- Original severity: medium
- Evidence: `skills/spec-mcp-setup/references/config-template.yaml:32-49` 未声明 `pulse_schedule`；`spec-product-pulse` 当前 consumer 会读取/写入该 active key。
- Impact: setup 生成的 example config 不能完整表达 active Product Pulse 配置面，维护者可能误判 key 不受支持。
- Fix applied: Product Pulse block 已加入 commented `pulse_schedule: manual` 及 allowed values；focused test 锁定 consumer/template 对齐。
- Reverification: `tests/unit/mcp-setup-config-consumers.test.js` pass。

### M2 - Active `ideate_output` 被错误标记为 reserved future hint（resolved）

- Original severity: medium
- Evidence: `skills/spec-mcp-setup/SKILL.md:118`、`references/config-template.yaml:58-67` 把 `ideate_output` 归为 reserved；`skills/spec-ideate/SKILL.md:80-83` 已主动消费非注释的 `ideate_output: md|html`。
- Impact: setup contract 与真实 consumer 漂移，可能让配置审查、文档和未来清理错误删除 active key。
- Fix applied: `SKILL.md` 与 config template 将 `ideate_output` 标为 active，只保留 `plan_output` / `brainstorm_output` 为 reserved。
- Reverification: consumer/source contract test pass。

### M3 - Cursor provider readiness / Graphify platform 回落 Codex（resolved）

- Original severity: medium
- Evidence: `skills/spec-mcp-setup/scripts/provider-readiness-renderer.cjs:211-214` 与 `scripts/install-helpers.sh:1219-1223` 只接受 Claude/Codex/Kiro/Qoder，`cursor` 回落 `codex`；同一 skill 的 mutation authority 已将 Cursor 列为 canonical host。
- Impact: Cursor 项目可能检查错误的 project skill 路径，Graphify setup guidance 也可能按 Codex 平台生成，造成 advisory readiness 假阴性/错误 next action。
- Fix applied: provider renderer、Bash 与 PowerShell Graphify platform allowlist 均纳入 Cursor；renderer 暴露纯函数，并由测试与 `getSupportedPlatforms()` / platform registry 锁步。
- Reverification: 五宿主 host routing、project skill candidate 与 Bash/PowerShell parity tests pass。

## 逐 Batch / Skill 当前结论

### Batch 1

#### spec-test-xcode

- 双轴 / Tier: `aligned` × `medium` -> `B`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-test-xcode/**` 全部 tracked blob；聚合 hash `e3d6b9c0f48b`
- 结论: CE 投影与下游 review 引用一致。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-polish

- 双轴 / Tier: `aligned` × `medium` -> `B`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-polish/**` 全部 tracked blob；聚合 hash `ee0d36c74cd8`
- 结论: dev-server 兼容路径已分类，不把 runtime config 当 source。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-explain

- 双轴 / Tier: `aligned` × `medium` -> `B`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-explain/**` 全部 tracked blob；聚合 hash `1252a585aac4`
- 结论: 共享 repo-profile 资产 parity 通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-pov

- 双轴 / Tier: `aligned` × `medium` -> `B`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-pov/**` 全部 tracked blob；聚合 hash `7d963f466ef3`
- 结论: 共享 repo-profile 资产 parity 通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-dogfood

- 双轴 / Tier: `aligned` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-dogfood/**` 全部 tracked blob；聚合 hash `05ee1b849be7`
- 结论: worktree/debug/compound handoff 当前一致。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-strategy

- 双轴 / Tier: `aligned` × `medium` -> `B`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-strategy/**` 全部 tracked blob；聚合 hash `0f45f0fab031`
- 结论: 低差异迁移，无当前 finding。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-simplify-code

- 双轴 / Tier: `aligned` × `medium` -> `B`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-simplify-code/**` 全部 tracked blob；聚合 hash `bb0fb5031042`
- 结论: 低差异迁移，无当前 finding。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-commit

- 双轴 / Tier: `aligned` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-commit/**` 全部 tracked blob；聚合 hash `75fa3704613a`
- 结论: mutation、branch/ref 与 commit-message 安全边界通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

### Batch 2

#### spec-commit-push-pr

- 双轴 / Tier: `repaired` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-commit-push-pr/**` 全部 tracked blob；聚合 hash `c28b44b2a5f8`
- 结论: pipeline 与 concept trailer producer/consumer 当前一致。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-optimize

- 双轴 / Tier: `repaired` × `medium` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-optimize/**` 全部 tracked blob；聚合 hash `98069707187b`
- 结论: schema validation 与 bounded judge dispatch 当前一致。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-promote

- 双轴 / Tier: `aligned` × `medium` -> `B`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-promote/**` 全部 tracked blob；聚合 hash `de9ea4d85766`
- 结论: config/optional helper 边界通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-proof

- 双轴 / Tier: `aligned` × `medium` -> `B`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-proof/**` 全部 tracked blob；聚合 hash `60846a0a1354`
- 结论: Publish Mode 与 HITL 增强边界清晰。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-resolve-pr-feedback

- 双轴 / Tier: `repaired` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-resolve-pr-feedback/**` 全部 tracked blob；聚合 hash `5fe5f7222166`
- 结论: helper path、prompt asset、thread verification 当前一致。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-test-browser

- 双轴 / Tier: `aligned` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-test-browser/**` 全部 tracked blob；聚合 hash `b0580a1f508a`
- 结论: pipeline no-ask 与 internal-only contract 通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-worktree

- 双轴 / Tier: `repaired` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-worktree/**` 全部 tracked blob；聚合 hash `9922e1b4b560`
- 结论: existing-ref/PR isolate 与 git containment 通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

### Batch 3

#### spec-debug

- 双轴 / Tier: `partial` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-debug/**` 全部 tracked blob；聚合 hash `82e9ffe54919`
- 结论: debug flow、shared cache 与 evidence handoff 通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-compound

- 双轴 / Tier: `repaired` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-compound/**` 全部 tracked blob；聚合 hash `f198e3f45e02`
- 结论: knowledge schema/template/UTF-8 validator 当前一致。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-compound-refresh

- 双轴 / Tier: `repaired` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-compound-refresh/**` 全部 tracked blob；聚合 hash `b5682a1f222e`
- 结论: knowledge lifecycle 与 shared validators 当前一致。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-sweep

- 双轴 / Tier: `repaired` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-sweep/**` 全部 tracked blob；聚合 hash `f2b889442ec8`
- 结论: state/config/ack/plan handoff 当前一致。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-mcp-setup

- 双轴 / Tier: `near-parity` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-mcp-setup/**` 全部 tracked blob；聚合 hash `ac071f2e1306`
- 结论: config consumer matrix 与 Cursor provider/Graphify routing 已修复并由 focused tests 锁定。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-riffrec-feedback-analysis

- 双轴 / Tier: `repaired` × `medium` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-riffrec-feedback-analysis/**` 全部 tracked blob；聚合 hash `1a4f373ad5c3`
- 结论: durable plan/evidence path 当前一致。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-product-pulse

- 双轴 / Tier: `repaired` × `medium` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-product-pulse/**` 全部 tracked blob；聚合 hash `36c484289a8d`
- 结论: 固定 top-5 report contract 当前一致。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

### Batch 4

#### spec-brainstorm

- 双轴 / Tier: `repaired` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-brainstorm/**` 全部 tracked blob；聚合 hash `c5b3a8f863aa`
- 结论: requirements-only unified plan producer 与 shared cache 通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-plan

- 双轴 / Tier: `replaced` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-plan/**` 全部 tracked blob；聚合 hash `e9c499afd74f`
- 结论: artifact enrichment、handoff 与 intentional Fable divergence 已锁定。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-doc-review

- 双轴 / Tier: `repaired` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-doc-review/**` 全部 tracked blob；聚合 hash `9c96304d27f7`
- 结论: missing-document gate、persona isolation 与 findings schema 通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-code-review

- 双轴 / Tier: `repaired` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-code-review/**` 全部 tracked blob；聚合 hash `daee8ff2802d`
- 结论: scope/modes/validators/artifacts 与 deployment criteria 通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-work

- 双轴 / Tier: `replaced` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-work/**` 全部 tracked blob；聚合 hash `88b6e225243e`
- 结论: plan intake、active-unit context、return envelope 与 shipping boundary 通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-ideate

- 双轴 / Tier: `repaired` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-ideate/**` 全部 tracked blob；聚合 hash `51db12a79c4a`
- 结论: artifact routing、fleet context 与 config consumer 通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-lfg

- 双轴 / Tier: `replaced` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-lfg/**` 全部 tracked blob；聚合 hash `da2c712448b5`
- 结论: 全 pipeline mode/envelope 与下游合同通过。
- CE parity: applicable；以固定 CE commit snapshot 为语义基线，spec-first divergence 仅接受已记录投影/增强。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

### Batch 5

#### spec-prd

- 双轴 / Tier: `native` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-prd/**` 全部 tracked blob；聚合 hash `5de11ef4c075`
- 结论: 本轮唯一 source drift；模板路由与 Decision Card checker 深审通过。
- CE parity: not_applicable；按当前 source 质量、依赖、artifact、脚本安全与治理边界审查。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-write-tasks

- 双轴 / Tier: `native` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-write-tasks/**` 全部 tracked blob；聚合 hash `e55a8c4e45b9`
- 结论: task-pack contract、validator 与 eval fixture 通过。
- CE parity: not_applicable；按当前 source 质量、依赖、artifact、脚本安全与治理边界审查。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### using-spec-first

- 双轴 / Tier: `native` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/using-spec-first/**` 全部 tracked blob；聚合 hash `537d36b6ad12`
- 结论: 入口治理、source/runtime/evidence/dispatch 边界通过。
- CE parity: not_applicable；按当前 source 质量、依赖、artifact、脚本安全与治理边界审查。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-write-skill

- 双轴 / Tier: `native` × `high` -> `A`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-write-skill/**` 全部 tracked blob；聚合 hash `34ed460409b6`
- 结论: source skill authoring 与 delivery gates 通过。
- CE parity: not_applicable；按当前 source 质量、依赖、artifact、脚本安全与治理边界审查。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-app-consistency-audit

- 双轴 / Tier: `native` × `medium` -> `C`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-app-consistency-audit/**` 全部 tracked blob；聚合 hash `e39fd92e91aa`
- 结论: 五宿主 generated/control boundary 通过。
- CE parity: not_applicable；按当前 source 质量、依赖、artifact、脚本安全与治理边界审查。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

#### spec-rule-miner

- 双轴 / Tier: `native` × `medium` -> `C`
- Status / Verdict: `done` / `pass`
- 当前 source: manifest 中 `skills/spec-rule-miner/**` 全部 tracked blob；聚合 hash `f071292e9c0f`
- 结论: source evidence、preview/write 与 runtime exclusion 通过。
- CE parity: not_applicable；按当前 source 质量、依赖、artifact、脚本安全与治理边界审查。
- 未检查 / 限制: 未执行该 skill 的真实外部服务或宿主交互；runtime/provider 可用性不由 source rereview 代替。

## 全局交叉验证

### Plan Artifact Contract

- `spec-brainstorm` 产出 requirements-only unified plan。
- `spec-plan` 读取 requirements-only/legacy requirements 并产出 implementation-ready unified plan。
- `spec-write-tasks` 派生 task pack，不复制 plan 成第二真相源。
- `spec-work` 按 active U-ID / Goal Capsule / Verification Contract / DoD bounded read。
- `spec-lfg` 只接受 implementation-ready + execution code。
- 当前未发现 metadata 字段断裂。

### Knowledge Lifecycle

- 两份 schema/validator/template 当前一致。
- consumers 将 `docs/solutions/**` 作为 advisory recall，不把历史 learning 当 confirmed runtime truth。
- UTF-8 locale 与 template category contracts 当前通过。

### Config Key Matrix

- `feedback_sources` / `sweep_*`、`spec_promote_spiral_optout`、`work_delegate_*`、`plan_skip_scoping_confirm`、`verification_profile_path` 有当前 consumer/contract。
- `pulse_schedule` 已进入 Product Pulse active template block；`ideate_output` 已明确为 active consumer key。
- 未发现 confirmed undefined-consumer 或 defined-without-consumer 问题。

### spec-mcp-setup 14b

- 三阶段诊断/修复/汇总、tool facts、runtime capabilities、provider readiness、configured dependencies、scenario fingerprint、Bash/PowerShell surfaces 均存在当前 source/test 证据。
- legacy markdown detection 是只读提醒，不自动删除。
- optional helpers 不批量静默安装。
- Cursor provider/Graphify read-only readiness 路由已与五宿主 registry 锁步；14b checkpoint 为 pass。

### Shared Assets

- repo profile 三类共享资产 parity test 3/3。
- compound/refresh category 与 UTF-8 contracts 通过。
- Riffrec analyzer 的 product-specific divergence 已按 current durable/evidence path 分类。

### Context / Handoff / Recovery

- 主链路按 summary + source refs + freshness + limitations 传递 artifact。
- long-run state 由 plan/task/review/state artifact 承载，不依赖 transcript completion 声明。
- generated runtime mirrors 未作为 source；本轮未运行 `spec-first init`。
- 未授权 subagent dispatch，已记录 `dispatch_authorization_missing`，未伪称 fresh-source multi-reviewer coverage。

### Test Coverage Gap

- 方案要求的 5 个 focused suite 全部存在且通过。
- `npm test` 当前 unit/smoke/integration 全绿。
- 本报告不保留专用 close validator；roster、checkpoint、manifest freshness 与 verification rows 由人工 deterministic checklist 复核，因此 verification infrastructure 仍为 degraded。

## 汇总指标

| Severity | Count |
|---|---:|
| critical | 0 |
| high | 0 |
| medium | 0 |
| low | 0 |
| info | 0 |

| Verdict | Skills |
|---|---:|
| pass | 35 |
| issues_found | 0 |
| critical_issues | 0 |

Report completion: `complete_degraded`。  
Release readiness: `conditional_pass`。  
M1-M3 已关闭；后续只有在 supported platform registry 或 config consumer surface 变化时重新运行 focused contracts 与 source-manifest/checklist 复核。

## 验证记录

执行时间：2026-07-10 23:29-23:38 CST。

| Check | Command | Exit | Result |
|---|---|---:|---|
| CE fixed snapshot | `git -C /Users/kuang/xiaobu/compound-engineering-plugin cat-file -e 'fc0395b8^{commit}'` | 0 | commit object exists |
| Typecheck | `npm run typecheck` | 0 | 127 files checked |
| Skill entrypoint lint | `npm run lint:skill-entrypoints` | 0 | 277 files scanned |
| Shell syntax | recursive `bash -n` over `skills/**/scripts/*.sh` | 0 | pass |
| Python syntax | recursive `py_compile` with external pycache | 0 | pass；source 无 `__pycache__` / `*.pyc` |
| Changelog format | `npx jest tests/unit/changelog-format.test.js --runInBand` | 0 | 2/2 |
| CE upstream sync | `npx jest tests/unit/ce-upstream-skill-sync-contracts.test.js --runInBand` | 0 | 6/6 |
| Repo profile parity | `npx jest tests/unit/repo-profile-cache-parity.test.js --runInBand` | 0 | 3/3 |
| MCP setup contracts | `npx jest tests/unit/mcp-setup-contracts.test.js tests/unit/mcp-setup-powershell-contracts.test.js --runInBand` | 0 | 2 suites / 2 tests |
| spec-prd drift | 3 focused suites | 0 | 23/23 |
| spec-prd eval | `node skills/spec-prd/scripts/run-evals.js --json` | 0 | 111 cases passed |
| Full tests | `npm test` | 0 | unit 40 suites / 165 tests；smoke 2/2；integration 1/1 |
| CE residual scan | plan regex over `skills/` | 0 | 7 classified legacy-detection hits |
| Context exclusion scan | generated/runtime path regex over Markdown | 0 | hits classified；no source-fix violation |
| MCP setup fixes | `npm run test:mcp-setup` | 0 | 3 suites / 7 tests pass |
| Manual close checklist | Node inline roster/manifest/metadata check | 0 | 35 pass；439 working-tree blobs fresh；`complete_degraded/conditional_pass/degraded` 一致 |

## Completion Audit

- 35 个 skill：全部 `done`，均有当前 verdict 与 source hash。
- 固定 CE commit：可重建。
- Current source manifest：439 entries，working-tree blob hash fresh。
- Tier A / 高影响维度：全部结束；`spec-mcp-setup` 为 done-with-findings。
- 全局依赖、artifact、config、shared assets、context exclusion、test gap：均完成交叉验证。
- 跨 skill 候选残留：0。
- Required verification：全部 exit 0，无 `No tests found`。
- High/critical/medium：0；无需 ship_blocked 或 conditional pass。
- M1-M3：全部有 source fix 与 focused regression evidence。
- Durable report-close validator：未保留；人工 checklist 已通过，但 verification gate 按方案保持 degraded。
