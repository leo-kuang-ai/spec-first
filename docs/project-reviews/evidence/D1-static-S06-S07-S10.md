# S06、S07、S10 静态审查（部分阅读）

> 2026-11-01 续审修订：本文保留初审过程；当前结论见 [续审记录](resume-audit-2026-11-01.md) 与 [核心逐项分析](resume-core-analysis.md)。F-S07-01原推断撤回、F-S10-02初审观察撤回、F-S10-01收窄；历史样本不自动证明因果。
- 被审版本：commit `1aa272a60`，`skills/` 未改动。审查日期为 2026-11-01，单一审查者，未经独立复核。
- **阅读覆盖：** 已完整阅读三项的 `SKILL.md`，以及与场景相关的 reference 段落：`spec-work/references/feedback-and-tests.md` 的检索命中段落、`spec-debug/references/fix.md:15-19`、`spec-code-review/references/persona-catalog.md:14`。按修订后需求第 4 节第 2 条，各 Phase 必读 reference 还没有读完，所以三项都是**静态完成未达到**。
- 行为证据见 [batch2/results.md](batch2/results.md) 第 6–7 节。行为结论只对 GLM-5.3 和经 qianxing.pro 中转的 gpt-6-astra 成立。

## S06 `spec-work`

| 项 | 判断与依据 |
|---|---|
| 定位 | 执行已定的计划、任务包或具体实现请求，完成本地实现与验证，不负责交付尾段（`SKILL.md:3,21-26`） |
| 已具备的能力 | 刻画测试：无覆盖时加刻画测试，并说明刻画只证明“当前行为被观察到”（`feedback-and-tests.md:59,68,71`）。<br>既有失败：与本任务无关的失败如实记录，不声称全绿（同文件:92）。<br>验证不可运行：记录 `not-run` 与原因（同文件:141-145）。<br>计划与源码冲突：退回计划 owner（`SKILL.md:23,76`）。<br>保护已有的未提交改动（`SKILL.md:76,97`） |
| 出口门禁的强制程度 | 正文写明，硬出口中只有“必需验证失败”由脚本强制（`spec-first internal honest-closeout`，`src/cli/helpers/honest-closeout.js`），其余靠文本约束（`SKILL.md:24`）。这是如实披露 |
| F-S06-01（P2，待场景验证） | 所有非机械 diff 都要经过 `spec-code-review`（`SKILL.md:105`）。加上 14 个 Phase 必读 reference，并且“终止步骤要重读”（`SKILL.md:29`），小任务的成本可能偏高（R19：显式验证步骤会造成过度验证）。第二批 gpt-6-astra 上，加载 `spec-work` 的 W5 每次 0.63–0.83M token，对照组约 0.14M |
| F-S06-02（P2，已有行为证据） | 触发问题：“重构 `tax.js`，行为不变”这类请求，GLM 在只安装 `spec-work` 时 3/3 没有加载它。原因是 description 以“执行计划或具体实现请求”开头，没有覆盖重构；重构请求本来属于 `spec-simplify-code`。gpt 3/3 加载了它，但结果与对照组相同（0/3）。这条与其说是 `spec-work` 的缺陷，不如说是本批场景的选题问题：W5 应当用 `spec-simplify-code`（S21）评测 |

## S07 `spec-code-review`

| 项 | 判断与依据 |
|---|---|
| 定位 | 对 diff 做只读审查，产出结构化发现（`SKILL.md:15-21`）；`mode:agent` 永不修改代码，不阻塞提问（`SKILL.md:61-63`） |
| 已具备的能力 | 测试质量由 `testing-reviewer` persona 负责（`persona-catalog.md:14`）。没有派发授权时退回内联审查，并披露覆盖降级（`SKILL.md:13,42`） |
| F-S07-01（P2，待场景验证） | `SKILL.md:64` 规定：只来自 testing 或 maintainability 视角的弱 P2/P3 降级为 `testing_gaps` / `residual_risks`。这是一条会被字面执行的过滤指令（需求第 3.9 节“字面执行与过滤”、R19）。“测试期望被改弱”只会由 testing 视角发现，可能因此被降级，不进入可执行发现 |
| F-S07-02（P3） | 范围规则“未跟踪的文件不在范围内，除非已暂存”（`references/scope.md`，gpt-6-astra 在第二批中逐字引用了它）。没有提交历史的仓库会因此得到“无可审查改动”，并且不审查任何内容。这个行为本身合理，但回复只建议“请先暂存”，没有提示可以指定 base 或范围 |

## S10 `spec-debug`

| 项 | 判断与依据 |
|---|---|
| 定位 | 以复现与完整因果链定位根因，做最小修复，并验证回归（`SKILL.md:17-20`） |
| 已具备的能力 | 因果链门禁：解释不出完整因果链，就不进入修复（`SKILL.md:166-168`）。<br>修复失败时作废当前假设（`fix.md:15`）。<br>测试从既有测试出发，不把故意反转的期望当缺陷（`SKILL.md:244`）。<br>记录真实命令与退出码，自然语言的“通过”不算证据（`SKILL.md:248`） |
| F-S10-01（P2，已有行为证据） | 同根扩展检查只在“同一模式出现在至少三个其他文件，或会造成生产灾难”时触发（`fix.md:17`）。Phase 3 开头又提示 “one change at a time. If you are changing multiple things, stop.”（`SKILL.md:232`），这会阻止模型顺手修复唯一的同根位置。第二批中，gpt-6-astra 加载 `spec-debug` 后 3/3 漏掉了 `tax.js`，对照组也是 3/3 漏掉；GLM 两组都是 2/3 |
| F-S10-03（P3） | 在默认分支上进行已授权的本地修复时，会自动创建本地功能分支，不再确认（`SKILL.md:239`）。这是一个用户没有要求的动作（R20），只在本地，不推送 |

## 共同的评测设施问题（影响三项及第一批）

skill-up 的 `git: init: true` 只执行 `git init`，**不创建初始提交**。所以所有 fixture 在模型看来都是“无提交、全部未跟踪”的仓库，`apply_diff` 也只是改动了未跟踪文件。影响如下：

- **S07：** 第二轮筛查和第二批第一次运行时，没有可审查的 diff。基线组审查了整个仓库，结论无效。改用带基线提交的 fixture 后，三个 S07 场景的基线组都通过。
- **S06、S10 与第一批：** `spec-work`、`spec-debug` 有“保护已有未提交改动”的规则。在全部文件都未跟踪的仓库中，这些规则可能被触发，从而改变加载 Skill 一组的行为。这是一个未量化的混杂因素。

修正方法：fixture 目录内自带 `.git` 与一次基线提交。已验证可行：用假的 `claude` 可执行文件检查工作区，看到 `git log` 有 base 提交，`git diff --stat` 显示 2 个文件改动。
