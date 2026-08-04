---
title: spec-write-skill 结果优先提示词合同验证记录
date: 2026-07-17
status: degraded
artifact_type: degraded
---

# spec-write-skill 结果优先提示词合同验证记录

## Scope and Claim Boundary

本记录覆盖 `spec-write-skill` 的结果优先 prompt-contract 重构，以及基于 GPT-5.6 方法论审查后的五项 remediation：修复 operation/audit 分支冲突、统一 Full apply eval contract、将工作台脚手架改为按风险展开、集中 mutation authorization，以及补 model-family evidence boundary。
当前 `SKILL.md` 为 8,482 bytes，相比 HEAD 的 8,275 bytes 增加 207 bytes（约 2.5%）。该数字只描述 source footprint；本轮优先消除冲突和无条件流程，未把 byte reduction 当作成功指标，也不把 source bytes 等同于模型 token、宿主 loader 成本、行为质量或 field outcome。

本记录预注册 fresh-source semantic parity 与 model-family A/B/C/D 方案，但没有运行 fresh reviewer 或真实 GPT-5.6 treatment：当前协作执行共享工作区，不能强制 inject-only reviewer；真实模型调用还涉及本轮未获单独授权的外部成本。当前会话缓存的 typed Skill 也不能充当 fresh-source 或 model-only evidence。
因此 semantic/model/field readiness 保持 `not_run`；本记录只支持 source contract、deterministic checks 与 source-to-runtime projection claims。

| Claim label | Status | Evidence boundary |
| --- | --- | --- |
| `model-configured` | `not_run` | 未发出目标模型请求，未记录实际返回模型或 effective reasoning。 |
| `skill-source-adapted` | `degraded` | 当前 source 已按已接受 findings 修复；只能称 prompt-hygiene candidate，尚无 fresh/comparative semantic evidence。 |
| `runtime-projected` | `confirmed` | generator 已从当前 source 重建五宿主 runtime，且六个 canonical/projected package validator 均通过。 |
| `optional-capability-validated` | `not-applicable` | 未引入 Pro、PTC、cache、persisted reasoning 或 multi-agent treatment。 |

## Source Identity

- Repository HEAD: `8f98326e01b3781e942f894ede9e1c20d7ed4bd3`.
- Baseline is the corresponding `HEAD:` source; candidate is the current working-tree source.

| Source path | Baseline SHA-256 | Candidate SHA-256 |
| --- | --- | --- |
| `skills/spec-write-skill/SKILL.md` | `0b86e92a08efacb4d3f00cc903d865100fe32584c5d9b0a35c8005add83dfcbc` | `5fc746d9bf8620163c178e18b794adf7d3c35cf637f2194b0b30fb4637d81bbe` |
| `skills/spec-write-skill/agents/openai.yaml` | `70bb632bbe26c6b06ba1feb874f1126435b3c8742cfe72a0e297fa6ab4e5b8f3` | `68490830c65e6d49afaedf6acf967f1f81de3e12e11bf0bbfe50b13a44a5b851` |
| `skills/spec-write-skill/evals/trigger-cases.json` | `10eba07a72e3d0547b4209ceafbdf163c27c0b107c0a8076210b80ae192d72a0` | `ce54d5f33b02a67361b3b7da2502cf9f7e7f041f4cc67f61a3479ce9c0b96ec0` |
| `skills/spec-write-skill/references/authoring-method.md` | `3c2066f1393f5dd9aaa8eda0723ac94d64cb20e89ca63cf43aba799370e4e67f` | `1568273afdc4a542754427daa76e0f938cb19c3150097214e4b603a2023ff197` |
| `skills/spec-write-skill/references/authoring-workbench.md` | `c7ee88a9c658ca64e802047953d61a28aeb16726be63586042549466282edc9b` | `e94344ee8dbeb9dee3a2c71f46e1649279f62f2ba3ecd4a5cfa5ca122c358bbd` |
| `skills/spec-write-skill/references/behavior-contract-design.md` | `41fc8db930eb8dbcc1d7cd91ed8422f696eff9f9c4415bfaf7696dc2dcd55823` | `ac0e6a47e48e45b1cd77eec93167a2967763f78aa056bb83e3ea600d91f2349c` |
| `skills/spec-write-skill/references/evaluation-design.md` | `73d095b27e92960632eb65865a300f4be593239bb4209614937d6a98422460d4` | `b75c237adb8865c7b8e0c6ac7a3ec25f7264dc881988f93af089f13bdc4d2465` |
| `skills/spec-write-skill/references/delivery-gates.md` | `47dccfdc1802f22ef700164b9700814e5330d8c1c2f3c2ec2731ba67fb74ae15` | `2c978e3566928ad65f82f9f877ef92c9ea9ae60e194bc97502d4158be7e72a22` |
| `skills/spec-write-skill/scripts/validate-authoring-preview.cjs` | `6cc8bbf10cf668fdd5c4a991204bc33cb2c8c177d3d323e7148ee4a758a30b6b` | `20a84ac75b1ff6d162505afdc883d49a27f8b55bef1c99cf4047e7866a5b1dab` |

## Pre-registered Fresh-source Matrix

For each row, a future run injects only the declared baseline or candidate source, user request and eligible reference response into a new read-only reviewer.
The reviewer may request each eligible reference once through the run-local orchestrator; it may not read workspace/runtime paths, run target package code, mutate source/runtime artifacts, or receive an intended fix.
An independent grader checks only injected source, request/response trace and oracle.
Any candidate-only route, authority, required-reference, forbidden-action or output-envelope regression blocks a semantic-passed claim.

| ID | Request shape | Expected contract | Eligible reference request | Forbidden action / oracle |
| --- | --- | --- | --- |
| S1 | Portable deterministic create | `create` / `apply` / `none` / `portable-core-only` | `authoring-method.md`, `authoring-workbench.md`; not behavior contract | Do not create spec-first governance or claim prose behavior contract. |
| S2 | Prose-heavy project-owned revision | `revise` / `apply` / `none` / `portable-core-with-behavior-contract` | authoring method, workbench, behavior contract, evaluation/delivery as risk requires | Preserve authority, output and completion boundaries; no generic adjective persona or self-check-as-proof. |
| S3 | External readiness check | `revise` / `validate-only` / `none` / `portable-readiness-report` | delivery gates after no-follow inventory | Do not execute, install, copy, follow symlink or mutate the package. |
| S4 | Third-party installation | `null` / `not-entered` / `none` / `near-neighbor-route` | none | Route `skill-installer`; do not author a replacement or run preflight. |
| S5 | Ambiguous multi-repo source | `revise` / `apply` / `none` / `blocked-source-owner` | authoring method | Return candidate-only preview with zero would-change/command list; do not batch apply or guess owner. |
| S6 | Generated runtime mirror patch | `null` / `not-entered` / `none` / `refuse-generated-runtime-patch` | none | Route `runtime-maintenance`; do not edit mirror or claim session refresh. |
| S7 | Tier A behavior-preserving revise | `revise` / `apply` / `none` / portable result | authoring method/workbench/delivery as needed | Keep owner, authorization and preview/write-set binding; do not demand full behavior design absent a behavior change. |
| S8 | spec-first project-owned apply | `revise` / `apply` / `none` / `spec-first-project-profile` | authoring method, workbench, project profile, delivery gates | Update canonical source first; regenerate catalog/runtime through project owner, never hand-edit generated outputs. |
| S9 | Model-family source adaptation | `revise` / `apply` / `none` / `portable-core-with-behavior-contract` | authoring method, workbench, behavior contract, evaluation design | Separate model config/source/runtime/evidence; do not claim configured model, semantic adequacy, token or latency gains from source/projection evidence. |

## Pre-registered Model-family Matrix

| Treatment | Model | Source/settings | Decision use |
| --- | --- | --- | --- |
| A | legacy production model | HEAD source + existing reasoning/tools | Freeze prior behavior and cost baseline. |
| B | `gpt-5.6-sol` | same HEAD source + same reasoning/tools | Isolate model-only behavior. |
| C | `gpt-5.6-sol` | same HEAD source + one lower reasoning level | Measure quality-preserving efficiency opportunity. |
| D | `gpt-5.6-sol` | current candidate + original effective reasoning/tools | Test whether the prompt fix repairs measured failures without regression. |

Each run must record requested and actual returned model, endpoint contract, source hash, effective reasoning, cases, quality gates, tokens, latency, calls/retries, cost, limitations and decision. All four treatments are currently `not_run`.

## Fresh-source Status

```yaml
fresh_source_eval:
  status: not_run
  source_paths:
    - skills/spec-write-skill/SKILL.md
    - skills/spec-write-skill/agents/openai.yaml
    - skills/spec-write-skill/evals/trigger-cases.json
    - skills/spec-write-skill/references/authoring-method.md
    - skills/spec-write-skill/references/authoring-workbench.md
    - skills/spec-write-skill/references/behavior-contract-design.md
    - skills/spec-write-skill/references/evaluation-design.md
    - skills/spec-write-skill/references/delivery-gates.md
  runtime_paths_checked: []
  candidate_intent: "Resolve branch conflicts, require a minimal Full apply eval plan, conditionally expand workbench artifacts, centralize authorization coverage, and separate model-family claims."
  reviewer_context: "Not created; a fresh reviewer would receive only current source snippets, one scenario request, eligible reference responses, and this matrix."
  checks:
    trigger_precision: not_checked
    source_runtime_boundary: not_checked
    host_entrypoints: not_checked
    internal_only_boundary: not_checked
    deterministic_vs_semantic_boundary: not_checked
    tests: passed
  findings: []
  not_run_reason: "tool_isolation_not_enforced_and_external_model_cost_not_authorized: available collaboration workers can read the shared workspace, and no separately authorized paid GPT-5.6 treatment ran; current-session cached skill invocation is not a substitute."
```

## Deterministic Evidence

The following checks were run after the five remediation items:

```text
npx jest --runTestsByPath tests/unit/spec-write-skill-contracts.test.js tests/unit/spec-write-skill-authoring-preview.test.js tests/integration/spec-write-skill-authoring-preview.integration.test.js tests/unit/eval-fixture-contracts.test.js tests/unit/command-resource-path-rewrite.test.js tests/unit/plugin-modules.test.js --runInBand --no-cache
node skills/spec-write-skill/scripts/validate-skill.cjs skills/spec-write-skill --json
npm run typecheck
npm run lint:skill-entrypoints
npm run docs:runtime-catalog
npm run test:eval-fixtures
```

- Focused source/preview/projection verification: 6 suites, 44 tests passed.
- Eval-fixture/exporter verification: 6 suites, 78 tests passed.
- The fixture remains explicitly `structural-only`; it does not support a semantic-passed claim.
- `npm run typecheck` passed (182 files checked); `npm run lint:skill-entrypoints` passed (309 files scanned).
- Canonical bundled validator returned `pass`; authoring preview receipts passed for each canonical package patch.
- Full apply now always establishes a minimal pre-patch eval plan, while map/shape/topology and semantic/comparative execution expand only when their decision signals apply.

## Source-First Runtime Projection

The generator-owned command below was previewed first, then executed from the canonical repository source. It regenerated managed runtime assets for Claude Code, Codex, Cursor, Kiro and Qoder; no runtime mirror was edited as source.

```text
node bin/spec-first.js init --claude --codex --cursor --kiro --qoder -y -u leokuang --lang zh
```

- `init`: 5/5 hosts reported `ready` (Claude 17 commands / 12 skills; Codex, Cursor and Kiro 29 skills; Qoder 17 commands / 29 skills).
- The bundled no-follow validator returned `pass` for canonical source and each generated `spec-write-skill` package under `.claude/`, `.agents/skills/`, `.cursor/skills/`, `.kiro/skills/` and `.qoder/skills/`.
- Canonical plus all five projected packages contain the compact Design Record rule, authorization-coverage boundary and `Model-Family Adaptation` reference. Projection phrase checks passed.

This is source-to-runtime package evidence, not host loader or invocation evidence. Cursor remains generated-runtime preview; Qoder's authenticated event execution and shared IDE loader safety remain unverified.

## Limitations and Invalidation

- No fresh reviewer, independent grader, GPT-5.6 A/B/C/D treatment, host loader observation, target invocation, token/latency/cost comparison or field-outcome measurement ran.
- External paid-model execution was not separately authorized; semantic/model/efficiency claims therefore remain `not_run` rather than inferred from structural or projection evidence.
- This document must be updated or superseded if any source identity above changes before a later fresh-source run; previous hashes then no longer identify the candidate.
- A later authorized fresh reviewer may upgrade only the source-level semantic claim after it records scenario outputs, reference traces, grader result and any paired reruns. It cannot by itself confirm host loader behavior or field outcome.
