# V2-13 Orchestrate Auto Loop 开发任务文档

> **版本**: v1.3
> **日期**: 2026-02-28
> **来源方案**: `docs/02技术方案/V2/v2-13-orchestrate-auto-loop.md`（v2.1.0）
> **定位**: 03_plan 可执行任务清单（仅任务拆解，不含实现代码）
> **v1.3 修订**: 代码验证审查 — ORCH-014 升 P0（Phase A 硬前置）；ORCH-010 补依赖 014；ORCH-003/008/006 验收标准细化为可验证条目；ORCH-007 scope 收敛至 Phase A 配置项并调整工期 0.5d→1d；DoD 状态枚举对齐 TodoStatus（`done` 替代 `complete`）

---

## 1. 任务拆解推导（逐步）

1. 先锁定阻塞项：按技术方案 P0/P1/P2 分层，P0 必须先落地（超时、watchdog、防篡改、参数与状态契约）。
2. 再锁定主链路：`入口参数 -> 调度循环 -> 状态持久化 -> 失败回退 -> 可观测性`。
3. 然后补可靠性闭环：完成检测（结构+语义）、失败原因注入、退避与重试预算。
4. 最后做可扩展与体验：ContextProvider、`_context.md` 首次审核、`required_mcps` 与 slop 治理。
5. 测试任务单列，确保每个高风险能力都有 unit + e2e 覆盖。

---

## 2. 里程碑与节拍

- **Milestone A（Week 1-1.5）**：可运行且可止损（P0/P1）
- **Milestone B（Week 2-3）**：完成可靠性闭环（P1）
- **Milestone C（Week 4+）**：质量治理与可扩展（P2）

---

## 3. Phase 清单

### Phase A（P0/P1）：最小可运行闭环

- [ ] TASK-ORCH-001 [US1] 统一 `/spec-first:orchestrate --auto/--resume` 参数协议
- [ ] TASK-ORCH-002 [US1] `todo-state.json` 引入 `runtime.autoLoop` 分层并统一状态词汇
- [ ] TASK-ORCH-003 [US1] auto-loop 主循环接入（pick/execute/checkpoint/iteration）
- [ ] TASK-ORCH-004 [US1] active watchdog + heartbeat 双通道检测
- [ ] TASK-ORCH-005 [US1] `max_task_duration_ms` TASK 级超时保护
- [ ] TASK-ORCH-006 [US1] 审计日志 hash chain（`prevHash/hash`）与校验能力
- [ ] TASK-ORCH-007 [US1] runtime 配置 schema 扩展与校验（含超时、退避、预算、防篡改）
- [ ] TASK-ORCH-014 [US1] `phase-machine` 扩展 `P4_WRITE -> P2_GENERATE`（Phase B 前置）

### Phase B（P1）：完成可靠性闭环

- [ ] TASK-ORCH-008 [US2] `catchup` 增加 auto-loop runtime 摘要
- [ ] TASK-ORCH-009 [US2] `completion_markers` 语义扩展（`contains_pattern/min_entities`）
- [ ] TASK-ORCH-010 [US2] 完成检测引擎实现（结构+语义双判定）
- [ ] TASK-ORCH-011 [US2] 统一重试计数口径（`regenerateCount`）并迁移 legacy 计数
- [ ] TASK-ORCH-012 [US2] P4→P2 失败原因注入到下一轮 Prompt
- [ ] TASK-ORCH-013 [US2] backoff 与 `max_total_retry_duration_ms` 预算控制
- [ ] TASK-ORCH-015 [US2] P4 幂等写入策略（`write_mode` 默认 overwrite）
- [ ] TASK-ORCH-016 [US2] Front Matter 统一解析层（`completion_markers/required_mcps/write_mode`）

### Phase C（P2）：质量治理与可扩展

- [ ] TASK-ORCH-017 [P] [US3] ContextProvider 扩展接口与注册机制
- [ ] TASK-ORCH-018 [US3] `_context.md` 首次生成审核（diff 预览 + 接受策略）
- [ ] TASK-ORCH-019 [P] [US3] `required_mcps` 声明链路与 doctor 检查
- [ ] TASK-ORCH-020 [P] [US3] slop checker 独立实现与双层规则加载

### Phase T（测试与验收）

- [ ] TASK-ORCH-021 [P] [US4] Unit 测试补齐（args/config/retry/completion/phase-machine）
- [ ] TASK-ORCH-022 [US4] E2E 测试补齐（happy/stalled/task-timeout/retry-budget/audit-hash-chain）
- [ ] TASK-ORCH-023 [US4] 文档与回归验收（风险清单、版本记录、发布前检查）

---

## 4. 任务明细

| Task ID | 标题 | Owner | 预计工期 | 优先级 | traces | depends_on | 验收标准 | 状态 |
|---|---|---|---|---|---|---|---|---|
| TASK-ORCH-001 | 参数协议与 strict 策略一致性落地 | Runtime | 0.5d | P0 | V2-13§4.4,§4.5 | - | 仅允许 `--auto/--resume`，非法参数报 `E_ORCH_ARGS_*`，且 `--auto` 下 confirm policy 保持 strict | planned |
| TASK-ORCH-002 | `runtime.autoLoop` 状态分层与状态词汇统一 | Runtime | 1d | P0 | V2-13§4.3,§7.5 | TASK-ORCH-001 | 运行态字段迁入 `runtime.autoLoop`，legacy 字段可读，`done/complete/verified` 归一为 `done`；定义 `HaltReasonCode` 枚举（`completed/max_iterations_reached/blocked/stalled_timeout/permanent_error`） | planned |
| TASK-ORCH-003 | auto-loop 主循环接入 | Runtime | 1d | P0 | V2-13§5.1 | TASK-ORCH-002 | (a) 连续推进 ≥2 个无依赖 TASK，iteration 正确递增；(b) 每轮 checkpoint 写入后 `loadTodoState` 可正确读取；(c) kill 后 `--resume` 从最近 checkpoint 的 iteration 恢复；checkpoint 采用原子写入（write-tmp-then-rename）；每个 TASK 启动独立 subagent 确保 Fresh Context | planned |
| TASK-ORCH-004 | active watchdog + heartbeat | Runtime | 1d | P0 | V2-13§5.1 | TASK-ORCH-003 | 运行中主动检测 stalled，resume 保留兜底检查 | planned |
| TASK-ORCH-005 | TASK 级超时保护 | Runtime | 0.5d | P0 | V2-13§5.1,§6.1 | TASK-ORCH-003 | 超时触发 `task_timeout`，不会绕过 `max_iterations`；超时事件写入审计日志（`event=task_timeout`） | planned |
| TASK-ORCH-006 | 审计日志 hash chain | Runtime | 1d | P0 | V2-13§5.1 | TASK-ORCH-003 | 每条日志写 `prevHash/hash`（SHA256），JSONL 原子追加；hash chain 校验函数由 ORCH-022 E2E 覆盖 | planned |
| TASK-ORCH-007 | 配置 schema 扩展（Phase A） | Infra | 1d | P0 | V2-13§6.1 | TASK-ORCH-001 | Phase A scope：`auto_orchestrate.*` 9 项（enabled/stop_on_blocked/max_task_duration_ms/heartbeat_timeout_ms/watchdog_interval_ms/max_retry_per_task/retry_backoff_ms/max_total_retry_duration_ms/max_parallel）+ `audit_log.*` 3 项（enabled/tamper_proof/rotation_size_mb）；含类型定义 + 默认值 + 范围校验 + `mergeWithDefaults` 扩展；Phase B/C 配置项（completion_guard/slop_check/context_pack）由对应任务各自扩展 | planned |
| TASK-ORCH-008 | catchup runtime 摘要增强 | Runtime | 0.5d | P1 | V2-13§5.1 | TASK-ORCH-004,TASK-ORCH-013 | `CatchupResult` 新增 `autoLoopSummary` 字段（含 `currentTaskId/heartbeatAt/retryBudgetRemaining`），auto-loop 运行中时字段非空且值与 `todo-state.json` 中 `runtime.autoLoop` 一致 | planned |
| TASK-ORCH-009 | completion markers 语义字段扩展 | Runtime | 0.5d | P1 | V2-13§5.2 | TASK-ORCH-016 | 支持 `contains_pattern/min_entities` 配置解析（消费 016 统一解析层输出） | planned |
| TASK-ORCH-010 | 结构+语义完成检测引擎 | Runtime | 1d | P1 | V2-13§5.2 | TASK-ORCH-009,TASK-ORCH-014 | 能识别”有标题无内容”等假完成；支持三层加载优先级（Skill 级 > 项目级 > 全局默认 `default-markers.yaml`）；检测失败触发 P4→P2 回退（依赖 014 提供回退路径） | planned |
| TASK-ORCH-011 | 重试计数统一与迁移 | Runtime | 0.5d | P1 | V2-13§7.3 | TASK-ORCH-010 | 统一 `regenerateCount`，legacy 计数可折算 | planned |
| TASK-ORCH-012 | 失败原因注入到 P2 Prompt | Runtime | 0.5d | P1 | V2-13§5.2 | TASK-ORCH-010 | 失败原因结构化注入且覆盖旧原因；同一 fingerprint 连续 2 次强制进入 backoff | planned |
| TASK-ORCH-013 | backoff + retry budget 控制器 | Runtime | 1d | P1 | V2-13§5.2,§6.1 | TASK-ORCH-011,TASK-ORCH-012 | 支持指数退避与总预算耗尽 halt；实现错误分类（永久错误直接 blocked 不消耗 `regenerateCount`，临时错误计入重试，未知错误保守按临时处理） | planned |
| TASK-ORCH-014 | phase-machine P4->P2 扩展 | Runtime | 0.5d | P0 | V2-13§7.3 | TASK-ORCH-003 | `P4_WRITE -> P2_GENERATE` 合法且无非法转移副作用（Phase B 硬前置，归入 Phase A 末尾） | planned |
| TASK-ORCH-015 | P4 幂等写入策略 | Runtime | 0.5d | P1 | V2-13§5.2 | TASK-ORCH-014 | `write_mode` 默认 overwrite，回退重试不重复污染 | planned |
| TASK-ORCH-016 | Front Matter 统一解析层 | Runtime | 0.5d | P1 | V2-13§5.6 | TASK-ORCH-007,TASK-ORCH-015 | `required_mcps/completion_markers/write_mode` 复用同一 meta；009 消费 016 的解析结果（016→009 单向依赖，消除原 009↔016 循环） | planned |
| TASK-ORCH-017 | ContextProvider 抽象与注册 | Runtime | 1d | P2 | V2-13§5.4 | TASK-ORCH-016 | 新上下文类型接入不改核心组装流程 | planned |
| TASK-ORCH-018 | `_context.md` 首次审核流 | UX/Runtime | 1d | P2 | V2-13§5.4 | TASK-ORCH-006,TASK-ORCH-017 | 首次生成提供 diff 与接受策略，跳过有审计事件（依赖 006 提供审计日志写入能力） | planned |
| TASK-ORCH-019 | required_mcps + doctor 检查 | Runtime | 0.5d | P2 | V2-13§5.5 | TASK-ORCH-016 | 执行前能提示 MCP 可用性与缺失项；解析结果注入 Context Pack 提示 | planned |
| TASK-ORCH-020 | slop checker 独立化 | Quality | 1d | P2 | V2-13§5.3 | TASK-ORCH-016 | 与 SCA 解耦，支持全局+项目双层规则 | planned |
| TASK-ORCH-021 | Unit 测试补齐 | QA | 1.5d | P1 | V2-13§8.4,§9.2 | TASK-ORCH-013,TASK-ORCH-014,TASK-ORCH-015,TASK-ORCH-016 | 新增单测均通过，覆盖关键失败路径（需 013 retry/backoff、014 P4→P2、015 幂等写入、016 Front Matter 全部就绪） | planned |
| TASK-ORCH-022 | E2E 测试补齐 | QA | 1.5d | P1 | V2-13§8.5,§9.2 | TASK-ORCH-006,TASK-ORCH-013 | 完成 timeout/stalled/retry-budget/hash-chain 场景 | planned |
| TASK-ORCH-023 | 文档与发布前回归收口 | PM/QA | 0.5d | P1 | V2-13§10,§11 | TASK-ORCH-021,TASK-ORCH-022 | 风险、验收、版本记录同步且可追溯 | planned |

---

## 5. 关键依赖关系（最小阻塞链）

1. `TASK-ORCH-001 -> TASK-ORCH-002 -> TASK-ORCH-003`（入口到主循环）
2. `TASK-ORCH-003 -> TASK-ORCH-004/005/006`（运行安全与可观测）
3. `TASK-ORCH-003 -> TASK-ORCH-014`（Phase B 硬前置：状态机扩展 P4→P2）
4. `TASK-ORCH-007+015 -> TASK-ORCH-016 -> TASK-ORCH-009`（统一解析层先行，009 消费 016 输出，消除原 009↔016 循环）
5. `TASK-ORCH-009+014 -> TASK-ORCH-010 -> TASK-ORCH-011/012`（完成检测需 009 语义字段 + 014 回退路径双前置）
6. `TASK-ORCH-011/012 -> TASK-ORCH-013 -> TASK-ORCH-008`（预算控制完成后输出 catchup 摘要；008 同时依赖 004 提供 heartbeat）
7. `TASK-ORCH-006+017 -> TASK-ORCH-018`（审计日志 + ContextProvider 就绪后才做首次审核）
8. `TASK-ORCH-016 -> TASK-ORCH-017/019/020`（元数据能力先统一）
9. `TASK-ORCH-013/014/015/016 -> TASK-ORCH-021`（单测需全部被测模块就绪）
10. `TASK-ORCH-021/022 -> TASK-ORCH-023`（测试通过后收口）

---

## 6. DoD（任务级）

每个 TASK 完成必须满足：

1. 对应代码/配置/文档已变更并可定位。
2. 验收标准有可执行证据（测试结果或命令输出）。
3. 依赖链未破坏（`depends_on` 的前置任务已完成）。
4. 状态只允许：`planned | in_progress | blocked | done | verified`。（注：此为任务文档管理状态，`done` 对齐代码 `TodoStatus`；`verified` 保留为人工验收标记）

---

## 7. 建议执行顺序（一步一步）

1. 先做 `TASK-ORCH-001~007` + `TASK-ORCH-014`，拿到”可跑、可停、可配”的底座与回退前置（014 是 Phase B 硬前置）。
2. 再做 `TASK-ORCH-015~016`（幂等写入 + 统一解析层）→ `TASK-ORCH-009~013` + `TASK-ORCH-008`，关闭”假完成+重复失败”风险（注意：016 先于 009，消除循环依赖）。
3. 接着做 `TASK-ORCH-017~020`，完成扩展与治理能力。
4. 最后做 `TASK-ORCH-021~023`，以测试和回归作为发布门槛。

---

## 8. 建议命令（执行时）

```bash
/spec-first:task <featureId>
/spec-first:code <featureId> --task TASK-ORCH-001
/spec-first:code-review <featureId> --task TASK-ORCH-001
/spec-first:verify <featureId> quick
```
