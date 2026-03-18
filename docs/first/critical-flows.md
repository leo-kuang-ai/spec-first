# 关键流程

> 生成时间: 2026-03-17 | 模式: deep

## 核心流程

### 1. Stage Advance Flow

**触发**: `spec-first stage advance --feature <featureId>`

**证据**: `src/core/process-engine/advance.ts` — `[显式]`

**步骤**:

1. **Validate current stage** — 验证当前阶段状态
2. **Evaluate Gate conditions** — 执行门禁条件评估
3. **Check dependencies** — 检查依赖关系
4. **Sync agent context** — 同步 AI 代理上下文
5. **Update stage state** — 更新阶段状态

**关键点**:
- Gate 条件必须全部 passing 才能 advance
- 阶段转换是单向不可逆的
- 失败时返回 `GATE_FAILED` 退出码

---

### 2. Gate Check Flow

**触发**: `spec-first gate check --feature <featureId>`

**证据**: `src/core/gate-engine/gate-evaluator.ts` — `[显式]`

**步骤**:

1. **Load Gate conditions** — 加载门禁条件配置
2. **Load artifacts** — 加载产物文件
3. **Evaluate each condition** — 逐条评估条件
4. **Calculate coverage** — 计算覆盖率指标
5. **Generate report** — 生成评估报告

**关键点**:
- 19 条条件：16 blocking + 3 warning
- Blocking 条件必须全部通过
- Warning 条件仅提示，不阻塞

---

### 3. Skill Dispatch Flow

**触发**: Skill 命令接收

**证据**: `src/core/skill-runtime/dispatcher.ts` — `[显式]`

**步骤**:

1. **Parse command** — 解析命令参数
2. **Resolve skill path** — 解析 Skill 路径（三层路由）
3. **Load skill definition** — 加载 Skill 定义文件
4. **Render prompt** — 渲染提示词模板
5. **Execute skill** — 执行 Skill

**关键点**:
- 三层路由：Semantic Map → Runtime Route → Skill File
- Hard-gate 校验在执行前进行
- 20 个 Skill 可用

## 风险区域

### State Management

| 风险 | 缓解措施 | 证据 |
|------|----------|------|
| 手动编辑 stage-state.json 会导致状态机损坏 | 使用 CLI 命令操作 | `CLAUDE.md` — `[显式]` |

### Coverage Metrics

| 风险 | 缓解措施 | 证据 |
|------|----------|------|
| C4 (TC coverage) 不支持传递链，只做严格 FR 覆盖 | 使用 C3 (TASK coverage) 进行传递验证 | `src/core/trace-engine/coverage.ts:62-65` — `[显式]` |

### Gate Bypass

| 风险 | 缓解措施 | 证据 |
|------|----------|------|
| Waiver 可以绑过关键质量检查 | 在 gate-history/ 中追踪 waivers | `CLAUDE.md` — `[推断]` |

## 流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    Stage Advance Flow                        │
├─────────────────────────────────────────────────────────────┤
│  CLI → process-engine → gate-engine → trace-engine           │
│       ↓                ↓                ↓                    │
│  validateStage    evaluateGate    checkCoverage              │
│       ↓                ↓                ↓                    │
│  ┌─────────────────────────────────────────┐                │
│  │         Gate Conditions (19)            │                │
│  │  16 blocking + 3 warning               │                │
│  └─────────────────────────────────────────┘                │
│       ↓                                                      │
│  stage-machine/transition()                                  │
└─────────────────────────────────────────────────────────────┘
```
