# spec-lfg 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | CHANGELOG.md:970；skills/spec-lfg/scripts/pr-watch-state.cjs:147-151；references/review-followup.md:57 | 约束密度高但逐条可回源到已记录真实失败（admission 宽缺陷实测、DR-003、validation_status 修复），未发现过时或互相矛盾的补丁式约束 |
| D02 | pass | pr-watch-state.cjs:343-377；review-followup.md:44-57；SKILL.md:15 | 脚本独占确定性事实（CAS 链、fingerprint），LLM 独占语义判断（finding 资格、admission），领域知识（授权语义、untrusted content、tracker 回退链）有真实来源非口号 |
| D03 | pass | references/work-return.md:28；references/stage-routing.md:63-77；references/review-followup.md:35-40 | 各阶段验证门显式且带命名 reason code；6.5 有确定性 fingerprint 等价 + 二次调用地板；语义判断未被冒充为机械判定（autofix_class 明示 advisory） |
| D04 | pass | SKILL.md:23-34；work-return.md:13-22 对照 skills/spec-work/references/return-to-caller.md:35-52；stage-routing.md:32-33 对照 spec-test-browser/references/pipeline-orchestration.md:9,22 | 上游字段级对账一致：work-return 22 字段 inventory 与生产者字段名逐一匹配，browser 消费字段与 wrapper 生产字段匹配，brainstorm 披露选项与 admission 要求（SKILL.md:11 ↔ handoff.md:62）对齐 |
| D05 | pass | SKILL.md 全文 81 行；tests/unit/spec-lfg-contracts.test.js:40-52；shipping-tail.md:44-49 | 入口紧凑、阶段细节已外迁并被测试锁定内容不回流；关键规则可定位；存在有意的安全不变量重复（见 Findings F4），无冲突 |
| D06 | pass | SKILL.md:21；references/task-visibility.md:3；references/shipping-tail.md:3-8；SKILL.md:15 | 宿主能力差异均有诚实降级路径：skill 名按宿主清单解析、无 task-tracking 不模拟、无 remote 转 local-only、独立审查不可用即停 |
| D07 | pass | CHANGELOG.md:970,339,481；evals/cases/implicit-request-blocks.yaml:5-7；evals/cases/r2-pipeline-hint-no-name.yaml:4-6 | 问题→修订→复验链完整（admission 双层加固、eval 安全事件沉淀守则、二轮对抗变体入册），决策知识带失效与重激活条件（pr-watch-loop.md:76） |
| D08 | pass | SKILL.md:38,62；shipping-tail.md:14,72-74；tests/unit/spec-lfg-contracts.test.js:47-49 | 严格按需加载：每阶段前读对应 reference，shipping-tail 仅 6.5 后读，tracker-defer/next-work-handoff 条件加载，入口测试锁定不含细节命令 |
| B01 | pass | SKILL.md:3,7-15；evals/cases/ready-code-not-authorization.yaml | 正向触发限定显式请求，"ship it" 负例有专门处置路径与 eval，无 admission 即停不扩大范围 |
| B02 | pass | SKILL.md:4；11 个消费者测试（consumers.txt 全列）；tests/helpers/lfg-contract.js:6-11 | 入口/reference/script/消费者四方一致，合同由 tests/unit/spec-lfg-contracts.test.js 等 11 文件锁定 |
| B03 | pass | SKILL.md:7-15；references/tracker-defer.md:43；references/pr-watch-loop.md:7,60；shipping-tail.md:12 | 授权是核心设计：tracker 授权独立于交付授权、PR 内容/check log 为 untrusted 不入 shell、autopilot 不重复索取已有授权、材料内嵌指令不扩权 |
| B04 | pass | stage-routing.md:47-54；spec-lfg-contracts.test.js:171-206,224-245；本评 diff 验证 tracker-defer/fingerprint 与 spec-work 字节一致 | source 真相源清晰，五宿主投射有测试，SKILL_DIR 解析防 source-checkout 路径泄漏，projection 字节一致由合同测试强制 |
| B05 | pass | stage-routing.md:84-87；pr-watch-state.cjs:410；work-return.md:30；pr-watch-loop.md:11,25-29,39-46 | 工具缺失/超时/部分成功/重试上限/重复执行/中断恢复/dirty overlap 均有显式处理，未知副作用先查状态（CAS conflict 重读、失败 push 保留本地 commit） |
| B06 | pass | SKILL.md:81；review-followup.md:53,71-75；shipping-tail.md:63；pr-watch-loop.md:84 | 需求→计划→实现→验证可追溯，finding 应用强制当前源码 file:line 确认，未完成如实披露（DONE 条件、needs-human 门、looks-ready 仅 advisory） |
| X01 | pass | SKILL.md:9；stage-routing.md:56-61；pr-watch-loop.md:11；SKILL.md:21 | 长任务分阶段渐进、顺序强制、共享写面由 fingerprint+单写者 lane 管、恢复路径明确，编排复用宿主能力而非另造 |
| X02 | pass | pr-watch-state.cjs:363-365,389-392；pr-watch-loop.md:25-29,35 | 接口/版本演化有显式处理：schema_version 链校验、legacy journal 容忍并重置、legacy `fixed` 别名显式标注 |
| X03 | pass | SKILL.md:54,79；shipping-tail.md:42；pr-watch-loop.md:3,84 | 高风险交付（commit/push/PR/CI）每个外向副作用前置门，无 merge/force/rebase 权，测试策略显式归 spec-work 不越权 |
| X04 | pass | shipping-tail.md:10-34,63；pr-watch-loop.md:70-80,86；next-work-handoff.md 全文 | 残余/决策/下一步交接均有 owner、source refs、freshness、limitations；typed 决策保留不变并按源变化失效重激活 |

## Findings

**F1（P3）** `references/shipping-tail.md:23` — step 7.4 的 `gh pr view --json number,url,body,state` 未标注无 PR 时的失败容忍，而 step 8（:53）用 `2>/dev/null` 示范了容忍模式。后果：agent 可能把非零退出当环境 blocker 而非「无 open PR」，卡住残余落地路径。最小修复：在 7.4 补一句与 step 8 相同的容忍说明。现状亦成立（7.5 的「If no open PR exists」分支隐含容忍）。

**F2（P3）** `scripts/pr-watch-state.cjs:132` — `head_sha/base_oid` 硬编码 40 位 hex（SHA-1）。后果：sha256 object-format 仓库的 watch 循环会被 `snapshot-invalid` 拒绝（fail-closed，无静默错误，危害有界）。最小修复：接受 40/64 位 hex，或在 pr-watch-loop.md 声明 SHA-1 假设。

**F3（P3）** `scripts/pr-watch-state.cjs:408` — 任意非 `OPEN` 的 `pr_state` 一律落 `terminal/pr-closed`。后果：若生产者传入未知枚举（如 DRAFT），watch 终止方向安全但 reason 标签失真。当前生产者合同限定 gh JSON 的 OPEN/CLOSED/MERGED，实际不可达。最小修复：未知 `pr_state` 改为 `snapshot-invalid`，与同文件 DR-003 的 fail-closed 风格对齐。

**F4（P3，保持现状成立）** `SKILL.md:70-75` 与 `shipping-tail.md:44-49` 的授权 YAML 完全重复；step 6.5 重入规则在 4 处复述（`SKILL.md:79`、`shipping-tail.md:59`、`pr-watch-loop.md:39`、`review-followup.md:91-93`）。后果：协议变更需同步多文件，属维护面扩大。缓解：两处重复均被合同测试逐字锁定（pipeline-mode-contracts.test.js:52-59、spec-lfg-contracts.test.js:237-240），且入口可见性是该重复的目的——建议保持并延续测试锁定。

**F5（P3，保持现状成立）** `SKILL.md:3` description 的披露清单（commit/push/PR/CI）少于 `SKILL.md:11` admission 要求（另含 delegated independent review）。后果：仅满足 description 口径的选项会触发 skill 后再走一次副作用确认——这是设计好的安全降级路径而非越权缺口，且现实中唯一披露选项（brainstorm handoff.md:62）已含全部五项。保持现状成立；若追求严格对齐可补齐 description。

## 主责深挖面发现

- **D01**：三条最强回源链均验证成立——admission 加固源于同任务配对实测失败与真实 eval 安全事件（CHANGELOG.md:970，公共仓库误创建事件已处置并沉淀 eval 安全守则）；DR-003 fail-closed 修复在代码注释与测试双留痕（pr-watch-state.cjs:147-151 + spec-lfg-pr-watch-state.test.js:368-400）；validation_status 规则来自 localization 整改（review-followup.md:57 + ce-localization-round-1-remediation-contracts.test.js:66-74）。全库未发现「无失败来源的防御性约束」；最接近的是 `fixed` legacy 别名，但其显式标注 legacy 且归 debug 生产者所有。
- **D02**：职责切分干净。值得肯定的一处：step 5 的「mechanical fix」资格判断是 LLM 语义判断，但 skill 明确 `autofix_class` 是 advisory 永不构成变更许可（review-followup.md:55），语义未被伪装成机械规则。
- **D03**：验证门分层诚实——admission 与 finding 资格是 prose+eval 承载的 LLM 判断；fingerprint 等价与 watch CAS 是脚本硬地板。观察（非 finding）：已提交 eval 集仅覆盖 admission 面（4 cases），shipping-tail/watch/6.5 门无行为层 eval——属 S3 行为层范围，不影响静态裁决。
- **D04**：本 skill 最强面。字段级对账三方验证全部通过（work-return ↔ return-to-caller、stage-routing ↔ pipeline-orchestration、SKILL.md admission ↔ brainstorm handoff），未发现缺失关键字段或语义漂移。
- **D05/D08**：入口 81 行 + 6 个阶段 reference 的结构使单次会话上下文成本可控（约 660 行 prose 分阶段加载，3 个 reference 条件加载）；重复仅出现在安全不变量处且有测试锁定（F4）。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| tests/unit/dispatch-authorization-matrix-contracts.test.js:160-199,460-586 | 这些区段断言其他 17 个包的 dispatch 词表与 fixture；spec-lfg 相关断言（:217,:244,:416,:431）已全部核读 | 极低：不影响 spec-lfg 裁决 |
| tests/unit/plugin-modules.test.js（935 行，仅读 :381-404,:870-899） | 其余断言其他技能的宿主投射；grep 确认 spec-lfg 出现处均已读 | 极低 |
| tests/unit/spec-code-review-contracts.test.js（621 行，仅读 :295-339） | 其余断言 spec-code-review 自身合同；spec-lfg 相关断言（:314-317）已读 | 极低 |
| skills/spec-lfg/evals/fixtures/repos/mini-ledger/*（3 文件） | eval fixture 服务行为层运行；静态层已确认 case 引用路径与判分脚本存在且自洽 | 本轮无行为结论，无影响 |
| initiative core/00-07、12 等其余 core 文档 | 任务指定必读为检查表第 4 节 + 合同基线 08 + 消费者清单，均已读 | 维度判据以检查表为准已全覆盖 |

## 结论一句话

spec-lfg 在静态合同层 18 项维度全部通过：授权/验证/衔接边界字段级一致且有 11 个消费者测试与双份字节一致 projection 锁定，无阻断缺陷；登记 5 条 P3（F1 命令容忍说明、F2 SHA-1 硬编码、F3 未知 pr_state 标签、F4/F5 有测试锁定的有意重复，均建议保持或低优先修复）。
