# spec-first Skill Prompt 压缩优化组合方法论

> 用最小、可回源、可验证的上下文获得最高的 `decision sufficiency per token`，同时守住治理边界、
> 语义质量和跨宿主诚实性。

本文是 [`skill-prompt-设计与优化方法论-v2.md`](./skill-prompt-设计与优化方法论-v2.md)
的 **spec-first 专项 companion**，聚焦长 skill 与 multi-agent workflow 的真实 aggregate 成本。它不取代：

- [`结构化项目角色契约.md`](./结构化项目角色契约.md)：使命、权威与不可越过边界；
- [`skill-prompt-设计与优化方法论-v2.md`](./skill-prompt-设计与优化方法论-v2.md)：唯一 canonical playbook；
- `skills/`、`src/cli/`、contracts、tests：当前 runtime behavior 的 source of truth。

[`2026-07-14-spec-review-token-consumption-analysis.md`](../项目审查/2026-07-14-spec-review-token-consumption-analysis.md)
是问题证据快照。本文不声明优化已实施，也不把实验中的 reviewer 数、validator 上限或 profile 默认值提升为
durable contract。

---

## 1. 结论先行

```text
SpecFirstCompressionStack
= ProgressiveDisclosure
× TopologyBudget
× DeterministicFloor
× MeasurementPareto
+ HostAccelerators(optional, degraded)
− ForbiddenPatterns
```

1. **multi-agent 先压乘数，single-agent 先压固定项。** 少派一次无增量 agent，通常比继续缩短最终报告更有效。
2. **先无损结构化，再考虑有损算法。** spine、lazy reference、slicing、ledger、确定性投影优先；
   LLMLingua 类方法只处理可丢失、可回源、有 paired eval 的动态辅助材料。
3. **大窗口不等于有效上下文。** 长上下文仍有位置偏差与注意力稀释；关键 contract 应短、近、可达。
4. **profile 是待测成本/质量策略。** `lite`、`standard`、`full` 要显示 cost shape；具体人数和阈值经证据晋级。
5. **缓存、模型路由、context editing 是宿主加速器。** 缺失时 loud degraded，不能成为正确性依赖。
6. **claim 必须匹配 evidence。** 行数下降、aggregate 下降、账单下降、质量持平、field outcome 是五种不同声明。
7. **达到语义充分后停止。** 边际节省低于 trigger failure、维护成本或质量风险时，继续压缩是负优化。

---

## 2. 成本模型：期望成本、aggregate 与账单分开算

### 2.1 期望会话成本

```text
ExpectedSessionCost
= IndexTax
+ P(activation) × ExpectedActiveRunCost
```

- description 主要影响所有会话支付的 `IndexTax` 与误激活概率；
- spine、roster、slicing 只在激活后影响 `ExpectedActiveRunCost`；
- 不能用 active body 降幅外推所有会话，也不能忽略高频误路由。

### 2.2 单次 aggregate 成本

```text
T_active
= T_orchestrator_fixed + T_orchestrator_dynamic
+ Σ p(reviewer_i) × (T_fixed_i + T_dynamic_i + T_output_i)
+ Σ p(validator_j) × (T_fixed_j + T_dynamic_j + T_output_j)
+ T_peer_or_evaluator + T_history_and_tool_results
```

候选排序可参考：

```text
Leverage
≈ removable_tokens
× runtime_multiplier
× activation_frequency
× confidence_of_safe_removal
```

它只辅助 LLM/人排序，不是脚本自动裁决公式。

### 2.3 四类成本轴

| 轴 | 典型来源 | 首选机制 |
| --- | --- | --- |
| **Activation Index** | `name`、`description`、skill 索引 | trigger/exclude、route collision eval |
| **Active Fixed** | `SKILL.md`、公共 contract、默认 examples | spine、lazy reference、确定性下沉 |
| **Fan-out Multiplier** | agent、round、完整 diff/document、validator | isolation、profile、cascade、slicing、budget |
| **Runtime Accumulation** | history、tool result、重复 artifact | ledger、compaction、clearing、单一表示 |

通常优先级是：

```text
少派无增量 agent
> 少让一个 agent 读取完整动态上下文
> 压缩所有 agent 都加载的静态 prompt
> 缩短只生成一次的报告
```

### 2.4 三种 token 指标不可混用

| 指标 | 能证明 | 不能证明 |
| --- | --- | --- |
| **Aggregate context** | 所有 inference 总上下文量 | 实际账单、质量 |
| **Uncached / billed input** | 宿主计费与缓存复用 | fan-out 已下降、上下文更有效 |
| **Unique source bytes/tokens** | source/artifact 自身大小 | 运行时实际加载与重复次数 |

报告应分别给 aggregate、cached/uncached、output 与 source-shape。宿主不暴露 usage 时，只能报告透明代理值和
limitations，不能伪造真实 token 或账单降幅。

---

## 3. 业界方法的采纳判断

| 方法 | 业界结论 | spec-first 处置 | 边界 |
| --- | --- | --- | --- |
| Agent Skills progressive disclosure | metadata → instructions → resources 分层 | **Adopt** | 拆文件必须有 trigger 和 consumer |
| Context engineering / JIT retrieval | 选择最小高信号 instructions、history、tools、data | **Adopt** | retrieval 仍是 advisory，重要结论回源 |
| Workflow routing / cascade | 先简单，必要时增加 worker/evaluator | **Adopt with boundary** | roster 是语义判断，脚本只准备 facts |
| Long-context position research | 相关信息位置会影响利用效果 | **Design constraint** | 大窗口不能替代 spine、索引、切片 |
| Prompt caching | 稳定前缀可降低部分延迟与 billed input | **Optional accelerator** | 不降低 fan-out，不是 correctness/security gate |
| Model cascade / routing | 可优化成本—质量曲线 | **Host experiment** | 需 override、quality gate、degradation |
| LLMLingua / LongLLMLingua | 可预算化压缩长动态 prompt | **Experiment / Defer** | 禁止压 contract、schema、否定和 evidence anchor |

适合 spec-first 的默认顺序是：

```text
结构分层 → 条件激活 → 上下文切片 → 拓扑预算 → 运行时压缩 → paired eval
```

算法有损压缩位于最后，而不是第一步。

---

## 4. 内容 criticality 决定压缩手段

| 内容 | 默认位置 | 可用手段 | 禁止手段 |
| --- | --- | --- | --- |
| **Hard contract**：mutation、verification、source/runtime、handoff | spine/schema | 精确改写、去重、结构化、确定性校验 | 黑盒摘要、token deletion |
| **Behavioral anchor**：STOP、负面例、升级/退出 | spine 附近 | 少量 canonical anchor | 全部下沉、只留口号 |
| **Procedural detail**：冷路径、provider 细节 | lazy reference | 条件拆分、一跳直达、目录 | 默认全读 |
| **Examples/rubrics**：长示例、评分细则 | reference | 代表例、按场景加载 | example encyclopedia |
| **Dynamic evidence**：diff、document、日志 | artifact/slice | 索引、切片、ledger、回源 | 全员全文读取 |
| **History/tool outputs** | run artifact | compaction、clearing、fingerprint | 无界重放 |
| **Restricted context**：私有代码、个人/客户材料 | 最小授权窗口 | 最小化、脱敏、短期内存 | 为缓存扩大留存 |
| **Secrets**：credential、私钥 | 不进入 prompt/artifact | 工具侧安全注入 | 写入 skill、ledger、cache key、日志 |

两段 hard contract 即使语义相近，也可能分别承担正常、失败和 degraded 路径的不同退出义务；删除前必须确认
protected behavior，而不是只看文本相似度。

---

## 5. 八层组合模型与 ownership

```text
L0 Metadata Routing
L1 Contract Spine
L2 Risk-Based Activation
L3 Just-in-Time References
L4 Reviewer-Specific Context Slicing
L5 Evidence And History Compaction
L6 Cache-Friendly Runtime Layout
L7 Paired Quality/Cost Evaluation
```

| 层 | 机制 | 主要降低 |
| --- | --- | --- |
| **L0** | trigger + exclude + 定位；route eval | index、误激活 |
| **L1** | goal、boundary、hot path、STOP、exit | orchestrator fixed |
| **L2** | profile、risk roster、cascade、validator policy | agent/round 乘数 |
| **L3** | 一跳 reference、must-read、fallback | 冷路径 fixed |
| **L4** | section/file/hunk/call-path bundle | diff/document 重复 |
| **L5** | ledger、fingerprint、artifact path、clearing | history、重复调查 |
| **L6** | 稳定前缀、动态尾部、host degradation | billed input、latency |
| **L7** | paired fixtures、usage、quality、rollback | 误 promotion 风险 |

| Owner | 应负责 | 不应负责 |
| --- | --- | --- |
| **Project source** | intent、spine、reference、profile 语义、eval | 让 runtime mirror 反向成为真相源 |
| **Scripts/tools** | 路径、索引、bytes、schema、hash、freshness、projection | reviewer、finding、severity、产品风险 |
| **LLM/orchestrator** | 风险、profile、roster、slice、finding、升级/停止 | 伪造 usage、cache hit、验证结果 |
| **Leaf/validator** | 最小 scope 内判断与回源 evidence | 重启 workflow、读取无关父会话 |
| **Host** | agent、model、cache、context/permission primitive | 定义 project-owned intent/evidence |
| **Human/owner** | 价值、默认 policy、高风险取舍 | 被普通低风险路径强迫逐次批准 |

预算约束 dispatch、validation 和 completion 出口，不限制语义思考；这是 `gate the exits, not the thinking`。

---

## 6. 组合选择 Playbook

### Step 1：定义 outcome、claim 与 baseline

先区分用户问题：账单、延迟、context rot、not-run、误报还是决策负担？再明确要声明 source 变短、aggregate
下降、账单下降、质量持平还是 field outcome。

Baseline 至少记录：

- source snapshot、skill/profile/host/model；
- `SKILL.md`、默认 reference、persona、schema bytes/行数；
- reviewer、validator、round、tool call 数；
- document/diff bytes 与重复次数；
- actual usage，或标注误差的估算；
- protected behaviors、代表样本、已知 failure case；
- cache、model override、context isolation 的 confirmed/degraded/unknown 状态。

### Step 2：建立 Candidate Matrix

| 字段 | 含义 |
| --- | --- |
| `cost_axis` | index / active-fixed / fan-out / runtime |
| `candidate` | 删除、下沉、隔离、切片、批处理、缓存或换模型 |
| `criticality` | contract / anchor / detail / evidence / history / restricted |
| `current_multiplier` | 被多少 agent、round、session 消费 |
| `protected_behavior` | 不能退化的 route、boundary、finding、输出 |
| `authority` | script / LLM / host / human |
| `evidence_level` | 当前 claim 的证据等级 |
| `permission` | blocked / experiment / ready |
| `invalidation_condition` | 何时重新评估 |

优先处理 Leverage 高、criticality 低、可逆性强的候选。

### Step 3：按 skill 形状选主模块

| Skill 形状 | 主模块 | 首项 |
| --- | --- | --- |
| 单 agent workflow | ProgressiveDisclosure | spine、reference、deterministic handoff |
| multi-agent review/research | TopologyBudget | isolation、roster、slicing、validator policy |
| entry governor | Metadata Routing | trigger/exclude、route collision |
| setup/validation | DeterministicFloor | scripts facts、schema、reason_code |
| 长时 loop | Runtime compaction | notes、ledger、clearing、stop condition |

### Step 4：选择最小正交实验

| Arm | 改动 | 回答的问题 |
| --- | --- | --- |
| A | 基线 | 现状成本/质量是什么？ |
| B | disclosure | fixed 能省多少？ |
| C | isolation + slicing | 动态重复能省多少？ |
| D | roster + validator policy | fan-out 能省多少？ |
| E | B+C+D + floor | 组合 Pareto 是否更优？ |

不要同时改 description、roster、schema、模型和 evaluator 后再声称已找到收益来源。

### Step 5：实施可逆 pilot

- 改 source，不手改 generated runtime；
- 先新增 trigger、slice manifest、advisory profile，再删除旧承重文本；
- scripts 只做机械事实；高风险 surface 保留 specialist/validator 出口；
- 隔离、缓存、模型分层不可表达时 loud degraded；
- restricted context 的授权、留存和外发边界优先于 token 节省。

### Step 6：Promotion 与停止

只有 cost 与 protected behavior 同时通过才 promotion。出现任一情况应停止压缩：

- 剩余候选主要是 hard contract、anchor 或 restricted boundary；
- 边际节省低于 trigger/reference/test 维护成本；
- 质量下界触碰预设红线；
- 成本转移到更多工具、返工、validator 或用户纠正；
- 收益依赖未确认的 host 能力；
- 样本不足以区分收益与随机波动。

---

## 7. Progressive Disclosure 与 reference 可达性

### 7.1 Contract spine

主 `SKILL.md` 保留 objective/scope、hot path、五类 gate、STOP/升级/退出、reference map、deterministic handoff、
最小 output contract 和少量 behavioral anchors。

“低于 500 行”只是可读性提示，不是 gate。一个 520 行但只加载一次、边界清晰的 skill，可能优于 180 行但让
8 个 agent 全读大 reference 的 skill。

### 7.2 Reference Reachability Contract

每个 lazy reference 必须具备：

```text
consumer
trigger_condition
load_action
fallback_if_unread_or_missing
eval_case
```

| Reference | Consumer | Trigger | 未读 fallback | Eval |
| --- | --- | --- | --- | --- |
| `migration-review.md` | primary | 发现 schema/data migration | 升级 full 或声明未覆盖 | migration fixture |

规则：

- 从 execution spine 一跳直达；二跳必须说明理由并有端到端 eval；
- 互斥路径分开，未触发不读；大 reference 提供目录或稳定 anchor；
- 路径存在不等于运行时可达；静态测试查 link/consumer/orphan，语义触发由 fresh-source eval 验证；
- hard boundary 未读时应停止 completion claim、升级或显式 degraded，不能继续猜测。

Trigger 应描述可观察条件：

```text
弱：涉及复杂情况时读取 advanced.md
强：finding 跨越两个以上 trust boundary，或 evidence 无法解释跨服务传播路径时读取 advanced.md
```

---

## 8. Multi-agent TopologyBudget

### 8.1 Profile 是待测策略

| 维度 | `lite` | `standard` | `full` |
| --- | --- | --- | --- |
| 目标 | 低风险快速判断 | 默认质量/成本平衡 | 显式深审/高不确定性 |
| Reviewer | 最小必要 pass | 风险驱动 roster，有测量上限 | 全部适用角色或等价覆盖 |
| Validator | 仅 claim-critical | 按严重度/冲突/证据触发 | 深审合同定义 |
| Context | 强切片 | reviewer-specific | 必要时扩大/全量 |
| Rounds | 单轮优先 | 有新证据才升级 | 按深审退出条件 |
| Model | 默认继承 | 支持且有证据时分层 | 质量优先、仍可 degraded |

任何“默认 N 个 reviewer”“上限 M 个 validator”都是 **profile policy experiment**，不是本文永久阈值。运行前应
显示 cost shape，例如：

```text
profile=standard；reviewer=risk-selected；validator=claim-critical；
context_isolation=degraded_inherited；model_tiering=unsupported。
```

### 8.2 Isolation、cascade 与风险直达

- leaf prompt 自包含 goal、scope、schema、persona、slice 时，不继承完整父会话；
- 使用最小 `fork_turns` 或等价能力；必要语义用短 intent summary + source refs；
- 宿主不支持隔离，记录 `degraded_inherited` 并收窄收益 claim；
- 默认候选链为 `pre-facts → primary → risk specialists → claim-critical validation`；
- 高风险 surface 可直达 specialist；没有新 evidence 时停止 dispatch；
- `full` 是显式质量上限，不是未知文件的自动默认。

### 8.3 Validator 与独立性

| Claim | 策略 |
| --- | --- |
| P0/P1、安全、权限、迁移、跨服务 contract | 独立 validator + 最小 evidence bundle |
| reviewer 冲突、跨文件运行时 claim | 独立 validator 或扩大上下文 |
| 同 root cause 普通 finding | 可按文件/triage group 批量验证 |
| 机械事实 | orchestrator/script 回源 |
| advisory/residual risk | 不默认派 validator |

同一 agent 多 lens、共享完整推理轨迹或共同摘要不构成独立 corroboration；合并 persona 后不得继续声称
cross-reviewer agreement。普通预算不能静默丢弃 P0/P1，只能升级、阻断 claim 或显式 degraded。

---

## 9. 动态上下文、evidence 与 Deterministic Floor

### 9.1 Reviewer-specific slicing

工具准备 changed files、section/hunk index、hash、standards path、caller/callee candidates、scope/freshness；LLM 决定
correctness 跨文件链、security trust boundary、testing 行为/测试、doc contract section 和 validator evidence bundle。

“把全文落盘，再把路径发给所有 agent”只有在 leaf **选择性读取**时才省 token；全员仍读全文是伪优化。

### 9.2 Ledger、单一表示与历史

```json
{
  "head_sha": "...",
  "diff_hash": "...",
  "items": [{
    "evidence_id": "E-01",
    "source_ref": "src/a.js:42",
    "source_hash": "...",
    "quote": "...",
    "observed_by": ["correctness"],
    "claim_scope": ["F-03"]
  }]
}
```

- ledger 只证明在某 snapshot 观察到某 evidence，不证明 finding 成立；HEAD/hash/claim scope 变化即失效或回源；
- leaf 写一次完整 artifact，返回 path/status/IDs；脚本校验 schema 并投影字段；orchestrator 按需读取详情；
- 多轮只保留 decision fingerprint、disposition、一句 reason、evidence hash、scope、open risk、invalidation；
- compaction 必须保留授权边界和 completion evidence，不能只留下“已完成”的叙述。

### 9.3 Deterministic Floor

Scripts/tools 负责路径、bytes、索引、schema、enum、hash、freshness、manifest、字段投影和 usage 原始字段；
LLM/agent 负责 intent、风险、profile、roster、slice 充分性、finding、severity、升级/停止与 claim adequacy。

判断测试：

> 同一输入是否存在唯一、可重复、无需业务语义理解的正确输出？

若是，优先脚本化；若否，脚本只准备 facts，不把关键词或分数伪装成 semantic reviewer。

---

## 10. Host Accelerators 与安全边界

### 10.1 Cache / model / context editing

- **Prompt caching**：稳定 instructions/tools/schema/examples 在前，动态 intent/diff/history 在后；记录 hit/miss；
  cache miss 不改变行为。它不证明 aggregate、fan-out 或质量下降/提升。
- **Model tier/cascade**：只在确认 per-agent override 且 paired eval 通过时启用；否则记录
  `degraded_inherited|unsupported`。
- **Context editing**：优先删除失去决策价值的 tool results 和重复 history。
- **算法压缩**：只处理可回源动态辅助材料，标记 `lossy/advisory`；contract、否定、enum、threshold、exception、
  evidence anchor 不进入有损路径。

### 10.2 Restricted context 与 retention

Prompt cache 不是 access-control、data-residency 或 retention contract：

- 启用缓存/外部压缩 provider 前，确认租户隔离、保留期限、地域和数据使用政策；
- cache key、artifact、ledger 不含 secret；不为命中缓存扩大私有材料的稳定前缀；
- 只传当前 claim 所需片段；provider 能力/政策未知时关闭 accelerator 并 loud degraded；
- token 节省不能扩大用户未授权的数据外发、持久化或跨 agent 传播。

---

## 11. MeasurementPareto：证据等级与晋级

### 11.1 Claim / Evidence Ladder

| 等级 | 可支持 claim | 最低 evidence |
| --- | --- | --- |
| **E0 Hypothesis** | 可能降低成本 | 方程、候选分析 |
| **E1 Static** | source/default path 变短 | bytes/行数、link、结构 diff |
| **E2 Contract** | trigger/fallback/schema/projection 成立 | deterministic tests、negative cases |
| **E3 Behavioral** | 代表样本 protected behavior 未退化 | fresh-source paired eval、盲评/calibrated judge |
| **E4 Runtime** | aggregate/uncached/latency 在目标 host 下降 | 同 snapshot actual usage 或透明代理 |
| **E5 Field Outcome** | 用户效率/not-run/纠正率改善 | 真实运行与用户/运营指标 |

`E1` 不能声称账单下降，`E3` 不能声称 field outcome。默认 profile/roster/validator policy 至少需要 `E3`，并应
尽可能有 `E4`；宿主无 usage 时可 promotion 结构优化，但 cost claim 必须停在代理测量层。

### 11.2 Paired eval

固定相同 source snapshot、输入、scope、模型、工具权限；temperature/seed 可控则固定，不可控则多次 paired run。
预先声明 protected behavior、红线和 promotion threshold，使用盲评或 calibrated judge，报告中位/分位/最坏样本，
不只报最佳单次。

| 成本指标 | 质量指标 |
| --- | --- |
| aggregate、uncached/billed、output | P0/P1、关键 requirement、planted issue 保留率 |
| reviewer/validator/tool/round 数 | false-positive、validator rejection、用户纠正率 |
| diff/document bytes 与重复次数 | surviving actionable findings |
| wall-clock、cache hit/write | route/reference trigger precision/recall |
| 每个有效 finding 的 token 成本 | claim 与 evidence 匹配度 |

### 11.3 Promotion gate

```text
Go
= 成本达到预设改善
AND protected behavior 不退化
AND P0/P1/关键 requirement 不丢失
AND false-positive/用户负担未越线
AND host degradation 已记录
AND rollback/invalidation 可执行
```

新反例、模型/宿主变化、source drift、false-negative 或成本转移触发重评、降级或回滚。行数、cache hit、单次
成功和 self-review 都不是独立 promotion evidence。

---

## 12. spec-first 配方与当前优先级

| Skill 形状 | 推荐组合 | 主导收益 |
| --- | --- | --- |
| `spec-plan`/`spec-work`/`spec-debug` | Metadata → Spine → JIT → CLI handoff → compaction → eval | active fixed/runtime |
| `spec-doc-review`/`spec-code-review` | isolation → profile → risk roster → slices → validators → ledger → eval | fan-out/dynamic |
| `using-spec-first` | 精确 description → 薄语义地图 → 单入口 handoff | index/误路由 |
| setup/validation | deterministic facts → 最小 semantic handoff → preview-first | 生成路径 |

### 12.1 `spec-doc-review`

优先做 spine/synthesis 冷热分离、文档类型相关 profile、section slicing、decision fingerprint/ledger、短 requirements
与长 unified plan paired eval。

[`2026-07-14-002-refactor-spec-doc-review-roster-cost-shape-plan.md`](../plans/2026-07-14-002-refactor-spec-doc-review-roster-cost-shape-plan.md)
中的 roster 数量和优先级是 verification-pending 实验，不是 durable 默认。可沉淀的是：profile 显示 cost shape、
默认少派、`full` 显式可达、隔离缺失 loud degraded、切片后禁止再注入全文。

### 12.2 `spec-code-review`

优先做 context isolation、claim-critical validator、risk roster/cascade、persona-specific diff/hunk/call-path、artifact
单一表示、leaf progressive disclosure，再以 small/mixed/auth-migration 样本 paired eval。

```text
主要成本 ≈ agent 数 × 每个 agent 的动态上下文 × validator/round 数
```

只压主文件不能改变大 review 的成本形状。

---

## 13. 可复制的优化提案模板

```markdown
# <skill> Prompt Compression Proposal

## Goal / Non-goals
- outcome / claim_scope / non_goals:

## Baseline
- source_snapshot / host / model / profile:
- index / active-fixed / fan-out / runtime shape:
- actual_usage_or_proxy / evidence_level:
- protected_behaviors / known_failures:

## Candidate Matrix
| candidate | axis | criticality | multiplier | protected behavior | permission |

## Selected Combination
- layers / smallest-sufficient rationale:
- source-of-truth / generated-runtime impact:

## Reference Reachability
| reference | consumer | trigger | load | fallback | eval |

## Cost Shape / Ownership
- reviewer / validator / isolation / model / cache policy:
- script-owned facts / LLM-owned judgment / human decision:
- escalation / stop condition:

## Evaluation
- paired arms / cost metrics / quality metrics:
- threshold / target evidence level:

## Security / Degradation / Closeout
- restricted context / unsupported host behavior:
- promotion / rollback / invalidation / field observation:
```

可选 run artifact：

```json
{
  "source_snapshot": "<sha>",
  "skill": "spec-code-review",
  "profile": "standard",
  "reviewer_policy": "risk-selected",
  "actual_reviewer_count": null,
  "validator_policy": "claim-critical",
  "actual_validator_count": null,
  "context_isolation": "confirmed|degraded_inherited|unknown",
  "model_tiering": "confirmed|unsupported|unknown",
  "aggregate_input_tokens": null,
  "cached_input_tokens": null,
  "usage_source": "host|estimate|unavailable",
  "limitations": []
}
```

---

## 14. Rollout 与禁止项

```text
Track 0 Measurement floor
  → Track 1 fixed: description / spine / references / handoff
  → Track 2 multiplier: isolation / profile / roster / validator / slicing / ledger
  → Track 3 host: cache / model tier / context editing / lossy experiment
```

每轨分开归因；先做代表 skill 窄 pilot；未过 paired evidence 保持 experiment/opt-in；source 变更同步 CHANGELOG；
runtime generation 变化覆盖 supported platforms；generated mirror 只经 `spec-first init` 重建；机制就位后必须有
field observation 或重估条件。

| 方法 | 处置 | 原因 |
| --- | --- | --- |
| 有损压 contract/schema/gate | 禁止 | 会丢否定、例外、enum、anchor |
| 合并 persona 后继续算独立 agreement | 禁止 | 伪造独立性 |
| 脚本关键词决定 reviewer/finding | 禁止 | 越过语义判断 |
| 全局硬 token 截断 | 禁止默认 | 可能丢关键 evidence |
| 拆文件但默认全读 | 伪优化 | aggregate 不变、维护面增加 |
| diff 落盘但全员全文读 | 伪优化 | 动态乘数不变 |
| 只声明便宜模型/cache hit | 证据不足 | 能力或质量未证明 |
| 大窗口替代 retrieval/slicing | 反模式 | 位置偏差仍存在 |
| 为缓存扩大 restricted 前缀 | 禁止 | 扩大数据暴露 |
| 第二套路由/中心状态机 | 不做 | 重建 host primitive |
| LLMLingua 压动态辅助材料 | 后置实验 | 需 lossy 标记、回源、paired eval |

---

## 15. 验收 Checklist

### Scope / design

- [ ] 明确 index、active fixed、fan-out、runtime 目标，区分 aggregate/billed/output/source
- [ ] 记录 snapshot、host/model/profile、degraded、protected behavior、evidence level
- [ ] moved reference 具备 consumer/trigger/load/fallback/eval，且无 orphan
- [ ] hard contract/anchor 保留；profile 数字有 experiment 或 promotion 标记
- [ ] leaf 最小继承、语义充分 slice；切片后未再注入全文
- [ ] 独立性 claim 真实；scripts 只做 deterministic facts
- [ ] restricted/secret 未因 cache/artifact 扩大暴露；未手改 runtime mirror

### Verification / closeout

- [ ] static link/schema/projection/negative tests 已运行
- [ ] fresh-source positive/negative eval 已运行或显式 not-run/degraded
- [ ] paired arms 使用相同 snapshot/input/model/permission；随机输出有多次 run 与波动报告
- [ ] 同时报成本与质量；claim 未超过 evidence ladder
- [ ] promotion、rollback、invalidation、field observation 明确
- [ ] 未用行数、cache、单次成功或 self-review 冒充 outcome

---

## 16. 外部参考与新鲜度

`last_verified: 2026-07-14`

- [Agent Skills Specification](https://agentskills.io/specification)：metadata/instructions/resources 分层。
- [Anthropic: Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)：
  progressive disclosure、互斥 context、code execution、evaluation-first。
- [Anthropic: Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)：
  JIT retrieval、compaction、structured notes、subagent isolation。
- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)：
  routing、parallelization、orchestrator-workers、evaluator 的适用边界。
- [Trail of Bits: Designing Workflow Skills](https://trailofbits.com/skills/designing-workflow-skills/)：
  description routing、phase entry/exit、一跳 reference、批处理与规模化 eval。
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching)：
  稳定前缀、动态尾部、cached/uncached usage。
- [Lost in the Middle](https://arxiv.org/abs/2307.03172)：长上下文位置偏差；不外推固定阈值。
- [FrugalGPT](https://arxiv.org/abs/2305.05176)：prompt adaptation、模型近似与 cascade 的成本—质量方法。
- [LLMLingua](https://arxiv.org/abs/2310.05736) / [LongLLMLingua](https://arxiv.org/abs/2310.06839)：
  有损动态 prompt compression；不用于承重 contract。

外部资料是 advisory。模型、host、cache、retention 或定价变化时应重验；外部 benchmark 不能直接证明
spec-first 收益，结论必须回到当前 source、tests、paired runs 和 field evidence。

---

## 17. 一句话方法论

```text
单 agent：先披露，再压固定项。
多 agent：先拓扑，再压单份 prompt。
所有 skill：先无损结构化，再考虑有损算法；用与 claim 匹配的 quality/cost evidence 决定默认。
```
