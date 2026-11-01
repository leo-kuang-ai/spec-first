# spec-plan 全量源码审查

结论：保留 spec-first 对 WHAT/HOW、来源、历史接续、授权、跨宿主和高风险研发场景的增强；吸收 CE 在研究成本、concern 裁定、规范唯一 owner、稳定决策引用和审查闭环上的改进。不能整包覆盖：CE 的无 status/readiness、Product Contract 可重构、HTML reviewer 可编辑、默认更广 dispatch 不适配本地现有消费者。当前存在内部文案冲突与 eval 假阳性，不能声称完美融合。仅完成源码审查及建议，未实施。

## 全量范围和事实来源

双方 `skills/spec-plan/`、`skills/ce-plan/` 全部入口、引用、代理、渲染、脚本、eval/fixture 全文核对；同 SHA256 已完整阅读的资产复用原记录，清单见 `../file-tables/spec-plan.md`。CE 角色契约和外围能力按既有审查记录引用，不把名称相近当作完全同源。直接消费者包括 spec-work 的入口、metadata-first intake、bounded reader、caller return/execution-engine；task-pack 编译器及已审脑暴/doc-review/lfg/handoff 按相同内容复用。额外全文读本地 4 个新合同测试、CE `ce-plan-output-mode.test.ts`，本地既有 plan/helper/settled 测试同 hash 复用。

## 能力逐项裁定

| 能力 | 双方事实与意图 | 集成裁定、边界与验收 |
|---|---|---|
| 规划输出分级 | 两方 Direct/Chat/Durable；CE 在 Lightweight Durable 收窄研究和 dispatch，本地保留较完整 research | 吸收 CE 的小任务 inline 有界读与空 solutions 不派 learnings。仍按鉴权、支付、迁移、外部合同、不可逆性重新分级，不把小文件数当低风险 |
| Product Contract | 本地 intake:60 起要求上游 region 字节保留，冲突回 owner；CE 允许 meaning-preserving restructure | 保留本地。增加章节或规范去重只能改 planning-owned 内容；不能借“等义”改变产品 ID、顺序或原文，也不能由 headless 默认决定 WHAT |
| 研究事实与成本 | CE research 和代理 return 使用 gist + path；本地有 source identity、dirty/provenance 和授权 fallback | 吸收短回传与 dossier 路径；作者可按决策需要读原 evidence，读取失败不算完成。不把短摘要当完整研究，也不强迫所有 worker 产文件 |
| 当前行为 trace | CE research 1.4c 区分 existing behavior/design rationale 与 pattern inventory | 吸收 trigger/state/owner/failure/untraced 的按需 trace；复用本地 explain intent，直接读源码始终可行。不为每次 plan 强制额外 Skill 或独立 agent |
| concern 与 scope | CE structure 3.8 区分待核 claim、既有合同和新增机制；本地主要将 scope-adjacent 工作 defer | 吸收“是否有具体 harm、及时发现是否足够、后补代价是否高”的语义裁定；逐 guard 判断，使用最小机制。明确 considered-and-not-built 与重估条件；不把已否决 concern 塞入 deferred tasks，不搬“拿不准就 build”，不擅自限缩用户明确范围 |
| 一条规范一个 owner | CE sections/structure 强化 R 管 WHAT、KTD 管 HOW、unit 管 local delta；例子和流程不得反向定义规则 | 吸收。引用 owning R/KTD，避免 Requirements、AE、HTD、unit 复制不同版本。外部 authority 用精确引用，不用长摘要制造第二合同 |
| 稳定决策身份 | CE 要求稳定 KTD 编号、Governs/Covers、settled-decision 跨阶段承接；本地已有 KTD-ID/反向链接但 registry 主要规定章节 | 明确 KTD 稳定不重排、不复用已退役编号；跨 plan/task/work/review 保留引用和真实 user provenance。Product Contract 内变更仍回 product owner |
| settled 与审查 | CE 不向 adversarial reviewer 传 settlement advocacy；本地已禁止 settled 压制 current invalidating evidence | 吸收盲 settlement markers，保留 source 和实际 invalidation。不能把推断、沉默、headless 默认升级为用户已批准，也不抹去实际反证 |
| finding 处置闭环 | CE final-review/handoff 由 producer 核对实际后果、现有 plan 是否已解决，更新 counts，不重复报告 dismissed/completed | 吸收 owner 裁定与 current-count 闭环，保留原 finding/evidence 和 disposition。裁定不是未经授权修改产品；缺独立审查仍 degraded，不用 self-check 冒充 independent pass |
| Objective / Means | 本地已有 outcome altitude、Goal Capsule、thin handoff；CE 更清楚区分用户结果与 chosen means | 合并增强，Means 一行引用 owning KTD，Objective 不用内部机制名冒充用户结果。避免另增一套重复 capsule |
| bootstrap 产品质量 | CE sections 对 actors/flows/success criteria 的 conditional catalog 更完整；本地 intake bootstrap较短 | 吸收适用时的 actor/flow/outcome guidance；Requirements 满足不自动等于业务效果。仅用于 bootstrap 缺口，已有上游 WHAT 不重写 |
| 跨领域工程 lens | 本地 frontend/interface/high-risk、reuse/extend/compose/new、telemetry proof 与 production-fidelity 比 CE 更贴合具体研发场景 | 保留条件触发、negative owner 和验证 owner，不换成泛 checklist；低影响任务不堆企业附录 |
| 格式与 pipeline | 本地 output-mode:21 和 resume:43 强制 pipeline MD；CE 保留显式格式偏好。本地 work reader 与 12 个 replay fixture 已支持 HTML | 建议先评估移除“下游只可靠解析 MD”的过时理由，明确用户格式优先；保留本地 HTML report-only reviewer / bounded producer recompose。没有真实宿主证据前不宣称格式行为已改善 |
| 转换与唯一产物 | 本地 intake 对 requirements-only sibling 有 canonical 选择，但两份 implementation-ready sibling 没有同等规则；旧 HTML 留存，handoff又说 never both | 建议格式转换记录 durable supersession/canonical notice，旧 source 保留、不静默删除，不仅口头报新路径。consumer 对两个 ready sibling冲突应明确处理，不能仅按时间猜 |
| 文件 reservation | 本地 structure 用扫描同日 NNN；saved chat brief 已规定 exclusive creation；CE 明确原子 reservation | 吸收一致的 exclusive create / collision retry，避免两个会话覆盖同名计划。低影响，不需要新中央状态服务 |
| author/research 模型 | CE reasoning elevation、bakeoff、provider worker script 丰富；本地授权与 serving receipt 更强 | 不默认引入新 competition workflow。仅结构性 HOW 未发展、回滚昂贵且预算/dispatch/数据权限明确时可选对照；模型 requested/actual/observed 分离 |
| 持久 knowledge/packs/config | CE learnings 支持 applies_when、pack 证据与 malformed 报告；本地 solutions 机制已在 compound 审查 | 可吸收匹配语义、当前源码冲突提示、短结果；docs_root/Compound Packs/config layers 暂缓，不为上游存在就增加新来源体系 |
| handoff | 本地已经授权的完整任务交回 owner继续、明确 goal 能力分支；CE menu/自动 tail 语义不同 | 保留本地，不重复询问已授权动作；计划产物不产生实施授权。未启动 review 与启动后失败分开记录，skill_unreachable 不可伪装审查完成 |
| status/readiness/tasks | CE 删除 status 并淡化 artifact_readiness；本地 work/task-pack依赖生命周期、readiness、source hash | 不移植删除。若未来迁移必须先有跨 producer/consumer合同与兼容证据；不能以 git commit替代验收，旧 pins不重绑 |

## 已确认的自洽与验证缺口

1. **P2：父级禁止跨 run profile、子代理仍允许共享缓存。** 本地 `research.md:25` 要求每 run current-tree orientation；`agents/repo-research-analyst.md:29-30` 仍要求 scoped technology 不在范围时读取共享 repo-profile。CE 同一位置改用 caller context 加一次 targeted probe。建议统一为当前 source identity 下可验证的在场事实，不能只按 HEAD 复用而漏 dirty/branch/worktree。
2. **P2：规划评测可错误通过（隔离复现）。** `check-r2-no-code.sh:6`、`routes-to-execution.sh:11` 只在文件存在时找分页/month关键词；删 `src/server.js` 后两者均 exit0。`check-product-blocker.sh:12-13` 仅 diff tracked文件，新增 `src/new-implementation.js` 仍 exit0。见 `../plan-judge-probes.json`：2 个无改动 control和3个反例，未运行真实模型。建议固定 scope snapshot 覆盖新增/删除/rename/字节变更，关键词只作辅助；前两项测试也不能证明实际路由到 spec-work。
3. **P2：代理研究权限/authority 共同遗留。** 两方 best-practices-researcher:17-18 扫 runtime/home Skill，:75、:106 将 curated Skill 放最高 authority；两方 slack-researcher:16 将 silence 当 consent，:59、:119 把认证等同私有频道搜索权限。父级的 source/runtime、显式数据权限和 evidence 边界更严格，应落实到叶代理，不移植上述假设。本审查未访问 Slack或用户凭据。
4. **P2：规划 KTD/模块与 inferred 文案冲突。** 本地 `synthesis-summary.md:71-73,113` 全禁文件/模块名，:177-192 又允许决策就是模块的场景；:369 全禁 inferred进入KTD/units，:398/407 又按 mode分类。CE新版 decision-level条件可解决前者；双方都不能把 inference当confirmed。建议允许带来源和影响的显式规划假设进入 HOW、同时不借假设越过真实 WHAT blocker。
5. **P2：hard floor 与格式owner需统一。** 本地 `plan-sections.md:320` 允许 Problem Frame合Summary，与统一plan固定位置/只读产品region冲突；CE限 legacy/non-unified。`structure.md:30` conventional prefix与sections:384-389禁止title prefix冲突（双方遗留）。:191禁exact testrecipe需要与Verification Contract repo-specificcommands区分：计划写验证意图/适用命令，不写机械实施编排。应改真正owner，不再堆一条覆盖规则。
6. **P2：通用代理阈值伪装项目标准。** 两方 performance-oracle:56-62 强制200ms/5KB/O(nlogn)未绑定workload/SLO；security-sentinel:38 广域grep可能裸打印secret，且worst-case与credible-threat结尾不一致。建议阈值降为条件示例，以当前项目需求和真实路径为准；secret只输出受控位置/脱敏摘要，不执行通用危险扫描。data-migration 的代码/SQL建议要服从caller规划只读边界。
7. **依赖可达性/成本。** 本地 approach-altitude:45直接fireSkill但无fallback，入口允许等价owner读取；CE明确unreachable receipt。应统一缺能力与未启动。阶段重读的原意是防缓存/漏owner，不能无证删除，但可在真实trace中评估按内容hash与阶段依赖减少重复上下文。

## 验证、落地顺序与限制

已运行本地 `spec-plan-contracts`、`spec-plan-reference-contracts`、`spec-plan-quality-contracts`、`spec-plan-consumer-replay-contracts`、`spec-prd-plan-handoff-contracts`：**5 suites / 55 tests 全通过**，见 `../plan-tests.json`、`.log`。其中大部分是prose pin/fixture结构验证，consumer replay不是实际LLM执行。另运行5个可丢弃临时仓库judge探针；没有修改被审产品文件，没有执行CE provider脚本或真实模型调用。

最小顺序：先补评测scope证据与叶代理authority自洽；再统一synthesis/格式/标题/原子reservation；再吸收concern裁定、稳定KTD和研究dossier；最后冻结真实研发任务验证token成本、遗漏率、返工和用户时间。保留原dirty工作，不改runtime。独立fresh-source模型审查、真实宿主/外部工具/现场收益均未执行，不将源码裁定提升为行为收益。
