# spec-work 全量源码对照审查

状态：`source_review_complete`；单模型 inline、report-only。双方77个包内文本资产（本地52、CE25，共12964行）已逐段全文审读，另核对14份直接依赖/消费者。精确hash与读取区间见[逐文件表](../file-tables/spec-work.md)。本稿替代早期定向审查稿。

结论：本地已在CE实施主线上深化了task-pack/source pins、反馈与测试质量、授权隔离、当前工作树证据、caller-owned收口。这些增强有真实CLI及LFG消费者，应保留。可吸收CE的proof-test连续保护和Figma比较方式；不宜搬入其通用外部执行runtime或自动提交策略。当前存在评测地板和prose自洽缺口，不能称完美融合。

## 研发能力与融合裁定

| 研发场景 | CE源码事实 | spec-first源码事实与已有增强 | 裁定及最小建议 |
| --- | --- | --- | --- |
| 把已定方案变成实现，避免重做WHAT | `ce-work/SKILL.md`、`input-triage.md`、`work-intake.md`区分正式计划、足够具体的直接请求、已存在实现与方向漂移 | 本地同名引用另核unified plan metadata、active状态、requirements-only与task-pack；既有实现不等于允许改计划状态 | **核心已等价，本地增强保留。** 不导回宽泛自动执行；计划不充分交原owner，微小明确请求保留短路径 |
| 将计划拆成可核对的任务与review边界 | CE从plan units执行，无本地同等task-pack链 | 本地`input-triage.md`、`implementation-loop.md:23–31`、`work-intake-and-task-pack.md`；`src/cli/task-pack.js`提供pins、scope和delta事实，doc-review与task review消费 | **本地独有且有消费者，保留。** 不增第二任务调度协议；任务完成仍由LLM结合证据判断，不由hash正确推导 |
| 识别already-done与外部交付状态 | 双方`implementation-loop.md`均要求先查已有实现；CE`non-code-execution.md`明确外部deliverable的观察 | 本地loop:24同样明确git不能证明console/DNS/CMS等外部状态 | **主要能力已融合。** 缺外部观测就限制对应完成声明，不从clean tree或tracker状态推断 |
| 尽早建立真实反馈、测试可证伪、跨层错误可见 | CE implementation loop含proof/characterization、test quality和system-wide chain | 本地独立`feedback-and-tests.md`已有vertical/contract-first/risk-first、DAMP、state over interaction、double fidelity、false-green、mutation proof边界，`implementation-quality.md`保护已有owner | **本地已等价或更强。** 复用现有owner，避免复制第二套测试哲学；按真实跨层风险选择integration，不为流程新增镜像测试 |
| 简化不削弱刚用于证明正确性的测试 | CE `implementation-loop.md:91`将证据记录点名的每个测试作为`proof-test:<path>`传给simplify；shipping同样传递 | 本地loop:58只明确传settled decisions；shipping及Debug/LFG也缺同等完整接线。本地simplify一般行为保持要求不能等同显式proof-test保护 | **优先吸收，见W-2。** 同时适配caller及callee，传已有真实测试路径/案例，不虚构本地已支持的token；与simplify、debug笔记合并为同一根因 |
| 并行实施但保护已有dirty与凭证 | CE `execution-strategy.md`及workspace controller；外部路由`restriction_posture: cooperative`，`cross-model-execution.md:84`明确同OS用户且所有权限请求批准 | 本地`execution-strategy.md`要求真实授权、live capability、索引与隔离事实、身份/凭证receipt；无认证producer channel时inline，不把文件receipt当可信派发事实 | **保留本地边界。** CE工作区隔离不等于OS sandbox；不导入approve-all、自动放宽权限或推定独立coverage |
| 长任务中断恢复、确认真正执行树 | CE controller核source/packet、实际working tree、canonical verification和精确恢复；已全文核cross-model-work、peer runner及全部unit_workspace模块 | 本地`execution-strategy.md`已有immutable run identity、generation snapshots、每unit恢复事实；fingerprint、run-artifact helper及consumer检查当前树 | **吸收事实核对意图，复用本地机制。** 不移植约6000行外部controller/adapter体系；本地helper只校验事实结构，仍不能证明语义正确或命令真的执行过 |
| 指定模型不可用时仍保持意图和身份可信 | CE `cross-model-execution.md:42,64–70`连require也fallback native，记录requested/actual，actual served model仍有asserted边界 | 本地strategy:153–155无真实receipt不启动peer；must-use无既有fallback授权则阻断依赖项，prefer可披露降级 | **保留本地选择。** 可吸收requested/actual分开表达，不把CE fallback语义当本地用户授权；外部执行保持dormant |
| 实施完成交caller，caller负责shipping | CE `return-to-caller.md`有实施/尾部分工；部分already-done路径可返回仅观察证据 | 本地`return-to-caller.md`要求完整envelope、required task review/verification、fresh summary/fingerprint、reentry复验；`spec-lfg/references/work-return.md`真实消费这些字段 | **保留本地增强。** mutation后不得照搬observation-only结论；standalone_shipping_skipped不免本次structured closeout，见W-1 |
| 未完问题、tracker及知识沉淀 | 双方review-findings-followup、tracker-defer和shipping已含residual/延期与知识提示 | 本地区分run-local residual、durable repo refs、publication failure/no_sink和独立外写授权；plan-status helper由最终caller调用 | **核心已融合，保留。** 不导回默认canonical commits、plan-only checkpoint、自动push或扩大收件人；artifact存在不等于review完成 |
| Figma设计与实际UI对齐 | CE `agents/figma-design-sync.md:1–27`是只比较worker；要求与设计frame同宽、多frame逐宽，项目tokens优先，可能有意差异回owner判断 | 本地181行worker有唯一`spec-test-browser`证据owner、private/current/exact-origin与mutating范围，但夹入Tailwind/ERB通用强制规则 | **窄化吸收比较方法，见W-3。** 保留browser唯一owner；比较worker可先report，由caller决定修复，或沿用已授权有界mutating模式，均不扩大权限 |

## 已确认问题与证据

### W-1 [P2] 裁判把关键词、提交数量和条件grep当成收口/不改文件证据

Direct evidence：

- `skills/spec-work/evals/fixtures/scripts/check-closeout-order.sh:7–18`只核README标题、完成文案关键词及rev-list数量；没有检查summary/closeout artifact或顺序。
- `check-return-to-caller.sh:9–17`不解析JSON值或required字段；`standalone_shipping_skipped:false`仍满足关键词。
- `check-uncommitted-handback.sh:8–21`以提交数量代替HEAD身份；amend保持数量即可通过。
- `check-no-implementation.sh:6`和`check-r2-reverse-mismatch.sh:18`先判断文件存在；删除server会跳过保护检查。

[隔离探针](../work-judge-probes.py)及[结果](../work-judge-probes.json)构造上述5种违例，全部judge exit 0。分别是：无收口artifact、false且字段不全的caller envelope、HEAD被amend、要求不实现时删除server、要求保留已有实现时删除server。临时git与fixture均自动清理；没有运行模型。

影响：这些eval不能支持它们声称的完整收口、未提交、未改实现保护；此前或未来绿色评分可能漏掉相应失败。**只证明裁判盲区，不证明真实模型已经违规。** 建议用真实JSON/schema值、baseline HEAD/index/文件hash和必需artifact验证结果；顺序断言需要实际执行trace，不从最后一段话反推。对允许的合法重构按行为结果校准，避免只换一套关键词。

### W-2 [P2，跨Skill同根] Work到simplify缺少证明用测试的显式保护传递

Direct evidence：本地`implementation-loop.md:58`传settled structure，CE同引用:91显式传证据记录里的proof tests。本地`feedback-and-tests.md`已有red/characterization/current proof记录；本地simplify及其他caller的同一缺口见[完整对照](spec-simplify-code.md)与[Debug对照](spec-debug.md)。不是缺测试理论，而是已有证据未跨边界变成保护约束。

建议：Work、Debug及LFG从既有verification evidence提取实际承担证明的测试/案例，简化时保护其test-only seam；未知时保守不删除/削弱本次证明测试。callee需明确接受并执行保护，再复跑相同验证。不冻结生产实现，不新增中央schema或第二证明框架。未执行真实simplify，不声称实际测试已被模型改弱；总体报告对此仅计一个根因。

### W-3 [P2] Figma worker把局部布局偏好写成通用修复规则

Direct evidence：本地`references/agents/figma-design-sync.md:33–34,46–48`强制组件full-width、无max-width、外层不得有padding、宽度移到HTML/ERB parent；:68建议把20px改为18px；:85要求移除overflow-hidden。这些规则与同文件“按项目规范/精确Figma”没有条件优先级，可在组件本就拥有宽度、圆角裁剪、项目非ERB/Tailwind或设计20px时引导越过真实设计。

建议：删除通用强制偏好，以实际frame、项目组件ownership、现有styling/tokens和有意差异为事实；比较同宽截图，修复后交唯一browser owner获取新证据。:41的成功短语与:179的structured packet约束一并收敛。**本轮仅确认prose合同冲突，未运行视觉比较，不声称已复现UI回归。**

## 消费链与验证

- input/plan/task-pack → strategy/feedback/quality → bounded implementation → task delta/review → final required-proof reconciliation → summary/honest-closeout/run artifact → fresh fingerprint → caller/LFG或独立shipping。直接核过`src/cli/task-pack.js`、`spec-work-run-artifact.js`、`verification-run-summary.js`、`honest-closeout.js`、`plan-status.js`以及LFG work-return。
- `work-tests.json` / `.log`：8 suites / 90 tests通过，覆盖本地contracts、source-plan hash、consumer chain、front controller、shipping、fingerprint和run-artifact producer的现有测试。包含prose断言与临时git/helper行为；不能推导模型会正确遵守，也不撤销5个裁判反例。
- 本项直接依赖闭包已核；通用共享模块的所有递归依赖不承诺逐行穷尽。全量含义是本地与对应CE Skill包内文本无抽查，并逐项追读承重的直接接口/消费者；非本地对应Skill的CE能力不自动扩大范围。
- 未执行真实模型/宿主、CE外部worker、Figma/browser视觉验收、外写/提交/安装或独立fresh-source reviewer。served-model与field outcome未验证；不声称merge-ready或收益已兑现。

## 最小融合顺序（尚未实施）

1. 先修5类eval反例，使用已有真实artifact与baseline，不以新测试数量替代结果。
2. 与simplify、Debug/LFG共同接proof-test保护链，补证明测试不被删弱、生产实现仍能重构的结果校准。
3. 精简Figma引用，吸收同frame比较、项目token优先和intentional差异回交，保留唯一browser owner与授权边界。
4. 恢复与requested/actual事实表达仅在已有run/fingerprint中补缺，不引入通用外部runtime；真实任务验证效果和成本后再决定默认范围。
