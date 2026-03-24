# Spec-First 导向规则

> 基于 `.spec-first/runtime/first/steering.json` 生成

## 概述

- **状态**: healthy
- **规则总数**: 10 条
- **证据路径**: `CLAUDE.md`, `package.json`, `src/core/`, `tests/`

---

## 架构规则

### [P0] 核心模块仅使用 named exports，禁止 default export

- **理由**: 确保模块导出一致性，支持 tree-shaking 和显式依赖
- **证据**: `CLAUDE.md`

### [P0] ESM only — 全项目 type: module，使用 import/export

- **理由**: 统一模块系统，避免 CommonJS/ESM 混用问题
- **证据**: `package.json`, `CLAUDE.md`

### [P1] 类型集中定义在 src/shared/types.ts

- **理由**: Stage 枚举、ExitCode、ID types 等核心类型统一管理
- **证据**: `CLAUDE.md`

---

## 工作流规则

### [P0] Stage 状态机单向不可逆

```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done
                                                                                             ↘ 09_cancelled
```

- **理由**: 保证研发流程可追溯，阶段推进只能通过 Gate 校验
- **证据**: `src/core/process-engine/`

### [P0] 代码变更后必须执行：typecheck → test → CHANGELOG 更新

- **理由**: 确保类型安全、测试通过、变更可追溯
- **证据**: `CLAUDE.md`

### [P1] 修改 3+ 文件或涉及 src/core/ 核心逻辑需进入 Plan 模式

- **理由**: 控制变更风险，确保大型改动有充分规划
- **证据**: `CLAUDE.md`

---

## 质量规则

### [P0] Gate 校验包含 19 条规则（16 blocking + 3 warning）

- **理由**: 阶段质量门禁保障，防止不合格产物进入下一阶段
- **证据**: `src/core/gate-engine/`

### [P1] 追溯 ID 14 类：业务链路 FR/DS/TASK/TC/RFC + V-Model + Feature

```
业务链路:  FR → DS → TASK → TC
          ↘ RFC ↗

V-Model:  REQ → SYS → ARCH → MOD
          ATP   STP   ITP    UTP

顶层:     Feature
```

- **理由**: 实现规范驱动，任何实现可追溯到对应规范定义
- **证据**: `src/core/trace-engine/`

---

## 测试规则

### [P1] 覆盖率阈值：lines/functions/statements 75%, branches 65%

- **理由**: 保证测试质量基线
- **证据**: `CLAUDE.md`, `vitest.config`

### [P2] 测试结构：unit / integration / e2e / benchmark / fixtures

```
tests/
├── unit/          # 单元测试
├── integration/   # 集成测试
├── e2e/           # 端到端测试
├── benchmark/     # 性能基准
└── fixtures/      # 测试固件
```

- **理由**: 分层测试策略，支持不同粒度的质量保障
- **证据**: `tests/`

---

## 优先级汇总

| 优先级 | 数量 | 说明 |
|--------|------|------|
| P0 | 5 | 必须遵守，违反会导致严重问题 |
| P1 | 4 | 强烈建议，影响代码质量 |
| P2 | 1 | 推荐遵守，最佳实践 |
