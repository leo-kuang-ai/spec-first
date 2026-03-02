# 检测规则库

> 供 P1a（技术栈识别）和 P1b（Context7 映射）阶段使用。

## 12 种语言检测

| 语言 | 检测文件 |
|------|----------|
| Java | `pom.xml`、`build.gradle`、`build.gradle.kts` |
| Kotlin | `build.gradle.kts` + `kotlin("jvm")` / `kotlin("multiplatform")`、`*.kt` 源文件 |
| Python | `requirements.txt`、`pyproject.toml`、`setup.py`、`Pipfile` |
| Go | `go.mod`、`go.sum` |
| PHP | `composer.json`、`artisan` |
| JavaScript/Node.js | `package.json`、`tsconfig.json`、`yarn.lock`、`pnpm-lock.yaml` |
| C/C++ | `CMakeLists.txt`、`Makefile`、`*.vcxproj`、`conanfile.txt` |
| .NET/C# | `*.csproj`、`*.sln`、`appsettings.json` |
| Ruby | `Gemfile`、`Rakefile`、`*.gemspec` |
| Rust | `Cargo.toml` |
| Swift | `Package.swift`、`*.xcodeproj` + `*.swift` 源文件 |
| Dart | `pubspec.yaml`、`analysis_options.yaml` |

## 20 种框架检测

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
| Next.js | `next` in package.json、`next.config.*` |
| Nuxt.js | `nuxt` in package.json、`nuxt.config.*` |
| SvelteKit | `@sveltejs/kit` in package.json |
| Remix | `@remix-run/node` in package.json |
| Astro | `astro` in package.json、`astro.config.*` |
| Hono | `hono` in package.json / Cargo.toml |

## 端类型检测规则（7 种主类型）

> **Phase 2 新增**：用于智能调整产物组合和 Agent 派发策略。
> **检测优先级**：Monorepo → 混合 → backend → frontend → mobile → cross-platform → desktop
> **降级策略**：详见文末「端类型检测失败处理」

### 1. 后台服务（backend）

**检测特征**（满足任一即可）：

| 特征 | 说明 |
|------|------|
| `pom.xml` | Java/Maven 项目 |
| `build.gradle` / `build.gradle.kts` | Java/Kotlin Gradle 项目 |
| `go.mod` | Go 项目 |
| `requirements.txt` / `pyproject.toml` / `setup.py` | Python 项目 |
| `Cargo.toml` | Rust 项目（排除 tauri.conf.json 同时存在） |
| `composer.json` | PHP 项目 |
| `Gemfile` | Ruby 项目 |

**排除条件**（存在以下特征时归类为其他类型）：
- 同时存在 `package.json` + 前端 UI 库 → 混合或 frontend
- 检测到移动端项目文件 → mobile

**产物特征**：
- 无 `package.json` 或 `package.json` 不含前端框架
- 无移动端项目文件（AndroidManifest.xml、*.xcodeproj 等）

---

### 2. 前端 Web（frontend）

**检测特征**（满足任一即可）：

| 特征 | 说明 |
|------|------|
| `package.json` + React/Vue/Angular/Svelte | 主流前端框架 |
| `index.html` + `src/` 目录 | 典型前端项目结构 |
| `webpack.config.js` / `vite.config.js` / `rollup.config.js` | 前端构建工具 |

**子类型**：

| 子类型 | 检测特征 |
|--------|----------|
| **Admin（后台管理）** | `antd` / `ant-design` / `element-plus` / `arco-design` / `@alifd/next` in package.json |
| **H5（移动 Web）** | `vant` / `nutui` / `mint-ui` / `vux` in package.json，或 viewport/rem/媒体查询代码 |
| **通用前端** | 无上述特征 |

---

### 3. 移动端 App（mobile）

**检测特征**（满足任一即可）：

| 子类型 | 检测特征 |
|--------|----------|
| **iOS** | `*.xcodeproj`、`*.xcworkspace`、`Podfile`、`Package.swift` + iOS target |
| **Android** | `AndroidManifest.xml`、`build.gradle` + `com.android.application` |

**跨平台移动端**归类到「cross-platform」。

---

### 4. 跨平台（cross-platform）

**检测特征**（满足任一即可）：

| 框架 | 检测特征 |
|------|----------|
| **Flutter** | `pubspec.yaml` + `flutter` |
| **React Native** | `package.json` + `react-native` |
| **UniApp** | `manifest.json` + `uni` 关键字 |
| **KMP** | `build.gradle.kts` + `kotlin("multiplatform")` |
| **Electron** | `package.json` + `electron` |
| **Tauri** | `tauri.conf.json` 或 `Cargo.toml` + `tauri` |

**说明**：Electron/Tauri 可同时归类为「桌面」，按产物策略统一处理。

---

### 5. PC 桌面（desktop）

**检测特征**（满足任一即可）：

| 子类型 | 检测特征 |
|--------|----------|
| **Windows** | `*.csproj` / `*.sln` + WinAPI 引用，或 CMakeLists.txt + Windows 特定代码 |
| **macOS** | `*.xcodeproj` + macOS target，`Package.swift` + macOS |
| **Linux** | CMakeLists.txt / Makefile + GTK/Qt/SDL |
| **跨平台桌面** | Electron / Tauri（见 cross-platform） |

---

### 6. Monorepo

**检测特征**（满足任一即可）：

| 特征 | 说明 |
|------|------|
| `turbo.json` | Turborepo |
| `nx.json` | Nx |
| `lerna.json` | Lerna |
| `pnpm-workspace.yaml` | pnpm workspace |
| `package.json` + `workspaces` 字段 | Yarn/npm workspace |
| 多个 `package.json` 在不同子目录 | 手动检测 |

**复合处理**：
- 检测为 Monorepo 后，进一步分析各子包的端类型
- 产物策略：根级产物 + 子包产物（可选）

---

### 7. 混合（backend + frontend）

**检测特征**：

| 特征 | 说明 |
|------|------|
| 同时检测到后端特征 + 前端特征 | 如 Spring Boot + Vue，Django + React |
| 目录分离 | `backend/` + `frontend/`、`server/` + `client/`、`api/` + `web/` |

**产物策略**：
- 按完整后端 + 前端生成产物
- 或根据主导类型选择产物集

---

## 端类型检测算法

```
1. 检查 Monorepo 特征 → 是 → 返回 'monorepo'
2. 检查混合特征（backend + frontend 同时存在） → 是 → 返回 'mixed'
3. 检查 backend 特征 → 是 → 返回 'backend'
4. 检查 frontend 特征 → 是 → 返回 'frontend'（带子类型）
5. 检查 mobile 特征 → 是 → 返回 'mobile'（带子类型）
6. 检查 cross-platform 特征 → 是 → 返回 'cross-platform'
7. 检查 desktop 特征 → 是 → 返回 'desktop'
8. 无匹配 → 返回 'unknown' → 触发降级策略
```

---

## 端类型检测失败处理

当端类型检测无法匹配任何已知类型时：

```yaml
降级策略:
  未知技术栈 → 使用"通用模式"产物集（4-5 个基础产物）
  空项目     → 提示"检测到空项目，建议先初始化项目后再运行"
  多端混合   → 自动归类为 Monorepo 或 Mixed

用户提示:
  "⚠️ 无法自动识别项目类型，使用通用模式继续"
  "可用 --type=<backend|frontend|mobile|cross-platform|desktop|monorepo> 手动指定"
```

**通用模式产物集**（3+2 条件产物）：
- `tech-stack.md`
- `codebase-overview.md`
- `domain-model.md`
- `api-docs.md`（如有 API）
- `database-er.md`（如有 DB）

---

## 复合类型检测优化（Phase 3）

> **目标**：处理复杂项目的多类型叠加场景，提供更精细的产物策略。

### Monorepo 子类型识别

**检测逻辑**：

1. 检测到 Monorepo 特征后，进一步分析子包类型
2. 遍历 `packages/` 或各子目录，识别每个子包的端类型
3. 统计子包类型分布，确定主导类型

**产物策略**：

```yaml
Monorepo 产物策略:
  根级产物:
    - tech-stack.md (整体技术栈 + Monorepo 工具)
    - README.md (子包导航)

  子包产物:
    按各子包端类型生成对应产物

  示例结构:
    docs/first/
    ├── tech-stack.md       # 根级
    ├── README.md            # 索引
    ├── backend/            # backend 子包产物
    │   ├── codebase-overview.md
    │   ├── domain-model.md
    │   └── ...
    ├── admin/              # frontend(Admin) 子包产物
    │   ├── codebase-overview.md
    │   └── ...
    └── mobile/             # mobile 子包产物
        ├── codebase-overview.md
        └── ...
```

### 复合检测结果格式

```
检测结果:
  主类型: Monorepo
  子类型:
    - backend (packages/api)
    - frontend:Admin (packages/admin)
    - frontend:H5 (packages/mobile-web)
    - mobile (packages/app)

产物策略:
  根级: 2 个产物
  子包: 按类型生成（backend 5 个、Admin 4 个、H5 4 个、mobile 4 个）
```

### Flutter Web 混合

**检测特征**：
- `pubspec.yaml` + `flutter`
- 同时存在 Web 相关代码（`web/` 目录或 `flutter build web` 配置）

**产物策略**：
- 主类型：cross-platform（Flutter）
- 子类型：frontend:H5
- 产物组合：Flutter 移动端产物 + Web 适配说明

### Nx/Turborepo 包级策略

| 工具 | 配置文件 | 子包识别 |
|------|----------|----------|
| **Nx** | `nx.json` | `projects.*.targets` |
| **Turborepo** | `turbo.json` | `packages` 目录 |
| **Lerna** | `lerna.json` | `packages/*` |
| **pnpm** | `pnpm-workspace.yaml` | `packages/*` |

**智能过滤**：
- 跳过 `@types/*`、`@typescript/*` 等类型定义包
- 跳过 `*-config`、`*-shared` 等配置包
- 聚焦包含实际代码的包

---

## Context7 映射表

> 完成后传递给 Agent C2，用于 development-guidelines.md 最佳实践对比。

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

**查询策略**（P1b 主线程执行）：

| 策略 | 说明 |
|------|------|
| **分批查询** | 先查 2-3 个核心库，如有剩余时间再查询次要库 |
| **缓存复用** | 如 Context7 结果已缓存，跳过网络查询直接使用 |
| **超时控制** | 单个库查询超时 10s，总超时 30s，超时后使用已获取结果 |

**查询优先级**（按依赖重要性排序）：
1. 核心框架（如 `react`、`django`、`spring-boot-starter`）
2. 代码风格工具（如 `eslint`、`prettier`）
3. 测试框架（如 `vitest`、`jest`）
4. 其他工具库

注意：
- 表中库 ID 为参考值，运行时须通过 `resolve-library-id` 动态确认实际 ID
- 最多查询 5 个核心库（按依赖重要性排序），单个超时 10 秒，总超时 30 秒

## Context7 密钥治理（安全要求）

P1b 调用 Context7 时，必须遵循以下规则：

1. **唯一来源**：仅从运行时环境变量读取（推荐 `CONTEXT7_API_KEY`），禁止硬编码到技能文件
2. **不落盘**：密钥禁止写入 `docs/first/*`、日志、缓存文件、错误栈
3. **日志脱敏**：如需诊断，只允许输出掩码值（例如 `ctx7_****abcd`）
4. **失败降级**：密钥缺失/失效时，P1b 回退到本地规则分析，并标记 `[Context7 不可用，仅本地配置]`
5. **最小权限**：仅允许 P1b 主线程持有密钥，子 Agent 接收已处理结果，不直接接触密钥
