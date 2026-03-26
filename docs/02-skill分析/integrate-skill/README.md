# Integrate-Skill 深度分析

> 分析目标: `/packages/cli/src/templates/claude/commands/spec/integrate-skill.md`

---

## 1. Skill 概述

### 1.1 核心定位

**integrate-skill** 是一个将 Claude 全局 skill（技能包）集成到项目开发指南中的命令。它的核心价值在于：

| 维度 | 描述 |
|------|------|
| **目标** | 更新开发指南，而非直接生成项目代码 |
| **输出位置** | `.spec-first/spec/{target}/` 目录 |
| **作用域** | 将通用技能"项目化"，形成项目特定的最佳实践 |

### 1.2 设计哲学

```
┌─────────────────────────────────────────────────────────────┐
│                    设计核心原则                              │
├─────────────────────────────────────────────────────────────┤
│  Global Skill  →  Project Guidelines  →  Project Code      │
│  (通用能力)        (项目适配层)           (实际产出)          │
│                                                             │
│  集成目标: 在 Guidelines 层注入项目特定的适配信息            │
└─────────────────────────────────────────────────────────────┘
```

**关键区分**:
- **Guidelines 内容** → 写入 `.spec-first/spec/{target}/doc.md`
- **代码示例** → 放入 `.spec-first/spec/{target}/examples/skills/<skill-name>/`
- **示例文件** → 使用 `.template` 后缀避免 IDE 报错

---

## 2. 执行流程分析

### 2.1 完整流程图

```
┌────────────────────────────────────────────────────────────────┐
│                    integrate-skill 执行流程                     │
└────────────────────────────────────────────────────────────────┘

  ┌─────────────┐
  │ 1. 读取 Skill │
  │   内容       │
  └──────┬──────┘
         │ openskills read <skill-name>
         ▼
  ┌─────────────┐     不存在      ┌─────────────────┐
  │ Skill 存在? │──────────────▶│ 提示检查可用 Skill │
  └──────┬──────┘                └─────────────────┘
         │ 存在
         ▼
  ┌─────────────┐
  │ 2. 确定集成  │
  │   目标位置  │
  └──────┬──────┘
         │ 根据 Skill 类型判断
         ▼
  ┌─────────────┐
  │ 3. 分析 Skill │
  │   内容      │
  └──────┬──────┘
         │ 提取核心概念、最佳实践、代码模式、注意事项
         ▼
  ┌─────────────┐
  │ 4. 执行集成  │
  └──────┬──────┘
         │
         ├─▶ 4.1 更新 Guidelines 文档 (doc.md)
         ├─▶ 4.2 创建示例目录 (examples/skills/)
         └─▶ 4.3 更新索引文件 (index.md)
         ▼
  ┌─────────────┐
  │ 5. 生成集成  │
  │   报告      │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ 6. 可选: 创建│
  │   快捷命令  │
  └─────────────┘
```

### 2.2 各步骤详解

#### Step 1: 读取 Skill 内容

```bash
openskills read <skill-name>
```

**错误处理**: 如果 skill 不存在，提示用户检查 AGENTS.md 中的 `<available_skills>` 列表。

#### Step 2: 确定集成目标

**分类映射表**:

| Skill 类别 | 集成目标 | 示例 Skill |
|-----------|---------|-----------|
| UI/Frontend | `.spec-first/spec/frontend/` | `frontend-design`, `web-artifacts-builder` |
| Backend/API | `.spec-first/spec/backend/` | `mcp-builder` |
| Documentation | `.spec-first/` 或创建专用指南 | `doc-coauthoring`, `docx`, `pdf` |
| Testing | `.spec-first/spec/frontend/` | `webapp-testing` (E2E) |

#### Step 3: 分析 Skill 内容

提取四个维度：

| 维度 | 描述 | 用途 |
|-----|------|-----|
| **核心概念** | Skill 如何工作及关键概念 | 理解 Skill 机制 |
| **最佳实践** | 推荐的方法论 | 指导使用方式 |
| **代码模式** | 可复用的代码模板 | 提供示例基础 |
| **注意事项** | 常见问题及解决方案 | 避免踩坑 |

#### Step 4: 执行集成

**4.1 更新 Guidelines 文档**

使用 `@@@section` 标记添加新章节：

```markdown
@@@section:skill-<skill-name>
## # <Skill Name> Integration Guide

### Overview
[Skill 核心功能和用例]

### Project Adaptation
[如何在当前项目中使用此 Skill]

### Usage Steps
1. [步骤1]
2. [步骤2]

### Caveats
- [项目特定约束]
- [与默认行为的差异]

### Reference Examples
See `examples/skills/<skill-name>/`

@@@/section:skill-<skill-name>
```

**4.2 创建示例目录**

```
.spec-first/spec/{target}/
|-- doc.md                      # 添加 Skill 相关章节
|-- index.md                    # 更新索引
+-- examples/
    +-- skills/
        +-- <skill-name>/
            |-- README.md               # 示例文档
            |-- example-1.ts.template   # 代码示例 (.template 后缀)
            +-- example-2.tsx.template
```

**文件命名约定**:
- 代码文件: `<name>.<ext>.template`
- 配置文件: `<name>.config.template`
- 文档: `README.md`

**4.3 更新索引文件**

在 `index.md` 的快速导航表中添加条目：

```markdown
| <Skill相关任务> | <章节名称> | `skill-<skill-name>` |
```

#### Step 5: 生成集成报告

报告包含：
- Skill 概述
- 技术栈兼容性矩阵
- 集成位置列表
- 依赖安装命令
- 完成清单
- 相关 Guidelines 引用

#### Step 6: 可选 - 创建快捷命令

对于高频使用的 Skill，创建快捷命令：

```bash
/spec:create-command use-<skill-name> Use <skill-name> skill following project guidelines
```

---

## 3. 技术设计分析

### 3.1 架构层次

```
┌─────────────────────────────────────────────────────────────┐
│                      架构层次设计                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    openskills read    ┌─────────────────┐  │
│  │ Global Skill │ ──────────────────▶  │  Skill Content  │  │
│  │   Registry   │                      │   (Raw Data)    │  │
│  └─────────────┘                      └────────┬────────┘  │
│                                                │            │
│                                                ▼            │
│                                       ┌─────────────────┐  │
│                                       │  Skill Analyzer │  │
│                                       │  (内容提取)      │  │
│                                       └────────┬────────┘  │
│                                                │            │
│                    ┌───────────────────────────┼───────┐    │
│                    │                           │       │    │
│                    ▼                           ▼       ▼    │
│           ┌─────────────┐            ┌─────────────┐ ...   │
│           │  Frontend   │            │   Backend   │       │
│           │  Guidelines │            │  Guidelines │       │
│           └──────┬──────┘            └──────┬──────┘       │
│                  │                          │              │
│                  ▼                          ▼              │
│           ┌─────────────┐            ┌─────────────┐       │
│           │   Examples  │            │   Examples  │       │
│           │   Directory │            │   Directory │       │
│           └─────────────┘            └─────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 核心设计模式

#### 模式 1: 分层隔离

```
Global Skill (通用)
      ↓
Project Guidelines (项目适配层)  ← 集成发生在这里
      ↓
Project Code (实际代码)
```

**优势**:
- 全局 Skill 可跨项目复用
- 项目适配层处理项目特定约束
- 代码层保持干净，无冗余注释

#### 模式 2: 模板文件后缀约定

```
├── component.tsx.template   # 不会被 IDE 解析
├── server.ts.template       # 不会被编译
└── README.md                # 正常文档
```

**原因**: 避免示例代码被 IDE/编译器处理，导致误报错误。

#### 模式 3: Section 标记系统

```markdown
@@@section:skill-<name>
...
@@@/section:skill-<name>
```

**作用**:
- 支持程序化查找和替换
- 便于后续更新和维护
- 清晰的边界标记

### 3.3 与其他组件的关系

```
┌─────────────────────────────────────────────────────────────┐
│                    组件依赖关系                              │
└─────────────────────────────────────────────────────────────┘

  /spec:integrate-skill
         │
         ├──▶ openskills CLI (读取全局 Skill)
         │
         ├──▶ /spec:create-command (可选，创建快捷命令)
         │
         └──▶ .spec-first/spec/ (目标输出位置)
                │
                ├── doc.md (Guidelines 文档)
                ├── index.md (索引文件)
                └── examples/skills/ (示例目录)
```

---

## 4. 输出产物分析

### 4.1 集成报告结构

```markdown
## Skill Integration Report: `<skill-name>`

### Overview
- Skill description: [功能描述]
- Integration target: `.spec-first/spec/{target}/`

### Tech Stack Compatibility

| Skill Requirement | Project Status | Compatibility |
|-------------------|----------------|---------------|
| [Tech 1]          | [Project tech] | [OK]/[!]/[X]  |

### Integration Locations

| Type             | Path                                          |
|------------------|-----------------------------------------------|
| Guidelines doc   | `.spec-first/spec/{target}/doc.md`            |
| Code examples    | `.spec-first/spec/{target}/examples/skills/`  |
| Index update     | `.spec-first/spec/{target}/index.md`          |

### Dependencies (if needed)

```bash
npm install <package>
```

### Completed Changes

- [ ] Added section to doc.md
- [ ] Added index entry to index.md
- [ ] Created example files
- [ ] Example files use .template suffix

### Related Guidelines

- [Existing related section IDs]
```

### 4.2 目录结构示例

以 `mcp-builder` 为例：

```
.spec-first/spec/backend/
├── doc.md                           # 添加 MCP 章节
├── index.md                         # 添加索引条目
└── examples/
    └── skills/
        └── mcp-builder/
            ├── README.md
            ├── server.ts.template
            ├── tools.ts.template
            └── types.ts.template
```

### 4.3 doc.md 新增章节示例

```markdown
@@@section:skill-mcp-builder
## # MCP Server Development Guide

### Overview
Create LLM-callable tool services using MCP (Model Context Protocol).

### Project Adaptation
- Place services in a dedicated directory
- Follow existing TypeScript and type definition conventions
- Use project's logging system

### Reference Examples
See `examples/skills/mcp-builder/`

@@@/section:skill-mcp-builder
```

---

## 5. 最佳实践与注意事项

### 5.1 使用场景

| 场景 | 说明 |
|------|------|
| **新项目初始化** | 在项目开始时集成所需 Skills |
| **功能扩展** | 项目需要新能力时集成相关 Skill |
| **标准化** | 将团队常用 Skill 纳入项目规范 |
| **知识沉淀** | 将通用最佳实践项目化 |

### 5.2 关键注意事项

1. **目标明确**: 集成目标是 Guidelines，不是直接生成代码
2. **模板后缀**: 示例代码必须使用 `.template` 后缀
3. **Section 标记**: 使用 `@@@section` 标记便于后续维护
4. **兼容性检查**: 生成报告时检查技术栈兼容性
5. **索引更新**: 不要忘记更新 `index.md` 的快速导航

### 5.3 常见 Skill 集成参考

| Skill | 集成目标 | 示例目录 |
|-------|---------|---------|
| `frontend-design` | `frontend` | `examples/skills/frontend-design/` |
| `mcp-builder` | `backend` | `examples/skills/mcp-builder/` |
| `webapp-testing` | `frontend` | `examples/skills/webapp-testing/` |
| `doc-coauthoring` | `.spec-first/` | N/A (仅文档工作流) |

---

## 6. 设计亮点与改进建议

### 6.1 设计亮点

1. **分层清晰**: Global → Guidelines → Code 三层隔离
2. **标记系统**: `@@@section` 便于程序化处理
3. **模板约定**: `.template` 后缀避免 IDE 干扰
4. **报告生成**: 提供完整的集成报告，包含兼容性检查

### 6.2 潜在改进方向

| 改进点 | 描述 |
|-------|------|
| **增量更新** | 支持检测已存在的 Section，避免重复添加 |
| **冲突检测** | 当 Guidelines 中已有相关内容时提示用户 |
| **自动依赖** | 根据 Skill 自动检测并安装依赖 |
| **版本追踪** | 记录集成 Skill 的版本，便于后续更新 |

---

## 7. 总结

**integrate-skill** 是一个将全局能力"项目化"的桥梁工具：

```
┌─────────────────────────────────────────────────────────────┐
│                      核心价值                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   通用 Skill ──▶ 项目适配 ──▶ 团队共识 ──▶ 代码实现        │
│                                                             │
│   integrate-skill 在"项目适配"环节发挥作用                  │
│   将通用最佳实践转化为项目特定的开发指南                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**适用人群**:
- 需要标准化团队开发的 Tech Lead
- 希望复用全局 Skill 的开发者
- 需要将通用能力项目化的团队

**执行时机**:
- 项目初始化阶段
- 引入新技术/工具时
- 团队规范更新时
