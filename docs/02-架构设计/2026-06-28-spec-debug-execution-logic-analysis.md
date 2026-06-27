# spec-debug 执行逻辑深度分析报告

**生成日期**：2026-06-28  
**源文件**：`skills/spec-debug/SKILL.md`（402 行）+ `references/`（4 份）  
**版本**：v1.12.0（包含 002 plan 借鉴 diagnosing-bugs 的升级）

---

## 一、定位与触发

### 1.1 skill 定位

`spec-debug` 是 spec-first 体系的**公开 debug workflow 入口**（`/spec:debug`），定位是"系统性找根因并修复"。它不只是诊断纪律，而是一条**端到端的工作流**，覆盖 bug 的完整闭环：

```
输入解析 → 复现 → 根因 → 修复 → 移交/开 PR → 可选知识沉淀
```

### 1.2 触发词（frontmatter description）

宿主在会话启动时按以下触发词 match：

- `debug this` / `why is this failing` / `fix this bug` / `trace this error`
- `why is this slow`（新增）
- `performance regression`（新增）
- 粘贴 stack trace、error message、issue reference

### 1.3 适用范围

**用于**：
- failing tests / runtime errors / broken behavior / regressions
- stack traces / issue references（GitHub / Jira / Linear）
- 反复修复失败、卡住的问题

**不用于**：
- 计划中的 feature 实现（→ `spec-work`）
- requirements/plan review（→ `spec-plan`）
- setup/runtime drift 修复（→ `spec-mcp-setup`）
- 显而易见的非 bug 增强

---

## 二、核心原则

每个 phase 的决策点都会重复这 4 条，因为它们在压力最大时最容易被跳过：

1. **先调查再修复** — 不能在解释完整因果链之前提修复方案。"X 不知为何导致 Y"是一个 gap。
2. **不确定环节需预测** — 因果链中不确定的环节必须给出可证伪预测。预测错而修复"work"= 找到的是症状不是原因。
3. **一次只改一件事** — 同时改多个就是 shotgun debugging。
4. **卡住时诊断原因，不要硬撑** — 诊断"为什么卡住"，而不是第 4 次尝试同一思路。

---

## 三、执行流程总览

```
Phase 0: Triage（解析输入）
    ↓
[Feedback Loop 构建]（贯穿 Phase 1-2）
    ↓
Phase 1: Investigate（复现 + 环境核对 + 代码追踪）
    ↓
Phase 2: Root Cause（假设 + 预测 + 因果链 gate）
    ↓ 用户选择：Fix it now / Diagnosis only / Rethink design
Phase 3: Fix（可选，test-first + workspace safety）
    ↓
Phase 4: Handoff（Debug Summary + cleanup + PR/commit）
    ↓（可选）
spec-compound（知识沉淀）
```

所有 phase **自适配规模**——简单 bug 秒级流过，复杂 bug 在每个 phase 自然停留更长时间。无复杂度分类，不允许跳阶段。

---

## 四、Feedback Loop 纪律（贯穿全流程）

### 4.1 构建优先级（10 种手段，按顺序尝试）

| # | 手段 | 适用场景 |
|---|---|---|
| 1 | Failing test（单元/集成/e2e） | 首选，任何有测试缝的 bug |
| 2 | Curl / HTTP script | API 层 bug |
| 3 | CLI invocation + snapshot diff | 命令行工具 bug |
| 4 | Headless browser（Playwright/Puppeteer） | UI bug |
| 5 | Replay captured trace | 生产请求 replay |
| 6 | Throwaway harness | 无法直接测试的代码路径 |
| 7 | Property / fuzz loop | "有时候结果错误"类 bug |
| 8 | Bisection harness（git bisect run） | 回归定位 |
| 9 | Differential loop | 新旧版本对比 |
| 10 | HITL bash script（人工操作） | 最后手段，需人点击 |

### 4.2 无法建环时的二分路径

```
无法建环
├── 无任何捕获证据（无 trace / payload / 录屏 / core dump）
│   → stop 并说明
│   → 向用户索取：(a) 环境访问 (b) 捕获产物 (c) 生产埋点许可
│   → 在获得之一前：不得提交 root-cause-confirmed 声明
│                   不得关闭 causal chain gate
│   → AFK 时：记录 feedback_loop_not_possible(reason=no_loop_no_evidence)
│             因果链标 degraded/advisory，以未确认假设结束
│
└── 有捕获证据（trace / error payload / 录屏存在）
    → 记录 feedback_loop_not_possible + 缺失条件
    → 用 bounded evidence 继续
    → 不把未独立确认的因果链接提升为 confirmed
```

### 4.3 反馈环就绪清单（4 项）

命名一个命令，且**已实际跑过一次**（贴调用与输出）：

- **Red-capable**：驱动真实 bug 代码路径，断言用户精确症状，能在此 bug 上变红、修复后变绿
- **Deterministic**：每次同样判定（flaky bug：固定高复现率）
- **Fast**：秒级
- **Agent-runnable**：无人值守可运行（HITL 是人工操作的最后手段，不算 agent-runnable）

**关键原则**：在 red-capable 命令存在前就开始读代码猜原因 = 本 skill 要阻止的失败模式。

### 4.4 假设 ledger

维护轻量假设 ledger（非持久 schema）：
- `hypothesis` / `prediction` / `evidence_for` / `evidence_against` / `probe_result` / `final_root_cause`

证据必须来自：复现、源码读取、测试、日志、运行时值、diff、用户提供的产物。
