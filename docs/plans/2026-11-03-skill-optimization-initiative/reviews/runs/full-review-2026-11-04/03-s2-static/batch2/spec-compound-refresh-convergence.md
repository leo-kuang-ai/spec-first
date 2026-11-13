# spec-compound-refresh 收敛报告（批次2）

**K=3**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2 备用 provider） / R3 kiro/kimi-k3　**冻结**：5b59293b

## 一致率：全一致 15/18、多数 3/18（全部 → pass）、全分歧 0（免仲裁）

## 最终逐项裁决：18/18 pass

- **R1 B02 lone fail 采纳（冻结时点真实，已修复）**：模板 argument-hint 宣传已弃用 `mode:autofix` 与 SKILL.md `[mode:non-interactive]` 不一致——即 **FIX-009**（c8a0dd1c，批次2 首轮发现，本轮 R1 在冻结基线独立复现，交叉确认）；维度裁决多数 pass（模板属 source 已修，SKILL 合同本身一致）
- **R2 B06 fail → S3**：scope 负例判据接受任一关键词（含明确承接范围外重构的回复）——eval 判据强度问题，非静态合同破裂
- **R3 X01 not-applicable**：单仓文档维护 + batch triage，不涉多模块工程编排——范围判断成立

## 合并 Findings 与处置

**已修（前轮）**
1. FIX-009（B02）：argument-hint 撤除 mode:autofix 宣传（本轮 R1 复现确认该修复的必要性）

**S3 backlog**
2. R2 B06：non-solutions-scope-gated 判据关键词过宽

## 结论

- **spec-compound-refresh 静态层：18/18 pass**
- 行为层/成本/收益：未验证（S3 另测）

## 产物

spec-compound-refresh-R1-glm53.md / -R2-sol-v2.md（ai-qianxing2） / -R3-kimi.md
