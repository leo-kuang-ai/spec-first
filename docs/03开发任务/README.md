# Spec-First V2 开发任务总览

> **版本**: v1.0 | **日期**: 2026-02-11 | **状态**: 初始化
> **上游需求**: `docs/01需求文档/v2`
> **上游技术方案**: `docs/02技术方案/V2`

---

## 1. 任务组织原则

按技术方案 v2-12 的三阶段实施路线组织，每阶段内按模块拆解：

| 阶段 | 优先级 | 目标 | 准出标准 |
|------|--------|------|---------|
| **A — 核心链路可用** | P0 | CLI 基础能力 + 核心模块 + 模板系统 | `npm run typecheck` 归零 + 核心模块单测覆盖率 ≥ 60% + 核心链路手动走通 |
| **B — 质量闭环补齐** | P1 | Gate + AI + Metrics + Hook + 16 Skill 联调 | GL-01 ~ GL-04 全部通过 |
| **C — 扩展与优化** | P2 | 多端扩展 + 性能 SLA + E2E + CI/CD 适配 | benchmark 通过 + CI 绿灯 |

---

## 2. 文档清单

| # | 文件 | 内容 | 任务数 |
|---|------|------|--------|
| 1 | [phase-A-核心链路.md](phase-A-核心链路.md) | 共享基础 + M2 + M1 + M4 + 模板系统 + 基础 CLI | 30 |
| 2 | [phase-B-质量闭环.md](phase-B-质量闭环.md) | M3 + M4补充 + M5 + M6 + M7 + Skill Runtime + 16 Skill 联调 | 27 |
| 3 | [phase-C-扩展优化.md](phase-C-扩展优化.md) | Layer 2 扩展 + 性能 + E2E + CI/CD + IDE 插件 + npm 分发 | 8 |
| — | **合计** | — | **65** |

---

## 3. 模块依赖图

```text
M2 TraceEngine ──────┬──→ M3 GateEngine ──→ M1 ProcessEngine (advance)
                     │
                     ├──→ M6 MetricsEngine
                     │
                     ├──→ M5 AIOrchestrator
                     │
                     └──→ M4 ChangeMgr (影响分析)

M7 ToolIntegration ──→ M3 GateEngine (Hook 调用 gate check)

Skill Runtime ──→ CLI 层（所有模块）
```

**实施顺序**：共享基础 → M2 → M1 → M4 → 模板系统 → M3 → M5 → M6 → M7 → Skill Runtime

---

## 4. 技术栈约束

| 类别 | 选型 | 版本 |
|------|------|------|
| 运行时 | Node.js | ≥ 20 LTS |
| 语言 | TypeScript (ESM) | ≥ 5.4 |
| 模板引擎 | Handlebars | ≥ 4.7 |
| YAML 解析 | js-yaml | ≥ 4.1 |
| Markdown 解析 | remark + unified | ≥ 15 |
| 测试框架 | Vitest | ≥ 1.0 |
| 构建工具 | tsup | ≥ 8.0 |
| 包管理 | pnpm（开发侧）/ npm（用户侧） | pnpm ≥ 8 / npm ≥ 9 |

---

## 5. 全局约束

1. **用户入口统一** — `/spec-first:*`，禁止裸调 CLI
2. **CLI 确定性** — 相同输入 = 相同输出，不主动编排
3. **文件即状态** — 不引入数据库，Git 天然版本管理
4. **JSONL 审计** — 所有关键状态变更追加写入 JSONL
5. **Skill 无状态** — Skill 只做编排和生成，状态变更通过 CLI
6. **单向依赖** — 模块间禁止循环依赖

---

## 6. 目录结构（目标态）

```text
spec-first/
├── src/
│   ├── cli/                  # CLI 入口与命令解析
│   │   ├── index.ts          # bin 入口
│   │   ├── router.ts         # 命令路由
│   │   └── commands/         # 12 命令组
│   ├── core/                 # 7 核心模块
│   │   ├── process-engine/   # M1
│   │   ├── trace-engine/     # M2
│   │   ├── gate-engine/      # M3
│   │   ├── change-mgr/       # M4
│   │   ├── ai-orchestrator/  # M5
│   │   ├── metrics-engine/   # M6
│   │   └── tool-integration/ # M7
│   └── shared/               # 共享类型、常量、工具函数
├── skills/spec-first/        # 16 个 Skill 文件 + 8 个 legacy Skill（待废弃）
├── templates/                # Handlebars 模板（12 个）
├── tests/                    # 单元 + 集成 + fixtures
├── .spec-first/              # 项目级配置
└── specs/                    # Feature 工作区
```

---

## 7. 任务编号规则

`T-<Phase><Module>-<Seq>`

- Phase: `A` / `B` / `C`
- Module: `S`(Shared) / `M1`~`M7` / `SK`(Skill) / `TP`(Template) / `CL`(CLI补充) / `L2`(Layer2) / `SLA`(性能) / `E2E` / `CI` / `IDE`(插件)
- Seq: 三位数字，如 `001`

示例：`T-AM2-001` = 阶段 A、M2 TraceEngine、第 1 个任务
