# spec-polish 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-polish/scripts/resolve-port.sh:34-43；references/dev-server-detection.md:36-43；scripts/detect-project-type.sh:39-42；evals/cases/r2-screenshot-review-routes-out.yaml:1-5 | 每条约束均绑定已记录的真实失败（config-before-prose 理由、.env 引号/注释解析"do not simplify"守护、Rails-vs-Procfile 误判修复、R1→R2 对抗变体延续），未见过时或无据的补丁式指令 |
| D02 | pass | references/dev-server-rails.md:16,50-52；dev-server-vite.md:23,27,47-48；dev-server-procfile.md:12,59-61；dev-server-nuxt.md:56-58 | 8 份框架 recipe 编码真实领域知识（bin/dev→Procfile.dev 链、overmind/foreman、strictPort/HMR、Nitro 内部端口、Astro/Vite 配置优先级、多 web 进程只开一个 URL），脚本负责确定性探测、LLM 只做消歧与用户交互，职责划分恰当 |
| D03 | pass | scripts/resolve-port.sh:48-53,70；scripts/read-launch-json.sh:55-71；SKILL.md:65,69；references/run.md:55 | 确定性地板（端口 1..65535 校验、launch.json 哨兵校验、分类根物理包含检查）由脚本强制；语义验证义务（归因可达性、改后复查、"HTTP 200 不证明交互可用"）明确且未冒充机械判定，失败以 reason_code/哨兵可见 |
| D04 | pass | SKILL.md:68-69 ↔ skills/spec-test-browser/SKILL.md:21-30；skills/spec-commit/SKILL.md:15；tests/unit/mutation-authority-contracts.test.js:21-38 | 与 spec-test-browser 的 `current target-origin:<origin>` token 语法、`not_supported`/`not_run` reason code 逐项对上，与 spec-commit 的 `commit_authorization` 前置一致，越界请求点名目的地 skill（spec-code-review/Plan/Work）且交接携带 anchors/evidence/unresolved choice |
| D05 | fail | references/dev-server-rails.md:21-23 ↔ references/dev-server-detection.md:11-15 / scripts/resolve-port.sh:227-255；SKILL.md:59 | 入口 93 行紧凑、规则可定位，但存在一处已证实的文档矛盾：Rails recipe 的端口级联摘要把 Procfile.dev 排在 puma.rb 之前（并漏列 `.env.local`），与权威级联及脚本实际探测顺序相反；另 "Phase 2" 无 Phase 1 编号 |
| D06 | pass | references/run.md:59；SKILL.md:68；scripts/resolve-port.sh:219；scripts/read-launch-json.sh:42-45 | 能力假设显式且逐项诚实降级：node 缺失跳过探测、浏览器打不开改打印 URL 继续 human loop、spec-test-browser 不可用返回 reason code 并推荐 spec-runtime-setup、jq 缺失以 ERROR 显式失败而非静默 |
| D07 | pass | evals/eval.yaml:9-16；evals/cases/review-request-routes-out.yaml:9；CHANGELOG.md:954,936；git e25401fd/1f72bfd0/01fad369 | 问题→修订→复验链可回源：两轮对抗路由测评（R1 修复、R2 变体防回归）已入库为 eval case，SKILL.md:18 的中文负例与 case prompt 逐字对应，合同由 5 个测试文件钉住 |
| D08 | pass | references/run.md:20,35；SKILL.md:75-86；references/dev-server-next.md:3 | 按需加载设计完整：run.md 是唯一必读前置，"A complete tuple skips classification, recipes, package-manager resolution, and port resolution" 显式跳过逻辑，recipe 均设 "Read only when…" 门槛，已选定事实全保留防重复解析 |
| B01 | pass | SKILL.md:3,17-18；skills/using-spec-first/references/public-route-map.md:47-48；evals/cases/review-request-routes-out.yaml | 正向触发（Running UI polish→spec-polish）与相似入口（dogfood=PR/分支 QA、prototype=产品行为问题、test-browser=自动化）在 route map 与 Not To Use 中区分，路由排除负例有 eval 覆盖，`disable-model-invocation` 防自动捕获 |
| B02 | pass | SKILL.md:73-92 ↔ 磁盘 11 份 references + 4 脚本 + config-port.cjs；tests/unit/specialized-skill-calibration-contracts.test.js:51-69 | 入口/reference/script/模板/消费者对齐：引用清单与磁盘文件一一存在，SKILL_DIR 调用块与脚本存在性被合同测试钉住，launch.json 信任边界（user-authored, not auto-detected）已声明 |
| B03 | pass | SKILL.md:38-53,67,69,71 | 四类授权事实独立且非传递（scope≠checkout、done≠commit、无 landing 不 push/开 PR），local_fix 缺失时返回 `local_fix_authorization_missing` 而不编辑，被 mutation-authority 测试逐条钉住 |
| B04 | pass | src/cli/contracts/dual-host-governance/skills-governance.json:363-375；templates/claude/commands/spec/polish.md:8-12 | 真相源清楚（skills/spec-polish + command 模板），8 宿主交付面在治理合同中声明且模板只管 metadata、"Edit the paired skill" 指回 source，消费者测试直读 source 不读镜像 |
| B05 | pass | references/run.md:24,51,55-57,61；SKILL.md:30,63,71 | 失败/恢复/隔离面齐备：哨兵分类处理、端口冲突需归因且禁止杀无关进程、日志所有权边界（仅 run-owned 才展示最后 20 行）、复用与 run-owned 分离、中断项恢复前重查源码与 server 身份、30 秒有界探测 |
| B06 | pass | SKILL.md:71；tests/unit/mutation-authority-contracts.test.js:32-36 | 收尾合同完整（changed paths、resolved/residual、verification notes、commit_status、landing_status、limitations、server URL/复用状态/日志位置与保留期），且"never infers push or PR authority from completion"禁止全绿摘要抵消 |
| X01 | pass | scripts/detect-project-type.sh:31-42,126-163；references/run.md:20-33；SKILL.md:63 | monorepo 场景（深度≤3 探测+排除目录、`type@dir` 输出、cwd 选择、多配置消歧）与长迭代循环（run record、合并规则、中断恢复）均有机制 |
| X02 | pass | references/launch-json-schema.md:5-32,166-177；scripts/read-launch-json.sh:16-30 | 接口兼容性已处理：launch.json 为版本化 VS Code 子集并写明未消费字段与未来标准替换路径，脚本输出契约（哨兵/stdout-stderr/退出码）文档化，stub 写入一次性且需授权 |
| X03 | pass | references/run.md:47,51；SKILL.md:67 | 本 skill 无部署面，适用子面（进程风险、写面控制）已覆盖：永不杀无关进程、launch.json 仅授权后写、修复仅限授权范围并复查，无发布/回滚声明故不越权承诺 |
| X04 | pass | SKILL.md:63,65,71；references/run.md:61 | 跨会话/协作面适用且有机制：向 Plan/Work 回流携带原始反馈+anchors+evidence+unresolved choice，resume 时重查 project/command/cwd 与 checkout/build 身份，收尾含 limitations；不宣称知识沉淀职责 |

## Findings

**F1（P3，D05/B02）Rails recipe 端口级联摘要与权威序矛盾**
- 位置：`skills/spec-polish/references/dev-server-rails.md:21-23`
- 事实：该列表自称"follow the cascade in `references/dev-server-detection.md`"，但把 `Procfile.dev` 列为 1、`config/puma.rb` 列为 2；权威级联（dev-server-detection.md:11-14）与脚本实际探测顺序（resolve-port.sh:227 probe3=puma → :240 probe4=procfile）均为 puma.rb 在前。同列表第 3 项只列 `.env`/`.env.development`，漏了级联中的 `.env.local`（probe7 对 rails 类型生效，resolve-port.sh:301-313）。
- 后果：行为层风险近零（run.md:44 规定端口必须经 `resolve-port.sh` 解析，脚本输出确定性），但 LLM 按 recipe 顺序人工预期端口时与脚本结果不符，且两文档间存在漂移维护面。
- 最小修复：交换 1/2 两项并补 `.env.local`，或把编号列表改为"见 dev-server-detection.md 权威顺序"的一句话引用。

**F2（P3，D05）`Phase 2` 无对应 Phase 1 标题**
- 位置：`skills/spec-polish/SKILL.md:59`（对照 ：55 `## Prepare The Live Page`）
- 后果：读者按标题审计时找不到 Phase 1 的显式锚点（其内容在 run.md 且无编号），可审计性轻微受损，无行为影响。
- 最小修复：将 ：55 改为 `## Phase 1: Prepare The Live Page` 或删去 ：59 的编号。

**F3（P3，评测资产）eval prompt 断言的宿主路径依赖引擎安装**
- 位置：`skills/spec-polish/evals/cases/review-request-routes-out.yaml:8`、`r2-screenshot-review-routes-out.yaml:8`
- 事实：两个 case 的 prompt 均声明"本仓库 `.claude/skills/spec-polish/SKILL.md` …已随仓库就位"，但治理合同（skills-governance.json:363-375）中 Claude 宿主交付面是 command（`.claude/commands/spec/polish.md`），本仓库 runtime 镜像中不存在 `.claude/skills/spec-polish/`（已核实）。该路径成立与否取决于 skill-up 引擎是否在 fixture 仓库注入。
- 后果：若引擎未注入，被测 agent 读不到定义文件，case 以错误方式失败；当前静态层无法证实引擎行为。
- 最小修复：在 case 注释或 eval.yaml 标注该路径由引擎负责安装（写明安装责任方），或改为由引擎参数注入实际路径。

**F4（P3，观察——保持现状成立）**
- `evals/fixtures/scripts/asks-a-question.sh` 未被本 skill 现有两个 case 引用（两 case 均为 rule_based `output_contains`）；它是 10+ 个 skill 共享的评测 kit 惯例文件，属正常冗余。包管理器 lockfile→命令映射在 4 份 recipe 散文与 `resolve-package-manager.sh` 中重复（当前逐项一致：pnpm/yarn/bun/bun.lockb/npm 顺序与尾参），recipe 自包含是设计意图（对应"keeps each bundled command self-contained"测试），但构成低频漂移面，改脚本时需同步 recipe。

## 主责深挖面发现

- **D01（去补丁化）**：未发现“防模型犯错”式的过度指导残留。三处最像补丁的约束都有 failure 记录支撑：不 grep 指令文件端口的理由（resolve-port.sh:34-39 详述误报根因）、.env 引号/注释解析（detection 文档 :36-40 明示"do not simplify them away"）、路由收编反例（SKILL.md:18 直接引用 R1 测评的中文原句，与 eval case prompt 逐字对应）。删除任何一条都需先处置对应回归面。
- **D02（领域知识）**：知识密度高且带决策依据——Rails `bin/dev`≡foreman+Procfile.dev 的链路推演（rails.md:16）、overmind 优先及 socket 归属（procfile.md:14-26,59）、Vite strictPort 自增端口与“永不夺端口”（vite.md:23 与 run.md:51 呼应）、SvelteKit 以 svelte.config.js 区分于裸 Vite（sveltekit.md:56-58）。唯一的准确性瑕疵是 F1 的级联序错误，属文档摘要层而非知识错误。
- **D03（验证门）**：两层结构干净——脚本层确定性（端口校验、launch.json 三类非法输入各自哨兵、分类根防 symlink 逃逸，detect-project-type.sh:52-62 有测试覆盖 tests/unit/spec-polish-project-type.test.js:39-52）；prose 层语义义务（归因可达、改后复查、commit 仅 verified paths）不冒充机械判定，且“HTTP 200 或 hot-reload 不证明交互可用”（SKILL.md:65）精确划出了 LLM 判断地板。未发现把语义判断伪装成脚本结论的表述。
- **D04（衔接）**：三条出边两条入边全部核对——spec-test-browser 的 token 语法/reason code、spec-commit 的授权前置、回流 Plan/Work 的四要素（feedback/anchors/evidence/unresolved choice）均在对方 SKILL.md 中找到对应接收条款；四授权事实由专门测试钉住。唯一弱衔接是 spec-work 侧无 polish 回指，但单向 handoff 可接受。
- **D05（紧凑性）**：结构本身优秀（93 行入口、12 份按需资产、每份 recipe 有加载门槛），fail 仅由 F1 的已证实矛盾与 F2 编号瑕疵触发，两处均为 P3 文档层修复。
- **D08（上下文效率）**：最省上下文路径清晰——完整 tuple 直接跳过全部分类/recipe/包管理器/端口解析（run.md:20），已选定事实永不重解析（run.md:35），复用已归因 server 免重启，run record 有合并与去重规则（SKILL.md:63）。未发现“必须全读”或摘要裁剪要求的反例。

## 未读文件

- `skills/spec-test-browser/SKILL.md`、`skills/spec-commit/SKILL.md` 全文（仅读 D04 相关摘录 :15,:21-30,:43-44）——理由：邻接 skill 非本轮评审对象；后果：交接核对限于已验证的具体条款，两 skill 其余内部规则未交叉。
- `skills/using-spec-first/SKILL.md` 全文（仅读 route-map 相关段）——后果：B01 结论基于 route-map 与本 skill 边界文案，入口路由器全文规则未逐行比对。
- `docs/plans/.../core/05-optimization-dimensions-with-trends.md` 等 core 原文（第 4 节检查表已内含 D 维必查问题）——后果：若检查表与 core/05 口径有差，本轮未发现。
- `.claude/` 等 generated runtime（按纪律仅作投射取证核对了存在性与 command/skill 交付面，未逐文件读）。
- 附注：五个消费者测试文件已全文读但未执行（命令审批未通过）；按 S1 校准，静态裁决不依赖运行证据，测试结论未采信。

## 结论一句话

spec-polish 静态合同整体扎实——授权四分、确定性脚本地板、按需加载与逐项诚实降级均可定位且与消费者测试互锁——仅存在两处 P3 级文档矛盾/编号瑕疵（F1/F2）与一处依赖引擎安装的评测路径断言（F3），无阻断项，D05 因 F1 记 fail。
