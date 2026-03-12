# C1-C11 覆盖率指标全链路文档

## 概述

Spec-First 使用 C1-C11 共 11 项指标追踪需求从规格到实现的全链路覆盖率和合规性。

**指标分类**：
- **C1-C6**: 正向覆盖率（需求 → 设计 → 任务 → 测试 → 实现）
- **C7-C9**: 反向合规率（防止孤儿任务/测试）
- **C10-C11**: 质量门禁（规格质量、架构合规）
- **C-PRD**: PRD 完整性

---

## 第一部分：C1-C6 正向覆盖率

### C1: Design Coverage (设计覆盖率)

**定义**: FR 中有 DS 映射的比例

**计算公式**:
```
C1 = (有 DS 关联的 FR 数量) / (总 FR 数量)
```

**生成节点**: `src/core/trace-engine/coverage.ts:48-51`

**计算逻辑**:
1. 遍历所有 DS 行的 `upstream` 字段
2. 收集被引用的 FR ID
3. 计算覆盖比例

**Gate 检查**: `02_design` 阶段
- 条件 ID: `G-DESIGN-02`
- 阈值: 100%
- 描述: "Design coverage (C2) = 100%"
- 位置: `gate-evaluator.ts:139-151`

**支持豁免**: ✅ 是
- 返回 `scopeFrIds`: 未覆盖的 FR ID 列表

---

### C2: API Coverage (API 覆盖率)

**定义**: FR 中有 API 相关 DS 映射的比例（当前实现同 C1）

**计算公式**:
```
C2 = (有 DS 关联的 FR 数量) / (总 FR 数量)
```

**生成节点**: `src/core/trace-engine/coverage.ts:53-56`

**计算逻辑**: 同 C1（DS 包含 API 设计）

**Gate 检查**: `02_design` 阶段
- 条件 ID: `G-DESIGN-02`
- 阈值: 100%
- 位置: `gate-evaluator.ts:139-151`

**支持豁免**: ✅ 是
- 返回 `scopeFrIds`: 未覆盖的 FR ID 列表

---

### C3: Task Coverage (任务覆盖率)

**定义**: FR 中有 TASK 映射的比例

**计算公式**:
```
C3 = (有 TASK 关联的 FR 数量) / (总 FR 数量)
```

**生成节点**: `src/core/trace-engine/coverage.ts:58-74`

**计算逻辑**:
1. 使用 `UpstreamLineage` 追踪传递关系
2. TASK → DS → FR 的间接关联也计入
3. 收集被覆盖的 FR ID

**Gate 检查**: `03_plan` 阶段
- 条件 ID: `G-PLAN-01`
- 阈值: 100%
- 描述: "Task coverage (C3) = 100%"
- 位置: `gate-evaluator.ts:167-180`

**支持豁免**: ✅ 是
- 返回 `scopeFrIds`: 未覆盖的 FR ID 列表

---

### C4: Test Coverage FR (测试覆盖率-功能需求)

**定义**: FR 中有 TC 映射的比例

**计算公式**:
```
C4 = (有 TC 关联的 FR 数量) / (总 FR 数量)
```

**生成节点**: `src/core/trace-engine/coverage.ts:76-79`

**计算逻辑**:
1. 遍历所有 TC 行的 `upstream` 字段
2. 收集被引用的 FR ID
3. 计算覆盖比例

**Gate 检查**:
- **04_implement 阶段**:
  - 条件 ID: `G-IMPL-01`
  - 阈值: ≥ 80%
  - 位置: `gate-evaluator.ts:203-216`

- **05_verify 阶段**:
  - 条件 ID: `G-VERIFY-01`
  - 阈值: 100%
  - 位置: `gate-evaluator.ts:231-244`

**支持豁免**: ✅ 是
- 返回 `scopeFrIds`: 未覆盖的 FR ID 列表

---

### C5: Test Coverage AC (测试覆盖率-验收标准)

**定义**: FR 中有 AC 级别 TC 映射的比例（当前实现同 C4）

**计算公式**:
```
C5 = (有 TC 关联的 FR 数量) / (总 FR 数量)
```

**生成节点**: `src/core/trace-engine/coverage.ts:81-84`

**计算逻辑**: 同 C4（AC 级别细化留给 Phase B）

**Gate 检查**: `05_verify` 阶段
- 条件 ID: `G-VERIFY-02`
- 阈值:
  - S 项目: ≥ 60%
  - M/L 项目: ≥ 90%
- 位置: `gate-evaluator.ts:247-261`

**支持豁免**: ✅ 是
- 返回 `scopeFrIds`: 未覆盖的 FR ID 列表

---

### C6: Implementation Coverage (实现覆盖率)

**定义**: TASK 中状态为 Implemented/Verified/Accepted 的比例

**计算公式**:
```
C6 = (已实现 TASK 数量) / (总 TASK 数量)
```

**生成节点**: `src/core/trace-engine/coverage.ts:86-93`

**计算逻辑**:
1. 统计状态为 `Implemented`、`Verified`、`Accepted` 的 TASK
2. 计算比例

**Gate 检查**: `06_wrap_up` 阶段
- 条件 ID: `G-WRAP-01`
- 阈值: 100%
- 位置: `gate-evaluator.ts:276-281`

**支持豁免**: ❌ 否
- 不返回 `scopeFrIds`
- 归档阶段不应豁免实现覆盖率

---

## 第二部分：C7-C9 反向合规率

### C7: PR Compliance (PR 合规率)

**定义**: TASK 中有上游 FR 关联的比例

**计算公式**:
```
C7 = (有 upstream 的 TASK 数量) / (总 TASK 数量)
```

**生成节点**: `src/core/trace-engine/coverage.ts:97-102`

**计算逻辑**:
1. 统计 `upstream` 字段非空的 TASK
2. 计算比例

**Gate 检查**: `04_implement` 阶段
- 条件 ID: `G-IMPL-02`
- 阈值: 100%
- 位置: `gate-evaluator.ts:219-224`

**支持豁免**: ❌ 否
- 不返回 `scopeFrIds`

---

### C8: Task Compliance (任务合规率)

**定义**: TASK 有上游 FR/NFR/DS 的比例（防止孤儿 TASK）

**计算公式**:
```
C8 = (有上游关联的 TASK 数量) / (总 TASK 数量)
```

**生成节点**: `src/core/trace-engine/coverage.ts:104-139`

**计算逻辑**:
1. 允许的上游类型：FR、DS、NFR-TAG
2. 支持通过 `UpstreamLineage` 的传递关联
3. 支持 NFR 标签关联（如 `NFR-PERF`）

**Gate 检查**: `03_plan` 阶段
- 条件 ID: `G-PLAN-02`
- 阈值: 100%
- 位置: `gate-evaluator.ts:183-188`

**支持豁免**: ❌ 否
- 不返回 `scopeFrIds`

---

### C9: TC Compliance (测试用例合规率)

**定义**: TC 有上游 FR 的比例（防止孤儿 TC）

**计算公式**:
```
C9 = (有 FR 关联的 TC 数量) / (总 TC 数量)
```

**生成节点**: `src/core/trace-engine/coverage.ts:141-147`

**计算逻辑**:
1. 检查 TC 的 `upstream` 字段
2. 验证是否包含 FR ID

**Gate 检查**: `05_verify` 阶段
- 条件 ID: `G-VERIFY-03`
- 阈值: 100%
- 位置: `gate-evaluator.ts:264-269`

**支持豁免**: ❌ 否
- 不返回 `scopeFrIds`


---

## 第三部分：C10-C11 质量门禁

### C10: Spec Quality Score (规格质量分数)

**定义**: Spec 质量评审清单的通过率

**计算公式**:
```
C10 = (通过的检查项) / (总检查项)
或显式标记: C10=XX%
```

**生成节点**: `src/core/gate-engine/gate-evaluator.ts:486-528`

**计算逻辑**:
1. 读取 `checklists/spec-review.md`
2. 统计 `- [x]` 和 `- [ ]` 格式的检查项
3. 或解析显式的 `C10=XX%` 标记

**Gate 检查**: `01_specify` 阶段
- 条件 ID: `G-SPEC-03`
- 阈值: ≥ 80%
- 位置: `gate-evaluator.ts:119-124`

**支持豁免**: ✅ 是（已修复）
- 返回 `scopeFrIds`: 所有 FR ID

---

### C11: Constitution Compliance (架构合规性)

**定义**: Constitution 文档的合规性检查

**计算公式**: 基于 `constitution.md` 的评估逻辑

**生成节点**: `src/core/gate-engine/gate-evaluator.ts:530-572`

**计算逻辑**:
1. 读取 `constitution.md`
2. 检查必需章节和内容
3. 计算合规分数

**Gate 检查**: `02_design` 阶段
- 条件 ID: `G-DESIGN-03`
- 阈值: 通过
- 位置: `gate-evaluator.ts:155-160`

**支持豁免**: ❌ 否
- 不返回 `scopeFrIds`

---

### C-PRD: PRD Completeness (PRD 完整性)

**定义**: PRD 文档的章节完整性分数

**计算公式**:
```
C-PRD = 章节完整性 × 20% × 5
必需章节：业务目标、功能需求、非功能需求、开放问题、术语表
```

**生成节点**: `src/core/gate-engine/prd-validator.ts`

**计算逻辑**:
1. 检查 5 个必需章节是否存在
2. 每个章节 20 分
3. 总分 100 分

**Gate 检查**: `01_specify` 阶段
- 条件 ID: `G-SPEC-00`
- 阈值: ≥ 85%
- 位置: `gate-evaluator.ts:86-100`

**支持豁免**: ✅ 是（已修复）
- 返回 `scopeFrIds`: 所有 FR ID


---

## 第四部分：全链路流程图

### 阶段与指标检查点

```
00_init (初始化)
  └─ 无覆盖率检查

01_specify (需求规格)
  ├─ G-SPEC-00: C-PRD ≥ 85% ✅ 支持豁免
  ├─ G-SPEC-01: spec.md 存在
  ├─ G-SPEC-02: FR/NFR IDs 已分配
  └─ G-SPEC-03: C10 ≥ 80% ✅ 支持豁免

02_design (技术设计)
  ├─ G-DESIGN-01: design.md 存在
  ├─ G-DESIGN-02: C1/C2 = 100% ✅ 支持豁免
  └─ G-DESIGN-03: C11 合规

03_plan (任务拆解)
  ├─ G-PLAN-01: C3 = 100% ✅ 支持豁免
  ├─ G-PLAN-02: C8 = 100%
  └─ G-PLAN-03: 分析 CRITICAL findings = 0

04_implement (代码实现)
  ├─ G-IMPL-01: C4 ≥ 80% ✅ 支持豁免
  └─ G-IMPL-02: C7 = 100%

05_verify (验收测试)
  ├─ G-VERIFY-01: C4 = 100% ✅ 支持豁免
  ├─ G-VERIFY-02: C5 ≥ 90% (M/L) / ≥ 60% (S) ✅ 支持豁免
  └─ G-VERIFY-03: C9 = 100%

06_wrap_up (归档复盘)
  ├─ G-WRAP-01: C6 = 100%
  └─ G-WRAP-02: 所有条目终态

07_release (发布上线)
  ├─ G-REL-01: release-note.md 存在
  └─ G-REL-02: smoke-test-report.md 存在

08_done (完成)
  └─ 终态，无检查
```


---

## 第五部分：豁免机制详解

### 支持豁免的指标

| 指标 | 阶段 | 条件 ID | 原因 |
|------|------|---------|------|
| C-PRD | 01_specify | G-SPEC-00 | PRD 内容完整但格式分数低 |
| C10 | 01_specify | G-SPEC-03 | 规格质量可接受但未达标 |
| C1/C2 | 02_design | G-DESIGN-02 | 部分 FR 暂不设计 |
| C3 | 03_plan | G-PLAN-01 | 部分 FR 延后实现 |
| C4 | 04_implement | G-IMPL-01 | 部分 FR 测试覆盖不足 |
| C4 | 05_verify | G-VERIFY-01 | 部分 FR 测试覆盖不足 |
| C5 | 05_verify | G-VERIFY-02 | 部分 FR AC 覆盖不足 |

### 不支持豁免的指标

| 指标 | 阶段 | 条件 ID | 原因 |
|------|------|---------|------|
| C6 | 06_wrap_up | G-WRAP-01 | 归档前必须全部实现 |
| C7 | 04_implement | G-IMPL-02 | 防止孤儿 TASK |
| C8 | 03_plan | G-PLAN-02 | 防止孤儿 TASK |
| C9 | 05_verify | G-VERIFY-03 | 防止孤儿 TC |
| C11 | 02_design | G-DESIGN-03 | 架构合规不可豁免 |

### 豁免流程

1. **创建 RFC**
   ```bash
   cat > specs/FEATURE-001/rfc/RFC-001.rfc.json << 'EOF'
   {
     "id": "RFC-001",
     "status": "approved",
     "title": "C-PRD Waiver"
   }
   EOF
   ```

2. **创建 Exception**
   ```bash
   cat > specs/FEATURE-001/known-exceptions.md << 'EOF'
   | ID | RFC ID | FR ID | Reason | Expires At | Rollback Point | Approved By | Approved At |
   |----|--------|-------|--------|------------|----------------|-------------|-------------|
   | EXC-001 | RFC-001 | FR-XXX-001 | C-PRD=70% | 2026-04-12 | 01_specify | Leo | 2026-03-12 |
   EOF
   ```

3. **验证 Gate**
   ```bash
   spec-first gate check FEATURE-001
   # 输出：PASS_WITH_WAIVER
   ```

4. **推进阶段**
   ```bash
   spec-first stage advance FEATURE-001 --yes
   # findings.md 记录：WAIVER: EXC-001 (RFC: RFC-001)
   ```


---

## 第六部分：关键卡点总结

### 1. 覆盖率计算卡点

**位置**: `src/core/trace-engine/coverage.ts:18-44`

**输入**:
- `MatrixRow[]`: 追踪矩阵行
- `Map<string, string>`: RFC 状态

**输出**: `CoverageMetrics` (C1-C9)

**关键逻辑**:
- 排除 `Deferred`、`Cancelled` 状态
- 排除有效 Exception 的 FR
- 使用 `UpstreamLineage` 追踪传递关系

---

### 2. Gate 评估卡点

**位置**: `src/core/gate-engine/gate-evaluator.ts:345-456`

**输入**:
- `featureId`: Feature ID
- `projectRoot`: 项目根目录

**输出**: `GateResult`
```typescript
{
  status: 'PASS' | 'PASS_WITH_WAIVER' | 'FAIL',
  conditions: ConditionResult[],
  waivers?: WaiverRef[]
}
```

**关键逻辑**:
1. 执行所有条件检查
2. 匹配 exception 的 `frId` 与条件的 `scopeFrIds`
3. 将匹配的条件状态改为 `WAIVER`
4. 返回三态结果

---

### 3. Stage Advance 卡点

**位置**: `src/core/process-engine/advance.ts:136-150`

**检查顺序**:
1. 依赖检查 (`checkDependencies`)
2. Gate 评估 (`evaluateGate`)
3. 状态更新

**关键逻辑**:
- `FAIL` → 抛出 `GateFailedError`
- `PASS_WITH_WAIVER` → 记录 waiver 到 findings
- `PASS` → 正常推进

---

### 4. Exception 验证卡点

**位置**: `src/core/trace-engine/exception-validator.ts:15-39`

**验证规则**:
1. RFC 必须存在且状态为 `approved`
2. `expiresAt` 不能过期
3. `rollbackPoint` 必须存在

**输出**: `{ valid: [], invalid: [] }`

---

## 附录：快速参考

### 指标速查表

| 指标 | 类型 | 阈值 | 阶段 | 豁免 |
|------|------|------|------|------|
| C-PRD | 质量 | ≥85% | 01_specify | ✅ |
| C10 | 质量 | ≥80% | 01_specify | ✅ |
| C11 | 质量 | PASS | 02_design | ❌ |
| C1 | 覆盖 | 100% | 02_design | ✅ |
| C2 | 覆盖 | 100% | 02_design | ✅ |
| C3 | 覆盖 | 100% | 03_plan | ✅ |
| C4 | 覆盖 | 80%/100% | 04/05 | ✅ |
| C5 | 覆盖 | 60%/90% | 05_verify | ✅ |
| C6 | 覆盖 | 100% | 06_wrap_up | ❌ |
| C7 | 合规 | 100% | 04_implement | ❌ |
| C8 | 合规 | 100% | 03_plan | ❌ |
| C9 | 合规 | 100% | 05_verify | ❌ |

### 文件路径速查

```
覆盖率计算:    src/core/trace-engine/coverage.ts
Gate 评估:     src/core/gate-engine/gate-evaluator.ts
Stage 推进:    src/core/process-engine/advance.ts
Exception 验证: src/core/trace-engine/exception-validator.ts
PRD 验证:      src/core/gate-engine/prd-validator.ts
```

---

**文档版本**: v1.0.0  
**生成时间**: 2026-03-12  
**最后更新**: 修复 G-SPEC-00、G-SPEC-03 豁免支持
