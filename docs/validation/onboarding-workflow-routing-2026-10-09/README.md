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

隔离快照只包含 README、CLI、单测及生成的 runtime；缺少完整 docs/contracts、package.json 和原项目提交基线。因此真实任务明确未运行所规划的项目测试。这次 V3 证明该快照中的入口加载与单次首个实质结果，不证明完整仓库工作流、模型稳定性或宿主 parity。实际加载以会话命令和输出为证，结果充分性由 owner 回源判断；进程完成并不自动证明语义质量。

其他宿主真实任务为 `not_run`；Pi trust、workspace、多宿主边界只有本地合同测试。V4 人工试用未执行，不宣称首次成功率、路由准确率或耗时改善。后续在完整项目按相同任务复测，再以人工试用观察澄清、误判和恢复成本。
