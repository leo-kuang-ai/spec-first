# Trellis 项目 Skill 详细列表

> **版本**: 1.1.0 | **更新日期**: 2026-03-03 | **Skill 源**: `/Users/kuang/xiaobu/Trellis/.agents/skills/`

---

## 概述

Trellis 项目共包含 **16 个 Skill**，采用 AI 辅助工作流系统设计，核心理念为"Read Before Write"和知识持久化。

---

## Skill 列表

### 会话管理 Skills (3 个)

#### 1. start
| 属性 | 值 |
|------|-----|
| **名称** | `start` |
| **命令** | `/trellis:start` |
| **描述** | Start Session - 初始化 AI 开发会话并开始处理任务 |

**初始化步骤**:
1. 理解开发工作流（读取 workflow.md）
2. 获取当前上下文
3. 读取规范索引
4. 报告并询问

**任务分类**:
| 类型 | 判定标准 | 工作流 |
|------|---------|--------|
| 问题 | 询问代码/架构 | 直接回答 |
| 简单修复 | < 5 分钟 | 直接编辑 |
| 简单任务 | 目标清晰、1-2 文件 | 快速确认 → 任务工作流 |
| 复杂任务 | 目标模糊、多文件 | **头脑风暴 → 任务工作流** |

**任务工作流阶段**:
- Phase 1: 建立需求
- Phase 2: 准备实现（规范深度检查、研究代码库、配置上下文、激活任务）
- Phase 3: 执行（实现、检查质量、完成）

**核心原则**: 代码规范上下文是注入的，不是记住的
---

#### 2. record-session
| 属性 | 值 |
|------|-----|
| **名称** | `record-session` |
| **命令** | `/trellis:record-session` |
| **描述** | [!] Prerequisite: 必须在人类测试并提交代码后使用 |
| **前置条件** | AI 不能执行 git commit |

**执行步骤**:
1. 获取上下文 (`get_context.py`)
2. 一键添加会话 (`add_session.py`)
3. 可选: 归档已完成的任务

**自动完成**:
- 追加会话到 journal-N.md
- 自动检测行数
- 更新 index.md
---

#### 3. onboard
| 属性 | 值 |
|------|-----|
| **名称** | `onboard` |
| **命令** | `/trellis:onboard` |
| **描述** | 作为导师引导新成员理解 Trellis 工作流系统 |

**三个核心部分**:
1. **Part 1: 核心概念** - 为什么存在这个工作流、系统结构、命令详解
2. **Part 2: 实际示例** - 5 个真实工作流场景
3. **Part 3: 定制开发规范** - 检查并填充项目规范

**核心理念**:
- **AI 无记忆**: workspace 系统提供"人工记忆"
- **AI 只有通用知识**: spec 目录提供项目特定知识
- **AI 上下文有限**: check 命令对抗上下文漂移
---

### 开发前准备 Skills (3 个)

#### 4. before-backend-dev
| 属性 | 值 |
|------|-----|
| **名称** | `before-backend-dev` |
| **命令** | `/trellis:before-backend-dev` |
| **描述** | Read the backend development guidelines before starting your development task |
| **触发条件** | 在开始任何后端代码编写之前 |

**流程步骤**:
1. 读取 `.trellis/spec/backend/index.md` 了解可用规范
2. 根据任务类型读取相关规范文件
3. 理解编码标准和模式
4. 然后开始开发计划
---

#### 5. before-frontend-dev
| 属性 | 值 |
|------|-----|
| **名称** | `before-frontend-dev` |
| **命令** | `/trellis:before-frontend-dev` |
| **描述** | Read the frontend development guidelines before starting your development task |
| **触发条件** | 在开始任何前端代码编写之前 |

**流程步骤**:
1. 读取 `.trellis/spec/frontend/index.md` 了解可用规范
2. 根据任务类型读取相关规范文件
3. 理解编码标准和模式
4. 然后开始开发计划
---

#### 6. brainstorm
| 属性 | 值 |
|------|-----|
| **名称** | `brainstorm` |
| **命令** | `/trellis:brainstorm` |
| **描述** | Brainstorm - Requirements Discovery (AI Coding Enhanced) |
| **触发条件** | 从 `$start` 触发，需求不清晰或存在多种实现路径时 |

**核心原则**:
1. Task-first（先创建任务）
2. Action before asking（先行动再提问）
3. One question per message（每条消息只问一个问题）
4. Research-first for technical choices（技术选择先研究）
5. Diverge → Converge（发散后收敛）

**流程步骤**:
- Step 0: 确保任务存在
- Step 1: 自动上下文收集
- Step 2: 复杂度分类
- Step 3: 问题门控
- Step 4: 研究优先模式
- Step 5: 扩展扫描（发散阶段）
- Step 6: Q&A 循环（收敛阶段）
- Step 7: 提出方案并记录决策
- Step 8: 最终确认与实现计划
---

### 质量检查 Skills (4 个)

#### 7. check-backend
| 属性 | 值 |
|------|-----|
| **名称** | `check-backend` |
| **命令** | `/trellis:check-backend` |
| **描述** | Check if the code you just wrote follows the backend development guidelines |
| **触发条件** | 后端代码编写完成后 |
| **功能** | 对抗上下文漂移 |

**流程步骤**:
1. 运行 `git status` 查看修改的文件
2. 读取 `.trellis/spec/backend/index.md`
3. 根据变更类型读取相关规范文件
4. 对照规范审查代码
5. 报告违规并修复
---

#### 8. check-frontend
| 属性 | 值 |
|------|-----|
| **名称** | `check-frontend` |
| **命令** | `/trellis:check-frontend` |
| **描述** | Check if the code you just wrote follows the frontend development guidelines |
| **触发条件** | 前端代码编写完成后 |
| **功能** | 对抗上下文漂移 |

**流程步骤**:
1. 运行 `git status` 查看修改的文件
2. 读取 `.trellis/spec/frontend/index.md`
3. 根据变更类型读取相关规范文件
4. 对照规范审查代码
5. 报告违规并修复
---

#### 9. check-cross-layer
| 属性 | 值 |
|------|-----|
| **名称** | `check-cross-layer` |
| **命令** | `/trellis:check-cross-layer` |
| **描述** | Cross-Layer Check - 检查变更是否考虑了所有维度 |
| **核心理念** | 大多数 bug 来自"没想到"而非技术能力不足 |

**检查维度**:
| 维度 | 触发条件 |
|------|---------|
| A: 跨层数据流 | 3+ 层时必做 |
| B: 代码复用 | 修改常量/配置时 |
| B2: 新工具函数 | 创建新函数时 |
| B3: 批量修改后 | 修改多个文件后 |
| C: 导入/依赖路径 | 创建新文件时 |
| D: 同层一致性 | 修改显示逻辑时 |
---

#### 10. finish-work
| 属性 | 值 |
|------|-----|
| **名称** | `finish-work` |
| **命令** | `/trellis:finish-work` |
| **描述** | Finish Work - Pre-Commit Checklist |
| **触发条件** | 代码编写并测试完成后，提交之前 |

**检查类别**:
1. **代码质量**: lint/typecheck/test 通过、无 console.log、无 any 类型
2. **代码-规范同步**: 检查 .trellis/spec/ 是否需要更新
3. **API 变更**: schema、文档、客户端代码更新
4. **数据库变更**: 迁移文件、schema、查询更新
5. **跨层验证**: 数据流、错误处理、类型一致性
6. **手动测试**: 功能、边缘情况、错误状态

**核心理念**: 交付不仅是代码，还包括文档、验证和知识捕获
---

### 知识管理 Skills (3 个)

#### 11. update-spec
| 属性 | 值 |
|------|-----|
| **名称** | `update-spec` |
| **命令** | `/trellis:update-spec` |
| **描述** | Update Code-Spec - Capture Executable Contracts |
| **触发条件** | 完成任务、修复 bug 或发现新模式后 |

**强制规则**: 基础设施/跨层变更必须包含：
- 范围/触发
- 签名
- 契约
- 验证&错误矩阵
- Good/Base/Bad 案例
- 必需测试
- 错误vs正确对比

**更新类型**: 设计决策、项目约定、新模式、禁止模式、常见错误、约定、陷阱
---

#### 12. break-loop
| 属性 | 值 |
|------|-----|
| **名称** | `break-loop` |
| **命令** | `/trellis:break-loop` |
| **描述** | Break the Loop - Deep Bug Analysis |
| **触发条件** | 调试完成后，打破"修复bug→遗忘→重复"的循环 |

**5 维度分析框架**:
1. **根因分类**: Missing Spec / Cross-Layer Contract / Change Propagation Failure / Test Coverage Gap / Implicit Assumption
2. **为何修复失败**: 表面修复、不完整范围、工具限制、心智模型
3. **预防机制**: 文档、架构、编译时、运行时、测试覆盖、代码审查
4. **系统性扩展**: 类似问题、设计缺陷、流程缺陷、知识缺口
5. **知识捕获**: 更新规范文档

**核心理念**: 调试的价值不在于修复 bug，而在于让这类 bug 永远不再发生
---

#### 13. integrate-skill
| 属性 | 值 |
|------|-----|
| **名称** | `integrate-skill` |
| **命令** | `/trellis:integrate-skill` |
| **描述** | Integrate Claude Skill into Project Guidelines |
| **触发条件** | 需要将 Claude 全局 skill 适配并集成到项目开发规范中 |

**执行步骤**:
1. 读取 skill 内容
2. 确定集成目标
3. 分析 skill 内容
4. 执行集成：更新规范文档、创建示例目录、更新索引文件
5. 生成集成报告

**集成目标映射**:
- UI/Frontend → `.trellis/spec/frontend/`
- Backend/API → `.trellis/spec/backend/`
- Documentation → `.trellis/`
- Testing → `.trellis/spec/frontend/`
---

### 工具与编排 Skills (3 个)

#### 14. create-command
| 属性 | 值 |
|------|-----|
| **名称** | `create-command` |
| **命令** | `/trellis:create-command` |
| **描述** | Create New Slash Command |

**命令类型**: 初始化、预开发、代码检查、记录、生成

**命名约定**: start-*, before-*, check-*, record-*, generate-*, update-*
---

#### 15. improve-ut
| 属性 | 值 |
|------|-----|
| **名称** | `improve-ut` |
| **命令** | `/trellis:improve-ut` |
| **描述** | Improve Unit Test Coverage for New Changes |

**执行流程**:
1. 检查变更文件
2. 决定测试范围（单元/集成/回归）
3. 添加/更新测试
4. 运行验证
5. 总结决策、更新和剩余测试缺口
---

#### 16. parallel
| 属性 | 值 |
|------|-----|
| **名称** | `parallel` |
| **命令** | `/trellis:parallel` |
| **描述** | Multi-Agent Pipeline Orchestrator |

**角色定义**: 在主仓库运行，不直接写代码，负责规划和调度

**规划选项**:
- Option A: Plan Agent（复杂功能推荐）
- Option B: 手动配置（简单功能）

**流水线阶段**: implement → check → finish → create-pr

**核心规则**: 不直接写代码、不执行 git commit、委托复杂分析给研究 agent
---

## 系统结构

```
.trellis/
|-- .developer              # 身份标识 (gitignored)
|-- workflow.md             # 完整工作流文档
|-- workspace/              # "AI Memory" - 会话历史
|   |-- index.md            # 所有开发者进度
|   +-- {developer}/        # 每个开发者目录
|       |-- index.md        # 个人进度索引
|       +-- journal-N.md    # 会话记录 (max 2000 lines)
|-- tasks/                  # 任务追踪 (统一)
|   +-- {MM}-{DD}-{slug}/   # 任务目录
|       |-- task.json       # 任务元数据
|       +-- prd.md          # 需求文档
|-- spec/                   # "AI Training Data" - 项目知识
|   |-- frontend/           # 前端约定
|   |-- backend/            # 后端约定
|   +-- guides/             # 思考模式
+-- scripts/                # 自动化工具
```

---

## 设计特点

1. **Read Before Write**: 所有开发技能都强调先阅读规范再写代码
2. **Context Injection**: 通过 JSONL 文件和 Hooks 自动注入上下文
3. **Quality Gates**: 多层检查机制（单层检查 → 跨层检查 → 完成检查）
4. **Knowledge Persistence**: 通过 workspace 系统持久化 AI 记忆
5. **Self-Improvement**: break-loop 和 update-spec 形成持续改进循环
6. **Human in Control**: AI 不执行 git commit，人类始终保持最终控制权
