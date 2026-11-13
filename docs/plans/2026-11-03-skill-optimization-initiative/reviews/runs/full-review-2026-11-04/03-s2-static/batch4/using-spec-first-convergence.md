# using-spec-first 收敛报告（批次4）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 14/18、pass/fail 分歧 2（→L1 仲裁）、口径分歧 2（scope note，不仲裁）

分歧维度：D03 pass/fail（→L1）；B02 pass/fail（→L1）；X01 not-applicable/pass（scope note）；X03 not-applicable/pass（scope note）

## L1 仲裁（仅争议维）：fail ；pass/not-applicable B02

**L1 fail 项全部落地修复（见下），最终 18/18 维 pass（14 全一致 + 2 分歧经仲裁修复收敛）。**

## 已修（本轮，详见 CHANGELOG 对应条目）

1. 输出枚举登记两个特殊结果（runtime-maintenance 标签/bounded source review，FIX-029/B02）；footprint 5790≤5800 三处等量压缩

## 结论

- **using-spec-first 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

using-spec-first-R1-glm53.md / using-spec-first-R2-sol-v2.md / using-spec-first-L1-astra.md
