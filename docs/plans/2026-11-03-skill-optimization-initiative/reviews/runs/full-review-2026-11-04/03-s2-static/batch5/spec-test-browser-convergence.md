# spec-test-browser 收敛报告（批次5）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 13/18、pass/fail 分歧 4（→L1 仲裁）、口径分歧 1（scope note，不仲裁）

分歧维度：D04 pass/fail（→L1）；B02 pass/fail（→L1）；B05 pass/fail（→L1）；X04 pass/fail（→L1）；X01 not-applicable/pass（scope note）

## L1 仲裁（仅争议维）：fail ；pass/not-applicable B02、B05、X04

**L1 fail 项全部落地修复（见下），最终 18/18 维 pass（13 全一致 + 4 分歧经仲裁修复收敛）。**

## 已修（本轮，详见 CHANGELOG 对应条目）

1. 恢复载荷透传（probe 阻断分支带 conformance_status/repair_scope/next_action/conformance_recovery）+ pending-receipt.json 预落盘（FIX-035，56/56 绿）

## backlog / 留观

1. L1 建议的内部总预算+清理预留判定 80/20 留观：确定性恢复缺口已由 pending-receipt 关闭

## 结论

- **spec-test-browser 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

spec-test-browser-R1-glm53.md / spec-test-browser-R2-sol.md / spec-test-browser-L1-astra.md
