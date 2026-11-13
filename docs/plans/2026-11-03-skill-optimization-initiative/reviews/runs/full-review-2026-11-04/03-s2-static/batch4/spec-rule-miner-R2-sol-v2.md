# spec-rule-miner 评审（R2）

## 逐项裁决表

本表仅裁决冻结版本 `5b59293b` 的静态合同，不外推实际行为、运行成本或现场收益。已读完整入口、两份 references、全部 eval 配置／用例／fixture，以及检查表、合同基线和消费者清单；消费者清单只有标题，未列出 tests/src 文件。以下验证要求属于 prose 约定或测试断言，不代表运行时硬强制。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-rule-miner/SKILL.md:44-47`；`skills/spec-rule-miner/references/pattern-categories.md:7-15` | 预览、局部替换、抽样及历史例外约束均对应明确风险，没有仅凭长度或模型能力推定应删除的步骤。 |
| D02 | pass | `skills/spec-rule-miner/SKILL.md:55-56`；`skills/spec-rule-miner/references/pattern-categories.md:27-71` | 提供具体模式类别、隐性耦合和反模式判断依据，将规则充分性留给语义判断，没有以脚本模拟架构判断。 |
| D03 | fail | `skills/spec-rule-miner/evals/cases/no-preview-no-write.yaml:19-25`；`skills/spec-rule-miner/evals/fixtures/scripts/check-preview-first.sh:4-12` | 名为“未经确认不得写规则文件”的验证只断言 `AGENTS.md` 不存在，脚本又只检查宽泛关键词，不能兑现其声明的禁止写入范围。 |
| D04 | pass | `skills/spec-rule-miner/SKILL.md:33-38,57-59`；`skills/spec-rule-miner/references/write-targets.md:7-18,50` | 完整规则、入口 pointer、证据摘要和限制具有明确去向；作为独立技能，不强套 PRD→Plan→Work 协议。 |
| D05 | pass | `skills/spec-rule-miner/SKILL.md:27-59`；`skills/spec-rule-miner/references/write-targets.md:39-56` | 入口保留核心边界，目标格式与迁移细节下沉 reference，关键条款可定位；评测与正文的不一致另计 B02。 |
| D06 | pass | `skills/spec-rule-miner/SKILL.md:10,44`；`skills/spec-rule-miner/references/pattern-categories.md:19-25`；`skills/spec-rule-miner/references/write-targets.md:18` | 不依赖特定模型或强制图工具，具备直接源码回退及 native import 不确定时的替代方式，未承诺跨模型效果一致。 |
| D07 | pass | `skills/spec-rule-miner/SKILL.md:46,67`；`skills/spec-rule-miner/evals/cases/r2-debug-request-routes-out.yaml:1-4`；`skills/spec-rule-miner/evals/trigger-cases.json:203-225` | 无经验自动优化职责；已有针对路由与重复执行的维护用例，并要求重新取证，不能因缺少运行收益数据判静态失败。 |
| D08 | pass | `skills/spec-rule-miner/SKILL.md:53-58`；`skills/spec-rule-miner/references/pattern-categories.md:8-11,19-25` | 明确过滤生成物、按包抽样和按需读取 references，图结果只缩小下一轮阅读范围且禁止加载完整 raw graph。 |
| B01 | pass | `skills/spec-rule-miner/SKILL.md:14-25,63-65`；`skills/spec-rule-miner/evals/trigger-cases.json:41-119` | standalone 身份、正向触发、评审／调试等近邻及不支持目标均明确，不把规则挖掘扩展为实际代码修复。 |
| B02 | fail | `skills/spec-rule-miner/SKILL.md:44`；`skills/spec-rule-miner/evals/trigger-cases.json:161-172` | 正文允许用户明确要求直接写入，但对应用例输入已经明确要求直接写，期望却仍是等待确认，形成相反 oracle。 |
| B03 | fail | `skills/spec-rule-miner/SKILL.md:44,59`；`docs/methodology/结构化项目角色契约.md:50-55` | 将宿主证明 headless/non-interactive 与用户明确直接写入并列为默认写入条件，未明确区分执行形态与目标文件的写授权。 |
| B04 | pass | `skills/spec-rule-miner/SKILL.md:42-43`；`skills/spec-rule-miner/references/write-targets.md:22-31,52-56` | canonical source、入口 pointer、可选 host-native 规则面和 runtime 禁区清晰，并拒绝不支持的宿主规则目标。 |
| B05 | pass | `skills/spec-rule-miner/SKILL.md:45-47,61-67`；`skills/spec-rule-miner/references/write-targets.md:41-49` | 对证据不足、旧块不明、重复执行及图不可用均有停止／降级／no-op 路径，已有内容按 marker 隔离修改。 |
| B06 | pass | `skills/spec-rule-miner/SKILL.md:57-59,69-77` | preview 和 closeout 要求披露目标、字数、样本、证据限制及未写入状态，没有把生成产物等同于真实效果通过。 |
| X01 | pass | `skills/spec-rule-miner/SKILL.md:52-57,75-76`；`skills/spec-rule-miner/references/pattern-categories.md:8-15` | 多仓先锁定单仓，多包区分共享与包级模式并披露未覆盖范围；该职责不需要另造实施任务编排系统。 |
| X02 | pass | `skills/spec-rule-miner/references/write-targets.md:29-31,42-49`；`skills/spec-rule-miner/evals/trigger-cases.json:175-200` | 明确 legacy marker 迁移、frontmatter 保留和未支持 surface 的兼容边界，不以版本变化为由覆盖用户原有内容。 |
| X03 | not-applicable | `skills/spec-rule-miner/SKILL.md:24,42,48` | 不承担高风险业务实现、部署或发布，业务源码明确只读；规则文件写授权和敏感信息处理仍分别纳入 B03 及安全边界审查。 |
| X04 | fail | `skills/spec-rule-miner/SKILL.md:35-38,46,77`；`skills/spec-rule-miner/references/write-targets.md:7-18`；`docs/methodology/结构化项目角色契约.md:86` | 产物用于未来会话的长期知识消费，但规则来源摘要默认不落盘，也没有要求保存挖掘新鲜度和失效条件。 |

## Findings

### F1 · P1：headless 被用作默认写入条件，授权与运行形态未分离

- **位置：** `skills/spec-rule-miner/SKILL.md:44`，`skills/spec-rule-miner/SKILL.md:59`。
- **事实：** “用户明确要求直接写入”与“宿主／调用参数证明 headless/non-interactive”被并列处理；后者满足后即可使用默认目标，收尾只要求记录证据来源和限制。
- **后果：** 在非交互调用中，即使当前任务仅授权分析或预览，也存在把“无法等待确认”当成写入默认三个文件的依据。`headless_default_write` 是事后记录，不能补足写授权；这与角色契约第 50–55 行不一致。
- **最小修复建议：** 明确“headless 只决定交互方式，不产生写授权”。先核对当前请求或 caller 已授权目标与写入范围；缺少授权时输出 preview-only，有授权且交互不可用时才执行并记录 `headless_default_write`。

### F2 · P2：直接写入场景的评测期望与正文相反

- **位置：** `skills/spec-rule-miner/evals/trigger-cases.json:161-172`；对应正文 `skills/spec-rule-miner/SKILL.md:44`。
- **事实：** 用例输入是“你直接写默认规则文件和 AGENTS.md / CLAUDE.md 引用”，已经包含正文允许的明确直接写入请求；期望模式却是 `preview-wait-for-confirmation`。
- **后果：** 遵守正文、先展示预览再按直接写入授权执行的行为，可能被 oracle 误判为失败，后续优化也可能被引向重复索取已有授权。
- **最小修复建议：** 若测试“未回复不能视为 headless”，删除输入中的“你直接写”；若保留该输入，则期望应允许在展示 preview 后按明确授权写入，同时禁止把“未回复”解释为 headless 证据。

### F3 · P2：禁止写入用例未覆盖主要规则目标，语义断言过宽

- **位置：** `skills/spec-rule-miner/evals/cases/no-preview-no-write.yaml:19-25`；`skills/spec-rule-miner/evals/fixtures/scripts/check-preview-first.sh:4-12`。
- **事实：** 文件断言仅检查 `AGENTS.md` 未创建，遗漏 canonical 文件 `docs/ai/project-rules.md` 与 `CLAUDE.md`。脚本只要最终输出包含“规则”“建议”“如下”等任一词就成功，不要求实际展示预览或等待确认。
- **后果：** “先写 canonical 规则文件、未创建 AGENTS.md，最后说已生成规则”的错误行为可以满足现有断言；用例标题承诺的写入安全性没有被完整检查。
- **最小修复建议：** 在该空白 fixture 中至少对三个默认目标全部加入不存在断言；把消息判据收窄为 preview 内容与等待确认的明确语义，避免用单个“规则”关键词替代。
- **证据边界：** 这是测试源码可直接确认的覆盖缺口；本轮未运行该用例，不声称已观察到实际误通过。

### F4 · P2：长期规则缺少可持续回源的新鲜度与失效信息

- **位置：** `skills/spec-rule-miner/SKILL.md:35-38,46`；`skills/spec-rule-miner/references/write-targets.md:7-18`。
- **事实：** `evidence_summary` 默认不写入规则文件；没有其他必需持久位置承接来源、新鲜度与失效条件。重新取证只在下一次主动执行 refresh 时发生。
- **后果：** 后续会话通过入口 pointer 消费规则时，可能只能看到结论，无法核对哪些源码曾支撑它、规则采自何时，以及包迁移或关键配置改变后是否已失效。
- **最小修复建议：** 不必引入新 schema；在 canonical 文件规则块之外保留简短维护说明，记录采样身份／时间、代表性 source refs、适用范围和失效触发条件。与规则正文分离，避免挤占正文预算。

## 主责深挖面发现

### B01–B04：职责边界清晰，主要缺口集中在授权条件与 oracle 一致性

- **B01 保持现状成立。** `SKILL.md:24-25` 明确拒绝把评审、调试和实现搬进规则挖掘；`write-targets.md:29-31` 对未支持工具不猜路径。这是有效的职责收口，不应因“功能不完整”而扩展。
- **B02 核心产物设计成立，但应修正 F2。** `SKILL.md:33-38` 与 `write-targets.md:7-18` 对完整规则、pointer 和摘要的定义一致；冲突在评测 oracle，不在 canonical／pointer 架构。
- **B03 应优先修正 F1。** 敏感信息排除已在 `SKILL.md:48` 明确；当前关键问题不是缺少更多确认步骤，而是未把已有授权、写入范围和非交互形态分开。
- **B04 保持现状成立。** `.cursor/rules/**`、`.qoder/rules/**` 被明确识别为可选 host-native 规则面，不与 skill runtime mirror 混同，见 `write-targets.md:52-56`；无需据此要求支持所有宿主的专属规则文件。

### X01–X04：复杂仓库与迁移已有约束，知识跨会话消费仍缺维护契约

- **X01：** `pattern-categories.md:8-15` 已处理大仓抽样、多包 scope 和历史例外；不能把“抽样”误认为全仓规则频率的证明，也不应要求本技能新增任务调度器。
- **X02：** `write-targets.md:46-49` 已定义旧 marker 迁移及 frontmatter 保留。当前没有证据要求再引入独立版本协议。
- **X03：** 高风险实现／部署不属于职责范围；不适用不意味着免除写入授权与泄密防护。
- **X04：** 当前源码要求“本次回源”，但未保证“未来可回源”；F4 应通过轻量持久维护说明解决，而非建立知识数据库或自动刷新系统。

合同基线 `core/08-skill-contract-protocol.md:27-289` 主要定义主链路技能，未定义 `spec-rule-miner` 专属 schema；依据检查表 `process/REVIEW-EXECUTION-WORKFLOW.md:45,62,156`，未将其中拟议 YAML、计数门槛或自动重试强加给本独立技能。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`
  - **理由：** 两次读取均返回尚未获得权限，未取得正文；未绕过权限限制。
  - **未覆盖后果：** 无法核对该全局文件是否包含额外个人执行约束。本次已遵守当前可见的只读、简体中文和冻结 source 边界；不把该读取限制算作被审技能的 `not-verified`。

**对象范围内无未读必读文件。** 消费者清单 `spec-rule-miner.consumers.txt:1-2` 没有列出具体消费者，因此没有以未读取的 tests/src 作为通过依据。未执行 eval、runtime 投射或收益测试；这些不属于本轮静态裁决范围。

## 结论一句话

静态审查覆盖完成：`spec-rule-miner` 的职责、抽样与 source/runtime 设计基本清晰，但 headless 写授权边界、两处评测合同缺口及长期规则的回源失效机制需要修正，本轮不判静态合同通过。
