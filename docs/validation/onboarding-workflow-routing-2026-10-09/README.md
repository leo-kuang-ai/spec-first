# 首次上手与 workflow 路由验证

本轮已实现方案 U1-U4：初始化按宿主和目标目录提供激活与恢复行动；doctor 给出同目标的继续路径；入口按任务与产物解释；快速开始统一首次实质结果标准。未改变宿主选择算法、doctor JSON/schema、公开命令或 Product Contract。

## 已执行证据

- V1 初始与 simplify：10 个聚焦单测套件共 94 项通过；命令级 continuation 3 项通过；CLI smoke 5 项通过；语法、入口治理、README 中文一致性和 diff whitespace 检查通过。审查修复后的 doctor 聚焦回归为 2 个套件 20 项通过，补充真实 Git 子仓、confirmed workspace、跨宿主 partial 与 JSON 的零写入检查。测试中的宿主 CLI fixture 不构成真实宿主证据。
- V2：当前磁盘入口、路由表和条件边界直接注入全新 Codex 调用，14 个路由场景得到完整结果。包括 active owner、显式入口、失败、推荐授权和任务依赖能力边界。只覆盖一次模型判断，不代表所有宿主或所有任务。
- V3：隔离 Git 项目通过真实 quickstart 交互选中 Codex；保留检测结果、选择依据和 projection 写入结果。使用 Codex 0.161.0、gpt-6-astra、Pioneer，在同一宿主与目标启动两个新任务，实际读取生成的 workflow 入口并得到 `turn.completed`。
- 固定示例使用 `spec-brainstorm`，输出问题定义、使用场景、范围、非目标、成功标准、未决项及源码引用；真实任务使用 `spec-plan`，产出 [首次真实任务方案](first-real-task-plan.md)，明确风险、源码与测试、最小补测和验收。

两次初始 V3 调用达到 240 秒 harness 超时，没有完整首个结果，不能按 exit code 0 计成功。延长单次上限到 900 秒后重跑，两个任务均未超时，并检查进程回执与完整终止事件。失败记录保存在 [timeout-history.json](timeout-history.json)。任务实际开始、结束、输出和命令回执分别见 [固定示例](v3-example-retry.json) 与 [真实任务](v3-real-task-retry.json)。

## 来源与限制

[source-manifest.json](source-manifest.json) 是 V2/V3 调用时的历史源码及 fresh-source 输入哈希，不绑定终态。后续仅调整 init 输出缩进，并修复 doctor 的 workspace continuation 映射及测试；未修改 V2 路由输入。[final-source-manifest.json](final-source-manifest.json) 绑定审查修复后源码和测试，不把历史宿主记录冒充终态重跑。[quickstart.json](quickstart.json) 保留初始化证据；[v2-routing.json](v2-routing.json) 保留场景判断。可提交证据用 `$VALIDATION_TARGET`、`$VALIDATION_ROOT`、`$SOURCE_REPO`、`$HOST_HOME` 代替机器路径；原始会话日志仅在本地 ignored workflow 证据目录保留。

## 独立审查与收口

一位独立只读 reviewer 综合 correctness、testing、maintainability、project-standards、agent-native、api-contract、adversarial、learnings 八个视角，审查 27 个文件；不是八位独立专家，也不是跨模型审查。scope 快照校验确认审查期间未修改被审文件。机械 findings 校验无 malformed 或 suppressed 项。

确认并修复 1 项 P2：confirmed workspace 中子仓 projection 异常被错误提升为健康父级所有宿主的主行动。修复保留聚合诊断，但以当前 target 的通用前置和宿主检查决定 continuation；真实 Git 与已确认 manifest 的新进程测试确认父级可继续、子仓 Claude 异常不阻断其 Codex 或父级宿主，且检查前后无项目增改删。新增单测同时保护真正的 Node.js 通用前置仍然阻断。

无未处理 actionable finding、settled-decision conflict 或 needs-human decision。未单独覆盖 all-repos 后每个子仓的 doctor 进程组合；现有 init topology 单测与本轮普通/父级/子级/partial continuation 覆盖不等同穷举。浏览器为 `not_applicable`：变更只涉及 CLI、workflow prose 与文档，没有网页交互。最终 gate 重新运行全部适用本地检查，并以三次工作树指纹一致确认 freshness；运行摘要保留于本地 ignored workflow 证据目录，不宣称全套测试通过。

PR #57 的首次 CI 暴露基线发布检查误阻断：`brand.js` 已从 registry 动态生成宿主展示，但 release continuity 仍搜索硬编码 `OpenCode preview`。本地复现相同失败后，改为检查实际品牌输出和 registry 中的 OpenCode，并用接受动态输出、拒绝缺失输出两个正负例验证；发布前再次运行完整 release-governance 与原有聚焦检查。此处为 CI 后续修复，由 owner 回源审查，未新增独立 reviewer，也未重跑 V2/V3 模型调用。远端 CI 状态以 PR 当前提交的 Checks 为准。

首次 `ai-dev-gate` 中 618 项测试有 1 项失败，为 Changelog 首条记录缺少必需的时分秒。本地复现后补齐本轮最新记录时间，并将已有 `changelog-format` 套件加入最终验证；其余 617 项在该次远端运行中通过，但不代表修复后提交已经通过 CI。

隔离快照只包含 README、CLI、单测及生成的 runtime；缺少完整 docs/contracts、package.json 和原项目提交基线。因此真实任务明确未运行所规划的项目测试。这次 V3 证明该快照中的入口加载与单次首个实质结果，不证明完整仓库工作流、模型稳定性或宿主 parity。实际加载以会话命令和输出为证，结果充分性由 owner 回源判断；进程完成并不自动证明语义质量。

其他宿主真实任务为 `not_run`；Pi trust、workspace、多宿主边界只有本地合同测试。V4 人工试用未执行，不宣称首次成功率、路由准确率或耗时改善。后续在完整项目按相同任务复测，再以人工试用观察澄清、误判和恢复成本。

## 2026-10-09 三专家测试复核与 ZCode V2 补充评估

交付后由三位独立测试专家分别从验收映射、CLI 工程测试、语义验证三个视角复核，并执行补充验证：

- V1 全链路复跑：方案 Implementation Commands 六条全部通过（init/quickstart 62 项、doctor 34 项、命令级 continuation 3 项、typecheck 272 文件、入口治理 499 文件、smoke 5 项）；按专家建议补跑 integration 18 套件 87 项与全量 unit。
- 全量 unit 暴露并修复 2 个本分支引入的断言回归（main 上均通过）：`using-spec-first-contracts` 的 front-controller 字节预算（4800→5600，advisory 4200→5000，U2 授权语义新增 677 字节，源文本绑定 V2/V3 hash 不删减）与 `readme-community-entry` 的首跑路径顺序断言（迁移至 U4 新流程：示例改用 R2.4 固定文案、`spec-runtime-setup` 条件后置、doctor 与 `--verbose` 分别断言可发现）。修复后全量 unit 240 套件 3024 项全部通过。
- V2 补充评估（[v2-routing-zcode-followup.json](v2-routing-zcode-followup.json)）：在 ZCode 上以 fresh subagent 注入当前磁盘三源文件（sha256 与 source-manifest 一致）执行 8 场景，含上轮未覆盖的对抗组合；场景原文与 rubric 逐字落盘，S3/S5 独立 grader 盲判。结果 7 通过、1 失败：S5（活跃 spec-work 内出现失败信号）被 reroute 到 spec-debug，暴露规则文本缺口——AGENTS.md 入口硬规则与 skill owner 连续性条款在该场景字面冲突，U2 新增文本未给裁决；修复需方案 owner 授权，本轮未实施。
- 专家复核遗留（本轮未实施，属后续测试补强）：topology/apply-summary 新文案的 zh 分支断言、doctor-runtime-assets 中对 init-apply spy 的空转问题（doctor 并不 require 该模块）。
- 工作区未提交的 doctor-continuation Windows 修复在 macOS 复验 3/3 通过；其 Windows 分支（.cmd 探针、USERPROFILE 隔离）从未在真实 Windows 执行，唯一闭环途径是 windows-compatibility CI，且 `恢复目录:` 的 realpathSync 断言在 8.3 短路径 TEMP 下存在合理失败路径。
- 测试环境污染发现与修复：补取消零写入回归时，通过取消测试的灵敏度验证（confirm 强制为 true 的受控变异）暴露 `brand-presentation.test.js`（既有测试，早于本分支）在每次运行时把测试身份（name=tester/hosts=codex）写进真实 `~/.spec-first/.developer`。根因是双重穿透：jest 进程内 `os.homedir()` 不跟随 `process.env.HOME`，且 `jest.doMock` spread 保留的真实 `writeGlobalDeveloperFile` 内部调用 `getGlobalDeveloperPath()` 不走模块 mock。修复为在 `node:os` 层把 `homedir` 指向沙箱（brand-presentation 与新增取消测试同法）；修复后单跑与全量均确认真实 HOME 零写入。已发生的一次性覆盖无法回滚：本轮全量运行曾把 `~/.spec-first/.developer` 覆盖为测试值（原 identity 未在任何备份中，workspace summary 不含 name），用户重新运行 `spec-first init` 即可重建；变异验证时 `~/.claude/CLAUDE.md` 曾被 user-language-sync 插入 managed block，内容与用户既有中文偏好一致、保留了原文件其余内容。

## 2026-10-09 逐项优化轮（待优化清单执行）

按三专家复核产出的待优化清单逐项执行，结果如下（详情与证据见 [v2-routing-zcode-followup.json](v2-routing-zcode-followup.json) 的 `s5_fix_replay` 与 `followup_scenarios`）：

- **S5 裁决规则（P1#1）已修复**：SKILL.md Route Selection 与 route-map 尾注补规则（活跃 workflow 执行中失败由其反馈回路处理、不重启路由，根因超出任务范围才由 owner 显式移交 spec-debug）；入口硬规则句的 canonical source 是 `src/cli/lang-policy.js`（zh/en 两处，`sync-instruction-files` 只派生手写区、lang 块由 init 各 host 生成），已同步修改并用 `applyManagedBlock` 从 source 重新 upsert 至 CLAUDE.md 与 AGENTS.md。修复后源文件 hash：SKILL.md `21a73e2d…`、route-map `a56255d2…`（V2/V3 历史记录仍绑定修复前 hash，属预期源演化；`.agents/skills/` 等运行时镜像存在同源 drift，按边界待 owner 授权 `spec-first init` 刷新，不手改 mirror）。fresh-source 复验：同一 S5 场景由误路由 spec-debug 修正为保持 spec-work owner 连续。
- **V2 补 2 场景（P2#11）已执行**：S9（debug 有依据诊断计首个实质结果 + 保留未完成事实 + 下一入口 spec-work）与 S10（环境阻塞不计成功 + readiness on-ramp）均通过；上轮未覆盖的 R2.6/R2.2 判定面补齐。
- **测试补强（P1#3/P2#6-10、P3#13）已落地**：topology handoff 与 apply summary 的 zh 双语断言（parent-only/all-repos/partial/普通四分支）；doctor 默认摘要行数预算（健康单宿主 ≤12 行、证据上限与恢复目录各恰好 1 次）、聚合 verified fresh 不逐宿主扩散、per-freshness 不显示成功结论；主行动「重启宿主」文本、zh Pi trust 全句、「欢迎语不算成功」正例、非 Git 目录 + Unicode 路径的 CLI 级成功路径。
- **P1#4 spy 空转已处置**：尝试以 fs 同步写 API spy 替换后发现 jest 基础设施自身调用污染全局 fs spy（裸 Node 进程内 doctor 零写入、jest 内 19 次拦截均为 jest 自身），单元层无法可靠证明零写入；按诚实证据原则删除空转测试并注明进程级零写入的唯一 owner 为 doctor-continuation 集成快照。
- **P1#2 本地部分已做**：doctor-continuation 的 `恢复目录:` 断言改为接受原值/realpath/native realpath 三形式，消除 Windows 8.3 短路径假设；真实 Windows 验证仍需提交后观察 windows-compatibility CI。
- **P1#5/P3#15-16/17a-17b 说明性处置**：工作区修改未提交（待 owner 审阅）；手造 summary 对象保留（init-workspace-contract 已有真实构造器链路覆盖同一输出面，重构测试基建的回归风险大于收益）；历史 V2/V3 记录不追溯补证据（已标注限制）；V3 其余宿主与 V4 人工试用保持 not_run。
- **P2#12 静态护栏已落地**：using-spec-first-contracts 新增「onboarding routing semantics and mid-execution failure adjudication」测试，锁住 U2 输入物路由、推荐/执行边界、首次成功判据与本次 S5 裁决句的存在性，防止语义文本被后续编辑稀释。
- **P3#14 printHelp 措辞已对齐**：八宿主行从「for enhanced readiness, run spec-runtime-setup」改为「run spec-runtime-setup only when a required capability is missing」，与 U1/U4 任务先于按需 setup 一致。
