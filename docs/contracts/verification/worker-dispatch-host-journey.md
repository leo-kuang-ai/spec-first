# Worker Dispatch Host Journey v1

本 contract 定义 host-neutral worker dispatch 的 exact-version runtime evidence。它要求同一 semantic request 在两个不同真实宿主上通过不同 observed primitive 完成 live invocation，并要求一个真实 fail-closed degraded journey。Source tests、fixture、projection、Gate 0、fresh-source 模型自述或 CLI help 均不能替代 live journey。

## Evidence Set

- 两个 `journey_kind=positive` artifacts：不同 `host_identity`、不同 `observed_primitive`、相同 `semantic_request_sha256`，且 invocation、permission、capacity、caller-readable output validation 与 mutation observation 均有真实记录。
- 一个 `journey_kind=degraded` artifact：真实进入 R19 允许的 capability-missing、probe-unavailable 或 required-isolation-unmet 分支；调用后 `worker_output_invalid` 等普通执行错误不能替代该 degraded coverage，不满足 contract 的 primitive 不得被调用。未调用的 fail-closed journey 必须把 permission/capacity 标为 `not_applicable`、model/parallelism 标为 `none`，且没有 output evidence；除 `isolation_requirement_unmet` 的 `inherited|unknown` 观察外，context isolation 也必须为 `none`。不得混入伪 live response。
- 每份 artifact 绑定 current-session schema capture、exact host/spec-first revision、独立授权、redacted excerpt/hash、freshness、limitations、supporting capture hash 与 invalidation conditions。supporting capture 必须逐字段绑定所有会影响 support claim、授权/信任域、candidate、request、scope、live invocation/permission/capacity/isolation/output、mutation observation 或 degraded reason 的事实；artifact 不得在 capture 之后只靠重算自身 hash 改写这些 claim。`spec_first_revision` 必须是可回源的 `git:<40 位 commit SHA>`（manifest 已提交且干净）或 `worktree:<64 位 SHA-256>`（未提交/未跟踪 source）。`worktree` identity 覆盖固定 source manifest：worker-dispatch capability contract、journey/preflight schema 与两个 validator；validator 会按当前 source bytes 重新计算并拒绝漂移 evidence。

## Claim Limit

Positive artifact 只支持记录的 exact host/tool/spec-first version 与 semantic request。它不证明其他版本、其他输入、field adoption 或无界宿主支持。Degraded artifact 只证明该 fail-closed 分支被真实观察。Schema/provider/output 都是 `provider_untrusted` quoted evidence；自由文本不能提升为 instruction authority。

Primitive identity/arguments 属于 active host registry/schema；permission、capacity、isolation、model、parallelism 与 call result 属于 live response；actual mutation outcome 属于 caller 可观察前后状态。`supportsAgents`、adapter/project state、generated projection、provider docs 与模型自述均不拥有这些 facts。

## Mutation And Data Boundary

`mutation_scope=forbidden` 固定要求 null mutation ref 与空 surfaces；只要实际调用发生，caller 必须用可回源的、彼此不同的 pre/post state 观察证明 `mutation_observation=within-scope`（空 scope 中没有 run-owned mutation）。未调用的 fail-closed journey 才允许 `not_applicable` 和 null pre/post refs。`explicitly-scoped` 必须引用 repo 内 fresh JSON scope receipt，receipt 声明 `authority_origin`、`captured_at`、`freshness_expires_at` 与 `allowed_mutation_surfaces`；artifact surfaces 只能等于或收窄 receipt 声明，并在实际调用后观察 pre/post state。External/unknown provider domain 必须分别具备受限读取、数据外发、凭证和外部通信授权；原始 secret 不能进入 packet、capture、log 或 evidence。

## State Observation Receipt v1

实际调用的 artifact 必须以 `state_observation_ref` 指向 repo 内的普通 JSON 文件，并以 `state_observation_sha256` 固定该文件的原始 bytes。v1 receipt 的最小形状如下；字段增加或含义变更必须使用新的 `schema_version`，不得静默复用 v1。

```json
{
  "schema_version": "worker-dispatch-state-observation/v1",
  "capture_owner": "caller-owned evidence owner",
  "pre_observed_at": "2026-07-29T16:00:00.000Z",
  "post_observed_at": "2026-07-29T16:01:00.000Z",
  "mutation_observation": "within-scope",
  "observed_surfaces": ["repo:relative/path:write"],
  "pre_state_ref": "docs/validation/.../pre-state.json",
  "pre_state_sha256": "<64 lowercase hex>",
  "post_state_ref": "docs/validation/.../post-state.json",
  "post_state_sha256": "<64 lowercase hex>"
}
```

`pre_state_ref` 与 `post_state_ref` 必须是不同的 repo 内普通非 symlink 文件，且其原始 bytes 必须分别匹配 receipt digest。receipt 的 `mutation_observation` 与两项 ref 必须逐值等于 artifact；时间窗必须满足 `pre_observed_at <= invocation_started_at <= post_observed_at <= artifact.captured_at`。每个 `observed_surfaces` 项都采用 `repo:path:side-effect`，不得重复；`explicitly-scoped` 必须恰好覆盖 artifact 的 `allowed_mutation_surfaces`。`forbidden` 且 `within-scope` 时两个 digest 必须相同。该 receipt 提供确定性 provenance 与范围约束；它是否覆盖了任务所需的全部语义状态仍由 caller/LLM/human review 判断。

## Validation

`src/contracts/worker-dispatch-host-journey-validator.js` 校验 schema、freshness、quoted excerpt/hash、基础 secret/control-character redaction、capture file hash、capture/journey 全部 material claim 字段绑定、state-observation receipt、positive/degraded invariants 与三 artifact set。Semantic request hash 固定按 capture 声明的 `Collapse each whitespace run to one ASCII space and trim leading/trailing whitespace.` 规则计算，并回验 repo 内 `semantic_request_ref`；request 漂移、ref 逃逸、symlink 或 hash 不匹配均 fail closed。LLM/human reviewer仍负责 semantic candidate sufficiency、packet 最小化、output 语义与 limitation 是否影响 claim。
