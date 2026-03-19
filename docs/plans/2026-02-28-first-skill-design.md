# First Skill 设计文档

> **日期**: 2026-02-28 | **方案**: 纯 Skill（Prompt-only） | **状态**: 已确认

---

## 核心约束：以代码为准，禁止捏造

- 所有产物内容必须严格基于代码文件、配置文件、依赖声明等实际存在的证据
- 注意不同语言的特性差异，不可用 A 语言的惯例推断 B 语言的行为
- 未在代码中找到明确证据的内容，不得写入文档
- 不确定的内容必须标注 `[待确认]`，不得猜测填充
- 每条文档结论必须可追溯到具体文件路径和代码位置

## 1. 概述

新增 Spec-First 内置 Skill `spec-first:first`（编号 00），用于在任意目标项目中自动生成项目认知文档。

所有产物写入目标项目 `docs/first/` 目录。

## 2. Skill 基本信息

| 属性 | 值 |
|------|-----|
| 文件位置 | `skills/spec-first/00-first/SKILL.md` |
| 名称 | `spec-first:first` |
| 触发命令 | `/spec-first:first` |
| 确认策略 | `assisted` |
| 版本 | 1.1.0 |

### 参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--depth` | `overview` | `overview`（结构概览）/ `deep`（深度分析） |
| `--skip-db` | `false` | 跳过数据库分析 |
| `--db-url` | 无 | 手动指定数据库连接串，跳过自动检测 |

### 产物结构

```
docs/
└── first/
    ├── README.md                # 索引导航（新增）
    ├── tech-stack.md            # 技术栈识别摘要
    ├── external-deps.md         # 外部依赖与第三方服务
    ├── codebase-overview.md     # 代码库概览
    ├── architecture.md          # 架构图（Mermaid）
    ├── api-docs.md              # API 接口文档
    ├── development-guidelines.md # 研发规范（新增，含 Context7 最佳实践）
    ├── local-setup.md           # 本地环境搭建指南
    └── database-er.md           # ER 图 + 字段详情（如有 DB）
```

## 3. 并发执行策略

P0（定位）和 P1（技术栈识别）由主线程串行完成，作为基础上下文。P1 完成后派发 4 个并行子 agent：

| Agent | 产物 | 内部顺序 |
|-------|------|----------|
| A | codebase-overview.md → architecture.md | 串行（架构依赖概览） |
| B | api-docs.md | 独立 |
| C | external-deps.md → development-guidelines.md → local-setup.md | 串行（环境依赖外部服务和规范） |
| D | database-er.md | 独立（--skip-db 时不派发） |

子 agent 之间无依赖，任一失败不阻塞其他。主线程收集全部结果后在 P5 生成 README.md 索引文档。

## 4. 执行流程（P0-P5）

### P0: 定位与校验

- 检测项目根目录（`package.json`、`pom.xml`、`build.gradle`、`go.mod`、`Cargo.toml`、`composer.json`、`Gemfile`、`CMakeLists.txt`、`*.csproj`、`.git`）
- 解析参数（`--depth`、`--skip-db`、`--db-url`）
- **幂等检测**：检查 `docs/first/` 是否已存在产物
  - **首次运行**（目录不存在或为空）：创建目录，进入全量生成流程
  - **增量更新**（产物已存在）：进入更新检查模式
    1. 读取已有产物的生成时间戳（文档头部 `last_updated` 字段）
    2. 对比当前项目状态与已有文档的差异（技术栈变化、新增/删除模块、DB schema 变更）
    3. 输出变更摘要，询问用户确认后再更新
    4. 仅重新生成有变化的文档，未变化的文档保持不动

### P1: 技术栈识别 + Context7 映射收集

**项目名称识别**：
- 从 `package.json` name / `pom.xml` artifactId / `go.mod` module / `Cargo.toml` package.name 等提取
- 备用：使用目录名

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

**多端技术栈检测：**

| 端 | 检测特征 |
|----|----------|
| PC（桌面） | Electron (`electron` in package.json)、Tauri (`tauri.conf.json`)、Qt (`*.pro`/`CMakeLists.txt` + Qt) |
| Android | `AndroidManifest.xml`、`build.gradle` + `com.android`、`settings.gradle` |
| iOS | `*.xcodeproj`、`*.xcworkspace`、`Podfile`、`Package.swift` |
| H5（移动Web） | `vite.config`/`webpack.config` + 移动端UI库（Vant/NutUI/Mint UI） |
| Admin（后台管理） | Ant Design Pro/Element Plus/Arco Design 等后台框架检测 |
| 跨平台 | Flutter (`pubspec.yaml`)、React Native (`react-native` in package.json)、UniApp (`manifest.json` + `uni`)、KMP (`build.gradle.kts` + `kotlin("multiplatform")`) |

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

**Context7 映射收集**（传递给 Agent C）：

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

输出 → `docs/first/tech-stack.md`

### P2: 代码库概览生成

**代码库概览（codebase-overview.md）：**

overview 模式（默认）：
- 目录树（2-3 层深度）
- 模块划分与职责说明
- 入口文件识别
- 构建/运行命令

deep 模式（`--depth=deep`）追加：
- 以上全部 +
- 核心模块的类/函数关系
- API 路由列表（如有）
- 关键业务流程梳理
- 依赖关系图（Mermaid）

**架构图（architecture.md）：**

基于代码分析生成 Mermaid 架构图：
- 系统架构总览（服务间调用关系）
- 模块依赖关系图
- 部署拓扑（如检测到 `Dockerfile`、`docker-compose.yml`、`k8s/`、`helm/`）

**API 接口文档（api-docs.md）：**

按框架自动提取 API 端点：

| 框架 | 提取方式 |
|------|----------|
| Spring Boot | 扫描 `@RequestMapping`/`@GetMapping`/`@PostMapping` 等注解 |
| Express/Koa/Fastify/NestJS | 扫描 `router.get/post/put/delete` 或装饰器 |
| Django/Flask/FastAPI | 扫描 `urlpatterns`/`@app.route`/`@router` |
| Gin | 扫描 `r.GET/POST/PUT/DELETE` |
| Laravel | 扫描 `routes/*.php` |
| Rails | 扫描 `config/routes.rb` |

### P3: 数据库配置检测与连接

如 `--skip-db` 则跳过此阶段。

**检测优先级链：**

```
1. --db-url 参数（最高优先）
2. .env / .env.local 中的 DB 变量
3. ORM 配置（prisma/schema.prisma, ormconfig, knexfile, drizzle.config）
4. Spring Boot（application.yml, application.properties, bootstrap.yml）
5. Nacos（bootstrap.yml 中 nacos 地址 → 拉取 DB 配置）
6. Django settings.py DATABASES
7. Laravel .env / config/database.php
8. Rails config/database.yml
9. ASP.NET appsettings.json ConnectionStrings
```

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

### P4: ER 文档生成

基于 P3 获取的 schema 信息生成 `docs/first/database-er.md`：

**关系型数据库：**
1. **Mermaid erDiagram** — 表关系可视化总览（含外键关系）
2. **逐表详情** — 每张表一个 section：字段名、类型、约束、注释、外键

**NoSQL 适配：**
- **MongoDB**: Collection 结构文档（采样推断字段类型），不生成 ER 图
- **Redis**: Key 模式概览，不生成 ER 图

### P5: 汇总与 README 生成

主线程收集所有子 agent 结果后：

1. **生成 README.md**（索引文档）
2. 输出生成文件清单及路径
3. 提示用户查看 `docs/first/` 目录

## 5. 新增产物详解

### 5.1 development-guidelines.md

**位置**：由 Agent C 生成（external-deps → **development-guidelines** → local-setup）

**内容模块**（6 个）：

| 模块 | 检测方式 | Context7 对比 |
|------|----------|---------------|
| 代码风格 | ESLint/Prettier/Black/gofmt 配置；代码采样 | ✅ |
| 提交规范 | commitlint 配置；git log -50 分析 | ✅ |
| 测试要求 | 测试框架配置；覆盖率阈值 | ✅ |
| 文档规范 | JSDoc/Docstring 配置；注释采样 | ✅ |
| 错误处理 | 日志框架依赖；异常处理模式采样 | ✅ |
| 依赖管理 | 包管理器；lock 文件；版本规则 | ✅ |

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
```

**Adaptive 深度**：
- **Shallow（默认）**：仅读取配置文件
- **Deep（--depth=deep）**：配置 + 代码采样验证，标注"配置 vs 实际"差异

**Context7 查询限制**：
- 最多查询 5 个核心库（按依赖重要性排序）
- 单个查询超时 10 秒
- 总超时 30 秒

**降级策略**：

| 场景 | 处理策略 |
|------|----------|
| Context7 无该库文档 | 标注 `[最佳实践来源待补充]` |
| Context7 API 超时 | 标注 `[最佳实践查询超时，稍后可重试]` |
| 项目无技术栈配置 | 输出骨架文档，标注 `[未检测到技术栈配置]` |

### 5.2 README.md

**位置**：由 P5 主线程生成（最后生成，确保索引完整）

**文档结构**：

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

## 6. 检测规则矩阵（9 种语言）

| 语言 | 代码风格配置 | 提交规范 | 测试框架 | 文档 |
|------|--------------|----------|----------|------|
| **JS/TS** | ESLint/Prettier | commitlint | Vitest/Jest | JSDoc/TypeDoc |
| **Python** | Black/isort/ruff | commitlint/gitlint | pytest/unittest | Docstring/Sphinx |
| **Go** | gofmt/goimports | commitlint | go test | godoc |
| **Java** | Checkstyle/Spotless | commitlint | JUnit/Mockito | Javadoc |
| **PHP** | PHP-CS-Fixer/Pint | commitlint | PHPUnit | PHPDoc |
| **Rust** | rustfmt | commitlint | cargo test | rustdoc |
| **Ruby** | RuboCop | commitlint | RSpec/minitest | YARD |
| **C#** | .editorconfig | commitlint | xUnit/NUnit | XML Doc |
| **C/C++** | .clang-format | commitlint | Google Test | Doxygen |

## 7. 成功标准

### 必须达成

- [ ] `docs/first/` 目录存在
- [ ] 必须生成：`tech-stack.md`、`external-deps.md`、`codebase-overview.md`、`architecture.md`、`api-docs.md`、`development-guidelines.md`、`local-setup.md`、`README.md`（8 个）
- [ ] 如检测到 DB，`database-er.md` 存在且包含 Mermaid 图（关系型）或 Collection 结构（NoSQL）
- [ ] 所有文档为合法 Markdown，头部包含 `last_updated` 字段
- [ ] `development-guidelines.md` 包含至少 1 个规范模块
- [ ] `README.md` 索引文档包含所有已生成产物的链接

### 可选

- [ ] `--depth=deep` 时，`development-guidelines.md` 标注"配置 vs 实际"差异
- [ ] Context7 查询成功时，最佳实践对比完整展示
- [ ] Context7 查询失败时，有清晰的降级提示

## 8. 文件更新清单

| 文件 | 操作 | 变更说明 |
|------|------|----------|
| `skills/spec-first/00-first/SKILL.md` | 修改 | 产物清单 7→9；P1 增加项目名和 Context7 映射收集；Agent C 顺序更新；P5 增加 README 生成 |
| `skills/spec-first/README.md` | 不变 | first skill 描述不变 |
| `CHANGELOG.md` | 修改 | 增加 v0.5.72 条目 |

## 9. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.1.0 | 2026-02-28 | 新增 `development-guidelines.md`（含 Context7 最佳实践）和 `README.md`（索引文档） |
| 1.0.0 | 2026-02-28 | 初始版本，7 个产物 |
