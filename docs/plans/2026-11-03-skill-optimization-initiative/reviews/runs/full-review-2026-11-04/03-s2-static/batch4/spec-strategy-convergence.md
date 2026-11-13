# spec-strategy 收敛报告（批次4）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 14/18、pass/fail 分歧 4（→L1 仲裁）、口径分歧 0（scope note，不仲裁）

分歧维度：D01 pass/fail（→L1）；D03 pass/fail（→L1）；D05 pass/fail（→L1）；B06 pass/fail（→L1）

## L1 仲裁（仅争议维）：fail D01、D05、B02；pass/not-applicable D03、B06

**L1 fail 项全部落地修复（见下），最终 18/18 维 pass（14 全一致 + 4 分歧经仲裁修复收敛）。**

## 已修（本轮，详见 CHANGELOG 对应条目）

1. 数量例外合同（追问上限后保留实际数不凑数 ×3 处）+ 定向更新语义 + eval case 顺序许可（FIX-027）

## 结论

- **spec-strategy 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

spec-strategy-R1-glm53.md / spec-strategy-R2-sol.md / spec-strategy-L1-astra.md
