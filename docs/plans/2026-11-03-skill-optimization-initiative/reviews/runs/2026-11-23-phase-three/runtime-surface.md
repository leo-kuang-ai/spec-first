# Runtime Setup 源码表面独立审阅

2026-11-23，Codex；对象是当前磁盘 `skills/spec-runtime-setup/`，排除 `scripts/lib/**`，不是生成的宿主镜像。**已覆盖 34/34 个文件，基线合计 9,160 行。** 首要问题是 Graphify 替代工具查询失败时仍进入旧工具清理流程；其次是可选 Git 钩子失败能阻止核心构图。两者影响不同，应分别修复，不宜简单放宽整个 setup 的成功条件。

先读项目角色契约，再按入口、评测、配置、命令分派、两个 provider、注册表及 schema、第三方分发件分块核查。下表路径相对包根；行数取 `git cat-file blob 5a55514d9:<仓库路径>`，文本仅去掉末尾一个 `\n` 后按 `\n` 分割。逐文件比较表明本次范围内的磁盘字节与该基线相同。行范围用于覆盖对账，不表示该文件每行都是问题，也不表示每个分支均已运行。

## spec-runtime-setup

| 包相对路径 | 基线行范围 | 具体判断 |
| --- | --- | --- |
| `SKILL.md` | 1–386 | 面向宿主 agent 的关键决策是先定目标，再区分只读 `--check`、仅写事实的 `--verify-only`、安装与构图；模式矩阵和就绪交接比散落的重复规则更可用。单项目与父目录 bare 的差异、外部钩子允许读取什么、初次提取能否回退，都不应让操作者从多个长段落拼答案；父目录门禁、钩子和回退说法与实现有具体偏差，见下文。 |
| `evals/README.md` | 1–21 | 给维护者明确了固定哨兵、机械判定与另行语义审阅的区别，不能用它证明实际安装成功。第 9 行把退出 2 写成引擎义务，第 21 行又说 shell 一律拒绝、不解析命令；实际两个 judge 均不是这样工作。 |
| `evals/cases/bare-invocation-fail-closed-on-unverified-surface.yaml` | 1–28 | 目标是非真实宿主入口上的 bare 拒绝，不是跑通安装。提示要求临时 HOME、无重定向，便于把调用与结果关联；标题的“零副作用”强于实际验收，设置 HOME 也只是给模型的指令，并非执行隔离。 |
| `evals/cases/check-readonly.yaml` | 1–25 | 明确指定 `--check` 并排除会写事实的 verify；两个宿主配置哨兵与夹具描述对得上。但“执行检查”没有对应的正向调用断言，静默跳过也可能通过。 |
| `evals/cases/semantic-question-not-setup.yaml` | 1–25 | 以真实可读的小项目询问架构，期望说明职责并移交，不在 setup 内展开架构结论。选择脚本只能排除部分机械违规；用例文字正确保留了另行审阅完整响应的义务。 |
| `evals/eval.yaml` | 1–25 | 三份用例都已挂接，单路 Claude Code 引擎、串行、记录 transcript；600 秒/20 轮为默认值，bare 用例另有覆盖。配置能产生审阅材料，不是已经跑过三例，更不能代表八个宿主。 |
| `evals/examples.json` | 1–116 | 十个示例分别约束触发、范围、诊断、降级和授权；`unknown` 不能自动触发 refresh 的示例有用。外部 hook 示例要求一律不检查并报告 manual-only，和 provider 在特定条件下返回 `verified-external` 的行为冲突，会教出相反的汇报。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 1–8 | 两条 HTTP 路由和内存存储能给语义问题提供背景；“手填五个字段”没有对应实现，POST 只从请求取 `amount`、`note`。该描述既误导审阅者，又是哈希哨兵，纠正文案时需同步两份 judge。 |
| `evals/fixtures/repos/mini-ledger/package.json` | 1–6 | 私有 CommonJS 示例包，入口与实际 `src/server.js` 相符，无依赖或安装脚本。其字节是固定对照，不要求启动服务、解析依赖或访问网络。 |
| `evals/fixtures/repos/mini-ledger/src/server.js` | 1–25 | POST 追加两项输入并生成 id、时间戳，GET 返回列表，其余 404；直接运行会监听 3000。对这组评测，读源码和核对字节已经足够，不应把示例服务器当作 setup 的健康探针。 |
| `evals/fixtures/repos/setup-target/README.md` | 1–3 | 明说是 bare 调用的最小项目，不暗示已经有宿主投影。与 mini-ledger 的业务语义夹具分离，适合观察阻断后是否出现新产物。 |
| `evals/fixtures/repos/setup-target/package.json` | 1–1 | 单行私有包只有名称和版本，无启动/安装动作；作用是给 bare 评测一个普通项目身份，不是证明宿主来源或安装授权的凭据。 |
| `evals/fixtures/scripts/check-bare-mutation.sh` | 1–71 | 用调用 ID 关联工具结果，检查固定路径含悬空链接及部分 HOME 台账，强于只看最终回复。但 bare 判定是命令文本包含测试，且只排除 check/plan，不能区分所有其他模式；读的是结果文字，不是 CLI 退出码。 |
| `evals/fixtures/scripts/check-not-setup-scope.sh` | 1–90 | 要求标准事件数组、助手输出、限定 Skill 参数和文件哨兵；拒绝未知轨迹有利于人工回看。Bash 实际按命令名、子命令、部分文本切分放行，不能由首词推断每种参数都只读。输出保留 `semantic-review-required` 是必要的。 |
| `evals/fixtures/scripts/check-readonly-verify.sh` | 1–30 | 校验三个文件哈希、两份配置精确内容及两个事实目录不存在，可发现持久改写；只另查引擎退出码和回复关键词，没读取调用轨迹。探针中“尚未检查状态。”也获得 PASS。 |
| `references/config-template.yaml` | 1–84 | 给复制到本地的用户看：反馈批准位、pulse 数据源、验证配置、三种文档输出及规划确认均为注释；实际解析原件得到零个生效键，不暗授权限。三个输出键分别有消费者，未配置默认 md/md/html；可把第 64 行起的残句改成“取消对应一行注释即可；流水线覆盖仍由该工作流决定”。 |
| `references/project-config.md` | 1–36 | 区分 setup 事实、示例、本地覆盖和忽略规则，缺本地覆盖是使用默认值，不是失败。将 sweep 授权、profile 等统称为“渲染偏好”不准确；要求 bootstrap 后一律 `--verify-only` 又会扩大到写事实，若只验本地配置应先选 `--check`。 |
| `references/provider-readiness.md` | 1–25 | 给事实生产者与使用者区分 readiness、派生展示位、请求范围和收据验证范围；缺旧收据是 unknown，明确不匹配是 degraded，钩子字段不是核心查询证明。保留仓库合同指针，不能凭 `installed=true` 对外承诺查询可用。 |
| `references/supported-mcp-tools.md` | 1–124 | 工具表、顶层归档与传递依赖的界限、安装身份和历史查询证据都有实际用途；第 24 行起的宿主列表只列 5/8，第 117 行称只读回读尚待迁移，第 122 行却已描述已实现路径。操作者可能误以为 verify 会打开原生数据库；应把历史状态移出当前用法。 |
| `scripts/check-health` | 1–6 | Node 兼容入口只预置 `--check`，透传其余参数和 `main` 的退出码，没有第二套健康逻辑。适合旧调用者；退出 0 应解释为诊断已运行，不能替代读取 readiness。 |
| `scripts/contracts/workspace-graph-state.schema.json` | 1–76 | v3 状态回执将操作完成度、逐仓观测、合并摘要、待清理标志与可空的钩子合同分开；根和子对象拒绝额外键。它能验证字段形状，不能验证路径仍可执行、当前 SHA 相同或 `complete` 与现实一致，仍须由状态读取器复核。 |
| `scripts/contracts/workspace-manifest.schema.json` | 1–44 | v1 仅要求版本，可选仓列表、alias 和 exclusions；路径是相对工作区的身份，alias 用于显示。schema 的非空字符串不是 containment 检查，重复 alias 也不是语法错误；歧义交由目标解析和构建/清理门禁。它不是本地配置的通用 YAML 接口。 |
| `scripts/providers/codegraph-artifact-evidence.cjs` | 1–136 | 回读同宿主、同根且唯一的历史 artifact 记录；比较源码、安装身份、DB/WAL/journal 的大小与摘要及 7 天 TTL。缺失/不稳定回 unknown、已知漂移回 stale；只读回放不刷新原查询时间，也不证明图语义或 MCP 可达。 |
| `scripts/providers/codegraph-launcher.cjs` | 1–116 | 对识别的 npm 布局匹配主包、平台包和版本，生成平台入口及 Windows argv 前缀；缺 bundle 时阻止 shim 自行恢复，给出仅安装修复命令。对其他原生布局可原样交回；`inventory_sha256` 是元数据和路径摘要，不是启动文件字节认证。 |
| `scripts/providers/codegraph.cjs` | 1–575 | 分开 plan、安装、索引、真实查询、历史回读及 MCP 配置对账；apply 检查结构化 status，按 pending/reindex 作有限修复，未知身份不能单靠宿主配置提升为 fresh。空命中数组可证明查询接口完成，不证明找到业务节点；verify 回读证据而不跑原生 status/query。 |
| `scripts/providers/common.cjs` | 1–136 | 两个 provider 复用 runner、退出/超时判断及 v2 输出构造；默认回源和 fallback、区分安装与探针值得保留。版本匹配是边界词匹配，不是严格版本相等；预发布版本能匹配正式版 pin，影响没有后续精确身份检查的调用者。 |
| `scripts/providers/graphify.cjs` | 1–2763 | 分块核了计划/执行与查询、内外部钩子、范围与源码收据、Python/uv/pipx 身份、迁移清理、宿主模板及回读。能把图和请求范围绑定，又保留源码回退；主要问题在副作用顺序、可选钩子阻断核心能力，以及把宿主共享文件和 provider 自有文件按同一范围替换。 |
| `scripts/providers/registry.cjs` | 1–6 | 仅静态导出 `codegraph`、`graphify`，两项与 JSON 的 provider ID 对齐；不从配置动态加载任意模块。新增 provider 时注册表和分派缺一不可，增加一个纯工具或 helper 则不应误加分派项。 |
| `scripts/setup.cjs` | 1–880 | 入口分出项目配置、计划、诊断、批量和 workspace 状态/构建/清理，JSON 供自动化读，人工输出带子仓、freshness 与后续动作。`--help` 已实读，清楚区分默认预览和构图；父目录 bare 却先过写授权门禁，预期的只读目标说明根本到不了。 |
| `scripts/vendor/README.md` | 1–9 | 标出上游、npm 浏览器分发件、版本及 MIT 附件，并说明独立宿主不能依赖目标项目的 `node_modules`，理由与真实 require 路径一致。缺可供下次维护者重用的归档完整性标识和成员路径；本次离线核对见下文。 |
| `scripts/vendor/js-yaml-3.15.1.min.js` | 1–1 | 单行 UMD 分发件 42,410 字节；版本头、CommonJS 导出及整份归档成员已核对。产品消费者实际调用 `safeLoad(source, { json: false })` 判本地配置，不用完整 schema 的 `load`，也不是 workspace manifest 的解析器。未将上游压缩实现逐字解混淆。 |
| `scripts/vendor/js-yaml-LICENSE` | 1–21 | 与同版 npm 包的 `package/LICENSE` 字节相同；保留 Vitaly Puzrin 的 2011–2015 版权、MIT 许可、保留通知义务及免责。许可随分发件保留才有意义；本次核的是源包，不是已发布的各宿主安装物。 |
| `setup-registry.json` | 1–2258 | 对照了全部默认值、镜像、两项外部依赖、八宿主、三个工具、七个 helper、两个 provider、readiness 默认值及十三项产物的路径/生产者/消费者。固定 npm 归档与 wheel 不等于所有 helper 都锁版；Graphify 明写新链路验证完整才卸旧包，但 apply 没有在清理前兑现该条件。 |
| `setup-registry.schema.json` | 1–1004 | 2020-12 schema 对宿主集合、目标优先级、PyPI 来源/解释器/安装器、命令参数和产物形状作约束。核对时同时看了实际 loader 的额外交叉校验；四平台对“可执行命令”和“仅展示文本”声称互斥，实际两者并存仍可通过加载。 |

## 可复现发现

1. **高：新 Graphify 查询失败，仍可能卸载可用的旧工具。** `scripts/providers/graphify.cjs:573` 把查询失败记为 `queryVerified=false`，不设置 `mutationFailure`；`:625` 先进入全局 npm 清理，`:630` 才探测最终 Python 身份，`:647` 才合并核心降级条件。这与 `setup-registry.json:2035` 的承诺相反。离线复现用非 Git 临时目录、有效 `nodes` 图、已配置项目、`npm-incumbent` 碰撞和注入 runner：Python metadata 返回同版身份，`query main` 返回 1，随后观察到 `npm list -g`。探针在此故意返回 1，没有执行卸载；源码 `cleanupNpmGraphifyIncumbent` 在旧包及启动器归属核对通过后才会调用 `uninstall`。**修法：**将清理移至新链路最终验收之后，显式要求图完整、请求范围已证实、查询成功、新包最终身份稳定、宿主配置通过，且项目钩子通过或确实不适用；保留旧包自身的归属检查。回归断言应查调用日志中连清理入口都没有，而非只查最终 `degraded`。

2. **高：共享宿主文件的改写范围大于 provider 自有配置。** `scripts/providers/graphify.cjs:2300` 将 `.claude/CLAUDE.md`、`.opencode/opencode.json` 等按整文件处理；`:2321` 的两个字符串替换不检查 Markdown 段落或 JSON 键的归属。即使文件路径合法，其中其他项目规则、其他插件的配置值只要包含相同字串也会被改写。路径 containment 和原子写入不能证明内容归属。**修法：**独占的 provider 资产可以整文件归一；共享 Markdown 限定唯一托管段，共享 JSON 只改识别出的 Graphify 项，边界不明就不写并报告。用包含相同旧路径的两份相邻配置断言无关项逐字节不变。此项是源码上的确定性替换范围，不是声称已经改坏用户的宿主。

3. **中：标为可选的项目钩子能够阻断首次构图或刷新。** `SKILL.md:55` 要求钩子单独降级；`scripts/providers/graphify.cjs:476` 在采集源码快照前安装钩子，`:484` 将其 `failed/blocked` 提升成主失败并跳出。复现使用临时 Git 仓、仓内 `.git/hooks`、已解析 launcher 的 first-generation 计划；runner 对钩子命令返回 1，依次收到 `hook status`、`hook install`，没有收到 `extract`，结果为 `degraded / graphify-hook-install-failed`。没有调用真实安装器。**修法：**保留最前面的安全路径门禁；钩子工具自身失败时只记录 `steady_state`、`manual-only` 和原因，不执行不安全的钩子动作，但对安全、独立的构图与查询继续验收。确有共享路径危险时才阻断相关主动作；不要把失败后的核心查询写成“已可用”。

4. **中：父目录的只读 bare 路径先索取写权限。** `scripts/setup.cjs:146` 按模式名把所有 bare 当作 mutation，父目录诊断要到 `:209` 才分派。临时非 Git 父目录含一个 Git 子仓，清空宿主标志，给 `runSetup` 注入无副作用 runner 并启用 `enforceSurfaceBinding`：裸参数及 `--all-repos` 均返回 `2 / host-authority-required`；同一目标的 `--check` 到达父目录诊断，返回 `1 / workspace-graph-absent`。后者不是 ready，但给出了正确的下一步。**修法：**用已经解析出的 topology 和 mode 共同计算实际写能力；只给父目录 bare/check 免 mutation 门禁，并验证单项目 bare、显式批量写入仍拒绝无权调用。

5. **中：评测可以在没检查时报告通过，维护说明还混淆了被测对象。** 将 mini-ledger 放入临时目录，加用例定义的两份 `{}\n` 哨兵，仅设 `EVAL_EXIT_CODE=0`、`EVAL_FINAL_MESSAGE='尚未检查状态。'` 运行 `check-readonly-verify.sh`，未调用 setup、未提供 transcript，实得退出 0。另见 `check-bare-mutation.sh:49`：匹配的是命令片段及相应结果文字，既没校验工具退出 2，也没排除所有非 bare 模式；`check-not-setup-scope.sh:55` 实际允许部分 Bash，而非 README 所称的全部拒绝。**修法：**把“确实调用”与“固定文件未变”做成两个独立断言；让 runner 提供结构化入口、argv、目标、调用 ID、工具结果及可得的退出码。不完整轨迹标为不可判定，不能用助手复述替代；语义移交仍由人或独立审阅者判断。

6. **中：安装 schema 写了互斥条件，真实加载器却不拒绝冲突。** 在临时目录复制 registry/schema，仅给原本只有 `command_display` 的 Graphify Linux installation 增加无操作的 `command` 字符串，`loadRegistry({skillRoot: temp})` 接受。`setup-registry.schema.json:613` 起四个平台均用 `anyOf` 表达“至少有一个”；后续加载校验没有补这一条件。**修法：**集中定义平台 installation 的两个互斥形态，并让内置 validator 与 schema 同批支持该表达；若沿用现有方言，可在 loader 加确定性互斥断言并保持外部 schema 一致。以“仅命令、仅展示、两者都有、两者都无”四例验收。当前受审 registry 没有因此执行错误命令，是变更准入缺口。

7. **中：宿主模板会指向本适配器没有提供的入口。** `renderGraphifyInstructionSection('qoder')` 实际返回“先调用 `skill` 工具并设置 `skill: "graphify"`”；`scripts/providers/graphify.cjs:2237` 的 Qoder 安装分支只写规则，而非安装同名 Skill。用户另外装过它是可能的，但适配器不能假定这一点。应在 Qoder 模板直接给出已验证 CLI 的 `query/path/explain` 和不可用时的直接读源码路径；只在确实提供该能力的宿主渲染 Skill 调用。另应让 `graphify-out/` 存在成为条件，而非在仅安装、尚未构图时断言图已存在。

8. **中：一个版本输出匹配器把预发布当成正式 pin。** 直接调用 `scripts/providers/common.cjs` 的 `versionOutputMatches(output, '1.6.0')`，`1.6.0`、`1.6.0-beta.1` 均为 true，`v1.6.0` 为 false。`codegraph.cjs` 的 `resolveCodegraphCommand` 用这条结果选择 workspace launcher；已识别 npm 布局还有精确 manifest 检查，不能推成所有安装均绕过 pin。建议按 provider 实际 CLI 输出提取完整版本并精确比较，把正常前缀、预发布和错误输出各列为反例。

9. **操作说明与事实输出需要收敛到同一版本。** `references/supported-mcp-tools.md:117` 和 `:122` 分别称 CodeGraph 只读验证“待迁移”和“已回读”；`codegraph.cjs` 的 `verifyReadiness` 明确采用后者，原生 status/query 在 apply。宿主表还应补 OpenCode、ZCode、Pi 的实际容器及作用域。`SKILL.md:280` 提到首次 extract 失败可尝试 update，当前 Graphify 仅接受 PyPI，`plan` 将 `allow_code_only_fallback` 设为 false；不要引导模型自行补跑命令。外部钩子则应统一 `SKILL.md:171`、`evals/examples.json:65` 与 `graphify.cjs:817`：当前只检查两个指定文件的有界前缀，匹配是 marker 证据，不是钩子运行证明；截断或读不到不能证明整个文件无旧覆盖。不要仅凭钩子状态向用户宣告核心图查询成功。

## 第三方证据与限制

- **同版来源已离线对上。** 本机 npm 内容缓存中，键对应 `https://registry.npmjs.org/js-yaml/-/js-yaml-3.15.1.tgz`，缓存完整性为 `sha512-S99WuO3HlhO3XN41EtYUNl9zzXjoJx7QvmipxsJVxtCBT0YHEFy+iOJhjSvrmV12nYhWpZaM8lPHkJm0yUMbag==`。只读解出 `package/package.json`，为 `js-yaml`、`3.15.1`、`MIT`、`nodeca/js-yaml`；`package/dist/js-yaml.min.js` 和 `package/LICENSE` 分别与本包两文件逐字节相同。压缩件 SHA-256 是 `5a6faa5b5ca6c944b6449f5476c0bfc4511cd5749cd2bf99e9c910fc60c58d5c`。根项目锁定的开发依赖是 **3.15.2**，不能拿它代替 3.15.1 做同版证明。
- **调用边界已验。** 共置 `project-config.cjs` 是此分发件的直接消费者，使用 `safeLoad` 检查本地配置的语法、结构和键归属。只读调用实际配置检查：原始全注释模板返回 `valid` 且零键；重复的 `plan_output` 返回 `local-config-duplicate-key`；单个 `plan_output: html` 返回一个已注册键。该结果不代表消费者接受任意值，更不是对压缩库所有 API、安全性、许可证链或上游发布身份的全面鉴证。
- **验证到哪一层。** 真实执行限于只读 CLI 帮助、本地解析/比较和临时夹具小探针；涉及 provider、安装器、卸载器的分支使用替身并记录调用顺序。没有联网、安装或卸载工具、改写真实宿主、运行模型评测、启动服务器、刷新投影或构图；没有派工。`scripts/lib/**` 不计入逐文件审阅，仅沿具体 consumer/validator 调用边取证。未验证八宿主现场行为、真实 MCP 会话、发布包或用户收益。本报告不是修复实施或上线验收；仅本文件属于交付物，共享总表不作变更。
