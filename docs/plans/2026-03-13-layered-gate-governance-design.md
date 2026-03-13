# 分层治理方案设计文档

## 1. 背景与问题

当前 Gate 流程存在三类结构性问题，导致流程无法稳定、顺畅地走完：

1. `strict` 语义不一致
`getConditions()` 会把 warning 条件升级为 blocking，但 `evaluateGate()` 又对部分条件进行硬编码降级，导致同一条件在“定义层”和“执行层”语义冲突。

2. 豁免机制与用户心智不一致
用户直觉会为 Gate 失败写单独 waiver 文件，但当前实现只识别 `known-exceptions.md`，且必须绑定 approved RFC。结果是“环境问题”与“治理问题”被迫共用一套高成本豁免通道。

3. Gate 条件缺乏分类
测试覆盖率、规范质量、平台工具缺失、宿主环境依赖缺失，目前都被压平为同一种失败，只靠 `blocking` 布尔值区分，无法表达“必须阻断”和“记录欠账但可推进”的差异。

结果是：

- 真正该阻断的问题与不该阻断的问题混在一起
- 流程推进依赖人工猜测系统意图
- AI 和用户都容易走向“改测试迎合实现”或“手工绕过 Gate”的错误路径

## 2. 设计目标

本方案目标不是放松治理，而是让治理语义稳定、可解释、可推进。

具体目标：

1. 让 `strict` 成为一致、可预测的策略层规则
2. 让 Gate 条件具备明确分类，不再仅靠 `blocking` 表达全部语义
3. 让“治理问题”和“环境问题”走不同处理通道
4. 让流程在遇到环境欠账时仍可顺畅推进
5. 让 CLI 输出直接回答用户最关心的问题：
   - 能不能继续推进
   - 为什么不能推进
   - 哪些只是环境欠账
   - 哪些需要正式豁免

## 3. 总体方案

采用“分层治理 + 双通道豁免 + 四态结果”的方案。

### 3.1 三层语义模型

将 Gate 判定拆成三层：

1. Policy Layer
负责 profile 规则，例如 `default-simplified` 与 `strict`。

2. Condition Layer
每个 Gate 条件声明自己的类别与严重级别。

3. Resolution Layer
根据 profile、condition category、severity、waiver 状态，统一计算最终结果。

## 4. 核心设计

### 4.1 条件分类模型

每个 Gate 条件新增两个维度：

- `category`
- `severity`

定义如下：

```ts
type GateCategory = 'governance' | 'environment' | 'advisory';
type GateSeverity = 'error' | 'warning';
```

语义说明：

- `governance`
  表示流程治理、质量约束、追溯完整性、设计/测试质量等问题。
  这类问题会影响交付可信度，应进入正式治理通道。

- `environment`
  表示宿主环境、平台工具、外部依赖、执行上下文不具备等问题。
  这类问题通常不代表 Feature 本身实现错误，不应默认阻断阶段推进。

- `advisory`
  表示提示性、建议性信息，只影响可见性，不影响推进。
  这类条件原则上不参与失败聚合。

### 4.2 条件映射规则

现有条件建议这样归类：

- `G-SPEC-00`: `governance + warning`
- `G-SPEC-01`: `governance + error`
- `G-SPEC-02`: `governance + error`
- `G-SPEC-03`: `governance + warning`
- `G-DESIGN-01`: `governance + error`
- `G-DESIGN-03`: `governance + warning`
- `G-PLAN-01`: `governance + error`
- `G-PLAN-02`: `governance + error`
- `G-PLAN-03`: `governance + error`
- `G-IMPL-01`: `governance + error`
- `G-VERIFY-01`: `governance + error`
- `G-VERIFY-03`: `governance + error`

未来凡是“工具缺失 / 平台命令不可用 / 宿主环境缺依赖 / 当前 Feature 不适用该平台检查”的条件，统一归入：

- `environment + warning`
或
- `environment + error`

但即便是 `environment + error`，默认也不进入“阻断推进”通道，而是进入“环境欠账通道”。

## 5. strict 策略重定义

### 5.1 新定义

`strict` 不再直接篡改 condition 的原始含义，而只影响“治理类 warning 的最终阻断性”。

规则如下：

- `governance + error`
  永远 blocking

- `governance + warning`
  在 `default-simplified` 下 non-blocking
  在 `strict` 下 blocking

- `environment + warning`
  永远 non-blocking

- `environment + error`
  默认 non-blocking，但会进入 `PASS_WITH_ENV_ISSUES`

- `advisory`
  永远 non-blocking

### 5.2 关键约束

必须删除当前 evaluator 中对 `G-SPEC-00 / G-SPEC-03 / G-DESIGN-03` 的硬编码 special-case。
原因是 special-case 会破坏 profile 层的统一规则，继续制造语义冲突。

也就是说：

- 条件定义层负责声明 `category + severity`
- profile 层负责计算是否升级治理 warning
- evaluator 只能统一计算，不允许写死某些 ID 的例外逻辑

## 6. 最终结果模型

### 6.1 新状态枚举

现有三态不足以表达环境问题，建议扩展为四态：

```ts
type GateStatus =
  | 'PASS'
  | 'PASS_WITH_WAIVER'
  | 'PASS_WITH_ENV_ISSUES'
  | 'FAIL';
```

### 6.2 判定规则

按优先级聚合：

1. 如果存在未被覆盖的 blocking governance failure
结果为 `FAIL`

2. 否则，如果存在 governance failure 且全部被正式 waiver 覆盖
结果为 `PASS_WITH_WAIVER`

3. 否则，如果不存在 blocking governance failure，但存在 environment failure
结果为 `PASS_WITH_ENV_ISSUES`

4. 其他情况
结果为 `PASS`

### 6.3 状态语义

- `PASS`
  可推进，无遗留治理或环境问题

- `PASS_WITH_WAIVER`
  可推进，但存在正式治理豁免，需留痕审计

- `PASS_WITH_ENV_ISSUES`
  可推进，但存在环境欠账，需后续补齐

- `FAIL`
  不可推进，存在真实阻断项

## 7. 豁免机制重构

### 7.1 保留治理豁免通道

现有 `known-exceptions.md` 继续保留，用于 `governance` 类失败的正式豁免。

校验规则保持严格：

- 必须存在关联 RFC
- RFC 必须为 `approved`
- 必须有 `expiresAt`
- 必须未过期
- 必须有 `rollbackPoint`

该通道用于：

- 测试覆盖率临时不足
- 设计质量项暂缓修复
- 明确接受某项治理风险

### 7.2 新增环境豁免通道

新增文件：

```text
specs/<featureId>/known-env-issues.md
```

用于记录环境类失败，不绑定 RFC。

建议表结构：

| ID | Condition | Scope | Reason | ExpiresAt | ApprovedBy |
|----|-----------|-------|--------|-----------|------------|

字段说明：

- `ID`
  环境问题记录 ID，例如 `ENV-001`

- `Condition`
  对应 Gate 条件 ID，例如 `G-IMPL-PLATFORM-01`

- `Scope`
  影响范围，可写平台、工具或 Feature 内局部范围

- `Reason`
  为什么当前环境不可满足

- `ExpiresAt`
  到期时间，避免永久悬挂

- `ApprovedBy`
  责任人或批准人

### 7.3 环境豁免校验规则

环境 issue 的校验仅要求：

- `Condition` 非空
- `Reason` 非空
- `ExpiresAt` 存在且未过期

不要求：

- RFC
- rollback point
- FR 精确映射

原因很简单：环境问题是“可推进但有欠账”，不是“正式偏离功能治理”。

### 7.4 适用范围

治理豁免与环境豁免不能混用：

- `governance` 失败只能使用 `known-exceptions.md`
- `environment` 失败只能使用 `known-env-issues.md`

这样可以避免“用轻量 env issue 绕过治理约束”。

## 8. 数据结构设计

### 8.1 Condition Definition

```ts
interface GateConditionDef {
  id: string;
  description: string;
  category: GateCategory;
  severity: GateSeverity;
  evaluate: (ctx: EvalContext) => {
    pass: boolean;
    detail?: string;
    scopeFrIds?: string[];
  };
}
```

### 8.2 Condition Result

```ts
interface ConditionResult {
  id: string;
  description: string;
  category: GateCategory;
  severity: GateSeverity;
  status: 'PASS' | 'FAIL' | 'WAIVER' | 'ENV_ISSUE';
  detail?: string;
  scopeFrIds?: string[];
  blocking: boolean;
}
```

说明：

- `WAIVER`
  仅用于治理类失败被正式 exception 覆盖

- `ENV_ISSUE`
  用于环境类失败已登记或已识别，不作为阻断

### 8.3 Gate Result

```ts
interface GateResult {
  status: GateStatus;
  stage: Stage;
  timestamp: string;
  conditions: ConditionResult[];
  waivers?: WaiverRef[];
  envIssues?: EnvIssueRef[];
  suggestions?: string[];
}
```

## 9. 执行逻辑设计

### 9.1 统一决策函数

新增统一函数，例如：

```ts
resolveConditionDisposition(def, result, profile)
```

职责：

1. 读取 condition 原始 `category + severity`
2. 根据 profile 计算 effective severity
3. 根据 category 计算 final blocking
4. 决定该失败是否可进入 governance waiver 或 env issue 通道

输出可以是：

```ts
{
  category,
  severity,
  blocking,
  resolution: 'none' | 'governance-waiver' | 'env-issue'
}
```

### 9.2 evaluator 执行顺序

1. 读取条件定义
2. 执行 `evaluate(ctx)`
3. 通过统一决策函数得到最终 disposition
4. 生成 `ConditionResult`
5. 对 governance blocking failures 尝试匹配 `known-exceptions.md`
6. 对 environment failures 尝试匹配 `known-env-issues.md`
7. 统一聚合 GateResult
8. 输出状态与建议

### 9.3 重要原则

以后 evaluator 中不允许再出现这种逻辑：

- “某几个 Gate ID 永远 warning-only”
- “某几个 Gate ID 永远 blocking”
- “strict 下先升级，后面再按 ID 降级”

所有规则必须收敛到 `category + severity + profile + resolution policy` 四元组合中。

## 10. CLI 设计

### 10.1 输出目标

CLI 必须一眼说明三件事：

1. 是否允许推进
2. 阻断原因是什么
3. 是否存在环境欠账或治理豁免

### 10.2 展示结构

建议按分组输出：

- Blocking governance failures
- Governance waivers
- Environment issues
- Advisory warnings
- Passed checks

例如：

```text
Gate 检查 — FSREQ-xxxx (04_implement)

结果：PASS_WITH_ENV_ISSUES

  [OK]    Spec exists
  [OK]    Matrix FR assigned

  [ENV]   Android lint unavailable
          ktlint not installed in current host
          registered in known-env-issues.md (ENV-001)

  [ENV]   iOS lint unavailable
          swiftlint not installed in current host
          registered in known-env-issues.md (ENV-002)
```

若有阻断项：

```text
结果：FAIL

  [FAIL]  Unit test coverage (C4) ≥ 60%
          C4=0.0% uncovered FR: FR-UIOPT-001, FR-UIOPT-002, FR-UIOPT-003

  [ENV]   SwiftLint unavailable
          host tool missing, not blocking stage advance by itself
```

### 10.3 CLI 语义要求

- `[FAIL]` 只用于真正阻断推进的治理问题
- 环境问题不要再打印成普通 `FAIL`
- 环境问题统一显示为 `[ENV]`
- 治理豁免显示为 `[WAIVER]`
- advisory 显示为 `[WARN]`

否则用户仍会误读。

## 11. 对当前问题的直接收益

### 11.1 strict 语义恢复一致

改造后：

- `G-SPEC-00 / G-SPEC-03 / G-DESIGN-03`
  在 `default-simplified` 下是 warning
  在 `strict` 下变成 blocking governance warning

测试语义将稳定，不会再出现：

- 条件定义说 strict 应升级
- evaluator 又偷偷降回 warning

### 11.2 UI/前端类 Feature 可以顺畅推进

当前前端 Feature 经常受非适用平台工具影响，例如：

- `ktlint`
- `swiftlint`
- Android/iOS 特定校验

这些问题在分层治理后会进入 `environment` 通道，不会误阻断当前 H5/UI Feature 的推进。

### 11.3 C4 等真实质量问题仍保持严格治理

例如：

- 前端 Feature 没有任何 FR 对应测试覆盖
- `G-IMPL-01` 失败

这仍然是 `governance + error`，不会被 env issue 吞掉。
系统仍会明确返回 `FAIL`，迫使团队做真正的治理选择：

- 补测试
- 或走 RFC + known-exceptions.md 正式豁免

这满足“顺畅走完流程”与“保持治理下限”之间的平衡。

## 12. 非目标

本次方案不解决以下问题：

1. 不做历史兼容
直接允许新的 GateResult 结构替换旧结构。

2. 不做自动迁移脚本
旧 `gate-history.jsonl`、旧状态记录无需兼容。

3. 不在本轮引入更复杂的 `severity matrix`
不扩展到 `critical/high/medium/low`，保持 `error/warning` 即可。

4. 不统一所有外部命令 Gate 的语义模型
只先收敛本仓库已存在 Gate 机制的核心判定。

## 13. 具体改造范围

### 13.1 必改文件

- `src/core/gate-engine/condition-registry.ts`
- `src/core/gate-engine/gate-evaluator.ts`
- `src/core/trace-engine/exception-validator.ts`
- `src/cli/commands/gate.ts`
- `src/shared/types.ts`

### 13.2 新增文件

- `src/core/trace-engine/env-issue-validator.ts`

### 13.3 新增产物格式

- `specs/<featureId>/known-env-issues.md`

## 14. 测试策略

### 14.1 单元测试

重点新增以下用例：

1. `strict` 下 governance warning 升级为 blocking
2. `default-simplified` 下 governance warning 保持 non-blocking
3. environment failure 不阻断 Gate
4. environment failure 触发 `PASS_WITH_ENV_ISSUES`
5. governance failure + valid exception => `PASS_WITH_WAIVER`
6. governance failure + invalid exception => `FAIL`
7. environment issue 过期时不生效
8. CLI 输出正确分组 `[FAIL]/[WAIVER]/[ENV]/[WARN]`

### 14.2 回归测试

至少覆盖：

- `gate-evaluator.test.ts`
- `gate-command.test.ts` 或 CLI 对应测试
- exception validator 测试
- env issue validator 测试

### 14.3 验收标准

以下情况必须成立：

1. `strict` 下 `G-SPEC-03` 失败时，Gate 为 `FAIL`
2. `default-simplified` 下 `G-SPEC-03` 失败时，Gate 为 `PASS`
3. 只有环境问题失败时，Gate 为 `PASS_WITH_ENV_ISSUES`
4. C4 不足时，Gate 仍为 `FAIL`
5. 有 approved RFC 的 governance exception 可将对应阻断项转为 `WAIVER`
6. `known-env-issues.md` 不可用于治理类失败

## 15. 推荐实施顺序

### Phase 1：修正核心语义

1. 给 Gate 条件补 `category + severity`
2. 删除 evaluator 中 warning-only 的 ID 硬编码
3. 引入统一 disposition 计算函数
4. 修复 strict 相关单测

### Phase 2：引入环境通道

1. 新增 `known-env-issues.md`
2. 实现 env issue validator
3. evaluator 接入 environment resolution
4. GateResult 增加 `PASS_WITH_ENV_ISSUES`

### Phase 3：CLI 可解释化

1. Gate CLI 分组输出
2. 新增 `[ENV]`、`[WAIVER]` 展示
3. 调整退出码与提示文案

## 16. 最终结论

本方案的核心不是“放宽 Gate”，而是把 Gate 从“单一 blocking 布尔判断”升级为“有类别、有策略、有分流”的治理模型。

改造完成后：

- `strict` 语义一致
- warning 升级逻辑统一
- 环境问题不再误阻断流程
- 真实治理问题仍保持强约束
- 用户可以清楚地区分“必须修”、“可以豁免”、“可推进但有环境欠账”

这能让流程真正顺畅走完，同时避免靠改测试、改文档、手工绕过来维持表面通过。
