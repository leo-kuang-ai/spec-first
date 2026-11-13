你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-pov/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **B03**（R2 fail）： `skills/spec-pov/SKILL.md:21-35`；`skills/spec-pov/references/agents/external-evidence-researcher.md:7-20`；对照 `skills/spec-pov/references/agents/pov-peer.md:12-22` | dispatch 字段能记录授权，但外部研究者提示未像 POV peer 一样明确限定外发查询只能使用公开 subject te

## R1 完整评审
# spec-pov 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-pov/references/intake.md:11-13; references/invocation.md:12; references/cross-model-panel.md:33; scripts/peer-job-runner.py:177-182 | 每条硬约束都锚定真实失败模式（错框 grounding 全损、共识洗白、invocation 冒充授权），未见过时/矛盾补丁；休眠面板显式标注激活条件而非伪装可用 |
| D02 | pass | references/method.md:23-30; references/grounding.md:33; references/intake.md:55-61; references/agents/project-grounding-scout.md:27 | 沉淀的是裁决领域知识（双地板、provenance 分桶、可逆性分层、“存在即证据、文本为转述信号”），脚本管确定性生命周期、LLM 管语义裁决，分工正确 |
| D03 | pass | scripts/peer-job-runner.py:303-375; scripts/cross-model-pov.sh:156-201; tests/unit/review-peer-expansion-contracts.test.js:65-82; tests/unit/dispatch-authorization-matrix-contracts.test.js:533-539 | 确定性门（receipt/hash/allowlist）由脚本 fail-closed 且有零调用回归测试；语义地板（双地板）以命名失败结果形式为响亮约定，未被冒充为机械判定 |
| D04 | pass | skills/spec-brainstorm/references/verdict-routing.md:22; skills/spec-pov/references/invocation.md:12-23; references/followup.md:3-13; src/cli/lang-policy.js:123 | 上游（brainstorm 温启动交接“对话仅为假设”）与下游（四段 handoff 门+按形状路由）双向合同对齐，入口硬规则把外部裁决固定到本 Skill |
| D05 | pass | skills/spec-pov/SKILL.md:37-59; references/followup.md:1-15 | 入口 59 行、每个 reference 各管一段职责、关键规则均可定位；仅存两处 P3 级归属/措辞瑕疵（见 Findings 1、2），不构成 fail |
| D06 | pass | references/grounding.md:7-11; SKILL.md:17; references/intake.md:38; references/agents/external-evidence-researcher.md:7 | 分层按能力探测而非硬编码模型名，override 未证实即继承；跨宿主提问工具按能力匹配（含 Codex 选项上限适配）；web/无 dispatch 均有显式降级路径 |
| D07 | pass | evals/cases/r2-real-verdict-works.yaml:3-5; CHANGELOG.md:780,938; references/method.md:34 | 存在“缺陷→修复→防过度收紧复验”链（eval 正反例对）与 CHANGELOG 修订史；裁决词表固定以供下次 precedent 检索，失效条件（日期加权）内建 |
| D08 | pass | SKILL.md:41,45,49,53,57; references/method.md:60-65; references/agents/project-grounding-scout.md:25,34 | 按阶段渐进加载、条件加载（boundaries/panel/report 均按需）；dossier 只引用不重印、输出按 tier 限额；仅 eval 资产有一个未接线 fixture（P3） |
| B01 | pass | SKILL.md:3-4; references/boundaries.md:11-31; skills/using-spec-first/references/public-route-map.md:53 | 正向触发+三个相似入口负例写进 description，路由表覆盖 doc-review/ideate/brainstorm/strategy/debug 全部近邻；独立入口按需调用不串联 |
| B02 | pass | references/pov-schema.json:6-51; scripts/cross-model-pov.sh:122-146; references/cross-model-panel.md:21-31; scripts/cross-model-pov.sh:76-81 | schema 必填/枚举/additionalProperties 与脚本校验逐字段一致，panel 叙述的 reason_code 与 runner/sh 实际抛出一致，peer packet 字段三处吻合 |
| B03 | pass | SKILL.md:9,19-35; references/cross-model-panel.md:11-13; scripts/peer-job-runner.py:187-190,277-300; references/report.md:24 | 只读合同+dispatch 授权边界 YAML 记录+"invocation 不产生授权”；worker 环境白名单、秘密脱敏、外发需显式目的地与授权 |
| B04 | pass | src/cli/contracts/dual-host-governance/skills-governance.json:380-388; tests/unit/plugin-modules.test.js:459-490; tests/unit/peer-job-runner-parity.test.js:12-16（三副本 cmp 实测 IDENTICAL） | source 位于 skills/spec-pov 并登记 standalone_skill 双宿主；evals 不入 runtime 投射由测试钉住；runner 三副本字节一致由 parity 测试强制 |
| B05 | pass | references/grounding.md:3; scripts/peer-job-runner.py:1316-1354,1246-1311; references/cross-model-panel.md:19,31 | 启动失败一次纠正/容量排队/归零转 inline 的语义完整；runner 具备 idle/hard 窗口、字节上限、pid 复用守卫、僵尸感知分类与 reap 恢复 |
| B06 | pass | references/method.md:40-65; references/cross-model-panel.md:33,49; tests/unit/review-peer-expansion-contracts.test.js:40-63 | 交付物合同显式（固定词表+命名失败结果+按 tier 限额）；休眠能力、peers 运行披露、降级覆盖均有诚实声明并被合同测试钉住 |
| X01 | pass | scripts/peer-job-runner.py:2-8; references/cross-model-panel.md:31; references/grounding.md:3 | 长任务形态（分离 peer 作业）有完整分解：生命周期拆分使单次调用不跨 worker 运行时、共享截止时间 reap、终局单次归档 |
| X02 | pass | scripts/cross-model-pov.sh:77,168-173; scripts/peer-job-runner.py:114-121,310-361; references/cross-model-panel.md:33 | 接口均带 schema_version 并在入口校验；跨 skill 变更影响由 parity 测试+lockstep 规则约束，未来激活需重写的校验面已枚举 |
| X03 | not-applicable | SKILL.md:9; references/followup.md:3 | 本 Skill 无实现/部署/发布回滚面（只读裁决+可选本地 write-up），触发条件不成立；其真实高风险面（外发/凭据/收件人替换）已由 B03/B05 的 fail-closed 门覆盖 |
| X04 | pass | references/followup.md:3,13; references/grounding.md:29; references/invocation.md:12-23; references/cross-model-panel.md:49 | 跨会话/知识工作成立：温启动假设桶、spec-compound 可选捕获、docs/solutions precedent 消费与失效（日期加权）、handoff 新鲜度门、peers 披露规则齐备 |

## Findings

1. **P3｜归属错位：warm 规则的 owner 声明与文件内容不符**（skills/spec-pov/SKILL.md:57 vs references/followup.md 全文）。SKILL.md 称 followup.md "owns ... and warm-invocation guest rule"，但 followup.md 中 "warm" 出现 0 次；该规则实际在 SKILL.md:59、references/intake.md:47、references/invocation.md（guest output contract）。后果：执行者按所有权声明去 followup.md 查 warm 规则会落空；若日后裁剪 SKILL.md:59，规则失去可靠落点。最小修复：在 followup.md 补一行 warm carve-out，或把 SKILL.md:57 的归属措辞改指向 intake.md/invocation.md。
2. **P3｜负例路由措辞不一致：description 与 boundaries 对“理解类请求”给两个家**（SKILL.md:3 vs references/boundaries.md:13、references/intake.md:33）。frontmatter 写 "use spec-explain for understanding"，而 boundaries/intake 把中性 explainer 路由到"general research / 直接回答 / 深度研究工具”。后果：宿主描述层路由与 skill 内路由对同一意图给出不同目的地，“tell me about X” 有被推向重载 spec-explain 教学产物的轻微误路由风险。最小修复：description 措辞收窄为 "use spec-explain for a durable teaching artifact"（或对齐 boundaries 措辞）。
3. **P3｜未接线 eval fixture**（skills/spec-pov/evals/fixtures/scripts/asks-a-question.sh）。eval.yaml 与两个 case 均未引用它（case1 用 rule_based `output_contains`，case2 用 check-r2-verdict-given.sh；grep 全仓无 spec-pov 内引用）。后果：死资产带来维护/误导成本（后来者可能以为 gate 提问断言已接线）。最小修复：删除，或补一个引用它的 gate case。
4. **P3｜消费者测试覆盖缺口：spec-pov 的 scratch 纪律未被钉住**（tests/unit/private-scratch-migration-contracts.test.js:27 仅列 SKILL.md；实际纪律在 references/grounding.md:15-23）。该测试的联合断言（umask/mktemp/符号链接守卫）由其他 skill 的文件满足，spec-pov 自身的 grounding.md 若回归不会导致测试失败。后果：私有 scratch 纪律对该 skill 无回归保护。最小修复：为 grounding.md 增加一条聚焦断言（不动 32 基线计数）。
5. **观察（保持现状成立）｜休眠跨模型面板的持有成本**。cross-model-pov.sh（241 行）+ peer-job-runner.py（2273 行 ×3 字节一致副本）在 `SERVING_RECEIPT_PRODUCER_CHANNEL_ENABLED = False` 下任何 start 路径必然 fail-closed（peer-job-runner.py:182,368-375；cross-model-pov.sh:11-15），即当前永远无法真正启动 peer。成本：三副本 lockstep 维护。但源内已显式记录暂缓原因与重估条件（peer-job-runner.py:177-182、368-375、114-121）并诚实标注 dormant（cross-model-panel.md:33），拆分回退的裁决依据也在案——符合项目“显式记录为何暂缓及重估条件”的要求，保持现状成立。

## 主责深挖面发现

**D01（去补丁化）**：逐条核对硬约束与真实失败的对应关系——frame gate↔错框 grounding 全损（intake.md:11-13 用具体例子说明代价）、provenance 分桶↔温启动共识洗白（invocation.md:12）、dispatch 授权边界↔"invocation 即授权”旧补丁（dispatch-authorization-matrix-contracts.test.js:536 断言 "dispatch scouts, never inline" 已不存在且 "bounded inline" 在场，证明历史上的过度约束补丁已被移除并有回归钉住）。未发现相互矛盾约束；Tier-1 外部证据“按需”（grounding.md:29）与 adopt 的绝对外地板（method.md:19 "For adoption, retain both absolute floors"）经交叉引用消歧后一致。

**D02（领域知识）**：知识密度高且非流程口号——双地板的 PASS 形状给出可操作判据（命名 incumbent+touchpoint / 证实缺席+接入点 / 先前决策，method.md:27）；scout 侧“存在即证据、文本为转述信号”（project-grounding-scout.md:27）与“call site 证明调用而非保证”（method.md:21）是真实的裁决反模式知识。模型/脚本职责分界清晰：runner 只做确定性生命周期与信任校验，明确 “no scout decides the verdict"（grounding.md:11）。

**D03（验证门）**：双向核实——(a) 脚本确实强制的：authorization/serving receipt 的 SHA、schema_version、新鲜度、egress 四授权字段、payload hash（peer-job-runner.py:303-375），零参数 start 失败且不建 jobs root 有行为级测试（review-peer-expansion-contracts.test.js:65-82 实跑 spawnSync）；(b) prose 层未冒充机械判定：双地板以"命名失败结果"（Hold — insufficient project grounding / external evidence unavailable）表达，属 LLM 语义义务，与项目“缺 runtime 强制时降级为响亮约定并显式声明”的纪律一致。

**D04（衔接）**：核实了两条真实交接边。上游：spec-brainstorm verdict-routing.md:22 交接“帧而非结论、对话只作 hypotheses"，与 invocation.md:12-23 的温启动合同逐点对应（含"不因温启动升级 grade"）；入口硬规则（lang-policy.js:123）与 CLAUDE.md 治理一致。下游：followup.md 四段门（显式授权/非陈旧/范围内/非破坏）先于路由，subject-shape 路由表与 method.md Handoff 字段闭合。消费者清单 5 个测试的 spec-pov 相关断言已逐条对照当前源码字节验证成立。

**D05（紧凑性/可审计性）**：结构审计——入口 59 行，8 个 reference 各 15-65 行、单一职责且互不重叠（intake 管框定、grounding 管取证、method 管裁决合同、panel 管跨模型、followup 管收尾、report 管可选产物）；每条关键规则可定位（本轮所有裁决均给出 file:line）。瑕疵仅 Findings 1、2 两处 P3。

**D08（上下文效率）**：加载计划审计——5 个阶段必读各 1 个 reference + 3 个条件加载（boundaries 仅在 fit 不确定、panel 仅在有 summons、report 仅在用户要全文）；dossier “只引用不重印、永不打印进 chat”（method.md:60）；scout 预算 ~15 次读取、仅返回 3-5 行 gist（project-grounding-scout.md:25,34）；输出经济按 tier 定额并有“超预算即裁剪”的自检规则（method.md:65）。运行成本未测属 S3 层，不影响静态裁决。

## 未读文件

- tests/unit/plugin-modules.test.js 除 400-499 行外未读——其余断言其他 skill 的投射与退役 Proof 检查；`grep -n "spec-pov"` 仅命中 :442 一处且该段已读，无覆盖后果。
- docs/contracts/workflows/worker-dispatch-capability.md 未读全文——共享语义合同，非 spec-pov 专有；dispatch matrix 测试已断言其词表与 SKILL.md 一致（dispatch-authorization-matrix-contracts.test.js:381-401），本轮直接核对了 SKILL.md 内词表在场，后果可忽略。
- skills/spec-pov/scripts/__pycache__/peer-job-runner.cpython-312.pyc——git 未跟踪的本地构建残留（git ls-files 确认不在版本库），非评审对象。
- tests/helpers/brainstorm-contract.js、compound-contract.js——仅被 dispatch matrix 测试的 brainstorm/compound 包使用，spec-pov 包的 sources 只有 SKILL.md 单文件，无后果。

## 结论一句话

spec-pov 是一个合同自洽、证据分层诚实、领域知识密度高的裁决型 Skill：18 项检查 17 pass、1 项有理由 not-applicable，无阻断缺陷，仅 4 条 P3（warm 规则归属错位、description 负例措辞、死 fixture、scratch 纪律测试缺口）与 1 条“保持现状成立”的休眠面板观察，建议按 Findings 逐条做最小修复即可。


## R2 完整评审
# spec-pov 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据（file:line） | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-pov/SKILL.md:21-35`；`skills/spec-pov/references/grounding.md:7-13` | dispatch 授权与能力分开记录，并按任务所需能力降级，不把特定模型能力写成前提。 |
| D02 | pass | `skills/spec-pov/references/method.md:7-21`；`skills/spec-pov/references/boundaries.md:7-31` | 规则聚焦于 POV 的证据地板、裁决与路由边界，不替代用户目标判断或强制固定流程路径。 |
| D03 | pass | `skills/spec-pov/references/method.md:19-28`；`skills/spec-pov/references/grounding.md:31-33` | 明确区分项目证据与外部证据，并规定证据不足时阻断强结论、回源验证 provider 主张。 |
| D04 | pass | `skills/spec-pov/SKILL.md:41-57`；`skills/spec-pov/references/followup.md:3-13` | intake、grounding、验证、裁决和 follow-up 的职责衔接清楚；handoff 不扩大原请求授权。 |
| D05 | pass | `skills/spec-pov/references/method.md:60-65`；`skills/spec-pov/references/agents/project-grounding-scout.md:32-34` | 面向用户的输出与 scout dossier 均有紧凑约束，同时要求保留可追溯引用。 |
| D06 | pass | `skills/spec-pov/SKILL.md:21-35`；`skills/spec-pov/references/grounding.md:7-13` | 多模型 dispatch 被视为受授权和能力门控的可选机制；能力未知时有明确串行降级，不因本轮没有多模型运行而形成静态缺陷。 |
| D07 | pass | `skills/spec-pov/references/agents/precedent-activity-scout.md:12-21`；`skills/spec-pov/references/cross-model-panel.md:17-23` | 通过先查本地 precedent、标注来源日期以及明确 panel 激活前置条件，为维护和重评提供可执行依据；不要求技能自行构建经验效用自动化。 |
| D08 | pass | `skills/spec-pov/references/intake.md:17-21`；`skills/spec-pov/references/agents/project-grounding-scout.md:25-34` | 用一次轻量 orientation、按任务分层的 grounding 和受限 dossier 控制上下文投入。 |
| B01 | pass | `skills/spec-pov/SKILL.md:3-9`；`skills/spec-pov/references/boundaries.md:7-20` | 入口说明覆盖外部采用、文档方向和方案集判断，并明确与相邻入口的边界。 |
| B02 | pass | `skills/spec-pov/references/intake.md:27-43`；`skills/spec-pov/references/method.md:36-54` | 输入意图、裁决对象、候选集合及输出字段均有说明；候选集合要求冻结并逐项处置。 |
| B03 | fail | `skills/spec-pov/SKILL.md:21-35`；`skills/spec-pov/references/agents/external-evidence-researcher.md:7-20`；对照 `skills/spec-pov/references/agents/pov-peer.md:12-22` | dispatch 字段能记录授权，但外部研究者提示未像 POV peer 一样明确限定外发查询只能使用公开 subject terms，可能把含私有标识或敏感上下文的题目带到外部搜索/抓取。 |
| B04 | pass | `skills/spec-pov/references/grounding.md:27-33`；`skills/spec-pov/scripts/cross-model-pov.sh:180-185` | grounding 要求面向当前 worktree/source 回源，脚本按自身路径解析资产；没有将 generated runtime mirror 当作 source 的指示。 |
| B05 | pass | `skills/spec-pov/references/grounding.md:3-5,15-23`；`skills/spec-pov/scripts/peer-job-runner.py:177-182,303-378,1821-1833` | 预启动失败、scratch 隔离及 serving receipt 失败关闭均有边界；runner 在创建 job 目录前拒绝当前未验证的 producer channel。 |
| B06 | pass | `skills/spec-pov/references/method.md:36-65`；`skills/spec-pov/references/cross-model-panel.md:37-49` | 裁决、证据、限制和参与披露有明确要求；测试断言只能支持结构合同存在，不能据此声称行为或收益已验证。 |
| X01 | pass | `skills/spec-pov/references/intake.md:37-59`；`skills/spec-pov/references/grounding.md:3-13,25-31` | 对复杂题目提供按 tier 加深的研究预算、候选冻结和有界降级，符合 POV 任务范围；不要求技能接管实现任务分解。 |
| X02 | pass | `skills/spec-pov/references/agents/external-evidence-researcher.md:13-20`；`skills/spec-pov/references/agents/project-grounding-scout.md:17-21` | 外部与项目 grounding 均覆盖成熟度、迁移、兼容性或本地约定等采用判断所需信息。 |
| X03 | pass | `skills/spec-pov/references/method.md:14-28,56`；`skills/spec-pov/references/intake.md:57-59` | 高可逆性风险可提高研究深度；结果不足时限制结论或建议只读实验，不越权执行高风险实现。 |
| X04 | pass | `skills/spec-pov/references/cross-model-panel.md:3-11,37-49`；`skills/spec-pov/references/followup.md:3-13` | peers 明确为非投票证据，参与情况须披露；后续 handoff 受原授权、范围和动作性质约束。 |

## Findings

1. **B03 — 外部研究 payload 缺少明确的敏感信息最小化约束**  
   **位置：** `skills/spec-pov/references/agents/external-evidence-researcher.md:7-20`；对照 `skills/spec-pov/references/agents/pov-peer.md:12-22`。  
   **后果：** 当研究题目、候选方案或用户提供的背景包含内部标识、未公开计划或其他敏感内容时，当前外部研究者提示没有明确要求只用公开 subject terms 搜索，也没有明确禁止把仓库片段、内部路径或敏感标识带入外部查询；在发生外部搜索/抓取的调用中，可能造成超出研究必要范围的信息外发。入口的 dispatch 授权记录不足以替代这个 payload 层面的最小化约束。  
   **最小修复建议：** 在 external researcher prompt 中加入与 POV peer 相当的边界：查询只使用公开 subject terms；禁止发送仓库片段、私有路径、凭证、secrets 及非公开标识；证据不足时标记 unavailable，而非扩大外发范围。

没有其他经文本证据确认、同时满足“位置、后果、最小修复建议”要求的 findings。当前跨模型 serving producer channel 明确处于 fail-closed/degraded 状态并给出复评条件；这本身不构成合同缺陷。

## 主责深挖面发现

- **B01：** 入口与 boundaries 对 POV 的用途、相邻入口和越界方向有具体区分；保持现状成立。
- **B02：** intake 和 method 已规定候选集合、分级与输出字段。intake 的 Tier 1 描述与 method 中 Tier 2/3 reversal trigger 并非要求每种输入都使用同一组字段；没有足够依据认定为合同冲突。
- **B03：** 上述外部研究者 payload 约束缺口成立。
- **B04：** grounding 明确回到当前 source/worktree；脚本按自身路径解析资产。所列消费者测试也检查了 source 侧合同与投射边界，但这些静态断言不等同于生成结果或运行行为验证。
- **X01：** 复杂采用判断有 Tier 预算与有界 fallback；没有理由要求其负责实现型任务编排。
- **X02：** scout 指引涵盖兼容性、迁移、本地惯例及外部成熟度等判断维度；保持现状成立。
- **X03：** 风险由 tier 与证据地板管理，实验建议不授权执行；保持现状成立。
- **X04：** panel 非投票、summons 判别、参与披露和 handoff 边界均有表述；保持现状成立。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：尝试读取时权限请求被拒绝；未绕过或重试。其额外全局规则无法核对。
- `/private/tmp/spec-first-fr-wt/skills/spec-pov/evals/evals.json`：读取返回文件不存在；不能据此推断其他位置不存在 eval。
- `skills/spec-pov/` 的目录枚举未成功（`rg --files` 调用需要审批）；因此无法确认除已读入口、直接引用 references、已知脚本和 schema 之外，目录中是否还有未发现的文件。未将该覆盖限制单独判为 not-verified，因为它不是静态合同本身无法判断的理由；但本评审不能声称已证明目录文件全集已覆盖。
- 消费者清单所列五个测试文件均已读取；没有运行测试。未把“未运行”作为 fail 或 not-verified 依据。

## 结论一句话

**静态合同整体可采纳，但 B03 外部研究者的外发信息最小化边界应补齐；本结论仅针对已读取材料的 structure_contract，不代表运行行为、运行成本或现场收益已验证。**


## 输出格式

每个维度一行：| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |。裁决词汇只用 pass / fail / not-applicable。最后一段「修复建议」：fail 成立的给最小可维护修复。语言：中文。先读源码再下结论。
