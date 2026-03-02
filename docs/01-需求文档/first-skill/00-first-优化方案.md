# 00-first Skill 优化方案

> 版本: v1.1.0 | 更新: 2026-03-02
>
> 基于「端类型产物需求差异」文档和市场 Skill 调研设计的优化方案。

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
| **入户时间缩短** | quick 模式 <30s（vs 当前 5min） |
| **产物聚焦** | quick 模式 3 个核心文档（vs 当前 9-11 个） |
| **智能端适配** | 按端类型自动调整产物组合 |
| **保留企业级能力** | deep 模式保留完整质量保证 |

---

## 2. 方案设计

### 2.1 双模式架构

```
/spec-first:first                    # 默认 quick 模式（<30s）
/spec-first:first --deep             # deep 模式（<5min）
/spec-first:first --端类型=后台       # 指定端类型
/spec-first:first --deep --端类型=Admin  # 组合使用
```

| 维度 | quick 模式 | deep 模式 |
|------|------------|-----------|
| **定位** | 快速认知，秒级入户 | 企业级全量分析 |
| **执行时间** | <30s | <5min |
| **产物数量** | 3 个核心文档 | 9-16 个（按端类型） |
| **执行方式** | 主线程，无 subagent | 8 Agent 三波派发 |
| **证据要求** | 无强制 | 强制（file:line + 代码片段 + 类型） |
| **交叉验证** | 无 | 4 项校验 |
| **产物位置** | `.claude/context/memory/` | `docs/first/` |
| **适用场景** | 首次入户、会话恢复、快速了解 | 正式接手、架构评估、团队协作 |

### 2.2 端类型智能检测

```yaml
检测规则:
  后台服务:
    - pom.xml, build.gradle, build.gradle.kts  # Java/Kotlin
    - go.mod                                    # Go
    - requirements.txt, pyproject.toml          # Python
    - Cargo.toml                                # Rust
    - 且无前端目录

  Admin 后台:
    - package.json + antd/ant-design/element-plus/arco-design/@alifd/next

  H5/移动Web:
    - package.json + vant/nutui/mint-ui
    - 或检测到移动端适配代码（viewport/rem/媒体查询）

  iOS:
    - *.xcodeproj, *.xcworkspace, Podfile

  Android:
    - AndroidManifest.xml, build.gradle + com.android

  跨平台:
    Flutter: pubspec.yaml
    React Native: package.json + react-native
    UniApp: manifest.json + uni
    KMP: build.gradle.kts + kotlin("multiplatform")

  PC-Windows:
    - *.csproj, *.sln
    - CMakeLists.txt + WinAPI

  PC-macOS:
    - *.xcodeproj + macOS target
    - Package.swift + macOS

  PC-Linux:
    - CMakeLists.txt, Makefile + GTK/Qt/SDL

  Monorepo:
    - turbo.json, nx.json, lerna.json, pnpm-workspace.yaml

  后端+Admin混合:
    - 同时检测到后端特征 + Admin 前端特征
```

#### 检测失败处理

当端类型检测无法匹配任何已知类型时，按以下流程处理：

**Step 1：检测失败场景识别**

| 场景 | 特征 | 处理方式 |
|------|------|----------|
| **空项目/新项目** | 无代码文件，只有 README/.gitignore | Greenfield 模式 |
| **多端混合项目** | 同时检测到 3+ 种端特征 | Monorepo 模式 |
| **未知技术栈** | 有代码但无匹配的包管理文件 | 通用模式 |
| **配置文件缺失** | 无 package.json/pom.xml/go.mod 等 | 交互式询问 |

**Step 2：降级策略**

```
检测失败处理流程:
│
├─ 场景 A：空项目（Greenfield）
│   └─ 输出提示："检测到空项目，建议先初始化项目后再运行 00-first"
│   └─ 提供"项目初始化建议"（推荐技术栈、目录结构模板）
│
├─ 场景 B：多端混合（检测到 3+ 种端特征）
│   └─ 自动归类为 Monorepo
│   └─ 生成根级产物 + 各 package 独立产物
│
├─ 场景 C：未知技术栈（有代码但无法识别）
│   └─ 使用"通用模式"产物集
│   └─ 交互式询问用户确认端类型
│
└─ 场景 D：配置文件缺失
    └─ 交互式询问：
    │   "无法自动检测项目类型，请选择："
    │   1. 后台服务
    │   2. 前端 Web
    │   3. 移动端 App
    │   4. PC 桌面
    │   5. 跨平台
    │   6. Monorepo
    └─ 根据用户选择继续
```

**Step 3：通用模式产物集**

当无法识别端类型时，使用通用模式产物：

```
docs/first/
├── README.md                # 索引导航
├── tech-stack.md            # 技术栈（基于代码分析）
├── codebase-overview.md     # 代码结构概览
├── architecture.md          # 架构图（简化版）
├── api-docs.md              # API 文档（如有）
├── development-guidelines.md # 研发规范
└── local-setup.md           # 本地环境搭建
```

**产物数量**：7 个（保守策略，覆盖核心场景）

**Step 4：检测失败时的用户提示**

```markdown
## ⚠️ 端类型检测失败

**检测到的特征**：
- 存在文件：src/, package.json
- 未匹配：已知框架特征

**可能原因**：
1. 使用了不在支持列表中的框架
2. 项目配置文件不标准
3. 这是一个新类型的项目

**建议操作**：
- 选项 1：手动指定端类型 `--端类型=后台`
- 选项 2：使用通用模式继续（生成 7 个核心文档）
- 选项 3：提供项目信息帮助改进检测

是否使用通用模式继续？[Y/n]
```

### 2.3 分层产物策略

#### Layer 0：核心产物（所有端必须，quick 模式产物）

```
.claude/context/memory/
├── project-structure.md     # 项目结构概览
├── tech-stack.md            # 技术栈摘要
└── build-commands.md        # 构建/测试/运行命令
```

**生成方式**：主线程直接执行，无 subagent，<30s

#### Layer 1：标配产物（按端类型自动选择，deep 模式）

| 端类型 | Layer 1 产物 |
|--------|-------------|
| **后台服务** | architecture + api-docs(暴露) + database-er + domain-model + external-deps + monitoring |
| **Admin 后台** | architecture + api-docs(调用) + component-library + state-management + routing |
| **H5** | architecture(简化) + api-docs(调用) + performance + compatibility |
| **iOS/Android** | architecture(简化) + api-docs(调用) + app-release + compatibility + testing-strategy |
| **跨平台** | architecture + api-docs + platform-bridge + compatibility + i18n |
| **PC** | architecture + api-docs + desktop-native + release + performance |
| **Monorepo** | architecture + module-graph + env-config + testing-strategy |
| **后端+Admin** | 全部 Layer 1 产物（16 个） |

#### Layer 2：扩展产物（按需生成）

| 产物 | 触发条件 |
|------|----------|
| `call-graph.md` | `depth=deep` 且项目复杂度 > 中等 |
| `external-deps.md` | 检测到 5+ 外部服务依赖 |
| `monitoring.md` | 检测到监控配置（Prometheus/Grafana/Sentry） |
| `i18n.md` | 检测到多语言配置（i18n/locale） |

---

## 3. 借鉴市场 Skill

### 3.1 置信度追踪（from outfitter/codebase-recon）

**原设计**：
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
- quick 模式产物 → `.claude/context/memory/`（会话间持久化）
- deep 模式产物 → `docs/first/`（团队共享）
- 会话恢复时优先读取 memory 文件

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
| `.env.example`/`Makefile` | `local-setup.md`, `env-config.md` |
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

## 5. 执行流程

### 4.1 quick 模式流程

```
P0: 检测项目根目录 + Greenfield/Brownfield 判断
    │
    ├─ Greenfield → 提示"项目为空，请先创建代码"
    │
    └─ Brownfield → 继续
         │
P1: 技术栈识别（主线程，<10s）
    ├─ 语言/框架检测
    ├─ 端类型检测
    └─ 包管理器检测
         │
P2: 目录结构扫描（主线程，<15s）
    ├─ git ls-files 或目录遍历
    ├─ 入口文件识别
    └─ 模块划分推断
         │
P3: 生成产物（主线程，<5s）
    ├─ project-structure.md
    ├─ tech-stack.md
    └─ build-commands.md
         │
P4: 输出摘要
    ├─ 项目类型、技术栈、快速命令
    └─ 提示"运行 --deep 获取完整分析"
```

**总时间**：<30s

### 4.2 deep 模式流程（保留当前设计，优化产物组合）

```
P0: 定位 + 幂等检测 + 端类型检测（主线程）
    │
P1a: 技术栈识别（主线程，<30s）
    │ 立即派发第一波 Agent
    ├─ Agent A1: codebase-overview.md + 模块清单 JSON
    ├─ Agent A3: call-graph.md（条件派发）
    ├─ Agent B: api-docs.md
    ├─ Agent C1: external-deps.md
    └─ Agent D: database-er.md（条件派发）
    │
P1b: Context7 映射收集（与第一波并行）
    │
第二波（P1b + C1 完成后）：
    └─ Agent C2: development-guidelines.md → local-setup.md
    │
第三波（A2 + B + D 完成后）：
    └─ Agent A4: domain-model.md
    │
P5: 汇总 + README 生成 + 交叉验证（主线程）
```

**优化点**：
- 按端类型动态调整 Agent 派发
- 纯前端项目跳过 Agent D（数据库）
- 简单项目跳过 Agent A3（调用链）
- 每个 Agent 显示置信度进度条

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
- **产物位置**：`.claude/context/memory/`（个人记忆）
- **置信度**：不显示进度条

### 6.2 deep 模式（保留）

- **强制证据标注**：`file:line + 代码片段 + [证据类型]`
- **交叉验证**：4 项校验（V1-V4）
- **证据覆盖率**：≥90%
- **置信度追踪**：每个 Agent 显示 0-5 级进度条
- **产物位置**：`docs/first/`（团队共享）

---

## 8. 实施计划

### 7.1 阶段划分

| 阶段 | 内容 | 预计时间 |
|------|------|----------|
| **Phase 1** | quick 模式实现 | 2 天 |
| **Phase 2** | 端类型智能检测 + 产物组合 | 1 天 |
| **Phase 3** | 置信度追踪集成 | 1 天 |
| **Phase 4** | 模板按端定制 | 1 天 |
| **Phase 5** | 测试 + 文档更新 | 1 天 |

### 7.2 文件变更清单

| 文件 | 变更 |
|------|------|
| `skills/spec-first/00-first/SKILL.md` | 新增 quick 模式、端类型检测、分层产物 |
| `skills/spec-first/00-first/references/` | 新增端类型产物映射、模板差异配置 |
| `src/core/skill-runtime/` | 支持模式切换参数解析 |

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
| **quick 模式执行路径** | 秒级入户，3 个核心产物，主线程执行，无 subagent | P0 | 4h |
| **端类型智能检测** | 10 种端类型检测规则 | P0 | 3h |
| **端类型产物组合配置** | 按端类型动态选择产物集 | P0 | 2h |
| **置信度追踪** | 0-5 级进度条 + Caveats 输出 | P1 | 3h |
| **Greenfield 检测** | 空项目检测 + 提示 | P1 | 1h |
| **产物写入 memory/** | quick 模式产物写入 `.claude/context/memory/` | P1 | 1h |
| **检测失败处理** | 通用模式 + 交互式询问 | P2 | 2h |
| **--force 参数** | 强制全量更新 | P2 | 0.5h |
| **--端类型=X 参数** | 手动指定端类型 | P2 | 0.5h |

### 9.3 需要修改的功能

| 功能 | 当前状态 | 修改内容 | 工作量 |
|------|----------|----------|--------|
| **交互式选项** | Q1/Q2/Q3 三个问题 | 简化为：Q1 quick/deep + Q2 端类型（可选） | 1h |
| **产物位置逻辑** | 固定 `docs/first/` | quick → `.claude/context/memory/`，deep → `docs/first/` | 1h |
| **detection-rules.md** | 语言/框架检测 | 扩展端类型检测规则 | 2h |
| **SKILL.md 执行流程** | 单一流程 | 分流为 quick 流程 + deep 流程 | 3h |
| **成功标准** | 固定标准 | 按模式区分：quick 3 个产物 / deep 端类型组合 | 1h |

### 9.4 实施优先级

```
Phase 0：确认已有功能（0 天）
├── ✅ overview/deep 模式（需重命名）
├── ✅ 幂等检测 + 增量更新
├── ✅ 8 Agent 三波派发
├── ✅ 证据标注 + 交叉验证
└── ✅ 12 语言 + 20 框架检测

Phase 1：核心优化（2 天）
├── 1.1 重命名 overview→quick（0.5h）
├── 1.2 新增 quick 模式执行路径（4h）
├── 1.3 端类型检测规则（3h）
├── 1.4 端类型产物组合配置（2h）
└── 1.5 交互式选项简化（1h）

Phase 2：增强功能（2 天）
├── 2.1 置信度追踪（3h）
├── 2.2 Greenfield 检测（1h）
├── 2.3 产物位置逻辑（1h）
├── 2.4 检测失败处理（2h）
└── 2.5 命令行参数（1h）

Phase 3：测试 + 文档（1 天）
├── 3.1 更新测试用例（2h）
├── 3.2 更新成功标准（1h）
└── 3.3 文档同步（1h）
```

### 9.5 文件变更清单

| 文件 | 变更类型 | 变更内容 |
|------|----------|----------|
| `skills/spec-first/00-first/SKILL.md` | **修改** | 新增 quick 模式、端类型检测、分流执行流程 |
| `skills/spec-first/00-first/references/detection-rules.md` | **修改** | 新增 10 种端类型检测规则 |
| `skills/spec-first/00-first/references/subagent-architecture.md` | **修改** | 补充 quick 模式说明 |
| `skills/spec-first/00-first/references/testing-strategy.md` | **修改** | 新增 quick 模式测试用例 |
| `skills/spec-first/00-first/references/端类型产物映射.md` | **新增** | 端类型 → 产物集映射配置 |
| `skills/spec-first/00-first/references/quick-templates/` | **新增** | quick 模式产物模板 |
| `src/core/skill-runtime/` | **修改** | 支持模式切换参数解析 |

---

## 10. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| quick 模式信息不够 | 用户可能需要再跑 deep | 在摘要中提示"运行 --deep 获取完整分析" |
| 端类型检测误判 | 产物组合不准确 | 提供手动指定参数 `--端类型=X` |
| 置信度追踪增加复杂度 | 实现/维护成本 | 先在 deep 模式试点，稳定后再考虑 quick |

---

## 11. 深度优化建议

> 基于「端类型产物需求差异」文档和市场 Skill 最佳实践的深度分析，提出以下 7 个优化方向。

### 11.1 产物设计精简

**问题分析**：
- 后端+Admin 混合项目 16 个产物，用户认知负担过重
- Layer 0 与 quick 模式产物不一致（project-structure vs codebase-overview）
- 部分产物可合并，减少数量但不减少信息量

**优化建议**：

| 优化项 | 原产物 | 合并后产物 |
|--------|--------|------------|
| 依赖合并 | `external-deps.md` + `monitoring.md` | `dependencies.md` |
| 规范合并 | `development-guidelines.md` + `testing-strategy.md` | `dev-guide.md` |

**按需展开参数**：
```bash
/spec-first:first --with-call-graph    # 生成调用链
/spec-first:first --with-monitoring    # 生成监控配置
/spec-first:first --with-i18n          # 生成国际化配置
/spec-first:first --full               # 生成所有扩展产物
```

### 11.2 quick 模式产物定位

**问题分析**：
- quick 产物位置（`.claude/context/memory/`）与 deep 产物位置（`docs/first/`）不一致
- 产物命名不统一：project-structure vs codebase-overview
- deep 模式无法复用 quick 模式已生成的产物

**优化建议**：

```yaml
# 统一产物位置和命名
quick 模式产物：
  docs/first/
  ├── .quick-meta.yaml      # quick 模式标记
  ├── tech-stack.md
  ├── codebase-overview.md  # 统一命名
  └── quick-commands.md     # 统一命名

deep 模式复用：
  - 检测到 quick 产物 → 复用已有分析结果
  - 扩展产物而非重新生成
  - 产物头部标记来源：`generated_by: quick` / `generated_by: deep`
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

### 11.4 置信度追踪增强

**问题分析**：
- 当前仅"显示进度条"，未充分利用置信度信息
- 缺少中间结果输出机制
- 低置信度产物无特殊处理

**优化建议**：

```markdown
## 置信度报告（deep 模式产物头部）

> 置信度：▓▓▓▓░ (4/5) - 部分推断，建议验证

| 产物 | 置信度 | 说明 |
|------|--------|------|
| tech-stack.md | ▓▓▓▓▓ (5/5) | 基于配置文件检测 |
| architecture.md | ▓▓▓▓░ (4/5) | 部分推断，建议验证 |
| domain-model.md | ▓▓▓░░ (3/5) | ⚠️ 需要补充验证 |

**Caveats**：
- `domain-model.md` 中 3 个实体为推断，需确认
```

**新增功能**：
- 低置信度产物（<3）自动标记 `[需验证]`
- 用户打断时可获取中间结果（Level 2/4）
- 置信度汇总到 `.index.yaml`

### 11.5 交互式选项智能化

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

### 11.6 增量更新边界条件

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

### 11.7 会话恢复与产物索引

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
| **P0** | 产物设计精简（合并） | 2h | 高 - 减少认知负担 | Phase 1 |
| **P0** | quick 模式产物定位 | 1h | 高 - 用户体验 | Phase 1 |
| **P1** | 端类型复合检测 | 3h | 中 - 处理复杂项目 | Phase 2 |
| **P1** | 交互式选项智能化 | 2h | 中 - 减少用户决策 | Phase 2 |
| **P2** | 置信度追踪增强 | 3h | 中 - 质量可见性 | Phase 3 |
| **P2** | 增量更新边界条件 | 2h | 中 - 效率优化 | Phase 3 |
| **P2** | 会话恢复与产物索引 | 3h | 低 - 便利性 | Phase 3 |

**总工作量**：16h（约 2 天）

---

## 13. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.1.0 | 2026-03-02 | 新增「深度优化建议」章节（11-12），基于端类型需求差异和市场 Skill 最佳实践提出 7 个优化方向 |
| v1.0.3 | 2026-03-02 | 新增「实现状态分析」章节（9），对比当前代码与优化方案 |
| v1.0.2 | 2026-03-02 | 新增「首次运行 vs 增量更新」章节（4），定义增量更新流程和变更映射 |
| v1.0.1 | 2026-03-02 | 新增「检测失败处理」章节（2.4） |
| v1.0.0 | 2026-03-02 | 初始版本，基于调研设计优化方案 |
