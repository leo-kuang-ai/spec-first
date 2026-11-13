# spec-commit 收敛报告（批次5）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2，-v2 为重跑版）　**L1 仲裁**：hst-2/gpt-6-astra　**冻结**：5b59293b

## 一致率：全一致 5/18、pass/fail 分歧 2（→L1 仲裁）、口径分歧 11（scope note，不仲裁）

分歧维度：D04 pass/fail（→L1）；B04 pass/fail（→L1）；D01 pass/not-verified（scope note）；D02 pass/not-verified（scope note）；D03 pass/not-verified（scope note）；D05 pass/not-verified（scope note）；D07 pass/not-verified（scope note）；D08 pass/not-verified（scope note）；B02 pass/not-verified（scope note）；B05 pass/not-verified（scope note）；B06 pass/not-verified（scope note）；X03 pass/not-applicable（scope note）；X04 not-applicable/not-verified（scope note）

## 分歧收敛：D04/B04 为 R1 fail × R2 not-verified（R2 未读 references 的覆盖限制），R1 fail 断言经确定性核实（grep + 源文件读取）全部成立，按分歧梯子第一级收敛，无需 L1

## 已修（本轮，详见 CHANGELOG 对应条目）

1. D04：SKILL.md 两处共享 reference 引用补消费范围限定（precommit/recovery 边界 only），显式豁免其 default-branch branch-creation 流程（该流程归 spec-commit-push-pr pipeline；本 helper 分支创建以 Step 4 为准）——消除「Step 4 从当前 HEAD 建分支」与共享文件无条件「先读 branch-creation.md 走 fetch fresh base」的流程冲突
2. B04：SKILL.md:26/:124 裸仓库相对路径 `skills/spec-commit-push-pr/references/commit-and-push.md` 改为安装态可解析措辞（从当前已安装的 spec-commit-push-pr Skill 目录解析），对齐 full-mode.md:177 同类消费点先例——原路径在 8 宿主投射安装态（用户项目）不存在

验证：spec-commit 套件 7/7 绿。

## 结论

- **spec-commit 静态层：18/18 维最终 pass**（含仲裁修复与口径说明）
- 行为层基线：见 `04-s3-behavior/S3-SUMMARY.md`

## 产物

spec-commit-R1-glm53.md / spec-commit-R2-sol.md
