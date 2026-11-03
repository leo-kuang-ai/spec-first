# 核心方案文档

## 当前审查执行入口（2026-11-04）

新一轮 Skill 审查以 [Skill 审查 Workflow v2](../process/REVIEW-EXECUTION-WORKFLOW.md) 为执行入口；其第 2 节逐份映射本目录要求，说明当前合同、历史候选、旧统计与阈值冲突的处理。下文保留历史方案导航，不代表其中数字、拟议 Contract 或“已完成”状态已被本轮核验。源码深读另见 [12-phase05-skill-deep-dive.md](12-phase05-skill-deep-dive.md)，实际入口与必读引用以当前源码为准。

本目录共 17 份方案文档（`00`–`12`，其中 `02` 有两份，另有 `DECISION-RULES`、`DECISION-AUTHORITY`、`RESOURCE-PLAN`）。全部写于 2026-11-03 Phase 0 之前，属于**事前设计**。项目实际执行结果不在本目录，见文末「实际结果在哪里」。

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

| 文档 | 原设计 | 实际情况 |
|---|---|---|
| **08-skill-contract-protocol.md** | 5 个 Skill 的强 schema YAML 输入输出契约、3 个 Inter-Skill Protocol，以及 Python 自动检查（`ProtocolViolationError`、失败自动重试） | **未采纳**。Phase 0 追踪没有填 `contract_protocol_analysis` 字段。Phase 1 改的是 prose 层的对账义务，不是本文的 schema 和检查器。本文「预期收益」表里的「信息丢失 64%、返工 73%」是 Phase 0 之前的假设值，Phase 0 实测信息丢失为 0/9、返工为 6/9 |
| **09-implementation-roadmap.md** | 11 周路线：Phase 0 44h；Phase 1 分路径 1 Skill 优化和路径 2 工具链（测试运行器、边界检查器、Protocol 验证器）；A/B 对比验证 | **偏离执行**。实际用了 2 天，路径 2 的三个工具没有建，也没有做 A/B 对照：Phase 1.5 只验证了优化后版本，没有对照组。基线数字同样是事前假设 |
| **DECISION-AUTHORITY.md** | 8 个决策点的 RACI 矩阵与紧急决策机制 | 只有 `execution/GOALS-COMMANDS.md` 引用过它。按规则，灰色地带需要「技术负责人 + CTO」共同决策，实际由单一负责人 override |
| **RESOURCE-PLAN.md** | 多人团队的分阶段人员、时间与预算配置 | 只有 `phase0-results/TOOLS-SETUP.md` 引用过它。实际执行方式是单人 + AI |
| **10-large-requirement-strategy.md** | 超大需求的五阶段方案，新增 6 个 Skill | **未执行**，执行产物中没有引用 |
| **11-large-scale-skill-upgrade.md** | 业界对标，识别 12 个缺口，P0+P1 共 182h | **未执行**，执行产物中没有引用。方向与 Phase 0 结论相反：Phase 0 结论是 Skill 问题不是主要矛盾 |

---

## 推荐阅读顺序

- **理解决策过程（30 分钟）**：`00` → `DECISION-RULES` 规则 3、规则 4 → `phase0-results/phase0-final-report.md`
- **理解方法论（1 小时）**：再读 `01`、`02-execution-quick-reference`、`12`
- **复用到新项目**：`00`、`01`、`02-execution-checklist`、`DECISION-RULES` 可以直接复用。复用 `08`、`09` 之前，先对照上表的「实际情况」，确认前提成立

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
