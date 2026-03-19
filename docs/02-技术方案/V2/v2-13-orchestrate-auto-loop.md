# V2-13 Orchestrate Auto Loop（Ralph Loop + 关联能力包）

> **对齐来源**: `Spec-First 可借鉴 Oh-My-OpenCode 的要素分析` 要素 4/5/6/7/8/11
> **版本**: v2.1.0 | **日期**: 2026-02-27 | **原则**: MVP 优先，渐进增强
> **业界参考**: Temporal Durable Execution、Flowcraft Checkpoint/Resume

---

## 1. 背景与问题

当前 `orchestrate` 以“单次触发”方式工作：

- 一次调用完成有限步骤后结束
- 多 TASK 场景依赖人工反复触发
- `todo-runner` 已具备状态与迭代能力，但未形成主流程自迭代闭环

同时存在配套缺口：

- P4→P5 没有“完成质量判定”
- 缺少 AI 注释 slop 写后拦截
- 没有层级化局部上下文自动生成/加载
- Skill 层缺少 MCP 依赖声明契约

---

## 2. 目标与边界

### 2.1 目标

实现 `/spec-first:orchestrate --auto` 的可恢复自迭代执行，并一并补齐关键配套机制：

1. 完成一个 TASK 后自动推进下一个可执行 TASK
2. 每轮持久化进度，支持崩溃恢复（原子写入保护）
3. 达到上限自动停止，避免无限循环
4. 增加双重完成检测（完整性判定 + 有限回退）
5. 增加 AI 注释 slop 写后拦截
6. 增加层级化 `_context.md` 自动生成与自动加载
7. 增加 `required_mcps` 声明机制
8. 增加 heartbeat 超时检测，识别 stalled 任务
9. 增加 append-only 执行审计日志，支持事后追溯
10. 保证回退重执行的幂等性
11. 明确 `--auto` 的价值定位：批次级确认的自动续航，而非完全无人值守

### 2.2 非目标（本期不做）

1. 多模型自动切换
2. 跨 Feature 并行调度
3. 基于 LLM 的自动修复策略（本期仅做“失败原因注入 + 有限重试 + 退避”，不做自动改错）
4. 宿主级 MCP 生命周期托管（本期只做声明，不做进程管理）

---

## 3. 五项问题分类与价值

| 项目 | 类型 | 结论 | 主要价值 | 优先级 |
|---|---|---|---|---|
| Todo 续航主流程接入 | 执行控制层 | 必做 | 降低人工触发频次，提升多 TASK 完成率 | P1 |
| 双重完成检测 | 执行控制层 | 必做 | 降低“假完成”误推进风险 | P1 |
| AI 注释 slop 检测 | 质量守卫层 | 推荐 | 提升代码可读性与评审效率 | P2 |
| 层级化 `_context.md` | 上下文工程层 | 推荐 | 降低上下文切换成本，减少跑偏 | P2 |
| `required_mcps` 声明 | 能力契约层 | 推荐 | 明确 Skill 能力依赖，减少工具误用 | P2 |

结论：不是同一类问题，但可在同一技术方案内分层落地。

---

## 4. 总体架构

### 4.1 核心闭环

```text
/spec-first:orchestrate --auto
  -> todo-runner 选取可执行 TASK（maxParallel=1 默认串行）
  -> 单轮执行（P0~P5）
  -> 完整性判定（双重完成检测）
  -> 质量守卫（slop 检测）
  -> checkpoint 持久化（串行：每 TASK 完成后写入；并行：全部完成后原子写入）
  -> 下一轮 / 停止
```

### 4.2 分层职责

1. 执行控制层：`todo-runner` + `phase-machine` + auto-loop state + heartbeat
2. 质量守卫层：P4 写后扫描（slop，独立 checker）
3. 上下文工程层：`_context.md` 生成与加载（集成到 Context Pack 流程）
4. 能力契约层：Skill Front Matter 的 `required_mcps`
5. 可观测层：append-only 审计日志（JSONL），支持事后追溯与调试

### 4.3 状态文件统一策略

当前 `todo-runner` 已维护 `specs/{featureId}/todo-state.json`（含 `iteration`、`halted`、`haltReason`）。方案新增的 `orchestrate-auto-state.json` 与其存在职责重叠。

**决策**：不新增独立状态文件；在 `todo-state.json` 内引入 `runtime.autoLoop` 命名空间，收敛运行态字段，避免顶层字段继续膨胀：

```json
{
  "featureId": "FSREQ-...",
  "iteration": 3,
  "maxIterations": 20,
  "halted": false,
  "haltReason": null,
  "runtime": {
    "autoLoop": {
      "currentTaskId": "TASK-...",
      "taskStartedAt": "2026-02-26T12:34:10.000Z",
      "heartbeatAt": "2026-02-26T12:35:00.000Z",
      "watchdogCheckedAt": "2026-02-26T12:35:05.000Z",
      "retry": {
        "regenerateCount": 0,
        "autoRetryCount": 0,
        "manualRevisionCount": 0,
        "totalRetryDurationMs": 0,
        "lastFailureReason": null
      },
      "lastResult": {
        "taskId": "TASK-...",
        "outcome": "done",
        "message": "..."
      }
    }
  },
  "items": [...],
  "updatedAt": "2026-02-26T12:35:00.000Z"
}
```

**向后兼容策略**：

- 保留 `halted: boolean` 作为主状态标识，不引入独立 `status` 枚举字段，避免与 `halted` 语义重叠
- 通过 `halted` + `haltReason` 组合推导运行状态：`halted=false` 且有 `runtime.autoLoop.currentTaskId` → running；`halted=true` → 按 `haltReason` 区分 halted/blocked/stalled
- 移除原方案中的 `lastCheckpointAt` 字段，复用已有的 `updatedAt`（每次 checkpoint 写入时更新）
- 迁移期读兼容：先读 `runtime.autoLoop.*`，缺失时回退读 legacy 顶层字段（`currentTaskId/heartbeatAt/lastResult`）

**理由**：单一 source of truth 避免双文件一致性风险；`runtime` 命名空间在不引入新文件的前提下完成职责分层，减轻 `todo-state.json` 顶层语义拥挤。

**并行 Checkpoint 策略**：

当 `maxAutoParallel > 1` 时，采用原子批量写入策略：
- 等待所有并行 TASK 完成后，统一更新 `todo-state.json`
- 任一 TASK 失败，本批次所有 TASK 状态回退，确保一致性
- 审计日志仍按每个 TASK 实际完成时间追加记录
- `iteration` 在整批完成后递增 1（非每个 TASK 递增）

理由：避免中间态（部分成功/部分失败）导致的状态不一致，且与"一轮迭代"的语义保持一致。

### 4.4 Confirm Policy 与 Auto 模式的协调

`orchestrate` 属于高风险编排能力，必须与全局治理保持一致：默认 `strict`，不因 `--auto` 自动降级。

定义澄清：`--auto` = “批次级确认的自动续航（batch-level autopilot with human checkpoints）”，不是“完全无人值守模式”。

**统一规则（最优解）**：

| 模式 | confirm_policy | 行为 |
|---|---|---|
| `/spec-first:orchestrate`（默认） | `strict` | 批次级确认（Batch 边界确认） |
| `/spec-first:orchestrate --auto` | `strict` | 自动挑选与执行 TASK，但仍在批次边界确认 |
| `/spec-first:orchestrate --auto --resume` | `strict` | 断点恢复后继续自动执行，仍保持批次边界确认 |

说明：

1. `--auto` 只控制“是否自动循环调度”，不改变风险策略。
2. 不引入 `--unattended`，避免绕过人在回路约束。
3. 若后续确有 CI 无人值守需求，应在独立 RFC 中定义白名单与审计前提，不在本期方案内隐式开放。

**Fresh Context Per Task**：

`/spec-first:orchestrate --auto` 模式下，每个 TASK 启动独立的 subagent，确保：
- 每个 TASK 拥有全新的上下文窗口
- 避免 TASK 之间的上下文污染
- 降低长序列执行导致的 token 溢出风险

实现方式：`todo-runner` 调用 `createSubagent({ freshContext: true, taskId })`，而非在同一 context 中连续调用多个 TASK。

### 4.5 参数入口协议（落地约束）

为避免“参数由谁解析”的歧义，统一入口如下：

1. **唯一入口**：`/spec-first:orchestrate`（Skill 路由）
2. **解析位置**：`dispatchCommand(...).args`（skill runtime）
3. **参数白名单**：
- `--auto`
- `--resume`
4. **组合规则**：
- 默认（无参数）：单轮 orchestrate
- `--auto`：开启续航循环
- `--auto --resume`：从 `todo-state.json` 恢复续航
5. **错误处理**：未知参数直接报错并停止，不做隐式忽略
6. **边界声明**：本方案不引入 `spec-first orchestrate` CLI 命令，避免双入口分叉

#### 参数校验契约（可执行）

在 skill runtime 增加 `validateOrchestrateArgs(args)`，并在进入主流程前强制执行：

```typescript
type OrchestrateMode = 'single' | 'auto';
interface OrchestrateArgs {
  mode: OrchestrateMode;
  resume: boolean;
}
```

校验规则：

1. 仅允许：`--auto`、`--resume`
2. 出现未知参数：返回 `E_ORCH_ARGS_UNKNOWN` 并停止
3. `--resume` 仅在 `mode=auto` 合法；否则返回 `E_ORCH_ARGS_RESUME_WITHOUT_AUTO`
4. 参数去重：重复参数按一次处理，并记录 warning

优先级规则（冲突处理）：

1. `--auto --resume` → `mode=auto` 且从 `todo-state.json` 恢复
2. `--auto` → `mode=auto`（新一轮自动调度）
3. 无 `--auto` → `mode=single`（忽略续航相关分支）

---

## 5. 具体方案

### 5.1 `/spec-first:orchestrate --auto`（续航主流程）

复用并扩展 `specs/{featureId}/todo-state.json`（见 4.3 节状态文件统一策略），不新增独立状态文件。

循环算法：

```text
初始化上下文
  -> 读取/创建 todo-state（含 auto-loop 扩展字段）
  -> 读取 maxIterations、maxTaskDurationMs、heartbeatTimeoutMs、watchdogIntervalMs、maxAutoParallel
  -> 启动 watchdog（后台定时检查 heartbeat 与 task duration）
  -> while (iteration < maxIterations)
       1) pickReadyTodos(maxParallel=maxAutoParallel，默认 1)
       2) 无可执行任务
          - unfinished==0 -> done
          - unfinished>0 -> advance iteration（等待依赖满足或达到上限）
       3) 写入 taskStartedAt + 更新 heartbeatAt 时间戳
       4) 执行单轮 orchestrate（confirm_policy 固定 strict）
          - 单 TASK 超过 maxTaskDurationMs -> timeout
          - 触发回退时累计 totalRetryDurationMs
       5) 原子写入 checkpoint（write-tmp-then-rename）
       6) 追加审计日志条目（JSONL + hash chain）
       7) advance iteration
  -> 达上限仍有未完成 -> halted
  -> 关闭 watchdog
```

**关于 `maxAutoParallel`**：
- 现有 `pickReadyTodos` 已支持 `maxParallel=4`，但 auto-loop 模式下默认串行（`maxAutoParallel=1`）以确保执行可追溯性
- 用户可通过配置 `runtime.auto_orchestrate.max_parallel` 调整并行度，但高并行会增加上下文窗口溢出风险
- 每个并行 TASK 启动独立的 subagent，确保 Fresh Context Per Rule（见 10 节风险 6）

#### 原子写入保护

所有状态文件写入采用 write-then-rename 模式，防止中途 kill 导致文件损坏：

```typescript
// 伪代码
const tmpPath = statePath + '.tmp';
writeFileSync(tmpPath, JSON.stringify(state, null, 2));
renameSync(tmpPath, statePath);
```

#### TASK 级超时保护

为防止单个 TASK 在一次执行中卡死并绕过 `max_iterations`，增加 TASK 级硬超时：

- 配置项：`runtime.auto_orchestrate.max_task_duration_ms`
- 默认值：`600000`（10 分钟）
- 行为：超时即中断当前 TASK，记 `haltReason=task_timeout:{taskId}`，并记录 `task_timeout` 审计事件
- 判定口径：`Date.now() - taskStartedAt > maxTaskDurationMs`

#### Heartbeat 超时检测

参考 Temporal Activity Heartbeat 模式，增加 stalled 检测：

- 每轮循环与 TASK 进度回调都更新 `heartbeatAt`
- 增加后台 watchdog 线程/定时器（默认每 `watchdog_interval_ms=10000` 检查一次）
- 运行中若 `Date.now() - heartbeatAt > heartbeatTimeoutMs`，watchdog 主动触发 `stalled_timeout`
- resume 时仍保留一次被动检查，作为兜底
- 超时时不新增 Todo item status；仅设置运行态 `halted=true` 与 `haltReason=stalled_timeout`
- 默认 `heartbeatTimeoutMs: 300000`（5 分钟）

#### 审计日志（Append-Only JSONL）

参考 Temporal Event History，增加 `specs/{featureId}/orchestrate-audit.jsonl`：

```jsonl
{"ts":"2026-02-26T12:34:56Z","event":"task_start","taskId":"TASK-AUTH-001","step_id":"auth_generate","iteration":1,"prevHash":"0","hash":"c7f4..."}
{"ts":"2026-02-26T12:35:15Z","event":"task_progress","taskId":"TASK-AUTH-001","step_id":"auth_generate","progress":"1/3_files","lastCompleted":"src/auth/model.ts","prevHash":"c7f4...","hash":"a11c..."}
{"ts":"2026-02-26T12:35:30Z","event":"task_complete","taskId":"TASK-AUTH-001","step_id":"auth_generate","iteration":1,"duration":34000,"regenerateCount":0,"prevHash":"a11c...","hash":"de9b..."}
{"ts":"2026-02-26T12:35:31Z","event":"task_start","taskId":"TASK-AUTH-002","step_id":"auth_generate","iteration":2,"prevHash":"de9b...","hash":"0f3a..."}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `ts` | string | ISO 8601 时间戳 |
| `event` | string | 事件类型：`task_start` / `task_progress` / `task_complete` / `task_retry` / `task_blocked` |
| `taskId` | string | 关联的 TASK ID |
| `step_id` | string | 确定性步骤标识（同一 TASK 不同轮次可关联，格式：`TASK-ID:步骤名`） |
| `iteration` | number | 循环轮次 |
| `progress` | string | 进度信息（格式：`"当前/总数_单位"`，如 `"1/3_files"`） |
| `lastCompleted` | string | 最后完成的工作单元（文件路径、函数名等） |
| `duration` | number | 执行耗时（毫秒，仅 `task_complete` 事件） |
| `regenerateCount` | number | 回退重生成累计次数（统一计数口径） |
| `prevHash` | string | 前一条日志哈希（首条为 `0`） |
| `hash` | string | 当前条目哈希（`sha256(canonicalJsonWithoutHash + prevHash)`） |

审计日志只追加不修改，用于事后调试和执行回溯，不参与运行时决策。通过哈希链可检测删除/篡改。

### 5.2 双重完成检测（P4→P5）

在 `phase-machine` 增加完成守卫：

1. P4 写入成功（技术条件）
2. 产出物完整性达标（业务条件）

#### 前置依赖：扩展 TRANSITIONS

当前 `phase-machine.ts` 的 `TRANSITIONS` 仅允许 P3→P2 回退。完成检测失败需要 P4→P2 回退路径，必须先扩展：

```typescript
// 需新增的合法转换
P4_WRITE -> P2_GENERATE  // 完成检测失败回退
```

此扩展是 Phase B 的硬前置依赖。

#### 完整性最低标准（MVP）

1. 目标文件存在且非空
2. 关键标记存在（由 Skill `completion_markers` 声明）
3. 最小内容阈值达标（如行数/字段数）
4. 语义约束达标（如关键术语命中、实体最小数量）

#### Skill 完成标记契约

在 Skill Front Matter 中增加 `completion_markers` 字段，使判定规则可配置：

```yaml
# 示例：spec skill
completion_markers:
  target_file: "spec.md"
  required_sections:
    - "## 功能需求"
    - "## 非功能需求"
  min_lines: 30
  contains_pattern:
    - "幂等|idempotent"
    - "回滚|rollback"
  min_entities:
    api_endpoint: 2
    data_model: 1
```

语义校验采用可重复的确定性规则（正则/计数），不引入额外 LLM 判定。

未声明 `completion_markers` 的 Skill 仅做"文件存在且非空"基础检查。

#### 有限回退机制（防死循环）

参考 Flowcraft retry-with-backoff 模式，增加单 TASK 最大回退次数：

1. 所有回退到 P2 的路径（`P3_CONFIRM -> P2_GENERATE` 与 `P4_WRITE -> P2_GENERATE`）统一消耗 `regenerateCount`
2. `regenerateCount >= maxRetryPerTask`（默认 3）时，不再回退，标记 `blocked`
3. blocked 任务暂停并上报，由用户决定处理方式
4. 运行级累计重试耗时超过 `maxTotalRetryDurationMs` 时，直接 `halted`

```text
P4 完成检测失败
  -> regenerateCount < maxRetryPerTask?
     -> YES: 回退 P2 重生成，regenerateCount++
     -> NO:  标记 blocked，halt 并上报
```

#### 失败原因注入（P4→P2）

每次完成检测失败后，生成结构化失败原因并注入下一轮 P2 Prompt，避免“同错重试”：

```text
## 上次失败原因（必须先修复）
- failure_code: missing_required_section
- failed_rule: completion_markers.required_sections
- expected: 包含 "## API 契约"
- actual: 未找到该章节
- fix_hint: 在输出中新增 API 契约章节，并补充 endpoint/request/response
```

注入规则：

1. 仅注入最近一次失败原因（避免 prompt 膨胀）
2. 新失败会覆盖旧失败，但审计日志保留完整历史
3. 同一失败 fingerprint 连续出现 2 次以上时，提升为 `high-risk retry` 并强制进入 backoff

#### 退避策略与重试成本上限

为避免高频重试放大资源消耗，增加两级约束：

1. **退避**：`retry_backoff_ms`（默认 `2000`）+ 指数退避 + 抖动
2. **总预算**：`max_total_retry_duration_ms`（默认 `900000`，15 分钟）

```text
delay = min(retry_backoff_ms * 2^attempt, 30000) + jitter(0~500ms)
if totalRetryDurationMs > maxTotalRetryDurationMs -> halted:retry_budget_exhausted
```

#### 错误分类与重试策略

参考 Temporal 的错误分类模式，将 P4 完成检测失败的原因分为两类：

| 错误类型 | 定义 | 处理策略 | 示例 |
|---------|------|----------|------|
| **临时错误** | 可能通过重试解决的失败 | 计入 `regenerateCount`，回退 P2 并执行 backoff | 文件写入权限暂时拒绝、AI 响应超时 |
| **永久错误** | 重试无法解决的失败 | 不计入 `regenerateCount`，直接标记 `blocked` | 目标路径不可达、磁盘空间不足、配置错误 |

**判定规则**：

```typescript
// 伪代码：错误分类判定
function isPermanentError(error: Error): boolean {
  const permanentPatterns = [
    /ENOENT/,           // 文件不存在（目标目录缺失）
    /ENOSPC/,           // 磁盘空间不足
    /EACCES.*denied/,   // 权限拒绝（非临时性）
    /invalid.*config/,  // 配置错误
  ];
  return permanentPatterns.some(p => p.test(error.message));
}
```

**重试策略**：

- 临时错误：计入 `regenerateCount`，回退 P2 重生成并执行 backoff
- 永久错误：立即标记 `blocked`，不消耗 `regenerateCount`
- 未知错误：保守处理，按临时错误计入 `regenerateCount`

此分类确保 `maxRetryPerTask` 与 `maxTotalRetryDurationMs` 仅用于真正的"可重试"场景，避免因配置错误等永久问题浪费重试预算。

#### P4 写入幂等性保证

回退 P2 重执行时，P4 写入必须是幂等的。Skill 可通过 Front Matter 声明写入模式：

```yaml
# SKILL.md
write_mode: overwrite  # overwrite | append | merge
```

**幂等性保证策略**：

| write_mode | 行为 | 适用场景 | MVP 支持 |
|-----------|------|----------|----------|
| `overwrite` | 直接全量覆盖，天然幂等 | 代码生成、配置文件 | ✅ Phase B |
| `append` | 重执行时先删除旧文件再写入 | 日志文件、增量报告 | ✅ Phase B |
| `merge` | 调用 Skill 提供的 merge 函数合并 | 需保留人工修改的场景 | ⏸ 后续版本 |

默认使用 `overwrite`。未声明 `write_mode` 的 Skill 默认为 `overwrite`。

**实现示例**：

```typescript
function idempotentWrite(path: string, content: string, mode: WriteMode) {
  switch (mode) {
    case 'overwrite':
      // 直接覆盖，天然幂等
      return fs.writeFile(path, content);
    case 'append':
      // 先清理旧内容再写
      if (fs.existsSync(path)) fs.unlinkSync(path);
      return fs.writeFile(path, content);
    case 'merge':
      // 调用 Skill 提供的合并函数
      return mergeAndWrite(path, content);
  }
}
```

#### 全局默认完成检测模板

为减少每个 Skill 重复声明，支持双层加载：

1. **全局默认**（随 CLI 分发）：`templates/completion/default-markers.yaml`
2. **项目级覆盖**：`.spec-first/completion-markers.yaml`
3. **Skill 级覆盖**：Skill Front Matter 的 `completion_markers`

全局默认模板示例：

```yaml
# templates/completion/default-markers.yaml
defaults:
  target_file: "output.md"
  required_sections:
    - "## 概要"
    - "## 详情"
  min_lines: 10
  contains_pattern: []
  min_entities: {}

# 按 skill_type 覆盖
overrides:
  spec:
    required_sections: ["## 功能需求", "## 非功能需求", "## 追踪矩阵"]
    min_lines: 50
  code:
    target_file_pattern: "src/**/*.ts"
    min_lines: 20
```

优先级：Skill 级 > 项目级 > 全局默认。

### 5.3 AI 注释 slop 检测（P4 后置拦截）

#### 执行接口关系

`gate-engine/sca.ts` 当前是阶段/矩阵一致性检查；slop 检测是“本轮改动文件”级检查，二者输入模型不同，应拆分为独立 checker：

```text
gate-engine/
  sca.ts           # 阶段一致性（FR/DS/TASK/TC）
  slop-checker.ts  # 文件级规则（changed files）
```

#### 规则文件：双层加载

1. **全局默认规则**（随 CLI 分发）：`templates/sca/default-slop-patterns.yaml`
2. **项目级覆盖**：`.spec-first/ai-slop-patterns.yaml`

项目级规则与全局规则合并，项目级同 ID 规则覆盖全局规则。

全局默认规则示例：

```yaml
patterns:
  - id: todo_placeholder
    regex: "//\\s*TODO:\\s*implement"
  - id: redundant_explain
    regex: "//\\s*This function"
```

执行点：

1. P4 写入后扫描本轮变更文件
2. 命中规则则阻断进入 P5
3. 返回修复提示并回退 P2

### 5.4 层级化 `_context.md` 自动生成与加载

#### 生成规则

1. 在 `init` 或 `analyze` 过程中扫描 `src/` 关键目录
2. 为模块目录生成 `_context.md`

生成内容模板：

```markdown
# {模块名} 上下文

## 职责
{一句话描述模块职责}

## 公开 API
{导出的函数/类/类型列表，含简要签名}

## 依赖关系
{import 的内部模块列表}

## 关键约束
{该模块的设计约束或注意事项}
```

#### 更新策略

| 触发时机 | 行为 | 说明 |
|---|---|---|
| `init` | 首次生成 | 扫描目录结构，生成骨架并产出 diff 预览 |
| `analyze` / `sync` | 增量更新 | 检测文件变更，更新受影响模块的 `_context.md` |
| `code` skill P4 完成后 | 按需标记过期 | 若本轮修改了模块公开 API，标记对应 `_context.md` 为 stale |

过期的 `_context.md` 在下次 `analyze`/`sync` 时自动再生成。

首次生成审核规则：

1. 默认开启 `review_on_first_generate=true`
2. 提供“接受全部 / 按文件接受 / 跳过本次”三种操作
3. 跳过不阻断流程，但在审计日志记录 `context_review_skipped`

#### 与 Context Pack 的集成

`_context.md` 的加载集成到现有 `context-pack.ts` 的 `buildTaskContextPack()` 流程中（而非 `buildReferences()`）：

1. `code` skill 的 P1_CONTEXT 阶段调用 `buildTaskContextPack(taskId, ...)`
2. 在 `buildTaskContextPack` 内部按当前 TASK 涉及路径查找对应 `_context.md`
3. 找到则把摘要注入 `TaskContextPack.moduleContexts[]`（新增字段，MVP 只存摘要文本）
4. `contextSize` 计入 `moduleContexts` 大小，仍保持 2KB 软阈值告警
5. 未找到时静默降级，不阻断流程

2KB 软阈值依据（文档级解释）：

1. UTF-8 文本 2KB 在中英混合场景约为 600-900 tokens
2. 该增量相对单 TASK 常规上下文包（约 6k-8k tokens）通常增加 10%-15%
3. 因此设置为“软阈值告警而非硬阻断”，用于控制成本并保留可用性

**注入代码位置**：`context-pack.ts` 的 `TaskContextPack` 类型定义（约 250 行）与 `buildTaskContextPack()` 组装逻辑（约 261-302 行）。

**实现前置约束**：

1. 先在 `TaskContextPack` 类型中新增可选字段 `moduleContexts?: string[]`
2. 再在 `buildTaskContextPack()` 中填充该字段并计入 `contextSize`
3. 在上述类型扩展落地前，不应在实现层直接读取 `pack.moduleContexts`

**多上下文合并策略**：

当 TASK 关联多个 `_context.md` 时，按以下策略处理：

| 匹配结果 | 策略 | 说明 |
|---------|------|------|
| 单个 `_context.md` | 直接注入 | 最常见场景 |
| 多个 `_context.md` | 全部注入 | 按目录层级排序，父目录在前 |
| 无 `_context.md` | 静默降级 | 不阻断流程，仅记录 warning |

配置控制：
```yaml
runtime:
  context_pack:
    merge_strategy: all  # all | closest | parent-only
```

- `all`：注入所有匹配的 `_context.md`（默认，完整上下文）
- `closest`：仅注入最接近 TASK 的 `_context.md`（节省 token）
- `parent-only`：仅注入父目录的 `_context.md`（避免过度细节）

#### ContextProvider 扩展接口（解耦 TaskContextPack 扩展点）

为避免每次新增上下文类型都同时修改类型定义、构建逻辑、大小校验三处，抽象统一扩展接口：

```typescript
interface ContextProvider {
  id: string;
  collect(input: TaskContextInput): Promise<string[]>;
  estimateSize(chunks: string[]): number;
}
```

MVP 内置 Provider：

1. `referencesProvider`（现有 references）
2. `moduleContextProvider`（`_context.md`）
3. 后续扩展（如 API 契约摘要）通过注册机制接入，不改核心组装流程

#### TASK→模块路径映射算法（MVP）

路径来源优先级（从高到低）：

1. TASK 文本中的显式路径标注（如 `src/core/a.ts`）
2. 矩阵中的 API 路径或 DS 绑定路径
3. 最近一次该 TASK 的代码变更文件（git diff）

命中第一条即停止向下回退，避免过度扫描。

无 git 场景回退：

1. 若项目非 git 仓库、无可用 diff、或首次运行无历史变更，则跳过第 3 条
2. 若第 1/2 条均未命中，则本轮 `_context.md` 自动加载降级为“仅 TASK Context Pack”，不阻断流程

### 5.5 Skill `required_mcps` 声明机制

在 Skill Front Matter 增加：

```yaml
required_mcps:
  - sequential-thinking
  - context7
```

运行时行为（MVP）：

1. 解析并展示所需 MCP 清单
2. 写入 Context Pack 提示
3. 不做进程级启动/销毁托管

#### 与 Doctor 命令集成

在 `doctor` 命令中增加 MCP 可用性检查：

```bash
$ spec-first doctor

...
✓ required MCP: sequential-thinking (available)
✗ required MCP: context7 (not found)
  → 运行 'npx -y @modelcontextprotocol/create-server context7' 安装
✓ required MCP: serena (available)

检查完成：3 个 Skill，2 个 MCP 可用
```

用户在执行 Skill 前即可知道缺少哪些 MCP，而非运行时才发现。

### 5.6 Skill Front Matter 统一解析层

`completion_markers`（5.2）与 `required_mcps`（5.5）都依赖 Skill Front Matter。为避免重复实现，新增统一解析层：

```typescript
interface SkillMeta {
  required_mcps?: string[];
  completion_markers?: {
    target_file?: string;
    required_sections?: string[];
    min_lines?: number;
    contains_pattern?: string[];
    min_entities?: Record<string, number>;
  };
  write_mode?: 'overwrite' | 'append' | 'merge';  // P4 写入幂等性模式
}

interface ParsedSkill {
  meta: SkillMeta;
  body: string;
}
```

约束：

1. `loadSkill` 前先执行 `parseSkillFrontMatter()`
2. 解析失败时给出显式错误（不 silently fallback）
3. `completion_guard` 与 `required_mcps` 必须复用同一 `meta` 结构

---

## 6. 配置设计

最小配置延用：

```yaml
runtime:
  max_iterations: 20
```

扩展建议：

```yaml
runtime:
  auto_orchestrate:
    enabled: true
    stop_on_blocked: true
    max_task_duration_ms: 600000
    heartbeat_timeout_ms: 300000
    watchdog_interval_ms: 10000
    max_retry_per_task: 3
    retry_backoff_ms: 2000
    max_total_retry_duration_ms: 900000
    max_parallel: 1  # auto 模式下默认串行，可调整但高并行增加上下文溢出风险
  completion_guard:
    enabled: true
  slop_check:
    enabled: true
  audit_log:
    enabled: true
    tamper_proof: hash_chain
  context_pack:
    merge_strategy: all
    review_on_first_generate: true
```

注意：`checkpoint_file` 不再单独配置，auto-loop 状态统一写入 `todo-state.json`（见 4.3 节）。

### 6.1 配置 Schema 变更表（实现前置）

| 配置项 | 文档目标 | 当前实现状态 | 必要动作 |
|---|---|---|---|
| `runtime.auto_orchestrate.enabled` | 控制 auto-loop 开关 | 未解析 | 扩展 `SpecFirstConfig` + `mergeWithDefaults` |
| `runtime.auto_orchestrate.stop_on_blocked` | blocked 是否自动 halt | 未解析 | 增加布尔解析与默认值 |
| `runtime.auto_orchestrate.max_task_duration_ms` | 单 TASK 最大执行时长 | 未解析 | 增加数值解析与范围校验（建议 60000-3600000） |
| `runtime.auto_orchestrate.heartbeat_timeout_ms` | stalled 超时阈值 | 未解析 | 增加数值解析与范围校验 |
| `runtime.auto_orchestrate.watchdog_interval_ms` | watchdog 检查周期 | 未解析 | 增加数值解析与范围校验（建议 1000-60000） |
| `runtime.auto_orchestrate.max_retry_per_task` | 单 TASK 回退上限 | 未解析 | 增加数值解析与范围校验 |
| `runtime.auto_orchestrate.retry_backoff_ms` | 重试基础退避时间 | 未解析 | 增加数值解析与范围校验（建议 100-30000） |
| `runtime.auto_orchestrate.max_total_retry_duration_ms` | 运行级重试总耗时上限 | 未解析 | 增加数值解析与范围校验（建议 60000-7200000） |
| `runtime.auto_orchestrate.max_parallel` | auto-loop 并行度上限 | 未解析 | 增加数值解析与范围校验（建议 1-4） |
| `runtime.completion_guard.enabled` | 完整性守卫开关 | 未解析 | 增加布尔解析 |
| `runtime.slop_check.enabled` | slop 拦截开关 | 未解析 | 增加布尔解析 |
| `runtime.audit_log.enabled` | 审计日志开关 | 未解析 | 增加布尔解析 |
| `runtime.audit_log.tamper_proof` | 审计日志防篡改策略 | 未解析 | 增加枚举解析（none/hash_chain） |
| `runtime.audit_log.rotation_size_mb` | 审计日志单文件最大大小 | 未解析 | 增加数值解析与范围校验（建议 1-100） |
| `runtime.audit_log.max_files` | 审计日志最多保留文件数 | 未解析 | 增加数值解析与范围校验（建议 1-20） |
| `runtime.audit_log.compression` | 是否压缩历史审计日志 | 未解析 | 增加布尔解析 |
| `runtime.context_pack.merge_strategy` | 多上下文合并策略 | 未解析 | 增加枚举解析（all/closest/parent-only） |
| `runtime.context_pack.review_on_first_generate` | 首次生成 `_context.md` 是否触发审核 | 未解析 | 增加布尔解析 |

落地要求：上述项未完成 schema 扩展前，不得宣称”可配置已生效”。

---

## 7. 与现有机制兼容

### 7.1 Hard-Gate

每轮执行前调用 `evaluateSkillHardGate('orchestrate', projectRoot)`：

- `BLOCKED` 直接停止并写 `haltReason`
- `PASS/WARN` 继续

### 7.2 Confirm Policy

`--auto` 模式下保持 `strict`，不做隐式降级。摘要：

- `/spec-first:orchestrate`（默认）：`strict`，保留确认，不自动越权
- `/spec-first:orchestrate --auto`：`strict`，自动调度但批次边界仍确认
- `/spec-first:orchestrate --auto --resume`：`strict`，恢复续航后保持同样确认策略

### 7.3 Phase Machine TRANSITIONS 扩展

当前 `phase-machine.ts` 的 `TRANSITIONS` 仅允许 P3→P2 回退。双重完成检测（5.2）需要 P4→P2 回退路径：

```typescript
// 需新增的合法转换（在 TRANSITIONS 常量中）
P4_WRITE: ['P5_SIDE_EFFECT', 'P2_GENERATE'],  // 新增 P2_GENERATE
```

此扩展是 Phase B 的硬前置依赖，建议在 Phase A 末尾完成。

**状态机图**：

```text
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
  P2_GENERATE ──► P3_CONFIRM ──► P4_WRITE ──► P5_SIDE_EFFECT
                    │              │
                    │              └───────────────────────────┐
                    │                                        │
                    └────────────────────────────────────────┘
                                          │
                                          ▼ (完成检测失败)
                                    P2_GENERATE (重新生成)
                                          │
                                          ▼ (regenerateCount >= max)
                                    HALTED(run-level, blocked)
```

**扩展点说明**：
- 本期新增：`P4_WRITE -> P2_GENERATE`（完成检测失败回退）
- 本期不扩展：`P4_WRITE -> ABORTED`（继续使用 run-level `halted` 表达）

**统一计数口径（修复分散计数）**：

1. `regenerateCount`：统一计入所有回退到 P2 的次数（含 `P3->P2` 与 `P4->P2`）
2. `manualRevisionCount`：仅观测用途（人工确认回退次数）
3. `autoRetryCount`：仅观测用途（完成检测失败重试次数）
4. 阻断阈值只看 `regenerateCount`，避免双计数或口径绕过
5. 迁移期兼容：若存在 legacy `revisionCount/retryCount`，启动时折算为 `regenerateCount=max(revisionCount,retryCount)`

边界说明：

1. 本期仅新增 `P4_WRITE -> P2_GENERATE` 回退路径用于“完成检测失败重生成”
2. `ABORTED` 路径保持现状，不在本期扩展到 `P4_WRITE`
3. P4 发生不可恢复错误时，使用 run-level `halted=true + haltReason` 表达，而非新增状态机转移
4. 重试预算统一由 `regenerateCount` + `max_retry_per_task` + `max_total_retry_duration_ms` 三元约束

### 7.4 Gate 与 Verify

- 任务级：最小校验（完成检测 + slop 检测）
- 阶段级：保留完整 verify 证据链后再推进

### 7.5 Todo 状态词汇统一

当前存在词汇不一致：`todo-runner` 使用 `done`，部分 Hook 脚本出现 `complete/done/verified` 并存。

**决策**：统一 canonical status 为 `done`，在 Hook 脚本中做兼容映射：

```typescript
// 兼容映射
const normalizeStatus = (s: string) =>
  s === 'complete' || s === 'verified' ? 'done' : s;
```

统一字典：

| 输入词汇 | 归一结果 |
|---|---|
| `done` | `done` |
| `complete` | `done` |
| `verified` | `done` |
| `in progress` | `in_progress` |

边界：`stalled` 不是 `TodoStatus`，仅作为 run-level `haltReason`。

**TodoStatus 类型定义**：

```typescript
// 规范化后的 TodoStatus
type TodoStatus = 'pending' | 'in_progress' | 'done' | 'blocked';

// 归一化函数
function normalizeTodoStatus(input: string): TodoStatus {
  const map: Record<string, TodoStatus> = {
    'done': 'done',
    'complete': 'done',
    'verified': 'done',
    'in progress': 'in_progress',
    'pending': 'pending',
    'blocked': 'blocked',
  };
  return map[input.toLowerCase()] ?? input;
}
```

**运行态状态（非 TodoStatus）**：

```typescript
// run-level haltReason 规范码（用于解析/聚合）
type HaltReasonCode =
  | 'completed'              // 正常完成
  | 'max_iterations_reached' // 达到迭代上限
  | 'blocked'                // TASK 被阻塞
  | 'stalled_timeout'        // 心跳超时
  | 'permanent_error';       // 永久错误

// 持久化契约保持 string，兼容当前实现与历史格式
type HaltReason = string;

// canonical 格式（推荐）
// - `${code}`
// - `${code}:${taskId}:${detail}`
//
// legacy 格式（兼容）
// - `max_iterations reached: ${current}/${max}`
```

注意：`stalled` 不是 TodoStatus，仅作为 run-level `haltReason`。

---

## 8. 实施计划

### Phase A（P0/P1，1.5 周，MVP + 可靠性基础）

1. Todo 状态词汇统一（`done` 为 canonical，兼容映射）
2. `todo-state.json` 扩展 auto-loop 字段（见 4.3 节）
3. `/spec-first:orchestrate --auto/--resume` 参数入口（按 4.5 节统一协议）
4. 主循环接入 `todo-runner`（拆分为两步）：
   - **A4a**：循环框架 + pickReadyTodos + iteration 控制（约 2-3 小时）
   - **A4b**：原子写入保护 + active heartbeat/watchdog + 审计日志 hash chain（约 3-4 小时）
5. `max_task_duration_ms` TASK 级超时与 `task_timeout` haltReason
6. Confirm Policy 一致性逻辑（见 4.4 节，保持 strict）
7. TRANSITIONS 扩展：P4→P2 回退路径（Phase B 前置依赖）
8. 配置 schema 扩展（见 6.1 节，含 `max_parallel/max_task_duration_ms/watchdog_interval_ms`）

### Phase B（P1，完成可靠性）

1. P4→P5 双重完成检测（结构 + 语义，含 `completion_markers` 契约）
2. 有限回退机制（统一 `regenerateCount` + `max_retry_per_task`）
3. 失败原因注入（P4→P2）+ retry fingerprint 检测
4. backoff 与重试总预算（`retry_backoff_ms` + `max_total_retry_duration_ms`）
5. P4 写入幂等性保证
6. `catchup` 补 auto-loop 状态摘要
7. Front Matter 统一解析层（见 5.6 节）

说明：Heartbeat 与审计日志在 Phase A 的 A4b 已落地，Phase B 不重复列为实现项。

### Phase C（P2，质量与治理）

1. Slop 规则文件（全局默认 + 项目级覆盖）与写后拦截（独立 checker）
2. `_context.md` 自动生成（含模板）与自动加载（集成 Context Pack）
3. `required_mcps` 声明解析与提示注入
4. `doctor` 命令增加 MCP 可用性检查

### 8.4 契约测试清单（新增）

1. 参数协议：`tests/unit/orchestrate-args-parser.test.ts`
2. 配置 schema：`tests/unit/config-schema-runtime-extensions.test.ts`
3. 状态归一：`tests/unit/todo-status-normalize.test.ts`
4. Front Matter 解析：`tests/unit/skill-frontmatter-parser.test.ts`
5. P4→P2 回退契约：`tests/unit/phase-machine-p4-rollback.test.ts`
6. slop checker 接口：`tests/unit/slop-checker-contract.test.ts`

### 8.5 端到端集成测试计划（新增）

1. Orchestrate Happy Path：`tests/e2e/orchestrate-auto-happy.e2e.ts`
2. Watchdog + Heartbeat 超时：`tests/e2e/orchestrate-watchdog-timeout.e2e.ts`
3. TASK 级超时：`tests/e2e/orchestrate-task-timeout.e2e.ts`
4. Backoff + Retry Budget：`tests/e2e/orchestrate-retry-budget.e2e.ts`
5. 审计日志哈希链校验：`tests/e2e/orchestrate-audit-hash-chain.e2e.ts`

---

## 9. 验收标准

### 9.1 功能验收

1. 单次触发可连续推进多个 TASK
2. 中断后可从断点恢复
3. 达到上限可停止并输出未完成摘要
4. 不完整产出可被识别并回退
5. 命中 slop 规则可阻断并提示修复
6. Skill 可声明并输出 MCP 依赖

### 9.2 测试验收（建议新增）

- `tests/unit/orchestrate-auto-loop.test.ts`
  - 正常推进
  - resume 恢复
  - max_iterations 停止
  - blocked 停止
  - max_task_duration 超时
  - watchdog 主动超时检测
- `tests/unit/completion-guard.test.ts`
  - 完整性通过/失败回退
  - contains_pattern / min_entities 语义规则
- `tests/unit/slop-checker.test.ts`
  - 规则命中/白名单
- `tests/unit/context-autoload.test.ts`
  - `_context.md` 自动加载
- `tests/unit/skill-frontmatter-required-mcps.test.ts`
  - `required_mcps` 解析与注入
- `tests/unit/orchestrate-args-parser.test.ts`
  - `--auto/--resume` 组合与非法参数
- `tests/unit/config-schema-runtime-extensions.test.ts`
  - runtime 扩展配置解析与校验
- `tests/unit/retry-controller.test.ts`
  - 失败原因注入
  - backoff 计算与上限
  - max_total_retry_duration 预算耗尽

---

## 10. 风险与控制

| # | 风险 | 控制措施 | 阶段 |
|---|------|----------|------|
| 1 | 无限循环 | `max_iterations` 硬上限 + halted 原因落盘 | A |
| 2 | 误判不完整导致回退过多 | `max_retry_per_task` + `max_total_retry_duration_ms` 双阈值，超限标记 blocked/halted | B |
| 3 | slop 误报 | 白名单 + 双层可配置规则（全局默认 + 项目级覆盖） | C |
| 4 | 上下文文件过期 | `analyze`/`sync` 中支持再生成 + stale 标记机制 | C |
| 5 | 状态文件损坏（中途 kill） | write-then-rename 原子写入模式 | A |
| 6 | 上下文窗口溢出（连续多 TASK） | 强制执行 Fresh Context Per Task 规则，每个 TASK 启动全新 subagent | A |
| 7 | 双文件状态不一致 | 统一为 `todo-state.json` 单一 source of truth（见 4.3 节） | A |
| 8 | P4 回退重执行产生重复内容 | P4 写入采用全量覆盖（幂等），写入前清理中间产物 | B |
| 9 | stalled 任务无感知 | active watchdog + resume 被动检查双通道检测 | A |
| 10 | 并行 checkpoint 中间态 | 采用原子批量写入策略，任一失败整批回退 | A |
| 11 | write_mode 不匹配导致数据丢失 | Skill 默认 overwrite，显式声明才启用 append/merge | B |
| 12 | 审计日志被删改 | JSONL hash chain（`prevHash/hash`）+ 轮转校验 | A |
| 13 | 单 TASK 长时间卡死 | `max_task_duration_ms` 超时中断并记录 `task_timeout` | A |

---

## 11. 价值结论

这 5 项不是同一类问题，但放在同一方案中分层落地是合理的：

1. Phase A 先解决”基础设施统一 + 能跑起来”（状态统一、auto 入口、原子写入）
2. Phase B 再解决”跑完且不假完成”（结构+语义完成检测、失败原因注入、退避重试）
3. Phase C 最后解决”写得更好、上下文更准、能力更清晰”（slop、_context.md、MCP 声明）

结论：建议按本方案分阶段实施，先拿基础设施和执行可靠性收益，再补质量与治理能力。

---

## 12. 结合最新代码的审查结论（2026-02-26）

以下为“这五个问题”在当前代码基线中的状态，已同步到本方案：

| 问题 | 当前状态 | 代码证据（示例） | 结论 |
|---|---|---|---|
| 4. Todo 续航执行器主流程接入 | 部分存在（有 runner，无 auto 主循环） | `src/core/ai-orchestrator/todo-runner.ts` 已有挑选与状态推进；`src/core/ai-orchestrator/catchup.ts` 仅摘要状态；`/spec-first:orchestrate` 尚无 `--auto/--resume` 实际入口 | 问题仍存在 |
| 5. AI 注释 slop 检测 | 未发现实现 | 未发现 `.spec-first/ai-slop-patterns.yaml` 规则与 P4 写后拦截实现 | 问题仍存在 |
| 6. 双重完成检测（P4→P5） | 未发现实现 | `src/core/skill-runtime/phase-machine.ts` 当前为阶段推进/确认策略，未见“完整性判定 + 回退 P2”闭环 | 问题仍存在 |
| 7. 层级化上下文自动生成 | 未发现实现 | 未发现 `_context.md` 自动生成与 `code` 执行前自动加载链路 | 问题仍存在 |
| 8. Skill 内嵌 MCP 生命周期声明（`required_mcps`） | 未发现实现 | `src/core/skill-runtime/dispatcher.ts` 当前未见 `required_mcps` front matter 解析与注入 | 问题仍存在 |

补充审查发现（与 4/6 直接相关）：

1. Todo 完成态存在词汇不一致风险：`todo-runner` 使用 `done`，部分 Hook 脚本出现 `complete/done/verified` 并存。**已在 7.5 节给出统一方案**。

### 12.1 本文档已覆盖关系确认

本方案第 5 章已分别覆盖：

1. 5.1 对应问题 4（Todo 续航主流程接入）
2. 5.2 对应问题 6（双重完成检测）
3. 5.3 对应问题 5（AI 注释 slop 检测）
4. 5.4 对应问题 7（层级化 `_context.md`）
5. 5.5 对应问题 8（`required_mcps`）

结论：这 5 个问题已全部纳入本技术方案，并在本次审查中明确为”当前仍存在、需实施修复”。

### 12.2 双 Agent 复核纪要（2026-02-26）

| Agent | 关注点 | 结论 |
|------|--------|------|
| Agent-A（状态机一致性） | 文档状态机图、Phase 术语、Blocked 语义 | 存在偏差：图中 `P3_INTERACT` 与 `BLOCKED` 易被误解为 phase-level 状态；已修正为 `P3_CONFIRM` 与 run-level halted 表达 |
| Agent-B（运行时契约一致性） | `haltReason` 结构、重试计数口径、`TaskContextPack` 字段契约 | 存在偏差：`haltReason` 与当前实现格式不一致，Blocked 场景计数文案含糊，`moduleContexts` 先于类型定义；已修正为兼容契约+前置约束 |

一致决议：5 个核心问题均真实存在；本次 v2.1.0 已补齐可靠性增强项（超时、watchdog、语义检测、退避与预算、防篡改等）文档约束，代码实现按“先类型契约、后注入逻辑”顺序推进。

---

## 13. 业界最佳实践参考

本方案在审查中参考了以下业界实践，并将关键模式融入设计：

| 来源 | 关键模式 | 本方案对应 |
|------|----------|-----------|
| Temporal Durable Execution | Event History 持久化每一步，故障后从最近状态恢复 | 5.1 审计日志（JSONL+hash chain）+ 原子写入 |
| Temporal Activity Heartbeat | 长时间任务定期上报存活状态，超时自动标记 stalled | 5.1 active watchdog + heartbeat 双通道检测 |
| Temporal Retry Policy | 可配置的重试策略（max_interval、backoff） | 5.2 有限回退 + backoff + retry budget |
| Flowcraft Checkpoint/Resume | serializedContext 支持完整恢复，显式 wait node | 5.1 checkpoint 持久化 + 4.4 strict 批次确认 |
| Flowcraft Reconciler | 定期扫描检测 stalled workflow 并恢复 | 5.1 watchdog 定期检测 + resume 兜底 |
| Flowcraft Retry-with-Backoff | 失败后带退避的重试，避免死循环 | 5.2 `regenerateCount` 限制 + backoff + blocked 兜底 |

### 未采纳但值得关注的模式

| 模式 | 说明 | 不采纳原因 | 后续考虑 |
|------|------|-----------|----------|
| Temporal Saga Pattern | 分布式事务补偿 | 当前为单机文件系统，无分布式场景 | 多 Feature 并行时可能需要 |
| Flowcraft Dynamic Graph | 运行时动态修改工作流拓扑 | 当前阶段状态机是静态的，够用 | 自适应流程裁剪时可能需要 |
| Event Sourcing | 完整事件流重放 | JSONL 审计日志已覆盖基本需求 | 需要时间旅行调试时可升级 |

---

## 14. E2E 测试场景

### 14.1 正常完成路径（Happy Path）

**前置条件**：
- Feature 有 3 个 TASK，全部依赖已满足
- 配置 `max_iterations=10`，`max_retry_per_task=3`

**执行步骤**：
1. 执行 `/spec-first:orchestrate --auto`
2. 循环完成 TASK-1 → TASK-2 → TASK-3
3. 每个 TASK 首次 P4→P5 通过，无需回退
4. 全部完成后 `halted=false`，无 `haltReason`

**预期结果**：
- `todo-state.json` 的 3 个 TASK 状态均为 `done`
- `iteration=3`（实际执行 3 轮）
- `orchestrate-audit.jsonl` 包含 6 条记录（3 次启动 + 3 次完成）
- 任何 TASK 的 `regenerateCount=0`

### 14.2 Blocked 路径（完成检测失败）

**前置条件**：
- Feature 有 1 个 TASK，`completion_markers` 要求含 `## API 契约` 章节
- 配置 `max_retry_per_task=3`

**执行步骤**：
1. 执行 `/spec-first:orchestrate --auto`
2. TASK P4 写入产物但缺少 `## API 契约` 章节
3. 完成检测失败，回退 P2 重生成
4. 系统注入失败原因（缺少章节）到下一轮 Prompt
5. 首次失败后触发 3 次重试（共 4 次失败）

**预期结果**：
- `halted=true`，`haltReason=blocked:TASK-XXX:completion_check_failed`
- 对应 TASK 的 `regenerateCount=3`
- 审计日志记录 3 次 `task_retry` 事件，且包含 `failure_code=missing_required_section`
- 不会进入第 5 次重试

### 14.3 Stalled 路径（Heartbeat 超时）

**前置条件**：
- Feature 有 1 个 TASK 正在执行
- 配置 `heartbeat_timeout_ms=60000`（1 分钟）

**执行步骤**：
1. 执行 `/spec-first:orchestrate --auto`，TASK 开始执行
2. 模拟 TASK 长时间无进度回调（heartbeat 不再更新）
3. 等待超过 1 分钟
4. watchdog 在运行中检测超时并标记 `stalled_timeout`
5. 执行 `/spec-first:orchestrate --auto --resume`

**预期结果**：
- watchdog 先于 resume 主动检测到 `Date.now() - heartbeatAt > heartbeatTimeoutMs`
- 输出警告："检测到上次执行可能已 stalled，从 iteration 1 恢复"
- 重新开始 TASK 执行，不重置 `iteration`

### 14.4 Halt 路径（达到迭代上限）

**前置条件**：
- Feature 有 5 个 TASK，但其中 2 个依赖永远无法满足
- 配置 `max_iterations=3`

**执行步骤**：
1. 执行 `/spec-first:orchestrate --auto`
2. 完成前 3 个可执行 TASK
3. 第 3 轮结束后 `iteration=3`，且仍有 2 个 TASK 未完成
4. 命中 `max_iterations` 上限后停止

**预期结果**：
- `halted=true`，`haltReason=max_iterations reached: 3/3`
- 已完成的 3 个 TASK 状态为 `done`
- 未完成的 2 个 TASK 状态保持 `pending` 或 `in_progress`

### 14.5 永久错误路径（不消耗 regenerateCount）

**前置条件**：
- Feature 有 1 个 TASK，目标目录不存在且无权限创建
- 配置 `max_retry_per_task=3`

**执行步骤**：
1. 执行 `/spec-first:orchestrate --auto`
2. TASK P4 写入时失败（ENOENT/EACCES）
3. 错误被识别为"永久错误"（见 5.2 节错误分类）

**预期结果**：
- `halted=true`，`haltReason=blocked:TASK-XXX:permanent_error`
- 对应 TASK 的 `regenerateCount=0`（未消耗重试次数）
- 审计日志记录 1 次 `task_blocked:permanent_error`

### 14.6 并行执行路径（max_parallel > 1）

**前置条件**：
- Feature 有 2 个无依赖 TASK，均可执行
- 配置 `max_iterations=5`，`max_parallel=2`

**执行步骤**：
1. 执行 `/spec-first:orchestrate --auto`
2. `pickReadyTodos(maxParallel=2)` 返回 2 个 TASK
3. 并行执行 TASK-1 和 TASK-2
4. 两个 TASK 都完成后，原子写入 checkpoint
5. `iteration` 递增 1（非 2）

**预期结果**：
- `todo-state.json` 的 2 个 TASK 状态均为 `done`
- `iteration=1`（一轮并行算一次迭代）
- 审计日志包含 2 条 `task_start` + 2 条 `task_complete`
- checkpoint 时间戳 = max(TASK-1 完成时间, TASK-2 完成时间)

**异常场景**（部分失败）：
- TASK-1 成功，TASK-2 失败 → 本批次两个 TASK 都回退，iteration 不递增
- 下一轮重新执行 TASK-1 和 TASK-2（原子批量写入策略）

### 14.7 TASK 超时路径（max_task_duration_ms）

**前置条件**：
- Feature 有 1 个 TASK，执行时间可稳定超过 30 秒
- 配置 `max_task_duration_ms=30000`

**执行步骤**：
1. 执行 `/spec-first:orchestrate --auto`
2. TASK 执行超过 30 秒

**预期结果**：
- 系统中断当前 TASK 并写入 `haltReason=task_timeout:TASK-XXX`
- 审计日志包含 `task_timeout` 事件
- 不会因单 TASK 卡死绕过 `max_iterations`

### 14.8 审计日志防篡改校验（hash chain）

**前置条件**：
- 完成一轮 auto-loop，已生成 `orchestrate-audit.jsonl`

**执行步骤**：
1. 手工修改第 N 行日志内容
2. 运行 `audit verify`（或内置校验函数）

**预期结果**：
- 校验报告指出 hash chain 在第 N 行断裂
- 返回非 0 状态码，提示日志可能被篡改

---

## 版本历史

| 版本 | 日期 | 变更摘要 |
|------|------|----------|
| v1.0 | 2026-02-26 | 初始方案：5 项问题定义与分层架构 |
| v1.1 | 2026-02-26 | 补充代码审查结论（第 12 节） |
| v1.2 | 2026-02-26 | 细化循环算法与配置设计 |
| v1.3 | 2026-02-26 | 业界最佳实践审查增强：状态文件统一（4.3）、Confirm Policy 降级（4.4）、原子写入 + heartbeat + 审计日志（5.1）、完成标记契约 + 有限回退 + 幂等性（5.2）、SCA 子模块 + 双层规则（5.3）、生成模板 + 更新策略 + Context Pack 集成（5.4）、Doctor MCP 检查（5.5）、TRANSITIONS 扩展 + 词汇统一（7.3/7.5）、风险补充（10）、实施计划调整（8） |
| v1.4 | 2026-02-26 | 多 Agent 深度审查修订：参数入口协议（4.5）、slop 与 SCA 解耦（5.3）、TASK→模块路径映射算法（5.4）、Front Matter 统一解析层（5.6）、配置 schema 变更表（6.1）、状态字典与 stalled 边界（7.5）、契约测试清单（8.4） |
| v1.5 | 2026-02-26 | 复审修订：参数校验契约（错误码/优先级）、`lastResult.outcome` 示例统一为 `done`、无 git 场景回退策略（5.4）、第 13 节版本描述修正 |
| v1.6 | 2026-02-26 | 三路并行 Agent 审查修订：`status` vs `halted` 兼容策略（4.3）、`max_parallel` 可配置（5.1+6）、`buildTaskContextPack` 注入点修正（5.4）、Phase A 任务 A4 拆分为 A4a+A4b（8） |
| v1.6.1 | 2026-02-26 | 复审一致性修订：修复 5.1 代码块边界、统一 `stalled` 为 run-level `haltReason`、补齐 `runtime.auto_orchestrate.max_parallel` schema 行、明确本期不扩展 `P4_WRITE -> ABORTED` |
| v1.7 | 2026-02-26 | 最佳实践完善：5.2 节补充错误分类与重试策略（永久 vs 临时错误）、新增第 14 节 E2E 测试场景（Happy Path/Blocked/Stalled/Halt/永久错误路径） |
| v1.8 | 2026-02-26 | 文档审查修订：补充并行 checkpoint 语义（4.1/4.3）、Fresh Context 实现方式（4.4/10）、审计日志字段扩展（5.1）、幂等性 write_mode（5.2）、全局完成检测模板（5.2）、上下文合并策略（5.4）、状态机图（7.3）、状态枚举定义（7.5）、审计日志轮转配置（6.1）、并行 E2E 场景（14.6） |
| v1.8.1 | 2026-02-26 | 深度复审修订：修正“无可执行任务”分支（仅 unfinished=0 才 done）、`buildTaskContextPack` 注入契约改为 `moduleContexts`、对齐重试计数规则（max_retry_per_task=3 对应 retryCount=3）、修正迭代上限场景与 `haltReason` 示例、统一文档头版本与第 13 节版本描述 |
| v1.8.2 | 2026-02-26 | 二次复核修订：状态机图对齐 `P3_CONFIRM` 与 run-level halted 语义（7.3）、Blocked 场景重试口径澄清（14.2）、`haltReason` 契约升级为 canonical+legacy 兼容（7.5）、补充 `TaskContextPack.moduleContexts` 实现前置约束（5.4）、统一第 13 节版本描述 |
| v1.9.0 | 2026-02-27 | 综合代码审查修订：新增第 15 节技术债务清单（安全/架构/代码质量三类问题）、第 16 节实施优先级矩阵、修订实施计划关联技术债务修复 |
| v2.0.0 | 2026-02-27 | 按最优方案重构：保持 `strict` 不降级、移除 `--unattended`、统一入口为 `/spec-first:orchestrate --auto/--resume`、收敛范围到 5 项核心能力、将跨领域技术债移出本方案 |
| v2.1.0 | 2026-02-27 | 可靠性强化修订：新增 `max_task_duration_ms`、active watchdog、失败原因注入、语义完成检测（`contains_pattern/min_entities`）、审计日志 hash chain、`retry_backoff_ms` 与 `max_total_retry_duration_ms`、`runtime.autoLoop` 分层、ContextProvider 扩展接口、`_context.md` 首次审核、Phase A 调整为 1.5 周并补充 E2E 计划 |

---

## 15. 跨领域技术债边界（范围收敛）

本方案聚焦“orchestrate auto-loop + 完成检测 + slop + context + required_mcps”五项能力。

以下跨领域治理项不在本方案内落地，避免范围失控：

1. 全局安全基线（模板安全、clone 完整性、日志权限等）
2. 大规模架构重构（DI、类型拆分、trace-engine 拆分）
3. 全项目覆盖率治理与通用质量改造

处理方式：

1. 统一迁移到独立文档：`docs/03审查报告/` 下的综合治理计划
2. 由独立 owner 与节奏管理，不作为 v2-13 的前置阻塞

---

## 16. 最优实施优先级矩阵（仅本方案范围）

### 16.1 Week 1-1.5（P0/P1）：最小可运行闭环

- [ ] 参数协议落地：`/spec-first:orchestrate --auto/--resume`
- [ ] `todo-state.json` 扩展字段（`runtime.autoLoop.*` 分层）
- [ ] auto-loop 主循环（pick → execute → checkpoint → iteration）
- [ ] active watchdog + heartbeat 双通道检测
- [ ] `max_task_duration_ms` 超时保护
- [ ] 原子写入与 append-only 审计日志 hash chain（A4b）
- [ ] `P4_WRITE -> P2_GENERATE` 状态机扩展

### 16.2 Week 2-3（P1）：完成可靠性

- [ ] 完成检测（结构 + 语义：`required_sections` + `contains_pattern` + `min_entities`）
- [ ] 统一 `regenerateCount` 计数口径（覆盖 P3→P2 与 P4→P2）
- [ ] `max_retry_per_task` 有限回退 + `retry_backoff_ms` 退避
- [ ] `max_total_retry_duration_ms` 全局重试成本上限
- [ ] 失败原因注入（P4→P2）
- [ ] P4 幂等写入（`write_mode`）
- [ ] `catchup` 输出 auto-loop 状态摘要
- [ ] Front Matter 统一解析层（`required_mcps` + `completion_markers` + `write_mode`）

### 16.3 Week 4+（P2）：质量与体验增强

- [ ] slop checker（全局规则 + 项目覆盖）
- [ ] `_context.md` 自动生成 + 首次人工审核 + Context Pack 注入
- [ ] ContextProvider 注册式扩展（解耦 `TaskContextPack` 扩展点）
- [ ] `required_mcps` 提示链路与 doctor 检查

验收口径（本方案）：

1. 能在一次会话内稳定推进多个 TASK（可恢复、可停止、可审计）。
2. 不因 `--auto` 降级确认策略，仍满足高风险 `strict` 约束。
3. 双重完成检测失败可回退且不会无限循环，并受时间成本上限约束。

---

## 17. 风险补充（本方案范围）

| # | 风险 | 控制措施 | 阶段 |
|---|------|----------|------|
| 13 | 参数语义漂移导致双入口分叉 | 仅支持 `/spec-first:orchestrate --auto/--resume`，禁止新增 CLI 同名入口 | Week 1 |
| 14 | `--auto` 被误用为“无人值守” | 明确不支持 `--unattended`，保持 `strict` 批次确认 | Week 1 |
| 15 | 状态字段扩展破坏兼容 | 引入 `runtime.autoLoop` 分层 + legacy 读兼容 | Week 1 |
| 16 | 完成检测误报导致频繁回退 | `completion_markers` 分层覆盖 + `regenerateCount` + backoff + retry budget | Week 2-3 |
| 17 | `_context.md` 注入扩大 token 开销 | 提供 `merge_strategy` 与 2KB 软阈值告警（基于 token 预算） | Week 4+ |
