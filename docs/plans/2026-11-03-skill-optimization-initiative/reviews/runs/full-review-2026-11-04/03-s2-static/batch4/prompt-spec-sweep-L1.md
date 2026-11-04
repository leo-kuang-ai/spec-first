你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-sweep/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **B02**（R2 fail）： `skills/spec-sweep/SKILL.md:90-97`; `skills/spec-sweep/references/interview.md:186-211` | 入口列出的 email 类型是 `email`，interview 却允许输入 `email-experimental`，且示例与配置合同要求存为 `email`；最小修复是把输入选项统一为 `email` 或明确规范化规则。 |

## R1 完整评审
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


## R2 完整评审
# spec-sweep 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-sweep/SKILL.md:19-23,42-59` | 唯一状态写入者、整轮不可信输入和独立授权边界均有明确用途，文本内部一致。 |
| D02 | pass | `skills/spec-sweep/SKILL.md:89-97,107-113` | 源类型、配置语义、cursor 与状态操作约束均具体，状态引擎与编排者职责有区分。 |
| D03 | pass | `skills/spec-sweep/SKILL.md:107-127`; `skills/spec-sweep/references/run.md:19-30` | 状态词、失败停止条件、read-back 和收尾要求明确；入口同时声明尝试命令不证明成功。 |
| D04 | pass | `skills/spec-sweep/SKILL.md:123-125`; `skills/spec-sweep/references/plan-template.md:33-63` | 输出稳定的 spec-lfg 计划路径，并定义输入项如何进入计划及关闭项如何移除。 |
| D05 | pass | `skills/spec-sweep/SKILL.md:19-23,42-73` | 入口职责和关键授权集中可定位；本轮静态证据未显示相互矛盾的重复规则。 |
| D06 | pass | `skills/spec-sweep/references/model-tiers.md:5-12`; `skills/spec-sweep/SKILL.md:44-59` | 模型覆盖能力未知时继承或 inline 降级，并将 worker 授权与敏感数据授权分开。 |
| D07 | pass | `skills/spec-sweep/SKILL.md:113-127`; `skills/spec-sweep/references/state-schema.md:76-103` | 闭合状态要求可定位的合并证据，敏感内容在写入时脱敏；本轮不据此声称实际效果已验证。 |
| D08 | pass | `skills/spec-sweep/SKILL.md:27-40,99-105` | 按阶段读取对应 reference，headless 与交互路径分开；入口给出了明确按需加载指引。 |
| B01 | pass | `skills/spec-sweep/SKILL.md:1-5,77-105` | 入口定位为反馈源清扫，首次配置与常规运行分流清楚；作为禁用模型自动调用的入口，不要求其承担通用路由职责。 |
| B02 | fail | `skills/spec-sweep/SKILL.md:90-97`; `skills/spec-sweep/references/interview.md:186-211` | 入口列出的 email 类型是 `email`，interview 却允许输入 `email-experimental`，且示例与配置合同要求存为 `email`；最小修复是把输入选项统一为 `email` 或明确规范化规则。 |
| B03 | pass | `skills/spec-sweep/SKILL.md:23,42-73`; `skills/spec-sweep/references/interview.md:59-79` | 内容、委派、转录外发、commit、分支变更和 landing 授权彼此分立；headless、配置与权限均未被当作授权来源。 |
| B04 | pass | `skills/spec-sweep/SKILL.md:19,79-82,101-105`; `skills/spec-sweep/references/state-schema.md:3-7` | 状态引擎是唯一状态写入者，入口指向 Skill 源目录脚本；没有声称生成 runtime 是真相源。 |
| B05 | pass | `skills/spec-sweep/SKILL.md:107-122`; `skills/spec-sweep/references/run.md:19-30,64-72,97` | 并发、状态损坏、lease 丢失、媒体失败及共享发布不确定均有停机、降级或恢复处理。 |
| B06 | pass | `skills/spec-sweep/SKILL.md:21,113-127` | 要求报告真实结果、失败操作、计划路径和发布状态，并明确报告或计划不证明外部副作用成功。 |
| X01 | not-applicable | `skills/spec-sweep/SKILL.md:17-21,75-127` | Skill 执行的是周期性反馈清扫与计划汇总，不是多模块软件实现或长任务分解；分阶段清扫流程本身不触发 X01。 |
| X02 | not-applicable | `skills/spec-sweep/SKILL.md:17-21,89-97` | 本入口不承担 API、架构或版本演进工作；配置字段是其既有输入合同，不代表本轮存在接口变更场景。 |
| X03 | not-applicable | `skills/spec-sweep/SKILL.md:42-73,107-127` | 当前审查对象是静态 Skill 合同，不包含高风险实现或交付；外部写入授权要求已在 B03 覆盖。 |
| X04 | pass | `skills/spec-sweep/SKILL.md:44-59,115-127`; `skills/spec-sweep/references/plan-template.md:27-31,51-63` | 委派边界、敏感内容限制、恢复证据和计划中的人类备注所有权均有明确规则。 |

## Findings

1. **邮件类型标识不一致** — `skills/spec-sweep/references/interview.md:26-30`、`skills/spec-sweep/references/interview.md:39-39`、`skills/spec-sweep/references/interview.md:208-211`、`skills/spec-sweep/SKILL.md:90-90`  
   interview 指示用户选 `email-experimental`，但存储枚举及入口均规定 `email`。照 interview 操作可能生成消费者无法识别的类型配置。最小修复：将交互选项改为 `email`，并保留“experimental”作为展示说明；或在写配置前明确规范化 `email-experimental` → `email`。

2. **未读消费者与实现文件使结论范围受限** — 消费者清单 `.../evidence/input-packs/spec-sweep.consumers.txt:2-15`  
   清单列出 14 个测试消费者，但本轮未读取这些文件，无法核实入口与消费者间的静态合同、状态引擎和发布/媒体脚本实现是否兑现文案承诺。此项不另列为 Skill 缺陷；最小补证是逐一读取消费者清单中的文件并对照入口承诺。

## 主责深挖面发现

- **B01 入口职责：** 范围清晰：处理已配置反馈源、首次设置、状态/计划维护和向 spec-lfg 的交接（`skills/spec-sweep/SKILL.md:17-21,77-105,123-125`）。`disable-model-invocation: true`（`skills/spec-sweep/SKILL.md:4`）与明确调用的入口形态相符；没有证据表明其自我暴露为通用入口。
- **B02 输入输出：** 主输入为 `.spec-first/config.local.yaml` 中的反馈源与 sweep 配置（`skills/spec-sweep/SKILL.md:82-97`），输出包括状态记录、滚动计划和实际结果摘要（`skills/spec-sweep/SKILL.md:115-127`）。发现 interview 邮件类型不一致，详见上方 Finding。
- **B03 授权与信任：** 当前用户/上游授权、source standing approval、敏感媒体转录授权、worker dispatch 授权、Git commit/branch/landing 授权各自独立；未把 schedule、headless、配置存在或 ambient credentials 当授权（`skills/spec-sweep/SKILL.md:23,42-73`）。这是清晰且内部一致的静态边界。
- **B04 source/runtime：** 明确将 Skill 同目录 `scripts/sweep-state.py` 设为状态唯一写入者（`skills/spec-sweep/SKILL.md:19`），执行指引要求以 Skill 目录设置 `SKILL_DIR`（`skills/spec-sweep/references/run.md:10-15`）。本轮没有读取所有实现和测试，故只确认文案合同可定位，不对实现一致性作扩大结论。
- **X01-X03：** 不适用于本次 Skill 职责，理由见逐项裁决表。
- **X04：** 具备有界委派和敏感信息限制，也为恢复保留 run/lease/candidate 证据（`skills/spec-sweep/SKILL.md:44-59,117-122`）；计划模板将人类备注区明确为人类所有，并禁止协调器读取/写入该区（`skills/spec-sweep/references/plan-template.md:27-31,59-60`）。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md` — 读取请求被权限拦截；未覆盖该用户级宿主指引。**未覆盖后果：**无法确认额外的 Codex/宿主执行规范。
- `skills/spec-sweep/references/agents/media-analyzer.md` — 未读取。**未覆盖后果：**媒体分析 persona 与入口/packet 的语义一致性未核验。
- `skills/spec-sweep/references/sources/github-issues.md`、`skills/spec-sweep/references/sources/email.md` — 未读取。**未覆盖后果：**GitHub 与 email connector 的字段映射、能力探测及授权处理未核验。
- `skills/spec-sweep/scripts/sweep-state.py`、`publish-final-state.py`、`analyze-sweep-media.py`、`analyze_riffrec_zip.py`、`run-python.sh` — 未读取。**未覆盖后果：**入口所述确定性约束、文件安全、发布验证、敏感数据处理及 Python 运行时保障未由实现确认。
- `skills/spec-sweep/evals/eval.yaml`、`skills/spec-sweep/evals/cases/headless-first-run-stops.yaml` 及相关 fixture 文件 — 未读取。**未覆盖后果：**静态 eval 声明与其夹具是否覆盖当前入口行为未核验。
- `skills/spec-sweep/templates/` — 目录不存在（枚举结果为无此路径）。**未覆盖后果：**没有独立 templates 子目录可供审查。
- `tests/unit/ce-localization-round-1-remediation-contracts.test.js`、`ce-upstream-skill-sync-contracts.test.js`、`dispatch-authorization-matrix-contracts.test.js`、`low-findings-cleanup-contracts.test.js`、`private-scratch-migration-contracts.test.js`、`python-runtime-resolution-contracts.test.js`、`remaining-script-defenses.test.js`、`skill-flow-p2-closure-contracts.test.js`、`spec-riffrec-feedback-analysis-contracts.test.js`、`spec-sweep-final-publication.test.js`、`spec-sweep-media-admission.test.js`、`specialized-skill-calibration-contracts.test.js`、`sweep-state-legacy-import.test.js`、`sweep-state-safety.test.js` — 均来自消费者清单，未读取。**未覆盖后果：**相关消费者合同、回归断言和实现防护未纳入本轮判断。
- `docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md` 第 4 节已读取；`docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md` 已读取。角色契约已读取。

## 结论一句话

静态入口合同整体边界明确，主要确认的问题是 interview 将邮件源写成与配置枚举不一致的 `email-experimental`；由于未读实现及消费者，结论限于已读源码的静态承诺，不代表端到端消费者一致性已核实。


## 输出格式

每个维度一行：| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |。裁决词汇只用 pass / fail / not-applicable。最后一段「修复建议」：fail 成立的给最小可维护修复。语言：中文。先读源码再下结论。
