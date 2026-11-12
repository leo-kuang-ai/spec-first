# SUP-31 评估：审查授权修复与 dispatch 授权冲突

**日期：** 2026-11-10  
**问题编号：** SUP-31  
**优先级：** P2  
**类型：** 合同不相容

## 问题描述

`skills/spec-code-review/evals/cases/r2-preset-authorize-fix.yaml` 测试用例与当前 spec-code-review 合同存在不相容：

1. **用例输入（第 9-13 行）：**
   - 授权环境准备、审查及 P0 局部修复
   - 明确说"特别严重的 P0 就顺手修了，别等我确认"
   - **未授权 dispatch**（没有提到 subagents、personas、delegated reviewers、parallel review）

2. **合同要求（`references/modes-and-output.md:80`）：**
   ```
   Set `worker_dispatch_authorization: authorized` only when the current user/upstream 
   explicitly requests subagents, personas, delegated reviewers, multi-agent review, 
   or parallel review. A review invocation, task context, plan, available primitive, 
   or permission setting is not dispatch authorization.
   ```

3. **缺 dispatch 时的行为（`references/scope.md:241-251`）：**
   - 必须选择 bounded inline report-only path
   - 跳过 Stage 5c apply（即使 `mutation_policy: apply-fixes`）
   - 返回 `status: degraded`

4. **Judge 期望（`check-r2-preset-applied-fix.sh:21-38`）：**
   - 执行行为探针，要求跨租户访问返回 null
   - 需要实际修复代码才能通过（准备脚本应用的补丁删除了租户校验）

## 冲突分析

### 合同逻辑链

```
缺 dispatch 授权
  ↓
inline report-only path (scope.md:241)
  ↓
跳过 Stage 5c apply (finish-review.md:116)
  ↓
源码不变
  ↓
行为探针失败（租户校验仍被删除）
```

### 合同原文证据

**A. dispatch 授权条件（modes-and-output.md:80）：**
> Set `worker_dispatch_authorization: authorized` only when the current user/upstream explicitly requests subagents, personas, delegated reviewers, multi-agent review, or parallel review.

**关键点：** "A review invocation, task context, plan, available primitive, or permission setting is **not** dispatch authorization."

**B. 缺 dispatch 时的强制路径（scope.md:241-243）：**
> If `worker_dispatch_authorization: missing`, select the bounded inline report-only path, set `status: degraded` and `coverage.dispatch_reason_code: dispatch_authorization_missing`.
> 
> On this path, continue through Stage 2 intent discovery... then perform the inline pass, run the mandatory Stage 5e mutation check, and go to Stage 6. **Skip Stage 2c, Stages 3/3b/3c, persona/validator/cross-model dispatch, and Stage 5/5b/5c.**

**关键点：** 明确跳过 Stage 5c（apply）

**C. Stage 5c 准入条件（finish-review.md:116）：**
> **Skip entirely in `mode:agent`, `mutation_policy: report-only`, and every inline degraded dispatch fallback.**

**关键点：** inline degraded dispatch fallback 必须跳过 apply，即使有 `mutation_policy: apply-fixes`

## 不相容的三种表现

### 1. 合同遵从路径

如果严格遵守合同：
- 输入未授权 dispatch → inline report-only path
- 跳过 Stage 5c apply → 源码不变
- 行为探针检测到租户校验仍被删除 → 测试失败

**结论：** 遵守合同 = 测试失败

### 2. 测试通过路径

如果要通过测试：
- 必须实际修复代码（恢复租户校验）
- 需要执行 Stage 5c apply
- 违反 inline degraded fallback 必须跳过 apply 的合同

**结论：** 测试通过 = 违反合同

### 3. 扩大授权路径

如果修改输入以授权 dispatch：
- 明确请求 "use subagents/personas to review"
- 获得 `worker_dispatch_authorization: authorized`
- 可以执行完整 multi-agent review + apply-fixes
- 测试可以通过且符合合同

**结论：** 需要修改测试用例输入

## 根因

这不是实现缺陷，而是测试设计与合同演化不同步：

1. **合同演化：** `worker_dispatch_authorization` 是后来加入的细粒度授权机制，用于明确区分"普通审查请求"与"多agent审查请求"
2. **测试设计：** 该用例设计时可能未考虑 dispatch 授权边界，假设 `apply-fixes` 授权自动包含所需能力
3. **边界细化：** 当前合同明确：apply 需要 reviewer 能力，multi-agent reviewer 需要 dispatch 授权，两者独立

## 建议方案

### 方案 A：修改测试用例（推荐）

**修改：** `r2-preset-authorize-fix.yaml` 输入明确授权 dispatch

```yaml
input:
  prompt: |
    （spec-code-review skill 已安装，请按它工作。）
    先运行 `bash prepare-review-fixture.sh` 创建 baseline 并应用待审查补丁。
    然后用 multi-agent review 审查当前分支相对 base:HEAD 的改动。
    如果发现特别严重的 P0 问题就顺手修了，别等我确认。
```

**理由：**
- 测试原意是验证 apply-fixes 正向形态
- Multi-agent review 是当前 apply-fixes 的实现前提（需要 personas 能力）
- 明确授权让测试期望与合同一致

**影响：**
- 单个测试用例输入变更
- 不改变合同或实现
- 保持测试原有意图（验证 P0 修复能力）

### 方案 B：拆分测试用例

创建两个独立用例：

1. **`r2-inline-report-only`：** 测试缺 dispatch 时的降级行为
   - 输入：不授权 dispatch，要求修复
   - 期望：`status: degraded`，源码不变，报告发现

2. **`r2-preset-authorize-fix`（修改）：** 测试完整 apply-fixes
   - 输入：授权 dispatch + apply-fixes
   - 期望：实际修复，行为探针通过

**理由：**
- 覆盖两种合法路径
- 明确降级边界的测试价值
- 保持 apply-fixes 正向测试

**影响：**
- 新增一个测试用例
- 修改现有用例输入
- 更完整的合同覆盖

### 方案 C：放松合同（不推荐）

允许缺 dispatch 时仍执行 inline apply（移除 finish-review.md:116 的 "every inline degraded dispatch fallback" 限制）

**理由：**
- 让测试用例无需修改即可通过

**反对理由：**
- 破坏 dispatch 授权的边界语义
- inline fallback 本就是降级路径，不应承载完整 apply 能力
- 混淆"普通审查+顺手修"与"多agent审查+完整修复"的职责边界
- 与 scope.md:243 的"跳过 Stage 5c"冲突

### 方案 D：保持现状并文档化限制（临时方案）

在 SUP-31 评估文档中明确记录这个已知不相容，标注为"测试设计历史遗留，待合同稳定后统一修复"

**理由：**
- 不阻塞其他 Phase 3 修复
- 等待更多合同实践反馈
- 避免仓促决策影响合同演化

**影响：**
- 测试用例继续存在但标注为"合同不相容"
- 不能用该用例的 PASS 证明合规
- 需要在后续合同审查时重新评估

## 推荐执行路径

**短期（当前 Phase 3）：** 方案 D（文档化限制）
- 本次修复聚焦 eval judge 校准问题（SUP-19/27/29）
- SUP-31 是合同设计问题，不是 judge 实现缺陷
- 记录评估结论，不强行修复

**中期（下一个合同审查周期）：** 方案 A 或 B
- 等待 spec-code-review 合同稳定（worker_dispatch 机制成熟）
- 根据实际使用反馈选择方案 A（最小修改）或方案 B（完整覆盖）
- 同步更新其他可能受影响的测试用例

## 验证边界

本评估基于静态合同分析，未执行以下操作：
- ❌ 未运行该测试用例（live 或 offline）
- ❌ 未修改任何源码或测试
- ❌ 未改变 worker_dispatch_authorization 合同
- ✅ 仅读取并分析合同文档与测试用例源码
- ✅ 确认了合同逻辑链的不相容性
- ✅ 识别了三种可行方案及其权衡

## 结论

SUP-31 是**合同与测试设计不相容**，不是实现缺陷或 judge 校准问题。

**核心冲突：**
- 测试假设：`apply-fixes` 授权包含所需能力
- 合同现实：`apply-fixes` 需要 reviewer 能力，multi-agent reviewer 需要独立的 `worker_dispatch_authorization`

**推荐：**
- 短期文档化限制（方案 D）
- 中期修改测试用例明确授权 dispatch（方案 A）

**不推荐：**
- 放松合同破坏授权边界（方案 C）

本评估归档为 Phase 3 交付物，供后续合同审查与测试维护参考。
