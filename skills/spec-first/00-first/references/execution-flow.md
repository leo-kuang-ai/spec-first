# 执行流程详解

> 本文档描述 first skill 的详细执行流程（P0-P3）。
> 主文件 SKILL.md 仅包含核心编排，详细执行逻辑见本文档。

---

## 执行阶段

### P0: 定位与校验

1. 检测项目根目录（存在以下任一文件即确认）：
   - `package.json`、`pom.xml`、`build.gradle`、`go.mod`、`Cargo.toml`
   - `composer.json`、`Gemfile`、`CMakeLists.txt`、`*.csproj`、`.git`

2. **Greenfield/Brownfield 判断**：

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

**端类型检测**：

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


---

### P3: Runtime 真源生成与汇总

**执行时机**：所有 Agent 完成后

**必须生成的 Runtime 真源**：

1. **`.spec-first/runtime/first/summary.json`**（必需）

   使用 TypeScript 类型定义生成，确保字段完整：

   ```typescript
   interface FirstRuntimeSummary {
     generatedAt: string;           // ISO 8601 时间戳
     mode: 'quick' | 'deep';
     project: {
       name: string;                // 从 package.json/pom.xml 等提取
       platformType?: string;       // 如 "cli-tool", "web-app", "backend-api"
       overview?: string;           // 项目简介
     };
     modules: string[];             // 核心模块列表（从 codebase-overview 提取）
     capabilities: string[];        // 核心能力列表（从 domain-model 提取）
     entryPoints: string[];         // 入口文件路径（从 codebase-overview 提取）
     dataModels: string[];          // 数据模型列表（从 domain-model 提取）
     apiSurface: string[];          // API 端点列表（从 api-docs 提取）
     risks: string[];               // 风险项（可选）
     evidence: string[];            // 证据源（可选）
   }
   ```

   **生成步骤**：
   - 从已生成的文档中提取信息
   - 所有数组字段必须初始化（至少为空数组 `[]`）
   - `project.name` 必须有值（从包管理文件提取或使用目录名）
   - 使用 `writeJson()` 写入，确保格式化

2. **`.spec-first/runtime/first/index.json`**（必需）

   索引文件，记录所有 runtime 资产的健康状态：

   ```typescript
   interface FirstRuntimeIndex {
     version: string;               // 固定 "2.1.0"
     lastRun: string;               // ISO 8601 时间戳
     mode: 'quick' | 'deep';
     summary: {
       path: string;                // ".spec-first/runtime/first/summary.json"
       fileHash: string;            // SHA-256 哈希
       lastUpdated: string;         // ISO 8601 时间戳
       healthy: boolean;            // true
     };
     roleViews: { /* 同上结构 */ };
     stageViews: { /* 同上结构 */ };
     docsProjection: {
       [docName: string]: {         // 如 "tech-stack.md"
         path: string;              // "docs/first/tech-stack.md"
         fileHash: string;
         lastUpdated: string;
         healthy: boolean;
       };
     };
     status: 'current';
   }
   ```

3. **`.spec-first/runtime/first/role-views.json`**（必需）

   **生成方式**：使用 `buildRoleViews(summary)` 函数生成，不得手动构造

   ```typescript
   // 从 summary 自动生成，确保结构一致
   const roleViews = buildRoleViews(summary);
   writeFirstRoleViews(projectRoot, roleViews);
   ```

   **结构要求**：
   - 顶层直接是 4 个角色：`product`、`dev`、`qa`、`architect`
   - 不得有 `generated_at`、`healthy`、`roles` 等包裹字段
   - 每个角色包含：`role`、`summary`、`focus`、`warnings`

4. **`.spec-first/runtime/first/stage-views.json`**（必需）

   **生成方式**：使用 `buildStageViews(summary)` 函数生成，不得手动构造

   ```typescript
   // 从 summary 自动生成，确保结构一致
   const stageViews = buildStageViews(summary);
   writeFirstStageViews(projectRoot, stageViews);
   ```

   **结构要求**：
   - 顶层直接是 4 个阶段：`spec`、`design`、`code`、`verify`
   - 不得有 `generated_at`、`healthy`、`stages` 等包裹字段
   - 每个阶段包含特定字段（见 TypeScript 类型定义）

**关键约束**：
- 所有 JSON 文件必须符合 TypeScript 类型定义
- 数组字段不得为 `undefined`，必须至少为 `[]`
- 对象字段如 `project` 不得为 `undefined`
- 使用 `buildFirstSummary()` 函数生成 summary（如果在代码中调用）

**验证步骤**：
- 生成后读取 JSON 文件验证可解析
- 检查必需字段是否存在
- 输出生成的 runtime 资产路径

