宿主工具检索确认：本会话没有阻塞式提问工具（AskUserQuestion 类）——按 skill 的 Interaction Method，降级为 `question_delivery=chat-fallback`，在对话中一次问一个带编号选项的问题并等待回复。

---

## Phase 0 分类（resume 广播）

- **运行目标**：原位恢复 `2026-10-15-001-loyalty-ledger` 的 checkpoint PRD，继续 grill 已记录的 OQ，直至可判定 readiness（ready / revise / ask-owner）。
- **输入姿态**：`resume-prd` —— 保留 `spec_id`、既有 R/OQ 编号与已关闭决定（README session note 与 checkpoint 一致要求这么做）；不新开 PRD 文件。
- **意图**：`create`（续作中断的作者化 run）；`analysis_profile=default`。
- **硬边界**：不写实现、不写实现计划、不做源代码改动；本 fixture 无产品源码，证据仅限 README + 既有 PRD（当前用户为唯一产品确认人）；不手改 `.claude/` 等生成镜像；不自行 git commit（baseline 由 prepare 脚本创建，任务无 commit 权限）。

## 任务清单

1. [in_progress] 恢复分析：Requirement Analysis Gate 图 + Product Expert Lens 风险排序（run-local）
2. [ ] Grill OQ1：过期策略（checkpoint 记录的下一个问题）
3. [ ] Grill 新识别缺口：Summary 写了“对账”但 Requirements 无对应 R 行
4. [ ] Grill OQ2：积分能否抵扣运费
5. [ ] Grill R2 口径：“先过期先消费”目前是 source-candidate（仓库无源码可证），需确认并补 AE
6. [ ] Grill 退款/重复发放边界（R1 验收边缘）
7. [ ] PRD 写入：绑定 owner 答复至 Owner Decision Trace，关闭 OQ，补 R2 AE，更新 Readiness Self-Check
8. [ ] Phase 4：readiness lens + producer-local finalize/checker，报告 finding 数、blocking reason_codes、receipt 状态、readiness_outcome

## 恢复分析（run-local）

**净化与证据**：R1（1% 向下取整）、R3（过期不可消费）为上一会话 owner-answered 决定，README 明确沿用，作为既有决定承载；R2 的“先过期先消费”标记为 source-candidate，但**本仓库无 loyalty-ledger 源码**，无法 source-resolve，属待确认口径；Summary 声称范围含“对账”，Requirements 却无对账行——这是**自相矛盾**，不关闭则 planning 必须发明 WHAT。

**风险 → PRD 写入目标排序**（Product Expert Lens，按 downstream_confirmation_risk 降序）：

| # | gap | 证据姿态 | owner 问题/假设 | PRD 写入目标 |
| --- | --- | --- | --- | --- |
| 1 | OQ1 过期策略二选一 | owner-authority-needed（checkpoint 既录） | 问 owner | R3 语义 + AE + Decision Trace |
| 2 | “对账”无 R 行，Summary 与 Requirements 矛盾 | 矛盾（artifact 内部） | 问 owner：补最小对账 R 行，还是移出本切片 | Requirements 或 Summary/Non-goals |
| 3 | OQ2 运费抵扣 | owner-authority-needed | 问 owner（推荐：不可抵扣） | 消费范围 R 行或 Non-goals |
| 4 | R2 FIFO 无源可证且缺 AE | source-candidate | 问 owner 确认 + 补 AE | R2 Source 与 AE |
| 5 | 退款是否扣回积分 / 重复完成事件是否重复发放 | 未定义（验收边缘） | 问 owner（各带推荐） | R1/R 新行 AE |

Decision Card（当前，grill 进行中）：`write_mode: checkpoint-prd`（继承）→ 答复收集后按闭合情况升级；`highest_risk_gap: OQ1 过期策略`；`next_action: ask-owner-first`。

---

**问题 1／约 5（OQ1，`question_delivery=chat-fallback`）**

**过期积分按哪种策略失效？** 这决定 R3 的语义、过期时点、对账口径和全部过期相关 AE。

- **A. 获取日后 12 个月滚动过期**（推荐）——每批积分独立寿命，无月底集中清零悬崖；业界成熟积分体系常用；对账按批次流水自然核对。
- B. 自然月月底清零——实现和沟通简单，但月末余额悬崖会刺激集中消费，且“月底”需定义时区口径。
- C. 其他规则（请直接描述）。

选 A 还是 B（或给出你的规则）？
