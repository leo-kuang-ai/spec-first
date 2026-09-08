---
title: SDLC 视角多专家提升方案
date: 2026-09-07
deepened: 2026-09-07
revised: 2026-09-07
type: strategic-improvement-proposal
status: draft
artifact_type: advisory
execution: knowledge-work
sources:
  - "SDLC 全网调研会话 sess_d155bfbc-5ca3-43cb-b61b-0a7e2d953784（阶段/模型/DevSecOps/ALM 结论 digest）"
  - "第二轮会议：设计哲学一致性审计（2026-09-07 本仓库会话，4 位专家 + 1 位仲裁者共 5 个 fresh agent，14 项裁决）"
  - "第三轮评审：架构师团队文档评审（2026-09-07 本仓库会话，6 个 fresh reviewer agent：coherence/feasibility/product-lens/security-lens/scope-guardian/adversarial，18 项发现全部回源；本轮修订按其结论执行，记录见 §8）"
  - "docs/10-prompt/结构化项目角色契约.md（演化判断基线）"
  - "docs/plans/2026-09-05-002-next-phase-development-sequence.md（现行 S0-S6 开发顺序）"
  - "docs/plans/2026-09-03-001-feat-skill-routing-optimization-requirements.md（R3 已立项需求）"
  - "benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md（G1 指令消融候选的历史观察）"
---

# SDLC 视角下的 spec-first 提升方案（两轮多专家会议合并结论）

> 结论先行：**保留核心链路与角色契约，优先缩短可信反馈的等待，而非增加流程数量。** 用 SDLC 的需求变更管理、风险驱动验证、持续集成与维护反馈逐项校准原有提案。32 项决策条目收敛为：**4 项确定性收口、16 项候选折入、5 项受控试点、6 项暂缓、1 项拒绝**。默认指令瘦身先保留原始基线，安全查询先明确外发边界，追溯和指标先证明真实消费者。理论适配支持设计取舍，不证明现有 harness 的收益。
>
> 两点必须与上段同时读：**① G1（指令瘦身）是本方案价值最高、证据最强的条目**——全集唯一有现场成本数据（saturation 报告：+51%~59% 单任务成本、无正确率差异），其 P2 归类仅为「需先保存基线」的启动条件分类，不是价值排序；向主计划 owner 的第一推荐动作是在 S0 首轮登记 G1 的基线保存范围。**② 16 项 P1 折入的净流程为正**（§1.2 净过程账：直接缩短等待 6 项，防护/观测/表达 10 项），以 §1.2 的效应与证据标注、§4.5 的净方向约束补偿；全部 16 项均无事故级证据，主计划 owner 按 §6 的证据等级加权采纳顺序。

本文是 advisory 提升方案，不替代、不修改 `2026-09-05-002` 开发顺序的地位；所有折入项以该计划对应批次的出口条件为准。本文 `execution: knowledge-work`，不能直接作为 `spec-work` 的整包代码输入。

目标是让一次变更的意图、风险、验证和反馈可衔接。此次授权交付为方案优化，产品实施、模型实验、外部扫描、CI 配置和 runtime 投射均待对应任务承接。提案的批次是建议去向，尚不构成主计划已接纳的范围。

---

## 1. 背景与方法

**第一轮输入**：全网 SDLC 调研会话 `sess_d155bfbc` 的摘要，包含阶段划分、过程模型、安全左移与范围变化等主题。原摘要中的组织采用比例缺可定位原始出处，不进入本方案的事实或收益依据。

**第一轮过程**：五位不同视角专家（SDLC 流程建模、DevSecOps/供应链、敏捷流动效率、平台工程自动化、开发者体验采纳）基于统一 digest 独立只读分析并提交 19 项提案；红队守门员按四维（过度设计、宿主 primitive 重复、与 S0-S6 冲突、claim 与证据匹配）逐项裁决。

**第二轮过程**：四位不同视角专家（SDLC 生命周期、质量工程、需求工程、反馈闭环/知识管理）以角色契约 v3.4 为基线独立只读评审，提交 14 项提案；仲裁者按契约第 4 节演化判断（Adopt/Experiment/Defer/Build/Thin-Retire）逐项裁决，并对关键证据回源核查。两轮全部 agent 只读，未修改任何产品 source。

**第一轮证据核实**：红队独立核实四项关键证据，会议主席本地复验一致——

1. `skills/spec-code-review/SKILL.md:348`：trivial-PR 预判明确把 "dependency lock-file or manifest-only bumps" 列为可跳过 review 的候选。
2. `skills/spec-work/references/shipping-workflow.md:62,72`：dependency-version bumps 被列为 mechanical diff，可跳过 simplify 与 dedicated review。
3. `vendor/` 目录不存在，但 `AGENTS.md:164` 仍引用 "`vendor/`：vendored parser dependencies"（2026-09-07 时为 158 行，S3 候选落地后行号漂移；实施时以文本检索定位，不依赖行号）。
4. `.github/workflows/` 现有 4 条 workflow，均未接入 `check:shared-references` / `sync:instructions` 校验；`npm test` 全量仅在 windows runner 执行。

**第二轮原核实记录**：会议记录称对 6 项关键引用做了回源。当前 §3.2 已按本轮复核修正由这些引用推导出的结论；引用存在不等于原推论成立，实施仍以 owning source 为准。

以上过程为原会议记录，本轮不重新认证其独立性。本轮直接核对的 source 包括 `skills/spec-code-review/SKILL.md`、`skills/spec-work/references/shipping-workflow.md`、`skills/spec-plan/SKILL.md`、verification profile/run-summary 与 run-state schema、`src/cli/commands/init.js`、`templates/codex/hooks/session-start` 和现有 CI workflows。关键修正：

- saturation 只覆盖两个 skill 的五个任务，不能外推为全部默认指令可移除；`docs/validation/skill-evals/2026-09-02-entry-routing-and-static-audit.md` 还记录了 Sonnet 5 的路由绕过反例。
- 统一计划原地演进，`origin` 主要服务独立的 legacy requirements；`origin` hash 不能代表所有需求变更管理。
- run-state 未定义完整的打回/重路由事件及统计分母；profile 可声明命令身份，run summary 只记录实际结果，两者不是同一数据源。
- `init -y/--yes` 已存在；仅用 `git diff` 无法检测被忽略的 runtime mirror 内容变化。

### 1.1 本轮采用的业界依据

以下公开来源于 2026-09-07 读取。它们提供设计原则与工具事实；本仓收益仍须由 S2/S4 实测。

| 来源 | 可采纳的思想 | 对本方案的具体影响 |
| --- | --- | --- |
| [NIST SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | 安全实践贯穿 SDLC，处理漏洞根因以防复发 | B1/B2/B4 覆盖依赖与提交边界；G4 将已确认根因反馈给上游 owner；不把扫描零告警等同安全 |
| [DORA：持续集成](https://dora.dev/capabilities/continuous-integration/) | 小批次集成、快速自动反馈、可靠构建 | P0-2/P0-3 分离快检查和完整验证；不能只看 workflow 存在或绿灯 |
| [DORA：小批次工作](https://dora.dev/capabilities/working-in-small-batches/) | 每批独立、可验证、能快速纠偏 | 按 owner 与风险拆分，取消无关 schema 强绑和“大 PR 顺带”；C2 以等待与冲突校准并行 |
| [DORA：交付指标](https://dora.dev/guides/dora-metrics/) | 同时看吞吐与不稳定性，按服务上下文解释 | C1/C3/G9 不冒充生产部署指标，不用一次 run 的时间或 review 次数代表研发收益 |
| [敏捷十二原则](https://agilemanifesto.org/principles.html) | 欢迎需求变化、可工作软件是进度依据、定期反思并调整 | G2/G3 支持变更后的影响判断，G7 不以格式完整代替可验收，G8 先抽样再决定自动化 |
| [npm audit 官方文档](https://docs.npmjs.com/cli/v11/commands/npm-audit/) | 查询会发送依赖数据；批量端点失败可回退并发送完整依赖树及环境元数据 | B1 明确 registry、授权数据范围和失败路径；不自动运行 `audit fix` |

V 模型在本文仅借用“需求与验收、接口与集成验证成对考虑”的设计视角，不要求瀑布式串行阶段，也不宣称标准合规。螺旋模型借用“优先降低最大未知风险”；持续改进借用“观察、试验、验证、调整”，均不新增状态机。

### 1.2 净过程账与证据等级（16 项 P1 逐项）

本方案的主题是「缩短可信反馈的等待，而非增加流程数量」。照单落地 16 项 P1 后系统层面流程为**净增**：每条变更多出若干检查/记录环节，唯一做减法的 G1 被排在其启动条件之后。这笔账必须显式摆出，而非留给主题修辞吸收。逐项预期效应（对「任务完成到可信 review/交付的等待」，含新用户首个可信变更）：

| 效应类别 | 条目 | 依据 |
| --- | --- | --- |
| 直接缩短等待（6 项） | A1（reviewer 免于手工拼接追溯上下文）、C2（串行小批次降低集成与 review 等待）、F1（新用户首个可信变更等待）、F4（安装排错等待）、G4（上游假设修正等待）、G13（closeout 人工核对等待） | 结构缺口或一次性上游记录 |
| 防护性流程微增（4 项） | B1（依赖审查不再免审）、B2（提交前 secret 扫描）、B4（设计时依赖尽调）、D1（路由回归 CI 化） | 拦截风险静默进入；B1/B2 为自动化判定，人工等待不变 |
| 观测能力（2 项） | C1（时间区间可判）、C3（返工可见） | 不直接缩短，提供判据 |
| 防返工（2 项） | A2（接口级验证一次配对到位）、G3（方向替换可追溯） | 减少二次返工，非当次等待 |
| 表达类（2 项） | A3（交付边界显式声明）、F3（SDLC 词汇映射） | 不改变流程 |

净结论：直接缩短 6 项 < 防护/观测/防返工/表达 10 项，**净流程为正**。补偿机制为 §4.5 的净方向约束（G1 结论前各批次收口时受影响 skill 指令行数与流程步骤数不得净增长）与 §4.5 的基线保护；若主计划 owner 采纳时容量受限，按下行证据等级排序，理论适配项可随批顺延而不阻塞结构缺口项。

证据等级三档（本节为采纳排序提供输入，不改变各条目自身验证要求）：

| 等级 | 条目 | 说明 |
| --- | --- | --- |
| 结构缺口（已回源核实，11 项） | B1（两处文案行级引证）、B2（当前 commit 流程无 secret 处理指引）、A1（reviewer 手工拼接有专家记录）、A3（两轮独立收敛）、C1（run summary 仅 `generated_at`）、D1（CI 缺失 + 2026-09-02 路由绕过反例）、F1（上手止于 init）、F3（零词汇映射）、F4（支持矩阵存在而限制未外显）、G3（plan 的 abandon-and-replace 责任缺口）、G13（closeout 只汇总已运行记录） | 缺口在当前 source 中可定位 |
| 理论适配（仅外部原则，5 项） | B4（NIST SSDF）、A2（V 模型配对）、C2（DORA 小批次）、C3（返工观察）、G4（维护反馈前移） | 无本仓事故或摩擦记录支撑 |
| 观察到的事故（0 项） | — | 全部 16 项无事故级证据，包括 B1：依赖免审盲区被行级证实存在，但尚无由其漏过的真实伤害记录 |

---

## 2. SDLC 视角现状映射

| SDLC 阶段 | spec-first 对应 | 评价 |
| --- | --- | --- |
| 规划/分析 | spec-ideate/brainstorm/prd；R/A/F/AE 验收示例 | 已有意图载体；独立上游文档的漂移检测值得试点（G2） |
| 设计 | spec-plan + Verification Contract + high-risk-plan-lens | 已有设计与验证配对；按接口风险补验证（A2），明确方向替换的 owner（G3） |
| 编码 | spec-work/spec-debug/Direct Lane 分级 | 已有分级执行；可加强已确认根因对上游假设的反馈（G4） |
| 测试 | verification-run-summary、honest-closeout、working-tree 指纹、红绿证明 | 已有结果记录；先验证产品验收命令的现有表达能力（G5），定义时间口径（C1） |
| 部署 | 显式止于绿 PR（spec-lfg）；rollout/rollback 以 plan-time 决策进 lens | 边界正确但未显式声明 non-goal（提案 A3，两轮独立收敛） |
| 维护 | spec-compound(-refresh)、docs/solutions、spec-sweep、带失效条件的知识 | 已有反馈入口；引用失效与语义失效分别处理（G8），指令瘦身需受保护实验（G1） |

**设计映射（结构观察，不等于效果验证）**：

- **V 模型「阶段-验证配对」已隐性存在**：brainstorm 产验收示例（需求↔验收测试）、plan 逐单元枚举测试场景与 Verification Contract（设计↔验证）、work 要求红绿证明（编码↔单元测试）。
- **螺旋风险驱动已落地**：`high-risk-plan-lens.md` 触发矩阵 + largest unproven risk + Lightweight/Standard/Deep 深度分级。
- **DevSecOps 安全左移有锚点**：security-reviewer persona（注入/越权/secret/SSRF，且把 model/tool output 列为不可信输入）、PRD Sanitization 分离嵌入式指令、高风险主题路由 security-sentinel。
- **SDLC vs ALM 边界判断正确**：运维/部署执行不进 scope，风险由 plan-time 决策承载；缺的只是显式声明（A3）。

---

## 3. 专家发现摘要

### 3.1 第一轮：外部理论镜子（五视角）

**SDLC 流程建模**：阶段覆盖与验证配对整体扎实。缺口：一次变更缺 consolidated 追溯视图（R/U-ID、run summary、review findings 分散，PR reviewer 手工拼接）；设计↔集成验证配对弱于单元级；ALM non-goal 未显式声明。

**DevSecOps/供应链**：**lockfile/manifest bump 在两处流程文案中被列为可跳过 review 的 trivial/mechanical 类**，可能漏掉依赖来源、安装脚本或传递依赖的风险变化。锁文件完整性、来源真实性和已知漏洞是不同证据；hash 不能证明来源可信，已知漏洞查询也不能识别全部投毒。另有 commit secret 检查、依赖尽调与失效 `vendor/` 引用的改进候选。不再用 SolarWinds 案例直接论证 lockfile 是主要攻击载体。

**敏捷流动效率**：DoD 已显式、scope creep 有轻量防线（stop_if/done_signal）、批次大小有指引。缺口：日常 run 无时间维度、WIP 纪律未泛化到用户面、日常 rework 无轻量记录。

**平台工程**：CI 已有 4 条 workflow，确定性检查多为可拦截的 exit 1 模式。缺口：R3 路由回归 CI 化已立项未实施；漂移检查脚本化但 PR 不拦截；本仓自托管 mirror 缺重投射幂等门；Linux 无全量测试。

**开发者体验/采纳**：quickstart 机制化、宿主透明度领先、claim 分级严格。缺口：上手旅程止于 init，无「首个可信变更」终点定义；外部评估路径缺失；README×3 与手册对 SDLC/DevSecOps/ALM 零词汇映射。

### 3.2 第二轮：内部哲学一致性审计（四视角 + 仲裁）

**需求与维护反馈**：`docs/contracts/workflows/spec-id-traceability.md` 中 `origin` 是来源指针，task pack 的 `source_plan_hash` 校验任务相关内容。独立上游文档可补漂移信号；统一文档则需区分 Product Contract 变化与 planning 补充，不能照搬整篇 hash。维护根因是否推翻原需求假设，由 LLM 回源判断并交给原 owner。

**质量工程**：run summary 四态保留通过、失败、未运行与降级差别。`verification-profile.md` 的 "productSmoke is intentionally absent" 仅声明新增需 schema bump，不构成既定开发承诺；当前 schema 的 command/check id 映射可先用于验证既有产品验收表达能力。field-validation 的 producer、single_writer、schema identity 都属于 ce-localization，适合标明场景专用，而非提前泛化。

**需求工程**：spec-work 的 "The only permitted plan mutation" 限定该 workflow 的权限，不能外推成全系统唯一合法转换。G3 要补的是 spec-plan 在真实 abandon-and-replace 场景中的显式责任；原地更新、格式转换的 superseded sibling 与整条方向作废应分开，避免把每次改需求都变成新链。

**反馈闭环**：字段存在与引用可解析可由脚本检查；经验是否仍适用，需要按适用版本和失效条件做语义判断。仅在 CLI 搜不到 `invalidation` 不能证明整个维护流程缺席；`no-reuse-events` 也不能证明知识无价值。G8/G9 先确认数据覆盖，G1 用实验检验可移除的具体指令，不将历史建议未执行定性为已经证实的收益损失。

**当前裁决**：没有需要修改角色契约才能解决的已确认问题。HTML 生命周期属于已声明的边界；saturation 属需进一步检验的候选，不能以原会议共识提升证据级别。后续采用以 §4 的当前决定为准。

---

## 4. 提升方案

保留原编号，P0-4 即 G1（第二轮编号 K），P0-5 即 G6（第二轮编号 F）；第一轮部署边界提案与第二轮 D 合并为 A3。按来源清点：第一轮 19 项 + 第二轮 14 项 − 1 处合并 = 32 项，下表覆盖全部且每项只有一个当前去向。P0/P1/P2/P3 表示**建议承接顺序与启动条件，不是价值排序**，也不授权立即写入产品；**G1 是本方案价值最高、证据最强的条目**（全集唯一有现场成本数据），其 P2 归类仅为「需先保存基线」的启动条件分类——向主计划 owner 的第一推荐动作是在 S0 首轮登记 G1 的基线保存范围。

共同落地方式为 `reuse / extend / compose`：复用 CI、verification、plan/work/debug 和知识维护 owner；不新增中心化流程引擎。每项的 source 承载位置与消费者随条目给出，工具提供事实，是否充分由 LLM 判断。用户决定价值、接受风险与外部动作授权。

### 4.1 P0：确定性收口（4 项）

| 编号 | SDLC 判断与优化决定 | source owner / 消费者 | 最小验证与边界 |
| --- | --- | --- | --- |
| P0-1 | 保留并拆清两种事实：删除不存在的 `vendor/` 引用；外部 skill 更新同时检查来源、内容差异和完整性。hash 仅证明与记录一致，不证明可信，也不默认存在 skill 漏洞库 | `CLAUDE.md` 治理区、`SECURITY.md`；安装维护者与 reviewer。由同步脚本生成 AGENTS.md 受管区 | 修改 source 后以 `npm run sync:instructions -- --write` 生成，再用校验态验证；外部资产校验遵循其 producer 的 hash 算法，不能另造计算规则 |
| P0-2 | 保留 CI 漂移检查，优先给 PR 快速反馈；接入已有 `check:shared-references` 与 `sync:instructions` 校验态，不自动修复 | `.github/workflows/skill-entrypoint-gate.yml`；PR reviewer | 隔离副本中分别制造 shared-reference 与 instruction 漂移，两个检查各应失败；正常输入应通过。确认 required-check 配置后才声称能阻断合并，否则仅称 CI 检测已接入 |
| P0-3 | 保留 Linux 完整测试，但先复用已有安装矩阵与快检查，新增单个 Linux 全量 job，不把全套测试乘到所有 OS/Node 组合 | `.github/workflows/`；维护者与 PR reviewer | 明确触发范围，覆盖 src/skills/templates/scripts/tests、相关 contracts、依赖与 workflow 自身；现有 skill gate 无 paths 过滤，不能声称“沿用过滤”而漏测。记录实际执行的完整套件及耗时，保留 Windows 检查 |
| P0-5（G6） | 保留场景专用标注。当前 ce-localization schema 的具体 producer 不是缺陷；第二个场景出现后再比较共性 | `docs/contracts/verification/field-validation-protocol.schema.json` 的描述与消费它的契约文档；现场实验 owner | 标注明确适用范围及未验证泛化，description 之外的 schema identity、const、验证语义不变；文档不增加运行时接受范围 |

P0 是可单独承接的小项，不再包括默认指令瘦身（P0-4 已按其启动条件移至 §4.3 作为 G1 受控试点，P0 层保留编号空洞以维持两轮会议的追溯映射，不补位）。是否同 PR 取决于 owner、验证和回退是否一致；同一天完成不是合并成大批次的理由。修订来源说明也可能改变模型输入，是否影响冻结身份仍按 §4.5 判断。

### 4.2 P1：候选折入（16 项，须由主计划 owner 纳入）

| 编号 / 建议窗口 | SDLC 判断与最小改进 | source owner / 消费者 | 验证与失败处理 |
| --- | --- | --- | --- |
| B1 / S3.2 | 安全左移：依赖变化不得仅凭文件名或自动化标题免审。先看实际依赖 diff、来源/完整性变化、安装脚本、运行与开发依赖影响，再决定审查深度；已知漏洞查询只是其中一种事实 | `skills/spec-code-review/SKILL.md`、`skills/spec-work/references/shipping-workflow.md`；review 与 shipping owner。前者是本批明确新增范围，不称为既有同文件修改 | 覆盖纯版本更新、registry/source 改变、安装脚本变化和查询失败；即使零告警，也保留 diff 审查。simplify 与安全 review 的跳过条件分开，不要求对每个锁文件做无意义重构。**提前修复通道**：本条缺口已被行级引证坐实，满足主计划第 2 节直接缺陷通道条件（行级引证 + 覆盖该跳过行为的合同测试）时可提前修复、不等待 S2 基线；修复时保存修改前快照，并以修复后状态登记为后续实验的基线起点（§4.5 第 1 条） |
| B2 / S3.2 | 在副作用发生前检查 secret：复用已安装本地扫描器或项目既有 pre-commit 检查，扫描将被提交的内容 | `skills/spec-commit/SKILL.md`、`skills/spec-commit-push-pr/SKILL.md`；commit owner，属于本批范围扩展 | 工具缺失记录未扫描；命中后暂停对应提交并核实，不在日志输出 secret 原文；**核实为真实 secret 后，先建议并跟进凭据轮换/吊销、并核查其是否已进入历史提交，处置完成前不恢复提交流程**。批次输入须含一次性工具决定：由用户选定一个标准本地扫描器，或明确记录接受纯降级模式，使命中路径验收可执行（当前本仓无已安装扫描器与 pre-commit 检查，缺此决定则每次执行都走降级路径）。无 hook/blocking primitive 时是响亮约定，不宣称所有手工提交也受硬 gate 保护 |
| B4 / S3.3 | 将新依赖尽调放在设计决策处：先检查标准库/现有依赖能否满足，再评估许可、维护状态、来源、已知风险与替换成本 | `skills/spec-plan/references/plan-sections.md` 的 KTD 指引；实现者与 reviewer | 对一个确需引入和一个可复用案例评估，记录缺失事实；不设统一仓库活跃度评分，不把所有依赖都写成大型评审 |
| A1 / S5.4 | 建立稀疏追溯：PR 中集中呈现已有 plan、相关 U-ID/AE、最终验证、review residuals，帮助 reviewer 重建“为何改、改了什么、凭何可用” | `skills/spec-commit-push-pr/` 的 PR 文案 owner 及现有模板；PR reviewer。与 B1/B2 同属窗口 source 范围扩展（见 §6），不能因修改文件相邻视为已立项 | 用有 plan、无 plan、部分验证三类样例核对；路径存在不等于验收完成，无编号不生成伪编号，代码再改后引用必须对应最终版本。依赖 spec-commit-push-pr 现有 PR 文案结构；若其缺少追溯段落，先扩展模板再落地本条，不静默扩大为模板重设计 |
| A2 / S3.3 | 借用 V 模型的配对思想：跨接口、状态或外部副作用时，覆盖组合行为与失败传播；独立的多个单元不因数量大于一而强制系统级测试 | `skills/spec-plan/references/plan-sections.md`；实施与验证 owner | 契约/集成/产品验收按风险选最小充分层级；外部环境不可用时写明替代证据和未验证边界，不能用单测通过冒充端到端验收 |
| A3 / S6 | 明确交付边界：通用 workflow 不拥有部署/运维执行；提供给下游的是带版本、验证和残余风险的候选变更证据 | README 变体、`skills/using-spec-first/`；采用者与下游 CI/CD owner | 表述为建议交接内容，不能声称现有 PR 文案已构成 machine-readable CI/CD contract。绿 PR 不等于已部署/运行健康；项目自身既有 release 工具不因此被否定 |
| C1 / S1 | 测量先定义区间：check 耗时、run 墙钟与人工等待分别命名。先复用确认过的时间戳或实验日志，只有现有记录不足以支持已选指标时才扩展 run summary | `docs/contracts/verification/verification-run-summary*`、`src/cli/helpers/verification-run-summary.js`；S4 实验 owner | 开始缺失、崩溃未结束、重试各自保留未知；不能用 generated_at 当开始时间，不能把 run 耗时命名为 DORA change lead time |
| C2 / S5.3 | 小批次与 WIP：先串行完成一个可验证单元，再按真实独立性增加并行；共享文件/状态、review 积压或集成返工出现时降低并行 | `skills/spec-work/references/execution-strategy.md`；执行 owner | 受控试验沿用 S4 最多两个 agent 的比较边界；不把宿主 slot 数当最优 WIP，不硬编码全项目并行上限，记录等待、冲突和质量而非只数任务 |
| C3 / S1 | 返工观察：先定义什么算独立 review 轮次，用可定位的 review 返回与修改证据计数；直接复用 S4 实验账本，确有日常消费者再扩 run artifact | 既有 run artifact owner 与 S4 实验产物；实验 owner | 零次与未知分开；若新增字段，应允许非负整数而非仅 0/1/2；轮次不能独自代表质量，也不是 DORA deployment rework rate。定义可先行，但 S1 窗口内 S4 账本未产出时结果为不可测，不强行计数 |
| D1 / S1 校准后 | 路由回归分离确定性检查与模型行为评测：复用 R3 的 22 用例来源，保留正例、易混淆、Direct Lane 负例。22 用例的仓库级回归资产以 R3 立项需求为权威来源，本条仅分离无模型检查与行为评测的承接方式，不另建资产、不双轨推进 | R3 现有评测资产、`benchmarks/routing/` 候选入口与 CI；路由维护者。行为 job 的引擎凭证存放、最小权限范围与轮换按宿主标准 CI secret 实践，实施前由 owner 确认 | 普通 PR 跑无模型检查；行为 job 仅在引擎、费用与数据范围已授权时运行。skipped(env) 不作失败样本也不记行为通过，缺必需行为证据不得推广 |
| F1 / 可与 P0 同批先行 | 用“首个可信变更”定义上手终点：安装就绪、一个真实目标、完成变更与验证、交付证据；按任务允许短路径 | README/quickstart 的 source owner；首次使用者 | 从干净隔离环境走一个代表任务，产物可回源；不强制调用全套 workflow，不用 init 成功冒充任务成功。验证纯本地、不消耗 S0-S4 实验链、不在 §4.5 基线保护清单内，无机制理由等 S5.4；原窗口 S5.4 仅指其最终并入的交付体验批次 |
| F3 / S6 | SDLC 词汇映射服务读者理解：说明当前链路覆盖什么、何处交给项目或外部系统 | README 变体；评估者 | 小表区分“能力入口存在”“行为已验证”“现场收益已测”，不以阶段齐全或术语同构声称效果领先 |
| F4 / S5.4 | 宿主限制跟随实际能力证据：复用当前支持矩阵，披露缺失、降级与可用替代路径 | README 与现有 runtime capability catalog 的 source owner；安装者和维护者 | 由 `getSupportedPlatforms()` 核对当前宿主集合，区分版本、发现能力与 gate 强制能力；避免另建会漂移的平行能力表 |
| G3 / S3.3 | 需求变更管理：spec-plan 在真实放弃并替换方向时标旧计划 superseded，记录新计划指针或作废理由；普通需求补充继续原地更新 | `skills/spec-plan/SKILL.md` 与 lifecycle/discovery consumers；plan owner 与 work intake | 新旧文件均可定位且授权覆盖才写；中断时保留可恢复信息。核对旧 task pack 与发现路径不会继续选中旧链；不改 completed 为 active，不把格式转换当业务方向变化 |
| G4 / S3.2 | 维护反馈前移：已确认根因若冲突于上游假设，在 debug handoff 中给 source ref、冲突描述与受影响验收候选 | `skills/spec-debug/` 的 handoff owner；原 plan/requirements owner | 用“实现偏离正确规格”与“规格假设错误”两类案例区分；无可定位上游则记 unknown/not-applicable。字段为 advisory，不自动改原计划或提升根因为 confirmed |
| G13 / S5.4 | 让验证缺口可见：将当前 profile/计划中的期望检查与实际 checks[] 对照，而非只汇总已运行记录 | `skills/spec-work/` closeout、verification profile 与 run-summary consumers；reviewer | 覆盖 profile 缺失、仅部分执行、结果过期。缺记录显示“无执行记录/原因未知”，不虚构 not-run 原因；按实际 check 身份展示，不强制每项任务凑齐 unit/smoke/integration/lint/build |

**B1/B4 的外部查询边界：** 先读取本地依赖差异和已有可信结果。确需联网时，记录目标 registry/provider、将发送的数据和已有授权是否覆盖；权限不足或私有依赖不能外发时，采用获准的内部服务或离线数据，并保留查询缺口。**联网查询统一并入「单独授权的隔离执行」通道执行（与实际安装验证同一通道）；无外发授权时仅用本地 diff 与离线数据。**npm 批量查询失败可能回退为完整依赖树与环境元数据上传，若该范围未获授权就不能直接使用这条回退路径。工具异常、无漏洞和未查询必须区分；不自动调用 `npm audit fix`，也不在审查中执行不可信安装脚本。实际安装验证由单独授权的隔离执行承担。**诚实边界：在隔离执行机制接入之前，上述外发约束只由 skill 文字承载，属于未硬强制约定**——执行审查的 agent 仍可能直接发起 `npm audit` 类查询；B1 落地时须在 skill 文本中显式标注该约定未硬强制及原因，不以文字存在宣称已受机制保护。

**契约迁移边界：** C1、C3、G2 的 owner 与数据模型不同，不再要求共享一次 schema_version。先证明现有数据无法表达，再由 owning schema 定义版本、writer/reader、旧产物缺字段与回退方式；不能因为共享排期就强绑发布。

### 4.3 P2：受控试点（5 项）

| 编号 | SDLC 判断与试点范围 | 消费者、验证与停止条件 |
| --- | --- | --- |
| G1（原 P0-4） | 风险驱动的指令消融。先由 S2 保存当前指令、引用、模型和任务身份，并采集修改前基线；S3 在候选快照内对具体冗余教学做删减，保留权限、验证、source/runtime、handoff 与知识边界。**S2 基线保存时须按权限、验证、source/runtime、handoff、知识五类边界建立受保护指令片段清单；候选快照必须通过确定性 diff 检查（受保护片段逐字保留）方可进入行为比较，不允许以语义自觉替代该校验** | S3 source owner 与 S4 实验 owner 消费。分别看结构、行为、成本、现场结果；反例场景覆盖任务正确性、路由、未授权副作用、虚假完成，以及 source/runtime 边界（误改 generated runtime mirror）与 handoff 边界（跨上下文 artifact 缺摘要/source refs）两类边界回归——前四类探不出边界指令被误删，边界回归由确定性 diff 与专用反例共同拦截。以主计划既有准入、阈值和预算判定；退化则恢复对应候选片段。只有同条件结果支持时才调整默认加载，不能用 Sonnet 5 的旧五任务结果代替 Astra/其他宿主验证。**有界兜底**：若 S2 在 90 天内未启动或付费授权持续不可得，允许按原饱和实验模式做一次预注册、限额（≤$50）的独立复现；其结果仅作候选证据，不替代主计划比较，不据此单独调整默认加载。**2026-09-08 状态注记**：主计划 S2 替代模型（GLM-5.3）基线已采集（两比较对 admit+A/A+allow-ab、135 cells，仅替代模型范围，Astra 未验证），S3 goal 修订候选已落地（AGENTS.md/CLAUDE.md 净 +6 行「任务授权与完成责任」，属补强非消融）——G1 消融的基线前提在替代模型范围已就绪，启动前仅须核对该基线是否覆盖五类受保护边界片段清单，未覆盖则补登记；有界兜底仅在替代模型范围亦停滞时适用 |
| G2 | 首期限定“独立且可定位的上游 requirements 文档”。试验 `origin_body_hash` advisory；由确定性工具读取约定正文区域并算 hash，LLM 判断变化是否影响规划。统一原地文档与无 origin 的直接规划不强加该字段 | spec-plan/work intake 消费。在试点前明确正文提取、编码/换行规则与刷新 owner；覆盖不变、正文变更、元数据变化、文件丢失和旧 plan 无 hash。漂移只给事实，不自动作废或更新 hash。若要覆盖统一文档，另评估 Product Contract 区域快照；不能通过整篇自引用 hash 制造每次 planning 更新都漂移。**停止条件**：试点窗口内找不到活的 plan↔独立上游链、或未发生一次真实 drift 判断影响 planning 决策，即停止并保留一次性结论；首批可用的活链为 `docs/plans/2026-09-03-001`（R3 需求）与其首个下游 plan（当前近两月新计划中仅此一处 origin 指向仍存在的独立需求文档，其余 origin 多指向已删除目录） |
| G7 | 将“验收可测性 lint”缩为显式引用完整性试点。脚本只解析已声明的 check/AE/source 引用并报告缺失或悬空，不用关键词判定任意自然语言句子是否可测 | 一个 workflow 的文档 reviewer 消费。先用真实验收条款人工回源对照误报与遗漏；可测性仍由 reviewer 判断。若只产生格式告警、不改变验收决策，停止建设；不强制所有 prose 加机器标记 |
| G8 | 一次性知识引用体检：用结构化 frontmatter parser 读 source_refs，区分仓内路径、版本引用、URL 和无法解析项；文件消失只标引用异常，文件存在也不证明知识有效 | `spec-compound-refresh` owner 消费报告，对真实被消费的知识优先语义复核。分母列出可检查引用与排除项，不把无 source_refs 当零失效。盘点前声明样本与判定口径；只在发现反复影响任务的悬空引用且误报可控时考虑常态化，否则保留一次性结果 |
| G9 | 先核验节奏数据是否存在。现有 run-state 没有定义完整的 stop_if 打回/Direct Lane 重路由事件，不能直接计算全局比例；首期只盘点可定位事件、时间戳和分母覆盖 | S1 测量 owner 消费。缺事件类型或分母时结果为不可测，不是 0 或低发生率；可与 S4 已授权任务样本做前瞻性观察，范围、记录方式与成本先写入实验设计。无具体决策消费者则停止，不新增全链路 telemetry |

### 4.4 P3：暂缓与重估条件（6 项）

| 编号 | 当前判断 | 激活条件与最小路径 |
| --- | --- | --- |
| D3 | 自投射幂等值得验证，但 `init -y/--yes` 已存在，“缺非交互模式”不是阻塞。现有 mirror 多被 Git 忽略，`git diff` 不是充分 oracle | 发生实际生成回归或既有 lifecycle 测试留有明确缺口时，先补隔离 fixture：使用临时用户目录和显式 host，连跑两次，对 managed 文件内容、成员集合及有契约依据的易变字段比较；不在本仓 live runtime 上试验。证明增量价值后才加 CI。**触发信号面**：init 输出错误与 lifecycle 测试缺口当前无自动检测（P0-2 的 CI 漂移检查不覆盖投射幂等），依赖用户/issue 报告；无报告来源时按日历重估（季度），不默认「未触发=不存在」 |
| D4 | 暂不把完整 `doctor --json` 塞进 SessionStart。现有 Codex hook 的 startup-reminder 有 2500 ms 进程预算，不能据此推断完整诊断适合启动路径 | 有真实 drift 漏发现案例时先测延迟和副作用；优先复用本地轻量/缓存事实，注明 freshness、超时与 unavailable。宿主不支持 hook 时给显式 doctor 路径；超时不能显示健康，不新增联网扫描。**触发信号面**：doctor 失败记录或支持渠道中的 drift 案例；无来源时按日历重估（季度），不默认「未触发=不存在」 |
| F2 | 对外评估包等待内部任务与数据授权就绪；公开可复现样例本身不等于夸大宣传 | S4 有可分享且脱敏的完整探索性任务后，发布输入、环境、实际结果和限制；探索性结果只能供复现，不能包装成普遍收益或生产验收 |
| G5 | 暂不新增专门的 productSmoke 类型。先确认现有自定义 check id 与 command/runner 映射是否足以承载产品验收 | 真实消费者确实缺乏必要表达能力时，先给复现样例与最小扩展，再确定 schema bump、writer/reader 与旧版本策略；“下次 bump”不是建设触发器 |
| G10 | 保留 HTML 不携带 lifecycle 的显式边界 | HTML 实际进入依赖 lifecycle 的执行流程时，优先用已有 Markdown canonical 转换并保留原件；确需扩 HTML 才设计 producer/consumer 一致性，不为格式对称建设 |
| G11 | 不建无消费者的健康指标面板；工具调用计数也不能直接证明知识被正确复用 | G9/S4 的具体裁决确需缺失指标时，先定义事件、分母、隐私和保存范围，再选最少本地数据；工具读记录仅证明读取，知识价值仍需影响决策与结果的证据 |

### 4.5 排序与基线保护

本节解释如何接入主计划，不建立新的实验出口条件。

1. 先按主计划 S0/S1 确定候选范围、source owner、测量器与预算；S2 保存修改前身份并取得对应基线，S3 产生候选。G1 与 B1/B2/B4/A2/G2/G3/G4/G13 一样，不得在原始基线保存前改掉待比较的行为（A2 与 B4/G3 同改 `plan-sections.md` 且同归 S3.3，不例外）。**唯一例外是 B1 的直接缺陷通道**：缺口已被行级引证坐实并满足主计划第 2 节条件时，按 §4.2 B1 行提前修复，保存修改前快照并以修复后状态登记为基线起点——基线保护的是可比较性，不是不许修已证实的缺陷。
2. 测量脚本和候选产品指令分别冻结。S1 可准备数据口径、测试 fixture 与采集工具，不能借 schema 变更提前改 workflow 行为；实际行为比较沿用主计划 §5.3 的逐比较对准入与重新采集规则。
3. P0 可独立承接，但不是永久基线豁免项。若修改的治理文档、SECURITY 文案或 CI 环境属于已冻结输入，须保留旧快照并按主计划决定新的实验身份；不将“docs-only”等同“行为无影响”。
4. B1 与 G4 建议归 S3.2，G3/A2/B4/G2 的 workflow 候选归 S3.3；G13/D4 归 S5.4 的候选窗口；F1 可与 P0 同批先行（纯本地验证，不进基线保护清单）。S5 仍按主计划要求先保护受影响行为再改写，无须把所有后续条目挤入 S3。
5. 若只完成本地冻结、目标模型未运行，可按主计划准备候选，仍标行为基线未完成。收费、外发、runtime 投射与推广分别依已有授权和证据执行；本方案不补写授权或通过状态。
6. **净方向约束**：在 G1 试点得出结论之前，S3.2/S3.3/S5 各批次收口时，受影响 skill 的指令行数与流程步骤数不得净增长（以批次收口时的确定性 diff 统计为准）；超出的新增项顺延到 G1 删减兑现之后同批配对交付。本约束回应 §1.2 净过程账：新增走批次验证、删减需对照实验的不对称，会使指令语料在本方案执行后默认净膨胀，与主题方向相反。
---

## 5. 非目标（明确不做）

- 集中式追溯矩阵工具/数据库（链已由 R/U-ID + run summary 承载，PR 外显即够）。
- 部署/CD 执行能力（CI 工具已商品化，spec-first 增量在 plan-time 决策）。
- 全量计划强制风险评分模板（depth 分级 + trigger matrix 已实现风险驱动，全量模板是仪式化）。
- 通用安全扫描平台、把漏洞语义判断脚本化（security-reviewer persona 已承担语义层）。
- 为 8 宿主各写 secret-scanning hook、把扫描塞 SessionStart（pre-commit/secret 生态已商品化；hook 预算留给治理注入）。
- 新增第六类硬 gate 或日常安全状态机（日常安全 gate 是既有 mutation/verification 出口的窄扩展）。
- 全链路 telemetry/耗时面板、回传式遥测（侵入性违背 light contract 与信任定位）。
- DoD 完成语义脚本化校验、强制看板/任务状态机（完成漂移是语义判断；状态机是明确反目标）。
- README 出现「提效 X%」类数字（S4 三组证据未产出，击穿 claim ceiling）。
- 自建 CI 编排/通用监督 runner（新增自动化一律「已有确定性脚本 + Actions step」）。
- G12：拒绝以 LLM 自报 reuse_log 作为知识复用成效证据，也不在每次检索时回写 knowledge frontmatter。确定性读取计数只能证明访问；若要衡量复用价值，应另看它如何改变决策和经过验证的结果，不能用 G11 的计数直接替代。
- 全局强制 R-ID/U-ID 编号完备（低风险短路径的仪式负担；「编号完备」会被误当作「追溯完备」的伪证据）。
- knowledge 消费硬 gate（强制每次 plan 前检索 solutions）：违反 gate the exits；spec-compound 的 Discoverability Check 已论证 imperative directives 导致 redundant reads。

---

## 6. 与现行 S0-S6 计划的关系

本方案提供候选优先级和采用理由；`docs/plans/2026-09-05-002-next-phase-development-sequence.md` 继续拥有批次结构、依赖链与验收出口。其 S3.2 的 source 是 debug/work/shipping，S3.3 是 plan；本方案已纠正此前 G3/G4 的错配。

主计划 owner 选定候选后，将实际新增 source、验证与回退并入对应实施输入，再开始产品修改。尤其 B1 的 code-review、B2 的 commit helpers、A1 的 spec-commit-push-pr PR 文案都是对应窗口的扩展范围，不能只因修改文件相邻就视为已立项。G1 的收益验证已与 S2/S3/S4、OPT-10 消融方向重叠，不再另立“执行债”绕开这条链路（其 90 天兜底复现路径见 §4.3 G1 行）。

**采纳顺序按证据加权**：主计划 owner 分诊 16 项 P1 时，按 §1.2 的证据等级排序——结构缺口 + 直接缩短等待项优先（B1、A1、F1、F4、G3、G13、C1、D1），理论适配项（B4、A2、C2、C3、G4）可随批顺延而不阻塞前者；容量受限时收缩理论适配项，不为凑齐批次整包接受。

**重估触发**：主计划对应 S 窗口关闭，或本方案定稿后超过 90 天仍无任何候选被启动采纳时，由文档 owner 重新基线化候选清单并记录决定（继续采纳、收缩或作废），不静默搁置——16 项 P1 与 5 项 P2 的价值全部依赖主计划队列被执行，主计划 WIP 上限为 2 且窗口已排有 12 个 OPT 与 33 个 F 映射，无重估触发的等待即静默腐烂。90 天时钟基点为本文定稿（2026-09-07）；2026-09-08 主计划已在执行（S1 路由测量器修复完成、S2 替代模型基线已采集、S3 goal 修订候选已落地、S4 替代模型内部对照已记录，主宿主旅程未执行），窗口推进中，重估条件未被触发。

方案中的最小验证描述供实施 owner 选用；正式接受的要求只在主计划或其有来源关系的实施输入维护一次。本轮未修改主计划，未建立第二套关闭条件。

source 变更落在 `skills/`、`templates/`、`src/cli/`、contracts 或指定文档；受管 AGENTS.md 由 CLAUDE.md source slice 同步。`.agents/skills/` 等 runtime mirror 只作生成结果，实际需投射时用 `spec-first init`，并验证受影响宿主的保真或降级，不手改 mirror。

---

## 7. 最小落地组合与顺序

1. **先收口已确定的事实与反馈**：P0-1/P0-5 文档范围单独验证；P0-2 快检查优先，P0-3 完整 Linux 测试随后接入并记录时延，不承诺未经测量的“分钟级完成”。
2. **准备可比较的证据**：S1 处理 C1/C3/D1 的最小测量输入；G8/G9 可做独立只读盘点。它们不要求全链路遥测，也不互为强依赖。
3. **先基线，后候选**：S2 保存旧指令和受保护场景；S3.2 优先 B1 的依赖免审盲区及 G4 根因反馈，S3.3 处理 G3/A2/B4。G1 只选择有具体冗余证据的片段，按 source owner 归入相应候选，避免整包指令一次删减。
4. **按问题启动试点**：G2 先验证独立上游路径；G7 先验证显式引用诊断是否改变验收判断。没有实际收益或证据不足则收缩、停止或保留未完成，不为凑齐 SDLC 阶段继续建设。
5. **再外显价值**：S5 做 C2/A1/G13/F4 的执行与交付体验；S6 做 A3/F3 边界表达。F1 不在此列——其验证纯本地、不消耗实验链，**可与 P0 同批先行承接**（新用户采纳闸门不等待全链结束）。暂缓项只在各自触发条件满足时评估（信号面见 §4.4），不自动随版本升级启动。

---

## 8. 验证与诚实边界

**证据层级**：§1 的当前 source 核对支持结构与工具行为判断；§1.1 的公开资料支持原则取舍；历史会议与 benchmark 报告保留其原始适用范围。历史报告不是本轮重跑结果，专家数量不是独立结果验证。

**论题观测锚点**：本方案优化的具体等待是「任务完成到可信 review/交付的等待」（含新用户首个可信变更）。判据由 C1 的「人工等待」口径承载：S1 在非实验运行上同步建立当前基线，作为论题成立与否的观测锚点；无该锚点时，实验链跑通不等于论题被验证，32 项全部「完成」也不能证明等待被缩短。S1/S4 的三组对照服务指令实验，不评估 32 项各自或整体对用户感知等待的影响。

工作树存在其他任务的并行修改，本轮保留其内容；上述 source 证据是读取时观察，不是已提交的冻结基线。实际实施与实验准入前仍需重读 owning source 并保存可恢复快照。

**第二轮深化已执行**（本文 §1-§7 中「本轮」默认指此轮）：在当前会话逐项复核 32 项，修订本文及 CHANGELOG；读取所列公开来源和 owning source，核对原审查六项问题以及新增的非交互 init、启动预算、验证期望集和统计口径问题。文档检查覆盖提案唯一去向、数量、repo-relative 文件引用、Markdown/YAML 基本结构与 diff 空白；不以这些检查证明提案已经有效。

**第三轮评审修订已执行**（2026-09-07，`revised` 日期）：6 个独立只读 reviewer agent（coherence、feasibility、product-lens、security-lens、scope-guardian、adversarial）对本文做多视角评审，18 项发现（0 项 P0 阻断、8 项 P1、5 项 P2、5 项 FYI）全部附行级引证并回源核对——**方案对代码库的全部具体声称（trivial-PR 免审文案、vendor/ 失效引用、4 条 workflow 现状、init -y、schema 字段现状、S3.2/S3.3 归属）经 feasibility reviewer 逐项核实属实，无一被推翻**。本轮修订按其结论执行：G1 价值定位与承接顺序语义（结论先行、§4 导言）、净过程账与证据等级（§1.2）、B1 提前修复通道（§4.2/§4.5）、B2 轮换处置与工具决定（§4.2）、外发边界并入隔离执行通道并标注未硬强制（§4.2 边界段）、G1 五类边界清单+确定性 diff 校验+90 天有界兜底（§4.3）、G2 停止条件与活链（§4.3）、D3/D4 触发信号面（§4.4）、A2 入冻结清单与净方向约束（§4.5）、A1 披露/证据加权/90 天重估触发（§6）、F1 提前（§4.2/§4.5/§7）、论题观测锚点与本记录（§8）、谱系算术与 P0 编号空洞说明（§4）、会议记录措辞消歧（§9）。cross-model 外部模型评审因准入门槛（无 journey receipt 与外部 provider 授权）未运行，不声称独立跨模型覆盖。

**两轮均未执行**：未修改产品代码、skill、schema、CI 或 generated runtime，未运行产品测试、模型行为评测、依赖扫描、知识盘点、现场试验或 runtime 投射。G1/G2/G7/G8/G9 仍是未执行试点，任何假设、字段或检查都未因此成为当前运行时能力。

**2026-09-08 第四轮代码核对**（结合 HEAD `b557f8bc`，评审后出现 5 个新提交且工作树已清洁）：方案全部代码声称逐项重验——**仍成立**：B1 双锚点（`spec-code-review/SKILL.md:348`、`shipping-workflow.md:62,72` 行号精确）、vendor/ 不存在、4 条 workflow 均无 shared-references/instructions 接入且 `npm test` 全量仅 windows runner、CI 无 routing job、`init -y/--yes` 仍在（解析移至 `init-args.js`）、run summary 仍只有 `generated_at`、field-validation schema 未变且无 description 字段、session-store 无 stop_if/重路由事件、spec-plan 的 supersede 责任缺口未被后续 SKILL.md 修订触及、R3 22 用例与 codex hook 2500ms、G2 活链、B2 扫描器空前提、饱和报告数字（+51%/+59%、45 次运行）、WIP 2、12 OPT + 33 F 计数精确。**漂移已修**：AGENTS.md vendor 引用行号 158→164（S3 候选落地所致，§1 已更新）。**前提变化已注记**（§4.3 G1、§6）：主计划于 2026-09-08 大幅推进（S1 完成、S2 替代模型基线采集、S3 goal 修订候选落地、S4 替代模型内部对照记录），其中 S3 落地为指令**净增** +6 行（补强授权边界，非消融），与 §1.2 净膨胀判断的方向一致；G1 的消融删减仍未执行，36166 行指令警告仍在。本轮核对未修改产品代码，仅更新本文三处状态注记与本记录。

**后续验证归属**：确定性检查证明来源、结构和工具结果；fresh-source 行为验证检查候选是否保留授权与完成边界；S4 才评估真实任务的质量、成本与返工。引用 `docs/solutions/workflow-issues/skill-prose-rewrite-contract-test-coverage-2026-06-28.md` 的限制：源码字符串检查通过不等于新行为已验证。没有可强制的 primitive 时，相关约定必须明确标为未硬强制。

---

## 9. 会议记录

以下保留两轮原会议的参与和裁决追溯，不是本轮新增的独立评审。历史数量与排期不覆盖 §4 的当前决定；尤其原“G1 冻结前执行”和“C1/C3 强绑一次 schema”结论已由本轮回源修订。

### 第一轮（SDLC 理论镜子）

- **输入**：SDLC 调研结论 digest（会话 `sess_d155bfbc`）+ 项目现状 digest（角色契约、S0-S6 计划、CHANGELOG、skill 面）。
- **参与者**：SDLC 流程建模专家、DevSecOps/供应链安全专家、敏捷流动效率专家、平台工程与自动化专家、开发者体验与采纳专家（第一轮并行独立分析）；红队守门员（第一轮会议内第二阶段逐项裁决，非本文他处所指的第二轮会议）；会议主席（综合与本方案署名）。
- **裁决统计**：19 项提案 → adopt-now 3 项、fold 14 项、defer-with-trigger 2 项、reject 0 项。
- **已裁决的专家间张力**：① B2 commit 出口成立（属 mutation gate 延伸）而 session-start 扫描位置不成立；② B2 与 A1 不强行同批（分属 S3.2/S5.4，同窗口时共享一次 fresh-source 验证即可）；③ C1/C3 必须合并进 S1 的同一次 schema_version 变更。

### 第二轮（设计哲学一致性审计）

- **输入**：角色契约 v3.4 + AGENTS.md 治理基线 + skills/contracts/plans/solutions/CHANGELOG 抽查；会议主题「结合 SDLC 思想，spec-first 的设计哲学规范需要优化吗」。
- **参与者**：SDLC 生命周期专家、质量工程专家、需求工程专家、反馈闭环/知识管理专家（并行独立分析）；仲裁者兼 Devil's Advocate（按契约第 4 节演化判断逐项裁决并回源证据）；会议主席（综合与本文署名）。
- **裁决统计**：14 项提案 → 立即执行 6 项、Experiment/一次性分析 4 项、Defer 3 项、拒绝 1 项。
- **G 编号映射**：G1←K（saturation 兑现）、G2←A（origin hash）、G3←B（supersede owner）、G4←C（debug 回查）、G5←E（productSmoke）、G6←F（pilot 标注）、G7←G（可测性 lint）、G8←I（source_refs 盘点）、G9←M（run-state 分析）、G10←N（HTML，挂起）、G11←L（健康指标，挂起）、G12←J（reuse_log，拒绝）、G13←H（closeout 形状）；D（CI/CD 边界声明）与第一轮 A3 收敛合并。
- **已裁决的专家间张力**：① J 被拒绝——LLM 自报复用留痕违反证据原则，复用测量由确定性计数承接；② E 的「DoD 验收语句二分」子项被砍——无消费者的分类学；③ N 的「自违反」指控被回源驳回——降级已有显式声明，「修复」实为边缘路径造机制；④ L 挂起而非建设——无 pending decision 消费的健康指标是能力囤积；⑤ G1 判全场第一优先但受 §4.5 约束二约束——执行债的紧迫性不豁免基线保护。
