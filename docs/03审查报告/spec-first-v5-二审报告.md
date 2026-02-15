# Spec-First v5.0 第二轮多角色联合审查报告

> **审查对象**: `docs/01需求文档/spec-first-v5.md`（v5.0 一审修复后版本）
> **审查时间**: 2026-02-08
> **审查方法**: 5角色Agent并发审查 → 交叉验证 → 去重汇总 → 裁定
> **审查角色**: 产品经理(PM) · 技术Leader(TL) · 架构师(Arch) · 运维/DevOps(Ops) · QA负责人(QA)
> **一审修复**: P0 13项 + P1 20项，共 33 项全部修复
> **二审修复**: P0 1项 + P1 12项，共 13 项全部修复
> **范围说明**: 发布运维走内部 DevOps 系统，spec-first 范围到测试完成（06 Wrap-up），07 Release 相关问题降级处理

---

## 总体结论

**✅ 通过** — 一审 33 项 + 二审 13 项（P0×1 + P1×12）全部修复完毕。文档核心架构（星型追踪、三层规则、双层Hook、覆盖率双向校验）质量优秀，可进入 MVP 落地阶段。剩余 15 项 P2 为优化建议，按需处理。

| 统计 | 数量 | 说明 |
|------|------|------|
| **P0（阻断级）** | 1 项 | commit-msg Hook 阻断早期阶段提交 |
| **P1（重要）** | 12 项 | 公式不一致、ID声明缺失、目录结构遗漏、测试体系缺口等 |
| **P2（建议）** | 15 项 | 措辞统一、策略优化、边界场景补充、07 Release集成等 |
| **跨角色共识** | 3 项 | 2+角色同时发现的问题（已计入上述分级） |

---

## 跨角色共识问题（3项）

### 共识-1: 目录结构缺少项目级共享文件和运行态目录 【P1】
> 发现角色: Arch · Ops

- **证据**: 目录结构图（L2183-2219）缺少以下在正文中定义的文件/目录：

| 文件/目录 | 定义位置 | 说明 |
|-----------|---------|------|
| `specs/.feat-registry.md` | L1400 | FEAT 注册表 |
| `specs/cross-feature-deps.md` | L1502 | 跨 Feature 依赖登记 |
| `specs/known-exceptions.md` | L1642 | 已知豁免清单 |
| `.spec-first/.baseline` | L1080 | baseline commit |
| `.spec-first/ai-stats.jsonl` | L1086 | AI 编码统计 |

- **影响**: 目录结构是项目初始化蓝图，缺失导致新项目遗漏关键文件
- **建议**: 在 `specs/` 下补充项目级共享文件，在 `project-root/` 下补充 `.spec-first/` 目录

### 共识-2: AC 级覆盖率 Size S 阈值未明确 【P2】
> 发现角色: TL · QA

- **证据**: L1154/1601 标注 `≥90%（M/L）`，Size S 无任何说明
- **建议**: 显式标注，如 `≥90%（M/L），S 规模不强制（FR 级覆盖率 = 100% 已足够）`

### 共识-3: 07 Release 阶段集成不完整 【P2·降级】
> 发现角色: PM · TL · Arch · Ops | 原判 P0，因发布运维走内部 DevOps 系统，降级为 P2

- **证据**: 07 Release 已定义（L1949-2002），但流程速查表、用例体系、归档清单均未同步；"7+3 阶段"与实际不符；Ops 角色未在 Actor 体系注册
- **建议**: 在文档中明确标注"07 Release 为可选参考阶段，实际发布流程由内部 DevOps 系统承载"

---

## P0 问题（1项）

### Ops-P0-1: commit-msg Hook 阻断 00-02 阶段的合法提交

- **行号**: L682, L2045, L2284, L2298
- **问题描述**: commit-msg Hook 要求所有提交信息包含 `[TASK-FEAT-NNN]`，但 TASK 在 03 Plan 阶段才产生。00 Init、01 Specify、02 Design 阶段的提交（spec.md、design.md、constitution.md）无法携带 TASK ID，会被 Hook 拒绝
- **影响**: 流程前三个阶段的 Git 提交被自身规范阻断，团队被迫绕过 Hook 或提前创建占位 TASK
- **建议**: commit-msg Hook 增加阶段感知豁免：当提交路径匹配规范产物（spec.md、design.md 等）时，允许 `[SPEC-FEAT]` 或 `[DESIGN-FEAT]` 替代格式

---

## P1 问题汇总（12项）

| # | 问题 | 发现角色 | 分类 |
|---|------|---------|------|
| 1 | Status 枚举缺少 ⚠️ Exception + Active 定义不完整 | TL | 公式一致性 |
| 2 | TC/Task 合规率公式 FR ref vs FR/NFR ref 不一致 | TL | 公式一致性 |
| 3 | DS-ID 缺少声明格式示例，追踪链 Design 层断点 | Arch | 追踪体系 |
| 4 | 目录结构缺少项目级共享文件 + .spec-first/ | Arch·Ops | 目录结构 |
| 5 | TC ID 格式与 NFR 测试方法矩阵类型枚举不一致 | QA | 测试体系 |
| 6 | NFR 测试方法矩阵未覆盖 AVAIL/OBS 维度 | QA | 测试体系 |
| 7 | AC 级覆盖率 <100% 时缺乏未覆盖 AC 管理机制 | QA | 测试体系 |
| 8 | SAST/DAST 分级仅按 Size，未考虑安全风险等级 | QA | 安全测试 |
| 9 | Mode I 回归范围推导遗漏 API/数据层依赖 | QA | 测试体系 |
| 10 | ai-stats.jsonl 月度轮转无自动化机制 | Ops | 运维策略 |
| 11 | RACI 矩阵与 UC-002 DoR Sign-off 执行者矛盾 | PM | 流程一致性 |
| 12 | UC-025 主 Actor 与 Hook 层级矛盾 | PM | 用例一致性 |

### P1 详细描述

#### P1-1: Status 枚举缺少 ⚠️ Exception + Active 定义不完整 (TL)

- **行号**: L1570-1581, L1605, L1641-1648
- **问题**: Status 枚举定义 7 种状态，但 Known Exception List 引入的 ⚠️ Exception 不在枚举中。Active 定义为"排除 Deferred 和 Cancelled"，但豁免条目也从分母排除，Exception 未纳入 Active 排除范围
- **建议**: (1) Status 枚举补充 `⚠️ Exception`；(2) Active 定义改为"排除 Deferred、Cancelled 和 Exception"

#### P1-2: TC/Task 合规率公式不一致 (TL)

- **行号**: L1157 vs L1614, L2460 vs L1613
- **问题**: UC-031 写"TC with ≥1 **FR** ref"，Coverage Algorithm 写"TC with ≥1 **FR/NFR** ref"。度量全景同理。TC 可验证 NFR，正确版本应包含 NFR
- **建议**: 统一为"FR/NFR ref"，同步修正 UC-031 和度量全景表

#### P1-3: DS-ID 缺少声明格式示例 (Arch)

- **行号**: L1380, L1420-1477
- **问题**: ID 声明格式章节给出了 spec.md/tasks.md/tests/contracts 的声明示例，唯独缺少 design.md 中 DS-ID 的声明格式和引用方式
- **建议**: 补充 design.md 的 DS 声明格式示例（含 `traces: [FR-xxx]` 引用）

#### P1-4: 目录结构缺少项目级共享文件 (Arch·Ops)

- 见共识-1，不再重复

#### P1-5: TC ID 格式与 NFR 测试方法矩阵类型枚举不一致 (QA)

- **行号**: L1383 vs L1885
- **问题**: TC ID 仅允许 `UT|IT|E2E`，但 NFR 矩阵 MAINT 维度使用 `ST (Static)`，不在合法枚举中
- **建议**: 扩展 TC LVL 枚举增加 `ST`，或将 MAINT 改为 `IT (Static Analysis)`

#### P1-6: NFR 测试方法矩阵未覆盖 AVAIL/OBS 维度 (QA)

- **行号**: L1390 vs L1877-1885
- **问题**: 推荐维度含 AVAIL/OBS，但测试方法矩阵仅覆盖 PERF/SEC/REL/SCALE/MAINT，遗漏可用性和可观测性
- **建议**: 补充 AVAIL（故障切换/HA 验证）和 OBS（日志/指标/链路追踪验证）

#### P1-7: AC 级覆盖率缺乏未覆盖 AC 管理机制 (QA)

- **行号**: L1154, L1601, L1627-1655
- **问题**: AC 级 ≥90% 允许 10% AC 无 TC，但 Known Exception List 仅适用于 FR/NFR 级别，AC 级覆盖缺口无追踪审计
- **建议**: 未覆盖 AC 须在测试报告中逐条列出并注明原因，纳入 Wrap-up 复盘

#### P1-8: SAST/DAST 分级仅按 Size，未考虑安全风险 (QA)

- **行号**: L1889-1895
- **问题**: Size S 仅要求 OWASP + SCA，不要求 SAST。但涉及认证/授权/支付的 Size S Feature 安全风险高
- **建议**: 增加叠加规则——存在 `NFR-SEC-*` 时，无论 Size，SAST 为必须项

#### P1-9: Mode I 回归范围推导遗漏 API/数据层依赖 (QA)

- **行号**: L530-537
- **问题**: 第3步仅通过 TASK/PR 共享发现间接影响，未追踪 API/Data Ref 列。两个 FR 共享同一 API 端点时，API 契约变更的回归风险被遗漏
- **建议**: 第3步增加"与变更 FR/NFR 共享 TASK、PR **或 API/Data Ref** 的其他 FR/NFR"

#### P1-10: ai-stats.jsonl 月度轮转无自动化机制 (Ops)

- **行号**: L1098
- **问题**: 声称"每月1日自动创建新文件"，但未指定执行机制（cron? Hook? CI job?）
- **建议**: 明确轮转执行方式，如 Layer B pre-push Hook 检测日期并自动归档

#### P1-11: RACI 矩阵与 UC-002 DoR Sign-off 执行者矛盾 (PM)

- **行号**: RACI 矩阵 vs UC-002
- **问题**: RACI 矩阵中 DoR Sign-off 的执行者与 UC-002 用例详述中的 Actor 分配不一致
- **建议**: 统一两处的执行者定义

#### P1-12: UC-025 主 Actor 与 Hook 层级矛盾 (PM)

- **行号**: UC-025
- **问题**: UC-025 的主 Actor 定义与 Hook 双层体系（Layer A/B）的执行主体存在矛盾
- **建议**: 明确 UC-025 在 Layer A 和 Layer B 场景下的 Actor 分配

---

## P2 问题汇总（15项）

| # | 问题 | 发现角色 |
|---|------|---------|
| 1 | AC 级覆盖率 Size S 阈值未明确 | TL·QA |
| 2 | 07 Release 阶段集成不完整（降级） | PM·TL·Arch·Ops |
| 3 | 孤儿项率公式三处表述不一致 | TL |
| 4 | 代码覆盖率"行覆盖率"标注仅一处有 | TL |
| 5 | API 覆盖率分母用"Total"而非"Active" | TL |
| 6 | NFR DIM 描述缺少"首位必须为字母"约束 | TL |
| 7 | 目录结构只列 traceability-matrix.md，M/L 推荐 YAML 格式未体现 | TL |
| 8 | UC-013 缺陷生命周期缺少 Reopen 状态 | QA |
| 9 | Mode I 回归推导第3步 FR/NFR 措辞不一致 | QA |
| 10 | 缺陷逃逸率小样本规则与 S1/S2=0% 目标矛盾 | QA |
| 11 | QA 未参与 03 Plan 阶段任务评审 | QA |
| 12 | QA 可测试性评审缺乏具体检查标准 | QA |
| 13 | 安全扫描 Gate 仅定义"无高危"，缺中危处理规则 | QA |
| 14 | 三文件 append-only 策略对 task_plan.md 适用性存疑 | Arch |
| 15 | Session Catchup 04 Implement 缺少 contracts 加载 | Arch |

---

## 修复优先级建议

### 第一批：MVP 启动前必须修复（P0 × 1 + P1 × 4） — ✅ 全部完成

| # | 问题 | 预估影响 | 状态 |
|---|------|---------|------|
| P0-1 | commit-msg Hook 阶段感知豁免 | 阻断 00-02 阶段提交 | ✅ 已修复 |
| P1-1 | Status 枚举 + Active 定义补全 | 覆盖率公式计算错误 | ✅ 已修复 |
| P1-2 | TC/Task 合规率公式统一 | 校验脚本误判 | ✅ 已修复 |
| P1-3 | DS-ID 声明格式示例 | 追踪链 Design 层不可执行 | ✅ 已修复 |
| P1-4 | 目录结构补全 | 项目初始化遗漏文件 | ✅ 已修复 |

### 第二批：MVP 完成后修复（P1 × 8） — ✅ 全部完成

| # | 问题 | 预估影响 | 状态 |
|---|------|---------|------|
| P1-5 | TC ID 枚举扩展 ST | MAINT 维度 TC 无法命名 | ✅ 已修复 |
| P1-6 | NFR 矩阵补充 AVAIL/OBS | NFR 测试设计缺指导 | ✅ 已修复 |
| P1-7 | AC 级覆盖缺口管理 | 10% 缺口无审计 | ✅ 已修复 |
| P1-8 | SAST 安全风险叠加规则 | 安全敏感小 Feature 漏检 | ✅ 已修复 |
| P1-9 | 回归推导补充 API 维度 | API 契约变更回归遗漏 | ✅ 已修复 |
| P1-10 | ai-stats.jsonl 轮转机制 | 统计文件无限增长 | ✅ 已修复 |
| P1-11 | RACI 与 UC-002 统一 | 职责分配歧义 | ✅ 已修复 |
| P1-12 | UC-025 Actor 与 Hook 统一 | 用例执行歧义 | ✅ 已修复 |

---

## 各角色最终裁定

| 角色 | 结论 | 核心条件 |
|------|------|---------|
| 产品经理 | ✅ **通过** | commit-msg Hook 豁免 + RACI 统一 — 全部修复 |
| 技术Leader | ✅ **通过** | Status 枚举补全 + 合规率公式统一 — 全部修复 |
| 架构师 | ✅ **通过** | DS-ID 声明格式 + 目录结构补全 — 全部修复 |
| 运维/DevOps | ✅ **通过** | commit-msg Hook 豁免 + ai-stats 轮转机制 — 全部修复 |
| QA负责人 | ✅ **通过** | TC ID 枚举扩展 + NFR 矩阵补全 + AC 覆盖管理 — 全部修复 |

**联合裁定: ✅ 通过** — P0×1 + P1×12 全部修复完毕，15 项 P2 按需处理。文档可进入 MVP 落地阶段。

---

## 与一审对比

| 维度 | 一审 | 二审 | 趋势 |
|------|------|------|------|
| P0 数量 | 13 | 1 | ↓ 92% |
| P1 数量 | 20 | 12 | ↓ 40% |
| P2 数量 | 10 | 15 | ↑（审查深度增加） |
| 问题性质 | 架构级缺失（Release阶段/缺陷管理/Hook体系） | 局部不一致（公式/枚举/声明格式） | 从结构性问题转为细节打磨 |

---

*第二轮审查报告由5个角色Agent并发生成，经汇总去重、交叉验证后输出。*
*报告生成时间: 2026-02-08*
