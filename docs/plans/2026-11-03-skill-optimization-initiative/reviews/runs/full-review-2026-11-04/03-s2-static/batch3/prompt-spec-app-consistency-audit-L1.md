你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-app-consistency-audit/` 的 9 个维度给出相反或部分相反裁决，你需要逐维度核实源码后给出最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。可确定性核实的以源码为准。

## 已由主仲裁核实的既定事实（直接采用，不必复核）
- SKILL.md:294 曾声称 ecc-source-lock.json 被 scripts/merge-contracts.js 消费——已核实 merge-contracts.js 全文 0 处 ecc 引用，实际消费者只有 prompts/orchestrator.md；该行已修复。R1 F1 成立（B02 证据之一）。

## 待仲裁维度（fail 侧论据）

1. **D03**（R2）：merge-contracts.js:411/479、validate-artifacts.js:368——归一化可把显式否定改写。
2. **D04**（R2）：SKILL.md:107 vs run-audit.js:359/365——入口接受的设计引用/技术计划/任务文档/行业深度信息未完整传入实际生产者。
3. **D05**（R2）：mode-output-contract.md:101 vs SKILL.md:307——default 模式应物化远程设计还是移交后续 workflow，执行承诺冲突。
4. **B02**（R1+R2 双 fail，不同证据）：R1 F2：SKILL.md:107 vs run-audit.js:534+merge-contracts.js:425-427+render-headless-envelope.js:90-93；R2：run-audit.js:540、merge-contracts.js:205/602——最终报告只消费两种领域合同。
5. **B03**（R2）：SKILL.md:109 vs run-audit.js:296/323——外发授权边界。
6. **B05**（R2）：run-audit.js:501/519——首轮自动生成的空 raw-issues 在同 run 重试时被当外部输入拒绝，恢复路径与生成物身份不一致。
7. **B06**（R2）：prompts/report-writer.md:15、run-audit.js:540、render-headless-envelope.js:131——报告与 envelope 判据错位。
8. **X01**（R2）：prompts/audit-planner.md:63、run-audit.js:501——多模块长链路同 run 恢复的确定性缺口。
9. **X02**（R2）：mode-output-contract.md:33、audit-utils.js:427、run-audit.js:365——架构声明与实现错位。
10. **X03**（R2 not-applicable / R1 pass）：范围判断分歧。

## R1（pass 为主）完整评审
# spec-app-consistency-audit 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-app-consistency-audit/SKILL.md:17；evals/cases/r2-implementation-routes-out.yaml:9；git f9d9c7e4/1f72bfd0 | Routing Gate 针对「别审了,直接修了」这一真实 co-opting 失败设置，且有对抗 eval 与两轮交叉测评→修复→复验 git 链支撑，约束不过度、不矛盾 |
| D02 | pass | rule-packs/common-app/rules.yaml:8-13；scripts/build-impact-facts.js:27-36,79；prompts/audit-planner.md:38-39 | 编码的是移动 App 领域约束与反模式（状态完整性、重复提交、safe-area/键盘、行业规则包），脚本只产 candidate_signals 交 `llm-audit-planner`，语义判断归 LLM，职责分工与角色契约一致 |
| D03 | pass | scripts/merge-contracts.js:99-196（applyEvidenceGate）；scripts/validate-artifacts.js:246-292,368-403；scripts/run-audit.js:505-527 | no-evidence-no-issue、confirmed 需 confidence≥0.75、claim_family 证据需求、industry confirmed 需 confirmedIndustry 均为脚本确定性强制；validate-artifacts 二层校验 schema/enum/redaction；issue_synthesis_status 不允许冒充，工具强制与 prose 约定边界清晰 |
| D04 | pass | scripts/build-impact-facts.js:79（consumers: llm-audit-planner）；prompts/audit-planner.md:42-44；tests/unit/spec-app-consistency-audit-host-boundaries.test.js:52-64 | 上游 facts/degraded modes 被 planner 与专家按合同消费；`from:code-review` 反向边被测试锁定为休眠且 spec-code-review 侧无消费者；envelope/summary 是显式交接面（漂移记 F2，不破坏上游证据消费） |
| D05 | pass | SKILL.md:15-17,99-109,158-169,226-238；references/mode-output-contract.md | 关键规则（Routing Gate、mode 默认值、dispatch 协议、evidence policy）均可 file:line 定位，无相互矛盾；存在跨文件 verbatim 重复的维护成本（F3），删减会损失 route-critical 摘要，保持分层成立 |
| D06 | pass | SKILL.md:158-169（dispatch 记录 yaml + 降级语义）；tests/unit/dispatch-authorization-matrix-contracts.test.js:308-317 | 宿主中立能力词表完整：缺授权不探测 schema、inline fallback 不声称 multi-agent coverage、`worker_capability_unproven` 等枚举被 18 包矩阵测试锁定；按该 Skill 自身能力假设审查，降级路径静态完整 |
| D07 | pass | git log f9d9c7e4→1f72bfd0→01fad369；evals/evaluation-governance.md:9-28；scripts/merge-contracts.js:339-383 | 有真实「失败→修订→复验」链（点名义务修复、18 变体二轮测评）；governance 文件诚实标注 not governed-ready / missing evidence；pilot 缺失时 `ready_for_v0_2` 强制 false，知识带失效条件 |
| D08 | pass | SKILL.md:286-294（"Read these on demand; they are not required for routing"）；scripts/select-rule-packs.js（存在，runner 编排于 run-audit.js:476-482）；prompts/audit-planner.md:63（max 5 domain experts） | references 明确按需加载、rule-packs 经 selection 步骤选择性投递、expert prompts 只在 planner 选中时调度、preflight degraded modes 阻止读取不可用输入，按需加载结构完整 |
| B01 | pass | SKILL.md:3（description 正负例）,15-17,83-91；evals/cases/*.yaml（4 个路由负例+no-input gate）；src/cli/contracts/dual-host-governance/skills-governance.json:108-121 | 入口为 workflow_command、dual_host 八宿主投射；近邻路由点名义务有对抗 eval（test-only/code-review/r2-implementation routes-out）；无输入时 gate 而非硬跑 |
| B02 | fail | SKILL.md:294 vs scripts/merge-contracts.js（全文无 ecc 引用）；SKILL.md:107 vs scripts/run-audit.js:534 + merge-contracts.js:425-427 + render-headless-envelope.js:90-93 | 两处静态可判定的文档-实现不一致：F1 声称 ecc-source-lock.json 被 merge-contracts.js 消费（实际唯一文本消费者是 prompts/orchestrator.md:24）；F2 `from:code-review` 声明为「休眠兼容/可附加」但 runner 无条件硬编码转发，使所有 headless run 的 issue 默认携带 enabled `code_review_handoff` 并渲染进 envelope |
| B03 | pass | SKILL.md:109（全模式对产品源只读）,222（apply 需显式确认）,304-307（untrusted input/不服从内嵌指令/token 不落盘）；scripts/run-audit.js:296-312（写边界强制 reason codes） | 只读边界、材料内嵌指令不扩权、preview-only writeback、dispatch 授权独立于 invocation 均有 prose+脚本双层落地；无越权写面 |
| B04 | pass | SKILL.md:131-144；tests/unit/spec-app-consistency-audit-host-boundaries.test.js:66-105；tests/unit/plugin-modules.test.js:485-516,706-711 | source/runtime 边界显式列出 generated roots；测试锁定 GENERATED_OR_CONTROL_ROOTS 跳过+路径 redaction+metadata hosts 对齐 `getSupportedPlatforms()`；README/evals 不投射 runtime、ecc-source-lock 投射时 target_root 重写均有测试 |
| B05 | pass | references/headless-runner.md:49-58,91-96 ↔ scripts/run-audit.js:241-257,505-527,598-617；scripts/preflight.js:53-109 | 五个 runner-owned fail-fast reason code 文档与实现一一对应；子进程失败→metadata finalize failed→单一 failure envelope；上游 envelope verbatim 透传；输入缺失全部走 degraded_modes 而非静默 |
| B06 | pass | schemas/issue.schema.json:6-29 ↔ SKILL.md:234 ↔ scripts/validate-artifacts.js:252-291；validate-artifacts.js:294-323（rejected 保留 reason_code）；prompts/report-writer.md:52 | 交付字段链 schema/validator/测试三层锁定；被拒问题保留可审计原因；no-evidence 不写成 pass、`not_run` 时 envelope 明示 "Awaiting LLM audit"，未完成如实披露 |
| X01 | pass | references/headless-runner.md:60-83 ↔ scripts/run-audit.js:365-594；SKILL.md:173-192 | 16 步管线依赖顺序明确（page-routes 依赖三 contracts）、run-scoped 目录隔离重复执行、中断有 failed finalize 恢复路径；v0.1a spine→v0.1b planner 渐进细化 |
| X02 | pass | schemas/*.json 全部携带 `schema_version`（grep 计数）；scripts/validate-artifacts.js:717-721（requireSchemaVersion）；SKILL.md:101（deferred modes 显式记录） | 产物接口全部 `.v1` 版本化且入口强制校验；未实现的 mode:default/report-only 作为开放问题显式声明而非隐藏 |
| X03 | not-applicable | SKILL.md:27,81,95-97；references/report-format.md:33-43 | 本 Skill 无产品代码实现、发布或回滚面（只产 advisory 审计产物且不写测试/durable 标准）；其风险对账（confirmed/candidate 分级、runtime_verification 强制字段、writeback preview-only）已由 D03/B03 覆盖，无独立高风险实现面可核查 |
| X04 | pass | scripts/render-headless-envelope.js:36-48（Run/Artifact/Summary/Issues/Verdict 字段）；references/headless-runner.md:13-16（latest-summary 仅指针须对 metadata 校验）；SKILL.md:296-300（follow-up 只在 summary/envelope，不自动执行）；references/pilot-validation.md:54-58 | 跨会话交接产物带 source refs 与 freshness 校验规则；handoff 建议明确非自动执行；pilot 知识记录含失效条件与 ready_for_v0_2 边界 |

## Findings

**F1（P3，B02）SKILL.md 对 ecc-source-lock.json 的消费者声明为 stale 引用**
- 位置：`skills/spec-app-consistency-audit/SKILL.md:294`；`skills/spec-app-consistency-audit/scripts/merge-contracts.js`（全文 grep 无 `ecc` 命中）；实际文本消费者 `skills/spec-app-consistency-audit/prompts/orchestrator.md:24`
- 后果：维护者按 SKILL.md 指引会预期修改 ecc-source-lock.json 影响 merge-contracts 行为，实际不会；该声明同时掩盖了「此文件当前无任何程序化消费者、仅作治理溯源与 runtime 投射（plugin-modules.test.js:706-711 只验证投射重写）」的事实。
- 最小修复：将 SKILL.md:294 的 "consumed by `scripts/merge-contracts.js` and the orchestrator prompt" 改为实际消费面（orchestrator prompt 说明 + 投射治理），或在 merge-contracts.js 落地真实消费后再恢复声明。

**F2（P3，B02）`from:code-review`「休眠兼容」声明与 runner 无条件激活行为矛盾**
- 位置：`skills/spec-app-consistency-audit/SKILL.md:107`、`references/mode-output-contract.md:37-38,198-199`（休眠/仅为旧 artifact 保留）与 `references/headless-runner.md:74-75`（「旧 envelope replay **可**附加」）对照 `scripts/run-audit.js:534`（无条件硬编码 `'from:code-review'`）、`scripts/merge-contracts.js:425-427,493-504`（fromCodeReview=true 时为每个未显式禁用的 issue 生成 `enabled:true` 的 handoff）、`scripts/render-headless-envelope.js:90-93`（渲染 "Code-review handoff" 行进 envelope）
- 后果：任何普通 headless run（caller 与 code-review 无关）的 issues.json 与 envelope 都携带激活的 code-review handoff 字段，与「当前没有受治理 caller 或 consumer、休眠兼容」的文档语义直接冲突；envelope 读者会看到一个并不存在的下游通道。现有测试（host-boundaries.test.js:52-64、skill-flow-p2-closure-contracts.test.js:19-30）只锁定 prose 与 spec-code-review 侧，不锁定 runner 侧该行为，故漂移不被测试捕获。
- 最小修复：二选一——从 run-audit.js:534 移除无条件 token、仅当 caller 实际传入 `from:code-review` 时透传；或把三处文档改为如实描述「v1 runner 在 issues 步骤无条件附加休眠 marker，字段不建立 active consumer」。

**F3（P3，D05）双处 verbatim 维护的合同段无同步防护**
- 位置：`SKILL.md:202-209` vs `references/mode-output-contract.md:127-136`（Figma Redaction 三档近乎逐字重复）；`SKILL.md:234` vs `references/mode-output-contract.md:160-178`（issue 字段清单双处）
- 后果：修改一处遗漏另一处不会失败任何测试（消费者测试不比对这两段）；issue 字段清单已有 schema+validator 锁定故风险低，redaction 段无任何机器校验。
- 最小修复：保持现状可成立（defer 模式的既有代价），建议在 mode-output-contract.md 两段标注 "canonical; SKILL.md keeps route-critical copy" 并在下次触碰其中一处时合并。

**保持现状成立（正面确认）**
- 证据门实现与 prose 完全对应且双层强制（merge-contracts.js:99-196 ↔ SKILL.md:226-238 ↔ validate-artifacts.js）。
- 诚实降级链完整：`issue_synthesis_status: not_run` → envelope 明示 "Awaiting LLM audit"（render-headless-envelope.js:46-48）；evaluation-governance.md 自标 not governed-ready / missing evidence；缺 pilot 时 `ready_for_v0_2` 强制 false（merge-contracts.js:341-353）。
- 宿主边界由 focused tests 双向锁定（generated roots 跳过+redaction、metadata hosts 对齐 `getSupportedPlatforms()`、README/evals 不投射）。

## 主责深挖面发现

- **D01/D02**：Routing Gate 与 rule-packs 不是模型能力补丁——修的是被对抗样本证实的真实失败模式（r2 变体直接复现「别审了,直接修了」），领域知识（KMP/Clean Architecture、埋点、i18n、行业规则）以 advisory rule-pack + 证据策略（`rule_pack_cannot_be_only_evidence: true`，common-app/rules.yaml:6）形式编码，未出现「最佳实践」口号替代来源。
- **D03**：验证门是本轮看到的最强项——deterministic gate 与 LLM Evidence Auditor 的分工有明确交接点（evidence-auditor.md:17「claim_family 的证据需求由 deterministic Evidence Gate 先执行；你只复核证据语义」），无语义判断冒充机械判定。
- **D04/D08**：defer 结构纪律性好——SKILL.md 自述 "Keep these route-critical defaults in memory"（105 行）划定摘要/详情边界，references 声明按需加载；唯一实质漂移即 F2。
- **D05/D08 深挖后无新增 P1/P2**：三处 P3 均为文档-实现措辞层，不影响主链路正确性、授权边界或验证门。

## 未读文件

- `scripts/extract-*.js` 12 个提取器全文、`build-run-metadata.js`、`build-artifact-manifest.js`、`build-audit-context.js`、`build-industry-profile.js`、`select-rule-packs.js`、`preflight.js:130-576`、`audit-utils.js:120-660`、`merge-contracts.js:630-760`、`validate-artifacts.js:1-190,500-775`——理由：主责证据集中在入口合同、编排器、证据门与验证器，这些支撑函数经 runner 编排、schema 校验与 focused tests 间接锁定；后果：个别提取器正则的召回质量与边角 reason code 行为未逐行核（属行为层）。
- `prompts/` 中 13 个 expert prompt（product/figma-design/mobile-ux/kmp/component/analytics/i18n/industry/regression 等）——理由：抽查的 orchestrator/audit-planner/evidence-auditor/report-writer 呈现一致模板与边界；后果：个别 expert 与对应 rule-pack 的字段级一致性未逐个对账。
- `schemas/` 22 个中除 issue/metadata（经测试与直接读取）外的 20 个、`rule-packs/` 除 common-app 外 6 个及 checklist.md——理由：schema↔实现一致性由 validate-artifacts.js 与测试锁定，rule-pack 内容为 advisory；后果：schema 间字段级冗余与行业规则时效性未排除。
- `evals/recorded-output-fixtures.json`、`evals/fixtures/repos/mini-ledger/*`、`evals/skillup/fixtures/scripts/*` 内容——理由：仅作 fixture 证据且 governance 文件已如实标注其证据等级；后果：fixture 与当前 runner 输出的逐字段匹配未核。

## 结论一句话

spec-app-consistency-audit 的静态合同整体扎实（确定性证据门、诚实降级、宿主边界均有实现与测试双层锁定），仅 B02 存在两处 P3 级文档-实现漂移（ecc-source-lock 消费者声明 stale、`from:code-review` 休眠声明被 runner 无条件激活），最小修复即可关闭。


## R2（fail 为主）完整评审
# spec-app-consistency-audit 评审（R2）

## 逐项裁决表

以下裁决仅针对冻结版本 `5b59293b` 的静态合同与源码一致性，不代表行为评测、运行成本或真实 App 审计效果通过。表中路径均相对仓库根目录。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-app-consistency-audit/SKILL.md:169`；`skills/spec-app-consistency-audit/prompts/kmp-clean-architect.md:48` | 约束主要守护授权、证据和静态能力上限，未发现仅为补偿模型基础能力而设置的强制推理流程。 |
| D02 | pass | `skills/spec-app-consistency-audit/prompts/engineering-quality-expert.md:27`；`skills/spec-app-consistency-audit/prompts/audit-planner.md:36` | 移动端弱网、权限、跨端架构等领域知识明确，专家选择及问题充分性保留给 LLM。 |
| D03 | fail | `skills/spec-app-consistency-audit/scripts/merge-contracts.js:411`；`skills/spec-app-consistency-audit/scripts/merge-contracts.js:479`；`skills/spec-app-consistency-audit/scripts/validate-artifacts.js:368` | 归一化可把显式否认静态确认的输入改成确认，未知 `claim_family` 又按无附加证据要求处理。 |
| D04 | fail | `skills/spec-app-consistency-audit/SKILL.md:107`；`skills/spec-app-consistency-audit/scripts/run-audit.js:359`；`skills/spec-app-consistency-audit/scripts/run-audit.js:365` | 入口接受的设计引用、技术计划、任务文档、行业及深度等信息没有完整传入实际生产者。 |
| D05 | fail | `skills/spec-app-consistency-audit/references/mode-output-contract.md:101`；`skills/spec-app-consistency-audit/SKILL.md:307` | default 模式应当物化远程设计，还是必须移交后续 workflow，存在相互冲突的执行承诺。 |
| D06 | pass | `skills/spec-app-consistency-audit/SKILL.md:158`；`skills/spec-app-consistency-audit/SKILL.md:169` | 明确核实隔离、模型覆盖和并发能力，未知时继承模型或串行，并禁止冒称独立专家覆盖。 |
| D07 | pass | `skills/spec-app-consistency-audit/references/pilot-validation.md:14`；`skills/spec-app-consistency-audit/references/pilot-validation.md:54` | 将真实或历史 App pilot、误报原因和人工确认作为升级依据，缺记录不得宣称下一版本就绪。 |
| D08 | pass | `skills/spec-app-consistency-audit/SKILL.md:288`；`skills/spec-app-consistency-audit/prompts/audit-planner.md:63`；`skills/spec-app-consistency-audit/scripts/lib/audit-utils.js:217` | 具备按需引用、专家数量预算、有界读取与截断披露；本轮未以未测运行成本否定静态承诺。 |
| B01 | pass | `skills/spec-app-consistency-audit/SKILL.md:15`；`skills/spec-app-consistency-audit/SKILL.md:83`；`skills/spec-app-consistency-audit/SKILL.md:296` | 正向触发、代码审查／修复／PRD／UI polish 负例和建议式后续交接均明确。 |
| B02 | fail | `skills/spec-app-consistency-audit/scripts/run-audit.js:540`；`skills/spec-app-consistency-audit/scripts/merge-contracts.js:205`；`skills/spec-app-consistency-audit/scripts/merge-contracts.js:602` | 最终报告只消费两种领域合同，无法忠实继承已抽取的全部覆盖与降级事实，且存在输入丢失。 |
| B03 | fail | `skills/spec-app-consistency-audit/SKILL.md:109`；`skills/spec-app-consistency-audit/scripts/run-audit.js:296`；`skills/spec-app-consistency-audit/scripts/run-audit.js:323`；`skills/spec-app-consistency-audit/scripts/lib/audit-utils.js:330` | 委派及不可信材料规则清楚，但实际写入仅检查 run 根与 envelope，没有阻断既有子路径符号链接把 artifact 写入导向产品文件。 |
| B04 | pass | `skills/spec-app-consistency-audit/SKILL.md:131`；`skills/spec-app-consistency-audit/scripts/lib/audit-utils.js:20`；`tests/unit/spec-app-consistency-audit-host-boundaries.test.js:66`；`tests/unit/plugin-modules.test.js:706` | source/runtime 权威明确，辅助代码覆盖当前八宿主控制目录，消费者测试包含宿主枚举及来源锁投射断言。 |
| B05 | fail | `skills/spec-app-consistency-audit/scripts/run-audit.js:501`；`skills/spec-app-consistency-audit/scripts/run-audit.js:519` | 首轮自动生成的空 raw-issues 会在同 run 重试时被当成外部已提供输入而拒绝，恢复路径与生成物身份不一致。 |
| B06 | fail | `skills/spec-app-consistency-audit/prompts/report-writer.md:15`；`skills/spec-app-consistency-audit/scripts/run-audit.js:540`；`skills/spec-app-consistency-audit/scripts/render-headless-envelope.js:131` | 报告与 envelope 无法完整披露上游降级，机械证据门还存在提升确认状态的路径，削弱交付真实性。 |
| X01 | fail | `skills/spec-app-consistency-audit/prompts/audit-planner.md:63`；`skills/spec-app-consistency-audit/scripts/run-audit.js:501` | 多模块审查有分镜头和第二次 focused pass 的预算安排，但实际长链路的同 run 恢复存在确定性缺口。 |
| X02 | fail | `skills/spec-app-consistency-audit/references/mode-output-contract.md:33`；`skills/spec-app-consistency-audit/scripts/lib/audit-utils.js:427`；`skills/spec-app-consistency-audit/scripts/run-audit.js:365` | Skill 声明架构意图与任务符合性能力，但 runner 丢弃对应输入，使架构变更场景无法按声明对账。 |
| X03 | pass | `skills/spec-app-consistency-audit/prompts/engineering-quality-expert.md:40`；`skills/spec-app-consistency-audit/prompts/regression-expert.md:33`；`skills/spec-app-consistency-audit/SKILL.md:97` | 对高风险表面保留静态识别、运行时补验和最小测试层建议，不把实际部署、设备执行或修复纳入本审计权限。 |
| X04 | pass | `skills/spec-app-consistency-audit/prompts/report-writer.md:15`；`skills/spec-app-consistency-audit/prompts/report-writer.md:56`；`skills/spec-app-consistency-audit/references/headless-runner.md:13`；`skills/spec-app-consistency-audit/SKILL.md:169` | 静态合同要求保留来源、新鲜度、限制和当前 run 身份，并区分独立委派与 inline 自审；不自动执行后续 workflow 或提升知识。 |

## Findings

### F01 · P1：runner 接收 canonical 输入，却没有把关键输入传给消费者

- **位置：** `skills/spec-app-consistency-audit/SKILL.md:107`；`skills/spec-app-consistency-audit/scripts/run-audit.js:359-396`、`:465-482`。
- **事实：** 公共解析器能够解析 `figma-ref`、`industry`、`tech-plan`、`task-doc`、`depth`、`expected-input` 等字段，见 `skills/spec-app-consistency-audit/scripts/lib/audit-utils.js:601-649`。runner 构造 subprocess 参数时主要传递 source、PRD、本地 Figma context、部分扫描限制，没有完整传递这些已接受的信息。
- **后果：**
  - 提供 `figma-ref` 后，preflight 无法记录该引用及规定的 reference-only 降级。
  - 提供技术计划／任务文档后，metadata 和 impact facts 仍可能宣称相应能力不可用。
  - 用户明确选择的行业、深度及预期输入不能可靠影响下游事实和审计范围。
- **最小修复建议：** 在 runner 建立共享的显式参数投递映射，按各生产者能力传递已接受字段；尚未实现的 token 应明确拒绝或披露不支持，不能静默丢弃。补充“入口参数→metadata／preflight／impact／rule selection”的消费者合同测试。

### F02 · P1：最终报告丢失大部分领域覆盖与降级事实

- **位置：** `skills/spec-app-consistency-audit/scripts/run-audit.js:484-499`、`:540-564`；`skills/spec-app-consistency-audit/scripts/merge-contracts.js:198-225`、`:602-615`。
- **事实：** runner 在 merged 阶段传入全部十二种合同，但 report 阶段仅传入 page-route 和 engineering-quality；报告的 `scope_and_degraded_modes` 与 `section_coverage` 又只从本次传入的 artifacts 生成。
- **后果：**
  - 已抽取的产品、设计、架构、组件、模块、埋点、国际化和行业合同在报告中表现为未覆盖。
  - 仅存在于其他合同或 preflight／impact 中的降级不会进入最终报告。
  - metadata 的 complete/degraded 判定只依赖这个不完整报告，envelope 也仅合并报告降级与 metadata reason codes，见 `skills/spec-app-consistency-audit/scripts/render-headless-envelope.js:124-128`，因此消费者可能得到过强的完成或就绪表述。
- **最小修复建议：** report 阶段消费完整的领域合同，并汇总 preflight／impact 的降级；复用已有 merged context 或共用 artifact 列表，避免维护两套不一致参数。测试应覆盖“某非核心领域存在降级，但 page-route／quality 正常”的情况。

### F03 · P1：证据门会改写确认事实，未知 claim family 可绕过家族证据要求

- **位置：** `skills/spec-app-consistency-audit/scripts/merge-contracts.js:411-418`、`:479-485`；`skills/spec-app-consistency-audit/scripts/validate-artifacts.js:368-371`。
- **事实：**
  1. 输入为 `contract_status: confirmed`、`static_confirmed: false` 时，归一化直接把后者改成 `true`。
  2. 未知 `claim_family` 经 `CLAIM_FAMILY_REQUIREMENTS[issue.claim_family] || []` 得到空要求。
  3. strict validator 只要求 `claim_family` 为非空字符串，没有验证其属于已知家族。
- **后果：** 一个带通用项目证据、足够 confidence 的未知家族问题，可以绕过特定家族的双源／三源证据要求；调用方明确未作静态确认的输入，也可被脚本变成静态确认。这不是单纯的文本规范化，而是提升 claim 权威。
- **最小修复建议：** 对确认状态冲突拒绝或降为 candidate；未知家族不得保持 confirmed。由证据门和 validator 共享家族枚举，并为上述两种输入增加反例测试。语义是否成立仍交 Evidence Auditor 判断。

### F04 · P2：自动 stub 与外部输入没有区分，同 run 重试会失败

- **位置：** `skills/spec-app-consistency-audit/scripts/run-audit.js:501-527`。
- **事实：** 首次没有 raw issues 时，runner 写入空 `input/raw-issues.json`，仅用本次进程内的 `autoStubbed` 变量区分来源；下一次使用相同 run-id 时该文件已存在，若沿用原参数、不提供 synthesis status，就进入 `issue_synthesis_status_required_with_input`。
- **后果：** 首轮成功后的重复执行，或首次 stub 之后发生失败的恢复执行，会把 runner 自产占位文件误认为调用方提供的审查输入。该失败分支还直接 return，绕过 catch 中的 metadata failed 收尾，可能留下 `started` 状态。
- **最小修复建议：** 持久标记 stub 身份，或不要把占位文件放在外部输入的发现路径；明确相同 run-id 的重放／恢复策略。统一 metadata 创建之后的失败出口，覆盖“首次无输入→同 run 重试”的合同测试。

### F05 · P1：artifact 子路径未实施写入边界检查，既有符号链接可突破产品只读承诺

- **位置：** `skills/spec-app-consistency-audit/scripts/run-audit.js:296-324`、`:327-350`；`skills/spec-app-consistency-audit/scripts/lib/audit-utils.js:330-336`；`skills/spec-app-consistency-audit/scripts/build-run-metadata.js:156`。
- **事实：** runner 检查 runDir 和 envelope 的真实路径边界，但随后递归复用既有 runDir／contracts／input，并直接把其他 artifact 路径交给普通 `writeFileSync`。公共写入函数不验证目标及其父目录的 realpath，也不拒绝符号链接。
- **触发条件：** 选定的既有 runDir 内，`metadata.json` 或 `contracts` 等路径为指向产品文件／目录的符号链接；默认 envelope 本身仍在安全位置。
- **后果：** run 根检查可以通过，后续 artifact 写入却跟随子路径链接，覆盖产品文件或其他非 run surface，违反 `SKILL.md:109` 的只读承诺。
- **最小修复建议：** 在共享 artifact 写入边界验证每个实际目标及父目录，拒绝越界链接；同时明确既有 run 的占用与恢复规则，避免静默复用。增加“run 根安全、内部 artifact 或目录链接越界”的负例测试。

### F06 · P2：Figma 默认模式的远程物化权限与 owner 不一致

- **位置：** `skills/spec-app-consistency-audit/references/mode-output-contract.md:101-108`；`skills/spec-app-consistency-audit/SKILL.md:197`、`:307`。
- **事实：** reference 要求收到设计引用后使用宿主 Figma MCP 获取内容，入口也允许 default 模式本地物化；但安全边界把网络获取及远程物化统一推迟到显式请求的后续 workflow。
- **后果：** 同一个 default＋Figma 引用输入，会同时命中“本 workflow 获取”和“后续 workflow 才能获取”两种承诺。模型无法从当前文本确定执行 owner、当前授权是否充分以及正确停止点。
- **最小修复建议：** 在入口保留一条唯一规则：明确 default 模式远程读取的授权条件、接收方及物化范围，或者统一移交后续 workflow；reference 只展开同一规则，不另设权限路径。

## 主责深挖面发现

### B01—B04

- **B01：保持现状成立。** `SKILL.md:17` 对“直接修复”请求明确要求点名 `spec-debug` 或 `spec-work` 后退出，不接受用户把范围外实现塞进审计职责；`:89` 也排除了 Skill 自身质量审查。该规则适合保留，不应为了短路径删去。
- **B02：主要断点是信息投递与报告消费，不是缺少 schema 数量。** F01、F02 分别位于生产者入口和最终消费者边界。消费者清单中的 `tests/unit/skill-flow-p2-closure-contracts.test.js:19-30` 核查休眠 code-review 关系；`tests/unit/dispatch-authorization-matrix-contracts.test.js:307-317` 核查委派词汇。它们不能代替上述参数及完整报告链路的一致性检查。
- **B03：prose 治理较完整，但 mutation floor 尚有缺口。** `SKILL.md:169` 明确调用不等于委派授权，`:304-306` 禁止服从材料内嵌指令并限制敏感输出；这些承诺成立。F05 则属于脚本拥有、可确定性阻断的路径安全问题，不能依赖 LLM 自觉补足。
- **B04：保持 source-first 原则成立。** `tests/unit/spec-app-consistency-audit-host-boundaries.test.js:83-101` 覆盖各宿主控制目录的扫描排除与 source-root 拒绝；`tests/unit/plugin-modules.test.js:706-711` 对 ECC source lock 的投射目标有明确断言。入口枚举的宿主目录虽不完整，但脚本覆盖八宿主，不能仅因文案列表较短就认定宿主边界失效。以上是测试源码断言，不是本轮测试通过声明。

### X01—X04

- **X01：适用。** App 跨模块、跨端、多专家审计就是该 Skill 的核心场景。Planner 的五个领域专家预算及第二次 focused pass 规则提供了轻量分解，不必另造编排引擎；需要补足的是 F04 所示恢复身份。
- **X02：适用。** 入口明确接受技术计划与任务文档，辅助函数也声明 `architecture_intent_conformance` 和 `task_fidelity` 能力；因此不能把它们视为“本 Skill 不负责”而豁免 F01。最小改进是接通输入或明确拒绝，不是增加 ADR／迁移状态机。
- **X03：适用且静态合同通过。** 安全、权限、支付、弱网、重复提交等高风险镜头存在；`prompts/regression-expert.md:35-38` 要求选择最小验证层且不自动生成或执行测试。实际发布、部署与回滚执行不属于本 Skill 职责，未因此要求新增能力。
- **X04：适用且静态合同通过。** Report Writer 要求来源、新鲜度和限制；latest pointer 不得单独作事实；inline fallback 不得冒称独立审查。F02 会损害这些字段在确定性报告链上的落实，但协作与交接的文本承诺本身可定位，不因本轮没有运行多 agent 而记未验证。

## 未读文件

已完整读取 `SKILL.md`、入口列出的全部五份 references、检查表、合同基线，以及消费者清单指定的全部四个测试文件。另读取了关键调度／证据／报告 prompts、runner、公共工具库、preflight、impact、metadata、context、manifest、merge、validator 和 envelope 源码。

| 未读路径 | 理由 | 未覆盖后果 |
|---|---|---|
| `/Users/kuang/.codex/AGENTS.md` | Read 请求未获权限，未尝试绕过。 | 无法核对其中尚未出现在当前上下文的附加全局约束。 |
| `skills/spec-app-consistency-audit/scripts/extract-prd-contract.js`、`extract-figma-contract.js`、`extract-code-contract.js`、`extract-page-routes.js`、`extract-kmp-architecture.js`、`extract-engineering-quality.js`、`extract-components.js`、`extract-modules.js`、`extract-analytics.js`、`extract-i18n.js` | 本轮深挖聚焦入口、参数投递、授权与报告链；未展开各领域抽取算法。 | 不对抽取准确性、各抽取器自身的脱敏完整性和全部降级分支作通过结论。 |
| `skills/spec-app-consistency-audit/scripts/build-industry-profile.js`、`select-rule-packs.js` | 已能在 runner 参数边界定位行业输入丢失，未继续深挖选择算法。 | 不对行业候选及规则包选择的内部正确性作结论。 |
| `skills/spec-app-consistency-audit/schemas/**` | 已检查实际执行的 validator，未逐份读取声明式 schema。 | 不声明 JSON schema 与手写 validator 完全等价。 |
| `skills/spec-app-consistency-audit/prompts/` 中除本轮已读八份 prompt 外的其余资产，以及 `rule-packs/**`、`evals/**`、可能存在的 `templates/**` | 目录枚举命令未获权限；未猜测资产存在性或完整清单。 | 未覆盖全部领域镜头、规则包内容、维护者评测判据及模板一致性；不声称完成包级逐文件审计。 |
| `templates/claude/commands/spec/app-consistency-audit.md` 及实际 runtime 生成实现 | 本轮读取指定消费者的投射断言，未展开生成器和各宿主实际投射内容。 | B04 的通过限于静态权威边界与已读消费者约束，不证明当前 runtime 无漂移或自然入口加载正确。 |

本轮没有修改文件、执行测试、调用远程设计服务或开展行为评测；裁决依据是当前已读源码及合同，未将测试断言当作运行结果。

## 结论一句话

该 Skill 的职责、领域镜头与委派降级合同总体清楚，但输入投递、报告覆盖、确认状态门禁、同 run 恢复及 artifact 写入隔离存在可定位缺陷，因此本轮静态合同评审不通过，且不据此推断行为质量或实际收益。


## 输出格式

每个维度一行：| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |。裁决词汇只用 pass / fail / not-applicable。最后一段「修复建议」：fail 成立的给最小可维护修复。语言：中文。先读源码再下结论。
