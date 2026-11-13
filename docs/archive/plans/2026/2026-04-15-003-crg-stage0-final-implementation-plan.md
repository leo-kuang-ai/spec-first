---
title: "CRG + Stage-0 最终优化实施计划"
type: archive
status: superseded
created: 2026-04-15
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# CRG + Stage-0 最终优化实施计划

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成 `CRG + spec-graph-bootstrap` 最终方案的 `P0` 闭环，让系统从“能产文档”升级到“能稳定分发最小上下文”，并为后续 `P1-P3` 演进建立可验证、可维护的底座。

**Architecture:** 先收口 Stage-0 contract 与 deterministic evaluator，建立稳定消费闭环；再引入 `CRG` generation model 与最小 retrieval-ready schema 扩展，让 `plan / work / review` 能消费健康、可回退、可解释的上下文资产。`P0` 不追求一次性做满 retrieval 层，而是先做最小可用闭环，再由 `P1-P3` 渐进扩展。

**Tech Stack:** Node.js CommonJS、better-sqlite3、Jest、JSON/YAML 文件契约、现有 `spec-first` CLI/skills/runtime 体系

---

## 1. 计划范围

本计划以 [2026-04-15-002-crg-spec-graph-bootstrap-best-practice-architecture-design.md](/Users/kuang/xiaobu/spec-first/docs/plans/2026-04-15-002-crg-spec-graph-bootstrap-best-practice-architecture-design.md) 为唯一架构基线。

本计划只把以下内容纳入 **本轮必须实施范围**：

1. `Stage-0 contract` 收口
2. `context-routing deterministic evaluator`
3. `spec-plan / spec-work / spec-code-review` 接入 evaluator
4. `CRG generation model`
5. `CRG` 最小 retrieval-ready schema 扩展
6. `minimal-context/review.json` 首个 machine-first 任务卡片
7. `schema/sample drift tests`
8. 最小 review benchmark

以下内容明确 **不在本轮直接实现范围**：

- 向量检索
- learned rerank
- 全量 `chunks` / `retrieval_features` 体系
- 多 repo / workspace 级 context
- 完整 `plan/work/verify` minimal-context 全家桶

---

## 2. 里程碑划分

### Milestone A：消费闭环先跑通

目标：

- 不改大 schema 的前提下，先让 evaluator 决定“任务该读什么”
- 让 `spec-plan / spec-work / spec-code-review` 不再只靠 prompt 约定消费 Stage-0

完成定义：

- evaluator 可返回 `level / selected_assets / fallback_reason / skipped_rules`
- 三个 workflow 的 Stage-0 预载约定都以同一 evaluator 输出 contract 为真源

### Milestone B：引入 generation model

目标：

- `CRG` 构建不再直接污染唯一 `graph.db`
- workflow 能绑定健康 generation

完成定义：

- 生成 `current` / `last-known-good`
- 构建失败不影响当前消费

### Milestone C：最小 retrieval-ready schema

目标：

- 让 `CRG` 输出 evaluator 和后续 retrieval 所需的最小字段

完成定义：

- `generation_id / parser_quality / summary / retrieval_text` 可被产出和消费

### Milestone D：建立最小质量闭环

目标：

- contract drift 可检测
- review benchmark 有第一版 baseline

完成定义：

- contract tests 和 benchmark smoke tests 可在 CI 中运行

---

## 3. 实施顺序总览

按严格顺序实施：

1. Implementation Unit 1：建立 contract 目录与 schema 真源
2. Implementation Unit 2：实现 sample generator 与 sample drift 校验
3. Implementation Unit 3：实现 `context-routing` evaluator
4. Implementation Unit 4：接入 `spec-plan / spec-work / spec-code-review`
5. Implementation Unit 5：实现 `CRG` generation model
6. Implementation Unit 6：补最小 retrieval-ready schema 字段
7. Implementation Unit 7：生成 `minimal-context/review.json`
8. Implementation Unit 8：建立最小 review benchmark
9. Implementation Unit 9：补齐文档与回归验证

这个顺序不可颠倒的关键点：

- evaluator 必须先于大 schema 落地
- workflow 接入必须先于 retrieval 扩展
- generation model 必须先于“健康状态消费”

---

## 4. Implementation Unit 1：建立 Stage-0 schema 真源

**Goal:** 把 Stage-0 关键 contract 从 skill 文本抽离为正式 schema 文件，形成单一真源。

**Files:**
- Create: `docs/contracts/spec-graph-bootstrap/artifact-manifest.schema.json`
- Create: `docs/contracts/spec-graph-bootstrap/context-routing.schema.json`
- Create: `docs/contracts/spec-graph-bootstrap/minimal-context.schema.json`
- Create: `docs/contracts/spec-graph-bootstrap/freshness.schema.json`
- Modify: `skills/spec-graph-bootstrap/SKILL.md`
- Test: `tests/unit/spec-graph-bootstrap-contracts.test.js`

**Patterns to follow:**
- 复用现有 contract 测试风格：`tests/contracts/crg-cli-v1.test.js`
- 复用现有 Stage-0 产物语义：`.spec-first/workflows/bootstrap/spec-first/artifact-manifest.json`

**Approach:**
- 新建 `docs/contracts/spec-graph-bootstrap/` 作为 Stage-0 contract 真源目录。
- `SKILL.md` 仅保留阶段流程、降级语义、输出职责，不再承载唯一字段真相。
- schema 先定义 `P0` 最小闭环所需结构，不追求终局全量字段。

**Test scenarios:**
- `artifact-manifest.schema.json` 能校验当前 checked-in sample 的最小必需字段。
- `context-routing.schema.json` 能表达 `always / stages / selection_rules / advice` 的 machine-first 版本。
- `minimal-context.schema.json` 能表达 `stage / profile / selected_assets / fallback_reason / advice`。
- schema 缺少必需字段时测试失败。

**Verification:**
- `npx jest tests/unit/spec-graph-bootstrap-contracts.test.js --runInBand`

---

## 5. Implementation Unit 2：实现 sample generator 与 drift 校验

**Goal:** 让 checked-in sample 从“手工维护”变成“由 generator 产出并受测试保护”。

**Files:**
- Create: `src/bootstrap-compiler/sample-generator.js`
- Create: `src/bootstrap-compiler/schema-loader.js`
- Modify: `tests/unit/spec-graph-bootstrap-contracts.test.js`
- Modify: `docs/contexts/spec-first/injection-index.yaml`
- Create: `.spec-first/workflows/bootstrap/spec-first/context-routing.json`
- Modify: `.spec-first/workflows/bootstrap/spec-first/artifact-manifest.json`
- Test: `tests/unit/spec-graph-bootstrap-contracts.test.js`

**Patterns to follow:**
- 参考现有 checked-in sample 路径组织：`docs/contexts/spec-first/`
- 参考现有 artifact 目录布局：`.spec-first/workflows/bootstrap/spec-first/`

**Approach:**
- 编写一个最小 sample generator，输入为 schema 默认值和固定 sample facts，输出为：
  - `.spec-first/workflows/bootstrap/<slug>/context-routing.json` checked-in sample
  - `.spec-first/workflows/bootstrap/<slug>/artifact-manifest.json` checked-in sample
  - `docs/contexts/<slug>/injection-index.yaml` 人类视图样本
- 明确 `context-routing.json` 属于 machine context plane，受 generator 和 drift tests 共同保护，不再隐含依赖“运行时自然存在”。
- 测试中生成 sample 并和 checked-in sample 对比，避免人工漂移。

**Test scenarios:**
- generator 输出与 checked-in sample 一致时通过。
- `context-routing.json` sample 缺失或未更新时 drift 测试失败。
- sample 缺字段时 drift 测试失败。
- schema 更新但 sample 未更新时 drift 测试失败。

**Verification:**
- `npx jest tests/unit/spec-graph-bootstrap-contracts.test.js --runInBand`

---

## 6. Implementation Unit 3：实现 deterministic evaluator

**Goal:** 建立真正的 `context-routing` 执行器，让 Stage-0 从“路由声明”升级为“可计算的消费入口”。

**Files:**
- Create: `src/context-routing/loader.js`
- Create: `src/context-routing/evaluator.js`
- Create: `src/context-routing/fallback.js`
- Create: `src/context-routing/profiles.js`
- Create: `src/context-routing/priority.js`
- Test: `tests/unit/context-routing-evaluator.test.js`

**Patterns to follow:**
- 沿用 CommonJS 风格
- 沿用当前 `spec-plan/spec-work/spec-code-review` 的 stage 命名：`plan/work/review`

**Approach:**
- 实现最小输入 contract：
  - `stage`
  - `contextDir`
  - `controlPlaneDir`
  - `context-routing.json`
  - `artifact-manifest.json`
  - `freshness.json`（可选）
  - `minimal-context/*.json`（可选）
- 固化求值顺序：
  1. manifest
  2. compatibility
  3. freshness
  4. profile 解析
  5. always
  6. stage assets
  7. selection_rules
  8. 存在性过滤
  9. 去重排序
  10. budget 裁剪
  11. fallback 输出

**Test scenarios:**
- manifest 缺失 -> `L3 + manifest_incomplete`
- routing 缺失 -> `L2 + routing_missing`
- minimal-context 缺失 -> `L1 + minimal_context_missing`
- freshness stale -> 降权但不中断
- `review / work / plan` 返回不同资产集合
- budget 裁剪顺序正确：先 narrative，后辅助 facts

**Verification:**
- `npx jest tests/unit/context-routing-evaluator.test.js --runInBand`

---

## 7. Implementation Unit 4：workflow 接入 evaluator

**Goal:** 让 `spec-plan / spec-work / spec-code-review` 的 Stage-0 预载 contract 统一切到 evaluator 输出，而不是继续以 `injection-index.yaml` 作为唯一真源。

**Files:**
- Modify: `skills/spec-plan/SKILL.md`
- Modify: `skills/spec-work/SKILL.md`
- Modify: `skills/spec-code-review/SKILL.md`
- Modify: `tests/unit/spec-graph-bootstrap-contracts.test.js`
- Test: `tests/unit/workflow-stage0-consumption.test.js`

**Patterns to follow:**
- 延续现有 Stage-0 预载描述，但把“求值来源”改为 evaluator 输出
- 保留降级链，但把原因结构化

**Approach:**
- 三个 workflow 的 `SKILL.md` 统一改成：
  - 优先消费同一 evaluator 输出 contract：`selected_assets / fallback_reason / level / skipped_rules`
  - evaluator 输出不可用时才退回固定最小集合
- 本轮不把 skill 执行器代码化；真正可执行代码范围是 evaluator 本体与共享测试夹具。
- `injection-index.yaml` 明确降级为人类视图，不再被描述为运行时唯一判定逻辑。

**Test scenarios:**
- 三个 workflow 都按同一 evaluator 输出字段消费 `selected_assets` 与 `fallback_reason`。
- `plan` contract 会优先暴露 `architecture/module-map.md`。
- `work` contract 会优先暴露 `test-map` 与 review-change 相关资产。
- `review` contract 会优先暴露 `high-risk-modules` 与 `minimal-context/review.json`。
- evaluator 输出缺失时走固定降级集合。

**Verification:**
- `npx jest tests/unit/workflow-stage0-consumption.test.js --runInBand`

---

## 8. Implementation Unit 5：实现 `CRG` generation model

**Goal:** 让 `CRG` 从就地更新单一库，升级为 generation-aware build。

**Files:**
- Create: `src/crg/generations/paths.js`
- Create: `src/crg/generations/promote.js`
- Create: `src/crg/generations/rollback.js`
- Create: `src/crg/generations/health.js`
- Modify: `src/crg/cli/build.js`
- Modify: `src/crg/artifact-paths.js`
- Modify: `src/crg/cli/open-db.js`
- Test: `tests/unit/crg-generation-build.test.js`

**Patterns to follow:**
- 复用现有 `.spec-first/graph/` 目录约定
- 复用现有 `graph_meta` 与 build envelope 逻辑

**Approach:**
- 新建：
  - `.spec-first/graph/generations/<generation-id>/graph.db`
  - `.spec-first/graph/current.json`
  - `.spec-first/graph/last-known-good.json`
- `build.js` 改为：
  - 先 build 到 generation 目录
  - health checks 通过后 promote
  - 失败则保留旧 current

**Test scenarios:**
- 正常 build 产生新 generation 并 promote 为 current。
- health check 失败时 current 不变。
- 首次构建时 current 和 last-known-good 正确初始化。
- open-db 能读取 current generation。

**Verification:**
- `npx jest tests/unit/crg-generation-build.test.js --runInBand`

---

## 9. Implementation Unit 6：补最小 retrieval-ready schema 字段

**Goal:** 只补 evaluator 和后续最小 retrieval 所需字段，不做过度设计。

**Files:**
- Modify: `src/crg/migrations.js`
- Modify: `src/crg/parser.js`
- Modify: `src/crg/graph.js`
- Modify: `src/crg/search.js`
- Test: `tests/unit/crg-parser.test.js`
- Test: `tests/unit/crg-graph.test.js`

**Patterns to follow:**
- 保持 `nodes` 为结构事实主表
- 不在本轮引入完整 `chunks` / `retrieval_features`

**Approach:**
- 为 `nodes` 增加：
  - `generation_id`
  - `parser_quality`
  - `summary`
  - `retrieval_text`
- `parser.js` 负责产出最小 summary / parser quality
- `graph.js` 负责写入
- `search.js` 利用 `retrieval_text` 改善 seed 检索

**Test scenarios:**
- 节点写入时包含新增字段。
- parser degradation 时 `parser_quality` 正确标记。
- 搜索可命中新 `retrieval_text`。

**Verification:**
- `npx jest tests/unit/crg-parser.test.js --runInBand`
- `npx jest tests/unit/crg-graph.test.js --runInBand`

---

## 10. Implementation Unit 7：产出 `minimal-context/review.json`

**Goal:** 先做首个 machine-first task card，验证整条链路。

**Files:**
- Create: `src/bootstrap-compiler/compile-minimal-context.js`
- Create: `.spec-first/workflows/bootstrap/spec-first/minimal-context/review.json`
- Modify: `skills/spec-graph-bootstrap/SKILL.md`
- Modify: `docs/contexts/spec-first/injection-index.yaml`
- Test: `tests/unit/spec-graph-bootstrap-contracts.test.js`

**Patterns to follow:**
- 以当前 `review` 场景的 `high-risk-modules + test-map + review-change` 为基础
- machine-first 优先于 narrative

**Approach:**
- `review.json` 最小字段建议：
  - `stage`
  - `profile`
  - `priority_assets`
  - `risk_focus`
  - `candidate_tests`
  - `fallback_reason`
  - `advice`
- 让 evaluator 在 `review` 场景优先选这个文件。

**Test scenarios:**
- `review.json` 存在时 evaluator 优先选择它。
- `review.json` 缺失时回退到 machine artifacts / docs。
- `review.json` 与 schema 契约一致。

**Verification:**
- `npx jest tests/unit/spec-graph-bootstrap-contracts.test.js --runInBand`
- `npx jest tests/unit/context-routing-evaluator.test.js --runInBand`

---

## 11. Implementation Unit 8：建立最小 review benchmark

**Goal:** 不等全套系统成熟，先把“是否更准”做成可测问题。

**Files:**
- Create: `benchmarks/review/fixtures/`
- Create: `benchmarks/review/cases.json`
- Create: `benchmarks/review/run-review-benchmark.js`
- Test: `tests/unit/review-benchmark-smoke.test.js`

**Patterns to follow:**
- 先做 smoke-level benchmark
- 不要求一次覆盖多仓库

**Approach:**
- 建立最小数据集：
  - 变更文件集合
  - 期望命中的相关文件
  - 期望命中的测试
  - 期望出现的高风险提示
- runner 输出：
  - hit rate
  - missing evidence
  - irrelevant evidence

**Test scenarios:**
- benchmark runner 能读取 fixture 并输出结果。
- cases 格式错误时显式失败。
- smoke test 能覆盖至少 1 个 review case。

**Verification:**
- `npx jest tests/unit/review-benchmark-smoke.test.js --runInBand`

---

## 12. Implementation Unit 9：文档收尾与回归验证

**Goal:** 让代码、schema、sample、workflow 文档和测试同时收口。

**Files:**
- Modify: `docs/02-架构设计/2026-04-15-CRG-Stage0-最终优化技术方案.md`
- Modify: `docs/plans/2026-04-15-002-crg-spec-graph-bootstrap-best-practice-architecture-design.md`
- Modify: `CHANGELOG.md`
- Test: `tests/unit/spec-graph-bootstrap-contracts.test.js`
- Test: `tests/unit/context-routing-evaluator.test.js`
- Test: `tests/unit/crg-generation-build.test.js`

**Patterns to follow:**
- 文档只保留最终口径，不新增新的备选方案
- 代码变更同步写 `CHANGELOG.md`

**Approach:**
- 更新架构文档中的最终状态
- 确保计划、架构、实现术语一致
- 运行最小回归测试集

**Test scenarios:**
- 所有新增测试通过。
- 文档不再与实现 contract 明显冲突。
- `CHANGELOG.md` 已记录源码改动。

**Verification:**
- `npm run test:unit`

---

## 13. 依赖关系

严格依赖如下：

```text
Unit 1 -> Unit 2 -> Unit 3 -> Unit 4
Unit 1 -> Unit 5 -> Unit 6
Unit 3 + Unit 6 -> Unit 7
Unit 4 + Unit 7 -> Unit 8
Unit 1..8 -> Unit 9
```

说明：

- Unit 3 不能晚于 Unit 6
- Unit 7 必须建立在 evaluator 和最小 schema 同时可用之后
- Unit 8 必须以真实消费链路为基线，而不是只测静态文件

---

## 14. 测试矩阵

### Contract 层

- `tests/unit/spec-graph-bootstrap-contracts.test.js`
- `tests/unit/context-routing-evaluator.test.js`

### CRG 层

- `tests/unit/crg-generation-build.test.js`
- `tests/unit/crg-parser.test.js`
- `tests/unit/crg-graph.test.js`

### Workflow 层

- `tests/unit/workflow-stage0-consumption.test.js`

### Benchmark 层

- `tests/unit/review-benchmark-smoke.test.js`

---

## 15. 完成定义

本计划完成时，必须同时满足：

1. `spec-plan / spec-work / spec-code-review` 三个 workflow 的 Stage-0 预载 contract 都以同一 evaluator 输出格式为真源。
2. evaluator 能稳定输出结构化 `selected_assets` 和 `fallback_reason`。
3. `CRG` 构建失败不会污染当前消费 generation。
4. Stage-0 checked-in sample 由 generator 产出并受 drift tests 保护。
5. `minimal-context/review.json` 能被优先消费。
6. 至少有一套最小 review benchmark 可运行。

---

## 16. P1 全量开发任务

P1 的目标不是继续补零散能力，而是把 `P0` 建立的消费闭环扩展成真正可用的最小上下文系统。

### Implementation Unit 10：补齐 `plan/work` minimal-context，并冻结 `verify` contract 占位

**Goal:** 让已有核心 workflow 先补齐 machine-first task card，并把 `verify` 保留为终局 contract 占位，而不是在 consumer 未定义前抢先落地。

**Files:**
- Modify: `src/bootstrap-compiler/compile-minimal-context.js`
- Create: `.spec-first/workflows/bootstrap/spec-first/minimal-context/plan.json`
- Create: `.spec-first/workflows/bootstrap/spec-first/minimal-context/work.json`
- Modify: `docs/contexts/spec-first/injection-index.yaml`
- Test: `tests/unit/context-routing-evaluator.test.js`

**Approach:**
- 为 `plan/work` 建立各自的 profile 输出。
- `plan.json` 聚焦 entrypoints / module boundaries / integrations。
- `work.json` 聚焦 changed area / candidate tests / impacted modules。
- `verify` 仅保留在 schema / architecture 层作为终局预留位；待 `verify` workflow 或明确 consumer 定义后，再新增独立 implementation unit 落地。

**Test scenarios:**
- `plan.json` 与 `work.json` 都能被 evaluator 正确命中。
- `plan` 与 `work` 的 selected assets 集合明显不同。
- fallback 时能回退到 machine facts 或核心 docs。

**Verification:**
- `npx jest tests/unit/context-routing-evaluator.test.js --runInBand`

### Implementation Unit 11：建立 hybrid retrieval v1

**Goal:** 让 `CRG` 从“搜索 + 专用脚本”升级为统一的 task-aware retrieval pipeline。

**Files:**
- Create: `src/crg/retrieval/seed.js`
- Create: `src/crg/retrieval/expand.js`
- Create: `src/crg/retrieval/rerank.js`
- Create: `src/crg/retrieval/pack.js`
- Create: `src/crg/retrieval/profiles.js`
- Create: `src/crg/retrieval/api.js`
- Modify: `src/crg/commands/review-context.js`
- Modify: `src/crg/cli/context.js`
- Test: `tests/unit/crg-retrieval.test.js`

**Approach:**
- 将检索链路固定为 `seed -> expand -> rerank -> pack`。
- `seed` 复用 FTS / changed-file / symbol hits。
- `expand` 复用 calls / imports / flows / risk / tests。
- `rerank` 先用 heuristic，按 profile 加权。
- `pack` 加入 token budget 和多样性约束。

**Test scenarios:**
- `review` profile 结果优先覆盖 blast radius 与 candidate tests。
- `plan` profile 结果优先覆盖 entrypoints 与 modules。
- budget 限制下 narrative 先被裁剪。
- 统一 API 可以返回 ranked_context。

**Verification:**
- `npx jest tests/unit/crg-retrieval.test.js --runInBand`

### Implementation Unit 12：引入 AST-aware chunking v1

**Goal:** 为后续 retrieval 提供更合理的最小检索粒度。

**Files:**
- Modify: `src/crg/parser.js`
- Create: `src/crg/chunking.js`
- Modify: `src/crg/migrations.js`
- Modify: `src/crg/graph.js`
- Test: `tests/unit/crg-chunking.test.js`

**Approach:**
- 默认按 function / method / class 生成 chunk。
- 超大 symbol 递归切块。
- chunk 保留父 symbol、路径、行号、summary、retrieval_text。
- 本阶段不做复杂 chunk 合并策略。

**Test scenarios:**
- 普通函数生成单 chunk。
- 超大函数按规则拆分。
- chunk 能被 retrieval API 选中。
- chunk 与 node 关联关系稳定。

**Verification:**
- `npx jest tests/unit/crg-chunking.test.js --runInBand`

### Implementation Unit 13：引入 freshness / lint / contradictions

**Goal:** 让 Stage-0 上下文具备基本可维护性和可治理性。

**Files:**
- Create: `src/bootstrap-compiler/freshness.js`
- Create: `src/bootstrap-compiler/lint.js`
- Create: `src/bootstrap-compiler/contradictions.js`
- Create: `.spec-first/workflows/bootstrap/spec-first/freshness.json`
- Create: `.spec-first/workflows/bootstrap/spec-first/lint-report.json`
- Create: `.spec-first/workflows/bootstrap/spec-first/contradictions.json`
- Test: `tests/unit/stage0-freshness.test.js`

**Approach:**
- `freshness.json` 记录 graph build 时间、input sha、output updated_at。
- `lint-report.json` 记录 schema drift、missing assets、orphan pages。
- `contradictions.json` 先做最小规则版：同一事实在多个产物中冲突时报警。

**Test scenarios:**
- stale graph / stale output 能被识别。
- sample drift 能进入 lint 输出。
- 丢失关键 asset 时 lint 报错。

**Verification:**
- `npx jest tests/unit/stage0-freshness.test.js --runInBand`

### Implementation Unit 14：拆分 bootstrap compiler

**Goal:** 让 Stage-0 从 skill 文本驱动，升级为可维护的编译器模块。

**Files:**
- Create: `src/bootstrap-compiler/compile-machine-artifacts.js`
- Create: `src/bootstrap-compiler/compile-human-assets.js`
- Create: `src/bootstrap-compiler/compile-routing.js`
- Modify: `skills/spec-graph-bootstrap/SKILL.md`
- Test: `tests/unit/spec-graph-bootstrap-compiler.test.js`

**Approach:**
- skill 负责流程和交互。
- 真正的编译规则收敛到 `src/bootstrap-compiler/`。
- machine artifacts 先编译，human assets 后编译，routing 最后编译。

**Test scenarios:**
- compiler 能独立生成 machine artifacts。
- compiler 能独立生成 docs assets。
- skill 文本与 compiler 输出 contract 不冲突。

**Verification:**
- `npx jest tests/unit/spec-graph-bootstrap-compiler.test.js --runInBand`

---

## 17. P2 全量开发任务

P2 的目标是把系统从“可以运行”推进到“可以被证明有效”。

### Implementation Unit 15：建立 repo QA benchmark

**Goal:** 验证系统是否真的提升代码库理解，而不是只让上下文看起来更结构化。

**Files:**
- Create: `benchmarks/repo-qa/questions.json`
- Create: `benchmarks/repo-qa/run-repo-qa.js`
- Create: `benchmarks/repo-qa/fixtures/`
- Test: `tests/unit/repo-qa-benchmark-smoke.test.js`

**Approach:**
- 题型覆盖：entrypoints、module boundaries、risk、tests、integrations。
- runner 输出 hit/miss 与 evidence quality。
- 首轮允许人工标注 expected answers。

**Test scenarios:**
- questions.json 格式正确。
- runner 能输出基线结果。
- smoke case 至少覆盖一个 repo QA 场景。

**Verification:**
- `npx jest tests/unit/repo-qa-benchmark-smoke.test.js --runInBand`

### Implementation Unit 16：建立 context efficiency benchmark

**Goal:** 用数据验证“最小上下文分发”是否真的减少无关扫描与 token 消耗。

**Files:**
- Create: `benchmarks/context-efficiency/cases.json`
- Create: `benchmarks/context-efficiency/run-context-efficiency.js`
- Test: `tests/unit/context-efficiency-benchmark-smoke.test.js`

**Approach:**
- 记录每个 case 的：
  - selected assets
  - estimated tokens
  - expected key evidence
- 输出：
  - token 使用量
  - irrelevant context ratio
  - first useful evidence position

**Test scenarios:**
- cases.json 格式校验。
- runner 能输出统计结果。
- smoke case 至少覆盖一个 review 和一个 plan 场景。

**Verification:**
- `npx jest tests/unit/context-efficiency-benchmark-smoke.test.js --runInBand`

### Implementation Unit 17：建立 workflow telemetry

**Goal:** 记录 workflow 实际读了什么、用了什么、缺了什么。

**Files:**
- Create: `src/context-routing/telemetry.js`
- Create: `.spec-first/workflows/spec-code-review/`
- Create: `.spec-first/workflows/spec-plan/`
- Create: `.spec-first/workflows/spec-work/`
- Test: `tests/unit/workflow-telemetry.test.js`

**Approach:**
- 记录：
  - selected assets
  - skipped rules
  - fallback reason
  - freshness status
- 保留最小 run artifact，避免侵入主流程。

**Test scenarios:**
- 每个 workflow 至少能写一条最小 telemetry。
- 缺失 asset 时 telemetry 能记录 skipped reason。
- fallback 场景被完整记录。

**Verification:**
- `npx jest tests/unit/workflow-telemetry.test.js --runInBand`

### Implementation Unit 18：建立 regression gate

**Goal:** 防止 retrieval、routing、freshness 演进后回退。

**Files:**
- Create: `benchmarks/regression/run-regression.js`
- Create: `benchmarks/regression/baselines.json`
- Test: `tests/unit/regression-gate.test.js`

**Approach:**
- 把 review benchmark、repo QA benchmark、context efficiency benchmark 的关键指标汇总成 baseline。
- 设置最小退化阈值，退化超阈则测试失败。

**Test scenarios:**
- baseline 缺失时显式失败。
- runner 能聚合多个 benchmark 结果。
- 阈值被触发时 regression test 失败。

**Verification:**
- `npx jest tests/unit/regression-gate.test.js --runInBand`

---

## 18. P3 全量开发任务

P3 的目标是把系统从“高质量本地底座”推进到“长期演进能力”。

### Implementation Unit 19：引入 optional semantic rerank

**Goal:** 在不破坏 lexical + graph 主链的前提下，引入可选的语义增强。

**Files:**
- Create: `src/crg/retrieval/semantic-rerank.js`
- Modify: `src/crg/retrieval/api.js`
- Modify: `src/crg/retrieval/profiles.js`
- Test: `tests/unit/crg-semantic-rerank.test.js`

**Approach:**
- semantic rerank 必须是 optional enhancement，而不是主链唯一依赖。
- 默认关闭，通过配置或 profile 开启。

**Test scenarios:**
- 未启用时主链行为不变。
- 启用时结果顺序可被重排。
- 模块缺失或配置关闭时不影响主链。

**Verification:**
- `npx jest tests/unit/crg-semantic-rerank.test.js --runInBand`

### Implementation Unit 20：引入 cross-repo / workspace context

**Goal:** 支持多仓库或 workspace 级别的上下文编译与路由。

**Files:**
- Create: `src/context-routing/workspace-loader.js`
- Create: `src/bootstrap-compiler/workspace-compiler.js`
- Test: `tests/unit/workspace-context.test.js`

**Approach:**
- 在保持单 repo 主链稳定的前提下，引入 workspace 层聚合。
- 支持跨 repo entrypoints / integrations / shared modules 的索引视图。

**Test scenarios:**
- 多 repo 场景能合并 context。
- 单 repo 场景行为不变。
- workspace 缺少某 repo 时能优雅降级。

**Verification:**
- `npx jest tests/unit/workspace-context.test.js --runInBand`

### Implementation Unit 21：长期知识治理能力

**Goal:** 让 compiled context 真正具备长期维护能力。

**Files:**
- Create: `src/bootstrap-compiler/ownership.js`
- Create: `src/bootstrap-compiler/review-queue.js`
- Test: `tests/unit/knowledge-governance.test.js`

**Approach:**
- 引入 asset owner / reviewer / last_verified 等字段。
- 对 stale、contradictory、未验证的资产建立治理队列。

**Test scenarios:**
- asset 可以记录 owner / reviewer / last_verified。
- stale 资产会进入治理队列。
- contradictions 能被标记为待处理项。

**Verification:**
- `npx jest tests/unit/knowledge-governance.test.js --runInBand`

---

## 19. 全量依赖图

严格依赖如下：

```text
P0:
  1 -> 2 -> 3 -> 4
  1 -> 5 -> 6
  3 + 6 -> 7
  4 + 7 -> 8
  1..8 -> 9

P1:
  3 + 7 -> 10
  6 -> 11 -> 12
  2 + 10 -> 13
  2 + 7 + 13 -> 14

P2:
  10 + 11 + 14 -> 15
  10 + 11 -> 16
  4 + 10 + 14 -> 17
  8 + 15 + 16 + 17 -> 18

P3:
  11 + 18 -> 19
  10 + 14 -> 20
  13 + 17 + 18 -> 21
```

---

## 20. 全量测试矩阵

### Contract 层

- `tests/unit/spec-graph-bootstrap-contracts.test.js`
- `tests/unit/context-routing-evaluator.test.js`
- `tests/unit/spec-graph-bootstrap-compiler.test.js`

### CRG Index / Retrieval 层

- `tests/unit/crg-generation-build.test.js`
- `tests/unit/crg-parser.test.js`
- `tests/unit/crg-graph.test.js`
- `tests/unit/crg-retrieval.test.js`
- `tests/unit/crg-chunking.test.js`
- `tests/unit/crg-semantic-rerank.test.js`

### Workflow 层

- `tests/unit/workflow-stage0-consumption.test.js`
- `tests/unit/workflow-telemetry.test.js`
- `tests/unit/workspace-context.test.js`

### Governance / Freshness 层

- `tests/unit/stage0-freshness.test.js`
- `tests/unit/knowledge-governance.test.js`

### Benchmark / Regression 层

- `tests/unit/review-benchmark-smoke.test.js`
- `tests/unit/repo-qa-benchmark-smoke.test.js`
- `tests/unit/context-efficiency-benchmark-smoke.test.js`
- `tests/unit/regression-gate.test.js`

---

## 21. 全量开发任务清单

为了便于项目排期，这里给出从 `P0` 到 `P3` 的总任务索引：

### P0

- Unit 1：Stage-0 schema 真源
- Unit 2：sample generator + drift
- Unit 3：deterministic evaluator
- Unit 4：workflow 接入 evaluator
- Unit 5：CRG generation model
- Unit 6：最小 retrieval-ready schema
- Unit 7：`minimal-context/review.json`
- Unit 8：最小 review benchmark
- Unit 9：文档收尾与回归

### P1

- Unit 10：`plan/work` minimal-context + `verify` contract 占位冻结
- Unit 11：hybrid retrieval v1
- Unit 12：AST-aware chunking v1
- Unit 13：freshness / lint / contradictions
- Unit 14：bootstrap compiler 模块化

### P2

- Unit 15：repo QA benchmark
- Unit 16：context efficiency benchmark
- Unit 17：workflow telemetry
- Unit 18：regression gate

### P3

- Unit 19：optional semantic rerank
- Unit 20：cross-repo / workspace context
- Unit 21：长期知识治理能力

---

## 22. 实施建议

最稳妥的执行方式是：

1. 先完成 Unit 1-4，打通消费闭环
2. 再完成 Unit 5-7，打通 generation + minimal review context
3. 再完成 Unit 8-9，建立最小质量闭环并收尾
4. 然后推进 Unit 10-14，形成真正的最小上下文系统
5. 再推进 Unit 15-18，让系统具备数据化验证与 regression gate
6. 最后推进 Unit 19-21，进入长期演进能力建设

如果必须压缩首轮范围，最低可交付子集是：

- Unit 1
- Unit 2
- Unit 3
- Unit 4
- Unit 7

这能最小化证明：

**系统已经从“会产上下文”迈向“会稳定分发上下文”。**
