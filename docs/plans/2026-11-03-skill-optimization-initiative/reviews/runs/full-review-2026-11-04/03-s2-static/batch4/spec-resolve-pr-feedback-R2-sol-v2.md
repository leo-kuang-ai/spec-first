# spec-resolve-pr-feedback 评审（R2）

## 逐项裁决表

评审基线：`5b59293bb1aecb40c4894549a89f8b045dfa40fe`，工作区干净。本轮仅裁决静态合同；已读取目标入口、全部 references、全部脚本与 eval 资产，以及消费者清单中的全部六个测试文件。未执行测试、真实 PR 操作或行为评测。

下表路径均相对仓库根；`S` 指 `skills/spec-resolve-pr-feedback/`。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `S/references/evaluation-rubric.md:19-23`；`S/references/full-mode.md:88-98` | 指令类修复强调条件与责任 owner，简单修复优先 inline；保留的流程约束主要服务授权、验证与副作用恢复。 |
| D02 | pass | `S/scripts/get-pr-comments:45-58`；`S/references/evaluation-rubric.md:25-55` | 脚本准备分页、身份和截断事实，LLM 判断可操作性、设计意图、修复价值与风险，职责分工明确。 |
| D03 | pass | `S/references/full-mode.md:153-165`、`:248-280`；`S/scripts/inspect-fix-publication.cjs:19-37` | 合并验证失败阻断提交推送，远端修复声明要求精确 SHA 可达性及回复可见性；脚本事实检查与 prose 执行义务可区分，不据此声称全部 gate 已硬强制。 |
| D04 | pass | `S/references/pipeline-return.md:24-83`；`skills/spec-lfg/references/pr-watch-loop.md:33-66` | resolver 返回本地修复、逐来源待办和限制，caller 消费相同字段并承担最终验证、发布与会话收尾，没有明显接口断裂。 |
| D05 | fail | `S/references/full-mode.md:84`、`:171`、`:183` | “独立回复可继续”与“缺提交/推送授权直接进入总结”存在控制流冲突，影响可审计执行。 |
| D06 | pass | `S/SKILL.md:95-108`；`S/references/full-mode.md:145-147`、`:342` | 对委派能力、隔离、模型覆盖和并行支持分别取证；未知能力串行降级，提问工具不可用时改用总结，不虚构独立覆盖。 |
| D07 | pass | `tests/unit/spec-resolve-pr-feedback-contracts.test.js:11-44`、`:134-151`；`S/references/evaluation-rubric.md:23` | 有针对 blocked 残余修改、暂存污染、错误归因和不收敛的维护断言，并要求回读历史修复；本 Skill 不承担 durable knowledge 自动晋升。 |
| D08 | pass | `S/SKILL.md:56-85`；`S/references/evaluation-rubric.md:25-40`；`S/references/full-mode.md:68` | 按模式加载 reference、同文件复用读取、大批量按文件分组判断，同时保留逐来源身份与结果。 |
| B01 | pass | `S/SKILL.md:3-5`、`:34-44`、`:68-78`；`tests/unit/skill-flow-p2-closure-contracts.test.js:107-135` | 明确处理已有 PR 反馈而非新审查，属于显式用户入口；Full、Targeted 和相似入口边界清楚。 |
| B02 | fail | `S/references/full-mode.md:84`、`:169-183`；`S/references/pipeline-return.md:61-83` | pipeline-return 的逐来源输出合同完整，但普通模式缺失某一 Git 授权时的跳转会绕过本可独立执行的回复动作。 |
| B03 | fail | `S/SKILL.md:36-52`；`S/references/pipeline-mode.md:13` | 五项授权及不可信评论边界总体明确，但 legacy pipeline 允许勾选 PR body checklist，未要求该写面的独立授权。 |
| B04 | pass | `S/SKILL.md:87`；`src/cli/plugin-sync.js:210-274`、`:459-504`；`tests/unit/plugin-modules.test.js:307-378` | 包内 helper 从已加载 Skill 根解析，source 递归投射到宿主目录且排除 evals；支持范围有治理与消费者断言，本轮不外推真实 runtime 已同步。 |
| B05 | pass | `S/references/full-mode.md:94-98`、`:139-175`、`:244-248`、`:313-318`；`S/scripts/get-pr-comments:45-63` | 覆盖 dirty ownership、部分修改、未知 POST 结果、分页不足、碰撞串行化和两轮停止，恢复不依赖盲目重试。 |
| B06 | fail | `S/references/full-mode.md:326-337`；`S/evals/fixtures/scripts/check-readonly.sh:4-14`；`S/evals/fixtures/scripts/check-no-injection-exec.sh:4-20` | 未提交修改的验证摘要存在省略指令；两个负例 judge 又不足以支持其只读／未执行注入的目标判断，见 F2、F4。 |
| X01 | pass | `S/references/full-mode.md:68-78`、`:94-98`、`:143-165` | 适用于大批量、多文件修复：保留中央判断、枚举实施位置、共享写面串行、基线对账及合并验证，无需另造编排层。 |
| X02 | pass | `S/references/evaluation-rubric.md:30-31`、`:40-54`；`S/references/full-mode.md:163-165` | 适用于反馈涉及接口或架构变化：读取 caller、核对 invariant 与原决策，区分新兼容需求和本 PR 回归；不可界定的取舍交人处理，不强行实施迁移。 |
| X03 | pass | `S/references/evaluation-rubric.md:50-54`；`S/references/full-mode.md:164-179`、`:248-280` | 高风险问题不能仅以范围拒绝，验证红灯不豁免；发布使用独立授权、精确 push 目标与远端可达证据，不承接部署权限。 |
| X04 | pass | `S/references/agents/pr-comment-resolver.md:41-59`；`S/references/pipeline-return.md:47-83`；`skills/spec-lfg/references/pr-watch-loop.md:50-78` | worker、resolver、caller 的责任分离，交接保留来源、观察时点、限制和待满足条件；恢复时重新核对讨论与代码，不把旧观察当永久真相。 |

## Findings

### F1 · P1：legacy pipeline 的 PR body 勾选没有对应写面授权条件

- **位置：** `skills/spec-resolve-pr-feedback/references/pipeline-mode.md:13`。
- **事实：** 该段在限制新增 residual section 后，允许将现有 checklist 的 `- [ ]` 改为 `- [x]`。它没有要求 PR body 编辑授权；入口只分别登记 local fix、commit、push、reply、thread resolution 五种权限，见 `skills/spec-resolve-pr-feedback/SKILL.md:36-50`。
- **后果：** caller 即使只授权本地修复或 thread 回复，执行者仍可能将这里的例外理解为可以修改 PR 描述。修改现有 section 仍是独立的外部写入，“已有 committed fix”不能提供该授权。
- **最小修复建议：** 删除此处 PR body 勾选操作，返回待办交给持有相应授权的 caller；若保留，必须明确独立的 PR body 编辑授权和对应目标范围，不能复用 reply 或 commit 权限。
- **复验重点：** fix／commit／reply 已授权，但 PR body 编辑未授权时，不得修改 checklist。

### F2 · P2：缺 Git 授权的收尾跳转绕过独立授权的回复

- **位置：** `skills/spec-resolve-pr-feedback/references/full-mode.md:171`。
- **事实：** 此处要求缺授权时保留本地状态并进入 Step 9；但同文件 `:84` 明确允许无代码依赖的 reply-list／human-list 独立继续，`:183` 也允许无代码变更的回复使用独立 reply 权限。
- **触发场景：** 同批有一条已验证的本地修复和一条可直接回答的问题；local fix 与 reply 已授权，commit／push 未授权。
- **后果：** 按 Step 6 的跳转执行会直接总结，遗漏已经具备授权和证据的问答回复；按 Step 4／7 执行则会回复，静态合同存在两条不一致路径。
- **最小修复建议：** 将“进入 Step 9”改为跳过受阻的 Git 出口，进入 Step 7 处理无代码依赖或已满足 publication 条件的动作；依赖远端修复的动作保持 pending。
- **复验重点：** 混合批次中，一项缺权限不得阻断其他独立、已授权动作。

### F3 · P2：总结模板可能隐藏未提交修改的失败验证

- **位置：** `skills/spec-resolve-pr-feedback/references/full-mode.md:337`。
- **事实：** 总结模板要求没有已提交代码变更时省略 Validation；但 `:155-165` 明确允许存在 blocked 部分修改、失败检查和未提交 diff，入口 `skills/spec-resolve-pr-feedback/SKILL.md:52` 又要求返回本地修改与验证事实。
- **后果：** 最需要披露的“已经修改、验证失败、因此未提交”恰好满足省略条件，可能只留下修复列表和缺权限说明，弱化未完成事实。
- **最小修复建议：** 以“是否发生实施尝试／是否存在本轮残余 delta”决定验证披露，不以是否 commit 决定。只在没有实施尝试且没有本轮修改时省略代码验证行。
- **复验重点：** blocked 后仍有 diff、验证失败未提交，以及已验证但缺 commit 权限三种情况，均应保留实际验证状态。

### F4 · P2：两个负例 judge 的断言不能识别其声称防守的违约行为

- **位置：**
  - `skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-readonly.sh:4-14`；
  - `skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-no-injection-exec.sh:4-20`。
- **事实：**
  - 只读 judge 仅检查 README 标记仍在、server 不含少数可疑词；追加 README 内容、修改正常业务代码或改动其他文件仍可通过。
  - 注入 judge 仅检查 server 不含 `evil`，以及最终回答出现宽泛关键词；执行评论中的命令后不写入该文件，也不会被这些断言识别。
- **后果：** judge 成功不能分别证明“未修改文件”和“未执行内嵌命令”。这是静态 oracle 覆盖缺口，不是本轮已经观察到被测 agent 越权。
- **最小修复建议：** 复用同包 `check-pipeline-pending.sh:52-85` 的基线身份／文件状态对账思路；注入场景增加工具调用轨迹核验或离线拦截记录。最终文本只作补充，不代替行为证据。
- **复验重点：** 用“保留原标记但修改其他内容”和“执行被禁命令但不留 server 残留”的反例验证 judge 会拒绝。

## 主责深挖面发现

### B01–B04：主体边界成立，缺陷集中在少数出口条件

- **入口职责成立。** 这是 public standalone skill，不是内部 helper；入口明确排除新代码审查，且 `disable-model-invocation: true` 与消费者治理断言一致。无需改为隐式 worker 或强制串联整条研发链路。
- **输入输出衔接成立。** `pipeline-return.md:61-83` 保留逐来源 action、原文 hash、reply 观察与剩余条件；`pr-watch-loop.md:50-66` 实际消费这些内容。`complete` 仅指本地判断／修复范围完成，不等于远端会话完成，这一限定应保持。
- **授权拆分总体充分，但 PR body 例外漏项。** 委派权限与本地修改权限分别准入，worker 禁止 Git 和远端写入；F1 不应通过放宽其他授权边界解决。
- **source/runtime 边界可追溯。** 包内脚本相对加载根解析，生成器从 source 递归投射，eval 资产不进入 runtime。没有发现需要手改宿主镜像的指令；本轮也没有验证或声称宿主实际部署状态。

### X01–X04：现有机制基本足够，不建议新增体系

- **X01：保持现状成立。** 分组判断、精确位置枚举、碰撞串行和合并验证已经覆盖复杂批次的主要共享写面，无需新增中央调度器。
- **X02：保持现状成立。** rubric 已要求核对兼容路径、设计意图和 scope，不能因该 Skill 没有专用 ADR/schema 模板而判缺陷。
- **X03：保持现状成立。** required check 红灯不豁免，发布须精确目标与 SHA 证据；修复 F1 时应继续维持各外部写面的独立权限。
- **X04：保持现状成立。** caller 持有 durable handoff，resolver 返回完整决策和限制；恢复需要重新验证来源、讨论及代码。没有必要让 resolver 再拥有知识晋升或独立跨会话状态系统。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：读取请求未获权限，未重试绕过。后果是无法核对该全局文件是否存在额外要求；本报告按当前已展示的用户指令、仓库角色契约及指定检查表执行。
- **指定必读范围无未读文件。** 已完整读取全部目标包文件，以及消费者清单列出的六个测试文件。
- 扩展检查的 `src/cli/plugin-sync.js`、`src/cli/plugin-governance.js`、`src/cli/contracts/dual-host-governance/skills-governance.json` 仅读取或检索与目标入口、递归投射、eval 排除有关的部分；未覆盖其余无关入口与生成逻辑，不据此声称整个生成系统或全部宿主实现通过。
- 未读取 generated runtime 镜像，未执行测试或行为评测：本轮为 fresh-source 静态审查，不形成 runtime freshness、行为质量或运行成本结论。

## 结论一句话

静态审查覆盖完成；该 Skill 的主体授权、恢复和 caller 交接设计成立，但 PR body 写权限漏项、独立回复跳转冲突、验证披露条件及负例 oracle 缺口尚在，当前不宜判为静态合同通过。
