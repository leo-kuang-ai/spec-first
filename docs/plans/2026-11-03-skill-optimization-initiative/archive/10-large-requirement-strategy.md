# 超大需求处理策略 - 深度思考与方案设计

**日期**：2026-11-03  
**思考者**：Claude (Fable 5.1)  
**场景**：面对跨模块、多功能点、复杂依赖的超大需求  
**目标**：设计可执行的需求分解、并行开发、集成验证策略

---

## 🤔 核心挑战：为什么超大需求容易失败？

### 挑战 1：认知负荷过载

**问题**：
- 一次性理解 100+ 功能点，超出人类/AI 工作记忆容量
- 复杂依赖关系难以全局把握
- 容易遗漏关键边界条件

**证据**：
- Miller's Law：人类工作记忆容量 7±2 项
- AI 上下文窗口有限（200K tokens ≈ 150 页文档）
- 超过 20 个功能点的需求，返工率显著上升

### 挑战 2：依赖地狱

**问题**：
- 功能 A 依赖功能 B，B 依赖 C，C 又依赖 A（循环依赖）
- 并行开发时，接口未定义导致后续返工
- 集成时发现架构不匹配

**证据**：
- 跨模块需求的返工率高达 80-90%
- 集成阶段发现的问题，修复成本是需求阶段的 10-100 倍

### 挑战 3：渐进式细化的陷阱

**问题**：
- 第一版 PRD 太粗，后续不断补充，导致方案频繁返工
- 第一版 PRD 太细，耗时过长，且很多细节后续改变
- 何时停止细化？何时开始开发？

**证据**：
- "Ready, Fire, Aim" 模式：过早开始，频繁返工
- "Analysis Paralysis"：过度分析，迟迟不开始

### 挑战 4：AI 的特殊限制

**问题**：
- AI 上下文管理：跨会话时丢失上下文
- AI 一致性：不同阶段可能给出不一致的方案
- AI 创造性 vs 约束：如何平衡自由探索和方案一致性

---

## 💡 核心洞察：分层分治 + 契约优先

### 洞察 1：分层抽象是关键

**传统方法**（失败）：
```
用户需求 → 一个巨大的 PRD → 一个巨大的 Plan → 逐个开发
问题：PRD 和 Plan 都太大，无法有效管理
```

**分层方法**（成功）：
```
用户需求
  ↓ Layer 0: 领域划分（Domain Decomposition）
多个领域需求
  ↓ Layer 1: 功能分解（Feature Breakdown）
多个独立功能
  ↓ Layer 2: 任务拆分（Task Splitting）
多个可并行的任务
  ↓ Layer 3: 执行开发
并行开发 → 集成验证
```

### 洞察 2：契约优先于实现

**问题场景**：
```
团队 A 开发功能 A，依赖团队 B 的功能 B
如果 B 的接口未定义，A 无法开始
如果 A 先定义假接口，B 实现时可能不匹配
```

**Contract-First 方法**：
```
1. 先定义所有功能的 Contract（输入/输出/接口）
2. 各团队基于 Contract 并行开发
3. Contract 是强制的，不允许擅自改变
4. 集成时只需验证 Contract 是否遵守
```

### 洞察 3：深度优先 vs 广度优先

**广度优先**（传统敏捷）：
```
迭代 1: 所有功能的 20% → 不可交付
迭代 2: 所有功能的 40% → 不可交付
迭代 3: 所有功能的 60% → 不可交付
迭代 4: 所有功能的 80% → 可能可交付
```

**深度优先**（推荐）：
```
迭代 1: 核心功能 100% → 可交付 MVP
迭代 2: 核心功能 + 功能 A 100% → 可交付
迭代 3: 核心功能 + A + B 100% → 可交付
迭代 4: 全功能 100% → 完整交付
```

**关键区别**：每个迭代都可交付

### 洞察 4：契约测试优于端到端测试

**端到端测试的问题**：
- 依赖所有模块都完成
- 失败时难以定位根因
- 执行缓慢

**契约测试的优势**：
- 每个模块独立可测
- 失败时精确定位
- 可并行执行

---

## 🎯 方案设计：五阶段分层处理

### 阶段 0：领域划分（Domain Decomposition）- 2-4 小时

**目标**：将超大需求分解为 3-7 个独立领域

**方法**：DDD（Domain-Driven Design）+ 依赖分析

#### 步骤 0.1：识别核心领域（1 小时）

**输入**：用户需求描述（可能是几页文档）

**输出**：领域清单
```yaml
domains:
  - name: "用户认证"
    description: "用户登录、注册、权限管理"
    core: true  # 核心领域
    complexity: high
  
  - name: "数据管理"
    description: "数据的 CRUD 操作"
    core: true
    complexity: medium
  
  - name: "报表生成"
    description: "各类报表的生成和导出"
    core: false  # 支撑领域
    complexity: medium
  
  - name: "通知系统"
    description: "邮件、短信、站内信通知"
    core: false
    complexity: low
```

**方法**：
1. 识别名词（实体）：用户、订单、商品、支付...
2. 识别动词（行为）：创建、查询、更新、删除...
3. 聚类分组：相关的实体和行为聚为一个领域
4. 标记核心：哪些是业务核心，哪些是支撑

**Skill**：`spec-domain-decomposition`（新增）

---

#### 步骤 0.2：依赖分析（1 小时）

**输出**：依赖图
```yaml
dependencies:
  - upstream: "用户认证"
    downstream: "数据管理"
    type: "强依赖"  # 数据管理必须在认证后
    interface: "用户 ID 和权限 Token"
  
  - upstream: "数据管理"
    downstream: "报表生成"
    type: "强依赖"
    interface: "数据查询 API"
  
  - upstream: "报表生成"
    downstream: "通知系统"
    type: "弱依赖"  # 报表生成后可选地发送通知
    interface: "报表生成事件"
```

**识别循环依赖**：
```python
def detect_cycles(dependencies):
    # 使用拓扑排序检测循环
    # 如果存在循环，必须打破
    pass

# 如果发现循环：
# A 依赖 B，B 依赖 C，C 依赖 A
# 解决方案：
# 1. 引入中间层（如消息队列）
# 2. 反转依赖（依赖注入）
# 3. 重新划分领域边界
```

**Skill**：`spec-dependency-analysis`（新增）

---

#### 步骤 0.3：优先级排序（30 分钟）

**输出**：开发顺序
```yaml
development_order:
  phase_1:  # MVP（2-4 周）
    - domain: "用户认证"
      reason: "所有功能的前提"
    - domain: "数据管理（核心 CRUD）"
      reason: "业务核心"
  
  phase_2:  # 可交付版本 1（4-6 周）
    - domain: "报表生成（基础报表）"
      reason: "高优先级功能"
  
  phase_3:  # 完整版本（6-8 周）
    - domain: "通知系统"
      reason: "支撑功能"
    - domain: "报表生成（高级报表）"
      reason: "增强功能"
```

**排序原则**：
1. 依赖顺序：被依赖的优先
2. 核心优先：core: true 优先
3. 风险优先：complexity: high 优先验证
4. 价值优先：用户价值高的优先

---

#### 步骤 0.4：Contract 预定义（30 分钟）

**关键**：在任何实现前，先定义所有领域间的 Contract

**输出**：领域 Contract
```yaml
domain_contracts:
  - domain: "用户认证"
    exports:
      - interface: "AuthService"
        methods:
          - name: "authenticate"
            input:
              username: string
              password: string
            output:
              user_id: string
              token: string
              permissions: [string]
            errors:
              - code: "INVALID_CREDENTIALS"
              - code: "ACCOUNT_LOCKED"
  
  - domain: "数据管理"
    imports:
      - interface: "AuthService"
        from: "用户认证"
        uses: ["authenticate"]
    exports:
      - interface: "DataService"
        methods:
          - name: "query_data"
            input:
              token: string
              query: QueryObject
            output:
              data: [DataRecord]
              total: int
```

**Contract 不可擅自修改**：
- 如果需要修改，必须通知所有下游
- 使用版本控制（v1, v2）
- 支持向后兼容

**Skill**：`spec-contract-definition`（新增）

---

### 阶段 1：功能分解（Feature Breakdown）- 每个领域 2-4 小时

**目标**：将每个领域分解为 5-15 个独立功能

**方法**：用户故事（User Story）+ 验收标准

#### 步骤 1.1：用户故事枚举（每个领域 1 小时）

**输入**：领域定义 + 用户需求

**输出**：用户故事列表
```yaml
domain: "数据管理"
user_stories:
  - id: "US-001"
    as: "数据分析师"
    i_want: "查询最近 30 天的订单数据"
    so_that: "可以分析销售趋势"
    priority: P0
    estimated_complexity: 3  # 1-5 分
  
  - id: "US-002"
    as: "数据分析师"
    i_want: "导出查询结果为 CSV"
    so_that: "可以用 Excel 进一步分析"
    priority: P1
    estimated_complexity: 2
  
  - id: "US-003"
    as: "数据管理员"
    i_want: "批量删除过期数据"
    so_that: "节省存储空间"
    priority: P2
    estimated_complexity: 4
```

**枚举原则**：
- 每个故事独立可交付
- 每个故事 1-3 天完成
- 覆盖该领域的所有功能点

**Skill**：`spec-user-story-breakdown`（新增）

---

#### 步骤 1.2：验收标准定义（每个故事 15 分钟）

**输出**：详细验收标准
```yaml
user_story: "US-001"
acceptance_criteria:
  - given: "用户已登录"
    when: "选择时间范围为最近 30 天"
    then: "显示该时间范围内的所有订单"
    test_data: "测试数据集 A（包含 100 条订单）"
  
  - given: "用户已登录"
    when: "时间范围内无订单"
    then: "显示空列表和提示信息'无数据'"
    test_data: "空数据集"
  
  - given: "用户已登录"
    when: "时间范围内有 10000+ 条订单"
    then: "分页显示，每页 100 条，响应时间 <2s"
    test_data: "大数据集 B（10000 条订单）"

boundary_conditions:
  - condition: "空输入（时间范围为空）"
    expected: "默认最近 7 天"
  
  - condition: "时间范围超长（>1 年）"
    expected: "警告提示，限制最多 90 天"
  
  - condition: "并发查询（100 个用户同时查询）"
    expected: "每个查询独立，响应时间 <3s"
```

**关键**：验收标准必须可测试、可度量

---

#### 步骤 1.3：功能依赖分析（每个领域 30 分钟）

**输出**：功能依赖图
```yaml
domain: "数据管理"
feature_dependencies:
  - feature: "US-001（查询订单）"
    depends_on: []  # 无依赖，可首先开发
  
  - feature: "US-002（导出 CSV）"
    depends_on: ["US-001"]  # 依赖查询功能
  
  - feature: "US-003（批量删除）"
    depends_on: ["US-001"]  # 依赖查询功能（先查询后删除）

parallel_groups:
  - group: "G1"
    features: ["US-001"]
    can_start_immediately: true
  
  - group: "G2"
    features: ["US-002", "US-003"]
    can_start_after: "G1"
    parallelizable: true  # G2 内的功能可并行
```

---

### 阶段 2：任务拆分（Task Splitting）- 每个功能 1-2 小时

**目标**：将功能拆分为可独立开发的任务

**方法**：垂直切片（Vertical Slicing）

#### 垂直切片示例

**功能**：US-001（查询最近 30 天的订单数据）

**水平切片**（❌ 不推荐）：
```yaml
# 按技术层划分
tasks:
  - task: "前端 UI 开发"
  - task: "后端 API 开发"
  - task: "数据库查询优化"
  - task: "测试"
# 问题：前 3 个任务都完成后才能集成测试
```

**垂直切片**（✅ 推荐）：
```yaml
# 按功能切片，每个切片端到端
tasks:
  - task: "T001-基础查询"
    description: "实现基础查询功能，单条件，无分页"
    includes:
      - frontend: "查询表单 + 结果列表"
      - backend: "查询 API"
      - database: "基础 SQL"
      - test: "端到端测试"
    estimated_time: "4 小时"
    deliverable: "可演示的最小功能"
  
  - task: "T002-分页支持"
    description: "在 T001 基础上增加分页"
    depends_on: "T001"
    estimated_time: "2 小时"
  
  - task: "T003-多条件查询"
    description: "支持多个查询条件组合"
    depends_on: "T001"
    estimated_time: "3 小时"
  
  - task: "T004-性能优化"
    description: "大数据集查询优化"
    depends_on: "T001"
    estimated_time: "3 小时"
```

**垂直切片的优势**：
- 每个任务独立可测试
- 每个任务完成后有可演示的增量
- 风险暴露更早

**Skill**：`spec-task-splitting`（新增）

---

### 阶段 3：并行开发 - 契约驱动

**目标**：多个任务并行开发，无阻塞

**方法**：Contract-Driven Development

#### 步骤 3.1：Contract Mock（每个依赖 15 分钟）

**场景**：任务 A 依赖任务 B，但 B 还未完成

**解决方案**：Mock B 的 Contract

```python
# 任务 B 的 Contract
class DataService:
    def query_data(self, token: str, query: QueryObject) -> QueryResult:
        """
        查询数据
        """
        pass

# 任务 A 使用 Mock
class MockDataService(DataService):
    def query_data(self, token: str, query: QueryObject) -> QueryResult:
        # 返回符合 Contract 的假数据
        return QueryResult(
            data=[{"order_id": "001", "amount": 100}],
            total=1
        )

# 任务 A 的代码
class ReportGenerator:
    def __init__(self, data_service: DataService):
        self.data_service = data_service  # 可以是真实的或 Mock
    
    def generate_report(self, query: QueryObject):
        result = self.data_service.query_data(token, query)
        # 生成报表逻辑
        return format_report(result.data)

# 开发时使用 Mock
report_gen = ReportGenerator(MockDataService())

# 集成时替换为真实实现
report_gen = ReportGenerator(RealDataService())
```

**关键**：
- Mock 必须严格遵守 Contract
- Mock 应该包含边界情况（空数据、错误等）
- Mock 应该有测试验证（Contract Test）

---

#### 步骤 3.2：Contract Test（每个 Contract 30 分钟）

**目的**：验证真实实现是否遵守 Contract

```python
def test_data_service_contract():
    """
    Contract Test for DataService
    """
    service = RealDataService()  # 真实实现
    
    # Test 1: 正常查询
    query = QueryObject(date_range="2024-01-01 to 2024-01-31")
    result = service.query_data(token="valid_token", query=query)
    
    assert isinstance(result, QueryResult)  # 返回类型正确
    assert isinstance(result.data, list)  # data 是列表
    assert isinstance(result.total, int)  # total 是整数
    
    # Test 2: 空结果
    query = QueryObject(date_range="2099-01-01 to 2099-01-31")
    result = service.query_data(token="valid_token", query=query)
    
    assert result.data == []  # 空列表
    assert result.total == 0
    
    # Test 3: 错误处理
    with pytest.raises(AuthenticationError):
        service.query_data(token="invalid_token", query=query)

# 所有实现（包括 Mock）都必须通过 Contract Test
test_data_service_contract_with_mock()
test_data_service_contract_with_real()
```

**Contract Test 的价值**：
- 保证 Mock 和真实实现一致
- 集成时无需重新测试依赖方
- 可以独立并行测试

---

### 阶段 4：渐进式集成（Incremental Integration）

**目标**：避免"大爆炸集成"，渐进式集成降低风险

**方法**：每完成一个任务，立即集成

#### 集成策略

**大爆炸集成**（❌ 不推荐）：
```yaml
# 所有任务都开发完成后，一次性集成
week_1-4: 开发所有任务
week_5: 集成
# 问题：集成时发现大量问题，难以定位
```

**渐进式集成**（✅ 推荐）：
```yaml
day_1: T001 开发完成 → 立即集成到主分支 → 通过 Contract Test
day_2: T002 开发完成 → 集成 → 验证与 T001 的兼容性
day_3: T003 开发完成 → 集成 → 验证
day_4: T004 开发完成 → 集成 → 验证
# 每天都有可工作的版本
```

**集成验证清单**：
```yaml
integration_checklist:
  - contract_test_passed: bool  # Contract Test 必须通过
  - backward_compatible: bool  # 不破坏已有功能
  - performance_acceptable: bool  # 性能指标达标
  - documentation_updated: bool  # 文档已更新
```

---

### 阶段 5：端到端验证（End-to-End Validation）

**目标**：验证整个需求是否完整实现

#### 步骤 5.1：需求追溯（1 小时）

**验证**：每个用户故事是否都已实现

```yaml
requirement_traceability:
  - user_story: "US-001"
    tasks: ["T001", "T002", "T003", "T004"]
    status: "completed"
    acceptance_criteria_verified: 3/3  # 3 个验收标准全部验证通过
  
  - user_story: "US-002"
    tasks: ["T005", "T006"]
    status: "completed"
    acceptance_criteria_verified: 2/2
```

**如果发现遗漏**：
- 立即标记为 P0 bug
- 补充任务开发

---

#### 步骤 5.2：端到端场景测试（2-4 小时）

**测试**：真实用户场景

```yaml
e2e_scenarios:
  - scenario: "数据分析师的一天"
    steps:
      - step: "登录系统"
        expected: "成功登录"
      
      - step: "查询最近 30 天订单"
        expected: "显示 1234 条订单"
      
      - step: "导出为 CSV"
        expected: "下载 orders_2024.csv"
      
      - step: "用 Excel 打开 CSV"
        expected: "数据正确，格式正确"
    
    status: "passed"
```

---

## 🛠️ Skill 设计：新增 6 个 Skill

### Skill 1: spec-domain-decomposition

**输入**：用户需求描述

**输出**：
```yaml
domains: [Domain]
dependencies: [Dependency]
development_order: [Phase]
domain_contracts: [Contract]
```

---

### Skill 2: spec-user-story-breakdown

**输入**：领域定义

**输出**：
```yaml
user_stories: [UserStory]
  - id: string
    as: string
    i_want: string
    so_that: string
    priority: P0 | P1 | P2
    estimated_complexity: 1-5
    acceptance_criteria: [Criterion]
    boundary_conditions: [Boundary]
```

---

### Skill 3: spec-task-splitting

**输入**：用户故事

**输出**：
```yaml
tasks: [Task]
  - id: string
    description: string
    includes:
      frontend: string
      backend: string
      database: string
      test: string
    depends_on: [string]
    estimated_time: string
    deliverable: string
```

---

### Skill 4: spec-contract-mock

**输入**：Contract 定义

**输出**：Mock 实现代码

---

### Skill 5: spec-contract-test

**输入**：Contract 定义

**输出**：Contract Test 代码

---

### Skill 6: spec-integration-plan

**输入**：任务列表 + 依赖关系

**输出**：
```yaml
integration_plan:
  daily_integration_tasks: [Task]
  integration_checklist: [Check]
  rollback_strategy: string
```

---

## 📊 方案对比：传统 vs 分层分治

### 场景：100 个功能点的超大需求

| 维度 | 传统方法 | 分层分治方法 |
|---|---|---|
| **需求理解** | 一次性理解 100 个功能 | 分 5 个领域，每次理解 20 个 |
| **PRD 大小** | 1 个 500 页 PRD | 5 个 100 页领域 PRD |
| **Plan 大小** | 1 个 1000 页 Plan | 20 个 50 页 Task Plan |
| **并行度** | 低（依赖不清晰）| 高（Contract 支持并行）|
| **集成风险** | 极高（大爆炸集成）| 低（渐进式集成）|
| **首次可交付** | 12-16 周 | 4-6 周（MVP）|
| **返工率** | 80-90% | 20-30% |
| **上下文管理** | 极难（200K tokens 不够）| 可管理（每次 20-40K tokens）|

---

## 🎯 实施建议

### 对于当前 Skill 优化项目

**Phase 0 扩展**：
- 追踪 2-3 个"跨模块需求"类型的任务
- 评估当前 Skill 在超大需求场景下的表现
- 识别哪些环节最容易失败

**Phase 1 优化**：
- 如果 Phase 0 发现超大需求是高频问题
- 新增 6 个分层分治 Skill
- 设计 Contract-First 工作流

### 适用场景

**适合分层分治**：
- 功能点 >20 个
- 跨 3 个以上模块
- 开发周期 >4 周
- 需要并行开发

**不适合分层分治**（过度设计）：
- 功能点 <10 个
- 单模块内
- 开发周期 <2 周
- 单人开发

---

## ✅ 检查清单

### 阶段 0：领域划分

- [ ] 识别 3-7 个核心领域
- [ ] 依赖分析（无循环依赖）
- [ ] 优先级排序（MVP 定义清晰）
- [ ] Contract 预定义（所有接口明确）

### 阶段 1：功能分解

- [ ] 每个领域 5-15 个用户故事
- [ ] 每个故事有验收标准（可测试）
- [ ] 每个故事有边界条件（≥3 项）
- [ ] 功能依赖分析（可并行组识别）

### 阶段 2：任务拆分

- [ ] 每个功能 3-7 个任务
- [ ] 每个任务是垂直切片（端到端）
- [ ] 每个任务 1-3 天完成
- [ ] 任务依赖清晰

### 阶段 3：并行开发

- [ ] 所有依赖都有 Mock
- [ ] 所有 Contract 都有 Contract Test
- [ ] Mock 和真实实现都通过 Contract Test

### 阶段 4：渐进式集成

- [ ] 每完成一个任务立即集成
- [ ] 集成清单都通过
- [ ] 每天都有可工作的版本

### 阶段 5：端到端验证

- [ ] 需求追溯 100%
- [ ] 端到端场景测试通过
- [ ] 性能指标达标

---

**文档完成日期**：2026-11-03  
**文档版本**：v1.0  
**适用场景**：功能点 >20，跨模块，开发周期 >4 周  
**核心方法**：分层分治 + Contract-First + 垂直切片 + 渐进式集成  
**状态**：✅ 深度思考完成
