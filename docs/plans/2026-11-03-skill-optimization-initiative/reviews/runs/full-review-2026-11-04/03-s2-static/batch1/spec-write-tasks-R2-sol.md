# spec-write-tasks 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-write-tasks/SKILL.md:56-67`；`skills/spec-write-tasks/references/task-quality-guide.md:45-60` | 约束均指向 plan 单一事实源、授权与执行风险；同时将源码定向限定为 advisory，未把模型或脚本能力写成万能补丁。 |
| D02 | pass | `skills/spec-write-tasks/SKILL.md:56-67`；`skills/spec-write-tasks/references/task-pack-schema.md:90-90, 172-174, 327-327` | 明确任务包边界和 deterministic validation 与语义判断的分工；脚本不判断切分质量。 |
| D03 | pass | `skills/spec-write-tasks/SKILL.md:106-120`；`skills/spec-write-tasks/references/execution-handoff-contract.md:53-80` | 明确要求实际 CLI JSON 作为验证证据，并区分结构/新鲜度验证与语义质量；未运行验证时规定降级。 |
| D04 | pass | `skills/spec-write-tasks/SKILL.md:46-48, 106-120`；`tests/unit/spec-work-intake-contracts.test.js:19-47, 50-58` | 输出及 handoff 条件与 `spec-work` intake 对齐，消费者测试覆盖验证、波次消费及停止条件；未据此推断端到端行为已运行。 |
| D05 | pass | `skills/spec-write-tasks/SKILL.md:69-87, 122-126`；`skills/spec-write-tasks/references/task-quality-guide.md:47-60` | 入口文档按需引用分支合同，orientation 受边界约束；未见显著重复或关键规则不可定位。 |
| D06 | pass | `skills/spec-write-tasks/SKILL.md:63-67, 122-126`；`skills/spec-write-tasks/references/execution-handoff-contract.md:55-59` | 只声明 LLM/审查者承担语义判断，并在确定性工具不可用时明示降级；未承诺特定模型能力或跨模型等效。 |
| D07 | pass | `skills/spec-write-tasks/SKILL.md:77-87, 89-120`；`skills/spec-write-tasks/references/task-quality-guide.md:184-195` | 能力不依赖自动经验学习；保留 assurance intent、证据限制及 unbound limitation，符合按依据演化而非伪造验证的边界。 |
| D08 | pass | `skills/spec-write-tasks/SKILL.md:73-77`；`skills/spec-write-tasks/references/task-quality-guide.md:47-60, 70-83` | 要求从计划和相关上下文聚焦读取，并把任务引用限制在有助于边界与执行的最小材料；实际读取成本未测。 |
| B01 | pass | `skills/spec-write-tasks/SKILL.md:3, 18-24, 69-87, 128-135`；`skills/spec-write-tasks/agents/openai.yaml:1-8` | 触发、负例、分支职责及实现入口界限清楚；agent 配置禁止隐式调用，没有把任务派生包装成通用任务列表或实施入口。 |
| B02 | pass | `skills/spec-write-tasks/SKILL.md:26-48, 89-120`；`skills/spec-write-tasks/references/execution-handoff-contract.md:8-40, 42-59` | 输入、分支、输出 envelope 与失败码可定位；自动检查事实和语义判断边界明确，符合当前来源而非把历史合同草案当成生效 schema。 |
| B03 | pass | `skills/spec-write-tasks/SKILL.md:65-71, 112-120, 128-135`；`skills/spec-write-tasks/references/execution-handoff-contract.md:80-99` | 只读不授权实施；`--repo` 与 mutation target 区分，review continuation 需当前明确的有界授权，且不自动扩展到后续 workflow。 |
| B04 | pass | `skills/spec-write-tasks/SKILL.md:65, 122-126`；`skills/spec-write-tasks/references/task-pack-schema.md:62-68, 261-263`；`tests/unit/spec-write-tasks-contracts.test.js:42-53` | source/runtime 边界明确，运行时镜像不作为 source 修复目标；身份和解析根可追溯，消费者测试核对 portable identity 与可选 `spec_id`。 |
| B05 | not-verified | `skills/spec-write-tasks/SKILL.md:38-44, 69-87`；`skills/spec-write-tasks/references/execution-handoff-contract.md:55-76` | 文本规定部分失败时降级、原因码和验证失败关闭，但无法仅凭所读静态材料确认超时、重复执行、中断恢复及 dirty overlap 的实际运行处理。 |
| B06 | pass | `skills/spec-write-tasks/SKILL.md:91-120`；`skills/spec-write-tasks/references/task-quality-guide.md:197-213` | task pack 的可执行字段、可观察 done signal、review intent 和停止边界有明确要求；静态规则没有把 validator 绿灯等同于语义通过。 |
| X01 | pass | `skills/spec-write-tasks/SKILL.md:20, 42-44, 81-85`；`skills/spec-write-tasks/references/task-quality-guide.md:85-148` | 对大实现单元、反馈闭环、依赖、波次和同波文件重叠提供拆分指导，并允许复用宿主能力；实际复杂任务表现未运行验证。 |
| X02 | pass | `skills/spec-write-tasks/SKILL.md:58-67, 81-85`；`skills/spec-write-tasks/references/task-quality-guide.md:35-43, 60-62` | 架构或合同决策未定时返回计划，不自行决定范围；版本、迁移或 ADR 是否需要由具体计划和任务决定，而非要求每个 Skill 无条件产出。 |
| X03 | pass | `skills/spec-write-tasks/SKILL.md:116-120`；`skills/spec-write-tasks/references/execution-handoff-contract.md:84-99` | 高风险任务有 review handoff 与明确的执行授权条件；Skill 不宣称实际部署、发布或回滚由它执行。 |
| X04 | pass | `skills/spec-write-tasks/SKILL.md:46-48, 106-120`；`skills/spec-write-tasks/references/execution-handoff-contract.md:78-99`；`skills/spec-write-tasks/references/task-quality-guide.md:184-195` | handoff 包含来源、有效性、语义状态、授权和下一动作边界；review/跨阶段证据不足时不允许直接升级为可执行 handoff。 |

## Findings

无经静态证据确认且达到入册标准的缺陷。这里的结论限于本轮静态检查；不代表行为评测或 field outcome 已通过。

## 主责深挖面发现

- **B01 — 入口与职责：** `spec-write-tasks` 定义为 plan 到 work 的可选派生层，涵盖 compile、skip、return-to-plan、draft-only 和 validate-only；对 plan authoring、执行、未定范围、小低风险计划及泛化 task list 明确排除（`SKILL.md:18-24, 79-87`）。配置中的 `allow_implicit_invocation: false` 进一步限制隐式入口（`agents/openai.yaml:6-8`）。
- **B02 — 输入输出与设计意图：** 来源计划始终是 SoT；任务包是派生执行索引，不是生命周期或批准状态（`SKILL.md:56-64`）。运行结果要求使用 handoff envelope，并规定失败码、CLI 验证凭据和下一步限制（`SKILL.md:106-120`；`execution-handoff-contract.md:8-59`）。`spec-work` 消费端要求从 Task Pack Contract 与 execution waves 建立任务，不做平行重拆（`tests/unit/spec-work-intake-contracts.test.js:41-47`）。
- **B03 — 授权与信任：** `--repo` 只选择 artifact/source resolution root，不授权或选择 mutation target（`SKILL.md:66`）；非活跃计划的明确补完请求也不产生实施授权（`SKILL.md:69-71`）。高风险 review 续接必须满足当前运行的有界授权及宿主能力条件，且仅限本 task pack 的 doc review（`execution-handoff-contract.md:90-99`）。静态承诺清晰；这些条件在真实宿主中的执行情况未运行验证。
- **B04 — source/runtime 与宿主：** Skill 明确禁止把 `.claude/`、`.codex/`、`.agents/skills/` 镜像作为 source 修复目标（`SKILL.md:65`），schema 进一步限制 task 文件不得指向这些生成镜像（`task-pack-schema.md:261-263`）。宿主适配资源仅为可选集成名称，不要求从包内读取不存在的 Skill 文件（`SKILL.md:122-126`）。本轮未检查各宿主的真实加载与 runtime drift。
- **X01 — 大任务拆分：** 对独立验证簇、闭环、垂直切片、依赖与波次有具体 guidance，并明确同波共享文件必须串行或重拆（`task-quality-guide.md:85-148`）。静态合同较完整，但不能据此声称真实长任务的集成与恢复效果已验证。
- **X02 — API/架构/版本变化：** 未知若会改变计划范围的决策需回到 `spec-plan`；task pack 不得发明 scope 或产品决策（`task-quality-guide.md:35-43, 60-62`）。本 Skill 没有无条件要求 ADR/schema；适用时由源计划决定，符合条件检查而非普遍加功能。
- **X03 — 高风险交付：** 有 `review-task-pack` 分支和明示的 continuation 授权条件；即使 review 完成，也要求检查结构化 outcome 字段才能进入 `spec-work`（`execution-handoff-contract.md:84-99`）。高风险发布/回滚是否适用，由任务计划与实施责任边界决定。
- **X04 — 协作与跨阶段交接：** envelope 限定 `deterministic_handoff`、`semantic_posture` 与 `dispatch_authorization` 的组合条件；已有任务包需有当前 review 证据才能作为 reviewed handoff（`execution-handoff-contract.md:78-82`）。assurance intent 无法绑定时必须保留 limitation，而非合成验证（`task-quality-guide.md:184-195`）。

## 未读文件

以下文件未逐一读取；理由及未覆盖后果如下：

- `skills/spec-write-tasks/evals/eval.yaml`、`evals/cases/*.yaml`、`evals/trigger-cases.json`、`evals/boundary-cases.json`、`evals/failure-cases.json`、`evals/expected-behavior-cases.json`、`evals/yao-trigger-cases.json`、`evals/semantic_config.json`、`evals/output-quality-cases.json`、`evals/output/cases.jsonl`：这些是维护者评测夹具；已读其说明，未逐 case 对照入口、失败和质量判据。因此未核验夹具是否穷尽当前分支或模型行为是否符合预期。
- `skills/spec-write-tasks/scripts/spec-write-tasks/run-output-evals.js`：说明文档提及的 repo-level runner，本轮未执行或读取；未验证 runner 与夹具的实际执行契约及结果。`find` 未列出该路径，故文件是否存在未确认。
- `tests/unit/ce-localization-round-1-remediation-contracts.test.js`、`tests/unit/dispatch-authorization-matrix-contracts.test.js`、`tests/unit/eval-fixture-contracts.test.js`、`tests/unit/spec-doc-review-task-pack-contracts.test.js`、`tests/unit/spec-work-contracts.test.js`：消费者清单所列测试中，未逐一读取完整文件；只通过定向搜索定位与本 Skill 相关的匹配点。因此未核验这些测试的断言上下文及所有消费者分支。
- `src/cli/task-pack.js`、`src/cli/commands/tasks.js` 及其他 `src/cli` 匹配文件：只通过定向搜索检查符号和引用，未通读相关实现路径或执行测试。因此未确认 CLI 的全部边界、错误处理及脚本事实与文案承诺完全一致。
- `skills/spec-write-tasks/agents/openai.yaml` 以外的运行时投射与宿主配置：不属于本轮 source 读取范围，且未检查真实 runtime 加载；因此不对具体宿主投射/漂移作结论。
- `docs/contracts/workflows/scenario-capability-matrix.md` 与 `docs/contracts/workflows/fresh-source-eval-checklist.md`：未读取；因此不评估相关宿主场景能力、fresh-source 行为评测程序是否完成。

## 结论一句话

静态源码显示该 Skill 的入口、授权、派生身份和 handoff 边界总体一致，未发现可确认缺陷；CLI 实际行为、失败恢复、消费者全量覆盖与模型/宿主行为仍未验证。
