# F-S04-04 盲评归因裁决（2026-11-02 resume 会话）

方法：按 B-05 先例（同厂商新上下文、只读、不交给复核者原结论）由宿主 subagent 盲评。盲评者只获得：两假设标签（(a) Skill 文本强制 / (b) 合理业务澄清 / (c) 不足）、transcript 目录（`/tmp/batch1/s04-glm`、`/tmp/batch2/repro`）、被审 Skill 源码路径；未获得任何既有结论及其归属，且被禁止读取 docs 报告与 CHANGELOG。未调用外部模型 API、未消耗第五批额度。owner 事后补充 gpt 侧只读核查（下节）。

## 裁决结果

**(a) Skill 确认门强制为主**：10 次停顿中 4 次纯 (a)（p2×2、p4×2），6 次 (a) 主导、(b) 内容层有贡献（p1×4、p3×2）；整体 (a) 置信约 90%，拆分比例置信约 70%。

### 新事实一：停顿次数是 10，不是 6

可核验 with_skill 停顿 trace 共 10 个（batch1 两轮 ×4 case = 8，batch2/repro 两轮 p1 = 2），机制一致：读 references → 读 fixture → 停在 Phase 0.7 发确认请求，0 次 Write。历史记录的"六次"为口径不全；本文件以此修正主报告相关行。

### 新事实二：天然反事实（决定性证据）

同模型、同 fixture、同单轮 harness 的 without_skill 组 **8/8 直接产出计划文件**（含 p3 依赖 404、p4 模糊需求同样以假设/前置阻塞项交付）。停顿的必要条件是 Skill，不是缺口真实性，也不是模型能力或意愿。"(b) 强形式（称职规划者本应停下澄清）"被该对照否定：任务 prompt 明确要求"先写一份实施计划保存到仓库"。

### 新事实三：机制是分层确认门 + skip 信号全部缺失

- intake.md L175"wait for user confirmation…silent proceeding is not allowed"、L177"auto-proceed 仅当 Lightweight 且零存活 call-out；Standard/Deep 无条件等待"——10/10 trace 的 tool_result 含此原文，末条消息措辞直接执行该 gate。
- 三条 skip 路径（headless、prompt `confirm:auto`、`.spec-first/config.local.yaml` 的 `plan_skip_scoping_confirm`）的触发信号在模型实际输入中**一个都不存在**（fixture 无 `.spec-first/`，GLM 显式检查并报告过；prompt 无 token；`promptSource:"sdk"` 是 harness 元数据不在消息内）。模型无从绕行，未错过任何可走路径。
- 一句话归因：**Skill 契约与单轮评测 harness 的交互缺陷——确认门把交互式等待设为默认，而单轮自动化调用方不含任何 skill 自定义的 skip 信号；GLM 忠实执行了 gate。**

### WHAT 闭合性（(b) 的真实残余）

金额格式（有强 advisory 但仅针对订单导出）、导出列集合（无定义）、日报语义冲突（半闭合）、p3 依赖 404（硬冲突）、p4（完全未闭合）——缺口多数真实，(b) 在"问了什么"层面有贡献；但"缺口真实"不构成"必须停"（见反事实）。

## Owner 补充：gpt 侧走的是哪条路（盲评建议 #4）

batch1 s04-gpt with_skill 8/8 均读到了 gate 原文、均提及 call-out、均产出计划。抽样细读 2 例（p1、p2）中间消息显示：gpt 把同样的分歧（日报语义、金额格式）**自行裁断为计划内决策**（"保留日报原有的时间含义""金额格式、字段顺序…写入验证要求"）并公告后直行——即走 auto-proceed 分支（Lightweight + 零存活 call-out），而非无视 gate。两模型差异在 "Real fork"（synthesis-summary.md L74-87）的裁量阈值：GLM 保守保留为存活 call-out → 等待；gpt 内联消解 → 直行。抽样为 2 例细读 + 8 例计划产出确认，未逐例核对全部 call-out 裁断。

## 三方收敛与状态

| 方 | 结论 | 现状 |
|---|---|---|
| 原独立复核（B-05） | Skill 指令所致 | 方向与盲评一致；其"只要有 call-out 即强制等待"的字面机制被修正为分层确认门 |
| 续审 | 未排除合理业务澄清 | 在"为何停"层面被反事实回答；(b) 作为 6/10 的内容层贡献保留 |
| 本盲评 | (a) 为主（~90%），机制修正 + 三条新事实 | 已归档 |

**状态：归因收敛，F-S04-04 的"待裁决"解除**；单轮文件产出受损的观察不变。修复方向（另行承接，不由本审查自动授权）：让 skill 识别单轮自动化调用方（headless 判定或显式 confirm 信号），判别实验用 `confirm:auto` 同设置复跑（盲评建议 #1，最干净）。修复落地后的验证仍按需求 6.1 原方案（WHAT 已闭合输入对照）。

## 盲评者原文

盲评报告全文由 owner 原样保存于会话产物并已在本文件归纳；逐次停顿明细（10 例 trace 文件名、末条消息、缺口判定）、Phase 0.7/skip 路径行号引用（intake.md L165-179、synthesis-summary.md L74-87/L125-149/L350-371、output-mode.md L30-37）以盲评者引用为准，均可由 `/tmp` 现存 trace 与仓库 source 复核。`/tmp` 可被清理：trace hash 已含于既有 SHA 清单口径的 r 系列观察与 tally；本文件转述的关键行号绑定 source 版本 `049e52744`（skills/ 相对 HEAD 无 diff，已核）。
