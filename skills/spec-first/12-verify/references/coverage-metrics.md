# Coverage Metrics Reference

覆盖率指标详解，用于理解 C1-C9 的含义和阈值。

## 覆盖率指标概览

| 指标 | 名称 | 含义 | 计算方式 |
|------|------|------|----------|
| **C1** | Spec Coverage | 需求覆盖率 | 有 FR 的 ID / 应有 FR 的 ID |
| **C2** | API Coverage | API 设计覆盖率 | 有 DS 的 FR / 所有 FR |
| **C3** | Task Coverage | 任务覆盖率 | 有 TASK 的 FR / 所有 FR |
| **C4** | Test Coverage FR | 测试对 FR 的覆盖率 | 有 TC 的 FR / 所有 FR |
| **C5** | Test Coverage AC | 测试对 AC 的覆盖率 | 有 TC 的 AC / 所有 AC |
| **C6** | Implementation Coverage | 实现覆盖率 | 有实现的 TASK / 所有 TASK |
| **C7** | PR Compliance | PR 合规率 | 符合规范的 TASK / 所有 TASK |
| **C8** | Task Compliance | 任务合规率 | 状态正确的 TASK / 所有 TASK |
| **C9** | TC Compliance | 测试用例合规率 | 符合规范的 TC / 所有 TC |
| **C10** | Spec Quality | 规格质量分数 | AC 完整性 + 歧义标记 + NFR |
| **C11** | Constitution Compliance | 宪法合规率 | 符合宪法的设计 / 所有设计 |

## C1: Spec Coverage

### 定义

有多少需求（FR）已经被定义和注册。

### 计算

```
C1 = count(FR where status != 'Cancelled') / expected_FR_count
```

### 阈值要求

| 阶段 | 阈值 | 说明 |
|------|------|------|
| 01_specify | > 0% | 至少有 1 个 FR |
| 02_design+ | 100% | 所有需求都已识别 |

### 失败原因

- `spec.md` 不存在或为空
- FR 未注册到 traceability-matrix.md

---

## C2: API Coverage

### 定义

有多少需求（FR）有对应的设计规格（DS）。

### 计算

```
C2 = count(FR where has_linked_DS) / count(all FR)
```

### 阈值要求

| 阶段 | 阈值 | 说明 |
|------|------|------|
| 02_design | 100% | 所有 FR 都必须有 DS |
| 03_plan+ | 100% | 保持 100% |

### 失败原因

- 部分 FR 缺少对应 DS
- DS 未正确链接到 FR

---

## C3: Task Coverage

### 定义

有多少需求（FR）有对应的任务（TASK）。

### 计算

```
C3 = count(FR where has_linked_TASK) / count(all FR)
```

### 阈值要求

| 阶段 | 阈值 | 说明 |
|------|------|------|
| 03_plan | 100% | 所有 FR 都必须有 TASK |
| 04_implement+ | 100% | 保持 100% |

### 失败原因

- 部分 FR 缺少对应 TASK
- TASK 未正确链接到 FR

---

## C4: Test Coverage FR

### 定义

有多少需求（FR）有对应的测试用例（TC）。

### 计算

```
C4 = count(FR where has_linked_TC) / count(all FR)
```

### 阈值要求

| 阶段 | 阈值 | 说明 |
|------|------|------|
| 04_implement | ≥ 80% | 实现阶段至少 80% 覆盖 |
| 05_verify | 100% | 验证阶段必须 100% 覆盖 |

### 失败原因

- 部分 FR 缺少对应 TC
- TC 未正确链接到 FR

---

## C5: Test Coverage AC

### 定义

有多少验收标准（AC）有对应的测试用例（TC）。

### 计算

```
C5 = count(AC where has_linked_TC) / count(all AC)
```

### 阈值要求

| Size | 阈值 | 说明 |
|------|------|------|
| S | ≥ 60% | 小型 Feature 要求 60% |
| M | ≥ 90% | 中型 Feature 要求 90% |
| L | ≥ 90% | 大型 Feature 要求 90% |

### 失败原因

- 部分 AC 缺少对应 TC
- TC 未正确链接到 AC
- AC 定义不完整导致无法映射

---

## C6: Implementation Coverage

### 定义

有多少任务（TASK）已经有实现代码。

### 计算

```
C6 = count(TASK where status == 'complete' or 'verified') / count(all TASK)
```

### 阈值要求

| 阶段 | 阈值 | 说明 |
|------|------|------|
| 04_implement | > 0% | 至少有 1 个 TASK 完成 |
| 05_verify | 100% | 所有 TASK 都已完成 |
| 06_wrap_up | 100% | 所有 TASK 都已完成 |

### 失败原因

- 部分 TASK 未实现
- TASK 状态未更新

---

## C7: PR Compliance

### 定义

有多少 PR（Pull Request）符合规范。

### 计算

```
C7 = count(TASK with valid PR) / count(TASK requiring PR)
```

### 阈值要求

| 阶段 | 阈值 | 说明 |
|------|------|------|
| 04_implement | 100% | 所有 PR 都符合规范 |

### 失败原因

- PR 缺少必要信息
- PR 未通过 code review
- PR 标题不符合约定

---

## C8: Task Compliance

### 定义

任务状态和信息的合规性。

### 计算

```
C8 = count(TASK with valid status and fields) / count(all TASK)
```

### 阈值要求

| 阶段 | 阈值 | 说明 |
|------|------|------|
| 03_plan+ | 100% | 所有 TASK 都符合规范 |

### 失败原因

- TASK 状态值不合法
- TASK 缺少必要字段
- TASK 依赖关系不正确

---

## C9: TC Compliance

### 定义

测试用例的合规性。

### 计算

```
C9 = count(TC with valid fields and mapping) / count(all TC)
```

### 阈值要求

| 阶段 | 阈值 | 说明 |
|------|------|------|
| 05_verify+ | 100% | 所有 TC 都符合规范 |

### 失败原因

- TC 缺少必要字段
- TC 未正确映射到 FR/AC
- TC 层级标记不正确

---

## C10: Spec Quality

### 定义

规格质量分数，反映 spec.md 的完整性。

### 计算

```
C10 = (
    AC完整性 * 40% +
    歧义标记 * 30% +
    NFR定义 * 30%
)
```

### 评分项

| 评分项 | 权重 | 说明 |
|--------|------|------|
| AC 完整性 | 40% | 每个 FR 是否有足够的 AC |
| 歧义标记 | 30% | 歧义是否正确标记 |
| NFR 定义 | 30% | 是否定义了非功能需求 |

### 阈值要求

| 阶段 | 阈值 | 说明 |
|------|------|------|
| 01_specify | ≥ 80% | 规格质量必须达标 |

### 失败原因

- AC 不完整或缺失
- 歧义未标记
- NFR 未定义

---

## C11: Constitution Compliance

### 定义

设计对宪法的合规性。

### 计算

```
C11 = count(design decisions compliant with constitution) / count(all design decisions)
```

### 阈值要求

| 阶段 | 阈值 | 说明 |
|------|------|------|
| 02_design+ | 100% | 所有设计必须符合宪法 |

### 失败原因

- 设计决策与宪法冲突
- 未引用宪法权威

---

## 覆盖率指标关系图

```
           ┌─────────┐
           │   FR    │
           └────┬────┘
                │
        ┌─────────┼─────────┐
        │         │         │
    ┌───▼───┐ ┌──▼───┐ ┌──▼────┐
    │  DS   │ │ TASK │ │  TC   │
    │  (C2) │ │ (C3) │ │ (C4)  │
    └───┬───┘ └───┬──┘ └───┬────┘
        │         │         │
        └─────────┼─────────┘
                  │
           ┌──────▼──────┐
           │  实现(C6)   │
           └─────────────┘
```

---

## 指标修复命令

| 失败指标 | 修复命令 |
|---------|----------|
| C1 < 阈值 | `/spec-first:spec` |
| C2 < 阈值 | `/spec-first:design` |
| C3 < 阈值 | `/spec-first:task` |
| C4 < 阈值 | 回到 `task/code` 补齐测试设计与 TDD 证据 |
| C5 < 阈值 | 回到 `task/code` 补齐测试设计与 TDD 证据 |
| C6 < 阈值 | 继续实现 TASK |
| C7 < 阈值 | 修复 PR |
| C8 < 阈值 | 修正 TASK 字段 |
| C9 < 阈值 | 修正 TC 字段 |
| C10 < 阈值 | 完善 spec.md |
| C11 < 阈值 | 修正 design.md |

## verify-view 指标补充
- `validation_focus`：本轮验证重点
- `critical_flows`：必须覆盖的关键链路
- `recommended_checks`：建议执行的补充检查
