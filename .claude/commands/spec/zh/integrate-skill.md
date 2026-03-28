# 将 Claude Skill 集成到项目规范

将 Claude 全局技能适配并集成到你的项目开发规范中（而不是直接集成到项目代码）。

## 用法

```
/spec:integrate-skill <skill-name>
```

**示例**：
```
/spec:integrate-skill frontend-design
/spec:integrate-skill mcp-builder
```

## 核心原则

> [!] **重要**：技能集成的目标是更新**开发规范**，而不是直接生成项目代码。
>
> - 规范内容 -> 写入 `.spec-first/spec/{target}/doc.md`
> - 代码示例 -> 放在 `.spec-first/spec/{target}/examples/skills/<skill-name>/`
> - 示例文件 -> 使用 `.template` 后缀（例如 `component.tsx.template`）以避免 IDE 错误
>
> 其中 `{target}` 是 `frontend` 或 `backend`，由技能类型决定。

## 执行步骤

### 1. 读取技能内容

```bash
openskills read <skill-name>
```

如果技能不存在，提示用户检查可用技能：
```bash
# Available skills are listed in AGENTS.md under <available_skills>
```

### 2. 确定集成目标

根据技能类型，确定要更新的规范：

| Skill Category | Integration Target |
|----------------|-------------------|
| UI/Frontend (`frontend-design`, `web-artifacts-builder`) | `.spec-first/spec/frontend/` |
| Backend/API (`mcp-builder`) | `.spec-first/spec/backend/` |
| Documentation (`doc-coauthoring`, `docx`, `pdf`) | `.spec-first/` 或创建专用规范 |
| Testing (`webapp-testing`) | `.spec-first/spec/frontend/` (E2E) |

### 3. 分析技能内容

从技能中提取：
- **核心概念**：技能如何工作以及关键概念
- **最佳实践**：推荐方法
- **代码模式**：可复用的代码模板
- **注意事项**：常见问题和解决方案

### 4. 执行集成

#### 4.1 更新规范文档

向相应的 `doc.md` 添加新部分：

```markdown
@@@section:skill-<skill-name>
## # <Skill Name> Integration Guide

### Overview
[技能的核心功能和使用场景]

### Project Adaptation
[如何在当前项目中使用此技能]

### Usage Steps
1. [Step 1]
2. [Step 2]

### Caveats
- [项目特定的约束]
- [与默认行为的差异]

### Reference Examples
See `examples/skills/<skill-name>/`

@@@/section:skill-<skill-name>
```

#### 4.2 创建示例目录（如果存在代码示例）

```bash
# Directory structure ({target} = frontend or backend)
.spec-first/spec/{target}/
|-- doc.md                      # Add skill-related section
|-- index.md                    # Update index
+-- examples/
    +-- skills/
        +-- <skill-name>/
            |-- README.md               # Example documentation
            |-- example-1.ts.template   # Code example (use .template suffix)
            +-- example-2.tsx.template
```

**文件命名约定**：
- 代码文件：`<name>.<ext>.template`（例如 `component.tsx.template`）
- 配置文件：`<name>.config.template`（例如 `tailwind.config.template`）
- 文档：`README.md`（正常后缀）

#### 4.3 更新索引文件

添加到 `index.md` 的快速导航表：

```markdown
| <Skill-related task> | <Section name> | `skill-<skill-name>` |
```

### 5. 生成集成报告

---

## Skill Integration Report: `<skill-name>`

### Overview
- **Skill description**: [功能描述]
- **Integration target**: `.spec-first/spec/{target}/`

### Tech Stack Compatibility

| Skill Requirement | Project Status | Compatibility |
|-------------------|----------------|---------------|
| [Tech 1] | [Project tech] | [OK]/[!]/[X] |

### Integration Locations

| Type | Path |
|------|------|
| Guidelines doc | `.spec-first/spec/{target}/doc.md` (section: `skill-<name>`) |
| Code examples | `.spec-first/spec/{target}/examples/skills/<name>/` |
| Index update | `.spec-first/spec/{target}/index.md` |

> `{target}` = `frontend` or `backend`

### Dependencies (if needed)

```bash
# Install required dependencies (adjust for your package manager)
npm install <package>
# or
pnpm add <package>
# or
yarn add <package>
```

### Completed Changes

- [ ] Added `@@@section:skill-<name>` section to `doc.md`
- [ ] Added index entry to `index.md`
- [ ] Created example files in `examples/skills/<name>/`
- [ ] Example files use `.template` suffix

### Related Guidelines

- [Existing related section IDs]

---

## 6. 可选：创建使用命令

如果此技能经常使用，创建快捷命令：

```bash
/spec:create-command use-<skill-name> Use <skill-name> skill following project guidelines
```

## 常见技能集成参考

| Skill | Integration Target | Examples Directory |
|-------|-------------------|-------------------|
| `frontend-design` | `frontend` | `examples/skills/frontend-design/` |
| `mcp-builder` | `backend` | `examples/skills/mcp-builder/` |
| `webapp-testing` | `frontend` | `examples/skills/webapp-testing/` |
| `doc-coauthoring` | `.spec-first/` | N/A (documentation workflow only) |

## 示例：集成 `mcp-builder` 技能

### 目录结构

```
.spec-first/spec/backend/
|-- doc.md                           # Add MCP section
|-- index.md                         # Add index entry
+-- examples/
    +-- skills/
        +-- mcp-builder/
            |-- README.md
            |-- server.ts.template
            |-- tools.ts.template
            +-- types.ts.template
```

### doc.md 中的新部分

```markdown
@@@section:skill-mcp-builder
## # MCP Server Development Guide

### Overview
使用 MCP (Model Context Protocol) 创建 LLM 可调用的工具服务。

### Project Adaptation
- 将服务放在专用目录中
- 遵循现有的 TypeScript 和类型定义约定
- 使用项目的日志系统

### Reference Examples
See `examples/skills/mcp-builder/`

@@@/section:skill-mcp-builder
```
