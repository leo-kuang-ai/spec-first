---
title: Skill 关系审查当前快照验证记录
doc_role: audit-evidence
review_date: 2026-07-18
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: e395f10f92cb6e55875da74aa01927a66e53797b
working_tree_calibrated_at: 2026-07-20
working_tree_overlay: uncommitted-sf01-proof-delivery-and-sf27-pregate-dispatch-repair
---

# Validation — current source refresh

## 1. Pass 0 snapshot

| Fact | Result |
| --- | --- |
| Original audit source HEAD | `0c1b358605c534db50321a5252e5e6d356dbcefb` |
| Current calibration HEAD | `e395f10f92cb6e55875da74aa01927a66e53797b` |
| Branch | `leo-2026-07-16-plan-update` |
| Dirty state before final SF-01/SF-27 repair | clean；SF-06 已进入 current HEAD |
| Current final repair overlay | uncommitted working tree; `current_head_at_calibration` 不包含本轮 `spec-proof` delivery、code-review trivial-PR inline、governance wording、测试与审查 evidence 修复 |
| Package version | `1.13.2` |
| Baseline HEAD | `7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64` |
| Frozen `source_head` delta to baseline | 4 commits; 30 changed canonical Skill sources, including 3 new references |

## 2. Deterministic frozen-source inventory

The inventory read `skills/<governed skill>/SKILL.md` and `references/**` only. A case-insensitive skill-name token boundary produced file-target supports; it does not classify semantic role by itself. 下表的 manifest/pair hash 绑定 `source_head` 冻结快照；`current_head_at_calibration` 的后续修复与 SF-03/SF-04/SF-10/SF-06、最终 SF-01/SF-27 overlay 只通过后续 focused/full tests 校准，本轮未重算整张关系图 manifest。SF-06 修改两个既有 canonical reference 并新增 `evals/` fixture；最终 overlay 只改变 delivery allowlist、code-review pre-gate prose、governance 说明及合同测试，不新增 Skill 节点或 canonical pair，因此不得把冻结的 278-file manifest 描述成当前 working-tree 重算结果。

| Command / fact | Result |
| --- | --- |
| current governed roster from `skills-governance.json` | 35 nodes: 17 workflow, 11 standalone, 7 internal |
| canonical source count | 278 |
| source manifest SHA-256 | `01c8b308afcc5907bc70e3e2983cae525098cb4db0d4e050dbf0144b79e5bc9f` |
| file-target support hits | 265 |
| canonical pair count | 165 |
| pair manifest SHA-256 | `71c0a4c26d4b47690f4023a33174bf295be1df74787332e396d0b195e38ea30a` |
| baseline/current pair set delta | +9 / -1 |

## 3. Commands executed

| Command | Result | Scope |
| --- | --- | --- |
| `npm run lint:skill-entrypoints` | pass, 313 files scanned | public/internal entrypoint governance；包含当前 task-pack review reference 与 maintainability eval source package |
| `npm run typecheck` | pass, 184 files checked | current JS / script syntax floor |
| `npm run test:eval-fixtures` | pass, 6 suites / 78 tests | eval fixture contract |
| focused code-review/doc-review/LFG/browser/work Jest batch | pass, 6 suites / 112 tests | report-only, browser, LFG and work handoff contracts |
| focused brainstorm/plan/config/five-host Jest batch | pass, 5 suites / 48 tests | canonical LFG name, active config consumer regression, source projection |
| `tests/unit/plugin-modules.test.js` | pass | current filtered internal asset delivery contract |
| post-calibration SF-08/SF-09 + changelog focused replay | pass, 4 suites / 47 tests | exact LFG handoff, browser contract, changelog format |
| post-calibration five-host lifecycle replay | pass, 1 suite / 15 tests | five-host source projection and lifecycle consistency |
| post-calibration `plugin-modules` replay | pass, 1 suite / 10 tests | delivered internal allowlist、recursive package projection 与 governance-only negative boundary |
| mutation/dispatch authority focused replay | pass, 14 suites / 77 tests | SF-05/SF-07/SF-27、18-package matrix、reference-level fallback 与关联合同 |
| SF-01 final focused replay | pass, 9 suites / 65 tests | caller contract、LFG authority handoff、public-route hiding、helper authority、catalog/doctor inventory 与 five-host sandbox init |
| SF-01 pre-final negative-delivery replay | pass, 2 suites / 25 tests | 当时只交付两个 load-bearing commit helper；该历史结果随后被最终 Proof caller 复核扩展，不再代表 current delivery count |
| SF-01/SF-27 final adversarial focused replay | pass, 18 suites / 269 tests | 9 条 load-bearing internal-helper caller edge、`spec-proof` 完整 package 五宿主投射、public-route 隐藏/显式点名边界、trivial-PR inline 与 profile-dispatch gate ordering |
| SF-02 promotion contract replay | pass, 2 suites / 43 tests | schema/template/guide/validator byte parity；Knowledge Harness consumer consistency；Full、Lightweight、Refresh Replace/Consolidate gate 与 destructive deletion ordering；完整正例、缺失/空值/转义空白/非字符串 scalar/错误类型/普通及 YAML-equivalent 重复键负例；binary/date/YAML 1.1 implicit-type false-pass 防护；legacy default compatibility 与 UTF-8 locale |
| SF-02 inline adversarial diff scan | pass, no remaining actionable finding | 检查 promotion bypass、false-pass input、legacy regression、package parity、mechanical/semantic ownership 与 generated-runtime boundary；先发现并修复 Consolidate delete ordering、YAML-equivalent duplicate key 和 common-parser implicit scalar 三类缺口。`dispatch_authorization_missing`，independent persona、validator 与 cross-model review 均未运行 |
| SF-03 config-consumer RED | expected fail, 1 suite；1 failed / 8 passed | 新 focused assertion 首先证明 Runtime Setup 仍把已实现的 `plan_output` / `brainstorm_output` consumer 标为 reserved；失败未被改写为通过 |
| SF-03 config-consumer focused replay | pass, 3 suites / 32 tests | 三个 active consumer、注释模板、默认值、pipeline override、project-config bootstrap 与 Node setup contract |
| SF-03 inline adversarial diff scan | pass, no remaining actionable finding | 检查注释示例误激活、setup 自动调用 workflow、重复配置 owner、默认值/pipeline override 漂移与 generated-runtime 修改；`dispatch_authorization_missing`，未运行 independent fresh-source review |
| SF-04 task-pack consumer RED | expected fail, 1 suite / 5 tests failed | 新 focused contract 在旧 source 上证明 task-pack 唯一分类、report-only producer authority、deterministic intake/source-plan fidelity、terminal owner 与 copy-ready handoff 均缺失；失败未被改写为通过 |
| SF-04 task-pack consumer focused replay | pass, 3 suites / 53 tests | task-pack classification、mutation reason、validator receipt、task-specific lens、JSON outcome、write-tasks handoff、`Review complete`/`roster:full` authority negative boundary |
| SF-04 current task-pack receipt probe | pass；`task_pack_validity: valid`、`deterministic_handoff: true`、source-plan hash matched | 对现有 `docs/tasks/2026-07-17-001-refactor-agent-skills-capability-integration-tasks.md` 运行真实 `node bin/spec-first.js tasks validate ... --repo . --json`；确认实际 JSON 有 path/metadata/contract/execution_focus/validation/errors/limitations 且无 task-pack digest |
| SF-04 extended projection/dispatch replay | pass, 7 suites / 99 tests | doc-review/write-tasks source package、dispatch authorization fallback、task-pack fixtures、plugin projection、resource rewrite 与 CE source-sync contract |
| SF-04 inline adversarial diff scan | pass, no remaining actionable finding | 检查 malformed pack 误分类、derived artifact mutation、invalid intake persona dispatch、terminal signal 假升级、full roster 假授权、pack/plan gap owner 混淆、validator receipt 虚构 digest 与 generated-runtime 修改；`dispatch_authorization_missing`，未运行 independent fresh-source review |
| SF-10 artifact-map contract RED/GREEN replay | RED expected fail, 1 suite / 1 failed；随后 GREEN 1 suite / 11 tests | 用户地图先被证明仍是 false-only / graph-shaped / implicit-consumer 旧口径；修复后对齐 schema、producer durable trigger、v1 read/prune compatibility、v2 direct evidence 与 source-owned reader 边界 |
| SF-10 producer/shipping focused replay | pass, 3 suites / 44 tests | 用户地图合同、source-owned producer/read-prune 和 shipping durable-trigger closeout 共同回归 |
| SF-06 maintainability precedence RED | expected fail, 1 suite；1 failed / 20 passed | 新 focused assertion 在旧 shared template 上证明 `persona-defined mechanical threshold`、line-count evidence 与 structural exception 均缺失；失败未被改写为通过 |
| SF-06 advisory-reroute adversarial RED | expected fail, 1 suite；1 failed / 21 passed | 初版 suppress 修复仍未阻止 generic advisory 将 proven persona finding 降为 anchor-50；新增断言先证明该旁路仍存在，失败未被改写为通过 |
| SF-06 maintainability focused replay | pass, 1 suite / 22 tests | persona/shared-template false-positive + advisory precedence、1k crossing、thin wrapper、duplicate canonical helper 与 subjective long-file negative case |
| `npm run test:unit` after SF-06 adversarial repair | pass, 125 suites / 1274 tests | complete unit regression；包含 SF-03 config consumer、SF-04 task-pack consumer、SF-10 artifact-map、SF-06 suppress/advisory precedence、active replay manifest 与全仓 unit contracts |
| `npm run test:unit` after final SF-01/SF-27 repair | pass, 125 suites / 1277 tests | complete unit regression；新增 Proof direct-name/internal-route separation 与 pre-gate dispatch guard |
| `npm run test:smoke` | pass, 1 suite / 5 tests | CLI help、preview、global profile 与 packed five-host runtime |
| `npm run test:integration` | pass, 6 suites / 21 tests；1 conditional suite / 2 tests skipped | five-host init、workspace graph、Qoder lifecycle 与 plan closeout integration |
| `npm run test:eval-fixtures` | pass, 6 suites / 78 tests | current eval/replay fixture contracts |
| `npm run build` | pass, 684 package files | `npm pack --dry-run` package surface；包含 maintainability capability fixture、task-pack review lens/eval 与三个 load-bearing helper 的完整 source package |
| `git diff --check` after final calibration | pass | whitespace floor for current source/docs/test diff |
| `npm run test:release:governance` | fail on pre-existing public-workflow summary coverage；runtime catalog freshness pass | 本轮未修改 governance summary records；release continuity 仍报告 10 个 public workflow 缺 contract summary，不能把本轮验证提升为 release-ready |

一次早期 focused 命令错误引用了仓库中不存在的 `tests/unit/runtime-capability-catalog.test.js`，因此以 ENOENT 失败；该结果没有被改写为通过。随后改用当前仓库真实存在的 catalog/shipping/entrypoint 合同测试，并在对抗性修复后加入 LFG authority handoff 覆盖，形成上表 9-suite / 65-test 的最终 focused evidence。

SF-03 的 config-consumer test 先在旧 reserved 口径上按预期 RED，随后在 Runtime Setup、配置模板与真实 consumer 对齐后转为 GREEN。该结果只证明当前 source contract 与注释模板的一致性，不证明真实 host 已加载新 Skill，也不证明任何本地配置 field outcome。

SF-04 的 focused contract 先在旧 doc-review 四类文档口径上按预期 RED，随后在扩展现有 owner 后转为 GREEN。对抗性复核还校准了真实 CLI receipt：当前 `tasks validate` 不返回 task-pack digest，因此 lens 只消费实际存在的 path、metadata、contract、execution focus、validation、errors 与 limitations。该证据只证明 source contract 和静态正负 handoff fixtures，不证明真实 host 已完成 persona dispatch 或 field review。

SF-10 的 artifact-map contract 先在旧 false-only / graph-shaped / implicit-consumer 口径上按预期 RED，随后在只修改用户地图与既有合同测试后转为 GREEN（1 suite / 11 tests）。对抗性复核锁定 `workflow_integrated=true` 必须绑定 durable trigger、无 trigger 不写 `run.json`、同一 workspace/run-id 不覆盖、v2 只使用五个 direct-evidence 字段、`graph_evidence_used` 仅保留 v1 read/prune 兼容，以及没有 workflow 自动发现或隐式消费；该证据只证明 source/docs contract，不证明真实用户阅读或跨宿主文档渲染。

SF-06 的 focused contract 先在旧 shared-template absolute suppression 口径上按预期 RED；初版修复后，对抗性扫描又证明 generic advisory 仍可能把 proven 1k P1/anchor-100 降为 anchor-50，因此第二次按预期 RED（1 failed / 21 passed）。最终 shared template 先保留由 persona 定义且被 current diff 直接证明的 severity/confidence，再对其余 shapes 执行 FP-over-advisory precedence，focused replay 转为 GREEN（1 suite / 22 tests）。四个 planted cases 保证 1k crossing、thin wrapper、duplicate canonical helper 不被 subjective long-file rule 或 advisory reroute 误压制，同时无 threshold crossing、无 concrete failure mode 的 “getting long / hard to read” 仍被 suppress。该证据只证明 current prompt/fixture contract，不证明 fresh-session persona 一定稳定执行该语义。

## 4. Current-source semantic scenarios

No generic subagent dispatch was authorized. All rows are current-source inline checks, not fresh-source independent evaluations.

| Scenario | Expected / forbidden | Observed current source | Evidence level |
| --- | --- | --- | --- |
| autonomous brainstorm handoff | route `spec-lfg`; forbid bare `lfg` | exact skill resolution and absolute plan payload specified | current source + focused contracts |
| LFG browser applicability | backend/docs can be `not_applicable`; UI requires explicit loopback origin | statuses/reasons and caller-owned server defined; effect gate blocks sensitive flow | current source + focused contracts |
| work semantic plan review | byte-preserving JSON envelope; forbid plan mutation by reviewer | before/after hash, `mutation:report-only`, invalid/P0/P1 block rules specified | current source + focused contracts |
| knowledge promotion | new/materially rewritten learning requires recoverable provenance and invalidation; forbid legacy bulk breakage or refresh successor/consolidation bypass | both packages share promotion fields and validator; Full/Lightweight/Replace/Consolidate material writes use `--promotion`; default mode remains parser-safety-only | working-tree source + focused contracts；SF-02 closed at `source-contract-confirmed` |
| task-pack review | unique pack intake；derived artifact report-only；validator 只提供 deterministic floor；source plan 保持 scope/architecture authority；forbid `Review complete`/`roster:full` 作为 handoff/dispatch authority | `type: task-pack` 优先分类；invalid/stale intake 不 dispatch personas；task-specific lens 覆盖 fidelity/dependency/wave/files/effects/verification/stop/review/parity；outcome 将 pass、pack gap、plan gap 分别交给 `spec-work-task-pack`、`spec-write-tasks`、`spec-plan` | working-tree source + focused contracts；SF-04 closed at `source-contract-confirmed` |
| config consumer | active plan/brainstorm/ideate output config；forbid setup invocation authority、注释示例误激活与默认值漂移 | setup/template/test 已对齐三个 existing consumer；注释示例、consumer 默认值与 pipeline override 边界保留 | working-tree source + focused contracts；SF-03 closed at `source-contract-confirmed` |
| internal helper delivery | direct caller edge must resolve or carry an equivalent fallback；forbid treating every name mention or mode token as invocation/landing authority | LFG/dogfood 的 commit/browser/worktree target 与 plan/brainstorm/ideate/explain/pov 的 Proof target 已作为 internal-only package 五宿主投射；严格内部 helper 与显式点名 Proof 的入口边界分离；spec-work 仍只有 conditional named references | working-tree source + focused projection contracts；SF-01 closed at `projection_confirmed` |
| code-review mutation policy | classification must not grant apply authority; ordinary review report-only; mode:agent caller-owned apply | `autofix_class` is classification-only and run-local `mutation_policy` is authoritative | working-tree source + focused contracts；SF-05 closed |
| maintainability shared spine | persona-defined mechanical threshold must survive generic style suppression and advisory reroute；subjective opinion must remain suppressed | shared template preserves proven persona severity/confidence before FP/advisory normalization；planted cases keep 1k crossing/thin wrapper/duplicate helper and suppress ungrounded long-file opinion | working-tree source + focused RED/GREEN replay；SF-06 closed at `source-contract-confirmed` |
| dogfood/polish exit authority | branch scope, local fix, commit and landing must have separate explicit basis | four run-local facts defined; branch/PR selector and `done` do not authorize checkout/commit; uncommitted fallback preserved | working-tree source + focused contracts；SF-07 closed |
| spec-work artifact map | user map must match current producer integration flag, evidence fields and reader boundary | map distinguishes integrated true/false, durable-trigger reasons, v1/v2 compatibility, v2 direct evidence fields and explicit source-owned reader; no implicit workflow consumer is claimed | working-tree source/docs contract + focused RED/GREEN replay；SF-10 closed at `source/docs-contract-confirmed` |
| generic dispatch | explicit authorization required; forbid route/mode/permission/approved-spec-as-dispatch authorization | working-tree matrix is 18 dispatching / 18 qualified / 0 package-local gap；code-review trivial-PR pre-check is inline and profile dispatch remains after Stage 1c；this run itself used inline fallback | working-tree source + focused contracts + inline order audit；SF-27 closed，independent outcome not_run |

## 5. Counter-evidence and limitations

- `spec-commit`、`spec-commit-push-pr`、`spec-proof`、`spec-test-browser` 与 `spec-worktree` 现在作为 internal assets 投射；这不证明真实 host loader/invocation，也不把 `spec-test-xcode`、`spec-resolve-pr-feedback` 从 governance-only 提升为 delivered。
- CodeGraph was used only to orient source/test locations. Its output is provider-untrusted and does not support relation or completion claims.
- No clean-session host loader/helper invocation test, fresh-source semantic dispatch, real `agent-browser` navigation, external provider call, CI/merge/release, or field outcome was run.
- SF-02 tests prove field shape and workflow invocation only. They do not prove that a listed source is credible/reachable or that an invalidation condition is semantically sufficient; those remain LLM/human judgments.
- SF-03 tests prove source/template/consumer consistency only. They do not prove fresh-session host loading or real `.spec-first/config.local.yaml` behavior.
- SF-04 tests prove classification、source/producer authority、focused contract 和 fixture shape；它们不证明 persona finding 的语义正确性、独立上下文覆盖或真实 host invocation。当前 `dispatch_authorization_missing`，因此只能声明 inline adversarial coverage。
- SF-10 contract test proves map/schema/producer/read-prune wording alignment and rejects the retired false-only, graph-shaped and implicit-consumer claims；它不证明真实用户阅读、跨宿主渲染或 workflow 自动消费。
- SF-06 tests prove prompt precedence and planted-case shape only；它们不证明 fresh-session maintainability persona 的实际 finding recall、precision 或 host behavior。当前 `dispatch_authorization_missing`，因此只声明 inline adversarial coverage。
- Generated `.agents/skills/`, `.claude/`, `.codex/`, `.cursor/`, `.kiro/`, and `.qoder/` mirrors were not read as audit source and were not modified.
- The original audit artifact remains a knowledge-work deliverable；2026-07-20 的 SF-03/SF-04/SF-10/SF-06 与最终 SF-01/SF-27 overlay 是用户要求继续优化后的本地 source/test/docs repair。它不授权 plan lifecycle mutation、commit、push 或 PR，且当前最终 overlay 仍未提交。
