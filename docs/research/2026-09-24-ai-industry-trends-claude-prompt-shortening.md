# AI 业界趋势、Claude 官方提示词方法与 Prompt 大幅缩减原因

> 调研日期：2026-09-24
> 结论范围：基于 Anthropic 官方公开文章与 Claude Code 官方文档，结合当前 AI Agent 工程实践整理。
> 证据边界：本文讨论官方公开的 Prompt、Context Engineering 和 Claude Code 使用方法；本次未对具体版本的系统提示词做前后长度对比，不能确认某次缩减的幅度及直接原因。

## 结论

AI 行业正在从“写更长、更细的 Prompt”转向“用最少的高信号指令，配合工具、检索、记忆、上下文管理和评测”。

Prompt 变短，不代表约束变少，而是职责发生了迁移：

- 模型已经掌握的通用行为，不再重复写进 Prompt。
- 低频知识从常驻上下文移到 Skill、检索、文件和外部记忆。
- 确定性规则从 Prompt 移到代码、hooks、权限系统、schema 和测试。
- 长任务通过压缩、结构化笔记、子 Agent 和 just-in-time retrieval 管理上下文。
- Prompt 主要保留目标、边界、项目特有事实、风险和验收要求。

可以概括为：

> 常驻上下文尽量小，任务相关上下文足够完整；确定性规则交给程序，语义判断交给模型。

## 一、AI 业界发展趋势

### 1. Prompt Engineering 正在演化为 Context Engineering

Anthropic 将 Context Engineering 描述为 Prompt Engineering 的自然延伸。

Prompt Engineering 主要关注如何写指令；Context Engineering 关注每次模型推理时究竟提供哪些信息，包括：

- system prompt
- 用户目标
- 工具定义
- 文件和检索结果
- 历史消息
- 外部数据
- 记忆
- 当前任务状态

工程目标不是让上下文越多越好，而是找到能够最大化目标行为概率的最小高信号上下文集合。

### 2. 从单轮问答转向 Agent

生产系统越来越多采用“模型在工具环境中循环”的模式：

```text
理解任务 → 规划 → 调用工具 → 获取环境反馈 → 修正 → 验证
```

MCP、代码执行、浏览器、数据库、文件系统和子 Agent，逐渐成为模型能力的外部组成部分。

Anthropic 对 Agent 的定义强调：

- 模型可以自主决定下一步行动。
- 工具调用结果提供环境中的 ground truth。
- 任务需要停止条件、权限边界和错误恢复。
- Agent 的收益来自灵活性，但代价是延迟、成本和错误累积。

### 3. 长上下文不等于无限上下文

Anthropic 提醒存在 **context rot**：上下文越长，模型对信息的精确召回和远距离推理可能下降。

因此，长任务开始使用：

- 上下文压缩
- 只保留高价值历史
- just-in-time retrieval
- 外部记忆
- 结构化笔记
- 子 Agent 分担调查
- 工具结果清理

### 4. 从全量注入转向渐进披露

系统不再把所有规则、文档和案例一次性放进 system prompt，而是采用分层加载：

```text
核心规则常驻
→ 任务匹配时加载 Skill
→ 需要时读取文件和文档
→ 通过工具获取实时事实
→ 将关键状态写入外部记忆
```

这可以降低上下文污染，也能减少规则过期带来的维护成本。

### 5. 从 Prompt 技巧转向可测量工程

行业越来越重视以下指标：

- 任务成功率
- 工具调用准确率
- 失败恢复率
- 真实环境验证结果
- 延迟
- token 成本
- 回归稳定性
- 人工返工量

Prompt 看起来专业、规则数量很多、上下文窗口很大，都不能单独证明系统有效。

## 二、Claude 官方公开的 Prompt 方法

### 1. 使用直接、清楚、适当粒度的语言

Anthropic 建议系统提示词处在合适的“高度”：

- 过低：把复杂 if/else 逻辑硬编码进 Prompt，脆弱且难维护。
- 过高：只给模糊目标，模型缺少可执行信号。
- 合适：足够具体，能约束目标行为；足够灵活，允许模型根据环境判断。

### 2. 对上下文分段

官方建议用 Markdown 标题或 XML 标签区分不同信息，例如：

```text
<background_information>
...
</background_information>

<instructions>
...
</instructions>

## Tool guidance
...

## Output description
...
```

格式本身不是目的，目的是让背景、指令、工具和输出要求容易识别。

### 3. 先从最小 Prompt 开始，再根据失败补充

推荐流程：

1. 用最小 Prompt 在能力最强的模型上建立基线。
2. 观察具体失败模式。
3. 只针对真实失败增加规则或例子。
4. 重新评测。
5. 删除不再产生收益的内容。

### 4. 用少量典型例子替代边界清单

Anthropic 继续推荐 few-shot prompting，但不建议把所有边界情况都写成规则清单。

更有效的做法是选择少量、多样、具有代表性的 canonical examples。对模型而言，好的例子往往比大量抽象规定更有信息量。

### 5. 工具要少而清楚

工具定义了 Agent 的行动空间。官方建议：

- 工具职责单一。
- 名称、参数和返回值明确。
- 工具之间尽量减少重叠。
- 返回结果尽量节省 token。
- 错误信息应便于模型恢复。
- 人类工程师如果无法判断该用哪个工具，模型通常也无法稳定判断。

### 6. CLAUDE.md 应该短而稳定

Claude Code 官方建议，`CLAUDE.md` 只放模型无法可靠从代码推断、且会影响行为的项目知识。

适合放入：

- 模型猜不到的 Bash 命令
- 与默认习惯不同的代码规范
- 测试命令和测试约定
- 项目特有的架构决策
- 环境变量和开发环境限制
- 非显然的常见坑
- 仓库协作约定

不适合放入：

- 通用编程常识
- 模型读代码即可推断的内容
- 大段教程
- 文件逐项说明
- 经常变化的资料
- “写干净代码”之类空泛要求

官方给出的实用判断是：

> 每一行都问自己：删除它会不会导致 Claude 犯错？如果不会，就删掉。

### 7. 将低频知识放入 Skills

只在特定任务需要的知识，不应全部放进每次会话都会加载的 `CLAUDE.md`，而应放入 Skills，在相关任务触发时加载。

这就是“常驻核心规则 + 按需专业知识”的分层设计。

### 8. 将确定性行为交给 Hooks 和权限机制

Claude Code 官方区分了两类机制：

- `CLAUDE.md`：给模型的建议性指导。
- Hooks：自动执行的确定性脚本，可以保证某个动作发生或阻止某种操作。

例如：

- 每次编辑后自动运行 lint。
- 禁止写入 migrations 目录。
- 对特定命令使用权限 allowlist。
- 使用 sandbox 限制文件和网络访问。

## 三、Prompt 为什么会大幅缩短

### 原因 1：模型能力提高

过去需要在 Prompt 中逐步解释：

```text
先分析问题，再查看文件，再制定计划，再修改代码，最后运行测试……
```

现在模型通常已经掌握常见的工程流程，Prompt 可以更直接：

```text
修复这个问题，先检查相关代码并运行必要测试。
```

Prompt 从“教模型怎么做所有事情”变成“定义目标、边界和验收条件”。

### 原因 2：过度规定会造成注意力竞争

长 Prompt 往往包含：

- 重复规则
- 互相冲突的要求
- 历史遗留流程
- 低优先级细节
- 过多例外
- 与当前任务无关的背景

这些内容会消耗有限的注意力预算，让真正重要的要求更容易被忽略。

### 原因 3：复杂逻辑移到程序

过去可能把下面的流程都写进 Prompt：

```text
如果修改 A，就检查 B；
如果测试失败，就执行 C；
如果风险高，就询问用户；
如果目录变化，就同步 D。
```

现在更适合由以下机制承担：

- hooks
- CI
- schema validation
- permission rules
- workflow scripts
- test runner
- tool return values

Prompt 负责语义判断，程序负责确定性约束。

### 原因 4：知识按需加载

低频资料不需要每轮都注入。通过文件引用、检索、Skill、MCP 和工具调用，模型可以在需要时取得信息。

这比把整个知识库常驻在上下文里更节省 token，也更容易保持新鲜度。

### 原因 5：长任务需要动态管理状态

Agent 执行几十分钟或数小时后，固定 Prompt 的相对作用会下降。更重要的是：

- 当前目标
- 已完成事项
- 未解决问题
- 最近修改的文件
- 测试结果
- 下一步动作
- 停止条件

因此，现代 Agent 系统更依赖压缩、笔记、外部状态和工具，而不是继续加长 system prompt。

### 原因 6：成本、延迟和缓存

每次请求都携带很长的常驻 Prompt，会增加：

- 输入 token 成本
- 首 token 延迟
- 上下文缓存压力
- 长会话污染
- 版本维护成本

生产系统因此倾向于保留短而稳定的核心指令，把低频信息移到外部资源。

## 四、好的缩减与坏的缩减

### 好的缩减

- 删除模型本来就知道的通用内容。
- 删除重复、冲突和过时规则。
- 将低频知识移到 Skill 或检索。
- 将确定性要求移到代码、hooks 和测试。
- 保留目标、边界、风险、权限和验收标准。
- 用少量高质量例子替代冗长规则清单。

### 坏的缩减

- 删除任务边界。
- 删除禁止事项。
- 删除真实验证要求。
- 删除权限和副作用约束。
- 删除项目特有的架构事实。
- 只剩下“请完成任务”这种空指令。

判断标准不是字数，而是：

> 是否仍然保留完成任务所需的最小充分信息。

## 五、推荐的 Claude 项目级 Prompt 结构

```markdown
# Role

你在这个项目中负责……

# Goal

本次任务要达到……

# Boundaries

不要修改……
不要假设……
涉及外部写入前……

# Project-specific facts

只有模型无法从代码推断的关键事实……

# Verification

完成前运行……
结果必须说明……

# References

相关规则和资料位于……
```

其中：

- `Role` 定义职责。
- `Goal` 定义结果。
- `Boundaries` 定义范围、权限和禁止事项。
- `Project-specific facts` 只放代码中不可直接推断的事实。
- `Verification` 定义完成声明的证据要求。
- `References` 指向按需加载的资料。

## 六、对现有 AI Coding Harness 的启示

如果一个系统的 Prompt 很大，优先检查的不是“还能不能再删”，而是每段内容的 owner：

| 内容 | 更适合的承载位置 |
| --- | --- |
| 项目使命与不可变边界 | 常驻契约 |
| 当前任务目标 | 用户任务 / Spec |
| 低频领域知识 | Skill / 文档 / 检索 |
| 文件和代码事实 | 工具读取 / just-in-time context |
| 确定性检查 | Script / Hook / Test |
| 权限和危险动作 | Permission / Sandbox |
| 长任务进度 | 外部状态 / 结构化笔记 |
| 语义方案和取舍 | LLM / Human |
| 完成声明 | Verification evidence |

最重要的原则是：

> Prompt 变短后，不能把丢失的约束伪装成模型“应该自己知道”。被删除的内容必须有明确的替代承载机制，或者经过评测证明它确实不会改变行为。

## 参考资料

1. Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
2. Anthropic, [Building effective agents](https://www.anthropic.com/research/building-effective-agents)
3. Claude Code, [Best practices](https://code.claude.com/docs/en/best-practices)
4. Anthropic, [Prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)


## 证据限制

- 本文使用 Anthropic 官方公开资料；官方文档页面部分内容会随产品版本更新。
- 本次未核验完整产品指令栈；公开提示词片段不能代表工具定义、动态注入和全部运行时指令。
- 参考资料 1—3 已读取正文；资料 4 仅保留官方入口，本次抓取只返回 Cookie 提示，不作为正文结论证据。
- 趋势分析以 Anthropic 的 Agent 工程资料为主，不代表对整个 AI 行业的完整调查。模型能力提升、成本与延迟是机制解释；具体缩减收益仍需实测，缓存和检索开销可能改变结果。
- “Prompt 变短后效果更好”需要按具体任务、模型版本和上下文配置进行实测，本文给出的是官方方法与行业趋势，不是所有任务的普遍性能定律。

