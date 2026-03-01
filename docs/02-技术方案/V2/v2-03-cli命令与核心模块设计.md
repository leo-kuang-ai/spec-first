# V2-03 CLI 命令与核心模块设计

> **对齐需求**: aux-02-cli-system
> **版本**: v2.1 | **日期**: 2026-02-10 | **原则**: KISS

---

## 1. 目标

落地 13 命令组与 7 核心模块，保持 CLI 原子性、确定性、可测试性。

---

## 2. 命令分组与签名

> 各命令组交付阶段（对齐 v2-12 分阶段实施）：

| 命令组 | 子命令数 | 所属模块 | 交付阶段 |
|--------|---------|---------|---------|
| init | 1 | M1 ProcessEngine | A |
| stage | 3 | M1 ProcessEngine | A |
| id | 4 | M2 TraceEngine | A |
| gate | 3 | M3 GateEngine | **B** |
| matrix | 2 | M2 TraceEngine | A |
| metrics | 3 | M2(coverage)+M6(report/health) | coverage=A, report/health=**B** |
| ai | 3 | M5 AIOrchestrator | **B** |
| rfc | 5 | M4 ChangeMgr | A |
| defect | 5 | M4 ChangeMgr | A |
| doctor | 1 | M7 ToolIntegration | A(基础) / **B**(完整) |
| feature | 3 | M1 ProcessEngine | **B** |
| commit | 1 | M7 ToolIntegration | **B** |
| golive | 1 | M3 GateEngine | **B** |
| **合计** | **35** | — | A=20, B=15 |

### 2.1 init — Feature 初始化

```bash
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> \
  --platforms <p1,p2,...> [--feature-id <id>]
```

- 创建 `specs/<featureId>/` 目录结构
- 生成 `stage-state.json`（含三层合并结果）
- 初始化运行态三文件（stage-state.json / findings.md / task_plan.md）
- 写入 `.spec-first/current`

### 2.2 stage — 阶段管理

```bash
spec-first stage current <featureId>
spec-first stage advance <featureId> [--force]
spec-first stage cancel <featureId> --reason "<reason>"
```

- `advance`：校验 Gate → 推进 → 写入 history → 更新 stage-state.json
- `advance --force`：跳过 Gate 校验强制推进（需人工确认，写入 findings.md 记录）
- `cancel`：任意阶段 → `09_cancelled`，必须记录 reason

### 2.3 id — ID 管理

```bash
spec-first id next <type> <abbr> --feature <featureId>
spec-first id validate <id>
spec-first id search <query> --feature <featureId> [--type <type>]
spec-first id list --feature <featureId> [--type <type>]
```

- `next`：生成下一个可用 ID，注册到矩阵
- `validate`：校验 ID 格式合法性
- `search`：模糊搜索（前缀匹配 + 缩写匹配）
- `list`：列出 Feature 下所有已注册 ID（可按类型过滤）

### 2.4 gate — 质量门禁

```bash
spec-first gate check <featureId> [--stage <stageId>]
spec-first gate history <featureId>
spec-first gate conditions <featureId> [--stage <stageId>]
```

- `check`：评估当前阶段 Exit Gate，返回 PASS / PASS_WITH_WAIVER / FAIL
- `history`：输出 gate-history.jsonl 摘要
- `conditions`：列出指定阶段的所有 Gate 条件（含 Layer 2 合并结果）

### 2.5 matrix — 追踪矩阵

```bash
spec-first matrix check <featureId>
spec-first matrix export <featureId> [--format markdown|yaml]
```

- `check`：校验矩阵完整性（孤儿项、断链、覆盖率）
- `export`：导出矩阵为 Markdown 表格或 YAML

### 2.6 metrics — 度量

```bash
spec-first metrics coverage <featureId>
spec-first metrics report <featureId>
spec-first metrics health <featureId>
```

- `coverage`：计算 C1-C9 九项覆盖率指标（调用 M2.getCoverage）
- `report`：生成完整度量报告（C1-C9 + E1 + Q1 + H1 共 12 项）
- `health`：输出健康分（0-100）+ 瓶颈分析

### 2.7 ai — AI 协作

```bash
spec-first ai context <featureId> [--stage <stageId>] [--task <taskId>]
spec-first ai catchup <featureId>
spec-first ai stats <featureId>
```

- `context`：生成 Context Pack（control + references）
- `catchup`：从三文件 + stage-state.json 恢复会话状态
- `stats`：输出 AI 编码统计（ai-stats.jsonl 摘要）

### 2.8 rfc — 变更管理

```bash
spec-first rfc create <featureId> --title "<title>" [--level <Minor|Major|Critical>] [--by <submittedBy>] [--motivation "<motivation>"] [--description "<description>"]
spec-first rfc submit <rfcId> --feature <featureId>
spec-first rfc get <rfcId> --feature <featureId>
spec-first rfc transition <rfcId> <status> --feature <featureId>
spec-first rfc list <featureId>
```

- `create`：创建 RFC，自动分配 RFC-NNN ID
- `submit`：提交 RFC 进入审批，等价于 `transition <rfcId> approved`（语义糖：draft → approved）
- `get`：查看单个 RFC 详情
- `transition`：RFC 状态流转（4 态 FSM：draft/approved/closed/rejected）
- `list`：列出 Feature 下所有 RFC

### 2.9 defect — 缺陷管理

```bash
spec-first defect register <featureId> --title "<title>" --severity <S1|S2|S3|S4> \
  --reporter "<reporter>" [--description "<desc>"] [--discovered-in <stage>] [--linked-fr <frId>]
spec-first defect list <featureId>
spec-first defect update <featureId> <seq> --status <status> [--actor <actor>]
spec-first defect get <featureId> <seq>
spec-first defect escape-rate <featureId>
```

- `register`：注册缺陷，关联 FR/TC
- `list`：列出 Feature 下所有缺陷
- `update`：更新缺陷状态（遵循状态转换表）
- `get`：查看单个缺陷详情
- `escape-rate`：计算缺陷逃逸率（Q1）

### 2.10 doctor — 环境诊断

```bash
spec-first doctor
```

- 检查 Node.js 版本、npm、Git Hook 状态、.spec-first/ 目录完整性
- 输出 PASS / WARN / FAIL 逐项报告

### 2.11 feature — Feature 管理（规划）

```bash
spec-first feature list
spec-first feature switch <featureId>
spec-first feature current
```

- `list`：列出 specs/ 下所有 Feature
- `switch`：切换 `.spec-first/current`
- `current`：输出当前活跃 Feature ID

### 2.12 commit — 提交封装（规划）

```bash
spec-first commit [--message "<msg>"] [--task <taskId>]
```

- 封装 `git commit`，自动注入 `[TASK-<FEAT>-NNN]` subject 前缀 + `traces: TASK-<FEAT>-NNN` git trailer
- `--task`：显式指定关联的 TASK ID（未指定时从 `.spec-first/current` + `task_plan.md` 推断）
- 触发 prepare-commit-msg Hook（预填前缀 + trailer）与 commit-msg Hook（格式校验）

### 2.13 golive — Go-Live 准入评估（规划）

```bash
spec-first golive check
```

- 逐项评估 GL-01 ~ GL-04 准入条件（对齐 v2-12 §3 Go-Live Gates）
- 输出各 Gate 的 PASS / FAIL 状态及证据摘要
- 评估结果追加写入 `specs/_global/golive-history.jsonl`
- 任一 Gate FAIL 时输出降级策略建议并返回 ExitCode `GATE_FAILED`

---

## 3. 7 模块接口定义

### M1 ProcessEngine

```typescript
// src/core/process-engine/index.ts
interface ProcessEngine {
  init(opts: InitOptions): Promise<StageState>;
  current(featureId: string): Promise<StageState>;
  advance(featureId: string): Promise<StageState>;
  cancel(featureId: string, reason: string): Promise<StageState>;
  // feature 管理（对应 CLI feature list/switch/current）
  listFeatures(): FeatureSummary[];
  switchFeature(featureId: string): void;   // 写入 .spec-first/current
  currentFeature(): string | null;          // 读取 .spec-first/current
}

interface FeatureSummary {
  featureId: string;
  feat: string;       // 缩写
  stage: string;      // 当前阶段
  updatedAt: string;  // ISO 8601
}

interface InitOptions {
  feat: string;          // 缩写，如 AUTH
  mode: 'N' | 'I';
  size: 'S' | 'M' | 'L';
  platforms: string[];   // kebab-case，如 ['h5', 'java-backend']
  featureId?: string;    // 可选，不传则自动生成
}
```

### M2 TraceEngine

```typescript
// src/core/trace-engine/index.ts
interface TraceEngine {
  nextId(type: IdType, abbr: string, featureId: string): string;
  validateId(id: string): ValidationResult;
  listId(featureId: string, type?: IdType): IdEntry[];
  searchId(query: string, featureId: string): SearchResult[];
  checkMatrix(featureId: string): MatrixCheckResult;
  getCoverage(featureId: string): CoverageReport;
  // 矩阵导出（对应 CLI matrix export）
  exportMatrix(featureId: string, format?: 'markdown' | 'yaml'): string;
}

type NextIdType = 'FR' | 'DS' | 'TASK' | 'TC' | 'RFC';  // 5 种（nextId 可分配的类型）
type IdType = NextIdType | 'Feature';                     // 6 种（含 Feature，由 init 生成不走 nextId）
```

### M3 GateEngine

```typescript
// src/core/gate-engine/index.ts
interface GateEngine {
  check(featureId: string, stage?: Stage): GateResult;
  getConditions(featureId: string, stage?: Stage): ConditionDefinition[];
  getHistory(featureId: string): GateHistoryEntry[];
  // Go-Live 准入评估（对应 CLI golive check）
  goliveCheck(): GoliveResult;
}

interface GoliveResult {
  ready: boolean;                    // GL-01~GL-04 是否全部通过
  gates: GoliveGateEntry[];          // 各 GL 条目评估详情
}

interface GoliveGateEntry {
  id: string;                        // GL-01 ~ GL-04
  label: string;
  passed: boolean;
  detail: string;
}

interface GateResult {
  status: 'PASS' | 'PASS_WITH_WAIVER' | 'FAIL';  // 三态语义，不含 UNAVAILABLE
  conditions: ConditionResult[];  // 每项条件的通过/失败详情
  waivers?: WaiverRef[];          // PASS_WITH_WAIVER 时的豁免引用
  suggestions?: string[];         // FAIL 时的修复建议
}

// GateEngine 不可用时抛出此异常（非 GateResult 状态），保持 Gate 三态语义纯净
// 调用方根据 config.yaml gate.pilot_mode 决定降级策略（详见 v2-06 §2.1、v2-12 §阶段 A）
class GateUnavailableError extends Error {
  readonly code = 'GATE_UNAVAILABLE';
}
```

### M4 ChangeMgr

```typescript
// src/core/change-mgr/index.ts
interface ChangeMgr {
  createRfc(featureId: string, opts: RfcCreateOptions): Promise<RfcRecord>;
  submitRfc(rfcId: string, featureId: string): Promise<RfcRecord>;  // 语义糖：draft → approved
  getRfc(rfcId: string, featureId: string): RfcRecord;
  transitionRfc(rfcId: string, status: RfcStatus, featureId: string): Promise<RfcRecord>;
  listRfc(featureId: string): RfcRecord[];
  registerDefect(featureId: string, opts: DefectOptions): Promise<DefectRecord>;
  updateDefect(featureId: string, seq: number, status: DefectStatus): Promise<DefectRecord>;
  getDefect(featureId: string, seq: number): DefectRecord;
  listDefects(featureId: string): DefectRecord[];
  getEscapeRate(featureId: string): EscapeRateResult;
}
```

### M5 AIOrchestrator

```typescript
// src/core/ai-orchestrator/index.ts
interface AIOrchestrator {
  buildContext(featureId: string, opts?: ContextOptions): ContextPack;
  catchup(featureId: string): CatchupSummary;
  recordStats(featureId: string, stats: AISessionStats): void;
}
```

### M6 MetricsEngine

```typescript
// src/core/metrics-engine/index.ts
// 注意：覆盖率计算统一由 M2.getCoverage() 提供，M6 不重复实现
interface MetricsEngine {
  getReport(featureId: string): MetricsReport;   // 内部调用 M2.getCoverage()
  getHealth(featureId: string): HealthScore;      // 内部调用 M2.getCoverage()
}
```

### M7 ToolIntegration

```typescript
// src/core/tool-integration/index.ts
interface ToolIntegration {
  doctor(): DiagnosticReport;
  installHooks(): void;
  generateCITemplate(): string;
  // 提交封装（对应 CLI commit）
  commit(opts: CommitOptions): Promise<CommitResult>;
}

interface CommitOptions {
  message?: string;
  taskId?: string;     // 自动注入 [TASK-<FEAT>-NNN] 前缀 + traces trailer
}

interface CommitResult {
  commitHash: string;
  taskRef: string;     // 注入的 TASK ID
}
```

---

## 4. 命令执行约定

### 4.1 统一 ExitCode

| Code | 含义 | 场景 |
|------|------|------|
| 0 | 成功（SUCCESS） | 命令正常完成 |
| 1 | Gate 失败（GATE_FAILED） | Gate check 返回 FAIL |
| 2 | 校验失败（VALIDATION_ERROR） | 参数非法、ID 格式错误 |
| 3 | 配置错误（CONFIG_ERROR） | 非法阶段跳转、终态重复操作、配置缺失 |
| 4 | I/O 错误（IO_ERROR） | stage-state.json 不存在等文件操作失败 |
| 5 | 内部错误（UNKNOWN_ERROR） | 未预期异常 |

### 4.2 幂等性要求

- 同一命令重复执行不破坏状态
- `id next` 例外：每次调用生成新 ID（非幂等，但有序号递增保证唯一）

### 4.3 输出格式

- 默认输出人类可读文本
- 所有状态变更同时写入 JSONL 审计日志
- 失败输出必须包含可修复建议

---

## 5. I/O 封装

```typescript
// src/shared/fs-utils.ts
interface FsUtils {
  readJson<T>(path: string): T;
  writeJson(path: string, data: unknown): void;
  readMarkdown(path: string): string;
  writeMarkdown(path: string, content: string): void;
  appendJsonl(path: string, entry: Record<string, unknown>): void;
  ensureDir(path: string): void;
  exists(path: string): boolean;
}
```

所有文件 I/O 通过此层封装，便于单测 mock。

---

## 6. 最小实现清单

1. 单一命令入口 `spec-first`，子命令路由（`src/cli/router.ts`）
2. 13 命令处理器按目录分模块（`src/cli/commands/*.ts`）
3. 7 核心模块各自独立目录（`src/core/<module>/index.ts`）
4. 共享类型放 `src/shared/types.ts`，避免隐式字符串协议
5. I/O 层统一封装（`src/shared/fs-utils.ts`）
6. JSONL 日志统一写入（`src/shared/logger.ts`）

---

## 7. 测试策略

| 层级 | 范围 | 工具 |
|------|------|------|
| 单元测试 | 每个模块的核心函数 | Vitest |
| 集成测试 | 跨模块调用链（如 advance → gate check → coverage） | Vitest + tmp workspace |
| 快照测试 | 命令输出格式稳定性 | Vitest snapshot |
| 基准测试 | validateId < 10ms, getCoverage < 50ms | Vitest bench |
