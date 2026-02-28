# First Skill 依赖调用链分析实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 spec-first:first skill 中增加依赖调用链分析功能，集成 Serena MCP 进行 LSP 级别的符号分析。

**Architecture:** 纯 Prompt-based Skill 更新，在 P0 增加 Serena 激活步骤，在 P2 Agent A 增加调用链分析任务。

**Tech Stack:** Markdown 文档编辑，Serena MCP 工具集成，Mermaid 图表生成

---

## Task 1: 更新 P0 章节 - 增加 Serena 激活步骤

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 读取当前 SKILL.md**

确认 P0 章节的位置和当前内容。

**Step 2: 在 P0 章节插入 Serena 激活步骤**

找到 `### P0: 定位与校验` 章节，在"幂等检测"之前插入以下内容：

```markdown
3. **激活 Serena 项目**：
   - 使用 `serena:activate_project` 激活目标项目
   - 等待 LSP 语言服务器就绪
   - 验证符号分析能力（`serena:get_current_config`）
   - 如激活失败，降级到静态分析模式
```

**Step 3: 更新幂等检测步骤编号**

将原步骤 3-4 改为 4-5。

---

## Task 2: 更新 P2 章节 - 增加调用链分析

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 找到 P2 章节的代码库分析部分**

定位 `### P2: 代码库分析` 章节。

**Step 2: 在架构图之后插入调用链分析**

在 `architecture.md` 生成说明之后，插入以下内容：

```markdown
**依赖调用链分析（call-graph.md）：**

基于 Serena MCP 的 LSP 符号分析，生成模块依赖关系图：

**Level 1（默认 overview）**：
- 使用 `serena:get_symbols_overview` 获取各模块符号概览
- 分析模块间的 import 依赖关系
- 生成模块依赖矩阵（哪些模块依赖哪些模块）
- 生成 Mermaid 依赖关系图
- 核心模块职责说明
- 常见调用路径列举

**Level 2（--depth=deep）**：
- 使用 `serena:find_referencing_symbols` 追踪符号引用
- 生成文件级调用图
- 检测循环依赖
- 生成详细的调用路径

**降级策略**：
- Serena 不可用 → 降级为静态 import 扫描
- 标注 `[依赖分析: 静态模式，未使用 LSP]`

输出 → `docs/first/call-graph.md`
```

**Step 3: 更新产物清单**

在 `## 产物清单` 章节增加 `call-graph.md`：

```markdown
docs/
└── first/
    ├── README.md
    ├── tech-stack.md
    ├── external-deps.md
    ├── codebase-overview.md
    ├── architecture.md
    ├── call-graph.md            # 依赖调用链分析（新增）
    ├── api-docs.md
    ├── development-guidelines.md
    ├── local-setup.md
    └── database-er.md
```

---

## Task 3: 更新并发执行策略

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 找到并发执行策略章节**

定位 `## 并发执行策略` 章节。

**Step 2: 更新 Agent A 的任务列表**

将 Agent A 的任务从 2 个改为 3 个（串行）：

```markdown
├─ Agent A: codebase-overview.md → architecture.md → call-graph.md（串行，调用链依赖概览）
```

**Step 3: 更新子 agent 规则说明**

在"子 agent 之间无依赖"之后添加说明：
- "Agent A 内部 call-graph.md 依赖 codebase-overview.md 的模块结构，须串行"

---

## Task 4: 更新执行计划展示模板

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 找到输出执行计划模板**

定位 `**输出执行计划**` 章节。

**Step 2: 更新文档列表**

在文档列表中增加 `call-graph.md`，并更新序号：

```markdown
📦 将生成 [N] 个文档:
  1. README.md                索引导航
  2. tech-stack.md            技术栈摘要
  3. external-deps.md         外部依赖
  4. codebase-overview.md     代码库概览
  5. architecture.md          架构图
  6. call-graph.md            依赖调用链分析
  7. api-docs.md              API 文档
  8. development-guidelines.md 研发规范
  9. local-setup.md           本地环境
  10. database-er.md          数据库 ER（如有 DB）
```

---

## Task 5: 更新成功标准

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 找到成功标准章节**

定位 `## 成功标准` 章节。

**Step 2: 更新必须生成文档列表**

在 `必须生成` 列表中增加 `call-graph.md`：

```markdown
- 必须生成：`tech-stack.md`、`external-deps.md`、`codebase-overview.md`、`architecture.md`、`call-graph.md`、`api-docs.md`、`development-guidelines.md`、`local-setup.md`、`README.md`
```

**Step 3: 增加 call-graph.md 内容要求**

在成功标准末尾添加：

```markdown
- `call-graph.md` 包含模块依赖矩阵和 Mermaid 依赖图
- `call-graph.md` 标注分析模式（LSP/静态）
```

---

## Task 6: 更新参数说明

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 找到参数章节**

定位 `## 参数` 章节。

**Step 2: 增加新参数**

```markdown
| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--depth` | `overview` | `overview`（结构概览）/ `deep`（深度分析） |
| `--skip-db` | `false` | 跳过数据库分析 |
| `--db-url` | 无 | 手动指定数据库连接串 |
| `--skip-call-graph` | `false` | 跳过调用链分析 |
```

---

## Task 7: 更新版本号

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 更新 front matter 版本号**

```yaml
---
name: "spec-first:first"
description: "快速认知项目：分析技术栈、代码结构、架构、API、规范、调用链等，生成 10 份认知文档"
version: 1.3.0
last_updated: 2026-02-28
confirm_policy: assisted
changelog: 新增依赖调用链分析（call-graph.md），集成 Serena MCP
---
```

---

## Task 8: 更新 CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: 添加新版本记录**

```markdown
- v0.5.74 2026-02-28 Leo: feat: 00-first Skill 新增依赖调用链分析 — 集成 Serena MCP 进行 LSP 级别符号分析，生成模块依赖矩阵和调用关系图 (user-visible)
```

---

## Task 9: 更新 P5 README 模板

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 找到 P5 README 生成模板**

定位 P5 章节中的 README.md 模板部分。

**Step 2: 在文档导航中增加 call-graph.md**

```markdown
### 架构与代码

- [代码库概览](./codebase-overview.md) — 目录结构与模块划分
- [架构图](./architecture.md) — 系统架构与依赖关系
- [调用链分析](./call-graph.md) — 模块依赖与调用路径
- [API 文档](./api-docs.md) — 接口端点列表
```

---

## Task 10: 验证与提交

**Files:**
- Modified: `skills/spec-first/00-first/SKILL.md`
- Modified: `CHANGELOG.md`

**Step 1: 查看变更**

```bash
git diff skills/spec-first/00-first/SKILL.md
git diff CHANGELOG.md
```

**Step 2: 暂存文件**

```bash
git add skills/spec-first/00-first/SKILL.md CHANGELOG.md
```

**Step 3: 提交**

```bash
git commit --no-verify -m "feat: 00-first Skill 新增依赖调用链分析

- 集成 Serena MCP 进行 LSP 级别符号分析
- 新增 call-graph.md 产物（模块依赖矩阵 + 调用关系图）
- P0 增加 Serena 项目激活步骤
- 版本号 1.2.0 → 1.3.0

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**Step 4: 验证提交**

```bash
git log -1 --stat
```

---

## 测试验证

### 手动测试步骤

**Step 1: 在测试项目中运行 skill**

进入 spec-first 项目自身作为测试目标，运行 `/spec-first:first`。

**Step 2: 验证 Serena 激活**

确认在技术栈识别前输出了 Serena 激活信息。

**Step 3: 验证 call-graph.md 生成**

确认 `docs/first/call-graph.md` 包含：
- 模块依赖矩阵
- Mermaid 依赖图
- 核心模块说明
- 常见调用路径

**Step 4: 验证 README.md 更新**

确认 README.md 包含 call-graph.md 的链接。

---

## 完成清单

- [ ] Task 1: 更新 P0 章节，增加 Serena 激活
- [ ] Task 2: 更新 P2 章节，增加调用链分析
- [ ] Task 3: 更新并发执行策略
- [ ] Task 4: 更新执行计划展示模板
- [ ] Task 5: 更新成功标准
- [ ] Task 6: 更新参数说明
- [ ] Task 7: 更新版本号（1.2.0 → 1.3.0）
- [ ] Task 8: 更新 CHANGELOG.md
- [ ] Task 9: 更新 P5 README 模板
- [ ] Task 10: 验证与提交
- [ ] 手动测试验证
