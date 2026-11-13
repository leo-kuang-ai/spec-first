grill 集成规则已加载。现在给出本次 resume run 的执行框架，然后立即进入第一个 owner 问题。

---

## Resume Run 广播

- **目标**：原地恢复 `docs/brainstorms/2026-10-15-001-loyalty-ledger-prd.md`（保留 `spec_id: 2026-10-15-001-loyalty-ledger` 与 R1–R3 编号），继续 Requirements Grill 直到所有负载分支到达合法停止点，然后完成 PRD 写入与 finalize。
- **input_posture**: `resume-prd`；**intent**: create（延续）；**profile**: default / compact-brownfield-increment；**risk tier**: medium（积分属类资金权益，含过期与对账）。
- **产物形态**：更新同一份 PRD（checker 已确认接受 `docs/brainstorms/` 下现有文件名）。
- **硬边界**：不做实现、不写实现计划、source-first 编辑、不动 `.claude/` 生成镜像；`status: ready-for-planning` 及 ready receipt 只由 finalize 脚本写入。

## 任务列表

1. [进行中] Grill OQ1：积分过期策略（`next_owner_question`，最高风险）
2. [待办] Grill OQ2：积分能否抵扣运费
3. [待办] 修复 R2 证据缺口：`source-candidate` 标注但仓库无 source 支撑（已核实全仓库仅 README + PRD），且缺 Acceptance Examples → 需 owner 确认
4. [待办] 场景压力测试暴露的新分支：退款是否回收积分、发放基数是否含运费、"已完成订单"状态定义
5. [待办] 更新 PRD：Requirements / Owner Decision Trace / Outstanding Questions / Readiness Self-Check
6. [待办] Phase 4：readiness lens + finalize/checker，报告 receipt

**Decision Card（当前）**：`write_mode: ask-owner-first`；`highest_risk_gap`: OQ1 过期策略（决定 R3 验收时点与"先过期"消费语义）；`next_owner_question`: OQ1；`question_delivery: chat-fallback`（已用 ToolSearch 确认本环境无阻塞式提问工具）。

---

## 问题 1 / OQ1（等待你的回复，一次只问这一个）

**积分过期策略：按自然月月底清零，还是按获取日后 12 个月滚动过期？**

- **命名的 gap**：OQ1（PRD `Outstanding Questions` 已记录，`owner-authority-needed`）
- **已做的 source 尝试**：全仓库检索（README、prepare-eval.cjs、PRD 自身）——无任何 source 定义过期口径；仓库无产品代码，source 无法关闭此 gap。
- **影响的 write target**：R3 的验收时点、R2"先过期先消费"的排序依据，以及新增一条过期规则需求行。
- **推荐答案**：**获取日后 12 个月滚动过期**。理由：月底清零会使月末完成的订单（R1 按完成发放）积分几乎立即失效，用户感知差且对账口径复杂；滚动过期按批次独立结算，账本语义更干净。
- **后果**：若选月底清零，R3 验收需改为"跨月后全部余额标记 expired"，且 R2 的排序退化为单一批次内消费，`先过期先消费` 需求行要重写。
- 两个选项之外的口径（如按固定财年、按账户级最早获取日）也欢迎直接说。
