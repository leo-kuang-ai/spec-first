# Quality Agents AI 研发质量平台架构设计稿

文档状态：Draft v1
文档日期：2026-03-22
上游文档：`quality-agents-ai-rd-quality-platform-prd.md`

## 1. 文档目标

本设计稿在 PRD 基础上进一步回答以下问题：

- 平台核心模块如何拆分
- 质量对象如何建模
- skill 如何组织输入输出协议
- 质量门禁如何落地
- 运行时如何复用 gstack 风格能力
- MVP 应该从哪里切入

本稿不讨论 UI，不讨论中心化 SaaS 后台，也不引入与 spec-first 的兼容设计。

## 2. 设计原则

### 2.1 质量优先

平台首先解决质量偏差，不追求覆盖全部研发流程。

### 2.2 最小对象集

对象数必须小而稳，保证长期可复用。

### 2.3 技能低耦合

skill 共享质量对象，不共享彼此私有 markdown 格式。

### 2.4 证据化判断

关键结论必须可追溯到 evidence。

### 2.5 本地优先

优先使用本地文件、CLI、skills、runtime，避免系统初期过重。

## 3. 总体架构

```text
User / Agent
   |
   v
Skill Layer
  - /clarify
  - /challenge
  - /scope-lock
  - /design-review
  - /review
  - /qa
  - /ship-check
   |
   v
Protocol Layer
  - preamble
  - question format
  - completion status
  - telemetry
  - contributor feedback
   |
   v
Quality Core
  - Quality Repository
  - Verdict Engine
  - Context Selector
   |
   v
Runtime Layer
  - browse daemon
  - git context
  - local file context
  - shell/test adapters
   |
   v
Validation Layer
  - template freshness
  - contract validation
  - skill e2e
  - quality evals
```

## 4. 核心分层设计

### 4.1 Skill Layer

职责：

- 向用户暴露质量能力入口
- 承载每个质量动作的具体方法论
- 读写统一质量对象

约束：

- 不直接依赖其他 skill 私有输出格式
- 不自行实现公共运行时能力
- 不直接承担跨阶段状态机逻辑

### 4.2 Protocol Layer

职责：

- 注入统一 preamble
- 提供统一提问结构
- 提供统一完成状态格式
- 注入 telemetry 和 contributor mode

设计目的：

- 减少 skill 间重复
- 让用户体验一致
- 让后续校验和 E2E 测试有稳定协议可测

### 4.3 Quality Core

这是平台真正的“内核层”。

包含三个关键模块：

- Quality Repository
- Verdict Engine
- Context Selector

### 4.4 Runtime Layer

职责：

- 提供浏览器、git、文件和 shell 上下文
- 提供真实执行和验证能力
- 为 QA、review 和 design-review 提供落地环境

设计上尽量参考 gstack：

- 浏览器守护进程常驻
- 统一命令入口
- 状态文件和日志本地化

### 4.5 Validation Layer

职责：

- 保证模板、协议、命令和 skill 行为一致
- 验证平台是否真的提升质量，而不只是“运行成功”

## 5. 质量对象模型

平台第一阶段只保留以下对象：

- Problem
- Scope
- Assumption
- Risk
- Decision
- Finding
- Evidence

### 5.1 Problem

含义：

- 真正要解决的问题，而不是表层需求描述

建议字段：

- `id`
- `title`
- `statement`
- `user_context`
- `success_criteria`
- `non_goals`
- `source`
- `created_at`
- `updated_at`

### 5.2 Scope

含义：

- 本次要做什么、不做什么

建议字段：

- `id`
- `problem_id`
- `in_scope`
- `out_of_scope`
- `acceptance_boundary`
- `deferred_items`
- `owner`

### 5.3 Assumption

含义：

- 当前决策依赖的前提

建议字段：

- `id`
- `problem_id`
- `statement`
- `confidence`
- `status`
- `evidence_refs`

### 5.4 Risk

含义：

- 潜在失败点或偏差点

建议字段：

- `id`
- `related_object`
- `description`
- `severity`
- `likelihood`
- `mitigation`
- `status`

### 5.5 Decision

含义：

- 已做出的关键取舍

建议字段：

- `id`
- `problem_id`
- `summary`
- `reasoning`
- `tradeoffs`
- `evidence_refs`
- `supersedes`

### 5.6 Finding

含义：

- skill 在 review/challenge/design-review/qa 中发现的问题

建议字段：

- `id`
- `category`
- `severity`
- `summary`
- `details`
- `related_object`
- `recommended_action`

### 5.7 Evidence

含义：

- 支撑 decision、finding 或 gate 的依据

建议字段：

- `id`
- `type`
- `source`
- `summary`
- `related_object`
- `confidence`
- `timestamp`

## 6. 对象关系设计

推荐关系如下：

```text
Problem
  ├── Scope
  ├── Assumption
  ├── Risk
  ├── Decision
  └── Finding

Finding
  └── Evidence

Decision
  └── Evidence

Risk
  └── Evidence
```

设计原则：

- 所有对象都能追溯回一个 Problem
- Decision、Finding、Risk 都可以挂 Evidence
- Scope 是后续 review 和 QA 最重要的约束边界

## 7. 信任与收敛机制

### 7.1 Skill Output Quality Check

每次 skill 输出进入 repository 前必须经过质量检查：

- `PASS`
- `WEAK`
- `FAIL`

规则：

- `PASS` 才可进入长期 memory 主视图
- `WEAK` 仅作为草稿或临时对象
- `FAIL` 不落库

### 7.2 对象冲突收敛

同一 Problem lineage 下引入：

- `ACTIVE`
- `SUPERSEDED`
- `CONFLICTING`

规则：

- 同一 lineage 只允许一个 `ACTIVE`
- `CONFLICTING` 对象不进入长期主视图

### 7.3 信任状态

对象必须具备 `trust_state`：

- `RAW`
- `INFERRED`
- `CONFIRMED`
- `STALE`

解释权属于 `Quality Repository / Verdict Engine`，不属于 skill 层。

## 8. Skill 协议设计

每个 skill 必须声明三个部分：

- 输入上下文
- 执行动作
- 输出对象

### 7.1 输入协议

skill 不要求固定文件名，而要求固定上下文能力：

- problem context
- scope context
- decision context
- risk context
- code/diff context
- browser/runtime context

由 Context Selector 负责从本地文件、git、memory 中选择这些上下文。

### 7.2 输出协议

skill 输出必须映射为统一对象：

- `/clarify` -> Problem
- `/challenge` -> Problem + Assumption + Risk + Finding
- `/scope-lock` -> Scope + Decision
- `/design-review` -> Finding + Risk + Decision
- `/review` -> Finding + Evidence
- `/qa` -> Finding + Evidence

### 7.3 完成状态协议

统一使用：

- `DONE`
- `DONE_WITH_CONCERNS`
- `BLOCKED`
- `NEEDS_CONTEXT`

## 9. 核心技能设计

### 8.1 `/clarify`

作用：

- 将模糊需求转换为结构化 Problem

输入：

- 用户需求描述
- 已有上下文文件

输出：

- Problem
- 初始 non-goals
- 初始 success criteria

失败条件：

- 用户目标不明确
- 缺少基本场景信息

### 8.2 `/challenge`

作用：

- 识别 framing 是否错误
- 挑战伪需求和表层需求

输入：

- Problem
- 历史质量记忆

输出：

- 修正后的 Problem
- Assumption
- Risk
- Finding

### 8.3 `/scope-lock`

作用：

- 锁定本次范围，避免 scope 漂移

输入：

- Problem
- 现有任务意图

输出：

- Scope
- Decision

### 8.4 `/design-review`

作用：

- 检查方案完整性

输入：

- Problem
- Scope
- 设计草案

输出：

- Finding
- Risk
- Decision
- 建议验证策略

## 10. Verdict / Gate 设计

### 10.1 Verdict Engine 职责

Verdict Engine 不做复杂编排，只回答：

- 当前是否可继续
- 存在哪些问题
- 问题属于哪一类

### 10.2 Gate 类型

#### Intent Gate

通过条件：

- Problem 存在
- success criteria 明确
- non-goals 明确

#### Scope Gate

通过条件：

- Scope 存在
- in-scope/out-of-scope 明确
- 未出现明显漂移

#### Design Gate

通过条件：

- 关键失败路径被识别
- 高严重性未决风险数量可接受

#### Evidence Gate

通过条件：

- 对关键结论存在 evidence 支撑

### 10.3 Gate 输出格式

```text
Gate: Scope Gate
Status: CLEAR_WITH_CONCERNS
Concerns:
- out-of-scope still ambiguous
- acceptance boundary missing rollback expectation
Recommendation:
- refine Scope before implementation
```

## 11. Quality Memory 设计

### 10.1 定位

Quality Memory 不是聊天记录仓库，而是高价值质量知识库。

### 10.2 存储内容

- 经过确认的问题定义
- 已锁定范围
- 关键设计决策
- 已知高风险区域
- 历史回归案例
- 常见误判模式

### 10.3 存储策略

- 只存摘要和结构化结论
- 不存全文对话
- 支持覆盖旧版本和 supersede 关系

## 12. Evidence 设计

### 11.1 Evidence 类型

- `text_evidence`
- `diff_evidence`
- `test_evidence`
- `browser_evidence`
- `decision_evidence`

### 11.2 来源

- 用户输入
- 本地文件
- git diff
- 测试输出
- 浏览器运行结果
- skill 推理摘要

### 11.3 设计目标

- 所有高价值判断可回溯
- 让 gate 结论有证据支撑
- 支持后续 review 和 QA 复用

## 13. Context Selector 设计

Context Selector 负责把散落上下文选择为 skill 可用候选输入。

来源包括：

- 项目本地文件
- memory 中的对象
- git diff / git status
- browse runtime
- 用户即时输入

Context Selector 的价值在于：

- skill 不再绑定固定文件路径
- skill 只声明需要哪类上下文
- 平台负责选择候选并暴露缺口

它不负责：

- 自动合并真相
- 自动默认继承
- 自动修正冲突
- 自动决定最终上下文

## 14. 运行时设计

### 13.1 浏览器运行时

浏览器能力建议直接借鉴 gstack：

- 常驻 daemon
- 本地 token 认证
- 状态文件
- 日志缓冲
- 健康检查

### 13.2 Git 运行时

能力包括：

- 当前分支识别
- diff 提取
- 目标分支识别
- 变更文件定位

### 13.3 文件运行时

能力包括：

- 本地对象文件读写
- memory 索引
- evidence 存取

## 15. 文档与文件组织建议

建议本地目录包含：

```text
quality-agents/
├── SKILL.md.tmpl
├── scripts/
├── runtime/
├── browse/
├── skills/
├── objects/
│   ├── problem/
│   ├── scope/
│   ├── decisions/
│   ├── risks/
│   └── evidence/
└── test/
```

其中：

- `skills/` 保存具体 skill 模板
- `objects/` 保存结构化质量对象
- `runtime/` 保存运行时状态和适配逻辑

## 16. MVP 实现顺序

### 15.1 第一批必须实现

- 对象模型最小实现
- Quality Repository 最小实现
- `/clarify`
- `/challenge`
- `/scope-lock`
- `/design-review`
- Verdict Engine 最小实现

### 15.2 暂缓实现

- `/review`
- `/qa`
- `/ship-check`
- 更复杂的 routing 和建议系统

## 17. 与多人协作上层系统的边界

本架构对应的是前置质量判断产品，不对应多人协作全链路交付控制系统。

多人协作、多端、多 owner、多 repo、协议、一致性、联调、变更重算、发布反馈，属于更高一层的协作控制问题域。

当前架构不直接覆盖这些能力，只保留未来被上层系统消费的可能性。

## 18. 验证设计

### 16.1 工程正确性验证

- skill 模板 freshness
- 协议注入一致性
- 命令合法性
- 运行时稳定性

### 16.2 平台有效性验证

重点验证：

- 是否更快澄清真实问题
- 是否更早识别 framing 偏差
- 是否更系统地暴露边界条件
- 是否减少后续返工

### 16.3 评估方法

- 静态校验
- E2E skill 测试
- LLM Judge
- 真实案例回放

## 19. 关键风险

### 17.1 系统过重

风险：

- 对象太多
- 流程太多
- 用户负担过大

应对：

- 固定第一阶段对象集
- 固定第一阶段 gate 数量
- 固定第一阶段 skill 数量

### 17.2 skill 输出不可复用

风险：

- 输出是自由文本，后续难利用

应对：

- 强制映射到统一对象模型

### 17.3 quality 提升不可证明

风险：

- 只能证明“skill 能跑”，不能证明“质量变好”

应对：

- 用真实案例构建前后对比评估

## 20. 结论

本架构的关键不是做一个更复杂的流程平台，而是做一个更小、更硬的质量平台。

它的本质是：

- 用 Quality Agents 提前发现偏差
- 用 Quality Gates 拦住明显跑偏
- 用 Quality Memory 沉淀高价值上下文
- 用 Evidence 支撑关键判断

这样平台既能保持 gstack 风格的可执行性，又不会因为追求完整流程而迅速过重。
