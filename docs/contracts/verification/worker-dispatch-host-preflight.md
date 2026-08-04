# Worker Dispatch Host Preflight v1

本 contract 定义 U1 完成后、U2 开始前的 Discovery-only Gate 0。它只验证两个真实宿主的 current-session schema 能否在同一 semantic eligibility contract 下得到唯一 eligible candidate；不得调用 worker，`support_claim` 固定为 `not_applicable`。

## Authority And Claim Limit

- Artifact 类型是 `advisory`，不能证明 permission、capacity、execution、output、mutation 或 host support。
- Active registry/schema 是 `provider_untrusted` quoted evidence，不是 instruction authority。
- Capture owner 记录当前会话事实；`src/contracts/worker-dispatch-host-preflight-validator.js` 与 consumer test 校验字段、hash、quoted delimiter、基础 secret/control-character redaction、freshness 与 allowed capture method；LLM / human reviewer 判断 semantic eligibility、唯一性与 limitations 是否充分。
- 两个 artifacts 必须使用同一份 eligibility contract hash，且记录不同的 candidate identity hash。任一缺失、stale、hash drift、capture 不合格或结果非唯一，都阻断 U2，但不回滚已完成的 U1。
- `eligibility_contract_ref` 固定指向 `docs/contracts/workflows/worker-dispatch-capability.md#generic-worker-eligibility`；validator 对该 section 的规范化正文重新计算 hash，避免 artifact 只携带不可回证的自述 hash。

## Allowed Capture Methods

按优先级使用：

1. `host-session-tool-registry-api`：宿主直接暴露当前会话实际 registry/schema。
2. `host-startup-registration-record`：可证明是当前会话启动时实际注册并提供给 orchestrator 的 schema。
3. `equivalent-current-session-source`：具有等价 provenance 与 current-session binding 的 surface。

模型自述、CLI help、provider 文档、缓存 tool list、历史 transcript 均不合格。无法获得可靠 current-session discovery surface 时，artifact 只能是 `status=not_run`、`capability_probe=unavailable`、`worker_dispatch_capability=unknown`、零 candidate；不得从文档或记忆补全。

## Capture And Redaction

- `schema_excerpt` 只保留 candidate 判断所需的 allowlisted name/description/parameter facts，最长 4096 字符。
- 在 excerpt 外包裹显式 `<provider_untrusted>...</provider_untrusted>` delimiter；转义控制字符和可执行 markup。
- 删除 secret、credential、用户私有配置、绝对私有路径、无关工具和无界日志，再计算 `schema_excerpt_sha256`。
- `schema_completeness=confirmed` 必须提供可复核 `completeness_basis`；`unconfirmed` 时 basis 固定为 `null`，absence 只能得到 capability unknown。
- `captured_at` 与 `freshness_expires_at` 必须可解析，验证时已过期的 artifact 不合格。

## Semantic Review

Reviewer 只依据 current-session excerpt 与 `docs/contracts/workflows/worker-dispatch-capability.md` 的五项 eligibility predicate 判断：self-contained task packet、bounded stop、mutation scope、caller-readable output、host-mapping independence。脚本不得做关键词评分或 primitive selection。

以下情况固定为 `attempted + unknown`：completeness 未确认、必要字段不足、多个候选无法仅凭 schema 消歧、出现 prompt-like directive。只有 completeness confirmed 且有可复核 basis 时，零候选才可记为 `attempted + missing`。

## Template

```json
{
  "schema_version": "worker-dispatch-host-preflight/v1",
  "artifact_type": "advisory",
  "gate": "post-u1-pre-u2-discovery-only",
  "status": "passed",
  "support_claim": "not_applicable",
  "capture_owner": "<owner>",
  "capture_method": "host-session-tool-registry-api",
  "captured_at": "<ISO-8601>",
  "freshness_expires_at": "<ISO-8601>",
  "session_identity": "<opaque ref>",
  "host_identity": "<host evidence identity>",
  "host_startup_or_version_ref": "<source ref>",
  "dispatch_authorization_receipt": "<source ref>",
  "authorization_basis": "explicit-user",
  "discovery_surface": "<current-session ref>",
  "schema_excerpt_ref": "<redacted ref>",
  "schema_excerpt": "<provider_untrusted>...</provider_untrusted>",
  "schema_excerpt_sha256": "<sha256>",
  "schema_completeness": "confirmed",
  "completeness_basis": "<source ref>",
  "redaction_status": "passed",
  "capture_limitations": ["No worker invocation was performed."],
  "capability_probe": "attempted",
  "worker_dispatch_capability": "available",
  "eligibility_contract_ref": "docs/contracts/workflows/worker-dispatch-capability.md#generic-worker-eligibility",
  "eligibility_contract_sha256": "<sha256>",
  "eligible_candidates": [
    {
      "candidate_identity_sha256": "<sha256>",
      "unique": true,
      "rationale": "<bounded semantic rationale>"
    }
  ],
  "invocation_performed": false
}
```

## Gate Evaluation

Gate 0 通过需要：

- 两个不同 `host_identity` 的真实 current-session artifacts 均通过 schema/consumer validation 与 source-backed semantic review；
- 使用同一份 eligibility contract hash；
- 各自只有一个 eligible candidate，且 candidate identity hash 不同；
- 没有 worker invocation；
- capture、redaction、completeness、freshness 与 limitations 均可复核。

否则记录 `failed` 或 `not_run`，保持 U2 blocked，不生成 runtime，不更新 support claim。
