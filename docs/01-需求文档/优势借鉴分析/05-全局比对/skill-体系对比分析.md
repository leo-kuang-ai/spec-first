# AI 辅助开发 Skill 体系对比分析

> **版本**: 1.4.2 | **更新日期**: 2026-03-04 | **状态**: 审校修订（实施决策已定稿）

---

## 一、概述

本文档对 6 个主流 AI 辅助开发项目的 Skill 体系进行系统性梳理和对比分析，旨在为 Spec-First 项目的 Skill 设计提供借鉴参考。

### 1.1 分析项目列表

| 项目 | Skill 数量 | 核心定位 | 设计理念 |
|------|-----------|---------|---------|
| **Spec-First** | 22 | 全链路研发闭环 | 阶段驱动、追溯矩阵、Gate 门禁 |
| **OpenSpec** | 12 | 流动迭代工作流 | Actions not phases、DAG 依赖 |
| **Spec Kit** | 9 | 规范驱动开发 | Spec-Driven Development、命令模板 |
| **Planning-Files** | 1 | 上下文工程 | Manus 原则、文件系统即内存 |
| **Trellis** | 16 | AI 工作流系统 | Read Before Write、知识持久化 |
| **Superpowers** | 14 | 高质量代理技能 | TDD、系统化调试、审查闭环 |

### 1.2 设计理念对比

| 项目 | 核心设计理念 | 关键特征 |
|------|-------------|---------|
| Spec-First | **规范即契约** | 阶段状态机、追溯 ID、覆盖率矩阵、Gate 门禁 |
| OpenSpec | **Fluid Iterative Workflow** | 工件 DAG、使能器非门禁、快速路径 |
| Spec Kit | **Spec-Driven Development** | 宪法权威、模板驱动、一致性分析 |
| Planning-Files | **Context Engineering** | KV-Cache 优化、文件即内存、5-Question Reboot |
| Trellis | **Read Before Write** | 规范注入、上下文漂移对抗、知识捕获 |
| Superpowers | **Discipline Over Convenience** | TDD 铁律、压力测试、漏洞封闭 |

---

## 二、Skill 数量与分类统计

### 2.1 总体统计

```
项目           核心流程    管理/辅助    质量/验证    元/工具    总计
─────────────────────────────────────────────────────────────────
Spec-First       8           6           5          3        22
OpenSpec         4           4           3          1        12
Spec Kit         7           0           2          0         9
Planning-Files   1           0           0          0         1
Trellis          9           3           3          1        16
Superpowers      8           2           4          0        14
─────────────────────────────────────────────────────────────────
总计            37          15          17          5        74
```

### 2.2 分类定义

| 分类 | 定义 | 典型 Skill |
|------|------|-----------|
| **核心流程** | 直接参与开发主流程的 skill | spec, design, code, test, implement |
| **管理/辅助** | 项目管理、上下文恢复、调度编排 | catchup, plan, orchestrate, status |
| **质量/验证** | 代码审查、一致性分析、验证 | verify, code-review, check-*, analyze |
| **元/工具** | 创建命令、编写 skill、元技能 | writing-skills, create-command, doctor |

---

## 三、开发阶段映射矩阵

### 3.1 阶段定义对照表

| 阶段 | Spec-First | OpenSpec | Spec Kit | Trellis | Superpowers |
|------|-----------|----------|----------|---------|-------------|
| **项目认知** | first | onboard, explore | constitution | onboard | using-superpowers |
| **需求/规格** | spec | propose → proposal | specify | brainstorm | brainstorming |
| **设计/计划** | design, task | propose → design | plan, tasks | (brainstorm 继续) | writing-plans |
| **实现/编码** | code | apply | implement | (start → implement) | executing-plans, subagent-driven-development |
| **测试/验证** | test | verify | analyze, checklist | check-*, finish-work | test-driven-development, verification-before-completion |
| **归档/复盘** | archive | archive | taskstoissues（任务外化，非归档） | record-session, update-spec | finishing-a-development-branch |
| **上下文恢复** | catchup | 无专门恢复（依赖 change/artifact 状态） | 无专门恢复（clarify 属于需求澄清） | start | - |

### 3.2 工作流模式对比

#### Spec-First: 阶段状态机驱动
```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release
           ↓            ↓          ↓          ↓             ↓            ↓
         spec Skill   design    task       code         test        archive
         FR 生成      DS 生成   TASK 生成  代码实现     TC 生成     归档复盘
```

#### OpenSpec: 工件 DAG 驱动
```
                    proposal
                        │
            ┌───────────┴───────────┐
            ↓                       ↓
         specs                   design
            │                       │
            └───────────┬───────────┘
                        ↓
                      tasks
                        │
                ┌───────┴───────┐
                ↓               ↓
            implement       verify
                │               │
                └───────┬───────┘
                        ↓
                     archive
```

#### Trellis: 任务工作流驱动
```
start → brainstorm → before-*-dev → implement → check-* → finish-work → record-session
```

#### Superpowers: 计划执行驱动
```
brainstorming → using-git-worktrees → writing-plans → [executing-plans | subagent-driven-development]
                                                          → verification-before-completion → finishing-a-development-branch
```

---

## 四、核心功能对比

### 4.1 需求分析能力

| 项目 | Skill | 方法 | 输出产物 |
|------|-------|------|---------|
| Spec-First | spec | 结构化 FR 生成、AC ID 规范、10 种歧义类型标签 | spec.md, traceability-matrix.md |
| OpenSpec | propose, new | 自然语言描述 → 工件生成 | proposal.md |
| Spec Kit | specify, clarify | 最多 3 个 `[NEEDS CLARIFICATION]` 标记、5 个优先级问题 | spec.md |
| Trellis | brainstorm | Task-first、One question per message、Diverge → Converge | prd.md |
| Superpowers | brainstorming | 2-3 个方案对比、分节设计批准 | docs/plans/*-design.md |
| Planning-Files | planning-with-files | 三文件持续规划（task_plan/findings/progress）+ 2-Action Rule | findings.md |

### 4.2 代码实现能力

| 项目 | Skill | 特点 | 约束机制 |
|------|-------|------|---------|
| Spec-First | code | Mode N (strict) / Mode I (assisted)、3-Strike Error Protocol | HARD-GATE: stage + design.md + in_progress TASK |
| OpenSpec | apply | 基于任务循环执行（读取 contextFiles、按任务推进、遇阻塞暂停） | 状态机（blocked/all_done） |
| Spec Kit | implement | TDD 方法、进度跟踪 | 前置脚本检查 |
| Trellis | (implement phase) | 规范注入、上下文 JSONL 配置 | before-*-dev 规范阅读 |
| Superpowers | executing-plans, subagent-driven-development | 批量执行 + 架构师审查检查点 | TDD 铁律、验证前禁止声称 |
| Planning-Files | planning-with-files | 文件驱动执行循环（按计划迭代） | 2-Action Rule |

### 4.3 质量验证能力

| 项目 | Skill | 验证维度 | 门禁机制 |
|------|-------|---------|---------|
| Spec-First | code-review, verify | Stage 1 合规 + Stage 2 质量 | 五步 Gate Function |
| OpenSpec | verify | Completeness + Correctness + Coherence | 三维验证报告 |
| Spec Kit | analyze, checklist | 宪法违规=CRITICAL、重复/模糊/缺口检测 | 只读分析 |
| Trellis | check-*, finish-work | 单层检查 + 跨层检查 + 完成检查 | 规范对照 + 跨层数据流 |
| Superpowers | verification-before-completion | IDENTIFY → RUN → READ → VERIFY → ONLY THEN | 证据在声明之前 |
| Planning-Files | planning-with-files | 通过 task_plan/progress 持续校验与记录 | 3-Strike Error Protocol |

### 4.4 上下文恢复能力

| 项目 | Skill | 恢复机制 | 持久化产物 |
|------|-------|---------|-----------|
| Spec-First | catchup | 5-Question Reboot Test | findings.md, task_plan.md |
| OpenSpec | 无专门恢复 Skill | 依赖 change/artifact 状态续接 | openspec/changes/* |
| Spec Kit | 无专门恢复 Skill | 依赖 spec/plan/tasks 文档续接（clarify 为需求澄清） | spec.md, plan.md, tasks.md |
| Trellis | start, record-session | workspace/ 目录、journal-N.md | .trellis/workspace/ |
| Superpowers | - | 无专门恢复 skill | - |
| Planning-Files | session-catchup.py | 5-Question Reboot Test | task_plan.md, findings.md, progress.md |

---

## 五、事实/推断边界说明

- 一至四章与六章为事实性内容，可由各项目目录结构与模板文件直接核验。
- 附录A与附录B为主观评估与借鉴建议，不作为“源码事实结论”。

---

## 附录A、设计模式亮点评估（主观判断，非源码事实）

### 5.1 Spec-First 独特设计

| 设计 | 描述 | 借鉴价值 |
|------|------|---------|
| **追溯 ID 体系** | FR/NFR/DS/TASK/TC/RFC 等可追溯 ID 类型 | ★★★★★ 全链路追溯 |
| **覆盖率矩阵** | C1-C9 双向覆盖率 + C10 规格质量审查 | ★★★★★ 质量可视化 |
| **Gate 门禁** | 五步证据铁律、硬性阻塞 | ★★★★☆ 质量保障 |
| **Stage 状态机** | 8 active + 2 terminal stages | ★★★★☆ 流程控制 |
| **确认策略** | strict/auto/assisted 三级 | ★★★☆☆ 灵活性 |

### 5.2 OpenSpec 独特设计

| 设计 | 描述 | 借鉴价值 |
|------|------|---------|
| **DAG 工件依赖** | 使能器而非门禁，支持并行 | ★★★★☆ 并行效率 |
| **Actions not Phases** | 任何时候可执行任何操作 | ★★★★☆ 迭代灵活性 |
| **Delta Specs** | ADDED/MODIFIED/REMOVED/RENAMED 操作 | ★★★★☆ 规范演进 |
| **快进模式** | /opsx:ff 一次性生成所有工件 | ★★★☆☆ 快速路径 |

### 5.3 Spec Kit 独特设计

| 设计 | 描述 | 借鉴价值 |
|------|------|---------|
| **宪法权威** | constitution.md 作为最高准则 | ★★★★☆ 规范层级 |
| **一致性分析** | 只读分析、宪法违规=CRITICAL | ★★★★☆ 质量门禁 |
| **模板驱动** | Handlebars 模板、YAML frontmatter | ★★★☆☆ 标准化 |
| **检查清单即需求测试** | checklist 验证需求质量 | ★★★★☆ 质量前移 |

### 5.4 Planning-Files 独特设计

| 设计 | 描述 | 借鉴价值 |
|------|------|---------|
| **KV-Cache 优化** | 稳定 prompt 前缀、屏蔽而非移除 | ★★★★☆ 性能优化 |
| **文件即内存** | Markdown 是磁盘上的工作记忆 | ★★★★★ 持久化策略 |
| **2-Action Rule** | 每 2 次操作后立即保存关键发现 | ★★★★☆ 上下文保护 |
| **3-Strike Protocol** | 同类错误 3 次后升级 | ★★★★☆ 错误处理 |
| **5-Question Reboot** | Where am I/going/goal/learned/done | ★★★★★ 上下文恢复 |

### 5.5 Trellis 独特设计

| 设计 | 描述 | 借鉴价值 |
|------|------|---------|
| **Read Before Write** | 所有开发前必须阅读规范 | ★★★★★ 规范遵循 |
| **上下文注入** | JSONL 文件 + Hooks 自动注入 | ★★★★☆ 自动化 |
| **跨层检查** | 数据流/复用/导入/一致性多维度 | ★★★★☆ 系统思维 |
| **break-loop** | 5 维度 Bug 分析、预防机制 | ★★★★★ 知识捕获 |
| **Human in Control** | AI 不执行 git commit | ★★★★☆ 安全边界 |

### 5.6 Superpowers 独特设计

| 设计 | 描述 | 借鉴价值 |
|------|------|---------|
| **TDD 铁律** | 无失败测试在前不得写生产代码 | ★★★★★ 质量文化 |
| **压力测试** | Academic + Pressure + Combined pressures | ★★★★☆ Skill 验证 |
| **漏洞封闭** | 关闭每个合理化漏洞、Spirit vs Letter | ★★★★★ 防御设计 |
| **两阶段审查** | 规范合规 + 代码质量分离 | ★★★★☆ 审查效率 |
| **子代理驱动** | 每任务新子代理 + 两阶段审查 | ★★★★☆ 并行开发 |

---

## 六、Skill 命名规范对比

| 项目 | 命名风格 | 示例 |
|------|---------|------|
| Spec-First | `spec-first:阶段名` | spec-first:spec, spec-first:code |
| OpenSpec | `/opsx:动作` | /opsx:propose, /opsx:apply |
| Spec Kit | `/speckit.动作` | /speckit.specify, /speckit.plan |
| Planning-Files | `/planning-with-files:*`（也可别名） | /planning-with-files:plan, /planning-with-files:start |
| Trellis | `/trellis:动作`（Codex 模板常见 `$动作`） | /trellis:start, /trellis:before-backend-dev |
| Superpowers | `动作-名词` | brainstorming, writing-plans |

---

## 七、Spec-First 能力补齐实施基线（2026-03-04 已确认）

### 7.1 决策清单

| 项目 | 决策 | 状态 |
|------|------|------|
| 优先补齐能力 | `TDD 硬门禁` + `break-loop 复盘机制` | 已确认 |
| 改动边界 | 允许文档/Skill/CLI/自动化脚本 | 已确认 |
| 门禁强度 | TDD 设为硬门禁，不满足直接阻断 | 已确认 |
| 适用范围 | 全项目启用（非单 Feature 试点） | 已确认 |
| 阶段兼容 | 保持现有 `00~07` stage，不改主流程，仅加检查点 | 已确认 |
| DAG 追溯扩展 | 本轮暂不纳入追溯矩阵 | 已确认 |
| 失败升级 | `3-Strike` 统一到 code/test/verify/archive | 已确认 |
| 验收口径 | 采用最佳实践指标（见 7.3） | 已确认 |
| 回滚策略 | 不允许按 Feature 降级门禁 | 已确认 |
| 负责人与节奏 | 采用最佳实践 RACI + 2/4/8 周节奏（见 7.2） | 已确认 |

### 7.2 2/4/8 周落地节奏（已确认定稿）

| 周期 | 目标 | 关键交付物 |
|------|------|-----------|
| Week 1-2 | 建立硬门禁最小闭环 | `code` 前置失败测试检查、门禁阻断提示、archive 引入 break-loop 模板 |
| Week 3-4 | 全链路策略统一 | `3-Strike` 统一策略落到 code/test/verify/archive，新增运行日志字段 |
| Week 5-8 | 稳定化与审计 | 指标看板、异常归因机制、门禁违规审计与月度复盘 |

### 7.3 验收指标（已确认定稿）

| 指标 | 定义 | 目标阈值 |
|------|------|---------|
| TDD 门禁拦截率 | 被门禁拦截且原因可解释的拦截占比 | `>= 95%` |
| 门禁绕过事件数 | 未满足 TDD 仍进入实现/合并的事件数 | `= 0` |
| 复盘覆盖率 | 已完成任务中生成 break-loop 复盘条目的占比 | `>= 95%` |
| 重复错误率 | 同类错误在 30 天内重复出现比例 | `<= 10%` |
| 首次验证通过率 | 首次进入 verify 即通过的任务占比 | 较基线提升 `>= 15%` |

### 7.4 责任分工（RACI，已确认定稿）

| 事项 | R | A | C | I |
|------|---|---|---|---|
| TDD 硬门禁规则 | 资深研发（CLI/Skill 维护） | 架构师 | 资深测试（QA 负责人） | 全体开发 |
| break-loop 复盘模板 | 研发流程负责人 | 架构师 | 资深测试（QA 负责人） | 全体开发 |
| 3-Strike 全链路统一 | 资深研发（CLI/Skill 维护） | 架构师 | 研发流程负责人 | 全体开发 |
| 指标与审计 | 资深测试（QA 负责人） | 架构师 | 资深研发（CLI/Skill 维护） | 全体开发 |

---

## 附录B、借鉴建议（主观判断，非源码事实）

### 7.1 高优先级借鉴

1. **Superpowers 的 TDD 铁律** → Spec-First `code` 硬门禁（本轮首要）
2. **Trellis 的 break-loop 深度分析** → Spec-First `archive` 复盘增强（本轮首要）
3. **Spec-First / Superpowers / Planning-Files 的 3-Strike 升级思路** → 全链路统一错误升级

### 7.2 中优先级借鉴

1. **Trellis 的三层检查机制** → Spec-First verify 结构增强
2. **Spec Kit 的宪法权威机制** → Spec-First constitution 层级增强
3. **Superpowers 的两阶段审查** → Spec-First code-review 优化

### 7.3 可选借鉴

1. **Planning-Files 的 KV-Cache 优化** → Spec-First 性能优化
2. **OpenSpec 的 Delta Specs** → Spec-First 规范演进机制
3. **OpenSpec 的 DAG 工件依赖** → 当前迭代暂缓（后续再评估纳入追溯矩阵）

---

## 八、事实性附录

### 8.1 参考文档链接

- Spec-First: `/Users/kuang/xiaobu/spec-first/skills/spec-first/`
- OpenSpec: `/Users/kuang/xiaobu/OpenSpec/src/core/templates/workflows/`
- Spec Kit: `/Users/kuang/xiaobu/spec-kit/templates/commands/`
- Planning-Files: `/Users/kuang/xiaobu/planning-with-files/skills/`
- Trellis: `/Users/kuang/xiaobu/Trellis/.agents/skills/`
- Superpowers: `/Users/kuang/xiaobu/superpowers/skills/`

### 8.2 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.4.2 | 2026-03-04 | RACI 角色命名定稿：统一为架构师/资深研发/资深测试（QA负责人）/研发流程负责人 |
| 1.4.1 | 2026-03-04 | 用户确认定稿：将负责人/节奏/验收指标状态由“待确认”调整为“已确认定稿” |
| 1.4.0 | 2026-03-04 | 固化用户确认的 10 项实施决策：TDD 硬门禁 + break-loop 优先，新增 2/4/8 周节奏、RACI、验收指标，DAG 明确暂缓 |
| 1.3.0 | 2026-03-03 | 三次审校：新增事实/推断边界说明，将“设计亮点评估”“借鉴建议”显式标注为主观附录 |
| 1.2.0 | 2026-03-03 | 二次审校：补齐与源码一致的命名（subagent-driven-development、finishing-a-development-branch）与 OpenSpec/Spec Kit 恢复机制口径 |
| 1.1.0 | 2026-03-03 | 审校修订：校正 Trellis 数量 17→16、总量 75→74，修正命名与流程映射偏差 |
| 1.0.0 | 2026-03-03 | 初稿，完成 6 项目 Skill 的梳理对比 |
