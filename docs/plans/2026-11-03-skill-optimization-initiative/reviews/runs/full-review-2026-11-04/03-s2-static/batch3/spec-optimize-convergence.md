# spec-optimize 收敛报告（批次3）

**K=2**：R1 zhipu/glm-5.3 / R2 hst-2/gpt-6.1-sol　**冻结**：5b59293b

## 一致率：全一致 16/18、分歧 2/18（X02 为 na/pass 范围注记）

## 最终逐项裁决：18/18 pass（1 项 P3 修复落地）

- **B02 成立为 P3，已修**：SKILL.md:107「invocation or approved spec selects `mode:measurement-only`」把 invocation token 与 spec 文件字段混写——schema 的实际路径是 `calibration.mode: measurement-only`（optimize-spec-schema.yaml:342-350，无顶层 mode 字段）。已改为「invocation selects the `mode:measurement-only` token, or the approved spec sets `calibration.mode: measurement-only`」双口径消歧
- **X02 na/pass**：范围判断分歧，无缺陷主张

## 结论

- **spec-optimize 静态层：18/18 pass**
- 行为层/成本/收益：未验证（S3 另测）

## 产物

spec-optimize-R1-glm53.md / -R2-sol.md
