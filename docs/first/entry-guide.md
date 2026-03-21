# 开发者入门指南

> 本文档帮助新开发者快速上手 spec-first 项目开发。

---

## 1. 项目简介

spec-first 是一个 AI-workflow CLI 工具，用于规范驱动开发——提供质量门禁、可追溯性和 Feature 生命周期管理。

- **版本**：1.1.4
- **语言**：TypeScript >= 5.4
- **运行时**：Node.js >= 20.0.0
- **模块系统**：ESM only

---

## 2. 前置要求

| 要求 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 20.0.0 | 必需 |
| pnpm | 推荐使用 | 项目使用 pnpm 的 overrides 配置 |

来源：`package.json:31-33, 95-100` — `[显式]`

---

## 3. 快速设置

### 3.1 克隆与安装

```bash
# 1. 克隆仓库
git clone <repo-url>
cd spec-first

# 2. 安装依赖（推荐 pnpm）
pnpm install
# 或使用 npm
npm install

# 3. 构建项目
npm run build

# 4. 类型检查（验证环境配置正确）
npm run typecheck
```

### 3.2 验证安装

```bash
# 运行测试
npm test

# 运行 lint
npm run lint
```

---

## 4. 常用命令速查

### 4.1 构建与检查

| 命令 | 说明 |
|------|------|
| `npm run build` | 构建项目（tsup 打包） |
| `npm run typecheck` | TypeScript 类型检查 |

来源：`package.json:10-11` — `[显式]`

### 4.2 测试

| 命令 | 说明 |
|------|------|
| `npm test` | 运行全部测试 |
| `npm run test:watch` | watch 模式 |
| `npm run test:coverage` | 生成覆盖率报告 |
| `npx vitest run tests/unit/<file>.test.ts` | 运行单个测试文件 |
| `npx vitest run -t "pattern"` | 按名称匹配测试 |
| `npm run bench` | 运行性能基准测试 |

来源：`package.json:12-18, CLAUDE.md:141-142` — `[显式]`

### 4.3 代码质量

| 命令 | 说明 |
|------|------|
| `npm run lint` | ESLint 检查 |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run format` | Prettier 格式化 |

来源：`package.json:15-17` — `[显式]`

### 4.4 Spec-First CLI

| 命令 | 说明 |
|------|------|
| `spec-first feature current` | 查看当前 Feature |
| `spec-first feature switch <featureId>` | 切换 Feature |
| `spec-first gate check --feature <featureId>` | 执行 Gate 校验 |
| `spec-first matrix sync --feature <featureId>` | 同步追踪矩阵 |
| `spec-first stage advance --feature <featureId>` | 推进阶段 |
| `spec-first metrics --feature <featureId>` | 查看覆盖率指标 |
| `spec-first id search <id>` | 追溯 ID |
| `spec-first defect create --feature <featureId>` | 创建缺陷记录 |
| `spec-first rfc create --feature <featureId>` | 创建变更请求 |

来源：`CLAUDE.md:150-160` — `[显式]`

---

## 5. 项目结构

```
spec-first/
  src/
    cli/        # CLI 命令（27 个命令）
    core/       # 核心引擎（14 个模块）
    shared/     # 共享类型、工具函数
  specs/        # Feature 产物目录
  skills/       # Skill 定义（20 个）
  templates/    # Handlebars 模板
  .spec-first/  # 配置与运行时状态
  tests/
    unit/       # 单元测试
    integration/# 集成测试
    e2e/        # 端到端测试
    benchmark/  # 性能基准测试
    fixtures/   # 测试固件
```

来源：`CLAUDE.md:169-178, 223-231` — `[显式]`

---

## 6. 开发工作流

### 6.1 功能开发

1. 获取当前 Feature ID
2. 在 `specs/{featureId}/task_plan.md` 创建任务清单
3. 实现前与团队确认
4. 逐项实现并标记完成
5. 执行自检清单

### 6.2 自检清单

每次修改 `src/` 下的 `.ts` 文件后必须执行：

```markdown
[ ] npm run typecheck — 已通过
[ ] npm test — 已通过
[ ] CHANGELOG.md — 已更新 / 豁免
[ ] 变更范围 — 已确认仅限必要文件
```

来源：`CLAUDE.md:40-48` — 代码变动铁律 — `[显式]`

---

## 7. 常见问题排查

### 7.1 类型错误

**问题**：运行 `npm run typecheck` 报错

**解决方案**：
1. 检查是否使用 `import type { X }` 导入纯类型
2. 确保每个文件可独立编译（`isolatedModules` 要求）
3. 检查 `verbatimModuleSyntax` 相关错误

```bash
# 查看详细错误
npm run typecheck
```

### 7.2 测试失败

**问题**：`npm test` 有失败用例

**解决方案**：
1. 运行单个测试文件定位问题
2. 使用 `-t` 参数匹配具体测试名称

```bash
# 运行单个文件
npx vitest run tests/unit/<file>.test.ts

# 按名称匹配
npx vitest run -t "test name"
```

### 7.3 Lint 错误

**问题**：`npm run lint` 报错

**解决方案**：
1. 先尝试自动修复
2. 未使用变量需手动添加 `_` 前缀

```bash
# 自动修复
npm run lint:fix

# 手动修复未使用变量
const [_unused, used] = result;
```

### 7.4 构建失败

**问题**：`npm run build` 失败

**解决方案**：
1. 先确保类型检查通过
2. 检查 tsup 配置

```bash
# 先检查类型
npm run typecheck

# 再构建
npm run build
```

---

## 8. 代码规范要点

### 8.1 必须遵守

- **ESM only**：使用 `import/export`，禁止 CommonJS
- **Named exports only**：core 模块禁止 default export
- **kebab-case**：文件命名使用 `kebab-case.ts`
- **_ 前缀**：未使用变量加 `_` 前缀

### 8.2 禁止操作

以下文件**只能通过 CLI 操作**，禁止手动编辑：

- `stage-state.json`
- `traceability-matrix.md`
- `specs/` 下的状态与报告文件

来源：`CLAUDE.md:13-17` — 禁止手动编辑的文件 — `[显式]`

---

## 9. 核心概念

### 9.1 Stage 状态机

阶段单向不可逆流转：

```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done / 09_cancelled
```

### 9.2 追溯 ID（14 类）

| 分类 | ID 类型 |
|------|---------|
| 业务链路 | FR, DS, TASK, TC, RFC |
| V-Model | REQ, SYS, ARCH, MOD |
| 测试链路 | ATP, STP, ITP, UTP |
| 顶层 | Feature |

### 9.3 覆盖率指标

- **C3**：TASK 覆 FR（传递链）
- **C4**：TC 直接覆 FR
- **C6**：TASK 已实现
- **C8**：TASK 有上游
- **C9**：TC 有上游 FR

---

## 10. 获取帮助

### 10.1 CLI 帮助

```bash
# 查看所有命令
spec-first --help

# 查看子命令帮助
spec-first feature --help
spec-first gate --help
spec-first stage --help
```

### 10.2 文档资源

- `CLAUDE.md` — 项目开发规范
- `README.md` — 项目介绍与架构说明
- `docs/first/conventions.md` — 代码规范
- `docs/first/development-guidelines.md` — 开发指南

### 10.3 核心文件

- `src/shared/types.ts` — 类型定义
- `tsconfig.json` — TypeScript 配置
- `vitest.config.ts` — 测试配置
- `eslint.config.js` — Lint 配置
- `.prettierrc` — 格式化配置
