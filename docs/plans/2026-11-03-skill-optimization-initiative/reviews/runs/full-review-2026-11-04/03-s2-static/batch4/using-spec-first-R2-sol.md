# using-spec-first 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/using-spec-first/SKILL.md:20-22,26-30` | fast path 与失败优先路由明确，规则可定位；本轮未评估行为收益。 |
| D02 | pass | `skills/using-spec-first/SKILL.md:12-16,48-52`；`skills/using-spec-first/references/conditional-routing-boundaries.md:11-14,18-22` | 明确意图、source rules、脚本事实与语义判断的职责边界。 |
| D03 | pass | `skills/using-spec-first/SKILL.md:14,48-52` | 对 mutation、verification claim、source/runtime、handoff 和 knowledge promotion 明确设出口边界；未将 prose 约定声称为机械强制。 |
| D04 | not-verified | `skills/using-spec-first/SKILL.md:12-16`；`docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md:27-30` | Skill 声明消费者包括所有 public workflow，但本轮未完成消费者源码审读，无法判断实际交接是否正确消费入口契约。 |
| D05 | pass | `skills/using-spec-first/SKILL.md:18-22,24-30,48-52` | 主入口、条件路由和出口边界分层；条件细节按需放在 reference，结构可审计。 |
| D06 | pass | `skills/using-spec-first/SKILL.md:28-30,32-44` | 明确区分宿主描述预算观测与真实截断证据，并提供 route map、单问题澄清和等待边界；按 Skill 自身能力假设裁定。 |
| D07 | pass | `skills/using-spec-first/SKILL.md:46,50`；`skills/using-spec-first/references/conditional-routing-boundaries.md:48-55` | 明确不自动推广知识，并要求 knowledge promotion 有验证、复用范围及失效条件。 |
| D08 | pass | `skills/using-spec-first/SKILL.md:30,52`；`skills/using-spec-first/references/conditional-routing-boundaries.md:3,7,13` | 主入口按需加载 route map 与条件边界；安装项目缺少可选 source 文档时要求披露而非虚构读取。 |
| B01 | pass | `skills/using-spec-first/SKILL.md:3,18-22,30-44`；`skills/using-spec-first/references/public-route-map.md:35-66` | 说明正向触发、fast-path 负例、单入口交接及 internal helper 不作用户菜单项；route map 中也区分 public workflows 与 standalone skills。 |
| B02 | not-verified | `skills/using-spec-first/SKILL.md:10-16,30-52`；`skills/using-spec-first/references/public-route-map.md:19-43` | 入口输入输出和 source/readiness 规则可见，但 route map 所列消费者未完成逐个源码对账，无法裁定接口一致性。 |
| B03 | pass | `skills/using-spec-first/SKILL.md:14,26,42-46,48-52`；`skills/using-spec-first/references/conditional-routing-boundaries.md:30-35,43-49` | 明确 route 不产生副作用授权，并覆盖委派授权、内嵌指令、父多仓写入、handoff 与知识提升边界。 |
| B04 | not-verified | `skills/using-spec-first/SKILL.md:50-52`；`skills/using-spec-first/references/conditional-routing-boundaries.md:16-22` | source/runtime 边界及 generated mirror 禁改规则明确，但消费者、生成逻辑和多宿主投射未完成审读。 |
| B05 | pass | `skills/using-spec-first/SKILL.md:30-44`；`skills/using-spec-first/references/conditional-routing-boundaries.md:13,19-21,32-35` | 对能力缺失提供 bounded direct-read/fallback 或阻断依赖动作，并要求不因路由匹配自动执行维护；未发现此入口自身需要重试机制的静态承诺。 |
| B06 | pass | `skills/using-spec-first/SKILL.md:46,50-52` | 明确首个实质结果的范围披露、证据要求及不伪造验证/完成声明。 |
| X01 | pass | `skills/using-spec-first/SKILL.md:30`；`skills/using-spec-first/references/public-route-map.md:17,33` | 对多阶段链路明确单选入口、不自动串行编排，并保持活跃 workflow owner 连续性。 |
| X02 | not-applicable | `skills/using-spec-first/SKILL.md:8,15` | 此入口只做语义路由，不拥有 API、架构或版本变更设计职责；不适用理由来自自身职责边界。 |
| X03 | pass | `skills/using-spec-first/SKILL.md:14,46,48-52`；`skills/using-spec-first/references/conditional-routing-boundaries.md:19-21,43-49` | 对 runtime 维护、跨仓写入、提交、handoff 和知识提升保留明确授权与证据出口。 |
| X04 | pass | `skills/using-spec-first/SKILL.md:14,30-46,52`；`skills/using-spec-first/references/conditional-routing-boundaries.md:32-35,46-49` | 覆盖 worker 授权、跨会话交接与知识提升所需边界；要求 handoff 的 summary、source refs、freshness 和 limitations。 |

## Findings

- **消费者覆盖未完成（证据缺口，不判为 Skill 缺陷）**  
  位置：`docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/using-spec-first.consumers.txt:1-17`。  
  后果：无法确认 adapter、bootstrap、plugin sync 与测试是否都与当前入口契约一致，因此 D04、B02、B04 不能给静态通过结论。  
  最小修复建议：完成消费者清单所列文件的源码审读，并按实际链路补齐这些裁决的证据；本次不据此推断存在代码缺陷。

## 主责深挖面发现

- **B01—B04：** Skill 本体对入口选择、唯一交接、权限边界与 source/runtime 原则均有可定位承诺；但消费者清单内文件未完成审读，无法验证其实际实现和宿主投射是否一致。相关项目分别记为 not-verified，而不是据此判 fail。
- **X01—X04：** 对多步骤路由、授权边界、风险出口与跨会话/知识边界，静态承诺整体清晰。X02 按职责不适用；其余三项未发现静态矛盾。

## 未读文件

以下消费者清单所列源码文件本轮未读；因此未覆盖其与 Skill 路由契约的实际一致性、消费者使用路径和相关测试证据：

- `src/cli/adapters/cursor.js`
- `src/cli/adapters/kiro.js`
- `src/cli/adapters/qoder.js`
- `src/cli/instruction-bootstrap.js`
- `src/cli/plugin-sync.js`
- `tests/integration/init-six-host-lifecycle.integration.test.js`
- `tests/unit/instruction-bootstrap.test.js`
- `tests/unit/pointer-based-adapter.test.js`
- `tests/unit/project-graph-consumption-contracts.test.js`
- `tests/unit/qoder-runtime-lifecycle.test.js`
- `tests/unit/session-start-entry.test.js`
- `tests/unit/skill-flow-p2-closure-contracts.test.js`
- `tests/unit/spec-handoff-contracts.test.js`
- `tests/unit/using-spec-first-contracts.test.js`

以下已读：`skills/using-spec-first/SKILL.md`、`references/public-route-map.md`、`references/conditional-routing-boundaries.md`、检查表第 4 节、角色契约、合同基线及消费者清单。未读的 Skill 本地文件：`skills/using-spec-first/evals/eval.yaml`、`evals/cases/failure-priority-single-entry.yaml`、`evals/cases/route-vague-idea-to-spec-brainstorm.yaml`、`evals/cases/direct-lane-simple-howto.yaml`、`evals/cases/recommendation-only-format.yaml`、`evals/cases/route-failure-to-spec-debug.yaml`、`evals/cases/r2-low-confidence-one-question.yaml`、`evals/fixtures/scripts/check-r2-asks.sh`。它们可能提供行为场景与静态合同测试线索，本次未覆盖其与入口规则的对应关系；按本轮静态合同裁决范围，不据此声称行为通过。

## 结论一句话

已读入口与两个 references 的静态承诺总体清晰，未确认缺陷；但消费者源码与 eval 文件未完整审读，结论仅限已读材料，不能作为完整审查通过。
