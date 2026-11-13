# spec-explain 收敛报告（批次4）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 17/18、pass/fail 分歧 1（→L1 仲裁）、口径分歧 0（scope note，不仲裁）

分歧维度：D05 pass/fail（→L1）

## L1 仲裁（仅争议维）：fail D05；pass/not-applicable 无

**L1 fail 项全部落地修复（见下），最终 18/18 维 pass（17 全一致 + 1 分歧经仲裁修复收敛）。**

## 已修（本轮，详见 CHANGELOG 对应条目）

1. D05：destinations.md 两处 Phase 6→Phase 4 归一（FIX-023）

## 结论

- **spec-explain 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

spec-explain-R1-glm53.md / spec-explain-R2-sol.md / spec-explain-L1-astra.md
