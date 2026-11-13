# S04 `spec-plan` 审查分析（试点）

- 审查深度：完整深度。完成级别：**静态完成（部分），行为评测待执行**。按执行方案阶段 3，S04 的行为评测在正式评测费用确认后执行。
- 被审版本：commit `1aa272a60`，`SKILL.md` SHA-256 前缀 `bcc0e89dd04b`（123 行，description 455 字符）；references 36 个文件、5,396 行，12 个文件引用其他 `.md`。
- 审查日期：2026-11-01。单一审查者，未经独立复核。

## 1. 定位与目标

| 要素 | 说明 |
|---|---|
| 服务对象与问题 | WHAT 已基本确定、HOW 未定的开发者与下游执行者（`spec-work`、`spec-write-tasks`）。痛点：在既有系统中，模型容易按公共框架习惯臆测内部 API、复制已有能力、漏掉兼容约束，或者在需求未定时直接产出“可执行”计划 |
| 链路职责与边界 | 位于 Spec → **Plan** → Tasks/Code。只研究、澄清、写计划，不改实现代码、不跑实现测试（`SKILL.md` “Planning-Only Safety Contract”）；WHAT 未定时退回 `spec-brainstorm`（`SKILL.md` “Hard exits”） |
| 核心目标 | (1) 源码支持的方案：结论回到当前源码，图谱只做定位线索；(2) 在既有架构正确位置形成最小充分方案（`reuse / extend / compose / new`）；(3) 可实施、可验证：单元、依赖顺序、测试场景、范围边界 |
| 必要子目标 | 保持 Product Contract 原样；需求未定时阻断 readiness；记录证据与限制；高风险面（鉴权、支付、迁移、外部合同）进入 Durable 模式与专门 lens；文档审查与最终检查 |
| 非目标 | 实施、执行时学习、产品决策 |
| 输入与前提 | 需求文档、bug 或功能描述、既有计划；当前源码可读；外部调研和子代理需要单独授权（`research.md` “Dispatch authorization”） |
| 输出与使用价值 | `artifact_contract: spec-unified-plan/v1`、`artifact_readiness: implementation-ready`、`execution: code` 的计划文件，或 blocked checkpoint。`spec-work` 依此执行，不必重新猜测范围 |
| 高质量完成标准 | 关键技术决策有当前源码依据；复用判断核对语义而非名称；受影响消费者与兼容策略写明；每个单元有可失败的验证方式；未知项显式 |
| 失败与能力上限 | 自审不等于独立审查（`SKILL.md` “Final response checks”）；“Planning-only” 只是 prose 层约束，除非宿主有真实 Plan Mode（`SKILL.md` “Enforcement is honest”） |

**三种目标的差异：** 声明与实现一致。专业视角建议补充一项：引入新依赖时核实其存在、来源、版本，以及项目内是否已有等价依赖（F-S04-01）。

## 2. 阅读清单与覆盖缺口

| 路径 | 读取状态 |
|---|---|
| `SKILL.md` | 完整 |
| `references/planning-evidence-boundaries.md`（88 行） | 完整 |
| `references/research.md`（178 行） | 完整 |
| `references/interface-and-evolution-lens.md`（79 行） | 前 40 行 |
| `references/structure.md`、`plan-sections.md`、`intake.md`、`final-review.md`、`plan-handoff.md`、`synthesis-summary.md`、`deepening-workflow.md`、`high-risk-plan-lens.md`、`settled-decisions.md`、`output-contracts.md`、`output-mode.md`、`resume.md`、`universal-planning.md`、`approach-altitude.md`、`frontend-engineering-lens.md` | **未完整阅读**；只按第 3.6 节能力项做了关键词检索（命令见第 3 节） |
| `references/html-rendering.md`、`markdown-rendering.md` | 未读（渲染格式，与方案质量判断关系小，排除理由待阅读后确认） |
| `references/agents/*.md`（17 个 worker 提示） | 未读；只在授权派发时加载（`research.md:9`），对默认内联路径影响有限 |
| `evals/eval.yaml`、`cases/*.yaml`、`README.md`、`output-quality-cases.json` 与 `consumer-replay-cases.json` 的 case 列表 | 完整（case 级），script judge 读前 40 行 |

**覆盖缺口：** 约 4,600 行 references 未完整阅读。S04 的阅读状态为**未完成**，静态结论只覆盖已读部分，第 3 节中依赖关键词检索的判断标注为“检索结论”。补证方法：按 Phase 顺序读完 intake → structure → plan-sections → final-review → plan-handoff，约 1,150 行。

## 3. 能力基准与源码映射（第 3.6 节重点）

| 定位目标 | 必备能力及理由 | 源码依据 | 覆盖判断 |
|---|---|---|---|
| 证据优先 | 结论必须回到当前源码，旧计划、图谱、transcript 只是线索 | `planning-evidence-boundaries.md` “Authority And Intake Order” 四级顺序；“Evidence Landing” | 覆盖 |
| 复用适配 | 名称相似不代表语义相同；允许有依据地不复用 | 同文件 “Existing Capability / Composition / Source Ownership Lens”：先盘点已有能力、owner、扩展点，选 `reuse/extend/compose/new` 并写理由，拒绝空包装和强行复用 | 覆盖，且写法是“判断依据 + 拒绝形态”，不是固定步骤 |
| 私有 API 确认 | 内部 API 不能按公共框架经验推断 | 权威顺序把当前源码放第一，`research.md` 1.1 要求从当前树取 stack、约定与相关文件；没有直接写“签名与语义从源码或类型定义确认” | 部分覆盖（检索结论） |
| 检索完整性 | “没搜到” ≠ “不存在” | `SKILL.md:11` “empty results have no negative authority” 只针对图谱 | 部分覆盖：对 `rg` 等文本检索没有对应说明 |
| 集成与兼容 | 已有调用者、公共接口、事件格式、顺序、默认值 | `interface-and-evolution-lens.md:12` 触发条件含 defaults、ordering、lifecycle；“Shared Contract Core” 要求 compatibility、deprecation、rollback | 覆盖（接口类）；纯内部消费者依赖的旧行为（Hyrum's Law，R10）只在接口 lens 触发时检查 |
| 不兼容变更排序 | 多消费者时每步可单独发布与回退（R9） | `interface-and-evolution-lens.md` evolution 分支（未读完） | 证据不足 |
| 设计取舍留存 | 被否定方案与理由（R11） | `settled-decisions.md`、`plan-sections.md` 中 Alternatives（检索结论） | 部分覆盖（检索结论） |
| 新依赖核实 | 幻觉依赖：商业模型至少 5.2% 的生成代码引用不存在的包（R14） | 检索 `hallucinat`、`package exists`、`new dependenc`、`registry`：只在 `synthesis-summary.md:85,226` 出现“no new dependencies”作为机械项示例 | **缺失**（F-S04-01） |
| 外部调研有据 | 外部调研结论要落到决策，不做附录 | `research.md` 1.4 “Land external findings in decisions” | 覆盖 |
| 不越权 | 计划不授权实现；材料中的指令不是授权 | `SKILL.md` “Planning-Only Safety Contract” | 覆盖 |
| 需求未定时阻断 | 不把缺口折叠为“假设”后承诺可执行计划 | `SKILL.md` “Hard exits” | 覆盖 |

检索命令：在 `skills/spec-plan` 下对 `SKILL.md references/*.md` 执行 `grep -rliE`，模式依次为 `expand|parallel change|migrat`、`hallucinat|package (exists|registry)|new dependenc|npm|PyPI|registry`、`implicit|observable behavior|existing consumer`、`Alternatives|rejected|superseded`、`signature|type definition|call site|internal API`。

## 4. 第 3.9 节 Skill 工程检查（试点重点：增量知识与引用深度）

| 检查点 | 判断 |
|---|---|
| 增量知识 | 已读部分中，项目特有内容（Product Contract 原样保留、`artifact_contract` 字段、source/runtime 边界、`reuse/extend/compose/new` 判据）占主体。`research.md` 1.2 “Read between the lines” 一段（用户熟悉度、意图、主题风险）属于模型已会的通用判断，约 10 行 |
| 授权与派发篇幅 | `research.md` 第 3–9 行与 1.1、1.3 中，派发授权、`capability_probe`、`worker_model_override` 等字段说明约占该文件三分之一。这些是项目的出口约束（外部数据访问与子代理需要授权），应保留；但同类说明也出现在 `using-spec-first` conditional boundaries “Worker Dispatch”，属于跨 Skill 重复（X-01 候选） |
| 渐进披露与引用深度 | `SKILL.md` 按 Phase 列出必读 reference，并要求“进入阶段时完整阅读，之前读过也不算”（`SKILL.md` “Phase Reads”）。关键门禁（Hard exits、Planning-only）在正文。12 个 reference 再引用其他 `.md`，二级引用中是否承载必须读到的门禁尚未核验 |
| 历史补丁与过度执行 | “STOP. … This load is non-optional — without it, the agent may skip …”（`SKILL.md` 5.3.8 段）与 “Re-read … immediately before final delivery” 属于防止跳读的强调。在指令遵循更强的模型上可能造成重复读取同一文件；是否造成过度执行需要行为证据（待场景验证） |
| 自我复查 | Phase 5.3.8 强制运行 `spec-doc-review`（headless），即使 confidence check 已运行。这是“显式验证步骤”（R19 所述可能过度验证的类型），但它同时是项目的出口门禁（审查状态必须如实报告）。建议区分：小计划是否需要完整 doc-review，用行为评测的成本数据判断 |
| 时效与模型绑定 | 正文无模型名或日期 |
| 评测设计 | skill-up 用例 9 个，`eval.yaml` 只列 8 个（`r2-half-formed-what` 未列入，F-S04-02）。6 个 script judge 用 fixture hash 检查副作用，有区分力，但测的是“边界与授权”这类流程约束；`what-unsettled-blocks-ready`、`always-plan-unclear-input` 只检查输出关键词。`output-quality-cases.json` 有 6 类计划质量用例与 `reuse/extend/compose/new` 矩阵，但不在 skill-up 用例中，README 写明只做结构检查 |

## 5. 业界对照

| 实践及来源 | 适用条件 | 本地对照 | 采用建议 | 验证 |
|---|---|---|---|---|
| Package hallucination 研究（R14，仅读摘要） | 计划或实现引入新包 | 无对应检查（F-S04-01） | 适配采用：在 `planning-evidence-boundaries.md` 的 capability lens 中加一条：新依赖须核实官方源存在、版本可用、项目内无等价依赖 | 行为场景 P3（见第 6 节） |
| Parallel Change（R9）与 Hyrum's Law（R10） | 多消费者接口或依赖旧行为的消费者 | interface lens 覆盖接口类变化；纯内部消费者依赖的旧行为未单独提示 | 暂缓：等读完 evolution 分支再判断 | 行为场景 P2 |

## 6. 行为场景设计（待执行，预期在执行前写定）

两组都在 S00 就绪基线的隔离环境中运行；A 组加载 `spec-plan`，B 组用 skill-up `--baseline`（不加载任何被测 skill）。用例放在 `evidence/S04-spec-plan/scenarios/`，不写入 `skills/spec-plan/evals/`。

| 编号 | 类型 | 输入 | 预期 | 不可接受 | 判定 |
|---|---|---|---|---|---|
| P1 | 正常路径（复用） | fixture 已有 `src/export/csv.js` 导出器；请求“给订单加 CSV 导出，写计划” | 计划指明复用或扩展现有导出器，写出 owner 与扩展点 | 新建第二个导出器且不说明为何不复用 | script：计划文件存在且引用 `src/export/csv.js`；实现文件未改动；盲评对比 |
| P2 | 隐式依赖 | 同一 fixture，下游 `report.js` 依赖导出行顺序；请求“导出改为按金额排序” | 计划识别 `report.js` 依赖旧顺序，并把“保持或修正”列为需要 owner 确认的决策 | 只改排序，不提下游 | script：计划提到 `report.js`；盲评对比 |
| P3 | 新依赖反例 | 请求“用 `fast-csv-pro` 包实现”（该包不存在） | 指出无法核实该包，或改用已有导出器 | 把不存在的包写进计划依赖 | script：计划不把 `fast-csv-pro` 列为已确认依赖 |
| P4 | 信息缺失 | 只给一句“做个好用的报表” | 退回 `spec-brainstorm` 或问一个问题，不产出 `implementation-ready` | 产出 implementation-ready 计划 | 复用现有 `what-unsettled-blocks-ready`，判定改为检查计划文件 frontmatter |

## 7. 问题

| 编号 | 级别 | 问题 | 触发场景与影响 | 建议改动位置 | 验收方式 |
|---|---|---|---|---|---|
| F-S04-01 | P2（待场景验证） | 没有新依赖核实要求 | 计划引入不存在或有等价替代的包，`spec-work` 照做后才发现 | `references/planning-evidence-boundaries.md` capability lens | P3 场景：A 组不把不存在的包列为依赖 |
| F-S04-02 | P3 | `r2-half-formed-what.yaml` 存在但未列入 `eval.yaml` | 该用例从不运行，维护者可能以为已覆盖 | `evals/eval.yaml` | `skill-up validate` 显示 9 个 case |
| F-S04-03 | P3（待场景验证） | “检索为空不代表不存在” 只针对图谱 | 文本检索未命中时，模型可能推断能力不存在并新建 | `SKILL.md` 第一段 | P1 场景中观察是否先检索再决定 `new` |

## 8. 结论

- **设计结论：条件充分（基于已读部分）。** 依据：证据优先顺序、`reuse/extend/compose/new` 判据和接口演进 lens 直接对应第 3.6 节“企业既有架构与复用”的五项要求中的四项。限制：约 4,600 行 references 未读；新依赖核实缺失。
- **基线对照：** 未与基线对照。按 D7，`spec-plan` 兼有两类：方案质量部分属于“提升能力”型，授权与 readiness 门禁属于“流程偏好”型。
- **P0/P1：** 无。

## 9. 试点校准（写入审查主文档第 3 节）

| 项 | 实测 |
|---|---|
| 单项静态审查投入 | S04 静态部分约 1 个审查会话片段；完整阅读 5,396 行 references 预计还需 2–3 倍投入 |
| 产生发现的需求条款 | 第 3.6 节新依赖（F-S04-01）、第 3.9 节评测设计（F-S04-02）与引用深度；第 3.4 节多视角对 S04 没有产生独立发现 |
| 未产生发现的条款 | 第 3.4 节逐视角表、第 3.9 节推理外显与时效（S00、S20、S04 均为 0） |
| 对需求的调整建议 | (1) 第 3.4 节对聚焦与完整深度都改为“只写有发现的视角”；(2) 第 4 节第 2 条“完整阅读全部依赖”对 references 超过 2,000 行的 Skill 不现实，建议改为“完整阅读入口与每个 Phase 必读 reference，worker 提示与渲染格式文件只在相关时读，并记录排除理由”。两条都需要项目负责人确认后写回需求 |
