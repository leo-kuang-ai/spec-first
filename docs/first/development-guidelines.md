---
mode: deep
last_updated: 2026-03-09
evidence_sources:
  - CLAUDE.md
  - eslint.config.js
  - .prettierrc
  - tsconfig.json
  - vitest.config.ts
  - package.json
  - git log (20 commits)
---

# 项目研发规范

> 本文档基于项目实际代码和配置自动生成（deep 模式），标注所有证据来源。

---

## 1. 代码风格

### 当前规范

**缩进与格式**：
- 缩进：2 空格（证据：`.prettierrc` → `"tabWidth": 2`）
- 行宽：100 字符（证据：`.prettierrc` → `"printWidth": 100`）
- 分号：必须使用（证据：`.prettierrc` → `"semi": true`）
- 引号：单引号（证据：`.prettierrc` → `"singleQuote": true`）
- 尾逗号：ES5 标准（证据：`.prettierrc` → `"trailingComma": "es5"`）
- 换行符：LF（证据：`.prettierrc` → `"endOfLine": "lf"`）

**命名约定**：
- 文件命名：kebab-case（证据：`CLAUDE.md` 第 199 行）
- 未使用变量：`_` 前缀标记（证据：`eslint.config.js` → `argsIgnorePattern: '^_'`）
- 变量/函数名：语义明确，避免缩写（证据：`CLAUDE.md` 第 251-253 行）

**TypeScript 规则**：
- 未使用变量：error 级别（证据：`eslint.config.js` 第 22 行 → `'error'`）
- 显式 any：warn 级别（证据：`eslint.config.js` 第 23 行 → `'warn'`）
- 空代码块：warn 级别，允许空 catch（证据：`eslint.config.js` 第 24 行）
- console：允许使用（证据：`eslint.config.js` 第 25 行 → `'off'`）

**模块系统**：
- ESM only：全项目使用 `"type": "module"`（证据：`package.json` 第 5 行）
- Named exports only：core 模块不使用 default export（证据：`CLAUDE.md` 第 198 行）
- verbatimModuleSyntax：启用（证据：`tsconfig.json` 第 18 行）

---

## 2. 提交规范

### 当前规范

**提交格式**（基于 git log 分析）：
```
<type>(<scope>): <subject>
```

**Type 类型**（证据：git log 最近 20 条提交）：
- `docs`: 文档变更（7 次）
- `feat`: 新功能（4 次）
- `fix`: Bug 修复（3 次）
- `chore`: 构建/发布相关（3 次）
- `refactor`: 重构（1 次）

**Scope 示例**（证据：git log）：
- `viewer`: 阶段查看器相关
- `gate`: 门禁引擎相关
- `skills`: Skill 系统相关
- `first`: First 文档生成相关
- `v2`: v2 版本相关
- `readme`: README 文档

**Subject 规范**：
- 使用中文描述（证据：git log 所有提交均为中文）
- 简洁明确，说明变更内容
- 不超过 50 字符（推荐）

**CHANGELOG 强制更新**：
- 任何源码变更必须同步更新 `CHANGELOG.md`（证据：`CLAUDE.md` 第 60 行）
- 格式：`- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要`
- 用户可见变更追加 `(user-visible)`

---

## 3. 测试要求

### 当前规范

**测试框架**：
- 框架：Vitest（证据：`package.json` 第 66 行）
- 全局模式：启用（证据：`vitest.config.ts` 第 5 行 → `globals: true`）
- 覆盖率工具：v8（证据：`vitest.config.ts` 第 8 行）

**覆盖率阈值**（证据：`vitest.config.ts` 第 11-16 行）：
- lines: 75%
- functions: 75%
- statements: 75%
- branches: 65%

**测试结构**（证据：`CLAUDE.md` 第 207-212 行）：
- `tests/unit/` — 单元测试
- `tests/integration/` — 集成测试
- `tests/e2e/` — 端到端测试
- `tests/benchmark/` — 性能基准测试
- `tests/fixtures/` — 测试固件数据

**测试命令**（证据：`package.json` 第 12-14 行）：
```bash
npm test                # 全量测试
npm run test:watch      # watch 模式
npm run test:coverage   # 覆盖率报告
```

---

## 4. 文档规范

### 当前规范

**注释规范**（证据：`CLAUDE.md` 第 246-249 行）：
- 复杂逻辑必须添加注释
- 注释说明"为什么"而非"是什么"
- 规范引用：注释中标注对应规范位置

**输出语言**（证据：`CLAUDE.md` 第 240-242 行）：
- 默认中文：除非明确要求英文
- 技术术语：保持英文原文（如 API、Spec-First）
- 代码注释：根据项目约定（待定）

**文档更新**：
- 规范文档同步提交：每次代码提交需将 `CLAUDE.md` 纳入提交（证据：`CLAUDE.md` 第 63 行）

---

## 5. 错误处理

### 当前规范

**错误处理原则**（证据：`CLAUDE.md` 第 256-259 行）：
- 关键路径必须有错误处理
- 错误信息需包含规范引用
- 提供明确的错误恢复建议

**空 catch 块**：
- 允许空 catch 块（证据：`eslint.config.js` 第 24 行 → `allowEmptyCatch: true`）

---

## 6. 依赖管理

### 当前规范

**包管理器**：
- 主要：pnpm（证据：`pnpm-lock.yaml` 存在）
- 备选：npm（证据：`package.json` scripts 使用 npm）

**Node.js 版本**：
- 最低版本：20.0.0（证据：`package.json` 第 28-29 行 → `"engines": {"node": ">=20.0.0"}`）

**依赖覆盖**（证据：`package.json` 第 73-78 行）：
```json
"pnpm": {
  "overrides": {
    "rollup": "^4.59.0",
    "minimatch": "^3.1.3",
    "esbuild": "^0.27.3"
  }
}
```

**Lock 文件策略**：
- 使用 `pnpm-lock.yaml` 锁定版本
- 提交到版本控制

---

## 7. TypeScript 配置

### 当前规范

**编译目标**（证据：`tsconfig.json`）：
- target: ES2022（第 3 行）
- module: ESNext（第 4 行）
- moduleResolution: bundler（第 5 行）
- lib: ES2022（第 6 行）

**严格模式**：
- strict: true（第 9 行）
- isolatedModules: true（第 17 行）
- verbatimModuleSyntax: true（第 18 行）
- forceConsistentCasingInFileNames: true（第 12 行）

**类型定义**：
- declaration: true（第 14 行）
- declarationMap: true（第 15 行）
- sourceMap: true（第 16 行）

---

## 8. 构建与发布

### 当前规范

**构建工具**：
- 打包器：tsup（证据：`package.json` 第 10 行，`CLAUDE.md` 第 127 行）
- 类型检查：tsc --noEmit（证据：`package.json` 第 11 行）

**发布配置**（证据：`package.json` 第 51-53 行）：
```json
"publishConfig": {
  "access": "public"
}
```

**生命周期钩子**（证据：`package.json` 第 22-24 行）：
- prepublishOnly: 发布前自动构建
- postinstall: 安装后执行 postinstall.js
- preuninstall: 卸载前执行 preuninstall.js

---

## 9. 核心开发原则

### Spec-First 约束（证据：`CLAUDE.md` 第 49-54 行）

1. **规范先行**：任何功能开发前，必须先定义或引用对应规范
2. **规范校验**：代码提交前，必须通过自动化规范校验
3. **规范追溯**：每个实现必须能追溯到对应的规范定义
4. **规范演进**：规范变更必须有版本管理和影响分析

### 工作流原则（证据：`CLAUDE.md` 第 28-35 行）

- **简洁至上**：KISS 原则，避免过度工程化
- **追根溯源**：找到根因，不做临时补丁
- **最小影响**：变更只触及必要范围
- **事实为本**：以事实为最高准则
- **主动挑战**：发现问题时直接指出并提供依据
- **规范驱动**：所有开发活动基于明确的规范定义

### 强制工作流（证据：`CLAUDE.md` 第 37-47 行）

1. **构思方案** → 明确需求和实现思路
2. **请求审核** → 确认方案可行性
3. **拆解任务** → 分解为具体执行步骤
4. **逐项实现** → 按任务清单执行并自检

**不得"带假设开工"**，所有疑点必须在前期调研中厘清。

---

## 10. 代码变动铁律

### 强制自检（证据：`CLAUDE.md` 第 58-59 行）

任何对项目源码的新增/删除/修改，完成后必须进行强制自检，确保实现与需求完全对齐。

### 规范对齐检查（证据：`CLAUDE.md` 第 60 行）

代码变动必须与对应规范定义一致，不得出现"代码与规范不符"的情况。

### CHANGELOG 强制更新（证据：`CLAUDE.md` 第 61-63 行）

任何对项目源码的新增/删除/修改，必须同步在项目根目录 `CHANGELOG.md` 中添加一条记录，无此记录的代码变动一律拒绝生成。

---

## 附录：证据来源清单

| 规范模块 | 主要证据文件 | 检测方式 |
|---------|------------|---------|
| 代码风格 | `.prettierrc`, `eslint.config.js`, `CLAUDE.md` | 配置文件分析 |
| 提交规范 | git log, `CLAUDE.md` | 提交历史分析（20 条） |
| 测试要求 | `vitest.config.ts`, `package.json`, `CLAUDE.md` | 配置文件 + 目录结构 |
| 文档规范 | `CLAUDE.md` | 规范文档提取 |
| 错误处理 | `eslint.config.js`, `CLAUDE.md` | 配置 + 规范文档 |
| 依赖管理 | `package.json`, `pnpm-lock.yaml` | 配置文件分析 |
| TypeScript | `tsconfig.json` | 配置文件分析 |
| 构建发布 | `package.json`, `tsup.config.ts` | 配置文件分析 |
| 核心原则 | `CLAUDE.md` | 规范文档提取 |
| 变动铁律 | `CLAUDE.md` | 规范文档提取 |

---

**文档生成信息**：
- 生成时间：2026-03-09
- 生成模式：deep（配置分析 + 代码采样）
- Agent：C2
- 证据标注：完整标注所有证据来源
