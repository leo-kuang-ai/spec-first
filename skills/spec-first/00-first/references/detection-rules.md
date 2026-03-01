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

## 多端技术栈检测

| 端 | 检测特征 |
|----|----------|
| PC（桌面） | Electron (`electron` in package.json)、Tauri (`tauri.conf.json`)、Qt (`*.pro` / CMakeLists + Qt) |
| Android | `AndroidManifest.xml`、`build.gradle` + `com.android` |
| iOS | `*.xcodeproj`、`*.xcworkspace`、`Podfile`、`Package.swift` |
| H5（移动Web） | Vant/NutUI/Mint UI 等移动端 UI 库 |
| Admin（后台） | Ant Design Pro / Element Plus / Arco Design 等后台框架 |
| 跨平台 | Flutter (`pubspec.yaml`)、React Native (`react-native`)、UniApp (`manifest.json` + `uni`)、KMP (`kotlin("multiplatform")` in build.gradle.kts) |

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
