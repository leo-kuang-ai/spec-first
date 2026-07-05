---
title: 评测引导/路由型 skill 的方法论(with-skill vs 裸 baseline)
date: 2026-06-08
category: docs/solutions/workflow-issues
module: using-spec-first
problem_type: evaluation_methodology
component: skill_evaluation
severity: medium
applies_when:
  - "需要判断一个引导/路由型 skill(如 using-spec-first)是否高质量、是否值得继续投入"
  - "用 skill-creator 之类 eval 工具评测一个不产文件、只产'决策/路由'的 skill"
  - "怀疑某条 skill prose 改动有没有真实增量,想用证据而非直觉裁决"
tags: [skill-evaluation, routing-skill, using-spec-first, baseline-isolation, fresh-source-eval, governance]
---

# 评测引导/路由型 skill 的方法论(with-skill vs 裸 baseline)

## Context

`using-spec-first` 这类 skill 不产出文件,产出的是**路由决策**(把用户意图导向某个 `spec-*` workflow,或直接回答,或 guide-mode 给下一步)。skill-creator 的默认评测假设"skill 产出可检验的 artifact",对这类 skill 不直接适用,需要改造。

本次评测要回答的真问题是:**这个引导 skill 到底高不高质量?它相比"没有它的裸 Claude"多带来了什么?**

评测改造的核心是把 baseline 重新定义:

```text
with-skill  = 全新 subagent + 注入当前磁盘 SKILL.md 全文路由策略(fresh-source)
baseline    = 全新 subagent + 只给"入口菜单"(知道有哪些 workflow),不给任何路由策略
对比增量    = 路由策略本身的价值,而非"知不知道有哪些命令"
```

两轮共 16 个用例(iteration-1 教科书式清晰意图 9 条;iteration-2 多意图冲突/形态纪律难用例 7 条 ×2 run,独立 grader 打分)后得到的结论,见下。

## Guidance

### 1. baseline 必须是"裸菜单",不是"无 skill"

对产文件的 skill,baseline 是"完全不给 skill"。对路由 skill,"完全不给"会让 baseline 连有哪些 workflow 都不知道,对比就退化成"知不知道菜单"而非"路由策略好不好"。正确做法是给 baseline 一份**纯入口清单**(workflow 名 + 一句用途),不给优先级树、红旗、guide-mode、normalization 等策略——这样隔离出的才是策略本身的增量。

### 2. 教科书式清晰用例对强模型几乎零区分度

iteration-1 的 9 个"清晰意图"用例,裸 Opus baseline 自行答对 26/27(96.3%),with-skill 27/27,delta 仅 +3.7%。强模型不需要被教就知道 bug→debug、diff→code-review、compound 关键词不该误触发。**这类用例作为防回归护栏有效,但证明不了 skill 的边际价值。** 如果评测只用这类用例,会误判"skill 没用"。

### 3. 只有"多意图冲突 / 形态纪律"难用例才有区分性

iteration-2 专门造 baseline 会翻车的用例:多意图混杂(修 bug+加功能)、自动串联诱导("一步到位")、红旗自省("小事直接动手"改路由 prose)、意图 vs 关键词竞争、internal-helper 暴露诱导、显式 route 与真实意图不符、低置信需澄清。delta 从 +3.7% 拉到 +9.5%,且 baseline 出现高方差(同一用例两 run 一次 3/3 一次 1/3)。**难用例 = 区分度,简单用例 = 噪声。**

### 4. 路由 skill 的真实价值是"固化纪律",不是"选对入口"

最强证据(iteration-2 eval-1,用户说"一步到位、你看着办"):baseline 路由对了 `spec-plan`,但结尾擅自预告串联"进 plan→接 work 一次性实现+验证",违反"不自动串联多个 workflow"纪律;with-skill 两 run 都守住单一入口。

裸强模型**偶尔能想到守纪律,但不稳定**(±25% 方差);with-skill 全 run 稳定 100%、0 方差。**把"偶发的好习惯"固化成"每次必然遵守的纪律"——这才是引导 skill 不可替代的价值**,而非"教模型选哪个入口"(那对强模型增量极薄)。评测用例与 skill 优化都应向这个维度倾斜:不自动串联、scope-guard 不重路由、不暴露 internal-helper、guide-mode 单一下一步、双宿主入口前缀正确。

### 5. 用独立 grader + 每用例多 run,别一人打分一次跑

iteration-1 我 inline 打分、每用例 1 run,采不到方差;iteration-2 用 14 个独立 grader(对抗式)+ 每用例 2 run,才采到"baseline 不稳定"这个关键信号。方差本身是结论(稳定性 = skill 价值),单 run 会丢掉它。

## Why This Matters

锚回角色契约:**可验证事实 > 模型猜测**。"这个 skill 好不好"很容易凭直觉答,但直觉会把"强模型本来就会"误记成"skill 的功劳"。baseline 隔离把功劳归对了位置。

**80/20**:评测发现 skill 的"选入口"价值对强模型边际趋零,真实价值集中在少数"形态纪律"维度——这直接指导后续投入该往哪放(强化+测试纪律,而非扩充菜单)。

**精准修改 / 不做无价值 PR**:本次评测最终结论是"skill 已高质量、无可填 source gap"(想提的改进 `2026-06-08 12:24` 提交已做、且已有测试守护),正确决定是**不提 prose PR**——边际收益为零时强行改 prose 会引入 drift 风险。评测的价值是给出"不改"的证据,而非凑一个改动。

## When to Apply

适用:判断引导/路由/meta 型 skill 质量;怀疑某条 skill prose 改动有无真实增量;为"是否继续投入某 skill"做证据决策。

**不要**:
- 不要只用清晰用例评测路由 skill(会误判没用),必须含多意图冲突/纪律难用例。
- 不要把评测 workspace 放在 `skills/` 下(见下方治理坑)。
- 不要用"完全无 skill"做路由 skill 的 baseline(退化成菜单认知对比)。
- 评测产物(workspace/benchmark/review.html)是一次性证据,**不入库**,放仓库外或评测后删除。

## Examples

**治理坑(本次踩到):评测 workspace 不能放 `skills/` 下。**

skill-creator 约定 workspace 是"skill 目录的 sibling",于是我建了 `skills/using-spec-first-workspace/`。结果 `using-spec-first-contracts.test.js` 失败:

```text
Bundled skills governance truth source is missing skills: using-spec-first-workspace
  at validateSkillsGovernance (src/cli/plugin.js:427)
```

根因:`skills/` 是 skill 发现根目录,`syncSkills` 把这个 workspace 当成了未在 `skills-governance.json` 注册的 skill 并抛错。把 workspace 移出 `skills/`(到 `/tmp` 或仓库外)后测试立即恢复绿。**教训:skill-creator 的 sibling-workspace 约定与本仓库 governance 校验冲突;路由 skill 的评测 workspace 必须放在 `skills/` 之外。**

**反例 vs 正例(baseline 设计):**

```text
反例:baseline = 完全不给 skill → 它连有哪些 spec-* 都不知道 → 测的是"菜单认知"
正例:baseline = 只给入口清单(名+用途),不给路由策略 → 测的是"路由策略增量"
```

**本次实际验证链路:**

```text
# 评测执行(Workflow 编排,fresh 子 agent,读 live SKILL.md 而非易丢快照)
# 聚合 + 可视化
python3 -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name using-spec-first
python3 eval-viewer/generate_review.py <workspace>/iteration-N --static review.html
# 现状健康确认(确认 skill 无 gap、未被污染破坏)
npx jest tests/unit/using-spec-first-contracts.test.js tests/unit/instruction-bootstrap.test.js
```

fresh-source eval:`passed`(子 agent 读当前磁盘 `skills/using-spec-first/SKILL.md`,非会话缓存)。结论"无 source gap"经 `using-spec-first-contracts.test.js:108`(`Do not chain multiple workflows automatically`)、`:133`(`git-worktree` 不暴露)、`instruction-bootstrap.test.js`(四段在场/drift 不变量/反 1% 强制)交叉确认。

## Related

- `docs/solutions/workflow-issues/owner-driven-spec-iteration-methodology-2026-05-29.md` — 姊妹方法论篇;其"反对默认列选项菜单"正是要点 4「guide-mode 单一下一步」在路由 skill 上的投影。
- `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md` — 定义 `entry_surface` / standalone vs workflow 边界;评测"是否守住只暴露公开 workflow、不暴露 internal-helper"以它为标尺。
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md` — 系统讲 `syncSkills` 与 source/runtime 单向生成链;本次 eval-workspace 误放 `skills/` 被当未注册 skill,是其"source 目录治理边界"的一个新失败形态。
- `docs/solutions/architecture-patterns/competitor-skill-borrowing-judgment-2026-06-01.md` — 确立"skill prose 改动用 fresh-source eval 验证"协议;本方法论把它从"单跑"升级为"with-skill vs baseline 双跑隔离增量"。
- `docs/contracts/workflows/fresh-source-eval-checklist.md` — fresh-source eval 的 checklist contract;本方法论是其在"路由 skill 定量评测"上的延伸。
