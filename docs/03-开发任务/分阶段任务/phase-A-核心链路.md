# 阶段 A — 核心链路可用（P0）

> **目标**: CLI 基础能力 + 核心模块 + 模板系统，核心链路手动走通
> **准出**: `npm run typecheck` 归零 + 核心模块单测覆盖率 ≥ 60% + 核心链路手动走通
> **CLI 命令数**: 22 个（init×1 + stage×3 + id×4 + matrix×2 + metrics coverage×1 + rfc×5 + defect×5 + doctor 基础×1）
> **对齐技术方案**: v2-01, v2-03, v2-04, v2-05, v2-07, v2-09, v2-10

---

## 一、共享基础设施（T-AS-xxx）

### T-AS-001 项目工程初始化

**描述**: 搭建项目骨架，配置 TypeScript + ESM + Vitest + tsup + pnpm

**输入**: v2-01 §7 技术栈 + §8 目录结构

**产出物**:
- `package.json`（name: `spec-first`, type: `module`, bin 入口）
- `tsconfig.json`（ESM, strict, target ES2022）
- `tsup.config.ts`（ESM 输出, skills/ 纳入 assets）
- `vitest.config.ts`
- `.gitignore`
- 目录骨架: `src/cli/`, `src/core/`, `src/shared/`, `tests/unit/`, `tests/integration/`, `tests/fixtures/`

**验收标准**:
1. `pnpm install` 成功
2. `pnpm run build` 产出 ESM 包
3. `pnpm run typecheck` 零错误
4. `pnpm run test` 框架可运行（空测试通过）

**依赖**: 无

---

### T-AS-002 共享类型定义

**描述**: 定义全局类型，消除隐式字符串协议

**输入**: v2-03 §3 模块接口定义 + v2-04 §2 状态定义 + v2-05 §2 ID 体系

**产出物**: `src/shared/types.ts`

**关键类型**:
```typescript
// Stage 枚举
enum Stage { INIT='00_init', SPECIFY='01_specify', DESIGN='02_design',
  PLAN='03_plan', IMPLEMENT='04_implement', VERIFY='05_verify',
  WRAP_UP='06_wrap_up', RELEASE='07_release', DONE='08_done', CANCELLED='09_cancelled' }

// ID 类型
type NextIdType = 'FR' | 'DS' | 'TASK' | 'TC' | 'RFC';
type IdType = NextIdType | 'Feature';

// Mode / Size
type Mode = 'N' | 'I';
type Size = 'S' | 'M' | 'L';

// StageState（stage-state.json 结构）
interface StageState { featureId: string; mode: Mode; size: Size;
  platforms: string[]; currentStage: Stage; history: StageHistoryEntry[]; terminal: boolean; }

// ExitCode
enum ExitCode { SUCCESS=0, GATE_FAILED=1, VALIDATION_ERROR=2,
  CONFIG_ERROR=3, IO_ERROR=4, UNKNOWN_ERROR=5 }

// GateResult
interface GateResult { status: 'PASS'|'PASS_WITH_WAIVER'|'FAIL';
  conditions: ConditionResult[]; waivers?: WaiverRef[]; suggestions?: string[]; }

// RFC 状态
type RfcStatus = 'draft' | 'approved' | 'closed' | 'rejected';

// 缺陷状态
type DefectStatus = 'open' | 'fixing' | 'fixed' | 'verified' | 'wontfix';
```

**验收标准**:
1. `npm run typecheck` 零错误
2. 所有模块可正常 import 类型

**依赖**: T-AS-001

---

### T-AS-003 文件 I/O 封装层

**描述**: 统一文件读写，便于单测 mock

**输入**: v2-03 §5 I/O 封装

**产出物**: `src/shared/fs-utils.ts`

**接口**:
```typescript
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

**验收标准**:
1. 单测覆盖所有方法（含边界：文件不存在、目录不存在、JSON 格式错误）
2. `appendJsonl` 追加模式，不读取-修改-写回
3. JSONL 每行以 `\n` 结尾

**依赖**: T-AS-001

---

### T-AS-004 JSONL 日志工具

**描述**: 统一 JSONL 审计日志写入

**输入**: v2-01 §5 D2 决策

**产出物**: `src/shared/logger.ts`

**功能**:
- 封装 `appendJsonl`，自动注入 `timestamp` 字段
- 支持 gate-history / metrics / ai-stats / golive-history 四种日志类型
- 月度自动轮转: 行数 > 1000 时自动归档为 `<type>-YYYY-MM.jsonl`，创建新文件继续写入
- `readJsonl(path)` — 读取 JSONL 文件，返回解析后的记录数组

**验收标准**:
1. 写入的每条记录自动包含 ISO8601 timestamp
2. 单测验证追加写入行为

**依赖**: T-AS-003

---

### T-AS-005 CLI 入口与命令路由

**描述**: 单一命令入口 `spec-first`，子命令路由分发

**输入**: v2-03 §2 命令分组 + §4 命令执行约定

**产出物**:
- `src/cli/index.ts`（bin 入口，process.argv 解析）
- `src/cli/router.ts`（子命令分发到 commands/*.ts）

**功能**:
- 解析 `spec-first <command> <subcommand> [args] [--flags]`
- 未知命令返回帮助信息 + ExitCode.VALIDATION_ERROR
- 统一 ExitCode 映射（0-5）
- 失败输出包含可修复建议

**验收标准**:
1. `spec-first --help` 输出命令列表
2. `spec-first unknown` 返回 ExitCode 2
3. 所有命令处理器可注册到路由

**依赖**: T-AS-002

---

## 二、M2 TraceEngine — ID 与追踪矩阵（T-AM2-xxx）

> **对齐技术方案**: v2-05 追踪矩阵与 ID 引擎
> **对齐需求**: core-03-traceability
> **被依赖最多的模块，优先实现**

### T-AM2-001 ID 生成与注册（nextId）

**描述**: 实现 6 种 ID 的生成、注册、唯一性保证

**输入**: v2-05 §2 ID 体系

**产出物**: `src/core/trace-engine/id-generator.ts`

**功能**:
- `nextId(type, abbr, featureId)` — 扫描矩阵已有 ID → 最大序号+1 → 组装 → 校验 → 写入矩阵
- 支持 5 种 nextId 类型: FR / DS / TASK / TC / RFC
- Feature ID 由 init 生成，不走 nextId
- TC 类型含级别前缀: `TC-<LVL>-<FEAT>-NNN`（LVL ∈ {UT, IT, E2E, ST}）
- FEAT 缩写注册到 `specs/.feat-registry.md`

**ID 格式正则**:
| 类型 | 正则 |
|------|------|
| Feature | `^FSREQ-\d{8}-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| FR | `^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| DS | `^DS-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| TASK | `^TASK-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| TC | `^TC-(UT\|IT\|E2E\|ST)-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| RFC | `^RFC-\d{3}$` |

**验收标准**:
1. 同类型同缩写下序号单调递增
2. 已分配 ID 不可复用
3. 格式不合法时返回 VALIDATION_ERROR
4. 单测覆盖所有 ID 类型 + 边界（首个 ID、连续生成、非法缩写）

**依赖**: T-AS-002, T-AS-003

---

### T-AM2-002 ID 格式校验（validateId）

**描述**: 校验任意 ID 字符串的格式合法性

**输入**: v2-05 §2.1 ID 格式定义

**产出物**: `src/core/trace-engine/id-validator.ts`

**功能**:
- `validateId(id)` — 正则匹配 6 种 ID 格式
- 返回 `{ valid: boolean, type?: IdType, error?: string }`
- 性能要求: < 10ms

**验收标准**:
1. 6 种合法 ID 格式全部识别
2. 非法格式返回明确错误信息
3. 基准测试 < 10ms

**依赖**: T-AS-002

---

### T-AM2-003 ID 模糊搜索（searchId）

**描述**: 支持前缀匹配和缩写匹配的 ID 搜索

**输入**: v2-05 §2.5 模糊搜索

**产出物**: `src/core/trace-engine/id-search.ts`

**功能**:
- `searchId(query, featureId, type?)` — 前缀匹配 + 缩写匹配
- `FR-AUTH` → 匹配所有 `FR-AUTH-*`
- `AUTH` → 匹配所有含 AUTH 的 ID
- `--type FR` → 仅搜索 FR 类型

**验收标准**:
1. 前缀匹配和缩写匹配均可用
2. 类型过滤正确
3. 无匹配时返回空数组（不报错）

**依赖**: T-AM2-001

---

### T-AM2-004 追踪矩阵管理

**描述**: 矩阵的读取、写入、完整性校验

**输入**: v2-05 §3 追踪矩阵模型

**产出物**: `src/core/trace-engine/matrix.ts`

**功能**:
- 读取/解析 `traceability-matrix.md`（Markdown 表格格式）
- `checkMatrix(featureId)` — 校验孤儿项、断链、覆盖率
- `exportMatrix(featureId, format)` — 导出为 Markdown 或 YAML
- Status 枚举: Planned / Implemented / Verified / Accepted / Deferred / Cancelled / Exception

**验收标准**:
1. 矩阵解析正确（含 NFR 标签 `[NFR:SEC]` 等）
2. 孤儿项检测：无上游关联的产物输出 warning
3. 断链检测：FR 无 DS/TASK/TC 映射时报告
4. 导出格式与 v2-05 §3.1 一致

**依赖**: T-AS-003, T-AM2-001

---

### T-AM2-005 覆盖率计算（getCoverage）

**描述**: 计算 C1-C9 九项覆盖率指标

**输入**: v2-05 §4 覆盖率算法 + v2-11 §2 指标定义

**产出物**: `src/core/trace-engine/coverage.ts`

**功能**:
- `getCoverage(featureId)` — 基于追踪矩阵计算 9 项指标
- 有效分母: 排除 Deferred / Cancelled / Exception 状态
- Exception 必须关联有效 RFC
- 分母为 0 时指标值 = 100%
- 性能要求: < 50ms

**9 项指标语义**:
| ID | 指标 | 类型 |
|----|------|------|
| C1 | Design Coverage | 正向覆盖 |
| C2 | API Coverage | 正向覆盖 |
| C3 | Task Coverage | 正向覆盖 |
| C4 | Test Coverage (FR) | 正向覆盖 |
| C5 | Test Coverage (AC) | 正向覆盖 |
| C6 | Impl Coverage | 正向覆盖 |
| C7 | PR Compliance | 反向合规 |
| C8 | Task Compliance | 反向合规 |
| C9 | TC Compliance | 反向合规 |

**验收标准**:
1. 9 项指标计算结果与 v2-11 口径一致
2. 分母排除逻辑正确（Exception 需校验 RFC 关联）
3. 基准测试 < 50ms
4. 参数化测试覆盖各种 Status 组合

**依赖**: T-AM2-004

---

### T-AM2-006 Known Exception 校验

**描述**: 校验 known-exceptions.md 中豁免条目的有效性

**输入**: v2-05 §5 Known Exception 处理

**产出物**: `src/core/trace-engine/exception-validator.ts`

**功能**:
- `validateExceptions(featureId)` — 校验所有 Exception 条目
- 必须关联有效 RFC（状态 = approved）
- 必须有 expires_at 和 rollback_point
- 过期条目标记为无效

**验收标准**:
1. 有效 Exception 从覆盖率分母排除
2. 无效 Exception（RFC 未审批/已过期）报告为错误
3. 单测覆盖正常/过期/无 RFC 三种场景

**依赖**: T-AM2-004

---

### T-AM2-007 ID/Matrix CLI 命令实现

**描述**: 实现 id（4 子命令）+ matrix（2 子命令）共 6 个 CLI 命令

**输入**: v2-03 §2.3 id + §2.5 matrix

**产出物**:
- `src/cli/commands/id.ts`
- `src/cli/commands/matrix.ts`

**命令清单**:
```bash
spec-first id next <type> <abbr> --feature <featureId>
spec-first id validate <id>
spec-first id search <query> --feature <featureId> [--type <type>]
spec-first id list --feature <featureId> [--type <type>]
spec-first matrix check <featureId>
spec-first matrix export <featureId> [--format markdown|yaml]
```

**验收标准**:
1. 6 个命令均可通过 CLI 调用
2. 参数校验 + ExitCode 正确
3. 输出人类可读文本
4. 快照测试验证输出格式稳定性

**依赖**: T-AS-005, T-AM2-001 ~ T-AM2-006

---

## 三、M1 ProcessEngine — 流程引擎与阶段状态机（T-AM1-xxx）

> **对齐技术方案**: v2-04 流程引擎与阶段状态机
> **对齐需求**: core-04-process, core-02-architecture

### T-AM1-001 阶段状态机核心

**描述**: 实现 8+2 阶段状态机，含合法转换校验

**输入**: v2-04 §2 状态定义 + §4 推进规则

**产出物**: `src/core/process-engine/stage-machine.ts`

**功能**:
- `assertTransitionAllowed(from, to)` — 合法转换校验
- 合法转换表硬编码（00→01→02→03→04→05→06→07→08，任意非终态→09）
- 终态判定: `08_done` / `09_cancelled` 不可逆

**验收标准**:
1. 所有合法转换通过
2. 非法跳阶段返回 CONFIG_ERROR
3. 终态重复推进返回 CONFIG_ERROR
4. 参数化测试覆盖全部转换组合

**依赖**: T-AS-002

---

### T-AM1-002 三层合并逻辑

**描述**: init 时执行 Layer 0 + Layer 1 + Layer 2 合并

**输入**: v2-04 §5 三层合并 + v2-09 多端规范合并

**产出物**: `src/core/process-engine/layer-merger.ts`

**功能**:
- `mergeLayerRules(mode, size, platforms)` — 三层合并
- Layer 0: 基线 Gate 条件 + 基线产出物（硬编码）
- Layer 1: Mode × Size 裁剪（Mode I 追加影响分析/回归验证；Size 调节产出物深度）
- Layer 2: 读取 `.spec-first/layer2/<platform>.yaml`
  - gate_conditions → AND 叠加
  - extra_deliverables → 追加去重
  - quality_thresholds → 取更严格值（基于 direction 字段）

**验收标准**:
1. Mode N + Size S 产出最轻量配置
2. Mode I 自动追加 impact-analysis / regression-report
3. 多端合并无冲突（AND 叠加 + 取更严格值）
4. 平台 YAML 不存在时阻断并提示
5. 单测覆盖 Mode×Size×Platform 组合

**依赖**: T-AS-003, T-AM2-004（软依赖 T-CL2-001：Layer 2 YAML 模板，阶段 A 无平台 YAML 时跳过 Layer 2 合并，阶段 C 完整可用）

---

### T-AM1-003 Feature 初始化（init）

**描述**: 创建 Feature 工作区 + 渲染初始模板 + 写入状态文件

**输入**: v2-03 §2.1 init 命令 + v2-04 §5 三层合并 + v2-10 §2 目录规范

**产出物**: `src/core/process-engine/init.ts`

**功能**:
- `init(opts: InitOptions)` — 完整初始化流程
- 生成 Feature ID: `FSREQ-YYYYMMDD-<FEAT>-NNN`
- 创建 `specs/<featureId>/` 目录结构
- 渲染 `stage-state.json`（含三层合并结果）
- 初始化运行态三文件: stage-state.json / findings.md / task_plan.md（骨架）
- 复制 constitution.md 副本
- 初始化 traceability-matrix.md
- 写入 `.spec-first/current`
- 注册 FEAT 缩写到 `specs/.feat-registry.md`

**验收标准**:
1. 目录结构与 v2-10 §2.2 一致
2. stage-state.json 包含完整合并配置
3. 运行态三文件已初始化
4. FEAT 缩写全局唯一（重复时报错）
5. 幂等性: 已存在的 Feature 不覆盖

**依赖**: T-AM1-001, T-AM1-002, T-ATP-001（模板系统）

---

### T-AM1-004 阶段推进（advance）

**描述**: 校验 Gate → 推进阶段 → 写入 history → 审计记录

**输入**: v2-04 §4.2 advance 执行流程

**产出物**: `src/core/process-engine/advance.ts`

**功能**:
- `advance(featureId, options?)` — 完整推进流程
- 读取 stage-state.json → 断言非终态 → 计算目标阶段
- 正常路径: 调用 GateEngine.check() → PASS/PASS_WITH_WAIVER → 推进
- PASS_WITH_WAIVER 校验: 关联的 known-exceptions.md 条目必须有效（已审批 RFC、未过期 expires_at、含 rollback_point），无效时降级为 FAIL
- `--force` 路径: 跳过 Gate，gateResult = "FORCE_SKIPPED"，写入 findings.md 审计
- GateEngine 不可用时: 抛出 GateUnavailableError，由调用方根据 pilot_mode 决定降级
- 更新 stage-state.json（currentStage + history + terminal）
- 写入 gate-history.jsonl

**阶段 A 降级策略**:
- M3 GateEngine 尚未就绪，advance 默认尝试 Gate 校验
- GateUnavailableError 时检查 `config.yaml` 的 `gate.pilot_mode`
- `pilot_mode: true` → 软门禁放行 + 写入 findings.md 审计记录
- `pilot_mode: false`（默认）→ 阻断

**验收标准**:
1. 正常推进写入 history 记录
2. `--force` 写入 FORCE_SKIPPED + findings.md 审计
3. 终态推进返回 CONFIG_ERROR
4. 非法跳阶段返回 CONFIG_ERROR
5. pilot_mode 降级逻辑正确

**依赖**: T-AM1-001, T-AS-004（软依赖 T-BM3-001：GateEngine，阶段 A 通过 pilot_mode 降级放行，阶段 B 完整可用）

---

### T-AM1-005 Feature 取消（cancel）

**描述**: 任意非终态阶段进入 09_cancelled

**输入**: v2-04 §4.3 cancel 规则

**产出物**: 集成在 `src/core/process-engine/advance.ts`

**功能**:
- `cancel(featureId, reason)` — 进入终态
- 必须提供 reason，写入 history
- cancel 后 terminal = true

**验收标准**:
1. 任意非终态均可 cancel
2. 无 reason 时返回 VALIDATION_ERROR
3. 终态 cancel 返回 CONFIG_ERROR

**依赖**: T-AM1-001

---

### T-AM1-006 Feature 管理基础

**描述**: 读取当前 Feature、列出所有 Feature

**输入**: v2-03 §3 M1 接口

**产出物**: `src/core/process-engine/feature.ts`

**功能**:
- `currentFeature()` — 读取 `.spec-first/current`
- `listFeatures()` — 扫描 `specs/` 下所有 Feature 目录，返回摘要
- `switchFeature(featureId)` — 切换当前 Feature，更新 `.spec-first/current`
- `current(featureId)` — 读取并返回 stage-state.json

**验收标准**:
1. current 文件不存在时返回 null
2. listFeatures 返回按 updatedAt 排序的摘要列表

**依赖**: T-AS-003

---

### T-AM1-007 Stage CLI 命令实现

**描述**: 实现 init（1 子命令）+ stage（3 子命令）共 4 个 CLI 命令

**输入**: v2-03 §2.1 init + §2.2 stage

**产出物**:
- `src/cli/commands/init.ts`
- `src/cli/commands/stage.ts`

**命令清单**:
```bash
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>]
spec-first stage current <featureId>
spec-first stage advance <featureId> [--force]
spec-first stage cancel <featureId> --reason "<reason>"
```

**验收标准**:
1. 4 个命令均可通过 CLI 调用
2. 参数校验 + ExitCode 正确
3. init 生成完整目录结构
4. advance 输出推进结果或失败原因

**依赖**: T-AS-005, T-AM1-003 ~ T-AM1-006

---

## 四、M4 ChangeMgr — 变更管理（T-AM4-xxx）

> **对齐技术方案**: v2-07 变更管理与同步机制
> **对齐需求**: core-05-cross-cutting
> **阶段 A 范围**: RFC 状态机 + 缺陷管理 + CLI 命令（影响分析和 Sync 归入阶段 B）

### T-AM4-001 RFC 状态机

**描述**: 实现 RFC 4 态状态机（draft → approved → closed / rejected）

**输入**: v2-07 §2 RFC 状态机

**产出物**: `src/core/change-mgr/rfc-machine.ts`

**功能**:
- `assertRfcTransition(from, to)` — 合法转换校验
- 合法转换表:
  - draft → approved / rejected
  - approved → closed / rejected
  - rejected / closed → 终态，不可转换
- 终态判定: `rejected` / `closed` 不可逆

**验收标准**:
1. 所有合法转换通过
2. 非法转换返回 VALIDATION_ERROR
3. 终态重复转换返回 VALIDATION_ERROR
4. 参数化测试覆盖全部转换组合

**依赖**: T-AS-002

---

### T-AM4-002 RFC CRUD 操作

**描述**: 创建、提交、流转、列出 RFC

**输入**: v2-07 §2.3 RFC 记录格式 + §7 最小实现清单

**产出物**: `src/core/change-mgr/rfc.ts`

**功能**:
- `createRfc(featureId, opts)` — 创建 RFC 文件 + 自动分配 RFC-NNN ID
- `submitRfc(rfcId, featureId)` — 便捷入口，等价于 `transitionRfc(rfcId, 'approved')` + 豁免条目写入
- `transitionRfc(rfcId, status, featureId)` — RFC 状态流转 + 合法性校验
- `listRfc(featureId)` — 列出 Feature 下所有 RFC（含状态摘要）

**RFC 记录格式**:
- 文件路径: `specs/<featureId>/rfc/<RFC-NNN>.rfc.md`
- 包含: 级别(Minor/Major/Critical)、状态、发起人、影响产物、影响 ID、审批记录

**验收标准**:
1. 创建 RFC 自动分配递增 ID
2. 状态流转校验正确（调用 T-AM4-001）
3. submitRfc 同时写入 known-exceptions.md（如有豁免）
4. listRfc 输出格式化摘要表
5. 单测覆盖创建/流转/列出全路径

**依赖**: T-AM4-001, T-AM2-001, T-AS-003

---

### T-AM4-003 缺陷状态机

**描述**: 实现缺陷 5 态状态机

**输入**: v2-07 §6.3 缺陷状态转换表

**产出物**: `src/core/change-mgr/defect-machine.ts`

**功能**:
- `assertDefectTransition(from, to)` — 合法转换校验
- 合法转换表:
  - open → fixing / wontfix
  - fixing → fixed / open（放弃修复时回退）
  - fixed → verified / open（验证不通过时回退）
  - verified / wontfix → 终态，不可转换

**验收标准**:
1. 所有合法转换通过
2. 非法转换返回 VALIDATION_ERROR
3. 回退路径（fixing→open, fixed→open）正确
4. 参数化测试覆盖全部转换组合

**依赖**: T-AS-002

---

### T-AM4-004 缺陷 CRUD 操作

**描述**: 注册、流转、列出缺陷

**输入**: v2-07 §6.2 缺陷记录 + §7 最小实现清单

**产出物**: `src/core/change-mgr/defect.ts`

**功能**:
- `registerDefect(featureId, opts)` — 注册缺陷，Feature 内自增序号
- `transitionDefect(seq, status, featureId)` — 缺陷状态流转
- `listDefects(featureId, filter?)` — 列出缺陷（支持按状态/严重级别过滤）

**DefectRecord 结构**:
```typescript
interface DefectRecord {
  seq: number;            // Feature 内自增序号
  featureId: string;
  severity: 'S1' | 'S2' | 'S3' | 'S4';
  title: string;
  reporter: string;
  discoveredIn?: string;  // 发现阶段
  linkedFr?: string;      // 关联 FR ID
  linkedTc?: string;      // 发现该缺陷的 TC ID
  status: DefectStatus;
  createdAt: string;
}
```

**验收标准**:
1. 序号在 Feature 内单调递增
2. 状态流转校验正确（调用 T-AM4-003）
3. 过滤条件组合正确
4. 单测覆盖注册/流转/列出全路径

**依赖**: T-AM4-003, T-AS-003

---

### T-AM4-005 RFC/Defect CLI 命令实现

**描述**: 实现 rfc（5 子命令）+ defect（5 子命令）共 10 个 CLI 命令

**输入**: v2-03 §2.8 rfc + §2.9 defect

**产出物**:
- `src/cli/commands/rfc.ts`
- `src/cli/commands/defect.ts`

**命令清单**:
```bash
# RFC 命令（5 个）
spec-first rfc create <featureId> --title "<title>" [--level <Minor|Major|Critical>] [--by <by>] [--motivation "<m>"] [--description "<d>"]
spec-first rfc submit <rfcId> --feature <featureId>
spec-first rfc transition <rfcId> <status> --feature <featureId>
spec-first rfc list <featureId>
spec-first rfc get <rfcId> --feature <featureId>

# Defect 命令（5 个）
spec-first defect register <featureId> --severity <S1|S2|S3|S4> --title "<title>" --reporter "<name>" [--description "<d>"] [--discovered-in <stage>] [--linked-fr <frId>]
spec-first defect update <featureId> <seq> --status <status> [--actor <actor>]
spec-first defect list <featureId>
spec-first defect get <featureId> <seq>
spec-first defect escape-rate <featureId>
```

**验收标准**:
1. 10 个命令均可通过 CLI 调用
2. 参数校验 + ExitCode 正确
3. 输出人类可读文本
4. defect escape-rate 输出缺陷逃逸率

**依赖**: T-AS-005, T-AM4-002, T-AM4-004

---

## 五、模板系统（T-ATP-xxx）

> **对齐技术方案**: v2-10 产出物与模板系统
> **对齐需求**: aux-04-deliverables

### T-ATP-001 Handlebars 模板渲染引擎

**描述**: 封装 Handlebars 渲染，支持模板加载、变量注入、文件写入

**输入**: v2-10 §5 模板系统

**产出物**: `src/core/template/renderer.ts`

**功能**:
- `renderTemplate(templateName, context)` — 加载模板 → 编译 → 渲染 → 写入文件
- 模板路径解析: `templates/<category>/<name>.hbs`
- 覆盖策略: 文件已存在则跳过，不覆盖用户修改
- 缺失模板: 报错并阻断，不使用空文件兜底

**TemplateContext 基础变量**:
```typescript
interface TemplateContext {
  featureId: string;
  title: string;
  mode: 'N' | 'I';
  size: 'S' | 'M' | 'L';
  platforms: string[];
  timestamp: string;       // ISO8601
  author: string;
}
```

**验收标准**:
1. 渲染结果与预期模板输出一致（快照测试）
2. 文件已存在时跳过不覆盖
3. 模板不存在时返回 IO_ERROR
4. 单测覆盖正常渲染/跳过/缺失三种场景

**依赖**: T-AS-001（Handlebars 依赖）

---

### T-ATP-002 模板文件编写

**描述**: 编写 9 个 Handlebars 模板文件

**输入**: v2-10 §5.1 模板目录 + §2.2 Feature 级目录 + aux-04 §目录结构

**产出物**:
```text
templates/
├── init/
│   ├── stage-state.json.hbs
│   └── constitution.md.hbs
├── matrix/
│   ├── traceability-matrix.md.hbs
│   └── traceability-matrix.yaml.hbs
├── gate/
│   └── gate-report.md.hbs
├── review/
│   └── code-review-report.md.hbs
├── metrics/
│   └── health-report.md.hbs
└── release/
    ├── release-note.md.hbs
    └── smoke-test-report.md.hbs
```

**验收标准**:
1. 每个模板可被 Handlebars 正确编译
2. 渲染结果符合对应文件格式规范
3. stage-state.json.hbs 渲染结果为合法 JSON
4. traceability-matrix.md.hbs 渲染结果为合法 Markdown 表格
5. release-note.md.hbs 渲染结果包含版本号、变更摘要、影响范围
6. smoke-test-report.md.hbs 渲染结果包含测试项、结果、执行时间
7. 快照测试验证输出格式稳定性

**依赖**: T-ATP-001

---

### T-ATP-003 产出物完整性检查

**描述**: 按 Mode×Size 检查并补全阶段产出物

**输入**: v2-10 §3.2 Mode×Size 裁剪规则

**产出物**: `src/core/template/artifact-checker.ts`

**功能**:
- `ensureArtifacts(featureId, stage)` — 根据 stage-state.json 中的 mode + size 判定必须产出物
- 缺失的必须产出物 → 调用模板渲染生成骨架
- 跳过的产出物（如 Mode N-S 的 research.md）不计入覆盖率分母
- `listArtifacts(featureId)` — 列出 Feature 下所有产出物及状态（存在/缺失/跳过）

**验收标准**:
1. Mode N-S 跳过 research.md / data-model.md / adr
2. Mode I 追加 impact-analysis.md / regression-report.md
3. 缺失产出物自动渲染骨架
4. 单测覆盖 Mode×Size 组合

**依赖**: T-ATP-001, T-AM1-006

---

## 六、补充 CLI 命令（T-ACL-xxx）

### T-ACL-001 metrics coverage CLI 命令

**描述**: 实现覆盖率查询命令

**输入**: v2-03 §2.6 metrics + v2-11 §2 指标定义

**产出物**: `src/cli/commands/metrics.ts`

**命令**:
```bash
spec-first metrics coverage <featureId>
```

**功能**:
- 调用 `getCoverage(featureId)` 获取 C1-C9 九项指标
- 格式化输出表格（指标名 + 当前值 + 目标值 + 状态）
- 未达标指标高亮提示

**验收标准**:
1. 输出 9 项指标的格式化表格
2. 未达标指标有明确提示
3. Feature 不存在时返回 VALIDATION_ERROR

**依赖**: T-AS-005, T-AM2-005

---

### T-ACL-002 doctor 基础诊断命令

**描述**: 实现项目健康检查基础版

**输入**: v2-03 §2.10 doctor

**产出物**: `src/cli/commands/doctor.ts`

**命令**:
```bash
spec-first doctor
```

**功能**:
- 检查运行环境: Node.js ≥ 20、npm、Git 是否可用
- 检查项目配置完整性（.spec-first/ 目录、config.yaml、specs/ 目录）
- 检查 CLI 版本一致性（当前版本 vs package.json 版本）
- 检查 Feature 目录结构完整性
- 检查模板版本一致性
- 输出诊断报告（PASS / WARNING / ERROR 三级）

**验收标准**:
1. 无 Feature 参数时检查项目级配置
2. 有 Feature 参数时追加检查 Feature 目录
3. 输出结构化诊断报告
4. 每项检查有明确的修复建议

**依赖**: T-AS-005, T-AS-003

---

### T-AS-006 config.yaml Schema 定义与校验

**描述**: 定义全局配置文件 Schema，统一各模块配置项命名和类型

**输入**: aux-01/02/05 多处配置引用 + v2-08 §3 context.token_budget + v2-06 §7 gate.pilot_mode

**产出物**: `src/shared/config-schema.ts`

**功能**:
- 定义 `config.yaml` 的 TypeScript Schema（含类型、默认值、合法范围）
- 核心配置项: `catchup.trigger`（auto/prompt/off）、`context.token_budget`（8K-64K）、`gate.pilot_mode`（boolean）、`health.weights`（w1-w9）
- `loadConfig(projectRoot)` — 加载并校验 config.yaml，不合法时输出具体错误
- `getConfigValue(key, defaultValue)` — 类型安全的配置读取

**验收标准**:
1. Schema 覆盖所有已知配置项
2. 不合法配置值输出明确错误信息
3. 缺失配置项使用默认值
4. 单测覆盖正常/缺失/非法三种场景

**依赖**: T-AS-003

---

## 七、阶段 A 任务总览

### 任务统计

| 模块 | 任务数 | 编号范围 |
|------|--------|----------|
| 共享基础设施 | 6 | T-AS-001 ~ T-AS-006 |
| M2 TraceEngine | 7 | T-AM2-001 ~ T-AM2-007 |
| M1 ProcessEngine | 7 | T-AM1-001 ~ T-AM1-007 |
| M4 ChangeMgr | 5 | T-AM4-001 ~ T-AM4-005 |
| 模板系统 | 3 | T-ATP-001 ~ T-ATP-003 |
| 补充 CLI | 2 | T-ACL-001 ~ T-ACL-002 |
| **合计** | **30** | — |

### 关键路径

```text
T-AS-001 → T-AS-002 → T-AS-003 → T-AS-004
                ↓    ↘      ↓
           T-AS-005    T-AM2-001 → T-AM2-003
                ↓           ↓
           (所有CLI)   T-AM2-004 → T-AM2-005
                            ↓         ↓
                       T-AM2-006  T-ACL-001
                            ↓
                       T-AM2-007

T-AS-002 → T-AM1-001 ──→ T-AM1-002 → T-AM1-003
                     ├──→ T-AM1-004（+ T-AS-004）
                     └──→ T-AM1-005
T-AS-003 → T-AM1-006
T-AM1-003 ~ T-AM1-006 → T-AM1-007

T-AS-002 → T-AM4-001 → T-AM4-002 → T-AM4-005
           T-AM4-003 → T-AM4-004 ↗

T-AS-001 → T-ATP-001 → T-ATP-002
                    ↓
               T-ATP-003
```

### CLI 命令清单（22 个）

| # | 命令 | 来源任务 |
|---|------|----------|
| 1 | `init` | T-AM1-007 |
| 2 | `stage current` | T-AM1-007 |
| 3 | `stage advance` | T-AM1-007 |
| 4 | `stage cancel` | T-AM1-007 |
| 5 | `id next` | T-AM2-007 |
| 6 | `id validate` | T-AM2-007 |
| 7 | `id search` | T-AM2-007 |
| 8 | `id list` | T-AM2-007 |
| 9 | `matrix check` | T-AM2-007 |
| 10 | `matrix export` | T-AM2-007 |
| 11 | `rfc create` | T-AM4-005 |
| 12 | `rfc submit` | T-AM4-005 |
| 13 | `rfc transition` | T-AM4-005 |
| 14 | `rfc list` | T-AM4-005 |
| 15 | `rfc get` | T-AM4-005 |
| 16 | `defect register` | T-AM4-005 |
| 17 | `defect update` | T-AM4-005 |
| 18 | `defect list` | T-AM4-005 |
| 19 | `defect get` | T-AM4-005 |
| 20 | `defect escape-rate` | T-AM4-005 |
| 21 | `metrics coverage` | T-ACL-001 |
| 22 | `doctor` | T-ACL-002 |
