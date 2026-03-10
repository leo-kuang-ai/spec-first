---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# 本地环境搭建

## 前置要求

- Node.js ≥20.0.0
- npm 或 pnpm

## 安装步骤

### 1. 克隆仓库
```bash
git clone <repository-url>
cd spec-first
```

### 2. 安装依赖
```bash
npm install
```

### 3. 构建项目
```bash
npm run build
```

### 4. 运行测试
```bash
npm test
```

## 开发命令

```bash
# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 代码格式化
npm run format

# 测试（watch 模式）
npm run test:watch

# 测试覆盖率
npm run test:coverage

# 性能基准测试
npm run bench
```

## 本地调试

```bash
# 链接到全局
npm link

# 运行 CLI
spec-first --help
```

## Stage Viewer

```bash
# 启动 Stage Viewer
npm run viewer:bootstrap
```

## 常见问题

### Node 版本不匹配
确保使用 Node.js ≥20.0.0

### 依赖安装失败
尝试清理缓存：
```bash
rm -rf node_modules package-lock.json
npm install
```
