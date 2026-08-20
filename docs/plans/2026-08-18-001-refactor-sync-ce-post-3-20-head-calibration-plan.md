---
title: "校准 Spec-First 与 CE 3.20 之后 HEAD 变更 - 技术方案"
type: refactor
status: superseded
date: 2026-08-18
sequence: 001
topic: ce-post-3-20-head-calibration
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
superseded_by: docs/plans/2026-08-19-002-refactor-ce-post-3-20-skill-sync-scope-clarification.md
product_contract_source: docs/brainstorms/2026-04-13-spec-first-sync-compound-engineering-updates-requirements.md
execution: code
plan_depth: deep
origin: docs/brainstorms/2026-04-13-spec-first-sync-compound-engineering-updates-requirements.md
upstream_repo: compound-engineering-plugin
upstream_range: 1fac0442..bbf995a4
---

# 校准 Spec-First 与 CE 3.20 之后 HEAD 变更 - 技术方案

> 生命周期说明：本方案已由 [`2026-08-19-002-refactor-ce-post-3-20-skill-sync-scope-clarification.md`](./2026-08-19-002-refactor-ce-post-3-20-skill-sync-scope-clarification.md) 接替。本文保留为历史决策与证据，不表示 U1-U8 已完成；后续实施、验证和关闭以接替方案为准。

## Goal Capsule

| 维度 | 决策 |
| --- | --- |
| 目标 | 以 CE `1fac0442..bbf995a4` 的真实 Git 增量为唯一上游事实，逐文件判断哪些变化应进入当前 `spec-first` 源码、哪些应由已有负责人吸收、哪些只能作为证据或延后；最终形成可执行、可验证、可回滚的跨 Skill/CLI/测试/文档校准方案。 |
| 推荐方案 | `extend + compose`。参数化现有对账产物生成器，扩展当前 `spec-*` 负责人、工作者/回执、CLI/插件清单和测试契约；不复制 CE 的中心运行时、提供方路由、产品目录或新增平行工作流。 |
| 差异重点 | 完整上游窗口有 372 条 Git 路径，仅作边界校验；用户指定的 `filelist_1fac0442_to_head.txt` 有 185 条唯一路径（M148/A36/R074=1），是本轮唯一逐文件同步集合；其余 187 条为用户排除项。 |
| 权威层级 | 当前用户要求与项目角色契约 > 当前 `spec-first` 规范源码/测试 > CE 固定 Git 区间原始差异 > 上游文档、提交主题、历史方案。 |
| 源码/运行时边界 | 只修改 `skills/`、`src/`、`scripts/`、`tests/`、`docs/`、README、CHANGELOG 等规范源码；`.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 的生成镜像只在源码完成后由 `spec-first init` 投射。 |
| 脚本/LLM 边界 | 脚本负责提交、路径、状态、哈希、结构、回执、排序等确定性事实；LLM/负责人负责对应关系、语义充分性、是否采纳、风险、优先级和现场结果声明。 |
| 最大风险 | 把 CE 3.20 之后的大量 Skill 文案、同行评审/提供方变化和 `ce-prototype` 机械搬入 `spec-first`，造成第二套代理运行时、未经授权的外发路径、源码/运行时漂移，或把固定测试通过误报成现场结果。 |
| 尾部归属 | `spec-work` 按 U1-U8 分波执行；每个单元只拥有本计划明确的规范路径。提交、推送、PR、外发、提供方调度和生成运行时投射仍由各自授权负责人控制。 |
| 停止条件 | 无法从用户清单重建 185/185 路径账本；清单哈希或边界校验失败；当前源码负责人不清；需要仅修改运行时的补丁；需要脚本作语义判定；需要引入没有消费者的公开 Skill；或验证只能依赖上游自述、固定测试通过或模型声明。 |

## Product Contract

### 摘要

本计划是 2026-04-13 CE 同步需求的后续增量校准，不是“把 CE HEAD 搬进 `spec-first`”。对每个上游变化先确认真实问题，再映射到当前源码负责人，最后选择直接吸收、边界改造、等价能力、证据保留或拒绝。当前实现目标是提高上下文新鲜度、宿主可移植性、语义入口质量、同行评审/PR/工作恢复可靠性和可复核证据质量，同时保持 `spec-first` 的源码优先、多宿主、独立授权与声明上限。

### 来源追踪

原始需求文档的 R1-R28 保持为上游产品契约，不在本计划中重定义。本计划使用 `CR1-CR17` 表示本轮 CE 3.20 之后校准要求；每个 CR 条目必须回指原始需求的对应 R-ID，未覆盖的原始 R-ID 必须标记为 `deferred` 或 `out-of-scope`，不得静默丢失 `owner-batch`、`shared-with`、`MUST`、`SELECTIVE`、`SKIP`、`NEW-TRACK` 等原始语义。

| 本计划校准 ID | 原始需求来源 | 处理状态 |
| --- | --- | --- |
| CR1-CR4 | R1-R4、R23-R24 | addressed：逐文件账本、集合差和 owner 映射 |
| CR5 | R5-R8、R24-R25 | addressed：参数化窗口和批次证据；原始更新文件骨架继续保留 |
| CR6、CR8、CR9 | R19-R22 | out-of-scope-by-product-decision：本轮不处理 `ce-babysit-pr`、`ce-retune`、`ce-setup` |
| CR7 | R19-R22 | addressed：用户批准集成 `ce-prototype` 为 `spec-prototype` |
| CR10-CR14 | R11、R13、R14、R20-R22 | addressed：授权、provider-untrusted、运行时和尾部边界 |
| CR15-CR17 | R15-R18、R26-R28 | addressed/deferred：验证与交接纳入本计划；owner-batch/shared-with 由 U2 逐文件账本保留 |
| 原始 R18、R20、R23、R26-R28 的未落地细节 | 原需求批次/共享提交/执行字段 | deferred：不在本轮伪造已完成证据，须在 U2/U8 回执中显式记录 |

### 问题框架

上一轮 CE 3.20 校准固定了 2026-07-28 的上游端点 `1fac0442`。新窗口继续出现以下变化：

- 调度与技能上下文的授权链被收紧，要求工作者只获得调用方明确授予的上下文与权限；
- `ce-plan`、`ce-brainstorm`、`ce-ideate`、技能编写等入口进行大幅瘦身和条件化路由，降低始终加载的提示词负担；
- `ce-doc-review`、跨模型同行评审、Grok/Fable/Codex 路由增加模型身份、结构化输出、配额/鉴权/不评审、预热检出与非最终立场约束；
- `ce-babysit-pr`、`ce-commit-push-pr`、`ce-work` 增加分支新鲜度、评审回执、堆栈姿态、沙箱提交和就绪边界；
- `ce-compound`、`ce-compound-refresh`、`ce-sweep`、会话历史和解决方案结构继续收紧上下文扎根与可复核性；
- CE 新增 `ce-prototype`、`ce-skill-work` 与 OMP/Agent Plugins/manifest/config 支持，但这些能力的产品归属、宿主覆盖和外部现场证据不能由上游存在本身推导。

### 参与者

- A1. 项目负责人：确认是否采纳新的公开能力、外发、提供方、提交/落地和现场激活。
- A2. 规范 Skill 负责人：拥有入口语义、回退、声明上限、交接和用户可见结果。
- A3. 确定性辅助工具/对账产物生成器：读取固定 Git 对象，产出路径/状态/哈希/结构/回执事实，不作语义采纳判断。
- A4. 宿主运行时：提供当前会话的工作者、Skill、MCP、模型、权限、并发与隔离能力；不由 `spec-first` 重建。
- A5. CLI/投射负责人：拥有 `src/cli`、安装/初始化/诊断/清理、插件/清单、宿主投射和源码/运行时漂移契约。
- A6. 评审/维护负责人：根据源码、测试、新鲜源码评审和现场证据决定波次是否可进入执行或激活。

### 需求

#### 全量对账

- CR1. 用户指定清单中的 185 条路径必须各自有独立记录，包含状态、原始差异、当前负责人、裁决、目标动作、验证面和限制；不得以目录计数或抽样替代逐文件账本。完整窗口的 372 条路径只用于集合边界校验。
- CR2. 清单路径必须由 Git 对象机械重建并与文件逐项相交；清单内状态预期为 `M=148/A=36/R074=1`。清单外 187 条必须标记 `out-of-scope-by-user-selection`，不得静默纳入同步。
- CR3. 当前 35 个规范 Skill 必须重新生成源码清单、清单哈希、技能树身份与包文件计数；上一轮 `2026-07-30` 快照只作为历史证据，不得冒充当前源码。
- CR4. 受影响 CE Skill 先做存在性集合差，再做语义对应关系裁决。当前已有 `spec-handoff`、`spec-write-skill`、`spec-runtime-setup` 等负责人必须以当前源码为准，不沿用上一轮“无对应关系”结论。

#### 上下文落地与归属

- CR5. 对账产物生成器必须支持显式 `base/head` 与输出产物参数，并保持上一轮固定窗口的回归兼容；旧 `7f86be9d..1fac0442` 账本不可被新窗口覆盖。
- CR6. `ce-babysit-pr` 本轮不处理；保留在 185 条事实账本中并标记 `out-of-scope-by-product-decision`，不进入 `spec-lfg`/`spec-commit-push-pr` 同步任务。
- CR7. `ce-prototype` 纳入本计划，建立当前 `spec-first` 的 `spec-prototype` canonical owner；只吸收“用可运行 throwaway artifact 解决产品行为/视觉不确定性”的核心契约，不复制 CE 的宿主提示、目录或中心运行器。Proof 外发仍不纳入本计划。
- CR8. `ce-retune` 本轮不处理；保留在 185 条事实账本中并标记 `out-of-scope-by-product-decision`，不进入 `spec-optimize` 同步任务。
- CR9. `ce-handoff`、`ce-skill-work` 按当前负责人裁决；`ce-setup` 本轮不处理，相关 CE Skill 变化标记 `out-of-scope-by-product-decision`，不进入 `spec-runtime-setup` 或 CLI 同步任务。
- CR10. 上游提供方、模型、CLI、市场和宿主专属路径都是 `provider_untrusted` / 建议性证据；进入当前契约前必须回溯到源码/测试/负责人证据。

#### 调用、运行时与数据安全

- CR11. plan/brainstorm/ideate/doc-review 的提示词瘦身只能删除重复叙述，不能删除承载约束的授权、无头模式、回退、声明上限、交接或源码引用。
- CR12. 跨模型/同行评审路由必须记录请求/实际提供方与模型、路由、超时、退出、结果哈希、数据边界和限制；未授权或能力缺失时零外发、零启动，诚实回退。
- CR13. work/PR 尾部必须保持评审回执、基线新鲜度、分支姿态、单写入者、沙箱/关联工作树 Git 索引和不得未经请求合并的边界；不自动合并、强制推送、重写历史或扩大脏路径。
- CR14. 临时目录、TMPDIR、会话历史、解决方案与生成产物必须保持负责人检查、禁止符号链接、私有、大小/保留期有界和可恢复证据分层；不得将 `/tmp` 指针作为规范连续性来源。

#### 验证与采纳

- CR15. 每个带功能的单元必须列出具体源码/测试路径、正常路径、边界/错误路径、集成路径和负向断言；不能只写“跑测试”。
- CR16. 确定性对账、源码清单、frontmatter/manifest、技能上下文、同行评审回执、PR 尾部、原型体验和运行时投射的验证必须分层报告；固定测试通过不得提升为现场结果。
- CR17. 所有未执行的新鲜源码评测、实时提供方、GitHub PR 观察/恢复、OMP/宿主现场旅程和原型现场验证必须保留 `not_run`/`blocked-external-contract-unverified` 等真实状态，不伪造完成。

### 关键流程

- F1. **冻结：** 固定 CE 提交对象 → 校验用户清单 SHA/唯一性/窗口交集 → 185 条逐文件源码事实 → 机器账本；372 条完整差异只生成边界摘要。
- F2. **映射：** CE 路径/技能集合 → 当前 `spec-*` 源码清单 → 精确对应关系集合差 → 负责人级裁决 → 实施/证据/延后动作。
- F3. **校准：** 上游问题/不变量 → 当前负责人扩展或轻量组合 → 源码/测试变更 → 不做仅运行时补丁。
- F4. **验证：** 确定性底线 → 聚焦契约测试 → 当前源码清单 → 新鲜源码/文档评审 → 源码优先初始化投射 → 宿主/就绪状态与现场结果分别报告。
- F5. **收尾：** 每波回执 → 未解决限制 → CHANGELOG/文档 → 实施交接；提交/落地仍需单独授权。

### 验收示例

- AE1. `filelist_1fac0442_to_head.txt` 是本轮硬范围。系统从固定提交对象校验其 185 条路径、唯一性、SHA 和状态；清单外 187 条只记录为 `out-of-scope-by-user-selection`，不进入语义同步。
- AE2. 旧 3.20 对账仍能验证 422 条历史账本；新窗口产生独立产物，不覆盖旧 `docs/validation/2026-07-30-*` 文件。
- AE3. 当前源码新增 `spec-handoff` 后，`ce-handoff` 不再被机械归类为无对应关系；语义仍必须检查产物摘要、新鲜度、限制和恢复权限。
- AE4. `ce-prototype` 的新增包进入 `spec-prototype` owner，但只在有人体验原型并作出决定后生成决策胶囊；无人值守、pipeline 或缺少消费者时 fail-closed，不启动预览。
- AE5. `ce-babysit-pr` 在本轮账本中明确标记为 `out-of-scope-by-product-decision`，不因其存在自动触发 LFG/commit-push-pr 改动。
- AE6. 跨模型路由请求模型 A 但实际身份不匹配时，系统 fail-closed，回执保留请求/实际身份并标记 `not-started/provider-model-mismatch`；不得产生独立覆盖，也不得展示“已由 A 审查”。
- AE7. `ce-plan` 的提示词瘦身不会移除产品契约、无头交接、源码引用、范围护栏或禁止默认外发条款；对应契约测试锁定这些锚点。
- AE8. 当前源码清单的技能树发生变化时，新的对账摘要标记快照过期并要求重新生成，不读取旧清单继续声称当前有效。
- AE9. 源码优先初始化只在规范源码/测试验证后投射运行时；任何仅修改生成镜像的补丁都被视为违反计划。

### 成功标准

- 185/185 指定路径完成独立源码对比，清单 SHA、路径唯一性和 M148/A36/R074=1 与 Git 对象一致；372 全量仅完成边界校验，187 条排除项不进入实施目标。
- 新旧对账窗口相互隔离，旧 422 路径证据不被覆盖或改写。
- 35/35 当前规范 Skill 有新鲜清单；所有受影响 CE Skill 有精确对应关系或明确的延后/拒绝/组合裁决。
- 当前源码负责人、运行时边界、`provider-untrusted`、授权、声明上限和产物消费者均保持不弱化。
- U1-U8 每个单元都有明确文件、测试、失败/回滚和证据交接；“可实施”不等同于“已实施”或“现场已确认”。

### 范围边界

**范围内**

- 用户清单中的 185 条上游路径逐文件审计与负责人映射；完整 372 条仅作集合边界校验，清单外 187 条明确排除。
- `scripts/check-ce-upstream-reconciliation.cjs` 的可参数化对账契约，以及对应的确定性测试。
- `spec-plan`、`spec-brainstorm`、`spec-ideate`、`spec-code-review`、`spec-doc-review`、`spec-pov`、`spec-work`、`spec-compound`、`spec-compound-refresh`、`spec-sweep`、`spec-optimize`、`spec-write-skill`、`spec-handoff` 的差距校准；`ce-babysit-pr`、`ce-retune`、`ce-setup` 仅保留账本事实，不进入实现。
- CE 的 `src/commands/*`、`src/release/*`、`src/utils/*` 仅作为上游证据；本轮不因 `ce-setup` 自动落地 `src/cli/**` 或 `skills/spec-runtime-setup/**`，除非后续另有独立产品决策。
- README、文档、CHANGELOG、验证证据和源码优先投射预期。

**范围外**

- 复制 CE 提供方/模型/CLI、中心执行引擎、共享守护进程、市场产品拓扑或宿主本地运行时。
- 新增公开 `spec-babysit-pr`、`spec-retune` 或 `spec-setup`；`spec-prototype` 是本轮明确批准的新增 owner，但不得复制 CE 的外部 Proof 集成或中心运行器。
- 直接修改外部 `compound-engineering-plugin` 上游仓库、提交、推送、开 PR 或改变其未跟踪 filelist。
- 直接修改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 生成镜像。
- 用本地固定测试、静态统计、模型自述或提供方输出证明真实用户采纳、真实 PR 观察/恢复或原型现场结果。

### 证据与限制

- 上游固定端点为 `1fac0442ee16996913dd0843a063ac279d2c32f4` 与 `bbf995a444de9c7f8294fcd15ffa7332cd5f6418`；两个提交对象当前可读取。
- 上游工作树只包含未跟踪 `filelist_1fac0442_to_head.txt`；本方案以该清单及其 SHA 为范围真相，并使用 `docs/validation/2026-08-19-ce-post-3-20-filelist-source-comparison.md` 作为 185 条逐文件源码事实证据。`2026-08-18-ce-post-3-20-name-status.md` 只用于完整窗口边界校验。
- `scripts/check-ce-upstream-reconciliation.cjs` 当前固定旧窗口、422 条审计和旧输出路径；它是历史机制证据，不是本轮可直接运行的验证器。
- 当前 `spec-first` 源码分支为 `leo-2026-08-18-update-ce`，HEAD 为 `69621aac0bbf34b13b96f57ebe0114a251698e68`，当前 `skills/` 有 35 个规范 Skill；本轮实施前必须重新生成包清单，不能使用旧 `d3763c...` 快照。
- 上游提交主题、文档和 CE 测试只能说明变更意图或上游机制；是否适用于 `spec-first` 必须以当前源码/测试/契约/负责人证据重新判断。
- 本计划没有执行上游真实提供方、GitHub PR、原型现场、新鲜源码独立评测或运行时投射；`spec-prototype` 的真实用户体验仍属于后续验证证据。
- 本轮只完成当前编排器的结构与语义内联评审；未执行独立 `spec-doc-review` 调度（`dispatch_authorization_missing`），因此不声称已完成角色隔离、跨模型覆盖或干净的独立结论。

## Planning Contract

### 关键技术决策

- KTD1. **使用新的证据窗口，保留旧窗口。** 新建 `2026-08-18` 验证产物；旧 3.20 账本继续作为不可变历史证据。理由：旧脚本和测试硬编码 422 条路径，覆盖它会破坏历史可复核性。
- KTD2. **参数化对账产物生成器。** `scripts/check-ce-upstream-reconciliation.cjs` 采用 `base/head/ce-repo/output-prefix/audit` 等显式输入，保留旧默认或固定测试兼容性。理由：每次 CE 更新都需要相同的确定性底线，不能复制一份新脚本或手工改常量。
- KTD3. **当前源码优先决定对应关系。** `ce-handoff`→`spec-handoff`、`ce-skill-work`→`spec-write-skill`、`ce-prototype`→新建 `spec-prototype` canonical owner；`ce-proof`、`ce-babysit-pr`、`ce-retune`、`ce-setup` 明确 `out-of-scope-by-product-decision`。理由：用户已冻结本轮处理边界。
- KTD4. **只扩展本轮批准的负责人。** 不为 `ce-babysit-pr`、`ce-retune`、`ce-setup` 增加组合胶水或同步任务；其他已纳入表面的负责人仍按现有生命周期契约处理。理由：不把用户明确排除的能力重新纳入。
- KTD5. **瘦身期间保留授权和声明上限。** 提示词瘦身、条件路由和跨模型变化只能压缩重复文本，不能降低调度/外发/提交/落地/评审/验证门禁。理由：上下文变短不等于权限扩大或语义充分。
- KTD6. **分离机制、就绪状态和现场结果。** 源码/测试通过、提供方就绪、生成投射、浏览器能力、真实任务结果分别出具。理由：本项目角色契约要求声明上限与证据直接支持的范围一致。
- KTD7. **只参数化产物生成器，不参数化产品契约。** 新增的 CLI/账本参数只服务确定性证据生成；不暴露提供方内部实现或让用户承担新的工作流状态机。理由：脚本准备事实，LLM/负责人仍作语义采纳判断。
- KTD8. **集成原型能力但保持 throwaway 边界。** 新建 `spec-prototype` 作为产品不确定性验证 owner；原型必须可体验、不可直接作为生产实现，决策写回现有 Product Contract/Plan。理由：用户已确认该能力需要进入当前产品，但不应因此引入 Proof 外发或第二套编排器。

### 架构姿态

`extend + compose`。

- **复用：** 当前 `spec-*` 源码、现有产物/回执契约、当前 CLI 适配器、当前测试和源码优先投射。
- **扩展：** 对账产物生成器接受显式范围/输出输入；现有 Skill 负责人吸收承载约束的不变量；现有测试增加窗口参数和负向路径用例。
- **组合/轻量胶水：** `spec-lfg` + `spec-commit-push-pr` 拥有 PR 尾部；`spec-optimize` 拥有仅测量调优；`spec-handoff` 拥有连续性产物；胶水只翻译事实、串联现有负责人调用并传递失败/限制。
- **拒绝新增边界：** 本计划不新增中心 CE 运行器、提供方路由器、共享守护进程、Proof 外发集成或 `spec-babysit-pr`/`spec-retune`/`spec-setup`；仅新增一个受用户批准、由人体验驱动的 `spec-prototype` owner。

### 上游主题矩阵

| 主题簇 | 上游代表性证据 | 当前负责人 | 默认裁决 | 验证重点 |
| --- | --- | --- | --- | --- |
| 调度与可移植上下文 | `95ea8ad0`、`c23acfb7`、`459c9ebe`、`57886045`、`b76d9d60` | `spec-work`、`spec-code-review`、`spec-doc-review`、调度辅助工具 | 经边界适配后吸收 | 授权矩阵、上下文一致性、Windows/Git Bash/TMPDIR 负向路径 |
| 规划与提示词预算 | `fb440c6e`、`05f3b798`、`e1cbc8f6`、`e36ddb8c`、`32f526f5`、`b116a76d` | `spec-plan`、`spec-brainstorm`、`spec-ideate`、`spec-write-skill` | 直接同步或经边界适配同步 | 产品契约锚点、输出模式、交接、源码引用、提示词预算 |
| 评审与同行回执 | `6b43f6e8`、`bfccada9`、`75695be6`、`9dc879ab`、`3032d00b`、`6d3cf578`、`9154a7c6` | `spec-code-review`、`spec-doc-review`、`spec-pov`、同行评审辅助工具 | 经边界适配同步 | 请求/实际身份、不评审状态、空闲/超时、最终立场以及鉴权/配额负向路径 |
| PR 尾部与堆栈姿态 | `1b46bafa`、`a3a14587`、`d344f7f6`、`77c38cae`、`b2f1ab48`、`802f353d` | `spec-lfg`、`spec-commit-push-pr`、`spec-resolve-pr-feedback` | 组合进现有尾部 | 基线新鲜度、评审回执、不得未经请求合并、单写入者、草稿/就绪状态 |
| 工作执行与恢复 | `c5358ed2`、`82e6ae04`、`6d60b744`、`62e108eb`、`57e586d6`、`bfb18680` | `spec-work`、`spec-worktree` | 经边界适配同步 | 单元上下文、忽略快照能力、关联工作树索引、预热检出、交付覆盖 |
| 知识与历史 | `7ddaa418`、`a5cd949c`、`8d3444ca`、`7fbe05b6`、`b9027333`、`1d48b74e` | `spec-compound`、`spec-compound-refresh`、`spec-sweep` | 直接同步或负责人适配同步 | 当前仓库上下文扎根、解决方案结构、会话发现、命名指导矛盾 |
| 新能力表面 | `a27aa2af`、`e4e480aa`、`6c751ec3`、`4ef18db3` | 新建 `spec-prototype`；编写由 `spec-write-skill` 负责 | 集成但受人体验门禁约束 | throwaway 目录、决策胶囊、用户体验、不得进入生产代码 |
| 配置、清单与宿主打包 | `5ebc22db`、`d638aec0`、`106cd521`、`961d90f3`、`12c8ca02`、`abc75c73` | 无（`ce-setup` 本轮排除） | `out-of-scope-by-product-decision` | 仅保留路径/状态事实，不修改 CLI、清单、配置或 runtime |

### 当前对应关系决策

| CE 表面 | 当前 `spec-first` 负责人 | 决策 | 边界 |
| --- | --- | --- | --- |
| `ce-babysit-pr` | 无（本轮排除） | `out-of-scope-by-product-decision` | 只保留 CE 源码事实，不修改 LFG/commit-push-pr |
| `ce-handoff` | `spec-handoff` | 扩展现有连续性契约 | 摘要/源码引用/新鲜度/限制；临时指针不具备权威 |
| `ce-prototype` | `spec-prototype` | 新建并集成 | 只处理可体验的产品不确定性；必须有人体验；产物为 throwaway prototype + decisions capsule，不直接发布 |
| `ce-retune` | 无（本轮排除） | `out-of-scope-by-product-decision` | 不修改 `spec-optimize`，不新增 `spec-retune` |
| `ce-skill-work` | `spec-write-skill` | 组合/扩展编写负责人 | 源 Skill 包保持规范来源；不导入 CE 包 |
| `ce-setup` | 无（本轮排除） | `out-of-scope-by-product-decision` | 不修改 `spec-runtime-setup` 或 CLI |
| `ce-plan` / `ce-brainstorm` / `ce-ideate` | 匹配的 `spec-*` | 直接同步/负责人适配 | 保留产品契约、禁止默认外发和交接门禁 |
| `lfg` | `spec-lfg` | 直接同步/负责人适配 | 必须明确提交/落地/调度授权 |

### 专项表面路由

低密度或主要为文档/测试变化的表面不因文件数少而跳过；U2 必须为每个表面生成一条主裁决，实施时按下表进入对应单元：

| CE 表面 | 当前负责人 | 单元 | 默认处理 |
| --- | --- | --- | --- |
| `ce-commit` | `spec-commit` | U5 | 保留仅内部提交权限，并限定路径范围 |
| `ce-debug` | `spec-debug` | U6 | 仅吸收交接/回退措辞；没有复现不得声称存在缺陷 |
| `ce-dogfood` | `spec-dogfood` | U8 | 仅保留证据，除非变更后的浏览器契约已有当前源码负责人 |
| `ce-explain` | `spec-explain` | U4 | 保留教学产物，不产生执行副作用 |
| `ce-polish` | `spec-polish` | U8 | 直接进行低风险校准；浏览器服务器仍由调用方负责 |
| `ce-product-pulse` | `spec-product-pulse` | U8 | 文档/契约证据；不意味着新增信号源 |
| `ce-promote` | `spec-promote` | U8 | 仅保留文案/格式证据；没有已交付功能证据不得声称发布 |
| `ce-proof` | 无（产品决策明确排除） | U6 | `out-of-scope-by-product-decision`；不上传 Proof、不保存 Proof 凭据、不创建 `spec-proof` |
| `ce-resolve-pr-feedback` | `spec-resolve-pr-feedback` | U5 | 保留有界反馈范围和源计划可追溯性 |
| `ce-riffrec-feedback-analysis` | `spec-riffrec-feedback-analysis` | U6 | 保留压缩包安全和反馈产物来源 |
| `ce-simplify-code` | `spec-simplify-code` | U6 | 保留行为和差异范围；不做无关清理 |
| `ce-strategy` | `spec-strategy` | U4 | 当前产品锚点仍以源码为准；不自动更改路线图 |
| `ce-sweep` | `spec-sweep` | U4 | 保留来源确认和验证限制 |
| `ce-test-browser` | `spec-test-browser` | U8 | 调用方负责服务器，精确来源证据保持分离 |
| `ce-test-xcode` | `spec-test-xcode` | U8 | 模拟器能力是就绪证据，不是应用结果 |
| `ce-worktree` | `spec-worktree` | U3/U6 | 保留 existing-ref、隔离和脏工作树边界 |

### 产物与接口契约

- `docs/validation/2026-08-18-ce-post-3-20-name-status.md`：固定上游窗口的已确认原始名称状态快照；由 Git 对象生成，不是语义审计。
- `docs/validation/2026-08-19-ce-post-3-20-filelist-source-comparison.md`：185 条 `F001-F185` 记录；每条记录负责一个清单路径，包含 CE base/head blob、差异规模、当前负责人、初步裁决和新增行导航锚点。
- `docs/validation/2026-08-19-ce-post-3-20-reconciliation.json`：机器可读账本，包含结构版本、上游身份、完整窗口边界计数、185 条选择集合、187 条排除集合、路径记录和当前清单身份；旧日期产物保持只读。
- `docs/validation/2026-08-19-current-skill-package-inventory.json`：当前 `skills/` 包清单，包含源码 HEAD、技能树 OID、逐文件字节数/哈希和逐 Skill 计数；旧日期清单不作为本轮 current truth。
- `scripts/check-ce-upstream-reconciliation.cjs`：确定性产物生成器；旧固定窗口默认值保持兼容，新窗口使用显式输入。
- 计划级语义裁决保留在本计划/审计中；脚本不得根据路径名称推断 `adopt`、`reject`、`defer`、根因或现场结果。

### 实施范围边界

- 旧 3.20 证据保持不可变；新窗口使用新的产物路径和测试。
- 本计划覆盖当前源码负责人校准，不涉及上游仓库变更或发布管理。
- 除非当前负责人、消费者、授权、产物和验证契约已经存在，否则新的公开能力一律延后。
- 文档和 `CHANGELOG.md` 更新记录源码变更与证据限制；不声称宿主完全对等或现场已采纳。

## Implementation Units

### 单元索引

| U-ID | 标题 | 关键文件 | 依赖 |
| --- | --- | --- | --- |
| U1 | 冻结新的上游窗口并建立审计账本 | `scripts/check-ce-upstream-reconciliation.cjs`、`docs/validation/2026-08-19-ce-post-3-20-*` | — |
| U2 | 重建当前源码清单与对应关系矩阵 | `skills/`、`docs/validation/2026-08-19-current-skill-package-inventory.json` | U1 |
| U3 | 加固调度、上下文与可移植运行时边界 | `skills/spec-work`、`skills/spec-code-review`、`skills/spec-doc-review`、`tests/` | U2 |
| U4 | 校准规划、编写与知识入口 | `skills/spec-plan`、`skills/spec-brainstorm`、`skills/spec-ideate`、`skills/spec-write-skill`、`skills/spec-compound*`、`tests/` | U2 |
| U5 | 校准评审、同行评审与 PR 交付尾部 | `skills/spec-code-review`、`skills/spec-doc-review`、`skills/spec-pov`、`skills/spec-lfg`、`skills/spec-commit-push-pr`、`tests/` | U3 |
| U6 | 校准工作/恢复并集成原型表面 | `skills/spec-work`、`skills/spec-worktree`、`skills/spec-handoff`、`skills/spec-optimize`、`skills/spec-prototype`、`tests/` | U3、U4 |
| U7 | 记录 CLI/设置表面排除边界 | `docs/validation/2026-08-19-ce-post-3-20-filelist-source-comparison.md` | U1、U2 |
| U8 | 文档、投射、验证与收尾 | `README*.md`、`CHANGELOG.md`、`docs/validation`、运行时预期 | U3-U7 |

### U1. 冻结新的上游窗口并建立审计账本

**目标：** 在不改变历史 3.20 账本的前提下，为 `1fac0442..bbf995a4` 建立可复现、路径完整的证据基础。

**需求：** CR1、CR2、CR5、CR16。

**依赖：** 无。

**文件：**

- `scripts/check-ce-upstream-reconciliation.cjs`
- `tests/unit/ce-upstream-3-20-reconciliation.test.js`
- `tests/unit/ce-upstream-reconciliation-v2.test.js`
- `docs/validation/2026-08-18-ce-post-3-20-name-status.md`
- `docs/validation/2026-08-19-ce-post-3-20-filelist-source-comparison.md`
- `docs/validation/2026-08-19-ce-post-3-20-reconciliation.json`

**实施方式：**

- 增加显式 `base/head/ce-repo/filelist/filelist-sha256/audit/name-status/ledger/summary/inventory` 输入输出参数；`filelist` 是本轮唯一同步范围，`filelist-sha256` 不匹配时 fail-closed。旧窗口通过 `--verify-legacy` 只验证历史 ledger，不拿历史 inventory 阻断当前源码漂移。
- 将选择集合写入机器账本：`selected_path_count=185`、`excluded_path_count=187`、`selected_status_counts={M:148,A:36,R074:1}`、`selection_source`、`selection_sha256`、`excluded_reason=out-of-scope-by-user-selection`；重命名以一个逻辑记录计数，保留 `old_path`/`path`。
- 解析 `--name-status --find-renames` 并保留旧/新路径；遇到重复、缺失、未分类或多余审计记录时失败。
- 将原始路径/状态事实与语义负责人/裁决字段分开。审计记录必须显式提供 `target_action` 受限枚举；产物生成器只校验枚举、存在性和结构，不从 `verdict` 自由文本推导动作。
- 当前 Skill inventory 只接收 `lstat().isFile()` 的规范文件；目录、符号链接、失效路径被记录为明确的负向事实，不进入哈希或包计数。
- CE 新增行锚点在写入 Markdown/JSON 前执行确定性敏感字段检测；命中 token、凭据、私钥、带认证信息的 URL 或疑似 secret 时只写 `redacted`、路径、行号和 blob hash，不写原文。
- 为全部路径、实施目标、仅证据、Skill 表面、CLI/运行时、支持项、测试、脚本和重命名产出汇总计数。

**遵循的模式：** 现有 `parseNameStatus`、`buildLedger`、`buildCurrentInventory` 和 `tests/unit/ce-upstream-3-20-reconciliation.test.js`。

**测试场景：**

1. 覆盖 AE1。读取用户清单并校验 SHA、唯一性、与 `1fac0442..bbf995a4` 的交集，输出精确的 185 条路径集合；完整 372 条集合只输出边界摘要，清单外 187 条标记为 `out-of-scope-by-user-selection`。
2. 重命名同时保留 `old_path` 和 `path`，且只计数一次。
3. 重复路径、缺失审计记录、多余审计记录和无效状态均严格失败。
4. `--verify-legacy` 通过旧 422 路径 ledger 完整性检查，不要求或改写当前 inventory。
5. 缺少 `target_action` 或使用未知枚举时严格失败；提供方专属文本只能保留在审计字段，不能转换为采纳动作。
6. 缺少 `--filelist`、清单 SHA 不匹配、清单重复/越界、选择集合计数不一致或 rename old/new 端点无法配对时严格失败。
7. 锚点命中敏感字段时输出 `redacted`，并以 fixture 证明 token、认证 URL、私钥样例不会进入任何验证产物。

**验证：** `npx jest tests/unit/ce-upstream-3-20-reconciliation.test.js tests/unit/ce-upstream-reconciliation-v2.test.js --runInBand`；旧 `--verify-legacy` 证明历史窗口不变，新参数化夹具证明 185 清单的 SHA/交集/状态、重复运行确定性和 current-inventory 漂移隔离；完整 372 窗口只验证边界摘要。

### U2. 重建当前源清单与对应关系矩阵

**目标：** 基于当前 `spec-first` 源码树重新校准所有对应关系和包决策。

**需求：** CR3、CR4、CR6-CR9、CR16。

**依赖：** U1。

**文件：**

- `skills/*/SKILL.md`
- `docs/validation/2026-08-19-current-skill-package-inventory.json`
- `docs/validation/2026-08-19-ce-post-3-20-filelist-source-comparison.md`
- `docs/plans/2026-08-18-001-refactor-sync-ce-post-3-20-head-calibration-plan.md`

**实施方式：**

- 为当前 `skills/` 全部文件记录字节数、哈希、负责人角色、包和源码树 OID。
- 在语义映射前建立精确的 CE 到 spec 存在性集合。
- 记录当前映射：`ce-handoff` 对应 `spec-handoff`，`ce-skill-work` 对应 `spec-write-skill`，`ce-prototype` 对应新建 `spec-prototype`；`ce-proof`、`ce-babysit-pr`、`ce-retune`、`ce-setup` 均记录为 `out-of-scope-by-product-decision`。
- 将每个受影响的上游文件重新分类为实施目标、仅证据、延后或拒绝；不继承目录级裁决。

**测试场景：**

1. 清单恰好包含 35 个规范 `SKILL.md` 入口和稳定的清单哈希。
2. 当前源码树变化会使原清单身份失效，并要求重新生成。
3. `ce-prototype` 生成 `spec-prototype` canonical 入口；无人值守、pipeline、无体验者或缺少可回答问题时不得启动。
4. `ce-proof` 不创建公开路由、不上传本地文档、不引入 Proof token/ownerSecret。
5. `ce-handoff` 不会被错误保留在历史无对应关系集合中。

**验证：** JSON 清单路径唯一，所有文件存在，所有哈希与当前工作树匹配，并且每个受影响的 CE Skill 都有一个当前负责人或明确的延后/拒绝决策。

### U3. 加固调度、上下文与可移植运行时边界

**目标：** 将 3.20 之后的授权、上下文交付、临时目录、Windows 和无检出可移植性不变量吸收到现有的宿主中立负责人中。

**需求：** CR10-CR14、CR16。

**依赖：** U2。

**文件：**

- `skills/spec-work/SKILL.md`
- `skills/spec-work/references/execution-strategy.md`
- `skills/spec-work/references/execution-engines.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-doc-review/SKILL.md`
- `skills/spec-lfg/SKILL.md`
- `skills/spec-worktree/SKILL.md`
- `src/cli/helpers/context-bundle.js`
- `tests/unit/dispatch-authorization-matrix-contracts.test.js`
- `tests/unit/worker-dispatch-host-journey-contracts.test.js`
- `tests/unit/worker-dispatch-host-preflight-contracts.test.js`
- `tests/unit/peer-job-runner-parity.test.js`
- `tests/unit/private-scratch-migration-contracts.test.js`
- `tests/unit/spec-worktree-contracts.test.js`

**实施方式：**

- 将调度准入保留在 Skill/调用方上下文中；工作者辅助工具只接收最小范围上下文和明确的授权事实。
- 将原生 Windows/Git Bash/WSL/TMPDIR 回退规范化为能力事实，而不是宿主专属的公开工作流语义。
- 保留私有临时目录归属、符号链接检查、大小上限、超时、清理以及凭据不得进入参数/日志的规则。
- 将提供方/模型身份和路由细节保留在回执/证据中，不写入通用 Skill 文案。

**测试场景：**

1. 缺少调度/外发授权时不启动任何外部进程，并诚实回退。
2. 被拒绝的调度不会消耗回退机会或改变调用方范围。
3. 原生 Windows 优先使用受支持的 shell 路径，不把 WSL 视为隐式替代品。
4. 临时目录根路径遵守 `TMPDIR`，拒绝符号链接，并在成功/失败后清理私有状态。
5. 关联工作树中的工作者不能写入父级 Git 索引，也不能在单元范围外提交。

**验证：** 聚焦的授权、上下文一致性、临时目录、Windows 和工作树测试覆盖正向与负向路径；任何提供方 CLI 都不会成为通用契约的一部分。

### U4. 校准规划、编写与知识入口

**目标：** 采纳 3.20 之后的提示词/路由瘦身和上下文扎根改进，同时不削弱产品契约、交接或禁止默认外发边界。

**需求：** CR7-CR11、CR14-CR16。

**依赖：** U2。

**文件：**

- `skills/spec-plan/SKILL.md`
- `skills/spec-plan/references/plan-sections.md`
- `skills/spec-plan/references/plan-handoff.md`
- `skills/spec-brainstorm/SKILL.md`
- `skills/spec-brainstorm/references/synthesis-summary.md`
- `skills/spec-ideate/SKILL.md`
- `skills/spec-explain/SKILL.md`
- `skills/spec-strategy/SKILL.md`
- `skills/spec-write-skill/SKILL.md`
- `skills/spec-compound/SKILL.md`
- `skills/spec-compound-refresh/SKILL.md`
- `skills/spec-sweep/SKILL.md`
- `tests/unit/spec-plan-contracts.test.js`
- `tests/unit/spec-plan-quality-contracts.test.js`
- `tests/unit/spec-plan-consumer-replay-contracts.test.js`
- `tests/unit/spec-brainstorm-contracts.test.js`
- `tests/unit/spec-brainstorm-clarification-contracts.test.js`
- `tests/unit/spec-ideate-clarification-handoff-contracts.test.js`
- `tests/unit/spec-write-skill-contracts.test.js`
- `tests/unit/compound-promotion-contracts.test.js`
- `tests/unit/compound-template-category-contracts.test.js`

**实施方式：**

- 只有在仍能发现精确引用或负责人契约时，才删除重复的始终加载文案。
- 保留产品契约、需求追踪、源码引用、输出模式、交接、无头模式和禁止默认外发锚点。
- `ce-retune` 本轮不处理；不修改 `spec-optimize`，不新增 `spec-retune`。
- 让 `spec-compound`/refresh 扎根当前源码和命名指导；不使用历史缓存或通用产物根目录。

**测试场景：**

1. 计划请求仍然生成完整的产品契约和可实施章节。
2. 无头/非交互模式不会调用阻塞式提问工具。
3. 缺少可选提权能力时在线回退，不声称已完成外部评审。
4. `spec-compound-refresh` 检测指导矛盾，并保持当前源码的权威性。
5. Skill 编写请求保持源码优先，不导入 CE 包文件，也不修改生成镜像。

**验证：** 契约测试证明承载约束的锚点得以保留且重复文案减少；新鲜源码评测仍作为单独报告的门禁。

### U5. 校准审查、同行评审与拉取请求交付尾部

**目标：** 将评审机制、同行回执、陪跑姿态和 PR 尾部行为纳入现有 `spec-first` 工作流负责人。

**需求：** CR10-CR13、CR15-CR17。

**依赖：** U3。

**文件：**

- `skills/spec-code-review/SKILL.md`
- `skills/spec-code-review/references/cross-model-review.md`
- `skills/spec-doc-review/SKILL.md`
- `skills/spec-doc-review/references/cross-model-review.md`
- `skills/spec-doc-review/references/findings-schema.json`
- `skills/spec-doc-review/scripts/cross-model-doc-review.sh`
- `skills/spec-doc-review/scripts/peer-job-runner.py`
- `skills/spec-pov/SKILL.md`
- `skills/spec-lfg/SKILL.md`
- `skills/spec-lfg/references/pr-watch-loop.md`
- `skills/spec-lfg/scripts/pr-watch-state.cjs`
- `skills/spec-commit/SKILL.md`
- `skills/spec-commit-push-pr/SKILL.md`
- `skills/spec-resolve-pr-feedback/SKILL.md`
- `tests/unit/spec-code-review-contracts.test.js`
- `tests/unit/spec-code-review-mechanics.test.js`
- `tests/unit/spec-code-review-peer-runner.test.js`
- `tests/unit/spec-doc-review-contracts.test.js`
- `tests/unit/review-peer-expansion-contracts.test.js`
- `tests/unit/spec-lfg-contracts.test.js`
- `tests/unit/spec-lfg-pr-watch-state.test.js`
- `tests/unit/spec-resolve-pr-feedback-contracts.test.js`
- `tests/unit/spec-work-shipping-contracts.test.js`
- `tests/unit/specialized-skill-calibration-contracts.test.js`

**实施方式：**

- 保持机械化问题项范围/指纹/结构/顺序的确定性；语义严重度、评审名单和结论仍由 LLM/负责人决定。
- 当前 provider 范围保持 `codex|claude`，复用现有脚本的 owner-private、授权、redaction、payload SHA 和请求/实际身份 fail-closed 契约；CE 的 Grok/Fable 路由和 `.text` 解包只保留 `provider_untrusted` 证据，不作为本轮已实现能力。
- 请求/实际 provider 或 model 不一致时产出“未启动/无独立覆盖”的拒绝回执，保留两组身份但不得进入正常评审结果；只有后续新增受控 adapter、served-model receipt、allowlist 和外发/凭据测试后，才能扩展 provider 范围。
- `ce-babysit-pr` 本轮不处理；不修改 LFG/commit-push-pr 的现有行为。
- 保留不得未经请求合并基线、不自动合并、不强制推送和不任意重写历史的边界。

**测试场景：**

1. 未设置同行的跨模型评审遵循文档化门禁条件，不会静默跳过必要语义。
2. 同行返回非最终立场、配额拒绝、鉴权拒绝、超时或流式空闲时，产出有界回执和诚实的降级状态。
3. Grok/Fable `.text` 结构化输出仅被记录为未采纳的上游证据，不启动 provider，也不把其结果当作当前评审覆盖。
4. 当评审回执、CI、头部或基线新鲜度未解决时，PR 就绪状态保持为 false。
5. 已处理的机器人评论不会因后续自编辑而重新激活。
6. 没有明确基线合并请求的堆栈绝不会执行基线合并。

**验证：** 评审/同行/PR 契约测试覆盖负向路径并通过；任何实时 GitHub 观察/恢复仍属于现场证据，不由本地测试声称完成。

### U6. 校准工作执行、恢复与集成原型能力面

**目标：** 采纳工作/恢复改进，并集成受人体验门禁约束的 `spec-prototype`，同时明确 Proof 外发不在范围内。

**需求：** CR6-CR9、CR13-CR17。

**依赖：** U3、U4。

**文件：**

- `skills/spec-work/SKILL.md`
- `skills/spec-work/references/execution-strategy.md`
- `skills/spec-work/references/shipping-workflow.md`
- `skills/spec-work/scripts/source-plan-file-hash.cjs`
- `skills/spec-work/scripts/working-tree-fingerprint.cjs`
- `skills/spec-worktree/SKILL.md`
- `skills/spec-handoff/SKILL.md`
- `skills/spec-optimize/SKILL.md`
- `skills/spec-prototype/SKILL.md`
- `skills/spec-prototype/references/preview.md`
- `skills/spec-prototype/references/write-back.md`
- `skills/spec-prototype/references/craft-floor.md`
- `skills/spec-debug/SKILL.md`
- `skills/spec-dogfood/SKILL.md`
- `docs/contracts/verifiers/verification-evidence.schema.json`
- `docs/validation/2026-07-30-proof-v3-external-contract-gate.md`
- `skills/spec-riffrec-feedback-analysis/SKILL.md`
- `skills/spec-simplify-code/SKILL.md`
- `docs/validation/2026-08-19-ce-post-3-20-filelist-source-comparison.md`
- `tests/unit/spec-work-contracts.test.js`
- `tests/unit/spec-work-consumer-chain-contracts.test.js`
- `tests/unit/spec-work-execution-strategy-contracts.test.js`
- `tests/unit/spec-work-lfg-recovery-contracts.test.js`
- `tests/unit/spec-work-run-artifact-contract.test.js`
- `tests/unit/spec-handoff-contracts.test.js`
- `tests/unit/spec-optimize-contracts.test.js`
- `tests/unit/spec-optimize-measurement-only-contracts.test.js`
- `tests/unit/spec-prototype-contracts.test.js`
- `tests/integration/spec-prototype-human-journey.integration.test.js`

**实施方式：**

- 每个工作者只保留一个单元上下文，在调度前探测忽略快照能力，并阻止沙箱工作者写入关联工作树 Git 索引。
- 项目定义的交付流程只有通过明确的负责人契约，才能覆盖通用 commit-push-pr。
- 新建 `spec-prototype`，只负责 throwaway prototype 的问题选择、体验前置确认、隔离目录、决策胶囊和向 `spec-brainstorm`/`spec-plan` 的 handoff；不复制 CE 的外部 Proof、中心运行器或生产实现。
- 原型目录必须先通过 gitignore/路径安全检查；拒绝时回退到受控临时目录；不得删除用户保留的原型目录。
- 只有用户真实体验并作出选择后，才写 `decisions.md` 或回写 Product Contract；无人值守运行返回 `blocked-human-experience-required`。
- `ce-proof` 的所有外发、凭据和网络 API 行为明确跳过，不创建对应 runtime projection。
- 保持 `spec-handoff` 为持久连续性负责人；不因 `ce-retune` 引入额外调优 owner、临时指针或中心实验运行器。

**测试场景：**

1. 工作者不能查看或修改无关的单元上下文。
2. 调度前检测预热检出和忽略快照能力；能力不可用时产生有界回退。
3. 项目定义的交付流程得到遵守，但不会因此授予提交/落地权限。
4. 交接产物保留源码引用、新鲜度和限制，恢复时不能据此授权变更。
5. 没有体验者、问题不明确、原型目录不安全或无法保存决策胶囊时 fail-closed；不把原型测试通过当作用户决定。
6. `ce-proof` 不产生任何网络请求、外部文档或凭据读取。

**验证：** 工作/恢复、交接和 `spec-prototype` 契约测试通过；覆盖有人体验、无人值守阻断、gitignore/临时目录回退、决策胶囊写回和 Proof 零外发负向路径；固定测试不提升为用户体验结果。

### U7. 记录命令行/设置表面排除边界

**目标：** 记录 `ce-setup` 及其关联 CLI/设置变化为本轮明确排除项；不修改 `src/cli/**`、`spec-runtime-setup` 或 generated runtime。

**需求：** CR5、CR10-CR12、CR16。

**依赖：** U1、U2。

**文件：**

- `docs/validation/2026-08-19-ce-post-3-20-filelist-source-comparison.md`
- `docs/plans/2026-08-18-001-refactor-sync-ce-post-3-20-head-calibration-plan.md`

**实施方式：**

- 将 `ce-setup`、其关联 CLI/设置路径和本轮相关配置变化写入账本，统一使用 `out-of-scope-by-product-decision`。
- 不对 `src/cli/**`、`skills/spec-runtime-setup/**`、插件清单、配置或生成镜像做同步修改；若未来要处理，另立产品决策和计划。

**测试场景：**

1. 账本中 `ce-setup` 关联记录均有唯一 ID、排除理由和当前 owner 状态。
2. 方案不再把 `ce-setup` 变化列入实施文件或同步测试。
4. 只有存在能力事实时才报告 OMP/原生安装；缺少提供方时保持降级。
5. 只读沙箱设置不会声称已执行变更或生成运行时修复。

**验证：** CLI/插件/配置聚焦测试通过；受支持宿主文档与当前注册表一致；不需要仅修改运行时产物。

### U8. 文档、投射、验证与收尾

**目标：** 让源码变更和证据边界可发现，将已验证源码投射到受支持宿主，并在不过度声称结果的前提下关闭计划。

**需求：** CR1-CR17 以及全部成功标准。

**依赖：** U3-U7。

**文件：**

- `README.md`
- `README.en.md`
- `README.zh-CN.md`
- `CHANGELOG.md`
- `docs/validation/2026-08-18-ce-post-3-20-name-status.md`
- `docs/validation/2026-08-19-ce-post-3-20-filelist-source-comparison.md`
- `docs/validation/2026-08-19-ce-post-3-20-reconciliation.json`
- `docs/validation/2026-08-19-current-skill-package-inventory.json`
- `docs/plans/2026-08-18-001-refactor-sync-ce-post-3-20-head-calibration-plan.md`
- `skills/spec-polish/SKILL.md`
- `skills/spec-product-pulse/SKILL.md`
- `skills/spec-promote/SKILL.md`
- `skills/spec-test-browser/SKILL.md`
- `skills/spec-test-xcode/SKILL.md`
- `tests/integration/doc-review-six-host-projection.integration.test.js`
- `tests/unit/host-runtime-projection-contracts.test.js`
- `tests/unit/init-preview.test.js`

**实施方式：**

- 仅根据已确认的源码行为和明确标注的降级/阻塞现场证据更新用户可见文档。
- 只有在规范源码/测试和对账产物确认后才运行源码优先 `init`；生成镜像是输出，不是编辑目标。
- 记录单元回执、未解决的实时提供方/现场限制和准确的验证命令。
- 将计划状态/就绪状态与实施进度和现场结果分开。

**测试场景：**

1. 文档链接解析到当前仓库相对产物，不指向过期绝对路径。
2. `CHANGELOG` 条目区分源码机制、就绪状态、生成投射和现场结果。
3. 源码优先初始化投射当前源码，不产生仅运行时补丁或非托管冲突。
4. 旧 3.20 证据与新的 3.20 之后证据共存，并保持可独立追溯。

**验证：** 由 `spec-work` 记录 `git diff --check`、计划结构检查、聚焦契约测试、源码优先投射/诊断检查以及仓库要求的 unit/smoke/integration 命令的准确结果；现场限制保持可见。

## 排序与发布波次

| 波次 | 单元 | 退出条件 |
| --- | --- | --- |
| W0 证据 | U1 | 185 路径账本、清单 SHA/状态、逐文件源码事实和旧窗口回归稳定；372 完整集合仅边界校验 |
| W1 源码映射 | U2 | 当前清单和对应关系矩阵新鲜；不存在负责人歧义 |
| W2 确定性/运行时底线 | U3、U7 | 授权、临时目录、可移植性、清单/配置和 CLI 契约聚焦通过 |
| W3 规划/知识 | U4 | 规划/编写/复合锚点保持完整，且提示词瘦身有覆盖 |
| W4 评审/工作/PR | U5、U6 | 同行回执、评审、工作恢复和交付尾部负向路径有覆盖 |
| W5 收尾 | U8 | 文档/`CHANGELOG`/源码优先投射和完整验证证据齐备 |

不要将 W0-W2 与语义 Skill 重写合并到一个巨型提交中。语义采纳决策前，对账事实必须稳定；运行时投射前，源码变更必须经过测试。

## Verification Contract

### 确定性门禁

- 固定 CE 对象存在，并解析到声明的 base/head。
- 用户清单校验产出 `185` 条唯一路径，SHA 为 `b99edefc1e0a71b743e44638b3e02e198e19106f539696cf3e8cc2b8534a0ece`，状态为 `M148/A36/R074=1`。
- `docs/validation/2026-08-19-ce-post-3-20-filelist-source-comparison.md` 包含 `F001-F185`，没有缺口、重复或未分类路径；每行有 CE base/head blob、numstat、owner 和裁决。
- 完整 Git 窗口的 372 条路径与清单集合完成交集校验；清单外 187 条全部标记为 `out-of-scope-by-user-selection`。
- 当前源码清单包含 35 个规范 Skill 入口、唯一路径、匹配的字节数/哈希，并记录源码 HEAD/树身份。
- 新对账摘要绝不覆盖或修改旧 `2026-07-30` 证据。
- 计划路径不使用绝对本地路径；上游路径通过指定的外部仓库和固定修订标识。
- 所有计划/证据文档通过 `git diff --check`。

### 分单元验证命令

- U1：`npx jest tests/unit/ce-upstream-3-20-reconciliation.test.js tests/unit/ce-upstream-reconciliation-v2.test.js --runInBand`；新窗口使用 `node scripts/check-ce-upstream-reconciliation.cjs --refresh --ce-repo <ce-repo> --base <base> --head <head> --filelist <filelist> --filelist-sha256 <sha256> --audit <audit> --name-status <name-status> --ledger <ledger> --summary <summary> --inventory <inventory>`，旧窗口使用 `--verify-legacy`。验证 selected/excluded 计数、rename 配对和锚点脱敏。
- U2：运行当前 Skill inventory 生成与 `git diff --check`，并验证 35 个 `SKILL.md`、路径唯一性、哈希和 `HEAD:skills` 身份；对应关系矩阵缺 owner 时必须失败。
- U3：`npx jest tests/unit/dispatch-authorization-matrix-contracts.test.js tests/unit/worker-dispatch-host-journey-contracts.test.js tests/unit/worker-dispatch-host-preflight-contracts.test.js tests/unit/private-scratch-migration-contracts.test.js tests/unit/spec-worktree-contracts.test.js --runInBand`。
- U4：`npx jest tests/unit/spec-plan-contracts.test.js tests/unit/spec-plan-quality-contracts.test.js tests/unit/spec-plan-consumer-replay-contracts.test.js tests/unit/spec-brainstorm-contracts.test.js tests/unit/spec-write-skill-contracts.test.js --runInBand`。
- U5：`npx jest tests/unit/spec-code-review-contracts.test.js tests/unit/spec-code-review-peer-runner.test.js tests/unit/spec-doc-review-contracts.test.js tests/unit/review-peer-expansion-contracts.test.js tests/unit/spec-lfg-contracts.test.js tests/unit/spec-lfg-pr-watch-state.test.js tests/unit/specialized-skill-calibration-contracts.test.js --runInBand`；身份不匹配必须是未启动回执，不能生成独立覆盖。
- U6：`npx jest tests/unit/spec-work-contracts.test.js tests/unit/spec-work-consumer-chain-contracts.test.js tests/unit/spec-work-lfg-recovery-contracts.test.js tests/unit/spec-handoff-contracts.test.js tests/unit/spec-optimize-contracts.test.js tests/unit/spec-optimize-measurement-only-contracts.test.js tests/unit/spec-prototype-contracts.test.js tests/integration/spec-prototype-human-journey.integration.test.js --runInBand`；覆盖人体验前置、无人值守阻断、throwaway 目录回退、决策胶囊写回和 Proof 零外发。
- U7：`npm run typecheck && npx jest tests/unit/cli-frontmatter-path-containment-calibration.test.js tests/unit/frontmatter-validator-utf8.test.js tests/unit/plugin-modules.test.js tests/unit/host-runtime-projection-contracts.test.js tests/unit/init-preview.test.js tests/unit/plans-command.test.js tests/unit/mcp-setup-config-consumers.test.js tests/unit/mcp-setup-contracts.test.js tests/unit/mcp-setup-registry.test.js --runInBand`；`spec-first init --<host> --preview` 与 `spec-first doctor --<host> --json` 只作为源码投射/就绪事实，不提升为现场结果。
- U8：`npm run test:unit && npm run test:smoke && npm run test:integration`；如环境无法运行，回执必须记录实际命令、退出码和 `not_run` 原因。

### 聚焦行为门禁

- 调度/技能上下文授权与零外发回退；
- Windows/Git Bash/WSL/TMPDIR/临时目录安全；
- 产品契约/输出模式/无头模式/交接保留；
- 同行评审请求/实际身份、超时/空闲/不评审/最终立场行为；
- PR 评审/CI/头部/基线新鲜度和不得未经请求合并行为；
- 工作单元上下文、预热检出、关联工作树索引和交付覆盖；
- 复合/刷新当前上下文扎根和命名指导矛盾；
- 清单/配置/Codex 内容/安装/只读沙箱行为。

### 语义与新鲜源代码门禁

- 仅当产物生成者拥有 Markdown 变更权限时，才以 `mutation:apply-fixes` 对本计划运行无头 `spec-doc-review`；否则报告降级评审并保留评审发现。
- 存在调度授权时，为变更的 Skill 文案运行新鲜源码评测；否则记录 `not_run: dispatch_authorization_missing`。
- 将实时提供方、GitHub PR 观察/恢复、OMP 宿主旅程、`spec-prototype` 用户体验结果和 Optimize A/A/B 实验视为独立证据门禁；任何本地测试都不能替代它们。

### 负向断言

- 不将任何提供方/模型/CLI 暴露为通用工作流契约。
- 脚本不输出语义采纳、根因、评审严重度或现场结果裁决。
- `spec-prototype` 的消费者和人体验门禁已由本计划确认，但没有体验者、问题或安全原型目录时不得启动；不创建 `spec-proof`、`spec-babysit-pr`、`spec-retune` 或 `spec-setup`。
- 不直接编辑生成运行时镜像来修复源码行为。
- 凭据不得进入 argv、源码、计划、回执或原始日志。
- 不将本地固定测试或模型自述提升为已确认的现场结果。

### 验证结果模式

每个波次回执必须记录：

- `artifact_type`
- `source_head` 与 `upstream_range`
- `unit_ids`
- `command_or_probe`
- `result`
- `exit_code`
- `requested_provider`、`actual_provider`、`requested_model`、`actual_model`（仅在同行路径适用）
- `route`、`timeout_or_idle_reason`、`result_sha256`、`data_boundary`
- `evidence_paths`
- `freshness`
- `limitations`
- `claim_ceiling`

## 风险与缓解措施

| 风险 | 影响 | 缓解措施/停止规则 |
| --- | --- | --- |
| 新窗口意外覆盖旧 3.20 账本 | 高 | 使用新的日期输出前缀、不可变旧夹具和双窗口回归 |
| 185 条指定路径被目录级结论替代 | 高 | F001-F185 精确记录、重复/未分类检查器和负责人级审计 |
| 清单外 187 条被静默重新纳入 | 高 | 清单 SHA、完整窗口交集摘要和 `out-of-scope-by-user-selection` 计数 |
| 提示词瘦身移除承载约束的门禁 | 高 | 为产品契约、授权、无头模式、交接、源码引用和声明上限增加锚点测试 |
| CE 提供方/宿主实现泄漏进当前契约 | 高 | 使用 `provider-untrusted` 证据、当前负责人映射和明确的拒绝/延后决策 |
| `spec-prototype` 变成无人负责或可无人值守执行的公开 Skill | 高 | 明确 canonical owner、体验前置确认、`blocked-human-experience-required`、throwaway 目录和决策胶囊 handoff |
| `ce-proof` 被误集成为外部文档服务 | 高 | 产品决策标记 `out-of-scope-by-product-decision`；不创建 Skill、网络请求或 Proof 凭据路径 |
| PR 陪跑获得隐式合并或分支权限 | 高 | 使用现有 LFG/commit-push-pr 负责人、不得未经请求合并测试和明确授权事实 |
| 当前源码清单在波次中变旧 | 中 | 每个实施波次前重新记录源码树身份并生成清单 |
| 固定测试被误认为现场结果 | 高 | 每个回执分别记录就绪/现场/声明上限 |
| 跨模型回执把请求模型报告成实际模型 | 高 | 请求/实际身份字段和不匹配负向测试 |
| 生成运行时补丁掩盖规范源码漂移 | 高 | 仅在源码测试后运行源码优先初始化；仅运行时变更无法收尾 |
| 清单或源码锚点泄露敏感信息 | 高 | `filelist-sha256`/选择集合 fail-closed；锚点确定性脱敏 fixture；敏感命中只保留 hash、路径、行号和 `redacted` |
| 计划过大而难以评审 | 中 | 单元索引、精确证据产物；不把原始差异粘贴进计划，长记录存放在验证产物中 |

## 已考虑的替代方案

### A. 复制整个 CE HEAD 包树

拒绝。这样会在没有当前归属或采纳证据的情况下，将提供方路由、宿主拓扑、新公开 Skill 形态和 CE 专属假设引入 `spec-first`。

### B. 只编辑用户提供的文件清单并创建文字方案

拒绝。文件清单未被跟踪且只有路径信息，无法证明 A/M/D/R、重命名来源、提交范围、当前源码身份或语义归属。

### C. 用一次性新脚本替换旧对账脚本

拒绝。这样会重复确定性底线，并使未来窗口不一致。应在保留旧固定窗口契约的同时，为现有产物生成器增加显式输入。

### D. 新增公开的 `spec-babysit-pr`、`spec-retune` 与 `spec-setup`

本计划拒绝这些新增表面。`spec-prototype` 是用户明确批准的例外，但仍要求独立的 throwaway 生命周期、真实体验者、决策胶囊和 handoff 归属；它不引入 Proof 外发或中心运行器。

### E. 将完整 372 个文件视为实施目标

拒绝。文档、测试、上游计划、插件元数据和证据文件可以解释变更或约束验证，不应被复制进当前源码。

## Definition of Done

- [ ] U1 产出确定性的 185 路径账本，包含清单 SHA、准确的 `M148/A36/R074=1` 事实、F001-F185 逐文件记录，并保留完整 372 边界及旧 422 路径证据。
- [ ] U2 刷新当前源码清单，并为每个受影响 Skill 记录精确的 CE/spec 对应关系决策。
- [ ] U3 通过聚焦的正向/负向测试保留调度、上下文、临时目录、可移植性和授权边界。
- [ ] U4 保留产品契约、plan/brainstorm/ideate/编写和复合锚点，只采纳有依据的提示词/上下文扎根变更。
- [ ] U5 覆盖评审/同行回执和 PR 尾部，不产生隐式合并、落地或提供方身份声明。
- [ ] U6 覆盖工作/恢复/交接/调优边界，集成 `spec-prototype` 并通过有人体验/无人值守阻断/决策胶囊/Proof 零外发验证。
- [ ] `spec-prototype` 的 canonical source、测试、handoff 和受支持宿主 projection 契约已定义；原型代码不会进入生产实现路径。
- [ ] `ce-proof` 明确保持 `out-of-scope-by-product-decision`，没有 `spec-proof`、外部文档或 Proof 凭据路径。
- [ ] U7 覆盖 CLI、清单、配置、Codex 内容、安装和受支持宿主源码契约，不采用仅运行时修复。
- [ ] U8 更新文档/CHANGELOG，通过受支持的初始化路径投射源码，并记录准确的验证和限制。
- [ ] 所有变更源码都有匹配测试，或有明确的“行为未变”说明。
- [ ] 所有放弃或拒绝的实施实验均已移除；不遗留孤立运行器、重复状态模型或生成产物。
- [ ] 没有单独授权和证据时，不进行提交、推送、PR、外部提供方调用或现场结果声明。

## 交接

本计划已准备好供下游实施评审。它不授权源码变更、生成运行时投射、提交、推送、PR、外部提供方调度或现场声明。下一位负责人必须在每个波次前重新读取当前源码和工作树状态，然后只执行选定的 U-ID 范围。
