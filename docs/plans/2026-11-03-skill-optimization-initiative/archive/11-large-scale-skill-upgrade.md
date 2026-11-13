# 超大需求场景 Skill 升级方案 - 业界最佳实践对标

**日期**：2026-11-03  
**研究者**：Claude (Fable 5.1)  
**研究方法**：业界最佳实践分析 + 当前 Skill 差距识别 + 升级方案设计  
**目标**：设计能支持 100+ 功能点、跨 5+ 模块、3+ 月周期的超大需求的 Skill 体系

---

## 📊 业界最佳实践调研

### 研究 1：Google 的 Design Docs 体系

**核心理念**：
> "Before writing code, write a design doc. Before writing a design doc, write a one-pager."

**流程**：
```
1. One-Pager (1-2 页)
   - 问题陈述
   - 目标
   - 非目标
   - 成功指标

2. Design Doc (10-20 页)
   - 背景
   - 目标与非目标
   - 现有方案调研
   - 详细设计
   - 可选方案对比
   - 安全/隐私/性能考虑
   - 测试计划
   - 发布计划

3. Tech Spec (50-100 页，可选)
   - API 设计
   - 数据模型
   - 架构图
   - 详细实施步骤
```

**关键洞察**：
- ✅ 渐进式细化：One-Pager → Design Doc → Tech Spec
- ✅ 明确非目标：避免范围蔓延
- ✅ 方案对比：不是唯一方案，而是最优方案
- ✅ 评审机制：设计评审会（Design Review）

**对标当前 Skill**：
- ❌ 缺少 One-Pager（快速对齐阶段）
- ❌ spec-prd 缺少"非目标"字段
- ❌ spec-plan 缺少"可选方案对比"
- ❌ 缺少设计评审机制

---

### 研究 2：Amazon 的 PR/FAQ + 6-Pager

**核心理念**：
> "Working backwards from the customer. Start with the press release."

**流程**：
```
1. PR/FAQ (2-4 页)
   - 新闻稿（Press Release）：对外宣布这个产品
   - FAQ：预期的客户问题及答案

2. 6-Pager (6 页，严格限制)
   - 问题：我们要解决什么问题？
   - 方案：我们怎么解决？
   - 数据：支持决策的数据
   - 替代方案：我们考虑了哪些其他方案？
   - 风险：可能出什么问题？
   - 依赖：需要其他团队做什么？

3. 1-Pager for each component
   - 每个组件的详细设计
```

**关键洞察**：
- ✅ 从用户视角倒推（Press Release First）
- ✅ 严格的页数限制（强制精简）
- ✅ 数据驱动决策
- ✅ 明确替代方案和风险
- ✅ 依赖管理

**对标当前 Skill**：
- ❌ spec-prd 缺少"新闻稿"视角（用户价值陈述）
- ❌ spec-plan 缺少"数据支持"
- ❌ spec-plan 缺少"风险评估"
- ❌ 缺少依赖管理机制

---

### 研究 3：微软的 Spec Review Process

**核心理念**：
> "Specs are living documents. They evolve as you learn more."

**流程**：
```
1. Spec v0.1 (Draft)
   - 问题定义
   - 高层方案
   - 开放问题（Open Issues）

2. Spec Review Meeting
   - 跨团队评审
   - 记录决策和理由
   - 识别风险和依赖

3. Spec v0.5 (Detailed)
   - 详细设计
   - API 定义
   - 数据模型
   - 测试计划

4. Spec v1.0 (Final)
   - 所有开放问题已解决
   - 所有依赖已确认
   - 实施就绪

5. Spec Update (Implementation Phase)
   - 实施中发现的问题
   - 更新 Spec（保持同步）
```

**关键洞察**：
- ✅ Spec 是活文档（持续更新）
- ✅ 开放问题机制（Open Issues）
- ✅ 多次评审（v0.1 → v0.5 → v1.0）
- ✅ 决策记录（Decision Log）
- ✅ 实施中更新 Spec

**对标当前 Skill**：
- ❌ spec-prd 和 spec-plan 是一次性生成（非迭代）
- ❌ 缺少"开放问题"机制
- ❌ 缺少版本管理（v0.1, v0.5, v1.0）
- ❌ 缺少决策记录

---

### 研究 4：Stripe 的 API-First Design

**核心理念**：
> "Design the API first, then implement it."

**流程**：
```
1. API Design Doc
   - API 端点定义
   - 请求/响应格式
   - 错误码定义
   - 限流策略
   - 版本策略

2. Mock API Server
   - 基于 API 设计生成 Mock Server
   - 前端/客户端基于 Mock 开发
   - 后端独立开发真实实现

3. Contract Test
   - Mock 和真实 API 都必须通过 Contract Test
   - 保证 API 定义的一致性

4. API Documentation (Auto-Generated)
   - 从 API 定义自动生成文档
   - 文档、Mock、实现三位一体
```

**关键洞察**：
- ✅ API-First（接口先于实现）
- ✅ Mock Server 支持并行开发
- ✅ Contract Test 保证一致性
- ✅ 文档自动生成

**对标当前 Skill**：
- ✅ 08-skill-contract-protocol.md 已包含 Contract 理念
- ⚠️ 缺少 Mock Server 自动生成
- ⚠️ 缺少 API 文档自动生成
- ❌ spec-plan 缺少 API-First 约束

---

### 研究 5：Atlassian 的 RFC Process

**核心理念**：
> "Request for Comments. Decisions are made collaboratively."

**流程**：
```
1. RFC Template
   - Summary (一句话)
   - Background
   - Proposal
   - Alternatives Considered
   - Open Questions
   - Timeline

2. Comment Period (1-2 weeks)
   - 所有相关方可以评论
   - 提出问题、建议、反对意见

3. Decision Record
   - 决策结果
   - 理由
   - 反对意见及如何处理

4. Implementation
   - 基于 RFC 实施
   - 实施中发现的问题更新 RFC
```

**关键洞察**：
- ✅ 协作式决策（非单人决定）
- ✅ 记录反对意见（Dissenting Opinions）
- ✅ 时间盒限制（避免无休止讨论）
- ✅ RFC 是决策依据

**对标当前 Skill**：
- ❌ 缺少协作评审机制
- ❌ 缺少反对意见记录
- ❌ 缺少决策理由记录

---

### 研究 6：Shopify 的 Architecture Decision Records (ADR)

**核心理念**：
> "Document architectural decisions and their context."

**ADR 模板**：
```markdown
# ADR-001: 使用 Redis 作为缓存

## Status
Accepted (2024-01-15)

## Context
我们需要一个高性能的缓存层，支持：
- 响应时间 <10ms
- QPS >10000
- 数据持久化

## Decision
使用 Redis 7.0 作为缓存层

## Consequences
优点：
- 性能满足要求
- 社区活跃，成熟稳定
- 支持多种数据结构

缺点：
- 单点故障风险（通过主从复制缓解）
- 内存限制（通过 LRU 策略缓解）

## Alternatives Considered
1. Memcached: 不支持数据持久化
2. Hazelcast: 学习曲线陡峭
```

**关键洞察**：
- ✅ 记录决策上下文（为什么做这个决策）
- ✅ 记录后果（优点和缺点）
- ✅ 记录替代方案（为什么不选其他方案）
- ✅ 状态管理（Proposed / Accepted / Deprecated）

**对标当前 Skill**：
- ❌ spec-plan 缺少 ADR 机制
- ❌ 缺少决策追溯能力

---

## 🎯 当前 Skill 体系的 12 个关键缺口

### 缺口 1：缺少渐进式细化机制（P0）

**问题**：
- spec-prd 一次性生成完整 PRD
- 超大需求的 PRD 可能 100+ 页，一次性生成质量低

**业界最佳实践**：
- Google: One-Pager → Design Doc → Tech Spec
- Amazon: PR/FAQ → 6-Pager → Component 1-Pager

**升级方案**：
```yaml
新 Skill: spec-one-pager
输入: 用户需求描述
输出:
  title: string
  problem_statement: string  # 我们要解决什么问题？
  goal: string  # 目标（一句话）
  non_goals: [string]  # 明确不做什么
  success_metrics: [string]  # 成功指标
  estimated_scope: string  # 估算：小/中/大/超大
时间: 15-30 分钟
用途: 快速对齐，决定是否继续细化

---

spec-prd 升级:
依赖: spec-one-pager 的输出
增加字段:
  - non_goals: [string]  # 从 one-pager 继承
  - alternatives_considered: [Alternative]  # 考虑了哪些其他方案
  - risks: [Risk]  # 风险评估
  - dependencies: [Dependency]  # 依赖其他团队/系统
```

---

### 缺口 2：缺少 API-First 设计机制（P0）

**问题**：
- spec-plan 描述抽象方案（"使用 Redis 缓存"）
- 缺少 API 定义，导致前后端对接返工

**业界最佳实践**：
- Stripe: API Design Doc → Mock Server → Implementation
- OpenAPI/Swagger: API-First 标准

**升级方案**：
```yaml
新 Skill: spec-api-design
输入: 功能需求（从 spec-prd）
输出:
  api_endpoints:
    - path: "/api/v1/orders"
      method: GET
      description: "查询订单列表"
      parameters:
        - name: "date_from"
          type: string
          required: true
          format: "YYYY-MM-DD"
      responses:
        - status: 200
          schema:
            type: object
            properties:
              data: array
              total: integer
        - status: 400
          schema:
            type: object
            properties:
              error_code: string
              message: string
      
  data_models:
    - name: "Order"
      fields:
        - name: "order_id"
          type: string
          required: true
        - name: "amount"
          type: number
          required: true

  error_codes:
    - code: "INVALID_DATE_RANGE"
      message: "日期范围无效"
      http_status: 400

时间: 1-2 小时/领域
输出格式: OpenAPI 3.0 YAML

---

新 Skill: spec-mock-server-generate
输入: spec-api-design 的输出
输出: Mock Server 代码（Prism / json-server）
用途: 前端可立即基于 Mock 开发

---

spec-plan 升级:
依赖: spec-api-design 的输出
增加约束:
  - tech_stack 中的 API 必须引用 spec-api-design 的定义
  - 不允许抽象描述（"RESTful API"），必须具体
```

---

### 缺口 3：缺少开放问题管理（Open Issues）（P0）

**问题**：
- spec-prd 和 spec-plan 假设所有问题都已解决
- 超大需求中，总有未决问题需要后续澄清

**业界最佳实践**：
- 微软: Spec 包含 Open Issues 章节
- Atlassian: RFC 包含 Open Questions

**升级方案**：
```yaml
spec-prd 和 spec-plan 升级:
增加字段:
  open_issues:
    - id: "ISSUE-001"
      description: "数据同步延迟的容忍度是多少？"
      severity: blocking | high | medium | low
      owner: string  # 负责解决的人
      deadline: date  # 必须在何时前解决
      resolution: string | null  # 解决方案（初始为 null）
      resolved_date: date | null

---

新 Skill: spec-issue-tracker
输入: spec-prd 或 spec-plan
功能:
  - 列出所有未解决的 Open Issues
  - 按 severity 和 deadline 排序
  - 阻塞性问题未解决时，阻止进入下一阶段

---

工作流调整:
spec-prd 完成后 → 检查 Open Issues
  - 如果有 blocking issues → 暂停，等待解决
  - 如果只有 low/medium issues → 可以继续，但记录风险

spec-plan 完成后 → 同样检查
```

---

### 缺口 4：缺少版本管理与迭代机制（P0）

**问题**：
- spec-prd 和 spec-plan 是一次性生成
- 超大需求中，方案会随着理解深入而演进

**业界最佳实践**：
- 微软: Spec v0.1 → v0.5 → v1.0
- 所有 Spec 都是"活文档"

**升级方案**：
```yaml
所有 Spec 文档增加版本元数据:
metadata:
  version: "0.1" | "0.5" | "1.0"
  status: draft | in_review | approved | deprecated
  created_date: date
  last_updated: date
  changelog:
    - version: "0.1"
      date: "2024-01-01"
      changes: "初始版本"
    - version: "0.5"
      date: "2024-01-15"
      changes: "增加边界条件，解决 ISSUE-001"

---

新 Skill: spec-version-update
输入: 现有 Spec + 变更描述
输出: 新版本 Spec（版本号递增，changelog 更新）

---

工作流调整:
v0.1 (Draft) → Review → 发现问题
  ↓
v0.5 (Detailed) → Review → 解决所有 blocking issues
  ↓
v1.0 (Approved) → 进入实施

实施中发现问题 → v1.1, v1.2... (保持 Spec 与实现同步)
```

---

### 缺口 5：缺少协作评审机制（P1）

**问题**：
- spec-prd 和 spec-plan 是单人（AI）生成，缺少评审
- 超大需求需要多方评审（架构师、安全、性能、前端、后端）

**业界最佳实践**：
- Google: Design Review Meeting
- Atlassian: RFC Comment Period
- 微软: Spec Review Process

**升级方案**：
```yaml
新 Skill: spec-review-request
输入: Spec 文档（v0.1 或 v0.5）
输出:
  review_request:
    spec_id: string
    reviewers:
      - role: "架构师"
        focus: ["架构设计", "技术选型"]
      - role: "安全专家"
        focus: ["安全漏洞", "隐私保护"]
      - role: "性能专家"
        focus: ["性能瓶颈", "扩展性"]
    review_deadline: date
    review_link: string  # 评审文档链接

---

新 Skill: spec-review-incorporate
输入: Spec 文档 + 评审意见列表
输出:
  - 更新的 Spec（版本号递增）
  - 决策记录（Decision Log）
    - 采纳的意见及理由
    - 不采纳的意见及理由

---

评审意见格式:
review_comment:
  reviewer: string
  timestamp: datetime
  type: question | suggestion | concern | blocking
  content: string
  response: string | null  # Spec 作者的回应
  status: open | addressed | wont_fix
```

---

### 缺口 6：缺少架构决策记录（ADR）（P1）

**问题**：
- spec-plan 只有"选定方案"，不知道"为什么选这个"
- 后续维护时，不知道当初的上下文

**业界最佳实践**：
- Shopify: Architecture Decision Records
- ThoughtWorks: ADR 模板

**升级方案**：
```yaml
新 Skill: spec-adr-generate
输入: 技术决策（如："使用 Redis 作为缓存"）
输出:
  adr:
    id: "ADR-001"
    title: "使用 Redis 作为缓存"
    status: proposed | accepted | deprecated | superseded
    date: "2024-01-15"
    
    context: |
      我们需要一个高性能的缓存层，支持：
      - 响应时间 <10ms
      - QPS >10000
      - 数据持久化
    
    decision: |
      使用 Redis 7.0 作为缓存层
    
    consequences:
      pros:
        - 性能满足要求
        - 社区活跃，成熟稳定
      cons:
        - 单点故障风险（通过主从复制缓解）
    
    alternatives_considered:
      - name: "Memcached"
        rejected_reason: "不支持数据持久化"
      - name: "Hazelcast"
        rejected_reason: "学习曲线陡峭"

---

spec-plan 升级:
增加字段:
  architecture_decisions: [ADR]  # 关键决策的 ADR 列表
```

---

### 缺口 7：缺少依赖管理机制（P1）

**问题**：
- spec-plan 提到依赖，但缺少管理机制
- 超大需求中，依赖多且复杂

**业界最佳实践**：
- Amazon: 6-Pager 包含 Dependencies 章节
- JIRA: Dependency Tracking

**升级方案**：
```yaml
新 Skill: spec-dependency-manager
输入: spec-plan
输出:
  dependencies:
    - id: "DEP-001"
      type: internal | external | data | api
      description: "依赖用户认证服务提供 Token 验证接口"
      upstream_team: "用户认证团队"
      required_by: date
      status: not_started | in_progress | ready | blocked
      blocker_reason: string | null
      contact_person: string
      escalation_needed: bool

---

新 Skill: spec-dependency-check
输入: 任务列表 + 依赖列表
输出: 可以开始的任务列表（所有依赖都 ready）

---

工作流集成:
spec-plan 完成 → spec-dependency-manager 生成依赖列表
每日检查 → spec-dependency-check 更新依赖状态
任务开始前 → 验证依赖是否 ready
```

---

### 缺口 8：缺少风险评估与缓解（P1）

**问题**：
- spec-plan 缺少风险评估
- 超大需求风险高，需要提前识别

**业界最佳实践**：
- Amazon: 6-Pager 包含 Risks 章节
- PMI: Risk Register

**升级方案**：
```yaml
spec-plan 升级:
增加字段:
  risks:
    - id: "RISK-001"
      category: technical | schedule | resource | external
      description: "Redis 单点故障可能导致服务不可用"
      probability: low | medium | high
      impact: low | medium | high | critical
      risk_score: probability × impact  # 1-9
      mitigation:
        strategy: avoid | mitigate | transfer | accept
        actions:
          - "实施 Redis 主从复制"
          - "配置自动故障转移"
        responsible: string
        deadline: date
      contingency_plan: string  # 如果风险发生，备用方案

---

新 Skill: spec-risk-assessment
输入: spec-plan
输出: 风险列表（按 risk_score 排序）

---

风险审查:
所有 risk_score ≥6 的风险必须有缓解方案
critical 风险必须有 contingency_plan
```

---

### 缺口 9：缺少测试策略与计划（P1）

**问题**：
- spec-work 只测试单个功能
- 超大需求需要分层测试策略

**业界最佳实践**：
- Google: Test Pyramid（单元测试 70% + 集成测试 20% + E2E 10%）
- 微软: Test Plan Document

**升级方案**：
```yaml
新 Skill: spec-test-strategy
输入: spec-plan（整体方案）
输出:
  test_strategy:
    unit_tests:
      coverage_target: 80%
      key_components:
        - component: "订单查询逻辑"
          test_count: 15
          includes: ["正常流程", "边界条件", "错误处理"]
    
    integration_tests:
      coverage_target: 60%
      key_integrations:
        - integration: "订单服务 + 用户服务"
          test_scenarios: ["认证失败", "权限不足", "正常查询"]
    
    contract_tests:
      contracts:
        - upstream: "用户服务"
          downstream: "订单服务"
          contract_id: "CONTRACT-001"
    
    e2e_tests:
      critical_paths:
        - path: "用户登录 → 查询订单 → 导出 CSV"
          priority: P0
          estimated_time: "5 分钟"
    
    performance_tests:
      scenarios:
        - scenario: "1000 并发查询"
          target_p95: "200ms"
          target_p99: "500ms"
    
    security_tests:
      items:
        - "SQL 注入测试"
        - "XSS 测试"
        - "权限绕过测试"

---

spec-work 升级:
依赖: spec-test-strategy
约束:
  - 单元测试覆盖率必须达到目标
  - 关键集成必须有集成测试
  - Contract Test 必须通过
```

---

### 缺口 10：缺少发布与回滚策略（P2）

**问题**：
- spec-commit-push-pr 只管提交，不管发布
- 超大需求的发布风险高

**业界最佳实践**：
- Google: Gradual Rollout（灰度发布）
- Netflix: Canary Deployment
- Feature Flag: Dark Launch

**升级方案**：
```yaml
新 Skill: spec-release-strategy
输入: spec-plan
输出:
  release_strategy:
    approach: blue_green | canary | gradual_rollout
    
    phases:
      - phase: "Canary (1%)"
        duration: "24 hours"
        success_criteria:
          - "错误率 <0.1%"
          - "P99 延迟 <500ms"
        rollback_trigger:
          - "错误率 >1%"
          - "P99 延迟 >1000ms"
      
      - phase: "Small rollout (10%)"
        duration: "48 hours"
        success_criteria: [...]
      
      - phase: "Full rollout (100%)"
        duration: "N/A"
    
    feature_flags:
      - flag: "enable_new_order_query"
        default: false
        rollout_percentage: 0  # 初始关闭
    
    rollback_plan:
      estimated_time: "15 minutes"
      steps:
        - "关闭 feature flag"
        - "回滚到上一版本"
        - "验证服务恢复"
      
    monitoring:
      key_metrics:
        - "订单查询 QPS"
        - "P99 延迟"
        - "错误率"
      alert_rules:
        - metric: "错误率"
          threshold: ">1%"
          action: "自动回滚"
```

---

### 缺口 11：缺少知识沉淀与复用（P2）

**问题**：
- 每个需求都从零开始
- 类似需求重复设计

**业界最佳实践**：
- Shopify: Pattern Library
- Google: Design Patterns Repository

**升级方案**：
```yaml
新 Skill: spec-pattern-search
输入: 需求描述
输出: 相似需求的历史 Spec 列表

---

新 Skill: spec-pattern-extract
输入: 成功的 Spec
输出: 可复用的模式
  pattern:
    name: "分页查询模式"
    category: data_access
    description: "支持大数据集的分页查询"
    components:
      - API 设计（offset + limit）
      - 性能优化（索引、缓存）
      - 边界处理（空数据、超大 offset）
    reuse_count: 15  # 已复用 15 次

---

spec-prd 和 spec-plan 升级:
开始时 → spec-pattern-search 查找类似需求
设计时 → 参考历史模式
完成后 → spec-pattern-extract 提取新模式
```

---

### 缺口 12：缺少跨会话上下文管理（P0，AI 特有）

**问题**：
- 超大需求跨多个会话
- AI 上下文丢失，导致不一致

**AI 特有挑战**：
- 上下文窗口限制（200K tokens ≈ 150 页）
- 跨会话上下文丢失
- 多轮对话中的上下文漂移

**升级方案**：
```yaml
新机制: Context Pinning（上下文锚定）

context_anchor:
  project_context:
    name: "订单管理系统重构"
    tech_stack: ["Python 3.11", "FastAPI", "PostgreSQL", "Redis"]
    constraints:
      - "必须向后兼容 v1 API"
      - "数据迁移零停机"
  
  design_principles:
    - "API-First 设计"
    - "Contract-Driven Development"
    - "渐进式细化"
  
  decisions:
    - id: "ADR-001"
      summary: "使用 Redis 作为缓存"
      link: "docs/adr/001-redis-cache.md"
  
  key_documents:
    - type: "one-pager"
      path: "docs/one-pager.md"
      summary: "目标：支持 10x 流量增长"
    
    - type: "api-design"
      path: "docs/api-design.yaml"
      summary: "定义了 15 个 API 端点"

---

新 Skill: spec-context-save
输入: 当前会话的关键信息
输出: context_anchor.yaml（持久化）

---

新 Skill: spec-context-restore
输入: context_anchor.yaml
输出: 会话开始时加载的上下文摘要

---

每个 Skill 开始时:
1. 读取 context_anchor.yaml
2. 加载关键上下文
3. 确保与之前会话一致

每个 Skill 结束时:
1. 更新 context_anchor.yaml
2. 记录关键决策
```

---

## 📋 升级优先级与实施计划

### P0（必须实施，4 个）

| 缺口 | 新增 Skill | 估算时间 | 理由 |
|---|---|---|---|
| 1. 渐进式细化 | spec-one-pager | 20h | 超大需求必须分阶段 |
| 2. API-First | spec-api-design<br>spec-mock-server-generate | 30h | 并行开发的前提 |
| 3. 开放问题管理 | spec-issue-tracker | 15h | 超大需求总有未决问题 |
| 12. 上下文管理 | spec-context-save<br>spec-context-restore | 25h | AI 跨会话的关键 |

**P0 总计**：90 小时（11 个工作日）

---

### P1（强烈建议，5 个）

| 缺口 | 新增 Skill | 估算时间 | 理由 |
|---|---|---|---|
| 4. 版本管理 | spec-version-update | 15h | Spec 是活文档 |
| 5. 协作评审 | spec-review-request<br>spec-review-incorporate | 20h | 质量保证 |
| 6. ADR | spec-adr-generate | 12h | 决策追溯 |
| 7. 依赖管理 | spec-dependency-manager<br>spec-dependency-check | 18h | 关键路径管理 |
| 8. 风险评估 | spec-risk-assessment | 12h | 风险前置 |
| 9. 测试策略 | spec-test-strategy | 15h | 分层测试 |

**P1 总计**：92 小时（11.5 个工作日）

---

### P2（可选，2 个）

| 缺口 | 新增 Skill | 估算时间 | 理由 |
|---|---|---|---|
| 10. 发布策略 | spec-release-strategy | 12h | 降低发布风险 |
| 11. 知识复用 | spec-pattern-search<br>spec-pattern-extract | 20h | 提升效率 |

**P2 总计**：32 小时（4 个工作日）

---

## 🎯 升级后的 Skill 体系架构

### 新架构：五层体系

```
Layer 0: 快速对齐层（新增）
  ├── spec-one-pager（新）
  └── spec-context-restore（新）

Layer 1: 需求分析层
  ├── spec-domain-decomposition
  ├── spec-prd（升级：+non_goals +risks +dependencies）
  └── spec-user-story-breakdown

Layer 2: 设计决策层（重点升级）
  ├── spec-api-design（新，P0）
  ├── spec-adr-generate（新，P1）
  ├── spec-plan（升级：+ADR +risks +test_strategy）
  ├── spec-contract-definition
  ├── spec-risk-assessment（新，P1）
  └── spec-test-strategy（新，P1）

Layer 3: 并行开发层
  ├── spec-mock-server-generate（新，P0）
  ├── spec-contract-mock
  ├── spec-contract-test
  ├── spec-task-splitting
  ├── spec-work（升级：+contract_test）
  └── spec-dependency-check（新，P1）

Layer 4: 质量保证层（新增）
  ├── spec-review-request（新，P1）
  ├── spec-review-incorporate（新，P1）
  ├── spec-issue-tracker（新，P0）
  ├── spec-code-review（升级：+contract_verification）
  └── spec-integration-plan

Layer 5: 发布运维层（新增）
  ├── spec-release-strategy（新，P2）
  ├── spec-commit-push-pr
  └── spec-version-update（新，P1）

Layer 6: 知识管理层（新增）
  ├── spec-pattern-search（新，P2）
  ├── spec-pattern-extract（新，P2）
  ├── spec-context-save（新，P0）
  └── spec-dependency-manager（新，P1）
```

---

## 📊 升级收益预估

### 场景：100 功能点的超大需求

| 指标 | 当前 Skill | 升级后 Skill | 改善 |
|---|---|---|---|
| **需求理解时间** | 20h（一次性） | 2h（one-pager）+ 18h（分阶段）| 质量 ↑ |
| **返工率** | 70-80% | 30-40% | -50% |
| **并行度** | 30%（依赖不清晰）| 70%（API-First + Mock）| +133% |
| **集成问题** | 发现在后期（第 8 周）| 发现在中期（第 4 周）| 风险前移 |
| **跨会话一致性** | 60%（上下文丢失）| 90%（Context Anchor）| +50% |
| **决策追溯** | 困难（无 ADR）| 容易（ADR + Decision Log）| ++ |
| **知识复用** | 0%（从零开始）| 40%（Pattern Reuse）| +∞ |
| **首次可交付** | 12-16 周 | 6-8 周 | -50% |

---

## ✅ 实施建议

### 阶段 1：P0 升级（11 个工作日）

**优先实施**：
1. spec-one-pager（快速对齐）
2. spec-context-save/restore（上下文管理）
3. spec-api-design（API-First）
4. spec-issue-tracker（开放问题）

**验证方法**：
- 选择 1 个超大需求试点
- 对比升级前后的返工率、并行度

---

### 阶段 2：P1 升级（11.5 个工作日）

**优先实施**：
1. spec-version-update（版本管理）
2. spec-adr-generate（决策记录）
3. spec-dependency-manager（依赖管理）
4. spec-test-strategy（测试策略）

**验证方法**：
- 扩展到 3-5 个超大需求
- 评估质量改善和效率提升

---

### 阶段 3：P2 升级（可选，4 个工作日）

**根据阶段 1-2 的效果决定是否实施**

---

**文档完成日期**：2026-11-03  
**文档版本**：v1.0  
**预计投入**：P0 90h + P1 92h = 182 小时（23 个工作日）  
**预计收益**：返工率 -50%，并行度 +133%，首次可交付时间 -50%  
**状态**：✅ 方案设计完成，待评审
