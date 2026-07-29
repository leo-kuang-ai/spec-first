# Worker Dispatch Journey Re-Capture Checklist

本文件是 `docs/plans/2026-07-28-001-refactor-host-neutral-worker-dispatch-plan.md` DoD 行 736（BLOCKED）引用的字段对照表。按 v3.3 §3.4 "证据优先于自信"——每条 journey 被 validator 接受的精确条件列在下面。不满足任一条件 = claim 保持未关闭。

**前置条件（全部必须满足才能开始捕获）：**

- [ ] 工作树已 commit，validator 的 `sourceIdentity()` 返回稳定的 `git:<sha>`
- [ ] 用户已在当前会话显式授权 worker dispatch（`authorization_basis: "explicit-user"`）
- [ ] 当前会话可访问 Claude Code（用于 2 条 journeys）与 Codex CLI（用于 1 条 journey）

**当前 HEAD（写 checklist 时）：** `a77917a4d578b1faaa0d1a6a4bbd0786d1b1bfdc`  
**捕获时需替换为当时的 `git rev-parse HEAD`。**

---

## 通用字段（3 条 journey 都必须有）

这些是 schema `required` 数组里的字段。3 条旧 journey 都有——复制过来即可，**不需要修改**：

| 字段 | 值来源 | 备注 |
|---|---|---|
| `schema_version` | 固定 `"worker-dispatch-host-journey/v1"` | 不变 |
| `artifact_type` | 固定 `"confirmed"` | 不变 |
| `status` | 固定 `"passed"` | 仅当 validator 接受时才能填 `passed`；捕获时先填 `"captured"`，validator 通过后再改为 `"passed"` |
| `support_claim` | 固定 `"exact_version_observed"` | 不变 |
| `capture_owner` | 你的名字/身份 | 旧值可用 |
| `capture_method` | `"host-session-tool-registry-api"` / `"host-startup-registration-record"` / `"equivalent-current-session-source"` | 见每条 journey 的具体要求 |
| `captured_at` | **新 ISO-8601 时间戳** | 必须是当前捕获时刻，不能复用旧值 |
| `freshness_expires_at` | `captured_at + 24h` | 用 ISO-8601 |
| `session_identity` | **当前会话的不透明标识** | 每个宿主会话不同值 |
| `host_identity` | `"claude-code/<ver>"` 或 `"codex-cli/<ver>"` | 见每条 journey |
| `host_startup_or_version_ref` | 当前会话的版本证明 | 命令行 `--version` 输出或等价 |
| `tested_host_version` | 同上，人类可读 | |
| `spec_first_revision` | **`"git:<捕获时的 HEAD SHA>"`** | ❗ 必须严格匹配 validator 的 `sourceIdentity()` |
| `dispatch_authorization_receipt` | 当前会话中用户授权的引用 | |
| `authorization_basis` | 固定 `"explicit-user"` | |
| `restricted_read_authorization` | `"not_applicable"`（host-native domain） | 不变 |
| `data_egress_authorization` | `"not_applicable"` | 不变 |
| `credential_use_authorization` | `"not_applicable"` | 不变 |
| `external_communication_authorization` | `"not_applicable"` | 不变 |
| `provider_trust_domain` | 固定 `"host-native"` | 不变 |
| `mutation_scope` | `"forbidden"` | 不变（3 条 journey 都为 forbidden） |
| `mutation_authorization_ref` | `null` | 不变 |
| `allowed_mutation_surfaces` | `[]` | 不变 |
| `output_contract` | `"worker-dispatch-journey-output/v1"` | 不变 |
| `redaction_status` | 固定 `"passed"` | 捕获后进行 secret redaction |

## 新增必填字段（3 条 journey 都必须有——旧 journey 缺失）

这些是 post-capture schema 收紧后新增的 `required` 字段：

| 字段 | 类型 | 正例值 | 说明 |
|---|---|---|---|
| `invocation_started_at` | `string \| null`（ISO-8601，max 40 chars） | `"2026-07-29T10:30:00.000Z"` | invoked journey 必须早于 `captured_at`；non-invoked journey 必须为 `null` |
| `capability_probe` | `enum: "not_applicable" \| "attempted" \| "unavailable"` | `"attempted"` | 只要检查了当前会话 schema 就是 `attempted`；只有无 reliable discovery surface 才用 `unavailable` |
| `worker_dispatch_capability` | `enum: "available" \| "missing" \| "unknown"` | positive: `"available"`；degraded: `"unknown"` | `available` 仅当 schema 中有唯一 eligible candidate |
| `state_observation_ref` | `string \| null`（max 512 chars） | `"docs/validation/worker-dispatch/2026-07-29-state-obs-claude.json"` 或 `null` | invoked → 指向 state observation receipt 文件；non-invoked → `null` |
| `state_observation_sha256` | `string \| null`（64 hex chars） | `"<sha256>"` 或 `null` | invoked → receipt 文件 SHA-256；non-invoked → `null` |
| `reason_codes` | `array` | positive: `[]`；degraded: `["isolation_requirement_unmet"]` | positive journey 必须为空；degraded 必须至少含一个有效 reason code |

---

## Journey 1：Claude Code positive

**捕获环境：** Claude Code 会话，用户已授权 dispatch，worker 实际被调用并返回符合 `output_contract` 的结果。

**可复用旧 journey 的字段（复制过来，仅更新标注 ❗ 的）：**

| 字段 | 旧值 | 新值 |
|---|---|---|
| `journey_kind` | `"positive"` | 不变 |
| `capture_owner` | `"Codex orchestrator /root"` | 改成你的实际身份 |
| `capture_method` | `"equivalent-current-session-source"` | **重新判定**——优先用 `"host-session-tool-registry-api"`；Claude 如果暴露 tool registry API 就用它 |
| `host_identity` | `"claude-code/2.1.220"` | ❗ 改成当前实际版本 |
| `tested_host_version` | `"Claude Code 2.1.220"` | ❗ 同上 |
| `session_identity` | 旧值 | ❗ 改成当前会话标识 |
| `observed_primitive` | `"Agent"` | 如果当前 Claude 版本仍暴露 `Agent` tool 则不变；否则改成实际 observed primitive |
| `candidate_identity_sha256` | 旧值 | ❗ **重新计算**——对当前捕获的 schema excerpt 计算 candidate identity hash |
| `schema_excerpt` | 旧值 | ❗ **重新捕获**——当前会话实际消费的 tool schema，`<provider_untrusted>` 包裹，allowlist + secret-redaction + 长度上限 |
| `schema_excerpt_sha256` | 旧值 | ❗ **重新计算**——对新的 `schema_excerpt` 算 SHA-256 |
| `schema_completeness` | `"confirmed"` | 如果当前会话能确认 schema 完整性则不变 |
| `completeness_basis` | 旧值 | ❗ 更新为当前会话的可复核依据 |
| `semantic_request_sha256` | 旧值 | 如果 `semantic-request.md` 没变则不变 |

**新增字段：**

| 字段 | 值 | 说明 |
|---|---|---|
| `invocation_started_at` | `"<ISO-8601>"` | worker 实际开始调用的时刻，必须 < `captured_at` |
| `capability_probe` | `"attempted"` | 检查了当前会话 schema |
| `worker_dispatch_capability` | `"available"` | Claude `Agent` tool schema 满足 generic worker eligibility predicate |
| `state_observation_ref` | `"docs/validation/worker-dispatch/2026-07-29-state-obs-claude-positive.json"` | 指向 state observation receipt（见下方 state observation receipt 格式） |
| `state_observation_sha256` | `"<sha256>"` | receipt 文件的 SHA-256 |
| `reason_codes` | `[]` | positive journey 必须为空 |

**State observation receipt 格式**（新建文件 `docs/validation/worker-dispatch/2026-07-29-state-obs-claude-positive.json`）：

```json
{
  "schema_version": "worker-dispatch-state-observation/v1",
  "captured_at": "<ISO-8601>",
  "invocation_performed": true,
  "mutation_scope": "forbidden",
  "pre_state": {
    "ref": "<git tree SHA or file path snapshot>",
    "sha256": "<sha256>"
  },
  "post_state": {
    "ref": "<git tree SHA or file path snapshot>",
    "sha256": "<sha256>"
  },
  "mutation_observation": "within-scope",
  "run_owned_mutation_detected": false
}
```

**关键说明**：`mutation_scope=forbidden` 时，invoked journey 必须有 caller 可观察的 pre/post state。项目内默认用 git tree SHA 或等价文件快照。不需要全局 diff——只需要证明当前 task scope 内没有 run-owned mutation。

---

## Journey 2：Codex CLI positive

**捕获环境：** Codex CLI 会话，用户已授权 dispatch，worker 实际被调用。

**可复用旧 journey 的字段：**

| 字段 | 旧值 | 新值 |
|---|---|---|
| `journey_kind` | `"positive"` | 不变 |
| `capture_method` | `"host-startup-registration-record"` | 重新判定 |
| `host_identity` | `"codex-cli/0.145.0"` | ❗ 改成当前实际版本 |
| `tested_host_version` | `"codex-cli 0.145.0"` | ❗ 同上 |
| `session_identity` | 旧值 | ❗ 改成当前会话标识 |
| `observed_primitive` | `"collaboration.spawn_agent"` | 如果当前 Codex 版本仍暴露此 primitive 则不变 |
| `candidate_identity_sha256` | 旧值 | ❗ 重新计算 |
| `schema_excerpt` + `schema_excerpt_sha256` | 旧值 | ❗ 重新捕获 + 重新计算 |

**新增字段：** 与 Journey 1 完全相同（6 个必填字段 + state observation receipt）。

**State observation receipt**：新建 `docs/validation/worker-dispatch/2026-07-29-state-obs-codex-positive.json`，格式同上。

**独立性要求（R19）：** 两条 positive journey 的 `observed_primitive` 必须不同。Claude 用 `Agent`，Codex 用 `collaboration.spawn_agent`——如果当前版本中任一 primitive 改名，仍必须观察到两个不同 identity。

---

## Journey 3：Claude Code required-isolation degraded

**捕获环境：** Claude Code 会话，用户已授权 dispatch，但在**调用 worker 之前**确认 `context_isolation` 不满足 `required`，因此 worker 未被调用。

**可复用旧 journey 的字段：**

| 字段 | 旧值 | 新值 |
|---|---|---|
| `journey_kind` | `"degraded"` | 不变 |
| `invocation_performed` | `false` | 不变 |
| `call_status` | `"not_invoked"` | 不变 |
| `context_isolation_need` | `"required"` | 不变 |
| `observed_context_isolation` | `"unknown"` | 核实当前会话实际 observation |
| `reason_codes` | `["isolation_requirement_unmet"]` | 不变 |
| `mutation_observation` | `"not_applicable"` | 不变（non-invoked） |
| `pre_state_ref` | `null` | 不变 |
| `post_state_ref` | `null` | 不变 |
| `output_excerpt_ref` | `null` | 不变 |
| `observed_primitive` | `"Agent"` | ❗ 改成当前实际 primitive 名称（虽然未被调用，但 schema discovery 仍会产生 candidate identity） |
| `candidate_identity_sha256` | 旧值 | ❗ 重新计算 |

**新增字段：**

| 字段 | 值 | 说明 |
|---|---|---|
| `invocation_started_at` | `null` | non-invoked journey 必须为 `null` |
| `capability_probe` | `"attempted"` | 检查了当前会话 schema（虽然最终未调用） |
| `worker_dispatch_capability` | `"available"` | schema discovery 找到了 eligible candidate，但因 isolation 不满足而 fail closed |
| `state_observation_ref` | `null` | non-invoked journey 不需要 state observation |
| `state_observation_sha256` | `null` | 同上 |
| `reason_codes` | `["isolation_requirement_unmet"]` | 不变 |

**关键说明**：degraded journey 证明的是 "fail-closed 路径真实可达"——isolation 不满足时，orchestrator 在调用 worker 前就阻断，不是调用后失败。这是 R19 要求的 degraded coverage。

---

## 支持文件（3 条 journey 共用）

### `docs/validation/worker-dispatch/2026-07-29-semantic-request.md`

当前已存在，SHA-256 为 `7536d29f5223d5c8be59f53e6dfada23cf4fb730129bb99ff07d319b221c1bcc`。如果内容未变，3 条 journey 的 `semantic_request_sha256` 可沿用旧值。如果内容变化，需重新计算。

### Supporting capture 文件

每条 journey 需要一个独立的 supporting capture 文件（记录原始 session 输出、schema capture 详情、output 原文等）。旧 journey 已有对应 capture 文件：
- `2026-07-29-claude-code-2.1.220-positive-capture.json`
- `2026-07-29-codex-cli-0.145.0-positive-capture.json`
- `2026-07-29-claude-code-2.1.220-required-isolation-degraded-capture.json`

重新捕获时需要：
1. 重新生成这 3 个 capture 文件（日期改为实际捕获日期）
2. 每条 journey 的 `supporting_capture_ref` 指向新文件
3. 每条 journey 的 `supporting_capture_sha256` 重新计算

---

## 验证步骤

捕获完成后运行：

```bash
node -e "
const m = require('./src/contracts/worker-dispatch-host-journey-validator.js');
const fs = require('fs');
const dir = 'docs/validation/worker-dispatch';
const arts = [
  '<claude-positive-filename>.json',
  '<codex-positive-filename>.json',
  '<claude-degraded-filename>.json'
].map(f => JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8')));
const v = m.validateWorkerDispatchHostJourneySet(arts, { repoRoot: process.cwd() });
console.log('ok:', v.ok, 'errors:', v.errors.length);
if (v.errors.length > 0) {
  // Group by category
  const cats = {};
  v.errors.forEach(e => {
    let cat = 'other';
    if (e.includes('missing required key')) cat = 'missing_root_key';
    else if (e.includes('spec_first_revision')) cat = 'spec_first_revision';
    else if (e.includes('state_observation')) cat = 'state_observation';
    else if (e.includes('supporting capture')) cat = 'supporting_capture';
    cats[cat] = (cats[cat] || 0) + 1;
  });
  Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(k + ':', v));
}
"
```

**预期结果**：
- `ok: true` → claim 关闭 → 更新 07-28 plan DoD 行 736 为 `[x]` → 更新 CHANGELOG
- `ok: false` 或 `ok: undefined` → 按 error category 回到对应 journey 修正字段

---

## 当前限制

- 本 checklist 写于 2026-07-29，当时 dispatch 授权不可用。在用户显式授权 dispatch 之前，checklist 中的所有"捕获"步骤无法执行。
- `spec_first_revision` 值取决于捕获时的 `git rev-parse HEAD`。捕获前必须先 commit 所有未提交修改。
- 旧 dated journeys（`2026-07-29-*`）在 schema 收紧前是有效的——它们证明了 capture method 可行、两个不同 native primitive 存在、degraded path 可达。新 journeys 只是补充 schema 收紧后的必填字段，不是否定旧 evidence。
