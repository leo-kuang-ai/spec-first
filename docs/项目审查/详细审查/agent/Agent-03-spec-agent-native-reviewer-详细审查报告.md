# spec-agent-native-reviewer 详细审查报告

## 1. 基本信息

| 项目 | 内容 |
|---|---|
| 对象类型 | Agent |
| 对象名称 | spec-agent-native-reviewer |
| 来源报告 | 2026-06-20-全量-skill-agent-优化建议.md |
| 原报告问题摘要 | 审查 agent-native 能力对等、上下文传递、工具设计和 guardrail。 |
| 审查日期 | 2026-06-20 |
| 审查结论等级 | 优化 |
| 优先级 | P2 |

## 2. 事实、推断、假设与待验证项

### 2.1 事实

- 事实 1：原报告位置为 docs/项目审查/2026-06-20-全量-skill-agent-优化建议.md:377。
- 事实 2：存在：`agents/spec-agent-native-reviewer.agent.md`，184 行。
- 事实 3：Agent frontmatter：model=inherit，tools=Read, Grep, Glob, Bash；结构信号 output=有，confidence=有，dont-flag=弱/缺。
- 事实 4：原报告建议为：明确与 `spec-cli-readiness-reviewer` 的边界：agent-native 看用户能力 parity，CLI readiness 看 command surface；补输出字段与 violation examples 的映射。

### 2.2 推断

- 推断 1：该对象应进入“优化”处理路径。
  - 推断依据：原报告定位/风险/优化动作与当前 source 结构信号一致；主要风险为“明确与 `spec-cli-readiness-reviewer` 的边界：agent-native 看用户能力 parity，CLI readiness 看 command surface；补输出字段与 violation examples 的映射。”。
  - 可信度：中
- 推断 2：当前最小收益来自补齐边界、输出契约和验证 fixture，而不是新增同类对象。
  - 推断依据：角色契约要求 Light contract + Explicit boundaries；原报告也把“重复能力、入口过重、缺 eval/contract”列为主问题。
  - 可信度：中

### 2.3 假设

- 假设 1：该对象仍会被当前 spec-first workflow 或用户入口消费。
  - 为什么需要该假设：本报告不执行引用删除或消费者回源分析，只基于现有 source 与原报告做优化审查。
  - 如果假设不成立的影响：应优先退役或合并，而不是继续补 prose。
- 假设 2：后续优化会在 source-of-truth 路径完成，不手改 generated runtime mirror。
  - 为什么需要该假设：本仓 source/runtime 边界要求从 `skills/`、`agents/`、`docs/` 等 source 修改，再按需 init。
  - 如果假设不成立的影响：会产生 runtime drift 和不可审查的行为差异。

### 2.4 待验证项

| 待验证项 | 验证方式 | 影响范围 | 优先级 |
|---|---|---|---|
| 当前对象真实消费者与调用路径 | `rg 'spec-agent-native-reviewer' skills agents src docs tests`，并区分 source 引用、历史文档和 generated mirror | 决定保留、合并或退役 | P2 |
| 建议改造是否改善触发/输出质量 | 补 normalized eval 或 recorded fixture；必要时 fresh-source eval | 防止 prompt 改写后误触发或输出漂移 | P2 |
| 无需外部资料的 source-only 判断是否足够 | 用本地 source/test/log 复核；不引入外部“最佳实践”断言 | 本地治理与验证 | P2 |
| 三视角合议结论是否被 owner 接受 | 后续 source 修改前由 owner 或 fresh reviewer 复核 | 防止单次审查意见变成未授权重构 | P2 |

## 3. 视角 A：$yao-meta-skill 审查结论

### 3.1 核心判断

从 $yao-meta-skill 的元能力视角看，spec-agent-native-reviewer 的核心问题不是“是否还能写得更多”，而是边界、复用、治理证据是否与其复用等级匹配。当前建议：优化。

### 3.2 主要问题

- 明确与 `spec-cli-readiness-reviewer` 的边界：agent-native 看用户能力 parity，CLI readiness 看 command surface；补输出字段与 violation examples 的映射。
- Source 结构信号：输出格式 已有，confidence calibration 已有，What-you-dont-flag 不足。
- 若该对象被团队复用，应补 owner、review cadence、trigger/output eval 或至少明确 deferred reason；否则不宜伪装成 governed asset。

### 3.3 优化建议

- 明确与 `spec-cli-readiness-reviewer` 的边界：agent-native 看用户能力 parity，CLI readiness 看 command surface；补输出字段与 violation examples 的映射。
- 用最小 contract summary 固化 When To Use / When Not To Use / Inputs / Outputs / Failure Modes。
- 对高权限、外部依赖或 mutating 场景，保留 `file-backed fixture`、`input_files`、`output contract`、`rollback boundary`、`missing evidence` 标签，避免伪造 trust evidence。

### 3.4 风险提示

- 过度治理会让入口变重；治理证据应放在 references/evals/reports，而不是堆进主 prompt。
- 不应把 retired-skill-review 或原报告的 deterministic/advisory 信号当成已确认缺陷；source 修改前仍需回源。

## 4. 视角 B：$skill-creator:skill-creator 审查结论

### 4.1 核心判断

从 skill-creator 视角看，spec-agent-native-reviewer 需要稳定“触发描述、执行步骤、输出契约、失败回退、验证样例”这五件事。当前最大缺口是：明确与 `spec-cli-readiness-reviewer` 的边界：agent-native 看用户能力 parity，CLI readiness 看 command surface；补输出字段与 violation examples 的映射。

### 4.2 主要问题

- Frontmatter/description 需要覆盖触发与 near-neighbor 排除，而不是只描述能力。
- Role / Goal / Input / Output / Constraint / Workflow 应在入口可见；长示例和细节迁移到 references。
- 对 agent 输出，必须能被父 workflow 合并、审查或回放；自由文本不足以支撑稳定交付。

### 4.3 优化建议

- 先写 2-3 个真实触发用例与 2-3 个不应触发的 near-neighbor，再改 description。
- 补最小输出模板：finding / recommendation / evidence / confidence / next action / limitation。
- 若后续进行实质改写，使用 fresh-source eval 或 recorded fixture 验证，不把当前会话缓存的 skill/agent 行为当成新版本证据。

### 4.4 风险提示

- 为了“完整”塞入 README、长教程、无消费者 references，会违反 progressive disclosure。
- 如果 eval 只检查关键词而不检查真实产物，会制造虚假的稳定感。

## 5. 视角 C：spec-first 项目架构师审查结论

### 5.1 核心判断

spec-agent-native-reviewer 应被放在 审查/验证 Agent，服务主链路或支撑链路的明确节点；不应作为新的泛入口扩散。

### 5.2 架构定位判断

审查 agent-native 能力对等、上下文传递、工具设计和 guardrail。。结合原报告，当前更适合作为 审查/验证 Agent 中的条件能力，而不是替代公开 workflow 的 orchestrator。

### 5.3 与 spec-first 主链路的关系

它与 `需求输入 -> Graph -> Spec -> Plan -> Work -> Review -> Evidence -> Knowledge` 的关系是：提供 审查/验证 Agent 能力，但必须通过 source refs、artifact summary、verification 和 handoff 与上下游衔接。若缺少这些字段，就会停留在 prompt 建议而不是工程闭环。

### 5.4 与五大 Harness 能力的关系

| 能力 | 当前支撑情况 | 问题 | 优化方向 |
|---|---|---|---|
| Context | 弱到中 | 当前支撑依赖 prompt 纪律，边界和输出字段需要进一步稳定。 | 压缩入口、明确消费者、补 near-neighbor/fallback。 |
| Execution | 弱 | 当前支撑依赖 prompt 纪律，边界和输出字段需要进一步稳定。 | 压缩入口、明确消费者、补 near-neighbor/fallback。 |
| Review | 中到强 | 当前支撑依赖 prompt 纪律，边界和输出字段需要进一步稳定。 | 压缩入口、明确消费者、补 near-neighbor/fallback。 |
| Evidence | 弱到中 | 需要把建议落到可复查 artifact、source refs、测试或 reason_code；当前多为 prose 约定。 | 补最小验证清单、fixture 或输出 schema。 |
| Knowledge | 弱 | 需要明确是否回流到 durable knowledge，避免 session/report 线索被当 confirmed truth。 | 补 freshness、invalidation 和 handoff 边界。 |

### 5.5 优化建议

- 明确该对象是核心、扩展、实验还是退役候选，并写入对应 catalog / workflow 文档。
- 避免与现有 Skill / Agent 重复建设；若职责重叠，以消费者、输出 schema 和证据需求划分。
- 对 P1 对象优先补可执行验证；对 P2 对象优先做 progressive disclosure 和 catalog 清理。

### 5.6 风险提示

- 局部 prompt 变强不代表系统变好；如果增加初载成本、重复入口或第二真相源，会损害 spec-first 的工程闭环。
- 对外部资料、MCP、GitHub、Slack、Figma、浏览器、Xcode 等能力，只能消费 confirmed facts 或明确 degraded，不得伪造工具可用性。

## 6. 三方交叉质询与冲突处理

### 6.1 共识结论

三方一致认为：spec-agent-native-reviewer 的优化应先落在边界、输出契约、失败处理和验证证据上；不应在缺消费者证据时新增平行对象。

### 6.2 分歧点

| 分歧点 | 视角 A 观点 | 视角 B 观点 | 视角 C 观点 | 最终取舍 | 取舍理由 |
|---|---|---|---|---|---|
| 治理强度是否立即升级 | 倾向补 owner/eval/gate 以稳定复用 | 倾向先补最小提示词结构和失败处理 | 从整体架构看先解决与主链路的消费者关系 | 分阶段优化 | 先补最小 contract 和验证，再按复用强度升级治理。 |

### 6.3 不采纳意见说明

- 不采纳“一次性补齐所有治理文件”的意见；先补最小契约、输出格式和关键 eval，避免用治理文件替代真实复用证据。

## 7. 最终综合结论

### 7.1 最终判断

该对象建议：

- 优化

### 7.2 判断依据

- 原报告的定位/风险/优化建议已经指向具体对象问题：明确与 `spec-cli-readiness-reviewer` 的边界：agent-native 看用户能力 parity，CLI readiness 看 command surface；补输出字段与 violation examples 的映射。
- 当前 source 事实显示：Agent frontmatter：model=inherit，tools=Read, Grep, Glob, Bash；结构信号 output=有，confidence=有，dont-flag=弱/缺。
- 角色契约要求 source/runtime 分离、script facts 与 LLM judgment 分离；本对象后续修改必须遵守该边界。

### 7.3 目标状态

优化后应达到：

1. 触发边界清晰，near-neighbor 不误触发。
2. 输入、输出、失败处理和 handoff 可被父 workflow 消费。
3. 至少有一组最小 source-level fixture 或 fresh-source eval 路径证明改动没有引入漂移。

## 8. 详细优化方案

### 8.1 短期优化

| 建议 | 适用角色 | 前提 | 代价 | 收益 | 风险 | 优先级 |
|---|---|---|---|---|---|---|
| 明确与 `spec-cli-readiness-reviewer` 的边界：agent-native 看用户能力 parity，CLI readiness 看 command surface；补输出字段与 violation examples 的映射 | Agent catalog owner / workflow orchestrator | 保留当前对象且进入 source 修改阶段 | 低到中 | 降低误触发和 handoff 歧义 | 可能增加少量维护成本 | P2 |

### 8.2 中期重构

| 建议 | 适用角色 | 前提 | 代价 | 收益 | 风险 | 优先级 |
|---|---|---|---|---|---|---|
| 建立 normalized eval / smoke fixture 覆盖主要分流和失败模式 | Workflow reviewer owner | 已确定对象仍被消费，且有可构造 fixture | 中 | 让建议从 prose 变成可回归证据 | fixture 过窄会制造虚假信心 | P2 |

### 8.3 长期演进

| 建议 | 适用角色 | 前提 | 代价 | 收益 | 风险 | 优先级 |
|---|---|---|---|---|---|---|
| 纳入 lifecycle/catalog 治理，记录 owner、review cadence、maturity 与退役条件 | Agent catalog owner / workflow orchestrator | 对象达到 team reuse 或 governed 级别 | 中 | 长期控制漂移、重叠和 stale prompt | 治理字段过多会抬高使用门槛 | P2 |

## 9. 推荐改造后的定义草案

如果该对象建议保留或优化，请输出改造后的定义草案。

### 9.1 推荐定位

作为 审查/验证 Agent 中的专业判断角色，只承担原报告确认的职责：审查 agent-native 能力对等、上下文传递、工具设计和 guardrail。

### 9.2 推荐职责边界

- Own：审查 agent-native 能力对等、上下文传递、工具设计和 guardrail。
- Not own：不替代上游 workflow 的最终语义裁决，不把 advisory facts 写成 confirmed truth，不越过 source/runtime 边界。
- Handoff：无法满足输入或证据要求时，输出 limitation、reason_code 和推荐上游入口。

### 9.3 推荐输入

- 用户目标或父 workflow 任务边界。
- repo-relative source refs / diff / artifact 路径。
- 必要的工具事实、截图、外部资料或 MCP facts；缺失时必须标注 degraded。

### 9.4 推荐输出

- 结构化 finding / recommendation / evidence / confidence / next action。
- evidence、confidence、risk、limitation、recommended_next_action。
- 未验证项和不应自动执行的 mutation。

### 9.5 推荐工作流

1. 读取最小 source-of-truth 和原始输入。
2. 判断是否满足触发和输入前提。
3. 执行对象自身的核心审查/生成步骤。
4. 生成结构化产物与验证建议。
5. 对缺证据场景输出 fallback，而不是补猜测。

### 9.6 推荐质量门禁

- frontmatter trigger / near-neighbor eval。
- 输出 schema fixture。
- 高权限或外部 provider 场景的 privacy/trust checklist。
- 对核心 workflow，补 progressive disclosure contract test。

### 9.7 推荐失败处理机制

缺 source refs、缺外部事实、缺工具权限、MCP/API 不可用、输入不属于本对象时，返回 degraded / not_applicable / handoff，不生成确认式结论。

## 10. 后续验证清单

| 验证项 | 验证方法 | 通过标准 | 负责人角色 | 优先级 |
|---|---|---|---|---|
| Source 引用回源 | `rg 'spec-agent-native-reviewer' skills agents src docs tests`，排除 generated mirrors | 明确消费者、调用路径和历史引用 | Agent catalog owner | P2 |
| 结构契约检查 | 检查 required headings / output schema / failure modes | 缺口补齐且入口不过度膨胀 | Maintainer | P2 |
| Eval / fixture | 新增或规范 normalized eval，覆盖触发、near-neighbor、失败模式 | 至少覆盖原报告验证建议：补 source-level fixture、输出 schema 和 fresh-source eval。 | Test owner | P2 |
| Fresh-source 复核 | 改 source 后用 fresh read-only reviewer 或等价方式复核 | 不依赖当前会话缓存行为 | Reviewer | P2 |
| 外部事实校验 | 无外部事实时确认报告不包含 current/latest 断言 | 所有结论均可由本地 source/report 支撑 | Maintainer | P2 |

## 11. 结论摘要

- spec-agent-native-reviewer 当前建议为 优化，优先级 P2。
- 原报告核心风险：明确与 `spec-cli-readiness-reviewer` 的边界：agent-native 看用户能力 parity，CLI readiness 看 command surface；补输出字段与 violation examples 的映射。
- 当前 source 事实：存在：`agents/spec-agent-native-reviewer.agent.md`，184 行；Agent frontmatter：model=inherit，tools=Read, Grep, Glob, Bash；结构信号 output=有，confidence=有，dont-flag=弱/缺。
- 视角 A 强调复用边界、治理证据和资源分层。
- 视角 B 强调触发描述、输出模板、失败处理和 eval。
- 视角 C 强调它必须服务 审查/验证 Agent，不能制造第二入口或第二真相源。
- 后续 source 修改前需要回源确认消费者与调用路径。
- 本报告未引入外部 current/latest 事实，主要依据本地 source 和原报告。
