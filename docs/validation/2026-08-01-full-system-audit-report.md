---
artifact_type: full-system-audit-report
artifact_version: 1
created_at: 2026-08-01
updated_at: 2026-08-01
run_id: 20260801T174341p0800-b72a6234
source_head: b72a6234ba37ec7f3177cbf7ab7438f91b129070
audit_status: completed-with-findings
claim_ceiling: partial-C1
evidence_status: mixed-confirmed-and-degraded
remediation_report: docs/validation/2026-08-01-full-system-audit-remediation.md
supersedes:
  - docs/validation/2026-08-01-phase-0-health-check.md
  - docs/validation/2026-08-01-l0-infrastructure-audit.md
  - docs/validation/2026-08-01-l1-deterministic-floor-audit.md
  - docs/validation/2026-08-01-system-audit-executive-summary.md
---

# spec-first 全链路系统审计报告

> [!NOTE]
> 本文件记录审计 run `20260801T174341p0800-b72a6234` 的 point-in-time finding。当前整改状态、恢复后的 baseline 证据与仍需补证的 F-005，见 [`2026-08-01-full-system-audit-remediation.md`](./2026-08-01-full-system-audit-remediation.md)。

## 1. Executive verdict

**审计已按方案完成到当前授权允许的证据上限；系统级结论为 `partial C1`，不能判定为 mechanism qualified。**

当前 source 能打包安装，六宿主 generated runtime projection 的隔离 lifecycle、ownership、drift/re-init 与 clean contracts 通过；五类退出 gate 都有 owner、consumer 和负向机制，没有未披露的 `missing`。但全量 deterministic baseline 存在 4 个 confirmed unit failure，因此不能声称仓库基线 green，也不能把局部 C1 绿灯提升为“系统机制整体合格”。

| 结论 | 状态 | 依据与限制 |
| --- | --- | --- |
| Audit execution | `completed-with-findings` | 方案中的 L0–L3 项均有 `passed/failed/degraded/not-run` 处置；没有空白项。 |
| System claim ceiling | `partial C1` | 包安装、六宿主投射与 controlled fixtures 支持局部 C1；全量 baseline 有 4 个失败。 |
| Mechanism qualified | `no` | `npm test` 未通过；Runtime Setup 与 CE inventory 存在 confirmed contract failure。 |
| Field journey qualified | `no / not-run` | 未提供真实未解决任务、disposable worktree/path mutation 授权或真实宿主 journey 授权。 |
| Incremental value qualified | `no / not-run` | 未预注册 comparator；本轮没有 C4 证据。 |
| P0 | `0` | 未确认会造成未授权/不可恢复 mutation、凭证泄露或虚假 ship claim 的 blocker。 |
| Open findings | `7` | P1 × 1（证据 degraded）、P2 × 6。 |

最重要的准确表述是：

> spec-first 已建立跨六宿主的确定性投射地板，并为五类退出建立了有界机制；但公共 workflow 出口除 managed source/runtime 外仍主要是 loud convention + hard helper 的混合形态，当前全量测试基线不绿，真实宿主加载、真实任务交付与增量价值均未验证。

## 2. 方案审查结论

权威方案为 [`2026-08-01-full-system-audit-plan.md`](./2026-08-01-full-system-audit-plan.md)。方案意图与角色契约一致：它不是逐文件找问题，而是验证 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 是否形成可治理、可验证、可复用的证据闭环。

本轮执行前复核认为方案可直接执行，无需修改正文：

- Goals 与 non-goals 清楚，审计产物写入和 source/runtime 修复被明确分离。
- C0–C4 claim ladder 阻止用 fixture、模型自评或 projection test 外推真实宿主与产品价值。
- projection、loader discovery、workflow execution、field outcome 四层被分别取证。
- scripts 只负责确定性事实，LLM 负责语义充分性、root cause 与优先级判断。
- 禁止真实 global install、真实 source drift 注入、generated runtime 手改和无授权外部 journey，避免审计污染被审对象。
- 成功标准允许因缺授权而把 C2–C4 记为 `not-run`，但不允许用 `degraded-by-design` 掩盖证据缺口。

方案的固有限制不是设计缺陷，而是执行输入缺失：J1–J3、真实宿主 loader journey 和 C4 comparator 必须由 owner 另行提供真实任务、隔离范围、预算及外部授权。当前审计不能代替这些输入。

## 3. Run、source 与授权 manifest

完整 manifest：`.spec-first/audits/full-system/20260801T174341p0800-b72a6234/run-manifest.md`。

| 字段 | 冻结值 |
| --- | --- |
| Run ID | `20260801T174341p0800-b72a6234` |
| Branch | `leo-2026-07-30-skill-update` |
| HEAD | `b72a6234ba37ec7f3177cbf7ab7438f91b129070` |
| Initial working-tree fingerprint | `sha256:8ae88c80c2e293ff459be96a97dee3caf1e39af6834c315cfe5ee27e838a63e7` |
| Initial tree | dirty；14 个 untracked files |
| Package | `spec-first@1.13.2` |
| Runtime | Node `v22.22.3`，npm `11.16.0`，Darwin `25.5.0 arm64` |
| Supported platform IDs | `claude,codex,cursor,kiro,qoder,opencode` |
| Execution | inline / serial |
| Worker dispatch | `missing`；未探测 capability |
| Commit / landing | `missing` / `missing` |

本轮只授权：run-scoped audit evidence、本报告、以及已有 Changelog audit entry 的精确更新。未授权并且未执行：source finding 修复、`spec-first init`、`clean`、真实 global npm mutation、真实 developer profile write、worker/persona dispatch、commit、push 或 PR。

初始 tree 已包含大量 user-owned dirty work。结论绑定 HEAD、初始 fingerprint 与 manifest 中记录的 audit-artifact-only 后续写入，不能只用 HEAD 复现。`/opt/homebrew` 的早期 global local-path install 与 `/tmp/test-init-project-20260801` 残留保持未清理；清理它们需要独立 destructive/runtime 授权。

## 4. L0–L3 coverage

| 层级 / phase | 状态 | 实际证据 | Claim ceiling / limitation |
| --- | --- | --- | --- |
| Phase 0 baseline | `failed` | typecheck 208 files PASS；Skill entrypoint lint 315 files PASS；build 在环境重试后 PASS；`npm test` 为 165 suites / 1902 tests passed、4 suites / 4 tests failed。 | 全量 baseline 不绿；unit 失败后主链路的 smoke/integration 未运行。 |
| L0：安装与六宿主投射 | `passed` | local package install matrix PASS；六宿主 lifecycle/ownership 4/4 suites、81/81 tests PASS。 | C1；不证明真实宿主 loader 或 workflow invocation。 |
| L1：deterministic floor | `partial` | 指定 gate 7/7 suites、105/105 tests PASS；mutation/closeout 2/2 suites、6/6 tests PASS；143 scripts inventory，30 个高风险样本语义审查。 | 五类 gate 有 owner，但 Runtime Setup/CE baseline 有 confirmed failures；script 语义结论只覆盖 30/143 抽样。 |
| L2：核心 workflow 语义 | `partial` | 8 个核心 workflow contract suites 为 8/8、115/115 tests PASS；逐 workflow current-source review 完成。 | independent fresh-source eval 因 dispatch 未授权而 not-run；`spec-plan` 保留 degraded P1 证据。 |
| L3：controlled journeys | `passed` | D1–D4 fixture journeys PASS；D5 incomplete `spec-handoff` payload 被拒绝。 | C1；D5 只证明 owned writer surface，不证明 universal handoff consumer gate。 |
| L3：field journeys J1–J3 | `not-run` | 无真实任务 receipt。 | `real_task_input_missing`、`disposable_worktree_authorization_missing`。 |
| C2 live host journey | `not-run` | 本轮无 version-frozen loader/workflow receipt。 | `external_host_journey_authorization_missing`。 |
| C4 comparator | `not-run` | 未预注册 baseline/comparator/metric。 | `comparator_not_preregistered`。 |

Phase 0 的直接证据位于 `.spec-first/audits/full-system/20260801T174341p0800-b72a6234/logs/phase-0-baseline.md`；其余阶段 receipt 位于同一 `logs/` 目录。

## 5. Baseline 与 controlled mechanism 结果

### 5.1 Baseline

| 命令 | 结果 | 关键事实 |
| --- | --- | --- |
| `npm run typecheck` | PASS | 208 files。 |
| `npm run lint:skill-entrypoints` | PASS | 315 files。 |
| `npm test` | FAIL | 169 suites / 1906 tests attempted；165 suites / 1902 tests passed；4 suites / 4 tests failed。 |
| `npm run build` | PASS after environment retry | 743 files；package 2.0 MB；unpacked 7.2 MB；shasum `fcd26dcaa54e5506140e049e4709269961cb0c30`。 |

四个 confirmed failure 是：

1. Runtime Setup `setup.cjs` 为 916 行，违反 `<900` 行入口 contract。
2. CE current skill inventory 与冻结 source 不一致。
3. Async refresh 对 live PID + process-start identity mismatch 错误报告 `in-flight`，没有返回 `workspace-async-refresh-abandoned`。
4. Lifecycle lease 没有回收 live PID + process-start identity mismatch 的 stale lease。

### 5.2 Controlled journeys

| ID | 状态 | 证明范围 | 明确不能证明 |
| --- | --- | --- | --- |
| D1 source/runtime drift | `passed` | 临时 managed projection 能检测 drift、re-init，且保留 user-owned 内容。 | 真实项目 runtime 或 loader。 |
| D2 verification failure | `passed` | 非零结果可被 summary 保存；无 confirmed evidence 的 passed artifact 被拒绝。 | 宿主会强制所有 workflow 使用 recorder。 |
| D3 missing Provider | `passed` | unknown provider/missing host 零写入 fail closed；missing dependency 从事实重算。 | 真实 Provider 安装与 field query。 |
| D4 stale advisory graph | `passed` | no-result/unknown/limitations 保留；source change 使 ready 降为 stale。 | 图谱内容的业务或架构正确性。 |
| D5 incomplete handoff | `partial pass` | `spec-handoff` writer 拒绝缺 freshness/limitations 的 payload。 | 所有 `artifact-summary.v1` consumer 都有硬 gate 或必定返回 `summary_missing`。 |

## 6. 五类退出 gate

Effective level 评价公共 workflow 出口，而不是其中最强的 helper。

| Gate | Effective level | 确定性地板 | LLM / human ownership | 主要限制 |
| --- | --- | --- | --- | --- |
| Mutation | `loud-convention` | Runtime Setup host/path/ownership fail closed；handoff path safety；work/review fingerprint。 | settled scope、实际 diff ownership、风险与授权解释。 | 多数宿主不能机械阻止任意 edit tool call。 |
| Verification | `loud-convention` | passed 必须绑定 `ran=true`、exit 0、contained log；producer 拒绝 dangling/mismatched evidence。 | 实际结果是否被诚实转录、checks 对 claim 是否充分。 | Recorder 弱于 process supervision；workflow 可跳过 helper。 |
| Source/runtime | managed CLI surface `hard-enforced` | 六宿主 drift/re-init、exact ownership、collision preservation 与 clean contract。 | source 行为是否正确、非 owned host surface 是否应修改。 | 不能阻止人工手改 mirror，也不覆盖 loader discovery。 |
| Handoff/context reset | `loud-convention` | `spec-handoff` 强制 source refs、freshness、limitations、containment 与 immutable create。 | summary 真实性、相关性、freshness 和 full-read trigger。 | 没有 universal consumer fixture。 |
| Knowledge promotion | `loud-convention` + hard structural floor | promotion validator 强制 `source_refs` 与 `invalidation_condition` 形态。 | solved/verified/reusable 与失效条件的语义充分性。 | 机器字段不能证明问题已解决；workflow 外写入不可拦截。 |

结论：没有未披露的 `missing`，但只有 managed source/runtime surface 可称 hard-enforced。其余四类是 loud convention 与局部 hard helper 的混合机制，不能写成“五类 gate 全部 hard-enforced”。详细矩阵见 `.spec-first/audits/full-system/20260801T174341p0800-b72a6234/logs/five-gate-matrix.md`。

## 7. 六宿主 evidence matrix

| Host | Projection / package | Loader discovery | Workflow invocation | Current-run ceiling |
| --- | --- | --- | --- | --- |
| Claude Code | C1 `passed`（隔离六宿主 lifecycle） | `not-run` | `not-run` | C1 projection only |
| Codex | C1 `passed`（隔离六宿主 lifecycle） | `not-run` | `not-run` | C1 projection only |
| Cursor | C1 `passed`；catalog 为 `generated_runtime_preview` | `degraded/not-run` | `not-run` | C1；loader discovery/invocation unverified |
| Kiro | C1 `passed`（隔离六宿主 lifecycle） | `degraded/not-run` | `not-run` | C1；需要 exact-version native journey |
| Qoder | C1 `passed`（隔离六宿主 lifecycle） | `degraded/not-run` | `not-run` | C1；SessionStart/PreToolUse/Stop activation 未复验 |
| OpenCode | C1 `passed`；catalog 为 `generated_runtime_preview` | `degraded/not-run` | `not-run` | C1；`tested_versions=[]`，loader 未验证 |

本轮在 `codex-cli 0.146.0` 会话中观察到项目 SessionStart governance injection，并能直接读取 project-installed source Skill；这只是 session-local observation。因为没有冻结 init/apply、loader discovery、invocation input/output 和 limitations 的完整 journey receipt，不能据此提升 Codex 到 C2。

Projection test 的共同通过只证明 source-owned generator 和隔离 lifecycle；不能用“六宿主投射均通过”外推六个宿主实际会发现、选择并执行相同 workflow。

## 8. 核心 workflow 语义审查

| Workflow | 结论 | 关键边界 / concern |
| --- | --- | --- |
| `using-spec-first` | `passed` | 只路由，不授予 mutation/verification/runtime/handoff/promotion/landing；自身无 host blocking primitive。 |
| `spec-prd` | `passed` | Product Contract 与 planning readiness owner 清楚；Claude hard hook 与其他宿主 loud degraded 被明确区分。 |
| `spec-plan` | `concerns` | Source contract 清晰，但最新完整 current-source 历史 eval 为 1 PASS / 2 FAIL；本轮未 fresh reproduce。 |
| `spec-work` | contract `passed` | source/runtime、dirty overlap、dispatch/commit/landing 分权清楚；当前 repo baseline 不绿。 |
| `spec-code-review` | contract `passed` | 默认 report-only；finding judgment 与 mechanical validation 分离；本轮未运行 independent validators。 |
| `spec-handoff` | owned surface `passed` | writer 硬结构与 immutable receipt 通过；不能外推 universal consumer enforcement。 |
| `spec-compound` | `passed` | promotion 结构地板明确；solved/verified/reusable 仍由 LLM/human 判断。 |
| `spec-runtime-setup` | `concerns` | ownership/readiness 边界清楚，但存在 F-001、F-003、F-004 三个 confirmed failure。 |

Independent fresh-source eval 的本轮状态为：

```yaml
status: not_run
reason: dispatch_authorization_missing
capability_probe: not_applicable
worker_dispatch_capability: unknown
```

Inline source review 与 8/8 suites、115/115 contract tests 是有效 current-source 证据，但不冒充独立 reviewer/persona coverage。详细结果见 `.spec-first/audits/full-system/20260801T174341p0800-b72a6234/logs/core-workflow-semantic-review.md`。

## 9. Script inventory 与 semantic ownership

- Inventory：143 个 scripts。
- 高风险语义样本：30 个，覆盖 mutation/process/schema、verification/handoff/promotion、Runtime Setup、review mechanics、worktree 与 packaging。
- 样本结论：未确认 script 把产品价值、架构充分性、语义范围或 reviewer finding 自行提升为 confirmed truth。
- `analyze-task-pack-quality.js`、rule-pack selection 与 review finding mechanics 中的 heuristic 均保留 advisory/consumer 边界。
- 确认的机械缺陷是 F-001：`setup.cjs` 超过入口行数 contract。

其余 113 个 scripts 只进入 deterministic inventory 和风险排序，没有逐行语义复核。因此结论是“高风险样本未发现语义越权”，不是“全部 scripts 已证明语义充分”。Inventory 与抽样记录分别位于 `logs/script-inventory.md` 和 `logs/script-semantic-review.md`。

## 10. Findings

### F-001 — Runtime Setup entrypoint 违反行数 contract

```yaml
severity: P2
claim_scope: spec-runtime-setup maintainability contract / Phase 0 baseline
evidence_status: confirmed
owner: skills/spec-runtime-setup/scripts/setup.cjs
```

- Consequence：聚焦 unit contract 与全量 `npm test` 失败；入口继续承载过多 wiring 会增加 review、冲突和回归定位成本。当前证据不证明 runtime 语义已经错误。
- Direct evidence：`tests/unit/mcp-setup-node-contracts.test.js`；`skills/spec-runtime-setup/scripts/setup.cjs`（916 行）；`logs/phase-0-baseline.md`。
- Root cause（LLM judgment）：Runtime Setup 入口在近期 workspace graph/lifecycle 能力增长中继续累积 wiring，没有同步把一个已有边界内的机械 owner 下沉到 `scripts/lib/`，导致违反既定 maintainability budget。
- 最小 source-first fix：从 `setup.cjs` 提取一个单一、可命名、已有 consumer 的 mechanical orchestration concern 到现有 `scripts/lib/`；不改公开 CLI、schema 或 generated runtime。
- Validation：先运行 `npm run test:jest -- --runTestsByPath tests/unit/mcp-setup-node-contracts.test.js --runInBand`，再运行受影响 Runtime Setup suites，最后 `npm test`。
- Re-evaluate when：入口重新低于 900 行且聚焦与全量 checks 在修复后 source snapshot 上通过。

### F-002 — CE current inventory 已漂移

```yaml
severity: P2
claim_scope: CE 3.20 reconciliation baseline
evidence_status: confirmed
owner: docs/validation/2026-07-30-current-skill-package-inventory.json
```

- Consequence：CE reconciliation 无法建立可信 current baseline，相关 package/file/hash 对齐结论不能关闭。
- Direct evidence：`tests/unit/ce-upstream-3-20-reconciliation.test.js`；`logs/historical-evidence-freshness.md`；当前重算为 35 skills、559 files、manifest `284e94f0c3995077864f25a2d5f65ab26bb90984b3879c9967b1339b93e1c09d`，而 checked-in inventory 为 558 files、manifest `d54f980cafbb3b75ea0d67772aaf0478cd8ec22b3bda9cb71aa1fb6f3e93d04f`。
- Root cause（LLM judgment）：Runtime Setup 新增 `regular-file-snapshot.cjs` 且 15 个文件继续变化后，source change 与 checked-in reconciliation evidence 没有在同一 closeout transaction 中刷新。
- 最小 source-first fix：冻结准确 CE repo/path 后，通过 canonical reconciliation refresh 更新 inventory 与直接关联报告；不要手工改 hash 或只改计数。
- Validation：运行 read-only reconciliation、`tests/unit/ce-upstream-3-20-reconciliation.test.js`，再确认 559/559 path 与 hash 一致。
- Re-evaluate when：source/CE identity 再变化，或 canonical inventory refresh 生成新的 manifest。

### F-003 — Async refresh 错误保留 identity-mismatched live PID

```yaml
severity: P2
claim_scope: workspace graph async refresh status / stale-owner recovery
evidence_status: confirmed
owner: skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs
```

- Consequence：PID 已被复用或 owner identity 已变化时，状态仍可能显示 `in-flight`，使 refresh 长期不恢复并误导 readiness consumer。
- Direct evidence：`tests/unit/mcp-setup-workspace-async-refresh.test.js`；`skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs`；`logs/phase-0-baseline.md`。失败期望为 `failed` + `workspace-async-refresh-abandoned`。
- Root cause（LLM judgment）：process liveness 与 process-start identity 的 stale 语义分散在 lock snapshot、status read 和 cleanup path，当前受测路径没有一致地把 `mismatched` 转换为 abandoned。
- 最小 source-first fix：收敛为一个 identity-aware stale predicate，并让 status、cleanup 和 recovery 共用；保留 identity unknown 的 fail-closed 语义，避免误抢真实 writer。
- Validation：先运行该 suite 的 live PID + mismatched identity case，再运行 async refresh、graph executor 与 lifecycle 聚焦 suites，最后 `npm test`。
- Re-evaluate when：process marker schema、跨平台 marker 获取或 stale timeout contract 变化。

### F-004 — Lifecycle lease 未回收 identity-mismatched stale owner

```yaml
severity: P2
claim_scope: workspace graph lifecycle single-writer lease recovery
evidence_status: confirmed
owner: skills/spec-runtime-setup/scripts/lib/workspace-graph-lifecycle-lease.cjs
```

- Consequence：PID 复用后 stale owner 可能持续阻断 setup/refresh/clean single-writer lane，返回 busy 而非安全回收。
- Direct evidence：`tests/unit/mcp-setup-workspace-lifecycle-lease.test.js`；`skills/spec-runtime-setup/scripts/lib/workspace-graph-lifecycle-lease.cjs`；`logs/phase-0-baseline.md`。实际为 `ok: false, acquired: false`，contract 期望回收成功。
- Root cause（LLM judgment）：lease acquisition 的 identity mismatch 判定与 quarantine/reclaim transaction 没有在当前 fixture 下形成一致终态，导致 mismatch 被当成 contention 留存。
- 最小 source-first fix：让 snapshot stale classification、quarantine CAS 和 acquisition retry 共享同一 owner fingerprint；保持 no-clobber、snapshot match 与恢复失败 fail closed。
- Validation：运行 lifecycle lease suite，再运行 async refresh、graph clean/executor/status consumer suites，最后 `npm test`。
- Re-evaluate when：lease schema、publication primitive、process identity marker 或跨平台 filesystem 语义变化。

### F-005 — `spec-plan` planning-only 与 Product authority assurance 降级

```yaml
severity: P1
claim_scope: spec-plan planning-only mutation boundary and Product Contract authority
evidence_status: degraded
owner: skills/spec-plan/SKILL.md + applicable host write-gate owner
```

- Consequence：若历史失败仍可复现，planning-only 请求可能越权改实现；无 Product Owner 权限的 blocker 可能被模型自行裁决并改写 Product Contract，破坏 WHAT/HOW ownership。
- Direct evidence：`docs/validation/2026-07-31-spec-plan-skill-up-eval.md`；`logs/historical-evidence-freshness.md`。最新完整 current-source 历史结果是 1 PASS / 2 FAIL；原生 artifacts 已删除，本轮未重新 dispatch。
- Root cause（LLM judgment）：当前 safety 主要是 prompt/attention hardening；没有适用于所有宿主的真实 write blocking primitive。纯语义约定无法提供与 mutation claim 相同强度的 assurance。
- 最小 source-first fix：第一步不是直接改 prompt，而是以当前 source 重跑三个 deterministic fixtures。若 2 个失败被 confirmed，再采用 host 能提供的最小 mutation gate 或 pre/post tree detection fail-closed；不要让脚本替代 Product/architecture 语义判断。
- Validation：fresh-source 三用例必须 3/3 PASS，且 planning-only 无 implementation/source mutation、product blocker 不改 Product Contract、不提升 readiness；记录 source hash、host/model、隔离和完整 artifact。
- Re-evaluate when：Skill source、host write primitive、模型版本或 fixture acceptance 变化。

### F-006 — 同日早期阶段报告含 unsupported/stale completion claims

```yaml
severity: P2
claim_scope: audit evidence consumption and completion status
evidence_status: confirmed
owner: docs/validation audit-report governance
```

- Consequence：直接读取早期报告的 consumer 可能把 dirty tree 当 clean、把后台未完成测试当 completed、把部分宿主投射当全系统结论，并忽略审计方案禁止的真实环境副作用。
- Direct evidence：本报告 frontmatter 的 `supersedes`；`logs/historical-evidence-freshness.md`；四份被 supersede 的 2026-08-01 报告。
- Root cause（LLM judgment）：早期执行没有先冻结一个 run-scoped manifest 和 claim ladder，阶段性自然语言进度被提升为 canonical completion，且没有等待真实命令终态。
- 最小 source-first fix：本报告已建立 canonical supersession；后续如需进一步降低误读风险，应在独立 docs patch 中给四份旧报告增加短 `superseded_by` banner，不删除历史原文。
- Validation：仓库索引、Changelog 和后续 handoff 只链接本报告为 current conclusion；旧报告不得继续支撑 completion claim。
- Re-evaluate when：旧报告被删除、显式标记 superseded，或仍有新 consumer 把它们作为 current source。

### F-007 — External evidence ledger closure path/source identity 已过时

```yaml
severity: P2
claim_scope: E01-E18 external evidence closure
evidence_status: confirmed
owner: docs/validation/2026-07-30-external-evidence-closure-ledger.md
```

- Consequence：E01 的旧 owner/path 已不存在；其余记录若直接沿用旧 source head，可能用过期 closure receipt 提升当前宿主或 workflow claim。
- Direct evidence：`logs/historical-evidence-freshness.md`；E01 的 `skills/spec-proof/**` 已删除；ledger head `d213fe477601fd5338b32f55e2c11189608174a3` 与本轮 source identity 不同。
- Root cause（LLM judgment）：ledger 的 conservative status 能跨 source 演化保留，但 closure path 和 source identity 没有随着 owner retirement/adapter evolution 一起刷新。
- 最小 source-first fix：将 E01 标为 stale reference 并解析 successor owner；E02–E18 分项冻结 current source 后执行原 re-evaluate condition，不批量提升状态。
- Validation：运行 `tests/unit/external-evidence-closure-ledger.test.js`，逐项校验 path 存在、current source receipt、exact host/version 与 limitation。
- Re-evaluate when：任一 owner/path/source head、宿主版本或 field receipt 更新。

## 11. Historical evidence freshness

| Evidence | 当前处置 | 复验条件 |
| --- | --- | --- |
| E01 | `stale-reference` | 找到 `spec-proof` 退役后的 current successor owner/path。 |
| E02–E03 | 保持 `blocked-external-authorization`，source baseline stale | 在 current source 上重新冻结真实 PR/CI 或 A/A→A/B experiment receipt。 |
| E04–E18 | 保持 `degraded-by-design` | 按 exact host/version/event/source 分项执行原 closure journey；不得批量提升。 |
| `spec-plan` eval | 1 PASS / 2 FAIL，`degraded evidence` | 获得 dispatch 授权后 current-source 3/3 fresh run。 |
| CE current inventory | `failed/stale` | canonical refresh 后 559/559 files 与新 manifest 一致。 |
| Runtime capability catalog | current bytes unchanged；claims 保守 | Cursor/OpenCode versioned loader journey 通过后再提升。 |

E01–E18 的逐项 current disposition 在 `.spec-first/audits/full-system/20260801T174341p0800-b72a6234/logs/historical-evidence-freshness.md` 中。17 个条目保留保守 ceiling 不等于 evidence fresh；closure 前仍必须生成 current-source receipt。

## 12. 被本报告 supersede 的同日文件

以下文件保留为历史/advisory 输入，但不再是当前结论源：

| 文件 | 当前地位 | 主要失真 |
| --- | --- | --- |
| [`2026-08-01-phase-0-health-check.md`](./2026-08-01-phase-0-health-check.md) | `advisory / superseded` | 把 dirty tree 表述为 clean/staged；unit 仍运行时标 phase complete。 |
| [`2026-08-01-l0-infrastructure-audit.md`](./2026-08-01-l0-infrastructure-audit.md) | `advisory / superseded` | 执行真实 global local-path install、写真实 developer profile、修改 source 注入 drift，且 live project host 覆盖不完整。 |
| [`2026-08-01-l1-deterministic-floor-audit.md`](./2026-08-01-l1-deterministic-floor-audit.md) | `advisory / superseded` | 从小样本外推全局、沿用 stale test counts，缺 run-scoped confirmed evidence。 |
| [`2026-08-01-system-audit-executive-summary.md`](./2026-08-01-system-audit-executive-summary.md) | `advisory / superseded` | 将 Phase 0–2 写成 completed；E01–E18 只列 10 条却称完全对齐；无 comparator 却声称 incremental value。 |

保留这些文件是为了审计可追溯性，不代表保留其 completion claim。本报告和 run manifest 是 2026-08-01 审计的 current conclusion surface。

## 13. Field journey 与 comparator

J1–J3 均为 `not-run`，不是 failed：

- 没有真实、尚未解决且 acceptance 已冻结的任务。
- 没有 disposable worktree/branch 和 path-scoped mutation 授权。
- 没有真实宿主/外部系统 journey 的凭证、数据外发与副作用授权。
- 没有预注册 comparator、同口径指标与 task-difficulty calibration。

因此本轮不能声称 C2 loader/workflow verified、C3 真实任务交付 qualified 或 C4 增量价值 confirmed。早期一次成功或局部 mechanism fixture 不能替代 comparator。

## 14. Residual risks 与 limitations

1. 当前结论绑定 dirty snapshot；只用 HEAD 无法重现结果。
2. `npm test` 在 unit 阶段失败，主链路 smoke/integration 没有进入；Phase 1 定向 smoke/integration 只能支撑其限定范围。
3. Build 第一次因环境 npm cache `EPERM` 失败，环境重试后才通过；该事实不能隐藏。
4. 143 scripts 中只有 30 个做逐行语义审查；未抽样者仍需由其 owner tests 和后续风险触发复核。
5. 没有 independent fresh-source reviewer，本轮所有语义 finding 均明确标为 LLM judgment 或 degraded history。
6. Controlled Provider/graph/handoff fixtures 只支撑 C1；Provider output 始终是 `provider_untrusted` advisory navigation。
7. 现存 global install 与 `/tmp` 残留可能影响后续本机 journey；在未获 cleanup 授权前不能把环境称为 pristine。
8. Current Codex 会话观察不是可移植的 C2 receipt；其他宿主没有 live evidence。

## 15. Repair handoff

审计与修复继续分离。建议按以下顺序进入新的 source snapshot：

1. **先恢复 deterministic baseline：** 由 `spec-runtime-setup` owner 在一个 validated plan / `spec-work` run 中合并处理 F-001、F-003、F-004；由 CE reconciliation owner 单独处理 F-002。每个 finding 先跑最窄失败测试，再扩到 Runtime Setup batch 与 `npm test`。
2. **补 `spec-plan` assurance：** 先获得 worker/eval dispatch 授权，重跑 3 个 current-source fixtures。只有失败被本轮 fresh evidence confirmed 后，才设计最小 host gate/detection 修复。
3. **刷新 evidence governance：** 处理 F-007，并在需要时为四份旧报告增加 `superseded_by` banner；不要删除历史 evidence，也不要批量提升 ledger status。
4. **建立 C2：** 每次只选择一个 exact host/version，冻结 init/apply、loader discovery、workflow invocation、pre/post state 与 limitations；一个 host receipt 不提升其他 host。
5. **建立 C3/C4：** owner 提供真实 J1 bugfix、隔离 mutation scope 和 stable reproducer；C4 另需在执行前预注册 comparator 与指标。

推荐的下一个公开入口是：

```text
spec-plan <Runtime Setup baseline 修复计划或现有 validated plan>
```

若已经存在覆盖 F-001/F-003/F-004 且 source identity 仍匹配的 implementation-ready plan，则可直接进入：

```text
spec-work <validated-plan-path>
```

修复时必须修改 `skills/`、tests、docs/CHANGELOG 等 canonical source；generated runtime 只在另行授权后由 `spec-first init` 重建。任何修复后 green evidence 都必须来自修复后的 source snapshot，不能复用本报告中的 pre-fix 日志。

## 16. 审计完成条件核对

- [x] Run manifest、source snapshot、授权、命令结果、evidence paths 与 limitations 可回源。
- [x] L0–L3 所有计划项都有明确 status；field/comparator 缺口标为 not-run 并给 reason。
- [x] 五类 gate 都有 owner、consumer、effective level、负向机制与 limitation。
- [x] 六宿主 projection、loader 与 workflow claim 分开。
- [x] E01–E18、`spec-plan`、CE inventory 与 runtime catalog 已做 freshness 复核。
- [x] 所有 P0/P1 有 owner、next action 与 re-evaluate condition；P0 为 0。
- [x] 审计过程中未夹带 source finding 修复、generated runtime edit、commit 或 landing。

审计完成不等于系统机制合格，更不等于 field outcome 或增量价值已证实。本报告的最终 working-tree fingerprint 与 closeout status 记录在 run manifest；后续任何 source 或 evidence 变化都应新建 run/source identity，而不是覆盖本轮结论。
