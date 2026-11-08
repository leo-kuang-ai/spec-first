---
artifact_kind: prd-requirements
spec_id: 2026-10-15-001-loyalty-ledger
title: 忠诚度积分账本（Loyalty Ledger）需求
status: draft
write_mode: checkpoint-prd
can_enter_spec_plan: no
next_owner_question: 积分过期策略按自然月月底清零，还是按获取日后 12 个月滚动过期？
readiness_outcome: ask-owner
primary_topology: extend
---

<!-- prd:section=summary -->
## Summary

（checkpoint 恢复形态，非 final PRD。）
为 loyalty-ledger 增加积分账本：积分获取、消费、过期与对账。
已确认范围见 Requirements；未决 owner 问题见 Outstanding Questions。

<!-- prd:section=requirements -->
## Requirements

| R-ID | 需求 | Source / 决定 | Acceptance Examples |
| --- | --- | --- | --- |
| R1 | 每笔已完成订单按订单金额 1% 发放积分，向下取整 | owner-answered（2026-10-15） | 订单 ¥58 → 0 分；订单 ¥199 → 1 分 |
| R2 | 积分消费按先过期先消费 | source-candidate | TODO：补 AE |
| R3 | 过期积分在账本标记 expired，不再可用于消费 | owner-answered（2026-10-15） | 过期后的消费请求返回积分不足 |

<!-- prd:section=outstanding-questions -->
## Outstanding Questions

| OQ | 问题 | Disposition |
| --- | --- | --- |
| OQ1 | 过期策略：自然月月底清零，还是获取日后 12 个月滚动过期？ | owner-authority-needed |
| OQ2 | 积分是否可部分抵扣运费？ | owner-authority-needed |

## Owner Decision Trace

| 决定 | 选项 | Owner 答复 | 日期 |
| --- | --- | --- | --- |
| 发放比例 | 1% / 2% / 阶梯 | 1%，向下取整 | 2026-10-15 |

## Readiness Self-Check

- write_mode: checkpoint-prd
- can_enter_spec_plan: no
- readiness_outcome: ask-owner
- 下一步：等待 owner 回答 OQ1，再继续 grill OQ2；两项关闭前不进入 planning。
