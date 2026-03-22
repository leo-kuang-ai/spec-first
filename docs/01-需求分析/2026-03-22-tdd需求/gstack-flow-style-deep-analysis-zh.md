# gstack 流程风格深度分析

本文的目标不是重复列举 gstack 有哪些 skill，而是回答一个更关键的问题：

**gstack 到底是一种什么风格的工作流系统？**

只有把这个问题想清楚，后续新增 `/implement-tdd` 这样的实现阶段 skill，才不会把 gstack 变成另一个项目的拷贝。

## 1. 一句话定义

gstack 不是一个纯粹的 process engine，也不是一个普通的 prompt 集合。

更准确地说，它是一套：

**以 specialist skill 为骨架、以完整交付为目标、以“Boil the Lake”为默认价值观的 AI 工程工作流。**

可以用下面这张图理解：

```text
                    gstack
                      |
   +------------------+------------------+------------------+
   |                  |                  |                  |
产品/设计专家层       工程评审层         质量与交付层       通用运行时约束
   |                  |                  |                  |
/brainstorm         /plan-eng-review   /review            AskUserQuestion
/plan-ceo-review      /plan-design...    /qa                Boil the Lake
/design-consultation                      /ship              Search Before Building
                                          /document-release  telemetry / review-log
                                          /retro             contributor feedback
```

它的重心不是“强制 agent 永远走某条硬流程”，而是：

- 在关键阶段调用最合适的专家 skill
- 每个专家 skill 带着统一的工作价值观
- 最终形成从思考到交付的完整闭环

## 2. gstack 的核心风格不是“元控制”，而是“专家协作”

这是 gstack 和 superpowers 最大的气质差异。

### gstack 更像 specialist system

它把开发流程拆成一组专家角色：

- `/brainstorm`
- `/plan-ceo-review`
- `/plan-eng-review`
- `/plan-design-review`
- `/review`
- `/qa`
- `/ship`
- `/document-release`
- `/retro`

这些 skill 的共同点是：

- 每个 skill 都有鲜明的角色定位
- 每个 skill 都解决一个高价值阶段问题
- 每个 skill 都产出清晰 artifact 或结论

所以 gstack 的主观感受更像：

```text
找对专家
  -> 让专家把这一段事情做完整
  -> 再交给下一个专家
```

### gstack 不像 superpowers 那样以元技能为中心

superpowers 的核心在 `using-superpowers`，而 gstack 没有一个同层级的“总控元技能”。

这意味着：

- gstack 更温和
- 更强调阶段性专家判断
- 更适合融入现有开发习惯

但也意味着：

- 执行期纪律更容易出现空白
- 某些流程没有被显式技能化

## 3. gstack 的统一底层价值观

虽然 gstack 没有 superpowers 那种强元控制层，但它其实有一套非常统一的底层运行哲学。

### 3.1 Boil the Lake

这是 gstack 最核心的价值观之一。

意思不是盲目做大，而是：

- 当 AI 让边际成本接近于零时
- 默认做完整版本，而不是做半截版本

这个价值观在多个 skill 中反复出现，并且不是一句口号，而是落到操作层：

- option recommendation 默认偏完整方案
- 估算必须同时给 human 和 CC+gstack 两种工时
- 对“先跳过测试”“先不处理边界情况”“后面再补文档”这种 shortcut 持怀疑态度

这让 gstack 的整体风格变成：

```text
不是先问“怎么省工作”
而是先问“完整做对这件事会多花多少”
```

### 3.2 Search Before Building

这是第二条统一风格。

gstack 不是那种鼓励 agent 直接发明新方案的系统。  
它更偏向：

- 先查运行时有没有内建
- 先查框架有没有标准解
- 再决定要不要自定义

这会带来两个后果：

- 风格更“boring by default”
- 推荐的方案更容易落在成熟路径上

### 3.3 Evidence over vibes

这一点在 `/review`、`/qa`、`/plan-eng-review` 里非常明显。

gstack 倾向于：

- 用 diff、日志、dashboard、artifact 说话
- 用 test plan、review log、readiness dashboard 维持跨阶段状态

也就是说，它不是只靠会话记忆推进，而是会把关键状态落成可读 artifact。

## 4. gstack 的交互风格：统一、结构化、强建议

几乎所有核心 skill 都共享相同的 `AskUserQuestion` 结构：

1. Re-ground
2. Simplify
3. Recommend
4. Options

这说明 gstack 的交互设计不是 skill 局部习惯，而是一个横切系统。

### 4.1 Re-ground

每次提问都要先重新锚定：

- 当前项目
- 当前分支
- 当前任务

这使 gstack 很强调“上下文复位”，避免在长会话里漂移。

### 4.2 Simplify

解释必须面向“20 分钟没看代码的人也能听懂”。

这带来一种非常强的产品经理/工程经理式语言风格：

- 不堆内部术语
- 不默认用户正在看源码
- 不拿实现细节当说明本身

### 4.3 Recommend

gstack 不是中立选项生成器。  
它会明确推荐，并且通常推荐完整方案。

这种风格意味着：

- gstack 很适合拿来做阶段决策
- 不适合那种完全无倾向的“选项堆砌式” agent

### 4.4 Options

选项被设计成短、小、快判断，常常附带：

- Completeness score
- human 工时
- CC+gstack 工时

这使它天然有一种“工程经理做 tradeoff”的味道。

## 5. gstack 的 artifact 风格：不是只有对话，还有持久化状态

这是理解 gstack 非常关键的一点。

它不只是“在这次对话里给建议”，而是很重视可持续 artifact。

典型 artifact 包括：

- design doc
- plan file
- test plan
- review log
- review readiness dashboard
- plan file review report
- QA report
- contributor logs

可以把它理解成：

```text
会话只是工作界面
artifact 才是流程记忆体
```

这和很多只靠当前上下文推进的 skill 系统很不一样。

## 6. gstack 的阶段性风格

虽然没有 superpowers 那种全局状态机，gstack 仍然表现出很强的阶段感。

### 6.1 前段：思考与定方向

代表 skill：

- `/brainstorm`
- `/plan-ceo-review`
- `/plan-eng-review`
- `/plan-design-review`

这一段的特点：

- 强调把问题想清楚
- 强调 scope challenge
- 强调 alternatives
- 强调图示和结构化审视

### 6.2 中段：实现期是弱区

这是 gstack 当前最明显的结构性空白。

现有流程更像：

```text
plan-review 很强
  -> 默认直接编码
  -> review / qa 很强
```

缺的是：

- 谁来负责按计划推进
- 谁来负责把实现方法论技能化

这正是后续要由 `/implement-tdd` 补上的位置。  
在当前终版方案里，原先设想的 `/execute-plan` 职责已经合并进 `/implement-tdd`。

### 6.3 后段：质量与交付很强

代表 skill：

- `/review`
- `/qa`
- `/ship`
- `/document-release`
- `/retro`

这一段的特点：

- 有清晰的 gating 感
- 有强 artifact 感
- 有明确的 ship-readiness 语义

这说明 gstack 不是一个只会“帮你写代码”的系统，而是一个对交付闭环非常上心的系统。

## 7. gstack 的审查风格：Fix-First，而不是只读点评

这是 gstack 非常有辨识度的地方。

以 `/review` 为例，它不是传统意义上的只读 reviewer。  
它会做：

- AUTO-FIX
- ASK
- Fix-First review

这说明 gstack 的审查风格是：

```text
不是“我发现问题，你自己回去改”
而是“能直接修的先修，值得讨论的再问”
```

这是一种很强的 agent-native workflow 风格。

它有几个重要含义：

- skill 不是旁观者
- skill 是带执行能力的专家
- review 不只是评价，也是推进工作的一环

这个特征对新增 skill 很重要。  
如果新增 `/implement-tdd`，它也应该延续这种：

- 不只是提出建议
- 而是推动实现向前走

## 8. gstack 的报告风格：Dashboard 化，而不是纯 prose

gstack 明显偏爱这些表达方式：

- summary blocks
- readiness dashboard
- health score
- completion summary
- report sections

这代表它对“工作状态可视化”很重视。

相比只输出一段 prose，gstack 更偏向：

```text
让不同阶段的状态可扫描、可比较、可累计
```

所以后续设计新 skill 时，也应该优先考虑：

- 结构化 summary
- readiness / progress 风格输出
- 可被其他 skill 继续消费的 artifact

## 9. gstack 的新增 skill 应该遵守什么风格

如果基于前面的分析，后续新增 skill，应该遵守以下规则。

### 9.1 必须是 specialist-style，不要变成全局元控制器

也就是说：

- 不要先引入一个等价于 `using-superpowers` 的硬注入总控
- 优先新增高价值阶段性专家 skill

### 9.2 必须继承统一 AskUserQuestion 风格

新增 skill 不应该发明另一套交互协议。  
它应该继续使用：

- Re-ground
- Simplify
- Recommend
- Options

### 9.3 必须继承 Boil the Lake

新增 skill 的默认立场应该是：

- 倾向完整实现
- 倾向完整测试
- 倾向完整错误处理

而不是“先给一个省事版”。

### 9.4 必须产出 artifact

新增 skill 不应该只在对话里完成。  
它最好产出：

- 可复用的计划文件
- 可供下游消费的状态文件
- summary / dashboard / log

### 9.5 必须服务交付闭环

新增 skill 不应成为独立宇宙。  
它要自然接上：

- `/review`
- `/qa`
- `/ship`

## 10. 对 `/implement-tdd` 的风格约束

基于 gstack 的风格，后续这个 skill 不能做成 superpowers 的原样复制。

### `/implement-tdd` 应该像什么

它应该像：

- 一个实现阶段专家
- 带 TDD 方法约束
- 但仍然保持 gstack 的专家风格和 artifact 风格

它不应该像：

- 一个会话级总控
- 一个脱离 gstack 其他 skill 的纯编程教条器

需要说明的是，原先设想中 `/execute-plan` 的职责已经并入 `/implement-tdd`。

也就是说，`/implement-tdd` 内部仍然要承担这些 execution-planning 工作：

- 把 engineering plan 或小改动上下文转成当前执行节奏
- 管理当前步骤、完成标准、偏离检查、移交点

但这些职责不再以独立 skill 的形式存在。

## 11. 一句话结论

如果只总结一句：

**gstack 的灵魂不是“强制一切按流程走”，而是“让对的专家在对的阶段，把完整的事情做完，并把结果留下来”。**

这也是后续所有融合设计必须尊重的风格边界。

## 12. 一页速记

```text
gstack 的风格：

1. specialist skill，不是元控制器
2. Boil the Lake，默认偏完整方案
3. AskUserQuestion 统一结构化
4. artifact-heavy，不只靠对话记忆
5. review/qa/ship 闭环很强
6. 中段实现层偏弱，是当前主要缺口

因此新增 skill 的正确方向：

- 继续做 specialist-style skill
- 继承统一问答风格
- 继承完整性交付价值观
- 产出可复用 artifact
- 自然衔接 review / qa / ship
```
