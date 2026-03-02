# Subagent-Driven 模式架构文档

> 本文档描述 00-first skill 的 Subagent-Driven 架构实现。
>
> **版本**: v1.11.0 | **最后更新**: 2026-03-01

---

## 一、架构概览

### 执行流程

```
P0 主线程: 定位 + 幂等检测 + Serena 激活
    │
P1a 主线程: 技术栈识别 → tech-stack.md
    │ (立即派发第一波，不等 Context7)
    ├─ Agent A1: codebase-overview.md → 产出模块清单（轻量 JSON）
    │     └─ Agent A2: architecture.md（等待 A1 模块清单后启动）
    ├─ Agent A3: call-graph.md（仅 deep 模式或显式要求时派发）
    ├─ Agent B:  api-docs.md
    ├─ Agent C1: external-deps.md
    └─ Agent D:  数据库检测 → database-er.md（如 db_mode=跳过 则不派发）
    │
P1b 主线程: Context7 映射收集（与第一波 agent 并行）
    └─ Agent C2: development-guidelines.md → local-setup.md（依赖 P1b 结果 + C1 完成）
    │
第三波（A2 + B + D 完成后派发）:
    └─ Agent A4: domain-model.md（等待 A2 + B + D 完成）
    │
P5 主线程: 收集结果 → 生成 README.md → 汇总输出
```

### Agent 清单

| Agent | 产物 | 派发条件 | 依赖 |
|-------|------|----------|------|
| A1 | codebase-overview.md + 模块清单 JSON | 第一波 | P1a |
| A2 | architecture.md | 等待 A1 | P1a + A1 模块清单 |
| A3 | call-graph.md | 第一波（deep 模式或显式要求） | P1a |
| B | api-docs.md | 第一波 | P1a |
| C1 | external-deps.md | 第一波 | P1a |
| C2 | development-guidelines.md → local-setup.md | 第二波 | P1b + C1 |
| D | database-er.md | 第一波（db_mode≠跳过） | P1a |
| A4 | domain-model.md | 第三波 | A2 + D + B |

---

## 二、数据流设计

### P0 主线程产出

```json
{
  "serena_available": true/false,
  "serena_project": "项目路径",
  "project_root": "项目根目录",
  "docs_first_exists": true/false,
  "last_updated": "YYYY-MM-DD"
}
```

### P1a 主线程产出

```json
{
  "tech_stack": {
    "languages": ["Python", "TypeScript"],
    "frameworks": ["FastAPI", "React"],
    "build_tools": ["npm", "pip"],
    "project_name": "项目名称"
  }
}
```

### P1b 主线程产出

```json
{
  "context7_mappings": {
    "eslint": "/eslint/eslint",
    "prettier": "/prettier/prettier",
    "react": "/facebook/react"
  }
}
```

### A1 模块清单中间件（传递给 A2）

```json
{
  "modules": [
    {"name": "auth", "path": "src/auth/", "responsibility": "用户认证与授权"},
    {"name": "api", "path": "src/api/", "responsibility": "REST API 路由层"}
  ]
}
```

### 上下文传递

```
P0 产出
  ├─ serena_available
  └─ serena_project (激活状态)
      ↓
第一波 agent (A1, A3, B, C1, D)
  ├─ 接收: tech_stack
  └─ 接收: serena_available
      ↓
第一波产出
  ├─ A1: module_list (JSON)
  ├─ B: api_docs (JSON)
  ├─ C1: external_deps (JSON)
  └─ D: db_schema (JSON，如有)
      ↓
第二波/第三波 agent
  ├─ A2 接收: tech_stack + module_list
  ├─ A4 接收: module_list + api_docs + db_schema
  └─ C2 接收: context7_mappings + external_deps
```

---

## 三、超时与错误处理

### 超时配置

| 配置项 | 值 |
|--------|-----|
| 单个子 agent 超时 | 60s |
| 单阶段总超时 | 120s |
| 总并行阶段超时 | 300s |
| Context7 单次查询超时 | 10s |
| Context7 总超时 | 30s |

### 错误处理流程

```
sub-agent 执行
  │
  ├─ 成功 → 收集结果，继续
  │
  ├─ 超时 → 标记 [超时]，进入降级汇总
  │
  ├─ 失败 → 标记 [失败]，不影响其他 agent
  │
  └─ 部分成功 → 使用已生成部分，标记 [部分完成]

↓

P5 汇总时标注失败项，输出最终状态
```

### 降级策略

| 场景 | 降级方案 |
|------|----------|
| Serena 激活失败 | 设置 `serena_available=false`，所有 agent 降级到静态分析 |
| Context7 API 超时 | 标注 `[最佳实践查询超时，稍后可重试]` |
| P1b 失败 | C2 降级到纯本地配置分析，跳过最佳实践对比 |
| DB 连接失败 | 不生成 database-er.md，A4 标注 `[无数据库元数据]`，继续生成其他文档 |
| A1 模块清单生成失败 | A2 切换到独立扫描模式，标注 `[独立分析模式]` |
| A1 超时/崩溃 | 输出最小化模块清单（基于目录名），A2 继续执行 |
| B 失败（api-docs） | A4 跳过流程图生成，标注 `[API 文档缺失，流程图跳过]` |
| development-guidelines 失败 | local-setup.md 仍可生成，标注 `[跳过: development-guidelines 生成失败]` |

---

## 四、质量保障

### 证据标注（强制）

所有技术结论必须附带证据源：

```
- <结论> (`<file_path>:<line>` — `<关键代码片段>`)
```

**示例**：
```markdown
- 项目使用 Redis 做会话缓存 (`backend/settings.py:45` — `SESSION_ENGINE = "django.contrib.sessions.backends.cache"`)
- 数据库为 PostgreSQL (`docker-compose.yml:12` — `image: postgres:15`)
```

### Agent 特定证据要求

| Agent | 必须标注证据的内容 |
|-------|-------------------|
| A1 | 模块职责说明、入口文件识别、构建命令来源 |
| A2 | Mermaid 图中每条模块间依赖边（标注 import 来源） |
| A3 | 依赖矩阵中每个调用关系（标注 import/require 语句位置） |
| B | 每个 API 端点的路由定义位置 |
| C1 | 每个外部服务的依赖声明或配置引用位置 |
| C2 | 每条规范的配置文件来源；运行时版本来源、启动命令来源 |
| D | DB 类型识别；表/Collection 结构；外键关系；字段注释 |
| A4 | 概念、关系、状态转换、业务规则的代码位置 |

### 交叉一致性验证（P5 执行）

| 校验项 | 规则 | 比对文档 |
|---|--------|------|
| V1 | 技术栈一致性 | tech-stack.md 列出的技术 ⊇ 其他文档中引用的技术名称 |
| V2 | 模块一致性 | codebase-overview.md 的模块集合 = architecture.md 的模块集合 |
| V3 | 外部服务一致性 | external-deps.md 的服务列表 ⊇ local-setup.md 中要求启动的外部服务 |
| V4 | 数据库一致性 | tech-stack.md 声明的 DB 类型 = database-er.md 实际连接的 DB 类型（如有） |

### 抽样验证

每个 agent 在输出最终文档前，必须执行抽样验证：

1. 从已写结论中随机抽取 **2-3 条**
2. 打开对应源文件，读取实际代码确认结论准确
3. 按结果处理：
   - ✅ 准确 → 保持不变
   - ⚠️ 有偏差 → 修正文档内容和证据标注
   - ❌ 无法验证 → 标记 `[待确认]`

---

## 五、关键实现细节

### Agent A1: 代码库概览

**检测方式**：
- Monorepo 检测：`turbo.json`、`nx.json`、`lerna.json`、`pnpm-workspace.yaml`
- 超大项目：文件数 >10000 时限制目录树深度为 2 层

**Serena 辅助**（如激活成功）：
- `serena:get_symbols_overview()` 获取顶层模块符号
- 降级：仅基于目录结构和文件名推断

**深度模式**（`depth=deep`）追加：
- 核心模块的类/函数关系
- API 路由列表
- 关键业务流程梳理
- 依赖关系图（Mermaid）

### Agent A2: 架构图

**输入**：P1a tech-stack + A1 模块清单 JSON

**输出**：
- 系统架构总览（服务间调用关系）
- 模块依赖关系图
- 部署拓扑（`Dockerfile`、`docker-compose.yml`、`k8s/`）

**Serena 辅助**（如激活成功）：
- `serena:find_referencing_symbols()` 验证模块间调用关系

### Agent A3: 调用链分析

**深度分级**：
- overview 模式：静态 import 扫描
- deep 模式：LSP 符号分析

**降级策略**：
- deep 模式下 Serena 不可用 → 降级为静态 import 扫描

### Agent B: API 文档

**支持范式**：
- RESTful：Spring Boot、Express、Django、FastAPI、Gin、Laravel、Rails、Next.js
- GraphQL：`*.graphql` 文件、`@apollo/server`、`graphql-yoga`
- gRPC：`*.proto` 文件
- tRPC：`@trpc/server`

**Serena 辅助**（如激活成功）：
- `serena:find_symbol()` 按装饰器/注解定位 API handler

### Agent C2: 研发规范与本地环境

**6 个规范模块**：
1. 代码风格（ESLint/Prettier/Black/gofmt）
2. 提交规范（commitlint 配置）
3. 测试要求（测试框架配置、覆盖率阈值）
4. 文档规范（JSDoc/Docstring）
5. 错误处理（日志框架、异常处理模式）
6. 依赖管理（包管理器、版本规则）

### Agent D: 数据库 ER

**支持数据库**：MySQL/MariaDB、PostgreSQL、Oracle、SQLite、MongoDB、Redis

**检测优先级链**：
1. `db_url` 用户手动指定
2. `.env` / ORM 配置
3. Spring Boot `application.yml`
4. Nacos 配置
5. Django `settings.py`
6. Laravel `.env`
7. Rails `config/database.yml`

### Agent A4: 领域模型

**分析内容**：
- 核心概念识别（聚合根/实体/值对象）
- 关系推断（ORM 关系、外键、import 引用）
- 状态机提取（状态字段、转换方法）
- 业务规则挖掘（验证规则、约束规则、业务规则）
- 流程图生成

**4 个子任务并行**：
1. 概念识别与关系推断
2. 状态机提取
3. 业务规则挖掘
4. 领域服务分析

---

## 六、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-02-28 | 初始版本 |
| 1.1.0 | 2026-02-28 | 结合 v1.8.0 实现更新，聚焦代码实现，去除方案对比 |
| 1.2.0 | 2026-03-01 | 简化文档，去除"待实施"内容，保留当前实现 |
| 1.3.0 | 2026-03-01 | High Priority 问题修复 — 补充 A1/A2/B/C2/P1b 降级策略 |
| 1.4.0 | 2026-03-01 | Medium Priority 问题修复 — 对齐 v1.9.0 更新 |
| 1.5.0 | 2026-03-01 | Low Priority 问题修复 — 对齐 v1.10.0 更新 |
| 1.6.0 | 2026-03-01 | Critical 问题最终修复 — Phase 命名消歧、Agent 数量描述精确化 |

---

*文档最后更新: 2026-03-01 | 对应 SKILL 版本: v1.10.0*
