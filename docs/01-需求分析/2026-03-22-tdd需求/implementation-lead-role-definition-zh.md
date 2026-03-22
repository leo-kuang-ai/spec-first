# Implementation Lead / TDD Engineer 角色定义

本文定义的是一个面向 gstack 的新角色，不是一个抽象头衔。

它服务于新增的 `/implement-tdd` skill，用来回答一个关键问题：

**如果把“规划执行 + TDD 实现”合并成一个 skill，这个 skill 背后对应的角色到底是什么？**

## 1. 一句话定义

这个角色是：

**把可实施的 plan 或受控的小改动上下文，稳定地变成可审查代码的人。**

更完整一点说：

- 他不是只会按 ticket 写代码的 coder
- 他不是只会指出问题的 reviewer
- 他不是只会写测试的 test engineer
- 他是一个对实现阶段结果负责的 specialist

## 2. 角色在整体流程中的位置

放在 gstack 主流程里，这个角色位于：

```text
/plan-eng-review
  -> Implementation Lead / TDD Engineer
  -> /review
  -> /qa
  -> /ship
```

它承接的是：

- plan-backed 的 engineering plan，或 context-backed 的小改动上下文
- design 决策
- scope 结论

它交付的是：

- 已实现的阶段成果
- 测试证据
- 可 review 的代码状态
- 清晰的 remaining / risk / follow-up

## 3. 这个角色的输入是什么

这是把这个角色真正放进 gstack 上下文时必须说清楚的一层。

这个角色不是凭空开始工作，而是承接前面几个 specialist skill 产出的上下文和 artifact。

默认情况下，它承接 `/plan-eng-review` 的产物。  
但为了适应小 bugfix 和小调整，它也可以在严格受控的前提下使用当前窗口上下文作为轻量输入。

### 3.1 两种输入模式

这个角色有两种输入模式：

#### 1. Plan-backed mode

这是默认模式，也是推荐模式。

输入来源：

- `/plan-eng-review` 的产物
- 可选的 design doc / test plan / TODO context

适用场景：

- feature
- 中等以上 bugfix
- refactor
- 多文件或多路径行为变更

#### 2. Context-backed mode

这是例外模式，不是默认模式。

输入来源：

- 当前窗口用户上下文
- 当前分支的局部代码上下文
- 当前可运行测试环境

适用场景：

- 小 bugfix
- 小的代码调整
- 行为边界已经足够清楚
- 不需要新的架构决策

这两种模式的区别是**输入来源不同**，不是职责不同。

### 3.2 必需输入

#### 1. 可用的实现输入

这是最核心输入。

通常来自：

- `/plan-eng-review`
- 或者在小改动场景下，来自当前窗口上下文的 `context-backed mode`

它至少应该提供：

- 目标是什么
- 核心路径是什么
- 风险和边界条件是什么
- 当前变更的 in-scope / out-of-scope
- 哪些内容必须有测试

如果没有这层输入，这个角色就会退化成“直接开始写代码的人”。

#### 2. 当前分支上的实现任务

这个角色需要知道这次是在实现：

- feature
- bugfix
- refactor
- 行为修改

否则无法收敛当前阶段和最小增量。

#### 3. 可运行的测试环境

因为这个角色承担 TDD 责任，所以至少要有：

- 可运行的测试命令
- 可写入测试文件的约定位置
- 可观察测试失败和通过的反馈机制

没有这一层，角色的 TDD 约束就会失真。

### 3.3 强推荐输入

这些输入不是绝对必需，但一旦有，会显著提升效果。

#### 1. design doc

通常来自：

- `/brainstorm`
- `/plan-ceo-review`
- `/plan-design-review`

它提供：

- 为什么要做这件事
- 用户行为和体验意图
- 哪些“看起来像实现细节”的东西其实是设计约束

这有助于防止实现阶段把设计意图写歪。

#### 2. test plan

通常来自：

- `/plan-eng-review` 产出的 `Test Plan Artifact`

它提供：

- 哪些页面 / 路径受影响
- 哪些关键交互必须验证
- 哪些 edge case 是本次重点

这能帮助该角色决定：

- 哪些测试应该优先写
- 哪些增量应该先落地

#### 3. 当前 TODO / deferred items

通常来自：

- `TODOS.md`
- 上一轮 review / plan 中留下的 deferred item

这有助于角色判断：

- 当前是不是在 scope 内
- 哪些内容不该在这轮顺手做掉

### 3.4 输入的结构化理解

可以把这个角色的输入理解成四类：

```text
业务意图输入：
  - design doc
  - scope 结论

工程约束输入：
  - plan-backed 的 engineering plan，或 context-backed 的轻量执行约束
  - failure modes
  - test expectations

执行环境输入：
  - 当前分支
  - 测试命令
  - 代码库现状

边界控制输入：
  - TODOs
  - deferred items
  - out-of-scope 结论
```

### 3.5 为什么要允许 context-backed mode

因为 gstack 如果要求所有实现都必须先产出 `/plan-eng-review` artifact，会让小变更变得过重。

对这类任务：

- 明确的小 bugfix
- 明确的小调整
- 局部、低 blast radius 的行为修改

直接使用当前窗口上下文进行轻量执行收敛，会更灵活，也更贴近真实开发节奏。

但它必须是受控例外，而不是默认通道。

正确理解是：

- **解耦的是输入来源**
- **不解耦的是角色职责**

也就是说，即使在 `context-backed mode` 下，这个角色仍然必须：

- 先收敛当前阶段
- 守住 scope
- 先写失败测试
- 留下验证证据
- 做清晰移交

## 4. 这个角色的输出产物是什么

这是第二个必须说清楚的问题。

在 gstack 里，一个角色如果没有稳定产物，就很难真正成为流程节点。  
这个角色的输出不应该只是“代码改好了”，而应该是一组可以被下游 skill 消费的结果。

### 4.1 核心输出

#### 1. 分阶段实现后的代码状态

这是最直接的输出。

但它不是“随便写出来的代码”，而应该具备这些性质：

- 范围收敛
- 能映射回当前阶段目标
- 已经过局部 TDD 验证
- 处于 ready-for-review 的状态

#### 2. 测试证据

这个角色必须输出：

- 哪些测试先失败
- 哪些测试后通过
- 当前阶段覆盖了哪些行为

这不是可选项，因为它是角色合法性的核心。

#### 3. 当前阶段完成结论

至少要能回答：

- 当前阶段完成了什么
- 还剩什么
- 哪些风险仍在
- 是否 ready for `/review`

### 4.2 推荐 artifact

为了符合 gstack 的 artifact 风格，建议这个角色产出一个进度文档。

#### TDD Progress Artifact

建议路径：

`~/.gstack/projects/{slug}/{user}-{branch}-tdd-progress-{datetime}.md`

建议内容：

- 当前阶段名称
- 当前阶段目标
- 当前阶段 exit criteria
- 本轮 in-scope / out-of-scope
- 每个 cycle 的 RED / GREEN / REFACTOR / verification
- completed / remaining / risks

这个 artifact 的价值在于：

- 让 `/review` 理解这次实现是怎么推进的
- 让 `/qa` 知道当前完成了哪些行为
- 让 `/ship` 知道当前是不是在一个稳定可交付状态

### 4.3 面向下游 skill 的输出接口

这个角色的输出，实际上要服务三个下游。

#### 给 `/review`

它应该输出：

- 当前阶段范围
- 相关测试证据
- remaining / known risks
- 为什么这个 diff 应该被看作一个单一阶段产物

这样 `/review` 更容易做：

- scope drift 判断
- risk 判断
- missing requirement 判断

#### 给 `/qa`

它应该输出：

- 当前已完成的行为
- 仍未完成的行为
- 本轮补上的边界情况
- 哪些路径值得重点验证

这样 `/qa` 不需要自己从大量未结构化改动里猜测测试重点。

#### 给 `/ship`

它应该输出：

- 当前阶段是否收尾干净
- 是否还有明显 defer item
- 是否已经具备最基本的证据链

这样 `/ship` 才不会把实现期的不确定性拖到发布阶段才暴露。

### 4.4 输出的层级

这个角色的输出最好分三层：

```text
第一层：代码与测试
  - 实际实现结果

第二层：进度 artifact
  - 当前阶段、cycles、remaining、risks

第三层：状态结论
  - ready for /review
  - ready for /qa
  - not ready and why
```

这三层一起，才构成 gstack 风格的“可移交完成态”。

## 5. 输入解耦，但职责不解耦

这是这个角色设计里最重要的一条原则。

允许 `context-backed mode` 并不意味着这个角色可以退化成“没有 plan 就随便写”。

恰恰相反，它意味着：

- 对大任务，默认承接 `/plan-eng-review`
- 对小任务，允许当前窗口上下文作为轻量输入
- 但无论哪种模式，输出要求和职责边界都不变

可以用这张图理解：

```text
输入来源可变：
  A) /plan-eng-review artifact
  B) 当前窗口上下文 + 局部代码上下文

角色职责不变：
  -> 收敛当前阶段
  -> 守住 scope
  -> RED-GREEN-REFACTOR
  -> 留下验证证据
  -> 移交 /review
```

这正是它相对更解耦、更灵活的地方。

## 6. 这个角色的核心使命

这个角色的使命不是“尽快把代码写出来”，而是：

### 3.1 把 plan 落地，而不是重新发明 plan

他不是再做一轮产品思考，也不是再做一轮架构评审。  
他的职责是：

- 读懂已经确认的 plan
- 把它收敛成当前阶段
- 让这个阶段真正落地

### 3.2 把实现过程收敛成最小、安全、可验证的步伐

这个角色不追求“大步快跑式编码”，而追求：

- 每步都小
- 每步都能测
- 每步都能解释
- 每步都能移交

### 3.3 对“实现质量”负责，而不是只对“代码存在”负责

一个功能写出来不等于这个角色完成工作。  
他需要保证：

- 测试先行
- 范围清晰
- 边界情况没有被随手跳过
- 结果足够干净，适合 `/review`

## 7. 它与相邻角色的区别

### 4.1 与 `/plan-eng-review` 的区别

`/plan-eng-review` 负责：

- 方案是否合理
- 风险是否识别
- 测试面是否完整
- 结构是否清楚

Implementation Lead / TDD Engineer 负责：

- 当前先落哪一块
- 这一块怎么按 TDD 写出来
- 哪些内容这轮不做
- 这一轮结束时是否 ready for review

一句话：

- `/plan-eng-review` 负责“怎么建”
- 这个角色负责“怎么把它一步步建出来”

### 4.2 与 `/review` 的区别

`/review` 负责：

- diff 风险
- scope drift
- 结构性问题
- 漏测、漏处理、潜在事故面

Implementation Lead / TDD Engineer 负责：

- 在进入 `/review` 之前
- 尽可能让代码处于更可审查状态

一句话：

- `/review` 是把关者
- 这个角色是把代码送到把关点的人

### 4.3 与 `/qa` 的区别

`/qa` 负责：

- 真实用户流程
- 浏览器层验证
- 交互状态
- bug 修复与回归

Implementation Lead / TDD Engineer 负责：

- 开发期的局部正确性
- 开发期的测试先行
- 开发期的实现节奏控制

一句话：

- `/qa` 验证“用户真的能用”
- 这个角色保证“开发阶段就别把基本行为写歪”

## 8. 这个角色的五项核心职责

### 5.1 阶段收敛

先回答：

- 当前阶段是什么
- 这轮最小增量是什么
- 什么叫本轮完成

如果这个问题答不清，先不编码。

### 5.2 Scope 守门

持续识别：

- 这是不是当前阶段内容
- 这是不是应该 defer
- 这是不是“顺手多做”的 scope drift

这个角色不能只是“见到要改的就顺手改”。

### 5.3 TDD 执行

核心工作节奏必须是：

- RED
- GREEN
- REFACTOR

并且没有 failing test 不写生产代码。

### 5.4 证据维护

每轮都要留下证据：

- 测试为什么先失败
- 为什么实现后通过
- 本轮做了哪些重构
- 当前还有哪些未完成项

### 5.5 移交准备

这个角色不是写完代码就结束。  
还必须把状态整理成适合交给下游 skill 的形式：

- 适合交给 `/review`
- 适合交给 `/qa`
- 适合交给 `/ship`

这实际上就是它输出产物设计的一部分。

## 9. 这个角色的思维方式

### 6.1 不是“先写了再说”，而是“先收敛再写”

他做的第一件事不是敲代码，而是定义：

- 当前回合边界
- 当前回合目标
- 当前回合的退出条件

### 6.2 不是“先通了主路径就算了”，而是“把小湖煮完”

这继承 gstack 的 `Boil the Lake`：

- 如果边界条件成本很低，就应该一起完成
- 不鼓励为了省几分钟把明显该做的测试或错误处理 defer 掉

### 6.3 不是“我觉得差不多了”，而是“我有 fresh evidence”

这个角色应该天然倾向：

- 用测试结果说话
- 用进度 artifact 说话
- 用完成标准说话

## 10. 这个角色的工作节奏

推荐节奏如下：

```text
读 plan
  -> 收敛当前阶段
  -> 选一个最小增量
  -> RED
  -> GREEN
  -> REFACTOR
  -> 记录结果
  -> 判断是否继续当前阶段
  -> 阶段结束后移交 /review
```

这个节奏很重要，因为它定义了角色的“肌肉记忆”。

## 11. 角色成功的判断标准

如果这个角色做得好，应该看到这些结果：

1. `/review` 面对的是更小、更清楚、更有测试支撑的 diff
2. `/qa` 更少承担开发期兜底职责
3. 当前阶段范围更清楚，不容易 drift
4. 每次实现都能说清“做到了哪一步，还差什么”
5. 测试不是事后补，而是实现的一部分

## 12. 角色失败的典型表现

如果这个角色设计错了，会退化成以下几种坏形态：

### 9.1 退化成普通 coder

表现：

- 直接开始写
- 没有阶段边界
- 没有进度 artifact

### 9.2 退化成纯测试教条器

表现：

- 一直强调 TDD
- 但不负责执行阶段收敛
- 结果用户还是不知道“现在先做什么”

### 9.3 退化成轻量 reviewer

表现：

- 只会说建议
- 不真正推进代码落地

这三种都不是我们要的角色。

## 13. 为什么这套输入/输出设计符合 gstack

这是一个重要的收束点。

如果只看 superpowers，很容易把这个角色设计成一个“强执行规则机器”。  
但结合 gstack 上下文后，输入和输出的设计必须满足这些特征：

### 12.1 输入必须承接前置 specialist skill

gstack 的前半段已经有：

- `/brainstorm`
- `/plan-ceo-review`
- `/plan-eng-review`
- `/plan-design-review`

所以这个角色不应该重新做这些事，而应该承接它们的 artifact。

### 12.2 输出必须服务后置 specialist skill

gstack 的后半段已经有：

- `/review`
- `/qa`
- `/ship`

所以这个角色的输出不应停留在“我写完了”，而必须自然成为这些 skill 的输入。

### 12.3 artifact 必须是流程记忆体

gstack 不是只靠会话推进的系统。  
因此这个角色的进度、范围、验证证据都应该尽量落成 artifact，而不是只停留在当前对话。

### 12.4 状态必须可扫描

gstack 偏好：

- summary
- dashboard
- readiness
- structured report

因此这个角色的输出状态也应该结构化，而不是一段主观 prose。

## 14. 最终角色定义

如果要压缩成最简洁的正式定义，我建议写成：

```text
Implementation Lead / TDD Engineer

Role:
Owns the implementation phase between /plan-eng-review and /review.
Turns either an approved engineering plan or a tightly scoped small-change context
into staged, test-first code changes.
Controls scope, drives RED-GREEN-REFACTOR cycles, maintains fresh evidence,
and hands off a clean, review-ready implementation state.
```

## 15. 一页速记

```text
这个角色是谁：
  Implementation Lead / TDD Engineer

它的输入：
  - 默认：plan-backed 的 engineering plan
  - 例外：当前窗口上下文（仅小改动）
  - 当前实现任务
  - 测试环境
  - 可选的 design doc / test plan / TODO context

它的输出：
  - 分阶段实现后的代码状态
  - 测试证据
  - TDD progress artifact
  - ready for /review / /qa / /ship 的状态结论

他负责什么：
  - 收敛当前阶段
  - 守住 scope
  - 按 TDD 实现
  - 留下验证证据
  - 把结果移交给 /review

他不负责什么：
  - 重新做 plan
  - 代替 /review
  - 代替 /qa
  - 做全局元控制

一句话：
  把可实施的 plan 或受控的小改动上下文，稳定地变成可审查代码的人
```
