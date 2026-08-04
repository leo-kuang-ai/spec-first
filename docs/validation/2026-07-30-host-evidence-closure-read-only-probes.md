---
artifact_type: validation-receipt
artifact_contract: host-evidence-closure-read-only-probes/v1
source_plan: docs/plans/2026-07-30-004-feat-external-evidence-closure-plan.md
source_head: d213fe477601fd5338b32f55e2c11189608174a3
captured_at: 2026-07-30T16:04:56Z
authority_level: confirmed-local-read-only
redaction_status: passed
---

# Host Evidence Closure Read-Only Probes

## Scope And Claim Ceiling

本 receipt 只记录当前工作树上 source-owned doctor 的本地只读结果，以及固定 argv 的 host version probe。它没有启动 Cursor/OpenCode/Qoder/Kiro 的 loader、authenticated session 或共享 IDE，没有创建隔离 profile，没有刷新 generated runtime，也没有执行任何 Provider/model/network mutation。因此它可以关闭“当前环境 reason-code 分类”，但不能关闭 loader、precedence、hook activation、IDE safety 或 permission enforcement field claim。

原始 doctor JSON 未写入仓库。以下只保留版本、exit、聚合状态、reason code 和 bounded message；用户目录、绝对路径、raw Skill 内容、凭证和外部 payload 均未持久化。

## Source Identity

- branch：`leo-2026-07-30-skill-update`
- HEAD：`d213fe477601fd5338b32f55e2c11189608174a3`
- source posture：HEAD 加当前工作树；本 receipt 对 `src/cli/commands/doctor.js` 的 platform CLI reason-code patch 取证。
- command posture：`node bin/spec-first.js doctor --<host> --json`；host CLI probe 由 doctor 使用固定 bare command 与 `--version` argv 执行。
- external authorization：不需要；全部操作是当前仓库与 PATH 的本地只读检查。

## Cursor

- doctor exit：`0`
- runtime asset health：`warn`
- host readiness：`warn`
- CLI：`agent` 不在 PATH；`detected_version=null`
- CLI reason：`cursor_cli_not_found`
- current evidence claim：adapter 未设置 promoted field claim；`loader_evidence=false`，`tested_versions=[]`
- retained reasons：`cursor_generated_runtime_loader_unverified`、`cursor_external_skill_precedence_unverified`、`cursor_managed_projection_precedence_unverified`、`cursor_nested_skill_roots_partial`
- local observation：当前项目存在多宿主同名 Skill roots 和 bounded nested scan truncation；这些是冲突/覆盖 facts，不是 native precedence outcome。
- judgment：environment-scoped CLI unavailable 与 host-owned loader/precedence limitation；没有证据支持 source claim promotion。
- re-evaluation：安装可识别的 Cursor `agent` CLI 或提供精确 IDE version 和隔离 profile，并单独授权 loader journey。

## OpenCode

- doctor exit：`0`
- runtime asset health：`warn`
- host readiness：`pass`
- CLI version：`1.18.9`
- current evidence claim：`generated_runtime_preview`; `loader_evidence=false`; `tested_versions=[]`
- retained reasons：`opencode_generated_runtime_loader_unverified`、`opencode_external_skill_precedence_unverified`
- local observation：当前 runtime 中 `.opencode/skills` 与 `.agents/skills` 同时存在；doctor 能发现 duplicate，不能证明 native winner。
- historical boundary：`docs/validation/opencode-host-support/1.18.7/README.md` 的 nested `spec/work` 是旧 projection 反例，不能证明 current flat `spec-work`。
- judgment：精确 installed version 已确认，但 CLI version/presence 不等于 loader journey；不更新 `testedVersions` 或 `evidenceClaim`。
- re-evaluation：获得 isolated HOME/XDG/profile 与 OpenCode loader invocation 明确授权后，针对 current flat projection 运行 1.18.9 journey。

## Qoder

- doctor exit：`0`
- runtime asset health：`warn`
- host readiness：`warn`
- CLI version：`1.0.41`
- current evidence claim：adapter 未设置 promoted field claim；`loader_evidence=false`; `tested_versions=[]`
- retained reason：`qoder_hook_activation_unverified`
- local observation：SessionStart、PreToolUse、Stop settings entries 均保持 degraded-by-design/inert；当前 managed SessionStart script 与 source template 存在 runtime drift，另有 host-local MCP config 缺失提示。
- protocol boundary：`docs/validation/qoder-hooks-protocol-matrix.md` 只确认 settings/command protocol；unauthenticated attempt 不能证明 event execution。
- judgment：CLI presence/version 不等于 authenticated hooks，更不能替代 shared IDE safety；不启用 managed settings entry。
- re-evaluation：分别取得 authenticated CLI event mutation 授权和 shared IDE isolated profile safety 授权。

## Kiro

- doctor exit：`0`
- install health：`pass`
- runtime asset health：`pass`
- host readiness：`warn`
- CLI：`kiro` 不在 PATH；`detected_version=null`
- CLI reason：`kiro_cli_not_found`
- current host support：`support_state=active`; `evidence_claim=null`; `loader_evidence=false`; `tested_versions=[]`
- managed runtime：state 可读，35 个 Skill 目录和 host-native steering pointer 通过 shape 检查。
- additional limitations：decision input 为 `missing`，reason `setup-facts-host-mismatch`；workflow runnability 为 `simulated`，reason `verification_evidence_missing`。
- ownership classification：`kiro_cli_not_found` 是 environment-scoped unavailable，不是 adapter/source defect；managed projection PASS 也不能证明 native loader。
- source defect closed：platform CLI WARNING 现在携带稳定 reason code，且 `host_support.kiro.reason_codes` 同步包含该 code；timeout 和 nonzero version failure 也有独立 reason code contract tests。
- re-evaluation：安装 Kiro CLI 后重跑 doctor/version；native loader claim 仍需精确版本、隔离 profile 和单独 journey 授权。

## Cleanup And Rollback

- 没有创建或修改 host profile、settings、external document、PR、corpus 或 Provider state。
- U8 先预览、后执行 source-owned all-host init；preview 明确列出受管 reset/prune/write paths，实际结果为 Claude、Codex、Cursor、Kiro、Qoder、OpenCode `6/6 ready`。这些 runtime mirror 是 generated output，不是 source fix。
- init 后 Qoder SessionStart script drift 已消失；保留的 Qoder warnings 是 `qoder_hook_activation_unverified` 和缺少 host-local MCP config，未把正确降级压成 PASS。
- init 后 Cursor、OpenCode 仍保留 loader/precedence reason；Kiro 仍为 `kiro_cli_not_found`。没有修改 `testedVersions` 或提升 `evidenceClaim`。
- 若 reason-code patch 回归，回滚 `src/cli/commands/doctor.js` 与聚焦 test 即可；不得通过删除 WARNING 或手改 generated runtime 伪造通过。

## Result

| Unit | Status | Result |
| --- | --- | --- |
| U5 | `degraded-by-design` | Cursor CLI unavailable；OpenCode 1.18.9 版本可见但 loader/precedence journey 未获授权。所有相关 warning 保留。 |
| U6 | `degraded-by-design` | Qoder 1.0.41 可见；authenticated event execution 与 shared IDE safety 均未获授权，hooks 保持 inert。 |
| U7 | `degraded-by-design` | Kiro 当前环境被精确分类为 `kiro_cli_not_found`；共享 doctor owner 已补 reason-code contract，未把环境缺失改成 source/loader defect。 |
| U8 | `degraded-by-design` | source claim 未提升；all-host init 6/6 ready，post-init doctor 保留全部正确 host/Provider limitations。 |
