---
last_updated: 2026-03-06
mode: deep
project_type: backend
---

# 本地环境搭建

## 环境要求

- Node.js: ≥20.0.0 (`package.json:27` — `"node": ">=20.0.0"` — `[显式]`)
- 包管理器: npm 或 pnpm

## 安装步骤

### 1. 克隆仓库

```bash
git clone <repository-url>
cd spec-first
```

### 2. 安装依赖

使用 npm:
```bash
npm install
```

或使用 pnpm:
```bash
pnpm install
```

### 3. 构建项目

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

## 常用命令

### 开发命令

```bash
# 构建项目
npm run build

# 类型检查
npm run typecheck

# 运行测试
npm test

# 测试监听模式
npm run test:watch

# 测试覆盖率
npm run test:coverage
```

### 代码质量

```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 代码格式化
npm run format
```

### 其他工具

```bash
# 性能基准测试
npm run bench

# 启动 Stage Viewer
npm run viewer:bootstrap

# 安装 Codex 自动启动
npm run codex:autostart:install
```

## 验证安装

构建完成后，可以通过以下方式验证安装：

```bash
# 查看版本信息
node dist/cli/index.js --version

# 或全局安装后
npm link
spec-first --version
```

预期输出: `0.5.45`

## 开发模式

本项目使用 TypeScript + ESM 模式开发：

- 源码位于 `src/` 目录
- 构建工具: tsup
- 测试框架: Vitest
- 代码检查: ESLint + Prettier

修改代码后需重新运行 `npm run build` 生成新的构建产物。

## 故障排查

### Node.js 版本不匹配

如果遇到版本错误，请确保 Node.js 版本 ≥20.0.0：

```bash
node --version
```

### 依赖安装失败

清理缓存后重试：

```bash
rm -rf node_modules package-lock.json
npm install
```

### 构建失败

检查 TypeScript 类型错误：

```bash
npm run typecheck
```
