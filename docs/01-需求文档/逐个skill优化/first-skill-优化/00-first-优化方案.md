# 00-first Skill 优化方案

> 版本: v1.4.0 | 更新: 2026-03-02
>
> 基于「端类型产物需求差异」文档和市场 Skill 调研设计的优化方案。
> **v1.4.0 变更**：重新定位 quick 模式产物（4-5个），聚焦"项目+业务+数据"，移除 local-setup，database-er/call-graph 提升为标配。

---

## 1. 优化目标

### 1.1 当前问题

| 问题 | 影响 | 优先级 |
|------|------|--------|
| 质量保证过重 | 证据标注 + 交叉验证消耗大，token 成本高 | P0 |
| 产物数量过多 | 9-11 个文档，用户认知负担大 | P0 |
| 缺乏分层设计 | 不区分 quick/deep，所有场景都走全量流程 | P1 |
| 端类型感知不足 | 产物组合未按端类型智能调整 | P1 |

### 1.2 优化目标

| 目标 | 指标 |
|------|------|
| **快速入户** | quick 模式 <5min（首次初始化可容忍） |
| **产物聚焦** | quick 模式 4-5 个核心文档（vs 当前 9-11 个） |
| **业务理解** | 快速了解项目 + 承载的业务流程 + 数据模型 |
| **智能端适配** | 按端类型自动调整产物组合（Phase 2） |
| **保留企业级能力** | deep 模式保留完整质量保证 |

---

## 2. 方案设计

### 2.1 双模式架构

```
/spec-first:first                    # 默认 quick 模式（<5min）
/spec-first:first --deep             # deep 模式（<5min，完整分析）
/spec-first:first --type=backend     # 手动指定端类型
/spec-first:first --deep --type=admin # 组合使用
```

| 维度 | quick 模式 | deep 模式 |
|------|------------|-----------|
| **定位** | 快速认知，聚焦核心 | 企业级全量分析 |
| **执行时间** | <5min | <5min |
| **产物数量** | 4-5 个核心文档 | 10-11 个（按端类型） |
| **执行方式** | 简化 Agent 派发（4-5 个 Agent） | 8 Agent 三波派发 |
| **证据要求** | 无强制 | 强制（file:line + 代码片段 + 类型） |
| **交叉验证** | 无 | 4 项校验 |
| **产物位置** | `docs/first/`（frontmatter 标记 mode） | `docs/first/` |
| **适用场景** | 首次入户、会话恢复、快速了解 | 正式接手、架构评估、团队协作 |

### 2.2 端类型智能检测（7 种）

> **实施阶段**：Phase 2 — Phase 1 先实现 quick 模式核心功能，端类型检测作为增强功能在 Phase 2 实现。

```yaml
检测规则:
  后台服务:
    - pom.xml, build.gradle, build.gradle.kts  # Java/Kotlin
    - go.mod                                    # Go
    - requirements.txt, pyproject.toml          # Python
    - Cargo.toml                                # Rust
    - 且无前端目录

  前端 Web:                                     # 合并 Admin + H5
    Admin 子类型:
      - package.json + antd/ant-design/element-plus/arco-design/@alifd/next
    H5 子类型:
      - package.json + vant/nutui/mint-ui
      - 或检测到移动端适配代码（viewport/rem/媒体查询）
    通用前端:
      - package.json + react/vue/angular/svelte（无 Admin/H5 特征）

  移动端 App:                                    # 合并 iOS + Android
    iOS:
      - *.xcodeproj, *.xcworkspace, Podfile
    Android:
      - AndroidManifest.xml, build.gradle + com.android

  跨平台:
    Flutter: pubspec.yaml
    React Native: package.json + react-native
    UniApp: manifest.json + uni
    KMP: build.gradle.kts + kotlin("multiplatform")

  PC 桌面:                                       # 合并 Win/Mac/Linux
    Windows: *.csproj, *.sln / CMakeLists.txt + WinAPI
    macOS: *.xcodeproj + macOS target / Package.swift + macOS
    Linux: CMakeLists.txt, Makefile + GTK/Qt/SDL
    跨平台桌面: Electron(package.json + electron) / Tauri(Cargo.toml + tauri)

  Monorepo:
    - turbo.json, nx.json, lerna.json, pnpm-workspace.yaml

  后端+前端混合:
    - 同时检测到后端特征 + 前端 Web 特征
```

> **说明**：合并后为 7 种主类型。Admin/H5、iOS/Android、Win/Mac/Linux 作为子类型保留，影响模板选择但不影响产物集。

#### 检测失败处理（简化版）

当端类型检测无法匹配任何已知类型时：

```yaml
降级策略:
  未知技术栈 → 使用"通用模式"产物集
  空项目     → 提示"检测到空项目，建议先初始化项目后再运行"
  多端混合   → 自动归类为 Monorepo

用户提示:
  "⚠️ 无法自动识别项目类型，使用通用模式继续"
  "可用 --type=<backend|frontend|mobile|cross-platform|desktop|monorepo> 手动指定"
```

### 2.3 分层产物策略

> **核心目标**：快速了解项目 + 承载的业务流程 + 数据模型

#### Layer 0：quick 模式产物（4-5 个）

```
docs/first/
├── tech-stack.md         # 技术栈摘要（frontmatter: mode: quick）
├── codebase-overview.md  # 代码结构概览（frontmatter: mode: quick）
├── domain-model.md       # 业务领域模型（frontmatter: mode: quick）
├── api-docs.md           # API 接口文档（frontmatter: mode: quick）
└── database-er.md        # 数据库 ER 图（frontmatter: mode: quick, 如有 DB）
```

**生成方式**：简化 Agent 派发（4-5 个 Agent，<5min）

**产物说明**：

| 产物 | 内容 | 用途 |
|------|------|------|
| **tech-stack.md** | 语言、框架、构建工具、测试框架 | 回答"用什么技术建的" |
| **codebase-overview.md** | 目录结构、模块划分、数据流向 | 回答"代码怎么组织的" |
| **domain-model.md** | 核心概念、状态机、业务规则、流程图 | 回答"业务是什么" |
| **api-docs.md** | 端点列表、请求/响应格式 | 回答"业务入口在哪" |
| **database-er.md** | 表结构、关系、字段详情 | 回答"数据怎么存" |

**按端类型差异**：

| 端类型 | 产物数量 |
|--------|----------|
| 后台服务 | 5 个（含 database-er） |
| 前端 Web | 4 个（无 database-er） |
| 移动端 App | 4 个（无 database-er） |
| 跨平台 | 4-5 个（按是否有 DB） |

#### Layer 1：deep 模式标配产物（在 Layer 0 基础上追加 6 个）

```
docs/first/
├── call-graph.md            # 调用链分析（frontmatter: mode: deep）
├── architecture.md          # 架构图（frontmatter: mode: deep）
├── external-deps.md         # 外部依赖详析（frontmatter: mode: deep）
├── local-setup.md           # 本地环境搭建（frontmatter: mode: deep）
├── development-guidelines.md # 研发规范（frontmatter: mode: deep）
└── README.md                # 索引导航（frontmatter: mode: deep）
```

**产物说明**：

| 产物 | 内容 | 用途 |
|------|------|------|
| **call-graph.md** | 模块依赖矩阵、调用路径、Mermaid 依赖图 | 代码级别理解业务逻辑 |
| **architecture.md** | 分层架构、模块关系、数据流 | 系统级别理解架构设计 |
| **external-deps.md** | 第三方服务、中间件、版本信息 | 理解服务边界 |
| **local-setup.md** | 环境要求、依赖安装、启动命令 | 本地开发环境搭建 |
| **development-guidelines.md** | 代码风格、提交规范、测试要求 | 团队协作规范 |
| **README.md** | 索引导航、推荐阅读顺序 | 入口文档 |

**frontmatter 格式**：
```yaml
---
last_updated: 2026-03-02
mode: quick  # 或 deep
project_type: auto-detected  # 或用户指定
---
```

#### 按端类型的产物数量汇总

> **注意**：完整的端类型→产物映射请参见 `端类型产物需求差异.md` §3（唯一 source of truth）。

| 端类型 | Layer 0 + Layer 1 产物 |
|--------|----------------------|
| **后台服务** | Layer 0 (5个) + Layer 1 (6个) = 11 个 |
| **前端 Web** | Layer 0 (4个) + Layer 1 (6个) = 10 个 |
| **移动端 App** | Layer 0 (4个) + Layer 1 (6个) = 10 个 |
| **跨平台** | Layer 0 (4-5个) + Layer 1 (6个) = 10-11 个 |

---

## 3. 借鉴市场 Skill

### 3.1 置信度追踪（from outfitter/codebase-recon）

> **状态**：⏳ **Future Backlog** — 当前版本不实现，待 quick/deep 双模式和端类型检测稳定后再引入。
> **理由**：置信度本质是 AI 自评，投入产出比低；当前证据标注 + 交叉验证已提供质量保证。

**原设计**（供后续参考）：
```
| Bar  | Lvl | Name        | Action                    |
|------|-----|-------------|---------------------------|
| ░░░░░| 0   | Gathering    | Collect initial evidence  |
| ▓░░░░| 1   | Surveying    | Broad scan, surface patterns |
| ▓▓░░░| 2   | Investigating| Deep dive, verify patterns |
| ▓▓▓░░| 3   | Analyzing    | Cross-reference, fill gaps |
| ▓▓▓▓░| 4   | Synthesizing | Connect findings, high confidence |
| ▓▓▓▓▓| 5   | Concluded    | Deliver findings          |
```

**应用到 00-first**：
- deep 模式每个 Agent 显示置信度进度条
- 低于 Level 5 时输出 `△ Caveats` 章节
- 用户可随时打断并获取当前置信度的中间结果

### 3.2 Greenfield vs Brownfield 检测（from oimiragieo/project-onboarding）

**检测逻辑**：

| 指标 | 存在? | 分类 |
|------|-------|------|
| `.git` 目录有历史（>10 commits） | 是 | Brownfield |
| 有包管理文件 + 依赖已安装 | 是 | Brownfield |
| 有 `src/` 目录 + 代码文件 >50 | 是 | Brownfield |
| 空目录或只有 README.md | 否 | Greenfield |

**应用到 00-first**：
- Greenfield → 跳过历史分析，提示用户先创建代码
- Brownfield → 执行完整的历史项目认知流程

### 3.3 持久化记忆（from oimiragieo/project-onboarding）

**原设计**：
```
.claude/context/memory/
├── project-structure.md
├── build-commands.md
└── test-commands.md
```

**应用到 00-first**：
- quick/deep 模式产物统一 → `docs/first/`（git 追踪 + 团队共享）
- quick 模式通过产物 frontmatter `mode: quick` 标记区分
- deep 模式可复用 quick 模式的端类型检测和技术栈识别中间数据（JSON）
- 会话恢复时优先读取产物 frontmatter 判断已有模式

---

## 4. 首次运行 vs 增量更新

### 4.1 场景定义

| 场景 | 定义 | 触发条件 |
|------|------|----------|
| **首次运行** | 全量生成所有产物 | `docs/first/` 目录不存在或为空 |
| **增量更新** | 仅更新受变更影响的产物 | `docs/first/` 目录已有产物 |

### 4.2 增量更新流程

```
P0: 幂等检测
    │
    ├─ 首次运行 → 全量生成流程
    │
    └─ 增量更新 → 执行以下流程
         │
         ├─ Step 1: 读取已有产物的 last_updated 时间戳
         │
         ├─ Step 2: git diff 检测变更文件
         │   git diff --stat <last_updated_commit>..HEAD -- .
         │
         ├─ Step 3: 变更文件 → 受影响产物映射
         │
         ├─ Step 4: 输出变更摘要，询问用户确认
         │
         └─ Step 5: 仅重新生成受影响的产物
```

### 4.3 变更文件 → 受影响产物映射

| 变更文件模式 | 触发更新的产物 |
|-------------|---------------|
| `package.json`/`pom.xml`/`go.mod` 等 | `tech-stack.md`, `external-deps.md` |
| `src/` 下源码文件 | `codebase-overview.md`, `architecture.md`, `call-graph.md`, `api-docs.md` |
| `.eslintrc`/`.prettierrc`/`commitlint` | `development-guidelines.md` |
| `Dockerfile`/`docker-compose.yml` | `architecture.md`, `local-setup.md` |
| `.env.example`/`Makefile` | `local-setup.md` |
| DB migration / `prisma/schema.prisma` | `database-er.md`, `domain-model.md` |
| `src/api/` / `routes/` / `controllers/` | `api-docs.md` |
| `i18n/` / `locales/` | `i18n.md` |
| `README.md` / `CHANGELOG.md` | `README.md`（索引） |

### 4.4 增量更新输出示例

```markdown
## 📋 检测到已有产物，进入增量更新模式

**上次更新**: 2026-02-28 14:30
**当前版本**: v1.2.0

**变更摘要**：
- 变更文件数：23 个
- 新增文件：5 个
- 修改文件：18 个

**受影响的产物**：
| 产物 | 原因 | 状态 |
|------|------|------|
| `tech-stack.md` | package.json 变更 | 🔄 需更新 |
| `api-docs.md` | src/api/ 下 12 个文件变更 | 🔄 需更新 |
| `architecture.md` | src/ 下结构变化 | 🔄 需更新 |
| `external-deps.md` | 新增 2 个依赖 | 🔄 需更新 |
| `codebase-overview.md` | 无相关变更 | ✅ 保持不变 |
| `development-guidelines.md` | 无相关变更 | ✅ 保持不变 |
| `local-setup.md` | 无相关变更 | ✅ 保持不变 |

**操作选项**：
1. 更新受影响的 4 个产物（推荐）
2. 全量重新生成所有产物
3. 取消

请选择 [1/2/3]:
```

### 4.5 非 Git 项目的降级策略

| 场景 | 降级方式 |
|------|----------|
| 无 `.git` 目录 | 逐个比对产物 `last_updated` 与文件修改时间 |
| Git 历史不足 | 提示用户选择：增量更新（基于文件 mtime）或全量重新生成 |

### 4.6 强制全量更新

用户可通过以下方式强制全量重新生成：

```bash
/spec-first:first --force      # 强制全量更新
/spec-first:first --deep --force  # deep 模式强制全量
```

---

### 4.7 quick→deep 升级路径

当用户先运行 quick 模式后运行 deep 模式时：

```
检测到已有产物（读取 frontmatter mode: quick）
    │
    ├─ Step 1: 读取 quick 产物 frontmatter 中的端类型检测和技术栈识别中间数据
    │   └─ 复用：端类型检测结果、语言/框架检测结果、包管理器检测结果
    │
    ├─ Step 2: Layer 0 产物（tech-stack / codebase-overview / domain-model / api-docs / database-er）
    │   └─ **重新生成**（非复用）
    │   └─ 原因：deep 模式要求 ≥90% 证据标注覆盖率，quick 产物无证据标注
    │
    ├─ Step 3: Layer 1 产物（call-graph / architecture / external-deps / local-setup / development-guidelines / README）
    │   └─ 全新生成（quick 模式不生成这些产物）
    │
    └─ Step 4: 交叉验证
```

**关键决策**：
- **复用范围**：仅复用端类型检测和技术栈识别的**中间数据**（JSON），不复用 quick 产物文件内容
- **原因**：deep 模式的质量要求（证据标注、Serena 符号分析、交叉验证）与 quick 模式不兼容
- **产物覆盖**：deep 生成的所有产物会覆盖 quick 版本，frontmatter 更新为 `mode: deep`

---

## 5. 执行流程

### 4.1 quick 模式流程

```
P0: 检测项目根目录 + Greenfield/Brownfield 判断
    │
    ├─ Greenfield → 提示"项目为空，请先创建代码"
    │
    └─ Brownfield → 继续
         │
P1a: 技术栈识别（主线程，<30s）
    ├─ 语言/框架检测
    ├─ 端类型检测（Phase 2 功能，Phase 1 跳过）
    └─ 包管理器检测
         │
P1b: 立即派发简化 Agent（4-5 个）
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

**总时间**：<5min

**与 deep 模式差异**：
- Agent 数量：4-5 个 vs 8 个
- 跳过：Context7 查询、交叉验证、符号分析（Serena）、架构分析
- 产物：4-5 个核心文档 vs 10-11 个完整文档

### 4.2 deep 模式流程（在 quick 基础上追加）

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
P5: 汇总 + README 生成 + 交叉验证（主线程）
```

**优化点**：
- 按端类型动态调整 Agent 派发（Phase 2 功能）
- 纯前端项目跳过 Agent D（数据库）
- simple 项目跳过 Agent A3（调用链）

---

## 6. 产物模板按端定制

### 5.1 architecture.md 模板差异

**后台服务模板**：
```markdown
# 系统架构

## 分层架构
[Controller → Service → Repository → DB]

## 中间件
[Redis/Kafka/RabbitMQ]

## 数据流
[请求 → 认证 → 业务逻辑 → 数据持久化]
```

**前端模板（FSD 风格）**：
```markdown
# 系统架构

## FSD 层级
[App → Pages → Widgets → Features → Entities → Shared]

## 组件树
[关键组件结构]

## 状态管理
[Store 结构 / 数据流]
```

**App 模板**：
```markdown
# 系统架构

## 原生层
[iOS/Android 原生模块]

## 跨平台层
[Flutter/RN 业务代码]

## 桥接层
[Platform Channel / JSBridge]

## 网络层
[API Client / 缓存策略]
```

### 5.2 api-docs.md 视角差异

| 端类型 | 视角 | 内容侧重 |
|--------|------|----------|
| 后台服务 | **暴露方** | 端点定义、请求/响应格式、错误码、认证方式 |
| 前端/App | **调用方** | 接口清单、调用示例、错误处理、缓存策略 |

---

## 7. 质量保证调整

### 6.1 quick 模式（简化）

- **无强制证据标注**
- **无交叉验证**
- **产物位置**：`docs/first/`（统一位置，frontmatter `mode: quick` 标记）

### 6.2 deep 模式（保留）

- **强制证据标注**：`file:line + 代码片段 + [证据类型]`
- **交叉验证**：4 项校验（V1-V4）
- **证据覆盖率**：≥90%
- **产物位置**：`docs/first/`（团队共享）

---

## 8. 实施计划

### 7.1 阶段划分

| 阶段 | 内容 | 预计时间 |
|------|------|----------|
| **Phase 1** | quick 模式实现（核心价值） | 2 天 |
| **Phase 2** | 端类型智能检测 + 产物组合（增强） | 1.5 天 |
| **Phase 3** | 模板按端定制 | 0.5 天 |
| **Phase 4** | 测试 + 文档更新 | 1 天 |

**Phase 1 详细拆解**：
- 1.1 重命名 overview→quick（0.5h）
- 1.2 quick 模式执行流程（4-5 个 Agent 派发）（4h）
- 1.3 quick 模式产物模板（tech-stack / codebase-overview / domain-model / api-docs / database-er）（3h）
- 1.4 frontmatter 标记（mode: quick）（1h）
- 1.5 交互式选项简化（1h）
- 1.6 CLI 参数支持（--deep/--type/--force）（2h）
- 1.7 quick→deep 升级路径（1h）

**Phase 2 详细拆解**：
- 2.1 端类型检测规则（基于已有 detection-rules 聚合）（2h）
- 2.2 端类型产物组合配置（2h）
- 2.3 检测失败简化处理（0.5h）
- 2.4 Greenfield 检测（0.5h）

### 7.2 文件变更清单

| 文件 | 变更 |
|------|------|
| `skills/spec-first/00-first/SKILL.md` | 新增 quick 模式、分流执行流程 |
| `skills/spec-first/00-first/references/detection-rules.md` | 新增 7 种端类型检测规则（Phase 2） |
| `skills/spec-first/00-first/references/端类型产物映射.md` | 端类型 → 产物集映射配置（Phase 2） |
| `src/core/skill-runtime/first-args.ts` | first skill 参数解析（--deep/--type/--force）（新增） |
| `src/core/skill-runtime/dispatcher.ts` | Skill 路由增加 first skill 参数透传 |
| `tests/unit/first-args.test.ts` | first skill 参数解析单元测试（新增） |

---

## 9. 实现状态分析

### 9.1 已实现功能（无需修改）

| 功能 | 当前实现位置 | 对应优化方案 |
|------|-------------|--------------|
| **overview/deep 分层** | Q1 交互式选项 | 对应 quick/deep 模式（需重命名） |
| **数据库条件生成** | Q2 + Agent D 条件派发 | 保留，端类型检测会增强 |
| **调用链条件生成** | Q3 + Agent A3 条件派发 | 保留，Layer 2 按需生成 |
| **幂等检测 + 增量更新** | P0 § 幂等检测 | 完全复用，无需修改 |
| **变更文件 → 受影响文档映射** | P0 变更映射表 | 完全复用，无需修改 |
| **8 Agent 三波派发** | 并发执行策略 | deep 模式保留此架构 |
| **证据标注格式** | 核心约束 | deep 模式保留，quick 模式简化 |
| **交叉一致性验证** | P5 V1-V4 校验 | deep 模式保留，quick 模式跳过 |
| **12 语言 + 20 框架检测** | detection-rules.md | 保留，扩展端类型检测 |
| **Serena MCP 集成** | P0 激活 Serena | 完全复用 |
| **超时控制 + 降级策略** | 并发执行策略 | 完全复用 |
| **domain-model.md** | Agent A4 | 保留，后台/后端+Admin 必选 |

### 9.2 需要新增的功能

| 功能 | 说明 | 优先级 | 工作量 |
|------|------|--------|--------|
| **quick 模式执行路径** | 4-5 个 Agent 派发，4-5 个核心产物 | P0 | 4h |
| **frontmatter 标记** | 产物头部 `mode: quick/deep` | P0 | 1h |
| **CLI 参数解析** | --deep/--type/--force | P0 | 2h |
| **端类型智能检测** | 7 种端类型检测规则（含子类型） | P1 | 2h |
| **端类型产物组合配置** | 按端类型动态选择产物集 | P1 | 2h |
| **Greenfield 检测** | 空项目检测 + 提示 | P1 | 0.5h |
| **检测失败简化处理** | 通用模式 + 一行提示 | P2 | 0.5h |

### 9.3 需要修改的功能

| 功能 | 当前状态 | 修改内容 | 工作量 |
|------|----------|----------|--------|
| **交互式选项** | Q1/Q2/Q3 三个问题 | 简化为：Q1 quick/deep（Q2 端类型可选，Phase 2） | 1h |
| **SKILL.md 执行流程** | 单一流程 | 分流为 quick 流程 + deep 流程 | 3h |
| **成功标准** | 固定标准 | 按模式区分：quick 4-5 个产物 / deep 10-11 个 | 1h |
| **detection-rules.md** | 语言/框架检测 | 扩展端类型检测规则（Phase 2） | 2h |

### 9.4 实施优先级

```
Phase 0：确认已有功能（0 天）
├── ✅ overview/deep 模式（需重命名）
├── ✅ 幂等检测 + 增量更新
├── ✅ 8 Agent 三波派发
├── ✅ 证据标注 + 交叉验证
└── ✅ 12 语言 + 20 框架检测

Phase 1：核心优化 — quick 模式（2 天）
├── 1.1 重命名 overview→quick（0.5h）
├── 1.2 quick 模式执行流程（3-4 个 Agent）（4h）
├── 1.3 quick 模式产物模板（3h）
├── 1.4 frontmatter 标记（mode: quick）（1h）
├── 1.5 CLI 参数支持（2h）
├── 1.6 交互式选项简化（1h）
└── 1.7 quick→deep 升级路径（1h）

Phase 2：增强功能 — 端类型检测（1.5 天）
├── 2.1 端类型检测规则（2h）
├── 2.2 端类型产物组合配置（2h）
├── 2.3 Greenfield 检测（0.5h）
├── 2.4 检测失败简化处理（0.5h）
└── 2.5 交互式选项增加端类型（可选）（0.5h）

Phase 3：模板与测试（1.5 天）
├── 3.1 模板按端定制（architecture/api-docs 视角差异）（2h）
├── 3.2 更新测试用例（2h）
├── 3.3 更新成功标准（1h）
└── 3.4 文档同步（2h）
```

### 9.5 文件变更清单

| 文件 | 变更类型 | 变更内容 |
|------|----------|----------|
| `skills/spec-first/00-first/SKILL.md` | **修改** | 新增 quick 模式、分流执行流程 |
| `skills/spec-first/00-first/references/detection-rules.md` | **修改** | 新增 7 种端类型检测规则（Phase 2） |
| `skills/spec-first/00-first/references/subagent-architecture.md` | **修改** | 补充 quick 模式说明 |
| `skills/spec-first/00-first/references/testing-strategy.md` | **修改** | 新增 quick 模式测试用例 |
| `skills/spec-first/00-first/references/端类型产物映射.md` | **新增** | 端类型 → 产物集映射配置（Phase 2） |
| `src/core/skill-runtime/first-args.ts` | **新增** | first skill 参数解析（--deep/--type/--force） |
| `src/core/skill-runtime/dispatcher.ts` | **修改** | Skill 路由增加 first skill 参数透传 |
| `tests/unit/first-args.test.ts` | **新增** | first skill 参数解析单元测试 |

---

## 10. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| quick 模式信息不够 | 用户可能需要再跑 deep | 在摘要中提示"运行 --deep 获取完整分析" |
| 端类型检测误判 | 产物组合不准确 | 提供手动指定参数 `--type=X` |
| quick 模式 5min 仍然偏长 | 用户耐心不足 | 明确说明"首次初始化"，后续增量更新会更快 |

---

## 11. 深度优化建议

> 基于「端类型产物需求差异」文档和市场 Skill 最佳实践的深度分析，提出以下优化方向。

### 11.1 产物粒度

**决策**：保持当前产物粒度，不做合并。

**理由**：
- 当前 11 个产物（quick 4-5 个 + deep 6 个）各司其职，覆盖技术、业务、数据、流程、规范等维度
- 产物合并带来的认知收益不足以抵消实现复杂度
- 用户可按需阅读，不需要全部浏览

### 11.2 quick 模式产物定位

**已解决**：quick/deep 统一使用 `docs/first/` 目录，通过产物 frontmatter `mode: quick/deep` 区分。

**当前方案**：

```yaml
# 统一产物位置和标记
quick 模式产物（4-5 个）：
  docs/first/
  ├── tech-stack.md        # frontmatter: mode: quick
  ├── codebase-overview.md # frontmatter: mode: quick
  ├── domain-model.md      # frontmatter: mode: quick
  ├── api-docs.md          # frontmatter: mode: quick
  └── database-er.md       # frontmatter: mode: quick（如有 DB）

deep 模式升级策略：
  - 检测到 frontmatter mode: quick → 复用端类型检测和技术栈识别的中间数据
  - Layer 0 产物重新生成（加证据标注，满足 deep 质量要求）
  - Layer 1 产物全新生成（6 个）
  - frontmatter 更新为 mode: deep
```

### 11.3 端类型复合检测

**问题分析**：
- 单一端类型判断不够灵活
- Spring Boot + Vue Admin 同一仓库 → 检测为「后端+Admin」还是「Monorepo」？
- Nx Monorepo 包含多个 React App → 检测后如何处理各 App？

**优化建议**：

```yaml
# 复合类型检测结果
检测结果:
  主类型: Monorepo
  子类型: [后端+Admin, Admin, H5]
  产物策略: 根级产物(9个) + packages/admin/(12个) + packages/h5/(11个)

# 跨平台细分
Flutter Web:
  检测结果: 跨平台[Flutter] + H5
  产物组合: 跨平台产物集 + H5 性能/兼容性产物
```

### 11.4 交互式选项智能化

**问题分析**：
- 用户不知道选 quick 还是 deep
- 端类型检测自动完成时，确认问题是多余的
- 缺少"渐进式"体验

**优化建议**：

```yaml
# 智能模式推荐
智能推荐规则:
  - 代码量 < 1000 行 → 自动 quick 模式
  - 检测到 50+ API 端点 → 提示"建议 deep 模式"
  - 检测到数据库配置 → 提示"建议 deep 模式生成 ER 图"

# 渐进式升级
quick 完成后提示:
  - "检测到项目包含 50+ API 端点，是否生成 API 文档？[Y/n]"
  - "检测到数据库配置，是否生成 ER 图？[Y/n]"

# 默认无交互
/spec-first:first              # 自动检测并执行，无交互
/spec-first:first --interactive # 启用交互式选项
```

### 11.5 增量更新边界条件

**问题分析**：
- 大规模重构（100+ 文件变更）时增量更新效率可能低于全量
- 产物损坏或被手动修改时无法检测
- 跨分支切换时更新策略不明确

**优化建议**：

```yaml
# 变更阈值策略
更新策略:
  变更文件 > 30%:
    - 提示"检测到大规模变更，建议全量更新"
    - 用户可选择增量或全量

  产物健康检查:
    - 读取产物头部元数据（last_updated, git_commit, file_hash）
    - git_commit 不匹配 → 标记需更新
    - 文件损坏/格式错误 → 自动重新生成

# 选择性更新参数
/spec-first:first --update api-docs,architecture  # 仅更新指定产物
/spec-first:first --since v1.2.0                  # 更新指定版本后的变更
/spec-first:first --check-health                  # 仅检查产物健康度
```

### 11.6 会话恢复与产物索引

**问题分析**：
- 会话恢复时不知道已有哪些产物
- quick 模式产物和 deep 模式产物如何协调
- 多次运行可能重复生成

**优化建议**：

```yaml
# 产物索引文件
# docs/first/.index.yaml
version: 1.0.0
last_run: 2026-03-02T14:30:00Z
mode: deep
端类型: 后端+Admin
git_commit: abc1234
products:
  - name: tech-stack.md
    confidence: 5
    last_updated: 2026-03-02T14:25:00Z
  - name: architecture.md
    confidence: 4
    last_updated: 2026-03-02T14:28:00Z

# 会话恢复提示
会话恢复:
  检测到已有 00-first 产物（2026-03-02 14:30）
  端类型: 后端+Admin | 模式: deep

  选项：
  1. 查看现有产物摘要
  2. 增量更新（基于 git diff）
  3. 全量重新生成
  4. 跳过（直接使用现有产物）

# 产物过期提醒
过期规则:
  - 产物超过 7 天未更新 → 提示"产物可能过期"
  - git commit 不匹配 → 提示"代码已更新，建议重新生成"
```

---

## 12. 优化建议优先级

| 优先级 | 优化点 | 工作量 | 收益 | 实施阶段 |
|--------|--------|--------|------|----------|
| **P0** | quick 模式实现 | 10h | 高 - 快速入户 | Phase 1 |
| **P0** | frontmatter 标记 | 1h | 高 - 模式区分 | Phase 1 |
| **P1** | 端类型复合检测 | 3h | 中 - 处理复杂项目 | Phase 2 |
| **P1** | 交互式选项智能化 | 2h | 中 - 减少用户决策 | Phase 2 |
| **P2** | 增量更新边界条件 | 2h | 中 - 效率优化 | Phase 3 |
| **P2** | 会话恢复与产物索引 | 3h | 低 - 便利性 | Phase 3 |

**总工作量**：约 5 天（Phase 1: 2天 / Phase 2: 1.5天 / Phase 3: 1.5天）

---

## 13. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.4.0 | 2026-03-02 | 重新定位 quick 模式产物：聚焦"快速了解项目 + 业务流程 + 数据模型"，调整为 4-5 个产物（tech-stack / codebase-overview / domain-model / api-docs / database-er），移除 local-setup.md 到 deep 模式，database-er.md 和 call-graph.md 提升为标配 |
| v1.3.0 | 2026-03-02 | 用户决策修正：quick 模式支持 subagent（<5min）、产物标记改用 frontmatter、移除产物合并建议、简化检测失败处理、端类型检测延至 Phase 2、参数名改为英文（--type） |
| v1.2.0 | 2026-03-02 | Review 修正：统一产物位置为 docs/first/、产物命名统一、端类型合并 10→7（含子类型）、明确 quick→deep 升级路径（Layer 0 重新生成）、置信度追踪移入 future backlog、补充 skill-runtime 代码改动、实施计划 Task 粒度调整 |
| v1.1.0 | 2026-03-02 | 新增「深度优化建议」章节（11-12），基于端类型需求差异和市场 Skill 最佳实践提出 7 个优化方向 |
| v1.0.3 | 2026-03-02 | 新增「实现状态分析」章节（9），对比当前代码与优化方案 |
| v1.0.2 | 2026-03-02 | 新增「首次运行 vs 增量更新」章节（4），定义增量更新流程和变更映射 |
| v1.0.1 | 2026-03-02 | 新增「检测失败处理」章节（2.4） |
| v1.0.0 | 2026-03-02 | 初始版本，基于调研设计优化方案 |
