你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-prototype/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **D03**（R2 fail）： `skills/spec-prototype/scripts/light-webserver.js:146-154,241-249,283` | 停止操作会阻断身份未验证实例，但状态查询将其报告为 stopped，启动操作又可能绕过该状态创建另一实例，验证出口不一致。 |
- **D04**（R2 fail）： `skills/spec-prototype/references/build.md:19`；`skills/spec-prototype/references/write-back.md:3`；`skills/spec-prototype/SKILL.md:40` | 已有选择、调整及 owning plan 的交接约定，但缺少交接来源版本、新鲜度和限制的稳定保留要求。 |
- **B02**（R2 fail）： `skills/spec-prototype/references/build.md:15`；`skills/spec-prototype/scripts/light-webserver.js:39,179-187,192` | 构建约定要求每个问题使用子目录，但预览器只自动发现根下 `screens/` 的直接 HTML，目录布局和默认展示合同未接通。 |
- **B05**（R2 fail）： `skills/spec-prototype/scripts/light-webserver.js:146-154,235-249,258-260,283` | 身份验证失败与确实停止被状态查询合并，重新启动可能覆盖仍活跃实例的状态文件，破坏恢复及后续清理的可追踪性。 |
- **B06**（R2 fail）： `skills/spec-prototype/references/build.md:15`；`skills/spec-prototype/scripts/light-webserver.js:179-187`；`tests/integration/spec-prototype-human-journey.integration.test.js:26-45` | 当前消费测试只覆盖顶层单屏，未对账按问题分目录的构建交付，存在产物已生成但默认预览仍显示等待
- **X04**（R2 fail）： `skills/spec-prototype/references/build.md:19`；`skills/spec-prototype/references/write-back.md:3`；`skills/spec-prototype/references/preview.md:27` | 有决策保留和接收 owner，但交接没有要求绑定来源版本、体验版本与限制，临时产物可失效却缺少相应的新鲜度核对。 |

## R1 完整评审
# spec-prototype 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-prototype/SKILL.md:11; CHANGELOG.md:994 | 每条约束锚定具名失败模式（fake dimension、agent 视觉自判、无人值守），且有真实缺陷→修复→复验记录，未见过时或过度指导 |
| D02 | pass | skills/spec-prototype/references/craft-floor.md:5-7; references/preview.md:5-7 | 沉淀真实领域知识（WCAG 4.5:1/3:1 对比度、gitignore 尾斜杠探测语义、平台原生 tmpdir、代表性内容密度），非流程口号；脚本管确定性地板、LLM 管语义分工清晰 |
| D03 | pass | skills/spec-prototype/scripts/light-webserver.js:28-35; tests/integration/spec-prototype-human-journey.integration.test.js:59-106 | 确定性验证门在脚本内 fail-closed（loopback/owner/symlink/token）并被集成测试锁定；SKILL.md:44 明确“本地检查≠用户决策”，无语义判断冒充机械判定 |
| D04 | pass | skills/spec-brainstorm/references/handoff.md:7; skills/spec-plan/references/plan-handoff.md:11; references/write-back.md:3 | 双向衔接闭合：上游两个 handoff 显式路由并带 seed、入口路由图登记、下游 write-back 保留 owning artifact 且 decisions.md 字段与 SKILL.md:38/build.md:19 一致 |
| D05 | pass | skills/spec-prototype/SKILL.md:1-45 | 45 行入口 + 5 个短 reference，关键规则均可定位、无重复段落；仅存两处 P3 级软张力（见 F1/F2），不构成矛盾 |
| D06 | pass | skills/spec-prototype/references/build.md:9; SKILL.md:13; CHANGELOG.md:994 | 能力假设显式且诚实降级：图像生成不可用时 markup fallback 但“须诚实承载维度”、无人值守返回 blocked reason；CHANGELOG 记录双引擎（claude+codex）交叉测评 |
| D07 | pass | CHANGELOG.md:994; CHANGELOG.md:526 | 有问题→修订→复验链（discovery 路由缺陷：description+正文修复、paired ×3、codex 回归 2/2）及 required-read 补齐记录；decisions.md 复读规则（SKILL.md:40）提供失效重估机制 |
| D08 | pass | skills/spec-prototype/SKILL.md:11,17,40; references/scoping.md:7 | 按需分层加载明确（craft-floor 仅视觉、write-back 仅交接、scoping/build/preview 按阶段前置）；scoping.md:7 明令只读问题涉及的页面/组件、禁止全树扫描 |
| B01 | pass | skills/spec-prototype/SKILL.md:3; skills/using-spec-first/references/public-route-map.md:49; evals/cases/discovery-routes-out.yaml | 正向触发与四类负例（discovery 路由出、routine polish、生产实现、无人值守）均在 description 与正文声明，路由图登记，eval 覆盖负例 |
| B02 | pass | skills/spec-prototype/SKILL.md:4,44; references/{scoping,build,preview,craft-floor,write-back}.md | argument-hint（question/brainstorm/plan path）、Output 四要素（artifact path/decision state/next owner/limitations）与各 reference 内容一致，来源与 readiness 边界清楚 |
| B03 | pass | skills/spec-prototype/SKILL.md:25,36; references/preview.md:5; scripts/light-webserver.js:29 | awaiting-go-ahead 只补缺授权、discussion-only 不产生写权限、gitignore 追加仅在显式授权内、凭据不入文件/日志、非 loopback 绑定脚本层硬拒 |
| B04 | pass | src/cli/contracts/dual-host-governance/skills-governance.json:23; tests/unit/spec-prototype-contracts.test.js:9-24 | 真相源为 skills/spec-prototype/**，治理注册为 standalone_skill/dual_host/七宿主 skill；unit test 锁定受管文件集与“无兄弟目录 import”；本 worktree 无 runtime mirror 可漂移 |
| B05 | pass | skills/spec-prototype/scripts/light-webserver.js:235-238,249-250,258-267; references/preview.md:29-31 | 启动失败带 server.log 路径退出、identity 未验证时 blocked+reason_code+exit 2 且绝不向 PID 发信号、idle/owner-pid 双看门狗、start 幂等复用、手动刷新路径明确 |
| B06 | pass | tests/unit/spec-prototype-contracts.test.js:26-48; tests/integration/spec-prototype-human-journey.integration.test.js:25-133 | 合同字符串与服务器生命周期/安全行为均有确定性测试对账；evals 4 case 覆盖关键 gate 场景；仅 input-pack 消费者清单有遗漏（F4，非 skill 缺陷） |
| X01 | not-applicable | skills/spec-prototype/SKILL.md:26 | 交付物是单一 throwaway artifact，无多模块分解/共享写面/长任务编排承诺；规模取舍已由 scoping.md:13-16 的 narrow/wide 规则覆盖 |
| X02 | not-applicable | skills/spec-prototype/scripts/light-webserver.js:285 | 脚本 CLI（start/status/stop --root）与 state 文件格式仅被 preview.md 指引和本仓测试自消费，无对外 API/schema/版本承诺，无迁移回退义务 |
| X03 | pass | tests/integration/spec-prototype-human-journey.integration.test.js:40-43,59-106 | 风险面（路径穿越、symlink 逃逸、非 loopback、未验证活 PID）与集成测试逐项对账且 fail-closed，语义层禁止扩大 mutation scope（build.md:13） |
| X04 | pass | skills/spec-prototype/references/build.md:19; SKILL.md:40; references/write-back.md:3 | 跨会话交接完整：decisions.md 胶囊含问题/路径/winner/理由/被拒项/未落调整/开放问题，复读规则提供 freshness，write-back 保留 owner 决策与 prototype 证据且不复制 throwaway 代码 |

## Findings

**F1（P3 · D05）blocked 返回码适用范围有歧义** — `skills/spec-prototype/SKILL.md:13`
三个禁止条件（无人类可体验、问题未定义、无人值守/管线模式）共用一句 `return blocked-human-experience-required`，但阶段表把“问题无法圈定”路由到 `unresolved`（SKILL.md:23），eval `undefined-question-gate` 也期望先提问而非返回 blocked 码。按字面读，agent 可能在问题未定义时误报 `blocked-human-experience-required`，错报阻断原因。最小修复：拆分该句——blocked 码只挂人类可体验/无人值守两条件，未定义问题指向 entry→`unresolved` 路径。风险低（eval 与测试已锚定正确行为），属文案精度问题。

**F2（P3 · D05）run 目录命名两套口径** — `skills/spec-prototype/SKILL.md:35` vs `references/preview.md:18-21`
SKILL.md:35 把 run 目录写为 `.context/compound-engineering/ce-prototype/<date>-<slug>/`，而 SKILL.md:17 声明 preview reference 是 run root 的唯一认领者，其规范示例用 `mkdtempSync` 生成 `run-<random>` 前缀。两套命名不会同时成立；照 SKILL.md:35 字面执行会偏离规范创建代码。最小修复：将 SKILL.md:35 的 `<date>-<slug>` 对齐为 preview 的 `run-` 口径，或删去具体形状只留父路径。

**F3（P3 · B05）并发 `start` 存在有界孤儿服务器窗口** — `skills/spec-prototype/scripts/light-webserver.js:241-250`
两个 `start` 并发执行时都观测到无存活实例、各自 spawn detached server（各自 ephemeral port），pid/info 文件后写者胜出，先启动的 server 成为孤儿，直到 30 分钟 idle 看门狗或 owner-pid 死亡才退出（:235-238）。后果有界（同 root、loopback-only、CSP 受限），且看门狗是显式设计缓解。可保持现状成立；若要收紧，可在 spawn 后检测 pid 文件被他人覆盖时经 identity 端点请求孤儿自停。

**F4（P3 · 流程观察，非 skill 缺陷）消费者清单遗漏 unit 合同测试** — `input-packs/spec-prototype.consumers.txt:2`
清单只列 `tests/integration/spec-prototype-human-journey.integration.test.js`，但 `tests/unit/spec-prototype-contracts.test.js` 同样锁定该 skill 的合同字符串（blocked 码、decisions.md、127.0.0.1、instance identity 等）与文件集。本轮已补读，静态检查通过；建议登记方修订 pack 生成口径，否则后续批次可能漏掉该消费者的回归面。

## 主责深挖面发现

- **D01（去补丁化）**：全部硬规则均能指认其防御的真实失败——“不要伪造被测维度”（SKILL.md:11）对应 agent 用低保真敷衍视觉问题；“通过本地检查≠用户决策”（SKILL.md:44）对应 agent 把验收测试当人类拍板；“绝不删除保留的原型”（SKILL.md:35, build.md:15）对应清理误伤。CHANGELOG.md:994 证明其中 discovery 路由规则来自真实 codex 缺陷而非臆想。未发现互相矛盾或已过时的约束；唯一软张力即 F1/F2。
- **D02（领域知识）**：知识密度高于流程控制。preview.md:5 的 `check-ignore` 尾斜杠目录探测、:7 的逐段 ownership/symlink 检查与“不 chmod 修复”、build.md:7 的 fidelity 按问题类型定尺寸（状态题要够丰富可驱动、视觉题要够完整可判断）、craft-floor.md:5-7 的对比度阈值与“默认态截图不能验证交互”，都是可检验的项目约束而非通用最佳实践口号。
- **D03（验证门）**：确定性地板完全下沉脚本且 fail-closed（`ensureRoot`/`assertPrivateDirectory`/token 校验/identity 端点），正反例由集成测试覆盖（traversal→404、symlink→404、`0.0.0.0`→exit 1 带原因、伪造活 PID 的 stop→exit 2 + reason_code）；语义门（人类决策、问题圈定）诚实声明为 prose 约定并有 eval case 兜底，未发现“LLM 伪装执行过确定性校验”的文案。
- **D04（衔接）**：链路四边齐全——spec-brainstorm/handoff.md:7 与 spec-plan/plan-handoff.md:11 以“当前 brainstorm/plan 作 seed”路由进入；spec-prototype 侧 argument-hint 接受 brainstorm/plan path；decided 后交还 `spec-brainstorm`/`spec-plan`（SKILL.md:29,39）；write-back.md:3 规定写回 owning artifact 而非新建第三份笔记（SKILL.md:40 明令禁止）。`spec-proof`/外发禁令与两个上游 handoff 的"Do not offer Proof or any external upload"三方一致。
- **D05（紧凑性）**：入口 45 行承载 9 相位表 + 6 条边界 + 输出契约，无一段在 references 中重复展开；每条 reference 单一职责（scoping=问题、build=构建、preview=运行根+服务器、craft-floor=视觉底线、write-back=交接）。删减损失可指认：F1/F2 修复后不存在冗余候选。
- **D08（上下文效率）**：条件加载三分支明确（行为题不加载 craft-floor——SKILL.md:11；write-back 仅 handoff 时加载——SKILL.md:40；scoping/build/preview 按阶段前置——SKILL.md:17）；读库范围被 scoping.md:7 硬性限定为“问题触及的页面/组件/流程”，禁止全树扫描与架构摘要请求；无“用摘要替代必读原文”的指令。静态承诺层无浪费迹象。

## 未读文件

- `docs/validation/ce-localization/**`、`docs/validation/2026-08-19-ce-post-3-20-*.json/md` — 历史 ce-prototype→spec-prototype 本地化/裁决档案。理由：历史审查证据，非本轮静态合同裁决输入（D07 演化证据取自 CHANGELOG + 当前源码即可定位）。后果：无法逐条核对当年本地化裁决细节，不影响本轮 18 项裁决。
- `scripts/check-ce-upstream-reconciliation.cjs`、`scripts/generate-ce-localization-closeout.cjs` — 仅 grep 定位了 `ce-prototype → skills/spec-prototype/SKILL.md` 映射行（:1079）。理由：CI 对账辅助工具，且 unit test 已锁定 skill 文件集。后果：若 skill 文件改名而该映射未同步的破坏风险未逐行验证（低概率）。
- `docs/research/2026-09-24-*.json` — 目录架构 inventory 快照。理由：历史 inventory，非合同。后果：无。
- evals 的行为运行层（transcript、双引擎复跑）本轮未执行——按 S1 校准纪律属 S3 行为层，不作为静态裁决输入。

## 结论一句话

静态合同层全绿（16 pass / 2 有理由 not-applicable / 0 fail / 0 not-verified），spec-prototype 是一个边界清晰、知识密度高、确定性地板与语义判断分工正确的独立入口；仅存 4 条 P3（两处入口文案软张力、一个有看门狗兜底的并发孤儿服务器窗口、一条 input-pack 消费者清单遗漏），均不阻断。


## R2 完整评审
# spec-prototype 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-prototype/SKILL.md:9-13`；`skills/spec-prototype/references/craft-floor.md:3-7` | 指导围绕“不伪造待验证维度”和真人体验展开，视觉底线按问题适用，没有要求所有原型执行完整生产流程。 |
| D02 | pass | `skills/spec-prototype/references/scoping.md:7-16`；`skills/spec-prototype/references/build.md:7-15` | 提供原型特有的保真度、比较宽度、媒介选择及生产隔离判断依据，产品选择仍归人而非脚本。 |
| D03 | fail | `skills/spec-prototype/scripts/light-webserver.js:146-154,241-249,283` | 停止操作会阻断身份未验证实例，但状态查询将其报告为 stopped，启动操作又可能绕过该状态创建另一实例，验证出口不一致。 |
| D04 | fail | `skills/spec-prototype/references/build.md:19`；`skills/spec-prototype/references/write-back.md:3`；`skills/spec-prototype/SKILL.md:40` | 已有选择、调整及 owning plan 的交接约定，但缺少交接来源版本、新鲜度和限制的稳定保留要求。 |
| D05 | pass | `skills/spec-prototype/SKILL.md:15-44`；`skills/spec-prototype/references/scoping.md:18-22` | 入口、条件引用、运行阶段和出口职责可定位；阶段明确不是持久化状态机，重复主要用于守护关键边界。 |
| D06 | pass | `skills/spec-prototype/references/build.md:9,13`；`skills/spec-prototype/references/preview.md:3,27,31` | 不依赖特定模型专属能力；媒介不能表达待测维度、临时存储和身份验证能力不足时均有明确限制或阻断约定。 |
| D07 | pass | `skills/spec-prototype/evals/eval.yaml:13-22`；`skills/spec-prototype/evals/cases/go-ahead-before-build.yaml:3-6`；`tests/integration/spec-prototype-human-journey.integration.test.js:59-132` | 无自动知识晋升职责，维护依据体现为入口、授权和预览隔离的聚焦回归资产；不据此推断实际行为已经通过。 |
| D08 | pass | `skills/spec-prototype/SKILL.md:11,17,40`；`skills/spec-prototype/references/scoping.md:7` | 视觉底线、写回引用按条件加载，仓库读取限于相关页面或流程，并要求复用对话及已有决策。 |
| B01 | pass | `skills/spec-prototype/SKILL.md:3,13,39` | 正向触发、产品发现负例、无人值守阻断及生产实现排除明确，公开入口不冒充内部 helper。 |
| B02 | fail | `skills/spec-prototype/references/build.md:15`；`skills/spec-prototype/scripts/light-webserver.js:39,179-187,192` | 构建约定要求每个问题使用子目录，但预览器只自动发现根下 `screens/` 的直接 HTML，目录布局和默认展示合同未接通。 |
| B03 | pass | `skills/spec-prototype/SKILL.md:35-39`；`skills/spec-prototype/references/scoping.md:7,20`；`skills/spec-prototype/references/preview.md:5` | 讨论不授权构建或服务，已有明确授权不重复索取，委派和 `.gitignore` 扩权均要求当前授权，禁止凭据落入产物及交接。 |
| B04 | pass | `skills/spec-prototype/references/build.md:3,13`；`skills/spec-prototype/SKILL.md:35,39`；`tests/integration/spec-prototype-human-journey.integration.test.js:9,54` | 被审源码与测试均指向 `skills/`，原型输出与生产源码隔离，没有要求修改 generated runtime；本结论不包含实际宿主投射验证。 |
| B05 | fail | `skills/spec-prototype/scripts/light-webserver.js:146-154,235-249,258-260,283` | 身份验证失败与确实停止被状态查询合并，重新启动可能覆盖仍活跃实例的状态文件，破坏恢复及后续清理的可追踪性。 |
| B06 | fail | `skills/spec-prototype/references/build.md:15`；`skills/spec-prototype/scripts/light-webserver.js:179-187`；`tests/integration/spec-prototype-human-journey.integration.test.js:26-45` | 当前消费测试只覆盖顶层单屏，未对账按问题分目录的构建交付，存在产物已生成但默认预览仍显示等待页的静态路径。 |
| X01 | not-applicable | `skills/spec-prototype/references/scoping.md:3,16`；`skills/spec-prototype/references/build.md:13` | 职责是有界产品问题的隔离探索，不承担多模块生产实施、共享写面编排或长任务集成；耦合流程仅影响原型大小。 |
| X02 | not-applicable | `skills/spec-prototype/SKILL.md:13,39`；`skills/spec-prototype/references/write-back.md:3` | 不实施生产 API、架构或版本迁移，只把体验决策交给原 owning artifact，因此不要求本 Skill 自行维护迁移、ADR 或兼容性协议。 |
| X03 | pass | `skills/spec-prototype/references/preview.md:5-7,25,31`；`skills/spec-prototype/scripts/light-webserver.js:27-35,156-172,252-279` | 对自身实际承担的本地执行风险，定义目录隔离、回环绑定、路径包含检查及身份绑定停止；生产发布和回滚不在其职责内。 |
| X04 | fail | `skills/spec-prototype/references/build.md:19`；`skills/spec-prototype/references/write-back.md:3`；`skills/spec-prototype/references/preview.md:27` | 有决策保留和接收 owner，但交接没有要求绑定来源版本、体验版本与限制，临时产物可失效却缺少相应的新鲜度核对。 |

## Findings

### F1 · P1：问题子目录与预览器发现规则未接通

- **位置：** `skills/spec-prototype/references/build.md:15`；`skills/spec-prototype/scripts/light-webserver.js:39,179-187,192`。
- **事实：** 构建引用要求在唯一运行目录下按问题建立子目录；服务端将展示根固定为 `<RUN_DIR>/screens`，首页只枚举该目录的直接 `.html` 文件。源码没有说明如何把问题子目录映射到展示根或默认首页。
- **触发与后果：** 按问题组织为 `<RUN_DIR>/question-a/index.html` 时，文件在服务根之外；即使组织为 `<RUN_DIR>/screens/question-a/index.html`，首页仍不会递归发现它，默认 URL 会显示等待页。原型构建完成不等于真人能从返回的默认 URL 体验它。
- **最小修复建议：** 在构建及预览引用中统一一种目录布局和访问合同，例如明确使用 `screens/<question>/index.html` 并返回对应完整 URL；不必为此增加递归“最新页面”选择器。
- **覆盖缺口：** `tests/integration/spec-prototype-human-journey.integration.test.js:28-35` 仅创建并访问顶层 `screens/screen.html`，不能覆盖上述合同路径。

### F2 · P1：身份未验证的活跃实例可能被报告为停止，并被重新启动覆盖状态

- **位置：** `skills/spec-prototype/scripts/light-webserver.js:146-154,241-249,283`；相关清理位置为 `skills/spec-prototype/scripts/light-webserver.js:239`。
- **事实：** `runningInfo()` 对“PID 不活跃”和“PID 活跃但身份信息无效或身份端点不可验证”都返回 `null`。`status` 将两者统一输出为 `stopped`；`start()` 对后一种情况也继续创建新服务。相反，`stop()` 在 `skills/spec-prototype/scripts/light-webserver.js:258-260` 明确返回 blocked。
- **触发与后果：** 原服务仍存活，但身份文件损坏或身份查询暂时失败时，再次启动可能新建第二个服务，并覆盖同一组 PID/身份文件。旧服务随后退出还会无条件删除这些共享状态文件，导致新服务失去正常的状态查询和停止入口。
- **最小修复建议：** 将探测结果区分为“已停止／身份已确认运行／活跃但未验证”，让 `status` 和 `start` 对第三种结果保留 blocked；退出清理前核对状态文件仍属于当前实例。
- **覆盖缺口：** `tests/integration/spec-prototype-human-journey.integration.test.js:59-82` 只验证未确认身份时的 `stop`，没有验证同一状态下的 `status` 和 `start`。

### F3 · P2：决策交接没有稳定绑定来源与体验版本

- **位置：** `skills/spec-prototype/references/build.md:19`；`skills/spec-prototype/references/write-back.md:3`；`skills/spec-prototype/SKILL.md:40`。
- **事实：** 决策胶囊要求记录问题、路径、胜出方案、理由、调整和开放问题；写回要求保留 owning artifact 并添加原型证据。但没有要求保存相关来源引用及其版本、真人实际体验的产物版本、新鲜度或适用限制。
- **触发与后果：** 已体验页面后来修改、上游计划变化，或临时目录被系统清理后，下游仍可能读取旧选择，却不能判断它针对哪个来源和哪一版体验成立。仅要求“读取 `decisions.md`”不能完成该判断。
- **最小修复建议：** 在现有胶囊和写回约定中增加轻量字段：owning source 引用及版本/时间、实际体验版本、未体验调整、限制和重新确认条件。沿用现有文件，不新增状态库。
- **边界：** 这是静态交接合同缺口，不是要求原型承担生产实现验证或 durable knowledge 晋升。

## 主责深挖面发现

- **B01——保持现状成立。** `skills/spec-prototype/SKILL.md:13` 将方向发现与有界原型问题明确分开；`skills/spec-prototype/references/scoping.md:14` 允许在已命名问题内部比较多个机制，两者并不矛盾，不应把所有“多方向比较”都误判成产品发现。
- **B02——主要问题是产物路径，而非缺少统一 YAML。** 输入可来自当前对话、brainstorm 或 plan，输出为原型与人类决策，见 `skills/spec-prototype/references/scoping.md:7`、`skills/spec-prototype/SKILL.md:44`。合同基线没有定义 prototype 专属 schema；不应把主链路拟议字段和数量门槛强加给它。实际不一致见 F1。
- **B03——保持已有授权连续性。** `skills/spec-prototype/SKILL.md:36` 与 `skills/spec-prototype/references/scoping.md:20` 既阻止讨论变写入，也允许已有明确构建授权继续生效。`awaiting-go-ahead` 不等于每轮必须重新审批。
- **B04——未发现反向修 runtime 的指令。** 当前资产以 `skills/spec-prototype/` 为源码，临时原型与生产源码明确分离。本轮没有读取或修改宿主镜像，也不据源码静态结论宣称宿主投射已验证。
- **X01／X02——不扩张职责。** `skills/spec-prototype/references/build.md:13` 已要求隔离复现不足时向 owning workflow 披露限制，而非擅自启动全应用或扩大生产写入；无需增加生产任务编排、API 迁移协议。
- **X03——安全机制值得保留，但生命周期状态应补齐。** 回环绑定、CSP、路径包含检查及 token-bound stop 均有源码实现；F2 是同一生命周期内的状态分类不一致，不应以删除身份验证来“简化”。
- **X04——决策记录不等于完整交接证据。** 现有胶囊能保留人类选择，但 F3 表明它尚不能稳定回答“基于哪个来源、体验了哪一版、何时需要重验”。

以上裁决仅针对 `structure_contract`。已逐一读取 Skill 全部 14 个文件及消费者清单列出的集成测试；未运行测试、预览或行为评测，不以此作为 fail 理由，也不声明运行通过。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：读取调用未获权限，未读取。后果是无法核对该全局兼容入口中是否存在额外约束；不将其记为被审 Skill 缺陷。
- 指定 Skill 目录、检查表、合同基线、项目角色契约及消费者清单所列文件：**无未读项**。目录中没有 `templates/` 资产。

## 结论一句话

**静态审查不通过：入口、授权与生产隔离边界清楚，但问题目录到预览的交付合同、未验证活跃实例的恢复处理，以及决策交接的新鲜度仍存在可定位缺口。**


## 输出格式

每个维度一行：| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |。裁决词汇只用 pass / fail / not-applicable。最后一段「修复建议」：fail 成立的给最小可维护修复。语言：中文。先读源码再下结论。
