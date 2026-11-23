# 阶段二当前版本复核：哪些判断仍然成立

结论：17 包已核销相对冻结版本的全部文件差异，不代表所有行为通过验收。11 月 22 日复核为 55 改、13 增、7 删；11 月 23 日[验收报告整包深审](dogfood-deep-review.md)后为 **65 改、13 增、8 删**。当前磁盘含 **417 项**：78 个新增或修改的现存文件，339 个与冻结版身份相同的路径（含一份本地编译缓存）。删除项不计入 417。冻结表为 407 行评语、412 个唯一路径，其中 5 行分别比较一对文件，并非 412 条互相独立的评语。

**如何复核：** 在仓库根以 `node` 运行本目录的 `verify-coverage.cjs --current`。它比对原台账、冻结 Git 树、本地缓存身份、当前磁盘、下面的差异表以及当前字节和可执行位的整体摘要；不按字数评定审查深度。快照 SHA-256：`60bfdd14653c922b795b540adb53e891f33a66c6d9877f2c0af90121455f6646`。更换检出或缓存消失须报告差异，不补造缓存。语义判断沿用[原逐包记录](report.md)和本页补充，不能从散列推断。下列各节的文件位置均相对同名技能包。

## spec-ideate

面对未选方向的人，应能给出有取舍依据的候选；面对已有需求的人，则不应重新发散。`references/post-ideation-workflow.md` 的“不能跳过需求阶段”约束**本轮新提的想法**，不约束带着已定需求从外部进入的人。两种入口不能只靠标题里的“计划”区分。

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `references/scope-gates.md` | 改 | 本轮明确区分已有产品范围及验收标准、只问如何实施的来件与尚需打磨的想法；前者指向规划，后者保留需求澄清。不授权实际执行。 |
| `evals/cases/r2-refine-variant-phrasing.yaml` | 改 | 日报对象和排除规则已定，下一归属为 `spec-plan`；夹具只收一个名称，不把提供解释的真实用户回复当通用错误。 |
| `evals/cases/refine-own-idea-routes-to-brainstorm.yaml` | 改 | 已选工具但要求打磨需求，与上一例形成对照；只验所推荐归属，不验下游调用。 |
| `evals/cases/non-software-mode-no-label-leak.yaml` | 改 | 咖啡店命名须先索取这家店的具体材料；禁用内部标签与是否真的问对材料是两项检查。 |
| `evals/cases/surprise-me-no-repo-needs-substance.yaml` | 改 | 用户委托选方向不代表已有事实；可索取链接或草稿，不能已经交出无来源的建议。 |
| `evals/cases/vague-subject-gate-asks.yaml` | 改 | 允许用户指定或委托选择主题；不把问“是否看结果”认作识别主题。 |
| `evals/cases/repo-grounded-e2e-writes-artifact.yaml` | 改 | 明示只让准备器建基线，不让任务暂存或提交；交付的相对路径需指向新 HTML。留存策略是否有价值仍靠内容判断。 |
| `evals/eval.yaml` | 改 | 普通运行只覆盖两个转交场景和落盘；不能用普通清单的通过数签收澄清行为。 |
| `evals/semantic.yaml` | 增 | 三个依赖语义的场景独立登记，轨迹供判分；未运行正式模型不记通过。 |
| `evals/fixtures/repos/mini-ledger/prepare-eval.cjs` | 增 | 校验源文件身份和干净索引，确认没有旧 `docs` 后设一次性标识；不能在已有文稿上重设起点。 |
| `evals/fixtures/scripts/check-ideation-artifact.sh` | 增 | 检查新文件唯一、目录/后缀、标题和正文结构，以及答复里的路径；标记齐全不等于建议有用或页面可读。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 删 | 旧通用词表不足以区分问材料与否认需要材料；主题、店铺和无仓库场景已分别登记。 |
| `evals/fixtures/scripts/check-r2-asks.sh` | 删 | 不再保留第二份问号判断作为主题澄清的证明；其他包同名脚本未受此次删除影响。 |

## spec-prototype

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `references/preview.md` | 改 | 同一屏刷新与回根入口查看最新屏不同；版本接口返回文件名，不能证明改过样式已经呈现在浏览器。 |
| `scripts/light-webserver.js` | 改 | 无屏时给等待页，根页面直接读取，子目录页面跳到逐段编码的实际路径，使相对资源以页面为基准加载；保留原预览访问边界。 |
| `evals/cases/discovery-routes-out.yaml` | 改 | 方向尚未选定；可推荐探索或澄清，但不能在一个只问归属的回答里同时选择两者。 |
| `evals/cases/go-ahead-before-build.yaml` | 改 | 只讨论图表优先还是数字优先时，解释拟作比较和后续预览即可，不必为了打分再提问；宣称已启动则不符。 |
| `evals/cases/undefined-question-gate.yaml` | 改 | 只有“做个原型”时须问要用原型验证哪项决定，不以泛问材料代替。 |
| `evals/eval.yaml` | 改 | 默认保留无交互环境和方向转交，只能回答是否处理这些入口。 |
| `evals/semantic.yaml` | 增 | 两个讨论/准入用例与普通清单分开；判分模型看到的动作证据仍受轨迹质量限制。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 删 | 讨论已清楚时无需强制问句，两种情境分别按自己的预期判断。 |
| `evals/fixtures/scripts/routes-to-discovery.sh` | 删 | 旧脚本搜目的地字符串，现由夹具完整匹配单选；历史回放不再是当前运行入口。 |

## spec-optimize

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `SKILL.md` | 改 | 配置从 `measurement.calibration.mode` 读取；测量模式比较指定版本，不等于授权搜索、改写候选。 |
| `scripts/decide.cjs` | 改 | 配对比较截取与候选对应的基线样本再聚合，两端用同一口径计算排名和改善；未配对的尾样本不应改变保留决定。 |
| `references/wrap-up.md` | 改 | 负责人先看保留版本、停止原因及是否独立确认，再看次数与成本；不能把选择集改善当最终集成收益。 |
| `scripts/parallel-probe.sh` | 改 | 本轮实测旧版：缺工作目录时误报根目录无关数据库，缺共享文件时却报可并行。新版在扫描前返回 `serial/scope_unavailable`；有效范围仍可区分无阻碍和共享数据库。仅是启发式，不证明并行安全。 |
| `references/measurement.md` | 改 | 运行者须纠正工作目录或声明的共享路径后再探测；没有命中与根本没有完成探测不能混写。 |
| `evals/cases/debug-request-routes-out.yaml` | 改 | 不稳定崩溃且缺复现条件是诊断工作；精确推荐 `spec-debug`，不允许直接试验掩盖故障。 |
| `evals/cases/empty-input-asks.yaml` | 改 | 无目标时询问对象或已有优化说明；合理祈使句有效，复述问题不算开始实验。 |
| `evals/cases/no-metric-goal-gated.yaml` | 改 | 笼统“变好”缺可量化目标；应说清需要什么依据，不自造指标。 |
| `evals/cases/r2-fastest-no-measure.yaml` | 改 | “最快”只有方向，没有可重跑的度量；可解释基准缺口而非强制问号。 |
| `evals/eval.yaml` | 改 | 默认仅登记故障转交，不能据此评价度量准入。 |
| `evals/semantic.yaml` | 增 | 将无目标、无指标和只说最快分列三个任务；清单可加载不等于模型自然停止。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 删 | 无输入的场景改验询问对象，不靠词表。 |
| `evals/fixtures/scripts/check-no-metric-gate.sh` | 删 | 不再以提到指标或基线等同于停止实验。 |
| `evals/fixtures/scripts/check-r2-asks.sh` | 删 | “最快”变体改验度量前提，保留陈述式解释这一合法答案。 |

## spec-pov

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `evals/cases/design-question-not-verdict.yaml` | 改 | 页面布局尚缺用户需求，转需求而非给外部技术采用结论；夹具只看所选归属。 |
| `evals/cases/r2-real-verdict-works.yaml` | 改 | 在确有 MySQL 接入的离线项目谈迁移，要求结论、依据、再考虑条件，不预置“必须迁移”。 |
| `evals/cases/storage-premise-unverified.yaml` | 增 | 使用另一份内存实现反问同一迁移问题；用户提到数据库不证明项目在用它。 |
| `evals/eval.yaml` | 改 | 设计分流、迁移前提成立和不成立均登记；三者不能互相代替。 |
| `evals/fixtures/repos/mysql-ledger/README.md` | 增 | 业主要求不停服，但无演练或代表性负载；这是决策材料，不是生产运行证明。 |
| `evals/fixtures/repos/mysql-ledger/src/storage.js` | 增 | 工厂创建 MySQL 连接池，是当前接入类型的源码证据；不证明数据库可达或另一方案更快。 |
| `evals/fixtures/repos/mysql-ledger/prepare-eval.cjs` | 增 | 固定这份说明和存储源码的基线，防止临时改项目来支持裁决；不连接数据库。 |
| `evals/fixtures/repos/mini-ledger/prepare-eval.cjs` | 增 | 单独核对内存项目的文件清单及未声明源文件；不能与数据库项目互换基线。 |
| `evals/fixtures/scripts/check-r2-verdict-given.sh` | 改 | 核对有限决策值、`mysql` 和确切文件、理由与复核条件非空；不裁定文本理由是否充分。 |
| `evals/fixtures/scripts/check-unverified-premise.sh` | 增 | 同一输出合同下必须识别 `memory` 并引用服务源码；复用结构而不复用数据库结论。 |

## spec-commit-push-pr

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `evals/cases/description-only-non-mutating.yaml` | 改 | 有已提交差异时只起草正文，要求引用对应文件；不得把暂存区外编辑写成 PR 已交付内容。 |
| `evals/cases/description-empty-range.yaml` | 增 | 只有 README 未提交编辑时应报空提交范围，而非生成貌似有内容的草稿。 |
| `evals/eval.yaml` | 改 | 空范围停止与有差异起草分别登记，不能只测停止就证明具备正常起草能力。 |
| `evals/fixtures/repos/mini-ledger/prepare-eval.cjs` | 改 | `--draft-range` 为指定分支造一个只改 `RELEASE.md` 的提交，再制造待提交编辑；普通准备路径不创建该差异。仅准备阶段有权建基线。 |
| `evals/fixtures/scripts/check-desc-only.sh` | 改 | 核对比较点、提交中真实文件、当前内容和回复正文引用；写出文件名仍不能证明草稿解释准确，远端否定结论只及已观测记录。 |
| `evals/fixtures/scripts/check-empty-range.sh` | 增 | 核对受保护内容、基线与 `main` 同一提交，回答须区分没有已提交变更和没有工作树变更，文件数组应为空。 |

## spec-commit

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `evals/fixtures/scripts/check-logical-grouping.sh` | 改 | 同样的提交内容落到未授权分支也拒绝；末态验收不等于还原中途分支操作。 |

## spec-simplify-code

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `evals/fixtures/repos/mini-ledger-guarded/test/support/ledger-proof.cjs` | 改 | 在坏输入前后都实际创建一次，成功响应须是 `201` 和 `ok`，随后再查列表；不仅仅是服务仍可启动。 |
| `evals/fixtures/repos/mini-ledger-guarded/prepare-eval.cjs` | 改 | 固定更新后的证明文件身份；只更新测试而漏更新基线会在准备阶段失败。 |
| `evals/fixtures/scripts/check-r2-safety-stays.sh` | 改 | “更优雅”变体也需在允许源码拆分后跑同一行为证明；不是用行数判定简化成功。 |
| `evals/fixtures/scripts/check-safety-preserved.sh` | 改 | 常规重构和措辞变体同源，核对文件保护和真实 HTTP 结果；只保证该夹具覆盖的公开行为。 |

## spec-compound

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `evals/fixtures/scripts/check-solution-published.sh` | 改 | 正例须恰有一篇可晋升文档、正式校验可用，且受保护源码等于原夹具。单凭正文提到金额、回复说已发布，都不能证明来源支持因果。 |

## spec-handoff

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `evals/cases/resume-sparse-source-degraded-orientation.yaml` | 改 | 明确只是查看指定模糊记录，区分读到哪个来源、哪些变更已验证和下一任务是否已知，不让其他记录替它背书。 |
| `evals/fixtures/scripts/check-degraded-orientation.sh` | 改 | 核对来源、空已验证数组及未知下一步，并保留无新交接物/部署标记的检查；不能推断自然语言交接稿人人看得懂。 |

## spec-lfg

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `scripts/pr-watch-state.cjs` | 改 | 在计算下一代观测前拒绝未知状态；大小写规范化后只认开放、关闭、已合并。未知值不应提前结束观察或改写旧日志。 |

## spec-resolve-pr-feedback

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `evals/fixtures/scripts/check-authorized-fix.sh` | 改 | 本地 README 修改、提交和索引有独立证据；缺轨迹或无工具调用不能再证明未外写。命令匹配仍只覆盖已识别的调用形式，不是审计全部远端操作。 |

## spec-polish

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `scripts/detect-project-type.sh` | 改 | 同目录 Astro 可解释它的 Vite 配置，不能吞掉独立 Next 或另一子项目的 Vite；多应用时保留选择。 |
| `references/launch-json-schema.md` | 改 | 即使只配一项也必须有非空唯一名称；文档读者按表填写应符合读取器，而不是等启动时才发现字段缺失。 |
| `scripts/resolve-port.sh` | 改 | 这里改的是说明而非运行顺序；显式参数仍优先，Rails 的 Procfile 优先于 Puma 配置。 |
| `references/dev-server-detection.md` | 改 | 将读取顺序与脚本对齐；静态字面量是候选端口，不是已经监听或属于所选应用的证据。 |

## spec-dogfood

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `references/dogfood-report-template.md` | 改 | 先回答哪个版本、实测几项、套件怎样、首要阻断是什么；流程图列范围，矩阵初始为待测。浏览器绿而必要套件红不能放行。 |
| `references/phases.md` | 改 | 在尚未建立报告就停止时，优先交代没测到什么和第一个解阻步骤；不要用五项许可掩盖真正阻断，也不制造空报告。 |
| `SKILL.md` | 改 | 报告覆盖所有受影响流程，未必能实测全部；交付未就绪报告不授权发布。 |
| `references/test-matrix-taxonomy.md` | 改 | 从浏览器执行者的受控观察判断控制台，不向编排者提示另一条直接执行路径。 |
| `evals/cases/owner-unavailable-stops.yaml` | 改 | 将能力不可用设为题设；先建立非空分支差异，不能从无页面推断缺执行者。 |
| `evals/cases/trunk-target-rejected.yaml` | 改 | 检查当前主干后给出原因、零计数及改用分支的动作；不涵盖 PR 基线解析。 |
| `evals/cases/polish-request-routes-out.yaml` | 改 | 单选协作打磨入口，否定提及、多个或错误去向不再通过。 |
| `evals/cases/r2-code-review-routes-out.yaml` | 改 | 单选静态评审入口；只验证推荐，不证明没有启动工具。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 改 | 与接口实现对齐：请求传两项，另外两项由服务生成，没有五字段表单。 |
| `evals/fixtures/repos/mini-ledger/prepare-dogfood-fixture.sh` | 改 | 保留功能分支和真实提交准备逻辑，移除非英文维护注释。 |
| `evals/fixtures/scripts/check-owner-unavailable-stop.sh` | 改 | 要有正确的功能分支、接口变化和工具轨迹；拒绝无观察、错误恢复动作和已知浏览器调用。 |
| `evals/fixtures/scripts/check-trunk-reject.sh` | 改 | 检查主干身份与停止决定；功能分支不可复用这个通过信号。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 删 | 当前四例均不使用；问句不是正确转交或停止的证据。 |

## spec-test-browser

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `references/route-and-report.md` | 改 | 把结果、实测/范围放在首屏；已测失败和不可测分别记，不能用应用页面看似正常覆盖清理失败。表内样例不是默认结果。 |

## spec-test-xcode

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `evals/cases/mcp-unavailable-stops.yaml` | 改 | 只请求识别工具状态、构建是否执行、如何恢复；不再把一个宿主镜像路径当所有被测源码，也不授权安装工具。 |
| `evals/fixtures/scripts/check-xcode-mcp-unavailable.sh` | 改 | 已调用探测须能关联到对应错误结果；拒绝已知构建动作和空轨迹。仅从未匹配到已知工具不能证明宿主确实没有工具；报告不得据此声称全宿主覆盖。 |

## spec-worktree

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `SKILL.md` | 改 | 返回主检出应使用探测到的非空主路径，未知时先列工作树；当前工作树的顶层目录并不总是主检出。 |

## autoresearch

| 文件 | 变化 | 对调用者、判据或产物的判断 |
|---|---|---|
| `regression.md` | 改 | 只有基线和候选都可比较才把硬性维度计为已评估；新增覆盖与缺基线都不算通过。 |
| `scripts/score-regression.sh` | 改 | 分开打印已评估及未评估的硬性维度；保留原计算与退出码，不将单项资源得分解释为发布证据。 |
| `references/security-checklist.md` | 改 | 本轮按原公式重算示例为 `20 + 15 + 7 = 42`，原为 48.3。报告同时列覆盖与严重度，活动分不是安全程度，不应以发现越多声称系统越安全。 |

## 未改内容怎样承接

未改路径的文件身份由脚本全量检查；内容判断按原台账逐路径保留，不把原“待验证”自动升为“通过”。以下是改动使原来简短的评语不足以说明上下游关系之处：

- **需求已定与刚作选择不同。** `spec-ideate/references/post-ideation-workflow.md` 的选择后交接仍只传所选方向、依据和限制；不能把新加的外部来件规划入口当作交接捷径。`spec-prototype/references/write-back.md` 也只回写实际选择；浏览器展示正确不等于已经有人作出选择。
- **验收报告的三个退出点不能混写。** 无比较依据、尚未建立报告时，`spec-dogfood` 做简短受阻说明；建立矩阵后，中断应保留待测行；最终必需套件失败则可交付报告但不判就绪。`spec-test-browser/SKILL.md` 的目标来源和动作授权仍由调用者提供，填写报告字段不补齐授权。
- **工作已改不等于讨论已关。** `spec-resolve-pr-feedback/references/targeted-mode.md` 的过时评论要重新定位；未授权回复或关闭时保留对应状态。`references/pipeline-mode.md` 对待人决定的反馈返回原讨论、选项和代价，不由自动调用者代选。上层 `spec-lfg/references/review-followup.md` 不能用本地通过代替远端状态。
- **指标和决定分开。** `autoresearch/security.md` 的活动分可在新增发现时上升，严重级别和未测范围才影响处置；`spec-optimize/references/measurement.md` 中的并行探针也只是建议。二者都不应以脚本退出成功替代真实任务门禁。
- **未改的夹具也有消费关系。** 对数据库建议，应同时读 `spec-pov` 两份项目的实际存储实现，而不是把准备器或 README 当运行证明；对代码简化，普通夹具没有受保护版的测试入口，不能把受保护版的绿灯借给普通版。`spec-handoff` 的模糊记录缺少下一任务，完整旧记录中关于分页的叙述也不覆盖当前服务源码。

**历史验证（11 月 22 日）：** `verify-coverage.cjs --current` 当时通过；移除一条文件记录、替换快照摘要，两次均被拒绝。7 套 Jest 共 82 项通过。[历史本地回执](../../../../../../.spec-first/workflows/spec-debug/spec-first/phase-two-current-20261122-1610/verification-run-summary.json)只绑定当时工作树，不能为最新修改签收。11 月 23 日的检查与边界见[本包验收记录](dogfood-deep-review.md)。

**验收边界：** 当前版是有冻结基线的增量内容复审，加上一个包的完整深化，不是 17 包逐分支的再次独立评审。脚本核销全集、局部行为回归及读者试读分别回答不同问题。仍开放：其余包历史评语未覆盖的分支深度、真实研发或验收负责人的脱离聊天试读、正式语义判分和真实宿主行为。本次未另行委派独立评审，未调用付费模型、改宿主镜像、提交或推送。
