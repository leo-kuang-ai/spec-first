---
title: Skill 关系审查当前快照验证记录
doc_role: audit-evidence
review_date: 2026-07-18
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 3e07fb20cd790eeabe10e409170f202ae195e78b
working_tree_calibrated_at: 2026-07-20
working_tree_overlay: uncommitted-source-repair
---

# Validation — current source refresh

## 1. Pass 0 snapshot

| Fact | Result |
| --- | --- |
| Original audit source HEAD | `0c1b358605c534db50321a5252e5e6d356dbcefb` |
| SF-02 calibration HEAD | `3e07fb20cd790eeabe10e409170f202ae195e78b` |
| Branch | `leo-2026-07-16-plan-update` |
| Dirty state before audit artifact write | clean |
| Current SF-02 repair overlay | uncommitted working tree; `current_head_at_calibration` 不包含本轮修复 |
| Package version | `1.13.2` |
| Baseline HEAD | `7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64` |
| Delta to baseline | 4 commits; 30 changed canonical Skill sources, including 3 new references |

## 2. Deterministic frozen-source inventory

The inventory read `skills/<governed skill>/SKILL.md` and `references/**` only. A case-insensitive skill-name token boundary produced file-target supports; it does not classify semantic role by itself. 下表的 manifest/pair hash 绑定 `source_head` 冻结快照；working-tree mutation-authority overlay 只通过后续 focused/full tests 校准，本轮未重算整张关系图 manifest。

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
| `npm run lint:skill-entrypoints` | pass, 312 files scanned | public/internal entrypoint governance |
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
| SF-01 negative-delivery replay | pass, 2 suites / 25 tests | 两个 load-bearing helper delivered；其余 3 个 governance-only record 在 plan 与真实 sandbox init 中均未投射 |
| SF-02 promotion contract replay | pass, 2 suites / 43 tests | schema/template/guide/validator byte parity；Knowledge Harness consumer consistency；Full、Lightweight、Refresh Replace/Consolidate gate 与 destructive deletion ordering；完整正例、缺失/空值/转义空白/非字符串 scalar/错误类型/普通及 YAML-equivalent 重复键负例；binary/date/YAML 1.1 implicit-type false-pass 防护；legacy default compatibility 与 UTF-8 locale |
| SF-02 inline adversarial diff scan | pass, no remaining actionable finding | 检查 promotion bypass、false-pass input、legacy regression、package parity、mechanical/semantic ownership 与 generated-runtime boundary；先发现并修复 Consolidate delete ordering、YAML-equivalent duplicate key 和 common-parser implicit scalar 三类缺口。`dispatch_authorization_missing`，independent persona、validator 与 cross-model review 均未运行 |
| `npm run test:unit` after SF-02 adversarial repair | pass, 124 suites / 1263 tests | complete unit regression；包含 promotion gate 新增负例、现有 active replay manifest 与全仓 unit contracts |
| `npm run test:smoke` | pass, 1 suite / 5 tests | CLI help、preview、global profile 与 packed five-host runtime |
| `npm run test:integration` | pass, 6 suites / 21 tests；1 conditional suite / 2 tests skipped | five-host init、workspace graph、Qoder lifecycle 与 plan closeout integration |
| `npm run test:eval-fixtures` | pass, 6 suites / 78 tests | current eval/replay fixture contracts |
| `npm run build` | pass, 681 package files | `npm pack --dry-run` package surface，包含两个 helper 的完整 source package |
| `git diff --check` after final calibration | pass | whitespace floor for current source/docs/test diff |

一次早期 focused 命令错误引用了仓库中不存在的 `tests/unit/runtime-capability-catalog.test.js`，因此以 ENOENT 失败；该结果没有被改写为通过。随后改用当前仓库真实存在的 catalog/shipping/entrypoint 合同测试，并在对抗性修复后加入 LFG authority handoff 覆盖，形成上表 9-suite / 65-test 的最终 focused evidence。

The passing config-consumer test is counter-evidence only for the currently encoded rule: its expected assertion still says `plan_output` / `brainstorm_output` are reserved, which is exactly SF-03's source/consumer contradiction. A green test never upgrades contradictory prose to correct behavior.

## 4. Current-source semantic scenarios

No generic subagent dispatch was authorized. All rows are current-source inline checks, not fresh-source independent evaluations.

| Scenario | Expected / forbidden | Observed current source | Evidence level |
| --- | --- | --- | --- |
| autonomous brainstorm handoff | route `spec-lfg`; forbid bare `lfg` | exact skill resolution and absolute plan payload specified | current source + focused contracts |
| LFG browser applicability | backend/docs can be `not_applicable`; UI requires explicit loopback origin | statuses/reasons and caller-owned server defined; effect gate blocks sensitive flow | current source + focused contracts |
| work semantic plan review | byte-preserving JSON envelope; forbid plan mutation by reviewer | before/after hash, `mutation:report-only`, invalid/P0/P1 block rules specified | current source + focused contracts |
| knowledge promotion | new/materially rewritten learning requires recoverable provenance and invalidation; forbid legacy bulk breakage or refresh successor/consolidation bypass | both packages share promotion fields and validator; Full/Lightweight/Replace/Consolidate material writes use `--promotion`; default mode remains parser-safety-only | working-tree source + focused contracts；SF-02 closed at `source-contract-confirmed` |
| task-pack review | unique pack intake; forbid treating pack as generic plan | target still lacks task-pack type/lens | current source drift |
| config consumer | active plan/brainstorm output config; forbid calling it reserved | consumer reads active key while setup/template/test call it reserved | current source drift |
| internal helper delivery | direct caller edge must resolve or carry an equivalent fallback；forbid treating every name mention or mode token as invocation/landing authority | LFG commit-push-pr 与 commit-authorized dogfood commit target 已作为 internal-only package 五宿主投射；LFG 传递 entry-derived commit/landing facts并声明 `mode:pipeline` 不授权；spec-work 仍只有 conditional named references | working-tree source + focused projection contracts；SF-01 closed at `projection_confirmed` |
| code-review mutation policy | classification must not grant apply authority; ordinary review report-only; mode:agent caller-owned apply | `autofix_class` is classification-only and run-local `mutation_policy` is authoritative | working-tree source + focused contracts；SF-05 closed |
| maintainability shared spine | persona-defined mechanical threshold must survive generic style suppression | 1000-line crossing conflicts with uncodified-long-file suppress；thin-wrapper/duplicate-helper suppression not proven | current source drift；SF-06 wording narrowed |
| dogfood/polish exit authority | branch scope, local fix, commit and landing must have separate explicit basis | four run-local facts defined; branch/PR selector and `done` do not authorize checkout/commit; uncommitted fallback preserved | working-tree source + focused contracts；SF-07 closed |
| spec-work artifact map | user map must match current producer integration flag | map says `workflow_integrated=false`; schema and closeout producer set true on durable trigger | current source drift |
| generic dispatch | explicit authorization required; forbid route/mode/permission/approved-spec-as-dispatch authorization | working-tree matrix is 18 dispatching / 18 qualified / 0 package-local gap; this run itself used inline fallback | working-tree source + focused contracts；SF-27 closed，independent outcome not_run |

## 5. Counter-evidence and limitations

- `spec-commit`、`spec-commit-push-pr`、`spec-test-browser` 与 `spec-worktree` 现在作为 internal assets 投射；这不证明真实 host loader/invocation，也不把 `spec-proof`、`spec-test-xcode`、`spec-resolve-pr-feedback` 从 governance-only 提升为 delivered。
- CodeGraph was used only to orient source/test locations. Its output is provider-untrusted and does not support relation or completion claims.
- No clean-session host loader/helper invocation test, fresh-source semantic dispatch, real `agent-browser` navigation, external provider call, CI/merge/release, or field outcome was run.
- SF-02 tests prove field shape and workflow invocation only. They do not prove that a listed source is credible/reachable or that an invalidation condition is semantically sufficient; those remain LLM/human judgments.
- Generated `.agents/skills/`, `.claude/`, `.codex/`, `.cursor/`, `.kiro/`, and `.qoder/` mirrors were not read as audit source and were not modified.
- The original audit artifact remains a knowledge-work deliverable; the 2026-07-20 SF-02 overlay is an authorized local source repair. It does not authorize plan lifecycle mutation, commit, push, or PR, and it remains uncommitted.
