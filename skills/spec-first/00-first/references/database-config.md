# 数据库配置指南

> 版本: 1.0.0 | 日期: 2026-03-03

本文档说明如何通过 `.spec-first/config.yaml` 配置数据库，用于 Spec-First 数据库检测。

---

## 配置位置

配置文件位于项目根目录：

```
your-project/
├── .spec-first/
│   ├── config.yaml          # 项目级配置（可提交）
│   ├── meta/
│   │   └── config.yaml      # 包级基线
│   └── local/
│       └── config.yaml      # 本地覆盖（不提交）
```

---

## 显式配置（推荐）

在 `.spec-first/config.yaml` 中添加 `databases` 配置段：

```yaml
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
```

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

---

## 配置示例

### 单数据库（PostgreSQL + Prisma）

```yaml
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
```

对应的环境变量：

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

### 多数据库（主库 + 分析库）

```yaml
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
```

对应的环境变量：

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
ANALYTICS_DB_URL="mysql://user:password@localhost:3306/analytics"
```

### SQLite 本地开发

```yaml
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
```

对应的环境变量：

```bash
# .env
DB_PATH="prisma/dev.db"
```

### MongoDB

```yaml
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
```

对应的环境变量：

```bash
# .env
MONGO_URI="mongodb://localhost:27017/mydb"
```

---

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

```
检测到 2 个数据库:

1. primary (PostgreSQL) - 主业务库 [已验证 ✓]
2. analytics (MySQL) - 数据分析 [已验证 ✓]

是否将检测结果写入配置文件？
- [Y] 是 - 下次跳过检测，直接使用配置
- [N] 否 - 每次都重新检测
- [S] 跳过 - 仅生成文档
```

---

## 本地配置（不提交）

对于敏感信息（如开发环境密码），使用 `.spec-first/local/config.yaml`：

```yaml
# .spec-first/local/config.yaml (不提交到 git)
databases:
  list:
    - name: primary
      type: postgresql
      connection:
        # 本地开发使用固定连接串
        url_template: "postgresql://dev:dev123@localhost:5432/mydb"
```

`.spec-first/local/` 目录应加入 `.gitignore`：

```
# .gitignore
.spec-first/local/
```
