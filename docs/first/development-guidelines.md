# 开发指南

> 本文档定义 spec-first 项目的开发流程、测试指南、代码评审标准和发布流程。

---

## 1. 环境设置

### 1.1 前置要求

- **Node.js** >= 20.0.0 (`package.json:31-33` — engines.node — `[显式]`)
- **包管理器**：推荐 pnpm（项目使用 pnpm 的 overrides 配置）(`package.json:95-100` — pnpm.overrides — `[显式]`)

### 1.2 安装步骤

```bash
# 1. 安装依赖
pnpm install
# 或
npm install

# 2. 构建项目
npm run build

# 3. 类型检查
npm run typecheck
```

来源：`package.json:10-11` — build/typecheck 脚本 — `[显式]`

---

## 2. 项目结构

```
spec-first/
  src/
    cli/        # CLI 命令注册与路由（27 个命令）
    core/       # 核心引擎（14 个模块）
    shared/     # 共享类型（types.ts）、工具函数
  specs/        # Feature 产物目录（状态文件由 spec-first CLI 管理）
  skills/       # Skill 定义（.md 文件，20 个）
  templates/    # Handlebars 模板
  .spec-first/  # 项目级配置与运行时状态
  tests/
    unit/       # 单元测试（每模块一文件）
    integration/# 集成测试
    e2e/        # 端到端测试
    benchmark/  # 性能基准测试
    fixtures/   # 测试固件数据
```

来源：`CLAUDE.md:169-178, 223-231` — `[显式]`

---

## 3. 开发工作流程

### 3.1 场景路由

| 场景 | 路径 | 对应 Skill |
|------|------|-----------|
| 功能开发 / 重构 | 走完整 4 步 | `/spec-first:code` 或 `/spec-first:task` |
| Bug 修复 / CI 失败 | 直接修复 → 自检 | `/spec-first:review` |
| 性能优化 / 依赖升级 | 先分析影响范围 → 如改 3+ 文件进 Plan 模式 | `/spec-first:analyze` |
| 测试补全 / 覆盖率提升 | 直接实现 → 自检 | — |
| 代码评审反馈 | 直接修复对应问题 → 自检 | `/spec-first:review` |
| 文档 / 配置 / 小改动 | 直接执行 → 确认结果 | — |
| 纯分析 / 调研 | 用 Subagent 隔离上下文 | `/spec-first:research` |

来源：`CLAUDE.md:64-86` — `[显式]`

### 3.2 功能开发完整流程

1. **计划** — 获取 featureId，在 `specs/{featureId}/task_plan.md` 写可勾选任务清单
   - 格式：`- [ ] TASK-{FEAT}-{NNN} [P{优先级}] 任务标题`
2. **确认** — 实现前与用户确认
3. **执行** — 逐项实现，完成时标记，每步给出高层摘要
4. **自检** — 执行强制自检清单（typecheck + test + CHANGELOG）

来源：`CLAUDE.md:77-86` — 功能开发完整流程 — `[显式]`

### 3.3 Bug 修复流程

- 直接修复 → 自检（typecheck + test）
- 优先追溯到已有的 Defect ID，而非创建新 FR

来源：`CLAUDE.md:64, 75` — `[显式]`

---

## 4. 构建命令

### 4.1 常用命令

| 命令 | 说明 |
|------|------|
| `npm run build` | tsup 打包，生成 ESM 格式，输出到 dist |
| `npm run typecheck` | TypeScript 类型检查，不生成文件 |

来源：`package.json:10-11, tsup.config.ts:4-11` — `[显式]`

### 4.2 构建入口

```javascript
entry: {
  cli: 'src/cli/index.ts',
  postinstall: 'src/postinstall.ts',
  preuninstall: 'src/preuninstall.ts'
}
```

来源：`tsup.config.ts:4-11` — `[显式]`

---

## 5. 测试指南

### 5.1 测试命令

| 命令 | 说明 |
|------|------|
| `npm test` | 运行全部测试（vitest run） |
| `npm run test:watch` | vitest watch 模式，监听文件变化自动重跑 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |
| `npx vitest run tests/unit/<file>.test.ts` | 运行单个测试文件 |
| `npx vitest run -t "pattern"` | 按名称匹配测试用例 |
| `npm run bench` | 运行性能基准测试 |

来源：`package.json:12-18, CLAUDE.md:141-142` — `[显式]`

### 5.2 覆盖率要求

| 指标 | 阈值 |
|------|------|
| lines | 75% |
| functions | 75% |
| statements | 75% |
| branches | 65% |

来源：`vitest.config.ts:1-19` — 完整配置 — `[显式]`

### 5.3 测试组织

- 单元测试：每模块一文件，位于 `tests/unit/`
- 集成测试：位于 `tests/integration/`
- 端到端测试：位于 `tests/e2e/`
- 性能基准测试：位于 `tests/benchmark/`
- 测试固件：位于 `tests/fixtures/`

---

## 6. 代码质量

### 6.1 Lint 命令

| 命令 | 说明 |
|------|------|
| `npm run lint` | ESLint 检查 src 目录 |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run format` | Prettier 格式化 src 目录下的 TypeScript 文件 |

来源：`package.json:15-17` — `[显式]`

### 6.2 代码评审标准

1. **类型安全**：必须通过 `npm run typecheck`
2. **测试覆盖**：新增代码必须有对应测试
3. **规范追溯**：实现必须能追溯到对应 FR/DS/TASK
4. **最小变更**：只触及必要范围，不打临时补丁

---

## 7. Spec-First CLI 常用命令

### 7.1 Feature 管理

| 命令 | 说明 |
|------|------|
| `spec-first feature current` | 查看当前 Feature |
| `spec-first feature switch <featureId>` | 切换 Feature |

来源：`CLAUDE.md:150-151` — `[显式]`

### 7.2 Gate 校验

| 命令 | 说明 |
|------|------|
| `spec-first gate check --feature <featureId>` | 执行 Gate 校验 |
| `spec-first gate check --feature <featureId> --stage 03_plan` | 指定阶段 Gate 校验 |

来源：`CLAUDE.md:152-153` — `[显式]`

### 7.3 追踪与度量

| 命令 | 说明 |
|------|------|
| `spec-first matrix sync --feature <featureId>` | 同步追踪矩阵 |
| `spec-first metrics --feature <featureId>` | 查看覆盖率指标（C3/C4/C6/C8/C9） |
| `spec-first id search <id>` | 追溯 ID |
| `spec-first id generate <type> --feature <featureId>` | 生成新 ID |

来源：`CLAUDE.md:154-158` — `[显式]`

### 7.4 阶段推进

```bash
spec-first stage advance --feature <featureId>
```

注意：须先通过 Gate 校验 (`CLAUDE.md:155` — `[显式]`)

### 7.5 变更管理

| 命令 | 说明 |
|------|------|
| `spec-first defect create --feature <featureId>` | 创建缺陷记录 |
| `spec-first rfc create --feature <featureId>` | 创建变更请求 |

来源：`CLAUDE.md:159-160` — `[显式]`

---

## 8. 发布流程

### 8.1 发布前检查

1. 运行 `npm run typecheck` 确保类型正确
2. 运行 `npm test` 确保所有测试通过
3. 运行 `npm run lint` 确保代码质量
4. 更新 `CHANGELOG.md`

### 8.2 版本号

- 从 `package.json` 读取当前版本
- CHANGELOG 格式：`- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要 (user-visible)`

---

## 9. 强制自检清单

每次 `src/` 下 `.ts` 文件变更后必须执行 (`CLAUDE.md:40-48` — 代码变动铁律 — `[显式]`)：

```markdown
自检清单
[ ] 1. npm run typecheck — 已通过
[ ] 2. npm test — 已通过 / 受影响范围已通过
[ ] 3. CHANGELOG.md — 已更新 / 豁免（原因：____）
[ ] 4. 变更范围 — 已确认仅限必要文件
```

---

## 10. 核心模块说明

| 模块 | 职责 |
|------|------|
| `process-engine/` | 阶段状态机（8 active + 2 terminal），驱动 Feature 生命周期、ID 生成、目录初始化 |
| `gate-engine/` | 阶段质量门禁评估（19条：16 blocking + 3 warning）、豁免管理、PRD 评分 |
| `trace-engine/` | 追溯 ID 生成/校验/搜索、覆盖率矩阵（C3/C4/C6/C8/C9）、Exception 机制 |
| `skill-runtime/` | Skill 分发、prompt 组装、hard-gate 校验 |
| `ai-orchestrator/` | Auto-loop、catchup 上下文恢复、context-pack |
| `change-mgr/` | RFC + Defect 状态机、影响分析 |
| `metrics-engine/` | 健康度评分（H1）、瓶颈检测（R1-R5） |
| `validators/` | 产物格式校验（ID 格式、必需章节、追踪矩阵一致性） |
| `task-plan/` | task_plan.md 解析、Todo 状态管理 |
| `template/` | Handlebars 模板渲染、产物生成 |
| `tool-integration/` | AI runtime hooks、context 同步 |
| `batch-executor/` | 批量任务执行、并行编排支持 |
| `migrations/` | 状态文件版本迁移、升级兼容处理 |

来源：`CLAUDE.md:185-216` — 核心模块 — `[显式]`
