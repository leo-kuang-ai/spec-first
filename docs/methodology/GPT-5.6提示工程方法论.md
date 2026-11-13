# GPT-5.6 提示工程方法论

> 将 prompt 从“替模型逐步安排行为”的脚本，改造成“定义结果、边界、证据与完成线”的短任务契约。

## 文档定位

本文将 OpenAI GPT-5.6 的官方 prompting / upgrade 指南转写为可直接采用的方法论和模板，适用于基于 API 构建的助手、agent、检索工作流和 coding workflow。官方指南明确把 agent instructions、工具描述和 prompt stack 纳入适配范围；`SKILL.md` 属于这一范围，但只是整个 prompt stack 的一个 source surface。

- **外部依据：**本文记录的是 2026-07-17 读取的 OpenAI 开发者文档，不是对模型行为的永久保证；版本、可用性、参数和定价以官方当前文档为准。
- **项目边界：**本文是外部 provider 的提示设计 companion，不取代 `结构化项目角色契约.md`、`skill-prompt-设计与优化方法论-v2.md` 或当前 `skills/` 的 source contract。项目治理、source/runtime 边界和完成声明仍以这些上位来源为准。
- **不作的推论：**“提示更短”不等于“更好”；更低 token、调用次数或延迟也不自动等于成功。只有在代表性任务上仍满足结果、证据与验证要求的减少，才是可采纳的改进。

## 一句话结论

GPT-5.6 的核心思路是：提示词要更短，但必须把**用户可见结果、重要约束和完成标准**说清楚。不要用冗长步骤替模型安排思考过程；应保留模型在授权边界内选择检索、推理和工具路径的空间。

当前 `gpt-5.6` 别名指向旗舰 `gpt-5.6-sol`。生产环境若需稳定追踪目标模型，优先显式使用 `gpt-5.6-sol`；若使用别名，应在验证时记录实际返回的 `response.model`，不要假设别名与显式 slug 在监控、限流、分析或计费中完全等价。

## 1. 把 prompt 视为“可执行任务契约”

一个有效 prompt 的职责不是复述模型该如何思考，而是回答下列问题：

| 契约区段 | 要说明什么 | 为什么重要 |
| --- | --- | --- |
| 目标 | 为谁完成什么用户可见结果 | 防止模型只完成中间步骤或形式化输出 |
| 成功标准 | 结束前哪些条件必须满足 | 将“高质量”转化为可验收结果 |
| 约束与授权 | 安全、业务、权限、事实和副作用边界 | 让安全的范围内工作持续推进，同时拦住越权 |
| 工具与证据 | 必须先查什么，何时调用工具，结果不足时如何回退 | 防止跳过必要检索、用空结果猜测或无关调用 |
| 输出 | 必须保留的字段、证据、风险、结构和语气 | 让短答案不会丢掉任务关键内容 |
| 停止与验证 | 何时结束、何时追问、如何验证 | 防止为了少循环而牺牲正确性或证据 |

这是一份**结果导向的契约**：人定义价值、不可跨越的边界和验收线；模型在这些约束内选择合适路径；工具准备可回源事实；验证决定最终 claim 的上限。没有明确证据的输出，不因语气自信、调用过工具或模型声称“已完成”而变成已验证结果。

## 2. 八条可直接采用的最佳实践

### 2.1 结果优先，少规定过程

写清用户可见的目标、成功条件、限制与输出格式，让模型自行选择检索、推理和工具路径。模型已经能够稳定完成的过程性脚手架，通常不应占据系统 prompt。

```text
目标：解决客户问题并完成范围内允许的操作。

成功标准：
- 基于政策和账户证据作出资格判断；
- 在授权范围内完成允许的动作；
- 返回 completed_actions、customer_message 与 blockers；
- 如缺少关键证据，只追问最小缺失字段。
```

不要把“先列计划、再逐步思考、再检查三遍”当作默认要求。只有当过程本身是用户、合规或验证的明确需求时，才把它写入契约。

### 2.2 每条规则只说一次

从已经有效的 prompt 和工具集起步，删除以下内容：

- 重复表达的同一规则；
- 不改变行为的风格或过程要求；
- 不改变行为的示例；
- 模型已稳定完成的过程指令；
- 与当前任务无关的工具及其工具描述。

保留真正会改变行为的内容：用户可见结果、成功标准、停止条件、安全/业务/证据/权限限制、依赖上下文的工具路由、必需输出形状和验证要求。还要主动检查剩余指令是否互相矛盾；GPT-5 系列会认真遵循契约，冲突规则往往比缺少细节更不稳定。

官方内部 coding-agent 评测样本显示，更精简的 system prompt 同时提升评测分数并减少 token 与成本；这些百分比只能作为方向性信号，不能外推为本项目收益。正确做法是：每次删一组内容，使用同一批代表性样本复测。

### 2.3 用决策规则代替绝对命令

`必须`、`绝不`、`only` 应只用于真正不可违反的安全规则、必填字段或禁止动作。检索、追问、继续迭代等需要语义判断的工作，应写成条件和优先级。

```text
缺少完成任务所必需的字段时，只追问最小缺失信息。

每次得到工具结果后，判断核心请求是否已具备足够证据：
- 已具备：直接回答；
- 仍缺关键事实：指出缺口并使用最小有效回退；
- 不要仅为了改善措辞或补充非关键细节继续检索。
```

避免把隐含决策硬编码成万能默认值、关键词映射或语义捷径。用户给出了显式值时应保留；正确值只能从上下文推断时，应给出决策标准而不是虚构一个通用默认值。

### 2.4 明确自主与审批边界

为多步骤任务给出一段简短、集中的权限策略：

| 可直接推进 | 必须确认 |
| --- | --- |
| 读取范围内文件、检查日志、编辑范围内代码、执行无破坏性的相关验证 | 外部写入、破坏性操作、采购或成本消费、明显扩大任务范围 |

“回答、解释、审查、诊断、规划”并不自动授权实现修改。反过来，用户已经要求“改、建、修”时，安全且范围内的本地实现和非破坏性验证应能连续推进。反复散落地写“先问我”“不要修改”“等待批准”会诱发不必要的卡住；把它们集中为一次明确的授权契约。

长任务还应声明当前工作层：研究、设计、实现、审查或外部协调。这样能避免模型从研究悄悄越过边界进入实施或外部动作。

### 2.5 精确控制输出，而不是只写“简短”

GPT-5.6 默认往往比旧模型更简洁，因此迁移时应重新检查“Be concise / Keep it short”是否仍有价值；它们有时会让答案短到遗漏必要内容。

优先用 `text.verbosity` 设定默认详略（`low`、`medium`、`high`），再用 prompt 规定本任务必须保留什么、可以优先删什么：

```text
先给结论。保留支持结论所需证据、重要 caveat 与下一步。
先删除开场白、重复、泛泛安慰和可选背景；不得删除必需事实、决定、风险或下一步。
```

人格决定语气、温度、直接性和正式程度；协作风格决定何时提问、何时假设、何时主动推进、如何说明不确定性。两者都应短小，且绝不能替代目标、成功标准、工具规则和停止条件。避免无条件规定“始终使用用户语言”“始终友好”等泛化语句，除非它们确实是产品契约；应改为说明目标语言和切换条件、直说结论的程度、何时承认具体问题、是否需要安抚或结尾。

### 2.6 工具路由要具体

只暴露当前任务相关的工具。每项工具描述至少说明：它做什么、何时使用、关键返回字段/类型、错误时的行为。

- 正确性依赖发现、检索或验证时，将其写为行动前置条件；不要因为目标状态看似明显而跳过。
- 互不依赖的读取可以并行；一个结果会决定下一动作时保持串行；并行读取后先综合再行动。
- 空结果、残缺结果或异常狭窄的结果，不应直接得出“没有”；至少尝试一到两种有意义的回退路径。

**Programmatic Tool Calling（PTC）不是“调用多就该用”。**它适合边界明确、可用代码确定性归约的大量中间结果，例如过滤、连接、排序、去重、聚合、批处理和重复验证。它不适合单次调用、小型中间结果、每步都会改变下一决策、需要批准、必须保留原生 artifact/引用，或需要语义判断的工作。

若使用 PTC，必须写清：限定在哪个阶段、能调用哪些工具、输出 schema、并发/重试/停止上限，以及何处交回直接模型调用。语义判断、审批、引用与最终验证应留在直接调用路径；同时测试 `program_output` 和最终 assistant message，程序算对中间数据并不保证最终文本没有漏字段、证据或 caveat。

### 2.7 给出停止条件与验证要求

停止条件的目的是让 agent 及时完成，而不是让它草率停止：

```text
以最少的有效工具循环完成请求，但不得让少循环优先于正确性、
必要证据、计算或引用。满足成功标准后结束；关键事实仍缺失时，
说明缺什么，并使用最小有效回退或追问最小必要信息。
```

完成代码修改后，应运行最相关的验证：改动行为对应的测试、适用的类型检查或 lint、受影响包的构建，或在全量成本过高时的最小 smoke test。不能运行时，必须说明原因和最佳替代检查。视觉产物则先渲染，再检查布局、裁剪、间距、缺失内容和一致性，必要时继续修订。

### 2.8 先评测，再改 prompt 或提高推理强度

先保持当前 prompt 与当前有效 reasoning 设置，运行代表性样本；之后一次只删除一组冗余指令，或做一个与已测失败直接相关的微小修复。不能同时重写 prompt、改模型、升 effort、调整工具集和替换运行时，否则无法定位回归来源。

reasoning effort 与 Pro mode 都不是默认“拉满”的开关：

- 迁移时先保留当前有效 effort，再比较同级和低一级；
- `medium` 是平衡起点，延迟敏感任务优先验证 `low`；
- `high`、`xhigh` 和 `max` 仅在评测显示可测质量收益时使用；
- 提高 effort 前，先检查 prompt 是否只是缺少成功标准、依赖规则、工具路由或验证循环；
- Pro mode 以同一模型、同一 effort、同一代表性任务与标准模式对比，而非假设其天然更好。

评测至少比较任务成功、答案完整性、必需证据、总 token、延迟、成本、调用/轮次/重试。资源减少只有在既有质量门仍通过时才算改进。

## 3. 可直接采用的紧凑模板

```text
角色：你是[职责]，可使用[上下文/证据]。

目标：完成[用户可见结果]。

成功标准：
- [必须满足的结果 1]
- [必须满足的结果 2]
- [最终输出必须含有的字段/证据]

约束与授权：
- [安全、业务、权限、事实依据限制]
- 可直接做：[范围内、安全的本地动作]
- 必须确认：[外部写入、破坏性动作、成本动作、明显扩 scope]

工具与证据：
- 先完成必要的检索和验证；互不依赖的读取可并行。
- [工具 A]：在[条件]下使用；返回[关键信息]；失败时[回退方式]。
- 结果不足时使用[具体回退]；不要猜测。

输出：
- 先给结论。
- 必须保留：[证据、风险、下一步]。
- 格式：[JSON / Markdown 小节 / 表格]。

停止与验证：
- 满足全部成功标准后结束。
- 缺少关键证据时说明缺失项，并只追问最小必要信息。
- [如适用]完成后运行[测试/检查]，如无法运行则说明原因和替代检查。
```

模板并非必须全部填满。删除任何不改变行为、风险或验收的字段；但不应删除成功标准、实质边界、所需证据与完成前验证。

## 4. 先拆开四个变更面

“升级到 GPT-5.6”不是一个单一改动。至少要把模型选择、Skill source、生成 runtime 和可选执行能力分开，否则无法判断是哪一层改变了行为。

| 变更面 | 当前项目中的典型位置 | 它实际改变什么 | 它不能证明什么 |
| --- | --- | --- | --- |
| 模型与 API 配置 | 宿主模型设置、API request、router、环境变量 | 实际请求使用的模型、endpoint、reasoning 和运行参数 | 仅改 `SKILL.md` 不会切换模型；模型字符串变化也不证明 Skill 合适 |
| Skill source contract | `skills/**/SKILL.md`、被其触发的 `references/**`、相关模板和工具描述 | 触发、目标、授权、路由、证据、输出和完成行为 | source 改动不自动证明生成 runtime 已刷新，也不证明宿主已加载新版本 |
| Generated runtime projection | `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` | 将 project-owned source 投射给具体宿主 | runtime mirror 不是 source-of-truth，不能通过手改 mirror 完成 source 修复 |
| 可选执行能力 | Pro、persisted reasoning、显式缓存、PTC、multi-agent 及相关 API/宿主配置 | 改变运行模式、状态、缓存或工具编排能力 | 它们不是 Skill prompt 适配的必做项，也不能与基线迁移混在同一实验中 |

因此，一个准确的完成声明应说明是哪一层发生了什么。本文建议在报告中使用下列标签帮助区分 claim；它们不是新的项目 schema 或状态机：

- `model-configured`：运行配置已切换并验证目标模型；
- `skill-source-adapted`：Skill source 已针对测得问题做外科式调整；
- `runtime-projected`：已通过受支持的生成路径刷新并检查目标宿主 runtime；
- `optional-capability-validated`：某项新能力已在独立 treatment 中证明净收益。

不要用笼统的“Skill 已升级到 GPT-5.6”覆盖这些不同 claim。只改 Skill 文案时，最多声称 source contract 已调整；没有实际模型调用、runtime 投射或宿主加载证据时，必须保留对应限制。

### 4.1 `SKILL.md` 不是全部 prompt stack

适配既有 Skill 前，应盘点所有可能改变运行行为的 prompt surface：

1. frontmatter `description`：负责发现和触发，是常驻 activation index，不是功能正文；
2. `SKILL.md` 主体：保存高频 workflow spine、边界、STOP trigger、输出和完成契约；
3. 条件加载的 `references/**`：保存只在特定场景需要的细节、样例、persona 或协议；
4. tool description / input schema：决定模型何时选工具、如何解释返回字段与失败；
5. host/system/developer prompt 与模板：可能重复、覆盖或冲突于 Skill 规则；
6. 模型、reasoning、缓存、状态 replay 和工具调用配置：属于运行配置，不属于 `SKILL.md`。

这一步的目的不是扩大改动面，而是避免只压缩主文件，却把重复规则留在 references、工具描述或宿主 prompt 中；也避免为了“统一”而误改本不属于 Skill source 的模型配置。盘点只产生候选事实，不产生跨 owner 修改授权：工具描述、宿主 prompt、模型配置和 Skill source 仍由各自 source-of-truth 负责。

### 4.2 用现有 Body 分层判断去留

针对 spec-first 的已有 Skill，应继续服从 canonical 方法论中的 Body-L1 / behavioral anchor / L2 / L3 分类，而不是看到“GPT-5.6 偏好短 prompt”就机械删减：

| 内容类型 | GPT-5.6 适配姿态 |
| --- | --- |
| Body-L1 contract/gate | 留在主文件：触发边界、权限、source/runtime、STOP、证据、输出和完成线不能为了更短而下沉 |
| Behavioral anchor | 仅在它修复了已测失败或防止高风险误行为时保留；写成最短、可触发的判断规则 |
| L2 条件细节 | 移到一跳可达的 reference，并写清何时必须加载；不能只把 token 从主文件搬到默认加载路径 |
| L3 冗余 | 删除：重复解释、无行为差异的样例、模型已稳定具备的过程脚手架和未来假设 |

“结果优先”不等于删除全部步骤。若顺序承载真实依赖、授权、不可逆副作用、验证 gate 或 provider 协议，就仍是 contract；应保留其必要顺序。应该删除的是替模型安排通用思考过程、但不改变正确性或风险的步骤。

## 5. 既有 Skill 的 GPT-5.6 适配流程

### Step 0 — 锁定对象和不变量

先记录目标 Skill 的 source owner、触发入口、references、工具、生成投射和代表性消费者。冻结必须保留的行为：触发/非触发边界、授权与副作用、source/runtime 纪律、artifact/output schema、证据要求、失败/降级路径和完成条件。

不要从“如何改短”开始，而要先回答：哪些行为一旦变化就构成回归？哪些内容只是实现路径，可由 GPT-5.6 自主选择？

### Step 1 — 建立旧模型与原 Skill 基线

使用代表性任务运行原 Skill，至少记录：

- 任务完成率与关键用户可见结果；
- 触发准确性、工具选择、参数、调用/重试/循环次数；
- 关键输出、结构化格式、引用和验证证据；
- 授权停点、追问行为、失败/降级是否诚实；
- TTFT、端到端耗时、input/output/reasoning/cached token 和单次成功成本；
- source 版本、宿主、模型、有效 reasoning、工具集和 runtime projection 状态。

代表性任务应包含正常路径、边界路径和一两个历史真实失败。若没有这些基线，后续只能证明“文本变了”，不能证明“Skill 更适合 GPT-5.6”。

### Step 2 — 只切模型，不改 Skill

先以相同 Skill source、工具集、endpoint contract 和原有效 reasoning 运行 GPT-5.6 treatment。生产目标需要稳定追踪时显式使用 `gpt-5.6-sol`；如果原工作负载是低成本、分类、路由或延迟敏感角色，应按角色评估 Terra/Luna，不能把所有 Skill 一律映射到 Sol。

宿主未必支持按 Skill 选择模型。若只能使用宿主级统一模型，model-only treatment 应在隔离会话、受支持的 eval harness 或等价 API 路径中执行，并明确它只证明该 treatment 的表现；不能据此声称当前宿主已经为该 Skill 切换模型。

这一步隔离“模型本身带来的变化”。若原 Skill 已在 GPT-5.6 上满足质量、证据和成本门，默认不重写；最多清理确定性冗余，并把收益表述为 prompt hygiene，而不是兼容性修复。

### Step 3 — 从 trace 诊断失败类型

只对实际观察到的失败动 prompt。常见诊断类型如下：

| 失败类型 | 优先检查 | 最小修复方向 |
| --- | --- | --- |
| 过度停顿 / 频繁请示 | 是否重复“ask first”、授权边界是否散落 | 集中为可直接做 / 必须确认两类规则 |
| 工具过用或误选 | 工具是否全量暴露、描述是否缺少条件和返回字段 | 收紧可见工具，补调用条件、关键字段和失败回退 |
| 过早结束 / 输出缺项 | 是否只写“简短”、缺少成功标准和完成线 | 明确必留字段、证据、风险和停止/验证条件 |
| 无效长流程 | 是否规定通用逐步思考、重复检查和固定路径 | 改为结果 + 成功标准 + 决策规则 |
| 未检索即猜测 | 是否缺少前置证据规则，或把空结果当否定事实 | 声明检索前置条件和一到两种有意义的回退 |
| 宿主表现未变化 | source 是否未投射、会话是否缓存旧 Skill | 检查 source/runtime/loader 证据，不继续改 prompt 猜测 |

先定位失败属于 prompt contract、工具描述、runtime projection、模型/API 配置还是宿主加载。错误归因会导致在 `SKILL.md` 中堆补丁，掩盖真正的运行层问题。

### Step 4 — 一次只改一个 prompt 变量组

每轮只选择一个可归因的变量组：

1. 删除一类重复指令或无效示例；
2. 将一个过程段改写为目标、成功标准和停止条件；
3. 将一组绝对命令改为条件式决策规则；
4. 收紧一个工具区或补一个失败回退；
5. 补齐一个已测缺失的验证/输出契约。

不要同轮改模型目标、reasoning、Skill 主体、references、工具 schema 和可选能力。若一个修复确实跨多个 prompt surface，仍应围绕同一个已测失败组织，并清楚记录每个 surface 的必要性。

### Step 5 — 复测语义、成本与 source/runtime

对同一组代表性任务重跑，先判断硬门，再比较指标：

1. **行为保全：**触发、路由、权限、证据、输出、失败和完成语义没有回归；
2. **质量结果：**任务成功、完整性、引用/验证和用户可见结果达到既有门；
3. **效率指标：**token、延迟、工具循环和成功成本是否改善；
4. **source/runtime：**source 检查通过；需要宿主验证时，通过受支持的生成流程刷新 runtime，不能手改 mirror；
5. **证据分级：**source contract test、fresh-source eval、host loader 和 field outcome 分开报告，不互相冒充。

Skill prose 可能被宿主在会话启动时缓存。source 语义验证应读取当前磁盘内容；fresh-source eval 只能证明新 source 在隔离语境中的行为，不自动证明当前宿主已重新加载，更不证明真实业务 outcome。

### Step 6 — 将新能力留到独立实验

只有基线迁移和 prompt 适配已经稳定，且存在明确、可测的问题时，才分别评估 Pro、persisted reasoning、显式缓存、PTC 或 multi-agent。每项能力都应有独立 treatment、成功标准、成本预算、失败/回退方式和关闭条件。

“能力可用”不是启用理由；“调用更少”也不是 PTC 成功。只有现有质量门仍通过，并且目标指标出现可重复净收益时，才进入默认配置或 Skill contract。Skill 应消费宿主提供的 readiness/capability facts 并保留降级路径，不应把某个 provider 的内部字段硬写成跨宿主 workflow contract。

### 5.1 推荐的 Skill 对照矩阵

| Treatment | 模型 | Skill / 工具 | 目的 |
| --- | --- | --- | --- |
| A | 旧模型 | 原 Skill、原设置 | 冻结旧行为和成本基线 |
| B | GPT-5.6 目标 | 原 Skill、保留原有效 reasoning | 隔离模型变化，判断是否真的需要 prompt 修复 |
| C | GPT-5.6 目标 | 原 Skill、低一级 reasoning | 判断 token/延迟能否下降且质量不退化 |
| D | GPT-5.6 目标 | 一个最小 Skill/工具修复 | 验证该改动是否修复已测失败 |
| E | GPT-5.6 目标 | 独立可选能力 treatment | 单独评估 Pro、缓存、PTC 或 multi-agent 的净收益 |

比较顺序应是 A → B → C/D；E 永远独立。若 B 已通过，D 不是默认必做。若 D 同时混入 E，就不能把收益归因于 Skill prompt。

### 5.2 每轮最小记录

```yaml
skill_source_ref: skills/<name>/SKILL.md@<hash-or-commit>
host_and_runtime: <host + projection status>
model: <explicit model or resolved alias>
effective_reasoning: <none|low|medium|high|xhigh|max>
treatment: <baseline|model-only|prompt-fix|optional-capability>
changed_variable_group: <one group>
representative_cases: <case refs>
quality_gates: <pass/fail + evidence>
efficiency_metrics: <tokens/latency/calls/cost>
limitations: <fresh-source/host/field gaps>
decision: <keep|revert|iterate|defer>
```

这不是新的项目 schema，只是实验记录的最小信息集合。若仓库已有 eval、optimization 或 evidence artifact owner，应复用现有 owner，不能再建平行 source of truth。

### 5.3 多 Skill rollout：先 pilot，再推广模式

不要把“适配 GPT-5.6”执行成一次全仓批量重写。先按行为和风险选择少量代表性 archetype：

- 只读解释/研究类：重点观察输出完整性、检索预算和引用；
- 工具密集型 agent：重点观察工具选择、参数、并行/串行、回退和停止；
- coding / mutation 类：重点观察授权边界、行为保全、验证和完成声明；
- 长流程/多轮类：重点观察阶段感知、状态 replay、压缩和陈旧 reasoning。

推荐 rollout 顺序：

1. 选择高频、高价值且有历史 trace 的 1–3 个 pilot Skill；
2. 对每个 pilot 先跑 A/B model-only 对照，只修复可重现失败；
3. 观察多个 Skill 是否出现同一失败机制，而不是只看相似措辞；
4. 只有同一最小模式在不同 archetype 上重复通过，才提炼为共享方法或上位 contract；
5. 推广时仍逐 Skill 检查触发、授权、工具和完成边界，不能用批量文本替换代替语义判断；
6. 保留旧 source/评测结果和回退点；模型、宿主、工具 schema 或用户需求变化时重新评估。

一个 pattern 可以晋级为默认实践，至少需要：明确 consumer、重复通过的代表性证据、适用范围、成本影响、已知反例和 invalidation condition。否则它仍是局部 treatment，不应进入所有 Skill 的公共基线。

## 6. 适合 GPT-5.6 的 Skill 核心结构

以下是逻辑结构，不是要求全仓统一改成这些 Markdown 标题。现有 Skill 可以保留自己的信息架构，只要相同契约清晰、无重复且可验证。

```markdown
## Goal

[用户最终获得什么；当前 Skill 在 workflow 中拥有哪一段结果]

## Success criteria

- [必须成立的行为/产物]
- [必需证据、输出字段或验证]

## Constraints and authority

- 可直接执行：[安全、范围内的读取/修改/验证]
- 必须确认：[外部写入、破坏性动作、成本动作、实质扩 scope]
- 不得破坏：[source/runtime、兼容性、用户可见行为等真实不变量]

## Tool routing

- [工具]：在 [条件] 时使用；依赖 [前置事实]；返回 [关键字段]；失败后 [具体回退]
- 独立读取可并行；依赖结果或涉及副作用的动作顺序执行。

## Completion

- 满足全部成功标准后结束。
- 缺少关键证据时指出缺失项，并只追问最小必要信息。
- 完成后执行 [测试/检查]；无法执行时说明原因、claim 限制和下一步。
```

对 coding 类 Skill，可保留等价的硬行为锚点：

```text
Preserve existing functionality and user-visible behavior.
Before finishing, run the relevant tests/checks and report the evidence.
```

但不要机械复制英文句子。如果项目语言、既有 contract 或更具体的验证要求已经表达同一语义，应复用并去重；真正要保留的是“行为不被为了过测试而删除”和“完成声明必须绑定验证证据”这两个不变量。

## 7. GPT-5.6 升级与 prompt 迁移纪律

模型升级不自动授权改 API schema、推理字段、工具语义、缓存策略、测试或历史样例。先盘点每个使用点的模型、endpoint、角色、相邻 prompt surface、有效 reasoning effort、token/延迟设置、输出 parser、工具合同、缓存 key/指标和测试，再做最小安全迁移。

推荐的对照矩阵为：

1. 旧模型 + 旧 prompt + 旧设置；
2. GPT-5.6 目标模型 + 相同 prompt + 保留原有效 reasoning；
3. GPT-5.6 目标模型 + 相同 prompt + 低一级 reasoning；
4. GPT-5.6 目标模型 + 仅为已测失败做的最小 prompt 或 API 修复。

对旗舰旧用法，默认显式目标是 `gpt-5.6-sol`；较低成本/较高吞吐角色应分别评估 `gpt-5.6-terra` 与 `gpt-5.6-luna`，而不是把每个旧用法都迁到 Sol。需要 reasoning、工具调用、多轮 agent 或 GPT-5.6 新能力的工作流，优先采用 Responses API；若在 Chat Completions 中使用 function tools，GPT-5.6 的有效 reasoning 必须是 `none`，不要在不经评测和授权的情况下通过移除工具或降低所需 reasoning 来掩盖不兼容。

Pro、persisted reasoning、显式缓存、PTC 和 multi-agent 都是可选能力。只有它们解决了测得问题或用户明确要求时才引入；目标、假设和优先级跨轮稳定时才保留 reasoning，历史可能陈旧时应使用当前轮行为。缓存也应先测再调：大型稳定前缀保持稳定，实际稳定渲染边界才是显式 breakpoint 的位置，不能把所有 prompt 全局改成显式缓存。

## 8. 常见反模式

| 反模式 | 为什么不可靠 | 替代方式 |
| --- | --- | --- |
| 堆叠“逐步思考”“保持专业”“务必简短” | 通常不定义可验收行为，还可能彼此冲突或压缩掉必要内容 | 写出结果、成功线、保留项和输出结构 |
| 反复“先问我”“不要改动” | 让已经授权的安全本地工作无故停滞 | 一次写清可直接推进与必须确认的动作 |
| “尽量少用工具” | 可能压过必要检索、计算、引用和验证 | 以“最少**有效**循环，不牺牲正确性/证据”为停止规则 |
| 只因工具可用就调用 PTC | 中间工作仍可能需要语义判断，且会损失原生引用 | 仅将 PTC 限于边界清晰的确定性归约阶段 |
| 只看 token/调用次数 | 资源下降不代表最终结果正确、完整或可证明 | 在同一代表性评测上同时看质量、证据和成本 |
| 大规模重写 prompt stack | 无法定位模型、effort、prompt、工具或运行时中的回归来源 | 以真实 trace 驱动的最小外科式改动 |
| 默认把 `max` 当高质量配置 | 可能增加 token/延迟却无收益，掩盖真正的契约缺口 | 先补齐成功标准、路由和验证，再做受控对照 |
| 只改 `SKILL.md` 就声称已切换 GPT-5.6 | Skill source 不拥有宿主/API 模型配置 | 分别验证模型配置、Skill source、runtime projection 和宿主加载 |
| 为所有 Skill 套同一章节模板 | 不同 Skill 的触发、风险和 workflow ownership 不同，统一外形可能隐藏真实 contract | 把模板当逻辑检查表，保留现有正确 owner 和信息架构 |
| 同时改模型、reasoning、prompt 和工具 | 任何收益或回归都无法归因 | 用 model-only baseline 和单变量 treatment 分步比较 |

## 9. 采用前检查清单

- [ ] 目标是用户可见结果，而不只是过程动作。
- [ ] 成功标准、必需证据、输出字段和验证方式可判断。
- [ ] 每一条规则只出现一次，且不存在矛盾。
- [ ] 只有真实不变量使用绝对命令；其余写成有优先级的决策规则。
- [ ] 安全的范围内本地动作可连续执行；外部、破坏性、成本或扩 scope 动作会停下确认。
- [ ] 工具集最小相关，前置检索、关键返回字段、空/异常结果回退均明确。
- [ ] PTC 只处理确定性归约，审批、语义判断、引用和最终验证仍保留直接路径。
- [ ] 短答案明确保留结论、关键证据、重要风险和下一步，而非只写“简短”。
- [ ] 已使用同一批代表性任务证明改动没有降低质量、完整性或证据门。
- [ ] 生产迁移记录了实际目标模型、有效 reasoning、endpoint 合同、缓存影响和验证结果。
- [ ] 已区分模型/API 配置、Skill source、生成 runtime 与可选能力，没有用一层的改动冒充另一层完成。
- [ ] 已盘点 `description`、`SKILL.md`、条件 references、工具描述和宿主 prompt 中的重复或冲突。
- [ ] Body-L1 / STOP / 授权 / source-runtime / 证据与完成 gate 未因“提示更短”而被删除或藏入不可达 reference。
- [ ] 先运行了 GPT-5.6 + 原 Skill 的 model-only treatment；只有测得回归才做 prompt 修复。
- [ ] fresh-source、host loader、runtime projection 与 field outcome 的证据层级分开声明。

## 官方依据

- [Using GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.6)
- [Prompting guidance for GPT-5.6 Sol](https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6)
- [Upgrading to GPT-5.6 Sol](https://developers.openai.com/api/docs/guides/upgrading-to-gpt-5p6-sol)
