# spec-prd 收敛报告（批次1）

**K=3**：R1 zhipu/glm-5.3 / R2 hst-2/gpt-6.1-sol / R3 kiro/kimi-k3　**冻结**：5b59293b

## 一致率：全一致 9/18（50%）、多数 9/18、全分歧 0（免仲裁）

## 最终逐项裁决：17 pass / 1 fail

- **D05（紧凑性和可审计性）：fail，多数(2/3)**——R2+R3 fail，R1 pass 为 dissent
  - R3 理由实、R2 理由弱：R3 指认防御性复述密度并给出可核实计数；R2 的 fail 理由是「未读齐引用文件与运行成本，无法证明值得」——证据层混淆（运行成本属 S3），按 S1 L1 先例该票应记 not-verified
  - **主会话已用脚本确定性核实 R3 计数**：`relentless` 全包 **24 处/6 文件**（R3 报 18，实际更密）、`Four Legal Stop Points` **18 处/6 文件**（SKILL.md 内 6 处）、SKILL.md 347 行。R1 亦以 P3 finding #3 独立观察到同一复述（Canonical 停止点 SKILL.md 内 6+ 处），只是未翻裁决
  - 即使剔除 R2 弱票，R3+R1 finding 双重独立佐证 → fail 成立
- **D08：pass，多数(2/3)**——R2 fail（同证据层混淆理由，dissent 记录）；R1/R3 以 Reference Trigger Map 按需加载判 pass
- 7 项 R2 not-verified（D04/D07/B02/B05/B06/X02/X03）：R2 自报未执行 fresh-source eval、未读评测治理材料的覆盖声明；按 S1 L1 先例「覆盖声明≠对象结论」，采纳 R1+R3 多数 pass，限制记录在案

## 合并 Findings（进入优化阶段修复清单）

**P2**
1. **D05·P2**（R3 #1，脚本已核实计数）：核心规则防御性复述密度过高——relentless ×24/6 文件、Four Legal Stop Points ×18/6 文件，改一处易漏其余

**P3**
2. D05/D08（R1 #1）：悬空枚举值 `ai-executable-product-clarification`
3. D05（R1 #2）：`can_enter_spec-plan` 连字符与 `can_enter_spec_plan` 下划线混用
4. D05（R3 #3）：Lite profile 与默认 profile 分支判别依赖单 token 字符串，无 typo 容错说明
5. D05（R3 #4）：evals 主集与 skillup 对抗集覆盖不对称
6. D03（R1 #5）：source 类 disposition 证据列位置未文档化
7. D04 观察（R1 #6）：spec-plan 将 spec-prd 产物定位为 legacy origin，spec-prd 文档未登记该口径

## 结论

- **spec-prd 静态层：17/18 pass，D05 fail**（复述密度，已确定性核实，待优化阶段修复）
- 行为层/成本/收益：未验证（S3 另测）

## 产物

spec-prd-R1-glm53.md / -R2-sol.md / -R3-kimi.md
