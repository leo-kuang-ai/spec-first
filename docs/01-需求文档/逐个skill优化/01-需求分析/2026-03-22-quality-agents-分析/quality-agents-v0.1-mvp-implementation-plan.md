# Quality Agents V0.1 MVP 实施计划

文档状态：Draft v1
文档日期：2026-03-22
上游文档：
- `quality-agents-ai-rd-quality-platform-prd.md`
- `quality-agents-ai-rd-quality-platform-architecture.md`

## 1. 文档目标

本计划聚焦 V0.1 MVP 的实现范围、模块拆分、交付顺序、验收标准与风险控制。

V0.1 的目标不是做成完整平台，而是验证一个核心命题：

通过少量高价值 Quality Agents，是否能显著降低“需求/方案跑偏”。

## 2. V0.1 范围定义

### 2.1 必须交付

- Quality Object 最小模型
- Quality Memory 最小实现
- Evidence Store 最小实现
- Gate Evaluator 最小实现
- `/clarify`
- `/challenge`
- `/scope-lock`
- `/design-review`
- 模板生成与协议注入
- 静态校验与最小 E2E 验证

### 2.2 明确不做

- `/review`
- `/qa`
- `/ship-check`
- 复杂权限模型
- Web 控制台
- 多项目集中视图
- 团队级治理后台
- 与第三方项目管理工具深度集成

## 3. MVP 成功标准

### 3.1 产品成功标准

- 用户能在编码前形成清晰 Problem 和 Scope。
- skill 能暴露出比用户原始描述更深一层的问题定义。
- 设计评审能稳定输出边界条件和失败路径。
- 输出对象可被后续 skill 或人工继续消费。

### 3.2 工程成功标准

- 4 个核心 skills 可稳定安装、加载、执行。
- 公共 preamble、telemetry、completion protocol 可自动注入。
- 结构化对象可本地读写。
- 至少有一套真实案例回放验证质量提升。

## 4. MVP 核心假设

V0.1 要验证以下假设：

1. 用户最需要的不是完整流程，而是高质量前置判断。
2. `/clarify + /challenge + /scope-lock + /design-review` 已经足以覆盖最主要的前期偏差。
3. 少量统一质量对象足以承载后续复用。
4. skill 采用 gstack 风格交付形态，能在不做 Web 平台的前提下快速落地。

## 5. 实施分阶段

## Phase 1：基础骨架

目标：

- 把平台最小骨架立起来

交付：

- 仓库初始结构
- skill 模板目录
- 公共协议注入器
- 对象目录结构
- memory/evidence 基础读写工具

验收标准：

- 可以生成至少一个最小 skill
- 可以读写 Problem 与 Evidence 样例对象

## Phase 2：前置质量技能

目标：

- 完成前 3 个核心 skills

交付：

- `/clarify`
- `/challenge`
- `/scope-lock`

验收标准：

- 3 个 skill 都能产出结构化对象
- 输出格式稳定
- skill 之间可以通过统一对象衔接，但不强依赖彼此执行顺序

## Phase 3：方案评审能力

目标：

- 补齐设计质量控制

交付：

- `/design-review`
- Design Gate 最小实现
- 风险与发现对象支持

验收标准：

- 能对至少 3 类真实设计输入给出结构化 findings 和 risks
- 能输出明确 gate 结论

## Phase 4：验证与收口

目标：

- 证明平台不只是“能跑”，而是“有效”

交付：

- 静态校验
- 最小 E2E
- 一组真实案例回放
- 一份 MVP 评估报告

验收标准：

- 至少完成 1 组前后对比案例
- 能说明质量提升体现在哪些维度

## 6. 模块拆分

### 6.1 Object Store

职责：

- 定义与存储核心质量对象

V0.1 对象：

- Problem
- Scope
- Assumption
- Risk
- Decision
- Finding
- Evidence

V0.1 要求：

- 文件化存储即可
- 支持唯一 id
- 支持对象间引用

### 6.2 Memory Manager

职责：

- 存取高价值质量上下文

V0.1 要求：

- 支持按类型读写对象
- 支持按 problem 聚合上下文
- 支持 supersede 简单关系

### 6.3 Evidence Manager

职责：

- 收敛支撑判断的证据

V0.1 要求：

- 支持 text evidence
- 支持 local file evidence
- 支持 decision/finding 关联

### 6.4 Gate Evaluator

职责：

- 输出 gate 是否通过

V0.1 gate：

- Intent Gate
- Scope Gate
- Design Gate

V0.1 要求：

- 可基于对象判断 CLEAR / CLEAR_WITH_CONCERNS / BLOCKED
- 输出标准化结果

### 6.5 Protocol Generator

职责：

- 自动注入公共协议

V0.1 注入内容：

- preamble
- question format
- completion status protocol
- telemetry footer

### 6.6 Skill Validator

职责：

- 保证 skill 文档内容正确

V0.1 要求：

- 检查模板 freshness
- 检查关键协议块是否存在
- 检查对象输出段结构是否存在

## 7. 技术方案建议

### 7.1 存储方式

V0.1 使用本地文件存储。

推荐结构：

```text
objects/
├── problem/
├── scope/
├── assumptions/
├── risks/
├── decisions/
├── findings/
└── evidence/
```

格式可采用 Markdown + YAML frontmatter，或 JSON + Markdown 摘要。

建议：

- 结构化字段使用 YAML/JSON
- 分析内容使用 Markdown 正文

### 7.2 Skill 组织方式

推荐结构：

```text
skills/
├── clarify/
├── challenge/
├── scope-lock/
└── design-review/
```

每个 skill 包含：

- `SKILL.md.tmpl`
- 引用说明
- 如有必要的 checklist

### 7.3 Runtime 组织方式

V0.1 不强依赖 browse，但接口预留 browse 接入位。

运行时优先支持：

- local files
- git context
- shell context

## 8. 四个核心 skills 的实施优先级

### 8.1 `/clarify`

优先级：P0

原因：

- 它是所有后续质量判断的基础输入

### 8.2 `/challenge`

优先级：P0

原因：

- 它负责把用户表层需求压缩成真正问题

### 8.3 `/scope-lock`

优先级：P1

原因：

- 没有 scope，后续实现和评审无法稳定对齐边界

### 8.4 `/design-review`

优先级：P1

原因：

- 它是从需求质量跨到方案质量的关键节点

## 9. 验证计划

### 9.1 静态验证

检查内容：

- 所有生成 skill 是否无未替换 placeholder
- 所有 required protocol blocks 是否存在
- 对象示例是否符合 schema

### 9.2 Skill E2E

检查内容：

- skill 在真实会话下能输出结构化结果
- 输出能被 Memory Manager 接收

### 9.3 真实案例回放

建议准备至少 3 类案例：

- 用户给出表层需求，但真实问题更深
- 范围模糊，容易越做越大
- 方案主路径合理，但边界条件缺失

目标：

- 对比使用 skill 前后的问题定义与设计质量

## 10. 主要风险

### 10.1 范围膨胀

风险：

- 很容易自然扩展到 review、qa、ship 全链路

应对：

- 明确锁死 V0.1 只做前置质量控制

### 10.2 输出不可结构化

风险：

- skill 输出太散，难以复用

应对：

- 每个 skill 必须映射到统一对象

### 10.3 用户觉得负担过重

风险：

- 连续运行多个 skill 被认为“流程太长”

应对：

- 默认按需触发
- 单个 skill 也必须独立有价值

## 11. 交付清单

V0.1 应至少交付：

- 1 份 PRD
- 1 份架构设计稿
- 1 份 MVP 实施计划
- 1 份技能详细定义稿
- 4 个核心 skills 模板
- 最小对象存储方案
- 最小 memory/evidence 管理工具
- 最小校验工具
- 1 份案例评估报告

## 12. 里程碑建议

### Milestone A：骨架完成

- 目录结构建立
- 对象模型可落地
- 最小模板生成通路跑通

### Milestone B：三前置技能完成

- `/clarify`
- `/challenge`
- `/scope-lock`

### Milestone C：设计评审闭环完成

- `/design-review`
- Design Gate
- 风险和 finding 对象可用

### Milestone D：效果证明完成

- 静态验证
- E2E
- 真实案例回放

## 13. 结论

V0.1 的关键不是做“大”，而是做“准”。

只要平台能稳定完成这三件事，就已经证明方向成立：

- 更早识别真实问题
- 更早锁定范围边界
- 更早暴露设计缺口

只要这三件事有效，后续再扩展到 review、qa、ship 才有意义。
