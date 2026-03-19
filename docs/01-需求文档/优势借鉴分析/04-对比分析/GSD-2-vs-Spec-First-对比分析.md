# GSD-2 vs Spec-First 对比分析报告

> **分析日期**: 2026-03-15
> **对比版本**:
> - **GSD-2**: v2.10.12
> - **Spec-First**: v1.0.4

---

## 一、项目定位对比

### 1.1 核心定位

| 维度 | GSD-2 | Spec-First |
|------|-------|------------|
| **定位** | 独立编码代理应用 | 全链路研发闭环引擎 |
| **本质** | CLI 应用 (Pi SDK) | CLI + 状态机引擎 |
| **目标用户** | AI 重度用户 | 规范驱动团队 |
| **核心理念** | 真正的自动化 | 规范可追溯 |
| **代码量** | ~14,000+ 行 TS (核心) | ~28,800 行 TS |
| **运行方式** | 独立二进制 | npm 全局 CLI |

### 1.2 一句话总结

```
GSD-2:     "真正的自动化代理 — 用户可离开"
Spec-First: "规范驱动引擎 — 每步可追溯"
```

---

## 二、架构对比

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            架构对比                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  GSD-2 (独立代理应用)                   Spec-First (规范引擎)             │
│  ┌─────────────────────┐               ┌─────────────────────┐          │
│  │   gsd CLI Binary    │               │   spec-first CLI    │          │
│  │   (Pi SDK Runtime)  │               │   (npm 全局包)      │          │
│  └──────────┬──────────┘               └──────────┬──────────┘          │
│             │                                     │                      │
│             ▼                                     ▼                      │
│  ┌─────────────────────┐               ┌─────────────────────┐          │
│  │  14 内置扩展         │               │  14 核心模块         │          │
│  │  ├── gsd (3,463 行) │               │  ├── process-engine │          │
│  │  ├── browser-tools  │               │  ├── gate-engine    │          │
│  │  ├── search-the-web │               │  ├── trace-engine   │          │
│  │  └── ...            │               │  └── ...            │          │
│  └─────────────────────┘               └─────────────────────┘          │
│             │                                     │                      │
│             ▼                                     ▼                      │
│  ┌─────────────────────┐               ┌─────────────────────┐          │
│  │  状态机驱动          │               │  Gate 校验驱动       │          │
│  │  (auto.ts 3,463 行) │               │  (19 条条件)        │          │
│  └─────────────────────┘               └─────────────────────┘          │
│                                                                          │
│  特点: 完全自主、用户可离开             特点: 规范强制、每步可追溯        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 依赖对比

| 维度 | GSD-2 | Spec-First |
|------|-------|------------|
| **运行时依赖** | Pi SDK, Playwright, Sharp | 无外部依赖 |
| **平台原生** | 5 个平台二进制 | 无 |
| **Node 版本** | ≥20.6.0 | ≥20.0.0 |
| **安装大小** | ~100MB+ (含原生) | ~1MB |

---

## 三、工作流对比

### 3.1 自动化程度对比

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          自动化程度对比                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  GSD-2: 完全自主                         Spec-First: 命令驱动            │
│                                                                          │
│  用户 → /gsd auto ──────────────────┐    用户 → /spec-first:spec        │
│           │                         │              │                    │
│           ▼                         │              ▼                    │
│  ┌─────────────────┐                │    ┌─────────────────┐            │
│  │  状态机读取磁盘  │                │    │  生成 spec.md   │            │
│  └────────┬────────┘                │    └────────┬────────┘            │
│           │                         │              │                    │
│           ▼                         │              ▼                    │
│  ┌─────────────────┐                │    Gate 校验 → 通过?              │
│  │  新 Session     │                │              │                    │
│  │  注入 Prompt    │                │              ▼                    │
│  └────────┬────────┘                │    用户 → /spec-first:design      │
│           │                         │              │                    │
│           ▼                         │              ▼                    │
│  ┌─────────────────┐                │    生成 design.md                 │
│  │  LLM 执行任务    │                │              │                    │
│  └────────┬────────┘                │              ▼                    │
│           │                         │    Gate 校验 → 通过?              │
│           ▼                         │              │                    │
│  ┌─────────────────┐                │              ▼                    │
│  │  写入磁盘状态    │                │    用户确认继续                   │
│  └────────┬────────┘                │              │                    │
│           │                         │              ▼                    │
│           ▼                         │    ...重复每步...                 │
│  ┌─────────────────┐                │                                   │
│  │  循环直到完成    │◀───────────────┘                                   │
│  └─────────────────┘                                                    │
│                                                                          │
│  完全自主 - 用户可以离开                  需要用户每步确认                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 工作流阶段对比

| 阶段 | GSD-2 | Spec-First |
|------|-------|------------|
| **初始化** | `/gsd` 交互式 | `/spec-first:init` |
| **Research** | `research` 单元 (自动) | `/spec-first:research` |
| **Plan** | `plan_slice` 单元 (自动) | `/spec-first:task` |
| **Execute** | `execute_task` 单元 (自动) | `/spec-first:code` |
| **Complete** | `complete_slice` 单元 (自动) | `/spec-first:verify` |
| **推进** | 自动 (状态机) | 手动 (`stage advance`) |

### 3.3 状态管理对比

| 维度 | GSD-2 | Spec-First |
|------|-------|------------|
| **状态存储** | `.gsd/STATE.md` (派生) | `stage-state.json` (持久) |
| **状态源** | 磁盘文件 (只读派生) | 状态机 (可写) |
| **阶段定义** | Milestone → Slice → Task | Stage 枚举 (8+2) |
| **推进方式** | 状态机自动 | CLI 命令 + Gate |
| **可逆性** | 不可逆 | 不可逆 |

---

## 四、核心功能对比

### 4.1 功能矩阵

| 功能 | GSD-2 | Spec-First | 说明 |
|------|:-----:|:----------:|------|
| **真正的 Auto Mode** | ✅ | ❌ | GSD-2 状态机完全自主 |
| **Gate 校验** | ❌ | ✅ 19 条 | Spec-First 强制质量门禁 |
| **追溯 ID 体系** | ❌ | ✅ 14 类 | Spec-First 完整追溯 |
| **覆盖率矩阵** | ❌ | ✅ 5 项 | C3/C4/C6/C8/C9 |
| **崩溃恢复** | ✅ | ✅ | 都有 Session 恢复 |
| **Stuck 检测** | ✅ | ✅ | 都有重试机制 |
| **成本追踪** | ✅ | ❌ | GSD-2 有 Dashboard |
| **超时监督** | ✅ 三层 | ❌ | GSD-2 soft/idle/hard |
| **Dashboard** | ✅ | ❌ | GSD-2 有实时覆盖层 |
| **多模型支持** | ✅ 20+ | ❌ | GSD-2 支持多 Provider |
| **浏览器工具** | ✅ Playwright | ❌ | GSD-2 内置 |
| **语音输入** | ✅ | ❌ | GSD-2 macOS/Linux |
| **Worktree 管理** | ✅ | ❌ | GSD-2 完整生命周期 |
| **Git 策略** | ✅ branch-per-slice | ❌ | GSD-2 自动分支管理 |
| **从 v1 迁移** | ✅ | ❌ | GSD-2 有迁移工具 |
| **Skill 系统** | ❌ | ✅ 21 个 | Spec-First Skill 分发 |
| **Defect/RFC** | ❌ | ✅ | Spec-First 变更管理 |
| **PRD 评分** | ❌ | ✅ | Spec-First 需求质量 |

### 4.2 自动化能力对比

| 自动化维度 | GSD-2 | Spec-First |
|------------|-------|------------|
| **任务派发** | 自动 (状态机) | 手动 (命令) |
| **上下文隔离** | 自动 (新 Session) | 手动 (Subagent) |
| **Git 提交** | 自动 (每任务) | 手动 |
| **分支管理** | 自动 (branch-per-slice) | 无 |
| **状态推进** | 自动 | 手动 + Gate |
| **成本控制** | 自动 (预算上限) | 无 |
| **Stuck 恢复** | 自动 (重试+诊断) | 手动 |
| **超时处理** | 自动 (三层超时) | 无 |

### 4.3 扩展能力对比

**GSD-2 内置扩展** (14 个):
| 扩展 | 功能 |
|------|------|
| gsd | 核心工作流 + 自动模式 |
| browser-tools | Playwright 自动化 |
| search-the-web | Brave/Tavily/Jina |
| google-search | Gemini 搜索 |
| context7 | 库文档 |
| bg-shell | 后台进程 |
| subagent | 委托任务 |
| mac-tools | macOS 自动化 |
| mcporter | MCP 集成 |
| voice | 语音转文字 |
| slash-commands | 自定义命令 |
| lsp | 语言服务器 |
| ask-user-questions | 结构化输入 |
| secure-env-collect | 密钥收集 |

**Spec-First 内置 Skills** (21 个):
| Skill | 功能 |
|-------|------|
| 00-first | 项目快速认知 |
| 01-init | Feature 初始化 |
| 03-spec | 需求规格 |
| 04-design | 技术设计 |
| 06-task | 任务拆解 |
| 07-code | 代码实现 |
| 08-review | 代码审查 |
| 12-verify | 阶段验收 |
| 13-orchestrate | 编排执行 |
| ... | ... |

---

## 五、关键差异详解

### 5.1 Auto Mode vs 命令驱动

**GSD-2 Auto Mode**:
```typescript
// auto.ts - 3,463 行状态机
while (active && !paused) {
  const state = deriveState(basePath);  // 从磁盘派生状态

  switch (state.phase) {
    case 'research':
      await dispatchResearch(state);
      break;
    case 'plan_slice':
      await dispatchPlanSlice(state);
      break;
    case 'execute_task':
      await dispatchExecuteTask(state);
      break;
    case 'complete_slice':
      await dispatchCompleteSlice(state);
      break;
  }
  // 自动循环，无需用户干预
}
```

**Spec-First 命令驱动**:
```bash
# 用户手动执行每个阶段
spec-first gate check --feature FSREQ-001 --stage 03_plan
spec-first stage advance --feature FSREQ-001
# 每步需要用户确认
```

### 5.2 崩溃恢复

**GSD-2**:
```typescript
// crash-recovery.ts
const lock = readCrashLock(basePath);
if (lock && isLockProcessAlive(lock.pid)) {
  // 会话仍在运行
} else if (lock) {
  // 崩溃恢复
  const recovery = synthesizeCrashRecovery(basePath);
  pendingCrashRecovery = recovery;
}
```

**Spec-First**:
```typescript
// ai-orchestrator/retry-controller.ts
const retryState = loadRetryState();
if (retryState.attemptCount < MAX_RETRIES) {
  // 自动重试
  await executeWithRetry(task, retryState);
}
```

### 5.3 成本追踪

**GSD-2**:
```typescript
// metrics.ts
interface UnitMetrics {
  inputTokens: number;
  outputTokens: number;
  cost: number;
  model: string;
  phase: string;
}

// 实时 Dashboard 显示
const totals = getProjectTotals(basePath);
// 支持预算上限
if (totals.cost >= budgetCeiling) {
  pauseAutoMode();
}
```

**Spec-First**: 无内置成本追踪

### 5.4 超时监督

**GSD-2** (三层超时):
```typescript
// auto.ts
const config = resolveAutoSupervisorConfig(preferences);
// soft_timeout_minutes: 20 - 警告 LLM 收尾
// idle_timeout_minutes: 10 - 检测停滞
// hard_timeout_minutes: 30 - 强制暂停
```

**Spec-First**: 无超时监督

---

## 六、产物体系对比

### 6.1 文件产物

| 产物类型 | GSD-2 | Spec-First |
|----------|-------|------------|
| **项目描述** | `PROJECT.md` | `project.md` |
| **决策记录** | `DECISIONS.md` | (内置于 spec) |
| **状态快照** | `STATE.md` (派生) | `stage-state.json` |
| **路线图** | `{milestone}-ROADMAP.md` | `roadmap.md` |
| **阶段计划** | `{slice}-PLAN.md` | `task_plan.md` |
| **任务摘要** | `{task}-SUMMARY.md` | `reports/` |
| **UAT** | `{slice}-UAT.md` | (内置) |
| **配置** | `preferences.md` | `feature.yaml` |
| **追溯矩阵** | ❌ | `traceability-matrix.md` |
| **度量** | `metrics.json` | ❌ |

---

## 七、优劣势分析

### 7.1 GSD-2 优势

| 优势 | 说明 |
|------|------|
| ✅ **真正自动化** | 状态机驱动，用户可离开 |
| ✅ **成本追踪** | Dashboard + 预算控制 |
| ✅ **三层超时** | soft/idle/hard 监督 |
| ✅ **多模型支持** | 20+ Provider |
| ✅ **浏览器工具** | 内置 Playwright |
| ✅ **语音输入** | macOS/Linux |
| ✅ **Git 自动化** | branch-per-slice + squash |
| ✅ **Worktree 管理** | 完整生命周期 |
| ✅ **扩展丰富** | 14 个内置扩展 |
| ✅ **独立运行** | 不依赖 Claude Code |

### 7.2 GSD-2 劣势

| 劣势 | 说明 |
|------|------|
| ❌ **无 Gate 校验** | 质量依赖 LLM 判断 |
| ❌ **无追溯体系** | 无法追踪需求到实现 |
| ❌ **无覆盖率** | 无度量指标 |
| ❌ **安装复杂** | 需要原生二进制 |
| ❌ **学习曲线** | Pi SDK 概念多 |

### 7.3 Spec-First 优势

| 优势 | 说明 |
|------|------|
| ✅ **Gate 校验** | 19 条质量门禁 |
| ✅ **追溯体系** | 14 类 ID 完整追溯 |
| ✅ **覆盖率矩阵** | 5 项覆盖率指标 |
| ✅ **Skill 系统** | 21 个可复用 Skill |
| ✅ **变更管理** | Defect + RFC |
| ✅ **轻量安装** | npm 全局包 |
| ✅ **规范强制** | CLI 保护状态文件 |
| ✅ **PRD 评分** | 需求质量评估 |

### 7.4 Spec-First 劣势

| 劣势 | 说明 |
|------|------|
| ❌ **无真正自动化** | 每步需手动触发 |
| ❌ **无成本追踪** | 无 Dashboard |
| ❌ **无超时监督** | 依赖用户监控 |
| ❌ **无浏览器工具** | 无内置自动化 |
| ❌ **无 Git 自动化** | 需手动管理 |

---

## 八、场景选型建议

### 8.1 选型决策树

```
                         需要无人值守自动化？
                              │
              ┌───────────────┴───────────────┐
              │                               │
             是                               否
              │                               │
              ▼                               ▼
          GSD-2                         Spec-First
              │                               │
              │                    ┌──────────┴──────────┐
              │                    │                     │
              │               需要追溯/审计?        快速迭代?
              │                    │                     │
              │                   是                     │
              │                    │                     │
              │                    ▼                     ▼
              │               Spec-First           两者皆可
```

### 8.2 场景推荐表

| 场景 | 推荐 | 原因 |
|------|------|------|
| **无人值守开发** | GSD-2 | 状态机自动化 |
| **企业合规** | Spec-First | Gate + 追溯 |
| **成本敏感** | GSD-2 | Dashboard + 预算 |
| **审计需求** | Spec-First | 完整追溯链 |
| **多工具集成** | GSD-2 | 14 个扩展 |
| **团队规范** | Spec-First | 强制 Gate |
| **浏览器自动化** | GSD-2 | 内置 Playwright |
| **需求质量** | Spec-First | PRD 评分 |

---

## 九、借鉴建议

### 9.1 Spec-First 可借鉴 (P0)

| 特性 | 来源 | 借鉴方式 |
|------|------|----------|
| **Auto Mode 状态机** | GSD-2 `auto.ts` | 实现阶段自动推进 |
| **成本追踪** | GSD-2 `metrics.ts` | 增加基础 Dashboard |
| **三层超时监督** | GSD-2 `auto.ts` | 增加超时机制 |
| **Git 自动化** | GSD-2 `git-service.ts` | 自动 commit + branch |

### 9.2 Spec-First 可借鉴 (P1)

| 特性 | 来源 | 借鉴方式 |
|------|------|----------|
| **Worktree 管理** | GSD-2 | 增加隔离开发环境 |
| **多模型支持** | GSD-2 | 扩展 Provider |
| **浏览器工具** | GSD-2 | 集成 Playwright |
| **Dashboard 覆盖层** | GSD-2 | 实时状态显示 |

### 9.3 GSD-2 可借鉴 (P0)

| 特性 | 来源 | 借鉴方式 |
|------|------|----------|
| **Gate 校验** | Spec-First | 增加质量门禁 |
| **追溯 ID** | Spec-First | 增加 ID 体系 |
| **覆盖率矩阵** | Spec-First | 增加度量指标 |

### 9.4 GSD-2 可借鉴 (P1)

| 特性 | 来源 | 借鉴方式 |
|------|------|----------|
| **Skill 系统** | Spec-First | 可复用任务模板 |
| **Defect/RFC** | Spec-First | 变更管理 |
| **PRD 评分** | Spec-First | 需求质量评估 |

---

## 十、总结

### 10.1 核心差异

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           核心差异总结                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  GSD-2: "真正的自动化代理"                                               │
│  ├── 独立 CLI 应用                                                       │
│  ├── 状态机完全自主                                                      │
│  ├── 用户可离开                                                          │
│  ├── 丰富的工具集成                                                       │
│  └── 适合: 需要无人值守开发的场景                                         │
│                                                                          │
│  Spec-First: "规范驱动引擎"                                              │
│  ├── 命令驱动 CLI                                                        │
│  ├── Gate 校验强制质量                                                   │
│  ├── 追溯体系保证合规                                                    │
│  ├── Skill 系统可复用                                                    │
│  └── 适合: 需要审计合规的企业场景                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 定位关系

```
自动化程度
    │
    │                    GSD-2
    │                       ★
    │                       │
    │                       │
    │         Spec-First    │
    │              ★────────┘
    │              │
    │              │
    │              │
    └──────────────┴──────────────────▶ 规范程度
               低              高
```

### 10.3 最终建议

| 场景 | 推荐 | 原因 |
|------|------|------|
| **无人值守开发** | GSD-2 | 状态机自动化 |
| **企业合规** | Spec-First | Gate + 追溯 |
| **成本敏感** | GSD-2 | Dashboard + 预算 |
| **审计需求** | Spec-First | 完整追溯链 |
| **多工具集成** | GSD-2 | 14 个扩展 |
| **团队规范** | Spec-First | 强制 Gate |

---

*分析完成于 2026-03-15*
