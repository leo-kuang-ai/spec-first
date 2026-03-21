# Spec-First 项目概览

> 基于 `.spec-first/runtime/first/summary.json` 真源生成

---

## 项目身份

- **名称**：spec-first
- **版本**：1.1.4
- **类型**：后端 CLI 工具

---

## 入口点

| 入口类型 | 路径 |
|---------|------|
| CLI 源码 | `src/cli/index.ts` |
| 可执行文件 | `dist/cli/index.js` |

---

## 技术栈

| 维度 | 技术选型 |
|------|---------|
| Runtime | Node.js ≥20 |
| Module | ESM |
| Language | TypeScript ^5.4 (strict, verbatimModuleSyntax) |
| Bundler | tsup |
| Test | Vitest (v8 coverage) |
| Lint | eslint + typescript-eslint |
| Format | Prettier |
| Templates | Handlebars |
| Config | js-yaml |

---

## 核心模块（14 个）

| 模块 | 职责 |
|------|------|
| `process-engine` | Stage 状态机、Feature 生命周期 |
| `skill-runtime` | Skill 分发、prompt 组装 |
| `ai-orchestrator` | Auto-loop、catchup 上下文恢复 |
| `gate-engine` | 阶段质量门禁评估 |
| `trace-engine` | 追溯 ID 生成/校验、覆盖率矩阵 |
| `change-mgr` | RFC + Defect 状态机 |
| `template` | Handlebars 模板渲染 |
| `tool-integration` | AI runtime hooks |
| `metrics-engine` | 健康度评分、瓶颈检测 |
| `validators` | 产物格式校验 |
| `task-plan` | task_plan.md 解析 |
| `rules` | 静态规则定义 |
| `batch-executor` | 批量任务执行 |
| `migrations` | 状态文件版本迁移 |

---

## 规模

- **CLI 命令**：27 个
- **Skills**：20 个

---

## 更多信息

- 项目摘要：`docs/first/summary.md`
- 技术约束：`docs/first/steering.md`
- 官方介绍：根目录 `README.md`
