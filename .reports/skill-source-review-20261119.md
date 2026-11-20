# 38 个 skill 源码审查：质量结论与回归入口

日期：2026-11-19。对象是 `leo-2026-10-27-update` 当前工作树，不是单独的 HEAD、发布包或宿主镜像。基线 `6708eee4180e39c363416038d6459daf6b3e6f68`；`git diff HEAD --binary -- skills` 的 SHA-256 为 `100f17312af6e502a7f736eb02572d29f11930e0d23a5fc0c0d3fd550af7fed4`。清单取自 `skills/*/SKILL.md`；`skills/_shared/` 是共享来源，不另算一个技能。报告不修改审查对象。

## 结论与优先级

**F1 · P1 · `spec-project-rules`：中文来源的变化会被报告为 clean。已复现。** `scripts/extract-deps.cjs:457` 的四条 Git 查询解析换行分隔的展示文本；`runFreshness` 在 `:409` 与原始引用路径做等值/目录前缀比较。在隔离 Git 仓库固定 `core.quotePath=true`，知识文档声明了 `spec/规则.md` 和 `spec/rule.md`。只有前者成为未跟踪文件时，结果为 `clean, ref_count=2, dirty_count=0`；再增加后者时，结果为 `dirty, dirty_count=1`，列表仍只有英文路径。引用采集器能读到中文，问题在 Git 输出到比较这一步。这样会让后续规划者误信规则不需复核。**验收：** 所有变化来源均用 `-z` 读取路径，不对合法路径做 `trim()`；回归应同时覆盖中文路径的提交、暂存、工作区修改和未跟踪状态，并用未改文件作反例。

**F2 · P1 · `spec-worktree`：离线降级声明和实际基线相反。已复现。** `scripts/worktree-manager.sh:545` 在 fetch 失败时打印 `using local ref`，`:550` 却仍优先选择已存在的 `origin/<from>`。本次隔离仓库 `main=12f826a`，本地缓存 `origin/main=a67b308`，没有可访问的远端；运行 `create audit/probe main` 返回 0，新分支为 `a67b308`。这会让开发或 QA 在缺少本地变更的旧树上成功运行。**验收：** 明确离线策略；若承诺本地回退则使用已解析的 `refs/heads/<from>`，若只允许远端身份就停止。报告来源及实际 OID；有明确分歧的本地/缓存对照必须检查新工作树 HEAD，而非只检查命令退出码。

**F3 · P2 · `spec-simplify-code`：默认范围漏掉新的未跟踪实现和测试。Git 可见性已实测，未运行模型。** `SKILL.md:22` 用分支 diff 与 `git diff HEAD` 的并集界定默认范围。当前树的 `tests/unit/core-skill-handoff-boundaries.test.js` 由 `git ls-files --others --exclude-standard` 列出，两条 diff 都没有它。若同轮还改过 tracked 文件，范围非空，`:25` 的空范围询问也不能发现这一遗漏。`:42` 保护已知 proof，并不能发现所有新实现。**验收：** 先发现未跟踪候选，再按 caller 所属文件/本轮证据纳入；无归属的文件列为排除，不默认扩写权限。用一个任务所属新文件和一个无关新文件作对照。

**F4 · P2 · `spec-dogfood`：新报告可能与旧检查点同名。文档规则可证，未观察到真实覆盖。** `references/phases.md:17` 允许同日选择 start fresh，`:24` 唯一指定的落点仅含日期和规范化后的分支名。同日重跑同一分支必然得到同一路径；`feature/Foo_Bar` 和 `feature/foo-bar` 也会映射到同一 slug。恢复已有报告时校验 SHA 是优点，但不能保护选择新建时的旧证据。**验收：** 只有显式 resume 可以更新原报告；fresh 采取独占创建加后缀或 run-id。同一分支同一天写两次，第一份报告必须字节不变。

**F5 · P3 · `spec-project-rules`：示例中的来源根本不进核验集合。已调真实采集器。** `references/knowledge-format.md:42` 举例 `README:5`，但 `extract-deps.cjs:430` 和 `:437` 过滤无目录且无扩展名的来源。真实采集同一行的 `README:5`、`README.md:5`、`src/规则.js` 仅返回后两者。修最小表述偏差可将示例改为 `README.md:5`；若产品确要支持根目录 `README`，则应在采集器、存活与新鲜度两处消费测试中一起落实。与 F1 不同：此处在采集阶段就丢了引用。

## 检查结果怎样解读

- 对每包实际运行：`node skills/spec-write-skill/scripts/validate-skill.cjs skills/<包名> --json`。34 个 `pass`、2 个 `incomplete`、2 个 `fail`。`unknown_frontmatter_extension` 是非阻塞提示。这里只验证结构和验证器支持的事实，不能证明流程质量。
- `spec-product-pulse` 与 `spec-resolve-pr-feedback` 为 `incomplete`。两者的 `allowed-tools` 列表使用缩进数组，校验器 `skills/spec-write-skill/scripts/validate-skill.cjs:100` 明言不支持此类缩进。不能据此宣布包非法，也不能写成校验通过。
- `spec-riffrec-feedback-analysis` 与 `spec-sweep` 为 `fail`，均命中 `scripts/analyze_riffrec_zip.py` 的 `sensitive_content_detected`。两个文件 SHA-256 同为 `6b4eefb941a1ee199819c2dd2060961bbce9563130c6cad45e040789d4066ce3`；`spec-sweep` 还存在上述 frontmatter 局限。没有读取或转录可疑值，未判定是真实凭据还是规则误报。发布前由维护者在受控环境定位匹配类别、校准脱敏反例；不要为通过校验删除规则或把失败冲销。
- 执行选定 Jest 套件：`node_modules/.bin/jest --runInBand --silent --testPathPattern='tests/unit/(spec-|using-spec-first-|autoresearch-|core-skill-|specialized-skill-|skill-flow-|skill-script-mirror-|ce-post-3-|ce-upstream-skill-)'`。112 个套件，1,327 项通过，0 跳过、0 失败。这是本地单测集合，不是 1,327 次用户场景，也不是整个项目测试。另有 `git diff --check` 通过。
- 下表每行检查一个影响用户结果的决策，并列出下一条最有判别力的场景。**未列为缺陷的条目，仅表示该路径没有足够证据提出缺陷**，不代表逐行验证了其所有脚本、模板、persona 和宿主。最后一列除明确引用 F1–F5 的已执行实验外，均为验收建议，不是执行记录。

## 一、需求到验证

下表源锚均相对于 `skills/<该包>/`。

| Skill | 核查路径、质量判断 | 判别用例或限制 |
|---|---|---|
| `using-spec-first` | `SKILL.md:42`、`references/public-route-map.md:33`：只推荐才等待；已有 workflow 的失败由当前 owner 承接。当前源码包含上轮修改。 | 同一份 diff，分别问“怎么审”和“请审”；前者推荐、后者应真正进入审查。未测试宿主是否已重新加载。 |
| `spec-ideate` | `references/post-ideation-workflow.md:7`、`:17`：生成和反驳有区分；无独立审查时不能提升证据等级，依据不足的候选仍是猜想。 | 给高价值但引用不存在的想法；可以留下假设，不能把它交接为已验证机会。 |
| `spec-brainstorm` | `SKILL.md:13`、`references/plan-write.md:20`：聊天结果与耐久需求分别处理；用户拒绝文件时不会因中断恢复而自动写一份。 | 已明确目标用户、只问边界的小讨论，检查是否不写文件也能交付决定及其依据。 |
| `spec-prd` | `references/prd-readiness-lens.md:37`、`SKILL.md:285`：生产者回执证明结构，产品决定仍要来源；validate 不能写回 ready；非 WHAT 实现复核可保留。 | 同一权限问题分别用具体 owner 决定和只有全局确认的材料；后者不能就绪。合同回执不能证明会议决定真实。 |
| `spec-doc-review` | `SKILL.md:24`、`:52`：无交互并不授权 Markdown 修补；审查结果与文档可实施资格是两个结论。 | 已授权 headless 评审但未授权编辑：字节不变且保留真实阻塞；不能用 `Review complete` 关闭产品决策。 |
| `spec-plan` | `references/plan-handoff.md:43`、`:61`：当前源已补上交接前按最后评审复核的条件，并保护已有产品契约。 | 订单导出角色未定时两种格式都不启动；仅分页建议可交接。没有在实际模型上走两种格式。 |
| `spec-write-tasks` | `references/execution-handoff-contract.md:45`、`:78`：小计划可直接交给 work；有效 hash 不能替代对现有任务包的语义复核。 | 源计划改变后即使旧任务卡看似可执行也拒绝；不要把 skip 当作缺一份交付物。 |
| `spec-work` | `references/feedback-and-tests.md:156`、`references/shipping-workflow.md:32`：收尾不止看运行过的测试是否绿，还对照原计划需证明什么；清理后的证明需复跑。 | 测试通过但少测权限拒绝，不能声称全部验收；上轮已修暂存指纹包含于本次工作树与测试选择中。 |
| `spec-code-review` | `references/scope.md:122`、`:129`：PR 身份以精确提交为准；本地未推送修复不能代替远端证据。普通本地审查与远端审查范围不同。 | 故意使本地比 PR 多一次修复，应分别报告两个版本；本轮未连接 GitHub 实测。 |
| `spec-debug` | `SKILL.md:145`、`references/fix.md:7`：从实际抛错位置和原症状取证，修复后重跑同一症状；修复历史不可由最终绿色结果倒推。 | 通过替换 mock 让窄测变绿，但真实入口仍失败，不能关闭 bug。 |
| `spec-compound` | `references/promotion.md:7`、`:14`：只有有来源、有适用范围和可观察失效条件的已验证经验才发布；不适合复用时可不写。 | 上游 issue 关闭但部署版本未升级，不是删 workaround 的充分证据。 |

## 二、代码质量、交付和开发环境

| Skill | 核查路径、质量判断 | 判别用例或限制 |
|---|---|---|
| `spec-simplify-code` | `SKILL.md:22`、`references/test-value-lens.md:11`：已有证明测试保护合理；默认发现范围仍遗漏未跟踪实现与测试，见 **F3**。 | 一个 tracked 文件和两个新文件混合，区分本轮新增与用户既有文件。 |
| `spec-worktree` | `scripts/worktree-manager.sh:545`：脚本的退出码和输出文案均不足以证明新树基线正确，见 **F2**。 | 比较新树 HEAD、本地 head 和缓存 OID，三者不能靠分支名替代。 |
| `spec-commit` | `SKILL.md:24`、`:90` 及所引用的 `spec-commit-push-pr/references/commit-and-push.md:14`：文件清单不是 hunk 所有权；同路径混入其他编辑时，须证实隔离或停下。 | 同一文件一半是用户 staged、一半是任务修改；不能用文件级提交冒充 hunk 隔离。 |
| `spec-commit-push-pr` | `references/commit-and-push.md:58`：提交和发布分权，并核对实际接收仓库；返回成功应以目标远端而不是本地 commit 为准。 | 已有本地 commit 但 push 被拒，只能报告本地成功。此次无对外 push 或 PR。 |
| `spec-lfg` | `SKILL.md:54`、`:60`：独立审查未完成不进入发布；简化或修复后的最终验证使用重新取得的指纹，不能复用初次 work 的绿测。 | 让初次检查全绿、随后只改变暂存内容，应拒绝沿用旧证明。没有执行实际 landing/CI。 |
| `spec-resolve-pr-feedback` | `SKILL.md:46`、`references/pipeline-mode.md:11`：读、修、提交、推送、回复、关闭线程有不同授权；无人值守的争议需要携带具体选择返回。**结构校验未完成。** | 本地修复但未推送，不得写“远端已修复”或关闭线程。 |
| `spec-runtime-setup` | `SKILL.md:80`、`:113`、`references/provider-readiness.md:14`：只检查与安装修复是不同操作；安装成功不证明索引当前可用。 | 仅 `--check`、有旧图且无新鲜 receipt，不准重建，也不准报告全量就绪。未安装或刷新用户宿主。 |
| `spec-test-browser` | `references/pipeline-orchestration.md:7`、`:18`：实际二进制的 origin conformance 和本次场景结果分开，清理失败不能被通过的路由掩盖。 | 测试路由通过、收尾清理失败，整体不得报已通过；无真实服务身份时不扩大到源码归属结论。 |
| `spec-test-xcode` | `references/setup-and-build.md:7`、`:19`：先探测连接的模拟器工具，再绑定本次 build 的 app 路径和 bundle ID；launch 成功不等于可见。 | 有旧安装但本次构建失败，不能用旧 app 截图报通过。未启动模拟器。 |
| `spec-dogfood` | `references/phases.md:16`、`:24`、`:30`：PR、服务和恢复证据均需绑定目标；新建报告缺少同名保护，见 **F4**。 | 同一天两次 fresh run，原矩阵不变；resume 才继承可核实的行。 |
| `spec-polish` | `references/run.md:11`、`:49`、`:53`：在编辑前界定脏文件，监听端口要能归属于目标工程，不能仅凭端口通就认定看到了正确页面。 | 目标端口被另一个项目占用，不开始修 UI，也不终止别人的服务。未运行目标应用。 |
| `spec-prototype` | `SKILL.md:35`、`references/write-back.md:3`：一次性原型不进入生产实现；回写前要有用户实际体验和选择，并携带体验的版本。 | 需求方尚未看过原型，只留下未决输入，不替用户记录选项获胜。 |
| `spec-app-consistency-audit` | `SKILL.md:105`、`references/headless-runner.md:50`：严格 report-only 与写运行产物的 headless runner 不等价；目前 runner 对前者返回不支持，而不是悄悄写报告。 | 只提出一致性审查、设计材料又不可读取时，保留设计覆盖缺口，不报 App 已一致。 |

## 三、知识、产品与能力维护

| Skill | 核查路径、质量判断 | 判别用例或限制 |
|---|---|---|
| `spec-compound-refresh` | `references/classify.md:9`、`:13`：描述性事实以当前源码为依据；规范性指导不能只因源码相悖就删除，失效条件触发的是重审。 | 外部依据变动但现行代码仍保留 workaround，先保护解释而不是删文。 |
| `spec-handoff` | `references/resume.md:3`、`:11`：显式来源不会被替换成搜索；恢复前复核工作树、证据与当次授权，文档内的“已授权”无独立效力。 | 指定的交接文件不存在时，不从另一场会话挑个相似文件继续。 |
| `spec-explain` | `references/destinations.md:12`、`:18`：讲解可留存本地；选择受众、重写文本、对外发布是不同选择。 | 人未回应发布确认，应有可恢复的本地文件且无外发；未测试真实文档服务。 |
| `spec-pov` | `references/boundaries.md:24`、`:35`：技术采用裁决以具体项目和有界候选为前提，不能把通用科普包装为本项目的采用意见。 | 候选很多且衡量标准未知，Hold 并澄清，不硬选赢家。 |
| `spec-strategy` | `references/update-run.md:9`、`:16`：先区分单一所有者与多人共同维护的文档，再限定更新段落；仓库证据不是用户的战略决定。 | 外部工具的自有章节与本轮目标相邻，更新后保持其内容和顺序。 |
| `spec-project-rules` | `references/knowledge-format.md:42`、`scripts/extract-deps.cjs:409`：声明的引用可存活并不证明它没变；当前路径采集与比较均有反例，见 **F1、F5**。 | 已对照中英文引用及 README/README.md。此处不建议用 LLM 猜测路径修补确定性失败。 |
| `spec-rule-miner` | `SKILL.md:47`、`references/write-targets.md:21`：观察到的频率与强制规则分开，少样本、分裂做法应标明限制。 | 两个子包恰好用了相反惯例，不能合成全仓禁止规则。未实跑采样或写入项目规则。 |
| `spec-product-pulse` | `SKILL.md:25`、`references/run.md:34`、`:44`：未启用数据库则不探测；质量数值要有预先定义的锚点和采样限制。**结构校验未完成。** | 旧配置无打分锚点时应只报定性观察；无数据库或生产服务连接。 |
| `spec-promote` | `SKILL.md:78`、`references/spiral-cli.md:71`：已登录和允许外发是两个判断；未获准传输项目内容仍应能本地生成草稿。 | 已认证但用户仅要文案，检查外部写调用次数为零；未实际登录、发送或发布。 |
| `spec-sweep` | `SKILL.md:117`、`references/run.md:24`、`:28`：共享分支的租约与单机状态分开，不能用失去的租约覆盖另一写者。**结构/隐私门未通过。** | 租约丢失只保留恢复证据，不接管另一个写者。跨包同名分析脚本告警待核实。 |
| `spec-riffrec-feedback-analysis` | `SKILL.md:15`、`references/extensive-analysis.md:7`：快速缺陷报告不默认升级成长分析；音频转录对外传输需另获授权。**结构/隐私门未通过。** | 短视频转写需求不等于允许外发原始素材；未对真实视频做传输，未对命中隐私门的脚本作清白结论。 |
| `spec-optimize` | `references/measurement.md:5`、`references/wrap-up.md:49`：真实重复样本和聚合数不同；预算耗尽、平台期与达到目标分别报告。 | 候选单次低延迟但缺基线多次观测，不能据此宣称稳定提升；未跑实际优化任务。 |
| `autoresearch` | `SKILL.md:83`、`references/orchestrator-routing.md:56`：可机械验证的目标才进入多轮迭代，主观判断走单次交付；达到指标不自动发布。 | predicate 带来无关“绿色”但任务目标未达时不能宣称完成；本轮测试含编排、评分与停止原因判据。 |
| `spec-write-skill` | `references/authoring-workbench.md:50`、`scripts/validate-skill.cjs:100`：包结构检查、写入保证和行为改善是三件事。对本仓三个 `allowed-tools` 列表无法给出完整机械结论，见上文。 | 保留未知扩展且如实区分 unsupported 与 invalid；若扩展校验器，补列表正例、畸形/重复键反例，不能用简单跳过缩进行解决。 |

## 最小后续顺序

1. 先修 F1、F2。一个决定还能不能信旧知识，一个决定实际在哪份代码上工作。两者都已有可反复运行的失败条件，适合先添加真实 Git 红测再修。
2. 再处理 F3、F4、F5：明确新文件归属、保证新建不覆盖旧检查点、统一文档来源示例与解析器。
3. 设置独立的维护者检查单处理四个包的非通过结果；保留失败事实，不得从全绿 Jest 推导各包可发布。
4. 如用于评估真实使用质量，再选少量代表任务，使用隔离、获授权的真实宿主运行，检查最终提交、报告或数据库状态，不以模型自述或结构测试代替。外部 PR、推送、生产数据、转录外发、真实浏览器/模拟器、付费模型与多宿主矩阵均不在本轮执行范围。
