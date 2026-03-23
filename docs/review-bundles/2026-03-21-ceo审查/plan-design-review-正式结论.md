# Plan Design Review 正式结论

> Skill: `/plan-design-review`
> 审查日期: 2026-03-21
> 当前分支: `leo-2026-03-19`
> 基线分支: `master`
> 当前提交: `bcf0114`

## 1. System Audit

### 1.1 审查对象

本次用户请求是“思考项目目标，深度审查当前项目”，不是审查某一个明确的 UI 计划文件。结合仓库结构、`README.md`、`CLAUDE.md`、`docs/first/*` 和当前分支 diff，可以确认:

- 项目主体是规范驱动研发 CLI 与流程引擎。
- 主体变更集中在 `src/cli/`、`src/core/`、`skills/`、`.spec-first/` 与文档。
- 仓库没有独立的 `DESIGN.md`。
- 仓库没有稳定的 `TODOS.md`。
- 仓库存在 `website/`，但目前仍是 Astro starter 占位，不构成当前主线设计评审对象。

### 1.2 UI Scope 判定

严格按 `/plan-design-review` 的定义，这次审查对象 **没有清晰的前端页面/组件级 UI 计划范围**。因此它不适合做标准的“屏幕层设计评审”，也不适合强行进入 7 个 UI 维度打分循环。

可以被审查的“设计范围”只有两类:

1. CLI 与 Skill 的交互设计。
2. 用户面对流程阻断、引导、恢复上下文时的体验设计。

结论:

**这不是一个典型 UI 设计审查对象，但它是一个非常典型的交互设计审查对象。**

## 2. Step 0 结论

### 2.1 初始设计完整度评分

**4/10**

原因不是项目没有设计，而是“设计没有被明确写成用户体验层规范”。

具体表现:

- 描述了很多系统做什么，但较少定义用户看到什么。
- 定义了很多规则，但没有把“下一步动作”统一成体验规范。
- 对外暴露的术语、文件角色和门禁概念过多。
- 没有独立设计系统或交互语言规范来约束一致性。

### 2.2 一个 10/10 会是什么样

如果这个项目在“设计完整度”上做到 10/10，应该具备:

- 新用户只需要理解极少数外部概念。
- 每个常用命令都清楚表达“什么时候用、失败后怎么办、下一步是什么”。
- 所有阻断提示都统一成行动导向格式。
- 所有只读类、诊断类、推进类能力都有稳定分层。
- 文档和命令输出的语气、层级、字段一致。

### 2.3 DESIGN.md 状态

仓库内未发现 `DESIGN.md`。

正式判断:

**No design system found.**

但这里缺的不是视觉 token 文档，而是:

- 交互语言规范
- 阻断提示规范
- 引导顺序规范
- 术语收敛规范

## 3. What Already Exists

虽然没有独立设计系统，但仓库里已经存在一批应该继续复用的“设计资产”:

- [README.md](/Users/kuang/xiaobu/spec-first/README.md)
  已经定义了产品问题、核心价值和主流程。
- [CLAUDE.md](/Users/kuang/xiaobu/spec-first/CLAUDE.md)
  已经定义了工程边界、禁止操作和核心规则。
- [docs/first/README.md](/Users/kuang/xiaobu/spec-first/docs/first/README.md)
  已经形成了面向人的项目概览。
- [docs/first/entry-guide.md](/Users/kuang/xiaobu/spec-first/docs/first/entry-guide.md)
  已经具备“入口引导”的雏形。
- [docs/review-bundles/2026-03-19-spec-first-product-review.md](/Users/kuang/xiaobu/spec-first/docs/review-bundles/2026-03-19-spec-first-product-review.md)
  已经明确指出“入口摩擦高、认知负担重、门禁语义过多”。

这些内容说明项目已经有了产品判断，只是还没有被压缩成稳定的一套交互规范。

## 4. 设计问题定位

### Pass 1: Information Architecture

**4/10**

项目的信息架构问题不在代码组织，而在用户看到的概念层级。

当前用户面前的世界过于拥挤:

- Stage
- Skill
- Gate
- Traceability
- Runtime
- Docs
- Findings
- Matrix
- Various state files

用户并不需要理解这么多层才能开始。

**修正方向**

- 对外只保留少数一层概念，比如“当前状态 / 下一步 / 风险 / 证据”。
- 隐藏内部实现层的文件角色差异。
- 让入口从“能力目录”变成“行动路径”。

### Pass 2: Interaction State Coverage

**3/10**

系统对“正常流程”描述很多，但对以下交互状态的设计不够统一:

- 首次进入，不知道从哪里开始。
- 被 Gate 拦住，不知道先补什么。
- 中断恢复，不知道信哪份上下文。
- 文档或技能漂移，不知道哪份是真源。

这些都属于真实用户状态，但目前主要通过规则和文档分散表达，没有统一的体验模板。

**修正方向**

- 为阻断、恢复、空状态建立固定输出结构。
- 每种状态都明确用户看到的字段，而不是只定义内部条件。

### Pass 3: User Journey & Emotional Arc

**4/10**

这个项目的情绪曲线很明显:

- 第一次接触时容易觉得“系统很完整，但很重”。
- 被阻断时容易觉得“规则很多，但不确定下一步”。
- 熟悉后会觉得“有秩序，有安全感”。

问题在于:

系统更擅长提供秩序，还不够擅长提供低摩擦上手。

**修正方向**

- 第一屏优先减少压迫感，突出“你现在在哪、建议做什么”。
- 阻断时优先给行动，不优先给理论。
- 恢复上下文时优先给一页摘要，而不是一串文件。

### Pass 4: AI Slop Risk

**7/10**

这里的风险不是“网页长得像模板”，而是“文案和交互越来越像规则堆砌”。从这个角度看，项目反而比多数 AI 生成式产品更克制，因为它没有走通用 SaaS 空话路线。

问题在于另一种 slop:

- 术语越堆越多。
- 解释越写越长。
- 用户要在很多名词之间自己做映射。

**修正方向**

- 杜绝“为了完整而同时暴露所有内部名词”。
- 统一把复杂判断压缩成少量外部词汇。

### Pass 5: Design System Alignment

**2/10**

没有 `DESIGN.md`，所以不存在正式的 design system 对齐。

但从产品现实看，这里需要的不是颜色、字体和组件 token，而是一份 **interaction system**:

- 命令输出层级
- 错误消息结构
- 阻断提示格式
- 下一步推荐格式
- 文档标题和摘要格式

**修正方向**

- 建一个交互设计规范文档，哪怕名字不叫 `DESIGN.md` 也可以。

### Pass 6: Responsive & Accessibility

**N/A for primary scope**

本次主体不是前端 UI，因此传统意义上的响应式与无障碍并不是主问题。

但如果把 CLI/文档交互也纳入“可访问性”理解，仍然存在两个问题:

- 输出信息层级不够稳定，扫描成本高。
- 关键字段不总是被压到用户最先看到的位置。

这属于信息可达性问题，而不是 CSS 层问题。

### Pass 7: Unresolved Design Decisions

当前最关键、又最容易拖累后续实现的未决设计问题有 4 个:

| Decision Needed | If Deferred, What Happens |
|---|---|
| 对外到底保留哪些一级概念 | 用户继续被内部名词淹没 |
| 被阻断时统一展示哪些字段 | 不同命令继续各说各话 |
| 新用户默认路径是什么 | onboarding 成本继续偏高 |
| 哪些文档是用户层权威入口 | 文档越多越难信任 |

## 5. NOT in scope

以下内容本次明确不纳入 `/plan-design-review` 结论:

- 网站视觉风格设计
  理由: `website/` 目前仍是占位 starter，不代表主线产品。
- 组件级视觉语言
  理由: 当前主体不是组件产品。
- 断点布局和视觉响应式
  理由: 当前没有明确页面级主线审查对象。
- 品牌色、字体、视觉动效
  理由: 当前最主要的问题是交互语义，不是视觉层表达。

## 6. Completion Summary

```text
  +====================================================================+
  |         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
  +====================================================================+
  | System Audit         | No DESIGN.md; primary scope is CLI UX       |
  | Step 0               | 4/10; biggest gaps are IA, states, language |
  | Pass 1  (Info Arch)  | 4/10 -> 7/10 after clarifying direction     |
  | Pass 2  (States)     | 3/10 -> 6/10 after adding fixed templates   |
  | Pass 3  (Journey)    | 4/10 -> 6/10 after reframing onboarding     |
  | Pass 4  (AI Slop)    | 7/10 -> 8/10 after term-reduction guidance  |
  | Pass 5  (Design Sys) | 2/10 -> 5/10 after proposing interaction sys|
  | Pass 6  (Responsive) | N/A primary scope                           |
  | Pass 7  (Decisions)  | 0 resolved, 4 deferred                      |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (4 items)                           |
  | What already exists  | written                                     |
  | TODOS.md updates     | 0 items proposed                            |
  | Decisions made       | 0 added to implementation plan              |
  | Decisions deferred   | 4                                           |
  | Overall design score | 4/10 -> 6/10                               |
  +====================================================================+
```

## 7. Final Verdict

**STATUS: DONE_WITH_CONCERNS**

### Concerns

1. 当前请求不是一个标准 UI 计划，所以 `/plan-design-review` 只能部分适用。
2. 该项目真正缺失的是交互设计系统，而不是视觉设计系统。
3. 如果继续增加 Skill、文档和术语，而不先收紧外部入口，复杂度会继续侵蚀产品价值。

### 最终判断

对 `spec-first` 来说，下一步最需要的不是“更漂亮的设计”，而是“更稳定的外部交互语言”。这个项目的设计问题，本质上是产品交互架构问题。
