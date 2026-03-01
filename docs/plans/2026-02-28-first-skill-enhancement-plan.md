# First Skill 增强版实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 增强 spec-first:first skill，新增研发规范文档和索引导航文档，从 7 个产物扩展为 9 个。

**Architecture:** 纯 Prompt-based Skill 更新，不涉及 TypeScript 代码。修改 SKILL.md 文档的产物清单、并发执行策略和 P1/P2/P5 阶段描述，新增 development-guidelines.md 和 README.md 的生成逻辑。

**Tech Stack:** Markdown 文档编辑，Spec-First Skill 格式规范

---

## Task 1: 更新 SKILL.md 产物清单

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 读取当前 SKILL.md**

确认当前产物清单章节的位置和内容。

**Step 2: 更新产物清单章节**

将产物清单从 7 个更新为 9 个：

```markdown
### 产物清单

```
docs/
└── first/
    ├── README.md                # 索引导航
    ├── tech-stack.md            # 技术栈识别摘要
    ├── external-deps.md         # 外部依赖与第三方服务
    ├── codebase-overview.md     # 代码库概览
    ├── architecture.md          # 架构图（Mermaid）
    ├── api-docs.md              # API 接口文档
    ├── development-guidelines.md # 研发规范（代码风格、提交规范、测试要求等）
    ├── local-setup.md           # 本地环境搭建指南
    └── database-er.md           # ER 图 + 字段详情（如有 DB）
```
```

**Step 3: 验证变更**

检查产物清单是否正确列出 9 个文件。

---

## Task 2: 更新并发执行策略

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 定位并发执行策略章节**

找到 "## 并发执行策略" 章节。

**Step 2: 更新 Agent C 的执行顺序**

将 Agent C 的产物从 `external-deps.md → local-setup.md` 更新为：

```markdown
| C | external-deps.md → development-guidelines.md → local-setup.md | 串行（环境依赖外部服务和研发规范） |
```

**Step 3: 验证变更**

确认表格中 Agent C 的顺序正确。

---

## Task 3: 更新 P1 阶段 - 新增项目名和 Context7 映射收集

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 定位 P1 阶段描述**

找到 "### P1: 技术栈识别" 章节。

**Step 2: 在阶段开头增加项目名称识别**

在 "9 种语言检测" 之前增加：

```markdown
**项目名称识别**：
- 从 `package.json` name / `pom.xml` artifactId / `go.mod` module / `Cargo.toml` package.name 等提取
- 备用：使用目录名

输出 → 传递给 P5 用于 README.md 生成
```

**Step 3: 在阶段末尾增加 Context7 映射收集**

在 "输出 → `docs/first/tech-stack.md`" 之后增加：

```markdown
**Context7 映射收集**（传递给 Agent C，用于 development-guidelines.md 最佳实践对比）：

| 检测特征 | Context7 库 ID | 查询内容 |
|----------|----------------|----------|
| `eslint` | `/eslint/eslint` | 推荐规则配置 |
| `prettier` | `/prettier/prettier` | 最佳实践选项 |
| `typescript` | `/microsoft/typescript` | tsconfig strict 模式 |
| `vitest` | `/vitest-dev/vitest` | 覆盖率配置 |
| `react` | `/facebook/react` | Hooks 规范 |
| `vue` | `/vuejs/core` | 组合式 API |
| `@nestjs/core` | `/nestjs/nest` | 项目结构 |
| `fastify` | `/fastify/fastify` | 插件生态 |
| `django` | `/django/django` | 项目结构 |
| `fastapi` | `/tiangolo/fastapi` | 依赖注入 |
| `spring-boot-starter` | `/spring-projects/spring-boot` | 配置外化 |
| `gin-gonic/gin` | `/gin-gonic/gin` | 中间件链 |
| `laravel/framework` | `/laravel/framework` | 服务容器 |
| `rails` | `/rails/rails` | RESTful 约定 |

注意：最多查询 5 个核心库，单个超时 10 秒，总超时 30 秒。
```

**Step 4: 验证变更**

确认 P1 阶段包含项目名识别和 Context7 映射收集。

---

## Task 4: 更新 P2 阶段 - 新增 development-guidelines.md 生成逻辑

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 定位 P2 阶段中 Agent C 的描述**

找到 "本地环境搭建指南" 部分（在 `local-setup.md` 之前）。

**Step 2: 在 local-setup.md 之前插入 development-guidelines.md 章节**

```markdown
**研发规范文档（development-guidelines.md）：**

基于 P1 传递的技术栈和 Context7 映射，分析项目实际遵循的开发规范：

**6 个规范模块**：

| 模块 | 检测方式 |
|------|----------|
| 代码风格 | ESLint/Prettier/Black/gofmt/rustfmt 配置；代码采样（deep 模式） |
| 提交规范 | commitlint 配置；`git log -50` 格式分析 |
| 测试要求 | 测试框架配置；覆盖率阈值；tests/ 目录结构 |
| 文档规范 | JSDoc/Docstring 配置；注释采样 |
| 错误处理 | 日志框架依赖（winston/pino/logging）；异常处理模式采样 |
| 依赖管理 | 包管理器（npm/pnpm/yarn/pip/cargo）；lock 文件策略；版本规则 |

**文档结构**：

```markdown
---
last_updated: 2026-02-28
context7_sources: [...]
---

# 项目研发规范

> 本文档基于项目实际代码和配置自动生成，并结合业界最佳实践进行对比分析。

## 代码风格

**当前规范**:
- 缩进: 2 空格（证据：ESLint `indent: 2`）
- 命名: camelCase
- ...

**业界最佳实践** (来源: Context7 - ESLint v9):
- ✅ 2 空格缩进
- ⚠️ 建议启用 `no-unused-vars: error`（当前是 warn）
- ℹ️ 推荐 `@typescript-eslint/no-explicit-any: error`

**改进建议**:
1. 升级 `no-unused-vars` 为 error 级别
2. 启用 `no-explicit-any` 规则

[... 其他模块同理 ...]

## 最佳实践来源

本规范参考了以下 Context7 文档：
- ESLint: https://context7.dev/eslint/eslint
- ...
```

**Adaptive 深度**：
- **Shallow（默认）**：仅读取配置文件
- **Deep（--depth=deep）**：配置 + 代码采样验证，标注"配置 vs 实际"差异

**降级策略**：
- Context7 无该库文档 → 标注 `[最佳实践来源待补充]`
- Context7 API 超时 → 标注 `[最佳实践查询超时，稍后可重试]`
- 项目无技术栈配置 → 输出骨架文档，标注 `[未检测到技术栈配置]`

输出 → `docs/first/development-guidelines.md`
```

**Step 3: 验证变更**

确认 development-guidelines.md 生成逻辑完整，且在 local-setup.md 之前。

---

## Task 5: 更新 P5 阶段 - 新增 README.md 生成逻辑

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 定位 P5 阶段描述**

找到 "### P5: 汇总与提示" 章节。

**Step 2: 更新 P5 阶段内容**

替换为：

```markdown
### P5: 汇总与 README 索引生成

主线程收集所有子 agent 结果后：

1. **生成 README.md**（索引导航文档）

基于 P1 收集的项目名和各 agent 生成状态，创建 `docs/first/README.md`：

```markdown
---
last_updated: 2026-02-28
project_name: [项目名称]
detected_at: 2026-02-28
---

# 项目认知文档

> 本目录由 `spec-first:first` skill 自动生成，提供项目的快速认知。

## 项目概览

| 项目 | [项目名称] |
|------|------------|
| 检测时间 | 2026-02-28 |
| 主要语言 | [JavaScript/Python/Java/...] |
| 主要框架 | [Express/Django/Spring Boot/...] |
| 技术栈详情 | [tech-stack.md](./tech-stack.md) |

## 文档导航

### 基础信息

- [技术栈摘要](./tech-stack.md) — 语言、框架、构建工具
- [外部依赖](./external-deps.md) — 第三方服务与中间件
- [本地环境](./local-setup.md) — 环境搭建指南

### 架构与代码

- [代码库概览](./codebase-overview.md) — 目录结构与模块划分
- [架构图](./architecture.md) — 系统架构与依赖关系
- [API 文档](./api-docs.md) — 接口端点列表

### 开发规范

- [研发规范](./development-guidelines.md) — 代码风格、提交规范、测试要求

### 数据库

- [数据库 ER](./database-er.md) — 表结构与关系（如有）

## 快速开始

1. **查看技术栈** → [tech-stack.md](./tech-stack.md)
2. **搭建本地环境** → [local-setup.md](./local-setup.md)
3. **阅读研发规范** → [development-guidelines.md](./development-guidelines.md)

---

*生成时间: 2026-02-28 | 命令: `/spec-first:first`*
```

2. 输出生成文件清单及路径
3. 提示用户查看 `docs/first/` 目录
```

**Step 3: 验证变更**

确认 P5 阶段包含 README.md 生成逻辑。

---

## Task 6: 更新成功标准

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 定位成功标准章节**

找到 "## 成功标准" 或 "## 确认策略 + 成功标准" 章节。

**Step 2: 更新必须生成的文档列表**

将必须生成的文档从 6 个更新为 8 个：

```markdown
- 必须生成：`tech-stack.md`、`external-deps.md`、`codebase-overview.md`、`architecture.md`、`api-docs.md`、`development-guidelines.md`、`local-setup.md`、`README.md`
```

**Step 3: 增加新文档的验收条件**

在成功标准末尾增加：

```markdown
- `development-guidelines.md` 包含至少 1 个规范模块（代码风格/提交规范/测试要求/文档规范/错误处理/依赖管理）
- `README.md` 索引文档包含所有已生成产物的链接
```

**Step 4: 验证变更**

确认成功标准覆盖 9 个产物（8 个必须 + 1 个条件）。

---

## Task 7: 更新版本号和变更记录

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 定位 front matter 版本号**

找到文件开头的 YAML front matter。

**Step 2: 更新版本号**

```yaml
---
name: "spec-first:first"
description: "识别当前工作空间，生成代码库概览、数据库 ER 文档与研发规范"
version: 1.1.0
last_updated: 2026-02-28
confirm_policy: assisted
changelog: 新增 development-guidelines.md 和 README.md
---
```

**Step 3: 验证变更**

确认版本号从 1.0.0 更新为 1.1.0，描述更新。

---

## Task 8: 更新 CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: 读取 CHANGELOG.md 头部**

确认 [Unreleased] 章节的位置和格式。

**Step 2: 在 [Unreleased] 下添加新版本记录**

```markdown
## [Unreleased]

- v0.5.72 2026-02-28 Leo: feat: 00-first Skill 增强 — 新增研发规范文档（development-guidelines.md，含 6 模块 + Context7 最佳实践对比）和索引导航（README.md），产物从 7 个扩展为 9 个 (user-visible)
```

**Step 3: 验证变更**

确认 CHANGELOG.md 格式与其他记录一致，包含 (user-visible) 标记。

---

## Task 9: 验证 Skill 格式

**Files:**
- Read: `skills/spec-first/00-first/SKILL.md`

**Step 1: 读取完整 SKILL.md**

确认文件格式正确，无语法错误。

**Step 2: 检查 front matter**

确认 YAML front matter 格式正确。

**Step 3: 检查章节完整性**

确认以下章节存在且内容完整：
- 概述
- 参数
- 产物清单
- 并发执行策略
- 执行流程（P0-P5）
- 确认策略
- 成功标准

**Step 4: 检查链接和引用**

确认所有 Markdown 链接格式正确。

---

## Task 10: 提交变更

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
git commit -m "feat: 00-first Skill 增强 - 新增研发规范和索引导航文档

- 新增 development-guidelines.md（6 模块 + Context7 最佳实践）
- 新增 README.md（索引导航）
- 产物从 7 个扩展为 9 个
- 版本号 1.0.0 → 1.1.0

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

```bash
# 进入 spec-first 项目自身作为测试目标
cd /Users/kuang/xiaobu/spec-first

# 触发 skill
/spec-first:first
```

**Step 2: 验证生成的文档**

确认 `docs/first/` 目录包含以下文件：
- [ ] README.md
- [ ] tech-stack.md
- [ ] external-deps.md
- [ ] codebase-overview.md
- [ ] architecture.md
- [ ] api-docs.md
- [ ] development-guidelines.md（新增）
- [ ] local-setup.md

**Step 3: 检查 development-guidelines.md 内容**

确认文档包含：
- [ ] 头部 `last_updated` 和 `context7_sources`
- [ ] 至少 1 个规范模块
- [ ] 当前规范 + 最佳实践对比格式

**Step 4: 检查 README.md 内容**

确认文档包含：
- [ ] 项目概览卡片
- [ ] 文档导航分类
- [ ] 快速开始指南

---

## 完成清单

- [ ] Task 1: 更新产物清单
- [ ] Task 2: 更新并发执行策略
- [ ] Task 3: 更新 P1 阶段
- [ ] Task 4: 更新 P2 阶段
- [ ] Task 5: 更新 P5 阶段
- [ ] Task 6: 更新成功标准
- [ ] Task 7: 更新版本号
- [ ] Task 8: 更新 CHANGELOG.md
- [ ] Task 9: 验证 Skill 格式
- [ ] Task 10: 提交变更
- [ ] 手动测试验证
