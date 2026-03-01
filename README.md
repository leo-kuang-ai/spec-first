# Spec-First — AI 时代的规范驱动研发流程引擎

![Status](https://img.shields.io/badge/状态-活跃维护-brightgreen) ![Version](https://img.shields.io/badge/版本-v0.5.70-blue) ![Node](https://img.shields.io/badge/Node.js-≥20_LTS-green) ![TypeScript](https://img.shields.io/badge/TypeScript-≥5.4-3178c6)

**Spec-First 是面向 AI 时代的规范驱动研发流程引擎**——以结构化规范为单一真理源，通过全链路追踪 + AI 辅助 + 自动化门禁，将"需求→设计→编码→测试→交付"从人工驱动升级为规范驱动。

---

## 目录

- [核心价值](#核心价值)
- [设计原则](#设计原则)
- [核心思想](#核心思想)
- [核心优势](#核心优势)
- [生态对比](#生态对比)
- [快速开始](#快速开始)
- [名词说明](#名词说明)
- [核心架构](#核心架构)
- [研发流程](#研发流程)
- [阶段状态机](#阶段状态机)
- [追踪体系](#追踪体系)
- [Gate 校验](#gate-校验)
- [变更与缺陷管理](#变更与缺陷管理)
- [覆盖率指标](#覆盖率指标)
- [Skill 体系](#skill-体系)
- [CLI 命令](#cli-命令)
- [技术栈与目录](#技术栈与目录)
- [核心类型](#核心类型)
- [相关文档](#相关文档)

---

## 核心价值

| 传统研发 | Spec-First |
|---------|-----------|
| 需求散落在文档/IM/口头 | 规范即单一真理源 |
| 追踪靠人工维护 | 全链路自动追踪 |
| 质量靠人工评审 | Gate 自动门禁 |
| AI 辅助碎片化 | 结构化上下文注入 |

---

## 设计原则

| 原则 | 说明 |
|------|------|
| **规范即契约** | 所有开发活动以规范为准，规范是团队协作的唯一真理源 |
| **全链路追溯** | 从需求到上线，每个环节都可追溯到对应规范 |
| **自动化校验** | 规范可被工具自动解析和校验，减少人工审查成本 |
| **结构化定义** | 采用标准化的规范格式，确保跨项目一致性 |

---

## 核心思想

### 为什么需要 Spec-First？

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              传统研发 vs Spec-First                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  传统研发痛点                          Spec-First 解决方案                           │
│  ──────────────                        ────────────────────                          │
│                                                                                     │
│  ❌ 需求变更无追溯                     ✅ 每个变更都有 RFC 记录                      │
│  ❌ 代码与文档不同步                   ✅ 规范是唯一真理源，代码必须对齐              │
│  ❌ 测试覆盖不完整                     ✅ TC 必须关联 FR，覆盖率自动计算              │
│  ❌ 上线质量靠人工把关                 ✅ Gate 门禁自动阻断不合格产物                 │
│  ❌ AI 辅助缺乏上下文                  ✅ 结构化 Context Pack 注入完整上下文          │
│  ❌ 返工原因无法定位                   ✅ 追踪矩阵清晰展示问题根源                    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 核心理念

| 理念 | 说明 |
|------|------|
| **规范先行** | 先定义规范，再进行实现。规范是开发的输入，而非输出 |
| **双向追溯** | 正向：需求是否被实现；反向：实现是否有需求依据 |
| **门禁驱动** | 每个阶段结束必须通过 Gate 校验，不合格不得推进 |
| **AI 原生** | 结构化规范天然适配 AI 理解，实现高效人机协作 |

### 运作机制

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Spec-First 运作机制                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│                              ┌─────────────┐                                        │
│                              │   规范      │                                        │
│                              │ (Single     │                                        │
│                              │  Source of  │                                        │
│                              │  Truth)     │                                        │
│                              └──────┬──────┘                                        │
│                                     │                                               │
│           ┌─────────────────────────┼─────────────────────────┐                    │
│           │                         │                         │                    │
│           ▼                         ▼                         ▼                    │
│    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐              │
│    │   Skill     │          │    CLI      │          │   Gate      │              │
│    │   层        │          │    层       │          │   门禁      │              │
│    │             │          │             │          │             │              │
│    │ 流程编排    │          │ 原子能力    │          │ 质量把控    │              │
│    │ 内容生成    │          │ 确定性执行  │          │ 自动阻断    │              │
│    │ 交互引导    │          │ 状态管理    │          │ 豁免机制    │              │
│    └──────┬──────┘          └──────┬──────┘          └──────┬──────┘              │
│           │                        │                        │                      │
│           └────────────────────────┼────────────────────────┘                      │
│                                    │                                               │
│                                    ▼                                               │
│                           ┌─────────────┐                                          │
│                           │  追踪矩阵   │                                          │
│                           │  度量指标   │                                          │
│                           │  历史记录   │                                          │
│                           └─────────────┘                                          │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 核心优势

### 六大核心优势

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Spec-First 六大核心优势                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  1️⃣ 全链路覆盖                                                               │   │
│  │  8+2 阶段完整覆盖：init → specify → design → plan → implement               │   │
│  │                → verify → wrap_up → release → done                          │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  2️⃣ 双向追踪                                                                 │   │
│  │  正向：需求是否被实现（C1-C6 覆盖率）                                         │   │
│  │  反向：实现是否有需求依据（C7-C9 合规率）                                     │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  3️⃣ Gate 门禁                                                                │   │
│  │  自动化质量把控：PASS / PASS_WITH_WAIVER / FAIL                              │   │
│  │  不合格产物自动阻断，不得推进到下一阶段                                       │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  4️⃣ AI 原生集成                                                              │   │
│  │  Context Pack 结构化注入：spec + design + task + contracts                  │   │
│  │  AI 辅助不再碎片化，而是基于完整上下文的精准协作                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  5️⃣ 企业级管理                                                               │   │
│  │  RFC 分级变更管理（Critical/Major/Minor）                                    │   │
│  │  缺陷 S1-S4 分级响应（立即 → 4h → 24h → 下迭代）                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  6️⃣ 双层架构                                                                 │   │
│  │  Skill 层：流程编排、交互引导、内容生成（21 个 Skill）                        │   │
│  │  CLI 层：确定性原子能力、状态管理（19 个命令）                                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 量化指标

| 指标 | 数值 | 说明 |
|------|------|------|
| 阶段覆盖 | 10 个 | 8 个主阶段 + 2 个终态 |
| CLI 命令 | 19 个 | 确定性原子能力 |
| Skill 数量 | 21 个 | 流程编排能力 |
| 覆盖率指标 | 9 项 | C1-C9 双向追踪 |
| Gate 状态 | 3 种 | PASS / WAIVER / FAIL |
| RFC 级别 | 3 级 | Critical / Major / Minor |
| 缺陷等级 | 4 级 | S1-S4 分级响应 |
| 追踪 ID | 5 种 | FR / DS / TASK / TC / RFC |
| 归档清单 | 19 项 | 完整验收标准 |

### ROI 分析

| 场景 | 传统方式 | Spec-First | 提升 |
|------|----------|------------|------|
| 需求变更追溯 | 2-4 小时 | 5 分钟 | **95%↓** |
| 缺陷根因定位 | 1-2 天 | 30 分钟 | **90%↓** |
| 上线质量评审 | 半天 | 自动化 | **80%↓** |
| 新人上手时间 | 2 周 | 3 天 | **80%↓** |
| AI 协作效率 | 低（重复解释） | 高（上下文注入） | **3x↑** |

---

## 生态对比

### 框架概览

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              规范驱动开发生态全景                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           全链路研发引擎                                      │   │
│  │  ★ Spec-First                                                               │   │
│  │  阶段状态机 + Gate门禁 + 追踪矩阵 + RFC分级 + 缺陷管理                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                 │
│  │   规范框架        │  │   开发技能库      │  │   上下文工程      │                 │
│  │  ◆ OpenSpec      │  │  ◆ Superpowers   │  │  ◆ Planning-Files│                 │
│  │  变更依赖图       │  │  TDD + Subagent  │  │  3-File模式      │                 │
│  │  栈感知校验       │  │  两阶段审查      │  │  会话恢复        │                 │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘                 │
│                                                                                     │
│  ┌──────────────────┐                                                              │
│  │   规范工具包      │                                                              │
│  │  ◆ Spec Kit      │                                                              │
│  │  多AI支持        │                                                              │
│  │  技术栈无关      │                                                              │
│  └──────────────────┘                                                              │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 详细功能对比

| 维度 | Spec-First | OpenSpec | Spec Kit | Superpowers | Planning-Files |
|------|------------|----------|----------|-------------|----------------|
| **定位** | 全链路研发引擎 | AI原生规范框架 | 规范驱动工具包 | 开发技能库 | 文件式规划插件 |
| **宿主支持** | Claude Code + Codex | 多 AI 工具 | 18+ AI 工具 | Claude Code 优先 | 15+ IDE |
| **流程模型** | 8+2 阶段状态机 | proposal→specs→design→tasks | constitution→specify→plan→tasks | brainstorm→plan→implement | 3-file 模式 |
| **阶段覆盖** | init→release→done | changes 生命周期 | feature 完整周期 | 开发迭代周期 | 任务执行周期 |
| **追踪体系** | FR→DS→TASK→PR→TC + V-Model 四层 | dependsOn + provides | 规范→任务 + V-Model 扩展 | 计划→执行 | task_plan + findings |
| **ID 系统** | 5 种类型 + V-Model ID (REQ/SYS/ARCH/MOD) | 变更依赖图 | 自动编号分支 + V-Model ID | 任务清单 | Phase 标记 |
| **质量门禁** | Gate (3态) + HARD-GATE | 栈感知校验 | checklist + spec-review | 两阶段 Code Review | 3-strike 协议 |
| **变更管理** | RFC 分级 + 审批 | proposal→approved→closed | — | — | — |
| **缺陷管理** | S1-S4 分级 + SLA | — | — | 系统调试 | 错误日志 |
| **覆盖率度量** | 9 项 (C1-C9) + V-Model 四矩阵 | — | — | — | — |
| **AI 行为约束** | 反合理化 + 字面即精神 | — | WHAT/HOW 分离 | 反合理化 + 证据铁律 | — |
| **AI 上下文** | Context Pack <2KB + 渐进式披露 | OPSX 依赖解析 | Progressive Disclosure | Fresh Context Per Task | 文件系统即内存 |
| **会话恢复** | catchup + 5-Question (计划中) | — | Agent 上下文同步 | — | 自动恢复 + 5-Question |
| **并行执行** | [P] 标记 + subagent + [US] 故事 | — | [P] + [US#] 标记 | subagent-driven | — |
| **Hook 机制** | PreToolUse + PostToolUse + Stop | — | — | Session Hook | PreToolUse + PostToolUse + Stop |
| **扩展系统** | Extension System ✅ | — | Extension System | — | — |
| **调试流程** | 系统化调试 + 3-Strike | — | — | 系统化调试 | 3-strike 协议 |
| **工作区隔离** | Worktree First ✅ | — | — | Worktree First | — |
| **规范质量** | Checklist + 歧义分类法 ✅ | — | Checklist + Clarify | — | — |

### 框架深度解析

#### Spec-First — 全链路研发引擎

```text
核心优势:
├── 8+2 阶段完整覆盖（唯一覆盖 release→done 终态）
├── 双向追踪（C1-C6 正向覆盖率 + C7-C9 反向合规率）
├── Gate 三态门禁（PASS / PASS_WITH_WAIVER / FAIL）
├── RFC 分级变更管理（Critical/Major/Minor）
├── 缺陷 S1-S4 分级响应（立即→4h→24h→下迭代）
└── 21 Skill + 19 CLI 命令

适用场景:
• 企业级研发流程标准化
• 需要完整追溯链的合规项目
• 多团队协作的规范化管理
```

#### OpenSpec — AI 原生规范框架

```text
核心优势:
├── 变更依赖图（dependsOn + provides）
├── 栈感知校验（dependency-aware validation）
├── OPSX Schema（动态工作流定义）
├── 多 AI 工具兼容
└── JSON 输出支持 CI/CD

工作流:
proposal → specs/ → design → tasks → archive/

适用场景:
• 渐进式功能迭代
• 复杂依赖关系的变更管理
• 需要 CI/CD 集成的自动化流程
```

#### Spec Kit — 规范驱动工具包

```text
核心优势:
├── 多 AI 编码助手支持（Claude/Copilot/Gemini/Cursor）
├── 技术栈无关的规范定义
├── 自动生成分支 + 规格文件 + 检查清单
├── 动态澄清问题（Dynamic Clarification Questions）
└── 渐进式披露（Progressive Disclosure）

工作流:
/speckit.constitution → /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement

适用场景:
• 新项目快速启动
• 多 AI 工具混用团队
• 技术栈多样的项目
```

#### Superpowers — 开发技能库

```text
核心优势:
├── TDD 最佳实践（RED-GREEN-REFACTOR）
├── Subagent 并行执行
├── 两阶段代码审查（Spec合规 → 代码质量）
├── "Spirit vs Letter" 原则
├── HARD-GATE 硬守卫模式
└── CSO（Claude Search Optimization）

工作流:
brainstorm → plan → implement（subagent-driven）

适用场景:
• 提升开发效率
• TDD 实践落地
• 复杂任务的并行处理
```

#### Planning-with-Files — 文件式规划

```text
核心优势:
├── 3-File 模式（task_plan.md + findings.md + progress.md）
├── 上下文持久化（Filesystem as External Memory）
├── 会话自动恢复（SessionStart Hook）
├── 2-Action Rule（每2次操作后强制持久化）
├── Stop Hook 完成度守门
└── 5-Question Reboot Test（恢复质量校验）

核心理念:
Context Window = RAM（易失），Filesystem = Disk（持久）

适用场景:
• 复杂任务管理
• 长周期开发的上下文保持
• 会话中断后的快速恢复
```

### 集成状态分析

> **重要说明**: Spec-First 正在系统性地集成各框架的核心优势。以下是详细的集成状态分析。

#### ✅ 已集成优势

| 来源框架 | 集成的优势 | 集成位置 | 验证状态 |
|---------|-----------|---------|---------|
| **Superpowers** | 反合理化守卫表 | 03-spec, 07-code SKILL.md | ✅ 已实现 |
| **Superpowers** | "字面即精神"原则 | 03-spec, 04-design, 07-code SKILL.md | ✅ 已实现 |
| **Superpowers** | HARD-GATE 硬守卫模式 | 07-code SKILL.md P1-19 | ✅ 已实现 |
| **Superpowers** | 3-Strike Error Protocol | 07-code SKILL.md | ✅ 已实现 |
| **Superpowers** | 系统化调试流程 | 07-code SKILL.md | ✅ 已实现 |
| **Superpowers** | 两阶段代码审查 | 08-code-review SKILL.md | ✅ 已实现 |
| **Superpowers** | Graphviz 决策流程图 | 13-orchestrate SKILL.md | ✅ 已实现 |
| **Planning-with-Files** | 2-Action Rule 强制持久化 | 07-code SKILL.md | ✅ 已实现 |
| **Planning-with-Files** | Read/Write 决策矩阵 | 07-code SKILL.md | ✅ 已实现 |
| **Planning-with-Files** | 文件系统即外部记忆 | 07-code SKILL.md, SHARED.md | ✅ 已实现 |
| **Planning-with-Files** | Stop Hook 完成度守门 | stop-guard.sh Hook | ✅ 已实现 |
| **Planning-with-Files** | PreToolUse 注意力刷新 | task-context.sh Hook | ✅ 已实现 |
| **Spec Kit** | "英语单元测试"式 Checklist | 20-spec-review SKILL.md | ✅ 已实现 |
| **Spec Kit** | 结构化歧义消解（10 类分类法） | 03-spec SKILL.md | ✅ 已实现 |
| **Spec Kit** | 跨产物一致性分析 | 21-analyze SKILL.md | ✅ 已实现 |
| **Spec Kit** | 动态 Prompt 组装 | prompt-assembler | ✅ 已实现 |
| **Spec Kit** | 用户故事组织 + [P] 并行标记 | 06-task SKILL.md | ✅ 已实现 |
| **Spec Kit** | V-Model 四层配对追踪 | layer2/v-model.yaml | ✅ 已实现 |
| **Spec Kit** | 扩展系统底座 | extensions/extension.yaml | ✅ 已实现 |
| **OpenSpec** | Context Pack 上下文注入 | ai context 命令 | ✅ 已实现 |

#### 🚧 集成中的优势

| 来源框架 | 待集成的优势 | 计划集成位置 | 优先级 |
|---------|-------------|-------------|--------|
| **OpenSpec** | 变更依赖图（dependsOn + provides）| M2 trace-engine | P2 |
| **OpenSpec** | 栈感知校验 | M3 gate-engine | P2 |
| **OpenSpec** | OPSX 动态 Schema | skill-runtime | P3 |
| **Spec Kit** | 18+ Agent 无关架构 | agent-config 层 | P2 |
| **Spec Kit** | Progressive Disclosure | context-pack 引擎 | P2 |
| **Superpowers** | Fresh Context Per Task | orchestrate subagent | P2 |
| **Planning-with-Files** | 5-Question Reboot Test | catchup skill | P1 |
| **Planning-with-Files** | Session Recovery 自动检测 | SessionStart Hook | P1 |

#### ⏳ 计划中的优势

| 来源框架 | 计划集成的优势 | 预计版本 | 备注 |
|---------|--------------|---------|------|
| **OpenSpec** | 变更管理可视化 | v0.6.x | 依赖图渲染 |
| **Spec Kit** | Constitution 语义版本管理 | v0.6.x | 版本追踪 |
| **Spec Kit** | Handoff 接力机制 | v0.5.x | Next Steps 输出 |
| **Superpowers** | Session Hook 决策树 | v0.6.x | 1% 规则 |
| **Planning-with-Files** | Context Reduction 分层压缩 | v0.7.x | Token 效率优化 |

### 核心差异分析

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Spec-First 独有优势                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ✓ 8+2 阶段完整覆盖（唯一含 release→done 终态）                                     │
│  ✓ 双向追踪（C1-C9 覆盖率 + 合规率）                                                │
│  ✓ Gate 三态门禁（PASS / PASS_WITH_WAIVER / FAIL）                                  │
│  ✓ RFC 分级变更管理（Critical/Major/Minor）                                         │
│  ✓ 缺陷 S1-S4 分级响应（立即→4h→24h→下迭代）                                        │
│  ✓ 19 项归档验收清单                                                                │
│  ✓ 21 Skill + 19 CLI 命令完整工具链                                                 │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 集成策略

Spec-First 采用**"核心自研 + 边界借鉴"**的集成策略：

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              集成策略说明                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  1. 流程引擎自研（核心优势）                                                        │
│  ─────────────────────                                                              │
│  • 8+2 阶段状态机                                                                   │
│  • Gate 门禁系统                                                                    │
│  • 追踪矩阵 + 覆盖率度量                                                             │
│  • RFC/Defect 变更管理                                                              │
│                                                                                     │
│  2. AI 行为约束借鉴（Superpowers）                                                  │
│  ───────────────────────────────────────                                            │
│  • 反合理化守卫表 → 封堵 AI 逃逸路径                                                 │
│  • "字面即精神"原则 → 杜绝灵活变通借口                                               │
│  • HARD-GATE 模式 → 入口阻断防止跳过阶段                                             │
│  • 3-Strike Protocol → 防止无限重试                                                  │
│                                                                                     │
│  3. 上下文工程借鉴（Planning-with-Files）                                           │
│  ────────────────────────────────────────                                           │
│  • 2-Action Rule → 强制持久化                                                        │
│  • Read/Write 决策矩阵 → 减少无效 I/O                                               │
│  • Stop Hook → 防止提前收工                                                          │
│  • PreToolUse Hook → 注意力刷新                                                      │
│                                                                                     │
│  4. 规范质量工程借鉴（Spec Kit）                                                     │
│  ────────────────────────────────                                                   │
│  • "英语单元测试"式 Checklist → 规范质量门禁                                         │
│  • 10 类歧义分类法 → 结构化消解歧义                                                  │
│  • V-Model 四层追踪 → 企业级合规支持                                                 │
│  • 扩展系统 → 社区贡献机制                                                           │
│                                                                                     │
│  5. 变更管理借鉴（OpenSpec）                                                        │
│  ────────────────────────────────                                                   │
│  • Context Pack → 结构化上下文注入                                                  │
│  • 依赖图 → 待集成                                                                   │
│  • 栈感知校验 → 待集成                                                               │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 场景化选型指南

| 场景 | 首选 | 备选 | 理由 |
|------|------|------|------|
| **企业级研发流程** | Spec-First | OpenSpec | 完整阶段管理、Gate 门禁、追踪矩阵、RFC 审批 |
| **渐进式功能迭代** | OpenSpec | Spec-First | 变更依赖管理、栈感知校验、OPSX 动态工作流 |
| **新项目快速启动** | Spec Kit | Superpowers | 规范→代码生成、多 AI 支持、技术栈无关 |
| **提升开发效率** | Superpowers | Planning-Files | TDD 流程、Subagent 并行、两阶段审查 |
| **复杂任务管理** | Planning-Files | Superpowers | 上下文持久化、会话恢复、完成度守门 |
| **多 AI 工具团队** | Spec Kit | OpenSpec | Claude/Copilot/Gemini 兼容 |
| **合规追溯项目** | Spec-First | — | 9 项覆盖率指标、完整追踪链 |

### 组合方案

| 组合 | 优势 | 适用场景 |
|------|------|----------|
| **Spec-First + Superpowers** | 流程引擎 + 开发技能增强 | 企业级开发 + 高效 TDD |
| **Spec-First + Planning-Files** | 流程引擎 + 上下文工程 | 长周期复杂项目 |
| **Spec Kit + Superpowers** | 多 AI 支持 + 高效开发 | 混合 AI 工具团队 |
| **OpenSpec + Planning-Files** | 变更管理 + 上下文持久 | 渐进式迭代项目 |

### 技术栈兼容性

| 框架 | Node.js | Python | Go | Rust | 前端 | 后端 |
|------|---------|--------|-----|------|------|------|
| Spec-First | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| OpenSpec | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Spec Kit | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Superpowers | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Planning-Files | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

> 所有框架均为技术栈无关的设计，可适配任意编程语言和框架

---

## 快速开始

### 安装

```bash
# 全局安装
npm install -g spec-first

# 或使用 pnpm
pnpm add -g spec-first
```

### 初始化项目

```bash
# 1. 创建新 Feature
spec-first init --feat AUTH --mode N --size M --platforms app,h5

# 2. 查看当前状态
spec-first stage current

# 3. 启动可视化面板（可选）
spec-first viewer --open
```

### 使用 Skill 驱动开发

在 Claude Code 或 Codex CLI 中使用：

```bash
# Feature 启动
/spec-first:init

# 需求规格化
/spec-first:spec

# 技术设计
/spec-first:design

# 任务拆解
/spec-first:task

# 代码实现
/spec-first:code

# 测试验证
/spec-first:test

# 归档复盘
/spec-first:archive

# 自动编排（推荐）
/spec-first:orchestrate
```

### 常用 CLI 命令

```bash
# ID 生成与校验
spec-first id next FR AUTH                    # 生成下一个 FR ID
spec-first id next TASK AUTH                  # 生成下一个 TASK ID
spec-first id list --feature AUTH-20260227-001

# Gate 校验
spec-first gate check <featureId>             # 校验当前阶段 Gate
spec-first gate conditions <featureId>        # 查看 Gate 条件定义

# 阶段管理
spec-first stage current <featureId>          # 查看当前阶段
spec-first stage advance <featureId>          # 推进到下一阶段

# 追踪矩阵
spec-first matrix check <featureId>           # 校验追踪矩阵完整性
spec-first matrix export <featureId>          # 导出追踪矩阵

# 覆盖率与度量
spec-first metrics coverage <featureId>       # 计算覆盖率
spec-first metrics health <featureId>         # 健康分评估

# 环境诊断
spec-first doctor                             # 环境诊断与修复
spec-first update                             # 升级刷新 Skill/MCP/Hooks
```

---

## 名词说明

### 核心概念

| 术语 | 英文 | 定义 | 示例 |
|------|------|------|------|
| **Feature** | Feature | 一个独立的功能单元，是 Spec-First 管理的基本单位 | `FSREQ-20260227-AUTH-001`（用户认证功能） |
| **Stage** | Stage | 研发流程的阶段，共 8+2 个阶段 | `01_specify`（需求规格化阶段） |
| **Gate** | Gate | 阶段质量门禁，控制是否可以推进到下一阶段 | `gate check` 返回 `PASS` 才能推进 |
| **Skill** | Skill | AI 驱动的流程编排能力，负责内容生成和交互引导 | `/spec-first:code` 执行代码实现 |
| **CLI** | Command Line Interface | 命令行工具，提供确定性原子能力 | `spec-first id next FR AUTH` |

### 追踪 ID 体系

| 术语 | 格式 | 用途 | 示例 |
|------|------|------|------|
| **FR** | `FR-<ABBR>-NNN` | 功能需求（Functional Requirement） | `FR-AUTH-001`：短信登录功能 |
| **NFR** | `NFR-<ABBR>-NNN` | 非功能需求（Non-Functional Requirement） | `NFR-AUTH-001`：登录响应时间 < 3s |
| **DS** | `DS-<ABBR>-NNN` | 设计规格（Design Specification） | `DS-AUTH-001`：短信验证 API 设计 |
| **TASK** | `TASK-<ABBR>-NNN` | 实现任务 | `TASK-AUTH-001`：实现短信发送 API |
| **TC** | `TC-<LVL>-<ABBR>-NNN` | 测试用例（Test Case） | `TC-E2E-AUTH-001`：E2E 登录测试 |
| **RFC** | `RFC-<ABBR>-NNN` | 变更请求（Request For Change） | `RFC-AUTH-001`：增加邮箱登录 |

### Gate 相关

| 术语 | 定义 |
|------|------|
| **Gate** | 阶段质量门禁，校验当前阶段是否满足推进条件 |
| **GateStatus** | 门禁状态：`PASS`（通过）、`PASS_WITH_WAIVER`（带豁免通过）、`FAIL`（失败） |
| **Waiver** | 豁免，当 Gate 条件不满足但经人工确认后允许推进 |
| **Gate Condition** | 门禁条件，如"C1 Design Coverage = 100%" |

### 覆盖率指标（C1-C9）

| 术语 | 类型 | 定义 | 阈值 |
|------|------|------|------|
| **C1** | 正向 | Design Coverage：有 DS 的 FR / 总 FR | = 100% |
| **C2** | 正向 | API Coverage：有 API 的 FR / 需 API 的 FR | = 100% |
| **C3** | 正向 | Task Coverage：有 TASK 的 FR / 总 FR | = 100% |
| **C4** | 正向 | Test Coverage (FR)：有 TC 的 FR / 总 FR | = 100% |
| **C5** | 正向 | Test Coverage (AC)：有 TC 的 AC / 总 AC | ≥ 90% |
| **C6** | 正向 | Implementation Coverage：有 PR 的 FR / 总 FR | = 100% |
| **C7** | 反向 | PR Compliance：有 TASK 的 PR / 总 PR | = 100% |
| **C8** | 反向 | Task Compliance：有 FR 的 TASK / 总 TASK | = 100% |
| **C9** | 反向 | TC Compliance：有 FR 的 TC / 总 TC | = 100% |

### 变更与缺陷

| 术语 | 定义 |
|------|------|
| **RFC** | Request For Change，变更请求 |
| **RFC Level** | 变更级别：`Critical`（跨 2+ 阶段）、`Major`（跨 1 阶段）、`Minor`（单阶段内） |
| **Defect** | 缺陷，已发现的问题 |
| **Defect Severity** | 缺陷严重等级：S1（立即）、S2（4h）、S3（24h）、S4（下迭代） |

### Skill 相关

| 术语 | 定义 |
|------|------|
| **Skill** | AI 驱动的流程编排能力，定义在 `SKILL.md` 文件中 |
| **P0-P5** | Skill 执行的 6 个阶段：P0 定位 → P1 上下文 → P2 生成 → P3 确认 → P4 写入 → P5 副作用 |
| **Confirm Policy** | 确认策略：`strict`（逐项审阅）、`assisted`（摘要确认）、`auto`（自动执行） |
| **HARD-GATE** | 硬守卫模式，入口阻断不符合前置条件的操作 |

### CLI 相关

| 术语 | 定义 |
|------|------|
| **CLI** | Command Line Interface，命令行工具 |
| **Atomic Command** | 原子命令，相同输入产生相同输出，无副作用不确定性 |
| **Idempotent** | 幂等，多次执行结果相同 |

### 文件与目录

| 术语 | 定义 |
|------|------|
| **spec.md** | 需求规格文档，包含 FR/NFR/AC |
| **design.md** | 技术设计文档，包含架构/数据模型/API |
| **task_plan.md** | 任务拆解计划，包含 TASK 列表和状态 |
| **traceability-matrix.md** | 追踪矩阵，记录 FR→DS→TASK→TC 的映射关系 |
| **findings.md** | 研究发现和决策记录 |
| **stage-state.json** | 阶段状态机状态文件 |
| **constitution.md** | 项目宪法，定义项目原则和约束 |

### V-Model 追踪（扩展）

| 术语 | 层级 | 配对 |
|------|------|------|
| **REQ** | 需求分析层 | REQ ↔ ATP（验收测试） |
| **SYS** | 系统设计层 | SYS ↔ STP（系统测试） |
| **ARCH** | 架构设计层 | ARCH ↔ ITP（集成测试） |
| **MOD** | 模块设计层 | MOD ↔ UTP（单元测试） |

### 架构模块

| 术语 | 定义 |
|------|------|
| **M1 ProcessEngine** | 阶段状态机引擎 |
| **M2 TraceEngine** | 追踪引擎（ID + 矩阵） |
| **M3 GateEngine** | Gate 门禁引擎 |
| **M4 ChangeMgr** | 变更管理引擎（RFC + Defect） |
| **M5 AIOrchestrator** | AI 编排引擎（Context Pack） |
| **M6 MetricsEngine** | 度量引擎（覆盖率 + 健康分） |
| **M7 ToolIntegration** | 工具集成（Hook + CI） |

---

## 核心架构

### 双层架构

```text
┌─────────────────────────────────────────────────────────────────┐
│                    人类（PM/TL/Dev/QA）                          │
│                    决策 · 确认 · 签核                             │
└────────────────────────────┬────────────────────────────────────┘
                             │  /spec-first:*
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Skill 层（流程编排 · 21 个 Skill）                              │
│  职责: 流程编排、阶段流转触发、交互引导、内容生成                │
│  宿主: Claude Code / Codex CLI                                   │
├─────────────────────────────────────────────────────────────────┤
│  CLI 层（确定性原子能力 · 19 命令）                              │
│  职责: ID 生成、Gate 校验、状态推进、度量计算                    │
│  约束: 相同输入 = 相同输出                                       │
├─────────────────────────────────────────────────────────────────┤
│  核心模块: M1 ProcessEngine | M2 TraceEngine | M3 GateEngine    │
│           M4 ChangeMgr | M5 AIOrchestrator | M6 MetricsEngine   │
│           M7 ToolIntegration | SkillRuntime | Template          │
├─────────────────────────────────────────────────────────────────┤
│  持久层: specs/<featureId>/ | .spec-first/ | Git Hook + CI      │
└─────────────────────────────────────────────────────────────────┘
```

### 三层规范体系

```text
┌─────────────────────────────────────────┐
│  Layer 0: 通用流程框架                   │
│  8+2 阶段基线 | Gate 定义 | 产出物标准   │
└────────────────────┬────────────────────┘
                     ▼
┌─────────────────────────────────────────┐
│  Layer 1: 模式 × 规模                    │
│  Mode N: 新功能 | Mode I: 迭代           │
│  Size: S / M / L                        │
└────────────────────┬────────────────────┘
                     ▼
┌─────────────────────────────────────────┐
│  Layer 2: 端特有规范                     │
│  APP | H5 | PC | Backend | ...          │
└────────────────────┬────────────────────┘
                     ▼
        ┌─────────────────────┐
        │ Feature 定制化流程   │
        └─────────────────────┘
```

### Skill 统一执行模型（P0-P5）

每个 Skill 遵循相同的 6 阶段执行流程：

```text
P0_LOCATE — 定位与校验
  ├── 定位 Feature 工作区（specs/<featureId>/）
  └── 校验当前阶段是否允许执行该 Skill

P1_CONTEXT — 上下文加载
  ├── spec-first ai context <featureId>（获取 Context Pack）
  └── 读取阶段相关交付物

P2_GENERATE — AI 推理生成
  └── 根据 SKILL.md 指令生成内容（纯 AI 推理，无 CLI 调用）

P3_CONFIRM — 用户确认
  └── 展示生成内容，等待用户确认 / 修改 / 拒绝

P4_WRITE — 写入交付物
  ├── 写入目标文件
  └── spec-first id next <type> <abbr>（注册新 ID）

P5_SIDE_EFFECT — 副作用执行
  ├── spec-first matrix check <featureId>（校验追踪矩阵）
  ├── spec-first gate check <featureId>（校验 Gate）
  └── 更新运行态文件（findings.md / task_plan.md）
```

### 确认策略

| policy | P3 行为 | 适用场景 |
| --- | --- | --- |
| auto | 跳过用户确认，P2 完成后直接进入 P4 | 只读/低风险操作 |
| assisted | 展示生成内容摘要，用户可确认、修改或拒绝 | 中等风险操作 |
| strict | 展示完整生成内容，用户必须逐项审阅后确认 | 高风险操作 |

---

## 研发流程

### 全链路流程图

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Spec-First 研发流程                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │ 00_init  │───►│01_specify│───►│02_design │───►│ 03_plan  │───►│04_implement│    │
│  │ Feature  │    │  需求    │    │  设计    │    │  规划    │    │  实现      │    │
│  │  启动    │    │  规格化  │    │          │    │          │    │          │    │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    │
│       │               │               │               │               │           │
│       ▼               ▼               ▼               ▼               ▼           │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│  │目录结构  │    │ spec.md  │    │design.md │    │task_plan │    │ 代码     │    │
│  │mode/size │    │ FR/NFR   │    │contracts │    │ TASK-xxx │    │ 单元测试 │    │
│  │platforms │    │ 追踪矩阵 │    │data-model│    │checklist │    │ CR Report│    │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    │
│       │               │               │               │               │           │
│       ▼               ▼               ▼               ▼               ▼           │
│  [Gate:就绪]    [Gate:DoR]    [Gate:Design]   [Gate:Task]    [Gate:Code]         │
│                                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                     │
│  │05_verify │───►│06_wrap_up│───►│07_release│───►│ 08_done  │                     │
│  │  验证    │    │  收尾    │    │  发布    │    │  完成    │                     │
│  │          │    │          │    │          │    │          │                     │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘                     │
│       │               │               │               │                           │
│       ▼               ▼               ▼               ▼                           │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                    │
│  │Test Report   │retro.md  │    │Release   │    │ 全部     │                    │
│  │Security  │    │ 归档清单 │    │ Note     │    │ Accepted │                    │
│  │UAT签核   │    │ Spec同步 │    │Smoke Test│    │          │                    │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                    │
│       │               │               │                                           │
│       ▼               ▼               ▼                                           │
│  [Gate:UAT]    [Gate:Archive]  [Gate:Smoke]                                      │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 追踪链路示例

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              需求到交付追踪链路                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  需求          设计          任务          代码          测试                        │
│  ────          ────          ────          ────          ────                        │
│                                                                                     │
│  FR-AUTH-001 ──► DS-AUTH-001 ──► TASK-AUTH-001 ──► PR #123 ──► TC-E2E-AUTH-001    │
│       │              │              │              │              │                 │
│       ▼              ▼              ▼              ▼              ▼                 │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐              │
│  │ 用户    │   │ API     │   │ 登录    │   │ auth.   │   │ E2E     │              │
│  │ 登录    │   │ 契约    │   │ 模块    │   │ ts      │   │ 测试    │              │
│  │ 功能    │   │ 定义    │   │ 实现    │   │         │   │ 用例    │              │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘              │
│                                                                                     │
│                              │                                                      │
│                              ▼                                                      │
│                    ┌──────────────────┐                                            │
│                    │traceability-      │                                            │
│                    │  matrix.md        │                                            │
│                    └──────────────────┘                                            │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 阶段状态机

### 8+2 阶段流程

```text
  00_init ──► 01_specify ──► 02_design ──► 03_plan ──► 04_implement ──► 05_verify ──► 06_wrap_up ──► 07_release ──► 08_done
  Skill:init   Skill:spec     Skill:design  Skill:task  Skill:code        Skill:test    Skill:archive   (Smoke Test)   (终态)
                            │                                          │
                            │         ┌────────────────────────────────┤
                            │         │                                │
                            ▼         ▼                                ▼
                      05-research  08-code-review              ┌───────────┐
                        (可选)        (可选)                   │09_cancelled│
                                                             │  (终态)    │
                                                             └───────────┘
                                                               ▲
                                                               │ stage cancel
                                                        (任意阶段可触发)
```

### 阶段速查表

| 阶段 | Skill | Exit Gate | 产出物 |
|------|-------|-----------|--------|
| 00_init | `/spec-first:init` | 目录就绪 | Feature 目录 |
| 01_specify | `/spec-first:spec` | DoR Sign-off | spec.md |
| 02_design | `/spec-first:design` | Design Review | design.md, contracts/ |
| 03_plan | `/spec-first:task` | Task Review | task_plan.md |
| 04_implement | `/spec-first:code` | Code CR | 代码, 单元测试 |
| 05_verify | `/spec-first:test` | UAT Sign-off | Test Report |
| 06_wrap_up | `/spec-first:archive` | 归档完成 | retro.md |
| 07_release | — | Smoke Test | Release Note |

---

## 追踪体系

### ID 格式

| 类型 | 格式 | 示例 |
|------|------|------|
| Feature | `FSREQ-YYYYMMDD-<FEAT>-NNN` | `FSREQ-20260226-AUTH-001` |
| FR | `FR-<FEAT>-NNN` | `FR-AUTH-001` |
| DS | `DS-<FEAT>-NNN` | `DS-AUTH-001` |
| TASK | `TASK-<FEAT>-NNN` | `TASK-AUTH-001` |
| TC | `TC-<LVL>-<FEAT>-NNN` | `TC-E2E-AUTH-001` |

### 追踪链路

```text
  FR-AUTH-001 ──► DS-AUTH-001 ──► TASK-AUTH-001 ──► PR #123 ──► TC-E2E-AUTH-001
       │                │                │              │              │
       └────────────────┴────────────────┴──────────────┴──────────────┘
                                    │
                                    ▼
                         traceability-matrix.md
```

### MatrixStatus

```text
┌────────────┬────────────┬────────────┬────────────┐
│  Planned   │Implemented │  Verified  │  Accepted  │
├────────────┼────────────┼────────────┼────────────┤
│  Deferred  │ Cancelled  │ Exception  │            │
└────────────┴────────────┴────────────┴────────────┘
```

---

## Gate 校验

### Gate 流程

```text
  stage advance ──► evaluateGate() ──► 遍历条件 ──► 汇总结果 ──┬──► PASS ──────► 允许 advance
                                                               ├──► PASS_WITH_WAIVER ─► 允许 advance
                                                               └──► FAIL ──────► 阻断
```

### Gate 条件

| 阶段 | Gate 条件 |
|------|----------|
| Design | Design Coverage = 100%, API Coverage = 100%, DoR Sign-off |
| Implement | Task Coverage = 100%, Task Compliance = 100%, PR Compliance = 100%, Code CR Passed |
| Verify | Test Coverage = 100%, TC Compliance = 100%, Impl Coverage = 100%, UAT Sign-off |

### GateStatus

```typescript
type GateStatus = 'PASS' | 'PASS_WITH_WAIVER' | 'FAIL';
```

---

## 变更与缺陷管理

### RFC 状态机

```text
  draft ──(审批通过)──► approved ──(变更完成)──► closed
    │                      │
    └────(审批拒绝)──► rejected ──(重新提交)──► draft
```

### RFC 分级

| 级别 | 条件 | 审批 |
|------|------|------|
| Critical | 跨 2+ 阶段, 影响 5+ FR | Tech Lead + Architect |
| Major | 跨 1 阶段, 影响 2-4 FR | Tech Lead |
| Minor | 单阶段内, 影响 1 FR | 快速通道 |

### 缺陷状态机

```text
  open ──► fixing ──► fixed ──► verified
    │         │
    │         └──(修复失败)──► open
    │
    └──────────────────────► wontfix
```

### 缺陷严重等级

| 等级 | 定义 | 响应时间 |
|------|------|----------|
| S1 | 生产崩溃/数据丢失 | 立即 |
| S2 | 核心功能不可用 | 4h |
| S3 | 功能受影响有替代 | 24h |
| S4 | 轻微问题 | 下迭代 |

---

## 覆盖率指标

### 正向覆盖率（需求是否被实现）

| 指标 | 公式 | 阈值 |
|------|------|------|
| C1 Design | 有 DS 的 FR / 总 FR | = 100% |
| C2 API | 有 API 的 FR / 需 API 的 FR | = 100% |
| C3 Task | 有 TASK 的 FR / 总 FR | = 100% |
| C4 Test(FR) | 有 TC 的 FR / 总 FR | = 100% |
| C5 Test(AC) | 有 TC 的 AC / 总 AC | ≥ 90% |
| C6 Impl | 有 PR 的 FR / 总 FR | = 100% |

### 反向合规率（实现是否有需求依据）

| 指标 | 公式 | 阈值 |
|------|------|------|
| C7 PR Compliance | 有 TASK 的 PR / 总 PR | = 100% |
| C8 Task Compliance | 有 FR 的 TASK / 总 TASK | = 100% |
| C9 TC Compliance | 有 FR 的 TC / 总 TC | = 100% |

---

## Skill 体系

### 21 个 Skill 分类

```text
┌─────────────────────────────────────────────────────────────────┐
│  核心工作流 Skills (9)                                          │
│  01-init | 03-spec | 04-design | 05-research | 06-task         │
│  07-code | 08-code-review | 09-test | 10-archive               │
├─────────────────────────────────────────────────────────────────┤
│  编排与验证 Skills (3)                                          │
│  11-plan | 12-verify | 13-orchestrate                           │
├─────────────────────────────────────────────────────────────────┤
│  会话管理 Skills (4)                                            │
│  02-catchup | 14-status | 15-doctor | 16-sync                   │
├─────────────────────────────────────────────────────────────────┤
│  Feature 管理 Skills (3)                                        │
│  17-feature-list | 18-feature-switch | 19-feature-current       │
├─────────────────────────────────────────────────────────────────┤
│  扩展 Skills (2)                                                │
│  20-spec-review | 21-analyze                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Skill 依赖关系

```text
                    13-orchestrate (主编排器)
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
       11-plan        12-verify        advance
           │               │               │
           ▼               ▼               ▼
       01-init        03-spec          gate
                           │
                           ▼
                      04-design ◄── 05-research (可选)
                           │
                           ▼
                       06-task
                           │
                           ▼
                       07-code ◄── 08-code-review (可选)
                           │
                           ▼
                       09-test
                           │
                           ▼
                      10-archive

    辅助: 02-catchup | 14-status | 15-doctor | 16-sync | 17~19-feature-* | 21-analyze
```

### 阶段 × Skill 映射

| 阶段 | Skill | 主要交付物 |
| --- | --- | --- |
| 00_init | 01-init | stage-state.json, constitution.md |
| 01_specify | 03-spec, 20-spec-review | spec.md, checklists/spec-review.md |
| 02_design | 04-design, 05-research | design.md, contracts/, research.md |
| 03_plan | 06-task, 21-analyze | task_plan.md, checklist.md |
| 04_implement | 07-code, 08-code-review | task_plan.md 状态更新 |
| 05_verify | 09-test | tests/*.test.md |
| 06_wrap_up | 10-archive | retro.md |
| 任意阶段 | 02-catchup | 无文件（恢复摘要） |
| 编排层 | 11-plan, 12-verify, 13-orchestrate | 执行计划 / 校验报告 |

### 核心工作流 Skill 详解

| Skill | 阶段 | 说明 | 确认策略 |
|-------|------|------|----------|
| [01-init](skills/spec-first/01-init/SKILL.md) | 00_init | 初始化 Feature 工作区 | strict |
| [03-spec](skills/spec-first/03-spec/SKILL.md) | 01_specify | 定义需求规格（FR + AC）| strict/auto |
| [04-design](skills/spec-first/04-design/SKILL.md) | 02_design | 技术设计与 API 契约 | strict |
| [05-research](skills/spec-first/05-research/SKILL.md) | 02_design | 技术调研（可选）| assisted |
| [06-task](skills/spec-first/06-task/SKILL.md) | 03_plan | 任务拆解与验收标准 | strict |
| [07-code](skills/spec-first/07-code/SKILL.md) | 04_implement | 按 TASK 实现代码 | strict/assisted |
| [08-code-review](skills/spec-first/08-code-review/SKILL.md) | 04_implement | 代码审查 | assisted |
| [09-test](skills/spec-first/09-test/SKILL.md) | 05_verify | 测试用例定义 | strict |
| [10-archive](skills/spec-first/10-archive/SKILL.md) | 06_wrap_up | 归档复盘 | assisted |

---

## CLI 命令

### 19 个命令

| 命令 | 功能 | 模块 |
|------|------|------|
| `init` | 初始化 Feature | M1 |
| `stage` | 阶段管理 | M1 |
| `feature` | Feature 管理 | M1 |
| `id` | ID 生成/校验/检索 | M2 |
| `matrix` | 追踪矩阵 | M2 |
| `gate` | Gate 评估 | M3 |
| `golive` | 上线检查 | M3 |
| `analyze` | 一致性分析 | M3 |
| `rfc` | RFC 管理 | M4 |
| `defect` | 缺陷管理 | M4 |
| `ai` | AI 上下文/恢复 | M5 |
| `metrics` | 覆盖率/度量 | M6 |
| `commit` | 规范化提交 | M7 |
| `doctor` | 环境诊断 | M7 |
| `hooks` | Git Hook 管理 | M7 |
| `setup` | 全局注册（已废弃，转发到 update） | M7 |
| `update` | 升级刷新 | M7 |
| `uninstall` | 清理配置 | M7 |
| `viewer` | 可视化面板 | Tool |

### CLI 命令详解

#### spec-first init

初始化 Feature 工作区。

```bash
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>] [--title <title>] [--bootstrap]
```

#### spec-first id

ID 生成与校验。

```bash
# 生成下一个 ID
spec-first id next <type> <abbr> --feature <featureId> [--level <UT|IT|E2E|ST>]
# type: FR | DS | TASK | TC | RFC

# 校验 ID 格式
spec-first id validate <id>

# 搜索 ID
spec-first id search <query> --feature <featureId> [--type <type>]

# 列出已注册 ID
spec-first id list --feature <featureId> [--type <type>]
```

#### spec-first gate

Gate 条件评估。

```bash
# 校验当前阶段 Gate
spec-first gate check <featureId>

# 查看阶段 Gate 条件定义
spec-first gate conditions <featureId>

# 查看 Gate 评估历史
spec-first gate history <featureId>
```

#### spec-first stage

阶段生命周期管理。

```bash
# 查看当前阶段
spec-first stage current <featureId>

# 推进到下一阶段
spec-first stage advance <featureId> [--force]

# 取消 Feature
spec-first stage cancel <featureId> --reason "<reason>"
```

#### spec-first matrix

追踪矩阵管理。

```bash
# 校验追踪矩阵完整性
spec-first matrix check <featureId>

# 导出追踪矩阵
spec-first matrix export <featureId> [--format <markdown|yaml>]

# 更新矩阵行
spec-first matrix update <featureId> <id> [--status <status>]
```

#### spec-first metrics

覆盖率与度量。

```bash
# 计算覆盖率（9 项指标）
spec-first metrics coverage <featureId>

# 生成度量报告
spec-first metrics report <featureId>

# 健康分（加权综合评分）
spec-first metrics health <featureId>
```

#### spec-first ai

AI 辅助工具。

```bash
# 生成 Context Pack（<2KB YAML）
spec-first ai context <featureId>

# 会话恢复
spec-first ai catchup <featureId>

# AI 调用统计
spec-first ai stats <featureId>
```

#### spec-first doctor

环境诊断与修复。

```bash
spec-first doctor [featureId]
```

检查：Node.js 版本、Git 配置、MCP/skills 配置、运行时文件状态。

#### spec-first update

升级后刷新 Skill/MCP/Hooks。

```bash
spec-first update [--dry-run] [--skip-mcp] [--skip-hooks] [--host <target>]
```

---

## 技术栈与目录

### 技术栈

| 类别 | 选型 | 版本 |
|------|------|------|
| 运行时 | Node.js | ≥ 20 LTS |
| 语言 | TypeScript (ESM) | ≥ 5.4 |
| 测试 | Vitest | ≥ 1.6 |
| 构建 | tsup | ≥ 8.5 |
| 模板 | Handlebars | ≥ 4.7 |
| YAML | js-yaml | ≥ 4.1 |

### 目录结构

```text
spec-first/
├── src/
│   ├── cli/                  # CLI (19 命令)
│   │   ├── index.ts          # CLI 入口
│   │   └── commands/         # 各命令实现
│   ├── core/                 # 核心模块 (9 目录)
│   │   ├── process-engine/   # M1: 阶段状态机
│   │   ├── trace-engine/     # M2: ID + 矩阵
│   │   ├── gate-engine/      # M3: Gate + SCA
│   │   ├── change-mgr/       # M4: RFC + Defect
│   │   ├── ai-orchestrator/  # M5: Context Pack
│   │   ├── metrics-engine/   # M6: 度量
│   │   ├── skill-runtime/    # Skill 运行时
│   │   ├── template/         # 模板系统
│   │   └── tool-integration/ # M7: Hook + CI
│   └── shared/               # 共享类型 (types, constants, utils)
├── skills/spec-first/        # 21 个 Skill
│   ├── AGENTS.md             # 全局 Agent 指令
│   ├── SHARED.md             # 跨 Skill 共享约束
│   └── */SKILL.md            # 各 Skill 定义
├── templates/                # Handlebars 模板
├── scripts/                  # 构建与工具脚本
└── tests/                    # 测试
```

### Feature 工作区目录

```text
specs/                          # Feature 工作区根目录
├── .feat-registry.md           # FEAT 缩写注册表
└── <featureId>/                # 单个 Feature 目录
    ├── stage-state.json        # 阶段状态机
    ├── constitution.md         # 项目原则
    ├── spec.md                 # 需求规格（01_specify）
    ├── design.md               # 技术设计（02_design）
    ├── research.md             # 技术调研（02_design 可选）
    ├── contracts/*.yaml        # API 契约（02_design）
    ├── data-model.md           # 数据模型（02_design M/L）
    ├── adr/*.adr.md            # 架构决策记录
    ├── task_plan.md            # 任务拆解（03_plan）
    ├── checklist.md            # 验证清单（03_plan）
    ├── tests/*.test.md         # 测试用例（05_verify）
    ├── reports/                # 报告目录
    ├── retro.md                # 复盘报告（06_wrap_up）
    ├── traceability-matrix.md  # 追踪矩阵
    ├── findings.md             # 过程发现（运行态）
    ├── gate-history.jsonl      # Gate 评估历史
    └── ai-stats.jsonl          # AI 调用统计
```

---

## 核心类型

```typescript
// Stage 枚举
enum Stage {
  INIT = '00_init', SPECIFY = '01_specify', DESIGN = '02_design',
  PLAN = '03_plan', IMPLEMENT = '04_implement', VERIFY = '05_verify',
  WRAP_UP = '06_wrap_up', RELEASE = '07_release',
  DONE = '08_done', CANCELLED = '09_cancelled',
}

// GateStatus
type GateStatus = 'PASS' | 'PASS_WITH_WAIVER' | 'FAIL';

// ExitCode
enum ExitCode {
  SUCCESS = 0, GATE_FAILED = 1, VALIDATION_ERROR = 2,
  CONFIG_ERROR = 3, IO_ERROR = 4, UNKNOWN_ERROR = 5,
}

// MatrixStatus
type MatrixStatus = 'Planned' | 'Implemented' | 'Verified' | 'Accepted' | 'Deferred' | 'Cancelled' | 'Exception';

// ID 类型
type IdType = 'FR' | 'DS' | 'TASK' | 'TC' | 'RFC';

// Feature Mode
type FeatureMode = 'N' | 'I';  // N: 新功能, I: 迭代

// Feature Size
type FeatureSize = 'S' | 'M' | 'L';

// RFC Level
type RfcLevel = 'Critical' | 'Major' | 'Minor';

// Defect Severity
type DefectSeverity = 'S1' | 'S2' | 'S3' | 'S4';
```

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [`CLAUDE.md`](CLAUDE.md) | Claude Code 工作规范 |
| [`CHANGELOG.md`](CHANGELOG.md) | 版本变更日志 |
| [`skills/spec-first/README.md`](skills/spec-first/README.md) | Skill 目录索引 |
| [`skills/spec-first/AGENTS.md`](skills/spec-first/AGENTS.md) | 全局 Agent 指令 |
| [`skills/spec-first/SHARED.md`](skills/spec-first/SHARED.md) | 跨 Skill 共享约束 |
| [`docs/01需求文档/`](docs/01需求文档/) | 需求规格文档 |
| [`docs/02技术方案/`](docs/02技术方案/) | 技术设计文档 |

---

## 许可证

MIT License

---

*本文档基于代码生成 | 更新: 2026-02-27 | 版本: v0.5.45*
