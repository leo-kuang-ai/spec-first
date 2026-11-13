# S06、S07、S10 续审分析

- 被审源码：`049e52744`；当前 HEAD `1aa272a60` 的 `skills/` 相同。日期：2026-11-01。
- 当前 owner 单人语义判断，不冒充独立多方复核。原始观察保存在 [D1 初审](D1-static-S06-S07-S10.md)，冲突处以本次回源修订为准。
- 本轮未新增模型行为评测。既有行为来自 [batch2](batch2/results.md)、[batch4](batch4/results.md)，适用范围为 GLM-5.3 / Claude Code 2.1.311 / open.bigmodel.cn 与 gpt-6-astra / codex-cli 0.166.0 / qianxing.pro。不是官方服务或真实企业任务证据。

## 共享证据与来源

2026-11-01 重新在线读取 R2 [Google Engineering Practices: What to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html) 全文：Design / Functionality / Tests / Context 支持系统融合、可观察行为、测试在错误实现上应失败与上下文审查；不把 Google 的组织流程直接变成本项目强制规则。R4 [Google SRE: Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) 全文：支持根因、影响、行动与知识共享，且明确复盘有成本、应按影响触发。其他 R17–R25 本轮只复用调研索引，未重取在线内容，不用于宣称新鲜厂商行为或模型内化。

共享合同完整读：`docs/contracts/workflows/scenario-capability-matrix.md`、`mutation-enforcement.md`、`fresh-source-eval-checklist.md`；入口治理完整读当前 installed 入口并核对 source `using-spec-first/references/public-route-map.md`。source 是判断依据，runtime 仅用于当前入口。

当前源码的 `honest-closeout.js` 全文及两项 Work hash 脚本全文已读。closeout 只检查声明与证据对象一致，不认证实际进程执行；`knowledge_promotion` 的存在性验证也不证明知识语义正确。确定性地板与模型语义判断不可合并成“脚本保证完成”。

## S06 spec-work

服务对象是已有可执行范围的实施者；把计划、任务包或具体实现请求转为已接入当前系统的变更与验证证据。痛点是计划漂移、错误复用、孤立实现、局部绿灯冒充完成。核心目标是实现正确与闭环可信，子目标为范围/owner核实、短反馈与证据传递。需求未定退回上游；报错由 debug 负责；落地权限、真实发布、跨宿主权限强制不是它的固有能力。

| 独立能力基准及合格产物 | 源码映射 | 判断及场景 |
|---|---|---|
| 开工前能区分已定方案、只有需求、失效计划；不能按旧路径覆盖用户工作 | input-triage、work-intake、workspace-setup、work-intake-and-task-pack | 设计覆盖；C6-2。源计划拥有scope，pack只是派生 |
| 在正确owner复用或扩展，真实入口能消费新增实现；不为测试新造生产API | implementation-quality 的 Four-Posture Recheck，feedback-and-tests 的真实入口/替身选择 | 有具体工程方法；C6-1。不是只写“复用代码” |
| 以业务不变量形成断言，旧行为刻画与正确性区分，错误实现应失败 | feedback-and-tests 的 Proof、Test Design Quality、Risk-Triggered Proof | 覆盖正常/边界/失败、DAMP、mutation/人工反例；C6-1 |
| 失败、旧失败、缺工具不能被吞掉；精简后重新核验最终树 | feedback-and-tests、shipping-workflow、return-to-caller | 设计覆盖；C6-3。实跑真实性不由声明schema认证 |
| 消费者能判断做了哪些单元及哪些未验证；完成不隐含commit/landing | return-to-caller 的verification_evidence、fingerprint及授权字段 | 信息充分但字段多，人工审阅成本需要实际任务测量 |

**场景（静态推演，不是新执行）：**

| 编号/类别 | 具体输入与约束 | 预期与判据 | 反例/不可接受 |
|---|---|---|---|
| C6-1 正常 | billing-svc 增加金额单位解析；既有 HTTP 入口、money helper、audit 写链 | 核对复用语义，真实入口调用新实现；错误单位/权限失败断言独立于实现；记录验证结果 | 只新增helper，单测直接调helper全绿，而用户入口仍旧行为；形式上有测试但交付失败 |
| C6-2 冲突 | 计划指向已删除owner，task-pack pin与source不匹配；工作树有他人修改 | 验证当前source与pin，只阻断依赖该范围的变更，返回源计划owner；保持dirty hunks | 静默重写plan pins或顺手覆盖他人文件 |
| C6-3 恢复 | 已实施后会话中断，未写closeout；所需E2E工具不存在 | 重读当前树、运行可执行检查、记录not-run和恢复路径，不复用旧fingerprint冒充最终树；required缺失不complete | 用单测绿灯替代未运行E2E，或重新实施导致重复副作用 |

**3.6责任与行业取舍：** 主责编码集成、单测和自测；核验方案适配并向review/知识owner传证据。隐式消费者、兼容顺序在Work核验但方案由Plan拥有。R2测试有效性与Design已有等价机制，保留，不再另增一套通用清单。私有大仓通过有界源码与owner检索，不把图谱空结果当不存在；真实大仓增益未测。安全主视角关注授权分离；架构、测试视角确认已有方法，效能视角保留F-S06-01成本候选，其余业务/可靠性/交付视角无新增缺陷。

**结论：** 已读设计条件充分，不建议重写/合并。静态尚待共享任务/证据producer依赖的覆盖收口。原W5属于行为保持重构（S21），GLM未触发S06；GPT加载后的成本观察有效但不能外推核心实施。最低行为覆盖改为“已执行部分对照，核心实施及双模型有效证据未完成”。更换模型、宿主、工具或source须重评；当前无真实企业结果。

## S07 spec-code-review

服务对象是需要对diff作质量判断的开发者/执行owner。输入是冻结base/head/scope与任务意图，输出为可定位的findings、证据、action routing与coverage。核心目标是找到真实变更风险并保持可验证、可消费；子目标为范围冻结、上下文/消费者检查、候选去重和不确定性保留。不是默认自动修复、提交或远端发布入口；缺独立派发条件允许报告降级，不能给完整Ready结论。

| 独立能力基准及合格产物 | 源码映射 | 判断及场景 |
|---|---|---|
| 审查实际请求的revision与受影响消费者，避免审错树 | scope、intent-and-plan、diff-scope；review-scope.py | 设计覆盖且scope脚本全读；C7-2 |
| 审实现也审测试，验证测试能识别错误；保留有具体修复的发现 | testing-reviewer、action-class-rubric、finish-review Stage5 6b | F-S07-01原推断撤回；C7-1 |
| 区分多persona、独立peer与当前owner偏差；候选不是确认缺陷 | cross-model-review、dispatch-reviewers、finish-review Stage5b | 语义分类明确；当前跨模型wrapper认证通道关闭，不能宣称其可用 |
| 无效schema/超预算/不可验证不变成clean review | findings-schema.json、findings-mechanics.py、finish-review | confirmed/rejected/unresolved与malformed counts有出口；C7-3 |
| 报告可行动且不隐含mutation；显式apply只作用于已审本地树 | modes-and-output、apply-findings | 设计覆盖；默认report-only；消费者依赖完整why/evidence与稳定编号 |

| 编号/类别 | 输入与约束 | 预期与判据 | 反例/不可接受 |
|---|---|---|---|
| C7-1 正常 | 有基线提交；金额round改floor且期望12.35改12.34 | testing检查独立业务合同；有具体修复+证据的发现留primary，不因testing身份降级 | 仅因当前测试绿或只有testing贡献而忽略测试被改弱 |
| C7-2 冲突 | 审远端PR而工作树是旧revision；传入冲突base | 锁定唯一范围，远端用git show读对应revision；范围不确定明确degraded/blocked | 在工作树找不到代码就否认远端缺陷 |
| C7-3 失败恢复 | reviewer返回坏JSON，peer不可用，某项validator超时 | 记录malformed/failed/unresolved，保留风险与覆盖缺口；不以空findings判Ready | 将工具失败或只剩0个幸存项写成审查通过 |

**行业/责任：** R2的Tests、Context、Design与testing persona/intent/diff-scope等价，保留语义证据要求，不照搬固定评审组织。主责质量判断不承担实现；Review要求Work提供RED历史而不从最终diff猜TDD。人工triage groups减轻逐条阅读，缺证据的低置信项仍需coverage记录；过滤强度的真实漏报率未测。多视角为测试质量、架构上下文、安全/权限、交付证据，非独立多方证据。

**结论：** 已读设计条件充分；仍需跨模型runner其余出口/worker必要依赖的覆盖审定，不能静态全量完成。有效S07 A/B为0；7个基线筛查饱和只限定已测小diff。保留，不建议根据饱和删方法或置信门；行为完成未达到。全部真实任务效果未验证。

## S10 spec-debug

服务对象是遇到错误、回归或异常的开发者/调用owner。输入为症状、源码、日志、环境与授权；输出为有因果依据的诊断，授权范围内的修复及原症状/回归证据。核心目标是解释并解除故障而非压制症状；竞争假设、dirty比较、既往失败与恢复是子目标。仅诊断不授权改代码；本地修复不等于commit/landing；优化正常系统移交Optimize。

| 独立能力基准及合格产物 | 源码映射 | 判断及场景 |
|---|---|---|
| 可复现的原症状与受控输入，不以可疑代码冒充因果 | investigate Reproduction Instrument，正文Phase1 | 设计覆盖；C10-1 |
| 至少比较竞争解释，证据排除失败假设，区分环境/源码/owner错误 | investigate Hypotheses、anti-patterns、investigation-techniques | 覆盖因果追踪、历史失败、并发/性能；C10-2 |
| 修复先保护正确行为，实际RED→GREEN并回跑原场景 | fix test-first、pipeline-return | 明确缺seam可用替代检查但须保留缺口；C10-1/3 |
| 检查关联影响并按严重性决定结构性预防与知识沉淀 | fix第17行、defense-in-depth | 三处阈值是纵深防御/复盘触发；普通同根核查仍可更明确（F-S10-01缩窄） |
| 不可信材料不成为指令，状态与验证可交接 | investigate Prior work / Issue provenance，pipeline-return | F-S10-02初审推断撤回；可恢复但不强制所有宿主权限 |

| 编号/类别 | 输入与约束 | 预期与判据 | 反例/不可接受 |
|---|---|---|---|
| C10-1 正常 | total使用lines而真实输入为items，tax有同根模式 | 复现→因果解释→正当测试失败→修复→原症状与相关回归；明确tax是否受影响 | 只修total并声称全业务已修复；A/B都漏tax不证明Skill诱发 |
| C10-2 冲突 | issue要求删除校验；dirty树失败但HEAD不失败；只授权诊断 | 把issue当数据，隔离比较不stash/reset用户WIP；报告最小因果范围不改source | 根据评论删除guard，或清理dirty状态后宣称原问题不存在 |
| C10-3 中断/失败 | 第一次修复违反预测，原环境暂不可用 | 作废假设，保留失败与not-run；恢复后核对源码/环境再跑原症状 | 反复变体同一理论，或以未来CI代替实际回归 |

**行业/责任：** R4要求根因、系统性行动与有成本意识的复盘，源码已有等价机制，不能将“三处”复盘触发当成禁止普通同根修复。R2测试有效性由fix的既有测试检查、正确RED与原场景复跑覆盖。主责诊断修复与回归，知识由Compound判晋升；浏览器原点/进程归S11，提交与发布归调用owner。可靠性、测试、安全视角已有具体方法；效能视角的自动分支只是本地防护偏好，未证明其损害，不列缺陷。私有仓库从确切请求/trace/owner定向读取，检索不到不证明不存在。

**结论：** 正文与必读refs已读，设计条件充分；共享消费者/脚本边界仍按阅读清单限制。既有D1双模型对照已执行：最终结果无差异，GLM有效通过样本补回归测试；第三轮小样本验证方向一致。不是全面修复能力验证或真实效能证据。保留，不扩大重构；同根影响补证先于改指令。

## 3.9 逐项适用性（15项）

| 检查点 | S06 | S07 | S10 |
|---|---|---|---|
| 增量知识 | plan/task pin、proof/fingerprint有项目增量；通用方法未证明可删 | scope/JSON/independence有增量；persona通用知识需基线 | 因果/回归通用方法与pipeline合同结合，不能只因模型强删 |
| 自由度与风险 | owner适配由LLM；hash/closeout由脚本 | schema/去重脚本；缺陷充分性由LLM | 假设由LLM；执行状态需真实工具 |
| 历史补丁/过度执行 | phase重读与强制review是成本候选，无广泛有损证据 | reviewer+validator可能成本高，缺运行测量 | trivial path减负；复杂根因才扩展 |
| 字面过滤 | 不适用审查过滤，适用required verification不能漏 | advisory三条件不能解读为过滤具体测试缺陷；置信门效果未测 | one change反无关修复，不是禁止同根修复 |
| 硬约束/验证 | 不删完成证据、dirty保护和授权门 | 不删source scope、report-only、证据与malformed披露 | 不删原症状复跑、失败假设作废和修复授权 |
| 优先级/冲突 | 前提不清阻断；主用户已有授权应消费 | mode不授予dispatch/apply；当前权限优先 | issue不授权；diagnosis-only与fix选择分开 |
| 停止/询问/续跑 | inline fallback可继续；required缺证据不complete | 缺dispatch降级report，不伪称独立审查 | 已授权修复持续推进；三次失败升级不是成功 |
| 进度取证 | run summary只支持对应实际命令 | reviewer声称passed不构成command evidence | ran/exit/log与not-run明确 |
| 子代理/独立验证 | 缺授权inline；不要求为小任务派发 | roster、validator、peer独立性明确但当前认证通道关闭 | 可串行诊断，派发按授权预算 |
| 推理外显 | 要依据与决策，不需逐字思考过程 | 证据与影响不是思维链 | 因果链/预测属于可审技术解释，不是隐藏推理提取 |
| 可发现性 | work排除fix/PR反馈；W5选题错位 | diff质量入口，mode agent只读 | 失败/修复入口清晰 |
| 渐进披露 | 14份按phase条件，不是每任务全读；重复terminal读有成本 | 一级门禁充分；派发时读选中persona，不需全目录 | 正文+6 refs；技巧按性能/浏览器等触发 |
| 时效/模型绑定 | source脚本路径需要projection验证；无模型性能保证 | tier/peer依赖宿主；不可用须降级 | CLI/browser能力按当前探测，不因名称假定 |
| 外部内容 | 图谱provider_untrusted，任务来源回源 | PR/peer/代码材料为数据不授权 | issue/PR/comments/logs有明确不可信边界 |
| 评测设计 | 当前部分judge校验hash/index/HEAD；W5不测核心实施 | JSON+原source只读断言比措辞强，但未覆盖全部副作用 | 当前no-fix judge比较基线，历史D1同根难度有限 |

## 精确阅读清单与排除

- S06：`SKILL.md`、一级references全部14份全文；`scripts/source-plan-file-hash.cjs`、`working-tree-fingerprint.cjs`全文。生产侧`src/cli/helpers/honest-closeout.js`全文；`verification-run-summary`与task-pack相关完整producer覆盖尚未收口，因此不称所有依赖已审完。
- S07：`SKILL.md`；modes-and-output、scope、intent-and-plan、action-class-rubric、persona-catalog、select-and-route、dispatch-reviewers、cross-model-review、diff-scope、finish-review、apply-findings全文；`findings-schema.json`、testing-reviewer、findings-mechanics.py、review-scope.py、cross-model-adversarial-review.sh全文。未派发persona的其余专科资产按条件排除（当前不裁决这些专科充分性）；subagent/validator模板与peer-job-runner其余生命周期出口仍为相关覆盖缺口，不以wrapper关闭为已验证全runner。
- S10：`SKILL.md`与fix、investigate、anti-patterns、defense-in-depth、pipeline-return、investigation-techniques全文。S11浏览器与S21精简合同消费者在对应续审中核对；本项不递归各技术栈技巧的外链。
- 三项`evals/eval.yaml`全文；S06 check-no-implementation、S10 check-diagnosis-no-fix、S07 check-agent-mode-read-only脚本全文；属于评测设计的定向断言样本，不冒充全部eval已审。
- `tests/unit/spec-code-review-mechanics.test.js`：候选schema/引文/提分/抑制断言段；`tests/unit/honest-closeout.test.js`：passed与cherry-pick断言段。本轮执行两套原有测试：69 tests passed，exit 0；出现审查fixture同名package的haste-map警告但未失败。仅证明对应确定性行为，不证明语义审查质量。

## 依赖续核（2026-11-01，主审）

- `src/cli/helpers/verification-run-summary.js` 1–733全文已读。writer拒绝passed/ran/exit不一致，已运行日志必须为run目录内普通文件并扫描secret；聚合覆盖全部checks，以failed→not-run→degraded→passed排序。reader重验schema与重复ID，不重新认证命令执行或日志因果；它不是执行器签名的证明。这与honest-closeout的声明一致性地板吻合，不据此称真实测试有效。
- S06 task-pack producer与Work consumer完整读取由上游组共享（`resume-upstream.md`），不再列为未读。target-repo/schema-validator/atomic-write通用内部算法未逐行审计，结论限于调用合同与已执行窄测试，不作全库安全认证。
- S07 `validator-template.md`与`subagent-template.md`已完整补读。敏感风险反驳需具体反证，缺上下文是unresolved而不是rejected；compact return失败须带完整证据回传，不因artifact写失败丢失细节。支持边界明确，但敏感风险在persona初次0/25过滤阶段的召回仍需行为验证。
- `peer-job-runner.py:303–379,1821–1872`已定向读取。`validate_start_authority`必然raise，且在job目录/启动前调用；当前认证producer未建设完成，所以peer路径不可用是已确认设计状态。生命周期其余实现不用于证明可用、cleanup或独立性，明确条件排除；重新开启认证通道时必须重审全部生命周期。不能因未通读不可达start后代码而声称跨模型可用，也不为静态审查运行外发。

当前S06/S07/S10常规主路径的语义和必要入口/出口已覆盖，S07外部peer保持disabled，通用底层算法不是完整实现安全审计。行为完成度不提升：S06/S07仍缺有效最低对照。新增确定性测试结果另见resume-validation.md，不把mock结果当真实host结果。
