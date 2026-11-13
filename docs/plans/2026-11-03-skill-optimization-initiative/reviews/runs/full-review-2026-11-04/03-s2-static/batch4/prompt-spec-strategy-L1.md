你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-strategy/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **D01**（R2 fail）： `skills/spec-strategy/SKILL.md:71-73`；`skills/spec-strategy/references/strategy-template.md:92` | 两轮后接受未解决答案的出口，与固定指标/工作轨道数量检查缺少例外衔接。 |
- **D03**（R2 fail）： `skills/spec-strategy/references/strategy-template.md:83-93`；`skills/spec-strategy/evals/cases/targeted-update-metrics.yaml:3-6,19-22`；`skills/spec-strategy/evals/fixtures/scripts/asks-a-question.sh:17-23` | 存在 prose 检查清单，但定向更新评测
- **D05**（R2 fail）： `skills/spec-strategy/references/update-run.md:16`；`skills/spec-strategy/evals/cases/existing-asks-which-section.yaml:3-6`；`tests/unit/spec-strategy-contracts.test.js:21-28` | 更新范围的一句话内同时要求检查所有章节和不审其他章节，且评测说明仍允许已被入口合同排除的旧顺序。 |
- **B02**（R2 fail）： `skills/spec-strategy/SKILL.md:71-73`；`skills/spec-strategy/references/interview.md:10,150`；`skills/spec-strategy/references/strategy-template.md:92` | 输入可以在追问上限后保留不完整答案，但输出检查没有表示这种合法降级的方式。 |
- **B06**（R2 fail）： `skills/spec-strategy/evals/cases/update-reads-existing-doc.yaml:3-6,19-28`；`skills/spec-strategy/evals/cases/features-route-to-brainstorm.yaml:3-6,19-27` | 两个评测把“真实完整读取”或“不得写入”的目标简化为输出关键词，可能把关键违约结果判为成功。 |

## R1 完整评审
# spec-strategy 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-strategy/SKILL.md:24,38；evals/cases/features-route-to-brainstorm.yaml:19-27 | 每条干预对应可命名的真实失败（静默跳过提问、泛化拒绝），anti-pattern 话术是策略方法论而非模型补丁，无过时或互相矛盾的约束 |
| D02 | pass | skills/spec-strategy/references/interview.md:23-52,84-92；SKILL.md:18,94 | 全文编码 Rumelt kernel / JTBD / vanity metrics 等领域知识并注明设计依据；repo 只 grounding 不代答，模型与用户职责边界清晰 |
| D03 | pass | references/strategy-template.md:83-93；tests/unit/spec-strategy-contracts.test.js:10-84；evals/fixtures/scripts/check-owned-update.sh:96-97 | 写前 checklist 机械项（placeholder/计数/frontmatter）与语义项分列，合同测试锁定关键规则，outcome judge 做字节级断言，未把语义判断冒充机械判定 |
| D04 | pass | skills/spec-ideate/references/grounding.md:45,58；skills/spec-brainstorm/references/dialogue.md:13,15；skills/spec-plan/references/research.md:22 | 三个列举的下游均以 by-meaning 方式真实消费 STRATEGY.md，与生产者模板合同（headings/name/last_updated）匹配；枚举遗漏第四消费者见 Finding 1 |
| D05 | pass | SKILL.md:43-83；references/update-run.md:1-3 | 95 行入口、四个 reference 按阶段渐进必读，关键规则均可定位；唯一重复（update-run 必读在 SKILL.md:19 与 :77）是防跳读的防御性设计，保持现状成立 |
| D06 | pass | SKILL.md:24；references/grounding.md:3,11 | 提问工具缺失降级编号选项、reference 缺失上报不伪造、空仓走无 grounding 访谈，降级路径三处显式且诚实 |
| D07 | pass | git 04579c24（交叉测评 87.5→90.1 + paired 回归）、8ca4f2a9/b6bcb66b（CE 融合）；evals/cases/check-owned-update.yaml:4 | 存在失败→修订→复验链与固化负例（ce-u28-outcome-calibration.test.js:64 注入未授权 foreign-section 更新），维护依据充分 |
| D08 | pass | SKILL.md:30,57,73,77；references/grounding.md:9 | grounding→interview→template→update-run 四点按需加载，摘要强制命名来源，无全量预载 |
| B01 | pass | skills/using-spec-first/references/public-route-map.md:55；SKILL.md:38,85-90；src/cli/contracts/dual-host-governance/skills-governance.json:533 | 正向路由与 description 一致，相似入口负例（features→spec-brainstorm、vs spec-pov）有显式出口，standalone_skill 登记齐备 |
| B02 | fail | SKILL.md:11,81-83 vs skills/spec-product-pulse/references/strategy-source.md:5-8、tests/unit/spec-strategy-contracts.test.js:71-84 | SKILL.md 用括号穷举式声明下游为三技能，但 spec-product-pulse 逐字段消费同一 source 合同（name frontmatter、H1、metrics by meaning、delegation link）且被合同测试承认，枚举与仓库事实不一致 |
| B03 | pass | SKILL.md:73；references/update-run.md:12；references/grounding.md:20；evals/cases/check-owned-update.yaml:6 | 写入以当前显式授权为前提，不编辑非拥有文档、不删 legacy 文件，judge 显式声明 preparation 不授予 commit/landing 权限 |
| B04 | pass | skills-governance.json:533-544；tests/unit/plugin-modules.test.js:593-601 | source 真相源为 skills/spec-strategy/（无 scripts/templates），八宿主 skill 投射登记且有测试断言三个 reference 的投射，当前 worktree 干净无 drift |
| B05 | pass | SKILL.md:24,71；references/grounding.md:3,11；SKILL.md:41 | 工具缺失降级、材料缺失上报、空仓正常路径、两轮上限后如实捕获、rerun 幂等（in-place 更新）均有条款 |
| B06 | pass | evals/eval.yaml:13-28；evals/cases/*.yaml 六例含正负例；CHANGELOG.md:996 | 交付面有 eval 正/负例（含未授权写入负例）与带验证记录的 CHANGELOG 链，静态可追溯 |
| B01 备注 | — | — | （并入上行，不占独立行） |
| X01 | not-applicable | SKILL.md:11-20 | 单文档访谈技能：无多模块分解、无长任务编排、写入面仅 STRATEGY.md 一个文件，共享写面风险已由 multi-writer 保护覆盖 |
| X02 | not-applicable | references/strategy-template.md:11；spec-plan/references/research.md:22 | 无 API/schema 版本接口；frontmatter 是文档约定，消费者按 meaning 读取且不要求精确 headings，格式演化风险已被消费合同消解 |
| X03 | not-applicable | SKILL.md:85-90 | 无代码实现、无发布/回滚面；唯一写入面是单个策略文档且有 author-approved 保护，不属高风险实现 |
| X04 | pass | references/update-run.md:9-12（ownership）；strategy-template.md:11（freshness）；grounding.md:15-20（fold/link 决策交用户）；interview.md:148（拒绝保留为 Not working on） | 跨会话多写者场景的四要素——owner 边界、last_updated 新鲜度、决策保留、handoff 提示——均有可定位条款 |

（上表 B01 行的备注行为排版冗余，18 项实际裁决为 D01-D08、B01-B06、X01-X04 各一行，B01 裁决见首行 B01。）

## Findings

1. **[P3·B02/D04] 下游消费者枚举遗漏 spec-product-pulse**
   - 位置：`skills/spec-strategy/SKILL.md:11`（"Downstream skills (`spec-ideate`, `spec-brainstorm`, `spec-plan`) read it as grounding"）及 `SKILL.md:81-83`（Phase 3 handoff 同样只列三个）。
   - 后果：该括号穷举式声明会被维护者当作完整影响面清单。`skills/spec-product-pulse/references/strategy-source.md:5-8` 逐字段消费 STRATEGY.md（YAML `name`、H1 剥 ` Strategy` 后缀、Key metrics by meaning、delegation link 语义），且 `tests/unit/spec-strategy-contracts.test.js:71-84` 已把 pulse 明确定义为「consume the same current strategy source contract」。当 template 演化（如改 frontmatter 键或 metrics heading）时，按 SKILL.md 清单查影响面会漏掉最依赖格式细节的消费者（幸有该测试兜底，故降为 P3）；同时 Phase 3 的 next-step 建议永远不会把刚定稿的 metrics 导向 pulse。
   - 最小修复：SKILL.md:11 与 Phase 3 各加一次 `spec-product-pulse`（注明其只读、按 meaning 消费）。

2. **[P3·D05] 访谈顺序编号与 interview.md 节编号错位**
   - 位置：`SKILL.md:59-69`（顺序列表 1-9：第 6 项 Stress test、第 7 项 Not working on）vs `references/interview.md`（物理节序 1-5 同、6=Milestones、7=Not Working On、8=Marketing，Stress Test 在文末独立成节）。
   - 后果：仅可审计性噪音——两份文件各自内嵌了权威顺序说明（`interview.md:144`「After the first five sections, run the stress test, then capture Not working on」），语义无歧义，不产生错误行为。
   - 最小修复：interview.md 节标题加执行序注记（如「§6 Milestones（optional，在 Not working on 之后询问）」），或将 SKILL.md 列表去掉与节号的隐含对应；保持现状也可接受。

3. **[保持现状成立] update-run 必读要求双写**
   - 位置：`SKILL.md:19`（Boundaries）与 `SKILL.md:77`（Phase 2 开头）。
   - 判断：防御性重复（防跳读者直入 Phase 2），与 `spec-strategy-contracts.test.js:21-30` 的路由断言配合，删任一处损失防跳读冗余，无收益。不改。

4. **[保持现状成立] outcome case 为 JSON 风格、其余五例为 YAML 风格**
   - 位置：`evals/cases/check-owned-update.yaml`（JSON）vs 其余五例（YAML）。对照 `skills/spec-product-pulse/evals/cases/check-source-outcomes.yaml` 同为 JSON——这是 `scripts/evals/build-outcome-judges.cjs` 生成器的统一产物风格，JSON 亦是合法 YAML。非本 skill 的不一致，不改。

5. **[S3 提示，不计入本轮] eval 环境 `type: none` 的混源风险**
   - 位置：`evals/eval.yaml:3-4`。按 REVIEW-EXECUTION-WORKFLOW.md:203 提醒，非隔离引擎可能混入本机 runtime 副本；`check-owned-update.yaml:6` 的 prompt 要求「Read the current installed spec-strategy source」，行为层执行时需按 fresh-source checklist 核验加载来源。静态合同本身无可裁缺陷。

## 主责深挖面发现

**D01-D05 + D08 深挖结论：**

- **D01（去补丁化）**：逐段核对后未发现「为弥补模型能力而堆的流程补丁」。三处最像补丁的文本均有真实失败对应物：(a) `SKILL.md:24` Interaction Method 的 capability-matched blocking tool 匹配——对应「模型静默跳过提问」失败，有 `asks-a-question.sh` judge 与 git b98f998c 的 CE 来源记录；(b) `SKILL.md:38` 拒绝时点名目的地——对应 CHANGELOG:996 记录的真实缺陷（codex 泛化拒绝未点名 spec-brainstorm），修复有 paired 回归；(c) `SKILL.md:71` 两轮 pushback 上限——对应「访谈螺旋」失败模式。约束体系（3-5 metrics、2-4 tracks、1-3 句回答、五分钟阅读上限）全部可追溯到策略纪律论证（interview.md:82,102、strategy-template.md:8），无相互矛盾。
- **D02（领域知识）**：interview.md 是全仓技能中领域知识密度最高的文件之一——五个反模式类目下共 24 个具体 anti-pattern，每个带成型的 pushback 话术，且话术遵守「不泄漏反模式名称」的元规则（interview.md:14）。SKILL.md:94 的 Learn More 说明了 Rumelt kernel 的映射关系（diagnosis→Target problem、guiding policy→Our approach、coherent action→Tracks），设计依据可回源。
- **D03（验证门）**：验证门分三层且层级诚实——prose checklist（template:83-93）明确区分机械可查项与语义项（「Target problem and Our approach are connected」留给判断而非伪装成脚本）；合同测试锁定结构不变量；outcome judge（check-owned-update.sh:96-97）做单字节替换断言，将「只改目标句、author-approved section 与全部其他字节保留」变成机械可判定。这是「scripts enforce deterministic floor, LLM judges semantics」原则在纯 prose skill 上的正确落地。
- **D04（衔接）**：生产-消费合同双向核验通过——三个下游 references 均以「by meaning, without requiring exact headings + legacy PRODUCT/VISION fallback + 不覆盖 explicit authority」消费，与生产者的 template 承诺和 fold/link 委托语义（grounding.md:17-20）严丝合缝。唯一缺口是 Finding 1 的枚举遗漏。
- **D05（紧凑性）**：入口 95 行，热路径（Phase 0 三分支路由）在 47-53 行内完成；四个 reference 合计约 380 行但全部按阶段门控加载。无超过一个屏的未分段章节；关键规则（两轮上限、author protection、shape 判定）均有唯一权威位置（interview.md:10、update-run.md:9-12）。
- **D08（上下文效率）**：加载时序为严格渐进——Phase 0 前仅 grounding.md（30 行）、Phase 1 前仅 interview.md、成稿前才读 template、Phase 2 前才读 update-run；grounding 摘要限定「three to five lines，naming each source」（grounding.md:9），update 摘要同限 3-5 行（update-run.md:16）。无一次性全量预载，无要求摘放弃原文（update sequence 第 1 步要求 compare every section against repo model）。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| `skills/spec-product-pulse/` 除 strategy-source.md 外的文件（setup.md、report-template.md 等） | 仅作消费者证据取证，合同测试 :71-84 已断言其引用 strategy-source.md | 对 pulse 消费语义的判断基于 strategy-source.md 全文与测试断言，足以支撑 B02/D04 裁决；pulse 自身质量不在本轮范围 |
| `scripts/evals/build-outcome-judges.cjs`（judge 生成器） | 越出对象目录；产物头部已标注来源与「edit the source builder」 | 无法验证生成器与产物是否同步（若 fixture hash 变更需重生成）；风险为 eval 维护性，非 skill 合同缺陷 |
| `tests/unit/ce-u28-outcome-calibration.test.js` 全文 | 只按 grep 取 spec-strategy 相关行（:27、:64 负例注入） | u28 校准细节未逐行核；与本 skill 直接相关的行为（未授权写入负例）已见原文 |
| 各 eval 的运行 transcript | 本轮为 S1 静态盲评，不执行运行 | 行为质量与运行成本结论按批次约定留给 S3，不影响本轮静态裁决 |
| `docs/plans/.../process/FULL-REVIEW-ONE-PASS.md` | 批次执行方案而非被审材料，检查表已明示以 REVIEW-EXECUTION-WORKFLOW.md 第 4 节为准 | 无 |

另披露一项上游输入缺陷（非被审对象问题）：`spec-strategy.consumers.txt` 仅含标题行、未列任何文件，但 `tests/unit/` 下有 4 个文件直接引用 spec-strategy（spec-strategy-contracts.test.js、plugin-modules.test.js:593-601、ce-u28-outcome-calibration.test.js、project-graph-consumption-contracts.test.js:68）。本评审已按实际文件补齐核验；建议 run owner 修正 input-pack 生成逻辑，否则其他评审者若仅按清单取证会漏掉全部消费者证据。

## 结论一句话

spec-strategy 是一份领域知识密度高、加载时序克制、验证门分层诚实的上游技能：18 项中 15 pass、3 项条件性不适用、仅 B02 一项 fail（下游枚举遗漏 spec-product-pulse，P3、一行修复），静态合同层面无阻断缺陷。


## R2 完整评审
# spec-strategy 评审（R2）

## 逐项裁决表

本表仅裁决 `structure_contract` 静态合同，基于冻结版本 `5b59293bb1aecb40c4894549a89f8b045dfa40fe` 的当前源码；工作区读取时干净。消费者清单仅含标题、未列 tests/src 文件，因此额外检查了直接合同测试、入口投射登记及三个声明中的下游消费点。未运行行为评测，不据此扣减静态裁决，也不推断运行质量或收益。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | fail | `skills/spec-strategy/SKILL.md:71-73`；`skills/spec-strategy/references/strategy-template.md:92` | 两轮后接受未解决答案的出口，与固定指标/工作轨道数量检查缺少例外衔接。 |
| D02 | pass | `skills/spec-strategy/references/interview.md:17-112` | 提供问题诊断、指导性选择、用户情境、结果指标与投入领域的具体反模式，不让脚本代替战略判断。 |
| D03 | fail | `skills/spec-strategy/references/strategy-template.md:83-93`；`skills/spec-strategy/evals/cases/targeted-update-metrics.yaml:3-6,19-22`；`skills/spec-strategy/evals/fixtures/scripts/asks-a-question.sh:17-23` | 存在 prose 检查清单，但定向更新评测仅检查泛化问句，不能兑现其声明的定向性与保留其他内容核验。 |
| D04 | pass | `skills/spec-strategy/references/grounding.md:15-20`；`skills/spec-plan/references/research.md:22`；`skills/spec-ideate/references/grounding.md:58`；`skills/spec-brainstorm/references/dialogue.md:13-15` | 生产者与已检查消费者均采用 STRATEGY 优先、按含义消费、尊重实际来源与项目权威的约定。 |
| D05 | fail | `skills/spec-strategy/references/update-run.md:16`；`skills/spec-strategy/evals/cases/existing-asks-which-section.yaml:3-6`；`tests/unit/spec-strategy-contracts.test.js:21-28` | 更新范围的一句话内同时要求检查所有章节和不审其他章节，且评测说明仍允许已被入口合同排除的旧顺序。 |
| D06 | pass | `skills/spec-strategy/SKILL.md:24-26`；`skills/spec-strategy/references/grounding.md:3,11` | 不绑定特定模型能力；问答工具按能力发现，缺失或调用失败可退回聊天，空仓库有诚实降级路径。 |
| D07 | pass | `tests/unit/spec-strategy-contracts.test.js:21-84`；`skills/spec-strategy/evals/cases/check-owned-update.yaml:4-18` | 有针对更新顺序、作者保护、共享文档和实际字节结果的维护检查；不承担自动经验晋升职责。 |
| D08 | pass | `skills/spec-strategy/SKILL.md:30,57,73,77`；`skills/spec-strategy/references/grounding.md:5-11` | grounding 必读、首跑与更新按分支加载、模板在成稿时读取，并要求有限范围回源。 |
| B01 | pass | `skills/spec-strategy/SKILL.md:3,15-20,34,38,85-90` | 正向入口是创建/维护战略锚点；功能、排期、需求、实施、指标计算均有职责排除或明确去向。 |
| B02 | fail | `skills/spec-strategy/SKILL.md:71-73`；`skills/spec-strategy/references/interview.md:10,150`；`skills/spec-strategy/references/strategy-template.md:92` | 输入可以在追问上限后保留不完整答案，但输出检查没有表示这种合法降级的方式。 |
| B03 | pass | `skills/spec-strategy/SKILL.md:19,73`；`skills/spec-strategy/references/update-run.md:7-12,20`；`skills/spec-strategy/references/grounding.md:17-20` | 写入须在当前授权内，文件形状和 Git 历史不授予权限，保护作者批准内容及旧文件，不重复索取已覆盖的写入授权。 |
| B04 | pass | `src/cli/contracts/dual-host-governance/skills-governance.json:533-547`；`skills/spec-strategy/SKILL.md:11`；`skills/spec-strategy/evals/eval.yaml:3-11` | source 将其登记为 standalone skill，产物是项目 STRATEGY 而非宿主镜像；非隔离评测不能被当作 fresh-source 加载证明，本轮未作此声称。 |
| B05 | pass | `skills/spec-strategy/SKILL.md:24,41,71`；`skills/spec-strategy/references/grounding.md:3,11`；`skills/spec-strategy/references/update-run.md:7-21` | 对本地短访谈职责，已有工具失败回退、缺来源披露、追问上限、重跑分流和写前 diff/保护检查；不承担长任务隔离或后台重试。 |
| B06 | fail | `skills/spec-strategy/evals/cases/update-reads-existing-doc.yaml:3-6,19-28`；`skills/spec-strategy/evals/cases/features-route-to-brainstorm.yaml:3-6,19-27` | 两个评测把“真实完整读取”或“不得写入”的目标简化为输出关键词，可能把关键违约结果判为成功。 |
| X01 | not-applicable | `skills/spec-strategy/SKILL.md:17,38,85-89` | 本 Skill 只维护短战略锚点，不拥有复杂实现的模块分解、依赖编排或集成恢复；这些不能因战略影响面大而强加进来。 |
| X02 | not-applicable | `skills/spec-strategy/SKILL.md:17,85-89`；`skills/spec-strategy/references/grounding.md:15-20` | 不拥有 API、架构或版本迁移；其实际承担的旧战略文档整合已按保留旧源、fold/link 与冲突询问审查，不需新增 ADR/回滚机制。 |
| X03 | not-applicable | `skills/spec-strategy/SKILL.md:85-90`；`skills/spec-strategy/references/update-run.md:12` | 不实施、发布或部署高风险系统；本地共享文档修改的授权与作者保护已纳入 B03，不冒充交付验证。 |
| X04 | pass | `skills/spec-strategy/SKILL.md:11,79-83`；`skills/spec-strategy/references/grounding.md:9,17-20`；`skills/spec-strategy/references/update-run.md:7-12,21`；`skills/spec-ideate/references/grounding.md:58` | 有明确持久产物、内容 ownership、日期、旧源引用和下游回读路径；这是文档型协作交接，不声称构成独立验证或已晋升知识。 |

## Findings

### F1 · P2：追问上限后的合法降级与输出检查不一致

- **位置：** `skills/spec-strategy/SKILL.md:71-73`；`skills/spec-strategy/references/interview.md:10,150`；`skills/spec-strategy/references/strategy-template.md:92`。
- **事实：** 入口要求最多追问两轮，之后记录用户已有答案、不编造、不阻塞整个访谈；模板检查却无条件要求指标为 3–5 个、Tracks 为 2–4 个。
- **触发与后果：** 用户两轮后只确认两个指标或一个投入领域时，执行者无法同时满足两类要求，容易继续追问、补造条目，或无说明地跳过检查。
- **最小修复建议：** 在模板检查中区分“期望质量”与“可写入底线”；明确允许保留用户确认但未达期望数量的内容，并标注待重访。不得为凑数生成战略决定。
- **归属：** 入口/reference/template 的静态合同冲突，不是模型能力不足。

### F2 · P2：更新范围与评测说明存在顺序漂移

- **位置：** `skills/spec-strategy/references/update-run.md:16`；`skills/spec-strategy/evals/cases/existing-asks-which-section.yaml:3-6`；`tests/unit/spec-strategy-contracts.test.js:21-28`。
- **事实：**
  - 更新步骤同一句要求“compare every section”，随后又说“a targeted update does not review other sections”。
  - 评测说明允许 Phase 0 先问目标章节、摘要后置；当前入口与单测则要求先加载更新规则，再做摘要、漂移检查和提问。
- **触发与后果：** 定向更新时可能无谓审查全篇；维护者也可能按旧评测说明接受与当前入口相反的执行顺序。
- **最小修复建议：** 明确区分“全篇读取以保护原有内容”与“目标章节的语义漂移检查”，统一评测说明和当前入口顺序。

### F3 · P2：部分评测的成功判据弱于其声明目标

- **位置：**
  - `skills/spec-strategy/evals/cases/targeted-update-metrics.yaml:3-6,19-22`
  - `skills/spec-strategy/evals/fixtures/scripts/asks-a-question.sh:17-23`
  - `skills/spec-strategy/evals/cases/update-reads-existing-doc.yaml:3-6,19-28`
  - `skills/spec-strategy/evals/cases/features-route-to-brainstorm.yaml:3-6,19-27`
- **事实：**
  - 定向指标更新用例的 judge 只要求出现问号或通用索取词，不检查问题是否针对指标。
  - “真实读取现有文档”用例只检查两个词，不检查读取轨迹或完整摘要。
  - “不得把功能排期写入策略”用例只检查输出提及 `spec-brainstorm`，不检查文件是否被修改。
- **触发与后果：** 泛化提问、复述关键词，乃至先错误写入再建议正确入口，都可能满足成功判据。评测结果不能支持用例描述中的完整 claim。
- **最小修复建议：** 泛化问句检查保留为窄范围 smoke；定向性增加语义判定，禁止写入/保留内容增加实际字节或 diff 核验。读取轨迹无法可靠取得时，收缩用例声明，而非把关键词当作读取证明。
- **已有可复用机制：** `skills/spec-strategy/evals/fixtures/scripts/check-owned-update.sh:52-68,96-97` 已展示基线身份和精确字节差异核验，无需另建评测框架。

## 主责深挖面发现

### B01：入口职责成立，保持现状

`skills/spec-strategy/SKILL.md:34,38,85-90` 将 focus hint 限定为章节选择，并明确功能、排期和实施的其他 owner。策略中的 Tracks 与可选 Milestones 也不是偷偷扩张为任务计划：`references/interview.md:98-112,118-122` 分别约束为投入领域和真实外部里程碑。

**保持现状成立：** 不应强迫所有产品任务先经过 strategy，也不应把“改变 roadmap”的入口描述扩成自动排期权限。

### B02：产物与消费者基本匹配，缺口在降级表达

- 新产物为根目录 `STRATEGY.md`，消费者按含义而非固定标题读取，允许已有文件保留本来结构。
- fold/link 路径保留旧源、不删除旧文件，已检查消费者也支持必要时读取 legacy 内容。
- 不应将 `core/08-skill-contract-protocol.md:29-289` 的主链路拟议 YAML 套给 strategy：该文件未定义 strategy 专属 schema，执行检查表也明确禁止把拟议数量阈值直接视为现行合同（`process/REVIEW-EXECUTION-WORKFLOW.md:45,62`）。
- 实际应修的是 F1，而非新增统一 schema 或强制结构化 handoff 包。

### B03：ownership 分类不是授权，保护规则成立

`references/update-run.md:9-12` 的 solely-owned/multi-writer 是维护形状分类，不是“见到模板标题便获得改写权”。同段明确要求授权、保护非目标正文、禁止动 `author-approved` 内容；`references/grounding.md:17-20` 也不授权删除旧源。

**保持现状成立：** 不应因形状分类启发式本身，就断言存在越权。当前文本已有更高优先级的显式保护规则。相应承诺属于 LLM 执行约定，不能称为工具硬 gate。

### B04：源码身份清楚，常规宿主加载未被本轮验证

入口投射登记覆盖八个宿主，但本 Skill 使用能力匹配和聊天回退，没有宣称专属 API feature parity。`evals/eval.yaml:3-11` 使用 `environment: none` 和 `claude_code` 引擎，因此未来行为评测仍需单独证明实际加载来自哪一份 source/runtime。

**保持现状成立：** 本轮直接读取 worktree 源码，不调用被审 Skill 代替源码评审，也未修改 generated runtime；静态 pass 不外推八宿主实际行为通过。

### X01—X03：维持职责排除，不补建工程编排能力

复杂战略可以影响多模块、高风险实现和架构迁移，但 strategy 本身不拥有这些执行职责。现有边界允许下游根据战略作具体计划，而非让战略文档承载依赖图、测试矩阵、发布检查或回滚脚本。

**保持现状成立：** 这些扩展场景不构成新增 strategy 功能的依据。

### X04：文档型交接成立，勿提升为验证证据

持久根文档、更新日期、作者保护、旧源引用及消费者回读路径，足以支持其声明的战略 grounding 职责。`references/update-run.md:17` 还明确把近期活动视为漂移候选，而非战略变化的裁决。

**限制：** `last_updated` 是文档更新时间，不应被下游解释为每个章节均经重新确认；STRATEGY 是用户方向的记录，不是产品效果已验证的证明。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：读取请求返回尚未获授权；未绕过权限。后果是无法核对其中额外全局约束，不影响已读取的被审源码、检查表和合同基线定位。
- `skills/spec-ideate/references/grounding.md`：仅补读第 35–67 行的直接消费路径，其余未读；不覆盖 ideate 的完整研究、分发及产物合同。
- `skills/spec-brainstorm/references/dialogue.md`：仅补读第 1–26 行的策略消费与当前树校准路径，其余未读；不覆盖 brainstorm 全访谈行为。
- `skills/spec-plan/references/research.md`：仅补读第 1–90 行，其余未读；不覆盖后续外部研究和计划深化行为。
- `src/cli/contracts/dual-host-governance/skills-governance.json`：仅读取包含 strategy 的登记片段；未展开全部 generator/adapter，故不证明八宿主实际投射或 drift 状态。
- `tests/unit/plugin-modules.test.js`、`tests/unit/ce-u28-outcome-calibration.test.js`、`tests/unit/project-graph-consumption-contracts.test.js`：搜索发现关联后未展开；不对通用投射、跨 Skill judge 校准或 project-graph 行为作结论。
- `skills/spec-product-pulse/references/setup.md`、`skills/spec-product-pulse/references/report-template.md`、`skills/spec-product-pulse/references/strategy-source.md`：由已读合同测试发现的额外消费者，超出入口声明的三个消费者，本轮未展开；因此 D04/X04 的通过不覆盖 product-pulse 消费边。

**必读覆盖：** 被审 `SKILL.md`、全部四份 references、全部 eval 配置/用例/fixture/脚本，以及检查表和合同基线均已完整读取。指定消费者清单只有标题，无列出的 tests/src 文件。未运行测试或行为 eval，未写任何文件。

## 结论一句话

`spec-strategy` 的入口、授权、source/runtime 和文档型交接边界基本成立，但两处静态合同漂移及部分评测过度声明应修正；本轮静态审查完成，不支持宣称对象全项通过或实际收益已验证。


## 输出格式

每个维度一行：| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |。裁决词汇只用 pass / fail / not-applicable。最后一段「修复建议」：fail 成立的给最小可维护修复。语言：中文。先读源码再下结论。
