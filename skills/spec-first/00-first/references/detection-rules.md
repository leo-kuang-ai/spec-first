# 检测规则库

> **当前正式 contract**：单一标准模式 runtime-first。
> 本文档定义项目识别输出规范，为 `summary.json` 与 `steering.json` 提供主类型、子类型、混合边界与失败降级语义。

## 1. 识别目标

必须输出：
- 主类型：`backend` / `frontend` / `mobile` / `cross-platform` / `desktop` / `monorepo` / `mixed`
- 子类型：如 `admin` / `h5` / `cli-tool` / `library`
- 证据来源：文件、依赖、目录、脚本、配置
- 失败降级结论：为何无法更精细识别

约束：
- 端类型识别只影响 `summary.json.project.platformType`、`steering.json` 与文档内容侧重点
- 不得因为识别结果不同而裁剪正式 docs contract
- 未识别时仍保留标准模式正式产物集

## 2. 证据优先级

从高到低：
1. 项目配置与 manifest：`package.json`、`pom.xml`、`Cargo.toml`、`pubspec.yaml`
2. 框架配置：`next.config.*`、`nuxt.config.*`、`tauri.conf.json`
3. 目录结构：`src/`、`app/`、`packages/`、`apps/`
4. 依赖声明：框架、UI 库、SDK、平台桥接包
5. 脚本与命令：`dev`、`build`、`start`、`android`、`ios`

## 3. 主类型识别

### backend

常见证据：
- `pom.xml` / `build.gradle*`
- `go.mod`
- `requirements.txt` / `pyproject.toml`
- `Cargo.toml`
- `composer.json`
- `Gemfile`

### frontend

常见证据：
- `package.json` + React / Vue / Angular / Svelte / Next / Nuxt
- `index.html` + `src/`
- `vite.config.*` / `webpack.config.*`

### mobile

常见证据：
- `AndroidManifest.xml`
- `*.xcodeproj` / `*.xcworkspace`
- 原生 Android / iOS 工程结构

### cross-platform

常见证据：
- Flutter：`pubspec.yaml` + `flutter`
- React Native：`package.json` + `react-native`
- Tauri：`tauri.conf.json`
- Electron：`package.json` + `electron`
- Kotlin Multiplatform：`kotlin("multiplatform")`

### desktop

常见证据：
- 平台原生 UI / 系统 API 依赖
- 非 Web、非 Mobile 的桌面启动链路

### monorepo

常见证据：
- `turbo.json`
- `nx.json`
- `lerna.json`
- `pnpm-workspace.yaml`
- `package.json.workspaces`
- 明显的 `packages/` / `apps/` 多包结构

### mixed

常见证据：
- 后端与前端特征同时成立
- `backend/ + frontend/`、`server/ + client/`、`api/ + web/`

## 4. 子类型识别

可选子类型：
- `admin`
- `h5`
- `cli-tool`
- `library`
- `service`
- `desktop-shell`

示例规则：
- `package.json.bin` 存在且主入口为 CLI 时，可标记 `cli-tool`
- 仅暴露库构建、无明显运行入口时，可标记 `library`
- 前端依赖含 `antd` / `element-plus` / `arco-design` 时，可标记 `admin`
- 前端依赖含 `vant` / `nutui` 等移动 Web UI 时，可标记 `h5`

## 5. 混合与多端边界

### mixed

适用于：
- 单仓中同时存在后端和前端，但不采用明确 monorepo 工具
- 需要在 `summary.json` 中表达为组合型平台

### monorepo

适用于：
- 有明确 workspace / 多包工具
- 根级需要统一描述，子包只影响内容侧重点，不新增旁路 docs 目录结构

约束：
- 不产出 `docs/first/backend/*` 这类子目录旁路产物
- 最终仍收口到标准 `docs/first/*` 与 runtime truth

## 6. 识别失败降级

当无法匹配任何已知类型时：
- `summary.json.project.platformType` 使用 `unknown` 或最小可信主类型
- `steering.json.tech.constraints` 记录“项目端类型待确认”
- 下游专题文档继续按标准模式产出，但内容中显式标注 `[待确认]`

用户提示语义：
- “⚠️ 无法精确识别项目类型，已按标准模式继续，并记录待确认项”
- 不再提供 `--type` 手动指定入口；识别结果只作为 runtime 真源的一部分记录

## 7. Context7 映射

P1b 可基于识别结果选择最佳实践来源，优先查询：
- 核心框架
- 代码风格工具
- 测试框架

约束：
- 识别与 Context7 查询解耦
- Context7 不可用时，仍保留本地识别结果

## 8. Context7 密钥治理（安全要求）

- 唯一来源：仅从运行时环境变量读取（推荐 `CONTEXT7_API_KEY`）
- 不落盘：密钥禁止写入 `docs/first/*`、日志、缓存文件、错误栈
- 日志脱敏：如需诊断，只允许输出掩码值
- 失败降级：密钥缺失/失效时，回退到本地规则分析
- 最小权限：仅允许主线程持有密钥，子 Agent 只接收已处理结果

## 9. 安全约束

- 不得把密钥、连接串、令牌写入识别结果
- 不得因为外部工具失败而伪造识别结论
- 不得把 docs 输出当成识别真源
