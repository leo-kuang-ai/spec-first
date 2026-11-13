# Provider Readiness Fields (provider-readiness.v2)

Field-level contract for `provider_readiness[]` as consumed from the loaded skill directory. The repo-side canonical contract is `docs/contracts/provider-readiness.md` (schema: `docs/contracts/provider-readiness.schema.json`); when working inside this repository, update that contract first and keep this projection aligned. Read this file when authoring or auditing readiness facts, not for ordinary setup decisions.

## Lifecycle display bits and metadata

Setup may populate lifecycle display bits such as `installed`, `configured`, `indexed`, `server_reachable`, and `query_verified`, plus setup-owned runtime metadata such as `native_interfaces`, `first_generation`, `steady_state`, and `usage_note`. These explain boundaries and next actions; they do not decide semantic truth — `readiness_status` remains the only readiness field entering decision health.

## Graphify first-generation provenance

Graphify may add `first_generation.scope_provenance` to separate requested scope from the scope verified by a contained receipt bound to the current `graph.json`:

- receipt missing / mismatch / invalid → first-generation status `unknown` for that request;
- a missing legacy receipt → core readiness `unknown`, graph advisory-only;
- a mismatched or invalid receipt → `readiness_status=degraded`, so selected setup/verify cannot report completion for an unproved requested scope.

## steady_state hook facts

`steady_state` may include project-local hook readiness facts for optional provider refresh setup, such as Graphify `hook_installed`, `hook_verified`, `hook_status=blocked`, and `refresh_mode=manual-only`.

## Display derivation and scope fields

The human status table may derive `readiness_scope` and `probe_status` from existing lifecycle bits to separate install/index readiness from real server/query probes. `probe_status` 是派生显示列；机器字段 `readiness_scope=installation|artifact` 标识本次验证范围，旧数据缺失按 artifact 路径兼容，不推断安装已验证。

The decision rules that gate setup judgments (fresh→unknown, stale→stale, `query_verified` reserved for real probes, never summarizing false/missing probes as confirmed) stay in `SKILL.md` because every run needs them on load.
