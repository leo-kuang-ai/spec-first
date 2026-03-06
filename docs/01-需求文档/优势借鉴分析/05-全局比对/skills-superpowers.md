# Superpowers 项目 Skill 详细列表

> **版本**: 1.1.0 | **更新日期**: 2026-03-03 | **Skill 源**: `/Users/kuang/xiaobu/superpowers/skills/`

---

## 概述

Superpowers 项目共包含 **14 个 Skill**，采用高质量 AI 代理技能设计，强调 TDD、系统化调试和审查闭环。

---

## Skill 列表

### 入口与发现 Skills (1 个)

#### 1. using-superpowers
| 属性 | 值 |
|------|-----|
| **名称** | `using-superpowers` |
| **描述** | 开始任何对话时使用 - 建立如何查找和使用 skill |
| **触发条件** | 开始任何对话/任务 |

**核心原则**: 如果认为有 1% 的可能性 skill 可能适用，必须调用该 skill

**流程**:
1. 收到用户消息
2. 是否有 skill 可能适用？
3. 如是，调用 Skill 工具
4. 宣布使用哪个 skill
5. 如有检查清单，创建 TodoWrite
6. 严格遵循 skill

**Skill 优先级**:
1. 流程 skill 优先（brainstorming, debugging）
2. 实现 skill 其次
---

### 创意与规划 Skills (2 个)

#### 2. brainstorming
| 属性 | 值 |
|------|-----|
| **名称** | `brainstorming` |
| **描述** | 在任何创意工作之前必须使用 - 探索用户意图、需求和设计 |
| **触发条件** | 创建 features、构建 components、添加功能或修改行为之前 |

**核心原则**: 在呈现设计并获得用户批准之前，不得调用任何实现 skill、编写代码

**流程节点**:
1. Explore project context - 检查文件、文档、最近提交
2. Ask clarifying questions - 一次一个问题
3. Propose 2-3 approaches - 包含权衡和推荐
4. Present design - 按复杂度分节，每节后获取批准
5. Write design doc - 保存到 `docs/plans/YYYY-MM-DD-<topic>-design.md`
6. Transition to implementation - 调用 writing-plans skill

**Hard Gate**: 不得调用实现 skill、写代码，直到设计呈现并获用户批准
---

#### 3. writing-plans
| 属性 | 值 |
|------|-----|
| **名称** | `writing-plans` |
| **描述** | 有规范或多步骤任务的需求时使用，在触碰代码之前 |
| **触发条件** | 有规范或需求，多步骤任务，代码编写前 |

**核心原则**: 编写全面实现计划，假设工程师对代码库零上下文

**计划保存位置**: `docs/plans/YYYY-MM-DD-<feature-name>.md`

**计划文档结构**:
- Header（目标、架构、技术栈）
- 任务结构（文件、步骤、代码、命令、预期输出）

**任务粒度**: 每个步骤是一个动作（2-5分钟）

**执行交接选项**:
1. Subagent-Driven (当前会话) - 每任务派发新子代理
2. Parallel Session (独立会话) - 使用 executing-plans skill
---

### 实现与执行 Skills (3 个)

#### 4. executing-plans
| 属性 | 值 |
|------|-----|
| **名称** | `executing-plans` |
| **描述** | 在单独会话中有书面实现计划需要执行时使用 |
| **触发条件** | 有书面实现计划需要在独立会话中执行 |

**核心原则**: 批量执行 + 架构师审查检查点

**流程节点**:
1. Load and Review Plan - 读取计划文件、批判性审查
2. Execute Batch - 默认前 3 个任务，按步骤执行
3. Report - 展示实现内容、验证输出
4. Continue - 根据反馈继续下一批
5. Complete Development - 调用 finishing-a-development-branch skill

**必需的子 Skill**:
- using-git-worktrees
- writing-plans
- finishing-a-development-branch
---

#### 5. subagent-driven-development
| 属性 | 值 |
|------|-----|
| **名称** | `subagent-driven-development` |
| **描述** | 在当前会话中执行具有独立任务的实现计划时使用 |
| **触发条件** | 有实现计划，任务大多独立，在同一会话中 |

**核心原则**: 每个任务派发新子代理 + 两阶段审查（先规范合规，后代码质量）

**流程节点**:
1. 读取计划，提取所有任务，创建 TodoWrite
2. 派发实现者子代理
3. 如有问题，回答后继续
4. 派发规范审查子代理
5. 如不合规，修复后重新审查
6. 派发代码质量审查子代理
7. 如有问题，修复后重新审查
8. 标记任务完成
9. 重复直到所有任务完成
10. 派发最终代码审查
11. 使用 finishing-a-development-branch

**配套模板**: implementer-prompt.md, spec-reviewer-prompt.md, code-quality-reviewer-prompt.md
---

#### 6. test-driven-development
| 属性 | 值 |
|------|-----|
| **名称** | `test-driven-development` |
| **描述** | 实现任何功能或修复 bug 时使用，在编写实现代码之前 |
| **触发条件** | 新功能、bug 修复、重构、行为变更 |

**核心原则**: 如果没有看到测试失败，就不知道它是否测试正确的东西

**铁律**: 没有失败测试在前，不得编写生产代码

**Red-Green-Refactor 循环**:
1. **RED** - 编写失败测试
2. **Verify RED** - 验证失败（强制）
3. **GREEN** - 编写最小代码通过
4. **Verify GREEN** - 验证通过（强制）
5. **REFACTOR** - 清理
6. 重复

**配套文档**: testing-anti-patterns.md
---

### 技术与工具 Skills (2 个)

#### 7. using-git-worktrees
| 属性 | 值 |
|------|-----|
| **名称** | `using-git-worktrees` |
| **描述** | 开始需要与当前工作空间隔离的功能工作，或执行实现计划之前使用 |
| **触发条件** | 需要隔离工作空间，或执行实现计划前 |

**核心原则**: 系统化目录选择 + 安全验证 = 可靠隔离

**流程节点**:
1. Check Existing Directories - 优先 `.worktrees`，次选 `worktrees`
2. Check CLAUDE.md - 查找偏好设置
3. Ask User - 如无现有目录和偏好
4. Safety Verification - 验证目录在 .gitignore 中
5. Create Worktree
6. Run Project Setup
7. Verify Clean Baseline - 运行测试
8. Report Location

**目录优先级**: `.worktrees/` > `worktrees/` > CLAUDE.md 偏好 > 询问用户
---

#### 8. systematic-debugging
| 属性 | 值 |
|------|-----|
| **名称** | `systematic-debugging` |
| **描述** | 遇到任何 bug、测试失败或意外行为时使用，在提出修复之前 |
| **触发条件** | 测试失败、生产环境 bug、意外行为、性能问题、构建失败 |

**核心原则**: 在尝试修复前必须找到根因。症状修复就是失败。

**四大阶段**:

**Phase 1: Root Cause Investigation**
1. 仔细阅读错误信息
2. 一致复现
3. 检查最近变更
4. 在多组件系统中收集证据
5. 追踪数据流

**Phase 2: Pattern Analysis**
1. 找到工作的示例
2. 与参考对比
3. 识别差异
4. 理解依赖

**Phase 3: Hypothesis and Testing**
1. 形成单一假设
2. 最小化测试
3. 验证后继续
4. 不懂时坦白

**Phase 4: Implementation**
1. 创建失败测试用例
2. 实现单一修复
3. 验证修复
4. 修复无效时返回 Phase 1
5. 3+ 次修复失败时质疑架构

**配套文档**: root-cause-tracing.md, defense-in-depth.md, condition-based-waiting.md
---

### 质量保障 Skills (4 个)

#### 9. verification-before-completion
| 属性 | 值 |
|------|-----|
| **名称** | `verification-before-completion` |
| **描述** | 即将声称工作完成、已修复或通过时使用，在提交或创建 PR 之前 |
| **触发条件** | 声称任何状态或表达满意之前 |

**核心原则**: 证据在声明之前，始终如此

**铁律**: 没有新鲜验证证据，不得声称完成

**门禁功能**:
1. IDENTIFY: 什么命令能证明这个声明？
2. RUN: 执行完整命令
3. READ: 完整输出，检查退出码
4. VERIFY: 输出是否确认声明？
5. ONLY THEN: 做出声明

**常见失败**:
- 测试通过需要测试命令输出: 0 失败
- Linter 干净需要 Linter 输出: 0 错误
- 构建成功需要构建命令: 退出 0
---

#### 10. requesting-code-review
| 属性 | 值 |
|------|-----|
| **名称** | `requesting-code-review` |
| **描述** | 完成任务、实现主要功能或合并前验证工作满足需求时使用 |
| **触发条件** | 子代理驱动开发中每个任务后（强制）、完成主要功能后、合并前 |

**核心原则**: 尽早审查，经常审查

**流程节点**:
1. 获取 git SHAs
2. 派发 code-reviewer 子代理
3. 根据反馈行动（修复 Critical/Important，注意 Minor）

**模板文件**: requesting-code-review/code-reviewer.md
---

#### 11. receiving-code-review
| 属性 | 值 |
|------|-----|
| **名称** | `receiving-code-review` |
| **描述** | 收到代码审查反馈时使用，在实现建议之前 |
| **触发条件** | 收到代码审查反馈，需要技术严谨和验证 |

**核心原则**: 实现前验证，假设前询问。技术正确性优于社交舒适度

**响应模式**:
1. READ: 完整阅读反馈，不做反应
2. UNDERSTAND: 用自己的话重述需求（或询问）
3. VERIFY: 对照代码库现实检查
4. EVALUATE: 对此代码库技术合理吗？
5. RESPOND: 技术确认或理性反驳
6. IMPLEMENT: 一次一项，每项测试

**禁止的响应**:
- "You're absolutely right!"
- "Great point!" / "Excellent feedback!"
- "Let me implement that now"（验证前）
---

#### 12. dispatching-parallel-agents
| 属性 | 值 |
|------|-----|
| **名称** | `dispatching-parallel-agents` |
| **描述** | 面对 2 个以上可独立工作的任务时使用 |
| **触发条件** | 3+ 个测试文件因不同根因而失败、多个子系统独立损坏 |

**核心原则**: 每个独立问题域派发一个代理，让它们并行工作

**流程节点**:
1. Identify Independent Domains - 按损坏内容分组失败
2. Create Focused Agent Tasks - 每个代理获得特定范围、明确目标
3. Dispatch in Parallel - 同时运行所有代理
4. Review and Integrate - 读取摘要、验证修复无冲突

**不适用场景**: 失败相关、需要完整上下文、探索性调试
---

### 完成与交付 Skills (1 个)

#### 13. finishing-a-development-branch
| 属性 | 值 |
|------|-----|
| **名称** | `finishing-a-development-branch` |
| **描述** | 实现完成、所有测试通过后，需要决定如何集成工作时使用 |
| **触发条件** | 实现完成、所有测试通过、需要决定如何集成 |

**核心原则**: 验证测试 → 呈现选项 → 执行选择 → 清理

**流程节点**:
1. Verify Tests - 运行测试套件，失败则停止
2. Determine Base Branch - 识别分支来源
3. Present Options - 提供 4 个选项
4. Execute Choice - 根据选择执行
5. Cleanup Worktree - 按选项决定是否清理

**4 个选项**:
1. 本地合并回基础分支
2. 推送并创建 Pull Request
3. 保持分支原样（稍后处理）
4. 丢弃此工作
---

### 元技能 (1 个)

#### 14. writing-skills
| 属性 | 值 |
|------|-----|
| **名称** | `writing-skills` |
| **描述** | 创建新 skill、编辑现有 skill 或部署前验证 skill 工作时使用 |
| **触发条件** | 创建/编辑/验证 skill |

**核心原则**: 编写 skill 就是应用于流程文档的 TDD

**Skill 类型**:
- Technique (技术) - 具体方法和步骤
- Pattern (模式) - 思考问题的方式
- Reference (参考) - API 文档、语法指南

**SKILL.md 结构**:
- Frontmatter (YAML) - name 和 description
- Overview - 核心原则
- When to Use - 触发条件
- Core Pattern/Implementation
- Quick Reference
- Common Mistakes
- Real-World Impact

**TDD 映射**:
- Test case = 压力场景与子代理
- Production code = Skill 文档
- RED = 代理无 skill 时违反规则
- GREEN = 代理有 skill 时遵守
- REFACTOR = 关闭漏洞

**配套文档**: anthropic-best-practices.md, persuasion-principles.md, testing-skills-with-subagents.md
---

## Skill 依赖关系图

```
using-superpowers (入口)
    │
    ├── brainstorming (创意工作前置)
    │       │
    │       ├── writing-plans (设计后创建计划)
    │       │       │
    │       │       ├── executing-plans (独立会话执行)
    │       │       │       │
    │       │       │       └── finishing-a-development-branch
    │       │       │
    │       │       └── subagent-driven-development (当前会话执行)
    │       │               │
    │       │               ├── requesting-code-review
    │       │               └── finishing-a-development-branch
    │       │
    │       └── using-git-worktrees (工作空间隔离)
    │
    ├── test-driven-development (实现前写测试)
    │
    ├── systematic-debugging (调试前置)
    │
    ├── verification-before-completion (完成前验证)
    │
    ├── receiving-code-review (接收审查反馈)
    │
    ├── requesting-code-review (请求代码审查)
    │
    ├── dispatching-parallel-agents (并行派发)
    │
    └── writing-skills (创建/编辑 skill)
```
