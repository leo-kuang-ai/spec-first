# Agent D — 数据库检测与 ER 生成

> 与 Agent A/B/C 并行运行，生成数据库 ER 文档。
> 执行流程：Step 1 配置检测 → Step 2 ER 文档生成。

---

## 质量保障规则（Agent D 通用）

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
- Agent D 的“必须标注证据内容”与“抽样规模”：见统一规则文档中的 Agent 矩阵
- 无法验证项必须显式标记 `[待确认]`

## 凭证防护执行规则（技术性，强制）

- 最小暴露：仅在执行即时连接探测时读取凭证，不写入产物正文、不写入长期缓存。
- 日志脱敏：日志中若出现连接串或口令字段，必须替换敏感片段为 `***`。
- 输出约束：禁止输出密码、完整连接串、长期访问令牌、私钥内容。
- 失败兜底：当 CLI 不可用或鉴权失败时，降级为结构化提示，不回显原始凭证内容。
- 会话清理：探测结束后清理临时环境变量与内存中的明文凭证引用。

---

## Step 1: 数据库配置检测

### 检测优先级

1. 用户显式传入（`db_url`）
2. 环境变量（`.env` / `.env.local`，`DATABASE_URL`、`DB_HOST` 等）
3. ORM 配置（`prisma/schema.prisma`、`models.py`、`drizzle.config.*`、`typeorm.config.*` 等）
4. 框架配置文件（`application.yml`、`settings.py`、`database.yml`、`appsettings.json` 等）

### 检测决策流程

```
开始
  │
  ├─ 检查 .spec-first/meta/config.yaml 是否存在 databases 配置段？
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
  │        ├─ YES → 写入 .spec-first/meta/config.yaml
  │        └─ NO  → 跳过
  │
  └─ 生成产物
       ├─ 1 个数据库 → 生成 database-er.md
       └─ 多个数据库 → 生成 database-index.md + database-{name}.md
```

### 配置优先级

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | 用户显式传入 | `db_url` 参数（最高优先级） |
| 2 | 配置文件 | `.spec-first/meta/config.yaml` 中的 `databases.list` |
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

检测完成后，如果用户选择写入配置，将以下内容追加到 `.spec-first/meta/config.yaml`：

```yaml
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
```

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

### ORM 配置文件检测

| ORM | 配置文件 | 检测内容 |
|-----|---------|---------|
| **Prisma** | `prisma/schema.prisma` | `provider` 字段 + `url` env 变量名 |
| **Drizzle** | `drizzle.config.{ts,js}` | 连接配置 |
| **TypeORM** | `data-source.{ts,js,json}` | `type` 字段 + 连接配置 |
| **Sequelize** | `.sequelizerc` / `config/database.js` | 连接配置 |
| **Mongoose** | `config/mongoose.ts` | 连接字符串 |

### Prisma 示例解析

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

→ 推断结果: `type=postgresql`, `envVar=DATABASE_URL`, `name=default`

### 数据库类型 → CLI 映射

| 数据库 | CLI 工具 |
|--------|----------|
| MySQL/MariaDB | `mysql` |
| PostgreSQL | `psql` |
| SQLite | `sqlite3` |
| Oracle | `sqlplus` |
| SQL Server | `sqlcmd` |
| MongoDB | `mongosh` |

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

### 安全约束

- **禁止输出**：密码、连接串、host/port/user 等敏感信息
- **连接时使用**：凭证仅在内存中保留，执行后清理
- **日志脱敏**：出现连接串时密码替换为 `***`

### 未检测到 DB 时

1. 输出提示"未检测到数据库配置"，继续生成其他文档
2. 询问用户是否手动提供连接信息

---

## Step 2: ER 文档生成

### 核心原则

**文档作为"索引 + 查询入口"，详细信息通过 CLI 实时获取**

| 原则 | 说明 |
|------|------|
| **索引化** | 只记录表名、关系、关键约束 |
| **可执行** | 提供 CLI 查询命令 |
| **轻量化** | 目标 < 200 行 / < 10 KB |

### 🚫 禁止生成

| 禁止项 | 替代方案 |
|--------|----------|
| 逐表字段详细表格 | 提供 CLI 查询方式 |
| ER 图列出所有字段 | 只显示表名 + 关系 |
| 密码/连接串等敏感信息 | 使用环境变量 |

### ✅ 必须生成

| 必须项 | 内容 |
|--------|------|
| 数据库连接信息 | CLI 命令示例 |
| 实体类型清单 | 主数据/事务/关系/配置/审计/缓存 |
| ER 图 | 表名 + 关系（不列字段） |
| 表清单 | 表名 + 用途一句话 |
| 核心关系 | 主表/从表/FK 字段/基数 |
| 数据流图 | 至少 1 条写路径 + 1 条读路径 |

### 实体类型判定规则

| 实体类型 | 判定依据 | 典型特征 |
|----------|----------|----------|
| **主数据** | 长期存在、有唯一标识 | 有主键、无业务时间戳、独立业务含义 |
| **事务** | 记录业务过程事件 | 包含 `created_at`/`updated_at`/状态字段 |
| **关系/明细** | 仅表达关联关系 | 含多主表外键、无独立业务含义 |
| **配置** | 系统级键值设置 | 全局作用域、非业务数据 |
| **审计** | 操作记录/变更历史 | 含 `action`/`operator`/`changed_at` |
| **缓存** | 临时数据、有 TTL | 含 `expired_at`/`ttl` 字段 |

> 注：一个表可能兼具多种特征，按主要业务语义归类，标注 `[推断]` 说明依据。

### 产物格式（database-er.md）

```yaml
---
last_updated: {{DATE}}
database_type: <MySQL/PostgreSQL/SQLite/Oracle/SQLServer/MongoDB>
cli_tool: <mysql/psql/sqlite3/sqlplus/sqlcmd/mongosh>
---

# <项目名> 数据库 ER 图

## 概述

- **数据库类型**: <类型>
- **开发环境**: <SQLite/MySQL 等>
- **生产环境**: <类型>
- **ORM 框架**: <Prisma/Django/Tortoise 等>

## 数据库连接

### CLI 查询

\`\`\`bash
# MySQL / MariaDB
mysql -h $DB_HOST -u $DB_USER -p db_name -e "DESCRIBE table_name;"
mysql -h $DB_HOST -u $DB_USER -p db_name -e "SHOW CREATE TABLE table_name;"

# PostgreSQL
psql -h $DB_HOST -U $DB_USER -d db_name -c "\d table_name"

# SQLite
sqlite3 path/to/db.sqlite3 ".schema table_name"
sqlite3 path/to/db.sqlite3 "PRAGMA table_info(table_name);"

# Oracle
sqlplus -s user/password@host:port/sid <<EOF
DESC table_name;
SELECT * FROM user_constraints WHERE table_name = 'TABLE_NAME';
EOF

# SQL Server
sqlcmd -S $DB_HOST -U $DB_USER -P $DB_PASSWORD -d db_name -Q "EXEC sp_help 'table_name';"

# MongoDB
mongosh --eval "db.getCollection('collection_name').findOne()"
\`\`\`

> 注：连接信息从环境变量或配置文件获取，不在此文档中硬编码

## ER 图

\`\`\`mermaid
erDiagram
    User ||--o{ Order : "places"
    Order ||--|{ OrderItem : "contains"
    Product ||--o{ OrderItem : "ordered in"
    Category ||--o{ Product : "categorizes"
\`\`\`

**图例**：`||--o{` 一对多，`||--||` 一对一

## 核心关系

| 主表 | 从表 | FK 字段 | 基数 | 关系说明 |
|------|------|---------|------|----------|
| User | Order | user_id | 1:N | 一个用户可下多个订单 |
| Order | OrderItem | order_id | 1:N | 一个订单包含多个明细 |
| Product | OrderItem | product_id | 1:N | 一个产品可在多个明细中 |

## 实体类型清单

| 表名 | 实体类型 | 说明 |
|------|----------|------|
| User | 主数据 | 用户长期主档 |
| Order | 事务 | 订单主事务 |
| OrderItem | 关系/明细 | 订单明细关系 |
| Product | 主数据 | 商品主档 |
| SystemConfig | 配置 | 系统配置 |

## 数据流图（数据视角）

\`\`\`mermaid
flowchart TD
  A[写入入口: API/Job] --> B[校验]
  B --> C[写主表]
  C --> D[写关系/明细]
  D --> E[更新状态]

  F[读取入口: API/Report] --> G[按索引查主表]
  G --> H[关联明细]
  H --> I[聚合返回]
\`\`\`

## 表清单

| 表名 | 用途 | 备注 |
|------|------|------|
| User | 用户账户 | 管理员和普通用户 |
| Order | 订单信息 | 订单主表 |
| OrderItem | 订单明细 | 订单包含的商品 |
| Product | 商品信息 | 商品主数据 |
| Category | 商品分类 | 分类目录 |
| SystemConfig | 系统配置 | 全局键值对配置 |

## 索引摘要（可选）

> 仅列出 UNIQUE 约束和关键查询索引，普通索引省略。

| 表名 | 字段 | 类型 | 说明 |
|------|------|------|------|
| User | email | UNIQUE | 邮箱唯一 |
| Order | user_id | INDEX | 用户订单查询 |
| Product | sku | UNIQUE | 商品 SKU 唯一 |

> 💡 详细字段信息请使用上方 CLI 命令查询
```

### 不同数据库类型的产物适配

| 数据库类型 | ER 图 | 表清单 | 备注 |
|-----------|-------|--------|------|
| **MySQL/PostgreSQL/SQLite** | ✅ Mermaid erDiagram | ✅ | 标准模式 |
| **Oracle/SQL Server** | ✅ Mermaid erDiagram | ✅ | 同标准模式 |
| **MongoDB** | ✅ 关系图（引用推断） | ✅ Collection 列表 | 非强外键，关系需标注 `[推断]` |

### MongoDB 产物格式差异

\`\`\`yaml
---
database_type: MongoDB
---

## Collection 清单

| Collection | 用途 | 索引 |
|------------|------|------|
| users | 用户文档 | {email: 1}, {_id: 1} |
| orders | 订单文档 | {user_id: 1}, {created_at: -1} |

## 查询示例

\`\`\`javascript
// 查看 Collection 结构
db.users.findOne()
// 查看索引
db.users.getIndexes()
\`\`\`
\`\`\`

---

## Step 3: 多数据库产物生成

### 产物决策

| 检测结果 | 产物 |
|---------|------|
| 0 个数据库 | 输出提示，跳过文档生成 |
| 1 个数据库 | 生成 `database-er.md` |
| 2+ 个数据库 | 生成 `database-index.md` + `database-{name}.md` |

### 多数据库索引文档格式

**文件**: `docs/first/database-index.md`

```yaml
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

```bash
# {{数据库1名称}}
{{CLI连接命令}}

# {{数据库2名称}}
{{CLI连接命令}}
```

## 数据分布

| 数据库 | 主要表数量 | 主要业务 |
|--------|-----------|---------|
| {{name}} | {{count}} | {{业务描述}} |

## 跨库关系

> 注：如存在跨库关联，在此说明同步方式

| 源库 | 目标库 | 同步方式 | 频率 |
|------|--------|----------|------|
```

### 单数据库文档格式（扩展 frontmatter）

**文件**: `docs/first/database-{name}.md` 或 `database-er.md`

在现有 frontmatter 基础上，多数据库场景新增：

```yaml
---
last_updated: {{DATE}}
database_type: {{TYPE}}
cli_tool: {{CLI_TOOL}}
database_name: {{NAME}}      # 多数据库时必需
is_primary: {{true|false}}    # 多数据库时必需
---
```

### 去重规则

按以下优先级去重（保留优先级最高的来源）：
1. 配置文件 > 环境变量 > ORM 配置 > 框架配置
2. 同一数据库以 `连接标识` 判断：`envVar` 或 `host+port+database`

---

## 质量检查

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

### 质量标准

| 检查项 | 要求 | 失败处理 |
|--------|------|----------|
| **敏感信息** | 无密码/连接串 | 立即失败，清理输出 |
| **表结构详情** | 无逐表字段表格 | 立即失败，移除章节 |
| **ER 图** | 不显示表内字段 | 警告，简化 ER 图 |
| **文件大小** | < 10 KB / < 200 行 | 警告，精简内容 |
| **查询可执行** | CLI 语法正确 | 警告，修正 |

### 证据标注原则

| 内容类型 | 是否需要证据 | 理由 |
|----------|-------------|------|
| 表存在性、主键、外键、索引 | ❌ 不需要 | 读者可通过 CLI 命令自行验证 |
| 业务关系推断、实体类型判定 | ✅ 需要 | 标注 `[推断]` + 来源依据 |

**推断标注格式**：
```markdown
- Order 判定为事务实体 (`models.py` — `包含 order_date, shipped_at 等时间戳字段` — `[推断]`)
```

无法标注来源的推断结论必须标记 `[待确认]`。
