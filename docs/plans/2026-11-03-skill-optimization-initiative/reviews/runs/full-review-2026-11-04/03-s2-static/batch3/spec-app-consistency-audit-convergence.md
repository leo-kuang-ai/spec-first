# spec-app-consistency-audit 收敛报告（批次3）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 9/18、pass/fail 分歧 8（→L1 仲裁）、口径分歧 1（scope note，不仲裁）

分歧维度：D03 pass/fail（→L1）；D04 pass/fail（→L1）；D05 pass/fail（→L1）；B03 pass/fail（→L1）；B05 pass/fail（→L1）；B06 pass/fail（→L1）；X01 pass/fail（→L1）；X02 pass/fail（→L1）；X03 not-applicable/pass（scope note）

## L1 仲裁（仅争议维）：fail D03、D04、D05、B02、B03、B05、B06、X01、X02；pass/not-applicable D01、D02、D06、D07、D08、B01、B04、X03、X04

**L1 fail 项全部落地修复（见下），最终 18/18 维 pass（9 全一致 + 8 分歧经仲裁修复收敛）。**

## 已修（本轮，详见 CHANGELOG 对应条目）

1. L1 九项全落：冲突降级/opt-in/stub 标记/写边界逃逸检测/参数透传/report 全域 coverage/Figma 统一（D03/B02/B05/X01/B03/D04/X02/B06/D05）；12/12 绿+fixture 行为验证

## 结论

- **spec-app-consistency-audit 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

spec-app-consistency-audit-R1-glm53.md / spec-app-consistency-audit-R2-sol-v3.md / spec-app-consistency-audit-L1-astra.md
