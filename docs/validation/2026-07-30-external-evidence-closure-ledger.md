---
artifact_type: validation-ledger
artifact_contract: plan-specific-external-evidence-closure
source_plan: docs/plans/2026-07-30-004-feat-external-evidence-closure-plan.md
source_head: d213fe477601fd5338b32f55e2c11189608174a3
captured_at: 2026-07-30T23:54:05+08:00
authority_level: mixed-by-entry
status_vocabulary: confirmed|blocked-external-authorization|degraded-by-design|failed
freshness_reviewed_at: 2026-08-01T18:26:25+08:00
freshness_review_head: b72a6234ba37ec7f3177cbf7ab7438f91b129070
freshness_status: historical-source-identities-preserved-revalidation-required
---

# External Evidence Closure Ledger

本账本是上述计划专属的证据索引，不是 runtime schema、领域规则副本或全局 workflow 状态机。领域 contract 由当前仍存在的 `spec-lfg`、`spec-optimize` 与 host adapter/doctor 持有；`spec-proof` 已退役，E01 只保留历史 track identity，不能继续充当 current owner。条目中的 current claim 只描述对应 source identity 和直接证据能够支持的上限；fixture、unit test、历史 validation 不能替代 version-matched live journey。

## 2026-08-01 Freshness Overlay

- E01 的原 source owner `skills/spec-proof/**` 已不存在，当前处置为 `stale-reference`；为保持本 ledger 的 status vocabulary，entry status 仍保守保留 `blocked-external-authorization`，但不得沿用旧 closure path。
- E02–E18 的保守 `blocked-external-authorization` / `degraded-by-design` ceiling 继续有效，但 entry-local `source_identity` 是 2026-07-30 历史身份，不是 current-source closure receipt。
- 在关闭或提升任何条目前，必须先按该条 `re_evaluate_when` 冻结当时的 current source、exact host/provider version、授权与 receipt；一个 host journey 不提升其他条目。
- Current freshness review 见 `docs/validation/2026-08-01-full-system-audit-report.md`。本 overlay 不把任何历史条目提升为 confirmed。

## Status Rules

- `confirmed`：必须回链已脱敏、仍在 freshness 范围内的真实 journey receipt。
- `blocked-external-authorization`：缺 owner 批准、凭证、测试资源、费用、数据外发或外部 mutation 权限；不伪装成产品失败。
- `degraded-by-design`：确定性机制存在，但宿主/Provider/环境限制或缺少 field evidence，保留响亮 reason code。
- `failed`：获准 journey 已运行且行为不符合 contract；不能降级包装成“未验证”。
- 所有 raw Provider 内容只能进入 owner-checked、no-symlink、用户私有的 run-local scratch；本文件不得保存凭证、authorization header、生产数据或 raw payload。

## Track Entries

### E01 — Proof v3 live contract

- **track:** `proof-v3`
- **subclaim:** `owner-approved-live-contract-and-crud-journey`
- **status:** `blocked-external-authorization`
- **current_claim:** 原 Proof source owner 已退役，当前没有可确认的 successor owner；历史 Proof v3 field contract 未验证。
- **claim_ceiling:** 只能声明历史 track 与外部 gate 曾被记录；不能声明 current Proof owner、endpoint/schema/auth/lifecycle 或可执行 closure path 存在。
- **source_identity:** 2026-08-01 在 HEAD `b72a6234ba37ec7f3177cbf7ab7438f91b129070` 加冻结工作树确认 `skills/spec-proof/**` 不存在；原 2026-07-30 source identity 已失效。
- **target_identity:** 等待项目 owner 明确 Proof 能力已退役，或指定 current successor owner、contract 与 exact-version target。
- **authorization_ref:** `not-granted: proof-v3-contract-data-credential-crud-claim-delete`
- **evidence_refs:** `docs/validation/2026-07-30-proof-v3-external-contract-gate.md`; `docs/validation/2026-08-01-full-system-audit-report.md`
- **reason_code:** `stale_reference_owner_removed`
- **limitations:** current successor owner、contract、endpoint、auth 与 lifecycle 均未解析；历史 live journey 仍未运行。
- **owner:** External evidence ledger maintainer；current Proof/successor product owner 尚未解析。
- **re_evaluate_when:** 项目 owner 明确退役结论，或指定 current successor owner、contract、isolated target、最小权限和 cleanup owner。
- **closure_path:** 先解析 retire-or-successor 决策；只有 successor 存在时，才在新计划中定义并执行 version-matched negative/CRUD journey，发布脱敏 receipt。
- **freshness:** 2026-08-01 current-source absence check；只证明旧 owner/path 已失效，不证明 successor 不存在于外部系统。
- **invalidated_by:** 新 successor owner/contract 出现、Proof 能力正式退役裁决、或项目重新引入同名 source owner。
- **cleanup:** 未创建外部文档；未来 journey 必须删除测试文档或记录 owner 批准的保留例外。
- **rollback:** 保持 blocked/stale-reference ceiling，不恢复已退役 source，也不迁移未批准的 v3 contract。

### E02 — GitHub PR watch lifecycle

- **track:** `github-pr-watch`
- **subclaim:** `real-pr-ci-review-head-base-quiet-window-resume`
- **status:** `blocked-external-authorization`
- **current_claim:** append-only generation/hash chain、CAS、budget、routing 和 terminal contract 已由本地测试确认；真实 PR journey 未验证。
- **claim_ceiling:** 仅能声明 local contract confirmed，不能声明 watcher 已在 GitHub field lifecycle 达到 `looks-ready`。
- **source_identity:** HEAD `d213fe477601fd5338b32f55e2c11189608174a3` 加当前 `skills/spec-lfg/**` 与相关 tests 工作树。
- **target_identity:** 等待专用 GitHub 测试仓库、临时 branch/PR、current head/base/check/review identity。
- **authorization_ref:** `not-granted: github-test-repo-push-pr-comment-review-check-cleanup`
- **evidence_refs:** `skills/spec-lfg/references/pr-watch-loop.md`; `skills/spec-lfg/scripts/pr-watch-state.cjs`; `tests/unit/spec-lfg-pr-watch-state.test.js`; `tests/unit/spec-work-lfg-recovery-contracts.test.js`
- **reason_code:** `github_pr_watch_live_journey_unverified`
- **limitations:** 没有测试仓库、外部通信或 PR/check/review mutation 授权；本地 fixture 不能证明 GitHub event timing 或 Provider behavior。
- **owner:** `skills/spec-lfg/` shipping-tail owner 与测试仓库 owner。
- **re_evaluate_when:** 提供隔离测试仓库和 push/PR/comment/review/check/cleanup 明确授权。
- **closure_path:** 覆盖 watching、CI success/failure、review return、head/base invalidation、CAS resume、quiet window、budget/manual blocker 和 sanitized handoff；确认不自动 merge。
- **freshness:** 2026-07-30 current-worktree contract baseline。
- **invalidated_by:** GitHub API/branch policy、quiet-window rule、watch state contract 或 `skills/spec-lfg/**` 变化。
- **cleanup:** 未创建 branch/PR/check/comment；未来 journey 必须关闭或删除测试对象并记录结果。
- **rollback:** 保持 local-only claim；journey 失败时不提升公开声明，也不扩大 merge/history 权限。

### E03 — Optimize measurement-only field calibration

- **track:** `optimize-measurement-only`
- **subclaim:** `real-corpus-aa-noise-gate-then-ab`
- **status:** `blocked-external-authorization`
- **current_claim:** frozen-arm schema、至少两次 A/A、noise stop gate、broken-run taxonomy 与 recommendation ceiling 已由本地 contract tests确认。
- **claim_ceiling:** 仅能声明 measurement-only contract exists，不能声明真实 corpus outcome 或 candidate promotion eligibility。
- **source_identity:** HEAD `d213fe477601fd5338b32f55e2c11189608174a3` 加当前 `skills/spec-optimize/**` 与 measurement-only tests 工作树。
- **target_identity:** 等待冻结的非敏感 corpus、baseline、candidate、seed、harness、environment、metric 与 budget。
- **authorization_ref:** `not-granted: optimize-corpus-harness-budget-and-optional-model-egress`
- **evidence_refs:** `skills/spec-optimize/references/measurement-only-calibration.md`; `skills/spec-optimize/references/optimize-spec-schema.yaml`; `skills/spec-optimize/references/experiment-log-schema.yaml`; `tests/unit/spec-optimize-measurement-only-contracts.test.js`
- **reason_code:** `optimize_field_calibration_unverified`
- **limitations:** 未选择真实 corpus/harness；未预注册 threshold/noise ceiling；judge 是否需要费用和外发尚未获批准。
- **owner:** `skills/spec-optimize/` measurement owner 与 corpus/budget owner。
- **re_evaluate_when:** identities、metric、noise ceiling、threshold、broken policy 和预算在看结果前冻结，且外发授权明确。
- **closure_path:** 至少两次 A/A；仅在 noise 未超 ceiling 时运行同条件 A/B；发布脱敏 run receipt 和受限 recommendation。
- **freshness:** 2026-07-30 current-worktree contract baseline。
- **invalidated_by:** corpus、candidate、harness、metric、judge/model、environment 或 `skills/spec-optimize/**` 变化。
- **cleanup:** 未运行实验、无外部费用或模型输入；未来 run 按批准 retention 清理 raw outputs。
- **rollback:** 保持 measurement-only contract claim；noise 过高或 run broken 时停止，不解释 A/B、不推广 candidate。

### E04 — Cursor generated loader

- **track:** `cursor`
- **subclaim:** `generated-skill-discovery-and-invocation`
- **status:** `degraded-by-design`
- **current_claim:** deterministic `.cursor/skills/**` projection exists；本机 native loader discovery/invocation 未确认。
- **claim_ceiling:** `generated_runtime_preview`
- **source_identity:** `src/cli/adapters/cursor.js` current worktree；runtime catalog 2026-07-30 baseline。
- **target_identity:** 当前 `agent` CLI 不在 PATH；等待精确 Cursor 版本与隔离 project/profile 的 loader journey。
- **authorization_ref:** `not-granted: cursor-versioned-loader-profile-journey`
- **evidence_refs:** `src/cli/adapters/cursor.js`; `docs/catalog/runtime-capabilities.md`; `tests/unit/host-runtime-projection-contracts.test.js`; `docs/validation/2026-07-30-host-evidence-closure-read-only-probes.md`
- **reason_code:** `cursor_generated_runtime_loader_unverified`
- **limitations:** projection test 不证明 Cursor native loader；`testedVersions`/版本化 receipt 不存在。
- **owner:** Cursor adapter/doctor owner 与可提供 Cursor runtime 的环境 owner。
- **re_evaluate_when:** 可在隔离 profile 中记录精确版本、skill discovery 与一次 bounded invocation。
- **closure_path:** source-first 投射后运行 current-version loader journey；通过时最多晋升 `skill_first_loader_confirmed_preview`。
- **freshness:** 2026-07-30 read-only probe confirms `cursor_cli_not_found`；无 host-version loader freshness。
- **invalidated_by:** Cursor version、loader roots、projection layout 或 adapter source 变化。
- **cleanup:** 未启动 Cursor 或修改用户 profile；未来 fixture 必须移除隔离 runtime/profile。
- **rollback:** 保留 generated preview warning；失败不得隐藏 loader warning。

### E05 — Cursor external-root precedence

- **track:** `cursor`
- **subclaim:** `external-same-name-skill-precedence`
- **status:** `degraded-by-design`
- **current_claim:** duplicate roots 可被 doctor 检测；Cursor 对外部同名 Skill 的实际选择顺序未确认。
- **claim_ceiling:** diagnostic-only precedence warning。
- **source_identity:** `src/cli/adapters/cursor.js` current worktree 与 duplicate-root unit tests。
- **target_identity:** 等待精确 Cursor 版本、隔离 managed/external duplicate roots 和 selected-loader source observation。
- **authorization_ref:** `not-granted: cursor-external-root-precedence-journey`
- **evidence_refs:** `src/cli/adapters/cursor.js`; `tests/unit/cursor-duplicate-skill-roots.test.js`
- **reason_code:** `cursor_external_skill_precedence_unverified`
- **limitations:** 文件发现只能证明冲突存在，不能证明宿主选择哪一个 root。
- **owner:** Cursor adapter/doctor owner；最终 loader precedence 属于 Cursor host。
- **re_evaluate_when:** exact-version journey 能观察 selected Skill path/body identity。
- **closure_path:** 构造同名 external/managed roots，记录 loader selection 和 invocation，按子声明更新 claim。
- **freshness:** 2026-07-30 deterministic diagnostic baseline。
- **invalidated_by:** Cursor root discovery、workspace/user precedence 或 duplicate diagnostics 变化。
- **cleanup:** 未创建用户级 duplicate root；未来只使用隔离 profile 并恢复 fixture。
- **rollback:** 保留 warning 和 collision details，不删除用户 root、不假定 precedence。

### E06 — Cursor managed-projection precedence

- **track:** `cursor`
- **subclaim:** `managed-projection-vs-other-project-root-precedence`
- **status:** `degraded-by-design`
- **current_claim:** managed duplicate 可被分类，native managed projection precedence 未确认。
- **claim_ceiling:** diagnostic-only managed precedence warning。
- **source_identity:** `src/cli/adapters/cursor.js` current worktree 与 managed duplicate tests。
- **target_identity:** 等待 exact-version project fixture 中多个 project-local candidate roots。
- **authorization_ref:** `not-granted: cursor-managed-projection-precedence-journey`
- **evidence_refs:** `src/cli/adapters/cursor.js`; `tests/unit/cursor-duplicate-skill-roots.test.js`
- **reason_code:** `cursor_managed_projection_precedence_unverified`
- **limitations:** static path inventory 不等于 loader winner 或 bounded invocation outcome。
- **owner:** Cursor adapter/doctor owner；native winner selection 属于 Cursor host。
- **re_evaluate_when:** 隔离 project 能同时暴露 managed projection 和竞争 root，并观测 winner。
- **closure_path:** 记录版本、root identities、selected body hash 与 invocation；只更新本子声明。
- **freshness:** 2026-07-30 deterministic diagnostic baseline。
- **invalidated_by:** adapter projection、Cursor project-root rules 或 version 变化。
- **cleanup:** 未生成额外 project root；未来恢复隔离 fixture。
- **rollback:** 继续报告 warning，不通过删除竞争 root 伪造确定性。

### E07 — Cursor nested root coverage

- **track:** `cursor`
- **subclaim:** `nested-skill-root-scan-coverage`
- **status:** `degraded-by-design`
- **current_claim:** bounded nested scan 可报告部分覆盖，不能声称无遗漏。
- **claim_ceiling:** partial diagnostic coverage。
- **source_identity:** `src/cli/adapters/cursor.js` current worktree；目录数/时间 budget 由 source 定义。
- **target_identity:** current project tree under bounded scan；宿主完整 root discovery contract 未公开确认。
- **authorization_ref:** `not-required: local-read-only-bounded-scan`
- **evidence_refs:** `src/cli/adapters/cursor.js`; `tests/unit/cursor-duplicate-skill-roots.test.js`
- **reason_code:** `cursor_nested_skill_roots_partial`
- **limitations:** 目录/时间上限意味着大仓库可能存在未扫描 root；这是响亮限制而非 loader pass。
- **owner:** Cursor adapter diagnostic owner。
- **re_evaluate_when:** Cursor 提供权威 root inventory primitive，或当前 bounded scan contract 发生变化。
- **closure_path:** 优先消费权威 host root list；否则保留 partial reason 和 scan bounds。
- **freshness:** 2026-07-30 source-defined scan baseline。
- **invalidated_by:** scan bounds、ignore roots、workspace size 或 Cursor discovery rules 变化。
- **cleanup:** read-only scan，不创建外部或 runtime artifact。
- **rollback:** 保留 partial 标记；不得把未发现 duplicate 表述为不存在 duplicate。

### E08 — OpenCode flat command and Skill loader

- **track:** `opencode`
- **subclaim:** `current-flat-command-and-skill-discovery-invocation`
- **status:** `degraded-by-design`
- **current_claim:** current flat projection deterministic；历史 1.18.7 journey 只证明旧 nested `spec/work` 反例，不能证明当前 `spec-work`。
- **claim_ceiling:** `generated_runtime_preview`
- **source_identity:** `src/cli/adapters/opencode.js` current worktree；flat command projection 已不同于历史 receipt source。
- **target_identity:** current local OpenCode `1.18.9`；等待 isolated config/runtime 和 flat command/Skill loader observation。
- **authorization_ref:** `not-granted: opencode-current-version-loader-journey`
- **evidence_refs:** `src/cli/adapters/opencode.js`; `docs/catalog/runtime-capabilities.md`; `docs/validation/opencode-host-support/1.18.7/README.md`; `tests/unit/opencode-adapter.test.js`; `docs/validation/2026-07-30-host-evidence-closure-read-only-probes.md`
- **reason_code:** `opencode_generated_runtime_loader_unverified`
- **limitations:** 历史 journey source identity 已失效；当前 adapter `testedVersions=[]`。
- **owner:** OpenCode adapter/doctor owner 与可提供 exact-version runtime 的环境 owner。
- **re_evaluate_when:** current flat source 能在隔离 profile 中完成 version-matched loader 和 bounded invocation。
- **closure_path:** 记录 flat `spec-work` key、Skill discovery、bounded invocation、source/body identity 和 cleanup；通过时最多晋升 `loader_confirmed_preview`。
- **freshness:** 2026-07-30 read-only probe confirms installed version `1.18.9`；旧 1.18.7 artifact 仅作反例，current loader field claim 仍无 freshness。
- **invalidated_by:** OpenCode version、command normalization、Skill roots、adapter projection 或 config precedence 变化。
- **cleanup:** 本轮未启动 OpenCode fixture；未来使用隔离 HOME/XDG roots 并恢复 fixture。
- **rollback:** 保持 preview/testedVersions 空数组；失败不压制 warning。

### E09 — OpenCode external-root precedence

- **track:** `opencode`
- **subclaim:** `external-same-name-skill-precedence`
- **status:** `degraded-by-design`
- **current_claim:** doctor 可识别 external duplicate；current-version native precedence 未确认。
- **claim_ceiling:** diagnostic-only precedence warning。
- **source_identity:** `src/cli/adapters/opencode.js` current worktree 与 adapter unit tests。
- **target_identity:** 等待隔离 project/user/external roots 和 exact OpenCode version。
- **authorization_ref:** `not-granted: opencode-external-root-precedence-journey`
- **evidence_refs:** `src/cli/adapters/opencode.js`; `tests/unit/opencode-adapter.test.js`
- **reason_code:** `opencode_external_skill_precedence_unverified`
- **limitations:** 历史 selected path 不覆盖 current flat projection 和未来版本 root order。
- **owner:** OpenCode adapter/doctor owner；native root precedence 属于 OpenCode host。
- **re_evaluate_when:** exact-version loader 可返回 selected location/body identity。
- **closure_path:** 构造 same-name roots，记录 selection 与 invocation，和 loader 子声明分开晋升。
- **freshness:** 2026-07-30 source diagnostic baseline；无 current host receipt。
- **invalidated_by:** OpenCode root order、config merge、adapter diagnostics 或 version 变化。
- **cleanup:** 未创建 external duplicate；未来清理隔离 roots 和 config。
- **rollback:** 保留 warning，不删除用户 root 或强制猜测 winner。

### E10 — OpenCode runtime root presence

- **track:** `opencode`
- **subclaim:** `runtime-root-present`
- **status:** `degraded-by-design`
- **current_claim:** doctor 能区分 runtime root 缺失；缺失时不能声称 projection available。
- **claim_ceiling:** local runtime-presence diagnostic。
- **source_identity:** `src/cli/adapters/opencode.js` current worktree。
- **target_identity:** 每个 target project 的 `.opencode` current runtime root。
- **authorization_ref:** `not-required: doctor-read-only`; init apply 另需明确 runtime mutation scope。
- **evidence_refs:** `src/cli/adapters/opencode.js`; `tests/unit/opencode-adapter.test.js`
- **reason_code:** `opencode_runtime_root_missing`
- **limitations:** root presence 不证明 loader、invocation、permission enforcement 或 precedence。
- **owner:** OpenCode adapter/init/doctor owner。
- **re_evaluate_when:** target project 运行 source-owned init 或 runtime root 状态改变。
- **closure_path:** 先由 canonical source 生成 runtime，再复核 manifest/content；loader claim 仍需 E08 journey。
- **freshness:** per-doctor-run local fact，不能跨项目复用。
- **invalidated_by:** runtime clean/init、target repo、state manifest 或 adapter layout 变化。
- **cleanup:** read-only doctor 不写入；init 产生的 managed root 由 clean lifecycle 回收。
- **rollback:** init 失败按 operation plan 恢复；不得手改 `.opencode/**`。

### E11 — OpenCode projection completeness

- **track:** `opencode`
- **subclaim:** `runtime-projection-complete`
- **status:** `degraded-by-design`
- **current_claim:** doctor 能识别 commands/skills/state 的部分投射。
- **claim_ceiling:** deterministic projection completeness only。
- **source_identity:** `src/cli/adapters/opencode.js` current worktree 与 projection tests。
- **target_identity:** target project generated command/Skill/state inventory。
- **authorization_ref:** `not-required: doctor-read-only`;修复投射需 source mutation 和 init scope。
- **evidence_refs:** `src/cli/adapters/opencode.js`; `tests/unit/opencode-adapter.test.js`
- **reason_code:** `opencode_runtime_projection_partial`
- **limitations:** 文件齐全仍不能证明 host loader 或 permission prompt。
- **owner:** OpenCode adapter/init/doctor owner。
- **re_evaluate_when:** target runtime inventory 或 canonical projection contract 变化。
- **closure_path:** 修 canonical adapter/generator、跑 projection tests、source-first init 后复核；不提升 E08。
- **freshness:** per-target doctor fact。
- **invalidated_by:** source asset count、runtime manifest、init/clean 或 adapter layout 变化。
- **cleanup:** read-only诊断无 cleanup；修复由 operation plan rollback/clean 持有。
- **rollback:** 恢复 source-owned projection plan，不做 runtime-only patch。

### E12 — OpenCode bundled agents

- **track:** `opencode`
- **subclaim:** `bundled-agent-delivery`
- **status:** `degraded-by-design`
- **current_claim:** `supportsAgents=false`，当前不生成 bundled agents。
- **claim_ceiling:** loader preview 不包含 agent/subagent parity。
- **source_identity:** `src/cli/adapters/opencode.js` current worktree 与 runtime catalog。
- **target_identity:** OpenCode agent/subagent surface 尚未进入本计划验证范围。
- **authorization_ref:** `not-granted: opencode-agent-surface-scope-expansion`
- **evidence_refs:** `src/cli/adapters/opencode.js`; `docs/catalog/runtime-capabilities.md`; `tests/unit/opencode-adapter.test.js`
- **reason_code:** `opencode_bundled_agents_unsupported`
- **limitations:** command/Skill loader success也不能推导 worker/delegation parity。
- **owner:** OpenCode adapter/governance owner；scope 变化需独立 plan。
- **re_evaluate_when:** 出现明确 agent consumer、host-native contract 和经批准的 parity scope。
- **closure_path:** 返回 `spec-plan` 评估 agent delivery，不在本 evidence closure 中顺带实现。
- **freshness:** 2026-07-30 deliberate source boundary。
- **invalidated_by:** `supportsAgents`、governance delivery 或 OpenCode native agent contract 变化。
- **cleanup:** 当前不生成 agents，无额外 artifact。
- **rollback:** 保持 `supportsAgents=false` 和显式 warning，不伪造 full-host parity。

### E13 — Qoder SessionStart CLI activation

- **track:** `qoder`
- **subclaim:** `cli-session-start-authenticated-execution`
- **status:** `degraded-by-design`
- **current_claim:** qodercli 1.0.41 settings/command protocol confirmed；unauthenticated attempt 未触发 SessionStart。
- **claim_ceiling:** protocol-confirmed, activation-unverified；managed settings entry 保持 inert。
- **source_identity:** `src/cli/adapters/qoder.js` 与 `src/cli/qoder-settings.js` current worktree。
- **target_identity:** qodercli 1.0.41 authenticated isolated project/profile，或新版本的重新取证 identity。
- **authorization_ref:** `not-granted: qoder-authenticated-session-start-journey`
- **evidence_refs:** `docs/validation/qoder-hooks-protocol-matrix.md`; `src/cli/adapters/qoder.js`; `tests/unit/qoder-runtime-lifecycle.test.js`; `docs/validation/2026-07-30-host-evidence-closure-read-only-probes.md`
- **reason_code:** `qoder_hook_activation_unverified`
- **limitations:** 未观察 stdin/cwd/env、marker、additionalContext 或 authenticated lifecycle。
- **owner:** Qoder adapter/hook owner 与 authenticated profile owner。
- **re_evaluate_when:** 提供隔离 authenticated CLI session 和 event execution 授权。
- **closure_path:** 观察 SessionStart input/output/exit/side effect，再独立验证 IDE safety；两门未齐不启用 entry。
- **freshness:** protocol evidence 固定 qodercli 1.0.41；activation 无 field freshness。
- **invalidated_by:** qodercli version、hook schema、command form、auth/session lifecycle 变化。
- **cleanup:** managed script inert；未来删除 marker/temp profile 并恢复 settings。
- **rollback:** 保持 settings entry omitted 和 loud degraded warning。

### E14 — Qoder PreToolUse CLI activation

- **track:** `qoder`
- **subclaim:** `cli-pre-tool-use-authenticated-allow-deny`
- **status:** `degraded-by-design`
- **current_claim:** exec form、matcher 和 exit 2 deny semantics 有协议证据；真实 Write/Edit/MultiEdit event 未运行。
- **claim_ceiling:** protocol-confirmed, enforcement-unverified；managed prewrite script 保持 inert。
- **source_identity:** `src/cli/adapters/qoder.js` 与 `src/cli/qoder-settings.js` current worktree。
- **target_identity:** authenticated qodercli isolated project/profile with controlled write target。
- **authorization_ref:** `not-granted: qoder-authenticated-pre-tool-use-mutation-journey`
- **evidence_refs:** `docs/validation/qoder-hooks-protocol-matrix.md`; `tests/unit/qoder-runtime-lifecycle.test.js`
- **reason_code:** `qoder_hook_activation_unverified`
- **limitations:** 未观察 allow/deny、stdin shape、exit propagation 或目标文件无 mutation 的 negative case。
- **owner:** Qoder adapter/hook owner 与测试 profile/data owner。
- **re_evaluate_when:** authenticated CLI 可在隔离文件上触发 allow/deny，并获准执行受控 mutation。
- **closure_path:** 记录 allow 和 deny 两类 event、exit 与 target hash；再独立关闭 IDE safety。
- **freshness:** protocol evidence固定 qodercli 1.0.41；enforcement 未确认。
- **invalidated_by:** qodercli version、matcher、deny semantics、tool names 或 hook input schema 变化。
- **cleanup:** 未写测试文件；未来恢复 fixture/settings 并删除 marker/raw scratch。
- **rollback:** 保持 hook entry omitted；失败不得声称 hard enforcement。

### E15 — Qoder Stop CLI activation

- **track:** `qoder`
- **subclaim:** `cli-stop-authenticated-blocking-and-recursion-protection`
- **status:** `degraded-by-design`
- **current_claim:** Stop command/exit protocol有文档证据；真实 Stop execution与 recursion protection 未观察。
- **claim_ceiling:** protocol-confirmed, stop-activation-unverified；managed readiness script 保持 inert。
- **source_identity:** `src/cli/adapters/qoder.js` 与 `src/cli/qoder-settings.js` current worktree。
- **target_identity:** authenticated qodercli isolated session with controlled Stop outcome。
- **authorization_ref:** `not-granted: qoder-authenticated-stop-journey`
- **evidence_refs:** `docs/validation/qoder-hooks-protocol-matrix.md`; `tests/unit/qoder-runtime-lifecycle.test.js`
- **reason_code:** `qoder_hook_activation_unverified`
- **limitations:** 未观察 blocking、`stop_hook_active` recursion guard 或 session result。
- **owner:** Qoder adapter/hook owner 与 authenticated session owner。
- **re_evaluate_when:** authenticated CLI 可触发 Stop 并允许记录阻断/递归保护结果。
- **closure_path:** 运行 success/block/recursion cases，发布脱敏 receipt，再独立验证 IDE safety。
- **freshness:** protocol evidence固定 qodercli 1.0.41；Stop activation 未确认。
- **invalidated_by:** qodercli version、Stop lifecycle、exit semantics 或 recursion contract 变化。
- **cleanup:** 未启动 session；未来清理 profile、marker 和 raw scratch。
- **rollback:** 保持 hook entry omitted 和 producer-local loud convention。

### E16 — Qoder shared IDE loader safety

- **track:** `qoder`
- **subclaim:** `shared-ide-settings-loader-and-user-hook-safety`
- **status:** `degraded-by-design`
- **current_claim:** Qoder app存在和日志版本只是 advisory；CLI protocol不能证明 shared IDE loader safety。
- **claim_ceiling:** all managed hook settings remain inert for IDE delivery。
- **source_identity:** `src/cli/adapters/qoder.js` current worktree 与 protocol matrix。
- **target_identity:** 等待精确 Qoder IDE version、隔离 shared project/profile 和 unmanaged user-hook fixture。
- **authorization_ref:** `not-granted: qoder-shared-ide-loader-safety-journey`
- **evidence_refs:** `docs/validation/qoder-hooks-protocol-matrix.md`; `src/cli/adapters/qoder.js`; `tests/unit/qoder-runtime-lifecycle.test.js`
- **reason_code:** `shared_loader_safety_unconfirmed`
- **limitations:** CLI event通过不能替代 IDE/JB loader、coexistence、rollback 或 user hook preservation。
- **owner:** Qoder adapter/runtime owner 与 IDE profile owner。
- **re_evaluate_when:** 可在隔离 IDE profile 验证三个 event group 和 unmanaged hook coexistence。
- **closure_path:** 对每个 event group记录 loader behavior、settings before/after hash、user hook preservation和rollback；只升级通过的 group。
- **freshness:** app 1.13.0 仅历史 advisory；无 current IDE field receipt。
- **invalidated_by:** IDE version、shared settings schema、loader behavior、managed entry layout 或 user-hook contract 变化。
- **cleanup:** 未修改 shared settings；未来恢复 profile/settings 并证明 unmanaged hooks byte-preserved。
- **rollback:** 保持 all event entries inert；任一 safety case失败即不启用对应 group。

### E17 — Kiro doctor reason classification

- **track:** `kiro`
- **subclaim:** `current-environment-doctor-reason-code-ownership`
- **status:** `degraded-by-design`
- **current_claim:** current doctor 已确认 managed runtime shape；Kiro CLI 不在 PATH，环境原因可机器读取但 native loader 未验证。
- **claim_ceiling:** environment classification pending；不能假定与 Cursor/OpenCode 同类。
- **source_identity:** `src/cli/adapters/kiro.js` 与 `src/cli/commands/doctor.js` current worktree。
- **target_identity:** current target repo；`kiro` CLI not found，`detected_version=null`。
- **authorization_ref:** `not-required: local-read-only-doctor-and-version-probe`
- **evidence_refs:** `src/cli/adapters/kiro.js`; `src/cli/commands/doctor.js`; `tests/unit/doctor-platform-cli.test.js`; `tests/unit/host-runtime-projection-contracts.test.js`; `docs/validation/2026-07-30-host-evidence-closure-read-only-probes.md`
- **reason_code:** `kiro_cli_not_found`
- **limitations:** environment-scoped CLI unavailable；managed runtime PASS、setup facts host mismatch 与 missing workflow verification evidence均不能证明 native loader。
- **owner:** Kiro adapter/doctor owner；CLI/IDE availability 属于当前环境 owner。
- **re_evaluate_when:** Kiro CLI 安装或 PATH/runtime/environment 变化后重跑 doctor/version；loader claim另需 journey 授权。
- **closure_path:** 当前环境分类已关闭；安装 CLI 后复测 version/timeout/failure，native loader 仍按 E18 单独关闭。
- **freshness:** 2026-07-30T16:04:36Z current-worktree doctor receipt。
- **invalidated_by:** PATH、CLI/IDE version、runtime projection、doctor implementation 或 target repo 变化。
- **cleanup:** read-only probe 不应写入；若 doctor产生临时日志，只保留脱敏摘要并清理 raw scratch。
- **rollback:** 未分类前不修改 adapter；environment缺失保留 remedy，不隐藏 warning。

### E18 — Kiro native loader

- **track:** `kiro`
- **subclaim:** `native-skill-loader-discovery-and-invocation`
- **status:** `degraded-by-design`
- **current_claim:** deterministic Kiro projection tests不等于 native CLI/IDE loader field outcome。
- **claim_ceiling:** projection-only until exact-version journey exists。
- **source_identity:** `src/cli/adapters/kiro.js` current worktree 与 projection tests。
- **target_identity:** 等待精确 Kiro CLI/IDE version和隔离 profile/runtime。
- **authorization_ref:** `not-granted: kiro-versioned-loader-journey`
- **evidence_refs:** `src/cli/adapters/kiro.js`; `tests/unit/host-runtime-projection-contracts.test.js`; `tests/unit/platform-registry-patterns.test.js`
- **reason_code:** `kiro_native_loader_unverified`
- **limitations:** doctor environment classification不能替代 loader discovery/invocation；CLI absence只支持environment degraded。
- **owner:** Kiro adapter/runtime owner 与可提供 native host journey 的环境 owner。
- **re_evaluate_when:** exact version和隔离 profile可用，并获准运行 loader/invocation journey。
- **closure_path:** source-first projection后记录 discovery、selected Skill identity、bounded invocation和cleanup；只更新本子声明。
- **freshness:** 2026-07-30 projection baseline；无 native host receipt。
- **invalidated_by:** Kiro version、Skill roots、projection layout、adapter source 或 host loader contract 变化。
- **cleanup:** 未启动 host journey；未来清理隔离 profile/runtime。
- **rollback:** 保持 projection-only claim；不得用 PATH 或 runtime root 猜测 loader pass。

## U1 Closeout

- 完成状态：`implemented-local-contract-floor`
- 完成单元：`U1`
- 当前结果：18 个 subclaim 覆盖 Proof、PR watch、Optimize、Cursor、OpenCode、Qoder、Kiro；全部保留在其 direct evidence 允许的 claim ceiling 内。
- 外部动作：未运行；未使用凭证、账号、外部通信、费用或 Provider mutation。
- 下一步：U2-U7 逐项消费本账本；只有 version-matched live receipt 能把对应条目改为 `confirmed`。

## Implementation Unit Status

| Unit | Status | Evidence / reason | Remaining closure path |
| --- | --- | --- | --- |
| U1 | `degraded-by-design` | E01-E18 与 `tests/unit/external-evidence-closure-ledger.test.js` 建立本地 deterministic floor；没有 field claim 被提升。 | 后续单元逐项追加真实 receipt 或保留诚实终态。 |
| U2 | `blocked-external-authorization` | E01；缺 owner-approved Proof v3 contract、测试文档、分离短时凭证与 CRUD/claim/delete 授权。 | 满足 E01 `re_evaluate_when` 后运行完整 Proof live journey。 |
| U3 | `blocked-external-authorization` | E02；缺专用 GitHub 测试仓库和 push/PR/comment/review/check/cleanup 外部 mutation 授权。 | 满足 E02 `re_evaluate_when` 后运行隔离 PR lifecycle。 |
| U4 | `blocked-external-authorization` | E03；缺冻结 corpus/baseline/candidate/harness/metric/budget，模型 judge 外发也未授权。 | 完成预注册和授权后先 A/A，只有 noise gate 通过才运行 A/B。 |
| U5 | `degraded-by-design` | Cursor `agent` CLI 不在 PATH；OpenCode 1.18.9 已识别，但 current flat loader/precedence journey 未获授权。 | 提供隔离 profile 与 host journey 授权后分别关闭 loader 和 precedence 子声明。 |
| U6 | `degraded-by-design` | Qoder 1.0.41 可见；authenticated SessionStart/PreToolUse/Stop 与 shared IDE safety 未获授权。 | CLI event group 与 IDE safety 分开取证，未双门通过前保持 hooks inert。 |
| U7 | `degraded-by-design` | current Kiro doctor 报 `kiro_cli_not_found`；环境责任已分类，platform CLI warning 已补 machine-readable reason code。 | CLI 可用后重跑 reason capture；native loader 继续由 E18 单独取证。 |
| U8 | `degraded-by-design` | canonical claims 未提升；source-owned init preview/apply 后六宿主 `6/6 ready`，post-init doctor 仍保留 loader/precedence/hook/CLI limitations。 | 获得各轨 live receipt 后只更新对应 subclaim；当前不改 `testedVersions`、`evidenceClaim` 或 README 支持等级。 |

U2-U4 的实现机制已在上一轮 source 中存在，本轮没有修改 `skills/spec-proof/**`、`skills/spec-lfg/**` 或 `skills/spec-optimize/**`。因此不存在需要写入 Skill prompt 的新增 prose，也不把“机制完成”表达成 field evidence closure。

U5-U8 没有修改任何 Skill prompt/prose。唯一 behavior-bearing source 变更位于共享 doctor platform CLI probe：not-found、timeout、nonzero version failure 现在分别产生稳定 reason code，并进入 `host_support.<host>.reason_codes`；该变更不把 CLI presence 解释为 loader evidence。
