# Spec Kit 项目 Skill 详细列表

> **版本**: 1.1.0 | **更新日期**: 2026-03-03 | **Skill 源**: `/Users/kuang/xiaobu/spec-kit/templates/commands/`

---

## 概述

Spec Kit 项目共包含 **9 个 Skill**，采用 Spec-Driven Development 方法，通过命令模板实现结构化软件开发。

---

## Skill 列表

### 完整工作流 Skills (9 个)

#### 1. constitution
| 属性 | 值 |
|------|-----|
| **名称** | `/speckit.constitution` |
| **描述** | Create or update the project constitution from interactive or provided principle inputs |
| **下游命令** | `/speckit.specify` |

**功能说明**:
- 创建或更新项目宪法文件 `.specify/memory/constitution.md`
- 收集/推导项目原则的占位符值
- 版本管理（语义化版本控制：MAJOR/MINOR/PATCH）
- 一致性传播检查

**流程节点**:
1. 加载现有宪法文件
2. 收集/推导占位符值
3. 起草更新的宪法内容
4. 一致性传播检查（plan-template、spec-template、tasks-template）
5. 生成同步影响报告
6. 验证并写入
---

#### 2. specify
| 属性 | 值 |
|------|-----|
| **名称** | `/speckit.specify` |
| **描述** | Create or update the feature specification from a natural language feature description |
| **下游命令** | `/speckit.plan` 或 `/speckit.clarify` |

**功能说明**:
- 从自然语言描述创建功能规格文档
- 生成简洁的分支名称（2-4 个单词）
- 检查现有分支并确定下一个编号
- 生成规格质量检查清单
- 最多 3 个 `[NEEDS CLARIFICATION]` 标记

**流程节点**:
1. 生成简短分支名
2. 检查现有分支
3. 加载规格模板
4. 解析用户描述，提取关键概念
5. 填充用户场景和测试部分
6. 生成功能需求
7. 定义成功标准
8. 规格质量验证
9. 写入规格文件
---

#### 3. clarify
| 属性 | 值 |
|------|-----|
| **名称** | `/speckit.clarify` |
| **描述** | Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions |
| **下游命令** | `/speckit.plan` |

**功能说明**:
- 结构化模糊性和覆盖率扫描
- 分类法覆盖：功能范围、数据模型、UX 流程、非功能属性、集成依赖、边界情况、约束权衡、术语一致性、完成信号
- 最多 5 个问题，每个问题有多选或短语回答
- 增量更新规格文件

**流程节点**:
1. 运行前置检查脚本
2. 加载当前规格文件
3. 执行结构化模糊性扫描
4. 生成优先级问题队列（最多 5 个）
5. 顺序提问循环
6. 每个回答后增量更新规格
7. 验证并写入
8. 报告完成状态
---

#### 4. plan
| 属性 | 值 |
|------|-----|
| **名称** | `/speckit.plan` |
| **描述** | Execute the implementation planning workflow using the plan template |
| **下游命令** | `/speckit.tasks` |

**功能说明**:
- Phase 0: 研究和解决未知项
- Phase 1: 生成数据模型、接口契约、快速入门文档
- 更新代理上下文文件

**流程节点**:
1. 运行设置脚本，解析 JSON
2. 加载上下文（规格、宪法）
3. 填充技术上下文
4. 执行宪法检查
5. Phase 0: 生成 research.md
6. Phase 1: 生成 data-model.md, contracts/, quickstart.md
7. 更新代理上下文
8. 重新评估宪法检查
---

#### 5. tasks
| 属性 | 值 |
|------|-----|
| **名称** | `/speckit.tasks` |
| **描述** | Generate an actionable, dependency-ordered tasks.md for the feature |
| **下游命令** | `/speckit.analyze` 或 `/speckit.implement` |

**功能说明**:
- 基于用户故事组织任务
- 任务格式：`- [ ] [TaskID] [P?] [Story?] Description with file path`
- 支持并行执行标记 `[P]`
- 支持测试驱动开发（可选）

**流程节点**:
1. 运行前置检查脚本
2. 加载设计文档（plan.md, spec.md 等）
3. 提取技术栈和用户故事
4. 映射实体和契约到用户故事
5. 生成任务分解
6. 创建依赖图
7. 生成 tasks.md

**阶段结构**:
- Phase 1: Setup（项目初始化）
- Phase 2: Foundational（阻塞性前置任务）
- Phase 3+: User Stories（按优先级）
- Final Phase: Polish & Cross-Cutting
---

#### 6. analyze
| 属性 | 值 |
|------|-----|
| **名称** | `/speckit.analyze` |
| **描述** | Perform a non-destructive cross-artifact consistency and quality analysis |
| **下游命令** | `/speckit.implement` |

**功能说明**:
- **只读分析**：不修改任何文件
- 宪法权威性：宪法违规自动标记为 CRITICAL
- 检测类型：重复、模糊、未充分指定、宪法对齐、覆盖缺口、不一致

**流程节点**:
1. 初始化分析上下文
2. 加载制品（渐进式披露）
3. 构建语义模型
4. 执行检测扫描
5. 分配严重性级别（CRITICAL/HIGH/MEDIUM/LOW）
6. 生成紧凑分析报告
7. 提供下一步行动建议
8. 提供修复建议（可选）
---

#### 7. implement
| 属性 | 值 |
|------|-----|
| **名称** | `/speckit.implement` |
| **描述** | Execute the implementation plan by processing and executing all tasks defined in tasks.md |

**功能说明**:
- 检查检查清单状态
- 项目设置验证（创建 ignore 文件）
- 阶段式执行：Setup → Tests → Core → Integration → Polish
- 遵循 TDD 方法
- 进度跟踪和错误处理

**流程节点**:
1. 运行前置检查脚本
2. 检查检查清单状态
3. 加载实现上下文
4. 项目设置验证
5. 解析 tasks.md 结构
6. 按阶段执行任务
7. 进度跟踪
8. 完成验证
---

#### 8. checklist
| 属性 | 值 |
|------|-----|
| **名称** | `/speckit.checklist` |
| **描述** | Generate a custom checklist for the current feature based on user requirements |

**功能说明**:
- **核心概念**：检查清单是"需求的单元测试"
- 验证需求质量：完整性、清晰性、一致性、可测量性、覆盖率
- 不验证实现行为

**流程节点**:
1. 运行前置检查脚本
2. 澄清意图（最多 3 个上下文问题）
3. 理解用户请求
4. 加载功能上下文
5. 生成检查清单
6. 报告创建结果

**检查清单类型示例**:
- `ux.md` - UX 需求质量
- `api.md` - API 需求质量
- `performance.md` - 性能需求质量
- `security.md` - 安全需求质量
---

#### 9. taskstoissues
| 属性 | 值 |
|------|-----|
| **名称** | `/speckit.taskstoissues` |
| **描述** | Convert existing tasks into actionable, dependency-ordered GitHub issues |

**功能说明**:
- 将 tasks.md 中的任务转换为 GitHub Issues
- 仅支持 GitHub URL 的远程仓库
- 使用 GitHub MCP 服务器创建 Issues

**流程节点**:
1. 运行前置检查脚本
2. 提取 tasks 路径
3. 获取 Git 远程 URL
4. 验证是否为 GitHub URL
5. 为每个任务创建 Issue

**依赖工具**: `github/github-mcp-server/issue_write`
---

## 完整工作流程

```
┌──────────────────┐
│ /speckit.constitution │  ←── STEP 1: 建立项目原则
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ /speckit.specify │     ←── STEP 2: 创建功能规格
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ /speckit.clarify │     ←── STEP 3: 澄清规格（可选但推荐）
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ /speckit.plan    │     ←── STEP 4: 创建技术实现计划
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ /speckit.tasks   │     ←── STEP 5: 生成任务分解
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ /speckit.analyze │     ←── STEP 6: 一致性分析（可选）
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ /speckit.implement│    ←── STEP 7: 执行实现
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ /speckit.taskstoissues│ ←── 可选: 转换为 GitHub Issues
└──────────────────┘

┌──────────────────┐
│ /speckit.checklist │   ←── 任何阶段: 生成质量检查清单
└──────────────────┘
```

---

## 元数据结构

每个 skill 文件使用 YAML front matter 定义元数据：

```yaml
---
description: "命令描述"
handoffs:                    # 可选：下游命令推荐
  - label: "按钮标签"
    agent: speckit.xxx
    prompt: "提示词"
    send: true              # 可选：是否自动发送
scripts:                     # 可选：前置脚本
  sh: scripts/bash/xxx.sh --json
  ps: scripts/powershell/xxx.ps1 -Json
tools:                       # 可选：MCP 工具依赖
  - 'github/github-mcp-server/issue_write'
---
```
