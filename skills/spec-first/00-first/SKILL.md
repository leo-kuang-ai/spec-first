---
name: "spec-first:first"
description: "快速认知项目：分析技术栈、代码结构、架构、API、规范、调用链等，生成 9-11 份认知文档（根据条件产物动态调整）"
version: 1.11.1
last_updated: 2026-02-28
confirm_policy: assisted
changelog: |
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

快速认知一个项目：自动分析目标项目的技术栈、代码结构、架构、API、外部依赖、本地环境、研发规范和数据库，生成结构化文档到 `docs/first/`。

## 核心约束

- **以代码为准，禁止捏造**：所有产物内容必须严格基于代码文件、配置文件、依赖声明等实际存在的证据
- **注意语言特性**：不同语言/框架有不同惯例，不可用 A 语言的惯例推断 B 语言的行为
- **不确定标注**：未在代码中找到明确证据的内容，标注 `[待确认]`，不得裸写
- **可追溯（强制证据标注）**：每条技术结论必须附带证据源，格式如下：

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

  **违规判定**：无 ``(`<file_path>:<line>` — `<关键代码片段>` — `[证据类型]`)`` 标注且未标记 `[待确认]` 的裸结论，视为不合格产出，P5 交叉验证阶段将驳回并要求补充。

## 触发条件

- 阶段: 任意（通常在接手项目时首次运行）
- Command: `/spec-first:first`

## 交互式选项

技能启动后，通过交互式提问收集用户选项（使用 `AskUserQuestion`）：

**Q1: 分析深度**

| 选项 | 说明 |
|------|------|
| `overview`（默认） | 结构概览：目录树、模块划分、入口识别 |
| `deep` | 深度分析：追加类/函数关系、业务流程、调用链、代码采样验证 |

**Q2: 数据库分析**

| 选项 | 说明 |
|------|------|
| `自动检测`（默认） | 从 .env / ORM 配置 / 框架配置自动发现 DB 连接 |
| `手动指定` | 用户输入连接串（触发文本输入） |
| `跳过` | 不分析数据库，不生成 database-er.md |

**Q3: 调用链分析**（仅 overview 模式展示，deep 模式自动包含）

| 选项 | 说明 |
|------|------|
| `跳过`（默认） | overview 模式不生成 call-graph.md |
| `生成` | 生成轻量版调用链（静态 import 扫描） |

> 内部变量映射：Q1→`depth`、Q2→`db_mode`/`db_url`、Q3→`include_call_graph`

## 产物清单

```
docs/
└── first/
    ├── README.md                # 索引导航
    ├── tech-stack.md            # 技术栈识别摘要
    ├── external-deps.md         # 外部依赖与第三方服务
    ├── codebase-overview.md     # 代码库概览
    ├── architecture.md          # 架构图（Mermaid）
    ├── call-graph.md            # 依赖调用链分析（deep 模式自动生成，overview 模式可选）
    ├── api-docs.md              # API 接口文档
    ├── domain-model.md          # 领域模型（核心概念、状态机、业务规则）
    ├── development-guidelines.md # 研发规范（代码风格、提交规范、测试要求等）
    ├── local-setup.md           # 本地环境搭建指南
    └── database-er.md           # ER 图 + 字段详情（如有 DB）
```

## 并发执行策略

P0（定位）由主线程完成。P1 拆分为两个子阶段流水线执行：

- **P1a**（tech-stack 识别）：快速完成后立即派发第一波 agent（不等 Context7）
- **P1b**（Context7 映射收集）：与第一波 agent 并行执行，完成后派发第二波 agent

**Subagent-Driven 架构**：详见 `references/subagent-architecture.md`

### 抽象层级说明

本文档描述的是 **逻辑 Agent 层级**（按产物文档划分）：A1、A2、A3、B、C1、C2、D、A4。

`subagent-architecture.md` 描述的是 **物理 Sub-Agent 层级**（实际并发执行单元），可进一步按前后端/模块拆分（如 A1-1、A1-2、B-1、B-2）。

**对应关系**：
- 逻辑 Agent A1 → 可拆分为 Sub-Agent A1-1（后端）+ A1-2（前端）
- 逻辑 Agent B → 可拆分为 Sub-Agent B-1（后端 API）+ B-2（前端 API）
- 逻辑 Agent C2 → 可拆分为 Sub-Agent C2-1~6（并行分析各规范模块）+ C2-7（汇总）

本文档的派发规则适用于逻辑 Agent 层级，实际实现时可按物理 Sub-Agent 层级进一步并行优化。

核心策略：
- 按模块/语言拆分（前后端），而非按步骤
- 中间结果使用轻量 JSON 传递
- **超时配置**：单个子 agent 60s，单阶段总超时 120s，整体并行阶段最大 300s
- 失败时降级到主线程执行

**8 个逻辑 Agent**（A1、A2、A3、B、C1、C2、D、A4），按三波派发：
- 其中 A3 仅在 `depth=deep` 或 `include_call_graph=true` 时派发
- 其中 D 仅在 `db_mode` 非"跳过"时派发

```
P0 主线程: 定位 + 幂等检测
    │
P1a 主线程: 技术栈识别 → tech-stack.md（基础上下文 + 项目名）
    │ (立即派发第一波，不等 Context7)
    ├─ Agent A1: codebase-overview.md → 产出模块清单（轻量 JSON）
    │     └─ Agent A2: architecture.md（等待 A1 模块清单后启动）
    ├─ Agent A3: call-graph.md（仅 deep 模式或显式要求时派发，第一波派发）
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

**子 agent 规则：**

**第一波（P1a 完成后立即派发）：**
- Agent A1、A3、B、C1、D 接收 P1a 的 tech-stack 结果作为输入上下文
- A1 完成后产出**模块清单**（轻量 JSON：模块名+路径+职责），触发 A2 启动
- A3 派发规则：`depth=deep` 时自动派发；`depth=overview` 且 `include_call_graph=true` 时派发（静态扫描模式）
- D 仅在 `db_mode` 非"跳过"时派发

**第二波（P1b 完成后派发）：**
- Agent C2 接收 P1b 的 Context7 映射结果 + 等待 C1 完成（需要外部服务清单生成 local-setup）
- C2 内部串行：development-guidelines.md → local-setup.md

**第三波（A2 + B + D 完成后派发）：**
- Agent A4 等待 A2（架构关系）、B（API 文档）和 D（数据库结构，如有）完成后派发
- A4 接收 A2 的模块依赖 + B 的 API 文档 + D 的表结构（如有）作为输入

**通用规则：**
- 同波次 agent 之间无依赖，完全并行
- **串行断链处理**：agent 内部某文档生成失败时，跳过后续文档并标注 `[跳过: 前置文档 xxx.md 生成失败]`
- 任一 agent 失败不阻塞其他 agent，P5 汇总时标注失败项
- **超时控制**：单个子 agent 60s，单阶段总超时 120s，整体并行阶段最大 300s；超时视为失败，进入降级汇总

**Agent 规格加载**：各 agent 启动时按需读取对应 references 文件（见参考清单），不加载无关 agent 的规格。

## 执行阶段

### P0: 定位与校验

1. 检测项目根目录（存在以下任一文件即确认）：
   - `package.json`、`pom.xml`、`build.gradle`、`go.mod`、`Cargo.toml`
   - `composer.json`、`Gemfile`、`CMakeLists.txt`、`*.csproj`、`.git`
2. 收集用户交互式选项（`depth`、`db_mode`/`db_url`、`include_call_graph`）
3. **激活 Serena 项目**：
   - 使用 `serena:activate_project` 激活目标项目
   - 等待 LSP 语言服务器就绪
   - 验证符号分析能力（`serena:get_current_config`）
   - 激活状态作为共享上下文传递给所有子 agent（A1/A2/A3/B 均可使用 Serena）
   - 如激活失败，设置 `serena_available=false`，所有 agent 降级到静态分析模式
4. **幂等检测**：检查 `docs/first/` 是否已存在产物
   - **首次运行**（目录不存在或为空）：创建 `docs/first/` 目录，进入全量生成流程
   - **增量更新**（产物已存在）：
     1. 读取已有产物头部 `last_updated` 字段
     2. **git diff 快速路径**：执行 `git diff --stat HEAD~N -- .` 获取自上次生成以来的变更文件列表
     3. 按变更文件路径匹配受影响的文档（映射规则见下表）
     4. 输出变更摘要（变更文件数 + 受影响文档列表），询问用户确认后再更新
     5. 仅重新生成受影响的文档，未变化的保持不动

   **变更文件 → 受影响文档映射：**

   | 变更文件模式 | 触发重新生成 |
   |-------------|-------------|
   | `package.json`/`pom.xml`/`go.mod` 等依赖声明 | tech-stack.md、external-deps.md |
   | `src/` 下源码文件 | codebase-overview.md、architecture.md、call-graph.md、api-docs.md |
   | `.eslintrc`/`.prettierrc`/`commitlint` 等配置 | development-guidelines.md |
   | `Dockerfile`/`docker-compose.yml`/`k8s/` | architecture.md、local-setup.md |
   | `.env.example`/`Makefile`/`Procfile` | local-setup.md |
   | DB migration 文件 / `prisma/schema.prisma` | database-er.md |

   **非 git 项目降级**：无 `.git` 时回退到全量对比模式（读取每个产物 `last_updated` 逐一比对）

### P1a: 技术栈识别（快速，完成后立即派发第一波 agent）

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

⚙️ 并发策略: 8 个逻辑 Agent 三波派发（A3/D 条件派发，单 agent 60s，整体 300s）

开始生成...
```

注意：
- 如检测到数据库，包含 database-er.md
- 如 db_mode=跳过 或未检测到 DB，不包含 database-er.md
- overview 模式默认不包含 call-graph.md（除非 `include_call_graph=true`）
- deep 模式自动包含 call-graph.md
- 文档数量根据实际情况动态调整

**项目名称识别**：
- 从 `package.json` name / `pom.xml` artifactId / `go.mod` module / `Cargo.toml` package.name 等提取
- 备用：使用目录名

输出 → 传递给 P5 用于 README.md 生成

**检测规则**：语言（12 种）、框架（20 种）、多端技术栈详见 → `references/detection-rules.md`

输出 → `docs/first/tech-stack.md`（头部包含 `last_updated: YYYY-MM-DD`）

→ **P1a 完成，立即派发第一波 agent（A1、A3、B、C1、D）**

### P1b: Context7 映射收集（与第一波 agent 并行执行）

Context7 映射表详见 → `references/detection-rules.md` § Context7 映射表

→ **P1b 完成，派发第二波 agent（C2），C2 同时等待 C1 完成**

### P2: Agent 并行执行

各 agent 按对应 references 文件中的规格执行：

| Agent | 产出 | 规格文件 |
|-------|------|----------|
| A1 | codebase-overview.md + 模块清单 JSON | `references/agents-code-analysis.md` |
| A2 | architecture.md（等待 A1） | `references/agents-code-analysis.md` |
| A3 | call-graph.md（仅 deep 模式） | `references/agents-code-analysis.md` |
| B | api-docs.md | `references/agents-api-deps.md` |
| C1 | external-deps.md | `references/agents-api-deps.md` |
| C2 | development-guidelines.md → local-setup.md | `references/agent-guidelines-setup.md` |
| D | database-er.md（如有 DB） | `references/agent-database.md` |

### P5: 汇总与 README 索引生成

主线程收集所有子 agent 结果后：

1. **生成 README.md**（索引导航文档）

基于 P1 收集的项目名和各 agent 生成状态，创建 `docs/first/README.md`：

```markdown
---
last_updated: [YYYY-MM-DD]
# 质量验证元数据
validation:
  evidence_coverage: 0.XX  # 证据标注覆盖率（目标 ≥ 0.90）
  pending_confirmation: N   # 待确认项数量
  cross_validation: ["V1:pass", "V2:pass/fixed", "V3:pass", "V4:pass/skipped"]
  sample_validation: "N/N"  # 抽样验证通过率（如 "3/3"）
generation_time: "[YYYY-MM-DD HH:MM]"
skill_version: "v[X.X.X]"
---

# [项目名称] 项目认知文档

> 本目录由 `spec-first:first` skill 自动生成，提供项目的快速认知材料。

## 文档索引

### 🚀 快速开始

| 文档 | 说明 | 预计阅读时间 |
|------|------|-------------|
| [技术栈摘要](./tech-stack.md) | 项目技术栈、构建工具、测试框架 | 3 分钟 |
| [本地环境搭建](./local-setup.md) | 运行时、依赖安装、环境变量 | 5 分钟 |

### 📖 项目理解

| 文档 | 说明 | 预计阅读时间 |
|------|------|-------------|
| [代码结构概览](./codebase-overview.md) | 目录结构、模块职责、数据流向 | 10 分钟 |
| [系统架构](./architecture.md) | 分层架构、依赖关系 | 8 分钟 |

<!-- 如生成了 call-graph.md，追加以下行：
| [调用链分析](./call-graph.md) | 模块依赖矩阵、调用路径 | 15 分钟 |
-->

### 📋 开发指南

| 文档 | 说明 | 预计阅读时间 |
|------|------|-------------|
| [研发规范](./development-guidelines.md) | 代码风格、提交规范、测试要求 | 5 分钟 |
| [API 文档](./api-docs.md) | 接口端点列表 | 5 分钟 |
| [外部依赖](./external-deps.md) | 第三方服务与中间件引用 | 2 分钟 |

<!-- 如检测到 DB，追加以下分节：
### 🗄️ 数据库

| 文档 | 说明 | 预计阅读时间 |
|------|------|-------------|
| [数据库 ER](./database-er.md) | 表结构与关系 | 10 分钟 |
-->

## 推荐阅读顺序

### 新成员入门

1. **技术栈摘要** → 了解项目技术栈
2. **本地环境搭建** → 搭建开发环境
3. **代码结构概览** → 理解项目结构
4. **系统架构** → 掌握核心设计
5. **研发规范** → 遵循团队规范

### 深入理解

<!-- 如生成了 call-graph.md：1. **调用链分析** → 理解模块交互 -->
1. **API 文档** → 熟悉接口
2. **外部依赖** → 了解服务边界

## 关键概念速查

<!-- 此节由 agent 根据项目特征动态生成，可包含：核心领域概念、状态机、ID 类型等 -->

---

*生成时间: [YYYY-MM-DD] | 命令: `/spec-first:first` | 版本: v[SKILL版本]*
```

2. **交叉一致性验证**（在生成 README 后、输出清单前执行）

   主线程读取所有已生成文档，执行以下 4 项校验：

   | # | 校验项 | 规则 | 比对文档 |
   |---|--------|------|----------|
   | V1 | 技术栈一致性 | tech-stack.md 列出的技术 ⊇ 其他文档中引用的技术名称 | tech-stack ↔ 全部 |
   | V2 | 模块一致性 | codebase-overview.md 的模块集合 = architecture.md 的模块集合 | A1 ↔ A2 |
   | V3 | 外部服务一致性 | external-deps.md 的服务列表 ⊇ local-setup.md 中要求启动的外部服务 | C1 ↔ C2 |
   | V4 | 数据库一致性 | tech-stack.md 声明的 DB 类型 = database-er.md 实际连接的 DB 类型（如有） | tech-stack ↔ D |

   **文档缺失时的跳过规则**：如某项校验所需文档未生成（agent 失败或跳过），该校验项自动标记为 `[跳过: 依赖文档缺失]`，不影响其他校验项执行。

   **发现不一致时的处理流程**：
   1. 回溯代码源文件，确认哪个 agent 的结论正确
   2. 修正错误文档中的对应内容
   3. 在 README.md 底部 `---` 分隔线前追加修正记录：
      ```
      ## ⚠️ 交叉验证修正记录
      - [V2] architecture.md 模块列表与 codebase-overview.md 不一致，以代码实际目录结构为准，已修正 architecture.md
      ```
   4. 无不一致时不生成此节

   **证据标注抽检**：随机抽取各文档中 2-3 条结论，验证其 ``(`<file_path>:<line>` — `<关键代码片段>` — `[证据类型]`)`` 标注是否真实存在。标注指向不存在的文件/行号视为不合格，须修正或改标 `[待确认]`。

3. 输出生成文件清单及路径
4. 标注每个文件的生成状态（新建 / 已更新 / 未变化 / 跳过）
5. 输出交叉验证结果摘要（通过项 / 修正项 / 抽检结果）
6. 提示用户查看 `docs/first/` 目录

## 确认策略

- 推荐: assisted
- P0 幂等检测发现已有产物时，展示变更摘要后须用户确认再更新
- Agent D 数据库连接前须用户确认（涉及外部服务访问，详见 `references/agent-database.md` § Step 1）

## 成功标准

### 基础要求

- `docs/first/` 目录存在
- 必须生成：`tech-stack.md`、`external-deps.md`、`codebase-overview.md`、`architecture.md`、`api-docs.md`、`domain-model.md`、`development-guidelines.md`、`local-setup.md`、`README.md`
- 所有文档为合法 Markdown，头部包含 `last_updated` 字段

### 条件产物

- 如 `depth=deep` 或 `include_call_graph=true`，`call-graph.md` 存在且包含模块依赖矩阵、Mermaid 依赖图，并标注分析模式（LSP/静态）
- 如检测到 DB，`database-er.md` 存在且包含 Mermaid 图（关系型）或 Collection 结构（NoSQL）

### 内容质量要求

| 产物 | 最低要求 |
|------|----------|
| `domain-model.md` | 至少 3 个领域概念、1 个 Mermaid 关系图、2 条业务规则 |
| `development-guidelines.md` | 至少 1 个规范模块（代码风格/提交规范/测试要求/文档规范/错误处理/依赖管理） |
| `README.md` | 包含所有已生成产物的链接 |

### 质量指标（可量化）

| 指标 | 阈值 | 说明 |
|------|------|------|
| **证据标注覆盖率** | ≥ 90% | 技术结论中有证据标注的比例（不含 `[待确认]` 项） |
| **待确认项占比** | ≤ 20% | 标注 `[待确认]` 的结论占所有结论的比例 |
| **交叉验证通过率** | 100% | P5 的 V1-V4 四项校验必须全部通过（或已修正并记录） |
| **证据抽检准确率** | 100% | 随机抽检的证据标注必须指向真实存在的文件/行号 |

### 证据标注格式

所有技术结论必须附带证据源，格式：
```
- <结论> (`<file_path>:<line>` — `<关键代码片段>` — `[证据类型]`)
```

**违规判定**：无证据标注且未标记 `[待确认]` 的裸结论，视为不合格产出。

### 测试与验证要求

- 变更后的行为必须满足 `references/testing-strategy.md` 的最小测试矩阵（8 个逻辑 Agent + 编排链路）
- 至少覆盖：降级路径、超时路径、交叉验证路径、凭证脱敏路径
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
| `references/agent-domain-model.md` | A4 规格（领域模型分析） | Agent A4 |
| `references/testing-strategy.md` | 测试策略与最小用例矩阵（Agent + 编排） | 开发/审查阶段 |
