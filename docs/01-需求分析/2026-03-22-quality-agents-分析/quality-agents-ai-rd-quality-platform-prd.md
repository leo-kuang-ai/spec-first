# Quality Agents AI 研发质量平台 PRD

文档状态：Draft v1
文档日期：2026-03-22
产品定位：独立于 spec-first 的 AI 研发质量平台
交付形态：参考 gstack 的本地 skills + runtime + CLI 体系

## 1. 项目一句话定义

Quality Agents 是一个以质量代理、质量记忆、证据机制和轻量质量裁决为核心的 AI 研发质量平台，优先解决研发过程中最昂贵的一类问题：

需求/方案跑偏。

它不是项目管理系统，不是通用工作流编排器，也不是另一个 spec-first 变体。它也不是面向多人协作全链路交付控制的上层系统。它的目标很明确：在编码前和编码初期，尽早识别并压低需求偏差和方案偏差，让后续实现、评审、测试和发布建立在更稳的质量上下文之上。

## 2. 背景与问题

当前 AI 辅助研发的主要问题，已经不是“不会写代码”，而是“很容易把错的东西写得很快”。

常见表现包括：

- 用户给出的是表层需求，AI 直接按表层需求展开。
- 方案只覆盖 happy path，没有暴露关键边界、失败路径和关键假设。
- 实现阶段逐渐偏离原始目标，但 diff 看起来仍然合理。
- review 和 QA 聚焦代码与页面细节，无法回到“是不是做对了”的根问题。
- 项目长期没有积累高价值质量记忆，每次新需求都重新澄清。

gstack 已经证明了一件事：AI 的研发行为可以被结构化、角色化、工程化。但本项目不是复制一个完整流程系统，而是抽取其中最有价值的部分，做成一个更聚焦的质量平台。

## 3. 目标

### 3.1 核心目标

在编码前和编码初期，尽早识别并压低需求偏差和方案偏差。

### 3.2 阶段目标

1. 帮助用户把模糊需求压缩为清晰的问题定义。
2. 帮助用户识别错误 framing、伪需求和 scope 漂移。
3. 帮助用户在设计阶段暴露边界条件、失败路径和关键假设。
4. 让后续 review 和 QA 能引用前置质量上下文，而不是脱离目标独立运行。
5. 持续积累项目级质量记忆，避免团队重复犯同类错误。

### 3.3 成功标准

- 编码前能形成清晰的 Problem、Scope 和 Risks。
- 方案评审中出现更多边界条件和失败路径，而不只是主路径讨论。
- 实现返工率下降，尤其是由需求误解和设计缺口导致的返工。
- review 和 QA 能明确引用前置质量对象，而不是只围绕 diff 和页面现状判断。
- 团队逐步积累可复用的高价值质量记忆。

## 4. 非目标

本项目第一阶段不做以下事情：

- 项目管理平台
- 排期、资源、燃尽图
- 通用工作流编排引擎
- 多角色审批后台
- 大而全的 Web 管理控制台
- 与 spec-first 的兼容、迁移或集成
- 一次性覆盖从需求到发布的所有研发流程

## 5. 目标用户

### 5.1 主要用户

- 个人开发者
- 小中型研发团队
- 技术负责人
- 使用 AI 辅助产品与研发协作的团队

### 5.2 典型用户画像

- 有明确要做的事，但需求边界经常说不清。
- 使用 agent 写代码，但担心“越写越偏”。
- 不需要复杂项目系统，只需要更高质量的研发判断。
- 能接受类似 gstack 的 skill/CLI 工作方式。

## 6. 产品原则

### 6.1 质量优先于流程完整

本项目的目标不是把所有研发动作流程化，而是只控制最关键的质量失真。

### 6.2 证据优先于话术

每个关键结论都应有清晰依据，不接受纯粹“agent 觉得如此”的判断。

### 6.3 最小对象集

只引入少数稳定的质量对象，避免平台本身变成复杂系统。

### 6.4 按需触发，不强制全链路

用户不必每次都走完整链路。系统应允许局部启用质量能力。

### 6.5 本地优先

交付形态参考 gstack，优先本地 CLI、skills、runtime 和文档生成管线。

### 6.6 可验证

不仅验证代码，还要验证 skill 是否真的提升了项目质量。

## 7. 核心设计思路

本平台的中心不是流程，而是质量。

推荐采用如下核心模型：

```text
Quality Agents
    +
Quality Memory
    +
Evidence Store
    +
Quality Verdict
```

其中：

- Quality Agents 负责发现偏差。
- Quality Memory 负责沉淀高价值上下文，是平台的长期核心资产。
- Evidence Store 负责支撑关键判断。
- Quality Verdict 负责输出轻量裁决结果，V0.1 以 advisory 为主、blocking 为辅。

它们共同组成一个质量控制系统，而不是一个完整流程操作系统。

## 8. 质量失真模型

项目质量差，通常不是因为流程少，而是因为以下几类失真没有被压住：

- Problem Drift：解决错问题。
- Scope Drift：范围失控或边界模糊。
- Design Drift：方案只覆盖 happy path。
- Implementation Drift：代码偏离原始目标。
- Verification Drift：验证不能证明真实可用。

第一阶段只重点打前两项，第二阶段延展到后两项，最终再覆盖发布与验证闭环。

## 9. 总体架构

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
Quality Core
  - Quality Memory
  - Evidence Store
  - Quality Repository
  - Quality Verdict
  - Context Selector
  - Protocol Generator
   |
   v
Runtime Layer
  - browse daemon
  - git context
  - local file context
  - optional shell / tests
   |
   v
Validation Layer
  - template freshness
  - command validation
  - skill contract checks
  - e2e evals
```

## 10. 核心模块

### 10.1 Quality Agents

Quality Agents 不是流程节点，而是围绕质量风险设计的专职代理角色。

首批建议包含：

- Product Challenger
- Scope Clarifier
- Design Reviewer
- Code Reviewer
- QA Verifier

第一阶段真正核心的是前三个。

### 10.2 Quality Verdict

平台只保留少量高价值裁决，不构建复杂状态机。

建议首批 verdict/gate：

- Intent Gate
- Scope Gate
- Design Gate

### 10.3 Quality Memory

Quality Memory 是平台最重要的长期资产之一，沉淀项目中真正高价值的质量上下文：

- 问题定义
- 非目标
- 假设
- 关键决策
- 风险
- 回归教训

### 10.4 Evidence Store

统一收敛支撑判断的证据：

- 决策证据
- 发现证据
- 测试证据
- 浏览器证据
- 发布证据

### 10.5 轻量裁决原则

V0.1 中，裁决层的目标不是成为重型 gatekeeper，而是更早暴露明显跑偏。

规则：

- 默认以 advisory 为主
- 只有少数明显失焦情况才进入 blocking
- 产品第一印象应是“判断更准”，而不是“规则更严”

## 11. 核心对象模型

第一阶段只引入 7 个稳定对象：

- Problem
- Scope
- Decision
- Assumption
- Risk
- Finding
- Evidence

### 11.1 对象关系

- Problem 定义真正要解决的问题。
- Scope 界定本次改动边界。
- Assumption 记录当前依赖的前提。
- Risk 记录可能出错的地方。
- Decision 记录关键取舍。
- Finding 记录 agent 发现的问题。
- Evidence 支撑 decision 和 finding 的成立。

### 11.2 设计原则

- 对象要少而稳定。
- 对象要能被多个 skill 复用。
- skill 之间共享对象，不共享彼此的私有格式。

## 12. 技能体系

参考 gstack 的交付方式，但技能语义从“流程阶段”切换为“质量动作”。

### 12.1 `/clarify`

目标：把模糊需求变成清晰问题定义。

输出：

- 问题定义
- 成功标准
- 用户对象
- 约束
- 非目标

### 12.2 `/challenge`

目标：挑战当前 framing，识别是否做偏。

输出：

- 当前 framing
- 更深层问题
- 关键假设
- 错误方向警告
- 建议重新定义的边界

### 12.3 `/scope-lock`

目标：明确本次做什么、不做什么。

输出：

- in-scope
- out-of-scope
- acceptance boundary
- deferred items

### 12.4 `/design-review`

目标：检查方案是否完整、稳健、边界充分。

输出：

- 关键设计发现
- 边界条件
- 失败路径
- 风险等级
- 建议验证策略

### 12.5 第二阶段技能

- `/review`
- `/qa`
- `/ship-check`

## 13. 用户关键流程

### 13.1 场景 A：新需求进入

1. 用户描述需求。
2. 运行 `/clarify`。
3. 运行 `/challenge`。
4. 运行 `/scope-lock`。
5. 若需求复杂，再运行 `/design-review`。

结果：

- 形成可执行的问题与边界定义。
- 识别需求跑偏风险。
- 生成后续实现可复用的质量上下文。

### 13.2 场景 B：方案准备实现

1. 用户已有设计草案。
2. 运行 `/design-review`。
3. 系统输出关键风险与失败路径。
4. 必要时回写到 Quality Memory。

### 13.3 场景 C：准备实现/评审

后续 `/review` 引用已有 Problem、Scope 和 Decision，检查实现是否偏离原始目标。

## 14. 交付形态

交付方式完全参考 gstack 的工程组织形式：

- 本地仓库
- `SKILL.md` 与 `SKILL.md.tmpl`
- `setup` 安装到 agent skill 目录
- 本地 CLI 和 scripts
- 持久运行时支持 browse 等能力
- 生成器负责注入公共协议
- 测试负责验证 skill 内容和行为

本项目不做第一阶段必须依赖的 SaaS 后台，不做账号体系，也不要求中心化数据库。

## 15. 低耦合设计

平台必须避免技能链条写死。

设计原则如下：

- skill 不直接依赖其他 skill 的内部格式。
- skill 只依赖稳定质量对象。
- 浏览器、git、日志、模板生成器全部下沉为平台能力。
- 共享的是 Problem、Scope、Risk、Decision、Evidence。
- 不共享某个特定 markdown 文件结构。
- `trust_state` 只由核心层解释，不由 skill 层解释。
- `Context Resolver` 在 V0.1 收缩为 `Context Selector`，只负责选择候选上下文、暴露缺口和冲突。

这种设计下：

- `/design-review` 可以单独运行。
- `/review` 不强制依赖 `/clarify`。
- `/qa` 可以在没有完整前链路时运行，但如果已有质量上下文则优先引用。

## 16. 质量门禁

第一阶段采用轻门禁，不做重状态机。

### 16.1 Intent Gate

检查：

- 目标是否清晰
- 用户/场景/成功标准是否明确

### 16.2 Scope Gate

检查：

- 边界是否明确
- 是否存在明显 scope 漂移

### 16.3 Design Gate

检查：

- 是否存在重大未解决设计风险
- 是否明确关键失败路径

### 16.4 Evidence Gate

检查：

- 是否有足够证据支撑“完成”结论

### 16.5 门禁结果

- CLEAR
- CLEAR_WITH_CONCERNS
- BLOCKED

## 17. Quality Memory 设计

Quality Memory 是平台最重要的长期资产之一。

### 17.1 存储原则

- 只存高价值内容
- 不存冗长对话全文
- 不存所有中间步骤

### 17.2 Memory 分类

- `problem/`
- `scope/`
- `decisions/`
- `risks/`
- `lessons/`
- `regressions/`

### 17.3 典型内容

- 为什么这次需求不是表面看起来那样
- 本次明确不做哪些内容
- 曾经踩过哪些设计坑
- 某类功能一改就容易回归什么

## 18. Evidence 设计

Evidence 是让质量结论可回溯的基础。

### 18.1 Evidence 类型

- `text_evidence`
- `diff_evidence`
- `test_evidence`
- `browser_evidence`
- `decision_evidence`

### 18.2 最小字段

- type
- source
- summary
- timestamp
- related_object
- confidence

### 18.3 目标

- 让质量判断可回溯
- 让 review、QA 和 ship 不只是口头通过

## 19. 质量保护机制

### 19.1 Skill Output Quality Check

每个核心 skill 输出都必须经过质量检查：

- `PASS`
- `WEAK`
- `FAIL`

规则：

- `PASS` 才可进入长期 memory 主视图
- `WEAK` 仅作为草稿或临时对象保留
- `FAIL` 不落库，要求补充上下文或重跑

### 19.2 对象冲突收敛

同一 Problem lineage 下引入：

- `ACTIVE`
- `SUPERSEDED`
- `CONFLICTING`

规则：

- 同一 lineage 只允许一个 `ACTIVE`
- 新结论替代旧结论时必须显式 `supersedes`
- `CONFLICTING` 对象不得进入长期 memory 主视图

### 19.3 信任状态

对象需具备 `trust_state`：

- `RAW`
- `INFERRED`
- `CONFIRMED`
- `STALE`

规则：

- 只有 `CONFIRMED` 才能成为长期主视图核心对象
- `INFERRED` 可以参与分析，但不是最终真相
- `STALE` 默认只作为参考

## 20. 测试与验证策略

平台质量需要验证两层：

### 19.1 平台正确性

- skill 生成是否正确
- 命令是否合法
- 协议注入是否完整
- runtime 是否稳定

### 19.2 平台有效性

- `/clarify` 是否提升问题定义清晰度
- `/challenge` 是否能识别跑偏 framing
- `/design-review` 是否显著提升方案完整性

### 19.3 测试分层

- Tier 1：静态校验
- Tier 2：skill E2E
- Tier 3：LLM Judge 评估
- Tier 4：真实案例回放评估

## 21. MVP 范围

### 20.1 必须做

- `/clarify`
- `/challenge`
- `/scope-lock`
- `/design-review`
- Quality Memory 最小实现
- Evidence Store 最小实现
- skill 模板生成
- skill 校验
- 基础 telemetry

### 20.2 明确不做

- 团队权限系统
- 多人协作控制台
- 完整 release governance
- 大规模 review routing
- 多项目集中管理

## 22. MVP 成功标准

MVP 成功后，一个个人开发者或小团队应能明显感受到：

- 需求更快被说清楚。
- 更早发现“其实不是这个问题”。
- 设计讨论更少停留在主路径。
- 技术实现前就暴露更多隐藏假设。
- 后续 review 和 QA 更容易对照原始目标。
- 质量上下文可以被复用，而不是每次从零开始。

## 23. 风险与约束

### 22.1 风险一：平台变成又一个流程工具

应对：

- 限制对象集
- 限制 gate 数量
- 限制第一阶段 skill 数量

### 22.2 风险二：agent 输出很多，但结论不硬

应对：

- 强制结构化输出
- 强制 evidence 支撑

### 22.3 风险三：技能之间逐步强耦合

应对：

- skill 只读写稳定质量对象
- 不读写彼此私有格式

### 22.4 风险四：用户觉得太重

应对：

- 允许按需触发
- 不要求完整链路

### 22.5 风险五：质量提升无法证明

应对：

- 建立真实案例评估集
- 对比使用前后结果

## 24. 路线图

### 23.1 V0.1

- `/clarify`
- `/challenge`
- 最小 memory
- 最小 evidence
- 模板生成与校验

### 23.2 V0.2

- `/scope-lock`
- `/design-review`
- gate evaluator
- 真实案例 E2E

### 23.3 V0.3

- `/review`
- `/qa`
- 质量上下文贯穿实现阶段

### 23.4 V0.4

- `/ship-check`
- 更完整的 evidence 和 quality reports

## 25. 与多人协作上层系统的边界

本产品明确不等于“多人协作 AI 研发控制系统”。

多人协作、多端、多 owner、多 repo、协议一致性、联调、变更重算、发布反馈，属于更高一层的团队协作与交付控制问题域。

对当前产品的定义是：

- Quality Agents 解决前置质量判断问题
- 它未来可以服务于更大的多人协作系统
- 但当前不把上层系统需求并入本产品边界

这样做的目的是防止产品在价值被证明前再次长成重型控制平面。

## 26. 最终定义

Quality Agents 不是一个完整研发流程系统。

它是一个聚焦“需求/方案跑偏”的 AI 研发质量平台，通过：

- Quality Agents 发现偏差
- Quality Memory 沉淀上下文
- Evidence 支撑判断
- Quality Verdict 提供轻量裁决

来提高项目质量，而不是通过更复杂的流程把团队绑住。
