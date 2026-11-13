# spec-plan 收敛报告（S1 试点 · 完结）

**对象**：spec-plan（主链路·方案规划）　**冻结**：5b59293b　**K=3**：R1 zhipu/glm-5.3 / R2 hst-2/gpt-6.1-sol（v2 重跑）/ R3 kiro/kimi-k3　**仲裁**：L1 hst-2/gpt-6-astra（第 3 次成功；前两次为管道缺陷未成，见 S1-CALIBRATION.md）

## 最终逐项裁决（18/18）

| ID | 最终 | 采纳路径 | 分歧记录 |
|---|---|---|---|
| D01 | pass | 多数(2/3) | R2 nv |
| D02 | pass | 全一致 | — |
| D03 | pass | 全一致 | — |
| D04 | pass | 多数(2/3) | R2 nv（首跑 fail 为输入缺陷伪影，已重跑消除） |
| D05 | pass | **L1 仲裁** | R3 fail 被裁误读（SKILL.md:98 未要求立即读 handoff）；R2 nv 混淆证据层 |
| D06 | pass | 全一致 | — |
| D07 | pass | 多数(2/3) | R2 na（适用性存疑，少数意见） |
| D08 | pass | **L1 仲裁** | R3 出格值 partial；重复读取≠无效浪费 |
| B01 | pass | 多数(2/3) | **R1 fail 保留为 dissent**（见 Findings#1） |
| B02 | pass | 全一致 | — |
| B03 | pass | 全一致 | — |
| B04 | pass | 全一致 | — |
| B05 | pass | **L1 仲裁** | R3 把测试覆盖缺口当静态合同缺陷 |
| B06 | pass | 全一致 | — |
| X01-X04 | pass | 全一致 | — |

**一致率**：全一致 11/18（61%）、多数 4/18、全分歧 3/18（L1 全裁 pass）

## 合并 Findings（结构层成立、待修）

1. **B01·P2**（R1 dissent，唯一 fail 票）：description 指向不可调用的 `runtime-maintenance` 名称，一行可修（`skills/spec-plan/SKILL.md` 头部 description）
2. **D05·维护瑕疵**（L1 新发现）：`references/synthesis-summary.md:274` 引用不存在的编号规则（入口实际只有 `Interaction Method`，`SKILL.md:48-52`）
3. **D05·P3×5**（R1）：悬空引用、html→md 孪生、单问张力、双 hint、门文本双份维护

## 结论

- **spec-plan 静态层（structure_contract）：18/18 pass**，附 2 项待修维护瑕疵 + 5 项 P3
- **行为层（behavior_quality）/成本/收益：未验证**（S3 另测）；「pass」不构成完整 Skill 验收通过
- 修复属另一轮授权（owner 逐文件批准），本审查只报告

## 产物索引

spec-plan-R1-glm53.md / spec-plan-R2-sol.md / spec-plan-R2-sol-attempt1-inputdefect.md（存档）/ spec-plan-R3-kimi.md / spec-plan-L1-astra.md（+attempt1/2 存档）/ spec-plan-agreement-matrix.tsv / S1-CALIBRATION.md
