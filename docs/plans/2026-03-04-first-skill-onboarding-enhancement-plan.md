# First Skill 新手引导增强 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 First Skill 中新增「新手必读」和「开发入口」两个章节，帮助新手快速理解项目并开始开发。

**Architecture:** 通过修改 SKILL.md 规格和 agents-code-analysis.md 模板，在现有产物中注入新章节内容，不新增产物文件。

**Tech Stack:** TypeScript, Markdown, Skill 规格系统

---

## Task 1: 更新 SKILL.md 产物清单描述

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md:246`

**Step 1: 修改 codebase-overview.md 描述**

在产物清单中，找到 `codebase-overview.md` 的描述行，更新为包含「开发入口」章节：

```markdown
    ├── codebase-overview.md     # 代码结构概览 + 开发入口 [quick]
```

**Step 2: 验证修改**

Run: `grep -n "codebase-overview.md" skills/spec-first/00-first/SKILL.md`
Expected: 输出包含 `代码结构概览 + 开发入口`

**Step 3: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "docs(skill): 产物清单增加开发入口章节描述"
```

---

## Task 2: 更新 SKILL.md 成功标准

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md:614`

**Step 1: 更新 quick 模式 codebase-overview.md 最低要求**

找到成功标准表格中 `codebase-overview.md` 的行：

原内容：
```markdown
| `codebase-overview.md` | 至少包含：目录结构、模块划分（3+ 个模块）、入口文件 |
```

改为：
```markdown
| `codebase-overview.md` | 至少包含：目录结构、模块划分（3+ 个模块）、入口文件、开发入口章节 |
```

**Step 2: 更新 deep 模式 README.md 最低要求**

找到成功标准表格中 `README.md` 的行：

原内容：
```markdown
| `README.md` | 包含所有已生成产物的链接 |
```

改为：
```markdown
| `README.md` | 包含新手必读章节、所有已生成产物的链接 |
```

**Step 3: 验证修改**

Run: `grep -A2 "codebase-overview.md" skills/spec-first/00-first/SKILL.md | grep "开发入口"`
Expected: 输出包含 `开发入口章节`

**Step 4: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "docs(skill): 成功标准增加开发入口和新手必读要求"
```

---

## Task 3: 更新 SKILL.md P3 阶段说明

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md:586-591`

**Step 1: 更新 deep 模式 P3 阶段 README 生成说明**

找到 `deep 模式` 下的 `2. 生成 README.md` 行：

原内容：
```markdown
2. 生成 README.md（索引导航文档）
```

改为：
```markdown
2. 生成 README.md（包含新手必读章节 + 索引导航）
```

**Step 2: 验证修改**

Run: `grep -n "新手必读" skills/spec-first/00-first/SKILL.md`
Expected: 输出包含修改后的行

**Step 3: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "docs(skill): P3 阶段 README 生成说明增加新手必读"
```

---

## Task 4: 更新 agents-code-analysis.md A1 规格

**Files:**
- Modify: `skills/spec-first/00-first/references/agents-code-analysis.md`

**Step 1: 在 A1 quick 模式列表中增加「开发入口」**

找到 `quick 模式（默认）` 部分，在列表末尾增加：

```markdown
**quick 模式（默认）**：
- 目录树（2-3 层深度）
- 模块划分与职责说明
- 入口文件识别
- 构建/运行命令
- **开发入口章节**（常见任务 → 文件路径映射）
```

**Step 2: 在 A1 输出说明后增加「开发入口」章节模板**

在 A1 规格的输出说明部分（`输出 → docs/first/codebase-overview.md` 之前），插入开发入口章节模板。

找到 agents-code-analysis.md 中 A1 的输出说明部分，在其之前插入以下内容：

````markdown
### 开发入口章节模板

A1 在 codebase-overview.md 末尾必须包含「开发入口」章节：

```markdown
## 开发入口

> 告诉你"改什么功能 → 改哪个文件"（按当前项目技术栈自适应）

### 常见开发任务

| 任务 | 文件/目录（按实际项目填写） | 说明 |
|------|-----------------------------|------|
| 新增 API 端点 | `<api-layer-dir>` | 如 `src/api/` / `app/controllers/` / `internal/transport/http/` |
| 新增业务逻辑 | `<service-or-domain-dir>` | 如 `src/services/` / `app/services/` / `internal/domain/` |
| 新增页面/组件 | `<ui-dir>` | 如 `src/pages/` / `src/components/` / `web/src/views/` |
| 修改数据模型 | `<data-model-file-or-dir>` | 如 `prisma/schema.prisma` / `models/` / `pkg/model/` |
| 修改配置 | `<config-file-or-dir>` | 如 `config/` / `.env` / `application.yml` |
| 添加测试 | `<test-dir>` | 如 `tests/` / `__tests__/` / `test/` |
| 修改定时任务 | `<job-or-cron-dir>` | 如 `src/jobs/` / `cron/` / `cmd/scheduler/` |

### 快速定位

- **应用入口**：`<entry-file-or-command>`
- **路由注册**：`<routing-file-or-dir>`
- **数据访问层**：`<db-or-repository-dir>`
- **中间件/拦截器**：`<middleware-or-filter-dir>`

> 规则：优先填写仓库中真实存在的路径；若未检测到对应目录，标注 `[待确认: 未检测到对应目录]`，禁止虚构。
```

**按端类型调整映射**：

| 端类型 | 开发入口重点 |
|--------|-------------|
| backend | API 路由、服务层、数据库模型、定时任务 |
| frontend | 页面组件、API 调用、状态管理、样式文件 |
| mobile | 屏幕/导航、API 客户端、本地存储 |
| cross-platform | 按子目录区分（如 web/、mobile/） |
| monorepo | 按 package 区分，逐包列出开发入口 |

**降级策略**：
- 无法识别端类型时，使用通用模板（包含所有常见目录）
- 检测到的目录不存在时，标注 `[待确认: 目录不存在]`
````

**Step 3: 验证修改**

Run: `grep -n "开发入口章节模板" skills/spec-first/00-first/references/agents-code-analysis.md`
Expected: 输出包含新增的行号

**Step 4: Commit**

```bash
git add skills/spec-first/00-first/references/agents-code-analysis.md
git commit -m "docs(skill): A1 规格增加开发入口章节模板"
```

---

## Task 5: 新增 README.md 新手必读模板到 SKILL.md

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`

**Step 1: 在产物清单章节后增加 README 新手必读模板**

在 SKILL.md 的产物清单章节之后（`**产物 frontmatter 格式**:` 部分之后，下一个 `---` 分隔符之前），新增一个章节：

````markdown
### README.md 新手必读章节模板（deep 模式）

README.md 开头必须包含「新手必读」章节：

```markdown
## 新手必读

### 快速入门路径（预计 15-20 分钟）

**Step 1: 了解项目**（5 分钟）
→ 先读 `tech-stack.md` 了解技术栈
→ 再读 `domain-model.md` 了解业务核心概念

**Step 2: 理解结构**（5 分钟）
→ 读 `codebase-overview.md` 了解代码组织
→ 读 `architecture.md` 了解系统架构

**Step 3: 开始开发**（5 分钟）
→ 读 `local-setup.md` 搭建本地环境
→ 读 `development-guidelines.md` 了解开发规范
→ 参考 `codebase-overview.md` 的「开发入口」章节找到改动的文件

### 按角色推荐

| 角色 | 重点文档 |
|------|----------|
| 后端开发 | domain-model → api-docs → database-er → codebase-overview |
| 前端开发 | tech-stack → api-docs → codebase-overview → development-guidelines |
| 全栈开发 | 按快速入门路径顺序 |
```
````

**Step 2: 验证修改**

Run: `grep -n "新手必读" skills/spec-first/00-first/SKILL.md`
Expected: 输出包含多个匹配（模板标题 + 成功标准引用）

**Step 3: Commit**

```bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "docs(skill): README 产物增加新手必读章节模板"
```

---

## Task 6: 验证文档一致性

**Files:**
- Check: `skills/spec-first/00-first/SKILL.md`
- Check: `skills/spec-first/00-first/references/agents-code-analysis.md`

**Step 1: 检查 SKILL.md 与 references 的一致性**

Run: `grep -c "开发入口" skills/spec-first/00-first/SKILL.md skills/spec-first/00-first/references/agents-code-analysis.md`
Expected: 两个文件都有匹配

**Step 2: 检查成功标准与模板对应**

Run: `grep "新手必读" skills/spec-first/00-first/SKILL.md`
Expected: 成功标准表格和模板章节都有引用

**Step 3: 手动验证模板完整性**

检查以下内容是否存在：
- [ ] SKILL.md 产物清单：codebase-overview 描述包含「开发入口」
  ```bash
  grep "codebase-overview.md" skills/spec-first/00-first/SKILL.md | grep "开发入口"
  ```
- [ ] SKILL.md 成功标准：codebase-overview 最低要求包含「开发入口章节」
  ```bash
  grep -A1 "codebase-overview.md" skills/spec-first/00-first/SKILL.md | grep "开发入口章节"
  ```
- [ ] SKILL.md 成功标准：README 最低要求包含「新手必读章节」
  ```bash
  grep "README.md" skills/spec-first/00-first/SKILL.md | grep "新手必读"
  ```
- [ ] SKILL.md 新手必读模板：存在完整的 3 步骤阅读路径
  ```bash
  grep -A 20 "快速入门路径" skills/spec-first/00-first/SKILL.md | grep -c "Step"
  # Expected: 3
  ```
- [ ] agents-code-analysis.md A1 规格：包含开发入口章节模板
  ```bash
  grep "开发入口章节模板" skills/spec-first/00-first/references/agents-code-analysis.md
  ```
- [ ] agents-code-analysis.md 端类型映射：存在按端类型调整的说明
  ```bash
  grep -A 5 "按端类型调整映射" skills/spec-first/00-first/references/agents-code-analysis.md | grep -c "backend\|frontend\|mobile"
  # Expected: >= 3
  ```

**Step 4: Commit（如有修复）**

```bash
git add skills/spec-first/00-first/
git commit -m "docs(skill): 修复文档一致性问题"  # 仅在需要时执行
```

---

## Task 7: 最终提交与变更日志

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: 更新 CHANGELOG.md**

先读取当前版本号，然后在 CHANGELOG.md 顶部添加新版本记录：

```bash
# 读取当前版本
CURRENT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
NEXT_VERSION="0.5.46"  # 基于当前 0.5.45

# 在 CHANGELOG.md 顶部添加
echo "- v${NEXT_VERSION} 2026-03-04 Claude: First Skill 新手引导增强 — README 新增新手必读章节、codebase-overview 新增开发入口章节 (user-visible)" >> CHANGELOG.md.tmp
cat CHANGELOG.md >> CHANGELOG.md.tmp
mv CHANGELOG.md.tmp CHANGELOG.md
```

或手动编辑 CHANGELOG.md，在顶部添加：
```markdown
- v0.5.46 2026-03-04 Claude: First Skill 新手引导增强 — README 新增新手必读章节、codebase-overview 新增开发入口章节 (user-visible)
```

**Step 2: 验证所有改动**

Run: `git status`
Expected: 仅有 CHANGELOG.md 未提交（其他已提交）

**Step 3: 最终 Commit**

```bash
git add CHANGELOG.md
git commit -m "chore: 更新 CHANGELOG 记录 First Skill 新手引导增强"
```

---

## 验收清单

- [ ] quick 模式 codebase-overview.md 成功标准包含「开发入口章节」
- [ ] deep 模式 README.md 成功标准包含「新手必读章节」
- [ ] A1 规格包含完整的开发入口章节模板
- [ ] README 新手必读模板包含 3 步骤阅读路径
- [ ] 端类型映射表存在（backend/frontend/mobile/cross-platform/monorepo）
- [ ] CHANGELOG.md 已更新
- [ ] 所有改动已提交

---

## 风险与回滚

**风险**：
- 模板内容可能与实际项目不符 → 使用 `[待确认]` 标注
- 端类型检测失败 → 降级到通用模板

**回滚**：
```bash
git revert HEAD~7..HEAD  # 回滚最近 7 个 commit
```
