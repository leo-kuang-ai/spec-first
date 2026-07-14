# spec-first Skill Prompt 压缩优化组合方法论

> 用最小、可回源、可验证的上下文获得足够的决策质量，同时守住治理边界、跨宿主诚实性与长期维护成本。

本文是 [`skill-prompt-设计与优化方法论-v2.md`](./skill-prompt-设计与优化方法论-v2.md) 的
**spec-first 专项 companion**，只补充长 skill、multi-agent workflow、动态上下文与运行时成本的专项方法。

它不取代：

- [`结构化项目角色契约.md`](./结构化项目角色契约.md)：使命、权威与不可越过边界；
- [`skill-prompt-设计与优化方法论-v2.md`](./skill-prompt-设计与优化方法论-v2.md)：唯一 canonical playbook；
- `skills/`、`src/cli/`、contracts、tests：当前 project-owned implementation 与 contract 的 source of truth；目标宿主的实际 runtime behavior 仍以带 provenance/freshness 的直接运行证据为准；
- [`spec-optimize`](../../skills/spec-optimize/SKILL.md)：有预算、有状态、可恢复的实验执行 owner。

[`2026-07-14-spec-review-token-consumption-analysis.md`](../项目审查/2026-07-14-spec-review-token-consumption-analysis.md)
是问题证据与落地状态快照，不是本方法论的 source of truth。报告中的 reviewer 数量、validator 上限、profile
默认值和当前宿主状态都不得自动晋级为 durable contract。

权威顺序：

```text
角色契约 > canonical v2 > 本专项 companion > 分析报告与单次实验状态
```

---

## 0. Scope 与 canonical 映射

### 0.1 本文只拥有的专项增量

本文只回答六类 canonical v2 尚未完整展开的问题：

1. single-agent 与 multi-agent 的成本形状为什么不同；
2. 何时根本不该使用 multi-agent；
3. isolation、roster、validator、slicing、output 如何共同形成运行乘数；
4. host cache、model override、context editing、usage telemetry 缺失时能声明什么；
5. 如何同时测量成本、行为质量、现场结果与治理总拥有成本；
6. 何时允许对可回源动态材料做有损压缩实验。

通用的正文分类、STOP trigger、progressive disclosure、source/runtime、fresh-source eval 与脚本职责，
一律复用 canonical v2，不在本文重建第二套定义。

### 0.2 术语映射

| 主题 | 权威定义 | 本文用法 |
| --- | --- | --- |
| Body-L1/L2/L3 | canonical v2 §1.2 | 原样引用；本文不再使用 L0–L7 编号 |
| STOP trigger 四件套 | canonical v2 §2 原则 2 | 原样复用，可额外记录 consumer |
| eval adequacy L0–L4 | canonical v2 Step 5b | 继续表示 eval 充分性；本文另用正交 evidence vector 表示不同 claim 轴 |
| source/runtime | 角色契约、canonical v2 | 只改 project-owned source；runtime mirror 可重建 |
| profile / roster / validator | 本文专项 | 待测的成本—质量策略，不是固定人数合同 |
| host capability | 目标运行的直接 evidence | run-local、带 provenance/freshness；不得新建第二个全局真相源 |

### 0.3 读者路由

- 先判断该不该做优化：§1–§2
- 选择专项模块：§3–§4
- multi-agent 与动态上下文：§5
- 跨宿主、cache 与安全：§6
- measurement、paired eval 与 promotion：§7
- 按 skill 形状落地：§8–§9
- 写提案与验收：§10–§11
- 外部证据与新鲜度：§12

---

## 1. 结论先行

适合 spec-first 的不是一条固定压缩流水线，而是一组按问题选择的具名模块：

```text
SpecFirstCompressionModules
= ArchitectureFit
+ ProgressiveDisclosure
+ TopologyBudget
+ ContextSlicing
+ RuntimeHygiene
+ DeterministicFloor
+ Measurement
+ HostAccelerators(optional)
```

这些模块不是必须全部启用的成熟度层级。每个候选都必须说明 consumer、适用信号、可省略条件与失效条件。

核心判断：

1. **先问是否值得优化。** 没有真实成本、质量或用户负担证据时，不为“更短”建立优化工程。
2. **先问是否值得 multi-agent。** 高共享上下文、强依赖、低价值任务通常应回到 single-agent 或按需 specialist。
3. **multi-agent 先压乘数，single-agent 先压固定项。** 少派无增量 agent 通常比继续压最终报告更有效。
4. **无损结构化优先，但不是永久阻断有损实验。** 在 canonical disclosure、retrieval 与 slicing 后仍超预算时，可在默认策略 promotion 前做受控、可逆 pilot。
5. **大窗口不等于有效上下文。** context rot 与 distractor 影响具有模型、位置和内容依赖性。
6. **cache、模型路由和 context editing 只是宿主加速器。** 缺失时 loud degraded，不能成为正确性依赖。
7. **成本、行为、现场结果与维护成本是正交证据。** 任一单轴改善都不能冒充整体成功。
8. **达到决策充分后停止。** 边际收益低于误触发、漏证据、维护或用户纠正成本时，继续压缩是负优化。

### 激活优化的 durable 证据

核心判断 #1 要求"真实成本、质量或用户负担证据"，但不指定什么是 durable。满足以下任一条件时，优化工作可激活：

- **Billed token 证据：** 目标宿主上至少一个 skill 的单次运行 billed input+output 超过预设阈值（如 ≥50k tokens），且有至少 3 次独立运行的记录。
- **用户负担证据：** 用户在反馈中报告了 prompt 过长、响应过慢、token 成本过高，或有记录的纠正返工（同一 session 内 ≥2 次人工纠正同类错误）。
- **结构证据 + 显式 aspirational 标签：** 当 billed 或用户证据不可得时，可基于 source/aggregate 结构分析启动优化，但必须显式声明 `trigger_evidence=structural_only` 并在 promotion 前补齐 runtime 或 field 证据。

没有上述任一证据时，不为"更短"建立优化工程。此阈值本身应随 field outcome 数据修订。

一句话：

```text
先确认架构值得，再处理最大乘数；
用与 claim 匹配的成本、质量和现场证据决定是否保留优化。
```

---

## 2. 成本模型与 ArchitectureFit

### 2.1 总成本不只包含 token

```text
ExpectedTotalCost
= RuntimeInferenceCost
+ ToolAndLatencyCost
+ HumanDecisionCost
+ GovernanceTCO
```

`GovernanceTCO` 至少包括：

- 一次性实现、迁移和 measurement scaffold 成本；
- reference、eval、fixture、schema 与 cross-host 适配的持续维护；
- drift 排查、field 反例重评、rollback 和失效修订；
- 人工确认、误报分诊、漏报返工和重复运行时间。

只减少 token、却增加更多工具调用、验证器、人工确认或维护面，不构成净收益。

### 2.2 激活与单次运行成本

```text
ExpectedRuntimeInferenceCost
= IndexTax
+ P(activation) × ExpectedActiveRunCost
```

```text
ExpectedActiveRunCost
= OrchestratorFixed
+ OrchestratorDynamic
+ Sum(ReviewerProbability × ReviewerCost)
+ Sum(ValidatorProbability × ValidatorCost)
+ HistoryAndToolResults
+ OutputReingestion
```

- `IndexTax` 是否存在及其规模取决于 host 的 skill discovery/loading 行为；
- `OutputReingestion` 覆盖冗长 finding、重复 quote、双表示 artifact 与后续 history；
- 宿主不暴露 usage 时，只能报告透明代理和 limitations。

### 2.3 三种 token 指标不可混用

| 指标 | 能证明 | 不能证明 |
| --- | --- | --- |
| Aggregate context | 所有 inference 的总上下文形状 | 实际账单、质量 |
| Uncached / billed input | 特定宿主的计费与 cache 复用 | fan-out 已下降、质量提升 |
| Unique source bytes/tokens | source/artifact 自身体积 | 运行时实际加载次数 |

Output token、tool-result 大小、wall-clock 和人工决策时间应单独报告。

### 2.4 Multi-agent 适配门

在优化 roster 前，先判断 multi-agent 是否值得存在。

| 信号 | 倾向 multi-agent | 倾向 single-agent / cascade |
| --- | --- | --- |
| 子任务关系 | 多个独立、可并行证据方向 | 高度共享上下文、强顺序依赖 |
| 价值 | 高价值、广度优先、遗漏代价高 | 低风险、范围窄、普通实现判断 |
| failure model | 需要不同证据路径或独立验证 | persona 只是同一推理轨迹的换皮 |
| 上下文 | 单窗口难以容纳且可安全切分 | 每个 leaf 都必须读取几乎相同全文 |
| 协调成本 | 可定义清晰 objective/scope/output | handoff、去重与冲突成本超过收益 |

该判断属于 LLM/human 的语义职责。脚本可准备 document bytes、changed files、risk facts 与 host readiness，
不得按关键词自动裁决是否使用 multi-agent。

### 2.5 候选排序

```text
GrossLeverage
≈ removable_tokens
× runtime_multiplier
× activation_frequency
× confidence_of_safe_change

NetLeverage
≈ GrossLeverage
− implementation_cost
− expected_maintenance_cost
− expected_human_correction_cost
```

这些公式只帮助人和 LLM 排序，不是脚本自动批准或拒绝候选的规则。

---

## 3. 业界方法族的采纳判断

### 3.1 默认处置

| 方法族 | 业界信号 | spec-first 处置 | 边界 |
| --- | --- | --- | --- |
| Agent Skills progressive disclosure | metadata → instructions → resources | **Adopt via canonical v2** | reference 必须有可观察 trigger 与 consumer |
| Description-as-router | metadata 决定 skill 发现/激活 | **Adopt, host-scoped** | body 的 When to Use 不替代 description |
| JIT retrieval / agentic search | 按需加载高信号上下文 | **Adopt** | 重要结论回源；探索速度与工具税需测量 |
| Code-as-tool | 机械工作由代码执行 | **Adopt** | 脚本不裁决 roster、finding、风险或产品语义 |
| Isolation / roster / cascade | 降低 N × context | **Adopt when ArchitectureFit passes** | 多 agent 本身必须先证明值得 |
| Compaction / notes / clearing | 治理长时 history | **Adopt with recall guard** | 保留授权、未决风险与 completion evidence |
| Extractive selection / RECOMP | 减少动态材料 | **Optional** | slice 可扩大、原文可回源、跨片依赖需测试 |
| Prompt caching | 降低部分 latency/billed cost | **Optional accelerator** | 按净收益而非 hit rate 决策 |
| Model cascade | 优化成本—质量曲线 | **Experiment** | treatment-aware eval、override confirmed、可回滚 |
| LLMLingua 系列 | 预算化压缩动态材料 | **Conditional experiment** | contract/schema/否定/阈值/evidence anchor 永不进入有损路径 |
| Soft prompt / latent compression | 学到的隐式前缀 | **Research only** | 非 project-owned、难审计、难跨宿主 |
| KV-cache / sparse attention | 推理服务层优化 | **Out of scope** | 不写入 skill contract |
| 大窗口替代 retrieval/slicing | 容量扩大但不消除 context rot | **Forbid as primary strategy** | 大窗口可作上限，不能替代治理 |

### 3.2 伪优化识别

| 伪优化 | 检测问题 | 实际效果 | 正确替代 |
| --- | --- | --- | --- |
| 拆文件但默认全读 | 未触发路径是否仍加载 reference？ | 只增加维护面 | canonical STOP trigger + 未触发不读 |
| 文档/diff 落盘后全员全文读 | leaf 是否只读自己的 evidence bundle？ | 动态乘数不变 | reviewer-specific slice |
| 行数下降 = 账单下降 | 是否有 aggregate 或 billed evidence？ | 只证明 source-shape | 分报 source / aggregate / billed |
| cache hit = 优化成功 | 是否计算 write、miss、churn 与 reuse？ | 可能净成本更高 | cache 净收益 |
| 合并 persona 后声称独立 agreement | 是否共享父会话和证据路径？ | 伪造独立性 | claim-critical 才独立验证 |
| 固定 roster 冒充风险预算 | 是否根据当前 evidence 增减？ | 低风险仍付满员税 | risk-selected + shadow calibration |
| 大窗口替代 slicing | distractor 与长程依赖是否退化？ | context rot 仍在 | 索引、切片、回源和扩片 |
| 有损压 contract/schema/gate | 否定、exception、threshold 是否可能丢失？ | 治理失效 | protected segment manifest |
| 每文件 × 每 pattern × 每 agent | 对 10k 文件是否爆炸？ | 工具税吞噬收益 | 批处理、脚本、有界 fan-out |
| 只报告最佳单次 run | 是否报告波动和最坏分层？ | 把噪声当收益 | 重复 run、holdout、分位与 CI |

---

## 4. 具名模块、适用性与 ownership

### 4.1 模块选择表

| 模块 | 适用信号 | 可省略条件 | 主要 consumer |
| --- | --- | --- | --- |
| ArchitectureFit | 计划引入或优化 multi-agent | 已确定 single-agent 且无拓扑变更 | owner、orchestrator |
| ProgressiveDisclosure | active fixed 过大、冷路径多 | skill 已短且所有内容每次必需 | canonical v2、skill author |
| TopologyBudget | reviewer/validator/round 形成主乘数 | single-agent 或 agent 已最小必要 | multi-agent orchestrator |
| ContextSlicing | 动态全文被多个 leaf 重复消费 | 输入很短或跨文档依赖不可切 | orchestrator、leaf |
| RuntimeHygiene | history/tool result/output 持续累积 | 单轮短任务 | long-horizon agent |
| DeterministicFloor | bytes/hash/schema/index/freshness 可机械获取 | 没有确定性候选 | scripts/tools |
| Measurement | 要改变默认策略或声称收益 | 只做不改变行为的局部文案修正 | owner、evaluator |
| HostAccelerators | fan-out 已可控且目标是 billed/latency | 能力未知、复用不足或 restricted data | target host |

未选模块记录 `not_applicable` 与理由即可；不要为了“完整”强迫低风险任务走全栈。

### 4.2 Dynamic context criticality

正文 criticality 继续使用 canonical v2 的 Body-L1/L2/L3。对动态上下文，补充以下处置：

| 动态内容 | 默认手段 | 禁止 |
| --- | --- | --- |
| Contract、schema、否定、threshold、exception | 精确保留、近距离注入 | 黑盒摘要、token deletion |
| Evidence anchor、授权与 completion evidence | source ref + 必要 quote + hash/freshness | 只留“已验证”叙述 |
| Document/diff/log | index、slice、expand-on-demand | 全员全文、不可回源摘要 |
| History/tool results | compaction、clearing、decision ledger | 无界重放 |
| Restricted context | 最小授权窗口、脱敏、短期留存 | 为 cache 扩大稳定前缀 |
| Secrets | 工具侧安全注入 | prompt、artifact、ledger、cache key |

### 4.3 Ownership

| Owner | 负责 | 不负责 |
| --- | --- | --- |
| Project source | intent、spine、reference、profile 语义、eval inputs | 让 runtime mirror 反向成为真相源 |
| Scripts/tools | 路径、bytes、schema、hash、freshness、usage 原始字段 | reviewer、finding、risk、产品优先级 |
| LLM/orchestrator | ArchitectureFit、profile、roster、slice、finding、停止判断 | 伪造 usage、cache、验证结果 |
| Leaf/validator | 最小 scope 内判断与 evidence 回源 | 重启 workflow、扫描无关父会话 |
| Host | agent、model、cache、context、permission primitive | 定义 project-owned intent/evidence |
| Human/owner | 价值、默认 policy、高风险与不可逆取舍 | 被低风险路径强迫逐次批准 |

---

## 5. TopologyBudget、slicing 与 runtime hygiene

### 5.1 Profile 是待测策略

| 维度 | lite | standard | full |
| --- | --- | --- | --- |
| 目标 | 低风险快速判断 | 默认成本—质量平衡 | 显式深审/高不确定性 |
| Reviewer | 最小必要 pass | risk-selected roster | 全部适用角色或等价覆盖 |
| Validator | 仅 claim-critical | 严重度/冲突/证据触发 | 深审合同定义 |
| Context | 强切片 | reviewer-specific | 必要时扩大 |
| Rounds | 单轮优先 | 有新 evidence 才升级 | 按深审退出条件 |
| Output | 紧凑 finding | 单一 artifact + 必要 quote | 按深审合同 |

任何默认人数、优先级或 validator 上限都是 profile experiment。运行前应显示 cost shape，但 cost shape
只描述实际选择，不证明质量充分。

### 5.2 Isolation、cascade 与独立性

- leaf prompt 自包含 objective、scope、schema、persona、slice 和输出合同；
- 支持时使用最小 parent-context inheritance；不支持则记录 `degraded_inherited`；
- 默认链为 `pre-facts → primary → risk specialist → claim-critical validation`；
- 高风险 surface 可直达 specialist；没有新 evidence 或 risk surface 时停止加派；
- 同一 agent 多 lens、共享完整推理轨迹或共同摘要不构成独立 corroboration；
- 普通预算不能静默丢弃 P0/P1，只能升级、阻断 claim 或 loud degraded。

### 5.3 Slice Sufficiency Contract

每个 slice 或 evidence bundle 至少记录：

```text
consumer
source_refs
selection_reason
protected_anchors
expansion_trigger
fallback_if_insufficient
freshness
```

Scripts/tools 可准备 section/hunk index、hash、changed files、caller/callee candidates 和 source refs；
LLM 判断 slice 是否足以支持 correctness、security、testing 或 doc-contract claim。

必须覆盖三类反例：

1. 跨片依赖：关键条件位于相邻 section/file；
2. distractor：相似但错误的 evidence 与正确 evidence 同时出现；
3. expansion：leaf 能识别“不够”并扩大，而不是在窄片上强行给结论。

### 5.4 Reference reachability 复用 canonical

不要新建第二个 reachability contract。本文只在 canonical STOP trigger 四件套上增加 consumer：

| Reference | Consumer | trigger_condition | must_read | fallback_if_unread | eval_case |
| --- | --- | --- | --- | --- | --- |
| `migration-review.md` | migration specialist | 检测到 schema/data migration | dispatch 前一跳读取 | 升级 full 或声明未覆盖 | 触发与不触发各一例 |

路径存在只能证明结构可达。默认策略 promotion 仍需 fresh-source positive/negative eval 验证真实加载与 fallback。

### 5.5 Ledger、output 与 compaction

- evidence ledger 只证明某 snapshot 观察到某 evidence，不证明 finding 成立；
- leaf 写一次完整 artifact，返回 path/status/IDs；orchestrator 按需读取详情；
- standard 路径不默认生成 full + compact 两份语义等价表示；
- 多轮保留 decision fingerprint、disposition、reason、evidence hash、open risk、invalidation；
- compaction 先最大化关键事实 recall，再逐步删除冗余；
- 必须保留授权边界、未决风险、source refs 和 completion evidence；
- tool-result clearing 只能删除已失去决策价值的原始结果。

---

## 6. Host capability、cache 与安全

### 6.1 Run-local Host Capability Matrix

Host capability 是带 provenance/freshness 的运行事实，不是本文维护的静态全局注册表。

| 能力 | confirmed evidence | degraded / unknown | claim 边界 |
| --- | --- | --- | --- |
| Skill discovery/loading | 可观察 metadata/body/reference 加载 | loader 行为未知 | IndexTax 与 disclosure 收益按 host 报告 |
| Context isolation | leaf 未继承完整父会话 | `degraded_inherited` | 不得声称已消除历史乘数 |
| Per-agent model override | 目标 leaf 模型可观察 | 全员继承 | 不得声称 cascade 成本收益 |
| Context editing/clearing | history/tool result 确实被裁剪 | 无 primitive 或不可观察 | 只能声明治理意图 |
| Usage telemetry | aggregate/cached/output 可读取 | proxy/unavailable | proxy 不得冒充 billed |
| Prompt cache | read/write/miss 可观察 | 策略或 retention 未知 | 只声明目标 host 的净 billed/latency |

记录来源可以是 host telemetry、runtime readiness、直接运行日志或透明代理。不得把 platform adapter 的静态支持、
provider advisory 或方法论文案当 confirmed runtime capability。

### 6.2 Cache 净收益

```text
NetCacheBenefit
= cache_read_savings
− cache_write_cost
− miss_and_churn_cost
− operational_complexity
```

- 只有 exact/stable prefix 与足够 reuse 才可能产生正收益；
- tool schema、system prompt、图片参数或稳定前缀变化可能破坏命中；
- hit rate 本身不证明净节省，必须同时记录 read/write/miss；
- cache 不降低 aggregate、fan-out 或输出 token，也不提升 finding 质量；
- provider 的 threshold、TTL、价格、breakpoint 和 retention 属 volatile facts，只在带日期的证据表记录。

### 6.3 Restricted context

Prompt cache、外部 compressor 或 artifact store 都不是 access-control contract：

- 使用前确认租户隔离、retention、地域、数据使用政策与用户授权；
- cache key、ledger、artifact 不含 secret；
- 不为命中缓存扩大私有或客户材料的稳定前缀；
- provider 能力或政策未知时关闭 accelerator，并记录 loud degraded；
- token 节省不能扩大未授权外发、持久化或跨 agent 传播。

---

## 7. Measurement、paired eval 与 promotion

### 7.1 操作化 decision sufficiency per token

`decision sufficiency per token` 是北极星，不是脚本直接计算的单一分数。

每个 eval case 应预注册当前任务的关键决策集合：

- route / architecture / scope 决策；
- mutation、verification、source/runtime、handoff 边界；
- claim-critical finding 或 requirement；
- 需要升级、停止或回源的条件。

建议同时观察：

| 维度 | 可观察信号 | Owner |
| --- | --- | --- |
| Decision coverage | 关键决策是否被识别并处理 | LLM/human rubric |
| Evidence adequacy | claim 是否有匹配 source/test/log 证据 | LLM/human judgment |
| Correction burden | 人工纠正、重跑、升级和 reopen 率 | scripts 计数 + human 解释 |
| Protected behavior | P0/P1、否定、exception、gate 保留率 | deterministic fixtures + FSE |
| Token denominator | aggregate input/output/tool-result；或 billed telemetry | scripts/host facts |

Promotion 红线：

> 成本下降但任一关键决策不充分，或纠正负担显著上升，不得声称 decision sufficiency 改善。

### 7.2 正交 Evidence Vector

以下是 closeout 词汇，不是新增持久化 schema：

```text
structure_contract = untested | passed | failed
behavior_quality   = not_run | concerns | passed
runtime_cost       = unavailable | proxy | observed
field_outcome      = unavailable | observed
```

| Claim | 最低 evidence |
| --- | --- |
| source/default path 变短 | `structure_contract=passed` + source delta |
| trigger/fallback/schema 成立 | canonical eval adequacy 对应 structural/semantic evidence |
| protected behavior 未退化 | `behavior_quality=passed` |
| aggregate 或 billed 下降 | `runtime_cost=observed`，且 treatment-aware paired comparison 在预注册成本指标上显示改善；proxy 只能声明估算 |
| 用户效率/纠正率改善 | `field_outcome=observed` |
| 默认 profile/policy 可 promotion | 满足 §7.7 完整 gate；`structure_contract=passed`、`behavior_quality=passed` 只是其中前提 |

不存在 `behavior → runtime → field` 的自动线性晋级。四个轴可以不同顺序获得，也互不替代。

### 7.3 Treatment-aware paired protocol

每个 experiment arm 必须声明：

```text
treatment
controlled_variables
dataset_split
protected_behaviors
cost_metrics
quality_metrics
promotion_threshold
rollback
invalidation_condition
```

规则：

- 只固定所有非 treatment 变量；
- prompt 结构实验保持模型一致；model cascade 实验显式只改变模型/路由；
- 数据分为 development、iterative validation 与 sealed promotion test；前两者用于实验循环，sealed test
  只在 winner 与阈值冻结后运行一次；
- sealed test 一旦暴露即失去独立性，必须补充或轮换后才能再次用于 promotion；
- 各 split 按风险、输入长度、host 或 workflow shape 分层；
- 不可固定 temperature/seed 时运行多次，报告中位、分位、最坏分层和不确定性；
- LLM judge 优先做 pairwise/pass-fail，并与人工标签校准；
- 同时报 route/reference trigger、tool selection、agent handoff 与最终 outcome；
- 禁止只报最佳单次 run。

**分层评估强度。** 不是所有 treatment 都需要完整的 sealed test protocol：

| Treatment 类型 | 最低评估 | sealed test | 示例 |
| --- | --- | --- | --- |
| 纯 prose/structure 变更 | before/after paired run + holdout cases | 不需要 | 删减段落、调整措辞、重组结构、合并重复内容 |
| Agent roster / gate 变更 | 完整 development + iterative validation | 推荐 | 增减 reviewer、调整 validator policy、修改 stop condition |
| Model routing / cascade 变更 | 完整 protocol + sealed test | 必须 | 切换 leaf model tier、引入 model cascade、改变 temperature/seed 策略 |

纯 prose/structure 变更不改变 agent roster、model routing 或 gate 逻辑时，使用简化的 before/after paired run（相同 snapshot、相同输入、相同模型）即可。完整 sealed test protocol 保留用于高风险 treatment。

### 7.4 Profile shadow calibration

优化现有 multi-agent 默认策略时，首先加入 `single-agent + on-demand specialist` 反事实 arm。只有直接证据已经
证明任务需要独立证据路径时才可豁免，并记录证据、适用范围与失效条件。

ArchitectureFit 通过后，候选 `lite` / `standard` promotion 前，再与 `full` 或等价完整覆盖做 shadow 对照：

- 关键 finding / requirement 漏检率；
- false-positive 与无效升级率；
- agent handoff、circular handoff 和重复调查；
- aggregate/output/tool-call/wall-clock；
- 用户决策与纠正负担。

`full` 只是校准 reference，不代表永久默认或绝对真相。若 full 本身质量不足，需要人工 gold 或 planted issue 补强。

### 7.5 Compression FSE 专项最小集

fresh-source eval 的通用权威仍在 canonical v2。压缩专项至少覆盖：

1. route 正/负；
2. reference 触发与不触发；
3. 未读 hard boundary 时 stop / upgrade / degraded；
4. slice 后 leaf 未被重新注入全文；
5. isolation confirmed 或 loud `degraded_inherited`；
6. protected decisions、finding、output 和 gate 未退化；
7. not-run 有原因，不冒充通过。

Deterministic link/schema/orphan PASS 不等于语义 FSE PASS。

### 7.6 实验执行 handoff

本文负责定义领域输入；**会产生 project-owned source/config diff** 的实验循环交给 `spec-optimize`：

| 本文产物 | `spec-optimize` 输入 | 状态 |
| --- | --- | --- |
| optimization outcome | metric objective | supported |
| mutable/immutable source | scope | supported |
| protected behavior | degenerate hard gates / judge rubric | supported |
| treatment-aware arms | hypothesis backlog | **[aspirational]** — spec-optimize schema 尚无 treatment_arm / A/B 结构 |
| budget 与停止条件 | execution/stopping | supported |
| paired metrics | measurement command / judge config | **[aspirational]** — spec-optimize 支持单实验 judge，尚无 paired comparison 结构 |
| rollback/invalidation | integration 与 post-run policy | **[aspirational]** — spec-optimize schema 尚无 rollback / invalidation 字段 |

cache、per-agent model override 或 context editing 若只改变 host-local runtime、没有可纳入
`scope.mutable` 的 project-owned diff，则只做 run-local capability/measurement observation。它们在
`spec-optimize` 支持 non-mutating treatment 前保持 deferred，不为此扩建 Optimize schema/runtime，
也不得在本文旁边新建实验 branch、日志、并发、winner integration 或恢复机制。

**降级执行路径。** 当 `spec-optimize` 不支持所需 treatment 类型且上述 deferred 会无限期阻断实验时，允许手动 before/after 测量作为降级路径：

1. 记录 run log（snapshot、prompt、输入、模型、时间戳）；
2. 从宿主 telemetry 或透明代理收集 billed token、wall-clock、tool-call 计数；
3. 人工判断关键 finding/decision 的覆盖与质量；
4. 在 closeout 中显式标记 `execution_mode=manual_observation` 并记录 limitations。

此降级路径不替代 automated experiment loop——它的产出是 observation 而非 sealed evidence，不能单独支持默认策略 promotion。它只是防止"完全不做"，符合 §6.1 的 degraded-mode 哲学。

### 7.7 Promotion 与停止

默认策略 promotion 至少满足：

```text
structure_contract = passed
AND behavior_quality = passed
AND primary_objective_evidence = observed_and_improved
AND P0/P1/关键 decision 未丢失
AND human correction burden 未越线
AND host degradation、rollback、invalidation 已记录
AND NetLeverage > 0（已扣除可归属的 implementation、maintenance、human correction 与其他 GovernanceTCO）
```

`observed_and_improved` 必须匹配预注册主目标：成本优化需要目标 host 的 observed runtime 改善；用户效率、
纠正负担或 not-run 优化需要 observed field outcome。只有 proxy 或预测时保持 experiment，不晋级默认策略。

停止继续压缩或加派的条件：

- 剩余候选主要是 hard contract、anchor、restricted boundary；
- 无新 evidence、risk surface 或 claim-critical finding；
- 边际节省低于 reference/test/host/TCO；
- 质量红线、漏检率或人工纠正率越线；
- 收益依赖未确认 host capability；
- 样本不足以区分收益与随机波动；
- 当前上下文已经能支持充分决策。

---

## 8. 按 skill 形状选择组合

| Skill 形状 | 推荐组合 | 首要问题 |
| --- | --- | --- |
| Single-agent workflow | Measurement foundation → canonical disclosure → deterministic floor → runtime hygiene；仅在评估引入或恢复 multi-agent 时加入 ArchitectureFit | active fixed / history |
| Multi-agent review/research | Measurement foundation → ArchitectureFit → topology → slicing → output/ledger → disclosure | fan-out / dynamic |
| Entry governor | Measurement foundation → metadata routing → route-collision eval | index / 误激活 |
| Setup/validation | Measurement foundation → deterministic facts → 最小 semantic handoff → preview-first | 重复 prose / 假验证 |
| Long-horizon loop | Measurement foundation → notes/ledger → compaction recall guard → clearing → stop | runtime accumulation |

### 8.1 `spec-doc-review`

专项关注点：

- multi-agent 是否比 coherence + feasibility + on-demand specialist 更有净收益；
- profile shadow calibration；
- unified artifact section slicing 与 legacy full-document 成本诚实；
- decision primer、finding output 与 artifact 单一表示；
- reference trigger、fallback 和 slice expansion 的 FSE。

任何当前人数、优先级和落地状态都回到 source、tests 与分析报告确认，不写进本文为永久事实。

### 8.2 `spec-code-review`

专项关注点：

- isolation 与继承历史的隐藏乘数；
- risk-selected reviewer 与 claim-critical validator；
- diff/hunk/call-path evidence bundle；
- validator 批处理与独立性；
- small、mixed、auth/migration 等分层 holdout。

大 review 的主要成本通常近似：

```text
agent count × dynamic context × validator/round multiplier
```

因此只压主 `SKILL.md` 不能证明已改变整体成本形状。

### 8.3 有损动态压缩准入

LLMLingua、LongLLMLingua 或 abstractive compressor 默认不是第一步，但满足以下全部条件时可作为早期可逆 pilot：

1. 动态辅助材料占 aggregate 的主导份额；
2. canonical disclosure、retrieval 与 slicing 后仍超预算；
3. contract、schema、否定、threshold、exception、evidence anchor 已进入 protected manifest；
4. 原始材料可回源，压缩输出标记 `lossy/advisory`；
5. paired eval、rollback、数据授权与 retention 已定义；
6. eval 植入未列入 protected manifest 的隐藏关键证据，并验证发现率不退化。

Lossy 输出只能作为辅助索引或候选生成。所有 claim-critical 结论必须检索可搜索的原始材料并回源；
压缩率不是 promotion 指标。必须同时测量已知/隐藏关键事实 recall、distractor 选择、引用准确性、拒答/幻觉
和纠正负担。

---

## 9. Rollout 与归因

### 9.1 分支顺序

```text
Measurement foundation
├─ Single-agent
│  └─ fixed/disclosure → deterministic floor → runtime hygiene
└─ Multi-agent
   └─ ArchitectureFit → topology/isolation → slicing/output → fixed/disclosure

Optional after the main bottleneck is controlled
└─ cache/model/context editing/lossy experiments
```

**琐碎优化豁免。** 满足以下全部条件时，可跳过 Measurement foundation：

- (a) 只删除确定不触发的内容（unreachable reference、死代码路径、不再使用的 section），或只做不影响语义的机械修正（笔误、计数修正、术语标准化）；
- (b) 不改变任何 trigger condition、schema、contract、threshold 或 gate 逻辑；
- (c) `structure_contract=passed` 可在不新建 measurement 的情况下通过现有 deterministic tests 验证。

此类改动只需记录 diff 和 structure 验证结果即可 close。若改动范围超出上述任一条件，回退到完整 Measurement foundation 路径。

**渐进式 measurement 路径。** 对于首次优化或低频优化（每月 &lt;3 次 prompt 变更）的 skill，允许 measurement 与 treatment 并行，而非必须先完成完整 Measurement foundation 才能进入任何优化分支：

1. 在首次变更中同时建立 baseline（snapshot、token shape、关键 decision set）和执行优化；
2. protected behavior 和 TCO 范围可在优化完成后补齐；
3. closeout 中显式标记 `measurement_mode=progressive` 并记录未在 treatment 前完成的 baseline 项；
4. 此路径的产出不能单独支持默认策略 promotion——promotion 前必须补齐完整 baseline 并通过 paired eval。

当连续 2 次 progressive measurement 均发现净收益后，升级到完整 Measurement foundation 路径。

这不是强状态机。目标是让落地顺序跟随真实瓶颈，并保持实验可归因。

### 9.2 Closeout

| 工作面 | 最低 closeout | 不足时诚实标签 |
| --- | --- | --- |
| Measurement foundation | baseline、decision set、protected behavior、TCO 范围 | `measurement_missing` |
| Disclosure | canonical STOP contract + structure test；行为 claim 另需 FSE | `behavior_pending` |
| Topology/slicing | ArchitectureFit、cost shape、shadow/FSE、stop condition | `topology_text_only` |
| Host accelerator | target host direct evidence + net economics | `accelerator_unverified` |
| Lossy experiment | protected manifest + paired recall/quality + rollback | `lossy_unverified` |

每个工作面分开报告 source、aggregate、billed、output、quality、field 与 TCO；不得跨面合并归因后声称
“已完成 token 优化”。

---

## 10. 优化提案模板

```markdown
# <skill> Prompt Compression Proposal

## Goal / Non-goals
- outcome / claim_scope / non_goals:
- target source / generated-runtime impact:

## Baseline
- source_snapshot / host / model / profile:
- architecture_fit:
- index / active-fixed / fan-out / runtime / output:
- actual_usage_or_proxy:
- human_decision_cost / governance_tco:
- protected_decisions / known_failures:

## Selected Modules
- chosen modules / not_applicable modules:
- consumer / smallest-sufficient rationale:

## Reference And Slice Contracts
- canonical STOP trigger refs:
- slice source_refs / anchors / expansion / fallback:

## Evidence Vector
- structure_contract:
- behavior_quality:
- runtime_cost:
- field_outcome:

## Treatment-aware Evaluation
- treatment / controlled_variables:
- development / iterative_validation / sealed_promotion_test:
- shadow reference / repeated runs / metrics:
- threshold / rollback / invalidation:

## spec-optimize Handoff
- source-mutating treatment / metric / scope / gates-or-rubric / budget:
- measurement command or scaffold plan:
- non-mutating host observation / deferred limitations:

## Security / Degradation / Closeout
- restricted context / host limitations:
- claim wording / expected net benefit / re-evaluation date:
```

这个模板是 planning input，不是 schema 或 checker contract。只有当出现稳定 consumer 和确定性不变量时，
才考虑把其中字段提升为 machine-readable artifact。

---

## 11. 验收 Checklist

### 所有方案必过

- [ ] 问题有 baseline，不为行数或整洁度单独优化
- [ ] 权威回到角色契约、canonical v2 与当前 source
- [ ] ArchitectureFit 已判断；multi-agent 不是未经验证的默认
- [ ] 明确 source、aggregate、billed、output、quality、field 与 TCO 的 claim 边界
- [ ] hard contract、否定、exception、threshold、evidence anchor 未进入有损路径
- [ ] scripts 只准备 deterministic facts；LLM/human 负责语义判断
- [ ] 没有手改 generated runtime mirror
- [ ] treatment、controls、development/validation/sealed test、rollback、invalidation 已写明
- [ ] evidence vector 与最终 claim 匹配
- [ ] 达到 decision sufficiency 或边际收益不足时停止

### 选择 ProgressiveDisclosure 时

- [ ] 复用 canonical Body-L1/L2/L3 与 STOP trigger 四件套
- [ ] reference 有 consumer，未触发不读，未读有 fallback
- [ ] static link/orphan 与 semantic positive/negative FSE 分开验证

### 选择 TopologyBudget / ContextSlicing 时

- [ ] multi-agent 有独立证据方向或真实并行价值
- [ ] 默认 multi-agent 与 single-agent + on-demand specialist 反事实 arm 对照，或记录可证伪的豁免证据
- [ ] leaf 最小继承；degraded inheritance loud
- [ ] slice 有 source refs、protected anchors、expansion 与 fallback
- [ ] profile 与 full/equivalent shadow 对照漏检和成本
- [ ] validator 独立性、预算和停止条件真实
- [ ] output 单一表示，tool-call 对大体量输入有界

### 选择 HostAccelerators / lossy experiment 时

- [ ] host capability 有直接 evidence、freshness 与 limitations
- [ ] cache 同时报 read/write/miss 与净收益
- [ ] model cascade 只改变 treatment 变量
- [ ] restricted context 未因 cache/compressor 扩大暴露
- [ ] lossy 输出可回源、有 protected manifest 与 recall/quality eval
- [ ] claim-critical 结论回查原始材料；eval 覆盖 manifest 外隐藏关键证据

### Closeout

- [ ] 实验执行复用 `spec-optimize`，未重建第二套 loop
- [ ] 默认策略有与预注册主目标匹配的 observed improvement；proxy-only 保持 experiment
- [ ] 随机输出有重复 run、波动和最坏分层
- [ ] 未用行数、cache hit、单次成功或 self-review 冒充 outcome
- [ ] CHANGELOG、docs、tests/fixtures 与 downstream consumer 已按实际影响更新
- [ ] 未执行的验证明确写 not-run 与原因

---

## 12. 外部证据、新鲜度与失效条件

`last_verified: 2026-07-14`

| 来源 | 支持的判断 | 局限 / 失效条件 |
| --- | --- | --- |
| [Agent Skills Specification](https://agentskills.io/specification) | metadata/instructions/resources、正文与一跳 reference 建议 | client 实现和加载行为仍需按 host 确认 |
| [Anthropic: Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) | progressive disclosure、互斥 context、code-as-tool、evaluation-first | 主要描述 Claude/Agent Skills 生态 |
| [Anthropic: Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 最小充分 context、JIT、compaction、notes、subagent isolation | 技术与宿主 primitive 持续变化 |
| [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) | 从简单方案开始、routing、parallelization、orchestrator-worker、evaluator | 模式是启发式，不是固定 workflow |
| [Anthropic: Multi-agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) | multi-agent 的性能/成本权衡、并行适配、协调与 eval | 内部 research eval 不直接证明 coding/review 收益 |
| [Trail of Bits: Designing Workflow Skills](https://trailofbits.com/skills/designing-workflow-skills/) | description routing、一跳 reference、phase、批处理、10k-file 测试 | 部分 tool/frontmatter 规则是 Claude-specific |
| [OpenAI: Evaluation Best Practices](https://platform.openai.com/docs/guides/evaluation-best-practices) | eval-driven、真实分布、人工校准、multi-agent handoff eval | 产品化 Evals surface 正在迁移；只采纳方法原则 |
| [OpenAI: Trace Grading](https://platform.openai.com/docs/guides/trace-grading) | 对 tool、handoff、orchestration 轨迹做结构化评估 | 具体 API/产品 surface 可变 |
| [OpenAI: Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) | exact prefix、read/write telemetry、breakpoint 与净成本意识 | threshold、价格、TTL、retention 随模型变化 |
| [Chroma: Context Rot](https://research.trychroma.com/context-rot) | 长输入、distractor、语义相似度导致非均匀退化 | benchmark 不直接等于 spec-first workflow |
| [LLMLingua](https://github.com/microsoft/LLMLingua) | token selection、structured protected segment、有损动态压缩 | 需目标模型/任务 paired eval；不适合 hard contract |
| [RECOMP](https://github.com/carriex/recomp) | extractive/abstractive retrieval compression 与 selective augmentation | 主要面向 RAG/QA，不直接证明 skill prompt 效果 |
| [Lost in the Middle](https://arxiv.org/abs/2307.03172) | 长上下文位置偏差 | 模型代际变化时重验 |
| [FrugalGPT](https://arxiv.org/abs/2305.05176) | 模型 cascade 的成本—质量思路 | 不外推固定路由阈值 |

外部材料默认是 advisory。关键结论进入默认策略前，必须回到当前 source、host telemetry、tests、paired runs
和 field evidence。模型、host、cache、retention、定价、数据政策或 loader 行为变化时，应按受影响 claim 重验，
而不是整份方法论永久失效或永久有效。

---

## 13. 一句话方法论

```text
先确认优化与多 agent 架构值得存在；
再处理最大运行乘数和最小充分上下文；
实验交给既有 optimization harness；
最后用正交的结构、行为、成本、现场与 TCO 证据决定 promotion。
```

---

## Deferred / Open Questions

### From 2026-07-14 review (R2)

- **"decision sufficiency per token" 缺乏可操作化定义** — §7.1 (P2, adversarial, confidence 75)

  "decision sufficiency per token" 被定义为北极星但缺乏可操作的充分性标准——五个观察维度各自产生信号，但何时整体"充分"无定义。建议按任务类型定义 sufficiency checklist：对 doc-review 至少覆盖 P0/P1 finding 无漏检 + 关键架构判断被识别 + correction burden 未上升；对 code-review 至少覆盖 correctness/security 关键路径 + 无假阳性升级。sufficiency 是 pass/fail gate，不是连续分数。

### From 2026-07-14 review (R3)

- **方法论自身的 GovernanceTCO 从未被估算** — §2.1 (P1, adversarial, confidence 75)

  方法论定义了 GovernanceTCO（实现、维护、drift 排查、人工确认）作为优化方案必须扣除的成本，但对自身的学习成本、应用成本和维护成本只字不提。如果方法论的 GovernanceTCO 超过其优化收益，应用方法论即为净负。建议给出预期成本范围，并明确当目标 skill 的年均 prompt 变更次数低于某阈值时，完整应用方法论的 TCO 可能超过收益。

- **spec-optimize non-mutating treatment 能力缺失导致一整类优化被阻断** — §7.6, §6 (P1, adversarial, confidence 75)

  spec-optimize 将 non-mutating treatment（cache、model override、context editing）无限期推迟，手动观察降级路径不能支持默认策略 promotion。这意味着 §6 的所有 host accelerator 优化在工具补齐前均缺乏 promotion 路径。建议：(1) 定义 spec-optimize non-mutating treatment 支持的 MVP；(2) 在补齐前，手动观察可晋升到 advisory optimization 级别；(3) 若长期不补齐，是否允许建立轻量替代测量脚本。
