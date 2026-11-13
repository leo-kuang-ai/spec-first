# 核心方案文档

## 当前审查执行入口（2026-11-04）

新一轮 Skill 审查以 [Skill 审查 Workflow v2](../process/REVIEW-EXECUTION-WORKFLOW.md) 为执行入口；其第 2 节逐份映射本目录要求，说明当前合同、历史候选、旧统计与阈值冲突的处理。下文保留历史方案导航，不代表其中数字、拟议 Contract 或“已完成”状态已被本轮核验。源码深读另见 [12-phase05-skill-deep-dive.md](12-phase05-skill-deep-dive.md)，实际入口与必读引用以当前源码为准。

方案文档共 17 份（`00`–`12`，其中 `02` 有两份，另有 `DECISION-RULES`、`DECISION-AUTHORITY`、`RESOURCE-PLAN`），全部写于 2026-11-03 Phase 0 之前，属于**事前设计**。其中 5 份未执行/未采纳的设计（`09`、`10`、`11`、`DECISION-AUTHORITY`、`RESOURCE-PLAN`）已于 2026-11-04 归档至 `../archive/`，本目录现存 12 份。项目实际执行结果不在本目录，见文末「实际结果在哪里」。

「执行中的角色」一列依据 `phase0-results/`、`execution/`、`summary/` 中的实际引用和执行记录判断。

---

## 一、执行中实际起作用的文档

| 文档 | 内容 | 执行中的角色 |
|---|---|---|
| **DECISION-RULES.md** | 5 条量化决策规则：规则 1 试点后是否继续，规则 2 中期是否继续，规则 3 Phase 0 后是否启动 Phase 1（5 条件 + 4 种情况），规则 4 路径选择，规则 5 止损；另含灰色地带处理 | **决策的实际依据**。Phase 0 按规则 3 判定 2/5 条件满足，即情况 4「不启动 Phase 1」，再按规则 4 给出路径 3+2 的替代试点 |
| **00-goals-and-success-criteria.md** | 目标、三层标准（Layer 3 > 2 > 1）、4 种退出条件 | Phase 0 报告采用的退出条件 3 定义于此 |
| **02-execution-checklist.md** | Phase -1 / Phase 0 步骤与 YAML 追踪模板 | 任务追踪格式的来源 |
| **02-execution-quick-reference.md** | 一页纸速查 | 执行速查 |
| **12-phase05-skill-deep-dive.md** | Phase 0.5 深读方法：源码阅读 → 设计意图 → 根因 → 方案，每个 Skill 8h | Phase 0.5 和 Phase 1 阶段 1 的深读按此执行（`phase05-analysis/`） |
| **06-mainline-baseline.md** | 5 个主链路 Skill 的源码与合同测试基线（8 组 95 项） | 执行前的源码基线 |
| **07-progress-tracking.md** | 进度记录 | 进度跟踪 |

## 二、方法论背景

| 文档 | 内容 |
|---|---|
| **01-v4-workflow-driven-approach.md** | v4 方法论：从真实任务出发，沿流程找阻力点，不预设 Skill 清单 |
| **03-optimization-candidates.md** | 候选清单（O01–O12 与 NEW 系列），全部待 Phase 0 数据决定 |
| **04-dev-lifecycle-full-analysis.md** | 研发场景与阶段流程分析 |
| **05-optimization-dimensions-with-trends.md** | 优化维度与外部趋势；外部事实未在本轮核验 |

## 三、未按原设计执行的文档（阅读时注意）

> 2026-11-04 归档说明：`09`、`10`、`11`、`DECISION-AUTHORITY`、`RESOURCE-PLAN` 已移至 `../archive/`，下表保留对其角色与实际情况的判断记录；`08` 因 prose 层 Contract 要素仍被本轮 WP1/WP3 用作 Contract 基准而留在本目录（未采纳的仅其 schema 与自动检查器部分）。`10`/`11` 的**关注面**（当前 Skill 对超大需求的适配质量）由 WP4 任务4.4 承接主动审查（2026-11-04 owner 裁定）。

| 文档 | 原设计 | 实际情况 |
|---|---|---|
| **08-skill-contract-protocol.md** | 5 个 Skill 的强 schema YAML 输入输出契约、3 个 Inter-Skill Protocol，以及 Python 自动检查（`ProtocolViolationError`、失败自动重试） | **未采纳**。Phase 0 追踪没有填 `contract_protocol_analysis` 字段。Phase 1 改的是 prose 层的对账义务，不是本文的 schema 和检查器。本文「预期收益」表里的「信息丢失 64%、返工 73%」是 Phase 0 之前的假设值，Phase 0 实测信息丢失为 0/9、返工为 6/9 |
| **09-implementation-roadmap.md** | 11 周路线：Phase 0 44h；Phase 1 分路径 1 Skill 优化和路径 2 工具链（测试运行器、边界检查器、Protocol 验证器）；A/B 对比验证 | **偏离执行**。实际用了 2 天，路径 2 的三个工具没有建，也没有做 A/B 对照：Phase 1.5 只验证了优化后版本，没有对照组。基线数字同样是事前假设 |
| **DECISION-AUTHORITY.md** | 8 个决策点的 RACI 矩阵与紧急决策机制 | 只有 `execution/GOALS-COMMANDS.md` 引用过它。按规则，灰色地带需要「技术负责人 + CTO」共同决策，实际由单一负责人 override |
| **RESOURCE-PLAN.md** | 多人团队的分阶段人员、时间与预算配置 | 只有 `phase0-results/TOOLS-SETUP.md` 引用过它。实际执行方式是单人 + AI |
| **10-large-requirement-strategy.md** | 超大需求的五阶段方案，新增 6 个 Skill | **未执行**，执行产物中没有引用 |
| **11-large-scale-skill-upgrade.md** | 业界对标，识别 12 个缺口，P0+P1 共 182h | **未执行**，执行产物中没有引用。方向与 Phase 0 结论相反：Phase 0 结论是 Skill 问题不是主要矛盾 |

---

## 文档关系图（2026-11-04 补）

12 份文档构成「目标 → 方法 → 判定 → 执行 → 记录」闭环链，全部为 Phase 0 前事前设计；本图为导航概览，逐份权威仍以上文三层表格为准。

```
目标层   00 目标与成功标准 —— 三层标准（L3>L2>L1）+4退出条件，一切的校准锚点
           │ 校准
方法层   01 v4方法论总纲 —— 真实任务→沿流程找阻力点→不预设Skill清单
         ├─ 04 研发生命周期分析 —— 01 里"沿流程"的那张流程地图
         ├─ 03 候选清单 —— "不预设"的另一面：O01-O12+NEW 全是待数据裁决的假设池，不是待办
         └─ 05 优化维度 —— 用什么标准评判（原文八维 D01-D08）
           │ 何时做/做不做
判定层   DECISION-RULES —— 5条量化规则；上接00的退出条件，下消费Phase 0实测数据，
           │             输出"启动/不启动/走哪条路/何时止损"（Phase 0 已按规则3判定：情况4）
执行层   02-checklist / 02-quick-reference —— Phase -1/0 的步骤与追踪格式
         06 主链路基线 —— 源码/合同基线（95项检查）+ ML-01~07 场景 + H01-H05 交接点定义
         08 Skill Contract 协议 —— prose 层合同要素（当前 WP1/WP3 的 Contract 基准）
         12 Phase 0.5 深读方法 —— 每 Skill 8h 的源码深读法
           │
记录层   07 进度追踪 —— 唯一"执行后"漂移的文档：本身是进度表，实际结果指向 ../phase0-results/

导航器   README（本文）—— 三层权威分类 + 已知不一致
（已归档 ../archive/：09/10/11/DECISION-AUTHORITY/RESOURCE-PLAN —— 未执行的路线/策略/治理设计，关注面经 v2 workflow 承接）
```

**三条最重要的依赖**：

1. **01 ↔ 04/03/05 是方法论的一体四面**：01 定原则（不预设），04 给地图（流程在哪），03 放假设（可能改什么，等数据裁决），05 给尺子（拿什么维度评判）。
2. **DECISION-RULES 是全链路闸门**：把 00 的退出条件变成 5 条量化规则，用 Phase 0 实测数据驱动；「Skill 非主要矛盾」即其规则 3 的输出。
3. **06 + 08 + 12 是当前审查（Option B / v2 主链路批次）的直接输入**：06 给场景（ML/H 编号），08 给合同基准（WP1 任务1.4、WP3 任务3.2），12 给深读方法（WP1）；05 八维是覆盖分析（`../analysis/CORE-REVIEW-DIMENSIONS-COVERAGE.md`，v1.3）53 项账目的分母来源。

当前执行入口不直接翻本目录：经 [Skill 审查 Workflow v2](../process/REVIEW-EXECUTION-WORKFLOW.md) 第 2 节逐份映射进入——core/ 是要求来源，v2 是「要求→检查面」的翻译层。

---

## 推荐阅读顺序

- **理解决策过程（30 分钟）**：`00` → `DECISION-RULES` 规则 3、规则 4 → `phase0-results/phase0-final-report.md`
- **理解方法论（1 小时）**：再读 `01`、`02-execution-quick-reference`、`12`
- **复用到新项目**：`00`、`01`、`02-execution-checklist`、`DECISION-RULES` 可以直接复用。复用 `08`、`09`（`../archive/`）之前，先对照上表的「实际情况」，确认前提成立

## 实际结果在哪里

| 结果 | 位置 |
|---|---|
| Phase 0 决策（退出条件 3） | `../phase0-results/phase0-final-report.md` |
| Phase 0.5 与 Phase 1 深读 | `../phase0-results/phase05-summary-report.md`、`../phase0-results/phase05-analysis/` |
| Phase 1 优化（6 项提交） | `../phase0-results/final-optimization-report.md` |
| Phase 1.5 行为验证（n=5，含诚实限制） | `../phase0-results/validation-tasks/comparison-report.md` |

## 已知不一致（尚未修正）

- `final-optimization-report.md` 和 `summary/PROJECT-FINAL-SUMMARY.md` 把负责人 override 记为「规则 3 情况 3」。但 Phase 0 判定是 2/5，即情况 4。情况 3 指 3/5，按规则应召开决策会议。
- `summary/PROJECT-FINAL-SUMMARY.md` 中的归因占比、M1–M5 模式定义、优先级分数，与 `phase0-final-report.md`、`final-optimization-report.md` 不一致。以后两份为准。
