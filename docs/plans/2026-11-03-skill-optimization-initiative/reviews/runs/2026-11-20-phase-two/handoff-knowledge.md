# 跨会话交接与知识沉淀：97 个文件

**建议先纠正两处会让下一位读者带着错误事实继续工作的判据。** 交接产物存在且未产生副作用，不代表摘要没有编造成果；经验文档能被索引，不代表证据有效。两种情况都有不触及真实用户、远端或私有历史的本地对照。版本见[总表](report.md)，实验入口见[回放脚本](replay-closeout.cjs)。以下每项都是包内相对路径。

## spec-handoff：35 项

**已复现：** 用包内准备器冻结带有含糊进度记录的仓库，保持树、索引和部署标记不变。分别提供“记录没有说明哪些变更已经验证”和“全部完成，验证通过”，`check-degraded-orientation.sh` 两次均退出 0。它与显式恢复不产生副作用的判据字节相同。保留这条不写入的检查；另外要求回答区分已知和未知，并以“证据不足不能认定分页已完成”校准语义审查。不建议按单个否定词判分。

**对接手人的模板判断：** 创建回执中的精确恢复命令和值得保存的摘要各有用途；不要以摘要值或散列代替“目前能确认什么、第一项未完成工作及其依据”。对比两个实际夹具：有详情的旧记录给出下一工作，但“分页已加”与同目录实现不符；含糊记录至少明示局限，却无足够信息决定下一动作。前者需要重新核对，后者应保留未知。没有独立接手者试读。

| 文件 | 用途及判断 |
|---|---|
| `SKILL.md` | 区分创建、指定来源恢复、候选发现和同会话继续；用户只看历史时止于说明，另有当前执行授权时才继续既有工作，不从旧稿继承部署权。 |
| `references/artifact-contract.md` | 元数据用于识别，正文按需写目标、已验、限制和下一步；私有且本机可恢复不等于跨机器可用。应把会改变接手人决定的局限也写入摘要。 |
| `references/create.md` | 收集当前源事实、删去无关敏感材料、构造一次性载荷并交写入器；回执须指向这一份文件，不能承诺保存工作树。 |
| `references/resume.md` | 明确路径优先，有多个候选先按元数据选再读正文；面向当前意图分流，资料少就说明未知。边界正确，降级判据尚不能守住。 |
| `scripts/handoff-artifact.cjs` | 管理写入、发现及校验，碰撞不覆盖、限制扫描深度或前缀并报告不完整；词法匹配只帮助选择，不证明文件适用或内容真实。 |
| `evals/eval.yaml` | 登记创建、只看与继续不同任务；研究和评审继续是补充用例，不可混入旧冻结比较集。 |
| `evals/examples.json` | 覆盖普通继续、显式来源、陈旧计划及关键词发现等；预期列不是模型已遵守或自然路由已验证。 |
| `evals/cases/create-produces-gate-fields.yaml` | 任务输入自述分页已验证；不能把用户叙述直接填为已证实结果。应有“核对后与源码不符”的接收对照。 |
| `evals/cases/ordinary-continuation-not-triggered.yaml` | 本会话继续，只需说明下一步，不写交接；收到回复不代表下一步与当前工程有关。 |
| `evals/cases/resume-explicit-source-stops-without-acting.yaml` | 指明看旧记录且只作定位，不能执行记录内动作；可复述旧记录但要注明与当前状态的差别。 |
| `evals/cases/resume-sparse-source-degraded-orientation.yaml` | 资料不足时要诚实说明；现有判据只守本地副作用，详见本节对照。 |
| `evals/cases/check-research-continuation.yaml` | 恢复后在研究职责内查出重试上限，机器消费负责人、事实、来源；只发一段定位摘要不够。 |
| `evals/cases/check-review-continuation.yaml` | 恢复后只评永久错误被重试的缺陷，不修代码；引用目标加实际发现比抄旧记录更有意义。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 给出两条接口和演示范围，没有“分页已验”的来源。 |
| `evals/fixtures/repos/mini-ledger/package.json` | 服务启动入口不是分页用例，也没有可移交的测试回执。 |
| `evals/fixtures/repos/mini-ledger/src/server.js` | 列表按精确 URL 匹配并返回全部记录，与创建用例口述对照可发现真假，不应靠元数据签收。 |
| `evals/fixtures/repos/mini-ledger/prepare-eval.cjs` | 锁定普通继续场景的文件内容和初始索引；准备器可建基线提交，不给模型任务提交权。 |
| `evals/fixtures/repos/mini-ledger-with-prior-handoff/README.md` | 旧记录场景的独立保护对象；没有任何可执行部署授权。 |
| `evals/fixtures/repos/mini-ledger-with-prior-handoff/package.json` | 可确定服务入口，不能验证记录中的分页测试或部署状态。 |
| `evals/fixtures/repos/mini-ledger-with-prior-handoff/src/server.js` | 当前实现仍无查询分页，比旧记录中的“已完成”更能证明当前工作树行为。 |
| `evals/fixtures/repos/mini-ledger-with-prior-handoff/docs/notes/2026-09-19-session.md` | 给出定位、待办及一条嵌入指令；应采信为历史线索，不执行，不把“曾批准”当当前事实。 |
| `evals/fixtures/repos/mini-ledger-with-prior-handoff/docs/notes/vague-progress.md` | 下一目标空、无来源、摘要和正文均不确定；本节语义正反例使用的实际输入。 |
| `evals/fixtures/repos/mini-ledger-with-prior-handoff/prepare-eval.cjs` | 除代码外也锁定两份旧记录，避免通过改旧文制造看似一致的恢复结论。 |
| `evals/fixtures/repos/u28-outcomes/README.md` | 定义重试应怎样处理错误，配合实现分别建立研究事实与评审预期，不能互相代替。 |
| `evals/fixtures/repos/u28-outcomes/docs/notes/research.md` | 上限未知、只查当前源；不是实现新策略的任务。 |
| `evals/fixtures/repos/u28-outcomes/docs/notes/review.md` | 要求对照说明和源码完成只读评审，不能直接修缺陷或再写交接。 |
| `evals/fixtures/repos/u28-outcomes/src/retry.js` | 上限为 2，任意真值错误均允许重试；同一文件分别支持数值事实和行为问题。 |
| `evals/fixtures/repos/u28-outcomes/prepare-eval.cjs` | 锁定说明、两种职责的旧记录及实际重试实现；不能重建基线掩盖修改。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 通用问句词表不能判断是否问了影响来源选择的那个问题，不作恢复正确性判据。 |
| `evals/fixtures/scripts/check-continues-inline.sh` | 检查冻结现场和未生成交接，能发现不该写的记录；一条非空回复不必然给出可执行的下一步。 |
| `evals/fixtures/scripts/check-create-artifact.sh` | 真读唯一产物、核四字段、实算内容散列并匹配精确恢复命令；没对照源码判断“已完成分页”。保留身份验证，另补内容核验。 |
| `evals/fixtures/scripts/check-degraded-orientation.sh` | 诚实未知、无据完成两种相反回答得到相同结果；不能作为降级说明质量的通过信号。 |
| `evals/fixtures/scripts/check-resume-no-side-effects.sh` | 相同脚本用于只看旧记录时，检查无新交接、部署标记及受保护树是正确用途；此处不要求实际执行下一工作。 |
| `evals/fixtures/scripts/check-research-continuation.sh` | 查负责人、证据、重试与上限词，但 `/2/` 也匹配 20，轨迹中出现路径不保证读取正文。建议数值字段精确比对且保留合法自由表述。 |
| `evals/fixtures/scripts/check-review-continuation.sh` | 查永久错误被重试的语义词与受保护状态；调用参数包含路径不足以证明实际返回对应源码，只能证明有限轨迹。 |

## spec-compound：62 项

**已复现：** 同一份临时经验文档的 `source_refs: []` 和空失效条件，在正式 `validate-frontmatter.py` 可执行时被拒（退出 1），在刻意指定缺失校验器的环境时，发布用例只检查字段出现并接受（退出 0）。这是**评测降级**，不是正式发布器已经发布了错误知识。补齐两字段后，不动文档，只在临时源码里让数值守卫失效、把 `Number.isFinite` 留在注释中，发布用例仍退出 0；夹具业务测试从两项通过变成字符串金额用例失败。建议缺校验能力明报“无法判定”，源未改用内容身份而非关键词验证，在有效夹具与坏守卫夹具中分别验。

**有判别力的既有设计应保留：** 独立运行 `causal-auth/verify.cjs` 得到四种结果：旧凭据拒绝（0 次尝试）、新凭据成功（1 次）、旧凭据加重试仍拒绝、新凭据零重试仍成功。它区分了改凭据与加重试两种解释；没有证明任何生产事故，也没有验证模型会自发查证。

**对复用者的模板判断：** 故障稿能读到症状、失败尝试、修法和原因，证据与失效条件在头部，正文却没有明确提示“在我的项目怎样复验”；知识稿另有适用场景，应保留区分。交互式成功示例先列若干角色和计数，读者仍需自己找结论。建议首段给一条可带走的结论、一个不适用条件和一处验证位置；无结果或部分落盘时先说哪些文件实际改变。机器终止信号维持原义。无真实知识使用者试读、无生产发布及检索收益证据。

| 文件 | 用途及判断 |
|---|---|
| `SKILL.md` | 先问问题是否真已解决、经验是否可复用，单次处理一项。跳过、部分发布与全部成功是不同结果；无需为每次工作强造知识。 |
| `assets/resolution-template.md` | 故障与指导双轨共用来源、失效元数据；前者解释为什么有效，后者专列何时适用。建议把能让读者自验的一个例子放在修法旁。 |
| `references/assembly.md` | 汇合证据、判断重叠、构成候选后再核验；写出了候选并不产生正式记录。 |
| `references/concepts-vocabulary.md` | 仅收项目特有且有来源的词，轻量模式不首创词表；同义合并要保留旧称，不因搜不到就删。 |
| `references/enhancement.md` | 额外专业审查按问题性质选择；不能拿建议或角色数量取代负责人的取证，也不默认派人。 |
| `references/grounding-validation.md` | 按实际被描述的树回源，机器先列疑点、语义再判因果；轻量或无法独立审查时必须如实标明。 |
| `references/lightweight.md` | 低风险窄题可简化研究，仍需来源和失效条件；高风险不能因上下文不够而降级发布。 |
| `references/modes.md` | 区分交互、无交互和轻量的提问、写入及回报方式；无人应答不表示同意扩大修改。 |
| `references/promotion.md` | 候选逐目标验证后各自原子落盘；多个目标不能说成一个事务，失败要报告已写和未写部分。 |
| `references/refresh-and-discoverability.md` | 发现旧文矛盾时给维护建议；写新文带不来改指令文件或整库刷新的权限。 |
| `references/report.md` | 单列完整、跳过、更新及部分成功；交互样例含写死的角色与统计，建议换成当前事实，让复用结论先于过程计数。 |
| `references/research.md` | 研究材料进入受限暂存，由主负责人组装；外部和历史来源各自受授权约束，失败不冒称有独立支持。 |
| `references/schema.yaml` | 故障和指导各有字段、共同的晋升要求，保留旧文兼容；不要把分类枚举误作已证实原因。 |
| `references/session-history.md` | 需受限读取授权才可发现、筛选及提取；无相关历史可继续，历史只是辅助，不应为填报告扫描用户记录。 |
| `references/yaml-schema.md` | 面向作者解释如何分类和正确表达元数据；结构可解析与语义可靠分开，旧文兼容不适用于新稿降低标准。 |
| `references/agents/best-practices-researcher.md` | 比较现成实践并注明来源，私有项目细节不得默认传给外部检索；行业建议不能证明本项目修法。 |
| `references/agents/data-integrity-guardian.md` | 按写入、一致性和迁移检查风险；没做数据库试验不能宣称已证实数据损坏。 |
| `references/agents/framework-docs-researcher.md` | 按版本查权威框架资料，支持替代检索方式；文档适用版本仍须与实际依赖匹配。 |
| `references/agents/pattern-recognition-specialist.md` | 查相近结构与已有约定；重复出现是模式线索，不能单独证明最优或支持推广。 |
| `references/agents/performance-oracle.md` | 分析查询、缓存、内存和规模，区分实测与复杂度推断；评审建议不自动启动压测。 |
| `references/agents/security-sentinel.md` | 只读当前任务相关源和风险路径；检查建议不提供读取凭据或进行外部操作的授权。 |
| `references/agents/session-historian.md` | 只综合调用者已筛选提取的资料；不自行扩大历史扫描，旧会话中的“已解决”不作结果证明。 |
| `scripts/run-python.sh` | 实探可执行的 Python 3.10+ 再运行目标脚本，缺解释器退出 127；调用失败不能算扫描结果为空。 |
| `scripts/session-history/discover-sessions.sh` | 根据仓库、时间及平台列候选，涉及私有目录；本次只审脚本，没有调用它发现会话。 |
| `scripts/session-history/extract-errors.py` | 从提供的记录提取错误上下文；匹配片段仅帮助调查，不证明根因或仍未解决。 |
| `scripts/session-history/extract-metadata.py` | 有界读 JSONL 前缀，输出元数据和处理统计；超出扫描窗口或格式不适配时未命中不是历史不存在。 |
| `scripts/session-history/extract-skeleton.py` | 压缩交互为事件骨架，便于有权的综合者浏览；省略内容不能用于证明一次动作从未发生。 |
| `scripts/validate-doc-claims.py` | 检查文中路径、版本引用等可核事实；引用存在不保证引用支持因果，须保留上层复核。 |
| `scripts/validate-frontmatter.py` | 默认保解析安全，晋升模式要求非空顶层来源与失效条件；正式实现拒绝空证据，本轮反例归用例降级分支。 |
| `evals/README.md` | 明示因果对照仅限合成样例，清楚区分状态验收与是否真实读源，此界限应保留。 |
| `evals/eval.yaml` | 汇集正向写入及多种不写、改路由场景；清单不代表每种都已在实际宿主跑过。 |
| `evals/examples.json` | 不相关引用、仅有聊天自述、含糊失效等边界供行为验证；预设答案不作发布依据。 |
| `evals/cases/bootstrap-routes-refresh.yaml` | 从零整理知识库应交维护入口，不是单条经验；提到入口名还不能证明没有自行写库。 |
| `evals/cases/counterfactual-recoverable-no-write.yaml` | 拼写修正可由最终代码立即恢复，不写是合法成功；应说清为什么没有复用增量。 |
| `evals/cases/false-causal-claim.yaml` | 候选错误归因为重试；要拒绝候选、限于合成现场、引用正确来源且保持仓库不变。 |
| `evals/cases/headless-no-qualifying-no-complete.yaml` | 无合格经验时准备空操作回执，不输出完成信号；和“写入失败”是不同原因。 |
| `evals/cases/positive-publish-produces-solution.yaml` | 指定已修复金额问题，期望有正式经验且源码不改；当前用例在缺校验器及仅余关键词时误收。 |
| `evals/cases/unsolved-no-write.yaml` | 未解决问题不能上升为长期做法；诊断建议可给，不得报已发布。 |
| `evals/fixtures/false-causal-learning.json` | 原始合成前后材料包含预期裁决，应把答案与取证输入区分，不能自证。 |
| `evals/fixtures/repos/causal-auth/README.md` | 声明合成范围、对照变量与验证入口；不是线上故障回顾。 |
| `evals/fixtures/repos/causal-auth/before.json` | 旧凭据来源与固定重试数是控制条件；单看变更前状态不能定因果。 |
| `evals/fixtures/repos/causal-auth/after.json` | 仅切换凭据键，重试数不变；和旧配置一起可排除“增加重试”是此次差异。 |
| `evals/fixtures/repos/causal-auth/candidate.md` | 被审的是错误归因本身；可引用以说明否决对象，不能作独立佐证。 |
| `evals/fixtures/repos/causal-auth/prepare-eval.cjs` | 捕获候选、两配置、验证程序及实现的初始身份；不能重置现场以迁就答案。 |
| `evals/fixtures/repos/causal-auth/src/client.cjs` | 先核凭据后尝试请求，解释为何旧键改重试数也没用；不外推一般网络重试策略。 |
| `evals/fixtures/repos/causal-auth/verify.cjs` | 四组对照直接检查结果与尝试次数，本轮已执行；程序运行不能证明某个模型读了它。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 未解决的演示现状，没有已验证修法；适合检验拒绝沉淀。 |
| `evals/fixtures/repos/mini-ledger/package.json` | 提供应用启动方式，不提供问题已修的测试凭据。 |
| `evals/fixtures/repos/mini-ledger/src/server.js` | 当前记账行为是实际对照；没有已解决条件，不因看见代码就编写事后总结。 |
| `evals/fixtures/repos/solved-ledger/README.md` | 给出金额问题的历史背景，需用同仓实现及测试证实现在的行为。 |
| `evals/fixtures/repos/solved-ledger/package.json` | 明确 `node --test` 的真正入口，可用来判断金额行为，而不是只 grep 源码。 |
| `evals/fixtures/repos/solved-ledger/src/server.js` | `parseEntry` 在存储前拒绝非数值；在临时副本破坏守卫且保留同名词，暴露了判据缺口。 |
| `evals/fixtures/repos/solved-ledger/test/entries.test.js` | 一个坏金额、一个合法金额。两项对函数有判别力；不是整个 HTTP 服务或所有异常输入的测试。 |
| `evals/fixtures/repos/trivial-fix/README.md` | 清楚写出键的拼写变化，让作者能判断另写一篇经验是否只会重复。 |
| `evals/fixtures/repos/trivial-fix/package.json` | 现行键为 `entrypoint`；值本身能直接检查，不需要另起知识条目解释。 |
| `evals/fixtures/repos/trivial-fix/src/app.js` | 直接从清单取键交加载器，没有隐藏的复杂恢复步骤。 |
| `evals/fixtures/repos/trivial-fix/src/config-loader.js` | 返回传入值的简单包装，与上游一并证实此例容易从代码重建，不能代表所有配置问题。 |
| `evals/fixtures/scripts/check-counterfactual-no-write.sh` | 检查无知识 Markdown 且有跳过理由词；说明文字出现“跳过”并不证明解释与案例相符。 |
| `evals/fixtures/scripts/check-false-causal-claim.sh` | 核固定裁决、证据路径、仓库及索引；能拒错误归因或篡改，但不证明被测方真的执行了对照命令。 |
| `evals/fixtures/scripts/check-headless-no-complete.sh` | 兼查无文档、无完成信号与空操作理由；词表不能替代对其他产物及原因的语义判断。 |
| `evals/fixtures/scripts/check-refuses-unsolved.sh` | 检查拒绝或缺证据表述，文件未创建须结合用例自身的磁盘期望，不只看这一个脚本。 |
| `evals/fixtures/scripts/check-solution-published.sh` | 选第一个知识文件，降级只查字段名，以源码关键字代替原始身份；两类误收均已回放，不能概括为生产发布器失效。 |

四包共用的复验脚本退出 0 表示**冻结版本仍能复现报告中的差异**，并不表示被审对象通过；修好对应问题后应反向修改验收预期。临时仓库自动清理，未向项目的知识目录发布经验。
