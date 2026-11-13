---
title: "Owner 心态驱动的方案迭代方法论:6 个可复用框架 + 3 个元原则"
date: 2026-05-29
category: workflow-issues
module: spec-iteration
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - "spec-brainstorm / spec-plan / spec-code-review 等长链路工作"
  - "面对复杂方案不知道该不该加抽象层时"
  - "多 reviewer 给出冲突结论需要仲裁时"
  - "工具失败时不确定是放弃还是换通道时"
  - "测试通过后仍需要验证 contract 一致性时"
  - "默认想列选项让用户拍板,但其实应该 owner 决断时"
tags:
  - owner-mindset
  - methodology
  - over-engineering-prevention
  - addition-vs-subtraction
  - tool-stack-enumeration
  - multi-lens-review
  - reflection-discipline
  - data-driven-decisions
related_components:
  - spec-plan
  - spec-brainstorm
  - spec-code-review
  - spec-work
  - using-spec-first
---

# Owner 心态驱动的方案迭代方法论

## Context

2026-05-28 至 2026-05-29 之间,围绕 kaz-mvp 实测发现的 D1-D8 缺陷,完成了从「10-13 周 Milestone(fingerprint + capability matrix + entry router)」一路收敛到「3-5 天 Tier 1 精准修补 3 个 additive 字段」的方案迭代,并最终落地 5 个独立 commit + 1122 unit test 全绿 + 1 个 reviewer 抓出的 contract bug 修复。

整个过程暴露了 7 类反复出现的元偏差(加法本能、抽象优雅诱惑、默认征询模式、工具栈想象力不足、测试通过的安全感、反思停留点、单一权威信赖),也产出了 6 个可复用的方法论框架与 3 个元原则。本文档把这些经验固化下来,作为下次类似工作的判断锚点——避免反复"找一个优雅的、加法的、需要用户拍板的方案",而能直接进入"找一个简单的、减法的、自己拍板的方案"模式。

## Guidance

### 方法论 1:三问拒绝过度设计

任何"引入新抽象层 / 新 schema / 新协议"的方案,先问三个递进问题:

```text
问题 1:这个方案是不是该做?
  - 不做会怎样?
  - 真实痛点频率多高?
  - 已有机制能不能解决 80%?

问题 2:如果该做,最小可行版本是什么?
  - 删掉一半字段,核心还成立吗?
  - 删掉一个 milestone,链路还通吗?
  - 删掉观察期/治理层,还能落地吗?

问题 3:这个最小版本能不能再小?
  - 再问一次问题 2,直到删不动为止
```

避坑要点:每问一次"是否该做",必须想象"完全不做"的后果。如果"不做"的后果可以接受,就不要做。

---

### 方法论 2:Owner 心态四步法

任何需要做决策的时刻——尤其是看到自己想列"选项 ABC 让用户选"的瞬间——切换到 owner 模式:

```text
1. 读原始证据   - 不是听 reviewer 转述,自己读 plan / code / log 原文
2. 自己做判断   - 写出明确决定,而不是列选项菜单
3. 显式追溯     - 决策依据写进 commit / plan note,可审计
4. 一句话告知   - 用户只看结论 + 关键风险
```

避坑要点:
- 默认进入 owner 模式,不要等用户触发
- Owner 不是独断,是承担判断责任 + 保留审计链
- 真正不可逆的决策(数据删除 / 公开发布 / 破坏性操作)才停下问

---

### 方法论 3:反思推到底原则

提出 N 个优化点 / N 个 finding / N 个方案选项时,不要找到方向就停:

```text
Step 1:列出 N 个项目
Step 2:逐对检查矛盾
  - 优化 A 和优化 B 之间有冲突吗?
  - 如果都执行,是否互相抵消?
  - 是否都基于同一个错误前提?

Step 3:推到极致
  - 如果接受所有优化,产出是什么样?
  - 这个产出本身是否需要再优化?
  - 第 N+1 个问题在哪里?

Step 4:回头质疑前提
  - 这 N 个优化所依赖的"该做这件事"前提对吗?
  - 不做这件事行不行?
```

避坑要点:反思的价值在终点不在起点。

---

### 方法论 4:加法-减法节奏控制

工程师默认加法思维。任何方案设计或修订过程,强制交替循环:

```text
设计时:加法 → 减法 → 加法 → 减法,交替循环
  每加完一轮,强制问"哪些可以删掉?"
  每删完一轮,验证"必要功能还在吗?"

review 时:先减法 → 后加法
  先质疑现有内容能不能砍
  再考虑要不要加新内容
```

避坑要点:
- "再加一个机制就能解决问题"是工程师的本能陷阱
- 任何"我建议补充 X"之前先问"能不能删除 Y"
- 减法需要主动努力,加法是默认模式

---

### 方法论 5:工具栈穷举原则

任何工具调用失败或不可用时,不要默认"整条路不通":

```text
1. 系统性穷举所有可用通道:
   - 同类工具其他实现(WebSearch 不行 → curl / WebFetch / mcp)
   - 已有的间接通道(本地 HTTP / cli 工具 / subagent)
   - 是否能改变模型 / 会话 / 环境绕开限制
2. 验证每个通道是否真的不可用(不是只看错误信息)
3. 全部不可用时才声明失败,且说明已尝试哪些
```

避坑要点:
- 错误信息只描述一种失败模式,不代表整条路死
- 想象力不足是最大的工具栈瓶颈
- 优先试组合(A + B 调用)而不是单一工具
- 单一权威信赖会限制视野——拿到一手资料后,仍要继续穷举其他通道

---

### 方法论 6:四 lens code review 框架

任何 code review 或方案验证,不能只看测试是否通过:

```text
Lens 1:Plan 一致性
  - R1-RN 是否每条都被实现?
  - Scope Boundaries 是否被违反?
  - Test scenarios 是否真的在测试中?

Lens 2:Scope creep
  - 实际改动是否超出 plan?
  - 超出部分如何追溯?
  - 是否应该回滚到独立 PR?

Lens 3:边界 case + 跨平台
  - WSL / Docker / NFS 等非主流环境
  - 双宿主 Bash / PowerShell 真正对称(不只是字段名)
  - 非 ASCII / 空字符串 / 极端规模

Lens 4:测试覆盖盲区
  - 测试通过的场景之外有什么没测?
  - 字段组合(A clean + B dirty)是否有测?
  - contract 真实跨字段一致性
```

避坑要点:
- 测试通过 ≠ 完整验证,只是已写测试没暴露问题
- Reviewer 给冲突结论时,owner 必须读原文做仲裁
- 不同 lens 之间可能矛盾,要主动调和

---

### 元原则 1:做更少 + 信任 LLM 更多

来自 Anthropic "Building Effective Agents":

> "Consistently, the most successful implementations use simple, composable patterns rather than complex frameworks."
> "Add multi-step agentic systems only when simpler solutions fall short."

这是所有方法论的根基。

---

### 元原则 2:数据驱动 > 思辨驱动

- 不预设阈值,记录真实数据再判断
- 不预设观察期,真出问题再处理
- 不假设工具不通,实际验证再放弃

---

### 元原则 3:Owner 心态是工程能力,不是态度

承担判断责任 + 保留审计链 + 直接告知结论。这不是"主动一点",是工程能力的核心层面——它决定了方案产出质量是 3-5 倍而不是 1 倍。

---

### 方法论应用对照表

| 触发场景 | 用哪个方法论 |
|---|---|
| 看到复杂方案 | 三问拒绝过度设计 + 加法-减法节奏 |
| 需要做决策 | Owner 心态四步法 |
| 列出多个 finding / 优化点 | 反思推到底原则 |
| 工具失败 | 工具栈穷举原则 |
| 验证代码 / 方案 | 四 lens code review 框架 |
| 任何时候 | 元方法论三原则 |

## Why This Matters

没有这套方法论时,默认行为是:
- 看到痛点 → 设计抽象 → 加 schema → 加 contract → 加 matrix(加法本能)
- 反对一个过度设计时,给出另一个优雅方案(反弹设计陷阱)
- 每个决策都列选项让用户拍板(默认征询模式,质量降 3-5 倍)
- 工具失败就放弃整条路(工具栈想象力不足)
- 测试通过就放心(忽视测试覆盖盲区)
- 反思找到方向就停下(推论没走完)

这次对话的成本:从 10-13 周 milestone 反复收敛到 3-5 天 Tier 1,经历了 fingerprint → WCP → Tier 1 + 观察期 → 真正最小 Tier 1 四轮反弹设计。如果第一次就启用这套方法论,可以一步直达最小方案,节省 60-80% 决策成本。

更重要的是,Tier 1 路线最终被 Anthropic Engineering Blog、Aider、LSP、Anthropic SDK 等多个独立权威来源验证为符合 2025-2026 AI Coding 趋势。这套方法论本身就是 trend-aligned 的工程纪律。

## When to Apply

- 进入 spec-brainstorm / spec-plan / spec-code-review / spec-work 任意环节
- 面对"是否引入新抽象层" 的判断时
- 多 reviewer 给出冲突 finding 时
- 看到自己想列"选项 ABC 给用户选"的瞬间
- 提出 N 个优化点想要"再优化一轮"时
- 任何工具调用失败时
- 完整测试通过后仍需要 review 时

## When Not To Apply

- 真正不可逆的高风险决策(数据删除 / 公开发布)仍需停下问用户
- 用户明确给出范围限制时不能越界扩张
- 已经在 spec-work 执行期间不要回头重做方案设计——按计划执行,问题攒到下一轮反思

## Examples

### 反例:加法本能驱动的方案(本次对话第一版)

```text
看到 D1-D8 8 个缺陷
  → 设计 fingerprint schema 两层
  → 加 9 个 Scenario class 枚举
  → 加 Capability Matrix(default + 3 high-risk override)
  → 加 6 优先级 entry router
  → 加 PA-pre calibration 阶段
  → 加 ≥3 仓库样本要求
  → 加 quality_signals 4 字段
  → 10-13 周 M1-M4 milestone
```

每一步都"自圆其说",但合起来是过度设计——违反 spec-first 自身 "Light contract / Let the LLM decide" 哲学。

### 正例:三问 + 减法 + Owner 心态产出

```text
看到 D1-D8 8 个缺陷
  → 问题 1:每个缺陷都该做吗?
            D2/D4/D5/D7/D8 痛点频率不高,延后
  → 问题 2:剩下 D1/D3/D6 最小可行版本?
            3 个 additive 字段就够,不需要 fingerprint schema
  → 问题 3:这个最小版本能再小吗?
            删观察期 + 删 60% 阈值 + 删 SKILL.md prose 升级
  → Owner 决定:3-5 天 Tier 1 落地,任何时候出问题任何时候修
```

### Owner 仲裁示例:多 reviewer 冲突

```text
correctness reviewer:quality_signals 是 scope creep,违反 plan 003 第 58 行
project-standards reviewer:quality_signals 是 plan 002 R8 必交付,完全合规
                            (但他读的是 plan 002,不是 plan 003)

Owner 行动:
  1. 自己读 plan 003 Scope Boundaries 原文
  2. 仲裁:correctness reviewer 对——plan 003 才是当前实施 plan
  3. 决定:不回滚(代码 working + 测试全绿)
  4. 追溯:plan 003 加 "Scope Expansion Note" 显式记录
```

### 工具栈穷举示例

```text
WebSearch 失败(model 不兼容)
  ↓ 不放弃整条路
WebFetch 失败(企业策略拦截 claude.ai)
  ↓ 继续穷举
subagent 失败(内部用同样不可用的工具)
  ↓ 继续
mcp context7 ✅ 拿到 LSP / Anthropic SDK / Aider 一手文档
  ↓ 还能更激进?
Bash + curl 直连 ✅ 200 OK 拿到 Anthropic Engineering Blog 原文
```

如果在第一个工具失败就放弃,会丢失 3 个独立权威来源的关键证据。

### 四 lens review 抓 bug 示例

```text
1116 测试通过 → 多数人停在这里
  ↓ 启动 Lens 4(测试覆盖盲区)
用户视角追问:"setup clean + graph facts dirty 这种组合测过吗?"
  ↓ 验证
临时 harness 跑这个场景 → state_class=clean-single-repo + worktree.dirty=true 矛盾
  ↓ 发现 contract bug
computeBootstrapLayer 没有基于 merged facts 重算 state_class / complexity_dimensions / tags
  ↓ 修复 + 加 regression test
1122 测试全绿
```

## Related

- `docs/methodology/结构化项目角色契约.md`(Light contract / Scripts prepare / Let the LLM decide 三原则)
- `docs/contracts/ai-coding-harness.md`(6 层 Harness 模型)
- `docs/plans/2026-05-28-003-fix-spec-first-precision-fix-d1-d3-d6-plan.md`(本次方案落地)
- `docs/plans/2026-05-28-002-feat-spec-first-scenario-adaptive-milestone-plan.md`(原过度设计 milestone,active 备查)
- Anthropic Engineering: "Building Effective Agents"(`https://www.anthropic.com/engineering/building-effective-agents`)
- Anthropic Engineering: "Claude Code Best Practices"(`https://www.anthropic.com/engineering/claude-code-best-practices`)
- Aider Repository Map(`https://aider.chat/docs/repomap.html`)
- Microsoft LSP capability negotiation(`https://microsoft.github.io/language-server-protocol/`)
