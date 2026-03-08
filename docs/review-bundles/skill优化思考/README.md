# skill 优化思考

本目录包含两类文档：

1. **历史审查稿**：`2026-03-06`、`2026-03-07` 系列，主要用于逐 skill 审查、问题归档与中间推演
2. **当前建议稿**：`2026-03-08` 系列，代表当前推荐采用的最佳实践方案

## 当前有效方案

如果只看当前推荐版本，按下面顺序阅读。

### 1. 总纲

- `docs/review-bundles/skill优化思考/2026-03-08-first-stage-views-全流程最佳实践方案.md`

用途：

- 定义为什么要把 `00-first` 升级为全流程背景底座生产者
- 定义“runtime 真源层 + docs 投影视图层 + 角色降级”的总体模型
- 说明为什么 `first-skill` 与 `skill-全流程` 必须拆开治理

### 2. producer 方案：`first-skill`

- `docs/review-bundles/skill优化思考/first-skill/2026-03-08-first-skill-最佳实践重构设计.md`
- `docs/review-bundles/skill优化思考/first-skill/2026-03-08-first-skill-一次切换实施清单.md`
- `docs/review-bundles/skill优化思考/first-skill/2026-03-08-first-skill-开发执行任务表.md`

用途：

- 只定义 `00-first` 作为 producer 的职责边界
- 只覆盖 `.spec-first/runtime/first/` 真源层与 `docs/first/` 投影视图层的建立
- 只覆盖增量维护能力，不覆盖下游阶段接入

### 3. consumer / 治理方案：`skill-全流程`

- `docs/review-bundles/skill优化思考/skill-全流程/2026-03-08-stage-views-结构设计.md`
- `docs/review-bundles/skill优化思考/skill-全流程/2026-03-08-stage-views-全流程实施计划.md`
- `docs/review-bundles/skill优化思考/skill-全流程/2026-03-08-stage-views-开发执行任务表.md`
- `docs/review-bundles/skill优化思考/skill-全流程/2026-03-08-stage-views-首批落地子任务.md`

用途：

- 定义后续阶段如何消费 `stage-views`
- 定义入口节点、主链节点、治理节点如何感知背景状态
- 定义角色降级、依赖强度与治理接入顺序

## 当前统一结论

### 1. 关于 `00-first`

`00-first` 不再被视为“项目认知文档生成器”，而被定义为：

> **全流程统一背景底座的 producer。**

它的硬职责是稳定维护两层资产：

#### A. runtime 真源层

- `.spec-first/runtime/first/index.json`
- `.spec-first/runtime/first/summary.json` 或 `summary/`
- `.spec-first/runtime/first/role-views.json` 或 `role-views/`
- `.spec-first/runtime/first/stage-views.json` 或 `stage-views/`

#### B. docs 投影视图层

- `docs/first/README.md`
- `docs/first/*.md`

### 2. 关于 `docs/first`

`docs/first/*.md` 继续保留，但职责收口为：

- 人工阅读
- 项目认知展示
- 审阅、沟通与知识沉淀
- runtime 真源的可读投影

它们不再作为下游阶段的机器真源。

### 3. 关于后续阶段

后续流程节点默认不直接解析 `docs/first/*.md`，而是优先读取：

- `spec-view`
- `design-view`
- `code-view`
- `verify-view`

也就是统一从 runtime `stage-views` 中读取各自的阶段化背景视图。

### 4. 关于长期维护

当前推荐方案不是“把真源放回 docs”，也不是“每次全量重生成”，而是：

- 真源维护在 `.spec-first/runtime/first/`
- 文档维护在 `docs/first/`
- `00-first` 默认采用增量更新
- 建议支持：`refresh-runtime-only`、`refresh-docs-from-runtime`、`refresh-all`

### 5. 关于角色降级

不是所有角色都会先跑 `first`。

因此当前推荐方案不是“强制所有人先跑 first”，而是：

- 有 `first` runtime 资产：优先消费 stage views
- 无 `first` runtime 资产：按角色与阶段做显式降级
- 降级时必须显式标注 `background_input_status`

## 当前仓库事实

以下事实已经在 `2026-03-08` 方案中统一对齐：

- 当前仓库存在 `skills/spec-first/00-first/SKILL.md`
- 当前仓库存在 `skills/spec-first/00-onboarding/SKILL.md`
- 当前仓库存在 `skills/spec-first/01-init/SKILL.md`
- 当前仓库存在 `skills/spec-first/03-spec/SKILL.md`
- 当前仓库存在 `skills/spec-first/04-design/SKILL.md`
- 当前仓库存在 `skills/spec-first/07-code/SKILL.md`
- 当前仓库存在 `skills/spec-first/12-verify/SKILL.md`
- 当前仓库存在 `skills/spec-first/13-orchestrate/SKILL.md`
- 当前仓库存在 `skills/spec-first/14-status/SKILL.md`
- 当前仓库存在 `skills/spec-first/15-doctor/SKILL.md`
- 当前仓库存在 `skills/spec-first/21-analyze/SKILL.md`
- 当前仓库没有独立的 `skills/spec-first/09-test/SKILL.md`
- 当前 `00-first` 现状仍主要依赖 `docs/first/*.md` 与 `docs/first/.index.yaml`
- 当前 `src/core/skill-runtime/` 已存在 `first-index.ts`、`first-resume.ts`、`first-artifact-mapping.ts`、`first-change-detector.ts` 等模块，但尚未形成完整的 runtime 真源层与 docs 投影链路

## 如何使用本目录

- 要看 `00-first` 自身怎么改：读 `first-skill/`
- 要看全流程如何消费 `first`：读 `skill-全流程/`
- 要看为什么要这样拆：先读总纲，再看两套子方案

## 备注

`2026-03-06`、`2026-03-07` 系列文档仍保留，作为审查过程记录；但如果它们与 `2026-03-08` 系列发生冲突，以 `2026-03-08` 系列为准。
