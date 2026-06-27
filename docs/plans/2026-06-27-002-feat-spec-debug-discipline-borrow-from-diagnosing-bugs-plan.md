---
spec_id: spec-debug-discipline-borrow-from-diagnosing-bugs
title: "feat: spec-debug 借鉴 diagnosing-bugs 强化反馈环纪律、性能回归与 correct seam 判断"
type: feat
status: completed
date: 2026-06-27
completed: 2026-06-28
plan_depth: standard
author: leokuang
target_repo: "."
related_docs:
  - docs/10-prompt/结构化项目角色契约.md
  - skills/spec-debug/SKILL.md
  - skills/spec-debug/references/investigation-techniques.md
  - skills/spec-debug/references/anti-patterns.md
  - skills/spec-debug/references/defense-in-depth.md
external_refs: []
local_benchmark_refs:
  - /Users/kuang/xiaobu/skills/skills/engineering/diagnosing-bugs/SKILL.md
  - /Users/kuang/xiaobu/skills/skills/engineering/diagnosing-bugs/scripts/hitl-loop.template.sh
---

# feat: spec-debug 借鉴 diagnosing-bugs 强化反馈环纪律、性能回归与 correct seam 判断

## Summary

`spec-debug` 是 spec-first 体系的公开 debug workflow 入口，技术广度（最小化 / 间歇性 bug / 竞态 / heisenbug / 跨系统证据采集 / 系统边界检查 / bug-class 模式清单 / defense-in-depth / anti-patterns）已远超外部 `diagnosing-bugs` skill。该判断基于逐项核对 `skills/spec-debug/SKILL.md` 与三份 references 的源码（最小化 delta debugging、间歇性 statistical reproduction、竞态/heisenbug、跨系统证据采集、系统边界检查、bug-class 清单、defense-in-depth 四层模型均已在 spec-debug 中存在），非主观估计。本计划**不补技术清单**，而是借鉴 `diagnosing-bugs` 在三处**纪律强度**与两处**概念空白**上的锐度，提升 `spec-debug` 的诊断收敛能力：

- **纪律强化**：反馈环就绪验收清单 + 反跳跃 militant 提醒；`feedback_loop_not_possible` 拆分为「无环+无证据=硬停索取 / 无环+有捕获证据=bounded-evidence 继续」二分；非确定性 bug「提复现率」重构；tagged debug log 前缀 + grep 清理纪律；**测试前假设重排折叠进既有 smart-escalation 时刻**（不新增独立中断点）。
- **概念补强**：性能回归作为一等公民 **Perf 分支**（先量后修，日志通常无效）；回归测试前的 **correct seam 判断**（锁住能锁的浅层失败测试并标注其覆盖边界，无任何 correct seam=架构发现）。
- **资产落地**：`scripts/hitl-loop.template.sh` 把 spec-debug 已描述但未运营化的「必须人点击」场景变成结构化 loop。

**核心边界**：本计划**保留 spec-debug 的既有优势**——prediction 作为测试不确定环节的工具而非仪式、bounded-evidence 生产 bug 路径、端到端闭环（issue 抓取/环境核对/修复/PR/知识沉淀）。借鉴的硬 gate 改造为「militant 提醒 + 显式例外」以兼容 spec-debug「注意力提醒，不是 gate，不替代 LLM 判断」的治理哲学。不引入新 agent，不改变 source/runtime 边界，不改变 scenario capability / context governance / recall trust boundary / 双宿主等既有治理约束。

## Goals / Non-Goals

### Goals

1. **反馈环纪律强化**：在 Phase 1 末尾加 4 项「反馈环就绪清单」（red-capable / deterministic / fast / agent-runnable），要求命令已实际跑过一次并贴输出；把 anti-rationalization 表中「跳过复现」一行从软提醒升级为 militant "stop 并说明"。
2. **无环路径二分**：把 `feedback_loop_not_possible` 从单条「记录+继续」拆为「无环+无捕获证据=硬停索取（环境/产物/埋点许可）」与「无环+有捕获证据=bounded-evidence 继续」两条，调和硬 gate 与生产 bug 路径的张力。
3. **性能回归一等公民**：新增 `references/perf-regression.md`，建立「基线测量 → 二分定位 → 先量后修」分支，并内建**统计计时纪律**（多次采样 p50/p95 而非 mean、环境隔离、明确 bisect 阈值、与 Intermittent 交叉引用）；SKILL.md description 触发词补 `slow` / `performance regression`；Phase 1.1 指向该分支。
4. **correct seam 判断**：Phase 3 test-first 在写失败测试前先判断 correct seam；**锁住能锁的**——浅层缝仍写失败测试（注释/PR 标注「此测试未覆盖完整调用链，仅锁该层」），同时把「无 correct seam=架构发现」flag 到 Phase 4 作为 larger fix / spec-compound 候选；仅在完全不存在任何能失败-for-right-reason 的缝时才整体跳过并 flag。
5. **非确定性 bug 重构**：investigation-techniques.md Intermittent 段加「目标=提高复现率而非等待干净复现；1% 不可调试，持续加压/并行/注入 sleep 把率提到 ≥50% 再调查」。
6. **tagged log 纪律**：investigation-techniques.md instrumentation 段加「本次调试所有临时 log 打同一唯一前缀（如 `[DEBUG-a4f2]`），结束时一次 grep 清除」；Phase 4 cleanup checklist 含此 grep 项。
7. **HITL 结构化 loop**：新增 `scripts/hitl-loop.template.sh`（`step`/`capture` helper，结尾输出 `KEY=VALUE`），Phase 1.1 引用。
8. **测试前假设重排折叠进 smart-escalation**：不新增独立用户中断点；在 Phase 2 既有 smart-escalation 时刻（已决定要建议 brainstorm/移交前），把「展示排序假设清单给用户」作为可选动作，复用既有升级时刻而非新增提问面，消除与「don't ask by default」的张力。AFK 时按既有"proceed with your ranking"行为，无需新规则。
9. **有序手段菜单**：Feedback Loop 段从平铺列表改为有序编号菜单，补齐 bisection-as-loop / differential loop / HITL。

### Non-Goals

1. **不改 prediction 语义**：保留 spec-debug「prediction 仅用于不确定环节，明显因果链不需 prediction」的成熟立场，不照搬 diagnosing-bugs 的刚性「写不出预测=vibe 丢弃」。
2. **不强制假设数量**：保留 spec-debug 允许单假设（明显 bug）+ assumption audit + hypothesis ledger，不照搬「强制 3-5 个排序假设」。
3. **不照搬「反馈环唯一核心、其余 mechanical」**：spec-debug 是端到端 workflow，反馈环是核心之一但非唯一；不把 issue 抓取/环境核对/修复/PR/知识沉淀降格。
4. **不照搬无差别硬停**：不把 diagnosing-bugs 的「无环禁止假设」原样照搬，改造成二分例外（见 Goal 2）以兼容生产 bug 路径。
5. **不引入新 agent / 不改治理契约**：不新增 typed agent，不改 scenario capability matrix / context governance / recall trust boundary / 双宿主 / target_repo 等既有边界。
6. **不重写既有 references**：investigation-techniques.md / anti-patterns.md / defense-in-depth.md 仅做**增量插入**，不重排既有内容。
7. **不手改 generated runtime mirrors**：source 改完按需用 `spec-first init` 刷新，不手改 `.claude/`、`.codex/`、`.agents/skills/`。

## Decision Brief

### 设计判断：纪律强化 vs 治理哲学的调和

`diagnosing-bugs` 把反馈环抬为唯一核心并配硬 gate（"No red-capable command, no Phase 2"），这是它的锐度来源。但 `spec-debug` 在 anti-rationalization 段明确「这是注意力提醒，不是 gate，也不替代 LLM 判断；最终是否停下、如何处理仍由你按当前证据决定」——这是 spec-first「Light contract + Let the LLM decide」哲学在 debug 上的体现。

直接照搬硬 gate 会违反治理哲学。本计划的解法：**用 militant 语言强化提醒强度 + 把强制度落在可验证的产物约束上（而非思想约束）+ 提供显式例外出口**，而非引入不可绕过的状态机 gate，也避免「不进入假设生成」（思想约束）与「LLM decides」在同一决策点直接矛盾。

- 升级后的 anti-rationalization 行：militant 强度落在「**在获得环境访问 / 捕获产物 / 埋点许可之一前，不提交 root-cause-confirmed 声明、不关闭 causal chain gate**」——这是可验证的产物约束，而非「不进入假设生成」的思想约束；模型可形成 working hypothesis，但不得在缺环+缺证据时把因果链声明为 confirmed。
- 显式例外出口：「无环+有捕获证据」分支提供正当的 bounded-evidence 路径，使「停」不是死路而是「索取证据或换证据路径」的决策点。

这样既获得 diagnosing-bugs 的纪律锐度（纪律挡在「声明 confirmed」这一可证伪产物上），又不把 spec-debug 变成硬状态机，也不与「LLM decides」直接矛盾——LLM 仍可决定是否停下，但若不停在缺环+缺证据下声明 confirmed，即违反产物约束。脚本/工具产确定性事实、LLM 做语义路由判断的职责分工不动。

### 设计判断：为什么 perf 是「概念空白」而非「纪律强化」，且缺该路径特有的确定性纪律

grep 确认 SKILL.md 与 references 里只有 heisenbug 段顺带提到 profiler，没有任何把「慢」作为独立 bug 类的处理路径。description 触发词也没有 `slow`。这意味着一个性能回归会被当作普通正确性 bug 走「复现→假设→日志埋点」，而 `diagnosing-bugs` 点名「对性能回归，日志通常无效」。

这与 spec-debug 已有的「跨系统证据采集」「系统边界检查（EXPLAIN / 慢查询日志 / 锁）」等技术能力**不冲突但未汇聚成路径**——它们散落在 references 里，没有「性能回归应走这条分支」的指路。Perf 分支的价值是把已有零散能力**汇聚成一条一等公民路径**：基线测量 → 二分定位 → 先量后修。这是真正的能力补强，不只是纪律强化。

**审查追加的特有纪律（P1-1）**：性能 bisect 的「good/bad」判定基于计时，而计时天然有噪声（CPU 频率波动、后台负载、GC）。若单次计时判定，bisect 会反复抖动无法收敛——这是非确定性 bug 纪律要防的失败模式，但 perf 路径若不迁移「确定性」纪律就会重蹈。因此 perf-regression.md 必须内建**统计计时纪律**：

- **多次采样**：每个 commit 跑 N 次（10-20），用 **p50/p95 而非 mean**（mean 被尾部拖偏）作 bisect 判定。
- **环境隔离（平台条件化，P1-finding）**：CPU governor / pin 频率是 **Linux** 能力；本仓库宿主平台是 **darwin**，无 CPU governor 概念，改用 `sudo pmset -a ...` 性能模式。跨平台通用项为关后台进程、warmup 轮丢弃、固定电源、隔离 FS/网络；Linux 专有项（cpufreq governor / taskset pin）单独标注适用平台，不写成无条件纪律。与 tighten 三轴的「deterministic」同源。
- **明确 bisect 阈值**：定义回归阈值（如「p95 慢于基线 X%」），避免「感觉慢」主观判定。
- **阈值噪声带边界纪律（P2-finding）**：`git bisect run` 要求每步确定性 0/非0 分类，但当某 commit 的 p95 落在「阈值 ± 采样噪声带」内时，同一 commit 跨 run 可能被判 good 又被判 bad，bisect 收敛失败或收敛到错误 commit。该边界纪律：噪声带内的 commit 标记 **inconclusive**，对其重采样（增大 N）或改用更宽阈值 / 收窄 bisect 区间，**不让 git bisect run 对噪声带内 commit 做硬 0/非0 判定**。
- **交叉引用 Intermittent 段**：性能 bisect 本质是非确定性 bug 的一种，提复现率纪律在此同构适用。

这一条把 perf 从「缺路径」升级为「缺路径且缺该路径特有的统计计时纪律」，是方案中最有价值的审查发现。

### 设计判断：perf 为何独立成文件而非 investigation-techniques.md 内一节

审查指出（scope-guardian + adversarial 双视角，P3）：perf 内容与 investigation-techniques.md 高度重叠（bisect / Intermittent / EXPLAIN / APM trace 均已在该 reference 内），独立成文件引入双源漂移面与额外路由判断。独立成文件的实质理由（此前未声明）：

- **按症状按需加载**：perf bug 只载入 perf-regression.md，不强制加载更大的 investigation-techniques.md（后者约 375 行）；SKILL.md 可按 symptom 路由到轻量 perf 文件而非整份通用技巧。
- **漂移控制已内建**：perf-regression.md 只做**路径指路 + 交叉引用**（Open Question #2 已约束「不重复 framework 细节」），交叉引用指向 investigation-techniques.md 的 Git Bisect / System Boundary Checks / Evidence Harvesting / Intermittent 段，单一事实源仍在 investigation-techniques.md；perf 文档不含这些段的副本正文，双源漂移面被约束为「指路指针」而非「内容副本」。

若实施期发现该理由不压倒双源风险，默认降级为 investigation-techniques.md 新增「Performance Regressions」节以消除漂移面；此取舍由 Open Questions #2 与落地观察决定。

### 设计判断：correct seam 在 spec-debug 已有同向概念上补强

spec-debug Phase 3 已有「Verify it fails for the right reason — the root cause, not unrelated setup」。correct seam 是同一方向的**概念前置**——在写 failing test 前先判断「这个缝能否复现 bug 的真实调用模式」。若只有浅缝（单调用者测试而 bug 需多调用者链），那里的回归测试给假信心。

`diagnosing-bugs` 的关键洞察是「**没有正确缝，这本身就是发现**」——意味着架构阻止了 bug 被锁定。这与 spec-debug 已有 defense-in-depth（fix 后）和 post-mortem 同向，但 correct seam 是 **fix 之前**的判断，能更早把架构问题暴露为 Phase 4 的 flag，而非等到 fix 后才发现「没法写回归测试」。

**审查修正（P1-2）**：原方案「浅缝=假信心→不写假回归测试」有完美主义陷阱——一个「在浅层缝、为正确原因失败」的测试仍能捕获该层回归，有价值。业界实践是「**lock what you can, flag what you can't**」而非因不能完全锁定就整体跳过。修正为分层策略：浅缝仍写失败测试并标注其覆盖边界（锁住能锁的），同时把架构缺口 flag 到 Phase 4；仅在**完全不存在任何能失败-for-right-reason 的缝**时才整体跳过并 flag。这样消除「借无正确缝逃避写测试」漏洞，且与 defense-in-depth「每层独立测试」同向。

### 不照搬清单与理由

| diagnosing-bugs 做法 | 不照搬理由 |
| --- | --- |
| 每个假设都必须可证伪，写不出预测=vibe 丢弃 | spec-debug「prediction 仅用于不确定环节，明显链不需 prediction」更成熟，照搬刚性版会退化 |
| 强制 3-5 个排序假设 | spec-debug 允许单假设 + assumption audit + hypothesis ledger，刚性数量是冗余约束 |
| 无环硬停、禁止假设 | 对生产 bug 过刚；改为二分例外（无环+无证据才硬停） |
| 反馈环唯一核心、其余 mechanical | spec-debug 是端到端 workflow，照搬会丢闭环 |

## Impact Analysis

### Source-of-Truth 变更面

| 文件 | 变更类型 | 说明 |
| --- | --- | --- |
| `skills/spec-debug/SKILL.md` | 修改 | description 触发词补 `slow` / `performance regression`；Phase 1 加反馈环就绪清单 + 有序手段菜单 + `feedback_loop_not_possible` 二分；Phase 1.1 引用 perf 分支与 HITL template；Phase 2 假设重排折叠进既有 smart-escalation 时刻（不新增独立中断点）；Phase 3 加 correct seam 判断 + cleanup grep 引用；Phase 4 加精简 cleanup checklist；anti-rationalization 表升级「跳过复现」行 |
| `skills/spec-debug/references/investigation-techniques.md` | 修改（增量插入） | Intermittent 段加「提复现率」重构 + tighten 三轴；instrumentation 段加 tagged-prefix 纪律 |
| `skills/spec-debug/references/perf-regression.md` | 新增 | 基线测量 → 二分定位 → 先量后修；含 timing harness / `performance.now()` / profiler / 查询计划 示例 |
| `skills/spec-debug/scripts/hitl-loop.template.sh` | 新增 | `step`/`capture` helper，结尾输出 `KEY=VALUE` 供 agent 解析 |

### Generated Runtime 影响

`skills/spec-debug/**` 是 source。变更后需运行 `spec-first init` 刷新 `.claude/`、`.codex/`、`.agents/skills/` mirrors。本计划**不手改** generated runtime，source 改完后由 init 同步。

### Downstream Consumer 影响

- `spec-code-review`：correct seam 判断与 cleanup grep 纪律产生的回归测试质量更可审。
- `spec-compound`：Phase 4 flag 的「无正确缝=架构发现」与 perf 回归的系统性问题可作为 learning capture 候选。
- `spec-work`：correct seam 暴露的架构问题可作为 larger fix 的 handoff。
- 现有 `evals/examples.json`：作为 examples-as-context 不作确定性 router，新增 perf/HITL 场景时可增量补例，但非必需。

### 治理边界影响

- 不改 scenario capability matrix / context governance / recall trust boundary / 双宿主 / target_repo 等既有约束。
- 不引入新 typed agent；Parallel investigation 选项沿用现有「只读 sub-agent、无代码编辑、平台不支持则顺序」约束。
- HITL template 是脚本资产，不受宿主会话缓存限制，可按常规方式 `bash -n` 验证。

## Failure Modes

| 风险 | 触发 | 缓解 |
| --- | --- | --- |
| militant 提醒被读成硬 gate | 措辞过强，模型误以为不可绕过 | 保留「提醒非 gate」免责声明 + 显式例外出口（二分） |
| perf 分支被滥用到正确性 bug | 模型对任何「慢感」都走 perf 分支 | 分支入口明确「仅当症状是回归性变慢、非错误」 |
| 性能 bisect 被计时噪声污染成 flaky bisect | 单次计时判定在 CPU 频率波动/后台负载/GC 下反复抖动 | 强制多次采样取 p50/p95 而非 mean、warmup 丢弃、**平台条件化环境隔离**（Linux governor/pin；darwin pmset 性能模式）、明确 bisect 阈值；与 Intermittent 提复现率纪律同源（P1-1） |
| correct seam 判断退化成不写测试借口 | 模型用「无正确缝」逃避写回归测试 | 分层策略：浅缝仍写并标注覆盖边界，仅完全无缝时才跳过；「无正确缝=架构发现」必须 flag 到 Phase 4，而非跳过测试的借口；明显单点 bug 仍走 fast-path |
| 浅缝测试制造「表观覆盖」假信心，淹没架构 flag | 写了浅测试 + 标注后，PR「有回归测试」信号让 reviewer 降低推进架构 flag 的紧迫感 | 架构缺口 flag 标 **blocking advisory**（非普通 advisory）+ PR body 明示「仅锁浅层，架构缺口 X 跟踪于 [issue link]」（P2-finding） |
| tagged log 前缀与 defense-in-depth breadcrumb 混淆 | 模型把永久 breadcrumb 也当临时 log 清掉 | 文档明确区分：breadcrumb 是永久取证，tagged log 是本次调试临时埋点 |
| 假设重排仍违反「don't ask by default」 | 模型对每个 bug 都展示假设清单 | 折叠进既有 smart-escalation 时刻，仅在已决定升级/呈现时附带，不作为独立中断点；AFK 按既有 ranking 继续 |
| 增量插入破坏既有 references 结构 | 插入位置不当 | 只在段首/段尾插入，不重排既有内容；改后通读一次 |
| description 触发面漂移 | 改 `description` 加 `slow`/`performance regression` 影响宿主 skill match，与既有 `evals/examples.json` 失配 | 改后确认 `evals/examples.json` 一致（或增量补 perf 触发例）；**注意 `lint:skill-entrypoints` 不校验 description 触发词内容**（已核实），触发面靠人工通读 + 真实运行时触发观察；通读确认既有触发词不被削弱 |
| 跨 skill 路由二义 | 「the build got slow」类请求同时命中 spec-debug（回归诊断）与 spec-optimize（优化实验），description 边界未区分 | 在 description 与 Phase 1.1 入口明确「回归性变慢诊断（找根因）」vs「优化 measurable outcome（优化实验）」边界；跨 skill 路由消歧验证 |

## Anti-Patterns（本计划要避免的）

- **把 spec-debug 重写成 diagnosing-bugs**：本计划是纪律补强不是方法论替换；保留 spec-debug 闭环与 prediction-as-tool 立场。
- **照搬硬 gate 破坏治理哲学**：用 militant 提醒 + 显式例外，而非不可绕过的状态机。
- **把 perf 分支写成技术清单堆砌**：perf 分支是「指路路径」，汇聚已有零散能力，不是新增一堆未验证 profiler 命令。
- **correct seam 变成逃避测试的借口**：「无正确缝」是架构发现，必须 flag，不是跳过测试的理由。
- **增量插入变重写**：references 只做增量插入，不重排既有内容。

## Execution Plan（最小 durable 顺序）

按 80/20 与 spec-debug 既有结构（inline 高价值核心 + references 按需加载），分 8 步落地。

### Step 1 — SKILL.md Phase 1：反馈环就绪清单 + 二分 + 有序菜单

**改动位置**：`skills/spec-debug/SKILL.md` Phase 1 与「Feedback Loop And Hypothesis Ledger」段。

**新增内容（要点）**：
1. Phase 1.1 复现后加「反馈环就绪清单」4 项：
   - Red-capable：驱动真实 bug 代码路径并断言用户精确症状，能在此 bug 上变红、修复后变绿；不是「不报错」。
   - Deterministic：每次同样判定（flaky bug 则为高复现率，见提复现率段）。
   - Fast：秒级，非分钟级。
   - Agent-runnable：可无人值守运行；人类介入仅经 `scripts/hitl-loop.template.sh`。
   - 要求：命名**一个命令**（脚本路径 / 测试调用 / curl），且**已实际跑过至少一次**，贴调用与输出。
2. 「Feedback Loop And Hypothesis Ledger」段把平铺列表改为有序编号菜单（failing test → curl/HTTP → CLI snapshot → headless browser → trace replay → throwaway harness → property/fuzz → bisection harness → differential loop → HITL bash），补齐缺项。
3. `feedback_loop_not_possible` 拆二分：
   - 无环 **且** 无任何捕获证据（trace/error payload/录屏/core dump）→ **stop 并说明**：列已试手段，向用户索取 (a) 环境访问 (b) 捕获产物 (c) 临时生产埋点许可。**在获得上述之一前，不得提交 root-cause-confirmed 声明、不得关闭 causal chain gate**（可形成 working hypothesis，但不得声明 confirmed）——强制度落在可验证的产物约束而非「不进入假设生成」的思想约束，与「LLM decides」真兼容。
   - 无环 **但** 有捕获证据 → 记录 `feedback_loop_not_possible` 与缺失本地环条件，用 bounded evidence 继续；不把未独立确认的因果链接提升为 confirmed。

### Step 2 — SKILL.md anti-rationalization 表：升级「跳过复现」行

**改动位置**：`skills/spec-debug/SKILL.md` Anti-Rationalization Red Flags 表 + 表后免责声明。

**改动**：把「我看出 bug 了,跳过复现」一行的「做什么」列升级为 militant 版（强制度落在产物约束而非思想约束）：
> 先建立最小复现或按二分路径索取捕获证据。没有 red-capable 命令且无捕获证据时，stop 并说明，向用户索取环境/产物/埋点许可；在获得之一前**不得提交 root-cause-confirmed 声明、不得关闭 causal chain gate**（可形成 working hypothesis，但不得声明 confirmed）；不要假装有环。

保留表后「这是注意力提醒,不是 gate,也不替代 LLM 判断」免责声明，使 militant 措辞与治理哲学共存。

### Step 3 — SKILL.md Phase 1.1：引用 perf 分支与 HITL template

**改动位置**：`skills/spec-debug/SKILL.md` Phase 1.1。

**新增**：
- 复现段开头加判断：「若症状是**回归性变慢**（非错误/非崩溃），走 perf 分支：先建基线测量再调查，日志埋点通常无效。详见 `references/perf-regression.md`。」
- 「Manual setup required」段引用 `scripts/hitl-loop.template.sh`：把必须人点击的复现结构化成 loop，结尾输出 `KEY=VALUE` 供解析。

### Step 4 — SKILL.md Phase 2：测试前假设重排折叠进既有 smart-escalation

**改动位置**：`skills/spec-debug/SKILL.md` Phase 2「Smart escalation」段（已有「Hypotheses point to different subsystems → 建议 brainstorm entrypoint」）。

**改动**：**不新增独立用户中断点**。在既有 smart-escalation 时刻——即已耗尽 2-3 假设、已决定要向用户呈现诊断/建议 brainstorm/移交前——把「展示当前排序假设清单」作为该呈现的一个**可选组成部分**，让用户领域知识能瞬间重排或排除已试假设。

理由（P1-3 审查修正）：独立「3+ 竞争假设」checkpoint 与既有 smart-escalation 触发条件重合（散落多假设本就是升级信号），且违反 Phase 0「do not ask questions by default — investigate first」，即便限定范围仍是新增提问面。折叠后用更少新机制达成同等价值，符合 80/20。

约束：用户 AFK 时按既有"proceed with your ranking"行为，无需新规则；不作为默认提问，仅在已决定升级/呈现时附带给一次 cheap 重排机会。

### Step 5 — SKILL.md Phase 3：correct seam 判断 + cleanup grep 引用

**改动位置**：`skills/spec-debug/SKILL.md` Phase 3 Test-first 第 2 步前。

**新增**：
- 在写失败测试前先判断 **correct seam**：测试是否在真实调用点复现 bug 模式。采用「**锁住能锁的，flag 锁不住的**」分层策略：
  - **有 correct seam**：在真实调用点写失败测试，照常 test-first。
  - **仅有浅缝**（单调用者测试而 bug 需多调用者链）：**仍写**失败测试，在测试注释/PR 明确标注「此测试未覆盖完整调用链，仅锁该层」；同时把「无 correct seam=架构发现」flag 到 Phase 4 作为 larger fix / spec-compound 候选。不因浅缝跳过测试。**防假信心（P2-finding）**：浅缝测试存在时，架构缺口 flag 必须标为 **blocking advisory**（而非普通 advisory），且 PR body 必须明示「本 PR 仅锁浅层，架构缺口 X 仍未修，跟踪于 [issue link]」，使浅测试的「表观覆盖」信号无法吞掉架构 flag——否则 reviewer 与未来维护者会因「有回归测试」而降低推进架构修复的紧迫感。
  - **完全无任何能失败-for-right-reason 的缝**：记录「无 correct seam=架构发现」，不写假测试，flag 到 Phase 4；这才是整体跳过的唯一情形。
- 明显单点 bug 仍走 fast-path 写 failing test，correct seam 判断仅对非显然多调用者链 bug 生效。
- Test-first 步骤补「清理本次调试的 tagged debug log（grep 唯一前缀）」引用，与 Step 6 的 cleanup checklist 配套。

### Step 6 — SKILL.md Phase 4：精简 cleanup checklist（收尾卫生，与 Debug Summary 分工）

**改动位置**：`skills/spec-debug/SKILL.md` Phase 4 Handoff 结构化 summary 之后。

**分工**：Debug Summary 是**对外移交的结构化结论**（Problem / Root Cause / Fix / Confidence / verification-run-summary）；cleanup checklist 是**对内的收尾卫生勾选**，聚焦"卫生"而非"结论"，避免与 Summary 字段双源。

**新增精简 checklist**：
- 所有 tagged debug log（唯一前缀，如 `[DEBUG-a4f2]`）已 grep 清除。
- 一次性原型已删除或移到标记位置。
- 正确假设写入 commit / PR message（让下一个调试者受益）。
- correct seam 缺失（若有）已在 Debug Summary 的 `claims_remaining_advisory` 或 Prevention 段 flag；**浅缝测试存在时架构缺口 flag 标 blocking advisory 并在 PR body 明示「仅锁浅层，架构缺口 X 跟踪于 [issue link]」**（防表观覆盖假信心，P2-finding）。
- 原始复现不再复现、回归测试通过已在 Debug Summary 的 verification-run-summary 体现，此处不重复列。

### Step 7 — investigation-techniques.md：提复现率重构 + tighten 三轴 + tagged-prefix 纪律

**改动位置**：`skills/spec-debug/references/investigation-techniques.md` Intermittent Bug Techniques 段首 + instrumentation 相关段。

**增量插入**：
- Intermittent 段首加**一行 framing**（不展开新小节，避免与既有 statistical reproduction / environment isolation 重叠）：「目标是**提高复现率**而非等待干净复现。1% 偶发不可调试；持续 loop 100×、并行、加压、注入 sleep 收窄时序窗口，把率提到 ≥50% 再调查。50% 偶发可调试。沿更快（cache setup、skip unrelated init、narrow scope）/ 更尖锐（断言具体症状而非「没崩」）/ 更确定（pin 时间、seed RNG、隔离 FS、冻结网络）三轴打磨——30 秒 flaky 几乎等于没环，2 秒 deterministic 是 superpower。」tighten 三轴作为 framing 句的一部分，不单列小节。
- instrumentation 段加 tagged-prefix 纪律：本次调试所有临时 log 打同一唯一前缀（如 `[DEBUG-a4f2]`），结束时一次 grep 清除；与 defense-in-depth 的永久 breadcrumb 区分。

### Step 8 — 新增 references/perf-regression.md 与 scripts/hitl-loop.template.sh

**新增 `references/perf-regression.md`**（结构）：
- 何时用：症状是回归性变慢、非错误/非崩溃。
- 核心原则：**Measure first, fix second**；日志埋点通常无效。
- 基线测量：timing harness、`performance.now()`、profiler、查询计划（`EXPLAIN ANALYZE`）、APM trace span 时长。
- **统计计时纪律（P1-1）**：每个被测 commit 跑 N 次（10-20），取 **p50/p95 而非 mean**（mean 被尾部拖偏）作 bisect 判定值；warmup 轮丢弃；**环境隔离平台条件化**（Linux：cpufreq governor / taskset pin；darwin 宿主：`sudo pmset -a` 性能模式，无 governor；跨平台通用：关后台 / 固定电源 / 隔离 FS·网络）以隔离噪声；与 investigation-technologies 的 Intermittent 段同源（性能 bisect 本质是非确定性 bug 的一种）。
- **二分定位**：`git bisect` 配 timing 测试脚本；**bisect 阈值必须明确**（如「p95 慢于基线 X%」），避免「感觉慢」主观判定；按性能回归 commit 而非按正确性。**阈值噪声带边界纪律**：当某 commit 的 p95 落在阈值 ± 采样噪声带内时标记 inconclusive，对该 commit 重采样（增大 N）或改用更宽阈值 / 收窄 bisect 区间，不让 `git bisect run` 对噪声带内 commit 做硬 0/非0 判定（否则 bisect 收敛失败或收敛到错误 commit）。
- 常见性能 bug 类：N+1 查询、回归性算法复杂度、缓存失效、锁竞争、内存压力、冷启动。
- 与既有 references 交叉引用：system boundary checks 的 DB 段（EXPLAIN / 慢查询日志 / 锁）、evidence harvesting 的 APM trace 段、Intermittent 段的提复现率纪律。

**新增 `scripts/hitl-loop.template.sh`**：移植 diagnosing-bugs 同款模板，`step`/`capture` helper，结尾输出 `KEY=VALUE` 供 agent 解析；编辑区用占位 step/capture 示例。**统一为仓库 shell 风格**（CLAUDE.md 代码风格要求）：`#!/bin/bash` 而非 `#!/bin/env bash`，并加 `set -euo pipefail`（diagnosing-bugs 原模板已用 `set -euo pipefail`，保留；shebang 统一为 `#!/bin/bash`）。

## Verification Plan

按 spec-debug 「Agent 与 Skill 变更验证」纪律：**优先验证源码真相源**（直接检查 `skills/spec-debug/`），行为语义用 **fresh-source eval**（把改后源码注入全新只读 subagent 评估 debug posture），不依赖当前会话缓存。

### 源码直接验证

- `npm run typecheck`：对 CLI 与关键脚本 `node --check`（含新增 `scripts/hitl-loop.template.sh` 用 `bash -n` 单独验证）。
- `bash -n skills/spec-debug/scripts/hitl-loop.template.sh`：HITL template 语法检查。
- 通读改后 `skills/spec-debug/SKILL.md` 与三份 references，确认增量插入未破坏既有结构、无重复段落、无断链引用。

### fresh-source eval（debug posture）

按 `docs/contracts/workflows/fresh-source-eval-checklist.md`：把改后的 `skills/spec-debug/SKILL.md` + references 注入一个**全新只读 subagent**，给一组 debug 场景（含：偶发 bug、生产无本地环但有 Sentry 证据、性能回归、需多调用者链的 bug、必须人点击的复现），评估其是否：
- 在偶发 bug 上主动提复现率而非等干净复现。
- 在无本地环+有 Sentry 证据上走 bounded-evidence 而非硬停。
- 在无本地环+无证据上 stop 索取而非盲猜。
- 在性能回归上走 perf 分支而非日志埋点，且用多次采样 p50/p95 + 明确阈值判定，而非单次计时。
- 在需多调用者链的 bug 上判断 correct seam：浅缝仍写并标注覆盖边界、同时 flag 架构缺口，而非整体跳过；仅完全无缝时才整体跳过并 flag。
- 在必须人点击场景引用 HITL template。
- **反向回归**：给一个明显单假设 bug，验证模型不会因假设重排机制而多余提问/展示清单——don't-ask-by-default 未被破坏（P1-3 专门加的回归场景）。

**代理强度边界声明（P1-finding）**：fresh-source eval 验证的是**源码可读性与意图传达**，不验证宿主运行时 skill 触发器在 description 改动后的实际分发命中率——真实消费者是 Claude/Codex 宿主在会话启动时按 description match 分发，与「subagent 读完文本后的回答姿态」是两个通道。eval 通过 ≠ 运行时行为已改变。因此 description 触发面验证除静态一致校验外，应补**至少一次真实运行时触发观察**（见治理验证段）；若无法实测，必须记录原因，不得把 eval 通过读作运行时验证。

**限制声明**：若宿主缺少 dispatch primitive、runtime 无法调用，或用户显式禁用 helper agents，必须记录未执行原因，不能声称通过。

#### 执行结果（2026-06-28，三轮 fresh-source eval）

按 checklist 的"larger workflow changes 至少一次 judge/human agreement check"要求，执行了**三轮不同镜头**的 fresh-source eval（每轮一个全新只读 subagent，注入改后磁盘源码，无宿主 skill-discovery 缓存）：

| Round | 镜头 | 模型 | 场景 | 结果 |
| --- | --- | --- | --- | --- |
| 1 | neutral 行为姿态 | sonnet | 6+1 debug 场景（含反向回归） | `passed`，7/7 produces_intent，0 findings |
| 2 | adversarial 证伪 | sonnet | 5 个对抗场景（militant-vs-LLM-decides / HITL-vs-readiness 张力 / shallow-seam 诱惑跳过 / 2-hypothesis gap / perf-vs-optimize 撞车） | `passed`，5/5 produces_intent，0 findings |
| 3 | implementation-readiness deciding vote | opus | 2-hypothesis gap 是否需源码补一句 + spot-check 前两轮 3 个最强判定 | `passed`，decision_on_D=benign（显式 default 覆盖、非靠缺席隐式），3 spot-check 全 confirmed，0 findings |

**综合判定：`fresh_source_eval: passed`**。13 个独立判定点全 produces_intent/confirmed/benign，跨 neutral/adversarial/deciding-vote 三镜头零分歧。最薄弱点（2-hypothesis gap）经 opus deciding vote 判定为由 Phase 2 显式 default（form hypotheses → predictions → causal chain gate）覆盖，补一句会 over-specify 已被 default+exception 结构覆盖的边界，故**无源码修复**。

**代理强度边界（仍成立）**：fresh-source eval 验证的是源码可读性与意图传达，**不验证宿主运行时 description 改动后的实际分发命中率**。运行时触发观察（Step 2）仍为 deferred——需在新会话实测 `slow`/`performance regression` 触发是否命中 spec-debug 及与 spec-optimize 的路由消歧，本会话 agent 无法开新会话（已缓存旧定义），记录为 `not_run: requires new-session observation by user`。此 deferred 子项不影响 fresh-source eval 本身的 passed 状态。

### 治理验证

- `npm run lint:skill-entrypoints`：skill 入口治理校验（**仅校验标题与 legacy slash 命令模式，不读 description 触发词内容**——已核实 `scripts/lint-skill-entrypoints.config.json` blockedPatterns 不含 description/trigger 检查；不得把触发面校验归于此项）。
- **description 触发面验证（静态）**：确认 `skills/spec-debug/SKILL.md` 的 `description` 改动（新增 `slow` / `performance regression`）不削弱既有触发词，且 `evals/examples.json` 仍一致或已增量补 perf 触发例；通读人工确认（lint 不覆盖触发词内容）。
- **跨 skill 路由消歧验证（P2-finding）**：spec-optimize 的 description 已含「build performance」触发；新增 `performance regression` 后「the build got slow」类请求会同时命中 spec-debug 与 spec-optimize。需明确边界——**spec-debug 触发「回归性变慢诊断」**（找根因），**spec-optimize 触发「优化 measurable outcome」**（优化实验）——并在 fresh-source eval 或人工通读中确认该边界在 description 与 Phase 1.1 入口处可区分。
- **真实运行时触发观察（P1-finding）**：除静态 cmp 外，在新会话用含 `slow` / `performance regression` 的用户消息实测是否触发 spec-debug（运行时分发命中率）；若宿主不支持新会话实测，记录无法实测的原因，不得把静态一致读作运行时验证。
- 确认未引入新 typed agent、未改 scenario capability / context governance / 双宿主约束。
- `spec-first init` 刷新 generated mirrors 后，`cmp` 确认 `.claude/`、`.codex/`、`.agents/skills/spec-debug/**` 与 source 一致。

#### 运行时触发观察执行结果（2026-06-28，Step 2-A/B + 用户观察清单 2-C）

**Step 2-A 静态路由消歧分析**：对照 spec-debug（`why is this slow` / `performance regression` + debug/fail/errors 触发词）与 spec-optimize（`build performance` / `optimizing` / `measurable outcome` 触发词）description——触发**短语零完全重叠**，但 `performance` 是共享 token（spec-debug "performance regression" / spec-optimize "build performance"）。语义边界由动词区分：诊断动词（"why" / "figure out why" / "got slow"）→ spec-debug；优化动词（"improve" / "optimize" / "run experiments" / "make it faster"）→ spec-optimize。Phase 1.1 入口消歧句（SKILL.md:188 `Distinguish from spec-optimize ... this is diagnosing WHY ... not running optimization experiments`）作为 description 路由的二次兜底。

**Step 2-B fresh-subagent 路由模拟（opus，10 条用户消息）**：10 条消息中 9 条干净路由（诊断动词→spec-debug / 优化动词→spec-optimize），**1 条真实撞车**——message 8「the build got slow, can you make it fast again」：第一从句「got slow」命中 spec-debug `performance regression`/`why is this slow`，第二从句「build」+「make it fast」命中 spec-optimize `build performance`，description-only matcher 看到两者无 tie-breaker。**finding P2**：message 8 类请求跨 skill 撞车。

**B 的 finding 处理决策**：B 明确「no source fix strictly required if Phase 1.1 disambiguation is reliably present at session start」。Phase 1.1 入口消歧句已在 source（SKILL.md:188），是 description 撞车的已落地兜底。**本会话不改 description**——改 description 是独立 source 改动，需自己的 plan/review，且会重置依赖 description 的 fresh-source eval。把"是否在 spec-debug description 加显式 handoff 句"作为 Step 2-C 真实新会话观察的**判定依据**：若观察确认 message 8 类请求撞车且 Phase 1.1 兜底有效→不改；若撞车且兜底失效→开新 plan 加 description handoff 句。

**Step 2-C 用户可复现观察清单（本会话 agent 无法开新会话，需用户在新会话执行）**：

本会话 agent 已缓存改前 spec-debug 定义，无法 fresh-load；运行时分发命中率只能由用户在新会话观察。执行步骤：
1. 开一个**全新会话**（确保加载改后 spec-debug runtime mirror——已核实 `.claude/spec-first/workflows/spec-debug/SKILL.md` description 含 `why is this slow` / `performance regression`）。
2. 依次发以下 4 条用户消息，观察宿主实际把哪个 skill 加载进上下文（看 `/spec:*` 触发建议或 skill 被注入的信号）：
   - `why is the build slow after the last deploy` → 期望触发 **spec-debug**（诊断动词 "why"）
   - `improve build performance — want it faster` → 期望触发 **spec-optimize**（优化动词 "improve"）
   - `performance regression in the API: p95 doubled this week` → 期望触发 **spec-debug**（`performance regression` 字面命中）
   - `the build got slow, can you make it fast again` → **撞车观察点**：期望宿主有路由消歧（spec-debug Phase 1.1 入口应捕获"这是回归诊断"），若宿主误路由到 spec-optimize 或同时触发两者且无消歧→记录为 finding。
3. 回填观察结果到本段（每条消息的实际触发 skill），或记录 `not_run: <原因>`。
4. **判定**：若 message 4 撞车且 Phase 1.1 兜底有效→本 plan 维持 `completed`，无需改 description；若撞车且兜底失效→开新 plan 在 spec-debug description 加显式 handoff 句（如「open-ended 'make it faster' / 'run experiments to speed up' requests belong to spec-optimize」）。

**当前状态**：Step 2-A/B 在本会话完成（静态+模拟），Step 2-C 真实新会话观察仍 `not_run: requires new-session observation by user`。这是 plan 已声明的代理强度边界——fresh-source eval + 静态/模拟分析不覆盖运行时分发通道。本会话已做最大努力，剩余为用户可执行的确定性观察。

### 不执行项

- 不跑 `quick_validate.py`（PATH 中不可用，无等价仓内脚本），明确记录而非静默跳过。
- 不依赖当前会话已缓存的 spec-debug 调用验证行为（会话缓存可能仍是旧内容）。

## CHANGELOG

落地时按仓库格式追加 `CHANGELOG.md` 条目，`author` 读 `~/.spec-first/.developer`（已确认为 `leokuang`），用户可见行为变化（debug workflow 诊断纪律与 perf/correct-seam 能力增强）追加 `(user-visible)`。

## Open Questions

1. **假设重排是否值得在 smart-escalation 时刻附带**：折叠后它已是既有升级时刻的可选组成部分，无独立触发阈值问题。落地时观察 fresh-source eval 的反向回归场景（明显单假设 bug 不应展示清单），若仍多余展示则进一步收窄为「仅在已决定建议 brainstorm/移交时」而非所有升级时刻。原「3+ 竞争假设阈值」已随 P1-3 折叠作废。
2. **perf-regression.md 是否需要 framework-specific 段**（如 Rails N+1、Node.js event loop 延迟）？investigation-techniques.md 已有 Framework-Specific Debugging 段，建议 perf 文档只做路径指路 + 交叉引用，不重复 framework 细节，避免双源漂移。

## Completion Criteria

本计划完成的判定标准（已落地项勾选；未验项留空）：

- [x] SKILL.md Phase 1 含 4 项反馈环就绪清单 + 有序手段菜单 + `feedback_loop_not_possible` 二分。
- [x] anti-rationalization 表「跳过复现」行升级为 militant 版，保留「提醒非 gate」免责声明。
- [x] Phase 1.1 引用 perf 分支与 HITL template；description 触发词含 `slow` / `performance regression`，且触发面验证（evals 一致 / 既有词未被削弱）通过。
- [x] Phase 2 假设重排折叠进既有 smart-escalation 时刻（无独立中断点、AFK-safe、不违反 don't-ask-by-default）。
- [x] Phase 3 含 correct seam 判断（锁住能锁的浅缝 + flag 锁不住的，仅完全无缝才整体跳过）+ tagged log 清理引用。
- [x] Phase 4 含精简 cleanup checklist（含 grep tagged log、correct seam flag；浅缝测试存在时架构缺口 flag 标 blocking advisory + PR body 明示）。
- [x] militant 提醒与「LLM decides」真兼容：强制度落在「不得提交 root-cause-confirmed 声明 / 不得关闭 causal chain gate」产物约束，而非「不进入假设生成」思想约束（doc-review P1）。
- [x] Verification Plan 含 fresh-source eval 代理强度边界声明 + 真实运行时触发观察（或记录无法实测的原因）；治理验证删除「lint 覆盖触发面」虚假保证并补 spec-optimize 跨 skill 路由消歧（doc-review P1/P2）。
- [x] investigation-techniques.md 含提复现率重构 + tighten 三轴 + tagged-prefix 纪律（增量插入，未破坏既有结构）。
- [x] `references/perf-regression.md` 新增，含基线测量 → 统计时计（p50/p95 多次采样 + **平台条件化环境隔离** + 明确阈值 + **阈值噪声带 inconclusive 边界纪律（exit 125 skip）**）→ 二分定位 → 先量后修，并交叉引用既有 references；Decision Brief 含「perf 独立成文件 vs 节」的实质理由声明。
- [x] `scripts/hitl-loop.template.sh` 新增，统一仓库 shell 风格（`#!/bin/bash` + `set -euo pipefail`），`bash -n` 通过。
- [x] fresh-source eval 已执行并记录结果——三轮不同镜头（neutral/adversarial/deciding-vote）全 `passed`、零 findings，结果记录于 Verification Plan「执行结果」段；运行时触发观察（Step 2）仍 deferred（需新会话实测，本会话 agent 无法开新会话），记录为 `not_run: requires new-session observation by user`，不影响 eval 本身的 passed 状态。
- [x] `spec-first init` 刷新 generated mirrors，`cmp` 与 source 一致（仅路径重写差异，语义一致）。
- [x] `npm run typecheck`、`npm run lint:skill-entrypoints` 通过。
- [x] `CHANGELOG.md` 已追加条目，用户可见变化标 `(user-visible)`。

未完成项：fresh-source eval 行为语义验证（代理强度边界已声明，但运行时触发 hit-rate 未观察，记录为 deferred）；后续 code-review 落地补 spec-debug-contracts 新断言（9 项新行为 + description 触发守卫 + dead-link 守卫，已纳入本轮 review 修复）。

## Status

`status: completed` — Step 1-8 源码落地完成 + fresh-source eval 三轮通过 + Step 2-A/B 运行时触发观察的本会话可做部分完成。已完成四轮修订 + Step 2 部分推进：
1. 首轮设计审查修订（P1-1 perf 统计时计 / P1-2 correct seam 锁住能锁的 / P1-3 假设重排折叠进 smart-escalation / P2-1 tighten 三轴改 framing 句 / P2-2 description 触发面验证 / P2-3 checklist 分工措辞 / P3 措辞与 shell 风格）。
2. `/spec:doc-review` 对抗审查（coherence / feasibility / scope-guardian / adversarial 四视角）：应用 1 个 safe_auto + 7 个 manual 修正——perf 环境隔离平台条件化、militant 与 LLM-decides 真兼容（强制度落产物约束）、fresh-source eval 代理强度边界声明、lint 触发面虚假保证纠正 + spec-optimize 路由消歧、bisect 阈值噪声带边界纪律、浅测试假信心 blocking-advisory 防护、perf 独立成文件理由声明。
3. `/spec:code-review`（correctness / testing / maintainability / project-standards / agent-native + learnings-researcher）Auto-resolve 落地 10 个 finding：HITL 模板诚实标注为 human-operated（非 agent-runnable）、no-loop+no-evidence 分支补 AFK fallback、perf 命令名纠正（cpupower/cpufreq-set）+ 权限前置 + 降级模式、bisect 噪声带补 exit 125 skip wrapper、三轴去重改交叉引用、9 项新行为 + description 触发面 + dead-link 补 spec-debug-contracts 断言（11→17）、契约测试去掉冻结的过期 flat-list 改锁菜单 cue、plan status 改 partially-shipped 并勾选已满足项。
4. fresh-source eval 三轮（neutral sonnet / adversarial sonnet / deciding-vote opus）：13 个独立判定点全 `passed`、零 findings、零分歧；2-hypothesis gap 经 opus deciding vote 判定为由 Phase 2 显式 default 覆盖、无源码修复。`fresh_source_eval: passed`。
5. Step 2 运行时触发观察：**2-A 静态路由消歧分析**完成（触发短语零完全重叠、`performance` 共享 token、动词区分诊断/优化、Phase 1.1 入口消歧兜底）；**2-B fresh-subagent 路由模拟（opus，10 条消息）**完成——9 条干净路由 + 1 条真实撞车（message 8「the build got slow, make it fast again」跨 spec-debug/spec-optimize，P2 finding），处理决策为不改 description、靠 Phase 1.1 兜底（B 明确「no source fix strictly required if Phase 1.1 reliably present」）；**2-C 真实新会话触发观察**仍 `not_run: requires new-session observation by user`——本会话 agent 无法开新会话，已写成用户可复现观察清单（治理验证段「Step 2-C」4 步骤）。

Deferred 子项（不影响 completed）：Step 2-C 真实新会话触发观察——用户在新会话执行观察清单（4 条消息实测 + 判定逻辑），结果决定是否需开新 plan 在 spec-debug description 加显式 handoff 句。此为 plan 已声明的代理强度边界：fresh-source eval + 静态/模拟分析（2-A/B）不覆盖运行时分发通道，需用户观察关闭。