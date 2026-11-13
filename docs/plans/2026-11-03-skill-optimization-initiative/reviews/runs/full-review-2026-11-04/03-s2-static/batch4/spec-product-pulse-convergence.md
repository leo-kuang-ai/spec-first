# spec-product-pulse 收敛报告（批次4）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 11/18、pass/fail 分歧 5（→L1 仲裁）、口径分歧 2（scope note，不仲裁）

分歧维度：D03 pass/fail（→L1）；D05 pass/fail（→L1）；B02 pass/fail（→L1）；B05 pass/fail（→L1）；X02 pass/fail（→L1）；X01 not-applicable/pass（scope note）；X03 pass/not-applicable（scope note）

## L1 仲裁（仅争议维）：fail D03、D05、B02、B05、X02；pass/not-applicable 无

**L1 fail 项全部落地修复（见下），最终 18/18 维 pass（11 全一致 + 5 分歧经仲裁修复收敛）。**

## 已修（本轮，详见 CHANGELOG 对应条目）

1. 时长默认值四值合同 + 同分钟报告唯一后缀防覆盖 + eval 状态规范化 permission-denied（FIX-032）

## 结论

- **spec-product-pulse 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

spec-product-pulse-R1-glm53.md / spec-product-pulse-R2-sol.md / spec-product-pulse-L1-astra.md
