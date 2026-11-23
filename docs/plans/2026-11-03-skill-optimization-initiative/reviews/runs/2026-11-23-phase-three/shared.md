## _shared

冻结基线 `5a55514d9`，逐件通读 **7/7 个文件、1,401 行**。六份引用的分发对象与 README 逐项点名的包相符，但合计是 **14 份，不是 16 份**；五份引用的行数也已过期。14 个目标在冻结提交中分别与来源具有相同 Git blob，且都能追到包内调用。首屏质量则不能按副本数判断：实施计划有明确的人读合同，需求稿有自己的轻量首屏，创意稿的首选方向可能落在首屏之外。

| 包相对路径 | 完整行段 | 中文具体内容判断 |
|---|---|---|
| `README.md` | 1–59 | 这是维护入口，不是第七份可分发引用。第 7–26 行列对了六组目标，却把 `3+3+2+2+2+2` 写成 16；HTML、Markdown、会话决策、延期、YAML 五项行数均与冻结文本不符。词汇文件也不是 `artifact`、`horizon` 等术语的定义表，而是各项目编写词汇表的规则；决策文件适用于需求稿的产品决策和计划的技术决策，不是通用决策记录格式。建议删掉手填行数，让总数取自 `scripts/sync-shared-references.js:25`，按“维护源、随哪些包分发、何时读取”写清每组；`--check` 只遍历注册目标，不会发现 README 数错或未登记的同名文件。 |
| `references/concepts-vocabulary.md` | 1–88 | `spec-compound` 的 `references/assembly.md:59` 在完整捕获时读取，`references/lightweight.md:27` 仅在已有词汇表时读取；`spec-compound-refresh` 的 `SKILL.md:139` 及 `references/modes.md:50` 在维护或显式建表时使用。第 7–13 行把同义合并、仅更新、凭正面证据移除区分清楚；第 35–59 行要求无需源码即可读懂定义，末尾用订位、就餐人和座位解释关系，适合非工程读者。小缺口在示例本身：第 75–76 行把 `Booking` 列为应避免的同义词，第 72 行却把它用作组标题。建议改用表达领域而非弃用词的组名，保留 `Reservation` 为唯一概念标题；不要给词汇表强加执行摘要。 |
| `references/html-rendering.md` | 1–640 | `spec-plan` 的 `references/output-mode.md:25`、`spec-brainstorm` 的 `references/plan-write.md:8`、`spec-ideate` 的 `references/post-ideation-workflow.md:62` 都只在选中 HTML 时读各自副本。可见元数据、锚点兼可见 ID、正文能独立解释图、单元详情默认折叠、来源页脚，使评审既能扫读又能回源；文档评审只报告，不能直接改 HTML。第 330–334 行把权限、停止条件、执行方式等一并列为顶栏内容，但第 598 行起的交付前检查没有问读者能否指出谁受影响、哪里改变、该审什么。建议按产物类型优先显示这些答案，保留可见状态与锚点，把执行细节置后；另将第 242–255 行的固定 `blob/main` 改为已核实且包含该路径的版本，未提交或无法确认时保留相对路径，否则形式上可点击却可能指向别的版本。 |
| `references/markdown-rendering.md` | 1–235 | 同上三包的同一格式选择点在选中 Markdown 时读取本包副本。顶置 YAML、稳定标题、纯 Markdown、相对路径和正文 ID 方便跨工具定位；第 40–41 行规定目标摘要靠前，但第 115–116 行的示意只列目标、权限、执行方式、停止条件和收尾归属，漏示计划章节合同已有的推荐理由、评审焦点与可观察验收。仅照此表填写，字段齐全也可能无法判断要不要同意。建议在既有 `Goal Capsule` 的首句复用写方的业务前后对照，而非再加摘要；保持协议标题不变，用读者语言写内容。统一计划专用的摘要不应用到创意稿。 |
| `references/settled-decisions.md` | 1–45 | `spec-brainstorm/SKILL.md:69` 在提问前读取，已定产品选择只记在产品合同；`spec-plan/SKILL.md:78` 在来源接收前读取，新增的技术取舍才由 KTD 持有。第 9–15、28–45 行区分已权衡、未经检验的指令、模型推断；标注保留被否方案和理由，新缺陷证据仍可推翻旧选择。第 13 行用“随口同意至多算 `user-approved`”作例，第 22 行却明确以已展示取舍为前提。建议改成正反对照：没展示取舍的“可以”不贴标签；展示替代方案和代价后同意才贴。协议标识保持英文，理由用读者语言；决策来源不等于当前获准实施。 |
| `references/tracker-defer.md` | 1–171 | 处置规则归 `spec-work`；`references/shipping-workflow.md:100` 在选定延期后走交互分支；`spec-lfg/references/shipping-tail.md:14` 仅在有明确跟踪器授权时走无人值守分支。`spec-code-review` 交报告，不建单。工单先写问题和影响，再给修复及证据；无授权不探测，无去处保留原发现。需优先消除一个重复建单风险：第 46 行要求结果未知先对账，但只写在非交互分支；第 139–142 行允许交互重试或换目的地，第 159 行甚至笼统要求首次失败即去标签重试。若服务端已建单但响应丢失，可能登记两次。建议两种模式共用同一前置判断：按已授权目标和 `finding_id` 核对，确认未创建且确为标签错误才去标签重试；仍未知则保留该状态。第 47 与 144 行也应统一为“已尝试且确认失败记 `failed`，无获准目的地记 `no_sink`”，两者都不得算已建单。 |
| `references/yaml-schema.md` | 1–163 | `spec-compound` 在 `references/research.md:5`、`assembly.md:3`、`lightweight.md:22` 读取，`spec-compound-refresh` 在 `references/per-action-flows.md:65`、`:85` 为继任文档或改写读取；两包的 `assets/resolution-template.md:11`、`:62` 都回指本指南。它是缺陷与知识两轨的速查表，覆盖分类、必填值、目录、旧文档兼容、证据来源、失效条件和 YAML 引号，不是面向业务读者的正文模板。第 3 行说规范在“本目录”的 `schema.yaml`，仅在两个消费包成立，共享源目录没有该文件；两包的 `schema.yaml` 在基线同 blob，却不属于这 14 份映射。建议区分维护时与安装时的定位，并说明 `--promotion` 只在解析安全检查上增加两项退出字段检查，不担保全部枚举、证据可信或经验仍有效。正文首屏应在两轨模板示范，而非在 YAML 里添摘要字段。 |

**从源文件到产物。** `skills/_shared/references/` 是这六份文字的维护源；上表所列包从自己的 `references/` 加载，不跨包读取 `_shared`。冻结对象按 `scripts/sync-shared-references.js:25` 的全部目标逐一核对，当前工作树另跑 `node scripts/sync-shared-references.js --check`，14 项均一致。此结果只证明字节一致。还有不接收副本、但依赖产物语义的下游，不能算成额外同步目标：

- **需求、计划、创意。** 需求稿由 `spec-plan/references/intake.md:42` 接收；创意由人选择，入选方向可交 `spec-brainstorm`（`spec-ideate/references/post-ideation-workflow.md:112`）。`spec-doc-review/references/document-intake.md:40` 对 HTML 强制只报告；`spec-work/references/work-intake.md:41` 使用计划标题和 ID 定位，只有具备实施就绪条件的软件计划才可据此执行。看到 HTML、看到 `Goal Capsule`，都不构成实施资格。
- **会话决策。** `spec-ideate` 转交已讨论的选择但不签发标注；`spec-lfg/references/plan-brief.md:3` 可传临时简报，定稿后以决策条目为准。`spec-write-tasks` 将约束带入任务；`spec-work` 读当前单元的相关决策；`spec-simplify-code` 保留有意结构；`spec-doc-review` 提取决策，`spec-code-review` 对独立评审隐藏标记、收尾才比对；`spec-commit-push-pr` 仅把已给出的来源用于 PR 说明。证据分别在各包的 `task-quality-guide.md:193`、`work-intake.md:43`、`SKILL.md:38`、`document-intake.md:66`、`intent-and-plan.md:59` / `finish-review.md:75`、`pr-description-writing.md:213`。这些读者不应各自再维护一份决策规则。
- **词汇、经验与残留问题。** 检索到 `spec-brainstorm`、`spec-code-review`、`spec-explain`、`spec-ideate`、`spec-optimize`、`spec-plan`、`spec-prd`、`spec-strategy` 引用项目的 `CONCEPTS.md` 作校准或研究材料；它们不是共享词汇编写规则的分发对象。经验作者按两包内 `schema.yaml` 分类，校验器只给机械证据；例如 `spec-compound-refresh/references/publication.md:54` 明定其余规则由作者检查。延期结果由调用方持久化；`spec-lfg/references/shipping-tail.md:15` 对已建、失败、无可用去处分开呈现，第 34 行不允许用 `no_sink` 本身冒充已经留档。

**首屏判断。** 以下是按模板顺序的源码试读，不是对实际页面尺寸或真实读者的测量。

- **实施计划：能提供可用首屏，依据在生产者，不只在渲染指南。** `spec-plan/references/plan-sections.md:175` 已给出可复述的发票例子：已付款订单可从列表重开发票，详情入口不变；两处沿用相同资格规则，评审可拿已付款和未付款订单核对。建议把这条现有写法同时带入 HTML 和 Markdown 的呈现示意，让普通读者先看到变化，让评审人紧接着看到边界与核验方法。
- **需求稿与创意稿不能套用同一个首屏。** `spec-brainstorm/references/brainstorm-sections.md:42` 已要求用户结果、产品决策依据和未解阻塞，`:151` 有 1–3 行产品摘要；不要用执行方式、单元和收尾信息挤占它。`spec-ideate/references/ideation-sections.md:156` 的骨架先放依据背景、主题维度，再到排序候选；长背景下，读者不翻页就不知道在选哪条路。建议在标题下先点出首选候选、为何值得试、最大代价，再链接原排名与依据；标明是候选而非已决定的需求，不引入计划字段。
- **经验稿：能读到问题，但未必立即知道怎么办。** 两包的 `assets/resolution-template.md:34` 已让缺陷稿先交代用户可见影响，但要经过症状和失败尝试才到解决方法；知识稿 `:83` 先给背景，再写建议及适用条件。建议在现有问题或背景段首句带出“遇到什么、采用什么、何时不适用”，证据和复核条件仍留在原有位置，不复制元数据。

**独立同名文件。** 按冻结 `skills/*/references/` 的完整路径、正文职责及接收者复核 README 第 28–30 行点到的八组，均不在这六源的 `SYNC_MAP` 中。不能以同名判漂移，也不能只看第一行就断定可合并：

- `cross-model-review.md`、`review-output-template.md` 分别有代码评审和文档评审两版：前者区分代码对抗审查与整篇文档审查，后者分别组织代码发现和文档发现。`subagent-template.md` 除上述两个评审包外，还有 `spec-sweep` 的媒体证据采集包，三者交付对象不同。
- `intake.md` 分属 `spec-explain`（讲解输入）、`spec-plan`（计划来源）、`spec-pov`（外部采用判断）；`interview.md` 分属 `spec-product-pulse`、`spec-strategy`、`spec-sweep`，分别产出脉搏配置、战略内容、反馈来源配置。`pipeline-return.md` 在 `spec-debug` 和 `spec-resolve-pr-feedback` 中连一级标题也相同，返回的却分别是诊断结果和 PR 反馈处置结果。`synthesis-summary.md` 在 `spec-brainstorm` 是需求范围检查点，在 `spec-plan` 是规划范围与决策检查点；都不是成品计划。
- `model-tiers.md` 的相同处是分层原则，不是可互换的正文。`spec-brainstorm/references/model-tiers.md:11` 降级后保留调研档案并在写需求前验证主张；`spec-sweep/references/model-tiers.md:11` 须保留媒体和逐条发现供后续对账。差异已不止替换角色名。建议继续独立维护，只有确认要共同演进的那条规则才考虑抽出，不能据同名整份同步。

本次仅审阅并登记上述冻结范围；未修改共享源、包内副本或宿主投影，未派工、运行外部服务、创建工单或进行真实读者评测。这里只签收 `_shared`，不代表第三阶段整体完成。
