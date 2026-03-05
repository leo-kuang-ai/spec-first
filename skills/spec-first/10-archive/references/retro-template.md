# Feature 归档报告: {featureId}

## 一、交付物清单

| 产物 | 路径 | 状态 |
|------|------|------|
| spec.md | specs/{featureId}/spec.md | ✅/⚠️/❌ |
| design.md | specs/{featureId}/design.md | ✅/⚠️/❌ |
| task_plan.md | specs/{featureId}/task_plan.md | ✅/⚠️/❌ |
| tests/ | specs/{featureId}/tests/*.test.md | ✅/⚠️/❌ |

## 二、覆盖率报告

| 覆盖维度 | 指标 | 值 |
|---------|------|-----|
| C1: Design Coverage | FR → DS | X/Y |
| C2: API Coverage | FR → DS（当前实现与 C1 同口径） | X/Y |
| C3: Task Coverage | FR → TASK | X/Y |
| C4: Test Coverage (FR) | FR → TC | X/Y |
| C5: Test Coverage (AC) | FR → TC（当前实现暂与 C4 同口径） | X/Y |

## 三、5 维度失败分析

### 3.1 根因分类

| ID | 类别 | 具体描述 |
|----|------|---------|
| 1 | [A/B/C/D/E] | _填写_ |

### 3.2 修复失败分析

| 尝试 | 失败原因 |
|------|---------|
| 1 | _填写_ |

### 3.3 预防机制

| 优先级 | 类型 | 具体行动 | 状态 |
|--------|------|---------|------|
| P0 | _类型_ | _行动_ | TODO/DONE |

### 3.4 系统性扩展

- Similar Issues: _填写_
- Design Flaw: _填写_
- Process Flaw: _填写_

### 3.5 知识捕获

- [ ] 更新 `.spec-first/constitution.md`（全局原则）
- [ ] 更新 `specs/{featureId}/constitution.md`（特例覆盖）
- [ ] 更新 `references/*.md`
- [ ] 创建 Issue/Feature 工单

## 四、Gate 历史摘要

| Gate | 时间 | 结果 | 豁免 |
|------|------|------|------|
| 01_specify | YYYY-MM-DD | PASS/FAIL | - |

## 五、经验教训

### 做得好的

- _填写_

### 需改进的

- _填写_

### 下次避免的

- _填写_
