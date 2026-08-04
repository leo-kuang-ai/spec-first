# AI Coding Harness 演化方法论

> 用最小、可验证、可失效的机制，把正确意图更快地转化为可信变更。

本文是 `spec-first` 面向 AI coding harness 演化的精练方法论。它回答“面对一个能力设想或系统问题，应该如何判断和推进”，不定义具体 workflow、命令、schema、宿主实现或 runtime 路径。

权威关系：

- [`结构化项目角色契约.md`](./结构化项目角色契约.md) 定义使命、价值权重和 durable boundaries，是本方法论的上位 source of truth。
- [`docs/contracts/`](../contracts/) 定义当前实现映射和 living contracts。
- 本文提供可重复使用的判断顺序；与角色契约冲突时，以角色契约为准。

---

## 1. 核心目标

AI coding 的稀缺资源不是代码，而是正确意图、有效上下文、可靠反馈、验证能力和人的注意力。

```text
可信变更 = 清晰意图 × 有效上下文 × 有界执行 × 可核验证据 × 可失效学习
```

Harness 演化不追求更多 prompt、agent、skill 或自动化步骤，而追求：

- 更短的 `time-to-trusted-change`
- 更高的 `quality-adjusted throughput`
- 更低的澄清、返工、审查、验证和维护负担
- 更强的恢复、交接、复用和持续采用能力

任何局部提速，如果把成本转移给 reviewer、CI、集成、生产稳定性或未来维护，都不算系统改善。

---

## 2. 一条方法论主线

```text
Outcome
  -> Bottleneck
  -> Evidence
  -> Boundary
  -> Minimum Mechanism
  -> Bounded Loop
  -> Exit Proof
  -> Field Learning
```

含义是：先明确要改善的用户结果，再确认真实瓶颈；用证据建立边界，只建设最小机制；让 agent 在可恢复的 loop 中执行；最后用与 claim 匹配的证据决定能否完成、推广或沉淀。

不要从“我们可以新增什么能力”开始。

---

## 3. 八步判断法

### 第一步：定义用户结果

先回答：谁在什么任务中遇到什么阻力，改善后可观察结果是什么？

好的目标指向可信交付，例如减少需求误解、降低 review 返工或缩短验证时间。代码量、agent 数、artifact 数和调用次数只能说明活动量，不能说明价值。

### 第二步：确认当前瓶颈

区分：

- `confirmed fact`：有 source、test、log、field sample 或用户证据支持
- `hypothesis`：合理但尚未验证
- `aspirational`：希望未来成立，但当前缺激活路径或数据

没有 baseline 时，先测量、dogfood 或保持 opt-in，不宣称已经改善。

### 第三步：建立 claim 与 evidence 对应关系

每个结论都要问：它具体声称什么，哪类证据能覆盖它？

```text
结构存在       -> schema / source check
机械行为正确   -> deterministic test / log / exit code
语义方案合理   -> independent review / human correction
相对方案更好   -> matched baseline / blind comparison
真实研发有效   -> representative field outcome
```

Transcript、自检、测试绿灯、provider 输出或多 agent 共识都不能越过自己的 claim scope。

### 第四步：画清边界

每项能力至少明确：

- source：真相从哪里来
- producer：谁产生事实或 artifact
- consumer：谁实际使用
- authority：谁能决定语义、授权 mutation 或确认结果
- side effect：可能写什么、发出什么、暴露什么
- failure：如何降级、恢复、撤销或退役

有效 mutation authority 是任务授权、组织/仓库政策、目标 scope 与 host 实际权限的交集。外部工具的读取、数据外发、凭证使用和 mutation 权限应分别对待。

### 第五步：选择最小能力姿态

按以下姿态判断；它们是能力取舍，不是刚性成熟度状态：

1. **Adopt**：宿主原生能力已经足够，直接采用。
2. **Experiment / Defer**：价值未确认，先做可逆试验或暂缓。
3. **Wrap**：外部能力或实验有价值，但必须补权限、证据、可移植或降级边界。
4. **Build**：真实实验确认存在项目长期拥有、跨宿主且宿主无法提供的 durable gap。
5. **Thin / Retire**：已无 consumer、维护成本过高、制造多真相源，或能力已经商品化。

优先 Adopt；价值未确认时直接 Experiment / Defer；当实验对象存在权限、证据、可移植或降级风险时，只建设支撑实验的最小、可撤销 Wrap，不因此进入核心路径；真实证据确认 durable gap 后才 Build。

### 第六步：设计可收敛的执行 loop

一个可委托的 loop 必须具有：

- 明确目标、scope、权限和假设
- 环境可观察性与可执行反馈
- checkpoint、恢复点和结构化 handoff
- 时间、token、工具调用、mutation 和并发预算
- 收敛、停止和 human escalation 条件

重复尝试没有产生新证据、修改发生振荡、冲突持续增加或验证成本超过预期收益时，应停止扩张。

优化的是系统 WIP 和可信吞吐量，不是同时运行的 agent 数量。小批次、低冲突和快速反馈优先于最大并行度。

### 第七步：约束出口，而不是限制思考

脚本建立确定性地板，LLM 或 human 判断语义充分性。硬 gate 只守：

1. mutation
2. verification claim
3. source/runtime
4. handoff/context reset
5. knowledge promotion

只有宿主具备可验证的 blocking primitive 时，才能称为 hard gate；否则必须显式记录为 loud convention 或 degraded，不能伪装成已经硬强制。

### 第八步：让结果修正系统

`Trusted Change` 是 claim-scoped、带新鲜度且可撤销的状态，不是永久结论。生产结果、新反例或依赖变化可以触发：

- 变更信任降级
- 纠正或回滚评估
- harness 机制重估
- 关联 knowledge 更新或失效

同一次 run 产生的实现、自检、总结和知识草稿属于相关证据，不能互相提升权威。Durable knowledge 必须有独立信息增益、适用范围和 invalidation condition。

---

## 4. Context、Loop 与 Harness 的关系

Harness 不是静态指令集合，而是围绕决策和反馈组织环境。

### Context

目标不是加载最多内容，而是提高 `decision sufficiency per token`：相关、可信、新鲜、能改变当前判断。

### Loop

Loop 让 agent 通过环境反馈修正行动。可委托范围不得超过可观察和可验证范围；agent 无法检查的最终状态，不能由其 self-report 证明。

### Harness

Harness 负责把 context、权限、工具、反馈、证据、恢复和学习连接起来，但不替代 host runtime，也不替代 LLM 或 human 的语义判断。

跨宿主 portability 追求 project-owned intent、claim、evidence 与 knowledge 的语义可移植和可导出，不追求 host feature parity。

---

## 5. 评估方法

评估 harness 变化时，同时记录：

- 任务类型、风险和代码库熟悉度
- 模型、host、harness 和关键工具版本
- 人工主动工作、review、verification 和返工时间
- agent compute、排队、CI、merge 和冲突成本
- 质量、稳定性、缺陷、回退和持续采用信号

关键条件变化时重新建立 baseline，并说明无法排除的混杂因素。

效果评估至少覆盖两类价值：

1. 对相同任务，是否更快、更稳、更可信。
2. 是否扩大可行任务边界，使过去不会做、成本过高或难以并行的工作变得可行。

度量遵循 progressive rigor：低风险改动使用聚焦验证；进入默认路径或声称普遍效果时，才需要 comparative / field evidence。不要为度量本身建设统一指标平台。

---

## 6. 常见反模式

- 从工具、agent 或 framework 出发寻找用途
- 把 host primitive 重新实现为项目核心能力
- 用脚本替代架构、需求或 review 语义判断
- 用 LLM 声明替代测试、日志和环境结果
- 把协议连接成功当成权限、安全或证据可信
- 把 benchmark、demo 或单个成功案例当成普遍 field outcome
- 用最大并行度优化表面吞吐，忽略 review 和 integration backpressure
- 把 runtime mirror、cache、transcript 或 provider 输出升级为第二真相源
- 用一次 agent run 的自检和总结证明 durable knowledge
- 为所有任务增加相同 gate、artifact 和步骤

---

## 7. 最小演化提案模板

提出一个 harness 变化时，只需回答：

```text
User outcome:
Confirmed bottleneck / hypothesis:
Affected trusted-change factor:
Source / producer / consumer / authority:
Minimum mechanism:
Mutation and failure boundary:
Claim-specific verification:
Countermetric and baseline:
Degraded / rollback / retirement condition:
```

如果这些问题无法简洁回答，说明问题尚未收敛，或机制已经超过当前证据支持的复杂度。

---

## 8. 最终判断

每次演化只问：

> 它是否用最小可维护机制，更快地把正确意图变成可复核、可恢复、可撤销、可学习的可信结果，同时没有把隐藏成本转移给人、集成系统或未来维护？

答案不清楚时，优先补证据、收窄范围或保持实验；不要用更多自动化掩盖不确定性。
