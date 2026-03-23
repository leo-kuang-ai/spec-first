# 检测规则库

> **当前正式 contract**：单一标准模式 runtime-first。
> 本文档定义项目识别输出规范，为 `summary.json` 与 `steering.json` 提供主类型、子类型、混合边界与失败降级语义。
> 相关查询与密钥治理不属于本文档范围，统一由运行时与安全契约处理。

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

规则补充：
- 多个子类型同时成立时，优先保留对当前主交付影响最大的一个主子类型
- 若无法判断主次，不得强行合并为单一结论，保留 `unknown` 或在 `steering.json.tech.constraints` 标记“子类型待确认”
- 子类型识别失败时，保持空或 `unknown`，不要为了填值而降级为错误类型

判定顺序：
1. 先判定是否存在明确 CLI 入口；存在时优先标记 `cli-tool`
2. 再判定前端场景子类型；仅当主类型已是 `frontend` 或 `cross-platform` 时才使用 `admin` / `h5`
3. 再判定是否仅暴露库构建且缺少明确运行入口；满足时标记 `library`
4. 最后判定 `service` / `desktop-shell` 等运行形态
5. 若多个规则同时命中且无法确定主次，保留 `unknown` 并记录冲突证据

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
