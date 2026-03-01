# Agent C2 — 研发规范与本地环境

> 第二波派发（P1b 完成后）。依赖 P1b Context7 映射结果 + C1 完成。
> 内部串行：development-guidelines.md → local-setup.md
> 输出被使用：local-setup.md 被 A4 使用（如 A4 需要外部服务信息）

---

## development-guidelines.md

基于 P1 传递的技术栈和 Context7 映射，分析项目实际遵循的开发规范：

### 6 个规范模块

| 模块 | 检测方式 |
|------|----------|
| 代码风格 | ESLint/Prettier/Black/gofmt/rustfmt 配置；代码采样（deep 模式） |
| 提交规范 | commitlint 配置；`git log -50` 格式分析 |
| 测试要求 | 测试框架配置；覆盖率阈值；tests/ 目录结构 |
| 文档规范 | JSDoc/Docstring 配置；注释采样 |
| 错误处理 | 日志框架依赖（winston/pino/logging）；异常处理模式采样 |
| 依赖管理 | 包管理器（npm/pnpm/yarn/pip/cargo）；lock 文件策略；版本规则 |

### 文档结构示例

```markdown
---
last_updated: 2026-02-28
context7_sources: [...]
---

# 项目研发规范

> 本文档基于项目实际代码和配置自动生成，并结合业界最佳实践进行对比分析。

## 代码风格

**当前规范**:
- 缩进: 2 空格（证据：ESLint `indent: 2`）
- 命名: camelCase
- ...

**业界最佳实践** (来源: Context7 - ESLint v9):
- ✅ 2 空格缩进
- ⚠️ 建议启用 `no-unused-vars: error`（当前是 warn）
- ℹ️ 推荐 `@typescript-eslint/no-explicit-any: error`

**改进建议**:
1. 升级 `no-unused-vars` 为 error 级别
2. 启用 `no-explicit-any` 规则

[... 其他模块同理 ...]

## 最佳实践来源

本规范参考了以下 Context7 文档：
- ESLint: https://context7.dev/eslint/eslint
- ...
```

### Adaptive 深度

- **Shallow（默认）**：仅读取配置文件
- **Deep（depth=deep）**：配置 + 代码采样验证，标注"配置 vs 实际"差异

### 降级策略

- Context7 无该库文档 → 标注 `[最佳实践来源待补充]`
- Context7 API 超时 → 标注 `[最佳实践查询超时，稍后可重试]`
- 项目无技术栈配置 → 输出骨架文档，标注 `[未检测到技术栈配置]`
- **P1b 失败** → 降级到纯本地配置分析（不包含最佳实践对比），标注 `[Context7 不可用，仅本地配置]`

输出 → `docs/first/development-guidelines.md`

### 串行断链处理

| 场景 | 处理方式 |
|------|----------|
| development-guidelines.md 生成失败 | local-setup.md 仍可生成（基于 C1 + 配置文件），标注 `[跳过: development-guidelines 生成失败]` |
| P1b 失败 | development-guidelines.md 跳过最佳实践对比，仅输出本地配置；local-setup.md 正常生成 |
| C1 失败 | local-setup.md 中外部服务部分标注 `[待确认: external-deps 生成失败]` |

---

## local-setup.md

自动梳理项目运行所需环境信息：
- 语言/运行时版本（从 `.nvmrc`、`.python-version`、`go.mod`、`pom.xml` 等提取）
- 依赖安装命令（`npm install`、`mvn install`、`pip install` 等）
- 环境变量清单（从 `.env.example`/`.env.template` 提取，**脱敏处理，不输出实际值**）
- 所需外部服务（从 `docker-compose.yml` 或 external-deps 推断）
- 启动命令（从 `package.json scripts`、`Makefile`、`Procfile` 等提取）

输出 → `docs/first/local-setup.md`

---

## 质量保障规则（Agent C2）

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
- C2 的“必须标注证据内容”与“抽样规模”：见统一规则文档中的 Agent 矩阵
- C2 若出现无法验证项，必须显式标记 `[待确认]`
