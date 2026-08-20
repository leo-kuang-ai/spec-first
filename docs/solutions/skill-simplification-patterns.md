---
title: Ponytail-inspired skill 简化候选的门测结论（当前批次全部为 anti-pattern）
date: 2026-08-21
category: docs/solutions
module: skill-evolution
problem_type: architecture_pattern
component: benchmarks/agentic
severity: medium
applies_when:
  - 有人提议把 Ponytail 的某条简化/纪律原则（§3.1-§3.8）搬进 spec-first 某个 skill 的正文
  - 需要判断某条"读起来更严谨"的 SKILL.md 编辑是否有真实行为收益
  - 在没有行为门时，有人想直接改 SKILL.md 文本再补测试
  - 评估是否要恢复本文档记录为 anti-pattern 的某条指令
tags: [ponytail, behavior-gate, anti-pattern, cache-fixture, fisher-exact, spec-debug, benchmarks-agentic]
---

# Ponytail-inspired skill 简化候选的门测结论（当前批次全部为 anti-pattern）

## Context

`docs/10-prompt/spec-first代码审查方案.md` 是 `docs/10-prompt/Ponytail思想指导spec-first-Skill优化.md` 的执行方案，其 §7 输出交付物要求本文档收录"≥5 项通过的 patterns"和"失败的 anti-patterns"。

2026-08-20 至 2026-08-21，用 `benchmarks/agentic/` 行为门（从 ponytail 移植）对 spec-first 现有 skill 上的候选简化指令做了真实门测（Sonnet 5，共花费约 $65.27，覆盖 trace-transfer/trace-amount/reuse-slug/reuse-money/safe-path/cache 共 6 个任务、baseline/spec-work/spec-debug 三臂）。

**诚实的结论是：本批次没有一条候选指令产生可证实的正面收益。** 全部 5 个已完成门测的候选（根因修复检查、复用检查×2、安全默认检查、诊断类 skill 路由收紧）都归档为 anti-pattern 或因证据不足退出候选池。这不是执行失败——按 §3.8 的证据纪律，"发现当前模型已经内化某项能力、不需要显式指令"本身就是一个有效结论，比盲目堆砌指令更有价值。本文档如实记录这个结果，不为凑数编造正面 pattern。

## Anti-Patterns（已用行为门证实无收益，不应列入 SKILL.md）

### AP-1：`spec-debug` § "shared-caller 检查" 指令（"grep every caller of the function you touch"）

**候选来源**：Ponytail §3.1/§3.4（先理解再简化、修共享根因），移植为 `spec-debug/SKILL.md` 里显式要求"改函数前 grep 所有 caller"的指令。

**门测证据**（`benchmarks/agentic`，Sonnet 5，n=6/臂）：

| 任务 | baseline | spec-debug |
|---|---|---|
| trace-transfer | 5/5（1 cell API 失败已排除） | 6/6 |
| trace-amount | 6/6 | 6/6 |

11 次真实运行两臂全对，正确率无差异；trace-transfer 上 spec-debug 成本还贵 2 倍（$0.67 vs $0.33/cell）。

**结论**：当前 Sonnet 5 已经内化"改共享函数前检查所有调用方"这个习惯，显式写进 SKILL.md 不产生正确率收益，只增加 token 开销。**不应列入任何 skill。**

**Invalidation condition**：换用更弱的模型（如更早版本或不同厂商），或换成更深的调用链/更隐蔽的共享入口（当前 fixture 是 2 层调用，1 个共享函数）。

**Owner**：`spec-debug` 的根因修复维度。

### AP-2：`spec-work`/`spec-debug` § "复用现有 helper" 指令

**候选来源**：Ponytail §3.3（复用优先），移植为要求"实现前先 grep 项目现有实现"的指令。

**门测证据**（n=12/臂，`runs/20260820-232245`，108 计划 cell、107 有效测量、1 个 300 秒超时）：

| 任务 | baseline | spec-work | spec-debug |
|---|---|---|---|
| reuse-slug | 12/12=100% | 11/11=100%（1 API 失败已排除） | 12/12=100% |
| reuse-money | 12/12=100% | 12/12=100% | 12/12=100% |

两个任务三臂全部 100%，与 n=2 快速扫描方向一致，且在 n=12 大样本下依然稳定（没有出现 cache 维度那种大方差反转）。

**结论**：当前模型已经会主动 grep 既有实现并复用，"复用优先"这条指令不产生正确率收益，且成本比 baseline 高（spec-work/spec-debug 平均比 baseline 贵 1.1×-1.5×）。**不应列入任何 skill。**

**Invalidation condition**：同上，换弱模型或换更隐蔽的既有实现（当前 fixture 的既有实现就在同目录同文件里，容易被发现）。

**Owner**：`spec-work`、`spec-debug` 的复用维度。

### AP-3：`spec-work`/`spec-debug` § "安全默认" 指令（路径遍历防护）

**候选来源**：Ponytail 隐含的安全默认原则，移植为"路径拼接必须防遍历"的显式指令。

**门测证据**（n=12/臂，同一批 run）：

| 任务 | baseline | spec-work | spec-debug |
|---|---|---|---|
| safe-path | 12/12=100% | 12/12=100% | 12/12=100% |

**结论**：当前模型已经默认写安全的路径拼接代码（`os.path.abspath` + `startswith` 防遍历模式），显式指令零增益。**不应列入任何 skill。**

**Invalidation condition**：换用训练数据里安全实践覆盖较少的更弱模型；或换成更隐蔽的安全场景（当前 fixture 是路径遍历，最常见、最容易被内化的一类）。

**Owner**：`spec-work`、`spec-debug` 的安全默认维度。

### AP-4：Ponytail §3.1/§3.4 表述方式对照（"可执行指令 vs 价值观表述"）

**候选来源**：Ponytail 对照实验声称"grep every caller"（可执行）比"trace the flow end to end"（价值观表述）正确率更高（Opus 0/3 → 6/6，2026-06-22 数据）。这曾被当作"表述方式本身就有行为收益"的证据，驱动了本项目最初的 P0 优先级排序。

**门测证据**：见 AP-1——在 spec-first 当前环境（Sonnet 5）下，两种表述方式（有无显式 grep 指令）的正确率均为满分，无法区分。

**结论**：Ponytail 的原始对照实验是在 Opus + 2026-06-22 的模型状态下测得的；**同样的表述差异在 spec-first 当前使用的模型/时间点下已经不可复现**。这印证了 §3.8 的证据纪律——`behavior_quality` 证据有时效性，不能跨模型、跨时间点直接复用结论。

**Invalidation condition**：模型演化到更弱状态，或换用 Opus 系列重新测。

**Owner**：跨 skill 通用的证据纪律，不特定于某个 skill。

## Pending（证据不足以下结论，未归档为 pattern 或 anti-pattern）

### PD-1：`spec-debug` 误用防护（诊断类 skill 用于纯实现任务）

**候选来源**：本轮审查过程中的新发现（不是 Ponytail 原始映射）——`REPORT-20260820-sonnet5-saturation.md` 单次 n=5 测得 spec-debug 在 cache 任务（过度设计判断）上 4/5=80%，被误判为"45 次运行里唯一的真实负回归"，一度提升为最高优先级候选。

**门测证据**：按方案纪律先复现，n=6+n=12 仲裁（`runs/20260820-225532`、`runs/20260820-230644`，合并 n=18，零 API 失败）：baseline 16/18=88.9%、spec-work 17/18=94.4%、spec-debug 15/18=83.3%。双侧 Fisher exact 检验：baseline vs spec-debug **p=1.000**（完全无统计证据支持差异），spec-work vs spec-debug p≈0.603。方向上 spec-debug 略差，但四次独立测量（0/2→4/5→6/6→9/12）方差极大，当前 `score_cache` fixture 区分力不足以下结论。

**结论**：**既不归档为 pattern（没有证实"该收紧路由"有收益）也不归档为 anti-pattern（没有证实"不该收紧"）**——是证据强度不足，不支持任何 SKILL.md 修改。已花费约 $20.73，不建议在同一 fixture 上继续机械扩样本。

**Trigger（何时重新评估）**：设计一个区分力更强的过度设计 fixture（当前 `cache` 任务的"是否加了不必要的缓存"判断对模型来说太容易，三臂都接近满分，天花板效应压缩了组间差异），并预注册效应阈值、样本量和统计方法后再重开。

**Owner**：`spec-debug` 的 scope 边界；决策者是愿意投入下一轮门测预算的人，不是本次审查本身。

## Why This Matters

- **本文档没有凑够"≥5 项通过的 patterns"，这是符合事实的结果，不是执行缺口。** §8 的晋级规则本身就是非补偿式的——没有证实收益的候选不应该被包装成"通过"。如果未来有人想在这里补充正面 pattern，必须先有匹配的门测证据，不能靠叙事。
- 4 个 anti-pattern 共同指向同一个结论：**Sonnet 5 在 spec-first 已测的 4 个维度（根因修复、代码复用、安全默认、过度设计判断）上，baseline 表现已经饱和**，显式指令的边际收益趋近于零，但会稳定增加 token/成本开销。这与 `REPORT-20260820-sonnet5-saturation.md` 的核心发现一致。
- 1 个 pending 项说明了另一件事：**"看起来像负回归"的单次小样本结果，在扩大样本后经常收敛或反转**（cache/spec-debug 四次测量：0/2、4/5、6/6、9/12）。任何要驱动"改 SKILL.md 正文"这类高成本动作的证据，必须先在同一环境下用 n≥12 复现一次，不能直接采信报告里的单臂小样本数字。

## When to Apply

- 有人提议把某条 Ponytail 原则或"读起来更严谨"的措辞加进某个 SKILL.md 前，先检查本文档是否已经测过同类指令。
- 门测结果与本文档记录的结论矛盾时（例如换了新模型后 AP-1/AP-2/AP-3 突然出现正确率差异），更新对应条目的状态，不要静默覆盖旧结论——旧结论本身也是证据，说明"曾经有效的指令后来失效了"和"从来没有效"是两种不同的信号。
- 想要往这个文档追加新 pattern 或 anti-pattern 时，必须附带：任务/fixture 名、模型、n、arm 对照数据、统计检验（如适用）、花费。缺任何一项都不能写入本文档，只能记在审查方案的执行记录里作为"待补证据"。

## Examples

反例（不应发生）：

```text
"这条指令读起来符合 Ponytail 的懒惰原则，看起来应该有帮助，先加进 SKILL.md，
以后有空再补测试。"
```

正例（本文档采用的流程）：

```text
提出假设
  -> 用 benchmarks/agentic 的现成或新建 fixture 跑 baseline vs candidate
  -> n=6 初测，如果结果反直觉或方差大，n≥12 复现
  -> 用统计检验（如 Fisher exact）而非直觉判断"差异是否真实"
  -> 记录 correct_rate、cost、n、model、花费
  -> 归档：pattern（证实收益）/ anti-pattern（证实无收益或负收益）/ pending（证据不足）
```

## Related

- `docs/10-prompt/Ponytail思想指导spec-first-Skill优化.md` — 本文档记录的候选全部来自其 §3/§4 映射
- `docs/10-prompt/spec-first代码审查方案.md` — 完整审查方案，含每个候选的执行模板、门测命令和时间线
- `benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md` — 首次饱和度测试报告，AP-1/AP-2/AP-3 的原始数据来源
- `docs/solutions/architecture-patterns/agent-persona-reference-template-duplication-2026-08-21.md` — 同一轮审查发现的另一类问题（reference 文件重复），走的是不同的证据链（人工审查而非门测）
