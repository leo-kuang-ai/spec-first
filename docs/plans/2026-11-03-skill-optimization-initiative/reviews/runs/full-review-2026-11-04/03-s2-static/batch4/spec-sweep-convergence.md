# spec-sweep 收敛报告（批次4）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 14/18、pass/fail 分歧 1（→L1 仲裁）、口径分歧 3（scope note，不仲裁）

分歧维度：B02 pass/fail（→L1）；X01 pass/not-applicable（scope note）；X02 pass/not-applicable（scope note）；X03 pass/not-applicable（scope note）

## L1 仲裁（仅争议维）：fail ；pass/not-applicable B02

**L1 fail 项全部落地修复（见下），最终 18/18 维 pass（14 全一致 + 1 分歧经仲裁修复收敛）。**

## 已修（本轮，详见 CHANGELOG 对应条目）

1. analyzer 与 riffrec 同源：safe_write_text/批次身份 byte-identical 投射同步 + Python>=3.10 护栏（FIX-034/FIX-012，投射钉住 16/16）

## 结论

- **spec-sweep 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

spec-sweep-R1-glm53.md / spec-sweep-R2-sol.md / spec-sweep-L1-astra.md
