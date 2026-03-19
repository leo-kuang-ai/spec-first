# P0 Governance Hardening Design

**Date:** 2026-03-06

## Goal

在不考虑向下兼容的前提下，收紧 `spec-first` 的流程治理与数据语义，消除“可绕过 Gate 完成流程”“Skill 仅文本阻断”“矩阵状态多套语义”这三类 P0 风险。

## Scope

本轮只做 P0：

1. 移除 `stage advance --force` 的推进能力
2. 将 hard-gate 从提示注入改为真实阻断
3. 统一追踪矩阵状态语义，删除 `done` 兼容并对非法状态 fail-fast

不纳入本轮：

- 平台 capability check
- override/waiver 新审计模型
- 运行态自愈工具

## Approach Options

### Option A: 渐进兼容

- 保留 `--force` 但限制到早期阶段
- 保留 hard-gate notice，同时在部分场景抛错
- 保留 `done` 兼容，增加 warning

问题：

- 继续保留双语义与逃生通道
- 系统仍需维护旧路径
- 开发阶段没有必要承受这类复杂度

### Option B: 严格清理

- CLI 不再接受 `stage advance --force`
- hard-gate 在 `BLOCKED` 时直接中止 `loadSkill`
- 矩阵状态严格校验，只允许 canonical 枚举

优点：

- 规则单一，行为可预测
- prompt 文本与 runtime 行为一致
- 失败尽早暴露，不再靠运行时“猜测兼容”

**Recommendation:** 采用 Option B。

## Detailed Design

### 1. Stage Advance

- 删除 `AdvanceOptions.force`
- `handleStage(['advance', ...])` 不再识别 `--force`
- `advance()` 只允许：
  - 依赖检查通过
  - Gate 通过，或 `pilot_mode` 明确允许 Gate 不可用时的降级
- 所有引用 `FORCE_SKIPPED` 的测试与文档同步移除

### 2. Hard Gate

- 保留 `evaluateSkillHardGate()` 作为判定核心
- `buildHardGateRuntimeNotice()` 改名并保留“说明生成”职责
- `loadSkill()` 在 hard-gate 为 `BLOCKED` 时直接抛出错误；`WARN/PASS` 才注入 notice
- stage requirements 扩展到关键 Skill：
  - `design -> 02_design`
  - `code -> 04_implement`
  - `code-review -> 04_implement`
  - `verify -> 05_verify`
  - `archive -> 06_wrap_up`

### 3. Matrix Status

- `parseMatrix()` 增加严格状态枚举校验
- 非法状态直接抛错，提示具体 ID 与非法值
- `G-WRAP-02` 终态集合只允许：
  - `Accepted`
  - `Cancelled`
  - `Exception`

## Testing Strategy

先 RED，再 GREEN：

1. `advance.test.ts`
   - 旧的 `--force` 推进测试改为“禁止 force/不支持 force”
   - 保证终态只能通过正常 Gate 路径
2. `cli-init-stage.test.ts`
   - `stage advance --force` 返回校验错误
3. `skill-runtime.test.ts` / `hard-gate.test.ts`
   - 缺前置条件时 `loadSkill()` 直接抛错，而不是仅返回 BLOCKED 文本
   - `code-review` 错阶段时也阻断
4. `matrix.test.ts` / `gate-evaluator.test.ts`
   - 非法状态 `done` 解析失败
   - `06_wrap_up` 只接受 canonical terminal statuses

## Risks

- 现有依赖 `--force` 的测试会全部失效，需要成套更新
- 某些本地手工流程会从“继续工作”变为“立即失败”，但这正是目标
- 若仓库内已有非法矩阵状态，相关测试夹具与文档示例要同步清理

## Success Criteria

- 无法再通过 CLI 或核心 API 使用 `--force` 推进阶段
- hard-gate 的 `BLOCKED` 在 runtime 层真实阻断
- 矩阵状态不存在 `done` 等 undocumented 值
- 聚焦单测全部通过
