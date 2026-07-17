---
title: Skill 关联关系审查验证记录
date: 2026-07-17
status: complete
source_head: 7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
---

# Skill 关联关系审查验证记录

## 1. 快照与边界

- HEAD：`7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64`
- Branch：`leo-2026-07-16-plan-update`
- Package：`1.13.2`
- 审查对象：Skill 间 route、handoff、caller、consumer、authority、failure/return、stop condition、internal helper。
- 排除：普通代码质量、generated runtime mirror 作为 source、外部 field outcome。
- 审查期间存在并行用户改动；275 个 Skill scope 文件在分区读取完成后 SHA 快照稳定，本批次未覆盖并行改动。

## 2. 全量分母验证

### 2.1 Governed node 与 source file

确定性 inventory 结果：

```json
{
  "nodes": 35,
  "workflow": 17,
  "standalone": 11,
  "internal": 7,
  "files": 275,
  "mention_pairs": 157,
  "file_manifest_sha256": "933afb8ff0c3b8c4ee716c635e2c04179d03c60f91f71db7b12ce93a5bc10ffe",
  "pair_manifest_sha256": "95e3708cd8297c810e6e2244ec377ccbd7d1ed5b94937fce5aace6ee7f4b85fe"
}
```

文件口径：governance roster 中每个 package 的 `SKILL.md` 与 `references/**`。Cross-skill pair 使用 skill-name token boundary，避免把 `spec-commit-push-pr` 中的子串误算为 `spec-commit` edge。

### 2.2 分区台账对账

| 分区 | Expected | Actual | Unique | Missing | Extra | Duplicate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Planning | 102 | 102 | 102 | 0 | 0 | 0 |
| Execution | 85 | 85 | 85 | 0 | 0 | 0 |
| Sidepaths | 88 | 88 | 88 | 0 | 0 | 0 |
| **合计** | **275** | **275** | **275** | **0** | **0** | **0** |

Supporting ledger 另覆盖 governance、contracts、producer/consumer、projection、focused tests 与用户地图，共 76/76；不与 275 Skill source 分母混算。

### 2.3 Dispatch authority package matrix

fresh-source S1 暴露 dispatch boundary 后，按同一 current source 对全部 35 个 governed package 做了二次专项对账：

```json
{
  "packages": 35,
  "generic_dispatch_packages": 18,
  "complete_authorization_and_capability_fallback": 6,
  "authorization_or_fallback_gap": 12,
  "no_generic_dispatch": 17
}
```

完整 35/35 行、触发类型与 source refs 见 [edge-ledger.md §9](edge-ledger.md)。该矩阵把 governed Skill/helper 调用、tool/MCP 查询和当前 agent 直接执行排除在 generic dispatch 之外。

## 3. 确定性命令

### 3.1 Skill entrypoint 与语法

```text
npm run lint:skill-entrypoints
skill entrypoint lint passed (309 files scanned)

npm run typecheck
typecheck passed (180 files checked)
```

### 3.2 Focused contract / projection / lifecycle tests

执行：

```text
npx jest --runInBand --runTestsByPath \
  tests/unit/using-spec-first-contracts.test.js \
  tests/unit/plugin-modules.test.js \
  tests/unit/host-runtime-projection-contracts.test.js \
  tests/integration/init-five-host-lifecycle.integration.test.js \
  tests/unit/spec-brainstorm-contracts.test.js \
  tests/unit/spec-plan-contracts.test.js \
  tests/unit/spec-plan-quality-contracts.test.js \
  tests/unit/spec-doc-review-contracts.test.js \
  tests/unit/spec-write-tasks-contracts.test.js \
  tests/unit/task-pack-command.test.js \
  tests/unit/spec-work-contracts.test.js \
  tests/unit/spec-work-intake-contracts.test.js \
  tests/unit/spec-work-shipping-contracts.test.js \
  tests/unit/spec-code-review-contracts.test.js \
  tests/unit/spec-debug-contracts.test.js \
  tests/unit/spec-lfg-contracts.test.js \
  tests/unit/pipeline-mode-contracts.test.js \
  tests/unit/low-findings-cleanup-contracts.test.js \
  tests/unit/mcp-setup-config-consumers.test.js \
  tests/unit/honest-closeout.test.js \
  tests/unit/verification-run-summary.test.js \
  tests/unit/plan-status-helper.test.js \
  tests/unit/plan-status-taxonomy.test.js \
  tests/integration/plan-status-closeout.integration.test.js \
  tests/unit/repo-profile-cache-parity.test.js
```

结果：

```text
Test Suites: 25 passed, 25 total
Tests:       223 passed, 223 total
Time:        30.709 s
```

解释：绿灯只证明当前断言被实现。以下 finding 不能被绿灯推翻：

- projection test 只断言 `spec-worktree`，未检查所有 declared internal caller-target reachability；
- config-consumer test 明确锁定 `plan_output/brainstorm_output` 为 reserved；
- doc-review test 没有 task-pack document type；
- pipeline test 没有 browser `not-applicable` return；
- compound 没有 new-promotion required-field contract test。

### 3.3 Eval fixture floor

方案列出的最窄 eval-fixture 命令已补跑：

```text
npm run test:eval-fixtures

Test Suites: 6 passed, 6 total
Tests:       78 passed, 78 total
Time:        2.206 s
```

其中 `spec-write-tasks-contracts.test.js` 与 3.2 的 focused set 重叠，因此不把 223 与 78 相加伪装成 unique test 总数。该命令只证明 fixture/contract tests 当前为绿，不提升 host loader 或 field outcome claim。

## 4. 关键确定性探针

### 4.1 Internal helper 五宿主 projection

`planBundledAssetSync` 的 source-owned operation plan：

| Host | `syncedAssets.internalSkills` | 实际 internal `SKILL.md` operation |
| --- | --- | --- |
| Claude | `spec-worktree` | `.claude/skills/spec-worktree/SKILL.md` |
| Codex | `spec-worktree` | `.agents/skills/spec-worktree/SKILL.md` |
| Cursor | `spec-worktree` | `.cursor/skills/spec-worktree/SKILL.md` |
| Kiro | `spec-worktree` | `.kiro/skills/spec-worktree/SKILL.md` |
| Qoder | `spec-worktree` | `.qoder/skills/spec-worktree/SKILL.md` |

Governance 中 7 个 record 均声明五宿主 `host_delivery: internal`；实际交付 1/7。该探针不依赖当前 generated runtime mirror。

### 4.2 Knowledge corpus

```json
{
  "solutions": 32,
  "both": 9,
  "missing_invalidation_condition": 23,
  "missing_source_refs": 22
}
```

Corpus count 只说明存量形状；SF-02 的根证据仍是 current role/knowledge contract 与 canonical schema/template 的矛盾。

### 4.3 Sweep / Riffrec analyzer

```text
9af356ed4f991eea230fa39f3878a64ab7c8064f7a396adfc424db27fd0a3761  skills/spec-sweep/scripts/analyze_riffrec_zip.py
9af356ed4f991eea230fa39f3878a64ab7c8064f7a396adfc424db27fd0a3761  skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py
cmp_exit=0
```

当前 byte parity 是 SF-22 的强反证，因此只定 P2；未发现 owner/generator/parity test，不能保证未来同源。

### 4.4 Undefined governed target

对 invocation-shaped prose 提取 target 并与 governance roster 对照，唯一未定义 target 是：

```text
skills/spec-brainstorm/references/handoff.md:92  lfg
skills/spec-brainstorm/references/handoff.md:102 lfg
```

Governed target 为 `spec-lfg`，bundled command/alias 中没有 `lfg`。

### 4.5 Dispatch authorization inheritance

共享 source 明确规定 routing 不授权 subagent dispatch，缺授权必须走 workflow fallback并记录 `dispatch_authorization_missing`。35/35 package 对账结果：18 个 package 会 generic dispatch；仅 6 个完整继承；12 个有缺口。

高风险 current-source 证据：

- `spec-compound-refresh` 的 replacement subagent 可写 tracked successor learning；
- `spec-optimize` 的 experiment worker 可修改 worktree code；
- `spec-resolve-pr-feedback` 把 direct invocation 或“用户未禁止 delegation”当 mutating resolver 授权；
- scheduled/headless `spec-sweep` 可把 Slack/email/media 内容交给额外 agent context；
- `spec-ideate` 默认约 8–13 agents，但 cost notice 不是 dispatch authorization，核心 fleet 缺 no-subagent fallback。

这组证据形成 SF-27；完整反证是 `spec-code-review`、`spec-debug`、`spec-doc-review`、`spec-plan`、`spec-prd`、`spec-work` 已实现正确 gate/fallback precedent。

## 5. 六类语义场景

这些场景用于检查关系选择、authority、failure 与 stop condition；不把它们当 field outcome。

### 5.1 Current-source inline review

| 场景 | 输入 | Expected | Forbidden | Current-source observed | 裁决 |
| --- | --- | --- | --- | --- | --- |
| S1 相邻入口 | 模糊软件想法，用户/成功标准/WHAT 未定 | `using-spec-first -> spec-brainstorm`；brownfield PRD 改写才走 spec-prd；HOW 未定但 outcome 清楚才走 spec-plan | 直接 spec-work、把 ideation 当 Product Contract，或把 workflow routing 当 subagent authorization | route/WHAT-HOW/artifact gate 正确；但 brainstorm 默认 dispatch 未继承共享 authorization/reason contract | FAIL -> SF-27 |
| S2 implementation blocker 回流 | spec-work 发现需改变 product WHAT 或 public/schema/provider/source owner | 返回 spec-plan/spec-brainstorm；保留当前证据与 blocker | implementation workflow 静默改 scope | work execution-strategy/intake 明确 stop-back | PASS |
| S3 高风险 task pack | write-tasks 生成 required review pack | consumer 应识别 task-pack contract，审查 dependency/wave/stop_if/source-plan fidelity | 当 requirements 或普通 plan 审查后标 reviewed-existing | doc-review 只有 4 类 document type，无 task-pack intake | FAIL -> SF-04 |
| S4 review-and-fix | 普通“review”与显式“review and fix”两个请求 | 前者 report-only；后者 bounded local apply；commit 仍需独立授权 | default review 自动改；mode:agent 改；apply 自动 commit | main Skill 正确，但 rubric/schema/template 给出相反 authority | FAIL -> SF-05 |
| S5 degraded/multi-repo | parent workspace 无 target repo，provider graph 可用但 scope 不明 | provider 只导航；停止 write/test/fix，要求选 child repo | graph/provider 猜 scope 或写父目录 | using/work/runtime contracts一致 fail closed | PASS |
| S6 knowledge promotion | 已修复问题，但 learning 缺 source refs 或 invalidation condition | knowledge-promotion exit 不应完成；可保留 session/advisory | 直接写 durable verified learning | role/knowledge contract要求 gate，compound schema/template未实现 | FAIL -> SF-02 |

### 5.2 Fresh-source independent read-only evaluation

一个未收到主审查 findings、预设 PASS/FAIL、测试结论或候选 verdict 的只读 worker，重新完整读取下列 22 个 current-source 文件后独立裁决六类场景。Worker 未修改文件、未运行测试；该证据只证明 source-level semantic behavior，不证明 host loader、真实 invocation 或 field outcome。

```text
docs/10-prompt/结构化项目角色契约.md
docs/contracts/knowledge/knowledge-harness.md
skills/using-spec-first/SKILL.md
skills/using-spec-first/references/conditional-routing-boundaries.md
skills/using-spec-first/references/public-route-map.md
skills/spec-brainstorm/SKILL.md
skills/spec-brainstorm/references/handoff.md
skills/spec-plan/SKILL.md
skills/spec-write-tasks/SKILL.md
skills/spec-write-tasks/references/execution-handoff-contract.md
skills/spec-doc-review/SKILL.md
skills/spec-doc-review/references/subagent-template.md
skills/spec-doc-review/references/document-classification-signals.md
skills/spec-work/SKILL.md
skills/spec-work/references/execution-strategy.md
skills/spec-code-review/SKILL.md
skills/spec-code-review/references/action-class-rubric.md
skills/spec-code-review/references/findings-schema.json
skills/spec-code-review/references/subagent-template.md
skills/spec-runtime-setup/SKILL.md
skills/spec-compound/SKILL.md
skills/spec-compound/references/schema.yaml
```

| 场景 | Fresh-source result | 最小理由 | Finding |
| --- | --- | --- | --- |
| S1 相邻入口 | FAIL | 入口与 artifact 正确，但 `spec-brainstorm` 自动 dispatch 与全局显式 authorization gate 冲突 | SF-27 |
| S2 blocker 回流 | PASS | scope-changing discovery 明确停止 task 并回 `spec-plan` / task-pack regeneration | -- |
| S3 高风险 task pack | FAIL | producer handoff 已定义，consumer 缺 task-pack type、`source_plan` authority 与 derived-scope replay | SF-04 |
| S4 review-and-fix | FAIL | main report-only/explicit-apply contract 与 rubric/schema/subagent template 直接矛盾 | SF-05 |
| S5 degraded/multi-repo | PASS | provider graph 仍是 advisory，mutation 前必须明确 target repo | -- |
| S6 knowledge promotion | FAIL | required provenance/invalidation fields 未进入 canonical schema/producer gate | SF-02 |

Fresh-source verdict：2/6 PASS，4/6 FAIL。S1 是相对主线程初稿的新反证；随后 35/35 dispatch package matrix 将其从单场景信号升级为 confirmed current-source finding。

## 6. P1 反证

| Finding | 可推翻证据 | 实际结果 |
| --- | --- | --- |
| SF-01 | projection plan包含所有被 caller 使用的 helper，或 caller有明确 target-missing fallback | 只有 worktree；LFG 两个必需 target无可达 fallback |
| SF-02 | schema/template/promote prose仍要求两个字段 | 未找到；current schema显式称 knowledge track 无额外 required field |
| SF-03 | plan/brainstorm不读取 key，或 setup标 active | 两个 consumer明确读取，setup/test仍标 reserved |
| SF-04 | doc-review存在 task-pack type/lens | 无；authoritative type enum仅四类 |
| SF-05 | main/reference/schema对 apply owner一致 | 三套说法并存 |
| SF-06 | shared template给 persona-owned structural regression 例外 | 无；false-positive precedence要求完全 suppress |
| SF-07 | invocation被全局定义为 branch/commit authority | 相反：execution contract明确 skill invocation不授权 commit/landing |
| SF-08 | lfg alias由 governance/manifest交付 | 无 alias |
| SF-09 | browser helper可返回 not-applicable + reason | 无该 return shape |
| SF-10 | current docs全部指向新 path/v2 fields | README/catalog正确，但四个 current docs仍保留相反事实 |
| SF-27 | 所有 dispatching package 都继承显式 authorization 与 missing-auth/capability fallback | 18 个中仅 6 个完整继承；12 个有缺口，含 mutating/sensitive worker |

## 7. 未执行与限制

- 未修改或刷新 generated runtime；projection 通过 source-owned plan 验证。
- 未执行 clean-session 真实宿主 loader/invocation；因此不声称任何 host 已实际发现或调用 Skill。
- 未调用外部 Proof、GitHub PR、browser、Xcode、Slack、Figma、Riffrec 或 provider service。
- 未做真实团队 outcome、token、研发时长、缺陷率或 adoption 对比。
- Graphify/CodeGraph 输出只用于导航，所有存活 finding 均回源到 source/test/contract。
- Fresh-source 只证明受控 source-level semantic judgment；worker 没有收到主审查 findings，但本轮没有执行 clean-session host loader/invocation。
- 本批次只输出 review evidence，不修复 finding，不完成 origin plan lifecycle mutation。

## 8. Validation verdict

```text
coverage_status: complete-for-frozen-scope
source_files: 275/275
canonical_pairs: 157/157
supporting_surfaces: 76/76 full-ledgered
deterministic_tests: 25 suites / 223 tests passed
eval_fixtures: 6 suites / 78 tests passed
fresh_source_semantic: 2/6 passed, 4/6 failed
dispatch_packages: 35/35 classified, 12/18 dispatching packages have gaps
host_loader: not-run
field_outcome: not-run
overall: relationship graph usable but not fully correct
```
