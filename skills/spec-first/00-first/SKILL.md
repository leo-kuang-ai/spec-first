---
name: "spec-first:first"
description: "快速认知项目：分析技术栈、代码结构、架构、API、规范、调用链等，生成 10 份认知文档"
version: 1.3.0
last_updated: 2026-02-28
confirm_policy: assisted
changelog: 新增依赖调用链分析（call-graph.md），集成 Serena MCP
---

# Skill: first

快速认知一个项目：自动分析目标项目的技术栈、代码结构、架构、API、外部依赖、本地环境、研发规范和数据库，生成结构化文档到 `docs/first/`。

## 核心约束

- **以代码为准，禁止捏造**：所有产物内容必须严格基于代码文件、配置文件、依赖声明等实际存在的证据
- **注意语言特性**：不同语言/框架有不同惯例，不可用 A 语言的惯例推断 B 语言的行为
- **不确定标注**：未在代码中找到明确证据的内容，标注 `[待确认]`，不得猜测填充
- **可追溯**：每条结论必须可追溯到具体文件路径

## 触发条件

- 阶段: 任意（通常在接手项目时首次运行）
- Command: `/spec-first:first`

## 参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--depth` | `overview` | `overview`（结构概览）/ `deep`（深度分析） |
| `--skip-db` | `false` | 跳过数据库分析 |
| `--db-url` | 无 | 手动指定数据库连接串，跳过自动检测 |
| `--skip-call-graph` | `false` | 跳过调用链分析 |

## 产物清单

```
docs/
└── first/
    ├── README.md                # 索引导航
    ├── tech-stack.md            # 技术栈识别摘要
    ├── external-deps.md         # 外部依赖与第三方服务
    ├── codebase-overview.md     # 代码库概览
    ├── architecture.md          # 架构图（Mermaid）
    ├── call-graph.md            # 依赖调用链分析
    ├── api-docs.md              # API 接口文档
    ├── development-guidelines.md # 研发规范（代码风格、提交规范、测试要求等）
    ├── local-setup.md           # 本地环境搭建指南
    └── database-er.md           # ER 图 + 字段详情（如有 DB）
```

## 并发执行策略

P0（定位）和 P1（技术栈识别）由主线程串行完成，作为后续所有文档生成的基础上下文。

P1 完成后，主线程将 tech-stack 识别结果作为共享上下文，派发 4 个并行子 agent：

```
P0 主线程: 定位 + 幂等检测
    │
P1 主线程: 技术栈识别 → tech-stack.md（基础上下文 + Context7 映射 + 项目名）
    │
    ├─ Agent A: codebase-overview.md → architecture.md → call-graph.md（串行，架构和调用链依赖概览）
    ├─ Agent B: api-docs.md
    ├─ Agent C: external-deps.md → development-guidelines.md → local-setup.md（串行，环境依赖外部服务和研发规范）
    └─ Agent D: 数据库检测 → database-er.md（如 --skip-db 则不派发）
    │
P5 主线程: 收集结果 → 生成 README.md → 汇总输出
```

**子 agent 规则：**
- 每个子 agent 接收 P1 的 tech-stack 识别结果作为输入上下文
- 子 agent 之间无依赖，完全并行
- Agent A 内部 architecture.md 和 call-graph.md 依赖 codebase-overview.md，须串行
- Agent C 内部 local-setup.md 依赖 external-deps.md，须串行
- 主线程等待所有子 agent 完成后进入 P5
- 任一子 agent 失败不阻塞其他 agent，主线程在 P5 汇总时标注失败项

## 执行阶段

### P0: 定位与校验

1. 检测项目根目录（存在以下任一文件即确认）：
   - `package.json`、`pom.xml`、`build.gradle`、`go.mod`、`Cargo.toml`
   - `composer.json`、`Gemfile`、`CMakeLists.txt`、`*.csproj`、`.git`
2. 解析参数（`--depth`、`--skip-db`、`--db-url`、`--skip-call-graph`）
3. **激活 Serena 项目**：
   - 使用 `serena:activate_project` 激活目标项目
   - 等待 LSP 语言服务器就绪
   - 验证符号分析能力（`serena:get_current_config`）
   - 如激活失败，降级到静态分析模式
4. **幂等检测**：检查 `docs/first/` 是否已存在产物
   - **首次运行**（目录不存在或为空）：创建 `docs/first/` 目录，进入全量生成流程
   - **增量更新**（产物已存在）：
     1. 读取已有产物头部 `last_updated` 字段
     2. 对比当前项目状态与已有文档的差异（技术栈变化、新增/删除模块、DB schema 变更）
     3. 输出变更摘要，询问用户确认后再更新
     4. 仅重新生成有变化的文档，未变化的保持不动

### P1: 技术栈识别 + 外部依赖扫描

**输出执行计划**：

在 P1 开始时，先输出执行计划：

```
📋 First Skill 执行计划

项目: [从 package.json/pom.xml/go.mod 等提取项目名称]
语言: [检测到的主要语言]

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

⚙️ 并发策略: 4 个子 agent 并发分析
⏱️ 预估时间: ~30 秒

开始生成...
```

注意：
- 如检测到数据库，包含 database-er.md
- 如 --skip-db 或未检测到 DB，不包含 database-er.md
- 文档数量根据实际情况动态调整

**项目名称识别**：
- 从 `package.json` name / `pom.xml` artifactId / `go.mod` module / `Cargo.toml` package.name 等提取
- 备用：使用目录名

输出 → 传递给 P5 用于 README.md 生成

**9 种语言检测：**

| 语言 | 检测文件 |
|------|----------|
| Java | `pom.xml`、`build.gradle`、`build.gradle.kts` |
| Python | `requirements.txt`、`pyproject.toml`、`setup.py`、`Pipfile` |
| Go | `go.mod`、`go.sum` |
| PHP | `composer.json`、`artisan` |
| JavaScript/Node.js | `package.json`、`tsconfig.json`、`yarn.lock`、`pnpm-lock.yaml` |
| C/C++ | `CMakeLists.txt`、`Makefile`、`*.vcxproj`、`conanfile.txt` |
| .NET/C# | `*.csproj`、`*.sln`、`appsettings.json` |
| Ruby | `Gemfile`、`Rakefile`、`*.gemspec` |
| Rust | `Cargo.toml` |

**14 种框架检测：**

| 框架 | 识别特征 |
|------|----------|
| Spring Boot | `spring-boot-starter` in pom/gradle |
| Django | `django` in requirements/pyproject |
| Flask | `flask` in requirements/pyproject |
| FastAPI | `fastapi` in requirements/pyproject |
| Express | `express` in package.json |
| Koa | `koa` in package.json |
| Gin | `github.com/gin-gonic/gin` in go.mod |
| Laravel | `laravel/framework` in composer.json |
| Rails | `rails` in Gemfile |
| ASP.NET Core | `Microsoft.AspNetCore` in csproj |
| Rust Web | `actix-web`/`axum`/`rocket` in Cargo.toml |
| NestJS | `@nestjs/core` in package.json |
| Fastify | `fastify` in package.json |
| MyBatis | `mybatis` in pom/gradle |

**多端技术栈检测：**

| 端 | 检测特征 |
|----|----------|
| PC（桌面） | Electron (`electron` in package.json)、Tauri (`tauri.conf.json`)、Qt (`*.pro` / CMakeLists + Qt) |
| Android | `AndroidManifest.xml`、`build.gradle` + `com.android` |
| iOS | `*.xcodeproj`、`*.xcworkspace`、`Podfile`、`Package.swift` |
| H5（移动Web） | Vant/NutUI/Mint UI 等移动端 UI 库 |
| Admin（后台） | Ant Design Pro / Element Plus / Arco Design 等后台框架 |
| 跨平台 | Flutter (`pubspec.yaml`)、React Native (`react-native`)、UniApp (`manifest.json` + `uni`)、KMP (`kotlin("multiplatform")` in build.gradle.kts) |

输出 → `docs/first/tech-stack.md`（头部包含 `last_updated: YYYY-MM-DD`）

**外部依赖扫描：**

扫描代码和配置中的第三方服务与中间件引用：

| 类别 | 检测方式 |
|------|----------|
| 消息队列 | RabbitMQ/Kafka/RocketMQ 依赖或配置 |
| 缓存 | Redis/Memcached 连接配置 |
| 对象存储 | OSS/S3/MinIO SDK 引用 |
| 支付 | 支付宝/微信支付/Stripe SDK |
| 短信/邮件 | 短信网关、SMTP 配置 |
| 搜索引擎 | Elasticsearch/Solr 配置 |
| 注册中心/配置中心 | Nacos/Consul/Eureka/Apollo 配置 |
| 监控 | Prometheus/Grafana/Sentry SDK |

输出 → `docs/first/external-deps.md`（头部包含 `last_updated: YYYY-MM-DD`）

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

注意：最多查询 5 个核心库（按依赖重要性排序），单个超时 10 秒，总超时 30 秒。

### P2: 代码库分析

**代码库概览（codebase-overview.md）：**

overview 模式（默认）：
- 目录树（2-3 层深度）
- 模块划分与职责说明
- 入口文件识别
- 构建/运行命令

deep 模式（`--depth=deep`）追加：
- 核心模块的类/函数关系
- API 路由列表（如有）
- 关键业务流程梳理
- 依赖关系图（Mermaid）

输出 → `docs/first/codebase-overview.md`

**架构图（architecture.md）：**

基于代码分析生成 Mermaid 架构图：
- 系统架构总览（服务间调用关系）
- 模块依赖关系图
- 部署拓扑（如检测到 `Dockerfile`、`docker-compose.yml`、`k8s/`、`helm/`）

输出 → `docs/first/architecture.md`

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

**API 接口文档（api-docs.md）：**

按框架自动提取 API 端点：

| 框架 | 提取方式 |
|------|----------|
| Spring Boot | `@RequestMapping`/`@GetMapping`/`@PostMapping` 等注解 |
| Express/Koa/Fastify/NestJS | `router.get/post/put/delete` 或装饰器 |
| Django/Flask/FastAPI | `urlpatterns`/`@app.route`/`@router` |
| Gin | `r.GET/POST/PUT/DELETE` |
| Laravel | `routes/*.php` |
| Rails | `config/routes.rb` |

输出格式：按模块分组，每个端点列出 Method、Path、描述（如有注释）

输出 → `docs/first/api-docs.md`

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

**文档结构示例**：

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

**本地环境搭建指南（local-setup.md）：**

自动梳理项目运行所需环境信息：
- 语言/运行时版本（从 `.nvmrc`、`.python-version`、`go.mod`、`pom.xml` 等提取）
- 依赖安装命令（`npm install`、`mvn install`、`pip install` 等）
- 环境变量清单（从 `.env.example`/`.env.template` 提取，**脱敏处理，不输出实际值**）
- 所需外部服务（从 `docker-compose.yml` 或 external-deps 推断）
- 启动命令（从 `package.json scripts`、`Makefile`、`Procfile` 等提取）

输出 → `docs/first/local-setup.md`

### P3: 数据库配置检测与连接

如 `--skip-db` 则跳过 P3 和 P4。

**检测优先级链（从高到低）：**

1. `--db-url` 参数（最高优先）
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

**未检测到 DB 时（两步走）：**
1. 输出提示"未检测到数据库配置"，继续生成其他文档
2. 询问用户是否手动提供连接信息（host/port/user/password/dbname）

### P4: ER 文档生成

基于 P3 获取的 schema 信息生成 `docs/first/database-er.md`：

**关系型数据库：**
1. **Mermaid erDiagram** — 表关系可视化总览（含外键关系）
2. **逐表详情** — 每张表一个 section：字段名、类型、约束、注释、外键

**NoSQL 适配：**
- **MongoDB**: Collection 结构文档（采样推断字段类型），不生成 ER 图
- **Redis**: Key 模式概览，不生成 ER 图

输出 → `docs/first/database-er.md`

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
- [调用链分析](./call-graph.md) — 模块依赖与调用路径
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
3. 标注每个文件的生成状态（新建 / 已更新 / 未变化 / 跳过）
4. 提示用户查看 `docs/first/` 目录

## 确认策略

- 推荐: assisted
- P0 幂等检测发现已有产物时，展示变更摘要后须用户确认再更新
- P3 数据库连接前须用户确认（涉及外部服务访问）

## 成功标准

- `docs/first/` 目录存在
- 必须生成：`tech-stack.md`、`external-deps.md`、`codebase-overview.md`、`architecture.md`、`call-graph.md`、`api-docs.md`、`development-guidelines.md`、`local-setup.md`、`README.md`
- 如检测到 DB，`database-er.md` 存在且包含 Mermaid 图（关系型）或 Collection 结构（NoSQL）
- `development-guidelines.md` 包含至少 1 个规范模块（代码风格/提交规范/测试要求/文档规范/错误处理/依赖管理）
- `README.md` 索引文档包含所有已生成产物的链接
- `call-graph.md` 包含模块依赖矩阵和 Mermaid 依赖图
- `call-graph.md` 标注分析模式（LSP/静态）
- 所有文档为合法 Markdown，头部包含 `last_updated` 字段
- 所有内容严格基于代码证据，无捏造内容，不确定项标注 `[待确认]`
