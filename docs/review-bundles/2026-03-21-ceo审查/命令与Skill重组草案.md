# 命令与 Skill 重组草案

> 日期: 2026-03-22
> 目标: 降低外部复杂度，建立面向存量项目的渐进式入口

## 1. 重组原则

1. 用户先按场景进入，不按内部架构进入。
2. 默认暴露轻流程，重流程按风险升级。
3. 保留底层能力，不再默认同时暴露全部概念。
4. 命令和 Skill 名称优先表达“动作”，不是“系统结构”。

## 2. 建议的用户层入口

### A. 轻流程入口

面向存量项目默认推荐:

- `analyze`
  这次改动会影响什么。

- `review`
  这次改动最可能出什么问题。

- `verify`
  最小验证集是什么。

- `next`
  现在最合理的下一步是什么。

### B. 项目级入口

- `status`
  当前项目治理状态。

- `doctor`
  环境和配置问题。

- `sync`
  同步文档、索引、追溯等状态。

### C. 完整流程入口

- `flow init`
- `flow spec`
- `flow design`
- `flow task`
- `flow code`
- `flow verify`
- `flow archive`

或者仍保留现有 skill namespace，但在用户文档和 onboarding 中把它们明确放入“高级模式”。

## 3. 现有能力映射

### 应保留但重新定位的

- `status`
  保留，作为最常用入口。

- `doctor`
  保留，作为系统健康入口。

- `analyze`
  强化为 brownfield 第一入口之一。

- `review`
  强化为 reviewer 入口。

- `verify`
  保留，但更强调“最小验证闭环”。

- `catchup`
  保留，作为恢复上下文入口。

### 应降级为高级能力的

- `init`
- `spec`
- `design`
- `task`
- `archive`

这些不是不重要，而是不该继续作为默认第一层入口。

### 应重新包装表达的

- `plan`
  不再表达成“流程节点”，而表达成“下一步建议层”。

- `orchestrate`
  不再表达成抽象治理术语，而表达成“执行编排”或“flow run”一类更可理解语义。

- `first`
  重新定位为项目认知/项目扫描，不让用户误解为必须先做的大流程。

## 4. 推荐的 preset

### `quick-review`

适用:
- 已有 diff
- 想快速知道风险和补测

包含:
- analyze
- review
- verify

### `bugfix`

适用:
- 缺陷修复
- 不需要完整 spec 流程

包含:
- analyze
- review
- verify
- trace 最小记录

### `full-flow`

适用:
- 高风险改动
- 跨团队需求
- 需要完整审计和追溯

包含:
- init/spec/design/task/code/verify/archive

## 5. 推荐的文档结构

### 用户文档第一层

只写 3 类:

1. 我想改一个已有功能
2. 我想修一个 bug
3. 我想做完整规范化交付

### 技术文档第二层

再展开:

- Stage
- Gate
- Trace
- Runtime
- Skill routing

### 这样做的目的

先给用户行动路径，再给系统结构解释。

## 6. 一版可执行的命名策略

如果不想大改 CLI，可以先改“外部表达”:

- `/spec-first:analyze` -> 默认文档第一入口
- `/spec-first:review` -> reviewer 第一入口
- `/spec-first:verify` -> 合并验证建议与测试建议
- `/spec-first:plan` -> 重命名说明为“next-action”
- `/spec-first:init/spec/design/task/code/archive` -> 标为 advanced flow

如果愿意改 CLI 表达，可以逐步引入 alias:

- `spec-first next`
- `spec-first review`
- `spec-first impact`
- `spec-first flow <stage>`

## 7. 结论

命令和 Skill 不一定要立刻大改实现，但必须先改“对外表达”。如果对外还是把所有内部层次平铺给用户，任何架构升级都会继续被复杂度抵消。
