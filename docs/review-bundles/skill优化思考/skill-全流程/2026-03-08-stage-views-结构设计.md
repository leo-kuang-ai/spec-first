# 2026-03-08 stage-views 结构设计

## 1. 设计目标

本设计解决的不是“让后续节点多读一份背景文档”，而是：

> **为 `spec-first` 全流程建立统一、可降级、可治理、可长期维护的背景输入机制。**

目标包括：

1. 让 `00-first` 的项目认知稳定服务后续阶段
2. 让不同阶段读取不同粒度的背景输入，而不是直读整份 `first`
3. 让产品、测试、研发、架构等不同角色都能落地使用
4. 让“背景输入是否完整”进入流程治理，而不是变成隐藏前提
5. 让背景底座支持增量维护，而不是每次全量重生成

---

## 2. 当前仓库范围

本设计只覆盖当前仓库真实存在的节点。

### 2.1 producer

- `skills/spec-first/00-first/SKILL.md`

### 2.2 入口 / 编排节点

- `skills/spec-first/00-onboarding/SKILL.md`
- `skills/spec-first/01-init/SKILL.md`
- `skills/spec-first/13-orchestrate/SKILL.md`

### 2.3 主链阶段节点

- `skills/spec-first/03-spec/SKILL.md`
- `skills/spec-first/04-design/SKILL.md`
- `skills/spec-first/07-code/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`

### 2.4 治理节点

- `skills/spec-first/14-status/SKILL.md`
- `skills/spec-first/15-doctor/SKILL.md`
- `skills/spec-first/21-analyze/SKILL.md`

说明：

- 当前没有独立的 `skills/spec-first/09-test/SKILL.md`
- 因此测试 / 验证背景统一收口到 `12-verify`

---

## 3. 总体模型

### 3.1 runtime 真源层

统一真源维护在：

- `.spec-first/runtime/first/index.json`
- `.spec-first/runtime/first/summary.json` 或 `summary/`
- `.spec-first/runtime/first/role-views.json` 或 `role-views/`
- `.spec-first/runtime/first/stage-views.json` 或 `stage-views/`

职责：

- 表达项目当前真实结构
- 作为主链流程的机器真源
- 支持局部刷新与增量维护

### 3.2 阶段主输入层

阶段主输入统一来自 `stage-views`：

- `spec-view`
- `design-view`
- `code-view`
- `verify-view`

职责：

- 为每个阶段提供“刚好够用”的背景输入
- 避免整份 summary 直接透传

### 3.3 角色辅助输入层

角色辅助输入统一来自 `role-views`。

职责：

- 服务 `00-onboarding`
- 服务非研发角色的背景裁剪
- 不替代 stage views

### 3.4 docs 投影视图层

- `docs/first/*.md`

职责：

- 作为长期维护的人类可读投影
- 供沟通、审阅、沉淀使用
- 不再作为主链机器真源

---

## 4. 各阶段应该读什么

### 4.1 `03-spec` 读 `spec-view`

关注：

- 业务能力边界
- 已有能力
- 核心实体
- 上下游关系
- 需求切入点

### 4.2 `04-design` 读 `design-view`

关注：

- 模块边界
- 集成模式
- API 与数据模型
- 技术约束
- 设计风险

### 4.3 `07-code` 读 `code-view`

关注：

- 入口模块
- 可能改动区域
- 调用路径提示
- 耦合点
- 风险点
- 验证钩子

### 4.4 `12-verify` 读 `verify-view`

关注：

- 高风险区域
- 关键链路
- 验证关注点
- 建议检查项
- 风险摘要

---

## 5. 角色降级设计

这是全方案的关键。

### 5.1 背景状态

建议所有节点都统一感知以下状态之一：

- `full`：存在并成功读取匹配的 stage view
- `degraded`：没有匹配 stage view，但有其他可用背景材料
- `blind`：缺少足够背景输入

### 5.2 产品角色

- 优先读 `spec-view`
- 无 `first` 时允许降级到业务材料、现有 spec、人工补充背景
- 通常不需要直接读 `code-view`

### 5.3 测试角色

- 优先读 `verify-view`
- 无 `first` 时允许降级到 `spec/design/change diff`
- 高风险验证或上线前验证不应长期停留在 `blind`

### 5.4 研发角色

- `04-design` 和 `07-code` 默认应强依赖 stage view
- 无 `first` 时可临时推进，但必须显式风险
- 正式设计、复杂实现、高风险改动可升为更强门槛

### 5.5 架构 / TL

- `design-view` 价值最高
- 设计评审前应尽量达到 `full`
- 没有 `first` 时可做早期讨论，但不宜直接进入正式设计裁决

---

## 6. 依赖强度模型

统一使用三档：

- `L1`：推荐
- `L2`：强烈推荐
- `L3`：事实门槛

建议口径：

- `03-spec`：`L1` 起步，复杂需求升到 `L2`
- `04-design`：默认 `L2`，正式设计评审可到 `L3`
- `07-code`：默认 `L2`，高风险改动可到 `L3`
- `12-verify`：默认 `L2`，上线前 / 高风险验证可到 `L3`

---

## 7. 各流程节点的职责

### 7.1 `00-onboarding`

- 优先读取 `role-views`
- 没有 role view 时退化为场景导向入口建议
- 不生成背景真源

### 7.2 `01-init`

- 检测 runtime `first` 资产是否存在
- 记录当前 feature 的背景输入状态
- 为后续阶段提供“这次 feature 从什么背景起步”的上下文

### 7.3 `13-orchestrate`

- 根据阶段、角色、背景状态推荐执行路径
- 统一处理依赖强度与降级策略
- 不直接重新拼装背景

### 7.4 `14-status`

- 展示当前 feature / 当前阶段的背景输入状态
- 展示是否存在匹配的 stage view

### 7.5 `15-doctor`

- 诊断 `.spec-first/runtime/first/summary` 与 `stage-views`
- 诊断 docs 投影视图是否与 runtime 失同步
- 识别 `blind` 状态和缺失资产

### 7.6 `21-analyze`

- 在一致性分析中纳入背景输入质量
- 识别“背景不足导致设计 / 实现 / 验证偏差”的问题

---

## 8. 长期维护机制

### 8.1 默认不是全量重生成

`00-first` 默认应采用：

1. 读取 runtime 索引
2. 做变更检测
3. 只更新受影响的 summary / role-views / stage-views
4. 按需刷新 `docs/first/*.md`
5. 更新索引与健康状态

### 8.2 推荐刷新模式

建议长期支持：

- `refresh-runtime-only`
- `refresh-docs-from-runtime`
- `refresh-all`

### 8.3 为什么这很重要

如果没有这一层：

- 用户会回避运行 `first`
- 文档会不断被全量覆盖
- runtime 真源也很难稳定演进

有了这层：

- 真源维护成本更低
- docs 可长期保留
- 下游也更容易长期依赖 stage views

---

## 9. 为什么这个方案能提升流程质量

因为它把过去隐含、分散、重复的背景理解过程，收敛成了统一机制：

1. `first` 一次生产背景真源
2. 各阶段读取同一套派生视图，减少解释漂移
3. 不同角色可降级，但降级状态显式可见
4. 治理节点可以诊断背景质量，而不是只诊断结果产物
5. docs 继续存在，但不再污染机器真源

因此它带来的提升不是局部优化，而是：

- 需求质量更稳定
- 设计约束更真实
- 开发切入点更清晰
- 验证聚焦度更高
- 流程治理更可操作

---

## 10. 与 `first-skill` 的边界

- `first-skill` 负责生产 runtime 真源与 docs 投影视图
- `skill-全流程` 负责定义谁读、何时读、缺失时怎么降级、何时升为门槛

这是两套文档长期不漂移的前提。
