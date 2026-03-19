# 数据库检测 Skill 设计文档

> 版本: 1.0.0 | 日期: 2026-03-03 | 状态: 设计中

---

## 概述

设计一个纯 Skill 驱动的数据库检测模块，支持自动解析项目配置获取数据库信息，适配多数据库场景。

### 核心目标

1. **配置解析**：解析项目配置获取数据库连接信息
2. **文档生成**：生成 ER 图和表清单文档
3. **多数据库支持**：一个项目连接多个数据库的场景

### 设计原则

- **纯 Skill 驱动**：不编写 TypeScript 实现脚本
- **混合模式**：配置优先 + 自动检测降级
- **CLI 验证**：使用系统 CLI 工具，不引入数据库驱动

---

## 架构设计

### 整体流程

```
First Skill Runtime
    │
    ▼
Agent D — Database Detector
    │
    ├─ Step 1: 配置检测 (.spec-first/config.yaml)
    │           └─ 存在 → 使用配置
    │           └─ 不存在 → 自动检测
    │
    ├─ Step 2: 自动检测（混合模式）
    │           ├─ 环境变量 (.env, .env.local)
    │           ├─ ORM 配置 (Prisma, Drizzle, TypeORM, Sequelize, Mongoose)
    │           └─ 框架配置 (application.yml, settings.py, database.yml)
    │
    ├─ Step 3: CLI 验证
    │           └─ 执行测试命令，标记状态
    │
    └─ Step 4: 产物生成
                ├─ 1 个库 → database-er.md
                └─ 多个库 → database-index.md + database-{name}.md
```

### 检测决策树

```
开始
  │
  ├─ .spec-first/config.yaml 存在 databases 配置段？
  │   │
  │   ├─ YES → 读取配置列表作为基准
  │   │        │
  │   │        └─ 仍执行 CLI 验证（检测可用性）
  │   │
  │   └─ NO  → 直接启动自动检测
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
```

---

## 检测规则

### 优先级顺序

| 优先级 | 来源 | 示例 |
|--------|------|------|
| 1 | 用户显式传入 | `db_url` 参数 |
| 2 | 配置文件 | `.spec-first/config.yaml` |
| 3 | 环境变量 | `DATABASE_URL`, `DB_HOST` |
| 4 | ORM 配置 | `prisma/schema.prisma` |
| 5 | 框架配置 | `application.yml` |

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

### 协议识别

| 协议前缀 | 数据库类型 |
|---------|-----------|
| `postgres://` / `postgresql://` | PostgreSQL |
| `mysql://` / `mysql2://` | MySQL |
| `sqlite://` / `file:` | SQLite |
| `mongodb://` / `mongodb+srv://` | MongoDB |
| `oracle://` | Oracle |
| `mssql://` / `sqlserver://` | SQL Server |

### ORM 配置检测

| ORM | 配置文件 | 检测内容 |
|-----|---------|---------|
| Prisma | `prisma/schema.prisma` | `provider` + `url` env |
| Drizzle | `drizzle.config.ts` | 连接配置 |
| TypeORM | `data-source.{ts,js,json}` | `type` + 连接配置 |
| Sequelize | `.sequelizerc` | 连接配置 |
| Mongoose | `config/mongoose.ts` | 连接字符串 |

---

## CLI 验证

### CLI 工具映射

| 数据库类型 | CLI 工具 | 验证命令 | 获取表列表 |
|-----------|---------|---------|-----------|
| MySQL | `mysql` | `mysql -h $DB_HOST -u $DB_USER -p -e "SELECT 1;"` | `mysql -h $DB_HOST -u $DB_USER -p -e "SHOW TABLES;"` |
| PostgreSQL | `psql` | `psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"` | `psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"` |
| SQLite | `sqlite3` | `sqlite3 $DB_PATH ".tables"` | `sqlite3 $DB_PATH ".tables"` |
| MongoDB | `mongosh` | `mongosh --eval "db.adminCommand('ping')"` | `mongosh --eval "db.getCollectionNames()"` |
| Oracle | `sqlplus` | `sqlplus -s $DB_USER/$DB_PASSWORD@$DB_HOST <<EOF\nSELECT 1 FROM DUAL;\nEXIT;\nEOF` | `SELECT table_name FROM user_tables;` |
| SQL Server | `sqlcmd` | `sqlcmd -S $DB_HOST -U $DB_USER -P $DB_PASS -Q "SELECT 1;"` | `SELECT * FROM INFORMATION_SCHEMA.TABLES;` |

### 状态标记

| 状态 | 含义 |
|------|------|
| `[已验证 ✓]` | CLI 可用且连接成功 |
| `[CLI不可用]` | CLI 工具未安装 |
| `[未验证]` | CLI 可用但连接失败 |
| `[连接超时]` | 连接超时 |

---

## 配置 Schema

### .spec-first/config.yaml 扩展

```yaml
databases:
  # 未配置 list 时，是否自动检测
  auto_detect: true

  # 数据库列表（可选）
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
```

### 字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | string | ✓ | - | 数据库唯一标识 |
| `type` | enum | ✓ | - | mysql/postgresql/sqlite/oracle/sqlserver/mongodb |
| `primary` | boolean | - | false | 是否主数据库 |
| `purpose` | string | - | - | 用途描述 |
| `connection.env_var` | string | - | - | 环境变量名 |
| `orm` | enum | - | none | prisma/drizzle/typeorm/sequelize/mongoose/none |

---

## 产物格式

### 单数据库场景

产物：`docs/first/database-er.md`

```yaml
---
last_updated: 2026-03-03
database_type: PostgreSQL
cli_tool: psql
---

# 项目名 数据库 ER 图

## 概述
- **数据库类型**: PostgreSQL
- **开发环境**: PostgreSQL 15.x
- **ORM 框架**: Prisma

## 数据库连接
### CLI 查询
\`\`\`bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"
\`\`\`

## ER 图
\`\`\`mermaid
erDiagram
    User ||--o{ Order : places
    Order ||--|{ OrderItem : contains
\`\`\`

## 核心关系
| 主表 | 从表 | FK 字段 | 基数 | 关系说明 |
|------|------|---------|------|----------|
| User | Order | user_id | 1:N | 一个用户可下多个订单 |

## 表清单
| 表名 | 实体类型 | 用途 |
|------|----------|------|
| User | 主数据 | 用户账户 |
| Order | 事务 | 订单主表 |
```

### 多数据库场景

产物 1：`docs/first/database-index.md`

```yaml
---
last_updated: 2026-03-03
database_count: 2
---

# 数据库索引

## 数据库列表
| 名称 | 类型 | 用途 | 状态 | 文档 |
|------|------|------|------|------|
| primary | PostgreSQL | 主业务库 | [已验证 ✓] | [database-primary.md](database-primary.md) |
| analytics | MySQL | 数据分析 | [已验证 ✓] | [database-analytics.md](database-analytics.md) |

## CLI 快速连接
\`\`\`bash
# 主数据库
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# 分析数据库
mysql -h $ANALYTICS_DB_HOST -u $ANALYTICS_DB_USER -p $ANALYTICS_DB_NAME
\`\`\`
```

产物 2：`docs/first/database-{name}.md`

格式同单数据库，新增 `database_name` frontmatter。

---

## 边界处理

### CLI 不可用时的处理

| 场景 | 处理方式 | 产物标记 |
|------|----------|----------|
| CLI 工具未安装 | 跳过连接验证，仍生成文档 | `[CLI不可用]` |
| 连接失败 | 跳过表结构获取，生成模板文档 | `[未验证]` |
| 超时 | 跳过该数据库，记录警告 | `[连接超时]` |

### 敏感信息处理

> 注：本地开发/内网环境可简化脱敏要求，但仍建议避免在文档中硬编码密码

| 禁止输出 | 推荐输出 |
|----------|----------|
| `password=123456` | `password=***` 或 `$DB_PASSWORD` |
| `postgresql://user:pass@...` | `postgresql://user:***@...` 或 `$DATABASE_URL` |
| 硬编码连接串 | 环境变量引用 `$DATABASE_URL` |

### 边界场景

| 场景 | 行为 |
|------|------|
| 无数据库 | 输出提示，跳过文档生成 |
| 所有 CLI 不可用 | 生成索引文档，标记 `[CLI不可用]` |
| 配置冲突 | 配置优先级 > 自动检测 |
| 同名数据库 | 按来源去重 |

---

## 质量检查

### 生成后自检命令

```bash
# 敏感信息检查（应无输出）
grep -i "password\|token\|secret" docs/first/database-*.md

# 连接串泄露检查（应无输出）
grep -Ei "://[^[:space:]]+:[^[:space:]]+@" docs/first/database-*.md

# 文件大小检查
wc -c docs/first/database-*.md
```

---

## 配置文件位置

```
your-project/
├── .spec-first/
│   ├── config.yaml          # 项目级配置（可提交）
│   ├── meta/
│   │   └── config.yaml      # 包级基线
│   └── local/
│       └── config.yaml      # 本地覆盖（不提交）
├── src/
└── docs/
    └── first/
        ├── database-index.md    # 索引（多库时）
        ├── database-primary.md  # 主库文档
        └── database-analytics.md # 分析库文档
```

---

## 实现计划

本设计将更新以下文件：

1. `skills/spec-first/00-first/references/agent-database.md` - 升级现有文档
2. `skills/spec-first/00-first/references/database-config.md` - 新增配置指南

无需编写 TypeScript 实现代码。
