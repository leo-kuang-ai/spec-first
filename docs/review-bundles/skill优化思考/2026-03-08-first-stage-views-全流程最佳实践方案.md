# 2026-03-08 first-stage-views 全流程最佳实践方案

## 1. 最终结论

结合当前仓库实现与完整流程优化目标，最佳实践已经明确：

> **`00-first` 负责生产统一背景底座；后续阶段统一消费 `first-derived stage views`；在缺失 `first` 时按角色与阶段做显式降级。**

但这里需要补一条更稳的长期维护原则：

> **结构化真源维护在 `.spec-first/runtime/first/`，`docs/first/` 保留为长期维护的人类可读投影视图层；`00-first` 默认采用增量更新，而不是每次全量重生成。**

因此，这套新方案不再以“旧的 `docs/first/.index.yaml + Markdown 直读`”为主链真源，但也不要求把 `docs/first/` 整体废掉。

---

## 2. 为什么必须这样收口

当前流程里，多个节点都会重复做“重新理解项目背景”的动作，直接带来四个问题：

1. `spec / design / code / verify` 对系统现状的理解容易漂移
2. 同一个 feature 在不同阶段会出现不同版本的“系统解释”
3. 项目越复杂，误解越容易传递到方案、实现和验证阶段
4. 每个节点都重复做背景理解，时间成本高且不稳定

所以真正要补的不是更多 prompt，而是：

> **可复用、可裁剪、可降级、可治理、可长期维护的统一背景输入机制。**

`00-first` 最适合承担这个生产职责，因为它最接近“项目现状全景认知”的生成点。

---

## 3. 新方案的三层模型

### 3.1 Layer 1：统一背景底座真源层

由 `00-first` 生产，长期维护在：

- `.spec-first/runtime/first/index.json`
- `.spec-first/runtime/first/summary.json` 或 `summary/`
- `.spec-first/runtime/first/role-views.json` 或 `role-views/`
- `.spec-first/runtime/first/stage-views.json` 或 `stage-views/`

职责：

- 表达项目当前真实结构
- 表达已有业务能力、模块边界、接口与数据模型
- 为角色视图和阶段视图提供结构化真源
- 支持增量更新与局部失效恢复

### 3.2 Layer 2：阶段化投影视图层

由 `summary` 派生，统一表达为：

- `spec-view`
- `design-view`
- `code-view`
- `verify-view`

职责：

- 给每个阶段提供“刚好够用”的背景输入
- 避免把整份背景摘要直接透传到所有节点

### 3.3 Layer 3：人类可读投影视图层

保留在：

- `docs/first/README.md`
- `docs/first/*.md`

职责：

- 供人阅读
- 供沟通、审查、沉淀使用
- 作为 runtime 真源的可读投影，而不是下游主链真源

### 3.4 Layer 4：feature 增量上下文

来自当前 feature 产物，例如：

- `spec.md`
- `design.md`
- `task_plan.md`
- `traceability-matrix.md`
- `verify` 相关报告

职责：

- 描述“这次要做什么”
- 与 `first` 提供的“系统原本是什么”形成互补

一句话：

- `first runtime` 解决“系统原本是什么”
- `docs/first` 解决“人怎么理解它”
- feature 产物解决“这次要改什么”

---

## 4. 当前仓库的准确边界

本方案只基于当前仓库真实存在的流程节点设计，不再使用历史占位路径。

### 4.1 producer 节点

- `skills/spec-first/00-first/SKILL.md`

### 4.2 入口 / 编排节点

- `skills/spec-first/00-onboarding/SKILL.md`
- `skills/spec-first/01-init/SKILL.md`
- `skills/spec-first/13-orchestrate/SKILL.md`

### 4.3 主链阶段节点

- `skills/spec-first/03-spec/SKILL.md`
- `skills/spec-first/04-design/SKILL.md`
- `skills/spec-first/07-code/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`

### 4.4 治理节点

- `skills/spec-first/14-status/SKILL.md`
- `skills/spec-first/15-doctor/SKILL.md`
- `skills/spec-first/21-analyze/SKILL.md`

### 4.5 当前仓库事实

- 当前没有独立的 `skills/spec-first/09-test/SKILL.md`
- 当前 `00-first` 仍主要依赖 `docs/first/*.md` 与 `docs/first/.index.yaml`
- 当前 `src/core/skill-runtime/` 中尚不存在 `first-summary.ts`、`first-role-views.ts`、`first-stage-views.ts`、`first-context.ts`
- 当前也尚未建立“runtime 真源 -> docs 投影刷新”的正式链路

---

## 5. 为什么不是“把真源放回 docs/first”

这是这套方案里最容易误解的一点。

如果把机器真源重新放回 `docs/first/`：

1. 人工编辑会污染机器真源
2. 下游节点会重新回到解析 Markdown 的旧模式
3. 展示模板变化会影响机器消费稳定性
4. 难以做好增量失效与局部刷新

但如果完全不保留 `docs/first/`：

1. 人类阅读体验差
2. 评审、沟通、沉淀会变差

因此最佳实践不是 A，也不是 B，而是：

> **方案 C：runtime 真源层 + docs 投影视图层。**

---

## 6. 长期维护模型

### 6.1 真源层

建议长期维护在：

```text
.spec-first/runtime/first/
├── index.json
├── summary/
├── role-views/
└── stage-views/
```

首期也可以先用单文件：

- `.spec-first/runtime/first/summary.json`
- `.spec-first/runtime/first/role-views.json`
- `.spec-first/runtime/first/stage-views.json`

### 6.2 投影视图层

长期保留在：

```text
docs/first/
├── README.md
└── *.md
```

### 6.3 默认更新方式

`00-first` 默认不应每次全量重跑，而应：

1. 读取 `.spec-first/runtime/first/index.json`
2. 使用 `src/core/skill-runtime/first-change-detector.ts` 判断哪些源文件发生变化
3. 将变化映射到受影响的 summary / role-views / stage-views 分片
4. 只更新受影响的 runtime 真源
5. 按需刷新对应的 `docs/first/*.md`
6. 更新索引中的 hash、时间和健康状态

### 6.4 推荐刷新模式

建议长期支持：

- `refresh-runtime-only`
- `refresh-docs-from-runtime`
- `refresh-all`

这样才能把“真源维护”和“文档刷新”分开治理。

---

## 7. 角色降级为什么合理

答案是：**合理，而且能显著提升流程质量。**

但前提不是“大家都自由发挥”，而是降级必须结构化。

### 7.1 不同角色的真实场景

#### 产品

- 有 `first` 时优先读 `spec-view`
- 无 `first` 时允许降级进入 `03-spec`
- 但应显式标注 `background_input_status=degraded`

#### 测试

- 有 `first` 时优先读 `verify-view`
- 无 `first` 时允许降级到 `spec/design/change diff`
- 高风险验证场景应要求至少不是 `blind`

#### 研发 / 架构

- `04-design`、`07-code` 默认应强依赖 `first`
- 没有 `first` 时可以临时推进，但必须显示风险状态
- 正式设计评审和高风险实现不应长期处于 `blind`

### 7.2 所以应采用什么规则

不是“人人强制先跑 `first`”，而是：

1. 优先看 `first` runtime 资产是否存在
2. 存在则统一读 stage views
3. 不存在则按角色与阶段降级
4. 降级结果必须进入流程状态，而不是默默发生

---

## 8. 为什么 stage views 比 role views 更关键

`role-views.json` 解决的是入口体验与角色裁剪。

`stage-views.json` 解决的是：

- 需求阶段是否理解已有能力边界
- 设计阶段是否理解真实模块与约束
- 开发阶段是否理解入口、耦合点与变更风险
- 验证阶段是否聚焦关键流程与高风险区域

因此：

> **对于流程质量提升，`stage-views` 是主交付；`role-views` 是辅助交付；`docs/first` 是可读投影。**

---

## 9. 节点接入模型

### 9.1 `00-onboarding`

- 根据角色和资产存在性给出入口建议
- 若存在 `role-views`，优先做角色化投影
- 不承担背景真源生产职责

### 9.2 `01-init`

- 在 feature 初始化时感知 `first` runtime 资产是否存在
- 记录本次 feature 的背景输入状态
- 不直接重建项目背景

### 9.3 `03-spec / 04-design / 07-code / 12-verify`

- 分别读取 `spec-view / design-view / code-view / verify-view`
- 无 view 时进入显式降级
- 不直接解析 `docs/first/*.md`

### 9.4 `13-orchestrate`

- 根据阶段、角色、背景状态决定推荐路径
- 统一处理依赖强度和降级提示
- 不自己生成背景内容

### 9.5 `14-status / 15-doctor / 21-analyze`

- 展示、诊断、分析 `background_input_status`
- 识别 `stage-views` 缺失或失真
- 将背景质量纳入治理口径

---

## 10. 推荐的依赖强度

建议把背景输入依赖强度统一为三档：

- `L1`：推荐
- `L2`：强烈推荐
- `L3`：事实门槛

推荐口径：

- `03-spec`：`L1/L2`，按复杂度升档
- `04-design`：`L2`，正式设计评审可升到 `L3`
- `07-code`：`L2`，高风险改动可升到 `L3`
- `12-verify`：`L2`，发布前或高风险验证可升到 `L3`

---

## 11. 结论：first-skill 还需要怎么改

答案是：**需要继续改，但方向已经更清楚了。**

正确方向不是继续把 `first-skill` 做大，而是：

1. 更强硬地收敛到 producer-only
2. 更明确地区分 runtime 真源层与 docs 投影视图层
3. 更明确地采用增量维护，而不是默认全量重生成
4. 更明确地把消费规则转移到 `skill-全流程`
5. 更明确地把 `00-onboarding / 01-init / 13-orchestrate` 纳入全流程设计，而不是只盯主链节点

---

## 12. 配套文档入口

- producer 侧：`docs/review-bundles/skill优化思考/first-skill/2026-03-08-first-skill-最佳实践重构设计.md`
- producer 实施：`docs/review-bundles/skill优化思考/first-skill/2026-03-08-first-skill-一次切换实施清单.md`
- 全流程结构：`docs/review-bundles/skill优化思考/skill-全流程/2026-03-08-stage-views-结构设计.md`
- 全流程实施：`docs/review-bundles/skill优化思考/skill-全流程/2026-03-08-stage-views-全流程实施计划.md`
