# Spec-First Plan / Orchestrate Simplification Proposal

> 目标：在不破坏当前 stage gate、traceability 和 runtime 真源的前提下，收敛 `plan` 与 `orchestrate` 的职责边界，降低用户心智负担，并为后续可能的进一步瘦身保留回退空间。
>
> 结论先行：**当前不建议直接删除 `plan`**。更合理的路径是先把 `plan` 降级为轻量决策层，把 `orchestrate` 提升为唯一调度与推进入口，再观察是否具备退场条件。

## 1. 现状判断

当前实现里，`plan` 和 `orchestrate` 已经不是一个节点的两种叫法，而是两个独立职责：

- `dispatcher.ts` 对 `plan` 和 `orchestrate` 有独立分支。
- `context-resolver.ts` 把 `plan`、`orchestrate`、`task` 一起放进 background skills。
- `11-plan/SKILL.md` 已经定义了 `plan -> findings.md -> orchestrate` 的协同流程。
- `13-orchestrate/SKILL.md` 定义了编排主链：`plan -> skill -> verify -> advance`，但代码层并不会真的去调用 `plan` skill。
- `orchestrate-args.ts` 只控制编排模式和 stage advance，不会自动触发 `plan` 或其他 skill。

这意味着：

- `plan` 不是纯文档噪声，它有自己的 runtime notice 和输入契约。
- `orchestrate` 也不是 `plan` 的简单替代，它承担的是调度与推进控制。
- 直接删除 `plan`，会同时牵动文档、上下文注入、运行时 notice 和测试约束。

## 2. 代码证据

### 2.1 `plan` 和 `orchestrate` 是两个独立路由

在 [`src/core/skill-runtime/dispatcher.ts`](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/dispatcher.ts) 中：

- `skillName === 'plan'` 会注入 `buildPlanRuntimeNotice(...)`。
- `skillName === 'orchestrate'` 会注入 `buildOrchestrateRuntimeNotice(...)`。
- `dispatchCommand(...)` 没有把 `orchestrate` 转发为 `plan`。

这说明当前实现不是“先执行 plan 再执行 orchestrate”，而是两条并行路由。

### 2.2 `plan` 仍然参与 runtime 背景构建

在 [`src/core/skill-runtime/context-resolver.ts`](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/context-resolver.ts) 中：

- `BACKGROUND_SKILLS` 包含 `plan`。
- `SKILL_INPUT_MATRIX` 为 `plan` 和 `orchestrate` 提供了相同级别的背景资产契约。

这说明 `plan` 仍然是一个会吸收 runtime 背景的正式 skill，不是可以直接忽略的旧入口。

### 2.3 `orchestrate` 的职责已经足够重

在 [`src/core/skill-runtime/orchestrate-args.ts`](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/orchestrate-args.ts) 中：

- `--auto`、`--resume`、`--auto-advance` 已经定义了编排模式。
- `autoAdvance` 的语义只控制“是否推进阶段”，不控制“是否执行 skill”。
- `buildBackgroundInputGuidance(...)` 已经把背景完整度、依赖强度、风险类别和建议动作统一成编排层语义。

这意味着 `orchestrate` 已经是“决策 + 调度 + 推进”的中心，不需要再把 `plan` 强行变成它的子调用。

### 2.4 文档层已经把 `plan` 定义成决策层

在 [`skills/spec-first/11-plan/SKILL.md`](/Users/kuang/xiaobu/spec-first/skills/spec-first/11-plan/SKILL.md) 中：

- `plan` 的目标是产出执行计划、风险评估、下一步建议。
- `plan` 不推进阶段。
- 文档层约定 `plan` 产出的摘要会成为 `orchestrate` 的后续输入，但当前代码里没有自动读取 `plan` 摘要的实现。

在 [`skills/spec-first/13-orchestrate/SKILL.md`](/Users/kuang/xiaobu/spec-first/skills/spec-first/13-orchestrate/SKILL.md) 中：

- 编排主链写成 `plan -> skill -> verify -> advance`。
- 阶段映射则只调度 `spec / design / task / code / verify / archive`，并按需插入 `research / review`。

但这里还存在一个更关键的内部矛盾：

- 文本层把 `plan` 写成主链一环。
- 流程图层（`P1 -> P2 -> P3`）却是从“前置校验”直接跳到“调度目标 Skill”，图中没有独立的 `plan` 节点。

也就是说，`13-orchestrate/SKILL.md` 本身同时存在“文字层的 plan 主链叙述”和“图示层的 plan 隐身实现”两套表达。本文把这件事视为需要收敛的现状，而不是把文字层单独当成完整真相。

这说明当前文档设计至少在表达层面倾向于“保留 plan，但降低它的流程权重”；代码层尚未把这层约定完全显式实现。

## 3. 问题定义

当前用户真正困惑的不是“plan 能不能做”，而是：

- 是否必须在每次进入任务拆解前都先经历一个独立 plan 节点。
- `plan` 和 `orchestrate` 是否在重复表达同一件事。
- 这个中间层是否会增加流程成本，而不是降低流程成本。

如果不做收敛，`plan` 会持续面临三个问题：

- 语义重叠：它和 `orchestrate` 都在说“下一步是什么、风险是什么”。
- 使用成本：用户要多记一个节点。
- 文档膨胀：`plan` 和 `orchestrate` 会不断复制同一套治理字段。

## 4. 推荐方案

### 4.1 方案选择

推荐采用：

- **保留 `plan`**
- **把 `plan` 降级为轻量 advisory node**
- **把 `orchestrate` 设为唯一调度与推进入口**

这是最稳的减法，原因是：

- 不会直接打断现有路由。
- 不需要立即重写 `task` 和 `code` 的前置假设。
- 可以保留复杂 Feature 的显式规划能力。
- 未来如果确实不再需要 `plan`，再做退场会更安全。

### 4.2 最小目标态

目标态建议收敛成：

- `design`：产出方案。
- `plan`：产出路线、风险、阻塞和下一步建议。
- `task`：把设计拆成可执行 TASK。
- `code`：按 TASK 实现。
- `review`：做审查。
- `verify`：做验收。
- `archive`：做归档。
- `orchestrate`：做调度与推进，不承担业务产出。

### 4.3 `plan` 的保留边界

保留以下能力：

- 当前阶段要走哪条路线。
- 当前阻塞是什么。
- 风险等级是什么。
- 下一步先做什么。
- 是否建议先走 `orchestrate` 或补齐背景。

收缩以下能力：

- 不重复设计内容。
- 不拆 TASK。
- 不推进阶段。
- 不替代 `orchestrate`。
- 不把自己扩展成第二套门禁系统。

## 5. 代码改造方案

### 5.1 `skills/spec-first/11-plan/SKILL.md`

建议调整为：

- 明确 `plan` 是可选的轻量决策层。
- 把“plan 必经”改成“复杂场景推荐先 plan”。
- 保留 `findings.md` 的计划摘要、风险和下一步建议。
- 删除会暗示 `plan` 负责推进阶段或承接大量执行职责的表述。

### 5.2 `skills/spec-first/13-orchestrate/SKILL.md`

建议调整为：

- 把 `orchestrate` 明确成唯一调度入口。
- `plan` 从“流程必经步骤”降为“可选输入摘要”。
- `--plan-only` 可以作为后续可选 mode，用来兼容纯规划场景。
- 阶段映射继续只保留主链 skill，不把 `plan` 写成必须调度目标。

### 5.3 `skills/spec-first/shared/orchestration-governance-contract.md`

建议继续保留，但语义上要更清晰：

- `plan` 负责承接输入层治理信号。
- `orchestrate` 负责把治理信号投影为用户可见的决策和推进。
- 两者共享字段，但不共享职责。

### 5.4 `src/core/skill-runtime/dispatcher.ts`

建议保持两条路由，但收敛职责：

- `plan` 只生成 plan runtime notice。
- `orchestrate` 只生成 orchestrate runtime notice。
- 不在 `orchestrate` 内部直接调用 `plan` skill。
- 如果后续引入 `--plan-only`，也应是 `orchestrate` 的一个 mode，而不是让 `orchestrate` 反向依赖 `plan`。

### 5.5 `src/core/skill-runtime/context-resolver.ts`

建议保持 `plan` 作为 background skill，但细化其背景契约：

- 保留 `summary` 作为最小 required 资产。
- 继续复用 `entry-guide`、`critical-flows`、`structure-overview`、`api-contracts` 等背景资产。
- 不把 `plan` 的上下文权重扩大成第二套事实源。
- 注意 `BACKGROUND_SKILLS` 与 `SKILL_INPUT_MATRIX` 是联动的：`plan` 一旦被降级为轻量决策层，`context-resolver.ts` 里对 `plan` 的背景契约也要同步收窄，而不是仅改 UI 文档。
- 如果后续真的让 `plan` 退场，必须先确认 `orchestrate` 不再依赖 `plan` 的 runtime notice 或背景注入，再从 `BACKGROUND_SKILLS` 中移除它。
- 这一步需要测试锁边界：`plan` 的背景输入仍可用，但不应再隐含更高阶的执行语义。

### 5.6 `src/core/skill-runtime/orchestrate-args.ts`

建议把这份文件当成 `orchestrate` 唯一的模式入口：

- `single` 和 `auto` 已经足够表达执行策略。
- `autoAdvance` 只控制推进，不控制技能执行。
- 如果未来需要纯规划模式，可以把 `plan-only` 加在这里，而不是复制一条独立命令链。

## 6. 迁移顺序

### 6.1 第一步：文档收口

- 收敛 `11-plan/SKILL.md` 的职责描述。
- 收敛 `13-orchestrate/SKILL.md` 的主链表述。
- 收敛 `shared/orchestration-governance-contract.md` 的职责边界描述。

### 6.2 第二步：测试锁边界

建议新增或更新测试，锁住以下事实：

- `orchestrate` 不自动调用 `plan`。
- `plan` 仍然可独立调用，但不推进阶段。
- `orchestrate` 是唯一的编排与阶段推进入口。
- 两者共享治理字段，但不共享职责。

### 6.3 第三步：可选 mode 化

如果后续发现 `plan` 使用频率降低，可以增加：

- `orchestrate --plan-only`
- `orchestrate --auto`
- `orchestrate --auto-advance`

这样可以先验证 `plan` 是否真的能退场，而不是先删除再补救。

### 6.4 第四步：观察退场条件

只有在以下条件成立后，才考虑删除 `plan`：

- `orchestrate` 已能稳定覆盖纯规划场景。
- `plan` 的使用频率显著下降。
- 文档、测试、runtime notice 已不再依赖独立 `plan` 入口。
- 没有复杂 Feature 依赖 `plan` 作为显式决策层。

这里的“使用频率显著下降”与“稳定覆盖”必须可观测，而不是主观感受。建议用一个试运行窗口来判断，避免回退条件变成空话：

- 观察窗口：至少 5 个已完成 Feature，或至少 10 次 `orchestrate` 执行。
- `orchestrate` 计划摘要完整性：`findings.md` 中最新的 `Plan Summary` 或 `Decision Log` 必须同时包含 `Target Stage`、`Next Action`、`Blockers`、`Risk Level`、`Suggested Command` 五项；任一窗口内缺失率超过 10% 即视为不稳定。
- `plan` 退回调用率：试运行窗口内，若 `findings.md` 的 `Decision Log` 仍频繁出现“先走 plan 再继续”的人工回退记录，比例超过 20% 即视为不稳定。当前代码没有专门的 plan 调用埋点，因此这一项以 findings 记录为准，不应伪装成自动统计。
- 规划相关阻塞率：`gate-history.jsonl` 中对应阶段的 FAIL / WAIVER 记录，结合 `findings.md` 的 `Risks & Blockers`，若因“计划信息不足 / 下一步不明确 / 路线未收敛”导致 `task` 或 `code` 重试、回退或延迟的次数，相比收敛前基线增加 5 个百分点以上，即视为不稳定。
- 结论规则：上述三项里任意两项触发不稳定阈值，则保留独立 `plan` 路由；三项全部低于阈值且连续两个观察窗口成立，才进入退场候选。

换句话说，“退场不稳定”不是一句抽象判断，而是：

- `orchestrate` 产出的规划摘要不够完整
- `findings.md` 仍频繁出现显式回退到 `plan` 的决策记录
- 下游阶段因为缺少规划信息而反复阻塞

#### 判定数据源

当前版本不引入新的命令 telemetry，判定仅依赖现有运行态文件与落盘记录：

- `findings.md`：Plan Summary、Decision Log、Risks & Blockers、Next Steps
- `stage-state.json`：当前阶段、history、backgroundInputStatus
- `gate-history.jsonl`：阶段推进与 Gate 结果

如果后续实现新增 `audit.jsonl` 或命令级事件记录，可以把这套人工判定替换为自动统计；在那之前，不应把“调用率”写成已存在的自动化指标。

只要这些信号持续存在，就不应删除 `plan`。

## 7. 风险与回滚

### 7.1 直接删除 `plan` 的风险

- 会打断 `11-plan`、`context-resolver`、`dispatcher` 和治理 contract 的协同关系。
- 会逼迫 `orchestrate` 吞掉更多规划语义。
- 会让 `task` 变重，间接增加拆解质量波动。
- 会让复杂 Feature 的风险评估变得更依赖上下文，而不是显式流程。

### 7.2 回滚策略

如果收敛后发现 `plan` 退场不稳定：

- 保留独立 `plan` 路由。
- 保留 `findings.md` 计划摘要落点。
- 保留“`findings.md` 计划摘要可作为 `orchestrate` 输入”的文档层约定；若后续新增自动消费实现，则一并保留该接口。
- 不回退 stage truth-source。

## 8. 验收标准

满足以下条件时，说明改造方向成立：

- 用户可以只记 `orchestrate` 作为主调度入口。
- `plan` 仍可用，但不会被误解成阶段推进器。
- 在推荐主链中，`task` 的默认上游输入来自 `design` 产物与 `plan` 摘要，而不是要求 `task` 运行时强依赖独立 `plan` 调用。
- 文档中不再混淆 `plan` 和 `orchestrate` 的职责。
- 运行时不再把 `plan` 伪装成另一种推进命令。

## 9. 结论

当前代码不支持“直接删除 `plan` 而不改其他地方”。更合理的路径是：

1. 先保留 `plan`。
2. 再把 `plan` 压成轻量决策层。
3. 再把 `orchestrate` 升级成唯一调度与推进中心。
4. 最后再根据使用情况决定 `plan` 是否退场。

这条路线的核心原则只有一句：

**减少入口，不减少治理。**
