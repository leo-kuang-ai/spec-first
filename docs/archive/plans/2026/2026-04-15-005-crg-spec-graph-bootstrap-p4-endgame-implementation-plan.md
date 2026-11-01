---
title: "CRG + spec-graph-bootstrap P4 Endgame Implementation Plan"
type: archive
status: superseded
created: 2026-04-15
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# CRG + spec-graph-bootstrap P4 Endgame Implementation Plan

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成 `CRG + spec-graph-bootstrap` 的 `P4` 终局收口，把当前“模块已存在但系统未完全生效”的状态，升级为“主链统一、质量门闭环、检索增强受评测保护、治理具备最小可运行闭环”的工程系统。

**Architecture:** 本计划严格以 [2026-04-15-004-crg-spec-graph-bootstrap-endgame-gap-analysis.md](/Users/kuang/xiaobu/spec-first/docs/plans/2026-04-15-004-crg-spec-graph-bootstrap-endgame-gap-analysis.md) 为唯一架构基线，执行顺序固定为 `P4-A 主链收口 -> P4-B Eval & Gate -> P4-C Retrieval v2 -> P4-D Governance & Workspace`。实现策略坚持“先收主链、再立质量门、再做算法增强、最后补治理扩展”，避免在系统尚未闭环时提前进入高不确定度设计。

**Tech Stack:** Node.js CommonJS、Jest、shell e2e、JSON/YAML 契约、SQLite CRG 存储、现有 `spec-first` CLI / skills / benchmark 体系

---

## 1. 计划范围

本计划是 `P4` 的最终开发实施文档，只覆盖本轮必须完成的系统化能力，不承载无限外延的研究路线。

本轮必须交付的范围如下：

1. 统一 `spec-graph-bootstrap` 主链编排，把 compiler 子模块收口成默认执行路径。
2. 把 `freshness / lint / contradictions` 接入默认产物链，并进入 workflow 消费视野。
3. 把 `workflow telemetry` 接入 `spec-plan / spec-work / spec-code-review` 默认运行链。
4. 把 `review / repo-qa / context-efficiency / regression` 从脚本升级为标准 gate。
5. 在 gate 保护下，对 `src/crg` 做最小但有效的 `Retrieval v2` 增强。
6. 交付治理最小闭环，包括 ownership registry、review queue lifecycle、workspace integration v1。
7. 建立 `bootstrap -> workflow consumption -> benchmark/regression` 的真实 e2e 主链闭环。

本计划完成后，系统必须满足 `004` 定义的最低成功指标：

- bootstrap 主链编排覆盖率 `100%`
- workflow telemetry 覆盖率 `100%`
- benchmark gate 覆盖率 `100%`
- review benchmark average hit rate `>= 0.75`
- repo QA average hit rate `>= 0.70`
- context efficiency irrelevant ratio `<= 0.35`
- reference integration fixtures 中 fallback rate `<= 0.10`
- 存在真实 e2e 主链闭环

---

## 2. 非目标

以下内容本轮明确不进入默认交付范围：

- `verify` workflow 主链化
- vector recall / embedding index
- cross-encoder rerank
- learned ranking
- durable repo memory
- fact-level provenance graph
- 真正的 cross-repo symbol graph
- production-grade observability platform

说明：

- `verify` 在本轮只保留 reserved contract，不进入默认 consumer、benchmark、routing、regression 交付范围。
- 若后续要引入 `verify`，必须先补 consumer 定义、selected assets、benchmark cases、regression threshold，再进入单独 implementation plan。

---

## 3. 架构约束与反过度设计原则

### 3.1 必须遵守的实现原则

1. 先主链，后增强。任何新能力若未进入默认执行路径，不得宣称完成。
2. 先 gate，后算法。任何 Retrieval v2 增强，必须在 benchmark / regression 保护下推进。
3. 单一真源。产物 contract、workflow 消费约定、benchmark 口径必须一处定义，多处验证。
4. 可回退。新增主链逻辑必须支持 deterministic output、last-known-good 或等价的回退保护。
5. 最小闭环优先。治理与 workspace 只做本轮可验证的最小运行版，不做概念性扩展。

### 3.2 本轮不允许的设计误区

- 把“模块存在”误判为“系统完成”
- 把“脚本可跑”误判为“质量门成立”
- 在 gate 不稳定前升级复杂检索算法
- 在单仓主链未稳定前扩大 workspace 复杂度
- 把 must-have 与 research backlog 混写到同一交付层

---

## 4. 总体实施顺序与依赖

### 4.1 正确顺序

1. `P4-A 主链收口`
2. `P4-B Eval & Gate`
3. `P4-C Retrieval v2`
4. `P4-D Governance & Workspace`

### 4.2 依赖图

```text
P4-A 主链收口
  ├─ Task 22 统一 bootstrap orchestrator
  ├─ Task 23 freshness/lint/contradictions 接主链
  ├─ Task 24 workflow telemetry 接默认链
  └─ Task 25 bootstrap e2e / rollback / determinism
           ↓
P4-B Eval & Gate
  ├─ Task 26 扩 review benchmark
  ├─ Task 27 扩 repo QA / context-efficiency benchmark
  ├─ Task 28 接 package.json / CI gate
  └─ Task 29 baseline / drift 治理
           ↓
P4-C Retrieval v2
  ├─ Task 30 query planning / intent classification 最小版
  ├─ Task 31 lexical + graph fusion 强化
  ├─ Task 32 language-aware chunking v2 最小版
  └─ Task 33 retrieval delta 与 no-regression 验证
           ↓
P4-D Governance & Workspace
  ├─ Task 34 ownership registry 最小落地
  ├─ Task 35 review queue lifecycle 最小闭环
  ├─ Task 36 workspace integration v1
  └─ Task 37 workspace benchmark + 单仓不退化验证
```

### 4.3 执行纪律

- `Task 26-29` 未完成前，不得进入 `Task 30-33`
- `Task 30-33` 未完成前，不得扩大 `workspace` 范围
- `Task 34-37` 只能建立最小闭环，不得在本轮追加多仓复杂编排能力

---

## 5. P4-A 主链收口

### Task 22：统一 bootstrap orchestrator

**Goal:** 把 `compile-machine-artifacts / compile-human-assets / compile-routing / compile-minimal-context` 收口成统一 orchestrator，使 `spec-graph-bootstrap` 默认运行路径具有稳定、可解释、可测试的主链。

**Files:**
- Create: `src/bootstrap-compiler/orchestrator.js`
- Modify: `src/bootstrap-compiler/compile-machine-artifacts.js`
- Modify: `src/bootstrap-compiler/compile-human-assets.js`
- Modify: `src/bootstrap-compiler/compile-routing.js`
- Modify: `src/bootstrap-compiler/compile-minimal-context.js`
- Modify: `skills/spec-graph-bootstrap/SKILL.md`
- Test: `tests/unit/spec-graph-bootstrap-compiler.test.js`
- Test: `tests/unit/spec-graph-bootstrap-contracts.test.js`

**Patterns to follow:**
- 复用现有四段 compiler 模块，不重写已有事实提取逻辑。
- `SKILL.md` 中只保留阶段职责与 contract 说明，不再让路由顺序散落在自然语言描述中。
- 以 `.spec-first/workflows/bootstrap/<slug>/` 为唯一默认输出路径。

**Steps:**
1. 先在 `tests/unit/spec-graph-bootstrap-compiler.test.js` 写失败用例，约束 orchestrator 的执行顺序、失败行为、产物回写顺序。
2. 新建 `orchestrator.js`，统一编排四段 compiler，并返回结构化执行结果。
3. 把 `skills/spec-graph-bootstrap/SKILL.md` 改为显式引用 orchestrator contract，而不是隐式描述流程。
4. 让编译结果统一回写到 `artifact-manifest.json`，确保 machine / human / routing / minimal-context 都受同一执行 envelope 管控。
5. 运行 unit tests，确认主链 contract 成立。

**Test scenarios:**
- 正常执行时四段编译按固定顺序产出结果。
- 任一子阶段失败时，orchestrator 输出结构化错误，并阻止不完整产物被误标为成功。
- `artifact-manifest.json` 能反映各阶段产物状态与时间戳。
- `SKILL.md` 描述与代码 contract 不冲突。

**Verification:**
- `npx jest tests/unit/spec-graph-bootstrap-compiler.test.js --runInBand`
- `npx jest tests/unit/spec-graph-bootstrap-contracts.test.js --runInBand`

### Task 23：把 freshness / lint / contradictions 接入默认产物链

**Goal:** 让 `freshness / lint / contradictions` 从“存在的编译子模块”升级为默认主链产物，并进入 evaluator 与 workflow 的消费视野。

**Files:**
- Modify: `src/bootstrap-compiler/orchestrator.js`
- Modify: `src/bootstrap-compiler/freshness.js`
- Modify: `src/bootstrap-compiler/lint.js`
- Modify: `src/bootstrap-compiler/contradictions.js`
- Modify: `.spec-first/workflows/bootstrap/spec-first/freshness.json`
- Modify: `.spec-first/workflows/bootstrap/spec-first/lint-report.json`
- Modify: `.spec-first/workflows/bootstrap/spec-first/contradictions.json`
- Modify: `.spec-first/workflows/bootstrap/spec-first/artifact-manifest.json`
- Test: `tests/unit/stage0-freshness.test.js`
- Test: `tests/unit/spec-graph-bootstrap-contracts.test.js`

**Patterns to follow:**
- 不新增第二套 freshness / lint / contradictions contract。
- 所有状态必须通过 `artifact-manifest.json` 与 `context-routing.json` 被消费端发现。
- 对 stale 与 contradictions 采用“显式暴露 + 降级处理”，而不是静默忽略。

**Steps:**
1. 先补失败测试，明确 freshness/lint/contradictions 必须在默认主链执行后可见。
2. 调整三类编译器输出，让字段结构稳定、可被 evaluator 读取。
3. 在 `artifact-manifest.json` 中增加三类产物的存在性、版本、健康度信息。
4. 验证 stale / lint failure / contradictions 不会直接破坏主链，但会影响 selected assets 与 fallback reason。
5. 运行 unit tests，确认 contract 稳定。

**Test scenarios:**
- freshness stale 时产物存在，且 evaluator 能感知 stale 信号。
- lint 与 contradictions 结果存在时，review/work 路由可以优先读取。
- 缺少这些产物时，manifest 会显式报告不完整，而不是静默通过。

**Verification:**
- `npx jest tests/unit/stage0-freshness.test.js --runInBand`
- `npx jest tests/unit/spec-graph-bootstrap-contracts.test.js --runInBand`

### Task 24：把 workflow telemetry 接入默认运行链

**Goal:** 让 `spec-plan / spec-work / spec-code-review` 默认记录结构化 telemetry，形成真实消费闭环，而不是仅存在 helper。

**Files:**
- Modify: `src/context-routing/telemetry.js`
- Modify: `skills/spec-plan/SKILL.md`
- Modify: `skills/spec-work/SKILL.md`
- Modify: `skills/spec-code-review/SKILL.md`
- Test: `tests/unit/workflow-telemetry.test.js`
- Test: `tests/unit/workflow-stage0-consumption.test.js`

**Patterns to follow:**
- telemetry 必须记录 `stage / profile / selected_assets / fallback_reason / skipped_rules`。
- workflow 文档只描述默认行为，不复制实现细节。
- telemetry 先解决“记录完整”，本轮不做复杂 observability 平台。

**Steps:**
1. 先补失败测试，要求三个 workflow 默认写出最小 telemetry record。
2. 扩展 `telemetry.js`，使其支持统一 record schema 与 fallback 统计字段。
3. 修改三个 `SKILL.md`，把 evaluator 输出与 telemetry 写入描述为默认执行行为。
4. 验证 telemetry 不依赖手工开关，也不会污染无关流程。
5. 运行 workflow 与 telemetry 相关测试。

**Test scenarios:**
- `plan/work/review` 三条链都能产出最小 telemetry。
- fallback 与 skipped reason 会进入 record。
- selected assets 与实际 evaluator 输出一致。
- 缺少 minimal-context 或 freshness stale 时，telemetry 能正确反映原因。

**Verification:**
- `npx jest tests/unit/workflow-telemetry.test.js --runInBand`
- `npx jest tests/unit/workflow-stage0-consumption.test.js --runInBand`

### Task 25：建立 bootstrap integration + rollback / determinism 验证

**Goal:** 证明 bootstrap 主链是 deterministic、可回退、可端到端执行的，不再只靠单元测试证明模块存在。

**Files:**
- Create: `src/bootstrap-compiler/run-bootstrap.js`
- Create: `src/bootstrap-compiler/rollback.js`
- Create: `tests/e2e/spec-graph-bootstrap-mainline.sh`
- Modify: `tests/integration/e2e.sh`
- Modify: `tests/unit/spec-graph-bootstrap-compiler.test.js`
- Modify: `tests/unit/workflow-stage0-consumption.test.js`

**Patterns to follow:**
- 复用现有 `.spec-first/workflows/bootstrap/` 目录，不引入第二套运行目录。
- rollback 只保护 bootstrap 产物完整性，不与 `src/crg/generations/` 混成一套概念。
- determinism 以固定输入、固定输出文件集合与稳定排序为准。

**Steps:**
1. 先写 e2e 失败脚本，覆盖 `bootstrap -> evaluator consumption -> telemetry` 主链。
2. 实现 `run-bootstrap.js`，把 orchestrator 封装成可重复调用的统一入口。
3. 实现 `rollback.js`，在主链失败时恢复到最近一次健康产物快照。
4. 在 integration/e2e 中接入新脚本，验证 deterministic output 与 rollback 行为。
5. 补齐 unit/integration 断言，确保主链可复跑、可回退。

**Test scenarios:**
- 连续两次同输入执行，关键产物字段与顺序一致。
- 中途失败时，旧产物可恢复。
- workflow 读取 bootstrap 产物时不依赖临时状态。
- e2e 能完整覆盖 `bootstrap -> workflow consumption -> telemetry`。

**Verification:**
- `bash tests/e2e/spec-graph-bootstrap-mainline.sh`
- `bash tests/integration/e2e.sh`

---

## 6. P4-B Eval & Gate

### Task 26：扩 review benchmark 数据集

**Goal:** 把现有 review benchmark 从 smoke 级样例提升为能支持 gate 的最小有效数据集。

**Files:**
- Modify: `benchmarks/review/cases.json`
- Create: `benchmarks/review/fixtures/spec-first-review-hit-rate.json`
- Create: `benchmarks/review/fixtures/spec-first-review-fallback.json`
- Modify: `benchmarks/review/run-review-benchmark.js`
- Modify: `tests/unit/review-benchmark-smoke.test.js`

**Patterns to follow:**
- benchmark case 必须包含 changed files、expected evidence、expected tests、expected risk focus。
- fixture 设计优先覆盖真实失败模式，不追求样本数量虚高。
- 输出格式必须可被 `run-regression.js` 聚合。

**Steps:**
1. 先写失败测试，要求 review benchmark 至少覆盖 hit rate、irrelevant evidence、fallback 信号。
2. 扩充 `cases.json` 与 fixtures，覆盖 review-change、high-risk-modules、test-map 等核心资产。
3. 调整 benchmark runner，使输出字段与 regression 聚合要求一致。
4. 验证 runner 在 case 缺字段时显式失败。
5. 运行 benchmark smoke tests。

**Test scenarios:**
- 多 case 能正确汇总平均 hit rate。
- case 配置错误时 runner 失败且错误可定位。
- fallback 过高时输出风险提示。
- irrelevant evidence 可被显式统计。

**Verification:**
- `npx jest tests/unit/review-benchmark-smoke.test.js --runInBand`
- `node benchmarks/review/run-review-benchmark.js`

### Task 27：扩 repo QA / context-efficiency 数据集

**Goal:** 让 `repo QA` 与 `context-efficiency` 从示例脚本升级为可用于 gate 的最小评测集。

**Files:**
- Modify: `benchmarks/repo-qa/questions.json`
- Modify: `benchmarks/repo-qa/run-repo-qa.js`
- Modify: `benchmarks/context-efficiency/cases.json`
- Modify: `benchmarks/context-efficiency/run-context-efficiency.js`
- Modify: `tests/unit/repo-qa-benchmark-smoke.test.js`
- Modify: `tests/unit/context-efficiency-benchmark-smoke.test.js`

**Patterns to follow:**
- repo QA 问题必须覆盖结构理解、入口识别、测试面识别、风险识别。
- context-efficiency 必须显式统计 irrelevant ratio、missing evidence、fallback presence。
- 数据集设计以“支撑 gate 阈值”而不是“展示功能”。

**Steps:**
1. 先补失败测试，约束 repo QA 和 context-efficiency 输出结构。
2. 扩展 `questions.json` 与 `cases.json`，覆盖 plan/work/review 三类场景。
3. 调整两个 runner 的输出，使其可被 regression 聚合与比较。
4. 运行 smoke tests，确认结果稳定可重复。
5. 记录当前 baseline 值，为 Task 29 做准备。

**Test scenarios:**
- repo QA 能输出 average hit rate 与 missing answer 明细。
- context-efficiency 能输出 average irrelevant ratio 与 fallback 统计。
- case 缺字段时 runner 显式失败。
- 三类 workflow 场景至少各覆盖一组 benchmark case。

**Verification:**
- `npx jest tests/unit/repo-qa-benchmark-smoke.test.js --runInBand`
- `npx jest tests/unit/context-efficiency-benchmark-smoke.test.js --runInBand`
- `node benchmarks/repo-qa/run-repo-qa.js`
- `node benchmarks/context-efficiency/run-context-efficiency.js`

### Task 28：把 regression 接入 package.json 与 CI gate

**Goal:** 把 benchmark / regression 从“开发者可选脚本”升级为仓库标准 gate。

**Files:**
- Modify: `package.json`
- Create: `.github/workflows/crg-quality-gate.yml`
- Modify: `benchmarks/regression/run-regression.js`
- Modify: `tests/unit/regression-gate.test.js`

**Patterns to follow:**
- gate 触发范围至少覆盖 `src/crg/`、`src/context-routing/`、`src/bootstrap-compiler/`、`skills/spec-graph-bootstrap/`、`skills/spec-plan/`、`skills/spec-work/`、`skills/spec-code-review/`。
- CI 先保持最小稳定，不做复杂矩阵拆分。
- regression 输出必须与 baseline 对比结果直连。

**Steps:**
1. 先补失败测试，要求 `run-regression.js` 可聚合 review / repo QA / context-efficiency 三类结果。
2. 在 `package.json` 增加明确的 gate script。
3. 新建 `.github/workflows/crg-quality-gate.yml`，把 benchmark/regression 变成 PR gate。
4. 确认变更范围命中相关目录时，gate 会执行；无关目录变更不强行扩大成本。
5. 运行 unit tests 与本地 regression 验证。

**Test scenarios:**
- baseline 缺失时显式失败。
- 任一核心指标低于阈值时 gate 失败。
- package script 能在本地完整跑通 gate。
- GitHub Actions 定义文件能清晰表达触发范围与失败行为。

**Verification:**
- `npx jest tests/unit/regression-gate.test.js --runInBand`
- `node benchmarks/regression/run-regression.js`

### Task 29：建立 baseline 更新与 drift 治理

**Goal:** 防止 benchmark baseline 漂移失控，建立最小治理流程。

**Files:**
- Modify: `benchmarks/regression/baselines.json`
- Create: `scripts/update-crg-baselines.js`
- Create: `docs/09-业界借鉴/crg-benchmark-governance.md`
- Modify: `tests/unit/regression-gate.test.js`

**Patterns to follow:**
- baseline 更新必须显式执行，不得由测试静默覆盖。
- baseline 文档中必须说明更新条件、审批要求、可接受波动。
- benchmark 治理优先解决“可解释更新”，不做复杂平台化。

**Steps:**
1. 先补失败测试，要求 baseline 文件缺失、字段缺失、非法回写都显式失败。
2. 编写 `update-crg-baselines.js`，统一 baseline 更新入口。
3. 撰写 benchmark governance 文档，定义何时允许升降阈值。
4. 校验 regression runner 与 baseline 更新脚本之间的字段一致性。
5. 运行 regression tests，确认治理流程可执行。

**Test scenarios:**
- baseline 更新脚本只在显式执行时回写。
- baseline 字段与 runner 聚合字段不一致时失败。
- drift 超过阈值时 regression 明确报告失败项。
- governance 文档能覆盖 update trigger、审查人、记录要求。

**Verification:**
- `npx jest tests/unit/regression-gate.test.js --runInBand`
- `node scripts/update-crg-baselines.js --dry-run`

---

## 7. P4-C Retrieval v2

说明：

- 本阶段只能在 `P4-B` 完成后启动。
- 本阶段遵守“最小可验证增强”原则，不进入 vector / cross-encoder / learned ranking。
- 本阶段的目标不是做“业界最复杂检索”，而是在现有 gate 保护下实质提升 hit rate 与 context efficiency。

### Task 30：实现 query planning / intent classification 最小版

**Goal:** 在不引入复杂模型依赖的前提下，为 retrieval 增加轻量 query planning 与 intent classification。

**Files:**
- Create: `src/crg/retrieval/query-plan.js`
- Modify: `src/crg/retrieval/api.js`
- Modify: `src/crg/retrieval/profiles.js`
- Modify: `tests/unit/crg-retrieval.test.js`

**Patterns to follow:**
- 只做 rule-based 或 heuristic-based minimal planner。
- intent 至少覆盖 `plan / work / review / search` 四类。
- planner 输出必须可解释，可被 benchmark case 直接验证。

**Steps:**
1. 先在 `tests/unit/crg-retrieval.test.js` 写失败用例，定义不同意图下的 seed / expansion 差异。
2. 新建 `query-plan.js`，输出 intent、seed strategy、budget policy。
3. 在 `api.js` 中接入 query planning，让 retrieval profile 不再只有静态规则。
4. 调整 `profiles.js`，使不同场景使用不同 budget 与 asset preference。
5. 运行 retrieval unit tests，确认 planner 行为稳定。

**Test scenarios:**
- `review` 优先 changed files、high-risk modules、candidate tests。
- `plan` 优先 module map、entrypoints、integration surface。
- `work` 优先 impacted modules、test surface、recent changes。
- 未识别意图时安全回退到默认 profile。

**Verification:**
- `npx jest tests/unit/crg-retrieval.test.js --runInBand`

### Task 31：增强 lexical + graph fusion

**Goal:** 提升 retrieval 的命中率与排序质量，但保持实现可解释、可调试。

**Files:**
- Modify: `src/crg/retrieval/seed.js`
- Modify: `src/crg/retrieval/expand.js`
- Modify: `src/crg/retrieval/rerank.js`
- Modify: `src/crg/retrieval/api.js`
- Modify: `tests/unit/crg-retrieval.test.js`

**Patterns to follow:**
- score fusion 只在 lexical、graph distance、changed-file proximity、test affinity 几类信号上做最小组合。
- 不引入黑盒权重系统。
- 所有分数构成必须可打印、可审计。

**Steps:**
1. 先补失败测试，约束 score fusion 对 ranking 的影响。
2. 增强 seed 阶段的 lexical 命中与 changed-file 邻域扩展。
3. 增强 expand 阶段的 graph walk 与 test affinity。
4. 调整 rerank，使排序依据可追踪到组成信号。
5. 运行 retrieval 单测与 benchmark 对比，确认指标改善。

**Test scenarios:**
- changed files 命中时相关模块排序上升。
- candidate tests 会被提升但不会挤掉核心证据。
- 无 graph 邻接时仍能回退到 lexical-only 可用结果。
- score breakdown 字段完整可读。

**Verification:**
- `npx jest tests/unit/crg-retrieval.test.js --runInBand`
- `node benchmarks/review/run-review-benchmark.js`

### Task 32：实现 language-aware chunking v2 最小版

**Goal:** 把当前 `symbol-split v1` 提升为更合理的语言感知 chunking，但只解决当前最影响检索质量的问题。

**Files:**
- Modify: `src/crg/chunking.js`
- Modify: `src/crg/lang-config.js`
- Modify: `src/crg/parser.js`
- Modify: `tests/unit/crg-chunking.test.js`
- Modify: `tests/unit/crg-parser.test.js`

**Patterns to follow:**
- 只做 block-aware / statement-aware / language-aware 的最小增强。
- 不引入独立 chunk index 层，不重写 CRG schema。
- chunking 必须服务于 retrieval 指标，不做脱离 benchmark 的精细化设计。

**Steps:**
1. 先写失败测试，覆盖 JS/TS/Python 等现有 fixture 的 chunk 边界质量。
2. 在 `chunking.js` 增加 block-aware 与超长 symbol 细分策略。
3. 在 `lang-config.js` 定义语言级 chunk policy，保持配置显式。
4. 让 parser 输出能为 chunking 提供必要边界信息。
5. 跑 chunking 与 parser 测试，确认不破坏现有解析行为。

**Test scenarios:**
- 超长函数不会被粗暴按固定行数切坏语义边界。
- 多语言 fixture 的 chunk 大小与边界更稳定。
- parser degradation 时仍能回退到安全切块策略。
- retrieval_text 仍然可由 chunk 结果稳定生成。

**Verification:**
- `npx jest tests/unit/crg-chunking.test.js --runInBand`
- `npx jest tests/unit/crg-parser.test.js --runInBand`

### Task 33：建立 retrieval delta 与 no-regression 验证

**Goal:** 确保 Retrieval v2 的增强是“被 benchmark 证明更好”，而不是“看起来更高级”。

**Files:**
- Modify: `benchmarks/review/cases.json`
- Modify: `benchmarks/context-efficiency/cases.json`
- Modify: `benchmarks/regression/run-regression.js`
- Modify: `tests/unit/crg-retrieval.test.js`
- Modify: `tests/unit/regression-gate.test.js`

**Patterns to follow:**
- retrieval 的收益用已有 review / context-efficiency / regression 指标证明。
- 不额外引入复杂新 benchmark 平台。
- delta 分析重点看 hit rate、irrelevant ratio、fallback rate。

**Steps:**
1. 先补失败测试，要求 retrieval 变更在 regression 中可被感知。
2. 给 benchmark cases 增加 retrieval 敏感样例，覆盖 plan/work/review 三类场景。
3. 调整 regression 聚合逻辑，确保 retrieval 改动会影响 gate 判定。
4. 比较增强前后的 benchmark 结果，记录 delta。
5. 若指标未提升或出现退化，回退 Task 30-32 的权重与策略。

**Test scenarios:**
- Retrieval v2 至少在 review hit rate 或 irrelevant ratio 上有可测改进。
- regression 能捕获 retrieval 调整导致的退化。
- fallback rate 不因增强而升高。
- plan/work/review 三类 profile 不出现明显负迁移。

**Verification:**
- `npx jest tests/unit/crg-retrieval.test.js --runInBand`
- `npx jest tests/unit/regression-gate.test.js --runInBand`
- `node benchmarks/regression/run-regression.js`

---

## 8. P4-D Governance & Workspace

说明：

- 本阶段只在 `P4-A ~ P4-C` 达标后实施。
- 本阶段只交付“最小可运行闭环”，不扩张到多仓复杂控制面。

### Task 34：落地 ownership registry 最小版

**Goal:** 把 ownership 从“附加字段”升级为可维护的最小 registry，支持后续 review queue 与治理回写。

**Files:**
- Create: `src/bootstrap-compiler/ownership-registry.js`
- Modify: `src/bootstrap-compiler/ownership.js`
- Create: `.spec-first/workflows/bootstrap/spec-first/ownership.json`
- Modify: `tests/unit/knowledge-governance.test.js`
- Modify: `tests/unit/spec-graph-bootstrap-contracts.test.js`

**Patterns to follow:**
- registry 先以文件契约方式存在，不引入服务化存储。
- owner / reviewer / last_verified 字段与现有产物保持兼容。
- registry 只覆盖最小关键资产，不追求全仓全文件完备性。

**Steps:**
1. 先补失败测试，要求 ownership 来源可追踪、字段完整。
2. 新建 `ownership-registry.js` 统一加载、校验 ownership 数据。
3. 调整 `ownership.js`，使其不再依赖临时对象输入，而以 registry 为真源。
4. 生成最小 `ownership.json` 示例产物。
5. 运行治理与 contract 测试。

**Test scenarios:**
- ownership registry 缺失时显式降级，不静默返回空值。
- asset 能正确附加 owner、reviewer、last_verified。
- registry 格式错误时 contract 测试失败。
- review queue 读取 ownership 时字段稳定。

**Verification:**
- `npx jest tests/unit/knowledge-governance.test.js --runInBand`
- `npx jest tests/unit/spec-graph-bootstrap-contracts.test.js --runInBand`

### Task 35：建立 review queue lifecycle 最小闭环

**Goal:** 把 `review-queue.js` 从静态条目生成器，升级为具备最小状态流转的治理流程。

**Files:**
- Create: `src/bootstrap-compiler/review-queue-state.js`
- Modify: `src/bootstrap-compiler/review-queue.js`
- Create: `.spec-first/workflows/bootstrap/spec-first/review-queue.json`
- Modify: `tests/unit/knowledge-governance.test.js`

**Patterns to follow:**
- 生命周期先覆盖 `open -> triaged -> resolved` 三态即可。
- 状态流转必须可回写文件，不引入数据库或队列系统。
- review queue 必须关联 ownership 与 last_verified，而不是孤立存在。

**Steps:**
1. 先写失败测试，定义 review queue 状态转移规则。
2. 新建 `review-queue-state.js`，集中管理状态合法性与回写逻辑。
3. 调整 `review-queue.js`，让生成逻辑与状态逻辑分离。
4. 生成最小 `review-queue.json` 示例，确保 contract 清晰。
5. 跑治理相关单测，确认最小流程闭环成立。

**Test scenarios:**
- 新条目默认进入 `open`。
- triage 后能进入 `triaged` 并保留 owner / reviewer 信息。
- resolved 回写后，状态与 last_verified 更新一致。
- 非法状态转移显式失败。

**Verification:**
- `npx jest tests/unit/knowledge-governance.test.js --runInBand`

### Task 36：实现 workspace integration v1

**Goal:** 在不扩大系统复杂度的前提下，让 workspace context 成为可运行的最小扩展路径。

**Files:**
- Modify: `src/context-routing/workspace-loader.js`
- Modify: `src/bootstrap-compiler/workspace-compiler.js`
- Modify: `skills/spec-plan/SKILL.md`
- Modify: `skills/spec-work/SKILL.md`
- Modify: `skills/spec-code-review/SKILL.md`
- Modify: `tests/unit/workspace-context.test.js`

**Patterns to follow:**
- workspace v1 只做多 repo Stage-0 聚合，不做 cross-repo symbol graph。
- 单仓行为必须保持兼容，不允许因 workspace 引入默认退化。
- workspace 只在显式提供 `repoRoots` 时启用。

**Steps:**
1. 先写失败测试，定义 workspace loader/compiler 的输入输出 contract。
2. 增强 `workspace-loader.js`，让其能稳定加载多个 repo 的 Stage-0 结果。
3. 增强 `workspace-compiler.js`，生成可供 evaluator 使用的 workspace 汇总视图。
4. 在三个 workflow 文档中说明 workspace v1 的启用条件与回退策略。
5. 运行 workspace tests，确认单仓与多仓行为都可预测。

**Test scenarios:**
- 单仓输入时行为不变。
- 多仓输入时能产出聚合结果，并保持 repo 边界可见。
- 缺少某个 repo 的 Stage-0 产物时不会拖垮整体加载。
- workspace 模式不会改变默认单仓 selected assets。

**Verification:**
- `npx jest tests/unit/workspace-context.test.js --runInBand`
- `npx jest tests/unit/workflow-stage0-consumption.test.js --runInBand`

### Task 37：建立 workspace benchmark 与单仓不退化验证

**Goal:** 证明 workspace 扩展没有破坏单仓主链，并为后续扩展保留质量门。

**Files:**
- Modify: `benchmarks/repo-qa/questions.json`
- Modify: `benchmarks/context-efficiency/cases.json`
- Modify: `benchmarks/regression/baselines.json`
- Modify: `tests/unit/workspace-context.test.js`
- Modify: `tests/unit/regression-gate.test.js`

**Patterns to follow:**
- workspace benchmark 先验证单仓不退化，再验证最小多仓收益。
- 仍复用现有 repo QA / context-efficiency / regression 体系，不单独造平台。
- baseline 必须区分 single-repo 与 workspace-v1 两类场景。

**Steps:**
1. 先写失败测试，约束 workspace 相关 baseline 与单仓 baseline 不混淆。
2. 扩展 benchmark cases，增加最小 workspace 问题与上下文效率样例。
3. 调整 regression 基线文件，使 single-repo 与 workspace-v1 可分别比较。
4. 跑完整 regression，确认单仓指标不退化。
5. 若 workspace 指标引入明显退化，优先收缩 workspace 聚合策略。

**Test scenarios:**
- single-repo baseline 在引入 workspace 后保持不退化。
- workspace-v1 至少对一类跨 repo 问题带来可测帮助。
- baseline 分类错误时 regression 失败。
- workspace 不会显著提高 irrelevant ratio 或 fallback rate。

**Verification:**
- `npx jest tests/unit/workspace-context.test.js --runInBand`
- `npx jest tests/unit/regression-gate.test.js --runInBand`
- `node benchmarks/regression/run-regression.js`

---

## 9. 测试矩阵

### 9.1 Contract / Compiler

- `tests/unit/spec-graph-bootstrap-contracts.test.js`
- `tests/unit/spec-graph-bootstrap-compiler.test.js`
- `tests/unit/stage0-freshness.test.js`

### 9.2 Workflow Consumption / Telemetry

- `tests/unit/context-routing-evaluator.test.js`
- `tests/unit/workflow-stage0-consumption.test.js`
- `tests/unit/workflow-telemetry.test.js`

### 9.3 CRG / Retrieval

- `tests/unit/crg-generation-build.test.js`
- `tests/unit/crg-retrieval.test.js`
- `tests/unit/crg-chunking.test.js`
- `tests/unit/crg-parser.test.js`

### 9.4 Governance / Workspace

- `tests/unit/knowledge-governance.test.js`
- `tests/unit/workspace-context.test.js`

### 9.5 Benchmark / Gate / E2E

- `tests/unit/review-benchmark-smoke.test.js`
- `tests/unit/repo-qa-benchmark-smoke.test.js`
- `tests/unit/context-efficiency-benchmark-smoke.test.js`
- `tests/unit/regression-gate.test.js`
- `bash tests/e2e/spec-graph-bootstrap-mainline.sh`
- `bash tests/integration/e2e.sh`

---

## 10. 完成定义

本计划只有在以下条件同时满足时，才允许宣称 `P4` 完成：

1. `spec-graph-bootstrap` 已通过统一 orchestrator 执行默认主链。
2. `freshness / lint / contradictions` 已成为默认产物链的一部分，并能被 evaluator / workflow 消费。
3. `spec-plan / spec-work / spec-code-review` 已默认写 telemetry，且 fallback / skipped reason 可追踪。
4. `review / repo QA / context-efficiency / regression` 已接入标准 gate，不再只是手工脚本。
5. Retrieval v2 的增强已在 benchmark 上取得正向或至少无退化结果。
6. ownership registry、review queue lifecycle、workspace v1 已形成最小运行闭环。
7. 单仓路径在引入 workspace 后无明显退化。
8. 所有关键 contract、benchmark、baseline、workflow 术语与文档口径一致。

---

## 11. 风险控制与实施建议

### 11.1 本轮最高优先风险

- 主链未真正收口，导致后续所有增强继续停留在模块层
- benchmark 数据集过弱，导致 gate 形同虚设
- Retrieval v2 在无充分评测保护下扩大复杂度
- workspace 设计超前，引入单仓退化

### 11.2 风险控制策略

1. `Task 22-25` 必须整段完成后再进入 benchmark 扩展。
2. `Task 26-29` 若未达到稳定阈值，不得进入 Retrieval v2。
3. `Task 30-33` 只允许做最小可验证增强，任何超出本轮边界的研究项一律转入 backlog。
4. `Task 34-37` 一旦影响单仓指标，优先回退到更小的治理 / workspace 范围。

### 11.3 建议的提交节奏

- 一个 Task 一个提交，避免跨阶段混改。
- 每完成一个 Task 就运行对应 Verification，不累计到最后一起验。
- `P4-B` 完成后，先冻结 baseline，再进入 `P4-C`。
- `P4-D` 完成前，重新执行一次 full regression，确认单仓不退化。

---

## 12. H2 / H3 研究 Backlog

以下内容重要，但不属于本轮必须开发任务：

- vector retrieval / embedding recall
- cross-encoder rerank
- learned profile-aware ranking
- durable repo memory
- fact-level provenance graph
- historical knowledge memory
- production-grade observability platform
- 真正的 cross-repo symbol graph
- `verify` workflow 主链化

这些能力只能在 `P4` 主链、gate、workspace v1 稳定后，再进入单独研究或实施计划。

