# Spec-First 项目认知总览

## 项目是什么

**spec-first** 是一个全链路研发闭环引擎，通过阶段状态机驱动 Feature 从需求到上线，确保规范可被自动化校验，每个实现可追溯到对应规范定义。

- **版本**: 1.2.3
- **运行时**: Node.js >= 20.0.0
- **模块系统**: ESM
- **构建工具**: tsup
- **测试框架**: Vitest

## 核心能力

```
+------------------+     +------------------+     +------------------+
|   process-engine |---->|   gate-engine    |---->|   trace-engine   |
|   阶段状态机      |     |   质量门禁        |     |   追溯 ID 管理    |
+------------------+     +------------------+     +------------------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
|  skill-runtime   |     |  ai-orchestrator |     |   change-mgr     |
|   Skill 分发      |     |   AI 调度         |     |   RFC/Defect     |
+------------------+     +------------------+     +------------------+
```

### 14 个核心模块

| 模块 | 职责 |
|------|------|
| `process-engine` | 阶段状态机，驱动 Feature 生命周期 |
| `skill-runtime` | Skill 分发、prompt 组装、hard-gate 校验 |
| `ai-orchestrator` | Auto-loop、catchup 上下文恢复 |
| `gate-engine` | 阶段质量门禁评估（19 条规则） |
| `trace-engine` | 追溯 ID 生成/校验/搜索、覆盖率矩阵 |
| `change-mgr` | RFC + Defect 状态机、影响分析 |
| `template` | Handlebars 模板渲染 |
| `tool-integration` | AI runtime hooks |
| `metrics-engine` | 健康度评分、瓶颈检测 |
| `validators` | 产物格式校验 |
| `task-plan` | task_plan.md 解析 |
| `rules` | 静态规则定义（真理源） |
| `batch-executor` | 批量任务执行 |
| `migrations` | 状态文件版本迁移 |

### 27 个 CLI 命令

`init`, `stage`, `gate`, `docs-links`, `feature`, `skill`, `ai`, `orchestrate`,
`metrics`, `trace`, `id`, `defect`, `rfc`, `first`, `doctor`, `status`,
`analyze`, `update`, `commit`, `hooks`, `viewer`, `onboarding`, `batch-test`,
`setup`, `uninstall`, `validate`, `done`

## 快速入口

**首次阅读顺序**:

1. `CLAUDE.md` - 开发规范与工作流程
2. `package.json` - 依赖与脚本配置
3. `src/cli/index.ts` - CLI 入口点
4. `src/core/` - 核心引擎实现

**核心领域概念**:
- **Stage 枚举**: `00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done / 09_cancelled`
- **追溯 ID (14 类)**: 业务链路 `FR DS TASK TC RFC` | V-Model `REQ SYS ARCH MOD / ATP STP ITP UTP` | 顶层 `Feature`
- **覆盖率 (5 项)**: `C3` `C4` `C6` `C8` `C9`

## 关键命令

```bash
# 构建
npm run build              # tsup 打包
npm run typecheck          # 类型检查

# 测试
npm test                   # 全量测试
npm run test:watch         # watch 模式

# Spec-First CLI
spec-first feature current                    # 当前 feature
spec-first gate check --feature <id>          # Gate 校验
spec-first stage advance --feature <id>       # 推进阶段
spec-first id search FR-xxx                   # ID 追溯
```
