# First Main Thread Context Reduction Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to implement this design task-by-task.

**Goal:** 将 `spec-first:first` 的主线程压缩为“协调 + 裁决 + 验收”的最小控制面，把证据采集、事实归一化和正文生成下沉到 subagents，减少主线程上下文占用，同时不破坏现有 `first / init / status / orchestrate` 流程。

**Architecture:** 保持 `first` 作为项目级认知入口，但将其拆成三个层次：主线程控制面、runtime agents 执行面、docs agents 交付面。主线程只保留任务壳、波次、约束、失败状态和最终验收；runtime agents 读取 evidence pack 并产出结构化 JSON；docs agents 只消费已确认的 runtime 结果与同轮 evidence pack 生成 Markdown。主线程的 canonical contract 需要落在 `skills/spec-first/00-first/references/`，review bundle 仅保留设计与实施说明。当前已经存在的 runtime truth / docs truth 分离、`subagent-architecture.md` 的波次划分，以及 `dispatcher.ts` 的 skill 路径上下文注入，构成了这个方案的落地基础。

**Tech Stack:** TypeScript, Vitest, Markdown skill docs, Spec-First runtime, subagent-based execution

---

## 1. 问题定义

当前 `spec-first:first` 的语义已经明确是“项目级认知 Skill”，它会协调 runtime agents 和 docs agents 产出最终 `.spec-first/runtime/first/*.json` 与 `docs/first/*.md`。问题不在于它是否使用 subagents，而在于主线程当前需要携带的上下文过多：

- 主线程同时承载流程描述、波次规则、质量规则、证据规则和输出规则。
- 一些规则与子文档重复，导致主线程 prompt 变厚。
- 子 agent 的输入边界没有被抽成独立 contract，主线程需要反复解释“该给谁什么输入”。
- 现有 `loadSkill()` 已经为 spec-first skill 注入 `skill-files-context`，路径问题被解决，但这不等于主线程占用最小化。

本设计的目标不是改掉 subagent 模式，而是将其显式化、结构化、压薄主线程。

## 2. 目标与非目标

### 2.1 目标

- 主线程只保留最小协调信息。
- runtime agents 和 docs agents 的边界明确、输入明确、输出明确。
- 文档层不再把同一套规则在多个文件里重复叙述。
- 现有 `first / init / status / orchestrate` 流程不被破坏。
- 保留 `docs/first` 作为人类阅读产物，继续禁止其回灌为真源。

### 2.2 非目标

- 不重写 `first` CLI 的业务职责。
- 不把多 Agent 编排下沉到 `src/` 的通用运行时里。
- 不把 `plan / orchestrate` 的简化议题混进本次设计。
- 不引入新的 AI 平台或外部执行框架。

## 3. 当前代码与文档事实

### 3.1 已存在的事实

- [`skills/spec-first/00-first/SKILL.md`](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md) 已明确 `first` 负责工作流、多 Agent 编排、约束和成功标准。
- [`skills/spec-first/00-first/references/execution-flow.md`](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md) 已明确 Skill 层流程为 `collect evidence pack -> dispatch runtime agents -> dispatch docs agents -> 写入最终文件`。
- [`skills/spec-first/00-first/references/subagent-architecture.md`](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md) 已明确 runtime agents 和 docs agents 的分组与波次。
- [`skills/spec-first/00-first/references/detection-rules.md`](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/detection-rules.md) 已明确识别规则只影响 runtime 真源中的平台语义，不裁剪正式 docs contract。
- [`skills/spec-first/00-first/references/quality-assurance-rules.md`](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/quality-assurance-rules.md) 已明确证据标注、抽样验证和中文输出规则。
- [`src/cli/commands/first.ts`](/Users/kuang/xiaobu/spec-first/src/cli/commands/first.ts) 只负责健康检查和 runtime/docs 存在性校验，是最小支撑层。
- [`src/core/skill-runtime/dispatcher.ts`](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/dispatcher.ts) 已经只对 spec-first skill 注入 `skill-files-context`，且不会扩散到通用 `SKILL.md`。

### 3.2 这说明什么

- 主线程本来就应该小，问题在于文档没有把“主线程最小契约”单独抽出来。
- 现有架构已经足够支撑上下文下沉，缺的是文档与测试层面的契约化。

## 4. 设计原则

1. 主线程只做调度、收敛、验收。
2. 证据正文尽量不进入主线程。
3. runtime 先于 docs，且 docs 不反向污染 runtime。
4. 单波最多 3 个 agent，保持并发上限不变。
5. 每个 agent 失败最多重试一次，再进入阻断判断。
6. 所有正式结论必须可追溯到 evidence path 或 runtime asset path。
7. 任何无法确认的事实必须标记 `[待确认]`，不能由主线程补猜。

## 5. 目标状态

### 5.1 主线程保留内容

主线程只保留以下信息：

- 当前 Feature ID
- 当前阶段或当前波次
- 本轮 runtime 资产目标
- 本轮 docs 资产目标
- 并发上限与重试规则
- 当前阻塞项
- 最终验收条件

主线程不应保留：

- 原始证据正文
- 每个 agent 的完整分析过程
- runtime 和 docs 的冗长正文
- 与子文档完全重复的说明性段落

### 5.2 runtime agents 负责什么

- 读取 evidence pack 中的原始证据。
- 产出结构化 runtime JSON。
- 只输出结论、证据路径、缺口和 `[待确认]`。
- 不生成 docs 正文。

### 5.3 docs agents 负责什么

- 读取本轮 evidence pack 与已确认 runtime 结果。
- 生成 `docs/first/*.md`。
- 不重新发现事实。
- 不将 docs 结果回写为 runtime 真源。

## 6. 文档拆解方案

本节是本次设计的重点：把“主线程最小化”落实到具体 md 文档。

### 6.1 `skills/spec-first/00-first/SKILL.md`

**职责定位**
- 作为总入口，描述 `first` 的目的、边界和输出。
- 不承载所有子规则的全文。

**建议调整**
- 保留：
  - `first` 是项目级认知 Skill。
  - CLI 只负责最小支撑层。
  - runtime/docs 是正式产物。
- 收缩：
  - 将 runtime/docs 分工的完整波次说明移到 `references/subagent-architecture.md`。
  - 将 evidence / QA / detection 的详细条目移到子参考文档。
- 新增：
  - “主线程保留内容”小节。
  - “主线程不得携带的内容”小节。
  - “主线程只接收结果摘要”的说明。

**结果**
- `SKILL.md` 只留下总契约，不再是规则全集。

### 6.2 `references/execution-flow.md`

**职责定位**
- 作为执行流程图。

**建议调整**
- 明确 4 步：
  1. collect evidence pack
  2. dispatch runtime agents
  3. dispatch docs agents
  4. write final files
- 每一步补输入 / 输出 / 阻断条件。
- 强调主线程与 subagents 的 handoff 只传结构化摘要，不传全文。

**结果**
- 主线程只负责推进状态，不负责解释流程细节。

### 6.3 `references/subagent-architecture.md`

**职责定位**
- 作为 runtime agents / docs agents 的契约说明。

**建议调整**
- 为每个 agent 组补齐：
  - 输入范围
  - 输出文件
  - 允许读取的证据类型
  - 禁止行为
  - 失败处理
- 继续保留五个 wave 的划分。
- 把“单波最多 3 个 Agent”写成不可变约束。

**结果**
- 主线程只要知道“派谁、派什么、拿什么结果”，不需要记住 agent 内部推理。

### 6.4 `references/detection-rules.md`

**职责定位**
- 项目类型与子类型识别规则。

**建议调整**
- 保留 platformType / subType / mixed / monorepo 的识别逻辑。
- 强调识别结果只影响 runtime 真源的侧重点，不裁剪正式 docs contract。
- 收紧与主线程裁决无关的叙述。

**结果**
- 识别规则继续服务 `summary.json` 和 `steering.json`，不占主线程。

### 6.5 `references/quality-assurance-rules.md`

**职责定位**
- 统一质量门禁和证据标注规则。

**建议调整**
- 增加一条：主线程只消费 agent 摘要，不消费完整推理链。
- 保留：
  - 中文输出
  - 证据标注格式
  - 抽样验证
- 补充：
  - runtime/docs 资产的统一输出最小格式
  - 失败结果的标准化表示

**结果**
- 质量规则成为“子 agent 输出合同”，不再是主线程负担。

### 6.6 `references/agents-*.md`

涉及：
- `agents-code-analysis.md`
- `agents-api-deps.md`
- `agent-guidelines-setup.md`
- `agent-database.md`
- `agent-domain-model.md`

**建议调整**
- 每份文档只保留：
  - 任务范围
  - 输入证据
  - 输出资产
  - 缺口标记方式
- 删除与其它 agent 重复的执行说明。
- 本次不修改 `structure-analysis.md`、`domain-model-analysis.md`、`database-config.md`、`platform-document-mapping.md`、`testing-strategy.md`，它们属于低频补充文档，不在默认主线程热路径内。

**结果**
- 每个 agent 的 contract 变薄，主线程无需重复解释。

### 6.7 新增 `references/main-thread-contract.md`

**建议新增**
- 定义主线程最小保留集：
  - 当前 Feature
  - 当前波次
  - 资产目标
  - 约束
  - 重试规则
  - 验收条件
- 定义主线程禁止保留集：
  - 原始证据正文
  - 长篇分析
  - 每个 agent 的完整推理链
- 该文件应放在 `skills/spec-first/00-first/references/main-thread-contract.md`，作为 canonical source。

**价值**
- 让其它 md 只引用这一份主线程契约，避免重复描述。

### 6.8 新增 `references/evidence-pack-spec.md`

**建议新增**
- 定义 evidence pack 的目录结构。
- 定义 runtime wave 和 docs wave 各自可读的证据集合。
- 定义 evidence pack 的最小字段。
- 该文件应放在 `skills/spec-first/00-first/references/evidence-pack-spec.md`，作为 canonical source。

**价值**
- 主线程只发包，不发长证据。

### 6.9 新增 `references/agent-output-schema.md`

**建议新增**
- 统一所有 subagents 输出结构：
  - `status`
  - `artifacts`
  - `evidence_paths`
  - `gaps`
  - `next_action`
- 定义 `blocked / retryable / [待确认]` 的标准表达。
- 该文件应放在 `skills/spec-first/00-first/references/agent-output-schema.md`，作为 canonical source。

**价值**
- 主线程只看结构化摘要，不需要读长推理。

## 7. 数据流设计

### 7.1 输入流

1. 用户运行 `spec-first first`。
2. 主线程读取当前 Feature、阶段、runtime/docs 状态。
3. 主线程构造 evidence pack。
4. 主线程按 wave 派发 runtime agents。

### 7.2 runtime 流

1. runtime agents 读取 evidence pack。
2. runtime agents 输出 JSON。
3. 主线程收集摘要。
4. 若 runtime 未通过，则阻断 docs wave。

### 7.3 docs 流

1. 主线程读取已确认 runtime 结果。
2. 主线程按 wave 派发 docs agents。
3. docs agents 生成 Markdown。
4. 主线程只做存在性和一致性校验。

### 7.4 终态

1. 最终 runtime/docs 文件落盘。
2. 主线程输出结果摘要。
3. 不保留中转交接目录。

## 8. 运行时与 CLI 的影响

### 8.1 `src/cli/commands/first.ts`

当前它已经是最小支撑层，建议只做文案级收敛：

- 强调 `first` 是协调入口，不是正文分析器。
- 强调 runtime / docs 都是最终产物。
- 不增加新的编排逻辑。

### 8.2 `src/core/skill-runtime/dispatcher.ts`

当前已经只对 spec-first skill 注入 `skill-files-context`，而且只作用于 `skills/spec-first/*/SKILL.md`。

建议：

- 保持这个注入，用来稳定路径解析。
- 不扩展成 evidence pack 注入。
- 不把它变成主线程正文负担。

### 8.3 其他 runtime 模块

本次设计不要求改动：

- `first-runtime-store.ts`
- `first-bootstrap.ts`
- `first-resume.ts`
- `first-doc-projection.ts`

这些模块继续负责 runtime/docs 真源读写和投影，不承担新的主线程职责。

## 9. 错误处理与回退策略

### 9.1 runtime agent 失败

- 优先重试一次。
- 若仍失败，则阻断对应 runtime asset 的落盘。
- 主线程只保留失败摘要，不保留完整错误栈。

### 9.2 docs agent 失败

- 可单独重试一次。
- 不能伪造正文补洞。
- 若 runtime 已确认，docs 失败应仅阻断 docs 波次，不回滚已完成 runtime 资产。

### 9.3 主线程上下文不足

- 通过 `main-thread-contract.md` 和 `evidence-pack-spec.md` 补齐。
- 不通过复制长证据正文来补齐。

### 9.4 无法确认的事实

- 一律标记 `[待确认]`。
- 不允许主线程为了推进而编造结论。

## 10. 测试策略

### 10.1 文档测试

建议覆盖：

- `00-first/SKILL.md` 的总契约是否只保留最小职责。
- `execution-flow.md` 是否只描述 4 步执行流。
- `subagent-architecture.md` 是否明确 runtime/docs 波次和并发上限。
- `quality-assurance-rules.md` 是否包含主线程最小化约束。
- `agent-*` 文档是否只保留输入 / 输出 / 禁止行为。

### 10.2 运行时测试

建议覆盖：

- `spec-first:first` 渲染是否继续带路径上下文，但不向通用 skill 扩散。
- `first` CLI 是否仍只做最小支撑层。
- runtime/docs 真源校验是否保持原行为。

### 10.3 集成测试

建议覆盖：

- `first` 入口产生的提示是否只包含必要的协调信息。
- runtime 完成前 docs wave 不启动。
- docs 失败不会污染 runtime 资产。

## 11. 落地顺序

1. 先新增 `main-thread-contract.md`、`evidence-pack-spec.md`、`agent-output-schema.md`。
2. 再收敛 `SKILL.md` 与四份基础 references。
3. 再压薄 `agent-*.md`。
4. 再补测试锁边界。
5. 最后微调 CLI 文案和少量 runtime 提示。

## 12. 风险与回退

### 风险 A：主线程压得过小，导致 agent 输入不足

回退：
- 优先补 evidence pack 结构，不要把正文塞回主线程。

### 风险 B：文档拆分过多，维护者找不到入口

回退：
- 用 `main-thread-contract.md` 作为总入口，其它文档只做分工说明。

### 风险 C：docs agents 读取过多，重新拉高上下文

回退：
- 限制 docs agents 只读“本轮 evidence pack + 已确认 runtime 结果”。

### 风险 D：路径注入被误扩散到非 spec-first skill

回退：
- 保持 `dispatcher.ts` 的 `isSpecFirstSkillPath()` 过滤，不扩大范围。

## 13. 验收标准

- 主线程不再承载长篇证据正文。
- runtime agents 和 docs agents 的边界清晰且可测试。
- 文档层不会重复叙述同一套规则。
- `first / init / status / orchestrate` 现有流程仍然可用。
- `pnpm test` 全绿。
- 新增的契约文档能够支撑后续实现计划拆分。

## 14. 结论

这次改造的关键不是“再加一个更强的入口”，而是把 `first` 的主线程从“看起来什么都要懂”收缩成“只负责调度和裁决”。真正占上下文的证据、推理和正文应当由 subagents 消化并落到 runtime/docs 真源里。这样既保留了 `first` 的能力，又避免主线程上下文长期膨胀。
