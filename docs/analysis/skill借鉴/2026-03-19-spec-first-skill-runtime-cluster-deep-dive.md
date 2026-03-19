# Spec-First Skill 运行时聚类深潜分析

> 分析日期: 2026-03-19  
> 目标: 解释 `spec-first` 当前 skill 节点为什么看起来相似、哪些是结构性重复、哪些是运行时刻意分层，以及如果要合并应该先改哪里。

## 一句话结论

`spec-first` 的 skill 体系已经不是“很多功能都挤在一起”，而是**一套有明确运行时聚类的分层系统**：

- `shared` 负责共识骨架
- `context-resolver` 负责按 skill 族群投喂不同运行时资产
- `dispatcher` 负责按 skill 类型注入不同 runtime notice
- 各个 skill 节点本身负责声明自己的职责边界

所以，当前最重要的不是继续“数 skill 个数”，而是识别：

1. 哪些 skill 只是**同族不同 mode**
2. 哪些 skill 是**不同职责但共享输入**
3. 哪些 skill 其实已经被**共享底座抽掉了重复**

---

## 1. 当前系统的真实分层

### 1.1 文档层

`skills/spec-first/README.md` 把整个系统分成了六层：

- 项目认知
- 核心工作流
- 编排与验证
- 会话管理
- Feature 管理
- 扩展

这说明当前 skill 目录不是“散点集合”，而是有意组织过的产品结构。

### 1.2 共享层

`skills/spec-first/SHARED.md` 明确声明：

- `P0-P5` 只是默认模板，不是所有 skill 的强制统一流程
- skill 类型分成：
  - 产物生成型
  - 只读诊断型
  - 路由控制型
  - 宿主修复型

这很关键。它意味着：

- 看到许多 skill 都有 `Feature 定位规则`、`执行阶段`、`输出路径`，**不等于它们该合并**
- 很多相似结构本来就是共享层约束的投影

### 1.3 运行时层

真正决定 skill 行为的是 `src/core/skill-runtime`：

- `dispatcher.ts` 决定 command 走 skill 还是 runtime
- `context-resolver.ts` 决定 skill 读什么 runtime 资产
- `skill-commands.ts` 决定 skill 如何被宿主发现与渲染

这三层比文档目录更能说明“哪些东西是真的重复，哪些只是表象重复”。

---

## 2. 运行时聚类的核心证据

### 2.1 `SKILL_INPUT_MATRIX` 已经把 skill 分成固定族群

`src/core/skill-runtime/context-resolver.ts` 里的 `SKILL_INPUT_MATRIX` 是目前最硬的能力分群证据。

#### 族群 A: `spec` / `spec-review`

两者都以 `summary` 为必需输入，并共享 `domain-model`、`conventions` 作为辅助输入。

这说明：

- 它们共享同一批项目认知资产
- 差异在“目标产物”而不是“背景输入”

结论：

- 语义相近，但不是完全同义
- 更适合做 **同族模式合并**，不适合直接删除一个

#### 族群 B: `plan` / `orchestrate` / `task`

这三个 skill 的输入契约在当前实现中是同构的：

- `required: summary`
- `optional: entry-guide / critical-flows / structure-overview / api-contracts`

这不是巧合，而是系统设计信号：

- `task` 负责把设计变成可执行任务
- `plan` 负责给出下一步计划
- `orchestrate` 负责把计划推进成实际阶段流转

它们共享同一组背景资产，说明底层关注点是同一条链路：

**项目背景 -> 计划 -> 编排**

这组节点是当前最强的“同族聚类”。

#### 族群 C: `code` / `review`

两者也共享同构输入：

- `summary` 为必需
- `conventions / entry-guide / structure-overview / api-contracts` 为辅助

区别在于：

- `code` 生产变更
- `review` 审核变更

所以这对节点不是重复，而是**同一变更链路的两个角色面**。

#### 族群 D: `status` / `analyze`

这两者输入矩阵完全一致：

- `summary` 必需
- `critical-flows / structure-overview / domain-model` 辅助

同时它们都在输出层强调背景质量、风险与下一步建议。

这意味着：

- 它们共享同一底层问题模型
- 区别主要是“展示当前状态” vs “做一致性分析”

#### 族群 E: `archive`

`archive` 依赖 `structure-overview` 和 `domain-model`，属于“收尾期的沉淀/复盘”族群。

它和 `verify` / `status` / `analyze` 会有内容交叉，但职责并不相同：

- `verify` 证明能否推进
- `archive` 证明已经完成并提炼经验

#### 族群 F: `doctor` / `sync` / `feature` / `catchup`

这些节点的共同点是：

- 读背景
- 读状态
- 读运行态
- 不直接生产交付物

但它们的作用域不同：

- `doctor` 看宿主健康
- `sync` 看追踪矩阵与状态一致性
- `feature` 看当前工作指针
- `catchup` 看会话恢复

这类节点是**路由与治理节点**，不适合硬并成一个。

---

## 3. 运行时注入如何影响“重复感”

### 3.1 `loadSkillTemplate()` 会把 `SHARED.md` 预拼接到每个 skill

在 `src/core/skill-runtime/dispatcher.ts` 里，`loadSkillTemplate()` 会把 `SHARED.md` 作为前缀拼接进 skill 文本。

这意味着：

- 你在每个 skill 里看到的许多流程术语，很多是共享模板的影子
- 这些“重复”本质上是 **刻意共享**，不是坏味道

所以，不能因为 `spec / design / task / code / review / verify` 都有类似的治理语言，就认为它们应该合并。

正确的判断方式是：

1. 看运行时输入契约是否同构
2. 看 runtime notice 是否完全同义
3. 看是否只是在表达同一底座的不同阶段面

### 3.2 `dispatcher.ts` 为不同 skill 注入不同 notice

`dispatcher.ts` 并没有把所有 skill 当成同一类，它在 `loadSkill()` 后面按 skill name 注入不同 runtime notice：

- `first`
- `orchestrate`
- `onboarding`
- `spec`
- `design`
- `task`
- `code`
- `review`
- `plan`
- `verify`
- `spec-review`

这说明系统在运行时已经认可：

- 同样的背景资产，不同 skill 的解释方式不同
- 同样的 Feature，上下文要按 skill 目的重新投影

所以合并 skill 时要警惕：

- 合并的是“业务职责”
- 不是“共享背景输入”

---

## 4. 深层冗余：哪些是真正值得动的

### 4.1 真正的高价值合并候选

#### 候选 1: `08-review` + `20-spec-review`

这是最接近“同类节点”的一组。

原因不是它们的输出对象相同，而是：

- 都是审查型节点
- 都有 Feature 定位
- 都需要人工确认
- 都要输出结构化结果

如果要合并，建议采用“单节点多模式”：

- `review --kind code`
- `review --kind spec`

而不是让两个节点长期并存。

#### 候选 2: `11-plan` + `13-orchestrate`

这是“计划入口”与“编排执行器”的关系。

从代码上看：

- 两者都吃 `summary`
- 两者都依赖 `dependencyStrength / riskCategory / riskSignals`
- 两者都把 `findings.md` 作为关键落点

它们的差异更多是交互层级：

- `plan` 是轻量决策
- `orchestrate` 是批次推进

如果做合并，比较合理的方向是：

- `orchestrate --plan-only`
- 或者让 `plan` 成为 `orchestrate` 的一个模式

但短期内不建议直接硬删 `plan`，因为它承担的是轻入口角色。

### 4.2 适合做“能力合并”的节点

#### `16-sync` + `21-analyze`

这两个节点最适合做“共享分析核心 + 不同执行模式”。

- `analyze`：只读发现问题
- `sync`：回填问题并修复一致性

建议是：

- 不合并成一个节点
- 但共享同一套分析模型、问题分类、输出 schema

也就是说，它们应该是：

**同一分析引擎的两个前端**

而不是两个独立地重复判断同一个问题的节点。

### 4.3 适合做“职责再收缩”的节点

#### `14-status`

`status` 现在做了太多事：

- 状态快照
- 覆盖率
- 健康分
- 风险识别
- TDD 概览
- 下一步建议

它和 `analyze`、`catchup` 的边界开始模糊。

建议收缩成：

- 当前阶段
- 覆盖率
- 健康分
- 任务进度
- 下一步建议

把更深的冲突分析留给 `analyze`。

#### `15-doctor`

`doctor` 的边界应更明确地锁在：

- 宿主配置
- MCP
- skills 注册
- 环境 baseline

不要继续把项目态 runtime/doc 健康和宿主态问题混在一起。

#### `02-catchup`

`catchup` 不该合并，但可以进一步收紧：

- 只做恢复，不做决策
- 只做上下文重建，不做一致性分析

它应该消费 `status` / `analyze` 的结论，而不是自己发明新分析口径。

---

## 5. 哪些重复不该被误判为冗余

### 5.1 `feature` 不是多余的

`17-feature` 虽然看起来像工具命令，但它是共享指针的唯一读写入口：

- `list`
- `current`
- `switch`

它承载的是全局工作指针，不应该并入 `catchup` 或 `orchestrate`。

### 5.2 `spec` / `design` / `task` / `code` / `verify` / `archive` 是阶段边界

这些节点之所以看起来像是“同一套流程复制”，是因为它们确实共享同一个工程生命周期。

但每个节点背后对应的是不同的可验证产物：

- `spec` -> FR / AC
- `design` -> DS / 契约
- `task` -> TASK / 拆解
- `code` -> 实现
- `verify` -> Gate / 证据
- `archive` -> 复盘 / 归档

它们不是重复，而是生命周期分层。

### 5.3 `first` / `onboarding` / `init` 不是同一类

这三者最容易被误解成“入口重复”。

实际上：

- `first`：项目认知真源生成
- `onboarding`：用户学习路径推荐
- `init`：项目/Feature 初始化路由

它们都提到“先看 first”，但目的完全不同。

---

## 6. 如果要重构，应该先改哪里

### 第一优先级: 抽共享协议，不先删节点

先抽这些公共协议：

- `featureId` 解析
- `.spec-first/current` 定位
- `findings.md` 计划/证据结构
- `backgroundInputStatus` / `background_input_status`
- `dependencyStrength / riskCategory / riskSignals`
- 通用状态快照 schema

### 第二优先级: 把“模式差异”显式化

最值得合并的地方，都是“同一个节点的不同模式”：

- `review` 可以承载 code/spec 模式
- `orchestrate` 可以承载 plan-only / auto / auto-advance 模式

### 第三优先级: 收缩边界最模糊的节点

优先收缩：

- `status`
- `doctor`
- `catchup`

这些节点最容易把别人的职责吃进去。

---

## 7. 最终判断

从运行时角度看，`spec-first` 当前并不是“skill 太多导致混乱”，而是：

- **基础协议已经开始统一**
- **职责边界已经稳定分层**
- **同族节点还没有被模式化**

所以当前最佳策略不是立即大规模删节点，而是：

1. 先把共享输入、共享输出、共享治理契约抽干净
2. 再把真正同族的节点改成 mode 化
3. 最后只对那些依然重叠的节点做硬合并

如果这个顺序反过来，风险很高：

- 会把本来清晰的阶段边界削薄
- 会把“只读”和“写回”混在一起
- 会损坏当前已经可用的运行时路由与背景治理体系
