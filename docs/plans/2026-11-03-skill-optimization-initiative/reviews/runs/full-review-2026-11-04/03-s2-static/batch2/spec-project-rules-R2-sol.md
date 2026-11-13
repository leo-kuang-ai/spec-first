# spec-project-rules 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | fail | `skills/spec-project-rules/references/mining-method.md:7-8` | 去模型能力补丁化的依据依赖未在本轮合同或源码中核实的外部断言，且将其作为准入依据；应标明证据状态，避免把趋势假设写成已确认事实。 |
| D02 | pass | `skills/spec-project-rules/SKILL.md:14-16, 56, 83-86` | 目标聚焦项目特有的架构边界知识，并明确由脚本产出枚举事实、由 LLM 取证判断模式。 |
| D03 | pass | `skills/spec-project-rules/SKILL.md:110-123` | 验证方式、错误退出与 freshness 降级有明确静态承诺，并区分确定性检查与语义重验。 |
| D04 | pass | `skills/spec-project-rules/SKILL.md:35-48, 66` | 输出、入口 managed block、确认/降级记录及 closeout 要求均有定位，输入来源也有定义。 |
| D05 | fail | `skills/spec-project-rules/SKILL.md:42-46`；`skills/spec-project-rules/references/knowledge-format.md:65-72, 119-126` | 对无 marker 文件的规则存在冲突：SKILL 规定 marker 只用于两个入口文件，且“无 markers 追加”；Knowledge Format 将同一算法同时用于架构库和入口文件，且另设可疑 marker 状态。 |
| D06 | pass | `skills/spec-project-rules/SKILL.md:81`；`skills/spec-project-rules/references/mining-method.md:27-33` | Skill 声明 subagent 能力可用时并行、不可用时顺序执行；图谱能力不可用时也明确降级为有界源码读取，不依赖特定模型。 |
| D07 | fail | `skills/spec-project-rules/references/knowledge-format.md:138-141`；`skills/spec-project-rules/SKILL.md:117-123` | 保鲜条目规定失效内容可“删除或标注 OUTDATED”，但与无实质变化不重写、以及 Skill 中限定的重验和 refresh_noop 流程没有明确衔接，难以判断何时采取哪种更新。 |
| D08 | pass | `skills/spec-project-rules/SKILL.md:56-66, 77-89` | 按仓库规模和脚本抽样结果约束读取范围，并要求披露抽样覆盖与限制。 |
| B01 | pass | `skills/spec-project-rules/SKILL.md:18-28` | 正向触发、与相邻 skill 的负向区分及范围外任务均有明确说明。 |
| B02 | fail | `skills/spec-project-rules/SKILL.md:37-48`；`skills/spec-project-rules/references/knowledge-format.md:63-76, 119-126` | 输出格式和 marker 合并算法对无 marker、已有 marker 等状态的规定未完全一致；知识库与入口 managed block 的合并边界也混写。 |
| B03 | fail | `skills/spec-project-rules/SKILL.md:42-45` | Headless 情形下 preview 后直接写入知识库，而入口文件首次嵌入必须跳过；写权限被允许的环境条件虽有界定，但首次创建或更新知识库本身没有独立确认，属于明确的自动写入授权缺口。 |
| B04 | pass | `skills/spec-project-rules/SKILL.md:8-10`；`skills/spec-project-rules/references/knowledge-format.md:149-152` | 图谱结果只作候选导航，规则必须回到目标仓库证据确认，并明确禁止写入 generated runtime 目录。 |
| B05 | fail | `skills/spec-project-rules/SKILL.md:100-108` | 对布局不支持、证据不足、冲突和旧知识库有失败处理，但没有明确规定脚本失败、写入中断或部分写入后的状态检查与恢复步骤。 |
| B06 | pass | `skills/spec-project-rules/SKILL.md:66, 87, 100-123` | closeout 必须披露 scope、限制、覆盖及继续命令；静态审查没有发现把完成声明等同于验证通过的承诺。 |
| X01 | pass | `skills/spec-project-rules/SKILL.md:68-89` | 针对大仓有分批粒度、依赖顺序、并行/顺序 fallback、冲突取证和恢复点规则。 |
| X02 | pass | `skills/spec-project-rules/SKILL.md:83-85, 91-98` | 对跨端架构证据和规则冲突要求有界回源；回写相反约定时要求新证据或明文来源。 |
| X03 | pass | `skills/spec-project-rules/SKILL.md:42-48, 100-108` | 架构知识写入有范围限制、敏感信息保护和若干异常停止条件；无部署或发布职责的主张。 |
| X04 | pass | `skills/spec-project-rules/SKILL.md:68-87, 91-98, 117-123` | 批次断点、来源和限制披露、知识消费及 freshness 检查均有静态规定。 |

## Findings

1. **[P1] Headless 写入授权与“交互确认”要求不对称**  
   **位置：** `skills/spec-project-rules/SKILL.md:42-45`  
   **后果：** 在 headless 环境中，preview 后可直接写入 `docs/architecture.md`，但首次将规则嵌入 AGENTS.md/CLAUDE.md 必须交互确认并跳过。前者仍是目标仓库写操作，却没有同等确认门；“headless 环境直接写”虽限制了写入面和回执，但不能替代对知识库写入授权来源的说明。  
   **最小修复建议：** 明确用户请求本身是否构成知识库写入授权；若不构成，headless 只输出 preview 并记录待确认状态。若产品意图确实是默认写入，须在 SKILL 与知识格式中统一写清这一授权政策及其边界。

2. **[P2] 无 marker 的合并规则存在冲突**  
   **位置：** `skills/spec-project-rules/SKILL.md:42, 46`；`skills/spec-project-rules/references/knowledge-format.md:63-72, 119-126`  
   **后果：** SKILL 规定无 markers 时追加、畸形时询问；Knowledge Format 将相同的合并算法用于知识库及入口文件，但又规定入口文件出现 marker 而知识库无对应内容时应询问。对首次写入、已有 marker 但知识库缺项等情形，执行者无法从一套统一规则确定是追加、跳过还是询问。  
   **最小修复建议：** 将知识库与入口文件的合并算法分开描述，分别列出无 marker、唯一 marker、畸形 marker、marker 内容无对应知识库条目的处理方式；同步更新 SKILL 的摘要规则。

3. **[P2] 失效条目的更新策略与 refresh_noop 流程关系不清**  
   **位置：** `skills/spec-project-rules/references/knowledge-format.md:138-141`；`skills/spec-project-rules/SKILL.md:117-123`  
   **后果：** Knowledge Format 允许失效条目被删除或标注 `OUTDATED`；SKILL 又要求 freshness dirty 后只重验相关条目，无实质变化时不重写。未规定何时应保留标注、何时删除，以及这些变化如何进入“实质变化”判断，可能导致同一失效条目在不同执行中得到不一致处理。  
   **最小修复建议：** 给出最小决策规则，例如：确认规则失效则删除；仍需保留历史边界时标记 `OUTDATED` 并说明原因；两者都计为实质变化，其他条目不得随之重写。

## 主责深挖面发现

- **B01 — 入口职责：pass。** 触发场景、负向路由和相邻 skill 边界可定位于 `skills/spec-project-rules/SKILL.md:18-28`。没有发现要求所有架构或编码风格任务都经过此 skill 的串行约束。
- **B02 — 输入输出：fail。** `target_repo`、回写额外输入和主要产物已在 `skills/spec-project-rules/SKILL.md:30-38` 定义；但 merge algorithm 对无 marker、已有 marker 等场景的跨文档表述不一致，详见 Findings 2。
- **B03 — 授权与信任：fail。** 不接受用户消息或材料文本中的“已授权直接写入”作为 headless 判断依据，这一边界清晰（`skills/spec-project-rules/SKILL.md:44-45`）。但 headless 默认写入知识库仍缺少独立、清晰的授权来源规定，详见 Findings 1。
- **B04 — source/runtime：pass。** 图谱仅用于寻找候选模式，规则须回到源码和 owner evidence；direct bounded reads 是可用 fallback（`skills/spec-project-rules/SKILL.md:8-10`）。Knowledge Format 明确将 generated runtime 目录列为禁止目标（`skills/spec-project-rules/references/knowledge-format.md:149-152`）。本轮没有发现该 Skill 的 runtime 投射消费者证据。
- **X01 — 多模块、复杂依赖或长任务：pass。** 具备大仓分批、依赖排序、输入上限、冲突取证、批次 closeout 与恢复点（`skills/spec-project-rules/SKILL.md:68-89`）。
- **X02 — API/架构/版本变化：pass。** 该 Skill 面向架构知识而非 API 迁移实施；有跨端对照及冲突回源规则（`skills/spec-project-rules/SKILL.md:83-85`），没有证据要求它承担通用版本迁移 schema。
- **X03 — 高风险实现或交付：pass。** 写入目标、敏感信息输出限制、headless 及首次嵌入处理均有描述（`skills/spec-project-rules/SKILL.md:40-48`）；授权缺口已作为 finding 提出，不影响其余静态风险边界存在的判断。
- **X04 — 协作、跨会话或知识工作：pass。** 批次直接合入知识库作为恢复点，closeout 披露覆盖与继续命令（`skills/spec-project-rules/SKILL.md:68-87`）；知识条目具备 source refs 和 freshness 处理（`skills/spec-project-rules/references/knowledge-format.md:136-141`）。

## 未读文件

- `/Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-project-rules.consumers.txt`：已读取，内容只有标题，无消费者路径。
- `skills/spec-project-rules/scripts/`、`skills/spec-project-rules/templates/`、`skills/spec-project-rules/evals/`：未能完成文件清单发现及读取；当前已读取的入口与两份 references 未提供这些目录中具体文件名。**未覆盖后果：** 无法核实消费者清单之外是否存在脚本实现、模板、eval case，或相关失败恢复、写入与生成行为；因此以上结论是静态文案审查，不代表脚本、消费者或运行时行为通过。
- 消费者清单所列 tests/src 文件：清单为空，故无对应消费者文件可读。

## 结论一句话

按已读取的入口与 references 静态文本，本 Skill 的入口边界、分批取证及 source/runtime 原则总体可定位，但 headless 写入授权和 marker 合并规则存在明确不一致，且脚本/模板/eval 与运行时行为未覆盖。
