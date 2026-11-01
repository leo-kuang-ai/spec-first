# spec-prd 全量源码审查

结论：这是本地独立的 brownfield 产品需求 owner，无 CE 一对一对应；不能用 CE plan 覆盖。应保留 WHAT/HOW、current/target/delta、稳定 R/AE、设计来源分母、checkpoint 与 machine receipt 增强；有条件吸收 CE 相邻 brainstorm/plan/doc-review 的有界决策、一条规范一个 owner 和后果驱动裁定。当前既有文案冲突，也有确定性脚本/评测反例，不是完美融合。本文仅记录审查与建议，未实施。

## 全量范围与证据

本地包内全部文本资产全文审读，包括 2875 行 examples、两套 Contract Reset 证据/runner、全部模板、overlay、引用、1689 行 checker、453 行 finalizer；实际读取范围/hash 见逐文件表。额外全文核对 8 个新增直接单测及 Claude/Qoder 四个 hook，PRD→plan 测试同 hash 复用已完成阅读。CE 相邻 `ce-brainstorm/SKILL.md`、`ce-plan/references/structure.md`、`ce-doc-review/SKILL.md` 的当前 hash 与既有全文阅读相同，登记为依赖；不强行制造同名对应。

## 逐能力融合裁定

| 能力 | 双方源码事实与意图 | 集成裁定、边界与验收 |
|---|---|---|
| 产品 WHAT owner | 本地 SKILL:1–345 定义 create/refine/validate；CE brainstorm 提炼需求、plan 解决 HOW | 保留 PRD 独立 owner；仅当需要更完整产品 contract 才进入，不让每个研发小改动强制产 PRD |
| 研发范围闭包 | 本地 SKILL:91、202–204、265、273 要求只因不影响本期/扩大范围不能结束分支；domain:199 与 Lite:86–98 又允许 release-bounded closure；CE plan structure 对 concern 按真实 harm/后补代价裁定 | 统一到是否改变本期验收、兼容、权限、rollout/fallback 的语义问题；有证据的排除与 reopen 条件可以关闭分支，不靠无限问或全局 owner cap。用户明确全量需求不能擅自限缩 |
| 单一规范 owner | 本地 R/AE/BR/NFR 与 Decision Trace；CE plan 强调 Requirements/KTD/unit 分层引用 | 吸收稳定引用与去重；AE 验证 owning R，不在流程/示例里另立产品规则；不重排或复用旧 ID |
| current vs target | 本地 evidence-and-topology:46 把 ratified target 当 user-stated until confirmed source contradicts；其余 domain/grill 强调现状证据 | current 代码只证明现状，不自动否定获批目标；分别记目标决策与现状。已废弃材料不应机械触发重新询问 |
| 澄清与授权 | 本地 SKILL:237、output-template:314 对“validate and fix”仍要求先报告再等确认；CE doc-review 的 report-only 与 mutate 区分可参考 | 保留纯 validate 零写；当前用户已经明确授权修复时，完成报告后可按 refine 执行，不让阶段切换撤销授权。新增外发/宿主写权限仍独立核对 |
| 单一交互收件人与事实权威 | SKILL:160、Lite:77–84 当前用户为 sole confirmer；Lite:145 又限制 confirmation scope | 仅把提问路由收敛到当前用户；用户决定目标不等于具备证明监管/安全/外部专业事实的 authority。专业材料保留 source_type、scope 与缺证，不伪造专家确认 |
| 问题逐项绑定 | checker:651–679 将 OQ-id/question 绑定 Trace 是有用地板；SKILL:287 等反对一条答复关闭多个问题 | 保留逐 OQ 语义映射与后果；明确批量答复可逐行引用同一真实答复，不重复索取批准，不把“每次一个问题”升级为权限规则 |
| 产品质量与成本 | product-expert-lens:12 对每条需求要求三 seat/counterfactual/source 叙述；Lite 单 brief 为 exact-token opt-in | 按跨边界/风险触发深度，不强制所有需求维护同量 ceremonial 自报。仍保留可测试性、来源、负例和规划不发明 WHAT。三 seat 自报不算独立审查 |
| API/SDK 产品面 | 模板与 WHAT/HOW 规则易把全部 API 字段等归 HOW；CE plan 规范 owner 以内容职责判断 | 外部可见调用、错误/兼容语义可能本身就是 WHAT；实现结构/内部类型才是 HOW，不凭“API”这个词决定 owner |
| 设计证据 | 本地设计 inventory/read/unread/coverage、degraded owner acceptance 与 finalizer input scan 强于泛 CE 相邻流程 | 保留；receipt 只证明内部引用/hash/声明一致，不证明真的读取画布或设计语义充分；validate 不 materialize provider 输出 |
| 产物与消费者 | 当前 `docs/brainstorms/*-requirements.md`→plan，checker/finalizer 区分 checkpoint 与 ready，plan read-only origin diagnostic | 保留当前 topology 与显式 source refs；不要把 eval-only 单 `docs/plans/` Contract Reset patch 当已实施行为。迁移需 producer/consumer 协同 |
| runtime enforcement | Claude hooks 有确定性部分，Qoder projection activation unverified；其他 host 有 loud degraded | 保留诚实强度分层。包内模板 `50-cli-devtool.md:14,59–65,79` 固定“五宿主”已落后项目八宿主事实，应读取 supported platforms，不手改 runtime |
| 学习与评测 | CE doc-review 后果驱动准入；本地 eval协议明确 structure/replay 不证明模型 outcome | 吸收真实产物/结果评测；不堆独立评分平台。`evaluation-governance.md:32–42` 的旧 out-of-scope 与后续 Gate A 分开说明，不把独立模型/人语义评价等同脚本代替判断 |

## 已确认缺陷和自洽问题

1. **P2，`--refresh-inputs-hash` 未校验 PRD 未变。** finalizer:208–212 只要求唯一阻断码为 stale，不比较旧 `readiness_prd_hash` 与当前正文 hash；:299–310 随后刷新全部 receipt。隔离探针先 finalize，再追加产品正文，preview stale，但 refresh 仍 finalized、verify=true。与 :208–209、help:406“PRD unchanged”合同冲突。建议分别判断 artifact 与 inputs freshness，正文变化不能通过仅刷新 inputs 模式重新签收；不要求脚本判断正文语义。
2. **P2，HOW 关键词被当作语义硬阻塞。** checker:761–762、798–802 与 reason-codes:48 对 question/write-target 中任一 WHAT 词直接 emit blocking `how_pushdown_touches_what`。探针“permission mock文件命名方式”、明确 implementation-only/no/closed 仍阻塞。词表只能是 advisory 候选，真正确定性的声明矛盾仍 hard gate，是否改 WHAT 留给 LLM/owner。
3. **P2，validate 评测可误绿。** `evals/fixtures/scripts/check-validate-report-only.sh:11–34` 仅检查输出关键词和 ORIGIN marker；实际不检查正文 bytes/mtime/receipt 或“已修复”claim。探针改写全部正文但保留 marker，并输出“发现问题，已修复写入”，仍 exit0。现有 validate unit 证明 finalizer check-only 函数零写，不能替代真实 skill 执行结果评测。建议 snapshot 被审 scope 的 bytes/存在性及新增/删除，并检查写入/完成 claims。
4. **P2，closure 状态词不统一。** SKILL:283 / output:221 要求 durable `open/closed/deferred/blocked`；product-expert-lens:44 使用 closed/narrowed/accepted-assumption/owner-capped/outstanding-question/blocker/route-out。需区分 run-local disposition 与 durable state 的映射，不让模型猜 checker 所需值。
5. **评测限制需准确。** route cases 只查 workflow 名字，不能证明没有副作用或真的移交；brownfield case 的禁止 brainstorm 写与允许 headless checkpoint 描述有冲突。`run-contract-reset-arm.js:602–643` 在 isolation 通过后仍返回 `inconclusive/agent_invocation_profile_not_configured`、model_invoked=false，尚无真实 arm runner。盲包仅删除顶层机器标签不保证 body 无 arm 线索。以上不是上线行为证据。
6. **低风险诊断准确性。** `check-glossary-drift.js:140–144` 把所有读取异常当 absent；应分别报 ENOENT 与 unreadable/degraded。输入简易 frontmatter/parser 的支持范围宜明确，不凭猜测宣称其所有 YAML 写法都可用。

## 实际验证与实施顺序

已执行 9 suites / 100 tests，全部通过：validate-mode、finalize-transition、exit-safety、decision-card、finding-schema、hook-contracts、plan-handoff、lite-profile、contracts。详见 `../prd-tests.json` 与 `.log`。执行 4 个隔离探针（含正常 control），脚本 `../prd-probes.cjs`、结果 `../prd-probes.json`；无真实模型/provider/网络调用，临时目录已清理。

先修 refresh freshness 与词表 gate、judge scope 证据；再统一 release闭包/授权/状态词与宿主事实；最后把 CE 有界 concern、规范单 owner 和结果评测整合到当前 topology。Lite 与 eval-only Contract Reset 均不自动转默认。未改产品源码/runtime，未执行独立 fresh-source reviewer、真实宿主/模型及现场收益验证。
