# spec-first / brainstorming 对照分析

文档日期：2026-03-23  
对照对象：
- `/Users/kuang/xiaobu/spec-first/brainstorm`
- `/Users/kuang/.codex/superpowers/skills/brainstorming`

## 1. 一句话结论

这两个 `brainstorm` 不是同一类东西。

- `spec-first/brainstorm` 是**项目内的产品规划技能**，偏向把一个想法变成可继续推进的设计文档，并且和 spec-first 后续的 `/plan-ceo-review`、`/plan-eng-review`、`/writing-plans` 链路强绑定。
- `superpowers/skills/brainstorming` 是**通用的设计思维母版**，重点是先理解问题，再逐步澄清、比较方案、写 design doc，最后转入 `writing-plans`。

如果把它们类比成工具：

- `spec-first/brainstorm` 更像一套已经接好水管和电路的产品工作台。
- `superpowers/brainstorming` 更像一份通用的工作方法说明书。

## 2. 核心差异总表

| 维度 | spec-first/brainstorm | superpowers/brainstorming |
|---|---|---|
| 定位 | 项目专用技能 | 通用方法技能 |
| 主要目标 | 把产品想法收敛成可继续推进的 spec / design doc | 把任何创意或需求转成可执行设计文档 |
| 风格 | YC / 创业 / 产品决策语境更强 | 设计思维、需求澄清、方案比较更通用 |
| 触发场景 | 新产品想法、是否值得做、进入 plan review 前 | 任何创意型工作前，修改行为、功能、组件前 |
| 工作流 | 6 个强制问题 + startup/builder 两种模式 + 写 design doc + 接 spec-first 下游技能 | 探索上下文 -> 逐个提问 -> 提 2-3 个方案 -> 写 design doc -> 进入 writing-plans |
| 输出 | design doc，并与 spec-first 项目级设计体系联动 | design doc，并交给 writing-plans |
| 约束 | 有 preamble、升级检查、会话跟踪、遥测、Completeness Principle | 主要约束是设计先行，不允许直接进入实现 |
| 下游 | `/plan-ceo-review`、`/plan-eng-review`、后续 spec-first 流程 | `writing-plans`，再进入实现 |
| 生态边界 | spec-first 仓库内的技能体系 | superpowers 通用技能体系 |

## 3. spec-first 版的特点

`spec-first/brainstorm` 的特点不是“多问几个问题”，而是它已经嵌入了 spec-first 的整体产品方法。

### 3.1 它更像产品规划入口

这个技能的目标不是纯粹的想法发散，而是：

- 识别需求是否值得做
- 区分创业型问题和普通 builder 问题
- 把模糊想法变成后续可以评审、拆解、执行的文档

它的名字虽然也是 `brainstorm`，但实际职责更接近“产品规划前置审查 + 设计收敛”。

### 3.2 它和 spec-first 生态强绑定

它自带：

- `{{PREAMBLE}}` 注入
- 更新检查
- 会话状态跟踪
- 遥测与主动建议开关
- Completeness Principle
- 项目级设计文档发现机制

也就是说，它不是单独可用的孤立 skill，而是 spec-first 流程里的起点。

### 3.3 它把“创业判断”写进流程

spec-first 版明确区分：

- Startup mode：适合要验证是不是一个值得做的产品
- Builder mode：适合副项目、黑客松、开源、学习等更轻的场景

这使它比通用 brainstorm 更像“产品决策工具”，而不只是“头脑风暴工具”。

## 4. superpowers 版的特点

`superpowers/skills/brainstorming` 更像一份通用上层规则。

### 4.1 它强调通用性

它适用于：

- 新功能
- 组件设计
- 行为修改
- 一切“动手之前必须先想清楚”的场景

所以它不是围绕产品是否值得做来组织，而是围绕“任何创意工作都先设计”来组织。

### 4.2 它强调流程完整性

它的 checklist 很固定：

1. 看项目上下文
2. 一次只问一个问题
3. 提 2-3 个方案
4. 分段展示设计并确认
5. 写 design doc
6. 再转 `writing-plans`

这说明它主要关心的是“设计怎么被收敛并进入实施链路”，而不是“这个产品是否应该做”。

### 4.3 它的抽象层更高

superpowers 版不依赖特定项目生态，也不关心 spec-first 的会话注入、更新检查、遥测、下游约束。

它是一个更通用、更容易迁移到别的仓库或别的 agent 框架里的设计方法论。

## 5. 语义边界

### 5.1 spec-first/brainstorm 解决什么

它解决的是：

- 这个需求值不值得做
- 这个想法应该如何进入 spec-first 的评审链路
- 这个问题属于 startup 还是 builder 场景
- 后续应如何进入 plan review

### 5.2 superpowers/brainstorming 解决什么

它解决的是：

- 在动手前，如何先把问题讲清楚
- 如何避免一上来就写代码
- 如何把想法变成可执行设计
- 如何把设计交给后续计划执行流程

### 5.3 术语相似，不代表职责相同

两个技能都叫 brainstorming，但它们关注的重点不一样：

- `spec-first/brainstorm` 更关注“这个东西该不该做、该怎么进入产品流程”
- `superpowers/brainstorming` 更关注“这个东西怎么先被设计清楚，再进入执行”

## 6. 适用场景建议

### 6.1 选 spec-first/brainstorm 的情况

- 你在 spec-first 体系里工作
- 你有一个产品想法，想判断值不值得做
- 你希望后面直接接 `/plan-ceo-review` 或 `/plan-eng-review`
- 你需要 startup / builder 这种更产品化的分流

### 6.2 选 superpowers/brainstorming 的情况

- 你在更通用的 superpowers 工作流里
- 你要做的是功能、组件、行为修改前的设计澄清
- 你只需要一份标准的 design doc
- 你希望直接进入 writing-plans，再推进实现

## 7. 结论

这两个技能可以看作：

- `spec-first/brainstorm` = **产品入口型、项目绑定型、偏创业判断**
- `superpowers/brainstorming` = **方法论入口型、通用绑定型、偏设计收敛**

如果目标是理解一个想法“值不值得做，并且如何进入 spec-first 体系”，用 `spec-first/brainstorm` 更合适。  
如果目标是对任何创意工作先做设计澄清，再进入通用实现流程，用 `superpowers/brainstorming` 更合适。

## 8. 迁移判断

如果未来想减少歧义，可以考虑把两者在文案上进一步区分：

- `spec-first/brainstorm` 强调“产品规划 / 需求判断”
- `superpowers/brainstorming` 强调“设计澄清 / implementation before code”

这样用户看到名字时，就能直接知道自己是在做“产品判断”还是在做“通用设计前置”。
