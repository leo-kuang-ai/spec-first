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

---

## 五、Phase 0：Triage（解析输入）

### 5.1 issue tracker 输入

```
GitHub #123 / org/repo#123 / URL
→ gh issue view <number> --json title,body,comments,labels
→ 必须读完整评论线程（最新评论最重要）
→ 提取：症状 / 期望行为 / 复现步骤 / 环境细节

Linear / Jira / 其他 tracker
→ 尝试 MCP tools 或直接抓取 URL
→ fetch 失败 → 请用户粘贴完整内容

未经处理的格式（stack trace / error message / 描述）
→ 直接进 Phase 1
```

### 5.2 默认不问问题

- 默认先调查（读代码、跑测试、追踪错误）
- **唯一例外**：用户说"之前试过"（"keeps failing" / "stuck"）→ 先问已试过什么，避免重复失败路径

### 5.3 docs/solutions/ 召回

默认在 Phase 0 扫描 `docs/solutions/` frontmatter（廉价），看是否有相同问题的历史记录：
- 命中 → 作为诊断指针，不是根因证明
- **trivial-bug fast-path**（单文件 typo / missing import / null dereference / off-by-one）→ 跳过召回

---

## 六、Phase 1：Investigate（调查）

### 6.1 Phase 1.1 — 复现

**复现 = 声明验证 gate**：reporter 的步骤不能复现或描述不足 → `needs-info` 信号，在深度追踪前先 surface 出来。

**特殊路由**：

| 场景 | 路由 |
|---|---|
| 性能回归（变慢，非报错） | **Perf 分支**：先建基线测量，走 `references/perf-regression.md`（先量后修 / 统计计时 / bisection） |
| 浏览器 bug | 优先 `agent-browser`，次选 MCP browser tools |
| 需要人工操作的复现条件 | 通过 `scripts/hitl-loop.template.sh` 结构化引导用户 |
| 2-3 次不能复现 | 读 `references/investigation-techniques.md` → 目标：提复现率，而非等干净复现 |
| 完全不能复现 | 记录已试手段，应用 Feedback Loop 二分 |

**Perf 分支详情**（`references/perf-regression.md`）：
```
基线测量（p50/p95，N=10-20 次采样）
→ 环境隔离（Linux: cpupower frequency-set; darwin: pmset）
→ git bisect + timing wrapper
  - 明确阈值（如 p95 > baseline × 1.15 = bad）
  - 噪声带内 → exit 125（skip，不硬判）
→ 先量后修
```

### 6.2 Phase 1.2 — 环境健全性

在深度代码追踪前确认：
- 分支正确 / 无意外未提交改动
- 依赖已安装且为最新（stale `node_modules` 是常见假线索）
- 运行时版本匹配（`.tool-versions` / `.nvmrc` / `Gemfile`）
- 必要 env vars 存在且非空
- 无陈旧构建产物（`dist/` / `.next/`）
- 依赖本地服务运行中（DB / cache / queue）

### 6.3 Phase 1.3 — 追踪代码路径

从错误点反向追溯：
```
从错误出发
→ "这个值从哪来？谁调用了这里？"
→ 持续上溯直到找到坏状态首次产生的地方
→ 不在第一个"看起来有问题"的函数停下
  （根因是坏状态的起源，不是首次被观察到的地方）
```

追踪时同步检查：
- `git log --oneline -10 -- [file]`（近期变更）
- 如果是回归 → `git bisect`
- 观测工具：Sentry / Datadog / AppSignal / 应用日志 / 浏览器控制台 / DB 状态

### 6.4 Phase 1.4 — Trivial bug fast-path 判断

满足以下全部条件才走 fast-path：
1. 缺陷局限于一个明显位置
2. 观察值或报错直接指向有问题的行
3. 因果链无不确定环节
4. 一个聚焦的测试能证明修复

**不适用 fast-path**：多文件因果链、架构回归、状态竞争、权限/环境失败、flaky 行为。

---

## 七、Phase 2：Root Cause（根因）

### 7.1 假设审计（假设形成前）

列出"这必须为真"的 belief，每条标 `verified`（已读代码/运行验证）或 `assumed`（未验证）。假设是 stuck 最常见来源，很多"错误假设"实际上是"正确假设 + 错误前提"。

### 7.2 形成排序假设

每个假设必须包含：
- 什么在哪里出了问题（file:line）
- **具体观察**：运行时值 / log 行 / instrumented boundary / working comparison / 特定代码引用
- 因果链：触发器如何一步步导致观察到的症状
- 对于**不确定的链接**：给出预测（某个不同代码路径或场景中必须也为真的事情）

**预测原则**：预测是测试不确定环节的工具，不是每个假设都必须有预测的仪式。明显因果链（missing import / null dereference）链解释本身就是 gate。

### 7.3 Causal Chain Gate

**不能进 Phase 3**，直到能从原始触发器到观察症状无 gap 地解释完整因果链。用户可以显式授权在 investigation 卡住时用最佳可用假设继续。

### 7.4 Present findings + 用户选择

Phase 2 结束时展示根因摘要，并通过 blocking question tool 给三选项：

| 选项 | 含义 |
|---|---|
| **Fix it now** | 进 Phase 3 |
| **Diagnosis only — I'll take it from here** | 跳过 Phase 3，直接 Phase 4 summary |
| **Rethink the design** | 根因揭示设计问题，交给 brainstorm entrypoint |

何时建议 brainstorm：
- 根因是错误的责任边界/接口（不是错误逻辑）
- 需求本身错误（系统行为符合设计，但设计不符合实际需求）
- 每个修复都是 workaround（没有干净修复，因为周边代码建立在不再成立的假设上）

### 7.5 Smart Escalation

2-3 个假设耗尽后诊断为什么：

| 模式 | 诊断 | 下一步 |
|---|---|---|
| 假设指向不同子系统 | 架构/设计问题，不是局部 bug | 展示发现，建议 brainstorm |
| 证据自相矛盾 | 代码心智模型错误 | 退回，去掉假设重新读代码路径 |
| 本地好、CI/生产坏 | 环境问题 | 聚焦环境差异、config、依赖、时序 |
| 修复 work 但预测错了 | 找到症状不是根因 | 真正原因仍存在，继续调查 |

**并行调查选项**：假设被证据瓶颈分散在独立子系统时，可以并行 dispatch 只读 sub-agent，各持一个假设 + 结构化证据返回格式。

**假设重排（折叠进 smart escalation 时刻）**：3+ 竞争假设在 smart escalation 时，把排序清单展示给用户作为廉价 checkpoint（骑在已有升级动作上，不是新中断点）。单假设或明显 bug 不展示；用户 AFK 则按自己排序继续。

---

## 八、Phase 3：Fix（修复）

### 8.1 前置检查

```
git status → 若有未暂存改动，确认再编辑
当前分支是默认分支？→ 建议创建 feature branch
  git rev-parse --abbrev-ref origin/HEAD | sed 's@origin/@@'
  → 自动 checkout -b <name-from-bug>
```

### 8.2 Test-first 8 步

```
1. 读附近或项目级测试约定，匹配现有风格/fixture/命令
2. 判断 correct seam（写失败测试前）
   ├── 有正确 seam → 在真实调用点写失败测试
   ├── 只有浅层 seam → 仍写，但标注"仅锁该层"
   │                     架构缺口标为 blocking advisory
   │                     PR body 必须说明并给 tracking issue
   └── 完全没有 seam → 记录"无 seam = 架构发现"，不写假测试
3. 写失败测试（在选定的 seam）
4. 验证它因正确原因失败（不是无关 setup）
5. 实现最小修复（只处理根因）
6. 验证测试通过
7. 逐行 self-review + 清理 tagged debug logs（grep 唯一前缀）
8. 跑更广回归测试套件
```

**Correct Seam 判断原则**（"lock what you can, flag what you can't"）：
- 浅层测试有价值（能锁住该层），但不能给假信心（不能吞掉架构 flag）
- 仅在**完全不存在任何能失败-for-right-reason 的缝**时才整体跳过

### 8.3 3 次修复失败 = Smart Escalation

三次修复失败后：
- 不继续堆叠修复尝试
- 记录被证伪的证据（哪个预测失败 / 哪个假设被排除）
- 返回 Phase 2 重新确认根因

### 8.4 条件性 Defense-in-Depth

触发条件：根因模式在 3+ 文件中出现，或 bug 若到生产会是灾难性的。

四层模型（`references/defense-in-depth.md`）：
1. **Entry validation** — 在 API 边界拒绝明显无效输入
2. **Invariant check** — 在操作前强制数据有意义
3. **Environment guard** — 在错误上下文中拒绝危险操作
4. **Diagnostic breadcrumb** — 在危险操作前捕获取证上下文（永久保留，不是临时 debug log）

### 8.5 条件性 Post-mortem

触发条件：bug 在生产出现过，或模式在 3+ 处出现。
分析引入方式和存活原因，识别系统性 gap。

---

## 九、Phase 4：Handoff（移交）

### 9.1 Debug Summary（始终先写）

```markdown
## Debug Summary
**Problem**: [What was broken]
**Root Cause**: [Full causal chain, with file:line references]
**Recommended Tests**: [specific file + assertion guidance]
**Direct evidence**:
  - claims_validated_by: [哪些事实确认了因果链]
  - claims_remaining_advisory: [哪些链接未独立确认]
**Fix**: [What was changed — or "diagnosis only"]
**Prevention**: [Test coverage added; defense-in-depth if applicable]
**Confidence**: [High/Medium/Low]
```

用 `verification-run-summary.v1` 而非 freeform "tests passed"。

### 9.2 Cleanup Checklist（收尾卫生）

- [ ] 所有 tagged debug logs（唯一前缀如 `[DEBUG-a4f2]`）已 grep 清除
- [ ] 一次性原型已删除或移到标记位置
- [ ] 正确假设写入 commit / PR message
- [ ] correct-seam gap（若有）已在 Debug Summary 的 `claims_remaining_advisory` 或 Prevention 标为 blocking advisory + PR body 明示

### 9.3 后续动作

**Phase 3 skipped（diagnosis only）**：写完 summary 即停，用户已说明自己接手。

**Phase 3 ran（skill 自建分支）**：
```
→ 检查是否有 "always review before pushing" / "PRs as drafts" 等覆盖项
→ 预览将提交什么、在哪个分支
→ 运行 git-commit-push-pr（含 issue close syntax：Fixes #N）
→ 展示 PR URL
```

**Phase 3 ran（预存分支）**：
```
→ AskUserQuestion 问下一步
  1. Commit and open a PR
  2. Commit the fix（仅本地）
  3. Stop here
```

### 9.4 知识沉淀决策

| 场景 | 动作 |
|---|---|
| 机械修复，无可泛化洞见 | 默认跳过，不主动提 |
| 可一句话说清的教训 | 中性提供 spec-compound |
| 模式在 3+ 处出现 / 暴露共享依赖的错误假设 | 倾向提供 spec-compound |

用户接受 → 运行 `spec-compound` → 把 learning doc commit 到同一分支并 push，PR 自动包含。

---

## 十、特殊场景处理

### 10.1 反模式（`references/anti-patterns.md` 涵盖）

| 反模式 | 表现 | 防御 |
|---|---|---|
| Shotgun debugging | 同时改多个看"是否有帮助" | 一次一个假设，回退再试下一个 |
| Confirmation bias | 把模糊证据读成支持当前假设 | 问"什么会证伪这个假设？" |
| "It works now, move on" | 改了某东西，bug 消失 | 能解释 why 才算修好 |
| Certainty without evidence | 读代码前就"知道"是什么 | 必须读相关源码，即使很有把握 |
| Minimizing scope | "可能只是…" | "just" = 假设问题很小，卡了几次就不是 |

### 10.2 间歇性 bug（非确定性）

目标不是干净复现，而是**提复现率**：
- loop 100×、并行、加压、注入 sleep
- 1% 不可调试；50% 可调试 → 持续把率提到可调试
- 统计复现工具：`for i in $(seq 1 20); do <test> && echo PASS || echo FAIL; done`

### 10.3 Tagged Debug Log 纪律

本次调试所有临时 log 打同一唯一前缀（如 `[DEBUG-a4f2]`），结束时一次 `grep -rn '[DEBUG-a4f2]' .` 清除。
与 defense-in-depth 的永久 breadcrumb 区分：breadcrumb 是有意保留的取证，tagged log 是临时调试工具。

### 10.4 多 repo workspace

Phase 3 写文件前必须有明确的 `target_repo`，不让 cwd 或 broad discovery 选择 sibling repo。

---

## 十一、执行流程图

```
用户输入
    │
    ▼
Phase 0: Triage
├── issue tracker → fetch 完整评论线程
└── 其他 → 直接 Phase 1
    │
    ▼
[Feedback Loop 构建]
├── 尝试 10 种手段（failing test → ... → HITL）
├── 就绪清单（Red-capable / Deterministic / Fast / Agent-runnable）
└── 无法建环 → 二分（无证据=stop索取 / 有证据=bounded continue）
    │
    ▼
Phase 1: Investigate
├── 1.1 复现（性能回归→perf分支 / 间歇→提复现率 / HITL）
├── 1.2 环境健全性（分支/依赖/版本/env/产物/服务）
├── 1.3 代码路径追踪（反向溯源，找坏状态首次产生处）
└── 1.4 Trivial fast-path 判断
    │
    ▼
Phase 2: Root Cause
├── 假设审计（belief 标 verified/assumed）
├── 排序假设（含具体观察 + 因果链 + 不确定环节的预测）
├── Causal Chain Gate（无 gap 才进 Phase 3）
├── Present findings
├── 用户选择（Fix now / Diagnosis only / Rethink design）
└── Smart Escalation（2-3 假设耗尽 → 诊断表）
    │
    ├──[Diagnosis only]──────────────────────┐
    │                                        ▼
    ▼                                   Phase 4: Handoff
Phase 3: Fix                            (summary only, stop)
├── Workspace/branch check
├── Test-first（correct seam 判断）
├── 8步：seam判断→写失败测试→验证失败→最小修复→验证通过→self-review→清理log→回归
├── 3次失败 = 返回 Phase 2
├── 条件 defense-in-depth（3+文件/生产灾难性）
└── 条件 post-mortem（生产/3+处）
    │
    ▼
Phase 4: Handoff
├── Debug Summary（始终先写）
├── Cleanup checklist（tagged log / 原型 / commit message / seam flag）
├── skill自建分支 → commit-and-PR（含 Fixes #N）
├── 预存分支 → 问用户（commit+PR / commit only / stop）
└── 知识沉淀决策 → 可选 spec-compound
```

---

## 十二、references 文件概览

| 文件 | 内容 |
|---|---|
| `anti-patterns.md` | 5 大调试反模式 + smart escalation 模式 |
| `defense-in-depth.md` | 四层防御模型（entry validation / invariant / env guard / breadcrumb） |
| `investigation-techniques.md` | 根因追踪 / 多组件边界仪表 / git bisect / 间歇性 bug / delta debugging / 框架专项 / stepping debugger / 竞态 / heisenbug / 浏览器 / 跨系统证据 / 系统边界 / bug-class 清单 |
| `perf-regression.md` | 基线测量 / 统计计时（p50/p95）/ 平台条件化环境隔离 / bisect + exit 125 噪声带纪律 / 常见性能 bug 类型 |

---

## 十三、产物清单

| 产物 | 条件 |
|---|---|
| Debug Summary（Markdown）| 始终 |
| 回归测试（新/改 test 文件）| 用户选 Fix + 有 correct seam |
| 代码修复（changed source）| 用户选 Fix |
| GitHub PR | skill 自建分支时默认 |
| Learning doc（docs/solutions/）| 模式 3+ 处 / 共享依赖错误假设，且用户接受 |

---

## 十四、与相关 skill 的路由关系

| skill | 何时路由 |
|---|---|
| `spec-work` | 修复范围超出一个 bug，需要更大实现 |
| `spec-code-review` | Phase 3 非 trivial 修复完成后 |
| `spec-optimize` | 用户意图是"优化到更好"（非"恢复原状/找根因"）|
| `spec-compound` | 有可泛化教训时（Phase 4 决策） |
| brainstorm entrypoint | 根因揭示设计问题时（Phase 2 决策） |

