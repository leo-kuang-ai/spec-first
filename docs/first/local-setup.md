---
mode: deep
last_updated: 2026-03-09
evidence_sources:
  - package.json
  - tsconfig.json
  - CLAUDE.md
---

# 本地环境搭建指南

> 本文档基于项目实际配置自动生成（deep 模式），标注所有证据来源。

---

## 1. 环境要求

### Node.js 版本

**最低版本**：Node.js 20.0.0 或更高

**证据**：`package.json` 第 28-29 行
```json
"engines": {
  "node": ">=20.0.0"
}
```

**验证命令**：
```bash
node --version  # 应显示 v20.x.x 或更高
```

---

## 2. 包管理器

### 推荐使用 pnpm

**证据**：
- 项目根目录存在 `pnpm-lock.yaml`
- `package.json` 第 73-78 行配置了 pnpm overrides

**安装 pnpm**：
```bash
npm install -g pnpm
```

**备选方案**：也可使用 npm（所有 scripts 兼容 npm）

---

## 3. 依赖安装

### 安装项目依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

**证据**：`package.json` 第 54-72 行定义了所有依赖

### 核心依赖说明

**运行时依赖**（证据：`package.json` 第 67-72 行）：
- `handlebars`: 模板引擎
- `js-yaml`: YAML 配置解析
- `semver`: 版本管理
- `update-notifier`: 更新通知

**开发依赖**（证据：`package.json` 第 54-66 行）：
- TypeScript 5.4+
- Vitest（测试框架）
- ESLint + typescript-eslint
- Prettier
- tsup（构建工具）

---

## 4. 构建项目

### 首次构建

```bash
npm run build
```

**证据**：`package.json` 第 10 行 → `"build": "tsup"`

**构建产物**：
- 输出目录：`dist/`（证据：`tsconfig.json` 第 7 行）
- 入口文件：`dist/cli/index.js`（证据：`package.json` 第 7 行）

### 类型检查

```bash
npm run typecheck
```

**证据**：`package.json` 第 11 行 → `"typecheck": "tsc --noEmit"`

---

## 5. 开发命令

### 测试相关

```bash
# 运行全量测试
npm test

# Watch 模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 运行性能基准测试
npm run bench
```

**证据**：`package.json` 第 12-18 行

### 代码质量

```bash
# 运行 ESLint 检查
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# 格式化代码（Prettier）
npm run format
```

**证据**：`package.json` 第 15-17 行

---

## 6. 启动项目

### CLI 命令

项目构建后，可通过以下方式运行：

```bash
# 方式 1：直接运行（需先 build）
node dist/cli/index.js <command>

# 方式 2：使用 npm link（开发推荐）
npm link
spec-first <command>

# 方式 3：全局安装后使用
npm install -g .
spec-first <command>
```

**证据**：
- `package.json` 第 6-8 行定义了 bin 入口
- `CLAUDE.md` 第 186 行说明了 19 个可用命令

### Stage Viewer（阶段查看器）

```bash
# 启动 Stage Viewer（自动分配端口）
npm run viewer:start

# 启动并自动打开浏览器
npm run viewer:bootstrap
```

**证据**：`package.json` 第 19-20 行

---

## 7. 环境变量

### 当前状态

**检测结果**：项目根目录未发现 `.env.example` 或 `.env.template` 文件

**说明**：项目当前不依赖环境变量配置，所有配置通过以下方式管理：
- CLI 参数
- 配置文件（`.spec-first/` 目录）
- YAML 配置（`js-yaml` 解析）

**证据**：
- 未找到 `.env*` 文件
- `package.json` 依赖中包含 `js-yaml` 用于配置管理

---

## 8. 外部服务依赖

### 当前状态

**检测结果**：项目根目录未发现 `docker-compose.yml` 文件

**说明**：项目为纯 CLI 工具，不依赖外部服务（如数据库、缓存、消息队列等）

**运行时依赖**：
- Node.js 运行时
- 文件系统访问（读写 `.spec-first/` 目录）
- Git（用于提交规范检查）

**证据**：
- 未找到 `docker-compose.yml`
- 项目定位为"规范驱动的开发流程引擎"（`package.json` 第 4 行）

---

## 9. 项目结构

### 核心目录（证据：`CLAUDE.md` 第 168-180 行）

```
spec-first/
├── src/                    # 源代码
│   ├── cli/               # CLI 入口与路由
│   ├── core/              # 核心模块
│   └── shared/            # 共享类型与工具
├── tests/                 # 测试文件
│   ├── unit/             # 单元测试
│   ├── integration/      # 集成测试
│   ├── e2e/              # 端到端测试
│   ├── benchmark/        # 性能测试
│   └── fixtures/         # 测试固件
├── skills/               # Skill 定义
├── templates/            # Handlebars 模板
├── scripts/              # 辅助脚本
├── dist/                 # 构建产物
└── .spec-first/          # 项目运行时数据
```

---

## 10. 验证安装

### 完整验证流程

```bash
# 1. 检查 Node.js 版本
node --version

# 2. 安装依赖
pnpm install

# 3. 构建项目
npm run build

# 4. 运行类型检查
npm run typecheck

# 5. 运行测试
npm test

# 6. 运行 lint
npm run lint

# 7. 验证 CLI 可用
node dist/cli/index.js --help
```

**预期结果**：
- 所有命令执行成功
- 测试覆盖率达到阈值（lines/functions/statements ≥75%, branches ≥65%）
- 无 ESLint 错误
- CLI 显示帮助信息

---

## 11. 常见问题

### Node.js 版本过低

**问题**：`npm install` 报错 "Unsupported engine"

**解决**：
```bash
# 使用 nvm 安装 Node.js 20+
nvm install 20
nvm use 20
```

### pnpm 未安装

**问题**：`pnpm: command not found`

**解决**：
```bash
npm install -g pnpm
```

### 构建失败

**问题**：`npm run build` 报错

**解决步骤**：
1. 清理缓存：`rm -rf node_modules dist`
2. 重新安装：`pnpm install`
3. 重新构建：`npm run build`

### 测试覆盖率不足

**问题**：测试失败，提示覆盖率低于阈值

**说明**：这是正常的质量门禁，需要补充测试用例

**阈值要求**（证据：`vitest.config.ts` 第 11-16 行）：
- lines: 75%
- functions: 75%
- statements: 75%
- branches: 65%

---

## 12. 下一步

### 开发前准备

1. **阅读核心文档**：
   - `CLAUDE.md` - 项目规范与架构
   - `README.md` - 项目介绍与快速开始
   - `docs/first/development-guidelines.md` - 研发规范

2. **了解核心概念**（证据：`CLAUDE.md` 第 17-22 行）：
   - 规范即契约
   - 全链路追溯
   - 自动化校验
   - 结构化定义

3. **熟悉命令**（证据：`CLAUDE.md` 第 186 行）：
   - 19 个 CLI 命令：id, matrix, init, stage, rfc, defect, metrics, doctor, gate, golive, ai, commit, feature, setup, hooks, viewer, update, uninstall, analyze

### 开发工作流（证据：`CLAUDE.md` 第 37-47 行）

1. 构思方案 → 明确需求
2. 请求审核 → 确认可行性
3. 拆解任务 → 分解步骤
4. 逐项实现 → 执行并自检

---

## 附录：证据来源清单

| 配置项 | 证据文件 | 行号/位置 |
|--------|---------|----------|
| Node.js 版本 | package.json | 28-29 |
| 包管理器 | pnpm-lock.yaml, package.json | 73-78 |
| 依赖列表 | package.json | 54-72 |
| 构建命令 | package.json | 10-11 |
| 测试命令 | package.json | 12-18 |
| CLI 入口 | package.json | 6-8 |
| 项目结构 | CLAUDE.md | 168-212 |
| 核心概念 | CLAUDE.md | 17-22 |
| 开发工作流 | CLAUDE.md | 37-47 |

---

**文档生成信息**：
- 生成时间：2026-03-09
- 生成模式：deep（配置分析 + 文件检测）
- Agent：C2
- 证据标注：完整标注所有证据来源
