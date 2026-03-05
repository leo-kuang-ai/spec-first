# 技术设计：spec-first:spec 命令优化

> Feature ID: FSREQ-20260305-SPECOPT-001
> 版本: v1.0
> 状态: Draft
> 创建时间: 2026-03-05

---

## 1. 架构概览

### 1.1 设计目标

将 `/spec-first:spec` 从简单的 P0-P5 流程升级为结构化的 Phase 0 + Step 0-8 流程，支持：
- 四档复杂度分流（Trivial/Simple/Moderate/Complex）
- PRD 必产物与质量门禁
- Step 级会话恢复
- PRD→FR 追溯链

### 1.2 模块划分

| 模块 | 职责 | 受影响文件 |
|------|------|-----------|
| Skill 流程引擎 | Phase 0 + Step 0-8 执行逻辑 | `skills/spec-first/03-spec/SKILL.md` |
| PRD 验证器 | 章节完整性、场景校验、C-PRD 评分 | `src/core/gate-engine/prd-validator.ts` |
| Gate 引擎 | G-SPEC-00 门禁、C-PRD 阈值校验 | `src/core/gate-engine/gate-evaluator.ts` |
| 产物检查器 | prd.md 必需产物校验 | `src/core/template/artifact-checker.ts` |
| 追溯引擎 | PRD→FR 映射检查 | `src/core/trace-engine/matrix.ts` |
| 一致性分析 | PRD 产物检查 | `src/core/gate-engine/sca.ts` |
| 上下文恢复 | Step 级状态恢复 | `src/core/ai-orchestrator/catchup.ts` |
| 初始化引擎 | PRD 骨架预置 | `src/core/process-engine/init.ts` |

---

## 2. 设计规格（DS）

### DS-SPECOPT-001: 四档复杂度分流机制

**映射**: FR-SPEC-OPT-001

**模块**: Skill 流程引擎 (Step 2)

**设计方案**:
- 在 Step 2 执行复杂度判定
- 判定维度：受影响文件数、歧义点数量、方案分支数、外部依赖数
- 多维取最高档规则
- 判定结果写入 findings.md 状态头

**数据结构**:
```yaml
complexity: "Trivial" | "Simple" | "Moderate" | "Complex"
complexity_metrics:
  affected_files: number
  ambiguity_points: number
  solution_branches: number
  external_dependencies: number
```

**关键约束**:
- 边界情况向上取整（保守策略）
- 判定依据必须可量化、可复核

---

### DS-SPECOPT-002: Question Gate 问题门禁

**映射**: FR-SPEC-OPT-002

**模块**: Skill 流程引擎 (Step 3)

**设计方案**:
- Step 3 执行问题门禁检查
- 先检查可推导性，再决定是否提问
- 问题分类：Blocking（阻断级）/ Preference（偏好级）
- 优先级排序：范围 > 安全 > 合规 > UX > 技术偏好

**接口**:
```typescript
interface Question {
  type: 'Blocking' | 'Preference';
  priority: number;
  question: string;
  candidates: string[];
  derivable: boolean;
}
```

**关键约束**:
- 可推导问题禁止向用户提问
- 每轮最多 3 个问题

---

### DS-SPECOPT-003: 一问一答收敛机制

**映射**: FR-SPEC-OPT-003

**模块**: Skill 流程引擎 (Step 6)

**设计方案**:
- Step 6 收敛阶段：单条消息最多 1 个问题
- Step 1-5 发散阶段：单条消息最多 3 个问题
- 每轮答案回写 spec.md

**关键约束**:
- Step 6 严格单问
- 答案必须落盘

---

### DS-SPECOPT-004: Research-first 触发器

**映射**: FR-SPEC-OPT-004

**模块**: Skill 流程引擎 (Step 4)

**设计方案**:
- 检测技术选型需求
- 触发 `/spec-first:research` skill
- 输出至少 2 个方案对比
- 决策结果写入 ADR-lite

**触发条件**:
- 复杂度为 Moderate 或 Complex
- 存在技术选型或方案分歧

---

### DS-SPECOPT-005: Expansion Sweep 发散扫描

**映射**: FR-SPEC-OPT-005

**模块**: Skill 流程引擎 (Step 5)

**设计方案**:
- 三类检查：未来演进、相关场景、失败/边界
- 扫描结果分类：纳入 MVP / Out of Scope

**数据结构**:
```typescript
interface ExpansionResult {
  future_evolution: string[];
  related_scenarios: string[];
  failure_boundaries: string[];
  mvp_scope: string[];
  out_of_scope: string[];
}
```

---

### DS-SPECOPT-006: 最终确认包模板

**映射**: FR-SPEC-OPT-006

**模块**: Skill 流程引擎 (Step 8)

**设计方案**:
- 固定结构：Goal / Requirements / AC / DoD / Out of Scope / Implementation Plan
- 用户确认后方可落盘

**模板路径**: `skills/spec-first/03-spec/references/final-confirmation-template.md`

---

### DS-SPECOPT-007: Gate 质量基线保持

**映射**: FR-SPEC-OPT-007

**模块**: Gate 引擎

**设计方案**:
- 保持 G-SPEC-03 (C10>=80%) 不弱化
- 新增 G-SPEC-00 (PRD 门禁)
- 允许调整 AC ID 格式，但不降低门禁标准

---

### DS-SPECOPT-008: 反模式硬约束

**映射**: FR-SPEC-OPT-008

**模块**: Skill 流程引擎

**设计方案**:
- 禁止向用户提问可推导信息
- 禁止元问题（"是否要调研"）
- Step 6 禁止多问并发

**实现方式**: Skill 文档中的反合理化表 + 字面即精神原则

---

### DS-SPECOPT-009: 阶段衔接输出

**映射**: FR-SPEC-OPT-009

**模块**: Skill 流程引擎 (Step 8)

**设计方案**:
- 输出结构化衔接包
- 包含：需求摘要、关键决策、实施计划、Out of Scope
- 可直接被后续阶段引用

---

### DS-SPECOPT-010: 交互模式唯一化

**映射**: FR-SPEC-OPT-010

**模块**: Skill 流程引擎

**设计方案**:
- 仅保留 Trellis 原生交互模式
- 关键决策必须用户确认
- AI 可自主完成检索和调研，但不得跳过确认

---

### DS-SPECOPT-011: Phase 0 PRD 必产物

**映射**: FR-SPEC-OPT-011

**模块**: Skill 流程引擎 (Phase 0) + 产物检查器

**设计方案**:
- Phase 0 强制产出 prd.md
- 未产出 PRD 阻断进入 Step 0
- artifact-checker 纳入 prd.md 为 01_specify 必需产物

**数据模型**:
```yaml
# prd.md 元信息
scenario: "greenfield" | "iteration"
scenario_reason: string
evidence_paths: string[]
complexity: "Trivial" | "Simple" | "Moderate" | "Complex"
```

---

### DS-SPECOPT-012: 两类场景 PRD 模板

**映射**: FR-SPEC-OPT-012

**模块**: Skill 流程引擎 (Phase 0.2, 0.3)

**设计方案**:
- 场景 A（greenfield）：问题定义、目标用户、MVP 范围、成功指标
- 场景 B（iteration）：As-Is、To-Be、影响范围、现有实现证据、验证策略
- 自动判定场景类型

**模板路径**:
- `skills/spec-first/03-spec/references/prd-template-greenfield.md`
- `skills/spec-first/03-spec/references/prd-template-iteration.md`

---

### DS-SPECOPT-013: PRD 门禁（G-SPEC-00）

**映射**: FR-SPEC-OPT-013

**模块**: Gate 引擎

**设计方案**:
- 在 01_specify 阶段新增 G-SPEC-00
- 检查 prd.md 存在性 + 必需章节完整性
- PRD 不完整时返回 FAIL/BLOCKED

**接口**:
```typescript
interface GateResult {
  id: 'G-SPEC-00';
  passed: boolean;
  message: string;
  details: {
    prd_exists: boolean;
    required_sections: string[];
    missing_sections: string[];
  };
}
```

---

### DS-SPECOPT-014: PRD 清晰度评分（C-PRD）

**映射**: FR-SPEC-OPT-014

**模块**: PRD 验证器

**设计方案**:
- 评分维度：完整性、可验证性、可追溯性、边界明确性、可收敛性（等权 20%）
- 评分算法：C-PRD = Σ(维度得分 × 20%)
- 阈值：C-PRD >= 85%

**接口**:
```typescript
interface PrdValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  metadata: PrdMetadata;
}

function validatePrd(prdPath: string): PrdValidationResult;
```

**实现文件**: `src/core/gate-engine/prd-validator.ts`

---

### DS-SPECOPT-015: PRD→FR 追溯映射

**映射**: FR-SPEC-OPT-015

**模块**: 追溯引擎

**设计方案**:
- 每个 FR 包含 upstream: [REQ-PRD-xxx, ...]
- traceability-matrix.md 包含 PRD→FR 映射列
- 允许 1:1、N:1、1:N 映射，但每个 FR 至少 1 条 upstream

**数据结构**:
```typescript
interface TraceabilityEntry {
  id: string;
  type: 'REQ-PRD' | 'FR' | 'DS' | 'TASK' | 'TC';
  title: string;
  status: string;
  upstream: string[];
  downstream: string[];
}
```

**实现**: `src/core/trace-engine/matrix.ts` 新增 PRD→FR 映射检查

---

## 3. 接口设计

### 3.1 PRD 验证器接口

**文件**: `src/core/gate-engine/prd-validator.ts`

```typescript
export function validatePrd(prdPath: string): PrdValidationResult;
export function parseMetadata(content: string): PrdMetadata;
export function checkSections(content: string, meta: PrdMetadata): { errors: string[]; warnings: string[] };
export function validateScenario(meta: PrdMetadata): string[];
export function calculateScore(content: string, meta: PrdMetadata, errors: string[], warnings: string[]): number;
```

### 3.2 Gate 引擎接口

**文件**: `src/core/gate-engine/gate-evaluator.ts`

```typescript
// 新增 G-SPEC-00 门禁
export function checkPrdGate(featureId: string, stage: string): GateCheckResult;
```

### 3.3 产物检查器接口

**文件**: `src/core/template/artifact-checker.ts`

```typescript
// 纳入 prd.md 为 01_specify 必需产物
export function checkArtifacts(featureId: string, stage: string): ArtifactCheckResult;
```

---

## 4. 数据模型

### 4.1 findings.md 状态头

```yaml
---
current_step: "Step 0" | "Step 1" | ... | "Step 8"
completed_steps: string[]
skipped_steps: string[]
next_step: string
complexity: "Trivial" | "Simple" | "Moderate" | "Complex" | "pending"
scenario: "greenfield" | "iteration"
last_updated: ISO8601
---
```

### 4.2 PRD 元信息

```yaml
---
scenario: "greenfield" | "iteration"
scenario_reason: string
evidence_paths: string[]
complexity: "Trivial" | "Simple" | "Moderate" | "Complex"
created_at: ISO8601
last_updated: ISO8601
---
```

---

## 5. 一致性策略

### 5.1 PRD→FR 追溯链

- PRD 中的 REQ-PRD-xxx 条目必须被至少 1 个 FR 引用
- 每个 FR 必须有至少 1 条 REQ-PRD-* upstream 引用
- traceability-matrix.md 包含完整映射

### 5.2 复杂度一致性

- PRD 元信息中的 complexity 字段在 Phase 0 默认为 "pending"
- Step 2 完成后回填实际档位
- findings.md 状态头与 PRD 元信息保持同步

---

## 6. 回滚策略

### 6.1 PRD 门禁失败

- C-PRD < 85% 时阻断进入 Step 0
- 返回详细评分报告，指出缺失章节和扣分项
- 用户修正 PRD 后重新执行 Phase 0.4

### 6.2 Gate Check 失败

- G-SPEC-00 失败时返回 FAIL/BLOCKED
- 提供修复建议（补齐 PRD 章节）
- 不允许"先写 spec 后补 PRD"

---

## 7. 非功能需求

### 7.1 性能

- PRD 生成时间 < 30s
- C-PRD 评分计算 < 3s
- 复杂度判定 < 5s

### 7.2 可审计性

- 每个 Step 有落盘痕迹（findings.md）
- 跳过的 Step 必须记录 SKIPPED + 理由

### 7.3 可恢复性

- findings.md 状态头支持 Step 级恢复
- catchup 可读取状态头并恢复到具体 Step

---

## 8. 参考资料

- `specs/FSREQ-20260305-SPECOPT-001/prd.md`
- `specs/FSREQ-20260305-SPECOPT-001/spec.md`
- `skills/spec-first/03-spec/SKILL.md` (v2.0.0)
- `skills/spec-first/03-spec/references/*.md`
- `src/core/gate-engine/prd-validator.ts`
- `src/core/gate-engine/gate-evaluator.ts`
- `src/core/template/artifact-checker.ts`
- `src/core/trace-engine/matrix.ts`


## 9. Constitution 合规性

本设计遵循项目宪法约束：

**Constitution Clause 1.0 (v1.0.0)**: 技术约束
- Node.js 20+
- TypeScript ESM
- 单元测试覆盖率 >= 80%

**Constitution Clause 2.0 (v1.0.0)**: 质量基线
- 单元测试覆盖率 >= 80%
- 无 P0/P1 review findings before merge

**Constitution Clause 3.0 (v1.0.0)**: 流程规则
- API contract before implementation
- Traceability required for TASK and PR

本设计所有模块均符合上述宪法条款。

