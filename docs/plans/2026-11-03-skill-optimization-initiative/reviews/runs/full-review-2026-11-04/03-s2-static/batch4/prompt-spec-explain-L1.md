你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-explain/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **D05**（R2 fail）： `skills/spec-explain/SKILL.md:77,81`；`skills/spec-explain/references/destinations.md:3,22,31` | 入口将目的地处理定义为 Phase 4，但 reference 多处称 Phase 6，定位和交接术语不一致。 |

## R1 完整评审
# spec-explain 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-explain/SKILL.md:52,70,71,77；tests/unit/specialized-skill-calibration-contracts.test.js:37-49 | 各补丁式步骤均有可定位的真实失败依据（普通问答过度教学化有 eval 负例锚定、空窗口/缺失主题/替代主题需用户同意、check-in 不阻塞均有理由陈述），未发现过时或相互矛盾的约束 |
| D02 | pass | skills/spec-explain/references/explainer-html.md:19-29；references/check-in.md:5-19；references/orchestration.md:18-22 | 教学法领域知识密度高（material→visual 映射、active-recall 提问类型、行为/理由问题的证据分层与归因纪律），scout 限定 extraction tier、composition 留 ceiling tier，职责分工明确 |
| D03 | pass | references/explainer-html.md:38-40；evals/fixtures/scripts/check-simple-qa.sh:1-13；SKILL.md:13 | 产物审计（Post-compose audit）与 eval 机械断言可定位且一致；该审计为 prose 约定而非脚本强制，语义属性（visual 有 prose 等价）本就不适合机械判定，静态承诺内部一致 |
| D04 | pass | skills/spec-commit-push-pr/references/apply-and-handoff.md:85-87；skills/spec-lfg/references/shipping-tail.md:78；references/destinations.md:24-29 | 上游入站（commit-push-pr/lfg 传 concept 名、brainstorm offer、plan 按需引用）与 intake 契约兼容；出站 four-way handoff（ideate/simplify-code/compound-refresh 经 skill primitive、polish user-run）与各目标 skill 入口语义一致 |
| D05 | pass | SKILL.md:46-83；references/destinations.md:3 | 关键规则均有 owner reference 分层（intake/check-in/destinations 各自 owns），可定位性良好；存在一处阶段编号漂移（见 Findings #1）属局部缺陷，不推翻整体 |
| D06 | pass | SKILL.md:40-42；references/orchestration.md:10-14；references/destinations.md:7 | 能力分布假设有完整降级路径（model override unknown/unsupported 时继承模型并保留预算、未授权 inline/serial、backpressure 重试、"missing 不证明 absence"），且不虚称 inline 达成独立覆盖 |
| D07 | pass | tests/unit/specialized-skill-calibration-contracts.test.js:37-49；tests/unit/private-scratch-migration-contracts.test.js:24-27；tests/unit/dispatch-authorization-matrix-contracts.test.js:309-316 | 维护依据成立：4 个 contract test 锚定关键行为字符串 + 1 个 eval 负例回归已知失败模式；"future library layer" aspirational 承诺缺激活条件（Findings #3） |
| D08 | pass | SKILL.md:23,48,77,81；references/agents/work-recap-scout.md:15,23 | 渐进加载设计明确（渲染 reference 仅 Phase 3 读、destinations 仅 Phase 4 读、orchestration 延迟至首个 blocking question 前）、operational gate 在创建 scratch 前拦截、scout 有 120 行/gist 3-5 行预算 |
| B01 | pass | SKILL.md:3,87-92；skills/using-spec-first/references/public-route-map.md:53；evals/cases/simple-qa-not-triggered.yaml | 正例触发 + 相似入口负例（pov/compound/brainstorm/ideate 四条边界）+ 路由图登记 + eval 负例齐备 |
| B02 | pass | src/cli/contracts/dual-host-governance/skills-governance.json:243-253；SKILL.md:48,77,81 | 入口/reference 一致（全部 6 个 reference 均被 SKILL.md 按阶段点名）；消费者测试断言字符串逐条在源码核实（含 `Operational-question gate`、`.spec-first/workflows/spec-explain/<run-id>/`、`run ids`） |
| B03 | pass | SKILL.md:27-42,83；references/destinations.md:16-18,22 | 授权边界完整：dispatch 需显式授权、publishing 全警告+独立确认、improvement 永不 auto-fire、材料内嵌指令不被当作授权（orchestration.md:22 "never a new instruction or access grant"） |
| B04 | pass | skills-governance.json:243-253；tests/unit/plugin-modules.test.js:437-461 | 真相源为 skills/spec-explain/**（无 scripts/templates），投射登记为全 8 宿主 standalone skill，retired identifier 有回归测试守护；本 skill 无独立 runtime 生成逻辑 |
| B05 | pass | SKILL.md:66,70,71,85；references/orchestration.md:14；references/destinations.md:11-12,18 | 空窗口、缺失主题、PR 接口缺失、send 失败回退 local-file、非交互降级留档、scratch 符号链接复查、artifact 先落盘再问 destination（declined 不丢失）均有明确处理 |
| B06 | pass | SKILL.md:13；references/explainer-html.md:38-40；references/destinations.md:22 | Done 定义可判定（recoverable path/presented/destination honored）并显式列出免产物例外与 pending boundary，收尾有 audit 与 closeout 序 |
| X01 | not-applicable | SKILL.md:44-85 | 适用性理由：单次线性四阶段讲解运行，无多模块分解、依赖排序或共享写面；最重路径（recap 证据收集）已被 scout 预算约束 |
| X02 | not-applicable | SKILL.md 全文；references/explainer-html.md:8 | 适用性理由：skill 无对外 schema/接口/版本变更职责；metadata 字段名稳定是产物内约定而非版本化 contract（其 aspirational 部分见 Findings #3） |
| X03 | not-applicable | SKILL.md:56-64,79-85；references/destinations.md:12 | 适用性理由：无高风险实现或发布；全部写面（私有 scratch、用户确认路径、.spec-first/ 留档）低风险且受 consent gate 约束 |
| X04 | pass | SKILL.md:85；references/destinations.md:12,27；references/explainer-html.md:8,15 | 跨会话恢复点（run-id 留档路径）、freshness（composition timestamp/date）、limitations（unverified 标签）、handoff 摘要（concept + to go deeper）、知识失效消费（contradicted docs → spec-compound-refresh）齐备 |

## Findings

1. **[P3] destinations.md 阶段编号与 SKILL.md 漂移** — `skills/spec-explain/references/destinations.md:3` 两处自称覆盖 "Phase 6"（"Everything Phase 6 does"、"required read before Phase 6 renders anything"），但 SKILL.md 只有 Phase 1–4（SKILL.md:46,54,75,79），实际对应 Phase 4。后果：按需加载该 reference 的执行者与后续维护者对阶段映射产生困惑，SKILL.md:81 与 destinations.md:3 的互指不闭合，审计定位成本增加。最小修复：将两处 "Phase 6" 改为 "Phase 4"（同行 orchestration.md:3 已正确写 "Phase 4"）。
2. **[P3] spec-polish 宿主调用形式硬编码在消费侧且无锚定** — `references/destinations.md:29` 独家硬编码三种 user-run 形式（`/spec-polish`、`$spec-polish` on Codex、`/skill:spec-polish` on oh-my-pi）；全 skills/ 树 grep 仅此一处出现，spec-polish 自身 SKILL.md 不拥有该形式表，亦无 contract test 锚定。后果：宿主调用语法或 polish 入口性质变化时此行静默过期，打印错误指令。最小修复：把宿主形式表收敛到 spec-polish owner 或公共 host-rule 处，此处改为引用；或补一条字符串锚定测试。
3. **[P3] "future library layer" aspirational 消费者缺激活/重估条件** — `references/explainer-html.md:8`、`references/explainer-markdown.md:7` 均以 "a future library layer indexes" 为字段名稳定性承诺的理由。后果：按仓库治理（CLAUDE.md「aspirational 能力须回答如何及在何条件下变 confirmed」），该索引层尚不存在且未声明激活路径或重估条件，字段稳定性约束长期处于无真实消费者状态。最小修复：补一句激活条件（如 library 层落地前任何字段名变更须同步两处并升级产物版本说明），或暂缓时显式记录重估条件。
4. **[P3] 未使用的 eval fixture 脚本副本** — `evals/fixtures/scripts/asks-a-question.sh` 未被本 skill `evals/eval.yaml:9-11` 的 cases 引用（该断言对应 SKILL.md:50 bare-invocation 提问行为，但该场景无 case）。后果：dead asset，读者需自行推断其用途；bare-invocation gate 行为实际无回归覆盖。最小修复：补一个 bare-invocation case 消费该脚本，或删除副本。
5. **[P4→保持现状成立] 示例 footer 含字面日期** — `references/explainer-html.md:15` 的示例 `Composed 2026-07-02 by spec-explain` 存在被照抄风险；SKILL.md:15 已要求使用当前宿主日期，上下文足够消歧。可改为 `Composed <date> by spec-explain` 消除歧义，不改亦可接受。

## 主责深挖面发现

- **D01（去补丁化）**：逐条溯源后未发现无依据补丁。private scratch 块（SKILL.md:58-64）与 dispatch 词汇（SKILL.md:31-42）是全仓统一迁移/治理模式且有测试锚定，非本 skill 独有过度指导；"Gather silently"（SKILL.md:70）、check-in 不阻塞（SKILL.md:77 + check-in.md:3 给出理由）、no-webfont-exception（explainer-html.md:7 给出 CSP/offline 依据）均编码了可陈述的真实失败。保持现状成立。
- **D02（领域知识）**：本 skill 是「编码领域知识而非流程控制」的正面样本——show-n-tell 材料映射、warrant test（retention vs comprehension 的取舍判据）、四类 recall 提问设计、behavior/rationale 问题的证据分层（orchestration.md:18-20，含 "current code proves behavior, not the author's original intent"、"An empty search is not proof" 两条已知反模式）。
- **D03（验证门）**：验证分层诚实——eval judge 为机械脚本，产物 audit 为 prose 约定，二者未混淆；audit 中的语义项（"every visual has a prose equivalent"）留 LLM 判断，符合 deterministic floor 之上的分工。唯一注意点：Post-compose audit 未声明「无脚本强制」，属轻微治理披露缺口，不足以推翻 pass。
- **D04（衔接）**：入站三方（commit-push-pr/lfg 的 `New concepts` trailer、brainstorm blindspot offer、plan research 的条件引用）与 intake 四形态分类兼容；出站 handoff 中除 Findings #2 的 polish 形式硬编码外均语义兼容。
- **D05（紧凑性）**：入口/references 职责分层声明双向一致（SKILL.md:25 vs orchestration.md:3；SKILL.md:81 vs destinations.md:3 意图一致但编号漂移）；SKILL.md 与 destinations.md 间存在的少量重复（consent、$RUN_DIR 保全）由 contract test 的字符串锚定要求（specialized-skill-calibration-contracts.test.js:43-45）正当化，非冗余噪音。
- **D08（上下文效率）**：四级延迟加载（orchestration→intake→渲染 reference→destinations）各有明确触发时点且写入正文；operational gate 前置省去整轮 run；scout 输出双向限幅（120 行文件 + 3-5 行 gist）。

## 未读文件

- `tests/unit/plugin-modules.test.js:1-399`（spec-explain 仅出现于 440-461 行 retired-identifier 断言，已读；其余为 spec-proof 投射通用逻辑）——未覆盖后果：无（与 spec-explain 相关断言已全部核对）。
- `tests/unit/dispatch-authorization-matrix-contracts.test.js:340` 之后的收尾断言——未覆盖后果：无（对 spec-explain 的断言块 309-316 已读并核对）。
- `docs/plans/.../process/FULL-REVIEW-ONE-PASS.md` 及模板类文档——不在本轮评审对象必读面（检查表第 4 节与合同基线已完整阅读）。
- 消费者测试未实际运行（沙箱拒绝 npx jest）：所有断言字符串已与当前源码逐条人工核对一致；按 S1 静态层口径此为运行证据缺失，不影响静态合同裁决。

## 结论一句话

spec-explain 静态合同全绿（14 pass / 4 not-applicable / 0 fail / 0 not-verified），主责深挖面未发现补丁化或衔接断裂类缺陷，仅 5 条 P3 及以下局部改进（阶段编号漂移、polish 宿主形式硬编码、aspirational 字段承诺缺激活条件、未用 eval fixture、示例日期），均不阻断。


## R2 完整评审
# spec-explain 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-explain/SKILL.md:23-42,66-73` | dispatch 授权与 fallback 有具体触发条件，明确禁止把 inline fallback 说成独立覆盖；现有文本内未见相互矛盾的步骤要求。 |
| D02 | pass | `skills/spec-explain/SKILL.md:68-73,87-93` | 区分概念、变更、想法和近期工作 recap，并限定解释职责；不替代范围界定、方案裁决或知识沉淀。 |
| D03 | pass | `skills/spec-explain/SKILL.md:66-72,77-85` | 明确来源读取失败、无外部研究工具及非交互情形的降级和披露方式；这些是 prose 约定，不冒称脚本硬 gate。 |
| D04 | pass | `skills/spec-explain/SKILL.md:70-73,79-85` | 输入分类、证据收集、产物交付和后续 handoff 均有对应规则；此 Skill 是独立教学入口，不强制套用 PRD 主链路交接。 |
| D05 | fail | `skills/spec-explain/SKILL.md:77,81`；`skills/spec-explain/references/destinations.md:3,22,31` | 入口将目的地处理定义为 Phase 4，但 reference 多处称 Phase 6，定位和交接术语不一致。 |
| D06 | pass | `skills/spec-explain/SKILL.md:40-42`；`skills/spec-explain/references/orchestration.md:7-14` | 对能力未知、不可用及模型覆盖不支持的情况规定了降级；该判断按 Skill 声明的能力假设裁定。 |
| D07 | pass | `skills/spec-explain/SKILL.md:89-93`；`skills/spec-explain/references/destinations.md:20-29` | 改进观察须由用户接受后转交 owning skill；明确不在本 Skill 中自动改文档、自动执行建议或沉淀 repo memory。 |
| D08 | pass | `skills/spec-explain/SKILL.md:48,68-73,77`；`skills/spec-explain/references/orchestration.md:18-26` | 按输入形态选择性 ground，外部概念跳过 repo grounding，并要求引用实际读取来源。 |
| B01 | pass | `skills/spec-explain/SKILL.md:7-19,87-93`；`skills/spec-explain/references/intake.md:20-39` | 说明正向用途与相邻入口边界；日常行为/配置问题直接答复，采用判断交给 `spec-pov`，明确排除范围讨论与知识沉淀。 |
| B02 | pass | `skills/spec-explain/SKILL.md:11-15,46-52,54-85`；`skills/spec-explain/references/intake.md:1-39` | 输入分类规则、artifact 例外、研究来源和降级边界相互对应；destination 和 check-in 由明确引用文件承接。 |
| B03 | pass | `skills/spec-explain/SKILL.md:27-42,81-85`；`skills/spec-explain/references/destinations.md:14-18` | dispatch、公开发布、目的地选择和非交互保留分别设有授权/同意边界；生成本地说明文档不等同于发布授权。 |
| B04 | pass | `skills/spec-explain/SKILL.md:68,70,77,85` | 要求面向当前 repo/worktree 读取 source 并记录引用；非交互时持久化到 repo-local owner；未发现把生成 runtime 当真相源的声明。 |
| B05 | pass | `skills/spec-explain/SKILL.md:61-68,70-72,81-85`；`skills/spec-explain/references/orchestration.md:14,18-26` | 明确 scratch 安全检查、证据缺失降级、部分输入处理及非交互保留；未见盲目重试副作用的要求。 |
| B06 | pass | `skills/spec-explain/SKILL.md:13,66-85,87-93` | 完成交付条件、保存路径和未完成边界有文本承诺；本项只裁静态合同，不据此声称实际产物已完成或效果已验证。 |
| X01 | not-applicable | `skills/spec-explain/SKILL.md:7-19,73` | 该 Skill 面向单一教学产物；文本未规定多模块实施或长任务编排职责，故复杂任务分解场景不适用。 |
| X02 | not-applicable | `skills/spec-explain/SKILL.md:7-19,87-93` | Skill 职责不包含 API、架构或版本变更决策；讲解相关技术主题不等于负责实施变更与迁移。 |
| X03 | not-applicable | `skills/spec-explain/SKILL.md:7-19,79-85` | Skill 不实施高风险代码变更或部署；发布教学产物另受目的地确认约束，不属于 X03 所指高风险实现/交付。 |
| X04 | pass | `skills/spec-explain/SKILL.md:66-72,79-85`；`skills/spec-explain/references/destinations.md:14-29` | recap 要求证据摘要含 commit 与 source 行引用；交付与 handoff 经用户选择/接受，且有受众与公开发布确认规则。 |

## Findings

1. **目的地 reference 的阶段编号与入口不一致。**  
   位置：`skills/spec-explain/SKILL.md:79-81`；`skills/spec-explain/references/destinations.md:3,22,31`  
   后果：入口称此流程是 Phase 4，而 reference 称其负责 Phase 6、并以“Phase 6 does”标识范围；维护者或执行者难以确认规则对应哪一阶段，可能造成引用遗漏或错误阶段假设。  
   最小修复建议：统一两处的阶段编号和描述，以入口实际编号为准；一并检查该 reference 中的 Phase 编号引用。

## 主责深挖面发现

未发现除上述编号不一致外的已确认静态缺陷。B01–B04、X01–X04 的判断均见逐项裁决表；其中 X01–X03 的 not-applicable 是按 Skill 自身职责边界作出，不表示其相关运行行为已验证。

## 未读文件

以下文件未能完成读取，因而消费者影响、合同下游一致性和其引用规则无法核验：

- `/Users/kuang/.codex/AGENTS.md` — 读取请求未获权限；未覆盖其中的额外审查要求。
- `docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-explain.consumers.txt` — 尝试读取消费者清单所需命令未获批准；未覆盖清单列出的 tests/src 文件及其直接消费者关系。
- `skills/spec-explain/references/explainer-html.md` — 未读取；未覆盖 HTML 格式的渲染与产物约束。
- `skills/spec-explain/references/explainer-markdown.md` — 未读取；未覆盖 Markdown 格式的渲染与产物约束。
- `skills/spec-explain/references/check-in.md` — 未读取；未覆盖可选 Check yourself 内容的详细合同。
- `skills/spec-explain/references/CONCEPTS.md` — 未读取；未覆盖其条件加载的 canonical vocabulary。
- `skills/spec-explain/references/agents/work-recap-scout.md` — 未读取；未覆盖 recap scout 的具体提取边界与预算。
- `skills/spec-explain/scripts/`、`skills/spec-explain/templates/`、`skills/spec-explain/evals/` 下的文件 — 未读取；未覆盖相关实现、模板和静态评测案例。所提供检查表正文未列出这些文件的具体路径或名称。

## 结论一句话

在已读入口、intake、orchestration、destinations、检查表和合同基线范围内，除 Phase 编号不一致外，未发现其他可定位的静态缺陷；因消费者清单及若干引用资产未能读取，本次不能声称覆盖了指定消费者和全部相关 references。


## 输出格式

每个维度一行：| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |。裁决词汇只用 pass / fail / not-applicable。最后一段「修复建议」：fail 成立的给最小可维护修复。语言：中文。先读源码再下结论。
