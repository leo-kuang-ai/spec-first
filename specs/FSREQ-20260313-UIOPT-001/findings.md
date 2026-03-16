# Findings & Decisions — FSREQ-20260313-UIOPT-001

## [2026-03-14] Auto-Loop 架构修复 代码审查

> **审查范围**：`src/core/ai-orchestrator/` (auto-loop.ts · retry-controller.ts · todo-runner.ts)
> **规格来源**：`docs/review-bundles/2026-03-13-全流程梳理/09-Auto-Loop架构深度审查报告.md` 附录二
> **Stage 1（合规）**：PASS | **Stage 2（质量）**：4 项 SHOULD FIX → SF-1/SF-2 已修复，SF-3 描述有误（实际已 OK），SF-4 待补充

### SHOULD FIX 状态

| # | 位置 | 问题摘要 | 状态 |
|---|------|---------|------|
| SF-1 | `auto-loop.ts` recoverInterruptedTasks | P9 仅清 2/4 运行态字段，`heartbeatAt`/`watchdogCheckedAt` 未置 null，重启后 watchdog 误判 heartbeat_stalled | ✅ 已修复 2026-03-14 |
| SF-2 | `todo-runner.ts` cascadeBlocked | cascaded 跨轮累积 + 每轮遍历旧 state.items，导致已 blocked 任务被重复处理 | ✅ 已修复 2026-03-14 |
| SF-3 | `auto-loop.ts:339` Guard retry 路径 | ~~未调用 applyRetryToState~~ — 描述有误，实际第 339 行已调用，Guard 重试正确消耗全局 totalRetryDurationMs | ✅ 描述已勘误，无需修复 |
| SF-4 | `tests/unit/auto-loop.test.ts` | P6 unknown 错误缺少端到端集成测试（unknown→pending，而非 blocked） | ✅ 已修复 2026-03-14 |

### 架构优化（2026-03-14 深度分析新增）

| # | 位置 | 问题摘要 | 状态 |
|---|------|---------|------|
| NEW-1 | `retry-controller.ts` makeRetryDecision | fingerprint 比对使用全局 lastFailureReason，多任务并发场景下跨任务污染 | ✅ 已修复 2026-03-14 |
| NEW-2 | `auto-loop.ts` 两处 stop_on_blocked | halt 前未执行 cascadeBlocked，持久化状态文件遗漏级联传播结果 | ✅ 已修复 2026-03-14 |

### OUT_OF_SCOPE（范围外记录）

| # | 问题摘要 |
|---|---------|
| OOS-1 | P5 死锁检测缺 auto-loop 集成测试（haltReason=stuck_* 端到端验证） |
| OOS-2 | TASK_TIMEOUT 依赖 timeout 子字符串匹配，建议增加专属模式 |
| OOS-3 | P3 consecutiveErrorCount 未被 Guard retry 路径写入 |
| OOS-4 | 阶段三（interval watchdog + AbortSignal）未实施，待设计评审 |

### 关键提醒

⚠️ 所有 P1-P10 修复当前以**未提交**状态存在于工作区。建议在 SF-1/SF-3 修复后，一并提交并更新 CHANGELOG.md。

## Plan Summary

| Field | Value |
|------|-------|
| Target Stage | 04_implement |
| Next Action | 执行任务实现 |
| Blockers | none |
| Risk Level | LOW |
| Suggested Command | /spec-first:code |

## Decision Log

| Time | Stage | Decision | Rationale |
|------|-------|----------|-----------|
| 2026-03-13T09:37 | 01_specify | 已下线指标直接删除 | 用户明确不需要向下兼容 |
| 2026-03-13T09:37 | 01_specify | 健康分基于5个指标重新校准 | 优化后只使用C3/C4/C6/C8/C9 |
| 2026-03-13T09:37 | 01_specify | Profile展示在健康分卡片内 | 用户选择方案B |
| 2026-03-13T10:06 | 03_plan | 拆解为4个任务 | 按功能模块拆分，TASK-001/002/003 可并行 |
| 2026-03-13T10:06 | 03_plan | 任务粒度控制在0.1-0.3天 | 前端页面修改，粒度较小 |

## Execution Evidence

| Time | Type | Evidence | Result |
|------|------|----------|--------|
| 2026-03-13T09:37 | PRD生成 | prd.md | 完成 |
| 2026-03-13T09:37 | FR生成 | spec.md | 3个FR, 11个AC |
| 2026-03-13T09:37 | 矩阵更新 | traceability-matrix.md | 完成 |
| 2026-03-13T10:06 | 任务拆解 | task_plan.md | 4个TASK已生成 |
| 2026-03-13T10:06 | 覆盖率检查 | C3=100%, C8=100% | 任务覆盖完成 |
| 2026-03-13T10:15 | 代码实现 | TASK-UIOPT-001 | 完成 Gate 条件展示优化 |
| 2026-03-13T10:15 | 代码实现 | TASK-UIOPT-002 | 完成覆盖率指标精简 |
| 2026-03-13T10:15 | 代码实现 | TASK-UIOPT-003 | 完成健康分优化与 profile 显示 |
| 2026-03-13T10:15 | 代码实现 | TASK-UIOPT-004 | 完成样式支持 |

## Phase 0 记录

- Phase 0.1: 任务锚定 - 同步页面展示与代码优化
- Phase 0.2: 质量扫描 - 85%，场景=iteration
- Phase 0.3: PRD生成 - 复杂度=Simple
- Step 3: 提问门禁 - 3个问题已确认
- Step 6: FR/AC收敛 - 3个FR已生成

## Next Steps

1. 执行 /spec-first:design 进入技术设计阶段

- [2026-03-13T01:59:42.562Z] GATE_WARNING: G-SPEC-00 C-PRD=80% errors=0

- [2026-03-13T01:59:42.563Z] GATE_WARNING: G-SPEC-03 C10 unavailable: missing checklists/spec-review.md

## Gate Check Remediation (2026-03-13T02:00:51.519Z)

### Failed Conditions
- (none)

### Warnings
- G-DESIGN-03: Constitution compliance (C11) (warning) (C11 FAIL: design.md missing constitution clause reference; fix: specs/FSREQ-20260313-UIOPT-001/design.md: add 'Constitution Clause <id> (v<version>)' references)

### Actionable Fix Steps
1. specs/FSREQ-20260313-UIOPT-001/design.md: add 'Constitution Clause <id> (v<version>)' references

## Gate Check Remediation (2026-03-13T02:02:03.740Z)

### Failed Conditions
- (none)

### Warnings
- G-DESIGN-03: Constitution compliance (C11) (warning) (C11 FAIL: design.md missing constitution clause reference; fix: specs/FSREQ-20260313-UIOPT-001/design.md: add 'Constitution Clause <id> (v<version>)' references)

### Actionable Fix Steps
1. specs/FSREQ-20260313-UIOPT-001/design.md: add 'Constitution Clause <id> (v<version>)' references

- [2026-03-13T02:03:14.117Z] GATE_WARNING: G-DESIGN-03 C11 FAIL: design.md missing constitution clause reference; fix: specs/FSREQ-20260313-UIOPT-001/design.md: add 'Constitution Clause <id> (v<version>)' references

- [2026-03-13T02:03:14.119Z] Context Sync: /Users/kuang/xiaobu/spec-first/CLAUDE.md

- [2026-03-13T02:31:21.925Z] WAIVER: EX-UIOPT-001 (RFC: RFC-UIOPT-001), EX-UIOPT-002 (RFC: RFC-UIOPT-001), EX-UIOPT-003 (RFC: RFC-UIOPT-001)

## Verify Report (2026-03-13T02:33:13Z)

### 执行摘要
- Feature: FSREQ-20260313-UIOPT-001
- 阶段: 05_verify
- Gate 状态: PASS_WITH_WAIVER
- 退出码: 0

### Gate 条件检查
- [L0-VERIFY-001] 测试用例存在且通过 ✅
- [C4] Test coverage FR ≥ 80% [WVR] (RFC-UIOPT-001)
- [C9] TC compliance = 100% ✅
- [G-BE-CONTRACT] API contract check pass ✅

### 覆盖率指标
- C3=100.0% ✅, C4=0.0% [WVR], C6=100.0% ✅, C8=100.0% ✅, C9=100.0% ✅

### 建议下一步
✅ 可推进到 06_wrap_up 阶段

- [2026-03-13T02:34:49.175Z] DEPENDENCY_CHECK_FAIL: 缺失项:
  - file: specs/FSREQ-20260313-UIOPT-001/retro.md

- [2026-03-13T02:35:20.455Z] WAIVER: EX-UIOPT-001 (RFC: RFC-UIOPT-001), EX-UIOPT-002 (RFC: RFC-UIOPT-001), EX-UIOPT-003 (RFC: RFC-UIOPT-001)

- [2026-03-13T02:39:23.431Z] DEPENDENCY_CHECK_FAIL: 缺失项:
  - file: specs/FSREQ-20260313-UIOPT-001/reports/smoke-test-report.md
  - file: specs/FSREQ-20260313-UIOPT-001/reports/release-note.md

- [2026-03-13T02:39:45.833Z] AUTO_ADVANCE: 07_release → 08_done (发布阶段预留扩展，当前自动跳过)

## [2026-03-16] 07-工具集成 代码审查（cross-layer）

> **审查范围**：`src/core/tool-integration/`、`src/core/host-adapters/`、`src/shared/host-mcp-baseline.ts`、`src/shared/install-detection.ts`、`src/config/bootstrap-manifest.ts`
> **关联提交**：`b4499c7` feat: 新增 host-adapters、tool-integration、代码审查文档
> **层级**：cross（多模块跨层）
> **Stage 1（合规）**：✅ PASS — 追溯链完整，测试全绿（168 files / 1550 tests），typecheck PASS，build PASS
> **Stage 2（质量）**：2 项 MUST FIX，4 项 SHOULD FIX，3 项 OUT_OF_SCOPE

---

### MUST FIX（阻断）

| # | 位置 | 问题摘要 | 验证结论 | 状态 |
|---|------|---------|---------|------|
| MF-1 | `src/core/tool-integration/capability-matrix.ts:39` | `generic` 宿主 `supportsSkills` 硬编码为 `true`，与 `docs/reference/host-capability-matrix.md` 声明（❌）矛盾；下游逻辑依赖该字段会得到错误结果 | ✅ 已复现：`getHostCapability('generic')?.supportsSkills` 返回 `true`，文档声明 `false` | ⏳ 待修复 |
| MF-2 | `src/core/tool-integration/tool-selection.ts:21-22` | `code-analysis` 场景硬编码返回 `['serena']`，未经 `isToolSupported` 过滤；对 `generic` 宿主调用时错误返回 `serena`（serena.hosts 不含 generic，且 generic 无 MCP 支持） | ✅ 已复现：`selectToolsForScenario('generic', 'code-analysis')` = `{primary:['serena']}` 而期望 `{primary:[]}` | ⏳ 待修复 |

**MF-1 修复方案**：
```typescript
// capability-matrix.ts
{
  host: 'generic',
  supportsSkills: false,  // 与文档对齐，generic 是降级占位宿主
  supportsMcp: false,
  ...
}
```

**MF-2 修复方案**：
```typescript
// tool-selection.ts
case 'code-analysis':
  return {
    primary: isToolSupported(host, 'serena') ? ['serena'] : [],
    fallback: ['shell-rg'],
  };
```

---

### SHOULD FIX（建议）

| # | 位置 | 问题摘要 | 严重性 | 状态 |
|---|------|---------|--------|------|
| SF-1 | `src/core/host-adapters/gemini-adapter.ts`、`cursor-adapter.ts` | `detectHostPaths()` 在每个 public 方法中独立调用（各 9 次），单次 `resolveHostAdapterStatuses()` 触发 10+ 次 FS 路径探测；`ClaudeAdapter`/`CodexAdapter` 的 `remediation()` 不调用 `detectHostPaths` 是更合理的模式 | 性能 | ⏳ 待修复 |
| SF-2 | `src/core/host-adapters/registry.ts:7,15` | `DEFAULT_ADAPTERS` 声明为可变数组 `HostAdapter[]`，`listHostAdapters()` 直接返回其引用；调用方可 `push/splice` 污染内部单例状态 | 防御性设计 | ⏳ 待修复 |
| SF-3 | `src/core/tool-integration/capability-matrix.ts:15` | `getCapabilityMatrix()` 无缓存，每次调用重新执行路径探测；4 个 adapter 各自调用 `getHostCapability()` 导致矩阵被重复构建 4 次 | 性能 | ⏳ 待修复 |
| SF-4 | `tests/unit/tool-registry.test.ts` | `code-analysis` 场景仅测试 `claude` 宿主，未覆盖 `generic`/`codex` 宿主，导致 MF-2 在测试中未被发现 | 测试完备性 | ⏳ 待补充 |

---

### OUT_OF_SCOPE（范围外记录）

| # | 问题摘要 |
|---|---------|
| OOS-1 | `hasRequiredCodexMcpBaseline` 使用字符串 `includes` 而非 TOML 解析器，注释中包含 `[mcp_servers.xxx]` 时存在假阳性风险；属于历史技术债，非本次引入 |
| OOS-2 | `session-hook.ts`、`ai-runtime-hook.ts` 体量较大，与工具集成核心边界有距离，建议单独审查 |
| OOS-3 | `install-plan.ts` 对非法 `component` 的静默忽略；调用方 `update.ts` 已有 CLI 层校验兜底，非本模块问题 |
