---
title: Skill 关系审查当前快照验证记录
doc_role: audit-evidence
review_date: 2026-07-18
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 27baf79f7d3bb0873deb591218c76b9c11a91bbf
working_tree_calibrated_at: 2026-07-21
working_tree_overlay: none
---

# Validation — current source refresh

## 1. Pass 0 snapshot

| Fact | Result |
| --- | --- |
| Original audit source HEAD | `0c1b358605c534db50321a5252e5e6d356dbcefb` |
| Current calibration HEAD | `27baf79f7d3bb0873deb591218c76b9c11a91bbf` |
| Branch | `leo-2026-07-16-plan-update` |
| Dirty state before SF-24-SF-26 repair | clean；P0-P2 修复已进入当时 HEAD |
| Current calibrated repair state | `current_head_at_calibration` 已提交 SF-24/SF-25/SF-26 source/test/docs 修复；校准时 working-tree overlay 为 none；未修改 generated runtime |
| Package version | `1.13.2` |
| Baseline HEAD | `7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64` |
| Frozen `source_head` delta to baseline | 4 commits; 30 changed canonical Skill sources, including 3 new references |

## 2. Deterministic frozen-source inventory

The inventory read `skills/<governed skill>/SKILL.md` and `references/**` only. A case-insensitive skill-name token boundary produced file-target supports; it does not classify semantic role by itself. 下表的 manifest/pair hash 绑定 `source_head` 冻结快照，不冒充后续 source 全量重算。另做的 bounded committed-vs-frozen-source token scan 只用于校准已提交 P2 pair delta：新增 2 条 user-only route，删除 1 条纸面 consumer 与 2 条 reverse-only caller；P3 修复没有新增或删除 pair。该 scan 与冻结生成器的文件选择细节不同，因此不替换历史 total/hash。

| Command / fact | Result |
| --- | --- |
| current governed roster from `skills-governance.json` | 35 nodes: 17 workflow, 13 standalone, 5 internal |
| canonical source count | 278 |
| source manifest SHA-256 | `01c8b308afcc5907bc70e3e2983cae525098cb4db0d4e050dbf0144b79e5bc9f` |
| file-target support hits | 265 |
| canonical pair count | 165 |
| pair manifest SHA-256 | `71c0a4c26d4b47690f4023a33174bf295be1df74787332e396d0b195e38ea30a` |
| baseline/current pair set delta | +9 / -1 |
| committed P2 pair delta | +2 / -3（bounded committed-vs-frozen-source token scan） |
| P3 pair delta | 0 / 0；只校准 existing edge wording |

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
| post-calibration `plugin-modules` replay | pass, 1 suite / 10 tests | `skills-governance.json` 是 internal delivery 唯一真源，`plugin-governance.js` 直接消费且不维护第二份名单；同时覆盖 recursive package projection 与第二名单 negative boundary |
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
| SF-11 HTML consumer contract RED | expected fail, 2 suites；3 failed / 8 passed | 新合同先证明三份 renderer 仍否认 HTML doc-review consumer、Ideate 泄漏 plan-specific prose，且 Brainstorm 隐藏 HTML requirements review；失败未被改写为通过 |
| SF-11 focused replay | pass, 6 suites / 65 tests | 三份 renderer、Brainstorm handoff、doc-review report-only mutation owner、Plan 既有 HTML handoff、Changelog 与 test inventory |
| SF-12/SF-18/SF-13 contract RED | expected fail, 5 suites；5 failed / 26 passed | 旧 source 分别缺 Proof 前 Markdown materialization、tracker source/runtime parity 与正确 terminal/handoff 叙述；失败未被改写为通过 |
| SF-12/SF-18/SF-13 focused replay | pass, 5 suites / 31 tests | Brainstorm/Plan Proof source path、Save+Proof same-file、Ideate→Brainstorm→explicit Plan boundary、Work/LFG source parity 与五宿主 projection parity |
| SF-12/SF-18/SF-13 inline simplification | pass, no applied change | reuse/quality/efficiency 三镜逐项检查；跨包 tracker copy 是五宿主 root 差异下的必要 projection，Proof/Plan 步骤均为 load-bearing boundary，不为减少行数而删除 |
| SF-12/SF-18/SF-13 inline adversarial scan | pass, no remaining actionable finding | 检查 materialization-before-publish、same-byte/same-file、failure retention、direct ideate→plan 禁止、Work canonical owner、source/runtime parity、temp/durable evidence 与 generated-runtime boundary；补强 `spec-proof` existing-file/title/default-identity consumer assertion |
| post-adversarial focused replay | pass, 6 suites / 33 tests | 三项合同、五宿主 projection、Changelog format 与新增 Proof producer/consumer cross-contract |
| SF-14-SF-23 P2 closure RED | expected fail, 1 suite / 9 tests failed | 九项 current source 缺口分别由单一 closure contract 证伪；失败未被改写为通过 |
| SF-14-SF-23 final focused replay | pass, 10 suites / 89 tests | App audit integration、Optimize consumer、Compound/Worktree/Figma worker、Code Review cache/confidence、Riffrec parity、PR feedback authority、M-013 artifact-kind consumer 与五宿主 projection owner contracts |
| P2 language/anchor adversarial replay | expected fail, 10 suites；1 failed / 93 passed | 将新增 prose 校准为中文后，既有 dispatch-order test 仍依赖旧英文 profile-dispatch 锚点；随后把 test 精确改读当前 source marker，不弱化 gate |
| P2 closeout adversarial RED/current-source scan | expected fail, 9 suites；1 failed / 84 passed；另发现 2 个 false-green source/test gap | SF-23 新 projection test 错误要求 Cursor 保留不支持的 `allowed-tools` 字段；直接 source/test scan 另发现 SF-14 读取不存在 heading 的空 section 断言，以及 SF-11/M-013 requirements-only direct-work wording漏网；三者均在 final focused replay 中转绿 |
| P2 first complete unit adversarial RED | expected fail, 126 suites；2 failed / 124 passed；1297 / 1299 tests passed | Claude doctor inventory 仍锁旧计数 16，Brainstorm HTML authority 正则未允许 current source 的合法换行；失败保留于 `logs/unit-red.log`，随后修 source/test 而非弱化断言 |
| P2 final skill-entrypoint lint | pass, 313 files | 最终 source package entrypoint、public/internal delivery 与五宿主投射静态治理地板 |
| P2 final typecheck | pass, 184 files | 最终 CLI、scripts 与关键 JavaScript 语法地板 |
| P2 post-closeout docs focused replay | pass, 11 suites / 91 tests | 最后 9 项 P2 contracts、M-013 renderer parity、五宿主 projection、dispatch authority 与最终 Changelog 格式 |
| P2 final complete unit | pass, 126 suites / 1299 tests | 最后 9 项 P2、SF-11/M-013 遗留、doctor inventory、HTML authority、五宿主 projection 与全仓 unit contracts |
| P2 final smoke | pass, 1 suite / 5 tests | CLI help、preview、global profile 与 packed five-host runtime |
| P2 final integration | pass, 6 suites / 21 tests；1 conditional suite / 2 tests skipped | five-host init、workspace graph、Qoder lifecycle 与 plan closeout integration |
| P2 final eval fixtures | pass, 6 suites / 78 tests | current eval/replay fixture contracts |
| P2 final build | pass, 684 package files | `npm pack --dry-run` 最终 package surface |
| P2 final diff check | pass | current source/docs/test working-tree whitespace floor |
| SF-24-SF-26 P3 closure RED | expected fail, 2 suites；3 failed / 30 passed | 旧 source 分别保留 Deployment activation 扩张、validator required-context 冲突与 LFG full-suite 过度声明；失败保留于当前 P3 run root |
| SF-24-SF-26 focused replay | pass, 2 suites / 33 tests | risky migration-artifact activation、worker no-self-invocation、optional validator context 与 Simplify verification ownership contracts |
| P3 inline simplify/adversarial scan | pass, no remaining actionable finding | reuse/quality/efficiency 三镜无重构项；对抗性复核补强真实 `When to Use` section、validator 空字段 prompt body、LFG→Simplify 双 source contract，并修正本文件仍描述 P2 overlay 的快照漂移；`dispatch_authorization_missing`，不冒充 independent review |
| P3 final skill-entrypoint lint | pass, 313 files | 最终 source package entrypoint 与 governance 静态地板 |
| P3 final typecheck | pass, 184 files | 最终 CLI、scripts 与关键 JavaScript 语法地板 |
| P3 final complete unit | pass, 126 suites / 1302 tests | SF-24/SF-25/SF-26 合同与全仓 unit regression |
| P3 final smoke | pass, 1 suite / 5 tests | CLI help、preview、global profile 与 packed five-host runtime |
| P3 final integration | pass, 6 suites / 21 tests；1 conditional suite / 2 tests skipped | five-host init、workspace graph、Qoder lifecycle 与 plan closeout integration |
| P3 final eval fixtures | pass, 6 suites / 78 tests | current eval/replay fixture contracts |
| P3 final build | pass, 684 package files | `npm pack --dry-run` 最终 package surface |
| `npm run test:unit` after SF-06 adversarial repair | pass, 125 suites / 1274 tests | complete unit regression；包含 SF-03 config consumer、SF-04 task-pack consumer、SF-10 artifact-map、SF-06 suppress/advisory precedence、active replay manifest 与全仓 unit contracts |
| `npm run test:unit` after final SF-01/SF-27 repair | pass, 125 suites / 1277 tests | complete unit regression；新增 Proof direct-name/internal-route separation 与 pre-gate dispatch guard |
| `npm run test:unit` after SF-11 repair | pass, 125 suites / 1280 tests | complete unit regression；包含 HTML renderer/Brainstorm review contract 与更新后的 active requirements-clarification source pin |
| `npm run test:unit` after SF-12/SF-18/SF-13 repair | pass, 125 suites / 1284 tests | complete unit regression；新增 Universal Proof materialization、terminal/handoff 与 tracker source/five-host projection parity contracts |
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

SF-11 的两组新合同先在旧 renderer/handoff 上按预期 RED（2 suites；3 failed / 8 passed），随后三份 renderer、Brainstorm handoff 与既有 doc-review/Plan owner 对齐后转为 GREEN。第一次全量 unit 随即被 active requirements-clarification replay 的旧 handoff SHA pin 确定性阻断（1 failed / 1279 passed）；只刷新该唯一 source pin 后，focused eval replay 与完整 unit 分别转为 2 suites / 15 tests、125 suites / 1280 tests 全绿。该证据证明 current source 与 frozen replay freshness 对齐，不证明真实 host 菜单、persona dispatch 或 HTML field review outcome。

最后 9 项 P2 初次 source 修复后，对抗性收口没有直接接受“9 tests green”作为充分证据。Current-source scan 发现 SF-11 仍在 shared HTML renderer 中把 requirements-only artifact 写成 `spec-work` 当前 consumer，edge ledger 自身也保留 `M-013 drift retained (P2)`；SF-14 closure test 又因读取不存在的 `## Consumers` heading 而在空字符串上 false green。随后聚焦复跑还以 1 failed / 84 passed 暴露 SF-23 projection test 错误要求 Cursor 保留其 adapter 明确不支持的 `allowed-tools` frontmatter。最终修复保持 renderer 单一 owner，以 artifact-kind condition 收窄 Work consumer；SF-14 test 先要求真实 `### Downstream Consumers` section 非空；SF-23 test 分离 source tool authority 与 host projection，Cursor 验证 lossy frontmatter 后仍保留 user entry、authority body 和 `disable-model-invocation`，其余四宿主保留 tool list。最终 10 suites / 89 tests 转绿。该证据证明 source/projection contract，不证明真实宿主工具可调用或 GitHub/Xcode field outcome。

最后 3 项 P3 先以 2 suites / 3 failed / 30 passed 证明旧 contract 漂移，再以最小 owner 内修复转为 2 suites / 33 tests。对抗性复核没有只依赖新增字符串：Deployment test 必须读取非空的真实 `## When to Use This Agent` section 并同时证明双条件 gate、禁止 self-invocation 与宽触发负例；validator 在变量表和实际 prompt body 两处都声明空字段继续从 diff/cited code 验证；LFG test 同时读取 `spec-simplify-code` source，证明 full-project typecheck/lint、changed-path scoped tests、wide-impact broadening 和 runner-no-scope full-suite fallback 与 consumer 文案一致。该证据止于 current source、合同测试与完整回归，不证明真实 deployment checklist 质量、validator recall/precision、host-loader 或 field outcome。

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
| HTML requirements review | HTML must receive the same structural/semantic doc review while remaining zero-write；forbid hiding the option、Markdown mutation paths or plan-specific renderer prose | three renderers declare report-only `spec-doc-review` with `html-artifact` / `fixes_applied: 0`；Brainstorm exposes review in both formats and passes `mutation:report-only` for HTML；Ideate renderer has no `5.3.8` consumer leak | working-tree source + focused RED/GREEN replay；SF-11 closed at `source-contract-confirmed` |
| Universal Proof publish | Proof must consume an existing local Markdown file；forbid chat-only/inline reconstruction and losing the source on publish failure | Brainstorm/Plan Proof-only branches materialize and verify run-local Markdown before `spec-proof`；Save+Proof publishes the exact saved file；failure retains the concrete path | working-tree source + focused RED/GREEN replay；SF-12 closed at `source-contract-confirmed` |
| tracker-defer owner | one normative owner；forbid code-review filing、guessed temp paths and session-temp durable links | Work is named canonical owner；LFG copy is byte-identical for host packaging；source and five-host projection parity pass | working-tree source + focused parity/projection contracts；SF-18 closed at `projection-contract-confirmed` |
| Universal Ideate terminal handoff | forbid direct ideate→plan or automatic implementation chain；allow user-explicit Plan only from Brainstorm wrap-up | Ideate hands only to Brainstorm；explicit Create a plan enters universal/knowledge-work Plan；Universal Plan does not offer Work | working-tree source + focused terminal/handoff contract；SF-13 closed at `source-contract-confirmed` |
| dogfood/polish exit authority | branch scope, local fix, commit and landing must have separate explicit basis | four run-local facts defined; branch/PR selector and `done` do not authorize checkout/commit; uncommitted fallback preserved | working-tree source + focused contracts；SF-07 closed |
| spec-work artifact map | user map must match current producer integration flag, evidence fields and reader boundary | map distinguishes integrated true/false, durable-trigger reasons, v1/v2 compatibility, v2 direct evidence fields and explicit source-owned reader; no implicit workflow consumer is claimed | working-tree source/docs contract + focused RED/GREEN replay；SF-10 closed at `source/docs-contract-confirmed` |
| generic dispatch | explicit authorization required; forbid route/mode/permission/approved-spec-as-dispatch authorization | working-tree matrix is 18 dispatching / 18 qualified / 0 package-local gap；code-review trivial-PR pre-check is inline and profile dispatch remains after Stage 1c；this run itself used inline fallback | working-tree source + focused contracts + inline order audit；SF-27 closed，independent outcome not_run |

## 5. Counter-evidence and limitations

- `spec-commit`、`spec-commit-push-pr`、`spec-proof`、`spec-test-browser` 与 `spec-worktree` 作为 internal assets 投射；`spec-test-xcode`、`spec-resolve-pr-feedback` 现作为 user-only standalone skill 进入 projection/init plan。两者都没有真实 host loader/invocation outcome，后者也没有真实 GitHub mutation evidence。
- CodeGraph was used only to orient source/test locations. Its output is provider-untrusted and does not support relation or completion claims.
- No clean-session host loader/helper invocation test, fresh-source semantic dispatch, real `agent-browser` navigation, external provider call, CI/merge/release, or field outcome was run.
- SF-02 tests prove field shape and workflow invocation only. They do not prove that a listed source is credible/reachable or that an invalidation condition is semantically sufficient; those remain LLM/human judgments.
- SF-03 tests prove source/template/consumer consistency only. They do not prove fresh-session host loading or real `.spec-first/config.local.yaml` behavior.
- SF-04 tests prove classification、source/producer authority、focused contract 和 fixture shape；它们不证明 persona finding 的语义正确性、独立上下文覆盖或真实 host invocation。当前 `dispatch_authorization_missing`，因此只能声明 inline adversarial coverage。
- SF-10 contract test proves map/schema/producer/read-prune wording alignment and rejects the retired false-only, graph-shaped and implicit-consumer claims；它不证明真实用户阅读、跨宿主渲染或 workflow 自动消费。
- SF-06 tests prove prompt precedence and planted-case shape only；它们不证明 fresh-session maintainability persona 的实际 finding recall、precision 或 host behavior。当前 `dispatch_authorization_missing`，因此只声明 inline adversarial coverage。
- SF-11 tests prove renderer/handoff/doc-review source-contract consistency and replay freshness only；它们不证明 fresh-session host menu、独立 persona review、HTML browser rendering 或 field outcome。当前 `dispatch_authorization_missing`，因此只声明 inline diff/adversarial scan。
- SF-12 tests prove local-file materialization and handoff wording only；它们不证明真实 Proof API publish、share URL 或跨宿主 temp filesystem outcome。
- SF-18 tests prove source/runtime projection parity and authority wording only；它们不证明真实 tracker detection、ticket creation、PR-body/fallback-file durability 或跨会话 continuation。
- SF-13 tests prove terminal/handoff source consistency only；它们不证明真实 host menu interaction或 universal plan field outcome。
- Generated `.agents/skills/`, `.claude/`, `.codex/`, `.cursor/`, `.kiro/`, and `.qoder/` mirrors were not read as audit source and were not modified.
- The original audit artifact remains a knowledge-work deliverable；2026-07-20 的 SF-03/SF-04/SF-10/SF-06、最终 SF-01/SF-27、SF-11 与 SF-24-SF-26 修复均已进入 `current_head_at_calibration`。这些历史修复记录不授权新的 plan lifecycle mutation、commit、push 或 PR。
