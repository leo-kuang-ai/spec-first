---
artifact_contract: spec-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: spec-brainstorm
status: active
execution: code
---

# AI 开发知识层与过程合同层优化 - Plan

## Goal Capsule

- **objective**: 让 AI 在存量项目中的开发满足两个闭环——知识闭环（开局带项目记忆，且知识只含 AI 不知道的内容）与过程闭环（条件可判定、证据可回查、状态可恢复、出口有硬门）。
- **product authority**: 本计划由 2026-08-28 多轮业界调研（Claude Code / OpenAI Codex / AGENTS.md 官方一手资料）与 hszq-app 真实项目实战推导，经 owner 对话确认方向。
- **open blockers**: 无阻断；切片 1（A 线）已具备实施条件。

## Product Contract

### 需求地基：四族知识 × 载体铁律

所有需求按知识族定位，载体错配视为需求失败：

| 族 | 内容 | 载体铁律 | 本项目对应 |
| --- | --- | --- | --- |
| 静态（是什么） | 结构/偏离/存在/背景/词汇 | 版本化规则文件（挖掘维护） | `spec-project-rules` 五文件 |
| 操作（怎么干） | 命令/环境/流程/交互 | 可执行脚本 | 命令文档 + init 脚本 + 入口文件 |
| 治理（边界） | 风险红线/所有权 | 执法系统 | permissions / CI / CODEOWNERS |
| 动态（在进行） | 任务状态/进度/flaky 经验 | 机器生成账本 | ledger / handoff / auto memory |

依据：AI 缺失的知识分四大族十二类（存在性/偏离性/结构性/背景性/词汇性｜命令性/环境性/流程性/交互性｜风险性/社会性｜状态性）；"三类 AI 不知道"（有什么/会做错/为什么）仅是族一切片。Anthropic 2026-07 为 Claude 5 系列删除 80%+ 系统提示词且编码评测无损，证明通识入规则零收益；模型越强，私有上下文价值越大。

### 职责切分（分层治理三分法）

`spec-project-rules` 采用三种职责形态：**深挖独占**（族一中必须挖掘的五类）、**表示不执法**（边界规则的知识表示归它，强制执行归 CI/permissions，经执法导出位衔接）、**指针不复制**（四族 pointer 区，不做第二真相源）。深挖准入判据：必须从代码提炼才拿得到、慢变、可回源验证。

### A 线：知识层需求（`spec-project-rules` 自身，P0，文本级改动）

- **A1 规则准入三问**：mining-method 增加准入测试——AI 不知道这个吗（私有事实）/ AI 的默认会错吗（偏离）/ 只属于这里吗（公司特性）；三问全否不写入；通识、语言默认、模型已不生成的 anti-pattern 挡在门外。验收：eval 增加通识条目被拒 case；hszq-app 现有 22 条规则回检通过。
- **A2 存在性知识行为化（C4 查重义务 + 能力指针）**：识别 AI 最可能重复造轮子的域（utils/组件/客户端/格式化/校验），每域产出"先查哪里（含检索式）→ 不存在才新建 → 新建后归位"的义务规则；reuse-contracts 强化能力指针（能力域→住址→查法）；**禁止条目级组件清单**（清单必腐烂，义务不会）。验收：hszq-app 增补实例（金额格式化查重义务）；knowledge-format 增加能力指针模板。
- **A3 规则生命周期元数据 + 减法审查**：元数据四字段（owner/consumer/invalidation_condition/last_verified_commit）；stale 双原因（code-drift 已有 / **model-obsolescence** 新增——模型已内化该规则）；用户告知宿主模型已大版本更新时做一次减法审查（三问重测；skill 无法自判模型版本，可选元数据 verified_against_model 记录口供）。验收：verify 报告支持两种 stale 原因；减法审查写入 SKILL.md closeout 可选步骤。
- **A4 index.md 四族指针区**：按四族组织 pre-development pointers（静态=本库五文件｜操作=命令文档/setup 脚本｜治理/动态=B 线落地随行加入），**只放 owner 路径，不放状态快照**（各族状态由 preflight 运行时判定，避免第二真相源——审查修正）。验收：已就位各族指针指向真实 owner。
- **A5 词汇性边界声明**：只管理与边界/契约相关术语；全量业务词汇表归 CONCEPTS.md/spec-compound，本库仅指针。
- **A6 表示不执法合同冻结**：`dependency-rules.md` 结构化行格式（from/to/方向/grade/status）声明为执法导出合同 v1 并冻结字段语义；CI 导出实现 deferred（等 field 数据），但格式自此视为对外合同，变更需版本化。

### B 线：过程合同层需求（harness，P0→P2）

- **B1 Preflight 四族就绪合同**：聚合 artifact `pre_development_context` 按四族判定就绪（静态 ready/stale｜操作 executable/missing｜治理 effective/unknown｜动态 present/missing）；缺验收→needs_human；各族降级行为不同（静态缺→可探索降级；治理缺→副作用阻断；动态缺→长任务阻断），不一刀切。
- **B2 Effective Rules Receipt**：报告宿主实际加载的规则（path/scope/hash），区分"文件存在"与"已加载"，冲突与未加载响亮披露。
- **B3 Workspace Baseline Receipt**：实施前固化 commit/branch/worktree/dirty owner/工具版本/baseline tests；不覆盖无 owner 变更；继承失败不归因本次改动。
- **B4 Acceptance→Verification 映射**：每条验收标准至少绑定一种检查（命令带 cwd/参数/预期信号）；未覆盖显式为 gap。
- **B5 Verification Receipt 统一格式**：receipt_id/source_commit/worktree/command/cwd/起止/exit/日志 refs+hash/acceptance ids/policy 状态/status（passed/failed/blocked/unavailable/degraded/partial/unverified）/limitations；**一律机器生成，禁止手写**；敏感信息脱敏。
- **B6 任务账本 + B7 Handoff 合同**：动态族载体；milestone/owner/attempt/状态机；交接最小字段绑定 receipts；flaky 等会话习得经验允许进 auto-memory 类载体，禁止写入静态规则文件。
- **B8 模块命令指针（收紧）**：模块入口只放本模块命令 pointer + 模块规则 pointer + 关键 gotcha；命令本体在命令文档/脚本维护，不复制不改写。
- **B9 CI 硬门迁移**：依赖边界（消费 A6 合同）/secret/build/test/drift/receipt 校验移出提示词进 CI。
- **B10 风险分级 review**：低（自检+focused tests）/中（fresh-context review）/高（独立 review+integration/CI）/极高（owner/安全审批）。
- **B11 并发协调**：正交才并行、写任务独立 worktree、共享接口/迁移串行、合并前分测。

### 优先级与发布切片

| 切片 | 内容 | 性质 |
| --- | --- | --- |
| 切片 1（P0-A） | A1–A6 全部 | 文本级，单次变更窗口 |
| 切片 2（P0-B） | B1–B5 | 最小过程闭环 |
| 切片 3（P1） | B6–B8 | 长任务与模块化 |
| 切片 4（P2） | B9–B11 | 硬治理，等 field 数据 |

### 非目标

- 不把四族全部塞进任何单一 skill 或文件。
- 不新增规范挖掘类别（A1–A6 已收敛；本计划只加准入与生命周期机制）。
- 不在提示词/规则文件中承担任何硬执法。
- 不复述模型已内化的通识。

### 成功指标

边界类返工率｜完成声明可回查率｜acceptance 映射覆盖率｜effective rules 实际加载率｜规则被引用率（规则 id 引用计数）｜通识条目漏入率（应 0，抽样）｜减法审查执行率与删减条数｜model-obsolescence 检出数｜重复造轮子事件数（C4 前后对比）｜context reset 恢复耗时。计量口径：采集机制随切片 4 B9 落地前，全部为 owner 手工抽样（引用率=PR/回复中规则 id 出现次数两周期抽样；减法审查执行率分母=用户发起次数）。

### 风险与失效条件

- 减法审查误删仍有效规则 → 删前重测三问 + git 历史可回滚。
- 四族指针指向的 owner 缺失 → 该族如实 missing，不伪造。
- B 线建设期长于 A 线收益兑现 → 切片按先小杠杆排列。
- 失效条件：field trial 两周期后规则引用率接近零，A 线扩展冻结，重估 pointer 注入方式。

### v1→v2 修订记录

v1（R1–R12）为平铺能力清单；v2 变更：①理论地基升级为四族分类学与载体铁律；②新增 A 线（准入三问/C4/减法审查/词汇边界/合同冻结）；③P0 重切（A 线先行）；④R9 收紧为指针不复制；⑤receipt 增加机器生成通则。

### Key Decisions

- 2026-08-28：规则准入采用"AI 不知道吗/会错吗/只属于这里吗"三问判据（owner 对话确认；依据 Anthropic 80% 删减事件与 Claude 官方 "Would removing this cause mistakes?" 测试）。
- 2026-08-28：存在性知识采用能力指针+查重义务，不建组件清单（清单腐烂经济学）。
- 2026-08-28：`spec-project-rules` 保持分层治理三分法边界，不扩张为 harness（深挖独占/表示不执法/指针不复制）。
