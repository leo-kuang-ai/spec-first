# 数据库检测 Skill 多数据库支持实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 Agent D 数据库检测添加多数据库支持，通过纯 Skill 驱动实现配置解析和 CLI 验证

**Architecture:** 纯 Skill 驱动，不编写 TypeScript 代码。升级 `agent-database.md` 添加多数据库支持，新增 `database-config.md` 配置指南

**Tech Stack:** Markdown Skill 文档，YAML 配置格式

---

## Task 1: 升级 agent-database.md - 添加多数据库支持章节

**Files:**
- Modify: `skills/spec-first/00-first/references/agent-database.md`

**Step 1: 在文档顶部添加新章节**

在 `## Step 1: 数据库配置检测` 之后，插入以下内容：

\`\`\`markdown
### 检测决策流程

\`\`\`
开始
  │
  ├─ 检查 .spec-first/config.yaml 是否存在 databases 配置段？
  │   │
  │   ├─ YES → 读取配置列表作为基准，跳过自动检测
  │   │        │
  │   │        └─ 仍执行 CLI 验证（检测可用性）
  │   │
  │   └─ NO  → 启动自动检测流程
  │              │
  │              ├─ Step 1: 环境变量检测
  │              ├─ Step 2: ORM 配置检测
  │              ├─ Step 3: 框架配置检测
  │              └─ Step 4: 去重
  │
  ├─ 对所有检测到的数据库执行 CLI 验证
  │
  ├─ 显示检测结果列表
  │   │
  │   └─ 询问用户: "是否将检测结果写入配置文件？"
  │        ├─ YES → 写入 .spec-first/config.yaml
  │        └─ NO  → 跳过
  │
  └─ 生成产物
       ├─ 1 个数据库 → 生成 database-er.md
       └─ 多个数据库 → 生成 database-index.md + database-{name}.md
\`\`\`

### 配置优先级

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | 用户显式传入 | `db_url` 参数（最高优先级） |
| 2 | 配置文件 | `.spec-first/config.yaml` 中的 `databases.list` |
| 3 | 环境变量 | `.env`, `.env.local` |
| 4 | ORM 配置 | Prisma, Drizzle, TypeORM, Sequelize, Mongoose |
| 5 | 框架配置 | application.yml, settings.py, database.yml |

### 多数据库场景处理

当检测到多个数据库时：
1. 按连接标识去重（相同 `DATABASE_URL` 或 `DB_HOST+DB_NAME` 视为同一库）
2. 交互式确认检测到的数据库列表
3. 询问是否将结果写入配置文件
4. 生成索引文档 + 各数据库独立文档

### 配置写入（可选）

检测完成后，如果用户选择写入配置，将以下内容追加到 `.spec-first/config.yaml`：

\`\`\`yaml
databases:
  auto_detect: false  # 禁用自动检测，使用配置
  list:
    - name: primary
      type: postgresql
      primary: true
      purpose: 主业务数据库
      connection:
        env_var: DATABASE_URL
      orm: prisma
\`\`\`
\`\`\`

**Step 2: 添加环境变量检测规则表**

在 `### 检测优先级` 表格之后，插入以下内容：

\`\`\`markdown
### 环境变量检测模式

| 变量模式 | 示例 | 推断类型 | 数据库名推断 |
|---------|------|----------|-------------|
| `DATABASE_URL` | `postgresql://...` | 从协议推断 | `default` |
| `{NAME}_DATABASE_URL` | `ANALYTICS_DATABASE_URL` | 从协议推断 | `analytics` |
| `DB_HOST` + `DB_NAME` | `DB_HOST=localhost` | 默认 MySQL | `default` |
| `{NAME}_DB_HOST` | `ANALYTICS_DB_HOST` | MySQL | `analytics` |
| `POSTGRES_HOST` | - | PostgreSQL | `default` |
| `MONGO_URI` | - | MongoDB | `default` |
| `MONGODB_URI` | - | MongoDB | `mongodb` |

### 协议识别规则

| 协议前缀 | 数据库类型 |
|---------|-----------|
| `postgres://` / `postgresql://` | PostgreSQL |
| `mysql://` / `mysql2://` | MySQL |
| `sqlite://` / `file:` | SQLite |
| `mongodb://` / `mongodb+srv://` | MongoDB |
| `oracle://` | Oracle |
| `mssql://` / `sqlserver://` | SQL Server |
\`\`\`

**Step 3: 添加 ORM 配置检测规则**

在环境变量检测之后，插入：

\`\`\`markdown
### ORM 配置文件检测

| ORM | 配置文件 | 检测内容 |
|-----|---------|---------|
| **Prisma** | `prisma/schema.prisma` | `provider` 字段 + `url` env 变量名 |
| **Drizzle** | `drizzle.config.{ts,js}` | 连接配置 |
| **TypeORM** | `data-source.{ts,js,json}` | `type` 字段 + 连接配置 |
| **Sequelize** | `.sequelizerc` / `config/database.js` | 连接配置 |
| **Mongoose** | `config/mongoose.ts` | 连接字符串 |

### Prisma 示例解析

\`\`\`prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
\`\`\`

→ 推断结果: `type=postgresql`, `envVar=DATABASE_URL`, `name=default`
\`\`\`

**Step 4: 添加 CLI 验证章节**

在文档中 `### 数据库类型 → CLI 映射` 表格之后，扩展为：

\`\`\`markdown
### CLI 验证命令

| 数据库类型 | CLI 工具 | 验证命令 | 获取表列表 |
|-----------|---------|---------|-----------|
| MySQL | `mysql` | `mysql -h $DB_HOST -u $DB_USER -p -e "SELECT 1;"` | `mysql -h $DB_HOST -u $DB_USER -p -e "SHOW TABLES;"` |
| PostgreSQL | `psql` | `psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"` | `psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"` |
| SQLite | `sqlite3` | `sqlite3 $DB_PATH ".tables"` | `sqlite3 $DB_PATH ".tables"` |
| MongoDB | `mongosh` | `mongosh --eval "db.adminCommand('ping')"` | `mongosh --eval "db.getCollectionNames()"` |
| Oracle | `sqlplus` | `sqlplus -s $DB_USER/$DB_PASSWORD@$DB_HOST <<EOF\nSELECT 1 FROM DUAL;\nEXIT;\nEOF` | `SELECT table_name FROM user_tables;` |
| SQL Server | `sqlcmd` | `sqlcmd -S $DB_HOST -U $DB_USER -P $DB_PASS -Q "SELECT 1;"` | `SELECT * FROM INFORMATION_SCHEMA.TABLES;` |

### 验证状态标记

| 状态标记 | 含义 |
|---------|------|
| `[已验证 ✓]` | CLI 可用且连接成功 |
| `[CLI不可用]` | CLI 工具未安装 |
| `[未验证]` | CLI 可用但连接失败 |
| `[连接超时]` | 连接超时 |

### CLI 不可用时的处理

| 场景 | 处理方式 |
|------|----------|
| CLI 工具未安装 | 跳过连接验证，仍生成文档，标记 `[CLI不可用]` |
| 连接失败 | 跳过表结构获取，生成模板文档，标记 `[未验证]` |
| 超时 | 跳过该数据库，记录警告，标记 `[连接超时]` |
\`\`\`

**Step 5: 添加多数据库产物格式章节**

在文档末尾、质量检查章节之前，插入：

\`\`\`markdown
## Step 3: 多数据库产物生成

### 产物决策

| 检测结果 | 产物 |
|---------|------|
| 0 个数据库 | 输出提示，跳过文档生成 |
| 1 个数据库 | 生成 `database-er.md` |
| 2+ 个数据库 | 生成 `database-index.md` + `database-{name}.md` |

### 多数据库索引文档格式

**文件**: `docs/first/database-index.md`

\`\`\`yaml
---
last_updated: {{DATE}}
database_count: {{COUNT}}
---

# 数据库索引

## 概述

本项目使用 **{{COUNT}} 个数据库**：{{数据库类型列表}}。

## 数据库列表

| 名称 | 类型 | 用途 | 状态 | 文档 |
|------|------|------|------|------|
| {{name}} | {{type}} | {{purpose}} | {{status}} | [database-{{name}}.md](database-{{name}}.md) |

## CLI 快速连接

\`\`\`bash
# {{数据库1名称}}
{{CLI连接命令}}

# {{数据库2名称}}
{{CLI连接命令}}
\`\`\`

## 数据分布

| 数据库 | 主要表数量 | 主要业务 |
|--------|-----------|---------|
| {{name}} | {{count}} | {{业务描述}} |

## 跨库关系

> 注：如存在跨库关联，在此说明同步方式

| 源库 | 目标库 | 同步方式 | 频率 |
|------|--------|----------|------|
\`\`\`

### 单数据库文档格式（扩展 frontmatter）

**文件**: `docs/first/database-{name}.md` 或 `database-er.md`

在现有 frontmatter 基础上，多数据库场景新增：

\`\`\`yaml
---
last_updated: {{DATE}}
database_type: {{TYPE}}
cli_tool: {{CLI_TOOL}}
database_name: {{NAME}}      # 多数据库时必需
is_primary: {{true|false}}    # 多数据库时必需
---
\`\`\`

### 去重规则

按以下优先级去重（保留优先级最高的来源）：
1. 配置文件 > 环境变量 > ORM 配置 > 框架配置
2. 同一数据库以 `连接标识` 判断：`envVar` 或 `host+port+database`
\`\`\`

**Step 6: 更新质量检查章节以支持多数据库**

找到 `### 生成后自动检查` 章节，更新命令：

\`\`\`markdown
### 生成后自动检查

\`\`\`bash
# 1. 敏感信息检查（应无输出）
grep -i "password\|token\|secret" docs/first/database-*.md
grep -Ei "://[^[:space:]]+:[^[:space:]]+@" docs/first/database-*.md

# 2. 禁止内容检查（应无输出）
grep "## 表结构详情" docs/first/database-*.md
grep "## 字段详情" docs/first/database-*.md

# 3. 文件大小检查
wc -c docs/first/database-*.md
wc -l docs/first/database-*.md
\`\`\`
\`\`\`

**Step 7: 验证修改**

检查：文件结构完整，无 Markdown 语法错误

Run: \`\`\`bash
head -100 skills/spec-first/00-first/references/agent-database.md
\`\`\`

Expected: 文件开头包含新增的多数据库支持章节

**Step 8: 提交变更**

\`\`\`bash
git add skills/spec-first/00-first/references/agent-database.md
git commit -m "docs(agent-database): 添加多数据库支持与 CLI 验证流程"
\`\`\`

---

## Task 2: 创建 database-config.md 配置指南

**Files:**
- Create: `skills/spec-first/00-first/references/database-config.md`

**Step 1: 创建文件并写入头部内容**

\`\`\`markdown
# 数据库配置指南

> 版本: 1.0.0 | 日期: 2026-03-03

本文档说明如何通过 `.spec-first/config.yaml` 配置数据库，用于 Spec-First 数据库检测。

---

## 配置位置

配置文件位于项目根目录：

\`\`\`
your-project/
├── .spec-first/
│   ├── config.yaml          # 项目级配置（可提交）
│   ├── meta/
│   │   └── config.yaml      # 包级基线
│   └── local/
│       └── config.yaml      # 本地覆盖（不提交）
\`\`\`

---

## 显式配置（推荐）

在 `.spec-first/config.yaml` 中添加 `databases` 配置段：

\`\`\`yaml
databases:
  # 未配置 list 时，是否自动检测
  auto_detect: false

  # 数据库列表
  list:
    - name: primary
      type: postgresql
      primary: true
      purpose: 主业务数据库
      connection:
        env_var: DATABASE_URL
      orm: prisma

    - name: analytics
      type: mysql
      purpose: 数据分析仓库
      connection:
        env_var: ANALYTICS_DB_URL
      orm: none
\`\`\`

### 配置字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | string | ✓ | - | 数据库唯一标识，用于文档命名 |
| `type` | enum | ✓ | - | mysql/postgresql/sqlite/oracle/sqlserver/mongodb |
| `primary` | boolean | - | false | 是否主数据库 |
| `purpose` | string | - | - | 用途描述 |
| `connection.env_var` | string | - | - | 环境变量名 |
| `orm` | enum | - | none | prisma/drizzle/typeorm/sequelize/mongoose/none |

### type 枚举值

| 值 | 数据库类型 |
|----|-----------|
| `mysql` | MySQL / MariaDB |
| `postgresql` | PostgreSQL |
| `sqlite` | SQLite |
| `oracle` | Oracle Database |
| `sqlserver` | Microsoft SQL Server |
| `mongodb` | MongoDB |
\`\`\`

**Step 2: 添加配置示例章节**

\`\`\`markdown
## 配置示例

### 单数据库（PostgreSQL + Prisma）

\`\`\`yaml
databases:
  auto_detect: false
  list:
    - name: default
      type: postgresql
      primary: true
      purpose: 主业务数据库
      connection:
        env_var: DATABASE_URL
      orm: prisma
\`\`\`

对应的环境变量：

\`\`\`bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
\`\`\`

### 多数据库（主库 + 分析库）

\`\`\`yaml
databases:
  auto_detect: false
  list:
    - name: primary
      type: postgresql
      primary: true
      purpose: 主业务数据库
      connection:
        env_var: DATABASE_URL
      orm: prisma

    - name: analytics
      type: mysql
      purpose: 数据分析仓库
      connection:
        env_var: ANALYTICS_DB_URL
      orm: none
\`\`\`

对应的环境变量：

\`\`\`bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
ANALYTICS_DB_URL="mysql://user:password@localhost:3306/analytics"
\`\`\`

### SQLite 本地开发

\`\`\`yaml
databases:
  auto_detect: false
  list:
    - name: local
      type: sqlite
      primary: true
      purpose: 本地开发数据库
      connection:
        env_var: DB_PATH
      orm: prisma
\`\`\`

对应的环境变量：

\`\`\`bash
# .env
DB_PATH="prisma/dev.db"
\`\`\`

### MongoDB

\`\`\`yaml
databases:
  auto_detect: false
  list:
    - name: mongo
      type: mongodb
      primary: true
      purpose: 文档存储
      connection:
        env_var: MONGO_URI
      orm: mongoose
\`\`\`

对应的环境变量：

\`\`\`bash
# .env
MONGO_URI="mongodb://localhost:27017/mydb"
\`\`\`
\`\`\`

**Step 3: 添加自动检测说明**

\`\`\`markdown
## 自动检测模式

当 `databases.auto_detect: true` 或未配置 `databases.list` 时，启用自动检测。

### 检测顺序

1. **环境变量** — 扫描 `.env`、`.env.local`
2. **ORM 配置** — Prisma、Drizzle、TypeORM 等
3. **框架配置** — Spring、Django、Rails 等

### 支持的环境变量模式

| 模式 | 示例 | 推断类型 |
|------|------|----------|
| `DATABASE_URL` | `postgresql://...` | 从协议推断 |
| `{NAME}_DATABASE_URL` | `ANALYTICS_DATABASE_URL` | 从协议推断 |
| `DB_HOST` + `DB_NAME` | `DB_HOST=localhost` | MySQL |
| `POSTGRES_HOST` | - | PostgreSQL |
| `MONGO_URI` | - | MongoDB |
| `MONGODB_URI` | - | MongoDB |

### 协议识别

| 协议前缀 | 数据库类型 |
|---------|-----------|
| `postgres://` / `postgresql://` | PostgreSQL |
| `mysql://` / `mysql2://` | MySQL |
| `sqlite://` / `file:` | SQLite |
| `mongodb://` / `mongodb+srv://` | MongoDB |
| `oracle://` | Oracle |
| `mssql://` / `sqlserver://` | SQL Server |

### 首次检测后

检测完成后，会询问是否将结果写入配置文件：

\`\`\`
检测到 2 个数据库:

1. primary (PostgreSQL) - 主业务库 [已验证 ✓]
2. analytics (MySQL) - 数据分析 [已验证 ✓]

是否将检测结果写入配置文件？
- [Y] 是 - 下次跳过检测，直接使用配置
- [N] 否 - 每次都重新检测
- [S] 跳过 - 仅生成文档
\`\`\`
\`\`\`

**Step 4: 添加本地配置章节**

\`\`\`markdown
## 本地配置（不提交）

对于敏感信息（如开发环境密码），使用 `.spec-first/local/config.yaml`：

\`\`\`yaml
# .spec-first/local/config.yaml (不提交到 git)
databases:
  list:
    - name: primary
      type: postgresql
      connection:
        # 本地开发使用固定连接串
        url_template: "postgresql://dev:dev123@localhost:5432/mydb"
\`\`\`

`.spec-first/local/` 目录应加入 `.gitignore`：

\`\`\`
# .gitignore
.spec-first/local/
\`\`\`
\`\`\`

**Step 5: 完成文件并验证**

检查：文件创建成功，内容完整

Run: \`\`\`bash
cat skills/spec-first/00-first/references/database-config.md | head -50
\`\`\`

Expected: 文件包含完整的配置指南内容

**Step 6: 提交变更**

\`\`\`bash
git add skills/spec-first/00-first/references/database-config.md
git commit -m "docs: 新增数据库配置指南"
\`\`\`

---

## Task 3: 更新 CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: 添加变更记录**

在 CHANGELOG.md 顶部 `## [Unreleased]` 章节（或创建新版本）添加：

\`\`\`markdown
## [Unreleased]

### Added
- agent-database: 多数据库支持，支持配置优先检测和自动检测降级
- database-config: 新增数据库配置指南文档
- 数据库检测支持 CLI 验证，无需安装数据库驱动
\`\`\`

**Step 2: 提交变更**

\`\`\`bash
git add CHANGELOG.md
git commit -m "docs: 记录数据库检测多数据库支持变更"
\`\`\`

---

## Task 4: 更新主 SKILL.md 引用（如需要）

**Files:**
- Check: `skills/spec-first/00-first/SKILL.md`

**Step 1: 检查是否需要更新引用**

Run: \`\`\`bash
grep -n "database-config\|agent-database" skills/spec-first/00-first/SKILL.md
\`\`\`

Expected: 如有引用需要更新，确保新增的 `database-config.md` 被正确引用

**Step 2: 如需更新，添加引用**

\`\`\`markdown
## 参考文档

- `references/agent-database.md` — 数据库检测与 ER 生成
- `references/database-config.md` — 数据库配置指南
\`\`\`

**Step 3: 提交变更**

\`\`\`bash
git add skills/spec-first/00-first/SKILL.md
git commit -m "docs: 添加 database-config 引用"
\`\`\`

---

## 验收标准

所有任务完成后，验证以下内容：

1. ✅ `agent-database.md` 包含多数据库支持章节
2. ✅ `database-config.md` 配置指南已创建
3. ✅ CHANGELOG.md 已更新
4. ✅ 所有文件提交到 git

### 最终验证命令

\`\`\`bash
# 检查文件存在
ls -la skills/spec-first/00-first/references/agent-database.md
ls -la skills/spec-first/00-first/references/database-config.md

# 检查 git 状态
git status
git log --oneline -5
\`\`\`

---

## 相关文档

- 设计文档: `docs/plans/2026-03-03-database-detector-design.md`
- 实现文档: `docs/plans/2026-03-03-database-detector-implementation.md` (本文件)
- 相关 Skill: `skills/spec-first/00-first/references/agent-database.md`
- 配置指南: `skills/spec-first/00-first/references/database-config.md`
