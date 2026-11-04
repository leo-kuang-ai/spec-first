# 全量 Skill 审查 · Goal 提示词（自主推进契约）

**run**：full-review-2026-11-04　**冻结**：5b59293b（worktree `/tmp/spec-first-fr-wt`）
**方案**：`process/MULTI-AGENT-PARALLEL-REVIEW-PLAN.md` v1.5　**路径**：甲（owner 2026-11-04「跑全量」指令采纳）

## 目标

按已登记方案完成 **38 Skill 全量单次审查（S0→S4）**，批次顺序 S1 试点 → 批次1 核心链路 → 批次2 回路/知识+增补 → 批次3 工作流其余 → 批次4 独立入口 → 批次5 内部+共享；产出最终报告（四层证据分层、一致性统计、仲裁台账），过程自主推进不中途提问，直到完成定义满足。

## 不可违反的契约

1. **只读真相源**：评审者只读冻结 worktree；禁改 skill/runtime/源码；本地只写本 run 目录（`reviews/runs/full-review-2026-11-04/`）
2. **模型池 = 四 provider 全名**（zhipu / kiro / hst-2 / ai-qianxing2）；禁 sonnet/opus 别名（已重映射 glm-5.3）；K 层评审者跨模型盲评、互不可见
3. **findings 必须带 file:line**；advisory ≠ confirmed；证据不足记 `not-verified`，不强行判定
4. **每批收敛产物落盘再进下批**；批次完成不关闭全范围
5. **预算**：S1 外推后若超登记预算，直接执行登记收缩策略（重型+主链路保全，其余 glm-5.3-flash 结构层 + `not-run`），报告标题如实加「（收缩）」
6. **停止条件**（唯一中断点）：越权写入 / 破坏工作区 / 凭据泄露 → 立即停，报告 owner
7. **报告红线**：不写「完整审查通过」；收益固定「未验证」；`field_outcome` 不承诺

## 完成定义

38 个对象 ×（结构层逐项裁决 + 可达证据层）齐备；K 层一致性统计 + 两级仲裁台账 + 最终报告（状态 complete 或 partial，如实）落盘本 run 目录 05-s4-report/。

## 中断恢复

会话中断时：读本目录 `launch-record.md` + 各批收敛产物，从最近未完成批次继续；不重跑已落盘且 manifest 校验一致的批次。
