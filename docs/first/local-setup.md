---
mode: deep
---

# 本地环境搭建指南

> 文档版本: 1.0.0 | 最后更新: 2026-03-16
> 适用于: spec-first v1.1.0

本文档提供 spec-first 项目的本地开发环境搭建指南，包含完整的安装步骤、配置说明和常见问题解决方案。

---

## 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [详细安装步骤](#详细安装步骤)
- [配置文件说明](#配置文件说明)
- [开发工作流](#开发工作流)
- [常见问题与解决方案](#常见问题与解决方案)
- [验证安装](#验证安装)

---

## 环境要求

### 运行时环境

| 依赖 | 最低版本 | 推荐版本 | 来源 |
|------|---------|---------|------|
| **Node.js** | >= 20.0.0 | 20.x LTS | [package.json#L27-L29](../../package.json#L27-L29) |
| **pnpm** | >= 8.0.0 | 8.x | 开发环境推荐 |
| **npm** | >= 9.0.0 | 9.x | 用户安装使用 |
| **Git** | >= 2.0.0 | 最新版本 | 版本控制 |

### 系统兼容性

- **macOS**: 10.15+ (Catalina 及以上)
- **Linux**: Ubuntu 18.04+, Debian 10+, CentOS 8+
- **Windows**: Windows 10+ (推荐使用 WSL2)

### 验证环境

```bash
# 检查 Node.js 版本
node --version  # 应输出 v20.x.x 或更高

# 检查 pnpm 版本
pnpm --version  # 应输出 8.x.x 或更高

# 检查 Git 版本
git --version   # 应输出 git version 2.x.x
```

---

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/sunrain520/spec-first.git
cd spec-first

# 2. 安装依赖
pnpm install

# 3. 构建项目
npm run build

# 4. 运行测试
npm test

# 5. 验证安装
npm run typecheck
```

---

## 详细安装步骤

### 步骤 1: 克隆仓库

```bash
# HTTPS 方式（推荐）
git clone https://github.com/sunrain520/spec-first.git
cd spec-first

# 或 SSH 方式（需配置 SSH Key）
git clone git@github.com:sunrain520/spec-first.git
cd spec-first

# 或 Gitee 镜像（国内用户）
git clone https://gitee.com/sunnyrain/spec-first.git
cd spec-first
```

**来源**: [package.json#L47-L50](../../package.json#L47-L50)

### 步骤 2: 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

**关键依赖**（来源: [package.json](../../package.json)）:

**生产依赖**:
- `handlebars@^4.7.8` - 模板引擎
- `js-yaml@^4.1.0` - YAML 解析
- `semver@^7.7.4` - 版本管理
- `update-notifier@^7.0.0` - 更新通知

**开发依赖**:
- `typescript@^5.4.0` - TypeScript 编译器
- `tsup@^8.5.1` - 打包工具
- `vitest@^1.6.1` - 测试框架
- `eslint@^10.0.2` - 代码检查
- `prettier@^3.8.1` - 代码格式化

**pnpm overrides**（来源: [package.json#L91-L97](../../package.json#L91-L97)）:
```json
{
  "rollup": "^4.59.0",
  "minimatch": "^3.1.3",
  "esbuild": "^0.27.3"
}
```

### 步骤 3: 构建项目

```bash
# 执行构建（tsup 打包）
npm run build
```

**构建输出**:
- 输出目录: `dist/`（来源: [tsconfig.json#L7](../../tsconfig.json#L7)）
- 入口文件: `dist/cli/index.js`
- 类型声明: `dist/**/*.d.ts`

**构建配置**（来源: [package.json#L10](../../package.json#L10)）:
- 使用 tsup 作为打包工具
- 生成 ESM 模块（`"type": "module"`）

### 步骤 4: 类型检查

```bash
# TypeScript 类型检查
npm run typecheck
```

**TypeScript 配置要点**（来源: [tsconfig.json](../../tsconfig.json)）:
- **Target**: ES2022
- **Module**: ESNext
- **Module Resolution**: bundler
- **Strict Mode**: 启用
- **verbatimModuleSyntax**: 启用（来源: [tsconfig.json#L18](../../tsconfig.json#L18)）
- **Source Root**: `./src`（来源: [tsconfig.json#L8](../../tsconfig.json#L8)）
- **Output Dir**: `./dist`（来源: [tsconfig.json#L7](../../tsconfig.json#L7)）

### 步骤 5: 运行测试

```bash
# 运行所有测试
npm test

# 监听模式（开发时推荐）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 运行单个测试文件
npx vitest run tests/unit/<file>.test.ts

# 按名称匹配测试
npx vitest run -t "pattern"
```

**测试配置**（来源: [vitest.config.ts](../../vitest.config.ts)）:
- **测试框架**: Vitest
- **Globals**: 启用（来源: [vitest.config.ts#L5](../../vitest.config.ts#L5)）
- **测试路径**: `tests/**/*.test.ts`（来源: [vitest.config.ts#L6](../../vitest.config.ts#L6)）
- **覆盖率工具**: v8（来源: [vitest.config.ts#L8](../../vitest.config.ts#L8)）
- **覆盖率阈值**（来源: [vitest.config.ts#L11-L16](../../vitest.config.ts#L11-L16)）:
  - Lines: 75%
  - Functions: 75%
  - Branches: 65%
  - Statements: 75%

### 步骤 6: 代码质量检查

```bash
# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint:fix

# Prettier 格式化
npm run format
```

**ESLint 配置要点**（来源: [eslint.config.js](../../eslint.config.js)）:
- 基于 `@eslint/js` 和 `typescript-eslint`
- 未使用变量规则: `argsIgnorePattern: '^_'`（来源: [eslint.config.js#L22](../../eslint.config.js#L22)）
- 忽略目录: `dist/`, `node_modules/`, `coverage/`, `packages/`（来源: [eslint.config.js#L8-L18](../../eslint.config.js#L8-L18)）

**Prettier 配置**（来源: [.prettierrc](../../.prettierrc)）:
- Semi: `true`
- Single Quote: `true`
- Tab Width: `2`
- Trailing Comma: `es5`
- Print Width: `100`
- End of Line: `lf`

---

## 配置文件说明

### 核心配置文件

| 文件 | 用途 | 关键配置项 |
|------|------|-----------|
| `package.json` | 项目配置 | `engines.node>=20`, `type=module`, scripts |
| `tsconfig.json` | TypeScript 配置 | `strict=true`, `verbatimModuleSyntax`, target=ES2022 |
| `vitest.config.ts` | 测试配置 | 覆盖率阈值 75%/65%, v8 coverage |
| `eslint.config.js` | 代码检查 | typescript-eslint, 未使用变量规则 |
| `.prettierrc` | 代码格式化 | singleQuote, tabWidth=2, printWidth=100 |

### 项目结构

```
spec-first/
├── src/                    # 源代码
│   ├── cli/               # CLI 命令（27 个命令）
│   ├── core/              # 核心引擎（14 个模块）
│   └── shared/            # 共享类型与工具
├── tests/                  # 测试代码
│   ├── unit/              # 单元测试
│   ├── integration/       # 集成测试
│   ├── e2e/               # 端到端测试
│   └── fixtures/          # 测试固件
├── skills/                 # Skill 定义（20 个）
├── templates/              # Handlebars 模板
├── dist/                   # 构建输出（git ignored）
└── .spec-first/            # 项目级配置
```

### TypeScript 编译选项详解

来源: [tsconfig.json](../../tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",           // 编译目标
    "module": "ESNext",           // 模块系统
    "moduleResolution": "bundler", // 模块解析策略
    "lib": ["ES2022"],            // 运行时库
    "outDir": "./dist",           // 输出目录
    "rootDir": "./src",           // 源码根目录
    "strict": true,               // 严格模式
    "verbatimModuleSyntax": true, // 精确模块语法
    "declaration": true,          // 生成 .d.ts
    "declarationMap": true,       // 声明文件映射
    "sourceMap": true             // 生成 source map
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 开发工作流

### 日常开发流程

```bash
# 1. 拉取最新代码
git pull origin master

# 2. 安装/更新依赖
pnpm install

# 3. 启动监听模式
npm run test:watch  # 终端 1: 测试监听
npm run build       # 终端 2: 构建项目

# 4. 开发代码...

# 5. 代码质量检查
npm run lint
npm run typecheck
npm test

# 6. 提交代码
git add .
git commit -m "feat: your feature description"
```

### 完整验证流程

```bash
# 按顺序执行以下命令，确保所有检查通过
npm run lint          # 代码风格检查
npm run typecheck     # 类型检查
npm run build         # 构建验证
npm test              # 测试验证
npm run test:coverage # 覆盖率检查（确保 >= 75%）
```

---

## 常见问题与解决方案

### 问题 1: Node.js 版本不匹配

**症状**:
```
error: The engine "node" is incompatible with this module.
```

**解决方案**:
```bash
# 使用 nvm 切换 Node.js 版本
nvm install 20
nvm use 20

# 或使用 nvm 安装最新 LTS
nvm install --lts
nvm use --lts
```

### 问题 2: pnpm 安装失败

**症状**:
```
pnpm: command not found
```

**解决方案**:
```bash
# 全局安装 pnpm
npm install -g pnpm

# 或使用 corepack（Node.js 16.13+）
corepack enable
corepack prepare pnpm@latest --activate
```

### 问题 3: TypeScript 类型错误

**症状**:
```
error TS2307: Cannot find module 'xxx' or its corresponding type declarations.
```

**解决方案**:
```bash
# 清理并重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 重新构建
npm run build
```

### 问题 4: 测试覆盖率不足

**症状**:
```
Coverage threshold not met
```

**解决方案**:
```bash
# 查看详细覆盖率报告
npm run test:coverage

# 查看生成的覆盖率报告
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

**覆盖率要求**（来源: [vitest.config.ts#L11-L16](../../vitest.config.ts#L11-L16)）:
- Lines: >= 75%
- Functions: >= 75%
- Branches: >= 65%
- Statements: >= 75%

### 问题 5: ESLint 报错

**症状**:
```
@typescript-eslint/no-unused-vars: '_' is defined but never used
```

**解决方案**:
- 未使用的变量需要加 `_` 前缀（来源: [eslint.config.js#L22](../../eslint.config.js#L22)）
- 临时禁用: `// eslint-disable-next-line @typescript-eslint/no-unused-vars`

### 问题 6: ESM 模块问题

**症状**:
```
SyntaxError: Cannot use import statement outside a module
```

**解决方案**:
- 项目使用 ESM 模块（`"type": "module"`，来源: [package.json#L5](../../package.json#L5)）
- 确保使用 `import/export` 而非 `require`
- 文件扩展名使用 `.js`（即使源码是 `.ts`）

### 问题 7: Git Hooks 不工作

**症状**:
提交时没有执行 pre-commit 检查

**解决方案**:
```bash
# 检查 Git hooks 状态
spec-first hooks status

# 重新安装 hooks
spec-first hooks install
```

---

## 验证安装

### 完整验证清单

```bash
# 1. 环境检查
node --version        # 应显示 v20.x.x 或更高
pnpm --version        # 应显示 8.x.x 或更高
git --version         # 应显示 git version 2.x.x

# 2. 依赖检查
pnpm list --depth=0   # 检查已安装依赖

# 3. 构建检查
npm run build         # 应无错误
ls dist/cli/index.js  # 应存在

# 4. 类型检查
npm run typecheck     # 应无错误

# 5. 测试检查
npm test              # 应全部通过
npm run test:coverage # 覆盖率应 >= 75%

# 6. 代码质量
npm run lint          # 应无错误

# 7. CLI 检查
node dist/cli/index.js --version  # 应显示 1.1.0
node dist/cli/index.js doctor     # 验证安装
```

### 快速验证脚本

```bash
#!/bin/bash
# 保存为 verify-setup.sh

echo "=== Spec-First 环境验证 ==="

echo "1. 检查 Node.js..."
node --version || { echo "❌ Node.js 未安装"; exit 1; }

echo "2. 检查 pnpm..."
pnpm --version || { echo "❌ pnpm 未安装"; exit 1; }

echo "3. 检查依赖..."
[ -d "node_modules" ] || { echo "❌ 依赖未安装，运行 pnpm install"; exit 1; }

echo "4. 检查构建..."
[ -f "dist/cli/index.js" ] || { echo "❌ 项目未构建，运行 npm run build"; exit 1; }

echo "5. 运行类型检查..."
npm run typecheck || { echo "❌ 类型检查失败"; exit 1; }

echo "6. 运行测试..."
npm test || { echo "❌ 测试失败"; exit 1; }

echo "7. 运行 lint..."
npm run lint || { echo "❌ Lint 检查失败"; exit 1; }

echo "✅ 所有检查通过！"
```

---

## 进阶配置

### IDE 配置

**VS Code 推荐扩展**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**VS Code settings.json**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 环境变量

```bash
# .env.local（可选）
NODE_ENV=development
SPEC_FIRST_LOG_LEVEL=debug
```

### 调试配置

**VS Code launch.json**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "program": "${workspaceFolder}/dist/cli/index.js",
      "args": ["doctor"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 参考链接

- [项目 README](../../README-CN.md)
- [贡献指南](../../README-CN.md#贡献指南)
- [Issue Tracker](https://github.com/sunrain520/spec-first/issues)
- [GitHub 仓库](https://github.com/sunrain520/spec-first)
- [Gitee 镜像](https://gitee.com/sunnyrain/spec-first)

---

## 更新日志

| 日期 | 版本 | 变更内容 |
|------|------|---------|
| 2026-03-16 | 1.0.0 | 初始版本，基于 package.json v1.1.0 |
