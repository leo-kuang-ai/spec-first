# spec-worktree 收敛报告（批次5）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 16/18、口径分歧 2（全部为 na/pass 或 pass/not-verified 类 scope note，不触发仲裁）

分歧维度：X01 not-applicable/pass（scope note）；X04 not-applicable/pass（scope note）

**18/18 维最终 pass，无 fail 裁决。**

## 已修（本轮，详见 CHANGELOG 对应条目）

无静态层修复需求。

## backlog / 留观

1. S3 行为层 unborn-repo-create-refuses FAIL（unborn 仓库绕过结构化拒绝）——行为 backlog

## 结论

- **spec-worktree 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

spec-worktree-R1-glm53.md / spec-worktree-R2-sol.md
