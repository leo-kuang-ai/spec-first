# Spec-First 项目 Skill 详细列表

> **版本**: 1.1.0 | **更新日期**: 2026-03-03 | **Skill 源**: `/Users/kuang/xiaobu/spec-first/skills/spec-first/`

---

## 概述

Spec-First 项目共包含 **22 个 Skill**，采用阶段驱动的全链路研发闭环设计。

---

## Skill 列表

### 核心开发流程 Skills (8 个)

#### 1. first (00-first)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:first` |
| **描述** | 项目快速认知：quick 模式生成 4-5 份核心文档，deep 模式生成 10-11 份完整文档 |
| **触发阶段** | 任意（通常在接手项目时首次运行） |
| **确认策略** | assisted |

**执行阶段**:
- P0: 定位与校验（Greenfield/Brownfield 判断、端类型检测、幂等检测、Serena 激活）
- P1a: 技术栈识别
- P1b: Context7 映射收集（仅 deep 模式）
- P2: Agent 并行执行（quick: 4-5 个 Agent, deep: 8 个逻辑 Agent）
- P3: 汇总输出

**输出产物**:
- quick: tech-stack.md, codebase-overview.md, domain-model.md, api-docs.md, database-er.md
- deep: 上述全部 + call-graph.md, architecture.md, external-deps.md, local-setup.md, development-guidelines.md, README.md

---

#### 2. init (01-init)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:init` |
| **描述** | 定位项目根目录并初始化 Feature 工作区 |
| **触发阶段** | 任意（通常在 `00_init` 之前） |
| **确认策略** | strict |

**执行阶段**:
- P0: 定位项目根目录，校验 00-first 已完成
- P1: 读取 `.spec-first/layer2/*.yaml` 平台模板
- P2: 收集初始化参数
- P3: 参数确认
- P4: 执行 `spec-first init ...`
- P5: 验证阶段，输出摘要

**输出路径**:
- `specs/{featureId}/stage-state.json`
- `specs/{featureId}/constitution.md`
- `specs/{featureId}/traceability-matrix.md`
- `.spec-first/current`
---

#### 3. spec (03-spec)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:spec` |
| **描述** | 定位 Feature 并校验阶段为需求规格（01_specify） |
| **触发阶段** | 01_specify |
| **确认策略** | strict/auto/assisted |

**执行阶段**:
- P0: 定位 Feature，校验阶段为 01_specify
- P1: 加载 constitution.md 及矩阵中已有 FR
- P2: 生成 FR 定义（ID、标题、验收标准）
- P3: 与用户确认 FR 列表
- P4: 将 FR 写入 traceability-matrix.md
- P5: 执行 gate check 校验

**核心规则**:
- 字面即精神原则
- 反合理化守卫
- 结构化歧义消解（10 种歧义类型标签）
- AC ID 规范：`AC-<ABBR>-<FRSEQ>-<NN>`
---

#### 4. design (04-design)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:design` |
| **描述** | 定位 Feature 并校验阶段为技术设计（02_design） |
| **触发阶段** | 02_design |
| **确认策略** | strict |

**执行阶段**:
- P0: 定位 Feature，校验阶段为 02_design
- P1: 从矩阵加载 FR，读取 constitution.md
- P2: 生成 DS（设计规格）条目，映射到 FR
- P3: 与用户确认设计决策
- P4: 将 DS 写入矩阵，创建设计文档
- P5: 执行 metrics coverage 检查

**HARD-GATE 入口守卫**:
- 当前阶段为 `02_design`
- `spec.md` 已存在且可读取
---

#### 5. task (06-task)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:task` |
| **描述** | 定位 Feature 并校验阶段为任务拆解（03_plan） |
| **触发阶段** | 03_plan |
| **确认策略** | assisted |

**执行阶段**:
- P0: 定位 Feature，校验阶段为 03_plan
- P1: 从矩阵加载 FR 和 DS 条目
- P2: 生成 TASK 拆解，映射到 FR
- P3: 与用户确认任务计划
- P4: 将 TASK 写入矩阵和 task_plan.md
- P5: 执行 metrics coverage 检查

**TASK 字段语义**:
- `Owner`: 单一责任人
- `Status`: planned | in_progress | blocked | complete | verified
- `depends_on`: 仅允许引用同一 Feature 下 TASK ID
---

#### 6. code (07-code)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:code` |
| **描述** | 定位进行中的 TASK 并执行代码实现 |
| **触发阶段** | 04_implement |
| **确认策略** | strict（Mode N）/ assisted（Mode I） |

**执行阶段**:
- P0: 定位 Feature，校验阶段为 04_implement
- P1: 加载 TASK 上下文、关联的 FR/DS
- P2: 按规格约束生成实现代码
- P3: 与用户确认代码变更
- P4: 写入代码文件，更新 task_plan.md
- P5: 自动注入 traces trailer

**HARD-GATE 入口守卫**:
- 当前阶段为 `04_implement`
- 当前 Feature 存在 `design.md`
- `task_plan.md` 至少有 1 条 `in_progress` TASK

**核心规则**:
- 3-Strike Error Protocol（同类错误失败 3 次后必须升级）
- Worktree First（高风险操作建议在独立 worktree 执行）
---

#### 7. test (09-test)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:test` |
| **描述** | 定位 Feature 并校验阶段为验证测试（05_verify） |
| **触发阶段** | 05_verify |
| **确认策略** | assisted |

**执行阶段**:
- P0: 定位 Feature，校验阶段为 05_verify
- P1: 从矩阵加载 FR、AC 及已有 TC
- P2: 生成 TC（测试用例）条目，映射到 FR/AC
- P3: 与用户确认测试计划
- P4: 将 TC 写入矩阵，生成测试脚手架文件
- P5: 执行 metrics coverage 检查 C4/C5

**TC 级别**: UT（单元测试）/ IT（集成测试）/ E2E（端到端）/ ST（系统测试）
---

#### 8. archive (10-archive)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:archive` |
| **描述** | 定位 Feature 并校验阶段为归档复盘（06_wrap_up） |
| **触发阶段** | 06_wrap_up |
| **确认策略** | strict |

**执行阶段**:
- P0: 定位 Feature，校验阶段为 06_wrap_up
- P1: 加载全部交付物、矩阵、Gate 历史
- P2: 生成归档摘要（覆盖率报告、经验教训）
- P3: 与用户确认归档内容
- P4: 写入归档文档并执行组合门槛归档
- P5: Gate 通过后推进阶段至 07_release

**归档组合门槛**: 内容类型 + 风险项 + 规模阈值
---

### 管理与辅助 Skills (6 个)

#### 9. catchup (02-catchup)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:catchup` |
| **描述** | 定位当前 Feature 并恢复上下文 |
| **触发阶段** | 任意 |
| **确认策略** | assisted |

**5-Question Reboot Test**:
1. 当前 Feature 与阶段是什么？
2. 当前 in_progress TASK 是什么？
3. 上次中断前最后一个有效结论是什么？
4. 当前最大阻塞是什么？
5. 下一步最小可执行命令是什么？
---

#### 10. plan (11-plan)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:plan` |
| **描述** | 定位 Feature 并加载当前阶段计划 |
| **触发阶段** | 任意（编排层 Skill） |
| **确认策略** | assisted |

**职责边界**: 产出计划与风险评估，不推进阶段
---

#### 11. verify (12-verify)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:verify` |
| **描述** | 定位 Feature 并执行阶段验收校验 |
| **触发阶段** | 任意（编排层 Skill） |
| **确认策略** | auto |

**证据铁律（五步 Gate Function）**:
1. IDENTIFY — 什么命令能证明？
2. RUN — 执行完整命令
3. READ — 完整输出，检查退出码
4. VERIFY — 输出是否确认了声明？
5. ONLY THEN — 发出声明
---

#### 12. orchestrate (13-orchestrate)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:orchestrate` |
| **描述** | 定位 Feature 并加载当前状态执行编排 |
| **触发阶段** | 任意（主编排 Skill） |
| **确认策略** | strict |

**调度协议（Stage -> Skill 映射）**:

| 当前阶段 | 调度 Skill |
|---------|-----------|
| 00_init | 无（直接 verify -> advance） |
| 01_specify | 03-spec |
| 02_design | 04-design |
| 03_plan | 06-task |
| 04_implement | 07-code |
| 05_verify | 09-test |
| 06_wrap_up | 10-archive |
---

#### 13. status (14-status)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:status` |
| **描述** | 定位当前 Feature 并输出状态概览 |
| **触发阶段** | 任意 |
| **确认策略** | auto |
---

#### 14. doctor (15-doctor)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:doctor` |
| **描述** | 定位项目与宿主配置并执行环境诊断 |
| **触发阶段** | 任意 |
| **确认策略** | assisted |

**检查范围**: Node、Git、hooks、config、Gate 降级、文件膨胀、MCP/skills 健康检查
---

### 质量与验证 Skills (5 个)

#### 15. code-review (08-code-review)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:code-review` |
| **描述** | 定位变更范围并执行代码审查 |
| **触发阶段** | 04_implement（code Skill 之后） |
| **确认策略** | assisted |

**两阶段审查协议**:
- Stage 1: 合规审查（traces 完整性、验证证据新鲜度、变更符合流程）
- Stage 2: 质量审查（SOLID / 安全 / 性能 / 测试）
---

#### 16. spec-review (20-spec-review)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:spec-review` |
| **描述** | 定位 Feature 并执行需求规格质量审查（C10） |
| **触发阶段** | 01_specify（可在 02_design 前重复执行） |
| **确认策略** | assisted |
---

#### 17. analyze (21-analyze)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:analyze` |
| **描述** | 执行跨产物一致性分析并生成分析报告 |
| **触发阶段** | 建议在 03_plan 前后执行 |
| **确认策略** | assisted |

**严重度分级**: CRITICAL / HIGH / MEDIUM / LOW
---

#### 18. sync (16-sync)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:sync` |
| **描述** | 定位 Feature 并同步追踪矩阵与状态 |
| **触发阶段** | 任意 |
| **确认策略** | assisted |
---

#### 19. research (05-research)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:research` |
| **描述** | 定位 Feature 上下文并生成调研结论 |
| **触发阶段** | 任意 |
| **确认策略** | assisted |

**2-Action Rule**: 每连续完成 2 个关键动作后，必须把结论写入 `findings.md`
---

### Feature 管理 Skills (3 个)

#### 20. feature-list (17-feature-list)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:feature-list` |
| **描述** | 列出当前项目全部 Feature |
| **触发阶段** | 任意 |
| **确认策略** | auto |
---

#### 21. feature-switch (18-feature-switch)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:feature-switch` |
| **描述** | 切换当前 Feature 上下文（更新 .spec-first/current） |
| **触发阶段** | 任意 |
| **确认策略** | assisted |
---

#### 22. feature-current (19-feature-current)
| 属性 | 值 |
|------|-----|
| **名称** | `spec-first:feature-current` |
| **描述** | 查看当前 Feature 与阶段信息 |
| **触发阶段** | 任意 |
| **确认策略** | auto |
---

---

## 阶段与 Skill 映射

| 阶段 | 主 Skill | 辅助 Skill |
|------|---------|-----------|
| 00_init | init, first | doctor, status |
| 01_specify | spec | spec-review, research |
| 02_design | design | research |
| 03_plan | task | analyze |
| 04_implement | code | code-review |
| 05_verify | test | verify |
| 06_wrap_up | archive | - |
| 任意 | catchup, plan, orchestrate, sync | feature-list, feature-switch, feature-current |
