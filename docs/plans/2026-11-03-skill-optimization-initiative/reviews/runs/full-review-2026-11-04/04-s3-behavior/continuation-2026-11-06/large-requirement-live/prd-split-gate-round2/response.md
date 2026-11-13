工作区核查完成：目录下只有 `.claude/`（技能本体），**无产品源码、无既有 docs/、无领域词表**。以下按 spec-prd 工作流开始处理。

---

## 运行广播

- **运行目标**：把三份会议纪要合并的需求池（40 条）消解为 PRD 级需求：冲突消解 → 去重 → 补齐开放问题 → 成稿 → 就绪度评估。
- **输入姿态**：`reference-claims`（会议纪要按未确权文档处理，先消毒再采信；多数条目可视为已批准决定 = `user-stated`，B2/B3 属两条已批准记录互相冲突 = `contradiction`，需 owner 裁决）。
- **产物姿态**：`docs/brainstorms/*-requirements.md`（PRD 契合 brownfield 增量：现有系统 = 邮箱密码登录 + 已有订单体系，均 `user-stated`，工作区无源码可升级为 `confirmed-source`）。
- **硬边界**：不写实现代码、不做实现计划、不编辑 `.claude/` 等生成镜像；HOW 一律下推给 spec-plan。
- **PRD 价值判断**：池内存在 1 条核心业务规则冲突 + 2 组外部权威留白（商务组/安全组），直接进规划会让规划自己发明业务规则——PRD 有持久 WHAT 价值，不走 bypass。
- **交互降级声明**：本宿主工具列表无阻塞问答工具，按技能规则降级为 `question_delivery=chat-fallback`——我在对话中每次只问**一个**问题、给出推荐项，然后停下等您答复。

## 任务清单

1. ✅ 工作区现状核查（无源码 → current-state 维持 `user-stated`）
2. ✅ 需求池消毒 + 去重/冲突/外部依赖地图（下文）
3. ✅ Requirement Analysis Gate + 风险排序（下文）
4. ⏳ 逐项 grill：Q1 比例冲突 → Q2 拆分边界 → Q3 退款×过期 → Q4 注销×邀请 → Q5 签到口径 → …（每轮一问）
5. ⬜ Pre-Write Closure Gate + Decision Card → 首次持久化写入 `docs/brainstorms/`
6. ⬜ 读取输出模板（00-generic + backend/app/admin）并成稿
7. ⬜ Phase 4：readiness lens + finalize/checker 脚本 + 就绪度结论

## 消毒结果：去重 / 冲突 / 外部依赖 / 范围外

**① 池内自证可合并（不需要您裁决，成稿时直接合并并注明来源）**

| 合并 | 结果 |
| --- | --- |
| C1 ⊂ C2 | 抵扣比例 100 分 = 1 元，单笔订单最多抵扣 50% |
| D4 + D6 | D6 自述"两口径并存"→ 导出支持 Excel 与 CSV 双格式，按使用方（报告组/数据组）选择 |
| E2 + E3 | 过期提醒走 App push，短信通道不启用 |
| X1 + C3 | 商城兑换 = 三期非目标，本期仅预留扩展接口 |

**② 真冲突（contradiction，需 owner 裁决）**

| 冲突 | 双方 | 状态 |
| --- | --- | --- |
| 积分发放比例 | 会议一 B2：金额 1% 向下取整 vs 会议三 B3：金额 2% 每单封顶 50 分；B1 声明"按商务组最终结论"，但该结论未收录 | → Q1 |

**③ 外部权威留白（纪要显式声明"另定"，机制本期做、数值参数化）**：B1 比例（商务组）、A4/X4 频控与防刷阈值（安全组）。建议 PRD 内写成可配置参数 + 纪要默认值 + 待外部结论更新，形成带处分的 OQ。

**④ 范围外/分期**：A5 微信扫码（二期）、C3 商城兑换（三期）→ 写入 Non-goals。

## 风险排序（Product Expert Lens → 追问顺序）

| # | 开放问题 | 为什么规划会替您发明 WHAT | 写入目标 |
| --- | --- | --- | --- |
| OQ-1 | 积分比例初始口径（B2/B3 冲突） | 核心发放规则无值可用 | Requirements B + Decision Notes |
| OQ-2 | PRD 拆分边界与发布顺序（模块 A vs B–F+X） | 两个可独立发布的增量混在一篇会漂移 | 拆分摘要 + 两份子 PRD |
| OQ-3 | 退款回冲 × 有效期/负余额（B9×B4/B5） | "已过期后退款怎么冲"未裁决，直接影响账务正确性 | Requirements B9 + 异常验收 |
| OQ-4 | 注销账户积分处置 + 邀请奖励防刷（A8×B6） | "注销后余额归谁"未定，且是邀请刷分通道 | Requirements A8/B6 + 异常验收 |
| OQ-5 | 连续签到口径（B7"连续"定义/断签/时区） | 验收无法写断言 | Acceptance Examples |
| OQ-6 | 抵扣 50% 上限的基数与叠加规则（C2） | 基数不同结果不同 | Requirements C2 |
| OQ-7 | 频控/防刷默认阈值确认（A3/A7/X4） | 默认值需您确认后才可作验收值 | Requirements A + OQ 处分 |
| OQ-8 | 到账通知是否可关闭（E1×E4 只提过期提醒可关） | 通知开关范围未定 | Requirements E |
| OQ-9 | 手工调整审批层级（F1） | 审批流无角色/层级 | Requirements F1 |
| OQ-10 | 对账单生成口径（D3：自然月？何时生成？） | 调度口径未定 | Requirements D3 |

## Decision Card（当前）

```text
intent: create | input_posture: reference-claims | analysis_profile: default
output_shape: normal-prd（建议拆 2 份子 PRD，待 Q2 确认）
primary_topology: 积分域 add + 认证域 extend（split 待确认）| surface_lens: Mixed
evidence_depth: user-stated | write_mode: ask-owner-first
highest_risk_gap: OQ-1 积分比例冲突
next_owner_question: Q1 | question_delivery: chat-fallback
clarification_evidence: 待您首次答复后记 asked-owner | readiness_outcome: not-run
```

---

## Q1（最高风险，一次只问这一个）：积分发放比例采用哪个口径？

B1 说"按商务组最终结论执行"，但纪要里只有两条互相冲突的记录，PRD 需要一个**初始口径**才能成稿：

- **A.（推荐）采信会议三为最新结论**：订单金额 2%、每单封顶 50 分、向下取整。同时把比例与封顶值做成 F3 可配置参数（初始 2% / 50），商务组书面结论出来后改配置即可，不动需求。
- **B. 采信会议一**：订单金额 1%、向下取整、不封顶。
- **C. 悬置为阻塞项**：PRD 保持 not-ready，等商务组结论文件到位再定稿。
- **D. 其他口径**（请直接给出数值）。

**推荐理由**：会议三记录更晚且含封顶细则，更像收敛后的结论；配合 F3 参数化后该决定的不可逆成本最低。若选 A，"商务组书面结论"会作为带处分的 OQ 留痕（owner-accepted-assumption），不阻塞规划。
