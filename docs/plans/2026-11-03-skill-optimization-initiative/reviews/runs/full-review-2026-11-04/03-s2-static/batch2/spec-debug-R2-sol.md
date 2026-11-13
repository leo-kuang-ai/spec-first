# spec-debug 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | not-verified | `skills/spec-debug/SKILL.md:50-65` | 能看到排障原则与反合理化提示，但未完成全部必读材料及所需对照证据，无法裁定这些约束是否过时、矛盾或过度指导。 |
| D02 | not-verified | `skills/spec-debug/SKILL.md:85-99, 135-160` | 源码包含问题来源、追踪和历史工作的指引；尚未完成消费者及设计依据对账，无法裁定领域约束与职责是否恰当。 |
| D03 | not-verified | `skills/spec-debug/SKILL.md:19-20, 246-325` | 可定位验证与收尾承诺，但未读完其实现/消费者证据，无法完整判定验证要求与实际强制边界的一致性。 |
| D04 | not-verified | `skills/spec-debug/SKILL.md:21, 252-325` | 入口列出消费者并描述结构化交接；未完成消费者源码与交接场景核对，不能据字段或文案判定交接有效。 |
| D05 | not-verified | `skills/spec-debug/SKILL.md:67-77, 279-325` | 可见阶段及收尾指令较多；未完成完整阅读和调用路径核对，无法裁定重复、冲突及维护成本。 |
| D06 | not-verified | `skills/spec-debug/SKILL.md:118-123, 223-227` | 源码明确提及能力缺失时的降级和顺序探查；未能依据本轮规则完成其自身能力假设的静态一致性审查。 |
| D07 | not-verified | `skills/spec-debug/SKILL.md:356-368` | 可见知识捕获的适用门槛；未核对相关消费者、合同和知识写入边界，无法裁定经验效用闭环。 |
| D08 | not-verified | `skills/spec-debug/SKILL.md:29-44, 85-89` | 源码按需加载参考资料并标注部分运行边界；未完成全部读取范围与摘要要求对账，不能判定上下文利用充分性。 |
| B01 | not-verified | `skills/spec-debug/SKILL.md:2-4, 13-21, 196-210` | 有触发描述、相似入口提示和 brainstorm 升级条件，但消费者与范围外请求核对未完成。 |
| B02 | not-verified | `skills/spec-debug/SKILL.md:17-21, 254-275` | 有输入、输出及摘要格式；尚未完整对账 references、合同、脚本和消费者，不能确认一致性。 |
| B03 | not-verified | `skills/spec-debug/SKILL.md:27, 34-35, 48, 202, 237-244, 342-354` | 文案区分修复、提交与落地授权，并限制材料授权效力；未完成全部边界分支和消费者验证。 |
| B04 | not-verified | `skills/spec-debug/SKILL.md:89, 118, 237-242` | 文案区分 canonical source 与 runtime mirror，并限制再生；未完成生成逻辑及宿主投射证据核验。 |
| B05 | not-verified | `skills/spec-debug/SKILL.md:42-44, 108, 120-123, 240, 246, 299-325` | 覆盖能力缺失、重复尝试、dirty overlap 与验证记录；未完成恢复、部分成功及重复执行路径的全量核对。 |
| B06 | not-verified | `skills/spec-debug/SKILL.md:259-340, 279-295` | 明确结构化摘要、审查与复验，但未完成所有消费者和交付闭环证据核验。 |
| X01 | not-verified | `skills/spec-debug/SKILL.md:214-227` | 源码包含并行探查授权、能力探测、隔离及失败回退规则；未完成多模块长任务的完整分支审查。 |
| X02 | not-verified | `skills/spec-debug/SKILL.md:204-210, 235` | 有设计问题时转交 brainstorm 的边界；未完成 API/架构/版本变化场景及消费者合同核对。 |
| X03 | not-verified | `skills/spec-debug/SKILL.md:42-48, 237-325, 342-354` | 有高风险标记、秘密处理、验证及提交/落地边界；未完成高风险交付场景全量核对。 |
| X04 | not-verified | `skills/spec-debug/SKILL.md:21, 254-275, 356-368` | 有结构化交接和知识捕获要求；未完成跨会话、消费者及知识失效条件核验。 |

## Findings

本轮没有达到可登记 finding 的证据标准：我没有完成用户指定的全部必读材料及消费者文件阅读，因此不把未核实的疑点登记为缺陷。

## 主责深挖面发现

- **B01—B04、X01—X04：均未形成可下结论的发现。** 上表证据仅表明入口中存在相关静态承诺；不能替代完整 references、合同与消费者核对。
- **不作“通过”推断。** 本轮未完成指定覆盖，不代表相关行为失败，也不代表静态合同已通过。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：尝试读取时权限未获准；未覆盖其中的用户级补充指引。
- `skills/spec-debug/references/fix.md`、`investigation-techniques.md`、`defense-in-depth.md`、`anti-patterns.md`、`pipeline-return.md`：未完成读取；未覆盖修复、调查技巧、防御纵深、反模式和 pipeline-return 的完整静态承诺。
- `skills/spec-debug/evals/` 下的评测定义、案例、fixture：未完成读取；未覆盖评测场景与 fixture 对源码合同的辅助证据。
- `tests/unit/anti-rationalization-contracts.test.js`、`dispatch-authorization-matrix-contracts.test.js`、`scenario-capability-matrix-contracts.test.js`、`spec-debug-contracts.test.js`、`spec-debug-fix-reference-contracts.test.js`、`spec-debug-judge-calibration.test.js`、`spec-work-implementation-quality-contracts.test.js`、`spec-work-lfg-recovery-contracts.test.js`、`spec-work-shipping-contracts.test.js`、`specialized-skill-calibration-contracts.test.js`：未完成读取；未覆盖消费者测试对承诺的断言、冲突或缺口。
- `docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md`：未完成读取；未覆盖本轮合同基线的完整条款及其与入口的逐条对照。

## 结论一句话

本轮未完成规定的必读材料与消费者覆盖，故 D01–D08、B01–B06、X01–X04 均只能记为 `not-verified`，不能据此判定 spec-debug 通过或失败。
