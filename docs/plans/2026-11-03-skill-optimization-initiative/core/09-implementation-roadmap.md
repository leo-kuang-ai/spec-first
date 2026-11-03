# 实施路线图 - 从理论到落地

**日期**：2026-11-03  
**版本**：v1.0  
**状态**：执行指南  
**目的**：将所有审查建议和优化方案整合为可执行的路线图

---

## 📋 整体架构

```
理论层（已完成）
  ├── 方法论：v4 研发流程导向
  ├── 三层标准：Layer 3 > Layer 2 > Layer 1
  ├── Harness 最佳实践：验证门、Contract、Protocol
  └── 优化方案：5 个核心改进

  ↓

设计层（本文档）
  ├── Skill Contract 定义（08 文档）
  ├── Inter-Skill Protocol（08 文档）
  ├── 自动化验证门设计
  └── Phase 0/1 执行计划

  ↓

实施层（Phase 0 → Phase 1）
  ├── Phase 0：数据收集 + Contract/Protocol 验证
  ├── Phase 1：Skill 优化 + 自动化验证门
  └── 持续改进：监控 + 迭代

```

---

## 🎯 核心目标与优先级

### P0 目标（必须完成）

1. **补充 Skill Contract 和 Protocol**
   - 文档：✅ 已完成（08-skill-contract-protocol.md）
   - 实施：Phase 0 验证，Phase 1 落地

2. **Phase 0 数据收集**
   - 前瞻性 + 回顾性混合追踪
   - 4 类根因归因分析
   - Contract/Protocol 合规性检查

3. **Phase 1 核心优化**
   - 优化 2-3 个 P0 Skill
   - 实施 Contract/Protocol 检查
   - A/B 对比验证

### P1 目标（强烈建议）

4. **自动化验证门**
   - Layer 3 的 5 项指标自动检查
   - Contract 自动验证
   - Protocol 自动检查

5. **多路径并行评估**
   - Skill 优化 + 工具链增强
   - 选择最优路径组合

### P2 目标（可选）

6. **实时监控与告警**
7. **Skill 版本管理**
8. **Harness-Skill 协同优化**

---

## 🚀 Phase 0：增强版执行计划（44 小时）

### 阶段 0：前置准备（4 小时）

**任务 0.1：Contract/Protocol 学习**（1 小时）
- 阅读 08-skill-contract-protocol.md
- 理解 5 个 Skill Contract
- 理解 3 个 Inter-Skill Protocol

**任务 0.2：追踪模板准备**（1 小时）
- 基于 02-execution-checklist.md 的模板
- 增加 contract_protocol_analysis 字段
- 准备示例 YAML

**任务 0.3：前瞻性任务试点**（2 小时）
- 选择 2 个新任务（1 简单 + 1 复杂）
- 实时追踪（前瞻性）
- 验证追踪方法可行性
- 调整模板

**决策点 0**：
- ✅ 追踪方法可行 → 继续阶段 1
- ❌ 追踪方法不可行 → 调整方法

---

### 阶段 1：最小样本（10 小时）

**任务 1.1：回顾性追踪**（6 小时）
- 追踪 3 个历史任务
- 每个任务约 2 小时
- 事后重建流程
- 标注阻力点 + Contract/Protocol 问题

**任务 1.2：前瞻性追踪**（4 小时）
- 追踪 2 个新任务（实时）
- 每个任务约 2 小时
- 实时记录流程
- 实时标注阻力点

**任务 1.3：初步分析**（同步进行）
- 识别高频问题
- 归因分析（4 类）
- Contract/Protocol 合规性统计

**决策点 1**：
- ✅ 发现明确模式（某问题 ≥60%）→ 继续阶段 2
- ⚠️ 无明确模式 → 停止，重新评估方法

---

### 阶段 2：标准样本（18 小时）

**任务 2.1：继续追踪**（12 小时）
- 回顾性：再追踪 2 个历史任务
- 前瞻性：再追踪 4 个新任务
- **共 11 个任务（5 + 6）**

**任务 2.2：Contract/Protocol 深度分析**（6 小时）
对每个任务检查：

```yaml
contract_analysis:
  spec-prd:
    output_validation:
      passed: bool
      missing_boundary_conditions: int
      missing_acceptance_criteria: int
  
  spec-plan:
    output_validation:
      passed: bool
      missing_tech_config: int
      abstract_descriptions: int
  
  spec-work:
    output_validation:
      passed: bool
      unimplemented_ac: int
      unhandled_boundaries: int

protocol_analysis:
  prd_to_plan:
    passed: bool
    missing_requirements: [string]
    missing_boundaries: [string]
  
  plan_to_work:
    passed: bool
    unimplemented_ac: [string]
    unhandled_boundaries: [string]
  
  work_to_review:
    passed: bool
    unverified_ac: [string]
    untested_boundaries: [string]
```

**决策点 2**：
- ✅ 结论明确（置信度高）→ 继续阶段 3
- ⚠️ 结论不确定（置信度低）→ 扩展样本到 15-20 个

---

### 阶段 3：模式识别 + 归因（6 小时）

**任务 3.1：阻力点统计**（2 小时）
- 信息丢失率：X/11
- 信息重复率：X/11
- 验证缺失率：X/11
- 衔接断裂率：X/11

**任务 3.2：根因归因统计**（2 小时）
```yaml
root_cause_distribution:
  skill_issues: X%
    - spec-prd: X 个问题
    - spec-plan: X 个问题
    - spec-work: X 个问题
  
  model_capability: X%
  external_factors: X%
  tooling_issues: X%
```

**任务 3.3：Contract/Protocol 统计**（2 小时）
```yaml
contract_compliance:
  spec-prd_output: X/11 passed
  spec-plan_output: X/11 passed
  spec-work_output: X/11 passed

protocol_compliance:
  prd_to_plan: X/11 passed
  plan_to_work: X/11 passed
  work_to_review: X/11 passed
```

---

### 阶段 4：多路径评估（4 小时）

**任务 4.1：路径 1 评估 - Skill 优化**（1 小时）
```yaml
skill_optimization_path:
  target_skills: [spec-prd, spec-plan, spec-work]
  expected_improvement:
    信息丢失: 64% → <10%
    衔接断裂: 73% → <10%
  estimated_effort: 48-120 小时
  confidence: 中
```

**任务 4.2：路径 2 评估 - 工具链增强**（1 小时）
```yaml
tooling_enhancement_path:
  target_tools:
    - automated_test_runner  # 自动运行测试
    - boundary_checker       # 边界条件检查工具
    - protocol_validator     # Protocol 验证工具
  expected_improvement:
    验证缺失: 45% → <5%
  estimated_effort: 20-40 小时
  confidence: 高（工具是确定性的）
```

**任务 4.3：路径 3 评估 - Contract/Protocol 强制**（1 小时）
```yaml
contract_protocol_enforcement_path:
  approach: 在 Skill 中增加自动检查逻辑
  expected_improvement:
    信息丢失: 64% → <10%
    衔接断裂: 73% → <10%
  estimated_effort: 30-50 小时
  confidence: 高
```

**任务 4.4：路径选择建议**（1 小时）
- 对比 3 条路径的投入产出比
- 给出优先级排序
- 建议并行路径组合

---

### 阶段 5：Phase 0 报告（2 小时）

**输出文件**：
1. `phase0-results/task-selection.md`
2. `phase0-results/task-flow-traces/*.yaml`（11 个）
3. `phase0-results/friction-pattern-analysis.md`
4. `phase0-results/contract-protocol-analysis.md`（新增）
5. `phase0-results/root-cause-attribution.md`（新增）
6. `phase0-results/multi-path-evaluation.md`（新增）
7. `phase0-results/priority-recommendation.md`

**Phase 0 总计**：44 小时（原 36h + 8h 新增）

---

## 🔧 Phase 1：并行实施（估算 78-140 小时）

### 路径 1：Skill 优化（48-120 小时）

**仅当 Phase 0 数据支持时执行**

#### 步骤 1.1：选择 P0 Skill（2 小时）

**严格筛选标准**（5 个条件全满足）：
1. Layer 3 有问题（导致返工）
2. Layer 2 有衔接问题
3. Layer 1 定位到根因
4. 归因为"Skill 问题"（非模型能力）
5. 影响面 ≥50% 且导致返工 ≥30%

**优先级公式**：
```
优先级 = 影响面 × 导致返工占比 × 100
```

**选择**：优先级最高的 2 个 Skill

---

#### 步骤 1.2：Skill 1 优化（24 小时）

**1.2.1 深度分析**（4 小时）
- 阅读 Skill 源码
- 识别具体问题点
- 对比 Contract 定义
- 分析根因

**1.2.2 设计优化方案**（4 小时）
- 设计新的 Skill 指令
- **优先考虑精简**（Skill 复杂度预算）
- 增加 Contract/Protocol 检查逻辑
- 设计验证门

**1.2.3 实施优化**（8 小时）
- 修改 Skill 源码
- 实现 Contract 输出验证
- 实现 Protocol 检查
- 编写单元测试

**1.2.4 A/B 对比验证**（8 小时）
- 准备 5 个测试任务
- 运行原 Skill（v1.0）
- 运行新 Skill（v1.1）
- 对比三层指标
- 决策：采纳/回滚/调整

---

#### 步骤 1.3：Skill 2 优化（24 小时）

重复步骤 1.2 的流程

---

#### 步骤 1.4：综合验证（可选，24-72 小时）

如果前 2 个 Skill 效果显著：
- 考虑优化第 3、4、5 个 Skill
- 每个 Skill 24 小时

**止损条件**：
- 前 2 个 Skill 改善 <30% → 停止
- 任何指标反而下降 → 回滚

---

### 路径 2：工具链增强（20-40 小时）

**并行执行**（不依赖 Skill 优化）

#### 工具 1：自动化测试运行器（8-12 小时）

**功能**：
- spec-work 完成时自动运行测试
- 记录测试结果
- 失败时阻止提交

**实施**：
```python
# 在 spec-work 完成后自动触发
def auto_run_tests(work_summary):
    test_files = work_summary['tests_added']
    results = []
    
    for test_file in test_files:
        result = run_test(test_file['test_file'])
        results.append({
            'file': test_file['test_file'],
            'status': result.status,  # passed / failed
            'output': result.output
        })
    
    all_passed = all(r['status'] == 'passed' for r in results)
    if not all_passed:
        raise TestFailedError("测试未通过，阻止提交", results)
    
    return results
```

---

#### 工具 2：边界条件检查器（6-10 小时）

**功能**：
- 检查 PRD 是否包含边界条件
- 检查 Plan 是否处理所有边界
- 检查 Work 是否测试所有边界

**实施**：
```python
def check_boundary_coverage(prd, plan, work):
    prd_boundaries = extract_boundaries(prd)
    plan_boundaries = extract_boundary_handling(plan)
    work_boundaries = extract_boundary_tests(work)
    
    # 检查 Plan 覆盖
    plan_missing = prd_boundaries - plan_boundaries
    if plan_missing:
        warn(f"Plan 未处理边界: {plan_missing}")
    
    # 检查 Work 测试
    work_missing = prd_boundaries - work_boundaries
    if work_missing:
        error(f"Work 未测试边界: {work_missing}")
```

---

#### 工具 3：Protocol 验证器（6-12 小时）

**功能**：
- 自动运行 Protocol 检查
- 生成 Protocol 合规性报告

**实施**：
```python
# 集成到 Skill 中
def validate_protocol(protocol_name, upstream_output, downstream_output):
    validator = get_protocol_validator(protocol_name)
    passed, issues = validator.check(upstream_output, downstream_output)
    
    if not passed:
        raise ProtocolViolationError(f"{protocol_name} 检查失败: {issues}")
    
    return passed
```

---

### 路径 3：Contract/Protocol 强制（并入路径 1 和 2）

Contract/Protocol 检查逻辑已包含在：
- 路径 1 的 Skill 优化中
- 路径 2 的工具 3 中

无需单独投入时间。

---

## 📊 投入与收益预估

### 总投入对比

| 项目 | 原方案 | 优化方案（含 Contract/Protocol） | 差异 |
|---|---|---|---|
| Phase 0 | 36h | 44h | +8h |
| Phase 1 - Skill | 48-120h | 48-120h | 0 |
| Phase 1 - 工具链 | 0 | 20-40h | +20-40h |
| **总计** | **84-156h** | **112-204h** | **+28-48h (+25%)** |

### 预期收益对比

| 指标 | 基线 | 原方案目标 | 优化方案目标 | 改善幅度 |
|---|---|---|---|---|
| 返工率 | 73% | <10% | <5% | 原方案 2 倍 |
| 信息丢失 | 64% | 未明确 | <10% | -84% |
| 衔接断裂 | 73% | 未明确 | <10% | -86% |
| 验证缺失 | 45% | 未明确 | <5% | -89% |
| 误判风险 | 30% | 30% | <10% | -67% |

### ROI 对比

```
原方案 ROI = (返工率 -63%) / (84-156h) = 0.40-0.75 %/h

优化方案 ROI = (返工率 -68% + 误判风险 -67% + 工具收益) / (112-204h) = 0.65-0.95 %/h

ROI 提升：63-27%
```

---

## ✅ 执行检查清单

### Phase 0 前（4 小时）

- [ ] 阅读 08-skill-contract-protocol.md
- [ ] 准备追踪模板（含 Contract/Protocol 字段）
- [ ] 前瞻性任务试点（2 个任务）
- [ ] 验证追踪方法可行性

### Phase 0 执行（40 小时）

- [ ] 最小样本（5 个任务，10h）
- [ ] 决策点 1：是否继续
- [ ] 标准样本（11 个任务，18h）
- [ ] 模式识别 + 归因（6h）
- [ ] 多路径评估（4h）
- [ ] Phase 0 报告（2h）

### Phase 0 后决策

- [ ] 检查是否满足 Phase 1 进入条件
- [ ] 选择优化路径（Skill / 工具 / 并行）
- [ ] 估算 Phase 1 投入
- [ ] 获得批准

### Phase 1 执行（78-140 小时）

**路径 1：Skill 优化**
- [ ] 选择 2 个 P0 Skill（2h）
- [ ] Skill 1 优化（24h）
- [ ] Skill 2 优化（24h）
- [ ] A/B 对比验证
- [ ] 决策：继续/止损

**路径 2：工具链**
- [ ] 自动化测试运行器（8-12h）
- [ ] 边界条件检查器（6-10h）
- [ ] Protocol 验证器（6-12h）
- [ ] 集成测试

### Phase 1 后验证（可选，20 小时）

- [ ] 选择 10 个新任务
- [ ] 5 个用优化前 Skill
- [ ] 5 个用优化后 Skill
- [ ] 对比三层指标
- [ ] 决策：成功/调整/回滚

---

## 🎯 成功标准

### Phase 0 成功标准

1. ✅ 完成 11 个任务追踪
2. ✅ 识别出明确的高频问题（≥60%）
3. ✅ 归因清晰（区分 Skill/模型/外部/工具）
4. ✅ Contract/Protocol 合规性数据完整
5. ✅ 路径评估有明确建议

### Phase 1 成功标准

1. ✅ 返工率降低至 <10%（原目标）或 <5%（新目标）
2. ✅ Contract/Protocol 合规率提升至 >90%
3. ✅ A/B 对比显示显著改善（>30%）
4. ✅ 无关键指标下降

### 项目成功标准

1. ✅ 达到三层指标目标
2. ✅ 建立了可持续的优化机制（Contract/Protocol）
3. ✅ 有完整的文档和最佳实践
4. ✅ 团队理解并认可方法论

---

## 📅 时间规划（11 周）

```
Week 1: Phase 0 准备 + 最小样本
  - Day 1-2: 准备（4h）+ 试点（2h）
  - Day 3-5: 最小样本（10h）

Week 2: Phase 0 标准样本
  - Day 1-3: 追踪任务（12h）
  - Day 4-5: Contract/Protocol 分析（6h）

Week 3: Phase 0 分析 + 决策
  - Day 1-2: 模式识别（6h）
  - Day 3: 多路径评估（4h）
  - Day 4-5: Phase 0 报告（2h）+ 决策

Week 4-5: Phase 1 路径 1 - Skill 优化
  - Week 4: Skill 1 优化（24h）
  - Week 5: Skill 2 优化（24h）

Week 6-7: Phase 1 路径 2 - 工具链（并行）
  - Week 6: 测试运行器 + 边界检查器（18h）
  - Week 7: Protocol 验证器 + 集成（12h）

Week 8: Phase 1 验证
  - A/B 对比测试（20h）

Week 9-10: Phase 1 扩展（可选）
  - Skill 3-5 优化（如果需要）

Week 11: 总结与文档
  - 项目总结报告
  - 最佳实践文档
  - 培训材料
```

---

**文档完成日期**：2026-11-03  
**文档版本**：v1.0  
**预计总投入**：112-204 小时（14-26 个工作日）  
**预计总收益**：返工率 -68%，ROI +63%  
**状态**：✅ 可执行
