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
