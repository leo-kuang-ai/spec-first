# spec-riffrec-feedback-analysis 收敛报告（批次4）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 9/18、pass/fail 分歧 9（→L1 仲裁）、口径分歧 0（scope note，不仲裁）

分歧维度：D03 pass/fail（→L1）；D04 pass/fail（→L1）；D05 pass/fail（→L1）；D08 pass/fail（→L1）；B02 pass/fail（→L1）；B03 pass/fail（→L1）；B05 pass/fail（→L1）；X02 pass/fail（→L1）；X04 pass/fail（→L1）

## L1 仲裁（仅争议维）：fail ；pass/not-applicable B05、X02、X04

**L1 fail 项全部落地修复（见下），最终 18/18 维 pass（9 全一致 + 9 分歧经仲裁修复收敛）。**

## 已修（本轮，详见 CHANGELOG 对应条目）

1. safe_write_text 写隔离 + source_sha256/analysis_batch_id 批次身份 + analyzer.md Python>=3.10 披露（FIX-034；护栏 FIX-012 预修）

## 结论

- **spec-riffrec-feedback-analysis 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

spec-riffrec-feedback-analysis-R1-glm53.md / spec-riffrec-feedback-analysis-R2-sol-v2.md / spec-riffrec-feedback-analysis-L1-astra.md
