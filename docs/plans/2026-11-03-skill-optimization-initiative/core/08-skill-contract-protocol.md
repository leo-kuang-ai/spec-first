# Skill Contract 与 Inter-Skill Protocol 定义

**日期**：2026-11-03  
**版本**：v1.0  
**状态**：核心实施文档（P0）  
**目的**：定义 Skill 的输入输出契约和 Skill 间协议，解决"衔接断裂"问题

---

## 📋 核心理念

### Harness 最佳实践

> **"Contract 是 Harness 的基石。明确的 Contract 避免隐式依赖和模糊接口。"**

### 本文档解决的问题

从 Phase 0 预期发现的问题：
1. **信息丢失**：上游已确定的信息，下游未使用
2. **信息重复**：上游已确定的信息，下游又询问
3. **衔接断裂**：上游输出与下游输入不匹配

**根本原因**：缺少明确的 Contract 和 Protocol

---

## 🎯 主链路 Skill Contract 定义

### Skill 1: spec-prd

**职责**：将用户需求转化为结构化 PRD

#### Input Contract

**必须输入**：
```yaml
inputs:
  user_requirement: string  # 用户需求描述
  project_context: string   # 项目上下文路径
```

**输入验证**：
- user_requirement 长度 >10 字符
- project_context 指向有效的项目目录

#### Output Contract

**必须输出**（结构化 YAML）：
```yaml
outputs:
  prd_path: string  # PRD 文档路径
  prd_content:
    title: string
    objective: string  # 一句话目标
    
    functional_requirements:  # 功能需求列表
      - id: FR-001
        description: string
        priority: P0 | P1 | P2
        acceptance_criteria: [string]  # 验收标准列表
    
    boundary_conditions:  # 边界条件列表（关键！）
      - condition: string  # 如："空输入"
        expected_behavior: string  # 如："显示提示信息"
    
    non_functional_requirements:  # 非功能需求
      - type: performance | security | usability
        requirement: string
    
    out_of_scope: [string]  # 明确不做什么
```

**输出验证门**：
1. ✅ functional_requirements 至少 1 项
2. ✅ 每项 functional_requirements 至少 1 个 acceptance_criteria
3. ✅ boundary_conditions 至少 3 项（空输入、单条、多条）
4. ✅ out_of_scope 明确（避免范围蔓延）

#### 失败处理

```python
if not pass_output_validation():
    feedback = generate_feedback()  # 指出哪些缺失
    retry_count += 1
    if retry_count <= 2:
        regenerate_with_feedback(feedback)
    else:
        escalate_to_human()  # 人工介入
```

---

### Skill 2: spec-plan

**职责**：将 PRD 转化为可执行的技术方案

#### Input Contract

**必须输入**：
```yaml
inputs:
  prd_path: string  # PRD 文档路径
  prd_content: PRDSchema  # 必须符合 spec-prd 的输出格式
  tech_constraints: [string]  # 可选：技术栈约束
```

**输入验证**：
- prd_content 必须包含 functional_requirements
- prd_content 必须包含 boundary_conditions

#### Output Contract

**必须输出**（结构化 YAML）：
```yaml
outputs:
  plan_path: string
  plan_content:
    technical_approach:
      architecture: string  # 技术架构
      tech_stack:  # 技术栈（具体，非抽象）
        - component: string  # 如："缓存"
          technology: string  # 如："Redis 7.0"
          config:  # 具体配置（关键！）
            - key: string  # 如："maxmemory"
              value: string  # 如："1GB"
              reason: string  # 如："防止内存溢出"
      
      data_flow: string  # 数据流描述
    
    acceptance_conditions:  # 验收条件（来自 PRD）
      - id: AC-001
        prd_requirement_id: FR-001  # 对应 PRD 的哪个需求
        condition: string
        test_method: unit_test | integration_test | manual
    
    boundary_handling:  # 边界处理（来自 PRD）
      - boundary_condition: string  # 对应 PRD 的边界条件
        handling_approach: string  # 具体处理方式
        code_location: string  # 预期在哪里实现
    
    implementation_steps:  # 实施步骤
      - step: int
        description: string
        estimated_time: string
        dependencies: [int]  # 依赖哪些步骤
```

**输出验证门**：
1. ✅ tech_stack 中的 config 必须具体（不能是"使用 Redis"）
2. ✅ acceptance_conditions 数量 ≥ PRD 中 functional_requirements 数量
3. ✅ boundary_handling 数量 = PRD 中 boundary_conditions 数量
4. ✅ 每个 acceptance_conditions 都关联到 PRD 的需求 ID

---

### Skill 3: spec-work

**职责**：根据 Plan 实施代码

#### Input Contract

**必须输入**：
```yaml
inputs:
  plan_path: string
  plan_content: PlanSchema  # 必须符合 spec-plan 的输出格式
  workspace: string  # 工作目录
```

**输入验证**：
- plan_content 必须包含 acceptance_conditions
- plan_content 必须包含 boundary_handling
- plan_content 必须包含 implementation_steps

#### Output Contract

**必须输出**：
```yaml
outputs:
  implementation_summary:
    files_modified: [string]  # 修改的文件列表
    files_created: [string]   # 新建的文件列表
    
    acceptance_conditions_status:  # 验收条件状态
      - ac_id: string  # 对应 Plan 的 AC-001
        status: implemented | partially_implemented | not_implemented
        evidence: string  # 证据：测试通过、代码位置等
    
    boundary_handling_status:  # 边界处理状态
      - boundary: string  # 对应 Plan 的边界条件
        status: handled | not_handled
        code_location: string  # 实现位置
        test_evidence: string  # 测试证据
    
    tests_added:  # 测试列表
      - test_file: string
        test_cases: [string]
        coverage_target: string  # 如："functions X, Y, Z"
```

**输出验证门**：
1. ✅ acceptance_conditions_status 中所有 status 必须是 implemented
2. ✅ boundary_handling_status 中所有 status 必须是 handled
3. ✅ tests_added 至少覆盖所有 boundary_handling
4. ✅ 所有测试必须通过（自动运行）

---

### Skill 4: spec-code-review

**职责**：审查代码质量

#### Input Contract

**必须输入**：
```yaml
inputs:
  work_summary: WorkOutputSchema  # spec-work 的输出
  plan_content: PlanSchema
  prd_content: PRDSchema
```

#### Output Contract

**必须输出**：
```yaml
outputs:
  review_result:
    overall_status: approved | changes_required | rejected
    
    acceptance_verification:  # 验收条件验证
      - ac_id: string
        verified: bool
        issues: [string]  # 如果未通过，说明问题
    
    boundary_verification:  # 边界验证
      - boundary: string
        verified: bool
        test_run_result: string  # 实际运行测试的结果
    
    code_quality_issues:  # 代码质量问题
      - severity: critical | major | minor
        issue: string
        location: string
        suggestion: string
```

**输出验证门**：
1. ✅ 所有 acceptance_verification 的 verified 必须是 true
2. ✅ 所有 boundary_verification 的 verified 必须是 true
3. ✅ 没有 severity: critical 的问题
4. ✅ overall_status 基于上述验证自动判断

---

### Skill 5: spec-commit-push-pr

**职责**：提交代码并创建 PR

#### Input Contract

**必须输入**：
```yaml
inputs:
  review_result: ReviewResultSchema  # spec-code-review 的输出
  work_summary: WorkOutputSchema
  plan_content: PlanSchema
  prd_content: PRDSchema
```

**输入验证**：
- review_result.overall_status 必须是 approved

#### Output Contract

**必须输出**：
```yaml
outputs:
  commit_info:
    commit_hash: string
    commit_message: string
    branch: string
  
  pr_info:
    pr_number: int
    pr_url: string
    pr_title: string
    pr_body: string  # 包含实现的需求、验收条件、测试证据
```

---

## 🔗 Inter-Skill Protocol 定义

### Protocol 1: PRD → Plan

**目的**：确保 Plan 完整消费 PRD 的所有信息

#### Protocol 规则

```yaml
protocol:
  name: PRD_to_Plan
  upstream: spec-prd
  downstream: spec-plan
  
  upstream_must_provide:
    - functional_requirements (结构化列表)
    - boundary_conditions (至少 3 项)
    - acceptance_criteria (每个需求至少 1 个)
  
  downstream_must_consume:
    - 所有 functional_requirements 必须在 acceptance_conditions 中体现
    - 所有 boundary_conditions 必须在 boundary_handling 中体现
    - 不能遗漏任何 PRD 中的需求
```

#### 自动检查（在 spec-plan 中实现）

```python
def check_prd_to_plan_protocol(prd_content, plan_content):
    """
    在 spec-plan 完成时自动检查
    """
    issues = []
    
    # 检查 1：所有 PRD 需求是否都有对应的验收条件
    prd_requirement_ids = {req['id'] for req in prd_content['functional_requirements']}
    plan_requirement_ids = {ac['prd_requirement_id'] for ac in plan_content['acceptance_conditions']}
    
    missing = prd_requirement_ids - plan_requirement_ids
    if missing:
        issues.append(f"PRD 需求 {missing} 未在 Plan 中体现")
    
    # 检查 2：所有 PRD 边界条件是否都有处理方案
    prd_boundaries = {bc['condition'] for bc in prd_content['boundary_conditions']}
    plan_boundaries = {bh['boundary_condition'] for bh in plan_content['boundary_handling']}
    
    missing = prd_boundaries - plan_boundaries
    if missing:
        issues.append(f"PRD 边界条件 {missing} 未在 Plan 中处理")
    
    # 检查 3：技术栈是否具体（非抽象）
    for tech in plan_content['tech_stack']:
        if not tech.get('config'):
            issues.append(f"技术栈 {tech['component']} 缺少具体配置")
    
    if issues:
        return False, issues
    return True, []

# 在 spec-plan 完成时调用
passed, issues = check_prd_to_plan_protocol(prd_content, plan_content)
if not passed:
    raise ProtocolViolationError(f"PRD→Plan 协议检查失败: {issues}")
```

---

### Protocol 2: Plan → Work

**目的**：确保 Work 完整实现 Plan 的所有验收条件

#### Protocol 规则

```yaml
protocol:
  name: Plan_to_Work
  upstream: spec-plan
  downstream: spec-work
  
  upstream_must_provide:
    - acceptance_conditions (结构化列表，至少 3 项)
    - boundary_handling (对应 PRD 的所有边界)
    - tech_stack (具体配置，非抽象描述)
  
  downstream_must_consume:
    - 所有 acceptance_conditions 必须 implemented
    - 所有 boundary_handling 必须 handled
    - 必须有测试覆盖所有边界
```

#### 自动检查（在 spec-work 中实现）

```python
def check_plan_to_work_protocol(plan_content, work_summary):
    """
    在 spec-work 完成时自动检查
    """
    issues = []
    
    # 检查 1：所有验收条件是否都已实现
    plan_ac_ids = {ac['id'] for ac in plan_content['acceptance_conditions']}
    work_ac_ids = {ac['ac_id'] for ac in work_summary['acceptance_conditions_status']}
    
    missing = plan_ac_ids - work_ac_ids
    if missing:
        issues.append(f"Plan 验收条件 {missing} 未实现")
    
    # 检查 2：已实现的验收条件是否都通过
    for ac in work_summary['acceptance_conditions_status']:
        if ac['status'] != 'implemented':
            issues.append(f"验收条件 {ac['ac_id']} 状态为 {ac['status']}，未完全实现")
    
    # 检查 3：所有边界是否都已处理
    plan_boundaries = {bh['boundary_condition'] for bh in plan_content['boundary_handling']}
    work_boundaries = {bh['boundary'] for bh in work_summary['boundary_handling_status']}
    
    missing = plan_boundaries - work_boundaries
    if missing:
        issues.append(f"Plan 边界条件 {missing} 未处理")
    
    # 检查 4：所有边界是否都有测试
    for bh in work_summary['boundary_handling_status']:
        if not bh.get('test_evidence'):
            issues.append(f"边界 {bh['boundary']} 缺少测试证据")
    
    if issues:
        return False, issues
    return True, []

# 在 spec-work 完成时调用
passed, issues = check_plan_to_work_protocol(plan_content, work_summary)
if not passed:
    raise ProtocolViolationError(f"Plan→Work 协议检查失败: {issues}")
```

---

### Protocol 3: Work → Review

**目的**：确保 Review 验证了所有应该验证的点

#### Protocol 规则

```yaml
protocol:
  name: Work_to_Review
  upstream: spec-work
  downstream: spec-code-review
  
  upstream_must_provide:
    - acceptance_conditions_status (每项的状态和证据)
    - boundary_handling_status (每项的状态和测试证据)
    - tests_added (测试文件和用例列表)
  
  downstream_must_verify:
    - 运行所有测试并记录结果
    - 验证所有验收条件
    - 验证所有边界处理
    - 不能仅依赖 Work 的声称，必须实际验证
```

#### 自动检查（在 spec-code-review 中实现）

```python
def check_work_to_review_protocol(work_summary, review_result):
    """
    在 spec-code-review 完成时自动检查
    """
    issues = []
    
    # 检查 1：Review 是否验证了所有验收条件
    work_ac_ids = {ac['ac_id'] for ac in work_summary['acceptance_conditions_status']}
    review_ac_ids = {av['ac_id'] for av in review_result['acceptance_verification']}
    
    missing = work_ac_ids - review_ac_ids
    if missing:
        issues.append(f"Review 未验证验收条件 {missing}")
    
    # 检查 2：Review 是否运行了测试
    work_boundaries = {bh['boundary'] for bh in work_summary['boundary_handling_status']}
    review_boundaries = {bv['boundary'] for bv in review_result['boundary_verification']}
    
    missing = work_boundaries - review_boundaries
    if missing:
        issues.append(f"Review 未验证边界 {missing}")
    
    # 检查 3：Review 是否有测试运行结果
    for bv in review_result['boundary_verification']:
        if not bv.get('test_run_result'):
            issues.append(f"Review 未运行边界 {bv['boundary']} 的测试")
    
    if issues:
        return False, issues
    return True, []
```

---

## 🔧 实施计划

### Phase 0 中的应用

在 Phase 0 追踪任务时，增加 Contract/Protocol 检查：

```yaml
task_trace:
  task_id: T01
  # ... 其他字段
  
  contract_protocol_analysis:
    - stage: 2_requirement (spec-prd)
      contract_compliance:
        output_validation_passed: bool
        missing_items: [string]  # 如："缺少 boundary_conditions"
    
    - stage: 3_planning (spec-plan)
      protocol_compliance:
        prd_to_plan_passed: bool
        issues: [string]  # 如："PRD 需求 FR-003 未在 Plan 中体现"
      contract_compliance:
        output_validation_passed: bool
        missing_items: [string]
    
    - stage: 4_implementation (spec-work)
      protocol_compliance:
        plan_to_work_passed: bool
        issues: [string]
      contract_compliance:
        output_validation_passed: bool
        missing_items: [string]
```

### Phase 1 中的实施

1. **修改 Skill 源码**，增加 Contract/Protocol 检查
2. **自动化验证门**，在 Skill 完成时自动运行
3. **失败处理**，验证失败时自动重试或人工介入

---

## 📊 预期收益

### 解决的问题

| 问题类型 | Phase 0 预期频率 | Contract/Protocol 解决 |
|---|---|---|
| 信息丢失 | 64% (7/11) | PRD→Plan Protocol 强制消费 |
| 信息重复 | 55% (6/11) | Contract 避免重复询问 |
| 验证缺失 | 45% (5/11) | 验证门强制执行 |
| 衔接断裂 | 73% (8/11) | Protocol 确保接口匹配 |

### 预期改善

- 信息丢失：64% → <10%
- 信息重复：55% → <5%
- 验证缺失：45% → <5%
- 衔接断裂：73% → <10%

**端到端返工率**：73% → <10%（原目标）→ <5%（新目标）

---

## ✅ 检查清单

### Phase 0 前准备

- [ ] 为 5 个主链路 Skill 定义 Contract（本文档）
- [ ] 为 3 个关键接口定义 Protocol（本文档）
- [ ] 设计 Contract/Protocol 检查的 YAML 格式
- [ ] 准备 Phase 0 追踪模板（包含 Contract/Protocol 字段）

### Phase 1 实施

- [ ] 修改 spec-prd，增加输出验证门
- [ ] 修改 spec-plan，增加 PRD→Plan Protocol 检查
- [ ] 修改 spec-work，增加 Plan→Work Protocol 检查
- [ ] 修改 spec-code-review，增加 Work→Review Protocol 检查
- [ ] 测试 Contract/Protocol 检查逻辑
- [ ] A/B 对比验证效果

---

**文档完成日期**：2026-11-03  
**文档版本**：v1.0  
**状态**：✅ 可执行
