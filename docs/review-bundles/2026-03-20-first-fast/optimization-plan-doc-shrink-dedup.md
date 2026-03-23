# 00-first 文档瘦身与去重技术方案

> 适用范围：`skills/spec-first/00-first` 的 skill 文档与 `references/` 文档。
> 非目标：不修改 runtime 行为，不修改 CLI 语义，不调整 wave 编排，不引入新能力。
> 审查依据：`full-flow-review.md`、`optimization-final.md`、`optimization-plan-serena-review.md`、`optimization-plan-v2-review.md`、`first-execution-flowchart.md`。
>
> **代码审查更新（2026-03-21）**：已结合实际文件深度验证，对 §3 目标、§9.1、§9.2、§9.3、§11 验收标准做出修正。详见下方各节的「审查注记」。

## 1. 背景

`00-first` 当前已经具备可执行的实现口径，但文档层存在明显的重复维护问题：

- `SKILL.md` 承载了过多二级规则摘要，入口文件偏重。
- `references/*.md` 中有多处同义规则重复出现，尤其是数据库条件产出、端类型映射、QA 证据规范。
- 主链文档、专题文档、低频补充文档之间的职责边界不够收敛，后续容易 drift。

这类问题的核心风险不是“现在跑不起来”，而是“后续改动会越来越容易改漏、改乱、改出多份真源”。

## 2. 审查结论转化

这份方案不是从空白设计出来的，而是直接基于当前 review 共识收敛出来的：

| review 结论 | 对本方案的约束 |
|---|---|
| `full-flow-review.md` 结论：现有合同结构正确，Path X 已与当前实现和 live 文档对齐 | 方案只做文档瘦身，不改 current contract |
| `optimization-final.md` 结论：不破坏现有 wave / subagent / evidence-pack 合同 | 方案不触碰运行时边界和文件结构 |
| `optimization-plan-serena-review.md` 结论：保留现有合同，未来分歧只属于 Path Y | 方案不把 Path Y 的变更提前写进文档正文 |
| `optimization-plan-v2-review.md` 结论：避免让优化建议反向改写当前合同 | 方案只处理文档组织，不引入新的加载/执行语义 |

因此，本方案的质量标准不是“更激进”，而是“更收敛、更清晰、更不容易 drift”。

## 3. 目标

- ~~压缩 `SKILL.md`，让它只保留入口、总边界和索引。~~
  **【审查修正】** `SKILL.md` 当前仅 89 行，已相当精简。其 Reference 读取规则表（§Reference 读取规则）是其他文档不含的调度入口信息，属于必须保留的内容。目标应改为：**维持 `SKILL.md` 现有结构，仅删除与 `execution-flow.md`、`main-thread-contract.md` 完全重复的段落（如有）**。
- 收敛重复规则，减少同一语义在多个文件里反复维护。
- 为每类规则指定唯一 canonical owner，其他文件只保留短引用或补充说明。
- 保持当前 `first` 的执行口径不变。
- 降低后续维护成本和误改风险。

## 4. 非目标

本方案不做以下事情：

- 不改 `first` 的实现代码。
- 不改 runtime 资产定义。
- 不改 CLI 命令语义。
- 不新增新的 docs 分类。
- 不把低频专题升级为新的权威来源。
- 不扩展为架构重构或能力补齐。
- 不引入任何 Path Y 的合同变更内容。
- 不把性能优化、Serena 快路径或 reference 分层加载写入本方案正文。

## 5. 设计原则

### 5.1 单一权威来源

每类规则只允许存在一个 canonical owner。其他文档只能引用，不再全文复述。

### 5.2 入口文件最小化

`SKILL.md` 只承担“找到正确资料”的职责，不承担“把所有规则再讲一遍”的职责。

### 5.3 专题文档只写增量

专题文件只描述本专题需要知道的内容，不重复主链规则、总边界和通用 contract。

### 5.4 保持实现口径稳定

所有调整只作用于文档结构和表述，不改变现有执行流程和约束含义。

## 6. 推荐方案

推荐采用 **主链收敛 + 专题合并 + 低频短引用** 的方案。

原因如下：

- 改动面小，风险可控。
- 对去重最有效。
- 与当前 `first-execution-flowchart.md` 的实现口径一致。
- 不会触碰运行时行为。
- 与 review 结论一致，不把 Path Y 的争议带入当前文档。

## 7. 文档分层方案

### 7.1 第一层：`SKILL.md` 作为入口

`SKILL.md` 建议只保留：

- `first` 是项目级认知 skill。
- 默认模式和默认入口。
- 主线程职责边界。
- canonical contract 的索引。
- Common Mistakes。

建议移除或下沉：

- 大段重复的执行流摘要。
- 重复的 wave 规则说明。
- 已由 reference 单独承载的 contract 正文。
- 大型读取规则表的冗长解释。

目标是让 `SKILL.md` 成为一个轻入口，而不是第二份总说明书。

### 7.2 第二层：主合同文档保持单一职责

以下文件应保持“单一权威”定位，不再被其他文档重复展开：

- `main-thread-contract.md`
- `evidence-pack-spec.md`
- `agent-output-schema.md`
- `execution-flow.md`
- `subagent-architecture.md`

这些文件负责主链规则本身，其他文件不再复写同样内容。

### 7.3 第三层：专题文档只保留专题增量

专题类文档只写本专题的增量规则，不重复总链路。比如：

- `agents-code-analysis.md`
- `agents-api-deps.md`
- `agent-guidelines-setup.md`
- `agent-database.md`
- `agent-domain-model.md`

这些文件建议保留：

- 任务范围
- 输入证据
- 输出约束
- 缺口标记

不建议保留：

- 主线程边界
- 总 wave 编排
- 其他专题的通用规则
- 与 `SKILL.md` 重复的总说明
- Path Y 才会涉及的未来变更假设

## 8. 重点去重方案

### 8.1 数据库规则收敛

当前数据库规则分散在：

- `database-config.md`
- `database-conditional-projection.md`
- `platform-document-mapping.md`

建议收敛方式：

- 以 `database-config.md` 作为数据库规则的 canonical owner。
- `database-conditional-projection.md` 只保留条件产出概览和跳转说明。
- `platform-document-mapping.md` 只保留端类型对内容侧重点的映射，不再重复数据库状态语义。

这样可以避免 `database-er.md` 的产出条件在三处重复维护。
该收敛动作与 `optimization-final.md` 保持一致，不改变 `database-er.md` 的条件产出语义。

### 8.2 端类型与内容映射收敛

当前 `detection-rules.md` 和 `platform-document-mapping.md` 的职责边界不够紧。

建议：

- `detection-rules.md` 作为识别 taxonomy 的主文件，负责：
  - 主类型
  - 子类型
  - 降级语义
  - 识别优先级
- `platform-document-mapping.md` 只负责：
  - 主类型对应的内容侧重点
  - 条件型文档的适用性说明

如果某些子类型没有独立的内容侧重点，就不要在映射文档里硬补，保持继承主类型即可。
这比在多个文件里重复写同一套映射更符合 review 中“单一权威来源”的要求。

### 8.3 QA 规则收敛

`quality-assurance-rules.md` 当前偏重、偏大，容易和其他 reference 的写法冲突。

建议保留：

- 证据标注格式
- 抽样验证规则
- runtime/docs 产物的最低证据要求
- 主线程消费边界

建议收缩：

- 不要把所有 reference 文档都强制按同一种证据模板逐条写死。
- 对专题 reference 允许使用更轻量的说明方式，只要不和主合同冲突即可。

这样可以避免 QA 文档反过来压垮整个 references 体系。
同时保留 `full-flow-review.md` 强调的质量门禁，不削弱证据和抽样要求。

## 9. 文件级处理建议

### 9.1 `SKILL.md`

定位：轻入口。

建议保留：

- 项目级认知说明
- 适用场景
- 默认入口
- 主合同索引
- Common Mistakes
- **Reference 读取规则表（必须保留，是其他文档不含的调度入口信息）**

建议删除：

- 重复 contract 正文
- 大块执行流摘要
- ~~大型引用表的冗长解释~~（**【审查修正】Reference 读取规则表本身不属于冗长解释，应保留；仅删除表格以外的重复性文字说明**）
- 与 `execution-flow.md`、`main-thread-contract.md` 完全重复的段落

> **【审查注记】** 勿以"明显变短"作为本文件的验收标准，否则执行时易误删 Reference 读取规则表。

### 9.2 `execution-flow.md`

定位：执行流 canonical owner。

建议保留：

- 启动顺序
- wave 顺序
- evidence pack 收集
- runtime/docs 分发
- 最终落盘
- CLI 最小支撑边界

建议删除：

- ~~其他文档已表达过的重复总原则~~（**【审查修正】** 只删除"总原则"中与 `subagent-architecture.md` 完全相同的3条：Skill 编排、CLI 支撑、runtime 真源。其余两条和所有步骤描述必须保留，它们是 `subagent-architecture.md` 没有的内容）
- ~~与 `SKILL.md` 完全同义的描述~~（**【审查修正】** 保守处理，不泛化删除，仅删逐字重复段落）
- 与 `subagent-architecture.md` 重复的 wave 调度解释

> **【审查注记】** `execution-flow.md` 的核心价值在于步骤化执行序列（Step 0→4），这部分在 `subagent-architecture.md` 中无对应，必须保留。

### 9.3 `subagent-architecture.md`

定位：波次和 agent 分工 canonical owner。

建议保留：

- runtime/docs agent 分组
- 波次
- 输入输出边界
- 失败和重试策略
- 并发上限（**canonical owner，不得删除**）

建议删除：

- 重复的主线程边界说明
- 重复的证据包总原则
- 与 `execution-flow.md` 完全重复的表述
- ~~与 `main-thread-contract.md` 重复的调度细节~~（**【审查修正】方向错误**：`main-thread-contract.md` 的并发上限条目引用了本文件作为权威来源，删除本文件的并发定义会导致该引用悬空。应保留本文件的并发定义，`main-thread-contract.md` 只保留引用指向即可）

> **【审查注记】** 本文件是并发上限（固定为 `3`）的 canonical owner，不应因"与 `main-thread-contract.md` 重复"而删除——方向应是让 `main-thread-contract.md` 引用本文件，而非相反。

### 9.4 `database-config.md`

定位：数据库规则主文件。

建议保留：

- 适用性判定
- 状态语义
- schema 来源优先级
- 条件产出规则
- 安全约束

建议让其他数据库相关文档引用它，而不是复述它。
它应该成为数据库条件产出语义的唯一主文件。

### 9.5 `database-conditional-projection.md`

定位：数据库专题投影说明。

建议保留：

- 数据库是条件型能力
- `database-er.md` 的存在条件
- 简短的状态表
- 跳转到 `database-config.md`

不建议重复完整产出规则。
该文件只保留“为什么是条件型”的快速说明，不承担总规则复述。

### 9.6 `platform-document-mapping.md`

定位：主类型到内容侧重点的映射。

建议保留：

- 正式 docs 全集
- 主类型对应的内容侧重点
- `database-er.md` 的适用性概述

不建议重复数据库配置规则或子类型识别细节。
这会避免 detection 和 mapping 两套表述各自演化出不同版本。

### 9.7 `quality-assurance-rules.md`

定位：产物质量和证据规范主文件。

建议保留：

- 证据标注
- 抽样验证
- 最低要求矩阵
- 主线程消费边界

建议收缩：

- 过长的通用说明
- 与专题文档重复的规则正文
- 与 `SKILL.md` 已有内容重复的段落

## 10. 预期结果

完成后，应该出现以下变化：

- `SKILL.md` 更短，更像导航页。
- 数据库规则只存在一个主来源。
- 端类型识别和内容映射职责清晰分离。
- QA 规则不再压住所有专题文件。
- `references/` 的维护成本下降。
- 后续改规则时不容易产生多处 drift。
- review 时能一眼看出每类规则的唯一 owner。

## 11. 验收标准

方案成立的标准如下：

- ~~`SKILL.md` 明显变短。~~（**【审查修正】删除此标准**，以免执行时误删 Reference 读取规则表；改为：`SKILL.md` 中与 `execution-flow.md`/`main-thread-contract.md` 逐字重复的段落已删除）
- 同一规则不再在多个文件中全文重复。
- 每类规则都有唯一 canonical owner。
- `references/` 的职责边界清楚。
- 当前实现口径没有变化。
- 没有引入新的 runtime 或 CLI 行为变化。
- 与现有 review bundle 的 Path X 结论保持一致。
- **`subagent-architecture.md` 的并发上限定义仍存在（未被误删）。**
- **`main-thread-contract.md` 的并发上限条目指向 `subagent-architecture.md`（引用未悬空）。**

## 12. 风险与控制

### 风险 1：删得过多，入口失去可读性

控制方式：

- 保留 `SKILL.md` 的最小入口结构。
- 保留主合同索引，不删除导航能力。

### 风险 2：只改入口，不改重复源

控制方式：

- 必须同时处理 `references/` 内的重复源。
- 不能只缩 `SKILL.md`。

### 风险 3：canonical owner 不清晰

控制方式：

- 每类规则在文档中明确指定唯一 owner。
- 其他文件只保留短引用。

### 风险 4：QA 规则过强

控制方式：

- 限定 QA 主要约束 runtime/docs 产物。
- 不把所有专题 reference 都纳入重证据模板。
- 保留必要的证据标注与抽样验证，不削弱质量门禁。

### 风险 5：可发现性下降（新增）

**背景**：`SKILL.md` 不只是入口，还承载了默认模式、正式边界、Reference 读取规则等唯一导航信息。若瘦身过头，agent 需要多跳几层文档，首次使用和排障体验会实质变差。

控制方式：

- `SKILL.md` 的 Reference 读取规则表、默认模式、适用场景属于**唯一导航信息**，不得以"重复"为由删除。
- 验收时检查：执行 `first` 时能否仅凭 `SKILL.md` 定位到所有必读文档，无需额外跳转。

### 风险 6：质量门禁被压薄（新增）

**背景**：`quality-assurance-rules.md` 定义了证据格式、抽样验证和主线程消费边界。若将"专题 reference 可以轻量"误读为"证据要求也可以轻量"，会导致产物质量实质下降。

控制方式：

- 专题文档的"轻量"仅指**格式灵活**（不强制套同一模板），不意味着可以省略证据标注或跳过抽样验证。
- `quality-assurance-rules.md` 的证据标注格式（§1）、抽样验证流程（§2）、主线程消费边界（§5）为强制约束，所有专题文档仍须遵守。
- 验收时检查：专题文档产物仍包含证据来源标注，未出现裸结论。

### 风险 7：双重提醒约束被误删（新增）

**背景**：`execution-flow.md`（步骤化执行序列）与 `subagent-architecture.md`（波次、并发、失败策略）是互补关系，不是重复关系。按"删重复"处理时，容易把需要双重提醒的约束删掉，导致后续实现者只知道"去哪里找"，不知道"怎么执行"。

控制方式：

- 删除前先逐条确认：该内容在另一文件中**是否有对应的执行细节**；若没有，则不属于重复，必须保留。
- `execution-flow.md` 的 Step 0→4 步骤序列是本文件唯一承载的内容，不得以"与 `subagent-architecture.md` 重复"为由整节删除。
- 验收时检查：`execution-flow.md` 仍可独立描述完整执行顺序；`subagent-architecture.md` 仍可独立描述完整波次与失败策略。

## 13. 结论

这次优化的最佳路径是：

- 只做文档瘦身与去重
- 不改实现
- 不改运行时语义
- 不扩展新能力
- 以单一权威来源 + 短引用 + 专题增量 的方式重构 `00-first` 文档体系

补充说明：

- 这份方案只适用于当前 live 口径的文档整洁化。
- 如果后续需要引入 Path Y 的合同变更，应另起单独方案，不要并入本文件。
