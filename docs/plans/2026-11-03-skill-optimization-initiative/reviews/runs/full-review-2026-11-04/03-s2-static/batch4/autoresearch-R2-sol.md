# autoresearch 评审（R2）

范围：当前 worktree 的 `skills/autoresearch/` 全包、消费者清单所列三份测试、检查表与合同基线。以下裁决仅针对 `structure_contract`；未执行行为评测、测试或运行成本测量，不据此降级静态裁决。冻结提交 `5b59293b` 采用任务提供的信息，未独立完成 Git 身份核验。

## 逐项裁决表

表中 `skills/autoresearch/` 简写为 `AR/`；其余路径相对仓库根目录。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `AR/autoresearch.md:40-54,87-99`；`AR/references/reason-judge-protocol.md:24-46` | 候选隔离、冻结测量、防取巧、允许无缺陷和并列裁决都有明确风险对象，不因模型能力增强而应直接删除。 |
| D02 | pass | `AR/SKILL.md:76-78`；`AR/scripts/orchestrate.sh:74-84,118-150`；`AR/regression.md:30-64` | 目标语义归 LLM，脚本提供关键词事实、状态计算和格式检查；回归分类、噪声与迁移约束具有具体决策内容。 |
| D03 | fail | `AR/SKILL.md:103-107`；`AR/scripts/orchestrate.sh:128-141,256-287` | 状态校验没有检查直接决定验证与收敛的布尔字段，畸形账本仍可能通过校验并输出 DONE。 |
| D04 | fail | `AR/fix.md:101-104`；`AR/debug.md:93-97`；`AR/scripts/orchestrate.sh:118-125`；`AR/SKILL.md:83-87` | 生产者交接提供 `findings`，路由消费者读取 `errors`、`untested_gaps`，但没有定义折叠转换，未解决事项可能丢失。 |
| D05 | fail | `AR/SKILL.md:20-30,68-72`；`AR/references/orchestrator-routing.md:8,71` | 顺序匹配与强制模式标志冲突，主入口对主观目标的排除和接纳也不一致，关键分发规则不能唯一解释。 |
| D06 | fail | `AR/predict.md:43-58`；`AR/references/predict-personas.md:44-51`；对照 `AR/references/reason-judge-protocol.md:15-22` | reason 有无授权或无 dispatch 能力时的诚实降级，predict 却直接要求独立隔离 personas，能力假设没有同等出口。 |
| D07 | pass | `tests/unit/autoresearch-orchestrator-regression.test.js:23-91`；`tests/unit/autoresearch-score-regression.test.js:26-73`；`AR/autoresearch.md:88-109` | 当前维护依据包含针对拒绝脱敏、错误收敛、协议非法值和测量投机的聚焦防回归约束；不将它们外推为真实收益。 |
| D08 | fail | `AR/SKILL.md:24,32-49,68-79`；`AR/autoresearch.md:32-59` | 主入口声明 Classic 和各子命令，却未规定加载对应协议文件，按需加载可能漏掉 Git ownership、测量冻结等必要原文。 |
| B01 | fail | `AR/SKILL.md:3,20-28,68-72` | description 要求不可检查目标转出，正文却内置主观单次分发；`--classic`／`--auto` 的强制语义也与匹配顺序冲突。 |
| B02 | fail | `AR/SKILL.md:83-97`；`AR/fix.md:103`；`AR/scripts/orchestrate.sh:118-125` | 输入、交接和消费者之间缺少明确归一化合同；存在文件和同名概念不能证明字段语义已经衔接。 |
| B03 | fail | `AR/ship.md:84-92,110-115`；`AR/predict.md:43-58`；`AR/references/reason-judge-protocol.md:18` | 正向发布有批准门，但 rollback 未核对目标与当前状态；predict 也没有继承 reason 已明确的委派授权边界。 |
| B04 | fail | `AR/evals/eval.yaml:3-11`；`AR/evals/cases/dispatch-classic-mode.yaml:9-11`；`AR/evals/cases/screen-cmd-refuses-unsafe-predicate.yaml:9-11`；`src/cli/contracts/dual-host-governance/skills-governance.json:6-20` | 源码治理将其作为跨宿主 Skill，评测输入却明确要求加载 `.claude/skills/` 镜像，fresh-source 来源合同不成立。 |
| B05 | fail | `AR/autoresearch.md:35-44,58,99`；对照 `AR/fix.md:40-43`、`AR/debug.md:44-46`、`AR/ship.md:104-108` | Classic 已有唯一目录和精确恢复规则，其他子命令仍使用分钟级目录且缺少同等恢复约定，隔离与重复执行保障不一致。 |
| B06 | pass | `AR/autoresearch.md:87-109`；`AR/regression.md:78-88`；`AR/security.md:56-60`；`AR/learn.md:85-108` | 有任务行为与 diff 核查、最终确认、限域 STABLE、修复后重检、finding 位置证据和只读检查保护；这些是静态义务，不等于已执行。 |
| X01 | fail | `AR/SKILL.md:82-97`；`AR/autoresearch.md:58,99`；`AR/fix.md:42`；`AR/reason.md:38` | 长循环有预算与日志，但多 hop 的唯一运行身份、恢复和输出隔离未统一，不能可靠承接长任务或同分钟重入。 |
| X02 | pass | `AR/regression.md:48-64,74-80`；`AR/references/orchestrator-routing.md:17-19`；`AR/scripts/score-regression.sh:85-95` | 职责内已有 API 兼容、迁移验证、旧协议退役说明与别名兼容；不强加额外 ADR 或通用版本框架。 |
| X03 | fail | `AR/regression.md:64,80,88`；`AR/ship.md:86-99,110-115` | 正向高风险交付有验证和授权约束，但 rollback 仅按最近日志反向操作，未绑定当前部署／产物和精确授权范围。 |
| X04 | fail | `AR/SKILL.md:95-97`；`AR/autoresearch.md:120-123`；`AR/improve.md:22-25,40-46`；`AR/learn.md:63-65` | 交接有 owner 和时间戳，但缺统一来源身份、有效性和限制信息；“最近摘要”与“已生成页面”可在来源变化后直接复用。 |

## Findings

### F1 · P1：主入口没有建立子协议的必读分发关系

- **位置：** `skills/autoresearch/SKILL.md:20-49,76-85`；`skills/autoresearch/autoresearch.md:32-59`。
- **事实：** Classic 分支仅写“existing metric loop, unchanged”；子命令表只列功能与迭代次数，没有要求进入分支前读取对应 `.md`。正文明确加载的主要是 `references/orchestrator-routing.md`。
- **后果：** 仅加载 `SKILL.md` 的执行者可能直接开始迭代，而未获得实际承载 Git ownership、冻结测量输入、唯一目录及精确恢复规则的协议。文件随包交付不等于已进入执行上下文。
- **最小修复：** 在分发表增加协议路径，并规定“进入所选模式／子命令前完整读取对应文件”；Classic 明确绑定 `autoresearch.md`，无需把全部协议塞回入口。

### F2 · P2：分发优先级和职责边界存在两组冲突

- **位置：** `skills/autoresearch/SKILL.md:3,20-28,68-72`。
- **事实：**
  1. 要求按表顺序解析，但 `Metric:`／`Verify:` 和自由文本均排在强制模式标志之前。
  2. description 要求不能表达为可检查信号的目标转出，正文却将 document、what-to-build、decide-design 纳入内部单次分发。
- **后果：** `--auto` 搭配 `Verify:`、`--classic` 搭配自由文本，以及主观设计请求，都没有唯一静态解释；自然入口和显式调用可能选择不同职责。
- **最小修复：** 明确标志覆盖关系及双标志冲突处理；对主观单次分发作一次产品裁决：保留则同步 description，转出则给出目标入口并移除内部接管承诺。

### F3 · P1：handoff 到路由状态的转换缺失

- **位置：** `skills/autoresearch/debug.md:95`；`skills/autoresearch/fix.md:103`；`skills/autoresearch/security.md:100`；`skills/autoresearch/SKILL.md:83-97`；`skills/autoresearch/scripts/orchestrate.sh:118-125`。
- **事实：** debug 输出已确认 bugs，fix 输出未修复 errors，security 输出 findings；消费者却通过 `last_handoff.errors` 和 `last_handoff.untested_gaps` 选择补救路径。“Fold handoff”未说明如何转换，也未规定失败／有残余时清除旧的 `predicate_met`。
- **后果：** 合法生产者输出不能直接满足消费者预期；若沿用旧 predicate，残余事项存在却未进入阻断分支在静态上是可达的。
- **最小修复：** 定义一个轻量归一化合同：各 source 如何映射未解决错误、验证缺口和状态；无法解释的交接阻断完成声明。同步生产者、消费者并补一条完整链路反例，而非只测试手工构造的 `errors` 字段。
- **保持边界：** `core/08` 的拟议 YAML 与数量阈值不应直接套用；本问题是现有生产者与消费者之间的实际语义缺口。

### F4 · P1：`validate-state` 没有校验收敛关键字段

- **位置：** `skills/autoresearch/scripts/orchestrate.sh:128-141,236-240,256-287`。
- **事实：** 校验函数不检查 `predicate_met`、`pending_verify` 的类型，消费者却直接使用 Python truthiness。
- **静态反例：** 在其余必填字段合法时，`predicate_met: "false"` 不会被校验拒绝；字符串为真值，`next-hop` 随后可以输出 `DONE`。这由源码分支可直接判断，未声称运行过该反例。
- **后果：** “ malformed ledger 不可用于路由”的入口承诺不成立，错误类型可被升级成完成信号。
- **最小修复：** 对出口相关布尔字段实施严格类型校验；对实际消费的 hop、路由位置等嵌套字段补必要类型与取值检查，非法输入统一返回明确错误。脚本只校验结构，不替代证据真实性判断。

### F5 · P1：fresh-source 评测反向指定 generated runtime

- **位置：** `skills/autoresearch/evals/eval.yaml:3-11`；三份 `skills/autoresearch/evals/cases/*.yaml` 中的输入说明，分别为 `dispatch-classic-mode.yaml:9-11`、`screen-cmd-refuses-unsafe-predicate.yaml:9-11`、`ship-never-auto-approves.yaml:10-15`。
- **事实：** 配置声明加载本地 Skill，case 又要求完整读取 `.claude/skills/autoresearch/SKILL.md`；环境为 `none`。
- **后果：** 即使评测通过，也不能唯一绑定当前 owning source；镜像过期、缺失或额外加载都可能改变被测对象。这是静态加载合同冲突，不是因本轮没有运行评测而判失败。
- **最小修复：** case 只引用明确传入的 source 根或由 runner 注入当前 source；移除对 `.claude/` 的被测真相源声明。自然 runtime 加载另设场景、另记版本。

### F6 · P2：评测判据不能兑现其“顺序／不得执行”声明

- **位置：** `skills/autoresearch/evals/fixtures/scripts/check-classic-banner.sh:8-20`；`skills/autoresearch/evals/fixtures/scripts/check-screen-refusal.sh:4-19`；`skills/autoresearch/evals/fixtures/scripts/check-ship-gate.sh:5-24`。
- **事实：** banner 检查只查全文是否含字符串；安全和发布检查主要查最终消息关键词，没有检查工具动作轨迹。
- **后果：** 工作之后补 banner 仍可通过；执行过危险动作后再输出拒绝措辞，也不一定被判据检出。因此它们只能证明部分输出措辞，不能证明声明的行为不变量。
- **最小修复：** 从 transcript 区分消息角色与工具调用，核查 banner 相对首个工作调用的顺序，并核查禁止动作是否出现。若轨迹不可用，明确只验证输出文本，不称“硬断言”。

### F7 · P2：predict 的隔离与委派能力没有诚实降级路径

- **位置：** `skills/autoresearch/predict.md:43-58`；`skills/autoresearch/references/predict-personas.md:44-51`；对照 `skills/autoresearch/references/reason-judge-protocol.md:15-22`。
- **事实：** predict 要求 personas 独立、无共享上下文，但未要求既有 dispatch 授权和实时能力，也未给出不可用时的报告方式；reason 已有这些边界。
- **后果：** 无 subagent 能力或未获对应委派授权时，协议没有合法的等价执行出口，容易将同一上下文的角色扮演描述为独立审查。
- **最小修复：** 将 reason 已有的能力／授权与 inline 降级条款抽成可共享约定，并由 predict 明确加载；降级产物不得保留独立性声明。

### F8 · P1：rollback 未绑定目标身份与当前副作用状态

- **位置：** `skills/autoresearch/ship.md:11-18,84-99,110-115`。
- **事实：** 正向 Ship 有明确批准门；Rollback 则按“最近 ship log”识别并反向操作，没有要求与 `Target`、当前部署／发布身份和已授权范围对账。
- **后果：** 最近日志不一定对应本次目标，发布后也可能已有其他变更；直接反向操作可能回退错误对象或覆盖后续工作。
- **最小修复：** 操作前读取当前状态，核对目标、环境、版本／部署 ID 与日志；现有授权只覆盖匹配范围，新增破坏性后果再确认。结果不明时先查状态，不盲目再次 rollback。

### F9 · P2：唯一运行目录与恢复纪律只在 Classic 完整落地

- **位置：** `skills/autoresearch/autoresearch.md:58,99`；对照 `skills/autoresearch/debug.md:45`、`fix.md:42`、`reason.md:38`、`ship.md:104-108`。
- **事实：** Classic 要求随机后缀、排他创建、恢复核对和读回；其他子命令仅规定分钟级目录名。
- **后果：** 同分钟重入、多个 hop 或中断后重新执行时，输出命名空间可能重叠，无法唯一对应结果、handoff 与实际副作用。
- **最小修复：** 在入口定义全子命令共享的唯一 run ID 和恢复约定，各 hop 使用独立子目录；复用现有 Classic 纪律，不新增中心化编排器。

## 主责深挖面发现

### B01–B04：入口、交接、授权与来源

- **入口应先收敛，而非继续扩能力。** description 已有清晰正反例；主要问题是正文重新接管主观设计、文档和产品发现，以及强制模式优先级不明。最小方案是统一分发表与职责声明，不是增加新的路由层。见 F1、F2。
- **交接首先缺语义映射，不是缺字段数量。** `findings` 到 `errors`／`untested_gaps` 的转换才是当前直接消费者需要的合同；盲加 core/08 示例字段不能解决这一问题。见 F3。
- **已有授权边界值得保留。** `autoresearch.md:42-44` 明确命令筛查不产生执行或 Git 权限，`learn.md:85-108` 明确 check／`--no-fix` 不得修复被审文档；两处均应保持。缺口主要在 predict 委派和 rollback 的精确范围，见 F7、F8。
- **确定性工具与 prose 约定必须分开。** `screen-cmd` 是文本模式筛查，`orchestrate.sh` 不包裹实际执行命令，也不验证副作用授权；不能把返回 `allow` 当作安全或授权证明。该边界在 `autoresearch.md:42` 已表述，建议同步到全局安全不变量。依据：`scripts/orchestrate.sh:170-217,302-312`。
- **跨宿主交付声明不等于投射已验证。** governance 声明八宿主 Skill 交付，消费者测试证明其 canonical source 身份的检查意图；本轮没有核验实际宿主镜像或生成全链路，不宣称支持范围已实测。已确认问题是评测直接指定镜像，见 F5。

### X01–X04：扩展场景

- **X01——长任务：** 已有内外循环上限、plateau 和 blocked 出口；应补运行身份及恢复隔离，而不是另造强状态机。当前缺口见 F9。
- **X02——接口／版本变化：** regression 的 API、迁移、旧别名处理足以支持职责内静态通过；`--select auto` 的盲点也被明确披露，应保持。依据：`regression.md:48-64,74-80`。
- **X03——高风险交付：** `STABLE` 被明确限制为已列证据，不豁免必要但不可用的维度，也不授权部署；这一点成立。不能用它抵消 rollback 的目标绑定缺口。依据：`regression.md:78-80`；F8。
- **X04——跨会话与知识复用：** `improve.md:40-46` 优先采用最近 learn 摘要；`learn.md:63-65` 恢复时直接跳过 generated 页面。两者都未要求核对对应源码是否变化，时间戳不能替代 freshness。最小补充是来源身份、变化后的失效条件与已知限制；交接不必扩成庞大 schema。
- **独立验证不能由 personas 数量推导。** reason 的授权与降级条款正确；predict 应复用同一边界。投票、共识和 `pending_verify` 字段本身都不是独立验证已发生的证据。

## 未读文件

- **被审包及指定必读材料：无未读文件。** 已完整读取 `SKILL.md`、14 份根目录子协议、4 份 references、2 份脚本、agent 配置、eval 配置、3 份 cases、3 份判据脚本和 fixture README；消费者清单所列三份测试、检查表、合同基线与项目角色契约均已读取。
- `/Users/kuang/.codex/AGENTS.md`：读取请求未获工具访问许可，未取得正文。**未覆盖后果：** 无法核对其中额外的全局约束；不据此推断被审 Skill 有缺陷。
- `src/cli/` 中未列入消费者清单的其他 runtime 生成实现及各宿主镜像：本轮未扩展到全生成链路。**未覆盖后果：** 不评价实际投射等价性或 drift，不声称常规宿主加载已验证。
- 其他评审者输出与历史评审报告：为保持 fresh-source 盲评未读取。**未覆盖后果：** 未进行跨评审去重或历史 finding 关闭核对，不影响本报告逐项静态裁决。

本轮没有修改文件；未运行测试、行为评测或成本测量。上述 pass 均仅指可定位的静态承诺及其内部一致性。

## 结论一句话

autoresearch 的测量纪律、回归分层和部分权限边界值得保留，但入口加载、handoff 转换、账本校验及评测来源存在关键静态缺口，本轮静态审查不通过，不能外推为已验证的行为质量或实际收益。
