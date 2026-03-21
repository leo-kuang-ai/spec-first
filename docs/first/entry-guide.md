# 入口指南

> 本文档基于 `.spec-first/runtime/first/entry-guide.json` 真源生成

---

## Runtime 要求

| 依赖 | 版本 |
|------|------|
| Node.js | >=20.0.0 |
| TypeScript | ^5.4.0 |
| Module System | ESM |

---

## 安装命令

```bash
npm install
npm run build
```

---

## 启动命令

```bash
# 构建 CLI
npm run build

# 查看帮助
spec-first --help

# 查看当前 feature
spec-first feature current
```

---

## 验证命令

```bash
# 类型检查
npm run typecheck

# 运行测试
npm test

# 代码检查
npm run lint

# 格式化检查
npm run format
```

---

## 关键环境变量

| 变量名 | 用途 |
|--------|------|
| SPEC_FIRST_DEBUG | 调试模式开关 |
| SPEC_FIRST_SKIP_BOOTSTRAP | 跳过引导 |
| SPEC_FIRST_INIT_BOOTSTRAP | 初始化时引导 |
| SPEC_FIRST_BIN | CLI 二进制路径 |
| VITEST | 测试环境标识 |
| NODE_ENV | 环境标识 |
| HOME | 用户主目录 |

---

## 宿主环境变量

| 变量名 | 宿主 |
|--------|------|
| GEMINI_HOME | Gemini CLI |
| GEMINI_CONFIG_DIR | Gemini CLI |
| CURSOR_HOME | Cursor |
| CURSOR_CONFIG_DIR | Cursor |

---

## 真源

- `.spec-first/runtime/first/entry-guide.json`
