# spec-simplify-code 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-simplify-code/SKILL.md:17-18,79-84` | 将修复故障与行为保持型清理分开，并明确禁止删除安全检查，约束目的可定位且一致。 |
| D02 | not-verified | `skills/spec-simplify-code/SKILL.md:35,42` | 要求查调用方、邻近实现及证据来源，但本轮未读完消费者源码，无法判断所需领域约束是否覆盖充分。 |
| D03 | pass | `skills/spec-simplify-code/SKILL.md:85-100` | 明确列出验证动作、结果披露和失败处理；并未将静态规则冒充为自动验证保证。 |
| D04 | not-verified | `skills/spec-simplify-code/SKILL.md:11,42,91,104` | 规定 caller-owned 回交、证据继承和最终树验证责任；消费者如何实际消费这些输出未核验。 |
| D05 | pass | `skills/spec-simplify-code/SKILL.md:7,15-42,44-108` | 范围、证据保护、修复和验证规则可定位，未以减行数为简化目标。 |
| D06 | pass | `skills/spec-simplify-code/SKILL.md:57-73` | 模型选择与隔离依据限定为当前能力事实，未知时采用继承或串行并记录限制；此处按 Skill 自身能力假设审查。 |
| D07 | not-verified | `skills/spec-simplify-code/SKILL.md:42,91,104-108` | 要求携带证据来源、新鲜度限制及结果，但经验是否被真实消费者复用、失效条件是否有效，缺少消费方核查。 |
| D08 | pass | `skills/spec-simplify-code/SKILL.md:27-35,59-67` | 设置预检与按需读取 reviewer/test lens 的条件，且要求读取完整评审提示而非凭记忆转述。 |
| B01 | pass | `skills/spec-simplify-code/SKILL.md:13-25,27-35` | 明确区分报告建议与明确清理授权，故障转交 `spec-debug`，并设空范围停止条件。 |
| B02 | not-verified | `skills/spec-simplify-code/SKILL.md:11,42,57-73,102-108` | 入口要求消费 caller evidence 并回交结果；消费者契约和实际调用路径未读全，不能确认端到端一致。 |
| B03 | pass | `skills/spec-simplify-code/SKILL.md:11-13,21-25,57-58,73,81-84` | 只读建议不授权改写；授权仅覆盖有界清理，且保护验证证据与安全检查。 |
| B04 | pass | `skills/spec-simplify-code/SKILL.md:35,42,91` | 明确区分读取证据与 mutation scope，并由 caller 负责最终树验证；未发现要求修改 generated runtime 的条款。 |
| B05 | pass | `skills/spec-simplify-code/SKILL.md:25,57-73,91-100` | 对无范围、能力未知、并发回压、验证失败及缺失验证能力均有停止、降级或披露约定。 |
| B06 | pass | `skills/spec-simplify-code/SKILL.md:77-108` | 要求对 findings 逐项处理、保留验证证据并披露未完成限制；无发现时允许保持现状。 |
| X01 | not-applicable | `skills/spec-simplify-code/SKILL.md:21-35,69` | 此 Skill 是有界清理而非多模块任务编排器；若 scope 涉及共享代码，要求按影响面扩大验证，不自建长任务编排。 |
| X02 | not-applicable | `skills/spec-simplify-code/SKILL.md:35,79` | 职责限定为行为保持型代码清理，不负责 API/架构/版本变更；遇到无法证明等价的改动应跳过。 |
| X03 | not-applicable | `skills/spec-simplify-code/SKILL.md:83,91-100` | 不负责高风险发布或部署；明确保留安全检查并由 caller 承担最终验证与收尾。 |
| X04 | pass | `skills/spec-simplify-code/SKILL.md:9-11,42,91,102-108` | 定义 caller-owned 回交，并要求携带 source/test refs、证据来源、新鲜度限制和验证结果。 |

## Findings

1. **消费者核验未完成，无法确认静态交接合同的实际落点**  
   - 位置：`docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-simplify-code.consumers.txt:2-5`
   - 后果：清单列出的三个消费者未完成阅读，因而 D02、D04、D07、B02 的结论只能保持 `not-verified`；不能据此断言消费者与 Skill 合同一致或存在缺陷。
   - 最小建议：补读清单中的三个测试及其引用的相关实现，再回源核对 Skill 的 caller handoff、proof-test 证据和授权约定。**这是本轮覆盖限制，不是已确认的 Skill 缺陷。**

## 主责深挖面发现

- **B01（入口职责）**：通过。入口将“检查/建议”定义为 report-only；明确简化请求才授权有界清理；故障请求转到 `spec-debug`。证据：`skills/spec-simplify-code/SKILL.md:13-25`。
- **B02（输入输出）**：未验证消费者一致性。Skill 要求接收 caller 的验证证据、来源引用、限制和已定决策，并回交 caller；但消费者源码未读完。证据：`skills/spec-simplify-code/SKILL.md:9-11,42,102-108`。
- **B03（授权与信任）**：通过。`proof-test:<path>` 被限定为受保护验证上下文，不是 mutation scope；只读建议不产生写权限；派发需明确授权。证据：`skills/spec-simplify-code/SKILL.md:9-13,49-58`。
- **B04（source/runtime 与宿主）**：通过。明确说明读取调用方与邻近实现不扩大修改范围；未见对 generated runtime 的修改授权。证据：`skills/spec-simplify-code/SKILL.md:35`。
- **X01-X04**：X01-X03 按 Skill 的有界、行为保持清理职责判为不适用，理由见逐项表；X04 适用且通过，回交要求包含证据与限制，见 `skills/spec-simplify-code/SKILL.md:9-11,42,104`。

## 未读文件

- `tests/unit/dispatch-authorization-matrix-contracts.test.js`：本轮未读取；无法核验其对派发授权约定的断言及与当前 Skill 文本的一致性。
- `tests/unit/spec-lfg-contracts.test.js`：本轮未读取；无法核验 LFG handoff 是否按 caller-owned 契约传递本 Skill 所要求的范围与证据。
- `tests/unit/specialized-skill-calibration-contracts.test.js`：本轮未读取；无法核验该测试对 Skill 入口、授权或校准行为的覆盖。
- 消费者清单之外，未读取 Skill 的另外两个 persona 提示文件 `skills/spec-simplify-code/references/personas/code-quality-reviewer.md`、`skills/spec-simplify-code/references/personas/efficiency-reviewer.md`，以及 `skills/spec-simplify-code/references/test-value-lens.md`：入口规定其在不同 reviewer lens / test 场景中条件读取；本轮未评这些条件分支的具体规则，故不能对其提示内容给出独立裁决。
- 未发现并未读取目标 Skill 的 `scripts/`、`templates/` 或 `evals/` 文件；未覆盖后果是不能判断是否存在未被入口提及的脚本、模板或预置场景。

## 结论一句话

在已读的 Skill 入口及 code-reuse reviewer 提示范围内，静态授权、证据保护和验证承诺整体可定位且内部一致；消费者及部分条件读取材料未核验，因此本轮不对其端到端交接一致性作通过结论。
