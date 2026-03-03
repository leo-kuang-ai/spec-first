---
last_updated: 2026-03-03
mode: deep
project_type: backend
---

# 本地环境搭建

> **项目**: spec-first
> **版本**: 0.5.45
> **模式**: deep

## 1. 环境要求

### 1.1 必需环境

| 软件 | 最低版本 | 推荐版本 | 检查命令 |
|------|----------|----------|----------|
| **Node.js** | ≥20.0.0 | 20.x LTS | `node --version` |
| **pnpm** | 任意版本 | 8.x+ | `pnpm --version` |
| **Git** | 任意版本 | 2.x+ | `git --version` |

### 1.2 Node.js 安装

**推荐方式: 使用 nvm (Node Version Manager)**

```bash
# 安装 nvm（macOS/Linux）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell
source ~/.bashrc  # 或 ~/.zshrc

# 安装 Node.js 20
nvm install 20
nvm use 20

# 验证安装
node --version   # 应输出 v20.x.x
npm --version    # 应输出 10.x.x
```

**Windows 用户**:
- 下载 [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
- 或直接从 [Node.js 官网](https://nodejs.org/) 下载安装

### 1.3 pnpm 安装

```bash
# 使用 npm 安装 pnpm
npm install -g pnpm

# 验证安装
pnpm --version   # 应输出 8.x.x 或更高

# 可选: 启用 shell 自动补全
pnpm completion > ~/.zshrc  # zsh 用户
pnpm completion > ~/.bashrc # bash 用户
```

### 1.4 Git 安装

**macOS**:
```bash
# 使用 Homebrew
brew install git
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get update
sudo apt-get install git
```

**Windows**:
- 从 [Git 官网](https://git-scm.com/download/win) 下载安装

## 2. 项目克隆与初始化

### 2.1 克隆仓库

```bash
# 克隆项目
git clone https://github.com/your-org/spec-first.git
cd spec-first

# 查看当前分支
git branch
```

### 2.2 依赖安装

```bash
# 安装依赖（使用 pnpm）
pnpm install

# 如果遇到依赖冲突，尝试清理缓存
pnpm store prune
pnpm install
```

**依赖说明**:

| 类型 | 包管理器 | 锁文件 |
|------|----------|--------|
| 生产依赖 | pnpm | `pnpm-lock.yaml` |
| 开发依赖 | pnpm | `pnpm-lock.yaml` |

**关键依赖覆盖**:
- `rollup`: ^4.59.0
- `minimatch`: ^3.1.3
- `esbuild`: ^0.27.3

## 3. 构建步骤

### 3.1 开发构建

```bash
# 类型检查
npm run typecheck

# 构建产物
npm run build

# 验证构建产物
ls dist/
```

**构建产物结构**:

```
dist/
├── cli/
│   ├── index.js          # CLI 入口
│   └── index.d.ts        # 类型定义
├── core/                 # 核心模块
└── shared/               # 共享模块
```

### 3.2 构建配置

项目使用 **tsup** 进行打包，配置位于 `tsup.config.ts`。

**构建命令**:
- `npm run build` - 完整构建
- `npm run typecheck` - TypeScript 类型检查（无产物）

### 3.3 构建验证

```bash
# 检查构建产物完整性
node dist/cli/index.js --version

# 或使用 npm link 本地测试
npm link
spec-first --version
```

## 4. 测试步骤

### 4.1 运行测试

```bash
# 运行全量测试
npm test

# 监听模式（开发推荐）
npm run test:watch

# 带覆盖率报告
npm run test:coverage
```

### 4.2 测试覆盖率要求

| 指标 | 阈值 |
|------|------|
| 行覆盖率 | ≥ 75% |
| 函数覆盖率 | ≥ 75% |
| 分支覆盖率 | ≥ 65% |
| 语句覆盖率 | ≥ 75% |

### 4.3 运行单个测试

```bash
# 运行指定测试文件
npx vitest run tests/unit/fs-utils.test.ts

# 按测试名称匹配
npx vitest run -t "should create feature"

# 运行指定目录的测试
npx vitest run tests/unit/
```

### 4.4 测试覆盖率报告

```bash
# 生成覆盖率报告
npm run test:coverage

# 查看详细报告（HTML）
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### 4.5 性能基准测试

```bash
# 运行性能基准
npm run bench
```

## 5. 代码质量检查

### 5.1 Lint 检查

```bash
# 运行 ESLint
npm run lint

# 自动修复
npm run lint:fix
```

### 5.2 代码格式化

```bash
# 格式化代码
npm run format

# 检查格式（不修改）
npx prettier --check "src/**/*.ts"
```

### 5.3 类型检查

```bash
# TypeScript 类型检查
npm run typecheck

# 监听模式
npm run typecheck -- --watch
```

### 5.4 完整检查流程

```bash
# 推荐的完整检查流程
npm run lint && npm run typecheck && npm test && npm run build
```

## 6. 开发工作流

### 6.1 推荐的开发流程

```bash
# 1. 启动测试监听
npm run test:watch

# 2. 启动类型检查监听（另一个终端）
npm run typecheck -- --watch

# 3. 编码...

# 4. 格式化代码
npm run format

# 5. Lint 检查
npm run lint:fix

# 6. 构建验证
npm run build
```

### 6.2 提交前检查

```bash
# 完整的提交前检查
npm run lint && npm run typecheck && npm test
```

### 6.3 本地测试 CLI

```bash
# 方式 1: 使用 npm link
npm link
spec-first --help

# 方式 2: 直接运行
node dist/cli/index.js --help

# 方式 3: 使用 npx
npx . --help
```

## 7. 常见问题排查

### 7.1 依赖安装问题

**问题: pnpm install 失败**

```bash
# 清理 pnpm 缓存
pnpm store prune

# 删除 node_modules
rm -rf node_modules

# 重新安装
pnpm install
```

**问题: 依赖版本冲突**

```bash
# 查看依赖树
pnpm list --depth=10

# 强制解析依赖
pnpm install --force
```

### 7.2 构建问题

**问题: TypeScript 编译错误**

```bash
# 检查 TypeScript 版本
npx tsc --version

# 查看详细错误
npm run typecheck

# 清理构建产物
rm -rf dist
npm run build
```

**问题: tsup 构建失败**

```bash
# 检查 tsup 配置
cat tsup.config.ts

# 清理并重新构建
rm -rf dist node_modules/.cache
npm run build
```

### 7.3 测试问题

**问题: 测试覆盖率不足**

```bash
# 查看详细覆盖率报告
npm run test:coverage

# 查看未覆盖的代码
cat coverage/coverage-final.json | grep -A 5 "covered": false
```

**问题: 测试超时**

```bash
# 增加超时时间（vitest.config.ts）
export default defineConfig({
  test: {
    testTimeout: 10000,  // 10 秒
  },
});
```

**问题: 测试文件未被识别**

```bash
# 确认测试文件命名
ls tests/**/*.test.ts

# 检查 vitest 配置
cat vitest.config.ts
```

### 7.4 Lint 问题

**问题: ESLint 报错过多**

```bash
# 自动修复
npm run lint:fix

# 查看具体错误
npm run lint -- --format stylish
```

**问题: ESLint 与 Prettier 冲突**

```bash
# 先运行 Prettier
npm run format

# 再运行 ESLint
npm run lint:fix
```

### 7.5 Node.js 版本问题

**问题: Node.js 版本过低**

```bash
# 检查当前版本
node --version

# 切换到 Node.js 20
nvm install 20
nvm use 20

# 或在项目根目录创建 .nvmrc
echo "20" > .nvmrc
nvm use
```

**问题: npm 与 pnpm 混用**

```bash
# 统一使用 pnpm
rm -rf node_modules package-lock.json
pnpm install
```

### 7.6 Git Hooks 问题

**问题: 提交时未运行检查**

项目暂未配置 Git hooks，建议手动检查:

```bash
# 提交前手动运行
npm run lint && npm run typecheck && npm test
```

**可选: 配置 pre-commit hook**

```bash
# 创建 .git/hooks/pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
npm run lint && npm run typecheck && npm test
EOF

chmod +x .git/hooks/pre-commit
```

### 7.7 性能问题

**问题: 构建缓慢**

```bash
# 检查 tsup 配置
cat tsup.config.ts

# 使用增量构建（如果支持）
npm run build -- --watch
```

**问题: 测试缓慢**

```bash
# 并行运行测试
npx vitest run --threads

# 只运行修改相关的测试
npx vitest run --changed
```

## 8. IDE 配置建议

### 8.1 VS Code 配置

**推荐插件**:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "vitest.explorer"
  ]
}
```

**工作区配置** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "vitest.enable": true,
  "vitest.commandLine": "pnpm test"
}
```

**调试配置** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "program": "${workspaceFolder}/dist/cli/index.js",
      "args": ["--help"],
      "preLaunchTask": "npm: build"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--inspect-brk"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 8.2 WebStorm / IntelliJ IDEA 配置

1. **Node.js 设置**:
   - Preferences → Languages & Frameworks → Node.js
   - 设置 Node interpreter 为 Node.js 20+

2. **TypeScript 设置**:
   - Preferences → Languages & Frameworks → TypeScript
   - 使用项目内的 TypeScript (`node_modules/typescript`)

3. **ESLint 设置**:
   - Preferences → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
   - 启用 Automatic ESLint configuration

4. **Prettier 设置**:
   - Preferences → Languages & Frameworks → JavaScript → Prettier
   - 启用 On save 和 On code reformat

## 9. 环境验证清单

### 9.1 基础环境验证

```bash
# 检查 Node.js 版本
node --version        # 应输出 v20.x.x 或更高

# 检查 pnpm 版本
pnpm --version        # 应输出 8.x.x 或更高

# 检查 Git 版本
git --version         # 应输出 git version 2.x.x
```

### 9.2 项目环境验证

```bash
# 1. 依赖安装验证
ls node_modules/ | wc -l  # 应有大量依赖

# 2. 构建验证
npm run build
ls dist/cli/index.js      # 应存在

# 3. 测试验证
npm test                  # 应全部通过

# 4. CLI 验证
node dist/cli/index.js --version  # 应输出版本号
```

### 9.3 完整验证脚本

```bash
#!/bin/bash
# verify-environment.sh

echo "=== 环境验证开始 ==="

echo "1. 检查 Node.js..."
node --version || exit 1

echo "2. 检查 pnpm..."
pnpm --version || exit 1

echo "3. 检查依赖..."
[ -d "node_modules" ] || pnpm install

echo "4. 运行 Lint..."
npm run lint || exit 1

echo "5. 运行类型检查..."
npm run typecheck || exit 1

echo "6. 运行测试..."
npm test || exit 1

echo "7. 构建项目..."
npm run build || exit 1

echo "8. 验证 CLI..."
node dist/cli/index.js --version || exit 1

echo "=== ✅ 环境验证通过 ==="
```

## 10. 快速参考

### 10.1 常用命令速查

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装依赖 |
| `npm run build` | 构建项目 |
| `npm run typecheck` | 类型检查 |
| `npm test` | 运行测试 |
| `npm run test:watch` | 测试监听模式 |
| `npm run lint` | Lint 检查 |
| `npm run lint:fix` | Lint 自动修复 |
| `npm run format` | 代码格式化 |
| `node dist/cli/index.js` | 运行 CLI |

### 10.2 环境要求速查

| 软件 | 版本要求 |
|------|----------|
| Node.js | ≥20.0.0 |
| pnpm | 任意（推荐 8.x+） |
| Git | 任意（推荐 2.x+） |

### 10.3 覆盖率要求速查

| 指标 | 阈值 |
|------|------|
| 行覆盖率 | ≥75% |
| 函数覆盖率 | ≥75% |
| 分支覆盖率 | ≥65% |
| 语句覆盖率 | ≥75% |

---

*此文档由 deep 模式生成，基于 package.json 与项目配置文件。*
