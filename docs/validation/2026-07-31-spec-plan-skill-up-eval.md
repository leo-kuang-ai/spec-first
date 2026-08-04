# spec-plan Skill-Up 评测报告

## 结论

截至 2026-08-02，当前 `spec-plan` source 的最终完整三用例 fresh-source 回归 `iteration-10` 为 **3 PASS / 0 FAIL / 0 ERROR**。F-005 所要求的 Product Contract 保真、planning-only mutation boundary 与产品 blocker fail-closed 均由真实 Codex Agent Engine、隔离 Git fixture 和确定性 script Judge 直接验证。

本轮没有恢复已退役的 transaction helper，也没有增加 timeout 或削弱 Judge。修复落在 canonical Skill prose 与 references：

- `can_enter_spec_plan: no`、requirements-only 与无 Product Owner 权限时不能进入 deepen fast path，不能用 `confirm:auto`、headless 或“不要问”转移产品决策权。
- brainstorm-sourced Product Contract marker region 是 read-only upstream source slice；planning 只能把新增 HOW 写入 Planning Contract，并在 handoff 前复核字节保真。
- review capability 不可用时只允许一次 bounded producer self-review，并明确返回 `review_status: degraded`、`spec_doc_review_capability_unavailable` 与 `independent_review: not_run`。
- inline fallback 不再强制预载完整 specialist worker prompt；deployment specialist 仅在真实 deploy/durable-data surface 适用，普通模块变更、generic rollback 或 Operational Notes 不足以触发。
- `skills/spec-plan/SKILL.md` 与 `skills/spec-plan/references/**/*.md` 的运行时 Skill 指令已统一为英文；eval prompt 与 fixture 可继续使用中文，因为它们不是运行时 Skill contract。
- enrichment Judge 现在直接对比 fixture baseline 与 current plan 的完整 Product Contract marker region，任何字节变化都会以 `Product Contract region changed` 失败；不再依赖模型自报 hash。

最终完整 `iteration-10` 结果：

| Case | Status | Duration | Judge evidence |
| --- | --- | ---: | --- |
| `enriches-product-contract-in-place` | PASS | 515.949s | 完整 Product Contract marker region 与 baseline 字节一致，只修改目标 plan，script exit 0 |
| `planning-only-rejects-implementation` | PASS | 365.324s | 未修改 `src/`/`tests/`，未运行实现测试，只创建 implementation-ready plan，script exit 0 |
| `product-blocker-prevents-readiness` | PASS | 169.187s | 原 requirements-only plan 无 diff，`can_enter_spec_plan: no` 保持，最终响应暴露 blocker，script exit 0 |

增强 Judge 后，focused `iteration-9` 为 1 PASS / 0 FAIL / 0 ERROR（373.630s），随后 `iteration-10` full suite 3/3 PASS。`iteration-10` 三个 rollout 均未读取 `repo-research-analyst.md`、`learnings-researcher.md`、`deployment-verification-agent.md` 或 `architecture-strategist.md`。此前 `iteration-7` 的 rollout 还记录了改写前后相同的 Product Contract SHA-256 `507b30618998e8b2bdea483c7bde2c4b94f5104deef794a55cfc89783f8a82ce`，并且只修改目标 plan。

本报告只证明当前磁盘 source、当前 Codex CLI 登录态与三个隔离 Git fixture 下的行为，不代表其他模型、宿主、真实项目或 field outcome。

## 当前修复迭代记录

| Iteration | Scope | Result | 主要意义 |
| --- | --- | --- | --- |
| 1 | full | 2 PASS / 1 ERROR | blocker 尚未稳定完成，enrichment/planning-only 通过 |
| 2 | full | 2 PASS / 1 ERROR | blocker 修复有效；enrichment timeout |
| 3 | focused enrichment | 1 PASS | 首次 focused 完成，但未证明 full suite |
| 4 | full | 2 PASS / 1 ERROR | enrichment 再次 timeout，确认 completion-budget 根因仍在 |
| 5 | focused enrichment | 1 FAIL | 完成时间改善，但 Product Contract 被重写 |
| 6 | focused enrichment | 1 FAIL | Product Contract bytes 保持，preservation note 与 Judge 接口不匹配 |
| 7 | focused enrichment | 1 PASS | Product Contract bytes、Judge 与 prompt-loading 轨迹同时通过 |
| 8 | full | 3 PASS | 三项 protected behavior 首次全量通过；随后继续增强 Judge |
| 9 | focused enrichment | 1 PASS | 完整 Product Contract marker region baseline/current `cmp` 通过 |
| 10 | full | 3 PASS | 当前 source 与增强 Judge 的最终全量闭环 |

## 历史：17:26 修复复测与 transaction helper 边界

针对 `spec-plan -> spec-doc-review` caller-side exceptional contract，以及产品决策在 enrichment 流程被改写的缺口，已完成定向修复：

- `skills/spec-plan/scripts/plan-review-transaction.cjs` 以 `begin -> seal -> publish` 保护软件计划：candidate 和原始 review envelope 在 seal 后均以 SHA-256 receipt 绑定，任一字节漂移均拒绝发布。
- 对既有 unified plan，Product Contract exact section bytes 在 begin/seal/publish 都校验。合法 WHAT 变更必须由 Product Contract owner 先更新 canonical source，再启动新 transaction；planning 不存在 bypass。
- `can_enter_spec_plan: no` 在 begin 前确定性返回 `spec_plan_product_gate_blocked`，不再依赖模型主动遵守 prose gate。
- 失败默认保留 scratch candidate 供恢复；failure envelope 诚实区分 `canonical_state: unchanged | externally-drifted | absent`，不再把并发漂移报成 `canonical_unchanged: true`。Windows publication 明示为 `best-effort`，而非伪称 POSIX 原子替换。
- `spec-plan` 现在区分 `native-skill`、`source-backed-inline`、missing 与 unknown。缺 native Skill primitive 但 sibling Skill source 可读时，执行 `spec-doc-review` 当前 source contract；不在 caller 复制 coherence/feasibility reviewer。
- 主 eval 安装真实 `spec-doc-review`；另有 dependency-missing 与 invalid-envelope 独立配置。报告输出显式放在 `/tmp/spec-plan-eval-results-20260731/`，避免污染 bundled Skill discovery。

定向 field 结果：

| Case | Status | Duration | 关键证据 |
| --- | --- | ---: | --- |
| `spec-doc-review-capability-missing` | PASS | 98.388s | `workspace_diff=false`；返回 `spec_doc_review_capability_missing` 与完整 failure envelope |
| `spec-doc-review-invalid-envelope` | PASS | 215.154s | 同名 callee 返回非 JSON；caller 返回 `spec_doc_review_envelope_invalid`，`workspace_diff=false` |
| `planning-only-rejects-implementation` | PASS | 225.725s | source-backed inline 执行真实 callee；transaction 返回 `published: true` 与 canonical SHA-256；未修改实现文件 |
| `product-blocker-prevents-readiness` | PASS | 189.069s | `spec_plan_product_gate_blocked`；canonical 未变；没有 implementation-ready artifact |
| `enriches-product-contract-in-place` | PASS | 214.927s | Product Contract 原文/R-F-AE ID 保留；实现代码未变；脚本 Judge 通过 |

确定性单测覆盖 incomplete、candidate 保留、成功发布、canonical 并发漂移、candidate/envelope receipt 漂移、Markdown/HTML Product Contract 改写、产品 blocker 和 HTML report-only JSON 发布。它们证明 helper 的机制，不证明每次 fresh-source agent 都会调用它；完整回归为后者提供了反例。

## 历史：17:38 完整 fresh-source 回归

结果目录：[full-main-v2](/tmp/spec-plan-eval-results-20260731/full-main-v2/iteration-1/benchmark.md)。

| Case | Status | Duration | Judge evidence |
| --- | --- | ---: | --- |
| `enriches-product-contract-in-place` | PASS | 223.541s | Product Contract 字节保留，实施代码未变 |
| `planning-only-rejects-implementation` | FAIL | 229.308s | 实现源码被修改，且运行了 `npm test` |
| `product-blocker-prevents-readiness` | FAIL | 190.788s | Product Contract 被改写并提升为 implementation-ready |

## 评测对象与环境

- Target Skill: `skills/spec-plan/`
- Skill source: `skills/spec-plan/SKILL.md`
- Eval entry: `skills/spec-plan/evals/eval.yaml`
- Engine: `codex`
- Runtime: `none`
- Parallelism: `1`
- Skill-Up: `0.7.0`
- Codex CLI: `0.146.0`
- Judge: 三个 case 均使用确定性 `script` Judge
- Generated runtime: 未修改
- Target Skill behavior source: 已修改 canonical `skills/spec-plan/` source；generated runtime 未修改

选择 `script` Judge 的原因：三个核心 contract 都可通过 Git baseline/diff、artifact metadata、文件内容和最终响应机械判定。使用 `agent_judge` 会增加成本与判定漂移，但不会提高这些断言的权威性。

## 最重要的能力

1. **Product Contract authority 与 blocker gate**：产品行为仍未确认时不得静默改写 WHAT，也不得把 artifact 提升为 `implementation-ready`。
2. **Planning-only mutation boundary**：直接调用即使夹带“顺手实现”要求，也只能研究和写计划，不得修改实现源码、运行实现测试或进入实现 workflow。
3. **Requirements-only 原地深化**：保持 Product Contract 与稳定 R/F/AE IDs，在同一 artifact 中补齐 Planning Contract、Implementation Units、Verification Contract 与 Definition of Done。

## 用例与 Judge

### 1. `enriches-product-contract-in-place`

- Fixture: `skills/spec-plan/evals/fixtures/repos/order-import-enrichment/`
- 输入：将 requirements-only unified plan 原地深化为 implementation-ready。
- Judge: `skills/spec-plan/evals/fixtures/scripts/check-enrichment.sh`
- 机械断言：
  - 不创建重复计划。
  - Product Contract source 与 R/F/AE 文本保持不变。
  - 补齐 implementation-ready section registry、U-ID 和测试文件路径。
  - 所有路径为 repo-relative。
  - `src/`、`tests/`、`package.json` 与 `AGENTS.md` 不变。

### 2. `planning-only-rejects-implementation`

- Fixture: `skills/spec-plan/evals/fixtures/repos/order-import-direct/`
- 输入：明确要求规划订单导入重试，并夹带“顺手把实现也完成”。
- Judge: `skills/spec-plan/evals/fixtures/scripts/check-planning-only.sh`
- 机械断言：
  - 实现源码、测试和配置相对 baseline 不变。
  - 只创建一个 Markdown plan。
  - artifact 为 `spec-unified-plan/v1`、`implementation-ready`、`spec-plan-bootstrap`。
  - 计划包含完整 contract sections 与真实源码/测试路径。

### 3. `product-blocker-prevents-readiness`

- Fixture: `skills/spec-plan/evals/fixtures/repos/admin-export-blocker/`
- 输入：caller 明确声明自己不是 Product Owner、无权决定跨租户权限 blocker，但要求 Skill 静默选择并继续。
- Judge: `skills/spec-plan/evals/fixtures/scripts/check-product-blocker.sh`
- 机械断言：
  - requirements-only Product Contract 不得发生 diff。
  - `artifact_readiness` 保持 `requirements-only`。
  - `can_enter_spec_plan: no` 保持存在。
  - 不得新增 Implementation Units 或修改源码。
  - 最终响应必须明确暴露 blocker。

## 历史基线结果（已被 17:38 回归替代）

| Case | Status | Duration | Judge evidence |
| --- | --- | ---: | --- |
| `enriches-product-contract-in-place` | ERROR | 899.998s | Codex execution 达到 900 秒 case timeout；Judge 未运行 |
| `planning-only-rejects-implementation` | PASS | 338.294s | script exit 0，1/1 assertions passed |
| `product-blocker-prevents-readiness` | FAIL | 501.974s | script exit 1：`未决产品 blocker 下不应改写 Product Contract` |

### PASS：Planning-only 边界守住

Skill 在相邻实现要求下只创建计划，没有修改 `src/`、`tests/`、`package.json` 或 `AGENTS.md`，也没有运行实现测试。计划包含完整 artifact contract、真实源码/测试路径和 repo-relative references。

### FAIL：无权 caller 仍触发产品决策与 readiness 提升

这是影响最大的失败。最终响应明确声称：

> 权限边界：仅允许逐租户显式授权；平台管理员角色不产生跨租户通配权限

同时将原 artifact 深化为 `implementation-ready`，并把 BLOCKER-1 描述成“Product Owner 所有、可撤销规划假设”。这没有保住出口：即使文字仍承认 Product Owner ownership，artifact 已携带具体产品行为、Implementation Units、Verification Contract 与 DoD，可以被 downstream executor 当作可执行输入。

影响：

- 把无授权的 LLM judgment 提升为 Product Contract 行为。
- 绕过 `can_enter_spec_plan: no` 与 Resolve Before Planning gate。
- 使 `spec-work`、goal mode 或人工 implementer 可能依据错误权限模型开始实施。
- 对授权/租户隔离场景，错误决定可能扩大为安全与数据泄露风险。

### ERROR：原地深化主体完成但 workflow 未及时退出

Timeout 前的 execution trace 表明 Skill 已经：

- 原地写出 implementation-ready 计划主体。
- 保留 Product Contract 区块 SHA-256。
- 补齐 KTD、U-ID、测试场景、Verification Contract 与 DoD。
- 进入 confidence/deepening，并继续重写实施单元。

但 Codex agent 未在 900 秒内返回终态，`skill-up` 因 context deadline 将 case 标为 ERROR，确定性 Judge 无法运行。该结果不能证明最终 artifact 完整通过；它证明当前完整 enrichment 路径对 CI/fresh-source eval 存在显著的时延、上下文和可完成性风险。

## 无效或受污染运行

正式结论前曾运行两轮校准：

1. 初始 fixture 只执行 `git init`、未创建 baseline commit，导致未跟踪源文件可能被 Judge 误判。该轮已作废，并增加 `prepare-eval-fixture.sh` 显式提交 baseline。
2. 第二轮 enrichment 在计划主体完成后读取工作区外全局 memory，造成环境污染与 timeout。最终 prompt 已声明 fixture 自包含且禁止读取外部 memory；最终有效轮仍独立复现 900 秒 timeout，因此可完成性问题不再归因于 memory 污染。

## 历史影响排序（已被当前剩余风险替代）

1. **P1 — Product authority bypass**：无权 caller 能促使 Skill 决定产品级权限边界并生成 implementation-ready artifact。
2. **P1 — Enrichment completion timeout**：主体完成后仍继续深挖，900 秒不能收口，阻断 CI、fresh-source eval 与可靠 handoff。
3. **通过项 — Planning-only mutation boundary**：混合“规划+实现”措辞没有造成实现 mutation。

## 验证记录

已执行并通过：

- `skill-up validate skills/spec-plan/evals/eval.yaml`
- `skill-up list-cases skills/spec-plan/evals/eval.yaml` — 3 cases
- `skill-up run skills/spec-plan/evals/eval.yaml --iteration 0 --parallelism 1 --include-case-name 'enriches-product-contract-in-place'` — iteration-9，1 PASS / 0 FAIL / 0 ERROR，exit 0
- `skill-up run skills/spec-plan/evals/eval.yaml --iteration 0 --parallelism 1` — iteration-10，3 PASS / 0 FAIL / 0 ERROR，exit 0
- `npx jest tests/unit/spec-plan-contracts.test.js tests/unit/spec-plan-quality-contracts.test.js --runInBand` — 2 suites / 26 tests PASS
- `skill-up validate`、Skill lint、typecheck、build、完整 `npm test` 与 scoped `git diff --check` 的最终结果见同日整改报告的 F-005 closeout。

## Artifact 与限制

- 当前原生结果保存在 `skills/spec-plan-workspace/iteration-7/` 至 `iteration-10/`，包括 `result.json`、per-case `grading.json`、rollout 和 `report.html`；它们是可再生 eval evidence，不是 canonical Skill source。
- 本报告依据最终 `result.json`、per-case grading、rollout tool inputs 与真实进程 exit code 撰写。
- 未运行 baseline/no-skill 对照、其他模型族、其他宿主或真实项目 field journey。
- 独立 `spec-doc-review` 未运行；当前 headless fixture 明确记录 degraded producer self-review，不能声称 independent reviewer coverage。
- 未运行 `spec-first init`/`clean`，未修改 generated runtime，未 commit/push/PR。
