# Provider Serving Receipt

`provider-serving-receipt/v2` 是跨模型 subprocess 启动前的 served-identity 降级 artifact。当前 spec-first 没有宿主不可伪造的签名、受保护 FD/socket 或 host API provenance，因此普通文件 receipt 只能记录 self-asserted 路由事实，不能证明实际 serving identity。

## Producer 与所有权

- `producer.authority` 固定为 `self-asserted`，`verification_status` 固定为 `unverified`，`artifact_type` 固定为 `degraded`。
- spec-first、LLM reviewer、shell wrapper 和 requested model 参数不得把该文件提升成 actual identity 证明。
- receipt 可以存放在 owner-private run directory并绑定 hash，但文件 ownership 与 self-hash 只证明 bytes 未漂移，不认证 producer。
- peer runner 和三个 cross-model adapter 在发布 task packet 或启动 subprocess 前返回 `provider_serving_receipt_unverified`；继续 inline/serial fallback，不计 independent coverage。

## Binding

Receipt 仍绑定当前 `semantic_request_sha256`、`source_identity`、`provider_trust_domain`、requested/actual provider/model 和精确 `credential_env_allowlist`，供诊断与未来 authenticated host primitive 接入使用。这些字段全部是 advisory，不得用于启动 peer。

## Claim Ceiling

当前 claim ceiling 是 `serving_identity_status: unverified`、`worker_dispatch_outcome: inline-fallback`。未来只有 host primitive 提供 runner 可独立认证、且 worker/LLM/caller 无法伪造的 provenance channel 后，才能引入新的 confirmed schema/version；不得通过给 v2 增加一个自填 `verified` 字段绕过该边界。
