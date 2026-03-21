# 开发指南

> 本文档基于 `.spec-first/runtime/first/conventions.json` 和 `entry-guide.json` 真源生成

---

## 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | >=20.0.0 |
| TypeScript | ^5.4.0 |
| Module System | ESM |

---

## 安装与构建

```bash
# 安装依赖
npm install

# 构建 CLI
npm run build

# 类型检查
npm run typecheck
```

---

## 日常命令

### 测试

```bash
# 运行全部测试
npm test

# Watch 模式
npm run test:watch

# 单文件测试
npx vitest run tests/unit/<file>.test.ts

# 按名称匹配
npx vitest run -t "pattern"

# 覆盖率报告
npm run test:coverage
```

### 代码质量

```bash
# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint:fix

# Prettier 格式化
npm run format
```

### Spec-First CLI

```bash
# 查看当前 feature
spec-first feature current

# 切换 feature
spec-first feature switch <featureId>

# Gate 校验
spec-first gate check --feature <featureId>

# 阶段推进
spec-first stage advance --feature <featureId>
```

---

## 环境变量

| 变量名 | 用途 |
|--------|------|
| SPEC_FIRST_DEBUG | 调试模式开关 |
| SPEC_FIRST_SKIP_BOOTSTRAP | 跳过引导 |
| SPEC_FIRST_INIT_BOOTSTRAP | 初始化时引导 |
| SPEC_FIRST_BIN | CLI 二进制路径 |
| VITEST | 测试环境标识 |
| NODE_ENV | 环境标识 |

---

## 开发流程

1. **创建 Feature** - `spec-first init --feat <NAME>`
2. **编写需求** - `/spec-first:spec`
3. **技术设计** - `/spec-first:design`
4. **任务拆解** - `/spec-first:task`
5. **实现** - `/spec-first:code`
6. **验证** - `/spec-first:verify`
7. **归档** - `/spec-first:archive`

---

## 真源

- `.spec-first/runtime/first/conventions.json`
- `.spec-first/runtime/first/entry-guide.json`
