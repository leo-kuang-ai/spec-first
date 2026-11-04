已通读全部四份 source 文件、四个 eval case、两类 JSON fixture、CLI validator（src/cli/task-pack.js）、消费者 contract 测试及 docs/validation 维护者证据。以下为评审结果。

# spec-write-tasks 评审（R3）

## 逐项裁决表

| ID | 裁决 | 证据（file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | SKILL.md:58-68、references/task-pack-schema.md:174 | 十条 Core Rules 均对应可指认的真实失败（hash 漂移、非活跃计划误编译、spec_id 误作身份、runtime mirror 误改），无过时约束；parity test（task-pack-schema.md:174）强制 schema 与 validator 同步，保留底线 |
| D02 | pass | references/task-quality-guide.md:34-45、86-122、184-195 | 提供真实领域知识：大 U-ID fan-out 规则、垂直切片/反馈环、assurance trace 无损投射、degraded helper 信号不可当 gate；脚本只判结构，拆分语义明确归 LLM（task-pack-schema.md:327） |
| D03 | pass | SKILL.md:113-118、references/execution-handoff-contract.md:53-82、src/cli/task-pack.js:370-381 | 🔴 GATE 要求 CLI JSON 证据才允许 deterministic_handoff:true，未跑 CLI 必须 validation:null；validator 只证 identity-freshness-structure（task-pack.js:408），语义充分性显式留给 LLM |
| D04 | pass | tests/unit/spec-work-intake-contracts.test.js:31-53、tests/unit/spec-doc-review-task-pack-contracts.test.js:72-92 | 下游 spec-work 重跑同一 validate 命令并钉住 receipt，spec-doc-review 消费 task_pack_outcome 全套字段；交接字段在消费者测试中有双向断言 |
| D05 | pass | SKILL.md:1-142、references/*.md（共 823 行） | 141 行入口 + 三份职责分离的 references（schema 结构/handoff envelope/质量写法），未检出重复或矛盾规则；SKILL.md:14-15 与 evals/README.md:15-16 的覆盖措辞不一致是例外（见 Findings F3） |
| D06 | pass | references/execution-handoff-contract.md:76、128、evals/eval.yaml:13-18 | 能力假设诚实：CLI 不可见时降级 draft-only 且禁止自报 handoff；hash 能力缺失时只允许非执行 draft；skill-up engine 声明 environment:none 并在 README:5 注明"配置通过只证明可加载" |
| D07 | pass | references/task-quality-guide.md:184-195、tests/unit/spec-write-tasks-contracts.test.js:61-70、docs/validation/spec-write-tasks/ | 修订链可定位：assurance-trace 投射、spec_id 降级为 compatibility trace、review_gate 缺省不收 required 均由真实失败驱动并有 contract test 钉住；docs/validation 有 fresh-source eval 与 scorecard 消费记录 |
| D08 | pass | SKILL.md:52、87、91、references/task-quality-guide.md:51-53 | 按需加载：Scenario Capability 默认矩阵 + Overrides none；references 按分支/编译场景点名读取；orientation intake 顺序明确"先 summary 再 inventory 再 focused sections" |
| B01 | pass | SKILL.md:2-4、18-24、agents/openai.yaml:7、evals/yao-trigger-cases.json | 正负触发面完整（正向拆任务/校验，负向实现请求、未决 scope、remote、小计划）；allow_implicit_invocation:false 防止误隐式触发；负例 fixture 覆盖负触发 |
| B02 | pass | references/execution-handoff-contract.md:12-38、tests/unit/spec-write-tasks-contracts.test.js:42-53 | envelope 字段、branch→输出映射、reason_code 枚举在 SKILL/references/消费者测试间一致；设计推断（schema 的"must not judge splitting quality"）显式标注边界 |
| B03 | pass | SKILL.md:71、130、references/execution-handoff-contract.md:90-99 | 只读/仅拆分请求不产生实施授权；高风险包需父 workflow 显式授权才继续 doc-review，单独触发该 skill 不构成 dispatch authority；--repo 不授权 mutation target（SKILL.md:66） |
| B04 | pass | SKILL.md:65、122-126、references/task-pack-schema.md:261-263、src/cli/task-pack.js:247-252 | source-of-truth 清晰；validator 确定性拒绝 .claude/**/.codex/**/.agents/skills/** 文件所有权；Portability Boundary 明确 evals/ 非 runtime 依赖 |
| B05 | pass | references/execution-handoff-contract.md:57、76、src/cli/task-pack.js:383-447、evals/failure-cases.json | 失败模式枚举化且各有降级路径（hash 工具缺失→draft-only、CLI 不可见→unverifiable_hash 降级、路径逃逸→invalid_contract）；非活跃计划、symlink 逃逸、CRLF/frontmatter 异常均 fail closed |
| B06 | pass | SKILL.md:46-48、87、references/task-quality-guide.md:17、tests/unit/spec-doc-review-task-pack-contracts.test.js:101-106 | 审查视角按风险选择（review_gate 语义、roster:full、lens）；pack 缺陷与 plan 决策缺口分派不同 owner（task-pack-regeneration-required→spec-write-tasks / source-plan-revision-required→spec-plan）；绿色 validator 不冒充语义充分 |
| X01 | pass | references/task-quality-guide.md:109-122、134-148、references/task-pack-schema.md:131-137、174 | 适用（核心职责即大计划拆分）：fan-out 以可独立验证反馈环为准而非单元长度；依赖必须真实输出依赖；同波文件重叠 validator 拒绝且备注不可豁免（task-pack-command.test.js:60-79） |
| X02 | pass | references/task-pack-schema.md:33-44、56、src/cli/task-pack.js:370-381 | schema_version task-pack/v1 固定；spec_id 迁移为 optional compatibility trace 且两侧不一致即 wrong_chain；字段增删由 parity test 强制双端同步；缺失 trace 降级为 limitation 而非拒绝 |
| X03 | pass | SKILL.md:120、references/execution-handoff-contract.md:84-99、evals/boundary-cases.json(high-risk-review-gate) | 高风险包走 review-task-pack 决定性建议 + 逐条件 fail-closed 的 bounded continuation；byte-preserving、output:json、roster:full 三约束与"Review complete 单独不是 handoff 证据"均有测试钉住 |
| X04 | pass | SKILL.md:36、references/task-pack-schema.md:329-352、references/task-quality-guide.md:197-213 | 交接 artifact 带 source_plan+hash（freshness）与 Regeneration Rules（失效条件）；审查 checklist 区分 deterministic 与语义项；reviewed-existing 必须带当前证据元数据，否则降级 unchecked-existing |

## Findings

| # | 位置 | 后果 | 最小修复 |
|---|---|---|---|
| F1 (P3) | skills/spec-write-tasks/SKILL.md:113-118、references/execution-handoff-contract.md:53-99 | 五个 🔴 GATE 全部为 prose 约定，无运行时强制器（无 hook、无 wrapper 校验 envelope）；按项目 gate 原则属"缺 runtime 强制能力时的响亮约定"。SKILL.md 未显式声明"未硬强制及原因"，合规度略低于 CLAUDE.md 降级声明要求，但 reference 已把伪造成本抬高（必须转录真实 CLI JSON） | 在 SKILL.md Final Decision Envelope 节加一行："本组 gate 为 prose 约定，无运行时强制器；违规只能由下游消费者（spec-work 重跑 validate）检出"。不改机制 |
| F2 (P3) | evals/output/cases.jsonl:1（`reason_code: task_pack_worthwhile`） | 记录输出中的 reason_code 不在现行 handoff 枚举（compile 成功应为 `task_pack_compiled`，execution-handoff-contract.md:14、40）。assertion 只查 `reason_code:` 前缀，drift 不会被现有断言捕获；evals/README.md:14-16 声明"expected 值必须来自 SKILL.md 枚举"，但覆盖检查只对 JSON fixture 生效，cases.jsonl 无枚举断言 | 将 cases.jsonl 的 `task_pack_worthwhile` 改为 `task_pack_compiled`，或在 run-output-evals.js 断言中加枚举校验 |
| F3 (P3) | evals/README.md:5、15-16 vs SKILL.md:14-15 | README 声称"每个 decision/每个 failure 至少一个 eval case"，但 eval.yaml 仅 4 个 case，仅覆盖 skip 倾向、non-active 拒绝、remote 拒绝、bare 请求询问；compile 成功、return-to-plan、draft-only、validate-only 无 skill-up 行为 case（draft-only 仅见于 expected-behavior-cases.json 静态 fixture，eval.yaml 不消费它）。README 未区分"静态 JSON fixture 覆盖"与"skill-up 引擎行为覆盖"，措辞会让维护者高估行为层覆盖 | README 把覆盖声明改为按 runner 分组："静态 JSON fixture 覆盖全部 decision/failure 枚举；skill-up 行为 case 当前仅 4 个，覆盖 X/Y/Z"；或补齐缺失分支的 skill-up case |
| F4 (P3) | evals/boundary-cases.json:36-53（high-risk-review-gate）| 该案 `expected_decision: compile` 且 `dispatch_authorization: missing`，但 `forbidden_signals` 包含 `auto-dispatch-without-authorization`；fixture 与 SKILL.md:120/handoff:88-99 一致、无错。唯一问题是该类高风险分支（authorized continuation、incomplete 停止）仅有静态 fixture，无行为证据；与 F3 同根因，不单列 | 合并入 F3 修复 |

## 主责深挖面发现（B05/B06 + 归因验证）

**B05 失败恢复隔离——机制存在且被测试触发，非"存在但未触发"。**

- 8 个 failure mode 枚举在 failure-cases.json 各有对应 case；validator 侧 `deriveValidity`/`deriveReasonCode`（src/cli/task-pack.js:356-381）对每个失败给出确定性 validity + reason_code，非 prose 模拟。
- 工具缺失类失败有明确降级而非盲目重试：CLI 不可见→`unverifiable_hash` + 降 draft-only（handoff:76）；hash 能力缺失→只允许非执行 draft 且禁止 `pending-tooling` 伪装（handoff:128）。evals/output/cases.jsonl 的 forbidden 断言钉住 `pending-tooling`。
- 部分成功/脏状态隔离：task-pack-command.test.js:60-79 证明同波重叠被拒、串行化后通过；task-pack.js:423-434 对路径逃逸与 symlink 逃逸 fail closed。
- 重复执行安全：身份为 `source-plan-path+body-hash`，重新 validate 是幂等只读；schema Regeneration Rules 列出 6 类触发重建条件。
- 未触发部分：eval.yaml 的 4 个行为 case 只覆盖拒绝类失败（remote、non-active）与询问类（bare）；compile 中途 CLI 失败、validate-only 遭遇 stale hash 的行为路径只有静态 fixture，无 skill-up 行为证据（归因：机制存在、行为覆盖缺口，属 F3）。

**B06 完整交付审查质量——机制存在且双向有测试，属强项。**

- 审查视角按变更选取：review_gate 语义（quality-guide:179）+ 高风险 roster:full + 独立 lens 文件（spec-doc-review task-pack-review-lens.md），消费者测试断言 lens 含 9 个任务字段与"deterministic 不冒充 semantic-fit"。
- finding 归 owner：pack 缺陷→spec-write-tasks、plan 决策缺口→spec-plan，正则断言（spec-doc-review-task-pack-contracts.test.js:101-106）。
- 误报防护：SKILL.md:133 禁止 review_gate 变批准态；handoff:97 规定 `Review complete` 单独不构成 handoff 证据，必须逐字段 fail-closed 校验 task_pack_outcome。
- 修复闭环：H05 类"修改后复验"由"rebuild on hash mismatch + 复跑 validate"承担；docs/validation/spec-write-tasks/downstream_consumer_outcome.md 是 2026-06-22 的真实 consumer evidence（绑定 source_revision 4d47b125，非当前 HEAD，属 maintainer 历史证据而非当前行为证据）。
- 归因结论：未发现"机制缺失"项；唯一缺口是行为层（skill-up）覆盖面窄于静态声明面，归因于 fixture 维护而非 skill 机制缺陷。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| evals/output/cases.jsonl 第 2 行（high-risk-review-handoff-smoke） | 已读第 1 行全部 + grep 全文确认结构；第 2 行 assertion 内容与 boundary-cases.json 高风险案重复 | 低：可能遗漏第 2 行内独有的 forbidden 值 |
| tests/unit/task-pack-command.test.js 余下 350 行 | 已读前 100 行 + 抽查 wave/overlap 关键段；其余为 target_repo、secret-denied 等路径细节用例 | 低：路径安全用例的完整清单未逐一核对，但 CLI 实现已直接读过 |
| src/cli/task-pack.js 450-700 行（frontmatter/spec_id 处理段） | 已读头 450 行与 700-995；中段为 metadata 解析与 spec_id 比对 | 低：spec_id wrong_chain 的具体判定行未定位，但 deriveReasonCode 与测试已覆盖语义 |
| skills/spec-work/references/work-intake-and-task-pack.md 全文 | 作为消费者已读关键行（grep 命中段），未全文通读；消费者详审属 spec-work 评审对象 | 中：spec-work 侧 intake 的完整措辞未核对，可能遗漏消费者侧 drift |
| docs/validation/spec-write-tasks/output_quality_scorecard.json、quality-score-contract.md | 维护者历史证据，不属 runtime 合同；README 已声明其为 maintainer evidence | 低：scorecard 数值未核验，本轮不采信其历史分数 |

## 结论一句话

spec-write-tasks 的合同层（D01-D08、B01-B06、X01-X04 全部 pass）结构完整、gate 语义清晰、与消费者双向有测试钉住，可静态通过；残余风险集中在行为层证据窄（skill-up 仅 4 case，compile/draft-only/validate-only 分支无行为覆盖）与三处低风险维护一致性（envelope gate 未声明 prose 降级、cases.jsonl reason_code 漂移、eval README 覆盖措辞高估），均为 P3 非阻断项。
