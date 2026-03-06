# Skill 功能对比矩阵

> **版本**: 1.4.2 | **更新日期**: 2026-03-04

---

> **事实边界说明**: 一至四章为可由项目模板/Skill 文件直接核验的事实。附录A、附录B为主观评估，不作为源码事实结论。

---

## 一、核心功能对比

### 1.1 需求分析/探索

| 项目 | Skill | 方法 | 输出产物 |
|------|-------|------|---------|
| **Spec-First** | first | quick/deep 模式并行分析 | tech-stack.md, codebase-overview.md, domain-model.md... |
| **OpenSpec** | explore | 思考伙伴式探索 | 无产物（纯探索） |
| **Spec Kit** | specify + clarify | 自然语言→规格 + 澄清问题 | spec.md, [NEEDS CLARIFICATION] 标记 |
| **Trellis** | brainstorm | 5 阶段发散收敛 | prd.md, 决策记录 |
| **Superpowers** | brainstorming | 2-3 方案对比 | design.md |
| **Planning-Files** | planning-with-files | Requirements & Discovery | task_plan.md, findings.md |

---

### 1.2 规格定义

| 项目 | Skill | 规范层级 | 追溯机制 |
|------|-------|---------|---------|
| **Spec-First** | spec | FR + AC + 追溯矩阵 | C1-C9 覆盖率 + C10 规格质量审查 |
| **OpenSpec** | propose | proposal + specs + design | DAG 依赖图 |
| **Spec Kit** | specify + plan | constitution + spec.md | 宪法权威检查 |
| **Trellis** | brainstorm | prd.md + 规范注入 | JSONL 上下文文件 |
| **Superpowers** | brainstorming + writing-plans | design.md + plan.md | 计划文档 |
| **Planning-Files** | planning-with-files | task_plan.md | 文件系统追溯 |

---

### 1.3 技术设计

| 项目 | Skill | 设计产物 | 约束验证 |
|------|-------|---------|---------|
| **Spec-First** | design | DS（设计规格） | HARD-GATE 入口守卫 |
| **OpenSpec** | propose | design.md | applyRequires 依赖 |
| **Spec Kit** | plan | data-model.md + contracts/ + quickstart.md | 宪法检查 |
| **Trellis** | before-*-dev | 规范注入 | 规范文件读取 |
| **Superpowers** | writing-plans | plan.md | 批判性审查 |
| **Planning-Files** | planning-with-files | task_plan.md 阶段结构 | 阶段验证 |

---

### 1.4 任务拆解

| 项目 | Skill | 任务组织 | 依赖管理 |
|------|-------|---------|---------|
| **Spec-First** | task | TASK + depends_on | 同 Feature 引用约束 |
| **OpenSpec** | propose / continue / ff | tasks.md | DAG 状态转换 |
| **Spec Kit** | tasks | 阶段式分解 + [P] 并行标记 | 依赖图 |
| **Trellis** | brainstorm | prd.md + 任务工作流 | Phase 阶段 |
| **Superpowers** | writing-plans | 2-5 分钟粒度步骤 | 计划文档 |
| **Planning-Files** | planning-with-files | task_plan.md 阶段 | 阶段依赖 |

---

### 1.5 代码实现

| 项目 | Skill | 实现方式 | 质量控制 |
|------|-------|---------|---------|
| **Spec-First** | code | Mode N/I + traces 注入 | 3-Strike Error Protocol |
| **OpenSpec** | apply | 任务循环 | 状态检查 |
| **Spec Kit** | implement | 阶段式执行 + TDD | lint/typecheck/test |
| **Trellis** | (工作流) | 规范注入 + 实现 | check-* 检查 |
| **Superpowers** | test-driven-development | Red-Green-Refactor | 验证证据 |
| **Planning-Files** | planning-with-files | 7 步代理循环 | 2-Action 规则 |

---

### 1.6 质量检查

| 项目 | Skill(s) | 检查类型 | 检查时机 |
|------|----------|---------|---------|
| **Spec-First** | code-review, spec-review, analyze | 两阶段审查 + 一致性分析 | 实现后/规格后 |
| **OpenSpec** | verify | 三维度验证（完整性/正确性/一致性） | 实现后 |
| **Spec Kit** | analyze | 只读一致性分析 | tasks 后 |
| **Trellis** | check-*, check-cross-layer, finish-work | 单层+跨层+完成检查 | 开发后/提交前 |
| **Superpowers** | requesting-code-review, verification-before-completion | 子代理审查 + 完成前验证 | 任务后/完成前 |
| **Planning-Files** | (Stop Hook) | check-complete.sh | 会话结束 |

---

### 1.7 测试验证

| 项目 | Skill | 测试策略 | 覆盖追踪 |
|------|-------|---------|---------|
| **Spec-First** | test | UT/IT/E2E/ST 分级 | C4/C5 覆盖率检查 |
| **OpenSpec** | (apply) | 实现中验证 | 无专门追踪 |
| **Spec Kit** | implement | TDD 支持（可选） | 无专门追踪 |
| **Trellis** | improve-ut | 单元/集成/回归范围选择 | 无专门追踪 |
| **Superpowers** | test-driven-development | Red-Green-Refactor 强制 | 测试失败验证 |
| **Planning-Files** | - | 无专门测试 Skill | - |

---

### 1.8 归档复盘

| 项目 | Skill | 归档内容 | 知识捕获 |
|------|-------|---------|---------|
| **Spec-First** | archive | 覆盖率报告 + 经验教训 | Gate 历史记录 |
| **OpenSpec** | archive, sync | delta specs 同步 | 规范演进 |
| **Spec Kit** | - | 无专门归档 Skill | - |
| **Trellis** | record-session, break-loop, update-spec | 会话记录 + 5 维度 Bug 分析 + 规范更新 | workspace 持久化 |
| **Superpowers** | finishing-a-development-branch | 4 选项交付 | - |
| **Planning-Files** | - | progress.md 会话日志 | findings.md |

---

## 二、上下文管理对比

### 2.1 上下文恢复

| 项目 | Skill | 恢复机制 | 5-Question Test |
|------|-------|---------|-----------------|
| **Spec-First** | catchup | 5 步恢复报告 + 5-Question Reboot Test | ✅ |
| **OpenSpec** | 无专门恢复 Skill | 依赖 change/artifact 状态续接 | ❌ |
| **Spec Kit** | - | 无专门恢复 Skill | ❌ |
| **Trellis** | start | get_context.py + workspace 读取 | ❌ |
| **Superpowers** | - | 无专门恢复 Skill | ❌ |
| **Planning-Files** | planning-with-files | session-catchup.py + 5-Question Reboot Test | ✅ |

---

### 2.2 规范注入

| 项目 | 注入方式 | 注入时机 | 文件格式 |
|------|---------|---------|---------|
| **Spec-First** | SKILL.md 引用 | Skill 执行时 | Markdown |
| **OpenSpec** | 工件加载 | apply 时 | Markdown |
| **Spec Kit** | 模板加载 | 命令执行时 | Markdown 模板 |
| **Trellis** | JSONL + Hooks | 自动（SessionStart + 子代理上下文注入） | JSONL |
| **Superpowers** | Skill 加载 | 调用时 | Markdown |
| **Planning-Files** | 文件读取 | Hook 触发时 | Markdown |

---

## 三、执行模式对比

### 3.1 并行执行支持

| 项目 | 并行机制 | 调度方式 |
|------|---------|---------|
| **Spec-First** | first Skill 支持 Agent 并行 | quick: 4-5 个, deep: 8 个 |
| **OpenSpec** | 无专门并行 | - |
| **Spec Kit** | [P] 标记支持并行执行 | 任务级并行 |
| **Trellis** | parallel Skill | 流水线阶段编排 |
| **Superpowers** | dispatching-parallel-agents, subagent-driven-development | 问题域分组派发 |
| **Planning-Files** | 无专门并行 | - |

---

### 3.2 错误处理

| 项目 | 错误协议 | 升级机制 |
|------|---------|---------|
| **Spec-First** | 3-Strike Error Protocol | 3 次失败后升级 |
| **OpenSpec** | 状态检查 | blocked 状态提示 |
| **Spec Kit** | 任务执行失败即中断 | 依赖人工决策与重试 |
| **Trellis** | break-loop | 5 维度分析 |
| **Superpowers** | 3-Strike (systematic-debugging) | 3+ 修复失败质疑架构 |
| **Planning-Files** | 3-Strike | 3 次失败后升级用户 |

---

## 四、安全与控制对比

### 4.1 人类控制权

| 项目 | Git 提交策略 | 审查机制 |
|------|-------------|---------|
| **Spec-First** | ✅ 可执行（`spec-first commit`） | Gate 门禁 |
| **OpenSpec** | ⚠️ 未在 OPSX 模板层硬性约束 | 工件状态检查 |
| **Spec Kit** | ⚠️ 命令模板未硬性限制 | checklist/analyze |
| **Trellis** | ❌ 明确禁止 AI 提交（record-session 前置） | check-* + finish-work |
| **Superpowers** | ⚠️ 可执行（在收尾流程中决策） | code-review + completion verification |
| **Planning-Files** | ⚠️ Skill 未硬性规定提交策略 | Stop Hook 检查 |

---

## 五、能力补齐实施基线（2026-03-04 已确认）

### 5.1 已确认约束

| 维度 | 决策 |
|------|------|
| 能力优先级 | 首先落地 `TDD 硬门禁` 与 `break-loop 复盘` |
| 改动范围 | 文档、Skill、CLI、自动化脚本均允许改动 |
| 门禁强度 | 硬门禁，不满足 TDD 直接阻断 |
| 推广范围 | 全项目启用，不做单 Feature 试点 |
| 阶段模型 | 保持 `00~07` 不变，仅新增检查点 |
| DAG 扩展 | 本轮不纳入追溯矩阵（暂缓） |
| 错误协议 | `3-Strike` 统一覆盖 code/test/verify/archive |
| 回滚策略 | 不允许 Feature 级降级 |

### 5.2 最佳实践节奏（已确认定稿）

| 节奏 | 重点动作 | 验收要点 |
|------|---------|---------|
| 2 周 | `code` 硬门禁 + `archive` 复盘模板落地 | 出现失败测试时必须阻断；复盘模板可用 |
| 4 周 | `3-Strike` 全链路统一 + 日志化 | 四阶段行为一致且可审计 |
| 8 周 | 指标稳定化 + 审计复盘常态化 | 指标连续达标，无绕过门禁 |

### 5.3 验收指标（已确认定稿）

| 指标 | 目标阈值 |
|------|---------|
| 门禁绕过事件数 | `= 0` |
| TDD 门禁拦截率（可解释） | `>= 95%` |
| break-loop 复盘覆盖率 | `>= 95%` |
| 30 天重复错误率 | `<= 10%` |
| 首次验证通过率（相对基线） | 提升 `>= 15%` |

### 5.4 RACI 角色映射（已确认定稿）

| RACI 角色 | 定义 |
|------|------|
| A（Accountable） | 架构师 |
| R（Responsible） | 资深研发（CLI/Skill 维护）或研发流程负责人（按事项分配） |
| C（Consulted） | 资深测试（QA 负责人）或研发流程负责人（按事项分配） |
| I（Informed） | 全体开发 |

---

## 附录A、综合评分（主观评估，非源码事实）

| 维度 | Spec-First | OpenSpec | Spec Kit | Trellis | Superpowers | Planning-Files |
|------|-----------|----------|----------|---------|-------------|----------------|
| **需求分析** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **追溯能力** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **质量保障** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **上下文管理** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **执行效率** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **知识捕获** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **安全控制** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 附录B、Spec-First 借鉴优先级（主观评估，非源码事实）

### 高优先级（强烈建议借鉴）

1. **Superpowers 的 TDD 铁律** → 增强 code 硬门禁（本轮首要）
2. **Trellis 的 break-loop 深度分析** → 增强 archive 复盘（本轮首要）
3. **3-Strike 全链路统一** → 统一 code/test/verify/archive 升级协议

### 中优先级（建议考虑）

1. **Trellis 的三层检查机制** → 增强 verify 流程
2. **Spec Kit 的宪法权威机制** → 增强 constitution 层级
3. **Superpowers 的两阶段审查** → 优化 code-review

### 可选借鉴

1. **Planning-Files 的 KV-Cache 优化** → 性能优化
2. **OpenSpec 的 delta specs** → 规范演进机制
3. **OpenSpec 的 DAG 工件依赖** → 本轮暂缓，后续评估
