宿主工具检索确认：当前会话无阻塞式提问工具（无 AskUserQuestion 类），工具发现原语已查过 —— 按技能规定降级为 `question_delivery=chat-fallback`，在聊天中一次一问并等待答复。

---

## 运行广播（Phase 0）

- **运行目标**：把三份会议纪要合并的需求池整理为 PRD 级需求 artifact（去重、冲突裁决、缺口闭环），并给出规划就绪度结论。
- **输入姿态**：`reference-claims` —— 纪要是未定稿参考材料，冲突处不静默取一方，标 contradiction 交裁决。
- **产物姿态**：`docs/brainstorms/*-requirements.md`（`artifact_kind: prd-requirements`，`status: draft` 起步；`status: ready-for-planning` 与 `readiness_*` 只由 finalize 脚本写入）。
- **硬边界**：不做实现、不写实现计划、不做 HOW 设计；不改 `.claude/` 等生成镜像；owner 问题一次一问。

**路由结论**：不 route-out —— 存量系统锚点充分（邮箱登录、订单域、App、后台均 user-stated 存在），属 brownfield 增量（积分域 `add` + 认证 `extend`），非 0-1 探索。`intent=create`，`analysis_profile=default`。

## 任务清单

1. ✅ Phase 0 路由 + 输入消毒（纪要=reference-claims，未发现嵌入式 agent 指令/命令）
2. ✅ 存量证据勘察：工作目录无 source/docs/glossary → `evidence_depth=user-stated`
3. ✅ 冲突/去重分析 + Requirement Analysis Gate + 风险排序（本回合产出，见下）
4. 🔄 Requirements Grill：**OQ-1 积分比例/封顶**（本回合发出，待答复）
5. ⬜ Grill 后续：OQ-2 退款拆分 → OQ-3 B8 语义 → OQ-4 签到周期 → OQ-5 注销×负余额 → OQ-6 邀请回收 → OQ-7 拆分确认 → OQ-8 频控初始值 → OQ-9 对账格式 → OQ-10 审批角色 → OQ-11 假设批次
6. ⬜ 起草 PRD（模板组合：`00-generic` + `30-backend` 主 + `60-mixed`；无证券/交易信号，不加载 securities overlay）
7. ⬜ Phase 4：readiness lens + `finalize-prd-artifact.js` / `check-prd-artifact.js`，报告 findings、blocking reason_codes、receipt、readiness_outcome

## 存量快照（全部 `user-stated`，无 source 可证）

已有：邮箱密码登录（A2 保留）、订单域及"已完成"状态（B1 依赖）、App 与 App 内推送通道（E1/E3）、短信通道（本期不启用）、管理后台（F 挂载点）。没有：积分体系（本期新增）、微信扫码（A5 二期）、商城兑换（C3 三期）。

## 冲突 / 去重结论

**直接冲突（contradiction，需裁决）**

| ID | 冲突 | 条目 | 处置路径 |
|---|---|---|---|
| CF-1 | 订单积分比例：会议一 1% 不封顶 vs 会议三 2% 每单封顶 50 分；B1 已声明权威=商务组，结论未收录 | B1/B2/B3 | OQ-1（本次提问） |
| CF-2 | "每笔已完成订单发放" vs "同一用户同一商品每日最多发放一次"——同日同商品多单行为未定 | B1 vs B8 | OQ-3 |
| CF-3 | 对账单导出 Excel（报告组）vs CSV（数据组）；D6 自注"两口径并存" | D4/D6 | 输入自带并存声明，OQ-9 低风险确认 |

**权威外置（纪要声明等外部结论，未收录）**：CF-1 的商务组；A4+X4 的登录频控阈值（安全组）。A3（设备维度 5 错锁 15 分钟）与 A7（账号维度 1 分钟 3 次验证码）是互补并存，非重复，为已知初始值。

**去重合并**：C1+C2 → 100 分=1 元，单笔抵扣 ≤ 订单应付 50%；E2+E3 → 过期提醒仅 App push、短信不启用，E4"可关闭"仅指过期提醒；A4+X4 → 同一事项；B1/B2/B3 → 一条发放规则+待定参数；X1+C3 → 兑换为非目标、仅预留接口。

**范围外（不进入追问）**：微信扫码登录（A5，二期）、商城兑换详细设计（C3/X1，三期）。

## 风险排序 → 待决清单（Push-Right Brief，逐个闭环）

| ID | 决策 | 推荐答案 | PRD 写入位置 | 不答则规划会发明什么 |
|---|---|---|---|---|
| OQ-1 | 比例/封顶（CF-1） | 参数化，默认取会议三 | Requirements(B)+Outstanding Questions | 全部发放数量验收数字 |
| OQ-2 | **积分+现金混合支付订单退款**：积分抵扣部分退积分还是退现金？退回积分有效期怎么算？（B9 只写了正向回冲） | 原路退积分，有效期按新批次重计 12 个月 | Requirements(B9/C)+Acceptance | 退款拆分规则、资金口径 |
| OQ-3 | B8 语义（CF-2） | B8 仅作防刷护栏：同用户同商品每日发放封顶 1 次，正常复购多单是否牺牲需 owner 明确 | Requirements(B8) | 同日多单发放行为 |
| OQ-4 | 签到周期：第 7 天加发 30 分后周期是否重置？断签是否清零？ | 第 7 天当日加发并重起周期；断签清零重计 | Requirements(B7) | 每日奖励验收 |
| OQ-5 | 注销×积分：恢复期内积分收支是否冻结？负余额能否注销清户？ | 申请即冻结收支；恢复期内负余额继续抵扣；7 天后清户核销余额与负余额 | Requirements(A8/B9) | 注销清算规则 |
| OQ-6 | 邀请奖励回收与防刷（B8 只覆盖商品维度） | 被邀请人在其恢复期内注销清户则回冲双方 100 分 | Requirements(B6) | 奖励回收行为 |
| OQ-7 | 拆分：模块 A（认证）vs B–F（积分域）是否拆两份 PRD | 拆两份：认证增强 + 积分体系；X2/X3 各自收录 | artifact 拓扑 | 规划包边界 |
| OQ-8 | 频控初始值 | A3/A7 先行，其余参数化，安全组结论为 reopen 条件 | Requirements(A)+Blocker | 频控阈值 |
| OQ-9 | 对账格式 | 双格式并存：运营报告 Excel / 数据组 CSV | Requirements(D) | 导出验收 |
| OQ-10 | 审批流角色与级差（F1/F3） | 复用现有后台审批体系，至少一级授权角色审批 | Requirements(F) | 权限边界 |
| OQ-11 | 假设批次：D3 对账范围/异常定义、D7 告警阈值与接收人、F5 日报口径、E2 提醒频率、C4 同日过期批次 FIFO 细则、X2 幂等键粒度、A6 免登续期策略 | 各带推荐假设，可整体接受或逐条改 | Assumptions+Planning Recheck | 运营行为细节 |

## Decision Card（run-local）

```text
intent: create | input_posture: reference-claims | output_shape: normal-prd
primary_topology: add(积分域)+extend(认证) | surface_lens: Mixed
clarification_view: Mixed(Backend 主导) | clarification_profile: backend-contract-heavy
intake_mode: requirements-first | clarification_budget: standard
clarification_risk_tier: medium | review_gate_mode: self-check
evidence_depth: user-stated | quality_diagnosis: blockers(CF-1/CF-2 行为冲突+2 处权威外置)
pre_prd_clarification_status: asked-owner | owner_question_progress: outstanding-question
write_mode: ask-owner-first
highest_risk_gap: CF-1 积分发放比例/封顶冲突（商务组结论未收录）
next_owner_question: OQ-1
question_delivery: chat-fallback | clarification_evidence: pending（OQ-1 已发出，收到答复后记 asked-owner）
readiness_outcome: not-run
```

本回合**未写任何 PRD 文件**（`write_mode=ask-owner-first`，预写门之前）。

---

## 问题 1 / OQ-1：订单积分发放比例与封顶如何处置？

**背景**：会议一纪要=订单金额 1%、向下取整、不封顶（B2）；会议三纪要=2%、每单封顶 50 分（B3）；B1 又声明"以商务组最终结论为准"，而该结论未收录。两份纪要直接冲突，且全部 B 模块验收数字依赖此值。

**推荐答案（A）**：机制按 F3 做成可配置参数（比例 + 每单封顶值）；**上线默认值取会议三口径（2%、每单封顶 50 分，向下取整）**——这是唯一有时间序依据的最新纪要；商务组最终结论出来后走 F3 配置变更流程（审批+留痕+实时生效）调整，不阻塞本期开发与验收。

- **选 A 的后果**：PRD 验收示例按 2%/封顶 50 编写；商务组改口径只动配置。
- **不选（等待商务组书面结论）的后果**：OQ-1 转 blocker，发放验收数字留空，PRD 只能停在 checkpoint，不能 ready-for-planning。

选项：
- **A. 按推荐：参数化 + 默认 2%、每单封顶 50 分**（推荐）
- **B. 参数化 + 默认取会议一：1%、不封顶**
- **C. 参数化但默认值留空，等商务组结论（OQ-1 转 blocker，readiness 受限）**
- **D. 其他**（例如商务组结论其实已有，请直接给出数值）

请答复 A/B/C/D 或自由补充。答复后我按风险顺序继续下一问（OQ-2 积分抵扣订单的退款拆分）；若想减少往返，可对 OQ-11 说"假设批次整体按推荐处理"；若想提前结束追问，请明确说"到此为止"（owner-capped，剩余项会记入 checkpoint 而非 ready）。
