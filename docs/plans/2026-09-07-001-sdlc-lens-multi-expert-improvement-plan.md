---
title: SDLC 视角多专家提升方案
date: 2026-09-07
type: strategic-improvement-proposal
status: draft
artifact_type: advisory
execution: knowledge-work
sources:
  - "SDLC 全网调研会话 sess_d155bfbc-5ca3-43cb-b61b-0a7e2d953784（阶段/模型/DevSecOps/ALM 结论 digest）"
  - "docs/10-prompt/结构化项目角色契约.md（演化判断基线）"
  - "docs/plans/2026-09-05-002-next-phase-development-sequence.md（现行 S0-S6 开发顺序）"
  - "docs/plans/2026-09-03-001-feat-skill-routing-optimization-requirements.md（R3 已立项需求）"
---

# SDLC 视角下的 spec-first 提升方案（多专家会议结论）

> 结论先行：SDLC 理论审计**确认了现行主线方向的正确性**——spec-first 的核心链路与 SDLC 阶段论、V 模型验证配对、螺旋风险驱动、DevSecOps 安全左移高度同构，且大部分流动/采纳缺口已被 S0-S6 现行计划覆盖。净新增价值集中在三处：**供应链安全盲区（唯一有行级证据的缺口）**、**确定性检查的 CI 收口**、**治理文档事实修正**。19 项专家提案经红队裁决：3 项立即执行（不占现行工作项名额）、14 项折入现有批次、2 项挂起待触发、0 项直接否决。

本文是 advisory 提升方案，不替代、不修改 `2026-09-05-002` 开发顺序的地位；所有折入项以该计划对应批次的出口条件为准。本文 `execution: knowledge-work`，不能直接作为 `spec-work` 的整包代码输入。

## 1. 背景与方法

**输入**：上一会话完成的全网 SDLC 调研（会话 `sess_d155bfbc`），核心结论：七阶段划分（规划/分析/设计/编码/测试/部署/维护）、八种模型（瀑布/V 模型/迭代/螺旋/敏捷/精益/RAD/大爆炸）、现代演进（DevOps/DevSecOps 安全左移，SolarWinds 供应链案例）、SDLC vs ALM 边界、实践挑战（范围蔓延、需求不清、测试深度、供应链安全、AI 辅助开发约 35% 组织采用）。

**会议过程**：五位不同视角专家（SDLC 流程建模、DevSecOps/供应链、敏捷流动效率、平台工程自动化、开发者体验采纳）基于统一 digest 独立只读分析并提交提案；红队守门员逐项裁决（过度设计、宿主 primitive 重复、与 S0-S6 冲突、claim 与证据匹配四维）；会议主席（本轮主 agent）综合输出。全部 agent 只读，未修改任何产品 source。

**证据核实**：红队独立核实了四项关键证据，会议主席本地复验一致——

1. `skills/spec-code-review/SKILL.md:348`：trivial-PR 预判明确把 "dependency lock-file or manifest-only bumps" 列为可跳过 review 的候选。
2. `skills/spec-work/references/shipping-workflow.md:62,72`：dependency-version bumps 被列为 mechanical diff，可跳过 simplify 与 dedicated review。
3. `vendor/` 目录不存在，但 `AGENTS.md:158` 仍引用 "`vendor/`：vendored parser dependencies"。
4. `.github/workflows/` 现有 4 条 workflow，均未接入 `check:shared-references` / `sync:instructions` 校验；`npm test` 全量仅在 windows runner 执行。

## 2. SDLC 视角现状映射

| SDLC 阶段 | spec-first 对应 | 评价 |
| --- | --- | --- |
| 规划/分析 | spec-ideate/brainstorm/prd；R/A/F/AE 验收示例 | 强（核心优势） |
| 设计 | spec-plan + Verification Contract + high-risk-plan-lens | 强；集成级验证条款弱（提案 A2） |
| 编码 | spec-work/spec-debug/Direct Lane 分级 | 强 |
| 测试 | verification-run-summary、honest-closeout、working-tree 指纹、红绿证明 | 强；日常 run 无时间维度（提案 C1） |
| 部署 | 显式止于绿 PR（spec-lfg）；rollout/rollback 以 plan-time 决策进 lens | 边界正确但未显式声明 non-goal（提案 A3） |
| 维护 | spec-compound(-refresh)、docs/solutions、spec-sweep、带失效条件的知识 | 强 |

**同构发现（SDLC 理论确认现行设计）**：

- **V 模型「阶段-验证配对」已隐性存在**：brainstorm 产验收示例（需求↔验收测试）、plan 逐单元枚举测试场景与 Verification Contract（设计↔验证）、work 要求红绿证明（编码↔单元测试）。
- **螺旋风险驱动已落地**：`high-risk-plan-lens.md` 触发矩阵 + largest unproven risk + Lightweight/Standard/Deep 深度分级。
- **DevSecOps 安全左移有锚点**：security-reviewer persona（注入/越权/secret/SSRF，且把 model/tool output 列为不可信输入）、PRD Sanitization 分离嵌入式指令、高风险主题路由 security-sentinel。
- **SDLC vs ALM 边界判断正确**：运维/部署执行不进 scope，风险由 plan-time 决策承载；缺的只是显式声明（A3）。

## 3. 五视角专家发现摘要

**SDLC 流程建模**：阶段覆盖与验证配对整体扎实。缺口：一次变更缺 consolidated 追溯视图（R/U-ID、run summary、review findings 分散，PR reviewer 手工拼接）；设计↔集成验证配对弱于单元级；ALM non-goal 未显式声明。

**DevSecOps/供应链**（本轮唯一发现行级证据盲区的视角）：审查期与规划期安全面好（persona、lens、sanitization、零 runtime 依赖 + 精确 pin + skills-lock hash）。缺口：**lockfile/manifest bump 在两处流程文案中被明确列为可跳过 review 的 trivial/mechanical 类**——lockfile 恰是供应链投毒（SolarWinds 类）的主要载体，构成系统性盲区；commit 出口无确定性 secret 检查；新依赖引入无尽调决策点；AGENTS.md 引用不存在的 `vendor/`。

**敏捷流动效率**：DoD 已显式（plan 产出、work 消费）、scope creep 有轻量防线（stop_if/done_signal）、批次大小有指引（垂直切片 + 最窄反馈环）。缺口：日常 run 无时间维度、WIP 纪律未泛化到用户面、日常 rework（review 轮次）无轻量记录。

**平台工程**：CI 已有 4 条 workflow，确定性检查多为可拦截的 exit 1 模式。缺口：R3 路由回归 CI 化已立项未实施；漂移检查（`check:shared-references`）脚本化但 PR 不拦截——B3 的 vendor/ 漂移正是其实证；本仓自托管 mirror 缺重投射幂等门；Linux 无全量测试。

**开发者体验/采纳**：quickstart 机制化、宿主透明度（supportState + 晋级阶梯）领先、claim 分级严格。缺口：上手旅程止于 init，无「首个可信变更」终点定义；外部评估路径缺失；README×3 与手册对 SDLC/DevSecOps/ALM 零词汇映射——而这是目标用户的共享词汇。

## 4. 提升方案

### 4.1 P0：立即执行（确定性收口，不占 S0-S6 两个工作项名额）

| # | 提案 | 内容 | source owner | 验证 |
| --- | --- | --- | --- | --- |
| P0-1 | 治理文档供应链漂移修正 | 删除 CLAUDE.md 治理区中 `vendor/` 引用（经 `npm run sync:instructions` 重新生成 AGENTS.md 受管区）；SECURITY.md 补一段：外部来源资产（skills-lock.json）更新时重验 hash + advisory | `CLAUDE.md`、`SECURITY.md` | docs-only；`npm run sync:instructions` |
| P0-2 | 漂移 check 收口 CI | 在现有 workflow 加 2 个 step 接入 `check:shared-references` 与 `sync:instructions`（校验态，漂移即红） | `.github/workflows/`（建议 skill-entrypoint-gate 或邻近） | 手动改 references 副本 → 应红 |
| P0-3 | Linux 全量测试 job | ubuntu job 跑 `npm test`，沿用现有路径过滤；可与 P0-2 同 PR 顺带 | `.github/workflows/` | CI 绿 |

依据：P0-1 修正已证实的事实错误（vendor/ 不存在），且正是 P0-2 所防漂移类的实证；P0-2 把「已脚本化、exit 1、零误报」的确定性检查真正在 PR 出口强制，频率×成本×误报三条件全部满足；P0-3 增量成本最低。三项均不动 schema、不碰 S2 基线。

### 4.2 P1：折入现有批次（14 项，按去向归组）

| 去向批次 | 提案 | 机制摘要 |
| --- | --- | --- |
| **S1**（测量校准，绑同一次 schema_version 变更） | C1 + C3 | verification-run-summary 增可选 `started_at/ended_at`；run artifact 增 `review_rounds`（0/1/2）。一次 writer/reader matrix 与迁移策略，consumer 为 S4 墙钟与 review 轮次测量；S1 关闭后不再为零散字段动 schema |
| **S1 后半** | D1 | R3 路由回归 CI 化落地（22 用例入 `benchmarks/routing/`，path-filtered job，引擎不可用输出 skipped(env) 不 fail）。先校准后固化；沿用 R3 编号，不另立体系 |
| **S3.2（列为该批首项）** | **B1** | 依赖变更事实闸：修订 `spec-code-review/SKILL.md:348` 与 `shipping-workflow.md:62,72` 的 trivial/mechanical skip 语义——lockfile/manifest bump 不再自动免审，先取 advisory facts（`npm audit --json` 或 OSV，脚本备事实）再由 LLM 判定。唯一有行级证据的盲区，且 S3.2 本就改同一文件，边际成本最低 |
| **S3.2（降级实现）** | B2 | commit 前 secret 检查：仅「复用宿主已有 gitleaks 类工具 + 指引」写进 spec-commit/spec-commit-push-pr 前置步骤；不建自带正则引擎（重建商品化生态 + 误报维护负担） |
| **S3.3** | A2 + B4 | plan-sections.md 增条件条款：计划含 >1 行为单元或跨合同边界时，Verification Contract 须至少一条系统级 check；KTD 指南加一条新依赖尽调（maintenance/advisory/provenance 最小事实） |
| **S5.3** | C2 | execution-strategy.md 并行批次节加默认 WIP 上限与串行触发条件（纯指引非 gate） |
| **S5.4** | A1 + D4 + F1 + F4 | PR 模板追溯外显（plan path、U-ID/AE 覆盖、run summary ref、residuals，纯 prose）；SessionStart 轻量 drift 提醒（复用 spawnSync 预算调 `doctor --json`，stale 注入一行 advisory）；「首个可信变更」四段旅程坐标（先有 walkthrough 定义，doctor 才有输出来源）；宿主已知限制进 README（内容须来自实测，同源生成） |
| **S6 / OPT-12** | A3 + F3 | README 与 using-spec-first 显式声明部署/运维执行 non-goal；README 增价值链→SDLC 阶段映射小表（共享词汇定位，不新增 claim） |

### 4.3 P2：挂起 + 重估触发条件（2 项）

| 提案 | 挂起理由 | 重估触发 |
| --- | --- | --- |
| D3 自投射幂等门（CI 重投射本仓后对 mirror `git diff --exit-code`） | init 尚无非交互模式，机制先于消费者 | init 支持非交互且本仓手验投射幂等一次通过；或发生一次真实 drift 事故 |
| F2 最小对照任务样例（对外评估包） | 违反「内部先行」与 claim ceiling | S4 产出至少 exploratory_complete 结果 |

### 4.4 关键排序约束（最高风险项）

**折入 S3 的全部安全语义修订（B1/B2/B4）必须在 S2 冻结 `current_full` 基线之后落盘**——若提前合并，指令行为基线即被污染，S2/S3 的对照比较失效。P0 三项不受此约束（不动 skill 行为文案）。

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

## 6. 与现行 S0-S6 计划的关系

本方案不改变 S0-S6 的批次结构、依赖链与验收合同。其价值定位：

1. **外部理论镜子**：SDLC 阶段论/V 模型/螺旋/DevSecOps 审计确认现行设计方向，为现行计划提供外部理论背书（可择要在 S6 文档收敛时引用）。
2. **净新增项**：P0 三项 + B1 盲区（均未在 OPT-01~12 / F01~33 中出现）。
3. **去向映射**：其余 14 项为既有批次提供了 SDLC 理论注脚，实施时以对应批次出口条件为准，本方案不追加第二套关闭条件（遵循 2026-09-05-002 §10.4 的「索引不新增限制」原则）。

## 7. 最小落地组合与顺序

1. **立即可做**：P0-1（修错）→ P0-2 + P0-3（同一 PR 收口 CI）。
2. **S3.2 首项**：B1（唯一行级证据盲区，边际成本最低）。
3. 其余按折入批次自然推进；两项挂起项到触发条件满足时重估。

## 8. 验证与诚实边界

**已执行**：5 位专家 + 1 位红队的独立只读分析（共 6 个 fresh agent，非同会话缓存调用）；红队对四处关键证据的行级核实；会议主席对同一证据的本地 grep 复验（本文 §1 所列四项，全部属实）。

**未执行**：未修改任何产品 source、未运行产品测试、未做 skill 行为的 fresh-source eval、未执行模型评测或 runtime 投射。本文是 advisory 计划文档；P0 各项的验证方式写在提案内，实施时执行。专家分析中引用的其余文件证据（未列入 §1 复验范围的）保留为专家报告原文，实施对应提案时按其 source owner 现场核实。

## 9. 会议记录

- **输入**：SDLC 调研结论 digest（会话 `sess_d155bfbc`）+ 项目现状 digest（角色契约、S0-S6 计划、CHANGELOG、skill 面）。
- **参与者**：SDLC 流程建模专家、DevSecOps/供应链安全专家、敏捷流动效率专家、平台工程与自动化专家、开发者体验与采纳专家（第一轮并行独立分析）；红队守门员（第二轮逐项裁决）；会议主席（综合与本方案署名）。
- **裁决统计**：19 项提案 → adopt-now 3 项、fold 14 项、defer-with-trigger 2 项、reject 0 项。
- **已裁决的专家间张力**：① B2 commit 出口成立（属 mutation gate 延伸）而 session-start 扫描位置不成立；② B2 与 A1 不强行同批（分属 S3.2/S5.4，同窗口时共享一次 fresh-source 验证即可）；③ C1/C3 必须合并进 S1 的同一次 schema_version 变更。
