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
