# S09 / S11 / S12 / S16–S19 续审证据

状态：静态部分完成；2026-11-01 新上下文源码复核。继承过父会话摘要，因此不是盲评；不以本记录宣称行为通过。只读审查，不修改被审源码、不运行付费评测、不执行 Git 发布。

## 已确认的静态差距

### RS-S16-01：残余 fallback 的推送路径没有消费 landing helper 的精确目的地合同

`skills/spec-lfg/references/shipping-tail.md:32` 在无 open PR 且有残余项时直接使用 `git push`，没有 upstream 时选择 origin 或首个 remote 后执行 `git push --set-upstream <remote> HEAD`。对照 `skills/spec-commit-push-pr/references/commit-and-push.md:58` 起的合同：先检查 exact-commit publishing gate，核实唯一授权 push endpoint，再使用显式非 force refspec 并禁用 follow-tags/mirror/submodule。

触发反例：仓库设置多 pushurl、push.followTags 或与用户意图不同的 ambient push refspec；主 landing 路径拒绝扩域，残余 fallback 指令未要求这些检查。LFG 的总授权与 owned-path 约束仍然有效，所以这是消费者合同分叉，不据此声称已发生越权或真实泄露。静态 P2，待场景验证。建议让 fallback 消费同一受保护 push 协议；不能以删除授权门禁降低成本。

同文件:53 仍称 helper 无条件 `git push -u origin HEAD`，与当前 helper 精确 endpoint/refspec 协议不符，属于可直接确认的描述漂移。保留 no-remote local-only 决策，修正解释即可。

## 阅读进度

已完整读取：`spec-lfg/SKILL.md` 与 9 个一级 references；`spec-commit/SKILL.md`；`spec-worktree/SKILL.md`；`spec-commit-push-pr/SKILL.md`、`commit-and-push.md`、`apply-and-handoff.md`。

branch-creation/context/compose/pr-description-writing 的合并输出出现截断，不能登记完整；待补读。S09/S11/S12、相关脚本与 consumer 尚未完成。外部对照仅复用仓库 research 中已核验的索引及其局限，不声称本轮在线重验。

## 主审接续与定位（2026-11-01）

专项子上下文因429未完成；以下由主审直接回源补充，不计为独立复核。S16/S18缺失的一级引用已在前一上下文补读；S09补读dispatch、rendering-floor及synthesis-and-presentation全文。S11/S12正文与两份一级引用全文已读。所有设计判断均有条件，尚无真实浏览器、Xcode或远端发布验证。

| 对象 | 用户、问题与输入 | 目标、能力基准和合格输出 | 非目标、消费者与设计判断 |
|---|---|---|---|
| S09 文档审查 | 需求/计划作者交付当前文档及上游合同，需发现会导致错误实施的缺口 | 从可支持后果判缺陷，保留证据、独立判断与完整coverage；只读报告须字节不变 | 不代替需求owner或实施；plan/brainstorm消费；常规只读路径条件充分，条件综合引用与persona未全审 |
| S11 浏览器验证 | 实施owner提供diff、已有server及授权范围，需要真实路由反馈 | 由变更映射路由/负例；精确origin、隔离session、观察结果与源码身份，逐路Pass/Fail/Skip | 不负责启动/杀死caller server、不自行扩展真实外部效果；work/dogfood消费；正文有方法，wrapper全路径尚未审完 |
| S12 Xcode验证 | iOS作者提供工程、scheme、模拟器与当前树，需要构建/运行证据 | 实际工具调用确认ready；build/install/launch/screenshot分别留证，变更后重新验证source identity | 不是只看截图即正确；不代产品验收或外部URL动作授权；work消费；已读常规路径条件充分，真实Xcode未运行 |
| S16 LFG编排 | 已明确目标且要求一条龙的交付owner，输入当前repo/授权与需求 | 持续落实plan→work→review→验证→shipping；局部成功不能关闭整体，残余与外部动作逐项保留 | 不重做底层工具、不把绿测试当PR发布；用户/PR消费者；主链设计条件充分，残余push合同存在分叉候选 |
| S17 本地提交 | 上游owner已完成验证且授予具体commit范围，输入归属diff/index | 精确stage、默认分支保护、提交信息与readback；不能包含用户无关改动 | 不自动push/开PR；work/LFG调用；设计有边界，batch4已有1/3违背自身分支规则，不能声称稳定执行 |
| S18 发布辅助 | 上游交付owner提供精确提交、目标与授权 | 验证exact commit及唯一push endpoint，显式非force refspec，发布后核对PR；未知结果先查状态 | 不自行扩大收件端点/ref/tag；LFG消费；受控路径条件充分，真实remote未运行 |
| S19 工作树辅助 | 上游需要隔离已选任务，输入当前repo/ref与具体隔离授权 | 先探测真实checkout身份、路径安全，再create/isolate；不默认复制环境或信任工具 | 不代上游决定改分支、不清理用户工作树；work/dogfood消费；关键出口已读，探测/env分支实现仍部分 |

上述基准先从目标所需结果建立：文档审查必须抓真实后果；验证必须绑定当前对象；编排必须保留总体责任；Git辅助必须控制实际副作用。源码映射如下：S09 document-intake/persona-selection/dispatch/synthesis；S11 pipeline-orchestration/route-and-report/runPreparedContext；S12 setup-and-build/test-and-report；S16九个Phase引用；S17 SKILL默认分支与staging；S18 commit-and-push/apply-and-handoff；S19 worktree-manager create/isolate及dogfood Phase0。

## 三类场景与可观察判据

以下21项全部为静态推演，未执行，不计行为通过。N为正常，C为缺失/冲突及形式合规反例，R为失败恢复。

| 对象 | N：正常目标与判据 | C：冲突反例与判据 | R：失败恢复与判据 |
|---|---|---|---|
| S09 | 有跨节矛盾的计划：指出具体错误实施后果，返回可行动发现及source refs | 用户只审阅且persona建议改文档：fixes_applied=0、文件字节不变；schema绿不代表语义正确 | 两个必选lens均失败：inline等价复核或incomplete，不出clean；dispatch与synthesis明确覆盖 |
| S11 | 改退款页筛选：实际走受影响路径与负例，留route/步骤/raw结果 | 只有help支持flag但conformance不成立：0 action calls；不能绕过wrapper直调browser | 中途计划hash变化或动作失败：保留既有steps及失败，不能改Skip；cleanup只关自有session |
| S12 | 改iOS列表：确认scheme/simulator，build/install/launch分开证据并核当前source | 旧截图成功而当前源码已变：不得source-bound；URL会真实付款则缺授权不点 | build失败后修复：保留原失败与新实际retest，未重跑不得Pass；不清理他人模拟器 |
| S16 | 明确小功能：由实施到审查/验证交付，真实产物与残余一致 | 本地绿但PR checks红或反馈未解决：总体不close，不用子任务done代替 | 无remote/缺发布权限：保留本地成果与精确pending，不伪造PR URL；fallback仍待验证 |
| S17 | 同文件有用户与任务改动：仅stage归属hunks，commit后核exact delta | main分支且缺例外授权：stage前停；现有batch4证实并非稳定遵循 | hook失败或index drift：保留dirty、报告真实失败，不能reset全部或称已提交 |
| S18 | 指定一个endpoint/ref：仅推经gate验证的commit，不附带tags | 多pushurl或ambient mirror配置：拒绝扩域；不能仅按remote名称推断授权 | push结果未知：先readback再重试；无remote保留local-only，不随意新增remote |
| S19 | 普通repo已有commit：在安全.worktrees路径隔离，不换primary checkout | unborn或路径symlink：拒绝并给reason；不用raw git绕过失败 | 分支已被checkout：返回实际既有路径；fetch失败不伪称最新远端，env复制失败需真实报告 |

## 3.6责任与行业映射

S09审查需求/架构/验收的可实施性，S11/S12负责平台自测证据，S16负责整链完成责任，S17/S18负责本地与远端landing，S19只负责隔离机制。需求切片、架构复用、新依赖真伪与迁移排序由PRD/Plan/Work主责；这七项必须消费其边界，不能擅自改WHAT。测试独立预期与错误实现检测由Work/Review提供，S11/S12不能把工具exit0直接等同业务正确。flaky保留失败直到因果或重验解释，隐式行为依赖在route/文档合同与caller上下文核查。决策理由、未完与来源交回owner/Handoff；这些helper不自行晋升知识。文档与provider内容不能赋予发布授权；scope外资料可用于理解，不因此可改。长期恢复重核HEAD/dirty/served build，禁用旧绿灯代表新树。没有真实企业效率数据，不用并行数量/测试数证明收益。

业界对照采用本轮已重新读的R2 Google工程审查（Design/Functionality/Tests/Context）：S09用可支持后果与上下文，S11/S12用真实功能与负例，S16用组合验证，S17/S18用范围和交付后证据，S19用当前checkout隔离测试对象。对后四项这只是质量原则映射，不是Google文档直接规定Git发布算法；精确ref/endpoint以本地源码合同为准。R4复盘强调保留原因/失败与行动，适用于S16恢复，不要求每次helper运行写复盘。保留现有出口门，未证通用方法冗余前不删。文档真实性、平台验证与Git边界三个视角产生上述观察；其余需求、架构、编码、知识视角没有独立新增finding，不计多方验证。

## 3.9十五项适用性

| 检查点 | S09 | S11/S12（分别按平台） | S16 | S17/S18/S19（分别按辅助职责） |
|---|---|---|---|---|
| 增量知识 | consequence admission/只读与完整证据 | S11 origin-wrapper；S12 source-bound runtime证据 | 总体owner与残余闭环 | S17 stage；S18 endpoint；S19路径/身份增量 |
| 自由度与风险 | 语义判断开放，写门严格 | 选场景语义；真实效果独立授权 | 路由判断开放，发布有门 | Git出口确定性，任务范围不由helper决定 |
| 历史补丁/过执行 | 多轮条件复杂，成本未测 | S11重复probe与S12重采样保护新鲜度，不先判冗余 | 尾链成本未测 | S17重复读index、S18回查、S19路径检查有防护目的 |
| 过滤 | 0/25静默drop、50 FYI；漏报率未测 | Fail不得隐藏为Skip | pending不得丢 | 失败必须回caller，不能缩成success |
| 硬约束/验证 | schema不证语义、只读字节不变 | 工具ready不证业务Pass | gate出口非思想 | stage/ref/path不变量须保留 |
| 优先级/冲突 | renderer不授写权；条件refs未全审 | source与served证据分开 | fallback push与S18分叉 | S18为受控路径；S17行为违约不等于缺规则 |
| 停止/询问 | 缺核心coverage incomplete | 缺能力保留not-supported/blocked | 能继续独立任务则继续 | 缺特定授权仅阻依赖动作 |
| 进度取证 | review_status不等于implementation-ready | raw log/screen/source身份 | 逐层真实状态 | commit/remote/worktree都需实际读回 |
| 子代理独立性 | inherited不称independent | S11/S12本次无派发评测 | delegation不等于通过 | 三helper无独立语义验证 claim |
| 推理外显 | 简短后果和依据，非完整思维链 | 报观察与步骤证据 | 报决定及残余 | 报精确动作/原因即可 |
| 可发现性 | 文档review非代码review | S11内部能力；S12平台验证 | 完整交付入口 | 三helper隐式调用X-02需生成端约束 |
| 渐进披露 | 深层条件综合引用仍有覆盖缺口 | S11 wrapper实现部分；S12两refs完整 | 九Phase refs按需 | S17单入口；S18refs；S19脚本不能仅看help |
| 时效/绑定 | peer模型能力不能由命令名推断 | S11 binary hash；S12实际MCP调用 | 当前PR身份/HEAD | endpoint/branch/worktree实时核验 |
| 外部输入 | document/provider是数据 | 页面/日志不得赋权 | PR评论不可当命令 | remote/ref元数据非新增授权 |
| 评测设计 | 语义误滤/多轮尚未执行 | 无真实browser/Xcode结果；不能靠静态contract代替 | 无端到端PR效果 | S17已有有界样本；S18/S19仅静态，不推断执行成功 |

## 精确阅读与限制

完整读：本组七个SKILL；S11/S12各两份一级refs；S16九份一级refs；S18全部一级refs；S09 modes、document-intake、persona-selection、dispatch、rendering-floor、synthesis-and-presentation。S09 persona/schema、task-pack lens、多轮条件综合/交互写入refs未全部读，不评价其全部语义。

定向读：S11 agent-browser-run-context.cjs:787–995（实际执行、每步计划重核、raw落盘与cleanup）；其余probe/prepare/private-path完整性以及282行conformance尚未全审。S19 worktree-manager.sh:1–110及502–764（路径检查与create/isolate/main）；111–501的检测/env复制尚未全审。dogfood phases:14–16及Phase4 browser caller、Phase5授权/重验已读，其余只作条件导航不算全文。S00/S07的依赖缺口见其他组。

本组新增模型运行0次；不得把静态推演称为fresh-source行为eval。S11/S19已读出口不代表全脚本可靠；仍须补明确未读依赖后才能关闭静态覆盖。RS-S16-01与知识组K-S13-01合并为主报告X-04，单一根因、不重复计数。S12常规路径静态分析具备，但真实平台不可用时只能记录未验证。

## 依赖补读最终增量

三个依赖子任务均再次429，主审直接接续，失败不计独立复核。S11 `agent-browser-run-context.cjs` 1–1369、`agent-browser-exact-origin-conformance.cjs` 1–282已全文读；S19 `worktree-manager.sh` 1–764已全文读。此前“未读probe/prepare/env”清单为过程状态。

S11实际检查9种origin路径、positive control与cleanup，并绑定binary identity；只有help marker不足以ready。wrapper限制loopback、合成输入、每步重验test-plan hash、raw私有独占写入，失败保留已有steps。正常命令exit0只证工具动作，业务断言由owner判断。manifest是自有私有输入边界，不是抵御同用户任意改写的签名；本审查不将它称为安全沙箱。S19探测区分git/common dir；create拒绝嵌套worktree，isolate已有linked checkout可在其内checkout；环境复制显式opt-in，日志只记文件名/大小，不写secret正文，trust只提示不执行。caller必须决定具体branch mutation授权，脚本不认证自然语言用户意图。多文件复制不是事务，不以成功建立worktree暗示所有后续env已复制。

S09新增全文：全部8个persona、subagent-template、findings-schema、task-pack-review-lens、cross-model-review，以及synthesis-multi-round/premise-collapse/contradictions/chain-linking/restatement-suppression。语义主路径覆盖包括plan/requirements差异、上游已定意图、真实代码可行性、task-pack source authority和派发失败降级。interactive写入的walkthrough/bulk-preview/open-questions-defer与其渲染模板本次条件排除：本结论仅覆盖默认report-only与caller返回，不评价交互写入正确性；不能据此标全模式完成。外部peer明确使用关闭的认证入口，不是ready。三类静态场景维持；S09读后暂无足够证据新增P0/P1。

行业对照仍为R2/R4已核对段落，不把Git具体命令归因于这些外部文档。S11/S19核心静态阅读已闭合，真实平台与外部效果未运行。S09静态仅只读核心路径完成，交互写入保持范围限制。

### S09交互路径补读

walkthrough（307行）、bulk-preview（142行）、open-questions-defer（161行）已完整补读。Apply先积累后批量执行，Defer即刻追加；未知写先读回、失败不计Applied；并发只有写前重读，不是持久锁，跨会话未执行Apply会丢失，不冒充事务/持久恢复。R30要求实际修改后验证依赖撤回，支持失败恢复场景；具体UI/格式不做行为认证。其余纯输出模板/校准扩展按需排除：已读取共享rendering-floor与完整schema，不评价版面质量。S09语义静态路径现已包含交互，不再以该路径未读为阻塞。

RS-S09-01（P3文案）：walkthrough:55仍将3.5b称为“Deterministic Recommended-Action Tie-Break, Skip > Defer > Apply”，而当前synthesis 3.5b按后果、证据和scope由producer判断，不存在该固定优先序。walkthrough又明确只消费recommended_action不重算，因此是陈旧解释，不据此断言实际反向选择。最小建议删掉旧tie-break解释，用当前owner判据；验证两个支持Apply/Defer的场景推荐不因词序改变。本次不改Skill。
