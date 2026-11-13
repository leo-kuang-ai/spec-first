# spec-sweep 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-sweep/SKILL.md:111,113；references/run.md:19,76 | 重约束均可回溯真实失败类（注入防伪 ref、exit-0≠成功、越权 dispatch、并发写、敏感泄漏），未见过时或互相抵消的补丁式指令 |
| D02 | pass | references/sources/slack.md:15,44；sources/github-issues.md:43-44；sources/email.md:11；scripts/analyze_riffrec_zip.py:37-41 | 三个 persona 编码了真实连接器领域知识（ts/updatedAt/Message-ID 游标语义、identity-scoped reaction、zip 炸弹上限），脚本拥有正确性判断、persona 只报事实的分工在双侧显式声明 |
| D03 | pass | scripts/sweep-state.py:429-434,484-485,517-524；references/state-schema.md:87；scripts/publish-final-state.py:113-131 | closed 证据形状、游标单调、lease 归属、发布读回、媒体准入均为脚本强制并有失败可见 reason_code；形状≠远程合并的边界诚实声明 |
| D04 | pass | skills/spec-lfg/references/plan-brief.md:8-16；skills/spec-plan/references/intake.md:47；references/run.md:89；references/plan-template.md:59 | `spec-lfg <plan>` 经显式路径被 spec-plan 就地 enrich（intake 规则 1 不限定 product_contract_source）；enriched 计划由 rotation check 整体归档避免写权冲突；config 键 ownership 在 spec-runtime-setup 双侧登记 |
| D05 | pass | skills/spec-sweep/SKILL.md:29-40；references/interview.md:9（矛盾点）；SKILL.md:111 vs run.md:76（重复点） | 结构分层清晰可定位，重复有界且当前一致；仅一处 fallback 措辞分歧与悬空 R28 标签（见 Findings F1/F2），均为非阻断 |
| D06 | pass | references/model-tiers.md:7-11；SKILL.md:40,82；scripts/run-python.sh:9-19；references/state-schema.md:173 | 能力假设按档位声明，dispatch/model override/锁能力/宿主预解析缺失时均有诚实降级（inline、serial、ERROR state-lock-unavailable、shell 兜底），不伪装支持 |
| D07 | pass | git log（b98f998c、6167f1c3 修复）；tests/unit/dispatch-authorization-matrix-contracts.test.js:553-554；specialized-skill-calibration-contracts.test.js:99-102 | 存在问题→修订→测试钉住的演化闭环（阻塞提问能力、停止条件、vendored 分析器 byte-identical 由 3 个 contract test 钉死） |
| D08 | pass | SKILL.md:27,101,105；run.md:3,87；state-schema.md:1-7 | 分阶段按需加载（run.md 仅 Phase 2 前、interview 仅首跑、model-tiers/subagent-template 仅 dispatch、plan-template 仅 2g）；仅 state-schema 全量前置阅读略重（F4） |
| B01 | pass | SKILL.md:4-5；src/cli/contracts/dual-host-governance/skills-governance.json:516-527；skills/using-spec-first/references/public-route-map.md:59 | `disable-model-invocation: true` + argument-hint 与 Phase 0 路由一致；route map 与 product-pulse/riffrec 分流清晰；media-analyzer persona 仅经 packet 内部分发 |
| B02 | pass | SKILL.md:46-53 ↔ references/subagent-template.md:21-38 ↔ scripts/analyze-sweep-media.py:30-72；SKILL.md:89-97 ↔ interview.md:158-167 ↔ tests/unit/low-findings-cleanup-contracts.test.js:41-58 | 入口/references/scripts/templates/消费者逐字段对账一致，设计意图（如 auto-discovery 排除 sweep 计划）可由 intake.md:48 文本证实 |
| B03 | pass | SKILL.md:42-73,23；subagent-template.md:41；sources/slack.md:49-55；analyze-sweep-media.py:66-73 | dispatch/Git 三权/转写外发全部 fail-closed 且「workflow 调用、config、凭据、自署 JSON 均不构成授权」在入口、模板、wrapper 三层重复闭环；材料内嵌指令在全部 persona 中显式降级为数据 |
| B04 | pass | analyze_riffrec_zip.py:9-11（owner/projection 声明）；tests/unit/remaining-script-defenses.test.js:75；skills-governance.json:516 | 真相源在 `skills/spec-sweep/`，vendored 副本由 byte-identical 测试强制；`__pycache__/*.pyc` 未被 git 跟踪，非 drift |
| B05 | pass | SKILL.md:113,119-122；run.md:19,58,64,72；state-schema.md:124-151；publish-final-state.py:115-128 | LOCKED/LEASE-LOST/CORRUPT/ERROR 停止类、发布不确定的重跑幂等恢复、needs_download→manual_stuck 三次梯子、scratch 失败不拖累 2f、中断分析器按 unknown egress 处理 |
| B06 | pass | tests/unit/sweep-state-safety.test.js、sweep-state-legacy-import.test.js、spec-sweep-final-publication.test.js:48-135、spec-sweep-media-admission.test.js；evals/cases/headless-first-run-stops.yaml | 需求→实现→验证可追溯（4 组专属测试 + 6 个跨切面 contract test + 1 个已提交 eval case）；skill 内建「报告≠结果证据」的披露纪律；行为/现场层薄为本轮范围外残余（见结论） |
| X01 | pass | SKILL.md:107；run.md:21-28；state-schema.md:142-151 | 2a-2i 顺序不变式、三拓扑分层的依赖顺序与恢复路径、共享分支 lease 的推进式协议 |
| X02 | pass | state-schema.md:41-55,187-190；sweep-state.py:288-299；interview.md:134-146 | schema_version 前后向兼容规则、版本不符 CORRUPT 不覆写、import-legacy 显式迁移路径含 source-map 防游标孤儿 |
| X03 | pass | SKILL.md:61-73；run.md:28；publish-final-state.py:70-71,113；spec-sweep-final-publication.test.js:57-101 | 高危面（源侧写、push）有风险-验证对账：三权 gate、非 force push、读回确认、搭车文件拒绝（candidate-scope-mismatch）均有测试 |
| X04 | pass | SKILL.md:123-125；plan-template.md:29-31,60-63；run.md:89-91；state-schema.md:26-31 | 跨会话滚动计划含 human-notes 保护区、R-ID 稳定、state 为生命周期权威记录、摘要+handoff 必发；归档保留决策痕迹（F6 观察） |

## Findings

**F1（P3·D05）阻塞提问工具缺失时的 setup fallback 两个文档方向相反。** 位置：`skills/spec-sweep/SKILL.md:29,40` vs `references/interview.md:9`。SKILL.md 规定「harness 无可用 blocking-question 工具时按 headless 行为」（首跑将报 `first run requires interactive setup` 停止），interview.md:9 却允许同一条件下「退回 chat 编号选项继续访谈」。后果：在无该工具的宿主上，fresh 执行者对首跑 setup 会做出不确定的选择（中止 vs chat 提问继续）；两个方向都安全（无越权写），但行为不可预测且与「interview is interactive only」的入口判定依赖同一条工具探测。最小修复：在 interview.md:9 将编号选项 fallback 限定为「会话中确有人类在场」，无工具且无人值守时显式引用 SKILL.md 的 fail-safe headless 规则。

**F2（P3·D05/D07）悬空引用 "R28"。** 位置：`references/agents/media-analyzer.md:44`（`## Privacy (R28)`）、`references/state-schema.md:97`。全仓检索到的 R28 均为其他 plan 的局部需求编号，与隐私规则无关；skill 内无定义。后果：fresh 读者无法解析该标识（规则正文本身内联完整，无行为影响）。最小修复：删除 R28 标签或加一行来源说明。

**F3（P3·D03）解包目录媒体绕过 wrapper 的确定性准入。** 位置：`references/run.md:69`、`references/agents/media-analyzer.md:23` vs `scripts/analyze-sweep-media.py:35-64`。文件型媒体经 wrapper 强制 scratch 属主/权限/symlink/nlink/hash 冻结检查；目录型按文档走「bounded local-only pass through the bundled analyzer」直接调用 `analyze_riffrec_zip.py`，上述确定性检查全部不适用，仅靠 prose 约束输出位置。后果：同类不可信内容的脚本级隔离不对称；外发底线仍成立（analyzer 默认 `transcribe=False` 且需显式 `--transcribe`，analyze_riffrec_zip.py:97,1372-1376），残余风险限于输出面纪律。最小修复：run.md:69 显式要求目录 pass 带 `--no-transcribe` 且 output-dir 在私有 scratch root 内，或扩展 wrapper 只读接纳目录。

**F4（P3·D08）state-schema 全量前置阅读对非共享模式过重。** 位置：`SKILL.md:19`（"Read references/state-schema.md … before touching state"）+ `state-schema.md:214-218`（Final shared publication 一节仅 shared 拓扑需要）。后果：单机默认拓扑运行也要读 219 行中约 30 行不适用的发布协议；代价小、非错误。保持现状可接受，若改可在 SKILL.md 标注「shared 拓扑另读末节」。

**F5（P3·D05）fix-ref 形状校验规则无测试钉住。** 位置：`SKILL.md:111`、`run.md:76`（`#?\d+` / `[0-9a-f]{7,40}`）。该注入防线在两处 prose 重复且当前一致，但全仓无 contract test 钉住任一副本（grep `bare PR number`/`validated-number` 无命中），漂移会静默削弱防线。最小修复：仿 dispatch-authorization-matrix 的做法在 contract test 中钉住两处措辞。

**F6（观察·X04，保持现状成立）rotation 后 Human Notes 不随新计划延续。** 位置：`run.md:89`。enriched 计划（含人类笔记）整体归档到 dated sibling，新计划从模板重建空笔记区。设计上所有权已转移给 spec-plan，归档件保全内容；可考虑在新计划加一行指向归档 sibling，非必须。

**F7（观察·D02，保持现状成立）GitHub persona 的 `existing_ack` 与 Slack 的 identity-scoped 口径差异。** 位置：`sources/github-issues.md:15` vs `sources/slack.md:15`、`SKILL.md:109`。GitHub 侧把人类偶然打上同名 label 也计为 ack 信号（同时记录 actor 供 orchestrator 判断），Slack 侧严格要求配置 bot 身份。差异是文档化的刻意选择（label 在源上存在即「已见」语义成立），保持现状成立。

## 主责深挖面发现（D01-D05 + D08 补充）

- **D01/D02 交叉**：dispatch/Git/转写三层授权块（SKILL.md:42-73）不是模板套话——每个 YAML 字段都有消费点（run.md 2b/2e、model-tiers 降级、publish-final-state 的 `--branch-authorized/--landing-authorized` 承接），且被 `dispatch-authorization-matrix-contracts.test.js:553-554` 反向钉住，属「有依据的重」，不是补丁堆叠。
- **D03 深挖确认的边界诚实性**：`state-schema.md:87`「Field shape does not prove remote merge」+ `run.md:60`「Engine existence/monotonic checks do not themselves enforce acknowledgement ordering; the orchestrator must preserve it」两处把确定性地板之上留给 LLM 的义务写明，未把语义判断伪装成机械判定。
- **D04 深挖确认的关键链条**：handoff 行 `spec-lfg docs/plans/feedback-sweep-plan.md`（SKILL.md:125）→ spec-lfg step 1 以 forwarded_arguments 传给 spec-plan → intake.md:47 规则 1 对显式路径只要求 `artifact_contract: spec-unified-plan/v1`+`requirements-only`（不查 product_contract_source），sweep 计划恰好满足（plan-template.md:12,15）→ enrich 后 rotation check（run.md:89）把写权冲突转为归档+重建。链条静态闭合；同时 auto-discovery（intake.md:48 只认 `spec-brainstorm`）正确排除 sweep 计划被无关 planning 误绑定。
- **D05 深挖**：除 F1/F2/F5 外无其他矛盾；SKILL.md↔run.md 的分层（entrypoint 拥有 ordering/stop classes，run.md 复述执行细节）当前逐条一致（2a-2i 顺序、停止类、fix-ref regex 双侧比对无漂移）。
- **D08 深挖**：无条件必读集 = SKILL.md(127)+run.md(98)+state-schema(219) ≈ 444 行，对承担多源抓取/状态机/共享发布的 orchestrator 属合理；persona（3×约 60 行）与 packet/tier 文档全部条件加载。唯一可省的是 F4。

## 未读文件

- `skills/spec-sweep/scripts/analyze_riffrec_zip.py` 主体（1456 行，仅读头 80 行/尾 60 行/参数与 transcribe 区段）：vendored byte-identical 投射，canonical owner 为 spec-riffrec-feedback-analysis，一致性由三个 contract test 强制（specialized-skill-calibration:99-102、remaining-script-defenses:75、skill-flow-p2-closure:98-104）。未覆盖后果：帧抽取/moment 选择等分析内部逻辑未逐行审，但其准入与外发面已由 wrapper（analyze-sweep-media.py 全读）与测试覆盖。
- 消费者测试均只读断言承载区段（sweep-state-safety.test.js 前半、sweep-state-legacy-import.test.js 头部、spec-sweep-media-admission.test.js 前半、low-findings-cleanup 的 sweep 段 41-81）：其余部分与 spec-sweep 无关或为同类断言枚举，未覆盖后果可忽略。
- `docs/plans/.../core/05-optimization-dimensions-with-trends.md` 原文未读，D01-D08 判据以本评审指派的 REVIEW-EXECUTION-WORKFLOW.md 第 4 节表（声明按 core/05）为准；未覆盖后果：若两文档维度定义有出入，本表口径以指派检查表为准。

## 结论一句话

spec-sweep 是一个静态合同高度自洽、脚本强制与 LLM 判断边界清晰、验证与恢复面被多层测试钉住的高成熟度 Skill：18 项检查全部 pass，仅 5 条 P3 级措辞/钉住类 finding（F1-F5）与 2 条「保持现状成立」的观察（F6-F7），无阻断缺陷；行为层（仅 1 个已提交 eval case、本仓库无 dogfood 产物 `docs/plans/feedback-sweep-plan.md`）是本轮静态审查范围外的已披露残余。
