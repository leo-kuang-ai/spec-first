---
name: "spec-first:first"
description: "快速认知项目：分析技术栈、代码结构、业务流程、API、数据模型等，quick 模式生成 4-5 份核心文档，deep 模式生成 10-11 份完整文档"
version: 2.0.0
last_updated: {{DATE}}
confirm_policy: assisted
changelog: |
  2.0.0: quick/deep 双模式重构 — Layer 0 (quick: tech-stack/codebase-overview/domain-model/api-docs/database-er), Layer 1 (deep追加: call-graph/architecture/external-deps/local-setup/development-guidelines/README), 移除 Q3 交互式选项, frontmatter 标记 mode
  1.11.1: 文档一致性与治理增强 — 统一证据格式描述、修复 A4 波次依赖冲突、统一超时口径、抽取共享 QA 规则、补充 Context7 密钥治理/DB 凭证技术防护、新增测试策略矩阵
  1.11.0: Critical 问题最终修复 — Phase 命名消歧（P3/P4→Step 1/Step 2）、Agent 数量描述精确化、证据格式全量同步到 references 文件
  1.10.0: Low Priority 问题修复 — 产物数量精确化、证据类型分类、Context7 分批查询策略、A1→A2 流式传递说明
  1.9.0: Medium Priority 问题修复 — 增加抽象层级说明、可量化成功标准、验证结果透明化元数据
  1.8.1: Critical + High Priority 问题修复 — 统一超时配置、明确 A3 派发时机、补充 A4 对 B 的依赖、补充 A1/A2/C2/P1b 降级策略
  1.8.0: 新增 Agent A4 — 领域模型分析（domain-model.md），支持核心概念识别、状态机提取、业务规则挖掘、流程图生成
  1.7.0: 质量保障强化 — 核心约束增加强制证据标注格式（file:line + 代码片段）、P5 新增交叉一致性验证（4 项校验 + 证据抽检）、成功标准同步更新
  1.6.1: 审查修复 — README 模板对齐实际产出、条件产物（call-graph/database-er）改为条件渲染、call-graph frontmatter 补全、P3/P4 阶段引用消歧、Serena 工具名修正、description 措辞修正
  1.6.0: 文件拆分解耦 — SKILL.md 瘦身为编排中枢（~180行），agent 规格/检测规则/模板拆入 references/
  1.5.0: 性能优化 — Agent 4→6 拆分、P1 流水线化（P1a/P1b）、overview 默认跳过 call-graph、模块清单中间件、git diff 增量快速路径、Serena MCP 扩展到 A1/A2/B
  1.4.0: 修复 external-deps 归属矛盾、补充 12 种语言/20 种框架/GraphQL+gRPC+tRPC API 范式、增加 Monorepo 检测与超时控制、增加串行断链处理与 DB 凭证安全约束
  1.3.0: 新增依赖调用链分析（call-graph.md），集成 Serena MCP
---

# Skill: first

快速认知一个项目：自动分析目标项目的技术栈、代码结构、业务流程、API、数据模型等。

- **quick 模式**（默认）：生成 4-5 个核心文档，聚焦"快速了解项目 + 承载的业务流程 + 数据模型"
- **deep 模式**（完整分析）：生成 10-11 个文档，包含调用链、架构、外部依赖、环境搭建、研发规范等

所有产物生成到 `docs/first/` 目录，产物 frontmatter 标注 `mode: quick` 或 `mode: deep`。

## 核心约束

- **以代码为准，禁止捏造**：所有产物内容必须严格基于代码文件、配置文件、依赖声明等实际存在的证据
- **注意语言特性**：不同语言/框架有不同惯例，不可用 A 语言的惯例推断 B 语言的行为
- **不确定标注**：未在代码中找到明确证据的内容，标注 `[待确认]`，不得裸写
- **quick 模式豁免**：quick 模式不强制要求证据标注，以提升执行速度
- **deep 模式强制**：deep 模式每条技术结论必须附带证据源，格式如下：

  ```
  - <结论> (`<file_path>:<line>` — `<关键代码片段>` — `[证据类型]`)
  ```

  **证据类型分类**：
  | 类型 | 说明 | 示例 |
  |------|------|------|
  | `[显式]` | 代码/注释/文档明确声明 | 配置文件中的值、注释说明、类型定义 |
  | `[推断]` | 从代码行为分析得出 | 从 if 条件推断业务规则、从方法调用推断依赖 |
  | `[待确认]` | 无法确定或需要用户确认 | 缺少文档的复杂逻辑、隐式约定 |

  示例：
  ```markdown
  - 项目使用 Redis 做会话缓存 (`backend/settings.py:45` — `SESSION_ENGINE = "django.contrib.sessions.backends.cache"` — `[显式]`)
  - 用户状态变更需经过审批 (`services/user.py:76` — `if status != 'active': raise ApprovalRequiredError()` — `[推断]`)
  ```

  **默认规则**：未标注证据类型时，默认为 `[显式]`。

  **违规判定**：deep 模式下无 ``(`<file_path>:<line>` — `<关键代码片段>` — `[证据类型]`)`` 标注且未标记 `[待确认]` 的裸结论，视为不合格产出，交叉验证阶段将驳回并要求补充。

## 触发条件

- 阶段: 任意（通常在接手项目时首次运行）
- Command: `/spec-first:first`

## 交互式选项

技能启动后，通过交互式提问收集用户选项（使用 `AskUserQuestion`）：

**Q1: 分析深度**

| 选项 | 说明 |
|------|------|
| `quick`（默认） | 快速认知：技术栈 + 代码结构 + 业务模型 + API + 数据模型（4-5 个核心文档） |
| `deep` | 深度分析：quick 全部 + 调用链 + 架构 + 外部依赖 + 环境搭建 + 研发规范（10-11 个文档） |

**Q2: 端类型指定（可选，Phase 2）**

| 选项 | 说明 |
|------|------|
| `自动检测`（默认） | 自动识别 backend/frontend/mobile/cross-platform/desktop/monorepo/mixed |
| `手动指定` | 用户显式传入 `--type=<...>`，覆盖自动检测结果 |
| `未知降级` | 无法识别时启用通用模式（3+2 条件产物） |

> 内部变量映射：Q1→`depth`（quick/deep）、Q2→`platform_type`

---

### 智能模式推荐（Phase 3）

**推荐规则**：

| 指标 | 条件 | 推荐模式 |
|------|------|----------|
| 代码量 | < 1000 行 | quick |
| API 端点 | < 10 个 | quick |
| 检测时间 | 首次运行 | quick |
| API 端点 | ≥ 50 个 | 建议使用 deep |
| 数据库 | 有复杂关系 | 建议使用 deep |
| 已有产物 | frontmatter `mode: quick` | 询问是否升级 deep |

**推荐提示格式**：

```
🤖 智能推荐
检测到项目特征：
  - 代码量: ~15000 行
  - API 端点: 60+ 个
  - 数据库: PostgreSQL（15 张表）

推荐：使用 deep 模式获取完整分析

选项：
  1. quick 模式（4-5 个核心文档，<5min）
  2. deep 模式（10-11 个完整文档，包含调用链和架构）
  3. 自动选择

请选择 [1/2/3]:
```

---

### 渐进式升级（Phase 3）

**quick 模式完成后提示**：

```
✅ quick 模式已完成！生成 4 个核心文档：
  1. tech-stack.md
  2. codebase-overview.md
  3. domain-model.md
  4. api-docs.md

💡 扩展建议
检测到项目特征：
  - API 端点: 60+ 个
  - 数据库: PostgreSQL（15 张表）

可追加生成 deep 模式文档：
  - call-graph.md（模块调用链）
  - architecture.md（系统架构）
  - external-deps.md（外部依赖）
  - local-setup.md（环境搭建）
  - development-guidelines.md（研发规范）
  - README.md（索引导航）

选项：
  1. 现在追加生成（约 3-5min）
  2. 稍后手动运行 /spec-first:first --deep
  3. 跳过

请选择 [1/2/3]:
```

---

### 模式选择与交互策略

**默认行为**：首次运行或无参数时，进入交互式模式，让用户了解可选模式并做出选择。

#### 首次运行（无产物）

**交互式提示**：

```
📋 欢迎使用 First Skill 项目快速认知

检测到项目信息：
  项目类型: [检测到的端类型]
  代码规模: [估算行数]
  API 端点: [检测数量]

请选择分析模式：

┌─────────────────────────────────────────────────────────────┐
│ 1. quick 模式（推荐首次使用）                                 │
│    • 生成 4-5 个核心文档（技术栈、代码结构、业务模型、API）  │
│    • 执行时间：<5min                                        │
│    • 适用场景：快速了解项目、接手新代码库                   │
├─────────────────────────────────────────────────────────────┤
│ 2. deep 模式（完整分析）                                    │
│    • 生成 10-11 个文档（quick 全部 + 调用链 + 架构 + 规范）     │
│    • 执行时间：<5min                                        │
│    • 适用场景：正式接手、架构评估、团队协作                   │
└─────────────────────────────────────────────────────────────┘

请选择 [1/2]:
```

**智能推荐提示**（根据项目特征）：

```
💡 智能推荐
检测到项目特征：
  - API 端点: 60+ 个 → 建议使用 deep 模式获取完整分析
  - 数据库: PostgreSQL（15 张表）→ deep 模式包含 ER 图
```

#### 快捷执行（跳过交互）

```bash
# 跳过交互，直接执行 quick 模式
/spec-first:first --quick

# 跳过交互，直接执行 deep 模式
/spec-first:first --deep

# 跳过交互，自动选择模式（根据项目特征）
/spec-first:first --auto
```

#### 非首次运行（已有产物）

```
📋 检测到已有 First Skill 产物

上次运行: {{DATE}} 14:30
当前模式: quick
产物数量: 4 个

可执行操作：
  1. 增量更新（基于代码变更）
  2. 升级到 deep 模式（追加 6-7 个文档）
  3. 全量重新生成
  4. 查看现有产物摘要

请选择 [1/2/3/4]:
```

#### 确认策略说明

| 场景 | 行为 |
|------|------|
| **无参数** | 首次运行：交互式模式；非首次：询问更新策略 |
| `--quick` | 跳过交互，直接执行 quick 模式 |
| `--deep` | 跳过交互，直接执行 deep 模式 |
| `--auto` | 跳过交互，自动选择模式 |
| `--force` | 跳过确认，直接执行 |

## 产物清单

```
docs/
└── first/
    ├── tech-stack.md            # 技术栈摘要 [quick]
    ├── codebase-overview.md     # 代码结构概览 + 开发入口 [quick]
    ├── domain-model.md          # 业务领域模型 [quick]
    ├── api-docs.md              # API 接口文档 [quick]
    ├── database-er.md           # ER 图 + 字段详情 [quick, 如有 DB]
    ├── call-graph.md            # 调用链分析 [deep]
    ├── architecture.md          # 架构图 [deep]
    ├── external-deps.md         # 外部依赖 [deep]
    ├── local-setup.md           # 本地环境搭建 [deep]
    ├── development-guidelines.md # 研发规范 [deep]
    └── README.md                # 索引导航 [deep]
```

**按模式分组**：

| 模式 | 产物数量 | 产物列表 |
|------|----------|----------|
| **quick** | 4-5 个 | tech-stack, codebase-overview, domain-model, api-docs, database-er（如有 DB） |
| **deep** | 10-11 个 | quick 全部 + call-graph, architecture, external-deps, local-setup, development-guidelines, README |

**产物 frontmatter 格式**：
```yaml
---
last_updated: {{DATE}}
mode: quick  # 或 deep
project_type: auto-detected  # 或用户指定
---
```

## 并发执行策略

> **quick/deep 双模式**：quick 模式聚焦核心产物（4-5 个），deep 模式提供完整分析（10-11 个）。

### quick 模式执行流程

```
P0: 定位 + 幂等检测 + Greenfield/Brownfield 判断
    │
P1a: 技术栈识别（主线程，<30s）
    ├─ 语言/框架检测
    ├─ 端类型检测（Phase 2 功能，Phase 1 跳过）
    └─ 包管理器检测
    │ (完成后立即派发第一波 Agent)
    ├─ Agent A:  tech-stack.md（主线程直接生成）
    ├─ Agent B:  codebase-overview.md（简化版，无符号分析）
    ├─ Agent C:  domain-model.md（业务概念与流程）
    ├─ Agent D:  api-docs.md（轻量级，仅端点列表）
    └─ Agent E:  database-er.md（条件派发，检测到 DB 时）
    │
P2: 汇总输出
    ├─ 项目类型、技术栈、业务摘要
    └─ 提示"运行 --deep 获取完整分析"
```

**quick 模式特点**：
- Agent 数量：4-5 个（取决于是否有 DB）
- 跳过：Context7 查询、交叉验证、符号分析（Serena）、架构分析
- 产物：4-5 个核心文档（tech-stack, codebase-overview, domain-model, api-docs, database-er）
- 总时间：<5min

### deep 模式执行流程

```
P0: 定位 + 幂等检测 + 端类型检测（主线程）
    │
    ├─ 检测到已有 quick 产物（frontmatter mode: quick）
    │   └─ 复用端类型检测和技术栈识别中间数据
    │
    └─ 无已有产物 → 执行完整流程
         │
P1a: 技术栈识别（主线程，<30s）
    │ 立即派发第一波 Agent（包含 quick 模式的 4-5 个 Agent）
    ├─ Agent A1: codebase-overview.md + 模块清单 JSON
    ├─ Agent A2: architecture.md（等待 A1 模块清单）
    ├─ Agent A3: call-graph.md
    ├─ Agent B:  api-docs.md
    ├─ Agent C1: external-deps.md
    └─ Agent D:  database-er.md（条件派发）
    │
P1b: Context7 映射收集（与第一波并行）
    │
第二波（P1b + C1 完成后）：
    └─ Agent C2: development-guidelines.md → local-setup.md
    │
第三波（A2 + B + D 完成后）：
    └─ Agent A4: domain-model.md（等待 A2 + B + D）
    │
P3: 汇总 + README 生成 + 交叉验证（主线程）
```

**deep 模式特点**：
- Agent 数量：8 个逻辑 Agent（A1、A2、A3、B、C1、C2、D、A4）
- 包含：Context7 查询、交叉验证、符号分析（Serena）
- 产物：10-11 个完整文档（quick 全部 + call-graph, architecture, external-deps, local-setup, development-guidelines, README）
- 总时间：<5min

### 抽象层级说明

本文档描述的是 **逻辑 Agent 层级**（按产物文档划分）：A1、A2、A3、B、C1、C2、D、A4。

`subagent-architecture.md` 描述的是 **物理 Sub-Agent 层级**（实际并发执行单元），可进一步按前后端/模块拆分（如 A1-1、A1-2、B-1、B-2）。

**对应关系**：
- 逻辑 Agent A1 → 可拆分为 Sub-Agent A1-1（后端）+ A1-2（前端）
- 逻辑 Agent B → 可拆分为 Sub-Agent B-1（后端 API）+ B-2（前端 API）
- 逻辑 Agent C2 → 可拆分为 Sub-Agent C2-1~6（并行分析各规范模块）+ C2-7（汇总）

核心策略：
- 按模块/语言拆分（前后端），而非按步骤
- 中间结果使用轻量 JSON 传递
- **超时配置**：单个子 agent 60s，单阶段总超时 120s，整体并行阶段最大 300s
- 失败时降级到主线程执行

**通用规则**：
- 同波次 agent 之间无依赖，完全并行
- **串行断链处理**：agent 内部某文档生成失败时，跳过后续文档并标注 `[跳过: 前置文档 xxx.md 生成失败]`
- 任一 agent 失败不阻塞其他 agent，P3 汇总时标注失败项
- **超时控制**：单个子 agent 60s，单阶段总超时 120s，整体并行阶段最大 300s；超时视为失败，进入降级汇总

**Agent 规格加载**：各 agent 启动时按需读取对应 references 文件（见参考清单），不加载无关 agent 的规格。

## 执行阶段

### P0: 定位与校验

1. 检测项目根目录（存在以下任一文件即确认）：
   - `package.json`、`pom.xml`、`build.gradle`、`go.mod`、`Cargo.toml`
   - `composer.json`、`Gemfile`、`CMakeLists.txt`、`*.csproj`、`.git`

2. **Greenfield/Brownfield 判断**（Phase 2 增强）：

   **检测指标**：

   | 指标 | Brownfield 条件 | Greenfield 条件 |
   |------|-----------------|------------------|
   | Git 历史 | `.git` 目录存在且有 >10 commits | 无 `.git` 或 commits ≤10 |
   | 依赖安装 | `node_modules/`、`venv/`、`target/` 等存在 | 不存在 |
   | 源码文件 | `src/` 目录存在且代码文件 >50 个 | 无 `src/` 或代码文件 ≤10 |
   | 配置文件 | 有包管理文件且有实际依赖声明 | 无或为空 |
   | 目录状态 | 空目录或仅 README.md | 有其他内容 |

   **判断逻辑**：

   ```yaml
   步骤:
     1. 检查是否有 src/ 目录且有代码文件:
        - 是 → Brownfield
        - 否 → 继续
     2. 检查 .git 目录和 commit 数量:
        - >10 commits → Brownfield
        - 否 → 继续
     3. 检查是否有包管理文件 + 依赖已安装:
        - 是 → Brownfield
        - 否 → 继续
     4. 检查目录状态:
        - 空目录或仅 README.md → Greenfield
        - 其他 → Brownfield（按未知项目处理）
   ```

   **处理策略**：

   | 分类 | 处理方式 |
   |------|----------|
   | **Brownfield** | 继续执行完整分析流程 |
   | **Greenfield** | 提示"检测到空项目或新建项目，建议先创建代码后再运行"并退出 |
   | **未知**（无包管理文件且无代码） | 提示"无法识别项目类型，可用 --type 参数手动指定"

3. 收集用户交互式选项（`depth`、可选 `platform_type`）

4. **激活 Serena 项目**：
   - 使用 `serena:activate_project` 激活目标项目
   - 等待 LSP 语言服务器就绪
   - 验证符号分析能力（`serena:get_current_config`）
   - 激活状态作为共享上下文传递给所有子 agent
   - 如激活失败，设置 `serena_available=false`，所有 agent 降级到静态分析模式

5. **幂等检测**：检查 `docs/first/` 是否已存在产物
   - **首次运行**（目录不存在或为空）：创建 `docs/first/` 目录，进入全量生成流程
   - **增量更新**（产物已存在）：
     1. 读取已有产物 frontmatter 中的 `mode` 和 `last_updated` 字段
     2. **git diff 快速路径**：执行 `git diff --stat HEAD~N -- .` 获取自上次生成以来的变更文件列表
     3. 按变更文件路径匹配受影响的文档（映射规则见下表）
     4. 输出变更摘要（变更文件数 + 受影响文档列表），询问用户确认后再更新
     5. 仅重新生成受影响的文档，未变化的保持不动

   **变更文件 → 受影响文档映射：**

   | 变更文件模式 | 触发重新生成 |
   |-------------|-------------|
   | `package.json`/`pom.xml`/`go.mod` 等依赖声明 | tech-stack.md、external-deps.md |
   | `src/` 下源码文件 | codebase-overview.md、architecture.md、call-graph.md、api-docs.md、domain-model.md |
   | `.eslintrc`/`.prettierrc`/`commitlint` 等配置 | development-guidelines.md |
   | `Dockerfile`/`docker-compose.yml` | architecture.md、local-setup.md |
   | `.env.example`/`Makefile` | local-setup.md |
   | DB migration 文件 / `prisma/schema.prisma` | database-er.md、domain-model.md |
   | `src/api/` / `routes/` / `controllers/` | api-docs.md |

   **非 git 项目降级**：无 `.git` 时回退到全量对比模式（读取每个产物 `last_updated` 逐一比对）

### P1a: 技术栈识别（快速，完成后立即派发 Agent）

**端类型检测**（Phase 2）：

按 `references/detection-rules.md` § 端类型检测规则执行：

| 检测结果 | 处理方式 |
|----------|----------|
| **backend** | 使用后台服务产物集 |
| **frontend** | 使用前端 Web 产物集（区分 Admin/H5） |
| **mobile** | 使用移动端产物集（区分 iOS/Android） |
| **cross-platform** | 使用跨平台产物集 |
| **desktop** | 使用桌面应用产物集 |
| **monorepo** | 按根级 + 子包分别生成产物 |
| **mixed** | 按 backend + frontend 分别生成产物 |
| **unknown** | 触发降级策略（见下方） |

**端类型检测失败处理**：

```
检测结果: unknown
    │
    ├─ 检查是否为空项目（无代码文件）
    │   ├─ 是 → Greenfield 处理（提示并退出）
    │   └─ 否 → 继续降级
    │
    ├─ 使用"通用模式"产物集（3+2 条件产物）
    │   ├─ tech-stack.md
    │   ├─ codebase-overview.md
    │   ├─ domain-model.md
    │   ├─ api-docs.md（如有 API）
    │   └─ database-er.md（如有 DB）
    │
    └─ 用户提示：
        "⚠️ 无法自动识别项目类型，使用通用模式继续"
        "可用 --type=<backend|frontend|mobile|cross-platform|desktop|monorepo|mixed> 手动指定"
```

**输出执行计划**：

在 P1 开始时，先根据 `depth` 模式输出执行计划：

**quick 模式执行计划**：
```
📋 First Skill 执行计划（quick 模式）

项目: [从 package.json/pom.xml/go.mod 等提取项目名称]
语言: [检测到的主要语言]

📦 将生成 [N] 个核心文档:
  1. tech-stack.md            技术栈摘要
  2. codebase-overview.md     代码结构概览
  3. domain-model.md          业务领域模型
  4. api-docs.md              API 文档
  5. database-er.md           数据库 ER（如有 DB）

⚙️ 并发策略: 4-5 个 Agent 派发（单 agent 60s，整体 <5min）

开始生成...
```

**deep 模式执行计划**：
```
📋 First Skill 执行计划（deep 模式）

项目: [从 package.json/pom.xml/go.mod 等提取项目名称]
语言: [检测到的主要语言]

📦 将生成 [N] 个文档:
  1. tech-stack.md            技术栈摘要
  2. codebase-overview.md     代码结构概览
  3. domain-model.md          业务领域模型
  4. api-docs.md              API 文档
  5. database-er.md           数据库 ER（如有 DB）
  6. call-graph.md            调用链分析
  7. architecture.md          架构图
  8. external-deps.md         外部依赖
  9. local-setup.md           本地环境
  10. development-guidelines.md 研发规范
  11. README.md                索引导航

⚙️ 并发策略: 8 个逻辑 Agent 三波派发（A3/D 条件派发，单 agent 60s，整体 300s）

开始生成...
```

注意：
- 如检测到数据库，包含 database-er.md
- 如未检测到 DB，不包含 database-er.md
- 文档数量根据实际情况动态调整

**项目名称识别**：
- 从 `package.json` name / `pom.xml` artifactId / `go.mod` module / `Cargo.toml` package.name 等提取
- 备用：使用目录名

输出 → 传递给后续阶段使用

**检测规则**：语言（12 种）、框架（20 种）、多端技术栈详见 → `references/detection-rules.md`

输出 → `docs/first/tech-stack.md`（头部包含 `last_updated: {{DATE}}` 和 `mode: quick/deep`）

→ **P1a 完成，立即派发 Agent**

### P1b: Context7 映射收集（仅 deep 模式）

quick 模式跳过此步骤。

deep 模式：与第一波 agent 并行执行，完成后派发第二波 agent（C2）。

Context7 映射表详见 → `references/detection-rules.md` § Context7 映射表

### P2: Agent 并行执行

> **注意**：quick 模式与 deep 模式使用独立的 Agent 编号体系，相同字母在不同模式下对应不同产物。

**quick 模式 Agent 派发**（4-5 个）：

| Agent | 产出 | 规格文件 |
|-------|------|----------|
| A | tech-stack.md | 主线程直接生成 |
| B | codebase-overview.md（简化版） | `references/agents-code-analysis.md` |
| C | domain-model.md | `references/agent-domain-model.md` |
| D | api-docs.md（轻量级） | `references/agents-api-deps.md` |
| E | database-er.md（条件派发） | `references/agent-database.md` |

**deep 模式 Agent 派发**（8 个逻辑 Agent，三波）：

| Agent | 产出 | 规格文件 |
|-------|------|----------|
| A1 | codebase-overview.md + 模块清单 JSON | `references/agents-code-analysis.md` |
| A2 | architecture.md（等待 A1） | `references/agents-code-analysis.md` |
| A3 | call-graph.md | `references/agents-code-analysis.md` |
| B | api-docs.md | `references/agents-api-deps.md` |
| C1 | external-deps.md | `references/agents-api-deps.md` |
| C2 | development-guidelines.md → local-setup.md | `references/agent-guidelines-setup.md` |
| D | database-er.md（如有 DB） | `references/agent-database.md` |
| A4 | domain-model.md（等待 A2+B+D） | `references/agent-domain-model.md` |

### P3: 汇总输出

**quick 模式**：收集所有 Agent 结果，输出生成文件清单及路径，标注每个文件的生成状态。

**deep 模式**：
1. 收集所有 Agent 结果
2. 生成 README.md（包含新手必读章节 + 索引导航）
3. 执行交叉一致性验证（4 项校验 + 证据抽检）
4. 输出生成文件清单及路径
5. 输出交叉验证结果摘要

## 确认策略

- 推荐: assisted
- P0 幂等检测发现已有产物时，展示变更摘要后须用户确认再更新
- Agent D 数据库连接前须用户确认（涉及外部服务访问，详见 `references/agent-database.md` § Step 1）

## 成功标准

### quick 模式成功标准

**基础要求**：
- `docs/first/` 目录存在
- 必须生成：`tech-stack.md`、`codebase-overview.md`、`domain-model.md`、`api-docs.md`
- 如检测到 DB，`database-er.md` 存在
- 所有文档为合法 Markdown，头部包含 `last_updated` 和 `mode: quick`

**内容质量要求**：

| 产物 | 最低要求 |
|------|----------|
| `tech-stack.md` | 至少包含：语言、主要框架、构建工具、包管理器 |
| `codebase-overview.md` | 至少包含：目录结构、模块划分（3+ 个模块）、入口文件、开发入口章节 |
| `domain-model.md` | 至少 3 个领域概念、1 个业务规则 |
| `api-docs.md` | 至少 3 个 API 端点（如有 API） |
| `database-er.md` | 包含表结构、关系（如有 DB） |

### deep 模式成功标准

**基础要求**：
- `docs/first/` 目录存在
- quick 模式的全部产物（4-5 个）
- 追加产物：`call-graph.md`、`architecture.md`、`external-deps.md`、`local-setup.md`、`development-guidelines.md`、`README.md`
- 所有文档为合法 Markdown，头部包含 `last_updated` 和 `mode: deep`

**条件产物**：
- 如 `depth=deep`，`call-graph.md` 存在且包含模块依赖矩阵、Mermaid 依赖图
- 如检测到 DB，`database-er.md` 存在且包含 Mermaid 图（关系型）或 Collection 结构（NoSQL）

**内容质量要求**：

| 产物 | 最低要求 |
|------|----------|
| `call-graph.md` | 模块依赖矩阵、关键调用路径 |
| `architecture.md` | 分层架构或模块关系图 |
| `external-deps.md` | 外部服务清单、版本信息 |
| `local-setup.md` | 环境要求、依赖安装、启动命令 |
| `development-guidelines.md` | 至少 1 个规范模块（代码风格/提交规范/测试要求） |
| `README.md` | 包含新手必读章节、所有已生成产物的链接 |

### 质量指标（仅 deep 模式）

| 指标 | 阈值 | 说明 |
|------|------|------|
| **证据标注覆盖率** | ≥ 90% | 技术结论中有证据标注的比例（不含 `[待确认]` 项） |
| **待确认项占比** | ≤ 20% | 标注 `[待确认]` 的结论占所有结论的比例 |
| **交叉验证通过率** | 100% | P3 的 V1-V4 四项校验必须全部通过（或已修正并记录） |
| **证据抽检准确率** | 100% | 随机抽检的证据标注必须指向真实存在的文件/行号 |

### 证据标注格式（仅 deep 模式强制）

所有技术结论必须附带证据源，格式：
```
- <结论> (`<file_path>:<line>` — `<关键代码片段>` — `[证据类型]`)
```

**违规判定**：无证据标注且未标记 `[待确认]` 的裸结论，在 deep 模式下视为不合格产出。

### 测试与验证要求

- 变更后的行为必须满足 `references/testing-strategy.md` 的最小测试矩阵（quick/deep 模式 + Agent + 编排链路）
- 至少覆盖：quick 模式路径、deep 模式路径、降级路径、超时路径、交叉验证路径、凭证脱敏路径
- 无法自动化验证的项必须在产物中标注 `[待确认]` 并给出复现步骤

## 参考清单

| 文件 | 内容 | 消费者 |
|------|------|--------|
| `references/detection-rules.md` | 语言/框架/多端/Context7 检测表 | P1a 主线程、P1b 主线程 |
| `references/subagent-architecture.md` | Subagent-Driven 架构设计 | 主线程编排 |
| `references/quality-assurance-rules.md` | 统一 QA 规则（证据格式、抽样验证、Agent 最低要求） | 全部 Agent |
| `references/agents-code-analysis.md` | A1 + A2 + A3 规格（代码分析链） | Agent A1、A2、A3 |
| `references/agents-api-deps.md` | B + C1 规格（API 与外部依赖） | Agent B、C1 |
| `references/agent-guidelines-setup.md` | C2 规格（研发规范 + 本地环境） | Agent C2 |
| `references/agent-database.md` | D 规格（DB 检测 + ER 生成） | Agent D |
| `references/database-config.md` | 数据库配置指南（多数据库配置、自动检测模式） | Agent D、用户 |
| `references/agent-domain-model.md` | A4 规格（领域模型分析） | Agent A4 |
| `references/testing-strategy.md` | 测试策略与最小用例矩阵（Agent + 编排） | 开发/审查阶段 |
| `references/端类型产物映射.md` | 端类型→产物组合映射配置 | P1a 端类型检测 |
| `references/templates/` | 端类型定制模板（architecture/api-docs） | Agent A2、B |
