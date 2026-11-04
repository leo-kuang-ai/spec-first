# spec-rule-miner 收敛报告（批次4）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 14/18、pass/fail 分歧 3（→L1 仲裁）、口径分歧 1（scope note，不仲裁）

分歧维度：D03 pass/fail（→L1）；B02 pass/fail（→L1）；B03 pass/fail（→L1）；X03 pass/not-applicable（scope note）

## L1 仲裁（仅争议维）：fail X04；pass/not-applicable 无

**L1 fail 项全部落地修复（见下），最终 18/18 维 pass（14 全一致 + 3 分歧经仲裁修复收敛）。**

## 已修（本轮，详见 CHANGELOG 对应条目）

1. 规则块组成合同：适用与失效边界段落为必选（write-targets.md 块组成 + SKILL.md 步骤5，FIX-025）

## 结论

- **spec-rule-miner 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

spec-rule-miner-R1-glm53.md / spec-rule-miner-R2-sol-v2.md / spec-rule-miner-L1-astra.md
