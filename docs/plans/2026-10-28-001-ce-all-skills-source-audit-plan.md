# spec-first 全量 Skill 对 CE 源码审查计划

- 日期：2026-10-28
- 类型：审查执行计划；只读审查，不是实施授权或融合完成证明。
- 目标仓库：`/Users/kuang/xiaobu/spec-first`。CE 仓库只读。
- 基准：以当前 `skills/*/SKILL.md` 全部 38 个 source Skill 为映射清单；其中 34 个纳入深审，4 个按用户最新指令排除，不限 dirty Skill；不以 generated runtime 为真相源。
- CE HEAD：`00d0a5bbf1300b2138b65ce724b325dd4dff77ba`。上游窗口 base：`153e605e1622154a0d7da095fceed13edcb68bf7`。本地身份和既有 dirty 文件 hash 见审查目录 baseline.json。

## 目标与非目标

spec-first 已在 CE 基础上进行深度优化。本轮主目标是：完整理解双方 Skill 的意图与源码，识别 CE 中仍值得集成到 spec-first 的研发能力，并判断如何融入本地既有优化。以 spec-first 的产品定位与研发主链为评判基准，不把 CE 当作必须还原的规范，不把差异或未同步自动等同缺陷。

逐项理解双方执行主线、输入输出、上下文传递、授权/失败恢复、验证与知识边界。每个候选必须说明具体研发场景、双方源码事实、本地是否已有等价或更优实现、尚存缺口、增益与维护成本、最小融合点和验证办法。结论区分：建议集成、已有等价或更优实现、保留本地设计、暂缓实测、不适用；证据不足保持待判断。源码缺陷另行记录，不用缺陷清单替代能力融合分析。没有直接对应的本地 Skill 核对相邻 CE 能力，不伪造一对一映射。

本轮只写审查计划、报告、覆盖账和验证证据，不修被审 source、不刷新 runtime、不执行 workflow 外部写入、不 commit/push/PR。审查不推进原同步完整完成点。

## 当前范围调整（2026-10-28 用户明确指令）

本轮跳过 `spec-app-consistency-audit`、`spec-project-rules`、`spec-rule-miner`、`spec-write-skill`。保留 38 行映射以免遗漏范围事实，但审查验收和完成率分母为 **34 个纳入项**（30 个直接 CE 对应、4 个无直接对应）。4 个排除项标记“用户指定跳过”，不标记审查完成，不形成能力融合结论，不继续读取其资产或依赖闭包；此前读取记录仅保留为历史记录。纳入项若直接引用排除项，只记录调用接口及本项的边界，不借依赖审查重新扩大排除范围。

## 全量重新复核约束（用户最新要求）

前一阶段采用定向引用审查，不满足全量、不抽查要求。此前所有完成状态已撤回；旧笔记仅是待重新核实的线索，不是全量审查结论。

- 逐一审查表中 34 个纳入的本地 Skill，30 个直接 CE 对应项完整对照；4 个纳入的无直接对应项核对全部本地资产及相邻 owner。
- 每个 Skill 目录下全部文件纳入 `full-asset-ledger.json`，包括入口、引用、persona、脚本、schema、metadata、fixture/eval；二进制按类型检查，不伪称逐行代码阅读。
- 每个文本文件逐段完整读取，不以检索命中、摘要、批量读取后不展示内容、hash 或测试通过代替审读。截断部分必须重读。逐段记录行号覆盖与内容 hash。
- 递归追加双方目录外的共享引用和直接源码依赖；新增依赖未读完不得关闭对应 Skill。
- 每项记录双方意图/职责映射、全部资产 disposition、融合结论、问题、优化建议和验证限制；无对应文件不自动视为缺陷。
- 文件读取完整与语义对照完成分别记录。不得用完成入口阅读代替完成 Skill。

## 执行顺序

1. 冻结本地 HEAD、CE HEAD、dirty 内容与范围；列出 38 个 Skill 的映射，明确 34 个纳入与 4 个排除，标记拆分、合并和独有项。
2. 范围调整后从 `spec-simplify-code`、提交接口推进，随后逐项完成其余纳入项，最后收束 `spec-runtime-setup` 与 `spec-work`。34项现已全部完成源码审查。每项均完整读取双方包内资产，并追读具名共享引用、直接源码依赖、consumer和相关测试；截断部分补读，同hash文本复用保留证据。具体范围和未执行行为见覆盖账及逐项笔记。
3. 对每个 Skill 建立研发场景和能力对照，区分 CE 可吸收能力、本地既有增强、意图不同及重复机制；按研发收益、融合代价和边界风险提出建议，不按文本相似度判断融合质量。
4. 对疑似缺陷核对周边与调用方；能用无副作用 fixture 证明的运行最窄复现，必要时运行现有针对性测试。区分新增问题、既有问题、设计差异和缺证据；不由绿色 contract tests 推导语义或宿主效果。
5. 横向核对跨 Skill handoff、字段/schema、权限、路径、shared owners、异常与恢复。同步工具和未跟踪合同作为辅助证据显式纳入，不把所有历史 receipt 当当前完成证据。
6. 完成逐项融合结论、按研发价值排序的集成候选清单、问题附录和验证记录；复核源码 hash 未变。交付最小可维护集成顺序，不把本轮审查当作实施或合入验收。

## 证据及验收

- 所有 34 个纳入 Skill 有独立结论；4 个排除项仅记录用户指定跳过；CE-only Skill 单独列为无本地直接对应，不静默扩大产品范围。
- 每个 Skill 的笔记包含能力对照表：研发场景、CE 实现及 source refs、spec-first 实现及 source refs、已有增强/真实缺口、融合裁定、最小建议、验证与限制。不能仅有读取数量或缺陷列表。
- 每条正式 finding 有准确本地 file:line、触发条件、实际影响、CE/本地合同依据、具体修复建议；同根问题合并，推测不冒充事实。
- 未全文读取的引用、未执行的运行场景和测试如实标记；不声称所有递归资产都已全文审查。
- “完美融合”不作预设结论；单模型源码审查不能证明真实宿主、模型、视觉或 field outcome。当前未明确授权 reviewer dispatch，按 spec-code-review inline fallback 执行并披露独立覆盖缺失。
- 运行证据与审查判断分开；保留失败。必要检查后交付，不以重复测试数代替质量。
- 原有未提交文件保持字节一致；本轮审查 artifacts 不修改原同步 receipts。CHANGELOG 不在只读审查中追加，避免改变被审基线；本轮没有产品 source 变更。

## 产物

- `docs/validation/ce-skill-audit-2026-10-28/baseline.json`
- `docs/validation/ce-skill-audit-2026-10-28/coverage.json`
- `docs/validation/ce-skill-audit-2026-10-28/report.md`
- 同目录逐 Skill 审查笔记与验证日志。
- [逐文件复核索引](../validation/ce-skill-audit-2026-10-28/file-review-index.md)：38 张双方文件对照表；其中 4 张仅保留历史记录与排除状态，不计入完成率；纳入项保留独有文件、读取状态、审查结论和建议。

## 进度

- [x] 规划先落盘；全量映射初表和基线已创建。
- [x] 全量逐 Skill 核对。
- [x] 疑似问题复核与必要验证。
- [x] 跨 Skill 合同与收尾。

收尾状态：34/34源码审查完成，4项按用户要求跳过；[总报告](../validation/ce-skill-audit-2026-10-28/report.md)与[终验记录](../validation/ce-skill-audit-2026-10-28/final-verification.json)记录结论、原dirty保护和证据边界。产品优化未实施，独立评审、真实模型/宿主、视觉及现场收益未验证。

## 全量 Skill 映射与审查台账

状态：待审查 / 审查中 / 已完成源码审查 / 有阻塞 / 用户指定跳过。排除项不计入完成率，也不等于审查完成。只有双方入口、相关执行引用、脚本/合同及直接 consumer 已核对，疑似问题已复核并记录证据与未执行项，才标记已完成源码审查。源码审查完成不等于真实宿主行为已验证。无直接对应项仍审查本地意图及相邻 CE 能力，不强行配对。

每项深审检查：意图与适用条件；执行链与必要上下文；产物与消费合同；失败/恢复；授权与 source/runtime 边界；脚本真实行为；针对性测试；有意差异、遗漏及额外复杂度。优化建议区分已证实缺陷、候选改进和需实测事项。

| 序号 | spec-first Skill | CE 对应 Skill | 审查状态 | 结论 | 优化建议 | 证据/限制 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `autoresearch` | 无直接对应（本地扩展） | 已完成源码审查 | 30包内文件及相邻Optimize/commit/治理接口全读；10项融合裁定，确认scorer字段失配，保留显式可选loop | 先修评分/候选/check协议，再接本地实验和提交owner；补结果/恢复eval，不建立第二研发总路由 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/autoresearch.md)；源码结论不等于宿主效果 |
| 2 | `spec-app-consistency-audit` | 无直接对应（本地扩展） | 用户指定跳过 | 本轮排除，不形成审查或融合结论 | 不继续审查；保留此前读取记录 | 依据用户 2026-10-28 明确指令；不计入 34 项完成率 |
| 3 | `spec-brainstorm` | `ce-brainstorm` | 已完成源码审查 | 58包内文件全读；保留本地WHAT/授权/恢复增强，建议补problem、settled和no-doc闭包 | 先修synthesis本地自洽，再目标/范围标准与结果eval；暂缓视觉及通用跨模型runtime | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-brainstorm.md)；源码结论不等于宿主效果 |
| 4 | `spec-code-review` | `ce-code-review` | 已完成源码审查 | 已全量核对；scope/准入增强保留，存在mechanics与eval共同缺口，非完美融合 | 先修finding地板与修复judge，再窄吸收条件depth、末轮重算和persona证据条目；跨模型保持dormant | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-code-review.md)；源码结论不等于宿主效果 |
| 5 | `spec-commit` | `ce-commit` | 已完成源码审查 | 10 个包内文件及直接提交接口完整核对；核心能力已有等价实现，3 个轻量融合点和评测缺口已记录 | 复用共享 native 消息写入、exclude 与已知 U-ID；保留授权/mixed-hunk/作者保护；补 outcome eval | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-commit.md)；源码结论不等于宿主效果 |
| 6 | `spec-commit-push-pr` | `ce-commit-push-pr` | 已完成源码审查 | 双方24个包内资产与直接接口完整核对；建议吸收项目PR模板、tracker语义与已知决策来源，保留本地提交/外写增强 | 先补模板/close-vs-link和真实状态eval；统一portable recipe；不引入stack/babysit产品面 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-commit-push-pr.md)；源码结论不等于宿主效果 |
| 7 | `spec-compound` | `ce-compound` | 已完成源码审查 | 完整包内及知识合同核对；保留publication增强，复现摘要误绿与正向fixture失败 | 先合同自洽/状态摘要/fixture；吸收parent-owned正文和corpus去重；配置root按需 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-compound.md)；源码结论不等于宿主效果 |
| 8 | `spec-compound-refresh` | `ce-compound-refresh` | 已完成源码审查 | 双方41文件全读；worth/失效条件核心已融合，保留本地候选发布和权限，窄化吸收历史术语消费者及cue覆盖 | 先补知识保留和发布失败结果eval；不并列retire_when、不恢复自动landing或全词表扫库 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-compound-refresh.md)；源码结论不等于宿主效果 |
| 9 | `spec-debug` | `ce-debug` | 已完成源码审查 | 双方31文件与shared closeout/LFG直接消费完整核对；补复现仪器、性能归因、missing-seam和proof-test，保留本地source/授权/证据 | 优先集成复现/性能/测试保护，消除隐式port/未来CI措辞，增强全角问句和真实行为eval | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-debug.md)；源码结论不等于宿主效果 |
| 10 | `spec-doc-review` | `ce-doc-review` | 已完成源码审查 | 全量核对完成；保留report-only与任务包增强，吸收后果准入/证据重评，复现judge漂移 | 先修schema/eval/Withdraw闭包，再融合语义准入/去重与恢复幂等；跨模型保持dormant | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-doc-review.md)；源码结论不等于宿主效果 |
| 11 | `spec-dogfood` | `ce-dogfood` | 已完成源码审查 | 双方21包内文件与browser直接合同完整核对；优先吸收criteria证据链、stale-rule和知识去重，保留本地授权/owner边界 | 先补criteria与resume/server身份；不直接导入Pack分发器，增强零调用结果eval | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-dogfood.md)；源码结论不等于宿主效果 |
| 12 | `spec-explain` | `ce-explain` | 已完成源码审查 | 双方24包内文件及直接测试完整核对；建议吸收行为trace和理由分层，保留持久教学定位 | 先补trace/理由和真实fallback eval，再融合source links/provider边界；不扩发布面 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-explain.md)；源码结论不等于宿主效果 |
| 13 | `spec-handoff` | `ce-handoff` | 已完成源码审查 | 双方27包内文件与直接caller完整核对；CE主要能力已具备，保留持久writer和已授权继续分支 | 补真实受管路径、HEAD差分与继续执行eval；不导入临时store/一律等待 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-handoff.md)；源码结论不等于宿主效果 |
| 14 | `spec-ideate` | `ce-ideate` | 已完成源码审查 | 双方48文本资产全读；主要发散/证据链已融合，建议补唯一dossier、杠杆排序与数量/预算闭包 | 先局部自洽，再分层样本与结果eval；保留独立授权/单次scratch/Brainstorm决策owner | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-ideate.md)；源码结论不等于宿主效果 |
| 15 | `spec-lfg` | `lfg` | 已完成源码审查 | 双方35文件及work return/watch机制全读；保留本地验证和权限，确认未观测时间计入quiet window | 先补watch连续观测和feedback completion；复用当前plan/发布owner；不复制CE通用路由/stack合并 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-lfg.md)；源码结论不等于宿主效果 |
| 16 | `spec-optimize` | `ce-optimize` | 已完成源码审查 | 全包及6组测试源码核对；8探针确认样本/噪声与worktree缺口，保留独立holdout增强 | 先数据保护与真实样本地板，再定位/Goodhart/比较身份/报告；remote调度暂缓 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-optimize.md)；源码结论不等于宿主效果 |
| 17 | `spec-plan` | `ce-plan` | 已完成源码审查 | 双方包内全读及work/task-pack消费者核对；55测试通过但复现3种judge误绿，不能整包覆盖 | 保留字节级WHAT/授权/readiness；吸收concern裁定、稳定KTD、研究dossier和决策去重，先修自洽与eval | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-plan.md)；源码结论不等于宿主效果 |
| 18 | `spec-polish` | `ce-polish` | 已完成源码审查 | 47文件6825行全读；本地启动/授权更强，CE反馈及恢复闭环可窄吸收；7组共有边界证据复现 | 优先修resolver输入与Procfile事实选择；补反馈/验证/residual；暂缓整体语音/远程runtime | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-polish.md)；源码结论不等于宿主效果 |
| 19 | `spec-pov` | `ce-pov` | 已完成源码审查 | 双方全包与直接合同核对；三类subject半融合，隔离复现worker绕过和judge误绿；正常peer仍degraded | 先补worker/admission/schema，再统一subject/grounding；窄吸收callee证据、owner与最小实验，不导入品牌推定独立性 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-pov.md)；源码结论不等于宿主效果 |
| 20 | `spec-prd` | 无直接对应（本地扩展） | 已完成源码审查 | 全包与直接hook/consumer核对；保留产品WHAT/receipt，复现refresh越界、语义词表阻塞和judge误绿 | 先修freshness/词表gate/评测，再统一release闭包与授权；有界吸收CE单owner和concern，不上线eval-only拓扑 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-prd.md)；源码结论不等于宿主效果 |
| 21 | `spec-product-pulse` | `ce-product-pulse` | 已完成源码审查 | 双方20包内文件完整核对；CE核心已具备，本地证据/privacy更强，发现共有路由与评分歧义 | 保留本地增强；先统一metric source默认值、not-run枚举与结果eval | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-product-pulse.md)；源码结论不等于宿主效果 |
| 22 | `spec-project-rules` | 无直接对应（本地扩展） | 用户指定跳过 | 本轮排除，不形成审查或融合结论 | 不继续审查；保留此前读取记录 | 依据用户 2026-10-28 明确指令；不计入 34 项完成率 |
| 23 | `spec-promote` | `ce-promote` | 已完成源码审查 | 双方14包内文件和noslop/auth接口完整核对；核心等价，保留本地egress/失败receipt增强 | 收敛空draft commentary例外、准确交付claims和结果eval；不扩发布或config层 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-promote.md)；源码结论不等于宿主效果 |
| 24 | `spec-prototype` | `ce-prototype` | 已完成源码审查 | 建议吸收隔离页面批注与针对性craft floor；保留loopback/token自停和产品owner边界 | 先统一授权/eval和stop文案，再最小reload，最后真实任务验证可选批注 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-prototype.md)；源码结论不等于宿主效果 |
| 25 | `spec-resolve-pr-feedback` | `ce-resolve-pr-feedback` | 已完成源码审查 | 双方35文件及LFG直接接口完整核对；中央判断已融合，建议补caller-owned可恢复conversation尾部，保留独立授权和失败证据 | 先接pending-actions消费者和publication证明；精确repo示例与隔离结果eval；不默认自动commit/外发/模型裁定 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-resolve-pr-feedback.md)；源码结论不等于宿主效果 |
| 26 | `spec-riffrec-feedback-analysis` | `ce-riffrec-feedback-analysis` | 已完成源码审查 | 核心反馈证据链已融合，保留隐私/快照增强；隔离复现4项证据表达缺口 | 先聚合egress receipt和partial coverage，再补事件事实/结果eval | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-riffrec-feedback-analysis.md)；源码结论不等于宿主效果 |
| 27 | `spec-rule-miner` | 无直接对应（本地扩展） | 用户指定跳过 | 本轮排除，不形成审查或融合结论 | 不继续审查；保留此前读取记录 | 依据用户 2026-10-28 明确指令；不计入 34 项完成率 |
| 28 | `spec-runtime-setup` | `ce-setup` | 已完成源码审查 | 双方全包及直接consumer已核对；保留runtime增强，隔离确认悬空symlink越界/Git污染/命令身份缺口 | 先修共享路径和Git runner，再统一命令/文档/consumer；窄吸收按需能力与原owner修复，不导入Pack和跨模型runtime | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-runtime-setup.md)；源码结论不等于宿主效果 |
| 29 | `spec-simplify-code` | `ce-simplify-code` | 已完成源码审查 | 双方27包内文件及24直接依赖全读；9项融合裁定收敛，保留本地WHY/授权，优先proof-test与结果eval | 先接caller proof-test保护与真实产物eval；条件式测试价值lens；不默认五reviewer或删除注释 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-simplify-code.md)；源码结论不等于宿主效果 |
| 30 | `spec-strategy` | `ce-strategy` | 已完成源码审查 | 双方18包内文件及pulse直接消费合同完整核对；核心等价，建议窄化吸收判别式压力测试和拒绝原则 | 保留本地标题/ownership；先补压力测试质量与真实diff评测 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-strategy.md)；源码结论不等于宿主效果 |
| 31 | `spec-sweep` | `ce-sweep` | 已完成源码审查 | 源端去重/租约/计划主能力已融合；保留本地授权与持久状态增强，4项floor反例复现 | 先锁/close证据floor，再版本UTF-8、shared publication与媒体授权packet | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-sweep.md)；源码结论不等于宿主效果 |
| 32 | `spec-test-browser` | `ce-test-browser` | 已完成源码审查 | 双方14文件及真实LFG消费合同完整核对；保留唯一owner，复现vitals先于open及producer忽略cleanup | 先补顺序/cleanup，再按等价能力实验自适应/native；不导回server管理 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-test-browser.md)；源码结论不等于宿主效果 |
| 33 | `spec-test-xcode` | `ce-test-xcode` | 已完成源码审查 | 双方9个包内文件完整核对；多数核心能力已有等价/更强实现，可窄化吸收flow推导与操作结果观察 | 补bundle ID来源、setup准确handoff和零调用eval；保留source绑定/URL/Fail边界 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-test-xcode.md)；源码结论不等于宿主效果 |
| 34 | `spec-work` | `ce-work` | 已完成源码审查 | 双方77包内文本与14直接接口全读；保留task-pack/授权/最终树增强，确认5类judge误绿及Figma合同冲突 | 先修结果eval并与simplify/Debug接proof-test保护，再吸收同frame/token比较；不导入外部runtime或自动提交 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-work.md)；源码结论不等于宿主效果 |
| 35 | `spec-worktree` | `ce-worktree` | 已完成源码审查 | 双方17包内文件完整核对；复现路径逃逸和remote-only detached，work forward边未建立 | 先修containment/ref一致性并补caller合同；native/fork能力有条件吸收，保留env/trust边界 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-worktree.md)；源码结论不等于宿主效果 |
| 36 | `spec-write-skill` | 无直接对应（本地扩展） | 用户指定跳过 | 本轮排除，不形成审查或融合结论 | 不继续审查；保留此前读取记录 | 依据用户 2026-10-28 明确指令；不计入 34 项完成率 |
| 37 | `spec-write-tasks` | 无直接对应（本地扩展） | 已完成源码审查 | 23包内文件及CLI/work/doc-review直接接口全读；保留可选派生层，复现路径/symlink及runtime边界误绿 | 先统一路径owner与结果eval，再无损投射proof/settled/external done intent；不复制CE默认并行或自动commit | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/spec-write-tasks.md)；源码结论不等于宿主效果 |
| 38 | `using-spec-first` | 无直接对应（本地扩展） | 已完成源码审查 | 本地11文件及CE相邻入口完整核对；保留单owner轻量路由，source/runtime差异已留证 | 增强真实routing eval与包外引用投射检查；不把CE模型carrier搬入入口 | [逐项笔记](../validation/ce-skill-audit-2026-10-28/skills/using-spec-first.md)；源码结论不等于宿主效果 |

审查中断或恢复后先核实基线；每完成一项同时更新此表和 coverage.json，笔记保存具体 file:line 与验证依据。
