# 从协作预览到提交交付：五包内容审查

版本见[总表](report.md)。以下各节均用包相对路径，条目覆盖该文件全文；相同字节按同一冻结提交的 Git 对象复用，另判各调用点。此处的产物分别交给现场用户、发布负责人、上游工作流和 PR 评审人，并非五份格式相同的技术方案。

## 先改什么

| 触发与影响 | 依据、建议和复验 |
|---|---|
| 自动选择了未确认的应用，用户可能在错误预览上提意见 | 临时空 Git 仓库根只放 `next.config.js` 与 `astro.config.js`，运行 `detect-project-type.sh` 实得 `astro`；同根改成 Next 与 Vite 得 `multiple`。入口要求有歧义必须选择，Astro 配方只解释它优先于其底层 Vite。建议分类器只折叠有依据的组合；保留 Astro+Vite 正例，用 Astro+Next 和三框架反例验收。没有实际启动错误服务。 |
| 配置表让使用者提交机器不接受的单配置；端口说明给出两个答案 | 同一夹具 `.claude/launch.json` 只有一个 `runtimeExecutable: npm`，读取器实得 `__INVALID_LAUNCH_JSON__`；加上 `name: dev` 返回对象。`Procfile.dev` 的 `web: rails server -p 4042` 与 `config/puma.rb` 的 `port 4041` 并存，`resolve-port.sh <root> --type rails` 实得 `4042`。先对齐文档与已有行为，不为修表格更改兼容性；各删去一个来源再验回退。 |
| 报告初稿列出的是拟测流程，但标题称已测；未读到底的发布负责人容易漏看阻断项 | `spec-dogfood/references/dogfood-report-template.md` 的流程图在执行前就写，矩阵从 `Pending` 开始，总结和整套测试却在最后。建议首屏显示目标版本、已执行/待验证数、是否可放行与首要阻塞；图名改为覆盖范围，逐场景保留原始状态。用零执行、一项失败、浏览器全绿但套件红三份成稿试读；当前是结构判断，未观察读者误放行。 |
| 工作树切回指引并不能带用户回到主检出 | `spec-worktree/SKILL.md` 的切回示例使用 `git rev-parse --show-toplevel`；在关联工作树内该值就是当前关联根。应消费探测返回的 `main_worktree_root` 并处理空值，用物理路径不同的两处检出验证。创建判据也没比对主 HEAD、目标分支与起始提交，不宜把它视作隔离身份验证。 |
| 只写 PR 草稿的用例没有一个可描述的已提交分支差异 | 用例在 `main` 只改未提交 README；写作规范 Pre-A 却要求已绑定的提交范围，禁止把工作区内容当已发布，空范围应停止。当前判据反而要求标题及至少十个非空白字符。拆出“已提交分支草稿”和“拟提交改动预览”两例；后者明确未发布。测有真实范围的正例、无范围而诚实停止、虚构已发布内容；不需要真的推送。 |

## spec-polish：24 项

交付物首先是能访问且归属已确认的实际 URL，然后才是本次用户反馈、改动及复验；启动配置只供工具消费。无真实协作回合或用户认可，不签收视觉效果。

| 文件 | 判断 |
|---|---|
| `SKILL.md` | 人在环看页面逐项提意见，先界定分支、启动和修改权限；浏览器自动检查交给专门入口，不把用户看见页面当测试通过。 |
| `references/run.md` | 保留已选命令、目录、环境和端口；归属不明的占用不复用，真实 URL 可修正，超出回环边界只能人工看。 |
| `references/dev-server-detection.md` | 分层来源方便解释为什么选这个端口，但第 3、4 项顺序与实现相反。 |
| `references/dev-server-astro.md` | 解释 Astro 和 Vite 同存；不能推广成覆盖任意独立框架。默认 4321 不是实际地址证据。 |
| `references/dev-server-next.md` | 对多包工程明确用应用目录，不要让根命令启动所有包；保留项目自己的启动参数。 |
| `references/dev-server-nuxt.md` | 区分应用端口和内部 Nitro 端口，提醒增量选端口后需核对实际 URL。 |
| `references/dev-server-procfile.md` | 启动多进程时需识别 web 行而非把后台任务当服务；保存示例前核项目实际工具。 |
| `references/dev-server-rails.md` | 启动器与进程文件合读；其端口顺序与实际 4042 相符，与通用表冲突。 |
| `references/dev-server-remix.md` | 将经典和基于 Vite 的应用分流，解释旧版仅监听文件不能证明 HTTP 已就绪。 |
| `references/dev-server-sveltekit.md` | 指出特有签名与通用 Vite 签名可同存；读者不能据此断言分类器一定返回特有类型。 |
| `references/dev-server-vite.md` | 区分 HMR 与页面端口；占用时不擅停别的进程，需验证实际实例。 |
| `references/launch-json-schema.md` | 多框架样例可直接理解，`name` 必填条件却与选择器不符；不是用户的视觉验收表。 |
| `scripts/config-port.cjs` | 词法取单一字面值，不执行用户配置；无法确认语义归属时仍需启动证据。 |
| `scripts/detect-project-type.sh` | 根目录优先，浅层查找去重、排除夹具，零/一/多候选各有输出；根目录 Astro 特例范围过宽，已有隔离对照。 |
| `scripts/read-launch-json.sh` | 区分缺文件、无配置、无效、多选和指定项不存在；必须解析哨兵，成功退出不保证有可用配置。 |
| `scripts/resolve-package-manager.sh` | 锁文件按固定顺序返回可执行名及参数尾；无清单有专用哨兵，不证明项目定义了 dev。 |
| `scripts/resolve-port.sh` | 对显式端口、作用目录和框架取值；Procfile 在 Puma 前，与函数头注释也相反。端口不是进程身份。 |
| `evals/eval.yaml` | 仅登记两条分流，不能验从 URL 交付到用户确认一轮修改。 |
| `evals/cases/r2-screenshot-review-routes-out.yaml` | 给定截图要求静态评论，检测另一入口名；夹具没有指定截图，不能据此验证视觉判断。 |
| `evals/cases/review-request-routes-out.yaml` | 纯代码评审不应启动服务；出现入口名并不能证明没有启动动作。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 描述记账 API，适合验证分流，不能代表有实际可预览的页面。 |
| `evals/fixtures/repos/mini-ledger/package.json` | 提供包身份，没有可验证的前端启动脚本。 |
| `evals/fixtures/repos/mini-ledger/src/server.js` | 内存接口，无截图对应的页面；不应用来验正向协作打磨。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 识别提问措辞；两条登记用例并未调用，不能抵充分流缺失的行为证据。 |

## spec-dogfood：16 项

| 文件 | 判断 |
|---|---|
| `SKILL.md` | 负责人从分支差异、流程到整套复验负责，工作树及浏览器委托不转移验收责任；缺工具和无适用界面是不同出口。 |
| `references/phases.md` | 用可解析基线构建差异，按用户旅程推导场景；效果授权、浏览器返回、修复后重放、未授权提交和最终套件分别处理。 |
| `references/test-matrix-taxonomy.md` | 功能、人体感受、错误、无数据、辅助访问和不同尺寸是选择维度，不能以列了维度当作走过流程。 |
| `references/dogfood-report-template.md` | 将实际缺陷与体验摩擦分开、决策有选项，可作恢复点；初始及终版共用标题存在时态问题，见首页。 |
| `evals/eval.yaml` | 四个停止/转交用例，没有走完整矩阵并产生最终判定的正向场景。 |
| `evals/cases/owner-unavailable-stops.yaml` | 描述把无 UI 与缺浏览器执行者并列；应分别准备有 UI 无能力和有能力无 UI 的输入。 |
| `evals/cases/polish-request-routes-out.yaml` | 有人现场协同应转打磨；只要求输出入口名。 |
| `evals/cases/r2-code-review-routes-out.yaml` | 明令不开浏览器，静态评审是合适去向；不能从名字推断工具零调用。 |
| `evals/cases/trunk-target-rejected.yaml` | 点名主干无差异，不应扩大到全站测试；与已有特性分支的不可用场景分开。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 提供应用背景，没给用户旅程或起停能力事实。 |
| `evals/fixtures/repos/mini-ledger/package.json` | 缺 dev 命令是项目启动前提缺口，不是宿主缺少浏览器。 |
| `evals/fixtures/repos/mini-ledger/src/server.js` | 只提供 HTTP 数据；有服务代码不等于有浏览器可走的流程。 |
| `evals/fixtures/repos/mini-ledger/prepare-dogfood-fixture.sh` | 构造主干及接口结构变化，排除空差异遮挡；不设置执行者可用性。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 同字节提问助手，不在这四条的实际成功判据里。 |
| `evals/fixtures/scripts/check-owner-unavailable-stop.sh` | 检查停止、修复入口和轨迹中的命令；没有读取真实执行者探测结果，也没有从无 UI 推出不可用的依据。 |
| `evals/fixtures/scripts/check-trunk-reject.sh` | 从回包与轨迹判停止，不是一次正常分支全流程验收。不要将此例从拒绝主干推广到其他基线。 |

## spec-test-browser：12 项

| 文件 | 判断 |
|---|---|
| `SKILL.md` | 由调用方拥有服务；显式来源、能力、业务副作用和清理是不同条件。静态合同明确承认不硬验原始参数重复。 |
| `agents/openai.yaml` | 禁止隐式触发；实际正向交付来自打磨、验收、实施和流水线，不是普通用户自动入口。 |
| `references/pipeline-orchestration.md` | 缺来源或权限返回未测，能力不支持不能写不适用；既不启动服务，也不能让通过的步骤掩盖清理失败。 |
| `references/route-and-report.md` | 按当前路由和渲染关系定范围，每条要有真实结果，失败不能改写为跳过。示例把跳过的路由也放入“Pages Tested”；建议用“范围内/实际已测”两个数，顶部给整体结论。 |
| `scripts/agent-browser-run-context.cjs` | 准备私有目录、逐步重验计划、绑定二进制、按受限参数运行并单列清理；步骤成功表示进程成功而非业务断言。`a11y` 实为快照，不能表述成完整无障碍验收。 |
| `scripts/agent-browser-exact-origin-conformance.cjs` | 独立本地服务验证允许/禁止来源，绑定二进制且要确认清理；证明此能力，不证明受测应用能访问或满足需求。 |
| `evals/capability-cases.json` | 八组正反能力场景包含缺来源、身份与副作用；是预期清单，不是本次八份运行回执。 |
| `evals/eval.yaml` | 仅登记来源缺失或非法两例；与独立能力清单不是同一分母。 |
| `evals/cases/invalid-origin-rejected.yaml` | 输入同时含非回环域和非根路径，能验组合拒绝，不能分离两个原因。 |
| `evals/cases/missing-origin-not-run.yaml` | 只给分支选择器，预期缺来源而非猜端口；恢复条件是调用方给出来源。 |
| `evals/fixtures/scripts/check-browser-invalid-origin.sh` | 要原因码、轨迹，排查实际工具名和命令特征；只对被观测到的轨迹成立。 |
| `evals/fixtures/scripts/check-browser-missing-origin.sh` | 排查推测服务/浏览器调用；没有直接检查一般性读取项目脚本推断端口的动作，不能用此通过证明所有推断都被观察到。 |

调用方核对：`spec-dogfood/references/phases.md` 交确切回环来源和安全场景；`spec-lfg/references/stage-routing.md` 在适用但缺来源、失败或未测时阻断；`spec-work/references/implementation-loop.md` 需要与画面尺寸、状态相符的当前截图。前一调用的探测结果不能替后一调用绑定代码版本。

## spec-worktree：17 项

| 文件 | 判断 |
|---|---|
| `SKILL.md` | 解释新工作和隔离现有引用的区别，成功可能只是发现已有检出。切回主检出的示例有误；返回路径不是推送目标。 |
| `agents/openai.yaml` | 内部入口不隐式调用。实施和分支验收各自提供目标、原因及允许的副作用。 |
| `scripts/worktree-manager.sh` | 探测输出区分本工作根与主工作根，新建核验基线、隔离已签出分支只返回其路径，信任配置仅提示。失败可能已留下目录或忽略项，不能认为已完全回滚。 |
| `evals/eval.yaml` | 三区分普通、非 Git、尚无提交；不覆盖所有已关联/已有目标及切回场景。 |
| `evals/cases/governed-caller-create-worktree.yaml` | 明确给新分支、设置范围与不复制环境，描述承诺保持主 HEAD；实际判据不足。 |
| `evals/cases/not-git-repo-fails-closed.yaml` | 目标非仓库，不应私自初始化再创建；只有不含 Git 元数据的真实目录才能测这个前提。 |
| `evals/cases/unborn-repo-create-refuses.yaml` | 与上例不同，此例已有仓库但没有基线；不能补一个提交再声称获准创建。 |
| `evals/fixtures/repos/plain-app/README.md` | 说明仅为隔离夹具，不能从应用描述推断目标分支。 |
| `evals/fixtures/repos/plain-app/package.json` | 私有空壳，不需安装依赖就能验证工作树。 |
| `evals/fixtures/repos/plain-app/src/server.js` | 内容给出可恢复源码身份，本例不需启动常驻服务。 |
| `evals/fixtures/repos/plain-app/prepare-worktree-fixture.sh` | 设置初始提交却抑制提交失败；应显式确认夹具已有预期 HEAD，避免误归责给创建器。 |
| `evals/fixtures/repos/plain-app-nogit/README.md` | 与普通目录同字节，负责非仓库输入；说明文件不能证明宿主没初始化 Git。 |
| `evals/fixtures/repos/plain-app-nogit/package.json` | 与正例同字节，说明 Node 应用身份不决定 Git 状态。 |
| `evals/fixtures/repos/plain-app-nogit/src/server.js` | 同一 HTTP 样本，拒绝分支无需运行，存在源码不是创建工作树授权。 |
| `evals/fixtures/scripts/check-create-worktree.sh` | 目录、数量、主分支名、忽略文本、回包均检查，但未比较主 HEAD，也未读取目标分支名或基线。应按真实 Git 身份复验。 |
| `evals/fixtures/scripts/check-not-git-refuses.sh` | 查无 `.worktrees` 且回包有宽泛词；既未断言目录仍非仓库，也未取得失败探测回执。 |
| `evals/fixtures/scripts/check-unborn-refuses.sh` | 排除额外工作树及 ready，但没核实 HEAD 仍不存在。对拒绝原因与仓库终态应分别验。 |

## spec-commit-push-pr：17 项

| 文件 | 判断 |
|---|---|
| `SKILL.md` | 区分只写草稿、改远端描述和完整发布；下游看实际发布身份、未决意见，不凭 PR URL 结束。 |
| `agents/openai.yaml` | 禁止隐式触发，生命周期和授权仍由公开调用方负责。 |
| `references/context.md` | 正常空数组和查询失败不同；匹配基仓、分叉拥有者与分支才可修改，分离 HEAD 不按空分支查询。 |
| `references/branch-creation.md` | 远程基线和本地未推提交分别核实，存在未决取舍则停止；不自动藏起用户改动。 |
| `references/commit-and-push.md` | 按路径或已验证的块隔离，发布目标绑定唯一端点，权限、实际提交与推送回执分列；不代替调用者执行欠缺的验证。 |
| `references/pr-description-writing.md` | 有可用的传统评审结构：可见变化、范围、为何这样做、验证及残余风险；项目指定模板优先。Pre-A 明确禁止称未提交为已发布，空范围不编造故事；校准用例不应反向激励。 |
| `references/compose.md` | 区分运行行为和文件后缀，原有演示材料与决策记录保留；配置决定资格，不授予归档权限。 |
| `references/apply-and-handoff.md` | 使用临时正文文件，修改前再对版本，发布后核对正文与目标；归档失败不伪造稳定链接，跟进留给流水线。 |
| `evals/eval.yaml` | 两例均不需要真正写远端；不能证明正常创建或改写远端描述。 |
| `evals/cases/description-only-non-mutating.yaml` | 要求基于尚未提交的当前差异写说明，却不提供 Pre-A 所需的非空提交范围；见首页。 |
| `evals/cases/no-landing-auth-stops-before-push.yaml` | 已有提交权限但无发布权限；此调用要求连本地暂存也不做，并解释移交。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 原始标题是受控的唯一预期工作区差异，不是已发布功能。 |
| `evals/fixtures/repos/mini-ledger/package.json` | 基线保护对象，不应改包元数据来制造分支差异。 |
| `evals/fixtures/repos/mini-ledger/src/server.js` | 受保护的业务实现，行为不变；读到服务不意味着本次 PR 改了接口。 |
| `evals/fixtures/repos/mini-ledger/prepare-eval.cjs` | 一次登记 HEAD/索引后改 README，本身没创建可描述的特性分支或基线远端。 |
| `evals/fixtures/scripts/check-desc-only.sh` | 真实状态、限定源树及远端写轨迹有价值；末尾只测标题形状和正文长度，不能判定语义或验收诚实停止。 |
| `evals/fixtures/scripts/check-landing-gate.sh` | 共享同一状态检查但没有草稿正文断言，只需有非空回复；没有验证是否告诉调用者缺哪项权限。修生成源，不手改分发脚本。 |

本地验证没有使用 PR 凭据、真实远端、模拟器或用户反馈。预览分类、端口、配置及验收判据四套现有 Jest 共 37 项通过；这是检查实现的证据，不是五个技能均可交付的结论。
