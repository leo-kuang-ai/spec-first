# Gate Conditions Reference

各阶段 Gate 条件定义，用于 verify skill 参考。

## Gate 状态

| 状态 | 说明 | 退出码 | 可推进阶段 |
|------|------|--------|-----------|
| **PASS** | 所有条件通过 | 0 | ✅ 是 |
| **PASS_WITH_WAIVER** | 有条件通过 | 0 | ✅ 是（需记录豁免） |
| **FAIL** | 存在失败条件 | 1 | ❌ 否 |

## 各阶段 Gate 条件

### 00_init

| 条件 ID | 描述 | 检查内容 |
|---------|------|----------|
| G-INIT-01 | Feature directory exists | `specs/{featureId}/` 目录存在 |
| G-INIT-02 | Mode/Size/Platforms confirmed | mode/size/platforms 已配置 |
| G-INIT-03 | stage-state.json exists | 状态文件存在 |

### 01_specify

| 条件 ID | 描述 | 检查内容 | 阈值 |
|---------|------|----------|------|
| G-SPEC-01 | spec.md exists | spec.md 文件存在 | ✅/❌ |
| G-SPEC-02 | FR/NFR IDs assigned | 矩阵中有 FR 条目 | count > 0 |
| G-SPEC-03 | Spec quality score (C10) | C10 ≥ 80% | ≥ 80% |

### 02_design

| 条件 ID | 描述 | 检查内容 | 阈值 |
|---------|------|----------|------|
| G-DESIGN-01 | design.md exists | design.md 文件存在 | ✅/❌ |
| G-DESIGN-02 | API coverage (C2) | C2 = 100% | = 100% |
| G-DESIGN-03 | Constitution compliance (C11) | C11 = 100% | = 100% |

### 03_plan

| 条件 ID | 描述 | 检查内容 | 阈值 |
|---------|------|----------|------|
| G-PLAN-01 | Task coverage (C3) | C3 = 100% | = 100% |
| G-PLAN-02 | Task compliance (C8) | C8 = 100% | = 100% |
| G-PLAN-03 | Analyze CRITICAL findings | analyze 报告中 CRITICAL = 0 | = 0 |

### 04_implement

| 条件 ID | 描述 | 检查内容 | 阈值 |
|---------|------|----------|------|
| G-IMPL-01 | Unit test coverage (C4) | C4 ≥ 80% | ≥ 80% |
| G-IMPL-02 | PR compliance (C7) | C7 = 100% | = 100% |

### 05_verify

| 条件 ID | 描述 | 检查内容 | 阈值 |
|---------|------|----------|------|
| G-VERIFY-01 | Test coverage FR (C4) | C4 = 100% | = 100% |
| G-VERIFY-02 | Test coverage AC (C5) | C5 ≥ 90% (M/L), 60% (S) | 动态阈值 |
| G-VERIFY-03 | TC compliance (C9) | C9 = 100% | = 100% |

### 06_wrap_up

| 条件 ID | 描述 | 检查内容 | 阈值 |
|---------|------|----------|------|
| G-WRAP-01 | Implementation coverage (C6) | C6 = 100% | = 100% |
| G-WRAP-02 | All matrix entries in terminal status | 所有条目状态为终态 | ✅/❌ |

### 07_release

| 条件 ID | 描述 | 检查内容 | 阈值 |
|---------|------|----------|------|
| G-REL-01 | Smoke test report exists | smoke-test-report.md 存在 | ✅/❌ |
| G-REL-02 | Release note exists | release-note.md 存在 | ✅/❌ |

## WAIVER（豁免）机制

### 什么是 WAIVER

WAIVER（豁免）是一种有条件的通过状态。当某个 Gate 条件失败，但有充分的理由可以暂时跳过时，可以申请豁免。

### WAIVER 适用场景

| 场景 | 示例 | 审批要求 |
|------|------|----------|
| **技术限制** | 第三方服务暂不可用 | 技术负责人批准 |
| **时间压力** | 紧急修复，暂时跳过非关键条件 | 产品负责人批准 |
| **渐进式完成** | 大型 Feature 分阶段交付 | 分阶段计划批准 |
| **已知风险** | 风险已识别且可控 | 风险评估文档 |

### WAIVER 记录格式

```markdown
## WAIVER 记录

| 条件 ID | 豁免理由 | 批准人 | 有效期 | 状态 |
|---------|----------|--------|--------|------|
| G-SPEC-03 | C10 暂时无法达到，分阶段提升 | Tech Lead | 2026-03-31 | ACTIVE |
```

### WAIVER 撤销

WAIVER 可以被撤销，撤销后原条件必须满足才能通过。

## Gate 条件评估逻辑

```python
def evaluate_gate(feature_id, stage):
    conditions = get_conditions(stage)
    results = []
    waivers = get_waivers(feature_id)

    for condition in conditions:
        result = condition.evaluate(context)

        # 检查是否有豁免
        if not result.pass and condition.id in waivers:
            result.status = 'WAIVER'
            result.waiver = waivers[condition.id]

        results.append(result)

    # 计算总体状态
    pass_count = sum(1 for r in results if r.status == 'PASS')
    waiver_count = sum(1 for r in results if r.status == 'WAIVER')
    fail_count = sum(1 for r in results if r.status == 'FAIL')

    if fail_count > 0:
        return 'FAIL'
    elif waiver_count > 0:
        return 'PASS_WITH_WAIVER'
    else:
        return 'PASS'
```

## 常见失败原因与修复

| 失败条件 | 常见原因 | 修复建议 |
|---------|----------|----------|
| G-SPEC-02 (FR 未分配) | spec.md 中没有 FR | 运行 `/spec-first:spec` 生成 FR |
| G-DESIGN-02 (C2 < 100%) | 部分 FR 缺少 DS | 运行 `/spec-first:design` 补充 DS |
| G-PLAN-01 (C3 < 100%) | 部分 FR 缺少 TASK | 运行 `/spec-first:task` 拆解任务 |
| G-IMPL-01 (C4 < 80%) | 单测覆盖不足 | 补充单元测试 |
| G-VERIFY-01 (C4 < 100%) | 部分 FR 缺少 TC | 运行 `/spec-first:test` 生成 TC |
