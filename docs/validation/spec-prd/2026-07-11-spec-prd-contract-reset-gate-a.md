# spec-prd Contract Reset Gate A

- **Attempt:** `gate-a-2026-07-11-002`
- **Run ID:** `2026-07-11-gate-a-attempt-002`
- **Date:** 2026-07-11
- **Decision:** `inconclusive`
- **Legal outcome:** 保留已验证的 Phase 1 Exit Safety；candidate 不推广；禁止创建或执行 U7-U13 source patch、migration manifest、rollback forward-reader closure 或默认 runtime cutover。

## 结论

Gate A 未取得合规 outcome evidence，不能通过。

Source-owned runner 在 review follow-up 后重新冻结并重建 baseline、Phase 1-fixed control 与 eval-only candidate，生成 54 条 fresh-session/balanced-order schedule，并在 private run directory 中执行第一条 preflight。`attempt-002` 当时的 macOS active probe process 以 `SIGABRT` 终止，未形成绝对路径、父目录、symlink、control plane 与 sibling arm read 的真实 deny facts。该 attempt 的 runner 因此保持 `model_invoked: false`；这些 retained facts 是不可追溯升级的历史证据。

后续 source 修复已定位并解除本机 isolation blocker：旧 probe 在 sandbox 内启动 Homebrew Node，macOS 26 dyld 先因 `/` 与 Cryptex shared-cache 入口不可读而 abort；继续放开后还会要求 Homebrew Cellar dylib 与 OpenSSL 配置，扩大非必要读取面。当前 runner 改用系统 `/usr/bin/perl` 最小 errno helper，并仅补 dyld 所需系统 namespace；本机 fresh integration probe 的五类读取均返回真实 `EPERM`。这只确认当前 source 的 isolation deterministic floor，不属于 `attempt-002`，也不创建或授权新的 Gate A attempt。

同一 attempt 也没有独立于实现者身份的 custody primitive；`promotion-holdout-commitment.json` 诚实记录 `commitment_status: unavailable`，未创建同用户可读的伪 sealed bundle。

因此本次没有模型产物、blind packet、per-run grade、three-arm median 或 material/core-product-quality 比较。缺失项不能由 fixture、candidate prose、replay 测试或 transcript 自述补齐。按计划 Gate A 必须为 `inconclusive`，执行到此合法停止。

## 冻结输入

| 项目 | 冻结事实 |
| --- | --- |
| Attempt-002 frozen protocol | `skills/spec-prd/evals/contract-reset-protocol.md` 在 attempt 创建时的 bytes；SHA-256 `d8f480ccd796d614e295f716564aa30430bfb16704ef508036376c3ec4395bf8` |
| Current protocol source | review follow-up 后当前 bytes；SHA-256 `baddf3935e43e32d132cd9ed9d153fc0fbecf6595dbcdcfb1bcc1ae3ca44742b`；不是 attempt-002 的冻结输入。 |
| Cases / thresholds | `skills/spec-prd/evals/contract-reset-cases.json`; SHA-256 `ef9ed4e2d200c6b2bd267ac96a5fa1fd8c2f0338070251f488beac94ae4b4526` |
| Parent revision | `a574194b13ee3e53e1d7cd36bbfc86ac058db0cc` |
| Phase 1 control patch | SHA-256 `52fdd946fba0aaf9fcfb35e76d7777165983d65f618728ab70f33c241c5897e0` |
| Candidate patch | SHA-256 `722f07312513b88877115c42f26e388b721ae8a5b1fedd7617aeec846afcb89d` |
| Baseline tree | `sha256:64ea8c078cebeaed08c053f0d0a7350949da720f67e7e8ab949db8a0f4f5c594` |
| Phase 1 control tree | `sha256:95bb225b3aa369b3f656e223b4955e2d43cdff89794e10a1b0f135b24228e1ac` |
| Candidate tree | `sha256:948584c8a5a42e46c0af49aefe714ebcbd4adef52602ead13a127a1f40f85f99` |
| Threshold contract | `sha256:100b94a041521d5289e3a364c701e59205a438a8bc6253ba28a6d14a316135a9` |
| Scheduled sessions | 6 output cases × 3 arms × 3 repeats = 54；每条为 opaque UUID，顺序按冻结 Latin rotation 平衡。 |
| Host/model profile | Codex、GPT-5、fresh generic agent、context reuse forbidden、sandbox-root-only。 |

Create/refine/validate 的 `minimum_material_effect` 与全局 `maximum_complexity_budget` 在任何模型结果前已经写入 cases source。Design/domain/stress 只作零容忍 regression veto；trigger matrix 独立计分。

`attempt-002` 的 manifest、patch、materialization、run facts、holdout 与 enclosing audit 可按 retained hashes 审计，但 durable bundle 只保留了 original protocol 的 SHA-256，没有保留 `d8f480...` 对应的 protocol bytes；因此它不能证明旧协议正文可独立重放，也不会因 post-attempt protocol/validator/prose hardening 被追溯改写。当前 source 若重开 Gate A，必须建立新 attempt 并把 protocol bytes 与 hash 一并冻结，重新绑定 control tree、candidate tree 与 hashes；不得把 current protocol hash 冒充为本次 run 使用的输入。

## 确定性证据

Durable run audit：[`2026-07-11-gate-a-attempt-002/`](2026-07-11-gate-a-attempt-002/)

`attempt-001` 保留为原始历史 preflight；它早于本轮 deterministic contract hardening，缺少 `artifact_type`、materialization receipt 与 completed-session 字段，因此不会被新 validator 伪装成当前结构通过证据。

| Artifact | SHA-256 | 结论 |
| --- | --- | --- |
| `source-manifest.json` | `3d3bb5c27d3d4351238f268ab53d9511c90054cd60190f9293f84091490ed21f` | `generated`；parent、cases、patch、source allowlist、tree、threshold、profile、session/order contract 可解析。 |
| `materialization-verification.json` | `6604ceb8dc92104b3f358ffd268c6eb44e218f03bdeb0dc9fb935a0bf2baefbb` | `confirmed`；三臂 patch chain、tree hash、source file count 与 materialization contract 绑定。 |
| `control.patch` | `52fdd946fba0aaf9fcfb35e76d7777165983d65f618728ab70f33c241c5897e0` | `generated`；从 parent 重建 hardened Phase 1-fixed control。 |
| `candidate.patch` | `722f07312513b88877115c42f26e388b721ae8a5b1fedd7617aeec846afcb89d` | eval-only Product Contract candidate；未应用到默认 source/runtime。 |
| `run-facts.json` | `2552bd0654fc9ee9737a54f49d62f304b7a284904b4c7d15cad63b8e21388794` | `degraded`；isolation preflight `SIGABRT`、`model_invoked: false`、54 scheduled / 1 attempted / 0 completed。 |
| `promotion-holdout-commitment.json` | `be393272fbc451da55a814d3aa204dd0a09edfe431e97eb9c99314ab85861f43` | `degraded`；independent custody unavailable；无 bundle、mapping 或 expected notes。 |
| `run-audit-manifest.json` | `e5de3eeac49001f07d906ea92b417f4139e66d9df638bb5085470cb0704bca64` | `generated` enclosing bundle；逐文件记录 hash 与 artifact type，不从 deterministic export 推断 semantic outcome。 |

`run-evals.js --run-dir ... --require-run-audit` 对 durable run directory 返回：

```text
status=passed
gate_a_status=inconclusive
reason_codes=holdout_commitment_unavailable,isolation_probe_execution_failed,model_outcomes_missing,session_execution_incomplete
structural_reason_codes=none
```

这里的 `status=passed` 只证明 run directory 确定性合同有效，不表示 Gate A 通过。

## Active Probe 结果

| Probe / gate | Observed result | Authority |
| --- | --- | --- |
| Sandbox primitive discovery | `macos-sandbox-exec` binary 可执行 | confirmed deterministic fact |
| Probe process | `SIGABRT`；无 probe JSON | confirmed deterministic fact |
| Absolute read denied | 未证明 | unavailable |
| Parent traversal denied | 未证明 | unavailable |
| External symlink denied | 未证明 | unavailable |
| Control plane denied | 未证明 | unavailable |
| Sibling arm denied | 未证明 | unavailable |
| Model invocation | `false` | confirmed deterministic fact |
| Holdout custody | independent boundary unavailable | confirmed limitation |

上表只描述 `attempt-002`。Binary presence 不是 runtime enforcement readiness；该 attempt 因 hard-isolation floor 未通过而没有调用模型，这不是 arm fail，而是 Gate A infrastructure `inconclusive`。

当前 source 的独立 follow-up probe 为 `confirmed` / `passed`：absolute、parent traversal、external symlink、control plane 与 sibling arm 五项均得到 `EPERM`，且 `model_invoked: false`。该结果证明 isolation probe 修复，不证明模型 outcome、blind review、holdout commitment 或 Gate A 通过。

## Gate A 判定

| Gate A 条件 | 状态 | 原因 |
| --- | --- | --- |
| Three-arm ≥3 runs/case | 未执行 | hard isolation preflight 未通过。 |
| Fresh session / balanced order | schedule 已冻结；outcome 未执行 | 不能把 schedule presence 当作 model-run evidence。 |
| 2/3 Primary 达到 material effect | 未判定 | 无原 run output/grade。 |
| Core product quality 持平且无新 fail | 未判定 | 无 blind packet/reviewer result。 |
| Critical / Non-regression 零失败 | 未判定 | 无 outcome。 |
| Complexity budget | candidate declaration 可审计；未形成 outcome verdict | 不能单独授权继续。 |
| Isolation / identity contamination | attempt-002 不通过；当前 source 本机 probe 已修复 | 历史 attempt deny facts 缺失且不可追溯升级；当前 source 五项 deny facts 不替代新 attempt 证据。 |
| Independent replay | deterministic materialization replay tests 通过；真实模型 case replay 未执行 | infrastructure proof 不能替代 outcome replay。 |
| Promotion holdout commitment | 不可用 | 无独立 custody boundary。 |

最终决策：`inconclusive`，不进入 U7。

## KTD3 与 Consumer Policy 审计

- Candidate patch 固定单一 Markdown `spec-unified-plan/v1` requirements-only Product Contract under `docs/plans/`，声明 `product_contract_source: spec-prd`，没有改选独立 PRD topology。
- Candidate 只存在于 retained patch 和 materialized eval tree；默认 source、generated runtime 与 artifact topology 未切换。
- Phase 1 的 legacy `docs/brainstorms/*-requirements.*` 与 optional receipt diagnostic 保持当前行为。
- Mandatory consumer receipt enforcement 未启用；没有 U11/U12/U13 consumer、migration 或 cutover patch。
- 未手改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/` 或 `.qoder/` runtime mirror。

## 已执行验证

- `npx jest --runTestsByPath tests/unit/spec-prd-contracts.test.js tests/unit/spec-prd-contract-reset-eval.test.js tests/unit/spec-prd-contract-reset-evidence.test.js tests/integration/spec-prd-contract-reset-isolation.integration.test.js tests/integration/spec-prd-contract-reset-replay.integration.test.js tests/unit/spec-prd-hook-contracts.test.js --runInBand`：6 suites / 98 tests passed。
- `npm run test:unit`：57 suites / 371 tests passed。
- `npm run typecheck`：132 files passed；`npm run lint:skill-entrypoints`：284 files passed。
- 独立 fresh-source eval：12 suites / 140 tests passed，`status: passed`，无 material concern；保留 Qoder activation unverified 与 attempt-002 original protocol bytes 未 retained 两项已披露 P3 limitation。
- `git apply --check skills/spec-prd/evals/contract-reset-candidate.patch`：passed。
- `node skills/spec-prd/evals/run-contract-reset-arm.js --prepare-run ...`：三臂 source tree 与 54-session schedule 生成成功。
- `node skills/spec-prd/evals/run-contract-reset-arm.js ...`：active probe observed `SIGABRT`，模型未调用。
- `node skills/spec-prd/evals/run-evals.js --run-dir docs/validation/spec-prd/2026-07-11-gate-a-attempt-002 --require-run-audit --json`：deterministic run contract 与 enclosing audit manifest passed，Gate A inconclusive。
- `node skills/spec-prd/evals/prepare-contract-reset-evidence.js --run-audit ... --cleanup`：7 个 typed durable audit files 生成，native namespace/control 临时内容已删除。

以上命令与计数属于 `attempt-002` 及其 review follow-up。Isolation 修复后的新增验证记录：

- `npx jest --runTestsByPath tests/integration/spec-prd-contract-reset-isolation.integration.test.js --runInBand`：1 suite / 5 tests passed；覆盖 command/helper unavailable、execution failure、output symlink confinement 与本机五项真实 deny facts，不能把 execution failure 或 namespace 外写入降级后放行。
- final direct probe fixture：`artifact_type: confirmed`、`status: passed`、`reason_code: isolation_probe_passed`、`exit_code: 0`；absolute、parent traversal、symlink、control 与 sibling 五项均为 `{ denied: true, code: EPERM }`，且 `model_invoked: false`。

## Reopen Conditions

只有在新 attempt 中同时取得以下证据，才能重开 Gate A：

1. source-owned launcher 可在同一 fresh generic-agent invocation 中使用真实 hard sandbox/namespace；五类 active probes 全部产生 attempt-bound deny facts（当前 source 已通过本机前置验证，但尚未建立新 attempt）；
2. 生成 Agent 不可访问 control plane、sibling arms、历史 session/output/cache；
3. 独立 custodian 提交与实现者身份隔离的 sealed-holdout commitment；
4. 每 arm/case ≥3 runs，原 run sanitized Product Contract/blind packet、event、grade 与 hashes 可持久审计；
5. 另一名 operator 可按 protocol 重放至少一个真实 case；
6. blind reviewer 与 owner 对 material effect、core product quality、critical/Non-regression 和 complexity 给出绑定 retained-evidence hashes 的裁决。

当前缺少第 3 项 independent holdout custody，因此不得建立新 attempt。Gate A 继续按“未通过/不合规”合法结束于 Phase 1 + U6 evidence，不实施 U7-U13。
