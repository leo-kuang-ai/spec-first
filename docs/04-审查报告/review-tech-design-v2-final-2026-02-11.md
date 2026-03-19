# V2 技术方案全面审查报告（开发前签核）

> **审查日期**: 2026-02-11
> **审查范围**: V2 全部 12 份技术方案 vs 12 份需求文档 + src/ 代码实现
> **审查方法**: 4 组并行交叉审查（架构+流程、质量门禁+变更、Skill+CLI+多端、产出物+度量+路线图+代码）
> **审查工具**: Claude Opus 4.6 × 4 并行 Agent

---

## 总览

| 严重级别 | 数量 | 说明 |
|---------|------|------|
| **P0 阻断** | 6 | 数据契约冲突或实现链路断裂，不修复无法正确开发 |
| **P1 必修** | 17 | 功能缺失/语义不一致，不修复将导致实现偏差 |
| **P2 建议修** | 22 | 文档完整性/规范性问题，不阻断但增加实现风险 |
| **合计** | **45** | |

### 审查分组

| 组别 | 审查范围 | P0 | P1 | P2 | 小计 |
|------|---------|----|----|----|----|
| Group 1 | 架构+流程+追踪 (core-01~04 vs v2-01/v2-04/v2-05) | 2 | 6 | 8 | 16 |
| Group 2 | 质量门禁+变更 (core-03/core-05 vs v2-06/v2-07) | 0 | 5 | 10 | 15 |
| Group 3 | Skill+CLI+多端 (aux-01~03 vs v2-02/v2-03/v2-08/v2-09) | 1 | 4 | 4 | 9 |
| Group 4 | 产出物+度量+路线图+代码 (aux-04~06 vs v2-10/v2-11/v2-12/src/) | 3 | 6 | 5 | 14 |
| **去重合并后** | | **6** | **17** | **22** | **45** |

---

## P0 — 阻断级（6 项）

### P0-01: 度量指标体系代码实现与需求/设计完全脱节

- **来源**: aux-05-metrics / v2-11 vs `src/core/metrics-engine/`
- **审查组**: Group 4 Finding #1

需求和设计一致定义 12 项指标: C1-C9 + E1(Stage Cycle Time) + Q1(Defect Escape Rate) + H1(Health Score)。代码中 `IndicatorCode` 和 `IndicatorRegistry` 实现了一套完全不同的 12 项指标（task_coverage, rework_rate, gate_first_pass, ai_code_volume 等）。

关键差异:
1. C1 Design Coverage 完全缺失
2. E1 Stage Cycle Time 完全缺失（v2-11 要求的 `computeCycleTime` 函数未实现）
3. 代码新增了需求中不存在的指标: rework_rate, gate_first_pass, ai_code_volume, ai_doc_volume, session_recovery
4. 权重体系不同: 需求用 w1-w9 各 0.10-0.15（总和 1.0），代码用整数权重总和 100

**修复**: 重写 `IndicatorCode` 和 `IndicatorRegistry`，与 v2-11 的 C1-C9 + E1 + Q1 + H1 体系对齐。

---

### P0-02: 健康分计算公式代码实现与需求不一致

- **来源**: aux-05-metrics L48-60 / v2-11 L62-88 vs `src/core/metrics-engine/health-scorer.ts`
- **审查组**: Group 4 Finding #2

需求公式: `H1 = (w1*C1 + ... + w9*C9) * 100 - penalty(Q1)`，其中 `penalty(Q1) = max(0, (Q1 - 0.02)) * 100`。

代码实现: `healthPercent = (totalScore / maxScore) * 100`，无 penalty(Q1) 惩罚项，归一化逻辑不同，健康等级用五级(A/B/C/D/F)而非需求的三级(Healthy/Warning/Critical)。

**修复**: 重写 `HealthScorer.calculateScore()`，按需求公式实现。

---

### P0-03: CoverageType C5-C9 语义在多处定义中互相矛盾

- **来源**: aux-05-metrics vs `src/shared/types.ts` vs `src/core/trace-engine/types.ts`
- **审查组**: Group 4 Finding #3

`shared/types.ts` 中 C5 注释为"实现覆盖率"，需求定义 C5 为"Test Coverage (AC)"。`trace-engine/types.ts` 的 `COVERAGE_TYPE_MAP` 又定义了第三套映射。三处定义互相矛盾，覆盖率计算结果将完全错误。

**修复**: 统一 C1-C9 语义，严格按 aux-05-metrics 定义对齐所有类型文件。

---

### P0-04: 追踪矩阵列名不一致将导致解析器失败

- **来源**: core-03 L92 vs v2-05 L78
- **审查组**: Group 1 Finding P0-01

需求定义列名 `Test Case Ref`，设计定义 `TC Ref`。矩阵解析器按精确列名匹配时将直接失败。这不是风格问题，而是数据契约不一致。

**修复**: 统一为 `TC Ref`（与 ID 前缀对齐），更新 core-03。

---

### P0-05: Known Exception 必填字段在 v2-05 中严重缺失

- **来源**: core-03 L176-191 vs v2-05 L155-159
- **审查组**: Group 1 Finding P0-02

需求定义 12 个必填字段，v2-05 仅包含 5 个，缺失 7 个: `waiver_id`, `risk_level`, `mitigation`, `owner`, `approved_by`, `created_at`, `closure_evidence`。虽然 v2-05 L153 声明"权威 schema 以 v2-06 §6.2 为准"，但 v2-05 的 `validateExceptions` 函数必须知道完整 schema 才能校验。

**修复**: v2-05 §5.1 列出完整 12 字段 schema，或明确引用 v2-06 §6.2 的完整字段列表。

---

### P0-06: Layer 2 YAML Schema 缺失 `type`/`command`/`threshold` 关键字段

- **来源**: aux-03 L59-84 vs v2-09 L29-48
- **审查组**: Group 3 Finding #01

需求定义 gate_conditions 含 `type: auto|manual`（区分自动/手动评估）、`command`（执行命令）、`threshold`（阈值）。设计简化为单个 `check` 表达式字段，GateEngine 无法区分自动条件与手动条件，Gate 评估链路断裂。同时 `extra_deliverables` 从结构化对象简化为纯字符串列表，丢失 `required: true|false` 语义。

**修复**: v2-09 YAML Schema 对齐 aux-03 完整定义，保留 `type`/`command`/`threshold` 字段。

---

## P1 — 必修级（17 项）

### P1-01: GateVerdict 代码缺少 PASS_WITH_WAIVER 状态

- **来源**: v2-06 / v2-12 vs `src/shared/types.ts` L36
- **审查组**: Group 4 Finding #8

代码定义 `GateVerdict = 'PASS' | 'FAIL' | 'WARN'`，缺少 `PASS_WITH_WAIVER`。`WARN` 语义模糊，不等于"有豁免但通过"。v2-12 验收清单第 4 项明确要求三态语义正确。

**修复**: 改为 `'PASS' | 'PASS_WITH_WAIVER' | 'FAIL'`，更新所有引用处。

---

### P1-02: MatrixEntryStatus 枚举与设计不一致

- **来源**: v2-05 vs `src/core/trace-engine/types.ts` L36-42
- **审查组**: Group 4 Finding #4（衍生）

代码使用 `draft | in_progress | verified | accepted | cancelled | not_implemented`（6 值），设计定义 `Planned | Implemented | Verified | Accepted | Deferred | Cancelled | Exception`（7 值）。缺少 `Deferred` 和 `Exception`，多出 `draft`、`in_progress`、`not_implemented`。

**修复**: 对齐设计的 7 值枚举。

---

### P1-03: 代码目录结构与 v2-01 设计不一致

- **来源**: v2-01 L203-231 vs `src/`
- **审查组**: Group 4 Finding #4

设计定义 `src/cli/commands/`，实际为 `src/commands/`（无 cli/ 层级）。缺少 `router.ts`。CLI 框架使用 Commander.js 而非设计声明的"原生 process.argv 解析"。

**修复**: 更新 v2-01 目录结构和技术栈表以反映实际实现。

---

### P1-04: feature 和 commit 命令未实现

- **来源**: v2-03 vs `src/index.ts`
- **审查组**: Group 4 Finding #5

`src/index.ts` 注册了 init/spec/design/plan/implement/verify/wrap/release/gate/matrix/sca/tool/id/rfc/ai/config 共 16 个命令组，但缺少 `feature`（Feature 生命周期管理）和 `commit`（带追踪的提交）两个关键命令。v2-03 CLI 签名表明确列出了这两个命令。

**修复**: 补充 `feature.ts` 和 `commit.ts` 命令实现，或更新 v2-03 移除这两个命令。

---

### P1-05: 04_implement 阶段内子步骤顺序约束未在流程引擎中体现

- **来源**: core-04 §04 vs v2-04
- **审查组**: Group 1 Finding P1-03

需求定义 04_implement 内部有严格子步骤顺序：Code → Unit Test → Code Review → PR Merge。v2-04 流程引擎仅管理阶段间推进，未建模阶段内子步骤约束。开发者可能跳过 Code Review 直接 PR Merge。

**修复**: v2-04 补充阶段内子步骤状态机或至少在 Gate 条件中校验子步骤完成顺序。

---

### P1-06: AC 级覆盖率阈值（90%）未在设计中定义

- **来源**: core-05 §05_verify vs v2-06
- **审查组**: Group 1 Finding P1-04

需求明确 `Test Coverage(AC) ≥ 90%`（M/L 项目），v2-06 §3 阶段 Gate 条件表中虽列出但未定义如何计算 AC 级覆盖率（区别于 FR 级 100%）。v2-05 追踪矩阵设计也未说明 AC 粒度的覆盖率统计方法。

**修复**: v2-05 或 v2-06 补充 AC 级覆盖率计算公式。

---

### P1-07: Mode I 子类型未反映在 stage-state.json 中

- **来源**: core-01 §Mode vs v2-04 stage-state schema
- **审查组**: Group 1 Finding P1-05

需求定义 Mode I 有三个子类型（Ia 重构、Ib 优化、Ic 迁移），各自有不同的阶段裁剪规则。v2-04 的 `stage-state.json` schema 仅有 `mode: "I" | "N"` 字段，无法区分 Ia/Ib/Ic，导致流程引擎无法按子类型裁剪阶段。

**修复**: `stage-state.json` 增加 `modeSubtype?: "Ia" | "Ib" | "Ic"` 字段。

---

### P1-08: Init 流程未明确创建三个运行态文件

- **来源**: core-04 §00_init vs v2-04
- **审查组**: Group 1 Finding P1-06

需求定义 Init 阶段需创建 `stage-state.json`、`known-exceptions.md`、`traceability-matrix.md` 三个运行态文件。v2-04 Init 流程仅描述了 `stage-state.json` 的创建，未提及另外两个文件的初始化。

**修复**: v2-04 Init 流程补充 `known-exceptions.md` 和 `traceability-matrix.md` 的初始化步骤。

---

### P1-09: 02_design Gate 缺少 Design 覆盖率条件

- **来源**: core-05 vs v2-06 §3
- **审查组**: Group 2 Finding P1-01

需求定义 02_design Gate 需校验"设计覆盖率 = 100%（每个 FR 有对应 DS）"。v2-06 §3 阶段 Gate 条件表中 02_design 仅列出"设计评审通过；API 覆盖率 = 100%；SCA 通过"，缺少 Design 覆盖率（C1）条件。API 覆盖率 ≠ Design 覆盖率。

**修复**: v2-06 §3 的 02_design Gate 条件补充"Design 覆盖率(C1) = 100%"。

---

### P1-10: Layer A Hook 三类型被折叠为单行

- **来源**: core-05 §Layer A vs v2-06 §7
- **审查组**: Group 2 Finding P1-02

需求定义 Layer A（AI Runtime Hook）有三种类型：pre-action（阻断）、post-action（记录）、on-error（恢复）。v2-06 §7 仅用一行"Skill Phase 5 实时提示（软阻断）"概括，丢失了 post-action 和 on-error 语义。虽然 v2-06 声明"先实现 Layer B，再补 Layer A"，但设计应至少保留 Layer A 的完整接口定义。

**修复**: v2-06 §7 补充 Layer A 三种 Hook 类型的接口定义（即使标记为 Phase 2 实现）。

---

### P1-11: SCA 校验规则被简化丢失

- **来源**: core-05 §SCA vs v2-06 §4
- **审查组**: Group 2 Finding P1-03

需求定义 SCA 有 5 类校验规则（ID 唯一性、AC 完整性、FR↔DS 映射、FR↔TASK 映射、FR↔TC 映射），每类有明确的校验逻辑。v2-06 §4 仅列出触发时机和"SCA FAIL = Gate FAIL"的关系，未定义具体校验规则。v2-05 追踪矩阵设计中也未包含 SCA 规则的详细定义。

**修复**: v2-06 §4 或独立 SCA 设计文档中补充 5 类校验规则的详细定义。

---

### P1-12: Critical 变更审批降级

- **来源**: core-05 §变更管理 vs v2-07
- **审查组**: Group 2 Finding P1-04

需求定义 Critical 变更（影响 ≥3 个 FR 或架构变更）需"Tech Lead + PM 双签"。v2-07 将审批简化为"owner 审批即可"，丢失了双签约束。对于高影响变更，单人审批风险过高。

**修复**: v2-07 补充 Critical 变更的双签审批流程。

---

### P1-13: RFC approve/reject 语义路由未在设计中落地

- **来源**: core-05 §RFC vs v2-07
- **审查组**: Group 2 Finding P1-05

需求定义 RFC 有完整生命周期：draft → review → approved/rejected → closed。v2-07 仅描述了 RFC 创建和关联豁免的流程，未定义 approve/reject 的状态转换逻辑和权限校验。`spec-first rfc approve` 命令的后端逻辑缺失。

**修复**: v2-07 补充 RFC 状态机和 approve/reject 权限校验逻辑。

---

### P1-14: `ai context` 命令签名设计超出需求

- **来源**: aux-02 vs v2-08
- **审查组**: Group 3 Finding #02

v2-08 设计了 `ai context build/export/clean` 三个子命令，但 aux-02 需求仅定义了 `ai context`（无子命令）。设计超出需求范围，增加了不必要的复杂度。

**修复**: v2-08 简化为需求定义的单一 `ai context` 命令，或在 aux-02 中补充子命令需求。

---

### P1-15: Layer 2 YAML 顶层字段名与 Gate ID 格式双重不一致

- **来源**: aux-03 vs v2-09
- **审查组**: Group 3 Finding #03

需求定义 YAML 顶层字段为 `stages`（复数），v2-09 使用 `stage`（单数）。需求定义 Gate ID 格式为 `GATE-<stageId>-<seq>`，v2-09 使用 `gate_<stageId>_<seq>`（下划线分隔、小写前缀）。两处不一致将导致 YAML 解析器和 Gate 引擎匹配失败。

**修复**: v2-09 统一为需求定义的 `stages`（复数）和 `GATE-<stageId>-<seq>` 格式。

---

### P1-16: 度量数据存储格式不一致

- **来源**: aux-05 vs v2-11
- **审查组**: Group 4 Finding #6

需求定义度量快照存储为 `metrics-history.jsonl`（JSONL 追加格式），v2-11 设计使用 `metrics-snapshot.json`（单文件覆盖写入）。JSONL 支持历史趋势分析，单文件覆盖会丢失历史数据。代码实现 `MetricsEngine` 使用了第三种方式（内存计算，无持久化）。

**修复**: 统一为 JSONL 追加格式，代码补充持久化逻辑。

---

### P1-17: 瓶颈分析规则 R1-R5 未在代码中实现

- **来源**: aux-05 vs v2-11 vs `src/core/metrics-engine/`
- **审查组**: Group 4 Finding #7

需求定义 5 条瓶颈分析规则（R1: 阶段停留超时、R2: 覆盖率下降、R3: 豁免堆积、R4: 返工率异常、R5: Gate 连续失败）。v2-11 设计了 `analyzeBottlenecks()` 函数签名，但代码中 `MetricsEngine` 完全未实现瓶颈分析功能。

**修复**: 实现 `analyzeBottlenecks()` 函数，按 R1-R5 规则检测瓶颈。

---

## P2 — 建议修（22 项）

| # | 问题 | 来源 | 审查组 | 修复建议 |
|---|------|------|--------|----------|
| P2-01 | v2-01 缺少 Error Handling 策略章节 | core-02 vs v2-01 | G1 | v2-01 补充错误处理策略（错误分类、重试、降级） |
| P2-02 | v2-01 未定义模块间依赖关系图 | core-02 vs v2-01 | G1 | v2-01 补充 M1-M7 模块依赖 DAG |
| P2-03 | v2-04 阶段推进缺少回退机制设计 | core-04 vs v2-04 | G1 | v2-04 补充 `stage rollback` 逻辑（至少支持回退到上一阶段） |
| P2-04 | v2-04 未定义并发 Feature 的隔离策略 | core-04 vs v2-04 | G1 | v2-04 说明多 Feature 并行时的文件锁/冲突检测 |
| P2-05 | v2-05 矩阵列 `API Ref` 缺少格式定义 | core-03 vs v2-05 | G1 | v2-05 定义 API Ref 格式（如 `api:<method>:<path>`） |
| P2-06 | v2-05 未定义矩阵条目的删除/归档策略 | core-03 vs v2-05 | G1 | v2-05 补充条目生命周期（Cancelled/Exception 的归档规则） |
| P2-07 | v2-05 追踪链完整性校验缺少反向校验 | core-03 vs v2-05 | G1 | v2-05 补充反向校验（DS→FR、TASK→FR 反向链路） |
| P2-08 | v2-05 未定义矩阵版本控制策略 | core-03 vs v2-05 | G1 | v2-05 说明矩阵文件的版本管理（Git diff 友好格式） |
| P2-09 | v2-06 Gate 条件未区分 auto/manual 评估方式 | core-05 vs v2-06 | G2 | v2-06 §3 每个条件标注评估方式（auto/manual） |
| P2-10 | v2-06 SCA 增量模式未定义变更范围计算 | core-05 vs v2-06 | G2 | v2-06 §4 补充增量 SCA 的变更范围检测逻辑 |
| P2-11 | v2-06 安全扫描工具链未指定 | core-05 vs v2-06 | G2 | v2-06 §5 指定安全扫描工具（如 npm audit / Snyk） |
| P2-12 | v2-06 Gate History 缺少查询接口设计 | core-05 vs v2-06 | G2 | v2-06 §8 补充 `gate history` 查询命令设计 |
| P2-13 | v2-07 RFC 模板缺少 impact_analysis 字段 | core-05 vs v2-07 | G2 | v2-07 RFC 模板补充影响分析（受影响 FR/DS/TASK 列表） |
| P2-14 | v2-07 变更分级阈值未量化 | core-05 vs v2-07 | G2 | v2-07 明确 Minor/Major/Critical 的量化边界 |
| P2-15 | v2-07 变更历史缺少持久化设计 | core-05 vs v2-07 | G2 | v2-07 补充 `rfc-history.jsonl` 存储设计 |
| P2-16 | v2-08 Skill Phase 定义与 aux-01 不完全对齐 | aux-01 vs v2-08 | G3 | v2-08 逐一对照 aux-01 的 16 个 Skill 定义，补齐缺失 Phase |
| P2-17 | v2-09 平台 YAML 缺少 schema 校验设计 | aux-03 vs v2-09 | G3 | v2-09 补充 YAML schema 校验（JSON Schema 或 Zod） |
| P2-18 | v2-09 未定义 YAML 合并冲突解决策略 | aux-03 vs v2-09 | G3 | v2-09 补充三层合并的冲突优先级规则 |
| P2-19 | v2-09 缺少平台 YAML 示例文件 | aux-03 vs v2-09 | G3 | v2-09 附录补充完整 YAML 示例（含所有字段） |
| P2-20 | v2-10 产出物模板缺少版本号 | aux-04 vs v2-10 | G4 | v2-10 每个模板标注版本号和最后更新日期 |
| P2-21 | v2-11 度量仪表盘输出格式未定义 | aux-05 vs v2-11 | G4 | v2-11 定义 `metrics dashboard` 的输出格式（terminal table / JSON / HTML） |
| P2-22 | v2-12 GoLive Gate GL-01~GL-04 与 v2-06 §3 的 07_release Gate 条件不完全对齐 | aux-06 vs v2-12 vs v2-06 | G4 | 统一 v2-12 GL gates 与 v2-06 §3 07_release 条件 |

---

## 六要素完整性检查

每份技术方案应包含 6 个核心要素：① 数据结构/Schema ② 核心算法/流程 ③ 接口签名 ④ 错误处理 ⑤ 边界条件 ⑥ 最小实现清单。

| 技术方案 | ① Schema | ② 算法/流程 | ③ 接口签名 | ④ 错误处理 | ⑤ 边界条件 | ⑥ 实现清单 | 完整度 |
|---------|----------|------------|-----------|-----------|-----------|-----------|--------|
| v2-01 总体架构 | ✅ | ✅ | ✅ | ⚠️ 缺策略 | ⚠️ | ✅ | 4/6 |
| v2-02 Skill 编排 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6/6 |
| v2-03 CLI 框架 | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | 5/6 |
| v2-04 流程引擎 | ✅ | ✅ | ✅ | ⚠️ 缺回退 | ❌ 缺并发 | ✅ | 4/6 |
| v2-05 追踪矩阵 | ⚠️ 列名冲突 | ✅ | ✅ | ✅ | ⚠️ | ✅ | 4/6 |
| v2-06 质量门禁 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6/6 |
| v2-07 变更管理 | ✅ | ⚠️ 审批降级 | ✅ | ⚠️ | ⚠️ | ✅ | 3/6 |
| v2-08 AI 集成 | ✅ | ✅ | ⚠️ 超需求 | ✅ | ✅ | ✅ | 5/6 |
| v2-09 多端适配 | ⚠️ 字段缺失 | ✅ | ✅ | ✅ | ⚠️ | ✅ | 4/6 |
| v2-10 产出物模板 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6/6 |
| v2-11 度量引擎 | ⚠️ 与代码脱节 | ⚠️ 公式不一致 | ✅ | ⚠️ | ⚠️ | ✅ | 2/6 |
| v2-12 上线路线图 | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | 5/6 |

---

## 修复优先级建议

### 第一批：P0 阻断（开发前必须修复）

| 优先级 | 修复项 | 涉及文件 | 预估影响范围 |
|--------|--------|---------|-------------|
| 1 | P0-01 度量指标体系重写 | v2-11 + `src/core/metrics-engine/` | 指标注册、计算、展示全链路 |
| 2 | P0-02 健康分公式重写 | v2-11 + `src/core/metrics-engine/health-scorer.ts` | 健康分计算 + 等级判定 |
| 3 | P0-03 CoverageType 统一 | `src/shared/types.ts` + `src/core/trace-engine/types.ts` | 覆盖率计算全链路 |
| 4 | P0-04 追踪矩阵列名统一 | core-03 或 v2-05 | 矩阵解析器 |
| 5 | P0-05 Known Exception 字段补全 | v2-05 | 豁免校验逻辑 |
| 6 | P0-06 Layer 2 YAML Schema 补全 | v2-09 | Gate 评估链路 |

### 第二批：P1 必修（开发首周内修复）

| 优先级 | 修复项 | 涉及文件 |
|--------|--------|---------|
| 7 | P1-01 GateVerdict 补 PASS_WITH_WAIVER | `src/shared/types.ts` + 所有引用处 |
| 8 | P1-02 MatrixEntryStatus 对齐 7 值枚举 | `src/core/trace-engine/types.ts` |
| 9 | P1-03 目录结构/技术栈表更新 | v2-01 |
| 10 | P1-04 feature/commit 命令补实现 | `src/commands/` 或 v2-03 |
| 11 | P1-05 阶段内子步骤约束 | v2-04 |
| 12 | P1-06 AC 级覆盖率计算公式 | v2-05 或 v2-06 |
| 13 | P1-07 Mode I 子类型字段 | v2-04 stage-state schema |
| 14 | P1-08 Init 三文件初始化 | v2-04 |
| 15 | P1-09 Design 覆盖率 Gate 条件 | v2-06 §3 |
| 16 | P1-10 Layer A Hook 接口定义 | v2-06 §7 |
| 17 | P1-11 SCA 校验规则详细定义 | v2-06 §4 |
| 18 | P1-12 Critical 变更双签审批 | v2-07 |
| 19 | P1-13 RFC 状态机设计 | v2-07 |
| 20 | P1-14 ai context 命令简化 | v2-08 或 aux-02 |
| 21 | P1-15 YAML 字段名/Gate ID 统一 | v2-09 |
| 22 | P1-16 度量存储格式统一 | v2-11 + 代码 |
| 23 | P1-17 瓶颈分析规则实现 | `src/core/metrics-engine/` |

### 第三批：P2 建议修（开发过程中逐步完善）

P2 共 22 项，均为文档完整性/规范性问题，不阻断开发但增加实现风险。建议按涉及文件聚合修复：

| 聚合组 | 涉及 P2 项 | 涉及文件 |
|--------|-----------|---------|
| 架构补全 | P2-01, P2-02 | v2-01 |
| 流程引擎补全 | P2-03, P2-04 | v2-04 |
| 追踪矩阵补全 | P2-05 ~ P2-08 | v2-05 |
| 质量门禁补全 | P2-09 ~ P2-12 | v2-06 |
| 变更管理补全 | P2-13 ~ P2-15 | v2-07 |
| Skill/多端补全 | P2-16 ~ P2-19 | v2-08, v2-09 |
| 产出物/度量/路线图 | P2-20 ~ P2-22 | v2-10, v2-11, v2-12 |

---

## 核心结论

### 整体评估

12 份技术方案的整体架构设计合理，模块划分清晰，KISS 原则贯彻较好。主要问题集中在三个方面：

1. **代码实现与设计脱节**（P0-01/02/03, P1-01/02/17）：度量引擎模块的代码实现与需求/设计定义完全不同，是最严重的阻断项。需要在开发前彻底重写对齐。

2. **数据契约不一致**（P0-04/05/06, P1-15）：追踪矩阵列名、Known Exception 字段、YAML Schema 字段等数据契约在需求与设计之间存在冲突，将直接导致解析器/引擎运行失败。

3. **设计细节缺失**（P1-05~P1-13, P2 全部）：部分设计文档对需求的覆盖不够细致，缺少子步骤约束、计算公式、状态机等关键细节。不阻断但增加实现偏差风险。

### 签核建议

- **不建议直接进入开发**。需先修复 6 项 P0 阻断问题。
- P0 修复完成后，可启动开发，同时在首周内并行修复 17 项 P1。
- P2 项可在开发过程中逐步完善，不阻断开发节奏。

### 代码质量补充说明

`src/core/tool-integration/git-hooks.ts` 存在重复常量声明（`COMMIT_MSG_HOOK` 和 `PRE_PUSH_HOOK` 在 L19-20 和 L23-24 各声明一次），会导致编译错误，需在开发前修复。

---

> **审查人**: Claude Opus 4.6 × 4 并行 Agent
> **审查完成时间**: 2026-02-11
> **下次审查触发条件**: P0 全部修复后进行复审
