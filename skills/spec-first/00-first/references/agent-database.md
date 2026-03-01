# Agent D — 数据库检测与 ER 生成

> 仅在 `db_mode` 非"跳过"时派发。与 Agent A/B/C 同时并行运行。
> 内部串行：Step 1 配置检测 → Step 2 ER 文档生成。
> 注：为避免与主编排阶段（P0/P1a/P1b/P5）混淆，Agent D 内部使用 Step 命名。

---

## Step 1: 数据库配置检测与连接

**检测优先级链（从高到低）：**

1. `db_url` 用户手动指定（最高优先）
2. `.env` / `.env.local` 中的 DB 变量（`DATABASE_URL`、`DB_HOST` 等）
3. ORM 配置（`prisma/schema.prisma`、`ormconfig`、`knexfile`、`drizzle.config`）
4. Spring Boot（`application.yml`、`application.properties`、`bootstrap.yml`）
5. Nacos（`bootstrap.yml` 中 nacos 地址 → 拉取 DB 配置）
6. Django `settings.py` DATABASES
7. Laravel `.env` / `config/database.php`
8. Rails `config/database.yml`
9. ASP.NET `appsettings.json` ConnectionStrings

**数据库类型 → CLI 映射：**

| 数据库 | CLI 工具 | Schema 查询方式 |
|--------|----------|----------------|
| MySQL/MariaDB | `mysql` | `INFORMATION_SCHEMA` |
| PostgreSQL | `psql` | `information_schema` + `pg_catalog` |
| Oracle | `sqlplus` | `USER_TABLES` + `USER_TAB_COLUMNS` |
| SQLite | `sqlite3` | `.tables` + `.schema` |
| SQL Server | `sqlcmd` | `INFORMATION_SCHEMA` |
| MongoDB | `mongosh` | `db.getCollectionNames()` + 采样推断字段 |
| Redis | `redis-cli` | `KEYS` + `TYPE`（仅结构概览，无 ER） |

**安全约束**：数据库连接信息（host/port/user/password）仅在连接时使用，严禁写入任何输出文档、日志或 agent 输出。

### 凭证防护执行规则（技术性，强制）

1. **最小暴露**：凭证仅保留在当前执行上下文内存，禁止持久化到文件
2. **传递方式**：优先使用环境变量或 stdin，禁止把明文密码拼接进命令行参数
3. **日志脱敏**：日志/报错中出现连接串时必须掩码（仅保留协议、host、db 名，密码替换为 `***`）
4. **输出约束**：`database-er.md` 仅允许输出 schema 结构，禁止输出 host/user/password/token
5. **失败兜底**：连接失败时输出错误类别与重试建议，不回显原始连接串
6. **会话清理**：Step 2 结束后主动清理临时连接变量，避免在后续 agent 泄露

**未检测到 DB 时（两步走）：**
1. 输出提示"未检测到数据库配置"，继续生成其他文档
2. 询问用户是否手动提供连接信息（host/port/user/password/dbname）

---

## Step 2: ER 文档生成

基于 Step 1 获取的 schema 信息生成 `docs/first/database-er.md`：

**关系型数据库：**
1. **Mermaid erDiagram** — 表关系可视化总览（含外键关系）
2. **逐表详情** — 每张表一个 section：字段名、类型、约束、注释、外键

**NoSQL 适配：**
- **MongoDB**: Collection 结构文档（采样推断字段类型），不生成 ER 图
- **Redis**: Key 模式概览，不生成 ER 图

输出 → `docs/first/database-er.md`

---

## 质量保障规则（Agent D）

通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`。  
Agent D 的“必须标注证据内容”与“抽样规模”：见统一规则文档中的 Agent 矩阵。

### Agent D 补充规则（纯 SQL 项目）

**纯 SQL 项目的替代证据格式**（当无可引用的模型文件时）：

```
- <结论> (`<db_type>:<query_type>` — `<查询结果摘要>`)
```

示例：
```markdown
- users 表有 email 字段，类型 varchar(255) (`mysql:DESCRIBE users` — `email varchar(255) NOT NULL`)
- orders 表关联 users 表 (`postgres:SELECT * FROM information_schema.table_constraints` — `CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)`)
```

无法标注来源的结论必须标记 `[待确认]`，不得裸写。
