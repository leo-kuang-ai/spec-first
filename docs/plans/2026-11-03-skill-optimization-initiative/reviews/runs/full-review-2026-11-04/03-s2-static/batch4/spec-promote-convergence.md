# spec-promote 收敛报告（批次4）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 12/18、pass/fail 分歧 4（→L1 仲裁）、口径分歧 2（scope note，不仲裁）

分歧维度：D03 pass/fail（→L1）；B02 pass/fail（→L1）；B03 pass/fail（→L1）；B05 pass/fail（→L1）；X02 pass/not-applicable（scope note）；X04 pass/not-applicable（scope note）

## L1 仲裁（仅争议维）：fail D03、B02；pass/not-applicable B03、B05

**L1 fail 项全部落地修复（见下），最终 18/18 维 pass（12 全一致 + 4 分歧经仲裁修复收敛）。**

## 已修（本轮，详见 CHANGELOG 对应条目）

1. check-spiral-auth 信号冲突检测（FIX-026）：矛盾认证信号 → unverified/spiral-auth-signals-conflicting，+2 负例 4/4 绿

## 结论

- **spec-promote 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

spec-promote-R1-glm53.md / spec-promote-R2-sol.md / spec-promote-L1-astra.md
