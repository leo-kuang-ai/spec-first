# Spec-First 架构设计

## 双层架构

```
┌────────────────────────────────────────────────────────────────┐
│                    人类（PM/TL/Dev/QA）                         │
│  决策、确认、签核                                               │
└───────────────┬────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────┐
│                Skill 层（流程编排与触发）                        │
│  16 个 Skill（统一 /spec-first:xxxx 命名空间）                   │
│  宿主：Claude Code / Codex CLI / 其他 Agent                     │
│  职责：流程编排、阶段流转触发、交互引导、内容生成                │
└───────────────┬────────────────────────────────────────────────┘
                │ 调用 CLI 命令
┌───────────────▼────────────────────────────────────────────────┐
│  CLI 层（确定性原子能力）                                        │
│  12 个命令组 × 7 个核心模块（M1-M7）                            │
│  职责：ID 生成、Gate 校验、状态变更执行、度量计算                │
└────────────────────────────────────────────────────────────────┘
```

## 三层规范体系

| 层 | 内容 | 说明 |
|----|------|------|
| Layer 0 | 8+2 阶段基线 | 所有团队共享的流程骨架 |
| Layer 1 | Mode × Size 裁剪 | N/I × S/M/L 组合规则 |
| Layer 2 | 端特有规范 | APP/PC/H5/Backend 质量标准 |

## 7 个核心模块

| 模块 | 名称 | 核心职责 |
|------|------|---------|
| M1 | ProcessEngine | 阶段状态机、三层合并、advance/cancel |
| M2 | TraceEngine | ID 注册/校验/搜索、矩阵管理、覆盖率 |
| M3 | GateEngine | Gate 条件评估、SCA 校验 |
| M4 | ChangeMgr | RFC 状态机、缺陷管理 |
| M5 | AIOrchestrator | Context Pack 生成、Catchup、AI 统计 |
| M6 | MetricsEngine | 12 指标计算、健康分、瓶颈分析 |
| M7 | ToolIntegration | Git Hook 安装、CI 模板、环境诊断 |

## 目录结构

```
spec-first/
├── src/
│   ├── cli/                  # CLI 入口与命令解析
│   │   ├── index.ts          # bin 入口
│   │   ├── router.ts         # 命令路由
│   │   └── commands/         # 命令组实现
│   ├── core/                 # 7 核心模块
│   │   ├── process-engine/   # M1: 阶段状态机
│   │   ├── trace-engine/     # M2: ID + 矩阵
│   │   ├── gate-engine/      # M3: Gate + SCA
│   │   ├── change-mgr/       # M4: RFC + Defect
│   │   ├── ai-orchestrator/  # M5: Context Pack
│   │   ├── metrics-engine/   # M6: 度量
│   │   └── tool-integration/ # M7: Hook + CI
│   └── shared/               # 共享类型和工具
├── skills/spec-first/        # 19 个 Skill 文件
├── templates/                # Handlebars 模板
├── .spec-first/              # 项目级配置
└── specs/                    # Feature 工作区
```

## 关键设计决策

1. **文件即状态** - 不引入数据库，使用 JSONL 审计日志
2. **路由单点** - 所有用户入口走 `/spec-first:*`
3. **Layer 2 可插拔** - 端规范文件独立 YAML
4. **Skill 无状态** - Skill 只做编排和生成
