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
